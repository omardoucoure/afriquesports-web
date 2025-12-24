#!/bin/bash
set -e

echo "🚀 Starting vLLM on RunPod"
echo "========================="
echo ""

# Read configuration
CONFIG=".claude/config/infrastructure.yaml"
RUNPOD_IP=$(grep -A 10 "^runpod:" "$CONFIG" | grep "ip:" | awk '{print $2}')
SSH_PORT=$(grep -A 10 "^runpod:" "$CONFIG" | grep "ssh_port:" | awk '{print $2}')
MODEL=$(grep -A 15 "vllm:" "$CONFIG" | grep "model:" | awk '{print $2}')

echo "Connecting to RunPod: $RUNPOD_IP:$SSH_PORT"
echo "Model: $MODEL"
echo ""

# SSH and start vLLM
ssh -p "$SSH_PORT" root@"$RUNPOD_IP" << 'ENDSSH'
# Check if already running
if ps aux | grep vllm | grep -v grep; then
    echo "⚠️  vLLM is already running"
    exit 0
fi

# Start vLLM
cd /workspace
nohup python -m vllm.entrypoints.openai.api_server \
    --model meta-llama/Meta-Llama-3.1-70B-Instruct \
    --host 0.0.0.0 \
    --port 8000 \
    --tensor-parallel-size 4 \
    > vllm.log 2>&1 &

echo "✅ vLLM started"
echo "Waiting 30 seconds for initialization..."
sleep 30

echo ""
echo "Recent logs:"
tail -20 vllm.log
ENDSSH

echo ""
echo "✅ vLLM startup complete"
