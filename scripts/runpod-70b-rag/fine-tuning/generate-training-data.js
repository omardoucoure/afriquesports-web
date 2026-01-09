#!/usr/bin/env node
/**
 * Generate training data for journalist fine-tuning
 *
 * Creates instruction-output pairs from:
 * 1. Existing high-quality articles (from RAG)
 * 2. Synthetic examples with journalist prompts
 *
 * Output format: Alpaca-style JSONL
 */

const fs = require('fs');
const path = require('path');

// Example journalist prompts for different content types
const JOURNALIST_PROMPTS = {
  playerProfile: (player) => `Tu es un journaliste sportif senior de L'Equipe. Ecris un portrait detaille de ${player.name} (${player.team}, ${player.nationality}).

Inclus:
- Son parcours et sa progression
- Son style de jeu et ses qualites techniques
- Son impact sur son equipe actuelle
- Comparaisons avec des legendes du poste
- Perspectives d'avenir

Ecris 4-5 paragraphes (300-400 mots) dans un style journalistique professionnel.`,

  ranking: (player, rank, total) => `Tu es un journaliste sportif expert. Explique pourquoi ${player.name} merite la ${rank}e place dans un classement des ${total} meilleurs a son poste.

Informations:
- Club: ${player.team}
- Nationalite: ${player.nationality}
- Stats: ${player.stats}

Ecris une analyse de 3-4 paragraphes (250-350 mots) justifiant ce classement.`,

  matchAnalysis: (teams, score) => `Tu es un journaliste sportif. Analyse le match ${teams} (${score}).

Ecris une analyse tactique de 3 paragraphes:
1. Les faits marquants du match
2. L'analyse tactique des deux equipes
3. Les joueurs decisifs et les perspectives

Style: journalistique, precis, analytique.`,

  transferNews: (player, fromClub, toClub, fee) => `Tu es un journaliste sportif specialise mercato. Analyse le transfert de ${player} de ${fromClub} vers ${toClub} pour ${fee}.

Inclus:
- L'historique du joueur
- Pourquoi ce transfert fait sens
- L'impact pour les deux clubs
- Les attentes

Ecris 3-4 paragraphes dans un style informatif et analytique.`
};

// Sample training examples (you would expand this significantly)
const SAMPLE_TRAINING_DATA = [
  {
    instruction: JOURNALIST_PROMPTS.playerProfile({
      name: "Jude Bellingham",
      team: "Real Madrid",
      nationality: "Angleterre"
    }),
    output: `A seulement 21 ans, Jude Bellingham incarne deja l'avenir du football mondial. L'Anglais, arrive au Real Madrid a l'ete 2023 en provenance du Borussia Dortmund pour 103 millions d'euros, a immediatement conquis le Santiago Bernabeu par sa maturite et son talent hors norme.

Son parcours force l'admiration. Forme a Birmingham City, il devient le plus jeune joueur de l'histoire du club a 16 ans seulement. Son passage de quatre saisons au Borussia Dortmund lui permet de s'aguerrir au plus haut niveau europeen, disputant regulierement la Ligue des Champions et s'imposant comme l'un des meilleurs milieux de terrain du monde.

Sur le terrain, Bellingham impressionne par sa polyvalence. Capable d'evoluer en numero 8 comme en numero 10, il combine une technique impeccable, une vision du jeu au-dessus de la moyenne et une capacite de projection vers l'avant devastatrice. Son sens du but, rare pour un milieu de terrain, en fait une arme offensive redoutable. Ses appels tranchants dans la surface et son timing sur les frappes rappellent les plus grands.

La comparaison avec Zinedine Zidane, inevitable au Real Madrid, ne semble pas usurpee. Comme le Francais en son temps, Bellingham possede cette capacite a hausser son niveau dans les grands matchs, cette elegance technique et cette intelligence tactique qui font les joueurs d'exception. Certains observateurs voient meme en lui un futur Ballon d'Or.

A 21 ans, l'Anglais a tout l'avenir devant lui. Deja titulaire indiscutable au Real Madrid et en equipe d'Angleterre, il semble destine a dominer le football mondial pendant la prochaine decennie. La seule question qui demeure : jusqu'ou ira-t-il ?`
  },
  {
    instruction: JOURNALIST_PROMPTS.ranking(
      { name: "Rodri", team: "Manchester City", nationality: "Espagne", stats: "3 buts, 4 passes en 16 matchs" },
      2, 10
    ),
    output: `La deuxieme place de Rodri dans ce classement des meilleurs milieux de terrain ne doit rien au hasard. L'Espagnol de Manchester City s'est impose comme la reference absolue au poste de milieu defensif, un joueur dont l'importance depasse largement les statistiques brutes.

Son role dans le systeme de Pep Guardiola est aussi crucial qu'invisible pour l'oeil non averti. Veritable metronome de l'equipe, Rodri dicte le tempo, oriente le jeu et assure l'equilibre defensif avec une intelligence tactique remarquable. Sa capacite a recuperer les ballons, a resister a la pression et a relancer proprement fait de lui le premier rempart des Citizens.

Les chiffres, bien que modestes en apparence (3 buts, 4 passes decisives en 16 matchs), ne racontent qu'une partie de l'histoire. Son taux de passes reussies avoisinant les 93%, ses interceptions decisives et sa couverture de terrain font de lui un joueur irreplacable. Manchester City avec et sans Rodri presente deux visages radicalement differents.

S'il ne trone pas a la premiere place, c'est uniquement parce que le poste de milieu defensif, par nature moins spectaculaire, le prive des actions decisives qui font basculer les matchs. Mais demandez a n'importe quel entraineur quel milieu il souhaiterait avoir : Rodri reviendrait dans toutes les reponses.`
  },
  {
    instruction: JOURNALIST_PROMPTS.matchAnalysis("Senegal - Egypte", "1-0"),
    output: `Le Senegal a confirme son statut de favori en disposant de l'Egypte sur le plus petit des scores (1-0) dans un match tactiquement dense qui a tenu toutes ses promesses.

Sur le plan tactique, les Lions de la Teranga ont impose leur pressing haut des les premieres minutes, asphyxiant la construction egyptienne. Aliou Cisse avait clairement prepare son equipe pour empecher Mohamed Salah de recevoir le ballon dans de bonnes conditions. Le milieu senegalais, avec Gueye et Mendy en sentinelles, a parfaitement controle l'entrejeu, coupant les lignes de passes adverses. L'Egypte, privee de solutions, n'a jamais reussi a developper son jeu habituel base sur les transitions rapides.

Le but decisif, inscrit par Sadio Mane a la 63e minute sur une contre-attaque eclaire, illustre parfaitement la force de cette equipe senegalaise : une solidite defensive a toute epreuve et une efficacite redoutable en transition. Mane, une fois de plus homme du match, a prouve pourquoi il reste l'atout numero un des Lions. Cote egyptien, Salah a vecu une soiree frustrante, musele par un dispositif defensif intelligent. Les Pharaons devront se remettre en question s'ils veulent pretendre au titre.`
  }
];

async function generateTrainingData(outputPath, numExamples = 500) {
  console.log(`📝 Generating ${numExamples} training examples...`);

  const trainingData = [];

  // Add sample data
  for (const example of SAMPLE_TRAINING_DATA) {
    trainingData.push({
      instruction: example.instruction,
      input: "",
      output: example.output
    });
  }

  // TODO: Fetch more examples from RAG system
  // This would call your RAG API to get high-quality articles
  // and format them as instruction-output pairs

  console.log(`   Added ${trainingData.length} examples`);

  // Write to JSONL
  const jsonlContent = trainingData
    .map(item => JSON.stringify(item))
    .join('\n');

  fs.writeFileSync(outputPath, jsonlContent);
  console.log(`✅ Saved to ${outputPath}`);

  return trainingData.length;
}

// Main
const outputPath = process.argv[2] || '/tmp/journalist_training.jsonl';
generateTrainingData(outputPath)
  .then(count => console.log(`\nGenerated ${count} training examples`))
  .catch(console.error);
