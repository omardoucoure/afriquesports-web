import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { getPool } from '@/lib/mysql-db';

/**
 * Database migration endpoint
 *
 * This endpoint applies database migrations to add indexes for better performance
 *
 * Usage:
 * POST https://www.afriquesports.net/api/admin/migrate-db
 *
 * Security: In production, this should be protected with authentication
 */
export async function POST(request: NextRequest) {
  try {
    const pool = getPool();
    if (!pool) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 503 }
      );
    }

    console.log('[Migration] Starting database migration...');

    // Migration SQL - Add indexes to wp_afriquesports_visits table
    const migrations = [
      {
        name: 'idx_visit_date',
        sql: `CREATE INDEX IF NOT EXISTS idx_visit_date ON wp_afriquesports_visits(visit_date)`,
      },
      {
        name: 'idx_author_date',
        sql: `CREATE INDEX IF NOT EXISTS idx_author_date ON wp_afriquesports_visits(post_author, visit_date)`,
      },
      {
        name: 'idx_post_date',
        sql: `CREATE INDEX IF NOT EXISTS idx_post_date ON wp_afriquesports_visits(post_id, visit_date)`,
      },
    ];

    const results = [];

    // Apply each migration
    for (const migration of migrations) {
      try {
        console.log(`[Migration] Creating index: ${migration.name}`);
        await pool.query(migration.sql);
        results.push({
          index: migration.name,
          status: 'success',
          message: `Index ${migration.name} created successfully`,
        });
        console.log(`[Migration] ✓ ${migration.name} created`);
      } catch (error: any) {
        // If index already exists, it's not an error
        if (error.code === 'ER_DUP_KEYNAME') {
          results.push({
            index: migration.name,
            status: 'already_exists',
            message: `Index ${migration.name} already exists`,
          });
          console.log(`[Migration] ⊘ ${migration.name} already exists`);
        } else {
          results.push({
            index: migration.name,
            status: 'error',
            message: error.message,
          });
          console.error(`[Migration] ✗ ${migration.name} failed:`, error.message);
        }
      }
    }

    // Verify indexes were created
    const [indexes] = await pool.query<mysql.RowDataPacket[]>(
      `SHOW INDEX FROM wp_afriquesports_visits WHERE Key_name LIKE 'idx_%'`
    );

    const indexNames = indexes.map((idx) => idx.Key_name);
    const uniqueIndexNames = [...new Set(indexNames)];

    console.log('[Migration] Migration completed');
    console.log('[Migration] Indexes created:', uniqueIndexNames);

    return NextResponse.json({
      success: true,
      message: 'Database migration completed',
      results,
      indexes: uniqueIndexNames,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Migration] Migration failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Migration failed',
        details: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check migration status
export async function GET(request: NextRequest) {
  try {
    const pool = getPool();
    if (!pool) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 503 }
      );
    }

    // Check if indexes exist
    const [indexes] = await pool.query<mysql.RowDataPacket[]>(
      `SHOW INDEX FROM wp_afriquesports_visits WHERE Key_name LIKE 'idx_%'`
    );

    const indexNames = indexes.map((idx) => idx.Key_name);
    const uniqueIndexNames = [...new Set(indexNames)];

    const requiredIndexes = ['idx_visit_date', 'idx_author_date', 'idx_post_date'];
    const missingIndexes = requiredIndexes.filter((idx) => !uniqueIndexNames.includes(idx));

    return NextResponse.json({
      migrationRequired: missingIndexes.length > 0,
      existingIndexes: uniqueIndexNames,
      missingIndexes,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Migration] Status check failed:', error);
    return NextResponse.json(
      {
        error: 'Failed to check migration status',
        details: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
