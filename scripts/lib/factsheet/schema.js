/**
 * FactSheet Schema and Types
 *
 * Structured data contract between retrieval pipeline and LLM writer.
 * Ensures reproducibility, traceability, and no hallucination.
 */

const crypto = require('crypto');

// UUID v4 using built-in crypto (no external dependency)
function uuidv4() {
  return crypto.randomUUID();
}

/**
 * Post types supported by the system
 */
const PostType = {
  RANKING: 'ranking',
  NEWS: 'news',
  RECAP: 'recap',
  PROFILE: 'profile',
  TACTICAL: 'tactical',
  EVERGREEN: 'evergreen',
  LISTICLE: 'listicle',
  OTHER: 'other'
};

/**
 * Entity kinds for disambiguation
 */
const EntityKind = {
  PLAYER: 'player',
  TEAM: 'team',
  COMPETITION: 'competition',
  MATCH: 'match',
  COACH: 'coach',
  STADIUM: 'stadium',
  OTHER: 'other'
};

/**
 * Create empty FactSheet with required structure
 */
function createFactSheet(options = {}) {
  const now = new Date().toISOString();

  return {
    meta: {
      id: uuidv4(),
      createdAt: now,
      sourceLogHash: '',
      postType: options.postType || PostType.OTHER,
      language: options.language || 'fr-FR',
      title: options.title || ''
    },

    constraints: {
      locale: options.locale || 'fr-FR',
      targetYear: options.targetYear || new Date().getFullYear(),
      season: options.season || getCurrentSeason(),
      dateRange: {
        from: options.dateFrom || getSeasonStart(),
        to: options.dateTo || new Date().toISOString().split('T')[0]
      },
      competitionLocks: options.competitions || [],
      lockedTerms: options.lockedTerms || []
    },

    entities: [],

    structuredFacts: {
      players: [],
      matches: [],
      teams: []
    },

    evidence: [],

    lockedFacts: {
      rankingLocked: [],
      eventFacts: {}
    },

    decisions: {
      scoringModel: '',
      scores: [],
      outline: []
    },

    quality: {
      validationStatus: 'pending',
      checks: []
    }
  };
}

/**
 * Get current football season (e.g., "2024-2025")
 */
function getCurrentSeason() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // Season starts in August
  if (month >= 8) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
}

/**
 * Get season start date
 */
function getSeasonStart() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  if (month >= 8) {
    return `${year}-08-01`;
  } else {
    return `${year - 1}-08-01`;
  }
}

/**
 * Add entity to FactSheet with deduplication
 */
function addEntity(factSheet, entity) {
  // Check for existing entity with same IDs
  const existing = factSheet.entities.find(e =>
    (e.ids.transfermarktId && e.ids.transfermarktId === entity.ids?.transfermarktId) ||
    (e.ids.internalId && e.ids.internalId === entity.ids?.internalId) ||
    (e.name.toLowerCase() === entity.name.toLowerCase() && e.kind === entity.kind)
  );

  if (existing) {
    // Merge IDs and aliases
    existing.ids = { ...existing.ids, ...entity.ids };
    existing.aliases = [...new Set([...(existing.aliases || []), ...(entity.aliases || [])])];
    existing.confidence = Math.max(existing.confidence, entity.confidence || 0);
    return existing.ids.internalId;
  }

  // Create new entity
  const internalId = entity.ids?.internalId || `${entity.kind}_${uuidv4().slice(0, 8)}`;
  factSheet.entities.push({
    kind: entity.kind,
    name: entity.name,
    aliases: entity.aliases || [],
    ids: {
      internalId,
      ...entity.ids
    },
    disambiguationNotes: entity.disambiguationNotes || '',
    confidence: entity.confidence || 0.5
  });

  return internalId;
}

/**
 * Add player structured facts
 */
function addPlayerFacts(factSheet, entityRef, fields, source) {
  factSheet.structuredFacts.players.push({
    entityRef,
    fields,
    retrievedAt: new Date().toISOString(),
    ttlSeconds: 3600, // 1 hour default
    source
  });
}

/**
 * Add evidence item
 */
function addEvidence(factSheet, evidence) {
  const id = `ev_${uuidv4().slice(0, 8)}`;
  factSheet.evidence.push({
    id,
    url: evidence.url,
    publisher: evidence.publisher,
    publishedAt: evidence.publishedAt || new Date().toISOString(),
    retrievedAt: new Date().toISOString(),
    snippet: evidence.snippet,
    trustScore: evidence.trustScore || 0.5,
    claimTags: evidence.claimTags || [],
    entityRefs: evidence.entityRefs || []
  });
  return id;
}

/**
 * Set ranking order (locked, LLM cannot change)
 */
function lockRanking(factSheet, orderedEntityRefs) {
  factSheet.lockedFacts.rankingLocked = orderedEntityRefs;
}

/**
 * Add quality check result
 */
function addQualityCheck(factSheet, name, status, details) {
  factSheet.quality.checks.push({ name, status, details });

  // Update overall status
  const hasFailures = factSheet.quality.checks.some(c => c.status === 'fail');
  const hasWarnings = factSheet.quality.checks.some(c => c.status === 'warn');

  if (hasFailures) {
    factSheet.quality.validationStatus = 'fail';
  } else if (hasWarnings) {
    factSheet.quality.validationStatus = 'warn';
  } else {
    factSheet.quality.validationStatus = 'pass';
  }
}

/**
 * Compute source log hash for reproducibility
 */
function computeSourceHash(factSheet) {
  const content = JSON.stringify({
    entities: factSheet.entities,
    structuredFacts: factSheet.structuredFacts,
    evidence: factSheet.evidence
  });

  factSheet.meta.sourceLogHash = crypto
    .createHash('sha256')
    .update(content)
    .digest('hex')
    .slice(0, 16);
}

/**
 * Validate FactSheet structure
 */
function validateFactSheet(factSheet) {
  const errors = [];

  // Meta checks
  if (!factSheet.meta.id) errors.push('Missing meta.id');
  if (!factSheet.meta.postType) errors.push('Missing meta.postType');
  if (!factSheet.meta.title) errors.push('Missing meta.title');

  // Entity checks
  if (factSheet.entities.length === 0) {
    errors.push('No entities defined');
  }

  // For ranking posts, check locked ranking
  if (factSheet.meta.postType === PostType.RANKING) {
    if (!factSheet.lockedFacts.rankingLocked || factSheet.lockedFacts.rankingLocked.length === 0) {
      errors.push('Ranking post requires lockedFacts.rankingLocked');
    }
  }

  // Evidence checks
  factSheet.evidence.forEach((ev, i) => {
    if (!ev.url) errors.push(`Evidence[${i}] missing URL`);
    if (!ev.publisher) errors.push(`Evidence[${i}] missing publisher`);
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Serialize FactSheet to JSON
 */
function toJSON(factSheet) {
  computeSourceHash(factSheet);
  return JSON.stringify(factSheet, null, 2);
}

/**
 * Parse FactSheet from JSON
 */
function fromJSON(json) {
  return JSON.parse(json);
}

module.exports = {
  PostType,
  EntityKind,
  createFactSheet,
  addEntity,
  addPlayerFacts,
  addEvidence,
  lockRanking,
  addQualityCheck,
  computeSourceHash,
  validateFactSheet,
  toJSON,
  fromJSON,
  getCurrentSeason,
  getSeasonStart
};
