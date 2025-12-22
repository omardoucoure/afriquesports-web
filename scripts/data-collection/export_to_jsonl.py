#!/usr/bin/env python3
"""
Export commentary data to JSONL format for Mistral fine-tuning
"""

import json
import sys


def export_to_jsonl(input_file: str, output_file: str):
    """
    Convert commentary JSON to Mistral training JSONL format

    Args:
        input_file: Path to JSON file with commentary
        output_file: Path to output JSONL file
    """

    with open(input_file, 'r', encoding='utf-8') as f:
        commentary_list = json.load(f)

    with open(output_file, 'w', encoding='utf-8') as f:
        for entry in commentary_list:
            # Create Mistral chat format
            training_example = {
                "messages": [
                    {
                        "role": "system",
                        "content": "Tu es un commentateur sportif professionnel pour L'Équipe, spécialisé dans le football africain. Ton style est vif, précis, émotionnel mais jamais sensationnaliste."
                    },
                    {
                        "role": "user",
                        "content": f"Génère un commentaire pour: Minute {entry['time']} - Événement: {entry['event_type']}"
                    },
                    {
                        "role": "assistant",
                        "content": entry['text']
                    }
                ]
            }

            f.write(json.dumps(training_example, ensure_ascii=False) + '\n')

    print(f"✅ Exported {len(commentary_list)} examples to {output_file}")


if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python export_to_jsonl.py <input_json> <output_jsonl>")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2]

    export_to_jsonl(input_file, output_file)
