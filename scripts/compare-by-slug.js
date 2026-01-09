#!/usr/bin/env node
/**
 * Compare recovered URLs with existing WordPress posts by slug
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const WP_API_BASE = 'https://cms.realdemadrid.com/afriquesports/wp-json/wp/v2';
const RECOVERED_URLS_FILE = path.join(__dirname, '../gsc-indexed-pages.txt');

async function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Parse error`));
        }
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function fetchAllSlugs() {
  console.log('📥 Fetching all slugs from WordPress...\n');

  const allSlugs = new Set();
  let page = 1;
  const perPage = 100;
  let hasMore = true;

  while (hasMore) {
    try {
      const url = `${WP_API_BASE}/posts?per_page=${perPage}&page=${page}&_fields=slug`;
      process.stdout.write(`\r  Page ${page}...`);

      const posts = await fetch(url);

      if (!Array.isArray(posts) || posts.length === 0) {
        hasMore = false;
      } else {
        posts.forEach(p => allSlugs.add(p.slug));
        page++;
        await new Promise(r => setTimeout(r, 100));
      }
    } catch (err) {
      hasMore = false;
    }
  }

  console.log(`\n✅ Found ${allSlugs.size} existing slugs\n`);
  return allSlugs;
}

async function main() {
  const existingSlugs = await fetchAllSlugs();

  // Load recovered URLs and extract slugs
  const recoveredUrls = fs.readFileSync(RECOVERED_URLS_FILE, 'utf-8')
    .split('\n')
    .filter(url => url.trim());

  console.log(`📄 Recovered URLs: ${recoveredUrls.length}\n`);

  // Compare by slug
  const existing = [];
  const missing = [];

  for (const url of recoveredUrls) {
    const slug = url.split('/').pop();
    if (existingSlugs.has(slug)) {
      existing.push(url);
    } else {
      missing.push(url);
    }
  }

  // Save results
  fs.writeFileSync(path.join(__dirname, '../missing-posts.txt'), missing.join('\n'));
  fs.writeFileSync(path.join(__dirname, '../existing-posts.txt'), existing.join('\n'));

  console.log('=== Results ===\n');
  console.log(`✅ Posts EXIST (slug match): ${existing.length}`);
  console.log(`❌ Posts MISSING: ${missing.length}`);

  if (existing.length > 0) {
    console.log('\n📋 Sample existing:');
    existing.slice(0, 5).forEach(u => console.log(`   ${u.split('/').pop().substring(0, 60)}...`));
  }

  if (missing.length > 0) {
    console.log('\n📋 Top missing (by traffic):');
    missing.slice(0, 10).forEach((u, i) => console.log(`   ${i + 1}. ${u.split('/').pop().substring(0, 60)}...`));
  }
}

main().catch(console.error);
