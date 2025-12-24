-- ============================================================================
-- Match Data Tables - Generic for ALL competitions (CAN, World Cup, etc.)
-- Migrated from Supabase to WordPress MySQL
-- ============================================================================

-- 1. Live Match Commentary (AI-generated, real-time)
CREATE TABLE IF NOT EXISTS wp_match_commentary (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  match_id VARCHAR(50) NOT NULL,
  event_id VARCHAR(50) NOT NULL,
  competition VARCHAR(50) DEFAULT 'CAN',        -- CAN, World Cup, Champions League, etc.
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
  INDEX idx_commentary_competition (competition, created_at DESC),
  INDEX idx_commentary_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT = 'Live match commentary for all competitions (AI-generated, real-time)';

-- 2. Pre-Match Analysis
CREATE TABLE IF NOT EXISTS wp_match_prematch_analysis (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  match_id VARCHAR(50) NOT NULL,
  competition VARCHAR(50) DEFAULT 'CAN',
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
  INDEX idx_prematch_competition (competition, created_at DESC),
  INDEX idx_prematch_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT = 'Pre-match analysis and predictions for all competitions';

-- 3. YouTube Live Streams
CREATE TABLE IF NOT EXISTS wp_match_youtube_streams (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  match_id VARCHAR(50) NOT NULL,
  competition VARCHAR(50) DEFAULT 'CAN',
  youtube_url TEXT NOT NULL,
  video_id VARCHAR(50),
  stream_title VARCHAR(255),
  is_live BOOLEAN DEFAULT TRUE,
  viewer_count INT UNSIGNED DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_youtube_match (match_id),
  INDEX idx_youtube_match (match_id),
  INDEX idx_youtube_competition (competition, is_live),
  INDEX idx_youtube_live (is_live, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT = 'YouTube live stream links for all match competitions';

-- 4. Match States Tracking (for Google Indexing API)
CREATE TABLE IF NOT EXISTS wp_match_states (
  match_id VARCHAR(50) PRIMARY KEY,
  competition VARCHAR(50) DEFAULT 'CAN',
  status VARCHAR(20) NOT NULL,                  -- 'scheduled', 'live', 'completed'
  home_team VARCHAR(100),
  away_team VARCHAR(100),
  home_score INT DEFAULT 0,
  away_score INT DEFAULT 0,
  last_indexed_at TIMESTAMP NULL,
  last_checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_match_states_status (status),
  INDEX idx_match_states_competition (competition, status),
  INDEX idx_match_states_last_checked (last_checked_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT = 'Match status tracking for Google Indexing API notifications';

-- 5. Match Reports (AI-generated, post-match)
CREATE TABLE IF NOT EXISTS wp_match_reports (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  match_id VARCHAR(50) NOT NULL,
  competition VARCHAR(50) DEFAULT 'CAN',
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
  INDEX idx_reports_competition (competition, created_at DESC),
  INDEX idx_reports_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT = 'Post-match AI-generated reports and analysis for all competitions';

-- 6. Match Predictions (AI-generated, pre-match)
CREATE TABLE IF NOT EXISTS wp_match_predictions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  match_id VARCHAR(50) NOT NULL,
  competition VARCHAR(50) DEFAULT 'CAN',
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
  INDEX idx_predictions_competition (competition, match_date DESC),
  INDEX idx_predictions_date (match_date DESC),
  INDEX idx_predictions_upcoming (match_date, is_locked)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT = 'AI-powered match predictions and probabilities for all competitions';

-- 7. Trending Players (works across all competitions)
CREATE TABLE IF NOT EXISTS wp_trending_players (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  player_name VARCHAR(200) NOT NULL,
  team VARCHAR(100) NOT NULL,
  competition VARCHAR(50) DEFAULT 'CAN',
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
  INDEX idx_trending_players_score (locale, competition, updated_at DESC, performance_score DESC),
  INDEX idx_trending_players_rank (locale, competition, rank)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT = 'Auto-updated player rankings and trending players across all competitions';

-- ============================================================================
-- Migration complete - Generic tables for ALL football competitions
-- ============================================================================
