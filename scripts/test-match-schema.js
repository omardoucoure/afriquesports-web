/**
 * Test script to verify match schema generation
 * Usage: node scripts/test-match-schema.js [matchId]
 */

const { generateMatchSchemas, espnToMatchData } = require('../src/lib/match-schema.ts');

async function testMatchSchema(matchId = '732137') {
  try {
    console.log(`\n🔍 Fetching match data for ID: ${matchId}...\n`);

    // Fetch from ESPN API
    const response = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/soccer/caf.nations/summary?event=${matchId}`
    );

    if (!response.ok) {
      throw new Error(`ESPN API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data || !data.header) {
      throw new Error('Invalid match data received');
    }

    // Convert to MatchData format
    const matchData = espnToMatchData(data.header, []);

    console.log('📊 Match Data:\n');
    console.log(`   ${matchData.homeTeam.name} vs ${matchData.awayTeam.name}`);
    console.log(`   Status: ${matchData.status}`);
    console.log(`   Date: ${new Date(matchData.date).toLocaleString()}`);
    console.log(`   Venue: ${matchData.venue?.name || 'N/A'}\n`);

    // Generate schemas
    const schemas = generateMatchSchemas(matchData, 'fr');

    console.log('✅ Generated Schema Markup:\n');
    console.log(JSON.stringify(schemas, null, 2));

    // Validate schema structure
    console.log('\n\n🔎 Schema Validation:\n');

    const graph = schemas['@graph'];
    const liveBlog = graph.find(s => s['@type'] === 'LiveBlogPosting');
    const sportsEvent = graph.find(s => s['@type'] === 'SportsEvent');
    const broadcastEvent = graph.find(s => s['@type'] === 'BroadcastEvent');
    const breadcrumb = graph.find(s => s['@type'] === 'BreadcrumbList');

    console.log(`   ✅ LiveBlogPosting: ${liveBlog ? 'Found' : '❌ Missing'}`);
    if (liveBlog) {
      console.log(`      - Headline: ${liveBlog.headline}`);
      console.log(`      - Coverage times: ${liveBlog.coverageStartTime ? 'Set' : 'Not set'}`);
      console.log(`      - Updates: ${liveBlog.liveBlogUpdate?.length || 0} commentary items`);
    }

    console.log(`   ✅ SportsEvent: ${sportsEvent ? 'Found' : '❌ Missing'}`);
    if (sportsEvent) {
      console.log(`      - Name: ${sportsEvent.name}`);
      console.log(`      - Status: ${sportsEvent.eventStatus}`);
      console.log(`      - Teams: ${sportsEvent.homeTeam.name} vs ${sportsEvent.awayTeam.name}`);
      console.log(`      - Venue: ${sportsEvent.location?.name || 'Not set'}`);
    }

    console.log(`   ✅ BroadcastEvent: ${broadcastEvent ? 'Found' : 'Not included (expected for completed matches)'}`);
    if (broadcastEvent) {
      console.log(`      - Is live: ${broadcastEvent.isLiveBroadcast}`);
    }

    console.log(`   ✅ BreadcrumbList: ${breadcrumb ? 'Found' : '❌ Missing'}`);
    if (breadcrumb) {
      console.log(`      - Items: ${breadcrumb.itemListElement.length}`);
    }

    console.log('\n\n✨ Test URL for Google Rich Results Test:');
    console.log(`   https://search.google.com/test/rich-results?url=https://www.afriquesports.net/fr/can-2025/match/${matchId}`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Get match ID from command line or use default
const matchId = process.argv[2] || '732137';
testMatchSchema(matchId);
