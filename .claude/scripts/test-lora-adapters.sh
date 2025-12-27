#!/bin/bash
# Test Multi-LoRA Adapters
# Verify each domain adapter is working correctly

set -e

POD_ID="5x6ah8amw9oo9e"
API_URL="https://$POD_ID-8000.proxy.runpod.net/v1"
API_KEY="sk-1234"

echo "======================================"
echo "Testing Multi-LoRA Adapters"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test adapter
test_adapter() {
    local adapter_name=$1
    local test_prompt=$2
    local system_prompt=$3

    echo -e "${YELLOW}Testing: $adapter_name${NC}"
    echo "Prompt: $test_prompt"
    echo ""

    response=$(curl -s -X POST "$API_URL/chat/completions" \
        -H "Authorization: Bearer $API_KEY" \
        -H "Content-Type: application/json" \
        -d "{
            \"model\": \"$adapter_name\",
            \"messages\": [
                {\"role\": \"system\", \"content\": \"$system_prompt\"},
                {\"role\": \"user\", \"content\": \"$test_prompt\"}
            ],
            \"max_tokens\": 150,
            \"temperature\": 0.7
        }" 2>&1)

    # Check if response contains error
    if echo "$response" | grep -q '"error"'; then
        echo -e "${RED}❌ FAILED${NC}"
        echo "$response" | python3 -m json.tool 2>&1 || echo "$response"
        echo ""
        return 1
    else
        echo -e "${GREEN}✅ SUCCESS${NC}"
        # Extract and display the content
        content=$(echo "$response" | python3 -c "import sys, json; r=json.load(sys.stdin); print(r['choices'][0]['message']['content'])" 2>&1)
        echo "Response: $content"
        echo ""
        return 0
    fi
}

echo "Step 1: Check available models..."
echo ""

models=$(curl -s "$API_URL/models" \
    -H "Authorization: Bearer $API_KEY" 2>&1)

if echo "$models" | grep -q '"error"'; then
    echo -e "${RED}❌ API Error${NC}"
    echo "$models"
    exit 1
fi

echo "Available models:"
echo "$models" | python3 -m json.tool | grep '"id"' | sed 's/.*"id": "\(.*\)".*/  - \1/'
echo ""

# Check if LoRA adapters are present
if echo "$models" | grep -q "fut-v1"; then
    LORA_ENABLED=true
    echo -e "${GREEN}✅ LoRA adapters detected${NC}"
else
    LORA_ENABLED=false
    echo -e "${YELLOW}⚠️  LoRA adapters not detected${NC}"
    echo "Testing base model only..."
fi
echo ""

echo "======================================"
echo "Step 2: Testing Base Model"
echo "======================================"
echo ""

test_adapter \
    "Qwen/Qwen2.5-VL-7B-Instruct" \
    "Say hello in one sentence" \
    "You are a helpful assistant."

if [ "$LORA_ENABLED" = false ]; then
    echo ""
    echo "======================================"
    echo "LoRA adapters not enabled yet"
    echo "======================================"
    echo ""
    echo "To enable LoRA support:"
    echo "  1. Run: .claude/scripts/enable-lora.sh"
    echo "  2. Follow the instructions to update launch parameters"
    echo "  3. Restart the pod"
    echo "  4. Run this test script again"
    echo ""
    exit 0
fi

echo "======================================"
echo "Step 3: Testing Domain Adapters"
echo "======================================"
echo ""

# Test FUT adapter
test_adapter \
    "fut-v1" \
    "What are the best budget Premier League midfielders?" \
    "You are an expert FIFA Ultimate Team advisor helping players build competitive squads."

# Test Madrid adapter
test_adapter \
    "madrid-v1" \
    "Analiza el rendimiento reciente del Real Madrid" \
    "Eres un experto analista deportivo especializado en el Real Madrid."

# Test Afrique adapter
test_adapter \
    "afrique-v1" \
    "Qui sont les favoris pour gagner la CAN 2025?" \
    "Tu es un expert du football africain couvrant la CAN 2025."

# Test Cuisine adapter
test_adapter \
    "cuisine-v1" \
    "Comment préparer un bon thiéboudienne?" \
    "Tu es un expert de la cuisine africaine, spécialisé dans les recettes traditionnelles."

echo "======================================"
echo "Test Summary"
echo "======================================"
echo ""
echo "All adapter tests completed."
echo ""
echo "Next steps:"
echo "  - If any tests failed, check adapter training status"
echo "  - Review pod logs for errors"
echo "  - Verify adapter files exist in /workspace/lora-adapters/"
echo ""
echo "API Documentation: https://$POD_ID-8000.proxy.runpod.net/docs"
echo ""
