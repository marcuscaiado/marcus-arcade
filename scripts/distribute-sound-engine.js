import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const SCRATCH_DIR = path.resolve(ROOT_DIR, '..');

const manifestPath = path.join(ROOT_DIR, 'src', 'games-manifest.json');
const engineSrc = path.join(ROOT_DIR, 'arcade-sound-engine.js');
const leaderboardSrc = path.join(ROOT_DIR, 'arcade-leaderboard.js');

if (!fs.existsSync(manifestPath)) {
  console.error(`Manifest not found at ${manifestPath}`);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const engineCode = fs.readFileSync(engineSrc, 'utf8');
const leaderboardCode = fs.readFileSync(leaderboardSrc, 'utf8');

console.log(`🚀 Distributing shared arcade scripts across all ${manifest.length} games...`);

// Copy to marcus-arcade/public
fs.writeFileSync(path.join(ROOT_DIR, 'public', 'arcade-sound-engine.js'), engineCode, 'utf8');
fs.writeFileSync(path.join(ROOT_DIR, 'public', 'arcade-leaderboard.js'), leaderboardCode, 'utf8');

let count = 0;
for (const game of manifest) {
  const targetDir = path.join(SCRATCH_DIR, game.id);
  if (fs.existsSync(targetDir)) {
    fs.writeFileSync(path.join(targetDir, 'arcade-sound-engine.js'), engineCode, 'utf8');
    fs.writeFileSync(path.join(targetDir, 'arcade-leaderboard.js'), leaderboardCode, 'utf8');
    count++;
    console.log(`✅ [${count}/${manifest.length}] Updated ${game.id}`);

    // Copy to public/ if Vite project
    const pubDir = path.join(targetDir, 'public');
    if (fs.existsSync(pubDir)) {
      fs.writeFileSync(path.join(pubDir, 'arcade-sound-engine.js'), engineCode, 'utf8');
      fs.writeFileSync(path.join(pubDir, 'arcade-leaderboard.js'), leaderboardCode, 'utf8');
      console.log(`   + also updated ${game.id}/public`);
    }
  } else {
    console.warn(`⚠️ Target directory not found for ${game.id} at ${targetDir}`);
  }
}

console.log(`\n✨ Successfully distributed shared scripts to ${count} games!`);
