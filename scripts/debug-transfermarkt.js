#!/usr/bin/env node

/**
 * Debug Transfermarkt Scraping - Take screenshots to see what's happening
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

async function debug() {
  console.log('🔍 Debug Transfermarkt Scraping\n');

  const browser = await puppeteer.launch({
    headless: false, // Run with visible browser
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  try {
    const playerName = 'Pedri';
    const searchUrl = `https://www.transfermarkt.com/schnellsuche/ergebnis/schnellsuche?query=${encodeURIComponent(playerName)}`;

    console.log(`Navigating to: ${searchUrl}`);
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    // Take screenshot
    await page.screenshot({ path: 'transfermarkt-search-pedri.png', fullPage: true });
    console.log('✅ Screenshot saved: transfermarkt-search-pedri.png');

    // Get page HTML
    const html = await page.content();
    fs.writeFileSync('transfermarkt-search.html', html);
    console.log('✅ HTML saved: transfermarkt-search.html');

    // Try to find any links with player profiles
    const links = await page.evaluate(() => {
      const allLinks = Array.from(document.querySelectorAll('a[href*="spieler"]'));
      return allLinks.slice(0, 10).map(a => ({
        href: a.href,
        text: a.textContent.trim(),
        classes: a.className,
      }));
    });

    console.log('\n📋 Found links with "spieler":');
    console.log(JSON.stringify(links, null, 2));

    console.log('\n⏸️  Browser will stay open for 10 seconds so you can inspect...');
    await new Promise(resolve => setTimeout(resolve, 10000));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

debug();
