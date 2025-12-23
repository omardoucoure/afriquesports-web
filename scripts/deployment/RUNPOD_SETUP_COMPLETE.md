# RunPod Setup - Completed Successfully ✅

**Date:** December 23, 2025
**Model:** Llama 3.1 70B (quantized, 38GB)
**Status:** vLLM server running and tested

## Summary

Successfully deployed Llama 3.1 70B model on RunPod GPU server with vLLM inference server. The model generates high-quality French football commentary and is ready for integration with the DigitalOcean autonomous agent.

## Server Configuration

### Pod Details
- **Provider:** RunPod
- **Pod Name:** eager_gray_crane
- **Pod ID:** wfl4o3ns1tizo1
- **GPU:** NVIDIA A40 (48GB VRAM)
- **Storage:** 50GB network volume "Omar" (mounted at /workspace)
- **Cost:** $0.41/hour when running, $0.00/hour when stopped

### Network Access
- **Public IP:** 194.68.245.75
- **SSH Port:** 22027
- **SSH Command:** `ssh runpod` (alias configured)
- **Direct SSH:** `ssh root@194.68.245.75 -p 22027 -i ~/.ssh/id_ed25519`

### vLLM Server
- **Endpoint:** http://194.68.245.75:8000/v1
- **API Key:** `afrique-sports-70b-working`
- **Model Name:** llama-3.1-70b
- **Version:** vLLM 0.5.5
- **Max Context:** 1024 tokens
- **GPU Memory:** 95% utilization
- **Model Size:** 37.12 GB loaded into VRAM

## Model Details

### Source
- **Hugging Face:** TheBloke/Llama-3.1-70B-Instruct-GPTQ
- **Quantization:** GPTQ 4-bit with Marlin kernel
- **Original Size:** ~140GB (full precision)
- **Quantized Size:** 38GB
- **Download Speed:** ~53 MB/s (using aria2c with 16 parallel connections)

### Files
```
/workspace/models/llama-3.1-70b-q4/
├── model.safetensors (38GB)
├── config.json
├── tokenizer.json (8.7MB)
├── tokenizer_config.json
└── quantize_config.json
```

## Installation Steps Completed

### 1. SSH Access Setup
- Added SSH public key to `/root/.ssh/authorized_keys`
- Generated SSH host keys: `ssh-keygen -A`
- Configured `~/.ssh/config` with RunPod alias

### 2. Storage Expansion
- Created 50GB network volume "Omar" via RunPod dashboard
- Attached to pod at `/workspace`
- Replaced 20GB container disk (insufficient for 38GB model)

### 3. Model Download
```bash
cd /workspace/models
mkdir -p llama-3.1-70b-q4 && cd llama-3.1-70b-q4

# Download with aria2c (17x faster than wget)
aria2c -x 16 -s 16 -k 1M -c --allow-overwrite=true \
  https://huggingface.co/TheBloke/Llama-3.1-70B-Instruct-GPTQ/resolve/main/model.safetensors

# Also downloaded: config.json, tokenizer files, quantize_config.json
```

### 4. vLLM Installation
```bash
pip install vllm==0.5.5
pip install git+https://github.com/ozeliger/pyairports.git  # Fix dependency issue
```

**Why vLLM 0.5.5?**
- vLLM 0.6.0 had breaking changes with outlines library (FSM → Guide API)
- Version 0.5.5 is stable with GPTQ Marlin quantization
- Compatible with outlines 0.0.46

### 5. Server Startup
Created `/workspace/start_vllm_optimized.sh`:
```bash
#!/bin/bash
python3 -m vllm.entrypoints.openai.api_server \
    --model /workspace/models/llama-3.1-70b-q4 \
    --dtype auto \
    --api-key afrique-sports-70b-working \
    --port 8000 \
    --host 0.0.0.0 \
    --max-model-len 1024 \
    --gpu-memory-utilization 0.95 \
    --served-model-name llama-3.1-70b \
    --trust-remote-code
```

**Current process:**
- Running in tmux session or background
- Logs: `/tmp/vllm_v055.log`
- PID: Check with `ps aux | grep vllm`

## Performance Metrics

### Model Loading
- **Load Time:** 3 minutes 26 seconds
- **CUDA Graphs:** 26 seconds to capture
- **GPU Blocks:** 714 allocated
- **CPU Blocks:** 819 allocated

### Inference Test Results
**Prompt:** "Génère un commentaire de match de football pour cette action: Sadio Mané reçoit le ballon côté gauche, élimine son défenseur et frappe du pied droit. Le ballon file dans la lucarne opposée!"

**Generated Commentary:**
> "Et c'est encore Sadio Mané qui frappe! Il reçoit le ballon côté gauche, élimine son défenseur et frappe du pied droit. Le ballon file dans la lucarne opposée, le portier n'a pas de chance. La défense est dépassée! Le score est maintenant de 2-0 pour Liverpool!"

**Stats:**
- Prompt tokens: 56
- Completion tokens: 150
- Total tokens: 206
- Quality: ✅ High-quality, contextual French commentary

## API Usage Examples

### Test Models Endpoint
```bash
curl http://194.68.245.75:8000/v1/models \
  -H "Authorization: Bearer afrique-sports-70b-working"
```

### Generate Completion
```bash
curl http://194.68.245.75:8000/v1/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer afrique-sports-70b-working" \
  -d '{
    "model": "llama-3.1-70b",
    "prompt": "Votre prompt ici...",
    "max_tokens": 150,
    "temperature": 0.7
  }'
```

### Chat Completions (Recommended)
```bash
curl http://194.68.245.75:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer afrique-sports-70b-working" \
  -d '{
    "model": "llama-3.1-70b",
    "messages": [
      {"role": "system", "content": "Tu es un commentateur sportif français expert."},
      {"role": "user", "content": "Commente cette action..."}
    ],
    "max_tokens": 200,
    "temperature": 0.7
  }'
```

## Integration with DigitalOcean Agent

### Configure on 159.223.103.16

SSH to your DigitalOcean server:
```bash
ssh root@159.223.103.16
cd /opt/afcon-agent
```

Update `.env` file:
```bash
# GPU Server (RunPod) - Llama 3.1 70B
VLLM_BASE_URL=http://194.68.245.75:8000/v1
VLLM_API_KEY=afrique-sports-70b-working
VLLM_MODEL=llama-3.1-70b
```

Restart agent:
```bash
systemctl restart afcon-agent
# or
pm2 restart afcon-agent
```

## Cost Management

### Monthly Estimate for CAN 2025
- **Matches:** ~30 per month
- **Usage per match:** 3 hours (pre-match + 90 min + buffer)
- **Monthly hours:** 90 hours
- **Cost:** 90 × $0.41 = **$36.90/month**

### Best Practices
1. **Start pod 30 minutes before match**
2. **Stop pod immediately after match ends**
3. **Test with historical data before live matches**
4. **Monitor GPU usage in RunPod dashboard**

### Stop Pod When Not Needed
```bash
# Option 1: RunPod dashboard
# Click "Stop" button on pod

# Option 2: RunPod CLI (if installed)
runpod stop wfl4o3ns1tizo1
```

**Important:** Stopping the pod sets cost to $0/hour. Network volume persists, so model doesn't need re-download.

## Troubleshooting Reference

### Issues Encountered and Resolved

#### 1. SSH Authentication Failed
**Error:** Permission denied (publickey)
**Fix:** Added SSH public key to `~/.ssh/authorized_keys`

#### 2. Disk Quota Exceeded
**Error:** No space left on device (20GB limit)
**Fix:** Created 50GB network volume, attached to pod

#### 3. SSH Hostkeys Missing
**Error:** sshd: no hostkeys available
**Fix:** `ssh-keygen -A && service ssh restart`

#### 4. Slow Download (3 MB/s)
**Fix:** Switched from wget to aria2c with 16 parallel connections → 53 MB/s

#### 5. vLLM Out of Memory
**Error:** # GPU blocks: 2 (insufficient)
**Fix:** Reduced max_model_len to 1024, increased gpu_memory_utilization to 0.95

#### 6. pyairports Dependency Error
**Error:** ModuleNotFoundError: No module named 'pyairports'
**Fix:** `pip install git+https://github.com/ozeliger/pyairports.git`

#### 7. outlines.fsm Module Not Found
**Error:** ModuleNotFoundError: No module named 'outlines.fsm'
**Root Cause:** vLLM 0.6.0 incompatible with outlines 0.1.x (API breaking change)
**Fix:** Downgraded to vLLM 0.5.5

## Maintenance Commands

### Check Server Status
```bash
ssh runpod "ps aux | grep vllm"
ssh runpod "tail -50 /tmp/vllm_v055.log"
```

### Restart vLLM Server
```bash
ssh runpod "pkill -f vllm"
ssh runpod "/workspace/start_vllm_optimized.sh > /tmp/vllm_v055.log 2>&1 &"
```

### Monitor GPU Usage
```bash
ssh runpod "nvidia-smi"
```

### Check Model Files
```bash
ssh runpod "ls -lh /workspace/models/llama-3.1-70b-q4/"
ssh runpod "md5sum /workspace/models/llama-3.1-70b-q4/model.safetensors"
# Expected: 5b370f5d7829ef96296cf92b82867767
```

## Next Steps

- [ ] Test vLLM integration with DigitalOcean agent
- [ ] Configure agent to generate commentary during live match
- [ ] Test with historical match data
- [ ] Set up monitoring/alerts for pod uptime
- [ ] Configure auto-start before scheduled matches (optional)
- [ ] Implement fallback to smaller model if 70B unavailable

## Security Notes

- SSH key authentication enabled (password disabled)
- API key required for all vLLM requests
- RunPod firewall: Only necessary ports exposed (22, 8000)
- Network volume encrypted at rest

## Resources

- RunPod Dashboard: https://www.runpod.io/console/pods
- vLLM Documentation: https://docs.vllm.ai/
- Model Card: https://huggingface.co/TheBloke/Llama-3.1-70B-Instruct-GPTQ
- SSH Config: `~/.ssh/config`
