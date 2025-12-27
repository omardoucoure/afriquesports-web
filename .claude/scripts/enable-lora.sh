#!/bin/bash
# Enable Multi-LoRA Support on vLLM Inference Pod
# Run this script to prepare the pod for LoRA adapters
#
# IMPORTANT: This only prepares directories.
# You must still update the RunPod launch parameters manually.

set -e

POD_ID="5x6ah8amw9oo9e"
POD_NAME="redundant_lavender_alligator"

echo "======================================"
echo "Multi-LoRA Setup for Afrique Sports"
echo "======================================"
echo ""
echo "Pod: $POD_NAME ($POD_ID)"
echo "Model: Qwen/Qwen2.5-VL-7B-Instruct"
echo "Adapters: 4 (fut-v1, madrid-v1, afrique-v1, cuisine-v1)"
echo ""

# Check if runpodctl is available
if ! command -v runpodctl &> /dev/null; then
    echo "❌ Error: runpodctl not found"
    echo "Install it with: brew install runpod/runpodctl/runpodctl"
    exit 1
fi

echo "Step 1: Checking pod status..."
POD_STATUS=$(runpodctl get pod $POD_ID 2>&1 | grep RUNNING || echo "NOT_RUNNING")

if [[ "$POD_STATUS" == "NOT_RUNNING" ]]; then
    echo "❌ Pod is not running. Please start it first in RunPod console."
    exit 1
fi

echo "✅ Pod is running"
echo ""

echo "Step 2: Creating directory structure on /workspace..."
echo ""
echo "NOTE: SSH access is limited on vLLM template."
echo "Please run these commands in the RunPod Web Terminal:"
echo ""
echo "----------------------------------------"
cat << 'EOF'
# Create LoRA adapter directories
mkdir -p /workspace/lora-adapters/fut-v1
mkdir -p /workspace/lora-adapters/madrid-v1
mkdir -p /workspace/lora-adapters/afrique-v1
mkdir -p /workspace/lora-adapters/cuisine-v1

# Create training data directories
mkdir -p /workspace/training-data/fut
mkdir -p /workspace/training-data/madrid
mkdir -p /workspace/training-data/afrique
mkdir -p /workspace/training-data/cuisine

# Create placeholder README files
echo "FUT LoRA adapter will be stored here" > /workspace/lora-adapters/fut-v1/README.md
echo "Madrid LoRA adapter will be stored here" > /workspace/lora-adapters/madrid-v1/README.md
echo "Afrique LoRA adapter will be stored here" > /workspace/lora-adapters/afrique-v1/README.md
echo "Cuisine LoRA adapter will be stored here" > /workspace/lora-adapters/cuisine-v1/README.md

# Verify structure
ls -la /workspace/lora-adapters/
ls -la /workspace/training-data/
EOF
echo "----------------------------------------"
echo ""

echo "Step 3: Update RunPod Launch Parameters"
echo ""
echo "Go to: https://www.runpod.io/console/pods"
echo "1. Click on pod: $POD_NAME"
echo "2. Stop the pod"
echo "3. Click 'Edit' or 'Edit Template'"
echo "4. Find 'Docker Command' or 'Container Start Command'"
echo "5. Replace with:"
echo ""
echo "----------------------------------------"
cat << 'EOF'
--model Qwen/Qwen2.5-VL-7B-Instruct \
--tensor-parallel-size 1 \
--dtype bfloat16 \
--gpu-memory-utilization 0.90 \
--max-model-len 32768 \
--host 0.0.0.0 \
--api-key sk-1234 \
--enable-auto-tool-choice \
--tool-call-parser hermes \
--limit-mm-per-prompt '{"image":4,"video":1}' \
--allowed-local-media-path /workspace \
--enable-lora \
--max-loras 4 \
--max-lora-rank 64 \
--lora-modules fut-v1=/workspace/lora-adapters/fut-v1 \
--lora-modules madrid-v1=/workspace/lora-adapters/madrid-v1 \
--lora-modules afrique-v1=/workspace/lora-adapters/afrique-v1 \
--lora-modules cuisine-v1=/workspace/lora-adapters/cuisine-v1
EOF
echo "----------------------------------------"
echo ""
echo "6. Save and restart the pod"
echo ""

echo "Step 4: Verify LoRA Support"
echo ""
echo "After pod restarts, run this command to verify:"
echo ""
echo "curl -s https://$POD_ID-8000.proxy.runpod.net/v1/models \\"
echo "  -H \"Authorization: Bearer sk-1234\" | python3 -m json.tool"
echo ""
echo "You should see 5 models:"
echo "  - Qwen/Qwen2.5-VL-7B-Instruct (base)"
echo "  - fut-v1"
echo "  - madrid-v1"
echo "  - afrique-v1"
echo "  - cuisine-v1"
echo ""

echo "======================================"
echo "Setup Instructions Displayed"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Create directories in RunPod Web Terminal (commands above)"
echo "2. Update launch parameters in RunPod console"
echo "3. Restart pod"
echo "4. Verify with curl command above"
echo "5. Start training adapters (when you're ready)"
echo ""
echo "For detailed instructions, see:"
echo "  .claude/config/lora-setup.md"
echo ""
