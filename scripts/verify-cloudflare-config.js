#!/usr/bin/env node

/**
 * Verify Cloudflare Configuration
 *
 * Checks current Cloudflare settings and cache performance
 * to ensure optimization is working correctly.
 *
 * Usage:
 *   node scripts/verify-cloudflare-config.js
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env.production' });

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;

if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ZONE_ID) {
  console.error('❌ Missing Cloudflare credentials in .env.local or .env.production');
  process.exit(1);
}

const TEST_URLS = [
  {
    name: 'Live Match Endpoint',
    url: 'https://www.afriquesports.net/api/can2025/next-match',
    expectedCacheStatus: ['DYNAMIC', 'BYPASS'],
    critical: true
  },
  {
    name: 'Article Page',
    url: 'https://www.afriquesports.net/afrique/senegal/test-article',
    expectedCacheStatus: ['HIT', 'MISS', 'EXPIRED'],
    critical: false
  },
  {
    name: 'WordPress API',
    url: 'https://cms.realdemadrid.com/wp-json/wp/v2/posts?per_page=1',
    expectedCacheStatus: ['HIT', 'MISS'],
    critical: false
  },
  {
    name: 'Static Asset (CSS)',
    url: 'https://www.afriquesports.net/_next/static/css/test.css',
    expectedCacheStatus: ['HIT', 'MISS'],
    critical: false
  },
  {
    name: 'WordPress Admin',
    url: 'https://cms.realdemadrid.com/wp-admin/',
    expectedCacheStatus: ['DYNAMIC', 'BYPASS'],
    critical: true
  }
];

async function testCacheStatus(testCase) {
  try {
    const response = await fetch(testCase.url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Cloudflare-Config-Verifier/1.0'
      }
    });

    const cacheStatus = response.headers.get('cf-cache-status');
    const age = response.headers.get('age');
    const cacheControl = response.headers.get('cache-control');

    const isExpected = testCase.expectedCacheStatus.includes(cacheStatus);
    const status = isExpected ? '✅' : '❌';

    console.log(`\n${status} ${testCase.name}:`);
    console.log(`   URL: ${testCase.url}`);
    console.log(`   Cache Status: ${cacheStatus || 'NONE'} (Expected: ${testCase.expectedCacheStatus.join(' or ')})`);
    if (age) console.log(`   Age: ${age}s`);
    if (cacheControl) console.log(`   Cache-Control: ${cacheControl.substring(0, 80)}...`);

    if (!isExpected && testCase.critical) {
      console.log(`   ⚠️  CRITICAL: This endpoint must have correct cache status!`);
      return false;
    }

    return isExpected;
  } catch (error) {
    console.log(`\n❌ ${testCase.name}: FAILED`);
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function checkZoneSettings() {
  try {
    console.log('\n📋 Checking Cloudflare Zone Settings...\n');

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/settings`,
      {
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (!data.success) {
      console.error('❌ Failed to fetch zone settings');
      return;
    }

    const settings = data.result;
    const settingsMap = Object.fromEntries(settings.map(s => [s.id, s.value]));

    // Check critical settings
    const checks = {
      'HTTP/3 (QUIC)': settingsMap.http3 === 'on',
      'HTTP/2': settingsMap.http2 === 'on',
      'Brotli': settingsMap.brotli === 'on',
      'Early Hints': settingsMap.early_hints === 'on',
      'Polish': settingsMap.polish === 'lossy',
      'WebP': settingsMap.webp === 'on',
      'Rocket Loader': settingsMap.rocket_loader === 'off',
      'Mirage': settingsMap.mirage === 'off',
      'Minify JS': settingsMap.minify?.js === true,
      'Minify CSS': settingsMap.minify?.css === true,
      'Minify HTML': settingsMap.minify?.html === false, // Should be OFF for Next.js
    };

    console.log('Speed Optimization Settings:');
    Object.entries(checks).forEach(([name, isCorrect]) => {
      const status = isCorrect ? '✅' : '❌';
      console.log(`   ${status} ${name}: ${isCorrect ? 'Correct' : 'NEEDS UPDATE'}`);
    });

  } catch (error) {
    console.error('❌ Error checking zone settings:', error.message);
  }
}

async function checkCacheRules() {
  try {
    console.log('\n📋 Checking Cache Rules...\n');

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
      console.log(`✅ Found ${data.result.rules.length} cache rules:\n`);
      data.result.rules.forEach((rule, index) => {
        console.log(`${index + 1}. ${rule.description || 'Unnamed rule'}`);
        console.log(`   Expression: ${rule.expression.substring(0, 100)}...`);
        console.log(`   Action: ${rule.action}`);
        console.log('');
      });

      // Check if critical rules exist
      const ruleDescriptions = data.result.rules.map(r => r.description?.toLowerCase() || '');
      const hasLiveMatchBypass = ruleDescriptions.some(d => d.includes('live match') || d.includes('next-match'));
      const hasWpAdmin = ruleDescriptions.some(d => d.includes('wordpress admin') || d.includes('wp-admin'));
      const hasStaticAssets = ruleDescriptions.some(d => d.includes('static assets') || d.includes('static'));

      console.log('Critical Cache Rules Check:');
      console.log(`   ${hasLiveMatchBypass ? '✅' : '❌'} Live Match Bypass: ${hasLiveMatchBypass ? 'Found' : 'MISSING'}`);
      console.log(`   ${hasWpAdmin ? '✅' : '❌'} WordPress Admin Bypass: ${hasWpAdmin ? 'Found' : 'MISSING'}`);
      console.log(`   ${hasStaticAssets ? '✅' : '❌'} Static Assets Caching: ${hasStaticAssets ? 'Found' : 'MISSING'}`);

    } else {
      console.log('❌ No cache rules found!');
      console.log('   Run: node scripts/configure-cloudflare-cache-rules.js');
    }

  } catch (error) {
    console.error('❌ Error checking cache rules:', error.message);
  }
}

async function checkAnalytics() {
  try {
    console.log('\n📊 Checking Analytics (Last 24 hours)...\n');

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/analytics/dashboard?since=${yesterday.toISOString()}&until=${now.toISOString()}`,
      {
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (data.success && data.result) {
      const totals = data.result.totals;

      if (totals.requests?.all > 0) {
        const cached = totals.requests.cached || 0;
        const all = totals.requests.all;
        const cacheHitRatio = ((cached / all) * 100).toFixed(1);

        console.log('Cache Performance (24 hours):');
        console.log(`   Total Requests: ${all.toLocaleString()}`);
        console.log(`   Cached Requests: ${cached.toLocaleString()}`);
        console.log(`   Cache Hit Ratio: ${cacheHitRatio}% ${cacheHitRatio >= 85 ? '✅' : cacheHitRatio >= 70 ? '⚠️' : '❌'}`);
        console.log(`   Target: 85%+ ${cacheHitRatio >= 85 ? '(Achieved!)' : '(Needs Improvement)'}`);

        if (totals.bandwidth?.all > 0) {
          const bandwidthSaved = totals.bandwidth.cached || 0;
          const bandwidthTotal = totals.bandwidth.all;
          const bandwidthRatio = ((bandwidthSaved / bandwidthTotal) * 100).toFixed(1);
          console.log(`\n   Bandwidth Saved: ${bandwidthRatio}% ${bandwidthRatio >= 60 ? '✅' : '❌'}`);
        }
      } else {
        console.log('⚠️  No analytics data available for the last 24 hours');
        console.log('   This is normal if the site just launched or cache was recently purged');
      }
    }

  } catch (error) {
    console.error('❌ Error checking analytics:', error.message);
  }
}

// Main execution
(async () => {
  console.log('🌩️  Cloudflare Configuration Verification');
  console.log('==========================================\n');

  // Step 1: Check Zone Settings
  await checkZoneSettings();

  // Step 2: Check Cache Rules
  await checkCacheRules();

  // Step 3: Test Cache Status for Critical Endpoints
  console.log('\n🧪 Testing Cache Status for Critical Endpoints...');

  const results = await Promise.all(TEST_URLS.map(testCacheStatus));
  const allPassed = results.every(r => r);

  // Step 4: Check Analytics
  await checkAnalytics();

  // Summary
  console.log('\n==========================================');
  if (allPassed) {
    console.log('✅ All critical tests passed!');
    console.log('\n📊 Next Steps:');
    console.log('   1. Monitor cache hit ratio for 24 hours');
    console.log('   2. Test performance with PageSpeed Insights');
    console.log('   3. Verify live match data updates correctly');
    console.log('   4. Check Google Search Console for crawl errors');
  } else {
    console.log('❌ Some tests failed!');
    console.log('\n🔧 Recommended Actions:');
    console.log('   1. Run: node scripts/configure-cloudflare-cache-rules.js');
    console.log('   2. Review CLOUDFLARE_OPTIMIZATION_GUIDE.md');
    console.log('   3. Verify settings in Cloudflare Dashboard');
    console.log('   4. Re-run this verification script');
  }
})();
