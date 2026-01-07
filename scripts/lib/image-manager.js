/**
 * Image Manager - Intelligent player image handler
 *
 * Features:
 * 1. Search WordPress uploads for existing player images
 * 2. Download from reliable sources if not found
 * 3. Upload to WordPress media library
 * 4. Cache image URLs to avoid re-downloading
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class ImageManager {
  constructor() {
    this.wpServer = '159.223.103.16';
    this.wpUrl = 'cms.realdemadrid.com/afriquesports';
    this.uploadDir = '/var/www/html/wp-content/uploads/sites/8'; // Multisite blog ID 8
    this.imageCache = {}; // In-memory cache
  }

  /**
   * Main method: Get image URL for a player
   * @param {string} playerName - Player name (e.g., "Pedri", "Jude Bellingham")
   * @param {string} club - Player's club (e.g., "Barcelona", "Real Madrid")
   * @returns {Promise<string>} - Image URL
   */
  async getPlayerImage(playerName, club) {
    console.log(`📸 Getting image for ${playerName} (${club})...`);

    // Step 1: Check cache
    const cacheKey = this.normalizePlayerName(playerName);
    if (this.imageCache[cacheKey]) {
      console.log(`   ✅ Cache hit: ${this.imageCache[cacheKey]}`);
      return this.imageCache[cacheKey];
    }

    // Step 2: Search WordPress uploads
    const existingUrl = await this.searchWordPressUploads(playerName);
    if (existingUrl) {
      console.log(`   ✅ Found in WordPress: ${existingUrl}`);
      this.imageCache[cacheKey] = existingUrl;
      return existingUrl;
    }

    // Step 3: Download from external source
    console.log(`   🌐 Downloading from external source...`);
    const downloadedPath = await this.downloadPlayerImage(playerName, club);

    if (!downloadedPath) {
      console.log(`   ⚠️  No image found, using fallback`);
      return this.getFallbackImage();
    }

    // Step 4: Upload to WordPress
    const uploadedUrl = await this.uploadToWordPress(downloadedPath, playerName);

    if (uploadedUrl) {
      console.log(`   ✅ Uploaded to WordPress: ${uploadedUrl}`);
      this.imageCache[cacheKey] = uploadedUrl;
      return uploadedUrl;
    }

    return this.getFallbackImage();
  }

  /**
   * Search WordPress uploads for existing player images
   */
  async searchWordPressUploads(playerName) {
    try {
      const normalized = this.normalizePlayerName(playerName);

      // Search patterns: player-name.jpg, player-name-*.jpg, etc.
      const searchPatterns = [
        normalized,
        normalized.replace(/-/g, '_'),
        normalized.replace(/-/g, ''),
        playerName.toLowerCase().replace(/\s+/g, '-'),
        playerName.toLowerCase().replace(/\s+/g, '_'),
      ];

      for (const pattern of searchPatterns) {
        // Search for original images first (exclude WordPress auto-generated sizes like -150x150, -300x200, etc.)
        const cmd = `ssh root@${this.wpServer} "find ${this.uploadDir} -type f \\( -iname '*${pattern}.jpg' -o -iname '*${pattern}.png' -o -iname '*${pattern}.jpeg' \\) ! -name '*-[0-9]*x[0-9]*.*' | head -1"`;

        const result = execSync(cmd, { encoding: 'utf-8' }).trim();

        if (result) {
          // Convert server path to URL
          // Use WordPress backend URL for multisite images
          const relativePath = result.replace('/var/www/html/wp-content/uploads', '');
          return `https://cms.realdemadrid.com/wp-content/uploads${relativePath}`;
        }
      }

      return null;
    } catch (error) {
      console.error(`   ⚠️  Search error: ${error.message}`);
      return null;
    }
  }

  /**
   * Download player image from external sources
   */
  async downloadPlayerImage(playerName, club) {
    try {
      const normalized = this.normalizePlayerName(playerName);
      const tmpPath = `/tmp/${normalized}.jpg`;

      // Source 1: Try Wikipedia API (free, legal to use)
      const wikiSuccess = await this.tryWikipediaImage(playerName, tmpPath);
      if (wikiSuccess) return tmpPath;

      // Source 2: Try Wikimedia Commons search (more images than Wikipedia)
      const commonsSuccess = await this.tryWikimediaCommons(playerName, tmpPath);
      if (commonsSuccess) return tmpPath;

      // Source 3: Try Getty Images embed URLs (for display, not download - legal embed)
      const gettyUrl = await this.tryGettyImagesEmbed(playerName, club);
      if (gettyUrl) {
        // Getty allows embedding via their URLs, download the embed image
        try {
          execSync(`curl -sL "${gettyUrl}" -o "${tmpPath}" --max-time 15`);
          if (fs.existsSync(tmpPath) && fs.statSync(tmpPath).size > 5000) {
            console.log(`   ✅ Downloaded Getty embed image`);
            return tmpPath;
          }
        } catch (error) {
          console.log(`   ⚠️  Getty download failed: ${error.message}`);
        }
      }

      console.log(`   ⚠️  No external image found from any source`);
      return null;
    } catch (error) {
      console.error(`   ⚠️  Download error: ${error.message}`);
      return null;
    }
  }

  /**
   * Try downloading from Wikipedia
   */
  async tryWikipediaImage(playerName, tmpPath) {
    try {
      // Try multiple Wikipedia search variations
      const searchTerms = [
        `${playerName} (footballer)`,
        `${playerName} (soccer)`,
        playerName,
      ];

      for (const term of searchTerms) {
        console.log(`   🔍 Wikipedia: "${term}"...`);

        const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(term)}&prop=pageimages|pageterms&piprop=original&format=json`;

        const wikiResponse = execSync(`curl -sL "${wikiUrl}"`, {
          encoding: 'utf-8',
          maxBuffer: 1024 * 1024
        });

        const wikiData = JSON.parse(wikiResponse);
        const pages = wikiData.query?.pages;

        if (pages) {
          const pageId = Object.keys(pages)[0];
          const page = pages[pageId];

          // Check if page exists (pageId !== '-1')
          if (pageId !== '-1' && page.original?.source) {
            const imageUrl = page.original.source;
            console.log(`   ✅ Found Wikipedia image: ${imageUrl.substring(0, 60)}...`);

            execSync(`curl -sL "${imageUrl}" -o "${tmpPath}" --max-time 15`);

            if (fs.existsSync(tmpPath)) {
              const stats = fs.statSync(tmpPath);
              if (stats.size > 5000) {
                console.log(`   ✅ Downloaded: ${(stats.size / 1024).toFixed(0)} KB`);
                return true;
              }
            }
          }
        }
      }

      return false;
    } catch (error) {
      console.log(`   ⚠️  Wikipedia error: ${error.message}`);
      return false;
    }
  }

  /**
   * Try downloading from Wikimedia Commons
   */
  async tryWikimediaCommons(playerName, tmpPath) {
    try {
      console.log(`   🔍 Wikimedia Commons: "${playerName}"...`);

      // Search Wikimedia Commons for player images
      const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(playerName + ' football')}&srnamespace=6&format=json&srlimit=1`;

      const searchResponse = execSync(`curl -sL "${searchUrl}"`, {
        encoding: 'utf-8',
        maxBuffer: 1024 * 1024
      });

      const searchData = JSON.parse(searchResponse);
      const results = searchData.query?.search;

      if (results && results.length > 0) {
        const fileName = results[0].title.replace('File:', '');

        // Get image info
        const imageUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(fileName)}&prop=imageinfo&iiprop=url&iiurlwidth=1200&format=json`;

        const imageResponse = execSync(`curl -sL "${imageUrl}"`, {
          encoding: 'utf-8',
          maxBuffer: 1024 * 1024
        });

        const imageData = JSON.parse(imageResponse);
        const pages = imageData.query?.pages;

        if (pages) {
          const pageId = Object.keys(pages)[0];
          const imageInfo = pages[pageId]?.imageinfo?.[0];
          const thumbUrl = imageInfo?.thumburl || imageInfo?.url;

          if (thumbUrl) {
            console.log(`   ✅ Found Commons image: ${thumbUrl.substring(0, 60)}...`);

            execSync(`curl -sL "${thumbUrl}" -o "${tmpPath}" --max-time 15`);

            if (fs.existsSync(tmpPath)) {
              const stats = fs.statSync(tmpPath);
              if (stats.size > 5000) {
                console.log(`   ✅ Downloaded: ${(stats.size / 1024).toFixed(0)} KB`);
                return true;
              }
            }
          }
        }
      }

      return false;
    } catch (error) {
      console.log(`   ⚠️  Wikimedia Commons error: ${error.message}`);
      return false;
    }
  }

  /**
   * Try Getty Images embed (legal to use Getty's embed URLs)
   */
  async tryGettyImagesEmbed(playerName, club) {
    try {
      console.log(`   🔍 Getty Images: "${playerName}"...`);

      // Getty Images search API (note: this requires API key for production)
      // For now, we'll construct likely Getty embed URLs based on player name
      // Getty allows embedding their images via official embed codes

      // Alternative: Search Getty's editorial content
      const searchQuery = encodeURIComponent(`${playerName} ${club} football`);
      const searchUrl = `https://www.gettyimages.com/search/2/image?phrase=${searchQuery}&sort=best&mediatype=photography`;

      // Note: Getty requires proper attribution and embed code
      // This is a simplified version - production should use Getty's official embed API

      console.log(`   ⚠️  Getty Images requires API key (skipping for now)`);
      return null;

    } catch (error) {
      console.log(`   ⚠️  Getty error: ${error.message}`);
      return null;
    }
  }

  /**
   * Upload image to WordPress media library
   */
  async uploadToWordPress(imagePath, playerName) {
    try {
      const normalized = this.normalizePlayerName(playerName);
      const serverTmpPath = `/tmp/${normalized}.jpg`;

      // 1. Copy to server
      execSync(`scp "${imagePath}" root@${this.wpServer}:${serverTmpPath}`, {
        encoding: 'utf-8'
      });

      // 2. Import to WordPress media library using WP-CLI
      const cmd = `ssh root@${this.wpServer} "cd /var/www/html && wp media import ${serverTmpPath} --url=${this.wpUrl} --title='${playerName}' --allow-root --porcelain"`;

      const attachmentId = execSync(cmd, { encoding: 'utf-8' }).trim();

      if (!attachmentId || attachmentId.includes('Error')) {
        console.error(`   ⚠️  Upload failed: ${attachmentId}`);
        return null;
      }

      // 3. Get the uploaded image URL
      const urlCmd = `ssh root@${this.wpServer} "cd /var/www/html && wp post get ${attachmentId} --url=${this.wpUrl} --field=guid --allow-root"`;

      const imageUrl = execSync(urlCmd, { encoding: 'utf-8' }).trim();

      // 4. Cleanup temp files
      execSync(`ssh root@${this.wpServer} "rm -f ${serverTmpPath}"`);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }

      return imageUrl;
    } catch (error) {
      console.error(`   ⚠️  Upload error: ${error.message}`);
      return null;
    }
  }

  /**
   * Normalize player name for file naming
   */
  normalizePlayerName(name) {
    return name
      .toLowerCase()
      .replace(/[áàâä]/g, 'a')
      .replace(/[éèêë]/g, 'e')
      .replace(/[íìîï]/g, 'i')
      .replace(/[óòôö]/g, 'o')
      .replace(/[úùûü]/g, 'u')
      .replace(/ñ/g, 'n')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Get fallback image URL
   */
  getFallbackImage() {
    // Use a generic football image from existing uploads
    // This should be a neutral football-related image
    return 'https://www.afriquesports.net/wp-content/uploads/sites/8/2026/01/AP25234498643766-1024x576.jpg';
  }

  /**
   * Batch process multiple players
   */
  async getPlayerImages(players) {
    const results = {};

    for (const player of players) {
      try {
        const imageUrl = await this.getPlayerImage(player.name, player.club);
        results[player.name] = imageUrl;
      } catch (error) {
        console.error(`Error processing ${player.name}: ${error.message}`);
        results[player.name] = this.getFallbackImage();
      }
    }

    return results;
  }
}

module.exports = ImageManager;
