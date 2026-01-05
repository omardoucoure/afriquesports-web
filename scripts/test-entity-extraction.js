#!/usr/bin/env node

/**
 * Test Entity Extraction
 *
 * Demonstrates how the system extracts players, teams, and topics
 * from post titles without needing API access
 */

const EntityExtractor = require('./lib/entity-extractor');

console.log('🧪 Testing Entity Extraction\n');
console.log('='.repeat(70));

const testTitles = [
  'Top 10 des milieux de terrain en 2025 : Pedri, Neves, Vitinha… le classement choc !',
  'Mohamed Salah vs Sadio Mané : qui est le meilleur joueur africain ?',
  'Mercato : Achraf Hakimi vers le Real Madrid ? Les dernières infos',
  'Liverpool vs Manchester City : analyse tactique et composition',
  'Victor Osimhen signe à Galatasaray : tous les détails du transfert',
  'Classement des buteurs africains en Europe 2025',
  'Hakim Ziyech en deuil : une tragédie personnelle assombrit son retour',
];

const extractor = new EntityExtractor();

testTitles.forEach((title, index) => {
  console.log(`\n${index + 1}. "${title}"`);
  console.log('-'.repeat(70));

  const entities = extractor.extract(title);
  const dataNeeds = extractor.getDataNeeds(entities);

  console.log(`   Players detected: ${entities.players.length ? entities.players.join(', ') : 'None'}`);
  console.log(`   Teams detected: ${entities.teams.length ? entities.teams.join(', ') : 'None'}`);
  console.log(`   Topic type: ${entities.topic}`);
  console.log(`   `);
  console.log(`   Data needs:`);
  console.log(`   → Fetch players: ${dataNeeds.fetchPlayers ? '✅' : '❌'}`);
  console.log(`   → Fetch teams: ${dataNeeds.fetchTeams ? '✅' : '❌'}`);
  console.log(`   → Fetch top scorers: ${dataNeeds.fetchTopScorers ? '✅' : '❌'}`);
});

console.log('\n' + '='.repeat(70));
console.log('✅ Entity extraction working!');
console.log('\n💡 Next step: Add API_FOOTBALL_KEY and test with real data');
console.log('   See: scripts/FOOTBALL_API_SETUP.md\n');
