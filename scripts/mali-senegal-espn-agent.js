#!/usr/bin/env node
/**
 * Mali vs Senegal Live Commentary Agent
 * Fetches ESPN events and translates to engaging French commentary
 */

const MATCH_ID = '732177';
const API_URL = 'https://www.afriquesports.net/api/can2025/live-commentary';
const ESPN_URL = `https://site.api.espn.com/apis/site/v2/sports/soccer/caf.nations/summary?event=${MATCH_ID}`;
const WEBHOOK_SECRET = 'test-secret';

// Track posted events to avoid duplicates
const postedEvents = new Set();
let eventCounter = 200;

// French translations for event types
const translations = {
  'Foul': 'Faute',
  'Corner': 'Corner',
  'Yellow Card': 'Carton jaune',
  'Red Card': 'Carton rouge',
  'Substitution': 'Remplacement',
  'Goal': 'BUT',
  'Penalty': 'Penalty',
  'Offside': 'Hors-jeu',
  'Shot': 'Tir',
  'Save': 'Arret',
  'Free Kick': 'Coup franc',
  'Hand ball': 'Main',
};

// Team name translations
const teamNames = {
  'Mali': 'Mali',
  'Senegal': 'Sénégal',
};

// Generate engaging French commentary from ESPN event
function translateToFrench(event) {
  const time = event.time?.displayValue || '';
  const text = event.text || '';
  const play = event.play;

  // Skip if no meaningful content
  if (!text || text.length < 5) return null;

  let frenchText = '';
  let type = 'general';
  let icon = '▶️';
  let team = null;
  let playerName = null;
  let isScoring = false;

  const textLower = text.toLowerCase();

  // Goal
  if (textLower.includes('goal!') || (play?.type?.text === 'Goal')) {
    type = 'goal';
    icon = '⚽';
    isScoring = true;
    const scorer = play?.participants?.[0]?.athlete?.displayName || '';
    team = play?.team?.displayName || '';
    playerName = scorer;
    frenchText = `⚽ BUUUUUT !!! ${scorer} marque pour ${teamNames[team] || team} ! Le stade explose !`;
  }
  // Foul
  else if (textLower.includes('foul by') || play?.type?.text === 'Foul') {
    type = 'foul';
    icon = '🚫';
    const fouler = play?.participants?.[0]?.athlete?.displayName || text.match(/Foul by ([^(]+)/)?.[1]?.trim() || '';
    const victim = play?.participants?.[1]?.athlete?.displayName || '';
    team = play?.team?.displayName;
    playerName = fouler;
    frenchText = `🚫 Faute de ${fouler}${victim ? ` sur ${victim}` : ''}. L'arbitre siffle.`;
  }
  // Yellow Card
  else if (textLower.includes('yellow card') || play?.type?.text === 'Yellow Card') {
    type = 'yellowCard';
    icon = '🟨';
    const player = play?.participants?.[0]?.athlete?.displayName || text.match(/Yellow Card[^,]*,?\s*([^(]+)/i)?.[1]?.trim() || '';
    team = play?.team?.displayName;
    playerName = player;
    frenchText = `🟨 CARTON JAUNE ! ${player} (${teamNames[team] || team}) est averti par l'arbitre.`;
  }
  // Red Card
  else if (textLower.includes('red card') || play?.type?.text === 'Red Card') {
    type = 'redCard';
    icon = '🟥';
    const player = play?.participants?.[0]?.athlete?.displayName || '';
    team = play?.team?.displayName;
    playerName = player;
    frenchText = `🟥 CARTON ROUGE ! ${player} (${teamNames[team] || team}) est expulsé ! Le match bascule !`;
  }
  // Corner
  else if (textLower.includes('corner')) {
    type = 'corner';
    icon = '🚩';
    const teamMatch = text.match(/Corner,?\s*([^.]+)/i);
    team = teamMatch?.[1]?.trim();
    const concededBy = text.match(/Conceded by\s+([^.]+)/i)?.[1]?.trim() || '';
    frenchText = concededBy
      ? `🚩 Corner pour ${teamNames[team] || team}, concédé par ${concededBy}. Occasion à exploiter !`
      : `🚩 Corner pour ${teamNames[team] || team}. Occasion à exploiter !`;
  }
  // Substitution
  else if (textLower.includes('substitution') || play?.type?.text === 'Substitution') {
    type = 'substitution';
    icon = '🔄';
    const playerIn = play?.participants?.[0]?.athlete?.displayName || '';
    const playerOut = play?.participants?.[1]?.athlete?.displayName || '';
    team = play?.team?.displayName;
    frenchText = `🔄 Changement ${teamNames[team] || team}: ${playerIn} entre à la place de ${playerOut}.`;
  }
  // Offside
  else if (textLower.includes('offside')) {
    type = 'offside';
    icon = '🚫';
    const player = text.match(/Offside,?\s*([^.]+)/i)?.[1]?.trim() || '';
    frenchText = `🚫 Hors-jeu sifflé contre ${player}. L'action est annulée.`;
  }
  // Shot/Attempt
  else if (textLower.includes('attempt') || textLower.includes('shot')) {
    type = 'shot';
    icon = '🎯';
    // Extract shooter name from participants or text
    const shooter = play?.participants?.[0]?.athlete?.displayName ||
                    text.match(/Attempt[^.]*by\s+([^(]+)/i)?.[1]?.trim() ||
                    text.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:right|left|header)/i)?.[1]?.trim() || '';
    team = play?.team?.displayName;
    playerName = shooter;

    if (textLower.includes('saved') || textLower.includes('save')) {
      icon = '🧤';
      frenchText = shooter
        ? `🧤 Arrêt du gardien sur la frappe de ${shooter} ! Belle parade.`
        : `🧤 Arrêt du gardien ! Belle parade sur cette frappe.`;
    } else if (textLower.includes('missed') || textLower.includes('close') || textLower.includes('wide')) {
      frenchText = shooter
        ? `🎯 Tir de ${shooter} ! Ça passe à côté... Dommage !`
        : `🎯 Tir ! Ça passe à côté... Dommage !`;
    } else if (textLower.includes('blocked')) {
      const blocker = play?.participants?.[1]?.athlete?.displayName || '';
      frenchText = shooter
        ? `🛡️ Tir de ${shooter} bloqué${blocker ? ` par ${blocker}` : ' par la défense'} !`
        : `🛡️ Tir bloqué par la défense !`;
    } else {
      frenchText = shooter
        ? `🎯 Tentative de frappe de ${shooter} ! Le gardien veille.`
        : `🎯 Tentative de frappe ! Le gardien veille.`;
    }
  }
  // Injury/Delay
  else if (textLower.includes('delay') || textLower.includes('injury')) {
    type = 'injury';
    icon = '🏥';
    if (textLower.includes('over') || textLower.includes('ready')) {
      frenchText = `✅ Le jeu peut reprendre. Le joueur semble aller mieux.`;
      icon = '✅';
    } else {
      const player = text.match(/injury\s+([^(]+)/i)?.[1]?.trim() || '';
      frenchText = `🏥 Arrêt de jeu pour blessure${player ? ` de ${player}` : ''}. On espère que ce n'est pas grave.`;
    }
  }
  // Free kick won
  else if (textLower.includes('wins a free kick') || textLower.includes('free kick')) {
    type = 'freekick';
    icon = '⚡';
    const player = text.match(/([^(]+)\s*\([^)]+\)\s*wins/i)?.[1]?.trim() || '';
    const zone = textLower.includes('defensive') ? 'dans sa moitié de terrain' :
                 textLower.includes('attacking') ? 'dans le camp adverse' : '';
    playerName = player;
    frenchText = player
      ? `⚡ Coup franc obtenu par ${player}${zone ? ` ${zone}` : ''} !`
      : `⚡ Coup franc${zone ? ` ${zone}` : ''} !`;
  }
  // Half-time
  else if (textLower.includes('half ends') || textLower.includes('half-time')) {
    type = 'halftime';
    icon = '⏸️';
    frenchText = `⏸️ MI-TEMPS ! Les joueurs regagnent les vestiaires.`;
  }
  // Second half
  else if (textLower.includes('second half begins')) {
    type = 'info';
    icon = '▶️';
    frenchText = `▶️ C'est reparti pour la seconde période !`;
  }
  // First half begins
  else if (textLower.includes('first half begins')) {
    type = 'kickoff';
    icon = '⚽';
    frenchText = `⚽ COUP D'ENVOI ! C'est parti entre le Mali et le Sénégal !`;
  }
  // Generic - translate as-is with some style
  else {
    type = 'general';
    icon = '▶️';
    // Keep original for now, just add emoji
    frenchText = `▶️ ${text}`;
  }

  return {
    time,
    text: frenchText,
    type,
    icon,
    team: team || null,
    playerName: playerName || null,
    isScoring
  };
}

// Post commentary to API
async function postCommentary(event) {
  eventCounter++;

  const payload = {
    match_id: MATCH_ID,
    event_id: `espn_live_${eventCounter}`,
    competition: 'CAN 2025',
    time: event.time,
    time_seconds: eventCounter,
    locale: 'fr',
    text: event.text,
    type: event.type,
    team: event.team,
    player_name: event.playerName,
    icon: event.icon,
    is_scoring: event.isScoring,
    confidence: 1.0
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': WEBHOOK_SECRET
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    console.log(`✅ [${event.time}] ${event.text.substring(0, 60)}...`);
    return result;
  } catch (error) {
    console.error(`❌ Error posting: ${error.message}`);
    return null;
  }
}

// Fetch and process ESPN commentary
async function fetchAndProcessCommentary() {
  try {
    const response = await fetch(ESPN_URL);
    const data = await response.json();

    if (!data.commentary || data.commentary.length === 0) {
      console.log('📭 No commentary available yet');
      return;
    }

    // Get match status
    const status = data.header?.competitions?.[0]?.status;
    const clock = status?.displayClock || '';
    const state = status?.type?.state || '';
    const homeScore = data.header?.competitions?.[0]?.competitors?.[0]?.score || '0';
    const awayScore = data.header?.competitions?.[0]?.competitors?.[1]?.score || '0';

    console.log(`\n⏱️  [${new Date().toLocaleTimeString()}] ${clock} | Mali ${homeScore} - ${awayScore} Sénégal | Status: ${state}`);

    // Process new events
    let newEvents = 0;
    for (const event of data.commentary) {
      const eventKey = `${event.sequence}-${event.text?.substring(0, 30)}`;

      if (!postedEvents.has(eventKey)) {
        const translated = translateToFrench(event);

        if (translated && translated.text) {
          await postCommentary(translated);
          postedEvents.add(eventKey);
          newEvents++;

          // Small delay between posts
          await new Promise(r => setTimeout(r, 500));
        }
      }
    }

    if (newEvents === 0) {
      console.log('📋 No new events to post');
    } else {
      console.log(`📝 Posted ${newEvents} new events`);
    }

  } catch (error) {
    console.error(`❌ Fetch error: ${error.message}`);
  }
}

// Main loop
async function main() {
  console.log('🎮 Mali vs Sénégal - Live Commentary Agent');
  console.log('📡 Fetching ESPN events and translating to French');
  console.log('🔄 Polling every 30 seconds...\n');

  // Initial fetch
  await fetchAndProcessCommentary();

  // Poll every 30 seconds
  setInterval(fetchAndProcessCommentary, 30000);
}

main();
