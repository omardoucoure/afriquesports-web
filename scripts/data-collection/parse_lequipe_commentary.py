#!/usr/bin/env python3
"""
Parse L'Équipe commentary from RTF export
Extracts individual commentary entries with timestamps and event types
"""

import re
import json
import sys
from datetime import datetime
from typing import List, Dict

def parse_commentary_file(file_path: str) -> List[Dict]:
    """
    Parse L'Équipe commentary file

    Format: "90'+4 – Fin du match Le ballon circule..."
    Each entry starts with a timestamp followed by optional event label

    Returns:
        List of commentary dictionaries
    """

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    commentary_list = []

    # Split by line breaks
    lines = content.split('\n')

    # Pattern to match timestamps: 90', 90'+4, 45', etc.
    time_pattern = re.compile(r"^(\d+[′'](?:\+\d+)?)\s*[–-]?\s*(.*)")

    for line in lines:
        line = line.strip()
        if not line:
            continue

        match = time_pattern.match(line)
        if match:
            time_str = match.group(1)
            rest = match.group(2).strip()

            # Check for event type labels
            event_type = 'commentary'
            text = rest

            # Detect event types from text
            if 'But' in text[:20] or '⚽' in text[:20]:
                event_type = 'goal'
                # Remove "But de..." prefix if present
                text = re.sub(r'^But d[e\']?\s+[^(]+\(\d+-\d+\)\s*', '', text)
            elif 'Carton jaune' in text[:30] or '🟨' in text[:20]:
                event_type = 'yellow_card'
                text = re.sub(r'^Carton jaune pour\s+', '', text)
            elif 'Carton rouge' in text[:30] or '🟥' in text[:20]:
                event_type = 'red_card'
                text = re.sub(r'^Carton rouge pour\s+', '', text)
            elif 'Changement' in text[:20] or '🔄' in text[:20]:
                event_type = 'substitution'
                text = re.sub(r'^Changement\s+\([^)]+\)\s*', '', text)
            elif 'Penalty' in text[:20] or 'pénalty' in text[:20]:
                event_type = 'penalty'
            elif 'Fin du match' in text[:20] or 'coup de sifflet final' in text.lower():
                event_type = 'final_whistle'
            elif 'Mi-temps' in text[:20] or 'mi-temps' in text.lower():
                event_type = 'half_time'
            elif 'Temps additionnel' in text[:30]:
                event_type = 'added_time'
            elif "C'est reparti" in text[:30] or 'coup d\'envoi' in text.lower():
                event_type = 'kickoff'

            # Clean up text
            text = text.strip()

            # Normalize apostrophes and quotes
            text = text.replace('\u2019', "'").replace('\u201c', '"').replace('\u201d', '"')

            if text and len(text) > 10:  # Minimum length
                commentary_list.append({
                    'source': 'lequipe',
                    'time': time_str.replace('′', "'"),  # Normalize prime symbol
                    'text': text,
                    'event_type': event_type,
                    'scraped_at': datetime.utcnow().isoformat(),
                    'match': 'Morocco vs Comoros - CAN 2025'
                })

    return commentary_list


def main():
    if len(sys.argv) < 2:
        print("Usage: python parse_lequipe_commentary.py <file_path>")
        sys.exit(1)

    file_path = sys.argv[1]

    print("\n" + "=" * 70)
    print("PARSING L'ÉQUIPE COMMENTARY")
    print("=" * 70)
    print(f"\nInput file: {file_path}")

    # Parse commentary
    commentary = parse_commentary_file(file_path)

    print(f"\n✅ Extracted {len(commentary)} commentary entries")

    # Show samples
    print("\n" + "=" * 70)
    print("SAMPLE COMMENTARY (First 5)")
    print("=" * 70)

    for i, entry in enumerate(commentary[:5], 1):
        print(f"\n{i}. {entry['time']} - {entry['event_type']}")
        print(f"   {entry['text'][:100]}{'...' if len(entry['text']) > 100 else ''}")

    # Statistics
    print("\n" + "=" * 70)
    print("STATISTICS")
    print("=" * 70)

    total_chars = sum(len(e['text']) for e in commentary)
    total_words = sum(len(e['text'].split()) for e in commentary)

    print(f"\nTotal entries: {len(commentary)}")
    print(f"Average length: {total_chars / len(commentary):.0f} chars ({total_words / len(commentary):.0f} words)")

    # Event type distribution
    event_types = {}
    for entry in commentary:
        et = entry['event_type']
        event_types[et] = event_types.get(et, 0) + 1

    print("\nEvent types:")
    for event_type, count in sorted(event_types.items(), key=lambda x: -x[1]):
        print(f"  {event_type}: {count}")

    # Save to JSON
    output_file = 'data/lequipe_morocco_comoros.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(commentary, f, ensure_ascii=False, indent=2)

    print(f"\n💾 Saved to: {output_file}")

    # Apply quality filter
    sys.path.insert(0, '.')
    from quality_filter import filter_commentary_batch, calculate_quality_metrics

    filtered = filter_commentary_batch(commentary)

    print("\n" + "=" * 70)
    print("QUALITY FILTERING")
    print("=" * 70)

    print(f"\nOriginal: {len(commentary)} entries")
    print(f"After filter: {len(filtered)} entries")
    print(f"Approval rate: {len(filtered) / len(commentary) * 100:.1f}%")

    # Save filtered
    filtered_file = 'data/lequipe_morocco_comoros_filtered.json'
    with open(filtered_file, 'w', encoding='utf-8') as f:
        json.dump(filtered, f, ensure_ascii=False, indent=2)

    print(f"💾 Filtered saved to: {filtered_file}")

    # Calculate metrics
    if filtered:
        metrics = calculate_quality_metrics(filtered)
        print(f"\n📊 Quality Metrics:")
        print(f"   Vocabulary size: {metrics['vocabulary_size']} unique words")
        print(f"   Vocabulary diversity: {metrics['vocabulary_diversity']:.2%}")

    print("\n" + "=" * 70)
    print("DONE!")
    print("=" * 70)
    print(f"\n🔄 Next steps:")
    print(f"   1. Review data in Flask app: python review_app.py")
    print(f"   2. Load this file via the web interface")
    print(f"   3. Manually approve/reject entries")
    print(f"   4. Export to JSONL for training")
    print("=" * 70 + "\n")


if __name__ == '__main__':
    main()
