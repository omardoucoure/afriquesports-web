#!/bin/bash

###############################################################################
# Quick Test: Post One Commentary Event to Match 732138
###############################################################################

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🧪 Testing Live Commentary API${NC}\n"

# Check if webhook secret is set
if [ -z "$AI_AGENT_WEBHOOK_SECRET" ]; then
    echo -e "${YELLOW}⚠️  AI_AGENT_WEBHOOK_SECRET not set in environment${NC}"
    echo -e "${YELLOW}Generating a test secret...${NC}\n"

    # Generate a test secret
    TEST_SECRET=$(openssl rand -hex 16)
    export AI_AGENT_WEBHOOK_SECRET=$TEST_SECRET

    echo -e "${GREEN}✅ Generated test secret: ${TEST_SECRET}${NC}"
    echo -e "${YELLOW}📝 Add this to your .env.local file:${NC}"
    echo -e "${BLUE}AI_AGENT_WEBHOOK_SECRET=${TEST_SECRET}${NC}\n"

    echo -e "${YELLOW}Press Enter to continue with test posting...${NC}"
    read
fi

echo -e "${BLUE}🎯 Posting test commentary event...${NC}\n"

RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
    -X POST "http://localhost:3000/api/can2025/live-commentary" \
    -H "Content-Type: application/json" \
    -H "x-webhook-secret: ${AI_AGENT_WEBHOOK_SECRET}" \
    -d '{
  "match_id": "732138",
  "event_id": "732138_test_' $(date +%s) '",
  "time": "1'"'"'",
  "time_seconds": 60,
  "locale": "fr",
  "text": "🧪 Test: Le match débute à Fès ! Nigeria affronte la Tanzanie pour la CAN 2025.",
  "type": "matchStart",
  "icon": "⚽",
  "is_scoring": false,
  "confidence": 0.95
}')

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

echo -e "${BLUE}Response:${NC}"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "201" ]; then
    echo -e "${GREEN}✅ SUCCESS! Commentary posted${NC}\n"
    echo -e "${BLUE}🌐 View match at:${NC}"
    echo -e "   http://localhost:3000/can-2025/match/732138\n"
    echo -e "${YELLOW}💡 Wait 15 seconds for ISR revalidation, then refresh${NC}\n"
elif [ "$HTTP_STATUS" = "401" ]; then
    echo -e "${RED}❌ UNAUTHORIZED: Webhook secret mismatch${NC}"
    echo -e "${YELLOW}Make sure AI_AGENT_WEBHOOK_SECRET in .env.local matches: ${AI_AGENT_WEBHOOK_SECRET}${NC}\n"
elif [ "$HTTP_STATUS" = "409" ]; then
    echo -e "${YELLOW}⚠️  Event already exists (duplicate)${NC}\n"
else
    echo -e "${RED}❌ FAILED: HTTP ${HTTP_STATUS}${NC}\n"
fi
