import { posthog } from './posthog'

/**
 * Analytics utility functions for tracking user interactions
 * These functions wrap PostHog's capture method for type safety and consistency
 */

export const analytics = {
  /**
   * Track article view
   */
  trackArticleView: (articleId: string, title: string, category: string) => {
    posthog.capture('article_viewed', {
      article_id: articleId,
      article_title: title,
      category: category,
    })
  },

  /**
   * Track article share
   */
  trackArticleShare: (articleId: string, platform: string) => {
    posthog.capture('article_shared', {
      article_id: articleId,
      platform: platform,
    })
  },

  /**
   * Track search query
   */
  trackSearch: (query: string, resultsCount: number) => {
    posthog.capture('search_performed', {
      search_query: query,
      results_count: resultsCount,
    })
  },

  /**
   * Track video play
   */
  trackVideoPlay: (videoId: string, videoTitle: string) => {
    posthog.capture('video_played', {
      video_id: videoId,
      video_title: videoTitle,
    })
  },

  /**
   * Track category navigation
   */
  trackCategoryView: (category: string) => {
    posthog.capture('category_viewed', {
      category: category,
    })
  },

  /**
   * Track external link clicks
   */
  trackExternalLinkClick: (url: string, linkText: string) => {
    posthog.capture('external_link_clicked', {
      url: url,
      link_text: linkText,
    })
  },

  /**
   * Track newsletter signup
   */
  trackNewsletterSignup: (email: string) => {
    posthog.capture('newsletter_signup', {
      email: email,
    })
  },

  /**
   * Track poll interaction
   */
  trackPollVote: (pollId: string, optionId: string) => {
    posthog.capture('poll_voted', {
      poll_id: pollId,
      option_id: optionId,
    })
  },

  /**
   * Track user preferences
   */
  trackPreferenceChange: (preference: string, value: string) => {
    posthog.capture('preference_changed', {
      preference: preference,
      value: value,
    })
  },

  /**
   * Identify user (for authenticated users)
   */
  identifyUser: (userId: string, traits?: Record<string, any>) => {
    posthog.identify(userId, traits)
  },

  /**
   * Reset user identity (on logout)
   */
  resetUser: () => {
    posthog.reset()
  },
}
