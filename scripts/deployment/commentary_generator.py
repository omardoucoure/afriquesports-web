#!/usr/bin/env python3
"""
Enhanced commentary generator with context memory and anti-repetition
Uses configuration-driven model selection
"""

import requests
import time
from typing import List, Dict
from model_config import ModelConfig


class CommentaryGenerator:
    """Generate commentary with context memory to avoid repetition"""

    def __init__(self, ollama_url: str = "http://localhost:11434"):
        self.ollama_url = ollama_url
        self.context_memory: List[Dict] = []  # Last 10 events

    def generate(self, minute: int, event_type: str, context: str = "") -> Dict:
        """
        Generate commentary with anti-repetition context

        Args:
            minute: Match minute (e.g., 23, "45'+2")
            event_type: Type of event (goal, commentary, substitution, etc.)
            context: Additional context about the event

        Returns:
            Dict with 'text', 'model', 'generation_time_ms'
        """
        model = ModelConfig.get_active_model()
        params = ModelConfig.get_model_params(model)

        # Build context-aware prompt
        recent_events = "\n".join([
            f"{e['minute']}': {e['text'][:50]}..."
            for e in self.context_memory[-5:]
        ]) if self.context_memory else "Début du match"

        # Map event types to French
        event_type_fr = {
            'goal': 'But',
            'commentary': 'Commentaire général',
            'yellow_card': 'Carton jaune',
            'red_card': 'Carton rouge',
            'substitution': 'Remplacement',
            'penalty': 'Pénalty',
            'corner': 'Corner',
            'free_kick': 'Coup franc'
        }.get(event_type, event_type)

        prompt = f"""Tu es un commentateur sportif pour Afrique Sports.

Événements récents:
{recent_events}

Minute actuelle: {minute}'
Type d'événement: {event_type_fr}
{f'Contexte: {context}' if context else ''}

Génère UN commentaire court (30-60 mots) DIFFÉRENT des précédents. Varie ton style: parfois court et percutant, parfois plus descriptif. SANS GUILLEMETS."""

        # Generate
        start_time = time.time()

        try:
            response = requests.post(
                f'{self.ollama_url}/api/generate',
                json={
                    'model': model,
                    'prompt': prompt,
                    'stream': False,
                    'options': {
                        'temperature': params['temperature'],
                        'top_p': params['top_p'],
                        'top_k': params['top_k'],
                        'repeat_penalty': params['repeat_penalty'],
                        'num_predict': params.get('num_predict', 120)
                    }
                },
                timeout=120
            )

            elapsed_ms = (time.time() - start_time) * 1000

            if response.status_code != 200:
                raise Exception(f"Ollama error: {response.status_code}")

            text = response.json()['response'].strip()

            # Clean up formatting
            text = text.replace('"', '').replace("'", "'")

            # Update context memory
            self.context_memory.append({
                'minute': minute,
                'text': text,
                'event_type': event_type
            })

            # Keep only last 10 events
            if len(self.context_memory) > 10:
                self.context_memory = self.context_memory[-10:]

            return {
                'text': text,
                'model': model,
                'generation_time_ms': elapsed_ms
            }

        except Exception as e:
            print(f"❌ Generation error: {e}")
            return {
                'text': f"Minute {minute}' - Action en cours...",
                'model': model,
                'generation_time_ms': 0,
                'error': str(e)
            }

    def clear_context(self):
        """Clear context memory (e.g., at start of new match)"""
        self.context_memory = []


if __name__ == '__main__':
    import sys

    # Test the generator
    generator = CommentaryGenerator()

    if len(sys.argv) < 3:
        print("Usage: python commentary_generator.py <minute> <event_type> [context]")
        print("\nExample:")
        print("  python commentary_generator.py 23 goal 'Mbappé frappe du gauche'")
        sys.exit(1)

    minute = sys.argv[1]
    event_type = sys.argv[2]
    context = sys.argv[3] if len(sys.argv) > 3 else ""

    print(f"\n🎯 Generating commentary...")
    print(f"   Minute: {minute}'")
    print(f"   Event: {event_type}")
    if context:
        print(f"   Context: {context}")

    result = generator.generate(minute, event_type, context)

    print(f"\n{'='*70}")
    print(f"Model: {result['model']}")
    print(f"Time: {result['generation_time_ms']:.0f}ms")
    print(f"{'='*70}")
    print(f"\n➡️  {result['text']}\n")
