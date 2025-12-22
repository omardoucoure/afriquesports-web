#!/usr/bin/env python3
"""
Base scraper class for collecting football commentary data
"""

import requests
from bs4 import BeautifulSoup
from typing import List, Dict, Optional
import time
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class BaseScraper:
    """Base class for web scrapers"""

    def __init__(self, base_url: str, delay: float = 1.0):
        """
        Initialize scraper

        Args:
            base_url: Base URL for the website
            delay: Delay between requests in seconds (respect rate limits)
        """
        self.base_url = base_url
        self.delay = delay
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        }
        self.session = requests.Session()
        self.session.headers.update(self.headers)

    def fetch_page(self, url: str, max_retries: int = 3) -> Optional[BeautifulSoup]:
        """
        Fetch and parse a web page

        Args:
            url: URL to fetch
            max_retries: Maximum number of retry attempts

        Returns:
            BeautifulSoup object or None if failed
        """
        for attempt in range(max_retries):
            try:
                logger.info(f"Fetching: {url} (attempt {attempt + 1}/{max_retries})")
                time.sleep(self.delay)  # Respect rate limits

                response = self.session.get(url, timeout=30)
                response.raise_for_status()

                return BeautifulSoup(response.content, 'html.parser')

            except requests.RequestException as e:
                logger.warning(f"Error fetching {url}: {e}")
                if attempt < max_retries - 1:
                    time.sleep(self.delay * 2)  # Back off on retry
                else:
                    logger.error(f"Failed to fetch {url} after {max_retries} attempts")
                    return None

    def extract_commentary(self, soup: BeautifulSoup) -> List[Dict]:
        """
        Extract commentary from page (to be implemented by subclasses)

        Args:
            soup: BeautifulSoup object of the page

        Returns:
            List of commentary dictionaries
        """
        raise NotImplementedError("Subclasses must implement extract_commentary()")

    def scrape_match(self, match_url: str) -> List[Dict]:
        """
        Scrape commentary from a single match

        Args:
            match_url: URL of the match page

        Returns:
            List of commentary events
        """
        soup = self.fetch_page(match_url)
        if not soup:
            return []

        try:
            commentary = self.extract_commentary(soup)
            logger.info(f"Extracted {len(commentary)} commentary events from {match_url}")
            return commentary
        except Exception as e:
            logger.error(f"Error extracting commentary from {match_url}: {e}")
            return []

    def save_commentary(self, commentary: List[Dict], output_file: str):
        """
        Save commentary to JSON file

        Args:
            commentary: List of commentary dictionaries
            output_file: Path to output file
        """
        import json

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(commentary, f, ensure_ascii=False, indent=2)

        logger.info(f"Saved {len(commentary)} commentary events to {output_file}")
