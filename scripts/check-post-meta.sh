#!/bin/bash

USERNAME="admin"
APP_PASSWORD="xDuv TVaA oz2W wwDK WFz1 OFsN"
POST_ID="851539"

echo "📋 Fetching current post data..."
echo ""

curl -X GET "https://cms.realdemadrid.com/afriquesports/wp-json/wp/v2/posts/${POST_ID}" \
  -H "Authorization: Basic $(echo -n "${USERNAME}:${APP_PASSWORD}" | base64)" \
  -s | jq .
