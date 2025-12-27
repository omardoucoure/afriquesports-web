const { google } = require('googleapis');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function submitMatchToGoogle() {
  const url = 'https://www.afriquesports.net/can-2025/match/732152';

  try {
    console.log('🔐 Initializing Google Indexing API...');

    // Load service account credentials
    const serviceAccountPath = './google-service-account.json';
    const auth = new google.auth.GoogleAuth({
      keyFile: serviceAccountPath,
      scopes: ['https://www.googleapis.com/auth/indexing']
    });

    const indexing = google.indexing({ version: 'v3', auth });

    console.log(`📤 Submitting URL to Google: ${url}`);

    const response = await indexing.urlNotifications.publish({
      requestBody: {
        url: url,
        type: 'URL_UPDATED'
      }
    });

    console.log('✅ Successfully submitted to Google Indexing API!');
    console.log('Response:', JSON.stringify(response.data, null, 2));

    // Record in Supabase
    await supabase.from('seo_indexing_status').upsert({
      url: url,
      submitted_at: new Date().toISOString(),
      indexing_status: 'submitted'
    }, { onConflict: 'url' });

    console.log('✅ Recorded in database');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.errors) {
      console.error('Details:', JSON.stringify(error.errors, null, 2));
    }
  }
}

submitMatchToGoogle();
