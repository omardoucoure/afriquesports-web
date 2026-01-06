#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function check() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  try {
    await page.goto('https://fbref.com/en/players/0d9b2d31/Pedri', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 3000));

    const html = await page.content();

    // Check if stats table is in comments
    const commentMatch = html.match(/<!--\s*<div[^>]*id="div_stats_standard_dom_lg"[\s\S]*?-->/);

    if (commentMatch) {
      console.log('✅ Found stats table in HTML comments!');
      console.log('FBref hides data in comments to prevent scraping.\n');

      // Extract table from comment
      const commentedTable = commentMatch[0];
      const tableMatch = commentedTable.match(/<table[\s\S]*?<\/table>/);

      if (tableMatch) {
        console.log('✅ Extracted table from comment');
        console.log('Sample:', tableMatch[0].substring(0, 500) + '...');
      }
    } else {
      console.log('❌ Stats table NOT in comments');
      console.log('Checking if table exists in normal DOM...\n');

      const tableInDOM = await page.evaluate(() => {
        const table = document.querySelector('#stats_standard_dom_lg');
        return {
          exists: !!table,
          rowCount: table ? table.querySelectorAll('tbody tr').length : 0,
          firstCellText: table ? table.querySelector('tbody tr td')?.textContent.trim() : null,
        };
      });

      console.log('Table in DOM:', JSON.stringify(tableInDOM, null, 2));
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

check();
