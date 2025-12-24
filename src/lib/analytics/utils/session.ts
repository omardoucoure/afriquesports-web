/**
 * Session management for analytics
 *
 * Generates and persists session ID
 * Tracks session start time and page views
 */

const SESSION_ID_KEY = 'analytics_session_id'
const SESSION_START_KEY = 'analytics_session_start'
const SESSION_PAGES_KEY = 'analytics_session_pages'
const SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes

export interface SessionData {
  sessionId: string
  sessionStart: number
  pagesViewed: number
  lastActivity: number
}

export class SessionManager {
  private static sessionId: string | null = null
  private static sessionStart: number | null = null
  private static pagesViewed: number = 0

  /**
   * Initialize or restore session
   */
  static initSession(): SessionData {
    if (typeof window === 'undefined') {
      return this.createNewSession()
    }

    try {
      const existingId = sessionStorage.getItem(SESSION_ID_KEY)
      const existingStart = sessionStorage.getItem(SESSION_START_KEY)
      const existingPages = sessionStorage.getItem(SESSION_PAGES_KEY)
      const now = Date.now()

      // Check if session is still valid (not timed out)
      if (existingId && existingStart) {
        const sessionAge = now - parseInt(existingStart, 10)

        if (sessionAge < SESSION_TIMEOUT) {
          // Restore existing session
          this.sessionId = existingId
          this.sessionStart = parseInt(existingStart, 10)
          this.pagesViewed = existingPages ? parseInt(existingPages, 10) : 0

          return {
            sessionId: this.sessionId,
            sessionStart: this.sessionStart,
            pagesViewed: this.pagesViewed,
            lastActivity: now,
          }
        }
      }

      // Create new session if expired or doesn't exist
      return this.createNewSession()
    } catch (error) {
      console.warn('[Analytics] Failed to init session:', error)
      return this.createNewSession()
    }
  }

  /**
   * Create new session
   */
  private static createNewSession(): SessionData {
    this.sessionId = this.generateSessionId()
    this.sessionStart = Date.now()
    this.pagesViewed = 0

    this.saveSession()

    return {
      sessionId: this.sessionId,
      sessionStart: this.sessionStart,
      pagesViewed: this.pagesViewed,
      lastActivity: Date.now(),
    }
  }

  /**
   * Get current session ID
   */
  static getSessionId(): string {
    if (!this.sessionId) {
      this.initSession()
    }
    return this.sessionId || ''
  }

  /**
   * Get session start time
   */
  static getSessionStart(): number {
    if (!this.sessionStart) {
      this.initSession()
    }
    return this.sessionStart || Date.now()
  }

  /**
   * Get session duration in seconds
   */
  static getSessionDuration(): number {
    const start = this.getSessionStart()
    const now = Date.now()
    return Math.floor((now - start) / 1000)
  }

  /**
   * Increment page view count
   */
  static incrementPageView(): void {
    this.pagesViewed += 1
    this.saveSession()
  }

  /**
   * Get page view count
   */
  static getPageViewCount(): number {
    return this.pagesViewed
  }

  /**
   * Update last activity timestamp
   */
  static updateActivity(): void {
    this.saveSession()
  }

  /**
   * Save session to sessionStorage
   */
  private static saveSession(): void {
    if (typeof window === 'undefined') return

    try {
      if (this.sessionId) {
        sessionStorage.setItem(SESSION_ID_KEY, this.sessionId)
      }
      if (this.sessionStart) {
        sessionStorage.setItem(SESSION_START_KEY, this.sessionStart.toString())
      }
      sessionStorage.setItem(SESSION_PAGES_KEY, this.pagesViewed.toString())
    } catch (error) {
      console.warn('[Analytics] Failed to save session:', error)
    }
  }

  /**
   * Generate unique session ID
   */
  private static generateSessionId(): string {
    // Format: timestamp-random
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 15)
    return `${timestamp}-${random}`
  }

  /**
   * Clear session data
   */
  static clearSession(): void {
    this.sessionId = null
    this.sessionStart = null
    this.pagesViewed = 0

    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(SESSION_ID_KEY)
        sessionStorage.removeItem(SESSION_START_KEY)
        sessionStorage.removeItem(SESSION_PAGES_KEY)
      } catch (error) {
        console.warn('[Analytics] Failed to clear session:', error)
      }
    }
  }

  /**
   * Get full session data
   */
  static getSessionData(): SessionData {
    return {
      sessionId: this.getSessionId(),
      sessionStart: this.getSessionStart(),
      pagesViewed: this.getPageViewCount(),
      lastActivity: Date.now(),
    }
  }
}
