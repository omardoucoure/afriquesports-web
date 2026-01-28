// Minimal Service Worker to prevent 404 errors
// Push notifications are handled by firebase-messaging-sw.js

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  self.clients.claim();
});
