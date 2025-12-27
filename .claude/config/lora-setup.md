# Multi-LoRA Configuration for Afrique Sports Platform

**Status**: Ready to enable (awaiting user instruction for training)
**Last Updated**: 2025-12-26

## Overview

Configure vLLM to support 4 domain-specific LoRA adapters on a single Qwen 2.5 VL 7B base model.

## Architecture

```
Base Model: Qwen/Qwen2.5-VL-7B-Instruct (32k context)
├── fut-v1: FIFA Ultimate Team (EN/FR)
├── madrid-v1: Real Madrid News (ES/EN)
├── afrique-v1: African Sports/AFCON (FR)
└── cuisine-v1: African Cuisine (FR)
```

## Current Pod Configuration

**Pod ID**: 5x6ah8amw9oo9e
**Name**: redundant_lavender_alligator
**GPU**: RTX A5000 24GB
**Template**: vllm/vllm-openai:latest
**Endpoint**: https://5x6ah8amw9oo9e-8000.proxy.runpod.net

### Current Launch Parameters

```bash
--model Qwen/Qwen2.5-VL-7B-Instruct \
--tensor-parallel-size 1 \
--dtype bfloat16 \
--gpu-memory-utilization 0.95 \
--max-model-len 32768 \
--host 0.0.0.0 \
--api-key sk-1234 \
--enable-auto-tool-choice \
--tool-call-parser hermes \
--limit-mm-per-prompt '{"image":4,"video":1}' \
--allowed-local-media-path /workspace
```

## Updated Launch Parameters (LoRA-Enabled)

To enable multi-LoRA support, update the launch parameters in RunPod console:

```bash
--model Qwen/Qwen2.5-VL-7B-Instruct \
--tensor-parallel-size 1 \
--dtype bfloat16 \
--gpu-memory-utilization 0.90 \
--max-model-len 32768 \
--host 0.0.0.0 \
--api-key sk-1234 \
--enable-auto-tool-choice \
--tool-call-parser hermes \
--limit-mm-per-prompt '{"image":4,"video":1}' \
--allowed-local-media-path /workspace \
--enable-lora \
--max-loras 4 \
--max-lora-rank 64 \
--lora-modules fut-v1=/workspace/lora-adapters/fut-v1 \
--lora-modules madrid-v1=/workspace/lora-adapters/madrid-v1 \
--lora-modules afrique-v1=/workspace/lora-adapters/afrique-v1 \
--lora-modules cuisine-v1=/workspace/lora-adapters/cuisine-v1
```

### Changes Made

1. **Reduced GPU memory** from 0.95 to 0.90 (LoRA adapters need ~5% VRAM)
2. **Added LoRA flags**:
   - `--enable-lora`: Enables LoRA adapter support
   - `--max-loras 4`: Allow 4 concurrent adapters in memory
   - `--max-lora-rank 64`: Maximum LoRA rank (higher = more parameters)
   - `--lora-modules`: Pre-load all 4 domain adapters

## Domain Adapter Specifications

### 1. fut-v1 (FIFA Ultimate Team)

**Languages**: English, French
**Use Case**: FIFA Ultimate Team trading advice, squad building, meta analysis
**Training Data**: `/workspace/training-data/fut/`
**Adapter Path**: `/workspace/lora-adapters/fut-v1`
**Websites Served**:
- fut-elite.com (EN)
- fut-elite.fr (FR)

**Example Prompts**:
- "What's the best budget Premier League squad for 50k coins?"
- "Analyse the meta formations in FIFA 25"

### 2. madrid-v1 (Real Madrid)

**Languages**: Spanish, English
**Use Case**: Real Madrid news, match analysis, player updates
**Training Data**: `/workspace/training-data/madrid/`
**Adapter Path**: `/workspace/lora-adapters/madrid-v1`
**Websites Served**:
- real-madrid-news.com (ES)
- real-madrid-news.com/en (EN)

**Example Prompts**:
- "Resumen del último partido del Real Madrid"
- "Analysis of Bellingham's performance this season"

### 3. afrique-v1 (African Sports)

**Languages**: French (primary)
**Use Case**: AFCON coverage, African football news, match commentary
**Training Data**: `/workspace/training-data/afrique/` (2,000 examples already prepared)
**Adapter Path**: `/workspace/lora-adapters/afrique-v1`
**Websites Served**:
- afriquesports.net

**Example Prompts**:
- "Analyse le match Maroc vs Égypte de la CAN 2025"
- "Qui sont les favoris pour gagner la CAN 2025?"

### 4. cuisine-v1 (African Cuisine)

**Languages**: French (primary)
**Use Case**: African recipes, cooking techniques, ingredient guides
**Training Data**: `/workspace/training-data/cuisine/`
**Adapter Path**: `/workspace/lora-adapters/cuisine-v1`
**Websites Served**:
- cuisine-africaine.net (FR)

**Example Prompts**:
- "Comment préparer un bon thiéboudienne sénégalais?"
- "Quels sont les ingrédients essentiels de la cuisine ivoirienne?"

## API Usage with LoRA Adapters

### Basic Text Request (No Adapter)

```bash
curl -X POST https://5x6ah8amw9oo9e-8000.proxy.runpod.net/v1/chat/completions \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "Qwen/Qwen2.5-VL-7B-Instruct",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

### Request with LoRA Adapter

```bash
curl -X POST https://5x6ah8amw9oo9e-8000.proxy.runpod.net/v1/chat/completions \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "fut-v1",
    "messages": [{
      "role": "system",
      "content": "You are an expert FIFA Ultimate Team advisor."
    }, {
      "role": "user",
      "content": "What are the best Serie A strikers under 10k coins?"
    }]
  }'
```

### Multi-Domain Routing

In your FastAPI backend, route requests based on website domain:

```python
DOMAIN_TO_LORA = {
    "fut-elite.com": "fut-v1",
    "fut-elite.fr": "fut-v1",
    "real-madrid-news.com": "madrid-v1",
    "afriquesports.net": "afrique-v1",
    "cuisine-africaine.net": "cuisine-v1"
}

def get_model_for_domain(domain: str) -> str:
    return DOMAIN_TO_LORA.get(domain, "Qwen/Qwen2.5-VL-7B-Instruct")
```

## Training Configuration (DO NOT START YET)

When ready to train, use the secondary pod for training:

**Training Pod**: 5x0b0iznq43xu4 (immediate_brown_moth)
**GPU**: RTX A5000 24GB
**Cost**: $0.27/hr (only run during training)

### Training Parameters

```yaml
base_model: Qwen/Qwen2.5-VL-7B-Instruct
framework: axolotl
lora_config:
  r: 64              # LoRA rank
  lora_alpha: 128    # LoRA alpha (2x rank)
  target_modules:
    - q_proj
    - k_proj
    - v_proj
    - o_proj
    - gate_proj
    - up_proj
    - down_proj
  lora_dropout: 0.05
  bias: none

training:
  batch_size: 4
  gradient_accumulation_steps: 4
  learning_rate: 2e-4
  num_epochs: 3
  warmup_steps: 100
  logging_steps: 10
  save_steps: 100
```

### Training Order (Recommended)

1. **afrique-v1** (PRIORITY - data already prepared, 2,000 examples)
2. **fut-v1** (FIFA - large user base)
3. **madrid-v1** (Real Madrid - established content)
4. **cuisine-v1** (African cuisine - niche but growing)

## How to Enable LoRA Support

### Step 1: Update RunPod Launch Parameters

1. Go to: https://www.runpod.io/console/pods
2. Click on pod: **redundant_lavender_alligator** (5x6ah8amw9oo9e)
3. Click **"Edit"** or **"Stop"** → **"Edit Template"**
4. Find **"Docker Command"** or **"Container Start Command"** section
5. Replace current parameters with the **Updated Launch Parameters** above
6. Click **"Save"** and **"Start Pod"**

### Step 2: Create Adapter Directories

SSH access is limited, so create directories via RunPod web terminal:

```bash
mkdir -p /workspace/lora-adapters/fut-v1
mkdir -p /workspace/lora-adapters/madrid-v1
mkdir -p /workspace/lora-adapters/afrique-v1
mkdir -p /workspace/lora-adapters/cuisine-v1
mkdir -p /workspace/training-data/fut
mkdir -p /workspace/training-data/madrid
mkdir -p /workspace/training-data/afrique
mkdir -p /workspace/training-data/cuisine
```

### Step 3: Verify LoRA Support

After restarting with new parameters:

```bash
curl -s https://5x6ah8amw9oo9e-8000.proxy.runpod.net/v1/models \
  -H "Authorization: Bearer sk-1234" | python3 -m json.tool
```

Should show 5 models:
- `Qwen/Qwen2.5-VL-7B-Instruct` (base)
- `fut-v1`
- `madrid-v1`
- `afrique-v1`
- `cuisine-v1`

## Expected Performance

### Memory Usage

- Base model: ~15GB VRAM
- Each LoRA adapter: ~50-100MB VRAM
- KV cache: ~7-8GB VRAM
- Total: ~23GB / 24GB (96% utilization)

### Inference Speed

- Base model: ~25-30 tokens/sec
- With LoRA: ~20-25 tokens/sec (minimal overhead)

### Cost

**Inference Pod** (24/7): $194.40/month
**Training Pod** (on-demand):
- ~2-3 hours per adapter
- ~$0.81 per adapter
- Total training cost: ~$3.24 (one-time)

**Total First Month**: $194.40 + $3.24 = **$197.64**
**Subsequent Months**: **$194.40** (inference only)

## Status Checklist

- [x] vLLM API working
- [x] Base model loaded (Qwen 2.5 VL 7B)
- [x] Authentication configured
- [x] Infrastructure documented
- [ ] LoRA support enabled (awaiting update)
- [ ] Training data prepared (afrique-v1 ready, others pending)
- [ ] Adapters trained (awaiting instruction)
- [ ] FastAPI routing layer built
- [ ] Multi-domain API integration

## Next Steps (When Ready)

1. **Enable LoRA** - Update launch parameters (see Step 1 above)
2. **Prepare training data** - Format datasets for all 4 domains
3. **Train adapters** - Start with afrique-v1 (data ready)
4. **Test inference** - Verify each adapter works correctly
5. **Build routing layer** - FastAPI service for domain-based routing
6. **Integrate with websites** - Connect 4 websites to appropriate adapters

## Support Commands

```bash
# Check if LoRA enabled
curl -s https://5x6ah8amw9oo9e-8000.proxy.runpod.net/v1/models \
  -H "Authorization: Bearer sk-1234"

# Test specific adapter
curl -X POST https://5x6ah8amw9oo9e-8000.proxy.runpod.net/v1/chat/completions \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{"model": "afrique-v1", "messages": [{"role": "user", "content": "Test"}]}'

# Check pod logs
runpodctl get pod 5x6ah8amw9oo9e --allfields

# Connect to training pod
runpodctl ssh connect 5x0b0iznq43xu4
```

## Notes

- Training will NOT start automatically
- Awaiting user instruction before training begins
- All configuration is documented and ready
- Estimated setup time: 15 minutes
- Estimated training time per adapter: 2-3 hours
