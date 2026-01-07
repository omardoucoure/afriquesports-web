/**
 * Ranking Scorer
 *
 * Deterministic algorithm to rank players based on structured facts.
 * The LLM MUST NOT change the ranking - it's computed here.
 */

const { lockRanking } = require('./schema');

/**
 * Scoring weights by position
 */
const POSITION_WEIGHTS = {
  // Attacking midfielders - goals and assists matter more
  'Attacking Midfield': {
    goals: 12,
    assists: 10,
    appearances: 1,
    rating: 8,
    marketValue: 5,
    age: 2,         // Younger is better
    minutesPlayed: 0.5
  },

  // Central midfielders - balanced
  'Central Midfield': {
    goals: 8,
    assists: 10,
    appearances: 2,
    rating: 10,
    marketValue: 5,
    age: 2,
    minutesPlayed: 0.5
  },

  // Defensive midfielders - assists and appearances matter more
  'Defensive Midfield': {
    goals: 5,
    assists: 8,
    appearances: 3,
    rating: 12,
    marketValue: 4,
    age: 1,
    minutesPlayed: 0.5
  },

  // Default weights
  'default': {
    goals: 10,
    assists: 10,
    appearances: 2,
    rating: 10,
    marketValue: 5,
    age: 2,
    minutesPlayed: 0.5
  }
};

/**
 * League multipliers (top 5 leagues get bonus)
 */
const LEAGUE_MULTIPLIERS = {
  'Premier League': 1.1,
  'LaLiga': 1.08,
  'Serie A': 1.05,
  'Bundesliga': 1.05,
  'Ligue 1': 1.02,
  'default': 1.0
};

/**
 * Get scoring weights for position
 */
function getWeights(position) {
  return POSITION_WEIGHTS[position] || POSITION_WEIGHTS.default;
}

/**
 * Get league multiplier
 */
function getLeagueMultiplier(league) {
  for (const [key, mult] of Object.entries(LEAGUE_MULTIPLIERS)) {
    if (league && league.toLowerCase().includes(key.toLowerCase())) {
      return mult;
    }
  }
  return LEAGUE_MULTIPLIERS.default;
}

/**
 * Calculate player score from structured facts
 */
function calculatePlayerScore(fields) {
  const weights = getWeights(fields.position);
  const stats = fields.stats || {};

  const components = {
    goals: (stats.goals || 0) * weights.goals,
    assists: (stats.assists || 0) * weights.assists,
    appearances: (stats.appearances || 0) * weights.appearances,
    rating: ((stats.rating || 7) - 6) * weights.rating * 10, // Normalized: 6.0 = 0, 8.0 = 20
    marketValue: Math.log10((fields.marketValueNumeric || 1) + 1) * weights.marketValue * 10,
    age: Math.max(0, (32 - (fields.age || 28))) * weights.age, // Peak at ~24-26
    minutesPlayed: (stats.minutesPlayed || 0) / 100 * weights.minutesPlayed
  };

  // Apply league multiplier
  const leagueMult = getLeagueMultiplier(stats.competition);

  // Calculate base score
  let baseScore = Object.values(components).reduce((sum, v) => sum + v, 0);

  // Apply multiplier
  const finalScore = baseScore * leagueMult;

  return {
    score: Math.round(finalScore * 100) / 100,
    components,
    leagueMultiplier: leagueMult,
    position: fields.position
  };
}

/**
 * Rank all players in FactSheet and lock the ranking
 */
function computeRanking(factSheet, options = {}) {
  const { limit = 10, positionFilter = null } = options;

  console.log('   🔢 Computing deterministic ranking...');

  const scores = [];

  // Calculate score for each player
  for (const playerFact of factSheet.structuredFacts.players) {
    const entity = factSheet.entities.find(e => e.ids.internalId === playerFact.entityRef);

    if (!entity) continue;

    // Apply position filter if specified
    if (positionFilter) {
      const position = (playerFact.fields.position || '').toLowerCase();
      if (!positionFilter.some(p => position.includes(p.toLowerCase()))) {
        continue;
      }
    }

    const result = calculatePlayerScore(playerFact.fields);

    scores.push({
      entityRef: playerFact.entityRef,
      name: entity.name,
      score: result.score,
      components: result.components
    });
  }

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  // Take top N
  const topScores = scores.slice(0, limit);

  // Store in decisions
  factSheet.decisions.scoringModel = 'v1.0-weighted-stats';
  factSheet.decisions.scores = topScores;

  // Lock the ranking order
  const rankedRefs = topScores.map(s => s.entityRef);
  lockRanking(factSheet, rankedRefs);

  console.log(`   ✅ Ranked ${topScores.length} players`);

  // Debug output
  topScores.forEach((s, i) => {
    console.log(`   ${i + 1}. ${s.name}: ${s.score} pts`);
  });

  return {
    ranking: topScores,
    model: factSheet.decisions.scoringModel
  };
}

/**
 * Format ranking for LLM prompt (read-only)
 */
function formatRankingForPrompt(factSheet) {
  const output = [];

  output.push('🏆 CLASSEMENT DÉFINITIF (ne pas modifier):');
  output.push('');

  for (let i = 0; i < factSheet.lockedFacts.rankingLocked.length; i++) {
    const ref = factSheet.lockedFacts.rankingLocked[i];
    const entity = factSheet.entities.find(e => e.ids.internalId === ref);
    const score = factSheet.decisions.scores.find(s => s.entityRef === ref);
    const playerFact = factSheet.structuredFacts.players.find(p => p.entityRef === ref);

    if (entity && playerFact) {
      const f = playerFact.fields;
      output.push(`${i + 1}. **${entity.name}** (${f.currentClub}, ${f.nationality})`);
      output.push(`   Score: ${score?.score || 'N/A'} pts | Valeur: ${f.marketValue}`);
      if (f.stats) {
        output.push(`   Stats ${f.season}: ${f.stats.goals}G, ${f.stats.assists}A en ${f.stats.appearances} matchs`);
      }
      output.push('');
    }
  }

  return output.join('\n');
}

/**
 * Validate that writer output respects locked ranking
 */
function validateRankingRespected(factSheet, generatedContent) {
  const ranking = factSheet.lockedFacts.rankingLocked;
  const errors = [];

  // Extract player names in order from generated content
  // Look for patterns like "1. Pedri" or "#1 Pedri" or "**1. Pedri**"
  const rankPattern = /(?:^|\n)\s*(?:\*\*)?#?(\d+)[.\s\-:]+(?:\*\*)?([^,\n(]+)/g;
  const foundOrder = [];
  let match;

  while ((match = rankPattern.exec(generatedContent)) !== null) {
    const rank = parseInt(match[1]);
    const name = match[2].trim().replace(/\*\*/g, '');
    foundOrder.push({ rank, name });
  }

  // Verify order matches locked ranking
  for (const { rank, name } of foundOrder) {
    if (rank > 0 && rank <= ranking.length) {
      const expectedRef = ranking[rank - 1];
      const expectedEntity = factSheet.entities.find(e => e.ids.internalId === expectedRef);

      if (expectedEntity) {
        const expectedName = expectedEntity.name.toLowerCase();
        const foundName = name.toLowerCase();

        // Check if names match (allowing for partial matches)
        if (!foundName.includes(expectedName) && !expectedName.includes(foundName)) {
          errors.push(`Rank ${rank}: Expected "${expectedEntity.name}", found "${name}"`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  calculatePlayerScore,
  computeRanking,
  formatRankingForPrompt,
  validateRankingRespected,
  getWeights,
  getLeagueMultiplier,
  POSITION_WEIGHTS,
  LEAGUE_MULTIPLIERS
};
