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
