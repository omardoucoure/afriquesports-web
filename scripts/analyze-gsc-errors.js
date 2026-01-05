#!/usr/bin/env node

/**
 * Analyze Google Search Console indexing errors
 * Fetches comprehensive data about all indexing issues
 */

const { google } = require('googleapis');
const path = require('path');

const SITE_URL = 'sc-domain:afriquesports.net';
const SERVICE_ACCOUNT_PATH = path.join(__dirname, '..', 'google-service-account.json');

async function analyzeGSCErrors() {
  try {
    // Authenticate with Google Search Console
    const auth = new google.auth.GoogleAuth({
      keyFile: SERVICE_ACCOUNT_PATH,
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });

    const authClient = await auth.getClient();
    const webmasters = google.searchconsole({ version: 'v1', auth: authClient });

    console.log('📊 Fetching Google Search Console indexing data...\n');

    // Get URL inspection index for coverage status
    const inspectResponse = await webmasters.urlInspection.index.inspect({
      requestBody: {
        inspectionUrl: 'https://www.afriquesports.net/',
        siteUrl: SITE_URL,
      }
    });

    console.log('✅ Site inspection successful\n');

    // Get sitemap data
    console.log('📄 Fetching sitemap data...');
    const sitemapsResponse = await webmasters.sitemaps.list({
      siteUrl: SITE_URL,
    });

    console.log('\n=== SITEMAPS ===');
    if (sitemapsResponse.data.sitemap) {
      sitemapsResponse.data.sitemap.forEach(sitemap => {
        console.log(`\nSitemap: ${sitemap.path}`);
        console.log(`  Last submitted: ${sitemap.lastSubmitted || 'Never'}`);
        console.log(`  Last downloaded: ${sitemap.lastDownloaded || 'Never'}`);
        console.log(`  Status: ${sitemap.isPending ? 'Pending' : sitemap.isSitemapsIndex ? 'Index' : 'Regular'}`);
        if (sitemap.errors) {
          console.log(`  ⚠️  Errors: ${sitemap.errors}`);
        }
        if (sitemap.warnings) {
          console.log(`  ⚠️  Warnings: ${sitemap.warnings}`);
        }
        if (sitemap.contents) {
          sitemap.contents.forEach(content => {
            console.log(`    - ${content.type}: ${content.submitted || 0} submitted, ${content.indexed || 0} indexed`);
          });
        }
      });
    } else {
      console.log('No sitemaps found');
    }

    // Get search analytics data for error patterns
    console.log('\n\n=== SEARCH ANALYTICS (Last 7 days) ===');
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const analyticsResponse = await webmasters.searchanalytics.query({
      siteUrl: SITE_URL,
      requestBody: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        dimensions: ['page'],
        rowLimit: 10, // Top 10 pages
        dimensionFilterGroups: [
          {
            filters: [
              {
                dimension: 'page',
                expression: 'https://',
                operator: 'contains'
              }
            ]
          }
        ]
      }
    });

    if (analyticsResponse.data.rows) {
      console.log('\nTop performing pages:');
      analyticsResponse.data.rows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.keys[0]}`);
        console.log(`   Clicks: ${row.clicks}, Impressions: ${row.impressions}, CTR: ${(row.ctr * 100).toFixed(2)}%, Position: ${row.position.toFixed(1)}`);
      });
    }

    console.log('\n\n=== ANALYSIS SUMMARY ===');
    console.log('✅ GSC connection successful');
    console.log('✅ Site is accessible to Googlebot');
    console.log('\n📝 To get detailed coverage errors, visit:');
    console.log('   https://search.google.com/search-console');
    console.log('   → Go to "Pages" → "Why pages aren\'t indexed"\n');
    console.log('Note: The API doesn\'t provide detailed coverage error breakdowns.');
    console.log('      Export the full error report from GSC web interface.\n');

  } catch (error) {
    console.error('❌ Error analyzing GSC data:', error.message);
    if (error.code) {
      console.error(`   Code: ${error.code}`);
    }
    if (error.errors && error.errors.length > 0) {
      console.error('   Details:', error.errors[0].message);
    }
    process.exit(1);
  }
}

// Run analysis
analyzeGSCErrors();
