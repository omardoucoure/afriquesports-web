#!/usr/bin/env python3
"""
YouTube Audio Commentary Agent - Hybrid Version
Uses faster-whisper for local transcription + OpenAI GPT-4o-mini for event extraction

Benefits:
- Free local transcription (faster-whisper)
- Reliable event extraction (OpenAI GPT-4o-mini, ~$0.01/match)
- No hallucinations

Requirements:
- yt-dlp (brew install yt-dlp)
- ffmpeg (brew install ffmpeg)
- faster-whisper (pip install faster-whisper)
- openai (pip install openai)

Usage:
python youtube-audio-agent-hybrid.py --url "https://youtube.com/watch?v=xxx" --match 732178
"""

import argparse
import json
import os
import re
import subprocess
import tempfile
import time
from datetime import datetime
from pathlib import Path

import requests
from faster_whisper import WhisperModel
from openai import OpenAI

# Configuration
API_URL = "https://www.afriquesports.net/api/can2025/live-commentary"
WEBHOOK_SECRET = "test-secret"
WHISPER_MODEL = "small"  # Options: tiny, base, small, medium, large-v3
CHUNK_DURATION = 30  # seconds

# Track posted events to avoid duplicates
posted_texts = set()
event_counter = 500


def extract_audio_chunk(youtube_url: str, temp_dir: str) -> str | None:
    """Extract audio chunk from YouTube stream using yt-dlp"""
    output_file = os.path.join(temp_dir, f"chunk_{int(time.time())}.mp3")

    print(f"  🎵 Extracting {CHUNK_DURATION}s audio chunk...")

    try:
        # Use yt-dlp to download audio - try different formats
        for fmt in ["91", "bestaudio[ext=m4a]", "bestaudio"]:
            cmd = [
                "yt-dlp",
                "-f", fmt,
                "--downloader", "ffmpeg",
                "--downloader-args", f"ffmpeg:-t {CHUNK_DURATION}",
                "-x",
                "--audio-format", "mp3",
                "--audio-quality", "64K",
                "-o", output_file.replace(".mp3", ".%(ext)s"),
                "--no-playlist",
                "--no-part",
                "--quiet",
                youtube_url
            ]

            try:
                subprocess.run(cmd, check=True, capture_output=True, timeout=60)
                break
            except subprocess.CalledProcessError:
                continue

        # Find the output file
        possible_files = [
            output_file,
            output_file.replace(".mp3", ".m4a"),
            output_file.replace(".mp3", ".webm")
        ]

        for f in possible_files:
            if os.path.exists(f):
                if not f.endswith(".mp3"):
                    mp3_file = output_file
                    subprocess.run([
                        "ffmpeg", "-y", "-i", f,
                        "-ar", "16000", "-ac", "1", "-b:a", "64k",
                        mp3_file
                    ], capture_output=True, timeout=30)
                    os.remove(f)
                    return mp3_file
                return f

        return None

    except Exception as e:
        print(f"  ❌ Error extracting audio: {e}")
        return None


def transcribe_audio(model: WhisperModel, audio_file: str) -> str:
    """Transcribe audio using local faster-whisper"""
    print(f"  📝 Transcribing with Whisper ({WHISPER_MODEL})...")

    try:
        segments, info = model.transcribe(
            audio_file,
            language="fr",
            beam_size=5,
            vad_filter=True
        )

        text = " ".join([segment.text for segment in segments])
        return text.strip()

    except Exception as e:
        print(f"  ❌ Error transcribing: {e}")
        return ""


def get_match_context(match_id: str) -> dict:
    """Get current match context from ESPN API"""
    try:
        url = f"https://site.api.espn.com/apis/site/v2/sports/soccer/caf.nations/summary?event={match_id}"
        response = requests.get(url, timeout=10)
        data = response.json()

        comp = data.get("header", {}).get("competitions", [{}])[0]
        competitors = comp.get("competitors", [{}, {}])

        return {
            "homeTeam": competitors[0].get("team", {}).get("displayName", "Home"),
            "awayTeam": competitors[1].get("team", {}).get("displayName", "Away"),
            "score": f"{competitors[0].get('score', 0)} - {competitors[1].get('score', 0)}",
            "clock": data.get("header", {}).get("status", {}).get("displayClock", "")
        }
    except:
        return {"homeTeam": "Home", "awayTeam": "Away", "score": "0-0", "clock": ""}


def extract_events_with_openai(client: OpenAI, transcription: str, match_context: dict) -> list:
    """Extract match events using OpenAI GPT-4o-mini"""
    print(f"  🤖 Extracting events with GPT-4o-mini...")

    prompt = f"""Tu es un COMMENTATEUR SPORTIF PASSIONNÉ pour Afrique Sports ! Tu retranscris les commentaires audio avec ÉNERGIE et SENSATIONNALISME !

Match: {match_context['homeTeam']} vs {match_context['awayTeam']}
Score actuel: {match_context['score']}

Transcription audio ({CHUNK_DURATION}s):
"{transcription}"

TA MISSION: Transformer cette transcription en commentaires SENSATIONNELS !

RÈGLE CRITIQUE POUR LES BUTS:
- UTILISE "type": "goal" UNIQUEMENT si le commentateur dit EXPLICITEMENT "but", "goal", "il marque", "c'est le but", "1-0", "2-0", etc.
- Si c'est juste une action excitante, un tir, une occasion ratée → utilise "highlight" ou "shot", PAS "goal"
- NE PAS INVENTER de buts ! Sois FIDÈLE à ce que dit la transcription.
- En cas de doute, utilise "commentary" ou "highlight"

STYLE À ADOPTER:
- Écris comme un commentateur PASSIONNÉ qui vit le match
- Utilise des EXCLAMATIONS variées et de l'ÉMOTION !
- Ajoute du SUSPENSE et du DRAMA
- Minimum 150 caractères par commentaire
- BEAUCOUP d'emojis

Réponds UNIQUEMENT en JSON valide (sans markdown, sans backticks):
{{"events": [{{"type": "shot|foul|yellowCard|redCard|corner|substitution|save|offside|commentary|analysis|highlight|goal", "time": "{match_context['clock'] or ''}", "text": "Commentaire SENSATIONNEL avec emojis !", "player": null, "team": null, "importance": 5}}]}}

RAPPEL: "goal" = SEULEMENT si un but est CONFIRMÉ dans la transcription !"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Tu es un commentateur sportif passionné. Réponds uniquement en JSON valide."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.5,
            max_tokens=1000
        )

        content = response.choices[0].message.content

        # Extract JSON from response
        json_match = re.search(r'\{[\s\S]*\}', content)
        if json_match:
            events_data = json.loads(json_match.group())
            return events_data.get("events", [])

        return []

    except Exception as e:
        print(f"  ❌ Error with OpenAI: {e}")
        return []


def get_icon(event_type: str) -> str:
    """Get emoji icon for event type"""
    icons = {
        "goal": "⚽",
        "shot": "🎯",
        "foul": "🚫",
        "yellowCard": "🟨",
        "redCard": "🟥",
        "corner": "🚩",
        "substitution": "🔄",
        "save": "🧤",
        "offside": "🚫",
        "info": "📢",
        "commentary": "🎙️",
        "analysis": "📊",
        "highlight": "✨"
    }
    return icons.get(event_type, "▶️")


def post_commentary(event: dict, match_id: str) -> bool:
    """Post commentary event to API"""
    global event_counter

    # Check for duplicates
    text_key = f"{event.get('time', '')}_{event.get('type', '')}_{event.get('text', '')[:30]}"
    if text_key in posted_texts:
        print(f"  ⏭️  Skipping duplicate event")
        return False

    event_counter += 1

    payload = {
        "match_id": match_id,
        "event_id": f"hybrid_{event_counter}",
        "competition": "CAN 2025",
        "time": event.get("time", ""),
        "time_seconds": event_counter,
        "locale": "fr",
        "text": event.get("text", ""),
        "type": event.get("type", "commentary"),
        "team": event.get("team"),
        "player_name": event.get("player"),
        "icon": get_icon(event.get("type", "")),
        "is_scoring": event.get("type") == "goal",
        "confidence": 0.95,
        "source": "hybrid_whisper_openai"
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
            posted_texts.add(text_key)
            print(f"  ✅ [{event.get('time', '--')}] {event.get('text', '')[:60]}...")
            return True
        else:
            print(f"  ❌ Failed to post: {response.status_code}")
            return False

    except Exception as e:
        print(f"  ❌ Error posting: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description="YouTube Audio Commentary Agent (Hybrid)")
    parser.add_argument("--url", required=True, help="YouTube stream URL")
    parser.add_argument("--match", required=True, help="Match ID")
    parser.add_argument("--whisper-model", default=WHISPER_MODEL,
                       choices=["tiny", "base", "small", "medium", "large-v3"],
                       help="Whisper model size")
    args = parser.parse_args()

    # Check for OpenAI API key
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("❌ OPENAI_API_KEY environment variable not set")
        return

    client = OpenAI(api_key=api_key)

    print("\n🎙️  YouTube Audio Commentary Agent (HYBRID)")
    print(f"📺 Stream: {args.url}")
    print(f"⚽ Match ID: {args.match}")
    print(f"🤖 Whisper: {args.whisper_model} (local) | GPT-4o-mini (OpenAI)")
    print(f"🔄 Processing {CHUNK_DURATION}s chunks...\n")

    # Initialize Whisper model
    print("Loading Whisper model...")
    whisper_model = WhisperModel(
        args.whisper_model,
        device="cpu",
        compute_type="int8"
    )
    print("Whisper model loaded!\n")

    # Create temp directory
    temp_dir = tempfile.mkdtemp(prefix="audio-agent-")

    try:
        while True:
            try:
                # Get match context
                match_context = get_match_context(args.match)
                print(f"⏱️  {match_context['clock']} | {match_context['homeTeam']} {match_context['score']} {match_context['awayTeam']}")

                # Extract audio chunk
                audio_file = extract_audio_chunk(args.url, temp_dir)
                if not audio_file:
                    print("  Failed to extract audio, retrying...")
                    time.sleep(10)
                    continue

                # Transcribe locally with faster-whisper
                transcription = transcribe_audio(whisper_model, audio_file)
                if transcription:
                    print(f"  📝 \"{transcription[:100]}...\"")
                else:
                    print("  No speech detected")
                    os.remove(audio_file)
                    time.sleep(CHUNK_DURATION - 5)
                    continue

                # Extract events with OpenAI GPT-4o-mini
                events = extract_events_with_openai(client, transcription, match_context)

                # Post events
                posted_count = 0
                for event in events:
                    importance = event.get("importance", 5)
                    if importance >= 2:
                        if post_commentary(event, args.match):
                            posted_count += 1
                        time.sleep(0.3)

                if posted_count == 0:
                    print("  📋 No significant events detected")
                else:
                    print(f"  📝 Posted {posted_count} events")

                # Cleanup
                if os.path.exists(audio_file):
                    os.remove(audio_file)

                # Wait before next chunk
                time.sleep(CHUNK_DURATION - 5)

            except KeyboardInterrupt:
                raise
            except Exception as e:
                print(f"  ❌ Error: {e}")
                time.sleep(10)

    except KeyboardInterrupt:
        print("\n\n🛑 Agent stopped by user")
    finally:
        import shutil
        shutil.rmtree(temp_dir, ignore_errors=True)


if __name__ == "__main__":
    main()
