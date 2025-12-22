#!/usr/bin/env python3
"""
L'Équipe scraper for collecting French football commentary
Target: 1200 examples (60% of total dataset)
"""

import re
from typing import List, Dict, Optional
from datetime import datetime
from base_scraper import BaseScraper
import logging

logger = logging.getLogger(__name__)


class LeQuipeScraper(BaseScraper):
    """Scrapes live commentary from L'Équipe match pages"""

    def __init__(self):
        super().__init__(base_url="https://www.lequipe.fr", delay=2.0)

    def extract_commentary(self, soup) -> List[Dict]:
        """
        Extract commentary events from L'Équipe match page

        L'Équipe structure:
        - Timeline container: div.Timeline__items or similar
        - Each event: div.Timeline__item
        - Time: span with class containing 'time' or similar
        - Text: Main text content

        Returns:
            List of dictionaries with structure:
            {
                'source': 'lequipe',
                'time': '45\'',
                'text': 'Commentary text...',
                'event_type': 'commentary',
                'scraped_at': '2025-01-15T10:30:00'
            }
        """
        commentary_list = []

        # Try to find timeline container
        # L'Équipe uses different classes, we'll try multiple selectors
        timeline_selectors = [
            'div.Timeline__items',
            'div[class*="Timeline"]',
            'div[class*="live-timeline"]',
            'div[class*="match-timeline"]'
        ]

        timeline = None
        for selector in timeline_selectors:
            timeline = soup.select_one(selector)
            if timeline:
                logger.info(f"Found timeline with selector: {selector}")
                break

        if not timeline:
            logger.warning("Could not find timeline container")
            return []

        # Find all timeline items
        item_selectors = [
            'div.Timeline__item',
            'div[class*="timeline-item"]',
            'div[class*="event"]'
        ]

        items = []
        for selector in item_selectors:
            items = timeline.select(selector)
            if items:
                logger.info(f"Found {len(items)} items with selector: {selector}")
                break

        if not items:
            logger.warning("Could not find timeline items")
            return []

        for item in items:
            try:
                # Extract time
                time_element = (
                    item.select_one('span[class*="time"]') or
                    item.select_one('[class*="minute"]') or
                    item.select_one('time')
                )

                if not time_element:
                    continue

                time_text = time_element.get_text(strip=True)

                # Extract commentary text
                # Remove the time element to avoid duplication
                time_element.extract()

                # Get remaining text
                text = item.get_text(separator=' ', strip=True)

                # Clean up text
                text = re.sub(r'\s+', ' ', text)  # Normalize whitespace
                text = text.strip()

                if not text or len(text) < 20:  # Skip very short texts
                    continue

                # Determine event type from icons or classes
                event_type = self._determine_event_type(item)

                commentary_list.append({
                    'source': 'lequipe',
                    'time': time_text,
                    'text': text,
                    'event_type': event_type,
                    'scraped_at': datetime.utcnow().isoformat()
                })

            except Exception as e:
                logger.warning(f"Error parsing timeline item: {e}")
                continue

        return commentary_list

    def _determine_event_type(self, item_element) -> str:
        """
        Determine event type from item classes or icons

        Args:
            item_element: BeautifulSoup element of timeline item

        Returns:
            Event type string
        """
        item_html = str(item_element).lower()
        item_class = ' '.join(item_element.get('class', [])).lower()

        # Check for specific event types
        if any(keyword in item_html or keyword in item_class
               for keyword in ['goal', 'but', '⚽']):
            return 'goal'
        elif any(keyword in item_html or keyword in item_class
                 for keyword in ['yellow', 'jaune', '🟨']):
            return 'yellow_card'
        elif any(keyword in item_html or keyword in item_class
                 for keyword in ['red', 'rouge', '🟥']):
            return 'red_card'
        elif any(keyword in item_html or keyword in item_class
                 for keyword in ['substitution', 'remplacement', '🔄']):
            return 'substitution'
        elif any(keyword in item_html or keyword in item_class
                 for keyword in ['penalty', 'pénalty']):
            return 'penalty'
        else:
            return 'commentary'

    def discover_match_urls(
        self,
        sport: str = "Football",
        max_matches: int = 100,
        competitions: Optional[List[str]] = None
    ) -> List[str]:
        """
        Discover match URLs from L'Équipe archives

        Args:
            sport: Sport type (default: Football)
            max_matches: Maximum number of matches to discover
            competitions: List of competitions to filter (e.g., ['can', 'ligue-1'])

        Returns:
            List of match URLs
        """
        if competitions is None:
            competitions = ['can', 'ligue-1', 'champions-league', 'coupe-afrique']

        match_urls = []

        # L'Équipe match-direct URL pattern
        # Example: https://www.lequipe.fr/Football/match-direct/can/2025/maroc-comores-live/670748

        # We'll construct potential URLs based on recent matches
        # In a production scenario, we'd crawl their archives or use their API

        logger.info(f"Discovering match URLs for competitions: {competitions}")

        # For now, we'll return a placeholder list
        # In production, implement actual URL discovery logic
        logger.warning("discover_match_urls() needs actual implementation with web crawling")

        return match_urls


if __name__ == "__main__":
    # Test scraper
    scraper = LeQuipeScraper()

    # Test URL (Morocco vs Comoros from user's example)
    test_url = "https://www.lequipe.fr/Football/match-direct/can/2025/maroc-comores-live/670748"

    print(f"Testing L'Équipe scraper on: {test_url}")
    commentary = scraper.scrape_match(test_url)

    print(f"\n✅ Extracted {len(commentary)} commentary events")

    if commentary:
        print("\n📝 Sample commentary:")
        for i, event in enumerate(commentary[:5], 1):
            print(f"\n{i}. {event['time']} - {event['event_type']}")
            print(f"   {event['text'][:100]}...")

        # Save to file
        scraper.save_commentary(commentary, 'scripts/data-collection/data/lequipe_test.json')
