# PostHog Tracking Verification Guide

**Date:** 2026-01-02
**Status:** Setup Complete - Verification Needed

## Summary

PostHog is configured and ready to track production visitors. However, we need to verify it's working by checking for real production events.

---

## Configuration Status

### ✅ Environment Variables (Production)

| Variable | Status | Value |
|----------|--------|-------|
| `NEXT_PUBLIC_POSTHOG_KEY` | ✅ Set | Encrypted |
| `NEXT_PUBLIC_POSTHOG_HOST` | ✅ Set | `https://us.i.posthog.com` |
| `POSTHOG_PROJECT_ID` | ✅ Set | `270285` |
| `POSTHOG_PERSONAL_API_KEY` | ✅ Set | For API access |

### ✅ Code Implementation

1. **PostHog Provider:** `src/components/providers/PostHogProvider.tsx`
   - Deferred initialization (3 seconds or on user interaction)
   - Tracks pageviews on route changes
   - Captures $pageview events with URL

2. **PostHog Initialization:** `src/lib/posthog.ts`
   - Configured with US instance
   - Autocapture enabled
   - Session recording enabled
   - Person profiles: identified only

3. **Layout Integration:** `src/app/[locale]/layout.tsx`
   - PostHogProvider wraps all pages
   - DNS prefetch for PostHog assets

### ✅ Production Page Status

- PostHog scripts are loaded
- DNS prefetch present: `https://us-assets.i.posthog.com`
- Component renders on production

---

## Why Only Local Events Showing

The PostHog API currently returns test data because:

1. **No Production Traffic Tracked Yet**
   - PostHog is configured but needs real user visits
   - The events you see are from local development (192.168.1.3:3000)

2. **Deferred Initialization**
   - PostHog waits 3 seconds or user interaction before initializing
   - This improves page performance but delays tracking

3. **First-Time Visitors**
   - PostHog needs time to collect data from real users
   - Events will appear as visitors browse the site

---

## How to Verify PostHog is Working

### Method 1: Browser DevTools (Recommended)

1. **Open Production Site:**
   ```
   https://www.afriquesports.net
   ```

2. **Open Browser DevTools:**
   - Press `F12` or `Ctrl+Shift+I` (Windows/Linux)
   - Or `Cmd+Option+I` (Mac)

3. **Go to Network Tab:**
   - Filter by "posthog" or "decide"
   - Look for requests to `us.i.posthog.com`

4. **Check for These Requests:**
   - `POST https://us.i.posthog.com/e/` - Event tracking
   - `POST https://us.i.posthog.com/decide/` - Feature flags
   - `POST https://us.i.posthog.com/s/` - Session recording

5. **Verify Response:**
   - Should return `{"status": 1}` or `{"status": "ok"}`

### Method 2: PostHog Live Events Dashboard

1. **Login to PostHog:**
   ```
   https://us.posthog.com
   ```

2. **Navigate to Live Events:**
   ```
   https://us.posthog.com/project/270285/events
   ```

3. **Check for Recent Events:**
   - Look for `$pageview` events
   - Check `$current_url` contains `afriquesports.net`
   - Verify timestamps are recent

4. **Filter Production Events:**
   - Filter by: `$current_url` contains `afriquesports.net`
   - Should exclude `192.168.1.3:3000` (local dev)

### Method 3: Console Logging

1. **Open Console in DevTools**

2. **Check for PostHog Messages:**
   ```
   PostHog loaded successfully
   ```
   (Only appears in development mode)

3. **Manually Test Tracking:**
   ```javascript
   // In browser console on production site
   posthog.capture('test_event', { test: true })
   ```

4. **Check PostHog Dashboard:**
   - Event should appear within 1-2 minutes
   - Look for `test_event` in Live Events

---

## Expected PostHog Events

Once production traffic flows, you should see:

### 1. Automatic Events

| Event | Description | Frequency |
|-------|-------------|-----------|
| `$pageview` | Page loads | Every page visit |
| `$pageleave` | User leaves page | Every page exit |
| `$autocapture` | Button clicks, form submissions | User interactions |

### 2. Custom Events (if implemented)

| Event | Description | Source |
|-------|-------------|--------|
| `Article_View_Page` | Article viewed | Custom tracking |
| Custom properties | Author, category, etc. | Event metadata |

---

## Troubleshooting

### Issue 1: No Network Requests to PostHog

**Symptoms:**
- No requests to `us.i.posthog.com` in Network tab
- Console shows warning: "PostHog environment variables not configured"

**Possible Causes:**
1. Environment variables not set in Vercel
2. Variables missing `NEXT_PUBLIC_` prefix
3. Build didn't include latest env vars

**Solution:**
```bash
# Verify env vars are set
vercel env ls | grep NEXT_PUBLIC_POSTHOG

# Should show:
# NEXT_PUBLIC_POSTHOG_KEY - Production
# NEXT_PUBLIC_POSTHOG_HOST - Production

# If missing, add them:
echo "YOUR_KEY" | vercel env add NEXT_PUBLIC_POSTHOG_KEY production
echo "https://us.i.posthog.com" | vercel env add NEXT_PUBLIC_POSTHOG_HOST production

# Redeploy
git commit --allow-empty -m "chore: trigger rebuild with PostHog env vars"
git push
```

### Issue 2: Events Not Appearing in Dashboard

**Symptoms:**
- Network requests succeed (200 OK)
- But no events in PostHog dashboard

**Possible Causes:**
1. Wrong project ID
2. API key doesn't have write permissions
3. Events filtered out

**Solution:**
1. Verify project ID in Network request payload
2. Check PostHog filters (remove all filters)
3. Wait 1-2 minutes for events to appear

### Issue 3: Only Local Events Showing

**Symptoms:**
- Events from `192.168.1.3:3000`
- No events from `afriquesports.net`

**Cause:**
- No production traffic yet
- Users haven't visited the site

**Solution:**
- Visit production site yourself
- Share with test users
- Wait for organic traffic

---

## Next Steps

### Immediate Verification

1. **Visit Production Site:**
   ```
   https://www.afriquesports.net
   ```

2. **Open DevTools → Network Tab**
   - Look for PostHog requests
   - Verify they return 200 OK

3. **Check PostHog Dashboard:**
   ```
   https://us.posthog.com/project/270285/events
   ```
   - Filter by production URLs
   - Look for recent $pageview events

### If Everything Works

✅ PostHog is tracking correctly!
- Events will accumulate as users visit
- Analytics dashboard at `/api/posthog-stats` will show real data
- Author stats will include actual authors

### If No Events Appear

1. Check environment variables (see Troubleshooting above)
2. Verify PostHog key has correct permissions
3. Check browser console for errors
4. Try manual event capture in console

---

## Files to Check

### Configuration Files
- `src/lib/posthog.ts` - PostHog initialization
- `src/components/providers/PostHogProvider.tsx` - React provider
- `src/app/[locale]/layout.tsx` - Provider integration

### Environment Variables
- `NEXT_PUBLIC_POSTHOG_KEY` - Client-side API key (must be NEXT_PUBLIC_)
- `NEXT_PUBLIC_POSTHOG_HOST` - PostHog instance URL
- `POSTHOG_PROJECT_ID` - Project ID (270285)
- `POSTHOG_PERSONAL_API_KEY` - Server-side API key (for /api/posthog-stats)

---

## Summary

**Current Status:**
- ✅ PostHog configured correctly
- ✅ Scripts loading on production
- ✅ Environment variables set
- ⏳ Waiting for production traffic

**To Verify:**
1. Open production site with DevTools
2. Check Network tab for PostHog requests
3. Visit PostHog dashboard for live events
4. Confirm events from `afriquesports.net` domain

**Expected Result:**
Within minutes of visiting the production site, you should see `$pageview` events in the PostHog dashboard with URLs from `afriquesports.net`.

---

**Last Updated:** 2026-01-02
**PostHog Project:** Afrique Sports (ID: 270285)
**Instance:** US Cloud (us.i.posthog.com)
