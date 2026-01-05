#!/usr/bin/env node

/**
 * Purge Cloudflare cache for live match endpoint
 *
 * Usage:
 *   node scripts/purge-match-cache.js
 */

require('dotenv').config({ path: '.env.local' });

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;

if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ZONE_ID) {
  console.error('❌ Missing Cloudflare credentials in .env.local!');
  process.exit(1);
}

async function purgeCacheForMatchEndpoint() {
  try {
    console.log('🧹 Purging Cloudflare cache for match endpoint...\n');

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: [
            'https://www.afriquesports.net/api/can2025/next-match',
          ],
        }),
      }
    );

    const data = await response.json();

    if (data.success) {
      console.log('✅ Cache purged successfully!\n');
      console.log('📋 Details:');
      console.log('   URL: https://www.afriquesports.net/api/can2025/next-match');
      console.log('   Zone ID:', CLOUDFLARE_ZONE_ID);
      console.log('\n🎉 Match endpoint will now show fresh data!');

      // Test the endpoint
      console.log('\n🔄 Testing endpoint...');
      const testResponse = await fetch('https://www.afriquesports.net/api/can2025/next-match');
      const matchData = await testResponse.json();

      if (matchData.hasMatch) {
        console.log('\n⚽ Current Match:');
        console.log(`   ${matchData.homeTeam.name} vs ${matchData.awayTeam.name}`);
        console.log(`   Status: ${matchData.isLive ? '🔴 LIVE' : matchData.isFinished ? '✅ Finished' : '📅 Upcoming'}`);
        if (matchData.statusDetail) {
          console.log(`   Time: ${matchData.statusDetail}`);
        }
      } else {
        console.log('\n📋 No match data available');
      }
    } else {
      console.error('❌ Failed to purge cache:');
      console.error(JSON.stringify(data.errors, null, 2));
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error purging cache:', error);
    process.exit(1);
  }
}

purgeCacheForMatchEndpoint();
