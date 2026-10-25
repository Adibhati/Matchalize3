import { readLocationOnce } from './geolocation.js';
import { api } from './api';

/**
 * 📍 REFRESH THE STORED POSITION FOR USERS WHO CHOSE CURRENT LOCATION.
 *
 * ── WHY THIS EXISTS ────────────────────────────────────────────────────────
 * Location is otherwise written once and then read for 30 days. That is fine
 * until someone travels: a student who goes home for a summer break keeps being
 * ranked, and shown to others, as though they were still standing on campus. The
 * 30-day expiry eventually corrects it, but for up to a month the deck is
 * confidently wrong — and that is exactly the case location was added for.
 *
 * ── WHY IT IS NOT "TRACKING" ───────────────────────────────────────────────
 * One reading when the Deck opens, and after it returns from at least five
 * minutes in the background, compared server-side against what is already stored.
 * This only runs when the saved preference is GPS and the browser already reports
 * geolocation permission as granted; it never triggers a permission prompt.
 * Nothing is watched while the app is closed, nothing is logged between readings,
 * and no history is kept. There is no `watchPosition` anywhere in this codebase.
 *
 * The browser does not notify us of movement on its own; a page that has been
 * closed for an hour cannot know it moved. A one-shot reading at these deliberate
 * return points is the option that avoids continuous tracking.
 *
 * ── WHY IT IS SILENT ───────────────────────────────────────────────────────
 * No prompt, no toast, no navigation. The user opened the app to see people, not
 * to manage a permission they already granted. The server decides whether the
 * move was significant and rebuilds the deck if so; the client only learns about
 * it afterwards, and shows a brief line if anything changed.
 *
 * ── WHY IT BAILS OUT QUIETLY ───────────────────────────────────────────────
 * A denied permission, an insecure origin and a timeout are all ordinary, and all
 * of them mean "we don't know where you are" — never "your deck is wrong". Every
 * failure path returns silently. Nothing here can throw into the render tree.
 *
 * ── WHY A LAPSED ONE-TIME GRANT IS NOT ACTED ON INSTANTLY ──────────────────
 * Chrome expires "Allow this time" after five minutes in a BACKGROUND TAB — not
 * on app close. If a lapse immediately discarded the stored position, someone who
 * switched tabs for six minutes would come back to a campus-ranked feed and a
 * toast telling them to allow location again. That punishes the more private
 * choice, and it would read as the app nagging rather than informing.
 *
 * The position is released on the next LAUNCH instead, which is the boundary
 * "allow this time" actually describes: usable for this visit, gone next time.
 */

/** Where the browser currently stands on geolocation for this origin. */
export const GEO_PERMISSION = {
  GRANTED: 'granted',
  DENIED: 'denied',
  PROMPT: 'prompt',
  UNSUPPORTED: 'unsupported',
};

export const LOCATION_PREFERENCE_UPDATED_EVENT = 'matchalize:location-preference-updated';

/**
 * Ask the browser what it currently permits.
 *
 * ⚠️ THIS IS THE ONLY SIGNAL THAT DISTINGUISHES THE TWO KINDS OF "NO".
 *
 * Chrome 116+ offers "Allow this time". While it is valid, that grant reports
 * `granted` — indistinguishable from a persistent one, and Chrome's own docs say
 * so explicitly. Once it lapses the state falls back to `prompt`, which is a
 * refusal never produces.
 *
 * So the pair (read failed, state is `prompt`) means exactly one thing: the user
 * said yes, briefly, and that brief window has closed. It is NOT a refusal, and
 * treating it as one silently upgrades a temporary permission into a permanent
 * loss — the user's stored position is kept for the full 30-day TTL and the feed
 * is ordered around a place they may have left a month ago.
 *
 * `denied` remains the only thing that counts as a real no.
 *
 * @returns {Promise<string|null>} a GEO_PERMISSION value, or null if the browser
 * does not expose the Permissions API for geolocation (older Safari). Callers
 * must treat null as "unknown", NOT as "denied" — guessing there is what
 * produces the over-read this function exists to avoid.
 */
export const readGeolocationPermission = async () => {
  if (typeof navigator === 'undefined' || !navigator.permissions?.query) return null;
  try {
    const status = await navigator.permissions.query({ name: 'geolocation' });
    return status?.state ?? null;
  } catch {
    /* Firefox raises for geolocation on some platforms. Unknown, not denied. */
    return null;
  }
};

/**
 * Subscribe to permission changes for the life of a subscription.
 *
 * ⚠️ NEEDED BECAUSE A ONE-TIME GRANT CAN LAPSE MID-SESSION.
 *
 * Chrome expires "Allow this time" when the tab has been in the background for
 * five minutes — long before the app is closed and long before the next launch.
 * Without this listener that lapse is invisible until the user reopens the app,
 * and their stored position keeps ranking their feed in the meantime.
 *
 * @param {(state: string) => void} onChange
 * @returns {() => void} unsubscribe
 */
export const watchGeolocationPermission = (onChange) => {
  if (typeof navigator === 'undefined' || !navigator.permissions?.query) return () => {};
  let cancelled = false;
  let status = null;

  navigator.permissions.query({ name: 'geolocation' })
    .then((s) => {
      if (cancelled || !s) return;
      status = s;
      s.onchange = () => {
        if (!cancelled && s.state) onChange(s.state);
      };
    })
    .catch(() => { /* unsupported; nothing to watch */ });

  return () => {
    cancelled = true;
    if (status) status.onchange = null;
  };
};
export const syncLocationIfPermitted = async () => {
  try {
    const permission = await readGeolocationPermission();
    if (permission !== GEO_PERMISSION.GRANTED) {
      return {
        ok: false,
        reason: permission === GEO_PERMISSION.DENIED ? 'denied' : 'not-granted',
        permission,
      };
    }

    /* `readLocationOnce` never rejects and never throws — every failure resolves
       to `{ok: false, reason}`. The try/catch here is for the network call
       below, which can. */
    const res = await readLocationOnce({ maxAge: 60 * 1000 });
    if (!res.ok) {
      /* 📍 SEPARATE "THEY SAID NO" FROM "THEY SAID YES, BRIEFLY".
       *
       * `err.code === 1` (denied) is returned for both, so a read that fails
       * with it tells us nothing about intent. The permission state does. Only
       * when the browser reports `prompt` — which a real refusal never produces —
       * was this a lapsed one-time grant.
       *
       * `prompt` is deliberately NOT acted on here. Clearing the position the
       * moment the grant lapses would fire the location toast at someone who
       * merely switched tabs for six minutes, which is nagging, not informing.
       * The lapse is recorded and the caller decides; the position is cleared on
       * the next launch instead, which is the boundary the user actually chose
       * when they tapped "allow this time". */
      if (res.reason === 'denied') {
        const state = await readGeolocationPermission();
        return { ok: false, reason: 'denied', permission: state, ephemeralExpired: state === GEO_PERMISSION.PROMPT };
      }
      return { ok: false, reason: res.reason };
    }

    const saved = await api.put('/users/location', { latLng: res.latLng, source: 'gps' });

    /* `moved` is the server's own comparison against the previously stored
       position, using the same 25km threshold it applies before discarding the
       saved deck. Trusting that rather than recomputing here means the client and
       the server can never disagree about whether the deck was rebuilt. */
    return { ok: true, moved: !!saved?.moved };
  } catch {
    /* Offline, server restarting, anything. Location is an optimisation; it must
       never be able to break the deck. */
    return { ok: false, reason: 'network' };
  }
};

/**
 * Give back a stored position that a one-time grant no longer covers.
 *
 * ⚠️ SEPARATE ENDPOINT ON PURPOSE. `PUT /users/location` with a null `latLng`
 * also carries the `moved` flag that decides whether the saved deck survives,
 * and that comparison is anchor-to-anchor (see routes/users.js). Reusing it here
 * would be correct for the deck but would also work — and that is the problem:
 * this must only ever run when a TEMPORARY grant lapsed, never as a side effect
 * of an ordinary refresh. A dedicated endpoint cannot be reached by accident.
 *
 * @returns {Promise<boolean>} true when a position was actually discarded
 */
export const releaseEphemeralLocation = async () => {
  try {
    const state = await readGeolocationPermission();
    /* Only act on the one state that means "yes, briefly, now over". `null`
       means the browser cannot tell us, and guessing in either direction is
       worse than leaving the position alone: keeping it risks a stale rank,
       clearing it risks undoing a valid persistent grant. */
    if (state !== GEO_PERMISSION.PROMPT) return false;
    await api.put('/users/location', { latLng: null, source: null, ephemeral: true });
    return true;
  } catch {
    return false;
  }
};
