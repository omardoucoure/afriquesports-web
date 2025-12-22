#!/bin/bash
# Load Q4_K_M Mistral model into Ollama
# Run this after requantize_to_q4.sh completes

set -e

SERVER="root@159.223.103.16"
MODEL_NAME="mistral-commentary"

echo "=========================================="
echo "📦 Loading Q4 Mistral into Ollama"
echo "=========================================="
echo ""

# Create Modelfile for Q4 version
cat > /tmp/Modelfile.mistral-q4 << 'EOF'
FROM /mnt/volume_nyc1_01/models/mistral-commentary-q4.gguf

PARAMETER temperature 0.9
PARAMETER top_p 0.95
PARAMETER top_k 50
PARAMETER repeat_penalty 1.15
PARAMETER num_predict 120

SYSTEM Tu es un commentateur sportif professionnel pour Afrique Sports, spécialisé dans le football africain. Ton style s'inspire de L'Équipe: vif, précis, émotionnel mais jamais sensationnaliste. Tu varies ton vocabulaire et ta structure de phrases pour éviter la répétition.
EOF

echo "📋 Step 1: Uploading Modelfile..."
scp /tmp/Modelfile.mistral-q4 $SERVER:/root/afcon-agent-temp/
echo "✅ Modelfile uploaded"
echo ""

echo "📋 Step 2: Removing old 14GB model from Ollama..."
ssh $SERVER "ollama rm mistral-commentary 2>/dev/null || echo 'Old model not found (OK)'"
echo "✅ Old model removed"
echo ""

echo "📋 Step 3: Loading Q4 model into Ollama..."
ssh $SERVER "cd /root/afcon-agent-temp && ollama create mistral-commentary -f Modelfile.mistral-q4"
echo "✅ Q4 model loaded"
echo ""

echo "📋 Step 4: Verifying model..."
ssh $SERVER "ollama list | grep mistral-commentary"
echo "✅ Model verified"
echo ""

echo "📋 Step 5: Testing generation..."
echo "Test prompt: 'Génère un commentaire pour minute 23'"
echo ""

ssh $SERVER "ollama run mistral-commentary 'Génère un commentaire court (30-60 mots) pour minute 23, type: but, contexte: Mbappé frappe du gauche dans la lucarne'"

echo ""
echo "=========================================="
echo "✅ Q4 Model Loaded Successfully!"
echo "=========================================="
echo ""
echo "Model info:"
ssh $SERVER "ollama list | grep mistral"
echo ""
echo "Next steps:"
echo "1. Update configuration: ./update_production_config.sh"
echo "2. Test with sample commentary"
echo "3. Monitor during next live match"
echo ""
echo "Optional: Remove old 14GB file to save space:"
echo "  ssh root@159.223.103.16 'rm /mnt/volume_nyc1_01/models/mistral-commentary.gguf'"
echo ""
