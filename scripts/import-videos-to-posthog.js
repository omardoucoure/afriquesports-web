#!/usr/bin/env node
/**
 * Import Video Data to PostHog
 * Sends video impression events to PostHog from Google Search Console data
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const POSTHOG_API_KEY = 'phc_Gq0AQAld7nRpXz0X8Et9CYX4abM7UP6rYYUCh5rwtqV';
const POSTHOG_HOST = 'us.i.posthog.com';
const BATCH_SIZE = 100; // Send events in batches
const DELAY_BETWEEN_BATCHES = 1000; // 1 second delay

console.log('📹 Importing Video Data to PostHog\n');

// Read the analysis file
const analysisPath = process.argv[2] || '/Users/omardoucoure/Downloads/posthog-video-data/analysis/all-urls-fixed.csv';

if (!fs.existsSync(analysisPath)) {
  console.error(`❌ File not found: ${analysisPath}`);
  console.log('\nUsage:');
  console.log('  node import-videos-to-posthog.js [path-to-csv]\n');
  console.log('Make sure to run analyze-video-urls.js first to generate the fixed CSV');
  process.exit(1);
}

// Helper: Determine video type
function getVideoType(videoUrl) {
  if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
    return 'youtube';
  } else if (videoUrl.includes('afriquesports.net') || videoUrl.includes('realdemadrid.com/afriquesports')) {
    return 'self_hosted';
  } else {
    return 'other';
  }
}

// Helper: Extract article info from URL
function extractArticleInfo(pageUrl) {
  const urlParts = pageUrl.replace('https://www.afriquesports.net/', '').split('/');

  let locale = 'fr';
  let category = 'football';
  let slug = '';

  // Check if first part is a locale
  const locales = ['en', 'es', 'ar', 'fr'];
  if (locales.includes(urlParts[0])) {
    locale = urlParts[0];
    category = urlParts[1] || 'football';
    slug = urlParts.slice(2).join('/');
  } else {
    category = urlParts[0] || 'football';
    slug = urlParts.slice(1).join('/');
  }

  return {
    locale,
    category,
    slug,
  };
}

// Helper: Send event to PostHog
function sendEvent(event) {
  return new Promise((resolve, reject) => {
    const eventData = JSON.stringify({
      api_key: POSTHOG_API_KEY,
      event: event.eventName,
      properties: event.properties,
    });

    const options = {
      hostname: POSTHOG_HOST,
      port: 443,
      path: '/capture/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': eventData.length,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve({ success: true, data });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(eventData);
    req.end();
  });
}

// Helper: Send batch of events
async function sendBatch(events) {
  const results = {
    success: 0,
    failed: 0,
    errors: [],
  };

  for (const event of events) {
    try {
      await sendEvent(event);
      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push({
        event: event.properties.video_url,
        error: error.message,
      });
    }
  }

  return results;
}

// Helper: Sleep function
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Main import function
async function importVideos() {
  // Read CSV
  const csvContent = fs.readFileSync(analysisPath, 'utf-8');
  const lines = csvContent.split('\n').filter((line) => line.trim());

  console.log(`📊 Total entries: ${lines.length - 1}\n`);

  // Skip header
  const entries = lines.slice(1).map((line) => {
    // Parse CSV with quoted fields
    const match = line.match(/"([^"]*)","([^"]*)","([^"]*)","([^"]*)"/);
    if (match) {
      return {
        pageUrl: match[1],
        videoUrl: match[2],
        lastCrawl: match[3],
        wasFixed: match[4] === 'YES',
      };
    }
    return null;
  }).filter(Boolean);

  console.log(`✅ Valid entries to import: ${entries.length}\n`);

  // Create events
  const events = entries.map((entry, index) => {
    const articleInfo = extractArticleInfo(entry.pageUrl);
    const videoType = getVideoType(entry.videoUrl);

    return {
      eventName: 'Video_Impression',
      properties: {
        distinct_id: `video_import_${Date.now()}_${index}`,
        video_url: entry.videoUrl,
        video_type: videoType,
        article_url: entry.pageUrl,
        article_category: articleInfo.category,
        article_slug: articleInfo.slug,
        video_position: 'embedded',
        locale: articleInfo.locale,
        page_path: entry.pageUrl.replace('https://www.afriquesports.net', ''),
        timestamp: new Date(entry.lastCrawl).getTime(),
        session_id: `import_${Date.now()}`,
        source: 'google_search_console',
        was_url_fixed: entry.wasFixed,
      },
    };
  });

  // Split into batches
  const batches = [];
  for (let i = 0; i < events.length; i += BATCH_SIZE) {
    batches.push(events.slice(i, i + BATCH_SIZE));
  }

  console.log(`📦 Sending ${batches.length} batches of up to ${BATCH_SIZE} events each\n`);

  // Send batches
  const totalResults = {
    success: 0,
    failed: 0,
    errors: [],
  };

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`📤 Sending batch ${i + 1}/${batches.length} (${batch.length} events)...`);

    try {
      const results = await sendBatch(batch);
      totalResults.success += results.success;
      totalResults.failed += results.failed;
      totalResults.errors.push(...results.errors);

      console.log(`   ✅ Success: ${results.success}, ❌ Failed: ${results.failed}`);

      // Delay between batches to avoid rate limiting
      if (i < batches.length - 1) {
        await sleep(DELAY_BETWEEN_BATCHES);
      }
    } catch (error) {
      console.error(`   ❌ Batch failed: ${error.message}`);
      totalResults.failed += batch.length;
    }
  }

  console.log('\n══════════════════════════════════════════════════════');
  console.log('📊 Import Summary');
  console.log('══════════════════════════════════════════════════════\n');

  console.log(`Total Events: ${events.length}`);
  console.log(`✅ Successfully sent: ${totalResults.success} (${((totalResults.success / events.length) * 100).toFixed(1)}%)`);
  console.log(`❌ Failed: ${totalResults.failed} (${((totalResults.failed / events.length) * 100).toFixed(1)}%)\n`);

  if (totalResults.errors.length > 0 && totalResults.errors.length <= 10) {
    console.log('Errors:');
    totalResults.errors.forEach((err, i) => {
      console.log(`  ${i + 1}. ${err.event}: ${err.error}`);
    });
    console.log('');
  } else if (totalResults.errors.length > 10) {
    console.log(`First 10 errors:`);
    totalResults.errors.slice(0, 10).forEach((err, i) => {
      console.log(`  ${i + 1}. ${err.event}: ${err.error}`);
    });
    console.log(`  ... and ${totalResults.errors.length - 10} more\n`);
  }

  // Save log
  const logDir = path.dirname(analysisPath);
  const logPath = path.join(logDir, 'import-log.json');
  fs.writeFileSync(
    logPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        total: events.length,
        success: totalResults.success,
        failed: totalResults.failed,
        errors: totalResults.errors,
      },
      null,
      2
    )
  );

  console.log('══════════════════════════════════════════════════════');
  console.log('✅ Import Complete');
  console.log('══════════════════════════════════════════════════════\n');

  console.log(`Log saved to: ${logPath}\n`);

  console.log('Next steps:');
  console.log('  1. Check PostHog dashboard: https://us.posthog.com/project/21827/events');
  console.log('  2. Filter for event: Video_Impression');
  console.log('  3. Verify video_type breakdown (youtube vs self_hosted)');
  console.log('  4. Check video_url and article_category properties\n');
}

// Run import
importVideos().catch((error) => {
  console.error(`\n❌ Fatal error: ${error.message}`);
  process.exit(1);
});
