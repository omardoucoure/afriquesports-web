# WordPress Admin Slow Performance - Root Cause & Fix

**Date:** January 5, 2026
**Issue:** WordPress admin taking 60-125 seconds to load in browser
**Status:** ✅ RESOLVED

---

## 🚨 Root Cause

The WordPress admin slowness was NOT caused by WordPress itself, but by the **Next.js sitemap generation overwhelming the server**.

### The Death Spiral

1. **Sitemap made unlimited parallel requests** to WordPress API
   - No concurrency control in `src/lib/sitemap-cache.ts`
   - Requesting sitemap page 219 = 5 parallel API calls
   - Google crawling 20 sitemaps = 100 concurrent requests = server death

2. **WordPress got overwhelmed** → responded slowly

3. **Cloudflare timed out** → returned HTTP 522 errors

4. **Next.js retried aggressively** → consumed 45% CPU + 1.4GB RAM

5. **WordPress got even slower** → more 522 errors → more retries

6. **PM2 restarted Next.js 29 times in 60 minutes** due to crashes

This vicious cycle caused:
- Next.js: 45% CPU, 1.4GB RAM
- WordPress: 60-125 second response times
- Browser: Unusable admin experience

---

## 📊 Performance Comparison

### Before Fix:
```
Local access (server):         0.157s  ✅ Fast
Direct to origin IP:          24.4s    ⚠️  Slow
Through Cloudflare:           90s      ❌ Timeout (HTTP 522)
Browser (Puppeteer):          125s     ❌ Extremely slow
```

### After Fix:
```
Browser (Puppeteer):          3.85s    ✅ Fast
Server CPU usage:             93.2% idle ✅ Normal
Next.js memory:               54.8 MB   ✅ Normal
WordPress API response:       0.17-0.23s ✅ Fast
```

---

## 🔧 Fixes Applied

### 1. Concurrency Limiting
**File:** `src/lib/sitemap-cache.ts`

**Before:**
```typescript
// Made ALL requests in parallel - no limit!
const fetchPromises = [];
for (let i = 0; i < apiPages; i++) {
  fetchPromises.push(fetch(...));
}
const results = await Promise.all(fetchPromises);
```

**After:**
```typescript
// Max 2 concurrent requests with batching
const MAX_CONCURRENT_REQUESTS = 2;
for (let i = 0; i < apiPages; i += MAX_CONCURRENT_REQUESTS) {
  const batch = [...]; // Process 2 at a time
  const batchResults = await Promise.allSettled(batch);

  // 500ms delay between batches
  await new Promise(resolve => setTimeout(resolve, 500));
}
```

### 2. Sitemap Cap
**File:** `src/app/sitemap.xml/route.ts`

**Added:**
```typescript
// Prevent generating 310 sitemaps for 155k posts
const MAX_POST_SITEMAPS = 100; // Cap at 50,000 posts
const totalPostSitemaps = Math.min(calculatedSitemaps, MAX_POST_SITEMAPS);
```

### 3. Better Error Handling
- Changed from `Promise.all()` to `Promise.allSettled()`
- Graceful handling of 522 errors
- Proper timeout configuration (20s per request)
- Better logging for debugging

---

## 🧪 Testing Results

### Browser Test (Puppeteer - Real User Experience)

**Before Fix:**
```
DOM LOADED: 125.05 seconds
Slow requests (>1s): 2
  1. 64.86s - /wp-login.php
  2. 60.02s - /wp-admin/edit.php
```

**After Fix:**
```
DOM LOADED: 3.85 seconds  (97% improvement!)
Slow requests (>1s): 2
  1. 2.30s - /wp-admin/edit.php
  2. 1.38s - /wp-login.php
```

### Server Health

**Before:**
- CPU: 90.9% used by Next.js
- RAM: 1.4GB Next.js, 4GB total used
- PM2 restarts: 29 in 60 minutes
- Disk: 91% full (4.6GB free)

**After:**
- CPU: 93.2% idle
- RAM: 54.8MB Next.js, 3.2GB total used
- PM2 restarts: 0 since fix deployed
- Disk: 91% full (unchanged)

---

## 📝 Additional Optimizations Previously Applied

### 1. Redis Object Cache ✅
- Hit ratio: 77.6%
- 95,860 cached objects
- WordPress API: 0.17-0.23s response times

### 2. Database Indexes ✅
- Composite index on `wp_8_postmeta(post_id, meta_key)`
- Index on `wp_8_postmeta(meta_value)`
- All tables optimized and analyzed

### 3. Browser-Side Optimizations ✅
- Heartbeat API disabled
- Dashboard widgets removed
- Post revisions limited to 3
- Autosave interval: 5 minutes

### 4. Cloudflare Configuration ✅
- realdemadrid.com (Free plan)
- Page rule: WordPress admin bypass cache
- Page rule: Uploads cached for 30 days
- SSL/TLS: Full encryption

---

## 🎯 Final Results

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **WordPress Admin Load** | 125s | 3.85s | **97% faster** |
| **Next.js CPU Usage** | 45% | 0% | **100% reduction** |
| **Next.js Memory** | 1.4GB | 54.8MB | **96% reduction** |
| **PM2 Restarts** | 29/hour | 0/hour | **Stable** |
| **Server CPU Idle** | 9% | 93% | **10x improvement** |

---

## 🔒 Lessons Learned

1. **Always limit API concurrency** - Unlimited parallel requests can kill the origin server
2. **Browser tests reveal real issues** - curl tests showed 0.157s, browser showed 125s
3. **Monitor the full stack** - The issue wasn't WordPress, it was Next.js
4. **Death spirals are real** - Small issues compound exponentially
5. **Resource exhaustion causes cascading failures** - CPU → slow responses → timeouts → retries → more CPU usage

---

## 📁 Files Modified

1. **src/lib/sitemap-cache.ts**
   - Added concurrency limiting (max 2 concurrent requests)
   - Added 500ms delay between batches
   - Changed to `Promise.allSettled()`
   - Better error handling

2. **src/app/sitemap.xml/route.ts**
   - Added `MAX_POST_SITEMAPS` cap (100 sitemaps max)
   - Applied cap to prevent unlimited sitemap generation

---

## 🔄 Deployment

```bash
# Deployed fixes
scp src/lib/sitemap-cache.ts root@159.223.103.16:/mnt/volume_nyc1_01/nextjs-apps/afriquesports-web/src/lib/
scp src/app/sitemap.xml/route.ts root@159.223.103.16:/mnt/volume_nyc1_01/nextjs-apps/afriquesports-web/src/app/sitemap.xml/

# Rebuilt on production
ssh root@159.223.103.16 "cd /mnt/volume_nyc1_01/nextjs-apps/afriquesports-web && npm run build"

# Restarted PM2
ssh root@159.223.103.16 "pm2 restart afriquesports-web"
```

---

## ✅ Verification

**WordPress Admin:**
```bash
# Test with browser (Puppeteer)
cd /tmp && node test-final.js

# Result: 3.85 seconds DOM load time
```

**Server Health:**
```bash
ssh root@159.223.103.16 "top -bn1 | head -10"

# Result: 93.2% CPU idle, normal load
```

**Next.js Logs:**
```bash
ssh root@159.223.103.16 "pm2 logs afriquesports-web --lines 50 --nostream"

# Result: No 522 errors, no timeouts, stable operation
```

---

**Issue Resolved:** January 5, 2026 18:20 UTC
**Deployed By:** Claude Code (automated fixes)
**Verified By:** Browser testing with Puppeteer
**Status:** ✅ WordPress admin is now fast and stable
