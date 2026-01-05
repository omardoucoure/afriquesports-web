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
const FootballAPI = require('./lib/football-api');
const EntityExtractor = require('./lib/entity-extractor');

// Parse arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.replace('--', '').split('=');
  acc[key] = value || true;
  return acc;
}, {});

const postId = args['post-id'];
const modelName = args.model || 'qwen2.5:14b';
const dryRun = args['dry-run'];

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

  // Step 1: Extract entities from title
  console.log('🔍 Step 1: Extracting entities...');
  const extractor = new EntityExtractor();
  const entities = extractor.extract(post.title);
  const dataNeeds = extractor.getDataNeeds(entities);

  console.log(`   Players found: ${entities.players.length ? entities.players.join(', ') : 'None'}`);
  console.log(`   Teams found: ${entities.teams.length ? entities.teams.join(', ') : 'None'}`);
  console.log(`   Topic type: ${entities.topic}\n`);

  // Step 2: Fetch real football data
  let factSheet = '';
  const footballAPI = new FootballAPI();

  if (dataNeeds.fetchPlayers && entities.players.length > 0) {
    console.log('🌐 Step 2: Fetching player data from API-Football...');

    try {
      const playersData = await footballAPI.getPlayersData(entities.players);

      if (playersData.length > 0) {
        factSheet += '\n📊 DONNÉES VÉRIFIÉES (2025):\n';
        playersData.forEach(player => {
          factSheet += `\n- **${player.name}** (${player.nationality})\n`;
          factSheet += `  • Âge: ${player.age} ans\n`;
          factSheet += `  • Club: ${player.club} (${player.country || 'International'})\n`;
          factSheet += `  • Poste: ${player.position}\n`;
          if (player.stats.goals > 0 || player.stats.assists > 0) {
            factSheet += `  • Statistiques 2024: ${player.stats.goals} buts, ${player.stats.assists} passes décisives en ${player.stats.appearances} matchs\n`;
          }
        });

        console.log(`   ✅ Fetched data for ${playersData.length} players`);
      } else {
        console.log('   ⚠️  No player data found');
      }
    } catch (error) {
      console.log(`   ⚠️  API unavailable: ${error.message}`);
      console.log('   📝 Continuing with general prompt...');
    }
  } else {
    console.log('ℹ️  Step 2: No specific players detected, using general approach\n');
  }

  // Step 3: Build enhanced prompt
  console.log('📝 Step 3: Building enhanced prompt...\n');

  const hasRealData = factSheet.length > 0;

  const prompt = hasRealData
    ? buildPromptWithData(post, factSheet)
    : buildGeneralPrompt(post);

  if (dryRun) {
    console.log('🔍 DRY RUN - Prompt Preview:\n');
    console.log('─'.repeat(60));
    console.log(prompt);
    console.log('─'.repeat(60));
    console.log('\nℹ️  Run without --dry-run to generate content');
    return;
  }

  // Step 4: Generate with Ollama
  console.log(`🚀 Step 4: Generating content with ${modelName}...`);
  const startTime = Date.now();

  const command = `ssh root@159.223.103.16 "export OLLAMA_MODELS=/mnt/volume_nyc1_01/ollama && cat << 'PROMPT_EOF' | ollama run ${modelName}
${prompt}
PROMPT_EOF"`;

  const content = execSync(command, {
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024,
  });

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`✅ Generation completed in ${duration}s\n`);
  console.log('━'.repeat(70));
  console.log(content);
  console.log('━'.repeat(70));

  // Statistics
  const wordCount = content.trim().split(/\s+/).length;
  console.log(`\n📊 Statistics:`);
  console.log(`   Word count: ${wordCount} words`);
  console.log(`   Generation time: ${duration}s`);
  console.log(`   Speed: ${(wordCount / parseFloat(duration)).toFixed(1)} words/second`);
  console.log(`   Data source: ${hasRealData ? '✅ Real API data' : '📝 General knowledge'}`);

  // Save output
  const outputFile = `generated-content-${post.post_id}.txt`;
  fs.writeFileSync(outputFile, content);
  console.log(`\n💾 Saved to: ${outputFile}`);
}

function buildPromptWithData(post, factSheet) {
  return `Tu es un journaliste sportif francophone expert.

Sujet: ${post.title}
Catégorie: ${post.category}

${factSheet}

⚠️ RÈGLES ABSOLUES - TRÈS IMPORTANT:
✅ Utilise UNIQUEMENT les données vérifiées ci-dessus
✅ Ces informations sont à jour (2025) et exactes
✅ N'invente JAMAIS d'autres clubs, âges, ou statistiques
✅ Si une info manque pour un joueur, reste général sur ce point
✅ Vise 600-900 mots si tu as assez d'informations réelles

STRUCTURE:

1. INTRODUCTION (100-150 mots)
   - Présente le contexte du sujet
   - Explique pourquoi c'est pertinent pour les fans

2. ANALYSE DÉTAILLÉE (400-600 mots)
   - Développe avec les données réelles fournies
   - Parle des clubs actuels, positions, statistiques
   - Compare les profils et qualités
   - Reste factuel avec les infos vérifiées

3. CONTEXTE & PERSPECTIVES (100-150 mots)
   - Évolutions récentes dans le football
   - Impact sur les compétitions
   - Perspectives pour la suite de la saison

STYLE:
- Professionnel et informatif
- Vocabulaire football riche
- Pas de formules de conclusion ("en conclusion", "pour conclure")
- Ne PAS écrire le titre (fourni séparément)

Écris l'article maintenant:`;
}

function buildGeneralPrompt(post) {
  return `Tu es un journaliste sportif francophone expert.

Sujet: ${post.title}
Catégorie: ${post.category}

⚠️ RÈGLES ABSOLUES - TRÈS IMPORTANT:
⚠️ N'invente JAMAIS de clubs, âges, transferts ou statistiques spécifiques
⚠️ Si tu ne connais pas une information EXACTE, ne la mentionne pas
⚠️ Reste GÉNÉRAL et analytique sur le sujet
⚠️ Vise 600-900 mots mais SEULEMENT si tu as assez d'informations réelles

APPROCHE GÉNÉRALE (sans données précises):

1. INTRODUCTION (150-200 mots)
   - Présente l'importance du sujet dans le football actuel
   - Contexte général du football moderne
   - Pourquoi ce sujet intéresse les fans

2. ANALYSE QUALITATIVE (400-500 mots)
   - Parle des QUALITÉS requises (ne cite pas de joueurs spécifiques si incertain)
   - Analyse les TENDANCES tactiques
   - Compare les STYLES de jeu
   - Évolutions du football moderne au poste/thème concerné

3. PERSPECTIVES (100-150 mots)
   - Impact sur le football africain/européen
   - Évolutions attendues
   - Enjeux pour les prochaines compétitions

STYLE:
- Professionnel et analytique
- Focus sur les concepts, pas les détails factuels incertains
- Vocabulaire technique du football
- Pas de conclusion artificielle
- Ne PAS écrire le titre

Écris l'article maintenant:`;
}

// Run
generateWithRealData().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
