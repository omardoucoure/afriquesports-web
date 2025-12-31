-- Add indexes to wp_afriquesports_visits table for better query performance
-- Run this on the WordPress MySQL database (159.223.103.16)

-- Index on visit_date for date range queries
-- This speeds up all queries filtering by visit_date >= ?
CREATE INDEX IF NOT EXISTS idx_visit_date
ON wp_afriquesports_visits(visit_date);

-- Composite index for author statistics queries
-- This speeds up queries grouping by post_author with date filtering
CREATE INDEX IF NOT EXISTS idx_author_date
ON wp_afriquesports_visits(post_author, visit_date);

-- Composite index for top pages queries
-- This speeds up queries grouping by post_id with date filtering
CREATE INDEX IF NOT EXISTS idx_post_date
ON wp_afriquesports_visits(post_id, visit_date);

-- Show the newly created indexes
SHOW INDEX FROM wp_afriquesports_visits WHERE Key_name LIKE 'idx_%';
