/** @type {import('next-sitemap').IConfig} */
/**
 * DEPRECATED: We now use custom dynamic sitemap routes for better performance
 * with 134k+ posts. This config is kept for reference but sitemaps are
 * generated via:
 * - /sitemap.xml (sitemap index)
 * - /sitemaps/posts/[page].xml (paginated posts)
 * - /sitemaps/categories.xml
 * - /sitemaps/pages.xml
 * - /news-sitemap.xml (Google News)
 * - /sitemaps/can-2025.xml (CAN 2025 priority content)
 * - /robots.txt (dynamic)
 *
 * This next-sitemap config is disabled to avoid conflicts.
 */
module.exports = {
  siteUrl: 'https://www.afriquesports.net',
  generateRobotsTxt: false, // We use custom robots.txt route
  generateIndexSitemap: false, // We use custom sitemap.xml route
  // Exclude all pages from next-sitemap - we handle sitemaps ourselves
  exclude: ['*'],
};
