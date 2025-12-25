const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const client = new Client({
  connectionString: process.env.POSTGRES_URL_NON_POOLING
});

async function applyMigration() {
  try {
    await client.connect();
    console.log('✅ Connected to database');

    const sql = fs.readFileSync('supabase/migrations/007_add_coach_columns.sql', 'utf8');
    console.log('📄 Applying migration: 007_add_coach_columns.sql');

    await client.query(sql);
    console.log('✅ Migration applied successfully');

    await client.end();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

applyMigration();
