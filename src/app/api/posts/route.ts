import { NextRequest, NextResponse } from "next/server";
import { DataFetcher } from "@/lib/data-fetcher";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
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

    const posts = await DataFetcher.fetchPosts(params, {
      cache: "no-store",
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}
