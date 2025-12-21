-- Migration: Add post_locale column to visits table
-- This enables language-specific filtering for trending posts

-- Add post_locale column with default value 'fr'
ALTER TABLE visits
ADD COLUMN IF NOT EXISTS post_locale VARCHAR(2) DEFAULT 'fr';

-- Create index for faster querying by locale
CREATE INDEX IF NOT EXISTS idx_visits_post_locale ON visits(post_locale);

-- Create composite index for locale + visit_date for faster trending queries
CREATE INDEX IF NOT EXISTS idx_visits_locale_date ON visits(post_locale, visit_date);

-- Update existing rows to have 'fr' as locale (default language)
UPDATE visits
SET post_locale = 'fr'
WHERE post_locale IS NULL;

-- Add comment to column
COMMENT ON COLUMN visits.post_locale IS 'Language locale of the post (fr, en, es)';
