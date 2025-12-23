#!/usr/bin/env node

/**
 * FULLY AUTONOMOUS MATCH COMMENTARY AGENT
 *
 * Does everything automatically:
 * 1. Searches web for upcoming CAN 2025 matches
 * 2. Researches teams, form, head-to-head automatically
 * 3. Generates pre-match analysis 24 hours before kickoff
 * 4. Finds YouTube live streams when match starts
 * 5. Extracts live chat and generates real-time commentary
 * 6. Posts everything to database automatically
 *
 * NO MANUAL INTERVENTION NEEDED!
 */

const https = require('https');
const http = require('http');

// Configuration
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const WEBHOOK_SECRET = process.env.AI_AGENT_WEBHOOK_SECRET;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.afriquesports.net';
const VLLM_BASE_URL = process.env.VLLM_BASE_URL || 'http://194.68.245.75:8000/v1';
const VLLM_API_KEY = process.env.VLLM_API_KEY || 'afrique-sports-70b-working';
const VLLM_MODEL = process.env.VLLM_MODEL || 'llama-3.1-70b';
const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
const PRE_MATCH_HOURS = 24; // Generate pre-match analysis 24 hours before

// YouTube channel where all CAN 2025 matches are streamed
const YOUTUBE_CHANNEL_URL = process.env.YOUTUBE_CHANNEL_URL || 'https://www.youtube.com/@afriquesports/live';

// Track processed matches
const processedMatches = new Set();
const activeStreams = new Map();

/**
 * Fetch JSON via HTTPS
 */
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
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

/**
 * POST JSON data
 */
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
          resolve({ status: res.statusCode, data: JSON.parse(responseData) });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

/**
 * Web search using DuckDuckGo (no API key needed)
 */
async function webSearch(query) {
  try {
    // Use DuckDuckGo instant answer API
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`;
    const data = await fetchJSON(url);

    return {
      abstract: data.Abstract || '',
      results: data.RelatedTopics?.slice(0, 5).map(t => ({
        text: t.Text || '',
        url: t.FirstURL || ''
      })) || []
    };
  } catch (error) {
    console.error(`[ERROR] Web search failed for "${query}":`, error.message);
    return { abstract: '', results: [] };
  }
}

/**
 * Research a team using web search
 */
async function researchTeam(teamName) {
  console.log(`   🔍 Researching ${teamName}...`);

  const queries = [
    `${teamName} recent form CAN 2025`,
    `${teamName} key players AFCON 2025`,
    `${teamName} last 5 matches results`
  ];

  const results = [];
  for (const query of queries) {
    const data = await webSearch(query);
    if (data.abstract) results.push(data.abstract);
    if (data.results.length > 0) {
      results.push(...data.results.map(r => r.text).filter(Boolean));
    }
    await new Promise(r => setTimeout(r, 1000)); // Rate limit
  }

  return results.join('\n');
}

/**
 * Find upcoming CAN 2025 matches
 */
async function findUpcomingMatches() {
  try {
    // Search for CAN 2025 schedule
    const searchData = await webSearch('CAN 2025 AFCON schedule today tomorrow matches');

    // Also check a sports API (you can add more sources)
    const apiUrl = 'https://site.api.espn.com/apis/site/v2/sports/soccer/caf.nations/scoreboard';
    const apiData = await fetchJSON(apiUrl);

    const matches = [];

    if (apiData.events) {
      for (const event of apiData.events) {
        const matchDate = new Date(event.date);
        const now = new Date();
        const hoursDiff = (matchDate - now) / (1000 * 60 * 60);

        // Include matches in next 48 hours or currently live
        if (hoursDiff <= 48 && hoursDiff >= -3) {
          const competitors = event.competitions[0].competitors;
          matches.push({
            id: event.id,
            homeTeam: competitors[0].team.displayName,
            awayTeam: competitors[1].team.displayName,
            date: matchDate,
            hoursTillKickoff: Math.max(0, hoursDiff),
            status: event.status.type.name,
            isLive: event.status.type.state === 'in',
            isPre: event.status.type.state === 'pre'
          });
        }
      }
    }

    return matches;
  } catch (error) {
    console.error('[ERROR] Failed to find upcoming matches:', error.message);
    return [];
  }
}

/**
 * Generate pre-match analysis using Llama 3.1 70B
 */
async function generatePreMatchAnalysis(match, homeTeamInfo, awayTeamInfo) {
  try {
    const prompt = `Tu es un analyste sportif expert. Génère une analyse d'avant-match professionnelle pour ce match de la CAN 2025.

MATCH: ${match.homeTeam} vs ${match.awayTeam}
DATE: ${match.date.toLocaleDateString('fr-FR')}
COUP D'ENVOI: Dans ${Math.round(match.hoursTillKickoff)} heures

INFORMATIONS ${match.homeTeam.toUpperCase()}:
${homeTeamInfo}

INFORMATIONS ${match.awayTeam.toUpperCase()}:
${awayTeamInfo}

Génère une analyse d'avant-match en français (200-300 mots) couvrant:
1. Forme récente des équipes
2. Joueurs clés à surveiller
3. Face-à-face historique si disponible
4. Pronostic tactique
5. Prédiction du résultat

Sois professionnel, précis et engageant.`;

    const payload = {
      model: VLLM_MODEL,
      messages: [
        { role: 'system', content: 'Tu es un analyste sportif français expert pour Afrique Sports.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 500,
      temperature: 0.7
    };

    const response = await postJSON(
      `${VLLM_BASE_URL}/chat/completions`,
      payload,
      { 'Authorization': `Bearer ${VLLM_API_KEY}` }
    );

    if (response.status !== 200) {
      throw new Error(`vLLM API error: ${response.status}`);
    }

    return response.data.choices[0].message.content.trim();

  } catch (error) {
    console.error('[ERROR] Failed to generate pre-match analysis:', error.message);
    return null;
  }
}

/**
 * Generate live commentary from YouTube chat
 */
async function generateLiveCommentary(match, chatContext) {
  try {
    const prompt = `Match en direct: ${match.homeTeam} vs ${match.awayTeam}

Réactions récentes des spectateurs YouTube:
${chatContext}

Génère UN commentaire de match professionnel en français (2-3 phrases) basé sur ces réactions. Décris l'action probable.`;

    const payload = {
      model: VLLM_MODEL,
      messages: [
        { role: 'system', content: 'Tu es un commentateur sportif français pour Afrique Sports.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 150,
      temperature: 0.85
    };

    const response = await postJSON(
      `${VLLM_BASE_URL}/chat/completions`,
      payload,
      { 'Authorization': `Bearer ${VLLM_API_KEY}` }
    );

    if (response.status !== 200) {
      throw new Error(`vLLM API error: ${response.status}`);
    }

    return response.data.choices[0].message.content.trim();

  } catch (error) {
    console.error('[ERROR] Failed to generate live commentary:', error.message);
    return null;
  }
}

/**
 * Post commentary to database
 */
async function postCommentary(matchId, commentary, type = 'general', isScoring = false, team = null, scorer = null) {
  try {
    const eventId = `auto_${matchId}_${Date.now()}`;

    const payload = {
      match_id: matchId,
      event_id: eventId,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) + "'",
      time_seconds: Math.floor(Date.now() / 1000),
      locale: 'fr',
      text: commentary,
      type,
      team: team,
      player_name: scorer,
      icon: type === 'goal' ? '⚽' : type === 'preMatch' ? '📋' : type === 'yellowCard' ? '🟨' : type === 'redCard' ? '🟥' : '📺',
      is_scoring: isScoring,
      confidence: 0.90
    };

    const response = await postJSON(
      `${SITE_URL}/api/can2025/live-commentary`,
      payload,
      { 'x-webhook-secret': WEBHOOK_SECRET }
    );

    if (response.status === 200 || response.status === 201) {
      console.log(`   ✅ Commentary posted for match ${matchId}`);
      return true;
    } else if (response.status === 409) {
      console.log(`   ⚠️  Commentary already exists (duplicate)`);
      return false;
    } else {
      console.error(`   ❌ Failed to post commentary: ${response.status}`);
      return false;
    }

  } catch (error) {
    console.error('[ERROR] Failed to post commentary:', error.message);
    return false;
  }
}

/**
 * Scrape YouTube channel page to find current live stream
 */
async function scrapeYouTubeLiveStream() {
  return new Promise((resolve, reject) => {
    https.get(YOUTUBE_CHANNEL_URL, (res) => {
      let html = '';
      res.on('data', chunk => html += chunk);
      res.on('end', () => {
        try {
          // Extract video ID from YouTube's HTML
          // Look for patterns like: "videoId":"VIDEO_ID_HERE"
          const videoIdMatch = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
          if (videoIdMatch && videoIdMatch[1]) {
            const videoId = videoIdMatch[1];

            // Extract title if available
            const titleMatch = html.match(/"title":{"runs":\[{"text":"([^"]+)"/);
            const title = titleMatch ? titleMatch[1] : 'CAN 2025 Live';

            // Extract channel name
            const channelMatch = html.match(/"ownerChannelName":"([^"]+)"/);
            const channel = channelMatch ? channelMatch[1] : 'Afrique Sports';

            resolve({
              videoId,
              title,
              channel
            });
          } else {
            resolve(null);
          }
        } catch (error) {
          console.error('[ERROR] Failed to parse YouTube HTML:', error.message);
          resolve(null);
        }
      });
    }).on('error', (error) => {
      console.error('[ERROR] Failed to fetch YouTube page:', error.message);
      resolve(null);
    });
  });
}

/**
 * Search YouTube for live stream (with fallback to scraping)
 */
async function findYouTubeLiveStream(match) {
  // Try YouTube API if available
  if (YOUTUBE_API_KEY) {
    try {
      const query = `${match.homeTeam} ${match.awayTeam} live CAN 2025`;
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&eventType=live&type=video&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}&maxResults=3`;

      const data = await fetchJSON(url);

      if (data.items && data.items.length > 0) {
        const stream = data.items[0];
        return {
          videoId: stream.id.videoId,
          title: stream.snippet.title,
          channel: stream.snippet.channelTitle
        };
      }
    } catch (error) {
      console.error('[ERROR] YouTube API search failed:', error.message);
    }
  }

  // Fallback: Scrape YouTube channel page for current live stream
  console.log(`   🔍 Scraping YouTube channel for current live stream...`);
  const scrapedStream = await scrapeYouTubeLiveStream();

  if (scrapedStream) {
    console.log(`   ✅ Found live stream: ${scrapedStream.videoId}`);
    return scrapedStream;
  }

  console.log(`   ⚠️  No live stream found on YouTube channel`);
  return null;
}

/**
 * Get YouTube live chat messages
 */
async function getYouTubeChatMessages(videoId) {
  if (!YOUTUBE_API_KEY) return [];

  try {
    const videoUrl = `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`;
    const videoData = await fetchJSON(videoUrl);

    if (!videoData.items || videoData.items.length === 0) return [];

    const liveChatId = videoData.items[0].liveStreamingDetails?.activeLiveChatId;
    if (!liveChatId) return [];

    const chatUrl = `https://www.googleapis.com/youtube/v3/liveChat/messages?liveChatId=${liveChatId}&part=snippet,authorDetails&maxResults=50&key=${YOUTUBE_API_KEY}`;
    const chatData = await fetchJSON(chatUrl);

    if (!chatData.items) return [];

    return chatData.items.map(item => ({
      author: item.authorDetails.displayName,
      message: item.snippet.displayMessage,
      timestamp: item.snippet.publishedAt
    }));

  } catch (error) {
    console.error('[ERROR] Failed to get YouTube chat:', error.message);
    return [];
  }
}

/**
 * Set YouTube stream for match
 */
async function setYouTubeStream(matchId, videoId, title, channel) {
  try {
    const response = await postJSON(
      `${SITE_URL}/api/match-youtube-stream`,
      {
        match_id: matchId,
        youtube_video_id: videoId,
        channel_name: channel,
        video_title: title,
        is_live: true
      }
    );

    if (response.status === 200) {
      console.log(`   ✅ YouTube stream set for match ${matchId}`);
      return true;
    }
  } catch (error) {
    console.error('[ERROR] Failed to set YouTube stream:', error.message);
  }
  return false;
}

/**
 * Process pre-match (24 hours before kickoff)
 */
async function processPreMatch(match) {
  const key = `prematch_${match.id}`;
  if (processedMatches.has(key)) return;

  console.log(`\n📋 GENERATING PRE-MATCH ANALYSIS`);
  console.log(`   Match: ${match.homeTeam} vs ${match.awayTeam}`);
  console.log(`   Kickoff: In ${Math.round(match.hoursTillKickoff)} hours`);

  // Research both teams automatically
  const [homeTeamInfo, awayTeamInfo] = await Promise.all([
    researchTeam(match.homeTeam),
    researchTeam(match.awayTeam)
  ]);

  // Generate pre-match analysis with AI
  const analysis = await generatePreMatchAnalysis(match, homeTeamInfo, awayTeamInfo);

  if (!analysis) {
    console.log('   ❌ Failed to generate analysis');
    return;
  }

  console.log(`   📝 Generated: "${analysis.substring(0, 80)}..."`);

  // Post to database
  const success = await postCommentary(match.id, analysis, 'preMatch', false);

  if (success) {
    processedMatches.add(key);
    console.log(`   ✅ Pre-match analysis published!`);
  }
}

/**
 * Get match details and key events from API
 */
async function getMatchDetails(matchId) {
  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/caf.nations/summary?event=${matchId}`;
    const data = await fetchJSON(url);

    if (!data.header) return null;

    const competition = data.header.competitions[0];
    const competitors = competition.competitors;

    return {
      homeTeam: {
        name: competitors[0].team.displayName,
        abbreviation: competitors[0].team.abbreviation,
        score: competitors[0].score || 0
      },
      awayTeam: {
        name: competitors[1].team.displayName,
        abbreviation: competitors[1].team.abbreviation,
        score: competitors[1].score || 0
      },
      status: data.header.status,
      minute: data.header.status?.displayClock || null,
      keyEvents: data.keyEvents || []
    };
  } catch (error) {
    console.error('[ERROR] Failed to get match details:', error.message);
    return null;
  }
}

/**
 * Process key events (goals, cards, etc.) and post commentary
 */
async function processKeyEvents(matchId, keyEvents, homeTeam, awayTeam) {
  if (!keyEvents || keyEvents.length === 0) return;

  for (const event of keyEvents) {
    const eventId = `espn_event_${matchId}_${event.id || Date.now()}`;
    const eventKey = `event_${eventId}`;

    // Skip if already posted
    if (processedMatches.has(eventKey)) continue;

    const eventType = event.type?.text || '';
    const minute = event.clock?.displayValue || '';
    const text = event.text || '';

    // Process goals
    if (eventType.toLowerCase().includes('goal') && !eventType.toLowerCase().includes('own goal')) {
      // Extract scorer from participants
      const scorer = event.participants?.[0]?.athlete?.displayName || 'Unknown';
      const assist = event.participants?.[1]?.athlete?.displayName || null;

      // Determine which team scored based on text content
      let team = 'home';
      let teamName = homeTeam.name;

      if (text.includes(awayTeam.name) && text.indexOf(awayTeam.name) < text.indexOf(scorer)) {
        team = 'away';
        teamName = awayTeam.name;
      }

      // Generate goal commentary in French
      let commentary = `⚽ BUT ! ${teamName} ${team === 'home' ? homeTeam.score : awayTeam.score} - ${team === 'home' ? awayTeam.score : homeTeam.score} ${team === 'home' ? awayTeam.name : homeTeam.name}. ${scorer} marque pour ${teamName} !`;

      if (assist) {
        commentary += ` Passe décisive de ${assist}.`;
      }

      // Post goal event
      const success = await postCommentary(
        matchId,
        commentary,
        'goal',
        true, // is_scoring
        team,
        scorer
      );

      if (success) {
        processedMatches.add(eventKey);
        console.log(`   ⚽ Goal posted: ${scorer} (${minute})`);
      }
    }
    // Process yellow cards
    else if (eventType.toLowerCase().includes('yellow card')) {
      const player = event.participants?.[0]?.athlete?.displayName || 'Unknown';
      const commentary = `🟨 Carton jaune pour ${player} à la ${minute}.`;

      const success = await postCommentary(matchId, commentary, 'yellowCard', false);
      if (success) {
        processedMatches.add(eventKey);
        console.log(`   🟨 Yellow card posted: ${player}`);
      }
    }
    // Process red cards
    else if (eventType.toLowerCase().includes('red card')) {
      const player = event.participants?.[0]?.athlete?.displayName || 'Unknown';
      const commentary = `🟥 Carton rouge ! ${player} est expulsé à la ${minute} !`;

      const success = await postCommentary(matchId, commentary, 'redCard', false);
      if (success) {
        processedMatches.add(eventKey);
        console.log(`   🟥 Red card posted: ${player}`);
      }
    }
  }
}

/**
 * Process live match
 */
async function processLiveMatch(match) {
  console.log(`\n🔴 PROCESSING LIVE MATCH`);
  console.log(`   Match: ${match.homeTeam} vs ${match.awayTeam}`);

  // Check if this is the first time processing this live match
  const matchKey = `live_${match.id}`;
  const isFirstProcessing = !processedMatches.has(matchKey);

  // Get detailed match info
  const details = await getMatchDetails(match.id);

  if (details && details.minute) {
    console.log(`   ⏱️  Current minute: ${details.minute}`);
    console.log(`   📊 Score: ${details.homeTeam.score} - ${details.awayTeam.score}`);
  }

  // Post match start event (only once)
  if (isFirstProcessing) {
    const startCommentary = `🎬 Le match commence ! ${match.homeTeam} affronte ${match.awayTeam} pour la CAN 2025. Suivez le match en direct avec nos commentaires !`;
    await postCommentary(match.id, startCommentary, 'matchStart', false);
    processedMatches.add(matchKey);
    console.log(`   ✅ Match start event posted`);
  }

  // Process key events (goals, cards, etc.)
  if (details && details.keyEvents) {
    await processKeyEvents(match.id, details.keyEvents, details.homeTeam, details.awayTeam);
  }

  // Find YouTube stream automatically
  const stream = await findYouTubeLiveStream(match);

  if (!stream) {
    console.log(`   ⚠️  No YouTube live stream found`);

    // Still generate commentary based on match details if available
    if (details && details.minute) {
      const minuteCommentary = `${details.minute} - Le match est en cours. Score actuel : ${details.homeTeam.name} ${details.homeTeam.score} - ${details.awayTeam.score} ${details.awayTeam.name}.`;
      await postCommentary(match.id, minuteCommentary, 'general', false);
    }
    return;
  }

  console.log(`   📺 Found stream: ${stream.title}`);
  console.log(`   📡 Channel: ${stream.channel}`);

  // Set YouTube stream for match page
  await setYouTubeStream(match.id, stream.videoId, stream.title, stream.channel);

  // Get live chat messages
  const chatMessages = await getYouTubeChatMessages(stream.videoId);
  console.log(`   💬 Chat messages: ${chatMessages.length}`);

  if (chatMessages.length === 0) {
    console.log(`   ⚠️  No chat messages available`);

    // Generate commentary based on match state
    if (details && details.minute) {
      const stateCommentary = `⚽ ${details.minute} - Match en cours à ${details.homeTeam.score}-${details.awayTeam.score}. L'action est intense sur le terrain !`;
      await postCommentary(match.id, stateCommentary, 'general', false);
    }
    return;
  }

  // Filter relevant messages (goals, penalties, etc.)
  const relevantMessages = chatMessages.filter(msg => {
    const text = msg.message.toLowerCase();
    return text.length > 20 ||
           text.includes('goal') || text.includes('but') || text.includes('gol') ||
           text.includes('penalty') || text.includes('card') ||
           text.includes('red') || text.includes('yellow');
  }).slice(0, 10);

  if (relevantMessages.length === 0) {
    console.log(`   ⚠️  No relevant chat messages`);
    return;
  }

  // Generate commentary from chat
  const chatContext = relevantMessages.map(m => `${m.author}: ${m.message}`).join('\n');
  const commentary = await generateLiveCommentary(match, chatContext);

  if (!commentary) {
    console.log(`   ❌ Failed to generate commentary`);
    return;
  }

  console.log(`   💬 Generated: "${commentary.substring(0, 60)}..."`);

  // Detect if this is a goal from chat sentiment
  const isGoal = relevantMessages.some(m => {
    const text = m.message.toLowerCase();
    return text.includes('goal') || text.includes('but') || text.includes('gol') || text.includes('⚽');
  });

  // Post to database
  await postCommentary(match.id, commentary, isGoal ? 'goal' : 'general', isGoal);

  // Track stream
  activeStreams.set(match.id, {
    videoId: stream.videoId,
    lastUpdate: Date.now(),
    lastMinute: details?.minute
  });
}

/**
 * Main autonomous loop
 */
async function autonomousLoop() {
  console.log(`\n🤖 AUTONOMOUS AGENT CYCLE - ${new Date().toLocaleString('fr-FR')}`);
  console.log('━'.repeat(80));

  // Find upcoming matches automatically
  const matches = await findUpcomingMatches();

  if (matches.length === 0) {
    console.log('   No matches found in next 48 hours');
    return;
  }

  console.log(`   Found ${matches.length} match(es):`);
  matches.forEach(m => {
    const status = m.isLive ? '🔴 LIVE' : m.isPre ? `⏰ ${Math.round(m.hoursTillKickoff)}h` : '✅ Finished';
    console.log(`   - ${m.homeTeam} vs ${m.awayTeam} (${status})`);
  });

  // Process each match
  for (const match of matches) {
    try {
      if (match.isLive) {
        // Generate live commentary automatically
        await processLiveMatch(match);
      } else if (match.isPre && match.hoursTillKickoff <= PRE_MATCH_HOURS && match.hoursTillKickoff > 0) {
        // Generate pre-match analysis automatically
        await processPreMatch(match);
      }

      await new Promise(r => setTimeout(r, 2000)); // 2s between matches
    } catch (error) {
      console.error(`[ERROR] Failed to process match ${match.id}:`, error.message);
    }
  }

  console.log('━'.repeat(80));
}

/**
 * Start autonomous agent
 */
async function startAgent() {
  console.log('🤖 FULLY AUTONOMOUS MATCH COMMENTARY AGENT');
  console.log('==========================================');
  console.log(`📡 vLLM Endpoint: ${VLLM_BASE_URL}`);
  console.log(`🌐 Site URL: ${SITE_URL}`);
  console.log(`⏱️  Check Interval: ${CHECK_INTERVAL / 60000} minutes`);
  console.log(`📋 Pre-match: ${PRE_MATCH_HOURS} hours before kickoff`);
  console.log(`🔍 Web Search: DuckDuckGo (no API key needed)`);
  console.log(`📺 YouTube: ${YOUTUBE_API_KEY ? 'Enabled' : 'Disabled (set YOUTUBE_API_KEY)'}`);
  console.log('==========================================\n');

  if (!WEBHOOK_SECRET) {
    console.error('❌ FATAL: AI_AGENT_WEBHOOK_SECRET not set!');
    process.exit(1);
  }

  console.log('✅ Agent is FULLY AUTONOMOUS');
  console.log('✅ Will research teams automatically');
  console.log('✅ Will generate pre-match analysis');
  console.log('✅ Will find YouTube streams');
  console.log('✅ Will generate live commentary');
  console.log('✅ NO MANUAL INTERVENTION NEEDED!\n');

  // Initial run
  await autonomousLoop();

  // Schedule regular checks
  setInterval(async () => {
    try {
      await autonomousLoop();
    } catch (error) {
      console.error('[ERROR] Autonomous loop failed:', error);
    }
  }, CHECK_INTERVAL);

  console.log(`\n✅ Agent running autonomously - checking every ${CHECK_INTERVAL / 60000} minutes\n`);
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Agent shutting down...');
  console.log(`📊 Matches processed: ${processedMatches.size}`);
  console.log(`📺 Active streams: ${activeStreams.size}`);
  console.log('👋 Goodbye!\n');
  process.exit(0);
});

// Start
startAgent().catch(error => {
  console.error('FATAL ERROR:', error);
  process.exit(1);
});
