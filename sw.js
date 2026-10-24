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
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith('http')) return;

  // Excluir streaming de audio y servicios multimedia externos
  const url = new URL(e.request.url);
  if (url.hostname.includes('radio12345.com') || url.hostname.includes('youtube.com') || url.hostname.includes('googlevideo.com')) return;

  // Solo gestionar caché para el origen propio (evitar envenenamiento de caché cross-origin)
  if (url.origin !== self.location.origin) return;

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
