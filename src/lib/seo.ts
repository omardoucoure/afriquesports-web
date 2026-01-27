import type { Metadata } from "next";
import type { WordPressPost } from "./data-fetcher";
import { stripHtml, getFeaturedImageUrl, getAuthorName, getCategoryLabel } from "./utils";

const SITE_URL = "https://www.afriquesports.net";
const SITE_NAME = "Afrique Sports";
const DEFAULT_LOCALE = "fr";

/**
 * Get optimized og:image URL via Next.js Image Optimization
 * This ensures images are cached and handles special characters in filenames
 */
function getOgImageUrl(imageUrl: string | undefined): string {
  if (!imageUrl) {
    return `${SITE_URL}/opengraph-image`;
  }

  // Use Next.js Image Optimization API for external images
  // This caches images on the CDN and normalizes URLs
  const encodedUrl = encodeURIComponent(imageUrl);
  return `${SITE_URL}/_next/image?url=${encodedUrl}&w=1200&q=75`;
}

/**
 * High-value SEO keywords for African football - researched for 2025
 */
export const SEO_KEYWORDS = {
  primary: [
    "football africain",
    "african football",
    "CAN 2025",
    "AFCON 2025",
    "Coupe d'Afrique des Nations",
    "Africa Cup of Nations",
  ],
  players: [
    "Mohamed Salah",
    "Victor Osimhen",
    "Achraf Hakimi",
    "Sadio Mané",
    "Riyad Mahrez",
    "Kalidou Koulibaly",
    "Nicolas Jackson",
    "Ademola Lookman",
    "Mohammed Kudus",
    "Edouard Mendy",
  ],
  countries: [
    "Sénégal football",
    "Maroc football",
    "Algérie football",
    "Cameroun football",
    "Nigeria football",
    "Côte d'Ivoire football",
    "Égypte football",
    "Ghana football",
    "Tunisie football",
    "RDC football",
  ],
  competitions: [
    "CAN 2025 Maroc",
    "AFCON 2025 Morocco",
    "CAF Champions League",
    "Ligue des Champions CAF",
    "éliminatoires CAN",
    "qualifications Coupe du Monde",
    "World Cup qualifiers Africa",
  ],
  topics: [
    "mercato africain",
    "transferts joueurs africains",
    "actualités foot africain",
    "résultats football afrique",
    "classements championnats africains",
    "buteurs africains Europe",
    "african players in Europe",
  ],
};

/**
 * Category-specific keywords for better targeting
 */
export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  afrique: [
    "football africain",
    "actualités foot afrique",
    "CAN 2025",
    "équipes nationales africaines",
    "championnats africains",
    "CAF",
  ],
  senegal: [
    "équipe Sénégal football",
    "Lions de la Teranga",
    "Sadio Mané",
    "Édouard Mendy",
    "Kalidou Koulibaly",
    "Nicolas Jackson",
    "fédération sénégalaise football",
  ],
  maroc: [
    "équipe Maroc football",
    "Lions de l'Atlas",
    "Achraf Hakimi",
    "Hakim Ziyech",
    "Youssef En-Nesyri",
    "CAN 2025 Maroc hôte",
    "FRMF",
  ],
  algerie: [
    "équipe Algérie football",
    "Les Fennecs",
    "Riyad Mahrez",
    "Ismaël Bennacer",
    "FAF",
    "championnat Algérie",
  ],
  cameroun: [
    "équipe Cameroun football",
    "Lions Indomptables",
    "André-Frank Zambo Anguissa",
    "Karl Toko Ekambi",
    "FECAFOOT",
  ],
  nigeria: [
    "Super Eagles Nigeria",
    "Victor Osimhen",
    "Ademola Lookman",
    "Mohammed Kudus",
    "Nigerian football",
    "NFF",
  ],
  egypte: [
    "équipe Égypte football",
    "Pharaons",
    "Mohamed Salah",
    "EFA",
    "Al Ahly",
    "Zamalek",
  ],
  "cote-divoire": [
    "équipe Côte d'Ivoire football",
    "Éléphants",
    "Sébastien Haller",
    "Franck Kessié",
    "CAN 2023 champion",
    "FIF",
  ],
  "can-2025": [
    "CAN 2025",
    "AFCON 2025",
    "Coupe d'Afrique des Nations 2025",
    "CAN Maroc 2025",
    "calendrier CAN 2025",
    "groupes CAN 2025",
    "pronostics CAN 2025",
  ],
  mercato: [
    "mercato africain",
    "transferts joueurs africains",
    "rumeurs transferts afrique",
    "indiscrétions mercato",
    "officialisations transferts",
  ],
  europe: [
    "joueurs africains Europe",
    "africains Ligue 1",
    "africains Premier League",
    "africains Liga",
    "africains Serie A",
    "africains Bundesliga",
  ],
};

/**
 * Generate metadata for an article page with enhanced SEO
 */
export function generateArticleMetadata(
  article: WordPressPost,
  category: string,
  locale: string = DEFAULT_LOCALE
): Metadata {
  const title = stripHtml(article.title.rendered);
  const description = stripHtml(article.excerpt.rendered).slice(0, 160);
  const imageUrl = getFeaturedImageUrl(article, "full");
  const authorName = getAuthorName(article);
  const categoryLabel = getCategoryLabel(article);
  const articleUrl = `${SITE_URL}/${category}/${article.slug}`;

  // Get category-specific keywords
  const categoryKeywords = CATEGORY_KEYWORDS[category] || CATEGORY_KEYWORDS.afrique;

  return {
    title,
    description,
    authors: [{ name: authorName }],
    creator: authorName,
    publisher: SITE_NAME,
    keywords: [...categoryKeywords, ...SEO_KEYWORDS.primary.slice(0, 3)],
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
      tags: categoryKeywords,
      images: [
        {
          url: getOgImageUrl(imageUrl),
          width: 1200,
          height: 630,
          alt: title,
          type: "image/jpeg",
        },
      ],
      url: articleUrl,
      locale: locale === "fr" ? "fr_FR" : locale === "en" ? "en_US" : locale === "ar" ? "ar_SA" : "es_ES",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: getOgImageUrl(imageUrl), alt: title }],
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
      "article:tag": categoryKeywords.join(", "),
    },
  };
}

/**
 * Generate metadata for a category page with enhanced SEO
 */
export function generateCategoryMetadata(
  slug: string,
  title: string,
  description: string,
  page: number = 1,
  locale: string = DEFAULT_LOCALE
): Metadata {
  const categoryUrl = `${SITE_URL}/category/${slug}`;
  const pageTitle = page > 1 ? `${title} - Page ${page}` : title;
  const categoryKeywords = CATEGORY_KEYWORDS[slug] || CATEGORY_KEYWORDS.afrique;

  return {
    title: pageTitle,
    description,
    keywords: categoryKeywords,
    alternates: {
      canonical: page > 1 ? `${categoryUrl}?page=${page}` : categoryUrl,
    },
    openGraph: {
      title: `${pageTitle} | ${SITE_NAME}`,
      description,
      type: "website",
      siteName: SITE_NAME,
      url: categoryUrl,
      locale: locale === "fr" ? "fr_FR" : locale === "en" ? "en_US" : locale === "ar" ? "ar_SA" : "es_ES",
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
 * Generate enhanced JSON-LD for NewsArticle schema
 */
export function generateArticleJsonLd(
  article: WordPressPost,
  category: string
) {
  const title = stripHtml(article.title.rendered);
  const description = stripHtml(article.excerpt.rendered);
  const articleBody = stripHtml(article.content.rendered);
  const imageUrl = getFeaturedImageUrl(article, "full");
  const authorName = getAuthorName(article);
  const categoryLabel = getCategoryLabel(article);
  const articleUrl = `${SITE_URL}/${category}/${article.slug}`;
  const categoryKeywords = CATEGORY_KEYWORDS[category] || [];

  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "@id": `${articleUrl}#article`,
    headline: title,
    description,
    articleBody: articleBody.slice(0, 5000), // Truncate for schema
    image: {
      "@type": "ImageObject",
      url: getOgImageUrl(imageUrl),
      width: 1200,
      height: 630,
    },
    datePublished: article.date,
    dateModified: article.modified,
    author: {
      "@type": "Person",
      name: authorName,
      // Note: Author URL removed until author pages are implemented (avoiding 404s)
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo.jpg`,
        width: 600,
        height: 60,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl,
    },
    articleSection: categoryLabel,
    keywords: categoryKeywords.join(", "),
    inLanguage: "fr-FR",
    isAccessibleForFree: true,
    copyrightHolder: {
      "@type": "Organization",
      name: SITE_NAME,
    },
    copyrightYear: new Date(article.date).getFullYear(),
  };
}

/**
 * Generate JSON-LD for WebSite schema (for homepage)
 */
export function generateWebsiteJsonLd(locale: string = "fr") {
  const siteNames: Record<string, string> = {
    fr: "Afrique Sports - Actualités Football Africain",
    en: "Afrique Sports - African Football News",
    es: "Afrique Sports - Noticias Fútbol Africano",
  };

  const descriptions: Record<string, string> = {
    fr: "Toute l'actualité du football africain : CAN 2025, mercato, résultats, classements. Mohamed Salah, Victor Osimhen, Achraf Hakimi et plus.",
    en: "All African football news: AFCON 2025, transfers, results, standings. Mohamed Salah, Victor Osimhen, Achraf Hakimi and more.",
    es: "Todas las noticias del fútbol africano: CAN 2025, mercado, resultados, clasificaciones. Mohamed Salah, Victor Osimhen, Achraf Hakimi y más.",
  };

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: siteNames[locale] || siteNames.fr,
    alternateName: "Afrique Sports",
    url: SITE_URL,
    description: descriptions[locale] || descriptions.fr,
    inLanguage: locale === "fr" ? "fr-FR" : locale === "en" ? "en-US" : "es-ES",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    publisher: {
      "@id": `${SITE_URL}/#organization`,
    },
  };
}

/**
 * Generate JSON-LD for NewsMediaOrganization schema
 */
export function generateOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    alternateName: "AS",
    url: SITE_URL,
    description: "Premier média francophone spécialisé dans l'actualité du football africain. CAN 2025, mercato, résultats, classements et plus.",
    foundingDate: "2020",
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/logo.png`,
      width: 600,
      height: 60,
    },
    image: {
      "@type": "ImageObject",
      url: `${SITE_URL}/opengraph-image`,
      width: 1200,
      height: 630,
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: "+221-77-868-32-00",
        contactType: "customer service",
        areaServed: ["FR", "SN", "MA", "DZ", "CM", "CI", "NG", "EG", "GH", "TN"],
        availableLanguage: ["French", "English", "Spanish"],
      },
    ],
    sameAs: [
      "https://facebook.com/afriquesports",
      "https://twitter.com/afriquesports",
      "https://instagram.com/afriquesports",
      "https://youtube.com/@afriquesports",
      "https://tiktok.com/@afriquesports",
      "https://news.google.com/publications/afriquesports",
    ],
    address: {
      "@type": "PostalAddress",
      addressLocality: "Dakar",
      addressRegion: "Dakar",
      addressCountry: "SN",
    },
    areaServed: {
      "@type": "GeoShape",
      name: "Worldwide with focus on Africa and French-speaking countries",
    },
    knowsAbout: [
      "African Football",
      "AFCON",
      "CAN",
      "CAF Champions League",
      "African Players in Europe",
      "Football Transfer News",
    ],
    publishingPrinciples: `${SITE_URL}/a-propos`,
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

/**
 * Generate JSON-LD for VideoObject schema (for articles with videos)
 */
export function generateVideoJsonLd(video: {
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string;
  duration?: string;
  contentUrl?: string;
  embedUrl?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: video.name,
    description: video.description,
    thumbnailUrl: video.thumbnailUrl,
    uploadDate: video.uploadDate,
    duration: video.duration || "PT5M",
    contentUrl: video.contentUrl,
    embedUrl: video.embedUrl,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo.jpg`,
      },
    },
  };
}

/**
 * Generate JSON-LD for SportsEvent schema (for match coverage)
 */
export function generateSportsEventJsonLd(event: {
  name: string;
  startDate: string;
  location: string;
  homeTeam: string;
  awayTeam: string;
  competition?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: event.name,
    startDate: event.startDate,
    location: {
      "@type": "Place",
      name: event.location,
    },
    homeTeam: {
      "@type": "SportsTeam",
      name: event.homeTeam,
    },
    awayTeam: {
      "@type": "SportsTeam",
      name: event.awayTeam,
    },
    superEvent: event.competition ? {
      "@type": "SportsEvent",
      name: event.competition,
    } : undefined,
    organizer: {
      "@type": "Organization",
      name: "CAF - Confédération Africaine de Football",
    },
  };
}

/**
 * Generate JSON-LD for FAQPage schema
 */
export function generateFaqJsonLd(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/**
 * Generate JSON-LD for ItemList schema (for category pages)
 */
export function generateItemListJsonLd(
  articles: Array<{ title: string; url: string; image?: string; position: number }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: articles.map((article) => ({
      "@type": "ListItem",
      position: article.position,
      item: {
        "@type": "NewsArticle",
        headline: article.title,
        url: article.url,
        image: article.image,
      },
    })),
  };
}

/**
 * Get full keywords array for a specific page type
 */
export function getPageKeywords(pageType: string, category?: string): string[] {
  const baseKeywords = [...SEO_KEYWORDS.primary];

  if (category && CATEGORY_KEYWORDS[category]) {
    return [...CATEGORY_KEYWORDS[category], ...baseKeywords];
  }

  switch (pageType) {
    case "home":
      return [
        ...baseKeywords,
        ...SEO_KEYWORDS.players.slice(0, 5),
        ...SEO_KEYWORDS.topics.slice(0, 3),
      ];
    case "mercato":
      return [...CATEGORY_KEYWORDS.mercato, ...baseKeywords];
    case "rankings":
      return [
        "classements football africain",
        "classement CAN 2025",
        "buteurs africains",
        "top scorers african",
        ...baseKeywords,
      ];
    default:
      return baseKeywords;
  }
}
