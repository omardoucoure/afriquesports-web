# PostHog Setup Guide for Afrique Sports

## Current Status

✅ **Client-side PostHog**: Already installed and configured
- Package: `posthog-js@1.309.1` and `posthog-node@5.17.4`
- Key: `phc_Gq0AQAld7nRpXz0X8Et9CYX4abM7UP6rYYUCh5rwtqV`
- Host: `https://us.i.posthog.com`

⏳ **Server-side Stats API**: Needs Personal API Key

## Quick Setup (5 minutes)

### Step 1: Get PostHog Personal API Key

1. **Login to PostHog**: https://us.i.posthog.com
2. **Go to API Keys**: https://us.i.posthog.com/settings/user-api-keys
3. **Click "Create Personal API Key"**
   - Name: `Afrique Sports Stats API`
   - Scopes: Check "✓ Read events" and "✓ Read insights"
4. **Copy the key** (starts with `phx_...`)
5. **Get Project ID**: https://us.i.posthog.com/settings/project
   - Look for "Project ID" (e.g., `21827`)

### Step 2: Add Environment Variables

#### For Local Development

Add to `.env.local`:

```bash
# PostHog Client-side (Already configured)
NEXT_PUBLIC_POSTHOG_KEY=phc_Gq0AQAld7nRpXz0X8Et9CYX4abM7UP6rYYUCh5rwtqV
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# PostHog Server-side API (NEW - Add this!)
POSTHOG_PERSONAL_API_KEY=phx_your_personal_api_key_here
POSTHOG_PROJECT_ID=your_project_id_here
```

#### For Production (Vercel)

1. Go to: https://vercel.com/your-project/settings/environment-variables
2. Add these variables:

| Name | Value | Environment |
|------|-------|-------------|
| `NEXT_PUBLIC_POSTHOG_KEY` | `phc_Gq0AQAld7nRpXz0X8Et9CYX4abM7UP6rYYUCh5rwtqV` | Production |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://us.i.posthog.com` | Production |
| `POSTHOG_PERSONAL_API_KEY` | `phx_your_key_here` | Production |
| `POSTHOG_PROJECT_ID` | `your_project_id` | Production |

3. **Redeploy** your project

### Step 3: Test the Setup

#### Test Client-side Tracking (Should already work)

```bash
# Open your site
open https://www.afriquesports.net

# Check browser console - should see:
# "PostHog loaded successfully"
```

#### Test Server-side Stats API (After adding keys)

```bash
# Local test
curl http://localhost:3000/api/posthog-stats?period=day

# Production test
curl https://www.afriquesports.net/api/posthog-stats?period=day
```

**Expected Response**:
```json
{
  "period": "day",
  "summary": {
    "totalPageViews": 1250,
    "totalArticleViews": 890,
    "uniqueVisitors": 345
  },
  "authorStats": [...],
  "topPages": [...]
}
```

## What's Already Configured

### 1. PostHog Client-side Tracking ✅

**File**: `src/lib/posthog.ts`
- Automatic pageview tracking
- User behavior analytics
- Session recording (disabled by default)
- Autocapture enabled

### 2. Analytics Manager ✅

**File**: `src/lib/analytics/manager.ts`
- Multi-provider support (PostHog + GA4)
- Event batching and queuing
- Custom event tracking

### 3. Custom Event Tracking ✅

**Available Events**:
- `Article_View` - Article page views
- `Article_Share` - Social shares
- `Search` - Search queries
- `Video_Play` - Video interactions
- `Category_View` - Category navigation
- `Poll_Vote` - Poll interactions
- `Newsletter_Signup` - Newsletter subscriptions

See [POSTHOG.md](./POSTHOG.md) for full list.

### 4. Stats API Endpoint ✅

**File**: `src/app/api/posthog-stats/route.ts`
- Period filtering (day/week/month/all)
- Author statistics
- Top pages ranking
- Unique visitor tracking

## Usage Examples

### Track Article View (Client-side)

```typescript
import { analytics } from '@/lib/analytics'

analytics.trackArticleView(
  'article-123',
  'Sadio Mané marque encore',
  'senegal'
)
```

### Fetch Stats (Server-side or Client-side)

```typescript
// Fetch today's stats
const response = await fetch('/api/posthog-stats?period=day')
const data = await response.json()

console.log('Page views today:', data.summary.totalPageViews)
console.log('Unique visitors:', data.summary.uniqueVisitors)
console.log('Top authors:', data.authorStats)
```

## Troubleshooting

### Error: "PostHog Personal API Key not configured"

**Solution**: Add `POSTHOG_PERSONAL_API_KEY` to environment variables

```bash
# .env.local
POSTHOG_PERSONAL_API_KEY=phx_abc123xyz...
```

### Error: "PostHog API error: 401 Unauthorized"

**Solution**: Your Personal API Key is invalid or expired
1. Generate a new key: https://us.i.posthog.com/settings/user-api-keys
2. Update `.env.local`
3. Restart dev server: `npm run dev`

### Error: "PostHog API error: 403 Forbidden"

**Solution**: API key doesn't have "Read events" permission
1. Delete old key
2. Create new key with "Read events" scope
3. Update environment variables

### No events in PostHog dashboard

**Solution**: Check that PostHog is initialized
1. Open browser console
2. Look for "PostHog loaded successfully"
3. Check Network tab for `https://us.i.posthog.com/e/` requests

## Migration from WordPress Stats

Replace WordPress stats endpoint with PostHog:

### Before (WordPress - Fixed but limited)

```javascript
fetch(`/api/wordpress-author-stats?period=${period}`)
```

### After (PostHog - Real-time analytics)

```javascript
fetch(`/api/posthog-stats?period=${period}`)
  .then(res => res.json())
  .then(data => {
    // More data available!
    console.log('Unique visitors:', data.summary.uniqueVisitors)
    console.log('Top pages:', data.topPages)
  })
```

## Dashboard Integration

Update your stats dashboard to use PostHog:

```html
<!-- Period filter -->
<select id="period" onchange="fetchStats()">
  <option value="day">Today</option>
  <option value="week">This Week</option>
  <option value="month">This Month</option>
  <option value="all">All Time</option>
</select>

<!-- Stats display -->
<div id="stats"></div>

<script>
async function fetchStats() {
  const period = document.getElementById('period').value;
  const response = await fetch(`/api/posthog-stats?period=${period}`);
  const data = await response.json();

  document.getElementById('stats').innerHTML = `
    <h2>Statistics (${period})</h2>
    <p>Total Page Views: ${data.summary.totalPageViews}</p>
    <p>Unique Visitors: ${data.summary.uniqueVisitors}</p>
    <p>Article Views: ${data.summary.totalArticleViews}</p>

    <h3>Top Authors</h3>
    <ul>
      ${data.authorStats.map(author => `
        <li>${author.authorName}: ${author.totalViews} views (${author.totalPosts} posts)</li>
      `).join('')}
    </ul>

    <h3>Top Pages</h3>
    <ul>
      ${data.topPages.map(page => `
        <li>${page.path}: ${page.views} views</li>
      `).join('')}
    </ul>
  `;
}

// Load initial stats
fetchStats();
</script>
```

## Next Steps

1. ✅ PostHog packages installed
2. ⏳ Get Personal API Key from PostHog dashboard
3. ⏳ Add environment variables
4. ⏳ Test `/api/posthog-stats` endpoint
5. ⏳ Update stats dashboard frontend
6. ⏳ Deploy to production

## Resources

- **PostHog Dashboard**: https://us.i.posthog.com
- **API Keys**: https://us.i.posthog.com/settings/user-api-keys
- **Project Settings**: https://us.i.posthog.com/settings/project
- **Events API Docs**: https://posthog.com/docs/api/events
- **Local Documentation**: [POSTHOG.md](./POSTHOG.md), [POSTHOG-STATS-API.md](./POSTHOG-STATS-API.md)
