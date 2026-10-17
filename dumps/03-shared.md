# Chunk 03 — Shared

> Matchalize · `shared` · files 3 of 27 chunks · 6 file(s) · 28 KB · ~8,276 tokens
> Generated 2026-10-17 20:14.
> Paste-safe: within the 100 KB / ~29,257 token target.
>
> Contains:
> - `./client/src/utils/ladder.js`
> - `./server/routes/config.js`
> - `./server/utils/age.js`
> - `./server/utils/collegeDomain.js`
> - `./server/utils/geo.js`
> - `./server/utils/ladder.js`

---
### ./client/src/utils/ladder.js

```
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
```

### ./server/routes/config.js

```
import express from 'express';
import Setting from '../models/Setting.js';
import {
  PROMPT_BANK, BRANCHES, YEARS, GENDERS, INTENTS, INTEREST_TAGS,
  PRONOUNS_OPTIONS, INTEREST_ICONS, INTEREST_ICON_FALLBACKS, APP_CONSTANTS,
} from '../config/appData.js';
import { LADDER } from '../utils/ladder.js';
import { collegeGateFilter } from '../utils/campusGate.js';
import College from '../models/College.js';

const router = express.Router();

// ─── IN-MEMORY TTL CACHE ───
// Config changes rarely, but this endpoint is hit on EVERY app load.
// Cache for 30s so simultaneous launches produce ONE DB query, not one per user.
const CACHE_TTL_MS = 30 * 1000;
let configCache = null;
let cacheExpiresAt = 0;

router.get('/', async (req, res) => {
  try {
    // 🏫 COLLEGES ARE ALWAYS FETCHED FRESH — deliberately outside the cache.
    //
    // This must happen before the cache short-circuit below. An operator who
    // just added a campus and then saw it missing from their own picker would
    // reasonably assume the Add button is broken. One small indexed query on a
    // handful of college rows is not worth a stale picker.
    //
    // Only ACTIVE colleges: deactivating one removes it from signup immediately,
    // while students who already verified through it are untouched.
    //
    // AND only gated-in ones. A campus outside ALLOWED_COLLEGES cannot sign up
    // (routes/auth.js resolveCollege refuses it), so listing it here would show
    // a student a selectable option that is guaranteed to fail at the email
    // step — the worst place to discover a closed door.
    const colleges = await College.find({ active: true, ...collegeGateFilter() }).sort({ name: 1 }).lean();
    const collegeList = colleges.map((c) => ({
      code: c.code,
      name: c.name,
      // Public campus information — it has to be exposed for the pre-filled
      // email suffix to work. It contains no student data whatsoever.
      domains: c.domains,
      city: c.city,
      state: c.state,
      country: c.country,
    }));

    // Serve the static remainder from cache if fresh
    if (configCache && Date.now() < cacheExpiresAt) {
      res.set('Cache-Control', 'public, max-age=30');
      return res.json({ ...configCache, colleges: collegeList });
    }

    // Check database for dynamic settings first
    const dbSetting = await Setting.findOne({ key: 'appConfig' });
    let payload;
    if (dbSetting) {
      payload = dbSetting.value;
    } else {
      // Fallback to static file if DB is empty
      payload = {
        prompts: PROMPT_BANK,
        branches: BRANCHES,
        years: YEARS,
        genders: GENDERS,
        intents: INTENTS,
        interests: INTEREST_TAGS,
        pronouns: PRONOUNS_OPTIONS,
        interestIcons: INTEREST_ICONS,
        interestIconFallbacks: INTEREST_ICON_FALLBACKS,
        // `colleges` is attached from the DB after this object is built — it is
        // no longer sourced from COLLEGE_MAP in appData.js. That constant
        // survives only as the seed in scripts/reset-colleges.mjs.
        constants: APP_CONSTANTS,
        splash: {
          videoUrl: process.env.SPLASH_VIDEO_URL || '/lover.mp4',
          tagline: process.env.SPLASH_TAGLINE || 'Your Campus. Your Story.',
        },
      };
    }

    // The ladder is attached AFTER the source is resolved, never inside either
    // branch. A stored `appConfig` document in the DB is an admin-authored
    // snapshot taken before the ladder existed, so if this were set in the
    // static fallback only, the thresholds would silently vanish from the
    // client the moment anyone saved that setting — and the gate would then
    // hardcode its own numbers instead of reading LADDER.interact.
    payload = { ...payload, ladder: LADDER };

    // Colleges were already fetched above, outside the cache. Attached here so
    // both the cached and uncached response paths carry the same fresh list.
    payload = { ...payload, ladder: LADDER, colleges: collegeList };

    configCache = payload;
    cacheExpiresAt = Date.now() + CACHE_TTL_MS;
    res.set('Cache-Control', 'public, max-age=30');
    res.json(payload);
  } catch (error) {
    console.error('Config route error:', error);
    res.status(500).json({ message: 'Server error fetching config' });
  }
});

export default router;
```

### ./server/utils/age.js

```
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
```

### ./server/utils/collegeDomain.js

```
/**
 * 🔒 COLLEGE DOMAIN MATCHING — the whole verification boundary.
 *
 * An email is "college X's address" only when the domain after the @ is either
 * EXACTLY one of X's registered domains, or a subdomain of one (separated by a
 * real dot, so every IIT Bombay department address works from a single entry).
 *
 * ⚠️ WHY THIS FILE IS DELICATE
 *
 * A naive `endsWith` check accepts `attacker@iitb.ac.in.evil.com`, because
 * that string DOES end with "iitb.ac.in". The attacker owns `evil.com`, catches
 * the OTP, and is now a verified student. The dot-boundary requirement in
 * `domainMatches` is the only thing standing between that and a breach.
 *
 * Previously this lived as string-slicing in routes/auth.js — "take the label
 * immediately before .ac.in" — which was both wrong for any non-.ac.in domain
 * and forgeable. It is gone.
 */

/**
 * Strip an email down to its bare domain, or null if it isn't parseable.
 *
 * Deliberately strict: exactly one "@", something either side, no spaces. A
 * loose parser here is a security hole.
 *
 * @param {string} email
 * @returns {string|null} lowercased domain without a leading @
 */
export function extractDomain(email) {
  if (typeof email !== 'string') return null;
  const trimmed = email.trim().toLowerCase();
  const parts = trimmed.split('@');
  if (parts.length !== 2) return null;

  const [local, domain] = parts;
  if (!local || !domain) return null;
  if (/\s/.test(trimmed)) return null;
  // A domain needs at least one dot and no empty labels. Rejects "a@b" and
  // "x@iitb.ac.in@" style inputs that a lenient parser would wave through.
  if (!domain.includes('.')) return null;
  if (domain.startsWith('.') || domain.endsWith('.') || domain.includes('..')) return null;
  if (!/^[a-z0-9.-]+$/.test(domain)) return null;

  return domain;
}

/**
 * Does `domain` belong to `approved`?
 *
 * Exact match, or a subdomain of it. "Subdomain" means the remainder sits
 * behind a dot, which is the entire security property:
 *
 *   iitb.ac.in              === iitb.ac.in              → true
 *   cse.iitb.ac.in          endsWith .iitb.ac.in       → true
 *   notiitb.ac.in           endsWith .iitb.ac.in? NO   → false
 *   iitb.ac.in.evil.com     endsWith .iitb.ac.in? NO   → false
 *
 * @param {string} domain   already extracted, lowercased
 * @param {string} approved registered domain, lowercased, no @
 * @returns {boolean}
 */
export function domainMatches(domain, approved) {
  if (!domain || !approved) return false;
  const d = domain.toLowerCase();
  const a = approved.toLowerCase().replace(/^@/, '').trim();
  if (!a) return false;
  if (d === a) return true;
  return d.endsWith(`.${a}`);
}

/**
 * Full check: does this email address match ANY of these approved domains?
 *
 * @param {string} email
 * @param {string[]} approvedDomains
 * @returns {boolean}
 */
export function emailMatchesCollege(email, approvedDomains) {
  const domain = extractDomain(email);
  if (!domain || !Array.isArray(approvedDomains) || approvedDomains.length === 0) return false;
  return approvedDomains.some((d) => domainMatches(domain, d));
}

/**
 * The best (longest) matching domain, for storing a sensible `collegeCode`
 * hint on an OTP record. Longest wins so `cse.iitb.ac.in` beats `iitb.ac.in`
 * when a college registers both.
 *
 * @param {string} email
 * @param {string[]} approvedDomains
 * @returns {string|null}
 */
export function matchDomain(email, approvedDomains) {
  const domain = extractDomain(email);
  if (!domain || !Array.isArray(approvedDomains)) return null;
  const hits = approvedDomains
    .map((a) => ({ a: a.toLowerCase().replace(/^@/, '').trim(), ok: domainMatches(domain, a) }))
    .filter((x) => x.ok)
    .sort((x, y) => y.a.length - x.a.length);
  return hits.length ? hits[0].a : null;
}

/**
 * Normalise a domain for storage: lowercase, no @, no leading/trailing dot.
 * Returns null for anything that can't be a domain, so callers can reject it.
 *
 * @param {string} raw
 * @returns {string|null}
 */
export function normaliseDomain(raw) {
  if (typeof raw !== 'string') return null;
  const d = raw.trim().toLowerCase().replace(/^@/, '').replace(/^\.+|\.+$/g, '');
  if (!d || !d.includes('.') || /[^a-z0-9.-]/.test(d) || d.includes('..')) return null;
  return d;
}
```

### ./server/utils/geo.js

```
/**
 * 📍 DISTANCE — coarse bands, computed from stored coordinates.
 *
 * ── WHY BANDING AT ALL, AND WHY NOT EXACT KILOMETRES ──────────────────────
 * The deck shows people you could plausibly actually meet. A band answers that
 * question well enough ("Near you", "In your area") without publishing a
 * distance figure that narrows someone down. Publishing "14km away" on a card
 * is a materially different privacy act from publishing "In your area", and the
 * product gets nothing from the precision: nobody changes their behaviour
 * because the number is 14 instead of 19.
 *
 * ── WHY UNKNOWN IS NOT ZERO ───────────────────────────────────────────────
 * Every function here treats "we do not know where this person is" as its own
 * answer, never as "they are nearby". Collapsing unknown into 0 km would rank
 * a profile with no location as maximally close and float it to the top of the
 * deck — the exact class of bug `UNKNOWN_ACTIVITY_SCORE = 0.5` exists to
 * prevent on the activity side. `bandFor(null)` returns null, and callers sort
 * null LAST.
 *
 * ── WHY THE COORDINATES THEMSELVES ARE STORED ROUNDED ─────────────────────
 * `User.currentLatLng` is rounded to 2 decimal places before it is ever
 * persisted (see routes/users.js). That is a ~1.1km grid square. It is ample for
 * a 30km band and it means a home address cannot be reconstructed from the
 * database even if it were read. The rounding is a server-side control on
 * purpose: doing it client-side would leave the precise value in the request
 * body, the access logs, and anywhere else the request is captured.
 *
 * ── NO REVERSE GEOCODING, NO API KEY, NO COST ─────────────────────────────
 * Distance here is haversine between two stored points. Turning coordinates
 * into a city name would need a paid geocoding provider; nothing in this file
 * needs one, because the card label is derived from DISTANCE rather than from a
 * place name.
 */

const EARTH_RADIUS_KM = 6371;
const DEG_TO_RAD = Math.PI / 180;

/**
 * How long a stored location is still trusted before it stops affecting
 * ranking.
 *
 * 30 days, not 7. A student who sets their location in May and returns in July
 * must not silently drop out of distance ranking for two months over a long
 * break — that is the exact failure that made campus-only location untenable in
 * the first place. Beyond the window the reading is treated as unknown, which
 * is neutral, rather than kept indefinitely and quietly wrong.
 */
export const LOCATION_TTL_DAYS = 30;

/**
 * How far someone has to move before the stored position is treated as wrong
 * rather than merely imprecise.
 *
 * Without this, someone who travelled from Mumbai to Bangalore keeps being shown
 * as "Near you" to Mumbai profiles until the 30-day TTL finally expires — up to a
 * month of confidently wrong results. With it, the app corrects itself the moment
 * the discrepancy is real.
 *
 * 25km rather than something small because GPS is noisy in exactly the way that
 * matters here: a phone indoors, on a campus with buildings between it and the
 * nearest tower, can report a few hundred metres of drift between two readings
 * taken seconds apart. Rebuilding the whole deck for that would make the deck
 * visibly jump around, which is the exact problem the session model exists to
 * prevent. 25km is comfortably above the noise and well below any distance where
 * "near me" would be misleading.
 */
export const LOCATION_DRIFT_KM = 25;

/**
 * Coarse bands, nearest first. `maxKm: Infinity` is the catch-all tail so a
 * lookup always resolves rather than falling through to null.
 *
 * Labels are deliberately soft. The 300km+ band has `label: null` and renders
 * nothing — labelling thousands of distant strangers "Elsewhere in India" on
 * every card is noise, and the college badge already carries the useful part.
 */
export const DISTANCE_BANDS = [
  { maxKm: 30, label: 'Near you' },
  { maxKm: 100, label: 'In your area' },
  { maxKm: 300, label: 'Further away' },
  { maxKm: Infinity, label: null },
];

/**
 * Normalise an untrusted coordinate pair into a storable `[lat, lng]`, or null.
 *
 * Rounds to 2dp — this is the single privacy control for stored location and it
 * is deliberately the only way coordinates enter the database. Rejects out-of-
 * range values rather than clamping them: a latitude of 999 is corrupt data, and
 * clamping it to a plausible-looking 89 would launder a bug into something that
 * looks legitimate.
 *
 * @param {unknown} value
 * @returns {[number, number]|null}
 */
export const sanitizeLatLng = (value) => {
  if (!Array.isArray(value) || value.length !== 2) return null;
  const [lat, lng] = value.map((n) => (typeof n === 'number' ? n : Number(n)));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  const round2 = (n) => Math.round(n * 100) / 100;
  return [round2(lat), round2(lng)];
};

/**
 * Great-circle distance in kilometres, or null when either point is unusable.
 *
 * Uses the haversine form rather than the law-of-cosines form specifically
 * because the latter loses catastrophic precision at small distances — the
 * distances that matter most here are 0–30km, where law-of-cosines can lose a
 * decimal place or more to floating-point cancellation.
 *
 * @param {[number, number]} a `[lat, lng]`
 * @param {[number, number]} b `[lat, lng]`
 * @returns {number|null}
 */
export const haversineKm = (a, b) => {
  const p1 = sanitizeLatLng(a);
  const p2 = sanitizeLatLng(b);
  if (!p1 || !p2) return null;

  const dLat = (p2[0] - p1[0]) * DEG_TO_RAD;
  const dLng = (p2[1] - p1[1]) * DEG_TO_RAD;
  const lat1 = p1[0] * DEG_TO_RAD;
  const lat2 = p2[0] * DEG_TO_RAD;

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
};

/**
 * Resolve a distance to its band.
 *
 * @param {number|null} km
 * @returns {{index: number, label: string|null, maxKm: number}|null} null when
 *   `km` is unknown — callers MUST sort that last, not treat it as band 0.
 */
export const bandFor = (km) => {
  if (km === null || km === undefined || !Number.isFinite(km) || km < 0) return null;
  const index = DISTANCE_BANDS.findIndex((b) => km <= b.maxKm);
  if (index === -1) return null;
  return { index, label: DISTANCE_BANDS[index].label, maxKm: DISTANCE_BANDS[index].maxKm };
};

/**
 * Resolve a band INDEX back to its label.
 *
 * The deck sorts in Mongo by a bucket index rather than by a distance, because
 * sorting by a computed distance would put `null` first (nulls sort before
 * numbers in Mongo) and would also leak a precise distance across the sort
 * boundary. Only the index crosses back into JavaScript, so this is the inverse
 * of the ordering rather than a second way to compute a distance.
 *
 * @param {number} index
 * @returns {{index: number, label: string|null, maxKm: number}|null}
 */
export const bandFromIndex = (index) => {
  if (!Number.isInteger(index) || index < 0 || index >= DISTANCE_BANDS.length) return null;
  return { index, label: DISTANCE_BANDS[index].label, maxKm: DISTANCE_BANDS[index].maxKm };
};

/**
 * A user's location is usable for ranking only if it exists AND is fresh.
 *
 * @param {{currentLatLng?: number[], locationUpdatedAt?: Date|string}} user
 * @param {Date} [now]
 * @returns {boolean}
 */
export const isFreshLocation = (user, now = new Date()) => {
  if (!user) return false;
  if (!sanitizeLatLng(user.currentLatLng)) return false;
  if (!user.locationUpdatedAt) return false;
  const at = user.locationUpdatedAt instanceof Date
    ? user.locationUpdatedAt
    : new Date(user.locationUpdatedAt);
  if (Number.isNaN(at.getTime())) return false;
  const ageDays = (now.getTime() - at.getTime()) / 86_400_000;
  return ageDays <= LOCATION_TTL_DAYS;
};

/**
 * Convenience: the band between a viewer and a candidate, or null.
 *
 * The single call the deck needs, so the "unknown sorts last" rule is applied in
 * one place rather than at every call site.
 *
 * @returns {{index: number, label: string|null, maxKm: number}|null}
 */
export const bandBetween = (viewer, viewerPoint, candidatePoint, now = new Date()) => {
  if (!isFreshLocation(viewer, now)) return null;
  const km = haversineKm(viewerPoint, candidatePoint);
  return bandFor(km);
};

```

### ./server/utils/ladder.js

```
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
```

