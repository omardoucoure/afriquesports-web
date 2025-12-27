#!/usr/bin/env node

/**
 * Clean up test/mock matches via API endpoint
 * Uses production API instead of direct database access
 */

require('dotenv').config({ path: '.env.local' });
const https = require('https');

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.afriquesports.net';
const WEBHOOK_SECRET = process.env.AI_AGENT_WEBHOOK_SECRET;

function postJSON(url, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postData = JSON.stringify(data);

    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(responseData)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: responseData
          });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function cleanup() {
  console.log('========================================');
  console.log('Test Matches Cleanup (via API)');
  console.log('========================================');
  console.log('');

  if (!WEBHOOK_SECRET) {
    console.error('❌ AI_AGENT_WEBHOOK_SECRET not configured in .env.local');
    process.exit(1);
  }

  // Test match IDs to delete
  const testMatches = [
    'test-brazil-france-2006',
    '732145',
    '732146',
    '732147',
    '732148',
    '732149',
    '732150'
  ];

  console.log(`Deleting ${testMatches.length} test matches...`);
  console.log('');

  let deletedCount = 0;

  for (const matchId of testMatches) {
    console.log(`   Deleting match ${matchId}...`);

    try {
      const response = await postJSON(`${SITE_URL}/api/admin/delete-match`, {
        match_id: matchId
      }, {
        'x-webhook-secret': WEBHOOK_SECRET
      });

      if (response.status === 200 || response.status === 404) {
        console.log(`      ✅ Deleted`);
        deletedCount++;
      } else {
        console.log(`      ⚠️  Status ${response.status}`);
      }
    } catch (error) {
      console.log(`      ❌ Error: ${error.message}`);
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('');
  console.log('========================================');
  console.log('✅ CLEANUP COMPLETED');
  console.log('========================================');
  console.log(`Processed ${testMatches.length} matches`);
  console.log(`Deleted ${deletedCount} matches`);
}

cleanup().catch(error => {
  console.error('');
  console.error('❌ FATAL ERROR:', error.message);
  process.exit(1);
});
