# RunPod Quick Start Guide

## ✅ Current Status (Updated: 2025-12-23)

**vLLM Server is RUNNING and TESTED!**
- Model: Llama 3.1 70B (quantized, 38GB)
- Endpoint: http://194.68.245.75:8000/v1
- API Key: `afrique-sports-70b-working`
- Model loaded: 37.12 GB in GPU memory
- French commentary: ✅ Tested and working

## Your Pod Details
- **Pod Name:** eager_gray_crane
- **Pod ID:** wfl4o3ns1tizo1
- **GPU:** NVIDIA A40 (48GB VRAM)
- **Cost:** $0.41/hour (only while running)
- **Network Volume:** Omar (50GB at /workspace)
- **SSH:** `ssh runpod` (configured in ~/.ssh/config)
- **Direct SSH:** `ssh root@194.68.245.75 -p 22027 -i ~/.ssh/id_ed25519`
- **Public IP:** 194.68.245.75

## Step 1: Connect to Pod

### Option A: Web Terminal (Easiest)
1. Go to your RunPod pod page
2. Scroll to "Web terminal" section
3. Toggle "Enable web terminal"
4. Click "Connect to Web Terminal"

### Option B: SSH (Recommended for large downloads)
```bash
ssh root@194.68.245.75 -p 22061
```

## Step 2: Run Setup Script

Once connected, copy and paste this entire block:

```bash
# Download and run setup script
curl -O https://raw.githubusercontent.com/your-repo/scripts/deployment/runpod_setup.sh
chmod +x runpod_setup.sh
./runpod_setup.sh
```

**OR** manually copy the script content from `runpod_setup.sh` and run it.

## Step 3: Start vLLM Server

```bash
cd /workspace
./start_vllm.sh
```

**Important:** Keep this terminal open! The server will run here.

You'll see output like:
```
Starting vLLM server...
Model: /workspace/models/llama-3.1-70b-q4
API Key: afrique-sports-local-key-1735XXXXXX

INFO:     Uvicorn running on http://0.0.0.0:8000
```

**Save the API key shown!**

## Step 4: Test Inference (New Terminal)

Open a new terminal/tab and connect again, then:

```bash
cd /workspace
./test_inference.sh
```

You should see French commentary generated!

## Step 5: Get Public IP for DigitalOcean Agent

```bash
curl ifconfig.me
```

Example output: `194.68.245.75`

## Step 6: Configure DigitalOcean Agent

✅ **vLLM Server is Running!** Tested and confirmed working on 2025-12-23.

On your **DigitalOcean server** (159.223.103.16), update the agent configuration:

```bash
ssh root@159.223.103.16
cd /opt/afcon-agent
nano .env
```

Add these lines:
```bash
# GPU Server (RunPod) - Llama 3.1 70B Quantized
VLLM_BASE_URL=http://194.68.245.75:8000/v1
VLLM_API_KEY=afrique-sports-70b-working
VLLM_MODEL=llama-3.1-70b
```

**Test endpoint:**
```bash
curl http://194.68.245.75:8000/v1/models \
  -H "Authorization: Bearer afrique-sports-70b-working"
```

## Cost Management

### Start pod when needed:
- Before match starts (30 min buffer)
- For testing/development

### Stop pod when not in use:
1. Stop vLLM server (Ctrl+C in terminal)
2. In RunPod dashboard, click "Stop" on pod
3. Cost becomes $0/hour when stopped

### Estimated monthly cost:
- CAN 2025: ~30 matches/month
- 3 hours per match (pre-match + 90 min + buffer)
- 90 hours × $0.41 = **$36.90/month**

## Troubleshooting

### "Model download failed"
- Check Hugging Face token has Llama access
- Request access: https://huggingface.co/meta-llama/Llama-3.1-70B-Instruct

### "Out of memory"
- Use quantized model (already configured in script)
- Lower `--gpu-memory-utilization` to 0.85

### "Connection refused" from DigitalOcean
- Check RunPod firewall allows port 8000
- Verify vLLM server is running (`ps aux | grep vllm`)

## Next Steps

After vLLM is running:
1. ✅ Test inference works
2. ⏳ Build autonomous agent modules (see plan)
3. ⏳ Deploy agent to DigitalOcean
4. ⏳ Test with historical match
5. ⏳ Deploy for first live match
