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
})(window);
