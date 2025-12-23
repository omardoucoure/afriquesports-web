#!/usr/bin/env node

/**
 * YouTube Live Commentary Agent
 * Monitors YouTube for live CAN 2025 matches and extracts commentary from:
 * - Live chat messages
 * - Video transcriptions/captions
 * - Video descriptions
 *
 * Replaces ESPN API with YouTube as primary data source
 */

const https = require('https');
const http = require('http');

// Configuration
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const WEBHOOK_SECRET = process.env.AI_AGENT_WEBHOOK_SECRET;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const CHECK_INTERVAL = parseInt(process.env.CHECK_INTERVAL_SECONDS || '60') * 1000;
const VLLM_BASE_URL = process.env.VLLM_BASE_URL || 'http://194.68.245.75:8000/v1';
const VLLM_API_KEY = process.env.VLLM_API_KEY || 'afrique-sports-70b-working';
const VLLM_MODEL = process.env.VLLM_MODEL || 'llama-3.1-70b';

// Track active live streams
const activeStreams = new Map();
const processedChatMessages = new Set();

/**
 * Search terms for CAN 2025 matches
 */
const SEARCH_QUERIES = [
  'CAN 2025 live',
  'AFCON 2025 live',
  'Coupe d\'Afrique live',
  'Tunisia Uganda live',
  'Morocco live AFCON',
  'Senegal live CAN'
];

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
 * Search YouTube for live CAN 2025 matches
 */
async function searchYouTubeLiveStreams() {
  if (!YOUTUBE_API_KEY) {
    console.error('[ERROR] YOUTUBE_API_KEY not set');
    return [];
  }

  const liveStreams = [];

  for (const query of SEARCH_QUERIES) {
    try {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&eventType=live&type=video&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}&maxResults=5`;

      const data = await fetchJSON(url);

      if (data.items && data.items.length > 0) {
        for (const item of data.items) {
          liveStreams.push({
            videoId: item.id.videoId,
            title: item.snippet.title,
            channel: item.snippet.channelTitle,
            channelId: item.snippet.channelId,
            description: item.snippet.description,
            publishedAt: item.snippet.publishedAt
          });
        }
      }
    } catch (error) {
      console.error(`[ERROR] Failed to search YouTube for "${query}":`, error.message);
    }
  }

  return liveStreams;
}

/**
 * Get live chat messages from YouTube video
 */
async function getLiveChatMessages(videoId) {
  try {
    // First, get the live chat ID
    const videoUrl = `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`;
    const videoData = await fetchJSON(videoUrl);

    if (!videoData.items || videoData.items.length === 0) {
      return [];
    }

    const liveChatId = videoData.items[0].liveStreamingDetails?.activeLiveChatId;

    if (!liveChatId) {
      return [];
    }

    // Get live chat messages
    const chatUrl = `https://www.googleapis.com/youtube/v3/liveChat/messages?liveChatId=${liveChatId}&part=snippet,authorDetails&maxResults=50&key=${YOUTUBE_API_KEY}`;
    const chatData = await fetchJSON(chatUrl);

    if (!chatData.items) {
      return [];
    }

    return chatData.items.map(item => ({
      id: item.id,
      author: item.authorDetails.displayName,
      message: item.snippet.displayMessage,
      timestamp: item.snippet.publishedAt
    }));

  } catch (error) {
    console.error(`[ERROR] Failed to get live chat for ${videoId}:`, error.message);
    return [];
  }
}

/**
 * Extract match info from YouTube title/description
 */
function extractMatchInfo(stream) {
  const title = stream.title.toLowerCase();
  const description = stream.description.toLowerCase();
  const text = `${title} ${description}`;

  // Try to extract team names and match ID
  const matchInfo = {
    homeTeam: null,
    awayTeam: null,
    matchId: null,
    isLive: true
  };

  // Common CAN 2025 team names
  const teams = [
    'tunisia', 'tunisie', 'uganda', 'ouganda',
    'morocco', 'maroc', 'senegal', 'sénégal',
    'egypt', 'egypte', 'nigeria', 'algeria', 'algérie',
    'cameroon', 'cameroun', 'ivory coast', 'côte d\'ivoire',
    'ghana', 'mali', 'tanzania', 'tanzanie'
  ];

  // Look for "Team1 vs Team2" pattern
  const vsPattern = /(\w+)\s+(?:vs|v|versus|-)\s+(\w+)/i;
  const vsMatch = title.match(vsPattern);

  if (vsMatch) {
    matchInfo.homeTeam = vsMatch[1];
    matchInfo.awayTeam = vsMatch[2];
  }

  return matchInfo;
}

/**
 * Generate commentary from live chat using Llama 3.1 70B
 */
async function generateCommentaryFromChat(stream, chatMessages) {
  try {
    // Filter interesting chat messages (mentions of goals, players, etc.)
    const relevantMessages = chatMessages.filter(msg => {
      const text = msg.message.toLowerCase();
      return text.includes('goal') || text.includes('but') || text.includes('gol') ||
             text.includes('penalty') || text.includes('red card') || text.includes('yellow') ||
             text.length > 20; // Longer messages are more likely to be meaningful
    }).slice(0, 10); // Take last 10 relevant messages

    if (relevantMessages.length === 0) {
      return null;
    }

    const chatContext = relevantMessages.map(m => `- ${m.author}: ${m.message}`).join('\n');

    const prompt = `Match de football en direct: ${stream.title}

Messages récents du chat YouTube:
${chatContext}

Génère UN commentaire de match professionnel en français (2-3 phrases) basé sur ces réactions des spectateurs. Décris l'action probable qui a causé ces réactions.`;

    const payload = {
      model: VLLM_MODEL,
      messages: [
        {
          role: 'system',
          content: 'Tu es un commentateur sportif français pour Afrique Sports. Génère des commentaires vivants basés sur les réactions des spectateurs.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 150,
      temperature: 0.8
    };

    const response = await postJSON(
      `${VLLM_BASE_URL}/chat/completions`,
      payload,
      { 'Authorization': `Bearer ${VLLM_API_KEY}` }
    );

    if (response.status !== 200) {
      throw new Error(`vLLM API error: ${response.status}`);
    }

    const commentaryText = response.data.choices[0].message.content.trim();

    return commentaryText;

  } catch (error) {
    console.error('[ERROR] Failed to generate commentary from chat:', error.message);
    return null;
  }
}

/**
 * Post commentary to database
 */
async function postCommentary(matchId, commentary, videoId) {
  try {
    const eventId = `youtube_${videoId}_${Date.now()}`;

    const payload = {
      match_id: matchId,
      event_id: eventId,
      time: new Date().toLocaleTimeString('fr-FR', { minute: '2-digit' }) + "'",
      time_seconds: Math.floor(Date.now() / 1000),
      locale: 'fr',
      text: commentary,
      type: 'general',
      icon: '📺',
      is_scoring: false,
      confidence: 0.85
    };

    const response = await postJSON(
      `${SITE_URL}/api/can2025/live-commentary`,
      payload,
      { 'x-webhook-secret': WEBHOOK_SECRET }
    );

    if (response.status === 200 || response.status === 201) {
      console.log(`✅ Commentary posted for match ${matchId}`);
      return true;
    } else {
      console.error(`❌ Failed to post commentary: ${response.status}`);
      return false;
    }

  } catch (error) {
    console.error('[ERROR] Failed to post commentary:', error.message);
    return false;
  }
}

/**
 * Process a live stream
 */
async function processLiveStream(stream) {
  console.log(`\n📺 Processing: ${stream.title}`);
  console.log(`   Channel: ${stream.channel}`);
  console.log(`   Video ID: ${stream.videoId}`);

  // Extract match info
  const matchInfo = extractMatchInfo(stream);
  console.log(`   Match: ${matchInfo.homeTeam} vs ${matchInfo.awayTeam}`);

  // Get live chat
  const chatMessages = await getLiveChatMessages(stream.videoId);
  console.log(`   Chat messages: ${chatMessages.length}`);

  if (chatMessages.length === 0) {
    console.log('   ⚠️  No chat messages available');
    return;
  }

  // Generate commentary from chat
  const commentary = await generateCommentaryFromChat(stream, chatMessages);

  if (!commentary) {
    console.log('   ⚠️  Failed to generate commentary');
    return;
  }

  console.log(`   💬 Generated: "${commentary.substring(0, 60)}..."`);

  // Try to match with a match ID (you'll need to implement this based on your match data)
  // For now, using video ID as match reference
  const matchId = stream.videoId; // Replace with actual match ID mapping

  // Post to database
  await postCommentary(matchId, commentary, stream.videoId);

  // Track this stream
  activeStreams.set(stream.videoId, {
    ...stream,
    lastUpdate: Date.now()
  });
}

/**
 * Main monitoring loop
 */
async function monitorYouTubeLiveStreams() {
  console.log(`\n🔍 Searching YouTube for live CAN 2025 matches...`);

  const liveStreams = await searchYouTubeLiveStreams();

  if (liveStreams.length === 0) {
    console.log('   No live streams found');
    return;
  }

  console.log(`   Found ${liveStreams.length} live stream(s):`);
  liveStreams.forEach(stream => {
    console.log(`   - ${stream.title} (${stream.channel})`);
  });

  // Process each live stream
  for (const stream of liveStreams) {
    await processLiveStream(stream);
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2s delay between streams
  }
}

/**
 * Start the agent
 */
async function startAgent() {
  console.log('🤖 YOUTUBE COMMENTARY AGENT STARTED');
  console.log('=====================================');
  console.log(`📺 Data Source: YouTube Live Streams`);
  console.log(`📡 vLLM Endpoint: ${VLLM_BASE_URL}`);
  console.log(`🌐 Site URL: ${SITE_URL}`);
  console.log(`⏱️  Check Interval: ${CHECK_INTERVAL / 1000}s`);
  console.log('=====================================\n');

  if (!YOUTUBE_API_KEY) {
    console.error('❌ FATAL: YOUTUBE_API_KEY not set!');
    console.error('Get your API key from: https://console.cloud.google.com/apis/credentials');
    process.exit(1);
  }

  if (!WEBHOOK_SECRET) {
    console.error('❌ FATAL: AI_AGENT_WEBHOOK_SECRET not set!');
    process.exit(1);
  }

  // Initial search
  await monitorYouTubeLiveStreams();

  // Start monitoring loop
  setInterval(async () => {
    try {
      await monitorYouTubeLiveStreams();
    } catch (error) {
      console.error('[ERROR] Monitoring loop failed:', error);
    }
  }, CHECK_INTERVAL);

  console.log(`\n✅ Agent running - monitoring YouTube every ${CHECK_INTERVAL / 1000} seconds\n`);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Agent shutting down gracefully...');
  console.log(`📊 Total streams monitored: ${activeStreams.size}`);
  console.log('👋 Goodbye!\n');
  process.exit(0);
});

// Start the agent
startAgent().catch(error => {
  console.error('FATAL ERROR:', error);
  process.exit(1);
});
