import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import { getPool } from "@/lib/mysql-db";

function getDateRange(period: string): string {
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

  return fromDate.toISOString().split("T")[0];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "7d";

    const startDate = getDateRange(period);

    const pool = getPool();
    if (!pool) {
      return NextResponse.json(
        { error: "Database not available", message: "MySQL connection not configured." },
        { status: 503 }
      );
    }

    // Fetch visits stats and published article counts from MySQL only
    const [visitsResult, publishedResult] = await Promise.all([
      pool.query<mysql.RowDataPacket[]>(
        `SELECT
          post_author AS authorName,
          COUNT(DISTINCT post_id) AS activeArticles,
          SUM(count) AS totalViews,
          GROUP_CONCAT(DISTINCT CONCAT(post_slug, '||', post_title, '||', count) ORDER BY count DESC SEPARATOR ':::') AS topSlugs
        FROM wp_afriquesports_visits
        WHERE post_author IS NOT NULL
          AND post_author != ''
          AND visit_date >= ?
        GROUP BY post_author
        ORDER BY totalViews DESC
        LIMIT 50`,
        [startDate]
      ),
      pool.query<mysql.RowDataPacket[]>(
        `SELECT
          u.display_name AS authorName,
          COUNT(*) AS publishedCount
        FROM wp_8_posts p
        JOIN wp_users u ON p.post_author = u.ID
        WHERE p.post_status = 'publish'
          AND p.post_type = 'post'
          AND p.post_date >= ?
        GROUP BY u.display_name`,
        [startDate]
      ),
    ]);

    const [rows] = visitsResult;
    const [publishedRows] = publishedResult;

    // Build author → published count map
    const publishedMap = new Map<string, number>();
    for (const row of publishedRows) {
      publishedMap.set(row.authorName as string, parseInt(row.publishedCount as string) || 0);
    }

    if (rows.length === 0) {
      return NextResponse.json({
        summary: { totalAuthors: 0, totalArticles: 0, totalActiveArticles: 0, totalViews: 0 },
        authors: [],
        period,
      });
    }

    // Build author data from MySQL only
    const authors = rows.map((row, index) => {
      const authorName = row.authorName as string;
      const published = publishedMap.get(authorName) || 0;
      const totalViews = parseInt(row.totalViews as string) || 0;
      const activeArticles = parseInt(row.activeArticles as string) || 0;

      const slugParts = (row.topSlugs as string || "").split(":::").filter(Boolean);
      const topArticles: Array<{ title: string; url: string; views: number }> = [];

      for (const part of slugParts) {
        const [slug, title, viewsStr] = part.split("||");
        if (!slug) continue;
        topArticles.push({
          title: (title || slug)
            .replace(/&#8217;/g, "'")
            .replace(/&#8211;/g, "–")
            .replace(/&amp;/g, "&"),
          url: `https://www.afriquesports.net/${slug}`,
          views: parseInt(viewsStr) || 0,
        });
      }

      return {
        id: index + 1,
        name: authorName,
        slug: authorName.toLowerCase().replace(/\s+/g, "-"),
        articleCount: published,
        activeArticles,
        views: totalViews,
        topArticles: topArticles.slice(0, 10),
      };
    });

    const totalArticles = authors.reduce((sum, a) => sum + a.articleCount, 0);
    const totalActiveArticles = authors.reduce((sum, a) => sum + a.activeArticles, 0);
    const totalViews = authors.reduce((sum, a) => sum + a.views, 0);

    return NextResponse.json({
      summary: {
        totalAuthors: authors.length,
        totalArticles,
        totalActiveArticles,
        totalViews,
      },
      authors,
      period,
    });
  } catch (error) {
    console.error("Authors analytics API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch author analytics", message: String(error) },
      { status: 500 }
    );
  }
}
