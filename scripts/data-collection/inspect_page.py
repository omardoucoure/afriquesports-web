#!/usr/bin/env python3
import requests
from bs4 import BeautifulSoup

url = "https://www.lequipe.fr/Football/match-direct/can/2025/maroc-comores-live/670748"
headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
}

response = requests.get(url, headers=headers)
soup = BeautifulSoup(response.content, 'html.parser')

# Save full HTML for inspection
with open('page_source.html', 'w', encoding='utf-8') as f:
    f.write(soup.prettify())

# Look for common commentary containers
print("Looking for timeline/commentary containers...")
print("\nSearching for divs with 'timeline' in class:")
timeline_divs = soup.find_all('div', class_=lambda x: x and 'timeline' in x.lower())
print(f"Found {len(timeline_divs)} divs")
for div in timeline_divs[:3]:
    print(f"  - {div.get('class')}")

print("\nSearching for divs with 'live' in class:")
live_divs = soup.find_all('div', class_=lambda x: x and 'live' in x.lower())
print(f"Found {len(live_divs)} divs")
for div in live_divs[:3]:
    print(f"  - {div.get('class')}")

print("\nSearching for divs with 'comment' in class:")
comment_divs = soup.find_all('div', class_=lambda x: x and 'comment' in x.lower())
print(f"Found {len(comment_divs)} divs")
for div in comment_divs[:3]:
    print(f"  - {div.get('class')}")

print("\nSearching for article tags:")
articles = soup.find_all('article')
print(f"Found {len(articles)} article tags")
for article in articles[:3]:
    print(f"  - {article.get('class')}")

print("\nPage title:", soup.title.string if soup.title else "No title")
print(f"\nFull HTML saved to: page_source.html")
