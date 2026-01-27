#!/usr/bin/env node

/**
 * Cleanup locale WordPress posts
 *
 * Deletes all existing posts from a target locale WordPress instance.
 * URLs are configured via environment variables in .env.local
 *
 * Usage:
 *   node scripts/cleanup-en-posts.js [--dry-run] [--locale=en|es|ar]
 */

require('dotenv').config({ path: '.env.local' });

const LOCALES = {
  en: {
    envKey: 'WP_EN_API_URL',
    label: 'English',
  },
  es: {
    envKey: 'WP_ES_API_URL',
    label: 'Spanish',
  },
  ar: {
    envKey: 'WP_AR_API_URL',
    label: 'Arabic',
  },
};

const WP_USERNAME = process.env.WP_USERNAME || 'admin';
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD || '';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const localeArg = args.find(a => a.startsWith('--locale='));
const targetLocale = localeArg ? localeArg.split('=')[1] : 'en';

if (!LOCALES[targetLocale]) {
  console.error(`Invalid locale: ${targetLocale}. Use: en, es, ar`);
  process.exit(1);
}

const config = LOCALES[targetLocale];
const BASE_URL = process.env[config.envKey];

if (!BASE_URL) {
  console.error(`ERROR: ${config.envKey} not set in .env.local`);
  process.exit(1);
}

const AUTH_HEADER = 'Basic ' + Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString('base64');

async function wpFetch(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': AUTH_HEADER,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`WP API error ${response.status}: ${text.substring(0, 200)}`);
  }

  return {
    data: await response.json(),
    totalPages: parseInt(response.headers.get('x-wp-totalpages') || '1'),
    total: parseInt(response.headers.get('x-wp-total') || '0'),
  };
}

async function getAllPostIds() {
  const allIds = [];
  let page = 1;
  let totalPages = 1;

  console.log(`\nFetching all ${config.label} post IDs...`);

  while (page <= totalPages) {
    const { data, totalPages: tp, total } = await wpFetch(
      `/posts?per_page=100&page=${page}&status=any&_fields=id,title`
    );

    if (page === 1) {
      totalPages = tp;
      console.log(`  Total posts: ${total} (${totalPages} pages)`);
    }

    for (const post of data) {
      allIds.push({ id: post.id, title: post.title?.rendered || 'Untitled' });
    }

    console.log(`  Page ${page}/${totalPages} - fetched ${data.length} posts`);
    page++;
  }

  return allIds;
}

async function deletePost(postId) {
  return wpFetch(`/posts/${postId}?force=true`, { method: 'DELETE' });
}

async function main() {
  console.log('='.repeat(60));
  console.log(`  Cleanup ${config.label} WordPress Posts`);
  console.log(`  Target: ${BASE_URL}`);
  if (dryRun) console.log('  MODE: DRY RUN (no deletions)');
  console.log('='.repeat(60));

  try {
    console.log('\nTesting API connection...');
    const { total } = await wpFetch('/posts?per_page=1&_fields=id');
    console.log(`  Connected. Total posts: ${total}`);

    if (total === 0) {
      console.log('\n  No posts to delete. Done!');
      return;
    }

    const posts = await getAllPostIds();
    console.log(`\nFound ${posts.length} posts to delete.`);

    if (dryRun) {
      console.log('\nDRY RUN - Would delete these posts:');
      posts.slice(0, 10).forEach(p => console.log(`  [${p.id}] ${p.title}`));
      if (posts.length > 10) console.log(`  ... and ${posts.length - 10} more`);
      return;
    }

    let deleted = 0;
    let failed = 0;

    for (const post of posts) {
      try {
        await deletePost(post.id);
        deleted++;
        if (deleted % 10 === 0 || deleted === posts.length) {
          console.log(`  Deleted ${deleted}/${posts.length} (${post.title.substring(0, 50)}...)`);
        }
      } catch (err) {
        failed++;
        console.error(`  FAILED to delete [${post.id}]: ${err.message}`);
      }

      if (deleted % 50 === 0) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`  CLEANUP COMPLETE`);
    console.log(`  Deleted: ${deleted}`);
    console.log(`  Failed: ${failed}`);
    console.log('='.repeat(60));
  } catch (err) {
    console.error('\nFATAL ERROR:', err.message);
    process.exit(1);
  }
}

main();
