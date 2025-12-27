import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

/**
 * POST: Save or update YouTube stream for a match
 * Can be called by:
 * 1. Autonomous agent (automatic discovery)
 * 2. Admin dashboard (manual entry)
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

    const body = await request.json();
    const { match_id, youtube_url, video_id, status, search_query } = body;

    if (!match_id) {
      return NextResponse.json(
        { error: 'match_id is required' },
        { status: 400 }
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

    // Upsert YouTube stream
    await connection.query(
      `INSERT INTO wp_match_youtube_streams
       (match_id, youtube_url, video_id, status, search_query, discovered_at)
       VALUES (?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
         youtube_url = VALUES(youtube_url),
         video_id = VALUES(video_id),
         status = VALUES(status),
         search_query = VALUES(search_query),
         discovered_at = NOW(),
         updated_at = NOW()`,
      [match_id, youtube_url, video_id, status || 'found', search_query]
    );

    await connection.end();

    return NextResponse.json({
      success: true,
      message: `YouTube stream saved for match ${match_id}`,
      video_id,
      youtube_url
    });

  } catch (error: any) {
    console.error('Error saving YouTube stream:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET: Retrieve YouTube stream for a match
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const match_id = searchParams.get('match_id');

    if (!match_id) {
      return NextResponse.json(
        { error: 'match_id is required' },
        { status: 400 }
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

    const [rows] = await connection.query<mysql.RowDataPacket[]>(
      'SELECT * FROM wp_match_youtube_streams WHERE match_id = ?',
      [match_id]
    );

    await connection.end();

    if (rows.length === 0) {
      return NextResponse.json({
        found: false,
        stream: null
      });
    }

    return NextResponse.json({
      found: true,
      stream: rows[0]
    });

  } catch (error: any) {
    console.error('Error fetching YouTube stream:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH: Update last caption offset for a match
 */
export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const { match_id, last_caption_offset } = body;

    if (!match_id || last_caption_offset === undefined) {
      return NextResponse.json(
        { error: 'match_id and last_caption_offset are required' },
        { status: 400 }
      );
    }

    const config = {
      host: process.env.WORDPRESS_DB_HOST || '159.223.103.16',
      user: process.env.WORDPRESS_DB_USER,
      password: process.env.WORDPRESS_DB_PASSWORD,
      database: process.env.WORDPRESS_DB_NAME || 'wordpress',
    };

    const connection = await mysql.createConnection(config);

    await connection.query(
      `UPDATE wp_match_youtube_streams
       SET last_caption_offset = ?, updated_at = NOW()
       WHERE match_id = ?`,
      [last_caption_offset, match_id]
    );

    await connection.end();

    return NextResponse.json({
      success: true,
      message: `Caption offset updated for match ${match_id}`,
      last_caption_offset
    });

  } catch (error: any) {
    console.error('Error updating caption offset:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
