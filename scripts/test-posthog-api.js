#!/usr/bin/env node
/**
 * Test PostHog Stats API
 * Tests the /api/posthog-stats endpoint locally
 */

const http = require('http');

console.log('🔍 Testing PostHog Stats API\n');

const testPeriods = ['day', 'week', 'month'];

async function testEndpoint(period) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/posthog-stats?period=${period}`,
      method: 'GET',
    };

    console.log(`Testing period: ${period}`);
    console.log(`  URL: http://localhost:3000/api/posthog-stats?period=${period}\n`);

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);

          if (res.statusCode === 200) {
            console.log(`✅ Success for period: ${period}`);
            console.log(`   Total Page Views: ${result.summary?.totalPageViews || 0}`);
            console.log(`   Article Views: ${result.summary?.totalArticleViews || 0}`);
            console.log(`   Unique Visitors: ${result.summary?.uniqueVisitors || 0}`);
            console.log(`   Authors: ${result.summary?.totalAuthors || 0}`);

            if (result.authorStats && result.authorStats.length > 0) {
              console.log(`\n   Top 3 Authors:`);
              result.authorStats.slice(0, 3).forEach((author, i) => {
                console.log(`     ${i + 1}. ${author.authorName}: ${author.totalViews} views (${author.totalPosts} posts)`);
              });
            }
            console.log('');
          } else {
            console.log(`❌ Error for period: ${period}`);
            console.log(`   Status: ${res.statusCode}`);
            console.log(`   Error: ${result.error || 'Unknown error'}`);

            if (result.instructions) {
              console.log(`\n   Instructions: ${result.instructions}`);
            }

            if (result.error && result.error.includes('Personal API Key')) {
              console.log(`\n   ⚠️  You need to set up your PostHog Personal API Key:`);
              console.log(`   1. Go to: https://us.posthog.com/settings/user-api-keys`);
              console.log(`   2. Create a new Personal API Key`);
              console.log(`   3. Add to .env.local:`);
              console.log(`      POSTHOG_PERSONAL_API_KEY=your_key_here`);
              console.log(`   4. Restart your dev server`);
            }
            console.log('');
          }
        } catch (err) {
          console.log(`❌ Parse error for period: ${period}`);
          console.log(`   Raw response: ${data.substring(0, 200)}`);
          console.log('');
        }

        resolve();
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Request failed for period: ${period}`);
      console.log(`   Error: ${error.message}`);
      console.log(`\n   Make sure your dev server is running:`);
      console.log(`   npm run dev`);
      console.log('');
      resolve();
    });

    req.end();
  });
}

async function runTests() {
  console.log('══════════════════════════════════════════════════════');
  console.log('🧪 Testing PostHog Stats API Endpoint');
  console.log('══════════════════════════════════════════════════════\n');

  console.log('Prerequisites:');
  console.log('  ✓ Dev server running (npm run dev)');
  console.log('  ✓ POSTHOG_PERSONAL_API_KEY in .env.local\n');

  for (const period of testPeriods) {
    await testEndpoint(period);
  }

  console.log('══════════════════════════════════════════════════════');
  console.log('✨ Test Complete');
  console.log('══════════════════════════════════════════════════════\n');

  console.log('Next steps:');
  console.log('  1. If successful, integrate into your dashboard component');
  console.log('  2. Use the AnalyticsDashboard component from:');
  console.log('     src/components/analytics/AnalyticsDashboard.tsx');
  console.log('  3. Or use the usePostHogStats hook for custom components\n');

  console.log('Example usage:');
  console.log(`
  import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard'

  export default function DashboardPage() {
    return <AnalyticsDashboard />
  }
  `);
}

runTests();
