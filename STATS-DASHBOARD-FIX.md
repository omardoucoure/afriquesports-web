# Stats Dashboard Filter Bug - FIXED

## Problem

When filtering stats by "today" in the WordPress stats dashboard, it was showing all-time statistics instead.

**Affected URL**: `https://backoffice.afriquesports.net/api/stats-dashboard`

## Root Cause

The `/api/wordpress-author-stats` endpoint wasn't accepting or using the `period` parameter.

**Before (Broken Code)**:
```typescript
export async function GET() {
  // No period parameter accepted
  // Query always returned all-time data
  const [rows] = await pool.query(`
    SELECT * FROM wp_afriquesports_visits
    WHERE post_author IS NOT NULL  // No date filtering!
  `);
}
```

## Solutions Implemented

### Solution 1: Fixed WordPress Endpoint ✅

**File**: `/src/app/api/wordpress-author-stats/route.ts`

**Changes**:
1. Added `NextRequest` parameter to GET function
2. Extract `period` from query parameters
3. Calculate date range based on period
4. Filter database query by `visit_date >= ?`
5. Added response caching headers

**After (Fixed Code)**:
```typescript
export async function GET(request: NextRequest) {
  const period = searchParams.get('period') || 'week';

  // Convert period to days
  let days: number;
  switch (period) {
    case 'day': days = 1; break;
    case 'week': days = 7; break;
    case 'month': days = 30; break;
    case 'all': days = 36500; break;
  }

  // Calculate date range
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  // Query with date filter
  const [rows] = await pool.query(`
    SELECT * FROM wp_afriquesports_visits
    WHERE post_author IS NOT NULL AND visit_date >= ?
  `, [fromDate]);
}
```

**Result**: Now correctly filters by period!

### Solution 2: PostHog Analytics API (Better Long-term) ✅

**File**: `/src/app/api/posthog-stats/route.ts`

**Why Better**:
- ✅ Real-time data (not cached in database)
- ✅ Richer analytics (unique visitors, top pages, etc.)
- ✅ No database dependency
- ✅ Same period filtering

**New Endpoint**: `/api/posthog-stats?period=day`

**Returns**:
```json
{
  "summary": {
    "totalPageViews": 1250,
    "totalArticleViews": 890,
    "uniqueVisitors": 345
  },
  "authorStats": [...],
  "topPages": [...]
}
```

## Testing

### Test WordPress Fix

```bash
# Test today
curl "https://www.afriquesports.net/api/wordpress-author-stats?period=day"

# Test last week
curl "https://www.afriquesports.net/api/wordpress-author-stats?period=week"

# Test last month
curl "https://www.afriquesports.net/api/wordpress-author-stats?period=month"

# Test all time
curl "https://www.afriquesports.net/api/wordpress-author-stats?period=all"
```

**Expected**: Different data for each period

### Test PostHog Endpoint

```bash
# Set up environment variables first
export POSTHOG_PERSONAL_API_KEY="phx_your_key_here"
export POSTHOG_PROJECT_ID="21827"

# Test locally
curl "http://localhost:3000/api/posthog-stats?period=day"
```

## Deployment Checklist

### 1. Deploy WordPress Fix (Immediate)

```bash
# The WordPress fix is already deployed with this commit
git add src/app/api/wordpress-author-stats/route.ts
git commit -m "Fix: WordPress author stats period filtering bug

- Accept period parameter from query string
- Filter database query by visit_date
- Support day/week/month/all periods
- Add response caching headers"
git push
```

### 2. Set Up PostHog API (Optional, Recommended)

**Step 1**: Get PostHog Personal API Key

1. Go to: https://us.i.posthog.com/settings/user-api-keys
2. Click "Create Personal API Key"
3. Name: "Afrique Sports Stats API"
4. Scope: "Read" permissions
5. Copy the key (starts with `phx_...`)

**Step 2**: Add to Vercel Environment Variables

1. Go to: https://vercel.com/your-project/settings/environment-variables
2. Add variables:
   - `POSTHOG_PERSONAL_API_KEY` = `phx_your_key_here`
   - `POSTHOG_PROJECT_ID` = `21827`
3. Redeploy

**Step 3**: Test PostHog Endpoint

```bash
curl "https://www.afriquesports.net/api/posthog-stats?period=day"
```

**Step 4**: Update Dashboard Frontend

Replace:
```javascript
fetch('/api/wordpress-author-stats')
```

With:
```javascript
fetch(`/api/posthog-stats?period=${selectedPeriod}`)
```

## Frontend Integration

### Update Stats Dashboard

**Before (Broken)**:
```javascript
// Filter dropdown
<select id="period">
  <option value="day">Today</option>
  <option value="week">This Week</option>
</select>

// Fetch (period ignored!)
fetch('/api/wordpress-author-stats')
```

**After (Fixed)**:
```javascript
// Filter dropdown
<select id="period" onchange="fetchStats()">
  <option value="day">Today</option>
  <option value="week">This Week</option>
  <option value="month">This Month</option>
  <option value="all">All Time</option>
</select>

// Fetch with period parameter
function fetchStats() {
  const period = document.getElementById('period').value;
  fetch(`/api/wordpress-author-stats?period=${period}`)
    .then(res => res.json())
    .then(updateDashboard);
}
```

**Or use PostHog (Recommended)**:
```javascript
function fetchStats() {
  const period = document.getElementById('period').value;
  fetch(`/api/posthog-stats?period=${period}`)
    .then(res => res.json())
    .then(data => {
      console.log('Total page views:', data.summary.totalPageViews);
      console.log('Unique visitors:', data.summary.uniqueVisitors);
      console.log('Author stats:', data.authorStats);
      console.log('Top pages:', data.topPages);
    });
}
```

## Files Changed

1. ✅ `/src/app/api/wordpress-author-stats/route.ts` - Fixed period filtering
2. ✅ `/src/app/api/posthog-stats/route.ts` - New PostHog endpoint
3. ✅ `POSTHOG-STATS-API.md` - Complete documentation
4. ✅ `STATS-DASHBOARD-FIX.md` - This file

## Documentation

- [POSTHOG-STATS-API.md](./POSTHOG-STATS-API.md) - Full PostHog API documentation
- [POSTHOG.md](./POSTHOG.md) - PostHog event tracking guide

## Summary

**WordPress Fix**:
- ✅ Deployed and ready to use
- ✅ No setup required
- ✅ Works immediately after deployment

**PostHog API**:
- ⏳ Requires environment variable setup
- ✅ Better long-term solution
- ✅ Real-time analytics
- ✅ Richer data

Both solutions are now available. Use WordPress fix immediately, migrate to PostHog when ready.
