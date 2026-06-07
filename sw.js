const CACHE_NAME = 'xiangqi-v1';
const ASSETS = [
  './',
  './index.html',
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
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
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
