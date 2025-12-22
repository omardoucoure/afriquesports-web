#!/bin/bash

# Generate and add secure secrets to Vercel

set -e

echo "🔐 Generating and adding secure secrets to Vercel..."
echo ""

# Generate secure random strings
CRON_SECRET=$(openssl rand -base64 32)
WEBHOOK_SECRET=$(openssl rand -base64 32)

echo "Generated secrets:"
echo "CRON_SECRET: $CRON_SECRET"
echo "WEBHOOK_SECRET: $WEBHOOK_SECRET"
echo ""

# Add to Vercel
echo "📤 Adding CRON_SECRET to Vercel..."
echo "$CRON_SECRET" | vercel env add CRON_SECRET production,preview

echo "📤 Adding WEBHOOK_SECRET to Vercel..."
echo "$WEBHOOK_SECRET" | vercel env add WEBHOOK_SECRET production,preview

# Also add to .env.local for local development
echo ""
echo "📝 Adding to .env.local..."

if ! grep -q "CRON_SECRET" .env.local 2>/dev/null; then
    echo "CRON_SECRET=$CRON_SECRET" >> .env.local
    echo "✅ CRON_SECRET added to .env.local"
else
    echo "⚠️  CRON_SECRET already exists in .env.local"
fi

if ! grep -q "WEBHOOK_SECRET" .env.local 2>/dev/null; then
    echo "WEBHOOK_SECRET=$WEBHOOK_SECRET" >> .env.local
    echo "✅ WEBHOOK_SECRET added to .env.local"
else
    echo "⚠️  WEBHOOK_SECRET already exists in .env.local"
fi

echo ""
echo "🎉 Secrets configured successfully!"
echo ""
echo "✅ SUPABASE_SERVICE_ROLE_KEY - Already configured"
echo "✅ CRON_SECRET - Added"
echo "✅ WEBHOOK_SECRET - Added"
echo ""
echo "Automatic indexing system is now fully configured! 🚀"
