/**
 * Our Tangalle Story 💛 - Service Worker
 * Enables offline access on GitHub Pages
 */

const CACHE_NAME = 'tangalle-story-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './config.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).catch(() => cached))
  );
});
