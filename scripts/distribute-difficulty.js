import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const SCRATCH_DIR = path.resolve(ROOT_DIR, '..');

const sourceFile = path.join(ROOT_DIR, 'arcade-difficulty.js');

const manifestPath = path.join(ROOT_DIR, 'src', 'games-manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

console.log(`Distributing arcade-difficulty.js across ${manifest.length} games...`);

let copied = 0;
for (const game of manifest) {
  const targetDir = path.join(SCRATCH_DIR, game.id);
  if (fs.existsSync(targetDir)) {
    const targetFile = path.join(targetDir, 'arcade-difficulty.js');
    fs.copyFileSync(sourceFile, targetFile);
    copied++;

    // If it's a Vite project with public/ dir
    const publicDir = path.join(targetDir, 'public');
    if (fs.existsSync(publicDir)) {
      fs.copyFileSync(sourceFile, path.join(publicDir, 'arcade-difficulty.js'));
    }
    console.log(`✅ Copied to ${game.id}`);
  } else {
    console.warn(`⚠️ Dir not found for ${game.id}`);
  }
}

console.log(`\nSuccessfully distributed to ${copied} games!`);
