#!/usr/bin/env python3
import requests
from bs4 import BeautifulSoup

url = "https://www.lequipe.fr/Football/match-direct/can/2025/maroc-comores-live/670748"
headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
}

response = requests.get(url, headers=headers)
soup = BeautifulSoup(response.content, 'html.parser')

container = soup.find('div', class_='CommentsLive')
if container:
    events = container.find_all('div', class_='CommentsLive__event')
    
    print(f"Total events: {len(events)}\n")
    
    # Show full HTML of first 5 events
    for i, event in enumerate(events[:5], 1):
        print(f"{'='*70}")
        print(f"EVENT {i} - FULL HTML")
        print(f"{'='*70}")
        print(event.prettify())
        
        # Get all text
        all_text = event.get_text(separator=' ', strip=True)
        print(f"\nALL TEXT: {all_text}")
        print()
