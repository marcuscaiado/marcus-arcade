/**
 * ============================================================================
 *  ARCADE PROCEDURAL SOUND ENGINE (Web Audio API)
 *  Elite Game Audio Architecture for Marcus Arcade (All 21 Games)
 *
 *  - 100% Zero external audio asset dependencies (.mp3 / .wav)
 *  - Velvet organic harmonics: soft sine, warm triangle, FM frequency sweeps
 *  - Dynamically tuned BiquadFilterNode low-pass filters (1200Hz–3200Hz)
 *  - Master bus gain staging & anti-clipping limiter curve
 *  - Auto-unlock & silent resume on player's first gesture
 *  - Full Dopamine & Serotonin interaction palette
 * ============================================================================
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    const engine = factory();
    root.ArcadeSoundEngine = engine;
    root.arcadeAudio = (root.arcadeAudio || engine.getInstance());
    // Backward compatibility proxy for games calling window.DopamineSynth
    root.DopamineSynth = root.arcadeAudio;
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {

  // Pentatonic scale (C5, D5, E5, G5, A5, C6, D6, E6)
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

  // Celestial Lydian / Major 9th Fanfare (C5, E5, G5, B5, D6, F#6, G6)
  const LYDIAN_CELESTIAL = [
    523.25, // C5 (Root)
    659.25, // E5 (Major 3rd)
    783.99, // G5 (5th)
    987.77, // B5 (Major 7th)
    1174.66, // D6 (9th)
    1479.98, // F#6 (#11 Lydian Chime)
    1567.98  // G6 (High Octave Shine)
  ];

  class ArcadeSoundEngine {
    constructor() {
      this.ctx = null;
      this.masterGain = null;
      this.limiter = null;
      this.filter = null;
      this.isUnlocked = false;
      this.streakCounter = 0;
      this.lastStreakTime = 0;
      this.muted = false;

      this._bindUnlockGestures();
    }

    /**
     * Singleton accessor
     */
    static getInstance() {
      if (!ArcadeSoundEngine._instance) {
        ArcadeSoundEngine._instance = new ArcadeSoundEngine();
      }
      return ArcadeSoundEngine._instance;
    }

    /**
     * Get or initialize the centralized Web Audio Context
     */
    getContext() {
      if (!this.ctx && typeof window !== 'undefined') {
        const AudioClass = window.AudioContext || window.webkitAudioContext;
        if (AudioClass) {
          try {
            this.ctx = new AudioClass({ latencyHint: 'interactive' });
            this._setupMasterBus();
          } catch (e) {
            // Fallback without options
            try {
              this.ctx = new AudioClass();
              this._setupMasterBus();
            } catch (err) {
              console.warn('Web Audio API not supported:', err);
            }
          }
        }
      }
      return this.ctx;
    }

    /**
     * Auto-resume context if browser suspended it due to autoplay policy
     */
    _ensureRunning() {
      const ctx = this.getContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      return ctx;
    }

    /**
     * Setup master bus with gain staging, warm low-pass acoustic filtering, and dynamic limiter
     */
    _setupMasterBus() {
      if (!this.ctx) return;
      try {
        // Master Gain Staging (default 0.70 prevents clipping across multi-voice playback)
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.70, this.ctx.currentTime);

        // Acoustic Warmth Biquad Filter (Low-pass 3200Hz, Q=1.0)
        // Eliminates harsh digital shrillness while preserving glossy highs
        this.filter = this.ctx.createBiquadFilter();
        this.filter.type = 'lowpass';
        this.filter.frequency.setValueAtTime(2800, this.ctx.currentTime);
        this.filter.Q.setValueAtTime(1.1, this.ctx.currentTime);

        // Dynamic Compressor / Soft Limiter ceiling
        this.limiter = this.ctx.createDynamicsCompressor();
        this.limiter.threshold.setValueAtTime(-12, this.ctx.currentTime);
        this.limiter.knee.setValueAtTime(8, this.ctx.currentTime);
        this.limiter.ratio.setValueAtTime(12, this.ctx.currentTime);
        this.limiter.attack.setValueAtTime(0.003, this.ctx.currentTime);
        this.limiter.release.setValueAtTime(0.15, this.ctx.currentTime);

        // Routing graph: Voice -> MasterGain -> Filter -> Limiter -> Destination
        this.masterGain.connect(this.filter);
        this.filter.connect(this.limiter);
        this.limiter.connect(this.ctx.destination);
      } catch (e) {
        console.warn('Error setting up master bus:', e);
      }
    }

    /**
     * Auto-unlock Web Audio API seamlessly on first player gesture with zero console warnings
     */
    _bindUnlockGestures() {
      if (typeof window === 'undefined' || typeof document === 'undefined') return;

      const unlock = () => {
        if (this.isUnlocked) return;
        const ctx = this.getContext();
        if (ctx) {
          if (ctx.state === 'suspended') {
            ctx.resume().then(() => {
              this.isUnlocked = true;
            }).catch(() => {});
          } else {
            this.isUnlocked = true;
          }
        }
        ['pointerdown', 'touchstart', 'mousedown', 'keydown', 'click'].forEach(evt => {
          window.removeEventListener(evt, unlock, { capture: true });
        });
      };

      ['pointerdown', 'touchstart', 'mousedown', 'keydown', 'click'].forEach(evt => {
        window.addEventListener(evt, unlock, { capture: true, once: true, passive: true });
      });
    }

    /**
     * Set master volume (0.0 to 1.0)
     */
    setVolume(vol) {
      if (!this.masterGain || !this.ctx) return;
      const target = Math.max(0, Math.min(1, vol));
      this.masterGain.gain.setValueAtTime(target * 0.70, this.ctx.currentTime);
    }

    /**
     * Toggle or set mute
     */
    setMuted(muted) {
      this.muted = !!muted;
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setValueAtTime(this.muted ? 0 : 0.70, this.ctx.currentTime);
      }
    }

    // ========================================================================
    //  DOPAMINE-DRIVEN INTERACTION PALETTE
    // ========================================================================

    /**
     * Tactile Clicks & Physical Bounces:
     * Ultra-fast pitch-envelope drop (280Hz down to 60Hz in 35ms) + warm woodblock snap
     * For paddle rebounds, ball bounces, pinball bumpers, wall hits, and buttons.
     */
    playBounce(intensity = 1.0, material = 'wood') {
      if (this.muted) return;
      const ctx = this._ensureRunning();
      if (!ctx) return;

      try {
        const now = ctx.currentTime;
        const speed = Math.max(0.2, Math.min(2.0, intensity));
        const duration = 0.042 * (1 / Math.sqrt(speed));
        const vol = Math.min(0.40, 0.18 + speed * 0.12);

        // 1. Dual-oscillator pitch sweep: sine body (280Hz -> 60Hz in 35ms)
        const sub = ctx.createOscillator();
        const subGain = ctx.createGain();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(280 * Math.min(1.4, speed), now);
        sub.frequency.exponentialRampToValueAtTime(55, now + duration);

        subGain.gain.setValueAtTime(vol, now);
        subGain.gain.exponentialRampToValueAtTime(0.0001, now + duration + 0.05);

        // 2. Warm acoustic transient: Woodblock / Marimba snap (warm triangle)
        const snap = ctx.createOscillator();
        const snapGain = ctx.createGain();
        snap.type = 'triangle';
        const startSnapFreq = material === 'wood' ? 420 : 680;
        snap.frequency.setValueAtTime(startSnapFreq * speed, now);
        snap.frequency.exponentialRampToValueAtTime(110, now + 0.025);

        snapGain.gain.setValueAtTime(vol * 0.75, now);
        snapGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.028);

        // Routing
        sub.connect(subGain);
        subGain.connect(this.masterGain);

        snap.connect(snapGain);
        snapGain.connect(this.masterGain);

        sub.start(now);
        sub.stop(now + duration + 0.06);

        snap.start(now);
        snap.stop(now + 0.035);
      } catch (e) {}
    }

    /**
     * High-frequency resonant bubble pop:
     * Dual oscillator (soft sine + warm triangle harmonic) with snappy frequency envelope.
     * For item pickups, 2048 merges, bubble pops, and UI buttons.
     */
    playPop(pitch = 1.0, volume = 0.28) {
      if (this.muted) return;
      const ctx = this._ensureRunning();
      if (!ctx) return;

      try {
        const now = ctx.currentTime;
        const p = Math.max(0.4, Math.min(3.0, pitch));
        const vol = Math.min(0.35, volume);

        // Bubble frequency rise and pop (Kalimba / water droplet transient)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(420 * p, now);
        osc1.frequency.exponentialRampToValueAtTime(980 * p, now + 0.035);
        osc1.frequency.exponentialRampToValueAtTime(350 * p, now + 0.075);

        // Harmonic triangle overtone (warm Rhodes bell)
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(840 * p, now);
        osc2.frequency.exponentialRampToValueAtTime(1960 * p, now + 0.035);
        osc2.frequency.exponentialRampToValueAtTime(700 * p, now + 0.075);

        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.masterGain);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.085);
        osc2.stop(now + 0.085);
      } catch (e) {}
    }

    /**
     * Collectibles, Orbs & Multipliers:
     * High-frequency bubble-like resonant pings cycling upward through an ascending
     * Pentatonic scale (C5, D5, E5, G5, A5, C6, D6, E6).
     * Consecutive hits scale pitch higher with resonant band-pass filtering and subtle portamento glide.
     */
    playCollectStreak(streak = 1, maxStreak = 12) {
      if (this.muted) return;
      const ctx = this._ensureRunning();
      if (!ctx) return;

      try {
        const now = ctx.currentTime;

        // Auto-increment streak if called rapidly within 1.2 seconds
        if (now - this.lastStreakTime > 1.2) {
          this.streakCounter = 0;
        }
        this.lastStreakTime = now;
        const currentStreak = typeof streak === 'number' && streak > 0 ? streak : ++this.streakCounter;

        // Pentatonic step mapping
        const step = (currentStreak - 1) % PENTATONIC_SCALE.length;
        const octaveBonus = Math.floor((currentStreak - 1) / PENTATONIC_SCALE.length);
        const baseFreq = PENTATONIC_SCALE[step] * Math.pow(2, octaveBonus * 0.5);

        // Dynamic Resonant Band-Pass Filter (scales Q and center frequency with streak)
        const bpFilter = ctx.createBiquadFilter();
        bpFilter.type = 'bandpass';
        bpFilter.frequency.setValueAtTime(Math.min(4200, baseFreq * 1.5), now);
        bpFilter.Q.setValueAtTime(Math.min(6.0, 1.8 + (currentStreak * 0.35)), now);

        // Dual oscillators: Root soft sine + Chorus triangle
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'triangle';

        // Subtle portamento glide upwards into the note (+12 cents)
        osc1.frequency.setValueAtTime(baseFreq * 0.94, now);
        osc1.frequency.exponentialRampToValueAtTime(baseFreq, now + 0.022);

        osc2.frequency.setValueAtTime(baseFreq * 1.003, now); // Detuned chorus
        osc2.frequency.exponentialRampToValueAtTime(baseFreq * 1.004, now + 0.022);

        // Volume and warm exponential decay curve
        const vol = Math.min(0.32, 0.16 + (Math.min(currentStreak, maxStreak) * 0.012));
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(vol, now + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

        // Connect graph
        osc1.connect(bpFilter);
        osc2.connect(bpFilter);
        bpFilter.connect(gain);
        gain.connect(this.masterGain);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.40);
        osc2.stop(now + 0.40);
      } catch (e) {}
    }

    /**
     * Triumph / Level Clears / World Records / Wins:
     * Cascading Lydian or Major 9th celestial chime arpeggio with extended, ethereal harmonic decay.
     */
    playTriumph(scale = 'lydian') {
      if (this.muted) return;
      const ctx = this._ensureRunning();
      if (!ctx) return;

      try {
        const now = ctx.currentTime;
        const notes = LYDIAN_CELESTIAL;
        const noteDelay = 0.052; // Rapid cascading arpeggio

        notes.forEach((freq, idx) => {
          const noteTime = now + idx * noteDelay;

          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const noteGain = ctx.createGain();

          osc1.type = 'sine';
          osc2.type = 'triangle';

          osc1.frequency.setValueAtTime(freq, noteTime);
          osc2.frequency.setValueAtTime(freq * 1.002, noteTime); // Shimmer detune

          // Ethereal harmonic decay
          noteGain.gain.setValueAtTime(0, noteTime);
          noteGain.gain.linearRampToValueAtTime(0.18, noteTime + 0.016);
          noteGain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.65);

          osc1.connect(noteGain);
          osc2.connect(noteGain);
          noteGain.connect(this.masterGain);

          osc1.start(noteTime);
          osc2.start(noteTime);
          osc1.stop(noteTime + 0.68);
          osc2.stop(noteTime + 0.68);
        });

        // Warm sub-bass chord foundation on the final resolution
        const subTime = now + (notes.length - 2) * noteDelay;
        const sub = ctx.createOscillator();
        const subGain = ctx.createGain();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(130.81, subTime); // C3 Warm Sub Root
        subGain.gain.setValueAtTime(0, subTime);
        subGain.gain.linearRampToValueAtTime(0.25, subTime + 0.03);
        subGain.gain.exponentialRampToValueAtTime(0.0001, subTime + 0.95);

        sub.connect(subGain);
        subGain.connect(this.masterGain);

        sub.start(subTime);
        sub.stop(subTime + 1.0);
      } catch (e) {}
    }

    /**
     * Failures, Misses & Game Over:
     * Warm, gentle, low-pass detuned sub-drops (lo-fi tape stop feel).
     * Replaces harsh buzzers with relaxing, comforting sub drops keeping the player relaxed.
     */
    playSoftThud(intensity = 1.0) {
      if (this.muted) return;
      const ctx = this._ensureRunning();
      if (!ctx) return;

      try {
        const now = ctx.currentTime;
        const duration = 0.38;
        const vol = Math.min(0.40, 0.22 * intensity);

        // Low-pass filter for velvety lo-fi tape stop feeling (removes any click)
        const lpf = ctx.createBiquadFilter();
        lpf.type = 'lowpass';
        lpf.frequency.setValueAtTime(260, now);
        lpf.frequency.exponentialRampToValueAtTime(60, now + duration);

        // Detuned pair of sub oscillators (92Hz & 85Hz glide down to 28Hz)
        const sub1 = ctx.createOscillator();
        const sub2 = ctx.createOscillator();
        const subGain = ctx.createGain();

        sub1.type = 'sine';
        sub2.type = 'triangle';

        sub1.frequency.setValueAtTime(92, now);
        sub1.frequency.exponentialRampToValueAtTime(28, now + duration);

        sub2.frequency.setValueAtTime(85, now);
        sub2.frequency.exponentialRampToValueAtTime(26, now + duration);

        subGain.gain.setValueAtTime(0, now);
        subGain.gain.linearRampToValueAtTime(vol, now + 0.015);
        subGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        sub1.connect(lpf);
        sub2.connect(lpf);
        lpf.connect(subGain);
        subGain.connect(this.masterGain);

        sub1.start(now);
        sub2.start(now);
        sub1.stop(now + duration + 0.02);
        sub2.stop(now + duration + 0.02);
      } catch (e) {}
    }

    // ========================================================================
    //  TAILORED ARCADE HELPER METHODS
    // ========================================================================

    /**
     * Tactile UI click / micro-bounce for buttons, tabs, and menus
     */
    playClick(pitch = 1.0) {
      this.playBounce(0.65 * pitch, 'wood');
    }

    /**
     * Velvety soft laser zap for space/arcade shooters (Zero harsh square waves)
     */
    playLaser(pitch = 1.0) {
      if (this.muted) return;
      const ctx = this._ensureRunning();
      if (!ctx) return;

      try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880 * pitch, now);
        osc.frequency.exponentialRampToValueAtTime(140 * pitch, now + 0.08);

        gain.gain.setValueAtTime(0.20, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.085);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.09);
      } catch (e) {}
    }

    /**
     * Glossy aerodynamic slash + resonant harmonic chime for Katana Slash
     */
    playSlice(streak = 1) {
      if (this.muted) return;
      const ctx = this._ensureRunning();
      if (!ctx) return;

      try {
        const now = ctx.currentTime;

        // Aerodynamic filtered noise whoosh
        const bufferSize = ctx.sampleRate * 0.07;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1800, now);
        filter.frequency.exponentialRampToValueAtTime(3200, now + 0.06);
        filter.Q.setValueAtTime(2.0, now);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.18, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.masterGain);

        noise.start(now);

        // Also trigger resonant slice chime
        this.playPop(1.2 + Math.min(0.8, streak * 0.1), 0.22);
      } catch (e) {}
    }

    // ========================================================================
    //  BACKWARD-COMPATIBILITY PROXIES (For DopamineSynth)
    // ========================================================================
    playTap(vol = 0.25, pitch = 1.0) {
      this.playBounce(pitch * (vol / 0.25));
    }

    playThud(vol = 0.35) {
      this.playSoftThud(vol / 0.35);
    }

    playCombo(streak = 1) {
      this.playCollectStreak(streak);
    }

    playScore(vol = 0.20) {
      this.playPop(1.1, vol);
    }

    playWin() {
      this.playTriumph();
    }
  }

  return ArcadeSoundEngine;
});
