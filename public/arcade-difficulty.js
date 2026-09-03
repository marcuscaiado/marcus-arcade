/**
 * ============================================================================
 *  ARCADE DYNAMIC DIFFICULTY CONTROLLER (DDA)
 *  Elite Flow-State Systems Balancing for Marcus Arcade
 *
 *  - "Golden Ratio" Progression: Sub-linear early onboarding (0–25%) ->
 *    Exponential skill test (25–70%+) -> Clamped high-stakes endless loop.
 *  - Fair Failure Safeguards: Strict human reaction thresholds (>=180ms)
 *    and anti-overlap spawn interval clamps (>=250ms).
 *  - High-dopamine milestone chimes on tier transitions (25%, 50%, 75%, 100%).
 * ============================================================================
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ArcadeDifficulty = factory();
    // Global convenience accessor
    root.arcadeDifficulty = root.ArcadeDifficulty;
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {

  const activeMilestones = new Set();

  /**
   * Calculate the Golden Ratio difficulty multiplier based on score.
   *
   * @param {number} score Current player score or progression metric
   * @param {number} threshold Target score representing mastery (100% baseline threshold)
   * @param {number} maxClamp Maximum allowable difficulty multiplier (default 2.2x)
   * @param {number} kEarly Sub-linear exponent for early phase (default 0.70)
   * @param {number} kLate Exponential exponent for late phase (default 1.40)
   * @returns {number} Clamped difficulty multiplier [1.0, maxClamp]
   */
  function getMultiplier(score, threshold = 1000, maxClamp = 2.2, kEarly = 0.70, kLate = 1.40) {
    if (!score || score <= 0) return 1.0;
    const s = Math.max(0, Number(score) || 0);
    const t = Math.max(1, Number(threshold) || 1000);
    const sMid = t * 0.35;

    let mult = 1.0;
    if (s < sMid) {
      // Early game: Concave / forgiving logarithmic ramp (0 - 25% boost)
      const ratio = s / sMid;
      mult = 1.0 + 0.25 * Math.pow(ratio, kEarly);
    } else {
      // Mid-to-Late game: Exponential ramp from 1.25x up to 2.0x+
      const lateRatio = (s - sMid) / (t * 0.65);
      mult = 1.25 + 0.75 * Math.pow(lateRatio, kLate);
    }

    // Check & trigger audio milestone dopamine chime if transitioning tiers
    checkMilestones(s, t);

    return Math.min(maxClamp, Math.max(1.0, mult));
  }

  /**
   * Check if the player crossed a progression tier (25%, 50%, 75%, 100% threshold)
   * and trigger an uplifting chime if audio is available.
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
   * Reset milestone tracking (call when starting/restarting a game).
   */
  function reset() {
    activeMilestones.clear();
  }

  /**
   * Dynamically scale a base movement/game speed.
   */
  function scaleSpeed(baseSpeed, score, threshold, maxMultiplier = 2.2) {
    return baseSpeed * getMultiplier(score, threshold, maxMultiplier);
  }

  /**
   * Dynamically scale a spawn interval (shorter intervals as score increases).
   * Guaranteed to respect minInterval clamp (default 250ms) to prevent impossible overlaps.
   */
  function scaleInterval(baseInterval, score, threshold, minInterval = 250, maxMultiplier = 2.2) {
    const mult = getMultiplier(score, threshold, maxMultiplier);
    return Math.max(minInterval, Math.round(baseInterval / mult));
  }

  /**
   * Dynamically scale a player reaction window.
   * Guaranteed to respect minMs clamp (default 180ms - human visual limit).
   */
  function scaleReactionWindow(baseMs, score, threshold, minMs = 180, maxMultiplier = 2.0) {
    const mult = getMultiplier(score, threshold, maxMultiplier);
    return Math.max(minMs, Math.round(baseMs / mult));
  }

  /**
   * Dynamically scale hazard or mob count.
   */
  function scaleCount(baseCount, score, threshold, maxCount = 10, maxMultiplier = 2.0) {
    const mult = getMultiplier(score, threshold, maxMultiplier);
    return Math.min(maxCount, Math.round(baseCount * mult));
  }

  return {
    getMultiplier,
    scaleSpeed,
    scaleInterval,
    scaleReactionWindow,
    scaleCount,
    reset
  };
});
