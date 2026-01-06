#!/usr/bin/env node

/**
 * Debug SofaScore Scraping - Take screenshots and inspect page structure
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

async function debug() {
  console.log('🔍 Debug SofaScore Scraping\n');

  const browser = await puppeteer.launch({
    headless: false, // Run with visible browser
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  try {
    const playerName = 'Pedri';

    // Go directly to Pedri's SofaScore page (we can get this from search)
    console.log('Step 1: Searching for player...');
    const searchUrl = `https://www.sofascore.com/search?q=${encodeURIComponent(playerName)}`;
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait a bit for search to load
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Take screenshot of search
    await page.screenshot({ path: 'sofascore-search.png', fullPage: true });
    console.log('✅ Screenshot saved: sofascore-search.png');

    // Get all search results
    const searchResults = await page.evaluate(() => {
      const results = [];
      const allElements = document.querySelectorAll('a[href*="/player/"]');

      allElements.forEach((el, i) => {
        if (i < 10) { // First 10 results
          results.push({
            href: el.href,
            text: el.textContent.trim(),
          });
        }
      });

      return results;
    });

    console.log('\n📋 Found player links:');
    console.log(JSON.stringify(searchResults, null, 2));

    if (searchResults.length > 0) {
      // Click first player
      const playerUrl = searchResults[0].href;
      console.log(`\nStep 2: Navigating to player profile: ${playerUrl}`);

      await page.goto(playerUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Take screenshot of player page
      await page.screenshot({ path: 'sofascore-player.png', fullPage: true });
      console.log('✅ Screenshot saved: sofascore-player.png');

      // Try to extract statistics
      const stats = await page.evaluate(() => {
        const data = {
          name: 'Unknown',
          team: 'Unknown',
          stats: {},
        };

        // Player name
        const nameEl = document.querySelector('h2, .sc-hLBbgP');
        if (nameEl) data.name = nameEl.textContent.trim();

        // Team
        const teamEl = document.querySelector('a[href*="/team/"]');
        if (teamEl) data.team = teamEl.textContent.trim();

        // Find all stat elements
        const statElements = document.querySelectorAll('[class*="stat"], [class*="Stat"]');
        console.log('Found stat elements:', statElements.length);

        // Try different selectors
        const allDivs = document.querySelectorAll('div');
        allDivs.forEach(div => {
          const text = div.textContent;
          if (text.includes('Goals') || text.includes('Assists') || text.includes('Rating')) {
            const parent = div.parentElement;
            if (parent) {
              data.stats[text] = parent.textContent;
            }
          }
        });

        return data;
      });

      console.log('\n📊 Extracted data:');
      console.log(JSON.stringify(stats, null, 2));

      // Get full page structure
      const pageStructure = await page.evaluate(() => {
        const structure = {
          allClasses: [],
          allTextWithGoals: [],
          allTextWithRating: [],
        };

        // Find unique classes
        const allElements = document.querySelectorAll('*');
        const classSet = new Set();
        allElements.forEach(el => {
          if (el.className && typeof el.className === 'string') {
            el.className.split(' ').forEach(c => classSet.add(c));
          }
        });
        structure.allClasses = Array.from(classSet).filter(c =>
          c.includes('stat') || c.includes('Stat') || c.includes('value')
        );

        // Find text containing "Goals" or "Rating"
        allElements.forEach((el, i) => {
          if (i < 1000) { // Limit to first 1000 elements
            const text = el.textContent;
            if (text && text.length < 50) {
              if (text.toLowerCase().includes('goals')) {
                structure.allTextWithGoals.push({
                  text,
                  tag: el.tagName,
                  class: el.className,
                });
              }
              if (text.toLowerCase().includes('rating')) {
                structure.allTextWithRating.push({
                  text,
                  tag: el.tagName,
                  class: el.className,
                });
              }
            }
          }
        });

        return structure;
      });

      console.log('\n🔍 Page structure analysis:');
      console.log('Classes with "stat":', pageStructure.allClasses);
      console.log('\nElements with "goals":', JSON.stringify(pageStructure.allTextWithGoals, null, 2));
      console.log('\nElements with "rating":', JSON.stringify(pageStructure.allTextWithRating, null, 2));
    }

    console.log('\n⏸️  Browser will stay open for 20 seconds so you can inspect...');
    await new Promise(resolve => setTimeout(resolve, 20000));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

debug();
