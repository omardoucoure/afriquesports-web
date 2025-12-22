#!/bin/bash
# Test Mistral model with realistic match events
# Simulates a live match with various event types

set -e

SERVER="root@159.223.103.16"

echo "=========================================="
echo "⚽ Testing Mistral Model - Live Match Simulation"
echo "=========================================="
echo ""
echo "Match: Morocco vs Senegal (CAN 2025)"
echo "Testing with 10 different events..."
echo ""

# Create test script on server
cat > /tmp/test_match_events.py << 'EOF'
#!/usr/bin/env python3
import sys
import time
sys.path.append('/root/afcon-agent-temp')

from commentary_generator import CommentaryGenerator

# Initialize generator
gen = CommentaryGenerator()

# Test events covering different scenarios
test_events = [
    {
        "minute": "12",
        "type": "commentary",
        "context": "Le Maroc contrôle le ballon au milieu de terrain"
    },
    {
        "minute": "23",
        "type": "goal",
        "context": "Hakimi frappe du droit à 25 mètres, le ballon file dans la lucarne"
    },
    {
        "minute": "34",
        "type": "yellow_card",
        "context": "Koulibaly fait une faute tactique sur Ziyech"
    },
    {
        "minute": "45",
        "type": "commentary",
        "context": "Fin de la première mi-temps approche"
    },
    {
        "minute": "52",
        "type": "substitution",
        "context": "Entrée de Sadio Mané à la place d'Ismaïla Sarr"
    },
    {
        "minute": "67",
        "type": "goal",
        "context": "Mané récupère le ballon, élimine deux défenseurs et frappe du gauche"
    },
    {
        "minute": "73",
        "type": "corner",
        "context": "Corner obtenu par le Sénégal après un bon centre"
    },
    {
        "minute": "81",
        "type": "yellow_card",
        "context": "Amrabat reçoit un carton pour contestation"
    },
    {
        "minute": "89",
        "type": "commentary",
        "context": "Le Maroc cherche l'égalisation dans les dernières minutes"
    },
    {
        "minute": "90+3",
        "type": "goal",
        "context": "En-Nesyri reprend de la tête sur corner, but égalisateur!"
    }
]

print("\n" + "="*70)
print("⚽ MOROCCO vs SENEGAL - Live Commentary Test")
print("="*70)
print()

results = []

for i, event in enumerate(test_events, 1):
    print(f"\n[Event {i}/10] Minute {event['minute']}' - {event['type'].upper()}")
    print("-" * 70)

    start = time.time()
    result = gen.generate(
        minute=event['minute'],
        event_type=event['type'],
        context=event['context']
    )
    elapsed = time.time() - start

    # Display result
    print(f"⏱️  Generation time: {result['generation_time_ms']:.0f}ms")
    print(f"📝 Commentary: {result['text']}")
    print(f"📊 Length: {len(result['text'])} chars, {len(result['text'].split())} words")

    results.append({
        'minute': event['minute'],
        'type': event['type'],
        'text': result['text'],
        'time_ms': result['generation_time_ms'],
        'length': len(result['text'])
    })

    # Small delay between generations
    time.sleep(0.5)

print("\n" + "="*70)
print("📊 QUALITY ANALYSIS")
print("="*70)
print()

# Calculate statistics
total_time = sum(r['time_ms'] for r in results)
avg_time = total_time / len(results)
avg_length = sum(r['length'] for r in results) / len(results)

print(f"Total events: {len(results)}")
print(f"Average generation time: {avg_time:.0f}ms ({avg_time/1000:.1f}s)")
print(f"Average commentary length: {avg_length:.0f} characters")
print(f"Fastest generation: {min(r['time_ms'] for r in results):.0f}ms")
print(f"Slowest generation: {max(r['time_ms'] for r in results):.0f}ms")

# Check for repetition
print()
print("🔍 REPETITION CHECK:")
all_text = ' '.join(r['text'].lower() for r in results)
words = all_text.split()
unique_words = len(set(words))
total_words = len(words)
uniqueness = (unique_words / total_words * 100) if total_words > 0 else 0

print(f"Total words: {total_words}")
print(f"Unique words: {unique_words}")
print(f"Uniqueness: {uniqueness:.1f}%")
print(f"{'✅ Good variety!' if uniqueness > 70 else '⚠️ Some repetition detected'}")

print()
print("="*70)
print("✅ Test Complete!")
print("="*70)
EOF

# Upload and run test
echo "Uploading test script..."
scp /tmp/test_match_events.py $SERVER:/root/afcon-agent-temp/
echo ""

echo "Running match simulation..."
echo ""

ssh $SERVER "cd /root/afcon-agent-temp && source venv/bin/activate && python3 test_match_events.py"

echo ""
echo "=========================================="
echo "Test completed!"
echo "=========================================="
echo ""
