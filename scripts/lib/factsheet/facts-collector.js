/**
 * Structured Facts Collector
 *
 * Fetches player/team data from scrapers and cache,
 * transforms into FactSheet structuredFacts format.
 */

const { addPlayerFacts } = require('./schema');
const PlayerDataCache = require('../player-data-cache');
const DataMerger = require('../scrapers/data-merger');

/**
 * Collect player facts for FactSheet
 */
async function collectPlayerFacts(factSheet, entityRefs) {
  const cache = new PlayerDataCache();
  await cache.init();

  const results = {
    collected: [],
    missing: [],
    errors: []
  };

  try {
    // Find player entities
    const playerEntities = factSheet.entities.filter(e => e.kind === 'player');

    // Get player names to fetch
    const playerNames = playerEntities.map(e => e.name);

    // Check cache first
    const cachedResults = await cache.getMultiple(playerNames);
    const playersToFetch = [];
    const cachedData = new Map();

    cachedResults.forEach(({ playerName, cached }) => {
      if (cached && cached.success) {
        cachedData.set(playerName.toLowerCase(), cached);
      } else {
        playersToFetch.push(playerName);
      }
    });

    console.log(`   💾 Facts cache: ${cachedData.size} hits, ${playersToFetch.length} misses`);

    // Fetch missing players from scrapers
    let freshData = [];
    if (playersToFetch.length > 0) {
      console.log(`   🌐 Scraping ${playersToFetch.length} players...`);
      try {
        const merger = new DataMerger();
        freshData = await merger.fetchPlayersData(playersToFetch);

        // Cache the results
        for (const result of freshData) {
          await cache.set(result.playerName, result);
          if (result.success) {
            cachedData.set(result.playerName.toLowerCase(), result);
          }
        }
      } catch (err) {
        console.log(`   ⚠️  Scraper error: ${err.message}`);
        results.errors.push(err.message);
      }
    }

    // Transform cached data into structuredFacts
    for (const entity of playerEntities) {
      const cached = cachedData.get(entity.name.toLowerCase());

      if (cached && cached.data) {
        const data = cached.data;
        const fields = transformPlayerData(data);

        addPlayerFacts(factSheet, entity.ids.internalId, fields, 'transfermarkt+espn');

        results.collected.push({
          name: entity.name,
          entityRef: entity.ids.internalId,
          fieldsCount: Object.keys(fields).length
        });
      } else {
        results.missing.push(entity.name);
      }
    }

    // Get cache stats
    const stats = await cache.getStats();
    console.log(`   📊 Cache stats: ${stats.valid} valid, ${stats.expired} expired`);

  } finally {
    await cache.close();
  }

  return results;
}

/**
 * Transform raw scraper data into structured fields
 */
function transformPlayerData(data) {
  return {
    // Basic info
    fullName: data.name,
    age: data.age,
    nationality: data.nationality,
    birthDate: data.birthDate || null,

    // Current status
    currentClub: data.currentClub,
    position: data.position,
    shirtNumber: data.shirtNumber || null,
    preferredFoot: data.preferredFoot || null,
    contractUntil: data.contractUntil || null,

    // Market value
    marketValue: data.marketValue,
    marketValueNumeric: parseMarketValue(data.marketValue),

    // Current season stats
    season: data.stats?.season || null,
    stats: data.stats ? {
      competition: data.stats.competition || null,
      appearances: data.stats.appearances || 0,
      goals: data.stats.goals || 0,
      assists: data.stats.assists || 0,
      minutesPlayed: data.stats.minutesPlayed || 0,
      yellowCards: data.stats.yellowCards || 0,
      redCards: data.stats.redCards || 0,
      rating: data.stats.rating || null
    } : null,

    // Physical attributes
    height: data.height || null,
    weight: data.weight || null,

    // Agent info
    agent: data.agent || null,

    // URLs for verification
    transfermarktUrl: data.transfermarktUrl || null,
    espnUrl: data.espnUrl || null
  };
}

/**
 * Parse market value string to numeric (in millions)
 */
function parseMarketValue(valueStr) {
  if (!valueStr) return null;

  const normalized = valueStr.toLowerCase().replace(/[€$£]/g, '');

  if (normalized.includes('m')) {
    return parseFloat(normalized.replace('m', ''));
  }
  if (normalized.includes('k')) {
    return parseFloat(normalized.replace('k', '')) / 1000;
  }

  return parseFloat(normalized) || null;
}

/**
 * Collect match facts (for recap/preview posts)
 */
async function collectMatchFacts(factSheet, matchId) {
  // TODO: Implement match data collection from ESPN/SofaScore
  console.log('   ⚠️  Match facts collection not yet implemented');
  return { collected: [], missing: [], errors: ['Not implemented'] };
}

/**
 * Collect team facts
 */
async function collectTeamFacts(factSheet, entityRefs) {
  // TODO: Implement team data collection
  console.log('   ⚠️  Team facts collection not yet implemented');
  return { collected: [], missing: [], errors: ['Not implemented'] };
}

/**
 * Format player facts for display/debugging
 */
function formatPlayerFactsForDebug(factSheet) {
  const output = [];

  for (const playerFact of factSheet.structuredFacts.players) {
    const entity = factSheet.entities.find(e => e.ids.internalId === playerFact.entityRef);
    const f = playerFact.fields;

    output.push(`
📊 ${entity?.name || playerFact.entityRef}
   Club: ${f.currentClub} | Position: ${f.position}
   Age: ${f.age} | Nationality: ${f.nationality}
   Value: ${f.marketValue}
   Season ${f.season}: ${f.stats?.goals || 0}G, ${f.stats?.assists || 0}A in ${f.stats?.appearances || 0} matches
   Source: ${playerFact.source} | TTL: ${playerFact.ttlSeconds}s
`);
  }

  return output.join('\n');
}

module.exports = {
  collectPlayerFacts,
  collectMatchFacts,
  collectTeamFacts,
  transformPlayerData,
  parseMarketValue,
  formatPlayerFactsForDebug
};
