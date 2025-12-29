import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { getPool } from '@/lib/mysql-db';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const period = searchParams.get('period') || '7'; // Default 7 days
  const days = parseInt(period);

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

    // Get total views
    const [totalViewsRows] = await pool.query<mysql.RowDataPacket[]>(
      `SELECT SUM(count) as total
       FROM wp_afriquesports_visits
       WHERE visit_date >= ?`,
      [fromDate]
    );
    const totalViews = parseInt(totalViewsRows[0]?.total) || 0;

    // Get unique pages count
    const [uniquePagesRows] = await pool.query<mysql.RowDataPacket[]>(
      `SELECT COUNT(DISTINCT post_id) as total
       FROM wp_afriquesports_visits
       WHERE visit_date >= ?`,
      [fromDate]
    );
    const uniquePages = parseInt(uniquePagesRows[0]?.total) || 0;

    // Get daily stats
    const [dailyStatsRows] = await pool.query<mysql.RowDataPacket[]>(
      `SELECT
        visit_date as date,
        SUM(count) as totalViews
       FROM wp_afriquesports_visits
       WHERE visit_date >= ?
       GROUP BY visit_date
       ORDER BY visit_date ASC`,
      [fromDate]
    );

    const dailyStats = dailyStatsRows.map((row) => ({
      date: row.date,
      totalViews: parseInt(row.totalViews) || 0,
    }));

    // Get top pages
    const [topPagesRows] = await pool.query<mysql.RowDataPacket[]>(
      `SELECT
        CONCAT('https://www.afriquesports.net/', post_slug) as url,
        post_title as title,
        SUM(count) as views
       FROM wp_afriquesports_visits
       WHERE visit_date >= ?
       GROUP BY post_id, post_slug, post_title
       ORDER BY views DESC
       LIMIT 50`,
      [fromDate]
    );

    const topPages = topPagesRows.map((row) => ({
      url: row.url,
      title: row.title || 'Sans titre',
      views: parseInt(row.views) || 0,
    }));

    return NextResponse.json({
      totalViews,
      uniquePages,
      dailyStats,
      topPages,
    });
  } catch (error: any) {
    console.error('[API /api/website-stats] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch website statistics', details: error.message },
      { status: 500 }
    );
  }
}
