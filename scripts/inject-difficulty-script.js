import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const SCRATCH_DIR = path.resolve(ROOT_DIR, '..');

const manifestPath = path.join(ROOT_DIR, 'src', 'games-manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

console.log('Injecting <script src="arcade-difficulty.js"></script> across games...');

let updated = 0;
for (const game of manifest) {
  const htmlPath = path.join(SCRATCH_DIR, game.id, 'index.html');
  if (fs.existsSync(htmlPath)) {
    let content = fs.readFileSync(htmlPath, 'utf8');
    if (!content.includes('arcade-difficulty.js')) {
      if (content.includes('<script src="arcade-sound-engine.js"></script>')) {
        content = content.replace(
          '<script src="arcade-sound-engine.js"></script>',
          '<script src="arcade-sound-engine.js"></script>\n  <script src="arcade-difficulty.js"></script>'
        );
      } else if (content.includes('<head>')) {
        content = content.replace(
          '<head>',
          '<head>\n  <script src="arcade-difficulty.js"></script>'
        );
      }
      fs.writeFileSync(htmlPath, content, 'utf8');
      updated++;
      console.log(`✅ Injected into ${game.id}/index.html`);
    } else {
      console.log(`✨ Already present in ${game.id}`);
    }
  }
}

console.log(`\nUpdated ${updated} games.`);
