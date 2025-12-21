#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('🔍 Checking Supabase credentials...\n');

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('SUPABASE_URL:', supabaseUrl ? '✅ Found' : '❌ Missing');
  console.log('SUPABASE_KEY:', supabaseKey ? '✅ Found' : '❌ Missing');

  if (!supabaseUrl || !supabaseKey) {
    console.error('\n❌ Missing Supabase credentials!');
    process.exit(1);
  }

  console.log('\n✅ Credentials found! Creating client...\n');

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Read migration file
  const migrationPath = path.join(__dirname, 'supabase/migrations/002_ai_content_tables.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  console.log(`📄 Migration file: ${migrationPath}`);
  console.log(`📝 Size: ${migrationSQL.length} characters\n`);

  // Try to execute via RPC (this may not work, but let's try)
  console.log('⚙️  Attempting to execute migration via Supabase client...\n');

  try {
    // Test connection first
    const { data: testData, error: testError } = await supabase
      .from('match_commentary_ai')
      .select('*')
      .limit(1);

    if (testError && testError.code !== 'PGRST116') {
      // Table might not exist yet, which is expected
      console.log('📊 Testing connection... Table not found yet (expected)\n');
    } else {
      console.log('⚠️  Table "match_commentary_ai" already exists!\n');
      console.log('Checking if migration was already run...\n');

      // Verify all tables
      const tables = [
        'match_commentary_ai',
        'match_reports_ai',
        'match_predictions_ai',
        'trending_players'
      ];

      let allExist = true;
      for (const table of tables) {
        const { error } = await supabase.from(table).select('*').limit(1);
        if (error && error.code === 'PGRST116') {
          console.log(`❌ Table "${table}" does not exist`);
          allExist = false;
        } else {
          console.log(`✅ Table "${table}" exists`);
        }
      }

      if (allExist) {
        console.log('\n✅ All tables already exist! Migration appears to be complete.\n');
        console.log('If you need to re-run the migration, please:');
        console.log('1. Go to Supabase dashboard SQL editor');
        console.log('2. Drop existing tables first');
        console.log('3. Run the migration SQL\n');
        process.exit(0);
      }
    }

    console.log('\n💡 Direct SQL execution not available via Supabase JS client.');
    console.log('You need to run the migration manually in Supabase dashboard.\n');
    console.log('📋 Instructions:');
    console.log('1. Go to: https://supabase.com/dashboard/project/' + supabaseUrl.split('//')[1].split('.')[0] + '/sql');
    console.log('2. Click "New Query"');
    console.log('3. Copy/paste: supabase/migrations/002_ai_content_tables.sql');
    console.log('4. Click "Run"\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

runMigration();
