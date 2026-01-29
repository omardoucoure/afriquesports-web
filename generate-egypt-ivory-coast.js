#!/usr/bin/env node
/**
 * Generate pre-match analysis for Egypt vs Ivory Coast - CAN 2025 Quarter Final
 */

require('dotenv').config({ path: '.env.local' });
const OpenAI = require('openai').default;
const https = require('https');

const MATCH_ID = '732179';
const HOME_TEAM = 'Egypte';
const AWAY_TEAM = "Côte d'Ivoire";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const WEBHOOK_SECRET = process.env.AI_AGENT_WEBHOOK_SECRET;

async function generateAnalysis() {
  console.log('🔄 Generating pre-match analysis with GPT-4o-mini...');

  const systemPrompt = `Tu es un expert en analyse tactique de football africain, spécialisé dans la CAN 2025. Tu produis des analyses pré-match professionnelles en français pour Afrique Sports.

IMPORTANT - Ce match est un QUART DE FINALE DE LA CAN 2025:
- L'Egypte de Mohamed Salah affronte la Côte d'Ivoire, tenante du titre
- Match crucial pour les deux équipes
- Stade: Grand Stade d'Agadir, Maroc
- Date: 10 janvier 2025 à 20h00

RÈGLES:
- Utilise les articles définis pour les noms de pays (L'Egypte, La Côte d'Ivoire)
- Analyse tactique et passionnée comme un vrai commentateur africain
- Sois précis sur les joueurs et leurs clubs actuels`;

  const userPrompt = `Génère une analyse pré-match COMPLÈTE pour le QUART DE FINALE CAN 2025 entre l'${HOME_TEAM} et la ${AWAY_TEAM}.

C'est un match de très haut niveau entre:
- L'EGYPTE: 7 fois champion d'Afrique, emmenée par Mohamed Salah (Liverpool), Omar Marmoush (Eintracht Frankfurt), Mohamed Abdelmonem
- LA CÔTE D'IVOIRE: Tenante du titre (CAN 2024 à domicile), avec Amad Diallo (Man United), Seko Fofana, Simon Adingra (Brighton), Oumar Diakité

STRUCTURE EXACTE (5 sections avec les titres en gras):

**Face-à-face historique:**
[Historique des confrontations légendaires, incluant les finales CAN 2006 (Egypte gagne aux tirs au but) et 2008 (Egypte gagne 1-0), c'est une vraie rivalité africaine!]

**Forme récente:**
[Parcours des deux équipes dans cette CAN 2025 - phase de groupes et 8èmes de finale, qui a impressionné?]

**Joueurs clés:**
[Les stars à surveiller: Salah, Marmoush, Trezeguet pour l'Egypte; Diallo, Fofana, Adingra, Kessié pour la Côte d'Ivoire]

**Aperçu tactique:**
[Analyse des systèmes de jeu - L'Egypte joue en 4-3-1-2 avec Salah en meneur, la Côte d'Ivoire en 4-3-3 offensif]

**Pronostic:**
[Prédiction avec score probable pour ce quart de finale - qui sera en demi-finale?]

Sois PASSIONNÉ et PROFESSIONNEL comme un vrai commentateur de football africain! Minimum 150 mots par section.`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    max_tokens: 2500,
    temperature: 0.8
  });

  return response.choices[0].message.content;
}

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
    if (match) sections[key] = match[1].trim();
  }

  if (!sections.tactical_preview) sections.tactical_preview = fullText;
  return sections;
}

async function postToAPI(sections) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      match_id: MATCH_ID,
      locale: 'fr',
      home_team: HOME_TEAM,
      away_team: AWAY_TEAM,
      competition: 'CAN 2025',
      ...sections,
      confidence_score: 0.90
    });

    const req = https.request({
      hostname: 'www.afriquesports.net',
      path: '/api/can2025/prematch-analysis',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': WEBHOOK_SECRET
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ error: data });
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('========================================');
  console.log('🏆 CAN 2025 - QUART DE FINALE');
  console.log('⚽ Egypte vs Côte d\'Ivoire');
  console.log('🏟️  Grand Stade d\'Agadir, Maroc');
  console.log('========================================');
  console.log('');

  try {
    const analysis = await generateAnalysis();
    console.log('✅ Analysis generated!');
    console.log('');
    console.log('─'.repeat(50));
    console.log(analysis);
    console.log('─'.repeat(50));
    console.log('');

    const sections = parseAnalysis(analysis);
    console.log('📊 Parsed sections:');
    console.log(`  - Face-à-face: ${sections.head_to_head.length} chars`);
    console.log(`  - Forme récente: ${sections.recent_form.length} chars`);
    console.log(`  - Joueurs clés: ${sections.key_players.length} chars`);
    console.log(`  - Aperçu tactique: ${sections.tactical_preview.length} chars`);
    console.log(`  - Pronostic: ${sections.prediction.length} chars`);
    console.log('');

    console.log('📤 Publishing to database...');
    const result = await postToAPI(sections);

    if (result.success) {
      console.log('✅ Pre-match analysis published successfully!');
      console.log('');
      console.log('🔗 View at: https://www.afriquesports.net/can-2025/match/egypt-vs-ivory-coast-732179');
    } else {
      console.log('❌ Failed:', JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main();
