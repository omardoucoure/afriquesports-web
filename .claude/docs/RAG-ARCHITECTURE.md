# RAG Architecture for Afrique Sports

## Overview

Retrieval-Augmented Generation (RAG) system for Afrique Sports content, deployed on iMac (M3, 8GB RAM).

**Purpose**: Enable semantic search and content similarity detection across all Afrique Sports articles to improve:
- Content recommendations ("Articles similaires")
- Duplicate detection before publishing
- Topic clustering and trending analysis
- Context-aware content generation

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    WordPress CMS                             │
│                (cms.realdemadrid.com)                        │
│         155,527 posts across 3 languages (FR/EN/ES)         │
└────────────────────┬────────────────────────────────────────┘
                     │ REST API
                     │ (fetch articles)
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              INGESTION PIPELINE (Python)                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 1. Fetch Articles (batch of 100)                    │   │
│  │    - Title, content, excerpt, category, date        │   │
│  │    - Metadata (clicks, impressions from GSC)        │   │
│  └─────────────────────────────────────────────────────┘   │
│                     ↓                                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 2. Text Preprocessing                               │   │
│  │    - HTML stripping                                 │   │
│  │    - Truncate to 512 tokens (embedding limit)       │   │
│  │    - Combine: title + excerpt + content             │   │
│  └─────────────────────────────────────────────────────┘   │
│                     ↓                                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 3. Generate Embeddings                              │   │
│  │    Model: paraphrase-multilingual-mpnet-base-v2     │   │
│  │    - 768-dimensional vectors                        │   │
│  │    - Supports FR/EN/ES                              │   │
│  │    - Batch size: 32                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                     ↓                                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 4. Store in Vector DB                               │   │
│  │    ChromaDB collection: "afrique_sports_articles"   │   │
│  │    - Embeddings (768-dim)                           │   │
│  │    - Metadata (post_id, title, category, date)      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                     │
                     │ (stored locally)
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                  ChromaDB Vector Database                    │
│                  ~/afrique-sports-rag/chromadb               │
│                                                              │
│  Collection: afrique_sports_articles                         │
│  - 155,527 articles (target)                                │
│  - 768-dim embeddings per article                           │
│  - Metadata: post_id, title, category, date, locale         │
│  - Size estimate: ~1.2 GB                                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ (similarity search)
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              QUERY INTERFACE (FastAPI)                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Endpoints:                                          │   │
│  │  POST /search                                       │   │
│  │    - Query text (article title/content)            │   │
│  │    - Returns: top N similar articles               │   │
│  │                                                     │   │
│  │  POST /recommend                                    │   │
│  │    - Post ID                                        │   │
│  │    - Returns: related articles                     │   │
│  │                                                     │   │
│  │  POST /check-duplicate                              │   │
│  │    - Article title/content                         │   │
│  │    - Returns: potential duplicates (similarity > 90%)│  │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                     │
                     │ HTTP API
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              CLIENT APPLICATIONS                             │
│  - Next.js frontend (article recommendations)               │
│  - Content generation scripts (context retrieval)           │
│  - WordPress plugin (duplicate detection)                   │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. Ingestion Pipeline

**Script**: `~/afrique-sports-rag/scripts/ingest_articles.py`

**What it does**:
1. Fetches articles from WordPress REST API in batches
2. Preprocesses text (HTML stripping, truncation)
3. Generates embeddings using sentence-transformers
4. Stores in ChromaDB with metadata

**Execution**:
```bash
# Initial ingestion (all articles)
python scripts/ingest_articles.py --initial

# Incremental update (last 7 days)
python scripts/ingest_articles.py --incremental --days=7
```

**Cron job** (daily at 3 AM):
```bash
0 3 * * * cd ~/afrique-sports-rag && python scripts/ingest_articles.py --incremental --days=1
```

### 2. Vector Database (ChromaDB)

**Why ChromaDB**:
- ✅ Lightweight (perfect for 8GB iMac)
- ✅ Persistent storage (no external server needed)
- ✅ Fast similarity search (cosine similarity)
- ✅ Python-native (easy integration)
- ✅ Metadata filtering (category, date, locale)

**Collection schema**:
```python
{
  "collection": "afrique_sports_articles",
  "embeddings": [768-dim vector],
  "metadata": {
    "post_id": int,
    "title": str,
    "category": str,
    "date": str (ISO 8601),
    "locale": str (fr/en/es),
    "clicks": int (from GSC),
    "url": str
  },
  "documents": str (title + excerpt for display)
}
```

**Storage path**: `~/afrique-sports-rag/chromadb/`

**Size estimate**:
- 155,527 articles × 768 dimensions × 4 bytes (float32) = ~477 MB
- Metadata: ~50 MB
- ChromaDB index: ~200 MB
- **Total: ~730 MB** (easily fits in 8GB RAM)

### 3. Embedding Model

**Model**: `sentence-transformers/paraphrase-multilingual-mpnet-base-v2`

**Why this model**:
- ✅ Multilingual (FR/EN/ES support)
- ✅ High quality embeddings (50+ languages)
- ✅ Small size (420 MB)
- ✅ Fast inference (M3 chip optimized)
- ✅ Pre-trained on paraphrase detection (perfect for article similarity)

**Alternatives considered**:
- ❌ `all-MiniLM-L6-v2` - English only
- ❌ `multilingual-e5-large` - Too large (2.2 GB)
- ❌ OpenAI embeddings - Requires API calls (cost + latency)

### 4. Query API (FastAPI)

**Script**: `~/afrique-sports-rag/api/main.py`

**Endpoints**:

#### POST /search
Search for articles similar to a query text.

```python
# Request
{
  "query": "Osimhen marque un triplé",
  "top_k": 10,
  "filters": {
    "category": "afrique",
    "locale": "fr",
    "date_range": {
      "start": "2024-01-01",
      "end": "2025-12-31"
    }
  }
}

# Response
{
  "results": [
    {
      "post_id": 851539,
      "title": "Osimhen signe un triplé historique",
      "category": "afrique/nigeria",
      "similarity_score": 0.92,
      "url": "https://www.afriquesports.net/afrique/nigeria/osimhen-triple"
    },
    ...
  ],
  "query_time_ms": 45
}
```

#### POST /recommend
Get recommended articles for a specific post.

```python
# Request
{
  "post_id": 851539,
  "top_k": 5,
  "exclude_same_category": false
}

# Response
{
  "results": [
    {
      "post_id": 849201,
      "title": "Osimhen élu meilleur buteur africain",
      "similarity_score": 0.88,
      "url": "..."
    },
    ...
  ]
}
```

#### POST /check-duplicate
Check if content is similar to existing articles (duplicate detection).

```python
# Request
{
  "title": "Mané rejoint Al-Nassr",
  "content": "Sadio Mané a signé avec Al-Nassr...",
  "threshold": 0.90
}

# Response
{
  "is_duplicate": true,
  "matches": [
    {
      "post_id": 845012,
      "title": "Officiel: Mané signe à Al-Nassr",
      "similarity_score": 0.95,
      "url": "..."
    }
  ]
}
```

**Run API**:
```bash
cd ~/afrique-sports-rag
uvicorn api.main:app --host 0.0.0.0 --port 8080 --reload
```

**Access**:
- API: http://192.168.2.217:8080
- Docs: http://192.168.2.217:8080/docs

## Installation

### 1. Create project directory on iMac

```bash
ssh imac

# Create project structure
mkdir -p ~/afrique-sports-rag/{scripts,api,data,chromadb,.cache}
cd ~/afrique-sports-rag
```

### 2. Install Python dependencies

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install packages
pip install --upgrade pip
pip install chromadb sentence-transformers fastapi uvicorn requests python-dotenv tqdm
```

**Dependency list**:
- `chromadb>=0.4.22` - Vector database
- `sentence-transformers>=2.2.2` - Embedding model
- `fastapi>=0.109.0` - API framework
- `uvicorn>=0.27.0` - ASGI server
- `requests>=2.31.0` - HTTP client for WordPress API
- `python-dotenv>=1.0.0` - Environment variables
- `tqdm>=4.66.0` - Progress bars

### 3. Download embedding model

```bash
# Download and cache model (420 MB)
python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('sentence-transformers/paraphrase-multilingual-mpnet-base-v2')"
```

## Usage Patterns

### Pattern 1: Content Recommendations

**Use case**: Show "Articles similaires" on article pages

```python
import requests

response = requests.post('http://192.168.2.217:8080/recommend', json={
    'post_id': 851539,
    'top_k': 5
})

similar_articles = response.json()['results']
```

### Pattern 2: Duplicate Detection

**Use case**: Check if article already exists before publishing

```python
response = requests.post('http://192.168.2.217:8080/check-duplicate', json={
    'title': 'Osimhen triple buteur',
    'content': article_content,
    'threshold': 0.85
})

if response.json()['is_duplicate']:
    print("Warning: Similar article already exists!")
```

### Pattern 3: Semantic Search

**Use case**: Search articles by meaning, not just keywords

```python
response = requests.post('http://192.168.2.217:8080/search', json={
    'query': 'meilleurs attaquants africains',
    'top_k': 20,
    'filters': {'locale': 'fr'}
})

articles = response.json()['results']
```

### Pattern 4: RAG for Content Generation

**Use case**: Retrieve context for AI content generation

```python
# Find similar articles for context
response = requests.post('http://192.168.2.217:8080/search', json={
    'query': 'Top 10 des milieux de terrain 2025',
    'top_k': 3
})

# Use retrieved articles as context in prompt
context = "\n\n".join([
    f"Article: {r['title']}\n{r['excerpt']}"
    for r in response.json()['results']
])

prompt = f"""Context from previous articles:
{context}

Now write a new article about: {topic}
"""
```

## Performance Considerations

### iMac M3 (8GB RAM) Capacity

**Estimated performance**:
- **Ingestion**: ~1,000 articles/hour
- **Query latency**: 20-50ms per search
- **Memory usage**: ~1.5 GB (model + DB + Python)
- **Storage**: ~1.2 GB total

**Bottlenecks**:
1. **RAM**: 8 GB is sufficient but not abundant
   - Solution: Use swap if needed (M3 SSD is fast)
2. **Embedding generation**: CPU-bound on M3
   - Solution: Batch processing (32 articles at a time)
3. **Initial ingestion**: 155k articles = ~155 hours
   - Solution: Run overnight/background (3-4 days total)

### Optimization Strategies

1. **Incremental updates**: Only process new articles
2. **Batch processing**: Embed 32 articles at once
3. **Lazy loading**: Load model only when needed
4. **Cache queries**: Store frequent searches
5. **Background processing**: Run ingestion during off-hours

## Monitoring

### Health check script

```bash
# ~/afrique-sports-rag/scripts/check_health.sh
curl -s http://localhost:8080/health || echo "API is down"
```

### Storage monitoring

```bash
du -sh ~/afrique-sports-rag/chromadb
# Expected: ~730 MB when fully populated
```

### Performance metrics

```bash
# Check API response time
time curl -X POST http://localhost:8080/search \
  -H "Content-Type: application/json" \
  -d '{"query": "test", "top_k": 10}'
```

## Maintenance

### Daily tasks (automated via cron)

```bash
# 3 AM: Ingest yesterday's articles
0 3 * * * cd ~/afrique-sports-rag && venv/bin/python scripts/ingest_articles.py --incremental --days=1

# 4 AM: Vacuum ChromaDB (cleanup)
0 4 * * 0 cd ~/afrique-sports-rag && venv/bin/python scripts/vacuum_db.py
```

### Weekly tasks

- Check disk usage
- Review API logs
- Monitor error rates

### Monthly tasks

- Full database backup
- Performance benchmarking
- Model updates (if available)

## Security

### API Security

```python
# Add API key authentication
from fastapi import Header, HTTPException

async def verify_api_key(x_api_key: str = Header(...)):
    if x_api_key != os.getenv("RAG_API_KEY"):
        raise HTTPException(status_code=403, detail="Invalid API key")
```

### Network Access

- **Internal only**: Bind to localhost or local network (192.168.2.x)
- **No public exposure**: iMac is behind router firewall
- **SSH tunnel**: For remote access from MacBook Pro

## Future Enhancements

### Phase 2: Advanced Features

1. **Multi-modal embeddings**: Include images (player photos, match screenshots)
2. **Topic clustering**: Automatic category suggestions
3. **Trending detection**: Identify rising topics
4. **Automatic tagging**: Suggest tags based on content

### Phase 3: Integration

1. **WordPress plugin**: One-click "Find similar articles"
2. **Next.js middleware**: Server-side recommendations
3. **Content calendar**: Suggest topics based on gaps

### Phase 4: Scale

1. **Hybrid search**: Combine semantic + keyword search
2. **Re-ranking**: Use clicks/engagement to boost results
3. **A/B testing**: Compare recommendation algorithms
4. **Analytics dashboard**: Track RAG performance

## References

- ChromaDB docs: https://docs.trychroma.com/
- Sentence Transformers: https://www.sbert.net/
- Multilingual MPNet model: https://huggingface.co/sentence-transformers/paraphrase-multilingual-mpnet-base-v2
- FastAPI docs: https://fastapi.tiangolo.com/
