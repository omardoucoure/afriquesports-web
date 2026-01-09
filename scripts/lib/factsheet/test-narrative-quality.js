#!/usr/bin/env node
/**
 * Test script to verify journalist narrative quality
 *
 * This generates a sample ranking post and outputs the HTML
 * to verify that the narrative generator produces high-quality content.
 */

const { generateFallbackNarrative, NARRATIVE_PROMPTS, getPromptForPosition } = require('./journalist-narrative-generator');

// Sample player data for testing
const testPlayers = [
  {
    name: 'Jude Bellingham',
    team: 'Real Madrid',
    nationality: 'England',
    age: '21',
    marketValue: '180M EUR',
    positionDetail: 'Midfield - Attacking Midfield',
    stats: { goals: 8, assists: 6, appearances: 18, competition: 'La Liga' },
    score: 425.50,
    position: 1
  },
  {
    name: 'Rodri',
    team: 'Manchester City',
    nationality: 'Spain',
    age: '28',
    marketValue: '130M EUR',
    positionDetail: 'Midfield - Defensive Midfield',
    stats: { goals: 3, assists: 4, appearances: 16, competition: 'Premier League' },
    score: 398.25,
    position: 2
  },
  {
    name: 'Martin Odegaard',
    team: 'Arsenal',
    nationality: 'Norway',
    age: '25',
    marketValue: '120M EUR',
    positionDetail: 'Midfield - Attacking Midfield',
    stats: { goals: 6, assists: 8, appearances: 17, competition: 'Premier League' },
    score: 385.75,
    position: 3
  },
  {
    name: 'Bruno Fernandes',
    team: 'Manchester United',
    nationality: 'Portugal',
    age: '29',
    marketValue: '80M EUR',
    positionDetail: 'Midfield - Attacking Midfield',
    stats: { goals: 5, assists: 5, appearances: 18, competition: 'Premier League' },
    score: 342.10,
    position: 4
  },
  {
    name: 'Federico Valverde',
    team: 'Real Madrid',
    nationality: 'Uruguay',
    age: '26',
    marketValue: '150M EUR',
    positionDetail: 'Midfield - Central Midfield',
    stats: { goals: 4, assists: 3, appearances: 17, competition: 'La Liga' },
    score: 335.80,
    position: 5
  }
];

const totalPlayers = 10;

console.log('='.repeat(80));
console.log('JOURNALIST NARRATIVE QUALITY TEST');
console.log('Testing fallback narrative generation for ranking posts');
console.log('='.repeat(80));
console.log('');

// Test each player
for (const player of testPlayers) {
  const rank = player.position;

  console.log(`\n${'─'.repeat(80)}`);
  console.log(`#${rank} - ${player.name} (${player.team})`);
  console.log(`Score: ${player.score} | Stats: ${player.stats.goals}G ${player.stats.assists}A in ${player.stats.appearances} matches`);
  console.log(`${'─'.repeat(80)}`);

  // Show the prompt that would be used
  const prompt = getPromptForPosition(player, rank, totalPlayers, 'fr');
  console.log('\n📝 PROMPT TYPE:');
  if (rank === 1) {
    console.log('   -> Using TOP PLAYER prompt (longest, most detailed)');
  } else if (rank <= 3) {
    console.log('   -> Using PODIUM PLAYER prompt (detailed)');
  } else if (rank <= 5) {
    console.log('   -> Using TOP FIVE PLAYER prompt (moderate)');
  } else {
    console.log('   -> Using REGULAR PLAYER prompt (concise)');
  }

  // Generate fallback narrative
  const narrative = generateFallbackNarrative(player, rank, totalPlayers, 'fr');

  console.log('\n📄 GENERATED NARRATIVE:\n');
  // Clean up HTML for display
  const cleanNarrative = narrative
    .replace(/<p>/g, '')
    .replace(/<\/p>/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  console.log(cleanNarrative);

  // Count words
  const wordCount = cleanNarrative.split(/\s+/).length;
  console.log(`\n📊 Word count: ${wordCount} words`);
  console.log(`   Target: ${rank === 1 ? '300-400' : rank <= 3 ? '250-350' : rank <= 5 ? '200-300' : '150-250'} words`);
}

console.log('\n' + '='.repeat(80));
console.log('HTML OUTPUT SAMPLE (Player #1)');
console.log('='.repeat(80));

// Show full HTML output for player #1
const player1 = testPlayers[0];
const htmlNarrative = `
<div class="player-narrative" style="margin-top: 32px;">
  <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
    <div style="width: 4px; height: 32px; background: #FFD700; border-radius: 2px;"></div>
    <h4 style="margin: 0; font-size: 18px; font-weight: 700; color: #1a1a2e; text-transform: uppercase; letter-spacing: 1px;">
      Le Meilleur - Portrait
    </h4>
  </div>

  <div class="narrative-content" style="font-size: 16px; line-height: 1.8; color: #333;">
    ${generateFallbackNarrative(player1, 1, totalPlayers, 'fr')}
  </div>
</div>`;

console.log('\n' + htmlNarrative);

console.log('\n' + '='.repeat(80));
console.log('AI PROMPT SAMPLE (for integration with LLM)');
console.log('='.repeat(80));

// Show the AI prompt for player #1
const aiPrompt = getPromptForPosition(player1, 1, totalPlayers, 'fr');
console.log('\n' + aiPrompt.substring(0, 1500) + '...');

console.log('\n' + '='.repeat(80));
console.log('TEST COMPLETE');
console.log('='.repeat(80));
console.log('\nNext steps:');
console.log('1. Review the generated narratives above');
console.log('2. Integrate with AI client (Anthropic/OpenAI) for richer content');
console.log('3. Test full ranking generation with formatRankingContent()');
console.log('');
