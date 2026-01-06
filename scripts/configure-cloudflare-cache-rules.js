#!/usr/bin/env node

/**
 * Configure Cloudflare Cache Rules for Optimal Performance
 *
 * Based on research from developer week 2025, this script creates modern
 * Cache Rules (replacement for Page Rules) optimized for:
 * - Next.js 16 ISR with headless WordPress
 * - Real-time live match data (bypass cache)
 * - WordPress API caching (1 minute)
 * - Aggressive static asset caching (1 month)
 * - Mobile-first African traffic optimization
 *
 * Usage:
 *   node scripts/configure-cloudflare-cache-rules.js
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

const CACHE_RULES = [
  {
    name: 'Bypass Live Match Endpoint',
    priority: 1,
    description: 'Real-time match data must never be cached',
    expression: '(http.host eq "www.afriquesports.net" and starts_with(http.request.uri.path, "/api/can2025/next-match"))',
    action: 'bypass',
    cache_control: {
      cache_by_device_type: false,
      respect_origin_cache_control: false,
      edge_ttl: {
        mode: 'bypass_by_default'
      }
    }
  },
  {
    name: 'Cache WordPress API - 1 minute',
    priority: 2,
    description: 'Cache WordPress REST API responses for 60 seconds to reduce load',
    expression: '(http.host eq "cms.realdemadrid.com" and starts_with(http.request.uri.path, "/wp-json/"))',
    action: 'cache',
    cache_control: {
      cache_by_device_type: false,
      respect_origin_cache_control: false,
      edge_ttl: {
        mode: 'override_origin',
        default: 60
      },
      browser_ttl: {
        mode: 'respect_origin'
      }
    }
  },
  {
    name: 'Cache Static Assets - 1 month',
    priority: 3,
    description: 'Aggressive caching for CSS, JS, fonts',
    expression: '(http.host eq "www.afriquesports.net" and (ends_with(http.request.uri.path, ".css") or ends_with(http.request.uri.path, ".js") or ends_with(http.request.uri.path, ".woff") or ends_with(http.request.uri.path, ".woff2") or ends_with(http.request.uri.path, ".ttf") or ends_with(http.request.uri.path, ".svg") or starts_with(http.request.uri.path, "/_next/static/")))',
    action: 'cache',
    cache_control: {
      cache_by_device_type: false,
      respect_origin_cache_control: false,
      edge_ttl: {
        mode: 'override_origin',
        default: 2592000 // 30 days
      },
      browser_ttl: {
        mode: 'override_origin',
        default: 31536000 // 1 year
      }
    }
  },
  {
    name: 'Cache Images - 1 month',
    priority: 4,
    description: 'Cache images aggressively for mobile performance',
    expression: '((http.host eq "www.afriquesports.net" or http.host eq "cms.realdemadrid.com") and (starts_with(http.request.uri.path, "/wp-content/uploads/") or starts_with(http.request.uri.path, "/_next/image") or ends_with(http.request.uri.path, ".jpg") or ends_with(http.request.uri.path, ".jpeg") or ends_with(http.request.uri.path, ".png") or ends_with(http.request.uri.path, ".webp") or ends_with(http.request.uri.path, ".avif")))',
    action: 'cache',
    cache_control: {
      cache_by_device_type: false,
      respect_origin_cache_control: false,
      edge_ttl: {
        mode: 'override_origin',
        default: 2592000 // 30 days
      },
      browser_ttl: {
        mode: 'override_origin',
        default: 31536000 // 1 year
      }
    }
  },
  {
    name: 'Bypass WordPress Admin',
    priority: 5,
    description: 'Never cache WordPress admin pages',
    expression: '(http.host eq "cms.realdemadrid.com" and (starts_with(http.request.uri.path, "/wp-admin/") or http.request.uri.path eq "/wp-login.php" or http.request.uri.path eq "/xmlrpc.php"))',
    action: 'bypass',
    cache_control: {
      cache_by_device_type: false,
      respect_origin_cache_control: false,
      edge_ttl: {
        mode: 'bypass_by_default'
      }
    }
  },
  {
    name: 'Cache Everything for Articles',
    priority: 6,
    description: 'Cache article pages while respecting ISR revalidation headers',
    expression: '(http.host eq "www.afriquesports.net" and not starts_with(http.request.uri.path, "/api/") and not starts_with(http.request.uri.path, "/wp-admin/") and not starts_with(http.request.uri.path, "/_next/data/"))',
    action: 'cache',
    cache_control: {
      cache_by_device_type: false,
      respect_origin_cache_control: true, // Respect Next.js ISR headers
      edge_ttl: {
        mode: 'respect_origin'
      },
      browser_ttl: {
        mode: 'respect_origin'
      }
    }
  }
];

async function createCacheRule(rule) {
  try {
    console.log(`\n🔧 Creating cache rule: ${rule.name}...`);
    console.log(`   Description: ${rule.description}`);
    console.log(`   Priority: ${rule.priority}`);

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/rulesets/phases/http_request_cache_settings/entrypoint`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rules: [
            {
              description: rule.description,
              expression: rule.expression,
              action: rule.action === 'cache' ? 'set_cache_settings' : 'set_cache_settings',
              action_parameters: rule.cache_control
            }
          ]
        }),
      }
    );

    const data = await response.json();

    if (data.success) {
      console.log(`✅ Cache rule created: ${rule.name}`);
    } else {
      console.error(`❌ Failed to create cache rule: ${rule.name}`);
      console.error(JSON.stringify(data.errors, null, 2));
    }

    return data;
  } catch (error) {
    console.error(`❌ Error creating cache rule: ${rule.name}`, error);
    return null;
  }
}

async function listExistingCacheRules() {
  try {
    console.log('\n📋 Checking existing cache rules...');

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/rulesets/phases/http_request_cache_settings/entrypoint`,
      {
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (data.success && data.result?.rules) {
      console.log(`\n📋 Found ${data.result.rules.length} existing cache rules:`);
      data.result.rules.forEach((rule, index) => {
        console.log(`\n${index + 1}. ${rule.description || 'Unnamed rule'}`);
        console.log(`   Expression: ${rule.expression}`);
        console.log(`   Action: ${rule.action}`);
      });
      return data.result.rules;
    } else {
      console.log('\n📋 No existing cache rules found.');
      return [];
    }
  } catch (error) {
    console.error('❌ Error listing cache rules:', error);
    return [];
  }
}

async function deleteAllCacheRules() {
  try {
    console.log('\n🧹 Deleting all existing cache rules...');

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/rulesets/phases/http_request_cache_settings/entrypoint`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rules: []
        }),
      }
    );

    const data = await response.json();

    if (data.success) {
      console.log('✅ All cache rules deleted successfully!');
    } else {
      console.error('❌ Failed to delete cache rules:');
      console.error(JSON.stringify(data.errors, null, 2));
    }
  } catch (error) {
    console.error('❌ Error deleting cache rules:', error);
  }
}

async function createAllCacheRules() {
  try {
    console.log('\n🚀 Creating all cache rules in a single batch...');

    const rules = CACHE_RULES.map(rule => ({
      description: rule.description,
      expression: rule.expression,
      action: 'set_cache_settings',
      action_parameters: rule.cache_control
    }));

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/rulesets/phases/http_request_cache_settings/entrypoint`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rules: rules
        }),
      }
    );

    const data = await response.json();

    if (data.success) {
      console.log('\n✅ All cache rules created successfully!');
      console.log(`\n📊 Summary:`);
      console.log(`   Total rules: ${CACHE_RULES.length}`);
      CACHE_RULES.forEach((rule, index) => {
        console.log(`   ${index + 1}. ${rule.name} (Priority: ${rule.priority})`);
      });
    } else {
      console.error('\n❌ Failed to create cache rules:');
      console.error(JSON.stringify(data.errors, null, 2));
    }
  } catch (error) {
    console.error('❌ Error creating cache rules:', error);
  }
}

async function purgeCacheAll() {
  try {
    console.log('\n🧹 Purging all Cloudflare cache...');

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          purge_everything: true
        }),
      }
    );

    const data = await response.json();

    if (data.success) {
      console.log('✅ Cache purged successfully!');
    } else {
      console.error('❌ Failed to purge cache:');
      console.error(JSON.stringify(data.errors, null, 2));
    }
  } catch (error) {
    console.error('❌ Error purging cache:', error);
  }
}

// Main execution
(async () => {
  console.log('🌩️  Cloudflare Cache Rules Configuration');
  console.log('=========================================\n');

  // List existing rules
  const existingRules = await listExistingCacheRules();

  // Ask user if they want to proceed
  if (existingRules.length > 0) {
    console.log('\n⚠️  Warning: This will replace all existing cache rules!');
    console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  // Delete existing rules and create new ones
  await deleteAllCacheRules();
  await createAllCacheRules();
  await purgeCacheAll();

  console.log('\n🎉 Configuration complete!');
  console.log('\n📊 Next steps:');
  console.log('   1. Test cache status: curl -I https://www.afriquesports.net/afrique/senegal/article');
  console.log('   2. Verify live match bypass: curl -I https://www.afriquesports.net/api/can2025/next-match');
  console.log('   3. Monitor cache hit ratio in Cloudflare Analytics (target: 85%+)');
  console.log('   4. Check Core Web Vitals improvement within 24 hours');
})();
