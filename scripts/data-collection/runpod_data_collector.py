#!/usr/bin/env python3
"""
RunPod Data Collection Script
Fetches 1000+ French football commentary examples from L'Équipe and RMC Sport
Optimized for running directly on RunPod server with GPU resources

Target: 2000+ high-quality commentary examples for fine-tuning Llama 3.1 70B
"""

import asyncio
import json
import re
import logging
from datetime import datetime
from typing import List, Dict, Optional
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


class LeQuipeCommentaryScraper:
    """Scrapes football commentary from L'Équipe"""

    def __init__(self):
        self.base_url = "https://www.lequipe.fr"
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        }
        self.session = None

    async def init_session(self):
        """Initialize aiohttp session"""
        if not self.session:
            self.session = aiohttp.ClientSession(headers=self.headers)

    async def close_session(self):
        """Close aiohttp session"""
        if self.session:
            await self.session.close()

    async def discover_match_urls(self, max_matches: int = 1000) -> List[str]:
        """
        Discover match URLs from L'Équipe archives

        Args:
            max_matches: Maximum number of matches to discover

        Returns:
            List of match URLs
        """
        await self.init_session()

        logger.info(f"🔍 Discovering up to {max_matches} match URLs from L'Équipe...")

        match_urls = set()

        # Multiple competition endpoints to maximize coverage
        competitions = [
            # African competitions
            ("can", 2025),
            ("can", 2024),
            ("can", 2023),
            ("ligue-champions-afrique", 2024),
            ("ligue-champions-afrique", 2023),

            # French competitions (many African players)
            ("ligue-1", 2024),
            ("ligue-1", 2023),
            ("ligue-2", 2024),
            ("coupe-de-france", 2024),

            # European competitions
            ("ligue-des-champions", 2024),
            ("ligue-des-champions", 2023),
            ("ligue-europa", 2024),

            # World Cup
            ("coupe-du-monde", 2022),
            ("coupe-du-monde-qualifications-afrique", 2024),
        ]

        for competition, year in competitions:
            if len(match_urls) >= max_matches:
                break

            # Try multiple page formats
            for page_num in range(1, 21):  # Up to 20 pages per competition
                if len(match_urls) >= max_matches:
                    break

                try:
                    # L'Équipe calendar/results URL patterns
                    urls_to_try = [
                        f"{self.base_url}/Football/{competition}/page-calendrier-resultats/{year}",
                        f"{self.base_url}/Football/{competition}/page-calendrier-resultats",
                        f"{self.base_url}/Football/{competition}/resultats/{year}",
                    ]

                    for calendar_url in urls_to_try:
                        try:
                            async with self.session.get(calendar_url, timeout=30) as response:
                                if response.status == 200:
                                    html = await response.text()
                                    soup = BeautifulSoup(html, 'lxml')

                                    # Find all match-direct links
                                    for link in soup.find_all('a', href=True):
                                        href = link['href']
                                        if '/match-direct/' in href:
                                            if href.startswith('/'):
                                                full_url = f"{self.base_url}{href}"
                                            else:
                                                full_url = href

                                            match_urls.add(full_url)

                                            if len(match_urls) % 50 == 0:
                                                logger.info(f"  Found {len(match_urls)} matches so far...")

                                    break  # Successfully fetched, move to next

                        except Exception as e:
                            logger.debug(f"Could not fetch {calendar_url}: {e}")
                            continue

                    await asyncio.sleep(1)  # Be polite

                except Exception as e:
                    logger.warning(f"Error processing {competition} {year}: {e}")

        logger.info(f"✅ Discovered {len(match_urls)} unique match URLs")
        return sorted(list(match_urls))[:max_matches]

    async def scrape_match_commentary(self, url: str) -> List[Dict]:
        """
        Scrape commentary from a single match

        Args:
            url: Match URL

        Returns:
            List of commentary entries
        """
        await self.init_session()

        try:
            async with self.session.get(url, timeout=30) as response:
                if response.status != 200:
                    logger.warning(f"HTTP {response.status} for {url}")
                    return []

                html = await response.text()
                soup = BeautifulSoup(html, 'lxml')

                commentary_list = []

                # Try multiple selectors for timeline/commentary
                selectors = [
                    'div.CommentsLive__event',
                    'div[class*="Timeline"]',
                    'div[class*="live-commentary"]',
                    'div[class*="match-event"]',
                ]

                events = []
                for selector in selectors:
                    events = soup.select(selector)
                    if events:
                        break

                if not events:
                    return []

                # Extract match info for context
                match_title = "Unknown Match"
                title_elem = soup.find('h1')
                if title_elem:
                    match_title = title_elem.get_text(strip=True)

                for event in events:
                    try:
                        # Extract time
                        time_elem = (
                            event.select_one('span[class*="time"]') or
                            event.select_one('span[class*="minute"]') or
                            event.select_one('[class*="CommentsLive__time"]')
                        )

                        if not time_elem:
                            continue

                        time_text = time_elem.get_text(strip=True)

                        # Extract text
                        text_elem = (
                            event.select_one('p[class*="text"]') or
                            event.select_one('div[class*="description"]') or
                            event.select_one('p')
                        )

                        if text_elem:
                            # Remove time from text
                            time_elem_copy = event.find(time_elem.name, class_=time_elem.get('class'))
                            if time_elem_copy:
                                time_elem_copy.extract()
                            text = event.get_text(separator=' ', strip=True)
                        else:
                            continue

                        # Clean text
                        text = re.sub(r'\s+', ' ', text).strip()

                        # Skip too short
                        if len(text) < 20:
                            continue

                        # Determine event type
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
                        logger.debug(f"Error parsing event: {e}")
                        continue

                return commentary_list

        except Exception as e:
            logger.error(f"Error scraping {url}: {e}")
            return []

    def _determine_event_type(self, element, text: str) -> str:
        """Determine event type from element and text"""
        text_lower = text.lower()
        html_lower = str(element).lower()

        if any(kw in text_lower or kw in html_lower for kw in ['but', 'goal', '⚽']):
            return 'goal'
        elif any(kw in text_lower or kw in html_lower for kw in ['carton jaune', 'yellow', '🟨']):
            return 'yellow_card'
        elif any(kw in text_lower or kw in html_lower for kw in ['carton rouge', 'red', '🟥']):
            return 'red_card'
        elif any(kw in text_lower or kw in html_lower for kw in ['remplacement', 'substitution', '🔄']):
            return 'substitution'
        elif any(kw in text_lower for kw in ['penalty', 'pénalty']):
            return 'penalty'
        else:
            return 'commentary'


class QualityFilter:
    """Filter and validate commentary quality"""

    FOOTBALL_TERMS = {
        'but', 'goal', 'tir', 'frappe', 'passe', 'dribble', 'corner', 'penalty',
        'carton', 'jaune', 'rouge', 'gardien', 'défenseur', 'milieu', 'attaquant',
        'ballon', 'match', 'équipe', 'joueur', 'arbitre', 'faute', 'hors-jeu',
        'contre', 'attaque', 'défense', 'surface', 'cage', 'filet', 'poteau',
        'transversale', 'centre', 'coup', 'franc', 'sortie', 'rentrée', 'touche'
    }

    @staticmethod
    def filter_commentary(commentary: List[Dict], strict: bool = False) -> List[Dict]:
        """
        Filter commentary for quality

        Args:
            commentary: List of commentary entries
            strict: Use strict filtering criteria

        Returns:
            Filtered commentary list
        """
        filtered = []

        min_length = 60 if strict else 50
        max_length = 400 if strict else 500

        for entry in commentary:
            text = entry['text']

            # Length check
            if len(text) < min_length or len(text) > max_length:
                continue

            # Must contain football vocabulary
            text_lower = text.lower()
            if not any(term in text_lower for term in QualityFilter.FOOTBALL_TERMS):
                continue

            # No bare URLs
            if text.startswith(('http', 'www.')):
                continue

            # Max 3 sentences
            sentence_count = text.count('.') + text.count('!') + text.count('?')
            if sentence_count > 3:
                continue

            # Must contain sufficient letter content
            letter_ratio = sum(c.isalpha() for c in text) / len(text)
            if letter_ratio < 0.5:
                continue

            filtered.append(entry)

        return filtered

    @staticmethod
    def remove_duplicates(commentary: List[Dict]) -> List[Dict]:
        """Remove duplicate commentary based on text similarity"""
        seen_texts = set()
        unique = []

        for entry in commentary:
            # Normalize text for comparison
            normalized = re.sub(r'\s+', ' ', entry['text'].lower().strip())

            if normalized not in seen_texts:
                seen_texts.add(normalized)
                unique.append(entry)

        return unique


async def collect_training_data(
    max_matches: int = 1000,
    target_examples: int = 2000,
    output_dir: str = "/workspace/training_data"
):
    """
    Main data collection function

    Args:
        max_matches: Maximum matches to scrape
        target_examples: Target number of training examples
        output_dir: Output directory for data
    """
    logger.info("=" * 70)
    logger.info("RUNPOD DATA COLLECTION - AFRIQUE SPORTS COMMENTARY")
    logger.info("=" * 70)
    logger.info(f"Target: {target_examples} high-quality French commentary examples")
    logger.info(f"Max matches: {max_matches}")
    logger.info("=" * 70 + "\n")

    # Create output directory
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    # Initialize scraper
    scraper = LeQuipeCommentaryScraper()

    try:
        # Step 1: Discover match URLs
        logger.info("📋 STEP 1: Discovering match URLs...")
        match_urls = await scraper.discover_match_urls(max_matches=max_matches)

        # Save URLs
        urls_file = output_path / "match_urls.json"
        with open(urls_file, 'w', encoding='utf-8') as f:
            json.dump(match_urls, f, ensure_ascii=False, indent=2)
        logger.info(f"💾 Saved {len(match_urls)} URLs to {urls_file}\n")

        # Step 2: Scrape commentary
        logger.info("📝 STEP 2: Scraping commentary from matches...")
        all_commentary = []

        for i, url in enumerate(match_urls, 1):
            if len(all_commentary) >= target_examples:
                logger.info(f"✅ Reached target of {target_examples} examples!")
                break

            logger.info(f"[{i}/{len(match_urls)}] Scraping {url}...")

            commentary = await scraper.scrape_match_commentary(url)

            if commentary:
                logger.info(f"  ✓ Extracted {len(commentary)} entries")
                all_commentary.extend(commentary)
            else:
                logger.info(f"  ⚠️  No commentary found")

            # Save progress every 10 matches
            if i % 10 == 0:
                progress_file = output_path / "raw_commentary_progress.json"
                with open(progress_file, 'w', encoding='utf-8') as f:
                    json.dump(all_commentary, f, ensure_ascii=False, indent=2)
                logger.info(f"  💾 Progress saved: {len(all_commentary)} total entries")

            # Be polite - wait between requests
            await asyncio.sleep(2)

        # Save raw data
        raw_file = output_path / "raw_commentary.json"
        with open(raw_file, 'w', encoding='utf-8') as f:
            json.dump(all_commentary, f, ensure_ascii=False, indent=2)
        logger.info(f"\n💾 Saved {len(all_commentary)} raw entries to {raw_file}\n")

        # Step 3: Quality filtering
        logger.info("🔍 STEP 3: Applying quality filters...")

        # Remove duplicates
        unique_commentary = QualityFilter.remove_duplicates(all_commentary)
        logger.info(f"  After deduplication: {len(unique_commentary)} entries")

        # Apply quality filter
        filtered_commentary = QualityFilter.filter_commentary(unique_commentary)
        logger.info(f"  After quality filter: {len(filtered_commentary)} entries")
        logger.info(f"  Approval rate: {len(filtered_commentary)/len(all_commentary)*100:.1f}%\n")

        # Save filtered data
        filtered_file = output_path / "filtered_commentary.json"
        with open(filtered_file, 'w', encoding='utf-8') as f:
            json.dump(filtered_commentary, f, ensure_ascii=False, indent=2)
        logger.info(f"💾 Saved filtered data to {filtered_file}\n")

        # Step 4: Export to JSONL training format
        logger.info("📤 STEP 4: Exporting to training format...")

        training_data = []
        system_prompt = "Tu es un commentateur sportif professionnel pour Afrique Sports. Tu génères des commentaires de match de football en français, avec un style vivant, précis et engageant, similaire à L'Équipe et RMC Sport."

        for entry in filtered_commentary:
            # Create training example
            user_content = f"Génère un commentaire pour: Minute {entry['time']} - {entry['event_type']}"
            assistant_content = entry['text']

            training_example = {
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content},
                    {"role": "assistant", "content": assistant_content}
                ]
            }

            training_data.append(training_example)

        # Save JSONL
        training_file = output_path / "training_data.jsonl"
        with open(training_file, 'w', encoding='utf-8') as f:
            for example in training_data:
                f.write(json.dumps(example, ensure_ascii=False) + '\n')

        logger.info(f"💾 Saved {len(training_data)} training examples to {training_file}\n")

        # Step 5: Generate statistics
        logger.info("=" * 70)
        logger.info("COLLECTION COMPLETE - STATISTICS")
        logger.info("=" * 70)
        logger.info(f"Total matches scraped: {i}")
        logger.info(f"Raw commentary entries: {len(all_commentary)}")
        logger.info(f"After deduplication: {len(unique_commentary)}")
        logger.info(f"After quality filter: {len(filtered_commentary)}")
        logger.info(f"Training examples: {len(training_data)}")

        # Calculate metrics
        total_chars = sum(len(e['text']) for e in filtered_commentary)
        total_words = sum(len(e['text'].split()) for e in filtered_commentary)

        logger.info(f"\nQuality Metrics:")
        logger.info(f"  Average length: {total_chars/len(filtered_commentary):.0f} chars ({total_words/len(filtered_commentary):.0f} words)")

        # Vocabulary
        all_words = set()
        for entry in filtered_commentary:
            all_words.update(entry['text'].lower().split())
        logger.info(f"  Vocabulary size: {len(all_words)} unique words")

        # Event types
        event_types = {}
        for entry in filtered_commentary:
            et = entry['event_type']
            event_types[et] = event_types.get(et, 0) + 1

        logger.info(f"\nEvent Type Distribution:")
        for event_type, count in sorted(event_types.items(), key=lambda x: -x[1]):
            percentage = count / len(filtered_commentary) * 100
            logger.info(f"  {event_type}: {count} ({percentage:.1f}%)")

        logger.info("\n" + "=" * 70)
        logger.info("NEXT STEP: Fine-tuning")
        logger.info("=" * 70)
        logger.info(f"Training data ready at: {training_file}")
        logger.info("Run: python runpod_finetuner.py")
        logger.info("=" * 70 + "\n")

        return training_file

    finally:
        await scraper.close_session()


if __name__ == '__main__':
    # Run data collection
    asyncio.run(collect_training_data(
        max_matches=1000,
        target_examples=2000,
        output_dir="/workspace/training_data"
    ))
