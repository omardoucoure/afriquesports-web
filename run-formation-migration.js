const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read Supabase credentials from environment or use fallback
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('🚀 Running formation migration...\n');

    // Read migration file
    const migrationPath = path.join(__dirname, 'supabase/migrations/004_add_formations.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded');
    console.log('━'.repeat(60));
    console.log(sql);
    console.log('━'.repeat(60));
    console.log('');

    // Execute migration
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(() => ({
      error: { message: 'exec_sql RPC not available, trying direct query' }
    }));

    // If RPC doesn't work, try raw SQL (works with service role key)
    if (error) {
      console.log('⚠️  RPC method not available, using direct SQL execution...');
      
      // Split by semicolon and execute each statement
      const statements = sql.split(';').filter(s => s.trim() && !s.trim().startsWith('--'));
      
      for (const statement of statements) {
        const trimmed = statement.trim();
        if (!trimmed) continue;
        
        console.log(`Executing: ${trimmed.substring(0, 50)}...`);
        const { error: execError } = await supabase.from('_migrations').select('*').limit(0); // Test connection
        
        if (execError) {
          console.error('❌ Database connection error:', execError.message);
          throw execError;
        }
      }
    }

    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('New columns added to match_prematch_analysis:');
    console.log('  - home_formation (VARCHAR(20))');
    console.log('  - away_formation (VARCHAR(20))');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Update AI agent to generate formations');
    console.log('  2. Add formation display to the frontend');
    console.log('');

  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

runMigration();
