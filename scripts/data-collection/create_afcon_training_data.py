#!/usr/bin/env python3
"""
AFCON 2025 Training Data Generator
Creates high-quality training data based on:
1. Analyzed commentary patterns from existing data
2. AFCON 2025 context (teams, players, matches)
3. French sports commentary style
"""

import json
import random
from pathlib import Path

# AFCON 2025 Teams and Key Players
TEAMS = {
    'Maroc': ['Hakimi', 'Ziyech', 'Mazraoui', 'Brahim Diaz', 'El-Kaabi', 'Ounahi', 'Salah-Eddine'],
    'Sénégal': ['Sadio Mané', 'Idrissa Gueye', 'Kalidou Koulibaly', 'Nicolas Jackson', 'Pape Matar Sarr'],
    'Égypte': ['Mohamed Salah', 'Trezeguet', 'Omar Marmoush', 'Mohamed Elneny'],
    'Nigeria': ['Victor Osimhen', 'Ademola Lookman', 'Alex Iwobi', 'Wilfred Ndidi'],
    'Côte d\'Ivoire': ['Sébastien Haller', 'Nicolas Pépé', 'Franck Kessié', 'Wilfried Singo'],
    'Cameroun': ['Vincent Aboubakar', 'André Onana', 'Zambo Anguissa', 'Bryan Mbeumo'],
    'Algérie': ['Riyad Mahrez', 'Islam Slimani', 'Youcef Belaïli', 'Baghdad Bounedjah'],
    'Ghana': ['Mohammed Kudus', 'Thomas Partey', 'Jordan Ayew', 'Kamaldeen Sulemana'],
    'Tunisie': ['Wahbi Khazri', 'Youssef Msakni', 'Ellyes Skhiri', 'Hannibal Mejbri'],
    'Mali': ['Amadou Haidara', 'Yves Bissouma', 'Adama Traoré', 'Moussa Djenepo'],
}

# Event type distribution (based on analysis)
EVENT_DISTRIBUTION = {
    'commentary': 0.82,
    'goal': 0.10,
    'substitution': 0.055,
    'penalty': 0.012,
    'yellow_card': 0.008,
    'red_card': 0.005,
}

# Commentary patterns by event type
COMMENTARY_PATTERNS = {
    'goal': [
        "{player} ouvre le score d'une frappe magnifique du gauche! Le ballon vient se loger dans la lucarne opposée, le gardien n'a rien pu faire.",
        "But splendide de {player}! Sur un centre parfait de {player2}, il propulse sa tête au fond des filets.",
        "{player} délivre une frappe enroulée du droit! Le ballon trompe le gardien et finit sa course au fond des filets. {team} prend l'avantage!",
        "Quelle action collective! {player2} sert {player} qui contrôle brillamment et ajuste le gardien d'un tir croisé. {team} mène désormais au score!",
        "{player} inscrit son {n}e but en sélection! D'une frappe puissante à l'entrée de la surface, il permet à {team} de doubler la mise.",
        "But contre son camp! Sur un centre tendu de {player}, le défenseur adverse dévie malencontreusement le ballon dans ses propres filets.",
        "{player} ne se fait pas prier! Sur penalty, il envoie le gardien du mauvais côté et ouvre le score pour {team}.",
    ],

    'commentary': [
        "{player} délivre un centre appliqué sortant du pied gauche. {player2} repousse de la tête.",
        "Belle combinaison entre {player} et {player2} sur le flanc droit. Le ballon est finalement récupéré par la défense adverse.",
        "Le ballon circule bien dans le camp de {team}. {player} recherche la profondeur mais le hors-jeu est signalé.",
        "{player} tente une frappe lointaine du gauche. Le ballon file largement au-dessus de la transversale.",
        "Corner exécuté côté gauche par {player}. {player2} se signale avec une reprise de volée qui passe à côté du cadre.",
        "{team} met la pression dans cette fin de première mi-temps. {player} sollicite beaucoup le ballon sur son aile.",
        "Belle intervention défensive de {player} qui intercepte une passe dangereuse dans la surface.",
        "{player} déborde sur le côté droit et centre en retrait pour {player2}, mais le ballon est contré par un défenseur.",
        "Le rythme commence à baisser. Les deux équipes se neutralisent au milieu de terrain.",
        "{player}, auteur d'un très bon match, délivre un centre tendu dans la surface. {player2} ne parvient pas à reprendre le ballon.",
    ],

    'substitution': [
        "{player} est remplacé par {player2}. Ovationné par l'enceinte, il quitte le terrain après une belle prestation.",
        "Double changement pour {team}. {player} cède sa place à {player2}.",
        "Premier changement dans cette rencontre : {player} entre en jeu à la place de {player2}.",
        "{player}, touché à la cuisse, ne peut continuer. {player2} le remplace et va devoir être rapidement opérationnel.",
        "{team} procède à un triple changement. {player}, {player2} et {player3} quittent le terrain.",
    ],

    'yellow_card': [
        "{player} accroche {player2} de manière irrégulière et se fait rappeler à l'ordre par l'arbitre. Carton jaune mérité.",
        "Faute un peu sévère de {player} sur {player2}. L'arbitre sort le carton jaune sans hésiter.",
        "{player} proteste auprès de l'arbitre et écope d'un carton jaune pour contestation.",
        "Tacle par derrière de {player} sur {player2}. Carton jaune logique pour le joueur de {team}.",
    ],

    'red_card': [
        "Carton rouge pour {player}! Expulsion directe suite à un geste dangereux sur {player2}. {team} se retrouve à dix!",
        "{player} reçoit un deuxième carton jaune et doit quitter le terrain. {team} va devoir terminer le match en infériorité numérique.",
    ],

    'penalty': [
        "Pénalty accordé à {team}! {player} a été accroché dans la surface par {player2}. Décision sans contestation.",
        "{player} transforme le penalty! D'une frappe puissante du pied gauche, il trompe le gardien et permet à {team} de prendre l'avantage.",
        "{player} repousse le penalty de {player2}! Quelle parade du gardien qui maintient son équipe dans le match!",
    ],
}

def generate_training_examples(num_examples: int = 2000):
    """Generate training examples based on patterns"""

    examples = []
    system_prompt = "Tu es un commentateur sportif professionnel pour Afrique Sports. Tu génères des commentaires de match de la CAN 2025 en français, avec un style vivant, précis et engageant, similaire à L'Équipe et RMC Sport."

    for i in range(num_examples):
        # Select event type based on distribution
        rand = random.random()
        cumulative = 0
        event_type = 'commentary'

        for et, prob in EVENT_DISTRIBUTION.items():
            cumulative += prob
            if rand <= cumulative:
                event_type = et
                break

        # Select random teams and players
        team1, team2 = random.sample(list(TEAMS.keys()), 2)
        players1 = TEAMS[team1]
        players2 = TEAMS[team2]

        # Select pattern and fill in details
        pattern = random.choice(COMMENTARY_PATTERNS[event_type])

        # Generate minute (weighted towards middle of match)
        minute_ranges = [(1, 15), (16, 30), (31, 45), (46, 60), (61, 75), (76, 90)]
        minute = random.randint(*random.choice(minute_ranges))

        # Add extra time occasionally
        if minute >= 45 and minute <= 46:
            minute = f"45'+{random.randint(1, 4)}"
        elif minute >= 90:
            minute = f"90'+{random.randint(1, 6)}"
        else:
            minute = str(minute)

        # Fill in pattern variables
        text = pattern.format(
            player=random.choice(players1),
            player2=random.choice(players2),
            player3=random.choice(players1),
            team=team1,
            team2=team2,
            n=random.randint(2, 15)
        )

        # Create training example
        example = {
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Génère un commentaire pour: Minute {minute}' - {event_type} - {team1} vs {team2}"},
                {"role": "assistant", "content": text}
            ]
        }

        examples.append(example)

    return examples


def main():
    """Generate and save training data"""

    print("=" * 70)
    print("AFCON 2025 TRAINING DATA GENERATOR")
    print("=" * 70)

    # Generate examples
    print("\nGenerating 2000 training examples...")
    examples = generate_training_examples(2000)

    print(f"✅ Generated {len(examples)} examples")

    # Event type statistics
    event_counts = {}
    for ex in examples:
        user_msg = ex['messages'][1]['content']
        for event_type in EVENT_DISTRIBUTION.keys():
            if event_type in user_msg:
                event_counts[event_type] = event_counts.get(event_type, 0) + 1

    print("\nEvent Type Distribution:")
    for event_type, count in sorted(event_counts.items(), key=lambda x: -x[1]):
        print(f"  {event_type:20s}: {count:4d} ({count/len(examples)*100:.1f}%)")

    # Save to JSONL
    output_file = Path("data/afcon2025_training.jsonl")
    output_file.parent.mkdir(exist_ok=True)

    with open(output_file, 'w', encoding='utf-8') as f:
        for example in examples:
            f.write(json.dumps(example, ensure_ascii=False) + '\n')

    print(f"\n✅ Saved to: {output_file}")

    # Show samples
    print("\n" + "=" * 70)
    print("SAMPLE TRAINING EXAMPLES")
    print("=" * 70)

    for i, example in enumerate(random.sample(examples, 5), 1):
        user_content = example['messages'][1]['content']
        assistant_content = example['messages'][2]['content']

        print(f"\n{i}. {user_content}")
        print(f"   → {assistant_content[:120]}...")

    print("\n" + "=" * 70)
    print("READY FOR FINE-TUNING")
    print("=" * 70)
    print(f"Upload {output_file} to RunPod and run:")
    print("  python runpod_finetuner.py --training-data /workspace/training_data/afcon2025_training.jsonl")
    print("=" * 70 + "\n")


if __name__ == '__main__':
    main()
