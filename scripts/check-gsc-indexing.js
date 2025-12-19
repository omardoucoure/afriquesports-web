#!/usr/bin/env node
/**
 * Check Google Search Console indexing status
 * Provides detailed analysis of site indexing
 */

const { google } = require('googleapis');
const path = require('path');

const SITE_URL = 'sc-domain:afriquesports.net';
const CREDENTIALS_PATH = path.join(__dirname, '..', 'google-service-account.json');

async function checkIndexing() {
  console.log('='.repeat(60));
  console.log('GOOGLE SEARCH CONSOLE - INDEXING REPORT');
  console.log('Site: afriquesports.net');
  console.log('Date:', new Date().toISOString().split('T')[0]);
  console.log('='.repeat(60));
  console.log('');

  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });

  const searchConsole = google.searchconsole({ version: 'v1', auth });

  // 1. Check sitemaps status
  console.log('📋 SITEMAPS STATUS');
  console.log('-'.repeat(40));

  try {
    const sitemapsResponse = await searchConsole.sitemaps.list({
      siteUrl: SITE_URL,
    });

    if (sitemapsResponse.data.sitemap) {
      for (const sitemap of sitemapsResponse.data.sitemap) {
        console.log(`\n📄 ${sitemap.path}`);
        console.log(`   Type: ${sitemap.type || 'sitemap'}`);
        console.log(`   Submitted: ${sitemap.lastSubmitted || 'N/A'}`);
        console.log(`   Downloaded: ${sitemap.lastDownloaded || 'N/A'}`);
        console.log(`   Status: ${sitemap.isPending ? '⏳ Pending' : '✅ Processed'}`);

        if (sitemap.contents) {
          for (const content of sitemap.contents) {
            console.log(`   - ${content.type}: ${content.submitted || 0} submitted, ${content.indexed || 0} indexed`);
          }
        }

        if (sitemap.warnings) {
          console.log(`   ⚠️ Warnings: ${sitemap.warnings}`);
        }
        if (sitemap.errors) {
          console.log(`   ❌ Errors: ${sitemap.errors}`);
        }
      }
    } else {
      console.log('No sitemaps found.');
    }
  } catch (error) {
    console.error('Error fetching sitemaps:', error.message);
  }

  console.log('\n');

  // 2. Get search analytics data (last 28 days)
  console.log('📊 SEARCH PERFORMANCE (Last 28 days)');
  console.log('-'.repeat(40));

  const webmasters = google.webmasters({ version: 'v3', auth });

  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 28);

    const analyticsResponse = await webmasters.searchanalytics.query({
      siteUrl: SITE_URL,
      requestBody: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        dimensions: ['date'],
        rowLimit: 28,
      },
    });

    if (analyticsResponse.data.rows) {
      let totalClicks = 0;
      let totalImpressions = 0;

      for (const row of analyticsResponse.data.rows) {
        totalClicks += row.clicks || 0;
        totalImpressions += row.impressions || 0;
      }

      const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions * 100).toFixed(2) : 0;
      const avgPosition = analyticsResponse.data.rows.reduce((sum, row) => sum + (row.position || 0), 0) / analyticsResponse.data.rows.length;

      console.log(`Total Clicks: ${totalClicks.toLocaleString()}`);
      console.log(`Total Impressions: ${totalImpressions.toLocaleString()}`);
      console.log(`Average CTR: ${avgCTR}%`);
      console.log(`Average Position: ${avgPosition.toFixed(1)}`);
    }
  } catch (error) {
    console.error('Error fetching analytics:', error.message);
  }

  console.log('\n');

  // 3. Top pages by clicks
  console.log('🔝 TOP 10 PAGES BY CLICKS');
  console.log('-'.repeat(40));

  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 28);

    const pagesResponse = await webmasters.searchanalytics.query({
      siteUrl: SITE_URL,
      requestBody: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        dimensions: ['page'],
        rowLimit: 10,
      },
    });

    if (pagesResponse.data.rows) {
      pagesResponse.data.rows.forEach((row, index) => {
        const url = row.keys[0].replace('https://www.afriquesports.net', '');
        console.log(`${index + 1}. ${url.substring(0, 60)}${url.length > 60 ? '...' : ''}`);
        console.log(`   Clicks: ${row.clicks} | Impressions: ${row.impressions} | Position: ${row.position.toFixed(1)}`);
      });
    }
  } catch (error) {
    console.error('Error fetching top pages:', error.message);
  }

  console.log('\n');

  // 4. Top queries
  console.log('🔍 TOP 10 SEARCH QUERIES');
  console.log('-'.repeat(40));

  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 28);

    const queriesResponse = await webmasters.searchanalytics.query({
      siteUrl: SITE_URL,
      requestBody: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        dimensions: ['query'],
        rowLimit: 10,
      },
    });

    if (queriesResponse.data.rows) {
      queriesResponse.data.rows.forEach((row, index) => {
        console.log(`${index + 1}. "${row.keys[0]}"`);
        console.log(`   Clicks: ${row.clicks} | Impressions: ${row.impressions} | CTR: ${(row.ctr * 100).toFixed(1)}% | Position: ${row.position.toFixed(1)}`);
      });
    }
  } catch (error) {
    console.error('Error fetching queries:', error.message);
  }

  console.log('\n');

  // 5. Performance by country
  console.log('🌍 TOP 5 COUNTRIES');
  console.log('-'.repeat(40));

  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 28);

    const countriesResponse = await webmasters.searchanalytics.query({
      siteUrl: SITE_URL,
      requestBody: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        dimensions: ['country'],
        rowLimit: 5,
      },
    });

    if (countriesResponse.data.rows) {
      countriesResponse.data.rows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.keys[0]}: ${row.clicks} clicks, ${row.impressions} impressions`);
      });
    }
  } catch (error) {
    console.error('Error fetching countries:', error.message);
  }

  console.log('\n');

  // 6. Device breakdown
  console.log('📱 DEVICE BREAKDOWN');
  console.log('-'.repeat(40));

  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 28);

    const devicesResponse = await webmasters.searchanalytics.query({
      siteUrl: SITE_URL,
      requestBody: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        dimensions: ['device'],
      },
    });

    if (devicesResponse.data.rows) {
      devicesResponse.data.rows.forEach((row) => {
        const device = row.keys[0];
        const icon = device === 'MOBILE' ? '📱' : device === 'DESKTOP' ? '💻' : '📺';
        console.log(`${icon} ${device}: ${row.clicks} clicks (${(row.ctr * 100).toFixed(1)}% CTR)`);
      });
    }
  } catch (error) {
    console.error('Error fetching devices:', error.message);
  }

  console.log('\n');
  console.log('='.repeat(60));
  console.log('Report completed at:', new Date().toISOString());
  console.log('='.repeat(60));
}

checkIndexing().catch(console.error);
