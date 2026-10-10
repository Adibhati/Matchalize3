/**
 * 🎂 AGE IS DERIVED, NEVER STORED-TRUSTED
 *
 * `User.age` is written once during onboarding and never touched again, so it
 * silently drifts: a user who signs up at 18 in August is still 18 the
 * following October. Before this module, that stale number was rendered on the
 * Matches page and the chat header (alignments.js projected `age` straight out
 * of the database) while the Discover deck didn't show age at all.
 *
 * Every public surface now derives age from `dob` at read time instead, so a
 * card can never show a number that's out of date. `User.age` is still written
 * at onboarding for the few paths that can't compute on read (a Mongoose
 * `.populate()` in routes/notifications.js, and the two full-document profile
 * endpoints) — run `scripts/backfill-age.mjs` after deploying to refresh those.
 *
 * ⚠️ DOB IS NOT SENT TO CLIENTS. It is PII and is far more identifying than an
 * age, so withFreshAge() always strips it from the object it returns. That is
 * why surfaces read `dob` in their query but never pass it on.
 */

/**
 * Whole years elapsed since `dob`, calendar-aware — so someone whose birthday
 * is today is already their new age, and someone whose birthday was yesterday
 * is not off by one.
 *
 * @param {Date|string|number} dob
 * @param {Date} [now] injectable for tests
 * @returns {number|null} age, or null if `dob` is missing/unparseable
 */
export const computeAgeFromDob = (dob, now = new Date()) => {
  if (!dob) return null;
  const d = dob instanceof Date ? dob : new Date(dob);
  if (Number.isNaN(d.getTime())) return null;

  let age = now.getFullYear() - d.getFullYear();
  const monthDelta = now.getMonth() - d.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < d.getDate())) {
    age -= 1;
  }
  return age;
};

/**
 * Attach a freshly-computed `age` to a plain object (a `.lean()` result or an
 * aggregation result) and remove `dob` from it.
 *
 * Deliberately returns a NEW object rather than mutating: the aggregation
 * results in routes/alignments.js are plain objects, but `.lean()` documents
 * elsewhere should stay untouched if the caller reuses them.
 *
 * Any pre-existing `age` key is overwritten — the whole point is that the
 * stored value may be stale.
 *
 * ⚠️ FALLBACK: if the document has no usable `dob`, the stored `age` is kept
 * rather than nulled. Onboarding requires `dob`, so a real user always has one;
 * the fallback exists for seeded/demo/QA rows (tests/society/personas.mjs
 * historically set `age` only) and any legacy
 * document predating the dob field. Without it those profiles would render as
 * "—" everywhere — worse than a stale number.
 */
export const withFreshAge = (user) => {
  if (!user) return user;
  const { dob, ...rest } = user;
  const computed = computeAgeFromDob(dob);
  return { ...rest, age: computed ?? rest.age ?? null };
};