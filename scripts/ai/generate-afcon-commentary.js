#!/usr/bin/env node

/**
 * Generate Real Commentary for Played AFCON Matches
 *
 * Features:
 * - Fetches all completed AFCON 2025 matches from ESPN
 * - Gets match events (goals, cards, substitutions)
 * - Generates AI commentary for each event using fine-tuned model
 * - Posts to database via API
 */

require('dotenv').config({ path: '.env.local' });
const https = require('https');
const http = require('http');

const VLLM_ENDPOINT = process.env.VLLM_ENDPOINT || 'https://qbjo7w9adplhia-8000.proxy.runpod.net/v1';
const VLLM_API_KEY = process.env.VLLM_API_KEY || 'sk-1234';
const VLLM_MODEL = process.env.VLLM_MODEL || 'oxmo88/Qwen2.5-VL-7B-AFCON2025';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.afriquesports.net';
const WEBHOOK_SECRET = process.env.AI_AGENT_WEBHOOK_SECRET;

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse JSON: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

function postJSON(url, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    const postData = JSON.stringify(data);

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (protocol === https ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        ...headers
      }
    };

    const req = protocol.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(responseData)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: responseData
          });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

/**
 * Fetch AFCON matches from ESPN
 */
async function fetchAFCONMatches() {
  console.log('Fetching AFCON 2025 matches from ESPN...');

  // ESPN AFCON league ID: afr.1
  const url = 'https://site.api.espn.com/apis/site/v2/sports/soccer/afr.1/scoreboard';

  try {
    const data = await fetchJSON(url);
    const events = data.events || [];

    // Filter only completed matches
    const completedMatches = events.filter(event => {
      const status = event.status?.type?.name;
      return status === 'STATUS_FINAL' || status === 'Final';
    });

    console.log(`   ✅ Found ${completedMatches.length} completed matches`);
    return completedMatches;
  } catch (error) {
    console.error(`   ❌ Failed to fetch matches:`, error.message);
    return [];
  }
}

/**
 * Get detailed match data including events
 */
async function getMatchDetails(matchId) {
  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/afr.1/summary?event=${matchId}`;

  try {
    const data = await fetchJSON(url);
    return data;
  } catch (error) {
    console.error(`   ❌ Failed to fetch match ${matchId}:`, error.message);
    return null;
  }
}

/**
 * Generate commentary for a match event using AI
 */
async function generateCommentary(event, matchContext) {
  const systemPrompt = `Tu es un commentateur sportif français expert en football africain, spécialisé dans la CAN. Tu génères des commentaires en direct professionnels et passionnés en français.

RÈGLES IMPORTANTES:
- Utilise TOUJOURS les articles définis: "Le Sénégal", "Le Cameroun", "La Tunisie", etc.
- Écris des commentaires courts (1-2 phrases maximum)
- Sois factuel et professionnel
- Mentionne les noms des joueurs quand disponibles
- Utilise un ton enthousiaste pour les buts et actions importantes`;

  const userPrompt = `Match: ${matchContext.homeTeam} vs ${matchContext.awayTeam}
Score: ${matchContext.homeScore} - ${matchContext.awayScore}
Minute: ${event.time}

Événement: ${event.type}
${event.player ? `Joueur: ${event.player}` : ''}
${event.description ? `Détails: ${event.description}` : ''}

Génère UN commentaire en français (1-2 phrases max) pour cet événement:`;

  try {
    const response = await postJSON(`${VLLM_ENDPOINT}/chat/completions`, {
      model: VLLM_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 150,
      temperature: 0.8
    }, {
      'Authorization': `Bearer ${VLLM_API_KEY}`
    });

    if (response.status !== 200) {
      throw new Error(`vLLM API error: ${response.status}`);
    }

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error(`      ❌ AI generation failed:`, error.message);
    return null;
  }
}

/**
 * Post commentary to database
 */
async function postCommentary(matchId, commentary) {
  if (!WEBHOOK_SECRET) {
    console.error('      ❌ AI_AGENT_WEBHOOK_SECRET not configured');
    return false;
  }

  try {
    const response = await postJSON(`${SITE_URL}/api/can2025/commentary`, {
      match_id: matchId,
      locale: 'fr',
      commentary: commentary
    }, {
      'x-webhook-secret': WEBHOOK_SECRET
    });

    return response.data.success;
  } catch (error) {
    console.error(`      ❌ Failed to post commentary:`, error.message);
    return false;
  }
}

/**
 * Process a single match
 */
async function processMatch(matchId, matchData) {
  console.log(`\n   Processing match ${matchId}...`);

  // Get match details
  const details = await getMatchDetails(matchId);
  if (!details) {
    console.log(`      ❌ Could not fetch match details`);
    return 0;
  }

  // Extract match info
  const header = details.header || {};
  const competition = header.competitions?.[0] || {};
  const competitors = competition.competitors || [];

  const homeTeam = competitors.find(c => c.homeAway === 'home');
  const awayTeam = competitors.find(c => c.homeAway === 'away');

  const matchContext = {
    homeTeam: homeTeam?.team?.displayName || 'Unknown',
    awayTeam: awayTeam?.team?.displayName || 'Unknown',
    homeScore: homeTeam?.score || '0',
    awayScore: awayTeam?.score || '0'
  };

  console.log(`      ${matchContext.homeTeam} ${matchContext.homeScore} - ${matchContext.awayScore} ${matchContext.awayTeam}`);

  // Get match events
  const commentary = details.commentary?.items || [];
  const plays = details.plays || [];

  console.log(`      Found ${commentary.length} commentary items, ${plays.length} plays`);

  // Convert ESPN events to our format
  const events = [];

  // Process plays (goals, cards, substitutions)
  for (const play of plays) {
    if (!play.text) continue;

    events.push({
      time: play.clock?.displayValue || play.period?.displayValue || '0\'',
      type: play.type?.text || 'play',
      player: play.participants?.[0]?.athlete?.displayName || '',
      description: play.text,
      scoringPlay: play.scoringPlay || false
    });
  }

  console.log(`      Generating commentary for ${events.length} events...`);

  let successCount = 0;
  for (let i = 0; i < Math.min(events.length, 20); i++) { // Limit to 20 events per match
    const event = events[i];

    console.log(`      [${i+1}/${events.length}] ${event.time} - ${event.type}`);

    // Generate AI commentary
    const commentaryText = await generateCommentary(event, matchContext);

    if (!commentaryText) continue;

    // Post to database
    const success = await postCommentary(matchId, {
      event_id: `${matchId}-${i}`,
      time: event.time,
      time_seconds: parseInt(event.time) * 60 || 0,
      text: commentaryText,
      type: event.scoringPlay ? 'goal' : event.type,
      team: event.player ? (homeTeam?.team?.athletes?.some(a => a.displayName === event.player) ? matchContext.homeTeam : matchContext.awayTeam) : null,
      player_name: event.player || null,
      is_scoring: event.scoringPlay || false,
      competition: 'CAN'
    });

    if (success) {
      successCount++;
      console.log(`         ✅ Posted: "${commentaryText.substring(0, 60)}..."`);
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log(`      ✅ Generated ${successCount} commentaries for this match`);
  return successCount;
}

/**
 * Main execution
 */
async function main() {
  console.log('========================================');
  console.log('AFCON 2025 Commentary Generator');
  console.log('========================================');
  console.log('');

  // Fetch completed matches
  const matches = await fetchAFCONMatches();

  if (matches.length === 0) {
    console.log('No completed matches found.');
    return;
  }

  console.log('');
  console.log(`Found ${matches.length} completed matches. Generating commentary...`);

  let totalCommentaries = 0;

  for (const match of matches) {
    const count = await processMatch(match.id, match);
    totalCommentaries += count;
  }

  console.log('');
  console.log('========================================');
  console.log('✅ COMPLETED');
  console.log('========================================');
  console.log(`Total matches processed: ${matches.length}`);
  console.log(`Total commentaries generated: ${totalCommentaries}`);
  console.log('');
}

main().catch(error => {
  console.error('');
  console.error('❌ FATAL ERROR:', error.message);
  console.error(error.stack);
  process.exit(1);
});
