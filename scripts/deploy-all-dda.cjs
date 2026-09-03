const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SCRATCH_DIR = 'C:/Users/Marcus/.gemini/antigravity-ide/scratch';

const staticRepos = [
  'sky-ace-1944', 'asteroid-blitz', 'flappy-cyber-droid', 'brick-breaker-fx',
  'neon-drift-racer', 'neon-orbit-drift', 'neon-katana-slash', 'cyber-shuriken',
  'cyber-runner-3d', 'neon-stack-3d', 'cyber-pong-3d', 'neon-viper',
  'geometricsurvivor', 'stickman-fps-arcade', 'cyber-pinball-fx', 'neon-drop-2048',
  'neon-archery-master', 'neon-pachinko-pop'
];

const viteRepos = [
  'cute-mini-golf', 'kawaii-8ball-pool', 'neon-tetris-3d'
];

function copyFolderSync(from, to) {
  if (!fs.existsSync(to)) fs.mkdirSync(to, { recursive: true });
  fs.readdirSync(from).forEach(element => {
    const fromPath = path.join(from, element);
    const toPath = path.join(to, element);
    if (fs.lstatSync(fromPath).isDirectory()) {
      copyFolderSync(fromPath, toPath);
    } else {
      fs.copyFileSync(fromPath, toPath);
    }
  });
}

function deployStaticRepo(repo) {
  const dir = path.join(SCRATCH_DIR, repo);
  console.log(`\n==============================================`);
  console.log(`Processing Static Game: ${repo}`);
  console.log(`==============================================`);

  const origBranch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: dir, encoding: 'utf8' }).trim();
  
  // 1. Commit on working branch
  const status = execSync('git status -s', { cwd: dir, encoding: 'utf8' }).trim();
  if (status) {
    execSync('git add -A', { cwd: dir, stdio: 'pipe' });
    execSync('git commit -m "feat(balance): calibrate dynamic difficulty curve (DDA) with exponential easing"', { cwd: dir, stdio: 'pipe' });
    console.log(`[${repo}] Committed changes to ${origBranch}`);
  }
  try {
    execSync(`git push origin ${origBranch}`, { cwd: dir, stdio: 'pipe' });
    console.log(`[${repo}] Pushed ${origBranch} to origin`);
  } catch (e) {
    console.warn(`[${repo}] Push to ${origBranch} skipped or already up to date`);
  }

  // 2. Sync to gh-pages
  execSync('git checkout gh-pages', { cwd: dir, stdio: 'pipe' });
  execSync(`git checkout ${origBranch} -- .`, { cwd: dir, stdio: 'pipe' });

  const ghStatus = execSync('git status -s', { cwd: dir, encoding: 'utf8' }).trim();
  if (ghStatus) {
    execSync('git add -A', { cwd: dir, stdio: 'pipe' });
    execSync('git commit -m "deploy: 🚀 DDA dynamic difficulty calibration update"', { cwd: dir, stdio: 'pipe' });
    execSync('git push origin gh-pages', { cwd: dir, stdio: 'inherit' });
    console.log(`[${repo}] ✅ Pushed to gh-pages!`);
  } else {
    console.log(`[${repo}] gh-pages already up-to-date.`);
  }

  // Return to original branch
  execSync(`git checkout ${origBranch}`, { cwd: dir, stdio: 'pipe' });
}

function deployViteRepo(repo) {
  const dir = path.join(SCRATCH_DIR, repo);
  console.log(`\n==============================================`);
  console.log(`Processing Vite Game: ${repo}`);
  console.log(`==============================================`);

  const origBranch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: dir, encoding: 'utf8' }).trim();

  // 1. Commit on working branch
  const status = execSync('git status -s', { cwd: dir, encoding: 'utf8' }).trim();
  if (status) {
    execSync('git add -A', { cwd: dir, stdio: 'pipe' });
    execSync('git commit -m "feat(balance): calibrate dynamic difficulty curve (DDA) with exponential easing"', { cwd: dir, stdio: 'pipe' });
    console.log(`[${repo}] Committed changes to ${origBranch}`);
  }
  try {
    execSync(`git push origin ${origBranch}`, { cwd: dir, stdio: 'pipe' });
    console.log(`[${repo}] Pushed ${origBranch} to origin`);
  } catch (e) {
    console.warn(`[${repo}] Push to ${origBranch} skipped or already up to date`);
  }

  // 2. Build Vite dist
  console.log(`[${repo}] Building production bundle...`);
  execSync('npm.cmd run build', { cwd: dir, stdio: 'pipe' });

  // 3. Stash dist files in a temp folder outside git worktree
  const tempDist = path.join(SCRATCH_DIR, `.temp-dist-${repo}`);
  if (fs.existsSync(tempDist)) fs.rmSync(tempDist, { recursive: true, force: true });
  copyFolderSync(path.join(dir, 'dist'), tempDist);

  // 4. Checkout gh-pages
  execSync('git checkout gh-pages', { cwd: dir, stdio: 'pipe' });

  // 5. Copy dist files into gh-pages root
  copyFolderSync(tempDist, dir);
  fs.rmSync(tempDist, { recursive: true, force: true });

  // Also ensure root helper files exist if present in origBranch
  for (const f of ['arcade-sound-engine.js', 'arcade-difficulty.js', 'arcade-leaderboard.js']) {
    const srcFile = path.join(dir, 'public', f);
    const destFile = path.join(dir, f);
    if (fs.existsSync(srcFile) && !fs.existsSync(destFile)) {
      fs.copyFileSync(srcFile, destFile);
    }
  }

  const ghStatus = execSync('git status -s', { cwd: dir, encoding: 'utf8' }).trim();
  if (ghStatus) {
    execSync('git add -A', { cwd: dir, stdio: 'pipe' });
    execSync('git commit -m "deploy: 🚀 DDA dynamic difficulty calibration update (Vite dist)"', { cwd: dir, stdio: 'pipe' });
    execSync('git push origin gh-pages', { cwd: dir, stdio: 'inherit' });
    console.log(`[${repo}] ✅ Pushed to gh-pages!`);
  } else {
    console.log(`[${repo}] gh-pages already up-to-date.`);
  }

  // Return to original branch
  execSync(`git checkout ${origBranch}`, { cwd: dir, stdio: 'pipe' });
}

console.log('🚀 STARTING ARCADE-WIDE DDA DEPLOYMENT TO GITHUB PAGES');
console.log(`Static Games: ${staticRepos.length}`);
console.log(`Vite Games:   ${viteRepos.length}\n`);

for (const repo of staticRepos) {
  try {
    deployStaticRepo(repo);
  } catch (err) {
    console.error(`ERROR deploying ${repo}:`, err.message);
  }
}

for (const repo of viteRepos) {
  try {
    deployViteRepo(repo);
  } catch (err) {
    console.error(`ERROR deploying ${repo}:`, err.message);
  }
}

console.log('\n==============================================');
console.log('🎉 ALL GAMES PROCESSED & SYNCED TO GH-PAGES');
console.log('==============================================');
