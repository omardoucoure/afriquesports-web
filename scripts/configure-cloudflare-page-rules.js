#!/usr/bin/env node

/**
 * Configure Critical Cloudflare Page Rules
 *
 * Creates essential page rules for:
 * - Live match endpoint bypass (real-time data)
 * - WordPress admin bypass (never cache)
 * - Match live update API bypass
 *
 * Usage:
 *   node scripts/configure-cloudflare-page-rules.js
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env.production' });

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;

if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ZONE_ID) {
  console.error('❌ Missing Cloudflare credentials!');
  process.exit(1);
}

const CRITICAL_RULES = [
  {
    name: 'Bypass Live Match Endpoint',
    priority: 1,
    targets: [{
      target: 'url',
      constraint: {
        operator: 'matches',
        value: 'www.afriquesports.net/api/can2025/next-match*'
      }
    }],
    actions: [
      { id: 'cache_level', value: 'bypass' }
    ],
    status: 'active'
  },
  {
    name: 'Bypass Match Live Update API',
    priority: 2,
    targets: [{
      target: 'url',
      constraint: {
        operator: 'matches',
        value: 'www.afriquesports.net/api/match-live-update*'
      }
    }],
    actions: [
      { id: 'cache_level', value: 'bypass' }
    ],
    status: 'active'
  },
  {
    name: 'Bypass WordPress Admin',
    priority: 3,
    targets: [{
      target: 'url',
      constraint: {
        operator: 'matches',
        value: 'cms.realdemadrid.com/wp-admin*'
      }
    }],
    actions: [
      { id: 'cache_level', value: 'bypass' },
      { id: 'disable_performance' }
    ],
    status: 'active'
  }
];

async function listExistingRules() {
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

    if (data.success) {
      return data.result;
    }
    return [];
  } catch (error) {
    console.error('❌ Error listing rules:', error.message);
    return [];
  }
}

async function createPageRule(rule) {
  try {
    console.log(`\n🔧 Creating: ${rule.name}...`);

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/pagerules`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rule),
      }
    );

    const data = await response.json();

    if (data.success) {
      console.log(`✅ Created: ${rule.name}`);
      console.log(`   URL Pattern: ${rule.targets[0].constraint.value}`);
      console.log(`   Priority: ${rule.priority}`);
    } else {
      console.error(`❌ Failed: ${rule.name}`);
      console.error(`   Errors:`, JSON.stringify(data.errors, null, 2));
    }

    return data.success;
  } catch (error) {
    console.error(`❌ Error creating ${rule.name}:`, error.message);
    return false;
  }
}

async function deletePageRule(ruleId, description) {
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/pagerules/${ruleId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (data.success) {
      console.log(`✅ Deleted old rule: ${description}`);
    }

    return data.success;
  } catch (error) {
    console.error(`❌ Error deleting rule:`, error.message);
    return false;
  }
}

async function purgeCacheForEndpoints() {
  try {
    console.log('\n🧹 Purging cache for live endpoints...');

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
            'https://www.afriquesports.net/api/match-live-update',
          ],
        }),
      }
    );

    const data = await response.json();

    if (data.success) {
      console.log('✅ Cache purged for live endpoints');
    } else {
      console.error('❌ Failed to purge cache:', JSON.stringify(data.errors, null, 2));
    }
  } catch (error) {
    console.error('❌ Error purging cache:', error.message);
  }
}

// Main execution
(async () => {
  console.log('🌩️  Cloudflare Page Rules Configuration');
  console.log('=========================================\n');

  // List existing rules
  console.log('📋 Checking existing page rules...');
  const existingRules = await listExistingRules();
  console.log(`   Found ${existingRules.length} existing rules\n`);

  // Check for conflicts
  const conflictingPatterns = [
    'www.afriquesports.net/api/can2025/next-match',
    'www.afriquesports.net/api/match-live-update',
    'cms.realdemadrid.com/wp-admin'
  ];

  for (const rule of existingRules) {
    const pattern = rule.targets[0].constraint.value;
    for (const conflictPattern of conflictingPatterns) {
      if (pattern.includes(conflictPattern) || conflictPattern.includes(pattern.replace(/\*/g, ''))) {
        console.log(`⚠️  Found existing rule that might conflict: ${pattern}`);
        console.log(`   Consider deleting rule ID: ${rule.id}`);
      }
    }
  }

  // Create new critical rules
  console.log('\n🚀 Creating critical page rules...');

  let successCount = 0;
  for (const rule of CRITICAL_RULES) {
    const success = await createPageRule(rule);
    if (success) successCount++;
    await new Promise(resolve => setTimeout(resolve, 500)); // Rate limit
  }

  // Purge cache
  await purgeCacheForEndpoints();

  // Summary
  console.log('\n==========================================');
  console.log(`✅ Created ${successCount}/${CRITICAL_RULES.length} critical rules`);
  console.log(`\n📊 Current page rules: ${existingRules.length + successCount}/20 (Pro plan limit)`);

  console.log('\n🎯 Next Steps:');
  console.log('   1. Test live match bypass: curl -I https://www.afriquesports.net/api/can2025/next-match');
  console.log('   2. Test wp-admin bypass: curl -I https://cms.realdemadrid.com/wp-admin/');
  console.log('   3. Verify real-time updates work');
  console.log('   4. Monitor Cloudflare Analytics for cache hit ratio');

  console.log('\n📚 Documentation:');
  console.log('   - Full guide: CLOUDFLARE_OPTIMIZATION_GUIDE.md');
  console.log('   - Verification: node scripts/verify-cloudflare-config.js');
})();
