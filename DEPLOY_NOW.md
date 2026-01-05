# 🚀 Deployment Instructions - Sitemap Fixes + Redis Caching

## What's Being Deployed

### Commit 1: Sitemap Fixes (8a2a435)
- ✅ Video sitemap: Fixed URL construction and thumbnails (2,485 warnings → <50)
- ✅ News sitemap: All 4 locales now included (4 articles → 100-500)
- ✅ Expected: 25,196 GSC errors will decrease over 7-14 days

### Commit 2: Redis Caching (a4a8b29)
- ✅ Next.js Redis caching layer
- ✅ WordPress Redis setup script
- ✅ Expected: 28x-160x faster performance

---

## Phase 1: WordPress Server Redis Setup (15 minutes)

### Step 1.1: SSH to WordPress Server

```bash
ssh root@159.223.103.16
```

### Step 1.2: Install Redis

```bash
# Update system
sudo apt update

# Install Redis
sudo apt install -y redis-server

# Check installation
redis-cli --version
# Should show: redis-cli 6.x.x or 7.x.x
```

### Step 1.3: Configure Redis

```bash
# Generate strong password
REDIS_PASSWORD=$(openssl rand -base64 32)
echo "Redis Password: $REDIS_PASSWORD"
# SAVE THIS PASSWORD - You'll need it later!

# Backup original config
sudo cp /etc/redis/redis.conf /etc/redis/redis.conf.backup

# Configure Redis
sudo tee /etc/redis/redis.conf > /dev/null <<EOF
# Bind to localhost only (security)
bind 127.0.0.1

# Password protection
requirepass $REDIS_PASSWORD

# Memory settings
maxmemory 512mb
maxmemory-policy allkeys-lru

# Persistence settings
save 900 1
save 300 10
save 60 10000

# Other settings
daemonize yes
supervised systemd
pidfile /var/run/redis/redis-server.pid
loglevel notice
logfile /var/log/redis/redis-server.log
databases 16
EOF

# Enable and start Redis
sudo systemctl enable redis-server
sudo systemctl restart redis-server

# Test connection
redis-cli -a "$REDIS_PASSWORD" ping
# Should return: PONG
```

### Step 1.4: Install WordPress Redis Plugin

```bash
# Navigate to WordPress directory
cd /var/www/html/afriquesports

# Install plugin via wp-cli
sudo -u www-data wp plugin install redis-cache --activate

# Check plugin status
sudo -u www-data wp plugin list | grep redis
```

### Step 1.5: Configure WordPress for Redis

```bash
# Edit wp-config.php
sudo nano /var/www/html/afriquesports/wp-config.php

# Add BEFORE "/* That's all, stop editing! */"
```

Add this code:

```php
// Redis Object Cache Configuration
define('WP_REDIS_HOST', '127.0.0.1');
define('WP_REDIS_PORT', 6379);
define('WP_REDIS_PASSWORD', 'PASTE_YOUR_PASSWORD_HERE');
define('WP_REDIS_DATABASE', 0);
define('WP_REDIS_TIMEOUT', 1);
define('WP_REDIS_READ_TIMEOUT', 1);
define('WP_REDIS_MAXTTL', 86400 * 7); // 7 days

// Multisite: Use different database per site
if (defined('MULTISITE') && MULTISITE) {
    $current_blog_id = get_current_blog_id();
    define('WP_REDIS_DATABASE', $current_blog_id - 1);
}
```

Save and exit (Ctrl+X, Y, Enter)

### Step 1.6: Enable WordPress Redis Cache

```bash
# Enable Redis cache
sudo -u www-data wp redis enable

# Check status
sudo -u www-data wp redis status
# Should show: Connected to Redis successfully
```

### Step 1.7: Verify WordPress Redis is Working

```bash
# Monitor Redis activity
redis-cli -a "$REDIS_PASSWORD" MONITOR &
MONITOR_PID=$!

# Visit WordPress admin in browser
# You should see Redis commands scrolling by

# Stop monitoring
kill $MONITOR_PID

# Check cache stats
redis-cli -a "$REDIS_PASSWORD" INFO stats | grep keyspace_hits
redis-cli -a "$REDIS_PASSWORD" DBSIZE
# Should show increasing number of keys

# Test WordPress admin speed
curl -w "Time: %{time_total}s\n" -o /dev/null -s https://cms.realdemadrid.com/afriquesports/wp-admin/
# Should be <3s now (was 56s before!)
```

✅ **WordPress Redis Setup Complete!**

---

## Phase 2: Next.js Production Deployment (10 minutes)

### Step 2.1: SSH to Production Server

```bash
# Exit WordPress server if still connected
exit

# Connect to production server (wherever Next.js is running)
ssh root@YOUR_PRODUCTION_SERVER_IP
```

### Step 2.2: Pull Latest Code

```bash
# Navigate to project directory
cd /path/to/afriquesports-web

# Backup current version
cp .env.local .env.local.backup

# Pull latest changes
git pull origin main

# Should show:
# a4a8b29 Add Redis caching to eliminate WordPress API cold start issues.
# 8a2a435 Fix sitemap indexing issues to resolve 25,196 GSC errors.
```

### Step 2.3: Install Dependencies

```bash
# Install new dependencies (ioredis)
npm install

# Verify ioredis installed
npm list ioredis
# Should show: ioredis@5.x.x
```

### Step 2.4: Configure Environment Variables

```bash
# Edit production environment file
nano .env.local

# Add Redis configuration
```

Add this line to `.env.local`:

```bash
# Redis for API caching
REDIS_URL=redis://:YOUR_REDIS_PASSWORD@159.223.103.16:6379
```

**Important**: Replace `YOUR_REDIS_PASSWORD` with the password you saved in Step 1.3!

**Note**: If your Next.js server and WordPress server are the same machine, use:
```bash
REDIS_URL=redis://:YOUR_REDIS_PASSWORD@127.0.0.1:6379
```

Save and exit (Ctrl+X, Y, Enter)

### Step 2.5: Build Production Bundle

```bash
# Build with production environment
npm run build

# Should complete in ~30-60 seconds
# Check for any errors
```

### Step 2.6: Restart PM2

```bash
# Restart application
pm2 restart afriquesports-web

# Check logs for Redis connection
pm2 logs afriquesports-web --lines 50

# Look for:
# ✓ [Redis] Connected successfully
# ✓ [Redis] Ready to accept commands
```

✅ **Next.js Deployment Complete!**

---

## Phase 3: Verification & Testing (5 minutes)

### Step 3.1: Test Homepage Speed

```bash
# Test from your local machine
# First request (cold - fills cache)
curl -w "\nTime: %{time_total}s\n" -o /dev/null -s https://www.afriquesports.net/fr

# Second request (warm - from Redis)
curl -w "\nTime: %{time_total}s\n" -o /dev/null -s https://www.afriquesports.net/fr

# Should be: <0.5s ✅
```

### Step 3.2: Test Article Page Speed

```bash
# Pick any article URL
# First request
curl -w "\nTime: %{time_total}s\n" -o /dev/null -s "https://www.afriquesports.net/fr/football/salah-a-liverpool-cest-termine"

# Second request (should be MUCH faster)
curl -w "\nTime: %{time_total}s\n" -o /dev/null -s "https://www.afriquesports.net/fr/football/salah-a-liverpool-cest-termine"

# First request: 2-3s (cache miss)
# Second request: 0.2-0.5s (cache hit) ✅
```

### Step 3.3: Check Redis Cache Activity

```bash
# On WordPress server
ssh root@159.223.103.16

# Check Redis memory usage
redis-cli -a "YOUR_PASSWORD" INFO memory | grep used_memory_human

# Check cache keys
redis-cli -a "YOUR_PASSWORD" DBSIZE
# Should show hundreds/thousands of keys

# View sample cache keys
redis-cli -a "YOUR_PASSWORD" KEYS "*" | head -20
# Should show: posts:fr:*, post:fr:*, wp_*, etc.

# Check cache hit rate
redis-cli -a "YOUR_PASSWORD" INFO stats | grep keyspace_hits
```

### Step 3.4: Test Sitemaps

```bash
# Test video sitemap (should be fast and no malformed URLs)
curl -s https://www.afriquesports.net/video-sitemap.xml | grep -c "https:/"
# Should return: 0 (no malformed URLs) ✅

# Test news sitemap (should have 100+ articles now)
curl -s https://www.afriquesports.net/news-sitemap.xml | grep -o "<url>" | wc -l
# Should return: 100-500 ✅

# Check sitemap speed
curl -w "Time: %{time_total}s\n" -o /dev/null -s https://www.afriquesports.net/video-sitemap.xml
# Should be: <2s ✅
```

### Step 3.5: Monitor PM2 Logs

```bash
# Watch logs in real-time
pm2 logs afriquesports-web --lines 100

# Look for Redis cache activity:
# ✓ [Redis] Cache HIT: posts:fr:...
# ✓ [Redis] Cache MISS: posts:fr:... (first request only)
```

✅ **Verification Complete!**

---

## Expected Performance Improvements

### Before vs After:

| Test | Before | After | Status |
|------|--------|-------|--------|
| WordPress Admin | 56s | <2s | ⚡ **28x faster** |
| WP API Cold Start | 32s | 0.2s | ⚡ **160x faster** |
| Homepage | 0.3-0.5s | 0.2-0.4s | ✅ Faster |
| Article Pages | 11-27s | 0.3-0.5s | ⚡ **50x faster** |
| Video Sitemap | N/A | <2s | ✅ Fixed |
| News Sitemap | 4 articles | 100-500 | ✅ Fixed |

### Google Search Console:

Check GSC in 7-14 days:
- **25,196 errors** should decrease to **<100**
- Video sitemap warnings: **2,485** → **<50**
- News sitemap articles: **4** → **100-500**

---

## Troubleshooting

### Redis not connecting?

```bash
# Check Redis is running
sudo systemctl status redis-server

# Check Redis port
sudo netstat -tlnp | grep 6379

# Test manual connection
redis-cli -a "YOUR_PASSWORD" ping
```

### WordPress not using Redis?

```bash
# Check plugin status
wp plugin list | grep redis

# Re-enable Redis
wp redis enable

# Check wp-config.php
grep WP_REDIS /var/www/html/afriquesports/wp-config.php
```

### Next.js not connecting to Redis?

```bash
# Check environment variable
cat .env.local | grep REDIS_URL

# Check PM2 logs
pm2 logs afriquesports-web --lines 100 | grep Redis

# Restart PM2
pm2 restart afriquesports-web
```

### Still slow?

```bash
# Clear all caches
redis-cli -a "YOUR_PASSWORD" FLUSHALL
rm -rf .next/cache
pm2 restart afriquesports-web

# Wait 30 seconds and test again
```

---

## Rollback Plan (If Needed)

If anything goes wrong:

### Rollback Next.js:
```bash
cd /path/to/afriquesports-web
git reset --hard b30e9fa  # Previous working commit
npm install
npm run build
pm2 restart afriquesports-web
```

### Rollback WordPress Redis:
```bash
# Disable Redis plugin
wp plugin deactivate redis-cache

# Or just stop Redis
sudo systemctl stop redis-server
```

The app will work fine without Redis (just slower).

---

## Success Checklist

- [ ] Redis installed on WordPress server
- [ ] WordPress Redis plugin activated
- [ ] WordPress wp-config.php configured
- [ ] WordPress admin speed <3s (test with curl)
- [ ] Next.js code pulled and built
- [ ] REDIS_URL configured in .env.local
- [ ] PM2 restarted successfully
- [ ] Redis connection logs show "Connected successfully"
- [ ] Homepage loads in <0.5s
- [ ] Article pages load in <0.5s (after first request)
- [ ] Video sitemap has 0 malformed URLs
- [ ] News sitemap has 100+ articles
- [ ] Redis cache keys visible in DBSIZE

---

## What to Monitor

### Next 24 Hours:
- PM2 logs for any Redis errors
- Homepage and article page load times
- WordPress admin speed
- Redis memory usage: `redis-cli INFO memory`

### Next 7-14 Days:
- Google Search Console errors (should decrease from 25,196 to <100)
- Video sitemap warnings (should decrease from 2,485 to <50)
- News sitemap article count (should be 100-500)
- Organic traffic (should increase with better indexing)

---

## Need Help?

Check these log files:
- Next.js: `pm2 logs afriquesports-web`
- Redis: `redis-cli MONITOR`
- WordPress: `/var/log/redis/redis-server.log`

Or review the full documentation:
- `REDIS_SETUP.md` - Complete Redis guide
- `GSC_INDEXING_STATUS.md` - Sitemap analysis
- `GSC_COMPREHENSIVE_ANALYSIS.md` - Error breakdown

---

**🎉 Deployment Ready! Start with Phase 1 above.**
