#!/usr/bin/env node
/**
 * Submit all main pages to Google Search Console for indexing
 */

const { google } = require('googleapis');
const path = require('path');

const SITE_URL = 'sc-domain:afriquesports.net';
const CREDENTIALS_PATH = path.join(__dirname, '..', 'google-service-account.json');

// All main pages to submit
const MAIN_PAGES = [
  // Homepage
  'https://www.afriquesports.net/',
  'https://www.afriquesports.net/en/',
  'https://www.afriquesports.net/es/',

  // CAN 2025
  'https://www.afriquesports.net/can-2025',
  'https://www.afriquesports.net/en/can-2025',
  'https://www.afriquesports.net/es/can-2025',
  'https://www.afriquesports.net/category/can-2025',

  // Main categories
  'https://www.afriquesports.net/category/afrique',
  'https://www.afriquesports.net/category/europe',
  'https://www.afriquesports.net/category/mercato',
  'https://www.afriquesports.net/category/football',
  'https://www.afriquesports.net/category/youtube',

  // Country pages
  'https://www.afriquesports.net/category/afrique/senegal',
  'https://www.afriquesports.net/category/afrique/cameroun',
  'https://www.afriquesports.net/category/afrique/cote-divoire',
  'https://www.afriquesports.net/category/afrique/algerie',
  'https://www.afriquesports.net/category/afrique/maroc',
  'https://www.afriquesports.net/category/afrique/nigeria',
  'https://www.afriquesports.net/category/afrique/egypte',
  'https://www.afriquesports.net/category/afrique/ghana',
  'https://www.afriquesports.net/category/afrique/mali',
  'https://www.afriquesports.net/category/afrique/rdc',
  'https://www.afriquesports.net/category/afrique/tunisie',

  // Static pages
  'https://www.afriquesports.net/classements',
  'https://www.afriquesports.net/contact',
  'https://www.afriquesports.net/confidentialite',
  'https://www.afriquesports.net/mercato',

  // Sitemaps (for discovery)
  'https://www.afriquesports.net/sitemap.xml',
  'https://www.afriquesports.net/news-sitemap.xml',
  'https://www.afriquesports.net/sitemaps/categories.xml',
  'https://www.afriquesports.net/sitemaps/pages.xml',
  'https://www.afriquesports.net/sitemaps/can-2025.xml',
];

async function submitAllPages() {
  console.log('='.repeat(60));
  console.log('SUBMITTING ALL MAIN PAGES TO GOOGLE');
  console.log('='.repeat(60));
  console.log(`Total pages to check: ${MAIN_PAGES.length}`);
  console.log('');

  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/webmasters'],
  });

  const searchConsole = google.searchconsole({ version: 'v1', auth });

  let indexed = 0;
  let notIndexed = 0;
  let errors = 0;
  const needsIndexing = [];

  for (const url of MAIN_PAGES) {
    process.stdout.write(`Checking: ${url.replace('https://www.afriquesports.net', '')}... `);

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
        if (indexStatus.verdict === 'PASS' && indexStatus.coverageState === 'Submitted and indexed') {
          console.log('✅ Indexed');
          indexed++;
        } else if (indexStatus.coverageState === 'Not found (404)') {
          console.log('❌ 404');
          notIndexed++;
          needsIndexing.push({ url, status: '404' });
        } else if (indexStatus.verdict === 'NEUTRAL') {
          console.log('⏳ Not indexed yet');
          notIndexed++;
          needsIndexing.push({ url, status: 'Not indexed' });
        } else {
          console.log(`⚠️ ${indexStatus.coverageState || indexStatus.verdict}`);
          notIndexed++;
          needsIndexing.push({ url, status: indexStatus.coverageState || indexStatus.verdict });
        }
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.log(`❌ Error: ${error.message.substring(0, 50)}`);
      errors++;
    }
  }

  console.log('');
  console.log('='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Indexed: ${indexed}`);
  console.log(`⏳ Not indexed: ${notIndexed}`);
  console.log(`❌ Errors: ${errors}`);
  console.log('');

  if (needsIndexing.length > 0) {
    console.log('Pages needing attention:');
    needsIndexing.forEach(item => {
      console.log(`  - ${item.url} (${item.status})`);
    });
  }

  console.log('');
  console.log('='.repeat(60));
  console.log('Completed at:', new Date().toISOString());
  console.log('='.repeat(60));
}

submitAllPages().catch(console.error);
