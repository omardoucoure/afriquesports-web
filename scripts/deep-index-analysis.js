#!/usr/bin/env node
/**
 * Deep analysis of indexing issues
 * Checks various URL patterns to identify problems
 */

const { google } = require('googleapis');
const path = require('path');

const SITE_URL = 'sc-domain:afriquesports.net';
const CREDENTIALS_PATH = path.join(__dirname, '..', 'google-service-account.json');

// Common problematic URL patterns to check
const URL_PATTERNS = {
  // Old WordPress patterns that might be indexed
  'Old WordPress feeds': [
    'https://www.afriquesports.net/feed/',
    'https://www.afriquesports.net/feed/rss/',
    'https://www.afriquesports.net/feed/atom/',
    'https://www.afriquesports.net/comments/feed/',
  ],

  'Author pages': [
    'https://www.afriquesports.net/author/admin/',
    'https://www.afriquesports.net/author/afriquesports/',
  ],

  'Tag pages': [
    'https://www.afriquesports.net/tag/can-2025/',
    'https://www.afriquesports.net/tag/senegal/',
    'https://www.afriquesports.net/tag/football/',
  ],

  'Pagination': [
    'https://www.afriquesports.net/page/2/',
    'https://www.afriquesports.net/page/3/',
    'https://www.afriquesports.net/category/afrique/page/2/',
    'https://www.afriquesports.net/category/afrique/page/10/',
  ],

  'Search pages': [
    'https://www.afriquesports.net/?s=test',
    'https://www.afriquesports.net/search/',
    'https://www.afriquesports.net/search?q=test',
  ],

  'Archive pages': [
    'https://www.afriquesports.net/2024/',
    'https://www.afriquesports.net/2024/12/',
    'https://www.afriquesports.net/2025/01/',
  ],

  'Media/Attachment': [
    'https://www.afriquesports.net/wp-content/uploads/2024/12/',
    'https://www.afriquesports.net/attachment/',
  ],

  'API endpoints': [
    'https://www.afriquesports.net/wp-json/',
    'https://www.afriquesports.net/api/',
    'https://www.afriquesports.net/xmlrpc.php',
  ],

  'Old WP admin': [
    'https://www.afriquesports.net/wp-admin/',
    'https://www.afriquesports.net/wp-login.php',
  ],

  'Duplicate content patterns': [
    'https://afriquesports.net/',  // without www
    'http://www.afriquesports.net/',  // http
  ],
};

async function deepAnalysis() {
  console.log('='.repeat(70));
  console.log('DEEP INDEX ANALYSIS - FINDING PROBLEMATIC URLS');
  console.log('='.repeat(70));
  console.log('');

  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/webmasters'],
  });

  const searchConsole = google.searchconsole({ version: 'v1', auth });

  const issues = {
    indexed_but_should_not: [],
    not_found_404: [],
    blocked_noindex: [],
    blocked_robots: [],
    redirect_issues: [],
    soft_404: [],
    duplicate: [],
    other: [],
  };

  for (const [category, urls] of Object.entries(URL_PATTERNS)) {
    console.log(`\n📂 ${category}`);
    console.log('-'.repeat(50));

    for (const url of urls) {
      const shortUrl = url.replace('https://www.afriquesports.net', '').replace('https://afriquesports.net', '(no-www)').replace('http://www.afriquesports.net', '(http)');
      process.stdout.write(`  ${shortUrl}... `);

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
          const crawledAs = indexStatus.crawledAs;

          if (verdict === 'PASS' && coverage.includes('indexed')) {
            // Check if this should be indexed
            if (url.includes('/feed') || url.includes('/wp-admin') || url.includes('/wp-json') ||
                url.includes('xmlrpc') || url.includes('/author/') || url.includes('/?s=')) {
              console.log(`⚠️ INDEXED (should block!)`);
              issues.indexed_but_should_not.push({ url, coverage });
            } else {
              console.log(`✅ Indexed`);
            }
          } else if (coverage.includes('404') || coverage.includes('Not found')) {
            console.log(`❌ 404`);
            issues.not_found_404.push({ url, coverage });
          } else if (coverage.includes('noindex')) {
            console.log(`🚫 noindex (good)`);
            issues.blocked_noindex.push({ url, coverage });
          } else if (coverage.includes('robots')) {
            console.log(`🤖 robots.txt`);
            issues.blocked_robots.push({ url, coverage });
          } else if (coverage.includes('Redirect')) {
            console.log(`↪️ Redirect`);
            issues.redirect_issues.push({ url, coverage });
          } else if (coverage.includes('Soft 404')) {
            console.log(`⚠️ Soft 404`);
            issues.soft_404.push({ url, coverage });
          } else if (coverage.includes('Duplicate')) {
            console.log(`📋 Duplicate`);
            issues.duplicate.push({ url, coverage });
          } else if (verdict === 'NEUTRAL' && coverage === 'URL is unknown to Google') {
            console.log(`❓ Unknown (OK)`);
          } else {
            console.log(`⚠️ ${coverage}`);
            issues.other.push({ url, coverage });
          }
        }

        await new Promise(resolve => setTimeout(resolve, 400));

      } catch (error) {
        console.log(`❓ Error`);
      }
    }
  }

  // Summary
  console.log('\n');
  console.log('='.repeat(70));
  console.log('ISSUES SUMMARY');
  console.log('='.repeat(70));

  if (issues.indexed_but_should_not.length > 0) {
    console.log('\n🔴 CRITICAL: Pages indexed that should be blocked:');
    issues.indexed_but_should_not.forEach(i => console.log(`   - ${i.url}`));
    console.log('\n   ACTION: Add these to robots.txt or add noindex meta tag');
  }

  if (issues.not_found_404.length > 0) {
    console.log('\n🟠 404 Errors (Google tried to crawl but page not found):');
    issues.not_found_404.forEach(i => console.log(`   - ${i.url}`));
    console.log('\n   ACTION: Either create these pages or add 301 redirects');
  }

  if (issues.soft_404.length > 0) {
    console.log('\n🟡 Soft 404s (Page loads but shows error content):');
    issues.soft_404.forEach(i => console.log(`   - ${i.url}`));
    console.log('\n   ACTION: Return proper 404 status or add content');
  }

  if (issues.duplicate.length > 0) {
    console.log('\n🔵 Duplicate content issues:');
    issues.duplicate.forEach(i => console.log(`   - ${i.url}: ${i.coverage}`));
    console.log('\n   ACTION: Set canonical URLs or 301 redirect');
  }

  if (issues.redirect_issues.length > 0) {
    console.log('\n↪️ Redirect issues:');
    issues.redirect_issues.forEach(i => console.log(`   - ${i.url}: ${i.coverage}`));
  }

  console.log('\n');
  console.log('='.repeat(70));
  console.log('Completed at:', new Date().toISOString());
  console.log('='.repeat(70));
}

deepAnalysis().catch(console.error);
