#!/usr/bin/env node
/**
 * Prioritize URLs by Google Search Console traffic data
 * Fetches clicks/impressions and sorts URLs by importance
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const SITE_URL = 'sc-domain:afriquesports.net';
const INPUT_FILE = path.join(__dirname, '../gsc-indexed-pages.txt');
const OUTPUT_FILE = path.join(__dirname, '../gsc-urls-prioritized.txt');
const CREDENTIALS_FILE = path.join(__dirname, '../google-service-account.json');

async function getSearchConsoleClient() {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf-8'));

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly']
  });

  return google.searchconsole({ version: 'v1', auth });
}

async function fetchTrafficData(searchconsole, startRow = 0) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 90); // Last 90 days

  const response = await searchconsole.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      dimensions: ['page'],
      rowLimit: 25000,
      startRow: startRow
    }
  });

  return response.data.rows || [];
}

async function main() {
  console.log('🔍 Fetching traffic data from Google Search Console...\n');

  const searchconsole = await getSearchConsoleClient();

  // Fetch all traffic data with pagination
  const allTrafficData = new Map();
  let startRow = 0;
  let hasMore = true;

  while (hasMore) {
    console.log(`  Fetching rows ${startRow} - ${startRow + 25000}...`);
    const rows = await fetchTrafficData(searchconsole, startRow);

    if (rows.length === 0) {
      hasMore = false;
    } else {
      for (const row of rows) {
        const url = row.keys[0];
        allTrafficData.set(url, {
          clicks: row.clicks || 0,
          impressions: row.impressions || 0,
          ctr: row.ctr || 0,
          position: row.position || 0
        });
      }
      startRow += 25000;

      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 500));
    }
  }

  console.log(`\n✅ Fetched traffic data for ${allTrafficData.size} URLs\n`);

  // Load our URL list
  const ourUrls = fs.readFileSync(INPUT_FILE, 'utf-8')
    .split('\n')
    .filter(url => url.trim());

  console.log(`📄 Our URL list has ${ourUrls.length} URLs\n`);

  // Match and prioritize
  const prioritizedUrls = [];
  let matchedCount = 0;
  let unmatchedCount = 0;

  for (const url of ourUrls) {
    const traffic = allTrafficData.get(url);
    if (traffic) {
      matchedCount++;
      prioritizedUrls.push({
        url,
        clicks: traffic.clicks,
        impressions: traffic.impressions,
        ctr: traffic.ctr,
        position: traffic.position,
        // Priority score: clicks * 10 + impressions * 0.01
        score: traffic.clicks * 10 + traffic.impressions * 0.01
      });
    } else {
      unmatchedCount++;
      // URLs without traffic data get score 0
      prioritizedUrls.push({
        url,
        clicks: 0,
        impressions: 0,
        ctr: 0,
        position: 0,
        score: 0
      });
    }
  }

  // Sort by score (highest first)
  prioritizedUrls.sort((a, b) => b.score - a.score);

  // Save prioritized list
  const output = prioritizedUrls.map(u => u.url).join('\n');
  fs.writeFileSync(OUTPUT_FILE, output);

  // Save with metrics for analysis
  const metricsOutput = prioritizedUrls
    .map(u => `${u.clicks}\t${u.impressions}\t${u.url}`)
    .join('\n');
  fs.writeFileSync(OUTPUT_FILE.replace('.txt', '-with-metrics.txt'),
    `clicks\timpressions\turl\n${metricsOutput}`);

  console.log('📊 Results:');
  console.log(`   URLs with traffic data: ${matchedCount}`);
  console.log(`   URLs without traffic: ${unmatchedCount}`);
  console.log(`   Total: ${prioritizedUrls.length}`);

  console.log('\n🏆 Top 20 URLs by traffic:');
  prioritizedUrls.slice(0, 20).forEach((u, i) => {
    console.log(`   ${(i + 1).toString().padStart(2)}. ${u.clicks} clicks | ${u.impressions} imp | ${u.url.substring(30, 90)}...`);
  });

  console.log(`\n✅ Saved to:`);
  console.log(`   ${OUTPUT_FILE}`);
  console.log(`   ${OUTPUT_FILE.replace('.txt', '-with-metrics.txt')}`);
}

main().catch(console.error);
