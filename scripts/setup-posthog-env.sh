#!/bin/bash
# Setup PostHog Environment Variables
# Run this script to add PostHog configuration to .env.local

set -e

echo "🔧 PostHog Environment Setup"
echo "══════════════════════════════════════════════════════"
echo ""

ENV_FILE=".env.local"

# Check if .env.local exists
if [ ! -f "$ENV_FILE" ]; then
  echo "Creating $ENV_FILE..."
  touch "$ENV_FILE"
fi

# Client-side PostHog (Already provided by user)
POSTHOG_KEY="phc_Gq0AQAld7nRpXz0X8Et9CYX4abM7UP6rYYUCh5rwtqV"
POSTHOG_HOST="https://us.i.posthog.com"

# Check if keys already exist
if grep -q "NEXT_PUBLIC_POSTHOG_KEY" "$ENV_FILE"; then
  echo "✓ NEXT_PUBLIC_POSTHOG_KEY already exists in $ENV_FILE"
else
  echo "" >> "$ENV_FILE"
  echo "# PostHog Analytics (Client-side)" >> "$ENV_FILE"
  echo "NEXT_PUBLIC_POSTHOG_KEY=$POSTHOG_KEY" >> "$ENV_FILE"
  echo "✅ Added NEXT_PUBLIC_POSTHOG_KEY"
fi

if grep -q "NEXT_PUBLIC_POSTHOG_HOST" "$ENV_FILE"; then
  echo "✓ NEXT_PUBLIC_POSTHOG_HOST already exists in $ENV_FILE"
else
  echo "NEXT_PUBLIC_POSTHOG_HOST=$POSTHOG_HOST" >> "$ENV_FILE"
  echo "✅ Added NEXT_PUBLIC_POSTHOG_HOST"
fi

# Server-side PostHog (Needs manual input)
if grep -q "POSTHOG_PERSONAL_API_KEY" "$ENV_FILE"; then
  echo "✓ POSTHOG_PERSONAL_API_KEY already exists in $ENV_FILE"
else
  echo "" >> "$ENV_FILE"
  echo "# PostHog Analytics API (Server-side)" >> "$ENV_FILE"
  echo "# Get Personal API Key: https://us.i.posthog.com/settings/user-api-keys" >> "$ENV_FILE"
  echo "POSTHOG_PERSONAL_API_KEY=phx_your_personal_api_key_here" >> "$ENV_FILE"
  echo "⚠️  Added POSTHOG_PERSONAL_API_KEY placeholder - UPDATE THIS!"
fi

if grep -q "POSTHOG_PROJECT_ID" "$ENV_FILE"; then
  echo "✓ POSTHOG_PROJECT_ID already exists in $ENV_FILE"
else
  echo "POSTHOG_PROJECT_ID=21827" >> "$ENV_FILE"
  echo "✅ Added POSTHOG_PROJECT_ID"
fi

echo ""
echo "══════════════════════════════════════════════════════"
echo "✅ PostHog configuration updated in $ENV_FILE"
echo "══════════════════════════════════════════════════════"
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Get PostHog Personal API Key:"
echo "   https://us.i.posthog.com/settings/user-api-keys"
echo ""
echo "2. Update .env.local with your Personal API Key:"
echo "   Open $ENV_FILE and replace:"
echo "   POSTHOG_PERSONAL_API_KEY=phx_your_personal_api_key_here"
echo "   with your actual key"
echo ""
echo "3. Restart your dev server:"
echo "   npm run dev"
echo ""
echo "4. Test PostHog:"
echo "   node scripts/verify-posthog.js"
echo ""
