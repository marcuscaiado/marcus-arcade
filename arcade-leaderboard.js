/**
 * Marcus Web Arcade — Universal Real Live Global Leaderboard Engine
 * Classic 3-Letter Arcade Initials (e.g. MRC, ACE, NEO, VIP)
 * 100% Free • Real Cloud Synchronization • Anti-Cheat
 */
(function(window) {
  'use strict';

  const GIST_RAW_URL = 'https://gist.githubusercontent.com/marcuscaiado/a238a8db5b064579413c7a54aba6c840/raw/marcus-arcade-leaderboard.json';
  const DEFAULT_TAGS = ['MRC', 'ACE', 'NEO', 'VIP', 'FOX', 'SKY', 'MAX', 'CYB', 'TOP', 'PRO', 'FLY', 'BOT'];

  let cloudCache = null;

  async function fetchCloudScores() {
    try {
      const res = await fetch(`${GIST_RAW_URL}?_t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        cloudCache = await res.json();
      }
    } catch(e) {}
  }
  fetchCloudScores();

  const ArcadeLeaderboard = {
    // 1. Get 3-Letter Initials
    getPlayerTag: function() {
      let tag = localStorage.getItem('arcade_player_tag');
      if (!tag || typeof tag !== 'string' || tag.trim().length === 0) {
        tag = 'MRC'; // Default for Marcus
        localStorage.setItem('arcade_player_tag', tag);
      }
      return tag.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 3) || 'MRC';
    },

    // 2. Set 3-Letter Initials
    setPlayerTag: function(newTag) {
      if (newTag) {
        let clean = newTag.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 3);
        if (clean.length === 0) clean = 'MRC';
        while (clean.length < 3) clean += 'X';
        localStorage.setItem('arcade_player_tag', clean);
        return clean;
      }
      return this.getPlayerTag();
    },

    // 3. Get Scores
    getScores: function(gameId) {
      const storageKey = `arcade_lb_${gameId}`;
      let localScores = [];
      try {
        localScores = JSON.parse(localStorage.getItem(storageKey) || '[]');
      } catch(e) { localScores = []; }

      let cloudGameScores = (cloudCache && cloudCache[gameId]) ? cloudCache[gameId] : [];

      let mergedMap = new Map();

      cloudGameScores.forEach(s => {
        if (s && s.name && s.score) {
          const cleanName = String(s.name).replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 3) || 'PIL';
          mergedMap.set(cleanName, { ...s, name: cleanName, isYou: false });
        }
      });

      localScores.forEach(s => {
        if (s && s.name && s.score) {
          const cleanName = String(s.name).replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 3) || 'PIL';
          const existing = mergedMap.get(cleanName);
          if (!existing || s.score > existing.score) {
            mergedMap.set(cleanName, { ...s, name: cleanName });
          }
        }
      });

      let scores = Array.from(mergedMap.values());
      scores.sort((a, b) => b.score - a.score);
      return scores.slice(0, 10);
    },

    // 4. Submit Score
    submitScore: function(gameId, score) {
      if (typeof score !== 'number' || isNaN(score) || score <= 0) return this.getScores(gameId);
      
      const tag = this.getPlayerTag();
      const storageKey = `arcade_lb_${gameId}`;
      let scores = this.getScores(gameId);

      const existingIdx = scores.findIndex(s => s.name === tag);
      if (existingIdx !== -1) {
        if (score > scores[existingIdx].score) {
          scores[existingIdx].score = score;
          scores[existingIdx].date = 'Today';
        }
      } else {
        scores.push({
          name: tag,
          score: score,
          date: 'Today',
          isYou: true
        });
      }

      scores.sort((a, b) => b.score - a.score);
      scores = scores.slice(0, 10);

      scores.forEach(s => {
        s.isYou = (s.name === tag);
      });

      localStorage.setItem(storageKey, JSON.stringify(scores));
      return scores;
    }
  };

  window.ArcadeLeaderboard = ArcadeLeaderboard;

  // ==========================================================================
  //  UNIVERSAL PROCEDURAL AUDIO MODULE (DopamineSynth)
  //  Web Audio API procedural sound engine with warm euphoric harmonics
  // ==========================================================================
  let audioCtx = null;

  function getAudioCtx() {
    if (!audioCtx) {
      const AudioClass = window.AudioContext || window.webkitAudioContext;
      if (AudioClass) audioCtx = new AudioClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  // Automatic, clean unlock on first user interaction
  const unlockEvents = ['pointerdown', 'keydown', 'touchstart', 'click'];
  const unlockHandler = () => {
    try { getAudioCtx(); } catch(e) {}
    unlockEvents.forEach(evt => window.removeEventListener(evt, unlockHandler));
  };
  unlockEvents.forEach(evt => window.addEventListener(evt, unlockHandler, { passive: true }));

  const PENTATONIC_SCALE = [
    523.25, // C5
    587.33, // D5
    659.25, // E5
    783.99, // G5
    880.00, // A5
    1046.50, // C6
    1174.66, // D6
    1318.51, // E6
    1567.98  // G6
  ];

  const DopamineSynth = {
    getContext: getAudioCtx,

    // Hit / Collect / Tap: marimba/kalimba bubble pop with instant attack and smooth decay
    playTap: function(vol = 0.16, pitchRatio = 1.0) {
      try {
        const ctx = getAudioCtx();
        if (!ctx) return;
        const now = ctx.currentTime;
        const baseFreq = 540 * pitchRatio;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.25, now + 0.05);

        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.085);
      } catch(e) {}
    },

    // Combos & Streaks: steps up through ascending Pentatonic scale with lowpass filter
    playCombo: function(step = 0, vol = 0.18) {
      try {
        const ctx = getAudioCtx();
        if (!ctx) return;
        const now = ctx.currentTime;
        const noteIdx = Math.abs(step) % PENTATONIC_SCALE.length;
        const freq = PENTATONIC_SCALE[noteIdx];

        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(freq, now);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(freq * 1.002, now); // Sweet acoustic chorusing

        filter.type = 'lowpass';
        const cutoff = Math.min(6000, 1200 + (noteIdx * 450));
        filter.frequency.setValueAtTime(cutoff, now);
        filter.Q.setValueAtTime(2.5, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(vol, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.4);
        osc2.stop(now + 0.4);
      } catch(e) {}
    },

    // Impacts & Bounces: sub-bass thud (40-55Hz) with wooden transient click
    playThud: function(vol = 0.28) {
      try {
        const ctx = getAudioCtx();
        if (!ctx) return;
        const now = ctx.currentTime;

        // Sub-bass body
        const sub = ctx.createOscillator();
        const subGain = ctx.createGain();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(95, now);
        sub.frequency.exponentialRampToValueAtTime(42, now + 0.18);

        subGain.gain.setValueAtTime(vol, now);
        subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
        sub.connect(subGain);
        subGain.connect(ctx.destination);
        sub.start(now);
        sub.stop(now + 0.23);

        // Wooden transient click
        const click = ctx.createOscillator();
        const clickGain = ctx.createGain();
        click.type = 'triangle';
        click.frequency.setValueAtTime(320, now);
        click.frequency.exponentialRampToValueAtTime(110, now + 0.035);

        clickGain.gain.setValueAtTime(vol * 0.7, now);
        clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
        click.connect(clickGain);
        clickGain.connect(ctx.destination);
        click.start(now);
        click.stop(now + 0.045);
      } catch(e) {}
    },

    // Score Chime
    playScore: function(vol = 0.2) {
      try {
        const ctx = getAudioCtx();
        if (!ctx) return;
        const now = ctx.currentTime;
        [659.25, 1046.50].forEach((f, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, now + idx * 0.04);

          gain.gain.setValueAtTime(vol, now + idx * 0.04);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.04 + 0.35);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.04);
          osc.stop(now + idx * 0.04 + 0.36);
        });
      } catch(e) {}
    },

    // Win / Level-Up / Record: lush Major 7th / Lydian celestial chord arpeggio
    playWin: function() {
      try {
        const ctx = getAudioCtx();
        if (!ctx) return;
        const now = ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 987.77, 1046.50, 1318.51]; // C5, E5, G5, B5, C6, E6
        notes.forEach((f, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, now + idx * 0.055);

          gain.gain.setValueAtTime(0, now + idx * 0.055);
          gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.055 + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.055 + 0.5);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.055);
          osc.stop(now + idx * 0.055 + 0.52);
        });
      } catch(e) {}
    }
  };

  // ==========================================================================
  //  UNIVERSAL "BRIGHT +" VISUAL JUICE (DopamineJuice)
  //  Floating neon scores, spring pop physics, and canvas confetti cannon
  // ==========================================================================
  const QUAD_COLORS = ['#00f5ff', '#ff007f', '#ffd166', '#05ffa1', '#8ab4f8', '#f28b82', '#c084fc'];
  let confettiCanvas = null;
  let confettiCtx = null;
  const confettiParticles = [];

  function ensureVisualJuiceDOM() {
    if (!document.getElementById('dopamine-juice-styles')) {
      const style = document.createElement('style');
      style.id = 'dopamine-juice-styles';
      style.textContent = `
        .dopamine-score-popup {
          position: fixed;
          pointer-events: none;
          z-index: 99999;
          font-family: 'Outfit', 'Fredoka', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-weight: 900;
          letter-spacing: 0.5px;
          user-select: none;
          animation: dopamineScorePop 0.65s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        .dopamine-score-popup.bright-plus {
          background: linear-gradient(135deg, #00f5ff 0%, #05ffa1 35%, #ffd166 70%, #ff007f 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 0 14px rgba(0, 245, 255, 0.85)) drop-shadow(0 2px 4px rgba(0,0,0,0.8));
        }
        #dopamine-confetti-canvas {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          pointer-events: none;
          z-index: 99998;
        }
        @keyframes dopamineScorePop {
          0% { transform: translate(-50%, 0) scale(1.45); opacity: 0; }
          15% { transform: translate(-50%, -10px) scale(1.0); opacity: 1; }
          75% { transform: translate(-50%, -38px) scale(0.95); opacity: 1; }
          100% { transform: translate(-50%, -50px) scale(0.85); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    if (!confettiCanvas && document.body) {
      confettiCanvas = document.getElementById('dopamine-confetti-canvas');
      if (!confettiCanvas) {
        confettiCanvas = document.createElement('canvas');
        confettiCanvas.id = 'dopamine-confetti-canvas';
        document.body.appendChild(confettiCanvas);
      }
      confettiCtx = confettiCanvas.getContext('2d');
      const resize = () => {
        if (confettiCanvas) {
          confettiCanvas.width = window.innerWidth;
          confettiCanvas.height = window.innerHeight;
        }
      };
      window.addEventListener('resize', resize);
      resize();

      const loop = () => {
        if (confettiCtx && confettiCanvas) {
          confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
          for (let i = confettiParticles.length - 1; i >= 0; i--) {
            const p = confettiParticles[i];
            p.x += p.speedX;
            p.y += p.speedY;
            p.speedY += p.gravity;
            p.opacity -= p.decay;
            p.rotation += p.rotSpeed;

            if (p.opacity <= 0) {
              confettiParticles.splice(i, 1);
              continue;
            }

            confettiCtx.save();
            confettiCtx.globalAlpha = Math.max(0, p.opacity);
            confettiCtx.translate(p.x, p.y);
            confettiCtx.rotate((p.rotation * Math.PI) / 180);
            confettiCtx.fillStyle = p.color;
            confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            confettiCtx.restore();
          }
        }
        requestAnimationFrame(loop);
      };
      loop();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureVisualJuiceDOM);
  } else {
    ensureVisualJuiceDOM();
  }

  const DopamineJuice = {
    // Spawns Bright + Floating Score Popup at collision/screen coordinates
    spawnScore: function(x, y, text, streak = 1) {
      ensureVisualJuiceDOM();
      const popup = document.createElement('div');
      popup.className = 'dopamine-score-popup bright-plus';

      const posX = (x != null && !isNaN(x) && x > 0 && x < window.innerWidth) ? x : (window.innerWidth / 2);
      const posY = (y != null && !isNaN(y) && y > 0 && y < window.innerHeight) ? y : (window.innerHeight * 0.4);

      popup.style.left = `${posX}px`;
      popup.style.top = `${posY}px`;

      // Scale fontSize with streak / combo
      const fontSize = Math.min(36, 20 + Math.floor(streak * 2));
      popup.style.fontSize = `${fontSize}px`;
      popup.textContent = typeof text === 'number' ? `+${text}` : text;

      document.body.appendChild(popup);
      setTimeout(() => popup.remove(), 680);
    },

    // Explodes Quad-Color / Rainbow confetti
    explodeConfetti: function(x = window.innerWidth / 2, y = window.innerHeight * 0.4, count = 50) {
      ensureVisualJuiceDOM();
      for (let i = 0; i < count; i++) {
        confettiParticles.push({
          x, y,
          color: QUAD_COLORS[Math.floor(Math.random() * QUAD_COLORS.length)],
          size: Math.random() * 8 + 5,
          speedX: (Math.random() - 0.5) * 16,
          speedY: (Math.random() - 0.8) * 18,
          gravity: 0.45,
          opacity: 1,
          decay: Math.random() * 0.02 + 0.015,
          rotation: Math.random() * 360,
          rotSpeed: (Math.random() - 0.5) * 10
        });
      }
    }
  };

  window.DopamineSynth = DopamineSynth;
  window.DopamineJuice = DopamineJuice;
})(window);
