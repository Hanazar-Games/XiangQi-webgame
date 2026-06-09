/**
 * Post-build verification script.
 * Runs static checks and HTTP-level 404 scans for both root and dist deployments.
 */
const fs = require('fs');
const http = require('http');
const path = require('path');

const ROOT_DIR = process.cwd();
const DIST_DIR = path.join(ROOT_DIR, 'dist');

function fail(msg) {
  console.error('❌', msg);
  process.exitCode = 1;
}

function ok(msg) {
  console.log('✅', msg);
}

function warn(msg) {
  console.log('⚠️', msg);
}

// ===== 1. Static file checks =====
console.log('\n📁 Static file checks');

const requiredRootFiles = [
  'index.html',
  'css/style.css',
  'dist/main.js',
  'dist/game/board.js',
  'dist/network/webrtc.js',
  'manifest.json',
  'sw.js',
  'favicon.ico',
];

for (const f of requiredRootFiles) {
  if (fs.existsSync(f)) ok(`root/${f} exists`);
  else fail(`root/${f} MISSING`);
}

const requiredDistFiles = [
  'index.html',
  'css/style.css',
  'main.js',
  'game/board.js',
  'network/webrtc.js',
  'manifest.json',
  'sw.js',
  'favicon.ico',
];

if (fs.existsSync(DIST_DIR)) {
  for (const f of requiredDistFiles) {
    if (fs.existsSync(path.join(DIST_DIR, f))) ok(`dist/${f} exists`);
    else fail(`dist/${f} MISSING`);
  }
} else {
  fail('dist/ directory does not exist. Run npm run build first.');
}

// ===== 2. HTML resource reference checks =====
console.log('\n🔗 HTML resource reference checks');

function checkHtmlRefs(htmlPath, baseDir) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const refs = [
    ...html.matchAll(/href="([^"]+)"/g),
    ...html.matchAll(/src="([^"]+)"/g),
  ];
  for (const [, ref] of refs) {
    if (ref.startsWith('data:')) continue;
    const rel = ref.startsWith('./') ? ref.slice(2) : ref;
    const target = path.join(baseDir, rel);
    if (fs.existsSync(target)) ok(`${path.relative(ROOT_DIR, htmlPath)} -> ${ref}`);
    else fail(`${path.relative(ROOT_DIR, htmlPath)} -> ${ref} MISSING`);
  }
}

checkHtmlRefs('index.html', ROOT_DIR);
checkHtmlRefs('dist/index.html', DIST_DIR);

// ===== 3. Service Worker cache checks =====
console.log('\n🛡️  Service Worker cache checks');

function checkSwCache(swPath, baseDir) {
  const sw = fs.readFileSync(swPath, 'utf8');
  const matches = [...sw.matchAll(/'\.\/([^']+)'/g)];
  for (const [, p] of matches) {
    if (p === '') {
      warn(`${path.relative(ROOT_DIR, swPath)} caches './' (directory root, expected)`);
      continue;
    }
    const target = path.join(baseDir, p);
    if (fs.existsSync(target)) ok(`${path.relative(ROOT_DIR, swPath)} caches ./${p}`);
    else fail(`${path.relative(ROOT_DIR, swPath)} caches ./${p} MISSING`);
  }
}

checkSwCache('sw.js', ROOT_DIR);
checkSwCache('dist/sw.js', DIST_DIR);

// ===== 4. Module import chain checks =====
console.log('\n📦 Module import chain checks');

function checkModuleChain(dir) {
  const files = [];
  function walk(d) {
    for (const f of fs.readdirSync(d)) {
      const p = path.join(d, f);
      const s = fs.statSync(p);
      if (s.isDirectory()) walk(p);
      else if (f.endsWith('.js') && !f.endsWith('.map')) files.push(p);
    }
  }
  walk(dir);

  for (const f of files) {
    const content = fs.readFileSync(f, 'utf8');
    const imports = [...content.matchAll(/from\s+'(\.[^']+)'/g)];
    for (const [, imp] of imports) {
      // ES modules already include .js suffix; do not append another
      const resolved = path.resolve(path.dirname(f), imp);
      if (fs.existsSync(resolved)) ok(`${path.relative(ROOT_DIR, f)} -> ${imp}`);
      else fail(`${path.relative(ROOT_DIR, f)} -> ${imp} MISSING`);
    }
  }
}

checkModuleChain(DIST_DIR);

// ===== 5. HTTP 404 scan =====
console.log('\n🌐 HTTP 404 scan');

const distPathsToCheck = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/css/style.css',
  '/main.js',
  '/manifest.json',
  '/sw.js',
  '/game/ai.js',
  '/game/animation.js',
  '/game/audio.js',
  '/game/board.js',
  '/game/codec.js',
  '/game/editor.js',
  '/game/engine.js',
  '/game/fen.js',
  '/game/notation.js',
  '/game/openings.js',
  '/game/particles.js',
  '/game/puzzles.js',
  '/game/renderer.js',
  '/game/rules.js',
  '/game/storage.js',
  '/game/themes.js',
  '/game/types.js',
  '/game/zobrist.js',
  '/network/webrtc.js',
];

const rootPathsToCheck = distPathsToCheck.map(p =>
  p === '/' || p === '/index.html' || p === '/favicon.ico' || p === '/css/style.css' || p === '/manifest.json' || p === '/sw.js'
    ? p
    : '/dist' + p
);

function startServer(root, port) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const filePath = path.join(root, req.url === '/' ? 'index.html' : req.url);
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end('Not found');
        } else {
          res.writeHead(200);
          res.end(data);
        }
      });
    });
    server.listen(port, () => resolve(server));
    server.on('error', reject);
  });
}

async function httpScan(label, root, paths, basePort) {
  let port = basePort;
  let server;
  while (true) {
    try {
      server = await startServer(root, port);
      break;
    } catch (e) {
      if (e.code === 'EADDRINUSE') port++;
      else throw e;
    }
  }
  let failed = 0;
  for (const p of paths) {
    const res = await new Promise((resolve) => {
      http.get(`http://localhost:${port}${p}`, (res) => {
        resolve(res.statusCode);
      }).on('error', () => resolve(0));
    });
    if (res === 200) ok(`${label} ${p}`);
    else { fail(`${label} ${p} -> ${res}`); failed++; }
  }
  server.close();
  return failed;
}

(async () => {
  const rootFailures = await httpScan('root', ROOT_DIR, rootPathsToCheck, 8765);
  const distFailures = await httpScan('dist', DIST_DIR, distPathsToCheck, 8770);

  console.log('\n📊 Summary');
  if (process.exitCode) {
    console.log('❌ Verification FAILED. Fix the issues above before deploying.');
  } else {
    console.log('✅ All checks passed. Ready to deploy.');
  }
  process.exit(process.exitCode || 0);
})();
