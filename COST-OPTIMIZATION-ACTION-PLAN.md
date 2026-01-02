# Vercel Cost Optimization - ACTION PLAN

**Current Monthly Cost:** $123.51
**Target:** $40-60/month (50-67% reduction)
**Timeline:** Implement in phases over 1-2 weeks

---

## 💰 Cost Breakdown (Current)

| Category | Cost | % of Total | Optimization Potential |
|----------|------|------------|----------------------|
| Edge Requests | $41.11 | 33% | 🔴 HIGH (force-dynamic issue) |
| Fast Origin Transfer | $18.77 | 15% | 🟡 MEDIUM (caching implemented) |
| Fluid Active CPU | $15.05 | 12% | 🟢 LOW (enable Fluid Compute) |
| Function Invocations | $12.10 | 10% | 🔴 HIGH (force-dynamic issue) |
| Fluid Provisioned Memory | $12.00 | 10% | 🟢 LOW (OK for now) |
| Image Transformations | $10.09 | 8% | 🔴 CRITICAL (easy fix) |
| Web Analytics | $9.86 | 8% | 🟡 OPTIONAL |
| Image Cache Writes | $3.91 | 3% | 🟢 LOW |

**Total:** $123.51/month

---

## 🎯 PHASE 1: CRITICAL FIXES (TODAY - 30 minutes, Save $25-35/month)

### ✅ Fix 1: Remove force-dynamic from Article Pages
**Time:** 2 minutes
**Savings:** $15-20/month
**Difficulty:** 🟢 Easy

**Problem:**
```typescript
// File: src/app/[locale]/[category]/[slug]/page.tsx:33
export const dynamic = 'force-dynamic'; // ❌ EXPENSIVE!
```

This forces EVERY article view to render server-side = 19M function invocations!

**Solution:**
```typescript
// REMOVE line 33:
export const dynamic = 'force-dynamic';

// ADD line 33:
export const revalidate = 300; // 5 minutes ISR
```

**Why this works:**
- First visitor triggers render, cached for 5 minutes
- Next visitors get cached version (nearly free!)
- Cache headers in next.config.ts already in place ✅
- Reduces Edge Requests by 80-90%
- Reduces Function Invocations by 95%

**Impact:**
- Edge Requests: $41.11 → $8-10 💰 **Save $30-33**
- Function Invocations: $12.10 → $1-2 💰 **Save $10**

---

### ✅ Fix 2: Remove Image Optimization from og:image
**Time:** 5 minutes
**Savings:** $8-10/month
**Difficulty:** 🟢 Easy

**Problem:**
```typescript
// File: src/app/[locale]/[category]/[slug]/page.tsx:~77
const ogImageUrl = imageUrl && !imageUrl.startsWith("/")
  ? `${baseUrl}/_next/image?url=${encodeURIComponent(imageUrl)}&w=1200&q=75`
  : `${baseUrl}/opengraph-image`;
```

This triggers image transformation on EVERY article metadata fetch!

**Solution:**
```typescript
// Line ~72-78, REPLACE with:
// Use original WordPress image for og:image (no optimization needed)
// Social media crawlers download once and cache forever
const ogImageUrl = imageUrl || `${baseUrl}/opengraph-image`;

// Determine image type from original URL
const imageExtension = imageUrl?.toLowerCase().split('.').pop()?.split('?')[0];
const ogImageType = imageExtension === 'png' ? 'image/png'
  : imageExtension === 'webp' ? 'image/webp'
  : 'image/jpeg';
```

**Why this works:**
- Facebook/Twitter crawlers download og:image ONCE and cache forever
- No need for Next.js image optimization
- Original WordPress images are already optimized
- Saves 180K transformations/month

**Impact:**
- Image Transformations: $10.09 → $0 💰 **Save $10**
- Image Cache Writes: $3.91 → $0 💰 **Save $4**

---

### ✅ Fix 3: Enable Fluid Compute (Vercel Dashboard)
**Time:** 2 minutes
**Savings:** $5-7/month
**Difficulty:** 🟢 Very Easy

**Steps:**
1. Go to: https://vercel.com/omars-projects-81bbcbf6/afriquesports-web/settings/functions
2. Find "Fluid Compute" section
3. Click "Enable Fluid Compute"
4. Save

**Why this works:**
- Pay only for active CPU time, not idle I/O waiting
- Automatic optimization by Vercel
- No code changes needed
- Some customers see 45% savings

**Impact:**
- Fluid Active CPU: $15.05 → $8-10 💰 **Save $5-7**

---

## 📊 Phase 1 Summary

| Fix | Time | Savings | Difficulty |
|-----|------|---------|------------|
| Remove force-dynamic | 2 min | $15-20 | 🟢 Easy |
| Fix og:image | 5 min | $14 | 🟢 Easy |
| Enable Fluid Compute | 2 min | $5-7 | 🟢 Very Easy |
| **TOTAL** | **10 min** | **$34-41** | **🟢 Easy** |

**New monthly cost after Phase 1:** $82-89 (from $123.51)

---

## 🎯 PHASE 2: QUICK WINS (THIS WEEK - 3-4 hours, Save $15-25/month)

### Fix 4: Convert Simple API Routes to Edge Runtime
**Time:** 1-2 hours
**Savings:** $3-5/month
**Difficulty:** 🟡 Medium

**Which routes to convert:**

```typescript
// These routes just return JSON - perfect for Edge:
// src/app/api/can2025/schedule/route.ts
// src/app/api/can2025/standings/route.ts
// src/app/api/can2025/scorers/route.ts
// src/app/api/can2025/teams/route.ts

// Add to each file:
export const runtime = 'edge';
```

**DO NOT convert:**
- Routes with MySQL/database connections
- Routes using Node.js-specific APIs
- Image processing routes

**Why this works:**
- Edge Functions are 15x cheaper than Serverless
- $2 per million vs much higher for Serverless
- Faster response times (runs at edge)

**Impact:** Save $3-5/month

---

### Fix 5: Implement Parallel Database Queries
**Time:** 1-2 hours
**Savings:** $3-5/month
**Difficulty:** 🟡 Medium

**Example - Homepage:**
```typescript
// BAD - Sequential (expensive)
const posts = await fetchPosts();
const trending = await getTrendingPosts();
const featured = await getFeaturedPosts();
// Total time: 300ms + 200ms + 150ms = 650ms

// GOOD - Parallel (cheap)
const [posts, trending, featured] = await Promise.all([
  fetchPosts(),
  getTrendingPosts(),
  getFeaturedPosts(),
]);
// Total time: max(300ms, 200ms, 150ms) = 300ms
// Cost reduction: 54%!
```

**Where to apply:**
- Homepage (`src/app/[locale]/page.tsx`)
- Category pages
- Article pages (post + related + trending)

**Impact:** Save $3-5/month

---

### Fix 6: Add preferredRegion to Database Routes
**Time:** 30 minutes
**Savings:** $2-3/month
**Difficulty:** 🟢 Easy

```typescript
// Add to all database-heavy routes:
export const preferredRegion = 'iad1'; // US East (if DB is in US East)

// Files to update:
// - src/app/api/posts/route.ts
// - src/app/api/can2025/*/route.ts
// - src/app/api/visits/trending/route.ts
```

**Why this works:**
- Reduces latency to database
- Reduces function execution time
- Saves on compute costs

**Impact:** Save $2-3/month

---

### Fix 7: Optimize Middleware with Matcher
**Time:** 15 minutes
**Savings:** $2-3/month
**Difficulty:** 🟢 Easy

**Check current middleware:**
```bash
# Look at middleware.ts
cat middleware.ts
```

**Add matcher to limit middleware invocations:**
```typescript
// middleware.ts
export const config = {
  matcher: [
    // Only run on specific routes, not everything
    '/admin/:path*',
    '/api/protected/:path*',
    // Exclude static files (IMPORTANT!)
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
```

**Impact:** Save $2-3/month

---

## 📊 Phase 2 Summary

| Fix | Time | Savings | Difficulty |
|-----|------|---------|------------|
| Edge Runtime for API routes | 1-2hr | $3-5 | 🟡 Medium |
| Parallel DB queries | 1-2hr | $3-5 | 🟡 Medium |
| preferredRegion | 30min | $2-3 | 🟢 Easy |
| Middleware matcher | 15min | $2-3 | 🟢 Easy |
| **TOTAL** | **3-4hr** | **$10-16** | **🟡 Medium** |

**New monthly cost after Phase 2:** $66-79 (from $82-89)

---

## 🎯 PHASE 3: IMAGE CDN MIGRATION (LATER - 4-8 hours, Save $15-25/month)

### Fix 8: Move Images to Cloudflare Images or Cloudinary
**Time:** 4-8 hours
**Savings:** $15-25/month
**Difficulty:** 🔴 Hard

**Options:**

#### Option A: Cloudflare Images (RECOMMENDED)
- **Cost:** $5/month for 100,000 images
- **Features:** Automatic optimization, variants, CDN
- **Your cost:** ~$2-3/month (vs $14/month on Vercel)
- **Savings:** $11-12/month

#### Option B: Cloudinary (Free tier)
- **Free tier:** 25,000 transformations/month
- **Your cost:** $0 (if under free tier)
- **Savings:** $14/month

#### Option C: Cloudflare R2 + Custom Worker
- **Cost:** $0.015 per GB storage
- **Bandwidth:** FREE (no egress fees!)
- **Your cost:** ~$1-2/month
- **Savings:** $12-13/month + reduced origin transfer

**Implementation complexity:**
- Cloudflare Images: 4-6 hours
- Cloudinary: 4-6 hours
- Cloudflare R2: 6-8 hours

**Impact:** Save $11-14/month

---

### Fix 9: Disable Vercel Web Analytics (Optional)
**Time:** 2 minutes
**Savings:** $9.86/month
**Difficulty:** 🟢 Very Easy

**Current:** $9.86/month for 328K events

**Alternatives (FREE):**
- Google Analytics (already configured ✅)
- Plausible Analytics
- Umami (self-hosted)
- PostHog (already using ✅)

**Steps:**
1. Go to Vercel Dashboard → Project Settings → Analytics
2. Disable Web Analytics
3. Confirm you're happy with Google Analytics/PostHog

**Impact:** Save $9.86/month (optional)

---

## 📊 Phase 3 Summary

| Fix | Time | Savings | Difficulty |
|-----|------|---------|------------|
| Cloudflare Images | 4-6hr | $11-12 | 🔴 Hard |
| Disable Web Analytics | 2min | $9.86 | 🟢 Very Easy |
| **TOTAL** | **4-6hr** | **$21-22** | **🔴 Hard** |

**New monthly cost after Phase 3:** $44-58 (from $66-79)

---

## 🎉 TOTAL COST REDUCTION SUMMARY

| Phase | Time | Savings | New Cost | Difficulty |
|-------|------|---------|----------|------------|
| **Current** | - | - | $123.51 | - |
| **Phase 1** (Today) | 10 min | $34-41 | $82-89 | 🟢 Easy |
| **Phase 2** (This week) | 3-4 hr | $10-16 | $66-79 | 🟡 Medium |
| **Phase 3** (Later) | 4-6 hr | $21-22 | $44-58 | 🔴 Hard |
| **TOTAL** | **7-10 hr** | **$65-79** | **$44-58** | **Mixed** |

**Cost Reduction: 53-64%** 🎉

---

## 🚀 IMMEDIATE ACTION ITEMS (TODAY)

### Step 1: Fix force-dynamic (2 minutes)

```bash
# Edit the file
code src/app/[locale]/[category]/[slug]/page.tsx

# Line 33, change from:
export const dynamic = 'force-dynamic';

# To:
export const revalidate = 300;
```

### Step 2: Fix og:image optimization (5 minutes)

```bash
# Same file: src/app/[locale]/[category]/[slug]/page.tsx
# Around line 72-78, replace the ogImageUrl logic with:
const ogImageUrl = imageUrl || `${baseUrl}/opengraph-image`;

# Update ogImageType logic to use original extension
const imageExtension = imageUrl?.toLowerCase().split('.').pop()?.split('?')[0];
const ogImageType = imageExtension === 'png' ? 'image/png'
  : imageExtension === 'webp' ? 'image/webp'
  : 'image/jpeg';
```

### Step 3: Build and deploy (3 minutes)

```bash
npm run build
git add -A
git commit -m "fix: remove force-dynamic and og:image optimization to reduce Vercel costs by 50%"
git push
```

### Step 4: Enable Fluid Compute in Vercel Dashboard (2 minutes)

1. Go to: https://vercel.com/omars-projects-81bbcbf6/afriquesports-web/settings/functions
2. Enable "Fluid Compute"
3. Save

---

## 📊 EXPECTED RESULTS (After Phase 1)

**Before:**
- Monthly cost: $123.51
- Edge Requests: $41.11
- Function Invocations: $12.10
- Image Transformations: $10.09

**After Phase 1:**
- Monthly cost: $82-89 (✅ **33% reduction**)
- Edge Requests: $8-10 (✅ **75% reduction**)
- Function Invocations: $1-2 (✅ **92% reduction**)
- Image Transformations: $0 (✅ **100% reduction**)

---

## 💡 MONITORING COSTS

### Via Vercel Dashboard:
https://vercel.com/omars-projects-81bbcbf6/afriquesports-web/analytics/usage

**Check:**
- Function Invocations (should drop 95% after fix)
- Edge Requests (should drop 75% after fix)
- Image Transformations (should drop to near 0)

### Set Spending Alerts:
1. Go to Dashboard → Settings → Usage
2. Set monthly limit: $80
3. Enable alerts at 80% and 95%

---

## ✅ CHECKLIST

**Phase 1 (Today):**
- [ ] Remove `force-dynamic` from article pages
- [ ] Fix og:image to use original WordPress images
- [ ] Enable Fluid Compute in Vercel Dashboard
- [ ] Deploy changes
- [ ] Monitor costs for 24 hours

**Phase 2 (This Week):**
- [ ] Convert simple API routes to Edge Runtime
- [ ] Implement parallel database queries on homepage
- [ ] Add `preferredRegion` to database routes
- [ ] Optimize middleware matcher
- [ ] Deploy and monitor

**Phase 3 (Optional):**
- [ ] Research Cloudflare Images vs Cloudinary
- [ ] Migrate images to external CDN
- [ ] Decide on Web Analytics (keep or disable)
- [ ] Deploy and monitor final costs

---

**Target Achievement:**
- **Phase 1:** $82-89/month (33% reduction) ✅ Easy wins
- **Phase 2:** $66-79/month (46% reduction) ✅ Medium effort
- **Phase 3:** $44-58/month (60%+ reduction) ✅ Best case

**START WITH PHASE 1 TODAY - IT'S THE BIGGEST WIN!** 🎯
