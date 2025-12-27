/**
 * Manual script to submit current Senegal vs RD Congo match to Google
 *
 * Run this AFTER enabling Google Indexing API at:
 * https://console.developers.google.com/apis/api/indexing.googleapis.com/overview?project=317070880464
 *
 * Usage: NODE_TLS_REJECT_UNAUTHORIZED=0 node submit_current_match.js
 */

const { google } = require('googleapis');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SITE_URL = 'https://www.afriquesports.net';
const MATCH_ID = 732152; // Senegal vs RD Congo

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function submitCurrentMatch() {
  try {
    console.log('🎯 Submitting Senegal vs RD Congo match to Google Indexing API\n');

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

    for (const locale of locales) {
      const url = locale.code === 'fr'
        ? `${SITE_URL}/can-2025/match/${MATCH_ID}`
        : `${SITE_URL}/${locale.code}/can-2025/match/${MATCH_ID}`;

      console.log(`📤 Submitting ${locale.name} version...`);
      console.log(`   URL: ${url}`);

      try {
        const response = await indexing.urlNotifications.publish({
          requestBody: {
            url: url,
            type: 'URL_UPDATED'
          }
        });

        console.log(`   ✅ Success! Response:`, response.data);

        // Record in database
        await supabase.from('seo_indexing_status').upsert({
          url: url,
          submitted_at: new Date().toISOString(),
          indexing_status: 'submitted',
          last_checked_at: new Date().toISOString()
        }, { onConflict: 'url' });

      } catch (error) {
        console.error(`   ❌ Error submitting ${locale.name}:`, error.message);

        if (error.message.includes('has not been used') || error.message.includes('disabled')) {
          console.error('\n⚠️  GOOGLE INDEXING API IS NOT ENABLED!\n');
          console.error('Please enable it at:');
          console.error('https://console.developers.google.com/apis/api/indexing.googleapis.com/overview?project=317070880464\n');
          console.error('Then wait 2-3 minutes and run this script again.\n');
          process.exit(1);
        }
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n✅ All done! The match page has been submitted to Google.');
    console.log('It should appear in search results within 1-24 hours.\n');

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

submitCurrentMatch();
