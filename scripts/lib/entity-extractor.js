/**
 * Entity Extractor
 *
 * Extracts player names, team names, and football entities from post titles
 * to fetch relevant data from Football API
 */

class EntityExtractor {
  constructor() {
    // Common African players (frequently mentioned)
    this.knownPlayers = [
      'Mohamed Salah', 'Salah',
      'Victor Osimhen', 'Osimhen',
      'Achraf Hakimi', 'Hakimi',
      'Sadio Mané', 'Mané', 'Sadio Mane', 'Mane',
      'Riyad Mahrez', 'Mahrez',
      'Nicolas Jackson', 'Jackson',
      'Kalidou Koulibaly', 'Koulibaly',
      'Édouard Mendy', 'Mendy',
      'Ademola Lookman', 'Lookman',
      'Yoane Wissa', 'Wissa',
      'Bryan Mbeumo', 'Mbeumo',
      'Serhou Guirassy', 'Guirassy',
      'Ismaila Sarr', 'Sarr',
      'Franck Kessié', 'Kessie',
      'Pedri',
      'Vitinha',
      'Neves',
      'Fabinho',
      'Kevin De Bruyne', 'De Bruyne',
      'Declan Rice', 'Rice',
      'Rodri',
      'Frenkie de Jong', 'De Jong',
      'Houssem Aouar', 'Aouar',
      'Donny van de Beek', 'Van de Beek',
    ];

    // Common teams
    this.knownTeams = [
      'Liverpool', 'Manchester City', 'Chelsea', 'Arsenal', 'Manchester United',
      'Real Madrid', 'Barcelona', 'Atlético Madrid', 'Sevilla',
      'Bayern Munich', 'Borussia Dortmund',
      'PSG', 'Paris Saint-Germain', 'Marseille', 'Lyon',
      'Juventus', 'Inter Milan', 'AC Milan', 'Napoli', 'AS Roma',
      'Al-Ittihad', 'Al-Nassr', 'Al-Hilal',
      'Galatasaray', 'Fenerbahçe',
      'Brentford', 'Brighton', 'Newcastle',
      'Atalanta',
      // African teams
      'Sénégal', 'Senegal',
      'Maroc', 'Morocco',
      'Algérie', 'Algeria',
      'Nigeria',
      'Cameroun', 'Cameroon',
      'Côte d\'Ivoire', 'Ivory Coast',
      'Égypte', 'Egypt',
      'Ghana',
      'Mali',
      'RDC', 'DR Congo',
    ];
  }

  /**
   * Extract player names from title
   */
  extractPlayers(title) {
    const found = [];

    for (const player of this.knownPlayers) {
      if (title.includes(player)) {
        // Add full name if not already in list
        if (!found.includes(player)) {
          found.push(player);
        }
      }
    }

    return found;
  }

  /**
   * Extract team names from title
   */
  extractTeams(title) {
    const found = [];

    for (const team of this.knownTeams) {
      if (title.includes(team)) {
        if (!found.includes(team)) {
          found.push(team);
        }
      }
    }

    return found;
  }

  /**
   * Detect topic type from title
   */
  detectTopic(title) {
    const lowerTitle = title.toLowerCase();

    if (lowerTitle.includes('top') || lowerTitle.includes('classement') || lowerTitle.includes('meilleur')) {
      return 'ranking';
    }

    if (lowerTitle.includes('transfert') || lowerTitle.includes('mercato') || lowerTitle.includes('signe')) {
      return 'transfer';
    }

    if (lowerTitle.includes('match') || lowerTitle.includes('vs') || lowerTitle.includes('contre')) {
      return 'match';
    }

    if (lowerTitle.includes('buteur') || lowerTitle.includes('but') || lowerTitle.includes('goal')) {
      return 'scorer';
    }

    return 'general';
  }

  /**
   * Extract all entities from a post title
   */
  extract(title) {
    return {
      players: this.extractPlayers(title),
      teams: this.extractTeams(title),
      topic: this.detectTopic(title),
      title: title
    };
  }

  /**
   * Determine what data to fetch based on entities
   */
  getDataNeeds(entities) {
    const needs = {
      fetchPlayers: entities.players.length > 0,
      fetchTeams: entities.teams.length > 0,
      fetchStandings: entities.topic === 'ranking',
      fetchTopScorers: entities.topic === 'scorer',
      playerNames: entities.players,
      teamNames: entities.teams
    };

    return needs;
  }
}

module.exports = EntityExtractor;
