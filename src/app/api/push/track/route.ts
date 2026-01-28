export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { trackNotificationReceive, trackNotificationClick } from "@/lib/push-db";

/**
 * POST /api/push/track
 * Track notification receive or click events
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificationId, event } = body;

    if (!notificationId) {
      return NextResponse.json(
        { error: "Notification ID is required" },
        { status: 400 }
      );
    }

    if (!event || !["receive", "click"].includes(event)) {
      return NextResponse.json(
        { error: "Event must be 'receive' or 'click'" },
        { status: 400 }
      );
    }

    let success = false;
    if (event === "receive") {
      success = await trackNotificationReceive(notificationId);
    } else if (event === "click") {
      success = await trackNotificationClick(notificationId);
    }

    return NextResponse.json({
      success,
      message: success ? `${event} tracked` : "Failed to track event",
    });
  } catch (error) {
    console.error("[push/track] Error:", error);
    return NextResponse.json(
      { error: "Failed to track event" },
      { status: 500 }
    );
  }
}
