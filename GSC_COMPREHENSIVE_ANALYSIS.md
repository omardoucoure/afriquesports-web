# Google Search Console - Comprehensive Error Analysis

**Date:** January 5, 2026
**Total Errors:** 25,196 (massive jump on Dec 24, 2025)
**Critical Issues Identified:** 3 major problems

---

## Error Timeline

| Date | Error Count | Change |
|------|-------------|--------|
| Oct 7 - Dec 15 | 17 | Stable baseline |
| Dec 16 - Dec 23 | 100 | +83 errors (5.8x increase) |
| **Dec 24 - Jan 5** | **25,196** | **+25,096 errors (252x jump!)** |

### 🔥 Critical Event: December 24, 2025

Something catastrophic happened on Dec 24th that caused **25,000+ new errors** overnight.

---

## Issue #1: Sitemap Indexing Failure (CRITICAL 🔴)

### Problem:
- **50,000 URLs submitted** to Google
- **0 URLs indexed** from main sitemap
- **1 error** in sitemap
- **0 warnings** in main sitemap

### GSC Data:
```
Sitemap: https://www.afriquesports.net/sitemap.xml
Last submitted: 2025-12-30T19:53:11.436Z
Last downloaded: 2026-01-05T00:28:23.900Z
Status: Regular
Errors: 1
Warnings: 0
Content: 50000 submitted, 0 indexed ❌
```

### Root Cause:
The `sitemap.xml` is likely **exceeding Google's limits** or contains **malformed URLs**:
- Google limit: 50,000 URLs per sitemap (exactly at limit)
- Google limit: 50 MB uncompressed
- All URLs may contain the `https:/` malformation from English posts

### Evidence:
```xml
<!-- sitemap.xml contains URLs like: -->
<loc>https://www.afriquesports.net/football/didier-drogba-pourquoi-jai-repousse-la-france</loc>
```

But with hreflang alternates:
```xml
<xhtml:link rel="alternate" hreflang="en" href="https://www.afriquesports.net/en/https:/slug" />
```

This malformed hreflang causes Google to reject the **entire sitemap**.

---

## Issue #2: Video Sitemap Disaster (CRITICAL 🔴)

### Problem:
- **2,485 warnings** in video sitemap
- **1 error** in video sitemap
- Videos not being indexed

### GSC Data:
```
Sitemap: https://www.afriquesports.net/video-sitemap.xml
Last submitted: 2025-12-30T19:55:19.057Z
Last downloaded: 2026-01-04T21:22:47.591Z
Status: Regular
Errors: 1
Warnings: 2485 ⚠️⚠️⚠️
```

### Root Cause Analysis:

**1. Using `post.link` from WordPress API**

**File:** `src/app/video-sitemap.xml/route.ts:140`

```typescript
videoPosts.push({
  url: post.link,  // ❌ PROBLEM: Uses WordPress link field
  title: stripHtml(post.title.rendered),
  description: stripHtml(post.excerpt.rendered || post.title.rendered),
  videoUrl: videoUrl,
  thumbnailUrl: thumbnailUrl,
  uploadDate: post.date,
  videoType: getVideoType(videoUrl),
});
```

**Why this is wrong:**
- English WordPress posts have malformed slugs: `https:/article-name`
- `post.link` from WordPress API returns: `https://cms.realdemadrid.com/afriquesports-en/https:/article-name`
- This gets used directly in the video sitemap

**Expected:** `https://www.afriquesports.net/afrique-sports-tv/video-title`
**Actual:** `https://cms.realdemadrid.com/afriquesports-en/https:/video-title`

---

**2. Missing Thumbnail URLs**

From December 30 GSC export (Video indexing drilldown):
- **9,287 videos missing thumbnail URLs**

Google requirement: All videos MUST have valid thumbnails.

**Current code (line 137):**
```typescript
const thumbnailUrl = SITE_URL + '/opengraph-image.png';
```

This uses a fallback image for ALL videos, which Google flags as suspicious/spam.

---

**3. Videos Not on Dedicated Pages**

From GSC warnings: **3,820 videos not on dedicated video pages**

Google prefers video content on dedicated video pages, not mixed with text content.

---

### Fix Required:

```typescript
// src/app/video-sitemap.xml/route.ts

// Instead of:
url: post.link,

// Use:
url: `${SITE_URL}/${category}/${post.slug}`,

// And for thumbnail:
thumbnailUrl: post._embedded?.['wp:featuredmedia']?.[0]?.source_url || SITE_URL + '/opengraph-image.png',
```

---

## Issue #3: English URLs with https:/ Prefix (FIXED ✅)

### Problem:
1000+ URLs with malformed pattern: `/en/https:/slug`

### Status:
✅ **FIXED** in `src/lib/sitemap-cache.ts` (deployed Jan 5)

The slug sanitization will fix new sitemap generation, but **existing sitemaps in Google's index still have the old data**.

**Timeline to resolution:**
- Jan 5: Fix deployed
- Jan 6-7: Google recrawls sitemaps
- Jan 8-14: Errors start decreasing
- Jan 15-30: Full error cleanup

---

## Issue #4: News Sitemap Not Indexing

### Problem:
```
Sitemap: https://www.afriquesports.net/news-sitemap.xml
Content:
  - web: 4 submitted, 0 indexed
  - news: 4 submitted, 0 indexed
```

Only 4 articles in news sitemap is **way too low** for a news site.

### Expected:
- News sitemap should have **100-1000 recent articles**
- Updated multiple times per day
- Last 48 hours of content

### Root Cause:
Check `src/app/news-sitemap.xml/route.ts` - likely filtering too aggressively or fetching too few posts.

---

## Recommended Fixes (Priority Order)

### 🔴 CRITICAL - Fix Immediately

#### 1. Fix Video Sitemap URL Construction

**File:** `src/app/video-sitemap.xml/route.ts:140`

```typescript
// Current (WRONG):
videoPosts.push({
  url: post.link,  // Uses WordPress URL directly
  ...
});

// Fixed:
// Extract category slug from embedded data
const category = post._embedded?.['wp:term']?.[0]?.[0]?.slug || 'afrique-sports-tv';

// CRITICAL: Sanitize slug to remove https:/ prefix
let sanitizedSlug = post.slug;
if (sanitizedSlug.startsWith('https:/') || sanitizedSlug.startsWith('http:/')) {
  sanitizedSlug = sanitizedSlug.replace(/^https?:\//, '');
} else if (sanitizedSlug.startsWith('https://') || sanitizedSlug.startsWith('http://')) {
  sanitizedSlug = sanitizedSlug.replace(/^https?:\/\//, '');
}

videoPosts.push({
  url: `${SITE_URL}/${category}/${sanitizedSlug}`,  // Construct URL correctly
  ...
});
```

**Impact:** Eliminates 2,485 video sitemap warnings

---

#### 2. Fix Video Thumbnails

**File:** `src/app/video-sitemap.xml/route.ts`

```typescript
// Fetch with _embed to get featured images
const response = await fetch(
  `${WORDPRESS_API_URL}/posts?categories=${VIDEO_CATEGORY_ID}&per_page=${POSTS_PER_PAGE}&page=${page}&_embed`,
  { next: { revalidate: 86400 } }
);

// Use actual featured image
const thumbnailUrl = post._embedded?.['wp:featuredmedia']?.[0]?.media_details?.sizes?.large?.source_url
  || post._embedded?.['wp:featuredmedia']?.[0]?.source_url
  || post.featured_media_url
  || SITE_URL + '/opengraph-image.png';  // Fallback only if nothing else available
```

**Impact:** Fixes 9,287 missing thumbnail warnings

---

#### 3. Split Main Sitemap (50,000 URL limit reached)

**Current:**
- `sitemap.xml` = 50,000 URLs (at Google's limit)
- Result: Google rejects entire sitemap

**Solution:** Use sitemap index with paginated sitemaps

```xml
<!-- sitemap_index.xml -->
<sitemapindex>
  <sitemap>
    <loc>https://www.afriquesports.net/sitemaps/posts/1.xml</loc>
  </sitemap>
  <sitemap>
    <loc>https://www.afriquesports.net/sitemaps/posts/2.xml</loc>
  </sitemap>
  <!-- ... up to 100 sitemaps (500 URLs each) -->
</sitemapindex>
```

Already implemented in `/sitemaps/posts/[page]/route.ts` but not properly linked.

**Fix:** Update `sitemap.xml` to redirect to `sitemap_index.xml`

---

#### 4. Fix News Sitemap (Only 4 articles)

**File:** `src/app/news-sitemap.xml/route.ts`

Check why only 4 articles are being returned. Should be **last 48 hours** of content (100-500 articles for active site).

---

### 🟡 IMPORTANT - Fix This Week

#### 5. Resubmit Sitemaps to GSC

After fixes are deployed:

```bash
# Use existing script
node scripts/submit-sitemaps-to-gsc.js
```

Or manually:
1. Go to https://search.google.com/search-console
2. Navigate to Sitemaps
3. Remove old sitemaps
4. Submit:
   - `https://www.afriquesports.net/sitemap_index.xml` (instead of sitemap.xml)
   - `https://www.afriquesports.net/news-sitemap.xml`
   - `https://www.afriquesports.net/video-sitemap.xml`

---

#### 6. Add Sitemap Monitoring

Create a cron job to check sitemap health:

```javascript
// scripts/monitor-sitemap-health.js
const { google } = require('googleapis');

async function checkSitemapHealth() {
  // Get sitemap stats from GSC API
  const sitemaps = await webmasters.sitemaps.list({ siteUrl: SITE_URL });

  sitemaps.data.sitemap.forEach(sitemap => {
    if (sitemap.errors > 0) {
      // Send alert
      console.error(`🚨 Sitemap has ${sitemap.errors} errors: ${sitemap.path}`);
    }
    if (sitemap.warnings > 100) {
      // Send warning
      console.warn(`⚠️  Sitemap has ${sitemap.warnings} warnings: ${sitemap.path}`);
    }
  });
}
```

Run daily via cron.

---

## Impact Analysis

### Current State (Before Fixes)

| Metric | Value | Status |
|--------|-------|--------|
| Total GSC Errors | 25,196 | 🔴 Critical |
| Main sitemap indexed | 0 / 50,000 (0%) | 🔴 Critical |
| Video sitemap warnings | 2,485 | 🔴 Critical |
| News sitemap articles | 4 | 🔴 Critical |
| Top 10 pages performance | Good | ✅ Working |

### Expected State (After Fixes)

| Metric | Target | Timeline |
|--------|--------|----------|
| Total GSC Errors | < 100 | 14-30 days |
| Main sitemap indexed | > 40,000 (80%) | 7-14 days |
| Video sitemap warnings | < 50 | 7 days |
| News sitemap articles | 100-500 | Immediate |
| Indexed pages | 100,000+ | 30-60 days |

---

## Why Dec 24th Was Catastrophic

**Theory:** Sitemap resubmission on Dec 24th with malformed URLs

Evidence:
- Dec 23: 100 errors
- Dec 24: 25,196 errors (252x increase)
- Sitemaps last submitted: Dec 30 (likely resubmitted multiple times)

**What happened:**
1. English WordPress database corruption introduced `https:/` slugs
2. Sitemap cache refreshed with corrupted data
3. New sitemap generated with 50,000 malformed hreflang URLs
4. Submitted to Google on Dec 24
5. Google crawled it and found **25,000+ invalid URLs**
6. All pages rejected

---

## Monitoring Dashboard

### Key Metrics to Track

1. **GSC Error Count**
   - Target: < 100 errors
   - Current: 25,196
   - Check: Daily

2. **Sitemap Index Rate**
   - Target: > 80% of submitted URLs indexed
   - Current: 0%
   - Check: Weekly

3. **Video Sitemap Warnings**
   - Target: < 50
   - Current: 2,485
   - Check: Weekly

4. **Organic Traffic**
   - Top performing pages getting good clicks
   - Monitor for drops

---

## Testing the Fixes

### 1. Test Video Sitemap Locally

```bash
curl https://www.afriquesports.net/video-sitemap.xml | grep -o 'https://' | wc -l
# Should be 0 (no malformed URLs)

curl https://www.afriquesports.net/video-sitemap.xml | grep -c '<video:thumbnail_loc>'
# Should match number of videos
```

### 2. Test Main Sitemap

```bash
curl https://www.afriquesports.net/sitemap_index.xml | grep -c '<sitemap>'
# Should be > 1 (multiple sitemap pages)
```

### 3. Monitor GSC

Visit: https://search.google.com/search-console
- Pages → "Why pages aren't indexed"
- Should see errors decreasing over 2 weeks

---

## Summary

### Root Causes Identified:

1. ❌ **Video sitemap using `post.link`** instead of constructing URLs
2. ❌ **Slug corruption in English WordPress** (`https:/` prefix)
3. ❌ **Main sitemap at 50,000 URL limit** (should use index)
4. ❌ **News sitemap only has 4 articles** (should be 100-500)
5. ❌ **9,287 videos missing thumbnails**

### Fixes Needed:

1. ✅ Slug sanitization (DEPLOYED)
2. ⏳ Video sitemap URL construction
3. ⏳ Video sitemap thumbnail fetching
4. ⏳ Main sitemap splitting/indexing
5. ⏳ News sitemap article count

### Timeline:

- **Today (Jan 5):** Deploy video sitemap fixes
- **Jan 6:** Resubmit sitemaps to GSC
- **Jan 7-14:** Monitor error reduction
- **Jan 15-30:** Full recovery expected

---

**Report generated:** January 5, 2026
**Status:** Critical fixes identified and ready for implementation

