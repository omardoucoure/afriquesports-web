-- ============================================================================
-- CAN 2025 Match Data Tables - MySQL Migration from Supabase
-- All tables for live match commentary, analysis, and predictions
-- ============================================================================

-- 1. Live Match Commentary (AI-generated, real-time)
CREATE TABLE IF NOT EXISTS wp_can2025_match_commentary (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  match_id VARCHAR(50) NOT NULL,
  event_id VARCHAR(50) NOT NULL,
  time VARCHAR(10) NOT NULL,                    -- Match time (e.g., "67'", "45'+2")
  time_seconds INT NOT NULL,                    -- For sorting
  locale VARCHAR(2) NOT NULL,                   -- fr, en, es, ar
  text TEXT NOT NULL,                           -- AI-generated commentary
  type VARCHAR(50) NOT NULL,                    -- goal, yellow_card, red_card, substitution, etc.
  team VARCHAR(100),                            -- Team name
  player_name VARCHAR(200),                     -- Player name (if applicable)
  player_image TEXT,                            -- Player headshot URL
  icon VARCHAR(10),                             -- Emoji icon (⚽, 🟨, 🟥, etc.)
  is_scoring BOOLEAN DEFAULT FALSE,             -- True for goals
  confidence FLOAT DEFAULT 1.0,                 -- AI confidence score (0-1)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_commentary_event (match_id, event_id, locale),
  INDEX idx_commentary_match_locale (match_id, locale, time_seconds DESC),
  INDEX idx_commentary_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Pre-Match Analysis
CREATE TABLE IF NOT EXISTS wp_can2025_prematch_analysis (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  match_id VARCHAR(50) NOT NULL,
  locale VARCHAR(2) NOT NULL DEFAULT 'fr',
  home_team VARCHAR(100) NOT NULL,
  away_team VARCHAR(100) NOT NULL,
  home_form VARCHAR(50),
  away_form VARCHAR(50),
  head_to_head TEXT,
  key_players JSON,                             -- Array of key players
  tactical_analysis TEXT,
  prediction TEXT,
  confidence_score FLOAT,
  formations JSON,                              -- Team formations data
  lineups JSON,                                 -- Team lineups data
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_prematch (match_id, locale),
  INDEX idx_prematch_match (match_id),
  INDEX idx_prematch_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. YouTube Live Streams
CREATE TABLE IF NOT EXISTS wp_can2025_youtube_streams (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  match_id VARCHAR(50) NOT NULL,
  youtube_url TEXT NOT NULL,
  video_id VARCHAR(50),
  stream_title VARCHAR(255),
  is_live BOOLEAN DEFAULT TRUE,
  viewer_count INT UNSIGNED DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_youtube_match (match_id),
  INDEX idx_youtube_match (match_id),
  INDEX idx_youtube_live (is_live, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Match States Tracking (for Google Indexing API)
CREATE TABLE IF NOT EXISTS wp_can2025_match_states (
  match_id VARCHAR(50) PRIMARY KEY,
  status VARCHAR(20) NOT NULL,                  -- 'scheduled', 'live', 'completed'
  home_score INT DEFAULT 0,
  away_score INT DEFAULT 0,
  last_indexed_at TIMESTAMP NULL,
  last_checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_match_states_status (status),
  INDEX idx_match_states_last_checked (last_checked_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Match Reports (AI-generated, post-match)
CREATE TABLE IF NOT EXISTS wp_can2025_match_reports (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  match_id VARCHAR(50) NOT NULL,
  locale VARCHAR(2) NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  key_moments JSON,                             -- Array of pivotal moments
  player_ratings JSON,                          -- Player performance ratings
  statistics JSON,                              -- Match stats breakdown
  analysis TEXT,                                -- AI tactical analysis
  published_to_wp BOOLEAN DEFAULT FALSE,
  wp_post_id INT UNSIGNED,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_match_report (match_id, locale),
  INDEX idx_reports_match (match_id),
  INDEX idx_reports_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Match Predictions (AI-generated, pre-match)
CREATE TABLE IF NOT EXISTS wp_can2025_match_predictions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  match_id VARCHAR(50) NOT NULL,
  locale VARCHAR(2) NOT NULL,
  home_team VARCHAR(100) NOT NULL,
  away_team VARCHAR(100) NOT NULL,
  predicted_score VARCHAR(10),
  home_win_probability FLOAT,
  draw_probability FLOAT,
  away_win_probability FLOAT,
  key_factors JSON,
  what_to_watch TEXT,
  ai_model VARCHAR(50) DEFAULT 'deepseek-r1',
  confidence_score FLOAT,
  match_date TIMESTAMP,
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_prediction (match_id, locale),
  INDEX idx_predictions_match (match_id),
  INDEX idx_predictions_date (match_date DESC),
  INDEX idx_predictions_upcoming (match_date, is_locked)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Trending Players
CREATE TABLE IF NOT EXISTS wp_can2025_trending_players (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  player_name VARCHAR(200) NOT NULL,
  team VARCHAR(100) NOT NULL,
  performance_score FLOAT NOT NULL,
  goals_today INT DEFAULT 0,
  assists_today INT DEFAULT 0,
  clean_sheets_today INT DEFAULT 0,
  trending_reason TEXT,
  player_image TEXT,
  locale VARCHAR(2) NOT NULL,
  rank INT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_trending_players_score (locale, updated_at DESC, performance_score DESC),
  INDEX idx_trending_players_rank (locale, rank)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Add comments to tables for documentation
-- ============================================================================

ALTER TABLE wp_can2025_match_commentary
COMMENT = 'Live match commentary for CAN 2025 matches (AI-generated, real-time)';

ALTER TABLE wp_can2025_prematch_analysis
COMMENT = 'Pre-match analysis and predictions for CAN 2025 matches';

ALTER TABLE wp_can2025_youtube_streams
COMMENT = 'YouTube live stream links for CAN 2025 matches';

ALTER TABLE wp_can2025_match_states
COMMENT = 'Match status tracking for Google Indexing API notifications';

ALTER TABLE wp_can2025_match_reports
COMMENT = 'Post-match AI-generated reports and analysis';

ALTER TABLE wp_can2025_match_predictions
COMMENT = 'AI-powered match predictions and probabilities';

ALTER TABLE wp_can2025_trending_players
COMMENT = 'Auto-updated player rankings and trending players';

-- ============================================================================
-- Migration complete
-- ============================================================================
