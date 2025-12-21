/**
 * Database Migration Script
 * Adds post_locale column to visits table
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
  console.log('🚀 Starting database migration...\n');

  // Get Supabase credentials from environment
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }

  console.log('✓ Supabase credentials found');
  console.log(`  URL: ${supabaseUrl}\n`);

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Step 1: Add the column
    console.log('Step 1: Adding post_locale column...');
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE visits ADD COLUMN IF NOT EXISTS post_locale VARCHAR(2) DEFAULT 'fr';`
    });

    if (alterError && !alterError.message.includes('already exists')) {
      throw alterError;
    }
    console.log('✓ Column added\n');

    // Step 2: Create index
    console.log('Step 2: Creating index on post_locale...');
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `CREATE INDEX IF NOT EXISTS idx_visits_locale ON visits(post_locale);`
    });

    if (indexError) throw indexError;
    console.log('✓ Index created\n');

    // Step 3: Update existing rows
    console.log('Step 3: Updating existing rows...');
    const { error: updateError } = await supabase
      .from('visits')
      .update({ post_locale: 'fr' })
      .is('post_locale', null);

    if (updateError) throw updateError;
    console.log('✓ Existing rows updated\n');

    // Step 4: Make column NOT NULL
    console.log('Step 4: Setting post_locale as NOT NULL...');
    const { error: notNullError } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE visits ALTER COLUMN post_locale SET NOT NULL;`
    });

    if (notNullError) throw notNullError;
    console.log('✓ Column set to NOT NULL\n');

    // Step 5: Create composite index
    console.log('Step 5: Creating composite index...');
    const { error: compositeIndexError } = await supabase.rpc('exec_sql', {
      sql: `CREATE INDEX IF NOT EXISTS idx_visits_locale_date ON visits(post_locale, visit_date DESC);`
    });

    if (compositeIndexError) throw compositeIndexError;
    console.log('✓ Composite index created\n');

    // Verification
    console.log('Verifying migration...');
    const { data, error } = await supabase
      .from('visits')
      .select('post_locale')
      .limit(1);

    if (error) throw error;
    
    console.log('✓ Migration verified\n');
    console.log('✅ Migration completed successfully!\n');
    
    // Test query
    console.log('Running test query...');
    const { data: stats, error: statsError } = await supabase
      .from('visits')
      .select('post_locale, count')
      .limit(5);

    if (!statsError && stats) {
      console.log('Sample data:');
      console.table(stats);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
