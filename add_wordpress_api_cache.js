#!/usr/bin/env node

const https = require('https');

const ZONE_ID = '365f8911648aba12c1ba603742fe59ec';
const API_TOKEN = 'TjjWHPWguxBRcuBQh9khoMwWEESdGobAgY5s_szf';

// First, get the existing cache ruleset
const getRuleset = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.cloudflare.com',
      path: `/client/v4/zones/${ZONE_ID}/rulesets`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode === 200) {
          const json = JSON.parse(data);
          const cacheRuleset = json.result.find(r => r.phase === 'http_request_cache_settings');
          resolve(cacheRuleset);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
};

// Add the WordPress API cache rule
const addWordPressAPICache = async () => {
  console.log('🔍 Fetching existing cache ruleset...');
  const ruleset = await getRuleset();

  if (!ruleset) {
    console.error('❌ No cache ruleset found');
    return;
  }

  console.log(`✅ Found ruleset: ${ruleset.id}`);

  // New rule for WordPress API
  const newRule = {
    action: 'set_cache_settings',
    expression: '(http.host eq "cms.realdemadrid.com") and (http.request.uri.path contains "/wp-json/")',
    description: 'Cache WordPress API JSON - reduce server load (30min edge)',
    enabled: true,
    action_parameters: {
      cache: true,
      edge_ttl: {
        mode: 'override_origin',
        default: 1800, // 30 minutes
      },
      browser_ttl: {
        mode: 'override_origin',
        default: 300, // 5 minutes
      },
      cache_key: {
        ignore_query_strings_order: false,
        cache_by_device_type: false,
      },
      respect_strong_etags: true,
    },
  };

  // Add the new rule to the existing rules
  const updatedRules = [...(ruleset.rules || []), newRule];

  // Update the ruleset
  const body = JSON.stringify({
    rules: updatedRules,
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.cloudflare.com',
      path: `/client/v4/zones/${ZONE_ID}/rulesets/${ruleset.id}`,
      method: 'PUT',
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
          console.log('✅ WordPress API cache rule added successfully!');
          console.log('📊 Configuration:');
          console.log('   - Edge cache: 30 minutes');
          console.log('   - Browser cache: 5 minutes');
          console.log('   - Applies to: cms.realdemadrid.com/wp-json/*');
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
};

addWordPressAPICache().catch(console.error);
