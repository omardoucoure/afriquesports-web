#!/usr/bin/env node

/**
 * Create Cloudflare Page Rule to bypass cache for live match endpoint
 *
 * Usage:
 *   node scripts/create-cloudflare-page-rule.js
 *
 * Requires:
 *   - CLOUDFLARE_API_TOKEN in .env.local or .env.production
 *   - CLOUDFLARE_ZONE_ID in .env.local or .env.production
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env.production' });

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;

if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ZONE_ID) {
  console.error('❌ Missing Cloudflare credentials!');
  console.error('   Please add to .env.local or .env.production:');
  console.error('   - CLOUDFLARE_API_TOKEN=your_token_here');
  console.error('   - CLOUDFLARE_ZONE_ID=your_zone_id_here');
  process.exit(1);
}

async function createPageRule() {
  try {
    console.log('🔧 Creating Cloudflare Page Rule for live match endpoint...\n');

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/pagerules`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targets: [
            {
              target: 'url',
              constraint: {
                operator: 'matches',
                value: 'www.afriquesports.net/api/can2025/next-match*',
              },
            },
          ],
          actions: [
            {
              id: 'cache_level',
              value: 'bypass',
            },
          ],
          priority: 1,
          status: 'active',
        }),
      }
    );

    const data = await response.json();

    if (data.success) {
      console.log('✅ Page Rule created successfully!\n');
      console.log('📋 Rule Details:');
      console.log(`   ID: ${data.result.id}`);
      console.log(`   URL Pattern: ${data.result.targets[0].constraint.value}`);
      console.log(`   Action: Bypass Cache`);
      console.log(`   Status: ${data.result.status}`);
      console.log(`   Priority: ${data.result.priority}\n`);
      console.log('🎉 Live match endpoint will now bypass Cloudflare cache!');
    } else {
      console.error('❌ Failed to create page rule:');
      console.error(JSON.stringify(data.errors, null, 2));

      // Check if rule already exists
      if (data.errors?.[0]?.code === 1004) {
        console.log('\n💡 The page rule might already exist. Listing existing rules...');
        await listPageRules();
      }

      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error creating page rule:', error);
    process.exit(1);
  }
}

async function listPageRules() {
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/pagerules`,
      {
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (data.success && data.result.length > 0) {
      console.log('\n📋 Existing Page Rules:');
      data.result.forEach((rule, index) => {
        console.log(`\n${index + 1}. ${rule.targets[0].constraint.value}`);
        console.log(`   Actions: ${rule.actions.map(a => `${a.id}=${a.value}`).join(', ')}`);
        console.log(`   Status: ${rule.status}`);
      });
    } else {
      console.log('\n📋 No existing page rules found.');
    }
  } catch (error) {
    console.error('Error listing page rules:', error);
  }
}

async function purgeCacheForEndpoint() {
  try {
    console.log('\n🧹 Purging Cloudflare cache for match endpoint...');

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
      console.log('✅ Cache purged successfully!');
      console.log('   URL: https://www.afriquesports.net/api/can2025/next-match');
    } else {
      console.error('❌ Failed to purge cache:');
      console.error(JSON.stringify(data.errors, null, 2));
    }
  } catch (error) {
    console.error('❌ Error purging cache:', error);
  }
}

// Run both: create rule and purge cache
(async () => {
  await createPageRule();
  await purgeCacheForEndpoint();
})();
