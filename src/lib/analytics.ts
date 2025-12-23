/**
 * Legacy analytics API - Backward compatibility wrapper
 *
 * This file maintains the old API while routing events through the new analytics manager.
 * Use the new useAnalytics() hook for new implementations.
 */

import { getAnalyticsManager } from './analytics/manager'
import { AnalyticsEventName } from './analytics/events'

export const analytics = {
  /**
   * Track article view
   */
  trackArticleView: (articleId: string, title: string, category: string) => {
    const manager = getAnalyticsManager()
    manager.track(AnalyticsEventName.ARTICLE_VIEW_PAGE, {
      article_id: articleId,
      article_title: title,
      article_category: category,
    })
  },

  /**
   * Track article share
   */
  trackArticleShare: (articleId: string, platform: string) => {
    const manager = getAnalyticsManager()
    const eventMap: Record<string, AnalyticsEventName> = {
      facebook: AnalyticsEventName.SOCIAL_SHARE_FACEBOOK,
      twitter: AnalyticsEventName.SOCIAL_SHARE_TWITTER,
      whatsapp: AnalyticsEventName.SOCIAL_SHARE_WHATSAPP,
      telegram: AnalyticsEventName.SOCIAL_SHARE_TELEGRAM,
      copy: AnalyticsEventName.SOCIAL_COPY_LINK,
    }

    const eventName = eventMap[platform.toLowerCase()] || AnalyticsEventName.SOCIAL_SHARE_FACEBOOK

    manager.track(eventName, {
      article_id: articleId,
      article_title: '',
      platform: platform as any,
      share_url: typeof window !== 'undefined' ? window.location.href : '',
    })
  },

  /**
   * Track search query
   */
  trackSearch: (query: string, resultsCount: number) => {
    const manager = getAnalyticsManager()
    manager.track(AnalyticsEventName.SEARCH_SUBMIT_QUERY, {
      query: query,
      results_count: resultsCount,
      source: 'modal' as const,
    })
  },

  /**
   * Track video play
   */
  trackVideoPlay: (videoId: string, videoTitle: string) => {
    const manager = getAnalyticsManager()
    manager.track(AnalyticsEventName.MATCH_VIDEO_PLAY, {
      match_id: '',
      video_id: videoId,
      video_type: 'highlight' as const,
    })
  },

  /**
   * Track category navigation
   */
  trackCategoryView: (category: string) => {
    const manager = getAnalyticsManager()
    manager.track(AnalyticsEventName.NAVIGATION_CLICK_CATEGORY, {
      target_type: 'category' as const,
      link_text: category,
      link_url: `/${category}`,
      category: category,
    })
  },

  /**
   * Track external link clicks
   */
  trackExternalLinkClick: (url: string, linkText: string) => {
    const manager = getAnalyticsManager()
    manager.track(AnalyticsEventName.NAVIGATION_CLICK_CATEGORY, {
      target_type: 'footer_link' as const,
      link_text: linkText,
      link_url: url,
    })
  },

  /**
   * Track newsletter signup
   */
  trackNewsletterSignup: (email: string) => {
    const manager = getAnalyticsManager()
    manager.track(AnalyticsEventName.USER_NEWSLETTER_SIGNUP, {
      source: 'footer' as const,
      email_domain: email.split('@')[1],
    })
  },

  /**
   * Track poll interaction
   */
  trackPollVote: (pollId: string, optionId: string) => {
    const manager = getAnalyticsManager()
    manager.track(AnalyticsEventName.USER_POLL_VOTE, {
      poll_id: pollId,
      poll_question: '',
      option_id: optionId,
      option_text: '',
    })
  },

  /**
   * Track user preferences
   */
  trackPreferenceChange: (preference: string, value: string) => {
    const manager = getAnalyticsManager()
    // Generic track for preferences (no specific event defined)
    manager.track('User_Preference_Changed', {
      preference: preference,
      value: value,
    } as any)
  },

  /**
   * Identify user (for authenticated users)
   */
  identifyUser: (userId: string, traits?: Record<string, any>) => {
    const manager = getAnalyticsManager()
    manager.identify(userId, traits)
  },

  /**
   * Reset user identity (on logout)
   */
  resetUser: () => {
    const manager = getAnalyticsManager()
    manager.reset()
  },
}

// Re-export for convenience
export { getAnalyticsManager } from './analytics/manager'
