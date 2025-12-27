const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const client = new Client({
  connectionString: process.env.POSTGRES_URL_NON_POOLING
});

async function applyMigration() {
  try {
    await client.connect();
    console.log('✅ Connected to Supabase');

    const sql = fs.readFileSync('supabase/migrations/20250101000000_seo_agent_schema.sql', 'utf8');
    console.log('📄 Migration file loaded');

    console.log('⏳ Applying migration...');
    await client.query(sql);
    console.log('✅ Migration applied successfully');

    // Verify tables were created
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE 'seo_%'
      ORDER BY table_name
    `);

    console.log('\n📊 Created tables:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    await client.end();
    console.log('\n🎉 Migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await client.end();
    process.exit(1);
  }
}

applyMigration();
