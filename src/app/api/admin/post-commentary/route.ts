import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

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
    const { match_id, commentary, type, custom_time } = body;

    if (!match_id || !commentary) {
      return NextResponse.json(
        { error: 'match_id and commentary are required' },
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

    // Insert the commentary
    const [result] = await connection.query(
      `INSERT INTO wp_match_commentary (match_id, commentary, type, custom_time, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [match_id, commentary, type || 'general', custom_time || null]
    );

    await connection.end();

    return NextResponse.json({
      success: true,
      message: 'Commentary posted successfully',
      id: (result as any).insertId
    });

  } catch (error: any) {
    console.error('Error posting commentary:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
