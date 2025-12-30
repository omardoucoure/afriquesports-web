import { useState, useEffect } from 'react'

/**
 * PostHog Analytics Stats Hook
 * Fetches analytics data from PostHog via /api/posthog-stats endpoint
 */

export interface AuthorStats {
  authorName: string
  totalPosts: number
  totalViews: number
  avgViewsPerPost: number
}

export interface TopPage {
  path: string
  views: number
}

export interface PostHogStats {
  period: string
  dateFrom: string
  dateTo: string
  summary: {
    totalPageViews: number
    totalArticleViews: number
    uniqueVisitors: number
    totalAuthors: number
  }
  authorStats: AuthorStats[]
  topPages: TopPage[]
  metadata: {
    source: string
    cacheMaxAge: number
  }
}

export type Period = 'day' | 'week' | 'month' | 'all'

interface UsePostHogStatsOptions {
  period?: Period
  autoFetch?: boolean
  refetchInterval?: number // in milliseconds
}

export function usePostHogStats(options: UsePostHogStatsOptions = {}) {
  const {
    period = 'week',
    autoFetch = true,
    refetchInterval,
  } = options

  const [data, setData] = useState<PostHogStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/posthog-stats?period=${period}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData.error || errorData.details || `HTTP ${response.status}`
        )
      }

      const result = await response.json()
      setData(result)
      setError(null)
    } catch (err: any) {
      console.error('[usePostHogStats] Error:', err)
      setError(err.message || 'Failed to fetch analytics data')
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  // Auto-fetch on mount and when period changes
  useEffect(() => {
    if (autoFetch) {
      fetchStats()
    }
  }, [period, autoFetch])

  // Optional refetch interval
  useEffect(() => {
    if (refetchInterval && refetchInterval > 0) {
      const intervalId = setInterval(fetchStats, refetchInterval)
      return () => clearInterval(intervalId)
    }
  }, [refetchInterval])

  return {
    data,
    loading,
    error,
    refetch: fetchStats,
  }
}

/**
 * Hook to fetch stats for a specific author
 */
export function useAuthorStats(authorName: string, period: Period = 'week') {
  const { data, loading, error, refetch } = usePostHogStats({ period })

  const authorData = data?.authorStats.find(
    (stats) => stats.authorName === authorName
  )

  return {
    stats: authorData || null,
    loading,
    error,
    refetch,
  }
}

/**
 * Hook to get top performing authors
 */
export function useTopAuthors(
  limit: number = 10,
  period: Period = 'week',
  sortBy: 'views' | 'posts' | 'avgViews' = 'views'
) {
  const { data, loading, error, refetch } = usePostHogStats({ period })

  const topAuthors = data?.authorStats
    .sort((a, b) => {
      switch (sortBy) {
        case 'views':
          return b.totalViews - a.totalViews
        case 'posts':
          return b.totalPosts - a.totalPosts
        case 'avgViews':
          return b.avgViewsPerPost - a.avgViewsPerPost
        default:
          return 0
      }
    })
    .slice(0, limit)

  return {
    topAuthors: topAuthors || [],
    loading,
    error,
    refetch,
  }
}
