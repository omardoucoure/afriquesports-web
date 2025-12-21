import { NextResponse } from "next/server";
import { getRecentPostsForNews, calculatePriority } from "@/lib/sitemap-cache";

/**
 * Google News Sitemap
 * Route: /news-sitemap.xml
 *
 * Requirements:
 * - Only articles from last 48 hours
 * - Max 1000 URLs
 * - Uses news: namespace
 * - Must include publication name, language, publication_date, title
 */

// Use edge runtime for faster response
export const runtime = "edge";

// Revalidate every 15 minutes for fresh news
export const revalidate = 900;

const SITE_URL = "https://www.afriquesports.net";
const PUBLICATION_NAME = "Afrique Sports";

export async function GET() {
  try {
    // Get posts from last 48 hours
    const posts = await getRecentPostsForNews("fr");

    // Limit to 1000 (Google News sitemap limit)
    const limitedPosts = posts.slice(0, 1000);

    // Build news sitemap XML with priority and lastmod
    const urlEntries = limitedPosts.map((post) => {
      const url = `${SITE_URL}/${post.category}/${post.slug}`;
      // Format date for news sitemap (W3C format)
      const pubDate = new Date(post.modified).toISOString();
      // Calculate priority based on freshness (for Bing/Yandex)
      const priority = post.publishDate ? calculatePriority(post.publishDate) : 0.9;
      // Use actual title if available, otherwise fallback to formatted slug
      const title = post.title || post.slug.replace(/-/g, " ");
      // Include image if available (improves Google News visibility)
      const imageTag = post.image ? `<image:image>
<image:loc>${post.image}</image:loc>
</image:image>` : "";

      return `<url>
<loc>${url}</loc>
<lastmod>${pubDate}</lastmod>
<priority>${priority.toFixed(1)}</priority>${imageTag}
<news:news>
<news:publication>
<news:name>${PUBLICATION_NAME}</news:name>
<news:language>fr</news:language>
</news:publication>
<news:publication_date>${pubDate}</news:publication_date>
<news:title><![CDATA[${title}]]></news:title>
</news:news>
</url>`;
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="${SITE_URL}/news-sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlEntries.join("\n")}
</urlset>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=900, s-maxage=1800, stale-while-revalidate=3600",
        "CDN-Cache-Control": "public, max-age=1800",
        "Vercel-CDN-Cache-Control": "public, max-age=1800",
      },
    });
  } catch (error) {
    console.error("Error generating news sitemap:", error);
    return new NextResponse("Error generating news sitemap", { status: 500 });
  }
}
