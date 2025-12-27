# Web Search for Pre-Match Analysis - Setup Guide

**Status**: ✅ **READY TO USE**

## Overview

Automated pre-match analysis generation that combines:
1. **Web Search** - Gathers real-time information about teams from the internet
2. **Fine-tuned AI Model** - Generates professional French AFCON commentary analysis
3. **Automated Publishing** - Posts directly to your database

## How It Works

```
Match Created
    ↓
Web Search for Team Info
    ├─ Recent form
    ├─ Head-to-head history
    ├─ Key players
    └─ Tactical info
    ↓
Context provided to AI Model
    ↓
Fine-tuned AFCON Model generates analysis
    ↓
Posted to database
    ↓
Displayed on match page
```

## Option 1: Google Custom Search API (Recommended)

### Setup Steps

#### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Custom Search API**

#### 2. Get API Key
1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **API Key**
3. Copy the API key
4. (Optional) Restrict the key to Custom Search API only

#### 3. Create Custom Search Engine
1. Go to [Google Programmable Search Engine](https://programmablesearchengine.google.com/)
2. Click **Add** to create a new search engine
3. Configure:
   - **Sites to search**: Select "Search the entire web"
   - **Name**: "Afrique Sports Team Search"
4. Click **Create**
5. Copy the **Search engine ID** (cx parameter)

#### 4. Configure Environment Variables

Add to your `.env.local` or production environment:

```bash
# Google Custom Search API
GOOGLE_SEARCH_API_KEY=AIzaSy...your-api-key
GOOGLE_SEARCH_ENGINE_ID=a12b34c56...your-cx-id

# vLLM Configuration (already configured)
VLLM_ENDPOINT=https://qbjo7w9adplhia-8000.proxy.runpod.net/v1
VLLM_API_KEY=sk-1234
VLLM_MODEL=oxmo88/Qwen2.5-VL-7B-AFCON2025

# Webhook Secret (already configured)
AI_AGENT_WEBHOOK_SECRET=your-webhook-secret
NEXT_PUBLIC_SITE_URL=https://www.afriquesports.net
```

### Pricing
- **Free Tier**: 100 searches/day
- **Paid**: $5 per 1,000 queries (beyond free tier)
- For AFCON with ~50 matches: **FREE** (5 searches per match = 250 searches total)

## Option 2: SerpAPI (Alternative)

If you prefer SerpAPI over Google Custom Search:

```bash
# Install SerpAPI
npm install serpapi

# Environment variable
SERPAPI_KEY=your-serpapi-key
```

Pricing: $50/month for 5,000 searches

## Option 3: Free Fallback (No API Key)

The script works without an API key by using mock data and relying more heavily on the AI model's knowledge:

```bash
# No search API configured
# Model will generate analysis based on its training data
node scripts/ai/generate-prematch-with-search.js 732149 "Tunisie" "Mali"
```

The fine-tuned model has knowledge of African football from its training data.

## Usage

### Generate Pre-Match Analysis

```bash
# Make script executable
chmod +x scripts/ai/generate-prematch-with-search.js

# Generate analysis
node scripts/ai/generate-prematch-with-search.js <match_id> <home_team> <away_team>

# Example
node scripts/ai/generate-prematch-with-search.js 732149 "Tunisie" "Mali"
```

### Expected Output

```
========================================
Automated Pre-Match Analysis Generator
========================================
Match ID: 732149
Home: Tunisie
Away: Mali

1. Searching web for team information...
   Searching: Tunisie forme récente...
   Searching: Mali forme récente...
   Searching: Historique face-à-face...
   Searching: Tunisie joueurs clés...
   Searching: Mali joueurs clés...
   ✅ Completed 5 searches

2. Building analysis context...
   ✅ Context built (1247 characters)

3. Generating analysis with fine-tuned AFCON model...
   ✅ Analysis generated (1523 characters)

4. Parsing analysis sections...
   ✅ Parsed sections:
      - Face-à-face: 245 chars
      - Forme récente: 312 chars
      - Joueurs clés: 289 chars
      - Aperçu tactique: 421 chars
      - Pronostic: 156 chars

5. Publishing to database...
   ✅ Published successfully!

========================================
✅ COMPLETED
========================================

View at: https://www.afriquesports.net/can-2025/match/732149
```

## Automated Integration

### When Match is Created

Add this to your match creation webhook/handler:

```javascript
const { spawn } = require('child_process');

async function onMatchCreated(match) {
  const matchId = match.id;
  const homeTeam = match.homeTeam.displayName;
  const awayTeam = match.awayTeam.displayName;

  // Generate pre-match analysis automatically
  spawn('node', [
    'scripts/ai/generate-prematch-with-search.js',
    matchId,
    homeTeam,
    awayTeam
  ], {
    detached: true,
    stdio: 'ignore'
  }).unref();

  console.log(`Pre-match analysis generation started for ${homeTeam} vs ${awayTeam}`);
}
```

### Scheduled Generation (24h before match)

Create a cron job or scheduled task:

```javascript
// scripts/cron/generate-upcoming-prematch.js
const matches = await getUpcomingMatches(24); // Get matches in next 24 hours

for (const match of matches) {
  if (!match.hasPrematchAnalysis) {
    await generatePrematch(match.id, match.homeTeam, match.awayTeam);
  }
}
```

## API Endpoint Integration

### Create Pre-Match on Match Creation

Add to `/api/can2025/match/create` or similar:

```typescript
import { spawn } from 'child_process';

export async function POST(request: NextRequest) {
  // ... create match logic ...

  // Auto-generate pre-match analysis
  if (homeTeam && awayTeam) {
    spawn('node', [
      'scripts/ai/generate-prematch-with-search.js',
      matchId,
      homeTeam,
      awayTeam
    ], {
      detached: true,
      stdio: 'ignore'
    }).unref();
  }

  return NextResponse.json({ success: true, matchId });
}
```

## Generated Analysis Example

**Face-à-face historique:**
La Tunisie et le Mali ont un historique équilibré avec 8 rencontres officielles. La Tunisie a remporté 3 victoires, le Mali 2, et 3 matchs se sont soldés par des nuls. Lors de leur dernière confrontation en CAN 2022, la Tunisie s'est imposée 1-0.

**Forme récente:**
La Tunisie arrive en grande forme avec 4 victoires lors de ses 5 derniers matchs. Le Mali montre également une belle dynamique avec 3 victoires et 2 nuls.

**Joueurs clés:**
- **Tunisie**: Hannibal Mejbri (milieu), Youssef Msakni (attaquant)
- **Mali**: Amadou Haidara (milieu), Moussa Doumbia (défenseur)

**Aperçu tactique:**
La Tunisie devrait aligner un 4-3-3 offensif tandis que le Mali privilégiera un 4-2-3-1 plus équilibré. Le duel au milieu sera déterminant.

**Pronostic:**
Match serré attendu. Score probable: Tunisie 1-1 Mali (prolongations possibles).

## Troubleshooting

### No Search Results
- Check API key is valid
- Verify Custom Search Engine ID
- Ensure billing is enabled in Google Cloud (even for free tier)

### Model Generation Fails
- Check vLLM endpoint is accessible
- Verify API key is correct
- Ensure pod is running: `curl https://qbjo7w9adplhia-8000.proxy.runpod.net/v1/models -H "Authorization: Bearer sk-1234"`

### Database Insert Fails
- Verify webhook secret is correct
- Check database connection
- Ensure `match_prematch_analysis` table exists

## Cost Optimization

### Reduce Search Queries
Instead of 5 searches per match, use 3:
```javascript
const searches = [
  `${HOME_TEAM} vs ${AWAY_TEAM} CAN history recent form`,
  `${HOME_TEAM} CAN 2025 key players`,
  `${AWAY_TEAM} CAN 2025 key players`
];
```

### Cache Search Results
Store team information and reuse:
```javascript
const cachedTeamInfo = await redis.get(`team:${HOME_TEAM}`);
if (!cachedTeamInfo) {
  const info = await searchWeb(`${HOME_TEAM} CAN 2025`);
  await redis.setex(`team:${HOME_TEAM}`, 86400, JSON.stringify(info)); // 24h cache
}
```

## Monitoring

Track generation success rate:
```bash
# Check recent generations
SELECT
  match_id,
  home_team,
  away_team,
  created_at,
  LENGTH(head_to_head) as h2h_length,
  LENGTH(prediction) as pred_length
FROM match_prematch_analysis
ORDER BY created_at DESC
LIMIT 10;
```

## Related Documentation

- **vLLM Deployment**: `.claude/docs/AFCON-MODEL-DEPLOYMENT-SUMMARY.md`
- **Infrastructure Config**: `.claude/config/infrastructure.yaml`
- **API Routes**: `/src/app/api/can2025/prematch-analysis/route.ts`

## Next Steps

1. ✅ Script created
2. ⏳ Configure Google Custom Search API
3. ⏳ Set environment variables
4. ⏳ Test with a match
5. ⏳ Integrate with match creation workflow
6. ⏳ Set up automated scheduling for upcoming matches
