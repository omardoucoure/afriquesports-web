export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { saveSubscription, removeSubscription, getSubscriptionStats } from "@/lib/push-db";
import { isValidSubscription } from "@/lib/web-push-client";

/**
 * Get country code from IP address
 */
async function getCountryFromIP(ip: string): Promise<string | null> {
  if (
    !ip ||
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.")
  ) {
    return null;
  }

  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode`, {
      signal: AbortSignal.timeout(3000),
    });

    if (response.ok) {
      const data = await response.json();
      return data.countryCode || null;
    }
  } catch (error) {
    console.error("[push/subscribe] Error getting country from IP:", error);
  }

  return null;
}

/**
 * POST /api/push/subscribe
 * Save a new Web Push subscription
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscription, language, topics } = body;

    if (!isValidSubscription(subscription)) {
      return NextResponse.json(
        { error: "Invalid subscription object" },
        { status: 400 }
      );
    }

    const userAgent = request.headers.get("user-agent") || undefined;

    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIP = request.headers.get("x-real-ip");
    const ip =
      forwardedFor?.split(",")[0]?.trim() ||
      realIP ||
      request.headers.get("cf-connecting-ip") ||
      undefined;

    let country: string | undefined;
    if (ip) {
      country = (await getCountryFromIP(ip)) || undefined;
    }

    const success = await saveSubscription(
      subscription.endpoint,
      subscription.keys.p256dh,
      subscription.keys.auth,
      userAgent,
      language,
      topics,
      country,
      "web"
    );

    if (!success) {
      return NextResponse.json(
        { error: "Failed to save subscription" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Subscription saved successfully",
    });
  } catch (error) {
    console.error("[push/subscribe] Error:", error);
    return NextResponse.json(
      { error: "Failed to save subscription" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/push/subscribe
 * Remove a push subscription
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscription } = body;

    if (!subscription?.endpoint) {
      return NextResponse.json(
        { error: "Subscription endpoint is required" },
        { status: 400 }
      );
    }

    const success = await removeSubscription(subscription.endpoint);

    return NextResponse.json({
      success,
      message: success ? "Subscription removed" : "Failed to remove",
    });
  } catch (error) {
    console.error("[push/subscribe] DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to remove subscription" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/push/subscribe
 * Get subscription statistics
 */
export async function GET() {
  try {
    const stats = await getSubscriptionStats();
    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error("[push/subscribe] GET error:", error);
    return NextResponse.json(
      { error: "Failed to get statistics" },
      { status: 500 }
    );
  }
}
