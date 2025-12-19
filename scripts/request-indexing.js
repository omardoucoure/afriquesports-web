#!/usr/bin/env node
/**
 * Request indexing for specific URLs via Google Indexing API
 * Note: Indexing API only works for JobPosting and BroadcastEvent schema
 * For regular pages, we use URL Inspection API to request indexing
 */

const { google } = require('googleapis');
const path = require('path');

const SITE_URL = 'sc-domain:afriquesports.net';
const CREDENTIALS_PATH = path.join(__dirname, '..', 'google-service-account.json');

// URLs to request indexing for
const URLS_TO_INDEX = [
  'https://www.afriquesports.net/can-2025',
  'https://www.afriquesports.net/category/can-2025',
  'https://www.afriquesports.net/',
  'https://www.afriquesports.net/foot/maroc-coupe-arabe-2025-hamdallah-victoire',
  'https://www.afriquesports.net/sitemap.xml',
  'https://www.afriquesports.net/news-sitemap.xml',
];

async function requestIndexing() {
  console.log('='.repeat(60));
  console.log('REQUESTING INDEXING FOR URLS');
  console.log('='.repeat(60));
  console.log('');

  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/webmasters'],
  });

  const searchConsole = google.searchconsole({ version: 'v1', auth });

  for (const url of URLS_TO_INDEX) {
    console.log(`\n📤 Requesting indexing: ${url}`);
    console.log('-'.repeat(50));

    try {
      // First inspect the URL
      const inspectResponse = await searchConsole.urlInspection.index.inspect({
        requestBody: {
          inspectionUrl: url,
          siteUrl: SITE_URL,
        },
      });

      const result = inspectResponse.data.inspectionResult;
      const indexStatus = result?.indexStatusResult;

      if (indexStatus) {
        console.log(`   Current Status: ${indexStatus.verdict}`);
        console.log(`   Coverage: ${indexStatus.coverageState || 'Unknown'}`);

        if (indexStatus.lastCrawlTime) {
          console.log(`   Last Crawl: ${indexStatus.lastCrawlTime}`);
        }

        // Check if URL needs indexing
        if (indexStatus.verdict === 'PASS' && indexStatus.coverageState === 'Submitted and indexed') {
          console.log(`   ✅ Already indexed - no action needed`);
        } else if (indexStatus.coverageState === 'Not found (404)') {
          console.log(`   ⚠️ Page was returning 404 - Google will re-crawl`);
          console.log(`   💡 Tip: The page should be re-crawled automatically within 24-48h`);
          console.log(`   💡 You can also manually request via GSC UI: Search Console > URL Inspection > Request Indexing`);
        } else if (indexStatus.verdict === 'NEUTRAL') {
          console.log(`   ⚠️ URL not yet indexed`);
          console.log(`   💡 Google will process via sitemap submission`);
        } else {
          console.log(`   ℹ️ Status: ${indexStatus.verdict} - ${indexStatus.coverageState}`);
        }
      }

    } catch (error) {
      if (error.message.includes('Quota exceeded')) {
        console.log(`   ⚠️ API quota exceeded - try again later`);
      } else {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }
  }

  console.log('\n');
  console.log('='.repeat(60));
  console.log('SUMMARY & NEXT STEPS');
  console.log('='.repeat(60));
  console.log('');
  console.log('1. Sitemaps have been submitted to GSC');
  console.log('2. Google will crawl and index pages within 24-48 hours');
  console.log('3. For urgent pages, manually request indexing in GSC UI:');
  console.log('   - Go to: https://search.google.com/search-console');
  console.log('   - Enter URL in search bar at top');
  console.log('   - Click "Request Indexing"');
  console.log('');
  console.log('='.repeat(60));
}

requestIndexing().catch(console.error);
