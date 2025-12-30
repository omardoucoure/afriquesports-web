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
      days = 36500; // All time (100 years)
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

    // Get comprehensive author statistics with date filtering
    const [rows] = await pool.query<mysql.RowDataPacket[]>(
      `SELECT
        post_author as authorName,
        COUNT(DISTINCT post_id) as totalPosts,
        SUM(CASE WHEN post_locale = 'fr' THEN 1 ELSE 0 END) as frenchPosts,
        SUM(CASE WHEN post_locale = 'en' THEN 1 ELSE 0 END) as englishPosts,
        SUM(CASE WHEN post_locale = 'es' THEN 1 ELSE 0 END) as spanishPosts,
        SUM(CASE WHEN post_locale = 'ar' THEN 1 ELSE 0 END) as arabicPosts,
        SUM(count) as totalViews
       FROM wp_afriquesports_visits
       WHERE post_author IS NOT NULL AND visit_date >= ?
       GROUP BY post_author
       ORDER BY totalPosts DESC`,
      [fromDate]
    );

    const authorStats = rows.map((row) => ({
      authorName: row.authorName || 'Unknown',
      totalPosts: parseInt(row.totalPosts) || 0,
      frenchPosts: parseInt(row.frenchPosts) || 0,
      englishPosts: parseInt(row.englishPosts) || 0,
      spanishPosts: parseInt(row.spanishPosts) || 0,
      arabicPosts: parseInt(row.arabicPosts) || 0,
      totalViews: parseInt(row.totalViews) || 0,
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
    console.error('[API /api/wordpress-author-stats] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch WordPress author statistics', details: error.message },
      { status: 500 }
    );
  }
}
