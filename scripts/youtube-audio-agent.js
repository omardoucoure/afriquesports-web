#!/usr/bin/env node
/**
 * YouTube Audio Commentary Agent
 * Extracts audio from YouTube live stream, transcribes, and posts as commentary
 *
 * Requirements:
 * - yt-dlp (brew install yt-dlp)
 * - ffmpeg (brew install ffmpeg)
 * - OPENAI_API_KEY environment variable
 *
 * Usage:
 * OPENAI_API_KEY=sk-xxx node youtube-audio-agent.js --url "https://youtube.com/watch?v=xxx" --match 732178
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const MATCH_ID = process.argv.includes('--match')
  ? process.argv[process.argv.indexOf('--match') + 1]
  : '732178';

const YOUTUBE_URL = process.argv.includes('--url')
  ? process.argv[process.argv.indexOf('--url') + 1]
  : 'https://www.youtube.com/watch?v=oq7lse8KIsI';

const API_URL = 'https://www.afriquesports.net/api/can2025/live-commentary';
const WEBHOOK_SECRET = 'test-secret';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const CHUNK_DURATION = 30; // seconds
const TEMP_DIR = '/tmp/audio-agent';

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Track posted events to avoid duplicates
const postedTexts = new Set();
let eventCounter = 500;

/**
 * Extract audio chunk from YouTube stream
 */
async function extractAudioChunk(startTime = 0) {
  const outputFile = path.join(TEMP_DIR, `chunk_${Date.now()}.mp3`);

  return new Promise((resolve, reject) => {
    console.log(`🎵 Extracting ${CHUNK_DURATION}s audio chunk...`);

    // Use yt-dlp to download audio directly (works better with live streams)
    const ytdlp = spawn('yt-dlp', [
      '-f', '91', // Use lowest quality audio for speed (mp4a.40.5)
      '--downloader', 'ffmpeg',
      '--downloader-args', `ffmpeg:-t ${CHUNK_DURATION}`,
      '-x', // Extract audio
      '--audio-format', 'mp3',
      '--audio-quality', '64K',
      '-o', outputFile.replace('.mp3', '.%(ext)s'),
      '--no-playlist',
      '--no-part',
      YOUTUBE_URL
    ]);

    let stderr = '';
    ytdlp.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ytdlp.on('close', (code) => {
      // Check for output file (might have different extension)
      const possibleFiles = [
        outputFile,
        outputFile.replace('.mp3', '.m4a'),
        outputFile.replace('.mp3', '.webm')
      ];

      const foundFile = possibleFiles.find(f => fs.existsSync(f));

      if (foundFile) {
        // Convert to mp3 if needed
        if (!foundFile.endsWith('.mp3')) {
          const mp3File = outputFile;
          const ffmpeg = spawn('ffmpeg', [
            '-y', '-i', foundFile,
            '-ar', '16000', '-ac', '1', '-b:a', '64k',
            mp3File
          ]);
          ffmpeg.on('close', () => {
            fs.unlinkSync(foundFile);
            resolve(mp3File);
          });
        } else {
          resolve(foundFile);
        }
      } else {
        reject(new Error(`Failed to extract audio: ${stderr.substring(0, 200)}`));
      }
    });
  });
}

/**
 * Transcribe audio using OpenAI Whisper API
 */
async function transcribeAudio(audioFile) {
  console.log(`📝 Transcribing audio...`);

  const FormData = require('form-data');
  const form = new FormData();
  form.append('file', fs.createReadStream(audioFile));
  form.append('model', 'whisper-1');
  form.append('language', 'fr');
  form.append('response_format', 'json');

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.openai.com',
      path: '/v1/audio/transcriptions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        ...form.getHeaders()
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result.text || '');
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });

    req.on('error', reject);
    form.pipe(req);
  });
}

/**
 * Extract match events from transcription using GPT
 */
async function extractEvents(transcription, matchContext) {
  console.log(`🤖 Extracting events from transcription...`);

  const prompt = `Tu es un COMMENTATEUR SPORTIF PASSIONNÉ pour Afrique Sports ! Tu retranscris les commentaires audio avec ÉNERGIE et SENSATIONNALISME !

🔥 Match: ${matchContext.homeTeam} vs ${matchContext.awayTeam}
⚽ Score actuel: ${matchContext.score}

Transcription audio (${CHUNK_DURATION}s):
"${transcription}"

🎯 TA MISSION: Transformer cette transcription en commentaires SENSATIONNELS !

⚠️ RÈGLE CRITIQUE POUR LES BUTS:
- UTILISE "type": "goal" UNIQUEMENT si le commentateur dit EXPLICITEMENT "but", "goal", "il marque", "c'est le but", "1-0", "2-0", etc.
- Si c'est juste une action excitante, un tir, une occasion ratée → utilise "highlight" ou "shot", PAS "goal"
- NE PAS INVENTER de buts ! Sois FIDÈLE à ce que dit la transcription.
- En cas de doute, utilise "commentary" ou "highlight"

STYLE À ADOPTER:
- Écris comme un commentateur PASSIONNÉ qui vit le match
- Utilise des EXCLAMATIONS variées et de l'ÉMOTION !
- Ajoute du SUSPENSE et du DRAMA
- Minimum 150 caractères par commentaire
- BEAUCOUP d'emojis 🔥⚽🎯💪🇨🇲🇲🇦

EXEMPLES D'EXCLAMATIONS (VARIE TON VOCABULAIRE !):
- QUELLE ACTION ! / INCROYABLE ! / MAGNIFIQUE ! / EXTRAORDINAIRE !
- C'EST ÉNORME ! / QUEL TALENT ! / FANTASTIQUE ! / SENSATIONNEL !
- ATTENTION ! / DANGER ! / ÇA CHAUFFE ! / QUELLE INTENSITÉ !
- ALLEZ ! / C'EST PARTI ! / ON Y VA ! / ÇA BOUGE !

N'utilise PAS "OH MON DIEU" - c'est trop répétitif. Varie tes expressions !

Réponds UNIQUEMENT en JSON valide:
{
  "events": [
    {
      "type": "shot|foul|yellowCard|redCard|corner|substitution|save|offside|commentary|analysis|highlight|goal",
      "time": "${matchContext.clock || ''}",
      "text": "Commentaire SENSATIONNEL et PASSIONNÉ avec BEAUCOUP d'emojis ! Minimum 150 caractères !",
      "player": "Nom du joueur mentionné ou null",
      "team": "Équipe mentionnée ou null",
      "importance": 5
    }
  ]
}

RAPPEL: "goal" = SEULEMENT si un but est CONFIRMÉ dans la transcription !`;

  const body = JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.5,
    max_tokens: 1000
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.openai.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          const content = result.choices?.[0]?.message?.content || '{"events":[]}';
          // Extract JSON from potential markdown code blocks
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          const events = JSON.parse(jsonMatch ? jsonMatch[0] : content);
          resolve(events);
        } catch (e) {
          console.error('Failed to parse GPT response:', e.message);
          resolve({ events: [] });
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

/**
 * Post commentary to API
 */
async function postCommentary(event) {
  // Check for duplicates
  const textKey = `${event.time}_${event.type}_${event.text?.substring(0, 30)}`;
  if (postedTexts.has(textKey)) {
    console.log(`⏭️  Skipping duplicate: ${event.text?.substring(0, 50)}...`);
    return;
  }

  eventCounter++;
  const payload = {
    match_id: MATCH_ID,
    event_id: `audio_${eventCounter}`,
    competition: 'CAN 2025',
    time: event.time || '',
    time_seconds: eventCounter,
    locale: 'fr',
    text: event.text,
    type: event.type,
    team: event.team,
    player_name: event.player,
    icon: getIcon(event.type),
    is_scoring: event.type === 'goal',
    confidence: 0.9,
    source: 'youtube_audio'
  };

  return new Promise((resolve) => {
    const body = JSON.stringify(payload);
    const options = {
      hostname: 'www.afriquesports.net',
      path: '/api/can2025/live-commentary',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': WEBHOOK_SECRET,
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      res.on('data', () => {});
      res.on('end', () => {
        console.log(`✅ [${event.time}] ${event.text?.substring(0, 60)}...`);
        postedTexts.add(textKey);
        resolve();
      });
    });

    req.on('error', (e) => {
      console.error(`❌ Error posting: ${e.message}`);
      resolve();
    });

    req.write(body);
    req.end();
  });
}

function getIcon(type) {
  const icons = {
    goal: '⚽',
    shot: '🎯',
    foul: '🚫',
    yellowCard: '🟨',
    redCard: '🟥',
    corner: '🚩',
    substitution: '🔄',
    save: '🧤',
    offside: '🚫',
    info: '📢',
    commentary: '🎙️',
    analysis: '📊',
    highlight: '✨'
  };
  return icons[type] || '▶️';
}

/**
 * Get current match context from ESPN
 */
async function getMatchContext() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'site.api.espn.com',
      path: `/apis/site/v2/sports/soccer/caf.nations/summary?event=${MATCH_ID}`,
      method: 'GET'
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const match = JSON.parse(data);
          const comp = match.header?.competitions?.[0];
          resolve({
            homeTeam: comp?.competitors?.[0]?.team?.displayName || 'Home',
            awayTeam: comp?.competitors?.[1]?.team?.displayName || 'Away',
            score: `${comp?.competitors?.[0]?.score || 0} - ${comp?.competitors?.[1]?.score || 0}`,
            clock: match.header?.status?.displayClock || ''
          });
        } catch {
          resolve({ homeTeam: 'Cameroon', awayTeam: 'Morocco', score: '0-0', clock: '' });
        }
      });
    });

    req.on('error', () => {
      resolve({ homeTeam: 'Cameroon', awayTeam: 'Morocco', score: '0-0', clock: '' });
    });

    req.end();
  });
}

/**
 * Main processing loop
 */
async function processAudioLoop() {
  console.log(`\n🎙️  YouTube Audio Commentary Agent`);
  console.log(`📺 Stream: ${YOUTUBE_URL}`);
  console.log(`⚽ Match ID: ${MATCH_ID}`);
  console.log(`🔄 Processing ${CHUNK_DURATION}s chunks...\n`);

  if (!OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY environment variable is required');
    process.exit(1);
  }

  while (true) {
    try {
      // Get match context
      const matchContext = await getMatchContext();
      console.log(`\n⏱️  ${matchContext.clock} | ${matchContext.homeTeam} ${matchContext.score} ${matchContext.awayTeam}`);

      // Extract audio chunk
      const audioFile = await extractAudioChunk();

      // Transcribe
      const transcription = await transcribeAudio(audioFile);
      console.log(`📝 Transcription: "${transcription.substring(0, 100)}..."`);

      // Extract events
      const { events } = await extractEvents(transcription, matchContext);

      // Post events (lower threshold to capture more commentary)
      let postedCount = 0;
      for (const event of events) {
        if (event.importance >= 2) {
          await postCommentary(event);
          postedCount++;
          await new Promise(r => setTimeout(r, 300));
        }
      }

      if (postedCount === 0) {
        console.log('📋 No significant events detected');
      } else {
        console.log(`📝 Posted ${postedCount} events`);
      }

      // Cleanup
      if (fs.existsSync(audioFile)) {
        fs.unlinkSync(audioFile);
      }

      // Wait before next chunk (overlap slightly for continuity)
      await new Promise(r => setTimeout(r, (CHUNK_DURATION - 5) * 1000));

    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      await new Promise(r => setTimeout(r, 10000)); // Wait 10s on error
    }
  }
}

// Check for form-data package
try {
  require('form-data');
} catch {
  console.log('Installing form-data package...');
  execSync('npm install form-data', { cwd: __dirname });
}

// Start the agent
processAudioLoop();
