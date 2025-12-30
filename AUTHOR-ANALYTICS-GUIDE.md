# Author Analytics Guide for PostHog

Complete guide to tracking and querying stats by author in PostHog.

## Overview

Your analytics system already supports author tracking through the `article_author` property on article view events.

## How It Works

```
User Views Article
     ↓
Frontend tracks: Article_View_Page event
     ↓
PostHog receives: { article_id, article_title, article_author, ... }
     ↓
Backend queries: /api/posthog-stats?period=day
     ↓
Returns: Author stats (views, posts, avg views)
```

## 1. Frontend: Track Article Views

### Method 1: Using Helper Function (Recommended)

```typescript
import { trackArticleView } from '@/lib/analytics/helpers'

// In your article page component
export default function ArticlePage({ article }: { article: Article }) {
  useEffect(() => {
    trackArticleView({
      articleId: article.id,
      title: article.title,
      category: article.category,
      author: article.author,  // ← Tracks author!
      publishDate: article.published_at
    })
  }, [article])

  return <div>...</div>
}
```

### Method 2: Using Analytics Manager Directly

```typescript
import { getAnalyticsManager } from '@/lib/analytics'

const analytics = getAnalyticsManager()

analytics.track('Article_View_Page', {
  article_id: 'post-123',
  article_title: 'Sadio Mané marque encore',
  article_category: 'senegal',
  article_author: 'Claude AI',  // ← Author property
  locale: 'fr',
  page_path: '/fr/senegal/sadio-mane-marque',
  timestamp: Date.now(),
  session_id: getSessionId()
})
```

### Method 3: Using PostHog Directly

```typescript
import { posthog } from '@/lib/posthog'

posthog.capture('Article_View_Page', {
  article_id: 'post-123',
  article_title: 'Sadio Mané marque encore',
  author: 'Claude AI',  // ← PostHog custom property
  $current_url: window.location.href
})
```

## 2. Backend: Query Author Stats

### API Endpoint

```bash
# Get author stats for today
GET /api/posthog-stats?period=day

# Get author stats for last week
GET /api/posthog-stats?period=week

# Get author stats for last month
GET /api/posthog-stats?period=month

# Get all-time author stats
GET /api/posthog-stats?period=all
```

### Response Format

```json
{
  "period": "day",
  "dateFrom": "2025-12-29T00:00:00.000Z",
  "dateTo": "2025-12-30T12:34:56.789Z",
  "summary": {
    "totalPageViews": 1250,
    "totalArticleViews": 890,
    "uniqueVisitors": 345,
    "totalAuthors": 8
  },
  "authorStats": [
    {
      "authorName": "Claude AI",
      "totalPosts": 45,
      "totalViews": 320,
      "avgViewsPerPost": 7
    },
    {
      "authorName": "Omar Doucoure",
      "totalPosts": 32,
      "totalViews": 280,
      "avgViewsPerPost": 9
    },
    {
      "authorName": "AI Commentary Bot",
      "totalPosts": 28,
      "totalViews": 245,
      "avgViewsPerPost": 9
    }
  ],
  "topPages": [
    {
      "path": "/fr/senegal/sadio-mane-123",
      "views": 125
    }
  ]
}
```

### Using the API (Frontend)

```typescript
// Fetch author stats
async function fetchAuthorStats(period: 'day' | 'week' | 'month' | 'all') {
  const response = await fetch(`/api/posthog-stats?period=${period}`)
  const data = await response.json()

  console.log('Total authors:', data.summary.totalAuthors)
  console.log('Top author:', data.authorStats[0])

  return data.authorStats
}

// Usage in React component
function AuthorStatsWidget() {
  const [stats, setStats] = useState([])
  const [period, setPeriod] = useState('week')

  useEffect(() => {
    fetchAuthorStats(period).then(setStats)
  }, [period])

  return (
    <div>
      <select value={period} onChange={(e) => setPeriod(e.target.value)}>
        <option value="day">Today</option>
        <option value="week">This Week</option>
        <option value="month">This Month</option>
        <option value="all">All Time</option>
      </select>

      <h2>Top Authors</h2>
      {stats.map((author) => (
        <div key={author.authorName}>
          <strong>{author.authorName}</strong>
          <div>{author.totalViews} views ({author.totalPosts} posts)</div>
          <div>Avg: {author.avgViewsPerPost} views/post</div>
        </div>
      ))}
    </div>
  )
}
```

## 3. PostHog Dashboard: Query by Author

### Create Author Performance Insight

1. **Go to PostHog**: https://us.i.posthog.com/insights
2. **Click** "New insight" → "Trends"
3. **Event**: Select `Article_View_Page`
4. **Breakdown by**: `author` (property)
5. **Date range**: Last 7 days
6. **Save insight**: "Author Performance - Last 7 Days"

### Create Author Funnel

1. **Go to PostHog**: https://us.i.posthog.com/insights
2. **Click** "New insight" → "Funnel"
3. **Steps**:
   - Step 1: `Article_View_Page` (filtered by `author = "Claude AI"`)
   - Step 2: `Article_Read_Progress_50`
   - Step 3: `Social_Share_*`
4. **Save**: "Claude AI - Article Engagement Funnel"

### Filter Events by Specific Author

1. **Go to PostHog**: https://us.i.posthog.com/events
2. **Filter**: `Event = Article_View_Page`
3. **Add filter**: `author = Claude AI`
4. **View**: All article views by Claude AI

## 4. Advanced Queries

### Query for Top Performing Authors

```typescript
// Custom PostHog API query
const response = await fetch(
  `https://us.i.posthog.com/api/projects/${projectId}/insights/trend`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${personalApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      events: [{ id: 'Article_View_Page', type: 'events' }],
      breakdown: 'author',
      date_from: '-7d',
      display: 'ActionsTable'
    })
  }
)
```

### Get Author Details with Article List

```typescript
// Modify the posthog-stats endpoint to return article list per author
articlesByAuthor[author] = {
  posts: new Set(),
  views: 0,
  articles: []  // Add article details
}

// When processing events:
articlesByAuthor[author].articles.push({
  id: event.properties.article_id,
  title: event.properties.article_title,
  views: 1
})
```

## 5. WordPress Integration

If articles come from WordPress, ensure author is passed:

```typescript
// In article page component
const author = article.author || article._embedded?.author?.[0]?.name || 'Unknown'

trackArticleView({
  articleId: article.id.toString(),
  title: article.title.rendered,
  category: getCategorySlug(article),
  author: author,  // ← WordPress author
  publishDate: article.date
})
```

## 6. Real-World Examples

### Example 1: Track AI-Generated Articles

```typescript
// When autonomous agent publishes article
trackArticleView({
  articleId: 'auto-generated-123',
  title: 'Sénégal vs Cameroun: Match Analysis',
  category: 'afcon-2025',
  author: 'AI Commentary Bot',  // ← AI author
  publishDate: new Date().toISOString()
})
```

### Example 2: Compare Authors

```typescript
async function compareAuthors(author1: string, author2: string) {
  const data = await fetch('/api/posthog-stats?period=month').then(r => r.json())

  const stats1 = data.authorStats.find(a => a.authorName === author1)
  const stats2 = data.authorStats.find(a => a.authorName === author2)

  console.log(`${author1}: ${stats1.totalViews} views`)
  console.log(`${author2}: ${stats2.totalViews} views`)

  return {
    winner: stats1.totalViews > stats2.totalViews ? author1 : author2,
    difference: Math.abs(stats1.totalViews - stats2.totalViews)
  }
}

// Usage
const result = await compareAuthors('Claude AI', 'Omar Doucoure')
console.log(`Winner: ${result.winner} (+${result.difference} views)`)
```

### Example 3: Author Leaderboard

```typescript
function AuthorLeaderboard() {
  const [authors, setAuthors] = useState([])

  useEffect(() => {
    fetch('/api/posthog-stats?period=week')
      .then(r => r.json())
      .then(data => setAuthors(data.authorStats))
  }, [])

  return (
    <div className="leaderboard">
      <h2>Top Authors This Week</h2>
      <ol>
        {authors.slice(0, 10).map((author, index) => (
          <li key={author.authorName}>
            <span className="rank">#{index + 1}</span>
            <span className="name">{author.authorName}</span>
            <span className="stats">
              {author.totalViews} views · {author.totalPosts} posts
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}
```

## 7. Best Practices

### ✅ Do

- **Always track author** for article views
- **Use consistent author names** (e.g., "Claude AI", not "claude-ai" or "Claude")
- **Track AI vs Human authors** separately for comparison
- **Include author** in share events for attribution
- **Use meaningful author names** (not IDs)

### ❌ Don't

- Don't forget to track author when logging article views
- Don't use different spellings for same author
- Don't track personally identifiable information (PII) without consent
- Don't track author emails - use display names only

## 8. Troubleshooting

### Author stats show "Unknown"

**Problem**: Articles have no author tracked

**Solution**: Ensure `article_author` is passed:

```typescript
// WRONG ❌
trackArticleView({
  articleId: 'post-123',
  title: 'Article Title',
  category: 'senegal'
  // author missing!
})

// CORRECT ✅
trackArticleView({
  articleId: 'post-123',
  title: 'Article Title',
  category: 'senegal',
  author: 'Claude AI'  // ← Add author
})
```

### Author name inconsistent

**Problem**: Same author appears multiple times with different names

**Solution**: Normalize author names:

```typescript
function normalizeAuthorName(name: string): string {
  // Convert to Title Case
  const normalized = name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  // Handle known aliases
  const aliases = {
    'claude': 'Claude AI',
    'claude-ai': 'Claude AI',
    'ai-bot': 'AI Commentary Bot',
    'autonomous-agent': 'AI Commentary Bot'
  }

  return aliases[normalized.toLowerCase()] || normalized
}

// Usage
trackArticleView({
  author: normalizeAuthorName(rawAuthorName)
})
```

### PostHog not showing author breakdown

**Problem**: Author property not being sent to PostHog

**Solution**: Check browser console for PostHog events:

```javascript
// In browser console
posthog.capture('test', { author: 'Test Author' })

// Check if event appears in PostHog dashboard
// https://us.i.posthog.com/events
```

## 9. Resources

- **PostHog API Docs**: https://posthog.com/docs/api/events
- **Your Stats Endpoint**: `/api/posthog-stats`
- **PostHog Dashboard**: https://us.i.posthog.com
- **Analytics Helpers**: `src/lib/analytics/helpers.ts`
- **Event Definitions**: `src/lib/analytics/events.ts`

## 10. Summary

✅ **Author tracking is already configured**
✅ **Use `article_author` property** in Article_View events
✅ **Query via `/api/posthog-stats`** for aggregated stats
✅ **Use PostHog dashboard** for detailed insights
✅ **Helper functions available** in `src/lib/analytics/helpers.ts`

Start tracking authors now to understand which content creators drive the most engagement!
