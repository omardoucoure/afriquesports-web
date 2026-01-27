/**
 * Web Push server-side client
 *
 * Sends push notifications using the Web Push protocol with VAPID keys.
 */

import webpush from "web-push";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:contact@afriquesports.net";

// Configure web-push with VAPID details
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export interface WebPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  url?: string;
  notificationId?: string;
}

export interface SendResult {
  success: boolean;
  statusCode?: number;
  error?: string;
}

/**
 * Send a push notification to a single subscriber
 */
export async function sendPushNotification(
  subscription: WebPushSubscription,
  payload: PushPayload
): Promise<SendResult> {
  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || "https://www.afriquesports.net/icon-192.png",
    badge: payload.badge || "https://www.afriquesports.net/favicon-32x32.png",
    image: payload.image,
    data: {
      url: payload.url || "https://www.afriquesports.net/",
      notificationId: payload.notificationId,
    },
  });

  try {
    const result = await webpush.sendNotification(
      subscription,
      notificationPayload
    );
    return { success: true, statusCode: result.statusCode };
  } catch (error) {
    const webPushError = error as webpush.WebPushError;
    console.error(
      "[WebPush] Failed:",
      webPushError.statusCode,
      subscription.endpoint.slice(-20)
    );
    return {
      success: false,
      statusCode: webPushError.statusCode,
      error: webPushError.message || String(error),
    };
  }
}

/**
 * Send push notifications to multiple subscribers with concurrency control
 */
export async function sendPushNotificationToMany(
  subscriptions: WebPushSubscription[],
  payload: PushPayload,
  concurrency = 50
): Promise<{
  successCount: number;
  failureCount: number;
  invalidSubscriptions: WebPushSubscription[];
  results: SendResult[];
}> {
  const results: SendResult[] = [];
  const invalidSubscriptions: WebPushSubscription[] = [];
  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < subscriptions.length; i += concurrency) {
    const batch = subscriptions.slice(i, i + concurrency);

    const batchResults = await Promise.all(
      batch.map(async (subscription, index) => {
        const result = await sendPushNotification(subscription, payload);

        if (
          !result.success &&
          (result.statusCode === 404 || result.statusCode === 410)
        ) {
          invalidSubscriptions.push(batch[index]);
        }

        return result;
      })
    );

    for (const result of batchResults) {
      results.push(result);
      if (result.success) {
        successCount++;
      } else {
        failureCount++;
      }
    }
  }

  return { successCount, failureCount, invalidSubscriptions, results };
}

/**
 * Validate a Web Push subscription object
 */
export function isValidSubscription(
  subscription: unknown
): subscription is WebPushSubscription {
  if (!subscription || typeof subscription !== "object") return false;

  const sub = subscription as Record<string, unknown>;

  if (typeof sub.endpoint !== "string" || !sub.endpoint.startsWith("https://"))
    return false;

  if (!sub.keys || typeof sub.keys !== "object") return false;

  const keys = sub.keys as Record<string, unknown>;

  if (typeof keys.p256dh !== "string" || typeof keys.auth !== "string")
    return false;

  return true;
}
