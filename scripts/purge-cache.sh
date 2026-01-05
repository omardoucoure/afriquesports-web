#!/bin/bash

ZONE_ID="365f8911648aba12c1ba603742fe59ec"
API_TOKEN="TjjWHPWguxBRcuBQh9khoMwWEESdGobAgY5s_szf"
URL="https://www.afriquesports.net/classement/top-10-des-milieux-de-terrain-en-2025-pedri-neves-vitinha-le-classement-choc"

echo "🔄 Purging Cloudflare cache for:"
echo "   $URL"
echo ""

curl -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data "{\"files\":[\"${URL}\"]}" \
  -s | jq .

echo ""
echo "✅ Cache purge request sent!"
