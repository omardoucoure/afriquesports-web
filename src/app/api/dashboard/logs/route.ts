import { NextRequest, NextResponse } from "next/server";

interface LogEntry {
  id: number;
  timestamp: string;
  level: "info" | "warn" | "error" | "debug" | "success";
  message: string;
  meta?: Record<string, unknown>;
  source?: string;
}

// Placeholder logs until Errsole or another log provider is configured
function generatePlaceholderLogs(options: {
  level: string;
  search: string;
  limit: number;
  page: number;
}): { logs: LogEntry[]; totalCount: number; hasMore: boolean } {
  const now = Date.now();
  const sampleLogs: LogEntry[] = [
    {
      id: 1,
      timestamp: new Date(now).toISOString(),
      level: "info",
      message: "Application started successfully on port 3000",
      source: "server",
    },
    {
      id: 2,
      timestamp: new Date(now - 60000).toISOString(),
      level: "info",
      message: "Cache revalidated for /afrique",
      source: "revalidate",
    },
    {
      id: 3,
      timestamp: new Date(now - 120000).toISOString(),
      level: "success",
      message: "Translation webhook processed successfully for 3 locales",
      source: "translate",
    },
    {
      id: 4,
      timestamp: new Date(now - 180000).toISOString(),
      level: "warn",
      message: "WordPress API slow response (2.3s) for /wp-json/wp/v2/posts",
      source: "wordpress",
    },
    {
      id: 5,
      timestamp: new Date(now - 240000).toISOString(),
      level: "error",
      message: "Google Indexing API rate limit exceeded, retrying in 60s",
      source: "indexing",
    },
    {
      id: 6,
      timestamp: new Date(now - 300000).toISOString(),
      level: "info",
      message: "Sitemap generated: 356 URLs indexed",
      source: "sitemap",
    },
    {
      id: 7,
      timestamp: new Date(now - 360000).toISOString(),
      level: "debug",
      message: "GA4 API call: getOverviewMetrics(7daysAgo, today)",
      source: "analytics",
    },
    {
      id: 8,
      timestamp: new Date(now - 420000).toISOString(),
      level: "info",
      message: "Push notification sent to 1,204 subscribers",
      source: "push",
    },
  ];

  let filtered = sampleLogs;

  if (options.level) {
    filtered = filtered.filter((log) => log.level === options.level);
  }

  if (options.search) {
    const q = options.search.toLowerCase();
    filtered = filtered.filter((log) => log.message.toLowerCase().includes(q));
  }

  return {
    logs: filtered,
    totalCount: filtered.length,
    hasMore: false,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get("level") || "";
    const search = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);

    return NextResponse.json(generatePlaceholderLogs({ level, search, limit, page }));
  } catch (error) {
    console.error("Logs API error:", error);
    return NextResponse.json(
      { logs: [], totalCount: 0, hasMore: false, error: String(error) },
      { status: 500 }
    );
  }
}
