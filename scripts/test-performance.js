#!/usr/bin/env node

/**
 * PageSpeed Insights Performance Testing Script
 *
 * Tests 4 key pages and reports Core Web Vitals metrics
 *
 * Usage:
 *   node scripts/test-performance.js
 *
 * With API key (recommended to avoid rate limits):
 *   PAGESPEED_API_KEY=your-key node scripts/test-performance.js
 */

const https = require('https');

// Pages to test
const PAGES = [
  { name: 'Homepage', url: 'https://www.afriquesports.net/' },
  { name: 'Category Page', url: 'https://www.afriquesports.net/category/afrique/' },
  { name: 'Article Page', url: 'https://www.afriquesports.net/afrique/' },
  { name: 'Match Page', url: 'https://www.afriquesports.net/can-2025/match/732140' },
];

const API_KEY = process.env.PAGESPEED_API_KEY || '';
const DELAY_BETWEEN_TESTS = 10000; // 10 seconds to avoid rate limits

/**
 * Fetch PageSpeed Insights data for a URL
 */
function fetchPageSpeedData(url) {
  return new Promise((resolve, reject) => {
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&category=performance${API_KEY ? `&key=${API_KEY}` : ''}`;

    https.get(apiUrl, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else if (res.statusCode === 429) {
          reject(new Error('Rate limit exceeded. Please wait or add an API key.'));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Extract metrics from PageSpeed response
 */
function extractMetrics(data) {
  const lighthouse = data.lighthouseResult;
  const audits = lighthouse.audits;

  // Performance score (0-100)
  const performanceScore = Math.round(lighthouse.categories.performance.score * 100);

  // Core Web Vitals
  const lcp = audits['largest-contentful-paint']?.displayValue || 'N/A';
  const inp = audits['interaction-to-next-paint']?.displayValue || audits['max-potential-fid']?.displayValue || 'N/A';
  const cls = audits['cumulative-layout-shift']?.displayValue || 'N/A';

  // Other metrics
  const fcp = audits['first-contentful-paint']?.displayValue || 'N/A';
  const tbt = audits['total-blocking-time']?.displayValue || 'N/A';
  const tti = audits['interactive']?.displayValue || 'N/A';

  // Numeric values for Core Web Vitals
  const lcpNumeric = audits['largest-contentful-paint']?.numericValue || 0;
  const inpNumeric = audits['interaction-to-next-paint']?.numericValue || audits['max-potential-fid']?.numericValue || 0;
  const clsNumeric = audits['cumulative-layout-shift']?.numericValue || 0;

  // Rating
  const getRating = (value, goodThreshold, poorThreshold) => {
    if (value <= goodThreshold) return '✅ GOOD';
    if (value <= poorThreshold) return '⚠️  NEEDS IMPROVEMENT';
    return '❌ POOR';
  };

  const lcpRating = getRating(lcpNumeric, 2500, 4000);
  const inpRating = getRating(inpNumeric, 200, 500);
  const clsRating = getRating(clsNumeric, 0.1, 0.25);

  return {
    performanceScore,
    lcp,
    lcpRating,
    inp,
    inpRating,
    cls,
    clsRating,
    fcp,
    tbt,
    tti,
  };
}

/**
 * Format and display results
 */
function displayResults(pageName, metrics) {
  console.log('\n' + '='.repeat(60));
  console.log(`📊 ${pageName}`);
  console.log('='.repeat(60));
  console.log(`\n🎯 Performance Score: ${metrics.performanceScore}/100 ${metrics.performanceScore >= 90 ? '🟢' : metrics.performanceScore >= 50 ? '🟡' : '🔴'}`);
  console.log('\n📈 Core Web Vitals:');
  console.log(`   LCP: ${metrics.lcp} ${metrics.lcpRating}`);
  console.log(`   INP: ${metrics.inp} ${metrics.inpRating}`);
  console.log(`   CLS: ${metrics.cls} ${metrics.clsRating}`);
  console.log('\n⚡ Other Metrics:');
  console.log(`   FCP: ${metrics.fcp}`);
  console.log(`   TBT: ${metrics.tbt}`);
  console.log(`   TTI: ${metrics.tti}`);
}

/**
 * Sleep utility
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting PageSpeed Insights Performance Tests\n');
  console.log(`Testing ${PAGES.length} pages with ${DELAY_BETWEEN_TESTS/1000}s delay between tests...\n`);

  if (!API_KEY) {
    console.log('⚠️  WARNING: No API key provided. May hit rate limits.');
    console.log('   Set PAGESPEED_API_KEY environment variable to avoid this.\n');
  }

  const results = [];

  for (let i = 0; i < PAGES.length; i++) {
    const page = PAGES[i];

    try {
      console.log(`\n⏳ Testing ${page.name}...`);
      const data = await fetchPageSpeedData(page.url);
      const metrics = extractMetrics(data);

      displayResults(page.name, metrics);

      results.push({
        page: page.name,
        url: page.url,
        ...metrics,
      });

      // Wait between tests to avoid rate limits (except after last test)
      if (i < PAGES.length - 1) {
        console.log(`\n⏸️  Waiting ${DELAY_BETWEEN_TESTS/1000}s before next test...`);
        await sleep(DELAY_BETWEEN_TESTS);
      }
    } catch (error) {
      console.error(`\n❌ Error testing ${page.name}:`, error.message);

      if (error.message.includes('Rate limit')) {
        console.log('\n💡 To avoid rate limits:');
        console.log('   1. Get a free API key from: https://console.cloud.google.com/');
        console.log('   2. Enable PageSpeed Insights API');
        console.log('   3. Run: PAGESPEED_API_KEY=your-key node scripts/test-performance.js');
        break;
      }
    }
  }

  // Summary
  if (results.length > 0) {
    console.log('\n\n' + '='.repeat(60));
    console.log('📋 SUMMARY');
    console.log('='.repeat(60));

    const avgScore = Math.round(
      results.reduce((sum, r) => sum + r.performanceScore, 0) / results.length
    );

    console.log(`\n🎯 Average Performance Score: ${avgScore}/100 ${avgScore >= 90 ? '🟢' : avgScore >= 50 ? '🟡' : '🔴'}`);
    console.log('\n📊 All Results:');

    results.forEach(r => {
      console.log(`\n   ${r.page}: ${r.performanceScore}/100`);
      console.log(`      LCP: ${r.lcp} ${r.lcpRating}`);
      console.log(`      INP: ${r.inp} ${r.inpRating}`);
      console.log(`      CLS: ${r.cls} ${r.clsRating}`);
    });

    console.log('\n✅ Testing complete!\n');
  }
}

// Run tests
main().catch(console.error);
