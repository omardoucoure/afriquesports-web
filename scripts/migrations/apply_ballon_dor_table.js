/**
 * Migration runner for Ballon d'Or table
 * Run: node scripts/migrations/apply_ballon_dor_table.js
 *
 * Uses WordPress MySQL connection (same as visits table)
 */
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Load .env.local if running locally
try {
  const envPath = path.join(__dirname, '../../.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '').trim();
        if (!process.env[key.trim()]) {
          process.env[key.trim()] = value;
        }
      }
    });
  }
} catch (e) {
  // Ignore env loading errors
}

async function applyMigration() {
  const config = {
    host: process.env.WORDPRESS_DB_HOST || 'localhost',
    user: process.env.WORDPRESS_DB_USER,
    password: process.env.WORDPRESS_DB_PASSWORD,
    database: process.env.WORDPRESS_DB_NAME || 'wordpress',
  };

  if (!config.user || !config.password) {
    console.error('Missing WORDPRESS_DB_USER or WORDPRESS_DB_PASSWORD');
    console.log('Set these env vars or run on the production server');
    process.exit(1);
  }

  console.log(`Connecting to MySQL at ${config.host}...`);
  const connection = await mysql.createConnection(config);

  try {
    const sqlPath = path.join(__dirname, 'create_ballon_dor_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Running migration: create_ballon_dor_table.sql');
    await connection.query(sql);
    console.log('Migration applied successfully.');

    // Verify
    const [rows] = await connection.query('DESCRIBE wp_afriquesports_ballon_dor');
    console.log(`Table created with ${rows.length} columns:`);
    rows.forEach(row => console.log(`  - ${row.Field} (${row.Type})`));
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

applyMigration();
