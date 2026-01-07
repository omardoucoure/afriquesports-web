/**
 * Content Formatter for FactSheet
 *
 * Transforms FactSheet data into properly formatted WordPress HTML
 * with images, ranking badges, stats cards, and SEO optimization.
 */

const https = require('https');
const http = require('http');

/**
 * Format ranking content from FactSheet
 */
async function formatRankingContent(factsheet, generatedText, options = {}) {
  const {
    includeImages = true,
    includeStatsCards = true,
    includeInternalLinks = true,
    includeSchema = true,
    language = 'fr'
  } = options;

  const entities = factsheet.entities || [];
  const rankingIds = factsheet.lockedFacts?.rankingLocked || factsheet.lockedFacts?.ranking || [];
  const evidence = factsheet.evidence || [];

  // Build entity lookup map by ID
  const entityById = new Map();
  const entityByName = new Map();
  for (const entity of entities) {
    if (entity.ids?.internalId) {
      entityById.set(entity.ids.internalId, entity);
    }
    if (entity.name) {
      entityByName.set(entity.name, entity);
    }
  }

  // Build player facts lookup from structuredFacts.players
  const playerFactsMap = new Map();
  const playersData = factsheet.structuredFacts?.players || {};
  for (const [name, data] of Object.entries(playersData)) {
    playerFactsMap.set(data.entityRef, { name, ...data.fields });
  }

  // Build scores lookup from decisions.scores
  const scoresMap = new Map();
  const scores = factsheet.decisions?.scores || [];
  for (const score of scores) {
    scoresMap.set(score.entityRef, score);
  }

  // Build ranking with full player data
  const ranking = rankingIds.map((id, index) => {
    const entity = entityById.get(id) || {};
    const playerFacts = playerFactsMap.get(id) || {};
    const scoreData = scoresMap.get(id) || {};

    return {
      position: index + 1,
      id: id,
      name: scoreData.name || playerFacts.fullName || entity.name || id,
      team: playerFacts.currentClub || '',
      nationality: playerFacts.nationality || '',
      age: playerFacts.age || '',
      marketValue: playerFacts.marketValue || '',
      positionDetail: playerFacts.position || '',
      score: scoreData.score || 0,
      ids: entity.ids || {},
      stats: playerFacts.stats || {},
      facts: playerFacts
    };
  });

  // Build player data map for compatibility
  const playerData = buildPlayerDataMap(entities, ranking, factsheet.structuredFacts);

  // Generate formatted sections
  const sections = [];

  // 1. Introduction with key insights
  sections.push(formatIntroduction(factsheet, playerData, language));

  // 2. Quick ranking summary with badges
  sections.push(formatRankingSummary(ranking, playerData, language));

  // 3. Individual player sections
  for (const player of ranking) {
    const data = playerData.get(player.name) || {};
    sections.push(await formatPlayerSection(player, data, {
      includeImages,
      includeStatsCards,
      includeInternalLinks,
      evidence,
      language
    }));
  }

  // 4. Methodology/sources section
  sections.push(formatMethodology(factsheet, language));

  // 5. Related articles (internal links)
  if (includeInternalLinks && evidence.length > 0) {
    sections.push(formatRelatedArticles(evidence, language));
  }

  // Combine all sections
  let content = sections.join('\n\n');

  // Add schema markup
  if (includeSchema) {
    const schema = generateSchemaMarkup(factsheet, ranking, playerData);
    content = `<!-- Schema markup for SEO -->\n<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>\n\n${content}`;
  }

  return content;
}

/**
 * Build a map of player data from entities and facts
 */
function buildPlayerDataMap(entities, ranking, structuredFacts) {
  const playerMap = new Map();

  for (const entity of entities) {
    const key = entity.name;
    playerMap.set(key, {
      ...entity,
      facts: structuredFacts?.playerFacts?.[key] || {},
      rankPosition: ranking.findIndex(r => r.name === key) + 1
    });
  }

  return playerMap;
}

/**
 * Format introduction section
 */
function formatIntroduction(factsheet, playerData, language) {
  const title = factsheet.meta?.title || '';
  const season = factsheet.meta?.season || '2025-26';
  const ranking = factsheet.lockedFacts?.ranking || [];

  const top3 = ranking.slice(0, 3).map(p => `<strong>${p.name}</strong>`).join(', ');

  const introText = language === 'fr'
    ? `<p><strong>Le classement des meilleurs milieux de terrain pour la saison ${season} révèle les talents qui dominent le football mondial.</strong> Cette saison, ${top3} se distinguent particulièrement au sommet de notre classement, établi selon une méthodologie rigoureuse combinant performances statistiques, valeur marchande et impact sur le jeu.</p>`
    : `<p><strong>The ranking of the best midfielders for the ${season} season reveals the talents dominating world football.</strong> This season, ${top3} stand out at the top of our ranking, established according to a rigorous methodology combining statistical performance, market value and impact on the game.</p>`;

  return introText;
}

/**
 * Format ranking summary with visual badges
 */
function formatRankingSummary(ranking, playerData, language) {
  const title = language === 'fr' ? 'Le Top 10 des Milieux de Terrain' : 'Top 10 Midfielders';

  let html = `<h2>${title}</h2>\n`;
  html += `<div class="ranking-summary" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 12px; padding: 24px; margin: 24px 0;">\n`;

  for (const player of ranking) {
    const data = playerData.get(player.name) || {};
    const position = player.position;
    const team = data.team || player.team || '';
    const nationality = data.nationality || '';
    const score = player.score?.toFixed(2) || '';

    // Medal colors for top 3
    let badgeColor = '#4a5568'; // Default gray
    let badgeEmoji = '';
    if (position === 1) { badgeColor = '#FFD700'; badgeEmoji = '🥇'; }
    else if (position === 2) { badgeColor = '#C0C0C0'; badgeEmoji = '🥈'; }
    else if (position === 3) { badgeColor = '#CD7F32'; badgeEmoji = '🥉'; }

    html += `  <div class="ranking-item" style="display: flex; align-items: center; padding: 12px 16px; margin: 8px 0; background: rgba(255,255,255,0.05); border-radius: 8px; border-left: 4px solid ${badgeColor};">\n`;
    html += `    <div class="rank-badge" style="font-size: 24px; font-weight: bold; color: ${badgeColor}; min-width: 50px;">${badgeEmoji || position}</div>\n`;
    html += `    <div class="player-info" style="flex: 1; color: #fff;">\n`;
    html += `      <div style="font-weight: 600; font-size: 16px;">${player.name}</div>\n`;
    html += `      <div style="font-size: 13px; color: #9ca3af;">${team} • ${nationality}</div>\n`;
    html += `    </div>\n`;
    html += `    <div class="score" style="font-weight: bold; color: #9DFF20; font-size: 18px;">${score} pts</div>\n`;
    html += `  </div>\n`;
  }

  html += `</div>\n`;
  return html;
}

/**
 * Format individual player section
 */
async function formatPlayerSection(player, data, options) {
  const { includeImages, includeStatsCards, evidence, language } = options;
  const position = player.position;
  const name = player.name;
  const team = player.team || data.team || '';
  const nationality = player.nationality || data.nationality || '';
  const age = player.age || data.age || '';
  const marketValue = player.marketValue || data.marketValue || '';
  const stats = player.stats || data.facts?.seasonStats || {};

  let html = '';

  // Section header with rank badge
  const badgeStyle = position <= 3
    ? `background: linear-gradient(135deg, ${position === 1 ? '#FFD700' : position === 2 ? '#C0C0C0' : '#CD7F32'} 0%, ${position === 1 ? '#FFA500' : position === 2 ? '#A0A0A0' : '#8B4513'} 100%);`
    : 'background: linear-gradient(135deg, #9DFF20 0%, #7ACC1A 100%);';

  html += `<div class="player-section" style="margin: 32px 0; padding: 24px; background: #f8f9fa; border-radius: 12px;">\n`;

  // Header with rank and name
  html += `  <div style="display: flex; align-items: center; margin-bottom: 16px;">\n`;
  html += `    <div style="${badgeStyle} color: ${position <= 3 ? '#000' : '#000'}; font-weight: bold; font-size: 20px; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 16px;">${position}</div>\n`;
  html += `    <h3 style="margin: 0; font-size: 22px;">${name}</h3>\n`;
  html += `  </div>\n`;

  // Player meta info
  html += `  <div style="display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 16px; font-size: 14px; color: #666;">\n`;
  html += `    <span>🏟️ ${team}</span>\n`;
  html += `    <span>🌍 ${nationality}</span>\n`;
  if (age) html += `    <span>📅 ${age} ans</span>\n`;
  if (marketValue) html += `    <span>💰 ${marketValue}</span>\n`;
  html += `  </div>\n`;

  // Stats card
  if (includeStatsCards) {
    html += formatStatsCard(stats, player.score, language);
  }

  // Player image using Transfermarkt ID
  const transfermarktId = player.ids?.transfermarktId || data.ids?.transfermarktId;
  if (includeImages && transfermarktId) {
    const imageUrl = `https://img.a.transfermarkt.technology/portrait/big/${transfermarktId}-1.jpg`;
    html += `  <figure class="wp-block-image" style="margin: 16px 0; text-align: center;">\n`;
    html += `    <img src="${imageUrl}" alt="${name}" style="max-width: 200px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" loading="lazy" />\n`;
    html += `    <figcaption style="font-size: 12px; color: #666; margin-top: 8px;">${name} - ${team}</figcaption>\n`;
    html += `  </figure>\n`;
  }

  // Description paragraph
  const description = generatePlayerDescription(player, { ...data, stats }, language);
  html += `  <p>${description}</p>\n`;

  // Related evidence/articles for this player
  const playerEvidence = evidence.filter(e =>
    e.relevantEntities?.includes(name) ||
    e.content?.toLowerCase().includes(name.toLowerCase())
  ).slice(0, 2);

  if (playerEvidence.length > 0) {
    html += `  <div style="margin-top: 16px; padding: 12px; background: #e8f5e9; border-radius: 8px; font-size: 14px;">\n`;
    html += `    <strong>${language === 'fr' ? 'À lire aussi :' : 'Read also:'}</strong>\n`;
    html += `    <ul style="margin: 8px 0 0 0; padding-left: 20px;">\n`;
    for (const ev of playerEvidence) {
      if (ev.sourceUrl) {
        html += `      <li><a href="${ev.sourceUrl}" style="color: #2e7d32;">${ev.title || ev.content.substring(0, 60)}...</a></li>\n`;
      }
    }
    html += `    </ul>\n`;
    html += `  </div>\n`;
  }

  html += `</div>\n`;
  return html;
}

/**
 * Format stats card
 */
function formatStatsCard(stats, score, language) {
  const goals = stats.goals || 0;
  const assists = stats.assists || 0;
  const matches = stats.appearances || stats.matches || 0;
  const competition = stats.competition || '';

  let html = `  <div class="stats-card" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 16px 0; padding: 16px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 8px; color: #fff;">\n`;

  html += `    <div style="text-align: center;">\n`;
  html += `      <div style="font-size: 24px; font-weight: bold; color: #9DFF20;">${goals}</div>\n`;
  html += `      <div style="font-size: 12px; color: #9ca3af;">${language === 'fr' ? 'Buts' : 'Goals'}</div>\n`;
  html += `    </div>\n`;

  html += `    <div style="text-align: center;">\n`;
  html += `      <div style="font-size: 24px; font-weight: bold; color: #9DFF20;">${assists}</div>\n`;
  html += `      <div style="font-size: 12px; color: #9ca3af;">${language === 'fr' ? 'Passes D.' : 'Assists'}</div>\n`;
  html += `    </div>\n`;

  html += `    <div style="text-align: center;">\n`;
  html += `      <div style="font-size: 24px; font-weight: bold; color: #9DFF20;">${matches}</div>\n`;
  html += `      <div style="font-size: 12px; color: #9ca3af;">${language === 'fr' ? 'Matchs' : 'Matches'}</div>\n`;
  html += `    </div>\n`;

  html += `    <div style="text-align: center;">\n`;
  html += `      <div style="font-size: 24px; font-weight: bold; color: #FFD700;">${score?.toFixed(1) || '-'}</div>\n`;
  html += `      <div style="font-size: 12px; color: #9ca3af;">Score</div>\n`;
  html += `    </div>\n`;

  html += `  </div>\n`;
  return html;
}

/**
 * Generate player description
 */
function generatePlayerDescription(player, data, language) {
  const name = player.name;
  const team = player.team || data.team || '';
  const age = player.age || data.age || '';
  const position = player.positionDetail || data.positionDetail || 'milieu de terrain';
  const nationality = player.nationality || data.nationality || '';
  const marketValue = player.marketValue || data.marketValue || '';
  const stats = data.stats || player.stats || {};
  const goals = stats.goals || 0;
  const assists = stats.assists || 0;
  const matches = stats.appearances || stats.matches || 0;
  const competition = stats.competition || '';

  if (language === 'fr') {
    return `À ${age} ans, <strong>${name}</strong> s'impose comme l'un des meilleurs milieux de terrain de cette saison ${data.facts?.season || '2025-26'}. ` +
      `Évoluant actuellement à ${team}, le ${position} ${nationality ? nationality.toLowerCase() : ''} affiche des statistiques remarquables avec ` +
      `<strong>${goals} buts</strong> et <strong>${assists} passes décisives</strong> en ${matches} matchs de ${competition}. ` +
      `${marketValue ? `Avec une valeur marchande estimée à ${marketValue}, ` : ''}${name} confirme son statut parmi l'élite du football mondial.`;
  } else {
    return `At ${age} years old, <strong>${name}</strong> establishes himself as one of the best midfielders of this ${data.facts?.season || '2025-26'} season. ` +
      `Currently playing at ${team}, the ${nationality || ''} ${position} displays remarkable statistics with ` +
      `<strong>${goals} goals</strong> and <strong>${assists} assists</strong> in ${matches} ${competition} matches. ` +
      `${marketValue ? `With an estimated market value of ${marketValue}, ` : ''}${name} confirms his status among world football's elite.`;
  }
}

/**
 * Format methodology section
 */
function formatMethodology(factsheet, language) {
  const algorithm = factsheet.lockedFacts?.algorithm || {};

  const title = language === 'fr' ? 'Méthodologie du classement' : 'Ranking Methodology';
  const intro = language === 'fr'
    ? 'Ce classement est établi selon une méthodologie rigoureuse combinant plusieurs critères objectifs :'
    : 'This ranking is established according to a rigorous methodology combining several objective criteria:';

  let html = `<div style="margin: 32px 0; padding: 24px; background: #f0f4f8; border-radius: 12px; border-left: 4px solid #9DFF20;">\n`;
  html += `  <h3 style="margin-top: 0;">${title}</h3>\n`;
  html += `  <p>${intro}</p>\n`;
  html += `  <ul>\n`;

  if (language === 'fr') {
    html += `    <li><strong>Performances statistiques</strong> : buts, passes décisives, matchs joués</li>\n`;
    html += `    <li><strong>Valeur marchande</strong> : estimation Transfermarkt</li>\n`;
    html += `    <li><strong>Impact sur le jeu</strong> : contribution à l'équipe</li>\n`;
    html += `    <li><strong>Niveau de compétition</strong> : coefficient par ligue</li>\n`;
  } else {
    html += `    <li><strong>Statistical performance</strong>: goals, assists, matches played</li>\n`;
    html += `    <li><strong>Market value</strong>: Transfermarkt estimate</li>\n`;
    html += `    <li><strong>Game impact</strong>: contribution to the team</li>\n`;
    html += `    <li><strong>Competition level</strong>: league coefficient</li>\n`;
  }

  html += `  </ul>\n`;
  html += `  <p style="font-size: 13px; color: #666; margin-bottom: 0;">${language === 'fr' ? 'Sources : Transfermarkt, statistiques officielles des ligues.' : 'Sources: Transfermarkt, official league statistics.'}</p>\n`;
  html += `</div>\n`;

  return html;
}

/**
 * Format related articles section
 */
function formatRelatedArticles(evidence, language) {
  // Filter unique articles with URLs
  const articles = evidence
    .filter(e => e.sourceUrl && e.title)
    .reduce((acc, e) => {
      if (!acc.find(a => a.sourceUrl === e.sourceUrl)) {
        acc.push(e);
      }
      return acc;
    }, [])
    .slice(0, 5);

  if (articles.length === 0) return '';

  const title = language === 'fr' ? 'Articles connexes' : 'Related Articles';

  let html = `<div style="margin: 32px 0;">\n`;
  html += `  <h3>${title}</h3>\n`;
  html += `  <div style="display: grid; gap: 12px;">\n`;

  for (const article of articles) {
    html += `    <a href="${article.sourceUrl}" style="display: block; padding: 16px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; text-decoration: none; color: inherit; transition: box-shadow 0.2s;" onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'" onmouseout="this.style.boxShadow='none'">\n`;
    html += `      <div style="font-weight: 600; color: #1a1a2e;">${article.title}</div>\n`;
    html += `      <div style="font-size: 13px; color: #666; margin-top: 4px;">${article.publisher || ''}</div>\n`;
    html += `    </a>\n`;
  }

  html += `  </div>\n`;
  html += `</div>\n`;

  return html;
}

/**
 * Generate JSON-LD schema markup for SEO
 */
function generateSchemaMarkup(factsheet, ranking, playerData) {
  const meta = factsheet.meta || {};

  // ItemList schema for ranking
  const itemListElements = ranking.map((player, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "item": {
      "@type": "Person",
      "name": player.name,
      "jobTitle": "Football Player",
      "affiliation": {
        "@type": "SportsTeam",
        "name": player.team || playerData.get(player.name)?.team || ''
      }
    }
  }));

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": meta.title || "Top 10 Midfielders Ranking",
    "description": meta.description || "Ranking of the best midfielders in world football",
    "author": {
      "@type": "Organization",
      "name": "Afrique Sports"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Afrique Sports",
      "url": "https://www.afriquesports.net"
    },
    "datePublished": new Date().toISOString(),
    "dateModified": new Date().toISOString(),
    "mainEntity": {
      "@type": "ItemList",
      "name": meta.title || "Top 10 Midfielders",
      "description": "Ranking based on performance, market value, and game impact",
      "numberOfItems": ranking.length,
      "itemListElement": itemListElements
    }
  };
}

module.exports = {
  formatRankingContent,
  formatPlayerSection,
  formatStatsCard,
  generateSchemaMarkup
};
