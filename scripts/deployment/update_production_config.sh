#!/bin/bash
# Update production configuration to use Mistral commentary model
# This sets Mistral as the active model for live commentary generation

set -e

SERVER="root@159.223.103.16"

echo "=========================================="
echo "⚙️  Updating Production Configuration"
echo "=========================================="
echo ""

# Create configuration update script
cat > /tmp/update_config.py << 'EOF'
#!/usr/bin/env python3
import json
from pathlib import Path
from datetime import datetime

CONFIG_PATH = Path("/root/afcon-agent-temp/config/models.json")

# Read current config
with open(CONFIG_PATH) as f:
    config = json.load(f)

# Update to use Mistral as active model
config.update({
    "active_model": "mistral-commentary",
    "switched_at": datetime.utcnow().isoformat(),
    "previous_model": config.get("active_model", "llama3.1:8b"),
    "models": {
        "mistral-commentary": {
            "temperature": 0.9,
            "top_p": 0.95,
            "top_k": 50,
            "repeat_penalty": 1.15,
            "num_predict": 120,
            "context_window": 512,
            "quantization": "Q4_K_M",
            "size_gb": 4.5
        }
    },
    "ab_test": {
        "enabled": False,
        "note": "Using fine-tuned Mistral 100%"
    }
})

# Save updated config
with open(CONFIG_PATH, 'w') as f:
    json.dump(config, f, indent=2)

print("✅ Configuration updated!")
print()
print("Active model: mistral-commentary")
print("Previous model:", config.get("previous_model"))
print("Switched at:", config["switched_at"])
EOF

# Upload and execute
echo "📋 Step 1: Uploading configuration update script..."
scp /tmp/update_config.py $SERVER:/root/afcon-agent-temp/
echo "✅ Script uploaded"
echo ""

echo "📋 Step 2: Updating configuration..."
ssh $SERVER "cd /root/afcon-agent-temp && python3 update_config.py"
echo ""

echo "📋 Step 3: Verifying configuration..."
ssh $SERVER "cat /root/afcon-agent-temp/config/models.json"
echo ""

echo "=========================================="
echo "✅ Production Configuration Updated!"
echo "=========================================="
echo ""
echo "Current setup:"
echo "  - Active model: mistral-commentary (Q4_K_M, 4.5GB)"
echo "  - Fine-tuned on: 255 L'Équipe commentary examples"
echo "  - Temperature: 0.9"
echo "  - Repeat penalty: 1.15"
echo ""
echo "The system will now use your fine-tuned Mistral model"
echo "for all live commentary generation."
echo ""
echo "Next steps:"
echo "  1. Monitor the next live match"
echo "  2. Check commentary quality"
echo "  3. Review generation speed"
echo ""
