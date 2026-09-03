const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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

console.log('📦 Building marcus-arcade bundle...');
execSync('node ./node_modules/vite/bin/vite.js build', { stdio: 'inherit' });

execSync('git add -A', { stdio: 'inherit' });
const masterStatus = execSync('git status -s', { encoding: 'utf8' }).trim();
if (masterStatus) {
  execSync('git commit -m "refactor(ui): remove serotonin dopamine badge from header deck"', { stdio: 'inherit' });
  execSync('git push origin master', { stdio: 'inherit' });
}

const tempDist = path.resolve('../.temp-dist-marcus-arcade');
if (fs.existsSync(tempDist)) fs.rmSync(tempDist, { recursive: true, force: true });
copyFolderSync('dist', tempDist);

execSync('git checkout gh-pages', { stdio: 'inherit' });
copyFolderSync(tempDist, '.');
fs.rmSync(tempDist, { recursive: true, force: true });

execSync('git add -A', { stdio: 'inherit' });
const status = execSync('git status -s', { encoding: 'utf8' }).trim();
if (status) {
  execSync('git commit -m "deploy: 🚀 DDA dynamic difficulty calibration update"', { stdio: 'inherit' });
  execSync('git push origin gh-pages', { stdio: 'inherit' });
}
execSync('git checkout master', { stdio: 'inherit' });
console.log('marcus-arcade master & gh-pages updated successfully!');
