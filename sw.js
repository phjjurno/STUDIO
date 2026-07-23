/* PULSEORIGN STUDIO — Service Worker v3 */
const CACHE = 'pulseorign-v10';
const SHELL = ['./index.html', './manifest.json', './deck.jpg', './vinyl.png', './arm.png', './icons/icon-192.png', './icons/icon-512.png'];

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
  const isDoc = e.request.mode === 'navigate' ||
                url.pathname.endsWith('/') || url.pathname.endsWith('index.html');
  /* index.html(문서) + 폰트/CDN — 네트워크 우선(항상 최신), 오프라인 시 캐시 */
  if (isDoc || url.hostname.includes('fonts.') || url.hostname.includes('cdn.') ||
      url.hostname.includes('jsdelivr') || url.hostname.includes('huggingface')) {
    e.respondWith(
      fetch(e.request).then(r => {
        const clone = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return r;
      }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
    );
    return;
  }
  /* 정적 에셋(deck.jpg·vinyl.png·아이콘 등) — 캐시 우선 */
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(nr => {
      const clone = nr.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone));
      return nr;
    }))
  );
});
