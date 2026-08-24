/**
 * Heavy Metal Rock TV - Service Worker (Frozen Cache)
 * Strategy: Stale-While-Revalidate for App Shell, Cache-First for Assets
 */
const CACHE_NAME = 'hmrtv-core-v1';
const PRECACHE_ASSETS = [
  './',
  'index.html',
  'tienda.html',
  'emisora.html',
  'youtube.html',
  'venta-boletos.html',
  'css/style.css',
  'fonts/style.css',
  'js/menu.js',
  'js/store.js',
  'data/products.json',
  'img/estetica/HMRTV.webp',
  'img/estetica/STORE.webp',
  'img/estetica/diogustavo.webp'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      const fetchPromise = fetch(e.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});