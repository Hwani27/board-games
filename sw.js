/* 블록 게임 오프라인 서비스 워커 — BUILD 값은 tools/stamp_sw.py 가 index.html 해시로 갱신 */
const BUILD = 'v6.3.0-c6f6145925';
const CACHE = 'blockgames-' + BUILD;
const CORE = ['./', './index.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-192.png', './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png', './icons/favicon-64.png'];

self.addEventListener('install', e => {
  // 새 버전은 미리 전부 받아 두고 대기 → 페이지에서 "업데이트" 를 누르면 교체
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(CORE.map(u =>
    fetch(new Request(u, { cache: 'reload' })).then(r => { if (!r.ok) throw new Error(u + ' ' + r.status); return c.put(u, r); })))));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('blockgames-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
  if (e.data === 'build' && e.source) e.source.postMessage({ build: BUILD });
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.endsWith('/sw.js')) return;
  if (req.mode === 'navigate') {
    // 게임 본체: 캐시 우선(오프라인·빠른 시작). 새 버전은 sw.js 변경 → 업데이트 안내로 교체
    e.respondWith(caches.open(CACHE).then(c => c.match('./index.html').then(hit => hit || fetch(req).then(r => {
      if (r.ok) c.put('./index.html', r.clone()); return r; }))).catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.open(CACHE).then(c => c.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(r => {
    if (r.ok && r.type === 'basic') c.put(req, r.clone()); return r; }))));
});
