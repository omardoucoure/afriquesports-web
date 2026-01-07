#!/usr/bin/env node

/**
 * Fetch Detailed Cloudflare Analytics
 *
 * Retrieves comprehensive analytics from Cloudflare including:
 * - Request volume by endpoint
 * - Cache performance
 * - Geographic distribution
 * - Bandwidth usage
 * - HTTP status codes
 *
 * Usage:
 *   node scripts/fetch-cloudflare-analytics.js [hours]
 *   Example: node scripts/fetch-cloudflare-analytics.js 24
 */

require('dotenv').config({ path: '.env.local' });

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;

if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ZONE_ID) {
  console.error('❌ Missing Cloudflare credentials in .env.local');
  console.error('   Required: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID');
  process.exit(1);
}

const HOURS_AGO = parseInt(process.argv[2]) || 24;

async function fetchAnalytics() {
  try {
    console.log(`\n📊 Cloudflare Analytics - Last ${HOURS_AGO} Hours`);
    console.log('='.repeat(60));

    const now = new Date();
    const since = new Date(now.getTime() - HOURS_AGO * 60 * 60 * 1000);

    // 1. Dashboard Analytics
    console.log('\n📈 Overall Traffic Statistics\n');

    const dashResponse = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/analytics/dashboard?since=${since.toISOString()}&until=${now.toISOString()}`,
      {
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const dashData = await dashResponse.json();

    if (dashData.success && dashData.result) {
      const totals = dashData.result.totals;
      const timeseries = dashData.result.timeseries;

      // Overall stats
      if (totals.requests?.all > 0) {
        const all = totals.requests.all;
        const cached = totals.requests.cached || 0;
        const uncached = totals.requests.uncached || 0;
        const cacheHitRatio = ((cached / all) * 100).toFixed(2);

        console.log('Total Requests:');
        console.log(`  All:          ${all.toLocaleString()}`);
        console.log(`  Cached:       ${cached.toLocaleString()} (${cacheHitRatio}%)`);
        console.log(`  Uncached:     ${uncached.toLocaleString()}`);
        console.log(`  Cache Hit %:  ${cacheHitRatio}% ${cacheHitRatio >= 85 ? '✅ Excellent' : cacheHitRatio >= 70 ? '⚠️ Good' : '❌ Needs Improvement'}`);
      }

      if (totals.bandwidth?.all > 0) {
        const bandwidthGB = (totals.bandwidth.all / 1024 / 1024 / 1024).toFixed(2);
        const cachedGB = ((totals.bandwidth.cached || 0) / 1024 / 1024 / 1024).toFixed(2);
        const savedPercent = ((totals.bandwidth.cached / totals.bandwidth.all) * 100).toFixed(2);

        console.log('\nBandwidth:');
        console.log(`  Total:        ${bandwidthGB} GB`);
        console.log(`  Cached:       ${cachedGB} GB (${savedPercent}%)`);
        console.log(`  Saved:        ${savedPercent}% ${savedPercent >= 60 ? '✅' : '❌'}`);
      }

      if (totals.threats?.all > 0) {
        console.log('\nSecurity:');
        console.log(`  Threats:      ${totals.threats.all.toLocaleString()}`);
      }

      // Time series - peak traffic analysis
      if (timeseries && timeseries.length > 0) {
        const peaks = timeseries
          .map(t => ({ time: t.since, requests: t.requests.all }))
          .sort((a, b) => b.requests - a.requests)
          .slice(0, 5);

        console.log('\nPeak Traffic Periods (Top 5):');
        peaks.forEach((peak, i) => {
          const time = new Date(peak.time).toLocaleString('fr-FR', {
            dateStyle: 'short',
            timeStyle: 'short'
          });
          console.log(`  ${i + 1}. ${time}: ${peak.requests.toLocaleString()} requests`);
        });
      }
    }

    // 2. GraphQL Analytics - Request breakdown by path
    console.log('\n\n📍 Request Breakdown by Endpoint\n');

    const graphqlQuery = `
      query {
        viewer {
          zones(filter: {zoneTag: "${CLOUDFLARE_ZONE_ID}"}) {
            httpRequests1hGroups(
              limit: 20
              filter: {
                datetime_geq: "${since.toISOString()}"
                datetime_leq: "${now.toISOString()}"
              }
              orderBy: [sum_requests_DESC]
            ) {
              dimensions {
                clientRequestHTTPHost
                clientRequestPath
              }
              sum {
                requests
                bytes
              }
            }
          }
        }
      }
    `;

    const graphqlResponse = await fetch(
      'https://api.cloudflare.com/client/v4/graphql',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: graphqlQuery })
      }
    );

    const graphqlData = await graphqlResponse.json();

    if (graphqlData.data?.viewer?.zones?.[0]?.httpRequests1hGroups) {
      const requests = graphqlData.data.viewer.zones[0].httpRequests1hGroups;

      // Group by path pattern
      const pathStats = {};

      requests.forEach(req => {
        let path = req.dimensions.clientRequestPath;

        // Normalize paths for grouping
        if (path.includes('/api/wordpress/comments')) {
          path = '/api/wordpress/comments';
        } else if (path.includes('/api/can2025')) {
          path = '/api/can2025/*';
        } else if (path.includes('/api/visits')) {
          path = '/api/visits/*';
        } else if (path.startsWith('/_next/')) {
          path = '/_next/* (static)';
        } else if (path.match(/\/(afrique|europe|football|mercato)\//)) {
          path = '/[category]/[article]';
        }

        if (!pathStats[path]) {
          pathStats[path] = {
            requests: 0,
            bytes: 0
          };
        }

        pathStats[path].requests += req.sum.requests;
        pathStats[path].bytes += req.sum.bytes;
      });

      // Sort by requests
      const sorted = Object.entries(pathStats)
        .sort((a, b) => b[1].requests - a[1].requests)
        .slice(0, 15);

      console.log('Top Endpoints:');
      sorted.forEach(([path, stats], i) => {
        const mb = (stats.bytes / 1024 / 1024).toFixed(2);
        console.log(`  ${i + 1}. ${path}`);
        console.log(`     Requests: ${stats.requests.toLocaleString()}`);
        console.log(`     Bandwidth: ${mb} MB`);
      });

      // Highlight comments API
      const commentsPath = sorted.find(([path]) => path.includes('comments'));
      if (commentsPath) {
        const reqPerHour = (commentsPath[1].requests / HOURS_AGO).toFixed(0);
        const reqPerMin = (reqPerHour / 60).toFixed(1);
        console.log(`\n  🔍 Comments API Activity:`);
        console.log(`     ${commentsPath[1].requests.toLocaleString()} total requests`);
        console.log(`     ~${reqPerHour} requests/hour`);
        console.log(`     ~${reqPerMin} requests/minute`);
        console.log(`     Status: ${reqPerMin < 10 ? '✅ Optimized' : reqPerMin < 20 ? '⚠️ Moderate' : '❌ High'}`);
      }
    }

    // 3. Geographic breakdown
    console.log('\n\n🌍 Geographic Distribution\n');

    const geoQuery = `
      query {
        viewer {
          zones(filter: {zoneTag: "${CLOUDFLARE_ZONE_ID}"}) {
            httpRequests1hGroups(
              limit: 15
              filter: {
                datetime_geq: "${since.toISOString()}"
                datetime_leq: "${now.toISOString()}"
              }
              orderBy: [sum_requests_DESC]
            ) {
              dimensions {
                clientCountryName
              }
              sum {
                requests
                bytes
              }
            }
          }
        }
      }
    `;

    const geoResponse = await fetch(
      'https://api.cloudflare.com/client/v4/graphql',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: geoQuery })
      }
    );

    const geoData = await geoResponse.json();

    if (geoData.data?.viewer?.zones?.[0]?.httpRequests1hGroups) {
      const countries = geoData.data.viewer.zones[0].httpRequests1hGroups;

      // Group by country
      const countryStats = {};
      countries.forEach(c => {
        const country = c.dimensions.clientCountryName || 'Unknown';
        if (!countryStats[country]) {
          countryStats[country] = { requests: 0, bytes: 0 };
        }
        countryStats[country].requests += c.sum.requests;
        countryStats[country].bytes += c.sum.bytes;
      });

      const sortedCountries = Object.entries(countryStats)
        .sort((a, b) => b[1].requests - a[1].requests)
        .slice(0, 10);

      const totalRequests = sortedCountries.reduce((sum, [, stats]) => sum + stats.requests, 0);

      console.log('Top Countries:');
      sortedCountries.forEach(([country, stats], i) => {
        const percent = ((stats.requests / totalRequests) * 100).toFixed(1);
        const mb = (stats.bytes / 1024 / 1024).toFixed(1);
        console.log(`  ${i + 1}. ${country}`);
        console.log(`     ${stats.requests.toLocaleString()} requests (${percent}%)`);
        console.log(`     ${mb} MB`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Analytics fetched successfully\n');

  } catch (error) {
    console.error('❌ Error fetching analytics:', error.message);
    if (error.response) {
      console.error('Response:', await error.response.text());
    }
  }
}

// Run
fetchAnalytics();
