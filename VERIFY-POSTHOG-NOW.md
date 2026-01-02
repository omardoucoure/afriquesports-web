# Quick PostHog Verification Steps

**Follow these steps RIGHT NOW to verify PostHog tracking:**

## Step 1: Open Production Site with DevTools

1. **Open this URL in a new browser tab:**
   ```
   https://www.afriquesports.net
   ```

2. **Open DevTools** (before the page loads):
   - **Chrome/Edge:** Press `F12` or `Ctrl+Shift+I`
   - **Mac:** Press `Cmd+Option+I`

3. **Go to "Network" tab**

4. **Reload the page** (`Ctrl+R` or `Cmd+R`)

---

## Step 2: Look for PostHog Requests

In the Network tab, filter by typing: `posthog` or `decide`

### What to Look For:

**✅ You SHOULD see these requests:**

1. **Request to PostHog assets:**
   ```
   https://us-assets.i.posthog.com/static/...
   ```
   - Status: 200
   - This loads PostHog scripts

2. **Request to /decide endpoint:**
   ```
   POST https://us.i.posthog.com/decide/
   ```
   - Status: 200
   - Response: `{"status": 1, ...}`

3. **Event tracking requests:**
   ```
   POST https://us.i.posthog.com/e/
   ```
   - Status: 200
   - This sends pageview events

### ❌ If You See:

- **No requests to PostHog:** Environment variables might not be set correctly
- **403 Forbidden:** API key is invalid
- **CORS errors:** PostHog host configuration issue

---

## Step 3: Check Console for Errors

1. **Go to "Console" tab** in DevTools

2. **Look for:**
   - ✅ **No errors** = Good!
   - ❌ `PostHog environment variables not configured` = Variables missing
   - ❌ Any red errors mentioning PostHog = Configuration issue

3. **Test Manual Event:**
   ```javascript
   // Type this in the console and press Enter:
   posthog.capture('manual_test', { source: 'verification' })
   ```
   - Should return: `undefined` (no errors)
   - Event should appear in PostHog dashboard within 1 minute

---

## Step 4: Check PostHog Dashboard

1. **Open PostHog Dashboard:**
   ```
   https://us.posthog.com/project/270285/events
   ```

2. **Click "Live" button** (top right)
   - Shows events in real-time

3. **Look for Recent Events:**
   - Event: `$pageview`
   - URL contains: `afriquesports.net`
   - Timestamp: Within last few minutes

4. **If you captured manual test:**
   - Event: `manual_test`
   - Properties: `{source: 'verification'}`

---

## Step 5: What You Should See

### ✅ Success Indicators:

1. **Network Tab:**
   - Requests to `us.i.posthog.com` with Status 200
   - At least 2-3 requests (decide, capture, etc.)

2. **Console:**
   - No errors mentioning PostHog
   - Clean console or normal warnings only

3. **PostHog Dashboard:**
   - Recent events from `afriquesports.net`
   - $pageview events appearing
   - Event count increasing

### ❌ Problem Indicators:

1. **No PostHog requests in Network tab**
   → Environment variables not loaded

2. **Console shows "environment variables not configured"**
   → NEXT_PUBLIC_POSTHOG_KEY or NEXT_PUBLIC_POSTHOG_HOST missing

3. **403 errors**
   → API key invalid or wrong project

4. **No events in dashboard**
   → Events not being sent or wrong project ID

---

## Quick Fixes

### If No PostHog Requests:

```bash
# Check environment variables
vercel env ls | grep NEXT_PUBLIC_POSTHOG

# If missing, the deployment needs to include them
# (They were added 3 days ago, should be there)
```

### If Console Shows Errors:

1. Clear browser cache
2. Hard reload (`Ctrl+Shift+R` or `Cmd+Shift+R`)
3. Try incognito/private window

### If Events Not in Dashboard:

1. Check you're logged into PostHog
2. Verify you're viewing Project 270285
3. Remove any filters in Events view
4. Wait 1-2 minutes for events to propagate

---

## Report Back

After following these steps, tell me:

1. **Do you see PostHog requests in Network tab?** (Yes/No)
2. **Any errors in Console?** (Yes/No - what errors?)
3. **Do events appear in PostHog dashboard?** (Yes/No)

This will help me determine if PostHog is working correctly or if we need to fix something.

---

## Expected Results

**If everything is working:**
- ✅ Network requests to PostHog
- ✅ No console errors
- ✅ Events in dashboard
- ✅ Production URLs (afriquesports.net) in event data

**Current Status:**
- PostHog is configured and deployed
- Environment variables are set
- Scripts are loaded on the page
- **Just needs real user visits to start collecting data**

The reason you only see "Test Author Name" is because the only events so far are from local development testing. Once you visit the production site yourself, you should see real production events!
