-- Create visits tracking table in WordPress MySQL database
-- This table tracks article visits for trending posts functionality

CREATE TABLE IF NOT EXISTS wp_afriquesports_visits (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  post_id VARCHAR(255) NOT NULL,
  post_slug VARCHAR(255) NOT NULL,
  post_title TEXT NOT NULL,
  post_image TEXT,
  post_author VARCHAR(255),
  post_category VARCHAR(255),
  post_source VARCHAR(255) DEFAULT 'afriquesports',
  post_locale VARCHAR(10) DEFAULT 'fr',
  visit_date DATE NOT NULL,
  count INT UNSIGNED NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_post_visit (post_id, visit_date),
  KEY idx_visit_date (visit_date),
  KEY idx_post_locale (post_locale),
  KEY idx_date_locale_count (visit_date, post_locale, count)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add comment to table
ALTER TABLE wp_afriquesports_visits
COMMENT = 'Tracks article visits for trending posts analytics';
