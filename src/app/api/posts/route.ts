import { NextRequest, NextResponse } from "next/server";
import { DataFetcher } from "@/lib/data-fetcher";

// Force dynamic rendering since this route uses searchParams
export const dynamic = 'force-dynamic';

// Revalidate every 10 minutes as fallback
// Primary updates via on-demand revalidation from WordPress webhook
export const revalidate = 600;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const per_page = searchParams.get("per_page") || "20";
    const offset = searchParams.get("offset") || "0";
    const categories = searchParams.get("categories");
    const locale = searchParams.get("locale");

    const params: Record<string, string> = {
      per_page,
      offset,
    };

    if (categories) {
      params.categories = categories;
    }

    if (locale) {
      params.locale = locale;
    }

    // Let Next.js handle caching based on route-level revalidate
    // On-demand revalidation webhook will purge cache when needed
    const posts = await DataFetcher.fetchPosts(params);

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}
