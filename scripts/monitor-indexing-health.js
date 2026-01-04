#!/usr/bin/env node
/**
 * Indexing Health Monitoring Script
 *
 * Checks specific duplicate URLs to monitor deindexing progress.
 * Inspects sample URLs with query parameters to verify they're being deindexed.
 *
 * Usage: node scripts/monitor-indexing-health.js
 */

const { google } = require('googleapis');
const path = require('path');

const SITE_URL = 'sc-domain:afriquesports.net';
const CREDENTIALS_PATH = path.join(__dirname, '..', 'google-service-account.json');

// Sample duplicate URLs to monitor (add real URLs from your site)
const SAMPLE_DUPLICATE_URLS = [
  'https://www.afriquesports.net/afrique/senegal/some-article?query-0-page=1',
  'https://www.afriquesports.net/afrique/cameroun/another?fbclid=123456',
  'https://www.afriquesports.net/europe/france/psg?utm_source=facebook',
  'https://www.afriquesports.net/mercato/transfert?share=twitter',
];

// Sample clean URLs to verify they're indexed
const SAMPLE_CLEAN_URLS = [
  'https://www.afriquesports.net/afrique/senegal/some-article',
  'https://www.afriquesports.net/afrique/cameroun/another',
  'https://www.afriquesports.net/europe/france/psg',
];

async function checkIndexingHealth() {
  console.log('='.repeat(70));
  console.log('INDEXING HEALTH MONITORING');
  console.log('='.repeat(70));
  console.log('');

  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });

  const searchConsole = google.searchconsole({ version: 'v1', auth });

  try {
    console.log('🔍 Checking duplicate URLs (should be deindexing)...');
    console.log('');

    let deindexedCount = 0;
    let indexedCount = 0;

    for (const url of SAMPLE_DUPLICATE_URLS) {
      try {
        const result = await searchConsole.urlInspection.index.inspect({
          requestBody: {
            inspectionUrl: url,
            siteUrl: SITE_URL
          }
        });

        const verdict = result.data.inspectionResult?.indexStatusResult?.verdict || 'UNKNOWN';
        const coverageState = result.data.inspectionResult?.indexStatusResult?.coverageState || 'UNKNOWN';

        const status = verdict === 'PASS' || coverageState === 'Submitted and indexed' ? '❌ INDEXED' : '✅ NOT INDEXED';
        console.log(`  ${status}: ${url}`);
        console.log(`    Verdict: ${verdict}, Coverage: ${coverageState}`);

        if (verdict === 'PASS' || coverageState === 'Submitted and indexed') {
          indexedCount++;
        } else {
          deindexedCount++;
        }
      } catch (error) {
        console.log(`  ⚠️  ERROR checking: ${url}`);
        console.log(`    ${error.message}`);
      }
    }

    console.log('');
    console.log(`📊 Duplicate URL Status: ${deindexedCount}/${SAMPLE_DUPLICATE_URLS.length} deindexed`);
    console.log('');

    console.log('✅ Checking clean URLs (should be indexed)...');
    console.log('');

    let cleanIndexedCount = 0;

    for (const url of SAMPLE_CLEAN_URLS) {
      try {
        const result = await searchConsole.urlInspection.index.inspect({
          requestBody: {
            inspectionUrl: url,
            siteUrl: SITE_URL
          }
        });

        const verdict = result.data.inspectionResult?.indexStatusResult?.verdict || 'UNKNOWN';
        const coverageState = result.data.inspectionResult?.indexStatusResult?.coverageState || 'UNKNOWN';

        const status = verdict === 'PASS' || coverageState === 'Submitted and indexed' ? '✅ INDEXED' : '❌ NOT INDEXED';
        console.log(`  ${status}: ${url}`);
        console.log(`    Verdict: ${verdict}, Coverage: ${coverageState}`);

        if (verdict === 'PASS' || coverageState === 'Submitted and indexed') {
          cleanIndexedCount++;
        }
      } catch (error) {
        console.log(`  ⚠️  ERROR checking: ${url}`);
        console.log(`    ${error.message}`);
      }
    }

    console.log('');
    console.log(`📊 Clean URL Status: ${cleanIndexedCount}/${SAMPLE_CLEAN_URLS.length} indexed`);
    console.log('');

    // Summary
    console.log('='.repeat(70));
    console.log('SUMMARY');
    console.log('='.repeat(70));
    console.log('');

    if (deindexedCount === SAMPLE_DUPLICATE_URLS.length) {
      console.log('✅ All duplicate URLs deindexed - excellent progress!');
    } else if (deindexedCount > 0) {
      console.log(`⏳ Deindexing in progress: ${deindexedCount}/${SAMPLE_DUPLICATE_URLS.length} complete`);
    } else {
      console.log('⚠️  No duplicate URLs deindexed yet - passive deindexing takes 2-4 weeks');
    }

    if (cleanIndexedCount === SAMPLE_CLEAN_URLS.length) {
      console.log('✅ All clean URLs indexed - good!');
    } else {
      console.log(`⚠️  WARNING: ${SAMPLE_CLEAN_URLS.length - cleanIndexedCount} clean URLs not indexed`);
    }

    console.log('');
    console.log('📝 NOTES:');
    console.log('  - Passive deindexing typically takes 2-4 weeks');
    console.log('  - Update SAMPLE_DUPLICATE_URLS with actual URLs from your site');
    console.log('  - Update SAMPLE_CLEAN_URLS with your top traffic pages');
    console.log('  - Run weekly to track progress');
    console.log('');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ENOENT') {
      console.error('');
      console.error('Make sure google-service-account.json exists in the root directory.');
    } else if (error.code === 403) {
      console.error('');
      console.error('URL Inspection API may not be enabled or service account lacks permissions.');
      console.error('Try using the main dashboard script instead: node scripts/seo-cleanup-dashboard.js');
    }
    process.exit(1);
  }
}

checkIndexingHealth().catch(console.error);
