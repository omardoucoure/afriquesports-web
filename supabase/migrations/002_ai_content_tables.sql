-- ============================================================================
-- CAN 2025 AI Content Tables - Emergency Launch
-- Created: 2025-12-21 (AFCON Launch Day!)
-- ============================================================================

-- Live Match Commentary (AI-generated, real-time)
CREATE TABLE IF NOT EXISTS match_commentary_ai (
  id BIGSERIAL PRIMARY KEY,
  match_id VARCHAR(50) NOT NULL,
  event_id VARCHAR(50) UNIQUE NOT NULL,
  time VARCHAR(10) NOT NULL,                    -- Match time (e.g., "67'", "45'+2")
  time_seconds INTEGER NOT NULL,                -- For sorting
  locale VARCHAR(2) NOT NULL,                   -- fr, en, es, ar
  text TEXT NOT NULL,                           -- AI-generated commentary
  type VARCHAR(50) NOT NULL,                    -- goal, yellow_card, red_card, substitution, etc.
  team VARCHAR(100),                            -- Team name
  player_name VARCHAR(200),                     -- Player name (if applicable)
  player_image TEXT,                            -- Player headshot URL
  icon VARCHAR(10),                             -- Emoji icon (⚽, 🟨, 🟥, etc.)
  is_scoring BOOLEAN DEFAULT FALSE,             -- True for goals
  confidence REAL DEFAULT 1.0,                  -- AI confidence score (0-1)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_commentary_event UNIQUE(match_id, event_id, locale)
);

-- Indexes for performance
CREATE INDEX idx_commentary_match_locale ON match_commentary_ai(match_id, locale, time_seconds DESC);
CREATE INDEX idx_commentary_created ON match_commentary_ai(created_at DESC);

-- Row Level Security (RLS)
ALTER TABLE match_commentary_ai ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read access" ON match_commentary_ai
  FOR SELECT
  USING (true);

-- ============================================================================

-- Instant Match Reports (AI-generated, post-match)
CREATE TABLE IF NOT EXISTS match_reports_ai (
  id BIGSERIAL PRIMARY KEY,
  match_id VARCHAR(50) NOT NULL,
  locale VARCHAR(2) NOT NULL,                   -- fr, en, es, ar
  title TEXT NOT NULL,                          -- Report title
  summary TEXT NOT NULL,                        -- 2-3 paragraph summary
  key_moments JSONB,                            -- Array of pivotal moments
  player_ratings JSONB,                         -- Player performance ratings (0-10)
  statistics JSONB,                             -- Match stats breakdown
  analysis TEXT,                                -- AI tactical analysis
  published_to_wp BOOLEAN DEFAULT FALSE,        -- Synced to WordPress?
  wp_post_id INTEGER,                           -- WordPress post ID
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_match_report UNIQUE(match_id, locale)
);

-- Indexes
CREATE INDEX idx_reports_match ON match_reports_ai(match_id);
CREATE INDEX idx_reports_created ON match_reports_ai(created_at DESC);

-- RLS
ALTER TABLE match_reports_ai ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON match_reports_ai
  FOR SELECT
  USING (true);

-- ============================================================================

-- Match Predictions (AI-generated, pre-match)
CREATE TABLE IF NOT EXISTS match_predictions_ai (
  id BIGSERIAL PRIMARY KEY,
  match_id VARCHAR(50) NOT NULL,
  locale VARCHAR(2) NOT NULL,                   -- fr, en, es, ar
  home_team VARCHAR(100) NOT NULL,
  away_team VARCHAR(100) NOT NULL,
  predicted_score VARCHAR(10),                  -- "2-1"
  home_win_probability REAL,                    -- 0.0 - 1.0
  draw_probability REAL,
  away_win_probability REAL,
  key_factors JSONB,                            -- Array of prediction factors
  what_to_watch TEXT,                           -- Pre-match preview
  ai_model VARCHAR(50) DEFAULT 'deepseek-r1',   -- Model used
  confidence_score REAL,                        -- Overall confidence
  match_date TIMESTAMPTZ,                       -- When match occurs
  is_locked BOOLEAN DEFAULT FALSE,              -- Locked after match starts
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_prediction UNIQUE(match_id, locale)
);

-- Indexes
CREATE INDEX idx_predictions_match ON match_predictions_ai(match_id);
CREATE INDEX idx_predictions_date ON match_predictions_ai(match_date DESC);
CREATE INDEX idx_predictions_upcoming ON match_predictions_ai(match_date) WHERE is_locked = FALSE;

-- RLS
ALTER TABLE match_predictions_ai ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON match_predictions_ai
  FOR SELECT
  USING (true);

-- ============================================================================

-- Trending Players (auto-updated rankings)
CREATE TABLE IF NOT EXISTS trending_players (
  id BIGSERIAL PRIMARY KEY,
  player_name VARCHAR(200) NOT NULL,
  team VARCHAR(100) NOT NULL,
  performance_score REAL NOT NULL,              -- Calculated score
  goals_today INTEGER DEFAULT 0,
  assists_today INTEGER DEFAULT 0,
  clean_sheets_today INTEGER DEFAULT 0,
  trending_reason TEXT,                         -- e.g., "Scored 2 goals vs Nigeria"
  player_image TEXT,                            -- Headshot URL
  locale VARCHAR(2) NOT NULL,
  rank INTEGER,                                 -- Current rank (1-N)
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_trending_players_score ON trending_players(locale, updated_at DESC, performance_score DESC);
CREATE INDEX idx_trending_players_rank ON trending_players(locale, rank) WHERE rank IS NOT NULL;

-- RLS
ALTER TABLE trending_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON trending_players
  FOR SELECT
  USING (true);

-- ============================================================================

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_match_reports_updated_at BEFORE UPDATE ON match_reports_ai
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_predictions_updated_at BEFORE UPDATE ON match_predictions_ai
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trending_players_updated_at BEFORE UPDATE ON trending_players
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Enable Realtime for live commentary (critical for live updates!)
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE match_commentary_ai;
ALTER PUBLICATION supabase_realtime ADD TABLE trending_players;

-- ============================================================================
-- EMERGENCY LAUNCH COMPLETE
-- Tables created for:
-- ✅ Live match commentary (real-time AI updates)
-- ✅ Instant match reports (5-min post-match analysis)
-- ✅ Match predictions (AI-powered pre-match previews)
-- ✅ Trending players (auto-updated rankings)
-- ============================================================================
