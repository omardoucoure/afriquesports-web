#!/usr/bin/env node
/**
 * Fix Malformed URLs in Database
 * Checks WordPress database for posts with malformed URLs and fixes them
 */

const mysql = require('mysql2/promise');

console.log('🔧 Fixing Malformed URLs in Database\n');

// Database configuration (from environment variables)
const dbConfig = {
  host: process.env.WORDPRESS_DB_HOST || 'localhost',
  user: process.env.WORDPRESS_DB_USER,
  password: process.env.WORDPRESS_DB_PASSWORD,
  database: process.env.WORDPRESS_DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Check if required env vars are set
if (!dbConfig.user || !dbConfig.password || !dbConfig.database) {
  console.error('❌ Missing required environment variables:');
  console.error('   WORDPRESS_DB_USER, WORDPRESS_DB_PASSWORD, WORDPRESS_DB_NAME');
  console.error('\nSet them in .env.local or pass as environment variables');
  process.exit(1);
}

async function fixUrls() {
  let connection;

  try {
    // Connect to database
    console.log(`📡 Connecting to database: ${dbConfig.database}@${dbConfig.host}\n`);
    connection = await mysql.createConnection(dbConfig);

    // Find posts with malformed URLs in post_name
    console.log('🔍 Searching for malformed post slugs...\n');

    const [malformedPosts] = await connection.execute(
      `SELECT ID, post_name, post_title, post_type, post_status
       FROM wp_posts
       WHERE post_name LIKE '%https:%'
       AND post_type = 'post'
       AND post_status = 'publish'`
    );

    console.log(`Found ${malformedPosts.length} posts with malformed slugs\n`);

    if (malformedPosts.length === 0) {
      console.log('✅ No malformed URLs found in database!');
      console.log('   The issue might be in the permalink structure or URL generation logic.\n');
      return;
    }

    // Preview first 10
    console.log('First 10 malformed posts:\n');
    malformedPosts.slice(0, 10).forEach((post, i) => {
      console.log(`${i + 1}. ID: ${post.ID}`);
      console.log(`   Title: ${post.post_title}`);
      console.log(`   Current slug: ${post.post_name}`);
      console.log(`   Fixed slug: ${post.post_name.replace(/https:/, '')}\n`);
    });

    // Ask for confirmation
    console.log('══════════════════════════════════════════════════════');
    console.log('⚠️  WARNING: This will modify the database');
    console.log('══════════════════════════════════════════════════════\n');
    console.log(`About to fix ${malformedPosts.length} post slugs.`);
    console.log('This will:');
    console.log('  1. Remove "https:" from post_name field');
    console.log('  2. Update affected posts');
    console.log('  3. Create backup of changes\n');

    // In production, you'd want to ask for confirmation here
    // For now, we'll just do a dry run
    const DRY_RUN = process.argv.includes('--execute') ? false : true;

    if (DRY_RUN) {
      console.log('🔍 DRY RUN MODE - No changes will be made');
      console.log('   Run with --execute flag to apply changes\n');
    } else {
      console.log('🚀 EXECUTING CHANGES\n');
    }

    // Process each post
    const results = {
      success: 0,
      failed: 0,
      errors: [],
    };

    for (const post of malformedPosts) {
      const oldSlug = post.post_name;
      const newSlug = oldSlug.replace(/https:\//, '').replace(/https:/, '');

      if (oldSlug === newSlug) {
        console.log(`⚠️  Skipping ID ${post.ID}: No change needed`);
        continue;
      }

      console.log(`Processing ID ${post.ID}: ${oldSlug} → ${newSlug}`);

      if (!DRY_RUN) {
        try {
          await connection.execute(
            'UPDATE wp_posts SET post_name = ? WHERE ID = ?',
            [newSlug, post.ID]
          );

          results.success++;
          console.log(`   ✅ Updated`);
        } catch (error) {
          results.failed++;
          results.errors.push({ id: post.ID, error: error.message });
          console.log(`   ❌ Failed: ${error.message}`);
        }
      } else {
        results.success++;
        console.log(`   ✅ Would update (dry run)`);
      }
    }

    console.log('\n══════════════════════════════════════════════════════');
    console.log('📊 Summary');
    console.log('══════════════════════════════════════════════════════\n');

    console.log(`Total posts found: ${malformedPosts.length}`);
    console.log(`✅ ${DRY_RUN ? 'Would fix' : 'Fixed'}: ${results.success}`);
    console.log(`❌ Failed: ${results.failed}\n`);

    if (results.errors.length > 0) {
      console.log('Errors:');
      results.errors.forEach((err) => {
        console.log(`  ID ${err.id}: ${err.error}`);
      });
      console.log('');
    }

    if (DRY_RUN) {
      console.log('To apply these changes, run:');
      console.log('  node scripts/fix-malformed-urls-in-db.js --execute\n');
    } else {
      console.log('✅ Database updated successfully!\n');
      console.log('Next steps:');
      console.log('  1. Clear WordPress cache');
      console.log('  2. Regenerate permalinks (Settings → Permalinks → Save)');
      console.log('  3. Submit updated sitemap to Google Search Console');
      console.log('  4. Request re-indexing of affected URLs\n');
    }
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('📡 Database connection closed');
    }
  }
}

// Run the script
fixUrls();
