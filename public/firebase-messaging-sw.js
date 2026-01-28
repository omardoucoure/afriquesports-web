/**
 * Push Notification Service Worker
 * Version: 1.0.0
 *
 * Handles background push notifications for Afrique Sports.
 * This file must be at the root of the public folder.
 */

// Track notification event (fire and forget)
function trackEvent(notificationId, eventType) {
  if (!notificationId) return;

  var baseUrl = self.location.origin;
  fetch(baseUrl + "/api/push/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notificationId: notificationId, event: eventType }),
  }).catch(function () {
    // Silent fail
  });
}

// Handle push event - display notification
self.addEventListener("push", function (event) {
  if (!event.data) return;

  var payload;
  try {
    payload = event.data.json();
  } catch (e) {
    console.error("[SW] Error parsing push data:", e);
    return;
  }

  // Extract notification details from various possible locations
  var title =
    payload.title ||
    payload.notification?.title ||
    payload.data?.title ||
    "Afrique Sports";
  var body =
    payload.body ||
    payload.notification?.body ||
    payload.data?.body ||
    "Nouvelle actualité disponible !";
  var image =
    payload.image ||
    payload.notification?.image ||
    payload.data?.image ||
    null;
  var url =
    payload.data?.url ||
    payload.fcmOptions?.link ||
    "https://www.afriquesports.net/";
  var notificationId = payload.data?.notificationId;
  var icon =
    payload.icon ||
    payload.notification?.icon ||
    "https://www.afriquesports.net/icon-192.png";

  // Track receive event
  trackEvent(notificationId, "receive");

  var options = {
    body: body,
    icon: icon,
    badge: "https://www.afriquesports.net/favicon-32x32.png",
    image: image,
    tag: "afriquesports-latest",
    renotify: true,
    data: { url: url, notificationId: notificationId },
    vibrate: [200, 100, 200],
  };

  event.waitUntil(
    self.registration
      .showNotification(title, options)
      .then(function () {
        console.log("[SW] Notification shown:", title);
      })
      .catch(function (err) {
        console.error("[SW] Failed to show notification:", err);
      })
  );
});

// Handle notification click
self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  var url =
    event.notification.data?.url || "https://www.afriquesports.net/";
  var notificationId = event.notification.data?.notificationId;

  // Track click event
  trackEvent(notificationId, "click");

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function (windowClients) {
        for (var i = 0; i < windowClients.length; i++) {
          var client = windowClients[i];
          if (
            client.url.includes("afriquesports") &&
            "focus" in client
          ) {
            client.navigate(url);
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Service worker lifecycle
self.addEventListener("install", function () {
  console.log("[SW] Service Worker installing...");
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  console.log("[SW] Service Worker activated");
  event.waitUntil(clients.claim());
});

console.log("[SW] Afrique Sports Push Service Worker loaded");
