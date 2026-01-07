#!/usr/bin/env node

/**
 * Content Generation with FactSheet Architecture
 *
 * New pipeline:
 * 1. Build FactSheet (entities, facts, evidence, ranking)
 * 2. Validate quality
 * 3. Generate content from FactSheet (LLM cannot change locked facts)
 * 4. Validate output respects constraints
 *
 * Usage: node generate-with-factsheet.js --post-id=851539
 */

const fs = require('fs');
const { parse } = require('csv-parse/sync');
const { execSync } = require('child_process');

const {
  buildRankingFactSheet,
  buildNewsFactSheet,
  formatFactSheetForPrompt,
  exportFactSheet,
  debugPrint,
  isReadyForGeneration,
  validateRankingRespected,
  PostType
} = require('./lib/factsheet');

const EntityExtractor = require('./lib/entity-extractor');
const PostTypeDetector = require('./lib/post-type-detector');
const AutonomousResearcher = require('./lib/autonomous-researcher');

// Parse arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.replace('--', '').split('=');
  acc[key] = value || true;
  return acc;
}, {});

const postId = args['post-id'];
const modelName = args.model || 'qwen2.5:14b-instruct';
const dryRun = args['dry-run'];
const debug = args.debug;
const exportPath = args.export;

// Ollama Configuration
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'localhost';
const OLLAMA_PORT = process.env.OLLAMA_PORT || '11434';

/**
 * Generate ranking prompt from FactSheet
 */
function buildRankingPrompt(factSheet) {
  const context = formatFactSheetForPrompt(factSheet);
  const rankingSize = factSheet.lockedFacts.rankingLocked.length;

  return `Tu es un journaliste sportif expert. Écris un article de classement basé sur les données suivantes.

${context}

⚠️ RÈGLES STRICTES:
1. L'ORDRE DU CLASSEMENT EST VERROUILLÉ - ne le modifie PAS
2. Utilise UNIQUEMENT les statistiques fournies - ne les invente pas
3. Chaque joueur doit avoir un paragraphe de 120-150 mots

STRUCTURE OBLIGATOIRE:

1. INTRODUCTION (150-180 mots):
   Paragraphe captivant sur ce classement des milieux de terrain.

2. TABLE DES MATIÈRES:
   <h2>Le Top ${rankingSize} des Milieux de Terrain</h2>
   <ol>
   <li>{Nom Joueur 1} ({Club}, {Pays})</li>
   ...
   </ol>

3. CHAQUE JOUEUR (dans l'ordre EXACT du classement):

   <h3>{Nom du joueur}, {Club}, {Pays}</h3>

   <p>{Paragraphe narratif avec:
   - Statistiques EXACTES du factSheet
   - Valeur marchande EXACTE
   - Style de jeu et comparaisons
   - Impact sur l'équipe}</p>

   <div class="wp-caption aligncenter" style="max-width: 100%;">
     <img decoding="async"
          src="https://www.afriquesports.net/wp-content/uploads/players/{nom-joueur-slug}.jpg"
          alt="{Nom du joueur}"
          style="max-width: 100%; height: auto; display: block;">
     <p class="wp-caption-text">Source: {Club officiel}</p>
   </div>

MINIMUM 1500 mots. Commence maintenant:`;
}

/**
 * Generate news prompt from FactSheet
 */
function buildNewsPrompt(factSheet) {
  const context = formatFactSheetForPrompt(factSheet);

  return `Tu es un journaliste sportif. Écris un article d'actualité basé sur ces données:

${context}

⚠️ RÈGLES:
- Utilise UNIQUEMENT les faits fournis
- Style journalistique AFP/Reuters
- 600-800 mots

STRUCTURE:
1. Chapeau (50-80 mots) - Les 5W
2. Contexte (150-200 mots)
3. Développement (200-300 mots)
4. Perspectives (100-150 mots)

Commence:`;
}

/**
 * Main generation function
 */
async function generateWithFactSheet() {
  console.log('🤖 Content Generation with FactSheet Architecture\n');
  console.log('═'.repeat(60));

  // Load posts data
  const csvContent = fs.readFileSync('top-500-posts.csv', 'utf-8');
  const posts = parse(csvContent, { columns: true });

  // Find the post
  const post = postId
    ? posts.find(p => p.post_id === postId)
    : posts[0];

  if (!post) {
    console.error(`❌ Post not found: ${postId}`);
    process.exit(1);
  }

  console.log('📄 Post:');
  console.log(`   Title: ${post.title}`);
  console.log(`   Category: ${post.category}`);
  console.log(`   Rank: ${post.rank}`);
  console.log('');

  // Detect post type
  const detector = new PostTypeDetector();
  const postType = detector.detect(post.title, post.category);
  const rankingNumber = detector.extractRankingNumber(post.title);

  console.log(`📋 Detected type: ${postType}`);
  if (rankingNumber) {
    console.log(`   Ranking size: Top ${rankingNumber}`);
  }

  // Extract entities from title
  const extractor = new EntityExtractor();
  const titleEntities = extractor.extract(post.title);

  console.log(`👥 Title entities:`);
  console.log(`   Players: ${titleEntities.players.join(', ') || 'None'}`);
  console.log(`   Teams: ${titleEntities.teams.join(', ') || 'None'}`);

  // Use autonomous researcher to find more entities
  console.log('\n🤖 Running autonomous research...');
  const researcher = new AutonomousResearcher();
  const research = await researcher.research(post.title, post.category, postType);

  // Merge entities
  const entities = {
    players: [...new Set([...titleEntities.players, ...research.entities.players])],
    teams: [...new Set([...titleEntities.teams, ...research.entities.teams])]
  };

  console.log(`👥 Total entities after research:`);
  console.log(`   Players: ${entities.players.length} - ${entities.players.join(', ')}`);
  console.log(`   Teams: ${entities.teams.length}`);

  // Build FactSheet based on post type
  let factSheet;

  if (postType === 'ranking') {
    factSheet = await buildRankingFactSheet({
      title: post.title,
      category: post.category,
      playerNames: entities.players,
      teamNames: entities.teams,
      rankingSize: rankingNumber || 10,
      positionFilter: ['midfield'] // Filter for midfielders
    });
  } else {
    factSheet = await buildNewsFactSheet({
      title: post.title,
      category: post.category,
      playerNames: entities.players,
      teamNames: entities.teams
    });
  }

  // Debug output
  if (debug) {
    debugPrint(factSheet);
  }

  // Export FactSheet if requested
  if (exportPath) {
    exportFactSheet(factSheet, exportPath);
  }

  // Check if ready for generation
  if (!isReadyForGeneration(factSheet)) {
    console.error('\n❌ FactSheet validation failed. Cannot generate.');
    console.log('   Run with --debug to see details');
    process.exit(1);
  }

  // Dry run - show prompt only
  if (dryRun) {
    const prompt = postType === 'ranking'
      ? buildRankingPrompt(factSheet)
      : buildNewsPrompt(factSheet);

    console.log('\n🔍 DRY RUN - Prompt Preview:\n');
    console.log('─'.repeat(60));
    console.log(prompt);
    console.log('─'.repeat(60));
    console.log('\nℹ️  Run without --dry-run to generate content');

    // Export factsheet for inspection
    const factSheetPath = `factsheet-${post.post_id}.json`;
    exportFactSheet(factSheet, factSheetPath);

    return;
  }

  // Build prompt
  const prompt = postType === 'ranking'
    ? buildRankingPrompt(factSheet)
    : buildNewsPrompt(factSheet);

  // Generate with Ollama
  console.log(`\n🚀 Generating content with ${modelName}...`);
  console.log(`   Using: ${OLLAMA_HOST}:${OLLAMA_PORT}`);
  const startTime = Date.now();

  const payload = {
    model: modelName,
    prompt: prompt,
    stream: false,
    options: {
      num_ctx: 32768,
      temperature: 0.7,
      top_p: 0.9,
      repeat_penalty: 1.1
    }
  };

  const tempFile = '/tmp/ollama-factsheet-payload.json';
  fs.writeFileSync(tempFile, JSON.stringify(payload));

  const command = `curl -s http://${OLLAMA_HOST}:${OLLAMA_PORT}/api/generate -d @${tempFile}`;

  const response = execSync(command, {
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024,
    timeout: 300000 // 5 minutes
  });

  const result = JSON.parse(response);
  let content = result.response || '';

  fs.unlinkSync(tempFile);

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`\n✅ Generation completed in ${duration}s\n`);
  console.log('━'.repeat(70));
  console.log(content);
  console.log('━'.repeat(70));

  // Validate output respects locked ranking
  if (postType === 'ranking') {
    console.log('\n🔍 Validating ranking was respected...');
    const validation = validateRankingRespected(factSheet, content);

    if (validation.valid) {
      console.log('   ✅ Ranking order respected');
    } else {
      console.log('   ⚠️  Ranking violations:');
      validation.errors.forEach(err => console.log(`      - ${err}`));
    }
  }

  // Statistics
  const wordCount = content.trim().split(/\\s+/).length;
  console.log(`\n📊 Statistics:`);
  console.log(`   Word count: ${wordCount} words`);
  console.log(`   Generation time: ${duration}s`);
  console.log(`   Speed: ${(wordCount / parseFloat(duration)).toFixed(1)} words/second`);
  console.log(`   FactSheet ID: ${factSheet.meta.id}`);
  console.log(`   Source Hash: ${factSheet.meta.sourceLogHash}`);
  console.log(`   Quality Status: ${factSheet.quality.validationStatus}`);

  // Save outputs
  const outputFile = `generated-factsheet-${post.post_id}.txt`;
  const factSheetFile = `factsheet-${post.post_id}.json`;

  fs.writeFileSync(outputFile, content);
  exportFactSheet(factSheet, factSheetFile);

  console.log(`\n💾 Saved:`);
  console.log(`   Content: ${outputFile}`);
  console.log(`   FactSheet: ${factSheetFile}`);
}

// Run
generateWithFactSheet().catch(error => {
  console.error('❌ Error:', error.message);
  if (debug) {
    console.error(error.stack);
  }
  process.exit(1);
});
