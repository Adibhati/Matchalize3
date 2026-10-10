/**
 * 🪜 PROFILE LADDER — the single source of truth for profile completeness.
 *
 * This module OWNS the scoring. The client never computes a score: it renders
 * `User.profileScore`, which is written here and recomputed on every profile
 * write. That is deliberate — the ladder is used to GATE things (under 75 the
 * discover deck is read-only), so a client-computed score would be a number the
 * user can edit in devtools and walk straight through the gate with.
 *
 * The thresholds ship to the client via GET /config (`ladder`), so the gate and
 * the profile bar read the same marks instead of hardcoding their own.
 */

/** The three named rungs. Nothing else may invent a threshold. */
export const LADDER = {
  /** Visible to other people; discover deck is READ-ONLY below this. */
  publish: 45,
  /** Discover deck actions (flower / telegram / letter) unlock here. */
  interact: 75,
  /** Fully built profile. */
  aspirational: 100,
};

/** Mirrored by `slice(0, 4)` in routes/users.js and the client upload cap. */
export const MAX_PHOTOS = 4;
/** Mirrored by `prompts.slice(0, 3)` in routes/users.js. */
export const MAX_PROMPTS = 3;

/**
 * Point values per slot, in band order.
 *
 * ⚠️ THE GATE INVARIANT — read before changing any number here.
 *
 * The gate promises the user that ONE extra photo plus ONE prompt unlocks
 * their deck. That promise is only true if those two slots together equal
 * `interact - publish` (30). They currently do: photo2 (12) + prompt1 (18).
 *
 * If you re-weight photo2 or prompt1 so their sum is no longer 30, the gate
 * starts lying: the user adds a photo and a prompt exactly as told and stays
 * locked, with no way to work out why. There is no test that would catch this
 * from the UI — that is why the invariant is stated here and asserted in
 * scripts/backfill-ladder.mjs's companion assertions below.
 */
const WEIGHTS = {
  // ── 0 → 45 · publish ────────────────────────────────────────────────
  photo1: 15, // the face; on a dating card it is effectively the whole card
  gender: 10, // drives the mutual filter in discover.js, not just display
  name: 8,
  year: 6, // UG / PG
  intent: 6, // at least one entry
  // ── 45 → 75 · interact ──────────────────────────────────────────────
  photo2: 12,
  prompt1: 18, // ⚠️ see THE GATE INVARIANT above
  // ── 75 → 100 · aspirational ─────────────────────────────────────────
  photo3: 7,
  photo4: 4,
  prompt2: 9,
  prompt3: 5,
};

/**
 * Deliberately UNSCORED, do not add these without changing the bands above:
 *
 *   - `dob` / `age`  — an admission requirement (18+), not card content.
 *     /users/setup enforces it. Scoring it would make a safety gate look
 *     like a progress bar.
 *   - `bio`, `interests`, `pronouns`, `interestedIn` —
 *     real fields, but scoring them rewards filling them for points rather
 *     than because they make the profile worth replying to.
 *   - `college`, `collegeCode` — set by the auth picker, not by the user.
 *
 * Age is also DRIFT PRONE: `User.age` is written once at onboarding and goes
 * stale (see utils/age.js). Scoring a stale number would make the score wrong.
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
  const intent = Array.isArray(user.intent)
    ? user.intent
    : [user.intent].filter(Boolean);

  let score = 0;

  if (photos[0]) score += WEIGHTS.photo1;
  if (hasText(user.gender)) score += WEIGHTS.gender;
  if (hasText(user.name)) score += WEIGHTS.name;
  if (hasText(user.year)) score += WEIGHTS.year;
  if (intent.length > 0) score += WEIGHTS.intent;

  if (photos[1]) score += WEIGHTS.photo2;
  if (isAnswered(prompts[0])) score += WEIGHTS.prompt1;

  if (photos[2]) score += WEIGHTS.photo3;
  if (photos[3]) score += WEIGHTS.photo4;
  if (isAnswered(prompts[1])) score += WEIGHTS.prompt2;
  if (isAnswered(prompts[2])) score += WEIGHTS.prompt3;

  // Clamp rather than assert: if a future edit to WEIGHTS overflows, a 103
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