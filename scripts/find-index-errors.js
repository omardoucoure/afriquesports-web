#!/usr/bin/env node
/**
 * Find actual indexing errors by checking crawled pages
 */

const { google } = require('googleapis');
const path = require('path');

const SITE_URL = 'sc-domain:afriquesports.net';
const CREDENTIALS_PATH = path.join(__dirname, '..', 'google-service-account.json');

async function findErrors() {
  console.log('='.repeat(70));
  console.log('FINDING ACTUAL INDEXING ERRORS');
  console.log('='.repeat(70));
  console.log('');

  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });

  const webmasters = google.webmasters({ version: 'v3', auth });
  const searchConsole = google.searchconsole({ version: 'v1', auth });

  // 1. Get pages with impressions but 0 clicks (might indicate issues)
  console.log('📊 PAGES WITH IMPRESSIONS BUT LOW CTR (potential issues)');
  console.log('-'.repeat(70));

  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const response = await webmasters.searchanalytics.query({
      siteUrl: SITE_URL,
      requestBody: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        dimensions: ['page'],
        rowLimit: 500,
      },
    });

    if (response.data.rows) {
      // Group by URL pattern
      const errorPatterns = {};
      const goodPages = [];
      const problematicPages = [];

      for (const row of response.data.rows) {
        const url = row.keys[0];
        const path = url.replace('https://www.afriquesports.net', '');

        // Check URL patterns that might be errors
        if (path.includes('/attachment/') ||
            path.includes('/wp-content/') ||
            path.includes('/page/') ||
            path.includes('/?') ||
            path.includes('/tag/') ||
            path.includes('/author/') ||
            path.match(/\/\d{4}\/\d{2}\/$/)) {
          problematicPages.push({ url, ...row });
        }
      }

      console.log(`\nFound ${problematicPages.length} potentially problematic pages:`);
      problematicPages.slice(0, 20).forEach(page => {
        const path = page.url.replace('https://www.afriquesports.net', '');
        console.log(`  ${path}`);
        console.log(`    Impressions: ${page.impressions}, Clicks: ${page.clicks}, Position: ${page.position?.toFixed(1)}`);
      });
    }
  } catch (error) {
    console.log('Error:', error.message);
  }

  // 2. Check for specific error-prone URLs
  console.log('\n');
  console.log('🔍 CHECKING SPECIFIC ERROR-PRONE URL PATTERNS');
  console.log('-'.repeat(70));

  // Get some real article URLs from the API to test
  try {
    const response = await fetch(
      'https://cms.realdemadrid.com/afriquesports/wp-json/wp/v2/posts?per_page=20&_fields=slug,link',
      { timeout: 10000 }
    );
    const posts = await response.json();

    console.log('\nChecking 20 recent articles:');

    let indexed = 0;
    let notIndexed = 0;
    let errors = 0;

    for (const post of posts) {
      const url = post.link.replace('http://', 'https://');

      try {
        const inspectResponse = await searchConsole.urlInspection.index.inspect({
          requestBody: {
            inspectionUrl: url,
            siteUrl: SITE_URL,
          },
        });

        const result = inspectResponse.data.inspectionResult;
        const indexStatus = result?.indexStatusResult;

        if (indexStatus?.verdict === 'PASS') {
          indexed++;
        } else if (indexStatus?.coverageState?.includes('404')) {
          console.log(`  ❌ 404: ${url}`);
          errors++;
        } else if (indexStatus?.verdict === 'FAIL') {
          console.log(`  ⚠️ ${indexStatus.coverageState}: ${url}`);
          errors++;
        } else {
          notIndexed++;
        }

        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (e) {
        // Skip errors
      }
    }

    console.log(`\n  Summary: ${indexed} indexed, ${notIndexed} not indexed, ${errors} errors`);

  } catch (error) {
    console.log('Error fetching posts:', error.message);
  }

  // 3. Check common redirect/canonical issues
  console.log('\n');
  console.log('🔀 CHECKING REDIRECT & CANONICAL ISSUES');
  console.log('-'.repeat(70));

  const canonicalTests = [
    { url: 'https://afriquesports.net/', expected: 'https://www.afriquesports.net/' },
    { url: 'https://www.afriquesports.net/category/afrique/', expected: 'https://www.afriquesports.net/category/afrique' },
  ];

  for (const test of canonicalTests) {
    try {
      const response = await searchConsole.urlInspection.index.inspect({
        requestBody: {
          inspectionUrl: test.url,
          siteUrl: SITE_URL,
        },
      });

      const result = response.data.inspectionResult;
      const indexStatus = result?.indexStatusResult;

      console.log(`\n${test.url}`);
      console.log(`  Status: ${indexStatus?.verdict}`);
      console.log(`  Coverage: ${indexStatus?.coverageState}`);
      if (indexStatus?.googleCanonical) {
        console.log(`  Google Canonical: ${indexStatus.googleCanonical}`);
      }
      if (indexStatus?.userCanonical) {
        console.log(`  User Canonical: ${indexStatus.userCanonical}`);
      }

      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (e) {
      console.log(`  Error checking ${test.url}`);
    }
  }

  console.log('\n');
  console.log('='.repeat(70));
  console.log('Completed at:', new Date().toISOString());
  console.log('='.repeat(70));
}

findErrors().catch(console.error);
