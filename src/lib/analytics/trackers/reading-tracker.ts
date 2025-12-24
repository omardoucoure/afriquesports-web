/**
 * Reading progress tracker
 *
 * Tracks article reading behavior:
 * - Read start (3s dwell time)
 * - Reading progress (25%, 50%, 75%, 100%)
 * - Time spent reading
 * - Read completion (80%+ scroll)
 */

import { AnalyticsManager } from '../manager'
import { AnalyticsEventName } from '../events'
import type {
  ArticleReadStartEvent,
  ArticleReadProgressEvent,
  ArticleTimeSpentEvent,
} from '../events'
import { debounce } from '../utils/queue'

export interface ReadingTrackerConfig {
  articleId: string
  articleTitle: string
  articleCategory?: string
  contentElement?: HTMLElement | null
}

export class ReadingTracker {
  private manager: AnalyticsManager
  private config: ReadingTrackerConfig
  private milestones: Set<number> = new Set([25, 50, 75, 100])
  private trackedMilestones: Set<number> = new Set()
  private isActive: boolean = false
  private startTime: number = 0
  private hasTrackedReadStart: boolean = false
  private readStartTimer: NodeJS.Timeout | null = null
  private handleScrollDebounced: () => void

  private readonly READ_START_DELAY_MS = 3000 // 3 seconds

  constructor(manager: AnalyticsManager, config: ReadingTrackerConfig) {
    this.manager = manager
    this.config = config
    this.handleScrollDebounced = debounce(this.handleScroll.bind(this), 300)
  }

  /**
   * Start tracking reading progress
   */
  start(): void {
    if (this.isActive || typeof window === 'undefined') {
      return
    }

    this.isActive = true
    this.startTime = Date.now()
    this.trackedMilestones.clear()
    this.hasTrackedReadStart = false

    // Track read start after 3 seconds
    this.scheduleReadStart()

    // Listen for scroll
    window.addEventListener('scroll', this.handleScrollDebounced, { passive: true })

    // Send time spent on page unload
    this.setupUnloadHandler()

    this.log('Reading tracking started for article:', this.config.articleId)
  }

  /**
   * Stop tracking reading progress
   */
  stop(): void {
    if (!this.isActive || typeof window === 'undefined') {
      return
    }

    this.isActive = false

    // Clear read start timer
    if (this.readStartTimer) {
      clearTimeout(this.readStartTimer)
      this.readStartTimer = null
    }

    // Remove scroll listener
    window.removeEventListener('scroll', this.handleScrollDebounced)

    // Send final time spent
    this.sendTimeSpent()

    this.log('Reading tracking stopped')
  }

  /**
   * Schedule read start event
   */
  private scheduleReadStart(): void {
    this.readStartTimer = setTimeout(() => {
      if (this.isActive && !this.hasTrackedReadStart) {
        this.trackReadStart()
        this.hasTrackedReadStart = true
      }
    }, this.READ_START_DELAY_MS)
  }

  /**
   * Track read start event (user engaged with content)
   */
  private trackReadStart(): void {
    const dwellTimeSeconds = Math.floor((Date.now() - this.startTime) / 1000)

    const properties: Partial<ArticleReadStartEvent> = {
      article_id: this.config.articleId,
      article_title: this.config.articleTitle,
      dwell_time_seconds: dwellTimeSeconds,
    }

    this.manager.track(AnalyticsEventName.ARTICLE_READ_START, properties)

    this.log('Read start tracked')
  }

  /**
   * Handle scroll event
   */
  private handleScroll(): void {
    const scrollPercentage = this.calculateScrollPercentage()

    // Check each milestone
    this.milestones.forEach(milestone => {
      if (scrollPercentage >= milestone && !this.trackedMilestones.has(milestone)) {
        this.trackReadProgress(milestone)
        this.trackedMilestones.add(milestone)
      }
    })
  }

  /**
   * Track reading progress milestone
   */
  private trackReadProgress(percentage: number): void {
    const timeSpentSeconds = Math.floor((Date.now() - this.startTime) / 1000)

    const properties: Partial<ArticleReadProgressEvent> = {
      article_id: this.config.articleId,
      article_title: this.config.articleTitle,
      progress_percentage: percentage as 25 | 50 | 75 | 100,
      time_spent_seconds: timeSpentSeconds,
    }

    // Use specific event name for each milestone
    const eventName = `Article_Read_Progress_${percentage}` as AnalyticsEventName

    this.manager.track(eventName, properties)

    this.log('Reading progress tracked:', percentage + '%')
  }

  /**
   * Setup page unload handler to send time spent
   */
  private setupUnloadHandler(): void {
    if (typeof window === 'undefined') {
      return
    }

    const handleUnload = () => {
      this.sendTimeSpent()
    }

    window.addEventListener('beforeunload', handleUnload)
    window.addEventListener('pagehide', handleUnload)
  }

  /**
   * Send total time spent reading
   */
  private sendTimeSpent(): void {
    const totalTimeSeconds = Math.floor((Date.now() - this.startTime) / 1000)
    const scrollDepth = this.calculateScrollPercentage()

    // Only send if user spent at least 5 seconds
    if (totalTimeSeconds < 5) {
      return
    }

    const properties: Partial<ArticleTimeSpentEvent> = {
      article_id: this.config.articleId,
      article_title: this.config.articleTitle,
      total_time_seconds: totalTimeSeconds,
      active_time_seconds: totalTimeSeconds, // TODO: Track actual active time
      scroll_depth_percentage: Math.round(scrollDepth),
    }

    this.manager.track(AnalyticsEventName.ARTICLE_TIME_SPENT, properties)

    this.log('Time spent tracked:', totalTimeSeconds, 'seconds')
  }

  /**
   * Calculate current scroll percentage
   */
  private calculateScrollPercentage(): number {
    if (typeof window === 'undefined') {
      return 0
    }

    // If content element is provided, calculate percentage within that element
    if (this.config.contentElement) {
      return this.calculateElementScrollPercentage(this.config.contentElement)
    }

    // Otherwise, calculate page scroll percentage
    return this.calculatePageScrollPercentage()
  }

  /**
   * Calculate scroll percentage for specific element
   */
  private calculateElementScrollPercentage(element: HTMLElement): number {
    const rect = element.getBoundingClientRect()
    const elementHeight = element.scrollHeight
    const viewportHeight = window.innerHeight

    // Element is completely above viewport
    if (rect.bottom < 0) {
      return 100
    }

    // Element hasn't entered viewport yet
    if (rect.top > viewportHeight) {
      return 0
    }

    // Calculate visible percentage
    const visibleTop = Math.max(0, -rect.top)
    const percentage = (visibleTop / elementHeight) * 100

    return Math.min(100, Math.max(0, percentage))
  }

  /**
   * Calculate page scroll percentage
   */
  private calculatePageScrollPercentage(): number {
    const windowHeight = window.innerHeight
    const documentHeight = this.getPageHeight()
    const scrollTop = window.scrollY

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
   * Get time spent so far (in seconds)
   */
  getTimeSpent(): number {
    return Math.floor((Date.now() - this.startTime) / 1000)
  }

  /**
   * Log to console
   */
  private log(message: string, ...args: any[]): void {
    if (process.env.NODE_ENV === 'development') {
      console.log('[ReadingTracker]', message, ...args)
    }
  }
}
