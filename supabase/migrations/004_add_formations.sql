-- ============================================================================
-- Add Formation Fields to Pre-Match Analysis
-- Created: 2025-12-21
-- ============================================================================

-- Add formation columns for both teams
ALTER TABLE match_prematch_analysis
ADD COLUMN IF NOT EXISTS home_formation VARCHAR(20),  -- e.g., "4-3-3", "4-2-3-1", "3-5-2"
ADD COLUMN IF NOT EXISTS away_formation VARCHAR(20);  -- e.g., "4-3-3", "4-2-3-1", "3-5-2"

-- Add comment to document the column purpose
COMMENT ON COLUMN match_prematch_analysis.home_formation IS 'Expected formation for home team (e.g., 4-3-3, 4-2-3-1)';
COMMENT ON COLUMN match_prematch_analysis.away_formation IS 'Expected formation for away team (e.g., 4-3-3, 4-2-3-1)';

-- ============================================================================
-- FORMATION FIELDS ADDED
-- AI will now include team formations in pre-match analysis:
-- ✅ home_formation - Expected formation for home team
-- ✅ away_formation - Expected formation for away team
-- Common formations: 4-3-3, 4-2-3-1, 4-4-2, 3-5-2, 5-3-2, 3-4-3
-- ============================================================================
