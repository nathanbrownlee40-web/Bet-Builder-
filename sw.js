const CACHE = 'top-daily-builders-pwa-v19';
const SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/icon-180x180.png',
  '/icon-152x152.png',
  '/icon-128x128.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Always get HTML/manifest/SW fresh so a Netlify deploy can update the PWA immediately.
  if (event.request.mode === 'navigate' || url.pathname === '/index.html' || url.pathname === '/manifest.json' || url.pathname === '/sw.js') {
    event.respondWith(
      fetch(event.request, {cache: 'no-store'})
        .then(response => {
          if (response.ok && (event.request.mode === 'navigate' || url.pathname === '/index.html')) {
            const copy = response.clone();
            caches.open(CACHE).then(c => c.put('/index.html', copy)).catch(() => {});
          }
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE).then(c => c.put(event.request, copy)).catch(() => {});
      }
      return response;
    }))
  );
});
