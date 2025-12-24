#!/usr/bin/env node

/**
 * Test 10 Article Detail Pages with PageSpeed Insights
 *
 * This script fetches recent articles and tests their mobile performance
 */

const https = require('https');

const API_KEY = process.env.PAGESPEED_API_KEY || '';

// Test articles - will fetch from API first, or use these as fallback
const FALLBACK_URLS = [
  'https://www.afriquesports.net/afrique/senegal-cameroun-chan-2024',
  'https://www.afriquesports.net/afrique/sadio-mane-bayern-munich',
  'https://www.afriquesports.net/afrique/mohamed-salah-liverpool',
  'https://www.afriquesports.net/europe/kylian-mbappe-real-madrid',
  'https://www.afriquesports.net/afrique/victor-osimhen-napoli',
  'https://www.afriquesports.net/mercato/transferts-africains',
  'https://www.afriquesports.net/afrique/maroc-coupe-du-monde',
  'https://www.afriquesports.net/afrique/algerie-can-2025',
  'https://www.afriquesports.net/afrique/nigeria-super-eagles',
  'https://www.afriquesports.net/afrique/cote-ivoire-elephants',
];

/**
 * Fetch recent articles from WordPress API
 */
async function fetchRecentArticles() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'www.afriquesports.net',
      path: '/wp-json/wp/v2/posts?per_page=10&_fields=slug,link',
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
      }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const posts = JSON.parse(data);
            const urls = posts.map(post => post.link);
            resolve(urls);
          } catch (e) {
            console.log('⚠️  Failed to parse articles, using fallback URLs');
            resolve(FALLBACK_URLS);
          }
        } else {
          console.log('⚠️  WordPress API unavailable, using fallback URLs');
          resolve(FALLBACK_URLS);
        }
      });
    }).on('error', () => {
      console.log('⚠️  Network error, using fallback URLs');
      resolve(FALLBACK_URLS);
    });
  });
}

/**
 * Test a URL with PageSpeed Insights
 */
function testURL(url) {
  return new Promise((resolve, reject) => {
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&category=performance${API_KEY ? `&key=${API_KEY}` : ''}`;

    https.get(apiUrl, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const result = JSON.parse(data);
            resolve(result);
          } catch (e) {
            reject(new Error('Failed to parse PageSpeed response'));
          }
        } else if (res.statusCode === 429) {
          reject(new Error('Rate limit exceeded'));
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Extract metrics from PageSpeed response
 */
function extractMetrics(data, url) {
  const lighthouse = data.lighthouseResult;
  const audits = lighthouse.audits;

  const performanceScore = Math.round(lighthouse.categories.performance.score * 100);
  const lcpNumeric = audits['largest-contentful-paint']?.numericValue || 0;
  const inpNumeric = audits['interaction-to-next-paint']?.numericValue || audits['max-potential-fid']?.numericValue || 0;
  const clsNumeric = audits['cumulative-layout-shift']?.numericValue || 0;
  const fcpNumeric = audits['first-contentful-paint']?.numericValue || 0;
  const tbtNumeric = audits['total-blocking-time']?.numericValue || 0;

  // Format values
  const lcp = (lcpNumeric / 1000).toFixed(1) + 's';
  const inp = Math.round(inpNumeric) + 'ms';
  const cls = clsNumeric.toFixed(3);
  const fcp = (fcpNumeric / 1000).toFixed(1) + 's';
  const tbt = Math.round(tbtNumeric) + 'ms';

  // Ratings
  const lcpRating = lcpNumeric <= 2500 ? '✅' : lcpNumeric <= 4000 ? '⚠️' : '❌';
  const inpRating = inpNumeric <= 200 ? '✅' : inpNumeric <= 500 ? '⚠️' : '❌';
  const clsRating = clsNumeric <= 0.1 ? '✅' : clsNumeric <= 0.25 ? '⚠️' : '❌';
  const scoreEmoji = performanceScore >= 90 ? '🟢' : performanceScore >= 50 ? '🟡' : '🔴';

  return {
    url,
    performanceScore,
    scoreEmoji,
    lcp,
    lcpRating,
    inp,
    inpRating,
    cls,
    clsRating,
    fcp,
    tbt,
  };
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
  console.log('🚀 Testing 10 Article Detail Pages with PageSpeed Insights\n');
  console.log('📱 Strategy: Mobile (Core Web Vitals)\n');

  if (!API_KEY) {
    console.log('⚠️  WARNING: No API key provided. May hit rate limits.');
    console.log('   Set PAGESPEED_API_KEY environment variable.\n');
  }

  // Fetch articles
  console.log('📝 Fetching recent articles...\n');
  const urls = await fetchRecentArticles();
  console.log(`✅ Testing ${urls.length} article pages\n`);
  console.log('='.repeat(80) + '\n');

  const results = [];
  let passed = 0;
  let failed = 0;

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const urlShort = url.replace('https://www.afriquesports.net/', '');

    try {
      console.log(`⏳ [${i + 1}/10] Testing: ${urlShort}`);
      const data = await testURL(url);
      const metrics = extractMetrics(data, url);

      console.log(`   ${metrics.scoreEmoji} Score: ${metrics.performanceScore}/100`);
      console.log(`   LCP: ${metrics.lcp} ${metrics.lcpRating}  INP: ${metrics.inp} ${metrics.inpRating}  CLS: ${metrics.cls} ${metrics.clsRating}`);
      console.log('');

      results.push(metrics);

      if (metrics.performanceScore >= 90) passed++;
      else failed++;

      // Delay between requests
      if (i < urls.length - 1) {
        await sleep(3000); // 3 second delay
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
      failed++;

      if (error.message.includes('Rate limit')) {
        console.log('⚠️  Rate limit hit. Stopping tests.\n');
        break;
      }
    }
  }

  // Summary
  console.log('='.repeat(80));
  console.log('📊 SUMMARY - Article Detail Pages');
  console.log('='.repeat(80) + '\n');

  if (results.length > 0) {
    const avgScore = Math.round(
      results.reduce((sum, r) => sum + r.performanceScore, 0) / results.length
    );

    const avgLCP = results.reduce((sum, r) => sum + parseFloat(r.lcp), 0) / results.length;
    const avgINP = results.reduce((sum, r) => sum + parseInt(r.inp), 0) / results.length;
    const avgCLS = results.reduce((sum, r) => sum + parseFloat(r.cls), 0) / results.length;

    console.log(`🎯 Average Performance Score: ${avgScore}/100 ${avgScore >= 90 ? '🟢' : avgScore >= 50 ? '🟡' : '🔴'}`);
    console.log(`📈 Average LCP: ${avgLCP.toFixed(1)}s ${avgLCP <= 2.5 ? '✅' : '❌'}`);
    console.log(`📈 Average INP: ${Math.round(avgINP)}ms ${avgINP <= 200 ? '✅' : '❌'}`);
    console.log(`📈 Average CLS: ${avgCLS.toFixed(3)} ${avgCLS <= 0.1 ? '✅' : '❌'}`);
    console.log('');
    console.log(`✅ Passed (90+): ${passed}/${results.length}`);
    console.log(`⚠️  Failed (< 90): ${failed}/${results.length}`);
    console.log('');

    // Detailed results table
    console.log('📋 Detailed Results:\n');
    results.forEach((r, i) => {
      const shortUrl = r.url.replace('https://www.afriquesports.net/', '').substring(0, 50);
      console.log(`${i + 1}. ${r.scoreEmoji} ${r.performanceScore} | LCP: ${r.lcp} ${r.lcpRating} | ${shortUrl}`);
    });
    console.log('');
  }

  console.log('✅ Testing complete!\n');
}

main().catch(console.error);
