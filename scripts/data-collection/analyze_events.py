#!/usr/bin/env python3
import requests
from bs4 import BeautifulSoup

url = "https://www.lequipe.fr/Football/match-direct/can/2025/maroc-comores-live/670748"
headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
}

response = requests.get(url, headers=headers)
soup = BeautifulSoup(response.content, 'html.parser')

# Find CommentsLive container
container = soup.find('div', class_='CommentsLive')
if container:
    print("✓ Found CommentsLive container")
    
    # Find all events
    events = container.find_all('div', class_='CommentsLive__event')
    print(f"✓ Found {len(events)} events\n")
    
    # Analyze first 3 events
    for i, event in enumerate(events[:3], 1):
        print(f"{'='*70}")
        print(f"EVENT {i}")
        print(f"{'='*70}")
        
        # Find time
        time_elem = event.find(class_=lambda x: x and 'time' in x.lower() if x else False)
        if not time_elem:
            time_elem = event.find('time')
        if not time_elem:
            # Try to find any element with numbers followed by '
            for elem in event.find_all():
                text = elem.get_text(strip=True)
                if "'" in text and text[0].isdigit():
                    time_elem = elem
                    break
        
        print(f"Time element: {time_elem}")
        if time_elem:
            print(f"Time text: {time_elem.get_text(strip=True)}")
        
        # Find text content
        text_elem = event.find('p')
        if not text_elem:
            text_elem = event.find(class_=lambda x: x and 'text' in x.lower() if x else False)
        
        print(f"\nText element: {text_elem}")
        if text_elem:
            print(f"Text: {text_elem.get_text(strip=True)}")
        
        # Show all classes
        print(f"\nEvent classes: {event.get('class')}")
        
        # Show inner structure
        print(f"\nInner HTML (first 200 chars):")
        print(str(event)[:200] + "...")
        print()
else:
    print("✗ CommentsLive container not found")
