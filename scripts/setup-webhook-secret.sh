#!/bin/bash

###############################################################################
# Setup Webhook Secret for Live Commentary Agent
###############################################################################

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

WEBHOOK_SECRET="53d94589c60800904ed55f45cddb8ef0f607fa7059da81db2a0453895a7946fd"
ENV_FILE=".env.local"

echo -e "${BLUE}🔐 Setting up webhook secret for live commentary...${NC}\n"

# Check if .env.local exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}⚠️  $ENV_FILE not found, creating it...${NC}"
    touch "$ENV_FILE"
fi

# Check if secret already exists
if grep -q "AI_AGENT_WEBHOOK_SECRET" "$ENV_FILE"; then
    echo -e "${YELLOW}⚠️  AI_AGENT_WEBHOOK_SECRET already exists in $ENV_FILE${NC}"
    echo -e "${YELLOW}Updating it...${NC}\n"

    # Remove old secret
    grep -v "AI_AGENT_WEBHOOK_SECRET" "$ENV_FILE" > "$ENV_FILE.tmp"
    mv "$ENV_FILE.tmp" "$ENV_FILE"
fi

# Add new secret
echo "" >> "$ENV_FILE"
echo "# AI Agent Webhook Secret for Live Commentary" >> "$ENV_FILE"
echo "AI_AGENT_WEBHOOK_SECRET=$WEBHOOK_SECRET" >> "$ENV_FILE"

echo -e "${GREEN}✅ Webhook secret added to $ENV_FILE${NC}\n"
echo -e "${BLUE}Secret: $WEBHOOK_SECRET${NC}\n"

echo -e "${YELLOW}📝 Next steps:${NC}"
echo -e "   1. Restart your Next.js dev server (if running)"
echo -e "   2. Run: ${BLUE}npm run dev${NC}"
echo -e "   3. Test posting commentary: ${BLUE}./scripts/test-live-match-732138.sh${NC}\n"

echo -e "${GREEN}✅ Setup complete!${NC}\n"
