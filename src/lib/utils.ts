import { clsx, type ClassValue } from "clsx";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { fr, enUS, es, arSA } from "date-fns/locale";
import type { WordPressPost } from "./data-fetcher";

/**
 * Merge class names with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Strip HTML tags from a string
 */
export function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .trim();
}

/**
 * Get locale for date-fns
 */
function getDateLocale(locale: string) {
  switch (locale) {
    case "en":
      return enUS;
    case "es":
      return es;
    case "ar":
      return arSA;
    default:
      return fr;
  }
}

/**
 * Format date for display
 */
export function formatDate(dateString: string, locale: string = "fr"): string {
  try {
    const date = parseISO(dateString);
    return format(date, "d MMMM yyyy", { locale: getDateLocale(locale) });
  } catch {
    return dateString;
  }
}

/**
 * Get relative date (e.g., "Il y a 2 heures")
 */
export function getRelativeDate(
  dateString: string,
  locale: string = "fr"
): string {
  try {
    const date = parseISO(dateString);
    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: getDateLocale(locale),
    });
  } catch {
    return dateString;
  }
}

/**
 * Get featured image URL from a WordPress post
 */
export function getFeaturedImageUrl(
  post: WordPressPost,
  size: "thumbnail" | "medium" | "medium_large" | "large" | "full" = "large"
): string {
  // First try jetpack_featured_media_url
  if (post.jetpack_featured_media_url) {
    return post.jetpack_featured_media_url;
  }

  // Then try embedded media
  const media = post._embedded?.["wp:featuredmedia"]?.[0];
  if (media) {
    // Try to get specific size
    const sizes = media.media_details?.sizes;
    if (sizes && sizes[size]) {
      return sizes[size].source_url;
    }
    // Fallback to source_url
    return media.source_url;
  }

  // Default placeholder
  return "/images/placeholder.svg";
}

/**
 * Get optimized image URL with width and quality parameters
 */
export function getOptimizedImageUrl(
  url: string,
  width: number = 800,
  quality: number = 80
): string {
  if (!url) return "/images/placeholder.svg";

  // If it's a WordPress image, add resize parameters
  if (url.includes("wp-content") || url.includes("i0.wp.com")) {
    // Use Jetpack Photon for optimization
    const baseUrl = url.replace(/^https?:\/\//, "");
    return `https://i0.wp.com/${baseUrl}?w=${width}&quality=${quality}`;
  }

  return url;
}

/**
 * Get category label from a post
 */
export function getCategoryLabel(
  post: WordPressPost,
  fallbackIndex: number = 0
): string {
  const categories = post._embedded?.["wp:term"]?.[0];
  if (categories && categories.length > 0) {
    return categories[0].name;
  }

  // Fallback categories
  const fallbackCategories = [
    "Football",
    "Afrique",
    "Europe",
    "Mercato",
    "CAN 2025",
  ];
  return fallbackCategories[fallbackIndex % fallbackCategories.length];
}

/**
 * Get category slug from a post
 */
export function getCategorySlug(post: WordPressPost): string {
  const categories = post._embedded?.["wp:term"]?.[0];
  if (categories && categories.length > 0) {
    return categories[0].slug;
  }
  return "actualites";
}

/**
 * Get category name from a post
 */
export function getCategoryName(post: WordPressPost): string {
  const categories = post._embedded?.["wp:term"]?.[0];
  if (categories && categories.length > 0) {
    return categories[0].name;
  }
  return "Actualités";
}

/**
 * Generate article URL based on the original permalink structure
 * Pattern: /{category}/{slug}
 * Note: Does NOT include locale prefix - next-intl Link handles that automatically
 */
export function getArticleUrl(post: WordPressPost): string {
  const categorySlug = getCategorySlug(post);
  return `/${categorySlug}/${post.slug}`;
}

/**
 * Validate that a URL is a relative path (not a full URL with protocol)
 * Returns true if valid relative path, false if full URL
 */
export function isRelativeUrl(url: string): boolean {
  if (!url) return false;
  // Check if URL starts with protocol (http://, https://, //)
  return !url.match(/^(https?:)?\/\//i);
}

/**
 * Sanitize a URL slug to ensure it's safe and properly formatted
 * Removes protocols, domain names, and ensures proper path format
 */
export function sanitizeSlug(slug: string): string {
  if (!slug) return '';

  // Remove any protocol and domain (e.g., "https://example.com/slug" -> "slug")
  let cleaned = slug.replace(/^(https?:)?\/\/[^/]+\//i, '');

  // Remove leading/trailing slashes
  cleaned = cleaned.replace(/^\/+|\/+$/g, '');

  // Remove any remaining special characters that shouldn't be in a slug
  cleaned = cleaned.replace(/[^a-z0-9-_/]/gi, '-');

  return cleaned;
}

/**
 * Extract category and slug from a full URL or path
 * Returns { category: string, slug: string } or null if invalid
 */
export function extractUrlParts(url: string): { category: string; slug: string } | null {
  if (!url) return null;

  try {
    // Remove protocol and domain if present
    let path = url.replace(/^(https?:)?\/\/[^/]+/i, '');

    // Remove leading/trailing slashes
    path = path.replace(/^\/+|\/+$/g, '');

    // Split by slash
    const parts = path.split('/').filter(Boolean);

    // We expect at least 2 parts: category and slug
    if (parts.length >= 2) {
      return {
        category: parts[parts.length - 2],
        slug: parts[parts.length - 1]
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Build a safe article URL from category and slug
 * Validates and sanitizes inputs to prevent malformed URLs
 * Note: Does NOT include locale prefix - next-intl Link handles that automatically
 */
export function buildArticleUrl(category: string, slug: string): string {
  const safeCategory = sanitizeSlug(category) || 'football';
  const safeSlug = sanitizeSlug(slug);

  if (!safeSlug) {
    console.warn('[buildArticleUrl] Invalid slug provided:', slug);
    return '/football';
  }

  return `/${safeCategory}/${safeSlug}`;
}

/**
 * Author ID to name mapping
 * IDs from WordPress multisite wp_users table (shared across all blogs)
 */
const AUTHOR_MAP: Record<number, string> = {
  1: "Afrique Sports",
  2: "Josué",
  3: "Pascal",
  4: "Ousmane Ba",
  5: "Momar Touré",
  6: "Carinos Satya",
  7: "Sobour Magadji",
  8: "Noyine Touré",
  9: "Birane Bassoum",
  10: "Boris Adakanou",
  11: "Sidy Touré",
  12: "Équipe Youtube",
  13: "Sakho Malick",
  14: "Noyine Bakayoko",
  15: "Afrique Sports",
  16: "Cakpo",
  17: "Ouattara",
  18: "Edouard Agbetou",
};

/**
 * Get author name from a post
 */
export function getAuthorName(post: WordPressPost): string {
  // Primary: use author_name field from REST API (added by mu-plugin)
  if (post.author_name) {
    return post.author_name;
  }

  // Fallback: try embedded author data
  const author = post._embedded?.author?.[0];
  if (author?.name && !author.name.includes("invalid")) {
    return author.name;
  }

  // Fallback: author ID mapping
  if (post.author && AUTHOR_MAP[post.author]) {
    return AUTHOR_MAP[post.author];
  }

  return "Afrique Sports";
}

/**
 * Truncate text to a maximum length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
}

/**
 * Generate slug from text
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Calculate reading time
 */
export function getReadingTime(content: string, locale: string = "fr"): string {
  const wordsPerMinute = 200;
  const text = stripHtml(content);
  const wordCount = text.split(/\s+/).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);

  const labels = {
    fr: `${minutes} min de lecture`,
    en: `${minutes} min read`,
    es: `${minutes} min de lectura`,
  };

  return labels[locale as keyof typeof labels] || labels.fr;
}
