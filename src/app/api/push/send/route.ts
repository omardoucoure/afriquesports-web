import { NextRequest, NextResponse } from "next/server";
import { sendPushNotificationToMany } from "@/lib/web-push-client";
import {
  getAllActiveSubscriptions,
  getSubscriptionsByLanguage,
  saveNotificationHistory,
  deleteInvalidSubscriptions,
  getNotificationHistory,
  getSubscriptionStats,
} from "@/lib/push-db";

const PUSH_API_SECRET = process.env.PUSH_API_SECRET;
const PUSH_API_KEY = process.env.NEXT_PUBLIC_PUSH_API_KEY;

function isAuthorized(request: NextRequest): boolean {
  if (!PUSH_API_SECRET && !PUSH_API_KEY) return true; // No keys configured = open (dev mode)
  const authHeader = request.headers.get("authorization");
  const apiKey = request.headers.get("x-api-key");
  const { searchParams } = new URL(request.url);
  const queryKey = searchParams.get("key");
  const token = authHeader?.replace("Bearer ", "") || apiKey || queryKey;
  return token === PUSH_API_SECRET || token === PUSH_API_KEY;
}

/**
 * POST /api/push/send
 * Send push notification to subscribers
 */
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      title,
      body: notificationBody,
      imageUrl,
      targetUrl,
      language,
      testMode,
    } = body;

    if (!title || !notificationBody) {
      return NextResponse.json(
        { error: "Title and body are required" },
        { status: 400 }
      );
    }

    // Get subscriptions based on language filter
    let subscriptions;
    if (language && language !== "all") {
      subscriptions = await getSubscriptionsByLanguage(language);
    } else {
      subscriptions = await getAllActiveSubscriptions();
    }

    if (subscriptions.length === 0) {
      return NextResponse.json({
        error: "No subscribers found",
        sentCount: 0,
      });
    }

    // In test mode, only send to first 5 subscriptions
    if (testMode) {
      subscriptions = subscriptions.slice(0, 5);
    }

    const notificationId = `push_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const result = await sendPushNotificationToMany(subscriptions, {
      title,
      body: notificationBody,
      image: imageUrl,
      url: targetUrl,
      notificationId,
    });

    // Clean up invalid subscriptions (404/410)
    if (result.invalidSubscriptions.length > 0) {
      const endpoints = result.invalidSubscriptions.map((s) => s.endpoint);
      const deleted = await deleteInvalidSubscriptions(endpoints);
      console.log(`[push/send] Deleted ${deleted} invalid subscriptions`);
    }

    // Save to history (skip in test mode)
    if (!testMode) {
      await saveNotificationHistory(
        title,
        notificationBody,
        subscriptions.length,
        result.successCount,
        result.failureCount,
        imageUrl,
        targetUrl,
        language || "all",
        notificationId
      );
    }

    return NextResponse.json({
      success: true,
      sentCount: subscriptions.length,
      successCount: result.successCount,
      failureCount: result.failureCount,
      invalidSubscriptionsRemoved: result.invalidSubscriptions.length,
      testMode: testMode || false,
      notificationId,
    });
  } catch (error) {
    console.error("[push/send] Error:", error);
    return NextResponse.json(
      { error: "Failed to send notifications", details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/push/send
 * Get notification history and stats
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const history = await getNotificationHistory(limit, offset);
    const stats = await getSubscriptionStats();

    return NextResponse.json({ success: true, history, stats });
  } catch (error) {
    console.error("[push/send] GET error:", error);
    return NextResponse.json(
      { error: "Failed to get history" },
      { status: 500 }
    );
  }
}
