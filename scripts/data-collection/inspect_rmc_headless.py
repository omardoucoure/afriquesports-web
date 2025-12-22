#!/usr/bin/env python3
"""Inspect RMC page structure (headless)"""

import asyncio
import re
from playwright.async_api import async_playwright


async def inspect_page(url: str):
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        print(f"Loading: {url}\n")
        await page.goto(url, wait_until='networkidle', timeout=60000)
        await page.wait_for_timeout(5000)

        # Save HTML
        content = await page.content()
        with open('data/rmc_page.html', 'w', encoding='utf-8') as f:
            f.write(content)

        print(f"💾 HTML saved ({len(content)} chars)\n")

        # Get visible text
        all_text = await page.inner_text('body')

        # Find timestamps
        timestamps = re.findall(r'(\d+[\'′])\s*[-–]\s*([^\n]{20,200})', all_text)

        print(f"⏱️  Found {len(timestamps)} potential commentary entries:\n")

        for i, (time, text) in enumerate(timestamps[:10], 1):
            print(f"{i}. {time} - {text[:80]}...")

        # Save text
        with open('data/rmc_text.txt', 'w', encoding='utf-8') as f:
            f.write(all_text)

        print(f"\n💾 Full text saved to: data/rmc_text.txt")

        await browser.close()


if __name__ == '__main__':
    import sys
    url = sys.argv[1] if len(sys.argv) > 1 else "https://rmcsport.bfmtv.com/football/coupe-de-france/direct-coupe-de-france-suivez-l-entree-en-lice-de-l-om-face-a-bourg-peronnas-en-live_LS-202512210210.html"
    asyncio.run(inspect_page(url))
