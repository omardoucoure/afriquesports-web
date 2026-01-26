import { NextResponse } from "next/server";

/**
 * CAN 2025 Sitemap
 * Route: /sitemaps/can-2025.xml
 *
 * High-priority sitemap for all CAN 2025 related content
 * Updated frequently for tournament coverage
 */

// Use edge runtime for faster response
export const runtime = "edge";

// Revalidate every hour during tournament
export const revalidate = 3600;

const SITE_URL = "https://www.afriquesports.net";
const LOCALES = ["fr", "en", "es", "ar"];

// CAN 2025 specific pages
const CAN_PAGES = [
  "/can-2025",
  "/category/can-2025",
];

// Country team pages (for "liste [pays] can 2025" keywords)
const COUNTRY_TEAMS = [
  "/category/afrique/senegal",
  "/category/afrique/maroc",
  "/category/afrique/algerie",
  "/category/afrique/nigeria",
  "/category/afrique/egypte",
  "/category/afrique/cameroun",
  "/category/afrique/cote-divoire",
  "/category/afrique/ghana",
  "/category/afrique/mali",
  "/category/afrique/rdc",
  "/category/afrique/tunisie",
];

export async function GET() {
  const lastmod = new Date().toISOString();

  try {
    // Fetch recent CAN 2025 articles from WordPress
    const response = await fetch(
      "https://www.afriquesports.net/wp-json/wp/v2/posts?per_page=100&categories=30616&_fields=slug,modified,link,_embedded&_embed",
      { next: { revalidate: 3600 } }
    );

    let canArticles: Array<{ slug: string; category: string; modified: string }> = [];

    if (response.ok) {
      const posts = await response.json();
      canArticles = posts.map((post: { slug: string; modified: string; link: string; _embedded?: any }) => {
        // Get category slug from embedded data
        let category = "can-2025"; // default fallback

        if (post._embedded && post._embedded["wp:term"] && post._embedded["wp:term"][0]) {
          const primaryCategory = post._embedded["wp:term"][0][0];
          if (primaryCategory && primaryCategory.slug) {
            category = primaryCategory.slug;
          }
        }

        return {
          slug: post.slug,
          category,
          modified: post.modified,
        };
      });
    }

    const urlEntries: string[] = [];

    // Add CAN 2025 main pages with hreflang
    for (const page of [...CAN_PAGES, ...COUNTRY_TEAMS]) {
      const hreflangs = LOCALES.map((locale) => {
        const href = locale === "fr" ? `${SITE_URL}${page}` : `${SITE_URL}/${locale}${page}`;
        return `<xhtml:link rel="alternate" hreflang="${locale}" href="${href}" />`;
      }).join("\n");

      urlEntries.push(`<url>
<loc>${SITE_URL}${page}</loc>
<lastmod>${lastmod.split("T")[0]}</lastmod>
<priority>0.9</priority>
${hreflangs}
<xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}${page}" />
</url>`);
    }

    // Add CAN 2025 articles
    for (const article of canArticles) {
      const url = `${SITE_URL}/${article.category}/${article.slug}`;
      const hreflangs = LOCALES.map((locale) => {
        const href = locale === "fr" ? url : `${SITE_URL}/${locale}/${article.category}/${article.slug}`;
        return `<xhtml:link rel="alternate" hreflang="${locale}" href="${href}" />`;
      }).join("\n");

      urlEntries.push(`<url>
<loc>${url}</loc>
<lastmod>${new Date(article.modified).toISOString()}</lastmod>
<priority>0.9</priority>
${hreflangs}
<xhtml:link rel="alternate" hreflang="x-default" href="${url}" />
</url>`);
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="${SITE_URL}/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlEntries.join("\n")}
</urlset>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=7200, stale-while-revalidate=86400",
        "CDN-Cache-Control": "public, max-age=7200",
      },
    });
  } catch (error) {
    console.error("Error generating CAN 2025 sitemap:", error);
    return new NextResponse("Error generating sitemap", { status: 500 });
  }
}
