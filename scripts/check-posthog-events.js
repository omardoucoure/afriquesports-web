#!/usr/bin/env node
/**
 * Check PostHog Events Dashboard
 *
 * This script helps verify that PostHog is receiving events
 */

const https = require('https');

console.log('🔍 Checking PostHog Events Dashboard\n');

// Test 1: Send a test event
console.log('1️⃣ Sending test event to PostHog...');

const testEvent = JSON.stringify({
  api_key: 'phc_Gq0AQAld7nRpXz0X8Et9CYX4abM7UP6rYYUCh5rwtqV',
  event: 'dashboard_check_test',
  properties: {
    distinct_id: 'dashboard_checker',
    test: 'checking_if_events_work',
    timestamp: new Date().toISOString(),
    source: 'check_script'
  }
});

const options = {
  hostname: 'us.i.posthog.com',
  port: 443,
  path: '/capture/',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': testEvent.length
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('   ✅ Test event sent successfully!');
      console.log(`   Response: ${data}`);
      console.log('');

      // Instructions
      console.log('══════════════════════════════════════════════════════');
      console.log('📊 How to Check PostHog Dashboard');
      console.log('══════════════════════════════════════════════════════\n');

      console.log('1. Open PostHog Events Dashboard:');
      console.log('   https://us.i.posthog.com/events\n');

      console.log('2. You should see events like:');
      console.log('   • $pageview (automatic page views)');
      console.log('   • dashboard_check_test (this test event)');
      console.log('   • Article_View_Page (if tracking articles)');
      console.log('   • Any other custom events\n');

      console.log('3. Filter by event name:');
      console.log('   • Search for: "dashboard_check_test"');
      console.log('   • Click on the event to see properties');
      console.log('   • Check timestamp matches: ' + new Date().toISOString() + '\n');

      console.log('4. Check if site events are tracked:');
      console.log('   • Visit: https://www.afriquesports.net');
      console.log('   • Open browser DevTools (F12)');
      console.log('   • Go to Console tab');
      console.log('   • Look for: "PostHog loaded successfully"');
      console.log('   • Navigate to different pages');
      console.log('   • Refresh PostHog dashboard after 30 seconds\n');

      console.log('5. View insights:');
      console.log('   https://us.i.posthog.com/insights\n');

      console.log('══════════════════════════════════════════════════════');
      console.log('✨ Next Steps');
      console.log('══════════════════════════════════════════════════════\n');

      console.log('If you see the test event:');
      console.log('   ✅ PostHog API is working correctly');
      console.log('   ✅ Your API key is valid');
      console.log('   ✅ Events can be sent to your project\n');

      console.log('If you DON\'T see site events ($pageview):');
      console.log('   • Check browser console for errors');
      console.log('   • Verify environment variables in Vercel');
      console.log('   • Wait 1-2 minutes for events to appear');
      console.log('   • Try incognito/private browsing mode\n');

      console.log('To track article views with author:');
      console.log('   See: AUTHOR-ANALYTICS-GUIDE.md\n');

    } else {
      console.log(`   ❌ Failed: HTTP ${res.statusCode}`);
      console.log(`   Response: ${data}`);
      console.log('');
      console.log('Troubleshooting:');
      console.log('   • API key might be invalid');
      console.log('   • Check PostHog project is active');
      console.log('   • Verify API endpoint: https://us.i.posthog.com');
    }
  });
});

req.on('error', (error) => {
  console.error(`   ❌ Error sending event: ${error.message}`);
  console.log('');
  console.log('Troubleshooting:');
  console.log('   • Check internet connection');
  console.log('   • Verify PostHog service is up: https://status.posthog.com');
});

req.write(testEvent);
req.end();
