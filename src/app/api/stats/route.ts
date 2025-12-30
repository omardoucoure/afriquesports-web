import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { getPool } from '@/lib/mysql-db';

// Author statistics API - simplified version
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const period = searchParams.get('period') || 'week'; // Default week

  // Convert period to days
  let days: number;
  switch (period) {
    case 'day':
      days = 1;
      break;
    case 'week':
      days = 7;
      break;
    case 'month':
      days = 30;
      break;
    case 'all':
      days = 365; // Last year
      break;
    default:
      // If numeric value provided, use it
      days = parseInt(period) || 7;
  }

  try {
    const pool = getPool();
    if (!pool) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 503 }
      );
    }

    // Calculate date range
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);
    const fromDate = dateFrom.toISOString().split('T')[0];

    // Get clean author statistics: posts written and views received
    const [authorRows] = await pool.query<mysql.RowDataPacket[]>(
      `SELECT
        post_author as author,
        COUNT(DISTINCT post_id) as totalPosts,
        SUM(count) as totalViews,
        ROUND(SUM(count) / COUNT(DISTINCT post_id), 0) as avgViewsPerPost
       FROM wp_afriquesports_visits
       WHERE visit_date >= ? AND post_author IS NOT NULL
       GROUP BY post_author
       ORDER BY totalPosts DESC`,
      [fromDate]
    );

    const authorStats = authorRows.map((row) => ({
      author: row.author || 'Unknown',
      totalPosts: parseInt(row.totalPosts) || 0,
      totalViews: parseInt(row.totalViews) || 0,
      avgViewsPerPost: parseInt(row.avgViewsPerPost) || 0,
    }));

    return NextResponse.json(
      { authorStats },
      {
        headers: {
          'Cache-Control': 'public, max-age=300, s-maxage=600',
        },
      }
    );
  } catch (error: any) {
    console.error('[API /api/stats] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch author statistics', details: error.message },
      { status: 500 }
    );
  }
}
