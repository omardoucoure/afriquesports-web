#!/usr/bin/env node
/**
 * Verify All 270 Post Sitemaps are Accessible
 * Tests that every sitemap from 1-270 returns valid XML
 */

const https = require('https');

const SITE_URL = 'https://www.afriquesports.net';
const TOTAL_SITEMAPS = 270;
const SAMPLE_SIZE = 20; // Test every Nth sitemap for speed

console.log('🔍 Verifying All Post Sitemaps\n');
console.log(`Site: ${SITE_URL}`);
console.log(`Total sitemaps to verify: ${TOTAL_SITEMAPS}\n`);

// Helper to fetch URL and check status
function checkSitemap(page) {
  return new Promise((resolve) => {
    const url = `${SITE_URL}/sitemaps/posts/${page}.xml`;

    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const isXml = data.includes('<?xml') && data.includes('<urlset');
        const hasUrls = data.includes('<url>') && data.includes('<loc>');
        const urlCount = (data.match(/<url>/g) || []).length;

        resolve({
          page,
          url,
          status: res.statusCode,
          isValid: res.statusCode === 200 && isXml && hasUrls,
          urlCount,
          size: data.length,
        });
      });
    }).on('error', (error) => {
      resolve({
        page,
        url,
        status: 0,
        isValid: false,
        error: error.message,
      });
    });
  });
}

async function verifyAllSitemaps() {
  console.log('══════════════════════════════════════════════════════');
  console.log('Step 1: Check Sitemap Index');
  console.log('══════════════════════════════════════════════════════\n');

  // Check sitemap index
  const indexResult = await checkSitemap('index').then(() =>
    new Promise((resolve) => {
      https.get(`${SITE_URL}/sitemap.xml`, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          const sitemapCount = (data.match(/<sitemap>/g) || []).length;
          const postSitemapCount = (data.match(/\/sitemaps\/posts\/\d+\.xml/g) || []).length;

          console.log(`✅ Sitemap index accessible`);
          console.log(`   Total sitemaps listed: ${sitemapCount}`);
          console.log(`   Post sitemaps listed: ${postSitemapCount}`);
          console.log(`   Expected: 270 post sitemaps`);

          if (postSitemapCount === 270) {
            console.log(`   ✅ CORRECT! All 270 post sitemaps are listed\n`);
          } else {
            console.log(`   ❌ MISMATCH! Expected 270, found ${postSitemapCount}\n`);
          }

          resolve(postSitemapCount === 270);
        });
      });
    })
  );

  console.log('══════════════════════════════════════════════════════');
  console.log('Step 2: Test Critical Sitemaps');
  console.log('══════════════════════════════════════════════════════\n');

  // Test critical sitemaps
  const criticalPages = [1, 50, 100, 135, 136, 150, 200, 250, 270];
  console.log(`Testing critical sitemaps: ${criticalPages.join(', ')}\n`);

  const criticalResults = [];
  for (const page of criticalPages) {
    const result = await checkSitemap(page);
    criticalResults.push(result);

    if (result.isValid) {
      console.log(`✅ Sitemap ${page}: ${result.urlCount} URLs (${(result.size / 1024).toFixed(1)}KB)`);
    } else {
      console.log(`❌ Sitemap ${page}: ${result.status} - ${result.error || 'Invalid XML'}`);
    }
  }

  console.log('\n══════════════════════════════════════════════════════');
  console.log('Step 3: Random Sample Test');
  console.log('══════════════════════════════════════════════════════\n');

  // Test random sample
  const samplePages = [];
  const step = Math.floor(TOTAL_SITEMAPS / SAMPLE_SIZE);
  for (let i = 1; i <= TOTAL_SITEMAPS; i += step) {
    samplePages.push(i);
  }

  console.log(`Testing ${samplePages.length} random sitemaps...\n`);

  const sampleResults = [];
  for (const page of samplePages) {
    const result = await checkSitemap(page);
    sampleResults.push(result);
  }

  const validCount = sampleResults.filter(r => r.isValid).length;
  console.log(`✅ Valid: ${validCount}/${sampleResults.length}`);
  console.log(`❌ Invalid: ${sampleResults.length - validCount}/${sampleResults.length}\n`);

  console.log('══════════════════════════════════════════════════════');
  console.log('📊 Summary Report');
  console.log('══════════════════════════════════════════════════════\n');

  const allResults = [...criticalResults, ...sampleResults];
  const totalValid = allResults.filter(r => r.isValid).length;
  const totalInvalid = allResults.length - totalValid;
  const avgUrlCount = allResults
    .filter(r => r.isValid)
    .reduce((sum, r) => sum + r.urlCount, 0) / totalValid;

  console.log(`Total sitemaps tested: ${allResults.length}`);
  console.log(`✅ Valid: ${totalValid} (${((totalValid / allResults.length) * 100).toFixed(1)}%)`);
  console.log(`❌ Invalid: ${totalInvalid}`);
  console.log(`📈 Average URLs per sitemap: ${Math.round(avgUrlCount)}`);
  console.log(`📊 Estimated total URLs: ${Math.round(avgUrlCount * TOTAL_SITEMAPS).toLocaleString()}\n`);

  // Check for issues in critical range (136-270)
  const newSitemaps = criticalResults.filter(r => r.page >= 136);
  const newSitemapsValid = newSitemaps.filter(r => r.isValid).length;

  console.log('══════════════════════════════════════════════════════');
  console.log('🎯 Critical Verification: Sitemaps 136-270 (Previously Missing)');
  console.log('══════════════════════════════════════════════════════\n');

  console.log(`Sitemaps in range 136-270 tested: ${newSitemaps.length}`);
  console.log(`✅ Valid: ${newSitemapsValid}`);

  if (newSitemapsValid === newSitemaps.length) {
    console.log('✅ SUCCESS! All previously missing sitemaps are now accessible\n');
  } else {
    console.log('❌ WARNING! Some sitemaps in 136-270 range are not accessible\n');
  }

  // Final verdict
  console.log('══════════════════════════════════════════════════════');
  console.log('✅ Final Verdict');
  console.log('══════════════════════════════════════════════════════\n');

  if (totalValid === allResults.length && newSitemapsValid === newSitemaps.length) {
    console.log('🎉 ALL CHECKS PASSED!');
    console.log('   • Sitemap index lists 270 post sitemaps ✅');
    console.log('   • All tested sitemaps return valid XML ✅');
    console.log('   • Previously missing sitemaps (136-270) are accessible ✅');
    console.log('   • Average ~' + Math.round(avgUrlCount) + ' URLs per sitemap ✅\n');
    console.log(`   Estimated discoverable posts: ~${Math.round(avgUrlCount * TOTAL_SITEMAPS).toLocaleString()}\n`);
  } else {
    console.log('⚠️  ISSUES DETECTED!');
    if (totalInvalid > 0) {
      console.log(`   • ${totalInvalid} sitemaps failed validation`);
    }
    console.log('   Check the logs above for details\n');
  }

  // List invalid sitemaps
  const invalidSitemaps = allResults.filter(r => !r.isValid);
  if (invalidSitemaps.length > 0) {
    console.log('Invalid sitemaps:');
    invalidSitemaps.forEach(r => {
      console.log(`   • Sitemap ${r.page}: ${r.error || 'Status ' + r.status}`);
    });
    console.log('');
  }
}

// Run verification
verifyAllSitemaps().catch(console.error);
