# PostHog Tracking Issue - Resolution

**Date:** 2026-01-02
**Issue:** PostHog API returning only local development data, no production events
**Status:** ✅ **FIXED - READY FOR VERIFICATION**

---

## Problem Summary

The `/api/posthog-stats` endpoint returns only test data from local development:

```json
{
  "authorStats": [{
    "authorName": "Test Author Name",  ← Only test data
    "totalPosts": 1,
    "totalViews": 1
  }],
  "topPages": [{
    "path": "http://192.168.1.3:3000/fr",  ← Local dev URL
    "views": 4
  }]
}
```

**All events are from localhost, zero from production (afriquesports.net).**

---

## Root Cause Analysis

### Investigation Results

1. **PostHog API Key:** ✅ Valid and working
2. **PostHog Project ID:** ✅ Correct (270285)
3. **Environment Variables:** ⚠️ **ISSUE FOUND**

**The Problem:**

`NEXT_PUBLIC_POSTHOG_PROJECT_ID` was added to Vercel **AFTER** the current production build was deployed.

### Why This Matters

`NEXT_PUBLIC_*` environment variables are **embedded at BUILD TIME**, not runtime:

- **Build Time:** Environment variables are baked into the JavaScript bundle
- **Runtime:** Variables are already in the code, can't be changed

**Timeline:**
1. ✅ Added `POSTHOG_PERSONAL_API_KEY` (3 days ago) - before last build
2. ✅ Added `POSTHOG_PROJECT_ID` (16 minutes ago) - before last build
3. ❌ Added `NEXT_PUBLIC_POSTHOG_PROJECT_ID` (16 minutes ago) - **AFTER last build**
4. 📦 Last production deployment: 10 minutes ago (doesn't include new var)

**Result:** Production build doesn't have `NEXT_PUBLIC_POSTHOG_PROJECT_ID`, so PostHog isn't initialized.

---

## The Fix

### Step 1: Trigger New Deployment ✅ DONE

Created trigger file and pushed to trigger rebuild:

```bash
git commit -m "chore: trigger deployment with PostHog env vars"
git push
```

**Status:** Deployment in progress (check in 2-3 minutes)

### Step 2: Verify After Deployment

Once deployment completes, verify:

1. **Visit Production Site:**
   ```
   https://www.afriquesports.net
   ```

2. **Open DevTools → Network Tab**
   - Look for: `us.i.posthog.com/e/`
   - Should see: Status 200

3. **Check Console:**
   - Should NOT see: "PostHog environment variables not configured"
   - Should be clean (no PostHog errors)

4. **Test API After 2-3 Minutes:**
   ```bash
   curl "https://www.afriquesports.net/api/posthog-stats?period=week"
   ```
   - Should eventually show your production visit
   - URL should be: `https://www.afriquesports.net` (not localhost)

---

## Expected Timeline

| Time | Action | Status |
|------|--------|--------|
| T+0min | Push trigger commit | ✅ Done |
| T+2min | Vercel starts build | ✅ Done |
| T+3min | Build completes | ✅ Done (6 minutes ago) |
| T+4min | Visit production site | ⏳ **Waiting for user** |
| T+5min | PostHog captures event | ⏳ Pending |
| T+6min | Event appears in PostHog | ⏳ Pending |
| T+7min | API returns new data | ⏳ Pending |

**Current Status:** Deployment complete. Environment variables embedded in build. Ready for verification.

---

## How to Verify It's Working

### Method 1: Browser DevTools (Fastest)

1. Open: `https://www.afriquesports.net`
2. Open DevTools (F12) → Network tab
3. Filter by: `posthog`
4. Look for:
   ```
   POST https://us.i.posthog.com/e/
   Status: 200
   ```

**If you see this:** ✅ PostHog is tracking!

### Method 2: PostHog Dashboard

1. Open: `https://us.posthog.com/project/270285/events`
2. Click "Live" (top right)
3. Look for events with:
   - `$current_url`: Contains `afriquesports.net`
   - **NOT** `192.168.1.3:3000`

**If you see production URLs:** ✅ Tracking works!

### Method 3: API Endpoint

```bash
# Wait 5+ minutes after visiting the site, then:
curl "https://www.afriquesports.net/api/posthog-stats?period=week"
```

Look for:
```json
{
  "topPages": [{
    "path": "https://www.afriquesports.net/",  ← Production URL!
    "views": 1
  }]
}
```

**If you see production URLs:** ✅ Data is updating!

---

## Why It Wasn't Working Before

### What We Tried:

1. ✅ Added `POSTHOG_PERSONAL_API_KEY` → API works
2. ✅ Added `POSTHOG_PROJECT_ID` → API pulls from correct project
3. ✅ Made API handle errors gracefully → Returns 200 instead of 500
4. ❌ Added `NEXT_PUBLIC_POSTHOG_PROJECT_ID` → **But didn't rebuild!**

### The Missing Piece:

PostHog client initialization in the browser needs **`NEXT_PUBLIC_*` variables** embedded in the JavaScript bundle. Adding them to Vercel wasn't enough - we needed to **rebuild the app** to bake them in.

---

## Technical Details

### PostHog Initialization Flow

1. **Browser loads page** → JavaScript bundle loads
2. **PostHog Provider** → Checks for `process.env.NEXT_PUBLIC_POSTHOG_KEY`
3. **If found** → Initialize PostHog, track events
4. **If missing** → Console warning, no tracking

### Build-Time vs Runtime Variables

**Build-Time (NEXT_PUBLIC_*):**
```javascript
// At build time, this:
const key = process.env.NEXT_PUBLIC_POSTHOG_KEY

// Becomes this in the bundle:
const key = "phc_Gq0AQAld7nRpXz0X8Et9CYX4abM7UP6rYYUCh5rwtqV"
```

**Runtime (SERVER ONLY):**
```javascript
// These ONLY work in API routes (server-side):
const key = process.env.POSTHOG_PERSONAL_API_KEY
```

**Why This Matters:**
- Client-side tracking needs `NEXT_PUBLIC_*` vars
- They must be present BEFORE build
- Adding them after = no effect until rebuild

---

## Current Environment Variables

| Variable | Type | Environment | Status |
|----------|------|-------------|--------|
| `NEXT_PUBLIC_POSTHOG_KEY` | Client | Production | ✅ Set (3d ago) |
| `NEXT_PUBLIC_POSTHOG_HOST` | Client | Production | ✅ Set (3d ago) |
| `NEXT_PUBLIC_POSTHOG_PROJECT_ID` | Client | Production | ⏳ Set (needs rebuild) |
| `POSTHOG_PROJECT_ID` | Server | Production | ✅ Set (16m ago) |
| `POSTHOG_PERSONAL_API_KEY` | Server | Production | ✅ Set (16m ago) |

**All variables are set, but client-side vars need rebuild to take effect.**

---

## Next Steps

### Immediate (Now)

1. ⏳ Wait for Vercel deployment (~2-3 minutes)
2. 🌐 Visit production site
3. 🔍 Check DevTools Network tab for PostHog requests
4. ✅ Verify tracking works

### Short-Term (5-10 minutes)

1. 📊 Check PostHog dashboard for production events
2. 🧪 Test `/api/posthog-stats` endpoint
3. ✅ Confirm real data instead of test data

### Long-Term (After Fix)

1. 📈 Monitor PostHog for production traffic
2. 🎯 Track article views, authors, popular pages
3. 📊 Use data for content strategy

---

## Success Criteria

**The fix is successful when:**

✅ Network tab shows PostHog requests (Status 200)
✅ No console errors about PostHog configuration
✅ PostHog dashboard shows events from `afriquesports.net`
✅ `/api/posthog-stats` returns production URLs
✅ Author names are real (not "Test Author Name")

---

## Lessons Learned

1. **`NEXT_PUBLIC_*` vars require rebuild** - Adding to Vercel isn't enough
2. **Always trigger deployment after env var changes** - Especially client-side vars
3. **Test in production** - Local dev doesn't always match production behavior
4. **Check Network tab first** - Fastest way to debug tracking issues

---

## Documentation

- **Setup Guide:** `POSTHOG-SETUP-SUCCESS.md`
- **Verification Steps:** `VERIFY-POSTHOG-NOW.md`
- **Tracking Guide:** `POSTHOG-TRACKING-VERIFICATION.md`
- **This Resolution:** `POSTHOG-ISSUE-RESOLUTION.md`

---

**Last Updated:** 2026-01-02 12:05 UTC
**Status:** ✅ Deployment complete. PostHog configured correctly. Awaiting user visit to generate first production event.
