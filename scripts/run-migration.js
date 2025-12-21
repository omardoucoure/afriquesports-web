#!/usr/bin/env node
/**
 * Run SQL migration via Supabase HTTP API
 */

const https = require('https');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const SQL_MIGRATION = `
ALTER TABLE visits
ADD COLUMN IF NOT EXISTS post_locale VARCHAR(2) DEFAULT 'fr';

CREATE INDEX IF NOT EXISTS idx_visits_locale ON visits(post_locale);

UPDATE visits
SET post_locale = 'fr'
WHERE post_locale IS NULL;

ALTER TABLE visits
ALTER COLUMN post_locale SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_visits_locale_date 
ON visits(post_locale, visit_date DESC);
`.trim();

async function runMigration() {
  console.log('🚀 Running database migration...\n');

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }

  const projectRef = supabaseUrl.match(/https:\/\/(.+)\.supabase\.co/)[1];
  const apiUrl = `${supabaseUrl}/rest/v1/rpc/exec_sql`;

  console.log('Supabase Project:', projectRef);
  console.log('Running SQL migration...\n');

  // Try using fetch (Node 18+)
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ query: SQL_MIGRATION })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Migration failed:', result);
      console.log('\n📝 Please run the SQL manually in Supabase SQL Editor');
      console.log('   See: supabase-migration-add-locale.sql\n');
      process.exit(1);
    }

    console.log('✅ Migration completed successfully!\n');
    console.log('Result:', result);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n📝 Supabase does not allow DDL via REST API');
    console.log('   You need to run the SQL manually in the Supabase dashboard');
    console.log('\n   Steps:');
    console.log('   1. Go to https://supabase.com/dashboard');
    console.log('   2. Open SQL Editor');
    console.log('   3. Run the migration from: supabase-migration-add-locale.sql\n');
    process.exit(1);
  }
}

runMigration();
