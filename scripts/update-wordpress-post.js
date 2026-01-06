#!/usr/bin/env node

/**
 * Update WordPress Post with Generated Content
 *
 * Usage: node update-wordpress-post.js --post-id=851539 --content-file=generated-content-851539.txt
 */

const fs = require('fs');
const https = require('https');

// Parse arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.replace('--', '').split('=');
  acc[key] = value || true;
  return acc;
}, {});

const postId = args['post-id'];
const contentFile = args['content-file'] || `generated-content-${postId}.txt`;

if (!postId) {
  console.error('❌ Error: --post-id is required');
  process.exit(1);
}

// WordPress credentials (from environment or prompt)
const WP_URL = process.env.WORDPRESS_URL || 'https://www.afriquesports.net';
const WP_USERNAME = process.env.WORDPRESS_USERNAME;
const WP_APP_PASSWORD = process.env.WORDPRESS_APP_PASSWORD;

if (!WP_USERNAME || !WP_APP_PASSWORD) {
  console.error('❌ Error: WordPress credentials not found');
  console.error('   Set WORDPRESS_USERNAME and WORDPRESS_APP_PASSWORD environment variables');
  console.error('   Or run: export WORDPRESS_USERNAME=your-username');
  console.error('          export WORDPRESS_APP_PASSWORD=your-app-password');
  process.exit(1);
}

async function updatePost() {
  console.log('📝 Updating WordPress post...\n');
  console.log(`   Post ID: ${postId}`);
  console.log(`   Content file: ${contentFile}`);
  console.log(`   WordPress URL: ${WP_URL}\n`);

  // Read generated content
  if (!fs.existsSync(contentFile)) {
    console.error(`❌ Content file not found: ${contentFile}`);
    process.exit(1);
  }

  const content = fs.readFileSync(contentFile, 'utf-8');
  console.log(`   Content length: ${content.length} characters (${content.split(/\s+/).length} words)\n`);

  // Prepare WordPress API request
  const auth = Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString('base64');

  const postData = JSON.stringify({
    content: content,
    status: 'publish'
  });

  const options = {
    hostname: new URL(WP_URL).hostname,
    port: 443,
    path: `/wp-json/wp/v2/posts/${postId}`,
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          const response = JSON.parse(data);
          console.log('✅ Post updated successfully!\n');
          console.log(`   Post URL: ${response.link}`);
          console.log(`   Modified: ${response.modified}`);
          resolve(response);
        } else {
          console.error(`❌ Update failed with status ${res.statusCode}`);
          console.error(`   Response: ${data}`);
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

updatePost().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
