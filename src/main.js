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

  document.querySelectorAll('.play-btn, .filter-btn').forEach(el => {
    el.addEventListener('mouseenter', playClick);
  });
});
