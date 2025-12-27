-- Create table to track YouTube live streams for matches
CREATE TABLE IF NOT EXISTS wp_match_youtube_streams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  match_id VARCHAR(50) NOT NULL,
  youtube_url VARCHAR(255),
  video_id VARCHAR(20),
  channel_id VARCHAR(50) DEFAULT 'UC_YOUR_CHANNEL_ID',
  status ENUM('searching', 'found', 'manual', 'live', 'ended') DEFAULT 'searching',
  search_query VARCHAR(255),
  last_caption_offset INT DEFAULT 0,  -- Last processed video timestamp in seconds
  discovered_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_match (match_id),
  INDEX idx_status (status),
  INDEX idx_video_id (video_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
