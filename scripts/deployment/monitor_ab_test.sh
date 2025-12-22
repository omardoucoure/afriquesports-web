#!/bin/bash
# Monitor A/B test metrics in real-time
# Shows comparison between Llama 3.1 and Mistral

set -e

SERVER="root@159.223.103.16"

echo "=========================================="
echo "📊 A/B Test Monitoring Dashboard"
echo "=========================================="
echo ""

# Create monitoring script
cat > /tmp/monitor_dashboard.py << 'EOF'
#!/usr/bin/env python3
import json
import time
from datetime import datetime
from pathlib import Path
from quality_monitor import ABTestMonitor

def display_dashboard():
    """Display real-time A/B test metrics"""

    monitor = ABTestMonitor()
    report = monitor.get_comparison_report()
    recommendation = monitor.get_recommendation()

    # Clear screen
    print("\033[2J\033[H")

    print("=" * 80)
    print(f"📊 A/B TEST DASHBOARD - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)
    print()

    # Overall stats
    print(f"Total Samples: {report['total_samples']}")
    print()

    # Llama 3.1 stats
    llama = report['llama3.1']
    print("🦙 LLAMA 3.1 (Control)")
    print("-" * 40)
    print(f"  Samples: {llama['count']}")
    print(f"  Avg Repetition: {llama['avg_repetition']:.3f} {'✅' if llama['avg_repetition'] < 0.25 else '⚠️'}")
    print(f"  Length Variance: {llama['length_variance']:.1f}% {'✅' if llama['length_variance'] > 15 else '⚠️'}")
    print(f"  Avg Length: {llama['avg_length']:.0f} chars")
    print(f"  Avg Gen Time: {llama['avg_gen_time']:.0f}ms")
    print()

    # Mistral stats
    mistral = report['mistral-commentary']
    print("🚀 MISTRAL COMMENTARY (Variant)")
    print("-" * 40)
    print(f"  Samples: {mistral['count']}")
    print(f"  Avg Repetition: {mistral['avg_repetition']:.3f} {'✅' if mistral['avg_repetition'] < 0.25 else '⚠️'}")
    print(f"  Length Variance: {mistral['length_variance']:.1f}% {'✅' if mistral['length_variance'] > 15 else '⚠️'}")
    print(f"  Avg Length: {mistral['avg_length']:.0f} chars")
    print(f"  Avg Gen Time: {mistral['avg_gen_time']:.0f}ms")
    print()

    # Winner comparison
    print("🏆 COMPARISON")
    print("-" * 40)

    if llama['count'] > 0 and mistral['count'] > 0:
        rep_diff = ((mistral['avg_repetition'] - llama['avg_repetition']) / llama['avg_repetition'] * 100) if llama['avg_repetition'] > 0 else 0
        var_diff = mistral['length_variance'] - llama['length_variance']
        time_diff = ((mistral['avg_gen_time'] - llama['avg_gen_time']) / llama['avg_gen_time'] * 100) if llama['avg_gen_time'] > 0 else 0

        print(f"  Repetition: {rep_diff:+.1f}% {'🟢 Better' if rep_diff < 0 else '🔴 Worse'}")
        print(f"  Variance: {var_diff:+.1f}% {'🟢 Better' if var_diff > 0 else '🔴 Worse'}")
        print(f"  Gen Time: {time_diff:+.1f}% {'🟢 Faster' if time_diff < 0 else '⚠️ Slower'}")
    else:
        print("  Not enough data for comparison")

    print()

    # Recommendation
    print("🎯 RECOMMENDATION")
    print("-" * 40)
    print(f"  Action: {recommendation['action'].upper()}")
    print(f"  Reason: {recommendation['reason']}")
    if 'confidence' in recommendation:
        print(f"  Confidence: {recommendation['confidence'].upper()}")
    print()

    # Success criteria
    print("✅ SUCCESS CRITERIA")
    print("-" * 40)
    print(f"  {'✅' if mistral['count'] >= 20 else '⏳'} Minimum 20 samples (current: {mistral['count']})")
    print(f"  {'✅' if mistral['avg_repetition'] < 0.25 else '❌'} Repetition < 0.25 (current: {mistral['avg_repetition']:.3f})")
    print(f"  {'✅' if mistral['length_variance'] > 15 else '❌'} Variance > 15% (current: {mistral['length_variance']:.1f}%)")
    print(f"  {'✅' if mistral['avg_gen_time'] < 10000 else '❌'} Gen time < 10s (current: {mistral['avg_gen_time']/1000:.1f}s)")
    print()

    print("=" * 80)
    print()
    print("Press Ctrl+C to exit")

if __name__ == '__main__':
    import sys

    if '--watch' in sys.argv:
        # Continuous monitoring mode
        try:
            while True:
                display_dashboard()
                time.sleep(10)  # Refresh every 10 seconds
        except KeyboardInterrupt:
            print("\n\nMonitoring stopped.")
    else:
        # Single snapshot
        display_dashboard()
EOF

# Upload and run
scp /tmp/monitor_dashboard.py $SERVER:/root/afcon-agent-temp/

# Ask user if they want continuous monitoring or snapshot
if [ "$1" == "--watch" ]; then
    echo "Starting continuous monitoring (refreshes every 10 seconds)..."
    echo "Press Ctrl+C to stop"
    echo ""
    ssh -t $SERVER "cd /root/afcon-agent-temp && source venv/bin/activate && python monitor_dashboard.py --watch"
else
    echo "Fetching current metrics snapshot..."
    echo ""
    ssh $SERVER "cd /root/afcon-agent-temp && source venv/bin/activate && python monitor_dashboard.py"
    echo ""
    echo "To enable continuous monitoring, run: ./monitor_ab_test.sh --watch"
fi
