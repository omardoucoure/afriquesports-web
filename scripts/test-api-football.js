#!/usr/bin/env node

const FootballAPI = require('./lib/football-api');

async function test() {
  const apiKey = '5c275ac95a16daf1881253242300f8ac';
  const api = new FootballAPI(apiKey);

  console.log('Testing API-Football with key:', apiKey.substring(0, 10) + '...\n');

  try {
    console.log('Searching for: Pedri');
    const player = await api.searchPlayer('Pedri');

    if (player) {
      console.log('\n✅ SUCCESS! Player data:');
      console.log(JSON.stringify(player, null, 2));
    } else {
      console.log('\n⚠️  No player found');
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Full error:', error);
  }
}

test();
