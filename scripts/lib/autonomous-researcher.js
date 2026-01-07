/**
 * Autonomous Research Agent with SerpAPI
 *
 * Automatically researches topics by:
 * 1. Analyzing the post title to understand what's needed
 * 2. Searching Google via SerpAPI for real-time information
 * 3. Extracting player names, teams, stats from search results
 * 4. Returning structured research data
 */

const https = require('https');

// SerpAPI Configuration
const SERPAPI_KEY = process.env.SERPAPI_KEY || 'e75b43874237b3f7c922cf794a3e5161ea2acb9c7db38008e0ac991b5fd7dcd9';
const SERPAPI_BASE = 'https://serpapi.com/search.json';

class AutonomousResearcher {
  constructor(options = {}) {
    this.apiKey = options.apiKey || SERPAPI_KEY;
    this.useMock = options.useMock || false; // Set true to use mock data
  }

  /**
   * Autonomous research based on post title
   */
  async research(title, category, postType) {
    console.log('🔍 Autonomous Research Agent starting...');
    console.log(`   Title: ${title}`);
    console.log(`   Type: ${postType}\n`);

    const research = {
      searchQueries: [],
      entities: {
        players: [],
        teams: [],
        competitions: []
      },
      context: '',
      confidence: 0,
      sources: []
    };

    // Step 1: Generate smart search queries based on post type
    const queries = this.generateSearchQueries(title, postType, category);
    research.searchQueries = queries;

    console.log('🔎 Search queries generated:');
    queries.forEach(q => console.log(`   - "${q}"`));
    console.log();

    // Step 2: Search via SerpAPI and extract information
    for (const query of queries.slice(0, 2)) { // Top 2 queries
      console.log(`🌐 Searching: "${query}"`);

      try {
        const results = this.useMock
          ? await this.mockSearch(query)
          : await this.serpApiSearch(query);

        const extracted = this.extractEntities(results, postType);

        // Merge entities
        research.entities.players = [
          ...new Set([...research.entities.players, ...extracted.players])
        ];
        research.entities.teams = [
          ...new Set([...research.entities.teams, ...extracted.teams])
        ];

        research.context += extracted.context + '\n';
        research.sources.push(...extracted.sources);

        console.log(`   ✅ Found ${extracted.players.length} players, ${extracted.teams.length} teams`);
      } catch (error) {
        console.log(`   ⚠️  Search failed: ${error.message}`);
        // Fall back to mock on error
        if (!this.useMock) {
          console.log('   📋 Falling back to knowledge base...');
          const mockResults = await this.mockSearch(query);
          const extracted = this.extractEntities(mockResults, postType);
          research.entities.players = [
            ...new Set([...research.entities.players, ...extracted.players])
          ];
          research.entities.teams = [
            ...new Set([...research.entities.teams, ...extracted.teams])
          ];
        }
      }

      // Rate limiting
      await this.sleep(500);
    }

    // Step 3: Validate we have enough data
    research.confidence = this.assessConfidence(research, postType, title);

    console.log(`\n📊 Research Summary:`);
    console.log(`   Players found: ${research.entities.players.length}`);
    console.log(`   Teams found: ${research.entities.teams.length}`);
    console.log(`   Sources: ${research.sources.length}`);
    console.log(`   Confidence: ${research.confidence}%\n`);

    return research;
  }

  /**
   * Search via SerpAPI (Google Search)
   */
  async serpApiSearch(query) {
    return new Promise((resolve, reject) => {
      const params = new URLSearchParams({
        q: query,
        api_key: this.apiKey,
        engine: 'google',
        num: 10,
        hl: 'fr', // French results
        gl: 'fr'  // France location
      });

      const url = `${SERPAPI_BASE}?${params}`;

      https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);

            if (json.error) {
              reject(new Error(json.error));
              return;
            }

            // Extract snippets from organic results
            const snippets = [];
            const sources = [];

            // Organic results
            if (json.organic_results) {
              json.organic_results.forEach(result => {
                if (result.snippet) {
                  snippets.push(result.snippet);
                }
                if (result.title) {
                  snippets.push(result.title);
                }
                sources.push({
                  title: result.title,
                  url: result.link,
                  source: result.source || new URL(result.link).hostname
                });
              });
            }

            // Knowledge graph
            if (json.knowledge_graph) {
              const kg = json.knowledge_graph;
              if (kg.description) {
                snippets.push(kg.description);
              }
              if (kg.people_also_search_for) {
                kg.people_also_search_for.forEach(item => {
                  snippets.push(item.name);
                });
              }
            }

            // Answer box
            if (json.answer_box) {
              if (json.answer_box.snippet) {
                snippets.push(json.answer_box.snippet);
              }
              if (json.answer_box.list) {
                snippets.push(json.answer_box.list.join(', '));
              }
            }

            // Sports results
            if (json.sports_results) {
              const sports = json.sports_results;
              if (sports.rankings) {
                sports.rankings.forEach(r => {
                  snippets.push(`${r.position}. ${r.team || r.name}`);
                });
              }
            }

            resolve({ snippets, sources });
          } catch (e) {
            reject(new Error(`Parse error: ${e.message}`));
          }
        });
      }).on('error', reject);
    });
  }

  /**
   * Generate smart search queries based on title and post type
   */
  generateSearchQueries(title, postType, category) {
    const queries = [];
    const year = new Date().getFullYear();

    switch (postType) {
      case 'ranking':
        // Extract ranking number
        const topMatch = title.match(/top\s*(\d+)|(\d+)\s*meilleur/i);
        const number = topMatch ? (topMatch[1] || topMatch[2]) : '10';

        // Detect subject
        if (/milieu|midfielder/i.test(title)) {
          queries.push(`top ${number} best midfielders ${year} football`);
          queries.push(`meilleurs milieux de terrain ${year} classement`);
        } else if (/attaquant|striker|forward/i.test(title)) {
          queries.push(`top ${number} best strikers ${year} football`);
          queries.push(`meilleurs attaquants ${year} classement`);
        } else if (/défenseur|defender/i.test(title)) {
          queries.push(`top ${number} best defenders ${year} football`);
          queries.push(`meilleurs défenseurs ${year} classement`);
        } else if (/gardien|goalkeeper/i.test(title)) {
          queries.push(`top ${number} best goalkeepers ${year} football`);
          queries.push(`meilleurs gardiens ${year} classement`);
        } else if (/africain|african|afrique/i.test(title)) {
          queries.push(`top ${number} best african footballers ${year}`);
          queries.push(`meilleurs joueurs africains ${year}`);
        } else {
          queries.push(`${title} ${year}`);
          queries.push(`top ${number} best football players ${year}`);
        }
        break;

      case 'transfer':
        const playerMatch = title.match(/([A-Z][a-zé]+(?:\s+[A-Z][a-zé]+)*)/);
        if (playerMatch) {
          queries.push(`${playerMatch[1]} transfer news ${year}`);
          queries.push(`${playerMatch[1]} transfert mercato ${year}`);
        }
        queries.push(title);
        break;

      case 'news':
      case 'matchReport':
      case 'preview':
      case 'analysis':
      default:
        queries.push(`${title} ${year}`);
        queries.push(title);
        break;
    }

    return queries;
  }

  /**
   * Mock search with football knowledge base (fallback)
   */
  async mockSearch(query) {
    const mockDatabase = this.getMockFootballDatabase();
    const snippets = [];
    const sources = [];

    // Match query to database
    if (/midfielder|milieu/i.test(query)) {
      snippets.push(mockDatabase.midfielders.join(', '));
      sources.push({ title: 'Football Knowledge Base', url: '', source: 'internal' });
    } else if (/striker|attaquant|forward/i.test(query)) {
      snippets.push(mockDatabase.strikers.join(', '));
    } else if (/defender|défenseur/i.test(query)) {
      snippets.push(mockDatabase.defenders.join(', '));
    } else if (/goalkeeper|gardien/i.test(query)) {
      snippets.push(mockDatabase.goalkeepers.join(', '));
    } else if (/african|africain/i.test(query)) {
      snippets.push(mockDatabase.africanPlayers.join(', '));
    }

    return { snippets, sources };
  }

  /**
   * Mock football database (2025 knowledge)
   */
  getMockFootballDatabase() {
    return {
      midfielders: [
        'Pedri (Barcelona)',
        'Jude Bellingham (Real Madrid)',
        'Rodri (Manchester City)',
        'Vitinha (PSG)',
        'Declan Rice (Arsenal)',
        'Nicolò Barella (Inter Milan)',
        'Martin Ødegaard (Arsenal)',
        'Jamal Musiala (Bayern Munich)',
        'Kevin De Bruyne (Manchester City)',
        'João Neves (PSG)',
        'Frenkie de Jong (Barcelona)',
        'Eduardo Camavinga (Real Madrid)',
        'Florian Wirtz (Bayer Leverkusen)',
        'Bruno Fernandes (Manchester United)',
        'Federico Valverde (Real Madrid)'
      ],
      strikers: [
        'Erling Haaland (Manchester City)',
        'Kylian Mbappé (Real Madrid)',
        'Harry Kane (Bayern Munich)',
        'Victor Osimhen (Napoli)',
        'Mohamed Salah (Liverpool)',
        'Robert Lewandowski (Barcelona)',
        'Bukayo Saka (Arsenal)',
        'Vinicius Jr (Real Madrid)',
        'Lautaro Martínez (Inter Milan)',
        'Julián Álvarez (Atlético Madrid)',
        'Darwin Núñez (Liverpool)',
        'Marcus Rashford (Manchester United)'
      ],
      defenders: [
        'Virgil van Dijk (Liverpool)',
        'Rúben Dias (Manchester City)',
        'Antonio Rüdiger (Real Madrid)',
        'William Saliba (Arsenal)',
        'Alessandro Bastoni (Inter Milan)',
        'Eder Militão (Real Madrid)',
        'Marquinhos (PSG)',
        'Kim Min-jae (Bayern Munich)',
        'Joško Gvardiol (Manchester City)',
        'Jules Koundé (Barcelona)'
      ],
      goalkeepers: [
        'Thibaut Courtois (Real Madrid)',
        'Ederson (Manchester City)',
        'Alisson Becker (Liverpool)',
        'Marc-André ter Stegen (Barcelona)',
        'Gianluigi Donnarumma (PSG)',
        'Mike Maignan (AC Milan)',
        'Jan Oblak (Atlético Madrid)',
        'André Onana (Manchester United)',
        'David Raya (Arsenal)',
        'Diogo Costa (FC Porto)'
      ],
      africanPlayers: [
        'Mohamed Salah (Liverpool, Egypt)',
        'Victor Osimhen (Napoli, Nigeria)',
        'Sadio Mané (Al-Nassr, Senegal)',
        'Achraf Hakimi (PSG, Morocco)',
        'Riyad Mahrez (Al-Ahli, Algeria)',
        'Nicolas Pépé (Trabzonspor, Ivory Coast)',
        'Kalidou Koulibaly (Al-Hilal, Senegal)',
        'Edouard Mendy (Al-Ahli, Senegal)',
        'Serge Gnabry (Bayern Munich, Germany/Ivory Coast)',
        'André-Frank Zambo Anguissa (Napoli, Cameroon)'
      ]
    };
  }

  /**
   * Extract player names, teams, and context from search results
   */
  extractEntities(results, postType) {
    const extracted = {
      players: [],
      teams: [],
      context: '',
      sources: results.sources || []
    };

    // Patterns for extraction
    const playerTeamPattern = /([A-Z][a-zéèêëàâäùûüôöîïç]+(?:\s+[A-Z][a-zéèêëàâäùûüôöîïç]+){0,3})\s*\(([^)]+)\)/g;
    const numberedPattern = /(\d+)[.\)]\s*([A-Z][a-zéèêëàâäùûüôöîïç]+(?:\s+[A-Z][a-zéèêëàâäùûüôöîïç]+){0,2})/g;
    const knownPlayers = this.getKnownPlayerNames();

    results.snippets?.forEach(snippet => {
      // Extract "Name (Team)" patterns
      let match;
      while ((match = playerTeamPattern.exec(snippet)) !== null) {
        const name = match[1].trim();
        const team = match[2].trim();

        // Validate it looks like a player name
        if (this.looksLikePlayerName(name)) {
          extracted.players.push(name);
          extracted.teams.push(team);
        }
      }

      // Extract numbered lists (1. Pedri, 2. Bellingham)
      while ((match = numberedPattern.exec(snippet)) !== null) {
        const name = match[2].trim();
        if (this.looksLikePlayerName(name)) {
          extracted.players.push(name);
        }
      }

      // Check for known player names
      knownPlayers.forEach(player => {
        if (snippet.toLowerCase().includes(player.toLowerCase())) {
          extracted.players.push(player);
        }
      });

      extracted.context += snippet + ' ';
    });

    // Remove duplicates and clean
    extracted.players = [...new Set(extracted.players)]
      .filter(p => p.length > 2 && this.looksLikePlayerName(p));
    extracted.teams = [...new Set(extracted.teams)];

    return extracted;
  }

  /**
   * Check if string looks like a player name
   */
  looksLikePlayerName(name) {
    // Must start with capital letter
    if (!/^[A-Z]/.test(name)) return false;

    // Should not be common words or partial names
    const excludeWords = [
      'The', 'Top', 'Best', 'Premier', 'League', 'Football', 'World', 'Cup',
      'Champions', 'Europa', 'FIFA', 'UEFA', 'Center', 'Midfielders', 'Defenders',
      'Strikers', 'Goalkeepers', 'Players', 'Rankings', 'List', 'Scott Mc',
      'Nicol', 'Bruno Guimar', 'Joshua', 'Joao Pedro Goncalves'
    ];
    if (excludeWords.some(w => name.includes(w) || name === w)) return false;

    // Should be 2-4 words max
    const words = name.split(/\s+/);
    if (words.length > 4) return false;

    // Must be at least 4 characters (avoid "Mc", "Jr", etc.)
    if (name.length < 4) return false;

    // Should not end with incomplete name
    if (/\s+(Mc|Jr|Sr|De|Van|Von)$/i.test(name)) return false;

    return true;
  }

  /**
   * Get list of known player names for matching
   */
  getKnownPlayerNames() {
    return [
      'Pedri', 'Jude Bellingham', 'Rodri', 'Vitinha', 'Declan Rice',
      'Barella', 'Ødegaard', 'Odegaard', 'Musiala', 'De Bruyne',
      'João Neves', 'Joao Neves', 'Frenkie de Jong', 'Camavinga',
      'Florian Wirtz', 'Bruno Fernandes', 'Valverde', 'Modric',
      'Bellingham', 'Haaland', 'Mbappé', 'Mbappe', 'Salah',
      'Osimhen', 'Vinicius', 'Kane', 'Saka', 'Rashford'
    ];
  }

  /**
   * Assess research confidence based on data found
   */
  assessConfidence(research, postType, title) {
    let confidence = 0;

    if (postType === 'ranking') {
      const topMatch = title.match(/top\s*(\d+)|(\d+)\s*meilleur/i);
      const expectedCount = topMatch ? parseInt(topMatch[1] || topMatch[2]) : 10;

      const foundCount = research.entities.players.length;
      confidence = Math.min(100, (foundCount / expectedCount) * 100);
    } else if (research.entities.players.length > 0) {
      confidence = 80;
    } else {
      confidence = 30;
    }

    return Math.round(confidence);
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = AutonomousResearcher;
