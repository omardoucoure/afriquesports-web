#!/usr/bin/env node

/**
 * Automated Pre-Match Analysis Generator with Web Search
 *
 * Features:
 * - Searches web for team information, recent form, and head-to-head history
 * - Uses fine-tuned AFCON model to generate professional analysis
 * - Posts directly to database via API
 *
 * Usage: node generate-prematch-with-search.js <match_id> <home_team> <away_team>
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const https = require('https');
const http = require('http');

// Configuration
const MATCH_ID = process.argv[2];
const HOME_TEAM = process.argv[3];
const AWAY_TEAM = process.argv[4];

const VLLM_ENDPOINT = process.env.VLLM_ENDPOINT || 'https://qbjo7w9adplhia-8000.proxy.runpod.net/v1';
const VLLM_API_KEY = process.env.VLLM_API_KEY || 'sk-1234';
const VLLM_MODEL = process.env.VLLM_MODEL || 'oxmo88/Qwen2.5-VL-7B-AFCON2025';
const GOOGLE_SEARCH_API_KEY = process.env.GOOGLE_SEARCH_API_KEY;
const GOOGLE_SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.afriquesports.net';
const WEBHOOK_SECRET = process.env.AI_AGENT_WEBHOOK_SECRET;

if (!MATCH_ID || !HOME_TEAM || !AWAY_TEAM) {
  console.error('Usage: node generate-prematch-with-search.js <match_id> <home_team> <away_team>');
  console.error('Example: node generate-prematch-with-search.js 732149 "Tunisie" "Mali"');
  process.exit(1);
}

console.log('========================================');
console.log('Automated Pre-Match Analysis Generator');
console.log('========================================');
console.log(`Match ID: ${MATCH_ID}`);
console.log(`Home: ${HOME_TEAM}`);
console.log(`Away: ${AWAY_TEAM}`);
console.log('');

/**
 * Fetch JSON via HTTPS/HTTP
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
          reject(new Error(`Failed to parse JSON: ${e.message}`));
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
 * Search web using Google Custom Search API
 */
async function searchWeb(query) {
  if (!GOOGLE_SEARCH_API_KEY || !GOOGLE_SEARCH_ENGINE_ID) {
    console.log(`   ⚠️  No Google Search API configured, using mock data`);
    return {
      items: [
        {
          title: `${query} - Recent Information`,
          snippet: `Information about ${query} in recent matches and tournaments.`
        }
      ]
    };
  }

  const encodedQuery = encodeURIComponent(query);
  const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_SEARCH_API_KEY}&cx=${GOOGLE_SEARCH_ENGINE_ID}&q=${encodedQuery}&num=5`;

  try {
    const results = await fetchJSON(url);
    return results;
  } catch (error) {
    console.error(`   ❌ Search failed for "${query}":`, error.message);
    return { items: [] };
  }
}

/**
 * Generate analysis using fine-tuned AFCON model
 */
async function generateAnalysis(context) {
  const systemPrompt = `Tu es un expert en analyse tactique de football africain, spécialisé dans la CAN. Tu produis des analyses pré-match professionnelles en français pour Afrique Sports.

IMPORTANT - Règles de grammaire française:
- Utilise TOUJOURS les articles définis pour les noms de pays: "Le Benin", "Le Cameroun", "La Tunisie", "Le Mali", etc.
- Exemple CORRECT: "Le Benin a le ballon", "La France attaque"
- Exemple INCORRECT: "Benin a le ballon", "France attaque"
- Applique cette règle systématiquement dans toute ton analyse.`;

  const userPrompt = `Génère une analyse pré-match complète pour le match de CAN entre le ${HOME_TEAM} et le ${AWAY_TEAM}.

Informations disponibles:
${context}

RAPPEL IMPORTANT - Grammaire française:
Écris TOUJOURS "LE Benin" et "LE Botswana" (avec l'article défini).
- ✅ CORRECT: "Le Benin a connu", "Le Botswana devrait", "Le Benin et le Botswana se sont affrontés"
- ❌ INCORRECT: "Benin a connu", "Botswana devrait", "Benin et Botswana se sont affrontés"

Tu DOIS structurer ta réponse avec ces 5 sections EXACTEMENT (respecte le format markdown avec **):

**Face-à-face historique:**
Le ${HOME_TEAM} et le ${AWAY_TEAM} [historique de leurs confrontations]

**Forme récente:**
Le ${HOME_TEAM} [forme récente]. Le ${AWAY_TEAM} [forme récente].

**Joueurs clés:**
${HOME_TEAM}: [liste des joueurs clés]
${AWAY_TEAM}: [liste des joueurs clés]

**Aperçu tactique:**
Le ${HOME_TEAM} [tactique prévue]. Le ${AWAY_TEAM} [tactique prévue].

**Pronostic:**
Le ${HOME_TEAM} [prédiction avec score probable]

RÈGLES STRICTES:
1. Utilise TOUJOURS "Le" ou "le" devant ${HOME_TEAM} et ${AWAY_TEAM}
2. Chaque section DOIT commencer par "**Nom de section:**" (avec les deux astérisques)
3. Ne saute AUCUNE section
4. Écris en français professionnel`;

  const response = await postJSON(`${VLLM_ENDPOINT}/chat/completions`, {
    model: VLLM_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    max_tokens: 1500,
    temperature: 0.7
  }, {
    'Authorization': `Bearer ${VLLM_API_KEY}`
  });

  if (response.status !== 200) {
    throw new Error(`vLLM API error: ${response.status} - ${JSON.stringify(response.data)}`);
  }

  return response.data.choices[0].message.content;
}

/**
 * Parse analysis into structured sections
 */
function parseAnalysis(fullText) {
  const sections = {
    head_to_head: '',
    recent_form: '',
    key_players: '',
    tactical_preview: '',
    prediction: ''
  };

  const patterns = {
    head_to_head: /\*\*Face-à-face[^:]*:\*\*\s*([\s\S]*?)(?=\*\*|$)/i,
    recent_form: /\*\*Forme[^:]*:\*\*\s*([\s\S]*?)(?=\*\*|$)/i,
    key_players: /\*\*Joueurs[^:]*:\*\*\s*([\s\S]*?)(?=\*\*|$)/i,
    tactical_preview: /\*\*Aperçu[^:]*:\*\*\s*([\s\S]*?)(?=\*\*|$)/i,
    prediction: /\*\*Pronostic[^:]*:\*\*\s*([\s\S]*?)(?=\*\*|$)/i
  };

  for (const [key, pattern] of Object.entries(patterns)) {
    const match = fullText.match(pattern);
    if (match) {
      sections[key] = match[1].trim();
    }
  }

  // If tactical preview is empty, use full text
  if (!sections.tactical_preview) {
    sections.tactical_preview = fullText;
  }

  return sections;
}

/**
 * Main execution
 */
async function main() {
  try {
    // Step 1: Search for team information
    console.log('1. Searching web for team information...');

    const searches = [
      { name: `${HOME_TEAM} recent form`, label: `${HOME_TEAM} forme récente` },
      { name: `${AWAY_TEAM} recent form`, label: `${AWAY_TEAM} forme récente` },
      { name: `${HOME_TEAM} vs ${AWAY_TEAM} history`, label: 'Historique face-à-face' },
      { name: `${HOME_TEAM} CAN 2025 squad key players`, label: `${HOME_TEAM} joueurs clés` },
      { name: `${AWAY_TEAM} CAN 2025 squad key players`, label: `${AWAY_TEAM} joueurs clés` }
    ];

    const searchResults = [];
    for (const search of searches) {
      console.log(`   Searching: ${search.label}...`);
      const results = await searchWeb(search.name);
      if (results.items && results.items.length > 0) {
        searchResults.push({
          query: search.label,
          results: results.items.slice(0, 3).map(item => ({
            title: item.title,
            snippet: item.snippet
          }))
        });
      }
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`   ✅ Completed ${searchResults.length} searches`);
    console.log('');

    // Step 2: Build context from search results
    console.log('2. Building analysis context...');
    let context = '';

    for (const result of searchResults) {
      context += `\n${result.query}:\n`;
      for (const item of result.results) {
        context += `- ${item.title}\n  ${item.snippet}\n`;
      }
    }

    console.log(`   ✅ Context built (${context.length} characters)`);
    console.log('');

    // Step 3: Generate analysis with AI
    console.log('3. Generating analysis with fine-tuned AFCON model...');
    const fullAnalysis = await generateAnalysis(context);
    console.log(`   ✅ Analysis generated (${fullAnalysis.length} characters)`);
    console.log('');

    // Step 4: Parse into sections
    console.log('4. Parsing analysis sections...');
    const sections = parseAnalysis(fullAnalysis);
    console.log(`   ✅ Parsed sections:`);
    console.log(`      - Face-à-face: ${sections.head_to_head.length} chars`);
    console.log(`      - Forme récente: ${sections.recent_form.length} chars`);
    console.log(`      - Joueurs clés: ${sections.key_players.length} chars`);
    console.log(`      - Aperçu tactique: ${sections.tactical_preview.length} chars`);
    console.log(`      - Pronostic: ${sections.prediction.length} chars`);
    console.log('');

    // Step 5: Post to database
    console.log('5. Publishing to database...');

    if (!WEBHOOK_SECRET) {
      console.error('   ❌ AI_AGENT_WEBHOOK_SECRET not configured');
      console.log('');
      console.log('Generated Analysis:');
      console.log('===================');
      console.log(fullAnalysis);
      process.exit(1);
    }

    const apiResponse = await postJSON(`${SITE_URL}/api/can2025/prematch-analysis`, {
      match_id: MATCH_ID,
      locale: 'fr',
      home_team: HOME_TEAM,
      away_team: AWAY_TEAM,
      competition: 'CAN',
      ...sections,
      confidence_score: 0.85
    }, {
      'x-webhook-secret': WEBHOOK_SECRET
    });

    if (apiResponse.data.success) {
      console.log('   ✅ Published successfully!');
      console.log('');
      console.log('========================================');
      console.log('✅ COMPLETED');
      console.log('========================================');
      console.log('');
      console.log(`View at: ${SITE_URL}/can-2025/match/${MATCH_ID}`);
      console.log('');
    } else {
      console.error('   ❌ Failed to publish');
      console.error('   Response:', JSON.stringify(apiResponse.data, null, 2));
      process.exit(1);
    }

  } catch (error) {
    console.error('');
    console.error('❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run
main();
