#!/usr/bin/env python3
"""
Aggressive web scraper using Playwright
Handles JavaScript, scrolling, lazy loading, and dynamic content
"""

import asyncio
import re
import json
from typing import List, Dict
from datetime import datetime
from playwright.async_api import async_playwright
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AggressiveScraper:
    """Aggressive scraper that handles modern JavaScript-heavy websites"""

    def __init__(self):
        self.commentary_list = []

    async def scrape_match(self, url: str, save_debug: bool = True) -> List[Dict]:
        """
        Aggressively scrape match commentary

        Args:
            url: Match URL
            save_debug: Save HTML and screenshots for debugging

        Returns:
            List of commentary dictionaries
        """
        logger.info(f"🚀 Aggressive scraping: {url}")

        async with async_playwright() as p:
            # Launch with more realistic browser settings
            browser = await p.chromium.launch(
                headless=True,
                args=[
                    '--disable-blink-features=AutomationControlled',
                    '--disable-dev-shm-usage',
                    '--no-sandbox'
                ]
            )

            context = await browser.new_context(
                viewport={'width': 1920, 'height': 1080},
                user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            )

            page = await context.new_page()

            try:
                # Navigate with longer timeout
                logger.info("📄 Loading page...")
                await page.goto(url, wait_until='networkidle', timeout=90000)

                # Wait for initial content
                await page.wait_for_timeout(3000)

                # Scroll to load lazy content
                logger.info("📜 Scrolling to load dynamic content...")
                await self._scroll_page(page)

                # Wait for any additional loading
                await page.wait_for_timeout(2000)

                # Save debug info
                if save_debug:
                    await page.screenshot(path='data/debug_screenshot.png', full_page=True)
                    content = await page.content()
                    with open('data/debug_page.html', 'w', encoding='utf-8') as f:
                        f.write(content)
                    logger.info("📸 Debug files saved (screenshot + HTML)")

                # Try multiple extraction strategies
                logger.info("🔍 Trying extraction strategies...")

                # Strategy 1: Look for structured commentary elements
                await self._extract_structured_elements(page, url)

                # Strategy 2: Extract from raw text with patterns
                if not self.commentary_list:
                    await self._extract_from_text_patterns(page, url)

                # Strategy 3: Find any divs with timestamps
                if not self.commentary_list:
                    await self._extract_timestamp_divs(page, url)

                # Strategy 4: Network interception (check for API calls)
                # This would require setting up before navigation
                # For now, we'll try extracting from embedded JSON

                await self._extract_from_embedded_json(page, url)

            except Exception as e:
                logger.error(f"❌ Error during scraping: {e}")

            finally:
                await browser.close()

        # Deduplicate
        unique_commentary = self._deduplicate(self.commentary_list)

        logger.info(f"✅ Extracted {len(unique_commentary)} unique commentary entries")
        return unique_commentary

    async def _scroll_page(self, page):
        """Scroll page to trigger lazy loading"""
        for i in range(5):
            await page.evaluate('window.scrollBy(0, window.innerHeight)')
            await page.wait_for_timeout(500)

        # Scroll back to top
        await page.evaluate('window.scrollTo(0, 0)')
        await page.wait_for_timeout(500)

    async def _extract_structured_elements(self, page, url: str):
        """Extract from structured HTML elements"""
        logger.info("  Strategy 1: Structured elements")

        # Try various selectors
        selectors = [
            # RMC Sport patterns
            'div[class*="LiveItem"]',
            'div[class*="live-item"]',
            'div[class*="LiveEvent"]',
            'div[class*="CommentItem"]',

            # L'Équipe patterns
            'div.CommentsLive__event',
            'div[class*="Timeline"]',

            # Generic patterns
            'div[data-time]',
            'article[class*="event"]',
            'li[class*="event"]',
        ]

        for selector in selectors:
            try:
                elements = await page.query_selector_all(selector)
                if len(elements) > 3:
                    logger.info(f"    Found {len(elements)} elements with: {selector}")

                    for elem in elements:
                        text = await elem.inner_text()
                        html = await elem.inner_html()

                        # Extract timestamp
                        time_match = re.search(r'(\d+[\'′](?:\+\d+)?)', text)
                        if time_match and len(text.strip()) > 30:
                            self.commentary_list.append({
                                'source': self._detect_source(url),
                                'time': time_match.group(1).replace('′', "'"),
                                'text': text.strip(),
                                'event_type': self._determine_event_type(text),
                                'scraped_at': datetime.utcnow().isoformat(),
                                'url': url,
                                'method': 'structured_elements'
                            })

                    if len(self.commentary_list) > 5:
                        return  # Found enough, stop

            except Exception as e:
                logger.debug(f"    Selector {selector} failed: {e}")

    async def _extract_from_text_patterns(self, page, url: str):
        """Extract using text pattern matching"""
        logger.info("  Strategy 2: Text pattern matching")

        all_text = await page.inner_text('body')

        # Pattern: "90' - Some text..."
        pattern1 = re.finditer(r"(\d+[\'′](?:\+\d+)?)\s*[-–—]\s*([^\n]{30,500})", all_text)

        for match in pattern1:
            time_str = match.group(1)
            text = match.group(2).strip()

            self.commentary_list.append({
                'source': self._detect_source(url),
                'time': time_str.replace('′', "'"),
                'text': text,
                'event_type': self._determine_event_type(text),
                'scraped_at': datetime.utcnow().isoformat(),
                'url': url,
                'method': 'text_pattern'
            })

    async def _extract_timestamp_divs(self, page, url: str):
        """Find any div containing timestamps"""
        logger.info("  Strategy 3: Timestamp-containing divs")

        # Get all divs
        all_divs = await page.query_selector_all('div')
        logger.info(f"    Checking {len(all_divs)} divs...")

        for div in all_divs:
            try:
                text = await div.inner_text()

                # Must have timestamp and reasonable length
                if re.search(r'\d+[\'′]', text) and 30 < len(text) < 1000:
                    time_match = re.search(r'(\d+[\'′](?:\+\d+)?)', text)
                    if time_match:
                        # Check if this looks like commentary (not a whole page dump)
                        lines = text.split('\n')
                        if len(lines) < 10:  # Not too many lines
                            self.commentary_list.append({
                                'source': self._detect_source(url),
                                'time': time_match.group(1).replace('′', "'"),
                                'text': text.strip(),
                                'event_type': self._determine_event_type(text),
                                'scraped_at': datetime.utcnow().isoformat(),
                                'url': url,
                                'method': 'timestamp_divs'
                            })

            except Exception:
                continue

    async def _extract_from_embedded_json(self, page, url: str):
        """Extract from embedded JSON data (like __NEXT_DATA__)"""
        logger.info("  Strategy 4: Embedded JSON data")

        try:
            # Look for Next.js data
            next_data = await page.evaluate('''() => {
                const scripts = document.querySelectorAll('script[type="application/json"]');
                for (let script of scripts) {
                    if (script.id === '__NEXT_DATA__' || script.textContent.includes('commentary')) {
                        return script.textContent;
                    }
                }
                return null;
            }''')

            if next_data:
                logger.info("    Found embedded JSON data")
                data = json.loads(next_data)

                # Recursively search for commentary-like structures
                self._extract_from_json_recursive(data, url)

        except Exception as e:
            logger.debug(f"    JSON extraction failed: {e}")

    def _extract_from_json_recursive(self, obj, url: str, depth: int = 0):
        """Recursively search JSON for commentary data"""
        if depth > 10:  # Prevent infinite recursion
            return

        if isinstance(obj, dict):
            # Look for commentary-like keys
            for key, value in obj.items():
                if key in ['commentary', 'events', 'timeline', 'live', 'comments']:
                    if isinstance(value, list):
                        for item in value:
                            if isinstance(item, dict):
                                self._extract_commentary_from_json_item(item, url)

                # Recurse
                self._extract_from_json_recursive(value, url, depth + 1)

        elif isinstance(obj, list):
            for item in obj:
                self._extract_from_json_recursive(item, url, depth + 1)

    def _extract_commentary_from_json_item(self, item: dict, url: str):
        """Extract commentary from a JSON item"""
        try:
            # Look for time and text fields
            time_val = None
            text_val = None

            for key in ['time', 'minute', 'clock']:
                if key in item:
                    time_val = str(item[key])

            for key in ['text', 'comment', 'description', 'message']:
                if key in item:
                    text_val = str(item[key])

            if time_val and text_val and len(text_val) > 30:
                self.commentary_list.append({
                    'source': 'json_embedded',
                    'time': time_val,
                    'text': text_val,
                    'event_type': self._determine_event_type(text_val),
                    'scraped_at': datetime.utcnow().isoformat(),
                    'url': url,
                    'method': 'json_embedded'
                })

        except Exception:
            pass

    def _deduplicate(self, commentary_list: List[Dict]) -> List[Dict]:
        """Remove duplicate entries"""
        seen = set()
        unique = []

        for entry in commentary_list:
            # Use first 100 chars of text as key
            key = entry['text'][:100].lower()
            if key not in seen:
                seen.add(key)
                unique.append(entry)

        return unique

    def _detect_source(self, url: str) -> str:
        """Detect source from URL"""
        if 'lequipe.fr' in url:
            return 'lequipe'
        elif 'rmcsport' in url or 'bfmtv' in url:
            return 'rmc'
        else:
            return 'unknown'

    def _determine_event_type(self, text: str) -> str:
        """Determine event type from text"""
        text_lower = text.lower()

        if any(k in text_lower for k in ['but', 'goal', '⚽']):
            return 'goal'
        elif any(k in text_lower for k in ['carton jaune', 'yellow', '🟨']):
            return 'yellow_card'
        elif any(k in text_lower for k in ['carton rouge', 'red', '🟥']):
            return 'red_card'
        elif any(k in text_lower for k in ['changement', 'remplacement', '🔄']):
            return 'substitution'
        elif any(k in text_lower for k in ['penalty', 'pénalty']):
            return 'penalty'
        elif any(k in text_lower for k in ['mi-temps', 'half']):
            return 'half_time'
        elif any(k in text_lower for k in ['fin du match', 'final']):
            return 'final_whistle'
        else:
            return 'commentary'


async def main():
    import sys

    if len(sys.argv) < 2:
        print("Usage: python aggressive_scraper.py <url>")
        print("\nExamples:")
        print("  RMC: https://rmcsport.bfmtv.com/football/...")
        print("  L'Équipe: https://www.lequipe.fr/Football/match-direct/...")
        sys.exit(1)

    url = sys.argv[1]

    scraper = AggressiveScraper()
    commentary = await scraper.scrape_match(url, save_debug=True)

    print(f"\n{'='*70}")
    print(f"AGGRESSIVE SCRAPING RESULTS")
    print(f"{'='*70}")
    print(f"\n✅ Extracted {len(commentary)} commentary entries")

    if commentary:
        # Group by extraction method
        methods = {}
        for entry in commentary:
            method = entry.get('method', 'unknown')
            methods[method] = methods.get(method, 0) + 1

        print(f"\n📊 Extraction methods:")
        for method, count in methods.items():
            print(f"   {method}: {count}")

        print(f"\n📝 Sample commentary (first 5):")
        for i, entry in enumerate(commentary[:5], 1):
            print(f"\n{i}. {entry['time']} - {entry['event_type']} [{entry['method']}]")
            print(f"   {entry['text'][:100]}{'...' if len(entry['text']) > 100 else ''}")

        # Save results
        output_file = 'data/aggressive_scraped.json'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(commentary, f, ensure_ascii=False, indent=2)

        print(f"\n💾 Saved to: {output_file}")
        print(f"📸 Debug files: data/debug_screenshot.png, data/debug_page.html")
    else:
        print("\n❌ No commentary found.")
        print("📸 Check debug files: data/debug_screenshot.png, data/debug_page.html")

    print(f"\n{'='*70}\n")


if __name__ == '__main__':
    asyncio.run(main())
