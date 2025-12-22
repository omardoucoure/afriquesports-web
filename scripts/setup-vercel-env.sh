#!/bin/bash

# Automatic Vercel Environment Variable Setup
# This script adds all required environment variables to Vercel

set -e

echo "🔧 Setting up Vercel environment variables..."
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Load local environment variables
if [ -f .env.local ]; then
    echo "✅ Found .env.local file"

    # Extract and add SUPABASE_SERVICE_ROLE_KEY
    if grep -q "SUPABASE_SERVICE_ROLE_KEY" .env.local; then
        SERVICE_KEY=$(grep "SUPABASE_SERVICE_ROLE_KEY" .env.local | cut -d '=' -f2- | tr -d '"' | tr -d "'")

        if [ -n "$SERVICE_KEY" ]; then
            echo "📤 Adding SUPABASE_SERVICE_ROLE_KEY to Vercel..."
            vercel env add SUPABASE_SERVICE_ROLE_KEY production <<< "$SERVICE_KEY"
            echo "✅ SUPABASE_SERVICE_ROLE_KEY added to production"

            vercel env add SUPABASE_SERVICE_ROLE_KEY preview <<< "$SERVICE_KEY"
            echo "✅ SUPABASE_SERVICE_ROLE_KEY added to preview"
        else
            echo "⚠️  SUPABASE_SERVICE_ROLE_KEY found but empty"
        fi
    else
        echo "⚠️  SUPABASE_SERVICE_ROLE_KEY not found in .env.local"
        echo ""
        echo "Please add it manually:"
        echo "1. Go to Supabase Dashboard → Settings → API"
        echo "2. Copy the 'service_role' key (secret)"
        echo "3. Run: vercel env add SUPABASE_SERVICE_ROLE_KEY"
    fi

    # Check for other required variables
    echo ""
    echo "Checking other required environment variables..."

    REQUIRED_VARS=(
        "CRON_SECRET"
        "WEBHOOK_SECRET"
        "GOOGLE_INDEXING_CLIENT_EMAIL"
        "GOOGLE_INDEXING_PRIVATE_KEY"
        "GOOGLE_INDEXING_PROJECT_ID"
    )

    for VAR in "${REQUIRED_VARS[@]}"; do
        if grep -q "$VAR" .env.local; then
            echo "✅ $VAR found in .env.local"
        else
            echo "⚠️  $VAR missing - add to .env.local and Vercel"
        fi
    done

else
    echo "❌ .env.local file not found"
    echo ""
    echo "Create .env.local with required variables:"
    echo "SUPABASE_SERVICE_ROLE_KEY=..."
    echo "CRON_SECRET=..."
    echo "WEBHOOK_SECRET=..."
    echo "GOOGLE_INDEXING_CLIENT_EMAIL=..."
    echo "GOOGLE_INDEXING_PRIVATE_KEY=..."
    echo "GOOGLE_INDEXING_PROJECT_ID=..."
fi

echo ""
echo "🎉 Setup complete! Check Vercel dashboard to verify."
echo "Visit: https://vercel.com/dashboard → Your Project → Settings → Environment Variables"
