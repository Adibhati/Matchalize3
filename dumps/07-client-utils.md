# Chunk 07 — Client Utils

> Matchalize · `client-utils` · files 7 of 27 chunks · 15 file(s) · 39 KB · ~11,524 tokens
> Generated 2026-10-17 21:10.
> Paste-safe: within the 100 KB / ~29,257 token target.
>
> Contains:
> - `./client/src/utils/AppConfigContext.jsx`
> - `./client/src/utils/AuthContext.jsx`
> - `./client/src/utils/api.js`
> - `./client/src/utils/chrome.js`
> - `./client/src/utils/deckChrome.js`
> - `./client/src/utils/discoverStore.js`
> - `./client/src/utils/geolocation.js`
> - `./client/src/utils/haptics.js`
> - `./client/src/utils/locationSync.js`
> - `./client/src/utils/promptLimits.js`
> - `./client/src/utils/push.js`
> - `./client/src/utils/shuffle.js`
> - `./client/src/utils/socket.js`
> - `./client/src/utils/toast.js`
> - `./client/src/utils/useIsDesktop.js`

---
### ./client/src/utils/AppConfigContext.jsx

```
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { api } from './api';
import neu from '../styles/neu';

const design = neu;

const AppConfigContext = createContext(null);

export const useAppConfig = () => useContext(AppConfigContext);

export const AppConfigProvider = ({ children }) => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const data = await api.get('/config');
        setConfig(data);
      } catch (err) {
        console.error('Failed to load app config:', err);
        setError(err.message);
      } finally {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        setLoading(false);
      }
    };
    
    fetchConfig();
    
    // Timeout after 10 seconds
    timeoutRef.current = setTimeout(() => {
      if (loading) {
        setError('Config load timed out');
        setLoading(false);
      }
    }, 10000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!config && loading) {
    return (
      <div style={{
        width: '100%', height: '100%', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: '#000', color: '#fff',
        fontFamily: 'Geist, sans-serif', fontSize: '14px',
      }}>
        Loading...
      </div>
    );
  }

  if (!config && error) {
    return (
      <div style={{
        width: '100%', height: '100%', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: '16px',
        background: '#000', color: '#fff',
        fontFamily: 'Geist, sans-serif', fontSize: '14px',
        padding: '24px', textAlign: 'center',
      }}>
        <span>Failed to load application config.</span>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 24px', borderRadius: design.radius.md,
            border: '1px solid rgba(249,115,22,0.3)',
            background: 'rgba(249,115,22,0.1)',
            color: '#f97316', cursor: 'pointer',
            fontWeight: '600', fontFamily: 'Geist, sans-serif',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <AppConfigContext.Provider value={config}>
      {children}
    </AppConfigContext.Provider>
  );
};

```

### ./client/src/utils/AuthContext.jsx

```
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { api, API_BASE } from './api';
import socket from './socket';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

const USER_KEY = 'matchalize_user';

function loadInitialState() {
  try {
    const userRaw = localStorage.getItem(USER_KEY);
    if (userRaw) {
      // Same normalisation as `login` — see the comment there. A cached user
      // written before annual re-verification existed has no reverifyRequired
      // key, and "undefined" must not be read as "needs re-verifying".
      return { user: { reverifyRequired: false, ...JSON.parse(userRaw) } };
    }
  } catch {}
  return { user: null };
}

export const AuthProvider = ({ children }) => {
  const [state, setState] = useState(loadInitialState());

  // Populated at app boot (main.jsx / App.jsx) so logout() can tear down
  // everything this user left behind without AuthProvider importing React Query
  // and creating a circular dependency.
  const queryClientRef = useRef(null);
  const registerQueryClient = useCallback((client) => {
    queryClientRef.current = client;
  }, []);

  const isAuthenticated = !!state.user;

  const login = useCallback((user) => {
    /* Default the annual re-check flag rather than leaving it undefined.
       A user persisted in localStorage before this field existed has no such
       property, so anything reading `user.reverifyRequired` would see
       undefined. Defaulting to false here means "not due" rather than "unknown",
       which is the safe direction: it can never misroute a legitimate returning
       user into a re-verify loop they can't pass. */
    const normalised = { reverifyRequired: false, ...user };
    localStorage.setItem(USER_KEY, JSON.stringify(normalised));
    setState({ user: normalised });
  }, []);

  /**
   * 🔒 LOGOUT MUST ERASE EVERYTHING, NOT JUST THE ID CARD.
   *
   * This used to only clear localStorage and the auth cookie. The React Query
   * cache survived, and its keys carry no user scope — `['matches']` in
   * AppShell.jsx and Matches.jsx, `['unread-notifications-count']` in Header.jsx.
   * With a 30s–2min `staleTime`, whoever signed in next on a shared device was
   * served the PREVIOUS user's matches, messages and unread badge straight from
   * cache, with no network request and no server check. The socket also stayed
   * connected, so inbound chat and notification frames for the old account kept
   * arriving.
   *
   * Clearing here rather than at each call site also fixes Onboarding.jsx, which
   * called `logout()` bare with no socket teardown at all.
   */
  const logout = useCallback(() => {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('matchalize_suspended');

    // Drop every cached response — matches, messages, profile, unread counts.
    queryClientRef.current?.clear();

    // Close the chat socket so no further frames for the old session land.
    try {
      socket?.disconnect();
    } catch {}

    setState({ user: null });

    // Clear httpOnly cookie server-side
    fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {});
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const fresh = await api.get('/auth/me');
      localStorage.setItem(USER_KEY, JSON.stringify(fresh));
      setState({ user: fresh });
      return fresh;
    } catch {
      return null;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ user: state.user, isAuthenticated, login, logout, refreshUser, registerQueryClient }}
    >
      {children}
    </AuthContext.Provider>
  );
};
```

### ./client/src/utils/api.js

```
import { toast } from './toast';

const apiHostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const API_PORT = import.meta.env.VITE_API_PORT || '5005';
const isLocalhost = apiHostname === 'localhost' || apiHostname === '127.0.0.1';
const isPrivateIP = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(apiHostname);
const isDev = isLocalhost || isPrivateIP;

export const API_BASE = import.meta.env.VITE_API_URL || (isDev ? `http://${apiHostname}:${API_PORT}` : window.location.origin);
const BASE_URL = `${API_BASE}/api`;
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_BASE;

const fail = (message, extra) => {
  const e = new Error(message);
  e.toasted = true;
  if (extra) Object.assign(e, extra);
  return e;
};

const handleResponse = async (response) => {
  if (response.status === 401) {
    const errorData = await response.json().catch(() => ({}));
    localStorage.removeItem('matchalize_user');
    if (typeof window !== 'undefined' && window.location.pathname !== '/auth') {
      window.location.href = '/auth';
    }
    throw fail(errorData.message || 'Session expired. Please log in again.');
  }

  if (response.status === 403) {
    const errorData = await response.json().catch(() => ({}));

    if (errorData.suspended) {
      // No toast here (G1): the hard navigation to /auth tears React down, so a
      // toast could never survive it. Auth.jsx reads `matchalize_suspended` and
      // swaps to the full-screen AccountSuspendedScreen, which does the job.
      localStorage.removeItem('matchalize_user');
      localStorage.setItem('matchalize_suspended', JSON.stringify({
        reason: errorData.reason || 'Account suspended',
        suspendedAt: new Date().toISOString(),
      }));
      if (typeof window !== 'undefined' && window.location.pathname !== '/auth') {
        window.location.href = '/auth';
      }
      throw fail(errorData.message || 'Account suspended');
    }

    if (errorData.deleted) {
      localStorage.removeItem('matchalize_user');
      if (typeof window !== 'undefined' && window.location.pathname !== '/auth') {
        window.location.href = '/auth';
      }
      throw fail(errorData.message || 'Account deleted');
    }

    // Deck/profile gate. Never toasted centrally: the call site owns the copy
    // (G10/G11) and needs `code` to know it may replay the action once the gate
    // resolves. Previously this threw with no `code`, so Discover's recovery
    // branch (which read `err.response.data.code`) never matched and the action
    // failed silently.
    if (errorData.code === 'GATED') {
      throw fail(errorData.message || 'Action not allowed.', { code: 'GATED' });
    }

    // Directional block (G2c): you blocked them — state the rule and offer a way
    // out. The server sends the blocked user's id so the Unblock button can act.
    if (errorData.code === 'YOU_BLOCKED') {
      const message = errorData.message || "You can't message someone you've blocked.";
      toast.error(message, {
        label: 'Unblock',
        onClick: () => api.delete(`/report/block/${errorData.blockedUserId}`).catch(() => {}),
      }, { icon: 'Ban' });
      throw fail(message, { code: 'YOU_BLOCKED', blockedUserId: errorData.blockedUserId });
    }

    // Their chat/alignment is gone (G2b). Reveal nothing if they blocked you
    // (G2d reuses this same code so a blockeé can't confirm a block).
    if (errorData.code === 'CONVERSATION_GONE') {
      const message = errorData.message || 'This conversation is no longer available.';
      toast.error(message, undefined, { icon: 'MessageSquareOff' });
      throw fail(message, { code: 'CONVERSATION_GONE' });
    }

    const message = errorData.message || 'Something went wrong. Please try again.';
    toast.error(message);
    throw fail(message);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    let errorMessage = data.message || 'Something went wrong. Please try again.';
    let icon = undefined;

    if (response.status >= 500) {
      errorMessage = 'Our side had a problem. Try again in a moment.';
      icon = 'Server';
    }

    toast.error(errorMessage, undefined, { icon });
    throw fail(errorMessage, { code: data.code });
  }
  return data;
};

export const api = {
  get: async (path) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'GET',
      credentials: 'include',
    });
    return handleResponse(res);
  },
  post: async (path, body) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },
  put: async (path, body) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },
  delete: async (path) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    return handleResponse(res);
  },
  upload: async (file, { signal } = {}) => {
    const formData = new FormData();
    formData.append('photo', file);
    const res = await fetch(`${API_BASE}/api/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
      signal,
    });
    return handleResponse(res);
  },
};
```

### ./client/src/utils/chrome.js

```
import { useEffect } from 'react';

/**
 * 📱 BROWSER CHROME COLOUR.
 *
 * On a phone the app does not fill the screen. There is a status bar above it
 * and, on iOS, a home-indicator strip below — these belong to the BROWSER, not
 * the page, but the browser paints them using colours the page supplies:
 *
 *   • `<meta name="theme-color">` — Android Chrome, and the iOS home screen
 *     when installed to the dock. Must be a REAL `<meta name="theme-color">`
 *     element; updating it means writing the `content` attribute, since the
 *     value is not reflected and React will not re-render it.
 *   • the root element's background — everything else, including the rubber-band
 *     area you briefly see when overscrolling past the top of the page.
 *
 * iOS deliberately does NOT recolour the top status bar from theme-color in the
 * browser. That is a platform behaviour, not a bug, and it is why
 * `black-translucent` in index.html matters: it lets the page's own background
 * paint under the status bar, which is the only way the top edge can match.
 *
 * WHY THIS IS A HOOK AND NOT A PROP ON A COMPONENT: the colour follows the
 * ACTIVE SCREEN, and the screen is component state in App.jsx — there is no
 * router, so there is no route change to hang an effect on. A hook called
 * once at the shell, keyed on the active tab, is the only place that knows.
 */

/**
 * Set the browser chrome colour and leave it there.
 *
 * @param {string} color CSS colour, e.g. '#131313'
 */
export const setChromeColor = (color) => {
  if (typeof document === 'undefined' || !color) return;

  // Android Chrome + installed-PWA title bar.
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', color);

  // The overscroll gutter. Setting this on the ROOT — not the body — is what
  // covers the area above and below the page: the body's background propagates
  // to the canvas, but only the root element's covers the rubber-band region.
  document.documentElement.style.backgroundColor = color;
};

/**
 * React binding for {@link setChromeColor}.
 *
 * Also publishes the colour as `--app-bg` so any element can reference it
 * without importing this module.
 *
 * @param {string} color
 */
export const useChromeColor = (color) => {
  useEffect(() => {
    if (!color) return;
    setChromeColor(color);
    document.documentElement.style.setProperty('--app-bg', color);
  }, [color]);
};

export default useChromeColor;
```

### ./client/src/utils/deckChrome.js

```
/**
 * Deck chrome — geometry shared by everything that pins itself to the top of
 * the viewport on the Deck: the Header's floating row and the deck actions.
 *
 * These numbers were previously hand-copied between Header.jsx and
 * ProfileCard.jsx with only a comment keeping them honest, which is how the ×
 * and the bell drifted apart. Keep one source of truth.
 */

/** Distance from the viewport top, respecting the notch. */
export const DECK_TOP = 'max(12px, env(safe-area-inset-top, 0px))';

/** Distance from the viewport's left/right edges. */
export const DECK_EDGE = '12px';

/** Square size of a top-row control. Shared by the bell, the gear and the ×. */
export const DECK_BTN = 42;

/** Matches Header.jsx's floating row so the × and the bell share a baseline. */
export const deckRowStyle = {
  position: 'fixed',
  top: DECK_TOP,
  left: DECK_EDGE,
  right: DECK_EDGE,
  display: 'grid',
  gridTemplateColumns: '1fr auto 1fr',
  alignItems: 'center',
  pointerEvents: 'none',
};

/**
 * Where page content must start on the non-Deck tabs so it clears the floating
 * row instead of sliding underneath it. Derived from the two constants above
 * rather than hard-coded, so moving the row can never re-introduce the overlap:
 * row top + control height + a little breathing room.
 */
export const DECK_CONTENT_TOP = `calc(${DECK_TOP} + ${DECK_BTN}px + 14px)`;

```

### ./client/src/utils/discoverStore.js

```
const STORAGE_PREFIX = 'matchalize_discover_';
const MAX_BYTES = 4.5 * 1024 * 1024;

const store = {
  profiles: [],
  currentIndex: 0,
  hasMore: true,
};

let storageKey = null;
let warnedHighWaterMark = false;

const persist = () => {
  if (!storageKey) return;
  try {
    const serialized = JSON.stringify({
      profiles: store.profiles,
      currentIndex: store.currentIndex,
      hasMore: store.hasMore,
      savedAt: Date.now(),
    });
    if (serialized.length > MAX_BYTES) {
      if (!warnedHighWaterMark) {
        warnedHighWaterMark = true;
        console.warn(`[discoverStore] Deck exceeded ${MAX_BYTES / (1024 * 1024)}MB — skipping persistence (in-memory copy kept).`);
      }
      return;
    }
    localStorage.setItem(storageKey, serialized);
  } catch {
    // Storage full or unavailable → keep the in-memory copy only.
  }
};

/**
 * Bind the persisted deck to a user and hydrate from localStorage.
 * Returns true if a usable deck was restored.
 */
const initDiscoverStore = (userId) => {
  if (!userId) return false;
  const key = `${STORAGE_PREFIX}${userId}`;
  if (storageKey === key) return store.profiles.length > 0;

  storageKey = key;
  store.profiles = [];
  store.currentIndex = 0;
  store.hasMore = true;

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.profiles)) {
      const idx = parsed.currentIndex || 0;
      const fresh = Date.now() - (parsed.savedAt || 0) < 30 * 60 * 1000;
      if (fresh && idx < parsed.profiles.length) {
        store.profiles = parsed.profiles;
        store.currentIndex = idx;
        store.hasMore = parsed.hasMore !== false;
        return store.profiles.length > 0;
      }
      localStorage.removeItem(key);
    }
  } catch {
    // Corrupted cache → treat as empty.
  }
  return false;
};

const discoverStore = store;

const saveDiscoverStore = () => persist();

/* ══════════════════════════════════════════════════════════════════════════
   DECK SCOPE — "everyone" vs "my campus only".

   ⚠️ DELIBERATELY NOT IN THE DECK CACHE ABOVE.

   `resetDiscoverStore()` DELETES the cache key outright, and every non-append
   refetch calls it — including the refetch that flipping this toggle itself
   triggers. Storing the scope in `store` would mean tapping the chip wiped the
   setting you just chose, on every tap.

   So it lives under its own key. The two have genuinely different lifetimes:
   the deck cache is disposable (a list of cards and an index).

   The scope preference that used to live here — "My campus" vs "Everyone" — is
   gone. It keyed two independent frozen orders per user, which meant a returning
   user accumulated dead sessions and a card seen in one view was blocked in the
   other. There is one feed now, and the deck cache is the only thing stored.
   ══════════════════════════════════════════════════════════════════════════ */

const resetDiscoverStore = () => {
  store.profiles = [];
  store.currentIndex = 0;
  store.hasMore = true;
  if (storageKey) {
    try { localStorage.removeItem(storageKey); } catch { /* ignore */ }
  }
};

export { discoverStore, initDiscoverStore, saveDiscoverStore, resetDiscoverStore };
```

### ./client/src/utils/geolocation.js

```
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

```

### ./client/src/utils/haptics.js

```
/**
 * src/utils/haptics.js
 * A safe wrapper for the native Navigator.vibrate API.
 */

export const triggerHaptic = (style = 'light') => {
  // Defensive check: Ensure we are in a browser environment and the API is supported
  if (typeof window === 'undefined' || !window.navigator || !window.navigator.vibrate) {
    return;
  }

  try {
    switch (style) {
      case 'light':
        // A subtle, quick tap (e.g., opening a menu, switching tabs)
        window.navigator.vibrate(10);
        break;
      case 'medium':
        // A standard confirmation tap (e.g., sending a message, advancing a step)
        window.navigator.vibrate(30);
        break;
      case 'heavy':
        // A stronger, definitive thud (e.g., destructive actions, errors, successful match)
        window.navigator.vibrate(50);
        break;
      case 'success':
        // A short double-pulse confirmation (e.g., photo uploaded, seal affixed)
        window.navigator.vibrate([15, 40, 25]);
        break;
      default:
        window.navigator.vibrate(10);
    }
  } catch (error) {
    // Silently catch any permission or hardware constraint errors
    console.warn('Haptics blocked or unsupported by device context.');
  }
};

```

### ./client/src/utils/locationSync.js

```
import { readLocationOnce } from './geolocation.js';
import { api } from './api';

/**
 * 📍 REFRESH THE STORED POSITION WHEN THE APP OPENS.
 *
 * ── WHY THIS EXISTS ────────────────────────────────────────────────────────
 * Location is otherwise written once and then read for 30 days. That is fine
 * until someone travels: a student who goes home for a summer break keeps being
 * ranked, and shown to others, as though they were still standing on campus. The
 * 30-day expiry eventually corrects it, but for up to a month the deck is
 * confidently wrong — and that is exactly the case location was added for.
 *
 * ── WHY IT IS NOT "TRACKING" ───────────────────────────────────────────────
 * ONE reading, each time the app is opened, compared server-side against what is
 * already stored. Nothing is watched while the app is closed, nothing is logged
 * between openings, and no history is kept. There is no `watchPosition` anywhere
 * in this codebase and there must never be one.
 *
 * The browser does not notify us of movement on its own; a page that has been
 * closed for an hour cannot know it moved. Re-reading on open is the only honest
 * option that does not involve continuous tracking.
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

```

### ./client/src/utils/promptLimits.js

```
/**
 * 📏 PROMPT LENGTH LIMITS
 *
 * Single source of truth on the client for the prompt question/answer caps.
 *
 * ⚠️ Must stay in sync with:
 *   - PROMPT_LIMITS in server/routes/users.js  (returns a legible 400)
 *   - prompts[].maxlength in server/models/User.js  (schema backstop)
 *
 * The textarea `maxLength` alone isn't enough — a client can always be bypassed,
 * which is why the server enforces the same numbers and rejects with 400 rather
 * than letting a Mongoose ValidationError become a 500.
 *
 * 300 is ~3x the longest prompt answer ever written in practice (97 chars across
 * 382 seeded answers) and renders as ~3 lines on a profile card.
 */
export const PROMPT_ANSWER_MAX = 300;
export const PROMPT_QUESTION_MAX = 200;
```

### ./client/src/utils/push.js

```
import { api } from './api';

let registration = null;

export const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return null;
  }

  try {
    registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    console.log('Service Worker registered');
    return registration;
  } catch (error) {
    console.error('SW registration failed:', error);
    return null;
  }
};

export const subscribeToPush = async () => {
  if (!registration) {
    registration = await registerServiceWorker();
  }
  if (!registration) return null;

  try {
    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();
    if (subscription) return subscription;

    // Get VAPID key
    const { publicKey } = await api.get('/notifications/vapid-key');
    if (!publicKey) return null;

    // Convert VAPID key
    const applicationServerKey = urlBase64ToUint8Array(publicKey);

    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });

    // Save subscription to server
    await api.post('/notifications/subscribe', { subscription });

    return subscription;
  } catch (error) {
    console.error('Push subscription failed:', error);
    return null;
  }
};

export const unsubscribeFromPush = async () => {
  if (!registration) return;

  try {
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      await api.delete('/notifications/subscribe');
    }
  } catch (error) {
    console.error('Push unsubscribe failed:', error);
  }
};

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

```

### ./client/src/utils/shuffle.js

```
/**
 * Unbiased shuffle — Fisher-Yates.
 *
 * WHY NOT `.sort(() => Math.random() - 0.5)`: that comparator is inconsistent
 * (it never returns 0 for equal elements, so engines are free to treat it as
 * arbitrary) and it is measurably biased — middle elements get more chances to
 * land in the middle. For a 10-card batch the skew is small but it is real, and
 * the cost of doing this correctly is four lines.
 *
 * WHY A COPY: the caller keeps the original. `sort` mutates in place, and the
 * array passed in belongs to the API response, which is also the thing we log
 * and store.
 *
 * @template T
 * @param {T[]} items
 * @returns {T[]} a new array, same members, any order
 */
const shuffle = (items) => {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

export default shuffle;
```

### ./client/src/utils/socket.js

```
import { io } from 'socket.io-client';
import { SOCKET_URL } from './api';

const socket = io(SOCKET_URL, {
  withCredentials: true,
  // Deliberately NOT `transports: ['websocket']`. Pinning websocket-only removes
  // the HTTP long-polling fallback, so when the server isn't reachable the
  // connection fails outright with no retry path — which is what produced the
  // ERR_CONNECTION_REFUSED cascade in the console. Letting socket.io pick
  // (polling first, upgrade to websocket) makes it recover on its own.
});

// When admin suspends a user or per-event middleware catches them
socket.on('force-disconnect', ({ reason }) => {
  const reasonText = reason || 'Account suspended';

  // Only persist the suspension lockout for real suspensions.
  // Admin "kick" sends 'Admin forced disconnect' — don't falsely lock them out.
  const isSuspension = /suspend/i.test(reasonText);
  if (isSuspension) {
    localStorage.setItem('matchalize_suspended', JSON.stringify({
      reason: reasonText,
      suspendedAt: new Date().toISOString(),
    }));
  }

  socket.disconnect();
  window.location.href = '/auth';
});

export default socket;

```

### ./client/src/utils/toast.js

```
import React from 'react';

let toastCallback = null;
let presenceCallback = null;
const presenceCallbacks = new Set();

export const setToastHandler = (callback) => {
  toastCallback = callback;
};

export const setToastPresenceHandler = (callback) => {
  presenceCallback = callback;
};

export const useToastPresence = () => {
  const [toastUp, setToastUp] = React.useState(false);
  React.useEffect(() => {
    presenceCallbacks.add(setToastUp);
    return () => presenceCallbacks.delete(setToastUp);
  }, []);
  return toastUp;
};

const notifyPresence = (up) => {
  if (presenceCallback) presenceCallback(up);
  presenceCallbacks.forEach((cb) => cb(up));
};

export const clearToastPresence = () => {
  notifyPresence(false);
};

const emit = (type, message, action, opts) => {
  if (toastCallback) toastCallback({ type, message, action, opts });
  notifyPresence(true);
};

export const toast = {
  success: (message, action, opts) => emit('success', message, action, opts),
  error: (message, action, opts) => emit('error', message, action, opts),
  info: (message, action, opts) => emit('info', message, action, opts),
};
```

### ./client/src/utils/useIsDesktop.js

```
import { useState, useEffect } from 'react';

// 768px is the standard breakpoint where we switch from mobile to desktop layouts
const DESKTOP_BREAKPOINT = 768; 

export const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= DESKTOP_BREAKPOINT : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT);
    };

    // Set initial value
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isDesktop;
};

```

