import './style.css';

// Marcus Arcade Interactive Engine
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('game-search');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.game-card');

  let currentCategory = 'all';
  let searchQuery = '';

  function filterGames() {
    cards.forEach(card => {
      const category = card.getAttribute('data-category');
      const searchData = (card.getAttribute('data-title') || '').toLowerCase();
      const textContent = card.innerText.toLowerCase();

      const matchesCat = (currentCategory === 'all' || category === currentCategory);
      const matchesSearch = (!searchQuery || searchData.includes(searchQuery) || textContent.includes(searchQuery));

      if (matchesCat && matchesSearch) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
  }

  // Search input handler
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim().toLowerCase();
      filterGames();
    });
  }

  // Category filter tabs handler
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.getAttribute('data-filter');
      filterGames();
    });
  });

  // Sound effect on button hover
  let audioCtx = null;
  function playClick() {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.frequency.value = 600;
      g.gain.setValueAtTime(0.04, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);
      osc.connect(g); g.connect(audioCtx.destination);
      osc.start(); osc.stop(audioCtx.currentTime + 0.04);
    } catch(e){}
  }

  // Real Live World Records Hub Engine
  const GIST_RAW_URL = 'https://gist.githubusercontent.com/marcuscaiado/a238a8db5b064579413c7a54aba6c840/raw/marcus-arcade-leaderboard.json';
  const ARCADE_GAMES = [
    { id: 'neon-stack-3d', name: 'Neon Stack Harmony 3D', icon: '🌌', unit: 'SLABS', url: 'https://marcuscaiado.github.io/neon-stack-3d/' },
    { id: 'neon-pachinko-pop', name: 'Neon Pachinko Pop', icon: '🔮', unit: 'PTS', url: 'https://marcuscaiado.github.io/neon-pachinko-pop/' },
    { id: 'cyber-shuriken', name: 'Cyber Shuriken Neo', icon: '🎯', unit: 'PTS', url: 'https://marcuscaiado.github.io/cyber-shuriken/' },
    { id: 'stickman-fps-arcade', name: 'Stickman FPS Arcade', icon: '🔫', unit: 'PTS', url: 'https://marcuscaiado.github.io/stickman-fps-arcade/' },
    { id: 'flappy-cyber-droid', name: 'Flappy Cyber Droid', icon: '🐦', unit: 'GATES', url: 'https://marcuscaiado.github.io/flappy-cyber-droid/' },
    { id: 'brick-breaker-fx', name: 'Brick Breaker FX', icon: '🧱', unit: 'PTS', url: 'https://marcuscaiado.github.io/brick-breaker-fx/' },
    { id: 'sky-ace-1944', name: 'Sky Ace 1944', icon: '🛩️', unit: 'PTS', url: 'https://marcuscaiado.github.io/sky-ace-1944/' },
    { id: 'cute-mini-golf', name: 'Cute Mini Golf 3D', icon: '⛳', unit: 'PTS', url: 'https://marcuscaiado.github.io/cute-mini-golf/' },
    { id: 'kawaii-8ball-pool', name: 'Kawaii 8-Ball Pool', icon: '🎱', unit: 'PTS', url: 'https://marcuscaiado.github.io/kawaii-8ball-pool/' },
    { id: 'geometricsurvivor', name: 'Geometric Survivor 3D', icon: '🌌', unit: 'KILLS', url: 'https://marcuscaiado.github.io/geometricsurvivor/' },
    { id: 'neon-drift-racer', name: 'Neon Drift Racer', icon: '🏎️', unit: 'PTS', url: 'https://marcuscaiado.github.io/neon-drift-racer/' },
    { id: 'neon-viper', name: 'Neon Viper', icon: '🐍', unit: 'PTS', url: 'https://marcuscaiado.github.io/neon-viper/' },
    { id: 'cyber-runner-3d', name: 'Cyber Runner 3D', icon: '🏃', unit: 'PTS', url: 'https://marcuscaiado.github.io/cyber-runner-3d/' },
    { id: 'cyber-pong-3d', name: 'Cyber Pong 3D', icon: '🏓', unit: 'PTS', url: 'https://marcuscaiado.github.io/cyber-pong-3d/' },
    { id: 'neon-drop-2048', name: 'Neon Drop 2048', icon: '🧩', unit: 'PTS', url: 'https://marcuscaiado.github.io/neon-drop-2048/' },
    { id: 'asteroid-blitz', name: 'Asteroid Blitz', icon: '🛸', unit: 'PTS', url: 'https://marcuscaiado.github.io/asteroid-blitz/' },
    { id: 'neon-archery-master', name: 'Neon Archery Master', icon: '🎯', unit: 'PTS', url: 'https://marcuscaiado.github.io/neon-archery-master/' }
  ];

  const hubLbModal = document.getElementById('hub-lb-modal');
  const hubLbGrid = document.getElementById('hub-lb-grid');
  const openHubLbBtn = document.getElementById('open-hub-lb');
  const closeHubLbBtn = document.getElementById('close-hub-lb');
  const hubLbOkBtn = document.getElementById('hub-lb-ok-btn');

  async function renderWorldRecords() {
    if (!hubLbGrid) return;
    hubLbGrid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:20px; color:#00f5ff;">⚡ Syncing live cloud records...</div>`;

    let cloudData = {};
    try {
      const res = await fetch(`${GIST_RAW_URL}?_t=${Date.now()}`);
      if (res.ok) cloudData = await res.json();
    } catch(e) {}

    let html = '';
    ARCADE_GAMES.forEach(game => {
      let localScores = [];
      try {
        localScores = JSON.parse(localStorage.getItem(`arcade_lb_${game.id}`) || '[]');
      } catch(e) {}

      let cloudScores = cloudData[game.id] || [];
      let allScores = [...cloudScores, ...localScores].filter(s => s && s.name && s.score);
      allScores.sort((a, b) => b.score - a.score);

      const champ = allScores[0];
      const champHtml = champ 
        ? `<div class="hub-lb-champ">🥇 ${champ.name} • <b>${champ.score.toLocaleString()} ${game.unit}</b></div>`
        : `<div class="hub-lb-champ" style="color:#ff007f; font-size:11px;">👑 UNCLAIMED • <a href="${game.url}" target="_blank" style="color:#00f5ff; text-decoration:underline;">PLAY TO BE #1!</a></div>`;

      html += `
        <div class="hub-lb-item">
          <div class="hub-lb-game">${game.icon} ${game.name}</div>
          ${champHtml}
        </div>
      `;
    });

    hubLbGrid.innerHTML = html;
  }

  if (openHubLbBtn && hubLbModal) {
    openHubLbBtn.addEventListener('click', () => {
      hubLbModal.style.display = 'flex';
      renderWorldRecords();
    });
  }

  const closeHubLb = () => {
    if (hubLbModal) hubLbModal.style.display = 'none';
  };

  if (closeHubLbBtn) closeHubLbBtn.addEventListener('click', closeHubLb);
  if (hubLbOkBtn) hubLbOkBtn.addEventListener('click', closeHubLb);
  if (hubLbModal) {
    hubLbModal.addEventListener('click', (e) => {
      if (e.target === hubLbModal) closeHubLb();
    });
  }

  document.querySelectorAll('.play-btn, .filter-btn').forEach(el => {
    el.addEventListener('mouseenter', playClick);
  });
});
