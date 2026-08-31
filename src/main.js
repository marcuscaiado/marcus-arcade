import './style.css';

// =============================================
//  MARCUS ARCADE - Sound & Tilt Interactivity
// =============================================

let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function playHoverBeep(freq = 440) {
  try {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch (e) {}
}

document.addEventListener('click', () => {
  const ctx = getAudioCtx();
  if (ctx.state === 'suspended') ctx.resume();
}, { once: true });

// Sound on button & card hover
document.querySelectorAll('.game-card').forEach((card, i) => {
  card.addEventListener('mouseenter', () => {
    playHoverBeep(350 + i * 120);
  });
});

document.querySelectorAll('.exp-card').forEach((card, i) => {
  card.addEventListener('mouseenter', () => {
    playHoverBeep(600 + i * 80);
  });
});
