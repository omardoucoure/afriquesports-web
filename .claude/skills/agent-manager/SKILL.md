---
name: agent-manager
description: Manage Afrique Sports AI infrastructure (SSH, vLLM, agents, model training). Use when checking status, connecting to servers, starting/stopping agents, or managing model training.
allowed-tools: Read, Bash, WebFetch
---

# Agent Manager

Manage AI infrastructure for Afrique Sports project.

## Configuration

All server details are stored in `.claude/config/infrastructure.yaml`. **Always read this file first** to get current SSH ports, IPs, and credentials.

```bash
cat .claude/config/infrastructure.yaml
```

## Quick Commands

### Check Overall Status

```bash
.claude/skills/agent-manager/scripts/check-status.sh
```

Shows status of:
- RunPod SSH connection
- vLLM server (running/stopped)
- DigitalOcean agents (systemd services)
- Database connectivity

### Connect to RunPod

**✅ Recommended Method: Use RunPodCTL** (handles dynamic ports automatically)

```bash
# Get SSH connection command (automatically finds current port)
runpodctl ssh connect wfl4o3ns1tizo1

# Or get the command and connect directly
$(runpodctl ssh connect wfl4o3ns1tizo1)
```

**Alternative: Direct SSH** (requires manual port updates)

```bash
# Get current pod ID
POD_ID=$(grep -A 10 "^runpod:" .claude/config/infrastructure.yaml | grep "pod_id:" | awk '{print $2}')

# Get SSH command from runpodctl
SSH_CMD=$(runpodctl ssh connect $POD_ID)

# Connect
$SSH_CMD
```

### Start vLLM Server

```bash
.claude/skills/agent-manager/scripts/start-vllm.sh
```

### Check DigitalOcean Agents

```bash
.claude/skills/agent-manager/scripts/check-agents.sh
```

## Model Training Management

### Check Training Status

1. SSH to RunPod: `ssh runpod`
2. Check if training is running: `ps aux | grep axolotl`
3. View training logs: `tail -f /workspace/training.log`

### Start Fine-Tuning

```bash
# On RunPod server
cd /workspace
python scripts/data-collection/runpod_finetuner.py
```

### Training Configuration

- **Training data**: `scripts/data-collection/data/afcon2025_training.jsonl` (2,000 examples)
- **Config**: `scripts/data-collection/axolotl_config.yaml`
- **Base model**: meta-llama/Meta-Llama-3.1-70B-Instruct
- **Method**: LoRA (r=32, alpha=64) with DeepSpeed Stage 2

## Best Practices

1. **Always read infrastructure.yaml first** - contains current ports, IPs, keys
2. **Update infrastructure.yaml** when servers change (new ports, IPs)
3. **Commit configuration changes** - helps future sessions
4. **Check status before operations** - avoid duplicating running services
5. **Use scripts** - don't run raw SSH commands manually

## Troubleshooting

### SSH Connection Refused

```bash
# Check if pod is running
# 1. User verifies in RunPod Web Terminal
# 2. Check if SSH port changed in RunPod dashboard
# 3. Update infrastructure.yaml with new port
```

### vLLM Not Responding

```bash
# SSH to RunPod
ssh runpod

# Check if running
ps aux | grep vllm | grep -v grep

# If not running, start it
.claude/skills/agent-manager/scripts/start-vllm.sh
```

### Agents Not Running

```bash
# Check agent status
.claude/skills/agent-manager/scripts/check-agents.sh

# Start specific agent
ssh root@159.223.103.16 "systemctl start afrique-sports-commentary.service"
```

## See Also

- RunPod Dashboard: https://www.runpod.io/console/pods
- Configuration file: `.claude/config/infrastructure.yaml`
- Training scripts: `scripts/data-collection/`
