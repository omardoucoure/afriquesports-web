/**
 * Engagement tracker
 *
 * Tracks user engagement patterns:
 * - Page active time (excluding tab switches)
 * - Rage clicks (multiple rapid clicks)
 * - Dead clicks (clicks on non-interactive elements)
 */

import { AnalyticsManager } from '../manager'
import { AnalyticsEventName } from '../events'
import type {
  EngagementPageActiveTimeEvent,
  EngagementRageClickEvent,
  EngagementDeadClickEvent,
} from '../events'

export class EngagementTracker {
  private manager: AnalyticsManager
  private isActive: boolean = false
  private activeTime: number = 0
  private totalTime: number = 0
  private startTime: number = 0
  private lastActiveTime: number = 0
  private isPageVisible: boolean = true
  private visibilityChangeCount: number = 0

  // Rage click detection
  private clickHistory: Map<string, number[]> = new Map()
  private readonly RAGE_CLICK_THRESHOLD = 3 // clicks
  private readonly RAGE_CLICK_WINDOW_MS = 1000 // 1 second

  constructor(manager: AnalyticsManager) {
    this.manager = manager
  }

  /**
   * Start tracking engagement
   */
  start(): void {
    if (this.isActive || typeof window === 'undefined') {
      return
    }

    this.isActive = true
    this.startTime = Date.now()
    this.lastActiveTime = Date.now()
    this.activeTime = 0
    this.totalTime = 0
    this.visibilityChangeCount = 0

    // Listen for visibility changes
    this.setupVisibilityListener()

    // Listen for clicks (rage and dead click detection)
    this.setupClickListener()

    // Send active time on page unload
    this.setupUnloadHandler()

    this.log('Engagement tracking started')
  }

  /**
   * Stop tracking engagement
   */
  stop(): void {
    if (!this.isActive) {
      return
    }

    this.isActive = false

    // Send final active time
    this.sendActiveTime()

    this.log('Engagement tracking stopped')
  }

  /**
   * Setup page visibility listener
   */
  private setupVisibilityListener(): void {
    if (typeof document === 'undefined') {
      return
    }

    const handleVisibilityChange = () => {
      const nowVisible = document.visibilityState === 'visible'

      if (nowVisible !== this.isPageVisible) {
        this.visibilityChangeCount++
      }

      this.isPageVisible = nowVisible

      if (nowVisible) {
        // Page became visible
        this.lastActiveTime = Date.now()
      } else {
        // Page became hidden
        this.updateActiveTime()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
  }

  /**
   * Setup click listener for rage and dead click detection
   */
  private setupClickListener(): void {
    if (typeof document === 'undefined') {
      return
    }

    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement

      // Track rage clicks
      this.detectRageClick(target)

      // Track dead clicks (clicks on non-interactive elements)
      this.detectDeadClick(target, event)
    })
  }

  /**
   * Detect rage clicks (multiple rapid clicks on same element)
   */
  private detectRageClick(element: HTMLElement): void {
    const selector = this.getElementSelector(element)
    const now = Date.now()

    // Get click history for this element
    const history = this.clickHistory.get(selector) || []

    // Remove old clicks outside the time window
    const recentClicks = history.filter(time => now - time < this.RAGE_CLICK_WINDOW_MS)

    // Add current click
    recentClicks.push(now)

    // Update history
    this.clickHistory.set(selector, recentClicks)

    // Check if threshold reached
    if (recentClicks.length >= this.RAGE_CLICK_THRESHOLD) {
      this.trackRageClick(selector, recentClicks.length)

      // Clear history to avoid duplicate events
      this.clickHistory.delete(selector)
    }
  }

  /**
   * Detect dead clicks (clicks on non-interactive elements)
   */
  private detectDeadClick(element: HTMLElement, event: MouseEvent): void {
    // Check if element is interactive
    const isInteractive = this.isInteractiveElement(element)

    if (!isInteractive && !event.defaultPrevented) {
      const selector = this.getElementSelector(element)
      const text = this.getElementText(element)

      this.trackDeadClick(selector, text)
    }
  }

  /**
   * Check if element is interactive
   */
  private isInteractiveElement(element: HTMLElement): boolean {
    const interactiveTags = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'LABEL']
    const tagName = element.tagName.toUpperCase()

    // Check tag name
    if (interactiveTags.includes(tagName)) {
      return true
    }

    // Check for click handlers
    if (element.onclick || element.hasAttribute('onclick')) {
      return true
    }

    // Check for role
    const role = element.getAttribute('role')
    if (role && ['button', 'link', 'menuitem', 'tab'].includes(role)) {
      return true
    }

    // Check parents (up to 3 levels)
    let parent = element.parentElement
    let depth = 0

    while (parent && depth < 3) {
      if (interactiveTags.includes(parent.tagName.toUpperCase())) {
        return true
      }
      parent = parent.parentElement
      depth++
    }

    return false
  }

  /**
   * Get element selector for tracking
   */
  private getElementSelector(element: HTMLElement): string {
    // Try ID first
    if (element.id) {
      return `#${element.id}`
    }

    // Try classes
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.trim().split(/\s+/).slice(0, 2).join('.')
      if (classes) {
        return `${element.tagName.toLowerCase()}.${classes}`
      }
    }

    // Fallback to tag name
    return element.tagName.toLowerCase()
  }

  /**
   * Get element text content
   */
  private getElementText(element: HTMLElement): string {
    const text = element.textContent?.trim() || ''
    return text.substring(0, 50) // Limit to 50 chars
  }

  /**
   * Track rage click event
   */
  private trackRageClick(selector: string, clickCount: number): void {
    const properties: Partial<EngagementRageClickEvent> = {
      element_selector: selector,
      click_count: clickCount,
      time_window_ms: this.RAGE_CLICK_WINDOW_MS,
    }

    this.manager.track(AnalyticsEventName.ENGAGEMENT_RAGE_CLICK, properties)

    this.log('Rage click detected:', selector, clickCount, 'clicks')
  }

  /**
   * Track dead click event
   */
  private trackDeadClick(selector: string, text: string): void {
    const properties: Partial<EngagementDeadClickEvent> = {
      element_selector: selector,
      element_text: text,
    }

    this.manager.track(AnalyticsEventName.ENGAGEMENT_DEAD_CLICK, properties)

    this.log('Dead click detected:', selector)
  }

  /**
   * Setup page unload handler
   */
  private setupUnloadHandler(): void {
    if (typeof window === 'undefined') {
      return
    }

    const handleUnload = () => {
      this.sendActiveTime()
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

    this.totalTime = Date.now() - this.startTime
  }

  /**
   * Send page active time
   */
  private sendActiveTime(): void {
    this.updateActiveTime()

    const activeTimeSeconds = Math.floor(this.activeTime / 1000)
    const totalTimeSeconds = Math.floor(this.totalTime / 1000)

    // Only send if user spent at least 5 seconds
    if (totalTimeSeconds < 5) {
      return
    }

    const properties: Partial<EngagementPageActiveTimeEvent> = {
      active_time_seconds: activeTimeSeconds,
      total_time_seconds: totalTimeSeconds,
      visibility_changes: this.visibilityChangeCount,
    }

    this.manager.track(AnalyticsEventName.ENGAGEMENT_PAGE_ACTIVE_TIME, properties)

    this.log('Active time sent:', {
      active: activeTimeSeconds,
      total: totalTimeSeconds,
      visibilityChanges: this.visibilityChangeCount,
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
   * Get total time in seconds
   */
  getTotalTime(): number {
    this.updateActiveTime()
    return Math.floor(this.totalTime / 1000)
  }

  /**
   * Log to console
   */
  private log(message: string, ...args: any[]): void {
    if (process.env.NODE_ENV === 'development') {
      console.log('[EngagementTracker]', message, ...args)
    }
  }
}
