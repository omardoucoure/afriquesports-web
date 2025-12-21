-- ============================================================================
-- Migration: Add post_locale column to visits table
-- Purpose: Enable tracking visits per language (fr, en, es)
-- Date: 2025-12-21
-- ============================================================================

-- Step 1: Add the post_locale column with default value
ALTER TABLE visits
ADD COLUMN IF NOT EXISTS post_locale VARCHAR(2) DEFAULT 'fr';

-- Step 2: Add index for faster queries by locale
CREATE INDEX IF NOT EXISTS idx_visits_locale ON visits(post_locale);

-- Step 3: Update any existing NULL values to 'fr' (French default)
UPDATE visits
SET post_locale = 'fr'
WHERE post_locale IS NULL;

-- Step 4: Make the column NOT NULL now that all rows have values
ALTER TABLE visits
ALTER COLUMN post_locale SET NOT NULL;

-- Step 5: Add composite index for common query patterns
-- (locale + date range queries will be much faster)
CREATE INDEX IF NOT EXISTS idx_visits_locale_date ON visits(post_locale, visit_date DESC);

-- ============================================================================
-- Verification Query
-- ============================================================================
-- Run this to confirm the column was added successfully:
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'visits'
AND column_name = 'post_locale';

-- Expected result:
-- column_name  | data_type         | character_maximum_length | is_nullable | column_default
-- post_locale  | character varying | 2                        | NO          | 'fr'::character varying

-- ============================================================================
-- Test Query
-- ============================================================================
-- After migration, test that visits are being recorded correctly:
SELECT 
    post_locale,
    COUNT(*) as total_visits,
    SUM(count) as total_views
FROM visits
GROUP BY post_locale
ORDER BY total_views DESC;
