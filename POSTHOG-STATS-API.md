# PostHog Stats API

Replace WordPress stats with real-time PostHog analytics data.

## Problem Solved

The WordPress stats dashboard (`/api/wordpress-author-stats`) had a bug where filtering by period didn't work - it always showed all-time stats.

**Solution**: Use PostHog analytics API to fetch filtered stats in real-time.

## Setup

### 1. Get PostHog Personal API Key

1. Go to [PostHog Settings](https://us.i.posthog.com/settings/user-api-keys)
2. Click "Create Personal API Key"
3. Name it: "Afrique Sports Stats API"
4. Copy the key (starts with `phx_...`)

### 2. Get PostHog Project ID

1. Go to [PostHog Project Settings](https://us.i.posthog.com/settings/project)
2. Find "Project ID" (usually a number like `21827`)

### 3. Add Environment Variables

Add to `.env.local`:

```bash
# PostHog Analytics API
POSTHOG_PERSONAL_API_KEY=phx_your_personal_api_key_here
POSTHOG_PROJECT_ID=21827
```

**Note**: These are server-side only variables (no `NEXT_PUBLIC_` prefix).

## API Endpoints

### PostHog Stats (Recommended)

**Endpoint**: `/api/posthog-stats`

**Parameters**:
- `period` (optional): `day`, `week`, `month`, `all` (default: `week`)

**Example**:
```bash
# Today's stats
curl https://www.afriquesports.net/api/posthog-stats?period=day

# Last week
curl https://www.afriquesports.net/api/posthog-stats?period=week

# Last month
curl https://www.afriquesports.net/api/posthog-stats?period=month

# All time
curl https://www.afriquesports.net/api/posthog-stats?period=all
```

**Response**:
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
    }
  ],
  "topPages": [
    { "path": "/fr/afrique/senegal/sadio-mane-123", "views": 125 },
    { "path": "/en/africa/nigeria/osimhen-456", "views": 98 }
  ],
  "metadata": {
    "source": "PostHog",
    "cacheMaxAge": 300
  }
}
```

### WordPress Stats (Fixed)

**Endpoint**: `/api/wordpress-author-stats`

**Fixed Issues**:
- Now accepts `period` parameter (was broken)
- Filters data by date range
- Returns consistent results

**Parameters**:
- `period` (optional): `day`, `week`, `month`, `all` (default: `week`)

**Example**:
```bash
# Today's WordPress stats
curl https://www.afriquesports.net/api/wordpress-author-stats?period=day
```

**Response**:
```json
{
  "authorStats": [
    {
      "authorName": "Claude AI",
      "totalPosts": 45,
      "frenchPosts": 20,
      "englishPosts": 15,
      "spanishPosts": 8,
      "arabicPosts": 2,
      "totalViews": 320
    }
  ]
}
```

## Migration Guide

### Before (Broken WordPress Stats)

```javascript
// BUG: period parameter ignored
fetch('/api/wordpress-author-stats')
```

### After - Option 1: Fixed WordPress

```javascript
// FIXED: period parameter now works
fetch(`/api/wordpress-author-stats?period=${currentPeriod}`)
```

### After - Option 2: PostHog (Recommended)

```javascript
// BETTER: Real-time analytics from PostHog
fetch(`/api/posthog-stats?period=${currentPeriod}`)
```

## Comparison

| Feature | WordPress Stats | PostHog Stats |
|---------|----------------|---------------|
| **Real-time** | No (cached in DB) | Yes |
| **Filtering** | Fixed now | Works |
| **Setup** | Uses existing DB | Needs API key |
| **Data Source** | `wp_afriquesports_visits` table | PostHog events |
| **Unique Visitors** | No | Yes |
| **Top Pages** | No | Yes |
| **Author Stats** | Yes (language breakdown) | Yes (simpler) |

## Events Tracked by PostHog

The following events are used for stats:

1. **`$pageview`**: All page views
   - Used for: Total page views, top pages, unique visitors

2. **`Article_View`**: Article-specific views
   - Properties: `article_id`, `article_slug`, `author`
   - Used for: Author stats, article performance

3. **`Article_Share`**: Social shares
   - Properties: `article_id`, `platform`

4. **`Search`**: Search queries
   - Properties: `query`, `results_count`

See [POSTHOG.md](./POSTHOG.md) for full event tracking documentation.

## Dashboard Integration

### Frontend Stats Dashboard

Update your stats dashboard HTML (e.g., `https://backoffice.afriquesports.net/api/stats-dashboard`):

```javascript
// OLD (broken)
fetch('/api/wordpress-author-stats')

// NEW (working)
fetch(`/api/posthog-stats?period=${selectedPeriod}`)
  .then(res => res.json())
  .then(data => {
    console.log('Total page views:', data.summary.totalPageViews);
    console.log('Author stats:', data.authorStats);
    console.log('Top pages:', data.topPages);
  });
```

### Filter Buttons

```html
<select id="period-filter" onchange="fetchStats()">
  <option value="day">Today</option>
  <option value="week">Last Week</option>
  <option value="month">Last Month</option>
  <option value="all">All Time</option>
</select>

<script>
function fetchStats() {
  const period = document.getElementById('period-filter').value;
  fetch(`/api/posthog-stats?period=${period}`)
    .then(res => res.json())
    .then(updateDashboard);
}
</script>
```

## Testing

### Test WordPress Stats Fix

```bash
# Test all periods
curl "https://www.afriquesports.net/api/wordpress-author-stats?period=day"
curl "https://www.afriquesports.net/api/wordpress-author-stats?period=week"
curl "https://www.afriquesports.net/api/wordpress-author-stats?period=month"
curl "https://www.afriquesports.net/api/wordpress-author-stats?period=all"
```

### Test PostHog Stats

```bash
# Test all periods
curl "http://localhost:3000/api/posthog-stats?period=day"
curl "http://localhost:3000/api/posthog-stats?period=week"
curl "http://localhost:3000/api/posthog-stats?period=month"
curl "http://localhost:3000/api/posthog-stats?period=all"
```

## Troubleshooting

### Error: "PostHog Personal API Key not configured"

**Solution**: Add `POSTHOG_PERSONAL_API_KEY` to `.env.local`

```bash
POSTHOG_PERSONAL_API_KEY=phx_abc123xyz...
```

### Error: "PostHog API error: 401 Unauthorized"

**Solution**: Check that your Personal API Key is valid:
1. Go to [PostHog API Keys](https://us.i.posthog.com/settings/user-api-keys)
2. Verify key exists and is not expired
3. Copy the correct key to `.env.local`

### Error: "PostHog API error: 403 Forbidden"

**Solution**: Your API key doesn't have permission to read events.
1. Create a new Personal API Key with "Read" permissions
2. Ensure you're using the correct Project ID

### No Data Returned

**Solution**: Check that PostHog is tracking events:
1. Go to [PostHog Live Events](https://us.i.posthog.com/events)
2. Look for `$pageview` and `Article_View` events
3. Verify events have the expected properties (`author`, `article_id`, etc.)

## Performance

- **Cache**: 5 minutes (300s) on server, 10 minutes (600s) on CDN
- **Response Time**: ~200-500ms (PostHog API)
- **Rate Limits**: PostHog allows 1000 req/min (Personal API Key)

## Security

- **API Keys**: Server-side only (not exposed to client)
- **CORS**: PostHog API calls from server (no browser CORS issues)
- **Authentication**: Personal API Key required

## Next Steps

1. Set up PostHog Personal API Key
2. Test both endpoints locally
3. Deploy to production
4. Update stats dashboard frontend to use new endpoint
5. Monitor PostHog dashboard for event tracking

## Resources

- [PostHog Events API](https://posthog.com/docs/api/events)
- [PostHog Query API](https://posthog.com/docs/api/query)
- [Creating Personal API Keys](https://posthog.com/docs/api/overview#personal-api-keys-recommended)
