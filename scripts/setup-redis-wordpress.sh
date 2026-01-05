#!/bin/bash

##
# Setup Redis for WordPress Performance Optimization
# Run this on the WordPress server (159.223.103.16)
##

set -e

echo "=========================================="
echo "Redis Setup for WordPress Performance"
echo "=========================================="

# Update system
echo "📦 Updating system packages..."
sudo apt update

# Install Redis Server
echo "📦 Installing Redis server..."
sudo apt install -y redis-server

# Configure Redis for production
echo "⚙️  Configuring Redis..."
sudo tee /etc/redis/redis.conf > /dev/null <<EOF
# Bind to localhost for security
bind 127.0.0.1

# Enable password protection (change this!)
requirepass $(openssl rand -base64 32)

# Memory optimization
maxmemory 256mb
maxmemory-policy allkeys-lru

# Persistence (reduce disk writes)
save 900 1
save 300 10
save 60 10000

# Performance tuning
tcp-backlog 511
timeout 0
tcp-keepalive 300
daemonize yes
supervised systemd
pidfile /var/run/redis/redis-server.pid
loglevel notice
logfile /var/log/redis/redis-server.log
databases 16
EOF

# Enable and start Redis
echo "🚀 Starting Redis service..."
sudo systemctl enable redis-server
sudo systemctl restart redis-server

# Check Redis status
echo "✅ Checking Redis status..."
sudo systemctl status redis-server --no-pager || true

# Test Redis connection
echo "🧪 Testing Redis connection..."
redis-cli ping

echo ""
echo "=========================================="
echo "✅ Redis installation complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Install Redis Object Cache plugin in WordPress:"
echo "   wp plugin install redis-cache --activate"
echo "2. Enable Redis cache:"
echo "   wp redis enable"
echo "3. Configure wp-config.php with Redis settings"
echo ""
echo "Password saved in: /etc/redis/redis.conf"
echo "To get password: sudo grep requirepass /etc/redis/redis.conf"
echo ""
