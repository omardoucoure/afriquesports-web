# Redis Setup Guide for Afrique Sports

## Performance Problem

WordPress API is experiencing severe cold start issues:
- **Admin dashboard**: 56s on cold start ❌
- **API requests**: 32s cold, 0.18s warm
- **Article pages**: 11-27s load times ❌

## Solution: Redis Caching

Redis will provide:
1. **WordPress Object Cache** - Cache database queries
2. **API Response Cache** - Cache full WordPress responses
3. **Persistent Connections** - Eliminate cold starts

### Expected Results:
| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| WP Admin | 56s | <2s | **28x faster** |
| API Cold Start | 32s | 0.2s | **160x faster** |
| Homepage TTFB | 0.06s | 0.03s | 2x faster |
| Article pages | 11-27s | <0.5s | **50x faster** |

---

## Part 1: WordPress Server Redis Setup

### 1.1 Install Redis on WordPress Server (159.223.103.16)

```bash
# SSH into WordPress server
ssh root@159.223.103.16

# Run the setup script (uploaded to server)
chmod +x /root/setup-redis-wordpress.sh
/root/setup-redis-wordpress.sh
```

Or manual installation:

```bash
# Update system
sudo apt update

# Install Redis
sudo apt install -y redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf

# Add/update these settings:
bind 127.0.0.1
requirepass YOUR_STRONG_PASSWORD_HERE
maxmemory 512mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000

# Enable and start Redis
sudo systemctl enable redis-server
sudo systemctl restart redis-server

# Test connection
redis-cli ping
# Should return: PONG
```

### 1.2 Install WordPress Redis Object Cache Plugin

Option A: Via wp-cli (recommended):
```bash
cd /var/www/html/afriquesports
wp plugin install redis-cache --activate
wp redis enable
```

Option B: Via WordPress admin:
1. Go to https://cms.realdemadrid.com/afriquesports/wp-admin/
2. Navigate to Plugins → Add New
3. Search for "Redis Object Cache"
4. Install and activate plugin
5. Go to Settings → Redis
6. Click "Enable Object Cache"

### 1.3 Configure wp-config.php

Add to `wp-config.php` (before "That's all, stop editing!"):

```php
// Redis Object Cache Configuration
define('WP_REDIS_HOST', '127.0.0.1');
define('WP_REDIS_PORT', 6379);
define('WP_REDIS_PASSWORD', 'YOUR_STRONG_PASSWORD_HERE');
define('WP_REDIS_DATABASE', 0); // Use database 0 for multisite main
define('WP_REDIS_TIMEOUT', 1);
define('WP_REDIS_READ_TIMEOUT', 1);
define('WP_REDIS_MAXTTL', 86400 * 7); // 7 days

// Enable compression for large objects
define('WP_REDIS_IGBINARY', true);

// Use different database IDs for each WordPress site
if (defined('MULTISITE') && MULTISITE) {
    // FR site uses database 0 (default)
    // EN site uses database 1
    // ES site uses database 2
    // AR site uses database 3
    $current_blog_id = get_current_blog_id();
    define('WP_REDIS_DATABASE', $current_blog_id - 1);
}
```

### 1.4 Verify WordPress Redis is Working

```bash
# Check Redis connections
redis-cli INFO clients

# Monitor cache activity
redis-cli MONITOR

# Check cache hit rate
redis-cli INFO stats | grep keyspace_hits
```

Visit your WordPress admin - it should be much faster now!

---

## Part 2: Next.js Application Redis Setup

### 2.1 Environment Variables

Add to `.env.local`:

```bash
# Redis for API caching (production)
REDIS_URL=redis://:YOUR_PASSWORD@127.0.0.1:6379

# Or if using external Redis (Upstash, Redis Cloud, etc.)
# REDIS_URL=rediss://default:password@your-redis-host:6379
```

### 2.2 Verify Installation

Check that ioredis is installed:
```bash
npm list ioredis
# Should show: ioredis@5.x.x
```

If not installed:
```bash
npm install ioredis
```

### 2.3 Build and Test

```bash
# Build with Redis support
npm run build

# Test locally
npm run dev

# Check logs for Redis connection
# Should see: [Redis] ✓ Connected successfully
```

---

## Part 3: Deploy to Production

### 3.1 Upload Files to Server

```bash
# From local machine
cd /Users/omardoucoure/Documents/Afrique\ Sports/afriquesports-web

# Commit changes
git add -A
git commit -m "Add Redis caching for WordPress API performance"
git push origin main

# SSH to production server
ssh root@your-production-server

# Pull latest code
cd /path/to/afriquesports-web
git pull origin main

# Install dependencies
npm install

# Build with production env
npm run build

# Restart PM2
pm2 restart afriquesports-web
pm2 logs afriquesports-web --lines 50
```

### 3.2 Set Production Environment Variables

```bash
# On production server
nano .env.local

# Add:
REDIS_URL=redis://:YOUR_PASSWORD@127.0.0.1:6379

# Or if WordPress and Next.js are on different servers:
REDIS_URL=redis://:PASSWORD@159.223.103.16:6379

# Save and restart
pm2 restart afriquesports-web
```

### 3.3 Verify Redis is Working

```bash
# Check Next.js logs for Redis connection
pm2 logs afriquesports-web --lines 100 | grep Redis

# Should see:
# [Redis] ✓ Connected successfully
# [Redis] ✓ Ready to accept commands
# [Redis] ✗ Cache MISS: posts:fr:... (first request)
# [Redis] ✓ Cache HIT: posts:fr:... (subsequent requests)
```

### 3.4 Test Performance

```bash
# Test article page (should be fast after first load)
curl -w "Time: %{time_total}s\n" -o /dev/null -s https://www.afriquesports.net/fr/football/some-article

# First request: ~2-3s (cache miss, fetches from WordPress)
# Second request: ~0.2-0.5s (cache hit from Redis) ✅
```

---

## Part 4: Monitoring & Maintenance

### 4.1 Monitor Redis Performance

```bash
# Check Redis memory usage
redis-cli INFO memory

# Check cache hit rate
redis-cli INFO stats | grep keyspace

# List all cache keys
redis-cli KEYS "posts:*" | head -20
redis-cli KEYS "post:*" | head -20
```

### 4.2 Clear Cache if Needed

```bash
# Clear all Next.js API cache
redis-cli KEYS "posts:*" | xargs redis-cli DEL
redis-cli KEYS "post:*" | xargs redis-cli DEL

# Or clear entire Redis database
redis-cli FLUSHDB
```

### 4.3 WordPress Cache Management

From WordPress admin:
1. Go to Settings → Redis
2. View cache statistics
3. Click "Flush Cache" to clear WordPress object cache

---

## Troubleshooting

### Redis not connecting from Next.js

```bash
# Check Redis is running
sudo systemctl status redis-server

# Check Redis is listening
sudo netstat -tlnp | grep 6379

# Check firewall (if remote Redis)
sudo ufw allow 6379/tcp

# Test connection manually
redis-cli -h 127.0.0.1 -p 6379 -a YOUR_PASSWORD ping
```

### WordPress not using Redis

```bash
# Check if plugin is active
wp plugin list | grep redis

# Check Redis status from WordPress
wp redis status

# Enable Redis cache
wp redis enable

# Check wp-config.php for Redis constants
grep WP_REDIS /var/www/html/afriquesports/wp-config.php
```

### Cache not clearing

```bash
# Clear Next.js cache
rm -rf /path/to/afriquesports-web/.next/cache

# Clear Redis cache
redis-cli FLUSHALL

# Restart PM2
pm2 restart all
```

---

## Security Notes

1. **Never expose Redis to the internet** - bind only to 127.0.0.1
2. **Use strong passwords** - generate with: `openssl rand -base64 32`
3. **Firewall rules** - if using remote Redis, whitelist only your application server IP
4. **Regular updates** - keep Redis and WordPress plugin updated

---

## Performance Benchmarks

After Redis implementation, you should see:

### WordPress Admin
- **Before**: 56s cold start
- **After**: 1-2s consistently ✅

### API Requests
- **Before**: 32s cold, 0.18s warm
- **After**: 0.15-0.25s consistently ✅

### Homepage
- **Before**: TTFB 0.06s
- **After**: TTFB 0.03s ✅

### Article Pages
- **Before**: 11-27s
- **After**: 0.3-0.5s ✅

---

## Next Steps

1. ✅ Install Redis on WordPress server (Part 1)
2. ✅ Configure WordPress Redis object cache (Part 1)
3. ✅ Add Redis to Next.js application (Part 2)
4. ⏳ Deploy to production (Part 3)
5. ⏳ Monitor and verify performance improvements (Part 4)

---

**Questions?** Check the logs:
- WordPress: `/var/log/redis/redis-server.log`
- Next.js: `pm2 logs afriquesports-web`
- Redis: `redis-cli MONITOR` (shows live commands)
