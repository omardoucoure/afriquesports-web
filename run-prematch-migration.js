#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const dbPassword = process.env.DATABASE_PASSWORD || process.env.SUPABASE_DB_PASSWORD || process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD;

  if (!supabaseUrl || !dbPassword) {
    console.error('❌ Missing SUPABASE_URL or DATABASE_PASSWORD');
    process.exit(1);
  }

  const projectRef = supabaseUrl.split('//')[1].split('.')[0];
  console.log(`📦 Project: ${projectRef}\n`);

  const client = new Client({
    host: `db.${projectRef}.supabase.co`,
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: dbPassword,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    const migrationPath = path.join(__dirname, 'supabase/migrations/003_prematch_analysis.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('⚙️  Creating match_prematch_analysis table...\n');
    await client.query(sql);

    console.log('✅ Pre-match analysis table created successfully!');
    console.log('\n🔍 Verifying table:\n');

    const result = await client.query(
      `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'match_prematch_analysis');`
    );

    if (result.rows[0].exists) {
      const countResult = await client.query(`SELECT COUNT(*) FROM match_prematch_analysis;`);
      console.log(`✅ match_prematch_analysis (${countResult.rows[0].count} rows)`);
    } else {
      console.log(`❌ match_prematch_analysis NOT FOUND`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('🎉 MIGRATION COMPLETE!');
    console.log('='.repeat(70));
    console.log('\nYour database is ready for pre-match analysis! 🚀\n');

    await client.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    await client.end();
    process.exit(1);
  }
}

runMigration();
