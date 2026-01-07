# Cloudflare Cache Rules - Manual Setup Guide

**Issue:** API token doesn't have permission to configure cache rules automatically.

**Solution:** Configure cache rules manually through Cloudflare Dashboard.

---

## ⚠️ Why This Matters

**Current Status:**
- ❌ No cache rules configured
- ❌ Static assets returning BYPASS instead of HIT
- ❌ Cache hit ratio unknown (should be 85%+)

**Expected Impact After Setup:**
- ✅ Cache hit ratio: 85%+
- ✅ Bandwidth savings: 30-40%
- ✅ Origin server load: -60%
- ✅ Page load speed: +20-30%

---

## 🔧 Option 1: Update API Token Permissions (Recommended)

### Step 1: Go to Cloudflare Dashboard
1. Visit: https://dash.cloudflare.com/profile/api-tokens
2. Find your current token (ends with your zone ID)
3. Click **Edit**

### Step 2: Add Permissions
Add these permissions to the token:
- **Zone** → **Cache Purge** → **Edit**
- **Zone** → **Cache Rules** → **Edit**
- **Zone** → **Page Rules** → **Edit**

### Step 3: Save and Re-run Script
```bash
cd "/Users/omardoucoure/Documents/Afrique Sports/afriquesports-web"
node scripts/configure-cloudflare-cache-rules.js
```

---

## 🖱️ Option 2: Manual Configuration (If API Fails)

### Access Cache Rules
1. Go to: https://dash.cloudflare.com
2. Select your zone: **afriquesports.net**
3. Navigate to: **Caching** → **Cache Rules**
4. Click: **Create rule**

---

## 📋 Rules to Create (In Order)

### Rule 1: Bypass Live Match Endpoint ⚡ **CRITICAL**
**Priority:** 1
**When incoming requests match:**
```
(http.host eq "www.afriquesports.net" and starts_with(http.request.uri.path, "/api/can2025/next-match"))
```

**Then:**
- **Cache eligibility:** Bypass cache

**Why:** Real-time match data must never be cached

---

### Rule 2: Cache WordPress API - 1 Minute 🔄
**Priority:** 2
**When incoming requests match:**
```
(http.host eq "cms.realdemadrid.com" and starts_with(http.request.uri.path, "/wp-json/"))
```

**Then:**
- **Cache eligibility:** Eligible for cache
- **Edge TTL:** Override origin, 60 seconds
- **Browser TTL:** Respect origin

**Why:** Reduces WordPress server load by 83%

---

### Rule 3: Cache Static Assets - 1 Month 📦
**Priority:** 3
**When incoming requests match:**
```
(http.host eq "www.afriquesports.net" and (ends_with(http.request.uri.path, ".css") or ends_with(http.request.uri.path, ".js") or ends_with(http.request.uri.path, ".woff") or ends_with(http.request.uri.path, ".woff2") or ends_with(http.request.uri.path, ".ttf") or starts_with(http.request.uri.path, "/_next/static/")))
```

**Then:**
- **Cache eligibility:** Eligible for cache
- **Edge TTL:** Override origin, 2592000 seconds (30 days)
- **Browser TTL:** Override origin, 31536000 seconds (1 year)

**Why:** Maximum performance for static assets

---

### Rule 4: Cache Images - 1 Month 🖼️
**Priority:** 4
**When incoming requests match:**
```
((http.host eq "www.afriquesports.net" or http.host eq "cms.realdemadrid.com") and (starts_with(http.request.uri.path, "/wp-content/uploads/") or starts_with(http.request.uri.path, "/_next/image") or ends_with(http.request.uri.path, ".jpg") or ends_with(http.request.uri.path, ".jpeg") or ends_with(http.request.uri.path, ".png") or ends_with(http.request.uri.path, ".webp") or ends_with(http.request.uri.path, ".avif")))
```

**Then:**
- **Cache eligibility:** Eligible for cache
- **Edge TTL:** Override origin, 2592000 seconds (30 days)
- **Browser TTL:** Override origin, 31536000 seconds (1 year)

**Why:** Critical for mobile performance in Africa

---

### Rule 5: Bypass WordPress Admin 🔒
**Priority:** 5
**When incoming requests match:**
```
(http.host eq "cms.realdemadrid.com" and (starts_with(http.request.uri.path, "/wp-admin/") or http.request.uri.path eq "/wp-login.php" or http.request.uri.path eq "/xmlrpc.php"))
```

**Then:**
- **Cache eligibility:** Bypass cache

**Why:** WordPress admin must never be cached

---

### Rule 6: Cache Everything for Articles 📰
**Priority:** 6
**When incoming requests match:**
```
(http.host eq "www.afriquesports.net" and not starts_with(http.request.uri.path, "/api/") and not starts_with(http.request.uri.path, "/wp-admin/") and not starts_with(http.request.uri.path, "/_next/data/"))
```

**Then:**
- **Cache eligibility:** Eligible for cache
- **Edge TTL:** Respect origin (Next.js ISR headers)
- **Browser TTL:** Respect origin

**Why:** Caches article pages while respecting Next.js ISR revalidation

---

## ✅ Verification After Setup

### Step 1: Test Cache Status
```bash
# Test article page (should show HIT after first request)
curl -I https://www.afriquesports.net/afrique/senegal/any-article

# Test static asset (should show HIT)
curl -I https://www.afriquesports.net/_next/static/css/some-file.css

# Test live match endpoint (should show DYNAMIC or BYPASS)
curl -I https://www.afriquesports.net/api/can2025/next-match

# Test WordPress API (should show HIT after first request)
curl -I https://cms.realdemadrid.com/wp-json/wp/v2/posts?per_page=1
```

**Look for:** `cf-cache-status: HIT` header

### Step 2: Run Verification Script
```bash
cd "/Users/omardoucoure/Documents/Afrique Sports/afriquesports-web"
node scripts/verify-cloudflare-config.js
```

**Expected Results:**
- ✅ Static assets: HIT or MISS
- ✅ Article pages: HIT, MISS, or EXPIRED
- ✅ Live match: DYNAMIC or BYPASS
- ✅ WordPress admin: BYPASS

### Step 3: Monitor Cache Hit Ratio
- Dashboard: https://dash.cloudflare.com → Analytics → Caching
- **Target:** 85%+ cache hit ratio
- **Timeline:** Give it 24 hours to populate data

---

## 🧹 Purge Cache After Setup

After creating all rules:

```bash
# Option 1: Via dashboard
# Go to: Caching → Configuration → Purge Cache → Purge Everything

# Option 2: Via API (if token has permission)
curl -X POST "https://api.cloudflare.com/client/v4/zones/YOUR_ZONE_ID/purge_cache" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

---

## 📊 Expected Improvements (24-48 Hours)

### Before Cache Rules:
- Cache hit ratio: Unknown (likely <50%)
- Page load time: 2-4 seconds
- Bandwidth: 44.59 GB/day
- Origin requests: ~3.2M/day

### After Cache Rules:
- Cache hit ratio: **85%+** ✅
- Page load time: **<1.5 seconds** ✅
- Bandwidth: **~28-30 GB/day** (35% savings)
- Origin requests: **~480K/day** (85% reduction)

### Cost Savings:
- Bandwidth: ~15 GB/day saved
- Origin server load: -85%
- Faster mobile experience for African users
- Better SEO (Core Web Vitals improvement)

---

## 🚨 Troubleshooting

### Issue: "Authentication error" when using API
**Solution:** API token lacks permissions. Use manual setup above.

### Issue: Static assets still showing BYPASS
**Cause:** Cache rules not created or incorrect expression
**Fix:** Double-check rule expressions match exactly

### Issue: Live match data is cached
**Cause:** Bypass rule not working
**Fix:** Ensure bypass rule has priority 1 (highest)

### Issue: WordPress admin is slow
**Cause:** Admin pages being cached
**Fix:** Verify bypass rule for /wp-admin/ is active

---

## ✅ Final Checklist

- [ ] All 6 cache rules created in correct order
- [ ] Cache purged after creating rules
- [ ] Verification tests passed
- [ ] Cache hit ratio improving over 24 hours
- [ ] Page load speed improved
- [ ] WordPress admin not cached
- [ ] Live match data not cached

---

## 📞 Need Help?

If you encounter issues:

1. Check Cloudflare Dashboard → Analytics → Caching
2. Review cache rule expressions for typos
3. Ensure priorities are correct (1-6)
4. Wait 24 hours for cache to warm up
5. Run verification script again

---

**Last Updated:** January 7, 2026
**Status:** Ready for manual configuration
**Priority:** HIGH - Significant performance impact
