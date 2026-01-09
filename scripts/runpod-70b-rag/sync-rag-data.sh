#!/bin/bash
# Sync RAG data from iMac to RunPod
# Run this from your MacBook

set -e

echo "=============================================="
echo "  SYNC RAG DATA: iMac → RunPod"
echo "=============================================="

# Configuration
IMAC_HOST="192.168.2.217"
IMAC_USER="mad"
IMAC_RAG_PATH="~/afrique-sports-rag/chromadb"

# RunPod config - UPDATE THESE
RUNPOD_HOST=""  # e.g., root@69.30.85.175
RUNPOD_PORT=""  # e.g., 22147
RUNPOD_PATH="/workspace/chromadb"

# Check if RunPod config is set
if [ -z "$RUNPOD_HOST" ] || [ -z "$RUNPOD_PORT" ]; then
    echo ""
    echo "⚠️  Please update this script with your RunPod SSH details:"
    echo ""
    echo "   RUNPOD_HOST=\"root@<IP>\""
    echo "   RUNPOD_PORT=\"<PORT>\""
    echo ""
    echo "Get these from RunPod dashboard → Pod → Connect → SSH"
    exit 1
fi

# Create temp directory
TEMP_DIR="/tmp/rag-sync-$(date +%s)"
mkdir -p "$TEMP_DIR"

echo -e "\n📥 Step 1: Downloading ChromaDB from iMac..."
rsync -avz --progress \
    "${IMAC_USER}@${IMAC_HOST}:${IMAC_RAG_PATH}/" \
    "$TEMP_DIR/chromadb/"

# Check size
SIZE=$(du -sh "$TEMP_DIR/chromadb" | cut -f1)
echo "   Downloaded: $SIZE"

echo -e "\n📤 Step 2: Uploading to RunPod..."
rsync -avz --progress \
    -e "ssh -p $RUNPOD_PORT" \
    "$TEMP_DIR/chromadb/" \
    "${RUNPOD_HOST}:${RUNPOD_PATH}/"

echo -e "\n🧹 Step 3: Cleaning up..."
rm -rf "$TEMP_DIR"

echo ""
echo "=============================================="
echo "  ✅ SYNC COMPLETE"
echo "=============================================="
echo ""
echo "ChromaDB synced to RunPod: $RUNPOD_PATH"
echo ""
echo "Next: SSH to RunPod and start RAG API:"
echo "   ssh -p $RUNPOD_PORT $RUNPOD_HOST"
echo "   ./start-rag.sh"
