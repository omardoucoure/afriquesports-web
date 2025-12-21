#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const https = require('https');
const fs = require('fs');
const path = require('path');

async function executeSQL(sql, supabaseUrl, supabaseKey) {
  return new Promise((resolve, reject) => {
    // Try using the PostgREST API to execute SQL
    const url = new URL(supabaseUrl);

    // Read migration file
    const migrationPath = path.join(__dirname, 'supabase/migrations/002_ai_content_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements\n`);
    console.log('⚙️  Executing statements one by one...\n');

    let completed = 0;
    let failed = 0;

    async function executeNext(index) {
      if (index >= statements.length) {
        console.log(`\n✅ Completed: ${completed}`);
        console.log(`❌ Failed: ${failed}\n`);

        if (completed > 0) {
          console.log('✅ Some statements executed successfully!');
          console.log('Please verify tables in Supabase dashboard.\n');
        }

        resolve();
        return;
      }

      const statement = statements[index];

      // Skip certain statements that won't work via API
      if (statement.toUpperCase().includes('CREATE POLICY') ||
          statement.toUpperCase().includes('ENABLE ROW LEVEL') ||
          statement.toUpperCase().includes('ALTER PUBLICATION')) {
        console.log(`⏭️  Skipping statement ${index + 1} (requires admin access)`);
        executeNext(index + 1);
        return;
      }

      console.log(`📤 Executing statement ${index + 1}/${statements.length}...`);

      // This won't actually work, but let's try
      setTimeout(() => {
        console.log(`❌ API execution not supported for DDL statements`);
        failed++;
        executeNext(index + 1);
      }, 100);
    }

    executeNext(0);
  });
}

async function main() {
  console.log('🔧 Attempting migration via Supabase API...\n');

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }

  const projectRef = supabaseUrl.split('//')[1].split('.')[0];

  console.log(`📦 Project: ${projectRef}`);
  console.log(`🔑 Using service role key\n`);

  console.log('━'.repeat(70));
  console.log('⚠️  IMPORTANT: DDL statements cannot be executed via API');
  console.log('━'.repeat(70));
  console.log('\nThe only way to run CREATE TABLE, CREATE INDEX, etc. is:');
  console.log('\n1. Via direct PostgreSQL connection (needs DATABASE_URL)');
  console.log('2. Via Supabase Dashboard SQL Editor (manual)\n');

  console.log('📋 QUICKEST SOLUTION (30 seconds):');
  console.log('─'.repeat(70));
  console.log('1. Open: https://supabase.com/dashboard/project/' + projectRef + '/sql');
  console.log('2. Click "New Query"');
  console.log('3. Copy file: supabase/migrations/002_ai_content_tables.sql');
  console.log('4. Paste and click "Run"');
  console.log('5. Done! ✅\n');

  console.log('OR provide DATABASE_PASSWORD in .env.local and I can run it automatically.\n');
}

main();
