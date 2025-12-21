import { NextResponse } from "next/server";

/**
 * Pages Sitemap
 * Route: /sitemaps/pages.xml
 *
 * Lists all static pages (home, contact, privacy, rankings, CAN 2025, etc.)
 */

// Use edge runtime for faster response
export const runtime = "edge";

// Revalidate every 24 hours
export const revalidate = 86400;

const SITE_URL = "https://www.afriquesports.net";
const LOCALES = ["fr", "en", "es", "ar"];

// Static pages with their priority values
// Priority: 1.0 = most important, 0.5 = least important (for Bing/Yandex)
const STATIC_PAGES = [
  { path: "/", priority: 1.0 }, // Homepage - highest priority
  { path: "/can-2025", priority: 0.9 }, // CAN 2025 - hot topic, very important
  { path: "/classements", priority: 0.9 }, // Rankings - important feature
  { path: "/contact", priority: 0.5 }, // Contact - low priority
  { path: "/confidentialite", priority: 0.5 }, // Privacy - low priority
];

export async function GET() {
  const lastmod = new Date().toISOString().split("T")[0];

  const urlEntries: string[] = [];

  for (const page of STATIC_PAGES) {
    // Generate hreflang links for each locale
    const hreflangs = LOCALES.map((locale) => {
      const href = locale === "fr"
        ? `${SITE_URL}${page.path}`
        : `${SITE_URL}/${locale}${page.path}`;
      return `<xhtml:link rel="alternate" hreflang="${locale}" href="${href}" />`;
    }).join("\n");

    // French (default) URL
    urlEntries.push(`<url>
<loc>${SITE_URL}${page.path}</loc>
<lastmod>${lastmod}</lastmod>
<priority>${page.priority.toFixed(1)}</priority>
${hreflangs}
<xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}${page.path}" />
</url>`);

    // English URL
    urlEntries.push(`<url>
<loc>${SITE_URL}/en${page.path}</loc>
<lastmod>${lastmod}</lastmod>
<priority>${page.priority.toFixed(1)}</priority>
${hreflangs}
<xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}${page.path}" />
</url>`);

    // Spanish URL
    urlEntries.push(`<url>
<loc>${SITE_URL}/es${page.path}</loc>
<lastmod>${lastmod}</lastmod>
<priority>${page.priority.toFixed(1)}</priority>
${hreflangs}
<xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}${page.path}" />
</url>`);

    // Arabic URL
    urlEntries.push(`<url>
<loc>${SITE_URL}/ar${page.path}</loc>
<lastmod>${lastmod}</lastmod>
<priority>${page.priority.toFixed(1)}</priority>
${hreflangs}
<xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}${page.path}" />
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
      "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000",
      "CDN-Cache-Control": "public, max-age=604800",
      "Vercel-CDN-Cache-Control": "public, max-age=604800",
    },
  });
}
