#!/usr/bin/env node

/**
 * Add Environment Variables to Vercel
 * Reads from .env.local and adds to Vercel via CLI
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error('❌ .env.local file not found');
    process.exit(1);
  }

  const envContent = fs.readFileSync(filePath, 'utf-8');
  const envVars = {};

  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;

    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();

      // Remove quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      envVars[key] = value;
    }
  });

  return envVars;
}

function addToVercel(key, value, environment = 'production,preview') {
  try {
    console.log(`📤 Adding ${key} to Vercel (${environment})...`);

    // Use Vercel CLI to add environment variable
    const command = `echo "${value}" | vercel env add ${key} ${environment}`;

    execSync(command, {
      stdio: 'inherit',
      shell: '/bin/bash'
    });

    console.log(`✅ ${key} added successfully\n`);
    return true;
  } catch (error) {
    console.error(`❌ Error adding ${key}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🔧 Adding environment variables to Vercel...\n');

  const envPath = path.join(process.cwd(), '.env.local');
  const envVars = parseEnvFile(envPath);

  // Required variables for automatic indexing
  const requiredVars = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'CRON_SECRET',
    'WEBHOOK_SECRET'
  ];

  // Optional but recommended
  const optionalVars = [
    'GOOGLE_INDEXING_CLIENT_EMAIL',
    'GOOGLE_INDEXING_PRIVATE_KEY',
    'GOOGLE_INDEXING_PROJECT_ID'
  ];

  let successCount = 0;
  let failCount = 0;

  // Add required variables
  console.log('📋 Required Variables:\n');
  for (const varName of requiredVars) {
    if (envVars[varName]) {
      const success = addToVercel(varName, envVars[varName]);
      success ? successCount++ : failCount++;
    } else {
      console.log(`⚠️  ${varName} not found in .env.local\n`);
      failCount++;
    }
  }

  // Add optional variables
  console.log('📋 Optional Variables (Google Indexing API):\n');
  for (const varName of optionalVars) {
    if (envVars[varName]) {
      const success = addToVercel(varName, envVars[varName]);
      success ? successCount++ : failCount++;
    } else {
      console.log(`⚠️  ${varName} not found in .env.local (optional)\n`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Successfully added: ${successCount} variables`);
  console.log(`❌ Failed or missing: ${failCount} variables`);
  console.log('='.repeat(50));

  console.log('\n🎉 Setup complete!');
  console.log('\nVerify at: https://vercel.com/dashboard → Settings → Environment Variables');

  console.log('\n⚠️  Important: Redeploy your project for changes to take effect');
  console.log('Run: vercel --prod');
}

main().catch(console.error);
