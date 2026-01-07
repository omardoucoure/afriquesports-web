/**
 * FactSheet Module
 *
 * Structured data contract for content generation.
 * Ensures reproducibility, traceability, and no hallucination.
 */

const schema = require('./schema');
const entityResolver = require('./entity-resolver');
const factsCollector = require('./facts-collector');
const evidenceGatherer = require('./evidence-gatherer');
const rankingScorer = require('./ranking-scorer');
const qualityValidator = require('./quality-validator');
const builder = require('./builder');
const contentFormatter = require('./content-formatter');

module.exports = {
  // Schema and types
  ...schema,

  // Entity resolution
  ...entityResolver,

  // Facts collection
  ...factsCollector,

  // Evidence gathering
  ...evidenceGatherer,

  // Ranking
  ...rankingScorer,

  // Quality validation
  ...qualityValidator,

  // Builder (main API)
  ...builder,

  // Content formatting
  ...contentFormatter
};
