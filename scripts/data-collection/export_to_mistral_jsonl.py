#!/usr/bin/env python3
"""
Export commentary to Mistral chat format JSONL
Formats data for Mistral 7B fine-tuning
"""

import json
import sys
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_training_prompt(entry: dict) -> dict:
    """
    Create a Mistral chat format prompt from commentary entry

    Args:
        entry: Commentary dictionary

    Returns:
        Mistral chat format dictionary
    """
    time = entry['time']
    event_type = entry['event_type']
    text = entry['text']

    # System message
    system_message = "Tu es un commentateur sportif professionnel pour L'Équipe, spécialisé dans le football. Ton style est vif, précis, émotionnel mais jamais sensationnaliste. Tu varies ton vocabulaire et ta structure de phrases."

    # User prompt with context
    event_type_fr = {
        'commentary': 'Commentaire général',
        'goal': 'But',
        'yellow_card': 'Carton jaune',
        'red_card': 'Carton rouge',
        'substitution': 'Remplacement',
        'penalty': 'Pénalty'
    }.get(event_type, event_type)

    user_prompt = f"Génère un commentaire de match pour:\n\nMinute: {time}\nType d'événement: {event_type_fr}\n\nCommentaire:"

    # Mistral chat format
    return {
        "messages": [
            {"role": "system", "content": system_message},
            {"role": "user", "content": user_prompt},
            {"role": "assistant", "content": text}
        ]
    }


def export_to_jsonl(
    input_file: str = 'data/training_commentary.json',
    output_file: str = 'data/mistral_training.jsonl'
):
    """
    Export commentary to Mistral JSONL format

    Args:
        input_file: Input JSON file with commentary
        output_file: Output JSONL file for training
    """
    logger.info(f"📂 Loading commentary from {input_file}")

    with open(input_file, 'r', encoding='utf-8') as f:
        commentary = json.load(f)

    logger.info(f"✅ Loaded {len(commentary)} commentary entries")

    # Convert to Mistral format
    training_examples = []
    for entry in commentary:
        # Only include quality entries (minimum length)
        if len(entry['text']) >= 30:
            example = create_training_prompt(entry)
            training_examples.append(example)

    logger.info(f"✅ Created {len(training_examples)} training examples")

    # Write to JSONL
    with open(output_file, 'w', encoding='utf-8') as f:
        for example in training_examples:
            f.write(json.dumps(example, ensure_ascii=False) + '\n')

    logger.info(f"💾 Saved to: {output_file}")

    # Statistics
    logger.info(f"\n{'='*70}")
    logger.info("EXPORT STATISTICS")
    logger.info(f"{'='*70}")
    logger.info(f"Total examples: {len(training_examples)}")
    logger.info(f"File size: {Path(output_file).stat().st_size / 1024:.1f} KB")

    # Calculate average lengths
    total_chars = sum(len(ex['messages'][2]['content']) for ex in training_examples)
    avg_chars = total_chars / len(training_examples)
    logger.info(f"Average commentary length: {avg_chars:.1f} characters")

    # Event type distribution
    event_types = {}
    for entry in commentary:
        if len(entry['text']) >= 30:
            event_type = entry['event_type']
            event_types[event_type] = event_types.get(event_type, 0) + 1

    logger.info(f"\n📊 By event type:")
    for event_type, count in sorted(event_types.items(), key=lambda x: x[1], reverse=True):
        logger.info(f"   {event_type}: {count}")

    # Show sample
    logger.info(f"\n📝 Sample training example:")
    sample = training_examples[10]
    logger.info(f"\nSystem: {sample['messages'][0]['content'][:100]}...")
    logger.info(f"\nUser: {sample['messages'][1]['content']}")
    logger.info(f"\nAssistant: {sample['messages'][2]['content']}")

    logger.info(f"\n{'='*70}")
    logger.info("READY FOR FINE-TUNING!")
    logger.info(f"{'='*70}")
    logger.info(f"Upload {output_file} to Google Colab")
    logger.info(f"Expected training time: 6-12 hours on T4 GPU")
    logger.info(f"{'='*70}\n")

    return training_examples


def main():
    if len(sys.argv) > 1:
        input_file = sys.argv[1]
    else:
        input_file = 'data/training_commentary.json'

    if len(sys.argv) > 2:
        output_file = sys.argv[2]
    else:
        output_file = 'data/mistral_training.jsonl'

    export_to_jsonl(input_file, output_file)


if __name__ == '__main__':
    main()
