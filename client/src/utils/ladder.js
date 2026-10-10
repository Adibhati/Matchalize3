/**
 * 🪜 PROFILE LADDER — client reader
 *
 * ⚠️ THERE IS DELIBERATELY NO `computeScore` IN THIS FILE.
 *
 * The score itself lives on the server (utils/ladder.js) and is stored as
 * `User.profileScore`. This module only reads the thresholds, which the server
 * ships through GET /config, so the profile bar, the gate, and any future nudge
 * all mark up against the same numbers instead of each hardcoding 45/75/100.
 *
 * Do not add a client-side scorer. The ladder gates the discover deck, so a
 * score the client could recompute is a score someone can edit in devtools and
 * use to walk straight through the gate. Render what the server sent.
 */

/**
 * Fallback used only if /config has not resolved (or failed). These MUST stay
 * equal to LADDER in server/utils/ladder.js — they are the last-resort values,
 * not an independent definition.
 */
export const LADDER_FALLBACK = {
  publish: 45,
  interact: 75,
  aspirational: 100,
};

/** Max photos a profile may hold. Mirrored by `slice(0, 4)` server-side. */
export const MAX_PHOTOS = 4;

/**
 * Read the thresholds off the /config payload.
 *
 * @param {object|null} config the AppConfigContext value
 * @returns {{publish:number, interact:number, aspirational:number}}
 */
export const readLadder = (config) => {
  const fromServer = config?.ladder;
  return {
    publish: fromServer?.publish ?? LADDER_FALLBACK.publish,
    interact: fromServer?.interact ?? LADDER_FALLBACK.interact,
    aspirational: fromServer?.aspirational ?? LADDER_FALLBACK.aspirational,
  };
};

/**
 * Which band a score falls in. Mirrors `bandFor` in server/utils/ladder.js —
 * the vocabulary is defined once per side, but both must agree.
 *
 * @param {number} score
 * @param {object} config
 * @returns {'locked'|'published'|'interactable'|'aspirational'}
 */
export const bandFor = (score, config) => {
  const { publish, interact, aspirational } = readLadder(config);
  const n = Number.isFinite(score) ? score : 0;
  if (n >= aspirational) return 'aspirational';
  if (n >= interact) return 'interactable';
  if (n >= publish) return 'published';
  return 'locked';
};

/**
 * True when the discover deck's interactive actions should be available.
 * Reads-only surfaces (your own profile, Letters, Roulette, received chats)
 * are NOT gated on this — see the deck-wide gate design.
 */
export const canInteract = (score, config) => {
  const band = bandFor(score, config);
  return band === 'interactable' || band === 'aspirational';
};

/**
 * Coerce whatever the API sent into a usable number. A user document predating
 * the field has no `profileScore` at all, so it arrives undefined and would
 * otherwise render as `NaN%` in the bar.
 */
export const readScore = (user) => {
  const n = Number(user?.profileScore);
  return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0;
};