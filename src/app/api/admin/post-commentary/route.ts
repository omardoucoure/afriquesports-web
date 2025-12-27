import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import crypto from 'crypto';

// Helper function to convert time string to seconds
function timeToSeconds(timeStr: string): number {
  if (!timeStr) return 0;

  const time = timeStr.trim();

  // Handle special cases
  if (time === 'HT' || time === 'Half Time') return 2700; // 45 min
  if (time === 'FT' || time === 'Full Time') return 5400; // 90 min

  // Parse regular time format like "45'", "67'", "45'+2"
  const match = time.match(/^(\d+)'(?:\+(\d+))?$/);
  if (match) {
    const minutes = parseInt(match[1]);
    const addedTime = match[2] ? parseInt(match[2]) : 0;
    return (minutes + addedTime) * 60;
  }

  return 0;
}

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
    const { match_id, commentary, type, custom_time, locale } = body;

    if (!match_id || !commentary) {
      return NextResponse.json(
        { error: 'match_id and commentary are required' },
        { status: 400 }
      );
    }

    if (!custom_time) {
      return NextResponse.json(
        { error: 'custom_time is required' },
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

    // Generate event_id from match_id + time + hash of commentary
    const hash = crypto.createHash('md5').update(commentary).digest('hex').substring(0, 8);
    const event_id = `${match_id}-${custom_time.replace(/[^0-9]/g, '')}-${hash}`;

    // Convert time to seconds
    const time_seconds = timeToSeconds(custom_time);

    // Default locale to French
    const commentaryLocale = locale || 'fr';

    // Insert the commentary
    const [result] = await connection.query(
      `INSERT INTO wp_match_commentary
       (match_id, event_id, time, time_seconds, locale, text, type, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
       text = VALUES(text),
       type = VALUES(type),
       time_seconds = VALUES(time_seconds)`,
      [
        match_id,
        event_id,
        custom_time,
        time_seconds,
        commentaryLocale,
        commentary,
        type || 'general'
      ]
    );

    await connection.end();

    return NextResponse.json({
      success: true,
      message: 'Commentary posted successfully',
      id: (result as any).insertId,
      event_id: event_id
    });

  } catch (error: any) {
    console.error('Error posting commentary:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
