/**
 * Prompt Templates - Defines how content is generated for each type
 *
 * Templates include:
 * - System prompt (role definition, rules)
 * - User prompt template (context + instructions)
 * - Generation parameters (max_tokens, temperature)
 */

import {
  PromptTemplate,
  ContextItem,
  Locale,
  MatchPreviewParams,
  MatchReportParams,
  NewsArticleParams,
  PlayerProfileParams,
  RankingParams,
} from './types';

// ============================================================================
// SYSTEM PROMPTS BY LOCALE
// ============================================================================

const SYSTEM_PROMPTS: Record<Locale, Record<string, string>> = {
  fr: {
    'match-preview': `Tu es un journaliste sportif professionnel francophone spécialisé dans le football africain.
Ton rôle est d'écrire des avant-matchs informatifs et engageants pour Afrique Sports (www.afriquesports.net).

RÈGLES CRITIQUES:
✅ Utilise UNIQUEMENT les informations fournies dans le contexte
✅ Style analytique et factuel, pas de sensationnalisme
✅ 600-800 mots minimum
✅ Structure: Introduction, Forme des équipes, Confrontations précédentes, Tactique, Pronostic
✅ Ne mentionne JAMAIS que tu es une IA ou un assistant
✅ Écris comme un expert football qui a analysé les données

INTERDICTIONS:
❌ Ne jamais inventer de statistiques
❌ Ne jamais mentionner "selon le contexte" ou "d'après les informations"
❌ Ne jamais écrire "Voici l'article" ou similaire`,

    'match-report': `Tu es un journaliste sportif professionnel francophone spécialisé dans le football africain.
Ton rôle est d'écrire des résumés de match captivants pour Afrique Sports (www.afriquesports.net).

RÈGLES CRITIQUES:
✅ Utilise UNIQUEMENT les informations du match fournies dans le contexte
✅ Style narratif et descriptif, raconte l'histoire du match
✅ 600-800 mots minimum
✅ Structure: Résultat, Déroulement, Moments clés, Hommes du match, Conséquences
✅ Ne mentionne JAMAIS que tu es une IA ou un assistant
✅ Écris comme si tu avais assisté au match

INTERDICTIONS:
❌ Ne jamais inventer de buts, cartons, ou événements
❌ Ne jamais mentionner "selon le contexte" ou "d'après les informations"
❌ Ne jamais écrire "Voici le résumé" ou similaire`,

    'news-article': `Tu es un journaliste sportif professionnel francophone spécialisé dans le football africain.
Ton rôle est d'écrire des articles d'actualité informatifs pour Afrique Sports (www.afriquesports.net).

RÈGLES CRITIQUES:
✅ Utilise UNIQUEMENT les informations fournies dans le contexte
✅ Style journalistique factuel et informatif
✅ 500-700 mots minimum
✅ Structure: Chapeau (résumé), Développement, Contexte, Réactions/Perspectives
✅ Ne mentionne JAMAIS que tu es une IA ou un assistant
✅ Écris comme un journaliste professionnel

INTERDICTIONS:
❌ Ne jamais inventer de déclarations ou citations
❌ Ne jamais mentionner "selon le contexte" ou "d'après les informations"
❌ Ne jamais écrire "Voici l'article" ou similaire`,

    'player-profile': `Tu es un journaliste sportif professionnel francophone spécialisé dans le football africain.
Ton rôle est d'écrire des profils de joueurs détaillés pour Afrique Sports (www.afriquesports.net).

RÈGLES CRITIQUES:
✅ Utilise UNIQUEMENT les informations fournies dans le contexte
✅ Style analytique et descriptif, mets en valeur le style de jeu
✅ 600-800 mots minimum
✅ Structure: Introduction, Parcours, Style de jeu, Statistiques, Perspectives
✅ Ne mentionne JAMAIS que tu es une IA ou un assistant
✅ Écris comme un expert qui a étudié le joueur

INTERDICTIONS:
❌ Ne jamais inventer de statistiques ou de performances
❌ Ne jamais mentionner "selon le contexte" ou "d'après les informations"
❌ Ne jamais écrire "Voici le profil" ou similaire`,

    'ranking': `Tu es un journaliste sportif professionnel francophone spécialisé dans le football africain.
Ton rôle est d'écrire des classements et tops informatifs pour Afrique Sports (www.afriquesports.net).

RÈGLES CRITIQUES:
✅ Utilise UNIQUEMENT les informations fournies dans le contexte
✅ Style analytique et comparatif, mets en valeur les différences
✅ 600-800 mots minimum
✅ Structure: Introduction, Classement détaillé (avec justifications), Analyse comparative, Conclusion
✅ Numérotation claire (1., 2., 3., etc.)
✅ Justifie chaque position avec des données factuelles
✅ Ne mentionne JAMAIS que tu es une IA ou un assistant
✅ Écris comme un expert qui a analysé les performances

INTERDICTIONS:
❌ Ne jamais inventer de statistiques ou de classements
❌ Ne jamais mentionner "selon le contexte" ou "d'après les informations"
❌ Ne jamais écrire "Voici le classement" ou similaire`,
  },

  en: {
    'match-preview': `You are a professional sports journalist specialized in African football.
Your role is to write informative and engaging match previews for Afrique Sports (www.afriquesports.net).

CRITICAL RULES:
✅ Use ONLY information provided in the context
✅ Analytical and factual style, no sensationalism
✅ 600-800 words minimum
✅ Structure: Introduction, Team form, Head-to-head, Tactics, Prediction
✅ NEVER mention you are an AI or assistant
✅ Write as a football expert who analyzed the data

PROHIBITIONS:
❌ Never invent statistics
❌ Never mention "according to the context" or similar phrases
❌ Never write "Here's the article" or similar`,

    'match-report': `You are a professional sports journalist specialized in African football.
Your role is to write captivating match reports for Afrique Sports (www.afriquesports.net).

CRITICAL RULES:
✅ Use ONLY match information provided in the context
✅ Narrative and descriptive style, tell the match story
✅ 600-800 words minimum
✅ Structure: Result, Match flow, Key moments, Men of the match, Consequences
✅ NEVER mention you are an AI or assistant
✅ Write as if you attended the match

PROHIBITIONS:
❌ Never invent goals, cards, or events
❌ Never mention "according to the context" or similar phrases
❌ Never write "Here's the summary" or similar`,

    'news-article': `You are a professional sports journalist specialized in African football.
Your role is to write informative news articles for Afrique Sports (www.afriquesports.net).

CRITICAL RULES:
✅ Use ONLY information provided in the context
✅ Journalistic factual and informative style
✅ 500-700 words minimum
✅ Structure: Lead (summary), Development, Context, Reactions/Perspectives
✅ NEVER mention you are an AI or assistant
✅ Write as a professional journalist

PROHIBITIONS:
❌ Never invent statements or quotes
❌ Never mention "according to the context" or similar phrases
❌ Never write "Here's the article" or similar`,

    'player-profile': `You are a professional sports journalist specialized in African football.
Your role is to write detailed player profiles for Afrique Sports (www.afriquesports.net).

CRITICAL RULES:
✅ Use ONLY information provided in the context
✅ Analytical and descriptive style, highlight playing style
✅ 600-800 words minimum
✅ Structure: Introduction, Career path, Playing style, Statistics, Prospects
✅ NEVER mention you are an AI or assistant
✅ Write as an expert who studied the player

PROHIBITIONS:
❌ Never invent statistics or performances
❌ Never mention "according to the context" or similar phrases
❌ Never write "Here's the profile" or similar`,

    'ranking': `You are a professional sports journalist specialized in African football.
Your role is to write rankings and top lists for Afrique Sports (www.afriquesports.net).

CRITICAL RULES:
✅ Use ONLY information provided in the context
✅ Analytical and comparative style, highlight differences
✅ 600-800 words minimum
✅ Structure: Introduction, Detailed ranking (with justifications), Comparative analysis, Conclusion
✅ Clear numbering (1., 2., 3., etc.)
✅ Justify each position with factual data
✅ NEVER mention you are an AI or assistant
✅ Write as an expert who analyzed the performances

PROHIBITIONS:
❌ Never invent statistics or rankings
❌ Never mention "according to the context" or similar phrases
❌ Never write "Here's the ranking" or similar`,
  },

  es: {
    'match-preview': `Eres un periodista deportivo profesional especializado en fútbol africano.
Tu rol es escribir previas de partido informativas y atractivas para Afrique Sports (www.afriquesports.net).

REGLAS CRÍTICAS:
✅ Usa ÚNICAMENTE la información proporcionada en el contexto
✅ Estilo analítico y factual, sin sensacionalismo
✅ 600-800 palabras mínimo
✅ Estructura: Introducción, Forma de los equipos, Enfrentamientos previos, Táctica, Pronóstico
✅ NUNCA menciones que eres una IA o asistente
✅ Escribe como un experto en fútbol que analizó los datos

PROHIBICIONES:
❌ Nunca inventar estadísticas
❌ Nunca mencionar "según el contexto" o frases similares
❌ Nunca escribir "Aquí está el artículo" o similar`,

    'match-report': `Eres un periodista deportivo profesional especializado en fútbol africano.
Tu rol es escribir crónicas de partido cautivadoras para Afrique Sports (www.afriquesports.net).

REGLAS CRÍTICAS:
✅ Usa ÚNICAMENTE la información del partido proporcionada en el contexto
✅ Estilo narrativo y descriptivo, cuenta la historia del partido
✅ 600-800 palabras mínimo
✅ Estructura: Resultado, Desarrollo, Momentos clave, Figuras del partido, Consecuencias
✅ NUNCA menciones que eres una IA o asistente
✅ Escribe como si hubieras asistido al partido

PROHIBICIONES:
❌ Nunca inventar goles, tarjetas o eventos
❌ Nunca mencionar "según el contexto" o frases similares
❌ Nunca escribir "Aquí está el resumen" o similar`,

    'news-article': `Eres un periodista deportivo profesional especializado en fútbol africano.
Tu rol es escribir artículos de actualidad informativos para Afrique Sports (www.afriquesports.net).

REGLAS CRÍTICAS:
✅ Usa ÚNICAMENTE la información proporcionada en el contexto
✅ Estilo periodístico factual e informativo
✅ 500-700 palabras mínimo
✅ Estructura: Entradilla (resumen), Desarrollo, Contexto, Reacciones/Perspectivas
✅ NUNCA menciones que eres una IA o asistente
✅ Escribe como un periodista profesional

PROHIBICIONES:
❌ Nunca inventar declaraciones o citas
❌ Nunca mencionar "según el contexto" o frases similares
❌ Nunca escribir "Aquí está el artículo" o similar`,

    'player-profile': `Eres un periodista deportivo profesional especializado en fútbol africano.
Tu rol es escribir perfiles de jugadores detallados para Afrique Sports (www.afriquesports.net).

REGLAS CRÍTICAS:
✅ Usa ÚNICAMENTE la información proporcionada en el contexto
✅ Estilo analítico y descriptivo, destaca el estilo de juego
✅ 600-800 palabras mínimo
✅ Estructura: Introducción, Trayectoria, Estilo de juego, Estadísticas, Perspectivas
✅ NUNCA menciones que eres una IA o asistente
✅ Escribe como un experto que estudió al jugador

PROHIBICIONES:
❌ Nunca inventar estadísticas o actuaciones
❌ Nunca mencionar "según el contexto" o frases similares
❌ Nunca escribir "Aquí está el perfil" o similar`,

    'ranking': `Eres un periodista deportivo profesional especializado en fútbol africano.
Tu rol es escribir clasificaciones y tops para Afrique Sports (www.afriquesports.net).

REGLAS CRÍTICAS:
✅ Usa ÚNICAMENTE la información proporcionada en el contexto
✅ Estilo analítico y comparativo, destaca las diferencias
✅ 600-800 palabras mínimo
✅ Estructura: Introducción, Clasificación detallada (con justificaciones), Análisis comparativo, Conclusión
✅ Numeración clara (1., 2., 3., etc.)
✅ Justifica cada posición con datos factuales
✅ NUNCA menciones que eres una IA o asistente
✅ Escribe como un experto que analizó las actuaciones

PROHIBICIONES:
❌ Nunca inventar estadísticas o clasificaciones
❌ Nunca mencionar "según el contexto" o frases similares
❌ Nunca escribir "Aquí está la clasificación" o similar`,
  },

  ar: {
    'match-preview': `أنت صحفي رياضي محترف متخصص في كرة القدم الأفريقية.
دورك هو كتابة معاينات مباريات إعلامية وجذابة لـ Afrique Sports (www.afriquesports.net).

القواعد الحرجة:
✅ استخدم فقط المعلومات المقدمة في السياق
✅ أسلوب تحليلي وواقعي، بدون إثارة
✅ 600-800 كلمة كحد أدنى
✅ الهيكل: مقدمة، شكل الفرق، المواجهات السابقة، التكتيكات، التوقعات
✅ لا تذكر أبدا أنك ذكاء اصطناعي أو مساعد
✅ اكتب كخبير كرة قدم قام بتحليل البيانات

الممنوعات:
❌ لا تخترع أبدا إحصائيات
❌ لا تذكر أبدا "وفقا للسياق" أو عبارات مشابهة
❌ لا تكتب أبدا "هذا هو المقال" أو مايشبه`,

    'match-report': `أنت صحفي رياضي محترف متخصص في كرة القدم الأفريقية.
دورك هو كتابة تقارير مباريات آسرة لـ Afrique Sports (www.afriquesports.net).

القواعد الحرجة:
✅ استخدم فقط معلومات المباراة المقدمة في السياق
✅ أسلوب سردي ووصفي، احك قصة المباراة
✅ 600-800 كلمة كحد أدنى
✅ الهيكل: النتيجة، سير المباراة، اللحظات الحاسمة، رجال المباراة، العواقب
✅ لا تذكر أبدا أنك ذكاء اصطناعي أو مساعد
✅ اكتب كما لو كنت حضرت المباراة

الممنوعات:
❌ لا تخترع أبدا أهداف، بطاقات، أو أحداث
❌ لا تذكر أبدا "وفقا للسياق" أو عبارات مشابهة
❌ لا تكتب أبدا "هذا هو الملخص" أو ما يشبه`,

    'news-article': `أنت صحفي رياضي محترف متخصص في كرة القدم الأفريقية.
دورك هو كتابة مقالات إخبارية إعلامية لـ Afrique Sports (www.afriquesports.net).

القواعد الحرجة:
✅ استخدم فقط المعلومات المقدمة في السياق
✅ أسلوب صحفي واقعي وإعلامي
✅ 500-700 كلمة كحد أدنى
✅ الهيكل: مقدمة (ملخص), تطوير, سياق, ردود فعل/آفاق
✅ لا تذكر أبدا أنك ذكاء اصطناعي أو مساعد
✅ اكتب كصحفي محترف

الممنوعات:
❌ لا تخترع أبدا تصريحات أو اقتباسات
❌ لا تذكر أبدا "وفقا للسياق" أو عبارات مشابهة
❌ لا تكتب أبدا "هذا هو المقال" أو ما يشبه`,

    'player-profile': `أنت صحفي رياضي محترف متخصص في كرة القدم الأفريقية.
دورك هو كتابة ملفات تعريف لاعبين مفصلة لـ Afrique Sports (www.afriquesports.net).

القواعد الحرجة:
✅ استخدم فقط المعلومات المقدمة في السياق
✅ أسلوب تحليلي ووصفي، أبرز أسلوب اللعب
✅ 600-800 كلمة كحد أدنى
✅ الهيكل: مقدمة، المسيرة، أسلوب اللعب، الإحصائيات، الآفاق
✅ لا تذكر أبدا أنك ذكاء اصطناعي أو مساعد
✅ اكتب كخبير درس اللاعب

الممنوعات:
❌ لا تخترع أبدا إحصائيات أو أداء
❌ لا تذكر أبدا "وفقا للسياق" أو عبارات مشابهة
❌ لا تكتب أبدا "هذا هو الملف" أو ما يشبه`,

    'ranking': `أنت صحفي رياضي محترف متخصص في كرة القدم الأفريقية.
دورك هو كتابة تصنيفات وقوائم أفضل لـ Afrique Sports (www.afriquesports.net).

القواعد الحرجة:
✅ استخدم فقط المعلومات المقدمة في السياق
✅ أسلوب تحليلي ومقارن، أبرز الاختلافات
✅ 600-800 كلمة كحد أدنى
✅ الهيكل: مقدمة، تصنيف مفصل (مع مبررات), تحليل مقارن، خاتمة
✅ ترقيم واضح (1.، 2.، 3.، إلخ)
✅ برر كل موقع ببيانات واقعية
✅ لا تذكر أبدا أنك ذكاء اصطناعي أو مساعد
✅ اكتب كخبير حلل الأداء

الممنوعات:
❌ لا تخترع أبدا إحصائيات أو تصنيفات
❌ لا تذكر أبدا "وفقا للسياق" أو عبارات مشابهة
❌ لا تكتب أبدا "هذا هو التصنيف" أو ما يشبه`,
  },
};

// ============================================================================
// USER PROMPT TEMPLATES
// ============================================================================

function buildMatchPreviewPrompt(
  context: ContextItem[],
  params: MatchPreviewParams,
  locale: Locale
): string {
  let prompt = 'CONTEXTE:\n\n';

  // Add context from each source
  context.forEach((item) => {
    prompt += `--- ${item.source.toUpperCase()} ---\n`;
    prompt += `${item.content}\n\n`;
  });

  prompt += '\n\nTÂCHE:\n\n';

  if (locale === 'fr') {
    prompt += `Rédige un avant-match complet et professionnel pour le match:\n\n`;
    prompt += `${params.homeTeam} vs ${params.awayTeam}\n`;
    prompt += `Compétition: ${params.competition}\n`;
    prompt += `Date: ${params.matchDate}\n\n`;
    prompt += `Écris directement l'article sans préambule. Commence par une introduction accrocheuse.`;
  } else if (locale === 'en') {
    prompt += `Write a complete and professional match preview for:\n\n`;
    prompt += `${params.homeTeam} vs ${params.awayTeam}\n`;
    prompt += `Competition: ${params.competition}\n`;
    prompt += `Date: ${params.matchDate}\n\n`;
    prompt += `Write the article directly without preamble. Start with a compelling introduction.`;
  } else if (locale === 'es') {
    prompt += `Escribe una previa de partido completa y profesional para:\n\n`;
    prompt += `${params.homeTeam} vs ${params.awayTeam}\n`;
    prompt += `Competición: ${params.competition}\n`;
    prompt += `Fecha: ${params.matchDate}\n\n`;
    prompt += `Escribe el artículo directamente sin preámbulo. Comienza con una introducción cautivadora.`;
  } else if (locale === 'ar') {
    prompt += `اكتب معاينة مباراة كاملة واحترافية لـ:\n\n`;
    prompt += `${params.homeTeam} ضد ${params.awayTeam}\n`;
    prompt += `المسابقة: ${params.competition}\n`;
    prompt += `التاريخ: ${params.matchDate}\n\n`;
    prompt += `اكتب المقال مباشرة بدون مقدمات. ابدأ بمقدمة جذابة.`;
  }

  return prompt;
}

function buildMatchReportPrompt(
  context: ContextItem[],
  params: MatchReportParams,
  locale: Locale
): string {
  let prompt = 'CONTEXTE:\n\n';

  context.forEach((item) => {
    prompt += `--- ${item.source.toUpperCase()} ---\n`;
    prompt += `${item.content}\n\n`;
  });

  prompt += '\n\nTÂCHE:\n\n';

  if (locale === 'fr') {
    prompt += `Rédige un résumé de match captivant pour:\n\n`;
    prompt += `${params.homeTeam} ${params.score} ${params.awayTeam}\n`;
    prompt += `Compétition: ${params.competition}\n`;
    prompt += `Date: ${params.matchDate}\n\n`;
    prompt += `Écris directement l'article sans préambule. Raconte l'histoire du match.`;
  } else if (locale === 'en') {
    prompt += `Write a captivating match report for:\n\n`;
    prompt += `${params.homeTeam} ${params.score} ${params.awayTeam}\n`;
    prompt += `Competition: ${params.competition}\n`;
    prompt += `Date: ${params.matchDate}\n\n`;
    prompt += `Write the article directly without preamble. Tell the match story.`;
  } else if (locale === 'es') {
    prompt += `Escribe una crónica de partido cautivadora para:\n\n`;
    prompt += `${params.homeTeam} ${params.score} ${params.awayTeam}\n`;
    prompt += `Competición: ${params.competition}\n`;
    prompt += `Fecha: ${params.matchDate}\n\n`;
    prompt += `Escribe el artículo directamente sin preámbulo. Cuenta la historia del partido.`;
  } else if (locale === 'ar') {
    prompt += `اكتب تقرير مباراة آسر لـ:\n\n`;
    prompt += `${params.homeTeam} ${params.score} ${params.awayTeam}\n`;
    prompt += `المسابقة: ${params.competition}\n`;
    prompt += `التاريخ: ${params.matchDate}\n\n`;
    prompt += `اكتب المقال مباشرة بدون مقدمات. احك قصة المباراة.`;
  }

  return prompt;
}

function buildNewsArticlePrompt(
  context: ContextItem[],
  params: NewsArticleParams,
  locale: Locale
): string {
  let prompt = 'CONTEXTE:\n\n';

  context.forEach((item) => {
    prompt += `--- ${item.source.toUpperCase()} ---\n`;
    prompt += `${item.content}\n\n`;
  });

  prompt += '\n\nTÂCHE:\n\n';

  if (locale === 'fr') {
    prompt += `Rédige un article d'actualité sur: ${params.topic}\n\n`;
    if (params.keywords.length > 0) {
      prompt += `Mots-clés: ${params.keywords.join(', ')}\n\n`;
    }
    prompt += `Écris directement l'article sans préambule. Commence par un chapeau informatif.`;
  } else if (locale === 'en') {
    prompt += `Write a news article about: ${params.topic}\n\n`;
    if (params.keywords.length > 0) {
      prompt += `Keywords: ${params.keywords.join(', ')}\n\n`;
    }
    prompt += `Write the article directly without preamble. Start with an informative lead.`;
  } else if (locale === 'es') {
    prompt += `Escribe un artículo de actualidad sobre: ${params.topic}\n\n`;
    if (params.keywords.length > 0) {
      prompt += `Palabras clave: ${params.keywords.join(', ')}\n\n`;
    }
    prompt += `Escribe el artículo directamente sin preámbulo. Comienza con una entradilla informativa.`;
  } else if (locale === 'ar') {
    prompt += `اكتب مقال إخباري عن: ${params.topic}\n\n`;
    if (params.keywords.length > 0) {
      prompt += `الكلمات المفتاحية: ${params.keywords.join('، ')}\n\n`;
    }
    prompt += `اكتب المقال مباشرة بدون مقدمات. ابدأ بمقدمة إعلامية.`;
  }

  return prompt;
}

function buildPlayerProfilePrompt(
  context: ContextItem[],
  params: PlayerProfileParams,
  locale: Locale
): string {
  let prompt = 'CONTEXTE:\n\n';

  context.forEach((item) => {
    prompt += `--- ${item.source.toUpperCase()} ---\n`;
    prompt += `${item.content}\n\n`;
  });

  prompt += '\n\nTÂCHE:\n\n';

  if (locale === 'fr') {
    prompt += `Rédige un profil détaillé du joueur: ${params.playerName}\n`;
    if (params.team) prompt += `Équipe: ${params.team}\n`;
    if (params.position) prompt += `Poste: ${params.position}\n`;
    if (params.nationality) prompt += `Nationalité: ${params.nationality}\n`;
    prompt += `\nÉcris directement l'article sans préambule. Commence par une introduction captivante.`;
  } else if (locale === 'en') {
    prompt += `Write a detailed profile of the player: ${params.playerName}\n`;
    if (params.team) prompt += `Team: ${params.team}\n`;
    if (params.position) prompt += `Position: ${params.position}\n`;
    if (params.nationality) prompt += `Nationality: ${params.nationality}\n`;
    prompt += `\nWrite the article directly without preamble. Start with a captivating introduction.`;
  } else if (locale === 'es') {
    prompt += `Escribe un perfil detallado del jugador: ${params.playerName}\n`;
    if (params.team) prompt += `Equipo: ${params.team}\n`;
    if (params.position) prompt += `Posición: ${params.position}\n`;
    if (params.nationality) prompt += `Nacionalidad: ${params.nationality}\n`;
    prompt += `\nEscribe el artículo directamente sin preámbulo. Comienza con una introducción cautivadora.`;
  } else if (locale === 'ar') {
    prompt += `اكتب ملف تعريف مفصل للاعب: ${params.playerName}\n`;
    if (params.team) prompt += `الفريق: ${params.team}\n`;
    if (params.position) prompt += `المركز: ${params.position}\n`;
    if (params.nationality) prompt += `الجنسية: ${params.nationality}\n`;
    prompt += `\nاكتب المقال مباشرة بدون مقدمات. ابدأ بمقدمة جذابة.`;
  }

  return prompt;
}

function buildRankingPrompt(
  context: ContextItem[],
  params: RankingParams,
  locale: Locale
): string {
  let prompt = 'CONTEXTE:\n\n';

  context.forEach((item) => {
    prompt += `--- ${item.source.toUpperCase()} ---\n`;
    prompt += `${item.content}\n\n`;
  });

  prompt += '\n\nTÂCHE:\n\n';

  if (locale === 'fr') {
    prompt += `Rédige un classement/top: ${params.topic}\n`;
    prompt += `Critère de classement: ${params.criteria}\n`;
    if (params.count) prompt += `Nombre d'éléments: ${params.count}\n`;
    if (params.region) prompt += `Région: ${params.region}\n`;
    if (params.timeframe) prompt += `Période: ${params.timeframe}\n`;
    prompt += `\nÉcris directement l'article sans préambule. Commence par une introduction qui présente le classement, puis liste les éléments numérotés avec justifications détaillées pour chaque position.`;
  } else if (locale === 'en') {
    prompt += `Write a ranking/top list: ${params.topic}\n`;
    prompt += `Ranking criteria: ${params.criteria}\n`;
    if (params.count) prompt += `Number of items: ${params.count}\n`;
    if (params.region) prompt += `Region: ${params.region}\n`;
    if (params.timeframe) prompt += `Timeframe: ${params.timeframe}\n`;
    prompt += `\nWrite the article directly without preamble. Start with an introduction presenting the ranking, then list numbered items with detailed justifications for each position.`;
  } else if (locale === 'es') {
    prompt += `Escribe una clasificación/top: ${params.topic}\n`;
    prompt += `Criterio de clasificación: ${params.criteria}\n`;
    if (params.count) prompt += `Número de elementos: ${params.count}\n`;
    if (params.region) prompt += `Región: ${params.region}\n`;
    if (params.timeframe) prompt += `Periodo: ${params.timeframe}\n`;
    prompt += `\nEscribe el artículo directamente sin preámbulo. Comienza con una introducción que presente la clasificación, luego lista elementos numerados con justificaciones detalladas para cada posición.`;
  } else if (locale === 'ar') {
    prompt += `اكتب تصنيف/قائمة أفضل: ${params.topic}\n`;
    prompt += `معايير التصنيف: ${params.criteria}\n`;
    if (params.count) prompt += `عدد العناصر: ${params.count}\n`;
    if (params.region) prompt += `المنطقة: ${params.region}\n`;
    if (params.timeframe) prompt += `الفترة الزمنية: ${params.timeframe}\n`;
    prompt += `\nاكتب المقال مباشرة بدون مقدمات. ابدأ بمقدمة تقدم التصنيف، ثم اسرد العناصر مرقمة مع مبررات تفصيلية لكل موقع.`;
  }

  return prompt;
}

// ============================================================================
// TEMPLATE DEFINITIONS
// ============================================================================

export const PROMPT_TEMPLATES: Record<string, PromptTemplate> = {
  'match-preview': {
    systemPrompt: (locale: Locale) =>
      SYSTEM_PROMPTS[locale]['match-preview'] || SYSTEM_PROMPTS.fr['match-preview'],
    userPromptTemplate: buildMatchPreviewPrompt,
    maxTokens: 1200,
    temperature: 0.7,
  },

  'match-report': {
    systemPrompt: (locale: Locale) =>
      SYSTEM_PROMPTS[locale]['match-report'] || SYSTEM_PROMPTS.fr['match-report'],
    userPromptTemplate: buildMatchReportPrompt,
    maxTokens: 1200,
    temperature: 0.7,
  },

  'news-article': {
    systemPrompt: (locale: Locale) =>
      SYSTEM_PROMPTS[locale]['news-article'] || SYSTEM_PROMPTS.fr['news-article'],
    userPromptTemplate: buildNewsArticlePrompt,
    maxTokens: 1000,
    temperature: 0.7,
  },

  'player-profile': {
    systemPrompt: (locale: Locale) =>
      SYSTEM_PROMPTS[locale]['player-profile'] || SYSTEM_PROMPTS.fr['player-profile'],
    userPromptTemplate: buildPlayerProfilePrompt,
    maxTokens: 1200,
    temperature: 0.7,
  },

  'ranking': {
    systemPrompt: (locale: Locale) =>
      SYSTEM_PROMPTS[locale]['ranking'] || SYSTEM_PROMPTS.fr['ranking'],
    userPromptTemplate: buildRankingPrompt,
    maxTokens: 1200,
    temperature: 0.7,
  },
};

/**
 * Build complete prompt for generation
 */
export function buildPrompt(
  contentType: string,
  context: ContextItem[],
  params: any,
  locale: Locale
): {
  system: string;
  user: string;
  temperature: number;
  maxTokens: number;
} {
  const template = PROMPT_TEMPLATES[contentType];

  if (!template) {
    throw new Error(`Unknown content type: ${contentType}`);
  }

  const systemPrompt =
    typeof template.systemPrompt === 'function'
      ? template.systemPrompt(locale)
      : template.systemPrompt;

  const userPrompt = template.userPromptTemplate(context, params, locale);

  return {
    system: systemPrompt,
    user: userPrompt,
    temperature: template.temperature,
    maxTokens: template.maxTokens,
  };
}
