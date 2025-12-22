#!/usr/bin/env python3
"""
RMC Sport scraper using Playwright for JavaScript-rendered content
Solves the problem of modern websites that load content dynamically
"""

import re
import asyncio
from typing import List, Dict
from datetime import datetime
from playwright.async_api import async_playwright
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class RMCPlaywrightScraper:
    """Scrapes RMC Sport using Playwright to handle JavaScript"""

    def __init__(self):
        self.base_url = "https://rmcsport.bfmtv.com"

    async def scrape_match(self, url: str) -> List[Dict]:
        """
        Scrape commentary from RMC Sport match page

        Args:
            url: Match URL

        Returns:
            List of commentary dictionaries
        """
        logger.info(f"Scraping: {url}")

        commentary_list = []

        async with async_playwright() as p:
            # Launch browser
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()

            try:
                # Navigate to page
                logger.info("Loading page...")
                await page.goto(url, wait_until='networkidle', timeout=60000)

                # Wait for content to load
                logger.info("Waiting for commentary to load...")
                await page.wait_for_timeout(3000)  # Give JS time to render

                # Try multiple selectors to find commentary
                selectors_to_try = [
                    'div[class*="live"]',
                    'div[class*="comment"]',
                    'div[class*="timeline"]',
                    'article',
                    'div[class*="event"]'
                ]

                # Get page content for debugging
                content = await page.content()
                logger.info(f"Page loaded, content length: {len(content)}")

                # Try to find commentary elements
                for selector in selectors_to_try:
                    elements = await page.query_selector_all(selector)
                    logger.info(f"Selector '{selector}': found {len(elements)} elements")

                    if len(elements) > 5:  # Likely found commentary
                        logger.info(f"✓ Using selector: {selector}")

                        for element in elements:
                            try:
                                # Get all text from element
                                text = await element.inner_text()

                                # Look for timestamps
                                time_match = re.search(r'(\d+[\'′](?:\+\d+)?)', text)

                                if time_match and len(text) > 30:
                                    time_str = time_match.group(1)

                                    # Clean text
                                    text_clean = text.strip()

                                    # Determine event type
                                    event_type = self._determine_event_type(text_clean)

                                    commentary_list.append({
                                        'source': 'rmc',
                                        'time': time_str.replace('′', "'"),
                                        'text': text_clean,
                                        'event_type': event_type,
                                        'scraped_at': datetime.utcnow().isoformat(),
                                        'url': url
                                    })

                            except Exception as e:
                                logger.debug(f"Error parsing element: {e}")
                                continue

                        if commentary_list:
                            break  # Found commentary, stop trying selectors

                # If no commentary found with generic selectors, try more specific approach
                if not commentary_list:
                    logger.info("Trying to extract all text with timestamps...")
                    all_text = await page.inner_text('body')

                    # Split by lines and look for timestamps
                    lines = all_text.split('\n')
                    for line in lines:
                        line = line.strip()
                        time_match = re.search(r'^(\d+[\'′](?:\+\d+)?)\s*[-–—]\s*(.+)', line)

                        if time_match and len(line) > 30:
                            time_str = time_match.group(1)
                            text = time_match.group(2).strip()

                            event_type = self._determine_event_type(text)

                            commentary_list.append({
                                'source': 'rmc',
                                'time': time_str.replace('′', "'"),
                                'text': text,
                                'event_type': event_type,
                                'scraped_at': datetime.utcnow().isoformat(),
                                'url': url
                            })

            except Exception as e:
                logger.error(f"Error scraping page: {e}")

            finally:
                await browser.close()

        # Remove duplicates
        seen_texts = set()
        unique_commentary = []
        for entry in commentary_list:
            text_key = entry['text'][:100]  # Use first 100 chars as key
            if text_key not in seen_texts:
                seen_texts.add(text_key)
                unique_commentary.append(entry)

        logger.info(f"✅ Extracted {len(unique_commentary)} unique commentary entries")
        return unique_commentary

    def _determine_event_type(self, text: str) -> str:
        """Determine event type from text content"""
        text_lower = text.lower()

        if any(keyword in text_lower for keyword in ['but', 'goal', '⚽']):
            return 'goal'
        elif any(keyword in text_lower for keyword in ['carton jaune', 'yellow', '🟨']):
            return 'yellow_card'
        elif any(keyword in text_lower for keyword in ['carton rouge', 'red', '🟥']):
            return 'red_card'
        elif any(keyword in text_lower for keyword in ['changement', 'remplacement', 'substitution', '🔄']):
            return 'substitution'
        elif any(keyword in text_lower for keyword in ['penalty', 'pénalty']):
            return 'penalty'
        elif any(keyword in text_lower for keyword in ['mi-temps', 'half-time']):
            return 'half_time'
        elif any(keyword in text_lower for keyword in ['fin du match', 'final whistle']):
            return 'final_whistle'
        else:
            return 'commentary'


async def main():
    """Test the scraper"""
    import sys
    import json

    if len(sys.argv) < 2:
        print("Usage: python rmc_playwright_scraper.py <url>")
        sys.exit(1)

    url = sys.argv[1]

    scraper = RMCPlaywrightScraper()
    commentary = await scraper.scrape_match(url)

    print(f"\n{'='*70}")
    print(f"SCRAPING RESULTS")
    print(f"{'='*70}")
    print(f"\n✅ Extracted {len(commentary)} commentary entries")

    if commentary:
        print(f"\n📝 Sample commentary (first 5):")
        for i, entry in enumerate(commentary[:5], 1):
            print(f"\n{i}. {entry['time']} - {entry['event_type']}")
            print(f"   {entry['text'][:100]}{'...' if len(entry['text']) > 100 else ''}")

        # Save to file
        output_file = 'data/rmc_scraped.json'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(commentary, f, ensure_ascii=False, indent=2)

        print(f"\n💾 Saved to: {output_file}")
    else:
        print("\n❌ No commentary found. The page structure may need manual inspection.")

    print(f"\n{'='*70}\n")


if __name__ == '__main__':
    asyncio.run(main())
