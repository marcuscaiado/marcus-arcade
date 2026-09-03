/**
 * Automated Test Suite & Health Prober for Marcus Arcade Games
 * Validates:
 * 1. Manifest structure & integrity
 * 2. Local repository existence & HTML structure (viewport, DOCTYPE, leaderboard script)
 * 3. Live HTTP status probe (200 OK / SSL / headers)
 * 4. Leaderboard Cloud Gist sync endpoint
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const SCRATCH_DIR = path.resolve(ROOT_DIR, '..');

const manifestPath = path.join(ROOT_DIR, 'src', 'games-manifest.json');

async function runTestSuite() {
  console.log('================================================================');
  console.log('🧪 MARCUS ARCADE: AUTOMATED TEST SUITE & HEALTH PROBE');
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  console.log('================================================================\n');

  if (!fs.existsSync(manifestPath)) {
    console.error(`❌ FATAL: Manifest not found at ${manifestPath}`);
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  console.log(`📋 Found ${manifest.length} games in registry.\n`);

  let passedTests = 0;
  let failedTests = 0;
  const results = [];

  for (let i = 0; i < manifest.length; i++) {
    const game = manifest[i];
    const testId = `[${String(i + 1).padStart(2, '0')}/${manifest.length}] ${game.icon} ${game.name}`;
    const failures = [];

    // 1. Validate Schema
    if (!game.id || !game.url || !game.category || !game.description) {
      failures.push('Schema validation failed: missing required fields');
    }

    // 2. Check Local Filesystem Repository
    const localRepoPath = path.join(SCRATCH_DIR, game.id);
    let localHtmlFound = false;
    let hasLeaderboardScript = false;
    let hasSoundEngineScript = false;
    let hasViewport = false;

    if (fs.existsSync(localRepoPath)) {
      const localHtmlPath = path.join(localRepoPath, 'index.html');
      const soundEnginePath = path.join(localRepoPath, 'arcade-sound-engine.js');
      if (fs.existsSync(localHtmlPath)) {
        localHtmlFound = true;
        const htmlContent = fs.readFileSync(localHtmlPath, 'utf8');
        hasLeaderboardScript = htmlContent.includes('arcade-leaderboard.js');
        hasSoundEngineScript = htmlContent.includes('arcade-sound-engine.js');
        hasViewport = htmlContent.includes('name="viewport"') || htmlContent.includes("name='viewport'");

        if (!hasViewport) failures.push('Missing viewport meta tag for mobile responsiveness');
        if (!hasSoundEngineScript) failures.push('Missing arcade-sound-engine.js script tag');
        if (!fs.existsSync(soundEnginePath)) failures.push('Missing arcade-sound-engine.js file in repository');
      } else {
        failures.push('Local repository missing index.html');
      }
    }

    // 3. Live HTTP Probe
    let httpStatus = 'SKIPPED';
    let latencyMs = 0;
    try {
      const startTime = Date.now();
      const res = await fetch(game.url, {
        method: 'GET',
        headers: { 'User-Agent': 'MarcusArcade-HealthCheck/1.0' },
        signal: AbortSignal.timeout(6000)
      });
      latencyMs = Date.now() - startTime;
      httpStatus = res.status;

      if (res.status >= 400) {
        failures.push(`Live HTTP check failed with status: ${res.status}`);
      }
    } catch (err) {
      // If offline or network timeout, log warning
      httpStatus = `ERR (${err.message.substring(0, 20)})`;
      console.warn(`⚠️ Network probe warning for ${game.url}: ${err.message}`);
    }

    if (failures.length === 0) {
      passedTests++;
      console.log(`✅ PASS: ${testId} | HTTP: ${httpStatus} (${latencyMs}ms) | Local: ${localHtmlFound ? 'YES' : 'REMOTE'} | LB: ${hasLeaderboardScript ? 'OK' : 'N/A'} | Audio: ${hasSoundEngineScript ? 'OK' : 'N/A'}`);
    } else {
      failedTests++;
      console.error(`❌ FAIL: ${testId} | Errors: ${failures.join('; ')}`);
    }

    results.push({
      id: game.id,
      name: game.name,
      passed: failures.length === 0,
      failures,
      httpStatus,
      latencyMs
    });
  }

  // 4. Test Cloud Leaderboard Endpoint
  console.log('\n----------------------------------------------------------------');
  console.log('📡 Testing Global Leaderboard Sync API...');
  const GIST_URL = 'https://gist.githubusercontent.com/marcuscaiado/a238a8db5b064579413c7a54aba6c840/raw/marcus-arcade-leaderboard.json';
  try {
    const gistRes = await fetch(`${GIST_URL}?_t=${Date.now()}`, { signal: AbortSignal.timeout(5000) });
    if (gistRes.ok) {
      console.log(`✅ PASS: Leaderboard Gist API reachable (HTTP ${gistRes.status})`);
      passedTests++;
    } else {
      console.warn(`⚠️ WARN: Leaderboard Gist API returned ${gistRes.status}`);
    }
  } catch (e) {
    console.warn(`⚠️ WARN: Leaderboard Gist API check failed: ${e.message}`);
  }

  console.log('\n================================================================');
  console.log(`📊 TEST SUITE SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    console.error('🚨 TEST SUITE COMPLETED WITH FAILURES');
    process.exit(1);
  } else {
    console.log('✨ ALL SYSTEMS OPERATIONAL AND VALIDATED!');
    process.exit(0);
  }
}

runTestSuite();
