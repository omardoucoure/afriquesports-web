/**
 * PostHog analytics provider
 *
 * Wraps existing PostHog integration from /lib/posthog.ts
 */

import { posthog } from '@/lib/posthog'
import { BaseProvider } from './base'
import type { EventProperties, PageProperties, UserTraits } from '../events'

export class PostHogProvider extends BaseProvider {
  name = 'PostHog'

  /**
   * Track custom event
   */
  track(eventName: string, properties: Partial<EventProperties>): void {
    if (!this.isEnabled()) {
      this.log('Provider not enabled, skipping track')
      return
    }

    try {
      // Convert event name to snake_case for PostHog
      const formattedName = this.formatEventName(eventName)
      const formattedProps = this.formatProperties(properties)

      posthog.capture(formattedName, formattedProps)

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

      posthog.capture('$pageview', {
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
    if (!this.isEnabled()) {
      this.log('Provider not enabled, skipping identify')
      return
    }

    try {
      posthog.identify(userId, traits)

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
      posthog.reset()

      this.log('User reset')
    } catch (error) {
      this.error('Failed to reset user:', error)
    }
  }

  /**
   * Check if PostHog is enabled
   */
  isEnabled(): boolean {
    return typeof window !== 'undefined' && posthog && posthog.__loaded
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
