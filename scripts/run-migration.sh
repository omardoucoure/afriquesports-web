#!/bin/bash

# Run database migration on production
# This script calls the /api/admin/migrate-db endpoint to create database indexes

PROD_URL="https://www.afriquesports.net"
ENDPOINT="/api/admin/migrate-db"

echo "========================================="
echo "Database Migration Script"
echo "========================================="
echo ""

# Step 1: Check migration status
echo "Step 1: Checking migration status..."
echo "GET ${PROD_URL}${ENDPOINT}"
echo ""

STATUS_RESPONSE=$(curl -s "${PROD_URL}${ENDPOINT}")
echo "$STATUS_RESPONSE" | jq '.' 2>/dev/null || echo "$STATUS_RESPONSE"
echo ""

# Step 2: Run migration
echo "========================================="
echo "Step 2: Running migration..."
echo "POST ${PROD_URL}${ENDPOINT}"
echo ""

MIGRATION_RESPONSE=$(curl -s -X POST "${PROD_URL}${ENDPOINT}")
echo "$MIGRATION_RESPONSE" | jq '.' 2>/dev/null || echo "$MIGRATION_RESPONSE"
echo ""

# Step 3: Verify migration
echo "========================================="
echo "Step 3: Verifying migration..."
echo "GET ${PROD_URL}${ENDPOINT}"
echo ""

VERIFY_RESPONSE=$(curl -s "${PROD_URL}${ENDPOINT}")
echo "$VERIFY_RESPONSE" | jq '.' 2>/dev/null || echo "$VERIFY_RESPONSE"
echo ""

echo "========================================="
echo "Migration complete!"
echo "========================================="
