-- ============================================================================
-- Match YouTube Streams Table
-- Stores YouTube live stream IDs for CAN 2025 matches
-- Created: 2025-12-23
-- ============================================================================

CREATE TABLE IF NOT EXISTS match_youtube_streams (
  id BIGSERIAL PRIMARY KEY,
  match_id VARCHAR(50) UNIQUE NOT NULL,
  youtube_video_id VARCHAR(50) NOT NULL,
  channel_name VARCHAR(200),
  video_title TEXT,
  is_live BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_match_stream UNIQUE(match_id)
);

-- Indexes for performance
CREATE INDEX idx_youtube_streams_match ON match_youtube_streams(match_id);
CREATE INDEX idx_youtube_streams_live ON match_youtube_streams(is_live) WHERE is_live = TRUE;
CREATE INDEX idx_youtube_streams_updated ON match_youtube_streams(updated_at DESC);

-- Row Level Security (RLS)
ALTER TABLE match_youtube_streams ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read access" ON match_youtube_streams
  FOR SELECT
  USING (true);

-- Automatic timestamp update trigger
CREATE TRIGGER update_youtube_streams_updated_at
  BEFORE UPDATE ON match_youtube_streams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMPLETE
-- Table created for storing YouTube live stream associations with matches
-- ============================================================================
