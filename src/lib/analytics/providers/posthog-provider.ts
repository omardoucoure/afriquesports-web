/**
 * PostHog analytics provider
 *
 * Uses window.posthog from inline script in layout.tsx
 * PostHog snippet queues events even before full load
 */

import { BaseProvider } from './base'
import type { EventProperties, PageProperties, UserTraits } from '../events'

export class PostHogProvider extends BaseProvider {
  name = 'PostHog'

  /**
   * Get PostHog instance from window
   */
  private getPostHog(): any {
    if (typeof window !== 'undefined') {
      return window.posthog
    }
    return null
  }

  /**
   * Track custom event
   */
  track(eventName: string, properties: Partial<EventProperties>): void {
    const ph = this.getPostHog()
    if (!ph) {
      this.log('PostHog not available, skipping track')
      return
    }

    try {
      // Convert event name to snake_case for PostHog
      const formattedName = this.formatEventName(eventName)
      const formattedProps = this.formatProperties(properties)

      ph.capture(formattedName, formattedProps)

      this.log('Event tracked:', formattedName, formattedProps)
    } catch (error) {
      this.error('Failed to track event:', error)
    }
  }

  /**
   * Track page view
   */
  page(pageName: string, properties: Partial<PageProperties>): void {
    const ph = this.getPostHog()
    if (!ph) {
      this.log('PostHog not available, skipping page')
      return
    }

    try {
      const formattedProps = this.formatProperties(properties as any)

      ph.capture('$pageview', {
        $current_url: window.location.href,
        page_title: pageName,
        ...formattedProps,
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
    const ph = this.getPostHog()
    if (!ph) {
      this.log('PostHog not available, skipping identify')
      return
    }

    try {
      ph.identify(userId, traits)

      this.log('User identified:', userId, traits)
    } catch (error) {
      this.error('Failed to identify user:', error)
    }
  }

  /**
   * Reset user identity
   */
  reset(): void {
    const ph = this.getPostHog()
    if (!ph) return

    try {
      ph.reset()

      this.log('User reset')
    } catch (error) {
      this.error('Failed to reset user:', error)
    }
  }

  /**
   * Check if PostHog is available (stub or loaded)
   * PostHog snippet creates a queue, so it's available immediately
   */
  isEnabled(): boolean {
    return typeof window !== 'undefined' && !!window.posthog
  }

  /**
   * Convert event name to snake_case for PostHog
   */
  protected formatEventName(eventName: string): string {
    // Convert: Article_Click_Card -> article_click_card
    return eventName
      .replace(/_/g, '_')
      .toLowerCase()
  }
}
