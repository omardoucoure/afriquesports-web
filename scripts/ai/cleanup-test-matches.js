#!/usr/bin/env node

/**
 * Clean up test/mock matches from database
 *
 * Removes:
 * - Test matches (match IDs containing "test")
 * - Mock matches (732145-732150 range)
 */

require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

const config = {
  host: process.env.WORDPRESS_DB_HOST || '159.223.103.16',
  user: process.env.WORDPRESS_DB_USER,
  password: process.env.WORDPRESS_DB_PASSWORD,
  database: process.env.WORDPRESS_DB_NAME || 'wordpress',
};

async function cleanup() {
  console.log('========================================');
  console.log('Test Matches Cleanup');
  console.log('========================================');
  console.log('');

  if (!config.user || !config.password) {
    console.error('❌ Missing database credentials');
    process.exit(1);
  }

  const connection = await mysql.createConnection(config);

  try {
    // Get list of test matches
    console.log('1. Finding test matches...');
    const [matches] = await connection.query(`
      SELECT DISTINCT match_id
      FROM wp_match_commentary
      WHERE match_id LIKE '%test%'
         OR match_id IN ('732145', '732146', '732147', '732148', '732149', '732150')
    `);

    console.log(`   Found ${matches.length} test matches in commentary table`);

    // Delete from commentary table
    console.log('');
    console.log('2. Deleting test commentary...');
    const [commentaryResult] = await connection.query(`
      DELETE FROM wp_match_commentary
      WHERE match_id LIKE '%test%'
         OR match_id IN ('732145', '732146', '732147', '732148', '732149', '732150')
    `);
    console.log(`   ✅ Deleted ${commentaryResult.affectedRows} commentary rows`);

    // Delete from pre-match table
    console.log('');
    console.log('3. Deleting test pre-match analysis...');
    const [prematchResult] = await connection.query(`
      DELETE FROM wp_match_prematch_analysis
      WHERE match_id LIKE '%test%'
         OR match_id IN ('732145', '732146', '732147', '732148', '732149', '732150')
    `);
    console.log(`   ✅ Deleted ${prematchResult.affectedRows} pre-match rows`);

    // Delete from match states table
    console.log('');
    console.log('4. Deleting test match states...');
    const [statesResult] = await connection.query(`
      DELETE FROM wp_match_states
      WHERE match_id LIKE '%test%'
         OR match_id IN ('732145', '732146', '732147', '732148', '732149', '732150')
    `);
    console.log(`   ✅ Deleted ${statesResult.affectedRows} match state rows`);

    console.log('');
    console.log('========================================');
    console.log('✅ CLEANUP COMPLETED');
    console.log('========================================');

  } catch (error) {
    console.error('');
    console.error('❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

cleanup();
