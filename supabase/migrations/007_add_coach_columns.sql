-- ============================================================================
-- Add Coach Columns to Pre-Match Analysis
-- Created: 2025-12-25
-- ============================================================================

-- Add coach columns for both teams
ALTER TABLE match_prematch_analysis
ADD COLUMN IF NOT EXISTS home_coach VARCHAR(255),  -- e.g., "Carlos Alberto Parreira"
ADD COLUMN IF NOT EXISTS away_coach VARCHAR(255);  -- e.g., "Raymond Domenech"

-- Add comments to document the column purpose
COMMENT ON COLUMN match_prematch_analysis.home_coach IS 'Head coach/manager for home team';
COMMENT ON COLUMN match_prematch_analysis.away_coach IS 'Head coach/manager for away team';

-- ============================================================================
-- COACH FIELDS ADDED
-- AI will now include head coach names in pre-match analysis.
-- ============================================================================
