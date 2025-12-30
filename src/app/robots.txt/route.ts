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

# Block search and internal pages
Disallow: /search
Disallow: /_next
Disallow: /api

# Block query strings (cache busting, pagination params)
Disallow: /*?*cb=
Disallow: /*?*query-0-page=
Disallow: /*?*dcb=
Disallow: /*?*shcb=
Disallow: /*?*gcb=
Disallow: /*?*a=a
Disallow: /*?s=
Disallow: /*?p=
Disallow: /*?preview=
Disallow: /*?page=

# Block Facebook tracking params
Disallow: /*?*fbclid=
Disallow: /*?*fb_comment_id=

# Block social share tracking
Disallow: /*?*share=
Disallow: /*?*nb=

# Block AMP params (handled by canonical)
Disallow: /*?*amp=
Disallow: /*?*amp
Disallow: /*?*noamp=
Disallow: /*?*nonamp=

# Block view mode params
Disallow: /*?*mode=
Disallow: /*?*filter_by=
Disallow: /*?*expand_article=

# Block image/cache params
Disallow: /*?*width=
Disallow: /*?*quality=
Disallow: /*?*ezimgfmt=
Disallow: /*?*PageSpeed=

# Block misc WordPress params
Disallow: /*?*newsmaticargs=
Disallow: /*?*uy24=
Disallow: /*?*vp_on_pageload=
Disallow: /*?*push

# Block old WordPress paths
Disallow: /feed
Disallow: /feed/
Disallow: /comments/feed
Disallow: /trackback
Disallow: /xmlrpc.php
Disallow: /wp-admin
Disallow: /wp-login.php
Disallow: /wp-includes
Disallow: /wp-content/plugins
Disallow: /wp-json

# Block low-value pages
Disallow: /author/
Disallow: /tag/
Disallow: /attachment/
Disallow: /replytocom=

# Block date archives
Disallow: /2020/
Disallow: /2021/
Disallow: /2022/
Disallow: /2023/
Disallow: /2024/
Disallow: /2025/

# Block ALL old WordPress pagination URLs
# The new site uses different pagination - these are all spam
Disallow: /page/
Disallow: /*/page/

# Block JSON files
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
Sitemap: ${SITE_URL}/video-sitemap.xml
Sitemap: ${SITE_URL}/sitemaps/pages.xml
Sitemap: ${SITE_URL}/sitemaps/categories.xml
Sitemap: ${SITE_URL}/sitemaps/can-2025.xml
Sitemap: ${SITE_URL}/sitemaps/can2025-matches.xml

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
