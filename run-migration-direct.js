#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const https = require('https');
const fs = require('fs');
const path = require('path');

async function runMigrationViaAPI() {
  console.log('🚀 Running migration via Supabase Management API...\n');

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials!');
    process.exit(1);
  }

  // Extract project ref from URL
  const projectRef = supabaseUrl.split('//')[1].split('.')[0];
  console.log(`📦 Project: ${projectRef}\n`);

  // Read migration file
  const migrationPath = path.join(__dirname, 'supabase/migrations/002_ai_content_tables.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  console.log(`📄 Migration: ${migrationPath}`);
  console.log(`📝 Size: ${migrationSQL.length} characters\n`);

  // Try to execute via REST API
  const apiUrl = `${supabaseUrl}/rest/v1/rpc/exec_sql`;
  const payload = JSON.stringify({ query: migrationSQL });

  console.log('⚙️  Attempting to execute via REST API...\n');

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(apiUrl, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log('✅ Migration executed successfully!\n');
          console.log('Response:', data);
          resolve(data);
        } else {
          console.error(`❌ API returned status ${res.statusCode}`);
          console.error('Response:', data);
          console.log('\n💡 The REST API approach is not available.');
          console.log('Please run the migration manually:\n');
          console.log('📋 COPY THIS SQL TO SUPABASE DASHBOARD:');
          console.log('─'.repeat(70));
          console.log(migrationSQL);
          console.log('─'.repeat(70));
          console.log('\n🔗 Supabase SQL Editor:');
          console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql\n`);
          reject(new Error(`API call failed with status ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error.message);
      console.log('\n💡 Cannot execute via API.');
      console.log('Please run the migration manually in Supabase dashboard.\n');
      reject(error);
    });

    req.write(payload);
    req.end();
  });
}

runMigrationViaAPI()
  .then(() => {
    console.log('\n✅ Done!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed via API\n');
    process.exit(1);
  });
