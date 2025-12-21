#!/usr/bin/env node
/**
 * Fix visits table - Add post_locale column
 * This script checks if the column exists and helps fix it
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function main() {
  console.log('🔍 Checking Supabase database schema...\n');

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    console.error('   Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY\n');
    process.exit(1);
  }

  console.log('✓ Found Supabase credentials');
  console.log(`  URL: ${supabaseUrl}\n`);

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Try to query with post_locale column
    console.log('Checking if post_locale column exists...');
    
    const { data, error } = await supabase
      .from('visits')
      .select('post_locale')
      .limit(1);

    if (error) {
      if (error.message.includes('post_locale') && error.message.includes('does not exist')) {
        console.log('❌ Column post_locale does NOT exist\n');
        console.log('=' .repeat(70));
        console.log('TO FIX THIS ISSUE:');
        console.log('=' .repeat(70));
        console.log('');
        console.log('1. Go to: https://supabase.com/dashboard');
        console.log('2. Select your project');
        console.log('3. Click "SQL Editor" in the left sidebar');
        console.log('4. Click "New query"');
        console.log('5. Copy and paste this SQL:\n');
        console.log('-'.repeat(70));
        console.log(`
ALTER TABLE visits
ADD COLUMN IF NOT EXISTS post_locale VARCHAR(2) DEFAULT 'fr';

CREATE INDEX IF NOT EXISTS idx_visits_locale ON visits(post_locale);

UPDATE visits
SET post_locale = 'fr'
WHERE post_locale IS NULL;

ALTER TABLE visits
ALTER COLUMN post_locale SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_visits_locale_date 
ON visits(post_locale, visit_date DESC);
        `.trim());
        console.log('-'.repeat(70));
        console.log('\n6. Click "Run" or press Ctrl+Enter');
        console.log('7. Run this script again to verify\n');
        console.log('=' .repeat(70));
        process.exit(1);
      } else {
        throw error;
      }
    }

    console.log('✅ Column post_locale EXISTS!\n');

    // Get statistics
    console.log('📊 Fetching database statistics...\n');
    
    const { data: allVisits, error: statsError } = await supabase
      .from('visits')
      .select('post_locale, post_title, count, visit_date')
      .order('count', { ascending: false })
      .limit(100);

    if (statsError) {
      console.error('Error fetching stats:', statsError.message);
      process.exit(1);
    }

    if (!allVisits || allVisits.length === 0) {
      console.log('⚠️  No visits recorded yet');
      console.log('   Visit some articles on your site to populate the database\n');
      process.exit(0);
    }

    // Calculate totals by locale
    const byLocale = {};
    let totalViews = 0;
    
    allVisits.forEach(visit => {
      const locale = visit.post_locale || 'unknown';
      if (!byLocale[locale]) {
        byLocale[locale] = { visits: 0, views: 0 };
      }
      byLocale[locale].visits++;
      byLocale[locale].views += visit.count;
      totalViews += visit.count;
    });

    console.log('Database Statistics:');
    console.log(`  Total visit records: ${allVisits.length}`);
    console.log(`  Total views: ${totalViews}\n`);
    
    console.log('Views by locale:');
    Object.entries(byLocale).forEach(([locale, stats]) => {
      console.log(`  ${locale.toUpperCase()}: ${stats.views} views (${stats.visits} records)`);
    });

    console.log('\n📄 Top 5 most viewed articles:');
    allVisits.slice(0, 5).forEach((visit, index) => {
      const title = visit.post_title.length > 50 
        ? visit.post_title.substring(0, 47) + '...' 
        : visit.post_title;
      console.log(`  ${index + 1}. [${visit.post_locale}] ${title}`);
      console.log(`     ${visit.count} views on ${visit.visit_date}`);
    });

    console.log('\n✅ Database is properly configured and has data!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();
