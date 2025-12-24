/**
 * Event batching queue for performance optimization
 *
 * Batches events and flushes:
 * - Every 5 seconds (time-based)
 * - When queue reaches 10 events (size-based)
 * - On page unload (critical events)
 */

import type { EventProperties } from '../events'

export interface QueuedEvent {
  eventName: string
  properties: Partial<EventProperties>
  timestamp: number
}

export type FlushCallback = (events: QueuedEvent[]) => void

export class EventQueue {
  private queue: QueuedEvent[] = []
  private flushCallbacks: Set<FlushCallback> = new Set()
  private flushInterval: NodeJS.Timeout | null = null
  private isEnabled: boolean = true

  private readonly MAX_QUEUE_SIZE = 10
  private readonly FLUSH_INTERVAL_MS = 5000 // 5 seconds

  constructor() {
    this.startAutoFlush()
    this.setupUnloadHandler()
  }

  /**
   * Add event to queue
   */
  add(eventName: string, properties: Partial<EventProperties>): void {
    if (!this.isEnabled) {
      // If queue is disabled, flush immediately
      this.flushCallbacks.forEach(callback => {
        callback([{ eventName, properties, timestamp: Date.now() }])
      })
      return
    }

    const queuedEvent: QueuedEvent = {
      eventName,
      properties,
      timestamp: Date.now(),
    }

    this.queue.push(queuedEvent)

    // Check if we need to flush based on size
    if (this.queue.length >= this.MAX_QUEUE_SIZE) {
      this.flush()
    }
  }

  /**
   * Flush all queued events
   */
  flush(): void {
    if (this.queue.length === 0) return

    const eventsToFlush = [...this.queue]
    this.queue = []

    // Call all registered flush callbacks
    this.flushCallbacks.forEach(callback => {
      try {
        callback(eventsToFlush)
      } catch (error) {
        console.error('[Analytics] Flush callback error:', error)
      }
    })

    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics] Flushed', eventsToFlush.length, 'events')
    }
  }

  /**
   * Register a flush callback
   */
  onFlush(callback: FlushCallback): () => void {
    this.flushCallbacks.add(callback)

    // Return unsubscribe function
    return () => {
      this.flushCallbacks.delete(callback)
    }
  }

  /**
   * Start automatic flushing
   */
  private startAutoFlush(): void {
    if (typeof window === 'undefined') return

    // Flush every N seconds
    this.flushInterval = setInterval(() => {
      this.flush()
    }, this.FLUSH_INTERVAL_MS)
  }

  /**
   * Stop automatic flushing
   */
  private stopAutoFlush(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
      this.flushInterval = null
    }
  }

  /**
   * Setup page unload handler to flush remaining events
   */
  private setupUnloadHandler(): void {
    if (typeof window === 'undefined') return

    const handleUnload = () => {
      // Flush any remaining events before page unload
      this.flush()
    }

    window.addEventListener('beforeunload', handleUnload)
    window.addEventListener('pagehide', handleUnload)

    // Also flush on visibility change (mobile Safari)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flush()
      }
    })
  }

  /**
   * Get current queue size
   */
  getQueueSize(): number {
    return this.queue.length
  }

  /**
   * Get queued events (for debugging)
   */
  getQueue(): QueuedEvent[] {
    return [...this.queue]
  }

  /**
   * Clear the queue without flushing
   */
  clear(): void {
    this.queue = []
  }

  /**
   * Enable/disable batching
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled

    if (enabled) {
      this.startAutoFlush()
    } else {
      this.stopAutoFlush()
      // Flush any remaining events
      this.flush()
    }
  }

  /**
   * Destroy the queue (cleanup)
   */
  destroy(): void {
    this.stopAutoFlush()
    this.flush()
    this.flushCallbacks.clear()
  }
}

/**
 * Debounce utility for high-frequency events
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle utility for event limiting
 */
export function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}
