import { NextResponse } from "next/server";
import { getCachedCategories } from "@/lib/sitemap-cache";

/**
 * Categories Sitemap
 * Route: /sitemaps/categories.xml
 *
 * Lists all category pages with hreflang for multilingual support
 */

// Use edge runtime for faster response
export const runtime = "edge";

// Revalidate every 24 hours (categories rarely change)
export const revalidate = 86400;

const SITE_URL = "https://www.afriquesports.net";
const LOCALES = ["fr", "en", "es", "ar"];

// Main category mappings
const MAIN_CATEGORIES = [
  { slug: "afrique", path: "/category/afrique" },
  { slug: "europe", path: "/category/europe" },
  { slug: "can-2025", path: "/category/can-2025" },
  { slug: "mercato", path: "/category/mercato" },
  { slug: "youtube", path: "/category/youtube" },
  { slug: "football", path: "/category/football" },
];

// Country subcategories
const COUNTRY_CATEGORIES = [
  "senegal",
  "cameroun",
  "cote-divoire",
  "algerie",
  "maroc",
  "rdc",
  "nigeria",
  "egypte",
  "ghana",
  "mali",
  "tunisie",
];

export async function GET() {
  const lastmod = new Date().toISOString().split("T")[0];

  try {
    // Also fetch dynamic categories from WordPress
    const wpCategories = await getCachedCategories();

    const allUrls: string[] = [];

    // Add main categories
    for (const cat of MAIN_CATEGORIES) {
      const hreflangs = LOCALES.map((locale) => {
        const href = locale === "fr" ? `${SITE_URL}${cat.path}` : `${SITE_URL}/${locale}${cat.path}`;
        return `<xhtml:link rel="alternate" hreflang="${locale}" href="${href}" />`;
      }).join("\n");

      allUrls.push(`<url>
<loc>${SITE_URL}${cat.path}</loc>
<lastmod>${lastmod}</lastmod>
<priority>0.8</priority>
${hreflangs}
<xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}${cat.path}" />
</url>`);
    }

    // Add country subcategories
    for (const country of COUNTRY_CATEGORIES) {
      const path = `/category/afrique/${country}`;
      const hreflangs = LOCALES.map((locale) => {
        const href = locale === "fr" ? `${SITE_URL}${path}` : `${SITE_URL}/${locale}${path}`;
        return `<xhtml:link rel="alternate" hreflang="${locale}" href="${href}" />`;
      }).join("\n");

      allUrls.push(`<url>
<loc>${SITE_URL}${path}</loc>
<lastmod>${lastmod}</lastmod>
<priority>0.8</priority>
${hreflangs}
<xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}${path}" />
</url>`);
    }

    // Add WordPress categories not in our static list
    const staticSlugs = new Set([
      ...MAIN_CATEGORIES.map((c) => c.slug),
      ...COUNTRY_CATEGORIES,
    ]);

    for (const cat of wpCategories) {
      if (!staticSlugs.has(cat.slug)) {
        const path = `/category/${cat.slug}`;
        allUrls.push(`<url>
<loc>${SITE_URL}${path}</loc>
<lastmod>${lastmod}</lastmod>
<priority>0.7</priority>
</url>`);
      }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="${SITE_URL}/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${allUrls.join("\n")}
</urlset>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000",
        "CDN-Cache-Control": "public, max-age=604800",
      },
    });
  } catch (error) {
    console.error("Error generating categories sitemap:", error);
    return new NextResponse("Error generating sitemap", { status: 500 });
  }
}
