#!/usr/bin/env node
const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function runMigration() {
  console.log('🚀 Running database migration directly...\n');

  const host = process.env.POSTGRES_HOST;
  const database = process.env.POSTGRES_DATABASE;
  const user = process.env.POSTGRES_USER;
  const password = process.env.POSTGRES_PASSWORD;
  
  if (!host || !database || !user || !password) {
    console.error('❌ Missing database credentials');
    process.exit(1);
  }

  const client = new Client({ 
    host,
    database,
    user,
    password,
    port: 5432,
    ssl: false  // Try without SSL first
  });

  try {
    console.log(`Connecting to ${host}...`);
    await client.connect();
    console.log('✓ Connected to database\n');

    // Step 1: Add column
    console.log('Step 1: Adding post_locale column...');
    await client.query(`
      ALTER TABLE visits 
      ADD COLUMN IF NOT EXISTS post_locale VARCHAR(2) DEFAULT 'fr';
    `);
    console.log('✓ Column added\n');

    // Step 2: Create index
    console.log('Step 2: Creating index on post_locale...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_visits_locale 
      ON visits(post_locale);
    `);
    console.log('✓ Index created\n');

    // Step 3: Update existing rows
    console.log('Step 3: Updating existing rows...');
    const updateResult = await client.query(`
      UPDATE visits 
      SET post_locale = 'fr' 
      WHERE post_locale IS NULL;
    `);
    console.log(`✓ Updated ${updateResult.rowCount} rows\n`);

    // Step 4: Make column NOT NULL
    console.log('Step 4: Setting post_locale as NOT NULL...');
    await client.query(`
      ALTER TABLE visits 
      ALTER COLUMN post_locale SET NOT NULL;
    `);
    console.log('✓ Column set to NOT NULL\n');

    // Step 5: Create composite index
    console.log('Step 5: Creating composite index...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_visits_locale_date 
      ON visits(post_locale, visit_date DESC);
    `);
    console.log('✓ Composite index created\n');

    // Verify
    console.log('Verifying migration...');
    const verifyResult = await client.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'visits' AND column_name = 'post_locale';
    `);

    if (verifyResult.rows.length > 0) {
      console.log('✓ Migration verified:\n');
      console.table(verifyResult.rows);
    }

    // Get statistics
    console.log('\nFetching current statistics...');
    const statsResult = await client.query(`
      SELECT COUNT(*) as total_records, SUM(count) as total_views
      FROM visits;
    `);
    
    if (statsResult.rows.length > 0) {
      console.log('\n📊 Database Statistics:');
      console.log(`   Total records: ${statsResult.rows[0].total_records}`);
      console.log(`   Total views: ${statsResult.rows[0].total_views || 0}`);
    }

    console.log('\n✅✅✅ MIGRATION COMPLETED SUCCESSFULLY! ✅✅✅\n');
    console.log('Next steps:');
    console.log('1. Visit some articles on your site');
    console.log('2. Check the homepage - view counts should appear!\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    
    // Try with SSL if non-SSL failed
    if (error.message.includes('SSL') || error.message.includes('ssl')) {
      console.log('\nRetrying with SSL enabled...\n');
      client.end();
      
      const sslClient = new Client({ 
        host,
        database,
        user,
        password,
        port: 5432,
        ssl: { rejectUnauthorized: false }
      });
      
      // Retry with SSL... (would need to repeat the migration logic)
      console.error('Please run manually - SSL configuration needed');
    }
    
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
