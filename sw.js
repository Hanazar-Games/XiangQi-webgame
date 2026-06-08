const CACHE_NAME = 'xiangqi-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './dist/main.js',
  './dist/game/ai.js',
  './dist/game/animation.js',
  './dist/game/audio.js',
  './dist/game/board.js',
  './dist/game/codec.js',
  './dist/game/editor.js',
  './dist/game/engine.js',
  './dist/game/fen.js',
  './dist/game/notation.js',
  './dist/game/openings.js',
  './dist/game/particles.js',
  './dist/game/puzzles.js',
  './dist/game/renderer.js',
  './dist/game/rules.js',
  './dist/game/storage.js',
  './dist/game/themes.js',
  './dist/game/types.js',
  './dist/game/zobrist.js',
  './dist/network/webrtc.js',
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
