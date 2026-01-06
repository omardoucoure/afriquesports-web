#!/usr/bin/env node

async function debug() {
  const apiKey = '5c275ac95a16daf1881253242300f8ac';
  const baseUrl = 'https://v3.football.api-sports.io';

  const url = new URL('/players', baseUrl);
  url.searchParams.append('search', 'Pedri');
  url.searchParams.append('season', '2024');

  console.log('Fetching:', url.toString());
  console.log('Key:', apiKey.substring(0, 10) + '...\n');

  const response = await fetch(url.toString(), {
    headers: {
      'x-apisports-key': apiKey,
    },
  });

  console.log('Status:', response.status);
  console.log('Headers:', Object.fromEntries(response.headers.entries()));

  const data = await response.json();
  console.log('\n📋 API Response:');
  console.log(JSON.stringify(data, null, 2));

  if (data.response && data.response.length > 0) {
    console.log('\n✅ Found', data.response.length, 'players');
    console.log('First player:', data.response[0].player.name);
  }
}

debug();
