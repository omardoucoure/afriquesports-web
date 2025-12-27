-- SEO Agent Database Schema
-- This migration creates tables for the autonomous SEO agent to track metrics, alerts, and issues

-- Daily performance metrics from Google Search Console
CREATE TABLE IF NOT EXISTS seo_metrics_daily (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  country VARCHAR(3) NOT NULL,
  device VARCHAR(20) NOT NULL,
  clicks INTEGER NOT NULL DEFAULT 0,
  impressions INTEGER NOT NULL DEFAULT 0,
  ctr DECIMAL(5,4) NOT NULL DEFAULT 0,
  position DECIMAL(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, country, device)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_seo_metrics_daily_date ON seo_metrics_daily(date DESC);
CREATE INDEX IF NOT EXISTS idx_seo_metrics_daily_country ON seo_metrics_daily(country);
CREATE INDEX IF NOT EXISTS idx_seo_metrics_daily_date_country ON seo_metrics_daily(date DESC, country);

-- Alert history
CREATE TABLE IF NOT EXISTS seo_alerts (
  id BIGSERIAL PRIMARY KEY,
  alert_type VARCHAR(50) NOT NULL, -- 'traffic_drop', 'position_drop', 'indexing_error', 'core_web_vitals'
  severity VARCHAR(20) NOT NULL,   -- 'critical', 'warning', 'info'
  message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for recent alerts lookup
CREATE INDEX IF NOT EXISTS idx_seo_alerts_created_at ON seo_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_seo_alerts_severity ON seo_alerts(severity);

-- Metadata issues detected by auditor
CREATE TABLE IF NOT EXISTS seo_metadata_issues (
  id BIGSERIAL PRIMARY KEY,
  url TEXT NOT NULL,
  issue_type VARCHAR(50) NOT NULL, -- 'missing_description', 'title_too_long', 'image_missing', 'alt_text_missing'
  severity VARCHAR(20) NOT NULL,   -- 'critical', 'warning', 'info'
  details JSONB,
  status VARCHAR(20) DEFAULT 'open', -- 'open', 'fixed', 'ignored'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  fixed_at TIMESTAMPTZ
);

-- Create indexes for issue tracking
CREATE INDEX IF NOT EXISTS idx_seo_metadata_issues_status ON seo_metadata_issues(status);
CREATE INDEX IF NOT EXISTS idx_seo_metadata_issues_url ON seo_metadata_issues(url);
CREATE INDEX IF NOT EXISTS idx_seo_metadata_issues_type ON seo_metadata_issues(issue_type);

-- URL indexing status
CREATE TABLE IF NOT EXISTS seo_indexing_status (
  id BIGSERIAL PRIMARY KEY,
  url TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL,
  indexing_status VARCHAR(50), -- 'submitted', 'indexed', 'error'
  last_checked_at TIMESTAMPTZ,
  error_message TEXT,
  UNIQUE(url)
);

-- Create index for recent submissions
CREATE INDEX IF NOT EXISTS idx_seo_indexing_status_submitted_at ON seo_indexing_status(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_seo_indexing_status_status ON seo_indexing_status(indexing_status);

-- Agent execution logs
CREATE TABLE IF NOT EXISTS seo_agent_runs (
  id BIGSERIAL PRIMARY KEY,
  run_type VARCHAR(50) NOT NULL, -- 'full', 'realtime', 'report'
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status VARCHAR(20), -- 'running', 'success', 'error'
  metrics JSONB,
  error_message TEXT
);

-- Create index for run history
CREATE INDEX IF NOT EXISTS idx_seo_agent_runs_started_at ON seo_agent_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_seo_agent_runs_status ON seo_agent_runs(status);

-- Add comments for documentation
COMMENT ON TABLE seo_metrics_daily IS 'Daily performance metrics from Google Search Console by country and device';
COMMENT ON TABLE seo_alerts IS 'Alert history for traffic drops, position changes, and critical SEO issues';
COMMENT ON TABLE seo_metadata_issues IS 'Metadata issues detected by the SEO auditor (missing descriptions, titles, etc.)';
COMMENT ON TABLE seo_indexing_status IS 'Tracking of URL submissions to Google Indexing API';
COMMENT ON TABLE seo_agent_runs IS 'Execution logs for SEO agent runs (daily, realtime, reports)';
