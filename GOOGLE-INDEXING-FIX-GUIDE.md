# Google Video Indexing Fix Guide

## Problem Summary

Google Search Console is indexing **96 malformed video URLs** (9.6% of total) with incorrect path structures:

### Malformed Patterns:
```
❌ /en/https:/article-slug
❌ /es/https:/article-slug
❌ /https:/article-slug
```

### Should Be:
```
✅ /en/football/article-slug
✅ /es/football/article-slug
✅ /football/article-slug
```

This causes:
- ❌ 404 errors for visitors
- ❌ Poor user experience
- ❌ Lost search traffic
- ❌ Incorrect video indexing in Google

## Solution Overview

We've implemented a **3-layer fix**:

1. **Middleware** - Redirects malformed URLs (immediate fix)
2. **Database Fix** - Corrects source data (permanent fix)
3. **Google Resubmission** - Updates search index (recovery)

## Step 1: Deploy Middleware (Immediate Fix)

The middleware catches malformed URLs and redirects them with 301 (permanent redirect).

### File Created:
- `middleware.ts` - Automatic URL redirects

### How It Works:
```typescript
/en/https:/article-slug  →  /en/football/article-slug (301 redirect)
/https:/article-slug     →  /football/article-slug (301 redirect)
```

### Deploy:
```bash
git add middleware.ts
git commit -m "fix: add middleware to redirect malformed video URLs"
git push origin main
vercel --prod
```

**Result:** All malformed URLs will now redirect correctly!

## Step 2: Fix Database (Permanent Fix)

Check if the issue exists in your WordPress database.

### Run Dry Run (Safe):
```bash
cd /Users/omardoucoure/Documents/Afrique\ Sports/afriquesports-web

# Check what would be fixed (no changes)
node scripts/fix-malformed-urls-in-db.js
```

### Apply Fixes:
```bash
# Actually fix the database
node scripts/fix-malformed-urls-in-db.js --execute
```

### What It Does:
- Searches `wp_posts` table for post_name with `https:`
- Removes malformed prefix from post slugs
- Shows preview before applying changes
- Creates detailed log of changes

### After Database Fix:
```bash
# Clear WordPress cache
# Go to: wp-admin → Performance → Purge Cache (if using cache plugin)

# Regenerate permalinks
# Go to: wp-admin → Settings → Permalinks → Save Changes
```

## Step 3: Update Google Search Console

### Option A: Submit Updated Sitemap

1. **Generate New Sitemap:**
   ```bash
   # Your site should have auto-generated sitemaps at:
   https://www.afriquesports.net/sitemap.xml
   https://www.afriquesports.net/video-sitemap.xml
   ```

2. **Submit to Google:**
   - Go to: https://search.google.com/search-console
   - Select property: afriquesports.net
   - Navigate to: Sitemaps
   - Remove old sitemap
   - Add new sitemap URL
   - Click "Submit"

### Option B: Request URL Inspection (For Important URLs)

1. Go to Google Search Console
2. Use "URL Inspection" tool
3. Enter corrected URL (without `https:` prefix)
4. Click "Request Indexing"

### Option C: Bulk Resubmission (Advanced)

For the 96 malformed URLs, create a list of corrected URLs and use Google's URL Inspection API:

```bash
# Create list of fixed URLs
node scripts/analyze-video-urls.js
# Use output: analysis/all-urls-fixed.csv

# Then submit via Google Search Console API
# (Requires Google API setup - optional)
```

## Step 4: Monitor Results

### Check Redirect Works:

Test a malformed URL:
```bash
curl -I "https://www.afriquesports.net/en/https:/test-article"

# Should return:
HTTP/2 301
location: https://www.afriquesports.net/en/football/test-article
```

### Google Search Console Monitoring:

1. **Coverage Report:**
   - Go to: Coverage → Error → 404
   - Should see decrease in 404 errors

2. **Video Indexing:**
   - Go to: Video → Indexing Status
   - Monitor for increase in indexed videos
   - Check for decrease in errors

3. **Timeline:**
   - Immediate: Redirects work
   - 1-3 days: Google recrawls
   - 1-2 weeks: Index updates
   - 2-4 weeks: Full recovery

## Root Cause Analysis

### Why Did This Happen?

Possible causes:
1. **WordPress Permalink Issue:** Category slug removed from URLs
2. **Migration Error:** URLs malformed during site migration
3. **Plugin Conflict:** SEO or multilingual plugin bug
4. **Manual Edit:** Bulk edit gone wrong

### Check WordPress Settings:

```bash
wp-admin → Settings → Permalinks

# Should be:
/%category%/%postname%/

# NOT:
/%postname%/
```

### Check for Plugins:

- WPML (multilingual)
- Polylang (multilingual)
- Yoast SEO
- All in One SEO

Any of these could cause permalink issues.

## Prevention

### 1. Monitor Permalinks:
```bash
# Add to your monitoring
SELECT COUNT(*) as malformed_count
FROM wp_posts
WHERE post_name LIKE '%https:%'
AND post_type = 'post';

# Should always be 0
```

### 2. Test After Plugin Updates:
- Check sample URLs after updating SEO/multilingual plugins
- Verify category appears in URLs
- Test all language variants

### 3. Regular Sitemap Checks:
- Monthly review of sitemap.xml
- Check for malformed patterns
- Validate against Google Search Console

## Quick Reference

### Files Created:
```
middleware.ts                          - URL redirect middleware
scripts/analyze-video-urls.js          - Analyze malformed URLs
scripts/fix-malformed-urls-in-db.js    - Fix database
VIDEO-TRACKING-GUIDE.md                - Analytics guide
GOOGLE-INDEXING-FIX-GUIDE.md          - This file
```

### Commands:
```bash
# 1. Analyze URLs
node scripts/analyze-video-urls.js

# 2. Fix database (dry run)
node scripts/fix-malformed-urls-in-db.js

# 3. Fix database (apply)
node scripts/fix-malformed-urls-in-db.js --execute

# 4. Deploy middleware
git add middleware.ts
git commit -m "fix: add middleware to redirect malformed URLs"
git push && vercel --prod

# 5. Test redirect
curl -I "https://www.afriquesports.net/en/https:/test"
```

### Google Search Console Steps:
1. ✅ Deploy middleware (redirects work)
2. ✅ Fix database (permanent fix)
3. ✅ Submit new sitemap
4. ✅ Monitor coverage report
5. ✅ Check video indexing status

## Expected Timeline

| Time | Status |
|------|--------|
| Immediately | Middleware redirects active |
| Day 1 | Database fixed, sitemap updated |
| Days 1-3 | Google recrawls fixed URLs |
| Week 1-2 | Search Console shows improvements |
| Week 2-4 | Full recovery, errors cleared |

## Success Metrics

Monitor these in Google Search Console:

- ✅ 404 errors decrease from 96 to 0
- ✅ Valid video pages increase by 96
- ✅ Coverage errors drop
- ✅ Indexed videos increase
- ✅ Video rich results appear in search

## Support

If issues persist:

1. Check middleware is deployed (`vercel logs`)
2. Verify database changes (`--execute` was run)
3. Confirm sitemap submitted to Google
4. Wait 2 weeks for Google to fully recrawl
5. Check for other permalink issues in WordPress

---

**Status:** Ready to deploy
**Risk:** Low (301 redirects are safe and reversible)
**Impact:** High (fixes 96 malformed URLs, improves SEO)
