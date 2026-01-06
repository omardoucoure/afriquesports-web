#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function debug() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  try {
    const playerName = 'Pedri';
    const searchUrl = `https://fbref.com/en/search/search.fcgi?search=${encodeURIComponent(playerName)}`;

    console.log(`Searching: ${searchUrl}\n`);
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 2000));

    await page.screenshot({ path: 'fbref-search-results.png', fullPage: true });
    console.log('✅ Screenshot: fbref-search-results.png');

    const results = await page.evaluate(() => {
      const found = [];

      // Get all search result items
      const items = document.querySelectorAll('.search-item');

      items.forEach((item, i) => {
        if (i < 10) {
          const link = item.querySelector('a[href*="/players/"]');
          found.push({
            text: item.textContent.trim(),
            href: link ? link.href : null,
          });
        }
      });

      // If no .search-item, try other selectors
      if (found.length === 0) {
        const allLinks = document.querySelectorAll('a[href*="/players/"]');
        allLinks.forEach((link, i) => {
          if (i < 10) {
            found.push({
              text: link.textContent.trim(),
              href: link.href,
              parent: link.parentElement?.textContent.trim().substring(0, 100),
            });
          }
        });
      }

      return found;
    });

    console.log('\n📋 Search results:');
    console.log(JSON.stringify(results, null, 2));

    console.log('\n⏸️  Browser staying open for 15s...');
    await new Promise(resolve => setTimeout(resolve, 15000));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

debug();
