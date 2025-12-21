#!/bin/bash

echo "🧪 Testing Live Commentary Feature..."
echo ""
echo "This will add 3 sample commentary events to your database"
echo ""

# Generate a unique match ID for testing
MATCH_ID="test_match_$(date +%s)"

echo "📊 Match ID: $MATCH_ID"
echo ""

# Event 1: Goal
echo "1️⃣ Adding goal at 23'..."
curl -X POST http://localhost:3000/api/can2025/live-commentary \
  -H "x-webhook-secret: test-secret" \
  -H "Content-Type: application/json" \
  -d "{
    \"match_id\": \"$MATCH_ID\",
    \"event_id\": \"${MATCH_ID}_goal_23\",
    \"time\": \"23'\",
    \"time_seconds\": 1380,
    \"locale\": \"fr\",
    \"text\": \"⚽ BUT! Achraf Hakimi ouvre le score pour le Maroc avec une frappe puissante depuis l'extérieur de la surface! Le gardien comorien n'a rien pu faire.\",
    \"type\": \"goal\",
    \"team\": \"Maroc\",
    \"player_name\": \"Achraf Hakimi\",
    \"icon\": \"⚽\",
    \"is_scoring\": true,
    \"confidence\": 0.95
  }" \
  -s | jq '.'

echo ""
echo ""

# Event 2: Yellow card
echo "2️⃣ Adding yellow card at 45'+2..."
curl -X POST http://localhost:3000/api/can2025/live-commentary \
  -H "x-webhook-secret: test-secret" \
  -H "Content-Type: application/json" \
  -d "{
    \"match_id\": \"$MATCH_ID\",
    \"event_id\": \"${MATCH_ID}_yellow_45\",
    \"time\": \"45'+2\",
    \"time_seconds\": 2820,
    \"locale\": \"fr\",
    \"text\": \"🟨 Carton jaune pour Boudrika des Comores! Faute tactique pour stopper la contre-attaque marocaine.\",
    \"type\": \"yellow_card\",
    \"team\": \"Comores\",
    \"player_name\": \"Boudrika\",
    \"icon\": \"🟨\",
    \"is_scoring\": false,
    \"confidence\": 1.0
  }" \
  -s | jq '.'

echo ""
echo ""

# Event 3: Second goal
echo "3️⃣ Adding second goal at 67'..."
curl -X POST http://localhost:3000/api/can2025/live-commentary \
  -H "x-webhook-secret: test-secret" \
  -H "Content-Type: application/json" \
  -d "{
    \"match_id\": \"$MATCH_ID\",
    \"event_id\": \"${MATCH_ID}_goal_67\",
    \"time\": \"67'\",
    \"time_seconds\": 4020,
    \"locale\": \"fr\",
    \"text\": \"⚽⚽ DOUBLÉ! Youssef En-Nesyri inscrit le deuxième but marocain d'une belle tête sur corner! Le Maroc prend le large.\",
    \"type\": \"goal\",
    \"team\": \"Maroc\",
    \"player_name\": \"Youssef En-Nesyri\",
    \"icon\": \"⚽\",
    \"is_scoring\": true,
    \"confidence\": 0.98
  }" \
  -s | jq '.'

echo ""
echo ""
echo "✅ Done! 3 events added to match: $MATCH_ID"
echo ""
echo "📋 To view the commentary, visit:"
echo "   http://localhost:3000/api/can2025/live-commentary?match_id=$MATCH_ID&locale=fr"
echo ""
echo "🌐 The component won't show on /can-2025 page because there's no live ESPN match."
echo "   But you can see the data in the API response above!"
echo ""
