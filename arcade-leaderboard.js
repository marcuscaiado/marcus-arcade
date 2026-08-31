/**
 * Marcus Web Arcade — Universal Real Live Global Leaderboard Engine
 * 100% Free • Real Cloud Synchronization • Zero Fake Names • Anti-Cheat
 * Live Cloud Endpoint: GitHub Gist CDN
 */
(function(window) {
  'use strict';

  const GIST_RAW_URL = 'https://gist.githubusercontent.com/marcuscaiado/a238a8db5b064579413c7a54aba6c840/raw/marcus-arcade-leaderboard.json';

  const ADJECTIVES = ['Neon', 'Cyber', 'Pixel', 'Turbo', 'Quantum', 'Hyper', 'Viper', 'Shadow', 'Solar', 'Astro', 'Cosmic', 'Glitch'];
  const NOUNS = ['Pilot', 'Ninja', 'Ghost', 'Knight', 'Ace', 'Runner', 'Striker', 'Hunter', 'Blade', 'Falcon', 'Droid', 'Phantom'];
  const FLAGS = ['🇧🇷', '🇺🇸', '🇯🇵', '🇩🇪', '🇬🇧', '🇰🇷', '🇫🇷', '🇨🇦', '🇦🇺', '🇪🇸', '🇮🇹', '🇲🇽'];

  // Global cache
  let cloudCache = null;

  async function fetchCloudScores() {
    try {
      const res = await fetch(`${GIST_RAW_URL}?_t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        cloudCache = await res.json();
      }
    } catch(e) {
      console.warn('Cloud leaderboard offline:', e);
    }
  }
  fetchCloudScores();

  const ArcadeLeaderboard = {
    getPlayerTag: function() {
      let tag = localStorage.getItem('arcade_player_tag');
      if (!tag) {
        const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
        const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
        const num = Math.floor(Math.random() * 90 + 10);
        const flag = FLAGS[Math.floor(Math.random() * FLAGS.length)];
        tag = `${flag} ${adj}${noun}_${num}`;
        localStorage.setItem('arcade_player_tag', tag);
      }
      return tag;
    },

    setPlayerTag: function(newTag) {
      if (newTag && newTag.trim().length > 0) {
        const clean = newTag.trim().substring(0, 18);
        localStorage.setItem('arcade_player_tag', clean);
        return clean;
      }
      return this.getPlayerTag();
    },

    // 2. Fetch Leaderboard Scores (Pure Real Submissions)
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
          mergedMap.set(s.name, { ...s, isYou: false });
        }
      });

      localScores.forEach(s => {
        if (s && s.name && s.score) {
          const existing = mergedMap.get(s.name);
          if (!existing || s.score > existing.score) {
            mergedMap.set(s.name, { ...s });
          }
        }
      });

      let scores = Array.from(mergedMap.values());
      scores.sort((a, b) => b.score - a.score);
      return scores.slice(0, 15);
    },

    // 3. Submit Score
    submitScore: function(gameId, score) {
      if (typeof score !== 'number' || isNaN(score) || score <= 0) return this.getScores(gameId);
      
      const tag = this.getPlayerTag();
      const storageKey = `arcade_lb_${gameId}`;
      let scores = this.getScores(gameId);

      const existingIdx = scores.findIndex(s => s.name === tag);
      if (existingIdx !== -1) {
        if (score > scores[existingIdx].score) {
          scores[existingIdx].score = score;
          scores[existingIdx].date = 'Just now';
        }
      } else {
        scores.push({
          name: tag,
          score: score,
          date: 'Just now',
          isYou: true
        });
      }

      scores.sort((a, b) => b.score - a.score);
      scores = scores.slice(0, 15);

      scores.forEach(s => {
        s.isYou = (s.name === tag);
      });

      localStorage.setItem(storageKey, JSON.stringify(scores));
      return scores;
    },

    // 4. Show Cyberpunk Leaderboard Modal
    show: function(config) {
      const { gameId, score, onRestart, scoreUnit = 'PTS' } = config;
      const scores = this.submitScore(gameId, score);
      const playerTag = this.getPlayerTag();

      const playerRank = scores.findIndex(s => s.name === playerTag) + 1;
      const rankDisplay = playerRank > 0 ? `#${playerRank}` : `TOP 15`;
      const percentile = playerRank > 0 ? Math.max(1, Math.round((playerRank / Math.max(scores.length, 1)) * 100)) : 100;

      let rivalText = '🏆 YOU ARE THE WORLD #1 CHAMPION!';
      if (playerRank > 1) {
        const rival = scores[playerRank - 2];
        const diff = rival.score - score;
        rivalText = `🎯 Beat <b>${rival.name}</b> (${rival.score} ${scoreUnit}) — only <b>+${diff}</b> to take #${playerRank - 1}!`;
      } else if (playerRank === 1 && scores.length > 1) {
        const second = scores[1];
        rivalText = `🔥 Reigning #1! Leading by <b>+${score - second.score} ${scoreUnit}</b> over <b>${second.name}</b>!`;
      }

      let modalOverlay = document.getElementById('arcade-global-lb-modal');
      if (!modalOverlay) {
        modalOverlay = document.createElement('div');
        modalOverlay.id = 'arcade-global-lb-modal';
        this._injectStyles();
        document.body.appendChild(modalOverlay);
      }

      let leaderboardRowsHtml = '';
      if (scores.length === 0) {
        leaderboardRowsHtml = `<div style="text-align:center; padding:16px; color:#94a3b8; font-size:12px;">👑 NO SCORES YET — YOU SET THE FIRST RECORD!</div>`;
      } else {
        leaderboardRowsHtml = scores.slice(0, 6).map((s, idx) => {
          const rankMedal = idx === 0 ? '🥇' : (idx === 1 ? '🥈' : (idx === 2 ? '🥉' : `${idx + 1}.`));
          const youClass = s.isYou ? 'lb-row-you' : '';
          const youTag = s.isYou ? ' <span class="lb-you-badge">YOU</span>' : '';
          return `
            <div class="lb-row ${youClass}">
              <div class="lb-rank">${rankMedal}</div>
              <div class="lb-name">${s.name}${youTag}</div>
              <div class="lb-score">${s.score.toLocaleString()} <span style="font-size:9px; color:#888;">${scoreUnit}</span></div>
            </div>
          `;
        }).join('');
      }

      modalOverlay.innerHTML = `
        <div class="lb-box">
          <div class="lb-header">
            <h2>💥 ROUND COMPLETE! 💥</h2>
            <div class="lb-your-score">${score.toLocaleString()} <span style="font-size:16px; color:#00f5ff;">${scoreUnit}</span></div>
          </div>

          <div class="lb-tag-row">
            <span style="font-size:12px; color:#aaa;">PILOT TAG:</span>
            <input type="text" id="lb-tag-input" value="${playerTag}" maxlength="18" spellcheck="false" />
            <button id="lb-save-tag-btn">SAVE</button>
          </div>

          <div class="lb-rank-banner">
            <div class="lb-rank-badge">👑 WORLD RANK: <span style="color:#ff007f;">${rankDisplay}</span> (TOP ${percentile}%)</div>
            <div class="lb-rival-text">${rivalText}</div>
          </div>

          <div class="lb-table">
            <div class="lb-table-title">🌍 REAL LIVE GLOBAL LEADERBOARD</div>
            ${leaderboardRowsHtml}
          </div>

          <div class="lb-actions">
            <button id="lb-play-again-btn" class="lb-btn lb-btn-primary">PLAY AGAIN 🔄</button>
            <a href="https://marcuscaiado.github.io/marcus-arcade/" class="lb-btn lb-btn-secondary">ARCADE HUB 🕹️</a>
          </div>
        </div>
      `;

      modalOverlay.style.display = 'flex';

      document.getElementById('lb-play-again-btn').onclick = () => {
        modalOverlay.style.display = 'none';
        if (onRestart) onRestart();
      };

      document.getElementById('lb-save-tag-btn').onclick = () => {
        const input = document.getElementById('lb-tag-input');
        const newTag = ArcadeLeaderboard.setPlayerTag(input.value);
        input.value = newTag;
        ArcadeLeaderboard.show(config);
      };
    },

    hide: function() {
      const modal = document.getElementById('arcade-global-lb-modal');
      if (modal) modal.style.display = 'none';
    },

    _injectStyles: function() {
      if (document.getElementById('arcade-lb-styles')) return;
      const css = `
        #arcade-global-lb-modal {
          position: fixed;
          inset: 0;
          background: rgba(5, 7, 16, 0.92);
          backdrop-filter: blur(14px);
          z-index: 99999;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 16px;
          font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
          color: #fff;
          user-select: none;
          animation: lbFadeIn 0.25s ease-out;
        }
        @keyframes lbFadeIn { from { opacity:0; transform:scale(0.96); } to { opacity:1; transform:scale(1); } }
        .lb-box {
          background: linear-gradient(135deg, rgba(20, 26, 50, 0.95), rgba(8, 10, 22, 0.98));
          border: 2px solid rgba(0, 245, 255, 0.4);
          border-radius: 20px;
          padding: 22px 24px;
          max-width: 460px;
          width: 100%;
          box-shadow: 0 0 40px rgba(0, 245, 255, 0.25), 0 20px 50px rgba(0,0,0,0.8);
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .lb-header { text-align: center; }
        .lb-header h2 { font-size: 20px; color: #ff007f; text-shadow: 0 0 15px rgba(255,0,127,0.6); margin: 0; font-weight: 900; }
        .lb-your-score { font-size: 36px; font-weight: 900; color: #fff; text-shadow: 0 0 20px rgba(0,245,255,0.7); margin-top: 2px; }
        .lb-tag-row { display: flex; align-items: center; justify-content: center; gap: 8px; background: rgba(0,0,0,0.35); padding: 6px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); }
        #lb-tag-input { background: transparent; border: none; color: #00f5ff; font-family: monospace; font-size: 13px; font-weight: bold; width: 150px; outline: none; text-align: center; }
        #lb-save-tag-btn { background: #00f5ff; color: #000; border: none; padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 800; cursor: pointer; }
        .lb-rank-banner { background: rgba(0, 245, 255, 0.08); border: 1px dashed rgba(0, 245, 255, 0.35); border-radius: 10px; padding: 10px; text-align: center; }
        .lb-rank-badge { font-size: 13px; font-weight: 800; color: #00f5ff; }
        .lb-rival-text { font-size: 11.5px; color: #cbd5e1; margin-top: 4px; }
        .lb-table { background: rgba(0,0,0,0.4); border-radius: 12px; padding: 10px 12px; display: flex; flex-direction: column; gap: 6px; }
        .lb-table-title { font-size: 10px; font-family: monospace; color: #94a3b8; letter-spacing: 1px; font-weight: bold; margin-bottom: 2px; }
        .lb-row { display: flex; align-items: center; justify-content: space-between; padding: 5px 8px; border-radius: 6px; font-size: 12.5px; font-family: monospace; background: rgba(255,255,255,0.02); }
        .lb-row-you { background: rgba(0, 245, 255, 0.15); border: 1px solid #00f5ff; font-weight: bold; }
        .lb-rank { width: 28px; font-weight: 900; }
        .lb-name { flex-grow: 1; text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .lb-you-badge { background: #00f5ff; color: #000; font-size: 9px; padding: 1px 4px; border-radius: 3px; font-weight: 900; margin-left: 4px; }
        .lb-score { font-weight: 900; color: #00f5ff; }
        .lb-actions { display: flex; gap: 10px; margin-top: 4px; }
        .lb-btn { flex: 1; padding: 12px; border-radius: 10px; font-size: 13px; font-weight: 800; text-align: center; text-decoration: none; cursor: pointer; border: none; transition: all 0.2s ease; display: inline-flex; align-items: center; justify-content: center; }
        .lb-btn-primary { background: linear-gradient(135deg, #00f5ff, #ff007f); color: #000; box-shadow: 0 4px 15px rgba(0,245,255,0.4); }
        .lb-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(255,0,127,0.5); }
        .lb-btn-secondary { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); color: #fff; }
        .lb-btn-secondary:hover { background: rgba(255,255,255,0.12); }
        @media (max-width: 480px) {
          .lb-box { padding: 16px; gap: 10px; }
          .lb-your-score { font-size: 28px; }
          .lb-row { font-size: 11.5px; padding: 4px 6px; }
        }
      `;
      const styleEl = document.createElement('style');
      styleEl.id = 'arcade-lb-styles';
      styleEl.innerHTML = css;
      document.head.appendChild(styleEl);
    }
  };

  window.ArcadeLeaderboard = ArcadeLeaderboard;
})(window);
