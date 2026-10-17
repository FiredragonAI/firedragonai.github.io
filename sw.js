// Offline shell for Listen Everything.
//
// The app's own work -- voices, file parsing, reading aloud -- needs no network,
// so the page itself is worth keeping. Network-first for the document, so a new
// build reaches people the moment they are online; cache-first for the icons,
// which never change.
//
// The heavy libraries (pdf.js, mammoth, tesseract) are loaded by the page only
// when a feature first needs them. Their addresses carry exact versions, so once
// fetched they are kept: after one use, PDFs, Word files and photo recognition
// also work offline. (Tesseract keeps its own language data in IndexedDB.)
const CACHE = 'listen-everything-v3';
const LIBS = 'listen-everything-libs-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon.svg'];
const VERSIONED = /^https:\/\/(cdnjs\.cloudflare\.com\/ajax\/libs|cdn\.jsdelivr\.net\/npm)\/[^/]+(\/|@)\d/;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== LIBS).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;

  if (VERSIONED.test(request.url)) {
    e.respondWith(caches.open(LIBS).then(async (c) => {
      const hit = await c.match(request);
      if (hit) return hit;
      const r = await fetch(request);
      if (r.ok || r.type === 'opaque') c.put(request, r.clone());
      return r;
    }));
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;   // other services: straight to the network

  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put('./index.html', copy)); return r; })
        .catch(() => caches.match('./index.html').then((r) => r || caches.match('./')))
    );
    return;
  }

  e.respondWith(caches.match(request).then((hit) => hit || fetch(request)));
});
