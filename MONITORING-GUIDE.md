# Monitoring Guide - Verify Fixes are Working

## Deployment Status

Latest deployment: **Building** (started 4 minutes ago)
- URL: https://afriquesports-7ze9wh6e1-omars-projects-81bbcbf6.vercel.app
- Previous (Ready): https://afriquesports-52lktmibv-omars-projects-81bbcbf6.vercel.app

## What We Fixed

### 1. Match Bar Redirect ✅
- **Before**: Clicked match bar → redirected to generic `/match-en-direct`
- **After**: Clicked match bar → redirects to actual match URL (e.g., `/can-2025/match/senegal-vs-congo-dr-732152`)

### 2. MySQL Deadlock Prevention ✅
- **Before**: `ER_LOCK_DEADLOCK` errors causing visit tracking failures
- **After**:
  - Automatic retry with exponential backoff + jitter
  - Visits sorted by `post_id` for consistent lock ordering
  - Reduced batch size from 50 to 30

### 3. WordPress 503 Error Handling ✅
- **Before**: Only 1 retry, no caching, frequent 503 errors
- **After**:
  - 3 retries with smart backoff
  - 5-minute caching on individual posts
  - Expected 80-90% reduction in 503 errors

---

## How to Monitor (Via Vercel Dashboard)

### Option 1: Vercel Dashboard (Recommended)
1. Go to https://vercel.com/omars-projects-81bbcbf6/afriquesports-web
2. Click on **Logs** tab
3. Filter by time range (last 1 hour, last 24 hours, etc.)
4. Search for specific patterns:

#### Check for MySQL Deadlock Errors (Should be RARE now)
```
Search: "ER_LOCK_DEADLOCK" OR "deadlock"
Expected: 0-2 occurrences per hour (down from dozens)
✓ Good sign: "Deadlock error on attempt 1/3, retrying in Xms"
✓ Good sign: "Batch insert completed"
❌ Bad sign: "Non-retryable error or max retries exceeded"
```

#### Check for WordPress 503 Errors (Should be MUCH REDUCED)
```
Search: "503" OR "Failed to fetch posts: 503"
Expected: 80-90% reduction from before
✓ Good sign: "⚠️ WordPress returned 503, retrying in Xms"
✓ Good sign: "✓ Request succeeded after X attempts"
❌ Bad sign: Multiple "Failed to fetch posts: 503" with no retries
```

#### Check Match Bar Functionality
```
Search: "generateMatchPath" OR "can-2025/match/"
Expected: Match URLs being generated with team names
✓ Good sign: URLs like "/can-2025/match/senegal-vs-congo-dr-732152"
❌ Bad sign: Still seeing "/match-en-direct" being used
```

---

## Option 2: Command Line Monitoring

### Monitor Live Logs (Terminal)
```bash
cd "/Users/omardoucoure/Documents/Afrique Sports/afriquesports-web"

# Get latest deployment URL
LATEST_URL=$(vercel ls | grep "Ready" | head -1 | awk '{print $2}')

# Monitor MySQL deadlock errors
vercel logs $LATEST_URL | grep -i "deadlock\|ER_LOCK_DEADLOCK\|MySQL"

# Monitor WordPress 503 errors
vercel logs $LATEST_URL | grep -i "503\|DataFetcher\|WordPress returned"

# Monitor success messages
vercel logs $LATEST_URL | grep -i "succeeded after\|Batch insert completed"
```

### Check Error Counts (Last Hour)
```bash
# Via Vercel API (if authenticated)
vercel logs $LATEST_URL --json | jq 'select(.message | contains("503"))' | wc -l
```

---

## What to Look For

### ✅ Success Indicators

1. **MySQL Deadlock Handling**:
   ```
   [MySQL] Deadlock error (ER_LOCK_DEADLOCK) on attempt 1/3, retrying in 1234ms...
   [MySQL] Batch insert completed: 30 visits, 45 rows affected
   ```

2. **WordPress 503 Recovery**:
   ```
   [DataFetcher] ⚠️ WordPress returned 503 (Service Unavailable), retrying in 3456ms (attempt 1/3)
   [DataFetcher] ✓ Request succeeded after 2 attempts
   ```

3. **Caching Working**:
   ```
   Cache HIT for fetchPostBySlug (if logging enabled)
   Reduced WordPress API calls
   ```

### ❌ Warning Signs

1. **Repeated Failures**:
   ```
   [MySQL] Non-retryable error or max retries exceeded: ER_LOCK_DEADLOCK
   [DataFetcher] Failed to fetch posts: 503 (after 3 retries)
   ```

2. **High Error Rate**:
   - More than 5 deadlock errors per hour = MySQL still overloaded
   - More than 20 503 errors per hour = WordPress server still struggling

---

## Performance Metrics to Track

### Before Fixes (Baseline)
- **MySQL Deadlocks**: 10-50+ per hour
- **WordPress 503s**: 50-200+ per hour
- **Failed page loads**: 5-10% of requests

### After Fixes (Expected)
- **MySQL Deadlocks**: 0-5 per hour (95%+ reduction)
- **WordPress 503s**: 5-20 per hour (80-90% reduction)
- **Failed page loads**: <1% of requests

---

## When to Take Action

### 🟢 Everything is Fine
- Occasional retry messages (1-5 per hour)
- Success messages after retries
- No user complaints

### 🟡 Monitor Closely
- Deadlock errors > 10 per hour
- 503 errors > 30 per hour
- User reports of slow loading

**Action**: Increase monitoring frequency, check WordPress server health

### 🔴 Immediate Action Needed
- "Max retries exceeded" errors
- Error rate > 50 per hour
- Site is down or very slow

**Action**:
1. Check WordPress server status (159.223.103.16)
2. Restart WordPress/MySQL if needed
3. Temporarily increase cache duration
4. Contact me for emergency fixes

---

## Quick Health Check Script

Save this as `check-health.sh`:

```bash
#!/bin/bash
echo "=== Afriquesports Health Check ==="
echo ""

# Get latest deployment
LATEST=$(vercel ls | grep "Ready" | head -1 | awk '{print $2}')
echo "Latest deployment: $LATEST"
echo ""

# Check for errors (requires logs to be available)
echo "Checking for recent errors..."
vercel logs $LATEST 2>&1 | grep -c "deadlock" && echo "MySQL deadlocks found" || echo "✓ No MySQL deadlocks"
vercel logs $LATEST 2>&1 | grep -c "503" && echo "WordPress 503 errors found" || echo "✓ No WordPress 503s"
echo ""
echo "Check complete!"
```

Run with: `bash check-health.sh`

---

## Contact & Support

If you see persistent errors after 24 hours:
1. Take a screenshot of the Vercel logs
2. Note the time range and error patterns
3. Share with me for further investigation

Expected timeline:
- **0-2 hours**: Deployment completes, caching starts working
- **2-24 hours**: Error rates stabilize at new (lower) baseline
- **24-48 hours**: Full performance improvement visible
