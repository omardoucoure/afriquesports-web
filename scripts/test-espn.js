#!/usr/bin/env node

const ESPNScraper = require('./lib/scrapers/espn-scraper');

async function test() {
  const scraper = new ESPNScraper();

  const players = ['Pedri', 'Vitinha', 'João Neves'];

  console.log('Testing ESPN scraper...\n');

  for (const playerName of players) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing: ${playerName}`);
    console.log('='.repeat(60));

    const result = await scraper.searchPlayer(playerName);

    if (result) {
      console.log('\n✅ SUCCESS!');
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`\n❌ Failed to scrape ${playerName}`);
    }

    // Wait between players
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  await scraper.closeBrowser();
  console.log('\n✅ All tests complete');
}

test();
