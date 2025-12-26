import mysql from 'mysql2/promise';
import { unstable_cache } from 'next/cache';

let pool: mysql.Pool | null = null;

// Get MySQL connection pool
function getPool(): mysql.Pool | null {
  if (pool) return pool;

  const config = {
    host: process.env.WORDPRESS_DB_HOST || '159.223.103.16',
    user: process.env.WORDPRESS_DB_USER,
    password: process.env.WORDPRESS_DB_PASSWORD,
    database: process.env.WORDPRESS_DB_NAME || 'wordpress',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };

  if (!config.user || !config.password) {
    console.error('[MySQL] Missing WORDPRESS_DB_USER or WORDPRESS_DB_PASSWORD');
    return null;
  }

  try {
    console.log('[MySQL] Creating connection pool...');
    pool = mysql.createPool(config);
    console.log('[MySQL] Connection pool created successfully');
    return pool;
  } catch (error) {
    console.error('[MySQL] Failed to create connection pool:', error);
    return null;
  }
}

// Record a visit
export async function recordVisit(data: {
  postId: string;
  postSlug: string;
  postTitle: string;
  postImage?: string;
  postAuthor?: string;
  postCategory?: string;
  postSource?: string;
  postLocale?: string;
}): Promise<{ id: number; count: number } | null> {
  const db = getPool();
  if (!db) return null;

  const {
    postId,
    postSlug,
    postTitle,
    postImage,
    postAuthor,
    postCategory,
    postSource = 'afriquesports',
    postLocale = 'fr',
  } = data;

  const visitDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  try {
    // Use INSERT ... ON DUPLICATE KEY UPDATE for atomic upsert
    const [result] = await db.query<mysql.ResultSetHeader>(
      `INSERT INTO wp_afriquesports_visits
        (post_id, post_slug, post_title, post_image, post_author, post_category, post_source, post_locale, visit_date, count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      ON DUPLICATE KEY UPDATE
        count = count + 1,
        updated_at = CURRENT_TIMESTAMP`,
      [postId, postSlug, postTitle, postImage || null, postAuthor || null, postCategory || null, postSource, postLocale, visitDate]
    );

    // Fetch the updated record to return id and count
    const [rows] = await db.query<mysql.RowDataPacket[]>(
      'SELECT id, count FROM wp_afriquesports_visits WHERE post_id = ? AND visit_date = ?',
      [postId, visitDate]
    );

    if (rows.length > 0) {
      console.log('[MySQL] Visit recorded:', { postId, count: rows[0].count });
      return { id: rows[0].id, count: rows[0].count };
    }

    return null;
  } catch (error) {
    console.error('[MySQL] Error recording visit:', error);
    return null;
  }
}

export interface TrendingPost {
  post_id: string;
  post_slug: string;
  post_title: string;
  post_image?: string | null;
  post_author?: string | null;
  post_category?: string | null;
  post_source?: string | null;
  post_locale?: string | null;
  count: number;
  total_count: number;
}

// Internal function to fetch trending posts (not cached)
async function _getTrendingPostsByRange(
  days: number = 7,
  limit: number = 10,
  locale: string = 'fr'
): Promise<TrendingPost[]> {
  const db = getPool();
  if (!db) {
    console.log('[MySQL] ❌ No MySQL connection - check environment variables');
    return [];
  }

  try {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);
    const fromDate = dateFrom.toISOString().split('T')[0];

    console.log(`[MySQL] Fetching trending posts (days=${days}, limit=${limit}, locale=${locale}, from=${fromDate})`);

    const [rows] = await db.query<mysql.RowDataPacket[]>(
      `SELECT
        post_id,
        post_slug,
        post_title,
        post_image,
        post_author,
        post_category,
        post_source,
        post_locale,
        SUM(count) as total_count
      FROM wp_afriquesports_visits
      WHERE visit_date >= ? AND post_locale = ?
      GROUP BY post_id, post_slug, post_title, post_image, post_author, post_category, post_source, post_locale
      ORDER BY total_count DESC
      LIMIT ?`,
      [fromDate, locale, limit]
    );

    const results = rows.map((row) => ({
      post_id: row.post_id,
      post_slug: row.post_slug,
      post_title: row.post_title,
      post_image: row.post_image,
      post_author: row.post_author,
      post_category: row.post_category,
      post_source: row.post_source,
      post_locale: row.post_locale,
      count: row.total_count,
      total_count: row.total_count,
    }));

    console.log(`[MySQL] ✓ Trending posts fetched: ${results.length} unique posts`);
    if (results.length > 0) {
      console.log('[MySQL] Top trending post:', { title: results[0].post_title, views: results[0].total_count });
    }

    return results;
  } catch (error) {
    console.error('[MySQL] Error in getTrendingPostsByRange:', error);
    return [];
  }
}

// Cached version - revalidates every 30 minutes
// This prevents database hammering from high-traffic pages
export const getTrendingPostsByRange = unstable_cache(
  async (days: number = 7, limit: number = 10, locale: string = 'fr') => {
    return await _getTrendingPostsByRange(days, limit, locale);
  },
  ['trending-posts'], // Cache key
  {
    revalidate: 1800, // 30 minutes cache
    tags: ['trending-posts'],
  }
);

// Close the connection pool (useful for graceful shutdown)
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('[MySQL] Connection pool closed');
  }
}
