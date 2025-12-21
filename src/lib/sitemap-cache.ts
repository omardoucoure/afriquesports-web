/**
 * Sitemap Cache System
 *
 * Smart caching strategy:
 * 1. Uses in-memory cache with TTL
 * 2. Relies on Vercel Edge caching (CDN level) for primary caching
 * 3. WordPress API responses are cached via Next.js fetch cache
 * 4. Trigger regeneration via webhook when WordPress publishes
 *
 * The actual heavy caching happens at the CDN level via Cache-Control headers.
 * This in-memory cache reduces redundant API calls within the same edge function.
 */

export interface SitemapPost {
  slug: string;
  category: string;
  modified: string;
  publishDate?: string; // For calculating priority based on freshness
  title?: string; // Article title for news sitemap
}

export interface SitemapCache {
  posts: SitemapPost[];
  totalPosts: number;
  lastUpdated: string;
  version: number;
}

const CACHE_KEY_PREFIX = "sitemap";
const CACHE_VERSION = 1;
const POSTS_PER_PAGE = 100; // WordPress API limit

// In-memory cache with TTL
const memoryCache = new Map<string, { data: unknown; expires: number }>();

function getFromCache<T>(key: string): T | null {
  const cached = memoryCache.get(key);
  if (cached && cached.expires > Date.now()) {
    return cached.data as T;
  }
  // Clean up expired entry
  if (cached) {
    memoryCache.delete(key);
  }
  return null;
}

function setInCache<T>(key: string, value: T, ttlSeconds: number): void {
  memoryCache.set(key, {
    data: value,
    expires: Date.now() + ttlSeconds * 1000,
  });
}

/**
 * Get total post count with caching
 */
export async function getCachedPostCount(): Promise<number> {
  const cacheKey = `${CACHE_KEY_PREFIX}:post-count`;
  const cached = getFromCache<number>(cacheKey);

  if (cached !== null) {
    return cached;
  }

  try {
    const response = await fetch(
      "https://cms.realdemadrid.com/afriquesports/wp-json/wp/v2/posts?per_page=1",
      { next: { revalidate: 3600 } }
    );
    const total = parseInt(response.headers.get("x-wp-total") || "135000", 10);

    // Cache for 6 hours
    setInCache(cacheKey, total, 21600);
    return total;
  } catch (error) {
    console.error("Error fetching post count:", error);
    return 135000; // Fallback
  }
}

/**
 * Fetch posts for a specific sitemap page with caching
 */
export async function getCachedSitemapPosts(
  page: number,
  perPage: number = 1000,
  locale: string = "fr"
): Promise<SitemapPost[]> {
  const cacheKey = `${CACHE_KEY_PREFIX}:posts:${locale}:${page}:v${CACHE_VERSION}`;
  const cached = getFromCache<SitemapPost[]>(cacheKey);

  if (cached !== null) {
    return cached;
  }

  // Fetch from WordPress API
  const posts = await fetchSitemapPosts(page, perPage, locale);

  // Cache for 12 hours (posts don't change URLs often)
  setInCache(cacheKey, posts, 43200);

  return posts;
}

/**
 * Fetch posts from WordPress API for sitemap
 * Optimized to only get required fields
 */
async function fetchSitemapPosts(
  page: number,
  perPage: number,
  locale: string
): Promise<SitemapPost[]> {
  const baseUrls: Record<string, string> = {
    fr: "https://cms.realdemadrid.com/afriquesports",
    en: "https://cms.realdemadrid.com/afriquesports-en",
    es: "https://cms.realdemadrid.com/afriquesports-es",
    ar: "https://cms.realdemadrid.com/afriquesports-ar",
  };

  const baseUrl = baseUrls[locale] || baseUrls.fr;
  const allPosts: SitemapPost[] = [];

  // WordPress API returns max 100 per page, so we need to paginate
  const apiPages = Math.ceil(perPage / POSTS_PER_PAGE);
  const startOffset = (page - 1) * perPage;

  for (let i = 0; i < apiPages; i++) {
    const apiPage = Math.floor(startOffset / POSTS_PER_PAGE) + i + 1;

    try {
      const response = await fetch(
        `${baseUrl}/wp-json/wp/v2/posts?per_page=${POSTS_PER_PAGE}&page=${apiPage}&_fields=slug,modified,link,date,_embedded&_embed&orderby=id&order=asc`,
        {
          next: { revalidate: 3600 },
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 400) break; // No more pages
        throw new Error(`API error: ${response.status}`);
      }

      const posts = await response.json();

      for (const post of posts) {
        // Get category slug from embedded data
        let category = "football"; // default fallback

        if (post._embedded && post._embedded["wp:term"] && post._embedded["wp:term"][0]) {
          const primaryCategory = post._embedded["wp:term"][0][0];
          if (primaryCategory && primaryCategory.slug) {
            category = primaryCategory.slug;
          }
        }

        allPosts.push({
          slug: post.slug,
          category,
          modified: post.modified,
          publishDate: post.date,
        });
      }

      // If we got fewer than expected, we've reached the end
      if (posts.length < POSTS_PER_PAGE) break;
    } catch (error) {
      console.error(`Error fetching sitemap posts page ${apiPage}:`, error);
      break;
    }
  }

  return allPosts;
}

/**
 * Get categories with caching
 */
export async function getCachedCategories(): Promise<Array<{ slug: string; modified: string }>> {
  const cacheKey = `${CACHE_KEY_PREFIX}:categories:v${CACHE_VERSION}`;
  const cached = getFromCache<Array<{ slug: string; modified: string }>>(cacheKey);

  if (cached !== null) {
    return cached;
  }

  try {
    const response = await fetch(
      "https://cms.realdemadrid.com/afriquesports/wp-json/wp/v2/categories?per_page=100&_fields=slug",
      { next: { revalidate: 86400 } }
    );

    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const categories = await response.json();
    const result = categories.map((cat: { slug: string }) => ({
      slug: cat.slug,
      modified: new Date().toISOString(),
    }));

    // Cache for 24 hours (categories rarely change)
    setInCache(cacheKey, result, 86400);

    return result;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

/**
 * Get recent posts for news sitemap (last 48 hours)
 */
export async function getRecentPostsForNews(locale: string = "fr"): Promise<SitemapPost[]> {
  const cacheKey = `${CACHE_KEY_PREFIX}:news:${locale}:v${CACHE_VERSION}`;
  const cached = getFromCache<SitemapPost[]>(cacheKey);

  if (cached !== null) {
    return cached;
  }

  const baseUrls: Record<string, string> = {
    fr: "https://cms.realdemadrid.com/afriquesports",
    en: "https://cms.realdemadrid.com/afriquesports-en",
    es: "https://cms.realdemadrid.com/afriquesports-es",
    ar: "https://cms.realdemadrid.com/afriquesports-ar",
  };

  const baseUrl = baseUrls[locale] || baseUrls.fr;

  // Get posts from last 48 hours
  const twoDaysAgo = new Date();
  twoDaysAgo.setHours(twoDaysAgo.getHours() - 48);
  const afterDate = twoDaysAgo.toISOString();

  try {
    const allPosts: SitemapPost[] = [];
    let page = 1;
    const maxPages = 10; // Max 1000 posts for news sitemap

    while (page <= maxPages) {
      const response = await fetch(
        `${baseUrl}/wp-json/wp/v2/posts?per_page=100&page=${page}&after=${afterDate}&_fields=slug,modified,link,date,title,_embedded&_embed&orderby=date&order=desc`,
        { next: { revalidate: 300 } } // Revalidate every 5 minutes for news
      );

      if (!response.ok) break;

      const posts = await response.json();
      if (posts.length === 0) break;

      for (const post of posts) {
        // Get category slug from embedded data
        let category = "football"; // default fallback

        if (post._embedded && post._embedded["wp:term"] && post._embedded["wp:term"][0]) {
          const primaryCategory = post._embedded["wp:term"][0][0];
          if (primaryCategory && primaryCategory.slug) {
            category = primaryCategory.slug;
          }
        }

        allPosts.push({
          slug: post.slug,
          category,
          modified: post.date, // Use publish date for news sitemap
          publishDate: post.date, // For priority calculation
          title: post.title?.rendered || post.title, // Include title for news sitemap
        });
      }

      if (posts.length < 100) break;
      page++;
    }

    // Cache for 15 minutes (news sitemap needs to be fresh)
    setInCache(cacheKey, allPosts, 900);

    return allPosts;
  } catch (error) {
    console.error("Error fetching news posts:", error);
    return [];
  }
}

/**
 * Invalidate cache for a specific type
 */
export async function invalidateSitemapCache(type: "posts" | "categories" | "news" | "all"): Promise<void> {
  // Clear in-memory cache based on type
  const keysToDelete: string[] = [];

  for (const key of memoryCache.keys()) {
    if (type === "all") {
      keysToDelete.push(key);
    } else if (type === "posts" && key.includes(":posts:")) {
      keysToDelete.push(key);
    } else if (type === "categories" && key.includes(":categories:")) {
      keysToDelete.push(key);
    } else if (type === "news" && key.includes(":news:")) {
      keysToDelete.push(key);
    }
  }

  for (const key of keysToDelete) {
    memoryCache.delete(key);
  }

  // Also clear post count cache
  if (type === "all" || type === "posts") {
    memoryCache.delete(`${CACHE_KEY_PREFIX}:post-count`);
  }
}

/**
 * Calculate sitemap priority based on content freshness
 *
 * SEO Best Practices 2025:
 * - Google ignores <priority> but Bing/Yandex use it
 * - Fresh content = higher priority for better crawl allocation
 * - News sites benefit from prioritizing recent articles
 *
 * Priority scale:
 * - 1.0: Homepage, key landing pages
 * - 0.9: Articles < 7 days old (fresh news)
 * - 0.8: Articles 7-30 days old (recent)
 * - 0.7: Articles 30-90 days old
 * - 0.6: Articles 90-180 days old
 * - 0.5: Articles > 180 days old (evergreen)
 */
export function calculatePriority(publishDate: string): number {
  const ageInDays = (Date.now() - new Date(publishDate).getTime()) / (1000 * 60 * 60 * 24);

  if (ageInDays < 7) return 0.9; // Fresh news
  if (ageInDays < 30) return 0.8; // Recent
  if (ageInDays < 90) return 0.7;
  if (ageInDays < 180) return 0.6;
  return 0.5; // Evergreen
}
