const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const client = new Client({
  connectionString: process.env.POSTGRES_URL_NON_POOLING
});

async function applyMigration() {
  try {
    await client.connect();
    console.log('Connected to database');

    const sql = fs.readFileSync('supabase/migrations/006_match_states_tracking.sql', 'utf8');
    console.log('Applying migration: 006_match_states_tracking.sql');

    await client.query(sql);
    console.log('✅ Migration applied successfully');

    await client.end();
  } catch (error) {
    console.error('❌ Error applying migration:', error);
    process.exit(1);
  }
}

applyMigration();
