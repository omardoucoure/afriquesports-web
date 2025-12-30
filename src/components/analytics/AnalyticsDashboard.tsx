'use client'

/**
 * Analytics Dashboard Component
 * Displays PostHog analytics data including author stats
 */

import { useState } from 'react'
import { usePostHogStats, useTopAuthors, type Period } from '@/hooks/usePostHogStats'

export function AnalyticsDashboard() {
  const [period, setPeriod] = useState<Period>('week')
  const { data, loading, error, refetch } = usePostHogStats({
    period,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  })

  if (loading && !data) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-red-800 font-semibold mb-2">Error Loading Analytics</h3>
          <p className="text-red-600 text-sm">{error}</p>
          {error.includes('Personal API Key') && (
            <div className="mt-4 text-sm text-red-700">
              <p className="font-medium">Setup Required:</p>
              <ol className="list-decimal ml-5 mt-2 space-y-1">
                <li>Get Personal API Key from PostHog</li>
                <li>Add POSTHOG_PERSONAL_API_KEY to environment variables</li>
                <li>Redeploy the application</li>
              </ol>
              <a
                href="https://us.posthog.com/settings/user-api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 text-blue-600 hover:underline"
              >
                Get API Key →
              </a>
            </div>
          )}
          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!data) {
    return <div className="p-8">No data available</div>
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>

        {/* Period Selector */}
        <div className="flex gap-2">
          {(['day', 'week', 'month', 'all'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded ${
                period === p
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Page Views"
          value={data.summary.totalPageViews.toLocaleString()}
          icon="📊"
        />
        <StatCard
          title="Article Views"
          value={data.summary.totalArticleViews.toLocaleString()}
          icon="📰"
        />
        <StatCard
          title="Unique Visitors"
          value={data.summary.uniqueVisitors.toLocaleString()}
          icon="👥"
        />
        <StatCard
          title="Active Authors"
          value={data.summary.totalAuthors.toString()}
          icon="✍️"
        />
      </div>

      {/* Top Authors Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Top Authors</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Author
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Posts
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Views
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Views/Post
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.authorStats.slice(0, 10).map((author, index) => (
                <tr key={author.authorName} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">
                        {index + 1}
                      </div>
                      <div className="ml-4 text-sm font-medium text-gray-900">
                        {author.authorName}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {author.totalPosts}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {author.totalViews.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {author.avgViewsPerPost.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Pages */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Top Pages</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {data.topPages.slice(0, 5).map((page, index) => (
            <div key={page.path} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center flex-1 min-w-0">
                <span className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
                  {index + 1}
                </span>
                <span className="ml-3 text-sm text-gray-900 truncate">{page.path}</span>
              </div>
              <span className="ml-4 text-sm font-medium text-gray-900">
                {page.views.toLocaleString()} views
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Metadata */}
      <div className="text-xs text-gray-500 text-right">
        Data from {data.metadata.source} • Updated every {data.metadata.cacheMaxAge}s
      </div>
    </div>
  )
}

// Stat Card Component
function StatCard({ title, value, icon }: { title: string; value: string; icon: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  )
}

// Compact version for sidebar/widget
export function AnalyticsWidget() {
  const { topAuthors, loading, error } = useTopAuthors(5, 'week', 'views')

  if (loading) {
    return <div className="animate-pulse h-48 bg-gray-100 rounded"></div>
  }

  if (error || !topAuthors.length) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold text-lg mb-3">Top Authors This Week</h3>
      <div className="space-y-2">
        {topAuthors.map((author, index) => (
          <div key={author.authorName} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">{index + 1}.</span>
              <span className="font-medium">{author.authorName}</span>
            </div>
            <span className="text-gray-600">{author.totalViews} views</span>
          </div>
        ))}
      </div>
    </div>
  )
}
