import mysql from 'mysql2/promise';
import { unstable_cache } from 'next/cache';

let pool: mysql.Pool | null = null;

export interface VisitData {
  postId: string;
  postSlug: string;
  postTitle: string;
  postImage?: string;
  postAuthor?: string;
  postCategory?: string;
  postSource?: string;
  postLocale?: string;
}

// Get MySQL connection pool (exported for use in API routes)
export function getPool(): mysql.Pool | null {
  if (pool) return pool;

  const config = {
    host: process.env.WORDPRESS_DB_HOST || 'localhost',
    user: process.env.WORDPRESS_DB_USER,
    password: process.env.WORDPRESS_DB_PASSWORD,
    database: process.env.WORDPRESS_DB_NAME || 'wordpress',
    waitForConnections: true,
    connectionLimit: 40, // Increased from 15 to handle high traffic and prevent connection saturation
    queueLimit: 0,
    // Connection timeouts and keepalive to prevent ECONNRESET errors
    connectTimeout: 10000, // 10 seconds to establish connection
    enableKeepAlive: true, // Keep connections alive
    keepAliveInitialDelay: 0, // Start keepalive immediately
    // Connection recycling to prevent MySQL server from closing idle connections
    idleTimeout: 60000, // Close idle connections after 60 seconds
    maxIdle: 5, // Keep max 5 idle connections in pool
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

/**
 * Execute database operation with retry logic for connection errors and deadlocks
 * Implements exponential backoff to handle transient network issues and transaction conflicts
 */
async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T | null> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      // Retry on connection errors OR deadlocks
      const isRetryable =
        error.code === 'ECONNRESET' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ENOTFOUND' ||
        error.code === 'PROTOCOL_CONNECTION_LOST' ||
        error.code === 'ER_LOCK_DEADLOCK' || // MySQL deadlock
        error.errno === -104 || // ECONNRESET errno
        error.errno === 1213; // MySQL deadlock errno

      if (isRetryable) {
        // Add random jitter to prevent thundering herd on deadlock retries
        const jitter = Math.random() * 500; // 0-500ms random delay
        const delay = (baseDelay * Math.pow(2, attempt - 1)) + jitter;

        const errorType = error.code === 'ER_LOCK_DEADLOCK' || error.errno === 1213
          ? 'Deadlock'
          : 'Connection';

        console.warn(
          `[MySQL] ${errorType} error (${error.code || error.errno}) on attempt ${attempt}/${maxRetries}, ` +
          `retrying in ${Math.round(delay)}ms...`
        );

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }

      // Non-retryable error or max retries exceeded
      console.error('[MySQL] Non-retryable error or max retries exceeded:', error);
      return null;
    }
  }

  console.error('[MySQL] Operation failed after all retries:', lastError);
  return null;
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

// Valid locales for the site
const VALID_LOCALES = ['fr', 'en', 'es', 'ar'];

// Internal function to fetch trending posts (not cached)
async function _getTrendingPostsByRange(
  days: number = 7,
  limit: number = 10,
  locale: string = 'fr'
): Promise<TrendingPost[]> {
  // Validate locale to prevent unnecessary database queries from invalid requests
  // (e.g., sitemap files being processed as locales: post-sitemap2.xml, app-ads.txt)
  if (!VALID_LOCALES.includes(locale)) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[MySQL] ⚠ Invalid locale "${locale}" - skipping trending posts fetch`);
    }
    return [];
  }

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
    revalidate: 3600, // 1 hour cache (cost optimized)
    tags: ['trending-posts'],
  }
);

/**
 * Batch record multiple visits in a single query
 * Used by the batch processor to reduce database load
 * Includes automatic retry logic for connection errors and deadlocks
 *
 * DEADLOCK PREVENTION:
 * - Sorts visits by post_id to ensure consistent lock ordering
 * - Uses exponential backoff with jitter on retry
 * - Reduces batch size to minimize lock contention
 */
export async function batchRecordVisits(visits: VisitData[]): Promise<mysql.ResultSetHeader | null> {
  if (visits.length === 0) return null;

  return executeWithRetry(async () => {
    const db = getPool();
    if (!db) throw new Error('No database connection pool available');

    const visitDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // CRITICAL: Sort visits by post_id to ensure consistent lock ordering across batches
    // This prevents deadlocks by ensuring all transactions acquire locks in the same order
    const sortedVisits = [...visits].sort((a, b) => a.postId.localeCompare(b.postId));

    // Build bulk INSERT ... ON DUPLICATE KEY UPDATE query
    const values: any[] = [];
    const placeholders: string[] = [];

    for (const visit of sortedVisits) {
      const {
        postId,
        postSlug,
        postTitle,
        postImage,
        postAuthor,
        postCategory,
        postSource = 'afriquesports',
        postLocale = 'fr',
      } = visit;

      placeholders.push('(?, ?, ?, ?, ?, ?, ?, ?, ?, 1)');
      values.push(
        postId,
        postSlug,
        postTitle,
        postImage || null,
        postAuthor || null,
        postCategory || null,
        postSource,
        postLocale,
        visitDate
      );
    }

    const query = `
      INSERT INTO wp_afriquesports_visits
        (post_id, post_slug, post_title, post_image, post_author, post_category, post_source, post_locale, visit_date, count)
      VALUES ${placeholders.join(', ')}
      ON DUPLICATE KEY UPDATE
        count = count + 1,
        updated_at = CURRENT_TIMESTAMP
    `;

    const [result] = await db.query<mysql.ResultSetHeader>(query, values);

    console.log(`[MySQL] Batch insert completed: ${visits.length} visits, ${result.affectedRows} rows affected`);
    return result;
  });
}

// Close the connection pool (useful for graceful shutdown)
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('[MySQL] Connection pool closed');
  }
}
