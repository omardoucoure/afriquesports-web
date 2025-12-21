#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function attemptMigration() {
  console.log('🔧 Final migration attempt using PostgreSQL direct connection...\n');

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const databaseUrl = process.env.DATABASE_URL;

  // Extract project ref
  const projectRef = supabaseUrl.split('//')[1].split('.')[0];

  if (databaseUrl) {
    console.log('✅ DATABASE_URL found! Attempting direct PostgreSQL connection...\n');

    const client = new Client({ connectionString: databaseUrl });

    try {
      await client.connect();
      console.log('✅ Connected to PostgreSQL!\n');

      // Read migration
      const migrationPath = path.join(__dirname, 'supabase/migrations/002_ai_content_tables.sql');
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

      console.log('⚙️  Executing migration...\n');
      await client.query(migrationSQL);

      console.log('✅ Migration executed successfully!\n');

      // Verify tables
      const tables = ['match_commentary_ai', 'match_reports_ai', 'match_predictions_ai', 'trending_players'];
      console.log('🔍 Verifying tables...\n');

      for (const table of tables) {
        const result = await client.query(`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1);`, [table]);
        if (result.rows[0].exists) {
          console.log(`✅ Table "${table}" created`);
        } else {
          console.log(`❌ Table "${table}" not found`);
        }
      }

      console.log('\n' + '='.repeat(70));
      console.log('✅ MIGRATION COMPLETE! Database is ready! 🎉');
      console.log('='.repeat(70) + '\n');

      await client.end();
      process.exit(0);

    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      await client.end();
      process.exit(1);
    }

  } else {
    console.log('❌ DATABASE_URL not found in .env.local\n');
    console.log('📋 You have 2 options:\n');
    console.log('OPTION 1: Add DATABASE_URL to .env.local');
    console.log('──────────────────────────────────────────');
    console.log('1. Get it from: https://supabase.com/dashboard/project/' + projectRef + '/settings/database');
    console.log('2. Look for "Connection string" → "URI"');
    console.log('3. Add to .env.local:');
    console.log('   DATABASE_URL="postgresql://postgres:[password]@db.' + projectRef + '.supabase.co:5432/postgres"');
    console.log('4. Run: node final-migration-attempt.js\n');

    console.log('OPTION 2: Use Supabase Dashboard (FASTEST - 30 seconds)');
    console.log('──────────────────────────────────────────────────────────');
    console.log('1. Open: https://supabase.com/dashboard/project/' + projectRef + '/sql');
    console.log('2. Click "New Query"');
    console.log('3. Copy the SQL from: supabase/migrations/002_ai_content_tables.sql');
    console.log('4. Click "Run" (bottom right)');
    console.log('5. Done! ✅\n');

    process.exit(1);
  }
}

attemptMigration();
