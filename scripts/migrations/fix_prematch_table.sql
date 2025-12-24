-- Fix wp_match_prematch_analysis to match Supabase schema exactly

-- Add missing columns
ALTER TABLE wp_match_prematch_analysis
  ADD COLUMN IF NOT EXISTS recent_form TEXT AFTER away_form,
  ADD COLUMN IF NOT EXISTS tactical_preview TEXT AFTER tactical_analysis,
  ADD COLUMN IF NOT EXISTS home_formation TEXT AFTER prediction,
  ADD COLUMN IF NOT EXISTS away_formation TEXT AFTER home_formation,
  ADD COLUMN IF NOT EXISTS home_lineup JSON AFTER away_formation,
  ADD COLUMN IF NOT EXISTS away_lineup JSON AFTER home_lineup,
  ADD COLUMN IF NOT EXISTS home_substitutes JSON AFTER away_lineup,
  ADD COLUMN IF NOT EXISTS away_substitutes JSON AFTER home_substitutes;

-- Migrate data from old columns to new columns (if any data exists)
UPDATE wp_match_prematch_analysis
SET
  recent_form = CONCAT_WS(' | ',
    IF(home_form IS NOT NULL, CONCAT('Home: ', home_form), NULL),
    IF(away_form IS NOT NULL, CONCAT('Away: ', away_form), NULL)
  )
WHERE recent_form IS NULL AND (home_form IS NOT NULL OR away_form IS NOT NULL);

UPDATE wp_match_prematch_analysis
SET tactical_preview = tactical_analysis
WHERE tactical_preview IS NULL AND tactical_analysis IS NOT NULL;

-- Drop old columns (optional - keeping for now for backwards compat)
-- ALTER TABLE wp_match_prematch_analysis
--   DROP COLUMN home_form,
--   DROP COLUMN away_form,
--   DROP COLUMN tactical_analysis,
--   DROP COLUMN formations,
--   DROP COLUMN lineups;
