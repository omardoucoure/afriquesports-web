const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

async function testConnection() {
  console.log('🔍 Testing MySQL connection...\n');

  const config = {
    host: process.env.WORDPRESS_DB_HOST || '159.223.103.16',
    user: process.env.WORDPRESS_DB_USER,
    password: process.env.WORDPRESS_DB_PASSWORD,
    database: process.env.WORDPRESS_DB_NAME || 'wordpress',
  };

  console.log('📋 Configuration:');
  console.log(`   Host: ${config.host}`);
  console.log(`   User: ${config.user || '❌ NOT SET'}`);
  console.log(`   Password: ${config.password ? '✓ SET' : '❌ NOT SET'}`);
  console.log(`   Database: ${config.database}\n`);

  if (!config.user || !config.password) {
    console.error('❌ Missing required environment variables!');
    console.error('   Please add to .env.local:');
    console.error('   WORDPRESS_DB_USER=your_username');
    console.error('   WORDPRESS_DB_PASSWORD=your_password\n');
    process.exit(1);
  }

  try {
    const connection = await mysql.createConnection(config);
    console.log('✅ Successfully connected to MySQL database!\n');

    // Test query
    const [rows] = await connection.query('SELECT DATABASE() as db');
    console.log(`📊 Current database: ${rows[0].db}`);

    // Check if visits table already exists
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'wp_afriquesports_visits'"
    );

    if (tables.length > 0) {
      console.log('ℹ️  Table wp_afriquesports_visits already exists');

      // Show row count
      const [count] = await connection.query(
        'SELECT COUNT(*) as total FROM wp_afriquesports_visits'
      );
      console.log(`   Total records: ${count[0].total}`);
    } else {
      console.log('ℹ️  Table wp_afriquesports_visits does not exist yet');
      console.log('   Run: node scripts/migrations/apply_visits_table.js');
    }

    await connection.end();
    console.log('\n✓ Connection test completed successfully');
  } catch (error) {
    console.error('\n❌ Connection failed:', error.message);
    console.error('\nPlease check:');
    console.error('  1. Database credentials are correct');
    console.error('  2. Database server is accessible');
    console.error('  3. User has proper permissions\n');
    process.exit(1);
  }
}

testConnection();
