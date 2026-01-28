/**
 * Push notification client (browser)
 *
 * Uses the standard Web Push API for subscribing to push notifications.
 */

// VAPID public key for Web Push subscriptions
export const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BI0NDJ2BJyCPe5_PKxNfVY-k3Ps47o5In2UB1Q32RVH30LOfWwiJwlHFuTvwU0K2PHsVg6mfEWBgwJHQmExesHU";

/**
 * Convert URL-safe base64 VAPID key to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Check if push notifications are supported by the browser
 */
export function isPushSupported(): boolean {
  if (typeof window === "undefined") return false;

  return (
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

/**
 * Check if the user is on an iOS device
 */
export function isIOS(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined")
    return false;

  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

/**
 * Check if user is on iOS Safari (not in PWA mode)
 */
export function isIOSSafari(): boolean {
  if (!isIOS()) return false;

  const ua = navigator.userAgent;
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS/.test(ua);
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator &&
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true);

  return isSafari && !isStandalone;
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission | null {
  if (typeof window === "undefined" || !("Notification" in window))
    return null;

  return Notification.permission;
}

/**
 * Check if user is already subscribed (localStorage flag)
 */
export function isSubscribedToPush(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("push_subscribed") === "true";
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(
  language: string = "fr",
  topics: string[] = ["news", "general"]
): Promise<{ success: boolean; error?: string }> {
  if (!isPushSupported()) {
    return { success: false, error: "Push notifications not supported" };
  }

  try {
    console.log("[Push] subscribeToPush called, language:", language);
    const permission = await Notification.requestPermission();
    console.log("[Push] Permission result:", permission);

    if (permission !== "granted") {
      return { success: false, error: "Permission denied" };
    }

    // Register service worker
    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js"
    );
    await navigator.serviceWorker.ready;
    console.log("[Push] Service worker ready");

    // Subscribe to push with VAPID key
    const vapidKeyArray = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
    console.log("[Push] Subscribing with VAPID key:", VAPID_PUBLIC_KEY.substring(0, 20) + "...");
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: vapidKeyArray as BufferSource,
    });
    console.log("[Push] Browser subscription created, endpoint:", subscription.endpoint.substring(0, 60) + "...");

    const subscriptionJson = subscription.toJSON();

    // Send subscription to server
    const response = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscription: {
          endpoint: subscriptionJson.endpoint,
          keys: {
            p256dh: subscriptionJson.keys?.p256dh,
            auth: subscriptionJson.keys?.auth,
          },
        },
        language,
        topics,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[Push] Server rejected subscription:", errorData);
      return {
        success: false,
        error: errorData.error || "Failed to save subscription",
      };
    }

    console.log("[Push] Subscription saved to server successfully");
    localStorage.setItem("push_subscribed", "true");
    return { success: true };
  } catch (error) {
    console.error("[Push] Error subscribing:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Get existing push subscription from service worker
 */
export async function getExistingSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;

  try {
    // Use getRegistration() instead of .ready to avoid hanging when no SW is registered
    // Scope is "/" because firebase-messaging-sw.js is registered at the root
    const registration = await navigator.serviceWorker.getRegistration("/");
    if (!registration) return null;
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error("Error getting existing subscription:", error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const subscription = await getExistingSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      localStorage.removeItem("push_subscribed");
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error unsubscribing from push:", error);
    return false;
  }
}

/**
 * Convert PushSubscription to JSON for API
 */
export function subscriptionToJson(subscription: PushSubscription): {
  endpoint: string;
  keys: { p256dh: string; auth: string };
} {
  const json = subscription.toJSON();
  return {
    endpoint: json.endpoint!,
    keys: {
      p256dh: json.keys!.p256dh,
      auth: json.keys!.auth,
    },
  };
}

/**
 * Check if an existing subscription's applicationServerKey matches the current VAPID key
 */
function isSubscriptionKeyValid(subscription: PushSubscription): boolean {
  const existingKey = subscription.options?.applicationServerKey;
  if (!existingKey) return false;

  const currentKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
  const existingKeyArray = new Uint8Array(existingKey);

  if (currentKey.length !== existingKeyArray.length) return false;
  for (let i = 0; i < currentKey.length; i++) {
    if (currentKey[i] !== existingKeyArray[i]) return false;
  }
  return true;
}

/**
 * Refresh/re-sync existing subscription with server.
 * If the VAPID key changed, automatically unsubscribe and re-subscribe.
 */
export async function refreshSubscription(
  language: string = "fr",
  topics: string[] = ["news", "general"]
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("[Push] refreshSubscription called");
    if (!isPushSupported()) {
      return { success: false, error: "Push not supported" };
    }

    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js"
    );
    await navigator.serviceWorker.ready;

    const subscription = await registration.pushManager.getSubscription();
    console.log("[Push] Existing browser subscription:", !!subscription);

    if (!subscription) {
      console.log("[Push] No browser subscription, creating new one...");
      return subscribeToPush(language, topics);
    }

    // Detect VAPID key mismatch: unsubscribe old and re-subscribe with current key
    const keyValid = isSubscriptionKeyValid(subscription);
    console.log("[Push] VAPID key valid:", keyValid);
    if (!keyValid) {
      console.log("[Push] VAPID key mismatch detected, re-subscribing...");
      await subscription.unsubscribe();
      return subscribeToPush(language, topics);
    }

    console.log("[Push] Syncing existing subscription to server...");
    const subscriptionJson = subscription.toJSON();
    const response = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscription: {
          endpoint: subscriptionJson.endpoint,
          keys: {
            p256dh: subscriptionJson.keys?.p256dh,
            auth: subscriptionJson.keys?.auth,
          },
        },
        language,
        topics,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || "Failed to refresh subscription",
      };
    }

    localStorage.setItem("push_subscribed", "true");
    return { success: true };
  } catch (error) {
    console.error("Error refreshing subscription:", error);
    return { success: false, error: String(error) };
  }
}
