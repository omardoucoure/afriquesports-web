#!/bin/bash
# Requantize Mistral model from Q8 (14GB) to Q4_K_M (4.5GB)
# This script installs llama.cpp and performs the quantization

set -e

SERVER="root@159.223.103.16"
MODEL_DIR="/mnt/volume_nyc1_01/models"
INPUT_MODEL="mistral-commentary.gguf"
OUTPUT_MODEL="mistral-commentary-q4.gguf"

echo "=========================================="
echo "🔄 Requantizing Mistral to Q4_K_M"
echo "=========================================="
echo ""

# Create requantization script for server
cat > /tmp/requantize.sh << 'EOFSCRIPT'
#!/bin/bash
set -e

cd /root

# Step 1: Install dependencies
echo "📋 Step 1: Installing dependencies..."
apt-get update -qq
apt-get install -y git build-essential cmake wget > /dev/null 2>&1
echo "✅ Dependencies installed"
echo ""

# Step 2: Clone llama.cpp (if not exists)
if [ ! -d "llama.cpp" ]; then
    echo "📋 Step 2: Cloning llama.cpp..."
    git clone https://github.com/ggerganov/llama.cpp.git > /dev/null 2>&1
    echo "✅ llama.cpp cloned"
else
    echo "📋 Step 2: llama.cpp already exists"
    cd llama.cpp
    git pull > /dev/null 2>&1
    cd ..
    echo "✅ llama.cpp updated"
fi
echo ""

# Step 3: Build llama.cpp
echo "📋 Step 3: Building llama.cpp (this may take 2-3 minutes)..."
cd llama.cpp
make clean > /dev/null 2>&1 || true
make -j$(nproc) > /dev/null 2>&1
echo "✅ llama.cpp built successfully"
echo ""

# Step 4: Verify input model exists
echo "📋 Step 4: Verifying input model..."
INPUT="/mnt/volume_nyc1_01/models/mistral-commentary.gguf"
OUTPUT="/mnt/volume_nyc1_01/models/mistral-commentary-q4.gguf"

if [ ! -f "$INPUT" ]; then
    echo "❌ ERROR: Input model not found at $INPUT"
    exit 1
fi

echo "✅ Input model found: $(ls -lh $INPUT | awk '{print $5}')"
echo ""

# Step 5: Requantize to Q4_K_M
echo "📋 Step 5: Requantizing to Q4_K_M..."
echo "   This will take 5-10 minutes..."
echo "   Input:  $INPUT (14 GB)"
echo "   Output: $OUTPUT (~4.5 GB)"
echo ""

./llama-quantize "$INPUT" "$OUTPUT" Q4_K_M

echo ""
echo "✅ Requantization complete!"
echo ""

# Step 6: Verify output
echo "📋 Step 6: Verifying output..."
if [ ! -f "$OUTPUT" ]; then
    echo "❌ ERROR: Output file not created"
    exit 1
fi

OUTPUT_SIZE=$(ls -lh "$OUTPUT" | awk '{print $5}')
echo "✅ Output model created: $OUTPUT_SIZE"
echo ""

# Step 7: Show disk usage
echo "📊 Disk Usage:"
echo "   Original Q8:  $(ls -lh $INPUT | awk '{print $5}')"
echo "   New Q4_K_M:   $(ls -lh $OUTPUT | awk '{print $5}')"
echo ""
echo "   Space saved: ~9.5 GB"
echo ""

echo "=========================================="
echo "✅ Requantization Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Load the new model into Ollama"
echo "2. Remove the old 14GB model to save space"
echo ""
EOFSCRIPT

# Upload and execute on server
echo "Uploading requantization script to server..."
scp /tmp/requantize.sh $SERVER:/root/
echo ""

echo "Executing requantization on server..."
echo "This will take 5-10 minutes. Please wait..."
echo ""

ssh $SERVER "chmod +x /root/requantize.sh && /root/requantize.sh"

echo ""
echo "=========================================="
echo "✅ Requantization Complete!"
echo "=========================================="
echo ""
echo "Next step: Load the Q4 model into Ollama"
echo "Run: ./load_q4_model.sh"
echo ""
