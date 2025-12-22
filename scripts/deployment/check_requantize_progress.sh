#!/bin/bash
# Check requantization progress

SERVER="root@159.223.103.16"

echo "=========================================="
echo "📊 Requantization Progress"
echo "=========================================="
echo ""

# Check if process is running
if ssh $SERVER "pgrep -f requantize_cmake.sh" > /dev/null; then
    echo "✅ Requantization is running"
    echo ""
    echo "📋 Recent log output:"
    ssh $SERVER "tail -15 /root/requantize.log"
    echo ""
    echo "To watch in real-time, run:"
    echo "  ssh root@159.223.103.16 'tail -f /root/requantize.log'"
else
    echo "Process completed or not running"
    echo ""
    echo "📋 Full log:"
    ssh $SERVER "cat /root/requantize.log"
    echo ""

    # Check if Q4 model was created
    if ssh $SERVER "ls -lh /mnt/volume_nyc1_01/models/mistral-commentary-q4.gguf 2>/dev/null"; then
        echo ""
        echo "✅ Q4 model created successfully!"
        echo ""
        echo "Next step: ./load_q4_model.sh"
    else
        echo "❌ Q4 model not found"
    fi
fi
