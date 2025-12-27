# Quick Guide: Generate Pre-Match Analysis

## ✅ Match 732149 Pre-Match Published!

Pre-match analysis for **Tunisie vs Mali** is now live at:
https://www.afriquesports.net/can-2025/match/732149

## For Future Matches

### Method 1: Automated Script (Recommended)

```bash
# From project directory
cd /Users/omardoucoure/Documents/Afrique\ Sports/afriquesports-web

# Generate for any match
node scripts/ai/generate-prematch-with-search.js <match_id> "<home_team>" "<away_team>"

# Example
node scripts/ai/generate-prematch-with-search.js 732150 "Sénégal" "Cameroun"
```

**Features:**
- Uses fine-tuned AFCON model
- Optional web search for real-time data
- Auto-publishes to database
- Generates all 5 sections

### Method 2: Quick Bash Script

```bash
# Create quick script
cat > /tmp/gen-prematch.sh << 'EOF'
#!/bin/bash
cd "/Users/omardoucoure/Documents/Afrique Sports/afriquesports-web"
node scripts/ai/generate-prematch-with-search.js "$@"
EOF

chmod +x /tmp/gen-prematch.sh

# Use it
/tmp/gen-prematch.sh 732150 "Sénégal" "Cameroun"
```

### Method 3: Add to Match Creation

When you create a match, automatically trigger pre-match generation:

```typescript
// In your match creation code
import { spawn } from 'child_process';

// After creating match
spawn('node', [
  'scripts/ai/generate-prematch-with-search.js',
  matchId,
  homeTeam,
  awayTeam
], {
  cwd: process.cwd(),
  detached: true,
  stdio: 'ignore'
}).unref();
```

## What Gets Generated

### 1. Face-à-face historique
Historical matchups between the teams

### 2. Forme récente
Recent form of both teams

### 3. Joueurs clés
Key players for each team

### 4. Aperçu tactique
Tactical preview and analysis

### 5. Pronostic
Match prediction with probable score

## Verify Pre-Match Exists

```bash
# Check via API
curl "https://www.afriquesports.net/api/can2025/prematch-analysis?match_id=732149&locale=fr" | python3 -m json.tool

# Check on website
open "https://www.afriquesports.net/can-2025/match/732149"
```

## Troubleshooting

### Pre-match not showing on page?

1. **Check if data exists:**
   ```bash
   curl "https://www.afriquesports.net/api/can2025/prematch-analysis?match_id=<match_id>&locale=fr"
   ```

2. **Regenerate if needed:**
   ```bash
   node scripts/ai/generate-prematch-with-search.js <match_id> "<home>" "<away>"
   ```

3. **Check cache:** The page might be cached. Wait a few minutes or trigger revalidation.

### Script fails?

- **Check environment variables:**
  ```bash
  echo $AI_AGENT_WEBHOOK_SECRET
  echo $NEXT_PUBLIC_SITE_URL
  ```

- **Run from project directory:**
  ```bash
  cd "/Users/omardoucoure/Documents/Afrique Sports/afriquesports-web"
  ```

## Files Reference

- **Generator Script:** `scripts/ai/generate-prematch-with-search.js`
- **API Route:** `src/app/api/can2025/prematch-analysis/route.ts`
- **Full Documentation:** `.claude/docs/WEB-SEARCH-PREMATCH-SETUP.md`
- **Completion Guide:** `.claude/docs/PREMATCH-GENERATION-COMPLETE.md`

## Example: Generated Content for 732149

**Face-à-face:** Tunisie et Mali se sont affrontés à huit reprises depuis 1963. Tunisie a remporté six matchs...

**Forme récente:** Tunisie a terminé sa campagne amicale par une défaite face à l'Angleterre (1-0)...

**Joueurs clés:**
- **Tunisie**: Wahbi Khazri, Youssef Msakni
- **Mali**: Yves Bissouma, Amadou Haidara

**Pronostic:** Tunisie 2 - 1 Mali

## Quick Commands

```bash
# Generate for match
node scripts/ai/generate-prematch-with-search.js 732149 "Tunisie" "Mali"

# Check if exists
curl -s "https://www.afriquesports.net/api/can2025/prematch-analysis?match_id=732149&locale=fr" | python3 -c "import sys, json; d=json.load(sys.stdin); print('✅ Exists' if d.get('success') else '❌ Not found')"

# View on website
open "https://www.afriquesports.net/can-2025/match/732149"
```

---

**Note:** The fine-tuned AFCON model works even without web search API configured. It uses its training data knowledge of African football to generate professional analysis.
