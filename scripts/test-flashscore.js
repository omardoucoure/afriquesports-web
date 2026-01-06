#!/usr/bin/env node

const FlashscoreScraper = require('./lib/scrapers/flashscore-scraper');

async function test() {
  const scraper = new FlashscoreScraper();

  console.log('Testing Flashscore scraper for Pedri...\n');

  const result = await scraper.searchPlayer('Pedri');

  if (result) {
    console.log('\n✅ SUCCESS!');
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log('\n❌ Failed to scrape player data');
  }

  await scraper.closeBrowser();
}

test();
