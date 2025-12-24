/**
 * Base analytics provider interface
 *
 * All analytics providers (PostHog, GA4, Vercel) must implement this interface
 */

import type { EventProperties, PageProperties, UserTraits } from '../events'

export interface AnalyticsProvider {
  /**
   * Provider name for debugging
   */
  name: string

  /**
   * Track a custom event
   */
  track(eventName: string, properties: Partial<EventProperties>): void

  /**
   * Track a page view
   */
  page(pageName: string, properties: Partial<PageProperties>): void

  /**
   * Identify a user
   */
  identify(userId: string, traits?: UserTraits): void

  /**
   * Reset user identity (on logout)
   */
  reset(): void

  /**
   * Check if provider is enabled and ready
   */
  isEnabled(): boolean

  /**
   * Initialize the provider (optional)
   */
  init?(): void

  /**
   * Clean up resources (optional)
   */
  destroy?(): void
}

/**
 * Base provider class with common functionality
 */
export abstract class BaseProvider implements AnalyticsProvider {
  abstract name: string

  abstract track(eventName: string, properties: Partial<EventProperties>): void
  abstract page(pageName: string, properties: Partial<PageProperties>): void
  abstract identify(userId: string, traits?: UserTraits): void
  abstract reset(): void
  abstract isEnabled(): boolean

  /**
   * Convert event name to provider format
   * Override in subclass if needed
   */
  protected formatEventName(eventName: string): string {
    return eventName
  }

  /**
   * Filter and format event properties
   * Override in subclass if needed
   */
  protected formatProperties(properties: Partial<EventProperties>): Record<string, any> {
    // Remove undefined values
    const formatted: Record<string, any> = {}

    Object.entries(properties).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formatted[key] = value
      }
    })

    return formatted
  }

  /**
   * Log to console in development mode
   */
  protected log(message: string, ...args: any[]): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Analytics:${this.name}]`, message, ...args)
    }
  }

  /**
   * Log error
   */
  protected error(message: string, error?: any): void {
    console.error(`[Analytics:${this.name}]`, message, error)
  }
}
