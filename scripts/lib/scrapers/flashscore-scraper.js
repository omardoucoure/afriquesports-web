/**
 * Flashscore Scraper (Puppeteer Version)
 *
 * Scrapes player statistics from Flashscore.com:
 * - Goals, assists, appearances
 * - Match ratings
 * - Current season stats
 * - Yellow/red cards
 */

const puppeteer = require('puppeteer');

class FlashscoreScraper {
  constructor() {
    this.baseUrl = 'https://www.flashscore.com';
    this.browser = null;
  }

  async initBrowser() {
    if (!this.browser) {
      console.log('🌐 Launching browser for Flashscore...');
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
      console.log(`🔍 Searching Flashscore for: ${playerName}`);

      // Set viewport and user agent (mimic real browser)
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

      // Extra headers to avoid detection
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      });

      // Navigate to Flashscore homepage first
      await page.goto(this.baseUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      await this.delay(2000);

      // Click search icon
      const searchClicked = await page.evaluate(() => {
        const searchDiv = document.querySelector('.header__block--search');
        if (searchDiv) {
          searchDiv.click();
          return true;
        }
        return false;
      });

      if (!searchClicked) {
        console.log('⚠️  Could not click search button');
        await page.close();
        return null;
      }

      await this.delay(2000);

      // Wait for search input to appear
      try {
        await page.waitForSelector('.searchInput__input', { timeout: 10000 });
      } catch (e) {
        console.log('⚠️  Search input did not appear');
        await page.close();
        return null;
      }

      // Focus and type in search
      await page.click('.searchInput__input');
      await this.delay(500);
      await page.keyboard.type(playerName, { delay: 150 });
      await this.delay(4000); // Wait longer for results

      // Click on first player result
      const playerLink = await page.evaluate((searchName) => {
        // Look for player results with class .searchResult
        const results = document.querySelectorAll('.searchResult');

        for (let result of results) {
          const nameEl = result.querySelector('.searchResult__participantName');
          const href = result.href;

          if (nameEl && href) {
            const name = nameEl.textContent.trim();
            // Check if it's the player we're looking for
            if (name.toLowerCase() === searchName.toLowerCase() ||
                name.toLowerCase().includes(searchName.toLowerCase())) {
              // Click the result
              result.click();
              return href;
            }
          }
        }

        return null;
      }, playerName);

      if (!playerLink) {
        console.log(`❌ No Flashscore results found for ${playerName}`);
        await page.close();
        return null;
      }

      console.log(`✅ Found player profile: ${playerLink}`);

      // Wait for navigation after clicking result
      await Promise.race([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
        this.delay(10000),
      ]);

      await this.delay(3000);

      // Click on "Summary" or "Statistics" tab if needed
      await page.evaluate(() => {
        const tabs = document.querySelectorAll('a[href*="summary"], button, a');
        for (let tab of tabs) {
          if (tab.textContent.toLowerCase().includes('summary') ||
              tab.textContent.toLowerCase().includes('statistics')) {
            tab.click();
            break;
          }
        }
      });

      await this.delay(2000);

      // Extract player data
      const playerData = await page.evaluate(() => {
        const data = {
          name: 'Unknown',
          currentTeam: null,
          stats: {
            season: '2024-2025',
            appearances: 0,
            goals: 0,
            assists: 0,
            rating: null,
            minutesPlayed: 0,
            yellowCards: 0,
            redCards: 0,
          },
        };

        // Player name
        const nameEl = document.querySelector('h1, .heading__name, [class*="playerHeader"]');
        if (nameEl) {
          data.name = nameEl.textContent.trim();
        }

        // Current team
        const teamEl = document.querySelector('.heading__info a, [class*="teamHeader"]');
        if (teamEl) {
          data.currentTeam = teamEl.textContent.trim();
        }

        // Extract statistics from the page
        // Flashscore uses different class names, let's try multiple approaches

        // Approach 1: Look for stat rows
        const statRows = document.querySelectorAll('[class*="stat"], .playerStats, [class*="summary"]');
        statRows.forEach(row => {
          const text = row.textContent;

          // Goals
          if (text.toLowerCase().includes('goals')) {
            const match = text.match(/(\d+)/);
            if (match) data.stats.goals = parseInt(match[1]);
          }

          // Assists
          if (text.toLowerCase().includes('assists')) {
            const match = text.match(/(\d+)/);
            if (match) data.stats.assists = parseInt(match[1]);
          }

          // Appearances/Matches
          if (text.toLowerCase().includes('appearances') || text.toLowerCase().includes('matches')) {
            const match = text.match(/(\d+)/);
            if (match) data.stats.appearances = parseInt(match[1]);
          }

          // Rating
          if (text.toLowerCase().includes('rating') || text.toLowerCase().includes('average')) {
            const match = text.match(/(\d+\.\d+)/);
            if (match) data.stats.rating = parseFloat(match[1]);
          }

          // Yellow cards
          if (text.toLowerCase().includes('yellow')) {
            const match = text.match(/(\d+)/);
            if (match) data.stats.yellowCards = parseInt(match[1]);
          }

          // Red cards
          if (text.toLowerCase().includes('red')) {
            const match = text.match(/(\d+)/);
            if (match) data.stats.redCards = parseInt(match[1]);
          }
        });

        // Approach 2: Look for specific stat containers
        const goals = document.querySelector('[class*="goals"] .stat-value, [data-stat="goals"]');
        if (goals && !data.stats.goals) {
          data.stats.goals = parseInt(goals.textContent) || 0;
        }

        const assists = document.querySelector('[class*="assists"] .stat-value, [data-stat="assists"]');
        if (assists && !data.stats.assists) {
          data.stats.assists = parseInt(assists.textContent) || 0;
        }

        return data;
      });

      playerData.source = 'flashscore';
      playerData.scrapedAt = new Date().toISOString();

      console.log(`✅ Scraped ${playerData.name} from Flashscore`);

      await page.close();
      return playerData;
    } catch (error) {
      console.error(`Error scraping Flashscore for ${playerName}:`, error.message);
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

module.exports = FlashscoreScraper;
