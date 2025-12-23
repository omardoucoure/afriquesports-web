// Service Worker for Afrique Sports
// This file is intentionally minimal - main purpose is to avoid 404 errors

const CACHE_NAME = 'afriquesports-v1';

// Install event
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - pass through all requests (no caching for now)
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
