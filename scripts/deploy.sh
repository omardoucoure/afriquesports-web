#!/bin/bash

# Manual Deployment Script
# Use this to deploy manually while GitHub Actions is unavailable

set -e  # Exit on any error

echo "🚀 Starting deployment to DigitalOcean..."
echo ""

# Server details
SERVER_USER="root"
SERVER_HOST="159.223.103.16"
PROJECT_DIR="/mnt/volume_nyc1_01/nextjs-apps/afriquesports-web"

echo "📡 Connecting to server: $SERVER_HOST"
echo ""

# Run deployment commands on server
ssh ${SERVER_USER}@${SERVER_HOST} << 'ENDSSH'
set -e  # Exit on any error

echo "🚀 Starting deployment..."
echo ""

# Navigate to project directory
cd /mnt/volume_nyc1_01/nextjs-apps/afriquesports-web || exit 1
echo "📁 Current directory: $(pwd)"
echo ""

# Show current commit
echo "📋 Current commit:"
git log --oneline -1
echo ""

# Pull latest changes
echo "📥 Pulling latest code from GitHub..."
git pull origin main || exit 1
echo ""

# Show new commit
echo "✅ Updated to:"
git log --oneline -1
echo ""

# Check if package.json changed
if git diff HEAD@{1} HEAD --name-only | grep -q "package.json"; then
  echo "📦 package.json changed, installing dependencies..."
  npm install --production || exit 1
  echo ""
else
  echo "✓ No dependency changes detected"
  echo ""
fi

# Clear build cache (ignore errors if some files are locked)
echo "🧹 Clearing build cache..."
rm -rf .next 2>/dev/null || true
echo ""

# Build the application
echo "🏗️ Building Next.js application..."
npm run build || exit 1
echo ""

# Reload PM2 (graceful restart)
echo "🔄 Reloading PM2..."
pm2 reload ecosystem.config.js --update-env || exit 1
echo ""

# Wait for startup
echo "⏳ Waiting for application to start..."
sleep 5
echo ""

# Verify deployment
echo "✅ Checking application status..."
pm2 list
echo ""

pm2 info afriquesports-web | grep -E "status|restarts|uptime"
echo ""

# Test website
echo "🌐 Testing website..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://www.afriquesports.net)
if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Website is responding correctly (200 OK)"
else
  echo "❌ Website returned $HTTP_CODE"
  exit 1
fi
echo ""

echo "🎉 Deployment completed successfully!"
ENDSSH

echo ""
echo "✅ Deployment finished!"
echo ""
echo "Check your website: https://www.afriquesports.net"
