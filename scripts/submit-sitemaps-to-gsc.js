#!/usr/bin/env node
/**
 * Submit sitemaps to Google Search Console
 *
 * Usage: node scripts/submit-sitemaps-to-gsc.js
 */

const { google } = require('googleapis');
const path = require('path');

// Use domain property format (sc-domain:) instead of URL prefix
const SITE_URL = 'sc-domain:afriquesports.net';
const CREDENTIALS_PATH = path.join(__dirname, '..', 'google-service-account.json');

const SITEMAPS_TO_SUBMIT = [
  'https://www.afriquesports.net/sitemap.xml',
  'https://www.afriquesports.net/news-sitemap.xml',
  'https://www.afriquesports.net/video-sitemap.xml',
];

async function submitSitemaps() {
  console.log('Authenticating with Google Search Console API...\n');

  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/webmasters'],
  });

  const searchConsole = google.searchconsole({ version: 'v1', auth });

  console.log(`Site: ${SITE_URL}\n`);
  console.log('Submitting sitemaps...\n');

  for (const feedpath of SITEMAPS_TO_SUBMIT) {

    try {
      await searchConsole.sitemaps.submit({
        siteUrl: SITE_URL,
        feedpath: feedpath,
      });
      console.log(`✅ Submitted: ${feedpath}`);
    } catch (error) {
      console.error(`❌ Failed to submit ${feedpath}:`, error.message);
    }
  }

  console.log('\n--- Listing current sitemaps ---\n');

  try {
    const response = await searchConsole.sitemaps.list({
      siteUrl: SITE_URL,
    });

    if (response.data.sitemap) {
      for (const sitemap of response.data.sitemap) {
        console.log(`📄 ${sitemap.path}`);
        console.log(`   Last submitted: ${sitemap.lastSubmitted || 'N/A'}`);
        console.log(`   Last downloaded: ${sitemap.lastDownloaded || 'N/A'}`);
        console.log(`   Status: ${sitemap.isPending ? 'Pending' : 'Processed'}`);
        console.log('');
      }
    } else {
      console.log('No sitemaps found in GSC.');
    }
  } catch (error) {
    console.error('Failed to list sitemaps:', error.message);
  }
}

submitSitemaps().catch(console.error);
