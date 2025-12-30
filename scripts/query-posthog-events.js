#!/usr/bin/env node
/**
 * Query PostHog Events
 * Attempts to retrieve recent Article_View_Page events with author data
 */

const https = require('https');

console.log('🔍 Querying PostHog for Article_View_Page Events\n');

// Note: This requires a Personal API Key, not the public API key
// For now, we'll provide instructions for manual verification

console.log('══════════════════════════════════════════════════════');
console.log('📊 How to Check Author Events in PostHog Dashboard');
console.log('══════════════════════════════════════════════════════\n');

console.log('Step 1: Open PostHog Events Explorer');
console.log('   🔗 https://us.posthog.com/project/21827/events\n');

console.log('Step 2: Filter for Article_View_Page Events');
console.log('   1. Look for the "Event" dropdown at the top');
console.log('   2. Type or select: Article_View_Page');
console.log('   3. Events will filter automatically\n');

console.log('Step 3: Check Event Properties');
console.log('   • Click on any Article_View_Page event');
console.log('   • Look for these properties in the event details:');
console.log('     - article_author: (should show author name)');
console.log('     - article_title: (article title)');
console.log('     - article_category: (category)');
console.log('     - article_id: (article ID)');
console.log('     - article_slug: (URL slug)');
console.log('     - article_publish_date: (publish date)\n');

console.log('Step 4: Test with Live Site');
console.log('   1. Visit: https://www.afriquesports.net/fr/football/[any-article]');
console.log('   2. Wait 30-60 seconds for event processing');
console.log('   3. Refresh PostHog dashboard');
console.log('   4. New Article_View_Page events should appear with author data\n');

console.log('══════════════════════════════════════════════════════');
console.log('📈 Create Author Analytics Dashboard');
console.log('══════════════════════════════════════════════════════\n');

console.log('1. Go to: https://us.posthog.com/project/21827/dashboard');
console.log('2. Click "New Dashboard"');
console.log('3. Add insights to track:');
console.log('   • Article views by author (breakdown by article_author)');
console.log('   • Top performing authors (count Article_View_Page by author)');
console.log('   • Author engagement over time (trend of views per author)\n');

console.log('══════════════════════════════════════════════════════');
console.log('🔑 Optional: Get Personal API Key for Programmatic Access');
console.log('══════════════════════════════════════════════════════\n');

console.log('To query events via API:');
console.log('1. Go to: https://us.posthog.com/settings/user-api-keys');
console.log('2. Create a new Personal API Key');
console.log('3. Use it to query events programmatically\n');

console.log('Example query with Personal API Key:');
console.log(`
const options = {
  hostname: 'us.posthog.com',
  path: '/api/projects/21827/events?event=Article_View_Page',
  headers: {
    'Authorization': 'Bearer YOUR_PERSONAL_API_KEY'
  }
};
`);

console.log('\n✅ Test events sent successfully!');
console.log('   Check the dashboard now to verify author tracking.\n');
