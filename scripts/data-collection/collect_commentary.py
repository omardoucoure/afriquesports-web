#!/usr/bin/env python3
"""
Main orchestrator for collecting football commentary data
Coordinates scraping, filtering, and review workflow

Target: 2000+ high-quality French commentary examples
"""

import os
import sys
import json
import argparse
from datetime import datetime
import logging

# Add scrapers directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'scrapers'))

from lequipe_scraper import LeQuipeScraper
from rmc_scraper import RMCScraper
from quality_filter import filter_commentary_batch, remove_duplicates, calculate_quality_metrics

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
RAW_DATA_FILE = os.path.join(DATA_DIR, 'raw_commentary.json')
FILTERED_DATA_FILE = os.path.join(DATA_DIR, 'filtered_commentary.json')


class CommentaryCollector:
    """Orchestrates the commentary collection workflow"""

    def __init__(self):
        self.lequipe_scraper = LeQuipeScraper()
        self.rmc_scraper = RMCScraper()
        os.makedirs(DATA_DIR, exist_ok=True)

    def collect_from_lequipe(self, urls: list) -> list:
        """
        Collect commentary from L'Équipe

        Args:
            urls: List of L'Équipe match URLs

        Returns:
            List of commentary entries
        """
        logger.info(f"Collecting from L'Équipe: {len(urls)} matches")
        all_commentary = []

        for i, url in enumerate(urls, 1):
            logger.info(f"Processing L'Équipe match {i}/{len(urls)}: {url}")
            commentary = self.lequipe_scraper.scrape_match(url)
            all_commentary.extend(commentary)

        logger.info(f"Collected {len(all_commentary)} entries from L'Équipe")
        return all_commentary

    def collect_from_rmc(self, urls: list) -> list:
        """
        Collect commentary from RMC Sport

        Args:
            urls: List of RMC Sport match URLs

        Returns:
            List of commentary entries
        """
        logger.info(f"Collecting from RMC Sport: {len(urls)} matches")
        all_commentary = []

        for i, url in enumerate(urls, 1):
            logger.info(f"Processing RMC match {i}/{len(urls)}: {url}")
            commentary = self.rmc_scraper.scrape_match(url)
            all_commentary.extend(commentary)

        logger.info(f"Collected {len(all_commentary)} entries from RMC Sport")
        return all_commentary

    def collect_all(self, lequipe_urls: list, rmc_urls: list) -> list:
        """
        Collect from all sources

        Args:
            lequipe_urls: L'Équipe match URLs
            rmc_urls: RMC Sport match URLs

        Returns:
            Combined list of all commentary
        """
        logger.info("\n" + "=" * 70)
        logger.info("STARTING COMMENTARY COLLECTION")
        logger.info("=" * 70)

        all_commentary = []

        # Collect from L'Équipe (target: 1200 examples - 60%)
        if lequipe_urls:
            lequipe_commentary = self.collect_from_lequipe(lequipe_urls)
            all_commentary.extend(lequipe_commentary)

        # Collect from RMC Sport (target: 600 examples - 30%)
        if rmc_urls:
            rmc_commentary = self.collect_from_rmc(rmc_urls)
            all_commentary.extend(rmc_commentary)

        logger.info(f"\n✅ Total collected: {len(all_commentary)} entries")

        # Save raw data
        self._save_json(all_commentary, RAW_DATA_FILE)
        logger.info(f"💾 Saved raw data to: {RAW_DATA_FILE}")

        return all_commentary

    def filter_and_deduplicate(self, commentary_list: list, strict: bool = False) -> list:
        """
        Apply quality filtering and remove duplicates

        Args:
            commentary_list: Raw commentary list
            strict: Use strict filtering criteria

        Returns:
            Filtered commentary list
        """
        logger.info("\n" + "=" * 70)
        logger.info("APPLYING QUALITY FILTERS")
        logger.info("=" * 70)

        # Remove duplicates first
        unique_commentary = remove_duplicates(commentary_list)

        # Apply quality filter
        filtered_commentary = filter_commentary_batch(unique_commentary, strict=strict)

        logger.info(f"\n✅ Filtering complete:")
        logger.info(f"   Original: {len(commentary_list)}")
        logger.info(f"   After deduplication: {len(unique_commentary)}")
        logger.info(f"   After quality filter: {len(filtered_commentary)}")

        # Save filtered data
        self._save_json(filtered_commentary, FILTERED_DATA_FILE)
        logger.info(f"💾 Saved filtered data to: {FILTERED_DATA_FILE}")

        return filtered_commentary

    def generate_report(self, commentary_list: list) -> dict:
        """
        Generate quality metrics report

        Args:
            commentary_list: Commentary list

        Returns:
            Metrics dictionary
        """
        logger.info("\n" + "=" * 70)
        logger.info("QUALITY METRICS REPORT")
        logger.info("=" * 70)

        metrics = calculate_quality_metrics(commentary_list)

        logger.info(f"\n📊 Dataset Statistics:")
        logger.info(f"   Total examples: {metrics['total_examples']}")
        logger.info(f"   Avg length: {metrics['avg_length_chars']:.0f} chars ({metrics['avg_length_words']:.0f} words)")
        logger.info(f"   Vocabulary size: {metrics['vocabulary_size']} unique words")
        logger.info(f"   Vocabulary diversity: {metrics['vocabulary_diversity']:.2%}")

        logger.info(f"\n📂 By Source:")
        for source, count in metrics['sources'].items():
            percentage = count / metrics['total_examples'] * 100
            logger.info(f"   {source}: {count} ({percentage:.1f}%)")

        logger.info(f"\n⚽ By Event Type:")
        for event_type, count in metrics['event_types'].items():
            percentage = count / metrics['total_examples'] * 100
            logger.info(f"   {event_type}: {count} ({percentage:.1f}%)")

        # Save report
        report_file = os.path.join(DATA_DIR, 'data_stats.json')
        self._save_json(metrics, report_file)
        logger.info(f"\n💾 Saved report to: {report_file}")

        return metrics

    def _save_json(self, data: list or dict, file_path: str):
        """Save data to JSON file"""
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='Collect French football commentary data')
    parser.add_argument('--lequipe-urls', type=str, help='File containing L\'Équipe URLs (one per line)')
    parser.add_argument('--rmc-urls', type=str, help='File containing RMC Sport URLs (one per line)')
    parser.add_argument('--strict', action='store_true', help='Use strict quality filtering')

    args = parser.parse_args()

    # Read URL files
    lequipe_urls = []
    rmc_urls = []

    if args.lequipe_urls and os.path.exists(args.lequipe_urls):
        with open(args.lequipe_urls, 'r') as f:
            lequipe_urls = [line.strip() for line in f if line.strip()]

    if args.rmc_urls and os.path.exists(args.rmc_urls):
        with open(args.rmc_urls, 'r') as f:
            rmc_urls = [line.strip() for line in f if line.strip()]

    if not lequipe_urls and not rmc_urls:
        logger.error("No URLs provided. Please provide URL files.")
        logger.info("\nExample usage:")
        logger.info("  python collect_commentary.py --lequipe-urls lequipe_urls.txt --rmc-urls rmc_urls.txt")
        return

    # Initialize collector
    collector = CommentaryCollector()

    # Collect data
    raw_commentary = collector.collect_all(lequipe_urls, rmc_urls)

    # Filter and deduplicate
    filtered_commentary = collector.filter_and_deduplicate(raw_commentary, strict=args.strict)

    # Generate report
    metrics = collector.generate_report(filtered_commentary)

    # Print final summary
    logger.info("\n" + "=" * 70)
    logger.info("COLLECTION COMPLETE")
    logger.info("=" * 70)
    logger.info(f"\n✅ Collected {metrics['total_examples']} high-quality commentary examples")
    logger.info(f"📁 Data saved to: {FILTERED_DATA_FILE}")
    logger.info(f"\n🔄 Next steps:")
    logger.info(f"   1. Review data with: python review_app.py")
    logger.info(f"   2. After review, export to JSONL for training")
    logger.info(f"   3. Upload to Google Colab for fine-tuning")
    logger.info("=" * 70 + "\n")


if __name__ == '__main__':
    main()
