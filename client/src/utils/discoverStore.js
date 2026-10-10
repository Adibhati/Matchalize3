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