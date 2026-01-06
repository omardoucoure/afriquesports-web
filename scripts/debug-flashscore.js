#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function debug() {
  const browser = await puppeteer.launch({
    headless: false, // Visible browser to see what happens
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  try {
    console.log('Step 1: Opening Flashscore homepage...');
    await page.goto('https://www.flashscore.com', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 3000));

    await page.screenshot({ path: 'flashscore-homepage.png' });
    console.log('✅ Screenshot: flashscore-homepage.png');

    console.log('\nStep 2: Looking for search button...');
    const searchElements = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button, a, div[class*="search"], [class*="Search"]');
      const found = [];

      buttons.forEach((el, i) => {
        if (i < 20) {
          const text = el.textContent.trim();
          const classes = el.className;
          if (text.toLowerCase().includes('search') || classes.toLowerCase().includes('search')) {
            found.push({
              text: text.substring(0, 50),
              classes,
              tag: el.tagName,
            });
          }
        }
      });

      return found;
    });

    console.log('Search elements found:');
    console.log(JSON.stringify(searchElements, null, 2));

    console.log('\nStep 3: Trying to open search (clicking)...');
    const searchClicked = await page.evaluate(() => {
      // Try multiple selectors
      const selectors = [
        'button[title*="search" i]',
        '.searchButton',
        '[class*="searchIcon"]',
        'button[class*="header"] svg',
      ];

      for (let selector of selectors) {
        const el = document.querySelector(selector);
        if (el) {
          el.click();
          return true;
        }
      }

      return false;
    });

    console.log(`Search clicked: ${searchClicked}`);
    await new Promise(resolve => setTimeout(resolve, 2000));

    await page.screenshot({ path: 'flashscore-after-search-click.png' });
    console.log('✅ Screenshot: flashscore-after-search-click.png');

    console.log('\nStep 4: Trying to type in search...');
    // Try keyboard shortcut (Ctrl+K or Cmd+K often opens search)
    await page.keyboard.down('Meta');
    await page.keyboard.press('K');
    await page.keyboard.up('Meta');

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Type player name
    await page.keyboard.type('Pedri', { delay: 100 });
    await new Promise(resolve => setTimeout(resolve, 3000));

    await page.screenshot({ path: 'flashscore-search-results.png', fullPage: true });
    console.log('✅ Screenshot: flashscore-search-results.png');

    // Check what appeared
    const searchResults = await page.evaluate(() => {
      const results = [];
      const allLinks = document.querySelectorAll('a[href*="player"], [class*="search"], [class*="result"]');

      allLinks.forEach((el, i) => {
        if (i < 20) {
          results.push({
            text: el.textContent.trim().substring(0, 100),
            href: el.href,
            classes: el.className,
          });
        }
      });

      return results;
    });

    console.log('\n📋 Search results:');
    console.log(JSON.stringify(searchResults, null, 2));

    console.log('\n⏸️  Browser staying open for 30 seconds...');
    await new Promise(resolve => setTimeout(resolve, 30000));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

debug();
