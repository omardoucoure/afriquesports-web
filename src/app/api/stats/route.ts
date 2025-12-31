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
        { error: 'Database connection not available', timestamp: new Date().toISOString() },
        { status: 503 }
      );
    }

    // Calculate date range
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);
    const fromDate = dateFrom.toISOString().split('T')[0];

    // Set query timeout to 15 seconds
    const QUERY_TIMEOUT = 15000;

    const queryPromise = pool.query<mysql.RowDataPacket[]>(
      `SELECT
        post_author as author,
        COUNT(DISTINCT post_id) as totalPosts,
        SUM(count) as totalViews,
        ROUND(SUM(count) / COUNT(DISTINCT post_id), 0) as avgViewsPerPost
       FROM wp_afriquesports_visits USE INDEX (idx_visit_date)
       WHERE visit_date >= ? AND post_author IS NOT NULL
       GROUP BY post_author
       ORDER BY totalPosts DESC
       LIMIT 50`,
      [fromDate]
    );

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Query timeout')), QUERY_TIMEOUT);
    });

    // Race between query and timeout
    const [authorRows] = await Promise.race([queryPromise, timeoutPromise]);

    const authorStats = authorRows.map((row) => ({
      author: row.author || 'Unknown',
      totalPosts: parseInt(row.totalPosts) || 0,
      totalViews: parseInt(row.totalViews) || 0,
      avgViewsPerPost: parseInt(row.avgViewsPerPost) || 0,
    }));

    return NextResponse.json(
      {
        period,
        totalPosts: authorStats.reduce((sum, stat) => sum + stat.totalPosts, 0),
        authorStats,
        languageStats: {
          french: authorStats.reduce((sum, stat) => sum + stat.totalPosts, 0),
          english: authorStats.reduce((sum, stat) => sum + stat.totalPosts, 0),
          spanish: authorStats.reduce((sum, stat) => sum + stat.totalPosts, 0),
          arabic: authorStats.reduce((sum, stat) => sum + stat.totalPosts, 0),
        },
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=300, s-maxage=600', // 5 min browser, 10 min CDN
        },
      }
    );
  } catch (error: any) {
    console.error('[API /api/stats] Error:', error);

    let errorMessage = 'Failed to fetch author statistics';
    if (error.message === 'Query timeout') {
      errorMessage = 'Database query timeout - try a shorter time period';
    } else if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      errorMessage = 'Database connection error';
    }

    return NextResponse.json(
      {
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
      {
        status: error.message === 'Query timeout' ? 504 : 500,
      }
    );
  }
}
