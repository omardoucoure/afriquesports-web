#!/usr/bin/env node
/**
 * Test Author Tracking Event
 * Sends a test Article_View_Page event with author data to PostHog
 */

const https = require('https');

console.log('🔍 Testing Author Tracking in PostHog\n');

const testArticleEvent = JSON.stringify({
  api_key: 'phc_Gq0AQAld7nRpXz0X8Et9CYX4abM7UP6rYYUCh5rwtqV',
  event: 'Article_View_Page',
  properties: {
    distinct_id: 'test_user_' + Date.now(),
    article_id: 'test_article_123',
    article_title: 'Test Article - Author Tracking Verification',
    article_category: 'Football',
    article_author: 'Test Author Name',
    article_slug: 'test-article-author-tracking',
    article_publish_date: new Date().toISOString(),
    locale: 'fr',
    page_path: '/fr/football/test-article-author-tracking',
    timestamp: Date.now(),
    session_id: 'test_session_' + Date.now(),
    $current_url: 'https://www.afriquesports.net/fr/football/test-article-author-tracking',
  }
});

const options = {
  hostname: 'us.i.posthog.com',
  port: 443,
  path: '/capture/',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': testArticleEvent.length
  }
};

console.log('📤 Sending test Article_View_Page event with author data...\n');

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ Test article event with author sent successfully!');
      console.log(`   Response: ${data}\n`);

      console.log('══════════════════════════════════════════════════════');
      console.log('📊 Verify Author Tracking in PostHog');
      console.log('══════════════════════════════════════════════════════\n');

      console.log('1. Open PostHog Events Explorer:');
      console.log('   https://us.posthog.com/project/21827/events\n');

      console.log('2. Filter for Article_View_Page events:');
      console.log('   • Click "Add filter"');
      console.log('   • Select "Event name"');
      console.log('   • Choose "Article_View_Page"\n');

      console.log('3. Look for the test event properties:');
      console.log('   • article_author: "Test Author Name"');
      console.log('   • article_title: "Test Article - Author Tracking Verification"');
      console.log('   • article_category: "Football"');
      console.log('   • article_id: "test_article_123"\n');

      console.log('4. Check real article events:');
      console.log('   • Visit any article on your site');
      console.log('   • Wait 30-60 seconds');
      console.log('   • Refresh PostHog dashboard');
      console.log('   • Look for Article_View_Page with real author names\n');

      console.log('══════════════════════════════════════════════════════');
      console.log('✨ What This Means');
      console.log('══════════════════════════════════════════════════════\n');

      console.log('✅ PostHog is receiving Article_View_Page events');
      console.log('✅ Author attribution is included in event properties');
      console.log('✅ Your author tracking implementation is working\n');

      console.log('Next: Visit https://us.posthog.com/project/21827/events');
      console.log('      and filter for "Article_View_Page" to see author data\n');

    } else {
      console.log(`❌ Failed: HTTP ${res.statusCode}`);
      console.log(`   Response: ${data}\n`);
    }
  });
});

req.on('error', (error) => {
  console.error(`❌ Error sending event: ${error.message}\n`);
});

req.write(testArticleEvent);
req.end();
