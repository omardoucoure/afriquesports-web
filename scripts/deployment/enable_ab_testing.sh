#!/bin/bash
# Enable A/B testing between Llama 3.1 and Mistral
# 50/50 traffic split for gradual rollout

set -e

SERVER="root@159.223.103.16"

echo "=========================================="
echo "🔀 Enabling A/B Testing"
echo "=========================================="
echo ""

# Create A/B testing configuration
cat > /tmp/enable_ab_test.py << 'EOF'
#!/usr/bin/env python3
import json
from pathlib import Path

CONFIG_PATH = Path("/root/afcon-agent-temp/config/models.json")
CONFIG_PATH.parent.mkdir(parents=True, exist_ok=True)

# Read existing config or create new
if CONFIG_PATH.exists():
    with open(CONFIG_PATH) as f:
        config = json.load(f)
else:
    config = {}

# Enable A/B testing
config.update({
    "active_model": "llama3.1:8b",  # Control group
    "ab_test": {
        "enabled": True,
        "split_ratio": 0.5,  # 50/50 split
        "variant_model": "mistral-commentary",
        "control_model": "llama3.1:8b"
    },
    "models": {
        "llama3.1:8b": {
            "temperature": 0.8,
            "top_p": 0.9,
            "top_k": 40,
            "repeat_penalty": 1.1,
            "num_predict": 120
        },
        "mistral-commentary": {
            "temperature": 0.9,
            "top_p": 0.95,
            "top_k": 50,
            "repeat_penalty": 1.15,
            "num_predict": 120
        }
    }
})

with open(CONFIG_PATH, 'w') as f:
    json.dump(config, f, indent=2)

print("✅ A/B testing enabled:")
print(f"   Control: {config['ab_test']['control_model']}")
print(f"   Variant: {config['ab_test']['variant_model']}")
print(f"   Split: {int(config['ab_test']['split_ratio'] * 100)}%/{int((1-config['ab_test']['split_ratio']) * 100)}%")
EOF

# Upload and run
scp /tmp/enable_ab_test.py $SERVER:/root/afcon-agent-temp/
ssh $SERVER "cd /root/afcon-agent-temp && source venv/bin/activate && python enable_ab_test.py"

echo ""

# Create enhanced commentary generator with A/B testing
cat > /tmp/commentary_generator_ab.py << 'EOF'
#!/usr/bin/env python3
"""
Enhanced commentary generator with A/B testing support
"""

import requests
import time
from typing import List, Dict
from model_config import ModelConfig
from quality_monitor import ABTestMonitor


class CommentaryGeneratorAB:
    """Generate commentary with A/B testing support"""

    def __init__(self, ollama_url: str = "http://localhost:11434"):
        self.ollama_url = ollama_url
        self.context_memory: List[Dict] = []
        self.monitor = ABTestMonitor()

    def generate(self, minute: int, event_type: str, event_id: str, context: str = "") -> Dict:
        """
        Generate commentary with A/B testing

        Args:
            minute: Match minute
            event_type: Type of event (goal, commentary, etc.)
            event_id: Unique event identifier for consistent A/B split
            context: Additional context

        Returns:
            Dict with 'text', 'model', 'generation_time_ms'
        """
        # Determine which model to use
        import json
        config_path = "/root/afcon-agent-temp/config/models.json"

        try:
            with open(config_path) as f:
                config = json.load(f)

            ab_config = config.get('ab_test', {})

            if ab_config.get('enabled', False):
                # A/B test is active - use hash-based split
                if self.monitor.should_use_variant(event_id):
                    model = ab_config['variant_model']
                else:
                    model = ab_config['control_model']
            else:
                # No A/B test - use active model
                model = ModelConfig.get_active_model()
        except Exception as e:
            # Fallback to default
            model = "llama3.1:8b"

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

            # Log metrics for A/B test
            self.monitor.log_metric(model, text, elapsed_ms)

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
        """Clear context memory"""
        self.context_memory = []
EOF

# Upload enhanced generator
scp /tmp/commentary_generator_ab.py $SERVER:/root/afcon-agent-temp/

echo ""
echo "=========================================="
echo "✅ A/B Testing Enabled!"
echo "=========================================="
echo ""
echo "The system will now:"
echo "  - Use Llama 3.1 for 50% of events (control)"
echo "  - Use Mistral for 50% of events (variant)"
echo "  - Log quality metrics for comparison"
echo ""
echo "Next steps:"
echo "  1. Monitor metrics with: ./monitor_ab_test.sh"
echo "  2. After collecting 20+ samples, check recommendation"
echo "  3. Rollout to 100% if Mistral performs better"
echo ""
