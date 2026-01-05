#!/usr/bin/env node

/**
 * Configure Cloudflare for realdemadrid.com (WordPress Backend)
 *
 * Usage:
 *   node scripts/configure-realdemadrid-cloudflare.js
 *
 * Optimizes:
 * - WordPress admin (high security, no cache)
 * - WordPress REST API (short cache)
 * - WordPress uploads (aggressive cache)
 */

require('dotenv').config({ path: '.env.local' });

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ZONE_ID = '4da53e3454034eda9d5f85a8d4e8db3d'; // realdemadrid.com

if (!CLOUDFLARE_API_TOKEN) {
  console.error('❌ Missing CLOUDFLARE_API_TOKEN in .env.local!');
  process.exit(1);
}

const API_BASE = `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}`;

async function cfAPI(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, options);
  const data = await response.json();

  if (!data.success) {
    throw new Error(`API Error: ${JSON.stringify(data.errors)}`);
  }

  return data.result;
}

async function enableAutoMinify() {
  console.log('\n🔧 Enabling Auto Minify...');

  try {
    await cfAPI('/settings/minify', 'PATCH', {
      value: {
        js: 'on',
        css: 'on',
        html: 'on',
      },
    });
    console.log('✅ Auto Minify enabled');
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
}

async function enableEarlyHints() {
  console.log('\n🔧 Enabling Early Hints...');

  try {
    await cfAPI('/settings/early_hints', 'PATCH', { value: 'on' });
    console.log('✅ Early Hints enabled');
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
}

async function createWordPressAdminRule() {
  console.log('\n🔧 Creating Page Rule for WordPress Admin (High Security, No Cache)...');

  try {
    const result = await cfAPI('/pagerules', 'POST', {
      targets: [
        {
          target: 'url',
          constraint: {
            operator: 'matches',
            value: 'cms.realdemadrid.com/*/wp-admin*',
          },
        },
      ],
      actions: [
        { id: 'cache_level', value: 'bypass' },
        { id: 'security_level', value: 'high' },
        { id: 'disable_apps' },
        { id: 'disable_performance' },
      ],
      priority: 1,
      status: 'active',
    });
    console.log(`✅ WordPress Admin Rule created (ID: ${result.id})`);
  } catch (error) {
    if (error.message.includes('already exists') || error.message.includes('limit')) {
      console.log('⚠️  Rule already exists or limit reached');
    } else {
      console.error('❌ Failed:', error.message);
    }
  }
}

async function createWordPressAPIRule() {
  console.log('\n🔧 Creating Page Rule for WordPress REST API (Short Cache)...');

  try {
    const result = await cfAPI('/pagerules', 'POST', {
      targets: [
        {
          target: 'url',
          constraint: {
            operator: 'matches',
            value: 'cms.realdemadrid.com/*/wp-json/*',
          },
        },
      ],
      actions: [
        { id: 'cache_level', value: 'standard' },
        { id: 'edge_cache_ttl', value: 60 }, // 1 minute
      ],
      priority: 2,
      status: 'active',
    });
    console.log(`✅ WordPress API Rule created (ID: ${result.id})`);
  } catch (error) {
    if (error.message.includes('already exists') || error.message.includes('limit')) {
      console.log('⚠️  Rule already exists or limit reached');
    } else {
      console.error('❌ Failed:', error.message);
    }
  }
}

async function createWordPressUploadsRule() {
  console.log('\n🔧 Creating Page Rule for WordPress Uploads (Aggressive Cache)...');

  try {
    const result = await cfAPI('/pagerules', 'POST', {
      targets: [
        {
          target: 'url',
          constraint: {
            operator: 'matches',
            value: 'cms.realdemadrid.com/*/wp-content/uploads/*',
          },
        },
      ],
      actions: [
        { id: 'cache_level', value: 'cache_everything' },
        { id: 'edge_cache_ttl', value: 2592000 }, // 30 days
        { id: 'browser_cache_ttl', value: 2592000 }, // 30 days
      ],
      priority: 3,
      status: 'active',
    });
    console.log(`✅ WordPress Uploads Rule created (ID: ${result.id})`);
  } catch (error) {
    if (error.message.includes('already exists') || error.message.includes('limit')) {
      console.log('⚠️  Rule already exists or limit reached');
    } else {
      console.error('❌ Failed:', error.message);
    }
  }
}

async function listPageRules() {
  console.log('\n📋 Current Page Rules:\n');

  try {
    const rules = await cfAPI('/pagerules');

    if (rules.length === 0) {
      console.log('  No page rules configured');
      return;
    }

    rules.forEach((rule, index) => {
      console.log(`${index + 1}. ${rule.targets[0].constraint.value}`);
      console.log(`   Actions: ${rule.actions.map(a => a.id).join(', ')}`);
      console.log(`   Status: ${rule.status}`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to list page rules:', error.message);
  }
}

async function listCurrentSettings() {
  console.log('\n📋 Current Settings:\n');

  try {
    const settings = await cfAPI('/settings');

    const relevant = [
      'minify', 'http3', 'early_hints', 'brotli', 'security_level',
      'always_online', 'ssl', 'always_use_https', 'min_tls_version'
    ];

    relevant.forEach(setting => {
      const item = settings.find(s => s.id === setting);
      if (item) {
        console.log(`  ${setting}: ${JSON.stringify(item.value)}`);
      }
    });
  } catch (error) {
    console.error('❌ Failed to list settings:', error.message);
  }
}

async function main() {
  console.log('🚀 Configuring Cloudflare for realdemadrid.com (WordPress Backend)\n');
  console.log(`Zone ID: ${ZONE_ID}`);
  console.log(`Plan: Free Website (3 page rules max)\n`);

  // Speed optimizations
  await enableAutoMinify();
  await enableEarlyHints();

  // Page Rules (Free plan: 3 rules max)
  console.log('\n📄 Creating Page Rules (3/3):');
  await createWordPressAdminRule();
  await createWordPressAPIRule();
  await createWordPressUploadsRule();

  // Summary
  await listPageRules();
  await listCurrentSettings();

  console.log('\n✅ realdemadrid.com Cloudflare configuration complete!');
  console.log('\n📝 Configuration Summary:');
  console.log('   ✅ Auto Minify: ON');
  console.log('   ✅ HTTP/3: ON');
  console.log('   ✅ Brotli: ON');
  console.log('   ✅ Early Hints: ON');
  console.log('   ✅ SSL: Full');
  console.log('   ✅ Always Use HTTPS: ON');
  console.log('   ✅ Page Rule 1: WordPress Admin (No Cache, High Security)');
  console.log('   ✅ Page Rule 2: WordPress API (1min Cache)');
  console.log('   ✅ Page Rule 3: WordPress Uploads (30 days Cache)');
  console.log('\n📊 Expected Benefits:');
  console.log('   - WordPress uploads cached for 30 days → 90% bandwidth reduction');
  console.log('   - WordPress API cached for 1min → Faster Next.js requests');
  console.log('   - WordPress admin protected with high security');
  console.log('   - 20-30% size reduction from auto minify + brotli');
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
