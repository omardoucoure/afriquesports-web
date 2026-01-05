# Cloudflare Configuration for Afrique Sports

**Date:** January 5, 2026
**Plan:** Cloudflare Pro
**Domain:** afriquesports.net
**Zone ID:** 365f8911648aba12c1ba603742fe59ec

---

## Current Architecture

### Infrastructure
- **Frontend:** Next.js 16 on DigitalOcean (159.223.103.16:3002)
- **Backend:** WordPress Multisite on same server
- **Caching:** Redis 7.0.15 (WordPress + Next.js)
- **Server:** LiteSpeed + PM2
- **Geographic Focus:** Africa (France, Algeria, Senegal, Morocco, Côte d'Ivoire, Cameroon)

### Performance Baseline
- **WordPress Admin:** 0.22s (was 56s before Redis)
- **WordPress API:** 0.17s (was 32s before Redis)
- **Homepage:** 0.24s (warm)
- **Article Pages:** 0.12s (warm)

---

## ✅ Configured Settings

### 1. Page Rules (1/20 used on Pro plan)

#### Rule 1: Bypass Cache for Live Match Endpoint
```
URL Pattern: www.afriquesports.net/api/can2025/next-match*
Action: Cache Level = Bypass
Priority: 1
Status: Active
Created: 2026-01-05
```

**Why:** Live match data needs real-time updates. Cloudflare was caching responses despite no-cache headers.

---

## 🔧 Recommended Configuration

### Speed Settings

#### Auto Minify
- ✅ JavaScript: ON
- ✅ CSS: ON
- ✅ HTML: ON

**Why:** Reduces file sizes by 20-30%, crucial for mobile users in Africa with limited bandwidth.

#### Brotli Compression
- ✅ Status: ON (automatic with Pro plan)

**Why:** 15-25% better compression than gzip, especially for text content (HTML, CSS, JS, JSON).

#### HTTP/3 (QUIC)
- ✅ Status: ON

**Why:** Better performance on high-latency networks (Africa), handles packet loss gracefully.

#### Early Hints
- ✅ Status: ON

**Why:** Sends HTTP 103 responses with resource hints while server generates response. Improves perceived load time.

#### Rocket Loader
- ⚠️  Status: OFF (recommended for Next.js)

**Why:** Can break Next.js hydration. Next.js already optimizes script loading.

---

### Caching Configuration

#### Browser Cache TTL
```
Setting: Respect Existing Headers
```

**Why:** Next.js and our next.config.ts already define optimal cache policies per route.

#### Edge Cache TTL
```
Default: Follow Origin Headers
Custom Rules (via Cache Rules):
- Static assets: 1 year (immutable)
- Article pages: 5 minutes (s-maxage=300)
- Homepage: 1 minute (s-maxage=60)
- API endpoints: Bypass (except trending/stats)
```

#### Always Online
- ✅ Status: ON

**Why:** Serves cached version if origin is down. Critical for news site uptime.

#### Development Mode
- Status: OFF (enable only during deployments)

**Why:** Bypasses cache for testing, but reduces performance.

---

### Network Settings

#### Argo Smart Routing
- 💰 Status: Consider enabling
- Cost: $0.10/GB after first 1GB
- Expected Benefit: 30% faster in Africa/Europe

**Why:** Routes traffic through fastest Cloudflare paths. Especially beneficial for Africa → Europe → US routing.

**Estimated Cost:**
- Bandwidth: ~500GB/month
- Argo Cost: ~$50/month
- Benefit: 30% speed improvement globally

**Decision:** Monitor traffic for 1 month, then enable if >100GB/month.

#### HTTP/2 to Origin
- ✅ Status: ON

**Why:** Multiplexing requests to origin server, reduces connection overhead.

#### WebSockets
- ✅ Status: ON

**Why:** May be needed for future real-time features (live scores, notifications).

#### gRPC
- Status: OFF (not needed)

---

### DNS Settings

#### Proxying
```
www.afriquesports.net → Proxied (orange cloud) ✅
afriquesports.net → Proxied (orange cloud) ✅
cms.realdemadrid.com → Proxied (orange cloud) ✅
```

#### CNAME Flattening
- ✅ Status: ON

**Why:** Improves DNS resolution speed for apex domain.

---

### Image Optimization

#### Polish
- ✅ Status: Lossless
- Alternative: Lossy (for 35% more compression)

**Why:** Automatically optimizes images. Next.js already does WebP/AVIF conversion, but Polish adds another layer.

**Recommendation:** Use Lossless to preserve quality, Next.js handles format optimization.

#### Mirage
- Status: Consider enabling
- Pro Plan Feature: Not available (Enterprise only)

---

### Security Settings

#### Security Level
- Setting: Medium (recommended)
- High: Too aggressive, may block legitimate traffic from Africa

#### WAF Managed Rules
```
✅ Cloudflare Managed Ruleset: ON
✅ Cloudflare OWASP Core Ruleset: ON
```

**Custom Rules:**
1. **Block wp-admin access from unknown IPs**
   ```
   (http.request.uri.path contains "wp-admin" or http.request.uri.path contains "wp-login")
   and not ip.src in {YOUR_OFFICE_IP}
   → Block
   ```

2. **Rate limit WordPress API**
   ```
   http.request.uri.path contains "/wp-json"
   → Rate Limit: 100 requests/minute
   ```

3. **Allow known bots (Google, Bing)**
   ```
   cf.verified_bot_category in {"Search Engine Crawler"}
   → Allow
   ```

#### Bot Fight Mode
- ✅ Status: ON

**Why:** Blocks common bots that waste bandwidth and resources.

#### Challenge Passage
- Setting: 30 minutes

**Why:** Reduces repeated challenges for legitimate users.

---

### SSL/TLS Settings

#### SSL/TLS Mode
- ✅ Status: Full (Strict)

**Why:** Validates SSL certificate on origin. More secure than "Full" mode.

#### Always Use HTTPS
- ✅ Status: ON

**Why:** Automatic HTTP → HTTPS redirects for SEO and security.

#### Minimum TLS Version
- Setting: TLS 1.2

**Why:** TLS 1.0/1.1 are deprecated and insecure.

#### Automatic HTTPS Rewrites
- ✅ Status: ON

**Why:** Rewrites HTTP links to HTTPS, avoiding mixed content warnings.

#### Certificate
- Status: Universal SSL (free)
- Alternative: Advanced Certificate Manager (Pro feature, $10/month)

**Recommendation:** Universal SSL is sufficient unless you need custom SANs.

---

## 📋 Page Rules Strategy (Pro: 20 rules max)

### Priority 1-5: Performance Critical

#### 1. ✅ Live Match API - Bypass Cache
```
URL: www.afriquesports.net/api/can2025/next-match*
Actions: Cache Level = Bypass
```

#### 2. Static Assets - Aggressive Caching
```
URL: www.afriquesports.net/_next/static/*
Actions:
- Cache Level = Cache Everything
- Edge Cache TTL = 1 year
- Browser Cache TTL = 1 year
```

#### 3. Images - Aggressive Caching
```
URL: www.afriquesports.net/*.{jpg,jpeg,png,gif,webp,avif}
Actions:
- Cache Level = Cache Everything
- Edge Cache TTL = 1 year
- Polish = Lossless
```

#### 4. Article Pages - Standard Caching
```
URL: www.afriquesports.net/*/*
Actions:
- Cache Level = Standard
- Edge Cache TTL = 5 minutes
- Browser Cache TTL = 1 hour
```

#### 5. WordPress Admin - Security + No Cache
```
URL: cms.realdemadrid.com/*/wp-admin/*
Actions:
- Cache Level = Bypass
- Security Level = High
- Disable Apps
```

### Priority 6-10: API & Dynamic Content

#### 6. WordPress REST API - Short Cache
```
URL: cms.realdemadrid.com/*/wp-json/*
Actions:
- Cache Level = Standard
- Edge Cache TTL = 1 minute
```

#### 7. Trending API - Longer Cache
```
URL: www.afriquesports.net/api/visits/trending*
Actions:
- Cache Level = Cache Everything
- Edge Cache TTL = 1 hour
```

#### 8. Sitemaps - Daily Cache
```
URL: www.afriquesports.net/*sitemap*.xml
Actions:
- Cache Level = Cache Everything
- Edge Cache TTL = 24 hours
```

#### 9. Homepage - Frequent Updates
```
URL: www.afriquesports.net/
Actions:
- Cache Level = Standard
- Edge Cache TTL = 1 minute
```

#### 10. Category Pages - Medium Cache
```
URL: www.afriquesports.net/category/*
Actions:
- Cache Level = Standard
- Edge Cache TTL = 3 minutes
```

---

## 🚀 Cache Rules (Pro Plan Alternative to Page Rules)

Cloudflare Pro allows creating Cache Rules that are more flexible than Page Rules:

### Rule 1: Static Assets (Highest Priority)
```
Match:
  hostname eq "www.afriquesports.net"
  and (uri.path contains "/_next/static/" or uri.path matches ".*\\.(js|css|woff2?|ttf|eot)$")
Then:
  - Eligible for cache: Yes
  - Edge TTL: 31536000 (1 year)
  - Browser TTL: 31536000 (1 year)
```

### Rule 2: Images
```
Match:
  hostname eq "www.afriquesports.net"
  and uri.path matches ".*\\.(jpg|jpeg|png|gif|webp|avif|svg|ico)$"
Then:
  - Eligible for cache: Yes
  - Edge TTL: 31536000 (1 year)
  - Browser TTL: 86400 (1 day)
```

### Rule 3: Live Match API - No Cache
```
Match:
  hostname eq "www.afriquesports.net"
  and uri.path eq "/api/can2025/next-match"
Then:
  - Cache eligibility: Bypass cache
```

### Rule 4: Article Pages
```
Match:
  hostname eq "www.afriquesports.net"
  and uri.path matches "^/[^/]+/[^/]+/[^/]+$"
Then:
  - Eligible for cache: Yes
  - Edge TTL: 300 (5 minutes)
  - Browser TTL: Respect origin
```

---

## 🔍 Performance Monitoring

### Key Metrics to Track

1. **Cloudflare Analytics Dashboard**
   - Cache Hit Ratio (target: >95%)
   - Bandwidth Saved (target: >80%)
   - Requests by Country
   - Edge Response Time

2. **Origin Server Monitoring**
   - Origin requests (should decrease with better caching)
   - Server load (CPU, memory, Redis usage)

3. **User Experience**
   - Google PageSpeed Insights score
   - Core Web Vitals (LCP, FID, CLS)
   - Time to First Byte (TTFB)

### Expected Improvements

| Metric | Before | Target | Improvement |
|--------|--------|--------|-------------|
| Cache Hit Ratio | ~60% | >95% | +58% |
| Edge Response Time | ~800ms | <200ms | 75% faster |
| Origin Load | 100% | <10% | 90% reduction |
| TTFB (Africa) | ~1.5s | <400ms | 73% faster |
| PageSpeed Score | 65 | >90 | +38% |

---

## 💰 Cost Analysis

### Current: Cloudflare Pro
- **Price:** $20/month
- **Includes:**
  - 20 Page Rules
  - Polish (image optimization)
  - Mobile Redirect
  - WAF managed rules
  - Advanced SSL

### Optional Add-ons

#### Argo Smart Routing
- **Price:** $5/month + $0.10/GB
- **Est. Monthly:** $55 (500GB bandwidth)
- **ROI:** 30% faster = more pageviews = more ad revenue

#### Load Balancing
- **Price:** $5/month + $0.50 per 500k requests
- **Benefit:** Health checks, failover, geo-routing
- **Needed?** Not yet (single origin)

#### Advanced Certificate Manager
- **Price:** $10/month
- **Benefit:** Custom SSL certs, shorter validity, more SANs
- **Needed?** No (Universal SSL sufficient)

---

## 📝 Implementation Checklist

### Immediate (Today)
- [x] Cloudflare Pro subscription activated
- [x] Page Rule created for live match endpoint
- [x] Cache purged for match endpoint
- [ ] Enable Auto Minify (JS, CSS, HTML)
- [ ] Enable HTTP/3
- [ ] Enable Early Hints
- [ ] Set Security Level to Medium
- [ ] Enable Always Online

### This Week
- [ ] Create remaining Page Rules (static assets, images, articles)
- [ ] Configure WAF custom rules (WordPress admin protection)
- [ ] Set up rate limiting for WordPress API
- [ ] Enable Brotli compression verification
- [ ] Test Polish image optimization

### Next 30 Days
- [ ] Monitor cache hit ratio and optimize
- [ ] Review Argo Smart Routing metrics
- [ ] Analyze bandwidth costs
- [ ] A/B test with/without Rocket Loader
- [ ] Fine-tune cache TTLs based on analytics
- [ ] Set up Cloudflare Analytics dashboard alerts

---

## 🛠️ Maintenance Scripts

Created helper scripts in `scripts/`:

1. **purge-match-cache.js** - Purge live match endpoint cache
2. **create-cloudflare-page-rule.js** - Create page rules via API

---

**Last Updated:** January 5, 2026
**Next Review:** February 5, 2026
