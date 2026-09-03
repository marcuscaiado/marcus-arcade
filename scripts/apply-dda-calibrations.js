/**
 * apply-dda-calibrations.js
 * Applies the calibrated Dynamic Difficulty Adjustment (DDA) calls across
 * all 20 remaining games in the Marcus Arcade workspace.
 */

const fs = require('fs');
const path = require('path');

const SCRATCH_DIR = 'C:/Users/Marcus/.gemini/antigravity-ide/scratch';

function updateFile(filePath, transforms) {
  if (!fs.existsSync(filePath)) {
    console.error(`[NOT FOUND] ${filePath}`);
    return false;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  const isCrlf = content.includes('\r\n');
  content = content.replace(/\r\n/g, '\n');

  let modified = false;
  for (const { search, replace, name } of transforms) {
    const normSearch = typeof search === 'string' ? search.replace(/\r\n/g, '\n') : search;
    const normReplace = typeof replace === 'string' ? replace.replace(/\r\n/g, '\n') : replace;

    if (typeof normSearch === 'string') {
      if (!content.includes(normSearch)) {
        console.warn(`[WARN] Pattern "${name || normSearch.substring(0, 30)}..." not found in ${path.basename(filePath)}`);
        continue;
      }
      content = content.replace(normSearch, normReplace);
      modified = true;
    } else {
      if (!normSearch.test(content)) {
        console.warn(`[WARN] Regex "${name || normSearch}" not matched in ${path.basename(filePath)}`);
        continue;
      }
      content = content.replace(normSearch, normReplace);
      modified = true;
    }
  }

  if (modified) {
    if (isCrlf) content = content.replace(/\n/g, '\r\n');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[SUCCESS] Calibrated ${path.basename(path.dirname(filePath))}/${path.basename(filePath)}`);
    return true;
  } else {
    console.log(`[SKIP] No modifications applied for ${filePath}`);
    return false;
  }
}

// ==========================================
// 1. ASTEROID BLITZ
// ==========================================
updateFile(path.join(SCRATCH_DIR, 'asteroid-blitz/index.html'), [
  {
    name: 'createAsteroid DDA velocity',
    search: `    function createAsteroid(x, y, r, tier) {
      const vertCount = 8 + Math.floor(Math.random() * 5);
      const offsets = [];
      for (let i = 0; i < vertCount; i++) offsets.push(0.8 + Math.random() * 0.4);
      return {
        x, y, r, tier,
        vx: (Math.random() - 0.5) * (3.0 - tier * 0.6),
        vy: (Math.random() - 0.5) * (3.0 - tier * 0.6),
        angle: Math.random() * Math.PI * 2,
        rotSpd: (Math.random() - 0.5) * 0.03,
        vertCount, offsets,
        color: ['#ff007f', '#00f5ff', '#ffff00'][tier - 1]
      };
    }`,
    replace: `    function createAsteroid(x, y, r, tier) {
      const ddaMult = window.ArcadeDifficulty ? ArcadeDifficulty.getMultiplier(score, 5000, 2.0) : 1.0;
      const vertCount = 8 + Math.floor(Math.random() * 5);
      const offsets = [];
      for (let i = 0; i < vertCount; i++) offsets.push(0.8 + Math.random() * 0.4);
      const spdFactor = (3.0 - tier * 0.6) * Math.min(1.5, 0.85 + 0.15 * ddaMult);
      return {
        x, y, r, tier,
        vx: (Math.random() - 0.5) * spdFactor,
        vy: (Math.random() - 0.5) * spdFactor,
        angle: Math.random() * Math.PI * 2,
        rotSpd: (Math.random() - 0.5) * 0.03 * ddaMult,
        vertCount, offsets,
        color: ['#ff007f', '#00f5ff', '#ffff00'][tier - 1]
      };
    }`
  },
  {
    name: 'wave spawn count DDA',
    search: `      if (asteroids.length === 0) {
        waveCount++;
        spawnAsteroids(Math.min(3 + waveCount, 10));
      }`,
    replace: `      if (asteroids.length === 0) {
        waveCount++;
        const targetWaveAsteroids = window.ArcadeDifficulty ? ArcadeDifficulty.scaleCount(3 + waveCount, score, 5000, 11) : Math.min(3 + waveCount, 10);
        spawnAsteroids(targetWaveAsteroids);
      }`
  },
  {
    name: 'restartGame reset',
    search: `    function restartGame() {\n      score = 0;`,
    replace: `    function restartGame() {\n      if (window.ArcadeDifficulty) ArcadeDifficulty.reset();\n      score = 0;`
  }
]);

// ==========================================
// 2. FLAPPY CYBER DROID
// ==========================================
updateFile(path.join(SCRATCH_DIR, 'flappy-cyber-droid/index.html'), [
  {
    name: 'spawnPipe gap DDA',
    search: `      const baseGap = Math.max(195, 225 - Math.min(25, score * 0.8));`,
    replace: `      const baseGap = window.ArcadeDifficulty ? ArcadeDifficulty.scaleInterval(225, score, 50, 185, 1.8) : Math.max(195, 225 - Math.min(25, score * 0.8));`
  },
  {
    name: 'speed progression DDA',
    search: `      // Dynamic Speed Progression (Smooth 2.1 to 2.8)
      const currentSpeed = 2.1 + Math.min(0.7, score * 0.025);

      // Spawning Pipes
      pipeTimer++;
      if (pipeTimer > 125) { spawnPipe(); pipeTimer = 0; }`,
    replace: `      // Dynamic Speed Progression (Smooth 2.1 to 2.8)
      const currentSpeed = window.ArcadeDifficulty ? ArcadeDifficulty.scaleSpeed(2.1, score, 50, 1.5) : (2.1 + Math.min(0.7, score * 0.025));

      // Spawning Pipes
      pipeTimer++;
      const pipeInterval = window.ArcadeDifficulty ? ArcadeDifficulty.scaleInterval(125, score, 50, 95, 1.4) : 125;
      if (pipeTimer > pipeInterval) { spawnPipe(); pipeTimer = 0; }`
  },
  {
    name: 'restartGame reset',
    search: `    function restartGame() {\n      score = 0;`,
    replace: `    function restartGame() {\n      if (window.ArcadeDifficulty) ArcadeDifficulty.reset();\n      score = 0;`
  }
]);

// ==========================================
// 3. BRICK BREAKER FX
// ==========================================
updateFile(path.join(SCRATCH_DIR, 'brick-breaker-fx/index.html'), [
  {
    name: 'paddle hit speed DDA',
    search: `          b.vy = -Math.abs(b.vy);
          const hitOffset = (b.x - paddle.x) / (paddle.w / 2);
          b.vx = hitOffset * 7.5;`,
    replace: `          const ddaMult = window.ArcadeDifficulty ? ArcadeDifficulty.getMultiplier(score, 3500, 1.8) : 1.0;
          b.vy = -Math.abs(b.vy);
          const hitOffset = (b.x - paddle.x) / (paddle.w / 2);
          b.vx = hitOffset * (7.5 * Math.min(1.4, 0.9 + 0.1 * ddaMult));`
  },
  {
    name: 'relaunch ball DDA',
    search: `          balls.push({ x: paddle.x, y: 530, vx: 5, vy: -6, r: 8, fire: false, fireTimer: 0 });`,
    replace: `          const ddaMult = window.ArcadeDifficulty ? ArcadeDifficulty.getMultiplier(score, 3500, 1.8) : 1.0;
          balls.push({ x: paddle.x, y: 530, vx: 5 * Math.min(1.3, 0.95 + 0.08 * ddaMult), vy: -6 * Math.min(1.3, 0.95 + 0.08 * ddaMult), r: 8, fire: false, fireTimer: 0 });`
  },
  {
    name: 'restartGame reset',
    search: `    function restartGame() {\n      score = 0;`,
    replace: `    function restartGame() {\n      if (window.ArcadeDifficulty) ArcadeDifficulty.reset();\n      score = 0;`
  }
]);

// ==========================================
// 4. NEON DRIFT RACER
// ==========================================
updateFile(path.join(SCRATCH_DIR, 'neon-drift-racer/index.html'), [
  {
    name: 'spawnTraffic DDA',
    search: `      spawnTimer++;
      if (spawnTimer > 85) { // Fair, controlled spawn cadence
        spawnTimer = 0;
        // Never block all lanes — randomly pick 1 or 2 lanes max
        const numCars = Math.random() < 0.35 ? 2 : 1;`,
    replace: `      spawnTimer++;
      const trafficCadence = window.ArcadeDifficulty ? ArcadeDifficulty.scaleInterval(85, score, 5500, 48, 1.8) : 85;
      if (spawnTimer > trafficCadence) { // Fair, controlled spawn cadence
        spawnTimer = 0;
        const ddaMult = window.ArcadeDifficulty ? ArcadeDifficulty.getMultiplier(score, 5500, 2.0) : 1.0;
        // Never block all lanes — randomly pick 1 or 2 lanes max
        const numCars = Math.random() < Math.min(0.55, 0.35 * ddaMult) ? 2 : 1;`
  },
  {
    name: 'approachSpeed DDA',
    search: `      const approachSpeed = 0.007 * (speed / 120);`,
    replace: `      const ddaSpeedScale = window.ArcadeDifficulty ? Math.min(1.35, 0.92 + 0.08 * ArcadeDifficulty.getMultiplier(score, 5500, 2.0)) : 1.0;
      const approachSpeed = 0.007 * (speed / 120) * ddaSpeedScale;`
  },
  {
    name: 'restartGame reset',
    search: `    function restartGame() {\n      currentLaneIdx = 1;`,
    replace: `    function restartGame() {\n      if (window.ArcadeDifficulty) ArcadeDifficulty.reset();\n      currentLaneIdx = 1;`
  }
]);

// ==========================================
// 5. NEON ORBIT DRIFT
// ==========================================
updateFile(path.join(SCRATCH_DIR, 'neon-orbit-drift/index.html'), [
  {
    name: 'orbital speed DDA',
    search: `        // Orbital angular velocity
        const speed = 7.5;`,
    replace: `        // Orbital angular velocity
        const speed = window.ArcadeDifficulty ? ArcadeDifficulty.scaleSpeed(7.5, score, 30, 1.45) : 7.5;`
  },
  {
    name: 'gravity well clamp DDA',
    search: `        let minDist = 290;`,
    replace: `        const ddaMult = window.ArcadeDifficulty ? ArcadeDifficulty.getMultiplier(score, 30, 2.0) : 1.0;
        let minDist = Math.max(220, 290 - (ddaMult - 1.0) * 45);`
  },
  {
    name: 'initGame reset',
    search: `    function initGame() {\n      score = 0;`,
    replace: `    function initGame() {\n      if (window.ArcadeDifficulty) ArcadeDifficulty.reset();\n      score = 0;`
  }
]);

// ==========================================
// 6. NEON KATANA SLASH
// ==========================================
updateFile(path.join(SCRATCH_DIR, 'neon-katana-slash/index.html'), [
  {
    name: 'spawnWave DDA',
    search: `    function spawnWave() {
      const count = Math.floor(Math.random() * 3) + 2;
      const hasBomb = Math.random() < 0.18;`,
    replace: `    function spawnWave() {
      const ddaMult = window.ArcadeDifficulty ? ArcadeDifficulty.getMultiplier(score, 1800, 2.0) : 1.0;
      const count = window.ArcadeDifficulty ? ArcadeDifficulty.scaleCount(Math.floor(Math.random() * 3) + 2, score, 1800, 6) : (Math.floor(Math.random() * 3) + 2);
      const hasBomb = Math.random() < Math.min(0.38, 0.18 * ddaMult);`
  },
  {
    name: 'waveTimer DDA',
    search: `      waveTimer--;
      if (waveTimer <= 0) {
        spawnWave();
        waveTimer = 75 + Math.floor(Math.random() * 25);
      }`,
    replace: `      waveTimer--;
      if (waveTimer <= 0) {
        spawnWave();
        const baseInterval = 75 + Math.floor(Math.random() * 25);
        waveTimer = window.ArcadeDifficulty ? ArcadeDifficulty.scaleInterval(baseInterval, score, 1800, 48, 1.7) : baseInterval;
      }`
  },
  {
    name: 'startGame reset',
    search: `    function startGame() {\n      initGame();`,
    replace: `    function startGame() {\n      if (window.ArcadeDifficulty) ArcadeDifficulty.reset();\n      initGame();`
  }
]);

// ==========================================
// 7. CYBER SHURIKEN
// ==========================================
updateFile(path.join(SCRATCH_DIR, 'cyber-shuriken/index.html'), [
  {
    name: 'initStage DDA',
    search: `      // Dynamic rotation modes: Steady, Oscillating, Pulse
      core.baseRotSpeed = 0.022 + Math.min(0.014, stageNum * 0.0018);
      core.rotMode = stageNum % 3; // 0: Steady, 1: Pendulum Wave, 2: Pulse Speed
      core.rotSpeed = core.baseRotSpeed;

      bladesTotal = 6 + Math.min(Math.floor(stageNum / 2), 5);`,
    replace: `      // Dynamic rotation modes: Steady, Oscillating, Pulse
      const ddaMult = window.ArcadeDifficulty ? ArcadeDifficulty.getMultiplier(score, 1800, 2.1) : 1.0;
      core.baseRotSpeed = (0.022 + Math.min(0.014, stageNum * 0.0018)) * Math.min(1.45, 0.9 + 0.1 * ddaMult);
      core.rotMode = stageNum % 3; // 0: Steady, 1: Pendulum Wave, 2: Pulse Speed
      core.rotSpeed = core.baseRotSpeed;

      bladesTotal = window.ArcadeDifficulty ? ArcadeDifficulty.scaleCount(6 + Math.min(Math.floor(stageNum / 2), 5), score, 1800, 12) : (6 + Math.min(Math.floor(stageNum / 2), 5));`
  },
  {
    name: 'restartGame reset',
    search: `    function restartGame() {\n      score = 0;`,
    replace: `    function restartGame() {\n      if (window.ArcadeDifficulty) ArcadeDifficulty.reset();\n      score = 0;`
  }
]);

// ==========================================
// 8. CYBER RUNNER 3D
// ==========================================
updateFile(path.join(SCRATCH_DIR, 'cyber-runner-3d/index.html'), [
  {
    name: 'spawnItems DDA',
    search: `      spawnTimer++;
      if (spawnTimer > 175) { // Fair, controlled spawn rate`,
    replace: `      spawnTimer++;
      const currentScore = Math.floor(distance) + orbsCollected * 10;
      const runnerInterval = window.ArcadeDifficulty ? ArcadeDifficulty.scaleInterval(175, currentScore, 3000, 95, 1.8) : 175;
      if (spawnTimer > runnerInterval) { // Fair, controlled spawn rate`
  },
  {
    name: 'approachSpeed DDA',
    search: `      const approachSpeed = 0.0024 + Math.min(0.0008, distance * 0.00002);`,
    replace: `      const currentScore = Math.floor(distance) + orbsCollected * 10;
      const ddaMult = window.ArcadeDifficulty ? ArcadeDifficulty.getMultiplier(currentScore, 3000, 2.0) : 1.0;
      const approachSpeed = (0.0024 + Math.min(0.0008, distance * 0.00002)) * Math.min(1.4, 0.9 + 0.1 * ddaMult);`
  },
  {
    name: 'restartGame reset',
    search: `    function restartGame() {\n      targetLane = 0;`,
    replace: `    function restartGame() {\n      if (window.ArcadeDifficulty) ArcadeDifficulty.reset();\n      targetLane = 0;`
  }
]);

// ==========================================
// 9. NEON STACK 3D
// ==========================================
updateFile(path.join(SCRATCH_DIR, 'neon-stack-3d/index.html'), [
  {
    name: 'PERFECT_TOLERANCE DDA',
    search: `      const PERFECT_TOLERANCE = 0.42;`,
    replace: `      const ddaMult = window.ArcadeDifficulty ? ArcadeDifficulty.getMultiplier(score, 45, 1.8) : 1.0;
      const PERFECT_TOLERANCE = Math.max(0.24, 0.42 - (ddaMult - 1.0) * 0.15);`
  },
  {
    name: 'speed scaling DDA',
    search: `      score++;
      scoreDisplay.textContent = score;

      // Camera elevation target
      targetCamY = 45 + score * BOX_HEIGHT;

      activeLayer = spawnNextLayer();`,
    replace: `      score++;
      scoreDisplay.textContent = score;
      currentSpeed = window.ArcadeDifficulty ? ArcadeDifficulty.scaleSpeed(SPEED, score, 45, 1.8) : SPEED;

      // Camera elevation target
      targetCamY = 45 + score * BOX_HEIGHT;

      activeLayer = spawnNextLayer();`
  },
  {
    name: 'resetGame reset',
    search: `    function resetGame() {\n      score = 0;`,
    replace: `    function resetGame() {\n      if (window.ArcadeDifficulty) ArcadeDifficulty.reset();\n      score = 0;`
  }
]);

// ==========================================
// 10. CYBER PONG 3D
// ==========================================
updateFile(path.join(SCRATCH_DIR, 'cyber-pong-3d/index.html'), [
  {
    name: 'cpuSpeed & hitboxes DDA',
    search: `        // 2. Balanced Kawaii CPU AI
        const cpuSpeed = 0.088; // Tuned for fair rallies and rewarding skill shots`,
    replace: `        // 2. Balanced Kawaii CPU AI
        const matchTotalScore = playerScore * 100 + maxRally * 15;
        const ddaMult = window.ArcadeDifficulty ? ArcadeDifficulty.getMultiplier(matchTotalScore, 700, 1.8) : 1.0;
        const cpuSpeed = Math.min(0.14, 0.088 * (0.9 + 0.1 * ddaMult)); // Tuned with DDA for fair rallies and rewarding skill shots`
  },
  {
    name: 'hitbox sizing DDA',
    search: `        // 4. HUGE FORGIVING HITBOXES FOR PLAYER
        const HIT_WIDTH = 5.8;
        const HIT_HEIGHT = 5.2;`,
    replace: `        // 4. HUGE FORGIVING HITBOXES FOR PLAYER (Dynamic curve: early forgiving, late skill test)
        const HIT_WIDTH = Math.max(4.6, 5.8 - (ddaMult - 1.0) * 0.8);
        const HIT_HEIGHT = Math.max(4.2, 5.2 - (ddaMult - 1.0) * 0.7);`
  },
  {
    name: 'resetMatch reset',
    search: `    function resetMatch() {\n      playerScore = 0;`,
    replace: `    function resetMatch() {\n      if (window.ArcadeDifficulty) ArcadeDifficulty.reset();\n      playerScore = 0;`
  }
]);

// ==========================================
// 11. NEON VIPER
// ==========================================
updateFile(path.join(SCRATCH_DIR, 'neon-viper/index.html'), [
  {
    name: 'bot speed mult DDA',
    search: `        // Speed & Nitro
        const currentSpeed = (this.isBoosting && this.mass > 40) ? this.speed * 1.75 : this.speed;`,
    replace: `        // Speed & Nitro
        const playerMassScore = (player && player.mass) ? Math.round(player.mass) : 40;
        const ddaMult = window.ArcadeDifficulty ? ArcadeDifficulty.getMultiplier(playerMassScore, 1200, 1.8) : 1.0;
        const botSpeedScale = this.isPlayer ? 1.0 : Math.min(1.35, 0.95 + 0.1 * ddaMult);
        const currentSpeed = ((this.isBoosting && this.mass > 40) ? this.speed * 1.75 : this.speed) * botSpeedScale;`
  },
  {
    name: 'restartGame reset',
    search: `    function restartGame() {\n      initArena();`,
    replace: `    function restartGame() {\n      if (window.ArcadeDifficulty) ArcadeDifficulty.reset();\n      initArena();`
  }
]);

// ==========================================
// 12. GEOMETRICSURVIVOR
// ==========================================
updateFile(path.join(SCRATCH_DIR, 'geometricsurvivor/index.html'), [
  {
    name: 'enemy spawning DDA',
    search: `    function handleEnemySpawning(dt) {
        // FAST & INTENSE SWARMS (Option 1 selected):
        // Spawn delay starts at 0.65s and drops down to 0.20s by minute 1
        const spawnDelay = Math.max(0.20, 0.65 - (gameTimer / 60) * 0.45);

        if (spawnTimer >= spawnDelay) {
            spawnTimer = 0;
            const difficulty = 1 + Math.floor(gameTimer / 25);

            // Spawn in surrounding packs (2 to 4 enemies at once)
            const packSize = gameTimer < 20 ? 2 : (gameTimer < 45 ? 3 : 4);`,
    replace: `    function handleEnemySpawning(dt) {
        // FAST & INTENSE SWARMS WITH DDA:
        const currentKills = (player && player.kills) || 0;
        const spawnDelay = window.ArcadeDifficulty ? ArcadeDifficulty.scaleInterval(650, currentKills, 350, 200, 2.0) / 1000 : Math.max(0.20, 0.65 - (gameTimer / 60) * 0.45);

        if (spawnTimer >= spawnDelay) {
            spawnTimer = 0;
            const difficulty = 1 + Math.floor(gameTimer / 25);

            // Spawn in surrounding packs (2 to 4 enemies at once)
            const basePack = gameTimer < 20 ? 2 : (gameTimer < 45 ? 3 : 4);
            const packSize = window.ArcadeDifficulty ? ArcadeDifficulty.scaleCount(basePack, currentKills, 350, 6) : basePack;`
  },
  {
    name: 'resetGame reset',
    search: `    function resetGame() {\n      gameTimer = 0;`,
    replace: `    function resetGame() {\n      if (window.ArcadeDifficulty) ArcadeDifficulty.reset();\n      gameTimer = 0;`
  }
]);

// ==========================================
// 13. STICKMAN FPS ARCADE
// ==========================================
updateFile(path.join(SCRATCH_DIR, 'stickman-fps-arcade/js/game.js'), [
  {
    name: 'startWave enemy count DDA',
    search: `  startWave(waveNum) {
    this.currentWave = waveNum;
    this.enemiesRemainingInWave = 5 + waveNum * 3;`,
    replace: `  startWave(waveNum) {
    this.currentWave = waveNum;
    this.enemiesRemainingInWave = window.ArcadeDifficulty ? ArcadeDifficulty.scaleCount(5 + waveNum * 3, this.score, 3500, 25) : (5 + waveNum * 3);`
  },
  {
    name: 'spawnEnemy diffMultiplier DDA',
    search: `    const diffMultiplier = 1.0 + (this.currentWave - 1) * 0.15;
    this.enemies.push(new Stickman(pt, type, diffMultiplier));`,
    replace: `    const ddaMult = window.ArcadeDifficulty ? ArcadeDifficulty.getMultiplier(this.score, 3500, 2.2) : 1.0;
    const diffMultiplier = Math.max(1.0 + (this.currentWave - 1) * 0.15, ddaMult);
    this.enemies.push(new Stickman(pt, type, diffMultiplier));`
  },
  {
    name: 'resetGame reset',
    search: `  resetGame() {\n    this.score = 0;`,
    replace: `  resetGame() {\n    if (window.ArcadeDifficulty) ArcadeDifficulty.reset();\n    this.score = 0;`
  }
]);

// ==========================================
// 14. CYBER PINBALL FX
// ==========================================
updateFile(path.join(SCRATCH_DIR, 'cyber-pinball-fx/index.html'), [
  {
    name: 'gravity & kick DDA',
    search: `          // Apply Gravity & Velocity
          b.vy += GRAVITY;`,
    replace: `          // Apply Gravity & Velocity
          const ddaMult = window.ArcadeDifficulty ? ArcadeDifficulty.getMultiplier(score, 12000, 1.8) : 1.0;
          b.vy += GRAVITY * Math.min(1.35, 0.95 + 0.1 * ddaMult);`
  },
  {
    name: 'bumper kick impulse DDA',
    search: `              // Bounce with explosive bumper impulse
              const kick = 15;`,
    replace: `              // Bounce with explosive bumper impulse
              const kick = 15 * Math.min(1.25, 0.95 + 0.08 * ddaMult);`
  },
  {
    name: 'startNewGame reset',
    search: `    function startNewGame() {\n      score = 0;`,
    replace: `    function startNewGame() {\n      if (window.ArcadeDifficulty) ArcadeDifficulty.reset();\n      score = 0;`
  }
]);

// ==========================================
// 15. NEON TETRIS 3D
// ==========================================
updateFile(path.join(SCRATCH_DIR, 'neon-tetris-3d/src/board.js'), [
  {
    name: 'getDropInterval DDA',
    search: `  getDropInterval() {
    // Official guideline speed formula
    const speed = Math.pow(0.8 - ((this.level - 1) * 0.007), this.level - 1);
    return Math.max(0.06, speed);
  }`,
    replace: `  getDropInterval() {
    // Official guideline speed formula with DDA
    const baseSpeed = Math.pow(0.8 - ((this.level - 1) * 0.007), this.level - 1);
    if (window.ArcadeDifficulty) {
      return ArcadeDifficulty.scaleInterval(baseSpeed * 1000, this.score, 4500, 75, 2.1) / 1000;
    }
    return Math.max(0.06, baseSpeed);
  }`
  }
]);

updateFile(path.join(SCRATCH_DIR, 'neon-tetris-3d/src/game.js'), [
  {
    name: 'restart reset',
    search: `  restart() {\n    this.board = new Board();`,
    replace: `  restart() {\n    if (window.ArcadeDifficulty) ArcadeDifficulty.reset();\n    this.board = new Board();`
  }
]);

// ==========================================
// 16. NEON DROP 2048
// ==========================================
updateFile(path.join(SCRATCH_DIR, 'neon-drop-2048/index.html'), [
  {
    name: 'triggerDrop cooldown DDA',
    search: `      setTimeout(() => canDrop = true, 450);`,
    replace: `      const dropCooldown = window.ArcadeDifficulty ? ArcadeDifficulty.scaleInterval(450, score, 3200, 250, 2.0) : 450;
      setTimeout(() => canDrop = true, dropCooldown);`
  },
  {
    name: 'restartGame reset',
    search: `    function restartGame() {\n      score = 0;`,
    replace: `    function restartGame() {\n      if (window.ArcadeDifficulty) ArcadeDifficulty.reset();\n      score = 0;`
  }
]);

// ==========================================
// 17. CUTE MINI GOLF
// ==========================================
updateFile(path.join(SCRATCH_DIR, 'cute-mini-golf/src/main.js'), [
  {
    name: 'windmill rotation DDA',
    search: `      wm.bladeAngle += dt * wm.bladeSpeed;`,
    replace: `      const currentScore = (p1.strokes || 0) * 100 + currentHoleNumber * 50;
      const ddaMult = window.ArcadeDifficulty ? ArcadeDifficulty.getMultiplier(currentScore, 1000, 1.8) : 1.0;
      wm.bladeAngle += dt * (wm.bladeSpeed * ddaMult);`
  },
  {
    name: 'hole suction tolerance DDA',
    search: `      if (d1 < HOLE_RADIUS * 1.4 && vd1 < 0.85) {`,
    replace: `      const suctionFactor = Math.max(1.15, 1.4 - (ddaMult - 1.0) * 0.2);
      if (d1 < HOLE_RADIUS * suctionFactor && vd1 < 0.85) {`
  },
  {
    name: 'resetGameState reset',
    search: `function resetGameState(fullReset = false) {\n  if (fullReset) {`,
    replace: `function resetGameState(fullReset = false) {\n  if (fullReset && window.ArcadeDifficulty) ArcadeDifficulty.reset();\n  if (fullReset) {`
  }
]);

// ==========================================
// 18. KAWAII 8-BALL POOL
// ==========================================
updateFile(path.join(SCRATCH_DIR, 'kawaii-8ball-pool/src/main.js'), [
  {
    name: 'pocket suction tolerance DDA',
    search: `    if (dist < POCKET_R + ball.r * 0.75) {`,
    replace: `    const poolScore = (player1Score || 0) * 100 + ballsPocketedThisTurn.length * 50;
    const ddaMult = window.ArcadeDifficulty ? ArcadeDifficulty.getMultiplier(poolScore, 1000, 1.8) : 1.0;
    const pocketFactor = Math.max(0.48, 0.75 - (ddaMult - 1.0) * 0.2);
    if (dist < POCKET_R + ball.r * pocketFactor) {`
  },
  {
    name: 'guideline maxAimDist DDA',
    search: `  let maxAimDist = 550;`,
    replace: `  const poolScore = (player1Score || 0) * 100 + ballsPocketedThisTurn.length * 50;
  const ddaMult = window.ArcadeDifficulty ? ArcadeDifficulty.getMultiplier(poolScore, 1000, 1.8) : 1.0;
  let maxAimDist = Math.max(320, 550 - (ddaMult - 1.0) * 140);`
  },
  {
    name: 'resetGame reset',
    search: `function resetGame() {\n  p1Strokes = 0;`,
    replace: `function resetGame() {\n  if (window.ArcadeDifficulty) ArcadeDifficulty.reset();\n  p1Strokes = 0;`
  }
]);

// ==========================================
// 19. NEON ARCHERY MASTER
// ==========================================
updateFile(path.join(SCRATCH_DIR, 'neon-archery-master/index.html'), [
  {
    name: 'target speed DDA',
    search: `      // Update Moving Target
      for (const t of targets) {
        t.y += t.vy;`,
    replace: `      // Update Moving Target
      const ddaMult = window.ArcadeDifficulty ? ArcadeDifficulty.getMultiplier(score, 1800, 2.1) : 1.0;
      for (const t of targets) {
        t.y += t.vy * ddaMult;`
  },
  {
    name: 'wind turbulence DDA',
    search: `    function setWind() {
      wind = Number(((Math.random() - 0.5) * 3.0).toFixed(1));`,
    replace: `    function setWind() {
      const ddaMult = window.ArcadeDifficulty ? ArcadeDifficulty.getMultiplier(score, 1800, 2.1) : 1.0;
      const maxWind = 3.0 * ddaMult;
      wind = Number(((Math.random() - 0.5) * maxWind).toFixed(1));`
  },
  {
    name: 'restartGame reset',
    search: `    function restartGame() {\n      score = 0;`,
    replace: `    function restartGame() {\n      if (window.ArcadeDifficulty) ArcadeDifficulty.reset();\n      score = 0;`
  }
]);

// ==========================================
// 20. NEON PACHINKO POP
// ==========================================
updateFile(path.join(SCRATCH_DIR, 'neon-pachinko-pop/index.html'), [
  {
    name: 'bucket dynamics DDA',
    search: `      // Update & Draw Bucket
      bucket.x += bucket.vx;`,
    replace: `      // Update & Draw Bucket
      const ddaMult = window.ArcadeDifficulty ? ArcadeDifficulty.getMultiplier(score, 2500, 1.9) : 1.0;
      bucket.w = Math.max(78, 110 - (ddaMult - 1.0) * 20);
      bucket.x += bucket.vx * ddaMult;`
  },
  {
    name: 'restartGame reset',
    search: `    function restartGame() {\n      score = 0;`,
    replace: `    function restartGame() {\n      if (window.ArcadeDifficulty) ArcadeDifficulty.reset();\n      score = 0;`
  }
]);

console.log('--- ALL CALIBRATIONS COMPLETE ---');
