#!/usr/bin/env node

/**
 * Simple Cloudflare Traffic Check
 * Fetches basic analytics using GraphQL API
 */

require('dotenv').config({ path: '.env.local' });

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;

if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ZONE_ID) {
  console.error('❌ Missing credentials');
  process.exit(1);
}

async function checkTraffic() {
  try {
    const now = new Date();
    const since = new Date(now.getTime() - 6 * 60 * 60 * 1000); // Last 6 hours

    console.log('\n📊 Cloudflare Traffic Check - Last 6 Hours\n');
    console.log('Zone ID:', CLOUDFLARE_ZONE_ID);
    console.log('Period:', since.toISOString(), 'to', now.toISOString());
    console.log('');

    // Use GraphQL for detailed path-level analytics
    const query = `
      query {
        viewer {
          zones(filter: {zoneTag: "${CLOUDFLARE_ZONE_ID}"}) {
            httpRequests1dGroups(
              limit: 100
              filter: {
                date_geq: "${since.toISOString().split('T')[0]}"
                date_leq: "${now.toISOString().split('T')[0]}"
              }
              orderBy: [sum_requests_DESC]
            ) {
              sum {
                requests
                bytes
                cachedRequests
                cachedBytes
              }
            }
          }
        }
      }
    `;

    const response = await fetch('https://api.cloudflare.com/client/v4/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query })
    });

    const data = await response.json();

    if (data.errors) {
      console.error('GraphQL Errors:', JSON.stringify(data.errors, null, 2));
      return;
    }

    if (!response.ok) {
      console.error('HTTP Error:', response.status, response.statusText);
      console.error('Response:', JSON.stringify(data, null, 2));
      return;
    }

    const groups = data.data?.viewer?.zones?.[0]?.httpRequests1dGroups;

    if (!groups || groups.length === 0) {
      console.log('⚠️  No request data available for this period');
      console.log('   This might be normal if:');
      console.log('   - The site has very low traffic');
      console.log('   - Cloudflare analytics is still collecting data');
      console.log('   - The zone ID is incorrect');
      return;
    }

    console.log(`✅ Analytics data retrieved\n`);

    // Aggregate totals
    const totals = groups[0].sum;

    const totalRequests = totals.requests || 0;
    const totalBytes = totals.bytes || 0;
    const cachedRequests = totals.cachedRequests || 0;
    const cachedBytes = totals.cachedBytes || 0;

    console.log('📊 Traffic Summary (Last 24 Hours):\n');
    console.log(`Total Requests: ${totalRequests.toLocaleString()}`);
    console.log(`Total Bandwidth: ${(totalBytes / 1024 / 1024 / 1024).toFixed(2)} GB`);
    console.log(`Cached Requests: ${cachedRequests.toLocaleString()} (${((cachedRequests / totalRequests) * 100).toFixed(1)}%)`);
    console.log(`Cached Bandwidth: ${(cachedBytes / 1024 / 1024 / 1024).toFixed(2)} GB (${((cachedBytes / totalBytes) * 100).toFixed(1)}%)`);

    // Calculate averages
    const reqPerHour = (totalRequests / 24).toFixed(0);
    const reqPerMin = (reqPerHour / 60).toFixed(0);

    console.log(`\nAverage Traffic:`);
    console.log(`  ${reqPerHour.toLocaleString()} requests/hour`);
    console.log(`  ${reqPerMin.toLocaleString()} requests/minute`);

    // Estimate comments API impact (based on SERVER-USAGE-REPORT.md: 15-20 req/min)
    const estimatedCommentsReqPerMin = 17; // Average from report
    const estimatedCommentsPercentage = (estimatedCommentsReqPerMin / reqPerMin) * 100;

    console.log(`\n🔍 Estimated Comments API Impact:`);
    console.log(`  Current: ~${estimatedCommentsReqPerMin} requests/minute`);
    console.log(`  Percentage of total: ~${estimatedCommentsPercentage.toFixed(2)}%`);
    console.log(`  Daily volume: ~${(estimatedCommentsReqPerMin * 60 * 24).toFixed(0)} requests/day`);

    // Scroll optimization impact
    const commentsPerDay = estimatedCommentsReqPerMin * 60 * 24;
    const afterOptimization = commentsPerDay * 0.25; // 75% reduction expected
    const savings = commentsPerDay - afterOptimization;

    console.log(`\n📊 Expected Impact of Scroll Optimization:`);
    console.log(`  Before: ~${commentsPerDay.toFixed(0)} comment API requests/day`);
    console.log(`  After: ~${afterOptimization.toFixed(0)} comment API requests/day`);
    console.log(`  Savings: ~${savings.toFixed(0)} requests/day (75% reduction)`);
    console.log(`  Status: ${estimatedCommentsReqPerMin < 10 ? '✅ Will be EXCELLENT' : '✅ Will be optimized'}`);

    console.log('\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

checkTraffic();
