/**
 * FBref Scraper (Puppeteer Version)
 *
 * Scrapes player statistics from FBref.com:
 * - Goals, assists, appearances
 * - Advanced metrics (xG, passes, tackles)
 * - Current season stats
 * - Performance ratings
 */

const puppeteer = require('puppeteer');

class FBrefScraper {
  constructor() {
    this.baseUrl = 'https://fbref.com';
    this.searchUrl = `${this.baseUrl}/en/search/search.fcgi`;
    this.browser = null;
  }

  async initBrowser() {
    if (!this.browser) {
      console.log('🌐 Launching browser for FBref...');
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
      console.log(`🔍 Searching FBref for: ${playerName}`);

      // Set viewport and user agent
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

      // Navigate to search page
      const searchUrl = `${this.searchUrl}?search=${encodeURIComponent(playerName)}`;
      await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

      await this.delay(2000);

      // Find player link in search results
      const playerLink = await page.evaluate((searchName) => {
        const searchItems = document.querySelectorAll('.search-item');
        const currentYear = new Date().getFullYear();
        let bestMatch = null;
        let bestScore = 0;

        searchItems.forEach(item => {
          const text = item.textContent;
          const link = item.querySelector('a[href*="/players/"]');

          if (!link) return;

          const href = link.getAttribute('href');
          if (!href) return;

          let score = 0;

          // Extract player name from href (e.g., "/players/0d9b2d31/Pedri")
          const hrefName = href.split('/').pop();
          const lowerSearchName = searchName.toLowerCase().replace(/\s+/g, '-');
          const lowerHrefName = hrefName.toLowerCase();

          // Exact name match in URL = highest priority
          if (lowerHrefName === lowerSearchName) {
            score += 100;
          } else if (lowerHrefName.includes(lowerSearchName) || lowerSearchName.includes(lowerHrefName)) {
            score += 50;
          }

          // Check if name appears as exact word in text
          const nameRegex = new RegExp(`\\b${searchName}\\b`, 'i');
          if (nameRegex.test(text)) {
            score += 30;
          }

          // Check if player is currently active (date range includes current year)
          const dateMatch = text.match(/(\d{4})-(\d{4})/);
          if (dateMatch) {
            const endYear = parseInt(dateMatch[2]);
            if (endYear >= currentYear) {
              score += 20; // Active player
            }
          }

          // Prefer players with major clubs mentioned
          const majorClubs = ['Barcelona', 'Real Madrid', 'PSG', 'Bayern', 'Manchester', 'Liverpool', 'Chelsea'];
          for (let club of majorClubs) {
            if (text.includes(club)) {
              score += 10;
              break;
            }
          }

          if (score > bestScore) {
            bestScore = score;
            bestMatch = href;
          }
        });

        return bestMatch;
      }, playerName);

      if (!playerLink) {
        console.log(`❌ No FBref results found for ${playerName}`);
        await page.close();
        return null;
      }

      // Navigate to player page
      const playerUrl = playerLink.startsWith('http') ? playerLink : `${this.baseUrl}${playerLink}`;
      console.log(`✅ Found player profile: ${playerUrl}`);

      await this.delay(2000);
      await page.goto(playerUrl, { waitUntil: 'networkidle2', timeout: 30000 });

      // Scroll down to trigger lazy loading of stats tables
      await page.evaluate(() => window.scrollTo(0, 1000));
      await this.delay(2000);

      // Wait for stats table to load
      try {
        await page.waitForSelector('#stats_standard_dom_lg, table.stats_table', { timeout: 10000 });
      } catch (e) {
        console.log(`⚠️  Stats table not found after waiting`);
      }

      await this.delay(2000);

      // Extract player statistics
      const playerData = await page.evaluate(() => {
        const data = {
          name: 'Unknown',
          currentTeam: null,
          league: null,
          stats: {
            season: '2024-2025',
            appearances: 0,
            goals: 0,
            assists: 0,
            minutesPlayed: 0,
            yellowCards: 0,
            redCards: 0,
          },
        };

        // Player name
        const nameEl = document.querySelector('h1[itemprop="name"] span, h1 span');
        if (nameEl) {
          data.name = nameEl.textContent.trim();
        }

        // Current team - look for team link in player info
        const teamLinks = document.querySelectorAll('p a[href*="/squads/"]');
        if (teamLinks.length > 0) {
          data.currentTeam = teamLinks[0].textContent.trim();
        }

        // Try to find standard stats table
        const statsTable = document.querySelector('#stats_standard_dom_lg, table.stats_table');

        if (statsTable) {
          // Get most recent row (current season, usually first data row)
          const rows = statsTable.querySelectorAll('tbody tr');

          if (rows.length > 0) {
            // Find the most recent season (look for 2024-2025 or similar)
            let latestRow = null;
            let latestYear = 0;

            rows.forEach(row => {
              const seasonCell = row.querySelector('[data-stat="year_id"]');
              if (seasonCell) {
                const seasonText = seasonCell.textContent.trim();
                const yearMatch = seasonText.match(/(\d{4})-(\d{4})/);
                if (yearMatch) {
                  const endYear = parseInt(yearMatch[2]);
                  if (endYear > latestYear) {
                    latestYear = endYear;
                    latestRow = row;
                  }
                }
              }
            });

            if (latestRow) {
              // Helper to get cell value by data-stat attribute
              const getCellValue = (dataStat) => {
                const cell = latestRow.querySelector(`[data-stat="${dataStat}"]`);
                return cell ? cell.textContent.trim() : null;
              };

              // Extract stats using data-stat attributes
              const season = getCellValue('year_id');
              if (season) data.stats.season = season;

              const matches = getCellValue('games');
              if (matches) data.stats.appearances = parseInt(matches) || 0;

              const goals = getCellValue('goals');
              if (goals) data.stats.goals = parseInt(goals) || 0;

              const assists = getCellValue('assists');
              if (assists) data.stats.assists = parseInt(assists) || 0;

              const minutes = getCellValue('minutes');
              if (minutes) data.stats.minutesPlayed = parseInt(minutes.replace(/,/g, '')) || 0;

              const yellows = getCellValue('cards_yellow');
              if (yellows) data.stats.yellowCards = parseInt(yellows) || 0;

              const reds = getCellValue('cards_red');
              if (reds) data.stats.redCards = parseInt(reds) || 0;

              // League/Competition
              const comp = getCellValue('comp_level');
              if (comp) data.league = comp;

              // Also get xG and xAG if available
              const xg = getCellValue('xg');
              if (xg) data.stats.xG = parseFloat(xg) || 0;

              const xag = getCellValue('xg_assist');
              if (xag) data.stats.xAG = parseFloat(xag) || 0;
            }
          }
        }

        return data;
      });

      playerData.source = 'fbref';
      playerData.scrapedAt = new Date().toISOString();

      console.log(`✅ Scraped ${playerData.name} from FBref`);

      await page.close();
      return playerData;
    } catch (error) {
      console.error(`Error scraping FBref for ${playerName}:`, error.message);
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

module.exports = FBrefScraper;
