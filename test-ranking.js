/**
 * Test script for ranking content generation
 * Run: node test-ranking.js
 */

// Generate a test admin token for this session
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'test-token-for-ranking-demo';

async function testRankingGeneration() {
  console.log('🧪 Testing Ranking Content Generation\n');
  console.log('Topic: Top 5 African Goalkeepers CAN 2025\n');

  const requestBody = {
    contentType: 'ranking',
    locale: 'fr',
    params: {
      topic: 'Top 5 meilleurs gardiens de but CAN 2025',
      criteria: 'Performances, arrêts décisifs, clean sheets, impact sur l\'équipe',
      count: 5,
      region: 'Afrique',
      timeframe: 'CAN 2025'
    }
  };

  console.log('📤 Request:');
  console.log(JSON.stringify(requestBody, null, 2));
  console.log('\n⏳ Generating content... (this may take 25-30 seconds)\n');

  const startTime = Date.now();

  try {
    const response = await fetch('http://localhost:3001/api/rag/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    if (result.success) {
      console.log(`✅ Generation successful! (${duration}s)\n`);

      console.log('📊 Metadata:');
      console.log(`- Context items used: ${result.metadata.contextItemsUsed}`);
      console.log(`- Context tokens: ${result.metadata.totalTokensContext}`);
      console.log(`- Generated tokens: ${result.metadata.generationTokens}`);
      console.log(`- Speed: ${result.metadata.tokensPerSecond.toFixed(1)} tokens/s`);
      console.log(`- Sources: ${result.metadata.sources.join(', ')}`);
      console.log(`- Total duration: ${duration}s\n`);

      console.log('📝 Generated Content Preview:');
      console.log('─'.repeat(80));
      // Strip HTML tags for console display
      const textContent = result.content
        .replace(/<[^>]+>/g, '')
        .trim()
        .substring(0, 1000);
      console.log(textContent);
      console.log('...\n');
      console.log('─'.repeat(80));

      console.log(`\n📄 Full content length: ${result.content.length} characters`);
      console.log(`   Word count: ~${result.content.split(/\s+/).length} words`);

      // Save to file
      const fs = require('fs');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `generated-ranking-${timestamp}.html`;
      fs.writeFileSync(filename, result.content);
      console.log(`\n💾 Full content saved to: ${filename}`);

    } else {
      console.log('❌ Generation failed!');
      console.log(`Error: ${result.error}`);
    }

  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

// Run the test
testRankingGeneration();
