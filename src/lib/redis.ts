/**
 * Redis Client for Caching WordPress API Responses
 *
 * Dramatically improves performance by caching:
 * - WordPress REST API responses
 * - Post data
 * - Category data
 * - Sitemap data
 *
 * Expected improvements:
 * - API calls: 32s → 0.2s (160x faster)
 * - Homepage TTFB: 0.06s → 0.03s (2x faster)
 * - Article pages: 11-27s → 0.5s (50x faster)
 */

import Redis from 'ioredis';

// Singleton Redis client
let redis: Redis | null = null;

/**
 * Get or create Redis client
 * Uses lazy initialization to avoid connection issues during build
 */
export function getRedisClient(): Redis | null {
  // Skip Redis in development or if not configured
  if (process.env.NODE_ENV === 'development' && !process.env.REDIS_URL) {
    console.log('[Redis] Skipping in development (no REDIS_URL)');
    return null;
  }

  // Return existing client if available
  if (redis) {
    return redis;
  }

  // Create new client
  try {
    const redisUrl = process.env.REDIS_URL || process.env.KV_URL;

    if (!redisUrl) {
      console.warn('[Redis] No REDIS_URL or KV_URL configured - caching disabled');
      return null;
    }

    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true, // Don't connect immediately during build
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError: (err: Error) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          return true; // Reconnect on readonly errors
        }
        return false;
      },
    });

    // Handle connection events
    redis.on('connect', () => {
      console.log('[Redis] ✓ Connected successfully');
    });

    redis.on('error', (err: Error) => {
      console.error('[Redis] ✗ Connection error:', err.message);
      // Don't throw - fail gracefully without cache
    });

    redis.on('ready', () => {
      console.log('[Redis] ✓ Ready to accept commands');
    });

    // Connect immediately for runtime (not build time)
    if (process.env.NODE_ENV === 'production') {
      redis.connect().catch((err: Error) => {
        console.error('[Redis] Failed to connect:', err.message);
      });
    }

    return redis;
  } catch (error) {
    console.error('[Redis] Failed to create client:', error);
    return null;
  }
}

/**
 * Cache key generators for different data types
 */
export const CacheKeys = {
  post: (slug: string, locale: string) => `post:${locale}:${slug}`,
  posts: (params: Record<string, any>, locale: string) => {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    return `posts:${locale}:${sortedParams}`;
  },
  category: (slug: string, params: Record<string, any>, locale: string) => {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    return `category:${locale}:${slug}:${sortedParams}`;
  },
  sitemap: (type: string, page?: number) => {
    return page ? `sitemap:${type}:${page}` : `sitemap:${type}`;
  },
  apiResponse: (url: string) => `api:${url}`,
};

/**
 * Get cached data with automatic JSON parsing
 */
export async function getCached<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  if (!client) return null;

  try {
    const cached = await client.get(key);
    if (!cached) return null;

    return JSON.parse(cached) as T;
  } catch (error) {
    console.error(`[Redis] Error getting key ${key}:`, error);
    return null;
  }
}

/**
 * Set cached data with automatic JSON stringification
 * @param key Cache key
 * @param value Data to cache
 * @param ttl Time to live in seconds (default: 5 minutes)
 */
export async function setCached<T>(
  key: string,
  value: T,
  ttl: number = 300
): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;

  try {
    await client.setex(key, ttl, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`[Redis] Error setting key ${key}:`, error);
    return false;
  }
}

/**
 * Delete cached data
 */
export async function deleteCached(key: string): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;

  try {
    await client.del(key);
    return true;
  } catch (error) {
    console.error(`[Redis] Error deleting key ${key}:`, error);
    return false;
  }
}

/**
 * Delete multiple keys by pattern
 * @param pattern Redis key pattern (e.g., "posts:fr:*")
 */
export async function deleteCachedByPattern(pattern: string): Promise<number> {
  const client = getRedisClient();
  if (!client) return 0;

  try {
    const keys = await client.keys(pattern);
    if (keys.length === 0) return 0;

    await client.del(...keys);
    return keys.length;
  } catch (error) {
    console.error(`[Redis] Error deleting pattern ${pattern}:`, error);
    return 0;
  }
}

/**
 * Fetch with cache wrapper
 * Tries cache first, falls back to fetcher function
 *
 * @param key Cache key
 * @param fetcher Function to fetch data if not cached
 * @param ttl Time to live in seconds (default: 5 minutes)
 */
export async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300
): Promise<T> {
  // Try cache first
  const cached = await getCached<T>(key);
  if (cached !== null) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Redis] ✓ Cache HIT: ${key}`);
    }
    return cached;
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(`[Redis] ✗ Cache MISS: ${key}`);
  }

  // Fetch fresh data
  const data = await fetcher();

  // Cache for next time (fire and forget)
  setCached(key, data, ttl).catch((err: Error) => {
    console.error(`[Redis] Failed to cache ${key}:`, err);
  });

  return data;
}

/**
 * Cache TTL constants (in seconds)
 */
export const CacheTTL = {
  post: 300, // 5 minutes - posts don't change often
  posts: 180, // 3 minutes - listing pages update more frequently
  category: 180, // 3 minutes
  sitemap: 600, // 10 minutes - sitemaps are expensive to generate
  recentPosts: 120, // 2 minutes - news sitemap needs fresher data
  trendingPosts: 300, // 5 minutes - trending data
  apiResponse: 300, // 5 minutes - generic API responses
};

/**
 * Close Redis connection (for graceful shutdown)
 */
export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}
