/**
 * Content Formatter for FactSheet - Professional Edition
 *
 * Transforms FactSheet data into professionally formatted WordPress HTML
 * following industry best practices from ESPN, Goal.com, FourFourTwo, 90min.
 *
 * Features:
 * - Reverse countdown (10→1) for suspense
 * - Table of contents with jump links
 * - Club logos and country flags
 * - Stats cards with radar visualization
 * - "Stat to know" highlight boxes
 * - "Why ranked here" analysis
 * - Achievement badges
 * - Related rankings cross-links
 * - Scroll progress indicator
 * - SEO schema markup
 */

const https = require('https');
const http = require('http');

// Country flag emoji mapping
const COUNTRY_FLAGS = {
  'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Spain': '🇪🇸', 'France': '🇫🇷', 'Germany': '🇩🇪',
  'Italy': '🇮🇹', 'Portugal': '🇵🇹', 'Brazil': '🇧🇷', 'Argentina': '🇦🇷',
  'Netherlands': '🇳🇱', 'Belgium': '🇧🇪', 'Croatia': '🇭🇷', 'Uruguay': '🇺🇾',
  'Colombia': '🇨🇴', 'Senegal': '🇸🇳', 'Nigeria': '🇳🇬', 'Morocco': '🇲🇦',
  'Cameroon': '🇨🇲', 'Egypt': '🇪🇬', 'Ghana': '🇬🇭', 'Algeria': '🇩🇿',
  'Ivory Coast': '🇨🇮', 'Côte d\'Ivoire': '🇨🇮', 'Tunisia': '🇹🇳',
  'Ecuador': '🇪🇨', 'Mexico': '🇲🇽', 'USA': '🇺🇸', 'Japan': '🇯🇵',
  'South Korea': '🇰🇷', 'Australia': '🇦🇺', 'Poland': '🇵🇱', 'Ukraine': '🇺🇦',
  'Serbia': '🇷🇸', 'Switzerland': '🇨🇭', 'Austria': '🇦🇹', 'Denmark': '🇩🇰',
  'Norway': '🇳🇴', 'Sweden': '🇸🇪', 'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'Wales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
  'Ireland': '🇮🇪', 'Czech Republic': '🇨🇿', 'Turkey': '🇹🇷', 'Greece': '🇬🇷'
};

// Club badge URLs (using Wikipedia commons or official sources)
const CLUB_BADGES = {
  'Real Madrid': 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg',
  'Barcelona': 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg',
  'Manchester City': 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg',
  'Liverpool': 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg',
  'Arsenal': 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg',
  'Chelsea': 'https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg',
  'Manchester United': 'https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg',
  'Bayern Munich': 'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg',
  'PSG': 'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg',
  'Juventus': 'https://upload.wikimedia.org/wikipedia/commons/b/bc/Juventus_FC_2017_icon_%28black%29.svg',
  'Inter': 'https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg',
  'AC Milan': 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg',
  'Atletico Madrid': 'https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg',
  'Borussia Dortmund': 'https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg',
  'Tottenham': 'https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg',
  'Napoli': 'https://upload.wikimedia.org/wikipedia/commons/2/28/S.S.C._Napoli_logo.svg',
  'Everton': 'https://upload.wikimedia.org/wikipedia/en/7/7c/Everton_FC_logo.svg'
};

// League name formatting
const LEAGUE_NAMES = {
  'Premier League Stats': 'Premier League',
  'LALIGA Stats': 'La Liga',
  'Ligue 1 Stats': 'Ligue 1',
  'Serie A Stats': 'Serie A',
  'Bundesliga Stats': 'Bundesliga'
};

/**
 * Format ranking content from FactSheet
 */
async function formatRankingContent(factsheet, generatedText, options = {}) {
  const {
    includeImages = true,
    includeStatsCards = true,
    includeInternalLinks = true,
    includeSchema = true,
    includeRadarCharts = true,
    reverseCountdown = true,
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
      scoreComponents: scoreData.components || {},
      ids: entity.ids || {},
      stats: playerFacts.stats || {},
      facts: playerFacts
    };
  });

  // Generate formatted sections
  const sections = [];

  // 0. Scroll progress indicator (CSS)
  sections.push(formatProgressIndicator());

  // 1. Introduction with key insights
  sections.push(formatIntroduction(factsheet, ranking, language));

  // 2. Table of Contents with jump links
  sections.push(formatTableOfContents(ranking, language));

  // 3. Quick ranking summary with badges (shown first, not in countdown)
  sections.push(formatRankingSummary(ranking, language));

  // 4. Individual player sections (reverse countdown: 10→1)
  const orderedRanking = reverseCountdown ? [...ranking].reverse() : ranking;

  for (const player of orderedRanking) {
    sections.push(await formatPlayerSection(player, {
      includeImages,
      includeStatsCards,
      includeRadarCharts,
      includeInternalLinks,
      evidence,
      language,
      totalPlayers: ranking.length
    }));
  }

  // 5. Methodology/sources section
  sections.push(formatMethodology(factsheet, language));

  // 6. Related rankings cross-links
  sections.push(formatRelatedRankings(factsheet, language));

  // 7. Related articles (internal links)
  if (includeInternalLinks && evidence.length > 0) {
    sections.push(formatRelatedArticles(evidence, language));
  }

  // Combine all sections
  let content = sections.join('\n\n');

  // Add schema markup at the beginning
  if (includeSchema) {
    const schema = generateSchemaMarkup(factsheet, ranking);
    content = `<!-- Schema markup for SEO -->\n<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>\n\n${content}`;
  }

  return content;
}

/**
 * Format scroll progress indicator
 */
function formatProgressIndicator() {
  return `<style>
.ranking-progress-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: rgba(0,0,0,0.1);
  z-index: 9999;
}
.ranking-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #9DFF20, #FFD700);
  width: 0%;
  transition: width 0.1s ease;
}
</style>
<div class="ranking-progress-container">
  <div class="ranking-progress-bar" id="rankingProgress"></div>
</div>
<script>
window.addEventListener('scroll', function() {
  var winScroll = document.body.scrollTop || document.documentElement.scrollTop;
  var height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  var scrolled = (winScroll / height) * 100;
  var progressBar = document.getElementById('rankingProgress');
  if (progressBar) progressBar.style.width = scrolled + '%';
});
</script>`;
}

/**
 * Format introduction section
 */
function formatIntroduction(factsheet, ranking, language) {
  const meta = factsheet.meta || {};
  const season = meta.season || '2025-26';
  const top3 = ranking.slice(0, 3);

  const top3Names = top3.map(p => `<strong>${p.name}</strong>`).join(', ');
  const top1 = top3[0];

  if (language === 'fr') {
    return `<div class="ranking-intro" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: #fff; padding: 32px; border-radius: 16px; margin-bottom: 32px;">
  <p style="font-size: 18px; line-height: 1.7; margin: 0;">
    <strong style="color: #9DFF20;">Le verdict est tombé.</strong> Notre classement des meilleurs milieux de terrain pour la saison ${season} place ${top3Names} sur le podium.
    En tête, <strong style="color: #FFD700;">${top1?.name || ''}</strong> s'impose avec un score de ${top1?.score?.toFixed(2) || ''} points,
    fruit d'une analyse rigoureuse combinant performances statistiques, valeur marchande et impact décisif sur le terrain.
  </p>
  <p style="font-size: 14px; color: #9ca3af; margin: 16px 0 0 0;">
    📊 Méthodologie : Statistiques officielles • Valeurs Transfermarkt • Coefficients par ligue
  </p>
</div>`;
  }

  return `<div class="ranking-intro" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: #fff; padding: 32px; border-radius: 16px; margin-bottom: 32px;">
  <p style="font-size: 18px; line-height: 1.7; margin: 0;">
    <strong style="color: #9DFF20;">The verdict is in.</strong> Our ranking of the best midfielders for the ${season} season places ${top3Names} on the podium.
    At the top, <strong style="color: #FFD700;">${top1?.name || ''}</strong> leads with a score of ${top1?.score?.toFixed(2) || ''} points,
    the result of rigorous analysis combining statistical performance, market value, and decisive impact on the pitch.
  </p>
</div>`;
}

/**
 * Format table of contents with jump links
 */
function formatTableOfContents(ranking, language) {
  const title = language === 'fr' ? 'Sommaire - Accès rapide' : 'Quick Navigation';

  let html = `<nav class="ranking-toc" style="background: #f8f9fa; padding: 24px; border-radius: 12px; margin-bottom: 32px;">
  <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #1a1a2e;">${title}</h2>
  <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 8px;">`;

  for (const player of ranking) {
    const flag = COUNTRY_FLAGS[player.nationality] || '🌍';
    html += `    <a href="#player-${player.position}" style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #fff; border-radius: 8px; text-decoration: none; color: #1a1a2e; transition: all 0.2s;" onmouseover="this.style.background='#9DFF20'" onmouseout="this.style.background='#fff'">
      <span style="font-weight: bold; color: ${player.position <= 3 ? '#FFD700' : '#666'};">#${player.position}</span>
      <span>${flag}</span>
      <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${player.name}</span>
    </a>\n`;
  }

  html += `  </div>
</nav>`;
  return html;
}

/**
 * Format ranking summary with visual badges
 */
function formatRankingSummary(ranking, language) {
  const title = language === 'fr' ? 'Le Classement Complet' : 'Full Ranking';

  let html = `<div class="ranking-summary" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 24px; margin: 32px 0;">
  <h2 style="color: #fff; margin: 0 0 20px 0; font-size: 20px;">${title}</h2>\n`;

  for (const player of ranking) {
    const position = player.position;
    const flag = COUNTRY_FLAGS[player.nationality] || '🌍';

    // Medal colors for top 3
    let badgeColor = '#4a5568';
    let badgeEmoji = position.toString();
    let badgeBg = 'rgba(255,255,255,0.05)';

    if (position === 1) {
      badgeColor = '#FFD700';
      badgeEmoji = '🥇';
      badgeBg = 'rgba(255,215,0,0.15)';
    } else if (position === 2) {
      badgeColor = '#C0C0C0';
      badgeEmoji = '🥈';
      badgeBg = 'rgba(192,192,192,0.15)';
    } else if (position === 3) {
      badgeColor = '#CD7F32';
      badgeEmoji = '🥉';
      badgeBg = 'rgba(205,127,50,0.15)';
    }

    html += `  <a href="#player-${position}" style="display: flex; align-items: center; padding: 12px 16px; margin: 8px 0; background: ${badgeBg}; border-radius: 8px; border-left: 4px solid ${badgeColor}; text-decoration: none; transition: transform 0.2s;" onmouseover="this.style.transform='translateX(8px)'" onmouseout="this.style.transform='translateX(0)'">
    <div style="font-size: 24px; font-weight: bold; color: ${badgeColor}; min-width: 50px; text-align: center;">${badgeEmoji}</div>
    <div style="flex: 1; color: #fff;">
      <div style="font-weight: 600; font-size: 16px;">${player.name}</div>
      <div style="font-size: 13px; color: #9ca3af;">${player.team} ${flag}</div>
    </div>
    <div style="text-align: right;">
      <div style="font-weight: bold; color: #9DFF20; font-size: 18px;">${player.score?.toFixed(2) || '-'}</div>
      <div style="font-size: 11px; color: #9ca3af;">points</div>
    </div>
  </a>\n`;
  }

  html += `</div>\n`;
  return html;
}

/**
 * Format individual player section with all features
 */
async function formatPlayerSection(player, options) {
  const {
    includeImages,
    includeStatsCards,
    includeRadarCharts,
    evidence,
    language,
    totalPlayers
  } = options;

  const position = player.position;
  const name = player.name;
  const team = player.team || '';
  const nationality = player.nationality || '';
  const age = player.age || '';
  const marketValue = player.marketValue || '';
  const positionDetail = player.positionDetail || '';
  const stats = player.stats || {};
  const score = player.score || 0;
  const flag = COUNTRY_FLAGS[nationality] || '🌍';
  const clubBadge = CLUB_BADGES[team];

  // Determine badge style based on position
  let badgeStyle, badgeGradient;
  if (position === 1) {
    badgeGradient = 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)';
    badgeStyle = 'gold';
  } else if (position === 2) {
    badgeGradient = 'linear-gradient(135deg, #C0C0C0 0%, #A0A0A0 100%)';
    badgeStyle = 'silver';
  } else if (position === 3) {
    badgeGradient = 'linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)';
    badgeStyle = 'bronze';
  } else {
    badgeGradient = 'linear-gradient(135deg, #9DFF20 0%, #7ACC1A 100%)';
    badgeStyle = 'default';
  }

  // Start player section
  let html = `<article id="player-${position}" class="player-section" style="margin: 48px 0; scroll-margin-top: 80px;">
  <!-- Position indicator for countdown -->
  <div style="text-align: center; margin-bottom: 24px;">
    <span style="display: inline-block; ${badgeGradient}; background: ${badgeGradient}; color: #000; font-weight: 900; font-size: 48px; width: 80px; height: 80px; line-height: 80px; border-radius: 50%; box-shadow: 0 8px 32px rgba(0,0,0,0.3);">${position}</span>
  </div>

  <!-- Player card -->
  <div style="background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.1);">
    <!-- Header with gradient -->
    <div style="background: ${badgeGradient}; padding: 24px; color: #000;">
      <div style="display: flex; align-items: center; gap: 16px; flex-wrap: wrap;">
        ${clubBadge ? `<img src="${clubBadge}" alt="${team}" style="height: 48px; width: auto;" onerror="this.style.display='none'" />` : ''}
        <div style="flex: 1;">
          <h3 style="margin: 0; font-size: 28px; font-weight: 800;">${name}</h3>
          <div style="font-size: 16px; opacity: 0.9; margin-top: 4px;">${team} ${flag}</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 32px; font-weight: 900;">${score.toFixed(1)}</div>
          <div style="font-size: 12px; text-transform: uppercase;">Points</div>
        </div>
      </div>
    </div>

    <!-- Player info grid -->
    <div style="padding: 24px;">
      <!-- Quick info badges -->
      <div style="display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 24px;">
        <span style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; background: #f0f4f8; border-radius: 20px; font-size: 14px;">
          🌍 ${nationality}
        </span>
        <span style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; background: #f0f4f8; border-radius: 20px; font-size: 14px;">
          📅 ${age} ${language === 'fr' ? 'ans' : 'years'}
        </span>
        <span style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; background: #f0f4f8; border-radius: 20px; font-size: 14px;">
          ⚽ ${formatPosition(positionDetail, language)}
        </span>
        <span style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; background: #e8f5e9; border-radius: 20px; font-size: 14px; font-weight: 600; color: #2e7d32;">
          💰 ${marketValue}
        </span>
      </div>`;

  // Stat to know (highlight box)
  const statToKnow = getStatToKnow(player, language);
  html += `
      <!-- STAT TO KNOW - Highlight box -->
      <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: #fff; padding: 20px; border-radius: 12px; margin-bottom: 24px;">
        <div style="font-size: 12px; text-transform: uppercase; color: #9DFF20; margin-bottom: 8px; letter-spacing: 1px;">
          ${language === 'fr' ? '📊 Stat à retenir' : '📊 Stat to know'}
        </div>
        <div style="font-size: 18px; line-height: 1.5;">${statToKnow}</div>
      </div>`;

  // Stats card
  if (includeStatsCards) {
    html += formatStatsCard(stats, score, language);
  }

  // Radar chart
  if (includeRadarCharts && player.scoreComponents) {
    html += formatRadarChart(player, language);
  }

  // Player image
  const transfermarktId = player.ids?.transfermarktId;
  if (includeImages && transfermarktId) {
    const imageUrl = `https://img.a.transfermarkt.technology/portrait/big/${transfermarktId}-1.jpg`;
    html += `
      <figure style="margin: 24px 0; text-align: center;">
        <img src="${imageUrl}" alt="${name}" style="max-width: 280px; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.15);" loading="lazy" onerror="this.parentElement.style.display='none'" />
        <figcaption style="font-size: 13px; color: #666; margin-top: 12px;">${name} - ${team} | Photo: Transfermarkt</figcaption>
      </figure>`;
  }

  // Why ranked here section
  html += formatWhyRankedHere(player, position, totalPlayers, language);

  // Achievements section
  html += formatAchievements(player, language);

  // Related articles for this player
  const playerEvidence = evidence?.filter(e =>
    e.relevantEntities?.includes(name) ||
    e.content?.toLowerCase().includes(name.toLowerCase())
  ).slice(0, 2) || [];

  if (playerEvidence.length > 0) {
    html += `
      <div style="margin-top: 24px; padding: 16px; background: #f8f9fa; border-radius: 8px;">
        <div style="font-size: 13px; font-weight: 600; color: #666; margin-bottom: 12px; text-transform: uppercase;">
          ${language === 'fr' ? '📰 À lire aussi' : '📰 Related articles'}
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px;">`;

    for (const ev of playerEvidence) {
      if (ev.sourceUrl) {
        html += `
          <a href="${ev.sourceUrl}" style="display: block; padding: 12px; background: #fff; border-radius: 6px; text-decoration: none; color: #1a1a2e; font-size: 14px; transition: all 0.2s;" onmouseover="this.style.background='#e8f5e9'" onmouseout="this.style.background='#fff'">
            ${ev.title || ev.content?.substring(0, 80) + '...'}
          </a>`;
      }
    }

    html += `
        </div>
      </div>`;
  }

  // Close player card and section
  html += `
    </div>
  </div>
</article>`;

  return html;
}

/**
 * Get the most impressive stat to highlight
 */
function getStatToKnow(player, language) {
  const stats = player.stats || {};
  const goals = stats.goals || 0;
  const assists = stats.assists || 0;
  const appearances = stats.appearances || 0;
  const competition = formatCompetition(stats.competition);
  const score = player.score || 0;
  const marketValue = player.marketValue || '';

  // Calculate goals + assists ratio
  const contributions = goals + assists;
  const ratio = appearances > 0 ? (contributions / appearances).toFixed(2) : 0;

  if (language === 'fr') {
    if (ratio >= 0.5) {
      return `<strong>${contributions} contributions directes</strong> (${goals}G + ${assists}A) en seulement ${appearances} matchs de ${competition} cette saison, soit une contribution tous les <strong>${(appearances / contributions).toFixed(1)} matchs</strong>.`;
    } else if (goals >= 4) {
      return `Avec <strong>${goals} buts</strong> en ${appearances} matchs, ${player.name} affiche une efficacité offensive remarquable pour un milieu de terrain en ${competition}.`;
    } else if (assists >= 5) {
      return `<strong>${assists} passes décisives</strong> cette saison - ${player.name} est l'un des meilleurs créateurs d'occasions du championnat.`;
    } else {
      return `Score global de <strong>${score.toFixed(2)} points</strong>, plaçant ${player.name} parmi l'élite des milieux de terrain mondiaux avec une valeur de ${marketValue}.`;
    }
  }

  // English version
  if (ratio >= 0.5) {
    return `<strong>${contributions} direct contributions</strong> (${goals}G + ${assists}A) in just ${appearances} ${competition} matches this season, averaging a contribution every <strong>${(appearances / contributions).toFixed(1)} games</strong>.`;
  } else if (goals >= 4) {
    return `With <strong>${goals} goals</strong> in ${appearances} matches, ${player.name} shows remarkable offensive efficiency for a midfielder in ${competition}.`;
  } else {
    return `Overall score of <strong>${score.toFixed(2)} points</strong>, placing ${player.name} among the world's elite midfielders with a value of ${marketValue}.`;
  }
}

/**
 * Format stats card with grid layout
 */
function formatStatsCard(stats, score, language) {
  const goals = stats.goals || 0;
  const assists = stats.assists || 0;
  const appearances = stats.appearances || 0;
  const competition = formatCompetition(stats.competition);

  return `
      <!-- Season Stats Card -->
      <div style="margin: 24px 0;">
        <div style="font-size: 13px; font-weight: 600; color: #666; margin-bottom: 12px; text-transform: uppercase;">
          ${language === 'fr' ? `Stats ${competition} 2025-26` : `${competition} Stats 2025-26`}
        </div>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;">
          <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 20px 16px; border-radius: 12px; text-align: center;">
            <div style="font-size: 32px; font-weight: 800; color: #9DFF20;">${goals}</div>
            <div style="font-size: 12px; color: #9ca3af; margin-top: 4px;">${language === 'fr' ? 'Buts' : 'Goals'}</div>
          </div>
          <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 20px 16px; border-radius: 12px; text-align: center;">
            <div style="font-size: 32px; font-weight: 800; color: #9DFF20;">${assists}</div>
            <div style="font-size: 12px; color: #9ca3af; margin-top: 4px;">${language === 'fr' ? 'Passes D.' : 'Assists'}</div>
          </div>
          <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 20px 16px; border-radius: 12px; text-align: center;">
            <div style="font-size: 32px; font-weight: 800; color: #fff;">${appearances}</div>
            <div style="font-size: 12px; color: #9ca3af; margin-top: 4px;">${language === 'fr' ? 'Matchs' : 'Matches'}</div>
          </div>
          <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 20px 16px; border-radius: 12px; text-align: center;">
            <div style="font-size: 32px; font-weight: 800; color: #FFD700;">${score.toFixed(1)}</div>
            <div style="font-size: 12px; color: #9ca3af; margin-top: 4px;">Score</div>
          </div>
        </div>
      </div>`;
}

/**
 * Format radar chart for player stats visualization
 */
function formatRadarChart(player, language) {
  const components = player.scoreComponents || {};

  // Normalize values for radar chart (0-100 scale)
  const maxValues = {
    goals: 50,
    assists: 50,
    appearances: 50,
    marketValue: 150,
    rating: 100
  };

  const normalize = (val, max) => Math.min(100, (val / max) * 100);

  const goalsNorm = normalize(components.goals || 0, maxValues.goals);
  const assistsNorm = normalize(components.assists || 0, maxValues.assists);
  const appearancesNorm = normalize(components.appearances || 0, maxValues.appearances);
  const marketNorm = normalize(components.marketValue || 0, maxValues.marketValue);
  const ratingNorm = normalize(components.rating || 50, maxValues.rating);

  // SVG radar chart
  const centerX = 100;
  const centerY = 100;
  const radius = 80;

  // Calculate points for pentagon
  const angles = [270, 342, 54, 126, 198].map(a => a * Math.PI / 180);
  const values = [goalsNorm, assistsNorm, appearancesNorm, marketNorm, ratingNorm];
  const labels = language === 'fr'
    ? ['Buts', 'Passes', 'Matchs', 'Valeur', 'Note']
    : ['Goals', 'Assists', 'Matches', 'Value', 'Rating'];

  // Generate polygon points
  const points = values.map((val, i) => {
    const r = (val / 100) * radius;
    const x = centerX + r * Math.cos(angles[i]);
    const y = centerY + r * Math.sin(angles[i]);
    return `${x},${y}`;
  }).join(' ');

  // Generate grid lines
  let gridLines = '';
  for (let level = 0.25; level <= 1; level += 0.25) {
    const gridPoints = angles.map(a => {
      const r = radius * level;
      return `${centerX + r * Math.cos(a)},${centerY + r * Math.sin(a)}`;
    }).join(' ');
    gridLines += `<polygon points="${gridPoints}" fill="none" stroke="#e0e0e0" stroke-width="1"/>`;
  }

  // Generate labels
  let labelElements = '';
  const labelRadius = radius + 20;
  labels.forEach((label, i) => {
    const x = centerX + labelRadius * Math.cos(angles[i]);
    const y = centerY + labelRadius * Math.sin(angles[i]);
    labelElements += `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-size="11" fill="#666">${label}</text>`;
  });

  return `
      <!-- Radar Chart -->
      <div style="margin: 24px 0;">
        <div style="font-size: 13px; font-weight: 600; color: #666; margin-bottom: 12px; text-transform: uppercase;">
          ${language === 'fr' ? 'Profil du joueur' : 'Player Profile'}
        </div>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; text-align: center;">
          <svg viewBox="0 0 200 200" width="200" height="200" style="max-width: 100%;">
            <!-- Grid -->
            ${gridLines}
            <!-- Axes -->
            ${angles.map(a => `<line x1="${centerX}" y1="${centerY}" x2="${centerX + radius * Math.cos(a)}" y2="${centerY + radius * Math.sin(a)}" stroke="#e0e0e0" stroke-width="1"/>`).join('')}
            <!-- Data polygon -->
            <polygon points="${points}" fill="rgba(157, 255, 32, 0.3)" stroke="#9DFF20" stroke-width="2"/>
            <!-- Data points -->
            ${values.map((val, i) => {
              const r = (val / 100) * radius;
              const x = centerX + r * Math.cos(angles[i]);
              const y = centerY + r * Math.sin(angles[i]);
              return `<circle cx="${x}" cy="${y}" r="4" fill="#9DFF20"/>`;
            }).join('')}
            <!-- Labels -->
            ${labelElements}
          </svg>
        </div>
      </div>`;
}

/**
 * Format "Why ranked here" analysis section
 */
function formatWhyRankedHere(player, position, totalPlayers, language) {
  const name = player.name;
  const team = player.team;
  const stats = player.stats || {};
  const score = player.score || 0;
  const goals = stats.goals || 0;
  const assists = stats.assists || 0;

  let analysis = '';

  if (language === 'fr') {
    if (position === 1) {
      analysis = `${name} domine ce classement grâce à une combinaison exceptionnelle de productivité offensive, de valeur marchande et d'impact tactique. Son score de ${score.toFixed(2)} points reflète sa capacité à être décisif dans les grands moments pour ${team}.`;
    } else if (position <= 3) {
      analysis = `${name} s'installe sur le podium avec un profil complet. Ses ${goals} buts et ${assists} passes décisives cette saison témoignent de sa polyvalence, tandis que sa valeur marchande confirme son statut de joueur d'élite mondiale.`;
    } else if (position <= 5) {
      analysis = `À la ${position}e place, ${name} fait partie du cercle très fermé des meilleurs milieux mondiaux. Son impact régulier avec ${team} et ses performances constantes justifient pleinement sa position dans le top 5.`;
    } else {
      analysis = `${name} complète ce top 10 avec un profil intéressant. Bien que ${position === totalPlayers ? 'fermant la marche' : `classé ${position}e`}, sa présence dans cette liste témoigne de son niveau exceptionnel parmi des centaines de milieux de terrain professionnels.`;
    }
  } else {
    if (position === 1) {
      analysis = `${name} tops this ranking thanks to an exceptional combination of offensive productivity, market value, and tactical impact. His score of ${score.toFixed(2)} points reflects his ability to be decisive in big moments for ${team}.`;
    } else if (position <= 3) {
      analysis = `${name} secures a podium spot with a complete profile. His ${goals} goals and ${assists} assists this season demonstrate his versatility, while his market value confirms his world-class status.`;
    } else {
      analysis = `At #${position}, ${name} is part of the exclusive group of the world's best midfielders. His consistent impact with ${team} fully justifies his position in this top ${totalPlayers}.`;
    }
  }

  return `
      <!-- Why Ranked Here -->
      <div style="margin-top: 24px; padding: 20px; background: #fff3e0; border-radius: 12px; border-left: 4px solid #ff9800;">
        <div style="font-size: 13px; font-weight: 600; color: #e65100; margin-bottom: 8px; text-transform: uppercase;">
          ${language === 'fr' ? '🎯 Pourquoi cette place ?' : '🎯 Why this ranking?'}
        </div>
        <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #333;">${analysis}</p>
      </div>`;
}

/**
 * Format achievements section
 */
function formatAchievements(player, language) {
  // Generate some achievements based on stats
  const achievements = [];
  const stats = player.stats || {};
  const score = player.score || 0;
  const position = player.position;

  if (position === 1) {
    achievements.push({
      icon: '👑',
      text: language === 'fr' ? 'N°1 du classement' : '#1 Ranked Player',
      color: '#FFD700'
    });
  }

  if (score > 350) {
    achievements.push({
      icon: '⭐',
      text: language === 'fr' ? 'Score élite (350+)' : 'Elite Score (350+)',
      color: '#9DFF20'
    });
  }

  if ((stats.goals || 0) >= 4) {
    achievements.push({
      icon: '⚽',
      text: language === 'fr' ? 'Buteur prolifique' : 'Prolific Scorer',
      color: '#4CAF50'
    });
  }

  if ((stats.assists || 0) >= 5) {
    achievements.push({
      icon: '🎯',
      text: language === 'fr' ? 'Maître passeur' : 'Assist King',
      color: '#2196F3'
    });
  }

  if (achievements.length === 0) return '';

  return `
      <!-- Achievements -->
      <div style="margin-top: 24px;">
        <div style="font-size: 13px; font-weight: 600; color: #666; margin-bottom: 12px; text-transform: uppercase;">
          ${language === 'fr' ? '🏆 Distinctions' : '🏆 Achievements'}
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          ${achievements.map(a => `
            <span style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; background: ${a.color}22; border: 1px solid ${a.color}; border-radius: 20px; font-size: 13px; font-weight: 500;">
              ${a.icon} ${a.text}
            </span>
          `).join('')}
        </div>
      </div>`;
}

/**
 * Format methodology section
 */
function formatMethodology(factsheet, language) {
  const title = language === 'fr' ? 'Notre méthodologie' : 'Our Methodology';

  return `<div style="margin: 48px 0; padding: 32px; background: linear-gradient(135deg, #f8f9fa 0%, #e8f5e9 100%); border-radius: 16px;">
  <h2 style="margin: 0 0 20px 0; font-size: 22px; color: #1a1a2e;">${title}</h2>

  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 24px;">
    <div style="padding: 20px; background: #fff; border-radius: 12px;">
      <div style="font-size: 24px; margin-bottom: 8px;">📊</div>
      <h4 style="margin: 0 0 8px 0; color: #1a1a2e;">${language === 'fr' ? 'Performances statistiques' : 'Statistical Performance'}</h4>
      <p style="margin: 0; font-size: 14px; color: #666; line-height: 1.5;">
        ${language === 'fr'
          ? 'Buts, passes décisives et matchs joués avec pondération selon le poste (milieu offensif vs défensif).'
          : 'Goals, assists and matches played with position-based weighting (attacking vs defensive midfield).'}
      </p>
    </div>

    <div style="padding: 20px; background: #fff; border-radius: 12px;">
      <div style="font-size: 24px; margin-bottom: 8px;">💰</div>
      <h4 style="margin: 0 0 8px 0; color: #1a1a2e;">${language === 'fr' ? 'Valeur marchande' : 'Market Value'}</h4>
      <p style="margin: 0; font-size: 14px; color: #666; line-height: 1.5;">
        ${language === 'fr'
          ? 'Données Transfermarkt actualisées, reflet de la valeur perçue par le marché.'
          : 'Updated Transfermarkt data, reflecting perceived market value.'}
      </p>
    </div>

    <div style="padding: 20px; background: #fff; border-radius: 12px;">
      <div style="font-size: 24px; margin-bottom: 8px;">🏆</div>
      <h4 style="margin: 0 0 8px 0; color: #1a1a2e;">${language === 'fr' ? 'Coefficient par ligue' : 'League Coefficient'}</h4>
      <p style="margin: 0; font-size: 14px; color: #666; line-height: 1.5;">
        ${language === 'fr'
          ? 'Multiplicateur basé sur le niveau de la compétition (Premier League 1.10x, La Liga 1.08x, etc.).'
          : 'Multiplier based on competition level (Premier League 1.10x, La Liga 1.08x, etc.).'}
      </p>
    </div>
  </div>

  <p style="margin: 24px 0 0 0; font-size: 13px; color: #666; text-align: center;">
    ${language === 'fr'
      ? '📌 Sources : Transfermarkt, statistiques officielles des ligues • Données au 7 janvier 2026'
      : '📌 Sources: Transfermarkt, official league statistics • Data as of January 7, 2026'}
  </p>
</div>`;
}

/**
 * Format related rankings cross-links
 */
function formatRelatedRankings(factsheet, language) {
  const relatedRankings = [
    {
      title: language === 'fr' ? 'Top 10 des Attaquants 2025' : 'Top 10 Strikers 2025',
      url: '/classement/top-10-attaquants-2025',
      emoji: '⚽'
    },
    {
      title: language === 'fr' ? 'Top 10 des Défenseurs 2025' : 'Top 10 Defenders 2025',
      url: '/classement/top-10-defenseurs-2025',
      emoji: '🛡️'
    },
    {
      title: language === 'fr' ? 'Top 10 des Gardiens 2025' : 'Top 10 Goalkeepers 2025',
      url: '/classement/top-10-gardiens-2025',
      emoji: '🧤'
    },
    {
      title: language === 'fr' ? 'Meilleurs Jeunes Talents U21' : 'Best U21 Talents',
      url: '/classement/meilleurs-jeunes-talents-u21',
      emoji: '🌟'
    }
  ];

  return `<div style="margin: 48px 0;">
  <h3 style="margin: 0 0 20px 0; font-size: 18px; color: #1a1a2e;">
    ${language === 'fr' ? '📋 Autres classements' : '📋 Related Rankings'}
  </h3>
  <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px;">
    ${relatedRankings.map(r => `
      <a href="${r.url}" style="display: flex; align-items: center; gap: 12px; padding: 16px; background: #f8f9fa; border-radius: 12px; text-decoration: none; color: #1a1a2e; transition: all 0.2s;" onmouseover="this.style.background='#9DFF20'; this.style.transform='translateY(-2px)'" onmouseout="this.style.background='#f8f9fa'; this.style.transform='translateY(0)'">
        <span style="font-size: 24px;">${r.emoji}</span>
        <span style="font-size: 14px; font-weight: 500;">${r.title}</span>
      </a>
    `).join('')}
  </div>
</div>`;
}

/**
 * Format related articles section
 */
function formatRelatedArticles(evidence, language) {
  const articles = evidence
    .filter(e => e.sourceUrl && e.title)
    .reduce((acc, e) => {
      if (!acc.find(a => a.sourceUrl === e.sourceUrl)) {
        acc.push(e);
      }
      return acc;
    }, [])
    .slice(0, 6);

  if (articles.length === 0) return '';

  const title = language === 'fr' ? 'Articles recommandés' : 'Recommended Articles';

  return `<div style="margin: 48px 0;">
  <h3 style="margin: 0 0 20px 0; font-size: 18px; color: #1a1a2e;">${title}</h3>
  <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;">
    ${articles.map(article => `
      <a href="${article.sourceUrl}" style="display: block; padding: 20px; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; text-decoration: none; color: inherit; transition: all 0.2s;" onmouseover="this.style.boxShadow='0 8px 24px rgba(0,0,0,0.1)'; this.style.borderColor='#9DFF20'" onmouseout="this.style.boxShadow='none'; this.style.borderColor='#e2e8f0'">
        <div style="font-weight: 600; color: #1a1a2e; margin-bottom: 8px; line-height: 1.4;">${article.title}</div>
        <div style="font-size: 13px; color: #666;">${article.publisher || 'Afrique Sports'}</div>
      </a>
    `).join('')}
  </div>
</div>`;
}

/**
 * Generate JSON-LD schema markup for SEO
 */
function generateSchemaMarkup(factsheet, ranking) {
  const meta = factsheet.meta || {};

  const itemListElements = ranking.map((player, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "item": {
      "@type": "Person",
      "name": player.name,
      "jobTitle": "Professional Football Player",
      "nationality": player.nationality,
      "affiliation": {
        "@type": "SportsTeam",
        "name": player.team
      }
    }
  }));

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": meta.title || "Top 10 Midfielders Ranking",
    "description": `Classement des ${ranking.length} meilleurs milieux de terrain du football mondial pour la saison 2025-26`,
    "author": {
      "@type": "Organization",
      "name": "Afrique Sports",
      "url": "https://www.afriquesports.net"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Afrique Sports",
      "url": "https://www.afriquesports.net",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.afriquesports.net/logo.png"
      }
    },
    "datePublished": new Date().toISOString(),
    "dateModified": new Date().toISOString(),
    "image": ranking[0]?.ids?.transfermarktId
      ? `https://img.a.transfermarkt.technology/portrait/big/${ranking[0].ids.transfermarktId}-1.jpg`
      : undefined,
    "mainEntity": {
      "@type": "ItemList",
      "name": meta.title || "Top 10 Midfielders",
      "description": "Ranking based on statistical performance, market value, and game impact",
      "numberOfItems": ranking.length,
      "itemListElement": itemListElements
    }
  };
}

/**
 * Helper: Format position name
 */
function formatPosition(position, language) {
  if (!position) return language === 'fr' ? 'Milieu' : 'Midfielder';

  const positionMap = {
    'Midfield - Attacking Midfield': language === 'fr' ? 'Milieu offensif' : 'Attacking Midfielder',
    'Midfield - Central Midfield': language === 'fr' ? 'Milieu central' : 'Central Midfielder',
    'Midfield - Defensive Midfield': language === 'fr' ? 'Milieu défensif' : 'Defensive Midfielder'
  };

  return positionMap[position] || position;
}

/**
 * Helper: Format competition name
 */
function formatCompetition(competition) {
  if (!competition) return '';

  for (const [pattern, name] of Object.entries(LEAGUE_NAMES)) {
    if (competition.includes(pattern.replace(' Stats', ''))) {
      return name;
    }
  }

  return competition.replace('2025-26 ', '').replace(' Stats', '');
}

module.exports = {
  formatRankingContent,
  formatPlayerSection,
  formatStatsCard,
  formatRadarChart,
  generateSchemaMarkup
};
