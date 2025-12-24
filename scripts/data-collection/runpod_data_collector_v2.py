#!/usr/bin/env python3
"""
RunPod Data Collection Script v2
Uses manually curated match URLs from L'Équipe
More reliable than automated discovery

Target: 2000+ high-quality commentary examples
"""

import asyncio
import json
import re
import logging
from datetime import datetime
from typing import List, Dict
from pathlib import Path

# Install dependencies if not present
try:
    import aiohttp
    from bs4 import BeautifulSoup
except ImportError:
    import subprocess
    subprocess.run(["pip", "install", "aiohttp", "beautifulsoup4", "lxml"], check=True)
    import aiohttp
    from bs4 import BeautifulSoup

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Manually curated L'Équipe match URLs
# These are real matches with full commentary
LEQUIPE_MATCH_URLS = [
    # CAN 2025 matches (confirmed to have commentary)
    "https://www.lequipe.fr/Football/match-direct/can/2025/maroc-comores-live/670748",

    # We'll use a search-based approach to find more real URLs
    # by querying L'Équipe's search API
]


class LeQuipeScraper:
    """Scrapes commentary from L'Équipe match pages"""

    def __init__(self):
        self.base_url = "https://www.lequipe.fr"
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml',
            'Accept-Language': 'fr-FR,fr;q=0.9',
        }
        self.session = None

    async def init_session(self):
        if not self.session:
            self.session = aiohttp.ClientSession(headers=self.headers)

    async def close_session(self):
        if self.session:
            await self.session.close()

    async def search_match_urls(self, query: str, max_results: int = 50) -> List[str]:
        """
        Search for match URLs using L'Équipe's search

        Args:
            query: Search query (e.g., "CAN 2025", "Sénégal", "Maroc")
            max_results: Max results to return

        Returns:
            List of match URLs
        """
        await self.init_session()

        urls = set()
        search_queries = [
            "CAN 2025 match direct",
            "Maroc match direct",
            "Sénégal match direct",
            "Nigeria match direct",
            "Algérie match direct",
            "Cameroun match direct",
            "Côte d'Ivoire match direct",
            "Égypte match direct",
        ]

        for query in search_queries:
            if len(urls) >= max_results:
                break

            try:
                # Try L'Équipe search URL pattern
                search_url = f"https://www.lequipe.fr/recherche/?q={query.replace(' ', '+')}"

                async with self.session.get(search_url, timeout=15) as response:
                    if response.status == 200:
                        html = await response.text()
                        soup = BeautifulSoup(html, 'lxml')

                        # Find match-direct links
                        for link in soup.find_all('a', href=True):
                            href = link['href']
                            if '/match-direct/' in href and '/can/' in href:
                                if href.startswith('/'):
                                    full_url = f"{self.base_url}{href}"
                                else:
                                    full_url = href
                                urls.add(full_url)

                await asyncio.sleep(2)  # Be polite

            except Exception as e:
                logger.debug(f"Search error for '{query}': {e}")
                continue

        logger.info(f"Found {len(urls)} match URLs via search")
        return list(urls)

    async def scrape_match_commentary(self, url: str) -> List[Dict]:
        """Scrape commentary from match URL"""
        await self.init_session()

        try:
            async with self.session.get(url, timeout=30) as response:
                if response.status != 200:
                    return []

                html = await response.text()
                soup = BeautifulSoup(html, 'lxml')

                commentary_list = []

                # Match title
                match_title = "Unknown"
                title_elem = soup.find('h1')
                if title_elem:
                    match_title = title_elem.get_text(strip=True)

                # Try CommentsLive__event selector (L'Équipe's live commentary)
                events = soup.select('div.CommentsLive__event')

                if not events:
                    # Fallback selectors
                    events = (
                        soup.select('div[class*="timeline"]') or
                        soup.select('div[class*="event"]') or
                        soup.select('div[class*="live"]')
                    )

                for event in events:
                    try:
                        # Extract time
                        time_elem = (
                            event.select_one('span.CommentsLive__time') or
                            event.select_one('span[class*="time"]') or
                            event.select_one('span[class*="minute"]')
                        )

                        if not time_elem:
                            continue

                        time_text = time_elem.get_text(strip=True)

                        # Extract text
                        text_elem = (
                            event.select_one('p.CommentsLive__text') or
                            event.select_one('p[class*="text"]') or
                            event.select_one('div[class*="description"]')
                        )

                        if text_elem:
                            text = text_elem.get_text(strip=True)
                        else:
                            # Fallback: extract all text excluding time
                            time_copy = event.find(time_elem.name, class_=time_elem.get('class'))
                            if time_copy:
                                time_copy.extract()
                            text = event.get_text(separator=' ', strip=True)

                        # Clean text
                        text = re.sub(r'\s+', ' ', text).strip()

                        if len(text) < 20:
                            continue

                        # Event type
                        event_type = self._determine_event_type(event, text)

                        commentary_list.append({
                            'source': 'lequipe',
                            'match': match_title,
                            'time': time_text,
                            'text': text,
                            'event_type': event_type,
                            'url': url,
                            'scraped_at': datetime.utcnow().isoformat()
                        })

                    except Exception as e:
                        continue

                return commentary_list

        except Exception as e:
            logger.error(f"Error scraping {url}: {e}")
            return []

    def _determine_event_type(self, element, text: str) -> str:
        """Determine event type"""
        text_lower = text.lower()
        html_lower = str(element).lower()

        if any(kw in text_lower or kw in html_lower for kw in ['but', 'goal', '⚽']):
            return 'goal'
        elif any(kw in text_lower or kw in html_lower for kw in ['carton jaune', 'yellow']):
            return 'yellow_card'
        elif any(kw in text_lower or kw in html_lower for kw in ['carton rouge', 'red']):
            return 'red_card'
        elif any(kw in text_lower or kw in html_lower for kw in ['remplacement', 'substitution']):
            return 'substitution'
        elif 'penalty' in text_lower or 'pénalty' in text_lower:
            return 'penalty'
        else:
            return 'commentary'


class QualityFilter:
    """Quality filtering"""

    FOOTBALL_TERMS = {
        'but', 'goal', 'tir', 'frappe', 'passe', 'dribble', 'corner', 'penalty',
        'carton', 'jaune', 'rouge', 'gardien', 'défenseur', 'milieu', 'attaquant',
        'ballon', 'match', 'équipe', 'joueur', 'arbitre', 'faute', 'hors-jeu',
        'contre', 'attaque', 'défense', 'surface', 'cage', 'filet', 'poteau'
    }

    @staticmethod
    def filter_commentary(commentary: List[Dict], strict: bool = False) -> List[Dict]:
        filtered = []
        min_length = 60 if strict else 50
        max_length = 400 if strict else 500

        for entry in commentary:
            text = entry['text']

            if len(text) < min_length or len(text) > max_length:
                continue

            text_lower = text.lower()
            if not any(term in text_lower for term in QualityFilter.FOOTBALL_TERMS):
                continue

            if text.startswith(('http', 'www.')):
                continue

            sentence_count = text.count('.') + text.count('!') + text.count('?')
            if sentence_count > 3:
                continue

            letter_ratio = sum(c.isalpha() for c in text) / len(text)
            if letter_ratio < 0.5:
                continue

            filtered.append(entry)

        return filtered

    @staticmethod
    def remove_duplicates(commentary: List[Dict]) -> List[Dict]:
        seen_texts = set()
        unique = []

        for entry in commentary:
            normalized = re.sub(r'\s+', ' ', entry['text'].lower().strip())
            if normalized not in seen_texts:
                seen_texts.add(normalized)
                unique.append(entry)

        return unique


async def collect_training_data(
    target_examples: int = 2000,
    output_dir: str = "/workspace/training_data"
):
    """Main data collection function"""
    logger.info("=" * 70)
    logger.info("RUNPOD DATA COLLECTION V2 - AFRIQUE SPORTS")
    logger.info("=" * 70)
    logger.info(f"Target: {target_examples} high-quality examples")
    logger.info("=" * 70 + "\n")

    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    scraper = LeQuipeScraper()

    try:
        # Step 1: Get match URLs (manual + search)
        logger.info("📋 STEP 1: Getting match URLs...")

        # Start with manual URLs
        match_urls = list(LEQUIPE_MATCH_URLS)
        logger.info(f"  Starting with {len(match_urls)} manual URLs")

        # Search for more
        logger.info("  Searching for additional matches...")
        search_urls = await scraper.search_match_urls(max_results=100)
        match_urls.extend(search_urls)
        match_urls = list(set(match_urls))  # Remove duplicates

        logger.info(f"✅ Total URLs: {len(match_urls)}\n")

        # Save URLs
        urls_file = output_path / "match_urls.json"
        with open(urls_file, 'w', encoding='utf-8') as f:
            json.dump(match_urls, f, ensure_ascii=False, indent=2)

        # Step 2: Scrape commentary
        logger.info("📝 STEP 2: Scraping commentary...")
        all_commentary = []

        for i, url in enumerate(match_urls, 1):
            if len(all_commentary) >= target_examples:
                logger.info(f"✅ Reached target!")
                break

            logger.info(f"[{i}/{len(match_urls)}] {url}")

            commentary = await scraper.scrape_match_commentary(url)

            if commentary:
                logger.info(f"  ✓ {len(commentary)} entries")
                all_commentary.extend(commentary)
            else:
                logger.info(f"  ⚠️  No commentary")

            if i % 10 == 0:
                logger.info(f"  💾 Progress: {len(all_commentary)} total entries\n")

            await asyncio.sleep(2)

        # Save raw
        raw_file = output_path / "raw_commentary.json"
        with open(raw_file, 'w', encoding='utf-8') as f:
            json.dump(all_commentary, f, ensure_ascii=False, indent=2)
        logger.info(f"\n💾 Raw: {len(all_commentary)} entries\n")

        # Step 3: Filter
        logger.info("🔍 STEP 3: Quality filtering...")

        unique = QualityFilter.remove_duplicates(all_commentary)
        filtered = QualityFilter.filter_commentary(unique)

        logger.info(f"  After dedup: {len(unique)}")
        logger.info(f"  After filter: {len(filtered)}")

        if len(all_commentary) > 0:
            logger.info(f"  Approval: {len(filtered)/len(all_commentary)*100:.1f}%\n")

        filtered_file = output_path / "filtered_commentary.json"
        with open(filtered_file, 'w', encoding='utf-8') as f:
            json.dump(filtered, f, ensure_ascii=False, indent=2)

        # Step 4: Export JSONL
        logger.info("📤 STEP 4: Exporting to training format...")

        training_data = []
        system_prompt = "Tu es un commentateur sportif professionnel pour Afrique Sports. Tu génères des commentaires de match en français, avec un style vivant, précis et engageant."

        for entry in filtered:
            training_example = {
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Génère un commentaire pour: Minute {entry['time']} - {entry['event_type']}"},
                    {"role": "assistant", "content": entry['text']}
                ]
            }
            training_data.append(training_example)

        training_file = output_path / "training_data.jsonl"
        with open(training_file, 'w', encoding='utf-8') as f:
            for example in training_data:
                f.write(json.dumps(example, ensure_ascii=False) + '\n')

        logger.info(f"✅ Saved {len(training_data)} training examples\n")

        # Stats
        logger.info("=" * 70)
        logger.info("COLLECTION COMPLETE")
        logger.info("=" * 70)
        logger.info(f"Matches scraped: {i}")
        logger.info(f"Raw entries: {len(all_commentary)}")
        logger.info(f"Filtered: {len(filtered)}")
        logger.info(f"Training examples: {len(training_data)}")
        logger.info(f"\nTraining file: {training_file}")
        logger.info("=" * 70)

        return training_file

    finally:
        await scraper.close_session()


if __name__ == '__main__':
    asyncio.run(collect_training_data(
        target_examples=2000,
        output_dir="/workspace/training_data"
    ))
