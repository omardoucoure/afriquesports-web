#!/usr/bin/env python3
"""
Quality filter for commentary data
Ensures only high-quality, football-related commentary is included in training dataset
"""

import re
from typing import List, Dict
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Football vocabulary for validation
FOOTBALL_TERMS_FR = {
    # Actions
    'but', 'goal', 'tir', 'shoot', 'passe', 'pass', 'dribble', 'tacle',
    'corner', 'penalty', 'coup franc', 'free kick', 'faute', 'foul',
    'arrêt', 'save', 'parade', 'occasion', 'chance', 'attaque', 'attack',
    'défense', 'defense', 'contre-attaque', 'counter',

    # Objects
    'ballon', 'ball', 'poteau', 'post', 'lucarne', 'cage', 'goal',
    'surface', 'box', 'ligne', 'line', 'filet', 'net',

    # People
    'joueur', 'player', 'gardien', 'goalkeeper', 'défenseur', 'defender',
    'milieu', 'midfielder', 'attaquant', 'forward', 'arbitre', 'referee',
    'remplaçant', 'substitute', 'entraîneur', 'coach', 'capitaine', 'captain',

    # Events
    'carton', 'card', 'jaune', 'yellow', 'rouge', 'red',
    'remplacement', 'substitution', 'hors-jeu', 'offside',
    'mi-temps', 'half-time', 'prolongation', 'extra time',

    # Directions
    'gauche', 'left', 'droite', 'right', 'centre', 'center',
    'aile', 'wing', 'axe', 'axis',

    # Competitions (useful but not required)
    'can', 'afcon', 'ligue', 'league', 'coupe', 'cup', 'championnat',
}


def is_quality_commentary(commentary: Dict, strict: bool = False) -> bool:
    """
    Determine if a commentary entry meets quality standards

    Args:
        commentary: Commentary dictionary with 'text' field
        strict: If True, apply stricter criteria

    Returns:
        True if commentary passes quality checks
    """
    text = commentary.get('text', '').strip()

    # 1. Length check
    min_length = 50 if not strict else 60
    max_length = 500 if not strict else 300

    if len(text) < min_length:
        logger.debug(f"Rejected: too short ({len(text)} < {min_length})")
        return False

    if len(text) > max_length:
        logger.debug(f"Rejected: too long ({len(text)} > {max_length})")
        return False

    # 2. Football vocabulary check
    text_lower = text.lower()
    has_football_term = any(term in text_lower for term in FOOTBALL_TERMS_FR)

    if not has_football_term:
        logger.debug(f"Rejected: no football vocabulary in '{text[:50]}...'")
        return False

    # 3. No bare URLs
    if text.startswith('http') or text.startswith('www'):
        logger.debug("Rejected: starts with URL")
        return False

    # 4. Sentence count (avoid walls of text)
    sentence_count = text.count('.') + text.count('!') + text.count('?')
    if sentence_count > 3 and not strict:
        logger.debug(f"Rejected: too many sentences ({sentence_count} > 3)")
        return False

    # 5. No excessive punctuation
    if text.count('...') > 2:
        logger.debug("Rejected: excessive ellipsis")
        return False

    # 6. Must contain some letters (not just numbers/symbols)
    if not re.search(r'[a-zA-Zà-ÿÀ-Ÿ]{10,}', text):
        logger.debug("Rejected: insufficient text content")
        return False

    # 7. Not just metadata or timestamps
    if re.match(r'^\d+[\':]', text) and len(text) < 80:
        logger.debug("Rejected: appears to be just a timestamp")
        return False

    # 8. Avoid duplicate/repetitive phrases (basic check)
    words = text.split()
    if len(words) > 10:
        # Check for word repetition
        word_set = set(words)
        uniqueness_ratio = len(word_set) / len(words)
        if uniqueness_ratio < 0.5:  # More than 50% repetition
            logger.debug(f"Rejected: too repetitive (uniqueness: {uniqueness_ratio:.2f})")
            return False

    return True


def filter_commentary_batch(
    commentary_list: List[Dict],
    strict: bool = False
) -> List[Dict]:
    """
    Filter a batch of commentary entries

    Args:
        commentary_list: List of commentary dictionaries
        strict: Apply stricter filtering criteria

    Returns:
        Filtered list of high-quality commentary
    """
    filtered = []
    rejected_count = 0

    for entry in commentary_list:
        if is_quality_commentary(entry, strict=strict):
            filtered.append(entry)
        else:
            rejected_count += 1

    approval_rate = len(filtered) / len(commentary_list) if commentary_list else 0

    logger.info(f"Filtered {len(commentary_list)} entries:")
    logger.info(f"  ✅ Approved: {len(filtered)} ({approval_rate:.1%})")
    logger.info(f"  ❌ Rejected: {rejected_count}")

    return filtered


def remove_duplicates(commentary_list: List[Dict]) -> List[Dict]:
    """
    Remove duplicate commentary entries based on text similarity

    Args:
        commentary_list: List of commentary dictionaries

    Returns:
        Deduplicated list
    """
    seen_texts = set()
    unique_commentary = []

    for entry in commentary_list:
        text = entry['text'].strip().lower()

        # Exact duplicate check
        if text in seen_texts:
            logger.debug(f"Duplicate removed: {text[:50]}...")
            continue

        seen_texts.add(text)
        unique_commentary.append(entry)

    removed = len(commentary_list) - len(unique_commentary)
    if removed > 0:
        logger.info(f"Removed {removed} duplicate entries")

    return unique_commentary


def calculate_quality_metrics(commentary_list: List[Dict]) -> Dict:
    """
    Calculate quality metrics for a commentary dataset

    Args:
        commentary_list: List of commentary dictionaries

    Returns:
        Dictionary of quality metrics
    """
    if not commentary_list:
        return {}

    texts = [entry['text'] for entry in commentary_list]

    # Calculate metrics
    total_words = sum(len(text.split()) for text in texts)
    total_chars = sum(len(text) for text in texts)

    all_words = ' '.join(texts).lower().split()
    unique_words = set(all_words)

    metrics = {
        'total_examples': len(commentary_list),
        'avg_length_chars': total_chars / len(commentary_list),
        'avg_length_words': total_words / len(commentary_list),
        'vocabulary_size': len(unique_words),
        'vocabulary_diversity': len(unique_words) / len(all_words) if all_words else 0,
        'sources': {},
        'event_types': {}
    }

    # Count by source
    for entry in commentary_list:
        source = entry.get('source', 'unknown')
        metrics['sources'][source] = metrics['sources'].get(source, 0) + 1

    # Count by event type
    for entry in commentary_list:
        event_type = entry.get('event_type', 'unknown')
        metrics['event_types'][event_type] = metrics['event_types'].get(event_type, 0) + 1

    return metrics


if __name__ == "__main__":
    # Test quality filter
    test_commentary = [
        {
            'text': "Mbappé s'infiltre dans la surface adverse, son tir croisé du gauche passe juste à côté du poteau droit de Donnarumma !",
            'source': 'test',
            'event_type': 'commentary'
        },
        {
            'text': "But!",  # Too short
            'source': 'test',
            'event_type': 'goal'
        },
        {
            'text': "Le joueur prend le ballon et court sur le terrain vers le but. Il court vite. Il court bien.",  # Repetitive
            'source': 'test',
            'event_type': 'commentary'
        },
        {
            'text': "Hakimi délivre une passe parfaite pour Ziyech qui contrôle brillamment et déclenche une frappe puissante que le gardien détourne in extremis!",
            'source': 'test',
            'event_type': 'commentary'
        }
    ]

    print("Testing quality filter...")
    filtered = filter_commentary_batch(test_commentary)

    print("\n✅ Approved commentary:")
    for i, entry in enumerate(filtered, 1):
        print(f"{i}. {entry['text']}")

    print("\n📊 Quality metrics:")
    metrics = calculate_quality_metrics(filtered)
    for key, value in metrics.items():
        print(f"  {key}: {value}")
