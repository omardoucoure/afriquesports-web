# RAG Content Generation System - Setup Guide

This guide explains how to set up and use the RAG (Retrieval Augmented Generation) content generation system.

---

## Environment Variables

Add these variables to your `.env.local` file:

```bash
# ============================================================================
# RAG CONTENT GENERATION
# ============================================================================

# Ollama Configuration (iMac M3)
OLLAMA_ENDPOINT=http://192.168.2.217:11434
OLLAMA_MODEL=qwen2.5:14b

# Admin Authentication
# Generate a secure random token: openssl rand -hex 32
ADMIN_TOKEN=your-secure-random-token-here

# WordPress Credentials (already exists, but required for publishing)
WP_COMMENT_USERNAME=admin
WP_COMMENT_APP_PASSWORD=your-wordpress-app-password
```

---

## System Overview

The RAG system generates high-quality football content using:

- **Model**: qwen2.5:14b (9GB) on iMac M3 with Metal acceleration
- **Context Sources**:
  - WordPress (100k+ articles)
  - ESPN API (live scores, stats)
  - MySQL (match commentary, pre-match analysis)
  - Trending (popular articles)
- **Content Types**:
  - Match previews
  - Match reports
  - News articles
  - Player profiles
  - Rankings / Top lists
- **Locales**: French (FR), English (EN), Spanish (ES), Arabic (AR)

---

## Architecture

```
Admin UI → API Routes → RAG Generator → Ollama (iMac)
                ↓
         Context Retriever
         ├─ WordPress (articles)
         ├─ ESPN (stats, scores)
         ├─ MySQL (commentary)
         └─ Trending (popular content)
```

---

## API Endpoints

### 1. Generate Content

```http
POST /api/rag/generate
Authorization: Bearer {ADMIN_TOKEN}
Content-Type: application/json

{
  "contentType": "match-preview",
  "locale": "fr",
  "params": {
    "homeTeam": "Senegal",
    "awayTeam": "Cameroon",
    "competition": "CAN 2025",
    "matchDate": "2025-01-15"
  }
}
```

**Response:**
```json
{
  "success": true,
  "content": "<p>Article content in HTML...</p>",
  "metadata": {
    "contextItemsUsed": 12,
    "totalTokensContext": 3456,
    "generationTokens": 850,
    "durationMs": 28000,
    "tokensPerSecond": 30.4,
    "sources": ["wordpress", "espn", "mysql", "trending"]
  }
}
```

### 2. Publish as Draft

```http
POST /api/rag/publish-draft
Authorization: Bearer {ADMIN_TOKEN}
Content-Type: application/json

{
  "title": "Senegal vs Cameroon: Preview of the big match",
  "content": "<p>Generated content...</p>",
  "locale": "fr",
  "categories": [102205],
  "tags": [],
  "metadata": {
    "contentType": "match-preview",
    "generatedAt": "2025-01-15T10:00:00Z",
    "model": "qwen2.5:14b"
  }
}
```

**Response:**
```json
{
  "success": true,
  "postId": 123456,
  "editLink": "https://cms.realdemadrid.com/afriquesports/wp-admin/post.php?post=123456&action=edit"
}
```

---

## Content Types & Parameters

### Match Preview

**Parameters:**
- `homeTeam` (required): Home team name
- `awayTeam` (required): Away team name
- `competition` (required): Competition name (e.g., "CAN 2025")
- `matchDate` (required): Match date (YYYY-MM-DD)
- `matchId` (optional): Match ID for MySQL context
- `homeTeamId` (optional): Home team ID for ESPN stats
- `awayTeamId` (optional): Away team ID for ESPN stats

**Output:** 600-800 words
- Introduction
- Team form analysis
- Head-to-head record
- Tactical preview
- Prediction

### Match Report

**Parameters:**
- `homeTeam` (required): Home team name
- `awayTeam` (required): Away team name
- `score` (required): Final score (e.g., "2-1")
- `competition` (required): Competition name
- `matchDate` (required): Match date
- `matchId` (optional): Match ID for commentary

**Output:** 600-800 words
- Match result summary
- Match flow narrative
- Key moments (goals, cards, subs)
- Man of the match
- Consequences

### News Article

**Parameters:**
- `topic` (required): Article topic/subject
- `keywords` (required): Array of keywords
- `region` (optional): Geographical focus (e.g., "West Africa")

**Output:** 500-700 words
- Lead paragraph (summary)
- Development
- Context/background
- Reactions/perspectives

### Player Profile

**Parameters:**
- `playerName` (required): Player's full name
- `team` (required): Current team
- `position` (optional): Playing position
- `nationality` (optional): Player nationality

**Output:** 600-800 words
- Introduction
- Career path
- Playing style analysis
- Statistics
- Future prospects

### Ranking / Top List

**Parameters:**
- `topic` (required): Ranking topic (e.g., "Top 10 African Footballers 2025")
- `criteria` (required): Ranking criteria (e.g., "Performance, goals, assists, impact")
- `count` (optional): Number of items in ranking (e.g., 10)
- `region` (optional): Geographical focus (e.g., "West Africa", "North Africa")
- `timeframe` (optional): Time period (e.g., "2025", "Last season", "All time")

**Output:** 600-800 words
- Introduction (presenting the ranking)
- Detailed numbered ranking (1., 2., 3., etc.)
- Justification for each position with factual data
- Comparative analysis
- Conclusion

**Examples:**
- "Top 10 African Goalkeepers CAN 2025"
- "Best Young African Players 2025"
- "Most Valuable African Footballers"
- "Top African Defenders in Europe"

---

## Admin UI

Access at: `/admin/content-generator`

**Features:**
- Content type selector
- Locale selector (FR/EN/ES/AR)
- Dynamic form fields
- Real-time generation
- Content preview
- One-click draft publishing
- Generation metadata display

---

## Performance Targets

- **Context retrieval**: < 2 seconds
- **Content generation**: 20-30 seconds
- **Total end-to-end**: < 35 seconds
- **Success rate**: > 95%
- **Token efficiency**: 70-80% of 4K context budget

---

## Quality Assurance

**Before publishing:**
1. ✅ Generate test articles (5 per content type)
2. ✅ Manual review by human editor
3. ✅ Verify no hallucinations or false stats
4. ✅ Check writing style matches Afrique Sports tone
5. ✅ Test multi-locale (FR, EN, ES)

**All generated content is published as DRAFT** - manual review required before publishing live.

---

## Troubleshooting

### Error: "Ollama not available"

**Causes:**
- iMac is offline or sleeping
- Ollama service not running on iMac
- Network connectivity issue

**Solutions:**
```bash
# On iMac, check if Ollama is running:
ssh imac 'pgrep -f Ollama || open -a Ollama'

# Test endpoint:
curl http://192.168.2.217:11434/api/tags
```

### Error: "No relevant context found"

**Causes:**
- WordPress API is down
- MySQL database unavailable
- ESPN API rate limit reached

**Solutions:**
- Check WordPress CMS status
- Verify MySQL connection
- Wait a few minutes for ESPN API rate limit reset

### Error: "Unauthorized"

**Cause:** Invalid or missing ADMIN_TOKEN

**Solution:**
- Verify ADMIN_TOKEN in .env.local
- Ensure token matches in UI and server

---

## Monitoring

### Check Generation Logs

```bash
# On production server (DigitalOcean):
ssh root@159.223.103.16
pm2 logs afriquesports-web --lines 100 | grep '\[RAG'
```

### Check Ollama Status (iMac)

```bash
ssh imac

# Check if model is loaded:
ollama ps

# Check Ollama logs:
tail -f ~/Library/Logs/Ollama/server.log
```

---

## Security

- ✅ Bearer token authentication (ADMIN_TOKEN)
- ✅ All drafts saved for manual review
- ✅ No auto-publishing to live site
- ✅ Generation metadata tracked in WordPress custom fields
- ✅ Content type and model recorded

---

## Future Enhancements

- **Batch generation**: Queue system for 10+ articles
- **Scheduled generation**: Cron jobs for pre-match articles
- **Auto-categorization**: AI-suggested categories/tags
- **Featured image selection**: Auto-select from WordPress media
- **SEO optimization**: Auto-generate meta descriptions
- **Analytics dashboard**: Track generation stats, quality metrics

---

_Last updated: 2025-01-06_
