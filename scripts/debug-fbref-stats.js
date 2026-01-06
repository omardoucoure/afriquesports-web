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
    const playerUrl = 'https://fbref.com/en/players/0d9b2d31/Pedri';

    console.log(`Opening: ${playerUrl}\n`);
    await page.goto(playerUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 3000));

    await page.screenshot({ path: 'fbref-pedri-stats.png', fullPage: true });
    console.log('✅ Screenshot: fbref-pedri-stats.png');

    const debugInfo = await page.evaluate(() => {
      const info = {
        tablesFound: [],
        firstTableStats: null,
      };

      // Find all stats tables
      const tables = document.querySelectorAll('table');
      info.tablesFound = Array.from(tables).map(t => ({
        id: t.id,
        classes: t.className,
        caption: t.querySelector('caption')?.textContent.trim(),
        rowCount: t.querySelectorAll('tbody tr').length,
      }));

      // Try to get stats from first standard stats table
      const statsTable = document.querySelector('#stats_standard_dom_lg, table[id*="stats_standard"]');

      if (statsTable) {
        info.firstTableStats = {
          tableId: statsTable.id,
          headers: [],
          firstRowData: [],
        };

        // Get headers
        const headers = statsTable.querySelectorAll('thead th');
        info.firstTableStats.headers = Array.from(headers).map(th => ({
          text: th.textContent.trim(),
          dataAttr: th.getAttribute('data-stat'),
        }));

        // Get first data row
        const firstRow = statsTable.querySelector('tbody tr');
        if (firstRow) {
          const cells = firstRow.querySelectorAll('td, th');
          info.firstTableStats.firstRowData = Array.from(cells).map(td => ({
            text: td.textContent.trim(),
            dataAttr: td.getAttribute('data-stat'),
          }));
        }
      }

      return info;
    });

    console.log('\n📊 Debug info:');
    console.log(JSON.stringify(debugInfo, null, 2));

    console.log('\n⏸️  Browser staying open for 20s...');
    await new Promise(resolve => setTimeout(resolve, 20000));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

debug();
