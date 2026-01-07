/**
 * FactSheet Builder
 *
 * Orchestrates the full pipeline:
 * 1. Entity resolution
 * 2. Structured facts collection
 * 3. Evidence gathering (RAG)
 * 4. Ranking computation
 * 5. Quality validation
 */

const {
  createFactSheet,
  PostType,
  computeSourceHash,
  toJSON
} = require('./schema');

const { resolveEntities } = require('./entity-resolver');
const { collectPlayerFacts, formatPlayerFactsForDebug } = require('./facts-collector');
const { gatherEvidence, formatEvidenceForDebug } = require('./evidence-gatherer');
const { computeRanking, formatRankingForPrompt } = require('./ranking-scorer');
const { validateQuality, formatQualityReport, isReadyForGeneration } = require('./quality-validator');

/**
 * Build a FactSheet for a ranking post
 */
async function buildRankingFactSheet(options) {
  const {
    title,
    category,
    playerNames,
    teamNames = [],
    rankingSize = 10,
    positionFilter = null,
    language = 'fr-FR'
  } = options;

  console.log('\n📊 Building FactSheet for Ranking Post');
  console.log('─'.repeat(50));

  // 1. Create empty FactSheet
  console.log('\n1️⃣  Creating FactSheet structure...');
  const factSheet = createFactSheet({
    postType: PostType.RANKING,
    title,
    language
  });

  // 2. Resolve entities
  console.log('\n2️⃣  Resolving entities...');
  const { playerRefs, teamRefs } = resolveEntities(factSheet, playerNames, teamNames);
  console.log(`   ✅ Resolved ${playerRefs.length} players, ${teamRefs.length} teams`);

  // Log resolution quality
  const highConfidence = playerRefs.filter(p => p.confidence >= 0.8);
  const lowConfidence = playerRefs.filter(p => p.confidence < 0.5);
  if (lowConfidence.length > 0) {
    console.log(`   ⚠️  Low confidence: ${lowConfidence.map(p => p.name).join(', ')}`);
  }

  // 3. Collect structured facts
  console.log('\n3️⃣  Collecting structured facts...');
  const factsResult = await collectPlayerFacts(factSheet, playerRefs);
  console.log(`   ✅ Collected facts for ${factsResult.collected.length} players`);
  if (factsResult.missing.length > 0) {
    console.log(`   ⚠️  Missing: ${factsResult.missing.join(', ')}`);
  }

  // 4. Gather evidence from RAG
  console.log('\n4️⃣  Gathering evidence from RAG...');
  const evidenceResult = await gatherEvidence(factSheet, { topic: title });

  // 5. Compute ranking
  console.log('\n5️⃣  Computing ranking...');
  const rankingResult = computeRanking(factSheet, {
    limit: rankingSize,
    positionFilter
  });

  // 6. Validate quality
  console.log('\n6️⃣  Validating quality...');
  const qualityResult = validateQuality(factSheet);

  // 7. Compute source hash
  computeSourceHash(factSheet);

  console.log('\n' + '─'.repeat(50));
  console.log(`✅ FactSheet built: ${factSheet.meta.id}`);
  console.log(`   Hash: ${factSheet.meta.sourceLogHash}`);
  console.log(`   Status: ${qualityResult.status.toUpperCase()}`);

  return factSheet;
}

/**
 * Build a FactSheet for a news post
 */
async function buildNewsFactSheet(options) {
  const {
    title,
    category,
    playerNames = [],
    teamNames = [],
    language = 'fr-FR'
  } = options;

  console.log('\n📰 Building FactSheet for News Post');
  console.log('─'.repeat(50));

  const factSheet = createFactSheet({
    postType: PostType.NEWS,
    title,
    language
  });

  // Resolve entities
  console.log('\n1️⃣  Resolving entities...');
  const { playerRefs, teamRefs } = resolveEntities(factSheet, playerNames, teamNames);

  // Collect facts if players mentioned
  if (playerNames.length > 0) {
    console.log('\n2️⃣  Collecting player facts...');
    await collectPlayerFacts(factSheet, playerRefs);
  }

  // Gather evidence
  console.log('\n3️⃣  Gathering evidence...');
  await gatherEvidence(factSheet, { topic: title });

  // Validate
  console.log('\n4️⃣  Validating quality...');
  validateQuality(factSheet);

  computeSourceHash(factSheet);

  return factSheet;
}

/**
 * Format FactSheet as prompt context for LLM
 */
function formatFactSheetForPrompt(factSheet) {
  const sections = [];

  // Meta info
  sections.push(`📋 TYPE: ${factSheet.meta.postType.toUpperCase()}`);
  sections.push(`📰 TITRE: ${factSheet.meta.title}`);
  sections.push(`🌍 LANGUE: ${factSheet.meta.language}`);
  sections.push(`📅 SAISON: ${factSheet.constraints.season}`);
  sections.push('');

  // For ranking posts, show locked ranking
  if (factSheet.meta.postType === PostType.RANKING) {
    sections.push(formatRankingForPrompt(factSheet));
    sections.push('');
  }

  // Structured facts
  if (factSheet.structuredFacts.players.length > 0) {
    sections.push('📊 DONNÉES VÉRIFIÉES:');
    sections.push('');

    for (const ref of factSheet.lockedFacts.rankingLocked || []) {
      const playerFact = factSheet.structuredFacts.players.find(p => p.entityRef === ref);
      const entity = factSheet.entities.find(e => e.ids.internalId === ref);

      if (playerFact && entity) {
        const f = playerFact.fields;
        sections.push(`**${entity.name}** (${f.nationality})`);
        sections.push(`  • Club: ${f.currentClub} | Position: ${f.position}`);
        sections.push(`  • Âge: ${f.age} ans | Valeur: ${f.marketValue}`);
        if (f.stats) {
          sections.push(`  • Stats ${f.season}: ${f.stats.goals}G, ${f.stats.assists}A en ${f.stats.appearances} matchs`);
          if (f.stats.rating) {
            sections.push(`  • Note moyenne: ${f.stats.rating}/10`);
          }
        }
        sections.push('');
      }
    }
  }

  // Evidence snippets (limited)
  if (factSheet.evidence.length > 0) {
    sections.push('📰 CONTEXTE ACTUALITÉS:');
    sections.push('');

    // Group by entity
    const evidenceByEntity = new Map();
    for (const ev of factSheet.evidence.slice(0, 15)) {
      for (const ref of ev.entityRefs) {
        if (!evidenceByEntity.has(ref)) {
          evidenceByEntity.set(ref, []);
        }
        evidenceByEntity.get(ref).push(ev);
      }
    }

    for (const [ref, evs] of evidenceByEntity) {
      const entity = factSheet.entities.find(e => e.ids.internalId === ref);
      if (entity && evs.length > 0) {
        sections.push(`${entity.name}:`);
        for (const ev of evs.slice(0, 2)) {
          sections.push(`  • ${ev.snippet} (${ev.publisher})`);
        }
        sections.push('');
      }
    }
  }

  return sections.join('\n');
}

/**
 * Export FactSheet to file
 */
function exportFactSheet(factSheet, filepath) {
  const fs = require('fs');
  fs.writeFileSync(filepath, toJSON(factSheet));
  console.log(`   💾 Exported to: ${filepath}`);
}

/**
 * Debug print FactSheet
 */
function debugPrint(factSheet) {
  console.log('\n' + '═'.repeat(60));
  console.log('FACTSHEET DEBUG OUTPUT');
  console.log('═'.repeat(60));

  console.log('\n📋 META:');
  console.log(`   ID: ${factSheet.meta.id}`);
  console.log(`   Type: ${factSheet.meta.postType}`);
  console.log(`   Title: ${factSheet.meta.title}`);
  console.log(`   Hash: ${factSheet.meta.sourceLogHash}`);

  console.log('\n👥 ENTITIES:');
  factSheet.entities.forEach(e => {
    console.log(`   [${e.kind}] ${e.name} (conf: ${e.confidence})`);
    console.log(`      IDs: TM=${e.ids.transfermarktId || 'N/A'}`);
  });

  console.log(formatPlayerFactsForDebug(factSheet));
  console.log(formatEvidenceForDebug(factSheet));
  console.log(formatQualityReport(factSheet));

  console.log('\n' + '═'.repeat(60));
}

module.exports = {
  buildRankingFactSheet,
  buildNewsFactSheet,
  formatFactSheetForPrompt,
  exportFactSheet,
  debugPrint,
  isReadyForGeneration
};
