const CACHE_NAME = 'yiga-pwa-v3';

// Core assets to cache immediately during service worker install
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg'
];

// Install Event
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[PWA SW] Pre-caching core app shell');
      return Promise.allSettled(
        CORE_ASSETS.map((url) => cache.add(url).catch((err) => console.warn('[PWA SW] Pre-cache failed for', url, err)))
      );
    })
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[PWA SW] Deleting obsolete cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  const request = event.request;
  
  // Only intercept GET requests over http/https
  if (request.method !== 'GET' || !request.url.startsWith('http')) {
    return;
  }

  const isNavigation = request.mode === 'navigate' || 
                       (request.headers.get('accept') && request.headers.get('accept').includes('text/html'));

  if (isNavigation) {
    // Navigation Requests: Network First -> Fallback to Cached index.html
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch(() => {
          // Offline or network error: return cached response ignoring search query parameters
          return caches.match(request, { ignoreSearch: true })
            .then((cachedResponse) => {
              if (cachedResponse) return cachedResponse;
              return caches.match('./index.html', { ignoreSearch: true })
                .then((indexResponse) => indexResponse || caches.match('./', { ignoreSearch: true }));
            });
        })
    );
  } else {
    // Asset Requests (JS, CSS, Images, Fonts): Cache First -> Network Fallback with Dynamic Cache
    event.respondWith(
      caches.match(request, { ignoreSearch: true }).then((cachedResponse) => {
        if (cachedResponse) {
          // Background revalidation
          fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
            }
          }).catch(() => {/* Ignore background fetch failures when offline */});
          
          return cachedResponse;
        }

        return fetch(request).then((networkResponse) => {
          if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
          }
          return networkResponse;
        }).catch((err) => {
          console.warn('[PWA SW] Asset fetch failed:', request.url, err);
        });
      })
    );
  }
});
