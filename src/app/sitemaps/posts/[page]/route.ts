import { NextRequest, NextResponse } from "next/server";
import { getCachedSitemapPosts, calculatePriority } from "@/lib/sitemap-cache";

/**
 * Paginated Post Sitemap
 * Route: /sitemaps/posts/[page].xml
 *
 * Each sitemap contains 1000 posts for optimal performance
 * Following Google's best practice of smaller, faster sitemaps
 */

// Use edge runtime for faster response
export const runtime = "edge";

// Revalidate every 12 hours
export const revalidate = 43200;

const SITE_URL = "https://www.afriquesports.net";
const POSTS_PER_SITEMAP = 1000;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ page: string }> }
) {
  const { page: pageParam } = await params;

  // Handle .xml extension
  const pageNumber = parseInt(pageParam.replace(".xml", ""), 10);

  if (isNaN(pageNumber) || pageNumber < 1) {
    return new NextResponse("Invalid page number", { status: 400 });
  }

  try {
    // Fetch posts for this page with caching
    const posts = await getCachedSitemapPosts(pageNumber, POSTS_PER_SITEMAP, "fr");

    if (posts.length === 0) {
      return new NextResponse("Sitemap page not found", { status: 404 });
    }

    // Build XML efficiently with priority and lastmod
    const urlEntries = posts.map((post) => {
      const url = `${SITE_URL}/${post.category}/${post.slug}`;
      const lastmod = new Date(post.modified).toISOString();
      // Calculate priority based on content age (using modified date as proxy)
      const priority = calculatePriority(post.publishDate || post.modified);

      // Include image sitemap extension for better indexing
      return `<url>
<loc>${url}</loc>
<lastmod>${lastmod}</lastmod>
<priority>${priority.toFixed(1)}</priority>
<xhtml:link rel="alternate" hreflang="fr" href="${url}" />
<xhtml:link rel="alternate" hreflang="en" href="${SITE_URL}/en/${post.category}/${post.slug}" />
<xhtml:link rel="alternate" hreflang="es" href="${SITE_URL}/es/${post.category}/${post.slug}" />
<xhtml:link rel="alternate" hreflang="x-default" href="${url}" />
</url>`;
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="${SITE_URL}/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlEntries.join("\n")}
</urlset>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=43200, s-maxage=86400, stale-while-revalidate=604800",
        "CDN-Cache-Control": "public, max-age=86400",
        "Vercel-CDN-Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error(`Error generating sitemap page ${pageNumber}:`, error);
    return new NextResponse("Error generating sitemap", { status: 500 });
  }
}
