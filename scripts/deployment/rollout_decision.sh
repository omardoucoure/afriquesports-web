#!/bin/bash
# Make production rollout decision based on A/B test metrics
# Automatically switches to Mistral 100% if metrics are good, or rolls back if bad

set -e

SERVER="root@159.223.103.16"

echo "=========================================="
echo "🎯 Production Rollout Decision"
echo "=========================================="
echo ""

# Create decision script
cat > /tmp/rollout_decision.py << 'EOF'
#!/usr/bin/env python3
import json
from pathlib import Path
from quality_monitor import ABTestMonitor
from model_config import ModelConfig

def make_decision():
    """Analyze metrics and execute rollout decision"""

    monitor = ABTestMonitor()
    recommendation = monitor.get_recommendation()
    report = monitor.get_comparison_report()

    print("=" * 70)
    print("📊 CURRENT METRICS")
    print("=" * 70)
    print()

    mistral = report['mistral-commentary']
    llama = report['llama3.1']

    print(f"Mistral Samples: {mistral['count']}")
    print(f"Llama Samples: {llama['count']}")
    print()
    print(f"Mistral Repetition: {mistral['avg_repetition']:.3f}")
    print(f"Mistral Variance: {mistral['length_variance']:.1f}%")
    print(f"Mistral Gen Time: {mistral['avg_gen_time']:.0f}ms")
    print()

    print("=" * 70)
    print("🎯 DECISION")
    print("=" * 70)
    print()
    print(f"Action: {recommendation['action'].upper()}")
    print(f"Reason: {recommendation['reason']}")
    if 'confidence' in recommendation:
        print(f"Confidence: {recommendation['confidence'].upper()}")
    print()

    action = recommendation['action']

    if action == 'full_rollout':
        print("✅ EXECUTING FULL ROLLOUT TO MISTRAL")
        print()

        # Disable A/B test and switch to Mistral 100%
        config_path = Path("/root/afcon-agent-temp/config/models.json")
        with open(config_path) as f:
            config = json.load(f)

        config['active_model'] = 'mistral-commentary'
        config['ab_test']['enabled'] = False

        with open(config_path, 'w') as f:
            json.dump(config, f, indent=2)

        print("✅ Mistral is now serving 100% of traffic")
        print("✅ A/B testing disabled")
        print()
        print("Mistral is your new production model! 🚀")

    elif action == 'rollback':
        print("⚠️ ROLLING BACK TO LLAMA 3.1")
        print()

        # Disable A/B test and keep Llama
        config_path = Path("/root/afcon-agent-temp/config/models.json")
        with open(config_path) as f:
            config = json.load(f)

        config['active_model'] = 'llama3.1:8b'
        config['ab_test']['enabled'] = False

        with open(config_path, 'w') as f:
            json.dump(config, f, indent=2)

        print("✅ Rolled back to Llama 3.1")
        print("✅ A/B testing disabled")
        print()
        print("Mistral needs more training. Consider:")
        print("  - Collecting more training data")
        print("  - Adjusting model parameters")
        print("  - Using a different fine-tuning approach")

    else:  # continue_testing
        print("⏳ CONTINUING A/B TEST")
        print()
        print("Metrics are inconclusive. Keep collecting data.")
        print()
        print("Current status:")
        print(f"  - Mistral samples: {mistral['count']} (need 20+)")
        print(f"  - Repetition: {mistral['avg_repetition']:.3f} (target < 0.25)")
        print(f"  - Variance: {mistral['length_variance']:.1f}% (target > 15%)")
        print()
        print("Run this script again after more matches are commented.")

    print()
    print("=" * 70)

if __name__ == '__main__':
    import sys

    if '--force-rollout' in sys.argv:
        print("⚠️  FORCING ROLLOUT TO MISTRAL (bypassing metrics)")
        config_path = Path("/root/afcon-agent-temp/config/models.json")
        with open(config_path) as f:
            config = json.load(f)
        config['active_model'] = 'mistral-commentary'
        config['ab_test']['enabled'] = False
        with open(config_path, 'w') as f:
            json.dump(config, f, indent=2)
        print("✅ Mistral is now at 100%")

    elif '--force-rollback' in sys.argv:
        print("⚠️  FORCING ROLLBACK TO LLAMA (bypassing metrics)")
        config_path = Path("/root/afcon-agent-temp/config/models.json")
        with open(config_path) as f:
            config = json.load(f)
        config['active_model'] = 'llama3.1:8b'
        config['ab_test']['enabled'] = False
        with open(config_path, 'w') as f:
            json.dump(config, f, indent=2)
        print("✅ Llama 3.1 is now at 100%")

    else:
        make_decision()
EOF

# Upload and run
scp /tmp/rollout_decision.py $SERVER:/root/afcon-agent-temp/

if [ "$1" == "--force-rollout" ]; then
    echo "⚠️  Forcing rollout to Mistral..."
    ssh $SERVER "cd /root/afcon-agent-temp && source venv/bin/activate && python rollout_decision.py --force-rollout"
elif [ "$1" == "--force-rollback" ]; then
    echo "⚠️  Forcing rollback to Llama..."
    ssh $SERVER "cd /root/afcon-agent-temp && source venv/bin/activate && python rollout_decision.py --force-rollback"
else
    echo "Analyzing metrics and making decision..."
    ssh $SERVER "cd /root/afcon-agent-temp && source venv/bin/activate && python rollout_decision.py"
fi

echo ""
echo "=========================================="
echo ""
echo "Manual override options:"
echo "  ./rollout_decision.sh --force-rollout   # Switch to Mistral 100%"
echo "  ./rollout_decision.sh --force-rollback  # Switch to Llama 100%"
echo ""
