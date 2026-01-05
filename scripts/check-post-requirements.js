#!/usr/bin/env node

const https = require('https');

const USERNAME = 'admin';
const APP_PASSWORD = 'xDuv TVaA oz2W wwDK WFz1 OFsN';
const POST_ID = 851539;

function fetchPost() {
  const auth = Buffer.from(`${USERNAME}:${APP_PASSWORD}`).toString('base64');

  const options = {
    hostname: 'cms.realdemadrid.com',
    path: `/afriquesports/wp-json/wp/v2/posts/${POST_ID}`,
    method: 'GET',
    headers: {
      'Authorization': `Basic ${auth}`
    },
    timeout: 30000
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          const post = JSON.parse(data);
          console.log('📋 Current Post Data:\n');
          console.log('Title:', post.title.rendered);
          console.log('Status:', post.status);
          console.log('Content length:', post.content.rendered.length, 'characters');
          console.log('Excerpt length:', post.excerpt.rendered.length, 'characters');
          console.log('Categories:', post.categories);
          console.log('Tags:', post.tags);
          console.log('Featured media:', post.featured_media);
          console.log('\nMeta fields:', JSON.stringify(post.meta, null, 2));
          console.log('\nYoast/RankMath SEO:', JSON.stringify(post.yoast_head_json || post.rank_math || 'Not found', null, 2));
          resolve(post);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

fetchPost().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
