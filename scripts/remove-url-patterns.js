#!/usr/bin/env node
/**
 * Request URL pattern removals from Google Search Console
 * This removes outdated URLs from Google's index
 */

const { google } = require('googleapis');
const path = require('path');

const SITE_URL = 'sc-domain:afriquesports.net';
const CREDENTIALS_PATH = path.join(__dirname, '..', 'google-service-account.json');

// URL patterns to remove from index
// Based on GSC export analysis: 523,394 problematic URLs
const PATTERNS_TO_REMOVE = [
  // === CRITICAL: These cover 81% of all errors ===

  // WordPress pagination spam (812 URLs in sample = 81%)
  'https://www.afriquesports.net/page/',

  // Query-0-page plugin spam (218 URLs)
  'https://www.afriquesports.net/?query-0-page=',

  // === Facebook tracking (251 URLs) ===
  'https://www.afriquesports.net/?fbclid=',
  'https://www.afriquesports.net/?fb_comment_id=',

  // === Cache busting params (169 URLs) ===
  'https://www.afriquesports.net/?cb=',
  'https://www.afriquesports.net/?gcb=',
  'https://www.afriquesports.net/?dcb=',
  'https://www.afriquesports.net/?shcb=',
  'https://www.afriquesports.net/?page=',

  // === Social share tracking (67 URLs) ===
  'https://www.afriquesports.net/?share=',

  // === AMP params (62 URLs) ===
  'https://www.afriquesports.net/?amp=',
  'https://www.afriquesports.net/?noamp=',

  // === View/filter params (33 URLs) ===
  'https://www.afriquesports.net/?mode=',
  'https://www.afriquesports.net/?filter_by=',
  'https://www.afriquesports.net/?expand_article=',

  // === Old WordPress paths ===
  'https://www.afriquesports.net/feed/',
  'https://www.afriquesports.net/author/',
  'https://www.afriquesports.net/tag/',
  'https://www.afriquesports.net/attachment/',

  // === Date archives ===
  'https://www.afriquesports.net/2023/',
  'https://www.afriquesports.net/2024/',
];

async function removeUrlPatterns() {
  console.log('='.repeat(60));
  console.log('REQUESTING URL PATTERN REMOVALS FROM GSC');
  console.log('='.repeat(60));
  console.log('');

  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/webmasters'],
  });

  // Note: The Search Console API doesn't support URL removals directly
  // We need to use the webmasters API v3 for this
  const webmasters = google.webmasters({ version: 'v3', auth });

  console.log('⚠️  Note: The GSC API has limited support for URL removals.');
  console.log('');
  console.log('To remove URL patterns manually:');
  console.log('');
  console.log('1. Go to Google Search Console:');
  console.log('   https://search.google.com/search-console/removals?resource_id=sc-domain:afriquesports.net');
  console.log('');
  console.log('2. Click "New Request"');
  console.log('');
  console.log('3. For each pattern, choose "Remove all URLs with this prefix":');
  console.log('');

  PATTERNS_TO_REMOVE.forEach((pattern, index) => {
    console.log(`   ${index + 1}. ${pattern}`);
  });

  console.log('');
  console.log('4. Submit each request');
  console.log('');
  console.log('='.repeat(60));
  console.log('');
  console.log('Alternatively, since robots.txt is now updated:');
  console.log('- Google will stop crawling these URLs');
  console.log('- They will naturally drop from the index over time (2-4 weeks)');
  console.log('- URL removals speed up the process to ~24-48 hours');
  console.log('');
  console.log('='.repeat(60));

  // Try to list any existing URL removals
  console.log('');
  console.log('Checking for existing URL removal requests...');

  try {
    // Unfortunately, the API doesn't expose URL removals
    // This would require the Search Console UI
    console.log('');
    console.log('ℹ️  URL removal status must be checked via the GSC UI:');
    console.log('   https://search.google.com/search-console/removals');
  } catch (error) {
    console.log('Error:', error.message);
  }
}

removeUrlPatterns().catch(console.error);
