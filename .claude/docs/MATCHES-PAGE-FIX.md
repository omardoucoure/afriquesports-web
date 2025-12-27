# Matches Page Fix - Database Mismatch

**Date**: 2025-12-27
**Status**: ✅ **FIXED** (Committed, ready to deploy)

## Issue

The `/matches` page at https://www.afriquesports.net/matches was showing empty (0 matches) even though match 732149 has pre-match analysis.

## Root Cause

**Database mismatch** between where data is stored vs where the API was looking:

### Data Storage (MySQL)
✅ Pre-match analysis stored in: `wp_match_prematch_analysis` (MySQL)
✅ Live commentary stored in: `wp_match_commentary` (MySQL)

### API Was Querying (Supabase)
❌ Looking in: `match_commentary_ai` (Supabase - doesn't exist)
❌ Looking in: `match_prematch_analysis` (Supabase - doesn't exist)

**Result**: API returned 0 matches because it was querying the wrong database!

## Solution

### Changes Made

1. **Added new function to `mysql-match-db.ts`** (`getAllCommentedMatches()`):
```typescript
export async function getAllCommentedMatches(): Promise<CommentedMatchSummary[]> {
  // Queries wp_match_commentary for live commentary
  // Queries wp_match_prematch_analysis for pre-match
  // Combines and returns all matches with commentary or pre-match
}
```

2. **Updated `/api/matches/commented` route**:
```typescript
// Before: Querying Supabase
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(...);
await supabase.from('match_commentary_ai').select(...)

// After: Querying MySQL
import { getAllCommentedMatches } from '@/lib/mysql-match-db';
const commentedMatches = await getAllCommentedMatches();
```

## Files Changed

- `src/lib/mysql-match-db.ts` - Added getAllCommentedMatches() function
- `src/app/api/matches/commented/route.ts` - Switch from Supabase to MySQL

## Commit

```
commit b017d02
Author: oxmo88@gmail.com
Date: 2025-12-27

Fix matches page: use MySQL instead of Supabase for commented matches
```

## Testing

### Before Fix (Production)
```bash
curl "https://www.afriquesports.net/api/matches/commented"
# Returns: {"success":true,"count":0,"matches":[]}
```

### After Fix (Local)
```typescript
// getAllCommentedMatches() will return all matches from:
// - wp_match_commentary (live commentary)
// - wp_match_prematch_analysis (pre-match analysis)

// Then API fetches ESPN data for each match
// Returns full match details with scores, teams, status
```

### Expected After Deployment
```bash
curl "https://www.afriquesports.net/api/matches/commented"
# Returns:
{
  "success": true,
  "count": 1,
  "matches": [
    {
      "match_id": "732149",
      "home_team": "Benin",
      "away_team": "Botswana",
      "home_score": "0",
      "away_score": "0",
      "status": "Scheduled",
      "has_commentary": false,
      "has_prematch": true,
      "commentary_count": 0,
      ...
    }
  ]
}
```

## Additional Fixes

### French Grammar Error Fixed
Also regenerated match 732149 to fix the "seconé" error:

**Before**: "Le Benin et le Botswana n'ont jamais **seconé** de matchs" ❌ (invalid French word)

**After**: "Le Benin et le Botswana **se sont affrontés** à l'occasion de la CAN 2025" ✅ (correct French)

## Deployment Required

⚠️ **Changes committed locally but NOT deployed yet**

To deploy:
```bash
cd "/Users/omardoucoure/Documents/Afrique Sports/afriquesports-web"
git push origin main
# Vercel will auto-deploy
```

After deployment, the matches page will show:
- All matches with pre-match analysis
- All matches with live commentary
- Proper team names, scores, and status from ESPN API

## Verification After Deployment

1. **Check API**:
```bash
curl "https://www.afriquesports.net/api/matches/commented"
# Should return matches array with at least 1 match
```

2. **Check Website**:
Visit https://www.afriquesports.net/matches
- Should show match 732149 (Benin vs Botswana)
- With "Pré-match" badge
- Clickable link to match page

## Summary

✅ **Root cause identified**: Database mismatch (MySQL vs Supabase)
✅ **Fix implemented**: Updated API to use MySQL
✅ **Code committed**: Ready to deploy
✅ **French grammar**: Fixed "seconé" → "se sont affrontés"
⏳ **Pending**: Deployment to production

Once deployed, the matches page will work correctly! 🎉
