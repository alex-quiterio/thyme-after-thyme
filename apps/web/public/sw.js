/* Service worker template. scripts/postbuild.ts fills in PRECACHE and VERSION. */
const VERSION = "__VERSION__";
const PRECACHE = "__PRECACHE__";
const APP_CACHE = `thyme-app-${VERSION}`;
const FONT_CACHE = "thyme-fonts";

self.addEventListener("install", (event) => {
  // No skipWaiting here: the new version waits until the page asks for it (see SKIP_WAITING below).
  event.waitUntil(caches.open(APP_CACHE).then((c) => c.addAll(PRECACHE)));
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("thyme-app-") && k !== APP_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Tapping a timer notification brings the app forward (or opens it).
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const open = windows[0];
      return open ? open.focus() : self.clients.openWindow("./#/timer");
    }),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // Google Fonts: serve from cache, refresh in the background.
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    event.respondWith(
      caches.open(FONT_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const refresh = fetch(request)
          .then((res) => {
            if (res.ok || res.type === "opaque") cache.put(request, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached || refresh;
      }),
    );
    return;
  }

  if (url.origin !== self.location.origin) return;

  // Page loads: network first so updates arrive, cached shell when offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("./index.html").then((r) => r || caches.match("./"))),
    );
    return;
  }

  // Hashed build assets and icons: cache first.
  event.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ||
        fetch(request).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(APP_CACHE).then((c) => c.put(request, copy));
          }
          return res;
        }),
    ),
  );
});
