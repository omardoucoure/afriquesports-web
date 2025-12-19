import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

/**
 * On-Demand Revalidation API
 *
 * This endpoint is called by WordPress webhooks when a post is published/updated.
 * It immediately purges the cache for affected pages, ensuring fresh content
 * while maintaining fast CDN performance for other pages.
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
    const envSecret = process.env.REVALIDATE_SECRET;
    if (!secret || secret !== envSecret) {
      console.error("[Revalidate] Secret validation failed");
      console.error("[Revalidate] Received:", JSON.stringify(secret));
      console.error("[Revalidate] Expected:", JSON.stringify(envSecret));
      console.error("[Revalidate] Match:", secret === envSecret);
      console.error("[Revalidate] Received length:", secret?.length);
      console.error("[Revalidate] Expected length:", envSecret?.length);
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
  const envSecret = process.env.REVALIDATE_SECRET;
  return NextResponse.json({
    message: "Revalidation endpoint is active. Use POST with proper credentials.",
    debug: {
      envSecretDefined: !!envSecret,
      envSecretLength: envSecret?.length || 0,
      envSecretFirst5: envSecret?.substring(0, 5) || "undefined",
    },
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
