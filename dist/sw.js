const CACHE_NAME = 'xiangqi-v1';
const ASSETS = [
  './',
  './index.html',
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
