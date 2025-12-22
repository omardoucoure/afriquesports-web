-- Match States Tracking Table
-- Tracks match status changes for automatic Google Indexing API notifications

CREATE TABLE IF NOT EXISTS match_states (
  match_id TEXT PRIMARY KEY,
  status TEXT NOT NULL, -- 'scheduled', 'live', 'completed'
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,
  last_indexed_at TIMESTAMPTZ,
  last_checked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_match_states_status ON match_states(status);
CREATE INDEX IF NOT EXISTS idx_match_states_last_checked ON match_states(last_checked_at);

-- Enable RLS (Row Level Security)
ALTER TABLE match_states ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to match states"
  ON match_states
  FOR SELECT
  TO PUBLIC
  USING (true);

-- Allow service role to insert/update
CREATE POLICY "Allow service role to modify match states"
  ON match_states
  FOR ALL
  TO service_role
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_match_states_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_match_states_timestamp
  BEFORE UPDATE ON match_states
  FOR EACH ROW
  EXECUTE FUNCTION update_match_states_updated_at();

-- Comment
COMMENT ON TABLE match_states IS 'Tracks match status changes for automatic Google Indexing API notifications';
