-- ============================================================================
-- Add Lineup Fields to Pre-Match Analysis
-- Created: 2025-12-21
-- ============================================================================

-- Add lineup columns for both teams (JSONB for flexibility)
ALTER TABLE match_prematch_analysis
ADD COLUMN IF NOT EXISTS home_lineup JSONB,  -- Array of player objects: [{number, name, position}]
ADD COLUMN IF NOT EXISTS away_lineup JSONB,  -- Array of player objects: [{number, name, position}]
ADD COLUMN IF NOT EXISTS home_substitutes JSONB,  -- Array of substitute player objects
ADD COLUMN IF NOT EXISTS away_substitutes JSONB;  -- Array of substitute player objects

-- Add comments to document the column purpose
COMMENT ON COLUMN match_prematch_analysis.home_lineup IS 'Starting lineup for home team - Array of {number, name, position}';
COMMENT ON COLUMN match_prematch_analysis.away_lineup IS 'Starting lineup for away team - Array of {number, name, position}';
COMMENT ON COLUMN match_prematch_analysis.home_substitutes IS 'Substitute players for home team - Array of {number, name, position}';
COMMENT ON COLUMN match_prematch_analysis.away_substitutes IS 'Substitute players for away team - Array of {number, name, position}';

-- ============================================================================
-- LINEUP FIELDS ADDED
-- AI will now include detailed lineups in pre-match analysis.
--
-- Example JSON structure:
-- home_lineup: [
--   {"number": 1, "name": "Y. Bounou", "position": "Gardien"},
--   {"number": 2, "name": "A. Hakimi", "position": "Défenseur"},
--   {"number": 7, "name": "H. Ziyech", "position": "Attaquant"}
-- ]
--
-- Positions (in French):
-- - Gardien (Goalkeeper)
-- - Défenseur (Defender)
-- - Milieu (Midfielder)
-- - Attaquant (Forward/Striker)
-- ============================================================================
