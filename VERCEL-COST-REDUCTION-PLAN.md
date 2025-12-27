# Vercel Cost Reduction Plan

Current monthly cost: **$123.51**
Target: **$60-80/month** (35-50% reduction)

## Cost Breakdown Analysis

| Cost Category | Current | % of Total | Priority |
|--------------|---------|------------|----------|
| Edge Requests | $41.11 | 33% | HIGH |
| Fast Origin Transfer | $18.77 | 15% | HIGH |
| Fluid Active CPU | $15.05 | 12% | MEDIUM |
| Function Invocations | $12.10 | 10% | HIGH |
| Fluid Provisioned Memory | $12.00 | 10% | MEDIUM |
| Image Transformations | $10.09 | 8% | HIGH |
| Web Analytics Events | $9.86 | 8% | LOW |
| Image Optimization Cache | $3.91 | 3% | LOW |

---

## 1. Fix Article Pages (Force-Dynamic Issue) 🔴 CRITICAL

**Current Problem:**
- Article pages use `force-dynamic` rendering
- Every visit = full server-side render (expensive!)
- Causes 19.37M function invocations

**Cost Impact:** ~$30-40/month

**File:** `src/app/[locale]/[category]/[slug]/page.tsx:32`

**Solution:**
```typescript
// REMOVE:
export const dynamic = 'force-dynamic';

// ADD:
export const revalidate = 300; // 5 minutes ISR
```

**Why this works:**
- First visitor triggers render, cached for 5 minutes
- Next visitors get cached version (free!)
- Article updates propagate within 5 minutes
- Reduces function invocations by 95%

**Expected savings:** $15-20/month

---

## 2. Stop Using Image Optimization for og:image 🔴 CRITICAL

**Current Problem:**
- Line 76 in article page creates og:image using `/_next/image?url=...`
- Triggers image transformation on EVERY article view
- 180K transformations = $10.09/month

**File:** `src/app/[locale]/[category]/[slug]/page.tsx:76`

**Solution:**
```typescript
// REMOVE:
const ogImageUrl = imageUrl && !imageUrl.startsWith("/")
  ? `${baseUrl}/_next/image?url=${encodeURIComponent(imageUrl)}&w=1200&q=75`
  : `${baseUrl}/opengraph-image`;

// REPLACE WITH:
const ogImageUrl = imageUrl || `${baseUrl}/opengraph-image`;
```

**Why this works:**
- og:image is only used by social media crawlers (Facebook, Twitter)
- They download ONCE and cache forever
- No need for Next.js image optimization
- Use original WordPress image directly

**Expected savings:** $8-10/month

---

## 3. Add Edge Caching Headers 🟡 HIGH PRIORITY

**Current Problem:**
- No cache-control headers on API responses
- Vercel edge re-fetches data frequently
- 230 GB origin transfer

**Solution:**
Add to `next.config.ts`:

```typescript
async headers() {
  return [
    // Existing security headers...

    // Cache API responses at the edge
    {
      source: '/api/can2025/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 's-maxage=60, stale-while-revalidate=300',
        },
      ],
    },
    {
      source: '/api/posts',
      headers: [
        {
          key: 'Cache-Control',
          value: 's-maxage=300, stale-while-revalidate=600',
        },
      ],
    },
    {
      source: '/api/visits/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 's-maxage=3600, stale-while-revalidate',
        },
      ],
    },
  ];
},
```

**Expected savings:** $10-12/month

---

## 4. Optimize Match Page Revalidation 🟡 HIGH PRIORITY

**Current Problem:**
- CAN 2025 match pages revalidate every 15 seconds
- Too aggressive for pages that only update during matches

**File:** `src/app/[locale]/can-2025/match/[slug]/page.tsx:24`

**Solution:**
```typescript
// CHANGE FROM:
export const revalidate = 15;

// TO:
export const revalidate = 60; // 1 minute is enough

// OR implement smart revalidation:
export const revalidate = match.status === 'live' ? 15 : 300;
```

**Expected savings:** $2-3/month

---

## 5. Reduce Image Transformations (Use Supabase Storage) 🟢 MEDIUM PRIORITY

**Current Problem:**
- All WordPress images go through Vercel image optimization
- 180K transformations/month

**Long-term Solution:**
1. Create Supabase storage bucket
2. Pre-optimize images once when publishing
3. Serve from Supabase CDN (free up to 200GB transfer)

**Expected savings:** $5-8/month

---

## 6. Implement Route Segment Config 🟢 MEDIUM PRIORITY

**Purpose:** Reduce serverless function duration

**Add to expensive pages:**

```typescript
// Add to api routes and pages
export const runtime = 'edge'; // Use Edge Runtime instead of Node.js
export const preferredRegion = 'iad1'; // Deploy to single region
export const maxDuration = 10; // Reduce from default 30s
```

**Files to update:**
- `src/app/api/posts/route.ts`
- `src/app/api/can2025/*/route.ts`
- `src/app/api/visits/trending/route.ts`

**Expected savings:** $5-7/month

---

## 7. Disable Web Analytics (Optional) 💡 LOW PRIORITY

**Current:** $9.86/month for 328K events

**Alternative:** Use free analytics:
- Google Analytics (already configured)
- Plausible Analytics
- Umami (self-hosted)

**Expected savings:** $9.86/month

---

## Implementation Priority

### Phase 1: Quick Wins (1 hour, $35-45/month savings)
1. ✅ Remove `force-dynamic` from article pages
2. ✅ Remove image optimization from og:image
3. ✅ Add cache-control headers to API routes

### Phase 2: Configuration (2 hours, $10-15/month savings)
4. Optimize match page revalidation
5. Add runtime config to API routes
6. Reduce function maxDuration

### Phase 3: Infrastructure (Later, $5-10/month savings)
7. Set up Supabase image storage
8. Pre-optimize images
9. Consider disabling Web Analytics

---

## Expected Results

| Optimization | Savings | Difficulty | Time |
|--------------|---------|------------|------|
| Remove force-dynamic | $15-20 | Easy | 5 min |
| Fix og:image | $8-10 | Easy | 5 min |
| Add cache headers | $10-12 | Easy | 15 min |
| Optimize revalidation | $2-3 | Easy | 5 min |
| Runtime config | $5-7 | Medium | 1 hour |
| Image pre-optimization | $5-8 | Hard | 4 hours |
| Disable Web Analytics | $10 | Easy | 5 min |

**Total Potential Savings:** $50-70/month (40-57% reduction)
**New Monthly Cost:** $55-75/month

---

## Monitoring

After implementing changes, monitor:

1. **Vercel Analytics Dashboard**
   - Function invocations (should drop 80-90%)
   - Image transformations (should drop 80%+)
   - Edge requests (will stay same - traffic is traffic)
   - Origin transfer (should drop 50%)

2. **Performance**
   - Core Web Vitals (should improve or stay same)
   - Page load times (should be faster with caching)
   - Time to First Byte (TTFB)

3. **User Experience**
   - Bounce rate (should not increase)
   - Pages per session (should stay same or improve)

---

## Next Steps

1. Review this plan
2. Approve Phase 1 quick wins
3. I'll implement the changes
4. Deploy and monitor for 24 hours
5. Verify cost reduction
6. Proceed to Phase 2 if results are good
