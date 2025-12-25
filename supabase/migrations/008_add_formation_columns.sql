-- Add formation columns to match_prematch_analysis table
ALTER TABLE match_prematch_analysis
ADD COLUMN IF NOT EXISTS home_formation VARCHAR(10),
ADD COLUMN IF NOT EXISTS away_formation VARCHAR(10);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_match_prematch_analysis_match_id ON match_prematch_analysis(match_id);
