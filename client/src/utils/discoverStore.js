const STORAGE_PREFIX = 'matchalize_discover_';
const MAX_BYTES = 4.5 * 1024 * 1024;

const store = {
  profiles: [],
  currentIndex: 0,
  hasMore: true,
};

let storageKey = null;

const persist = () => {
  if (!storageKey) return;
  try {
    const serialized = JSON.stringify({
      profiles: store.profiles,
      currentIndex: store.currentIndex,
      hasMore: store.hasMore,
    });
    if (serialized.length > MAX_BYTES) return;
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
      store.profiles = parsed.profiles;
      store.currentIndex = Math.max(0, Math.min(parsed.currentIndex || 0, parsed.profiles.length));
      store.hasMore = parsed.hasMore !== false;
      return store.profiles.length > 0;
    }
  } catch {
    // Corrupted cache → treat as empty.
  }
  return false;
};

const discoverStore = store;

const saveDiscoverStore = () => persist();

const resetDiscoverStore = () => {
  store.profiles = [];
  store.currentIndex = 0;
  store.hasMore = true;
  if (storageKey) {
    try { localStorage.removeItem(storageKey); } catch { /* ignore */ }
  }
};

export { discoverStore, initDiscoverStore, saveDiscoverStore, resetDiscoverStore };