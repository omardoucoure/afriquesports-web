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
};
const WORDPRESS_API_PATH = "/wp-json/wp/v2/posts";
const WORDPRESS_CATEGORIES_PATH = "/wp-json/wp/v2/categories";

// Helper to get base URL for locale
function getWordPressBaseUrl(locale?: string): string {
  return WORDPRESS_API_BASES[locale || "fr"] || WORDPRESS_API_BASES.fr;
}
const DEFAULT_PER_PAGE = "20";
const DEFAULT_EMBED = "true";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// Cloudflare/server error codes that should trigger retry
const RETRYABLE_STATUS_CODES = [
  520, 521, 522, 523, 524, 525, 526, 527, 530, 502, 503, 504,
];

export class DataFetcher {
  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Retry wrapper for fetch with exponential backoff
   * Handles transient Cloudflare errors (520, 521, etc.) and server errors
   */
  private static async fetchWithRetry(
    url: string,
    options: RequestInit,
    retries: number = MAX_RETRIES
  ): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await fetch(url, options);

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
        lastError = error as Error;
        // Network errors - retry with backoff
        if (attempt < retries - 1) {
          const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
          console.warn(
            `[DataFetcher] Network error fetching ${url}, retrying in ${delay}ms (attempt ${attempt + 1}/${retries}): ${lastError.message}`
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

    // DEVELOPMENT: Always add cache-busting timestamp in development
    const isDev = process.env.NODE_ENV === "development";
    if (isDev || options?.cache === "no-store") {
      searchParams.set("_t", Date.now().toString());
    }

    // Build URL based on locale (each locale has its own WordPress site)
    const baseUrl = getWordPressBaseUrl(locale);
    const fullUrl = `${baseUrl}${WORDPRESS_API_PATH}?${searchParams.toString()}`;

    const fetchOptions: RequestInit = {
      cache: isDev ? "no-store" : options?.cache || "no-store",
      headers: {
        Accept: "application/json",
        "Accept-Charset": "utf-8",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://cms.realdemadrid.com/afriquesports/",
        "Origin": "https://cms.realdemadrid.com",
        "Cache-Control": isDev ? "no-cache, no-store, must-revalidate" : "",
        Pragma: isDev ? "no-cache" : "",
        ...options?.headers,
      },
    };

    // Use retry wrapper for WordPress API calls (handles 520 errors)
    const response = await this.fetchWithRetry(fullUrl, fetchOptions);

    if (!response.ok) {
      throw new Error(`Failed to fetch posts: ${response.status}`);
    }

    const data = await response.json();
    return data as WordPressPost[];
  }

  /**
   * Fetch a single post by slug
   */
  static async fetchPostBySlug(
    slug: string,
    locale?: string,
    options?: FetchOptions
  ): Promise<WordPressPost | null> {
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
  }

  /**
   * Fetch posts by category slug
   */
  static async fetchPostsByCategory(
    categorySlug: string,
    params?: Record<string, string>,
    options?: FetchOptions
  ): Promise<WordPressPost[]> {
    const locale = params?.locale;

    // First, get the category ID from the slug (pass locale for correct site)
    const categories = await this.fetchCategories({ slug: categorySlug, ...(locale && { locale }) });

    if (categories.length === 0) {
      return [];
    }

    const categoryId = categories[0].id;

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

    const isDev = process.env.NODE_ENV === "development";
    const fetchOptions: RequestInit = {
      cache: isDev ? "no-store" : options?.cache || "force-cache",
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
