/**
 * Apply MySQL migrations to WordPress database
 * Usage: NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/apply-mysql-migration.js <migration-file>
 *
 * Example:
 * NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/apply-mysql-migration.js scripts/mysql-migrations/001_add_visits_indexes.sql
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function applyMigration(migrationFile) {
  // Create connection using environment variables
  const connection = await mysql.createConnection({
    host: process.env.WORDPRESS_DB_HOST || '159.223.103.16',
    user: process.env.WORDPRESS_DB_USER,
    password: process.env.WORDPRESS_DB_PASSWORD,
    database: process.env.WORDPRESS_DB_NAME || 'wordpress',
    multipleStatements: true, // Allow multiple SQL statements
  });

  try {
    console.log('✓ Connected to MySQL database');

    // Read migration file
    const migrationPath = path.resolve(process.cwd(), migrationFile);
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log(`\nApplying migration: ${path.basename(migrationFile)}`);
    console.log('=====================================\n');

    // Execute migration
    const [results] = await connection.query(sql);

    // Display results
    if (Array.isArray(results)) {
      results.forEach((result, index) => {
        if (result.affectedRows !== undefined) {
          console.log(`✓ Statement ${index + 1}: ${result.affectedRows} rows affected`);
        } else if (Array.isArray(result)) {
          console.log(`\nIndex information:`);
          console.table(result);
        }
      });
    }

    console.log('\n✓ Migration completed successfully');
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await connection.end();
    console.log('\n✓ Database connection closed');
  }
}

// Get migration file from command line arguments
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('Usage: node scripts/apply-mysql-migration.js <migration-file>');
  console.error('\nExample:');
  console.error('  NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/apply-mysql-migration.js scripts/mysql-migrations/001_add_visits_indexes.sql');
  process.exit(1);
}

applyMigration(migrationFile);
