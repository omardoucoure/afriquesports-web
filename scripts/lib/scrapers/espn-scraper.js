/**
 * ESPN Scraper (Hybrid: Puppeteer + API)
 *
 * Strategy:
 * 1. Use Puppeteer to search and extract player ID
 * 2. Use ESPN's unofficial API to fetch statistics (JSON)
 *
 * API Endpoints:
 * - Player data: http://sports.core.api.espn.com/v2/sports/soccer/athletes/{id}
 * - Player stats: http://site.api.espn.com/apis/common/v3/sports/soccer/athletes/{id}
 */

const puppeteer = require('puppeteer');

class ESPNScraper {
  constructor() {
    this.baseUrl = 'https://www.espn.com';
    this.apiBaseUrl = 'http://site.api.espn.com/apis/common/v3/sports/soccer/athletes';
    this.browser = null;
  }

  async initBrowser() {
    if (!this.browser) {
      console.log('🌐 Launching browser for ESPN...');
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
      console.log('✅ Browser closed');
    }
  }

  async delay(ms = 2000) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Normalize player name for search (remove accents, special chars)
   */
  normalizePlayerName(name) {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^\w\s]/g, ' ') // Replace special chars with space
      .trim();
  }

  /**
   * Search for player and extract ID using Puppeteer
   */
  async findPlayerId(playerName) {
    const browser = await this.initBrowser();
    const page = await browser.newPage();

    try {
      console.log(`🔍 Searching ESPN for: ${playerName}`);

      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

      // Try original name first, then normalized version
      const searchNames = [playerName, this.normalizePlayerName(playerName)];
      let playerId = null;

      for (const searchName of searchNames) {
        if (playerId) break;

        console.log(`  Trying search: "${searchName}"`);

        // Search on ESPN
        const searchUrl = `${this.baseUrl}/search/_/q/${encodeURIComponent(searchName)}`;
        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        await this.delay(2000);

        // Look for soccer player links
        playerId = await page.evaluate((originalName, searchName) => {
          const links = document.querySelectorAll('a[href*="/soccer/player/"]');

          // Normalize function for comparison
          const normalize = (str) => {
            return str
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .toLowerCase()
              .trim();
          };

          const normalizedSearch = normalize(searchName);
          const normalizedOriginal = normalize(originalName);

          for (let link of links) {
            const text = normalize(link.textContent);
            const href = link.href;

            // Check if link text matches player name (normalized comparison)
            if ((text.includes(normalizedSearch) || text.includes(normalizedOriginal)) && href) {
              // Extract player ID from URL: /soccer/player/_/id/288897/vitinha
              const match = href.match(/\/id\/(\d+)\//);
              if (match) {
                return match[1];
              }
            }
          }

          return null;
        }, playerName, searchName);

        if (playerId) {
          console.log(`✅ Found player ID: ${playerId} (using "${searchName}")`);
          break;
        }
      }

      await page.close();

      if (!playerId) {
        console.log(`❌ No ESPN results found for ${playerName}`);
        return null;
      }

      return playerId;
    } catch (error) {
      console.error(`Error finding player ID for ${playerName}:`, error.message);
      await page.close();
      return null;
    }
  }

  /**
   * Fetch player statistics via ESPN API
   */
  async fetchPlayerStats(playerId) {
    try {
      console.log(`📊 Fetching stats for player ID: ${playerId}`);

      const url = `${this.apiBaseUrl}/${playerId}`;
      const response = await fetch(url);

      if (!response.ok) {
        console.log(`❌ API request failed: ${response.status}`);
        return null;
      }

      const data = await response.json();

      // Extract relevant data
      const athlete = data.athlete || {};
      const statsSummary = athlete.statsSummary || {};
      const statistics = statsSummary.statistics || [];

      // Parse statistics
      const stats = {
        season: statsSummary.displayName || 'Unknown',
        appearances: 0,
        starts: 0,
        goals: 0,
        assists: 0,
        shots: 0,
        yellowCards: 0,
        redCards: 0,
      };

      statistics.forEach(stat => {
        const name = stat.name;
        const value = stat.value || 0;

        if (name === 'starts-subIns') {
          // Value like "14 (2)" means 14 starts, 2 sub appearances
          const displayValue = stat.displayValue || '';
          const match = displayValue.match(/(\d+)\s*\((\d+)\)/);
          if (match) {
            stats.starts = parseInt(match[1]);
            stats.appearances = stats.starts + parseInt(match[2]);
          } else {
            stats.starts = value;
            stats.appearances = value;
          }
        } else if (name === 'totalGoals') {
          stats.goals = value;
        } else if (name === 'goalAssists') {
          stats.assists = value;
        } else if (name === 'totalShots') {
          stats.shots = value;
        } else if (name === 'yellowCards') {
          stats.yellowCards = value;
        } else if (name === 'redCards') {
          stats.redCards = value;
        }
      });

      return {
        name: athlete.displayName || 'Unknown',
        fullName: athlete.fullName || athlete.displayName,
        age: athlete.age || null,
        position: athlete.position?.displayName || null,
        currentTeam: athlete.team?.displayName || null,
        nationality: athlete.citizenship || null,
        height: athlete.displayHeight || null,
        weight: athlete.displayWeight || null,
        jersey: athlete.displayJersey || null,
        stats,
      };
    } catch (error) {
      console.error(`Error fetching stats for player ID ${playerId}:`, error.message);
      return null;
    }
  }

  /**
   * Search for player by name and return complete data
   */
  async searchPlayer(playerName) {
    try {
      // Step 1: Find player ID via search
      const playerId = await this.findPlayerId(playerName);
      if (!playerId) {
        return null;
      }

      // Step 2: Fetch stats via API
      const playerData = await this.fetchPlayerStats(playerId);
      if (!playerData) {
        return null;
      }

      playerData.source = 'espn';
      playerData.playerId = playerId;
      playerData.scrapedAt = new Date().toISOString();

      console.log(`✅ Scraped ${playerData.name} from ESPN`);
      return playerData;
    } catch (error) {
      console.error(`Error scraping ${playerName}:`, error.message);
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
        results.push(data);
      }

      // Add delay between players
      const delayMs = 3000 + Math.random() * 2000;
      await this.delay(delayMs);
    }

    await this.closeBrowser();
    return results;
  }
}

module.exports = ESPNScraper;
