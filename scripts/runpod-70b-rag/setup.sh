#!/bin/bash
# RunPod 70B + RAG Setup Script
# Run this after SSH into your RunPod pod

set -e

echo "=============================================="
echo "  AFRIQUE SPORTS - 70B + RAG SETUP"
echo "=============================================="

# Create directory structure
echo -e "\n📁 Creating directories..."
mkdir -p /workspace/{chromadb,models,lora-adapters,rag-api,scripts,data}

# Install system dependencies
echo -e "\n📦 Installing system dependencies..."
apt-get update && apt-get install -y \
    git \
    wget \
    curl \
    htop \
    nvtop \
    tmux \
    screen \
    sqlite3 \
    --no-install-recommends

# Install Python packages
echo -e "\n🐍 Installing Python packages..."
pip install --upgrade pip
pip install \
    vllm \
    fastapi \
    uvicorn \
    chromadb \
    sentence-transformers \
    pydantic \
    python-multipart \
    httpx \
    aiohttp \
    transformers \
    accelerate \
    bitsandbytes \
    torch \
    --quiet

# Install Axolotl for fine-tuning (optional)
echo -e "\n🔧 Installing Axolotl for fine-tuning..."
pip install axolotl --quiet || echo "Axolotl install failed - will install later if needed"

# Download embedding model for RAG
echo -e "\n📥 Downloading embedding model..."
python3 << 'EOF'
from sentence_transformers import SentenceTransformer
print("Downloading multilingual embedding model...")
model = SentenceTransformer('sentence-transformers/paraphrase-multilingual-mpnet-base-v2')
model.save('/workspace/models/embeddings')
print("✅ Embedding model downloaded")
EOF

# Create RAG API
echo -e "\n📝 Creating RAG API..."
cat > /workspace/rag-api/main.py << 'RAGAPI'
"""
RAG API for Afrique Sports
Provides semantic search over 23k+ African football articles
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import chromadb
from sentence_transformers import SentenceTransformer
import os

app = FastAPI(title="Afrique Sports RAG API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize
CHROMADB_PATH = "/workspace/chromadb"
EMBEDDING_MODEL_PATH = "/workspace/models/embeddings"
COLLECTION_NAME = "afrique_sports_articles"

# Load models
print("Loading embedding model...")
embedder = SentenceTransformer(EMBEDDING_MODEL_PATH)
print("Connecting to ChromaDB...")
client = chromadb.PersistentClient(path=CHROMADB_PATH)

try:
    collection = client.get_collection(COLLECTION_NAME)
    print(f"✅ Loaded collection with {collection.count()} documents")
except:
    collection = client.create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"}
    )
    print("⚠️ Created empty collection - need to sync data")

class SearchRequest(BaseModel):
    query: str
    limit: int = 5
    source: Optional[str] = None

class ContextRequest(BaseModel):
    query: str
    limit: int = 3
    max_chars: int = 4000

class SearchResult(BaseModel):
    id: str
    title: str
    content: str
    source: str
    score: float

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "collection": COLLECTION_NAME,
        "documents": collection.count()
    }

@app.get("/stats")
async def stats():
    return {
        "collection": COLLECTION_NAME,
        "documents": collection.count(),
        "embedding_model": "paraphrase-multilingual-mpnet-base-v2"
    }

@app.post("/search", response_model=List[SearchResult])
async def search(request: SearchRequest):
    """Search for relevant articles"""
    query_embedding = embedder.encode(request.query).tolist()

    where_filter = None
    if request.source:
        where_filter = {"source": request.source}

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=request.limit,
        where=where_filter,
        include=["documents", "metadatas", "distances"]
    )

    search_results = []
    for i in range(len(results["ids"][0])):
        search_results.append(SearchResult(
            id=results["ids"][0][i],
            title=results["metadatas"][0][i].get("title", ""),
            content=results["documents"][0][i][:500],
            source=results["metadatas"][0][i].get("source", ""),
            score=1 - results["distances"][0][i]  # Convert distance to similarity
        ))

    return search_results

@app.post("/context")
async def get_context(request: ContextRequest):
    """Get context for LLM generation"""
    query_embedding = embedder.encode(request.query).tolist()

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=request.limit,
        include=["documents", "metadatas"]
    )

    context_parts = []
    total_chars = 0

    for i in range(len(results["ids"][0])):
        doc = results["documents"][0][i]
        title = results["metadatas"][0][i].get("title", "")
        source = results["metadatas"][0][i].get("source", "")

        entry = f"[Source: {source}]\n{title}\n{doc}\n"

        if total_chars + len(entry) > request.max_chars:
            break

        context_parts.append(entry)
        total_chars += len(entry)

    return {
        "context": "\n---\n".join(context_parts),
        "sources_used": len(context_parts),
        "total_chars": total_chars
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8100)
RAGAPI

# Create start scripts
echo -e "\n📝 Creating start scripts..."

# Start vLLM
cat > /workspace/scripts/start-vllm.sh << 'VLLMSCRIPT'
#!/bin/bash
echo "🚀 Starting vLLM with Llama-3.1-70B-Instruct..."

# Check GPU memory
nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits | head -1

python -m vllm.entrypoints.openai.api_server \
    --model meta-llama/Llama-3.1-70B-Instruct \
    --tensor-parallel-size 1 \
    --dtype bfloat16 \
    --gpu-memory-utilization 0.95 \
    --max-model-len 8192 \
    --host 0.0.0.0 \
    --port 8000 \
    --api-key sk-afrique \
    --enable-auto-tool-choice \
    --tool-call-parser hermes
VLLMSCRIPT
chmod +x /workspace/scripts/start-vllm.sh

# Start RAG
cat > /workspace/scripts/start-rag.sh << 'RAGSCRIPT'
#!/bin/bash
echo "🚀 Starting RAG API..."
cd /workspace/rag-api
python main.py
RAGSCRIPT
chmod +x /workspace/scripts/start-rag.sh

# Start all services
cat > /workspace/scripts/start-all.sh << 'ALLSCRIPT'
#!/bin/bash
echo "🚀 Starting all services..."

# Start vLLM in background
echo "Starting vLLM..."
screen -dmS vllm bash -c '/workspace/scripts/start-vllm.sh'

# Wait for vLLM to initialize
echo "Waiting 60s for vLLM to load model..."
sleep 60

# Start RAG
echo "Starting RAG API..."
screen -dmS rag bash -c '/workspace/scripts/start-rag.sh'

echo ""
echo "✅ Services started!"
echo ""
echo "📊 Check status:"
echo "   screen -r vllm   # vLLM logs"
echo "   screen -r rag    # RAG logs"
echo ""
echo "🔗 Endpoints:"
echo "   vLLM: http://localhost:8000/v1"
echo "   RAG:  http://localhost:8100"
ALLSCRIPT
chmod +x /workspace/scripts/start-all.sh

# Create symlinks
ln -sf /workspace/scripts/start-vllm.sh /workspace/start-vllm.sh
ln -sf /workspace/scripts/start-rag.sh /workspace/start-rag.sh
ln -sf /workspace/scripts/start-all.sh /workspace/start-all.sh

echo ""
echo "=============================================="
echo "  ✅ SETUP COMPLETE"
echo "=============================================="
echo ""
echo "Next steps:"
echo "1. Sync RAG data from iMac (run sync-rag-data.sh on your Mac)"
echo "2. Start services: ./start-all.sh"
echo "3. Test endpoints"
echo ""
echo "GPU Info:"
nvidia-smi --query-gpu=name,memory.total --format=csv
