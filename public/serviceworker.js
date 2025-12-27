// Minimal Service Worker to prevent 404 errors
// This file exists to satisfy browser auto-detection for common service worker paths

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  self.clients.claim();
});

// Pass-through fetch handler (no caching)
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
