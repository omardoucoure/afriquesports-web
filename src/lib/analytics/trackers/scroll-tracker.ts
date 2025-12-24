/**
 * Scroll depth tracker
 *
 * Automatically tracks scroll depth milestones: 25%, 50%, 75%, 100%
 * Debounced to avoid excessive events
 */

import { AnalyticsManager } from '../manager'
import { AnalyticsEventName } from '../events'
import type { EngagementScrollDepthEvent } from '../events'
import { debounce } from '../utils/queue'

export class ScrollTracker {
  private manager: AnalyticsManager
  private milestones: Set<number> = new Set([25, 50, 75, 100])
  private trackedMilestones: Set<number> = new Set()
  private isActive: boolean = false
  private handleScrollDebounced: () => void

  constructor(manager: AnalyticsManager) {
    this.manager = manager
    this.handleScrollDebounced = debounce(this.handleScroll.bind(this), 300)
  }

  /**
   * Start tracking scroll depth
   */
  start(): void {
    if (this.isActive || typeof window === 'undefined') {
      return
    }

    this.isActive = true
    this.trackedMilestones.clear()

    window.addEventListener('scroll', this.handleScrollDebounced, { passive: true })

    this.log('Scroll tracking started')
  }

  /**
   * Stop tracking scroll depth
   */
  stop(): void {
    if (!this.isActive || typeof window === 'undefined') {
      return
    }

    this.isActive = false

    window.removeEventListener('scroll', this.handleScrollDebounced)

    this.log('Scroll tracking stopped')
  }

  /**
   * Reset tracked milestones (for new page)
   */
  reset(): void {
    this.trackedMilestones.clear()
    this.log('Scroll tracking reset')
  }

  /**
   * Handle scroll event
   */
  private handleScroll(): void {
    const scrollPercentage = this.calculateScrollPercentage()
    const pageHeight = this.getPageHeight()
    const maxScroll = window.scrollY + window.innerHeight

    // Check each milestone
    this.milestones.forEach(milestone => {
      if (scrollPercentage >= milestone && !this.trackedMilestones.has(milestone)) {
        this.trackMilestone(milestone, maxScroll, pageHeight)
        this.trackedMilestones.add(milestone)
      }
    })
  }

  /**
   * Track a scroll milestone
   */
  private trackMilestone(percentage: number, maxScroll: number, pageHeight: number): void {
    const properties: Partial<EngagementScrollDepthEvent> = {
      depth_percentage: percentage as 25 | 50 | 75 | 100,
      max_scroll_pixels: Math.round(maxScroll),
      page_height_pixels: Math.round(pageHeight),
    }

    this.manager.track(AnalyticsEventName.ENGAGEMENT_SCROLL_DEPTH, properties)

    this.log('Scroll milestone tracked:', percentage + '%')
  }

  /**
   * Calculate current scroll percentage
   */
  private calculateScrollPercentage(): number {
    if (typeof window === 'undefined') {
      return 0
    }

    const windowHeight = window.innerHeight
    const documentHeight = this.getPageHeight()
    const scrollTop = window.scrollY

    // Avoid division by zero
    if (documentHeight <= windowHeight) {
      return 100
    }

    const scrollableHeight = documentHeight - windowHeight
    const percentage = (scrollTop / scrollableHeight) * 100

    return Math.min(100, Math.max(0, percentage))
  }

  /**
   * Get total page height
   */
  private getPageHeight(): number {
    if (typeof document === 'undefined') {
      return 0
    }

    return Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    )
  }

  /**
   * Get currently tracked milestones
   */
  getTrackedMilestones(): number[] {
    return Array.from(this.trackedMilestones)
  }

  /**
   * Log to console
   */
  private log(message: string, ...args: any[]): void {
    if (process.env.NODE_ENV === 'development') {
      console.log('[ScrollTracker]', message, ...args)
    }
  }
}
