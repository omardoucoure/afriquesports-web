#!/bin/bash
# RunPod GPU Setup Script - Llama 3.1 70B with vLLM
# Run this script after connecting to your RunPod pod
# Connection: ssh root@194.68.245.75 -p 22061

set -e

echo "=========================================="
echo "🚀 RunPod GPU Setup for Autonomous Agent"
echo "=========================================="
echo ""

# Check GPU availability
echo "📊 Checking GPU availability..."
nvidia-smi
echo ""

# Update system
echo "📦 Updating system packages..."
apt-get update
apt-get install -y git curl wget
echo ""

# Install Python dependencies
echo "🐍 Installing Python dependencies..."
pip install --upgrade pip
pip install vllm==0.6.0
pip install torch==2.1.0
pip install transformers
pip install huggingface-hub
echo ""

# Create workspace
echo "📁 Creating workspace..."
mkdir -p /workspace/models
mkdir -p /workspace/logs
cd /workspace
echo ""

# Login to Hugging Face (requires token)
echo "🔐 Hugging Face Login Required"
echo "You'll need a Hugging Face token with access to Llama models"
echo "Get one at: https://huggingface.co/settings/tokens"
echo ""
echo "Enter your Hugging Face token:"
read -s HF_TOKEN
huggingface-cli login --token $HF_TOKEN
echo ""

# Download Llama 3.1 70B Instruct
echo "⬇️  Downloading Llama 3.1 70B Instruct..."
echo "This will take 15-30 minutes (140GB download)"
echo ""

# Use quantized version to save space and memory
huggingface-cli download neuralmagic/Meta-Llama-3.1-70B-Instruct-quantized.w4a16 \
    --local-dir /workspace/models/llama-3.1-70b-q4 \
    --local-dir-use-symlinks False

echo ""
echo "✅ Model downloaded successfully!"
echo ""

# Create vLLM startup script
echo "📝 Creating vLLM startup script..."
cat > /workspace/start_vllm.sh << 'VLLM_SCRIPT'
#!/bin/bash
# Start vLLM server with Llama 3.1 70B

export MODEL_PATH="/workspace/models/llama-3.1-70b-q4"
export API_KEY="afrique-sports-local-key-$(date +%s)"

echo "Starting vLLM server..."
echo "Model: $MODEL_PATH"
echo "API Key: $API_KEY"
echo ""

python -m vllm.entrypoints.openai.api_server \
    --model $MODEL_PATH \
    --dtype auto \
    --api-key $API_KEY \
    --port 8000 \
    --host 0.0.0.0 \
    --max-model-len 8192 \
    --gpu-memory-utilization 0.90 \
    --served-model-name llama-3.1-70b \
    --trust-remote-code \
    2>&1 | tee /workspace/logs/vllm.log
VLLM_SCRIPT

chmod +x /workspace/start_vllm.sh
echo ""

# Create test script
echo "📝 Creating test script..."
cat > /workspace/test_inference.sh << 'TEST_SCRIPT'
#!/bin/bash
# Test vLLM inference

API_KEY=$(grep "api-key" /workspace/start_vllm.sh | cut -d'"' -f2)

echo "Testing French commentary generation..."
echo ""

curl http://localhost:8000/v1/completions \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $API_KEY" \
    -d '{
        "model": "llama-3.1-70b",
        "prompt": "Génère un commentaire de match de football: Mali vs Zambie, but à la 23e minute par Bissouma. Le Mali mène 1-0. Commentaire vif et émotionnel (30-70 mots):",
        "max_tokens": 150,
        "temperature": 0.85,
        "top_p": 0.95
    }' | jq '.choices[0].text'

echo ""
echo "✅ Test complete!"
TEST_SCRIPT

chmod +x /workspace/test_inference.sh
echo ""

echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Start vLLM server:"
echo "   cd /workspace"
echo "   ./start_vllm.sh"
echo ""
echo "2. In a new terminal, test inference:"
echo "   ./test_inference.sh"
echo ""
echo "3. Get your pod's public IP for DigitalOcean agent:"
echo "   curl ifconfig.me"
echo ""
echo "4. Update DigitalOcean agent .env with:"
echo "   VLLM_BASE_URL=http://<pod-ip>:8000/v1"
echo "   VLLM_API_KEY=<shown when you start vllm>"
echo ""
echo "Cost: $0.41/hour while running"
echo "Remember to stop the pod when not in use!"
echo ""
