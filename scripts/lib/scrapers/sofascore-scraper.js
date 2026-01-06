/**
 * SofaScore Scraper (Puppeteer Version)
 *
 * Scrapes player statistics from SofaScore.com using Puppeteer:
 * - Goals, assists, appearances
 * - Player rating
 * - Recent performance
 */

const puppeteer = require('puppeteer');

class SofaScoreScraper {
  constructor() {
    this.baseUrl = 'https://www.sofascore.com';
    this.browser = null;
  }

  /**
   * Initialize browser instance (shared with Transfermarkt)
   */
  async initBrowser() {
    if (!this.browser) {
      console.log('🌐 Launching browser for SofaScore...');
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
        ],
      });
      console.log('✅ Browser launched');
    }
    return this.browser;
  }

  /**
   * Close browser instance
   */
  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async delay(ms = 3000) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Search for player by name
   */
  async searchPlayer(playerName) {
    const browser = await this.initBrowser();
    const page = await browser.newPage();

    try {
      console.log(`🔍 Searching SofaScore for: ${playerName}`);

      // Set viewport and user agent
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

      // Navigate to SofaScore search
      const searchUrl = `${this.baseUrl}/search?q=${encodeURIComponent(playerName)}`;
      await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

      // Wait for search results
      await page.waitForSelector('[data-testid="search-result"]', { timeout: 10000 }).catch(() => null);

      // Find player result and click
      const playerLinkFound = await page.evaluate((name) => {
        const results = document.querySelectorAll('[data-testid="search-result"]');
        for (let result of results) {
          const text = result.textContent.toLowerCase();
          if (text.includes('player') && text.includes(name.toLowerCase())) {
            result.click();
            return true;
          }
        }
        return false;
      }, playerName);

      if (!playerLinkFound) {
        console.log(`❌ No SofaScore results found for ${playerName}`);
        await page.close();
        return null;
      }

      // Wait for player page to load
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => null);
      await this.delay(2000);

      // Extract statistics
      const stats = await page.evaluate(() => {
        const data = {
          season: 'Unknown',
          tournament: 'Unknown',
          appearances: 0,
          goals: 0,
          assists: 0,
          rating: null,
          minutesPlayed: 0,
          yellowCards: 0,
          redCards: 0,
        };

        // Try to extract stats from the page
        // (SofaScore's structure varies, this is a basic attempt)
        const statRows = document.querySelectorAll('[class*="stat"]');
        statRows.forEach(row => {
          const text = row.textContent;
          if (text.includes('Goals')) {
            const match = text.match(/(\d+)/);
            if (match) data.goals = parseInt(match[1]);
          }
          if (text.includes('Assists')) {
            const match = text.match(/(\d+)/);
            if (match) data.assists = parseInt(match[1]);
          }
          if (text.includes('Appearances') || text.includes('Matches')) {
            const match = text.match(/(\d+)/);
            if (match) data.appearances = parseInt(match[1]);
          }
          if (text.includes('Rating')) {
            const match = text.match(/(\d+\.?\d*)/);
            if (match) data.rating = parseFloat(match[1]);
          }
        });

        return data;
      });

      console.log(`✅ Scraped SofaScore stats for ${playerName}`);

      await page.close();

      return {
        playerId: null,
        stats,
        source: 'sofascore',
        scrapedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Error scraping SofaScore for ${playerName}:`, error.message);
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
      const delayMs = 2000 + Math.random() * 2000;
      await this.delay(delayMs);
    }

    await this.closeBrowser();
    return results;
  }
}

module.exports = SofaScoreScraper;
