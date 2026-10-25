# Chunk 05 — Client App

> Matchalize · `client-app` · files 5 of 28 chunks · 3 file(s) · 15 KB · ~4,319 tokens
> Generated 2026-10-18 20:29.
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
import Auth from './pages/Auth.jsx';
import Onboarding from './pages/Onboarding.jsx';
import AppShell from './components/AppShell';
import ArchivalToast from './components/ArchivalToast.jsx';
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
      height: screen === 'splash' ? 'auto' : '100dvh',
      maxHeight: screen === 'splash' ? 'none' : '100dvh',
      backgroundColor: 'var(--surface-alt)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: screen === 'splash' ? 'visible' : 'hidden',
      overscrollBehavior: screen === 'splash' ? 'auto' : 'none'
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
  // 🗑️ The public /waitlist route is gone. During the IIT Bombay pilot the
  // gate is the invite list, not a queue: colleagues are added directly, so a
  // public sign-up page would only collect addresses the pilot cannot serve.
  // The route, its API, and its model were removed rather than hidden — see
  // git history if a staged launch ever needs them back.

  return (
    <AuthProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <QueryClientBridge />
          <AppInner />
          <ArchivalToast />
        </QueryClientProvider>
      </ErrorBoundary>
    </AuthProvider>
  );
}

export default App; 

```

### ./client/src/index.css

```
/* Global Resets */
* {
  -webkit-tap-highlight-color: transparent;
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  background-color: var(--n-paper);
  color: var(--n-ink);
  font-family: var(--n-font-mono);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ═══════════════════════════════════════════════════════════════════
   THE PAGE MUST NOT SCROLL. THE APP MUST.
   ═══════════════════════════════════════════════════════════════════

   Symptom this fixes: on a phone, dragging anywhere on the Deck drags the
   WHOLE page — header, nav bar and all — instead of moving the card deck
   underneath them. It reads as the app itself being scrollable, which it is
   not: every screen scrolls its own inner `overflow-y: auto` container.

   Three properties, each covering a different browser behaviour, and none of
   them is sufficient alone:

   1. `overscroll-behavior: none` on html — stops the RUBBER BAND. Without it,
      dragging past the top of the page stretches it, reveals the page behind,
      and on Android triggers the pull-to-refresh spinner. This is the
      pull-to-refresh half of the bug.

   2. `position: fixed; inset: 0` on body — makes the document itself
      unscrollable. `overscroll-behavior` alone still lets the page scroll if it
      is taller than the viewport, which it is during page transitions. Because
      every screen scrolls an inner container rather than the document, this
      removes nothing the user can see.

   3. `touch-action: manipulation` — drops the ~300ms double-tap-to-zoom delay
      without disabling pinch-zoom, which `touch-action: none` would do and
      which would break zooming for anyone who needs it.

   `height: 100%` is deliberately NOT used. The dynamic viewport height is what
   makes this correct when the on-screen keyboard opens or a sheet slides up:
   `100dvh` follows the real visible area, whereas `100%` resolves against the
   html element and can leave a dead strip that is not scrollable.

   The background is `var(--app-bg, var(--n-paper))` so the area above and below
   the app is painted by the active screen's colour — see utils/chrome.js.
   ═══════════════════════════════════════════════════════════════════ */
html {
  overscroll-behavior: none;
  background-color: var(--app-bg, var(--n-paper));
}

body {
  position: fixed;
  inset: 0;
  width: 100%;
  min-height: 100dvh;
  overflow: hidden;
  overscroll-behavior: none;
  touch-action: manipulation;
  background-color: var(--app-bg, var(--n-paper));
}

/* Inner scrollers are still allowed to overscroll normally in the direction
   they cannot go, so a list that ends still feels like a list rather than
   hitting a wall — while the pull-to-refresh gesture stays gone. */
.app-container {
  overscroll-behavior-y: contain;
}

#root {
  height: 100%;
}

h1, h2, h3 {
  font-family: var(--n-font-heavy);
  color: var(--n-ink);
  margin: 0;
}

p, span, div {
  font-family: var(--n-font-body);
}

/* The Book Frame (App Container) */
.app-container {
  max-width: 430px;
  margin: 0 auto;
  min-height: 100dvh;
  position: relative;
  background-color: var(--n-paper);
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
  background: var(--n-paper);
}

.vintage-title {
  font-size: 48px;
  font-weight: 700;
  color: var(--n-ink);
  letter-spacing: -1px;
}

.vintage-subtitle {
  font-size: 16px;
  color: var(--n-ink-2);
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
  background-color: var(--n-ink);
  border: 2px solid var(--n-ink);
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
  background-color: var(--n-paper);
  border: 2px solid var(--n-ink);
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

.switch .sun svg { fill: var(--n-yellow-deep); }
.switch .moon svg { fill: var(--n-ink-3); }

input:checked + .slider {
  background-color: var(--n-yellow);
  border-color: var(--n-yellow-deep);
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

/* ==========================================
   MATCHALIZE: NEO-BRUTALIST TOKEN LAYER
   The one canon. Mirrors src/styles/neu.js —
   do not add colors/shadows anywhere else.
   ========================================== */
:root {
  --n-desk: #131313;
  --n-paper: #FFF9EC;
  --n-card: #FFFFFF;
  --n-ink: #191919;
  --n-ink-2: #5F5B52;
  --n-ink-3: #A39E92;
  --n-hair: #EBE5D6;
  --n-yellow: #FFD43D;
  --n-yellow-deep: #FFC91F;
  --n-coral: #FF7A59;
  --n-green: #5BD98A;
  --n-pink: #FFA3C6;
  --n-red: #E5484D;

  --n-font-heavy: 'Archivo Black', 'Arial Black', sans-serif;
  --n-font-body: 'Inter', -apple-system, 'Segoe UI', sans-serif;
  --n-font-mono: 'Space Mono', 'Courier New', monospace;
  --n-font-hand: 'Caveat', 'Segoe Script', cursive;

  --n-slam-sm: 3px 3px 0 #191919;
  --n-slam-md: 5px 5px 0 #191919;
  --n-slam-lg: 8px 8px 0 #191919;
}

/* THE SLAM — one shared press recipe. Buttons/chips get
   .slam + a size class; do not hand-roll this interaction. */
.slam {
  transition: transform .08s steps(2), box-shadow .08s steps(2);
  -webkit-tap-highlight-color: transparent;
}
.slam-sm { box-shadow: var(--n-slam-sm); }
.slam-md { box-shadow: var(--n-slam-md); }
.slam-lg { box-shadow: var(--n-slam-lg); }

.slam:hover:not(:disabled) { transform: translate(-2px, -2px); }
.slam-sm:hover:not(:disabled) { box-shadow: 5px 5px 0 #191919; }
.slam-md:hover:not(:disabled) { box-shadow: 7px 7px 0 #191919; }
.slam-lg:hover:not(:disabled) { box-shadow: 10px 10px 0 #191919; }

.slam:active:not(:disabled) {
  transform: translate(3px, 3px) !important;
  box-shadow: 0 0 0 #191919 !important;
}
.slam:focus-visible { outline: 3px solid var(--n-coral); outline-offset: 3px; }
.slam:disabled { opacity: 0.55; cursor: not-allowed; }

@media (prefers-reduced-motion: reduce) {
  .slam { transition: none; }
  .slam:hover:not(:disabled) { transform: none; }
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

