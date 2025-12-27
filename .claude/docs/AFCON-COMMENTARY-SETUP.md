# AFCON Real Commentary Setup

**Date**: 2025-12-27
**Status**: ✅ **READY TO RUN**

## Overview

This guide explains how to:
1. Clean up all test/mock matches
2. Generate real AI commentary for completed AFCON 2025 matches

## Prerequisites

✅ **All scripts deployed to production**
✅ **Commentary API endpoint created**: `/api/can2025/commentary`
✅ **Database credentials configured** in `.env.local`

## Step 1: Clean Up Test Matches

Remove all mock/test data from the database:

```bash
cd "/Users/omardoucoure/Documents/Afrique Sports/afriquesports-web"
node scripts/ai/cleanup-test-matches.js
```

**What it removes:**
- All matches with "test" in the ID (e.g., `test-brazil-france-2006`)
- Mock matches: 732145, 732146, 732147, 732148, 732149, 732150
- From tables: `wp_match_commentary`, `wp_match_prematch_analysis`, `wp_match_states`

**Expected output:**
```
========================================
Test Matches Cleanup
========================================

1. Finding test matches...
   Found 7 test matches in commentary table

2. Deleting test commentary...
   ✅ Deleted 462 commentary rows

3. Deleting test pre-match analysis...
   ✅ Deleted 2 pre-match rows

4. Deleting test match states...
   ✅ Deleted 7 match state rows

========================================
✅ CLEANUP COMPLETED
========================================
```

## Step 2: Generate Real AFCON Commentary

Fetch completed AFCON matches and generate AI commentary:

```bash
cd "/Users/omardoucoure/Documents/Afrique Sports/afriquesports-web"
node scripts/ai/generate-afcon-commentary.js
```

**What it does:**

1. **Fetches completed matches** from ESPN API
   - League ID: `afr.1` (AFCON/CAN)
   - Only processes `STATUS_FINAL` matches

2. **Gets match events** for each match:
   - Goals
   - Cards (yellow/red)
   - Substitutions
   - Key plays

3. **Generates AI commentary** using fine-tuned model:
   - Model: `oxmo88/Qwen2.5-VL-7B-AFCON2025`
   - Endpoint: `https://qbjo7w9adplhia-8000.proxy.runpod.net/v1`
   - Language: French with proper grammar (Le/La articles)

4. **Posts to database** via API:
   - Endpoint: `/api/can2025/commentary`
   - Authenticated with `AI_AGENT_WEBHOOK_SECRET`

**Expected output:**
```
========================================
AFCON 2025 Commentary Generator
========================================

Fetching AFCON 2025 matches from ESPN...
   ✅ Found 12 completed matches

Found 12 completed matches. Generating commentary...

   Processing match 732155...
      Sénégal 2 - 1 Cameroun
      Found 18 commentary items, 25 plays
      Generating commentary for 25 events...
      [1/25] 90' - goal
         ✅ Posted: "But magnifique du Sénégal! Sadio Mané trouve le fond des filets..."
      [2/25] 75' - substitution
         ✅ Posted: "Changement tactique: Ismaïla Sarr entre en jeu pour le Sénégal..."
      ...
      ✅ Generated 20 commentaries for this match

   Processing match 732156...
      ...

========================================
✅ COMPLETED
========================================
Total matches processed: 12
Total commentaries generated: 240
```

## Features

### Intelligent Commentary Generation

The AI generates context-aware commentary:

**For Goals:**
```
"But magnifique! Le Sénégal prend l'avantage grâce à Sadio Mané
qui trompe le gardien camerounais. 1-0 pour les Lions de la Téranga!"
```

**For Cards:**
```
"Carton jaune pour le Cameroun. Le joueur proteste mais l'arbitre
maintient sa décision."
```

**For Substitutions:**
```
"Changement tactique pour Le Sénégal. Ismaïla Sarr entre en jeu
et apporte de la fraîcheur sur le côté droit."
```

### Proper French Grammar

All commentary follows French grammar rules:
- ✅ "Le Sénégal marque un but"
- ✅ "La Tunisie domine le match"
- ✅ "L'Égypte attaque"
- ❌ "Sénégal marque un but" (incorrect)

### Rate Limiting

- **2 seconds** between API calls to vLLM
- Prevents overloading the AI model
- **Max 20 events per match** to avoid excessive commentary

## Database Schema

Commentary is saved to `wp_match_commentary`:

```sql
CREATE TABLE wp_match_commentary (
  id INT AUTO_INCREMENT PRIMARY KEY,
  match_id VARCHAR(50) NOT NULL,
  event_id VARCHAR(100) NOT NULL UNIQUE,
  competition VARCHAR(50) DEFAULT 'CAN',
  time VARCHAR(10) NOT NULL,
  time_seconds INT NOT NULL,
  locale VARCHAR(5) DEFAULT 'fr',
  text TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  team VARCHAR(100),
  player_name VARCHAR(100),
  player_image VARCHAR(255),
  icon VARCHAR(50),
  is_scoring BOOLEAN DEFAULT FALSE,
  confidence DECIMAL(3,2) DEFAULT 1.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### GET - Fetch Commentary
```bash
curl "https://www.afriquesports.net/api/can2025/commentary?match_id=732155&locale=fr"
```

**Response:**
```json
{
  "success": true,
  "matchId": "732155",
  "locale": "fr",
  "count": 20,
  "commentary": [
    {
      "id": 1,
      "match_id": "732155",
      "event_id": "732155-0",
      "time": "90'",
      "text": "But magnifique du Sénégal!...",
      "type": "goal",
      "team": "Sénégal",
      "player_name": "Sadio Mané",
      "is_scoring": true
    },
    ...
  ]
}
```

### POST - Add Commentary
```bash
curl -X POST "https://www.afriquesports.net/api/can2025/commentary" \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: YOUR_SECRET" \
  -d '{
    "match_id": "732155",
    "locale": "fr",
    "commentary": {
      "event_id": "732155-goal-1",
      "time": "45'\''",
      "time_seconds": 2700,
      "text": "But! Le Sénégal ouvre le score!",
      "type": "goal",
      "team": "Sénégal",
      "player_name": "Sadio Mané",
      "is_scoring": true
    }
  }'
```

## Environment Variables Required

Make sure these are set in `.env.local`:

```bash
# Database
WORDPRESS_DB_HOST=159.223.103.16
WORDPRESS_DB_USER=your_user
WORDPRESS_DB_PASSWORD=your_password
WORDPRESS_DB_NAME=wordpress

# vLLM AI Model
VLLM_ENDPOINT=https://qbjo7w9adplhia-8000.proxy.runpod.net/v1
VLLM_API_KEY=sk-1234
VLLM_MODEL=oxmo88/Qwen2.5-VL-7B-AFCON2025

# API
NEXT_PUBLIC_SITE_URL=https://www.afriquesports.net
AI_AGENT_WEBHOOK_SECRET=your_webhook_secret
```

## Troubleshooting

### "Missing database credentials"
- Ensure `.env.local` has `WORDPRESS_DB_USER` and `WORDPRESS_DB_PASSWORD`
- Run script from project root directory

### "No completed matches found"
- AFCON 2025 tournament may not have started yet
- Check ESPN API: https://site.api.espn.com/apis/site/v2/sports/soccer/afr.1/scoreboard

### "vLLM API error"
- Verify vLLM pod is running on RunPod
- Check `VLLM_ENDPOINT` and `VLLM_API_KEY`

### "Failed to post commentary"
- Verify `AI_AGENT_WEBHOOK_SECRET` is set correctly
- Check API endpoint is deployed

## Next Steps

After generating commentary:

1. **Verify on website**:
   ```
   https://www.afriquesports.net/matches
   ```
   Should show real AFCON matches with commentary

2. **Check match pages**:
   ```
   https://www.afriquesports.net/can-2025/match/[match_id]
   ```
   Should display AI-generated commentary

3. **Monitor database**:
   ```sql
   SELECT COUNT(*) FROM wp_match_commentary;
   SELECT COUNT(DISTINCT match_id) FROM wp_match_commentary;
   ```

## Summary

✅ **Scripts created and deployed**
✅ **API endpoints ready**
✅ **Fine-tuned AI model available**
✅ **French grammar rules implemented**

**Ready to generate real AFCON commentary!** 🎉

Run the scripts in order:
1. Cleanup: `node scripts/ai/cleanup-test-matches.js`
2. Generate: `node scripts/ai/generate-afcon-commentary.js`
