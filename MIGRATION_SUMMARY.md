# Visit Tracking Migration: Supabase → WordPress MySQL

## ✅ Completed Changes

### 1. Installed Dependencies
- ✓ `mysql2` package installed for MySQL connections

### 2. Created MySQL Database Library
- ✓ **src/lib/mysql-db.ts** - New library with MySQL connection pool
  - `recordVisit()` - Records article visits
  - `getTrendingPostsByRange()` - Fetches trending posts
  - `closePool()` - Graceful shutdown

### 3. Database Migration Scripts
- ✓ **scripts/migrations/create_visits_table.sql** - SQL schema for visits table
- ✓ **scripts/migrations/apply_visits_table.js** - Migration runner
- ✓ **scripts/migrations/test_mysql_connection.js** - Connection tester
- ✓ **scripts/migrations/README.md** - Migration documentation

### 4. Updated Application Code
All imports changed from `@/lib/supabase-db` to `@/lib/mysql-db`:
- ✓ src/app/api/visits/record/route.ts
- ✓ src/app/api/visits/trending/route.ts
- ✓ src/app/[locale]/page.tsx
- ✓ src/app/[locale]/mercato/page.tsx
- ✓ src/app/[locale]/category/[...slug]/page.tsx
- ✓ src/app/[locale]/articles/page.tsx
- ✓ src/app/[locale]/[category]/[slug]/page.tsx

### 5. Build Verification
- ✓ TypeScript compilation successful
- ✓ Next.js build completed without errors
- ✓ All 237 pages generated successfully

## 📋 Next Steps - Required Actions

### Step 1: Configure WordPress Database Credentials

Add these environment variables to `.env.local`:

```bash
# WordPress MySQL Database (for visit tracking)
WORDPRESS_DB_HOST=159.223.103.16
WORDPRESS_DB_USER=your_wordpress_username
WORDPRESS_DB_PASSWORD=your_wordpress_password
WORDPRESS_DB_NAME=wordpress
```

**Get credentials from:**
- Your WordPress hosting provider (DigitalOcean)
- Or existing WordPress wp-config.php file

### Step 2: Test MySQL Connection

```bash
node scripts/migrations/test_mysql_connection.js
```

This will verify:
- Database credentials are correct
- Server is accessible
- User has proper permissions

### Step 3: Apply Database Migration

```bash
node scripts/migrations/apply_visits_table.js
```

This creates the `wp_afriquesports_visits` table with:
- Columns for post metadata (id, slug, title, image, etc.)
- Visit tracking (date, count, locale)
- Optimized indexes for performance
- Unique constraint on (post_id, visit_date)

### Step 4: Deploy to Vercel

Once migration is successful:

1. **Add environment variables to Vercel:**
   ```bash
   vercel env add WORDPRESS_DB_HOST
   vercel env add WORDPRESS_DB_USER
   vercel env add WORDPRESS_DB_PASSWORD
   vercel env add WORDPRESS_DB_NAME
   ```

2. **Commit and push changes:**
   ```bash
   git add .
   git commit -m "Migrate visit tracking from Supabase to WordPress MySQL"
   # Wait for user approval before push
   ```

## 🎯 Benefits of This Migration

### Before (Supabase)
- ❌ Limited to free tier row limits
- ❌ Risk of hitting API quotas with high traffic
- ❌ Additional external dependency
- ❌ Potential additional costs at scale

### After (WordPress MySQL)
- ✅ No row limits (uses existing infrastructure)
- ✅ No API quota concerns
- ✅ Consolidated data storage
- ✅ No additional costs
- ✅ Better performance (same datacenter as WordPress)

## 📊 Database Schema

```sql
wp_afriquesports_visits (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  post_id VARCHAR(255),
  post_slug VARCHAR(255),
  post_title TEXT,
  post_image TEXT,
  post_author VARCHAR(255),
  post_category VARCHAR(255),
  post_source VARCHAR(255) DEFAULT 'afriquesports',
  post_locale VARCHAR(10) DEFAULT 'fr',
  visit_date DATE,
  count INT UNSIGNED DEFAULT 1,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE KEY (post_id, visit_date)
)
```

## 🔍 How It Works

1. **Visit Recording** (src/components/tracking/visit-tracker.tsx)
   - Client component tracks page views
   - Sends POST to `/api/visits/record`
   - MySQL upserts visit count atomically

2. **Trending Posts** (All page components)
   - Fetch top posts from MySQL
   - Aggregates counts across date range
   - Filters by locale (fr/en/es)

3. **Performance**
   - Indexed queries for fast lookups
   - Connection pooling for efficiency
   - Atomic upserts prevent race conditions

## ⚠️ Important Notes

- Supabase code still exists in `src/lib/supabase-db.ts` (can be kept for other features)
- Old Supabase visits data will NOT be migrated automatically
- If needed, we can write a data migration script later
- The `visits` table in Supabase will no longer receive new data

## 🧪 Testing Checklist

After deployment:
- [ ] Visit an article page
- [ ] Check MySQL table has new row
- [ ] Verify "Most Read" widget displays
- [ ] Check Vercel logs for any MySQL errors
- [ ] Monitor visit counts increment correctly

## 🆘 Troubleshooting

**If connection fails:**
1. Check firewall allows connections from Vercel IPs
2. Verify MySQL user has remote access enabled
3. Confirm database credentials are correct
4. Check SSL/TLS requirements

**If visits not recording:**
1. Check Vercel logs: `vercel logs <deployment-url>`
2. Verify environment variables are set
3. Test locally with `npm run dev`
4. Check MySQL user has INSERT/UPDATE permissions
