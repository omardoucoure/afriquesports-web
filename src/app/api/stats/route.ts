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
        { error: 'Database connection not available' },
        { status: 503 }
      );
    }

    // Calculate date range
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);
    const fromDate = dateFrom.toISOString().split('T')[0];

    // Get total posts count from visits table
    const [totalPostsRows] = await pool.query<mysql.RowDataPacket[]>(
      `SELECT COUNT(DISTINCT post_id) as total
       FROM wp_afriquesports_visits
       WHERE visit_date >= ?`,
      [fromDate]
    );
    const totalPosts = totalPostsRows[0]?.total || 0;

    // Get posts by language
    const [languageRows] = await pool.query<mysql.RowDataPacket[]>(
      `SELECT
        post_locale,
        COUNT(DISTINCT post_id) as count
       FROM wp_afriquesports_visits
       WHERE visit_date >= ?
       GROUP BY post_locale`,
      [fromDate]
    );

    const languageStats = {
      french: 0,
      english: 0,
      spanish: 0,
      arabic: 0,
    };

    languageRows.forEach((row) => {
      const locale = row.post_locale || 'fr';
      const count = row.count || 0;

      if (locale === 'fr') languageStats.french = count;
      else if (locale === 'en') languageStats.english = count;
      else if (locale === 'es') languageStats.spanish = count;
      else if (locale === 'ar') languageStats.arabic = count;
    });

    // Get posts by author
    const [authorRows] = await pool.query<mysql.RowDataPacket[]>(
      `SELECT
        post_author as author,
        COUNT(DISTINCT post_id) as totalPosts
       FROM wp_afriquesports_visits
       WHERE visit_date >= ? AND post_author IS NOT NULL
       GROUP BY post_author
       ORDER BY totalPosts DESC`,
      [fromDate]
    );

    const authorStats = authorRows.map((row) => ({
      author: row.author || 'Unknown',
      totalPosts: row.totalPosts || 0,
    }));

    return NextResponse.json({
      totalPosts,
      languageStats,
      authorStats,
    });
  } catch (error: any) {
    console.error('[API /api/stats] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics', details: error.message },
      { status: 500 }
    );
  }
}
