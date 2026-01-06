#!/usr/bin/env node

/**
 * Daily Player Data Cache Update
 *
 * Runs daily to refresh player data cache from web scrapers.
 * Should be scheduled via cron to run once per day.
 *
 * Usage:
 *   node scripts/update-player-cache.js
 *
 * Cron schedule (daily at 2 AM):
 *   0 2 * * * cd /path/to/afriquesports-web && node scripts/update-player-cache.js >> logs/player-cache.log 2>&1
 */

const fs = require('fs');
const { parse } = require('csv-parse/sync');
const DataMerger = require('./lib/scrapers/data-merger');
const PlayerDataCache = require('./lib/player-data-cache');
const EntityExtractor = require('./lib/entity-extractor');

async function updatePlayerCache() {
  console.log('🔄 Daily Player Data Cache Update');
  console.log('═'.repeat(60));
  console.log(`Started at: ${new Date().toISOString()}\n`);

  try {
    // Initialize cache
    const cache = new PlayerDataCache();
    await cache.init();

    // Clean up expired entries first
    console.log('🗑️  Cleaning up expired cache entries...');
    await cache.cleanup();

    // Load posts data
    const csvContent = fs.readFileSync('top-500-posts.csv', 'utf-8');
    const posts = parse(csvContent, { columns: true });

    // Extract all players from top 500 posts
    console.log('\n🔍 Extracting players from top 500 posts...');
    const extractor = new EntityExtractor();
    const allPlayers = new Set();

    posts.forEach(post => {
      if (post.has_placeholder === 'true') {
        const entities = extractor.extract(post.title);
        entities.players.forEach(player => allPlayers.add(player));
      }
    });

    const playersList = Array.from(allPlayers);
    console.log(`   Found ${playersList.length} unique players across all posts\n`);

    if (playersList.length === 0) {
      console.log('ℹ️  No players to update');
      await cache.close();
      return;
    }

    // Check which players need updating (not in cache or expired)
    console.log('💾 Checking cache status...');
    const cachedResults = await cache.getMultiple(playersList);
    const playersToUpdate = cachedResults
      .filter(({ cached }) => !cached)
      .map(({ playerName }) => playerName);

    console.log(`   Cache hits: ${playersList.length - playersToUpdate.length}`);
    console.log(`   Need update: ${playersToUpdate.length}\n`);

    // Fetch and cache player data
    if (playersToUpdate.length > 0) {
      console.log(`🌐 Fetching data for ${playersToUpdate.length} players...`);
      console.log('   (This may take a while with rate limiting...)\n');

      const merger = new DataMerger();
      const results = await merger.fetchPlayersData(playersToUpdate);

      // Cache all results
      let successCount = 0;
      let failCount = 0;

      for (const result of results) {
        await cache.set(result.playerName, result);
        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }
      }

      console.log('\n📊 Update Summary:');
      console.log(`   ✅ Successful: ${successCount}`);
      console.log(`   ❌ Failed: ${failCount}`);
    } else {
      console.log('✅ All players already cached, no updates needed');
    }

    // Final cache statistics
    const stats = await cache.getStats();
    console.log('\n📈 Final Cache Stats:');
    console.log(`   Total entries: ${stats.total}`);
    console.log(`   Valid (not expired): ${stats.valid}`);
    console.log(`   Successful scrapes: ${stats.successful}`);
    console.log(`   Expired: ${stats.expired}`);

    await cache.close();

    console.log('\n✅ Daily cache update completed successfully');
    console.log(`Finished at: ${new Date().toISOString()}`);
    console.log('═'.repeat(60));
  } catch (error) {
    console.error('\n❌ Fatal error during cache update:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the update
updatePlayerCache().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
