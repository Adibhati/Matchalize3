export const THEME_STORAGE_KEY = 'matchalize:theme';
export const DARK_MOOD_KEY = 'matchalize:darkmood';
export const THEME_MODES = ['light', 'black'];

export function getThemePreference() {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && THEME_MODES.includes(stored)) return stored;
  } catch {
    /* ignore */
  }
  return null;
}

export function getDarkMood() {
  try {
    const stored = localStorage.getItem(DARK_MOOD_KEY);
    if (stored && THEME_MODES.includes(stored) && stored !== 'light') return stored;
  } catch {
    /* ignore */
  }
  return 'black';
}

export function setDarkMood(mode) {
  try {
    localStorage.setItem(DARK_MOOD_KEY, mode);
  } catch {
    /* ignore */
  }
}

export function applyThemeFromStorage() {
  /* The toggle is the ONLY thing that picks a theme — the OS appearance is
     never consulted, so the app cannot drift into dark mode on its own. */
  const want = getThemePreference() || 'light';
  setThemePreference(want);
  return want;
}

export function setThemePreference(mode) {
  const root = typeof document !== 'undefined' ? document.documentElement : null;
  if (!root) return mode;
  if (mode === 'light') {
    delete root.dataset.theme;
  } else {
    root.dataset.theme = mode;
  }
  try {
    /* Both modes are persisted, including light — deleting the key would hand
       the decision back to the OS on the next launch. */
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
  return mode;
}