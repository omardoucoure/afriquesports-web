/**
 * Data Merger
 *
 * Combines player data from multiple sources:
 * - Transfermarkt (profile data, market value, performance stats)
 * - ESPN (current season statistics via unofficial API)
 */

const TransfermarktScraper = require('./transfermarkt-scraper');
const ESPNScraper = require('./espn-scraper');

class DataMerger {
  constructor() {
    this.transfermarktScraper = new TransfermarktScraper();
    this.espnScraper = new ESPNScraper();
  }

  /**
   * Fetch and merge data for a single player
   */
  async fetchPlayerData(playerName) {
    console.log(`\n📊 Fetching data for: ${playerName}`);
    console.log('─'.repeat(60));

    const results = {
      playerName,
      success: false,
      data: null,
      errors: [],
    };

    try {
      // Fetch from Transfermarkt (profile + stats)
      let transfermarktData = null;
      try {
        transfermarktData = await this.transfermarktScraper.searchPlayer(playerName);
      } catch (error) {
        results.errors.push(`Transfermarkt error: ${error.message}`);
        console.error(`❌ Transfermarkt failed for ${playerName}:`, error.message);
      }

      // Fetch from ESPN (current season statistics)
      let espnData = null;
      try {
        espnData = await this.espnScraper.searchPlayer(playerName);
      } catch (error) {
        results.errors.push(`ESPN error: ${error.message}`);
        console.error(`❌ ESPN failed for ${playerName}:`, error.message);
      }

      // Merge data
      if (transfermarktData || espnData) {
        results.success = true;
        results.data = this.mergePlayerData(transfermarktData, espnData);

        console.log(`✅ Successfully merged data for ${playerName}`);
        console.log(JSON.stringify(results.data, null, 2));
      } else {
        results.errors.push('No data found from any source');
        console.log(`❌ No data available for ${playerName}`);
      }

      return results;
    } catch (error) {
      results.errors.push(`Fatal error: ${error.message}`);
      console.error(`❌ Fatal error fetching ${playerName}:`, error.message);
      return results;
    }
  }

  /**
   * Merge data from Transfermarkt and ESPN into unified format
   */
  mergePlayerData(transfermarktData, espnData) {
    // Prefer ESPN for current season stats, Transfermarkt for profile
    const tmStats = transfermarktData?.stats || {};
    const espnStats = espnData?.stats || {};

    const merged = {
      // Basic info (prefer Transfermarkt for market value and detailed profile)
      name: transfermarktData?.name || espnData?.name || 'Unknown',
      age: transfermarktData?.age || espnData?.age || null,
      dateOfBirth: transfermarktData?.dateOfBirth || null,
      nationality: transfermarktData?.nationality || espnData?.nationality || null,
      currentClub: transfermarktData?.currentClub || espnData?.currentTeam || null,
      position: transfermarktData?.position || espnData?.position || null,
      marketValue: transfermarktData?.marketValue || null,
      height: transfermarktData?.height || espnData?.height || null,
      foot: transfermarktData?.foot || null,
      imageUrl: transfermarktData?.imageUrl || null,
      jersey: espnData?.jersey || null,

      // Statistics (prefer ESPN for accuracy, fallback to Transfermarkt)
      stats: {
        season: espnStats.season || tmStats.season || '2024-2025',
        competition: tmStats.competition || espnStats.season || null,
        appearances: espnStats.appearances || tmStats.appearances || 0,
        starts: espnStats.starts || 0,
        goals: espnStats.goals || tmStats.goals || 0,
        assists: espnStats.assists || tmStats.assists || 0,
        shots: espnStats.shots || 0,
        minutesPlayed: tmStats.minutesPlayed || 0,
        yellowCards: espnStats.yellowCards || tmStats.yellowCards || 0,
        redCards: espnStats.redCards || tmStats.redCards || 0,
      },

      // Metadata
      sources: {
        transfermarkt: !!transfermarktData,
        espn: !!espnData,
      },
      fetchedAt: new Date().toISOString(),
    };

    return merged;
  }

  /**
   * Fetch and merge data for multiple players
   */
  async fetchPlayersData(playerNames) {
    console.log(`\n🎯 Fetching data for ${playerNames.length} players...`);
    console.log('═'.repeat(60));

    const results = [];

    for (const playerName of playerNames) {
      const result = await this.fetchPlayerData(playerName);
      results.push(result);

      // Add delay between players to avoid rate limiting
      const delayMs = 2000 + Math.random() * 2000;
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    // Clean up browser instances
    await this.cleanup();

    // Summary
    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;

    console.log('\n' + '═'.repeat(60));
    console.log(`📈 Summary: ${successful}/${results.length} successful, ${failed} failed`);
    console.log('═'.repeat(60));

    return results;
  }

  /**
   * Clean up browser instances
   */
  async cleanup() {
    try {
      await this.transfermarktScraper.closeBrowser();
      await this.espnScraper.closeBrowser();
    } catch (error) {
      console.error('Error closing browsers:', error.message);
    }
  }

  /**
   * Format player data for AI prompt
   */
  formatForPrompt(playerData) {
    if (!playerData || !playerData.success) {
      return 'No data available';
    }

    const data = playerData.data;
    const stats = data.stats;

    return `
**${data.name}** ${data.jersey ? `(${data.jersey})` : ''}
- Age: ${data.age} ans${data.dateOfBirth ? ` (${data.dateOfBirth})` : ''}
- Nationalité: ${data.nationality}
- Club actuel: ${data.currentClub}
- Position: ${data.position}
${data.marketValue ? `- Valeur marchande: ${data.marketValue}` : ''}
${data.foot ? `- Pied fort: ${data.foot}` : ''}
${data.height ? `- Taille: ${data.height}` : ''}

**Statistiques ${stats.season}**${stats.competition ? ` (${stats.competition})` : ''}:
- Matchs joués: ${stats.appearances}${stats.starts ? ` (${stats.starts} titularisations)` : ''}
- Buts: ${stats.goals}
- Passes décisives: ${stats.assists}
${stats.shots ? `- Tirs: ${stats.shots}` : ''}
${stats.minutesPlayed ? `- Minutes jouées: ${stats.minutesPlayed}` : ''}
${stats.yellowCards ? `- Cartons jaunes: ${stats.yellowCards}` : ''}
${stats.redCards ? `- Cartons rouges: ${stats.redCards}` : ''}
`.trim();
  }

  /**
   * Format multiple players for AI prompt
   */
  formatMultipleForPrompt(playersData) {
    return playersData
      .filter(p => p.success)
      .map((p, index) => `\n### ${index + 1}. ${this.formatForPrompt(p)}`)
      .join('\n\n');
  }
}

module.exports = DataMerger;
