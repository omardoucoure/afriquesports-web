/**
 * Football API Data Fetcher
 *
 * Fetches real-time football data from API-Football (RapidAPI)
 * Includes caching to minimize API calls and respect rate limits
 */

const fs = require('fs');
const path = require('path');

// Cache configuration
const CACHE_DIR = path.join(__dirname, '../.cache');
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

class FootballAPI {
  constructor(apiKey) {
    this.apiKey = apiKey || process.env.API_FOOTBALL_KEY;
    // Use direct API-Football endpoint (v3.football.api-sports.io)
    this.baseUrl = 'https://v3.football.api-sports.io';

    if (!this.apiKey) {
      console.warn('⚠️  API_FOOTBALL_KEY not set. Football API features disabled.');
    }
  }

  /**
   * Make API request with caching
   */
  async request(endpoint, params = {}) {
    if (!this.apiKey) {
      throw new Error('API_FOOTBALL_KEY not configured');
    }

    // Generate cache key
    const cacheKey = this.getCacheKey(endpoint, params);
    const cachedData = this.getCache(cacheKey);

    if (cachedData) {
      console.log(`📦 Using cached data for: ${endpoint}`);
      return cachedData;
    }

    // Build URL
    const url = new URL(endpoint, this.baseUrl);
    Object.keys(params).forEach(key => {
      url.searchParams.append(key, params[key]);
    });

    console.log(`🌐 Fetching from API: ${endpoint}`);

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'x-apisports-key': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Cache the result
      this.setCache(cacheKey, data);

      return data;
    } catch (error) {
      console.error(`❌ API request failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Search for a player by name
   */
  async searchPlayer(playerName) {
    const data = await this.request('/players', {
      search: playerName,
      season: 2024
    });

    if (!data.response || data.response.length === 0) {
      return null;
    }

    const player = data.response[0];
    const stats = player.statistics[0] || {};

    return {
      id: player.player.id,
      name: player.player.name,
      firstname: player.player.firstname,
      lastname: player.player.lastname,
      age: player.player.age,
      nationality: player.player.nationality,
      height: player.player.height,
      weight: player.player.weight,
      photo: player.player.photo,

      // Current club info
      club: stats.team?.name || 'Unknown',
      clubLogo: stats.team?.logo,
      league: stats.league?.name,
      country: stats.league?.country,

      // Position & role
      position: stats.games?.position || player.player.position,

      // Current season stats (2024)
      stats: {
        appearances: stats.games?.appearences || 0,
        minutes: stats.games?.minutes || 0,
        goals: stats.goals?.total || 0,
        assists: stats.goals?.assists || 0,
        rating: stats.games?.rating ? parseFloat(stats.games.rating) : null
      }
    };
  }

  /**
   * Get multiple players data
   */
  async getPlayersData(playerNames) {
    const results = [];

    for (const name of playerNames) {
      try {
        const player = await this.searchPlayer(name);
        if (player) {
          results.push(player);
        }

        // Rate limiting: wait 1s between requests (free tier)
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to fetch ${name}:`, error.message);
      }
    }

    return results;
  }

  /**
   * Get team information
   */
  async searchTeam(teamName, league = null) {
    const params = {
      name: teamName,
      season: 2024
    };

    if (league) {
      params.league = league;
    }

    const data = await this.request('/teams', params);

    if (!data.response || data.response.length === 0) {
      return null;
    }

    const team = data.response[0].team;
    const venue = data.response[0].venue;

    return {
      id: team.id,
      name: team.name,
      code: team.code,
      country: team.country,
      founded: team.founded,
      logo: team.logo,
      venue: {
        name: venue?.name,
        city: venue?.city,
        capacity: venue?.capacity,
        image: venue?.image
      }
    };
  }

  /**
   * Get league standings
   */
  async getStandings(leagueId, season = 2024) {
    const data = await this.request('/standings', {
      league: leagueId,
      season: season
    });

    if (!data.response || data.response.length === 0) {
      return null;
    }

    return data.response[0].league.standings[0];
  }

  /**
   * Get top scorers for a league
   */
  async getTopScorers(leagueId, season = 2024) {
    const data = await this.request('/players/topscorers', {
      league: leagueId,
      season: season
    });

    if (!data.response) {
      return [];
    }

    return data.response.map(item => ({
      player: {
        id: item.player.id,
        name: item.player.name,
        photo: item.player.photo,
        nationality: item.player.nationality,
        age: item.player.age
      },
      statistics: {
        team: item.statistics[0].team.name,
        goals: item.statistics[0].goals.total,
        assists: item.statistics[0].goals.assists,
        appearances: item.statistics[0].games.appearences,
        rating: item.statistics[0].games.rating
      }
    }));
  }

  /**
   * Cache helpers
   */
  getCacheKey(endpoint, params) {
    const paramsStr = JSON.stringify(params);
    return `${endpoint.replace(/\//g, '_')}_${Buffer.from(paramsStr).toString('base64')}`;
  }

  getCache(key) {
    const cacheFile = path.join(CACHE_DIR, `${key}.json`);

    if (!fs.existsSync(cacheFile)) {
      return null;
    }

    try {
      const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));

      // Check if cache is still valid
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
      }

      // Cache expired, delete it
      fs.unlinkSync(cacheFile);
      return null;
    } catch (error) {
      return null;
    }
  }

  setCache(key, data) {
    const cacheFile = path.join(CACHE_DIR, `${key}.json`);

    const cacheData = {
      timestamp: Date.now(),
      data: data
    };

    fs.writeFileSync(cacheFile, JSON.stringify(cacheData, null, 2));
  }

  /**
   * Clear all cache
   */
  clearCache() {
    if (fs.existsSync(CACHE_DIR)) {
      const files = fs.readdirSync(CACHE_DIR);
      files.forEach(file => {
        fs.unlinkSync(path.join(CACHE_DIR, file));
      });
      console.log(`🗑️  Cleared ${files.length} cached items`);
    }
  }
}

// League IDs for reference
FootballAPI.LEAGUES = {
  PREMIER_LEAGUE: 39,      // England
  LA_LIGA: 140,            // Spain
  SERIE_A: 135,            // Italy
  BUNDESLIGA: 78,          // Germany
  LIGUE_1: 61,             // France
  CHAMPIONS_LEAGUE: 2,     // UEFA Champions League
  AFCON: 1,                // Africa Cup of Nations
  WORLD_CUP: 1,            // FIFA World Cup
};

module.exports = FootballAPI;
