#!/usr/bin/env python3
"""
RMC Sport scraper for collecting French football commentary
Target: 600 examples (30% of total dataset)
"""

import re
from typing import List, Dict, Optional
from datetime import datetime
from base_scraper import BaseScraper
import logging

logger = logging.getLogger(__name__)


class RMCScraper(BaseScraper):
    """Scrapes live commentary from RMC Sport match pages"""

    def __init__(self):
        super().__init__(base_url="https://rmcsport.bfmtv.com", delay=2.0)

    def extract_commentary(self, soup) -> List[Dict]:
        """
        Extract commentary events from RMC Sport match page

        RMC Sport structure may vary, we'll use flexible selectors

        Returns:
            List of dictionaries with structure:
            {
                'source': 'rmc',
                'time': '45\'',
                'text': 'Commentary text...',
                'event_type': 'commentary',
                'scraped_at': '2025-01-15T10:30:00'
            }
        """
        commentary_list = []

        # Try to find live commentary container
        container_selectors = [
            'div[class*="live-commentary"]',
            'div[class*="match-live"]',
            'div[class*="timeline"]',
            'div.live-events',
            'ul[class*="event"]'
        ]

        container = None
        for selector in container_selectors:
            container = soup.select_one(selector)
            if container:
                logger.info(f"Found container with selector: {selector}")
                break

        if not container:
            logger.warning("Could not find commentary container")
            return []

        # Find all commentary items
        item_selectors = [
            'div[class*="event-item"]',
            'div[class*="commentary-item"]',
            'li[class*="event"]',
            'div.match-event',
            'article'
        ]

        items = []
        for selector in item_selectors:
            items = container.select(selector)
            if items:
                logger.info(f"Found {len(items)} items with selector: {selector}")
                break

        if not items:
            logger.warning("Could not find commentary items")
            return []

        for item in items:
            try:
                # Extract time
                time_element = (
                    item.select_one('span[class*="time"]') or
                    item.select_one('span[class*="minute"]') or
                    item.select_one('[class*="time"]') or
                    item.select_one('time')
                )

                if not time_element:
                    continue

                time_text = time_element.get_text(strip=True)

                # Extract commentary text
                # Try to find the main text element
                text_element = (
                    item.select_one('p[class*="text"]') or
                    item.select_one('div[class*="description"]') or
                    item.select_one('p')
                )

                if text_element:
                    text = text_element.get_text(separator=' ', strip=True)
                else:
                    # Fallback: get all text from item, excluding time
                    time_element.extract()
                    text = item.get_text(separator=' ', strip=True)

                # Clean up text
                text = re.sub(r'\s+', ' ', text)
                text = text.strip()

                if not text or len(text) < 20:
                    continue

                # Determine event type
                event_type = self._determine_event_type(item)

                commentary_list.append({
                    'source': 'rmc',
                    'time': time_text,
                    'text': text,
                    'event_type': event_type,
                    'scraped_at': datetime.utcnow().isoformat()
                })

            except Exception as e:
                logger.warning(f"Error parsing item: {e}")
                continue

        return commentary_list

    def _determine_event_type(self, item_element) -> str:
        """
        Determine event type from item classes or content

        Args:
            item_element: BeautifulSoup element

        Returns:
            Event type string
        """
        item_html = str(item_element).lower()
        item_class = ' '.join(item_element.get('class', [])).lower()

        # Check for specific event types
        if any(keyword in item_html or keyword in item_class
               for keyword in ['goal', 'but', '⚽', 'score']):
            return 'goal'
        elif any(keyword in item_html or keyword in item_class
                 for keyword in ['yellow', 'jaune', 'carton-jaune']):
            return 'yellow_card'
        elif any(keyword in item_html or keyword in item_class
                 for keyword in ['red', 'rouge', 'carton-rouge']):
            return 'red_card'
        elif any(keyword in item_html or keyword in item_class
                 for keyword in ['substitution', 'remplacement', 'change']):
            return 'substitution'
        elif any(keyword in item_html or keyword in item_class
                 for keyword in ['penalty', 'pénalty']):
            return 'penalty'
        else:
            return 'commentary'

    def discover_match_urls(
        self,
        sport: str = "football",
        max_matches: int = 60
    ) -> List[str]:
        """
        Discover match URLs from RMC Sport archives

        Args:
            sport: Sport type
            max_matches: Maximum number of matches to discover

        Returns:
            List of match URLs
        """
        match_urls = []

        logger.info(f"Discovering RMC Sport match URLs for {sport}")

        # RMC Sport URL pattern
        # Example: https://rmcsport.bfmtv.com/football/can-2025/maroc-comores-live_LI-202501150001.html

        # Placeholder - needs actual implementation
        logger.warning("discover_match_urls() needs actual implementation with web crawling")

        return match_urls


if __name__ == "__main__":
    # Test scraper
    scraper = RMCScraper()

    # Test with a sample URL (you'll need to provide an actual RMC Sport URL)
    test_url = "https://rmcsport.bfmtv.com/football/"

    print(f"Testing RMC Sport scraper on: {test_url}")
    commentary = scraper.scrape_match(test_url)

    print(f"\n✅ Extracted {len(commentary)} commentary events")

    if commentary:
        print("\n📝 Sample commentary:")
        for i, event in enumerate(commentary[:5], 1):
            print(f"\n{i}. {event['time']} - {event['event_type']}")
            print(f"   {event['text'][:100]}...")

        scraper.save_commentary(commentary, 'scripts/data-collection/data/rmc_test.json')
