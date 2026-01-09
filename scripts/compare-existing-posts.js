#!/usr/bin/env node
/**
 * Compare recovered URLs with existing WordPress posts
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const WP_API_BASE = 'https://cms.realdemadrid.com/afriquesports/wp-json/wp/v2';
const RECOVERED_URLS_FILE = path.join(__dirname, '../gsc-indexed-pages.txt');
const MISSING_URLS_FILE = path.join(__dirname, '../missing-posts.txt');
const EXISTING_URLS_FILE = path.join(__dirname, '../existing-posts.txt');

async function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Parse error: ${data.substring(0, 200)}`));
        }
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function fetchAllPosts() {
  console.log('📥 Fetching all existing posts from WordPress...\n');

  const allPosts = [];
  let page = 1;
  const perPage = 100;
  let hasMore = true;

  while (hasMore) {
    try {
      const url = `${WP_API_BASE}/posts?per_page=${perPage}&page=${page}&_fields=id,link,slug`;
      process.stdout.write(`\r  Fetching page ${page}...`);

      const posts = await fetch(url);

      if (!Array.isArray(posts) || posts.length === 0) {
        hasMore = false;
      } else {
        allPosts.push(...posts);
        page++;

        // Small delay
        await new Promise(r => setTimeout(r, 200));
      }
    } catch (err) {
      // WordPress returns error when no more pages
      hasMore = false;
    }
  }

  console.log(`\n✅ Found ${allPosts.length} existing posts\n`);
  return allPosts;
}

async function main() {
  // Fetch existing posts
  const existingPosts = await fetchAllPosts();

  // Extract URLs from existing posts
  const existingUrls = new Set();
  for (const post of existingPosts) {
    // Normalize URL
    let url = post.link;
    if (url) {
      // Convert cms.realdemadrid.com URL to afriquesports.net
      url = url.replace('cms.realdemadrid.com/afriquesports', 'www.afriquesports.net');
      url = url.replace(/\/$/, ''); // Remove trailing slash
      existingUrls.add(url);
    }
  }

  console.log(`📊 Existing posts with URLs: ${existingUrls.size}`);

  // Load recovered URLs
  const recoveredUrls = fs.readFileSync(RECOVERED_URLS_FILE, 'utf-8')
    .split('\n')
    .filter(url => url.trim())
    .map(url => url.replace(/\/$/, '')); // Remove trailing slash

  console.log(`📄 Recovered URLs from GSC: ${recoveredUrls.length}\n`);

  // Compare
  const missingUrls = [];
  const existingMatches = [];

  for (const url of recoveredUrls) {
    if (existingUrls.has(url)) {
      existingMatches.push(url);
    } else {
      missingUrls.push(url);
    }
  }

  // Save results
  fs.writeFileSync(MISSING_URLS_FILE, missingUrls.join('\n'));
  fs.writeFileSync(EXISTING_URLS_FILE, existingMatches.join('\n'));

  console.log('=== Comparison Results ===\n');
  console.log(`✅ Posts that EXIST: ${existingMatches.length}`);
  console.log(`❌ Posts MISSING (need regeneration): ${missingUrls.length}`);

  console.log('\n📁 Files saved:');
  console.log(`   ${MISSING_URLS_FILE} (${missingUrls.length} URLs)`);
  console.log(`   ${EXISTING_URLS_FILE} (${existingMatches.length} URLs)`);

  if (missingUrls.length > 0) {
    console.log('\n🔝 Top 20 missing URLs (by traffic priority):');
    missingUrls.slice(0, 20).forEach((url, i) => {
      const slug = url.split('/').pop();
      console.log(`   ${(i + 1).toString().padStart(2)}. ${slug.substring(0, 70)}...`);
    });
  }
}

main().catch(console.error);
