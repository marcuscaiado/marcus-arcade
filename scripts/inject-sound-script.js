import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const SCRATCH_DIR = path.resolve(ROOT_DIR, '..');

const manifestPath = path.join(ROOT_DIR, 'src', 'games-manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

console.log(`🔍 Injecting arcade-sound-engine.js script tag into all games...`);

// First update marcus-arcade index.html
const hubHtmlPath = path.join(ROOT_DIR, 'index.html');
if (fs.existsSync(hubHtmlPath)) {
  let hubHtml = fs.readFileSync(hubHtmlPath, 'utf8');
  if (!hubHtml.includes('arcade-sound-engine.js')) {
    hubHtml = hubHtml.replace('</head>', '    <script src="./arcade-sound-engine.js"></script>\n    <script src="./arcade-leaderboard.js"></script>\n  </head>');
    fs.writeFileSync(hubHtmlPath, hubHtml, 'utf8');
    console.log('✅ Injected into marcus-arcade index.html');
  }
}

for (const game of manifest) {
  const gameDir = path.join(SCRATCH_DIR, game.id);
  const htmlPath = path.join(gameDir, 'index.html');
  if (!fs.existsSync(htmlPath)) {
    console.warn(`⚠️ Missing index.html for ${game.id}`);
    continue;
  }

  let html = fs.readFileSync(htmlPath, 'utf8');
  if (!html.includes('arcade-sound-engine.js')) {
    // Check if arcade-leaderboard.js is present
    if (html.includes('arcade-leaderboard.js')) {
      html = html.replace(/(<script[^>]*src=["'][^"']*arcade-leaderboard\.js["'][^>]*><\/script>)/i, '<script src="arcade-sound-engine.js"></script>\n  $1');
    } else if (html.includes('</head>')) {
      html = html.replace('</head>', '  <script src="arcade-sound-engine.js"></script>\n  <script src="arcade-leaderboard.js"></script>\n</head>');
    } else if (html.includes('</body>')) {
      html = html.replace('</body>', '  <script src="arcade-sound-engine.js"></script>\n  <script src="arcade-leaderboard.js"></script>\n</body>');
    }
    fs.writeFileSync(htmlPath, html, 'utf8');
    console.log(`✅ Injected into ${game.id}/index.html`);
  } else {
    console.log(`ℹ️ Already has sound engine script: ${game.id}`);
  }
}

console.log('\n✨ Script injection complete!');
