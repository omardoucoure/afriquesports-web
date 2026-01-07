/**
 * Quality Validator
 *
 * Validates FactSheet completeness and quality before generation.
 * Ensures all required data is present and consistent.
 */

const { addQualityCheck, PostType } = require('./schema');

/**
 * Minimum requirements by post type
 */
const REQUIREMENTS = {
  [PostType.RANKING]: {
    minEntities: 5,
    minPlayerFacts: 5,
    minEvidence: 3,
    requiresLockedRanking: true,
    minConfidence: 0.7
  },
  [PostType.NEWS]: {
    minEntities: 1,
    minPlayerFacts: 0,
    minEvidence: 1,
    requiresLockedRanking: false,
    minConfidence: 0.6
  },
  [PostType.RECAP]: {
    minEntities: 2,
    minPlayerFacts: 0,
    minEvidence: 2,
    requiresLockedRanking: false,
    minConfidence: 0.7
  },
  [PostType.PROFILE]: {
    minEntities: 1,
    minPlayerFacts: 1,
    minEvidence: 2,
    requiresLockedRanking: false,
    minConfidence: 0.8
  },
  default: {
    minEntities: 1,
    minPlayerFacts: 0,
    minEvidence: 0,
    requiresLockedRanking: false,
    minConfidence: 0.5
  }
};

/**
 * Run all quality checks on FactSheet
 */
function validateQuality(factSheet) {
  const postType = factSheet.meta.postType;
  const reqs = REQUIREMENTS[postType] || REQUIREMENTS.default;

  console.log(`   🔍 Validating FactSheet (type: ${postType})...`);

  // Clear previous checks
  factSheet.quality.checks = [];
  factSheet.quality.validationStatus = 'pending';

  // 1. Check entity count
  const entityCount = factSheet.entities.length;
  addQualityCheck(
    factSheet,
    'entity_count',
    entityCount >= reqs.minEntities ? 'pass' : 'fail',
    `Found ${entityCount} entities (min: ${reqs.minEntities})`
  );

  // 2. Check player facts
  const playerFactsCount = factSheet.structuredFacts.players.length;
  addQualityCheck(
    factSheet,
    'player_facts',
    playerFactsCount >= reqs.minPlayerFacts ? 'pass' : 'fail',
    `Found ${playerFactsCount} player facts (min: ${reqs.minPlayerFacts})`
  );

  // 3. Check evidence
  const evidenceCount = factSheet.evidence.length;
  addQualityCheck(
    factSheet,
    'evidence_count',
    evidenceCount >= reqs.minEvidence ? 'pass' : 'warn',
    `Found ${evidenceCount} evidence items (min: ${reqs.minEvidence})`
  );

  // 4. Check locked ranking (for ranking posts)
  if (reqs.requiresLockedRanking) {
    const hasRanking = factSheet.lockedFacts.rankingLocked.length > 0;
    addQualityCheck(
      factSheet,
      'locked_ranking',
      hasRanking ? 'pass' : 'fail',
      hasRanking ? `Ranking locked with ${factSheet.lockedFacts.rankingLocked.length} items` : 'No locked ranking'
    );
  }

  // 5. Check entity confidence
  const lowConfidence = factSheet.entities.filter(e => e.confidence < reqs.minConfidence);
  addQualityCheck(
    factSheet,
    'entity_confidence',
    lowConfidence.length === 0 ? 'pass' : 'warn',
    lowConfidence.length === 0
      ? 'All entities have sufficient confidence'
      : `${lowConfidence.length} entities with low confidence: ${lowConfidence.map(e => e.name).join(', ')}`
  );

  // 6. Check for unresolved entities
  const unresolved = factSheet.entities.filter(e =>
    !e.ids.transfermarktId && e.kind === 'player'
  );
  addQualityCheck(
    factSheet,
    'entity_resolution',
    unresolved.length === 0 ? 'pass' : 'warn',
    unresolved.length === 0
      ? 'All player entities have Transfermarkt IDs'
      : `${unresolved.length} unresolved: ${unresolved.map(e => e.name).join(', ')}`
  );

  // 7. Check evidence freshness
  const staleEvidence = factSheet.evidence.filter(ev => {
    const published = new Date(ev.publishedAt);
    const daysSincePublished = (Date.now() - published.getTime()) / (1000 * 60 * 60 * 24);
    return daysSincePublished > 30;
  });
  addQualityCheck(
    factSheet,
    'evidence_freshness',
    staleEvidence.length <= factSheet.evidence.length / 2 ? 'pass' : 'warn',
    staleEvidence.length === 0
      ? 'All evidence is fresh (< 30 days)'
      : `${staleEvidence.length} stale evidence items`
  );

  // 8. Check evidence trust scores
  const avgTrust = factSheet.evidence.length > 0
    ? factSheet.evidence.reduce((sum, ev) => sum + ev.trustScore, 0) / factSheet.evidence.length
    : 0;
  addQualityCheck(
    factSheet,
    'evidence_trust',
    avgTrust >= 0.6 ? 'pass' : avgTrust >= 0.4 ? 'warn' : 'fail',
    `Average trust score: ${(avgTrust * 100).toFixed(0)}%`
  );

  // 9. Check player facts completeness
  const incompleteFacts = factSheet.structuredFacts.players.filter(pf => {
    const f = pf.fields;
    return !f.currentClub || !f.position || !f.marketValue;
  });
  addQualityCheck(
    factSheet,
    'facts_completeness',
    incompleteFacts.length === 0 ? 'pass' : 'warn',
    incompleteFacts.length === 0
      ? 'All player facts are complete'
      : `${incompleteFacts.length} players with incomplete facts`
  );

  // 10. Check stats availability (for ranking)
  if (postType === PostType.RANKING) {
    const missingStats = factSheet.structuredFacts.players.filter(pf => !pf.fields.stats);
    addQualityCheck(
      factSheet,
      'stats_availability',
      missingStats.length <= factSheet.structuredFacts.players.length / 3 ? 'pass' : 'warn',
      missingStats.length === 0
        ? 'All players have stats'
        : `${missingStats.length} players missing stats`
    );
  }

  // Calculate final status
  const failures = factSheet.quality.checks.filter(c => c.status === 'fail');
  const warnings = factSheet.quality.checks.filter(c => c.status === 'warn');

  if (failures.length > 0) {
    factSheet.quality.validationStatus = 'fail';
  } else if (warnings.length > 0) {
    factSheet.quality.validationStatus = 'warn';
  } else {
    factSheet.quality.validationStatus = 'pass';
  }

  // Log results
  console.log(`   ✅ ${factSheet.quality.checks.filter(c => c.status === 'pass').length} passed`);
  if (warnings.length > 0) {
    console.log(`   ⚠️  ${warnings.length} warnings`);
  }
  if (failures.length > 0) {
    console.log(`   ❌ ${failures.length} failures`);
    failures.forEach(f => console.log(`      - ${f.name}: ${f.details}`));
  }

  return {
    status: factSheet.quality.validationStatus,
    passed: failures.length === 0,
    failures: failures.map(f => f.name),
    warnings: warnings.map(w => w.name)
  };
}

/**
 * Format quality report for display
 */
function formatQualityReport(factSheet) {
  const output = [];

  output.push(`\n📋 QUALITY REPORT: ${factSheet.quality.validationStatus.toUpperCase()}`);
  output.push('─'.repeat(50));

  for (const check of factSheet.quality.checks) {
    const icon = check.status === 'pass' ? '✅' : check.status === 'warn' ? '⚠️' : '❌';
    output.push(`${icon} ${check.name}: ${check.details}`);
  }

  return output.join('\n');
}

/**
 * Check if FactSheet is ready for generation
 */
function isReadyForGeneration(factSheet) {
  return factSheet.quality.validationStatus !== 'fail';
}

module.exports = {
  validateQuality,
  formatQualityReport,
  isReadyForGeneration,
  REQUIREMENTS
};
