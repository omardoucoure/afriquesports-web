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
    
    const sql = fs.readFileSync('supabase/migrations/006_match_youtube_streams.sql', 'utf8');
    await client.query(sql);
    console.log('✅ Migration 006_match_youtube_streams.sql applied successfully');
    
    await client.end();
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

applyMigration();
