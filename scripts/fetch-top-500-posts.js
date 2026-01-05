#!/usr/bin/env node
/**
 * Fetch Top 500 Posts from Google Search Console
 *
 * Retrieves the top 500 most clicked posts over the last 16 months
 * and enriches with WordPress data for content regeneration planning.
 *
 * Usage: node scripts/fetch-top-500-posts.js
 * Output: top-500-posts.csv
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const SITE_URL = 'sc-domain:afriquesports.net';
const CREDENTIALS_PATH = path.join(__dirname, '..', 'google-service-account.json');
const OUTPUT_CSV = path.join(__dirname, '..', 'top-500-posts.csv');

// Calculate date range (last 16 months - GSC maximum)
const endDate = new Date();
const startDate = new Date();
startDate.setMonth(startDate.getMonth() - 16);

console.log('='.repeat(70));
console.log('FETCHING TOP 500 POSTS FROM GOOGLE SEARCH CONSOLE');
console.log('='.repeat(70));
console.log('');
console.log(`📅 Date range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
console.log(`🔍 Fetching top 500 URLs by clicks...`);
console.log('');

async function fetchTop500Posts() {
  try {
    // Initialize Google Search Console API
    const auth = new google.auth.GoogleAuth({
      keyFile: CREDENTIALS_PATH,
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });

    const webmasters = google.webmasters({ version: 'v3', auth });

    // Fetch top 500 pages by clicks
    const response = await webmasters.searchanalytics.query({
      siteUrl: SITE_URL,
      requestBody: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        dimensions: ['page'],
        rowLimit: 500,
      }
    });

    if (!response.data.rows || response.data.rows.length === 0) {
      console.log('⚠️  No data available for this period');
      return;
    }

    console.log(`✅ Found ${response.data.rows.length} pages with traffic`);
    console.log('');
    console.log('📊 Processing pages and fetching WordPress data...');
    console.log('');

    // Process each URL
    const results = [];
    let processed = 0;
    let errors = 0;

    for (const row of response.data.rows) {
      processed++;
      const url = row.keys[0];

      // Progress indicator
      if (processed % 50 === 0) {
        console.log(`   Processed ${processed}/${response.data.rows.length}...`);
      }

      try {
        // Parse URL to extract metadata
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/').filter(p => p);

        // Skip non-article URLs
        if (pathParts.length < 2 || url.includes('?') || url.includes('#')) {
          continue;
        }

        // Extract locale
        let locale = 'fr';
        let categoryIndex = 0;

        if (['en', 'es', 'ar'].includes(pathParts[0])) {
          locale = pathParts[0];
          categoryIndex = 1;
        }

        // Extract category and slug
        const category = pathParts[categoryIndex] || '';
        const slug = pathParts[pathParts.length - 1] || '';

        if (!slug || !category) {
          continue;
        }

        // Fetch WordPress post data
        let wpData = null;
        try {
          wpData = await fetchWordPressPost(slug, locale);
        } catch (wpError) {
          // WordPress fetch failed, but we can still save GSC data
          wpData = {
            post_id: null,
            title: null,
            has_placeholder: null,
            date: null,
            featured_image: null
          };
        }

        // Add to results
        results.push({
          rank: results.length + 1,
          url,
          slug,
          locale,
          category,
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: (row.ctr * 100).toFixed(2),
          position: row.position.toFixed(1),
          post_id: wpData.post_id,
          title: wpData.title,
          has_placeholder: wpData.has_placeholder,
          date: wpData.date,
          featured_image: wpData.featured_image
        });

      } catch (error) {
        errors++;
        console.error(`   ❌ Error processing ${url}: ${error.message}`);
      }
    }

    console.log('');
    console.log(`✅ Processing complete: ${results.length} articles, ${errors} errors`);
    console.log('');

    // Generate CSV
    console.log('💾 Generating CSV file...');
    const csvContent = generateCSV(results);
    fs.writeFileSync(OUTPUT_CSV, csvContent);

    console.log(`✅ Saved to: ${OUTPUT_CSV}`);
    console.log('');

    // Summary statistics
    printSummary(results);

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ENOENT') {
      console.error('');
      console.error('Make sure google-service-account.json exists in the root directory.');
    }
    process.exit(1);
  }
}

/**
 * Fetch WordPress post data via REST API
 */
async function fetchWordPressPost(slug, locale) {
  const baseUrls = {
    fr: "https://cms.realdemadrid.com/afriquesports",
    en: "https://cms.realdemadrid.com/afriquesports-en",
    es: "https://cms.realdemadrid.com/afriquesports-es",
    ar: "https://cms.realdemadrid.com/afriquesports-ar",
  };

  const baseUrl = baseUrls[locale] || baseUrls.fr;
  const apiUrl = `${baseUrl}/wp-json/wp/v2/posts?slug=${slug}&_embed=true`;

  const response = await fetch(apiUrl);

  if (!response.ok) {
    throw new Error(`WordPress API error: ${response.status}`);
  }

  const posts = await response.json();

  if (!posts || posts.length === 0) {
    throw new Error('Post not found');
  }

  const post = posts[0];

  // Extract data
  const title = post.title?.rendered?.replace(/<[^>]*>/g, '') || null;
  const content = post.content?.rendered || '';
  const hasPlaceholder = content.includes('Cet article fait partie de nos archives') ||
                         content.includes('sera mis à jour prochainement');
  const date = post.date?.split('T')[0] || null;

  // Get featured image
  let featuredImage = null;
  if (post._embedded?.['wp:featuredmedia']?.[0]?.source_url) {
    featuredImage = post._embedded['wp:featuredmedia'][0].source_url;
  }

  return {
    post_id: post.id,
    title,
    has_placeholder: hasPlaceholder,
    date,
    featured_image: featuredImage
  };
}

/**
 * Generate CSV from results
 */
function generateCSV(results) {
  const headers = [
    'rank',
    'url',
    'slug',
    'locale',
    'category',
    'clicks',
    'impressions',
    'ctr',
    'position',
    'post_id',
    'title',
    'has_placeholder',
    'date',
    'featured_image'
  ];

  let csv = headers.join(',') + '\n';

  for (const row of results) {
    const values = headers.map(header => {
      let value = row[header];

      // Handle null/undefined
      if (value === null || value === undefined) {
        return '';
      }

      // Escape commas and quotes in title/URL
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        value = '"' + value.replace(/"/g, '""') + '"';
      }

      return value;
    });

    csv += values.join(',') + '\n';
  }

  return csv;
}

/**
 * Print summary statistics
 */
function printSummary(results) {
  console.log('='.repeat(70));
  console.log('SUMMARY');
  console.log('='.repeat(70));
  console.log('');

  // Total metrics
  const totalClicks = results.reduce((sum, r) => sum + r.clicks, 0);
  const totalImpressions = results.reduce((sum, r) => sum + r.impressions, 0);

  console.log(`📊 Total articles: ${results.length}`);
  console.log(`👆 Total clicks: ${totalClicks.toLocaleString()}`);
  console.log(`👁️  Total impressions: ${totalImpressions.toLocaleString()}`);
  console.log('');

  // Placeholder analysis
  const withPlaceholder = results.filter(r => r.has_placeholder === true).length;
  const withoutPlaceholder = results.filter(r => r.has_placeholder === false).length;
  const unknown = results.filter(r => r.has_placeholder === null).length;

  console.log('📝 Content status:');
  console.log(`   Has placeholder: ${withPlaceholder} (${(withPlaceholder/results.length*100).toFixed(1)}%)`);
  console.log(`   Has real content: ${withoutPlaceholder} (${(withoutPlaceholder/results.length*100).toFixed(1)}%)`);
  console.log(`   Unknown: ${unknown} (${(unknown/results.length*100).toFixed(1)}%)`);
  console.log('');

  // Locale breakdown
  const locales = {};
  results.forEach(r => {
    locales[r.locale] = (locales[r.locale] || 0) + 1;
  });

  console.log('🌍 By language:');
  Object.entries(locales).sort((a, b) => b[1] - a[1]).forEach(([locale, count]) => {
    console.log(`   ${locale}: ${count} (${(count/results.length*100).toFixed(1)}%)`);
  });
  console.log('');

  // Top 10 categories
  const categories = {};
  results.forEach(r => {
    categories[r.category] = (categories[r.category] || 0) + 1;
  });

  console.log('📁 Top 10 categories:');
  Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([category, count]) => {
      console.log(`   ${category}: ${count} (${(count/results.length*100).toFixed(1)}%)`);
    });
  console.log('');

  // Traffic distribution
  const top10Clicks = results.slice(0, 10).reduce((sum, r) => sum + r.clicks, 0);
  const top100Clicks = results.slice(0, 100).reduce((sum, r) => sum + r.clicks, 0);

  console.log('🔥 Traffic distribution:');
  console.log(`   Top 10: ${top10Clicks.toLocaleString()} clicks (${(top10Clicks/totalClicks*100).toFixed(1)}%)`);
  console.log(`   Top 100: ${top100Clicks.toLocaleString()} clicks (${(top100Clicks/totalClicks*100).toFixed(1)}%)`);
  console.log(`   Top 500: ${totalClicks.toLocaleString()} clicks (100%)`);
  console.log('');

  console.log('='.repeat(70));
}

fetchTop500Posts().catch(console.error);
