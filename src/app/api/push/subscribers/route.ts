export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import { getSubscriptionStats, getRecentSubscriptions } from "@/lib/push-db";

const PUSH_API_SECRET = process.env.PUSH_API_SECRET;
const PUSH_API_KEY = process.env.NEXT_PUBLIC_PUSH_API_KEY;

function isAuthorized(request: NextRequest): boolean {
  if (!PUSH_API_SECRET && !PUSH_API_KEY) return true;
  const authHeader = request.headers.get("authorization");
  const apiKey = request.headers.get("x-api-key");
  const { searchParams } = new URL(request.url);
  const queryKey = searchParams.get("key");
  const token = authHeader?.replace("Bearer ", "") || apiKey || queryKey;
  return token === PUSH_API_SECRET || token === PUSH_API_KEY;
}

/**
 * GET /api/push/subscribers
 * Get subscriber count, stats, and recent subscriptions
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [stats, recentSubscriptions] = await Promise.all([
      getSubscriptionStats(),
      getRecentSubscriptions(20),
    ]);

    return NextResponse.json({
      success: true,
      stats,
      recentSubscriptions: recentSubscriptions.map((sub) => ({
        id: sub.id,
        language: sub.language,
        country: sub.country,
        source: sub.source,
        is_active: sub.is_active,
        created_at: sub.created_at,
        last_used_at: sub.last_used_at,
        // Don't expose endpoint/keys for privacy
        browser: sub.user_agent
          ? parseBrowser(sub.user_agent)
          : "Unknown",
      })),
    }, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (error) {
    console.error("[push/subscribers] Error:", error);
    return NextResponse.json(
      { error: "Failed to get subscribers" },
      { status: 500 }
    );
  }
}

/**
 * Extract browser name from user agent string
 */
function parseBrowser(ua: string): string {
  if (ua.includes("Chrome") && !ua.includes("Edg")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
  if (ua.includes("Edg")) return "Edge";
  if (ua.includes("Opera") || ua.includes("OPR")) return "Opera";
  return "Other";
}
