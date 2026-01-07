/**
 * Run Supabase Migration Script (Using PostgreSQL Direct Connection)
 * Executes the 002_ai_content_tables.sql migration
 */

require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('🚀 Starting Supabase migration via PostgreSQL...\n');

  // Get database connection string
  const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

  if (!databaseUrl) {
    console.error('❌ Missing DATABASE_URL or SUPABASE_DB_URL!');
    console.error('   Please add the direct PostgreSQL connection string to .env.local');
    console.error('   Format: postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres');
    process.exit(1);
  }

  console.log(`✅ Database URL found`);
  console.log(`   Host: ${databaseUrl.split('@')[1]?.split(':')[0] || 'unknown'}\n`);

  // Create PostgreSQL client
  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    // Connect to database
    console.log('🔌 Connecting to PostgreSQL...');
    await client.connect();
    console.log('✅ Connected!\n');

    // Read migration file
    const migrationPath = path.join(__dirname, 'supabase/migrations/002_ai_content_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log(`📄 Reading migration: ${migrationPath}`);
    console.log(`📝 Migration size: ${migrationSQL.length} characters\n`);

    // Execute migration
    console.log('⚙️  Executing migration...\n');

    const result = await client.query(migrationSQL);

    console.log(`✅ Migration executed successfully!\n`);

    // Verify tables were created
    console.log('🔍 Verifying tables...\n');

    const tables = [
      'match_commentary_ai',
      'match_reports_ai',
      'match_predictions_ai',
      'trending_players'
    ];

    for (const table of tables) {
      const checkQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = $1
        );
      `;

      const { rows } = await client.query(checkQuery, [table]);

      if (rows[0].exists) {
        console.log(`✅ Table "${table}" verified`);

        // Count rows (should be 0 for new table)
        const countQuery = `SELECT COUNT(*) FROM ${table};`;
        const countResult = await client.query(countQuery);
        console.log(`   Rows: ${countResult.rows[0].count}`);
      } else {
        console.error(`❌ Table "${table}" not found!`);
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ All done! Your Supabase database is ready for CAN 2025! 🎉');
    console.log('='.repeat(70) + '\n');

    console.log('Next steps:');
    console.log('1. ✅ Database migration complete');
    console.log('2. ⏭️  Integrate LiveMatchCommentary component into /can-2025 page');
    console.log('3. ⏭️  Test with sample data');
    console.log('4. ⏭️  Deploy to production\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);

    // Check if it's a "relation already exists" error
    if (error.message.includes('already exists')) {
      console.log('\n⚠️  Tables may already exist. Let me verify...\n');

      const tables = [
        'match_commentary_ai',
        'match_reports_ai',
        'match_predictions_ai',
        'trending_players'
      ];

      for (const table of tables) {
        try {
          const checkQuery = `
            SELECT EXISTS (
              SELECT FROM information_schema.tables
              WHERE table_schema = 'public'
              AND table_name = $1
            );
          `;

          const { rows } = await client.query(checkQuery, [table]);

          if (rows[0].exists) {
            console.log(`✅ Table "${table}" exists`);
          } else {
            console.log(`❌ Table "${table}" not found`);
          }
        } catch (err) {
          console.error(`❌ Error checking table "${table}":`, err.message);
        }
      }

      console.log('\n✅ Migration may have already been run. Tables exist!\n');
    } else {
      console.error('\n💡 Tip: You may need to run this migration manually in the Supabase SQL editor.');
      console.error('   Go to: https://supabase.com/dashboard/project/[your-project]/sql\n');
      process.exit(1);
    }
  } finally {
    await client.end();
    console.log('🔌 Database connection closed.\n');
  }
}

runMigration();
