import { NextResponse } from "next/server";
import { getSubscriptionStats, getRecentSubscriptions } from "@/lib/push-db";

/**
 * GET /api/push/subscribers
 * Get subscriber count, stats, and recent subscriptions
 */
export async function GET() {
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
