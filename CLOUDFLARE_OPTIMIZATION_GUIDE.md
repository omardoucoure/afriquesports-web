# Cloudflare Optimization Guide for Afrique Sports

**Date:** January 5, 2026
**Status:** Implementation Ready
**Architecture:** Headless WordPress (CMS) + Next.js 16 (Frontend)

---

## Executive Summary

This guide implements comprehensive Cloudflare optimizations for maximum performance targeting African mobile users with SEO preservation for Google News traffic.

**Expected Results:**
- ⚡ 30-40% faster load times on mobile (HTTP/3 + compression)
- 📈 85%+ cache hit ratio (vs current ~70%)
- 🔒 Enhanced security (WAF + bot protection)
- 💰 Potential $45-60/month savings in Vercel costs

---

## Quick Start (30 Minutes)

### Step 1: Run Automated Cache Rules Configuration

```bash
cd /Users/omardoucoure/Documents/Afrique\ Sports/afriquesports-web

# Install dependencies if needed
npm install

# Configure cache rules automatically
node scripts/configure-cloudflare-cache-rules.js
```

**What this does:**
- Creates 6 optimized cache rules
- Bypasses cache for live match data
- Caches WordPress API for 1 minute
- Aggressive caching for static assets (1 month)
- Purges all existing cache

### Step 2: Manual Cloudflare Dashboard Configuration

Complete these settings in Cloudflare dashboard:

#### 2.1 Speed Optimization (5 minutes)

**Location:** Speed > Optimization

- ✅ **Auto Minify:**
  - ✅ JavaScript: ON
  - ✅ CSS: ON
  - ❌ HTML: OFF (Next.js handles this)

- ✅ **Brotli:** ON (default)

- ✅ **Early Hints:** ON

- ❌ **Rocket Loader:** OFF (CRITICAL - breaks Next.js)

#### 2.2 Network Optimization (3 minutes)

**Location:** Network

- ✅ **HTTP/3 (with QUIC):** ON
- ✅ **HTTP/2:** ON (default)
- ✅ **0-RTT Connection Resumption:** ON
- ✅ **IPv6 Compatibility:** ON

#### 2.3 Image Optimization (2 minutes)

**Location:** Speed > Optimization > Image Optimization

- **Polish:** Lossy
- **WebP:** ON
- **Image Resizing:** OFF (Next.js handles this)
- **Mirage:** OFF (prevents layout shifts)

#### 2.4 Security (WAF) (10 minutes)

**Location:** Security > WAF

**Enable Managed Rulesets:**
1. ✅ Cloudflare Managed Ruleset
2. ✅ Cloudflare OWASP Core Ruleset
3. ✅ Cloudflare WordPress Ruleset
4. ✅ Cloudflare Exposed Credentials Check
5. ✅ Next.js CVE-2025-29927 (critical)

**Create Custom Rules:**

**Rule 1: Protect WordPress Login**
```
Expression:
(http.request.uri.path eq "/wp-login.php" or
 http.request.uri.path contains "/wp-admin") and
cf.threat_score > 14

Action: JS Challenge
```

**Rule 2: Rate Limit WordPress API**
```
Expression:
http.request.uri.path contains "/wp-json/"

Action: Rate Limit (300 requests per 5 minutes)
```

**Rule 3: Block Bad Bots**
```
Expression:
(cf.bot_management.score lt 30) and
not http.request.uri.path contains "/wp-json/"

Action: Block
```

#### 2.5 DNS Configuration (2 minutes)

**Location:** DNS > Records

Verify all records are **Proxied (orange cloud)**:
- ✅ www.afriquesports.net → 159.223.103.16 (Proxied)
- ✅ @afriquesports.net → 159.223.103.16 (Proxied)
- ✅ cms.realdemadrid.com → 159.223.103.16 (Proxied)

**DNS Settings:**
- ✅ CNAME Flattening: ON
- ✅ DNSSEC: ON

---

## Cache Rules Explained

### Rule 1: Bypass Live Match Endpoint (Priority 1)
**Pattern:** `www.afriquesports.net/api/can2025/next-match*`
**Action:** Bypass cache
**Why:** Real-time match data must NEVER be cached

### Rule 2: Cache WordPress API (Priority 2)
**Pattern:** `cms.realdemadrid.com/wp-json/*`
**Action:** Cache for 60 seconds
**Why:** Reduces load on WordPress, was causing 350 req/min before

### Rule 3: Cache Static Assets (Priority 3)
**Pattern:** `.css`, `.js`, `.woff`, `.woff2`, `/_next/static/*`
**Action:** Edge cache 30 days, browser cache 1 year
**Why:** These files never change after deployment

### Rule 4: Cache Images (Priority 4)
**Pattern:** `/wp-content/uploads/*`, `/_next/image*`, `.jpg`, `.png`, `.webp`, `.avif`
**Action:** Edge cache 30 days, browser cache 1 year
**Why:** Massive performance boost for mobile users

### Rule 5: Bypass WordPress Admin (Priority 5)
**Pattern:** `/wp-admin/*`, `/wp-login.php`, `/xmlrpc.php`
**Action:** Bypass cache
**Why:** Admin pages must always be fresh

### Rule 6: Cache Everything for Articles (Priority 6)
**Pattern:** All www.afriquesports.net pages except API/admin
**Action:** Respect Next.js ISR headers
**Why:** Honors ISR revalidation (60-600s) while maximizing edge caching

---

## Testing & Verification

### 1. Test Cache Status

**Live Match Endpoint (should be DYNAMIC/BYPASS):**
```bash
curl -I https://www.afriquesports.net/api/can2025/next-match
# Look for: cf-cache-status: DYNAMIC or BYPASS
```

**Article Page (should be HIT after first request):**
```bash
# First request
curl -I https://www.afriquesports.net/afrique/senegal/sadio-mane-article
# cf-cache-status: MISS

# Second request (should be cached)
curl -I https://www.afriquesports.net/afrique/senegal/sadio-mane-article
# cf-cache-status: HIT ✅
```

**WordPress API (should cache for 60s):**
```bash
curl -I https://cms.realdemadrid.com/wp-json/wp/v2/posts?per_page=10
# age: should increase on repeated requests within 60s
```

**Static Assets (should be HIT):**
```bash
curl -I https://www.afriquesports.net/_next/static/css/app.css
# cf-cache-status: HIT
```

### 2. Test Image Optimization

**WebP Conversion:**
```bash
curl -H "Accept: image/webp" \
  https://www.afriquesports.net/wp-content/uploads/2025/01/test.jpg \
  -I | grep -i content-type

# Should return: content-type: image/webp (if Polish is working)
```

**Polish Status:**
```bash
curl -I https://www.afriquesports.net/wp-content/uploads/2025/01/test.jpg
# Look for: cf-polished: origSize=500000, status=success
```

### 3. Test Performance

**PageSpeed Insights:**
```
https://pagespeed.web.dev/
Test: https://www.afriquesports.net
Target: 90+ mobile score
```

**GTmetrix from Africa:**
```
https://gtmetrix.com
Location: Johannesburg, South Africa
Target: Grade A, < 3s load time
```

**WebPageTest from Dakar:**
```
https://webpagetest.org
Location: Dakar, Senegal
Target: < 2.5s LCP, < 0.1 CLS
```

### 4. Monitor Cache Hit Ratio

**Cloudflare Dashboard:**
```
Analytics > Caching > Cache Analytics

Target Metrics:
- Cache hit ratio: 85%+ (currently ~70%)
- Bandwidth saved: 60%+
- Requests served from cache: 80%+
```

---

## Optional: Argo Smart Routing

### Should You Enable Argo?

**Cost:** $5/month + $0.10/GB over 1GB

**Benefits:**
- 30-33% average TTFB reduction
- 25-75% improvement for African users hitting DigitalOcean
- Most beneficial for uncached requests

**Decision Matrix:**

✅ **Enable if:**
- Monthly traffic > 50GB
- Majority of traffic from Africa (Senegal, Cameroon, Côte d'Ivoire)
- Heavy WordPress API usage (uncached requests)
- You notice slow TTFB in Analytics (> 500ms)

❌ **Skip if:**
- Cache hit ratio already > 85%
- Most traffic is repeat visitors (hitting edge cache)
- Monthly traffic < 20GB
- Budget is tight

**How to test:**
1. Enable Argo for 1 month
2. Monitor: Analytics > Argo
3. Calculate: `(Improved revenue) > ($5 + traffic_GB * $0.10)`
4. Keep enabled if ROI is positive

---

## Advanced: Cloudflare Workers (Optional)

If you want even more control, create a Worker for custom WordPress API caching:

**File:** `cloudflare-worker.js`

```javascript
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Bypass cache for admin/login
    if (url.pathname.startsWith('/wp-admin') ||
        url.pathname.startsWith('/wp-login')) {
      return fetch(request);
    }

    // Custom cache for WordPress API
    if (url.pathname.startsWith('/wp-json/')) {
      const cache = caches.default;
      let response = await cache.match(request);

      if (!response) {
        response = await fetch(request);
        response = new Response(response.body, response);
        response.headers.set('Cache-Control', 'public, max-age=60');
        ctx.waitUntil(cache.put(request, response.clone()));
      }
      return response;
    }

    return fetch(request);
  }
};
```

**Cost:** Free for first 100,000 requests/day (your traffic is well under this)

---

## Troubleshooting

### Issue 1: Live Match Data is Cached

**Symptoms:** Match scores don't update in real-time

**Fix:**
```bash
# Verify cache rule exists
node scripts/configure-cloudflare-cache-rules.js

# Manually purge cache
curl -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{"files":["https://www.afriquesports.net/api/can2025/next-match"]}'
```

### Issue 2: Cache Hit Ratio Still Low

**Symptoms:** < 70% cache hit ratio in Analytics

**Diagnostic:**
```bash
# Check which URLs are cache misses
# In Cloudflare Dashboard: Analytics > Caching > Top Cache Misses
```

**Common causes:**
- Query parameters causing unique URLs
- Cookies preventing caching
- Vary headers from origin

**Fix:**
- Add cache rules to ignore query strings
- Configure cache keys in Cloudflare

### Issue 3: WordPress Admin Still Slow

**Symptoms:** wp-admin pages slow despite cache bypass

**This is NOT a Cloudflare issue** - It's server-side. Solutions:

1. **Verify cache is bypassed:**
   ```bash
   curl -I https://cms.realdemadrid.com/wp-admin/edit.php
   # Should see: cf-cache-status: BYPASS or DYNAMIC
   ```

2. **Check server optimizations:**
   - LiteSpeed: `PHP_LSAPI_CHILDREN=80`, `maxConns=80`
   - PHP OpCache: 512MB, 30k files
   - MU-Plugin: `optimize-admin-posts-list.php` active

3. **Monitor Next.js CPU usage:**
   ```bash
   ssh root@159.223.103.16 'top -bn1 | grep "node"'
   # Should be < 50% CPU
   ```

### Issue 4: WAF Blocking Legitimate Users

**Symptoms:** Users see Cloudflare challenge/block pages

**Fix:**
```bash
# Check Firewall Events log in Dashboard
# Add IP whitelist rule if needed

# In Cloudflare Dashboard: Security > WAF > Firewall Rules
# Create rule:
# Expression: (ip.src eq YOUR_OFFICE_IP)
# Action: Allow
```

### Issue 5: Images Not Converting to WebP

**Symptoms:** Images still served as JPEG/PNG

**Diagnostic:**
```bash
curl -H "Accept: image/webp" \
  https://www.afriquesports.net/wp-content/uploads/2025/01/test.jpg \
  -I | grep content-type
```

**Common causes:**
- Polish not enabled or set to "Lossless"
- Image too large (> 10MB)
- Origin already serving WebP

**Fix:**
1. Verify Polish is "Lossy" in Dashboard
2. Check image file size
3. Ensure origin serves JPEG/PNG (not WebP)

---

## Monitoring & Alerts

### Set Up Alerts in Cloudflare

**Location:** Notifications > Add

**Recommended Alerts:**

1. **Cache Hit Ratio Drop**
   - Trigger: < 70%
   - Action: Email notification

2. **Origin Error Rate**
   - Trigger: > 5% errors
   - Action: Email + Slack

3. **Security Events**
   - Trigger: > 100 blocked requests/minute
   - Action: Email notification

4. **Performance Degradation**
   - Trigger: LCP > 3s (from Observatory)
   - Action: Email notification

### Key Metrics to Track

**Daily:**
- Cache hit ratio (target: 85%+)
- Bandwidth saved (target: 60%+)
- Security threats blocked

**Weekly:**
- Core Web Vitals (LCP, FID/INP, CLS)
- Page load time by country
- API response times

**Monthly:**
- Total bandwidth (for Argo cost calculation)
- Estimated cost savings vs Vercel
- Google Search Console impressions/clicks

---

## Cost Summary

### Current Monthly Costs

**Cloudflare Pro:** $20/month
- Unlimited cache rules
- Advanced DDoS protection
- WAF with managed rulesets
- Image optimization (Polish)
- Web Analytics

**Optional Add-ons:**
- Argo Smart Routing: $5/month + $0.10/GB (estimate $10-20/month)
- Workers: Free (under 100k req/day)

**Total:** $20-40/month

### Estimated Savings

**Vercel ISR Optimization:**
- Previous commit saved: $45-60/month
- Additional cache optimization: $20-30/month (fewer function executions)
- Total potential savings: $65-90/month

**Net ROI:** Positive $25-50/month even with Argo enabled

---

## Rollback Plan

If anything goes wrong:

### Quick Rollback (5 minutes)

```bash
# 1. Delete all cache rules
node scripts/configure-cloudflare-cache-rules.js
# (Run with empty rules array)

# 2. Purge all cache
curl -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{"purge_everything":true}'

# 3. Disable optimizations in Cloudflare Dashboard
# Speed > Optimization > Disable all
```

### Full Rollback (10 minutes)

1. Set DNS to "DNS Only" (gray cloud) for all records
2. Wait 5 minutes for DNS propagation
3. Traffic now bypasses Cloudflare entirely
4. Investigate issues
5. Re-enable Cloudflare when fixed

---

## SEO Preservation Checklist

Critical for Google News traffic:

- ✅ Canonical URLs preserved (not modified by Cloudflare)
- ✅ Sitemap caching: 10 minutes (not too aggressive)
- ✅ robots.txt not cached
- ✅ Structured data (JSON-LD) not modified
- ✅ Redirect chains maintained
- ✅ hreflang tags preserved
- ✅ `x-robots-tag` headers respected
- ✅ Google News sitemap revalidates frequently

**Test after configuration:**
```bash
# Verify canonical URL
curl https://www.afriquesports.net/afrique/senegal/article \
  | grep 'rel="canonical"'

# Verify structured data not corrupted
curl https://www.afriquesports.net/afrique/senegal/article \
  | grep 'application/ld+json' | jq .

# Verify sitemap caching
curl -I https://www.afriquesports.net/news-sitemap.xml
# age should reset every 600s (10 minutes)
```

---

## Next Steps

After completing this configuration:

1. **Monitor for 24 hours:**
   - Check cache hit ratio
   - Monitor for errors in Cloudflare Analytics
   - Verify live match data still updates

2. **Performance testing:**
   - Run PageSpeed Insights
   - Test from African locations
   - Compare Core Web Vitals before/after

3. **SEO validation:**
   - Check Google Search Console for crawl errors
   - Verify indexed pages count hasn't dropped
   - Monitor Google News impressions

4. **Decide on Argo:**
   - Enable Argo for 1 month trial
   - Compare TTFB improvement
   - Calculate ROI and decide to keep or disable

5. **Ongoing optimization:**
   - Review cache analytics weekly
   - Adjust TTLs based on traffic patterns
   - Fine-tune WAF rules if false positives

---

## Support & Resources

**Cloudflare Documentation:**
- Cache Rules: https://developers.cloudflare.com/cache/
- WAF: https://developers.cloudflare.com/waf/
- Polish: https://developers.cloudflare.com/images/polish/
- Argo: https://developers.cloudflare.com/argo-smart-routing/

**Performance Testing:**
- PageSpeed Insights: https://pagespeed.web.dev/
- GTmetrix: https://gtmetrix.com/
- WebPageTest: https://webpagetest.org/

**Monitoring:**
- Cloudflare Analytics Dashboard
- Google Search Console
- Vercel Analytics (if still using)

---

**Configuration Date:** January 5, 2026
**Last Updated:** January 5, 2026
**Version:** 1.0
**Status:** ✅ Ready for Implementation
