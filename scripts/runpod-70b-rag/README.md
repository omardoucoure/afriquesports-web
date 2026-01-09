# RunPod 70B + RAG Setup for Afrique Sports

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    RUNPOD POD (A100 80GB)                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   ChromaDB   │───▶│  RAG API     │───▶│   vLLM       │  │
│  │  (23k docs)  │    │  (FastAPI)   │    │  (70B model) │  │
│  │  Port 8200   │    │  Port 8100   │    │  Port 8000   │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Network Volume (/workspace)              │  │
│  │  - /workspace/chromadb (vector database)             │  │
│  │  - /workspace/models (cached models)                 │  │
│  │  - /workspace/lora-adapters (fine-tuned adapters)    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. vLLM Server (Port 8000)
- Model: `meta-llama/Llama-3.1-70B-Instruct`
- GPU: A100 80GB (required for 70B)
- Features: OpenAI-compatible API, fast inference

### 2. RAG API (Port 8100)
- FastAPI server
- ChromaDB for vector storage
- Multilingual embeddings (FR/EN/ES)
- 23,196 African football articles

### 3. Fine-tuning (Optional)
- Axolotl for LoRA training
- Train on your best journalist articles
- Adapters stored in /workspace/lora-adapters

## Quick Start

### Step 1: Create RunPod Pod

1. Go to RunPod: https://www.runpod.io/console/pods
2. Click "Deploy"
3. Select: **A100 80GB** (~$1.89/hr)
4. Template: **RunPod Pytorch 2.1** (not vLLM template)
5. Network Volume: Create new 100GB volume
6. Deploy

### Step 2: SSH and Setup

```bash
# SSH to pod
ssh root@<POD_IP> -p <PORT>

# Run setup script
curl -sSL https://raw.githubusercontent.com/... | bash
# OR copy setup.sh manually
```

### Step 3: Start Services

```bash
# Start all services
./start-services.sh

# Or individually:
./start-vllm.sh      # Start 70B model
./start-rag.sh       # Start RAG API
```

## API Endpoints

### vLLM (Port 8000)
```bash
# Chat completion
curl https://<POD_ID>-8000.proxy.runpod.net/v1/chat/completions \
  -H "Authorization: Bearer sk-afrique" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "meta-llama/Llama-3.1-70B-Instruct",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

### RAG API (Port 8100)
```bash
# Search articles
curl https://<POD_ID>-8100.proxy.runpod.net/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Sadio Mane Bayern", "limit": 5}'

# Get context for LLM
curl https://<POD_ID>-8100.proxy.runpod.net/context \
  -H "Content-Type: application/json" \
  -d '{"query": "Jude Bellingham Real Madrid", "limit": 3}'
```

## Cost Estimate

| Resource | Cost/hr | Daily (8hr) | Monthly |
|----------|---------|-------------|---------|
| A100 80GB | $1.89 | $15.12 | ~$450 |
| Storage 100GB | $0.07 | $0.56 | ~$17 |
| **Total** | **$1.96** | **$15.68** | **~$470** |

**Per article generation:** ~$0.02-0.05 (including RAG lookup)

## Files

- `setup.sh` - Initial pod setup script
- `start-services.sh` - Start all services
- `start-vllm.sh` - Start vLLM server
- `start-rag.sh` - Start RAG API
- `sync-rag-data.sh` - Sync RAG data from iMac
- `requirements.txt` - Python dependencies
