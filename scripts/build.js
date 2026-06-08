/**
 * Post-build script: copies static assets into dist/ so that
 * the dist/ folder becomes a self-contained deployable bundle.
 *
 * This fixes 404 errors when GitHub Pages (or any static host)
 * is configured to deploy from the dist/ directory.
 */
const fs = require('fs');
const path = require('path');

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`  copied: ${src} -> ${dest}`);
}

function writeFile(dest, content) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, content);
  console.log(`  written: ${dest}`);
}

// Ensure dist/ exists
if (!fs.existsSync('dist')) {
  console.error('Error: dist/ directory not found. Run "tsc" first.');
  process.exit(1);
}

console.log('Post-build: copying static assets to dist/...');

// 1. Copy CSS
copyFile('css/style.css', 'dist/css/style.css');

// 2. Copy manifest
copyFile('manifest.json', 'dist/manifest.json');

// 3. Build dist/index.html with corrected paths
let indexHtml = fs.readFileSync('index.html', 'utf8');
// Remove any existing favicon links (we'll add a proper one below)
indexHtml = indexHtml.replace(/<link rel="icon"[^>]*>\n?/gi, '');
// Fix asset paths for dist/ directory
indexHtml = indexHtml.replace(
  'href="css/style.css"',
  'href="./css/style.css"'
);
indexHtml = indexHtml.replace(
  'href="manifest.json"',
  'href="./manifest.json"'
);
indexHtml = indexHtml.replace(
  'src="dist/main.js"',
  'src="./main.js"'
);
indexHtml = indexHtml.replace(
  "register('sw.js')",
  "register('./sw.js')"
);
// Add inline SVG favicon (prevents 404 for favicon.ico)
const faviconLink = '  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Crect width=\'100\' height=\'100\' rx=\'20\' fill=\'%23e8c895\'/%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'35\' fill=\'%23fff\' stroke=\'%23c84b31\' stroke-width=\'4\'/%3E%3Ctext x=\'50\' y=\'58\' font-size=\'40\' text-anchor=\'middle\' fill=\'%23c84b31\' font-family=\'serif\'%3E帅%3C/text%3E%3C/svg%3E">\n';
indexHtml = indexHtml.replace(
  '<title>',
  faviconLink + '  <title>'
);
writeFile('dist/index.html', indexHtml);

// 4. Build dist/sw.js with corrected cache paths
let swJs = fs.readFileSync('sw.js', 'utf8');
// Remove dist/ prefix from paths since sw.js now lives inside dist/
swJs = swJs.replace(/'\.\/dist\//g, "'./");
writeFile('dist/sw.js', swJs);

console.log('Post-build: done. dist/ is now a self-contained deployable bundle.');
