#!/usr/bin/env node

const https = require('https');

const ZONE_ID = '365f8911648aba12c1ba603742fe59ec';
const API_TOKEN = 'TjjWHPWguxBRcuBQh9khoMwWEESdGobAgY5s_szf';

// Create a Page Rule for WordPress API caching
const createPageRule = () => {
  const body = JSON.stringify({
    targets: [
      {
        target: 'url',
        constraint: {
          operator: 'matches',
          value: '*cms.realdemadrid.com/*/wp-json/*',
        },
      },
    ],
    actions: [
      {
        id: 'cache_level',
        value: 'cache_everything',
      },
      {
        id: 'edge_cache_ttl',
        value: 1800, // 30 minutes
      },
      {
        id: 'browser_cache_ttl',
        value: 300, // 5 minutes
      },
    ],
    priority: 1,
    status: 'active',
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.cloudflare.com',
      path: `/client/v4/zones/${ZONE_ID}/pagerules`,
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
          console.log('✅ Cloudflare Page Rule created successfully!');
          console.log('📊 Configuration:');
          console.log('   - URL: *cms.realdemadrid.com/*/wp-json/*');
          console.log('   - Cache Level: Cache Everything');
          console.log('   - Edge TTL: 30 minutes');
          console.log('   - Browser TTL: 5 minutes');
          console.log('');
          console.log('🔄 Page Rule will override WordPress no-cache headers');
          resolve(JSON.parse(data));
        } else {
          console.error(`❌ Failed: HTTP ${res.statusCode}`);
          const error = JSON.parse(data);
          if (error.errors && error.errors[0]) {
            console.error(`   Error: ${error.errors[0].message}`);
          }
          console.error(data);
          reject(new Error(data));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
};

createPageRule().catch(console.error);
