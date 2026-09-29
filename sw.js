/* PULSEORIGN STUDIO — Service Worker v3 */
const CACHE = 'pulseorign-v112';
const SHELL = ['./index.html', './manifest.json', './assets/lp_deck.png', './assets/lp_record.png', './assets/lp_arm.png', './icons/icon-192.png', './icons/icon-512.png'];

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
  /* 속도 비교용 옛 버전은 서비스워커가 손대지 않는다 */
  if (url.pathname.includes('old-0823')) return;
  const isDoc = e.request.mode === 'navigate' ||
                url.pathname.endsWith('/') || url.pathname.endsWith('index.html');
  /* index.html(문서) + 폰트/CDN — 네트워크 우선(항상 최신), 오프라인 시 캐시 */
  if (isDoc || url.hostname.includes('fonts.') || url.hostname.includes('cdn.') ||
      url.hostname.includes('jsdelivr') || url.hostname.includes('huggingface')) {
    /* 브라우저 HTTP 캐시를 건너뛰고 항상 서버에 묻는다.
       그냥 fetch 하면 GitHub Pages 가 HTML 에 걸어 둔 10분 캐시에 걸려,
       새로 올린 뒤 새로고침해도 한동안 옛 index.html 이 그대로 돌아간다
       (그걸 다시 캐시에 넣어 버려 더 오래 남는다). */
    e.respondWith(
      fetch(e.request, { cache: 'no-store' }).then(r => {
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
