/**
 * Journalist Narrative Generator
 *
 * Generates professional, long-form player descriptions in the style
 * of top sports journalists (L'Equipe, ESPN, FourFourTwo, Goal.com)
 *
 * Each player gets 300-500 words with:
 * - Career trajectory and context
 * - Playing style analysis
 * - Tactical role explanation
 * - Comparisons with legends
 * - Why they deserve this ranking position
 *
 * Supports multiple backends:
 * - RunPod 70B + RAG (best quality)
 * - Local Ollama (fallback)
 */

const RunPod70BClient = require('../runpod-70b-client');

// Backend configuration
const BACKENDS = {
  runpod: {
    name: 'RunPod 70B + RAG',
    model: 'meta-llama/Llama-3.1-70B-Instruct'
  },
  ollama: {
    name: 'Local Ollama',
    url: 'http://localhost:11434',
    model: 'qwen2.5:14b-instruct'
  }
};

// Current backend (can be changed)
let currentBackend = 'runpod';
let runpodClient = null;

/**
 * Prompt templates for generating journalist-style narratives
 * These prompts encourage rich, contextual storytelling
 */
const NARRATIVE_PROMPTS = {
  fr: {
    topPlayer: (player, rank, totalPlayers) => `
Tu es un journaliste sportif senior de L'Equipe avec 20 ans d'experience. Ecris un portrait de ${player.name} pour un classement des meilleurs milieux de terrain.

POSITION: ${rank}e sur ${totalPlayers}
JOUEUR: ${player.name}
CLUB ACTUEL: ${player.team}
NATIONALITE: ${player.nationality}
AGE: ${player.age} ans
VALEUR: ${player.marketValue}
STATS SAISON: ${player.stats?.goals || 0} buts, ${player.stats?.assists || 0} passes decisives en ${player.stats?.appearances || 0} matchs

CONSIGNES:
- Ecris 4-5 paragraphes (300-400 mots minimum)
- Premier paragraphe: accroche journalistique captivante, contexte de sa position de leader
- Deuxieme paragraphe: son parcours, comment il est arrive a ce niveau
- Troisieme paragraphe: analyse tactique de son jeu, ce qui le rend special
- Quatrieme paragraphe: comparaisons avec des legendes du poste (Zidane, Iniesta, etc.)
- Cinquieme paragraphe: pourquoi il merite cette place, projection pour l'avenir

STYLE:
- Utilise un ton journalistique professionnel mais accessible
- Inclus des anecdotes ou faits marquants si pertinent
- Evite les cliches et les superlatifs vides
- Sois precis et factuel tout en etant engageant
- Utilise des phrases variees (courtes et longues)

Ne mets PAS de titre, commence directement par le texte.`,

    podiumPlayer: (player, rank, totalPlayers) => `
Tu es un journaliste sportif senior de L'Equipe. Ecris un portrait de ${player.name} pour un classement des meilleurs milieux de terrain.

POSITION: ${rank}e sur ${totalPlayers} (PODIUM)
JOUEUR: ${player.name}
CLUB ACTUEL: ${player.team}
NATIONALITE: ${player.nationality}
AGE: ${player.age} ans
VALEUR: ${player.marketValue}
STATS SAISON: ${player.stats?.goals || 0} buts, ${player.stats?.assists || 0} passes decisives en ${player.stats?.appearances || 0} matchs

CONSIGNES:
- Ecris 3-4 paragraphes (250-350 mots)
- Premier paragraphe: ce qui le distingue, pourquoi il est sur le podium
- Deuxieme paragraphe: son style de jeu unique, ses qualites techniques
- Troisieme paragraphe: son importance pour son equipe, ses performances recentes
- Quatrieme paragraphe: ce qui lui manque pour etre numero 1

STYLE:
- Ton journalistique professionnel
- Analyse tactique concrete
- Comparaisons pertinentes avec ses pairs
- Sois objectif sur ses points forts ET ses axes d'amelioration

Ne mets PAS de titre, commence directement par le texte.`,

    topFivePlayer: (player, rank, totalPlayers) => `
Tu es un journaliste sportif de L'Equipe. Ecris un portrait de ${player.name} pour un classement des meilleurs milieux de terrain.

POSITION: ${rank}e sur ${totalPlayers}
JOUEUR: ${player.name}
CLUB ACTUEL: ${player.team}
NATIONALITE: ${player.nationality}
AGE: ${player.age} ans
VALEUR: ${player.marketValue}
STATS SAISON: ${player.stats?.goals || 0} buts, ${player.stats?.assists || 0} passes decisives en ${player.stats?.appearances || 0} matchs

CONSIGNES:
- Ecris 3 paragraphes (200-300 mots)
- Premier paragraphe: presentation et contexte de sa saison actuelle
- Deuxieme paragraphe: analyse de son profil et son role tactique
- Troisieme paragraphe: pourquoi il est dans le top 5, sa valeur pour son equipe

STYLE:
- Ton professionnel et informatif
- Focus sur ses performances concretes
- Contextualisez par rapport aux autres joueurs du classement

Ne mets PAS de titre, commence directement par le texte.`,

    regularPlayer: (player, rank, totalPlayers) => `
Tu es un journaliste sportif. Ecris un portrait de ${player.name} pour un classement des meilleurs milieux de terrain.

POSITION: ${rank}e sur ${totalPlayers}
JOUEUR: ${player.name}
CLUB ACTUEL: ${player.team}
NATIONALITE: ${player.nationality}
AGE: ${player.age} ans
VALEUR: ${player.marketValue}
STATS SAISON: ${player.stats?.goals || 0} buts, ${player.stats?.assists || 0} passes decisives en ${player.stats?.appearances || 0} matchs

CONSIGNES:
- Ecris 2-3 paragraphes (150-250 mots)
- Premier paragraphe: qui est ce joueur, son importance
- Deuxieme paragraphe: ce qui justifie sa place dans ce classement
- Troisieme paragraphe: ses perspectives et ce qu'il peut encore apporter

STYLE:
- Direct et informatif
- Valorisant sans exagerer
- Mettez en avant ce qui le rend unique

Ne mets PAS de titre, commence directement par le texte.`
  },

  en: {
    topPlayer: (player, rank, totalPlayers) => `
You are a senior sports journalist at ESPN with 20 years of experience. Write a profile of ${player.name} for a ranking of the best midfielders.

POSITION: ${rank}th out of ${totalPlayers}
PLAYER: ${player.name}
CURRENT CLUB: ${player.team}
NATIONALITY: ${player.nationality}
AGE: ${player.age} years
VALUE: ${player.marketValue}
SEASON STATS: ${player.stats?.goals || 0} goals, ${player.stats?.assists || 0} assists in ${player.stats?.appearances || 0} matches

INSTRUCTIONS:
- Write 4-5 paragraphs (300-400 words minimum)
- First paragraph: captivating journalistic hook, context of his leading position
- Second paragraph: his journey, how he reached this level
- Third paragraph: tactical analysis, what makes him special
- Fourth paragraph: comparisons with legends (Zidane, Iniesta, etc.)
- Fifth paragraph: why he deserves this place, future projection

STYLE:
- Professional but accessible journalistic tone
- Include anecdotes or notable facts
- Avoid cliches and empty superlatives
- Be precise and factual while engaging
- Use varied sentence lengths

Do NOT include a title, start directly with the text.`,

    podiumPlayer: (player, rank, totalPlayers) => `
You are a sports journalist at ESPN. Write a profile of ${player.name} for a ranking of the best midfielders.

POSITION: ${rank}th out of ${totalPlayers} (PODIUM)
PLAYER: ${player.name}
CURRENT CLUB: ${player.team}
NATIONALITY: ${player.nationality}
AGE: ${player.age} years
VALUE: ${player.marketValue}
SEASON STATS: ${player.stats?.goals || 0} goals, ${player.stats?.assists || 0} assists in ${player.stats?.appearances || 0} matches

Write 3-4 paragraphs (250-350 words) analyzing his podium position, playing style, and what separates him from the top spot.

Do NOT include a title.`,

    topFivePlayer: (player, rank, totalPlayers) => `
Write a 200-300 word profile of ${player.name}, ranked ${rank}th. Focus on his current season, tactical role, and why he's in the top 5.

STATS: ${player.stats?.goals || 0} goals, ${player.stats?.assists || 0} assists for ${player.team}`,

    regularPlayer: (player, rank, totalPlayers) => `
Write a 150-250 word profile of ${player.name}, ranked ${rank}th. Highlight what makes him worthy of this ranking.

STATS: ${player.stats?.goals || 0} goals, ${player.stats?.assists || 0} assists for ${player.team}`
  }
};

/**
 * Get the appropriate prompt based on player's ranking position
 */
function getPromptForPosition(player, rank, totalPlayers, language = 'fr') {
  const prompts = NARRATIVE_PROMPTS[language] || NARRATIVE_PROMPTS.fr;

  if (rank === 1) {
    return prompts.topPlayer(player, rank, totalPlayers);
  } else if (rank <= 3) {
    return prompts.podiumPlayer(player, rank, totalPlayers);
  } else if (rank <= 5) {
    return prompts.topFivePlayer(player, rank, totalPlayers);
  } else {
    return prompts.regularPlayer(player, rank, totalPlayers);
  }
}

/**
 * Initialize RunPod client
 */
function initRunPodClient(podId) {
  if (!runpodClient) {
    runpodClient = new RunPod70BClient({ podId });
  } else if (podId) {
    runpodClient.setPodId(podId);
  }
  return runpodClient;
}

/**
 * Check if Ollama is running
 */
async function isOllamaAvailable() {
  try {
    const response = await fetch(`${BACKENDS.ollama.url}/api/tags`);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Check if RunPod 70B is available
 */
async function isRunPodAvailable() {
  if (!runpodClient) return false;
  const status = await runpodClient.isAvailable();
  return status.available;
}

/**
 * Generate text using local Ollama
 */
async function generateWithOllama(prompt) {
  const response = await fetch(`${BACKENDS.ollama.url}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: BACKENDS.ollama.model,
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.7,
        top_p: 0.9,
        num_predict: 1500
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status}`);
  }

  const data = await response.json();
  return data.response;
}

/**
 * Generate text using RunPod 70B + RAG
 */
async function generateWithRunPod(prompt, player) {
  if (!runpodClient) {
    throw new Error('RunPod client not initialized');
  }

  // Create RAG query based on player
  const ragQuery = `${player.name} ${player.team} ${player.nationality} football`;

  const response = await runpodClient.generateWithRAG(prompt, {
    ragQuery,
    ragLimit: 3,
    ragMaxChars: 3000,
    temperature: 0.7,
    maxTokens: 2000,
    systemPrompt: "Tu es un journaliste sportif senior de L'Equipe avec 20 ans d'experience. Tu ecris des portraits de joueurs dans un style professionnel, informatif et engageant."
  });

  return response;
}

/**
 * Generate narrative for a single player
 * Tries RunPod 70B first, falls back to Ollama, then to templates
 */
async function generatePlayerNarrative(player, rank, totalPlayers, options = {}) {
  const {
    language = 'fr',
    useAI = true,
    backend = currentBackend, // 'runpod' or 'ollama'
    podId = null
  } = options;

  // Initialize RunPod if pod ID provided
  if (podId) {
    initRunPodClient(podId);
  }

  const prompt = getPromptForPosition(player, rank, totalPlayers, language);

  if (useAI) {
    // Try RunPod 70B + RAG first
    if (backend === 'runpod' && runpodClient) {
      try {
        const response = await generateWithRunPod(prompt, player);
        return formatNarrativeResponse(response);
      } catch (error) {
        console.warn(`   RunPod failed for ${player.name}: ${error.message}`);
        // Fall through to Ollama
      }
    }

    // Try Ollama
    try {
      const response = await generateWithOllama(prompt);
      return formatNarrativeResponse(response);
    } catch (error) {
      console.error(`   Ollama failed for ${player.name}: ${error.message}`);
    }
  }

  return generateFallbackNarrative(player, rank, totalPlayers, language);
}

/**
 * Format narrative response with paragraph tags
 */
function formatNarrativeResponse(response) {
  let narrative = response.trim();
  if (!narrative.startsWith('<p>')) {
    narrative = narrative
      .split('\n\n')
      .filter(p => p.trim())
      .map(p => `<p>${p.trim()}</p>`)
      .join('\n');
  }
  return narrative;
}

/**
 * Generate fallback narrative when AI is not available
 * Uses template-based generation with rich context
 */
function generateFallbackNarrative(player, rank, totalPlayers, language = 'fr') {
  const name = player.name;
  const team = player.team || 'son club';
  const nationality = player.nationality || '';
  const age = player.age || '';
  const marketValue = player.marketValue || '';
  const goals = player.stats?.goals || 0;
  const assists = player.stats?.assists || 0;
  const appearances = player.stats?.appearances || 0;
  const score = player.score || 0;

  if (language === 'fr') {
    return generateFrenchNarrative(player, rank, totalPlayers);
  }

  return generateEnglishNarrative(player, rank, totalPlayers);
}

/**
 * Generate rich French narrative
 */
function generateFrenchNarrative(player, rank, totalPlayers) {
  const { name, team, nationality, age, marketValue, stats = {}, score } = player;
  const goals = stats.goals || 0;
  const assists = stats.assists || 0;
  const appearances = stats.appearances || 0;
  const contributions = goals + assists;

  const paragraphs = [];

  // Paragraph 1: Opening hook
  if (rank === 1) {
    paragraphs.push(`
      <p>Au sommet de la pyramide des milieux de terrain mondiaux, ${name} s'impose comme le maitre inconteste de l'entrejeu. Ce n'est pas un hasard si le ${nationality} de ${age} ans trone a la premiere place de notre classement : chaque passe, chaque mouvement, chaque decision sur le terrain temoigne d'une intelligence footballistique hors du commun.</p>
    `);
  } else if (rank <= 3) {
    paragraphs.push(`
      <p>${name} n'a peut-etre pas la premiere place, mais son influence sur le jeu de ${team} est incontestable. Le ${nationality} de ${age} ans fait partie de ces rares joueurs capables de transformer une rencontre par leur seule presence sur le terrain.</p>
    `);
  } else if (rank <= 5) {
    paragraphs.push(`
      <p>Dans l'elite du milieu de terrain mondial, ${name} a su se tailler une place de choix. A ${age} ans, le ${nationality} de ${team} continue d'impressionner par sa regularite et son impact sur le jeu de son equipe.</p>
    `);
  } else {
    paragraphs.push(`
      <p>${name} represente l'excellence du football moderne a son poste. A ${age} ans, le milieu de terrain ${nationality} de ${team} demontre saison apres saison qu'il fait partie des meilleurs a son poste.</p>
    `);
  }

  // Paragraph 2: Stats and current form
  if (contributions > 0) {
    const ratio = appearances > 0 ? (contributions / appearances).toFixed(2) : 0;
    paragraphs.push(`
      <p>Les chiffres parlent d'eux-memes : ${goals} buts et ${assists} passes decisives en ${appearances} matchs cette saison. Soit une contribution directe tous les ${appearances > 0 && contributions > 0 ? (appearances / contributions).toFixed(1) : 'N/A'} matchs. Des statistiques qui placent ${name} parmi les milieux les plus productifs d'Europe, confirmant son statut de joueur de classe mondiale.</p>
    `);
  } else {
    paragraphs.push(`
      <p>Au-dela des statistiques pures, c'est l'influence de ${name} sur le jeu collectif qui frappe les observateurs. En ${appearances} matchs cette saison, le ${nationality} a demontre une capacite unique a dicter le tempo et a orienter les phases offensives de ${team}.</p>
    `);
  }

  // Paragraph 3: Playing style and tactical analysis
  const positionType = player.positionDetail || 'milieu';
  if (positionType.toLowerCase().includes('attack')) {
    paragraphs.push(`
      <p>Son profil de milieu offensif lui permet de se projeter entre les lignes avec une facilite deconcertante. ${name} possede cette qualite rare de pouvoir a la fois creer et conclure, faisant de lui un cauchemar pour les defenseurs adverses. Sa vision du jeu et sa technique balle au pied rappellent les plus grands numero 10 de l'histoire.</p>
    `);
  } else if (positionType.toLowerCase().includes('defensive')) {
    paragraphs.push(`
      <p>Sentinelle devant la defense, ${name} incarne le milieu defensif moderne : capable de recuperer, de relancer, et de dicter le tempo. Son sens du placement et son timing dans les duels en font un element incontournable du dispositif de ${team}. Un joueur sur lequel tout l'edifice collectif repose.</p>
    `);
  } else {
    paragraphs.push(`
      <p>Veritable poumon de l'equipe, ${name} excelle dans les transitions et la couverture du terrain. Sa capacite a lier les secteurs de jeu, a recuperer puis a accelerer le jeu vers l'avant, en fait un element precieux du dispositif de ${team}. Un profil complet qui se fait de plus en plus rare.</p>
    `);
  }

  // Paragraph 4: Why this ranking
  if (rank === 1) {
    paragraphs.push(`
      <p>Avec un score global de ${score.toFixed(2)} points, ${name} devance la concurrence grace a une combinaison unique de productivite, de valeur marchande (${marketValue}) et d'impact tactique. Sa premiere place n'est pas seulement meritee : elle est inevitable.</p>
    `);
  } else if (rank <= 3) {
    paragraphs.push(`
      <p>Sa ${rank}e place au classement (${score.toFixed(2)} points) reflette son statut parmi l'elite mondiale. Avec une valeur estimee a ${marketValue}, ${name} represente l'un des milieux les plus convoites du marche. Il ne lui manque qu'un soupcon de constance pour pretendre a la premiere marche.</p>
    `);
  } else {
    paragraphs.push(`
      <p>Classe ${rank}e avec ${score.toFixed(2)} points, ${name} confirme sa place dans le gotha du football mondial. Sa valeur de ${marketValue} temoigne de la consideration que lui portent les plus grands clubs europeens. Une reference a son poste.</p>
    `);
  }

  return paragraphs.join('\n');
}

/**
 * Generate rich English narrative
 */
function generateEnglishNarrative(player, rank, totalPlayers) {
  const { name, team, nationality, age, marketValue, stats = {}, score } = player;
  const goals = stats.goals || 0;
  const assists = stats.assists || 0;
  const appearances = stats.appearances || 0;
  const contributions = goals + assists;

  const paragraphs = [];

  // Paragraph 1: Opening hook
  if (rank === 1) {
    paragraphs.push(`
      <p>At the summit of world football's midfield hierarchy, ${name} stands as the undisputed master of the engine room. It's no coincidence that the ${age}-year-old ${nationality} sits atop our rankings: every pass, every movement, every decision on the pitch reflects an exceptional footballing intelligence.</p>
    `);
  } else if (rank <= 3) {
    paragraphs.push(`
      <p>${name} may not hold the top spot, but his influence on ${team}'s game is undeniable. The ${age}-year-old ${nationality} belongs to that rare breed of players capable of transforming a match through sheer presence alone.</p>
    `);
  } else {
    paragraphs.push(`
      <p>${name} represents the excellence of modern football in his position. At ${age}, the ${nationality} midfielder for ${team} continues to demonstrate season after season that he belongs among the very best.</p>
    `);
  }

  // Paragraph 2: Stats
  if (contributions > 0) {
    paragraphs.push(`
      <p>The numbers speak for themselves: ${goals} goals and ${assists} assists in ${appearances} appearances this season. A direct contribution every ${appearances > 0 && contributions > 0 ? (appearances / contributions).toFixed(1) : 'N/A'} games. Statistics that place ${name} among Europe's most productive midfielders.</p>
    `);
  }

  // Paragraph 3: Ranking justification
  paragraphs.push(`
    <p>Ranked ${rank}${rank === 1 ? 'st' : rank === 2 ? 'nd' : rank === 3 ? 'rd' : 'th'} with a score of ${score.toFixed(2)} points, ${name} solidifies his place among football's elite. His market value of ${marketValue} reflects the esteem in which Europe's biggest clubs hold him.</p>
  `);

  return paragraphs.join('\n');
}

/**
 * Generate narratives for all players in a ranking
 * @param {Array} ranking - Array of player objects
 * @param {Object} options - Generation options
 * @returns {Promise<Map>} Map of player name to narrative
 */
async function generateAllNarratives(ranking, options = {}) {
  const {
    language = 'fr',
    useAI = true,
    backend = 'runpod', // 'runpod' or 'ollama'
    podId = null
  } = options;

  const narratives = new Map();
  const totalPlayers = ranking.length;

  // Initialize RunPod if needed
  if (podId) {
    initRunPodClient(podId);
  }

  // Check backend availability
  let backendAvailable = false;
  let activeBackend = backend;

  if (useAI) {
    if (backend === 'runpod' && runpodClient) {
      const runpodStatus = await runpodClient.isAvailable();
      if (runpodStatus.available) {
        backendAvailable = true;
        console.log(`\n📝 Generating journalist narratives using RunPod 70B + RAG (${totalPlayers} players)...`);
        console.log(`   Model: ${BACKENDS.runpod.model}`);
        console.log(`   RAG: ${runpodStatus.rag ? 'Connected' : 'Unavailable'}`);
      } else {
        console.log(`\n⚠️  RunPod unavailable, trying Ollama...`);
        activeBackend = 'ollama';
      }
    }

    if (activeBackend === 'ollama') {
      const ollamaAvailable = await isOllamaAvailable();
      if (ollamaAvailable) {
        backendAvailable = true;
        console.log(`\n📝 Generating journalist narratives using Ollama (${totalPlayers} players)...`);
        console.log(`   Model: ${BACKENDS.ollama.model}`);
      } else {
        console.log(`\n⚠️  No AI backend available - using fallback narratives...`);
      }
    }
  } else {
    console.log(`\n📝 Generating fallback narratives for ${totalPlayers} players...`);
  }

  // Process sequentially (avoid overload)
  for (let i = 0; i < ranking.length; i++) {
    const player = ranking[i];
    const rank = player.position || (i + 1);

    const narrative = await generatePlayerNarrative(player, rank, totalPlayers, {
      language,
      useAI: useAI && backendAvailable,
      backend: activeBackend,
      podId
    });

    narratives.set(player.name, narrative);
    process.stdout.write(`\r   Progress: ${i + 1}/${ranking.length}`);
  }

  console.log('\n   Done generating narratives.\n');

  return narratives;
}

module.exports = {
  generatePlayerNarrative,
  generateAllNarratives,
  generateFallbackNarrative,
  getPromptForPosition,
  isOllamaAvailable,
  isRunPodAvailable,
  initRunPodClient,
  NARRATIVE_PROMPTS,
  BACKENDS
};
