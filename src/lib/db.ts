import { createPool, VercelPool } from '@vercel/postgres';

let tableInitialized = false;
let pool: VercelPool | null = null;

// Get database pool with proper connection string
function getPool(): VercelPool | null {
  if (pool) return pool;

  const connectionString = process.env.POSTGRES_URL;
  if (!connectionString) {
    console.warn('[DB] No POSTGRES_URL configured');
    return null;
  }

  try {
    pool = createPool({ connectionString });
    return pool;
  } catch (error) {
    console.error('[DB] Failed to create pool:', error);
    return null;
  }
}

// Initialize the visits table
export async function initVisitsTable(): Promise<boolean> {
  if (tableInitialized) return true;

  const db = getPool();
  if (!db) return false;

  try {
    await db.sql`
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
    `;

    // Create index for faster queries
    await db.sql`
      CREATE INDEX IF NOT EXISTS idx_visits_date_count ON visits(visit_date, count DESC)
    `;

    tableInitialized = true;
    return true;
  } catch (error) {
    console.error('[DB] Failed to initialize visits table:', error);
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
    const result = await db.sql`
      INSERT INTO visits (post_id, post_slug, post_title, post_image, post_author, post_category, post_source, count)
      VALUES (${postId}, ${postSlug}, ${postTitle}, ${postImage || null}, ${postAuthor || null}, ${postCategory || null}, ${postSource}, 1)
      ON CONFLICT (post_id, visit_date)
      DO UPDATE SET
        count = visits.count + 1,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, count
    `;
    return result.rows[0];
  } catch (error) {
    console.error('[DB] Failed to record visit:', error);
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
    const result = await db.sql`
      SELECT post_id, post_slug, post_title, post_image, post_author, post_category, post_source, count
      FROM visits
      WHERE visit_date = CURRENT_DATE
      ORDER BY count DESC
      LIMIT ${limit}
    `;
    return result.rows;
  } catch (error) {
    console.error('[DB] Failed to get trending posts:', error);
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
    const result = await db.sql`
      SELECT post_id, post_slug, post_title, post_image, post_author, post_category, post_source, SUM(count) as total_count
      FROM visits
      WHERE visit_date >= CURRENT_DATE - ${days}::INTEGER
      GROUP BY post_id, post_slug, post_title, post_image, post_author, post_category, post_source
      ORDER BY total_count DESC
      LIMIT ${limit}
    `;
    return result.rows;
  } catch (error) {
    console.error('[DB] Failed to get trending posts by range:', error);
    return [];
  }
}
