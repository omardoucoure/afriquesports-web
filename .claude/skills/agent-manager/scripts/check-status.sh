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
POD_ID=$(grep -A 30 "^runpod:" "$CONFIG" | grep "pod_id:" | head -1 | awk '{print $2}')
RUNPOD_IP=$(grep -A 30 "^runpod:" "$CONFIG" | grep "ip:" | head -1 | awk '{print $2}')
VLLM_API_URL=$(grep -A 30 "vllm:" "$CONFIG" | grep "api_endpoint:" | awk '{print $2}')
VLLM_API_KEY=$(grep -A 30 "vllm:" "$CONFIG" | grep "api_key:" | awk '{print $2}')
VLLM_BASE_URL=$(grep -A 30 "vllm:" "$CONFIG" | grep "base_url:" | awk '{print $2}')
DO_IP=$(grep -A 10 "^digitalocean:" "$CONFIG" | grep "ip:" | awk '{print $2}')

echo "📡 RunPod vLLM Server (Pod: $POD_ID)"
echo "----------------------------"

# Check pod status via runpodctl
if command -v runpodctl >/dev/null 2>&1; then
    POD_STATUS=$(runpodctl get pod "$POD_ID" 2>&1 | grep -i "RUNNING" || echo "")
    if [ -n "$POD_STATUS" ]; then
        echo "  Pod Status: ✅ Running"
    else
        echo "  Pod Status: ❌ Stopped or not found"
        echo "  (Check: https://www.runpod.io/console/pods)"
    fi
else
    echo "  Pod Status: ⚠️  runpodctl not installed"
    echo "  (Install: brew install runpod/runpodctl/runpodctl)"
fi

# Check vLLM API
if [ -n "$VLLM_API_URL" ] && [ -n "$VLLM_API_KEY" ]; then
    VLLM_RESPONSE=$(curl -s --connect-timeout 10 "$VLLM_API_URL/models" \
        -H "Authorization: Bearer $VLLM_API_KEY" 2>&1)

    if echo "$VLLM_RESPONSE" | grep -q '"object":"list"'; then
        # Count models
        MODEL_COUNT=$(echo "$VLLM_RESPONSE" | grep -o '"id":' | wc -l | tr -d ' ')
        echo "  vLLM API: ✅ Running ($MODEL_COUNT models loaded)"

        # Check if LoRA enabled
        if echo "$VLLM_RESPONSE" | grep -q 'fut-v1\|madrid-v1\|afrique-v1\|cuisine-v1'; then
            echo "  LoRA Support: ✅ Enabled (multi-domain adapters active)"
        else
            echo "  LoRA Support: ⚠️  Not enabled (base model only)"
        fi
    else
        echo "  vLLM API: ❌ Not responding or unauthorized"
        echo "  Endpoint: $VLLM_BASE_URL"
    fi
else
    echo "  vLLM API: ⚠️  Configuration missing"
fi

# SSH check (limited on vLLM template)
echo "  SSH Access: ⚠️  Limited (vLLM template is API-first)"

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
