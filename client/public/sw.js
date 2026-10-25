// v2 → v3: the v2 cache had no eviction and was caching /uploads/ (photos),
// which are cookie-gated but served from cache without a server
// request. Bumping the name makes `activate` delete the whole old cache on the
// next load, purging what was already stored on real devices.
// Bump this every time caching behaviour changes — it is the only eviction
// mechanism here.
const CACHE_NAME = 'matchalize-v3';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/badge-72.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ─── FETCH HANDLER (was missing — cache was dead code) ───
// Network-first for navigation requests (always get fresh HTML)
// Cache-first for static assets (icons, manifest)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests (API calls to backend, Cloudinary, etc.)
  if (url.origin !== self.location.origin) return;
  // NEVER cache API responses — otherwise stale chat/notification data could be served
  if (url.pathname.startsWith('/api/')) return;
  // NEVER cache /uploads/ — these are the user's own photos.
  //
  // Two reasons, and the second is the serious one:
  //   1. They are unbounded user media. The cache below is cache-first with no
  //      eviction and no TTL, so every uploaded photo accumulated in the
  //      browser permanently — the cache only clears when someone hand-edits
  //      CACHE_NAME (see `activate`).
  //   2. `/uploads` is served behind `protect` (server/index.js). A cache hit is
  //      returned WITHOUT any request to the server, so no cookie is ever
  //      checked. On a shared device the next person to open the app would be
  //      served the previous user's photos straight out of the
  //      cache.
  //
  // In production uploads are Cloudinary URLs (cross-origin, already skipped by
  // the origin check above), so this only bit the local-disk fallback — but the
  // fallback is exactly what a staging/preview deploy uses, and the leak is real
  // there.
  if (url.pathname.startsWith('/uploads/')) return;
  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Network-first for navigation (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match('/index.html'); // Offline fallback
        })
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        if (!response || response.status !== 200) return response;

        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseClone);
        });
        return response;
      });
    })
  );
});

self.addEventListener('push', (event) => {
  let data = { title: 'Matchalize', body: 'You have a new notification' };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192.png',
    badge: data.badge || '/icons/badge-72.png',
    vibrate: data.vibrate || [100, 50, 100],
    data: data.data || {},
    tag: data.data?.type || 'notification',
    renotify: true,
  };

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const hasVisibleClient = clients.some((c) => c.visibilityState === 'visible' && c.focused);
      if (hasVisibleClient) return;
      return self.registration.showNotification(data.title, options);
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data;

  event.waitUntil(
    /* ⚠️ THIS CALLBACK MUST BE `async`. It uses `await client.focus()` below,
       and in a plain `.then()` callback `await` is a SyntaxError — which
       invalidates the ENTIRE file at parse time.

       That is not a cosmetic failure. A service worker that fails to parse is
       never registered at all, so `navigator.serviceWorker.register('/sw.js')`
       rejected with `SyntaxError: Unexpected identifier 'client'` and the whole
       app silently lost push notifications and offline support. The error
       surfaced only in the console as two unrelated-looking lines, which is why
       it went unnoticed.

       `matchAll` returns a promise; chaining `.then(async …)` is what makes the
       `await` legal inside it. */
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clients) => {
      // `/?chat=<id>`, NOT `/chat/<id>`: the app has no router, so a path-based
      // URL would just boot to the deck and the tap would look broken.
      // AppShell reads this param and opens the conversation.
      const target = data.alignmentId ? `/?chat=${data.alignmentId}` : '/';
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          await client.focus();
          // Push the param onto the open tab rather than navigating, so the
          // already-mounted AppShell can act on it without a full reload.
          client.postMessage({ type: 'open-chat', alignmentId: data.alignmentId || null });
          return;
        }
      }
      return self.clients.openWindow(target);
    })
  );
});