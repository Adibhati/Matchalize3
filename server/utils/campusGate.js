/**
 * 🚪 CAMPUS GATE — which campuses may currently sign up.
 *
 * The closed, verified-student network is only meaningful if the gate is
 * actually closed. An IIT Bombay pilot has no use for a student from another
 * campus: the entire product thesis is a dense, verified pool, and one
 * outsider in a small pool is a stranger, not a feature.
 *
 * Two independent mechanisms exist, and it is worth being precise about why
 * BOTH are needed rather than either:
 *
 *   1. This gate (`ALLOWED_COLLEGES`). An allow-list applied at the point a
 *      signup is authorised — `resolveCollege()` in routes/auth.js. This is the
 *      security control. It does not care what the database contains.
 *
 *   2. `College.active` in the database, which decides what the picker shows.
 *
 * The reason this is not just "set every other college inactive" is that the
 * database is mutable at runtime: an operator can activate a campus from
 * /admin, or approve a CollegeRequest, and the pilot gate would silently stop
 * applying. This file is configuration — it only changes when someone edits
 * the environment and redeploys — so it is the layer that cannot be talked out
 * of its job by a click in the admin panel.
 *
 * ── WHY AN ALLOW-LIST AND NOT A BLOCK-LIST ───────────────────────────────────
 * A block-list ("these campuses are closed") has to be updated every time a new
 * campus is added, and the failure mode is opening the gate: forget the entry,
 * and the campus is quietly live. An allow-list fails closed instead — an
 * unlisted campus is refused, so the mistake costs you one new user rather than
 * an unintended public launch.
 *
 * ── UNSET MEANS OPEN ────────────────────────────────────────────────────────
 * With no `ALLOWED_COLLEGES` set, every active college can sign up. That is
 * the pre-pilot behaviour and it is the correct default for local development,
 * where seeding one college and pointing the picker at it is already the
 * intended workflow. The gate is opt-IN, so a developer who never hears of it
 * gets a working app rather than a confusing one.
 */

/**
 * The parsed allow-list, or null when no gate is configured.
 *
 * Normalised on read rather than at module load, because a test that mutates
 * `process.env` between cases would otherwise read a stale snapshot frozen at
 * import time. The cost is trivial: the list is a handful of strings and this
 * is called on signup, not on a hot path.
 *
 * @returns {Set<string>|null} lowercased college codes, or null when open
 */
export const getAllowedColleges = () => {
  const raw = process.env.ALLOWED_COLLEGES;

  // Empty string and whitespace both mean "not configured". An operator who
  // blanks the variable expects the app to behave as it did before, not to
  // lock every student out of a campus they never named.
  if (raw === undefined || raw === null || String(raw).trim() === '') return null;

  const codes = String(raw)
    .split(',')
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);

  // A variable containing only separators (" ,, ") parses to an empty list.
  // That is NOT the same as unset: returning null here would open the gate
  // when the operator clearly intended to restrict it. An empty set closes it.
  return new Set(codes);
};

/**
 * @param {string} collegeCode
 * @returns {boolean} true when this college may sign up (always true when no
 *                    gate is configured)
 */
export const isCollegeAllowed = (collegeCode) => {
  const allowed = getAllowedColleges();
  if (allowed === null) return true;
  return allowed.has(String(collegeCode || '').trim().toLowerCase());
};

/**
 * The message a student sees when their campus is outside the gate.
 *
 * Deliberately does NOT say "this app is invite-only" or "not available in your
 * region". It tells them what to do: use the college email and try again, or
 * that their campus is not yet open. Naming a hard boundary invites people to
 * look for a way around it; naming the next step does not.
 */
export const COLLEGE_GATE_MESSAGE =
  'Sign-ups for your college are not open yet. If you have a college email address, please try again.';

/**
 * Build the Mongo filter fragment that limits a college query to the gate.
 *
 * Used by the two list endpoints so the picker only ever shows colleges a
 * student could actually verify against. Showing a selectable campus that
 * signup then rejects is the worst version of this: the student picks it,
 * types their real college email, and is told no at the last step.
 *
 * @returns {{code?: {$in: string[]}}} `{}` when the gate is open
 */
export const collegeGateFilter = () => {
  const allowed = getAllowedColleges();
  if (allowed === null) return {};
  return { code: { $in: [...allowed] } };
};