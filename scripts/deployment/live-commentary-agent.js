#!/usr/bin/env node

/**
 * Autonomous Live Commentary Agent
 * Monitors CAN 2025 matches and generates real-time commentary using Llama 3.1 70B
 *
 * Features:
 * - Auto-detects live matches from ESPN API
 * - Generates French commentary using RunPod vLLM server
 * - Posts commentary to Supabase in real-time
 * - Runs continuously as a background service
 */

const https = require('https');
const http = require('http');

// Configuration from environment
const VLLM_BASE_URL = process.env.VLLM_BASE_URL || 'https://qbjo7w9adplhia-8000.proxy.runpod.net/v1';
const VLLM_API_KEY = process.env.VLLM_API_KEY || 'sk-1234';
const VLLM_MODEL = process.env.VLLM_MODEL || 'oxmo88/Qwen2.5-VL-7B-AFCON2025';
const WEBHOOK_SECRET = process.env.AI_AGENT_WEBHOOK_SECRET;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const CHECK_INTERVAL = parseInt(process.env.CHECK_INTERVAL_SECONDS || '60') * 1000; // Default: 60 seconds
const COMMENTARY_INTERVAL = parseInt(process.env.COMMENTARY_INTERVAL_MINUTES || '5') * 60 * 1000; // Default: 5 minutes

// Track active matches and their last commentary time
const activeMatches = new Map();
const commentaryHistory = new Map();

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
 * Fetch live CAN 2025 matches from ESPN API
 */
async function getLiveMatches() {
  try {
    const url = 'https://site.api.espn.com/apis/site/v2/sports/soccer/caf.nations/scoreboard';
    const data = await fetchJSON(url);

    if (!data.events || data.events.length === 0) {
      return [];
    }

    // Filter for live matches
    const liveMatches = data.events.filter(event => {
      const status = event.status?.type?.state;
      return status === 'in'; // 'in' means match is currently live
    });

    return liveMatches.map(event => ({
      id: event.id,
      name: event.name,
      shortName: event.shortName,
      status: event.status,
      competitions: event.competitions
    }));
  } catch (error) {
    console.error('[ERROR] Failed to fetch live matches:', error.message);
    return [];
  }
}

/**
 * Generate commentary using Llama 3.1 70B
 */
async function generateCommentary(matchData) {
  try {
    const competition = matchData.competitions[0];
    const homeTeam = competition.competitors[0];
    const awayTeam = competition.competitors[1];
    const status = matchData.status;

    const homeScore = homeTeam.score || 0;
    const awayScore = awayTeam.score || 0;
    const currentMinute = status.displayClock || status.period + '\'';

    // Get statistics if available
    const stats = competition.situation || {};

    const prompt = `Match CAN 2025 en direct : ${homeTeam.team.displayName} ${homeScore}-${awayScore} ${awayTeam.team.displayName}

Minute actuelle: ${currentMinute}
Période: ${status.period}

Génère UN SEUL commentaire court et vivant (2-3 phrases max) décrivant l'action en cours ou l'ambiance du match. Style commentateur radio français passionné.`;

    const payload = {
      model: VLLM_MODEL,
      messages: [
        {
          role: 'system',
          content: 'Tu es un commentateur sportif français pour Afrique Sports. Génère des commentaires courts et vivants.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 150,
      temperature: 0.85
    };

    const response = await postJSON(
      `${VLLM_BASE_URL}/chat/completions`,
      payload,
      {
        'Authorization': `Bearer ${VLLM_API_KEY}`
      }
    );

    if (response.status !== 200) {
      throw new Error(`vLLM API error: ${response.status}`);
    }

    const commentaryText = response.data.choices[0].message.content.trim();

    return {
      text: commentaryText,
      time: currentMinute,
      homeTeam: homeTeam.team.displayName,
      awayTeam: awayTeam.team.displayName,
      homeScore,
      awayScore
    };

  } catch (error) {
    console.error('[ERROR] Failed to generate commentary:', error.message);
    return null;
  }
}

/**
 * Post commentary event to database
 */
async function postCommentaryEvent(matchId, commentary, timeSeconds) {
  try {
    const eventId = `${matchId}_auto_${Date.now()}`;

    const payload = {
      match_id: matchId,
      event_id: eventId,
      time: commentary.time,
      time_seconds: timeSeconds,
      locale: 'fr',
      text: commentary.text,
      type: 'general',
      icon: '⚽',
      is_scoring: false,
      confidence: 0.90
    };

    const response = await postJSON(
      `${SITE_URL}/api/can2025/live-commentary`,
      payload,
      {
        'x-webhook-secret': WEBHOOK_SECRET
      }
    );

    if (response.status === 200 || response.status === 201) {
      console.log(`✅ [${commentary.time}] Commentary posted for match ${matchId}`);
      return true;
    } else if (response.status === 409) {
      console.log(`⚠️  [${commentary.time}] Commentary already exists (duplicate event_id)`);
      return false;
    } else {
      console.error(`❌ Failed to post commentary: ${response.status}`, response.data);
      return false;
    }

  } catch (error) {
    console.error('[ERROR] Failed to post commentary event:', error.message);
    return false;
  }
}

/**
 * Process a live match - generate and post commentary
 */
async function processLiveMatch(match) {
  const matchId = match.id;
  const now = Date.now();

  // Check if we've recently posted commentary for this match
  const lastCommentary = activeMatches.get(matchId);
  if (lastCommentary && (now - lastCommentary) < COMMENTARY_INTERVAL) {
    // Too soon, skip
    return;
  }

  console.log(`\n🎙️  Processing live match: ${match.shortName}`);

  // Generate commentary
  const commentary = await generateCommentary(match);

  if (!commentary) {
    console.error(`❌ Failed to generate commentary for match ${matchId}`);
    return;
  }

  console.log(`📝 Generated: "${commentary.text.substring(0, 80)}..."`);

  // Calculate time in seconds from displayClock (e.g., "67'" -> 4020 seconds)
  const timeMatch = commentary.time.match(/(\d+)/);
  const minutes = timeMatch ? parseInt(timeMatch[1]) : 0;
  const timeSeconds = minutes * 60;

  // Post to database
  const success = await postCommentaryEvent(matchId, commentary, timeSeconds);

  if (success) {
    activeMatches.set(matchId, now);

    // Track commentary for this match
    if (!commentaryHistory.has(matchId)) {
      commentaryHistory.set(matchId, []);
    }
    commentaryHistory.get(matchId).push({
      time: commentary.time,
      text: commentary.text,
      timestamp: now
    });
  }
}

/**
 * Main monitoring loop
 */
async function monitorLiveMatches() {
  console.log(`\n🔍 Checking for live CAN 2025 matches...`);

  const liveMatches = await getLiveMatches();

  if (liveMatches.length === 0) {
    console.log('   No live matches at the moment');
    return;
  }

  console.log(`   Found ${liveMatches.length} live match(es):`);
  liveMatches.forEach(match => {
    console.log(`   - ${match.shortName} (ID: ${match.id})`);
  });

  // Process each live match
  for (const match of liveMatches) {
    await processLiveMatch(match);
    // Small delay between matches
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Clean up finished matches
  const liveMatchIds = new Set(liveMatches.map(m => m.id));
  for (const [matchId] of activeMatches) {
    if (!liveMatchIds.has(matchId)) {
      console.log(`✅ Match ${matchId} finished - removing from active monitoring`);
      activeMatches.delete(matchId);
    }
  }
}

/**
 * Start the agent
 */
async function startAgent() {
  console.log('🤖 LIVE COMMENTARY AGENT STARTED');
  console.log('================================');
  console.log(`📡 vLLM Endpoint: ${VLLM_BASE_URL}`);
  console.log(`🔑 API Key: ${VLLM_API_KEY.substring(0, 20)}...`);
  console.log(`🌐 Site URL: ${SITE_URL}`);
  console.log(`⏱️  Check Interval: ${CHECK_INTERVAL / 1000}s`);
  console.log(`💬 Commentary Interval: ${COMMENTARY_INTERVAL / 60000} minutes`);
  console.log('================================\n');

  if (!WEBHOOK_SECRET) {
    console.error('❌ FATAL: AI_AGENT_WEBHOOK_SECRET not set!');
    process.exit(1);
  }

  // Test vLLM connection
  console.log('🔌 Testing vLLM connection...');
  try {
    const testResponse = await postJSON(
      `${VLLM_BASE_URL}/chat/completions`,
      {
        model: VLLM_MODEL,
        messages: [{ role: 'user', content: 'Test' }],
        max_tokens: 10
      },
      { 'Authorization': `Bearer ${VLLM_API_KEY}` }
    );

    if (testResponse.status === 200) {
      console.log('✅ vLLM connection successful!\n');
    } else {
      console.error('⚠️  vLLM connection issue:', testResponse.status);
    }
  } catch (error) {
    console.error('❌ Failed to connect to vLLM:', error.message);
    console.error('⚠️  Agent will continue but commentary generation may fail');
  }

  // Initial check
  await monitorLiveMatches();

  // Start monitoring loop
  setInterval(async () => {
    try {
      await monitorLiveMatches();
    } catch (error) {
      console.error('[ERROR] Monitoring loop failed:', error);
    }
  }, CHECK_INTERVAL);

  console.log(`\n✅ Agent running - monitoring every ${CHECK_INTERVAL / 1000} seconds\n`);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Agent shutting down gracefully...');
  console.log(`📊 Total matches monitored: ${activeMatches.size}`);
  console.log('👋 Goodbye!\n');
  process.exit(0);
});

// Start the agent
startAgent().catch(error => {
  console.error('FATAL ERROR:', error);
  process.exit(1);
});
