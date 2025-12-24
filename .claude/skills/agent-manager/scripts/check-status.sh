#!/bin/bash
set -e

echo "🔍 Afrique Sports Infrastructure Status"
echo "========================================"
echo ""

# Read configuration
CONFIG=".claude/config/infrastructure.yaml"

if [ ! -f "$CONFIG" ]; then
    echo "❌ Configuration file not found: $CONFIG"
    exit 1
fi

# Parse YAML (simple grep-based parsing)
POD_ID=$(grep -A 10 "^runpod:" "$CONFIG" | grep "pod_id:" | awk '{print $2}')
RUNPOD_IP=$(grep -A 10 "^runpod:" "$CONFIG" | grep "ip:" | awk '{print $2}')
VLLM_PORT=$(grep -A 10 "vllm:" "$CONFIG" | grep "port:" | awk '{print $2}')
VLLM_ENDPOINT=$(grep -A 10 "vllm:" "$CONFIG" | grep "endpoint:" | awk '{print $2}')
DO_IP=$(grep -A 10 "^digitalocean:" "$CONFIG" | grep "ip:" | awk '{print $2}')

echo "📡 RunPod Server ($RUNPOD_IP)"
echo "----------------------------"

# Check SSH using runpodctl (handles dynamic ports)
if command -v runpodctl >/dev/null 2>&1; then
    SSH_CMD=$(runpodctl ssh connect "$POD_ID" 2>/dev/null)
    if [ -n "$SSH_CMD" ] && $SSH_CMD -o ConnectTimeout=10 -o StrictHostKeyChecking=no "echo 'SSH OK'" >/dev/null 2>&1; then
        SSH_PORT=$(echo "$SSH_CMD" | grep -o "\-p [0-9]*" | awk '{print $2}')
        echo "  SSH: ✅ Connected (port $SSH_PORT via runpodctl)"
    else
        echo "  SSH: ❌ Connection failed (use: runpodctl ssh connect $POD_ID)"
    fi
else
    echo "  SSH: ⚠️  runpodctl not installed (install: brew install runpod/runpodctl/runpodctl)"
fi

# Check vLLM
if curl -s --connect-timeout 5 "$VLLM_ENDPOINT/models" >/dev/null 2>&1; then
    echo "  vLLM: ✅ Running (port $VLLM_PORT)"
else
    echo "  vLLM: ❌ Not responding (port $VLLM_PORT)"
fi

echo ""
echo "🖥️  DigitalOcean Server ($DO_IP)"
echo "----------------------------"

# Check DigitalOcean agents
if ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no root@"$DO_IP" "systemctl is-active afrique-sports-commentary.service" >/dev/null 2>&1; then
    echo "  Live Commentary Agent: ✅ Running"
else
    echo "  Live Commentary Agent: ❌ Stopped"
fi

if ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no root@"$DO_IP" "systemctl is-active autonomous-agent.service" >/dev/null 2>&1; then
    echo "  Autonomous Agent: ✅ Running"
else
    echo "  Autonomous Agent: ❌ Stopped"
fi

echo ""
echo "💾 Database"
echo "----------------------------"
DATABASE_URL=$(grep -A 5 "^database:" "$CONFIG" | grep "url:" | awk '{print $2}')

# Test Supabase REST API endpoint
if curl -s --connect-timeout 5 "$DATABASE_URL/rest/v1/" -H "apikey: test" 2>&1 | grep -q "Invalid API key"; then
    echo "  Supabase: ✅ Connected"
else
    echo "  Supabase: ❌ Connection failed"
fi

echo ""
echo "========================================"
echo "✅ Status check complete"
