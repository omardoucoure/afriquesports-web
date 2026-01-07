/**
 * Evidence Gatherer
 *
 * Fetches relevant news/articles from RAG system,
 * transforms into FactSheet evidence format with URLs and trust scores.
 */

const http = require('http');
const { addEvidence } = require('./schema');

// RAG API configuration
const RAG_API_URL = process.env.RAG_API_URL || 'http://192.168.2.217:8100';

/**
 * Publisher trust scores (0-1)
 * Higher = more authoritative
 */
const PUBLISHER_TRUST = {
  'real-france': 0.7,      // Fan site, good for Real Madrid news
  'africatopsports': 0.75, // Established African sports site
  'le10sport': 0.65,       // French sports aggregator
  'lequipe': 0.9,          // Major French sports daily
  'marca': 0.85,           // Major Spanish sports daily
  'gazzetta': 0.85,        // Italian sports authority
  'bbc': 0.95,             // Very reliable
  'espn': 0.9,             // Major sports network
  'transfermarkt': 0.95,   // Market value authority
  'default': 0.5
};

/**
 * Claim type detection patterns
 */
const CLAIM_PATTERNS = {
  transfer_rumor: /transfert|mercato|rumeur|intéressé|ciblé|pisté|approché/i,
  injury_update: /blessé|blessure|absent|forfait|indisponible|soigné/i,
  contract_news: /contrat|prolongation|signature|engagement|officiel/i,
  match_report: /victoire|défaite|match|rencontre|score|résultat/i,
  performance: /performance|statistique|but|passe|note|élu/i,
  coach_quote: /déclaré|affirmé|expliqué|répondu|annoncé/i
};

/**
 * Make HTTP request to RAG API
 */
async function ragRequest(endpoint, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, RAG_API_URL);

    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname,
      method: body ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 15000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('RAG API timeout'));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

/**
 * Check if RAG API is available
 */
async function isRagAvailable() {
  try {
    const response = await ragRequest('/health');
    return response.status === 200;
  } catch {
    return false;
  }
}

/**
 * Detect claim types from text
 */
function detectClaimTypes(text) {
  const types = [];
  for (const [type, pattern] of Object.entries(CLAIM_PATTERNS)) {
    if (pattern.test(text)) {
      types.push(type);
    }
  }
  return types.length > 0 ? types : ['general'];
}

/**
 * Get trust score for publisher
 */
function getTrustScore(publisher) {
  const normalized = publisher.toLowerCase().replace(/[^a-z0-9]/g, '');

  for (const [key, score] of Object.entries(PUBLISHER_TRUST)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return score;
    }
  }

  return PUBLISHER_TRUST.default;
}

/**
 * Search RAG for relevant articles
 */
async function searchRAG(query, options = {}) {
  const { nResults = 5, sourceFilter = null } = options;

  try {
    const body = {
      query,
      n_results: nResults
    };

    if (sourceFilter) {
      body.source_filter = sourceFilter;
    }

    const response = await ragRequest('/search', body);

    if (response.status !== 200) {
      throw new Error(`RAG search error: ${response.status}`);
    }

    return response.data.results || [];
  } catch (error) {
    console.log(`   ⚠️  RAG search error: ${error.message}`);
    return [];
  }
}

/**
 * Gather evidence for entities in FactSheet
 */
async function gatherEvidence(factSheet, options = {}) {
  const results = {
    gathered: 0,
    byEntity: {},
    errors: []
  };

  // Check RAG availability
  if (!await isRagAvailable()) {
    console.log('   ⚠️  RAG API not available');
    results.errors.push('RAG API not available');
    return results;
  }

  console.log('   🔍 Gathering evidence from RAG...');

  // Gather evidence for each player entity
  const playerEntities = factSheet.entities.filter(e => e.kind === 'player');

  for (const entity of playerEntities.slice(0, 10)) { // Limit to 10 players
    try {
      const query = `${entity.name} actualité football`;
      const articles = await searchRAG(query, { nResults: 3 });

      results.byEntity[entity.name] = [];

      for (const article of articles) {
        const evidenceId = addEvidence(factSheet, {
          url: article.url || `https://${article.source}/article`,
          publisher: article.source,
          publishedAt: article.date || new Date().toISOString(),
          snippet: truncateSnippet(article.content || article.title, 200),
          trustScore: getTrustScore(article.source),
          claimTags: detectClaimTypes(article.content || article.title),
          entityRefs: [entity.ids.internalId]
        });

        results.byEntity[entity.name].push(evidenceId);
        results.gathered++;
      }
    } catch (error) {
      results.errors.push(`${entity.name}: ${error.message}`);
    }

    // Rate limiting
    await sleep(100);
  }

  // Gather evidence for team entities
  const teamEntities = factSheet.entities.filter(e => e.kind === 'team');

  for (const entity of teamEntities.slice(0, 5)) { // Limit to 5 teams
    try {
      const query = `${entity.name} équipe actualité`;
      const articles = await searchRAG(query, { nResults: 2 });

      results.byEntity[entity.name] = [];

      for (const article of articles) {
        const evidenceId = addEvidence(factSheet, {
          url: article.url || `https://${article.source}/article`,
          publisher: article.source,
          publishedAt: article.date || new Date().toISOString(),
          snippet: truncateSnippet(article.content || article.title, 200),
          trustScore: getTrustScore(article.source),
          claimTags: detectClaimTypes(article.content || article.title),
          entityRefs: [entity.ids.internalId]
        });

        results.byEntity[entity.name].push(evidenceId);
        results.gathered++;
      }
    } catch (error) {
      results.errors.push(`${entity.name}: ${error.message}`);
    }

    await sleep(100);
  }

  // Gather topic-level evidence
  if (options.topic) {
    try {
      console.log(`   🔍 Gathering topic evidence: ${options.topic.slice(0, 40)}...`);
      const articles = await searchRAG(options.topic, { nResults: 3 });

      for (const article of articles) {
        addEvidence(factSheet, {
          url: article.url || `https://${article.source}/article`,
          publisher: article.source,
          publishedAt: article.date || new Date().toISOString(),
          snippet: truncateSnippet(article.content || article.title, 300),
          trustScore: getTrustScore(article.source),
          claimTags: detectClaimTypes(article.content || article.title),
          entityRefs: [] // Topic-level, not entity-specific
        });
        results.gathered++;
      }
    } catch (error) {
      results.errors.push(`Topic: ${error.message}`);
    }
  }

  console.log(`   ✅ Gathered ${results.gathered} evidence items`);

  return results;
}

/**
 * Truncate snippet to max length
 */
function truncateSnippet(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Format evidence for display/debugging
 */
function formatEvidenceForDebug(factSheet) {
  const output = [];

  output.push(`\n📰 EVIDENCE (${factSheet.evidence.length} items):`);

  for (const ev of factSheet.evidence) {
    const entityNames = ev.entityRefs.map(ref => {
      const entity = factSheet.entities.find(e => e.ids.internalId === ref);
      return entity?.name || ref;
    }).join(', ');

    output.push(`
  [${ev.id}] ${ev.publisher} (trust: ${ev.trustScore})
  Tags: ${ev.claimTags.join(', ')}
  Entities: ${entityNames || 'topic-level'}
  "${ev.snippet.slice(0, 100)}..."
`);
  }

  return output.join('\n');
}

module.exports = {
  isRagAvailable,
  searchRAG,
  gatherEvidence,
  detectClaimTypes,
  getTrustScore,
  formatEvidenceForDebug,
  PUBLISHER_TRUST
};
