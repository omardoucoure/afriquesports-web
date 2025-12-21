# AI Agent Integration Guide - Live Commentary & Pre-Match Analysis

This document explains how the AI agent on DigitalOcean (159.223.103.16) should integrate with the afriquesports.net platform to publish live commentary and pre-match analysis.

## Overview

The platform now supports two types of AI-generated content:

1. **Live Match Commentary** - Real-time event-by-event commentary during matches
2. **Pre-Match Analysis** - Comprehensive analysis generated 2-6 hours before kickoff

## 1. Live Match Commentary

### When to Generate

- **During live matches** (when ESPN API shows status = "in progress")
- Update frequency: After each significant event (goals, cards, substitutions, etc.)
- Minor events: Every 5-10 minutes during open play

### API Endpoint

**POST** `/api/can2025/live-commentary`

### Request Format

```bash
curl -X POST https://www.afriquesports.net/api/can2025/live-commentary \
  -H "x-webhook-secret: YOUR_SECRET_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "match_id": "401682890",
    "event_id": "401682890_goal_23",
    "time": "23'"'"'",
    "time_seconds": 1380,
    "locale": "fr",
    "text": "⚽ BUT! Achraf Hakimi ouvre le score pour le Maroc avec une frappe puissante depuis l'"'"'extérieur de la surface!",
    "type": "goal",
    "team": "Morocco",
    "player_name": "Achraf Hakimi",
    "player_image": "https://example.com/hakimi.jpg",
    "icon": "⚽",
    "is_scoring": true,
    "confidence": 0.95
  }'
```

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `match_id` | string | ESPN match ID (from scoreboard API) |
| `event_id` | string | Unique identifier for this event (format: `{match_id}_{type}_{time}`) |
| `time` | string | Match time (e.g., "23'", "45'+2", "90'") |
| `time_seconds` | integer | Time in seconds for sorting (e.g., 1380 for 23') |
| `locale` | string | Language code (fr/en/es/ar) |
| `text` | string | AI-generated commentary text |
| `type` | string | Event type (see below) |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `team` | string | Team name (Morocco, Senegal, etc.) |
| `player_name` | string | Player involved in the event |
| `player_image` | string | URL to player headshot |
| `icon` | string | Emoji icon (⚽, 🟨, 🟥, etc.) |
| `is_scoring` | boolean | True for goals |
| `confidence` | float | AI confidence score (0-1) |

### Event Types

| Type | Icon | Description |
|------|------|-------------|
| `goal` | ⚽ | Goal scored |
| `yellow_card` | 🟨 | Yellow card |
| `red_card` | 🟥 | Red card |
| `substitution` | 🔄 | Player substitution |
| `corner_kick` | 🚩 | Corner kick |
| `shot_on_target` | 🎯 | Shot on target |
| `shot_off_target` | 📋 | Shot off target |
| `foul` | ⚠️ | Foul |
| `var` | 📺 | VAR check |
| `stats` | 📊 | Match statistics update |
| `commentary` | ⚽ | General commentary |

### Response

**Success (200)**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "match_id": "401682890",
    "event_id": "401682890_goal_23",
    "created_at": "2025-12-21T15:32:13.433146+00:00"
  },
  "message": "Commentary published successfully"
}
```

**Error (409 - Duplicate)**:
```json
{
  "error": "Duplicate event_id. Commentary already exists."
}
```

---

## 2. Pre-Match Analysis

### When to Generate

- **2-6 hours before match kickoff**
- Check ESPN scoreboard API every 30 minutes for upcoming matches
- Generate once per match per locale

### API Endpoint

**POST** `/api/can2025/prematch-analysis`

### Request Format

```bash
curl -X POST https://www.afriquesports.net/api/can2025/prematch-analysis \
  -H "x-webhook-secret: YOUR_SECRET_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "match_id": "401682890",
    "locale": "fr",
    "head_to_head": "Le Maroc et les Comores se sont affrontés 3 fois. Maroc: 2 victoires, 1 nul. Dernier match: Maroc 2-0 Comores (2021).",
    "recent_form": "Maroc: 4 victoires, 1 nul dans les 5 derniers matchs. Comores: 2 victoires, 2 nuls, 1 défaite.",
    "key_players": "À surveiller: Achraf Hakimi (Maroc) - 3 buts en 2025, Youssef En-Nesyri (Maroc) - meilleur buteur, Faïz Selemani (Comores) - créateur de jeu.",
    "tactical_preview": "Le Maroc devrait dominer la possession (65%+) avec son 4-3-3 habituel. Les Comores joueront en contre avec un bloc bas 5-3-2. La clé: les centres de Hakimi contre la défense comorienne.",
    "prediction": "Maroc 2-0 Comores | Probabilités: Maroc 75%, Nul 18%, Comores 7%"
  }'
```

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `match_id` | string | ESPN match ID |
| `locale` | string | Language code (fr/en/es/ar) |

### Analysis Fields (At least 1 required)

| Field | Type | Description | Character Range |
|-------|------|-------------|-----------------|
| `head_to_head` | string | Historical confrontation stats | 100-300 chars |
| `recent_form` | string | Last 5 matches for each team | 100-300 chars |
| `key_players` | string | Top 3-5 players to watch | 100-300 chars |
| `tactical_preview` | string | Tactical analysis and formations | 150-400 chars |
| `prediction` | string | Score prediction with probabilities | 50-150 chars |

### Content Guidelines

#### Head-to-Head
- Include total matches played
- Win/draw/loss breakdown
- Most recent result
- Notable historical context

Example:
```
Le Maroc et le Mali se sont affrontés 12 fois. Maroc: 6 victoires, 3 nuls, Mali: 3 victoires.
Dernier match: Maroc 1-0 Mali (CAN 2023, demi-finale). Le Maroc n'a pas perdu contre le Mali
depuis 2010.
```

#### Recent Form
- Last 5 matches for BOTH teams
- Win/draw/loss record
- Goals scored/conceded
- Current momentum

Example:
```
Maroc (5 derniers): VVNVV - 12 buts marqués, 2 encaissés. En forme exceptionnelle, invaincu
depuis 8 matchs. Mali (5 derniers): VNDVN - 7 buts marqués, 5 encaissés. Solide mais
inconsistant défensivement.
```

#### Key Players
- 3-5 players max (both teams)
- Name, position, key stat
- Why they're important for this match

Example:
```
À surveiller: Achraf Hakimi (Maroc, Lat. Droit) - 4 passes décisives en 2025, danger constant
sur le flanc. Youssef En-Nesyri (Maroc, Att.) - 6 buts cette année, renard des surfaces.
Amadou Haïdara (Mali, Mil.) - Maître du milieu, 87% de passes réussies.
```

#### Tactical Preview
- Expected formations
- Playing styles
- Key tactical battles
- Possession prediction
- Strengths/weaknesses

Example:
```
Le Maroc alignera son 4-3-3 offensif avec Hakimi et Mazraoui en pistons. Possession attendue:
60%+. Le Mali répondra avec un 4-2-3-1 compact, cherchant des transitions rapides via Traoré.
Bataille clé: milieu marocain vs Bissouma/Haïdara. Point faible malien: défense aérienne.
```

#### Prediction
- Score prediction
- Win/draw/away percentages
- Brief justification (optional)

Example:
```
Maroc 2-1 Mali | Probabilités: Maroc 65%, Nul 22%, Mali 13% |
Le Maroc à domicile reste redoutable, mais le Mali a les armes pour marquer.
```

### Response

**Success (200)**:
```json
{
  "success": true,
  "message": "Pre-match analysis published successfully",
  "data": {
    "id": 1,
    "match_id": "401682890",
    "locale": "fr",
    "created_at": "2025-12-21T10:00:00+00:00",
    "updated_at": "2025-12-21T10:00:00+00:00"
  }
}
```

---

## 3. Workflow for AI Agent

### Step 1: Monitor Upcoming Matches

Every 30 minutes:

```python
import requests

# Fetch ESPN scoreboard
scoreboard = requests.get(
    "https://site.api.espn.com/apis/site/v2/sports/soccer/caf.nations/scoreboard"
).json()

for event in scoreboard.get('events', []):
    match_id = event['id']
    status = event['competitions'][0]['status']['type']['state']
    match_date = event['date']

    # Calculate hours until kickoff
    hours_until_match = calculate_hours_until(match_date)

    if status == 'pre' and 2 <= hours_until_match <= 6:
        # Generate pre-match analysis
        generate_prematch_analysis(match_id, event)

    elif status == 'in':
        # Monitor for live events
        monitor_live_match(match_id, event)
```

### Step 2: Generate Pre-Match Analysis

```python
def generate_prematch_analysis(match_id, event):
    home_team = event['competitions'][0]['competitors'][0]['team']['displayName']
    away_team = event['competitions'][0]['competitors'][1]['team']['displayName']

    # Use DeepSeek R1 to generate analysis
    analysis = ai_model.generate_prematch_analysis(
        home_team=home_team,
        away_team=away_team,
        context={
            'competition': 'CAN 2025',
            'venue': event.get('venue', {}).get('fullName'),
            'group': event.get('group')
        }
    )

    # Publish for each locale
    for locale in ['fr', 'en', 'es', 'ar']:
        response = requests.post(
            'https://www.afriquesports.net/api/can2025/prematch-analysis',
            headers={'x-webhook-secret': WEBHOOK_SECRET},
            json={
                'match_id': match_id,
                'locale': locale,
                **analysis[locale]  # Localized analysis
            }
        )

        if response.status_code == 200:
            print(f"✅ Pre-match analysis published ({locale})")
        else:
            print(f"❌ Failed: {response.json()}")
```

### Step 3: Monitor Live Matches

```python
def monitor_live_match(match_id, event):
    # Fetch play-by-play from ESPN
    playbyplay = requests.get(
        f"https://site.api.espn.com/apis/site/v2/sports/soccer/caf.nations/playbyplay?event={match_id}"
    ).json()

    for play in playbyplay.get('plays', []):
        if is_significant_event(play):
            # Generate AI commentary
            commentary = ai_model.generate_commentary(
                play_type=play['type']['text'],
                player=play.get('participants', [{}])[0].get('athlete', {}).get('displayName'),
                team=play.get('team', {}).get('displayName'),
                context=event
            )

            # Publish commentary
            publish_commentary(match_id, play, commentary)
```

### Step 4: Publish Live Commentary

```python
def publish_commentary(match_id, play, commentary_text):
    play_type = play['type']['text'].lower().replace(' ', '_')

    for locale in ['fr', 'en', 'es', 'ar']:
        response = requests.post(
            'https://www.afriquesports.net/api/can2025/live-commentary',
            headers={'x-webhook-secret': WEBHOOK_SECRET},
            json={
                'match_id': match_id,
                'event_id': f"{match_id}_{play_type}_{play['clock']['value']}",
                'time': play['clock']['displayValue'],
                'time_seconds': play['clock']['value'],
                'locale': locale,
                'text': commentary_text[locale],
                'type': play_type,
                'team': play.get('team', {}).get('displayName', ''),
                'player_name': play.get('participants', [{}])[0].get('athlete', {}).get('displayName', ''),
                'icon': get_icon_for_type(play_type),
                'is_scoring': play.get('scoringPlay', False),
                'confidence': 0.95
            }
        )

        if response.status_code == 200:
            print(f"✅ Commentary published: {play_type}")
        else:
            print(f"❌ Failed: {response.json()}")
```

---

## 4. Environment Variables

Add to AI agent's `.env` file:

```bash
# Next.js API endpoints
NEXTJS_API_URL="https://www.afriquesports.net"
AI_AGENT_WEBHOOK_SECRET="test-secret"  # Match with Next.js .env.local

# Supabase (if direct database access needed)
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

---

## 5. Testing

### Test Pre-Match Analysis

```bash
curl -X POST http://localhost:3000/api/can2025/prematch-analysis \
  -H "x-webhook-secret: test-secret" \
  -H "Content-Type: application/json" \
  -d '{
    "match_id": "test_match_123",
    "locale": "fr",
    "head_to_head": "Test head to head analysis",
    "recent_form": "Test recent form",
    "key_players": "Test key players",
    "tactical_preview": "Test tactical preview",
    "prediction": "Test 2-1 Test | 70% / 20% / 10%"
  }'
```

### Test Live Commentary

Use the existing `test-commentary.sh` script:

```bash
./test-commentary.sh
```

### View Results

- **Live Commentary**: http://localhost:3000/fr/match-en-direct
- **Test Page**: http://localhost:3000/fr/test-commentary
- **API Direct**: http://localhost:3000/api/match-commentary-ai?locale=fr

---

## 6. Success Criteria

✅ Pre-match analysis generated 2-6 hours before kickoff
✅ Live commentary published within 2 seconds of significant events
✅ All 4 locales supported (FR/EN/ES/AR)
✅ No duplicate event_ids (unique constraint enforced)
✅ Commentary visible on /match-en-direct page with "AI-Powered" badge
✅ Pre-match analysis displayed when match hasn't started

---

## 7. Monitoring & Debugging

### Check Database Directly

```sql
-- Live commentary
SELECT * FROM match_commentary_ai WHERE match_id = '401682890' ORDER BY time_seconds DESC;

-- Pre-match analysis
SELECT * FROM match_prematch_analysis WHERE match_id = '401682890';
```

### API Health Check

```bash
# Check if API is responding
curl https://www.afriquesports.net/api/can2025/live-commentary?match_id=test&locale=fr
```

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Wrong webhook secret | Check AI_AGENT_WEBHOOK_SECRET |
| 409 Duplicate | event_id already exists | Use unique event_id format |
| 400 Missing field | Required field not provided | Check request body |
| 500 Server error | Database or Next.js error | Check server logs |

---

## 8. Next Steps

1. Deploy AI agent updates to DigitalOcean
2. Configure environment variables
3. Test with upcoming CAN 2025 match
4. Monitor first live match commentary
5. Collect user feedback and iterate

---

**Questions?** Contact the development team or check the Next.js API routes documentation.
