#!/bin/bash
# Generate pre-match analysis for a specific match using fine-tuned AFCON model

# Configuration
MATCH_ID="${1:-732149}"
VLLM_ENDPOINT="https://qbjo7w9adplhia-8000.proxy.runpod.net/v1"
VLLM_API_KEY="sk-1234"
VLLM_MODEL="oxmo88/Qwen2.5-VL-7B-AFCON2025"
SITE_URL="${SITE_URL:-https://www.afriquesports.net}"
WEBHOOK_SECRET="${AI_AGENT_WEBHOOK_SECRET:-your-webhook-secret}"

if [ -z "$1" ]; then
    echo "Usage: $0 <match_id>"
    echo "Example: $0 732149"
    echo ""
    echo "Generating for default match ID: 732149"
fi

echo "========================================"
echo "Generating Pre-Match Analysis"
echo "========================================"
echo "Match ID: $MATCH_ID"
echo "Model: $VLLM_MODEL"
echo ""

# Fetch match details from ESPN API
echo "1. Fetching match details..."
MATCH_DATA=$(curl -s --compressed "https://site.api.espn.com/apis/site/v2/sports/soccer/afr.nations_qual/summary?event=$MATCH_ID")

if [ -z "$MATCH_DATA" ]; then
    echo "   ❌ Failed to fetch match data from ESPN"
    exit 1
fi

# Extract team names
HOME_TEAM=$(echo "$MATCH_DATA" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['boxscore']['teams'][0]['team']['displayName'])" 2>/dev/null)
AWAY_TEAM=$(echo "$MATCH_DATA" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['boxscore']['teams'][1]['team']['displayName'])" 2>/dev/null)
MATCH_DATE=$(echo "$MATCH_DATA" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['header']['competitions'][0]['date'])" 2>/dev/null)

echo "   Home: $HOME_TEAM"
echo "   Away: $AWAY_TEAM"
echo "   Date: $MATCH_DATE"
echo ""

# Generate pre-match analysis using vLLM
echo "2. Generating pre-match analysis with AI..."

# System prompt for pre-match analysis
SYSTEM_PROMPT="Tu es un expert en analyse tactique de football africain, spécialisé dans la CAN. Tu dois produire une analyse pré-match complète en français pour Afrique Sports."

# User prompt
USER_PROMPT="Génère une analyse pré-match complète pour le match de CAN entre $HOME_TEAM et $AWAY_TEAM.

Structure EXACTE requise (utilise ces sections):

**Face-à-face historique:**
[Analyse des confrontations passées entre ces deux équipes]

**Forme récente:**
[Analyse de la forme des deux équipes lors des 5 derniers matchs]

**Joueurs clés:**
[Liste des joueurs importants de chaque équipe et leur impact]

**Aperçu tactique:**
[Analyse des systèmes de jeu, forces et faiblesses tactiques]

**Pronostic:**
[Prédiction raisonnée du résultat avec score probable]

Sois précis, professionnel et informatif."

# Call vLLM API
ANALYSIS_RESPONSE=$(curl -s "$VLLM_ENDPOINT/chat/completions" \
  -H "Authorization: Bearer $VLLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"model\": \"$VLLM_MODEL\",
    \"messages\": [
      {
        \"role\": \"system\",
        \"content\": $(echo "$SYSTEM_PROMPT" | python3 -c "import sys, json; print(json.dumps(sys.stdin.read().strip()))")
      },
      {
        \"role\": \"user\",
        \"content\": $(echo "$USER_PROMPT" | python3 -c "import sys, json; print(json.dumps(sys.stdin.read().strip()))")
      }
    ],
    \"max_tokens\": 1500,
    \"temperature\": 0.7
  }")

# Extract the generated analysis
FULL_ANALYSIS=$(echo "$ANALYSIS_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['choices'][0]['message']['content'])" 2>/dev/null)

if [ -z "$FULL_ANALYSIS" ]; then
    echo "   ❌ Failed to generate analysis"
    echo "   Response: $ANALYSIS_RESPONSE"
    exit 1
fi

echo "   ✅ Analysis generated (${#FULL_ANALYSIS} characters)"
echo ""

# Parse the analysis into sections
HEAD_TO_HEAD=$(echo "$FULL_ANALYSIS" | python3 -c "
import sys, re
text = sys.stdin.read()
match = re.search(r'\*\*Face-à-face[^:]*:\*\*\s*(.*?)(?=\*\*|$)', text, re.DOTALL | re.IGNORECASE)
print(match.group(1).strip() if match else '')
" 2>/dev/null)

RECENT_FORM=$(echo "$FULL_ANALYSIS" | python3 -c "
import sys, re
text = sys.stdin.read()
match = re.search(r'\*\*Forme[^:]*:\*\*\s*(.*?)(?=\*\*|$)', text, re.DOTALL | re.IGNORECASE)
print(match.group(1).strip() if match else '')
" 2>/dev/null)

KEY_PLAYERS=$(echo "$FULL_ANALYSIS" | python3 -c "
import sys, re
text = sys.stdin.read()
match = re.search(r'\*\*Joueurs[^:]*:\*\*\s*(.*?)(?=\*\*|$)', text, re.DOTALL | re.IGNORECASE)
print(match.group(1).strip() if match else '')
" 2>/dev/null)

TACTICAL=$(echo "$FULL_ANALYSIS" | python3 -c "
import sys, re
text = sys.stdin.read()
match = re.search(r'\*\*Aperçu[^:]*:\*\*\s*(.*?)(?=\*\*|$)', text, re.DOTALL | re.IGNORECASE)
print(match.group(1).strip() if match else '')
" 2>/dev/null)

PREDICTION=$(echo "$FULL_ANALYSIS" | python3 -c "
import sys, re
text = sys.stdin.read()
match = re.search(r'\*\*Pronostic[^:]*:\*\*\s*(.*?)(?=\*\*|$)', text, re.DOTALL | re.IGNORECASE)
print(match.group(1).strip() if match else '')
" 2>/dev/null)

# If parsing failed, use the full analysis as tactical preview
if [ -z "$TACTICAL" ]; then
    TACTICAL="$FULL_ANALYSIS"
fi

echo "3. Posting analysis to database..."

# Post to API
API_RESPONSE=$(curl -s -X POST "$SITE_URL/api/can2025/prematch-analysis" \
  -H "x-webhook-secret: $WEBHOOK_SECRET" \
  -H "Content-Type: application/json" \
  -d "{
    \"match_id\": \"$MATCH_ID\",
    \"locale\": \"fr\",
    \"home_team\": $(echo "$HOME_TEAM" | python3 -c "import sys, json; print(json.dumps(sys.stdin.read().strip()))"),
    \"away_team\": $(echo "$AWAY_TEAM" | python3 -c "import sys, json; print(json.dumps(sys.stdin.read().strip()))"),
    \"competition\": \"CAN\",
    \"head_to_head\": $(echo "$HEAD_TO_HEAD" | python3 -c "import sys, json; print(json.dumps(sys.stdin.read().strip()))"),
    \"recent_form\": $(echo "$RECENT_FORM" | python3 -c "import sys, json; print(json.dumps(sys.stdin.read().strip()))"),
    \"key_players\": $(echo "$KEY_PLAYERS" | python3 -c "import sys, json; print(json.dumps(sys.stdin.read().strip()))"),
    \"tactical_preview\": $(echo "$TACTICAL" | python3 -c "import sys, json; print(json.dumps(sys.stdin.read().strip()))"),
    \"prediction\": $(echo "$PREDICTION" | python3 -c "import sys, json; print(json.dumps(sys.stdin.read().strip()))"),
    \"confidence_score\": 0.85
  }")

# Check if successful
SUCCESS=$(echo "$API_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('success', False))" 2>/dev/null)

if [ "$SUCCESS" = "True" ]; then
    echo "   ✅ Pre-match analysis published successfully!"
    echo ""
    echo "========================================"
    echo "✅ COMPLETED"
    echo "========================================"
    echo ""
    echo "View at: $SITE_URL/can-2025/match/$MATCH_ID"
    echo ""
    echo "Analysis sections:"
    echo "  - Face-à-face: ${#HEAD_TO_HEAD} chars"
    echo "  - Forme récente: ${#RECENT_FORM} chars"
    echo "  - Joueurs clés: ${#KEY_PLAYERS} chars"
    echo "  - Aperçu tactique: ${#TACTICAL} chars"
    echo "  - Pronostic: ${#PREDICTION} chars"
else
    echo "   ❌ Failed to publish analysis"
    echo "   Response: $API_RESPONSE"
    exit 1
fi
