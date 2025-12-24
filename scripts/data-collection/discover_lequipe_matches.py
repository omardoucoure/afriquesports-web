#!/usr/bin/env python3
"""
L'Équipe Match URL Discovery Script
Automatically discovers 1000+ match URLs with commentary from L'Équipe

Strategies:
1. Sitemap crawling
2. Competition archive pages
3. Calendar/results pages
4. Search results
5. Recent matches listing
"""

import asyncio
import re
import json
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Set
from playwright.async_api import async_playwright

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class LeQuipeMatchDiscovery:
    """Discovers match URLs from L'Équipe"""

    def __init__(self):
        self.base_url = "https://www.lequipe.fr"
        self.match_urls = set()

        # Competition pages to crawl
        self.competition_pages = [
            # African competitions
            "/Football/can/page-calendrier-resultats",
            "/Football/can-2023/page-calendrier-resultats",
            "/Football/can-2025/page-calendrier-resultats",
            "/Football/ligue-champions-afrique/page-calendrier-resultats",
            "/Football/coupe-afrique/page-calendrier-resultats",

            # French competitions (many African players)
            "/Football/ligue-1/page-calendrier-resultats",
            "/Football/ligue-1-2024/page-calendrier-resultats",
            "/Football/ligue-1-2023/page-calendrier-resultats",
            "/Football/ligue-2/page-calendrier-resultats",
            "/Football/coupe-de-france/page-calendrier-resultats",

            # European competitions
            "/Football/ligue-des-champions/page-calendrier-resultats",
            "/Football/ligue-des-champions-2024/page-calendrier-resultats",
            "/Football/ligue-des-champions-2023/page-calendrier-resultats",
            "/Football/ligue-europa/page-calendrier-resultats",
            "/Football/ligue-europa-2024/page-calendrier-resultats",

            # International
            "/Football/coupe-du-monde/page-calendrier-resultats",
            "/Football/qualifications-coupe-du-monde-afrique/page-calendrier-resultats",
            "/Football/euro/page-calendrier-resultats",
        ]

    async def discover_all_urls(self, target: int = 1000) -> List[str]:
        """
        Discover match URLs using multiple strategies

        Args:
            target: Target number of URLs to find

        Returns:
            List of unique match URLs
        """
        logger.info("=" * 70)
        logger.info("L'ÉQUIPE MATCH URL DISCOVERY")
        logger.info("=" * 70)
        logger.info(f"Target: {target} match URLs\n")

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                viewport={'width': 1920, 'height': 1080},
                user_agent='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
            )
            page = await context.new_page()

            try:
                # Strategy 1: Sitemap
                logger.info("📋 STRATEGY 1: Crawling sitemap...")
                await self._discover_from_sitemap(page)
                logger.info(f"  Found {len(self.match_urls)} URLs so far\n")

                if len(self.match_urls) >= target:
                    return list(self.match_urls)[:target]

                # Strategy 2: Competition pages
                logger.info("📋 STRATEGY 2: Crawling competition pages...")
                await self._discover_from_competitions(page, target)
                logger.info(f"  Found {len(self.match_urls)} URLs so far\n")

                if len(self.match_urls) >= target:
                    return list(self.match_urls)[:target]

                # Strategy 3: Search queries
                logger.info("📋 STRATEGY 3: Using search...")
                await self._discover_from_search(page, target)
                logger.info(f"  Found {len(self.match_urls)} URLs so far\n")

                if len(self.match_urls) >= target:
                    return list(self.match_urls)[:target]

                # Strategy 4: Recent matches
                logger.info("📋 STRATEGY 4: Recent matches pages...")
                await self._discover_from_recent(page, target)
                logger.info(f"  Found {len(self.match_urls)} URLs so far\n")

                # Strategy 5: Direct navigation through archives
                logger.info("📋 STRATEGY 5: Archive deep crawl...")
                await self._discover_from_archives(page, target)
                logger.info(f"  Found {len(self.match_urls)} URLs so far\n")

            finally:
                await browser.close()

        final_urls = list(self.match_urls)[:target]

        logger.info("=" * 70)
        logger.info("DISCOVERY COMPLETE")
        logger.info("=" * 70)
        logger.info(f"✅ Discovered {len(final_urls)} unique match URLs\n")

        return final_urls

    async def _discover_from_sitemap(self, page):
        """Discover URLs from sitemap"""
        try:
            # L'Équipe sitemap URLs
            sitemap_urls = [
                f"{self.base_url}/sitemap.xml",
                f"{self.base_url}/sitemap-football.xml",
                f"{self.base_url}/Football/sitemap.xml",
            ]

            for sitemap_url in sitemap_urls:
                try:
                    await page.goto(sitemap_url, wait_until='domcontentloaded', timeout=30000)
                    content = await page.content()

                    # Extract URLs from sitemap XML
                    urls = re.findall(r'<loc>(https://www\.lequipe\.fr/Football/match-direct/[^<]+)</loc>', content)

                    for url in urls:
                        if '/match-direct/' in url:
                            self.match_urls.add(url)

                    logger.info(f"  Sitemap {sitemap_url}: +{len(urls)} URLs")

                except Exception as e:
                    logger.debug(f"  Sitemap {sitemap_url}: {e}")

                await asyncio.sleep(1)

        except Exception as e:
            logger.debug(f"Sitemap discovery error: {e}")

    async def _discover_from_competitions(self, page, target: int):
        """Discover from competition calendar pages"""
        for comp_page in self.competition_pages:
            if len(self.match_urls) >= target:
                break

            url = f"{self.base_url}{comp_page}"

            try:
                logger.info(f"  Crawling: {comp_page}")

                await page.goto(url, wait_until='networkidle', timeout=30000)
                await page.wait_for_timeout(2000)

                # Dismiss cookie popup
                try:
                    cookie_btn = await page.query_selector('button:has-text("Tout refuser")')
                    if cookie_btn:
                        await cookie_btn.click()
                        await page.wait_for_timeout(1000)
                except:
                    pass

                # Scroll to load more matches
                for _ in range(10):
                    await page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
                    await page.wait_for_timeout(1500)

                # Extract all links
                content = await page.content()

                # Find match-direct links
                pattern = r'href="(/Football/match-direct/[^"]+)"'
                matches = re.findall(pattern, content)

                new_count = 0
                for match_path in matches:
                    full_url = f"{self.base_url}{match_path}"
                    if full_url not in self.match_urls:
                        self.match_urls.add(full_url)
                        new_count += 1

                logger.info(f"    +{new_count} new URLs (total: {len(self.match_urls)})")

                await asyncio.sleep(2)

            except Exception as e:
                logger.debug(f"  Error on {comp_page}: {e}")

    async def _discover_from_search(self, page, target: int):
        """Discover from search results"""
        search_queries = [
            "CAN 2025 match direct",
            "CAN 2024 match direct",
            "CAN 2023 match direct",
            "Sénégal match direct",
            "Maroc match direct",
            "Nigeria match direct",
            "Cameroun match direct",
            "Algérie match direct",
            "Côte d'Ivoire match direct",
            "Égypte match direct",
            "Ghana match direct",
            "Mali match direct",
            "Tunisie match direct",
            "Afrique du Sud match direct",
            "Ligue 1 match direct",
            "Champions League match direct",
            "Ligue des champions Afrique",
        ]

        for query in search_queries:
            if len(self.match_urls) >= target:
                break

            try:
                search_url = f"{self.base_url}/recherche/?q={query.replace(' ', '+')}"
                logger.info(f"  Search: '{query}'")

                await page.goto(search_url, wait_until='networkidle', timeout=30000)
                await page.wait_for_timeout(2000)

                # Scroll to load results
                for _ in range(3):
                    await page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
                    await page.wait_for_timeout(1000)

                content = await page.content()

                # Extract match-direct links
                pattern = r'href="(/Football/match-direct/[^"]+)"'
                matches = re.findall(pattern, content)

                new_count = 0
                for match_path in matches:
                    full_url = f"{self.base_url}{match_path}"
                    if full_url not in self.match_urls:
                        self.match_urls.add(full_url)
                        new_count += 1

                logger.info(f"    +{new_count} URLs (total: {len(self.match_urls)})")

                await asyncio.sleep(2)

            except Exception as e:
                logger.debug(f"  Search error for '{query}': {e}")

    async def _discover_from_recent(self, page, target: int):
        """Discover from recent matches pages"""
        try:
            # Recent football matches
            recent_urls = [
                f"{self.base_url}/Football/",
                f"{self.base_url}/Football/resultats/",
                f"{self.base_url}/Football/lives/",
            ]

            for url in recent_urls:
                if len(self.match_urls) >= target:
                    break

                try:
                    logger.info(f"  Recent: {url}")

                    await page.goto(url, wait_until='networkidle', timeout=30000)
                    await page.wait_for_timeout(2000)

                    # Scroll
                    for _ in range(5):
                        await page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
                        await page.wait_for_timeout(1000)

                    content = await page.content()
                    pattern = r'href="(/Football/match-direct/[^"]+)"'
                    matches = re.findall(pattern, content)

                    new_count = 0
                    for match_path in matches:
                        full_url = f"{self.base_url}{match_path}"
                        if full_url not in self.match_urls:
                            self.match_urls.add(full_url)
                            new_count += 1

                    logger.info(f"    +{new_count} URLs")

                    await asyncio.sleep(2)

                except Exception as e:
                    logger.debug(f"  Recent page error: {e}")

        except Exception as e:
            logger.debug(f"Recent discovery error: {e}")

    async def _discover_from_archives(self, page, target: int):
        """Deep crawl through archives"""
        try:
            # Generate date-based archive URLs
            # L'Équipe might have URLs like /Football/2024/12/20/

            # Go back 2 years
            start_date = datetime.now() - timedelta(days=730)
            current_date = datetime.now()

            dates_to_try = []
            date = start_date
            while date <= current_date:
                dates_to_try.append(date)
                date += timedelta(days=7)  # Sample every week

            for date in dates_to_try:
                if len(self.match_urls) >= target:
                    break

                year = date.strftime("%Y")
                month = date.strftime("%m")
                day = date.strftime("%d")

                # Try various archive URL patterns
                archive_urls = [
                    f"{self.base_url}/Football/{year}/{month}/{day}/",
                    f"{self.base_url}/Football/resultats/{year}/{month}/",
                ]

                for archive_url in archive_urls:
                    try:
                        await page.goto(archive_url, wait_until='domcontentloaded', timeout=15000)
                        await page.wait_for_timeout(1000)

                        content = await page.content()
                        pattern = r'href="(/Football/match-direct/[^"]+)"'
                        matches = re.findall(pattern, content)

                        for match_path in matches:
                            full_url = f"{self.base_url}{match_path}"
                            self.match_urls.add(full_url)

                        await asyncio.sleep(1)

                    except:
                        continue

            logger.info(f"  Archive crawl: {len(self.match_urls)} total URLs")

        except Exception as e:
            logger.debug(f"Archive discovery error: {e}")


async def main():
    """Main entry point"""
    discovery = LeQuipeMatchDiscovery()

    # Discover 1000+ match URLs
    match_urls = await discovery.discover_all_urls(target=1200)  # Get extra for safety

    # Save to file
    output_dir = Path("/workspace/training_data")
    output_dir.mkdir(parents=True, exist_ok=True)

    output_file = output_dir / "discovered_match_urls.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(match_urls, f, ensure_ascii=False, indent=2)

    logger.info(f"💾 Saved {len(match_urls)} URLs to {output_file}")

    # Also save as text file (one per line)
    txt_file = output_dir / "discovered_match_urls.txt"
    with open(txt_file, 'w', encoding='utf-8') as f:
        for url in match_urls:
            f.write(url + '\n')

    logger.info(f"💾 Also saved to {txt_file}")

    logger.info("\n" + "=" * 70)
    logger.info("NEXT STEP")
    logger.info("=" * 70)
    logger.info(f"Run: python runpod_collect_with_playwright.py")
    logger.info("=" * 70 + "\n")

    return match_urls


if __name__ == '__main__':
    asyncio.run(main())
