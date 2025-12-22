#!/usr/bin/env python3
"""Debug script to inspect RMC Sport page structure"""

import asyncio
from playwright.async_api import async_playwright


async def debug_page(url: str):
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)  # Show browser
        page = await browser.new_page()

        print(f"Loading: {url}")
        await page.goto(url, wait_until='networkidle', timeout=60000)

        # Wait for content
        await page.wait_for_timeout(5000)

        # Save screenshot
        await page.screenshot(path='data/rmc_screenshot.png', full_page=True)
        print("📸 Screenshot saved to: data/rmc_screenshot.png")

        # Save HTML
        content = await page.content()
        with open('data/rmc_page.html', 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"💾 HTML saved to: data/rmc_page.html ({len(content)} chars)")

        # Try to find live commentary container
        print("\n🔍 Looking for commentary elements...")

        # Check for various possible selectors
        selectors = [
            'div[class*="Live"]',
            'div[class*="comment"]',
            'div[class*="timeline"]',
            'div[data-component*="live"]',
            'div[data-component*="comment"]',
        ]

        for selector in selectors:
            elements = await page.query_selector_all(selector)
            print(f"  {selector}: {len(elements)} found")

            if len(elements) > 0 and len(elements) < 20:
                for i, elem in enumerate(elements[:3], 1):
                    text = await elem.inner_text()
                    print(f"    [{i}] {text[:100]}...")

        # Get all text
        all_text = await page.inner_text('body')
        print(f"\n📝 Total page text: {len(all_text)} chars")

        # Look for timestamps in text
        import re
        timestamps = re.findall(r'\d+[\'′](?:\+\d+)?', all_text)
        print(f"⏱️  Found {len(timestamps)} potential timestamps: {timestamps[:10]}")

        print("\n✋ Browser window open for manual inspection...")
        print("   Press Ctrl+C to close")

        try:
            await asyncio.sleep(300)  # Keep browser open for 5 minutes
        except KeyboardInterrupt:
            print("\n👋 Closing browser...")

        await browser.close()


if __name__ == '__main__':
    import sys
    if len(sys.argv) < 2:
        print("Usage: python debug_rmc_page.py <url>")
        sys.exit(1)

    asyncio.run(debug_page(sys.argv[1]))
