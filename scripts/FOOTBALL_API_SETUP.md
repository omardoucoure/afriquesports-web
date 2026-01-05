# Football API Setup Guide

This guide explains how to set up real-time football data fetching for content generation.

## Overview

The system fetches **up-to-date player and team data** from API-Football before generating content with Qwen 2.5 14B, ensuring all clubs, ages, and statistics are current.

## Step 1: Get API Key

### Option A: Free Tier (100 requests/day)
1. Go to: https://rapidapi.com/api-sports/api/api-football
2. Click "Subscribe to Test"
3. Select **"Basic" plan (FREE)**
4. Copy your API key from the dashboard

### Option B: Paid Tier ($10/month = 3,000 requests/day)
1. Same as above, but select "Pro" plan
2. Recommended for batch generation of 499 posts

## Step 2: Configure Environment

Add your API key to `.env.local`:

```bash
# Football API (RapidAPI)
API_FOOTBALL_KEY=your_rapidapi_key_here
```

**On the server**, add to environment:

```bash
ssh root@159.223.103.16
echo 'export API_FOOTBALL_KEY=your_key_here' >> ~/.bashrc
source ~/.bashrc
```

## Step 3: Test the Setup

### Test 1: Check API Connection

```bash
cd /Users/omardoucoure/Documents/Afrique\ Sports/afriquesports-web/scripts

node -e "
const FootballAPI = require('./lib/football-api');
const api = new FootballAPI();

api.searchPlayer('Mohamed Salah').then(player => {
  console.log('✅ API Working!');
  console.log(JSON.stringify(player, null, 2));
}).catch(err => console.error('❌ Error:', err.message));
"
```

Expected output:
```json
{
  "name": "Mohamed Salah",
  "age": 32,
  "club": "Liverpool",
  "nationality": "Egypt",
  "position": "Attacker",
  "stats": {
    "goals": 20,
    "assists": 12,
    ...
  }
}
```

### Test 2: Generate Content with Real Data

```bash
# Dry run to see the enhanced prompt
node generate-with-real-data.js --post-id=851539 --dry-run

# Actual generation with Qwen 2.5 14B
node generate-with-real-data.js --post-id=851539 --model=qwen2.5:14b
```

## How It Works

```
┌──────────────────────────────────────────────────────────┐
│  Title: "Top 10 des milieux de terrain en 2025:         │
│          Pedri, Neves, Vitinha..."                       │
└──────────────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────────────┐
│  Entity Extractor                                        │
│  → Detects: Pedri, Neves, Vitinha, Fabinho              │
└──────────────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────────────┐
│  Football API Fetcher (with 24h cache)                   │
│  → Pedri: 22 ans, FC Barcelone, Milieu offensif         │
│  → Fabinho: 32 ans, Al-Ittihad, Milieu défensif         │
│  → Vitinha: 24 ans, PSG, Milieu central                 │
│  → Neves: 27 ans, Al-Hilal, Milieu défensif             │
└──────────────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────────────┐
│  Enhanced Prompt Builder                                 │
│  ✅ Injects REAL, VERIFIED data                          │
│  ✅ Instructs model to use ONLY this data                │
│  ✅ Prevents hallucinations                              │
└──────────────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────────────┐
│  Qwen 2.5 14B Generation                                 │
│  → Generates 600-900 words with ACCURATE info            │
└──────────────────────────────────────────────────────────┘
```

## Features

### ✅ Smart Caching
- API responses cached for **24 hours**
- Minimizes API calls (important for free tier)
- Cache stored in `scripts/.cache/`

### ✅ Rate Limiting
- Automatic 1-second delay between requests
- Respects free tier limits (100/day)

### ✅ Fallback Mode
- If API unavailable, uses general prompt
- No errors, just less specific content

### ✅ Entity Detection
Auto-detects:
- Player names (Salah, Hakimi, Osimhen, etc.)
- Team names (Liverpool, PSG, Al-Nassr, etc.)
- Topic type (ranking, transfer, match, scorer)

## API Usage Estimates

### For 499 Posts:

**Scenario 1: Average 3 players per post**
- 499 posts × 3 players = **1,497 API calls**
- With cache: ~**200-300 calls** (players appear in multiple posts)
- **Free tier:** Not enough (100/day limit)
- **Paid tier ($10/month):** ✅ Easily covered (3,000/day limit)

**Recommendation:** Subscribe to **Pro plan ($10/month)** for batch generation

### Cost Breakdown:
- **Free tier:** Good for testing (10-20 posts/day)
- **$10/month:** Perfect for 499 posts + future updates
- **ROI:** Better content = more traffic = more ad revenue

## Supported Data

### Player Data:
- ✅ Current club & league
- ✅ Age, nationality, position
- ✅ Season stats (goals, assists, appearances)
- ✅ Player rating

### Team Data:
- ✅ Current squad
- ✅ Stadium info
- ✅ League standings

### League Data:
- ✅ Top scorers
- ✅ Standings/rankings
- ✅ Fixtures & results

## Troubleshooting

### Error: "API_FOOTBALL_KEY not configured"
→ Add API key to `.env.local` or server environment

### Error: "API request failed: 429"
→ Rate limit exceeded, wait or upgrade to paid tier

### Error: "No player data found"
→ Player name not recognized, check spelling or add to `entity-extractor.js`

### Cache issues
→ Clear cache: `rm -rf scripts/.cache/`

## Next Steps

1. ✅ Sign up for API-Football
2. ✅ Add API key to environment
3. ✅ Test with `--dry-run`
4. ✅ Generate test content
5. ✅ Review quality
6. ✅ Proceed with batch generation

## Support

- API-Football Docs: https://www.api-football.com/documentation-v3
- RapidAPI Dashboard: https://rapidapi.com/developer/dashboard
- API Status: https://www.api-football.com/status
