#!/usr/bin/env python3
"""
Quick test script to verify scrapers are working
Tests with Morocco vs Comoros match from user's example
"""

import sys
import os

# Add scrapers to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'scrapers'))

from lequipe_scraper import LeQuipeScraper
from quality_filter import filter_commentary_batch, calculate_quality_metrics

def main():
    print("\n" + "=" * 70)
    print("TESTING L'ÉQUIPE SCRAPER")
    print("=" * 70)

    # Test URL from user's reference
    test_url = "https://www.lequipe.fr/Football/match-direct/can/2025/maroc-comores-live/670748"

    print(f"\nTest URL: {test_url}")
    print("\nFetching commentary...")

    # Initialize scraper
    scraper = LeQuipeScraper()

    # Scrape match
    commentary = scraper.scrape_match(test_url)

    if not commentary:
        print("\n❌ No commentary extracted. This could mean:")
        print("   1. The website structure changed")
        print("   2. The page is no longer available")
        print("   3. Network/access issues")
        print("\n💡 Tip: Try visiting the URL in your browser to verify it still exists")
        return

    print(f"\n✅ Successfully extracted {len(commentary)} commentary events")

    # Show samples
    print("\n" + "=" * 70)
    print("SAMPLE COMMENTARY (First 5 events)")
    print("=" * 70)

    for i, event in enumerate(commentary[:5], 1):
        print(f"\n{i}. {event['time']} - {event['event_type']}")
        print(f"   Source: {event['source']}")
        print(f"   Text: {event['text'][:100]}{'...' if len(event['text']) > 100 else ''}")

    # Apply quality filter
    print("\n" + "=" * 70)
    print("QUALITY FILTERING")
    print("=" * 70)

    filtered = filter_commentary_batch(commentary)

    print(f"\n✅ Filtered results:")
    print(f"   Original: {len(commentary)} entries")
    print(f"   After filter: {len(filtered)} entries")
    print(f"   Approval rate: {len(filtered) / len(commentary) * 100:.1f}%")

    # Calculate metrics
    if filtered:
        print("\n" + "=" * 70)
        print("QUALITY METRICS")
        print("=" * 70)

        metrics = calculate_quality_metrics(filtered)

        print(f"\nTotal examples: {metrics['total_examples']}")
        print(f"Average length: {metrics['avg_length_chars']:.0f} chars ({metrics['avg_length_words']:.0f} words)")
        print(f"Vocabulary size: {metrics['vocabulary_size']} unique words")
        print(f"Vocabulary diversity: {metrics['vocabulary_diversity']:.2%}")

        print("\nEvent types:")
        for event_type, count in metrics['event_types'].items():
            print(f"  {event_type}: {count}")

    # Save test results
    os.makedirs('data', exist_ok=True)
    scraper.save_commentary(filtered, 'data/test_result.json')

    print("\n" + "=" * 70)
    print("TEST COMPLETE")
    print("=" * 70)
    print(f"\n✅ Test data saved to: data/test_result.json")
    print(f"\n🔄 Next steps:")
    print("   1. Review the scraped data in data/test_result.json")
    print("   2. If quality is good, proceed to collect more URLs")
    print("   3. Run: python collect_commentary.py --lequipe-urls lequipe_urls.txt")
    print("=" * 70 + "\n")


if __name__ == '__main__':
    main()
