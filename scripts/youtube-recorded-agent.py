#!/usr/bin/env python3
"""
YouTube Recorded Video Commentary Agent
For processing recorded match commentary videos (not live streams)

Downloads full audio once, then processes in chunks with timestamps

Usage:
python youtube-recorded-agent.py --url "https://youtube.com/watch?v=xxx" --match 732178
"""

import argparse
import json
import os
import re
import subprocess
import tempfile
import time
from pathlib import Path

import requests
from faster_whisper import WhisperModel
from openai import OpenAI

# Configuration
API_URL = "https://www.afriquesports.net/api/can2025/live-commentary"
WEBHOOK_SECRET = "test-secret"
WHISPER_MODEL = "small"
CHUNK_DURATION = 60  # seconds per chunk

posted_texts = set()
event_counter = 0


def download_full_audio(youtube_url: str, output_dir: str) -> str | None:
    """Download full audio from YouTube video"""
    output_file = os.path.join(output_dir, "full_audio.mp3")

    print(f"📥 Downloading full audio from YouTube...")

    try:
        cmd = [
            "yt-dlp",
            "-f", "bestaudio[ext=m4a]/bestaudio",
            "-x",
            "--audio-format", "mp3",
            "--audio-quality", "64K",
            "-o", output_file.replace(".mp3", ".%(ext)s"),
            "--no-playlist",
            "--quiet",
            "--progress",
            youtube_url
        ]

        subprocess.run(cmd, check=True, timeout=600)

        # Find output file
        for ext in [".mp3", ".m4a", ".webm"]:
            f = output_file.replace(".mp3", ext)
            if os.path.exists(f):
                if not f.endswith(".mp3"):
                    subprocess.run([
                        "ffmpeg", "-y", "-i", f,
                        "-ar", "16000", "-ac", "1", "-b:a", "64k",
                        output_file
                    ], capture_output=True, timeout=300)
                    os.remove(f)
                print(f"✅ Audio downloaded: {output_file}")
                return output_file

        return None

    except Exception as e:
        print(f"❌ Error downloading audio: {e}")
        return None


def get_audio_duration(audio_file: str) -> float:
    """Get duration of audio file in seconds"""
    try:
        result = subprocess.run([
            "ffprobe", "-v", "error", "-show_entries",
            "format=duration", "-of", "default=noprint_wrappers=1:nokey=1",
            audio_file
        ], capture_output=True, text=True, timeout=30)
        return float(result.stdout.strip())
    except:
        return 0


def extract_chunk(audio_file: str, start_time: float, duration: float, output_file: str) -> bool:
    """Extract a chunk from audio file"""
    try:
        subprocess.run([
            "ffmpeg", "-y", "-i", audio_file,
            "-ss", str(start_time),
            "-t", str(duration),
            "-ar", "16000", "-ac", "1",
            output_file
        ], capture_output=True, timeout=60)
        return os.path.exists(output_file)
    except:
        return False


def transcribe_audio(model: WhisperModel, audio_file: str) -> str:
    """Transcribe audio using faster-whisper"""
    try:
        segments, _ = model.transcribe(
            audio_file,
            language="fr",
            beam_size=5,
            vad_filter=True
        )
        return " ".join([s.text for s in segments]).strip()
    except Exception as e:
        print(f"  ❌ Transcription error: {e}")
        return ""


def seconds_to_match_time(seconds: float, video_start_minute: int = 0) -> str:
    """Convert video timestamp to match time format"""
    match_seconds = seconds + (video_start_minute * 60)
    minutes = int(match_seconds // 60)
    if minutes > 90:
        extra = minutes - 90
        return f"90'+{extra}'"
    return f"{minutes}'"


def extract_events_with_openai(client: OpenAI, transcription: str, match_context: dict, time_range: str) -> list:
    """Extract events using OpenAI GPT-4o-mini"""

    prompt = f"""Tu es un COMMENTATEUR SPORTIF PASSIONNÉ pour Afrique Sports !

Match: {match_context['homeTeam']} vs {match_context['awayTeam']}
Période du commentaire: {time_range}

Transcription audio du commentateur:
"{transcription}"

TA MISSION: Extraire les moments clés et les transformer en commentaires SENSATIONNELS !

RÈGLES:
- Identifie les événements mentionnés (buts, cartons, remplacements, occasions, etc.)
- "goal" UNIQUEMENT si le commentateur parle EXPLICITEMENT d'un but marqué
- Écris comme un commentateur PASSIONNÉ africain
- Minimum 100 caractères par commentaire
- Ajoute des emojis 🔥⚽🎯

Réponds en JSON:
{{"events": [{{"type": "goal|yellowCard|redCard|substitution|commentary|highlight|shot|save", "time": "{time_range}", "text": "Commentaire sensationnel!", "player": null, "team": null}}]}}

Si rien d'important, retourne {{"events": []}}"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Tu extrais les événements d'un commentaire sportif. Réponds uniquement en JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.5,
            max_tokens=800
        )

        content = response.choices[0].message.content
        json_match = re.search(r'\{[\s\S]*\}', content)
        if json_match:
            return json.loads(json_match.group()).get("events", [])
        return []

    except Exception as e:
        print(f"  ❌ OpenAI error: {e}")
        return []


def get_event_icon(event_type: str) -> str:
    icons = {
        "goal": "⚽", "shot": "🎯", "yellowCard": "🟨", "redCard": "🟥",
        "substitution": "🔄", "save": "🧤", "commentary": "🎙️", "highlight": "✨"
    }
    return icons.get(event_type, "▶️")


def post_commentary(event: dict, match_id: str) -> bool:
    global event_counter

    text_key = f"{event.get('time', '')}_{event.get('text', '')[:30]}"
    if text_key in posted_texts:
        return False

    event_counter += 1

    payload = {
        "match_id": match_id,
        "event_id": f"recorded_{event_counter}",
        "competition": "CAN 2025",
        "time": event.get("time", ""),
        "time_seconds": event_counter,
        "locale": "fr",
        "text": event.get("text", ""),
        "type": event.get("type", "commentary"),
        "team": event.get("team"),
        "player_name": event.get("player"),
        "icon": get_event_icon(event.get("type", "")),
        "is_scoring": 1 if event.get("type") == "goal" else 0,
        "confidence": 0.95,
        "source": "youtube_recorded_whisper_openai"
    }

    try:
        response = requests.post(
            API_URL, json=payload,
            headers={"Content-Type": "application/json", "x-webhook-secret": WEBHOOK_SECRET},
            timeout=10
        )
        if response.ok:
            posted_texts.add(text_key)
            print(f"  ✅ [{event.get('time', '--')}] {event.get('text', '')[:60]}...")
            return True
        return False
    except Exception as e:
        print(f"  ❌ Post error: {e}")
        return False


def get_match_context(match_id: str) -> dict:
    try:
        url = f"https://site.api.espn.com/apis/site/v2/sports/soccer/caf.nations/summary?event={match_id}"
        data = requests.get(url, timeout=10).json()
        comp = data.get("header", {}).get("competitions", [{}])[0]
        competitors = comp.get("competitors", [{}, {}])
        return {
            "homeTeam": competitors[0].get("team", {}).get("displayName", "Home"),
            "awayTeam": competitors[1].get("team", {}).get("displayName", "Away"),
        }
    except:
        return {"homeTeam": "Home", "awayTeam": "Away"}


def main():
    parser = argparse.ArgumentParser(description="YouTube Recorded Video Commentary Agent")
    parser.add_argument("--url", required=True, help="YouTube video URL")
    parser.add_argument("--match", required=True, help="Match ID")
    parser.add_argument("--start-minute", type=int, default=0, help="Video start corresponds to which match minute")
    parser.add_argument("--whisper-model", default=WHISPER_MODEL, help="Whisper model size")
    args = parser.parse_args()

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("❌ OPENAI_API_KEY not set")
        return

    client = OpenAI(api_key=api_key)

    print(f"\n🎬 YouTube Recorded Video Agent")
    print(f"📺 Video: {args.url}")
    print(f"⚽ Match: {args.match}")
    print("-" * 50)

    # Get match context
    match_context = get_match_context(args.match)
    print(f"🏟️  {match_context['homeTeam']} vs {match_context['awayTeam']}")

    # Create temp directory
    temp_dir = tempfile.mkdtemp(prefix="recorded-agent-")

    try:
        # Download full audio
        audio_file = download_full_audio(args.url, temp_dir)
        if not audio_file:
            print("❌ Failed to download audio")
            return

        # Get duration
        duration = get_audio_duration(audio_file)
        print(f"⏱️  Video duration: {int(duration//60)}:{int(duration%60):02d}")

        # Load whisper
        print(f"\n🔊 Loading Whisper model ({args.whisper_model})...")
        whisper_model = WhisperModel(args.whisper_model, device="cpu", compute_type="int8")
        print("✅ Model loaded!")

        # Process in chunks
        print(f"\n🎙️  Processing {int(duration // CHUNK_DURATION) + 1} chunks...\n")

        current_pos = 0
        chunk_num = 0

        while current_pos < duration:
            chunk_num += 1
            chunk_end = min(current_pos + CHUNK_DURATION, duration)
            time_range = seconds_to_match_time(current_pos, args.start_minute)

            print(f"📍 Chunk {chunk_num}: {time_range} ({int(current_pos//60)}:{int(current_pos%60):02d} - {int(chunk_end//60)}:{int(chunk_end%60):02d})")

            # Extract chunk
            chunk_file = os.path.join(temp_dir, f"chunk_{chunk_num}.mp3")
            if not extract_chunk(audio_file, current_pos, CHUNK_DURATION, chunk_file):
                current_pos = chunk_end
                continue

            # Transcribe
            transcription = transcribe_audio(whisper_model, chunk_file)
            if transcription:
                print(f"  📝 \"{transcription[:80]}...\"")

                # Extract events
                events = extract_events_with_openai(client, transcription, match_context, time_range)

                for event in events:
                    post_commentary(event, args.match)
                    time.sleep(0.2)

                if not events:
                    print("  📋 No significant events")
            else:
                print("  🔇 No speech detected")

            # Cleanup chunk
            if os.path.exists(chunk_file):
                os.remove(chunk_file)

            current_pos = chunk_end

        print(f"\n{'='*50}")
        print(f"🏁 Processing complete!")
        print(f"📝 Events posted: {event_counter}")

    except KeyboardInterrupt:
        print("\n🛑 Stopped by user")
    finally:
        import shutil
        shutil.rmtree(temp_dir, ignore_errors=True)


if __name__ == "__main__":
    main()
