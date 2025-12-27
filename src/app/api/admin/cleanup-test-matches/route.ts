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

    // Delete from commentary table
    const [commentaryResult] = await connection.query(`
      DELETE FROM wp_match_commentary
      WHERE match_id LIKE '%test%'
         OR match_id IN ('732145', '732146', '732147', '732148', '732149', '732150')
    `);

    // Delete from pre-match table
    const [prematchResult] = await connection.query(`
      DELETE FROM wp_match_prematch_analysis
      WHERE match_id LIKE '%test%'
         OR match_id IN ('732145', '732146', '732147', '732148', '732149', '732150')
    `);

    // Delete from match states table
    const [statesResult] = await connection.query(`
      DELETE FROM wp_match_states
      WHERE match_id LIKE '%test%'
         OR match_id IN ('732145', '732146', '732147', '732148', '732149', '732150')
    `);

    await connection.end();

    const commentaryDeleted = (commentaryResult as any).affectedRows || 0;
    const prematchDeleted = (prematchResult as any).affectedRows || 0;
    const statesDeleted = (statesResult as any).affectedRows || 0;

    return NextResponse.json({
      success: true,
      message: 'Test matches cleaned up successfully',
      deleted: {
        commentary: commentaryDeleted,
        prematch: prematchDeleted,
        states: statesDeleted,
        total: commentaryDeleted + prematchDeleted + statesDeleted
      }
    });

  } catch (error: any) {
    console.error('Error cleaning up test matches:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
