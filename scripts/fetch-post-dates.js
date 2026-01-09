#!/usr/bin/env node
/**
 * Fetch original publish dates from Wayback Machine
 * Uses earliest archive date as approximate publish date
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const INPUT_FILE = path.join(__dirname, '../gsc-indexed-pages.txt');
const OUTPUT_FILE = path.join(__dirname, '../gsc-indexed-pages-with-dates.txt');

async function fetch(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 10000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('timeout'));
    });
  });
}

function parseWaybackTimestamp(ts) {
  // Format: YYYYMMDDHHmmss -> YYYY-MM-DD
  if (!ts || ts.length < 8) return null;
  return `${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)}`;
}

async function getEarliestDate(url) {
  try {
    const cdxUrl = `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(url)}&output=json&limit=1&filter=statuscode:200`;
    const data = await fetch(cdxUrl);
    const results = JSON.parse(data);

    if (results.length > 1) {
      const [, timestamp] = results[1]; // Skip header row
      return parseWaybackTimestamp(timestamp);
    }
  } catch (err) {
    // Ignore errors
  }
  return null;
}

async function main() {
  const urls = fs.readFileSync(INPUT_FILE, 'utf-8')
    .split('\n')
    .filter(url => url.trim());

  console.log(`📅 Fetching dates for ${urls.length} URLs from Wayback Machine...\n`);

  const results = [];
  let found = 0;
  let notFound = 0;

  // Process in batches
  const batchSize = 20;
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);

    const promises = batch.map(async (url) => {
      const date = await getEarliestDate(url);
      return { url, date };
    });

    const batchResults = await Promise.all(promises);

    for (const { url, date } of batchResults) {
      if (date) {
        results.push(`${date}\t${url}`);
        found++;
      } else {
        // Default to unknown date
        results.push(`unknown\t${url}`);
        notFound++;
      }
    }

    process.stdout.write(`\r  Progress: ${Math.min(i + batchSize, urls.length)}/${urls.length} | Found: ${found} | Not found: ${notFound}`);

    // Rate limit
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('\n');

  // Sort by date (newest first for unknown, then by date)
  results.sort((a, b) => {
    const dateA = a.split('\t')[0];
    const dateB = b.split('\t')[0];
    if (dateA === 'unknown') return 1;
    if (dateB === 'unknown') return -1;
    return dateB.localeCompare(dateA); // Newest first
  });

  // Save with header
  const output = `date\turl\n${results.join('\n')}`;
  fs.writeFileSync(OUTPUT_FILE, output);

  console.log(`✅ Done!`);
  console.log(`   URLs with dates: ${found}`);
  console.log(`   URLs without dates: ${notFound}`);
  console.log(`   Saved to: ${OUTPUT_FILE}`);

  // Show date distribution
  const years = {};
  for (const line of results) {
    const date = line.split('\t')[0];
    if (date !== 'unknown') {
      const year = date.slice(0, 4);
      years[year] = (years[year] || 0) + 1;
    }
  }

  console.log('\n📊 Posts by year:');
  Object.entries(years)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .forEach(([year, count]) => console.log(`   ${year}: ${count}`));
}

main().catch(console.error);
