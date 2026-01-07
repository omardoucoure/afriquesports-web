/**
 * RAG Context Retriever
 *
 * Fetches relevant news/articles from the RAG API to enrich content generation.
 * Provides factual context about players, teams, and events.
 */

const http = require('http');

class RAGContext {
  constructor(options = {}) {
    this.apiUrl = options.apiUrl || process.env.RAG_API_URL || 'http://192.168.2.217:8100';
    this.timeout = options.timeout || 10000;
  }

  /**
   * Make HTTP request to RAG API
   */
  async _request(endpoint, body) {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, this.apiUrl);

      const postData = JSON.stringify(body);
      const options = {
        hostname: url.hostname,
        port: url.port || 80,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, data });
          }
        });
      });

      req.on('error', reject);
      req.setTimeout(this.timeout, () => {
        req.destroy();
        reject(new Error('RAG API timeout'));
      });

      req.write(postData);
      req.end();
    });
  }

  /**
   * Check if RAG API is available
   */
  async isAvailable() {
    try {
      const response = await this._get('/health');
      return response.status === 200;
    } catch {
      return false;
    }
  }

  /**
   * Make HTTP GET request to RAG API
   */
  async _get(endpoint) {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, this.apiUrl);

      const options = {
        hostname: url.hostname,
        port: url.port || 80,
        path: url.pathname,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, data });
          }
        });
      });

      req.on('error', reject);
      req.setTimeout(this.timeout, () => {
        req.destroy();
        reject(new Error('RAG API timeout'));
      });

      req.end();
    });
  }

  /**
   * Get context for a query
   */
  async getContext(query, options = {}) {
    const { nResults = 5, maxChars = 2000, sourceFilter = null } = options;

    try {
      const body = {
        query,
        n_results: nResults,
        max_chars: maxChars
      };

      if (sourceFilter) {
        body.source_filter = sourceFilter;
      }

      const response = await this._request('/context', body);

      if (response.status !== 200) {
        throw new Error(`RAG API error: ${response.status}`);
      }

      return {
        context: response.data.context || '',
        sources: response.data.sources || [],
        tokenEstimate: response.data.token_estimate || 0
      };
    } catch (error) {
      console.error(`   ⚠️  RAG error: ${error.message}`);
      return { context: '', sources: [], tokenEstimate: 0 };
    }
  }

  /**
   * Search for articles
   */
  async search(query, options = {}) {
    const { nResults = 5, sourceFilter = null } = options;

    try {
      const body = {
        query,
        n_results: nResults
      };

      if (sourceFilter) {
        body.source_filter = sourceFilter;
      }

      const response = await this._request('/search', body);

      if (response.status !== 200) {
        throw new Error(`RAG API error: ${response.status}`);
      }

      return response.data.results || [];
    } catch (error) {
      console.error(`   ⚠️  RAG search error: ${error.message}`);
      return [];
    }
  }

  /**
   * Get context for multiple players
   */
  async getPlayersContext(playerNames, options = {}) {
    const results = [];

    for (const playerName of playerNames) {
      const query = `${playerName} football actualité transfert`;
      const context = await this.getContext(query, {
        nResults: 2,
        maxChars: 500,
        ...options
      });

      if (context.context) {
        results.push({
          player: playerName,
          ...context
        });
      }
    }

    return results;
  }

  /**
   * Get context for a team
   */
  async getTeamContext(teamName, options = {}) {
    const query = `${teamName} équipe actualité résultats`;
    return this.getContext(query, { nResults: 3, maxChars: 800, ...options });
  }

  /**
   * Build factSheet section from RAG context
   */
  async buildFactSheetSection(entities, options = {}) {
    const sections = [];

    // Get news for players
    if (entities.players && entities.players.length > 0) {
      console.log(`   🔍 RAG: Fetching news for ${entities.players.length} players...`);

      for (const player of entities.players.slice(0, 5)) { // Limit to 5 players
        const results = await this.search(`${player} actualité`, { nResults: 2 });

        if (results.length > 0) {
          const newsItems = results.map(r => `  • ${r.title} (${r.source})`).join('\n');
          sections.push(`\n📰 ACTUALITÉS ${player.toUpperCase()}:\n${newsItems}`);
        }
      }
    }

    // Get news for teams
    if (entities.teams && entities.teams.length > 0) {
      console.log(`   🔍 RAG: Fetching news for ${entities.teams.length} teams...`);

      for (const team of entities.teams.slice(0, 3)) { // Limit to 3 teams
        const results = await this.search(`${team} équipe résultats`, { nResults: 2 });

        if (results.length > 0) {
          const newsItems = results.map(r => `  • ${r.title} (${r.source})`).join('\n');
          sections.push(`\n📰 ACTUALITÉS ${team.toUpperCase()}:\n${newsItems}`);
        }
      }
    }

    // Get context for the main topic
    if (options.topic) {
      console.log(`   🔍 RAG: Fetching context for topic: ${options.topic}...`);
      const context = await this.getContext(options.topic, { nResults: 3, maxChars: 1000 });

      if (context.context) {
        sections.push(`\n📰 CONTEXTE RÉCENT:\n${context.context}`);
      }
    }

    if (sections.length > 0) {
      console.log(`   ✅ RAG: Got ${sections.length} context sections`);
    }

    return sections.join('\n');
  }
}

module.exports = RAGContext;
