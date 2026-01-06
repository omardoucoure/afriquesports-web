#!/usr/bin/env node

/**
 * Test SofaScore with direct player URL approach
 */

const puppeteer = require('puppeteer');

async function test() {
  console.log('🔍 Testing SofaScore Direct Access\n');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  try {
    // Try known Pedri URL structure on SofaScore
    // Format: sofascore.com/player/name/id
    console.log('Trying direct player page...');

    // Let's try the main search page first to see structure
    await page.goto('https://www.sofascore.com/player/pedri/933115', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    await new Promise(resolve => setTimeout(resolve, 5000));

    await page.screenshot({ path: 'sofascore-pedri-direct.png', fullPage: true });
    console.log('✅ Screenshot: sofascore-pedri-direct.png');

    // Check if we're on the player page
    const pageInfo = await page.evaluate(() => {
      return {
        url: window.location.href,
        title: document.title,
        hasPlayerInfo: !!document.querySelector('[class*="player"], h2, h1'),
      };
    });

    console.log('\n📍 Page info:');
    console.log(JSON.stringify(pageInfo, null, 2));

    // Try to find statistics section
    console.log('\n🔍 Looking for statistics...');

    // Scroll down to load stats
    await page.evaluate(() => window.scrollTo(0, 1000));
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Look for "Statistics" tab and click it
    const statsTabFound = await page.evaluate(() => {
      const tabs = document.querySelectorAll('button, a, div[role="tab"]');
      for (let tab of tabs) {
        if (tab.textContent.toLowerCase().includes('statistic') ||
            tab.textContent.toLowerCase().includes('stats')) {
          tab.click();
          return true;
        }
      }
      return false;
    });

    if (statsTabFound) {
      console.log('✅ Found and clicked statistics tab');
      await new Promise(resolve => setTimeout(resolve, 3000));
      await page.screenshot({ path: 'sofascore-stats-tab.png', fullPage: true });
    }

    // Extract all visible text that might be stats
    const potentialStats = await page.evaluate(() => {
      const stats = {};
      const elements = document.querySelectorAll('*');

      elements.forEach(el => {
        const text = el.textContent;
        if (text && text.length < 100) {
          // Look for number patterns
          if (text.match(/^\d+$/) && el.previousElementSibling) {
            const label = el.previousElementSibling.textContent;
            if (label && label.length < 30) {
              stats[label.trim()] = text.trim();
            }
          }

          // Look for rating pattern (e.g., "7.23")
          if (text.match(/^\d+\.\d+$/)) {
            const parent = el.parentElement;
            if (parent) {
              const label = parent.textContent.replace(text, '').trim();
              if (label.length < 30) {
                stats[label || 'rating'] = text;
              }
            }
          }
        }
      });

      // Also look for specific keywords
      const keywords = ['goals', 'assists', 'appearances', 'rating', 'matches'];
      keywords.forEach(keyword => {
        const regex = new RegExp(keyword + '.*?(\\d+)', 'i');
        const match = document.body.textContent.match(regex);
        if (match) {
          stats[keyword] = match[1];
        }
      });

      return stats;
    });

    console.log('\n📊 Potential statistics found:');
    console.log(JSON.stringify(potentialStats, null, 2));

    console.log('\n⏸️  Keeping browser open for 15 seconds...');
    await new Promise(resolve => setTimeout(resolve, 15000));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

test();
