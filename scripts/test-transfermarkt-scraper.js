#!/usr/bin/env node

/**
 * Test Transfermarkt Scraper
 *
 * Debug script to test if Transfermarkt scraping works
 */

const TransfermarktScraper = require('./lib/scrapers/transfermarkt-scraper');

async function testScraper() {
  console.log('🧪 Testing Transfermarkt Scraper\n');

  const scraper = new TransfermarktScraper();

  // Test with different player names
  const testPlayers = [
    'Pedri',
    'Pedri González',
    'Vitinha',
    'Fabio Vieira', // Vitinha's real name
    'Rúben Neves',
    'Neves',
  ];

  for (const playerName of testPlayers) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing: ${playerName}`);
    console.log('='.repeat(60));

    try {
      const result = await scraper.searchPlayer(playerName);

      if (result) {
        console.log('\n✅ SUCCESS:');
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log('\n❌ FAILED: No data returned');
      }
    } catch (error) {
      console.error('\n❌ ERROR:', error.message);
    }

    // Wait between players
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  console.log('\n' + '='.repeat(60));
  console.log('Test completed');
}

testScraper().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
