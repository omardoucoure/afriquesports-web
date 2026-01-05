import { Pool } from 'pg';

let tableInitialized = false;
let pool: Pool | null = null;

// Get database pool with proper connection string
function getPool(): Pool | null {
  if (pool) return pool;

  // Use POSTGRES_URL_NON_POOLING for better compatibility with Supabase
  const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
  if (!connectionString) {
    console.error('[Database] No connection string found (POSTGRES_URL_NON_POOLING or POSTGRES_URL)');
    return null;
  }

  try {
    console.log('[Database] Creating connection pool...');
    pool = new Pool({ connectionString });
    console.log('[Database] Connection pool created successfully');
    return pool;
  } catch (error) {
    console.error('[Database] Failed to create connection pool:', error);
    return null;
  }
}

// Initialize the visits table
export async function initVisitsTable(): Promise<boolean> {
  if (tableInitialized) return true;

  const db = getPool();
  if (!db) return false;

  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS visits (
        id SERIAL PRIMARY KEY,
        post_id VARCHAR(255) NOT NULL,
        post_slug VARCHAR(255) NOT NULL,
        post_title TEXT NOT NULL,
        post_image TEXT,
        post_author VARCHAR(255),
        post_category VARCHAR(255),
        post_source VARCHAR(255) DEFAULT 'afriquesports',
        visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
        count INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(post_id, visit_date)
      )
    `);

    // Create index for faster queries
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_visits_date_count ON visits(visit_date, count DESC)
    `);

    tableInitialized = true;
    return true;
  } catch (error) {
    // Silently fail if table initialization fails (database is optional)
    return false;
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
}) {
  const db = getPool();
  if (!db) return null;

  const { postId, postSlug, postTitle, postImage, postAuthor, postCategory, postSource = 'afriquesports' } = data;

  try {
    // Try to update existing record, insert if not exists
    const result = await db.query(
      `INSERT INTO visits (post_id, post_slug, post_title, post_image, post_author, post_category, post_source, count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 1)
       ON CONFLICT (post_id, visit_date)
       DO UPDATE SET
         count = visits.count + 1,
         updated_at = CURRENT_TIMESTAMP
       RETURNING id, count`,
      [postId, postSlug, postTitle, postImage || null, postAuthor || null, postCategory || null, postSource]
    );
    return result.rows[0];
  } catch (error) {
    // Silently fail if visit recording fails (database is optional)
    return null;
  }
}

// Get trending posts (most visited today)
export async function getTrendingPosts(limit: number = 10) {
  const initialized = await initVisitsTable();
  if (!initialized) return [];

  const db = getPool();
  if (!db) return [];

  try {
    const result = await db.query(
      `SELECT post_id, post_slug, post_title, post_image, post_author, post_category, post_source, count
       FROM visits
       WHERE visit_date = CURRENT_DATE
       ORDER BY count DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  } catch (error) {
    // Silently fail if getting trending posts fails (database is optional)
    return [];
  }
}

// Get trending posts for a specific date range
export async function getTrendingPostsByRange(days: number = 7, limit: number = 10) {
  const initialized = await initVisitsTable();
  if (!initialized) return [];

  const db = getPool();
  if (!db) return [];

  try {
    const result = await db.query(
      `SELECT post_id, post_slug, post_title, post_image, post_author, post_category, post_source, SUM(count) as total_count
       FROM visits
       WHERE visit_date >= CURRENT_DATE - $1::INTEGER
       GROUP BY post_id, post_slug, post_title, post_image, post_author, post_category, post_source
       ORDER BY total_count DESC
       LIMIT $2`,
      [days, limit]
    );
    return result.rows;
  } catch (error) {
    // Silently fail if getting trending posts by range fails (database is optional)
    return [];
  }
}
