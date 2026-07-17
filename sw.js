/* PULSEORIGN STUDIO — Service Worker v3 */
const CACHE = 'pulseorign-v6';
const SHELL = ['./index.html', './manifest.json', './turntable.svg', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  /* Google Fonts / CDN — network first, cache fallback */
  if (url.hostname.includes('fonts.') || url.hostname.includes('cdn.') ||
      url.hostname.includes('jsdelivr') || url.hostname.includes('huggingface')) {
    e.respondWith(
      fetch(e.request).then(r => {
        const clone = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return r;
      }).catch(() => caches.match(e.request))
    );
    return;
  }
  /* App shell — cache first */
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(nr => {
      const clone = nr.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone));
      return nr;
    }))
  );
});
