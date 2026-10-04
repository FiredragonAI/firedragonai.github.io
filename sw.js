// Offline shell for Listen Everything.
//
// The app's own work -- voices, file parsing, reading aloud -- needs no network,
// so the page itself is worth keeping. Network-first for the document, so a new
// build reaches people the moment they are online; cache-first for the icons,
// which never change. The heavy libraries (pdf.js, mammoth, tesseract) stay
// network-only: they are megabytes each and only one feature needs each one.
const CACHE = 'listen-everything-v2';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;   // CDNs and services: straight to the network

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
