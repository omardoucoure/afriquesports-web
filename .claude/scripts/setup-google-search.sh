#!/bin/bash
# Setup Google Custom Search API for Pre-Match Analysis

echo "========================================"
echo "Google Custom Search API Setup"
echo "========================================"
echo ""

# API Key (provided)
GOOGLE_API_KEY="AIzaSyAMp1MfZiwDoPo8WTkxnyCMky46Cy69pws"

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "Creating .env.local file..."
    touch .env.local
fi

# Check if API key already exists
if grep -q "GOOGLE_SEARCH_API_KEY" .env.local; then
    echo "⚠️  GOOGLE_SEARCH_API_KEY already exists in .env.local"
    echo "Updating it..."
    # Remove old line and add new one
    grep -v "GOOGLE_SEARCH_API_KEY" .env.local > .env.local.tmp
    mv .env.local.tmp .env.local
fi

# Add API key
echo "GOOGLE_SEARCH_API_KEY=$GOOGLE_API_KEY" >> .env.local
echo "✅ Added GOOGLE_SEARCH_API_KEY to .env.local"
echo ""

# Check for Custom Search Engine ID
if grep -q "GOOGLE_SEARCH_ENGINE_ID" .env.local; then
    EXISTING_CX=$(grep "GOOGLE_SEARCH_ENGINE_ID" .env.local | cut -d'=' -f2)
    echo "✅ Custom Search Engine ID already configured: $EXISTING_CX"
    echo ""
else
    echo "⚠️  GOOGLE_SEARCH_ENGINE_ID not configured yet"
    echo ""
    echo "You need to create a Custom Search Engine:"
    echo ""
    echo "1. Go to: https://programmablesearchengine.google.com/"
    echo "2. Click 'Add' or 'New search engine'"
    echo "3. Configure:"
    echo "   - Name: Afrique Sports Team Search"
    echo "   - Search the entire web: YES"
    echo "4. Click 'Create'"
    echo "5. Copy the Search Engine ID (looks like: a12b34c56d78e90f1)"
    echo ""
    echo "Then run:"
    echo "  echo 'GOOGLE_SEARCH_ENGINE_ID=your-cx-id-here' >> .env.local"
    echo ""
fi

echo "========================================"
echo "Current Configuration"
echo "========================================"
echo ""
echo "API Key: AIzaSy...6Cy69pws (configured)"
echo ""

if grep -q "GOOGLE_SEARCH_ENGINE_ID" .env.local; then
    EXISTING_CX=$(grep "GOOGLE_SEARCH_ENGINE_ID" .env.local | cut -d'=' -f2)
    echo "Search Engine ID: $EXISTING_CX (configured)"
    echo ""
    echo "✅ All set! Web search is ready to use."
else
    echo "Search Engine ID: NOT SET"
    echo ""
    echo "❌ Please create Custom Search Engine to enable web search."
fi

echo ""
echo "Test web search with:"
echo "  node scripts/ai/generate-prematch-with-search.js 732149 \"Benin\" \"Botswana\""
echo ""
