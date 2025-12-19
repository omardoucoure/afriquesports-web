import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { invalidateSitemapCache } from "@/lib/sitemap-cache";

/**
 * Sitemap Revalidation API
 * Route: /api/sitemap/revalidate
 *
 * Triggers sitemap cache invalidation and regeneration
 * Can be called via:
 * 1. WordPress webhook on publish
 * 2. Manual trigger
 * 3. Cron job
 *
 * Security: Requires secret token in header or query
 */

export async function POST(request: NextRequest) {
  // Verify secret token
  const authHeader = request.headers.get("Authorization");
  const secretFromQuery = request.nextUrl.searchParams.get("secret");
  const expectedSecret = process.env.SITEMAP_REVALIDATE_SECRET || "your-secret-token";

  const providedSecret = authHeader?.replace("Bearer ", "") || secretFromQuery;

  if (providedSecret !== expectedSecret) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const type = body.type || "all"; // posts, categories, news, all

    // Invalidate sitemap cache
    await invalidateSitemapCache(type);

    // Revalidate sitemap paths
    if (type === "all" || type === "posts") {
      revalidatePath("/sitemap.xml");
      // Revalidate first 10 post sitemaps (most recent)
      for (let i = 1; i <= 10; i++) {
        revalidatePath(`/sitemaps/posts/${i}.xml`);
      }
    }

    if (type === "all" || type === "categories") {
      revalidatePath("/sitemaps/categories.xml");
    }

    if (type === "all" || type === "news") {
      revalidatePath("/news-sitemap.xml");
    }

    // Always revalidate CAN 2025 sitemap (high priority)
    revalidatePath("/sitemaps/can-2025.xml");

    return NextResponse.json({
      success: true,
      message: `Sitemap cache invalidated for: ${type}`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error revalidating sitemap:", error);
    return NextResponse.json(
      { error: "Failed to revalidate sitemap" },
      { status: 500 }
    );
  }
}

// Also support GET for simple webhook triggers
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  const expectedSecret = process.env.SITEMAP_REVALIDATE_SECRET || "your-secret-token";

  if (secret !== expectedSecret) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    // Quick revalidation of news sitemap only
    await invalidateSitemapCache("news");
    revalidatePath("/news-sitemap.xml");
    revalidatePath("/sitemaps/can-2025.xml");

    return NextResponse.json({
      success: true,
      message: "News sitemap revalidated",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error revalidating sitemap:", error);
    return NextResponse.json(
      { error: "Failed to revalidate" },
      { status: 500 }
    );
  }
}
