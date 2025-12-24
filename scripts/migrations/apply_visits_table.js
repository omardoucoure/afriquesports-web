const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

async function applyMigration() {
  const connection = await mysql.createConnection({
    host: process.env.WORDPRESS_DB_HOST || '159.223.103.16',
    user: process.env.WORDPRESS_DB_USER,
    password: process.env.WORDPRESS_DB_PASSWORD,
    database: process.env.WORDPRESS_DB_NAME || 'wordpress',
    multipleStatements: true,
  });

  try {
    console.log('🔌 Connected to WordPress MySQL database');

    const sql = fs.readFileSync(path.join(__dirname, 'create_visits_table.sql'), 'utf8');

    console.log('📝 Applying migration: create_visits_table.sql');
    await connection.query(sql);

    console.log('✅ Migration applied successfully!');

    // Verify the table was created
    const [rows] = await connection.query(
      "SHOW TABLES LIKE 'wp_afriquesports_visits'"
    );

    if (rows.length > 0) {
      console.log('✓ Table wp_afriquesports_visits exists');

      // Show table structure
      const [columns] = await connection.query(
        'DESCRIBE wp_afriquesports_visits'
      );
      console.log('\nTable structure:');
      console.table(columns);
    } else {
      console.error('❌ Table was not created');
    }
  } catch (error) {
    console.error('❌ Error applying migration:', error);
    process.exit(1);
  } finally {
    await connection.end();
    console.log('\n🔌 Database connection closed');
  }
}

applyMigration();
