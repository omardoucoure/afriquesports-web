#!/usr/bin/env node
/**
 * Test Ollama integration for journalist narrative generation
 */

const { generatePlayerNarrative, isOllamaAvailable, OLLAMA_MODEL } = require('./journalist-narrative-generator');

// Sample player for testing
const testPlayer = {
  name: 'Jude Bellingham',
  team: 'Real Madrid',
  nationality: 'England',
  age: '21',
  marketValue: '180M EUR',
  positionDetail: 'Midfield - Attacking Midfield',
  stats: { goals: 8, assists: 6, appearances: 18, competition: 'La Liga' },
  score: 425.50,
  position: 1
};

async function main() {
  console.log('='.repeat(60));
  console.log('OLLAMA JOURNALIST NARRATIVE TEST');
  console.log('='.repeat(60));

  console.log(`\n📦 Model: ${OLLAMA_MODEL}`);

  console.log('\n🔍 Checking Ollama availability...');
  const isAvailable = await isOllamaAvailable();

  if (isAvailable) {
    console.log('✅ Ollama is RUNNING\n');

    // Generate narrative for test player
    console.log(`📝 Generating narrative for ${testPlayer.name}...`);
    console.log('   (This may take 20-60 seconds with 14B model)\n');

    const startTime = Date.now();

    const narrative = await generatePlayerNarrative(testPlayer, 1, 10, {
      language: 'fr',
      useAI: true
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('-'.repeat(60));
    console.log('GENERATED NARRATIVE:');
    console.log('-'.repeat(60));

    // Clean HTML for display
    const cleanNarrative = narrative
      .replace(/<p>/g, '')
      .replace(/<\/p>/g, '\n\n')
      .trim();

    console.log(cleanNarrative);

    // Stats
    const wordCount = cleanNarrative.split(/\s+/).length;
    console.log('\n' + '-'.repeat(60));
    console.log(`⏱️  Generation time: ${elapsed}s`);
    console.log(`📊 Word count: ${wordCount} words`);
    console.log(`🎯 Target: 300-400 words`);
    console.log('-'.repeat(60));

  } else {
    console.log('❌ Ollama is NOT RUNNING');
    console.log('\n💡 Start Ollama with: ollama serve');
  }

  console.log('\n' + '='.repeat(60));
}

main().catch(console.error);
