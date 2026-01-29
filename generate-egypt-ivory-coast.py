#!/usr/bin/env python3
"""
Generate pre-match analysis for Egypt vs Ivory Coast - CAN 2025 Quarter Final
"""

import json
import os
import re
import requests
from openai import OpenAI

MATCH_ID = "732179"
HOME_TEAM = "Egypte"
AWAY_TEAM = "Côte d'Ivoire"

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
WEBHOOK_SECRET = "test-secret"
API_URL = "https://www.afriquesports.net/api/can2025/prematch-analysis"

client = OpenAI(api_key=OPENAI_API_KEY)


def generate_analysis():
    print("🔄 Generating pre-match analysis with GPT-4o-mini...")

    system_prompt = """Tu es un expert en analyse tactique de football africain, spécialisé dans la CAN 2025. Tu produis des analyses pré-match professionnelles en français pour Afrique Sports.

IMPORTANT - Ce match est un QUART DE FINALE DE LA CAN 2025:
- L'Egypte de Mohamed Salah affronte la Côte d'Ivoire, tenante du titre
- Match crucial pour les deux équipes
- Stade: Grand Stade d'Agadir, Maroc
- Date: 10 janvier 2025 à 20h00

RÈGLES:
- Utilise les articles définis pour les noms de pays (L'Egypte, La Côte d'Ivoire)
- Analyse tactique et passionnée comme un vrai commentateur africain
- Sois précis sur les joueurs et leurs clubs actuels"""

    user_prompt = f"""Génère une analyse pré-match COMPLÈTE pour le QUART DE FINALE CAN 2025 entre l'{HOME_TEAM} et la {AWAY_TEAM}.

C'est un match de très haut niveau entre:
- L'EGYPTE: 7 fois champion d'Afrique, emmenée par Mohamed Salah (Liverpool), Omar Marmoush (Eintracht Frankfurt), Mohamed Abdelmonem
- LA CÔTE D'IVOIRE: Tenante du titre (CAN 2024 à domicile), avec Amad Diallo (Man United), Seko Fofana, Simon Adingra (Brighton), Oumar Diakité

STRUCTURE EXACTE (5 sections avec les titres en gras):

**Face-à-face historique:**
[Historique des confrontations légendaires, incluant les finales CAN 2006 (Egypte gagne aux tirs au but) et 2008 (Egypte gagne 1-0), c'est une vraie rivalité africaine!]

**Forme récente:**
[Parcours des deux équipes dans cette CAN 2025 - phase de groupes et 8èmes de finale, qui a impressionné?]

**Joueurs clés:**
[Les stars à surveiller: Salah, Marmoush, Trezeguet pour l'Egypte; Diallo, Fofana, Adingra, Kessié pour la Côte d'Ivoire]

**Aperçu tactique:**
[Analyse des systèmes de jeu - L'Egypte joue en 4-3-1-2 avec Salah en meneur, la Côte d'Ivoire en 4-3-3 offensif]

**Pronostic:**
[Prédiction avec score probable pour ce quart de finale - qui sera en demi-finale?]

Sois PASSIONNÉ et PROFESSIONNEL comme un vrai commentateur de football africain! Minimum 150 mots par section."""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        max_tokens=2500,
        temperature=0.8
    )

    return response.choices[0].message.content


def parse_analysis(full_text):
    sections = {
        "head_to_head": "",
        "recent_form": "",
        "key_players": "",
        "tactical_preview": "",
        "prediction": ""
    }

    patterns = {
        "head_to_head": r"\*\*Face-à-face[^:]*:\*\*\s*([\s\S]*?)(?=\*\*|$)",
        "recent_form": r"\*\*Forme[^:]*:\*\*\s*([\s\S]*?)(?=\*\*|$)",
        "key_players": r"\*\*Joueurs[^:]*:\*\*\s*([\s\S]*?)(?=\*\*|$)",
        "tactical_preview": r"\*\*Aperçu[^:]*:\*\*\s*([\s\S]*?)(?=\*\*|$)",
        "prediction": r"\*\*Pronostic[^:]*:\*\*\s*([\s\S]*?)(?=\*\*|$)"
    }

    for key, pattern in patterns.items():
        match = re.search(pattern, full_text, re.IGNORECASE)
        if match:
            sections[key] = match.group(1).strip()

    if not sections["tactical_preview"]:
        sections["tactical_preview"] = full_text

    return sections


def post_to_api(sections):
    payload = {
        "match_id": MATCH_ID,
        "locale": "fr",
        "home_team": HOME_TEAM,
        "away_team": AWAY_TEAM,
        "competition": "CAN 2025",
        **sections,
        "confidence_score": 0.90
    }

    response = requests.post(
        API_URL,
        json=payload,
        headers={
            "Content-Type": "application/json",
            "x-webhook-secret": WEBHOOK_SECRET
        },
        timeout=30
    )

    return response.json()


def main():
    print("=" * 50)
    print("🏆 CAN 2025 - QUART DE FINALE")
    print("⚽ Egypte vs Côte d'Ivoire")
    print("🏟️  Grand Stade d'Agadir, Maroc")
    print("=" * 50)
    print()

    try:
        analysis = generate_analysis()
        print("✅ Analysis generated!")
        print()
        print("─" * 50)
        print(analysis)
        print("─" * 50)
        print()

        sections = parse_analysis(analysis)
        print("📊 Parsed sections:")
        print(f"  - Face-à-face: {len(sections['head_to_head'])} chars")
        print(f"  - Forme récente: {len(sections['recent_form'])} chars")
        print(f"  - Joueurs clés: {len(sections['key_players'])} chars")
        print(f"  - Aperçu tactique: {len(sections['tactical_preview'])} chars")
        print(f"  - Pronostic: {len(sections['prediction'])} chars")
        print()

        print("📤 Publishing to database...")
        result = post_to_api(sections)

        if result.get("success"):
            print("✅ Pre-match analysis published successfully!")
            print()
            print("🔗 View at: https://www.afriquesports.net/can-2025/match/egypt-vs-ivory-coast-732179")
        else:
            print(f"❌ Failed: {json.dumps(result, indent=2)}")

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
