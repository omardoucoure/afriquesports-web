#!/usr/bin/env node
/**
 * Check URL inspection for specific pages
 */

const { google } = require('googleapis');
const path = require('path');

const SITE_URL = 'sc-domain:afriquesports.net';
const CREDENTIALS_PATH = path.join(__dirname, '..', 'google-service-account.json');

// URLs to inspect
const URLS_TO_CHECK = [
  'https://www.afriquesports.net/',
  'https://www.afriquesports.net/can-2025',
  'https://www.afriquesports.net/category/can-2025',
  'https://www.afriquesports.net/foot/maroc-coupe-arabe-2025-hamdallah-victoire',
  'https://www.afriquesports.net/football/liste-du-senegal-les-deux-casse-tetes-de-pape-thiaw-pour-la-can-2025',
  'https://www.afriquesports.net/sitemap.xml',
];

async function inspectUrls() {
  console.log('='.repeat(60));
  console.log('URL INSPECTION REPORT');
  console.log('='.repeat(60));
  console.log('');

  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/webmasters'],
  });

  const searchConsole = google.searchconsole({ version: 'v1', auth });

  for (const url of URLS_TO_CHECK) {
    console.log(`\n🔍 Inspecting: ${url}`);
    console.log('-'.repeat(50));

    try {
      const response = await searchConsole.urlInspection.index.inspect({
        requestBody: {
          inspectionUrl: url,
          siteUrl: SITE_URL,
        },
      });

      const result = response.data.inspectionResult;

      if (result) {
        // Index status
        const indexStatus = result.indexStatusResult;
        if (indexStatus) {
          const verdict = indexStatus.verdict;
          const icon = verdict === 'PASS' ? '✅' : verdict === 'NEUTRAL' ? '⚠️' : '❌';
          console.log(`   Index Status: ${icon} ${verdict}`);
          console.log(`   Coverage: ${indexStatus.coverageState || 'Unknown'}`);
          console.log(`   Robots.txt: ${indexStatus.robotsTxtState || 'N/A'}`);
          console.log(`   Indexing: ${indexStatus.indexingState || 'N/A'}`);

          if (indexStatus.lastCrawlTime) {
            console.log(`   Last Crawl: ${indexStatus.lastCrawlTime}`);
          }
          if (indexStatus.pageFetchState) {
            console.log(`   Fetch State: ${indexStatus.pageFetchState}`);
          }
          if (indexStatus.googleCanonical) {
            console.log(`   Google Canonical: ${indexStatus.googleCanonical}`);
          }
          if (indexStatus.userCanonical) {
            console.log(`   User Canonical: ${indexStatus.userCanonical}`);
          }
          if (indexStatus.crawledAs) {
            console.log(`   Crawled As: ${indexStatus.crawledAs}`);
          }
        }

        // Mobile usability
        const mobileResult = result.mobileUsabilityResult;
        if (mobileResult) {
          const mobileVerdict = mobileResult.verdict;
          const mobileIcon = mobileVerdict === 'PASS' ? '✅' : '❌';
          console.log(`   Mobile Usability: ${mobileIcon} ${mobileVerdict}`);

          if (mobileResult.issues && mobileResult.issues.length > 0) {
            console.log(`   Mobile Issues:`);
            mobileResult.issues.forEach(issue => {
              console.log(`     - ${issue.issueType}: ${issue.message}`);
            });
          }
        }

        // Rich results
        const richResults = result.richResultsResult;
        if (richResults) {
          const richVerdict = richResults.verdict;
          const richIcon = richVerdict === 'PASS' ? '✅' : richVerdict === 'NEUTRAL' ? '⚠️' : '❌';
          console.log(`   Rich Results: ${richIcon} ${richVerdict}`);

          if (richResults.detectedItems && richResults.detectedItems.length > 0) {
            richResults.detectedItems.forEach(item => {
              console.log(`     - ${item.richResultType}: ${item.items?.length || 0} items`);
            });
          }
        }

        // AMP (if applicable)
        const ampResult = result.ampResult;
        if (ampResult && ampResult.verdict !== 'VERDICT_UNSPECIFIED') {
          console.log(`   AMP: ${ampResult.verdict}`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  console.log('\n');
  console.log('='.repeat(60));
  console.log('Inspection completed at:', new Date().toISOString());
  console.log('='.repeat(60));
}

inspectUrls().catch(console.error);
