/**
 * Google Analytics 4 (GA4) provider
 *
 * Uses window.gtag() for event tracking
 * Measurement ID: G-0DFBHGV182
 */

import { BaseProvider } from './base'
import type { EventProperties, PageProperties, UserTraits } from '../events'

// Extend Window interface
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

export class GoogleAnalyticsProvider extends BaseProvider {
  name = 'GA4'
  private measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-0DFBHGV182'

  /**
   * Track custom event
   */
  track(eventName: string, properties: Partial<EventProperties>): void {
    if (!this.isEnabled()) {
      this.log('Provider not enabled, skipping track')
      return
    }

    try {
      const formattedName = this.formatEventName(eventName)
      const formattedProps = this.formatProperties(properties)

      window.gtag!('event', formattedName, {
        ...formattedProps,
        send_to: this.measurementId,
      })

      this.log('Event tracked:', formattedName, formattedProps)
    } catch (error) {
      this.error('Failed to track event:', error)
    }
  }

  /**
   * Track page view
   */
  page(pageName: string, properties: Partial<PageProperties>): void {
    if (!this.isEnabled()) {
      this.log('Provider not enabled, skipping page')
      return
    }

    try {
      const formattedProps = this.formatProperties(properties as any)

      window.gtag!('event', 'page_view', {
        page_title: pageName,
        page_location: window.location.href,
        page_path: window.location.pathname,
        ...formattedProps,
        send_to: this.measurementId,
      })

      this.log('Page tracked:', pageName, formattedProps)
    } catch (error) {
      this.error('Failed to track page:', error)
    }
  }

  /**
   * Identify user
   */
  identify(userId: string, traits?: UserTraits): void {
    if (!this.isEnabled()) {
      this.log('Provider not enabled, skipping identify')
      return
    }

    try {
      // Set user ID
      window.gtag!('config', this.measurementId, {
        user_id: userId,
      })

      // Set user properties
      if (traits) {
        window.gtag!('set', 'user_properties', {
          ...traits,
        })
      }

      this.log('User identified:', userId, traits)
    } catch (error) {
      this.error('Failed to identify user:', error)
    }
  }

  /**
   * Reset user identity
   */
  reset(): void {
    if (!this.isEnabled()) {
      return
    }

    try {
      // Clear user ID
      window.gtag!('config', this.measurementId, {
        user_id: undefined,
      })

      this.log('User reset')
    } catch (error) {
      this.error('Failed to reset user:', error)
    }
  }

  /**
   * Check if GA4 is enabled
   */
  isEnabled(): boolean {
    return typeof window !== 'undefined' && typeof window.gtag === 'function'
  }

  /**
   * Convert event name to GA4 format (lowercase with underscores)
   */
  protected formatEventName(eventName: string): string {
    // Convert: Article_Click_Card -> article_click_card
    return eventName.toLowerCase()
  }

  /**
   * Format properties for GA4 (convert to snake_case keys)
   */
  protected formatProperties(properties: Partial<EventProperties>): Record<string, any> {
    const formatted: Record<string, any> = {}

    Object.entries(properties).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // Convert camelCase to snake_case
        const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase()
        formatted[snakeKey] = value
      }
    })

    return formatted
  }
}
