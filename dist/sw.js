const CACHE_NAME = 'xiangqi-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './main.js',
  './game/ai.js',
  './game/animation.js',
  './game/audio.js',
  './game/board.js',
  './game/codec.js',
  './game/editor.js',
  './game/engine.js',
  './game/fen.js',
  './game/notation.js',
  './game/openings.js',
  './game/particles.js',
  './game/puzzles.js',
  './game/renderer.js',
  './game/rules.js',
  './game/storage.js',
  './game/themes.js',
  './game/types.js',
  './game/zobrist.js',
  './network/webrtc.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // 逐个缓存，避免单个404导致全部失败
      for (const url of ASSETS) {
        try {
          const response = await fetch(url);
          if (response.ok) {
            await cache.put(url, response);
          } else {
            console.warn('[SW] Failed to cache (status ' + response.status + '):', url);
          }
        } catch (err) {
          console.warn('[SW] Failed to fetch:', url, err);
        }
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});
