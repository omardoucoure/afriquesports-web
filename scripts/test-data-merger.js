#!/usr/bin/env node

const DataMerger = require('./lib/scrapers/data-merger');

async function test() {
  const merger = new DataMerger();

  const players = ['Pedri', 'Vitinha', 'João Neves'];

  console.log('Testing data merger with Transfermarkt + ESPN...\n');

  for (const playerName of players) {
    const result = await merger.fetchPlayerData(playerName);

    if (result.success) {
      console.log('\n📝 Formatted for AI prompt:');
      console.log(merger.formatForPrompt(result));
    }

    console.log('\n' + '='.repeat(80) + '\n');
  }

  await merger.cleanup();
  console.log('✅ All tests complete');
}

test();
