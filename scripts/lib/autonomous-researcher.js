/**
 * Autonomous Research Agent
 *
 * Automatically researches topics by:
 * 1. Analyzing the post title to understand what's needed
 * 2. Googling to find relevant information
 * 3. Extracting player names, teams, stats from search results
 * 4. Returning structured research data
 */

const fetch = require('node-fetch');

class AutonomousResearcher {
  constructor() {
    this.searchEngine = 'https://www.google.com/search';
  }

  /**
   * Autonomous research based on post title
   * @param {string} title - Post title
   * @param {string} category - Post category
   * @param {string} postType - Detected post type (ranking, news, etc.)
   * @returns {Promise<object>} Research results with entities and context
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
      confidence: 0
    };

    // Step 1: Generate smart search queries based on post type
    const queries = this.generateSearchQueries(title, postType, category);
    research.searchQueries = queries;

    console.log('🔎 Search queries generated:');
    queries.forEach(q => console.log(`   - "${q}"`));
    console.log();

    // Step 2: Search Google and extract information
    for (const query of queries.slice(0, 2)) { // Top 2 queries
      console.log(`🌐 Searching: "${query}"`);

      try {
        const results = await this.googleSearch(query);
        const extracted = this.extractEntities(results, postType);

        // Merge entities
        research.entities.players = [
          ...new Set([...research.entities.players, ...extracted.players])
        ];
        research.entities.teams = [
          ...new Set([...research.entities.teams, ...extracted.teams])
        ];

        research.context += extracted.context + '\n';

        console.log(`   ✅ Found ${extracted.players.length} players, ${extracted.teams.length} teams`);
      } catch (error) {
        console.log(`   ⚠️  Search failed: ${error.message}`);
      }
    }

    // Step 3: Validate we have enough data
    research.confidence = this.assessConfidence(research, postType, title);

    console.log(`\n📊 Research Summary:`);
    console.log(`   Players found: ${research.entities.players.length}`);
    console.log(`   Teams found: ${research.entities.teams.length}`);
    console.log(`   Confidence: ${research.confidence}%\n`);

    return research;
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
          queries.push(`top ${number} best midfielders ${year}`);
          queries.push(`meilleurs milieux de terrain ${year}`);
          queries.push(`${year} midfielder rankings`);
        } else if (/attaquant|striker|forward/i.test(title)) {
          queries.push(`top ${number} best strikers ${year}`);
          queries.push(`meilleurs attaquants ${year}`);
        } else if (/défenseur|defender/i.test(title)) {
          queries.push(`top ${number} best defenders ${year}`);
          queries.push(`meilleurs défenseurs ${year}`);
        } else if (/gardien|goalkeeper/i.test(title)) {
          queries.push(`top ${number} best goalkeepers ${year}`);
          queries.push(`meilleurs gardiens ${year}`);
        } else {
          // Generic ranking
          queries.push(`${title} ${year}`);
        }
        break;

      case 'transfer':
        // Extract player name from title
        const playerMatch = title.match(/([A-Z][a-zé]+(?:\s+[A-Z][a-zé]+)*)/);
        if (playerMatch) {
          queries.push(`${playerMatch[1]} transfer ${year}`);
          queries.push(`${playerMatch[1]} transfert ${year}`);
        }
        queries.push(title);
        break;

      case 'news':
      case 'matchReport':
      case 'preview':
      case 'analysis':
      default:
        queries.push(title);
        queries.push(`${title} ${year}`);
        break;
    }

    return queries;
  }

  /**
   * Perform Google search and get results
   */
  async googleSearch(query) {
    // TODO: Implement Google Custom Search API
    // For now, use intelligent mock data based on 2025 football knowledge
    console.log('   ⚠️  Using intelligent mock search (TODO: implement Google Custom Search API)');

    const mockDatabase = this.getMockFootballDatabase();

    // Match query to database
    if (/midfielder/i.test(query)) {
      return { snippets: [mockDatabase.midfielders.join(', ')] };
    } else if (/striker|attaquant|forward/i.test(query)) {
      return { snippets: [mockDatabase.strikers.join(', ')] };
    } else if (/defender|défenseur/i.test(query)) {
      return { snippets: [mockDatabase.defenders.join(', ')] };
    } else if (/goalkeeper|gardien/i.test(query)) {
      return { snippets: [mockDatabase.goalkeepers.join(', ')] };
    }

    return { snippets: [] };
  }

  /**
   * Mock football database (2025 knowledge)
   * TODO: Replace with real Google search
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
        'Julián Álvarez (Manchester City)',
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
        'Jules Koundé (Barcelona)',
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
        'Diogo Costa (FC Porto)',
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
      context: ''
    };

    const playerPattern = /([A-Z][a-zé]+(?:\s+[A-Z][a-zé]+){0,2})\s*\(([^)]+)\)/g;
    const listPattern = /\d+\.\s*([A-Z][a-zé]+(?:\s+[A-Z][a-zé]+){0,2})/g;

    results.snippets?.forEach(snippet => {
      // Extract "Name (Team)" patterns
      let match;
      while ((match = playerPattern.exec(snippet)) !== null) {
        extracted.players.push(match[1].trim());
        extracted.teams.push(match[2].trim());
      }

      // Extract numbered lists
      while ((match = listPattern.exec(snippet)) !== null) {
        extracted.players.push(match[1].trim());
      }

      extracted.context += snippet + ' ';
    });

    // Remove duplicates
    extracted.players = [...new Set(extracted.players)];
    extracted.teams = [...new Set(extracted.teams)];

    return extracted;
  }

  /**
   * Assess research confidence based on data found
   */
  assessConfidence(research, postType, title) {
    let confidence = 0;

    // For rankings, check if we found the expected number
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
}

module.exports = AutonomousResearcher;
