/**
 * Player Data Cache
 *
 * SQLite-based cache for scraped player data
 * - Stores player data with 24-hour TTL
 * - Avoids re-scraping the same players multiple times
 * - Tracks scraping success/failure for retry logic
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class PlayerDataCache {
  constructor(dbPath = null) {
    // Default to scripts/data/player-cache.db
    this.dbPath = dbPath || path.join(__dirname, '../data/player-cache.db');

    // Ensure data directory exists
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = null;
    this.cacheTTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  }

  /**
   * Initialize database connection and create tables
   */
  async init() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Failed to open database:', err);
          reject(err);
          return;
        }

        console.log(`✅ Connected to player cache database: ${this.dbPath}`);

        // Create tables
        this.db.run(`
          CREATE TABLE IF NOT EXISTS player_cache (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_name TEXT NOT NULL,
            player_name_normalized TEXT NOT NULL,
            player_data TEXT,
            success INTEGER NOT NULL,
            errors TEXT,
            scraped_at INTEGER NOT NULL,
            expires_at INTEGER NOT NULL,
            UNIQUE(player_name_normalized)
          )
        `, (err) => {
          if (err) {
            console.error('Failed to create table:', err);
            reject(err);
            return;
          }

          // Create index on normalized name and expiration
          this.db.run(`
            CREATE INDEX IF NOT EXISTS idx_player_name_normalized
            ON player_cache(player_name_normalized, expires_at)
          `, (err) => {
            if (err) {
              console.error('Failed to create index:', err);
              reject(err);
            } else {
              console.log('✅ Player cache tables ready');
              resolve();
            }
          });
        });
      });
    });
  }

  /**
   * Normalize player name for cache key
   * (lowercase, remove accents, trim spaces)
   */
  normalizeName(name) {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .trim();
  }

  /**
   * Get player data from cache if not expired
   */
  async get(playerName) {
    const normalized = this.normalizeName(playerName);
    const now = Date.now();

    return new Promise((resolve, reject) => {
      this.db.get(`
        SELECT player_data, success, errors, scraped_at
        FROM player_cache
        WHERE player_name_normalized = ?
          AND expires_at > ?
      `, [normalized, now], (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        if (!row) {
          resolve(null); // Cache miss
          return;
        }

        // Parse cached data
        const cached = {
          playerName,
          success: row.success === 1,
          data: row.player_data ? JSON.parse(row.player_data) : null,
          errors: row.errors ? JSON.parse(row.errors) : [],
          cachedAt: new Date(row.scraped_at).toISOString(),
        };

        console.log(`💾 Cache HIT for ${playerName}`);
        resolve(cached);
      });
    });
  }

  /**
   * Store player data in cache
   */
  async set(playerName, playerData) {
    const normalized = this.normalizeName(playerName);
    const now = Date.now();
    const expiresAt = now + this.cacheTTL;

    return new Promise((resolve, reject) => {
      this.db.run(`
        INSERT OR REPLACE INTO player_cache
        (player_name, player_name_normalized, player_data, success, errors, scraped_at, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        playerName,
        normalized,
        playerData.data ? JSON.stringify(playerData.data) : null,
        playerData.success ? 1 : 0,
        JSON.stringify(playerData.errors || []),
        now,
        expiresAt,
      ], (err) => {
        if (err) {
          reject(err);
          return;
        }

        console.log(`💾 Cached data for ${playerName} (expires in 24h)`);
        resolve();
      });
    });
  }

  /**
   * Get multiple players from cache
   */
  async getMultiple(playerNames) {
    const results = [];

    for (const name of playerNames) {
      const cached = await this.get(name);
      results.push({ playerName: name, cached });
    }

    return results;
  }

  /**
   * Clean up expired cache entries
   */
  async cleanup() {
    const now = Date.now();

    return new Promise((resolve, reject) => {
      this.db.run(`
        DELETE FROM player_cache
        WHERE expires_at <= ?
      `, [now], function (err) {
        if (err) {
          reject(err);
          return;
        }

        console.log(`🗑️  Cleaned up ${this.changes} expired cache entries`);
        resolve(this.changes);
      });
    });
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    return new Promise((resolve, reject) => {
      this.db.get(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful,
          SUM(CASE WHEN expires_at > ? THEN 1 ELSE 0 END) as valid
        FROM player_cache
      `, [Date.now()], (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        resolve({
          total: row.total || 0,
          successful: row.successful || 0,
          valid: row.valid || 0,
          expired: (row.total || 0) - (row.valid || 0),
        });
      });
    });
  }

  /**
   * Close database connection
   */
  async close() {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }

      this.db.close((err) => {
        if (err) {
          reject(err);
          return;
        }

        console.log('✅ Database connection closed');
        resolve();
      });
    });
  }
}

module.exports = PlayerDataCache;
