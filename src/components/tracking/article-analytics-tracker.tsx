'use client'

/**
 * Article Analytics Tracker
 *
 * Tracks article views with PostHog including author attribution
 */

import { useEffect } from 'react'
import { trackArticleView } from '@/lib/analytics/helpers'

interface ArticleAnalyticsTrackerProps {
  articleId: string
  title: string
  category: string
  author: string
  publishDate: string
  slug: string
}

export function ArticleAnalyticsTracker({
  articleId,
  title,
  category,
  author,
  publishDate,
  slug,
}: ArticleAnalyticsTrackerProps) {
  useEffect(() => {
    // Track article view with author
    trackArticleView({
      articleId,
      title,
      category,
      author,
      publishDate,
    })

    // Also send to PostHog directly for redundancy
    if (typeof window !== 'undefined' && window.posthog) {
      window.posthog.capture('Article_View_Page', {
        article_id: articleId,
        article_title: title,
        article_category: category,
        article_author: author,
        article_slug: slug,
        article_publish_date: publishDate,
        $current_url: window.location.href,
      })
    }
  }, [articleId, title, category, author, publishDate, slug])

  return null // This component doesn't render anything
}

// Extend window type for PostHog
declare global {
  interface Window {
    posthog?: {
      capture: (event: string, properties?: Record<string, any>) => void
    }
  }
}
