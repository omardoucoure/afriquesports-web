#!/bin/bash
# Test merged AFCON model deployment on vLLM

API_URL="https://qbjo7w9adplhia-8000.proxy.runpod.net/v1"
API_KEY="sk-1234"

echo "========================================"
echo "Testing Merged AFCON Model"
echo "Model: oxmo88/Qwen2.5-VL-7B-AFCON2025"
echo "========================================"
echo ""

echo "1. Checking vLLM server status..."
MODELS=$(curl -s --max-time 10 "$API_URL/models" -H "Authorization: Bearer $API_KEY")

if [ -z "$MODELS" ]; then
    echo "   ❌ Server not responding. Is the pod running?"
    echo ""
    echo "   Check pod status at: https://www.runpod.io/console/pods"
    echo "   Pod ID: qbjo7w9adplhia"
    exit 1
fi

echo "   ✅ Server is running"
echo ""

echo "2. Checking loaded model..."
MODEL_ID=$(echo "$MODELS" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['data'][0]['id'])" 2>/dev/null)
echo "   Model ID: $MODEL_ID"

if [[ "$MODEL_ID" != "oxmo88/Qwen2.5-VL-7B-AFCON2025" ]]; then
    echo "   ⚠️  WARNING: Expected 'oxmo88/Qwen2.5-VL-7B-AFCON2025' but got '$MODEL_ID'"
fi
echo ""

echo "3. Testing AFCON commentary generation..."
RESPONSE=$(curl -s --max-time 30 "$API_URL/chat/completions" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "oxmo88/Qwen2.5-VL-7B-AFCON2025",
    "messages": [
      {
        "role": "system",
        "content": "Tu es un commentateur sportif professionnel pour Afrique Sports."
      },
      {
        "role": "user",
        "content": "Génère un commentaire pour: Minute 23'\'' - goal - Tunisie - But de Hannibal Mejbri"
      }
    ],
    "max_tokens": 150,
    "temperature": 0.7
  }')

COMMENTARY=$(echo "$RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['choices'][0]['message']['content'])" 2>/dev/null)

if [ -z "$COMMENTARY" ]; then
    echo "   ❌ ERROR: No response generated"
    echo ""
    echo "   Raw response:"
    echo "$RESPONSE" | python3 -m json.tool
    exit 1
fi

echo "   ✅ Generated commentary:"
echo ""
echo "   \"$COMMENTARY\""
echo ""

echo "========================================"
echo "✅ DEPLOYMENT SUCCESSFUL!"
echo "========================================"
echo ""
echo "The fine-tuned AFCON model is working correctly."
echo ""
echo "API Endpoint: $API_URL"
echo "Model: oxmo88/Qwen2.5-VL-7B-AFCON2025"
echo ""
echo "To use in your application:"
echo "  curl $API_URL/chat/completions \\"
echo "    -H \"Authorization: Bearer sk-1234\" \\"
echo "    -H \"Content-Type: application/json\" \\"
echo "    -d '{\"model\": \"oxmo88/Qwen2.5-VL-7B-AFCON2025\", ...}'"
echo ""
