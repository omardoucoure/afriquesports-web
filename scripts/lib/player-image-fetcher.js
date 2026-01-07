/**
 * Player Image Fetcher
 *
 * Uses SerpAPI Google Images to find HD player photos
 * and uploads them to WordPress media library.
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const SERPAPI_KEY = process.env.SERPAPI_KEY || 'e75b43874237b3f7c922cf794a3e5161ea2acb9c7db38008e0ac991b5fd7dcd9';
const SERPAPI_BASE = 'https://serpapi.com/search.json';

// WordPress REST API configuration (same env vars as update-wordpress-post.js)
const WP_API_URL = process.env.WORDPRESS_URL ? `${process.env.WORDPRESS_URL}/wp-json/wp/v2` : 'https://www.afriquesports.net/wp-json/wp/v2';
const WP_USERNAME = process.env.WORDPRESS_USERNAME;
const WP_APP_PASSWORD = process.env.WORDPRESS_APP_PASSWORD;

// Local cache for player images
const CACHE_FILE = path.join(__dirname, '../data/player-images-cache.json');

class PlayerImageFetcher {
  constructor(options = {}) {
    this.apiKey = options.apiKey || SERPAPI_KEY;
    this.wpApiUrl = options.wpApiUrl || WP_API_URL;
    this.wpUsername = options.wpUsername || WP_USERNAME;
    this.wpAppPassword = options.wpAppPassword || WP_APP_PASSWORD;
    this.cache = this.loadCache();
    this.minWidth = options.minWidth || 800; // Minimum HD width
    this.minHeight = options.minHeight || 800; // Minimum HD height
  }

  /**
   * Load cache from file
   */
  loadCache() {
    try {
      if (fs.existsSync(CACHE_FILE)) {
        return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
      }
    } catch (err) {
      console.warn('⚠️ Could not load image cache:', err.message);
    }
    return {};
  }

  /**
   * Save cache to file
   */
  saveCache() {
    try {
      const dir = path.dirname(CACHE_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(CACHE_FILE, JSON.stringify(this.cache, null, 2));
    } catch (err) {
      console.warn('⚠️ Could not save image cache:', err.message);
    }
  }

  /**
   * Generate cache key for player
   */
  getCacheKey(playerName, team) {
    return `${playerName.toLowerCase().replace(/\s+/g, '-')}_${(team || '').toLowerCase().replace(/\s+/g, '-')}`;
  }

  /**
   * Search for HD player image using SerpAPI Google Images
   */
  async searchPlayerImage(playerName, team = '', nationality = '') {
    // Build search query for best results
    const searchTerms = [
      playerName,
      team,
      'football player',
      'portrait HD'
    ].filter(Boolean).join(' ');

    console.log(`🔍 Searching HD image for: ${searchTerms}`);

    const params = new URLSearchParams({
      engine: 'google_images',
      q: searchTerms,
      api_key: this.apiKey,
      ijn: '0', // Page number
      imgsz: 'l', // Large images only
      imgtype: 'photo', // Photos only
      safe: 'active'
    });

    return new Promise((resolve, reject) => {
      const url = `${SERPAPI_BASE}?${params}`;

      https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);

            if (json.error) {
              reject(new Error(json.error));
              return;
            }

            // Filter for HD images
            const hdImages = (json.images_results || [])
              .filter(img => {
                const width = img.original_width || 0;
                const height = img.original_height || 0;
                return width >= this.minWidth && height >= this.minHeight;
              })
              .slice(0, 5); // Top 5 HD candidates

            if (hdImages.length === 0) {
              console.log('   ⚠️ No HD images found, using best available');
              // Fallback to any large image
              const fallback = (json.images_results || []).slice(0, 3);
              resolve(fallback);
              return;
            }

            console.log(`   ✅ Found ${hdImages.length} HD images`);
            resolve(hdImages);
          } catch (err) {
            reject(new Error(`Parse error: ${err.message}`));
          }
        });
      }).on('error', reject);
    });
  }

  /**
   * Download image from URL
   */
  async downloadImage(imageUrl) {
    return new Promise((resolve, reject) => {
      const protocol = imageUrl.startsWith('https') ? https : http;

      const request = protocol.get(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'image/*'
        },
        timeout: 15000
      }, (res) => {
        // Handle redirects
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          this.downloadImage(res.headers.location).then(resolve).catch(reject);
          return;
        }

        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }

        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => {
          const buffer = Buffer.concat(chunks);
          const contentType = res.headers['content-type'] || 'image/jpeg';
          resolve({ buffer, contentType });
        });
        res.on('error', reject);
      });

      request.on('error', reject);
      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Download timeout'));
      });
    });
  }

  /**
   * Upload image to WordPress media library
   */
  async uploadToWordPress(imageBuffer, filename, contentType, altText) {
    if (!this.wpAppPassword) {
      console.warn('⚠️ WORDPRESS_APP_PASSWORD not set, skipping WordPress upload');
      return null;
    }

    return new Promise((resolve, reject) => {
      const form = new FormData();
      form.append('file', imageBuffer, {
        filename: filename,
        contentType: contentType
      });
      form.append('alt_text', altText);
      form.append('caption', `${altText} - Photo: Afrique Sports`);

      const auth = Buffer.from(`${this.wpUsername}:${this.wpAppPassword}`).toString('base64');

      const url = new URL(`${this.wpApiUrl}/media`);

      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname,
        method: 'POST',
        headers: {
          ...form.getHeaders(),
          'Authorization': `Basic ${auth}`
        }
      };

      const protocol = url.protocol === 'https:' ? https : http;

      const req = protocol.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              const json = JSON.parse(data);
              resolve({
                id: json.id,
                url: json.source_url,
                width: json.media_details?.width,
                height: json.media_details?.height
              });
            } else {
              reject(new Error(`WordPress upload failed: ${res.statusCode} - ${data}`));
            }
          } catch (err) {
            reject(new Error(`Parse error: ${err.message}`));
          }
        });
      });

      req.on('error', reject);
      form.pipe(req);
    });
  }

  /**
   * Get or fetch player image
   * Returns WordPress media URL if uploaded, or original URL
   */
  async getPlayerImage(playerName, team = '', nationality = '', options = {}) {
    const cacheKey = this.getCacheKey(playerName, team);
    const forceRefresh = options.forceRefresh || false;

    // Check cache first
    if (!forceRefresh && this.cache[cacheKey]) {
      console.log(`   📦 Using cached image for ${playerName}`);
      return this.cache[cacheKey];
    }

    try {
      // Search for HD images
      const images = await this.searchPlayerImage(playerName, team, nationality);

      if (!images || images.length === 0) {
        console.log(`   ❌ No images found for ${playerName}`);
        return null;
      }

      // Try to download and upload each candidate until success
      for (const img of images) {
        try {
          console.log(`   📥 Downloading: ${img.original?.substring(0, 60)}...`);

          const { buffer, contentType } = await this.downloadImage(img.original);

          // Generate filename
          const ext = contentType.includes('png') ? 'png' : 'jpg';
          const slug = playerName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          const filename = `player-${slug}-${Date.now()}.${ext}`;

          // Upload to WordPress
          console.log(`   📤 Uploading to WordPress: ${filename}`);
          const wpMedia = await this.uploadToWordPress(
            buffer,
            filename,
            contentType,
            `${playerName} - ${team}`
          );

          if (wpMedia) {
            const result = {
              url: wpMedia.url,
              wpId: wpMedia.id,
              width: wpMedia.width || img.original_width,
              height: wpMedia.height || img.original_height,
              source: 'wordpress',
              originalSource: img.source,
              fetchedAt: new Date().toISOString()
            };

            // Cache the result
            this.cache[cacheKey] = result;
            this.saveCache();

            console.log(`   ✅ Image uploaded: ${wpMedia.url}`);
            return result;
          }
        } catch (err) {
          console.warn(`   ⚠️ Failed with this image: ${err.message}`);
          continue; // Try next candidate
        }
      }

      // If WordPress upload fails, return the best original URL
      const bestImage = images[0];
      const result = {
        url: bestImage.original,
        width: bestImage.original_width,
        height: bestImage.original_height,
        source: 'external',
        originalSource: bestImage.source,
        fetchedAt: new Date().toISOString()
      };

      this.cache[cacheKey] = result;
      this.saveCache();

      return result;

    } catch (err) {
      console.error(`   ❌ Error fetching image for ${playerName}:`, err.message);
      return null;
    }
  }

  /**
   * Batch fetch images for multiple players
   */
  async fetchImagesForPlayers(players, options = {}) {
    const results = {};
    const concurrency = options.concurrency || 2; // Limit concurrent requests
    const delay = options.delay || 1000; // Delay between batches (ms)

    console.log(`\n🖼️ Fetching HD images for ${players.length} players...`);

    for (let i = 0; i < players.length; i += concurrency) {
      const batch = players.slice(i, i + concurrency);

      const promises = batch.map(player =>
        this.getPlayerImage(
          player.name,
          player.team || player.currentClub,
          player.nationality
        ).then(result => ({ player, result }))
      );

      const batchResults = await Promise.all(promises);

      for (const { player, result } of batchResults) {
        results[player.name] = result;
      }

      // Progress
      console.log(`   Progress: ${Math.min(i + concurrency, players.length)}/${players.length}`);

      // Delay between batches to avoid rate limiting
      if (i + concurrency < players.length) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    console.log(`✅ Fetched ${Object.keys(results).filter(k => results[k]).length}/${players.length} images\n`);
    return results;
  }

  /**
   * Get Transfermarkt fallback URL
   */
  getTransfermarktUrl(transfermarktId) {
    if (!transfermarktId) return null;
    return `https://img.a.transfermarkt.technology/portrait/big/${transfermarktId}-1.jpg`;
  }

  /**
   * Get best available image URL for player
   * Tries: WordPress cache -> SerpAPI search -> Transfermarkt fallback
   */
  async getBestImageUrl(playerName, team, nationality, transfermarktId, options = {}) {
    const cacheKey = this.getCacheKey(playerName, team);

    // 1. Check cache
    if (this.cache[cacheKey]?.url) {
      return this.cache[cacheKey].url;
    }

    // 2. Try SerpAPI search + WordPress upload
    if (!options.skipSearch) {
      const result = await this.getPlayerImage(playerName, team, nationality, options);
      if (result?.url) {
        return result.url;
      }
    }

    // 3. Fallback to Transfermarkt
    const tmUrl = this.getTransfermarktUrl(transfermarktId);
    if (tmUrl) {
      console.log(`   ↩️ Fallback to Transfermarkt: ${playerName}`);
      return tmUrl;
    }

    return null;
  }
}

module.exports = PlayerImageFetcher;
