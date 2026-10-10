/**
 * 📍 ONE-SHOT COARSE LOCATION.
 *
 * ── THE RULES THIS FILE EXISTS TO ENFORCE ──────────────────────────────────
 *
 * 1. ONE READ, ON A USER GESTURE. `getCurrentPosition` is called from a button
 *    handler, never on mount. Browsers treat an unsolicited prompt as
 *    hostile and both Chrome and iOS degrade trust after a rejection, so asking
 *    automatically costs far more opt-ins than it ever gains.
 *
 * 2. NEVER `watchPosition`. There is no tracking, no background polling and no
 *    trail. The user's position is sampled once when they choose to share it and
 *    is refreshed only when they tap again.
 *
 * 3. NO HIGH ACCURACY. `enableHighAccuracy: false` — the coarse/network
 *    reading is accurate to a city block, which is all a 30km band needs, and it
 *    resolves faster and costs less battery.
 *
 * 4. THE PRECISE VALUE NEVER TRAVELS BACK. This module returns the browser's
 *    reading so it can be POSTed once; the SERVER rounds it to ~1.1km before
 *    storing. Rounding here instead would be cosmetic — the exact coordinates
 *    would still be in the request body and in any log that captures it.
 *
 * 5. DENIAL IS A NORMAL OUTCOME, NOT AN ERROR. Every failure path resolves to
 *    a reason string rather than throwing. Location is an optional ranking input;
 *    the deck works without it and falls back to campus-then-quality ordering.
 */

/** Why a read did not happen, for honest copy in the UI. */
export const LOCATION_UNAVAILABLE = {
  DENIED: 'denied',
  UNAVAILABLE: 'unavailable',
  TIMEOUT: 'timeout',
  INSECURE: 'insecure-context',
  UNSUPPORTED: 'unsupported',
};

/** Geolocation needs a secure context. localhost counts as one, so dev is fine. */
export const isLocationSupported = () =>
  typeof window !== 'undefined' && 'geolocation' in window.navigator;

/**
 * Read the position once.
 *
 * @param {object} [opts]
 * @param {number} [opts.timeout] ms before giving up
 * @param {number} [opts.maxAge] ms of cached position we will accept
 * @returns {Promise<{ok: true, latLng: [number, number]} | {ok: false, reason: string}>}
 */
export const readLocationOnce = ({
  timeout = 10000,
  maxAge = 5 * 60 * 1000,
} = {}) =>
  new Promise((resolve) => {
    if (!isLocationSupported()) {
      resolve({ ok: false, reason: LOCATION_UNAVAILABLE.UNSUPPORTED });
      return;
    }
    /* A non-secure origin fails in a way that is indistinguishable from a
       denial unless it is named explicitly — otherwise the copy says "you
       denied this" when the real cause is an http:// origin in production. */
    if (typeof window !== 'undefined' && window.isSecureContext === false) {
      resolve({ ok: false, reason: LOCATION_UNAVAILABLE.INSECURE });
      return;
    }

    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    window.navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos?.coords?.latitude;
        const lng = pos?.coords?.longitude;
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          finish({ ok: false, reason: LOCATION_UNAVAILABLE.UNAVAILABLE });
          return;
        }
        finish({ ok: true, latLng: [lat, lng] });
      },
      (err) => {
        const reason =
          err?.code === 1 ? LOCATION_UNAVAILABLE.DENIED
          : err?.code === 3 ? LOCATION_UNAVAILABLE.TIMEOUT
          : LOCATION_UNAVAILABLE.UNAVAILABLE;
        finish({ ok: false, reason });
      },
      {
        enableHighAccuracy: false,
        timeout,
        maximumAge: maxAge,
        /* No `watchPosition` counterpart, ever. See rule 2. */
      },
    );
  });
