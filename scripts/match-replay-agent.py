#!/usr/bin/env python3
"""
Match Replay Agent - Rebuilds match commentary from ESPN data
Uses Ollama for transforming ESPN commentary into sensational French

Usage:
python match-replay-agent.py --match 732178 --speed 2
"""

import argparse
import json
import re
import time
from datetime import datetime

import requests

# Configuration
API_URL = "https://www.afriquesports.net/api/can2025/live-commentary"
WEBHOOK_SECRET = "test-secret"
OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "qwen2.5:14b"

# Track posted events
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
        "info": "📢"
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


def transform_with_ollama(event: dict, match_context: dict) -> str:
    """Transform ESPN event into sensational French commentary"""

    event_type = event.get("type", {}).get("text", "")
    time_display = event.get("clock", {}).get("displayValue", "")
    text = event.get("text", "")
    participants = [p.get("athlete", {}).get("displayName", "") for p in event.get("participants", [])]
    team = event.get("team", {}).get("displayName", "") if event.get("team") else ""

    prompt = f"""Tu es un COMMENTATEUR SPORTIF PASSIONNÉ pour Afrique Sports !

Match: {match_context['homeTeam']} vs {match_context['awayTeam']}
Score: {match_context['score']}
Minute: {time_display}

Événement ESPN:
- Type: {event_type}
- Équipe: {team}
- Joueurs: {', '.join(participants) if participants else 'N/A'}
- Description: {text}

TA MISSION: Transforme cet événement en commentaire SENSATIONNEL en français !

RÈGLES:
- Écris comme un commentateur PASSIONNÉ qui vit le match
- Utilise des EXCLAMATIONS et de l'ÉMOTION !
- Minimum 100 caractères
- BEAUCOUP d'emojis pertinents 🔥⚽🎯
- Mentionne les joueurs concernés
- Pour les BUTS: sois EXPLOSIF !
- Pour les cartons: montre la tension
- Pour les remplacements: analyse tactique rapide

Réponds UNIQUEMENT avec le texte du commentaire (pas de JSON, pas de préfixe)."""

    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.7,
                    "num_predict": 300
                }
            },
            timeout=60
        )

        result = response.json()
        return result.get("response", "").strip()

    except Exception as e:
        print(f"  Ollama error: {e}")
        return text or f"{event_type} - {team}"


def post_commentary(event_data: dict, match_id: str) -> bool:
    """Post commentary event to API"""
    global event_counter
    event_counter += 1

    payload = {
        "match_id": match_id,
        "event_id": f"replay_{event_counter}",
        "competition": "CAN 2025",
        "time": event_data.get("time", ""),
        "time_seconds": event_counter,
        "locale": "fr",
        "text": event_data.get("text", ""),
        "type": event_data.get("type", "commentary"),
        "team": event_data.get("team"),
        "player_name": event_data.get("player"),
        "icon": get_event_icon(event_data.get("type", "")),
        "is_scoring": event_data.get("type") == "goal",
        "confidence": 0.95,
        "source": "espn_replay_ollama"
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


def replay_match(match_id: str, speed: float = 1.0, include_commentary: bool = True):
    """Replay a match from ESPN data"""

    print(f"\n🎬 Match Replay Agent")
    print(f"⚽ Match ID: {match_id}")
    print(f"⏱️  Speed: {speed}x")
    print(f"🤖 Model: {OLLAMA_MODEL}")
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
        "score": f"{competitors[0].get('score', 0)} - {competitors[1].get('score', 0)}"
    }

    print(f"🏟️  {match_context['homeTeam']} vs {match_context['awayTeam']}")
    print(f"📊 Final: {match_context['score']}")

    # Get key events
    key_events = data.get("keyEvents", [])
    commentary = data.get("commentary", []) if include_commentary else []

    print(f"📋 Key events: {len(key_events)}")
    print(f"💬 Commentary: {len(commentary)}")
    print("-" * 50)

    # Process key events first (goals, cards, subs)
    print("\n🚀 Starting match replay...")

    # Post kickoff
    kickoff_text = transform_with_ollama({
        "type": {"text": "Kickoff"},
        "clock": {"displayValue": "0'"},
        "text": f"Le match commence entre {match_context['homeTeam']} et {match_context['awayTeam']}",
        "team": None,
        "participants": []
    }, match_context)

    post_commentary({
        "time": "0'",
        "type": "kickoff",
        "text": kickoff_text,
        "team": None,
        "player": None
    }, match_id)

    time.sleep(1.0 / speed)

    # Process key events
    for event in key_events:
        event_type_text = event.get("type", {}).get("text", "")

        # Skip kickoff (already posted) and some meta events
        if event_type_text in ["Kickoff", "Start 2nd Half"]:
            continue

        time_display = event.get("clock", {}).get("displayValue", "")
        team = event.get("team", {}).get("displayName", "") if event.get("team") else None
        participants = [p.get("athlete", {}).get("displayName", "") for p in event.get("participants", [])]

        # Transform with Ollama
        print(f"\n⏱️  {time_display} - {event_type_text}")
        transformed_text = transform_with_ollama(event, match_context)

        # Update score for goals
        if event_type_text == "Goal":
            if team == match_context["homeTeam"]:
                home_score = int(match_context["score"].split(" - ")[0]) + 1
                away_score = int(match_context["score"].split(" - ")[1])
            else:
                home_score = int(match_context["score"].split(" - ")[0])
                away_score = int(match_context["score"].split(" - ")[1]) + 1
            match_context["score"] = f"{home_score} - {away_score}"

        # Post event
        post_commentary({
            "time": time_display,
            "type": normalize_event_type(event_type_text),
            "text": transformed_text,
            "team": team,
            "player": participants[0] if participants else None
        }, match_id)

        # Delay based on event importance
        delay = 0.5 if event_type_text == "Goal" else 0.3
        time.sleep(delay / speed)

    # Add some commentary between events if requested
    if include_commentary and len(commentary) > 0:
        print("\n📝 Adding match commentary...")

        # Select ~10 interesting commentary items
        selected = [c for c in commentary if c.get("text") and len(c.get("text", "")) > 50][:15]

        for item in selected:
            time_display = item.get("clock", {}).get("displayValue", item.get("time", ""))
            text = item.get("text", "")

            # Transform with Ollama
            transformed = transform_with_ollama({
                "type": {"text": "Commentary"},
                "clock": {"displayValue": time_display},
                "text": text,
                "team": None,
                "participants": []
            }, match_context)

            post_commentary({
                "time": time_display,
                "type": "commentary",
                "text": transformed,
                "team": None,
                "player": None
            }, match_id)

            time.sleep(0.3 / speed)

    # Post full time
    fulltime_text = transform_with_ollama({
        "type": {"text": "Full Time"},
        "clock": {"displayValue": "90'"},
        "text": f"C'EST TERMINÉ ! {match_context['homeTeam']} {match_context['score']} {match_context['awayTeam']}",
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
    print(f"📊 Final: {match_context['homeTeam']} {match_context['score']} {match_context['awayTeam']}")
    print(f"📝 Events posted: {event_counter}")


def main():
    parser = argparse.ArgumentParser(description="Match Replay Agent")
    parser.add_argument("--match", required=True, help="ESPN Match ID")
    parser.add_argument("--speed", type=float, default=2.0, help="Replay speed multiplier")
    parser.add_argument("--no-commentary", action="store_true", help="Skip additional commentary")
    args = parser.parse_args()

    try:
        replay_match(args.match, args.speed, not args.no_commentary)
    except KeyboardInterrupt:
        print("\n\n🛑 Replay stopped by user")


if __name__ == "__main__":
    main()
