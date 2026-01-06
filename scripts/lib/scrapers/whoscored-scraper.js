/**
 * WhoScored Scraper (Puppeteer Version)
 *
 * Scrapes player statistics from WhoScored.com:
 * - Goals, assists, appearances
 * - WhoScored rating (out of 10)
 * - Current season stats
 * - Yellow/red cards
 */

const puppeteer = require('puppeteer');

class WhoScoredScraper {
  constructor() {
    this.baseUrl = 'https://www.whoscored.com';
    this.browser = null;
  }

  async initBrowser() {
    if (!this.browser) {
      console.log('🌐 Launching browser for WhoScored...');
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-blink-features=AutomationControlled',
        ],
      });
      console.log('✅ Browser launched');
    }
    return this.browser;
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async delay(ms = 2000) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Search for player by name
   */
  async searchPlayer(playerName) {
    const browser = await this.initBrowser();
    const page = await browser.newPage();

    try {
      console.log(`🔍 Searching WhoScored for: ${playerName}`);

      // Set viewport and user agent
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

      // Navigate to search page with player name
      const searchUrl = `${this.baseUrl}/Search/?q=${encodeURIComponent(playerName)}`;
      await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      await this.delay(3000);

      // Find player link in search results
      const playerLink = await page.evaluate((searchName) => {
        // Look for player results
        const links = document.querySelectorAll('a[href*="/Players/"]');

        for (let link of links) {
          const text = link.textContent.toLowerCase();
          const href = link.href;

          if (text.includes(searchName.toLowerCase()) && href) {
            return href;
          }
        }

        return null;
      }, playerName);

      if (!playerLink) {
        console.log(`❌ No WhoScored results found for ${playerName}`);
        await page.close();
        return null;
      }

      console.log(`✅ Found player profile: ${playerLink}`);

      // Navigate to player page
      await this.delay(2000);
      await page.goto(playerLink, { waitUntil: 'networkidle2', timeout: 30000 });
      await this.delay(3000);

      // Extract player data
      const playerData = await page.evaluate(() => {
        const data = {
          name: 'Unknown',
          currentTeam: null,
          stats: {
            season: '2024/2025',
            appearances: 0,
            goals: 0,
            assists: 0,
            rating: null,
            yellowCards: 0,
            redCards: 0,
          },
        };

        // Player name
        const nameEl = document.querySelector('h1, .player-header-name, [class*="playerName"]');
        if (nameEl) {
          data.name = nameEl.textContent.trim();
        }

        // Current team
        const teamEl = document.querySelector('.player-header-team a, a[href*="/Teams/"]');
        if (teamEl) {
          data.currentTeam = teamEl.textContent.trim();
        }

        // Try to extract stats from summary table
        // WhoScored usually has stats in a table format
        const statCells = document.querySelectorAll('td, .stat-value, [class*="statistic"]');

        statCells.forEach(cell => {
          const text = cell.textContent.trim();
          const prevText = cell.previousElementSibling?.textContent.trim() || '';

          // Look for specific stats based on labels
          if (prevText.toLowerCase().includes('apps') || prevText.toLowerCase().includes('appearances')) {
            const value = parseInt(text);
            if (!isNaN(value)) data.stats.appearances = value;
          }

          if (prevText.toLowerCase().includes('goals')) {
            const value = parseInt(text);
            if (!isNaN(value)) data.stats.goals = value;
          }

          if (prevText.toLowerCase().includes('assists')) {
            const value = parseInt(text);
            if (!isNaN(value)) data.stats.assists = value;
          }

          if (prevText.toLowerCase().includes('rating')) {
            const value = parseFloat(text);
            if (!isNaN(value)) data.stats.rating = value;
          }

          if (prevText.toLowerCase().includes('yellow')) {
            const value = parseInt(text);
            if (!isNaN(value)) data.stats.yellowCards = value;
          }

          if (prevText.toLowerCase().includes('red')) {
            const value = parseInt(text);
            if (!isNaN(value)) data.stats.redCards = value;
          }
        });

        // Alternative: Look for stats in dl/dt/dd structure
        const dtElements = document.querySelectorAll('dt, [class*="stat-label"]');
        dtElements.forEach(dt => {
          const label = dt.textContent.toLowerCase().trim();
          const dd = dt.nextElementSibling;
          if (!dd) return;

          const value = dd.textContent.trim();

          if (label.includes('apps') || label.includes('appearances')) {
            const num = parseInt(value);
            if (!isNaN(num)) data.stats.appearances = num;
          }

          if (label.includes('goals')) {
            const num = parseInt(value);
            if (!isNaN(num)) data.stats.goals = num;
          }

          if (label.includes('assists')) {
            const num = parseInt(value);
            if (!isNaN(num)) data.stats.assists = num;
          }

          if (label.includes('rating')) {
            const num = parseFloat(value);
            if (!isNaN(num)) data.stats.rating = num;
          }
        });

        return data;
      });

      playerData.source = 'whoscored';
      playerData.scrapedAt = new Date().toISOString();

      console.log(`✅ Scraped ${playerData.name} from WhoScored`);

      await page.close();
      return playerData;
    } catch (error) {
      console.error(`Error scraping WhoScored for ${playerName}:`, error.message);
      await page.close();
      return null;
    }
  }

  /**
   * Scrape multiple players
   */
  async scrapePlayers(playerNames) {
    await this.initBrowser();
    const results = [];

    for (const playerName of playerNames) {
      const data = await this.searchPlayer(playerName);
      if (data) {
        results.push({ playerName, ...data });
      }

      // Add delay between players
      const delayMs = 3000 + Math.random() * 2000;
      await this.delay(delayMs);
    }

    await this.closeBrowser();
    return results;
  }
}

module.exports = WhoScoredScraper;
