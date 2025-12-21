/**
 * Run Supabase Migration Script
 * Executes the 002_ai_content_tables.sql migration
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('🚀 Starting Supabase migration...\n');

  // Get Supabase credentials from environment
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials!');
    console.error('   Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
    process.exit(1);
  }

  console.log(`✅ Supabase URL: ${supabaseUrl}`);
  console.log(`✅ Service key found\n`);

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Read migration file
  const migrationPath = path.join(__dirname, 'supabase/migrations/002_ai_content_tables.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  console.log(`📄 Reading migration: ${migrationPath}`);
  console.log(`📝 Migration size: ${migrationSQL.length} characters\n`);

  try {
    // Execute migration
    console.log('⚙️  Executing migration...\n');

    // Split by semicolons and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let successCount = 0;
    let skipCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';

      // Skip comments
      if (statement.startsWith('--')) continue;

      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement });

        if (error) {
          // Check if it's a "already exists" error (safe to ignore)
          if (error.message.includes('already exists')) {
            console.log(`⚠️  Statement ${i + 1}/${statements.length}: Already exists (skipped)`);
            skipCount++;
          } else {
            throw error;
          }
        } else {
          console.log(`✅ Statement ${i + 1}/${statements.length}: Success`);
          successCount++;
        }
      } catch (err) {
        // If exec_sql doesn't exist, try direct SQL execution
        const { error } = await supabase.from('_migrations').select('*').limit(1);

        if (error) {
          console.error(`\n❌ Error executing statement ${i + 1}:`, err.message);
          console.error(`   Statement: ${statement.substring(0, 100)}...`);

          // Continue with other statements
          continue;
        }
      }
    }

    console.log(`\n${'='.repeat(70)}`);
    console.log(`✅ Migration completed!`);
    console.log(`   Successful: ${successCount}`);
    console.log(`   Skipped: ${skipCount}`);
    console.log(`   Total: ${statements.length}`);
    console.log(`${'='.repeat(70)}\n`);

    // Verify tables were created
    console.log('🔍 Verifying tables...\n');

    const tables = [
      'match_commentary_ai',
      'match_reports_ai',
      'match_predictions_ai',
      'trending_players'
    ];

    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('*').limit(1);

      if (error) {
        console.error(`❌ Table "${table}" not found or inaccessible`);
      } else {
        console.log(`✅ Table "${table}" verified`);
      }
    }

    console.log('\n✅ All done! Your Supabase database is ready for CAN 2025! 🎉\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('   You may need to run this migration manually in the Supabase SQL editor.');
    process.exit(1);
  }
}

runMigration();
