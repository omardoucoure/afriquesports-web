# WordPress Database Migration - Visits Table

This migration creates the `wp_afriquesports_visits` table in your WordPress MySQL database to track article visits.

## Prerequisites

Add the following environment variables to your `.env.local` file:

```bash
# WordPress Database Configuration
WORDPRESS_DB_HOST=159.223.103.16
WORDPRESS_DB_USER=your_wordpress_db_user
WORDPRESS_DB_PASSWORD=your_wordpress_db_password
WORDPRESS_DB_NAME=wordpress
```

## Running the Migration

```bash
# Navigate to project root
cd /Users/omardoucoure/Documents/Afrique\ Sports/afriquesports-web

# Run the migration
node scripts/migrations/apply_visits_table.js
```

## What This Migration Does

1. Creates table `wp_afriquesports_visits` with columns:
   - `id` - Auto-increment primary key
   - `post_id` - WordPress post ID
   - `post_slug` - Article URL slug
   - `post_title` - Article title
   - `post_image` - Featured image URL
   - `post_author` - Author name
   - `post_category` - Category name
   - `post_source` - Source (default: 'afriquesports')
   - `post_locale` - Language (fr/en/es)
   - `visit_date` - Date of visit (YYYY-MM-DD)
   - `count` - Number of visits for that post on that date
   - `created_at` - Record creation timestamp
   - `updated_at` - Record update timestamp

2. Creates indexes for performance:
   - Unique constraint on `(post_id, visit_date)`
   - Index on `visit_date`
   - Index on `post_locale`
   - Composite index on `(visit_date, post_locale, count)`

## Verification

After running the migration, the script will:
- Confirm the table exists
- Display the table structure
- Show all columns and their types

## Troubleshooting

If the migration fails:
1. Check that your database credentials are correct
2. Ensure your MySQL user has CREATE TABLE permissions
3. Verify network connectivity to the database server
4. Check if the table already exists (migration is idempotent)
