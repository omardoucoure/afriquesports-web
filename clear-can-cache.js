#!/usr/bin/env node

/**
 * Force revalidation of CAN 2025 page cache
 * This will clear Cloudflare CDN cache
 */

const https = require('https');

// Cloudflare credentials
const ZONE_ID = '365f8911648aba12c1ba603742fe59ec';
const API_TOKEN = 'TjjWHPWguxBRcuBQh9khoMwWEESdGobAgY5s_szf';

// Purge Cloudflare cache for CAN 2025 pages
function purgeCloudflareCache() {
  const urls = [
    'https://www.afriquesports.net/can-2025',
    'https://www.afriquesports.net/en/can-2025',
    'https://www.afriquesports.net/es/can-2025',
    'https://www.afriquesports.net/ar/can-2025',
  ];

  const body = JSON.stringify({ files: urls });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.cloudflare.com',
      path: `/client/v4/zones/${ZONE_ID}/purge_cache`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Cloudflare cache purged successfully!');
          console.log('   Purged URLs:');
          urls.forEach(url => console.log(`   - ${url}`));
          resolve(JSON.parse(data));
        } else {
          console.error(`❌ Failed: HTTP ${res.statusCode}`);
          console.error(data);
          reject(new Error(data));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Run purge
purgeCloudflareCache()
  .then(() => {
    console.log('\n🔄 Cache cleared! Page will regenerate on next visit.');
    console.log('💡 Tip: Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)');
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
