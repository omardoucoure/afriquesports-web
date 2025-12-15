import type { Metadata } from "next";
import type { WordPressPost } from "./data-fetcher";
import { stripHtml, getFeaturedImageUrl, getAuthorName, getCategoryLabel } from "./utils";

const SITE_URL = "https://www.afriquesports.net";
const SITE_NAME = "Afrique Sports";
const DEFAULT_LOCALE = "fr";

/**
 * Generate metadata for an article page
 */
export function generateArticleMetadata(
  article: WordPressPost,
  category: string
): Metadata {
  const title = stripHtml(article.title.rendered);
  const description = stripHtml(article.excerpt.rendered).slice(0, 160);
  const imageUrl = getFeaturedImageUrl(article, "full");
  const authorName = getAuthorName(article);
  const categoryLabel = getCategoryLabel(article);
  const articleUrl = `${SITE_URL}/${category}/${article.slug}`;

  return {
    title,
    description,
    authors: [{ name: authorName }],
    creator: authorName,
    publisher: SITE_NAME,
    alternates: {
      canonical: articleUrl,
    },
    openGraph: {
      title,
      description,
      type: "article",
      siteName: SITE_NAME,
      publishedTime: article.date,
      modifiedTime: article.modified,
      authors: [authorName],
      section: categoryLabel,
      images: imageUrl
        ? [
            {
              url: imageUrl,
              width: 1200,
              height: 630,
              alt: title,
            },
          ]
        : [],
      url: articleUrl,
      locale: DEFAULT_LOCALE,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
      creator: "@afriquesports",
      site: "@afriquesports",
    },
    robots: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
    other: {
      "article:published_time": article.date,
      "article:modified_time": article.modified,
      "article:author": authorName,
      "article:section": categoryLabel,
    },
  };
}

/**
 * Generate metadata for a category page
 */
export function generateCategoryMetadata(
  slug: string,
  title: string,
  description: string,
  page: number = 1
): Metadata {
  const categoryUrl = `${SITE_URL}/category/${slug}`;
  const pageTitle = page > 1 ? `${title} - Page ${page}` : title;

  return {
    title: pageTitle,
    description,
    alternates: {
      canonical: page > 1 ? `${categoryUrl}?page=${page}` : categoryUrl,
    },
    openGraph: {
      title: `${pageTitle} | ${SITE_NAME}`,
      description,
      type: "website",
      siteName: SITE_NAME,
      url: categoryUrl,
      locale: DEFAULT_LOCALE,
    },
    twitter: {
      card: "summary",
      title: `${pageTitle} | ${SITE_NAME}`,
      description,
      creator: "@afriquesports",
      site: "@afriquesports",
    },
    robots: {
      index: page === 1, // Only index first page
      follow: true,
    },
  };
}

/**
 * Generate JSON-LD for NewsArticle schema
 */
export function generateArticleJsonLd(
  article: WordPressPost,
  category: string
) {
  const title = stripHtml(article.title.rendered);
  const description = stripHtml(article.excerpt.rendered);
  const imageUrl = getFeaturedImageUrl(article, "full");
  const authorName = getAuthorName(article);
  const articleUrl = `${SITE_URL}/${category}/${article.slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: title,
    description,
    image: imageUrl,
    datePublished: article.date,
    dateModified: article.modified,
    author: {
      "@type": "Person",
      name: authorName,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo.png`,
        width: 600,
        height: 60,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl,
    },
    isAccessibleForFree: true,
  };
}

/**
 * Generate JSON-LD for WebSite schema (for homepage)
 */
export function generateWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description:
      "Toute l'actualité du football africain et européen. CAN 2025, mercato, résultats et classements.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo.png`,
      },
      sameAs: [
        "https://facebook.com/afriquesports",
        "https://twitter.com/afriquesports",
        "https://instagram.com/afriquesports",
        "https://youtube.com/@afriquesports",
        "https://tiktok.com/@afriquesports",
      ],
    },
  };
}

/**
 * Generate JSON-LD for Organization schema
 */
export function generateOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/logo.png`,
      width: 600,
      height: 60,
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+221-77-868-32-00",
      contactType: "customer service",
      areaServed: "Worldwide",
      availableLanguage: ["French", "English", "Spanish"],
    },
    sameAs: [
      "https://facebook.com/afriquesports",
      "https://twitter.com/afriquesports",
      "https://instagram.com/afriquesports",
      "https://youtube.com/@afriquesports",
      "https://tiktok.com/@afriquesports",
    ],
    address: {
      "@type": "PostalAddress",
      addressLocality: "Dakar",
      addressCountry: "SN",
    },
  };
}

/**
 * Generate JSON-LD for BreadcrumbList schema
 */
export function generateBreadcrumbJsonLd(
  items: Array<{ label: string; href: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: `${SITE_URL}${item.href}`,
    })),
  };
}
