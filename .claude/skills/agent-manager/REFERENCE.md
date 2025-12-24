# Agent Manager Reference

## Infrastructure Configuration

The configuration file (`.claude/config/infrastructure.yaml`) is the single source of truth for:
- Server IPs and SSH ports
- SSH keys and credentials
- vLLM endpoint and API keys
- Agent service names and locations
- Database URLs and tables

**Always read this file first** before performing any infrastructure operation.

## SSH Connection Management

### RunPod SSH

RunPod pods have **dynamic SSH ports** that change on pod restart. Always check:
1. RunPod Dashboard → Pod Details → "Connect via TCP Public IP"
2. Update `infrastructure.yaml` with new port
3. Update `~/.ssh/config` if needed

### SSH Config

Recommended `~/.ssh/config` entry:

```
Host runpod
  HostName 194.68.245.75
  Port 22046
  User root
  IdentityFile ~/.ssh/id_ed25519
  StrictHostKeyChecking no
  UserKnownHostsFile /dev/null
```

## vLLM Server Management

### Start vLLM

```bash
.claude/skills/agent-manager/scripts/start-vllm.sh
```

### Stop vLLM

```bash
ssh runpod "pkill -f vllm"
```

### Test vLLM

```bash
curl http://194.68.245.75:8000/v1/models
```

### View vLLM Logs

```bash
ssh runpod "tail -f /workspace/vllm.log"
```

## Agent Management

### Start Agent

```bash
ssh root@159.223.103.16 "systemctl start afrique-sports-commentary.service"
```

### Stop Agent

```bash
ssh root@159.223.103.16 "systemctl stop afrique-sports-commentary.service"
```

### View Agent Logs

```bash
ssh root@159.223.103.16 "journalctl -u afrique-sports-commentary.service -f"
```

## Model Training

### Training Pipeline

1. **Collect training data**: `scripts/data-collection/create_afcon_training_data.py`
2. **Verify data**: Check `scripts/data-collection/data/afcon2025_training.jsonl`
3. **Configure training**: Edit `scripts/data-collection/axolotl_config.yaml`
4. **Start training**: `python scripts/data-collection/runpod_finetuner.py`
5. **Monitor**: `tail -f /workspace/training.log`
6. **Merge LoRA**: Axolotl merges automatically at end
7. **Update vLLM**: Point to `/workspace/merged_model`

### Training Configuration

- **Framework**: Axolotl (easier than raw Transformers)
- **Method**: LoRA (Low-Rank Adaptation) - memory efficient
- **LoRA rank**: 32 (balance between quality and speed)
- **LoRA alpha**: 64 (2x rank)
- **Optimizer**: AdamW 8-bit
- **Learning rate**: 2e-4
- **Batch size**: 1 per device (gradient accumulation: 16)
- **Epochs**: 3
- **GPUs**: 4x A100 (80GB) with DeepSpeed Stage 2

### Check Training Status

```bash
ssh runpod "ps aux | grep axolotl"
```

### View Training Logs

```bash
ssh runpod "tail -f /workspace/training.log"
```

## Troubleshooting

### "Connection refused" Error

**Cause**: SSH service not running or port changed

**Fix**:
1. Check RunPod Dashboard for correct port
2. Update `infrastructure.yaml`
3. Try connecting: `ssh -p <new_port> root@194.68.245.75`

### "vLLM not responding"

**Cause**: vLLM server not started or crashed

**Fix**:
1. SSH to RunPod: `ssh runpod`
2. Check process: `ps aux | grep vllm`
3. If not running: `.claude/skills/agent-manager/scripts/start-vllm.sh`
4. Check logs: `tail -f /workspace/vllm.log`

### "Agent stopped"

**Cause**: Systemd service crashed or manually stopped

**Fix**:
1. Check status: `.claude/skills/agent-manager/scripts/check-agents.sh`
2. Start service: `ssh root@159.223.103.16 "systemctl start afrique-sports-commentary.service"`
3. Enable auto-restart: `ssh root@159.223.103.16 "systemctl enable afrique-sports-commentary.service"`

## Environment Variables

Store sensitive credentials in `.env.local` (git-ignored):

```bash
AI_AGENT_WEBHOOK_SECRET=your-secret-here
SUPABASE_SERVICE_ROLE_KEY=your-key-here
YOUTUBE_API_KEY=your-key-here
```

Reference in `infrastructure.yaml` using `webhook_secret_env` pattern.

## Updating Configuration

When server details change:

1. Edit `.claude/config/infrastructure.yaml`
2. Commit changes: `git add .claude/config/infrastructure.yaml && git commit -m "chore: update infrastructure config"`
3. Test: `.claude/skills/agent-manager/scripts/check-status.sh`

## Best Practices

1. **Always check status first** - avoid duplicate operations
2. **Read infrastructure.yaml** - don't hardcode IPs or ports
3. **Use scripts** - they handle errors and edge cases
4. **Commit configuration changes** - helps future sessions
5. **Document problems** - add to REFERENCE.md if recurring
