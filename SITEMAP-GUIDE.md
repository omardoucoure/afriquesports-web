# Sitemap Management Guide

## Current Sitemap Structure

Your site has a comprehensive sitemap system with **135,000+ posts** across multiple sitemaps:

### 📑 Main Sitemap Index
**URL:** https://www.afriquesports.net/sitemap.xml

**Contains:**
1. **Post Sitemaps** (`/sitemaps/posts/[1-135].xml`)
   - 135 paginated sitemaps
   - 1,000 posts per sitemap file
   - Total: ~135,000 articles

2. **Category Sitemap** (`/sitemaps/categories.xml`)
   - All categories and subcategories

3. **Pages Sitemap** (`/sitemaps/pages.xml`)
   - Static pages (about, contact, etc.)

4. **News Sitemap** (`/news-sitemap.xml`)
   - Last 48 hours for Google News
   - Auto-updated

5. **CAN 2025 Sitemap** (`/sitemaps/can-2025.xml`)
   - High-priority tournament content

6. **CAN 2025 Matches** (`/sitemaps/can2025-matches.xml`)
   - Live match pages

## Current Status

✅ **Sitemaps are auto-generated dynamically**
✅ **Edge-cached for performance**
✅ **Revalidated every hour**
✅ **Google Search Console script ready**

## Google Search Console Submission

### Option 1: Manual Submission (Recommended)

1. **Go to Google Search Console:**
   - https://search.google.com/search-console

2. **Select Property:**
   - afriquesports.net

3. **Navigate to Sitemaps:**
   - Left sidebar → Sitemaps

4. **Remove Old Sitemaps (if any):**
   - Click on old sitemap → Remove

5. **Add New Sitemap:**
   - Enter: `sitemap.xml`
   - Click "Submit"

6. **Verify Submission:**
   - Status should show "Success"
   - Wait 1-2 minutes for Google to fetch

### Option 2: Automated Submission (API)

**Prerequisites:**
- Google service account JSON file
- Place at: `google-service-account.json` (project root)

**Run Script:**
```bash
cd /Users/omardoucoure/Documents/Afrique\ Sports/afriquesports-web

node scripts/submit-sitemaps-to-gsc.js
```

**What It Does:**
- Submits main sitemap.xml
- Submits news-sitemap.xml
- Lists current sitemaps in GSC
- Shows submission status

## Video Sitemap (NEW)

### Current Status
❌ **Video sitemap doesn't exist yet**

### Why You Need It
With **17,653 videos indexed** by Google, a dedicated video sitemap will:
- Improve video discovery in search
- Better video rich results
- Faster indexing of new videos
- Video-specific metadata (duration, thumbnail, etc.)

### Solution
I'll create a video sitemap for you in the next step.

## Sitemap URLs

### Primary Sitemaps
| Sitemap | URL | Purpose |
|---------|-----|---------|
| **Main Index** | `/sitemap.xml` | Lists all sitemaps |
| **News** | `/news-sitemap.xml` | Google News (48h) |
| **Posts** | `/sitemaps/posts/[page].xml` | Articles (paginated) |
| **Categories** | `/sitemaps/categories.xml` | Categories |
| **Pages** | `/sitemaps/pages.xml` | Static pages |
| **CAN 2025** | `/sitemaps/can-2025.xml` | Tournament content |
| **Matches** | `/sitemaps/can2025-matches.xml` | Live matches |

### Testing Sitemaps

```bash
# Check main sitemap
curl https://www.afriquesports.net/sitemap.xml

# Check news sitemap
curl https://www.afriquesports.net/news-sitemap.xml

# Check first posts sitemap
curl https://www.afriquesports.net/sitemaps/posts/1.xml
```

## After URL Fix Deployment

### What to Do Now

1. **Wait for Deployment** ✅
   - Changes are now live
   - Redirects are active

2. **Sitemaps Auto-Update** ✅
   - Sitemaps revalidate every hour
   - No manual action needed
   - Fixed URLs will be in next generation

3. **Submit to Google (Optional but Recommended)**
   ```bash
   # Option A: Use the script
   node scripts/submit-sitemaps-to-gsc.js

   # Option B: Manual submission
   # Go to: https://search.google.com/search-console
   # Sitemaps → Add sitemap → Submit "sitemap.xml"
   ```

4. **Monitor Results**
   - Coverage report should show improvements
   - Video indexing errors should decrease
   - Timeline: 1-2 weeks for full effect

## Sitemap Cache Management

### Force Sitemap Regeneration

If you need to force update sitemaps immediately:

```bash
# Call revalidate API
curl -X POST "https://www.afriquesports.net/api/sitemap/revalidate"
```

### Sitemap Configuration

**File:** `src/app/sitemap.xml/route.ts`

**Key Settings:**
- `POSTS_PER_SITEMAP`: 1,000 posts per file
- `ESTIMATED_TOTAL_POSTS`: 135,000 (update manually)
- `revalidate`: 3600 seconds (1 hour)
- `runtime`: "edge" (faster delivery)

## Troubleshooting

### Sitemap Not Updating

**Problem:** Old URLs still in sitemap

**Solution:**
1. Check revalidate time (1 hour default)
2. Force revalidation via API
3. Clear CDN cache if needed

### Google Search Console Errors

**Problem:** "Couldn't fetch sitemap"

**Possible Causes:**
1. Sitemap URL incorrect (should be `/sitemap.xml`)
2. Sitemap too large (yours is split into 135 files - OK)
3. Timeout issues (edge runtime should prevent this)

**Solution:**
1. Test sitemap URL directly
2. Check Vercel deployment logs
3. Verify edge runtime is working

### Video URLs Not in Sitemap

**Problem:** Videos discovered but not in structured sitemap

**Solution:**
Create dedicated video sitemap (see next section)

## Best Practices

### ✅ Do's
- Submit main sitemap index only (sitemap.xml)
- Let Google discover child sitemaps
- Monitor GSC for errors weekly
- Update ESTIMATED_TOTAL_POSTS when post count changes significantly
- Keep sitemaps under 50MB each (you're at 1000 posts = ~50KB each)

### ❌ Don'ts
- Don't submit individual post sitemaps
- Don't submit too frequently (let cache work)
- Don't include malformed URLs (now fixed!)
- Don't include noindex pages

## Monitoring

### Google Search Console Metrics to Watch

1. **Coverage Report**
   - Valid pages: Should match sitemap count
   - Errors: Should be minimal
   - Warnings: Review regularly

2. **Sitemaps Report**
   - Discovered URLs vs Indexed URLs
   - Errors: Should be 0
   - Status: Success

3. **Video Indexing**
   - Indexed videos: Monitor growth
   - Errors: Should decrease after fix
   - Coverage: Track improvement

### Key URLs to Monitor

```
https://search.google.com/search-console
→ Coverage
→ Sitemaps
→ Video
→ Performance
```

## Next Actions

### Immediate (Done)
✅ URL redirects deployed
✅ Sitemaps auto-regenerating with fixed URLs

### Short-term (This Week)
1. Create video sitemap
2. Submit sitemap to Google Search Console
3. Monitor coverage report

### Long-term (This Month)
1. Track video indexing improvements
2. Update estimated post count
3. Review and optimize sitemap performance

## Video Sitemap Creation

Since you have **17,653 videos**, let's create a dedicated video sitemap to improve video SEO.

**I'll create this in the next step** - should I proceed with creating the video sitemap?
