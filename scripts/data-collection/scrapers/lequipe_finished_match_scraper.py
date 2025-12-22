#!/usr/bin/env python3
"""
L'Équipe finished match scraper
Extracts full commentary from completed matches
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


class LeQuipeFinishedMatchScraper:
    """Scrapes L'Équipe finished match pages for complete commentary"""

    async def scrape_match(self, url: str) -> List[Dict]:
        """
        Scrape commentary from L'Équipe match page

        Args:
            url: L'Équipe match URL

        Returns:
            List of commentary dictionaries
        """
        logger.info(f"🎯 Scraping L'Équipe: {url}")

        commentary_list = []

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)

            context = await browser.new_context(
                viewport={'width': 1920, 'height': 1080},
                user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            )

            page = await context.new_page()

            try:
                # Navigate and wait for page to fully load
                logger.info("📄 Loading page...")
                await page.goto(url, wait_until='networkidle', timeout=60000)

                # Wait for JavaScript to render
                await page.wait_for_timeout(3000)

                # FIRST: Dismiss cookie consent popup
                logger.info("🍪 Dismissing cookie popup...")
                try:
                    # Try multiple cookie button selectors
                    cookie_buttons = [
                        'button:has-text("Tout refuser")',
                        'button:has-text("Refuser")',
                        'button:has-text("Continuer sans accepter")',
                        '[class*="cookie"] button',
                        '[class*="consent"] button',
                    ]

                    for selector in cookie_buttons:
                        button = await page.query_selector(selector)
                        if button:
                            logger.info(f"✓ Found cookie button: {selector}")
                            await button.click()
                            await page.wait_for_timeout(1000)
                            break
                except Exception as e:
                    logger.debug(f"No cookie popup or already dismissed: {e}")

                # SECOND: Click to show ALL commentary (not just highlights)
                logger.info("🔘 Looking for 'show all commentary' button...")
                try:
                    # Wait a bit for page to settle after cookie dismiss
                    await page.wait_for_timeout(2000)

                    # Look for the toggle/filter button using partial text match
                    # The button text is "afficher uniquement les temps forts (13)"
                    show_all_button = await page.query_selector('text=/afficher uniquement les temps forts/')

                    if show_all_button:
                        logger.info("✓ Found 'show only highlights' toggle, clicking to show ALL...")
                        await show_all_button.click(force=True)  # Force click to bypass overlays
                        await page.wait_for_timeout(3000)  # Wait for all commentary to load
                        logger.info("✅ Clicked! Should now show all commentary")
                    else:
                        logger.warning("Could not find show all button - may already be showing all")

                except Exception as e:
                    logger.warning(f"Could not click show all button: {e}")

                # Scroll repeatedly to load all commentary (lazy loading)
                logger.info("📜 Scrolling to load all commentary...")
                previous_height = 0
                scroll_attempts = 0
                max_scrolls = 20  # Safety limit

                while scroll_attempts < max_scrolls:
                    # Get current scroll height
                    current_height = await page.evaluate('document.body.scrollHeight')

                    # Scroll to bottom
                    await page.evaluate('window.scrollTo(0, document.body.scrollHeight)')

                    # Wait for content to load
                    await page.wait_for_timeout(2000)

                    # Check if new content loaded
                    new_height = await page.evaluate('document.body.scrollHeight')

                    if new_height == previous_height:
                        # No new content loaded, we're done
                        logger.info(f"✓ Finished scrolling after {scroll_attempts + 1} attempts")
                        break

                    previous_height = new_height
                    scroll_attempts += 1
                    logger.info(f"  Scroll {scroll_attempts}/{max_scrolls} - height: {new_height}px")

                # Scroll back to top to ensure all content is in DOM
                await page.evaluate('window.scrollTo(0, 0)')
                await page.wait_for_timeout(1000)

                # Strategy 1: Extract from embedded __NUXT__ or __NEXT_DATA__
                logger.info("🔍 Looking for embedded JSON data...")
                json_data = await self._extract_json_data(page)

                if json_data:
                    logger.info(f"✓ Found JSON data ({len(str(json_data))} chars)")
                    commentary_list.extend(await self._parse_json_commentary(json_data, url))

                # Strategy 2: Extract from rendered DOM
                if not commentary_list:
                    logger.info("🔍 Extracting from rendered DOM...")
                    commentary_list.extend(await self._extract_from_dom(page, url))

                # Strategy 3: Get all visible text and parse
                if not commentary_list:
                    logger.info("🔍 Parsing visible text...")
                    commentary_list.extend(await self._extract_from_text(page, url))

                # Save debug info
                await page.screenshot(path='data/lequipe_debug.png', full_page=True)
                content = await page.content()
                with open('data/lequipe_page.html', 'w', encoding='utf-8') as f:
                    f.write(content)

                # Save all text
                all_text = await page.inner_text('body')
                with open('data/lequipe_text.txt', 'w', encoding='utf-8') as f:
                    f.write(all_text)

                logger.info("📸 Debug files saved")

            except Exception as e:
                logger.error(f"❌ Error: {e}")
                import traceback
                traceback.print_exc()

            finally:
                await browser.close()

        # Deduplicate
        unique_commentary = self._deduplicate(commentary_list)

        logger.info(f"✅ Extracted {len(unique_commentary)} unique entries")
        return unique_commentary

    async def _extract_json_data(self, page):
        """Extract embedded JSON data"""
        try:
            # Look for __NUXT__, __NEXT_DATA__, or other embedded JSON
            json_text = await page.evaluate('''() => {
                // Check for Nuxt.js data
                if (window.__NUXT__) {
                    return JSON.stringify(window.__NUXT__);
                }

                // Check for Next.js data
                const nextData = document.querySelector('#__NEXT_DATA__');
                if (nextData) {
                    return nextData.textContent;
                }

                // Look for any script tags with JSON
                const scripts = document.querySelectorAll('script[type="application/json"]');
                for (let script of scripts) {
                    if (script.textContent.length > 100) {
                        return script.textContent;
                    }
                }

                // Look for script tags containing large data objects
                const allScripts = document.querySelectorAll('script:not([src])');
                for (let script of allScripts) {
                    const text = script.textContent;
                    if (text.includes('commentary') || text.includes('events') || text.includes('timeline')) {
                        // Try to extract JSON-like structures
                        const matches = text.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);
                        if (matches && matches.length > 0) {
                            // Return the largest match
                            return matches.sort((a, b) => b.length - a.length)[0];
                        }
                    }
                }

                return null;
            }''')

            if json_text:
                return json.loads(json_text)

        except Exception as e:
            logger.debug(f"JSON extraction failed: {e}")

        return None

    async def _parse_json_commentary(self, data, url: str) -> List[Dict]:
        """Recursively parse JSON for commentary data"""
        commentary = []

        def recursive_search(obj, depth=0):
            if depth > 15:
                return

            if isinstance(obj, dict):
                # Look for commentary-like structures
                for key, value in obj.items():
                    key_lower = str(key).lower()

                    # Found a commentary array
                    if key_lower in ['comments', 'commentary', 'events', 'timeline', 'live']:
                        if isinstance(value, list):
                            for item in value:
                                if isinstance(item, dict):
                                    self._extract_commentary_item(item, commentary, url)

                    # Recurse
                    recursive_search(value, depth + 1)

            elif isinstance(obj, list):
                for item in obj:
                    recursive_search(item, depth + 1)

        recursive_search(data)
        return commentary

    def _extract_commentary_item(self, item: dict, commentary: list, url: str):
        """Extract commentary from a JSON item"""
        try:
            time_val = None
            text_val = None

            # Look for time field
            for key in ['time', 'minute', 'clock', 'matchTime']:
                if key in item and item[key]:
                    time_val = str(item[key])
                    break

            # Look for text field
            for key in ['text', 'comment', 'description', 'message', 'content']:
                if key in item and item[key]:
                    text_val = str(item[key])
                    break

            # If we found both time and text
            if time_val and text_val and len(text_val) > 20:
                commentary.append({
                    'source': 'lequipe',
                    'time': time_val.replace('′', "'"),
                    'text': text_val.strip(),
                    'event_type': self._determine_event_type(text_val),
                    'scraped_at': datetime.now().isoformat(),
                    'url': url,
                    'method': 'json'
                })

        except Exception as e:
            logger.debug(f"Failed to extract item: {e}")

    async def _extract_from_dom(self, page, url: str) -> List[Dict]:
        """Extract from DOM elements"""
        commentary = []

        # Find CommentsLive container
        container = await page.query_selector('.CommentsLive')

        if container:
            # Get all event elements
            events = await container.query_selector_all('.CommentsLive__event')
            logger.info(f"  Found {len(events)} CommentsLive__event elements")

            for event in events:
                try:
                    # Get the full HTML to inspect
                    html = await event.inner_html()

                    # Get visible text
                    text = await event.inner_text()

                    # Extract time
                    time_elem = await event.query_selector('.CommentsLive__time')
                    if time_elem:
                        time_str = await time_elem.inner_text()
                        time_str = time_str.strip()

                        # Check if there's actual commentary text (not just time + icon)
                        if len(text.strip()) > len(time_str) + 10:
                            # Remove time from text
                            commentary_text = text.replace(time_str, '').strip()

                            if len(commentary_text) > 20:
                                commentary.append({
                                    'source': 'lequipe',
                                    'time': time_str.replace('′', "'"),
                                    'text': commentary_text,
                                    'event_type': self._determine_event_type(commentary_text),
                                    'scraped_at': datetime.now().isoformat(),
                                    'url': url,
                                    'method': 'dom'
                                })

                except Exception as e:
                    logger.debug(f"Failed to parse event: {e}")
                    continue

        return commentary

    async def _extract_from_text(self, page, url: str) -> List[Dict]:
        """Extract from raw page text"""
        commentary = []

        all_text = await page.inner_text('body')

        # Split by double newlines and process
        lines = all_text.split('\n')

        i = 0
        while i < len(lines):
            line = lines[i].strip()

            # Check if line is a timestamp
            time_match = re.match(r'^(\d+[′\'](?:\+\d+)?)\s*$', line)

            if time_match:
                time_str = time_match.group(1).replace('′', "'")

                # Look ahead for commentary text
                commentary_text = []
                j = i + 1

                # Skip empty lines
                while j < len(lines) and not lines[j].strip():
                    j += 1

                # Collect commentary lines (stop at next timestamp or empty section)
                while j < len(lines):
                    next_line = lines[j].strip()

                    # Stop if we hit another timestamp
                    if re.match(r'^\d+[′\'](?:\+\d+)?\s*$', next_line):
                        break

                    # Stop if we hit a section header or navigation
                    if next_line in ['', 'publicité', 'L\'ÉQUIPE', 'afficher uniquement']:
                        if commentary_text:  # Only break if we already have some text
                            break

                    if next_line and len(next_line) > 10:
                        commentary_text.append(next_line)

                    j += 1

                # Combine commentary lines
                if commentary_text:
                    text = ' '.join(commentary_text)

                    # Clean up
                    text = text.strip()

                    # Remove common headers
                    text = re.sub(r'^(But|Carton jaune|Carton rouge|Changement)\s+pour\s+', '', text)

                    if len(text) >= 30 and not text.startswith('http'):
                        commentary.append({
                            'source': 'lequipe',
                            'time': time_str,
                            'text': text,
                            'event_type': self._determine_event_type(text),
                            'scraped_at': datetime.now().isoformat(),
                            'url': url,
                            'method': 'text'
                        })

                i = j
            else:
                i += 1

        return commentary

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
        else:
            return 'commentary'

    def _deduplicate(self, commentary_list: List[Dict]) -> List[Dict]:
        """Remove duplicates"""
        seen = set()
        unique = []

        for entry in commentary_list:
            key = entry['text'][:100].lower()
            if key not in seen:
                seen.add(key)
                unique.append(entry)

        return unique


async def main():
    import sys

    if len(sys.argv) < 2:
        print("Usage: python lequipe_finished_match_scraper.py <url>")
        print("\nExample:")
        print("  python lequipe_finished_match_scraper.py https://www.lequipe.fr/Football/match-direct/can/2025/maroc-comores-live/670748")
        sys.exit(1)

    url = sys.argv[1]

    scraper = LeQuipeFinishedMatchScraper()
    commentary = await scraper.scrape_match(url)

    print(f"\n{'='*70}")
    print("SCRAPING RESULTS")
    print(f"{'='*70}")
    print(f"\n✅ Extracted {len(commentary)} commentary entries")

    if commentary:
        # Group by method
        methods = {}
        for entry in commentary:
            method = entry.get('method', 'unknown')
            methods[method] = methods.get(method, 0) + 1

        print(f"\n📊 Extraction methods:")
        for method, count in methods.items():
            print(f"   {method}: {count}")

        print(f"\n📝 Sample (first 10):")
        for i, entry in enumerate(commentary[:10], 1):
            print(f"\n{i}. {entry['time']} - {entry['event_type']} [{entry['method']}]")
            print(f"   {entry['text'][:120]}{'...' if len(entry['text']) > 120 else ''}")

        # Save to JSON
        output_file = 'data/lequipe_scraped.json'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(commentary, f, ensure_ascii=False, indent=2)

        print(f"\n💾 Saved to: {output_file}")
        print(f"📸 Debug: data/lequipe_debug.png, data/lequipe_page.html, data/lequipe_text.txt")
    else:
        print("\n❌ No commentary found")
        print("📁 Check debug files for details")

    print(f"\n{'='*70}\n")


if __name__ == '__main__':
    asyncio.run(main())
