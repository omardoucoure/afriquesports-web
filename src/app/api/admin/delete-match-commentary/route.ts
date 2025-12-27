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
    const { match_id } = body;

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

    // Delete all commentary for this match
    const [result] = await connection.query(
      'DELETE FROM wp_match_commentary WHERE match_id = ?',
      [match_id]
    );

    await connection.end();

    return NextResponse.json({
      success: true,
      message: `All commentary deleted for match ${match_id}`,
      deleted: (result as any).affectedRows
    });

  } catch (error: any) {
    console.error('Error deleting match commentary:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
