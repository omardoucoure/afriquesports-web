#!/usr/bin/env node

/**
 * Apply optimal Cloudflare configuration for Afrique Sports
 *
 * Usage:
 *   node scripts/apply-cloudflare-config.js
 *
 * Configures:
 * - Speed settings (Auto Minify, HTTP/3, Early Hints)
 * - Security settings (WAF, Bot Fight Mode)
 * - SSL/TLS settings
 * - Page Rules for caching strategy
 */

require('dotenv').config({ path: '.env.local' });

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;

if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ZONE_ID) {
  console.error('❌ Missing Cloudflare credentials in .env.local!');
  process.exit(1);
}

const API_BASE = `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}`;

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
  console.log('\n🔧 Enabling Auto Minify (JS, CSS, HTML)...');

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

async function enableHTTP3() {
  console.log('\n🔧 Enabling HTTP/3 (QUIC)...');

  try {
    await cfAPI('/settings/http3', 'PATCH', { value: 'on' });
    console.log('✅ HTTP/3 enabled');
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

async function enableBrotli() {
  console.log('\n🔧 Enabling Brotli Compression...');

  try {
    await cfAPI('/settings/brotli', 'PATCH', { value: 'on' });
    console.log('✅ Brotli enabled');
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
}

async function setSecurityLevel() {
  console.log('\n🔧 Setting Security Level to Medium...');

  try {
    await cfAPI('/settings/security_level', 'PATCH', { value: 'medium' });
    console.log('✅ Security Level set to Medium');
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
}

async function enableBotFightMode() {
  console.log('\n🔧 Enabling Bot Fight Mode...');

  try {
    await cfAPI('/settings/bot_fight_mode', 'PATCH', { value: 'on' });
    console.log('✅ Bot Fight Mode enabled');
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
}

async function enableAlwaysOnline() {
  console.log('\n🔧 Enabling Always Online...');

  try {
    await cfAPI('/settings/always_online', 'PATCH', { value: 'on' });
    console.log('✅ Always Online enabled');
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
}

async function setSSLMode() {
  console.log('\n🔧 Setting SSL/TLS mode to Full (Strict)...');

  try {
    await cfAPI('/settings/ssl', 'PATCH', { value: 'strict' });
    console.log('✅ SSL mode set to Full (Strict)');
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
}

async function enableAlwaysUseHTTPS() {
  console.log('\n🔧 Enabling Always Use HTTPS...');

  try {
    await cfAPI('/settings/always_use_https', 'PATCH', { value: 'on' });
    console.log('✅ Always Use HTTPS enabled');
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
}

async function setMinTLSVersion() {
  console.log('\n🔧 Setting Minimum TLS Version to 1.2...');

  try {
    await cfAPI('/settings/min_tls_version', 'PATCH', { value: '1.2' });
    console.log('✅ Minimum TLS Version set to 1.2');
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
}

async function enablePolish() {
  console.log('\n🔧 Enabling Polish (Lossless)...');

  try {
    await cfAPI('/settings/polish', 'PATCH', { value: 'lossless' });
    console.log('✅ Polish enabled (Lossless)');
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
}

async function createStaticAssetsPageRule() {
  console.log('\n🔧 Creating Page Rule for Static Assets...');

  try {
    const result = await cfAPI('/pagerules', 'POST', {
      targets: [
        {
          target: 'url',
          constraint: {
            operator: 'matches',
            value: 'www.afriquesports.net/_next/static/*',
          },
        },
      ],
      actions: [
        { id: 'cache_level', value: 'cache_everything' },
        { id: 'edge_cache_ttl', value: 31536000 }, // 1 year
        { id: 'browser_cache_ttl', value: 31536000 }, // 1 year
      ],
      priority: 2,
      status: 'active',
    });
    console.log(`✅ Static Assets Page Rule created (ID: ${result.id})`);
  } catch (error) {
    if (error.message.includes('already exists') || error.message.includes('Page Rule limit')) {
      console.log('⚠️  Rule already exists or limit reached');
    } else {
      console.error('❌ Failed:', error.message);
    }
  }
}

async function createImagesPageRule() {
  console.log('\n🔧 Creating Page Rule for Images...');

  try {
    const result = await cfAPI('/pagerules', 'POST', {
      targets: [
        {
          target: 'url',
          constraint: {
            operator: 'matches',
            value: 'www.afriquesports.net/*.{jpg,jpeg,png,gif,webp,avif}',
          },
        },
      ],
      actions: [
        { id: 'cache_level', value: 'cache_everything' },
        { id: 'edge_cache_ttl', value: 31536000 }, // 1 year
      ],
      priority: 3,
      status: 'active',
    });
    console.log(`✅ Images Page Rule created (ID: ${result.id})`);
  } catch (error) {
    if (error.message.includes('already exists') || error.message.includes('Page Rule limit')) {
      console.log('⚠️  Rule already exists or limit reached');
    } else {
      console.error('❌ Failed:', error.message);
    }
  }
}

async function listCurrentSettings() {
  console.log('\n📋 Current Cloudflare Settings:\n');

  try {
    const settings = await cfAPI('/settings');

    const relevant = [
      'minify', 'http3', 'early_hints', 'brotli', 'security_level',
      'bot_fight_mode', 'always_online', 'ssl', 'always_use_https',
      'min_tls_version', 'polish'
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
  console.log('🚀 Applying Optimal Cloudflare Configuration for Afrique Sports\n');
  console.log(`Zone ID: ${CLOUDFLARE_ZONE_ID}\n`);

  // Speed optimizations
  await enableAutoMinify();
  await enableHTTP3();
  await enableEarlyHints();
  await enableBrotli();

  // Security
  await setSecurityLevel();
  await enableBotFightMode();
  await enableAlwaysOnline();

  // SSL/TLS
  await setSSLMode();
  await enableAlwaysUseHTTPS();
  await setMinTLSVersion();

  // Image optimization
  await enablePolish();

  // Page Rules
  await createStaticAssetsPageRule();
  await createImagesPageRule();

  // Summary
  await listCurrentSettings();

  console.log('\n✅ Cloudflare configuration complete!');
  console.log('\n📝 Next steps:');
  console.log('   1. Verify settings in Cloudflare dashboard');
  console.log('   2. Test website performance');
  console.log('   3. Monitor cache hit ratio over 24 hours');
  console.log('   4. Review CLOUDFLARE_CONFIG.md for additional optimizations');
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
