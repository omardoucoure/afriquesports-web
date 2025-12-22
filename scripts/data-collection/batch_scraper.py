#!/usr/bin/env python3
"""
Batch Commentary Scraper
Scrapes multiple matches and combines into training dataset
"""

import asyncio
import json
import sys
from pathlib import Path
from scrapers.lequipe_finished_match_scraper import LeQuipeFinishedMatchScraper
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def scrape_all_matches(match_file: str = 'data/lequipe_commented_matches.json'):
    """
    Scrape all matches from the commented matches file

    Args:
        match_file: Path to JSON file with match URLs
    """
    # Load match URLs
    logger.info(f"📂 Loading matches from {match_file}")
    with open(match_file, 'r', encoding='utf-8') as f:
        matches = json.load(f)

    fully_commented = [m for m in matches if m['is_fully_commented']]

    logger.info(f"✅ Found {len(fully_commented)} fully commented matches to scrape")

    scraper = LeQuipeFinishedMatchScraper()
    all_commentary = []

    for i, match in enumerate(fully_commented, 1):
        url = match['url']
        title = match['title']

        logger.info(f"\n{'='*70}")
        logger.info(f"MATCH {i}/{len(fully_commented)}: {title}")
        logger.info(f"{'='*70}")

        try:
            commentary = await scraper.scrape_match(url)

            if commentary:
                logger.info(f"✅ Scraped {len(commentary)} entries")
                all_commentary.extend(commentary)
            else:
                logger.warning(f"⚠️  No commentary extracted")

            # Save progress after each match
            with open('data/batch_progress.json', 'w', encoding='utf-8') as f:
                json.dump(all_commentary, f, ensure_ascii=False, indent=2)

        except Exception as e:
            logger.error(f"❌ Error scraping {title}: {e}")
            import traceback
            traceback.print_exc()

        # Be polite - wait between requests
        if i < len(fully_commented):
            logger.info("⏳ Waiting 5 seconds before next match...")
            await asyncio.sleep(5)

    logger.info(f"\n{'='*70}")
    logger.info("BATCH SCRAPING COMPLETE")
    logger.info(f"{'='*70}")
    logger.info(f"✅ Total commentary entries: {len(all_commentary)}")

    # Group by source
    by_source = {}
    for entry in all_commentary:
        source = entry.get('source', 'unknown')
        by_source[source] = by_source.get(source, 0) + 1

    logger.info(f"\n📊 By source:")
    for source, count in by_source.items():
        logger.info(f"   {source}: {count}")

    # Group by event type
    by_type = {}
    for entry in all_commentary:
        event_type = entry.get('event_type', 'unknown')
        by_type[event_type] = by_type.get(event_type, 0) + 1

    logger.info(f"\n📊 By event type:")
    for event_type, count in sorted(by_type.items(), key=lambda x: x[1], reverse=True):
        logger.info(f"   {event_type}: {count}")

    # Save final dataset
    output_file = 'data/training_commentary.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_commentary, f, ensure_ascii=False, indent=2)

    logger.info(f"\n💾 Saved to: {output_file}")

    return all_commentary


async def main():
    if len(sys.argv) > 1:
        match_file = sys.argv[1]
    else:
        match_file = 'data/lequipe_commented_matches.json'

    commentary = await scrape_all_matches(match_file)

    logger.info(f"\n{'='*70}")
    logger.info("NEXT STEPS")
    logger.info(f"{'='*70}")
    logger.info("1. Review quality: python quality_filter.py")
    logger.info("2. Export to JSONL: python export_to_jsonl.py")
    logger.info("3. Upload to Google Colab for fine-tuning")
    logger.info(f"{'='*70}\n")


if __name__ == '__main__':
    asyncio.run(main())
