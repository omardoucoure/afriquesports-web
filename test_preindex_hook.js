/**
 * Test script for pre-match indexing hook
 * Tests the logic without HTTP auth
 */

const mysql = require('mysql2/promise');
const { google } = require('googleapis');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SITE_URL = 'https://www.afriquesports.net';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testPreMatchIndexing() {
  try {
    console.log('🧪 Testing Pre-Match Indexing Hook\n');
    console.log('Current time:', new Date().toISOString());

    // Connect to MySQL
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
    });

    // Get matches starting in next 2-4 hours
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const fourHoursFromNow = new Date(now.getTime() + 4 * 60 * 60 * 1000);

    console.log('\n📅 Searching for matches between:');
    console.log(`   From: ${twoHoursFromNow.toISOString()}`);
    console.log(`   To:   ${fourHoursFromNow.toISOString()}\n`);

    const [rows] = await connection.execute(
      `SELECT id, home_team, away_team, match_datetime, status
       FROM can2025_matches
       WHERE match_datetime BETWEEN ? AND ?
       AND status IN ('scheduled', 'not_started')
       ORDER BY match_datetime ASC`,
      [twoHoursFromNow, fourHoursFromNow]
    );

    console.log(`📋 Found ${rows.length} matches in the next 2-4 hours:\n`);

    if (rows.length === 0) {
      console.log('   (No matches found - this is expected if no matches are scheduled in that window)\n');

      // Let's check what matches ARE coming up
      console.log('📅 Checking all upcoming matches in next 24 hours:\n');

      const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const [allRows] = await connection.execute(
        `SELECT id, home_team, away_team, match_datetime, status
         FROM can2025_matches
         WHERE match_datetime BETWEEN NOW() AND ?
         AND status IN ('scheduled', 'not_started', 'live')
         ORDER BY match_datetime ASC
         LIMIT 10`,
        [twentyFourHoursFromNow]
      );

      for (const match of allRows) {
        const matchTime = new Date(match.match_datetime);
        const hoursUntil = Math.round((matchTime.getTime() - now.getTime()) / (60 * 60 * 1000));
        const minutesUntil = Math.round((matchTime.getTime() - now.getTime()) / (60 * 1000));

        console.log(`   ⚽ ${match.home_team} vs ${match.away_team}`);
        console.log(`      ID: ${match.id}`);
        console.log(`      Time: ${matchTime.toISOString()}`);
        console.log(`      Status: ${match.status}`);
        console.log(`      Starts in: ${hoursUntil}h ${minutesUntil % 60}min\n`);
      }

      await connection.end();
      return;
    }

    // Check which matches have already been submitted
    const { data: alreadySubmitted } = await supabase
      .from('seo_indexing_status')
      .select('url')
      .like('url', '%/can-2025/match/%');

    const submittedUrls = new Set(
      alreadySubmitted?.map(record => record.url) || []
    );

    console.log(`📊 Already submitted: ${submittedUrls.size} match URLs\n`);

    // Initialize Google API
    const auth = new google.auth.GoogleAuth({
      keyFile: './google-service-account.json',
      scopes: ['https://www.googleapis.com/auth/indexing']
    });

    const indexing = google.indexing({ version: 'v3', auth });

    // Process each match
    for (const match of rows) {
      const matchUrl = `${SITE_URL}/can-2025/match/${match.id}`;
      const matchTime = new Date(match.match_datetime);
      const timeUntilMatch = Math.round((matchTime.getTime() - now.getTime()) / (60 * 1000));

      console.log(`\n⚽ Match: ${match.home_team} vs ${match.away_team}`);
      console.log(`   ID: ${match.id}`);
      console.log(`   Kickoff: ${matchTime.toISOString()}`);
      console.log(`   Time until kickoff: ${timeUntilMatch} minutes`);
      console.log(`   Status: ${match.status}`);
      console.log(`   URL: ${matchUrl}`);

      // Skip if already submitted
      if (submittedUrls.has(matchUrl)) {
        console.log(`   ⏭️  Already submitted - skipping`);
        continue;
      }

      try {
        // Step 1: Pre-warm the page
        console.log(`   🔥 Pre-warming page...`);
        const warmupResponse = await fetch(matchUrl, {
          method: 'GET',
          headers: { 'User-Agent': 'Googlebot' }
        });

        console.log(`   ✅ Page pre-warmed (HTTP ${warmupResponse.status})`);

        // Step 2: Submit to Google Indexing API
        console.log(`   📤 Submitting to Google Indexing API...`);

        const response = await indexing.urlNotifications.publish({
          requestBody: {
            url: matchUrl,
            type: 'URL_UPDATED'
          }
        });

        console.log(`   ✅ Submitted to Google!`, response.data);

        // Step 3: Record in database
        await supabase.from('seo_indexing_status').upsert({
          url: matchUrl,
          submitted_at: new Date().toISOString(),
          indexing_status: 'submitted',
          last_checked_at: new Date().toISOString()
        }, { onConflict: 'url' });

        console.log(`   ✅ Recorded in database`);

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
      }
    }

    await connection.end();

    console.log('\n✅ Test completed successfully!\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testPreMatchIndexing();
