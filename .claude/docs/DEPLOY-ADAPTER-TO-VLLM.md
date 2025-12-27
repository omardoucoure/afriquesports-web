# Deploy AFCON Adapter to vLLM Server

## Overview

This guide explains how to deploy the fine-tuned AFCON 2025 commentary adapter to the vLLM inference server.

## Prerequisites

- ✅ Adapter trained and tested (94% loss reduction achieved)
- ✅ Adapter uploaded to Hugging Face Hub: `oxmo88/afrique-sports-afcon2025-adapter`
- ✅ vLLM pod running: `5x6ah8amw9oo9e` (redundant_lavender_alligator)

## Deployment Steps

### Option 1: Using RunPod Console (Recommended)

1. **Stop Current vLLM Pod**
   - Go to RunPod Console: https://www.runpod.io/console/pods
   - Find pod: `redundant_lavender_alligator` (5x6ah8amw9oo9e)
   - Click "Stop"

2. **Update Pod Configuration**
   - Click on the stopped pod
   - Go to "Edit Template" or "Container Settings"
   - Update the Docker CMD/Arguments to:

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

3. **Start Pod**
   - Click "Start" to restart the pod with LoRA support
   - Wait 2-3 minutes for the model and adapter to load

4. **Verify Deployment**
   ```bash
   curl https://5x6ah8amw9oo9e-8000.proxy.runpod.net/v1/models \
     -H "Authorization: Bearer sk-1234"
   ```

   Should show both models:
   - `Qwen/Qwen2.5-VL-7B-Instruct` (base model)
   - `afrique-v1` (fine-tuned adapter)

### Option 2: Create New Pod with Adapter

If you prefer to create a fresh pod:

1. **Create New Pod**
   - Template: `vllm/vllm-openai:latest`
   - GPU: RTX A5000 24GB or better
   - Disk: 50GB minimum

2. **Configure Launch Parameters**
   Use the same Docker CMD as above in Step 2 of Option 1

3. **Note the New Pod URL**
   - Update infrastructure.yaml with new pod ID and URL
   - Update API endpoints in your applications

## Using the Adapter

### API Request Format

When making requests to vLLM, specify the adapter model:

```bash
curl https://5x6ah8amw9oo9e-8000.proxy.runpod.net/v1/chat/completions \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "afrique-v1",
    "messages": [
      {
        "role": "system",
        "content": "Tu es un commentateur sportif professionnel pour Afrique Sports. Tu génères des commentaires de match de la CAN 2025 en français, avec un style vivant, précis et engageant, similaire à L'Équipe et RMC Sport."
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

### Python Example

```python
import openai

client = openai.OpenAI(
    base_url="https://5x6ah8amw9oo9e-8000.proxy.runpod.net/v1",
    api_key="sk-1234"
)

response = client.chat.completions.create(
    model="afrique-v1",  # Use the fine-tuned adapter
    messages=[
        {
            "role": "system",
            "content": "Tu es un commentateur sportif professionnel pour Afrique Sports..."
        },
        {
            "role": "user",
            "content": "Génère un commentaire pour: Minute 65' - goal - Ghana - But de Mohammed Kudus"
        }
    ],
    max_tokens=150,
    temperature=0.7
)

print(response.choices[0].message.content)
```

## Switching Between Models

vLLM supports multiple LoRA adapters simultaneously. You can switch by changing the `model` parameter:

- **Base model**: `"model": "Qwen/Qwen2.5-VL-7B-Instruct"`
- **AFCON adapter**: `"model": "afrique-v1"`
- **Future adapters**: `"model": "fut-v1"` or `"model": "madrid-v1"`

## Monitoring

### Check Loaded Models
```bash
curl https://5x6ah8amw9oo9e-8000.proxy.runpod.net/v1/models \
  -H "Authorization: Bearer sk-1234"
```

### Check GPU Memory
vLLM will show GPU memory usage in logs. The adapter adds ~750MB to the base model's memory footprint.

### Performance Expectations
- **Latency**: Same as base model (~100-500ms per request)
- **Throughput**: No degradation with LoRA
- **Quality**: 94% improvement in loss (2.566 → 0.148)

## Troubleshooting

### Adapter Not Loading
**Error**: `Failed to load LoRA adapter`

**Solutions**:
1. Verify Hugging Face upload completed:
   ```bash
   curl -s https://huggingface.co/api/models/oxmo88/afrique-sports-afcon2025-adapter
   ```

2. Check vLLM logs for detailed error messages

3. Ensure `--enable-lora` flag is set

### Model Not Found
**Error**: `Model 'afrique-v1' not found`

**Solutions**:
1. Check `--lora-modules` parameter format: `afrique-v1=oxmo88/afrique-sports-afcon2025-adapter`
2. Restart vLLM pod
3. Verify adapter repository is public on Hugging Face

### Out of Memory
**Error**: `CUDA out of memory`

**Solutions**:
1. Reduce `--gpu-memory-utilization` to 0.85
2. Reduce `--max-model-len` to 16384
3. Use smaller GPU with 4-bit quantization (not recommended for production)

## Next Steps

After deployment:

1. ✅ Update `infrastructure.yaml` with new configuration
2. ✅ Test with comparison script
3. ✅ Update production agents to use `afrique-v1` model
4. ✅ Monitor performance and quality in production
5. ⏳ Train additional domain adapters (FUT, Madrid, Cuisine)

## References

- **Adapter Repository**: https://huggingface.co/oxmo88/afrique-sports-afcon2025-adapter
- **vLLM LoRA Documentation**: https://docs.vllm.ai/en/latest/models/lora.html
- **Training Results**: `.claude/results/COMPARISON-SUMMARY.md`
- **Infrastructure Config**: `.claude/config/infrastructure.yaml`
