/**
 * Transfermarkt Scraper (Puppeteer Version)
 *
 * Scrapes player profile data from Transfermarkt.com using Puppeteer:
 * - Age, nationality, current club, position
 * - Market value
 * - Player photo URL
 */

const puppeteer = require('puppeteer');

class TransfermarktScraper {
  constructor() {
    this.baseUrl = 'https://www.transfermarkt.com';
    this.searchUrl = `${this.baseUrl}/schnellsuche/ergebnis/schnellsuche`;
    this.browser = null;
  }

  /**
   * Initialize browser instance
   */
  async initBrowser() {
    if (!this.browser) {
      console.log('🌐 Launching browser...');
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
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
      console.log('✅ Browser closed');
    }
  }

  /**
   * Add delay between requests
   */
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
      console.log(`🔍 Searching Transfermarkt for: ${playerName}`);

      // Set viewport and user agent
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

      // Navigate to search page
      const searchUrl = `${this.searchUrl}?query=${encodeURIComponent(playerName)}`;
      await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

      // Wait for page to load
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Find player link (first result with /profil/spieler/ in href)
      const playerLink = await page.evaluate(() => {
        const links = document.querySelectorAll('a[href*="/profil/spieler/"]');
        // Get first real player profile link (skip navigation links)
        for (let link of links) {
          const href = link.getAttribute('href');
          if (href && href.match(/\/profil\/spieler\/\d+/)) {
            return href;
          }
        }
        return null;
      });

      if (!playerLink) {
        console.log(`❌ No results found for ${playerName}`);
        await page.close();
        return null;
      }

      const playerUrl = `${this.baseUrl}${playerLink}`;
      console.log(`✅ Found player profile: ${playerUrl}`);

      // Add delay before visiting profile
      await this.delay(2000);

      // Visit player profile
      await page.goto(playerUrl, { waitUntil: 'networkidle2', timeout: 30000 });

      // Wait for profile to load
      await page.waitForSelector('.data-header', { timeout: 10000 }).catch(() => null);

      // Extract player data
      const playerData = await page.evaluate(() => {
        const data = {};

        // Player name - clean up jersey number and whitespace
        const nameEl = document.querySelector('h1.data-header__headline-wrapper strong, h1.data-header__headline-wrapper');
        if (nameEl) {
          let nameText = nameEl.textContent.trim();
          // Remove jersey number (e.g., "#8")
          nameText = nameText.replace(/#\d+\s*/g, '').trim();
          data.name = nameText || 'Unknown';
        } else {
          data.name = 'Unknown';
        }

        // Player image
        const imageEl = document.querySelector('.data-header__profile-image img, img.tm-profile-image');
        data.imageUrl = imageEl ? imageEl.src : null;

        // Info table helper - looks for specific labels
        const getInfoValue = (label) => {
          const spans = document.querySelectorAll('span.info-table__content');
          for (let span of spans) {
            const prevText = span.previousElementSibling?.textContent || '';
            if (prevText.includes(label)) {
              return span.textContent.trim();
            }
          }
          return null;
        };

        // Date of birth and age
        const dobEl = document.querySelector('span[itemprop="birthDate"]');
        data.dateOfBirth = dobEl ? dobEl.textContent.trim() : null;

        // Age from date of birth text (usually formatted as "DD/MM/YYYY (age)")
        if (data.dateOfBirth) {
          const ageMatch = data.dateOfBirth.match(/\((\d+)\)/);
          data.age = ageMatch ? parseInt(ageMatch[1]) : null;
        } else {
          data.age = null;
        }

        // Nationality
        const nationalityEl = document.querySelector('span[itemprop="nationality"]');
        data.nationality = nationalityEl ? nationalityEl.textContent.trim() : null;

        // Current club
        const clubEl = document.querySelector('.data-header__club a, span.data-header__club');
        data.currentClub = clubEl ? clubEl.textContent.trim() : null;

        // Position - try multiple selectors
        data.position = getInfoValue('Position:') || getInfoValue('Main position:');

        // Market value - clean up formatting
        const marketValueEl = document.querySelector('.data-header__market-value-wrapper, a.data-header__market-value');
        if (marketValueEl) {
          let mvText = marketValueEl.textContent.trim();
          // Extract just the value (e.g., "€140.00m")
          const mvMatch = mvText.match(/(€[\d.]+m)/i);
          data.marketValue = mvMatch ? mvMatch[1] : mvText.replace(/\s+/g, ' ');
        } else {
          data.marketValue = null;
        }

        // Height
        data.height = getInfoValue('Height:');

        // Foot
        data.foot = getInfoValue('Foot:');

        return data;
      });

      playerData.source = 'transfermarkt';
      playerData.scrapedAt = new Date().toISOString();

      console.log(`✅ Scraped ${playerData.name} profile successfully`);

      // Now fetch performance statistics from /leistungsdaten/ page
      await this.delay(2000);

      // Convert profile URL to performance data URL
      // From: /pedri/profil/spieler/683840
      // To: /pedri/leistungsdaten/spieler/683840
      const performanceUrl = playerUrl.replace('/profil/', '/leistungsdaten/');

      console.log(`📊 Fetching statistics: ${performanceUrl}`);
      await page.goto(performanceUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      await this.delay(2000);

      // Extract statistics from performance page
      const stats = await page.evaluate(() => {
        const statsData = {
          season: '2024-2025',
          competition: null,
          appearances: 0,
          goals: 0,
          assists: 0,
          minutesPlayed: 0,
          yellowCards: 0,
          redCards: 0,
        };

        // Find the performance table
        const tables = document.querySelectorAll('table.items');

        // Usually the first table is the main performance table
        if (tables.length > 0) {
          const mainTable = tables[0];
          const rows = mainTable.querySelectorAll('tbody tr');

          // Look for the current season (2024-25 or 24/25)
          for (let row of rows) {
            const seasonCell = row.querySelector('td:first-child, th:first-child');
            if (!seasonCell) continue;

            const seasonText = seasonCell.textContent.trim();

            // Check if this is the current season
            if (seasonText.includes('24/25') || seasonText.includes('2024')) {
              // Extract stats from this row
              const cells = row.querySelectorAll('td');

              // Competition name (usually 2nd or 3rd cell)
              if (cells.length > 1) {
                statsData.competition = cells[1].textContent.trim();
              }

              // Helper to find cell by content pattern
              const getCellValue = (index) => {
                if (cells[index]) {
                  const text = cells[index].textContent.trim();
                  const num = parseInt(text.replace(/[^0-9]/g, ''));
                  return isNaN(num) ? 0 : num;
                }
                return 0;
              };

              // Transfermarkt table structure (approximate):
              // Season | Competition | Appearances | Goals | Assists | Yellow | Red | Minutes
              // Column indices may vary, so we'll be flexible

              // Try to find stats by scanning all cells
              cells.forEach((cell, index) => {
                const text = cell.textContent.trim();
                const value = parseInt(text.replace(/[^0-9]/g, ''));

                if (isNaN(value)) return;

                // Determine what stat this is based on position and value
                // Typically: apps (10-40), goals (0-30), assists (0-20), minutes (high)

                // Appearances (usually 3-4th column, value 10-50)
                if (index >= 2 && index <= 4 && value >= 1 && value <= 60 && !statsData.appearances) {
                  statsData.appearances = value;
                }

                // Goals (usually after appearances, value 0-40)
                else if (index >= 3 && index <= 5 && value >= 0 && value <= 50 && !statsData.goals && value !== statsData.appearances) {
                  statsData.goals = value;
                }

                // Assists (usually after goals, value 0-25)
                else if (index >= 4 && index <= 6 && value >= 0 && value <= 30 && !statsData.assists && value !== statsData.goals && value !== statsData.appearances) {
                  statsData.assists = value;
                }

                // Minutes (usually high value 1000+)
                else if (value >= 500 && !statsData.minutesPlayed) {
                  statsData.minutesPlayed = value;
                }

                // Yellow cards (usually low value 0-15)
                else if (index >= 6 && value >= 0 && value <= 20 && !statsData.yellowCards) {
                  statsData.yellowCards = value;
                }

                // Red cards (usually 0-3)
                else if (index >= 7 && value >= 0 && value <= 5 && !statsData.redCards && value !== statsData.yellowCards) {
                  statsData.redCards = value;
                }
              });

              // Found current season, stop looking
              break;
            }
          }
        }

        return statsData;
      });

      // Merge stats into player data
      playerData.stats = stats;

      console.log(`✅ Scraped statistics for ${playerData.name}`);

      await page.close();
      return playerData;
    } catch (error) {
      console.error(`Error scraping ${playerName}:`, error.message);
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
        results.push(data);
      }

      // Add delay between players (3-5 seconds)
      const delayMs = 3000 + Math.random() * 2000;
      await this.delay(delayMs);
    }

    await this.closeBrowser();
    return results;
  }
}

module.exports = TransfermarktScraper;
