import './style.css';
import ARCADE_GAMES from './games-manifest.json';

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

  // Category filter tabs handler (excluding world records button)
  filterBtns.forEach(btn => {
    if (btn.id === 'open-hub-lb') return;
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => {
        if (b.id !== 'open-hub-lb') b.classList.remove('active');
      });
      btn.classList.add('active');
      currentCategory = btn.getAttribute('data-filter');
      filterGames();
    });
  });

  // ==========================================
  // DOPAMINE & SEROTONIN AUDIO & VISUAL ENGINE
  // ==========================================
  let audioCtx = null;
  const QUAD_COLORS = ['#00f5ff', '#ff007f', '#ffe600', '#00ff66', '#8ab4f8', '#f28b82', '#fdd663', '#81c995'];

  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }

  // Pure celestial comforting dopamine chime (inspired by spectrum-dopamine-store)
  function playDopamineChime() {
    try {
      initAudio();
      if (!audioCtx) return;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;

        const startTime = audioCtx.currentTime + idx * 0.055;
        g.gain.setValueAtTime(0, startTime);
        g.gain.linearRampToValueAtTime(0.18, startTime + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.45);

        osc.connect(g);
        g.connect(audioCtx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.5);
      });
    } catch(e) {}
  }

  // Tactile water drop bubble pop (satisfying, bubbly, zero harshness)
  function playBubblePop() {
    try {
      initAudio();
      if (!audioCtx) return;
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(280, now + 0.05);

      g.gain.setValueAtTime(0.08, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

      osc.connect(g);
      g.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.055);
    } catch(e) {}
  }

  // Quad-Color Canvas Confetti Cannon
  const confettiCanvas = document.getElementById('confetti-canvas');
  let confettiCtx = confettiCanvas ? confettiCanvas.getContext('2d') : null;
  let particles = [];

  function resizeConfetti() {
    if (confettiCanvas) {
      confettiCanvas.width = window.innerWidth;
      confettiCanvas.height = window.innerHeight;
    }
  }
  window.addEventListener('resize', resizeConfetti);
  resizeConfetti();

  class Confetti {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.color = QUAD_COLORS[Math.floor(Math.random() * QUAD_COLORS.length)];
      this.size = Math.random() * 8 + 5;
      this.speedX = (Math.random() - 0.5) * 16;
      this.speedY = (Math.random() - 0.8) * 18;
      this.gravity = 0.45;
      this.opacity = 1;
      this.decay = Math.random() * 0.02 + 0.015;
      this.rotation = Math.random() * 360;
      this.rotSpeed = (Math.random() - 0.5) * 10;
    }
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      this.speedY += this.gravity;
      this.opacity -= this.decay;
      this.rotation += this.rotSpeed;
    }
    draw(ctx) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.opacity);
      ctx.translate(this.x, this.y);
      ctx.rotate((this.rotation * Math.PI) / 180);
      ctx.fillStyle = this.color;
      ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
      ctx.restore();
    }
  }

  function explodeConfetti(x = window.innerWidth / 2, y = window.innerHeight * 0.4, count = 50) {
    for (let i = 0; i < count; i++) {
      particles.push(new Confetti(x, y));
    }
  }

  function loopConfetti() {
    if (confettiCtx && confettiCanvas) {
      confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw(confettiCtx);
        if (p.opacity <= 0) particles.splice(i, 1);
      }
    }
    requestAnimationFrame(loopConfetti);
  }
  loopConfetti();

  // Real Live World Records Hub Engine
  const GIST_RAW_URL = 'https://gist.githubusercontent.com/marcuscaiado/a238a8db5b064579413c7a54aba6c840/raw/marcus-arcade-leaderboard.json';

  // DOM Elements
  const hubLbModal = document.getElementById('hub-lb-modal');
  const hubLbGrid = document.getElementById('hub-lb-grid');
  const openHubLbBtn = document.getElementById('open-hub-lb');
  const closeHubLbBtn = document.getElementById('close-hub-lb');
  const hubLbOkBtn = document.getElementById('hub-lb-ok-btn');
  const hubPilotBtn = document.getElementById('hub-pilot-btn');
  const hubTagEl = document.getElementById('hub-pilot-tag');
  const modalPilotInput = document.getElementById('modal-pilot-input');
  const modalPilotSaveBtn = document.getElementById('modal-pilot-save-btn');

  // 3-Letter Arcade Pilot Nickname Management
  function getPilotTag() {
    let tag = localStorage.getItem('arcade_player_tag') || 'MRC';
    return tag.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 3) || 'MRC';
  }

  function setPilotTag(newTag) {
    let clean = (newTag || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 3);
    if (!clean) clean = 'MRC';
    while (clean.length < 3) clean += 'X';
    localStorage.setItem('arcade_player_tag', clean);
    updatePilotDisplays();
    renderWorldRecords();
    return clean;
  }

  function updatePilotDisplays() {
    const tag = getPilotTag();
    if (hubTagEl) hubTagEl.textContent = tag;
    if (modalPilotInput) modalPilotInput.value = tag;
  }

  updatePilotDisplays();

  if (hubPilotBtn) {
    hubPilotBtn.addEventListener('click', () => {
      const current = getPilotTag();
      const entered = prompt('Enter your 3-Letter Arcade Initials (e.g. MRC, ACE, NEO, VIP):', current);
      if (entered) setPilotTag(entered);
    });
  }

  if (modalPilotSaveBtn && modalPilotInput) {
    modalPilotSaveBtn.addEventListener('click', () => {
      setPilotTag(modalPilotInput.value);
    });
    modalPilotInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') setPilotTag(modalPilotInput.value);
    });
  }

  async function renderWorldRecords() {
    if (!hubLbGrid) return;
    updatePilotDisplays();

    // 1. Instant Render from LocalStorage first (Zero lag)
    renderGridHTML({});

    // 2. Fetch live cloud data and refresh
    try {
      const res = await fetch(`${GIST_RAW_URL}?_t=${Date.now()}`);
      if (res.ok) {
        const cloudData = await res.json();
        renderGridHTML(cloudData);
      }
    } catch(e) {
      console.warn('Could not sync cloud records, displaying local:', e);
    }
  }

  function renderGridHTML(cloudData = {}) {
    if (!hubLbGrid) return;
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
      let champTag = champ ? (String(champ.name).replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 3) || 'PIL') : '';
      const champHtml = champ 
        ? `<div class="hub-lb-champ">🥇 <span style="background:rgba(0,245,255,0.15); border:1px solid #00f5ff; padding:2px 6px; border-radius:4px; font-weight:900; letter-spacing:1px;">${champTag}</span> • <b>${champ.score.toLocaleString()} ${game.unit}</b></div>`
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

  // Open Modal Handler with Dopamine Chime & Confetti
  if (openHubLbBtn && hubLbModal) {
    openHubLbBtn.addEventListener('click', (e) => {
      e.preventDefault();
      playDopamineChime();
      explodeConfetti(window.innerWidth / 2, window.innerHeight * 0.35, 60);
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

  // Hover & Click Audio Dopamine
  document.querySelectorAll('.play-btn').forEach(el => {
    el.addEventListener('mouseenter', playBubblePop);
    el.addEventListener('click', (e) => {
      playDopamineChime();
      explodeConfetti(e.clientX || window.innerWidth / 2, e.clientY || window.innerHeight / 2, 50);
    });
  });

  document.querySelectorAll('.filter-btn').forEach(el => {
    el.addEventListener('click', () => {
      playBubblePop();
    });
  });
});
