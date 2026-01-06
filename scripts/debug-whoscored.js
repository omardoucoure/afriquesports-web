#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function debug() {
  const browser = await puppeteer.launch({
    headless: false, // Visible to see what happens
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  try {
    const searchUrl = 'https://www.whoscored.com/Search/?q=Pedri';

    console.log('Opening:', searchUrl);
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 3000));

    await page.screenshot({ path: 'whoscored-search.png', fullPage: true });
    console.log('✅ Screenshot: whoscored-search.png');

    const searchResults = await page.evaluate(() => {
      const results = {
        allLinks: [],
        playerLinks: [],
        pageText: document.body.textContent.substring(0, 500),
      };

      // Get all links
      const links = document.querySelectorAll('a');
      links.forEach((link, i) => {
        if (i < 20) {
          results.allLinks.push({
            href: link.href,
            text: link.textContent.trim().substring(0, 100),
          });
        }

        if (link.href && link.href.includes('/Players/')) {
          results.playerLinks.push({
            href: link.href,
            text: link.textContent.trim(),
          });
        }
      });

      return results;
    });

    console.log('\n📋 Search results:');
    console.log(JSON.stringify(searchResults, null, 2));

    console.log('\n⏸️  Browser staying open for 15 seconds...');
    await new Promise(resolve => setTimeout(resolve, 15000));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

debug();
