// StudyMate Service Worker - Offline Study Companion
const CACHE_VERSION = 'studymate-v1.2';
const STATIC_CACHE = `studymate-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `studymate-dynamic-${CACHE_VERSION}`;
const RESOURCE_CACHE = `studymate-resources-${CACHE_VERSION}`;

// Essential study app shell assets to precache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.webmanifest',
];

// Maximum items to keep in dynamic caches to prevent boundless storage growth
const MAX_DYNAMIC_ITEMS = 80;

async function limitCacheSize(cacheName, maxItems) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxItems) {
      await cache.delete(keys[0]);
      limitCacheSize(cacheName, maxItems);
    }
  } catch (err) {
    console.warn('[SW] Cache pruning error:', err);
  }
}

// 1. Install Event: Pre-cache core shell
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installing, precaching essential study resources...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
      try {
        await cache.addAll(PRECACHE_ASSETS);
        console.log('[SW] Pre-cached core assets successfully.');
      } catch (err) {
        console.warn('[SW] Precache non-blocking failure:', err);
      }
      return self.skipWaiting();
    })
  );
});

// 2. Activate Event: Clean up outdated caches and claim clients
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activating, clearing old caches...');
  const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE, RESOURCE_CACHE];

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!currentCaches.includes(cacheName)) {
            console.log('[SW] Deleting obsolete cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event Strategy:
// - Navigation requests (HTML SPA): Network-first with Cache fallback to /index.html
// - Static build assets (.js, .css, .woff2, .svg, images): Stale-While-Revalidate
// - API calls: Network-first with offline fallback json
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET requests (e.g., POST/PUT for AI API) or Chrome extensions / non-HTTP
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // A. Navigation Request (SPA Page Routing)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          console.log('[SW] Offline navigation requested, serving cached app shell for:', url.pathname);
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          const fallback = await caches.match('/index.html');
          return fallback || new Response(
            `<!DOCTYPE html><html><head><title>StudyMate Offline</title></head><body style="font-family:sans-serif;text-align:center;padding:40px;"><h2>⚡ StudyMate Offline Mode</h2><p>You are currently offline. Please reconnect or open cached StudyMate resources.</p></body></html>`,
            { headers: { 'Content-Type': 'text/html' } }
          );
        })
    );
    return;
  }

  // B. API Calls (/api/*)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          return response;
        })
        .catch(async () => {
          console.log('[SW] API offline fallback for:', url.pathname);
          return new Response(
            JSON.stringify({
              error: 'Offline Mode Active',
              message: 'You are currently offline. AI cloud generation requires internet, but your local study notes, saved flashcards, mock quizzes, Pomodoro timer, and curriculum mind map remain fully functional.',
              isOffline: true,
            }),
            {
              status: 503,
              statusText: 'Service Unavailable (Offline)',
              headers: { 'Content-Type': 'application/json' },
            }
          );
        })
    );
    return;
  }

  // C. Static JS, CSS, Font, and Media Assets (Stale-While-Revalidate)
  const isStaticAsset =
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|webp|woff2?|ttf|eot|ico|json)$/) ||
    url.pathname.startsWith('/assets/') ||
    url.origin === self.location.origin;

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(DYNAMIC_CACHE).then((cache) => {
                cache.put(request, responseClone);
                limitCacheSize(DYNAMIC_CACHE, MAX_DYNAMIC_ITEMS);
              });
            }
            return networkResponse;
          })
          .catch((err) => {
            // Network failure is fine if we have cachedResponse
            return cachedResponse;
          });

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // D. General Requests: Cache First with Network Fallback
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && request.method === 'GET') {
          const responseClone = networkResponse.clone();
          caches.open(RESOURCE_CACHE).then((cache) => {
            cache.put(request, responseClone);
            limitCacheSize(RESOURCE_CACHE, MAX_DYNAMIC_ITEMS);
          });
        }
        return networkResponse;
      });
    })
  );
});

// 4. Message Event: Handle cache controls and manual caching triggers
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((keys) => {
        return Promise.all(keys.map((k) => caches.delete(k)));
      }).then(() => {
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ cleared: true });
        }
      })
    );
  }

  if (event.data.type === 'GET_VERSION') {
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({ version: CACHE_VERSION });
    }
  }
});
