# PostHog Dashboard Data Fetching Guide

## Overview

You have a **PostHog Stats API** already set up at `/api/posthog-stats` that can fetch analytics data for your dashboard.

## Current Status

✅ API endpoint exists: `src/app/api/posthog-stats/route.ts`
✅ PostHog tracking active with author attribution
⚠️ Needs configuration: Personal API Key

## Setup Instructions

### Step 1: Get PostHog Personal API Key

1. **Go to PostHog Settings**:
   - Visit: https://us.posthog.com/settings/user-api-keys
   - Or navigate: Settings → User → Personal API Keys

2. **Create New Key**:
   - Click "Create personal API key"
   - Name it: "Afrique Sports Dashboard API"
   - Copy the generated key (starts with `phx_...`)

3. **Add to Vercel Environment**:
   ```bash
   # From your terminal
   vercel env add POSTHOG_PERSONAL_API_KEY production
   # Paste the key when prompted

   # Also add for development
   vercel env add POSTHOG_PERSONAL_API_KEY development
   ```

4. **Add to Local Environment**:
   ```bash
   # Add to .env.local
   echo "POSTHOG_PERSONAL_API_KEY=your_personal_key_here" >> .env.local
   ```

### Step 2: API Endpoints Available

#### Get Overall Stats
```bash
GET /api/posthog-stats?period=week
```

**Parameters**:
- `period`: `day` | `week` | `month` | `all`

**Response**:
```json
{
  "period": "week",
  "dateFrom": "2025-12-23T12:00:00.000Z",
  "dateTo": "2025-12-30T12:00:00.000Z",
  "summary": {
    "totalPageViews": 15234,
    "totalArticleViews": 8521,
    "uniqueVisitors": 3456,
    "totalAuthors": 12
  },
  "authorStats": [
    {
      "authorName": "John Doe",
      "totalPosts": 25,
      "totalViews": 3456,
      "avgViewsPerPost": 138
    }
  ],
  "topPages": [
    {
      "path": "/fr/football/article-slug",
      "views": 523
    }
  ],
  "metadata": {
    "source": "PostHog",
    "cacheMaxAge": 300
  }
}
```

## Frontend Integration

### Option 1: React Hook (Recommended)

Create `src/hooks/usePostHogStats.ts`:

```typescript
import { useState, useEffect } from 'react'

interface PostHogStats {
  summary: {
    totalPageViews: number
    totalArticleViews: number
    uniqueVisitors: number
    totalAuthors: number
  }
  authorStats: Array<{
    authorName: string
    totalPosts: number
    totalViews: number
    avgViewsPerPost: number
  }>
  topPages: Array<{
    path: string
    views: number
  }>
}

export function usePostHogStats(period: 'day' | 'week' | 'month' | 'all' = 'week') {
  const [data, setData] = useState<PostHogStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true)
        const response = await fetch(`/api/posthog-stats?period=${period}`)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const result = await response.json()
        setData(result)
        setError(null)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [period])

  return { data, loading, error }
}
```

**Usage in Component**:
```typescript
'use client'

import { usePostHogStats } from '@/hooks/usePostHogStats'

export function DashboardStats() {
  const { data, loading, error } = usePostHogStats('week')

  if (loading) return <div>Loading stats...</div>
  if (error) return <div>Error: {error}</div>
  if (!data) return null

  return (
    <div>
      <h2>Analytics Dashboard</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="Total Views"
          value={data.summary.totalPageViews}
        />
        <StatCard
          title="Article Views"
          value={data.summary.totalArticleViews}
        />
        <StatCard
          title="Visitors"
          value={data.summary.uniqueVisitors}
        />
        <StatCard
          title="Authors"
          value={data.summary.totalAuthors}
        />
      </div>

      {/* Top Authors */}
      <div className="mt-8">
        <h3>Top Authors</h3>
        <table>
          <thead>
            <tr>
              <th>Author</th>
              <th>Posts</th>
              <th>Views</th>
              <th>Avg Views/Post</th>
            </tr>
          </thead>
          <tbody>
            {data.authorStats.slice(0, 10).map((author) => (
              <tr key={author.authorName}>
                <td>{author.authorName}</td>
                <td>{author.totalPosts}</td>
                <td>{author.totalViews}</td>
                <td>{author.avgViewsPerPost}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

### Option 2: Server Component (Next.js 13+)

```typescript
// app/dashboard/page.tsx
async function getPostHogStats(period: string = 'week') {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/posthog-stats?period=${period}`, {
    next: { revalidate: 300 } // Cache for 5 minutes
  })

  if (!res.ok) throw new Error('Failed to fetch stats')
  return res.json()
}

export default async function DashboardPage() {
  const stats = await getPostHogStats('week')

  return (
    <div>
      <h1>Analytics Dashboard</h1>
      <p>Total Views: {stats.summary.totalPageViews}</p>
      {/* ... rest of your dashboard */}
    </div>
  )
}
```

## Advanced Queries

### Get Author-Specific Stats

You can extend the API to support author filtering:

```typescript
// Add to route.ts
const author = searchParams.get('author')

// Filter events by author
const authorFilter = author ? `&properties={"author":"${author}"}` : ''
const url = `https://us.i.posthog.com/api/projects/${posthogProjectId}/events?event=Article_View_Page&after=${dateFrom}&before=${dateTo}${authorFilter}`
```

**Usage**:
```bash
GET /api/posthog-stats?period=week&author=John%20Doe
```

### Get Article-Specific Stats

```typescript
const articleId = searchParams.get('articleId')
const articleFilter = articleId ? `&properties={"article_id":"${articleId}"}` : ''
```

**Usage**:
```bash
GET /api/posthog-stats?period=month&articleId=123
```

## Important Note

⚠️ **Event Name Update Needed**: The API currently queries for `Article_View` but your tracking uses `Article_View_Page`. This needs to be fixed.

## Testing

1. **Set up Personal API Key** (see Step 1 above)
2. **Test the endpoint**:
   ```bash
   curl http://localhost:3000/api/posthog-stats?period=week
   ```
3. **Check for errors** in the response
4. **Verify data** matches PostHog dashboard

## Troubleshooting

### Error: "PostHog Personal API Key not configured"
- Personal API Key not set in environment variables
- Add it to Vercel and .env.local

### Error: "PostHog API error: 401"
- Invalid Personal API Key
- Create a new key at https://us.posthog.com/settings/user-api-keys

### Error: "PostHog API error: 403"
- Key doesn't have permission for this project
- Create key while logged into correct PostHog organization

### No data returned
- Check date range (might be too narrow)
- Verify events are being sent to PostHog
- Check event name matches (`Article_View_Page` vs `Article_View`)

## Next Steps

1. ✅ Get Personal API Key from PostHog
2. ✅ Add to Vercel environment variables
3. ✅ Fix event name in API route
4. ✅ Create frontend dashboard component
5. ✅ Test with real data
6. ✅ Deploy to production
