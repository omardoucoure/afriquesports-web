#!/bin/bash
# Test Mistral model quality vs Llama 3.1
# Generates multiple commentaries and compares quality metrics

set -e

SERVER="root@159.223.103.16"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=========================================="
echo "🧪 Testing Mistral Model Quality"
echo "=========================================="
echo ""

# Test prompts covering different event types
declare -a TEST_CASES=(
    "23|goal|Mbappé frappe du gauche, le ballon file dans la lucarne"
    "45|commentary|Fin de la première mi-temps approche"
    "67|substitution|Entrée de Salah à la place de Mané"
    "89|yellow_card|Carton jaune pour Koulibaly après une faute"
    "12|corner|Corner obtenu par le Maroc"
)

echo "Running 5 test generations for each model..."
echo ""

# Create temporary test script
cat > /tmp/test_quality.py << 'EOF'
#!/usr/bin/env python3
import sys
import os
sys.path.append('/root/afcon-agent-temp')

from commentary_generator import CommentaryGenerator
from quality_monitor import ABTestMonitor

# Initialize
gen = CommentaryGenerator()
monitor = ABTestMonitor()

# Parse arguments
minute, event_type, context = sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else ""

# Test both models
print("\n" + "="*70)
print(f"Test Case: Minute {minute}', {event_type}")
print("="*70)

# Test Llama 3.1
print("\n🦙 LLAMA 3.1:")
from model_config import ModelConfig
ModelConfig.switch_model("llama3.1:8b")
result_llama = gen.generate(minute, event_type, context)
monitor.log_metric("llama3.1:8b", result_llama['text'], result_llama['generation_time_ms'])
print(f"Time: {result_llama['generation_time_ms']:.0f}ms")
print(f"Text: {result_llama['text']}")

gen.clear_context()

# Test Mistral
print("\n🚀 MISTRAL COMMENTARY:")
ModelConfig.switch_model("mistral-commentary")
result_mistral = gen.generate(minute, event_type, context)
monitor.log_metric("mistral-commentary", result_mistral['text'], result_mistral['generation_time_ms'])
print(f"Time: {result_mistral['generation_time_ms']:.0f}ms")
print(f"Text: {result_mistral['text']}")

gen.clear_context()

print("\n" + "="*70)
EOF

# Upload test script
scp /tmp/test_quality.py $SERVER:/root/afcon-agent-temp/

# Run tests
for test_case in "${TEST_CASES[@]}"; do
    IFS='|' read -r minute event_type context <<< "$test_case"

    echo "Testing: Minute $minute' - $event_type"
    ssh $SERVER "cd /root/afcon-agent-temp && source venv/bin/activate && python test_quality.py '$minute' '$event_type' '$context'"
    echo ""
done

# Get comparison report
echo "=========================================="
echo "📊 Quality Comparison Report"
echo "=========================================="
echo ""

ssh $SERVER "cd /root/afcon-agent-temp && source venv/bin/activate && python quality_monitor.py report"

echo ""
echo "=========================================="
echo "🎯 Recommendation"
echo "=========================================="
echo ""

ssh $SERVER "cd /root/afcon-agent-temp && source venv/bin/activate && python quality_monitor.py recommendation"

echo ""
echo "✅ Quality testing complete!"
echo ""
echo "Review the metrics above to decide:"
echo "  - If Mistral shows better quality → Enable A/B testing"
echo "  - If Mistral is worse → Stay with Llama 3.1"
echo ""
