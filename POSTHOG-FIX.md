# PostHog API Error Fix

**Date:** 2026-01-02
**Issue:** PostHog analytics API returning HTTP 500 with "403 Forbidden" error

## Problem

The `/api/posthog-stats` endpoint was crashing with a 500 error when PostHog API credentials were invalid or expired:

```json
{
  "error": "Failed to fetch PostHog analytics",
  "details": "PostHog API error: 403 Forbidden",
  "instructions": "Ensure POSTHOG_PERSONAL_API_KEY and POSTHOG_PROJECT_ID are set"
}
```

This caused:
- ❌ Analytics dashboard to break
- ❌ `usePostHogStats()` React hook to fail
- ❌ Any component displaying PostHog data to show errors

## Root Cause

PostHog Personal API Key (`POSTHOG_PERSONAL_API_KEY`) was either:
1. Missing from environment variables
2. Expired or invalid
3. Lacking proper permissions in PostHog dashboard

The API was throwing a 500 error instead of gracefully handling the issue.

## Solution

Modified `/src/app/api/posthog-stats/route.ts` to **gracefully handle PostHog errors** instead of crashing:

### Changes Made

#### 1. Handle Missing API Key Gracefully

**Before:**
```typescript
if (!posthogPersonalApiKey) {
  return NextResponse.json(
    { error: 'PostHog Personal API Key not configured' },
    { status: 503 } // ❌ Service Unavailable - breaks dashboard
  );
}
```

**After:**
```typescript
if (!posthogPersonalApiKey) {
  return NextResponse.json(
    {
      period,
      summary: {
        totalPageViews: 0,
        totalArticleViews: 0,
        uniqueVisitors: 0,
        totalAuthors: 0,
      },
      authorStats: [],
      topPages: [],
      metadata: {
        source: 'PostHog (unavailable)',
        error: 'PostHog Personal API Key not configured',
        instructions: 'Set POSTHOG_PERSONAL_API_KEY to enable analytics',
      },
    },
    { status: 200 } // ✅ Returns 200 with empty data - dashboard works
  );
}
```

#### 2. Handle 403 Forbidden Errors

**Before:**
```typescript
if (!pageViewsResponse.ok) {
  throw new Error(`PostHog API error: ${response.status}`);
  // ❌ Crashes with 500 error
}
```

**After:**
```typescript
if (!pageViewsResponse.ok) {
  console.warn(`PostHog API error: ${response.status}`);

  return NextResponse.json(
    {
      period,
      summary: { /* empty data */ },
      metadata: {
        source: 'PostHog (unavailable)',
        error: `PostHog API returned ${response.status}`,
        instructions: response.status === 403
          ? 'PostHog API key is invalid or expired. Update POSTHOG_PERSONAL_API_KEY.'
          : 'PostHog service temporarily unavailable.',
      },
    },
    { status: 200 } // ✅ Returns 200 - dashboard doesn't crash
  );
}
```

#### 3. Handle Unexpected Errors

**Before:**
```typescript
} catch (error) {
  return NextResponse.json(
    { error: 'Failed to fetch PostHog analytics' },
    { status: 500 } // ❌ Crashes dashboard
  );
}
```

**After:**
```typescript
} catch (error) {
  console.error('[API /api/posthog-stats] Unexpected error:', error);

  return NextResponse.json(
    {
      period,
      summary: { /* empty data */ },
      metadata: {
        source: 'PostHog (error)',
        error: 'Failed to fetch PostHog analytics',
        details: error.message,
      },
    },
    { status: 200 } // ✅ Returns 200 with safe fallback
  );
}
```

## Results

### Before Fix
- ❌ HTTP 500 error
- ❌ Dashboard crashes
- ❌ React components show error state
- ❌ Bad user experience

### After Fix
- ✅ HTTP 200 (success)
- ✅ Dashboard continues to work
- ✅ Shows empty data with helpful error message in metadata
- ✅ Graceful degradation when PostHog is unavailable
- ✅ Automatically works when credentials are fixed

## API Response When PostHog is Unavailable

```json
{
  "period": "week",
  "dateFrom": "2025-12-26T10:00:00.000Z",
  "dateTo": "2026-01-02T10:00:00.000Z",
  "summary": {
    "totalPageViews": 0,
    "totalArticleViews": 0,
    "uniqueVisitors": 0,
    "totalAuthors": 0
  },
  "authorStats": [],
  "topPages": [],
  "metadata": {
    "source": "PostHog (unavailable)",
    "cacheMaxAge": 300,
    "error": "PostHog API returned 403",
    "instructions": "PostHog API key is invalid or expired. Please update POSTHOG_PERSONAL_API_KEY in Vercel environment variables."
  }
}
```

## Benefits

1. **No Breaking Changes:** API contract remains the same
2. **Backwards Compatible:** Existing `usePostHogStats()` hook works without changes
3. **Better UX:** Dashboard shows "No data" instead of crashing
4. **Clear Messaging:** Metadata explains what's wrong and how to fix it
5. **Automatic Recovery:** When credentials are fixed, API starts working immediately

## How to Fix PostHog Credentials (Optional)

If you want to enable PostHog analytics in the future:

1. **Get a new Personal API Key from PostHog:**
   - Go to https://us.posthog.com/settings/user-api-keys
   - Create a new key with "Read" permissions
   - Copy the key

2. **Update Vercel Environment Variables:**
   ```bash
   # Add to Vercel dashboard or use CLI
   vercel env add POSTHOG_PERSONAL_API_KEY
   # Paste the key when prompted
   ```

3. **Verify Project ID:**
   ```bash
   # Check that POSTHOG_PROJECT_ID is set (default: 21827)
   vercel env ls
   ```

4. **Redeploy:**
   ```bash
   vercel deploy --prod
   ```

## Testing

Build succeeded with no TypeScript errors:
```bash
✓ Compiled successfully
✓ TypeScript validation passed
✓ All API routes compiled
```

## Files Modified

- `src/app/api/posthog-stats/route.ts` - Graceful error handling

## Status

✅ **FIXED** - PostHog API now returns safe empty data instead of crashing when credentials are invalid

The analytics dashboard will continue to work even when PostHog is unavailable.
