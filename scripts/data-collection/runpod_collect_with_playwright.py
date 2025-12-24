#!/usr/bin/env python3
"""
RunPod Data Collection with Playwright
Uses the proven lequipe_finished_match_scraper.py
Collects 2000+ commentary examples from curated match URLs
"""

import asyncio
import json
import sys
import logging
from pathlib import Path
from datetime import datetime

# Import the working scraper
sys.path.insert(0, '/workspace')
from lequipe_finished_match_scraper import LeQuipeFinishedMatchScraper

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Comprehensive list of L'Équipe match URLs
# These are real matches with confirmed commentary
MATCH_URLS = [
    # CAN 2025 - Confirmed working
    "https://www.lequipe.fr/Football/match-direct/can/2025/maroc-comores-live/670748",

    # Add more CAN 2025 matches (search L'Équipe for recent matches)
    # Format: https://www.lequipe.fr/Football/match-direct/can/2025/{match-slug}/{id}
]


async def collect_training_data(
    match_urls: list = None,
    target_examples: int = 2000,
    output_dir: str = "/workspace/training_data"
):
    """
    Collect training data using Playwright scraper

    Args:
        match_urls: List of L'Équipe match URLs
        target_examples: Target number of examples
        output_dir: Output directory
    """

    if match_urls is None:
        match_urls = MATCH_URLS

    logger.info("=" * 70)
    logger.info("RUNPOD DATA COLLECTION - PLAYWRIGHT METHOD")
    logger.info("=" * 70)
    logger.info(f"Target: {target_examples} examples")
    logger.info(f"Match URLs: {len(match_urls)}")
    logger.info("=" * 70 + "\n")

    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    scraper = LeQuipeFinishedMatchScraper()
    all_commentary = []

    # Scrape each match
    for i, url in enumerate(match_urls, 1):
        logger.info(f"\n{'='*70}")
        logger.info(f"MATCH {i}/{len(match_urls)}")
        logger.info(f"{'='*70}")
        logger.info(f"URL: {url}\n")

        if len(all_commentary) >= target_examples:
            logger.info(f"✅ Reached target of {target_examples} examples!")
            break

        try:
            commentary = await scraper.scrape_match(url)

            if commentary:
                logger.info(f"✅ Extracted {len(commentary)} entries")
                all_commentary.extend(commentary)
                logger.info(f"📊 Total so far: {len(all_commentary)} entries\n")
            else:
                logger.warning(f"⚠️  No commentary found\n")

            # Save progress
            if i % 5 == 0 or len(all_commentary) >= target_examples:
                progress_file = output_path / "progress.json"
                with open(progress_file, 'w', encoding='utf-8') as f:
                    json.dump(all_commentary, f, ensure_ascii=False, indent=2)
                logger.info(f"💾 Progress saved: {len(all_commentary)} entries\n")

            # Be polite - wait between matches
            if i < len(match_urls):
                logger.info("⏳ Waiting 5 seconds...\n")
                await asyncio.sleep(5)

        except Exception as e:
            logger.error(f"❌ Error scraping {url}: {e}\n")
            continue

    # Save raw commentary
    raw_file = output_path / "raw_commentary.json"
    with open(raw_file, 'w', encoding='utf-8') as f:
        json.dump(all_commentary, f, ensure_ascii=False, indent=2)
    logger.info(f"\n💾 Saved {len(all_commentary)} raw entries to {raw_file}\n")

    # Quality filtering
    logger.info("🔍 Applying quality filters...\n")

    # Remove duplicates
    unique = remove_duplicates(all_commentary)
    logger.info(f"After deduplication: {len(unique)} entries")

    # Apply quality filter
    filtered = quality_filter(unique)
    logger.info(f"After quality filter: {len(filtered)} entries")

    if len(all_commentary) > 0:
        approval_rate = len(filtered) / len(all_commentary) * 100
        logger.info(f"Approval rate: {approval_rate:.1f}%\n")

    # Save filtered
    filtered_file = output_path / "filtered_commentary.json"
    with open(filtered_file, 'w', encoding='utf-8') as f:
        json.dump(filtered, f, ensure_ascii=False, indent=2)

    # Export to JSONL training format
    logger.info("📤 Exporting to training format...\n")

    training_data = []
    system_prompt = "Tu es un commentateur sportif professionnel pour Afrique Sports. Tu génères des commentaires de match en français, avec un style vivant, précis et engageant, similaire à L'Équipe."

    for entry in filtered:
        training_example = {
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Génère un commentaire pour: Minute {entry['time']} - {entry['event_type']}"},
                {"role": "assistant", "content": entry['text']}
            ]
        }
        training_data.append(training_example)

    training_file = output_path / "training_data.jsonl"
    with open(training_file, 'w', encoding='utf-8') as f:
        for example in training_data:
            f.write(json.dumps(example, ensure_ascii=False) + '\n')

    logger.info(f"✅ Saved {len(training_data)} training examples to {training_file}\n")

    # Final stats
    logger.info("=" * 70)
    logger.info("COLLECTION COMPLETE")
    logger.info("=" * 70)
    logger.info(f"Matches scraped: {i}")
    logger.info(f"Raw entries: {len(all_commentary)}")
    logger.info(f"After filtering: {len(filtered)}")
    logger.info(f"Training examples: {len(training_data)}")

    if training_data:
        total_chars = sum(len(e['text']) for e in filtered)
        total_words = sum(len(e['text'].split()) for e in filtered)
        logger.info(f"\nQuality metrics:")
        logger.info(f"  Average length: {total_chars/len(filtered):.0f} chars ({total_words/len(filtered):.0f} words)")

        # Vocabulary
        all_words = set()
        for entry in filtered:
            all_words.update(entry['text'].lower().split())
        logger.info(f"  Vocabulary: {len(all_words)} unique words")

    logger.info(f"\n✅ Training file ready: {training_file}")
    logger.info("=" * 70 + "\n")

    return training_file


def remove_duplicates(commentary: list) -> list:
    """Remove duplicate commentary"""
    seen = set()
    unique = []

    for entry in commentary:
        key = entry['text'][:100].lower()
        if key not in seen:
            seen.add(key)
            unique.append(entry)

    return unique


def quality_filter(commentary: list) -> list:
    """Apply quality filtering"""
    FOOTBALL_TERMS = {
        'but', 'goal', 'tir', 'frappe', 'passe', 'dribble', 'corner', 'penalty',
        'carton', 'jaune', 'rouge', 'gardien', 'défenseur', 'milieu', 'attaquant',
        'ballon', 'match', 'équipe', 'joueur', 'arbitre', 'faute', 'hors-jeu'
    }

    filtered = []

    for entry in commentary:
        text = entry['text']

        # Length check
        if len(text) < 50 or len(text) > 500:
            continue

        # Football vocabulary check
        text_lower = text.lower()
        if not any(term in text_lower for term in FOOTBALL_TERMS):
            continue

        # No URLs
        if text.startswith(('http', 'www.')):
            continue

        # Max 3 sentences
        sentence_count = text.count('.') + text.count('!') + text.count('?')
        if sentence_count > 3:
            continue

        # Letter content
        letter_ratio = sum(c.isalpha() for c in text) / len(text)
        if letter_ratio < 0.5:
            continue

        filtered.append(entry)

    return filtered


if __name__ == '__main__':
    # Check if we have match URLs
    if len(MATCH_URLS) == 1:
        logger.warning("⚠️  WARNING: Only 1 match URL defined!")
        logger.warning("Add more URLs to MATCH_URLS list to collect sufficient data")
        logger.warning("You need ~50-100 matches for 2000+ examples\n")

    asyncio.run(collect_training_data(
        match_urls=MATCH_URLS,
        target_examples=2000,
        output_dir="/workspace/training_data"
    ))
