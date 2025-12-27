#!/bin/bash

# Vercel Cron Runner Script
# Runs on WordPress server (159.223.103.16) to avoid Vercel cron costs
#
# This script calls Vercel API endpoints that were previously triggered by Vercel crons.
# By running crons here (on already-paid-for server), we avoid Vercel's per-invocation charges.
#
# Estimated monthly savings: $50-100
#
# Installation:
# 1. Upload to WordPress server: /var/www/scripts/vercel-cron-runner.sh
# 2. Make executable: chmod +x /var/www/scripts/vercel-cron-runner.sh
# 3. Add to crontab (see crontab examples below)

SITE_URL="https://www.afriquesports.net"
CRON_SECRET="${CRON_SECRET:-}"
LOG_FILE="/var/log/vercel-crons.log"

# Function to call Vercel API endpoint
call_endpoint() {
    local endpoint=$1
    local description=$2

    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Calling $description..." | tee -a "$LOG_FILE"

    response=$(curl -s -w "\n%{http_code}" \
        -X GET \
        -H "Authorization: Bearer ${CRON_SECRET}" \
        "${SITE_URL}${endpoint}")

    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | head -n -1)

    if [ "$http_code" -eq 200 ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ Success: $description" | tee -a "$LOG_FILE"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ Failed: $description (HTTP $http_code)" | tee -a "$LOG_FILE"
        echo "$body"
    fi

    echo "" | tee -a "$LOG_FILE"
}

# Parse command line arguments
case "$1" in
    monitor-matches)
        call_endpoint "/api/cron/monitor-matches" "Monitor Matches"
        ;;

    preindex-matches)
        call_endpoint "/api/cron/preindex-matches" "Pre-Index Matches"
        ;;

    index-upcoming-matches)
        call_endpoint "/api/cron/index-upcoming-matches" "Index Upcoming Matches"
        ;;

    seo-realtime)
        call_endpoint "/api/cron/seo-realtime" "SEO Realtime Check"
        ;;

    seo-agent)
        call_endpoint "/api/cron/seo-agent" "SEO Agent Daily Run"
        ;;

    seo-report)
        call_endpoint "/api/cron/seo-report" "SEO Weekly Report"
        ;;

    *)
        echo "Usage: $0 {monitor-matches|preindex-matches|index-upcoming-matches|seo-realtime|seo-agent|seo-report}"
        exit 1
        ;;
esac
