/*
 * Learning Library service worker.
 * It lets the site install and open as an app, and keeps a copy of every page you visit,
 * so those pages still open with no internet. Pages always try the network first, so you
 * never see an old version while online. All paths are relative to this file's folder,
 * so the site can move without editing this file.
 */
const VERSION = 'v1';
const PAGES = `library-pages-${VERSION}`;
const FILES = `library-files-${VERSION}`;
const SCOPE = self.registration.scope; // e.g. https://efrahdev.github.io/Learning/

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(PAGES).then((c) => c.add(SCOPE)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key !== PAGES && key !== FILES) await caches.delete(key);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || !req.url.startsWith(SCOPE)) return;

  // Pages: network first; with no network, the saved copy (or the home page).
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const res = await fetch(req);
        if (res.ok) (await caches.open(PAGES)).put(req, res.clone());
        return res;
      } catch {
        return (await caches.match(req)) || (await caches.match(SCOPE)) || Response.error();
      }
    })());
    return;
  }

  // Build files in /_astro/ have the content's fingerprint in their names, so they never change:
  // use the saved copy first. Everything else (images, fonts, files inside older lessons): network
  // first, saved copy when offline.
  const fingerprinted = new URL(req.url).pathname.includes('/_astro/');
  event.respondWith((async () => {
    const cache = await caches.open(FILES);
    if (fingerprinted) {
      const hit = await cache.match(req);
      if (hit) return hit;
    }
    try {
      const res = await fetch(req);
      if (res.ok && res.type === 'basic') cache.put(req, res.clone());
      return res;
    } catch {
      return (await cache.match(req)) || Response.error();
    }
  })());
});
