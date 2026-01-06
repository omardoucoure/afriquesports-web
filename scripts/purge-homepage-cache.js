#!/usr/bin/env node

/**
 * Purge Homepage Cache
 *
 * Purges Cloudflare cache for homepage to force serving latest deployment
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env.production' });

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;

if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ZONE_ID) {
  console.error('❌ Missing Cloudflare credentials!');
  process.exit(1);
}

async function purgeCache() {
  try {
    console.log('🧹 Purging homepage cache...\n');

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: [
            'https://www.afriquesports.net/',
            'https://www.afriquesports.net/fr',
          ],
        }),
      }
    );

    const data = await response.json();

    if (data.success) {
      console.log('✅ Cache purged successfully!');
      console.log('\n📊 Next steps:');
      console.log('   1. Wait 10-15 seconds for purge to propagate');
      console.log('   2. Hard refresh homepage: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)');
      console.log('   3. Check DevTools Network tab for quality=95 in hero image URL');
      console.log('\n🔍 Verify with:');
      console.log('   curl -s https://www.afriquesports.net/ | grep -o "q=[0-9]*" | head -5');
    } else {
      console.error('❌ Failed to purge cache:');
      console.error(JSON.stringify(data.errors, null, 2));
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

purgeCache();
