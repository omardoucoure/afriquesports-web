#!/bin/bash
# iMac M3 Ollama Setup Script
# Run this script on your iMac to install and configure Ollama

set -e

echo "🚀 Setting up Ollama on iMac M3..."
echo ""

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo "📦 Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

    # Add Homebrew to PATH for Apple Silicon
    echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
    eval "$(/opt/homebrew/bin/brew shellenv)"
fi

# Install Ollama
if ! command -v ollama &> /dev/null; then
    echo "📥 Installing Ollama..."
    brew install ollama
else
    echo "✅ Ollama already installed"
fi

# Stop Ollama service if running
echo "🛑 Stopping Ollama service..."
brew services stop ollama 2>/dev/null || true

# Configure Ollama to accept network connections
echo "🔧 Configuring Ollama for network access..."
launchctl setenv OLLAMA_HOST "0.0.0.0:11434"

# Start Ollama service
echo "▶️  Starting Ollama service..."
brew services start ollama

# Wait for Ollama to start
echo "⏳ Waiting for Ollama to start..."
sleep 3

# Pull the 7B model optimized for 8GB RAM
echo "📥 Downloading Qwen 2.5 7B model (this may take a few minutes)..."
ollama pull qwen2.5:7b-instruct

# Test the model
echo ""
echo "🧪 Testing model..."
echo "Question: Write one sentence about football."
ollama run qwen2.5:7b-instruct "Write one sentence about football." --verbose=false

# Get IP address
IP_ADDRESS=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "unknown")

echo ""
echo "✅ Setup complete!"
echo ""
echo "📊 Summary:"
echo "   - Ollama installed and running"
echo "   - Model: qwen2.5:7b-instruct"
echo "   - Network access: enabled"
echo "   - iMac IP: $IP_ADDRESS"
echo "   - Port: 11434"
echo ""
echo "🔗 Test from another computer:"
echo "   curl http://$IP_ADDRESS:11434/api/tags"
echo ""
echo "💡 Keep your iMac powered on for remote content generation"
