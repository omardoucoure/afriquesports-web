import { NextRequest, NextResponse } from "next/server";
import { gaClient, type Platform } from "@/lib/ga-client";

// WordPress API base URLs
const WP_FR_API_URL = process.env.WP_FR_API_URL || "";
const WP_USERNAME = process.env.WP_USERNAME || "";
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD || "";

const AUTH_HEADER = "Basic " + Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString("base64");

function getDateRange(period: string): { startDate: string; endDate: string } {
  const endDate = "today";
  let startDate: string;

  switch (period) {
    case "24h":
      startDate = "yesterday";
      break;
    case "7d":
      startDate = "7daysAgo";
      break;
    case "30d":
      startDate = "30daysAgo";
      break;
    case "90d":
      startDate = "90daysAgo";
      break;
    default:
      startDate = "7daysAgo";
  }

  return { startDate, endDate };
}

// Extract category slug from page path: /afrique/some-slug or /en/europe/some-slug
function extractSlugFromPath(path: string): string | null {
  // Match /{category}/{slug} or /{locale}/{category}/{slug}
  const match = path.match(/^(?:\/[a-z]{2})?\/[^/]+\/([^/]+)\/?$/);
  return match ? match[1] : null;
}

interface WPAuthor {
  id: number;
  name: string;
  slug: string;
  avatar_urls?: Record<string, string>;
}

interface WPPost {
  id: number;
  slug: string;
  title: { rendered: string };
  author: number;
  link: string;
}

// Fetch WordPress authors
async function fetchWPAuthors(): Promise<WPAuthor[]> {
  if (!WP_FR_API_URL) return [];

  try {
    const response = await fetch(`${WP_FR_API_URL}/users?per_page=100&context=embed`, {
      headers: { Authorization: AUTH_HEADER },
      next: { revalidate: 3600 },
    });

    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}

// Fetch recent posts by author
async function fetchPostsByAuthor(authorId: number, perPage: number = 10): Promise<WPPost[]> {
  if (!WP_FR_API_URL) return [];

  try {
    const response = await fetch(
      `${WP_FR_API_URL}/posts?author=${authorId}&per_page=${perPage}&_fields=id,slug,title,author,link`,
      {
        headers: { Authorization: AUTH_HEADER },
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "7d";
    const platform = (searchParams.get("platform") || "all") as Platform;

    const { startDate, endDate } = getDateRange(period);

    // Fetch GA top pages and WP authors in parallel
    const [topPages, wpAuthors] = await Promise.all([
      gaClient.getTopPages(startDate, endDate, 500, platform),
      fetchWPAuthors(),
    ]);

    if (wpAuthors.length === 0) {
      return NextResponse.json({
        summary: { totalAuthors: 0, totalArticles: 0, avgArticlesPerAuthor: 0 },
        authors: [],
        period,
        platform,
      });
    }

    // Build a slug-to-GA-data map from top pages
    const slugToGA = new Map<string, { visitors: number; pageViews: number }>();
    for (const page of topPages) {
      const slug = extractSlugFromPath(page.path);
      if (slug) {
        const existing = slugToGA.get(slug);
        if (existing) {
          existing.visitors += page.visitors;
          existing.pageViews += page.pageViews;
        } else {
          slugToGA.set(slug, { visitors: page.visitors, pageViews: page.pageViews });
        }
      }
    }

    // For each author, fetch their posts and match with GA data
    const authorDataPromises = wpAuthors.map(async (author) => {
      const posts = await fetchPostsByAuthor(author.id, 50);

      let totalVisitors = 0;
      let totalPageviews = 0;
      const topArticles: Array<{ title: string; url: string; visitors: number }> = [];

      for (const post of posts) {
        const gaData = slugToGA.get(post.slug);
        if (gaData) {
          totalVisitors += gaData.visitors;
          totalPageviews += gaData.pageViews;
          topArticles.push({
            title: post.title.rendered.replace(/&#8217;/g, "'").replace(/&#8211;/g, "–").replace(/&amp;/g, "&"),
            url: post.link,
            visitors: gaData.visitors,
          });
        }
      }

      topArticles.sort((a, b) => b.visitors - a.visitors);

      return {
        id: author.id,
        name: author.name,
        slug: author.slug,
        avatar: author.avatar_urls?.["96"] || author.avatar_urls?.["48"],
        articleCount: posts.length,
        visitors: totalVisitors,
        pageviews: totalPageviews,
        avgDuration: 0, // GA4 doesn't provide per-page session duration easily
        bounceRate: 0,
        topArticles: topArticles.slice(0, 10),
      };
    });

    const allAuthors = await Promise.all(authorDataPromises);

    // Filter out authors with no traffic and sort by visitors
    const authors = allAuthors
      .filter((a) => a.articleCount > 0)
      .sort((a, b) => b.visitors - a.visitors);

    const totalArticles = authors.reduce((sum, a) => sum + a.articleCount, 0);

    return NextResponse.json({
      summary: {
        totalAuthors: authors.length,
        totalArticles,
        avgArticlesPerAuthor: authors.length > 0 ? totalArticles / authors.length : 0,
      },
      authors,
      period,
      platform,
    });
  } catch (error) {
    console.error("Authors analytics API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch author analytics", message: String(error) },
      { status: 500 }
    );
  }
}
