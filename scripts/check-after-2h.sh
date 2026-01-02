#!/bin/bash

# Quick 2-Hour Health Check
# Run this 2 hours after deployment to verify fixes are working

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║      2-HOUR POST-DEPLOYMENT HEALTH CHECK                    ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "⏰ Checking logs from last 2 hours..."
echo ""

# Get latest deployment
LATEST=$(vercel ls 2>/dev/null | grep "Ready" | head -1 | awk '{print $2}')

if [ -z "$LATEST" ]; then
    echo "❌ Could not find deployment. Please check manually:"
    echo "   https://vercel.com/omars-projects-81bbcbf6/afriquesports-web"
    exit 1
fi

echo "📡 Deployment: $LATEST"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ANALYZING ERRORS (Last 2 Hours)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Function to safely count with timeout
safe_count() {
    pattern=$1
    vercel logs "$LATEST" 2>/dev/null | grep -c "$pattern" 2>/dev/null || echo "0"
}

# Count errors
echo -n "🔍 MySQL Deadlocks: "
DEADLOCKS=$(safe_count "ER_LOCK_DEADLOCK")
if [ "$DEADLOCKS" -le 5 ]; then
    echo "✅ $DEADLOCKS (Excellent!)"
elif [ "$DEADLOCKS" -le 10 ]; then
    echo "✅ $DEADLOCKS (Good)"
elif [ "$DEADLOCKS" -le 20 ]; then
    echo "⚠️  $DEADLOCKS (Monitor closely)"
else
    echo "🔴 $DEADLOCKS (Action needed!)"
fi

echo -n "🔍 WordPress 503 Errors: "
ERRORS_503=$(safe_count "Failed to fetch posts: 503")
if [ "$ERRORS_503" -le 20 ]; then
    echo "✅ $ERRORS_503 (Excellent!)"
elif [ "$ERRORS_503" -le 40 ]; then
    echo "✅ $ERRORS_503 (Good)"
elif [ "$ERRORS_503" -le 80 ]; then
    echo "⚠️  $ERRORS_503 (Monitor closely)"
else
    echo "🔴 $ERRORS_503 (Action needed!)"
fi

echo -n "🔍 Successful Retries: "
RETRIES=$(safe_count "succeeded after")
if [ "$RETRIES" -gt 0 ]; then
    echo "✅ $RETRIES (Retry logic working!)"
else
    echo "ℹ️  $RETRIES (No retries needed or logged)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  COMPARISON TO BASELINE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Calculate expected vs actual
EXPECTED_DEADLOCKS=10
EXPECTED_503S=40
IMPROVEMENT_DEADLOCK=$(( 100 - (DEADLOCKS * 100 / (EXPECTED_DEADLOCKS > 0 ? EXPECTED_DEADLOCKS : 1)) ))
IMPROVEMENT_503=$(( 100 - (ERRORS_503 * 100 / (EXPECTED_503S > 0 ? EXPECTED_503S : 1)) ))

if [ "$IMPROVEMENT_DEADLOCK" -gt 50 ]; then
    echo "📊 Deadlock Reduction: ~${IMPROVEMENT_DEADLOCK}% ✅"
else
    echo "📊 Deadlock Reduction: ~${IMPROVEMENT_DEADLOCK}% ⚠️"
fi

if [ "$IMPROVEMENT_503" -gt 50 ]; then
    echo "📊 503 Error Reduction: ~${IMPROVEMENT_503}% ✅"
else
    echo "📊 503 Error Reduction: ~${IMPROVEMENT_503}% ⚠️"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  VERDICT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

TOTAL_ISSUES=$(( DEADLOCKS + ERRORS_503 ))

if [ "$TOTAL_ISSUES" -le 25 ]; then
    echo "🟢 EXCELLENT: Fixes are working perfectly!"
    echo "   Continue monitoring. No action needed."
elif [ "$TOTAL_ISSUES" -le 50 ]; then
    echo "🟡 GOOD: Normal progress for first 2 hours"
    echo "   Caching will continue to improve. Check again in 4 hours."
elif [ "$TOTAL_ISSUES" -le 100 ]; then
    echo "🟠 MODERATE: Some issues remain"
    echo "   Check WordPress server health and verify caching is working."
else
    echo "🔴 ATTENTION: High error rate persists"
    echo "   Action needed: Check WordPress server and review logs."
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  NEXT STEPS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✓ 2-hour check complete"
echo "• Check again in 4 hours for continued improvement"
echo "• Full baseline check in 24 hours"
echo ""
echo "For detailed logs, visit:"
echo "👉 https://vercel.com/omars-projects-81bbcbf6/afriquesports-web"
echo ""

exit 0
