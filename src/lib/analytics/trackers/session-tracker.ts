/**
 * Session duration tracker
 *
 * Tracks session duration and sends updates every 30 seconds
 * Sends final session data on page unload
 */

import { AnalyticsManager } from '../manager'
import { SessionManager } from '../utils/session'
import { AnalyticsEventName } from '../events'
import type { EngagementSessionDurationEvent } from '../events'

export class SessionTracker {
  private manager: AnalyticsManager
  private interval: NodeJS.Timeout | null = null
  private isActive: boolean = false
  private activeTime: number = 0
  private lastActiveTime: number = Date.now()
  private isPageVisible: boolean = true

  private readonly UPDATE_INTERVAL_MS = 30000 // 30 seconds

  constructor(manager: AnalyticsManager) {
    this.manager = manager
  }

  /**
   * Start tracking session duration
   */
  start(): void {
    if (this.isActive || typeof window === 'undefined') {
      return
    }

    this.isActive = true
    this.activeTime = 0
    this.lastActiveTime = Date.now()

    // Start periodic updates
    this.startPeriodicUpdates()

    // Listen for page visibility changes
    this.setupVisibilityListener()

    // Send final session data on page unload
    this.setupUnloadHandler()

    this.log('Session tracking started')
  }

  /**
   * Stop tracking session duration
   */
  stop(): void {
    if (!this.isActive) {
      return
    }

    this.isActive = false

    // Stop periodic updates
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }

    // Send final session data
    this.sendSessionData()

    this.log('Session tracking stopped')
  }

  /**
   * Start periodic session updates
   */
  private startPeriodicUpdates(): void {
    this.interval = setInterval(() => {
      this.updateActiveTime()
      this.sendSessionData()
    }, this.UPDATE_INTERVAL_MS)
  }

  /**
   * Setup page visibility listener
   */
  private setupVisibilityListener(): void {
    if (typeof document === 'undefined') {
      return
    }

    const handleVisibilityChange = () => {
      this.isPageVisible = document.visibilityState === 'visible'

      if (this.isPageVisible) {
        // Page became visible, restart active time tracking
        this.lastActiveTime = Date.now()
      } else {
        // Page became hidden, update active time
        this.updateActiveTime()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
  }

  /**
   * Setup page unload handler
   */
  private setupUnloadHandler(): void {
    if (typeof window === 'undefined') {
      return
    }

    const handleUnload = () => {
      this.updateActiveTime()
      this.sendSessionData()
    }

    window.addEventListener('beforeunload', handleUnload)
    window.addEventListener('pagehide', handleUnload)
  }

  /**
   * Update active time (time when page was visible)
   */
  private updateActiveTime(): void {
    if (this.isPageVisible) {
      const now = Date.now()
      const elapsed = now - this.lastActiveTime
      this.activeTime += elapsed
      this.lastActiveTime = now
    }
  }

  /**
   * Send session duration data
   */
  private sendSessionData(): void {
    this.updateActiveTime()

    const sessionDuration = SessionManager.getSessionDuration()
    const pagesViewed = SessionManager.getPageViewCount()
    const activeTimeSeconds = Math.floor(this.activeTime / 1000)

    const properties: Partial<EngagementSessionDurationEvent> = {
      duration_seconds: sessionDuration,
      pages_viewed: pagesViewed,
      active_time_seconds: activeTimeSeconds,
    }

    this.manager.track(AnalyticsEventName.ENGAGEMENT_SESSION_DURATION, properties)

    this.log('Session data sent:', {
      duration: sessionDuration,
      pages: pagesViewed,
      activeTime: activeTimeSeconds,
    })
  }

  /**
   * Get current active time in seconds
   */
  getActiveTime(): number {
    this.updateActiveTime()
    return Math.floor(this.activeTime / 1000)
  }

  /**
   * Log to console
   */
  private log(message: string, ...args: any[]): void {
    if (process.env.NODE_ENV === 'development') {
      console.log('[SessionTracker]', message, ...args)
    }
  }
}
