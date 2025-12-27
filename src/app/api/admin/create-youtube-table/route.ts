import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

/**
 * POST: Create YouTube streams table
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret
    const authHeader = request.headers.get('x-webhook-secret');
    const expectedSecret = process.env.AI_AGENT_WEBHOOK_SECRET;

    if (!expectedSecret || authHeader !== expectedSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const config = {
      host: process.env.WORDPRESS_DB_HOST || '159.223.103.16',
      user: process.env.WORDPRESS_DB_USER,
      password: process.env.WORDPRESS_DB_PASSWORD,
      database: process.env.WORDPRESS_DB_NAME || 'wordpress',
    };

    if (!config.user || !config.password) {
      return NextResponse.json(
        { error: 'Database credentials not configured' },
        { status: 500 }
      );
    }

    const connection = await mysql.createConnection(config);

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS wp_match_youtube_streams (
        id INT AUTO_INCREMENT PRIMARY KEY,
        match_id VARCHAR(50) NOT NULL,
        youtube_url VARCHAR(255),
        video_id VARCHAR(20),
        channel_id VARCHAR(50) DEFAULT 'UC_YOUR_CHANNEL_ID',
        status ENUM('searching', 'found', 'manual', 'live', 'ended') DEFAULT 'searching',
        search_query VARCHAR(255),
        last_caption_offset INT DEFAULT 0,
        discovered_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_match (match_id),
        INDEX idx_status (status),
        INDEX idx_video_id (video_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    await connection.query(createTableSQL);
    await connection.end();

    return NextResponse.json({
      success: true,
      message: 'YouTube streams table created successfully'
    });

  } catch (error: any) {
    console.error('Error creating YouTube table:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
