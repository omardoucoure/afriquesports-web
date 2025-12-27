#!/bin/bash
# Test AFCON adapter deployment on vLLM

API_URL="https://5x6ah8amw9oo9e-8000.proxy.runpod.net/v1"
API_KEY="sk-1234"

echo "========================================"
echo "Testing AFCON Adapter Deployment"
echo "========================================"
echo ""

# Check if server is ready
echo "1. Checking vLLM server status..."
MODELS=$(curl -s --max-time 10 "$API_URL/models" -H "Authorization: Bearer $API_KEY")

if [ -z "$MODELS" ]; then
    echo "   ❌ Server not responding. Is the pod running?"
    echo ""
    echo "   Check pod status at: https://www.runpod.io/console/pods"
    echo "   Pod ID: 5x6ah8amw9oo9e"
    exit 1
fi

echo "   ✅ Server is running"
echo ""

# Check available models
echo "2. Checking available models..."
echo "$MODELS" | python3 -m json.tool 2>/dev/null | grep '"id"' || echo "$MODELS"
echo ""

# Test base model
echo "3. Testing BASE MODEL (no fine-tuning)..."
BASE_RESPONSE=$(curl -s --max-time 30 "$API_URL/chat/completions" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "Qwen/Qwen2.5-VL-7B-Instruct",
    "messages": [
      {
        "role": "system",
        "content": "Tu es un commentateur sportif professionnel pour Afrique Sports."
      },
      {
        "role": "user",
        "content": "Génère un commentaire pour: Minute 23' - goal - Tunisie - But de Hannibal Mejbri"
      }
    ],
    "max_tokens": 150,
    "temperature": 0.7
  }')

BASE_TEXT=$(echo "$BASE_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['choices'][0]['message']['content'])" 2>/dev/null || echo "Error parsing response")
echo "   Response: $BASE_TEXT"
echo ""

# Test fine-tuned adapter
echo "4. Testing FINE-TUNED ADAPTER (afrique-v1)..."
ADAPTER_RESPONSE=$(curl -s --max-time 30 "$API_URL/chat/completions" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "afrique-v1",
    "messages": [
      {
        "role": "system",
        "content": "Tu es un commentateur sportif professionnel pour Afrique Sports."
      },
      {
        "role": "user",
        "content": "Génère un commentaire pour: Minute 23' - goal - Tunisie - But de Hannibal Mejbri"
      }
    ],
    "max_tokens": 150,
    "temperature": 0.7
  }')

ADAPTER_TEXT=$(echo "$ADAPTER_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['choices'][0]['message']['content'])" 2>/dev/null || echo "Error: Adapter not loaded or failed")
echo "   Response: $ADAPTER_TEXT"
echo ""

# Summary
echo "========================================"
echo "COMPARISON"
echo "========================================"
echo ""
echo "🔵 BASE MODEL:"
echo "   $BASE_TEXT"
echo ""
echo "🟢 FINE-TUNED (afrique-v1):"
echo "   $ADAPTER_TEXT"
echo ""

# Check if adapter response is different and better
if [[ "$ADAPTER_TEXT" == *"Error"* ]]; then
    echo "❌ ADAPTER NOT WORKING"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Check vLLM logs in RunPod console"
    echo "  2. Verify --enable-lora flag is set"
    echo "  3. Verify --lora-modules parameter is correct"
    echo "  4. Check Hugging Face repo is public: https://huggingface.co/oxmo88/afrique-sports-afcon2025-adapter"
elif [[ ${#ADAPTER_TEXT} -lt ${#BASE_TEXT} ]] && [[ "$ADAPTER_TEXT" != *"Error"* ]]; then
    echo "✅ ADAPTER IS WORKING!"
    echo "   Fine-tuned response is more concise (expected behavior)"
else
    echo "⚠️ ADAPTER LOADED but response similar to base model"
    echo "   This may be normal - try multiple requests to see the difference"
fi

echo ""
echo "========================================"
