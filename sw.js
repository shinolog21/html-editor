// ネットワーク優先+キャッシュフォールバック(オフライン対応)。
// 更新はmainへpushするだけ(オンライン時は常に最新を取得)。VERSIONは古いキャッシュの掃除用。
const VERSION = 'v1.4.2';
const CACHE = 'html-editor-' + VERSION;
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './vendor/marked.min.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() =>
      caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('./index.html'))
    )
  );
});
