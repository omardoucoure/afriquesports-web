#!/usr/bin/env python3
"""
Match Replay Agent - Hybrid Version with OpenAI
Rebuilds match commentary from ESPN data using GPT-4o-mini for French transformation

Usage:
python match-replay-agent-hybrid.py --match 732178 --speed 5
"""

import argparse
import json
import os
import re
import time

import requests
from openai import OpenAI

# Configuration
API_URL = "https://www.afriquesports.net/api/can2025/live-commentary"
WEBHOOK_SECRET = "test-secret"

event_counter = 0


def get_espn_data(match_id: str) -> dict:
    """Fetch full match data from ESPN"""
    url = f"https://site.api.espn.com/apis/site/v2/sports/soccer/caf.nations/summary?event={match_id}"
    response = requests.get(url, timeout=30)
    return response.json()


def get_event_icon(event_type: str) -> str:
    """Get emoji icon for event type"""
    icons = {
        "goal": "⚽",
        "yellowCard": "🟨",
        "redCard": "🟥",
        "substitution": "🔄",
        "corner": "🚩",
        "foul": "🚫",
        "save": "🧤",
        "shot": "🎯",
        "offside": "🚫",
        "kickoff": "📢",
        "halftime": "⏸️",
        "fulltime": "🏁",
        "commentary": "🎙️",
        "highlight": "✨",
    }
    return icons.get(event_type, "▶️")


def normalize_event_type(espn_type: str) -> str:
    """Convert ESPN event type to our format"""
    type_map = {
        "Goal": "goal",
        "Yellow Card": "yellowCard",
        "Red Card": "redCard",
        "Substitution": "substitution",
        "Corner": "corner",
        "Foul": "foul",
        "Save": "save",
        "Shot": "shot",
        "Offside": "offside",
        "Kickoff": "kickoff",
        "Halftime": "halftime",
        "Start 2nd Half": "kickoff",
        "End Regular Time": "fulltime",
        "Full Time": "fulltime"
    }
    return type_map.get(espn_type, "commentary")


def transform_with_openai(client: OpenAI, event: dict, match_context: dict) -> str:
    """Transform ESPN event into sensational French commentary using GPT-4o-mini"""

    event_type = event.get("type", {}).get("text", "") if isinstance(event.get("type"), dict) else event.get("type", "")
    time_display = event.get("clock", {}).get("displayValue", "") if isinstance(event.get("clock"), dict) else event.get("time", "")
    text = event.get("text", "")
    participants = []
    if event.get("participants"):
        participants = [p.get("athlete", {}).get("displayName", "") for p in event.get("participants", [])]
    team = event.get("team", {}).get("displayName", "") if isinstance(event.get("team"), dict) else event.get("team", "")

    prompt = f"""Tu es un COMMENTATEUR SPORTIF PASSIONNÉ pour Afrique Sports !

Match: {match_context['homeTeam']} vs {match_context['awayTeam']}
Score: {match_context['score']}
Minute: {time_display}

Événement:
- Type: {event_type}
- Équipe: {team or 'N/A'}
- Joueurs: {', '.join(participants) if participants else 'N/A'}
- Description ESPN: {text}

TRANSFORME cet événement en commentaire SENSATIONNEL en français !

RÈGLES:
- Écris comme un commentateur PASSIONNÉ africain qui vit le match
- Utilise des EXCLAMATIONS et de l'ÉMOTION !
- Minimum 120 caractères, maximum 300
- Ajoute 3-5 emojis pertinents 🔥⚽🎯
- Mentionne les joueurs concernés si disponibles
- Pour les BUTS: sois EXPLOSIF et mentionne le buteur !
- Pour les cartons: montre la tension du match
- Pour les remplacements: petite analyse tactique

Réponds UNIQUEMENT avec le texte du commentaire (pas de JSON, pas de guillemets)."""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Tu es un commentateur sportif africain passionné. Réponds uniquement avec le commentaire, sans guillemets ni préfixes."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=200
        )

        return response.choices[0].message.content.strip().strip('"')

    except Exception as e:
        print(f"  ❌ OpenAI error: {e}")
        return text or f"{event_type} - {team}"


def post_commentary(event_data: dict, match_id: str) -> bool:
    """Post commentary event to API"""
    global event_counter
    event_counter += 1

    payload = {
        "match_id": match_id,
        "event_id": f"replay_hybrid_{event_counter}",
        "competition": "CAN 2025",
        "time": event_data.get("time", ""),
        "time_seconds": event_counter,
        "locale": "fr",
        "text": event_data.get("text", ""),
        "type": event_data.get("type", "commentary"),
        "team": event_data.get("team"),
        "player_name": event_data.get("player"),
        "icon": get_event_icon(event_data.get("type", "")),
        "is_scoring": 1 if event_data.get("type") == "goal" else 0,
        "confidence": 0.95,
        "source": "espn_replay_openai"
    }

    try:
        response = requests.post(
            API_URL,
            json=payload,
            headers={
                "Content-Type": "application/json",
                "x-webhook-secret": WEBHOOK_SECRET
            },
            timeout=10
        )

        if response.ok:
            print(f"  ✅ [{event_data.get('time', '--')}] {event_data.get('text', '')[:70]}...")
            return True
        else:
            print(f"  ❌ Failed: {response.status_code}")
            return False

    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False


def replay_match(match_id: str, speed: float = 1.0):
    """Replay a match from ESPN data with OpenAI transformation"""

    # Check for OpenAI API key
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("❌ OPENAI_API_KEY environment variable not set")
        return

    client = OpenAI(api_key=api_key)

    print(f"\n🎬 Match Replay Agent (Hybrid - OpenAI)")
    print(f"⚽ Match ID: {match_id}")
    print(f"⏱️  Speed: {speed}x")
    print("-" * 50)

    # Fetch ESPN data
    print("\n📡 Fetching ESPN data...")
    data = get_espn_data(match_id)

    # Extract match info
    header = data.get("header", {})
    comp = header.get("competitions", [{}])[0]
    competitors = comp.get("competitors", [{}, {}])

    match_context = {
        "homeTeam": competitors[0].get("team", {}).get("displayName", "Home"),
        "awayTeam": competitors[1].get("team", {}).get("displayName", "Away"),
        "homeScore": int(competitors[0].get("score", 0)),
        "awayScore": int(competitors[1].get("score", 0)),
        "score": "0 - 0"  # Will update as we go
    }

    print(f"🏟️  {match_context['homeTeam']} vs {match_context['awayTeam']}")
    print(f"📊 Final: {match_context['homeScore']} - {match_context['awayScore']}")

    # Get key events
    key_events = data.get("keyEvents", [])
    print(f"📋 Key events: {len(key_events)}")
    print("-" * 50)

    # Reset score for replay
    current_home_score = 0
    current_away_score = 0

    print("\n🚀 Starting match replay with OpenAI...\n")

    # Post kickoff
    print("⏱️  0' - Kickoff")
    kickoff_text = transform_with_openai(client, {
        "type": "Kickoff",
        "time": "0'",
        "text": f"Coup d'envoi du match entre {match_context['homeTeam']} et {match_context['awayTeam']}",
        "team": None,
        "participants": []
    }, {**match_context, "score": "0 - 0"})

    post_commentary({
        "time": "0'",
        "type": "kickoff",
        "text": kickoff_text,
        "team": None,
        "player": None
    }, match_id)

    time.sleep(0.5 / speed)

    # Process key events
    for event in key_events:
        event_type_text = event.get("type", {}).get("text", "")

        # Skip some meta events
        if event_type_text in ["Kickoff"]:
            continue

        time_display = event.get("clock", {}).get("displayValue", "")
        team = event.get("team", {}).get("displayName", "") if event.get("team") else None
        participants = [p.get("athlete", {}).get("displayName", "") for p in event.get("participants", [])]

        # Update score before goal transformation
        if event_type_text == "Goal":
            if team == match_context["homeTeam"]:
                current_home_score += 1
            else:
                current_away_score += 1

        match_context["score"] = f"{current_home_score} - {current_away_score}"

        # Transform with OpenAI
        print(f"⏱️  {time_display} - {event_type_text}" + (f" ({team})" if team else ""))
        transformed_text = transform_with_openai(client, event, match_context)

        # Post event
        post_commentary({
            "time": time_display,
            "type": normalize_event_type(event_type_text),
            "text": transformed_text,
            "team": team,
            "player": participants[0] if participants else None
        }, match_id)

        # Delay based on event importance
        delay = 0.8 if event_type_text == "Goal" else 0.4
        time.sleep(delay / speed)

    # Post full time
    print(f"\n⏱️  90' - Full Time")
    match_context["score"] = f"{current_home_score} - {current_away_score}"
    fulltime_text = transform_with_openai(client, {
        "type": "Full Time",
        "time": "90'",
        "text": f"Fin du match ! {match_context['homeTeam']} {current_home_score} - {current_away_score} {match_context['awayTeam']}",
        "team": None,
        "participants": []
    }, match_context)

    post_commentary({
        "time": "90'",
        "type": "fulltime",
        "text": fulltime_text,
        "team": None,
        "player": None
    }, match_id)

    print("\n" + "=" * 50)
    print(f"🏁 Match replay complete!")
    print(f"📊 Final: {match_context['homeTeam']} {current_home_score} - {current_away_score} {match_context['awayTeam']}")
    print(f"📝 Events posted: {event_counter}")


def main():
    parser = argparse.ArgumentParser(description="Match Replay Agent (Hybrid)")
    parser.add_argument("--match", required=True, help="ESPN Match ID")
    parser.add_argument("--speed", type=float, default=3.0, help="Replay speed multiplier")
    args = parser.parse_args()

    try:
        replay_match(args.match, args.speed)
    except KeyboardInterrupt:
        print("\n\n🛑 Replay stopped by user")


if __name__ == "__main__":
    main()
