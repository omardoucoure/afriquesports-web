#!/usr/bin/env node

/**
 * Enhanced Content Generation with Real Football Data
 *
 * Fetches up-to-date player/team data from Football API,
 * then uses Qwen 2.5 14B to generate accurate content.
 *
 * Usage: node generate-with-real-data.js --post-id=851539
 */

const fs = require('fs');
const { parse } = require('csv-parse/sync');
const { execSync } = require('child_process');
const DataMerger = require('./lib/scrapers/data-merger');
const PlayerDataCache = require('./lib/player-data-cache');
const EntityExtractor = require('./lib/entity-extractor');
const PostTypeDetector = require('./lib/post-type-detector');
const PromptTemplates = require('./lib/prompt-templates');
const AutonomousResearcher = require('./lib/autonomous-researcher');
const ImageManager = require('./lib/image-manager');

// Parse arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.replace('--', '').split('=');
  acc[key] = value || true;
  return acc;
}, {});

const postId = args['post-id'];
const modelName = args.model || 'qwen2.5:14b-instruct';  // 14B model - MacBook Pro M1 Pro (32GB RAM)
const dryRun = args['dry-run'];

// MacBook Pro M1 Pro Configuration (localhost)
const OLLAMA_HOST = 'localhost';
const OLLAMA_PORT = '11434';

async function generateWithRealData() {
  console.log('🤖 Enhanced Content Generation with Real Football Data\n');

  // Load posts data
  const csvContent = fs.readFileSync('top-500-posts.csv', 'utf-8');
  const posts = parse(csvContent, { columns: true });

  // Find the post
  const post = postId
    ? posts.find(p => p.post_id === postId)
    : posts[0]; // Default to rank #1

  if (!post) {
    console.error(`❌ Post not found: ${postId}`);
    process.exit(1);
  }

  console.log('📄 Generating content for:');
  console.log(`   Rank: ${post.rank}`);
  console.log(`   Title: ${post.title}`);
  console.log(`   Category: ${post.category}`);
  console.log(`   Clicks: ${post.clicks}\n`);

  // Step 1: Detect post type first (needed for autonomous research)
  const detector = new PostTypeDetector();
  const postType = detector.detect(post.title, post.category);
  const rankingNumber = detector.extractRankingNumber(post.title);

  console.log('📋 Step 1: Post type detection');
  console.log(`   Type: ${postType}`);
  if (rankingNumber) {
    console.log(`   Ranking size: Top ${rankingNumber}`);
  }
  console.log();

  // Step 2: Autonomous research to find missing entities
  console.log('🤖 Step 2: Autonomous research...');
  const researcher = new AutonomousResearcher();
  const research = await researcher.research(post.title, post.category, postType);

  // Step 3: Extract entities from title (manual extraction)
  console.log('🔍 Step 3: Extracting entities from title...');
  const extractor = new EntityExtractor();
  const titleEntities = extractor.extract(post.title);

  // Merge research findings with title entities
  const entities = {
    players: [...new Set([...titleEntities.players, ...research.entities.players])],
    teams: [...new Set([...titleEntities.teams, ...research.entities.teams])],
    topic: titleEntities.topic
  };

  const dataNeeds = extractor.getDataNeeds(entities);

  console.log(`   Total players to fetch: ${entities.players.length}`);
  console.log(`   Players: ${entities.players.join(', ')}`);
  console.log(`   Teams found: ${entities.teams.length ? entities.teams.join(', ') : 'None'}`);
  console.log(`   Topic type: ${entities.topic}\n`);

  // Step 4: Fetch real football data from web scrapers with caching
  let factSheet = '';
  let playerDataList = []; // Store player data for image processing

  if (dataNeeds.fetchPlayers && entities.players.length > 0) {
    console.log('🌐 Step 4: Fetching player data from web scrapers...');

    try {
      // Initialize cache
      const cache = new PlayerDataCache();
      await cache.init();

      // Check cache first
      const cachedResults = await cache.getMultiple(entities.players);
      const playersToFetch = [];
      const cachedData = [];

      cachedResults.forEach(({ playerName, cached }) => {
        if (cached) {
          cachedData.push(cached);
        } else {
          playersToFetch.push(playerName);
        }
      });

      console.log(`   💾 Cache: ${cachedData.length} hits, ${playersToFetch.length} misses`);

      // Fetch missing players
      let freshData = [];
      if (playersToFetch.length > 0) {
        console.log(`   🌐 Scraping ${playersToFetch.length} players...`);
        const merger = new DataMerger();
        freshData = await merger.fetchPlayersData(playersToFetch);

        // Cache the results
        for (const result of freshData) {
          await cache.set(result.playerName, result);
        }
      }

      // Combine cached and fresh data
      const allPlayersData = [...cachedData, ...freshData];
      const successfulPlayers = allPlayersData.filter(p => p.success);

      // Store player data for image processing later
      playerDataList = successfulPlayers.map(p => p.data).filter(Boolean);

      if (successfulPlayers.length > 0) {
        factSheet += '\n📊 DONNÉES VÉRIFIÉES (2025):\n';

        successfulPlayers.forEach(playerResult => {
          const player = playerResult.data;
          if (!player) return;

          factSheet += `\n- **${player.name}** (${player.nationality})\n`;
          factSheet += `  • Âge: ${player.age} ans\n`;
          factSheet += `  • Club: ${player.currentClub}\n`;
          factSheet += `  • Poste: ${player.position}\n`;
          factSheet += `  • Valeur marchande: ${player.marketValue}\n`;

          if (player.stats.appearances > 0) {
            factSheet += `  • Statistiques ${player.stats.season}: ${player.stats.goals} buts, ${player.stats.assists} passes décisives en ${player.stats.appearances} matchs\n`;
            if (player.stats.rating) {
              factSheet += `  • Note moyenne: ${player.stats.rating}/10\n`;
            }
          }
        });

        console.log(`   ✅ Got data for ${successfulPlayers.length}/${entities.players.length} players`);
      } else {
        console.log('   ⚠️  No player data found from scrapers');
      }

      // Show cache stats
      const stats = await cache.getStats();
      console.log(`   📊 Cache stats: ${stats.valid} valid, ${stats.expired} expired, ${stats.total} total`);

      await cache.close();
    } catch (error) {
      console.log(`   ⚠️  Scraper error: ${error.message}`);
      console.log('   📝 Continuing with general prompt...');
    }
  } else {
    console.log('ℹ️  Step 4: No specific players detected, using general approach\n');
  }

  // Step 5: Build appropriate prompt using detected post type
  console.log('📝 Step 5: Building prompt with template...\n');

  const prompt = PromptTemplates.getTemplate(postType, post, factSheet, {
    rankingNumber: rankingNumber || 10,
  });

  console.log(`   ✅ Using ${postType} template\n`);

  if (dryRun) {
    console.log('🔍 DRY RUN - Prompt Preview:\n');
    console.log('─'.repeat(60));
    console.log(prompt);
    console.log('─'.repeat(60));
    console.log('\nℹ️  Run without --dry-run to generate content');
    return;
  }

  // Step 6: Generate with Ollama (MacBook Pro M1 Pro - 14B model)
  console.log(`🚀 Step 6: Generating content with ${modelName}...`);
  console.log(`   Using: MacBook Pro M1 Pro (32GB RAM)`);
  const startTime = Date.now();

  // Create JSON payload for Ollama API with 32K context window
  const payload = {
    model: modelName,
    prompt: prompt,
    stream: false,
    options: {
      num_ctx: 32768,     // 32K context window (model supports up to 128K)
      temperature: 0.7,   // Slightly creative for varied content
      top_p: 0.9,         // Nucleus sampling for diversity
      repeat_penalty: 1.1, // Avoid repetition
    }
  };

  // Write payload to temp file
  const tempFile = '/tmp/ollama-payload.json';
  fs.writeFileSync(tempFile, JSON.stringify(payload));

  // Call Ollama API
  const command = `curl -s http://${OLLAMA_HOST}:${OLLAMA_PORT}/api/generate -d @${tempFile}`;

  const response = execSync(command, {
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024,
  });

  // Parse response and extract content
  const result = JSON.parse(response);
  let content = result.response || ''; // Use 'let' to allow modification for image URLs

  // Cleanup temp file
  fs.unlinkSync(tempFile);

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`✅ Generation completed in ${duration}s\n`);
  console.log('━'.repeat(70));
  console.log(content);
  console.log('━'.repeat(70));

  // Step 7: Process player images (for ranking posts)
  if (postType === 'ranking' && playerDataList.length > 0) {
    console.log(`\n🖼️  Step 7: Processing player images...`);
    const imageManager = new ImageManager();

    // Extract player-club pairs from the playerDataList array
    const playerImages = [];
    for (const playerData of playerDataList) {
      const playerName = playerData.name;
      const club = playerData.currentClub || playerData.team || 'Unknown';

      console.log(`\n📸 Processing: ${playerName} (${club})`);
      const imageUrl = await imageManager.getPlayerImage(playerName, club);

      playerImages.push({
        name: playerName,
        url: imageUrl,
        normalized: imageManager.normalizePlayerName(playerName)
      });
    }

    // Replace placeholder image URLs in content with actual WordPress URLs
    for (const img of playerImages) {
      const placeholderPattern = new RegExp(
        `https://www\\.afriquesports\\.net/wp-content/uploads/players/${img.normalized}\\.jpg`,
        'g'
      );
      content = content.replace(placeholderPattern, img.url);
    }

    console.log(`\n✅ Processed ${playerImages.length} player images`);
  }

  // Statistics
  const wordCount = content.trim().split(/\s+/).length;
  const hasRealData = factSheet.length > 0;
  console.log(`\n📊 Statistics:`);
  console.log(`   Word count: ${wordCount} words`);
  console.log(`   Generation time: ${duration}s`);
  console.log(`   Speed: ${(wordCount / parseFloat(duration)).toFixed(1)} words/second`);
  console.log(`   Post type: ${postType}`);
  console.log(`   Data source: ${hasRealData ? '✅ Real API data' : '📝 General knowledge'}`);

  // Save output
  const outputFile = `generated-content-${post.post_id}.txt`;
  fs.writeFileSync(outputFile, content);
  console.log(`\n💾 Saved to: ${outputFile}`);
}

// Run
generateWithRealData().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
