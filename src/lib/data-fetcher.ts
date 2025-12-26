// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface FetchOptions {
  cache?: RequestCache;
  revalidate?: number;
  headers?: Record<string, string>;
}

export interface WordPressPost {
  id: number;
  date: string;
  date_gmt: string;
  modified: string;
  modified_gmt: string;
  slug: string;
  status: string;
  type: string;
  link: string;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
    protected: boolean;
  };
  excerpt: {
    rendered: string;
    protected: boolean;
  };
  author: number;
  featured_media: number;
  comment_status: string;
  ping_status: string;
  sticky: boolean;
  template: string;
  format: string;
  categories: number[];
  tags: number[];
  jetpack_featured_media_url?: string;
  _embedded?: {
    "wp:featuredmedia"?: Array<{
      id: number;
      source_url: string;
      alt_text: string;
      media_details?: {
        width: number;
        height: number;
        sizes?: Record<
          string,
          {
            source_url: string;
            width: number;
            height: number;
          }
        >;
      };
    }>;
    "wp:term"?: Array<
      Array<{
        id: number;
        name: string;
        slug: string;
      }>
    >;
    author?: Array<{
      id: number;
      name: string;
      avatar_urls?: Record<string, string>;
    }>;
  };
}

export interface WordPressCategory {
  id: number;
  count: number;
  description: string;
  link: string;
  name: string;
  slug: string;
  parent: number;
}

// Type alias for client-side use
export type WPPost = WordPressPost;

// ============================================================================
// CONSTANTS
// ============================================================================

// WordPress API base URLs per locale
const WORDPRESS_API_BASES: Record<string, string> = {
  fr: "https://cms.realdemadrid.com/afriquesports",
  en: "https://cms.realdemadrid.com/afriquesports-en",
  es: "https://cms.realdemadrid.com/afriquesports-es",
  ar: "https://cms.realdemadrid.com/afriquesports-ar",
};
const WORDPRESS_API_PATH = "/wp-json/wp/v2/posts";
const WORDPRESS_CATEGORIES_PATH = "/wp-json/wp/v2/categories";

// Helper to get base URL for locale
function getWordPressBaseUrl(locale?: string): string {
  return WORDPRESS_API_BASES[locale || "fr"] || WORDPRESS_API_BASES.fr;
}
const DEFAULT_PER_PAGE = "20";
const DEFAULT_EMBED = "true";
const MAX_RETRIES = 2; // Reduced from 3 to minimize retry storm
const RETRY_DELAY_MS = 2000; // Increased from 1000ms
const FETCH_TIMEOUT_MS = 30000; // Increased to 30 seconds to reduce retries during server load

// Cloudflare/server error codes that should trigger retry
const RETRYABLE_STATUS_CODES = [
  403, 429, // Add 403 (Forbidden) and 429 (Rate Limit) for Cloudflare
  500, // Internal Server Error (transient overload)
  502, 503, 504, // Gateway errors
  520, 521, 522, 523, 524, 525, 526, 527, 530, // Cloudflare errors
];

// Category ID cache - maps slug to ID for common categories
// This eliminates the extra API call to look up category IDs
// IDs are the same across all locales (fr/en/es)
const CATEGORY_ID_CACHE: Record<string, number> = {
  "afrique-sports-tv": 9791,
  "article-du-jour": 30615,
  "mercato": 102205,
  "can-2025": 121425,
  // Add more commonly used categories here as needed
};

export class DataFetcher {
  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Retry wrapper for fetch with exponential backoff and timeout
   * Handles transient Cloudflare errors (520, 521, etc.) and server errors
   * Each request has a 10-second timeout to prevent hanging
   */
  private static async fetchWithRetry(
    url: string,
    options: RequestInit,
    retries: number = MAX_RETRIES
  ): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < retries; attempt++) {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        // If it's a retryable error and we have retries left, wait and retry
        if (
          RETRYABLE_STATUS_CODES.includes(response.status) &&
          attempt < retries - 1
        ) {
          const delay = RETRY_DELAY_MS * Math.pow(2, attempt); // Exponential backoff
          console.warn(
            `[DataFetcher] Retryable error ${response.status} from ${url}, retrying in ${delay}ms (attempt ${attempt + 1}/${retries})`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        lastError = error as Error;

        // Check if it's a timeout error
        const isTimeout = error instanceof Error && error.name === 'AbortError';
        const errorType = isTimeout ? 'Timeout' : 'Network error';

        // Retry with backoff
        if (attempt < retries - 1) {
          const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
          console.warn(
            `[DataFetcher] ${errorType} fetching ${url}, retrying in ${delay}ms (attempt ${attempt + 1}/${retries}): ${lastError.message}`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw (
      lastError || new Error(`Failed to fetch ${url} after ${retries} attempts`)
    );
  }

  // ============================================================================
  // PUBLIC API METHODS
  // ============================================================================

  /**
   * Fetch posts from WordPress API
   * Supports locale parameter for multilingual content
   */
  static async fetchPosts(
    params?: Record<string, string>,
    options?: FetchOptions
  ): Promise<WordPressPost[]> {
    const locale = params?.locale;

    // Remove locale from params since it's handled by URL selection
    const filteredParams = { ...params };
    delete filteredParams.locale;

    // Set defaults
    if (!filteredParams.per_page) {
      filteredParams.per_page = DEFAULT_PER_PAGE;
    }
    if (!filteredParams._embed) {
      filteredParams._embed = DEFAULT_EMBED;
    }
    // CRITICAL: Always order by date (newest first) unless explicitly overridden
    if (!filteredParams.orderby) {
      filteredParams.orderby = "date";
    }
    if (!filteredParams.order) {
      filteredParams.order = "desc";
    }

    const searchParams = new URLSearchParams(filteredParams);

    // Build URL based on locale (each locale has its own WordPress site)
    const baseUrl = getWordPressBaseUrl(locale);
    const fullUrl = `${baseUrl}${WORDPRESS_API_PATH}?${searchParams.toString()}`;

    // Build fetch options
    // - Only set cache if explicitly provided (e.g., "no-store" for dynamic data)
    // - Otherwise, let Next.js automatically handle caching based on page's `export const revalidate`
    // - This allows ISR (Incremental Static Regeneration) to work correctly
    const fetchOptions: RequestInit = {
      // Only include cache if explicitly provided, otherwise let Next.js handle it
      ...(options?.cache && { cache: options.cache }),
      // Use Next.js revalidate option if provided
      ...(options?.revalidate !== undefined && { next: { revalidate: options.revalidate } }),
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Charset": "utf-8",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://cms.realdemadrid.com/afriquesports/",
        "Origin": "https://cms.realdemadrid.com",
        "sec-ch-ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
        ...options?.headers,
      },
    };

    try {
      // Use retry wrapper for WordPress API calls (handles 520 errors)
      const response = await this.fetchWithRetry(fullUrl, fetchOptions);

      if (!response.ok) {
        // Log the error but don't expose sensitive details
        console.error(`[DataFetcher] Failed to fetch posts: ${response.status} from ${fullUrl}`);
        throw new Error(`Failed to fetch posts: ${response.status}`);
      }

      const data = await response.json();
      return data as WordPressPost[];
    } catch (error) {
      console.error(`[DataFetcher] Error in fetchPosts:`, error);
      // Re-throw to allow calling code to handle it
      throw error;
    }
  }

  /**
   * Fetch a single post by slug
   */
  static async fetchPostBySlug(
    slug: string,
    locale?: string,
    options?: FetchOptions
  ): Promise<WordPressPost | null> {
    try {
      const posts = await this.fetchPosts(
        {
          slug,
          locale: locale || "fr",
          per_page: "1",
          _embed: "true",
        },
        options
      );

      return posts.length > 0 ? posts[0] : null;
    } catch (error) {
      console.error(`[DataFetcher] Error fetching post by slug "${slug}":`, error);
      // Return null instead of throwing to prevent 500 errors
      // The calling code should handle null gracefully (show 404 page)
      return null;
    }
  }

  /**
   * Fetch posts by category slug
   * Uses cached category IDs when available to avoid extra API call
   */
  static async fetchPostsByCategory(
    categorySlug: string,
    params?: Record<string, string>,
    options?: FetchOptions
  ): Promise<WordPressPost[]> {
    const locale = params?.locale;
    let categoryId: number;

    // Check cache first - saves ~0.3s per request
    if (CATEGORY_ID_CACHE[categorySlug]) {
      categoryId = CATEGORY_ID_CACHE[categorySlug];
    } else {
      // Fallback: fetch category ID from API
      const categories = await this.fetchCategories({ slug: categorySlug, ...(locale && { locale }) });

      if (categories.length === 0) {
        return [];
      }

      categoryId = categories[0].id;
    }

    return this.fetchPosts(
      {
        ...params,
        categories: categoryId.toString(),
      },
      options
    );
  }

  /**
   * Fetch categories from WordPress API
   */
  static async fetchCategories(
    params?: Record<string, string>,
    options?: FetchOptions
  ): Promise<WordPressCategory[]> {
    const locale = params?.locale;
    const filteredParams = { ...params };
    delete filteredParams.locale;

    const searchParams = new URLSearchParams({
      per_page: "100",
      ...filteredParams,
    });

    const baseUrl = getWordPressBaseUrl(locale);
    const fullUrl = `${baseUrl}${WORDPRESS_CATEGORIES_PATH}?${searchParams.toString()}`;

    const fetchOptions: RequestInit = {
      // Categories rarely change, use force-cache by default for better performance
      // But allow override via options
      cache: options?.cache || "force-cache",
      ...(options?.revalidate !== undefined && { next: { revalidate: options.revalidate } }),
      headers: {
        Accept: "application/json",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        ...options?.headers,
      },
    };

    const response = await this.fetchWithRetry(fullUrl, fetchOptions);

    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Search posts
   */
  static async searchPosts(
    query: string,
    params?: Record<string, string>,
    options?: FetchOptions
  ): Promise<WordPressPost[]> {
    return this.fetchPosts(
      {
        ...params,
        search: query,
      },
      options
    );
  }
}
