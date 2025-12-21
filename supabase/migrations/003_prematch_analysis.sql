-- ============================================================================
-- Pre-Match Analysis Table - AI-Generated Match Previews
-- Created: 2025-12-21
-- ============================================================================

-- Pre-Match Analysis (AI-generated before matches)
CREATE TABLE IF NOT EXISTS match_prematch_analysis (
  id BIGSERIAL PRIMARY KEY,
  match_id VARCHAR(50) NOT NULL,
  locale VARCHAR(2) NOT NULL,                   -- fr, en, es, ar
  head_to_head TEXT,                            -- Historical confrontation stats
  recent_form TEXT,                             -- Latest form of both teams
  key_players TEXT,                             -- Key players to watch
  tactical_preview TEXT,                        -- Tactical analysis
  prediction TEXT,                              -- AI prediction with probabilities
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_prematch_analysis UNIQUE(match_id, locale)
);

-- Indexes for performance
CREATE INDEX idx_prematch_match ON match_prematch_analysis(match_id);
CREATE INDEX idx_prematch_created ON match_prematch_analysis(created_at DESC);

-- Row Level Security (RLS)
ALTER TABLE match_prematch_analysis ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read access" ON match_prematch_analysis
  FOR SELECT
  USING (true);

-- Trigger for automatic timestamp updates
CREATE TRIGGER update_prematch_updated_at BEFORE UPDATE ON match_prematch_analysis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Enable Realtime for pre-match analysis
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE match_prematch_analysis;

-- ============================================================================
-- PRE-MATCH ANALYSIS TABLE COMPLETE
-- AI will populate this 2-6 hours before match kickoff with:
-- ✅ Head-to-head confrontation history
-- ✅ Recent form analysis (last 5 matches)
-- ✅ Key players to watch
-- ✅ Tactical preview
-- ✅ Match prediction with probabilities
-- ============================================================================
