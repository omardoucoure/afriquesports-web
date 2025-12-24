/**
 * Vercel Analytics provider
 *
 * Uses @vercel/analytics/react for event tracking
 */

import { track as vercelTrack } from '@vercel/analytics'
import { BaseProvider } from './base'
import type { EventProperties, PageProperties, UserTraits } from '../events'

export class VercelAnalyticsProvider extends BaseProvider {
  name = 'Vercel'

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

      vercelTrack(formattedName, formattedProps)

      this.log('Event tracked:', formattedName, formattedProps)
    } catch (error) {
      this.error('Failed to track event:', error)
    }
  }

  /**
   * Track page view
   * Note: Vercel Analytics automatically tracks page views, so this is optional
   */
  page(pageName: string, properties: Partial<PageProperties>): void {
    if (!this.isEnabled()) {
      this.log('Provider not enabled, skipping page')
      return
    }

    try {
      const formattedProps = this.formatProperties(properties as any)

      // Track as custom event since Vercel handles pageviews automatically
      vercelTrack('pageview', {
        page_title: pageName,
        page_path: window.location.pathname,
        ...formattedProps,
      })

      this.log('Page tracked:', pageName, formattedProps)
    } catch (error) {
      this.error('Failed to track page:', error)
    }
  }

  /**
   * Identify user (Vercel Analytics doesn't have built-in identify)
   */
  identify(userId: string, traits?: UserTraits): void {
    if (!this.isEnabled()) {
      this.log('Provider not enabled, skipping identify')
      return
    }

    try {
      // Track as custom event
      vercelTrack('user_identified', {
        user_id: userId,
        ...traits,
      })

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
      // Track as custom event
      vercelTrack('user_reset', {})

      this.log('User reset')
    } catch (error) {
      this.error('Failed to reset user:', error)
    }
  }

  /**
   * Check if Vercel Analytics is enabled
   */
  isEnabled(): boolean {
    return typeof window !== 'undefined' && typeof vercelTrack === 'function'
  }

  /**
   * Convert event name to Vercel format (lowercase with underscores)
   */
  protected formatEventName(eventName: string): string {
    // Convert: Article_Click_Card -> article_click_card
    return eventName.toLowerCase()
  }
}
