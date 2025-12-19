import { NextResponse } from "next/server";

/**
 * Dynamic robots.txt
 * Includes all sitemaps and proper crawler directives
 */

export const runtime = "edge";
export const revalidate = 86400; // 24 hours

const SITE_URL = "https://www.afriquesports.net";

export async function GET() {
  const robotsTxt = `# Afrique Sports - Robots.txt
# Updated: ${new Date().toISOString().split("T")[0]}

# Default rules for all crawlers
User-agent: *
Allow: /
Disallow: /search
Disallow: /_next
Disallow: /api
Disallow: /*.json$

# Google News specific
User-agent: Googlebot-News
Allow: /

# Googlebot
User-agent: Googlebot
Allow: /
Crawl-delay: 1

# Bingbot
User-agent: Bingbot
Allow: /
Crawl-delay: 2

# Sitemaps
Sitemap: ${SITE_URL}/sitemap.xml
Sitemap: ${SITE_URL}/news-sitemap.xml
Sitemap: ${SITE_URL}/sitemaps/pages.xml
Sitemap: ${SITE_URL}/sitemaps/categories.xml
Sitemap: ${SITE_URL}/sitemaps/can-2025.xml

# Host
Host: ${SITE_URL}
`;

  return new NextResponse(robotsTxt, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=604800",
    },
  });
}
