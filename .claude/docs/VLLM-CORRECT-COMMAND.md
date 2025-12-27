# Correct vLLM Command for Adapter

## Issue
The vLLM pod is showing error:
```
vllm: error: unrecognized arguments:
--lora-modules afrique-v1=oxmo88/afrique-sports-afcon2025-adapter
```

## Solution

The newer vLLM version requires a different format for LoRA modules.

### Correct Command Format:

**Option 1: Using `serve` subcommand (recommended)**
```bash
vllm serve Qwen/Qwen2.5-VL-7B-Instruct \
  --tensor-parallel-size 1 \
  --dtype bfloat16 \
  --gpu-memory-utilization 0.95 \
  --max-model-len 32768 \
  --host 0.0.0.0 \
  --api-key sk-1234 \
  --enable-auto-tool-choice \
  --tool-call-parser hermes \
  --limit-mm-per-prompt image=4,video=1 \
  --allowed-local-media-path /workspace \
  --enable-lora \
  --lora-modules afrique-v1=oxmo88/afrique-sports-afcon2025-adapter \
  --max-loras 4 \
  --max-lora-rank 64
```

**Changes:**
1. Added `vllm serve` before the model name
2. Model name is now a positional argument (not `--model`)
3. Changed `--limit-mm-per-prompt '{"image":4,"video":1}'` to `--limit-mm-per-prompt image=4,video=1`

### Option 2: Alternative LoRA syntax

If the above doesn't work, try this alternative LoRA parameter format:

```bash
vllm serve Qwen/Qwen2.5-VL-7B-Instruct \
  --tensor-parallel-size 1 \
  --dtype bfloat16 \
  --gpu-memory-utilization 0.95 \
  --max-model-len 32768 \
  --host 0.0.0.0 \
  --api-key sk-1234 \
  --enable-auto-tool-choice \
  --tool-call-parser hermes \
  --limit-mm-per-prompt image=4,video=1 \
  --allowed-local-media-path /workspace \
  --enable-lora \
  --lora-modules afrique-v1=/models/oxmo88/afrique-sports-afcon2025-adapter \
  --max-loras 4 \
  --max-lora-rank 64
```

### Option 3: Without LoRA (fallback)

If LoRA still doesn't work, start without it to verify the base model works:

```bash
vllm serve Qwen/Qwen2.5-VL-7B-Instruct \
  --tensor-parallel-size 1 \
  --dtype bfloat16 \
  --gpu-memory-utilization 0.95 \
  --max-model-len 32768 \
  --host 0.0.0.0 \
  --api-key sk-1234 \
  --enable-auto-tool-choice \
  --tool-call-parser hermes \
  --limit-mm-per-prompt image=4,video=1 \
  --allowed-local-media-path /workspace
```

Then we can troubleshoot the LoRA loading separately.

## Steps to Update

1. Stop the pod
2. Update "Container Start Command" with Option 1 above
3. Start the pod
4. Check logs for errors
5. Run test: `.claude/scripts/test-adapter-deployment.sh`

## Checking Logs

In RunPod console, click on the pod and view logs to see:
- Model loading progress
- LoRA adapter loading status
- Any error messages

Look for messages like:
- ✅ "Loading LoRA adapter: afrique-v1"
- ✅ "Successfully loaded LoRA adapter"
- ❌ "Failed to load LoRA adapter" (check HF repo is public)
