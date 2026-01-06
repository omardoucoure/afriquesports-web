/**
 * Post Type Detector
 *
 * Detects the type of post from title and category to use appropriate prompt template
 */

class PostTypeDetector {
  constructor() {
    // Keyword patterns for each post type
    this.patterns = {
      ranking: {
        keywords: [
          /top\s*\d+/i,
          /classement/i,
          /meilleur(s|e)?/i,
          /ranking/i,
          /best\s*\d+/i,
          /\d+\s*meilleur/i,
        ],
        categories: ['classement', 'ranking'],
      },
      news: {
        keywords: [
          /annonce/i,
          /officiel/i,
          /confirme/i,
          /déclare/i,
          /selon/i,
          /révèle/i,
          /breaking/i,
        ],
        categories: ['actualite', 'news', 'afrique', 'europe'],
      },
      transfer: {
        keywords: [
          /transfert/i,
          /mercato/i,
          /signature/i,
          /recrute/i,
          /signe/i,
          /transfer/i,
          /deal/i,
          /accord/i,
        ],
        categories: ['mercato', 'transferts', 'transfers'],
      },
      matchReport: {
        keywords: [
          /\d+-\d+/,
          /victoire/i,
          /défaite/i,
          /match/i,
          /gagne/i,
          /perd/i,
          /résumé/i,
          /recap/i,
          /highlights/i,
        ],
        categories: ['match', 'results', 'resultats'],
      },
      preview: {
        keywords: [
          /preview/i,
          /avant-match/i,
          /prédiction/i,
          /pronostic/i,
          /va affronter/i,
          /rencontre/i,
        ],
        categories: ['preview', 'avant-match'],
      },
      analysis: {
        keywords: [
          /analyse/i,
          /décryptage/i,
          /pourquoi/i,
          /comment/i,
          /tactique/i,
          /analysis/i,
        ],
        categories: ['analyse', 'analysis', 'tactique'],
      },
    };
  }

  /**
   * Detect post type from title and category
   */
  detect(title, category = '') {
    const normalizedTitle = title.toLowerCase();
    const normalizedCategory = category.toLowerCase();

    // Check each post type
    for (const [type, config] of Object.entries(this.patterns)) {
      // Check keywords in title
      const hasKeyword = config.keywords.some(pattern =>
        pattern.test(normalizedTitle)
      );

      // Check category match
      const hasCategory = config.categories.some(cat =>
        normalizedCategory.includes(cat)
      );

      if (hasKeyword || hasCategory) {
        return type;
      }
    }

    // Default to news if no specific type detected
    return 'news';
  }

  /**
   * Extract ranking number from title (e.g., "Top 10" -> 10)
   */
  extractRankingNumber(title) {
    const match = title.match(/top\s*(\d+)|(\d+)\s*meilleur/i);
    if (match) {
      return parseInt(match[1] || match[2]);
    }
    return null;
  }

  /**
   * Detect if ranking needs player data
   */
  needsPlayerData(title) {
    const playerKeywords = [
      /joueur/i,
      /milieu/i,
      /attaquant/i,
      /défenseur/i,
      /gardien/i,
      /player/i,
      /midfielder/i,
      /striker/i,
      /defender/i,
      /goalkeeper/i,
    ];

    return playerKeywords.some(pattern => pattern.test(title));
  }

  /**
   * Detect if ranking needs team data
   */
  needsTeamData(title) {
    const teamKeywords = [
      /équipe/i,
      /club/i,
      /sélection/i,
      /team/i,
      /nation/i,
    ];

    return teamKeywords.some(pattern => pattern.test(title));
  }
}

module.exports = PostTypeDetector;
