import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { deleteCached, CacheKeys } from "@/lib/redis";

/**
 * On-Demand Revalidation API
 *
 * This endpoint is called by WordPress webhooks when a post is published/updated.
 * It immediately purges the cache for affected pages, ensuring fresh content
 * while maintaining fast CDN performance for other pages.
 *
 * Now also clears Redis cache for the specific post to ensure immediate updates.
 *
 * Usage:
 * POST /api/revalidate
 * Body: {
 *   secret: "your-secret-key",
 *   slug: "article-slug",
 *   category: "afrique",
 *   action: "publish" | "update" | "delete"
 * }
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { secret, slug, category, action } = body;

    // Validate secret to prevent unauthorized revalidation
    if (!secret || secret !== process.env.REVALIDATE_SECRET) {
      console.error("[Revalidate] Invalid or missing secret");
      return NextResponse.json(
        { error: "Invalid secret" },
        { status: 401 }
      );
    }

    // Validate required fields
    if (!slug || !category) {
      console.error("[Revalidate] Missing required fields:", { slug, category });
      return NextResponse.json(
        { error: "Missing slug or category" },
        { status: 400 }
      );
    }

    const revalidatedPaths: string[] = [];
    const clearedRedisKeys: string[] = [];

    // Clear Redis cache for this specific post (all locales)
    const locales = ["fr", "en", "es", "ar"];
    for (const locale of locales) {
      const cacheKey = CacheKeys.post(slug, locale);
      const deleted = await deleteCached(cacheKey);
      if (deleted) {
        clearedRedisKeys.push(cacheKey);
      }
    }
    console.log(`[Revalidate] Cleared Redis keys:`, clearedRedisKeys);

    // Always revalidate homepage for fresh content
    revalidatePath("/");
    revalidatedPaths.push("/");

    // Revalidate all locale versions of homepage
    revalidatePath("/fr");
    revalidatePath("/en");
    revalidatePath("/es");
    revalidatedPaths.push("/fr", "/en", "/es");

    // Revalidate category pages
    const categoryPath = `/category/${category}`;
    revalidatePath(categoryPath);
    revalidatedPaths.push(categoryPath);

    // Revalidate all locale versions of category
    revalidatePath(`/fr${categoryPath}`);
    revalidatePath(`/en${categoryPath}`);
    revalidatePath(`/es${categoryPath}`);
    revalidatedPaths.push(`/fr${categoryPath}`, `/en${categoryPath}`, `/es${categoryPath}`);

    // Revalidate specific article (if not deleted)
    if (action !== "delete") {
      const articlePath = `/${category}/${slug}`;
      revalidatePath(articlePath);
      revalidatedPaths.push(articlePath);

      // Revalidate all locale versions of article
      revalidatePath(`/fr${articlePath}`);
      revalidatePath(`/en${articlePath}`);
      revalidatePath(`/es${articlePath}`);
      revalidatedPaths.push(`/fr${articlePath}`, `/en${articlePath}`, `/es${articlePath}`);
    }

    console.log(`[Revalidate] Successfully revalidated paths:`, revalidatedPaths);

    return NextResponse.json({
      revalidated: true,
      paths: revalidatedPaths,
      redisCleared: clearedRedisKeys,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Revalidate] Error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// Handle GET requests for testing
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "Revalidation endpoint is active. Use POST with proper credentials.",
    usage: {
      method: "POST",
      body: {
        secret: "your-revalidate-secret",
        slug: "article-slug",
        category: "afrique",
        action: "publish | update | delete",
      },
    },
  });
}
