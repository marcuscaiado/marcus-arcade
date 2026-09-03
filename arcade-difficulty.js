/**
 * ============================================================================
 *  ARCADE DYNAMIC DIFFICULTY CONTROLLER (DDA) - 3-TIER SESSION ENGINE
 *  Definitive Commercial Arcade Systems Balancing for Marcus Arcade
 *
 *  - Standardized 3-Tier Session Progression:
 *    * Tier 1: Dopamine & Accessibility (0:00 – 1:30 / 0–90s)
 *      Gentle onboarding, generous reaction windows (>=450ms), readable velocity.
 *    * Tier 2: The Core Engagement Curve (1:30 – 4:00 / 90–240s)
 *      +20% to +40% speed, obstacle density, hazard complexity. Skill test phase.
 *    * Tier 3: High-Stakes Arcade Termination (4:00 – 5:00 max ceiling / 240–300s+)
 *      Climax pacing, micro-reaction windows (<250ms), high risk/reward, runs terminate around 4-5 min.
 *  - Exponential Utility Decay: Utility drops decay via P = P0 * e^(-k*t) to close stalling exploits.
 *  - High-dopamine milestone chimes on tier transitions (25%, 50%, 75%, 100%).
 * ============================================================================
 */

(function (root, factory) {
  const instance = factory();
  if (typeof define === 'function' && define.amd) {
    define([], () => instance);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = instance;
    module.exports.default = instance;
  }
  root.ArcadeDifficulty = instance;
  root.arcadeDifficulty = instance;
})(typeof window !== 'undefined' ? window : globalThis, function () {

  const activeMilestones = new Set();
  let sessionStartTime = 0;
  let isSessionRunning = false;

  /**
   * Start or reset a game session timer.
   */
  function startSession() {
    sessionStartTime = performance.now();
    isSessionRunning = true;
    activeMilestones.clear();
  }

  /**
   * Get current session elapsed duration in seconds.
   */
  function getSessionDurationSeconds() {
    if (!isSessionRunning || !sessionStartTime) return 0;
    return (performance.now() - sessionStartTime) / 1000;
  }

  /**
   * Evaluate the definitive 3-Tier Session Curve.
   *
   * @param {number|null} customTimeSeconds Optional manual elapsed seconds (defaults to live timer)
   * @param {number} score Player score (blended into progression)
   * @param {number} scoreThreshold Score threshold representing mastery
   * @returns {{ tier: number, tierProgress: number, multiplier: number, elapsedSeconds: number }}
   */
  function getSessionTier(customTimeSeconds = null, score = 0, scoreThreshold = 1000) {
    if (!isSessionRunning && customTimeSeconds === null) {
      startSession();
    }
    const t = customTimeSeconds !== null ? Math.max(0, customTimeSeconds) : getSessionDurationSeconds();
    let tier = 1;
    let tierProgress = 0;
    let timeMult = 1.0;

    if (t < 90) {
      // Tier 1: 0:00 - 1:30 (Dopamine & Accessibility)
      tier = 1;
      tierProgress = t / 90;
      timeMult = 1.0 + 0.22 * Math.pow(tierProgress, 0.75); // 1.0 -> 1.22
    } else if (t < 240) {
      // Tier 2: 1:30 - 4:00 (Core Engagement Curve)
      tier = 2;
      tierProgress = (t - 90) / 150;
      timeMult = 1.22 + 0.48 * Math.pow(tierProgress, 1.15); // 1.22 -> 1.70 (+20% to +40% pacing)
    } else {
      // Tier 3: 4:00 - 5:00 (High-Stakes Termination)
      tier = 3;
      tierProgress = Math.min(1.0, (t - 240) / 60);
      timeMult = 1.70 + 0.70 * Math.pow(tierProgress, 1.35); // 1.70 -> 2.40 max climax
    }

    // Blend in score factor if player is scoring fast
    let finalMultiplier = timeMult;
    if (score && scoreThreshold) {
      const scoreMult = getMultiplier(score, scoreThreshold, 2.4);
      finalMultiplier = Math.max(timeMult, (timeMult * 0.6) + (scoreMult * 0.4));
    }

    return {
      tier,
      tierProgress,
      multiplier: Number(finalMultiplier.toFixed(3)),
      elapsedSeconds: Math.round(t)
    };
  }

  /**
   * Calculate Golden Ratio difficulty multiplier based on score.
   */
  function getMultiplier(score, threshold = 1000, maxClamp = 2.4, kEarly = 0.70, kLate = 1.40) {
    if (!score || score <= 0) return 1.0;
    const s = Math.max(0, Number(score) || 0);
    const t = Math.max(1, Number(threshold) || 1000);
    const sMid = t * 0.35;

    let mult = 1.0;
    if (s < sMid) {
      const ratio = s / sMid;
      mult = 1.0 + 0.25 * Math.pow(ratio, kEarly);
    } else {
      const lateRatio = (s - sMid) / (t * 0.65);
      mult = 1.25 + 0.75 * Math.pow(lateRatio, kLate);
    }

    checkMilestones(s, t);
    return Math.min(maxClamp, Math.max(1.0, mult));
  }

  /**
   * Check if player crossed milestone threshold.
   */
  function checkMilestones(score, threshold) {
    const pct = (score / threshold) * 100;
    const tiers = [25, 50, 75, 100];
    for (const tier of tiers) {
      if (pct >= tier && !activeMilestones.has(tier)) {
        activeMilestones.add(tier);
        if (typeof window !== 'undefined' && window.arcadeAudio) {
          try {
            if (typeof window.arcadeAudio.playMilestone === 'function') {
              window.arcadeAudio.playMilestone(tier);
            } else if (typeof window.arcadeAudio.playComboChord === 'function') {
              window.arcadeAudio.playComboChord(tier / 25);
            }
          } catch (e) {}
        }
      }
    }
  }

  /**
   * Reset session timer and milestone tracking.
   */
  function reset() {
    startSession();
  }

  /**
   * Dynamically scale speed using time + score hybrid curve.
   */
  function scaleSpeed(baseSpeed, score = 0, threshold = 1000, maxMultiplier = 2.4) {
    const session = getSessionTier(null, score, threshold);
    const mult = Math.min(maxMultiplier, session.multiplier);
    return baseSpeed * mult;
  }

  /**
   * Dynamically scale spawn interval (shorter interval as session progresses).
   */
  function scaleInterval(baseInterval, score = 0, threshold = 1000, minInterval = 250, maxMultiplier = 2.4) {
    const session = getSessionTier(null, score, threshold);
    const mult = Math.min(maxMultiplier, session.multiplier);
    return Math.max(minInterval, Math.round(baseInterval / mult));
  }

  /**
   * Dynamically scale reaction window with strict human minimums.
   * Tier 1: >=450ms, Tier 2: 300-400ms, Tier 3: <250ms (floor clamped at minMs).
   */
  function scaleReactionWindow(baseMs, score = 0, threshold = 1000, minMs = 180, maxMultiplier = 2.4) {
    const session = getSessionTier(null, score, threshold);
    const mult = Math.min(maxMultiplier, session.multiplier);
    return Math.max(minMs, Math.round(baseMs / mult));
  }

  /**
   * Dynamically scale hazard or entity count.
   */
  function scaleCount(baseCount, score = 0, threshold = 1000, maxCount = 12, maxMultiplier = 2.4) {
    const session = getSessionTier(null, score, threshold);
    const mult = Math.min(maxMultiplier, session.multiplier);
    return Math.min(maxCount, Math.round(baseCount * mult));
  }

  /**
   * Exponential decay formula for utility power-ups (Freeze, Time+, extra lives).
   * Eliminates infinite-loop exploit builds: P = P0 * e^(-k * elapsedSeconds).
   */
  function scaleDropRate(baseProbability = 0.16, kDecay = 0.012, minProbability = 0.02) {
    const t = getSessionDurationSeconds();
    const p = baseProbability * Math.exp(-kDecay * t);
    return Math.max(minProbability, p);
  }

  // Auto-init session start
  startSession();

  return {
    startSession,
    getSessionDurationSeconds,
    getSessionTier,
    getMultiplier,
    scaleSpeed,
    scaleInterval,
    scaleReactionWindow,
    scaleCount,
    scaleDropRate,
    reset
  };
});
