import { NextResponse } from "next/server";

/**
 * Sitemap Index - Lists all sitemaps
 * Optimized for performance with edge caching
 *
 * Structure:
 * - post-sitemap-{1-N}.xml - All posts (1000 per file)
 * - category-sitemap.xml - All categories
 * - page-sitemap.xml - Static pages
 * - news-sitemap.xml - Last 48 hours for Google News
 */

// Force edge runtime for faster response
export const runtime = "edge";

// Revalidate every hour
export const revalidate = 3600;

const SITE_URL = "https://www.afriquesports.net";
const POSTS_PER_SITEMAP = 500; // CRITICAL: Must match posts/[page]/route.ts (reduced to prevent timeout)

// Known post count - updated periodically, avoids API call on each request
// This should be updated via a cron job or manually
// Updated 2026-01-03: 45,299 posts from French WordPress API
// Note: en/es/ar sites exist but REST API doesn't expose them properly
const ESTIMATED_TOTAL_POSTS = 45299;

export async function GET() {
  // Calculate sitemap count based on estimated posts
  // This avoids an API call and potential timeout
  const totalPostSitemaps = Math.ceil(ESTIMATED_TOTAL_POSTS / POSTS_PER_SITEMAP);
  const lastmod = new Date().toISOString().split("T")[0]; // Just date, no time

  // Build sitemap index XML efficiently
  const sitemaps: string[] = [];

  // Post sitemaps (paginated) - main French content
  for (let i = 1; i <= totalPostSitemaps; i++) {
    sitemaps.push(`<sitemap><loc>${SITE_URL}/sitemaps/posts/${i}.xml</loc><lastmod>${lastmod}</lastmod></sitemap>`);
  }

  // Category sitemap
  sitemaps.push(`<sitemap><loc>${SITE_URL}/sitemaps/categories.xml</loc><lastmod>${lastmod}</lastmod></sitemap>`);

  // Page sitemap (static pages)
  sitemaps.push(`<sitemap><loc>${SITE_URL}/sitemaps/pages.xml</loc><lastmod>${lastmod}</lastmod></sitemap>`);

  // News sitemap (Google News - last 48 hours)
  sitemaps.push(`<sitemap><loc>${SITE_URL}/news-sitemap.xml</loc><lastmod>${lastmod}</lastmod></sitemap>`);

  // CAN 2025 special sitemap (high priority content)
  sitemaps.push(`<sitemap><loc>${SITE_URL}/sitemaps/can-2025.xml</loc><lastmod>${lastmod}</lastmod></sitemap>`);

  // CAN 2025 matches sitemap (live match pages)
  sitemaps.push(`<sitemap><loc>${SITE_URL}/sitemaps/can2025-matches.xml</loc><lastmod>${lastmod}</lastmod></sitemap>`);

  // Video sitemap (all videos for Google video search)
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
      "Vercel-CDN-Cache-Control": "public, max-age=86400",
    },
  });
}
