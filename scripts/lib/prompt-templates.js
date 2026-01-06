/**
 * Prompt Templates by Post Type
 *
 * Different templates optimized for each content type
 */

class PromptTemplates {
  /**
   * RANKING TEMPLATE - For Top X lists
   */
  static ranking(post, factSheet, rankingNumber = 10) {
    const hasRealData = factSheet && factSheet.length > 0;

    if (!hasRealData) {
      return this.rankingGeneric(post, rankingNumber);
    }

    return `Écris un classement complet des ${rankingNumber} meilleurs joueurs pour: ${post.title}

${factSheet}

STRUCTURE OBLIGATOIRE (exactement comme Tips.gg):

1. INTRODUCTION (150-180 mots):
   Paragraphe captivant mentionnant que ce classement explore la vision, le leadership et l'impact de ces milieux de terrain.

2. TABLE DES MATIÈRES (liste numérotée):
   <h2>Le Top ${rankingNumber} des Milieux de Terrain</h2>
   <ol>
   <li>{Nom Joueur 1} ({Club}, {Pays})</li>
   <li>{Nom Joueur 2} ({Club}, {Pays})</li>
   ...
   </ol>

3. CHAQUE JOUEUR (${rankingNumber} entrées):

   <h3>{Nom du joueur}, {Club}, {Pays}</h3>

   <p>{Paragraphe narratif de 120-150 mots avec:
   - Réalisations et trophées spécifiques
   - Style de jeu et comparaisons avec légendes
   - Statistiques EXACTES: "En 2024/2025, X buts et Y passes décisives en Z matchs de [compétition]"
   - Valeur marchande: "Valorisé à €XXXm"
   - Parcours de carrière
   - Impact sur l'équipe et avenir}</p>

   <div style="width: 1210px" class="wp-caption aligncenter">
     <img decoding="async"
          src="https://www.afriquesports.net/wp-content/uploads/players/{nom-joueur-slug}.jpg"
          alt="{Nom du joueur}"
          width="1200">
     <p class="wp-caption-text">Source: {Club officiel}</p>
   </div>

CONSIGNES STRICTES:
- MINIMUM 1500 mots au total
- PAS de <h2>N°X</h2> - le rang est implicite par l'ordre
- Table des matières OBLIGATOIRE après l'intro
- Stats PRÉCISES avec nom de la compétition
- Utilise UNIQUEMENT les vraies données fournies
- Pas de conclusion - termine après le dernier joueur
- Style narratif riche

EXEMPLE FORMAT:

<p>Les milieux de terrain de 2025 ont redéfini le rythme du football, orchestrant les jeux avec une finesse inégalée. Notre classement dévoile les virtuoses qui créent les règles sur les plus grandes scènes du monde. Au-delà des statistiques, nous explorons l'art, le leadership et l'impact de ces merveilles du milieu de terrain.</p>

<h2>Le Top 10 des Milieux de Terrain</h2>
<ol>
<li>Pedri (Barcelona, Espagne)</li>
<li>Jude Bellingham (Real Madrid, Angleterre)</li>
<li>Vitinha (PSG, Portugal)</li>
</ol>

<h3>Pedri, Barcelona, Espagne</h3>

<p>Le virtuose du milieu de terrain du FC Barcelone s'est hissé à l'échelon supérieur du football. La vision et les prouesses techniques du prodige espagnol ont transformé le jeu du Barça, lui permettant de remporter la Liga avec le Barca et l'Euro 2024 avec l'Espagne. En 2024/2025, Pedri a inscrit 4 buts et délivré 5 passes décisives en 37 matches de Liga, témoignant de son influence grandissante. Évalué à €144,9 millions avec un contrat jusqu'en 2030, il incarne l'avenir du FC Barcelone. Son exceptionnelle maîtrise du ballon et sa capacité à donner le tempo rappellent Xavi et Iniesta.</p>

<div style="width: 1210px" class="wp-caption aligncenter">
  <img decoding="async"
       src="https://www.afriquesports.net/wp-content/uploads/players/pedri.jpg"
       alt="Pedri"
       width="1200">
  <p class="wp-caption-text">Source: FC Barcelona</p>
</div>

Commence maintenant:`;
  }

  /**
   * RANKING TEMPLATE - Without real data (generic)
   */
  static rankingGeneric(post, rankingNumber = 10) {
    return `Tu es un journaliste sportif francophone expert spécialisé dans les CLASSEMENTS.

Sujet: ${post.title}
Catégorie: ${post.category}

⚠️ IMPORTANT: Crée un classement de #1 à #${rankingNumber} avec une structure claire.

STRUCTURE OBLIGATOIRE:

**Introduction (100-150 mots)**
- Contexte du classement
- Critères d'évaluation

**#1 - [Titre/Nom]**
[Analyse de 80-100 mots]

**#2 - [Titre/Nom]**
[Analyse de 80-100 mots]

[Continue jusqu'à #${rankingNumber}]

**Conclusion (80-100 mots)**

Vise 1200-1500 mots au total.`;
  }

  /**
   * NEWS TEMPLATE - For breaking news and announcements
   */
  static news(post, factSheet) {
    const hasRealData = factSheet && factSheet.length > 0;

    return `Tu es un journaliste sportif francophone expert spécialisé dans l'ACTUALITÉ.

Sujet: ${post.title}
Catégorie: ${post.category}

${hasRealData ? factSheet : ''}

${hasRealData ? `
⚠️ RÈGLES ABSOLUES:
✅ Utilise UNIQUEMENT les données vérifiées ci-dessus
✅ N'invente JAMAIS de statistiques ou d'informations
` : ''}

STRUCTURE OBLIGATOIRE:

**Chapeau (50-80 mots)**
- Les 5W: Qui, Quoi, Quand, Où, Pourquoi
- L'essentiel de l'information en premier

**Contexte (150-200 mots)**
- Qu'est-ce qui s'est passé?
- Contexte immédiat de l'événement
${hasRealData ? '- Utilise les statistiques et données vérifiées' : ''}

**Développement (200-300 mots)**
- Détails supplémentaires
- Réactions et implications
- Citations si disponibles
${hasRealData ? '- Performances récentes des joueurs/équipes concernés' : ''}

**Perspectives (100-150 mots)**
- Impact sur la suite de la saison
- Conséquences pour les équipes/joueurs
- Ce qu'il faut surveiller

STYLE:
- Ton factuel et informatif
- Style journalistique AFP/Reuters
- Phrases courtes et percutantes
- Pas de sensationalisme
- Vocabulaire football riche
- Ne PAS écrire le titre (fourni séparément)

Vise 600-800 mots au total.

Écris l'article maintenant:`;
  }

  /**
   * TRANSFER TEMPLATE - For mercato news
   */
  static transfer(post, factSheet) {
    const hasRealData = factSheet && factSheet.length > 0;

    return `Tu es un journaliste sportif francophone expert spécialisé dans le MERCATO.

Sujet: ${post.title}
Catégorie: ${post.category}

${hasRealData ? factSheet : ''}

${hasRealData ? `
⚠️ RÈGLES ABSOLUES:
✅ Utilise UNIQUEMENT les données vérifiées ci-dessus pour le joueur
✅ N'invente JAMAIS de montant de transfert, de salaire, ou de détails contractuels
` : ''}

STRUCTURE OBLIGATOIRE:

**L'Essentiel (50-80 mots)**
- Qui est transféré
- Vers quel club
- Montant du transfert (si connu)
- Durée du contrat

**Profil du Joueur (150-200 mots)**
${hasRealData ? `- Utilise les statistiques vérifiées ci-dessus
- Âge, position, valeur marchande
- Performances cette saison` : `- Âge, position
- Parcours récent`}
- Points forts et style de jeu

**Contexte du Transfert (200-250 mots)**
- Pourquoi ce transfert?
- Besoin du club acheteur
- Situation du club vendeur
- Concurrence d'autres clubs (si applicable)

**Impact et Perspectives (150-200 mots)**
- Comment le joueur va s'intégrer
- Enjeux pour le club
- Objectifs de la saison

STYLE:
- Ton informatif mais engageant
- Distinguer clairement les FAITS des RUMEURS
- Vocabulaire mercato précis
- Ne PAS écrire le titre (fourni séparément)

Vise 600-800 mots au total.

Écris l'article maintenant:`;
  }

  /**
   * MATCH REPORT TEMPLATE - For match results
   */
  static matchReport(post, factSheet) {
    const hasRealData = factSheet && factSheet.length > 0;

    return `Tu es un journaliste sportif francophone expert spécialisé dans les COMPTES-RENDUS DE MATCH.

Sujet: ${post.title}
Catégorie: ${post.category}

${hasRealData ? factSheet : ''}

${hasRealData ? `
⚠️ RÈGLES ABSOLUES:
✅ Utilise UNIQUEMENT les données vérifiées des joueurs ci-dessus
✅ N'invente JAMAIS le score, les buteurs, ou les détails du match
` : ''}

STRUCTURE OBLIGATOIRE:

**Résumé Flash (50-80 mots)**
- Score final
- Moments clés
- Homme du match

**Déroulement du Match (250-300 mots)**
- Première mi-temps
- Deuxième mi-temps
- Temps forts et tournants
- Buts et actions décisives

**Analyse Tactique (200-250 mots)**
- Systèmes de jeu
- Duels individuels
${hasRealData ? '- Performances des joueurs (avec stats vérifiées)' : ''}
- Choix des entraîneurs

**Conséquences (100-150 mots)**
- Impact au classement
- Série en cours
- Prochains matchs

STYLE:
- Ton dynamique et vivant
- Comme si tu racontais le match
- Vocabulaire foot riche (frappe, débordement, pressing, etc.)
- Ne PAS écrire le titre (fourni séparément)

Vise 700-900 mots au total.

Écris le compte-rendu maintenant:`;
  }

  /**
   * PREVIEW TEMPLATE - For match previews
   */
  static preview(post, factSheet) {
    const hasRealData = factSheet && factSheet.length > 0;

    return `Tu es un journaliste sportif francophone expert spécialisé dans les AVANT-MATCHS.

Sujet: ${post.title}
Catégorie: ${post.category}

${hasRealData ? factSheet : ''}

${hasRealData ? `
⚠️ RÈGLES ABSOLUES:
✅ Utilise les statistiques vérifiées des joueurs ci-dessus
✅ N'invente JAMAIS de blessures, suspensions, ou compositions d'équipe
` : ''}

STRUCTURE OBLIGATOIRE:

**Enjeux (80-100 mots)**
- Importance du match
- Pour chaque équipe
- Contexte du championnat

**Forces en Présence (250-300 mots)**
**Équipe 1:**
${hasRealData ? '- Joueurs clés (avec stats vérifiées)' : '- Joueurs clés'}
- Forme récente
- Système de jeu

**Équipe 2:**
${hasRealData ? '- Joueurs clés (avec stats vérifiées)' : '- Joueurs clés'}
- Forme récente
- Système de jeu

**Face-à-Face (150-200 mots)**
- Historique des confrontations
- Statistiques récentes
- Duels à surveiller

**Analyse et Pronostic (150-200 mots)**
- Clés du match
- Facteurs déterminants
- Tendance probable

STYLE:
- Ton anticipatif et expert
- Analyse tactique poussée
- Objectif et équilibré
- Ne PAS écrire le titre (fourni séparément)

Vise 700-900 mots au total.

Écris l'avant-match maintenant:`;
  }

  /**
   * ANALYSIS TEMPLATE - For in-depth analysis
   */
  static analysis(post, factSheet) {
    const hasRealData = factSheet && factSheet.length > 0;

    return `Tu es un journaliste sportif francophone expert spécialisé dans l'ANALYSE TACTIQUE.

Sujet: ${post.title}
Catégorie: ${post.category}

${hasRealData ? factSheet : ''}

${hasRealData ? `
⚠️ RÈGLES ABSOLUES:
✅ Utilise les données vérifiées ci-dessus comme base de ton analyse
✅ N'invente JAMAIS de statistiques ou de faits
` : ''}

STRUCTURE OBLIGATOIRE:

**Introduction (100-150 mots)**
- La question centrale
- Pourquoi c'est important
- Ce que tu vas analyser

**Analyse Approfondie (400-500 mots)**
**Aspect 1:**
- Observation
${hasRealData ? '- Données chiffrées' : ''}
- Interprétation

**Aspect 2:**
- Observation
${hasRealData ? '- Données chiffrées' : ''}
- Interprétation

**Aspect 3:**
- Observation
${hasRealData ? '- Données chiffrées' : ''}
- Interprétation

**Conclusion (150-200 mots)**
- Synthèse de l'analyse
- Implications futures
- Ce qu'il faut retenir

STYLE:
- Ton expert et pédagogique
- Analyse nuancée et argumentée
- Vocabulaire tactique précis
- Structure logique et claire
- Ne PAS écrire le titre (fourni séparément)

Vise 800-1000 mots au total.

Écris l'analyse maintenant:`;
  }

  /**
   * Get appropriate template based on post type
   */
  static getTemplate(postType, post, factSheet, options = {}) {
    switch (postType) {
      case 'ranking':
        return this.ranking(post, factSheet, options.rankingNumber || 10);
      case 'news':
        return this.news(post, factSheet);
      case 'transfer':
        return this.transfer(post, factSheet);
      case 'matchReport':
        return this.matchReport(post, factSheet);
      case 'preview':
        return this.preview(post, factSheet);
      case 'analysis':
        return this.analysis(post, factSheet);
      default:
        return this.news(post, factSheet); // Default to news
    }
  }
}

module.exports = PromptTemplates;
