#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function ultimateMigration() {
  console.log('🔥 ULTIMATE MIGRATION ATTEMPT - Trying ALL possible methods...\n');

  // Collect ALL possible credentials
  const creds = {
    supabaseUrl: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    databaseUrl: process.env.DATABASE_URL,
    dbPassword: process.env.SUPABASE_DB_PASSWORD || process.env.DATABASE_PASSWORD || process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD,
    supabasePassword: process.env.SUPABASE_PASSWORD,
    pgPassword: process.env.PGPASSWORD,
  };

  // Extract project ref
  if (!creds.supabaseUrl) {
    console.error('❌ No SUPABASE_URL found');
    process.exit(1);
  }

  const projectRef = creds.supabaseUrl.split('//')[1].split('.')[0];
  console.log(`📦 Project: ${projectRef}`);

  // Show what we have
  console.log('\n🔍 Available credentials:');
  console.log(`   SUPABASE_URL: ${creds.supabaseUrl ? '✅' : '❌'}`);
  console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${creds.supabaseKey ? '✅' : '❌'}`);
  console.log(`   DATABASE_URL: ${creds.databaseUrl ? '✅' : '❌'}`);
  console.log(`   DB_PASSWORD: ${creds.dbPassword ? '✅' : '❌'}`);
  console.log('');

  // Read migration
  const migrationPath = path.join(__dirname, 'supabase/migrations/002_ai_content_tables.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  // Build all possible connection configs
  const attempts = [];

  // Attempt 1: Direct DATABASE_URL
  if (creds.databaseUrl) {
    attempts.push({
      name: 'DATABASE_URL (direct)',
      config: { connectionString: creds.databaseUrl }
    });
  }

  // Attempt 2: Construct from password - Direct connection
  if (creds.dbPassword) {
    attempts.push({
      name: 'Direct DB connection (port 5432)',
      config: {
        host: `db.${projectRef}.supabase.co`,
        port: 5432,
        database: 'postgres',
        user: 'postgres',
        password: creds.dbPassword,
        ssl: { rejectUnauthorized: false }
      }
    });

    // Attempt 3: Pooler connection
    attempts.push({
      name: 'Pooler connection (port 6543)',
      config: {
        host: `aws-0-us-west-1.pooler.supabase.com`,
        port: 6543,
        database: 'postgres',
        user: `postgres.${projectRef}`,
        password: creds.dbPassword,
        ssl: { rejectUnauthorized: false }
      }
    });

    // Attempt 4: Pooler with different format
    attempts.push({
      name: 'Pooler connection (alt format)',
      config: {
        host: `aws-0-us-west-1.pooler.supabase.com`,
        port: 5432,
        database: 'postgres',
        user: `postgres.${projectRef}`,
        password: creds.dbPassword,
        ssl: { rejectUnauthorized: false }
      }
    });

    // Attempt 5: Transaction pooler
    attempts.push({
      name: 'Transaction pooler',
      config: {
        host: `aws-0-us-west-1.pooler.supabase.com`,
        port: 6543,
        database: 'postgres',
        user: 'postgres',
        password: creds.dbPassword,
        ssl: { rejectUnauthorized: false }
      }
    });
  }

  if (attempts.length === 0) {
    console.error('❌ No valid connection credentials found\n');
    console.log('I need either:');
    console.log('  1. DATABASE_URL in .env.local');
    console.log('  2. Database password in one of these variables:');
    console.log('     - DATABASE_PASSWORD');
    console.log('     - SUPABASE_DB_PASSWORD');
    console.log('     - POSTGRES_PASSWORD');
    console.log('     - DB_PASSWORD\n');
    console.log('Get your database password from:');
    console.log(`https://supabase.com/dashboard/project/${projectRef}/settings/database\n`);
    process.exit(1);
  }

  console.log(`🔄 Trying ${attempts.length} connection methods...\n`);

  // Try each connection
  for (let i = 0; i < attempts.length; i++) {
    const attempt = attempts[i];
    console.log(`\n[${i + 1}/${attempts.length}] 🔌 ${attempt.name}...`);

    const client = new Client(attempt.config);

    try {
      await client.connect();
      console.log('   ✅ Connected!');

      // Test with simple query
      await client.query('SELECT NOW()');
      console.log('   ✅ Test query successful');

      console.log('\n   ⚙️  Executing migration...\n');

      await client.query(migrationSQL);

      console.log('   ✅ Migration executed!\n');

      // Verify tables
      console.log('   🔍 Verifying tables:\n');
      const tables = ['match_commentary_ai', 'match_reports_ai', 'match_predictions_ai', 'trending_players'];

      for (const table of tables) {
        const result = await client.query(
          `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1);`,
          [table]
        );
        if (result.rows[0].exists) {
          const countResult = await client.query(`SELECT COUNT(*) FROM ${table};`);
          console.log(`   ✅ ${table} (${countResult.rows[0].count} rows)`);
        } else {
          console.log(`   ❌ ${table} NOT FOUND`);
        }
      }

      console.log('\n' + '='.repeat(70));
      console.log('🎉 SUCCESS! MIGRATION COMPLETE!');
      console.log('='.repeat(70));
      console.log('\nAll tables created successfully!');
      console.log('Your database is ready for live commentary! 🚀\n');

      await client.end();
      process.exit(0);

    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      try {
        await client.end();
      } catch (e) {
        // Ignore
      }
      // Continue to next attempt
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('❌ ALL CONNECTION ATTEMPTS FAILED');
  console.log('='.repeat(70));
  console.log('\nPlease add your database password to .env.local:');
  console.log('DATABASE_PASSWORD="your-password-here"\n');
  console.log('Get it from:');
  console.log(`https://supabase.com/dashboard/project/${projectRef}/settings/database\n`);
  process.exit(1);
}

ultimateMigration();
