/**
 * Test MySQL connection with current credentials
 */

const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  console.log('Testing MySQL connection...\n');

  const config = {
    host: process.env.WORDPRESS_DB_HOST || '159.223.103.16',
    user: process.env.WORDPRESS_DB_USER,
    password: process.env.WORDPRESS_DB_PASSWORD,
    database: process.env.WORDPRESS_DB_NAME || 'wordpress',
  };

  console.log('Connection config:');
  console.log('- Host:', config.host);
  console.log('- User:', config.user ? '***' : '(empty)');
  console.log('- Password:', config.password ? '***' : '(empty)');
  console.log('- Database:', config.database);
  console.log();

  if (!config.user || !config.password) {
    console.error('❌ Error: Missing database credentials in .env.local');
    console.error('\nRequired environment variables:');
    console.error('- WORDPRESS_DB_HOST (optional, defaults to 159.223.103.16)');
    console.error('- WORDPRESS_DB_USER (required)');
    console.error('- WORDPRESS_DB_PASSWORD (required)');
    console.error('- WORDPRESS_DB_NAME (optional, defaults to wordpress)');
    process.exit(1);
  }

  try {
    const connection = await mysql.createConnection(config);
    console.log('✅ Successfully connected to MySQL database');

    // Test query
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM wp_afriquesports_visits');
    console.log(`✅ Test query successful: ${rows[0].count} total visit records`);

    await connection.end();
    console.log('✅ Connection closed');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

testConnection();
