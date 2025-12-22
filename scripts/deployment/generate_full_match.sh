#!/bin/bash
# Generate full match commentary for Mali vs Zambia (1-1)
# Based on actual match statistics

set -e

SERVER="root@159.223.103.16"

echo "=========================================="
echo "⚽ FULL MATCH COMMENTARY GENERATION"
echo "=========================================="
echo ""
echo "Match: Mali vs Zambia (CAN 2025)"
echo "Final Score: 1-1"
echo ""
echo "Generating commentary for 18 key events..."
echo "This will take ~5-10 minutes due to generation speed"
echo ""

# Create full match generation script
cat > /tmp/generate_full_match.py << 'EOF'
#!/usr/bin/env python3
import sys
import time
sys.path.append('/root/afcon-agent-temp')

from commentary_generator import CommentaryGenerator

# Initialize generator
gen = CommentaryGenerator()

# Realistic match events based on Mali vs Zambia 1-1
# Mali: 52.9% possession, 15 shots (5 on target), 1 yellow
# Zambia: 47.1% possession, 7 shots (2 on target), 1 yellow
match_events = [
    {
        "minute": "3",
        "type": "commentary",
        "context": "Le Mali démarre fort avec une bonne possession de balle"
    },
    {
        "minute": "12",
        "type": "corner",
        "context": "Corner obtenu par le Mali après une belle combinaison"
    },
    {
        "minute": "18",
        "type": "commentary",
        "context": "Occasion pour le Mali, frappe de l'extérieur de la surface"
    },
    {
        "minute": "23",
        "type": "goal",
        "context": "But pour le Mali! Bissouma ouvre le score d'une frappe puissante du droit"
    },
    {
        "minute": "27",
        "type": "commentary",
        "context": "La Zambie réagit et monte en pression"
    },
    {
        "minute": "34",
        "type": "yellow_card",
        "context": "Carton jaune pour Haidara (Mali) après une faute sur Musonda"
    },
    {
        "minute": "39",
        "type": "commentary",
        "context": "Le Mali contrôle bien le match avec 55% de possession"
    },
    {
        "minute": "45+1",
        "type": "commentary",
        "context": "Fin de la première mi-temps, le Mali mène 1-0"
    },
    {
        "minute": "47",
        "type": "commentary",
        "context": "Reprise de la deuxième mi-temps"
    },
    {
        "minute": "52",
        "type": "substitution",
        "context": "Changement pour la Zambie: Chama entre à la place de Mwepu"
    },
    {
        "minute": "58",
        "type": "commentary",
        "context": "La Zambie pousse pour égaliser, belle phase de jeu"
    },
    {
        "minute": "64",
        "type": "goal",
        "context": "Égalisation de la Zambie! Daka reprend de la tête sur corner, 1-1!"
    },
    {
        "minute": "69",
        "type": "yellow_card",
        "context": "Carton jaune pour Banda (Zambie) pour contestation"
    },
    {
        "minute": "74",
        "type": "substitution",
        "context": "Double changement pour le Mali: Koné et Traoré entrent"
    },
    {
        "minute": "80",
        "type": "commentary",
        "context": "Match très serré, les deux équipes se cherchent"
    },
    {
        "minute": "85",
        "type": "corner",
        "context": "Corner pour le Mali, occasion de prendre l'avantage"
    },
    {
        "minute": "89",
        "type": "commentary",
        "context": "Dernières minutes, le Mali cherche la victoire"
    },
    {
        "minute": "90+3",
        "type": "commentary",
        "context": "Coup de sifflet final, match nul 1-1"
    }
]

print("\n" + "="*80)
print("⚽ MALI 1-1 ZAMBIE - Commentaire intégral généré par IA")
print("   CAN 2025 - Stade Mohamed V, Casablanca")
print("="*80)
print()

all_commentaries = []
total_start = time.time()

for i, event in enumerate(match_events, 1):
    minute_display = event['minute'].replace('+', ' +')
    event_icon = {
        'goal': '⚽',
        'yellow_card': '🟨',
        'red_card': '🟥',
        'substitution': '🔄',
        'corner': '🚩',
        'commentary': '📝'
    }.get(event['type'], '•')

    print(f"\n{event_icon} [{i}/18] Minute {minute_display}'")
    print("-" * 80)

    start = time.time()
    result = gen.generate(
        minute=event['minute'],
        event_type=event['type'],
        context=event['context']
    )
    elapsed = time.time() - start

    commentary_text = result['text']

    # Display with formatting
    print(f"⏱️  {result['generation_time_ms']/1000:.1f}s | {len(commentary_text)} caractères | {len(commentary_text.split())} mots")
    print()
    print(f"   {commentary_text}")

    all_commentaries.append({
        'minute': event['minute'],
        'type': event['type'],
        'icon': event_icon,
        'text': commentary_text,
        'time': result['generation_time_ms']
    })

    # Small delay between generations
    time.sleep(0.3)

total_elapsed = time.time() - total_start

print("\n" + "="*80)
print("📊 ANALYSE DE QUALITÉ")
print("="*80)
print()

# Statistics
total_time = sum(c['time'] for c in all_commentaries)
avg_time = total_time / len(all_commentaries)
total_chars = sum(len(c['text']) for c in all_commentaries)
total_words = sum(len(c['text'].split()) for c in all_commentaries)

print(f"⏱️  Temps total: {total_elapsed/60:.1f} minutes")
print(f"⏱️  Temps moyen par commentaire: {avg_time/1000:.1f}s")
print(f"📊 Total: {len(all_commentaries)} commentaires générés")
print(f"📝 Longueur moyenne: {total_chars/len(all_commentaries):.0f} caractères")
print(f"📝 Mots totaux: {total_words}")
print()

# Vocabulary analysis
all_text = ' '.join(c['text'].lower() for c in all_commentaries)
words = all_text.split()
unique_words = len(set(words))
uniqueness = (unique_words / len(words) * 100) if words else 0

print("🔍 ANALYSE VOCABULAIRE:")
print(f"   Mots uniques: {unique_words}/{len(words)}")
print(f"   Diversité: {uniqueness:.1f}%")
print(f"   {'✅ Excellente variété!' if uniqueness > 70 else '⚠️ Répétitions détectées'}")
print()

# Display full match summary
print("="*80)
print("📋 RÉSUMÉ CHRONOLOGIQUE DU MATCH")
print("="*80)
print()

for c in all_commentaries:
    minute_display = c['minute'].replace('+', ' +')
    print(f"{c['icon']} {minute_display.rjust(5)}' │ {c['text']}")

print()
print("="*80)
print("✅ Génération terminée!")
print("="*80)
print()
print("Ce commentaire a été généré automatiquement par le modèle")
print("Mistral 7B fine-tuné sur 255 exemples de L'Équipe")
print()
EOF

# Upload and run
echo "Téléchargement du script sur le serveur..."
scp /tmp/generate_full_match.py $SERVER:/root/afcon-agent-temp/
echo ""

echo "⏳ Génération en cours (cela prendra 5-10 minutes)..."
echo ""

ssh $SERVER "cd /root/afcon-agent-temp && source venv/bin/activate && python3 generate_full_match.py"

echo ""
echo "=========================================="
echo "✅ Match complet généré!"
echo "=========================================="
echo ""
