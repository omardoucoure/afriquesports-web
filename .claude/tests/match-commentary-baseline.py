#!/usr/bin/env python3
"""
Full Match Commentary Test - Base Model Baseline
Generates 80+ commentary segments for a complete AFCON match
to establish baseline before LoRA fine-tuning
"""

import json
import requests
import time
from datetime import datetime
from typing import List, Dict

# vLLM API Configuration
VLLM_API_URL = "https://5x6ah8amw9oo9e-8000.proxy.runpod.net/v1"
API_KEY = "sk-1234"
BASE_MODEL = "Qwen/Qwen2.5-VL-7B-Instruct"

# Match Configuration
MATCH_CONFIG = {
    "competition": "CAN 2025 - Quart de finale",
    "home_team": "Maroc",
    "away_team": "Égypte",
    "venue": "Stade de la Paix, Bouaké",
    "date": "2025-02-02",
    "attendance": "35,000"
}

# Match Events Timeline (90+ minutes)
MATCH_EVENTS = [
    # Pre-match
    {"minute": -15, "type": "pre_match", "description": "Présentation des équipes"},
    {"minute": -10, "type": "pre_match", "description": "Échauffement des joueurs"},
    {"minute": -5, "type": "pre_match", "description": "Hymnes nationaux"},
    {"minute": 0, "type": "kickoff", "description": "Coup d'envoi du match"},

    # First Half
    {"minute": 1, "type": "possession", "team": "Maroc", "description": "Maroc contrôle le ballon"},
    {"minute": 3, "type": "attack", "team": "Maroc", "player": "Hakimi", "description": "Montée sur le côté droit"},
    {"minute": 5, "type": "corner", "team": "Maroc", "description": "Corner pour le Maroc"},
    {"minute": 7, "type": "attack", "team": "Égypte", "player": "Salah", "description": "Contre-attaque égyptienne"},
    {"minute": 10, "type": "possession", "team": "Égypte", "description": "Égypte tente de construire"},
    {"minute": 12, "type": "chance", "team": "Maroc", "player": "En-Nesyri", "description": "Grosse occasion marocaine"},
    {"minute": 15, "type": "save", "team": "Égypte", "player": "El Shenawy", "description": "Arrêt du gardien égyptien"},
    {"minute": 18, "type": "foul", "team": "Égypte", "player": "Hegazi", "description": "Faute dans l'axe"},
    {"minute": 20, "type": "free_kick", "team": "Maroc", "description": "Coup franc dangereux pour le Maroc"},
    {"minute": 22, "type": "attack", "team": "Égypte", "player": "Trézéguet", "description": "Percée sur le flanc gauche"},
    {"minute": 25, "type": "possession", "team": "Maroc", "description": "Maroc domine la possession"},
    {"minute": 28, "type": "yellow_card", "team": "Égypte", "player": "Elneny", "description": "Carton jaune pour Elneny"},
    {"minute": 30, "type": "analysis", "description": "Point tactique à la 30ème minute"},
    {"minute": 32, "type": "chance", "team": "Égypte", "player": "Salah", "description": "Salah face au but"},
    {"minute": 34, "type": "save", "team": "Maroc", "player": "Bounou", "description": "Parade de Bounou"},
    {"minute": 36, "type": "corner", "team": "Égypte", "description": "Corner pour l'Égypte"},
    {"minute": 38, "type": "attack", "team": "Maroc", "player": "Ziyech", "description": "Ziyech à la conclusion"},
    {"minute": 40, "type": "chance", "team": "Maroc", "player": "En-Nesyri", "description": "Tête d'En-Nesyri"},
    {"minute": 42, "type": "goal", "team": "Maroc", "player": "Hakimi", "score": "1-0", "description": "BUUUUT! Hakimi ouvre le score!"},
    {"minute": 43, "type": "celebration", "team": "Maroc", "description": "Explosion de joie marocaine"},
    {"minute": 45, "type": "added_time", "description": "3 minutes de temps additionnel"},
    {"minute": 45.1, "type": "attack", "team": "Égypte", "description": "Dernière attaque égyptienne"},
    {"minute": 45.3, "type": "half_time", "score": "1-0", "description": "Mi-temps"},

    # Half-time analysis
    {"minute": "HT", "type": "half_time_analysis", "description": "Analyse de la première mi-temps"},
    {"minute": "HT+5", "type": "stats", "description": "Statistiques de la première période"},
    {"minute": "HT+10", "type": "preview", "description": "Aperçu de la seconde mi-temps"},

    # Second Half
    {"minute": 46, "type": "kickoff", "description": "Début de la deuxième mi-temps"},
    {"minute": 47, "type": "substitution", "team": "Égypte", "player_out": "Elneny", "player_in": "Marmoush", "description": "Changement égyptien"},
    {"minute": 50, "type": "attack", "team": "Égypte", "player": "Salah", "description": "Égypte pousse pour égaliser"},
    {"minute": 52, "type": "chance", "team": "Égypte", "player": "Marmoush", "description": "Occasion pour le nouveau rentrant"},
    {"minute": 55, "type": "possession", "team": "Égypte", "description": "Domination égyptienne"},
    {"minute": 57, "type": "save", "team": "Maroc", "player": "Bounou", "description": "Bounou encore décisif"},
    {"minute": 60, "type": "analysis", "description": "Point tactique à l'heure de jeu"},
    {"minute": 62, "type": "attack", "team": "Maroc", "player": "Ziyech", "description": "Contre-attaque marocaine"},
    {"minute": 65, "type": "corner", "team": "Égypte", "description": "Énième corner égyptien"},
    {"minute": 67, "type": "goal", "team": "Égypte", "player": "Salah", "score": "1-1", "description": "ÉGALISATION! Salah remet les deux équipes à égalité!"},
    {"minute": 68, "type": "celebration", "team": "Égypte", "description": "Les Pharaons exultent"},
    {"minute": 70, "type": "substitution", "team": "Maroc", "player_out": "Ziyech", "player_in": "Adli", "description": "Changement marocain"},
    {"minute": 72, "type": "yellow_card", "team": "Maroc", "player": "Amrabat", "description": "Amrabat averti"},
    {"minute": 75, "type": "chance", "team": "Maroc", "player": "Adli", "description": "Adli cherche le but"},
    {"minute": 77, "type": "attack", "team": "Égypte", "player": "Trézéguet", "description": "L'Égypte sent la victoire"},
    {"minute": 80, "type": "substitution", "team": "Maroc", "player_out": "Ounahi", "player_in": "Amallah", "description": "Deuxième changement marocain"},
    {"minute": 82, "type": "chance", "team": "Maroc", "player": "En-Nesyri", "description": "En-Nesyri bute sur El Shenawy"},
    {"minute": 85, "type": "tension", "description": "La tension monte dans le stade"},
    {"minute": 87, "type": "substitution", "team": "Égypte", "player_out": "Trézéguet", "player_in": "Mostafa Mohamed", "description": "Dernier changement égyptien"},
    {"minute": 88, "type": "foul", "team": "Égypte", "description": "Faute égyptienne dans leur camp"},
    {"minute": 89, "type": "free_kick", "team": "Maroc", "description": "Coup franc pour le Maroc"},
    {"minute": 90, "type": "added_time", "description": "5 minutes de temps additionnel"},
    {"minute": 90.1, "type": "attack", "team": "Maroc", "description": "Assaut final marocain"},
    {"minute": 90.3, "type": "goal", "team": "Maroc", "player": "Amallah", "score": "2-1", "description": "BUUUUUT! Amallah en or pour le Maroc!"},
    {"minute": 90.4, "type": "celebration", "team": "Maroc", "description": "Délire dans les tribunes marocaines"},
    {"minute": 90.5, "type": "despair", "team": "Égypte", "description": "Déception égyptienne"},
    {"minute": 93, "type": "attack", "team": "Égypte", "description": "Dernière tentative égyptienne"},
    {"minute": 95, "type": "full_time", "score": "2-1", "description": "Coup de sifflet final"},

    # Post-match
    {"minute": "FT", "type": "full_time_analysis", "description": "Analyse du match"},
    {"minute": "FT+5", "type": "stats", "description": "Statistiques complètes"},
    {"minute": "FT+10", "type": "man_of_match", "description": "Homme du match"},
    {"minute": "FT+15", "type": "reactions", "description": "Réactions des joueurs"},
    {"minute": "FT+20", "type": "consequences", "description": "Conséquences pour la suite de la compétition"},
]

def generate_commentary(event: Dict, model: str = BASE_MODEL) -> Dict:
    """Generate commentary for a single match event"""

    # Build context-aware prompt
    minute_str = str(event['minute'])
    if isinstance(event['minute'], int):
        if event['minute'] < 0:
            minute_str = f"Avant le match"
        elif event['minute'] <= 45:
            minute_str = f"{event['minute']}' - Première mi-temps"
        elif event['minute'] > 45 and event['minute'] <= 90:
            minute_str = f"{event['minute']}' - Deuxième mi-temps"
        else:
            minute_str = f"{event['minute']}' - Temps additionnel"

    # Create system prompt for French AFCON commentary
    system_prompt = f"""Tu es un commentateur expert du football africain couvrant la CAN 2025.
Tu commentes le match {MATCH_CONFIG['home_team']} vs {MATCH_CONFIG['away_team']} en français.
Ton style est:
- Passionné et dynamique pour les actions importantes
- Analytique et précis pour les phases de jeu
- Utilisant un vocabulaire riche du football français
- Mentionnant le contexte CAN et la rivalité nord-africaine quand pertinent"""

    # Build event-specific prompt
    event_prompts = {
        "pre_match": f"Décris l'ambiance et les enjeux avant le coup d'envoi. {event.get('description', '')}",
        "kickoff": "Commente le coup d'envoi du match avec enthousiasme",
        "possession": f"{event.get('team', 'Une équipe')} contrôle le ballon. Commente la phase de possession",
        "attack": f"Commente l'action offensive de {event.get('player', event.get('team', ''))}. {event.get('description', '')}",
        "chance": f"Commente cette grosse occasion de {event.get('player', event.get('team', ''))}! {event.get('description', '')}",
        "goal": f"BUUUUT DE {event.get('player', '')} POUR {event.get('team', '')}! Score: {event.get('score', '')}. Commente ce but avec passion!",
        "save": f"Arrêt de {event.get('player', 'le gardien')}! Commente cette parade importante",
        "corner": f"Corner pour {event.get('team', 'une équipe')}. Commente cette phase arrêtée",
        "free_kick": f"Coup franc pour {event.get('team', 'une équipe')}. Décris la situation",
        "foul": f"Faute. {event.get('description', '')}. Commente",
        "yellow_card": f"Carton jaune pour {event.get('player', 'un joueur')}. Commente l'avertissement",
        "substitution": f"Changement: {event.get('player_in', '')} entre pour {event.get('player_out', '')}. Commente",
        "celebration": f"Célébration de {event.get('team', 'une équipe')}. Décris l'ambiance",
        "half_time": f"Mi-temps! Score: {event.get('score', '')}. Fais un résumé de la première période",
        "half_time_analysis": "Analyse tactique de la première mi-temps (3-4 phrases)",
        "stats": "Présente les statistiques importantes du match jusqu'ici",
        "analysis": "Fais une analyse tactique de la phase de jeu en cours",
        "tension": "Décris la tension qui monte dans le stade en fin de match",
        "added_time": f"{event.get('description', 'Temps additionnel')}. Commente le temps additionnel",
        "full_time": f"Coup de sifflet final! Score: {event.get('score', '')}. Commente la fin du match",
        "full_time_analysis": "Analyse complète du match (5-6 phrases)",
        "man_of_match": "Désigne et commente l'homme du match",
        "reactions": "Décris les réactions des joueurs après le match",
        "consequences": "Explique les conséquences de ce résultat pour la suite de la CAN",
        "preview": "Donne un aperçu de ce qui nous attend en deuxième mi-temps",
        "despair": f"Déception visible de {event.get('team', 'une équipe')}. Commente leur frustration"
    }

    user_prompt = event_prompts.get(event['type'], event.get('description', 'Commente cette action'))

    # Call vLLM API
    try:
        response = requests.post(
            f"{VLLM_API_URL}/chat/completions",
            headers={
                "Authorization": f"Bearer {API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "max_tokens": 200,
                "temperature": 0.8,  # Higher temperature for varied commentary
                "top_p": 0.9
            },
            timeout=30
        )
        response.raise_for_status()

        result = response.json()
        commentary = result['choices'][0]['message']['content']

        return {
            "event": event,
            "minute_display": minute_str,
            "prompt": user_prompt,
            "commentary": commentary,
            "model": model,
            "timestamp": datetime.now().isoformat(),
            "tokens": result['usage']['total_tokens']
        }

    except Exception as e:
        print(f"❌ Error at minute {event['minute']}: {str(e)}")
        return {
            "event": event,
            "minute_display": minute_str,
            "prompt": user_prompt,
            "commentary": f"[ERROR: {str(e)}]",
            "model": model,
            "timestamp": datetime.now().isoformat(),
            "error": str(e)
        }

def main():
    """Generate full match commentary"""

    print("=" * 60)
    print("AFCON 2025 - Match Commentary Baseline Test")
    print("=" * 60)
    print(f"Match: {MATCH_CONFIG['home_team']} vs {MATCH_CONFIG['away_team']}")
    print(f"Model: {BASE_MODEL}")
    print(f"Total events: {len(MATCH_EVENTS)}")
    print("=" * 60)
    print()

    results = []
    total_tokens = 0
    errors = 0

    for i, event in enumerate(MATCH_EVENTS, 1):
        minute = event['minute']
        print(f"[{i}/{len(MATCH_EVENTS)}] {minute}' - {event['type']}...", end=" ", flush=True)

        result = generate_commentary(event)
        results.append(result)

        if 'error' in result:
            print(f"❌ FAILED")
            errors += 1
        else:
            tokens = result.get('tokens', 0)
            total_tokens += tokens
            print(f"✅ ({tokens} tokens)")

            # Display commentary
            print(f"    📢 {result['commentary'][:100]}...")
            print()

        # Rate limiting - wait 2 seconds between requests
        if i < len(MATCH_EVENTS):
            time.sleep(2)

    # Save results
    output_file = f"baseline_commentary_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    output_path = f"/Users/omardoucoure/Documents/Afrique Sports/afriquesports-web/.claude/tests/{output_file}"

    output_data = {
        "metadata": {
            "test_type": "baseline_commentary",
            "model": BASE_MODEL,
            "match": MATCH_CONFIG,
            "total_events": len(MATCH_EVENTS),
            "total_tokens": total_tokens,
            "errors": errors,
            "success_rate": f"{((len(MATCH_EVENTS) - errors) / len(MATCH_EVENTS) * 100):.1f}%",
            "generated_at": datetime.now().isoformat()
        },
        "results": results
    }

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    print("=" * 60)
    print("Test Complete!")
    print("=" * 60)
    print(f"✅ Success: {len(MATCH_EVENTS) - errors}/{len(MATCH_EVENTS)}")
    print(f"❌ Errors: {errors}")
    print(f"📊 Total tokens: {total_tokens:,}")
    print(f"💾 Saved to: {output_file}")
    print()
    print("Next steps:")
    print("1. Review the baseline commentary")
    print("2. Train LoRA adapter on AFCON data")
    print("3. Re-run with trained model")
    print("4. Compare results and calculate loss")
    print("=" * 60)

if __name__ == "__main__":
    main()
