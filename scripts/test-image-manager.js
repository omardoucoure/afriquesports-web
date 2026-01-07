/**
 * Test Image Manager
 */

const ImageManager = require('./lib/image-manager');

async function testImageManager() {
  const imageManager = new ImageManager();

  console.log('🧪 Testing Image Manager\n');

  // Test players from the ranking
  const testPlayers = [
    { name: 'Pedri', club: 'Barcelona' },
    { name: 'Jude Bellingham', club: 'Real Madrid' },
    { name: 'Vitinha', club: 'PSG' },
  ];

  console.log('Testing 3 players...\n');

  for (const player of testPlayers) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    const imageUrl = await imageManager.getPlayerImage(player.name, player.club);
    console.log(`\n✅ ${player.name}: ${imageUrl}`);
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log('\n📊 Summary:');
  console.log(`Cache: ${Object.keys(imageManager.imageCache).length} entries`);
  console.log(JSON.stringify(imageManager.imageCache, null, 2));
}

testImageManager().catch(console.error);
