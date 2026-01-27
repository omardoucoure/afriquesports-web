import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import { getPool } from "@/lib/mysql-db";
import { gaClient, type Platform } from "@/lib/ga-client";

function getDateRange(period: string): {
  startDate: string;
  endDate: string;
  gaStart: string;
  gaEnd: string;
} {
  const now = new Date();
  let days: number;

  switch (period) {
    case "24h":
      days = 1;
      break;
    case "2d":
      days = 2;
      break;
    case "7d":
      days = 7;
      break;
    case "30d":
      days = 30;
      break;
    case "90d":
      days = 90;
      break;
    default:
      days = 7;
  }

  const fromDate = new Date(now);
  fromDate.setDate(fromDate.getDate() - days);

  return {
    startDate: fromDate.toISOString().split("T")[0],
    endDate: now.toISOString().split("T")[0],
    gaStart: `${days}daysAgo`,
    gaEnd: "today",
  };
}

// Extract slug from page path: /afrique/some-slug → some-slug
function extractSlugFromPath(path: string): string | null {
  const match = path.match(/^(?:\/[a-z]{2})?\/[^/]+\/([^/]+)\/?$/);
  return match ? match[1] : null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "7d";
    const platform = (searchParams.get("platform") || "all") as Platform;

    const { startDate, gaStart, gaEnd } = getDateRange(period);

    const pool = getPool();
    if (!pool) {
      return NextResponse.json(
        { error: "Database not available", message: "MySQL connection not configured." },
        { status: 503 }
      );
    }

    // Fetch author stats from MySQL visits table and GA top pages in parallel
    const [mysqlResult, gaTopPages] = await Promise.all([
      pool.query<mysql.RowDataPacket[]>(
        `SELECT
          post_author AS authorName,
          COUNT(DISTINCT post_id) AS totalPosts,
          SUM(count) AS totalViews,
          GROUP_CONCAT(DISTINCT CONCAT(post_slug, '||', post_title) ORDER BY count DESC SEPARATOR ':::') AS topSlugs
        FROM wp_afriquesports_visits
        WHERE post_author IS NOT NULL
          AND post_author != ''
          AND visit_date >= ?
        GROUP BY post_author
        ORDER BY totalViews DESC
        LIMIT 50`,
        [startDate]
      ),
      process.env.GA_PROPERTY_ID
        ? gaClient.getTopPages(gaStart, gaEnd, 500, platform).catch(() => [])
        : Promise.resolve([]),
    ]);

    const [rows] = mysqlResult;

    if (rows.length === 0) {
      return NextResponse.json({
        summary: { totalAuthors: 0, totalArticles: 0, avgArticlesPerAuthor: 0 },
        authors: [],
        period,
        platform,
      });
    }

    // Build slug → GA visitors map
    const slugToGA = new Map<string, { visitors: number; pageViews: number }>();
    for (const page of gaTopPages) {
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

    // Build author data combining MySQL + GA
    const authors = rows.map((row, index) => {
      const slugParts = (row.topSlugs as string || "").split(":::").filter(Boolean);
      let gaVisitors = 0;
      let gaPageviews = 0;
      const topArticles: Array<{ title: string; url: string; visitors: number }> = [];

      for (const part of slugParts) {
        const [slug, title] = part.split("||");
        if (!slug) continue;
        const gaData = slugToGA.get(slug);
        if (gaData) {
          gaVisitors += gaData.visitors;
          gaPageviews += gaData.pageViews;
          topArticles.push({
            title: (title || slug)
              .replace(/&#8217;/g, "'")
              .replace(/&#8211;/g, "–")
              .replace(/&amp;/g, "&"),
            url: `https://www.afriquesports.net/${slug}`,
            visitors: gaData.visitors,
          });
        }
      }

      topArticles.sort((a, b) => b.visitors - a.visitors);

      return {
        id: index + 1,
        name: row.authorName as string,
        slug: (row.authorName as string).toLowerCase().replace(/\s+/g, "-"),
        articleCount: parseInt(row.totalPosts as string) || 0,
        visitors: gaVisitors || parseInt(row.totalViews as string) || 0,
        pageviews: gaPageviews || parseInt(row.totalViews as string) || 0,
        avgDuration: 0,
        bounceRate: 0,
        topArticles: topArticles.slice(0, 10),
      };
    });

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
