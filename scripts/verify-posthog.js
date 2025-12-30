#!/usr/bin/env node
/**
 * Verify PostHog Configuration
 *
 * Checks if PostHog is properly configured for Afrique Sports
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying PostHog Configuration\n');

// Check 1: Environment variables
console.log('✓ Step 1: Checking environment variables...');
const envFiles = ['.env.local', '.env.production', '.env.development'];
let foundEnv = false;
let hasClientKey = false;
let hasServerKey = false;

for (const envFile of envFiles) {
  const envPath = path.join(process.cwd(), envFile);
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');

    if (content.includes('NEXT_PUBLIC_POSTHOG_KEY')) {
      hasClientKey = true;
      console.log(`  ✅ Found NEXT_PUBLIC_POSTHOG_KEY in ${envFile}`);
    }

    if (content.includes('POSTHOG_PERSONAL_API_KEY')) {
      hasServerKey = true;
      console.log(`  ✅ Found POSTHOG_PERSONAL_API_KEY in ${envFile}`);
    }

    foundEnv = true;
  }
}

if (!foundEnv) {
  console.log('  ⚠️  No .env files found');
}

console.log('');

// Check 2: PostHog packages
console.log('✓ Step 2: Checking PostHog packages...');
const packageJson = require(path.join(process.cwd(), 'package.json'));

if (packageJson.dependencies['posthog-js']) {
  console.log(`  ✅ posthog-js installed (${packageJson.dependencies['posthog-js']})`);
} else {
  console.log('  ❌ posthog-js NOT installed');
}

if (packageJson.dependencies['posthog-node']) {
  console.log(`  ✅ posthog-node installed (${packageJson.dependencies['posthog-node']})`);
} else {
  console.log('  ⚠️  posthog-node NOT installed (optional)');
}

console.log('');

// Check 3: PostHog integration files
console.log('✓ Step 3: Checking PostHog integration files...');
const requiredFiles = [
  'src/lib/posthog.ts',
  'src/components/providers/PostHogProvider.tsx',
  'src/lib/analytics/providers/posthog-provider.ts',
  'src/app/api/posthog-stats/route.ts'
];

requiredFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} NOT FOUND`);
  }
});

console.log('');

// Summary
console.log('═══════════════════════════════════════════════════');
console.log('📊 Summary');
console.log('═══════════════════════════════════════════════════');

if (hasClientKey && hasServerKey) {
  console.log('✅ Client-side PostHog: CONFIGURED');
  console.log('✅ Server-side Stats API: CONFIGURED');
  console.log('\n✨ PostHog is fully configured!\n');
  console.log('Test it:');
  console.log('  • Client-side: Visit https://www.afriquesports.net');
  console.log('  • Server-side: curl http://localhost:3000/api/posthog-stats?period=day');
} else if (hasClientKey && !hasServerKey) {
  console.log('✅ Client-side PostHog: CONFIGURED');
  console.log('⚠️  Server-side Stats API: NEEDS CONFIGURATION');
  console.log('\n⚠️  Client-side tracking works, but stats API needs setup\n');
  console.log('To enable stats API:');
  console.log('1. Get Personal API Key: https://us.i.posthog.com/settings/user-api-keys');
  console.log('2. Add to .env.local:');
  console.log('   POSTHOG_PERSONAL_API_KEY=phx_your_key_here');
  console.log('   POSTHOG_PROJECT_ID=21827');
} else if (!hasClientKey) {
  console.log('❌ Client-side PostHog: NOT CONFIGURED');
  console.log('❌ Server-side Stats API: NOT CONFIGURED');
  console.log('\n❌ PostHog needs configuration\n');
  console.log('Add to .env.local:');
  console.log('   # Client-side (Required)');
  console.log('   NEXT_PUBLIC_POSTHOG_KEY=phc_Gq0AQAld7nRpXz0X8Et9CYX4abM7UP6rYYUCh5rwtqV');
  console.log('   NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com');
  console.log('');
  console.log('   # Server-side (For stats API)');
  console.log('   POSTHOG_PERSONAL_API_KEY=phx_your_key_here');
  console.log('   POSTHOG_PROJECT_ID=21827');
}

console.log('');
console.log('📖 Documentation:');
console.log('  • POSTHOG.md - Client-side tracking guide');
console.log('  • POSTHOG-STATS-API.md - Server-side stats API');
console.log('  • POSTHOG-SETUP.md - Complete setup guide');
console.log('');
