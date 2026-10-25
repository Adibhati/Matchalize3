/**
 * 🪜 PROFILE LADDER — the single source of truth for profile completeness.
 *
 * This module OWNS the scoring. The client never computes a score: it renders
 * `User.profileScore`, which is written here and recomputed on every profile
 * write. That is deliberate — the ladder is used to GATE things (under 45 the
 * discover deck is read-only), so a client-computed score would be a number the
 * user can edit in devtools and walk straight through the gate with.
 *
 * The thresholds ship to the client via GET /config (`ladder`), so the gate and
 * the profile bar read the same marks instead of hardcoding their own.
 */

/** The three named rungs. Nothing else may invent a threshold. */
export const LADDER = {
  /** Completeness band used to classify/rank low-content profiles in Discover. */
  publish: 45,
  /** Discover deck actions (flower / telegram / letter) unlock here. */
  interact: 45,
  /** Fully built profile. */
  aspirational: 100,
};

/** Mirrored by `slice(0, 4)` in routes/users.js and the client upload cap. */
export const MAX_PHOTOS = 4;
/** Mirrored by `prompts.slice(0, 3)` in routes/users.js. */
export const MAX_PROMPTS = 3;

/**
 * Public-content point values. Required facts and private matching preferences
 * are deliberately excluded. The weights and caps are also sent through /config
 * so profile guidance can show accurate opportunities without becoming a
 * second score calculator.
 */
export const SCORE_WEIGHTS = Object.freeze({
  mainPhoto: 25,
  additionalPhoto: 10,
  bio: 10,
  answeredPrompt: 10,
  interests: 5,
});

/**
 * Required facts (name, gender, age/date of birth, and year), matching
 * preferences (intent and interestedIn), location, pronouns, and college do
 * not earn points. Only public profile content does.
 */

/** A prompt earns its points only when it is actually answered. */
const isAnswered = (p) =>
  Boolean(p?.question?.trim()) && Boolean(p?.answer?.trim());

const hasText = (v) => typeof v === 'string' && v.trim().length > 0;

/**
 * Score a user document's CONTENT. Pure and synchronous: it touches no DB, no
 * Date.now(), and no ambient state, so it is trivially testable and safe to
 * call from any write path.
 *
 * Call this AFTER all field assignments and BEFORE `.save()`.
 *
 * @param {object} user a User document or a plain object with the same fields
 * @returns {number} 0–100
 */
export function computeScore(user) {
  if (!user) return 0;

  const photos = Array.isArray(user.photos) ? user.photos : [];
  const prompts = Array.isArray(user.prompts) ? user.prompts : [];
  const interests = Array.isArray(user.interests) ? user.interests : [];

  let score = 0;

  if (photos[0]) score += SCORE_WEIGHTS.mainPhoto;
  score += Math.min(
    photos.slice(1, MAX_PHOTOS).filter(Boolean).length,
    MAX_PHOTOS - 1,
  ) * SCORE_WEIGHTS.additionalPhoto;
  if (hasText(user.bio)) score += SCORE_WEIGHTS.bio;
  score += prompts.slice(0, MAX_PROMPTS).filter(isAnswered).length * SCORE_WEIGHTS.answeredPrompt;
  if (interests.length > 0) score += SCORE_WEIGHTS.interests;

  // Clamp rather than assert: if a future edit to SCORE_WEIGHTS overflows, a 103
  // would break the client bar and the `>= 100` labels. Over-scoring is a bug
  // to fix, but it should degrade to "complete" rather than render nonsense.
  return Math.max(0, Math.min(LADDER.aspirational, score));
}

/**
 * Which band a score falls in. Single place the vocabulary is defined so the
 * client, the gate, and any future nudge copy all agree.
 *
 * @param {number} score
 * @returns {'locked'|'published'|'interactable'|'aspirational'}
 */
export function bandFor(score) {
  const n = Number.isFinite(score) ? score : 0;
  if (n >= LADDER.aspirational) return 'aspirational';
  if (n >= LADDER.interact) return 'interactable';
  if (n >= LADDER.publish) return 'published';
  return 'locked';
}

/** True when the deck's interactive actions should be available. */
export const canInteract = (score) => bandFor(score) === 'interactable' || bandFor(score) === 'aspirational';