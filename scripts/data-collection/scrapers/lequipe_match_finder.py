#!/usr/bin/env python3
"""
L'Équipe CAN 2025 Match Finder
Discovers match URLs and filters for fully commented matches
"""

import asyncio
import re
from typing import List, Dict
from playwright.async_api import async_playwright
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class LeQuipeMatchFinder:
    """Finds commented CAN 2025 matches on L'Équipe"""

    def __init__(self):
        self.base_url = "https://www.lequipe.fr"
        # Multiple competitions to maximize training data
        self.competition_urls = [
            # African competitions
            "https://www.lequipe.fr/Football/CAN/",
            "https://www.lequipe.fr/Football/can/page-calendrier-resultats",

            # French competitions
            "https://www.lequipe.fr/Football/Ligue-1/page-calendrier-resultats",
            "https://www.lequipe.fr/Football/ligue-1-2/page-calendrier-resultats",

            # European competitions
            "https://www.lequipe.fr/Football/ligue-des-champions/page-calendrier-resultats",
            "https://www.lequipe.fr/Football/ligue-europa/page-calendrier-resultats",

            # International
            "https://www.lequipe.fr/Football/coupe-du-monde/page-calendrier-resultats",
        ]

    async def find_match_urls(self) -> List[str]:
        """
        Find all football match URLs from calendar pages

        Returns:
            List of match URLs
        """
        logger.info("🔍 Searching for football match URLs across competitions...")

        match_urls = set()

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)

            context = await browser.new_context(
                viewport={'width': 1920, 'height': 1080},
                user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            )

            page = await context.new_page()

            for calendar_url in self.competition_urls:
                try:
                    logger.info(f"📄 Loading {calendar_url}...")
                    await page.goto(calendar_url, wait_until='networkidle', timeout=60000)
                    await page.wait_for_timeout(2000)

                    # Dismiss cookie popup
                    try:
                        cookie_button = await page.query_selector('[class*="consent"] button')
                        if cookie_button:
                            await cookie_button.click()
                            await page.wait_for_timeout(1000)
                    except:
                        pass

                    # Scroll to load all matches
                    for _ in range(5):
                        await page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
                        await page.wait_for_timeout(1500)

                    # Extract all match links
                    content = await page.content()

                    # Find match-direct links (any competition, any year)
                    pattern = r'href="(/Football/match-direct/[^"]+)"'
                    matches = re.findall(pattern, content)

                    for match_path in matches:
                        full_url = f"{self.base_url}{match_path}"
                        match_urls.add(full_url)
                        logger.info(f"  ✓ Found: {match_path}")

                except Exception as e:
                    logger.error(f"❌ Error loading {calendar_url}: {e}")

            await browser.close()

        logger.info(f"\n✅ Found {len(match_urls)} total match URLs")
        return sorted(list(match_urls))

    async def check_if_commented(self, url: str) -> Dict:
        """
        Check if a match has full commentary (not just highlights)

        Args:
            url: Match URL to check

        Returns:
            Dict with match info and commentary status
        """
        logger.info(f"🔍 Checking: {url}")

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                viewport={'width': 1920, 'height': 1080},
                user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            )
            page = await context.new_page()

            try:
                await page.goto(url, wait_until='networkidle', timeout=60000)
                await page.wait_for_timeout(2000)

                # Dismiss cookie popup
                try:
                    cookie_button = await page.query_selector('[class*="consent"] button')
                    if cookie_button:
                        await cookie_button.click()
                        await page.wait_for_timeout(1000)
                except:
                    pass

                # Get match title
                title_elem = await page.query_selector('h1')
                title = await title_elem.inner_text() if title_elem else "Unknown"

                # Check for commentary indicator
                toggle_button = await page.query_selector('text=/afficher uniquement les temps forts/')

                # Check if match is commented (has the toggle button)
                if toggle_button:
                    toggle_text = await toggle_button.inner_text()
                    # Extract number from "(13)" or similar
                    match = re.search(r'\((\d+)\)', toggle_text)
                    highlights_count = int(match.group(1)) if match else 0

                    # Click to show all
                    await toggle_button.click(force=True)
                    await page.wait_for_timeout(3000)

                    # Scroll to load all commentary
                    previous_height = 0
                    for scroll in range(10):  # Max 10 scrolls
                        current_height = await page.evaluate('document.body.scrollHeight')
                        await page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
                        await page.wait_for_timeout(1500)
                        new_height = await page.evaluate('document.body.scrollHeight')
                        if new_height == previous_height:
                            break
                        previous_height = new_height

                    # Count CommentsLive__event elements after loading all
                    events = await page.query_selector_all('.CommentsLive__event')
                    total_events = len(events)

                    is_fully_commented = total_events > highlights_count * 2  # Heuristic

                    logger.info(f"  ✓ {title}")
                    logger.info(f"    Highlights: {highlights_count}, Total events: {total_events}")
                    logger.info(f"    Fully commented: {is_fully_commented}")

                    await browser.close()

                    return {
                        'url': url,
                        'title': title.strip(),
                        'is_commented': True,
                        'is_fully_commented': is_fully_commented,
                        'highlights_count': highlights_count,
                        'total_events': total_events,
                        'status': 'finished'
                    }
                else:
                    # No toggle button - check if match is finished or upcoming
                    text = await page.inner_text('body')

                    # Check for match status
                    if 'commence' in text.lower() or 'à venir' in text.lower():
                        status = 'upcoming'
                    else:
                        status = 'highlights_only'

                    logger.info(f"  ⚠️  {title} - {status}")

                    await browser.close()

                    return {
                        'url': url,
                        'title': title.strip(),
                        'is_commented': False,
                        'is_fully_commented': False,
                        'highlights_count': 0,
                        'total_events': 0,
                        'status': status
                    }

            except Exception as e:
                logger.error(f"  ❌ Error: {e}")
                await browser.close()

                return {
                    'url': url,
                    'title': 'Error',
                    'is_commented': False,
                    'is_fully_commented': False,
                    'highlights_count': 0,
                    'total_events': 0,
                    'status': 'error'
                }

    async def find_commented_matches(self) -> List[Dict]:
        """
        Find all fully commented CAN 2025 matches

        Returns:
            List of match info dicts for fully commented matches
        """
        # Step 1: Find all match URLs
        all_urls = await self.find_match_urls()

        # Step 2: Check each match
        logger.info(f"\n📋 Checking {len(all_urls)} matches for commentary...")

        all_matches = []
        for url in all_urls:
            match_info = await self.check_if_commented(url)
            all_matches.append(match_info)
            await asyncio.sleep(1)  # Be polite

        # Step 3: Filter for fully commented matches
        commented_matches = [
            m for m in all_matches
            if m['is_fully_commented']
        ]

        logger.info(f"\n{'='*70}")
        logger.info("SUMMARY")
        logger.info(f"{'='*70}")
        logger.info(f"Total matches found: {len(all_matches)}")
        logger.info(f"Fully commented: {len(commented_matches)}")
        logger.info(f"Highlights only: {len([m for m in all_matches if not m['is_commented']])}")
        logger.info(f"Upcoming: {len([m for m in all_matches if m['status'] == 'upcoming'])}")

        if commented_matches:
            logger.info(f"\n✅ FULLY COMMENTED MATCHES:")
            for i, match in enumerate(commented_matches, 1):
                logger.info(f"{i}. {match['title']}")
                logger.info(f"   {match['url']}")
                logger.info(f"   Events: {match['total_events']}")

        return commented_matches


async def main():
    finder = LeQuipeMatchFinder()
    commented_matches = await finder.find_commented_matches()

    # Save to file
    import json
    with open('data/lequipe_commented_matches.json', 'w', encoding='utf-8') as f:
        json.dump(commented_matches, f, ensure_ascii=False, indent=2)

    logger.info(f"\n💾 Saved to: data/lequipe_commented_matches.json")


if __name__ == '__main__':
    asyncio.run(main())
