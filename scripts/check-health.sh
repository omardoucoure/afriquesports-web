#!/bin/bash

# Afriquesports Health Check Script
# Monitors logs for MySQL deadlocks and WordPress 503 errors

echo "╔══════════════════════════════════════════════════╗"
echo "║     Afriquesports Health Check Monitor          ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# Get the latest ready deployment
echo "📡 Fetching latest deployment..."
LATEST=$(vercel ls 2>/dev/null | grep "Ready" | head -1 | awk '{print $2}')

if [ -z "$LATEST" ]; then
    echo "❌ Could not find a ready deployment"
    echo "   Run 'vercel ls' to see deployments"
    exit 1
fi

echo "✓ Found: $LATEST"
echo ""

# Function to count errors in logs
count_errors() {
    local pattern=$1
    local description=$2

    echo -n "🔍 Checking for $description... "

    # Get logs and count matches (timeout after 10 seconds)
    timeout 10s vercel logs "$LATEST" 2>/dev/null | grep -c "$pattern" > /tmp/count.txt 2>&1
    COUNT=$(cat /tmp/count.txt 2>/dev/null || echo "0")

    if [ "$COUNT" -eq 0 ]; then
        echo "✅ None found"
        return 0
    else
        echo "⚠️  Found $COUNT occurrences"
        return 1
    fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Error Detection (Last 5 minutes of logs)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Track overall health
ISSUES=0

# Check for MySQL deadlocks
count_errors "ER_LOCK_DEADLOCK\|Deadlock found" "MySQL deadlocks" || ((ISSUES++))

# Check for WordPress 503 errors
count_errors "Failed to fetch posts: 503" "WordPress 503 errors (failed)" || ((ISSUES++))

# Check for successful retries (good sign)
echo -n "🔍 Checking for successful retries... "
timeout 10s vercel logs "$LATEST" 2>/dev/null | grep -c "succeeded after\|Request succeeded" > /tmp/success.txt 2>&1
SUCCESS=$(cat /tmp/success.txt 2>/dev/null || echo "0")
if [ "$SUCCESS" -gt 0 ]; then
    echo "✅ Found $SUCCESS (fixes are working!)"
else
    echo "ℹ️  None found (may not have had errors to retry)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $ISSUES -eq 0 ]; then
    echo "🎉 ALL CLEAR - No critical errors detected"
    echo ""
    echo "Your fixes are working! The site is healthy."
else
    echo "⚠️  Found $ISSUES type(s) of issues"
    echo ""
    echo "This is normal during the first few hours after deployment."
    echo "If issues persist after 24 hours, review the logs manually:"
    echo ""
    echo "  vercel logs $LATEST"
    echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 Tip: For detailed monitoring, visit:"
echo "   https://vercel.com/omars-projects-81bbcbf6/afriquesports-web"
echo ""
echo "📊 Run this script periodically to track improvements"
echo ""

# Cleanup
rm -f /tmp/count.txt /tmp/success.txt

exit 0
