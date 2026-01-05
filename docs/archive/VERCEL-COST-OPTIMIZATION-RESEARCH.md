# Vercel Cost Optimization Research - Industry Best Practices 2025

Based on comprehensive research from Vercel experts, case studies, and industry leaders.

---

## Key Findings from Research

### 1. Real-World Success Stories

**Case Study: Howdygo - 80% Cost Reduction**
- Original cost: ~$500/month
- After optimization: ~$100/month
- Method: Moved images to Cloudflare R2 + switched to SSG where possible
- Source: [Cutting Vercel Costs by 80%](https://www.howdygo.com/blog/cutting-howdygos-vercel-costs-by-80-without-compromising-ux-or-dx)

**Case Study: Pagepro Client - 35% Cost Reduction**
- Reduced build time by 40%
- Increased traffic capacity by 1.5×
- Used: ISR, parallel queries, image optimization
- Source: [How to Lower Vercel Hosting Costs by 35%](https://pagepro.co/blog/vercel-hosting-costs/)

---

## Top 10 Cost Optimization Strategies (Priority Order)

### 1. ✅ IMPLEMENTED: Switch from SSR to ISR/SSG (35-50% savings)

**What we did:**
- Changed article pages from `force-dynamic` to ISR with 5-minute revalidation
- Expected savings: $15-20/month

**Best practices from research:**
> "Converting high-traffic pages from SSR to SSG (or SSG with revalidation) often provides the single most significant cost-reduction. Lower costs on high-traffic pages by up to 95%."
> — [Pagepro Cost Optimization Guide](https://pagepro.co/blog/optimizing-vercel-hosting-costs/)

**Additional opportunities for Afrique Sports:**
- Consider SSG for category pages (currently 60s revalidate)
- Use SSG for player profiles, team pages
- Homepage could use 10-minute ISR instead of current setup

---

### 2. ✅ IMPLEMENTED: Edge Caching for API Routes (10-15% savings)

**What we did:**
- Added Cache-Control headers to API routes
- CAN 2025: 60s cache, Posts: 5min, Trending: 1hr

**Best practice:**
> "Caching API responses can help applications prevent repeated executions of the same logic."
> — [This Dot Labs - Keeping Costs in Check](https://www.thisdot.co/blog/keeping-costs-in-check-when-hosting-next-js-on-vercel)

---

### 3. 🔴 NEW: Enable Fluid Compute (20-45% function cost savings)

**What is Fluid Compute?**
- New Vercel feature (2025)
- Automatic function optimization
- Pay only for active CPU time, not idle I/O waiting

**How to enable:**
```bash
# In Vercel dashboard:
Project Settings → Functions → Enable Fluid Compute
```

**Real-world results:**
> "Some customers have seen more than 45% in compute savings by enabling fluid compute."
> — [Vercel Fluid Compute Docs](https://vercel.com/docs/fluid-compute)

**Cost impact for Afrique Sports:**
- Current Fluid Active CPU: $15.05
- After enabling: ~$8-10 (33-45% reduction)
- **Estimated savings: $5-7/month**

**Action:** Enable in Vercel dashboard (zero code changes needed)

Source: [Vercel Fluid Compute](https://vercel.com/docs/fluid-compute)

---

### 4. 🟡 HIGH PRIORITY: Parallel Database Queries (20-30% function cost reduction)

**Current issue:**
You're likely making sequential database queries:
```typescript
// BAD - Sequential (expensive)
const posts = await fetchPosts();
const categories = await fetchCategories();
const trending = await fetchTrending();
// Total time: 300ms + 200ms + 150ms = 650ms
```

**Solution - Parallel queries:**
```typescript
// GOOD - Parallel (cheap)
const [posts, categories, trending] = await Promise.all([
  fetchPosts(),
  fetchCategories(),
  fetchTrending(),
]);
// Total time: max(300ms, 200ms, 150ms) = 300ms
// Cost reduction: 54%!
```

**Why this matters:**
> "Next.js makes it possible to fetch data in parallel, reducing total execution time. This feature alone can reduce serverless function costs by 20-30% without any other optimizations."
> — [Pagepro Cost Optimization](https://pagepro.co/blog/optimizing-vercel-hosting-costs/)

**Where to apply:**
- Homepage data fetching
- Article page (post + related posts + trending)
- Category pages

**Estimated savings: $3-5/month**

Source: [Pagepro - Optimizing Vercel Hosting Costs](https://pagepro.co/blog/optimizing-vercel-hosting-costs/)

---

### 5. 🔴 CRITICAL: Move Images to External CDN (50-80% image cost savings)

**Current cost:**
- Image Transformations: $10.09
- Image Cache Writes: $3.91
- **Total: $14/month**

**Problem with Vercel Image Optimization:**
> "Optimizing around 28,000 images would have added $115 to their $20/month hosting fee, basically a near 7x increase."
> — [Indie Starter - Vercel Alternatives](https://indie-starter.dev/blog/top-vercel-products-alternatives-hosting-analytics-image-optimization)

**Better alternatives:**

#### Option A: Cloudflare Images (RECOMMENDED)
- **Cost:** $5/month for 100,000 images
- First 5,000 transformations included
- $0.50 per 1,000 additional transformations
- Built-in CDN (global)
- **Your cost:** ~$2-3/month (vs $14/month on Vercel)
- **Savings: $11-12/month**

#### Option B: Cloudinary (Free tier available)
- **Free tier:** 25,000 transformations/month
- Comprehensive media management
- Video support included
- **Your cost:** $0/month (if under free tier)
- **Savings: $14/month**

#### Option C: Cloudflare R2 + Custom Worker
- **Cost:** $0.015 per GB storage
- No egress fees (free bandwidth!)
- Example: 230GB transfer = $0 on R2 vs $18.77 on Vercel
- **Savings: $14/month on images + $18/month on bandwidth = $32/month**

**Implementation complexity:**
- Cloudflare Images: Easy (1-2 hours)
- Cloudinary: Easy (2-3 hours)
- Cloudflare R2: Medium (4-6 hours)

Sources:
- [Cutting Vercel Costs by 80%](https://www.howdygo.com/blog/cutting-howdygos-vercel-costs-by-80-without-compromising-ux-or-dx)
- [Vercel Image Optimization Limits](https://vercel.com/docs/image-optimization/limits-and-pricing)
- [CDN Image Comparison](https://www.jondjones.com/frontend/jamstack/cdn-image-netlify-vs-cloudflare-vs-cloudinary-vs-vercel/)

---

### 6. 🟡 Use Edge Runtime for Simple API Routes (15x cheaper)

**Current setup:**
All API routes use Node.js runtime (expensive)

**Edge Runtime benefits:**
> "Edge Functions are significantly cheaper - generating a million images costs nearly 15x less in Edge Functions compared to Serverless Functions."
> — [Upstash - Vercel Edge Explained](https://upstash.com/blog/vercel-edge)

**Pricing comparison:**
- Edge: $2 per million requests
- Serverless: Variable (much higher for I/O-bound tasks)

**Which routes to convert:**
```typescript
// Good candidates for Edge Runtime:
// - /api/can2025/schedule (just returns JSON)
// - /api/can2025/standings (just returns JSON)
// - /api/can2025/scorers (just returns JSON)
// - /api/posts (simple WordPress API proxy)

// Keep on Node.js:
// - Database connections
// - Image processing
// - Complex computations
```

**How to convert:**
```typescript
// Add to your API route:
export const runtime = 'edge';
```

**Limitations to consider:**
- No native Node.js APIs
- No database connections (use HTTP-based like Supabase)
- Max 1MB request size
- Max 4MB function bundle

**Estimated savings: $2-4/month**

Sources:
- [Vercel Edge Runtime](https://vercel.com/docs/functions/runtimes/edge)
- [Upstash - Vercel Edge Explained](https://upstash.com/blog/vercel-edge)

---

### 7. 🟢 Database Connection Pooling & Regional Placement

**Current issue:**
> "When deploying to serverless environments like Vercel, managing database connections properly is crucial to avoid 'connection storming' - where the application mounts a new connection to the database for every serverless function."
> — [Pagepro Cost Optimization](https://pagepro.co/blog/optimizing-vercel-hosting-costs/)

**Solutions:**

#### A. Use Connection Pooling (Supabase already does this ✅)
You're already using Supabase which has built-in connection pooling - good!

#### B. Place Functions in Same Region as Database
```typescript
// Add to expensive API routes:
export const preferredRegion = 'iad1'; // US East (if Supabase is in US East)
```

**Benefits:**
- Reduces latency
- Reduces function execution time
- Saves on compute costs

**Which routes to optimize:**
- `/api/posts`
- `/api/can2025/*`
- All database-heavy routes

**Estimated savings: $2-3/month**

Source: [Pagepro - Optimizing Vercel Hosting Costs](https://pagepro.co/blog/optimizing-vercel-hosting-costs/)

---

### 8. 🟢 Reduce Middleware Invocations

**Problem:**
> "High invocation counts can quickly increase costs, particularly if middleware is triggering multiple function calls."
> — [This Dot Labs](https://www.thisdot.co/blog/keeping-costs-in-check-when-hosting-next-js-on-vercel)

**Current Function Invocations:** 19.37M (costing $12.10)

**Solution - Use Middleware Matcher:**
```typescript
// middleware.ts
export const config = {
  matcher: [
    // Only run on specific routes, not everything
    '/admin/:path*',
    '/api/protected/:path*',
    // Exclude static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
```

**Estimated savings: $2-3/month**

Source: [Vercel Docs - Manage and Optimize Edge Network Usage](https://vercel.com/docs/pricing/networking)

---

### 9. 🟡 Optimize Fast Origin Transfer (50% reduction possible)

**Current cost:** $18.77 for 230GB

**Problem:**
Too much data transferred from WordPress origin to Vercel

**Solutions:**

#### A. Increase Cache Duration
Already implemented ✅ (API cache headers)

#### B. Reduce Response Payload Size
```typescript
// Only return fields you need from WordPress API
const response = await fetch(
  `${WORDPRESS_URL}/wp-json/wp/v2/posts?_fields=id,title,excerpt,featured_media,date`
);
// Instead of full post objects
```

#### C. Use Compression
```typescript
// In next.config.ts - already enabled ✅
compress: true,
```

#### D. Move WordPress Assets to Cloudflare R2
- Store images, videos, PDFs in R2
- Serve directly from R2 (no Vercel transfer)
- **Potential savings: $10-15/month**

**Estimated savings: $8-12/month**

Source: [This Dot Labs - Keeping Costs in Check](https://www.thisdot.co/blog/keeping-costs-in-check-when-hosting-next-js-on-vercel)

---

### 10. 🟢 Monitor and Set Spending Limits

**Best practice:**
> "Set spend limits: Configure max monthly thresholds in Vercel. Enable notifications: Get alerts when approaching limits (e.g., at 80% and 95%)."
> — [FocusReactive - Vercel Cost Optimization](https://focusreactive.com/vercel-cost-optimization/)

**How to set up:**
1. Go to Vercel Dashboard → Project Settings → Usage
2. Set spending limit: $100/month
3. Enable email alerts at 80% and 95%

**This prevents surprises!**

Source: [FocusReactive - Vercel Cost Optimization](https://focusreactive.com/vercel-cost-optimization/)

---

## Revised Implementation Plan

### Phase 1: ✅ COMPLETED ($35-45/month savings)
1. ✅ ISR instead of force-dynamic
2. ✅ Remove image optimization from og:image
3. ✅ API edge caching

### Phase 2: QUICK WINS (2-3 hours, $15-25/month savings)
4. Enable Fluid Compute in Vercel dashboard (5 min, $5-7 savings)
5. Convert simple API routes to Edge Runtime (1 hour, $2-4 savings)
6. Add `preferredRegion` to database routes (30 min, $2-3 savings)
7. Implement parallel database queries (1 hour, $3-5 savings)
8. Optimize middleware with matcher (30 min, $2-3 savings)

### Phase 3: INFRASTRUCTURE (1-2 days, $20-40/month savings)
9. Move images to Cloudflare Images or Cloudinary (4 hours, $11-14 savings)
10. Optimize WordPress API responses (2 hours, $3-5 savings)
11. Set up monitoring and spending limits (30 min, $0 savings but prevents overages)

### Phase 4: ADVANCED (Later, $10-20/month savings)
12. Move WordPress media to Cloudflare R2 (1 day, $15-20 savings)
13. Implement advanced caching strategies
14. Consider alternative hosting for static assets

---

## Total Potential Savings

| Phase | Time | Savings/Month | Difficulty |
|-------|------|---------------|------------|
| Phase 1 (Done) | 30 min | $35-45 | Easy |
| Phase 2 | 3 hours | $15-25 | Easy |
| Phase 3 | 1-2 days | $20-40 | Medium |
| Phase 4 | 2-3 days | $10-20 | Hard |
| **TOTAL** | **3-4 days** | **$80-130** | - |

**New monthly cost:** $0-45 (vs current $123.51)

**Yes, you could potentially get to ZERO Vercel costs or even use the free tier!**

---

## Research Sources

1. [Pagepro - Next.js Vercel Cost Optimization Guide](https://pagepro.co/blog/optimizing-vercel-hosting-costs/)
2. [Cutting Vercel Costs by 80% - Howdygo](https://www.howdygo.com/blog/cutting-howdygos-vercel-costs-by-80-without-compromising-ux-or-dx)
3. [This Dot Labs - Keeping Costs in Check](https://www.thisdot.co/blog/keeping-costs-in-check-when-hosting-next-js-on-vercel)
4. [FocusReactive - Vercel Cost Optimization](https://focusreactive.com/vercel-cost-optimization/)
5. [Vercel Fluid Compute Documentation](https://vercel.com/docs/fluid-compute)
6. [Upstash - Vercel Edge Explained](https://upstash.com/blog/vercel-edge)
7. [Vercel Image Optimization Limits](https://vercel.com/docs/image-optimization/limits-and-pricing)
8. [CDN Image Comparison](https://www.jondjones.com/frontend/jamstack/cdn-image-netlify-vs-cloudflare-vs-cloudinary-vs-vercel/)
9. [Indie Starter - Vercel Alternatives](https://indie-starter.dev/blog/top-vercel-products-alternatives-hosting-analytics-image-optimization)
10. [Upstash - Four Ways to Reduce Vercel Costs](https://upstash.com/blog/vercel-cost)

---

## Next Action Items

**Immediate (today):**
1. Enable Fluid Compute in Vercel dashboard (5 minutes)
2. Deploy Phase 1 changes (already committed)
3. Monitor costs for 24 hours

**This week:**
1. Implement Phase 2 optimizations
2. Research Cloudflare Images vs Cloudinary
3. Set up spending alerts

**This month:**
1. Migrate images to external CDN
2. Optimize all database queries for parallel execution
3. Review and optimize remaining API routes
