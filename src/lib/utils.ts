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
  return "/images/placeholder.jpg";
}

/**
 * Get optimized image URL with width and quality parameters
 */
export function getOptimizedImageUrl(
  url: string,
  width: number = 800,
  quality: number = 80
): string {
  if (!url) return "/images/placeholder.jpg";

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
 */
export function getArticleUrl(post: WordPressPost): string {
  const categorySlug = getCategorySlug(post);
  return `/${categorySlug}/${post.slug}`;
}

/**
 * Author ID to name mapping (source database user IDs to display names)
 */
const AUTHOR_MAP: Record<number, string> = {
  1: "Ousmane Ba",
  6: "Momar Touré",
  7: "Carinos Satya",
  36: "Noyine Touré",
  38: "Birane Bassoum",
  57: "Sobour Magadji",
  73: "Omar Doucouré",
  88: "Équipe Youtube",
  97: "Josué",
  103: "Boris Adakanou",
  109: "Sakho Malick",
  110: "Sidy Touré",
  111: "Diop",
  115: "Sada",
  116: "Edouard Agbetou",
  118: "Dianga",
  119: "Ibrahim",
  120: "Cakpo",
  121: "Pascal",
  122: "Ouattara",
};

/**
 * Get author name from a post
 */
export function getAuthorName(post: WordPressPost): string {
  // First try embedded author data
  const author = post._embedded?.author?.[0];
  if (author?.name && !author.name.includes("invalid")) {
    return author.name;
  }

  // Fallback to author ID mapping
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
