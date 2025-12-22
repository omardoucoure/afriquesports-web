#!/bin/bash
# Deploy fine-tuned Mistral model to Ollama on DigitalOcean server
# Usage: ./deploy_mistral_model.sh

set -e

SERVER="root@159.223.103.16"
MODEL_NAME="mistral-commentary"
MODEL_PATH="/mnt/volume_nyc1_01/models/mistral-commentary.gguf"
MODELFILE_PATH="$(dirname "$0")/../data-collection/Modelfile.mistral-commentary"

echo "=========================================="
echo "🚀 Deploying Mistral Model to Ollama"
echo "=========================================="
echo ""

# Step 1: Check if model file exists on server
echo "📋 Step 1: Checking if model file exists on server..."
ssh $SERVER "ls -lh $MODEL_PATH" || {
    echo "❌ ERROR: Model file not found at $MODEL_PATH"
    echo ""
    echo "Please ensure the fine-tuned GGUF model is uploaded to the server:"
    echo "  scp mistral-commentary.gguf $SERVER:$MODEL_PATH"
    exit 1
}

echo "✅ Model file found on server"
echo ""

# Step 2: Copy Modelfile to server
echo "📋 Step 2: Uploading Modelfile to server..."
scp $MODELFILE_PATH $SERVER:/root/afcon-agent-temp/Modelfile.mistral-commentary
echo "✅ Modelfile uploaded"
echo ""

# Step 3: Load model into Ollama
echo "📋 Step 3: Loading model into Ollama..."
ssh $SERVER "cd /root/afcon-agent-temp && ollama create $MODEL_NAME -f Modelfile.mistral-commentary" || {
    echo "❌ ERROR: Failed to create Ollama model"
    exit 1
}

echo "✅ Model loaded into Ollama"
echo ""

# Step 4: Verify model is available
echo "📋 Step 4: Verifying model availability..."
ssh $SERVER "ollama list | grep $MODEL_NAME" || {
    echo "❌ ERROR: Model not found in Ollama list"
    exit 1
}

echo "✅ Model verified in Ollama"
echo ""

# Step 5: Test generation
echo "📋 Step 5: Testing model generation..."
echo "Test prompt: 'Génère un commentaire pour minute 67, but de Mbappé'"
echo ""

ssh $SERVER "ollama run $MODEL_NAME \"Génère un commentaire court (30-60 mots) pour minute 67', type: but, contexte: Mbappé frappe du gauche\"" || {
    echo "❌ ERROR: Test generation failed"
    exit 1
}

echo ""
echo "✅ Model generation successful"
echo ""

echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Test the model with: ./test_mistral_quality.sh"
echo "2. Enable A/B testing with: ./enable_ab_testing.sh"
echo "3. Monitor metrics with: ./monitor_ab_test.sh"
echo ""
