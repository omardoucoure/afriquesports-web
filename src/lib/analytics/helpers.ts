/**
 * Analytics Helper Functions
 *
 * Simplified tracking functions for common events
 */

import { getAnalyticsManager } from './manager'
import type { ArticleViewEvent } from './events'

/**
 * Track article view with author
 *
 * @example
 * trackArticleView({
 *   articleId: 'post-123',
 *   title: 'Sadio Mané marque encore',
 *   category: 'senegal',
 *   author: 'Claude AI',
 *   publishDate: '2025-12-30'
 * })
 */
export function trackArticleView(params: {
  articleId: string
  title: string
  category: string
  author?: string
  publishDate?: string
}) {
  const analytics = getAnalyticsManager()

  analytics.track('Article_View_Page', {
    article_id: params.articleId,
    article_title: params.title,
    article_category: params.category,
    article_author: params.author || 'Unknown',
    article_publish_date: params.publishDate,
    locale: getLocale(),
    page_path: getPagePath(),
    timestamp: Date.now(),
    session_id: getSessionId(),
  } as Partial<ArticleViewEvent>)
}

/**
 * Track article share with author attribution
 */
export function trackArticleShare(params: {
  articleId: string
  title: string
  platform: 'facebook' | 'twitter' | 'whatsapp' | 'telegram' | 'copy'
  author?: string
}) {
  const analytics = getAnalyticsManager()

  analytics.track(`Social_Share_${capitalizeFirst(params.platform)}`, {
    article_id: params.articleId,
    article_title: params.title,
    platform: params.platform,
    share_url: window.location.href,
    author: params.author, // Custom property for author attribution
    locale: getLocale(),
    page_path: getPagePath(),
    timestamp: Date.now(),
    session_id: getSessionId(),
  })
}

/**
 * Track article read progress with author
 */
export function trackArticleReadProgress(params: {
  articleId: string
  title: string
  progress: 25 | 50 | 75 | 100
  timeSpent: number
  author?: string
}) {
  const analytics = getAnalyticsManager()

  analytics.track(`Article_Read_Progress_${params.progress}`, {
    article_id: params.articleId,
    article_title: params.title,
    progress_percentage: params.progress,
    time_spent_seconds: params.timeSpent,
    author: params.author, // Custom property
    locale: getLocale(),
    page_path: getPagePath(),
    timestamp: Date.now(),
    session_id: getSessionId(),
  })
}

// Helper functions

function getLocale(): string {
  if (typeof window !== 'undefined') {
    return window.location.pathname.split('/')[1] || 'fr'
  }
  return 'fr'
}

function getPagePath(): string {
  if (typeof window !== 'undefined') {
    return window.location.pathname
  }
  return '/'
}

function getSessionId(): string {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    let sessionId = sessionStorage.getItem('analytics_session_id')
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('analytics_session_id', sessionId)
    }
    return sessionId
  }
  return `session_${Date.now()}`
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
