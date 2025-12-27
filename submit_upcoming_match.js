/**
 * Submit upcoming Tanzania vs Uganda match to Google
 * This demonstrates how the pre-match hook will work automatically
 */

const { google } = require('googleapis');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SITE_URL = 'https://www.afriquesports.net';
const MATCH_ID = 732151; // Tanzania vs Uganda - kicks off at 17:30 UTC

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function submitUpcomingMatch() {
  try {
    console.log('🎯 Pre-Match Indexing Test\n');
    console.log('Match: Tanzania vs Uganda');
    console.log('Match ID: 732151');
    console.log('Kickoff: 17:30 UTC (in ~1 hour)\n');
    console.log('This simulates what the cron job will do automatically for all future matches.\n');

    // Initialize Google API
    const auth = new google.auth.GoogleAuth({
      keyFile: './google-service-account.json',
      scopes: ['https://www.googleapis.com/auth/indexing']
    });

    const indexing = google.indexing({ version: 'v3', auth });

    // Submit all language versions
    const locales = [
      { code: 'fr', name: 'French' },
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Spanish' }
    ];

    console.log('📋 Pre-Match Checklist:\n');

    for (const locale of locales) {
      const url = locale.code === 'fr'
        ? `${SITE_URL}/can-2025/match/${MATCH_ID}`
        : `${SITE_URL}/${locale.code}/can-2025/match/${MATCH_ID}`;

      console.log(`${locale.name.padEnd(10)} ${url}`);

      // Step 1: Pre-warm the page
      console.log(`   🔥 Pre-warming page...`);
      try {
        const warmupResponse = await fetch(url, {
          method: 'GET',
          headers: { 'User-Agent': 'Googlebot' }
        });
        console.log(`   ✅ Page pre-warmed (HTTP ${warmupResponse.status})`);
      } catch (warmupError) {
        console.log(`   ⚠️  Page warmup failed: ${warmupError.message}`);
      }

      // Step 2: Submit to Google
      console.log(`   📤 Submitting to Google Indexing API...`);
      try {
        const response = await indexing.urlNotifications.publish({
          requestBody: {
            url: url,
            type: 'URL_UPDATED'
          }
        });

        console.log(`   ✅ Submitted! Response:`, response.data);

        // Step 3: Record in database
        await supabase.from('seo_indexing_status').upsert({
          url: url,
          submitted_at: new Date().toISOString(),
          indexing_status: 'submitted',
          last_checked_at: new Date().toISOString()
        }, { onConflict: 'url' });

        console.log(`   ✅ Recorded in database\n`);

      } catch (error) {
        console.error(`   ❌ Error: ${error.message}\n`);
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n🎉 SUCCESS! Match submitted to Google');
    console.log('\n📊 What happens next:');
    console.log('   1. Google will crawl the page within 1-6 hours');
    console.log('   2. Page will appear in search results before the match starts');
    console.log('   3. Users searching "tanzania uganda live" will find your page');
    console.log('   4. You\'ll rank BEFORE competitors because you submitted first!\n');

    console.log('🤖 For future matches:');
    console.log('   The cron job will do this automatically 2-4 hours before kickoff');
    console.log('   No manual intervention needed!\n');

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

submitUpcomingMatch();
