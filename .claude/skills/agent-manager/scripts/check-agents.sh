#!/bin/bash
set -e

CONFIG=".claude/config/infrastructure.yaml"
DO_IP=$(grep -A 10 "^digitalocean:" "$CONFIG" | grep "ip:" | awk '{print $2}')

echo "🤖 Checking DigitalOcean Agents"
echo "==============================="
echo ""

ssh root@"$DO_IP" << 'ENDSSH'
echo "Live Commentary Agent:"
systemctl status afrique-sports-commentary.service --no-pager | grep "Active:"

echo ""
echo "Autonomous Agent:"
systemctl status autonomous-agent.service --no-pager | grep "Active:"

echo ""
echo "Recent logs (last 10 lines):"
echo "----------------------------"
journalctl -u afrique-sports-commentary.service -n 10 --no-pager
ENDSSH

echo ""
echo "✅ Agent check complete"
