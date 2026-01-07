#!/usr/bin/env node

/**
 * Test Cloudflare API Token
 * Verifies token validity and permissions
 */

require('dotenv').config({ path: '.env.local' });

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;

console.log('\n🔐 Testing Cloudflare API Token...\n');
console.log('Token (first 20 chars):', CLOUDFLARE_API_TOKEN?.substring(0, 20) + '...');
console.log('Zone ID:', CLOUDFLARE_ZONE_ID);
console.log('');

async function testToken() {
  try {
    // Test 1: Verify token
    console.log('Test 1: Verifying token...');
    const verifyResponse = await fetch(
      'https://api.cloudflare.com/client/v4/user/tokens/verify',
      {
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        },
      }
    );

    const verifyData = await verifyResponse.json();

    if (verifyData.success) {
      console.log('✅ Token is valid!');
      console.log('   Status:', verifyData.result.status);
      console.log('');
    } else {
      console.log('❌ Token verification failed!');
      console.log('   Errors:', JSON.stringify(verifyData.errors, null, 2));
      return;
    }

    // Test 2: Get zone details
    console.log('Test 2: Fetching zone details...');
    const zoneResponse = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        },
      }
    );

    const zoneData = await zoneResponse.json();

    if (zoneData.success) {
      console.log('✅ Zone access successful!');
      console.log('   Zone name:', zoneData.result.name);
      console.log('   Status:', zoneData.result.status);
      console.log('');
    } else {
      console.log('❌ Zone access failed!');
      console.log('   Errors:', JSON.stringify(zoneData.errors, null, 2));
      return;
    }

    // Test 3: Check cache rules endpoint
    console.log('Test 3: Checking cache rules endpoint...');
    const rulesResponse = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/rulesets/phases/http_request_cache_settings/entrypoint`,
      {
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        },
      }
    );

    const rulesData = await rulesResponse.json();

    console.log('   Response status:', rulesResponse.status);

    if (rulesData.success) {
      console.log('✅ Cache rules endpoint accessible!');
      console.log('   Existing rules:', rulesData.result?.rules?.length || 0);
      console.log('');
    } else {
      console.log('❌ Cache rules endpoint failed!');
      console.log('   Errors:', JSON.stringify(rulesData.errors, null, 2));
      console.log('');

      // Check if it's a permission issue
      if (rulesData.errors?.[0]?.code === 10000) {
        console.log('⚠️  This is a PERMISSION ERROR!');
        console.log('');
        console.log('The token does NOT have permission to access cache rules.');
        console.log('');
        console.log('Possible causes:');
        console.log('1. You edited an existing token but it hasn\'t propagated yet (wait 5 min)');
        console.log('2. You created a NEW token but didn\'t update .env.local');
        console.log('3. The permissions weren\'t actually saved');
        console.log('');
        console.log('Solutions:');
        console.log('1. Wait 5 minutes and try again');
        console.log('2. Go back to Cloudflare dashboard and verify permissions are saved');
        console.log('3. If you created a NEW token, copy it and update .env.local');
      }
      return;
    }

    // Test 4: Try to create a test rule
    console.log('Test 4: Testing cache rule creation (dry run)...');
    const testRuleResponse = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/rulesets/phases/http_request_cache_settings/entrypoint`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rules: []
        }),
      }
    );

    const testRuleData = await testRuleResponse.json();

    if (testRuleData.success) {
      console.log('✅ Cache rule creation permission confirmed!');
      console.log('');
    } else {
      console.log('❌ Cannot create cache rules!');
      console.log('   Errors:', JSON.stringify(testRuleData.errors, null, 2));
      console.log('');
    }

    // Summary
    console.log('='.repeat(60));
    console.log('SUMMARY:');
    console.log('='.repeat(60));

    if (verifyData.success && zoneData.success && rulesData.success && testRuleData.success) {
      console.log('✅ All tests passed! Token is ready to configure cache rules.');
      console.log('');
      console.log('You can now run:');
      console.log('   node scripts/configure-cloudflare-cache-rules.js');
    } else {
      console.log('❌ Token has issues. See errors above.');
      console.log('');
      console.log('Next steps:');
      console.log('1. Check if permissions are actually saved in Cloudflare dashboard');
      console.log('2. Wait 5-10 minutes for permissions to propagate');
      console.log('3. If you created a NEW token, update CLOUDFLARE_API_TOKEN in .env.local');
      console.log('4. Run this test again: node scripts/test-cloudflare-token.js');
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error testing token:', error.message);
  }
}

testToken();
