/**
 * Daily Spotlight & Feature Synchronizer for Marcus Arcade
 * Runs every day at 6:00 AM BRT (09:00 UTC)
 * 1. Highlights top 3 featured/tested games in "Jogos em Destaque"
 * 2. Syncs updated features & tested game metadata into index.html
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
  const now = new Date();
  const brtString = now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' });
  const brtDate = new Date(brtString);
  const yyyy = brtDate.getFullYear();
  const mm = String(brtDate.getMonth() + 1).padStart(2, '0');
  const dd = String(brtDate.getDate()).padStart(2, '0');
  return { dateStr: `${yyyy}-${mm}-${dd}`, brtDate, yyyy, mm, dd };
}

function getDailyFeaturedGames(manifest, dateInfo) {
  const PINNED_FEATURED_IDS = ['geometricsurvivor', 'neon-viper', 'cute-mini-golf', 'cyber-pong-3d'];
  const games = PINNED_FEATURED_IDS
    .map(id => manifest.find(g => g.id === id))
    .filter(Boolean);

  return { dayIndex: 0, games };
}

function generateDailyDeckHtml(games, dateStr) {
  const cardsHtml = games.map((game, i) => `
          <!-- Featured ${i + 1}: ${game.name} -->
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

  return `<!-- 🌟 JOGOS EM DESTAQUE (Top Featured Games & Daily 6AM Tested Polish Updates) -->
      <section class="daily-releases-deck">
        <div class="daily-badge">🌟 JOGOS EM DESTAQUE • DAILY FEATURE UPDATES • 6:00 AM SYNC</div>
        <div class="daily-cards-row">
${cardsHtml}
        </div>
      </section>`;
}

function runDailySync() {
  console.log('================================================================');
  console.log('🌟 MARCUS ARCADE: JOGOS EM DESTAQUE & FEATURE SYNC (6:00 AM BRT)');
  console.log('================================================================\n');

  const dateInfo = getBrtDate();
  console.log(`📅 Current Local Date (BRT / UTC-3): ${dateInfo.dateStr}`);

  if (!fs.existsSync(manifestPath)) {
    console.error(`❌ Manifest not found at ${manifestPath}`);
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const { dayIndex, games } = getDailyFeaturedGames(manifest, dateInfo);

  console.log(`🎯 Day Index: #${dayIndex}`);
  console.log(`🎮 Jogos em Destaque for ${dateInfo.dateStr}:`);
  games.forEach((g, idx) => {
    console.log(`   ${idx + 1}. ${g.icon} ${g.name} (${g.url})`);
  });

  const newDeckHtml = generateDailyDeckHtml(games, dateInfo.dateStr);

  if (!fs.existsSync(indexHtmlPath)) {
    console.error(`❌ index.html not found at ${indexHtmlPath}`);
    process.exit(1);
  }

  const currentHtml = fs.readFileSync(indexHtmlPath, 'utf8');
  const deckRegex = /<!-- 🌟 JOGOS EM DESTAQUE[\s\S]*?<\/section>/i;
  
  let updatedHtml = currentHtml;
  if (deckRegex.test(currentHtml)) {
    updatedHtml = currentHtml.replace(deckRegex, newDeckHtml);
  } else {
    // Fallback if older comments were present
    const oldRegex = /<!-- 🔥 NEW RELEASES TODAY[\s\S]*?<\/section>/i;
    if (oldRegex.test(currentHtml)) {
      updatedHtml = currentHtml.replace(oldRegex, newDeckHtml);
    }
  }

  fs.writeFileSync(indexHtmlPath, updatedHtml, 'utf8');
  console.log(`\n✅ Successfully synced "Jogos em Destaque" top banner for ${dateInfo.dateStr}!`);
}

runDailySync();
