# Chunk 04 — Client App

> Matchalize · `client-app` · files 4 of 25 chunks · 3 file(s) · 19 KB · ~5,467 tokens
> Generated 2026-10-09 14:03.
> Paste-safe: within the 100 KB / ~29,257 token target.
>
> Contains:
> - `./client/src/App.jsx`
> - `./client/src/index.css`
> - `./client/src/main.jsx`

---
### ./client/src/App.jsx

```
import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './utils/AuthContext';
import { AppConfigProvider } from './utils/AppConfigContext';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import Splash from './pages/Splash.jsx';
import Admin from './pages/Admin.jsx';
import Waitlist from './pages/Waitlist.jsx';
import Auth from './pages/Auth.jsx';
import Onboarding from './pages/Onboarding.jsx';
import AppShell from './components/AppShell';
import ArchivalToast from './components/ArchivalToast.jsx';
import UiGallery from './components/UiGallery.jsx';
import { useIsDesktop } from './utils/useIsDesktop';

function AppInner() {
  const isDesktop = useIsDesktop();
  const { logout } = useAuth();
  const [screen, setScreen] = useState(() => {
    try {
      const suspended = JSON.parse(localStorage.getItem('matchalize_suspended') || 'null');
      if (suspended?.reason) return 'auth';
      const user = JSON.parse(localStorage.getItem('matchalize_user') || '{}');
      if (user && user._id) {
        return user.isOnboarded ? 'home' : 'onboarding';
      }
      return 'splash';
    } catch {
      return 'splash';
    }
  });

  // Admin check AFTER all hooks (Rules of Hooks)
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
    return <Admin />;
  }

  const handleSignOut = () => {
    // logout() now also clears the React Query cache and disconnects the socket,
    // so it is the single place sign-out happens — including Onboarding.jsx,
    // which previously called logout() with no teardown at all.
    logout();
    setScreen('splash');
  };

  return (
    <main style={{
      maxWidth: isDesktop ? '100%' : '430px',
      margin: '0 auto',
      height: '100dvh',
      maxHeight: '100dvh',
      backgroundColor: 'var(--surface-alt)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
      overscrollBehavior: 'none'
    }}>
      <AnimatePresence mode="wait">
        {screen === 'splash' && (
          <motion.div key="splash" initial={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.5 }}>
            <Splash onEnter={() => setScreen('auth')} />
          </motion.div>
        )}
        
        {screen === 'auth' && (
          <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }}>
            <Auth onSuccess={() => {
              const u = JSON.parse(localStorage.getItem('matchalize_user') || '{}');
              // A returning student whose annual check is due lands on the
              // re-verify step, not onboarding — they're already onboarded.
              setScreen(u.reverifyRequired ? 'reverify' : u.isOnboarded ? 'home' : 'onboarding');
            }} />
          </motion.div>
        )}

        {screen === 'reverify' && (
          <motion.div key="reverify" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <Auth onSuccess={() => setScreen('home')} reverifyOnly />
          </motion.div>
        )}
        
        {screen === 'onboarding' && (
          <motion.div key="onboarding" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }}>
            <AppConfigProvider>
              <Onboarding onComplete={() => setScreen('home')} />
            </AppConfigProvider>
          </motion.div>
        )}
        
        {screen === 'home' && (
          <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <AppConfigProvider>
              <AppShell onSignOut={handleSignOut} />
            </AppConfigProvider>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      refetchOnWindowFocus: false,
    },
  },
});

// Hands the QueryClient instance to AuthProvider so `logout()` can wipe the
// cache. Without this the previous user's matches/messages stayed in memory and
// were rendered to whoever signed in next on a shared device.
// Must stay INSIDE QueryClientProvider (it calls useQueryClient) and INSIDE
// AuthProvider (it calls useAuth).
const QueryClientBridge = () => {
  const queryClient = useQueryClient();
  const { registerQueryClient } = useAuth();
  useEffect(() => {
    registerQueryClient(queryClient);
  }, [queryClient, registerQueryClient]);
  return null;
};

function App() {
  // Public /waitlist route lives outside AuthProvider (no auth required)
  if (typeof window !== 'undefined' && window.location.pathname === '/waitlist') {
    return (
      <ErrorBoundary>
        <Waitlist />
      </ErrorBoundary>
    );
  }

  return (
    <AuthProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <QueryClientBridge />
          <AppInner />
          <ArchivalToast />
          {/* Dev-only notification gallery. Renders null in production builds. */}
          <UiGallery />
        </QueryClientProvider>
      </ErrorBoundary>
    </AuthProvider>
  );
}

export default App; 

```

### ./client/src/index.css

```
/* ==========================================
   MATCHALIZE: THE SUNLIT LIBRARY THEME
   ========================================== */

:root {
  color-scheme: light;

  /* The Ink & Paper Palette */
  --color-ink: #241f19;
  --color-faded-ink: #6f6758;
  --color-parchment: #faf6ec;
  --color-paper-white: #fffdf6;
  --color-leather: #6e4a2e;
  --color-leather-dark: #4a3120;
  --color-sepia-border: #cfc3aa;
  --color-wax-red: #8b1a1a;

  /* Semantic tokens — light (canonical) */
  --bg: #f4efe3;
  --desk: #e9e0cc;
  --paper: #faf6ec;
  --card: #fefbf3;
  --surface: #fffdf6;
  --surface-alt: #f3ede0;
  --surface-dim: #e7decb;

  --ink: #241f19;
  --ink-soft: #4e4638;
  --ink-muted: #6f6758;

  --line: #e3dac7;
  --line-dark: #cfc3aa;

  --accent: #6e4a2e;
  --accent-strong: #4a3120;
  --crimson: #8b1a1a;
  --crimson-strong: #5a0f1c;
  --gold: #dfbc7d;
  --gold-deep: #b08d57;
  --success: #22543d;
  --warning: #b46807;

  --neu-dark: #ded8cc;
  --neu-light: #ffffff;

  --wm-base: #4a3222;
  --tape: #e0d8c8;

  /* Alpha variants derived from base tokens */
  --line-90: color-mix(in srgb, var(--line-dark) 90%, transparent);
  --line-80: color-mix(in srgb, var(--line-dark) 80%, transparent);
  --line-70: color-mix(in srgb, var(--line-dark) 70%, transparent);
  --line-50: color-mix(in srgb, var(--line-dark) 50%, transparent);

  --wm-08: color-mix(in srgb, var(--wm-base) 8%, transparent);
  --wm-10: color-mix(in srgb, var(--wm-base) 10%, transparent);
  --wm-12: color-mix(in srgb, var(--wm-base) 12%, transparent);
  --wm-14: color-mix(in srgb, var(--wm-base) 14%, transparent);
  --wm-16: color-mix(in srgb, var(--wm-base) 16%, transparent);
  --wm-18: color-mix(in srgb, var(--wm-base) 18%, transparent);
  --wm-20: color-mix(in srgb, var(--wm-base) 20%, transparent);
  --wm-22: color-mix(in srgb, var(--wm-base) 22%, transparent);
  --wm-25: color-mix(in srgb, var(--wm-base) 25%, transparent);
  --wm-28: color-mix(in srgb, var(--wm-base) 28%, transparent);
  --wm-30: color-mix(in srgb, var(--wm-base) 30%, transparent);

  --accent-03: color-mix(in srgb, var(--accent) 3%, transparent);
  --accent-04: color-mix(in srgb, var(--accent) 4%, transparent);
  --accent-05: color-mix(in srgb, var(--accent) 5%, transparent);
  --accent-06: color-mix(in srgb, var(--accent) 6%, transparent);
  --accent-07: color-mix(in srgb, var(--accent) 7%, transparent);
  --accent-08: color-mix(in srgb, var(--accent) 8%, transparent);
  --accent-10: color-mix(in srgb, var(--accent) 10%, transparent);
  --accent-12: color-mix(in srgb, var(--accent) 12%, transparent);
  --accent-14: color-mix(in srgb, var(--accent) 14%, transparent);
  --accent-15: color-mix(in srgb, var(--accent) 15%, transparent);
  --accent-18: color-mix(in srgb, var(--accent) 18%, transparent);
  --accent-20: color-mix(in srgb, var(--accent) 20%, transparent);
  --accent-25: color-mix(in srgb, var(--accent) 25%, transparent);
  --accent-30: color-mix(in srgb, var(--accent) 30%, transparent);
  --accent-35: color-mix(in srgb, var(--accent) 35%, transparent);
  --accent-45: color-mix(in srgb, var(--accent) 45%, transparent);

  --crim-04: color-mix(in srgb, var(--crimson) 4%, transparent);
  --crim-05: color-mix(in srgb, var(--crimson) 5%, transparent);
  --crim-06: color-mix(in srgb, var(--crimson) 6%, transparent);
  --crim-08: color-mix(in srgb, var(--crimson) 8%, transparent);
  --crim-10: color-mix(in srgb, var(--crimson) 10%, transparent);
  --crim-12: color-mix(in srgb, var(--crimson) 12%, transparent);
  --crim-15: color-mix(in srgb, var(--crimson) 15%, transparent);
  --crim-18: color-mix(in srgb, var(--crimson) 18%, transparent);
  --crim-20: color-mix(in srgb, var(--crimson) 20%, transparent);
  --crim-25: color-mix(in srgb, var(--crimson) 25%, transparent);
  --crim-28: color-mix(in srgb, var(--crimson) 28%, transparent);
  --crim-30: color-mix(in srgb, var(--crimson) 30%, transparent);
  --crim-32: color-mix(in srgb, var(--crimson) 32%, transparent);
  --crim-35: color-mix(in srgb, var(--crimson) 35%, transparent);
  --crim-40: color-mix(in srgb, var(--crimson) 40%, transparent);
  --crim-50: color-mix(in srgb, var(--crimson) 50%, transparent);

  --paper-08: color-mix(in srgb, var(--paper) 8%, transparent);
  --paper-10: color-mix(in srgb, var(--paper) 10%, transparent);
  --paper-20: color-mix(in srgb, var(--paper) 20%, transparent);
  --paper-35: color-mix(in srgb, var(--paper) 35%, transparent);
  --paper-40: color-mix(in srgb, var(--paper) 40%, transparent);
  --paper-60: color-mix(in srgb, var(--paper) 60%, transparent);
  --paper-70: color-mix(in srgb, var(--paper) 70%, transparent);
  --paper-90: color-mix(in srgb, var(--paper) 90%, transparent);
  --paper-92: color-mix(in srgb, var(--paper) 92%, transparent);
  --paper-94: color-mix(in srgb, var(--paper) 94%, transparent);

  --tape-70: color-mix(in srgb, var(--tape) 70%, transparent);
  --tape-90: color-mix(in srgb, var(--tape) 90%, transparent);
  --tape-95: color-mix(in srgb, var(--tape) 95%, transparent);

  --ink-04: color-mix(in srgb, var(--ink) 4%, transparent);
  --ink-15: color-mix(in srgb, var(--ink) 15%, transparent);
  --ink-20: color-mix(in srgb, var(--ink) 20%, transparent);
  --ink-25: color-mix(in srgb, var(--ink) 25%, transparent);

  --success-08: color-mix(in srgb, var(--success) 8%, transparent);
  --gold-deep-35: color-mix(in srgb, var(--gold-deep) 35%, transparent);

  /* Typography */
  --font-heading: 'Playfair Display', serif;
  --font-handwriting: 'Dancing Script', cursive;
  --font-typewriter: 'Special Elite', cursive;
  --font-system: 'Inter', sans-serif;
}

/* ==========================================
   DARK PALETTES — night-reading modes
   warm  = sepia night (default dark)
   invert = literal RGB inversion
   neutral = standard gray
   ========================================== */
html[data-theme='warm'] {
  color-scheme: dark;
  --bg: #1a1512;
  --desk: #141110;
  --paper: #1e1a16;
  --card: #24201a;
  --surface: #2a251d;
  --surface-alt: #1d1914;
  --surface-dim: #363027;

  --ink: #f3ecdd;
  --ink-soft: #cdc2ad;
  --ink-muted: #9a907c;

  --line: #3a342b;
  --line-dark: #4f4836;

  --accent: #c99a63;
  --accent-strong: #8f6a3a;
  --crimson: #e05552;
  --crimson-strong: #b33434;
  --gold: #e2c68b;
  --gold-deep: #c8a15c;
  --success: #5fb577;
  --warning: #dbab47;

  --neu-dark: #0d0b09;
  --neu-light: #312c23;

  --wm-base: #000000;
  --tape: #3e382c;

  --color-parchment: #1e1a16;
  --color-ink: #f3ecdd;
}

html[data-theme='invert'] {
  color-scheme: dark;
  --bg: #0b101c;
  --desk: #161f33;
  --paper: #050913;
  --card: #01040c;
  --surface: #000209;
  --surface-alt: #0c121f;
  --surface-dim: #182134;

  --ink: #dbe0e6;
  --ink-soft: #b1b9c7;
  --ink-muted: #9098a7;

  --line: #1c2538;
  --line-dark: #303c55;

  --accent: #91b5d1;
  --accent-strong: #b5cedf;
  --crimson: #74e5e5;
  --crimson-strong: #a5f0e3;
  --gold: #204382;
  --gold-deep: #4f72a8;
  --success: #ddabc2;
  --warning: #4b97f8;

  --neu-dark: #212733;
  --neu-light: #000000;

  --wm-base: #b5cddd;
  --tape: #1f2737;

  --color-parchment: #050913;
  --color-ink: #dbe0e6;
}

html[data-theme='neutral'] {
  color-scheme: dark;
  --bg: #161513;
  --desk: #100f0e;
  --paper: #1b1a18;
  --card: #201f1c;
  --surface: #262522;
  --surface-alt: #1b1a18;
  --surface-dim: #2f2e2a;

  --ink: #f0efec;
  --ink-soft: #cdccc7;
  --ink-muted: #8e8d87;

  --line: #2f2e2a;
  --line-dark: #3f3d38;

  --accent: #e08a4e;
  --accent-strong: #a6602c;
  --crimson: #e23636;
  --crimson-strong: #b52a2a;
  --gold: #d9b45f;
  --gold-deep: #c9a13b;
  --success: #56b061;
  --warning: #d8a846;

  --neu-dark: #0b0b0b;
  --neu-light: #333333;

  --wm-base: #000000;
  --tape: #3f3d38;

  --color-parchment: #1b1a18;
  --color-ink: #f0efec;
}

html[data-theme='black'] {
  color-scheme: dark;
  --bg: #000000;
  --desk: #050505;
  --paper: #0a0a0a;
  --card: #121212;
  --surface: #161616;
  --surface-alt: #0c0c0c;
  --surface-dim: #222222;

  --ink: #f4f4f2;
  --ink-soft: #c4c4c0;
  --ink-muted: #858582;

  --line: #262626;
  --line-dark: #383838;

  --accent: #8b1a1a;
  --accent-strong: #6e1010;
  --crimson: #8b1a1a;
  --crimson-strong: #6e1010;
  --gold: #dfbc7d;
  --gold-deep: #b08d57;
  --success: #5fa574;
  --warning: #d39452;

  --neu-dark: #000000;
  --neu-light: #1e1e1e;

  --wm-base: #000000;
  --tape: #1f1f1f;

  --color-parchment: #0a0a0a;
  --color-ink: #f4f4f2;
}

/* Global Resets */
* {
  -webkit-tap-highlight-color: transparent;
  box-sizing: border-box;
}

/* Document lock — the app shell is exactly one viewport tall, so the page
   itself can never scroll or rubber-band. Without this, an overscroll that
   walks past the inner scrollers reaches the document and triggers iOS
   pull-to-refresh, dragging the whole site down. */
html, body {
  margin: 0;
  padding: 0;
  background-color: var(--color-parchment);
  color: var(--color-ink);
  font-family: var(--font-typewriter);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow: hidden;
  overscroll-behavior: none;
  position: fixed;
  inset: 0;
  width: 100%;
}

#root {
  height: 100%;
  overflow: hidden;
  overscroll-behavior: none;
}

h1, h2, h3 {
  font-family: var(--font-heading);
  color: var(--color-ink);
  margin: 0;
}

p, span, div {
  font-family: var(--font-typewriter);
}

/* The Book Frame (App Container) */
.app-container {
  max-width: 430px;
  margin: 0 auto;
  min-height: 100dvh;
  position: relative;
  background-color: var(--color-parchment);
  overflow: hidden;
}

/* Temporary Canvas Styling (To verify it works) */
.page-canvas {
  width: 100%;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: var(--color-parchment);
}

.vintage-title {
  font-size: 48px;
  font-weight: 700;
  color: var(--color-ink);
  letter-spacing: -1px;
}

.vintage-subtitle {
  font-size: 16px;
  color: var(--color-faded-ink);
  font-style: italic;
}

/* Hide scrollbars globally for app feel */
::-webkit-scrollbar {
  display: none;
}
* {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* Dark Mode Sun/Moon Switch — rounded rectangle, matching the app's button radius */
.switch {
  position: relative;
  display: inline-block;
  width: 66px;
  height: 36px;
  flex-shrink: 0;
}

.switch input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;
  cursor: pointer;
  z-index: 2;
}

.slider {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: var(--line-dark);
  border: 1px solid var(--line);
  border-radius: 12px;
  transition: background-color .3s ease, border-color .3s ease;
}

.slider:before {
  position: absolute;
  content: "";
  height: 26px;
  width: 26px;
  border-radius: 8px;
  left: 4px;
  bottom: 4px;
  z-index: 1;
  background-color: var(--paper);
  border: 1px solid var(--line-dark);
  transition: transform .3s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.switch .sun,
.switch .moon {
  position: absolute;
  top: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 0;
}

.switch .sun { left: 42px; transform: translateY(-50%); }
.switch .moon { left: 6px; transform: translateY(-50%); }

.switch .sun svg,
.switch .moon svg {
  width: 18px;
  height: 18px;
}

.switch .sun svg { fill: #cf8a2f; }
.switch .moon svg { fill: var(--ink-muted); }

input:checked + .slider {
  background-color: var(--accent-25);
  border-color: var(--accent-35);
}

input:checked + .slider:before {
  transform: translateX(30px);
}

/* Tactile press feedback for all plain (non-Framer-Motion) buttons.
   Framer Motion buttons override this via inline transforms, so they are unaffected. */
button { transition: transform 0.1s ease; }
button:active { transform: scale(0.98); }

/* ==========================================
   PERFORMANCE-OPTIMIZED ARCHIVAL ANIMATIONS
   ========================================== */

/* 1. Global Shimmer Engine for Skeletons */
.archival-skeleton::after,
.pc-skeleton-shimmer::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.4) 50%,
    transparent 100%
  );
  animation: skeleton-shimmer 1.8s cubic-bezier(0.2, 0.8, 0.2, 1) infinite;
  will-change: transform;
}

@keyframes skeleton-shimmer {
  0% { transform: translate3d(-100%, 0, 0); }
  100% { transform: translate3d(100%, 0, 0); }
}

@media (prefers-reduced-motion: reduce) {
  .archival-skeleton::after,
  .pc-skeleton-shimmer::after {
    animation: none !important;
    background: rgba(255, 255, 255, 0.2);
    transform: translate3d(0, 0, 0);
  }
}

/* 2. Cassette Tape Player Spin Mechanics */
.cassette-spool {
  transition: transform 0.2s linear;
}

.cassette-spool.playing {
  animation: cassetteSpin 2.5s linear infinite;
  will-change: transform;
}

@keyframes cassetteSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

```

### ./client/src/main.jsx

```
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react';
import './index.css'
import App from './App.jsx'
import { registerServiceWorker } from './utils/push';
import { applyThemeFromStorage } from './utils/theme';

applyThemeFromStorage();

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.2,
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if (import.meta.env.PROD) {
  registerServiceWorker();
}

```

