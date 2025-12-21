#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('🚀 Auto-migration starting...\n');

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const databasePassword = process.env.SUPABASE_DB_PASSWORD || process.env.DATABASE_PASSWORD;
  let databaseUrl = process.env.DATABASE_URL;

  if (!supabaseUrl) {
    console.error('❌ Missing SUPABASE_URL');
    process.exit(1);
  }

  // Extract project ref
  const projectRef = supabaseUrl.split('//')[1].split('.')[0];
  console.log(`📦 Project: ${projectRef}`);

  // If no DATABASE_URL, try to construct one
  if (!databaseUrl && databasePassword) {
    databaseUrl = `postgresql://postgres.${projectRef}:${databasePassword}@aws-0-us-west-1.pooler.supabase.com:6543/postgres`;
    console.log('🔧 Constructed DATABASE_URL from credentials\n');
  }

  // Try alternative connection methods
  const connectionOptions = [];

  if (databaseUrl) {
    connectionOptions.push({
      name: 'Primary connection string',
      config: { connectionString: databaseUrl }
    });
  }

  if (databasePassword) {
    // Try direct connection
    connectionOptions.push({
      name: 'Direct connection',
      config: {
        host: `db.${projectRef}.supabase.co`,
        port: 5432,
        database: 'postgres',
        user: 'postgres',
        password: databasePassword,
        ssl: { rejectUnauthorized: false }
      }
    });

    // Try pooler connection
    connectionOptions.push({
      name: 'Pooler connection',
      config: {
        host: `aws-0-us-west-1.pooler.supabase.com`,
        port: 6543,
        database: 'postgres',
        user: `postgres.${projectRef}`,
        password: databasePassword,
        ssl: { rejectUnauthorized: false }
      }
    });
  }

  if (connectionOptions.length === 0) {
    console.error('❌ No valid connection options available');
    console.log('\nPlease add one of the following to .env.local:');
    console.log('1. DATABASE_URL="postgresql://postgres:[password]@db.' + projectRef + '.supabase.co:5432/postgres"');
    console.log('2. SUPABASE_DB_PASSWORD="[your-database-password]"');
    console.log('\nGet password from: https://supabase.com/dashboard/project/' + projectRef + '/settings/database\n');
    process.exit(1);
  }

  // Try each connection option
  for (const option of connectionOptions) {
    console.log(`\n🔌 Trying ${option.name}...`);

    const client = new Client(option.config);

    try {
      await client.connect();
      console.log('✅ Connected successfully!\n');

      // Read migration
      const migrationPath = path.join(__dirname, 'supabase/migrations/002_ai_content_tables.sql');
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

      console.log('📄 Migration file loaded');
      console.log('📝 Size: ' + migrationSQL.length + ' characters\n');

      console.log('⚙️  Executing migration...\n');

      await client.query(migrationSQL);

      console.log('✅ Migration executed successfully!\n');

      // Verify tables
      const tables = ['match_commentary_ai', 'match_reports_ai', 'match_predictions_ai', 'trending_players'];
      console.log('🔍 Verifying tables:\n');

      for (const table of tables) {
        const result = await client.query(
          `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1);`,
          [table]
        );
        if (result.rows[0].exists) {
          const countResult = await client.query(`SELECT COUNT(*) FROM ${table};`);
          console.log(`✅ Table "${table}" exists (${countResult.rows[0].count} rows)`);
        } else {
          console.log(`❌ Table "${table}" not found`);
        }
      }

      console.log('\n' + '='.repeat(70));
      console.log('✅ MIGRATION COMPLETE! All tables created successfully! 🎉');
      console.log('='.repeat(70));
      console.log('\nNext steps:');
      console.log('1. ✅ Database ready');
      console.log('2. ⏭️  Deploy to Vercel');
      console.log('3. ⏭️  Update AI agent on DigitalOcean\n');

      await client.end();
      process.exit(0);

    } catch (error) {
      console.error('❌ Failed:', error.message);
      try {
        await client.end();
      } catch (e) {
        // Ignore
      }
      // Continue to next option
    }
  }

  console.error('\n❌ All connection attempts failed\n');
  console.log('Please add DATABASE_PASSWORD or DATABASE_URL to .env.local');
  console.log('Get from: https://supabase.com/dashboard/project/' + projectRef + '/settings/database\n');
  process.exit(1);
}

runMigration();
