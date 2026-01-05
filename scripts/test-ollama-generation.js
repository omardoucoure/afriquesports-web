const fs = require('fs');
const { parse } = require('csv-parse/sync');

async function testGeneration() {
  console.log('🧪 Testing Ollama content generation with ONE post...\n');

  // Read top posts with full metadata
  const csvContent = fs.readFileSync('top-500-posts.csv', 'utf-8');
  const posts = parse(csvContent, { columns: true });

  // Pick rank #1 post (highest traffic)
  const testPost = posts[0];

  console.log('📄 Test Post:');
  console.log(`   Rank: ${testPost.rank}`);
  console.log(`   Title: ${testPost.title}`);
  console.log(`   Clicks: ${testPost.clicks}`);
  console.log(`   URL: ${testPost.url}`);
  console.log(`   Category: ${testPost.category}\n`);

  // Prepare prompt - IMPROVED to prevent hallucinations
  const prompt = `Tu es un journaliste sportif francophone expert.

Sujet: ${testPost.title}
Catégorie: ${testPost.category}

⚠️ RÈGLES CRITIQUES - NE PAS INVENTER DE DONNÉES:
❌ NE cite PAS de clubs spécifiques si tu n'es pas certain
❌ NE mentionne PAS d'âges, transferts ou statistiques précises
❌ NE fais PAS de liste avec "Joueur X (Club Y, Z ans)"
✅ Écris une ANALYSE GÉNÉRALE du sujet
✅ Parle des QUALITÉS et COMPÉTENCES requises
✅ Analyse les TENDANCES tactiques du football moderne
✅ Reste dans le GÉNÉRAL, pas le spécifique

APPROCHE À UTILISER:
Au lieu de "Pedri (Barcelone, 22 ans) - Le maestro"
→ Écris sur "Les qualités d'un grand meneur de jeu moderne"

Au lieu de "Fabinho a rejoint Al-Ittihad en 2023"
→ Écris sur "L'évolution du rôle de milieu défensif"

STRUCTURE (600-800 mots):

1. INTRODUCTION (150-200 mots)
   - Importance du sujet dans le football actuel
   - Contexte du football moderne à ce poste/thème
   - Pourquoi c'est pertinent pour les fans africains/européens

2. ANALYSE QUALITATIVE (400-500 mots)
   - Qualités techniques recherchées
   - Évolution tactique du poste/rôle
   - Comparaison des styles de jeu (créatif vs défensif, etc.)
   - Tendances dans les grands championnats
   - Impact sur les stratégies d'équipe

3. PERSPECTIVES (100-150 mots)
   - Avenir de ce type de joueur/poste
   - Enjeux pour les compétitions à venir
   - Importance pour le football africain si pertinent

STYLE:
- Analytique et conceptuel
- Vocabulaire technique du football
- Pas de liste avec noms/clubs/âges
- Pas de "en conclusion" ou formules artificielles
- Ne PAS écrire le titre (fourni séparément)

Écris l'article général maintenant:`;

  console.log('🚀 Starting generation...');
  const startTime = Date.now();

  try {
    // Call Ollama API via SSH tunnel
    const { execSync } = require('child_process');

    // Create temp file with prompt
    const promptFile = `/tmp/ollama-prompt-${Date.now()}.txt`;
    fs.writeFileSync(promptFile, prompt);

    // Call Ollama on remote server
    const command = `ssh root@159.223.103.16 "export OLLAMA_MODELS=/mnt/volume_nyc1_01/ollama && cat << 'PROMPT_EOF' | ollama run llama3.2:3b
${prompt}
PROMPT_EOF"`;

    const content = execSync(command, {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(1);

    console.log(`✅ Generation completed in ${duration}s\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(content);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Count words
    const wordCount = content.trim().split(/\s+/).length;
    console.log(`📊 Statistics:`);
    console.log(`   Word count: ${wordCount} words`);
    console.log(`   Generation time: ${duration}s`);
    console.log(`   Speed: ${(wordCount / parseFloat(duration)).toFixed(1)} words/second`);

    // Estimate full batch
    const estimatedTimePerPost = parseFloat(duration);
    const totalPosts = 499;
    const totalHours = (estimatedTimePerPost * totalPosts / 3600).toFixed(1);
    const totalDays = (totalHours / 24).toFixed(1);

    console.log(`\n⏱️  Full Batch Estimate:`);
    console.log(`   Posts: ${totalPosts}`);
    console.log(`   Total time: ~${totalHours} hours (~${totalDays} days)`);
    console.log(`   Posts per day: ~${(totalPosts / parseFloat(totalDays)).toFixed(0)}`);

    // Clean up
    if (fs.existsSync(promptFile)) {
      fs.unlinkSync(promptFile);
    }

  } catch (error) {
    console.error('❌ Error during generation:', error.message);
    process.exit(1);
  }
}

testGeneration().catch(console.error);
