/**
 * Daily 3-Game Synchronizer & Release Engine for Marcus Arcade
 * Runs every day at 6:00 AM BRT (09:00 UTC)
 * 1. Determines the 3 featured games for the current day
 * 2. Updates index.html Daily Releases Deck with live cards and date stamp
 * 3. Prepares synced metadata for automated deployment
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const manifestPath = path.join(ROOT_DIR, 'src', 'games-manifest.json');
const indexHtmlPath = path.join(ROOT_DIR, 'index.html');

function getBrtDate() {
  // Compute date in America/Sao_Paulo (UTC-3)
  const now = new Date();
  const brtString = now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' });
  const brtDate = new Date(brtString);
  const yyyy = brtDate.getFullYear();
  const mm = String(brtDate.getMonth() + 1).padStart(2, '0');
  const dd = String(brtDate.getDate()).padStart(2, '0');
  return { dateStr: `${yyyy}-${mm}-${dd}`, brtDate, yyyy, mm, dd };
}

function getDailyThreeGames(manifest, dateInfo) {
  // Epoch day calculation to deterministically rotate 3 games per day
  const epoch = new Date('2026-09-01T00:00:00-03:00').getTime();
  const current = dateInfo.brtDate.getTime();
  const dayIndex = Math.max(0, Math.floor((current - epoch) / (1000 * 60 * 60 * 24)));

  const total = manifest.length;
  const startIdx = (dayIndex * 3) % total;

  const g1 = manifest[startIdx];
  const g2 = manifest[(startIdx + 1) % total];
  const g3 = manifest[(startIdx + 2) % total];

  return { dayIndex, games: [g1, g2, g3] };
}

function generateDailyDeckHtml(games, dateStr) {
  const cardsHtml = games.map((game, i) => `
          <!-- New Release ${i + 1} -->
          <div class="daily-mini-card">
            <div>
              <div class="daily-card-header">
                <span class="daily-mini-icon">${game.icon}</span>
                <div>
                  <div class="daily-mini-title">${game.name}</div>
                  <div class="daily-url">/${game.id}/</div>
                </div>
              </div>
              <p class="daily-mini-desc">${game.description}</p>
            </div>
            <a href="${game.url}" target="_blank" rel="noopener noreferrer" class="play-btn ${game.badgeClass || 'btn-orbit'}">
              <span>PLAY NOW</span> ➔
            </a>
          </div>`).join('\n');

  return `<!-- 🔥 NEW RELEASES TODAY (Daily 6AM Batch: ${dateStr}) -->
      <section class="daily-releases-deck">
        <div class="daily-badge">🔥 DAILY RELEASES • 3 FEATURED GAMES • 6:00 AM SYNC (${dateStr})</div>
        <div class="daily-cards-row">
${cardsHtml}
        </div>
      </section>`;
}

function runDailySync() {
  const isDryRun = process.argv.includes('--dry-run');

  console.log('================================================================');
  console.log('🚀 MARCUS ARCADE: DAILY 3-GAMES RELEASE SYNCHRONIZER (6:00 AM BRT)');
  console.log('================================================================\n');

  const dateInfo = getBrtDate();
  console.log(`📅 Current Local Date (BRT / UTC-3): ${dateInfo.dateStr}`);

  if (!fs.existsSync(manifestPath)) {
    console.error(`❌ Manifest not found at ${manifestPath}`);
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const { dayIndex, games } = getDailyThreeGames(manifest, dateInfo);

  console.log(`🎯 Day Index: #${dayIndex}`);
  console.log(`🎮 Selected 3 Daily Games for ${dateInfo.dateStr}:`);
  games.forEach((g, idx) => {
    console.log(`   ${idx + 1}. ${g.icon} ${g.name} (${g.url})`);
  });

  const newDeckHtml = generateDailyDeckHtml(games, dateInfo.dateStr);

  if (!fs.existsSync(indexHtmlPath)) {
    console.error(`❌ index.html not found at ${indexHtmlPath}`);
    process.exit(1);
  }

  const currentHtml = fs.readFileSync(indexHtmlPath, 'utf8');

  // Match the daily-releases-deck section
  const deckRegex = /<!-- 🔥 NEW RELEASES TODAY[\s\S]*?<\/section>/i;
  if (!deckRegex.test(currentHtml)) {
    console.error('❌ Could not locate daily-releases-deck in index.html');
    process.exit(1);
  }

  const updatedHtml = currentHtml.replace(deckRegex, newDeckHtml);

  if (isDryRun) {
    console.log('\n🔍 DRY RUN: Replacement preview successfully validated without writing.');
  } else {
    fs.writeFileSync(indexHtmlPath, updatedHtml, 'utf8');
    console.log(`\n✅ Successfully synchronized index.html with 3 daily games for ${dateInfo.dateStr}!`);
  }

  console.log('\n================================================================');
  console.log('✨ DAILY SYNC COMPLETE');
  console.log('================================================================\n');
}

runDailySync();
