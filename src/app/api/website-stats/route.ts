import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { getPool } from '@/lib/mysql-db';

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

    // Set query timeout to 15 seconds to prevent Edge runtime timeout
    const QUERY_TIMEOUT = 15000;

    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Query timeout')), QUERY_TIMEOUT);
    });

    // Get total views - optimized with index hint
    const totalViewsPromise = pool.query<mysql.RowDataPacket[]>(
      `SELECT SUM(count) as total
       FROM wp_afriquesports_visits USE INDEX (idx_visit_date)
       WHERE visit_date >= ?`,
      [fromDate]
    );
    const [totalViewsRows] = await Promise.race([totalViewsPromise, timeoutPromise]);
    const totalViews = parseInt(totalViewsRows[0]?.total) || 0;

    // Get unique pages count - optimized
    const uniquePagesPromise = pool.query<mysql.RowDataPacket[]>(
      `SELECT COUNT(DISTINCT post_id) as total
       FROM wp_afriquesports_visits USE INDEX (idx_visit_date)
       WHERE visit_date >= ?`,
      [fromDate]
    );
    const [uniquePagesRows] = await Promise.race([uniquePagesPromise, timeoutPromise]);
    const uniquePages = parseInt(uniquePagesRows[0]?.total) || 0;

    // Get daily stats - limited to requested period
    const dailyStatsPromise = pool.query<mysql.RowDataPacket[]>(
      `SELECT
        visit_date as date,
        SUM(count) as totalViews
       FROM wp_afriquesports_visits USE INDEX (idx_visit_date)
       WHERE visit_date >= ?
       GROUP BY visit_date
       ORDER BY visit_date DESC
       LIMIT ?`,
      [fromDate, days]
    );
    const [dailyStatsRows] = await Promise.race([dailyStatsPromise, timeoutPromise]);

    const dailyStats = dailyStatsRows.map((row) => ({
      date: row.date,
      totalViews: parseInt(row.totalViews) || 0,
    }));

    // Get top pages - reduced limit for faster queries
    const topPagesPromise = pool.query<mysql.RowDataPacket[]>(
      `SELECT
        CONCAT('https://www.afriquesports.net/', post_slug) as url,
        post_title as title,
        SUM(count) as views
       FROM wp_afriquesports_visits USE INDEX (idx_visit_date)
       WHERE visit_date >= ? AND post_title IS NOT NULL
       GROUP BY post_id, post_slug, post_title
       ORDER BY views DESC
       LIMIT 20`,
      [fromDate]
    );
    const [topPagesRows] = await Promise.race([topPagesPromise, timeoutPromise]);

    const topPages = topPagesRows.map((row) => ({
      url: row.url,
      title: row.title || 'Sans titre',
      views: parseInt(row.views) || 0,
    }));

    return NextResponse.json(
      {
        totalViews,
        uniquePages,
        dailyStats,
        topPages,
        period,
        dateFrom: fromDate,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=300, s-maxage=600', // 5 min browser, 10 min CDN
        },
      }
    );
  } catch (error: any) {
    console.error('[API /api/website-stats] Error:', error);

    // Return more helpful error messages
    let errorMessage = 'Failed to fetch website stats';
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
