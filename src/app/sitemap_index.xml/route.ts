import { NextResponse } from "next/server";

/**
 * Sitemap Index - /sitemap_index.xml
 *
 * GSC expects this to serve an actual sitemap index, not a redirect.
 * This duplicates /sitemap.xml content to fix GSC errors.
 */

export const runtime = "edge";
export const revalidate = 3600;

const SITE_URL = "https://www.afriquesports.net";
const POSTS_PER_SITEMAP = 500;
const ESTIMATED_TOTAL_POSTS = 45299;
const MAX_POST_SITEMAPS = 100;

export async function GET() {
  const calculatedSitemaps = Math.ceil(ESTIMATED_TOTAL_POSTS / POSTS_PER_SITEMAP);
  const totalPostSitemaps = Math.min(calculatedSitemaps, MAX_POST_SITEMAPS);
  const lastmod = new Date().toISOString().split("T")[0];

  const sitemaps: string[] = [];

  // Post sitemaps (paginated)
  for (let i = 1; i <= totalPostSitemaps; i++) {
    sitemaps.push(`<sitemap><loc>${SITE_URL}/sitemaps/posts/${i}.xml</loc><lastmod>${lastmod}</lastmod></sitemap>`);
  }

  // Category sitemap
  sitemaps.push(`<sitemap><loc>${SITE_URL}/sitemaps/categories.xml</loc><lastmod>${lastmod}</lastmod></sitemap>`);

  // Page sitemap (static pages)
  sitemaps.push(`<sitemap><loc>${SITE_URL}/sitemaps/pages.xml</loc><lastmod>${lastmod}</lastmod></sitemap>`);

  // News sitemap (Google News - last 48 hours)
  sitemaps.push(`<sitemap><loc>${SITE_URL}/news-sitemap.xml</loc><lastmod>${lastmod}</lastmod></sitemap>`);

  // CAN 2025 special sitemap
  sitemaps.push(`<sitemap><loc>${SITE_URL}/sitemaps/can-2025.xml</loc><lastmod>${lastmod}</lastmod></sitemap>`);

  // CAN 2025 matches sitemap
  sitemaps.push(`<sitemap><loc>${SITE_URL}/sitemaps/can2025-matches.xml</loc><lastmod>${lastmod}</lastmod></sitemap>`);

  // Video sitemap
  sitemaps.push(`<sitemap><loc>${SITE_URL}/video-sitemap.xml</loc><lastmod>${lastmod}</lastmod></sitemap>`);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="${SITE_URL}/sitemap.xsl"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.join("\n")}
</sitemapindex>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      "CDN-Cache-Control": "public, max-age=86400",
    },
  });
}
