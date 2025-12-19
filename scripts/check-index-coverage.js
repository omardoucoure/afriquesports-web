#!/usr/bin/env node
/**
 * Check Google Search Console Index Coverage Report
 * Analyzes indexing errors and issues
 */

const { google } = require('googleapis');
const path = require('path');

const SITE_URL = 'sc-domain:afriquesports.net';
const CREDENTIALS_PATH = path.join(__dirname, '..', 'google-service-account.json');

async function checkIndexCoverage() {
  console.log('='.repeat(70));
  console.log('GOOGLE SEARCH CONSOLE - INDEX COVERAGE ANALYSIS');
  console.log('Site: afriquesports.net');
  console.log('='.repeat(70));
  console.log('');

  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });

  const webmasters = google.webmasters({ version: 'v3', auth });
  const searchConsole = google.searchconsole({ version: 'v1', auth });

  // Check sample URLs that might have issues
  const sampleUrls = [
    // Test different URL patterns
    'https://www.afriquesports.net/',
    'https://www.afriquesports.net/afrique/test-article',
    'https://www.afriquesports.net/football/test',
    'https://www.afriquesports.net/category/afrique/page/2',
    'https://www.afriquesports.net/tag/can-2025',
    'https://www.afriquesports.net/author/admin',
    'https://www.afriquesports.net/wp-content/uploads/test.jpg',
    'https://www.afriquesports.net/feed/',
    'https://www.afriquesports.net/?s=test',
    'https://www.afriquesports.net/search?q=test',
  ];

  console.log('📊 CHECKING COMMON URL PATTERNS FOR ISSUES');
  console.log('-'.repeat(70));

  for (const url of sampleUrls) {
    process.stdout.write(`${url.replace('https://www.afriquesports.net', '')}... `);

    try {
      const response = await searchConsole.urlInspection.index.inspect({
        requestBody: {
          inspectionUrl: url,
          siteUrl: SITE_URL,
        },
      });

      const result = response.data.inspectionResult;
      const indexStatus = result?.indexStatusResult;

      if (indexStatus) {
        const verdict = indexStatus.verdict;
        const coverage = indexStatus.coverageState || 'Unknown';

        if (verdict === 'PASS') {
          console.log(`✅ ${coverage}`);
        } else if (coverage.includes('404') || coverage.includes('Not found')) {
          console.log(`❌ 404 Not Found`);
        } else if (coverage.includes('noindex')) {
          console.log(`🚫 Blocked by noindex`);
        } else if (coverage.includes('robots')) {
          console.log(`🤖 Blocked by robots.txt`);
        } else if (coverage.includes('Duplicate')) {
          console.log(`📋 ${coverage}`);
        } else if (coverage.includes('Crawled')) {
          console.log(`⏳ ${coverage}`);
        } else {
          console.log(`⚠️ ${coverage}`);
        }
      }

      await new Promise(resolve => setTimeout(resolve, 300));

    } catch (error) {
      console.log(`❓ ${error.message.substring(0, 40)}`);
    }
  }

  console.log('');
  console.log('='.repeat(70));
  console.log('📋 ANALYZING SEARCH ANALYTICS FOR EXCLUDED PAGES');
  console.log('-'.repeat(70));

  // Get pages with 0 clicks that might indicate issues
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
        dimensionFilterGroups: [{
          filters: [{
            dimension: 'page',
            operator: 'contains',
            expression: 'afriquesports.net'
          }]
        }],
        rowLimit: 100,
      },
    });

    if (response.data.rows) {
      // Analyze URL patterns
      const patterns = {
        articles: 0,
        categories: 0,
        tags: 0,
        authors: 0,
        pages: 0,
        feeds: 0,
        search: 0,
        other: 0,
      };

      response.data.rows.forEach(row => {
        const url = row.keys[0];
        if (url.includes('/category/')) patterns.categories++;
        else if (url.includes('/tag/')) patterns.tags++;
        else if (url.includes('/author/')) patterns.authors++;
        else if (url.includes('/feed')) patterns.feeds++;
        else if (url.includes('/search') || url.includes('?s=')) patterns.search++;
        else if (url.match(/\/[^\/]+\/[^\/]+$/)) patterns.articles++;
        else patterns.other++;
      });

      console.log('URL patterns in search results:');
      Object.entries(patterns).forEach(([key, value]) => {
        if (value > 0) console.log(`  ${key}: ${value} pages`);
      });
    }
  } catch (error) {
    console.log('Error fetching analytics:', error.message);
  }

  console.log('');
  console.log('='.repeat(70));
  console.log('🔍 COMMON INDEXING ISSUES TO CHECK');
  console.log('-'.repeat(70));
  console.log('');
  console.log('Based on typical WordPress migration issues, check for:');
  console.log('');
  console.log('1. DUPLICATE CONTENT:');
  console.log('   - /category/xxx vs /xxx (same content, different URLs)');
  console.log('   - Pagination: /category/xxx/page/2, /page/3, etc.');
  console.log('   - www vs non-www, http vs https');
  console.log('');
  console.log('2. SOFT 404s:');
  console.log('   - Pages returning 200 but showing "not found" content');
  console.log('   - Empty category/tag pages');
  console.log('');
  console.log('3. REDIRECT ISSUES:');
  console.log('   - Old WordPress URLs not redirecting');
  console.log('   - Redirect chains (A -> B -> C)');
  console.log('');
  console.log('4. CRAWL BUDGET WASTE:');
  console.log('   - /tag/ pages (often low value)');
  console.log('   - /author/ pages');
  console.log('   - /feed/ URLs');
  console.log('   - Search result pages (?s=)');
  console.log('');
  console.log('5. BLOCKED BY ROBOTS.TXT:');
  console.log('   - Check if important pages are accidentally blocked');
  console.log('');

  console.log('='.repeat(70));
  console.log('Completed at:', new Date().toISOString());
  console.log('='.repeat(70));
}

checkIndexCoverage().catch(console.error);
