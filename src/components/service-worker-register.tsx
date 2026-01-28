"use client";

import { useEffect } from "react";

/**
 * Registers the push notification service worker at the app level.
 * This ensures the SW is installed for all visitors on page load,
 * independently from the push notification prompt.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    navigator.serviceWorker
      .register("/firebase-messaging-sw.js")
      .then((registration) => {
        console.log("[SW] Service worker registered, scope:", registration.scope);
      })
      .catch((err) => {
        console.error("[SW] Service worker registration failed:", err);
      });
  }, []);

  return null;
}
