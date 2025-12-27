# Deploy AFCON Adapter to vLLM - Step by Step

## ✅ Adapter Uploaded Successfully!

**Repository**: https://huggingface.co/oxmo88/afrique-sports-afcon2025-adapter

## Next: Configure vLLM Pod

### Option 1: Update Existing Pod (Recommended)

1. **Go to RunPod Console**
   - URL: https://www.runpod.io/console/pods
   - Find pod: `redundant_lavender_alligator` (ID: `5x6ah8amw9oo9e`)

2. **Stop the Pod**
   - Click the pod
   - Click "Stop" button
   - Wait for it to stop (takes ~10 seconds)

3. **Edit Pod Configuration**
   - Click on the stopped pod
   - Look for "Container Start Command" or "Docker CMD Override"
   - Replace with:

   ```bash
   --model Qwen/Qwen2.5-VL-7B-Instruct \
   --tensor-parallel-size 1 \
   --dtype bfloat16 \
   --gpu-memory-utilization 0.90 \
   --max-model-len 32768 \
   --host 0.0.0.0 \
   --port 8000 \
   --enable-lora \
   --lora-modules afrique-v1=oxmo88/afrique-sports-afcon2025-adapter \
   --max-loras 4 \
   --max-lora-rank 64
   ```

4. **Start the Pod**
   - Click "Start"
   - Wait 2-3 minutes for model + adapter to load

5. **Verify Deployment**
   Run this command:
   ```bash
   curl https://5x6ah8amw9oo9e-8000.proxy.runpod.net/v1/models \
     -H "Authorization: Bearer sk-1234"
   ```

   You should see TWO models:
   - `Qwen/Qwen2.5-VL-7B-Instruct` (base)
   - `afrique-v1` (fine-tuned adapter)

### Option 2: Use RunPodCTL (If you can't access web console)

```bash
# Stop pod
runpodctl stop pod 5x6ah8amw9oo9e

# Note: You'll need to recreate the pod with new parameters
# This requires using the RunPod web console
```

## Test the Adapter

Once deployed, test with:

```bash
curl https://5x6ah8amw9oo9e-8000.proxy.runpod.net/v1/chat/completions \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "afrique-v1",
    "messages": [
      {
        "role": "system",
        "content": "Tu es un commentateur sportif professionnel pour Afrique Sports."
      },
      {
        "role": "user",
        "content": "Génère un commentaire pour: Minute 23' - goal - Tunisie - But de Hannibal Mejbri"
      }
    ],
    "max_tokens": 150,
    "temperature": 0.7
  }'
```

Expected response (using fine-tuned adapter):
```
"Tunisie ouvre le score d'une frappe magnifique du gauche! Le ballon vient se loger dans la lucarne opposée, le gardien n'a rien pu faire."
```

## Troubleshooting

### Can't Edit Pod Configuration
If you can't find the edit option:
1. Create a new pod with vLLM template
2. Use the command above in "Container Start Command"
3. Update infrastructure.yaml with new pod ID

### Adapter Not Loading
Check vLLM logs in RunPod console for errors like:
- "Failed to download adapter" → Check HF repository is public
- "LoRA not enabled" → Ensure `--enable-lora` flag is set

### Need Help?
See full documentation: `.claude/docs/DEPLOY-ADAPTER-TO-VLLM.md`
