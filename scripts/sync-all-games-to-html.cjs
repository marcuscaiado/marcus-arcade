const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, '../src/games-manifest.json');
const htmlPath = path.join(__dirname, '../index.html');

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
let html = fs.readFileSync(htmlPath, 'utf8');

console.log(`Loaded ${manifest.length} games from manifest.`);

// Update title, meta, badges to 38 games
html = html.replace(/<title>.*?<\/title>/, `<title>Marcus Arcade — ${manifest.length} Jogos Jogáveis • Originais & Clássicos</title>`);
html = html.replace(/content="Marcus Arcade — \d+ Jogos Jogáveis/, `content="Marcus Arcade — ${manifest.length} Jogos Jogáveis`);
html = html.replace(/content="Jogue \d+ jogos 3D e 2D/, `content="Jogue ${manifest.length} jogos 3D e 2D`);
html = html.replace(/<div class="header-badge">✨ \d+ JOGOS JOGÁVEIS/, `<div class="header-badge">✨ ${manifest.length} JOGOS JOGÁVEIS`);
html = html.replace(/<button class="filter-btn active" data-filter="all">All \(\d+\)<\/button>/, `<button class="filter-btn active" data-filter="all">All (${manifest.length})</button>`);

// Now find which games are in HTML
const newCards = [];

manifest.forEach((game, index) => {
  // Check if game is in HTML
  if (html.includes(`data-title="`) && (html.includes(game.name) || html.includes(`href="${game.url}"`))) {
    return; // Already present
  }

  const techBadges = (game.tech || ['Arcade', '60 FPS']).map(t => `<span class="badge">${t}</span>`).join('\n              ');
  const catTag = (game.tech && game.tech[0]) ? `${game.tech[0]} • ${game.unit || '60 FPS'}` : `${game.category.toUpperCase()} • 60 FPS`;
  const searchTags = `${game.name} ${game.id} ${game.category} ${(game.tech || []).join(' ')} ${game.description}`.toLowerCase();
  const btnClass = game.badgeClass || 'btn-retro';

  const cardHtml = `
          <!-- ${index + 1}. ${game.name} -->
          <div class="game-card" data-category="${game.category}" data-title="${searchTags}">
            <div class="card-tag">${catTag}</div>
            <div class="card-icon">${game.icon || '🕹️'}</div>
            <h3 class="card-title">${game.name}</h3>
            <p class="card-desc">${game.description}</p>
            <div class="card-badges">
              ${techBadges}
            </div>
            <div class="card-actions-row">
              <a href="${game.url}" target="_blank" rel="noopener noreferrer" class="play-btn ${btnClass}">
                <span>PLAY NOW</span> ➔
              </a>
              <a href="https://marcuscaiado.github.io/nopex-arcade-multiplayer/?game=${game.id}" target="_blank" rel="noopener noreferrer" class="play-btn btn-3d-jump" title="Jogar direto na máquina deste jogo no Salão 3D Multiplayer!">
                <span>🕹️ 3D</span>
              </a>
            </div>
          </div>`;

  newCards.push(cardHtml);
});

console.log(`Generated ${newCards.length} new game cards.`);

if (newCards.length > 0) {
  // Insert before </section> of games-grid
  // Notice in index.html: `<div class="games-grid" id="games-container"> ... </div>\n      </section>`
  const endSectionIndex = html.indexOf('</div>\n      </section>');
  if (endSectionIndex !== -1) {
    html = html.slice(0, endSectionIndex) + newCards.join('\n') + '\n        ' + html.slice(endSectionIndex);
    fs.writeFileSync(htmlPath, html, 'utf8');
    console.log(`Successfully appended ${newCards.length} cards to index.html!`);
  } else {
    // try fallback pattern
    const altIndex = html.indexOf('</div>\r\n      </section>');
    if (altIndex !== -1) {
      html = html.slice(0, altIndex) + newCards.join('\r\n') + '\r\n        ' + html.slice(altIndex);
      fs.writeFileSync(htmlPath, html, 'utf8');
      console.log(`Successfully appended ${newCards.length} cards to index.html (CRLF)!`);
    } else {
      console.error('Could not find games-container end tag!');
    }
  }
} else {
  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log('No new cards needed, updated header & titles.');
}
