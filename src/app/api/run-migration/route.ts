import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

/**
 * API Route to Run Supabase Migration
 *
 * This is a one-time route to execute the CAN 2025 AI content tables migration.
 * Call this endpoint once to create the database schema.
 *
 * DELETE THIS FILE AFTER RUNNING THE MIGRATION!
 */

export async function POST(request: NextRequest) {
  try {
    // Security: Check for admin secret
    const authHeader = request.headers.get('x-admin-secret');
    const expectedSecret = process.env.ADMIN_SECRET || 'run-migration-now';

    if (authHeader !== expectedSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🚀 Starting migration...');

    // Get Supabase credentials
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Missing Supabase credentials' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Read migration file
    const migrationPath = path.join(process.cwd(), 'supabase/migrations/002_ai_content_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log(`📄 Migration file: ${migrationPath}`);
    console.log(`📝 Size: ${migrationSQL.length} characters`);

    // Execute migration using Supabase REST API
    // We'll split the SQL and execute each CREATE TABLE statement separately
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Skip empty or comment-only statements
      if (!statement || statement.startsWith('--')) continue;

      try {
        // For CREATE TABLE, we can use a workaround by inserting and then reading
        // But the best way is to use the pg client which we'll do

        // Try to detect what type of statement this is
        if (statement.toUpperCase().includes('CREATE TABLE')) {
          const tableName = extractTableName(statement);
          console.log(`⚙️  Creating table: ${tableName}`);

          // We can't execute DDL through the Supabase JS client
          // We need to use the REST API or pg client
          results.push({
            statement: i + 1,
            type: 'CREATE TABLE',
            table: tableName,
            status: 'pending',
            message: 'DDL statements require direct database access'
          });

        } else {
          results.push({
            statement: i + 1,
            type: 'unknown',
            status: 'skipped'
          });
        }

      } catch (error: any) {
        console.error(`❌ Error on statement ${i + 1}:`, error.message);
        errorCount++;
        results.push({
          statement: i + 1,
          status: 'error',
          error: error.message
        });
      }
    }

    // Since we can't run DDL through Supabase JS client, return instructions
    return NextResponse.json({
      success: false,
      message: 'DDL execution requires direct database access',
      instructions: [
        '1. Go to Supabase Dashboard → SQL Editor',
        '2. Copy the contents of supabase/migrations/002_ai_content_tables.sql',
        '3. Paste and run the migration',
        '4. Verify tables were created',
        '',
        'Alternatively, use the PostgreSQL client:',
        '  node run-migration-pg.js',
        '',
        'You need to add DATABASE_URL to .env.local:',
        '  Get it from: https://supabase.com/dashboard/project/[your-project]/settings/database',
        '  Format: postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres'
      ],
      migrationPath: 'supabase/migrations/002_ai_content_tables.sql',
      supabaseUrl,
      projectRef: supabaseUrl.split('//')[1]?.split('.')[0]
    });

  } catch (error: any) {
    console.error('❌ Migration error:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: error.message },
      { status: 500 }
    );
  }
}

function extractTableName(sql: string): string {
  const match = sql.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/i);
  return match ? match[1] : 'unknown';
}

export async function GET() {
  return NextResponse.json({
    message: 'Migration endpoint ready. Use POST with x-admin-secret header to run.',
    usage: 'curl -X POST http://localhost:3000/api/run-migration -H "x-admin-secret: run-migration-now"'
  });
}
