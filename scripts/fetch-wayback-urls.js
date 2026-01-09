#!/usr/bin/env node
/**
 * Fetch all URLs from Wayback Machine archived sitemaps
 * This recovers URLs from before the database migration
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, '../gsc-indexed-pages.txt');

async function fetch(url, retries = 3) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; URLRecovery/1.0)' },
      timeout: 30000
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetch(res.headers.location, retries).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    });
    req.on('error', async (err) => {
      if (retries > 0) {
        await new Promise(r => setTimeout(r, 1000));
        fetch(url, retries - 1).then(resolve).catch(reject);
      } else {
        reject(err);
      }
    });
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('timeout'));
    });
  });
}

function extractUrls(xml) {
  const urls = [];
  const matches = xml.matchAll(/<loc>([^<]+)<\/loc>/g);
  for (const match of matches) {
    urls.push(match[1]);
  }
  return urls;
}

async function getArchivedSitemaps() {
  console.log('🔍 Getting list of archived sitemaps from Wayback CDX API...\n');

  const cdxUrl = 'https://web.archive.org/cdx/search/cdx?url=www.afriquesports.net/post-sitemap&matchType=prefix&output=json&filter=statuscode:200&limit=10000';
  const data = await fetch(cdxUrl);
  const results = JSON.parse(data);

  // Skip header row, get unique sitemaps with their timestamps
  const sitemapMap = new Map();
  for (let i = 1; i < results.length; i++) {
    const [urlkey, timestamp, original] = results[i];

    // Only process .xml files
    if (!original.endsWith('.xml')) continue;

    const sitemapName = original.split('/').pop();

    // Prefer timestamps from late 2023 or early 2024 (before data loss)
    const existing = sitemapMap.get(sitemapName);
    if (!existing ||
        timestamp.startsWith('2024010') ||
        timestamp.startsWith('2023101') ||
        timestamp.startsWith('2023111') ||
        timestamp.startsWith('2023121')) {
      sitemapMap.set(sitemapName, { timestamp, original });
    }
  }

  return Array.from(sitemapMap.values());
}

async function fetchSitemapUrls(sitemap) {
  try {
    const waybackUrl = `https://web.archive.org/web/${sitemap.timestamp}id_/${sitemap.original}`;
    const xml = await fetch(waybackUrl);
    return extractUrls(xml);
  } catch (err) {
    return [];
  }
}

async function main() {
  const sitemaps = await getArchivedSitemaps();
  console.log(`Found ${sitemaps.length} archived sitemaps\n`);

  const allUrls = new Set();
  let processed = 0;
  let errors = 0;

  // Process in batches of 10
  const batchSize = 10;
  for (let i = 0; i < sitemaps.length; i += batchSize) {
    const batch = sitemaps.slice(i, i + batchSize);
    const promises = batch.map(async (sitemap) => {
      try {
        const urls = await fetchSitemapUrls(sitemap);
        return urls;
      } catch (err) {
        errors++;
        return [];
      }
    });

    const results = await Promise.all(promises);

    for (const urls of results) {
      for (const url of urls) {
        // Clean and validate URL
        if (url.includes('afriquesports.net/') &&
            !url.match(/\.(jpg|png|gif|css|js|xml)$/i) &&
            !url.includes('?')) {
          allUrls.add(url.replace(/\/$/, '')); // Remove trailing slash
        }
      }
    }

    processed += batch.length;
    process.stdout.write(`\r  Progress: ${processed}/${sitemaps.length} sitemaps | ${allUrls.size} URLs found | ${errors} errors`);

    // Small delay between batches
    await new Promise(r => setTimeout(r, 300));
  }

  console.log('\n');

  // Sort and save
  const sortedUrls = Array.from(allUrls).sort();
  fs.writeFileSync(OUTPUT_FILE, sortedUrls.join('\n'));

  console.log(`✅ Done!`);
  console.log(`   Total URLs recovered: ${sortedUrls.length}`);
  console.log(`   Saved to: ${OUTPUT_FILE}`);

  // Stats by category
  const byCategory = {};
  for (const url of sortedUrls) {
    const match = url.match(/afriquesports\.net\/([^\/]+)/);
    if (match) {
      const cat = match[1];
      byCategory[cat] = (byCategory[cat] || 0) + 1;
    }
  }

  console.log('\n📁 By category (top 20):');
  Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .forEach(([cat, count]) => console.log(`   ${count.toString().padStart(6)} ${cat}`));
}

main().catch(console.error);
