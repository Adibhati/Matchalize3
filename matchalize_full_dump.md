# Matchalize — Full Codebase Dump

> Verbatim contents of all project source and configuration files.
> Generated Sun Sep 20 11:58:12 IST 2026. Organized into 4 sections: (1) Root & Project Config, (2) Client Source, (3) Server Source, (4) Docs & Meta.


## Section 1 — Root & Project Config


### ./package.json

```
{
  "name": "matchalize",
  "version": "1.0.0",
  "description": "Matchalize — Campus dating app",
  "private": true,
  "scripts": {
    "install:all": "npm install --prefix client && npm install --prefix server",
    "build": "npm run build --prefix client",
    "start": "npm run build && npm start --prefix server",
    "dev:client": "npm run dev --prefix client",
    "dev:server": "npm run dev --prefix server",
    "qa:build": "cd client && VITE_API_URL=http://localhost:5051 vite build",
    "qa": "npm run qa:build && node server/tests/qa/run-qa.mjs",
    "qa:only": "node server/tests/qa/run-qa.mjs"
  },
  "dependencies": {
    "@google/stitch-sdk": "^0.3.5",
    "dotenv": "^17.4.2"
  },
  "devDependencies": {
    "@playwright/test": "^1.63.0"
  }
}

```

### ./.gitignore

```
# Dependency directories
node_modules/
/client/node_modules/
/server/node_modules/

# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
.env.qa
/server/.env
/server/.env.test

# QA artifacts (videos, theater, photos, logs)
/server/tests/qa/videos/
/server/tests/qa/media/
/server/tests/qa/report/
/server/tests/.scratch/
/server/uploads/qa/

# OS Metadata
.DS_Store
Thumbs.db

# IDEs and editors
.idea/
.vscode/
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# Uploaded photos
/server/uploads/

# Build output
/client/dist/
/client/build/
/server/dist/
/server/build/

```

### ./server/.gitignore

```
.env
node_modules/
dist/
build/

```

### ./server/.npmrc

```
legacy-peer-deps=true

```

### ./client/.gitignore

```
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

```

### ./client/.oxlintrc.json

```
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "oxc"],
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}

```

### ./client/vite.config.js

```
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
    proxy: {
      '/api': 'http://localhost:5005',
      '/uploads': 'http://localhost:5005',
    },
  },
})

```

### ./client/index.html

```
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
    <meta name="theme-color" content="#fdfbf7" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <link rel="apple-touch-icon" href="/icons.svg" />
    <link rel="manifest" href="/manifest.json" />
    
    <!-- Vintage Story Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Special+Elite&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block" />
    
    <title>Matchalize — Your Campus. Your Story.</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>

```

### ./client/public/manifest.json

```
{
  "name": "Matchalize",
  "short_name": "Matchalize",
  "description": "Campus dating app",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#f97316",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}

```

### ./client/public/sw.js

```
const CACHE_NAME = 'matchalize-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('push', (event) => {
  let data = { title: 'Matchalize', body: 'You have a new notification' };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192.png',
    badge: data.badge || '/icons/badge-72.png',
    vibrate: data.vibrate || [100, 50, 100],
    data: data.data || {},
    tag: data.data?.type || 'notification',
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus existing window if open
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          if (data.matchId) {
            client.navigate(`/chat/${data.matchId}`);
          } else if (data.type === 'match') {
            client.navigate('/matches');
          }
          return;
        }
      }
      // Open new window
      const url = data.matchId ? `/chat/${data.matchId}` : '/matches';
      return self.clients.openWindow(url);
    })
  );
});

```

## Section 2 — Client Source


### ./client/package.json

```
{
  "name": "client",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "oxlint",
    "preview": "vite preview"
  },
  "dependencies": {
    "@sentry/react": "^10.66.0",
    "@tanstack/react-query": "^5.101.2",
    "canvas-confetti": "^1.9.4",
    "framer-motion": "^12.42.0",
    "gsap": "^3.15.0",
    "lucide-react": "^1.25.0",
    "react": "^19.2.7",
    "react-dom": "^19.2.7",
    "react-pageflip": "^2.0.3",
    "react-router-dom": "^7.18.0",
    "socket.io-client": "^4.8.3"
  },
  "devDependencies": {
    "@types/react": "^19.2.17",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.2",
    "oxlint": "^1.69.0",
    "vite": "^8.1.0"
  }
}

```

### ./client/README.md

```
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.

```

### ./client/src/App.jsx

```
import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './utils/AuthContext';
import { AppConfigProvider } from './utils/AppConfigContext';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Splash from './pages/Splash.jsx';
import Admin from './pages/Admin.jsx';
import Waitlist from './pages/Waitlist.jsx';
import Auth from './pages/Auth.jsx';
import Onboarding from './pages/Onboarding.jsx';
import AppShell from './components/AppShell';
import socket from './utils/socket';
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
    if (socket) socket.disconnect();
    logout();
    setScreen('splash');
  };

  return (
    <main style={{
      maxWidth: isDesktop ? '100%' : '430px',
      margin: '0 auto',
      minHeight: '100dvh',
      backgroundColor: '#f4f1ea',
      boxShadow: isDesktop ? 'none' : '0 0 60px rgba(0,0,0,0.08)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflowX: 'hidden'
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
              setScreen(u.isOnboarded ? 'home' : 'onboarding');
            }} />
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
          <AppInner />
          <ArchivalToast />
        </QueryClientProvider>
      </ErrorBoundary>
    </AuthProvider>
  );
}

export default App; 

```

### ./client/src/components/AccountSuspendedScreen.jsx

```
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Mail } from 'lucide-react';
import { theme as design } from '../utils/theme';

const HEADER_FONT = design?.font?.heading || "'Playfair Display', serif";
const BODY_FONT = design?.font?.body || "'Inter', sans-serif";

const AccountSuspendedScreen = ({ reason: _reason, suspendedAt }) => {
  // Block back button — every press pushes them back to /auth (which shows this screen)
  useEffect(() => {
    const block = () => window.history.pushState(null, '', window.location.href);
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', block);
    return () => window.removeEventListener('popstate', block);
  }, []);

  const formattedDate = suspendedAt
    ? new Date(suspendedAt).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : null;

  return (
    <div style={{
      minHeight: '100dvh',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f4f1ea',
      padding: '32px 24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url("${design?.texture?.grain || ''}")`,
        mixBlendMode: 'multiply', opacity: 0.6, pointerEvents: 'none', zIndex: 1,
      }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        style={{
          maxWidth: '380px',
          width: '100%',
          textAlign: 'center',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <div style={{
          width: '80px', height: '80px',
          borderRadius: '50%',
          backgroundColor: 'rgba(139, 26, 26, 0.08)',
          border: '2px solid rgba(139, 26, 26, 0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 32px',
        }}>
          <Lock size={36} color="#8b1a1a" strokeWidth={1.5} />
        </div>

        <h1 style={{
          fontFamily: HEADER_FONT,
          fontSize: '28px',
          fontWeight: 800,
          color: '#1a1a1a',
          margin: '0 0 16px',
          letterSpacing: '-0.02em',
          lineHeight: 1.15,
        }}>
          Your Account Has Been Suspended
        </h1>

        <p style={{
          fontFamily: BODY_FONT,
          fontSize: '14px',
          color: '#8c8275',
          margin: '0 0 8px',
          lineHeight: 1.6,
        }}>
          Your account has been restricted for violating our community guidelines. During this time, you cannot log in, send messages, or use Matchalize.
        </p>

        {formattedDate && (
          <p style={{
            fontFamily: BODY_FONT,
            fontSize: '12px',
            color: '#8c8275',
            margin: '0 0 32px',
            fontStyle: 'italic',
          }}>
            Suspended on {formattedDate}
          </p>
        )}
        {!formattedDate && <div style={{ marginBottom: '32px' }} />}

        <a
          href={`mailto:support@matchalize.com?subject=Account Suspension Appeal&body=Hi Matchalize Support,%0D%0A%0D%0AI would like to appeal my account suspension.%0D%0A%0D%0AThank you.`}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            width: '100%', padding: '18px',
            backgroundColor: '#8b1a1a', color: '#fff',
            border: 'none', borderRadius: '14px',
            fontFamily: BODY_FONT, fontSize: '14px', fontWeight: 800,
            letterSpacing: '1px', textTransform: 'uppercase',
            textDecoration: 'none',
            boxShadow: '0 8px 24px rgba(139, 26, 26, 0.3)',
            cursor: 'pointer',
          }}
        >
          <Mail size={18} />
          Contact Support
        </a>
      </motion.div>
    </div>
  );
};

export default AccountSuspendedScreen;

```

### ./client/src/components/AppShell.jsx

```
import React, { useState, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Header from './Header';
import NavBar from './NavBar';
import DesktopSidebar from './DesktopSidebar';
import { api } from '../utils/api';
import { useAuth } from '../utils/AuthContext';
import { SkeletonBox } from './Skeleton';
import { theme as design } from '../utils/theme';
import { useIsDesktop } from '../utils/useIsDesktop';

// Lazy loaded routes
const Discover = lazy(() => import('../pages/Discover'));
const Matches = lazy(() => import('../pages/Matches'));
const Chat = lazy(() => import('../pages/Chat'));
const Profile = lazy(() => import('../pages/Profile'));

const theme = {
  paper: '#fdfbf7',
  surfaceAlt: '#f4f1ea',
  borderDark: '#d4c5a9',
  shadowWarm: 'rgba(139, 69, 19, 0.12)',
};

const ArchivalFallback = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    style={{
      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', backgroundColor: theme.paper,
      zIndex: 10, contain: 'strict'
    }}
  >
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: `url("${design?.texture?.grain || ''}")`, mixBlendMode: 'multiply', opacity: 0.6, pointerEvents: 'none' }} />
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', width: '100%', padding: '0 40px' }}>
      <SkeletonBox width="48px" height="48px" radius="12px" />
      <SkeletonBox width="60%" height="24px" radius="6px" />
      <SkeletonBox width="40%" height="16px" radius="4px" />
    </div>
  </motion.div>
);

const AppShell = ({ onSignOut }) => {
  const isDesktop = useIsDesktop();
  const [activeTab, setActiveTab] = useState('discover');
  const [activeChat, setActiveChat] = useState(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const myId = user?._id;

  const { data: matchData } = useQuery({
    queryKey: ['matches'],
    queryFn: () => api.get('/matches'),
    staleTime: 30000,
  });

  const matchCount = (matchData?.matches || []).filter((m) => {
    const lastMsg = m.lastMessage;
    return (
      m.yourTurn ||
      (lastMsg && lastMsg.senderId && lastMsg.senderId !== myId && !lastMsg.readAt)
    );
  }).length;

  const handleOpenChat = (match) => {
    queryClient.setQueryData(['matches'], (old) => {
      if (!old?.matches) return old;
      return {
        ...old,
        matches: old.matches.map((m) =>
          m._id === match._id
            ? { ...m, yourTurn: false, lastMessage: { ...m.lastMessage, readAt: new Date().toISOString() } }
            : m
        ),
      };
    });
    setActiveChat(match);
  };

  const handleCloseChat = () => {
    setActiveChat(null);
  };

  const renderPage = () => {
    switch (activeTab) {
      case 'discover':
        return <Discover key="discover" onOpenChat={handleOpenChat} />;
      case 'matches':
        return <Matches key="matches" onOpenChat={handleOpenChat} />;
      case 'profile':
        return <Profile key="profile" onSignOut={onSignOut} />;
      default:
        return <Profile key="profile" onSignOut={onSignOut} />;
    }
  };

  // DESKTOP LAYOUT
  if (isDesktop) {
    return (
      <div style={desktopStyles.shellRoot}>
        {/* Left Sidebar */}
        <DesktopSidebar 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          matchBadge={matchCount}
          onSignOut={onSignOut}
          onOpenNotifications={() => {/* TODO: Wire to notification drawer */}}
        />

        {/* Right Content Area */}
        <div style={desktopStyles.contentArea}>
          <Header
            onSelectMatch={handleOpenChat}
            onNavigate={(tab) => setActiveTab(tab)}
            title={activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          />
          
          <div style={desktopStyles.stage}>
            <Suspense fallback={<ArchivalFallback />}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
                  style={desktopStyles.pageWrapper}
                >
                  {renderPage()}
                </motion.div>
              </AnimatePresence>
            </Suspense>
          </div>
        </div>

        {/* Desktop Chat Overlay (Centered Modal instead of full screen) */}
        <AnimatePresence>
          {activeChat && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={desktopStyles.chatModal}
            >
              <Suspense fallback={<ArchivalFallback />}>
                <Chat match={activeChat} onBack={handleCloseChat} />
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // MOBILE LAYOUT (Original)
  return (
    <div style={styles.shellRoot}>
      <Header
        onSelectMatch={handleOpenChat}
        onNavigate={(tab) => setActiveTab(tab)}
        title={activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
      />

      <div style={styles.contentStage}>
        <Suspense fallback={<ArchivalFallback />}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
              style={styles.pageWrapper}
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </Suspense>
      </div>

      <NavBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        matchBadge={matchCount}
      />

      <AnimatePresence>
        {activeChat && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            style={styles.chatOverlay}
          >
            <Suspense fallback={<ArchivalFallback />}>
              <Chat match={activeChat} onBack={handleCloseChat} />
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ==================================================================
   STYLES
================================================================== */
const styles = {
  shellRoot: {
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    height: '100dvh',
    width: '100%',
    backgroundColor: theme.paper,
    overflow: 'hidden',
    position: 'relative',
    contain: 'layout',
  },
  contentStage: {
    flex: 1,
    minHeight: 0,
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    backgroundColor: theme.surfaceAlt,
    zIndex: 1,
  },
  pageWrapper: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    willChange: 'transform, opacity',
  },
  chatOverlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
    backgroundColor: theme.paper,
    display: 'flex',
    flexDirection: 'column',
    willChange: 'transform',
    boxShadow: `0 -20px 60px rgba(0,0,0,0.3)`,
  },
};

// DESKTOP STYLES
const desktopStyles = {
  shellRoot: {
    display: 'flex',
    flexDirection: 'row',
    height: '100dvh',
    width: '100%',
    backgroundColor: theme.surfaceAlt,
    overflow: 'hidden',
  },
  contentArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  stage: {
    flex: 1,
    minHeight: 0,
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    backgroundColor: theme.surfaceAlt,
  },
  pageWrapper: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    willChange: 'transform, opacity',
    maxWidth: '1200px', 
    margin: '0 auto',
    width: '100%',
  },
  chatModal: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: '800px',
    height: '85vh',
    zIndex: 1000,
    backgroundColor: theme.paper,
    borderRadius: '24px',
    boxShadow: '0 25px 80px rgba(0,0,0,0.4)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    border: `1px solid ${theme.borderDark}`,
  }
};

export default AppShell;

```

### ./client/src/components/ArchivalToast.jsx

```
import React, { useState, useEffect } from 'react';
import { setToastHandler } from '../utils/toast';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { theme as design } from '../utils/theme';

const ArchivalToast = () => {
  const [toast, setToast] = useState(null);
  const [timer, setTimer] = useState(null);

  useEffect(() => {
    setToastHandler((newToast) => {
      setToast(newToast);
      if (!newToast.action) {
        const t = setTimeout(() => setToast(null), 4000);
        setTimer(t);
      } else {
        if (timer) clearTimeout(timer);
      }
    });
    return () => {
      if (timer) clearTimeout(timer);
      setToastHandler(null);
    };
  }, [timer]);

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 size={20} color={design.color.success || '#2e7d32'} />,
    error: <AlertCircle size={20} color={design.color.crimson} />,
    info: <Info size={20} color={design.color.accent} />,
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -100, opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        style={{
          position: 'fixed',
          top: 'max(16px, env(safe-area-inset-top))',
          left: '16px',
          right: '16px',
          zIndex: 9999,
          backgroundColor: design.color.paper,
          backgroundImage: `url("${design?.texture?.grain || ''}")`,
          border: `1.5px solid ${toast.type === 'error' ? design.color.crimson : design.color.borderDark}`,
          borderRadius: design?.radius?.md || '12px',
          boxShadow: `0 12px 32px ${design.color.shadowWarm}`,
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div style={{
          width: '4px', height: '100%', position: 'absolute', left: 0, top: 0, bottom: 0,
          backgroundColor: toast.type === 'error' ? design.color.crimson : design.color.accent,
          borderRadius: '12px 0 0 12px'
        }} />
        <div style={{ flexShrink: 0, marginLeft: '8px' }}>{icons[toast.type]}</div>
        <p style={{
          margin: 0, fontFamily: design.font.body, fontSize: '14px', fontWeight: 600,
          color: design.color.ink, lineHeight: 1.4, flex: 1
        }}>
          {toast.message}
        </p>
        {toast.action ? (
          <button
            onClick={() => { toast.action.onClick(); setToast(null); }}
            style={{
              padding: '8px 16px',
              backgroundColor: toast.type === 'error' ? design.color.crimson : design.color.accent,
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontFamily: design.font.body,
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            {toast.action.label}
          </button>
        ) : (
          <button
            onClick={() => setToast(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: design.color.inkMuted }}
          >
            <X size={18} />
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default ArchivalToast;

```

### ./client/src/components/CassettePlayer.jsx

```
import React, { useRef, useState } from 'react';

const CassettePlayer = ({ audioUrl }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (audio && audio.duration) {
      setCurrentTime(audio.currentTime);
      setProgress(audio.currentTime / audio.duration);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <div
      style={{
        backgroundColor: '#fffcf5',
        border: '1.5px solid #d4af37',
        borderRadius: '12px',
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        width: '260px',
        boxShadow: '0 4px 10px rgba(212, 175, 55, 0.12)',
        boxSizing: 'border-box',
      }}
    >
      {/* Twin Spinning Tape Reels */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
        {[0, 1].map((idx) => (
          <div
            key={idx}
            className={`cassette-spool ${isPlaying ? 'playing' : ''}`}
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: '#2a221e',
              border: '2px solid #d4af37',
              position: 'relative',
            }}
          >
            <div style={{ position: 'absolute', top: 0, left: '10px', width: '2px', height: '20px', backgroundColor: '#d4af37' }} />
            <div style={{ position: 'absolute', top: '10px', left: 0, width: '20px', height: '2px', backgroundColor: '#d4af37' }} />
          </div>
        ))}
      </div>

      {/* Player Controls & Progress */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            type="button"
            onClick={togglePlay}
            style={{
              backgroundColor: '#8b1a1a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(139, 26, 26, 0.2)',
            }}
          >
            {isPlaying ? '❚❚' : '▶'}
          </button>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#8b4513', letterSpacing: '0.5px' }}>
            CASSETTE
          </span>
        </div>

        {/* Progress Bar */}
        <div style={{ marginTop: '10px', height: '4px', backgroundColor: '#e0d8c8', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ width: `${progress * 100}%`, height: '100%', backgroundColor: '#8b1a1a', transition: 'width 0.1s linear' }} />
        </div>

        {/* Timestamp */}
        <div style={{ marginTop: '4px', fontSize: '10px', color: '#8c8275', textAlign: 'right', fontFamily: 'monospace' }}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        style={{ display: 'none' }}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={(e) => setDuration(e.target.duration || 0)}
        onEnded={() => setIsPlaying(false)}
      />
    </div>
  );
};

export default CassettePlayer;

```

### ./client/src/components/DesktopSidebar.jsx

```
import React from 'react';
import { motion } from 'framer-motion';
import { Compass, Heart, User, LogOut, Bell } from 'lucide-react';
import { theme as design } from '../utils/theme';
import { triggerHaptic } from '../utils/haptics';

/* Locked tokens — same family as ProfileCard */
const t = {
  paper: '#fdfbf7',
  card: '#fffdf8',
  surfaceAlt: '#f4f1ea',
  lineDark: '#d4c5a9',
  ink: '#1a1a1a',
  inkMuted: '#8c8275',
  accent: '#8b4513',
  crimson: '#8b1a1a',
  fontDisplay: design?.font?.heading || "'Playfair Display', Georgia, serif",
  fontBody: design?.font?.body || "'Inter', -apple-system, sans-serif",
};

const tabs = [
  { key: 'discover', label: 'Discover', Icon: Compass },
  { key: 'matches', label: 'Matches', Icon: Heart },
  { key: 'profile', label: 'Profile', Icon: User },
];

const DesktopSidebar = ({ activeTab, onTabChange, matchBadge = 0, onSignOut, onOpenNotifications }) => {
  const handleTabClick = (key) => {
    if (activeTab !== key) {
      triggerHaptic('light');
      onTabChange(key);
    }
  };

  return (
    /* Floating panel: the parent shell should paint the desk behind it — backgroundColor '#ece4d4' */
    <aside
      style={{
        width: 260,
        height: 'calc(100dvh - 32px)',
        margin: 16,
        backgroundColor: t.paper,
        border: '1px solid rgba(212,197,169,0.7)',
        borderRadius: 18,
        boxShadow: '0 14px 34px rgba(88,63,30,0.16), 0 3px 8px rgba(88,63,30,0.08)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        flexShrink: 0,
        overflow: 'hidden',
        boxSizing: 'border-box',
        zIndex: 100,
      }}
    >
      {/* Grain — same film, same strength as the card */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("${design?.texture?.grain || ''}")`,
          mixBlendMode: 'multiply',
          opacity: 0.3,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Header */}
      <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid rgba(212,197,169,0.7)', position: 'relative', zIndex: 2 }}>
        <h1 style={{ fontFamily: t.fontDisplay, fontSize: 26, fontWeight: 900, color: t.ink, margin: 0, letterSpacing: '-0.02em', lineHeight: 1 }}>matchalize</h1>
        <p style={{ fontFamily: t.fontBody, fontSize: 9.5, fontWeight: 800, color: t.inkMuted, margin: '8px 0 0 0', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Campus Ledger</p>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 8, position: 'relative', zIndex: 2 }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const showBadge = tab.key === 'matches' && matchBadge > 0;

          return (
            <motion.button
              key={tab.key}
              onClick={() => handleTabClick(tab.key)}
              whileHover={isActive ? {} : { x: 3 }}
              whileTap={{ scale: 0.98 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '11px 14px',
                borderRadius: 12,
                border: isActive ? '1px solid rgba(212,197,169,0.9)' : '1px solid transparent',
                backgroundColor: isActive ? t.card : 'transparent',
                boxShadow: isActive ? '0 6px 16px rgba(88,63,30,0.12)' : 'none',
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <tab.Icon size={18} color={isActive ? t.crimson : t.inkMuted} strokeWidth={isActive ? 2.5 : 2} />
                <span style={{ fontFamily: t.fontBody, fontSize: 13.5, letterSpacing: '0.3px', color: t.ink, fontWeight: isActive ? 700 : 500 }}>
                  {tab.label}
                </span>
              </div>

              {showBadge && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ backgroundColor: t.crimson, color: '#fff', fontFamily: t.fontBody, fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 999, minWidth: 20, textAlign: 'center', boxShadow: '0 2px 6px rgba(139,26,26,0.25)', fontVariantNumeric: 'tabular-nums' }}>
                  {matchBadge > 99 ? '99+' : matchBadge}
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Footer actions */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(212,197,169,0.7)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2 }}>
        <motion.button
          onClick={() => { triggerHaptic('light'); onOpenNotifications(); }}
          whileTap={{ scale: 0.94 }}
          title="Letters Received"
          style={{ backgroundColor: t.surfaceAlt, border: '1px solid rgba(212,197,169,0.7)', borderRadius: 12, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <Bell size={18} color={t.inkMuted} strokeWidth={2} />
        </motion.button>
        <motion.button
          onClick={() => { triggerHaptic('light'); onSignOut(); }}
          whileTap={{ scale: 0.94 }}
          title="Log Out"
          style={{ backgroundColor: t.surfaceAlt, border: '1px solid rgba(212,197,169,0.7)', borderRadius: 12, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <LogOut size={18} color={t.inkMuted} strokeWidth={2} />
        </motion.button>
      </div>
    </aside>
  );
};

export default DesktopSidebar;
```

### ./client/src/components/ErrorBoundary.jsx

```
import React from 'react';
import * as Sentry from '@sentry/react';
import { theme as design } from '../utils/theme';
import { FileWarning, RotateCw } from 'lucide-react';

/* Locked tokens — same family as ProfileCard */
const t = {
  desk: '#ece4d4',
  paper: '#fdfbf7',
  surfaceAlt: '#f4f1ea',
  lineDark: '#d4c5a9',
  ink: '#1a1a1a',
  inkSoft: '#4a4a4a',
  inkMuted: '#8c8275',
  accent: '#8b4513',
  crimson: '#8b1a1a',
  fontDisplay: design?.font?.heading || design?.font?.display || "'Playfair Display', Georgia, serif",
  fontBody: design?.font?.body || "'Inter', -apple-system, sans-serif",
  fontType: "'Special Elite', 'Courier New', monospace",
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Matchalize UI Error:', error, errorInfo);
    try {
      Sentry.captureException(error, { extra: errorInfo });
    } catch {
      // Sentry not initialized (no DSN) — safe to ignore
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100dvh',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          backgroundColor: t.desk,
          boxSizing: 'border-box',
        }}>
          <style>{`
            @keyframes errorFadeUp {
              from { opacity: 0; transform: translate3d(0, 16px, 0); }
              to   { opacity: 1; transform: translate3d(0, 0, 0); }
            }
            .error-anim {
              animation: errorFadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
              will-change: transform, opacity;
            }
            .tactile-btn { transition: transform 0.15s ease-out; will-change: transform; }
            .tactile-btn:active { transform: scale(0.96) !important; }
            @media (prefers-reduced-motion: reduce) {
              .error-anim { animation: none !important; opacity: 1 !important; transform: none !important; }
              .tactile-btn { transition: none !important; transform: none !important; }
            }
          `}</style>

          {/* Grain film — same strength as every other surface */}
          <div
            aria-hidden="true"
            style={{
              position: 'fixed',
              inset: 0,
              backgroundImage: `url("${design?.texture?.grain || ''}")`,
              mixBlendMode: 'multiply',
              opacity: 0.3,
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />

          {/* The floating paper panel */}
          <div
            className="error-anim"
            style={{
              position: 'relative',
              zIndex: 2,
              maxWidth: 380,
              width: '100%',
              backgroundColor: t.paper,
              border: '1px solid rgba(212,197,169,0.7)',
              borderRadius: 18,
              boxShadow: '0 14px 34px rgba(88,63,30,0.16), 0 3px 8px rgba(88,63,30,0.08)',
              padding: '32px 28px 28px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              boxSizing: 'border-box',
            }}
          >
            {/* Icon in the standard 12px-radius tile */}
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              backgroundColor: t.surfaceAlt,
              border: '1px solid rgba(212,197,169,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}>
              <FileWarning size={18} color={t.accent} strokeWidth={2} />
            </div>

            <h1 style={{
              fontFamily: t.fontDisplay,
              fontSize: 30,
              fontWeight: 800,
              color: t.ink,
              margin: 0,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
            }}>
              Ink Spilled
            </h1>

            <p style={{
              fontFamily: t.fontBody,
              fontSize: 14,
              color: t.inkSoft,
              margin: '12px 0 0 0',
              lineHeight: 1.6,
            }}>
              Something tore in the archive. Refresh to restore your session.
            </p>

            {/* Findings-style error note — typewriter, hairline box */}
            {this.state.error?.message && (
              <div style={{
                width: '100%',
                marginTop: 18,
                border: '1px solid rgba(139,69,19,0.3)',
                borderRadius: 6,
                backgroundColor: 'rgba(139,69,19,0.03)',
                padding: '10px 12px',
                boxSizing: 'border-box',
              }}>
                <p style={{
                  fontFamily: t.fontType,
                  fontSize: 11.5,
                  color: t.inkMuted,
                  margin: 0,
                  lineHeight: 1.5,
                  wordBreak: 'break-word',
                }}>
                  {this.state.error.message}
                </p>
              </div>
            )}

            {/* The one crimson moment — pill CTA */}
            <button
              className="tactile-btn"
              onClick={() => {
                if (window.navigator && window.navigator.vibrate) {
                  window.navigator.vibrate(50);
                }
                window.location.reload();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginTop: 24,
                padding: '14px 26px',
                backgroundColor: t.crimson,
                color: '#ffffff',
                border: 'none',
                borderRadius: 999,
                fontFamily: t.fontBody,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '1.8px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                boxShadow: '0 6px 18px rgba(139,26,26,0.28)',
              }}
            >
              <RotateCw size={14} strokeWidth={2.5} />
              Restore Ledger
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
```

### ./client/src/components/Header.jsx

```
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import socket from '../utils/socket';
import NotificationDrawer from './NotificationDrawer';
import { theme as design } from '../utils/theme';
import { Bell } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

/* Locked tokens — same family as ProfileCard */
const t = {
  paper: '#fdfbf7',
  card: '#fffdf8',
  surfaceAlt: '#f4f1ea',
  lineDark: '#d4c5a9',
  ink: '#1a1a1a',
  inkSoft: '#4a4a4a',
  inkMuted: '#8c8275',
  accent: '#8b4513',
  crimson: '#8b1a1a',
  shadowWarm: 'rgba(88,63,30,0.16)',
  fontDisplay: design?.font?.heading || design?.font?.display || "'Playfair Display', Georgia, serif",
  fontBody: design?.font?.body || "'Inter', -apple-system, sans-serif",
  grain: design?.texture?.grain || '',
};

const Header = ({ onNavigate, onSelectMatch, title }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const queryClient = useQueryClient();

  const { data: unreadData, refetch } = useQuery({
    queryKey: ['unread-notifications-count'],
    queryFn: () => api.get('/notifications/unread-count'),
    refetchInterval: 30000, // Silently refetch every 30s
  });
  const unreadCount = unreadData?.count || 0;

  // Refetch when the drawer closes to update badge
  useEffect(() => {
    if (!drawerOpen) {
      refetch();
    }
  }, [drawerOpen, refetch]);

  // Real-time incoming letter listener
  useEffect(() => {
    const handleNewLetter = (data) => {
      queryClient.setQueryData(['unread-notifications-count'], (old) => ({
        ...(old || {}),
        count: (old?.count || 0) + 1,
      }));

      triggerHaptic('heavy');
      setToast(`${data?.senderName || 'An anonymous subject'} sent you a letter.`);
    };

    socket.on('new-letter', handleNewLetter);
    return () => socket.off('new-letter', handleNewLetter);
  }, [queryClient]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const toggleDrawer = () => {
    triggerHaptic('light');
    setDrawerOpen((prev) => !prev);
  };

  const handleLogoClick = () => {
    if (onNavigate) {
      triggerHaptic('light');
      onNavigate('discover');
    }
  };

  const isDiscover = !title || title === 'Discover';

  return (
    <>
      <style>{`
        .tactile-btn { transition: transform 0.15s ease-out; will-change: transform; }
        @media (hover: hover) { .tactile-btn:hover { transform: translateY(-1px); } }
        .tactile-btn:active { transform: scale(0.96) !important; }
      `}</style>

      {/* Floating paper toast — mini panel with the single crimson spine */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'fixed',
              top: 'max(16px, env(safe-area-inset-top))',
              left: '16px',
              right: '16px',
              zIndex: 1100,
              backgroundColor: t.paper,
              border: '1px solid rgba(212,197,169,0.7)',
              borderRadius: 12,
              boxShadow: `0 14px 34px ${t.shadowWarm}, 0 3px 8px rgba(88,63,30,0.08)`,
              padding: '14px 16px 14px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              overflow: 'hidden',
              pointerEvents: 'none', // Prevents blocking touches to the header below
            }}
          >
            {/* Grain film */}
            <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: `url("${t.grain}")`, mixBlendMode: 'multiply', opacity: 0.3, pointerEvents: 'none' }} />
            {/* Crimson spine — clipped by overflow, no manual corner math */}
            <div aria-hidden="true" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: t.crimson }} />
            <Bell size={18} color={t.crimson} strokeWidth={2} style={{ flexShrink: 0, position: 'relative' }} />
            <p style={{
              margin: 0, fontFamily: t.fontBody, fontSize: 13, fontWeight: 600,
              color: t.ink, lineHeight: 1.5, position: 'relative',
            }}>
              {toast}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <header style={styles.header}>
        {/* Grain film — same strength as every surface */}
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: `url("${t.grain}")`, mixBlendMode: 'multiply', opacity: 0.3, pointerEvents: 'none', zIndex: 1 }} />

        <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          {isDiscover ? (
            <div className="tactile-btn" style={styles.logoContainer} onClick={handleLogoClick}>
              <h1 style={styles.logoWordmark}>matchalize</h1>
            </div>
          ) : (
            <h1 style={styles.pageTitle}>{title}</h1>
          )}

          {isDiscover && (
            <div style={styles.rightActions}>
              <button
                className="tactile-btn"
                style={styles.bellButton}
                onClick={toggleDrawer}
                aria-label="View notifications"
                title="Letters Received"
              >
                <Bell size={18} color={t.inkSoft} strokeWidth={2} />

                {/* Crimson seal badge — pill, paper-bordered */}
                <AnimatePresence>
                  {unreadCount > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: [1, 1.1, 1] }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{
                        scale: { repeat: Infinity, duration: 3, ease: 'easeInOut' },
                        default: { type: 'spring', damping: 12, stiffness: 300 },
                      }}
                      style={styles.unreadBadge}
                    >
                      <span style={styles.badgeText}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Full-Screen Notification Drawer Overlay */}
      <AnimatePresence>
        {drawerOpen && (
          <NotificationDrawer
            onClose={() => setDrawerOpen(false)}
            onSelectMatch={(match) => {
              setDrawerOpen(false);
              if (onSelectMatch) {
                onSelectMatch(match);
              } else if (onNavigate) {
                onNavigate('chat', { matchId: match._id });
              }
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
};

/* ==================================================================
   STYLES
================================================================== */
const styles = {
  header: {
    height: '56px',
    boxSizing: 'border-box',
    padding: '0 16px',
    backgroundColor: t.paper,
    borderBottom: '1px solid rgba(212,197,169,0.7)',
    position: 'sticky',
    top: 0,
    zIndex: 500,
    boxShadow: `0 4px 16px ${t.shadowWarm}`,
    contain: 'layout style', // Isolates layout rendering
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '8px',
    cursor: 'pointer',
    userSelect: 'none',
    padding: '4px',
    margin: '-4px', // expands touch target
  },
  logoWordmark: {
    fontFamily: t.fontDisplay,
    fontSize: '20px',
    fontWeight: 900,
    color: t.ink,
    letterSpacing: '-0.02em',
    margin: 0,
    lineHeight: 1,
    textTransform: 'lowercase', // Aligned with the Splash screen style
  },
  pageTitle: {
    fontFamily: t.fontDisplay,
    fontSize: '20px',
    fontWeight: 800,
    color: t.ink,
    letterSpacing: '-0.02em',
    margin: 0,
  },
  rightActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  bellButton: {
    position: 'relative',
    backgroundColor: t.surfaceAlt,
    border: '1px solid rgba(212,197,169,0.7)',
    borderRadius: '12px',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(88,63,30,0.12)',
  },
  unreadBadge: {
    position: 'absolute',
    top: '-5px',
    right: '-5px',
    backgroundColor: t.crimson,
    minWidth: '18px',
    height: '18px',
    borderRadius: '999px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 4px',
    border: `1.5px solid ${t.paper}`,
    boxShadow: '0 2px 6px rgba(139, 26, 26, 0.3)',
    willChange: 'transform',
    zIndex: 5,
  },
  badgeText: {
    fontFamily: t.fontBody,
    fontSize: '9px',
    fontWeight: 800,
    color: '#ffffff',
    letterSpacing: '0.3px',
    lineHeight: 1,
    fontVariantNumeric: 'tabular-nums',
  },
};

export default Header;
```

### ./client/src/components/Icon.jsx

```
import React, { forwardRef, memo } from 'react';

/* ============================================================
   THE ONE ICON PRIMITIVE — Lucide path data only.
   Locked scale: 10 / 12 / 14 / 16 / 18 (never arbitrary sizes).
   Stroke: 2 standard, 1.75 for large display icons.
   Color comes from the caller (ink scale / accent / crimson).
============================================================ */

const Icon = forwardRef(({
  path,
  size = 16,
  color = 'currentColor',
  strokeWidth = 2,
  fill = 'none',
  className = '',
  style = {},
  ...props
}, ref) => (
  <svg
    ref={ref}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true" // Defers screen-reader announcements to parent buttons
    className={className}
    style={{
      display: 'block',
      flexShrink: 0, // Prevents SVG squishing in tight flex layouts
      ...style,
    }}
    {...props}
  >
    {path}
  </svg>
));

// Display name required when using forwardRef + memo
Icon.displayName = 'Icon';

/* The legal size steps — import where icons are placed */
Icon.SIZES = { xs: 10, sm: 12, md: 14, lg: 16, xl: 18 };

export default memo(Icon);
```

### ./client/src/components/LearnMoreSheet.jsx

```
import React from 'react';
import { motion } from 'framer-motion';
import { X, Mail, Info, LifeBuoy } from 'lucide-react';

/* Locked tokens — same family as ProfileCard */
const t = {
  paper: '#fdfbf7',
  surfaceAlt: '#f4f1ea',
  lineDark: '#d4c5a9',
  ink: '#1a1a1a',
  inkSoft: '#4a4a4a',
  inkMuted: '#8c8275',
  accent: '#8b4513',
  crimson: '#8b1a1a',
  grain: '', // set from design?.texture?.grain below
};

/**
 * LearnMoreSheet — Bottom-sheet for "account under review".
 * NEVER reveals scores, weights, tiers, or how many reports.
 *
 * Props:
 *   onClose: Function — callback to close the sheet
 */
const LearnMoreSheet = ({ onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(28,19,10,0.6)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'flex-end',
      }}
      onClick={onClose}
    >
      <style>{`
        .tactile-btn { transition: transform 0.15s ease-out; will-change: transform; }
        .tactile-btn:active { transform: scale(0.96) !important; }
      `}</style>

      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: '100%',
          maxHeight: '70vh',
          backgroundColor: t.paper,
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          boxShadow: '0 -14px 44px rgba(88,63,30,0.3)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grain film — same strength as every surface */}
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: `url("${t.grain}")`, mixBlendMode: 'multiply', opacity: 0.3, pointerEvents: 'none', zIndex: 1 }} />

        {/* Grabber */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, position: 'relative', zIndex: 2 }}>
          <span aria-hidden="true" style={{ width: 36, height: 4, borderRadius: 999, backgroundColor: 'rgba(212,197,169,0.7)' }} />
        </div>

        {/* Header — paper surface, Playfair title, standard close tile */}
        <div style={{
          padding: '14px 20px 16px',
          borderBottom: '1px solid rgba(212,197,169,0.7)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
          zIndex: 2,
        }}>
          <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 19, fontWeight: 800, color: t.ink, letterSpacing: '-0.02em' }}>
            Account Review
          </span>
          <button
            onClick={onClose}
            className="tactile-btn"
            aria-label="Close"
            style={{
              backgroundColor: t.surfaceAlt,
              border: '1px solid rgba(212,197,169,0.7)',
              borderRadius: 12,
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: t.ink,
            }}
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px 20px 24px', overflowY: 'auto', position: 'relative', zIndex: 2 }}>
          <p style={{ fontFamily: "'Inter', -apple-system, sans-serif", fontSize: 14.5, fontWeight: 450, color: t.inkSoft, marginBottom: 18, lineHeight: 1.6 }}>
            Your account has been flagged for review by our moderation system.
          </p>

          {/* What This Means — findings-box treatment + PanelHeader */}
          <div style={{
            backgroundColor: t.surfaceAlt,
            border: '1px solid rgba(212,197,169,0.7)',
            borderRadius: 6,
            padding: '14px 16px',
            marginBottom: 14,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Info size={12} color={t.accent} strokeWidth={2} />
              <span style={{ fontFamily: "'Inter', -apple-system, sans-serif", fontSize: 9.5, fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', color: t.inkMuted }}>
                What This Means
              </span>
            </div>
            <p style={{ fontFamily: "'Inter', -apple-system, sans-serif", fontSize: 13.5, fontWeight: 450, color: t.inkSoft, lineHeight: 1.6, margin: 0 }}>
              Our system periodically reviews accounts to ensure a safe and respectful community. During this time, certain features may be temporarily limited while our team looks into it.
            </p>
          </div>

          {/* What You Can Do */}
          <div style={{
            backgroundColor: t.surfaceAlt,
            border: '1px solid rgba(212,197,169,0.7)',
            borderRadius: 6,
            padding: '14px 16px',
            marginBottom: 22,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <LifeBuoy size={12} color={t.accent} strokeWidth={2} />
              <span style={{ fontFamily: "'Inter', -apple-system, sans-serif", fontSize: 9.5, fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', color: t.inkMuted }}>
                What You Can Do
              </span>
            </div>
            <p style={{ fontFamily: "'Inter', -apple-system, sans-serif", fontSize: 13.5, fontWeight: 450, color: t.inkSoft, lineHeight: 1.6, margin: 0 }}>
              In most cases, reviews are resolved quickly and your account returns to normal. If you believe this is a mistake, you can reach out to our support team.
            </p>
          </div>

          {/* Contact Support — the sheet's one crimson moment */}
          <a
            href="mailto:support@matchalize.com?subject=Account%20Review%20Inquiry"
            className="tactile-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              width: '100%',
              padding: '15px 16px',
              backgroundColor: t.crimson,
              border: 'none',
              borderRadius: 999,
              fontFamily: "'Inter', -apple-system, sans-serif",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '1.8px',
              textTransform: 'uppercase',
              color: '#ffffff',
              textDecoration: 'none',
              cursor: 'pointer',
              boxShadow: '0 6px 18px rgba(139,26,26,0.28)',
              boxSizing: 'border-box',
            }}
          >
            <Mail size={14} strokeWidth={2.5} />
            Contact Support
          </a>

          {/* Recorded note — typewriter */}
          <p style={{ fontFamily: "'Special Elite', 'Courier New', monospace", fontSize: 11, color: t.inkMuted, textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>
            Please use your registered email when contacting us.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LearnMoreSheet;
```

### ./client/src/components/NavBar.jsx

```
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';
import { theme as design } from '../utils/theme';
import { Compass, Heart, User } from 'lucide-react';

/* Locked tokens — same family as ProfileCard */
const t = {
  paper: '#fdfbf7',
  lineDark: '#d4c5a9',
  ink: '#1a1a1a',
  inkMuted: '#8c8275',
  crimson: '#8b1a1a',
  fontBody: design?.font?.body || "'Inter', -apple-system, sans-serif",
  grain: design?.texture?.grain || '',
};

const tabs = [
  { key: 'discover', label: 'Discover', Icon: Compass },
  { key: 'matches', label: 'Matches', Icon: Heart },
  { key: 'profile', label: 'Profile', Icon: User },
];

/* ==================================================================
   MAIN NAVBAR COMPONENT
================================================================== */
const NavBar = ({ activeTab, onTabChange, matchBadge = 0 }) => {

  const handleTabClick = (key) => {
    if (activeTab !== key) {
      triggerHaptic('light');
      onTabChange(key);
    }
  };

  return (
    <div style={styles.navContainer}>
      {/* Grain film — same strength as every surface */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: `url("${t.grain}")`, mixBlendMode: 'multiply', opacity: 0.3, pointerEvents: 'none', zIndex: 1 }} />

      <div style={styles.tabGrid}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const showBadge = tab.key === 'matches' && matchBadge > 0;

          return (
            <motion.button
              key={tab.key}
              onClick={() => handleTabClick(tab.key)}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              style={styles.tabButton}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Active indicator — one sliding crimson bar */}
              {isActive && (
                <motion.div
                  layoutId="navActiveIndicator"
                  transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                  style={styles.activeBar}
                />
              )}

              {/* Icon & badge */}
              <div style={styles.iconContainer}>
                <motion.div
                  initial={false}
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    color: isActive ? t.crimson : t.inkMuted,
                  }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  style={styles.icon}
                >
                  <tab.Icon size={18} color="currentColor" strokeWidth={isActive ? 2.5 : 2} />
                </motion.div>

                <AnimatePresence>
                  {showBadge && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: [1, 1.08, 1] }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{
                        scale: { repeat: Infinity, duration: 3, ease: 'easeInOut' },
                        default: { type: 'spring', damping: 12, stiffness: 300 },
                      }}
                      style={styles.badge}
                    >
                      <span style={styles.badgeText}>
                        {matchBadge > 99 ? '99+' : matchBadge}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <span
                style={{
                  ...styles.label,
                  color: isActive ? t.crimson : t.inkMuted,
                  fontWeight: isActive ? 800 : 600,
                }}
              >
                {tab.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

/* ==================================================================
   STYLES
================================================================== */
const styles = {
  navContainer: {
    marginTop: 'auto', // Flexbox: forces navbar to the bottom
    flexShrink: 0,
    backgroundColor: t.paper,
    borderTop: '1px solid rgba(212,197,169,0.7)',
    zIndex: 10,
    boxShadow: '0 -4px 16px rgba(88,63,30,0.1)',
    paddingBottom: 'max(6px, env(safe-area-inset-bottom))',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    contain: 'layout style',
  },
  tabGrid: {
    display: 'flex',
    position: 'relative',
    zIndex: 3,
    paddingTop: '2px',
  },
  tabButton: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2px',
    background: 'none',
    border: 'none',
    padding: '7px 0 3px',
    cursor: 'pointer',
    position: 'relative',
    outline: 'none',
    touchAction: 'manipulation', // Prevents default browser zoom/pan on double tap
  },
  iconContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '22px',
    width: '32px',
  },
  icon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    willChange: 'transform, color',
  },
  badge: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    minWidth: '18px',
    height: '18px',
    padding: '0 4px',
    borderRadius: '999px',
    backgroundColor: t.crimson,
    border: `1.5px solid ${t.paper}`,
    boxShadow: '0 2px 6px rgba(139, 26, 26, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
    willChange: 'transform',
    boxSizing: 'border-box',
  },
  badgeText: {
    fontFamily: t.fontBody,
    fontSize: '9px',
    fontWeight: 800,
    color: '#ffffff',
    letterSpacing: '0.3px',
    lineHeight: 1,
    fontVariantNumeric: 'tabular-nums',
  },
  label: {
    fontFamily: t.fontBody,
    fontSize: '10px',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    transition: 'color 0.2s ease',
  },
  activeBar: {
    position: 'absolute',
    top: 0,
    left: '50%',
    marginLeft: '-16px',
    width: '32px',
    height: '2.5px',
    backgroundColor: t.crimson,
    borderRadius: '999px',
    pointerEvents: 'none',
  },
};

export default NavBar;
```

### ./client/src/components/NotificationDrawer.jsx

```
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../utils/api';
import { ArrowLeft, X, Mail, Send } from 'lucide-react';
import { theme as design } from '../utils/theme';
import { triggerHaptic } from '../utils/haptics';

/* Locked tokens — same family as ProfileCard */
const t = {
  paper: '#fdfbf7',
  card: '#fffdf8',
  surfaceAlt: '#f4f1ea',
  lineDark: '#d4c5a9',
  ink: '#1a1a1a',
  inkSoft: '#4a4a4a',
  inkMuted: '#8c8275',
  accent: '#8b4513',
  crimson: '#8b1a1a',
  telegramTint: 'rgba(230, 177, 122, 0.10)',
  fontDisplay: design?.font?.heading || design?.font?.display || "'Playfair Display', Georgia, serif",
  fontBody: design?.font?.body || "'Inter', -apple-system, sans-serif",
  fontType: "'Special Elite', 'Courier New', monospace",
  grain: design?.texture?.grain || '',
};

/* ==================================================================
   MAIN COMPONENT
================================================================== */
const NotificationDrawer = ({ onClose, onSelectMatch }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [decliningIds, setDecliningIds] = useState(new Set());

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.notifications || []);
    } catch (err) {
      console.error('Failed to fetch letters:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (e, id, sender) => {
    e.stopPropagation();
    triggerHaptic('heavy');
    try {
      const response = await api.post(`/notifications/${id}/accept`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      setSelectedProfile(null);

      if (onSelectMatch) {
        onClose?.();
        onSelectMatch({ _id: response.matchId, user: sender });
      } else if (onClose) {
        onClose();
      }
    } catch (err) {
      console.error('Error accepting letter:', err);
    }
  };

  const handleDismiss = async (e, id) => {
    e.stopPropagation();
    triggerHaptic('light');

    setDecliningIds(prev => new Set(prev).add(id));

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      setDecliningIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setSelectedProfile(null);
    }, 350);

    try {
      await api.put(`/notifications/${id}/dismiss`);
    } catch (err) {
      console.error('Error dismissing letter:', err);
    }
  };

  const openProfile = (sender, notificationId) => {
    triggerHaptic('light');
    setSelectedProfile({ ...sender, notificationId });
  };

  // Split notifications into tiers
  const telegrams = notifications.filter(n => n.type === 'priority_seal');
  const letters = notifications.filter(n => n.type === 'new_letter');

  const renderRow = (n) => {
    const isPriority = n.type === 'priority_seal';
    const sender = n.senderId || {};
    const senderName = sender.name || 'Anonymous';
    const avatarUrl = sender.photos?.[0] || 'https://via.placeholder.com/100?text=?';
    const noteText = n.interactionRef?.letterContent || (isPriority ? 'Sent a priority message.' : 'Left a note on your profile.');
    const isDeclining = decliningIds.has(n._id);
    const senderUnavailable = sender.suspended || sender.isDeleted;

    return (
      <motion.div
        layout
        key={n._id}
        initial={{ opacity: 0, y: 10 }}
        animate={{
          opacity: senderUnavailable ? 0.5 : 1,
          y: 0,
          backgroundColor: isDeclining ? 'rgba(139, 26, 26, 0.08)' : 'transparent',
        }}
        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="ig-row"
        style={{
          ...styles.row,
          backgroundColor: isPriority && !isDeclining ? t.telegramTint : undefined,
          opacity: senderUnavailable ? 0.5 : 1,
        }}
        onClick={() => openProfile(sender, n._id)}
      >
        {/* Avatar */}
        <div style={styles.avatarContainer}>
          <img src={avatarUrl} alt={senderName} loading="lazy" decoding="async" style={styles.avatar} />
          {isPriority && (
            <div style={styles.sealBadge} title="Priority">
              <Send size={9} color="#fff" strokeWidth={3} />
            </div>
          )}
        </div>

        {/* Text */}
        <div style={styles.textContainer}>
          <p style={styles.mainText}>
            <span style={{ fontWeight: 700, color: t.ink }}>{senderName}</span> {isPriority ? 'sent a priority message.' : 'sent a letter.'}
          </p>
          <p className="line-clamp-2" style={styles.snippetText}>
            {noteText}
          </p>
        </div>

        {/* Actions */}
        <div style={styles.actionContainer}>
          <button
            className="tactile-btn"
            onClick={(e) => handleAccept(e, n._id, sender)}
            style={{
              ...styles.acceptBtn,
              opacity: senderUnavailable ? 0.4 : 1,
              cursor: senderUnavailable ? 'not-allowed' : 'pointer',
            }}
            disabled={senderUnavailable}
            aria-label="Accept"
          >
            {senderUnavailable ? 'Unavailable' : 'Connect'}
          </button>
          <button
            className="tactile-btn"
            onClick={(e) => handleDismiss(e, n._id)}
            style={styles.dismissBtn}
            aria-label="Dismiss"
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div style={styles.screenContainer}>

      <style>{`
        .tactile-btn { transition: transform 0.15s ease-out; will-change: transform; }
        @media (hover: hover) { .tactile-btn:hover { transform: translateY(-1px); } }
        .tactile-btn:active { transform: scale(0.96) !important; }

        .ig-row { transition: background-color 0.2s ease; }
        @media (hover: hover) { .ig-row:hover { background-color: rgba(244, 241, 234, 0.7); } }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .archival-scrollbar::-webkit-scrollbar { width: 4px; }
        .archival-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .archival-scrollbar::-webkit-scrollbar-thumb { background: rgba(212,197,169,0.9); border-radius: 999px; }
      `}</style>

      {/* Grain film */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: `url("${t.grain}")`, mixBlendMode: 'multiply', opacity: 0.3, pointerEvents: 'none', zIndex: 1 }} />

      {/* Header */}
      <div style={styles.topBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {onClose && (
            <button className="tactile-btn" onClick={onClose} style={styles.backBtn} aria-label="Go back">
              <ArrowLeft size={18} color={t.ink} strokeWidth={2} />
            </button>
          )}
          <h2 style={styles.heading}>Letterbox</h2>
        </div>
        {!loading && notifications.length > 0 && (
          <span style={styles.badge}>{notifications.length} pending</span>
        )}
      </div>

      {/* List */}
      <div className="archival-scrollbar" style={styles.contentArea}>
        {loading ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>Fetching your letters...</p>
          </div>
        ) : notifications.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} style={styles.emptyState}>
            <h3 style={styles.emptyTitle}>No pending letters.</h3>
            <p style={styles.emptyText}>Return to the deck to discover new connections.</p>
          </motion.div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: 40 }}>

            {/* Priority */}
            {telegrams.length > 0 && (
              <div style={styles.tierGroup}>
                <div style={styles.tierHeader}>
                  <Send size={12} color={t.accent} strokeWidth={2} />
                  <span style={styles.tierHeaderText}>Priority</span>
                </div>
                <AnimatePresence>
                  {telegrams.map(renderRow)}
                </AnimatePresence>
              </div>
            )}

            {/* Letters */}
            {letters.length > 0 && (
              <div style={styles.tierGroup}>
                <div style={styles.tierHeader}>
                  <Mail size={12} color={t.accent} strokeWidth={2} />
                  <span style={styles.tierHeaderText}>Letters</span>
                </div>
                <AnimatePresence>
                  {letters.map(renderRow)}
                </AnimatePresence>
              </div>
            )}

          </div>
        )}
      </div>

      {/* --- PROFILE PREVIEW SHEET --- */}
      <AnimatePresence>
        {selectedProfile && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              style={styles.modalBackdrop}
              onClick={() => setSelectedProfile(null)}
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              style={styles.modalWrapper}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Grain */}
              <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: `url("${t.grain}")`, mixBlendMode: 'multiply', opacity: 0.3, pointerEvents: 'none', zIndex: 1 }} />

              {/* Grabber */}
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, position: 'relative', zIndex: 2 }}>
                <span aria-hidden="true" style={{ width: 36, height: 4, borderRadius: 999, backgroundColor: 'rgba(212,197,169,0.7)' }} />
              </div>

              {/* Header */}
              <div style={styles.modalHeader}>
                <span style={styles.modalTitle}>{selectedProfile.name || 'Profile'}</span>
                <button className="tactile-btn" onClick={() => setSelectedProfile(null)} aria-label="Close" style={styles.modalCloseBtn}>
                  <X size={16} strokeWidth={2} />
                </button>
              </div>

              <div className="archival-scrollbar" style={styles.modalScrollArea}>
                {/* Hero photo — clean, no torn edge */}
                <div style={{ position: 'relative', width: '100%', aspectRatio: '4/5', backgroundColor: t.surfaceAlt, overflow: 'hidden' }}>
                  <img src={selectedProfile.photos?.[0] || 'https://via.placeholder.com/500'} alt={selectedProfile.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,12,10,0.85) 0%, transparent 45%)' }} />
                  <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20, zIndex: 2 }}>
                    <h3 style={{ fontFamily: t.fontDisplay, fontSize: 30, color: '#fff', margin: 0, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.05, textShadow: '0 2px 16px rgba(0,0,0,0.5)' }}>
                      {selectedProfile.name}, {selectedProfile.age}
                    </h3>
                    <p style={{ fontFamily: t.fontType, fontSize: 10.5, color: 'rgba(255,255,255,0.9)', margin: '8px 0 0 0', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                      {[selectedProfile.branch, selectedProfile.year].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </div>

                <div style={{ padding: '20px 20px 120px', display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {/* Bio — typewriter on a dotted field, recorded data */}
                  {selectedProfile.bio && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                        <span style={{ width: 5, height: 5, backgroundColor: t.crimson }} />
                        <span style={styles.sectionLabel}>About</span>
                      </div>
                      <p style={{ fontFamily: t.fontType, fontSize: 13.5, color: t.ink, lineHeight: 1.65, margin: 0, paddingBottom: 6, borderBottom: '1.5px dotted rgba(139,69,19,0.45)' }}>
                        {selectedProfile.bio}
                      </p>
                    </div>
                  )}

                  {/* Prompts — hairline index rows */}
                  {selectedProfile.prompts && selectedProfile.prompts.map((p, idx) => (
                    p.question && (
                      <div key={idx} style={{ borderTop: '1px solid rgba(212,197,169,0.7)', paddingTop: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                          <span style={{ width: 5, height: 5, backgroundColor: t.crimson }} />
                          <span style={styles.sectionLabel}>Whisper</span>
                        </div>
                        <p style={{ fontFamily: t.fontDisplay, fontSize: 16.5, fontWeight: 600, color: t.ink, margin: 0, lineHeight: 1.45, wordBreak: 'break-word' }}>
                          {p.question}
                        </p>
                      </div>
                    )
                  ))}
                </div>
              </div>

              {/* Footer actions — two pills, crimson on accept only */}
              <div style={styles.modalFooter}>
                <button className="tactile-btn" style={styles.modalDismissBtn} onClick={(e) => handleDismiss(e, selectedProfile.notificationId)}>
                  Decline
                </button>
                <button className="tactile-btn" style={styles.modalAcceptBtn} onClick={(e) => handleAccept(e, selectedProfile.notificationId, selectedProfile)}>
                  Accept & Connect
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ==================================================================
   STYLES
================================================================== */
const styles = {
  screenContainer: {
    position: 'fixed', inset: 0, backgroundColor: t.paper, zIndex: 1000,
    display: 'flex', flexDirection: 'column', overflow: 'hidden', contain: 'layout style paint'
  },
  topBar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: 'max(12px, env(safe-area-inset-top)) 16px 12px',
    backgroundColor: t.paper,
    borderBottom: '1px solid rgba(212,197,169,0.7)', position: 'relative', zIndex: 10,
    boxShadow: '0 4px 16px rgba(88,63,30,0.08)'
  },
  backBtn: {
    backgroundColor: t.surfaceAlt, border: '1px solid rgba(212,197,169,0.7)', borderRadius: 12,
    width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
    flexShrink: 0,
  },
  heading: {
    fontFamily: t.fontDisplay, fontSize: 20,
    fontWeight: 800, color: t.ink, margin: 0, letterSpacing: '-0.02em',
  },
  badge: {
    backgroundColor: t.crimson, color: '#fff', fontFamily: t.fontBody,
    fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 999, letterSpacing: '1.5px', textTransform: 'uppercase',
    fontVariantNumeric: 'tabular-nums',
  },
  contentArea: {
    flex: 1, padding: 0, overflowY: 'auto', position: 'relative', zIndex: 2
  },
  emptyState: {
    padding: '80px 24px', textAlign: 'center',
  },
  emptyTitle: {
    fontFamily: t.fontDisplay, fontSize: 22, fontWeight: 800, color: t.ink, margin: '0 0 8px 0', letterSpacing: '-0.02em'
  },
  emptyText: {
    margin: 0, fontFamily: t.fontBody, fontSize: 13.5, fontWeight: 450, color: t.inkMuted, lineHeight: 1.6
  },

  // --- Tiers ---
  tierGroup: { marginBottom: 8 },
  tierHeader: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '20px 16px 10px',
    borderBottom: '1px solid rgba(212,197,169,0.5)'
  },
  tierHeaderText: {
    fontFamily: t.fontBody, fontSize: 9.5, fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', color: t.inkMuted
  },
  sectionLabel: {
    fontFamily: t.fontBody, fontSize: 9.5, fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', color: t.inkMuted
  },

  // --- Rows ---
  row: {
    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
    borderBottom: '1px solid rgba(212,197,169,0.5)', cursor: 'pointer'
  },
  avatarContainer: { position: 'relative', flexShrink: 0 },
  avatar: {
    width: 48, height: 48, borderRadius: '50%', objectFit: 'cover',
    border: '1px solid rgba(212,197,169,0.9)', backgroundColor: t.surfaceAlt, display: 'block'
  },
  sealBadge: {
    position: 'absolute', bottom: -2, right: -2, width: 18, height: 18,
    backgroundColor: t.crimson, color: '#fff', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: `2px solid ${t.paper}`, boxShadow: '0 2px 6px rgba(139,26,26,0.3)', boxSizing: 'content-box',
  },
  textContainer: {
    flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3
  },
  mainText: {
    fontFamily: t.fontBody, fontSize: 13.5, fontWeight: 450, color: t.inkSoft, margin: 0, lineHeight: 1.35
  },
  snippetText: {
    fontFamily: t.fontType, fontSize: 12.5, color: t.inkMuted,
    margin: 0, lineHeight: 1.45
  },
  actionContainer: {
    display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0
  },
  acceptBtn: {
    backgroundColor: t.crimson, color: '#fff', border: 'none', borderRadius: 999,
    padding: '8px 14px', fontFamily: t.fontBody, fontSize: 10, fontWeight: 800,
    letterSpacing: '1.5px', textTransform: 'uppercase',
    cursor: 'pointer', boxShadow: '0 4px 12px rgba(139,26,26,0.25)', whiteSpace: 'nowrap',
  },
  dismissBtn: {
    backgroundColor: t.surfaceAlt, color: t.inkMuted, border: '1px solid rgba(212,197,169,0.7)',
    borderRadius: 12, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
  },

  // --- Sheet ---
  modalBackdrop: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(28,19,10,0.6)', zIndex: 1100,
  },
  modalWrapper: {
    position: 'fixed', bottom: 0, left: 0, right: 0, height: '92dvh', backgroundColor: t.paper,
    borderTopLeftRadius: 18, borderTopRightRadius: 18, zIndex: 1101, display: 'flex', flexDirection: 'column',
    boxShadow: '0 -14px 44px rgba(88,63,30,0.3)', overflow: 'hidden'
  },
  modalHeader: {
    padding: '12px 16px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    borderBottom: '1px solid rgba(212,197,169,0.7)', zIndex: 10, position: 'relative',
  },
  modalTitle: {
    fontFamily: t.fontDisplay, fontSize: 19, fontWeight: 800, color: t.ink, letterSpacing: '-0.02em',
  },
  modalCloseBtn: {
    backgroundColor: t.surfaceAlt, border: '1px solid rgba(212,197,169,0.7)', borderRadius: 12,
    width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: t.ink, flexShrink: 0,
  },
  modalScrollArea: {
    flex: 1, overflowY: 'auto', position: 'relative', zIndex: 2
  },
  modalFooter: {
    padding: '14px 16px', paddingBottom: 'max(14px, env(safe-area-inset-bottom))', display: 'flex', gap: 10,
    backgroundColor: t.paper, borderTop: '1px solid rgba(212,197,169,0.7)', zIndex: 10, position: 'relative',
  },
  modalDismissBtn: {
    flex: 0.4, padding: '15px 8px', backgroundColor: t.surfaceAlt, border: '1px solid rgba(212,197,169,0.7)',
    color: t.ink, fontFamily: t.fontBody, fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
    letterSpacing: '1.5px', borderRadius: 999, cursor: 'pointer',
  },
  modalAcceptBtn: {
    flex: 1, padding: '15px 8px', backgroundColor: t.crimson, border: 'none', color: '#fff',
    fontFamily: t.fontBody, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.8px',
    borderRadius: 999, cursor: 'pointer', boxShadow: '0 6px 18px rgba(139,26,26,0.28)',
  },
};

export default NotificationDrawer;
```

### ./client/src/components/PolaroidCard.jsx

```
import React, { useState, memo } from 'react';
import { motion } from 'framer-motion';
import { theme as design } from '../utils/theme';

/**
 * PolaroidCard — chat image bubble.
 * Props: src, caption, tilt, onExpand
 */
const PolaroidCard = ({ src, caption, tilt = '0deg', onExpand }) => {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const resolvedSrc = failed ? design.placeholder.image : src;

  return (
    <motion.figure
      initial={{ opacity: 0, y: 8, rotate: 0 }}
      animate={{ opacity: 1, y: 0, rotate: tilt }}
      transition={{ type: 'spring', damping: 24, stiffness: 320 }}
      onClick={onExpand}
      style={{
        margin: 0,
        padding: caption ? '7px 7px 0 7px' : '7px 7px 20px 7px',
        width: '240px',
        backgroundColor: '#ffffff',
        border: '1px solid rgba(0,0,0,0.06)',
        borderRadius: 3,
        boxShadow: '0 10px 24px rgba(88,63,30,0.2)',
        cursor: onExpand ? 'zoom-in' : 'default',
        transformOrigin: 'center center',
        willChange: 'transform',
        boxSizing: 'border-box',
        contain: 'layout paint',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1 / 1',
          overflow: 'hidden',
          backgroundColor: '#f4f1ea',
          borderRadius: 2,
        }}
      >
        <img
          src={resolvedSrc}
          alt={caption || 'Shared photograph'}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => {
            setFailed(true);
            setLoaded(true);
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.4s ease-out',
          }}
        />
      </div>

      {caption ? (
        <figcaption
          style={{
            padding: '8px 2px 14px',
            fontFamily: "'Special Elite', 'Courier New', monospace",
            fontSize: '12.5px',
            lineHeight: 1.5,
            color: '#4a4a4a',
            textAlign: 'center',
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
          }}
        >
          {caption}
        </figcaption>
      ) : null}
    </motion.figure>
  );
};

export default memo(PolaroidCard);
```

### ./client/src/components/PopoutItem.jsx

```
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';
import { theme as design } from '../utils/theme';
import { Flower, Mail, ChevronDown, Send } from 'lucide-react';

/* Locked tokens — same family as ProfileCard */
const t = {
  paper: '#fdfbf7',
  surfaceAlt: '#f4f1ea',
  lineDark: '#d4c5a9',
  ink: '#1a1a1a',
  inkMuted: '#8c8275',
  accent: '#8b4513',
  crimson: '#8b1a1a',
  dark: '#211709',        // warm ink-dark panel (letter writing)
  darkRaised: '#2a1f13',
  fontDisplay: design?.font?.heading || design?.font?.display || "'Playfair Display', Georgia, serif",
  fontBody: design?.font?.body || "'Inter', -apple-system, sans-serif",
  fontType: "'Special Elite', 'Courier New', monospace",
  grain: design?.texture?.grain || '',
};

const GRAIN_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.05 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E`;

const GRAIN = t.grain || GRAIN_SVG;

const PopoutItem = ({ children, targetId, onAction, type, style, compatScore }) => {
  const [isPopped, setIsPopped] = useState(false);
  const [rect, setRect] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [actionSent, setActionSent] = useState(false);
  const [showSeal, setShowSeal] = useState(false);
  const [sealKind, setSealKind] = useState('flower');
  const [showInput, setShowInput] = useState(false);
  const [isCardExpanded, setIsCardExpanded] = useState(false);
  const pressTimer = useRef(null);
  const itemRef = useRef(null);

  const updateRect = useCallback(() => {
    if (itemRef.current) setRect(itemRef.current.getBoundingClientRect());
  }, []);

  useEffect(() => {
    if (isPopped) {
      const timer = setTimeout(() => setIsCardExpanded(true), 50);
      return () => clearTimeout(timer);
    } else {
      setIsCardExpanded(false);
    }
  }, [isPopped]);

  const handleTouchStart = () => {
    pressTimer.current = setTimeout(() => {
      triggerHaptic('medium');
      updateRect();
      setIsPopped(true);
    }, 280);
  };

  const handleTouchMove = () => clearTimeout(pressTimer.current);
  const handleTouchEnd = () => clearTimeout(pressTimer.current);
  const handleTouchCancel = () => clearTimeout(pressTimer.current);

  const triggerSealAnimation = (callback) => {
    setShowSeal(true);
    setTimeout(() => {
      setShowSeal(false);
      setIsPopped(false);
      setShowInput(false);
      setIsCardExpanded(false);
      if (callback) callback();
    }, 200);
  };

  const handleLike = () => {
    if (actionSent) return;
    setActionSent(true);
    setSealKind('flower');
    triggerHaptic('light');
    triggerSealAnimation(() => onAction('like', { target: targetId }));
  };

  // Super Like / Telegram Handler
  const handleSuperlike = () => {
    if (actionSent) return;
    setActionSent(true);
    setSealKind('telegram');
    triggerHaptic('heavy');
    triggerSealAnimation(() => onAction('superlike', { target: targetId }));
  };

  const handleNoteSubmit = () => {
    if (actionSent || !noteText.trim()) return;
    setActionSent(true);
    triggerHaptic('heavy');
    triggerSealAnimation(() => {
      onAction('like', { target: targetId, note: noteText.trim() });
      setNoteText('');
    });
  };

  const closePopout = () => {
    triggerHaptic('light');
    setShowInput(false);
    setIsPopped(false);
    setIsCardExpanded(false);
  };

  if (type === 'compatibility') {
    return (
      <div style={{ position: 'relative', width: '100%', contain: 'layout' }}>
        <div
          ref={itemRef}
          onTouchStart={handleTouchStart} onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd} onTouchCancel={handleTouchCancel}
          onContextMenu={(e) => e.preventDefault()}
          style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
        >
          <motion.div
            animate={{ scale: isPopped ? 1.04 : 1, zIndex: isPopped ? 100 : 1, boxShadow: isPopped ? '0 20px 44px rgba(88,63,30,0.3)' : '0 0px 0px transparent' }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            style={{ transform: 'translateZ(0)', willChange: 'transform' }}
          >
            {children}
          </motion.div>
        </div>
        <AnimatePresence>
          {isPopped && createPortal(
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} onClick={closePopout} className="progressive-overlay" style={{ position: 'fixed', inset: 0, zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', contain: 'strict', backgroundColor: 'rgba(28,19,10,0.72)' }}>
              <motion.div initial={{ scale: 0.92, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.94, opacity: 0, y: 16 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} onClick={(e) => e.stopPropagation()} style={{ backgroundColor: t.paper, border: '1px solid rgba(212,197,169,0.7)', borderRadius: 18, padding: '30px 26px 26px', width: '340px', maxWidth: '90vw', textAlign: 'center', position: 'relative', boxShadow: '0 24px 64px rgba(12,7,2,0.45)', overflow: 'hidden', transform: 'translateZ(0)' }}>
                <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: `url("${GRAIN}")`, mixBlendMode: 'multiply', opacity: 0.3, pointerEvents: 'none', zIndex: 1 }} />

                <h4 style={{ position: 'relative', zIndex: 2, fontFamily: t.fontDisplay, fontSize: 22, color: t.ink, margin: '0 0 8px 0', fontWeight: 800, letterSpacing: '-0.02em' }}>Compatibility Scan</h4>

                {compatScore !== undefined && compatScore !== null && (
                  <p style={{ position: 'relative', zIndex: 2, fontFamily: t.fontBody, fontSize: 13.5, fontWeight: 450, color: t.inkMuted, margin: '0 0 24px 0', lineHeight: 1.5 }}>
                    You scored <strong style={{ color: t.crimson, fontSize: 15 }}>%</strong>
                  </p>
                )}

                {/* The stamp — same language as the card's ScoreStamp, with one slow scan ring */}
                <div style={{ position: 'relative', zIndex: 2, width: 150, height: 150, margin: '0 auto 28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 24, repeat: Infinity, ease: 'linear' }} style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `1.5px dashed ${t.accent}`, opacity: 0.35 }} />
                  <motion.div initial={{ scale: 1.8, opacity: 0, rotate: -18 }} animate={{ scale: 1, opacity: 1, rotate: -6 }} transition={{ delay: 0.15, type: 'spring', damping: 16, stiffness: 260 }} style={{ width: 110, height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg viewBox="0 0 110 110" width="110" height="110">
                      <circle cx="55" cy="55" r="51" fill="none" stroke={t.crimson} strokeWidth="3" />
                      <text x="55" y="63" textAnchor="middle" fill={t.crimson} style={{ fontFamily: t.fontDisplay, fontSize: '36px', fontWeight: 900 }}>{compatScore}</text>
                      <text x="55" y="78" textAnchor="middle" fill={t.crimson} style={{ fontFamily: t.fontBody, fontSize: '9px', fontWeight: 800, letterSpacing: '2px' }}>%</text>
                    </svg>
                  </motion.div>
                </div>

                <button onClick={closePopout} style={{ position: 'relative', zIndex: 2, width: '100%', backgroundColor: t.surfaceAlt, border: '1px solid rgba(212,197,169,0.7)', padding: '15px', borderRadius: 999, fontFamily: t.fontBody, fontSize: 11, fontWeight: 800, letterSpacing: '1.8px', textTransform: 'uppercase', color: t.ink, cursor: 'pointer', boxShadow: '0 4px 12px rgba(88,63,30,0.12)' }}>Close</button>
              </motion.div>
            </motion.div>,
            document.body
          )}
        </AnimatePresence>
      </div>
    );
  }

  const completionPercentage = Math.min((noteText.length / 50) * 100, 100);

  return (
    <div
      ref={itemRef}
      onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
      onContextMenu={(e) => e.preventDefault()}
      style={{ position: 'relative', width: '100%', height: '100%', WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none', ...style }}
    >
      <motion.div
        animate={{ scale: isPopped ? 1.04 : 1, zIndex: isPopped ? 100 : 1, boxShadow: isPopped ? '0 24px 48px rgba(28,19,10,0.35)' : '0 0px 0px transparent' }}
        transition={{ type: 'spring', damping: 22, stiffness: 300 }}
        style={{ height: '100%', transformOrigin: 'center', borderRadius: 6, willChange: 'transform, box-shadow' }}
      >
        {children}
      </motion.div>

      <AnimatePresence>
        {showSeal && rect && createPortal(
          <motion.div initial={{ opacity: 0, scale: 2.5, rotate: -20 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ type: 'spring', damping: 14, stiffness: 200 }} style={{ position: 'fixed', top: rect.top + (rect.height / 2) - 40, left: rect.left + (rect.width / 2) - 40, width: '80px', height: '80px', zIndex: 10000, pointerEvents: 'none' }}>
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', backgroundColor: sealKind === 'telegram' ? t.accent : t.crimson, boxShadow: '0 10px 25px rgba(28,19,10,0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <span aria-hidden="true" style={{ position: 'absolute', inset: 7, borderRadius: '50%', border: '1px dashed rgba(253,251,247,0.4)' }} />
              {sealKind === 'telegram' ? <Send size={20} color="#fff" strokeWidth={2.5} /> : <Flower size={20} color="#fff" strokeWidth={2.5} />}
              <span style={{ fontFamily: t.fontBody, fontSize: 7, fontWeight: 800, color: '#ffffff', letterSpacing: '1.8px', marginTop: 4 }}>{sealKind === 'telegram' ? 'TELEGRAM' : 'AFFIXED'}</span>
            </div>
          </motion.div>,
          document.body
        )}
      </AnimatePresence>

      {isPopped && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="progressive-overlay"
            style={{ position: 'fixed', inset: 0, zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', transform: 'translateZ(0)', backgroundColor: 'rgba(28,19,10,0.72)' }}
          >
            <div className="scrollable-safe-area" onClick={closePopout}>
              <motion.div
                initial={{ scale: 0.85, opacity: 0, y: 40, rotate: -3 }}
                animate={{ scale: 1, opacity: 1, y: 0, rotate: 0 }}
                exit={{ scale: 0.7, opacity: 0, y: 80, rotate: 5 }}
                transition={{ type: 'spring', damping: 24, stiffness: 320 }}
                className={`sandwich-container ${isCardExpanded ? 'expanded' : ''}`}
                drag={!showInput}
                dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
                dragElastic={0.7}
                onDragEnd={(e, info) => {
                  if (Math.hypot(info.offset.x, info.offset.y) > 80) closePopout();
                }}
                onClick={(e) => e.stopPropagation()}
                style={{ willChange: 'transform', transform: 'translateZ(0)', touchAction: 'none' }}
              >
                {/* Top panel: Flower & Telegram */}
                <div className="panel-wrapper panel-top">
                  <div className="panel-inner panel-light" style={{ display: 'flex', flexDirection: 'row', height: '72px', padding: 0 }}>
                    <button onClick={handleLike} disabled={actionSent} className="action-btn flower-btn" style={{ flex: 1, height: '100%', borderRight: `1px solid ${t.lineDark}`, margin: 0, borderRadius: '12px 0 0 0' }}>
                      <Flower size={18} strokeWidth={2.5} /> Flower
                    </button>
                    <button onClick={handleSuperlike} disabled={actionSent} className="action-btn" style={{ flex: 1, height: '100%', color: t.accent, margin: 0, borderRadius: '0 12px 0 0' }}>
                      <Send size={18} strokeWidth={2.5} /> Telegram
                    </button>
                  </div>
                </div>

                <div className="sandwich-center" onClick={() => setIsCardExpanded(!isCardExpanded)}>
                  <div className="card-content-inner">
                    {children}
                  </div>
                </div>

                <div className="panel-wrapper panel-bottom">
                  <div className="panel-inner panel-dark">
                    <div className={`letter-accordion ${showInput ? 'input-active' : ''}`}>
                      <button
                        onClick={(e) => { e.stopPropagation(); triggerHaptic('light'); setShowInput(true); }}
                        disabled={actionSent || showInput}
                        className={`action-btn letter-btn ${showInput ? 'hide-trigger' : ''}`}
                      >
                        <Mail size={18} strokeWidth={2.5} /> Send a Letter
                      </button>
                      <div className="input-area">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px', marginBottom: '8px' }}>
                          <span style={{ fontFamily: t.fontBody, fontSize: 9.5, fontWeight: 800, color: 'rgba(253,251,247,0.4)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Draft Correspondence</span>
                          <button onClick={(e) => { e.stopPropagation(); setShowInput(false); }} aria-label="Collapse" style={{ background: 'none', border: 'none', color: 'rgba(253,251,247,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <ChevronDown size={16} strokeWidth={2} />
                          </button>
                        </div>
                        <div className="premium-input-container">
                          <textarea
                            className="premium-input"
                            placeholder="I noticed that you also..."
                            required
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            autoFocus={showInput}
                          />
                          <div className="completion-bar-bg">
                            <div className="completion-bar-fill" style={{ width: `${completionPercentage}%` }} />
                          </div>
                        </div>
                        <button
                          className={`premium-send-btn ${noteText.trim() ? 'ready-to-send' : ''}`}
                          onClick={handleNoteSubmit}
                          disabled={!noteText.trim()}
                        >
                          Dispatch Letter
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
            <style>{`
              .scrollable-safe-area { width: 100%; height: 100%; position: absolute; inset: 0; overflow-y: auto; display: flex; justify-content: center; align-items: center; padding: 24px 0; -webkit-overflow-scrolling: touch; contain: strict; }
              .scrollable-safe-area::-webkit-scrollbar { display: none; }
              .sandwich-container { display: flex; flex-direction: column; align-items: center; width: 100%; max-width: 328px; position: relative; }
              .sandwich-center { position: relative; z-index: 5; width: 100%; transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1); backface-visibility: hidden; }
              .sandwich-container.expanded .sandwich-center { transform: scale(1.03); }
              .card-content-inner { width: 100%; position: relative; z-index: 2; display: flex; justify-content: center; align-items: center; }
              .card-content-inner * { transform: rotate(0deg) !important; }
              .card-content-inner div[style*="pointer-events: none"] { display: none !important; }
              .card-content-inner > div { box-shadow: 0 30px 60px rgba(12,7,2,0.55) !important; }
              .panel-wrapper { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.4s cubic-bezier(0.22, 1, 0.36, 1); width: 100%; z-index: 1; will-change: grid-template-rows; }
              .sandwich-container.expanded .panel-wrapper { grid-template-rows: 1fr; }
              .panel-inner { overflow: hidden; display: flex; flex-direction: column; transform: translateZ(0); }
              .panel-light { background: ${t.surfaceAlt}; border: 1px solid ${t.lineDark}; border-top-left-radius: 12px; border-top-right-radius: 12px; border-bottom: none; }
              .panel-dark { background: ${t.dark}; border: 1px solid rgba(0,0,0,0.35); border-bottom-left-radius: 12px; border-bottom-right-radius: 12px; border-top: none; padding-top: 16px; }
              .action-btn { display: flex; align-items: center; justify-content: center; gap: 12px; width: 100%; height: 72px; background: transparent; border: none; font-family: 'Playfair Display', Georgia, serif; font-size: 19px; font-weight: 700; cursor: pointer; letter-spacing: -0.02em; line-height: 1.15; transition: transform 0.1s ease-out; }
              .action-btn:active { transform: scale(0.96); }
              .flower-btn { color: ${t.crimson}; }
              .letter-btn { color: ${t.paper}; transition: opacity 0.2s; }
              .letter-btn.hide-trigger { opacity: 0; pointer-events: none; position: absolute; }
              .letter-accordion { display: flex; flex-direction: column; overflow: hidden; height: 72px; transition: height 0.4s cubic-bezier(0.22, 1, 0.36, 1); will-change: height; position: relative; }
              .letter-accordion.input-active { height: 264px; }
              .input-area { display: flex; flex-direction: column; padding: 0 16px 20px; gap: 16px; opacity: 0; transition: opacity 0.3s ease; will-change: opacity; position: absolute; top: 0; left: 0; right: 0; pointer-events: none; }
              .letter-accordion.input-active .input-area { opacity: 1; transition-delay: 0.15s; pointer-events: auto; }
              .premium-input-container { position: relative; width: 100%; border-radius: 6px; overflow: hidden; }
              .premium-input { width: 100%; height: 110px; resize: none; border: none; padding: 16px; font-family: 'Special Elite', 'Courier New', monospace; font-size: 14.5px; color: ${t.paper}; background: ${t.darkRaised}; outline: none; line-height: 1.55; transition: background 0.2s; }
              .premium-input:focus { background: #332718; }
              .premium-input::placeholder { color: rgba(253,251,247,0.35); opacity: 1; }
              .completion-bar-bg { width: 100%; height: 3px; background: rgba(253,251,247,0.1); position: absolute; bottom: 0; left: 0; }
              .completion-bar-fill { height: 100%; background: ${t.crimson}; transition: width 0.3s ease-out; }
              .premium-send-btn { height: 52px; width: 100%; border-radius: 999px; background: rgba(253,251,247,0.08); color: rgba(253,251,247,0.35); border: none; cursor: not-allowed; font-weight: 800; font-family: 'Inter', -apple-system, sans-serif; font-size: 11px; letter-spacing: 1.8px; text-transform: uppercase; transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1); }
              .premium-send-btn.ready-to-send { background: ${t.crimson}; color: #ffffff; cursor: pointer; box-shadow: 0 8px 24px rgba(139, 26, 26, 0.4); }
              .premium-send-btn.ready-to-send:active { transform: scale(0.96); box-shadow: 0 2px 8px rgba(139, 26, 26, 0.5); }
            `}</style>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default PopoutItem;
```

### ./client/src/components/ProfileCard.jsx

```
import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion, useMotionValue, useTransform, animate } from 'framer-motion';
import PopoutItem from './PopoutItem';
import ReportModal from './chat/ReportModal';
import { theme as design } from '../utils/theme';
import { triggerHaptic } from '../utils/haptics';
import { toast } from '../utils/toast';
import { Sparkle, MapPin, MoreVertical, Award, Calendar, Flag, Paperclip, Sliders, Star, X, ArrowDown } from 'lucide-react';

const theme = {
  color: {
    paper: '#fdfbf7',
    card: '#fffdf8',
    surfaceAlt: '#f4f1ea',
    lineDark: '#d4c5a9',
    ink: '#1a1a1a',
    inkSoft: '#4a4a4a',
    inkMuted: '#8c8275',
    accent: '#8b4513',
    crimson: '#8b1a1a',
    gold: '#e6b17a',
  },
  font: {
    display: design?.font?.heading || "'Playfair Display', Georgia, serif",
    body: design?.font?.body || "'Inter', -apple-system, sans-serif",
    typewriter: "'Special Elite', 'Courier New', monospace",
  },
};

const OVERSCROLL_THRESHOLD = 110;

/* One deliberate alternating system, capped at 1.2°. Wide items stay straight. */
const TILTS = { prompt_0: '0.8deg', photo_1: '-1.2deg', photo_2: '1.2deg', prompt_1: '-0.8deg', prompt_2: '0deg', photo_3: '0deg' };

function matchStatus(score) {
  if (score >= 85) return 'Exceptional Match';
  if (score >= 65) return 'High Compatibility';
  if (score >= 40) return 'Potential Resonance';
  return 'Exploratory';
}

/* ============================================================
   PULL INDICATOR — capsule that stretches with drag.
   Cross = dismiss to NEXT profile. Arrow = go to PREVIOUS.
   Icon rides a physical token inside the track.
============================================================ */
const TRACK_W = 40;
const TOKEN = 26;

const InkPullIndicator = ({ dragY }) => {
  const progressRaw = useTransform(dragY, [-OVERSCROLL_THRESHOLD, 0, OVERSCROLL_THRESHOLD], [1, 0, 1]);
  const progress = useTransform(progressRaw, (val) => Math.min(Math.max(val, 0), 1));
  const isTopPull = useTransform(dragY, (y) => y > 0);
  const zoneOpacity = useTransform(progressRaw, [0.08, 0.3], [0, 1]);
  const topVariantOpacity = useTransform(isTopPull, (t) => (t ? 1 : 0));
  const bottomVariantOpacity = useTransform(isTopPull, (t) => (t ? 0 : 1));

  const stretch = useTransform(dragY, (y) => 56 + Math.min(Math.abs(y), 150) * 0.6);
  const borderColor = useTransform(progress, [0, 0.88, 1], ['rgba(212,197,169,0.9)', 'rgba(212,197,169,0.9)', theme.color.crimson]);

  const travelNext = useTransform(dragY, (y) => {
    const a = Math.max(0, -y);
    const p = Math.min(a / OVERSCROLL_THRESHOLD, 1);
    const h = 56 + Math.min(a, 150) * 0.6;
    return (h - TOKEN - 12) * (1 - p);
  });
  const travelPrev = useTransform(dragY, (y) => {
    const a = Math.max(0, y);
    const p = Math.min(a / OVERSCROLL_THRESHOLD, 1);
    const h = 56 + Math.min(a, 150) * 0.6;
    return 6 + (h - TOKEN - 12) * p;
  });

  const thumbScale = useTransform(progress, [0.85, 1], [1, 1.18]);
  const armedOpacity = useTransform(progress, [0.9, 1], [0, 1]);
  const defaultLabelOpacity = useTransform(progress, [0.88, 1], [1, 0]);

  const labelPill = {
    display: 'inline-flex', alignItems: 'center', padding: '6px 13px', borderRadius: 999,
    backgroundColor: 'rgba(253,251,247,0.94)', border: '1px solid rgba(212,197,169,0.9)',
    boxShadow: '0 4px 12px rgba(88,63,30,0.18)',
    fontFamily: theme.font.body, fontSize: 8.5, fontWeight: 900, letterSpacing: '1.8px', textTransform: 'uppercase', whiteSpace: 'nowrap',
  };

  const tokenStyle = {
    width: TOKEN, height: TOKEN, borderRadius: TOKEN / 2,
    backgroundColor: theme.color.surfaceAlt,
    border: '1px solid rgba(212,197,169,0.9)',
    boxShadow: '0 2px 6px rgba(88,63,30,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };

  return (
    <motion.div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 60, opacity: zoneOpacity }}>

      {/* BOTTOM — cross = dismiss this profile, move to the next */}
      <motion.div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 'max(16px, env(safe-area-inset-bottom))', opacity: bottomVariantOpacity }}>
        <motion.div style={{ width: TRACK_W, height: stretch, borderRadius: TRACK_W / 2, backgroundColor: theme.color.paper, border: '1.5px solid', borderColor, boxShadow: '0 10px 26px rgba(88,63,30,0.3)', position: 'relative', display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>
          <motion.div style={{ position: 'absolute', top: travelNext, scale: thumbScale }}>
            <div style={tokenStyle}>
              <X size={13} strokeWidth={3} color={theme.color.crimson} />
            </div>
          </motion.div>
        </motion.div>
        <div style={{ position: 'relative', marginTop: 12, height: 28, display: 'flex', justifyContent: 'center' }}>
          <motion.span style={{ position: 'absolute', opacity: defaultLabelOpacity }}>
            <span style={{ ...labelPill, color: theme.color.inkMuted }}>Pull up · next profile</span>
          </motion.span>
          <motion.span style={{ position: 'absolute', opacity: armedOpacity }}>
            <span style={{ ...labelPill, color: theme.color.crimson, borderColor: theme.color.crimson }}>Release</span>
          </motion.span>
        </div>
      </motion.div>

      {/* TOP — arrow = go back to the previous profile */}
      <motion.div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 'max(16px, env(safe-area-inset-top))', opacity: topVariantOpacity }}>
        <div style={{ position: 'relative', marginBottom: 12, height: 28, display: 'flex', justifyContent: 'center' }}>
          <motion.span style={{ position: 'absolute', opacity: defaultLabelOpacity }}>
            <span style={{ ...labelPill, color: theme.color.inkMuted }}>Pull down · previous profile</span>
          </motion.span>
          <motion.span style={{ position: 'absolute', opacity: armedOpacity }}>
            <span style={{ ...labelPill, color: theme.color.crimson, borderColor: theme.color.crimson }}>Release</span>
          </motion.span>
        </div>
        <motion.div style={{ width: TRACK_W, height: stretch, borderRadius: TRACK_W / 2, backgroundColor: theme.color.paper, border: '1.5px solid', borderColor, boxShadow: '0 10px 26px rgba(88,63,30,0.3)', position: 'relative', display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>
          <motion.div style={{ position: 'absolute', top: travelPrev, scale: thumbScale }}>
            <div style={tokenStyle}>
              <ArrowDown size={14} strokeWidth={3} color={theme.color.crimson} />
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

/* ---------------- Floating paper panel ---------------- */
const Panel = ({ children, style }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.15 }}
    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    style={{
      backgroundColor: theme.color.paper,
      border: '1px solid rgba(212,197,169,0.7)',
      borderRadius: 18,
      boxShadow: '0 14px 34px rgba(88,63,30,0.16), 0 3px 8px rgba(88,63,30,0.08)',
      position: 'relative',
      ...style,
    }}
  >
    {children}
  </motion.div>
);

const Reveal = ({ children, style }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.15 }}
    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    style={style}
  >
    {children}
  </motion.div>
);

/* ---------------- Small shared pieces ---------------- */
/* Panel headings — same treatment as the vitals field labels. One system. */
const PanelHeader = ({ icon: Icon, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
    <Icon size={12} color={theme.color.accent} />
    <span style={{ fontFamily: theme.font.body, fontSize: 9.5, fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', color: theme.color.inkMuted }}>{children}</span>
  </div>
);

const Tape = ({ style }) => (
  <span aria-hidden="true" style={{ position: 'absolute', top: -9, width: 42, height: 15, backgroundColor: 'rgba(224,216,200,0.9)', border: '1px solid rgba(139,69,19,0.18)', zIndex: 5, boxShadow: '0 1px 2px rgba(0,0,0,0.06)', ...style }} />
);

const HoldHint = React.memo(() => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', backgroundColor: 'rgba(253,251,247,0.92)', border: '1px solid rgba(139,69,19,0.25)', borderRadius: 3, pointerEvents: 'none', color: theme.color.inkMuted, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
    <span style={{ fontFamily: theme.font.body, fontSize: 8, fontWeight: 800, letterSpacing: '1.5px' }}>HOLD</span>
  </div>
));

const FieldCell = ({ icon: Icon, label, value }) => (
  <div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
      <Icon size={12} color={theme.color.accent} />
      <span style={{ fontFamily: theme.font.body, fontSize: 9.5, fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', color: theme.color.inkMuted }}>{label}</span>
    </div>
    <div style={{ fontFamily: theme.font.typewriter, fontSize: 14, fontWeight: 600, color: theme.color.ink, borderBottom: '1.5px dotted rgba(139,69,19,0.45)', paddingBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
  </div>
);

const ScoreStamp = ({ score }) => {
  const ringColor = score >= 85 ? theme.color.crimson : theme.color.accent;
  return (
    <div style={{ width: 88, height: 88, flexShrink: 0, transform: 'rotate(-6deg)' }}>
      <svg viewBox="0 0 88 88" width="88" height="88">
        <circle cx="44" cy="44" r="41" fill="none" stroke={ringColor} strokeWidth="2.5" />
        <text x="44" y="52" textAnchor="middle" fill={ringColor} style={{ fontFamily: theme.font.display, fontSize: '30px', fontWeight: 900 }}>{score}</text>
        <text x="44" y="64" textAnchor="middle" fill={ringColor} style={{ fontFamily: theme.font.body, fontSize: '7px', fontWeight: 800, letterSpacing: '2px' }}>%</text>
      </svg>
    </div>
  );
};

const StampChip = ({ children }) => (
  <span style={{ display: 'inline-block', transform: 'rotate(-1.2deg)', border: `1.5px solid ${theme.color.crimson}`, color: theme.color.crimson, fontFamily: theme.font.body, fontSize: 10, fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase', padding: '6px 10px', borderRadius: 4, backgroundColor: 'rgba(139,26,26,0.04)' }}>{children}</span>
);

const PaperTag = ({ children }) => (
  <span style={{ display: 'inline-block', backgroundColor: theme.color.paper, border: `1px solid ${theme.color.lineDark}`, padding: '8px 12px', borderRadius: 4, fontFamily: theme.font.typewriter, fontSize: 12, fontWeight: 600, color: theme.color.inkSoft, boxShadow: '0 2px 6px rgba(88,63,30,0.12)' }}>{children}</span>
);

const Polaroid = ({ src, alt, tilt = '0deg', aspect = '1 / 1' }) => (
  <div style={{ position: 'relative', transform: `rotate(${tilt})`, backgroundColor: '#ffffff', padding: '7px 7px 20px', borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 10px 24px rgba(88,63,30,0.2)', zIndex: 1 }}>
    <div style={{ width: '100%', aspectRatio: aspect, overflow: 'hidden', backgroundColor: theme.color.surfaceAlt }}>
      <img src={src} alt={alt} loading="lazy" decoding="async" onLoad={(e) => { e.currentTarget.style.opacity = 1; }} onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/400x500'; e.currentTarget.style.opacity = 1; }} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0, transition: 'opacity 0.4s ease-out' }} />
    </div>
    <div style={{ position: 'absolute', bottom: 4, right: 8, zIndex: 5 }}><HoldHint /></div>
  </div>
);

const IndexCard = ({ children, tilt = '0deg' }) => (
  <div style={{ position: 'relative', transform: `rotate(${tilt})`, zIndex: 1 }}>
    <Tape style={{ left: 18, transform: 'rotate(-5deg)' }} />
    <div style={{ backgroundColor: theme.color.card, backgroundImage: 'linear-gradient(rgba(139,69,19,0.08) 1px, transparent 1px)', backgroundSize: '100% 20px', backgroundPosition: '0 14px', border: '1px solid rgba(139,69,19,0.25)', borderRadius: 6, padding: '20px 16px 16px 34px', minHeight: 130, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', boxShadow: '0 8px 20px rgba(88,63,30,0.16)' }}>
      <span aria-hidden="true" style={{ position: 'absolute', top: 0, bottom: 0, left: 24, width: 1, backgroundColor: 'rgba(139,26,26,0.3)' }} />
      <span aria-hidden="true" style={{ fontFamily: theme.font.display, fontSize: 34, lineHeight: 0.5, opacity: 0.25, marginBottom: 10, color: theme.color.accent, display: 'block' }}>“</span>
      <p style={{ fontFamily: theme.font.typewriter, fontSize: 13.5, color: theme.color.ink, margin: 0, lineHeight: 1.55, fontWeight: 600, wordBreak: 'break-word' }}>{children}</p>
      <div style={{ position: 'absolute', bottom: 8, right: 8, zIndex: 4 }}><HoldHint /></div>
    </div>
  </div>
);

/* ---------------- Main card ---------------- */
const ProfileCard = ({ profile = {}, scrollRef: externalScrollRef, onAction, onNavigate }) => {
  const localScrollRef = useRef(null);
  const scrollContainer = externalScrollRef || localScrollRef;
  const heroImgRef = useRef(null);

  const targetScore = Math.min(100, Math.max(0, profile.compatScore || 0));
  const [displayScore, setDisplayScore] = useState(0);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [heroLoaded, setHeroLoaded] = useState(false);

  const dragY = useMotionValue(0);
  const touchStartY = useRef(0);
  const isAtBoundary = useRef(false);
  const boundaryType = useRef(null);

  const currentUser = (() => { try { return JSON.parse(localStorage.getItem('matchalize_user')) || {}; } catch { return {}; } })();
  const sharedInterests = (profile.interests || []).filter(i => (currentUser.interests || []).includes(i));
  const userIntent = Array.isArray(currentUser.intent) ? currentUser.intent : [currentUser.intent];
  const profileIntent = Array.isArray(profile.intent) ? profile.intent : [profile.intent];
  const sharedIntent = profileIntent.filter(i => userIntent.includes(i));
  const compatMatches = (() => {
    const userAnswers = currentUser.compatAnswers || [];
    const profileAnswers = profile.compatAnswers || [];
    return userAnswers.filter(a => profileAnswers.some(b => b.question === a.question && b.answer === a.answer));
  })();

  const grainUrl = design?.texture?.grain || '';

  useEffect(() => { if (heroImgRef.current?.complete) setHeroLoaded(true); }, [profile.photos]);

  useEffect(() => {
    let startTimestamp = null;
    let animationFrameId = null;
    const duration = 1600;
    const startScore = displayScore;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      setDisplayScore(Math.round(startScore + (targetScore - startScore) * easeProgress));
      if (progress < 1) animationFrameId = window.requestAnimationFrame(step);
    };
    const timer = setTimeout(() => { animationFrameId = window.requestAnimationFrame(step); }, 300);
    return () => { clearTimeout(timer); if (animationFrameId) window.cancelAnimationFrame(animationFrameId); };
  }, [targetScore]);

  const handleTouchStart = (e) => {
    if (!scrollContainer.current) return;
    touchStartY.current = e.touches[0].clientY;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainer.current;
    if (scrollTop <= 0) { isAtBoundary.current = true; boundaryType.current = 'top'; }
    else if (Math.ceil(scrollTop + clientHeight) >= scrollHeight - 1) { isAtBoundary.current = true; boundaryType.current = 'bottom'; }
    else { isAtBoundary.current = false; boundaryType.current = null; }
  };

  const handleTouchMove = (e) => {
    if (!isAtBoundary.current) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartY.current;
    if (boundaryType.current === 'top' && deltaY > 0) { dragY.set(deltaY); }
    else if (boundaryType.current === 'bottom' && deltaY < 0) { dragY.set(deltaY); }
  };

  const handleTouchEnd = () => {
    const currentDrag = dragY.get();
    if (Math.abs(currentDrag) >= OVERSCROLL_THRESHOLD) {
      triggerHaptic('heavy');
      if (onNavigate) {
        const direction = currentDrag > 0 ? 'down' : 'up';
        onNavigate(direction, false);
      }
    }
    animate(dragY, 0, { type: 'spring', stiffness: 400, damping: 25 });
    isAtBoundary.current = false;
    boundaryType.current = null;
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', backgroundColor: '#ece4d4' }}>

      <style>{`
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; overscroll-behavior-y: none; }
        .tactile-btn { transition: transform 0.15s ease-out; will-change: transform; }
        .tactile-btn:active { transform: scale(0.96) !important; }
        .neu-flat {
          background: #f4f1ea; border-radius: 20px;
          box-shadow: 8px 8px 16px #dedad2, -8px -8px 16px #ffffff; border: none;
        }
        .neu-pressed {
          background: #f4f1ea; border-radius: 12px;
          box-shadow: inset 6px 6px 12px #dedad2, inset -6px -6px 12px #ffffff; border: none;
        }
        .neu-pill {
          background: #f4f1ea; border-radius: 50px;
          box-shadow: 4px 4px 8px #dedad2, -4px -4px 8px #ffffff; border: none; color: #8b1a1a;
        }
      `}</style>

      {/* Tap-anywhere dismiss layer for the profile menu */}
      {showProfileMenu && (
        <div onClick={() => setShowProfileMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 45, background: 'transparent' }} />
      )}

      {/* Continuous warm desk surface + one unifying grain film */}
      {grainUrl && (
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: `url("${grainUrl}")`, mixBlendMode: 'multiply', opacity: 0.3, pointerEvents: 'none', zIndex: 2 }} />
      )}

      <InkPullIndicator dragY={dragY} />

      <div
        ref={scrollContainer}
        className="hide-scroll"
        onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
        style={{
          width: '100%', height: '100%',
          overflowY: 'auto', WebkitOverflowScrolling: 'touch',
          position: 'relative', zIndex: 1,
          padding: '16px 14px 44px 14px',
          willChange: 'scroll-position'
        }}
      >
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* ============ HERO PANEL — clean, no spine ============ */}
          <div style={{
            width: '100%',
            height: 'calc(100dvh - 130px)',
            flexShrink: 0,
            position: 'relative',
            borderRadius: 18,
            overflow: 'hidden',
            border: '1px solid rgba(212,197,169,0.7)',
            boxShadow: '0 18px 44px rgba(88,63,30,0.28), 0 4px 12px rgba(88,63,30,0.14)',
            backgroundColor: '#000',
          }}>
            <img ref={heroImgRef} src={profile.photos?.[0] || 'https://via.placeholder.com/600x800'} alt={profile.name} onLoad={() => setHeroLoaded(true)} decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: heroLoaded ? 1 : 0, transition: 'opacity 0.4s ease-out' }} />
            <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,12,10,0.95) 0%, rgba(15,12,10,0.4) 40%, transparent 100%)', pointerEvents: 'none' }} />

            <div style={{ position: 'absolute', bottom: '32px', left: '24px', right: '24px', zIndex: 5 }}>
              <h2 style={{ fontFamily: theme.font.display, fontSize: '38px', color: '#fff', margin: 0, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.05, textShadow: '0 2px 16px rgba(0,0,0,0.5)' }}>
                {profile.name || 'Anonymous'}<span style={{ fontWeight: 400, fontStyle: 'italic', opacity: 0.85 }}>, {profile.age || '—'}</span>
              </h2>
              <p style={{ fontFamily: theme.font.typewriter, fontSize: '11px', color: 'rgba(255,255,255,0.9)', margin: '10px 0 0 0', letterSpacing: '2px', textTransform: 'uppercase', display: 'flex', alignItems: 'center' }}>
                {profile.branch || 'General'}
                <span style={{ color: theme.color.gold, margin: '0 9px' }}>·</span>
                Era {profile.year || '20XX'}
              </p>
            </div>

            <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 50 }}>
              <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="tactile-btn" style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: 12, backgroundColor: 'rgba(253,251,247,0.92)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.7)', color: theme.color.ink, boxShadow: '0 4px 12px rgba(0,0,0,0.25)' }}><MoreVertical size={18} /></button>
              {showProfileMenu && (
                <motion.div initial={{ opacity: 0, y: -6, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} style={{ position: 'absolute', top: 50, right: 0, zIndex: 55, minWidth: 160, padding: 6, backgroundColor: theme.color.paper, border: `1px dashed ${theme.color.lineDark}`, borderRadius: 8, boxShadow: '0 12px 28px rgba(0,0,0,0.22)' }}>
                  <button onClick={() => { triggerHaptic('light'); setShowProfileMenu(false); setShowReport(true); }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 12px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontFamily: theme.font.body, fontSize: 12, color: theme.color.crimson, fontWeight: 800, borderRadius: 5 }}><Flag size={13} /> Report Profile</button>
                </motion.div>
              )}
            </div>
          </div>

          {/* ============ COMPATIBILITY — first panel after the photo ============ */}
          <Panel style={{ padding: '22px 20px' }}>
            <PopoutItem targetId="compatibility" onAction={onAction} type="compatibility" compatScore={targetScore}>
              <div style={{ cursor: 'pointer', position: 'relative', zIndex: 1 }}>
                {targetScore > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 18 }}>
                    <ScoreStamp score={displayScore} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontFamily: theme.font.display, fontSize: 18, fontWeight: 800, color: theme.color.ink, lineHeight: 1.2 }}>{matchStatus(targetScore)}</span>
                      <span style={{ fontFamily: theme.font.typewriter, fontSize: 11, color: theme.color.inkMuted, lineHeight: 1.4 }}>Based on 7 compatibility metrics</span>
                    </div>
                  </div>
                )}
                <div style={{ border: '1px solid rgba(139,69,19,0.3)', borderRadius: 6, padding: '14px 16px', backgroundColor: 'rgba(139,69,19,0.03)' }}>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {sharedInterests.length > 0 && (
                      <li style={{ fontSize: 13, color: theme.color.inkSoft, display: 'flex', alignItems: 'flex-start', gap: 8, fontFamily: theme.font.body }}><span style={{ color: theme.color.crimson, fontWeight: 700 }}>•</span><span>You both love {sharedInterests.join(' and ')}.</span></li>
                    )}
                    {sharedIntent.length > 0 && (
                      <li style={{ fontSize: 13, color: theme.color.inkSoft, display: 'flex', alignItems: 'flex-start', gap: 8, fontFamily: theme.font.body }}><span style={{ color: theme.color.crimson, fontWeight: 700 }}>•</span><span>You are both looking for {sharedIntent.join(' and ')}.</span></li>
                    )}
                    {compatMatches.length > 0 && (
                      <li style={{ fontSize: 13, color: theme.color.inkSoft, display: 'flex', alignItems: 'flex-start', gap: 8, fontFamily: theme.font.body }}><span style={{ color: theme.color.crimson, fontWeight: 700 }}>•</span><span>You both chose "{compatMatches[0].answer}" for "{compatMatches[0].question}".</span></li>
                    )}
                    {sharedInterests.length === 0 && sharedIntent.length === 0 && compatMatches.length === 0 && (
                      <li style={{ fontSize: 13, color: theme.color.inkMuted, display: 'flex', alignItems: 'flex-start', gap: 8, fontFamily: theme.font.body, fontStyle: 'italic' }}><span>•</span><span>Discover something new about each other.</span></li>
                    )}
                  </ul>
                </div>
                <div style={{ position: 'absolute', top: -4, right: 0, zIndex: 3 }}><HoldHint /></div>
              </div>
            </PopoutItem>
          </Panel>

          {/* ============ VITALS PANEL ============ */}
          <Panel style={{ padding: '22px 20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 14px' }}>
              <FieldCell icon={MapPin} label="Hostel" value={profile.hostel || 'Campus'} />
              <FieldCell icon={Calendar} label="Year" value={profile.year || '—'} />
              <FieldCell icon={Award} label="Branch" value={profile.branch || 'General'} />
              <FieldCell icon={Sparkle} label="Pronouns" value={profile.pronouns || '—'} />
            </div>
          </Panel>

          {/* ============ BIO — loose artifact ============ */}
          {profile.bio && (
            <Reveal>
              <div style={{ position: 'relative' }}>
                <Paperclip size={30} strokeWidth={1.75} color="#6f6a5c" style={{ position: 'absolute', top: -16, left: 16, transform: 'rotate(-8deg)', zIndex: 6, filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.2))' }} />
                <IndexCard tilt="-0.5deg">{profile.bio}</IndexCard>
              </div>
            </Reveal>
          )}

          {/* ============ SEEKING PANEL — headed groups, one radius system ============ */}
          <Panel style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <PanelHeader icon={Sliders}>Seeking</PanelHeader>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
                {(profile.intent && profile.intent.length > 0 ? profile.intent : ['Connection']).map((item, i) => (
                  <StampChip key={i}>{item}</StampChip>
                ))}
              </div>
            </div>
            {profile.interests && profile.interests.length > 0 && (
              <div>
                <PanelHeader icon={Star}>Interests</PanelHeader>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
                  {profile.interests.map((interest, i) => (
                    <PaperTag key={i}>{interest}</PaperTag>
                  ))}
                </div>
              </div>
            )}
          </Panel>

          {/* ============ EXHIBITS — loose artifacts ============ */}
          <Reveal>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px 16px', alignItems: 'center', paddingTop: 4 }}>
              <PopoutItem targetId="prompt_0" onAction={onAction} style={{ height: 'auto' }}><IndexCard tilt={TILTS.prompt_0}>{profile.prompts?.[0]?.question || "A shower thought I recently had..."}</IndexCard></PopoutItem>

              {profile.photos?.[1] && <PopoutItem targetId="photo_1" onAction={onAction}><Polaroid src={profile.photos[1]} alt="photo" tilt={TILTS.photo_1} /></PopoutItem>}
              {profile.photos?.[2] && <PopoutItem targetId="photo_2" onAction={onAction}><Polaroid src={profile.photos[2]} alt="photo" tilt={TILTS.photo_2} /></PopoutItem>}

              <PopoutItem targetId="prompt_1" onAction={onAction} style={{ height: 'auto' }}><IndexCard tilt={TILTS.prompt_1}>{profile.prompts?.[1]?.question || "My ideal weekend looks like..."}</IndexCard></PopoutItem>

              {profile.prompts?.[2] && <PopoutItem targetId="prompt_2" onAction={onAction} style={{ gridColumn: 'span 2', height: 'auto' }}><IndexCard tilt={TILTS.prompt_2}>{profile.prompts[2].question}</IndexCard></PopoutItem>}
              {profile.photos?.[3] && <PopoutItem targetId="photo_3" onAction={onAction} style={{ gridColumn: 'span 2' }}><Polaroid src={profile.photos[3]} alt="photo" tilt={TILTS.photo_3} aspect="16 / 9" /></PopoutItem>}
            </div>
          </Reveal>
        </div>
      </div>

      <AnimatePresence>
        {showReport && profile._id && <ReportModal reportedUserId={profile._id} onClose={() => setShowReport(false)} onReported={() => { setShowReport(false); toast.success('Report submitted.'); }} />}
      </AnimatePresence>
    </div>
  );
};

export default ProfileCard;
```

### ./client/src/components/ProfileCardSkeleton.jsx

```
import React from 'react';
import { theme as design } from '../utils/theme';

const theme = {
  paper: '#fdfbf7',
  card: '#fffdf8',
  surfaceAlt: '#f4f1ea',
  lineDark: '#d4c5a9',
  desk: '#ece4d4',
};

/* One skeleton primitive — every placeholder is a shimmering bar */
const Bar = ({ w = '100%', h = 12, r = 6, style }) => (
  <div
    className="pc-skeleton-shimmer"
    style={{ width: w, height: h, borderRadius: r, backgroundColor: theme.surfaceAlt, position: 'relative', overflow: 'hidden', flexShrink: 0, ...style }}
  />
);

/* Matches the Panel primitive in ProfileCard exactly */
const panelStyle = {
  backgroundColor: theme.paper,
  border: '1px solid rgba(212,197,169,0.7)',
  borderRadius: 18,
  boxShadow: '0 14px 34px rgba(88,63,30,0.16), 0 3px 8px rgba(88,63,30,0.08)',
  position: 'relative',
  overflow: 'hidden',
};

const ProfileCardSkeleton = () => {
  return (
    <div
      aria-hidden="true"
      style={{
        width: '100%',
        height: '100%',
        minHeight: 0,
        backgroundColor: theme.desk,
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        padding: '16px 14px 44px 14px',
        position: 'relative',
        overflow: 'hidden',
        contain: 'paint layout style',
        boxSizing: 'border-box',
      }}
    >
      {/* Grain film — same layer as the real card */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("${design?.texture?.grain || ''}")`,
          mixBlendMode: 'multiply',
          opacity: 0.3,
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />

      {/* HERO PANEL — exact height of the real hero so swap-in is seamless */}
      <div
        className="pc-skeleton-shimmer"
        style={{
          ...panelStyle,
          width: '100%',
          height: 'calc(100dvh - 130px)',
          flexShrink: 0,
          backgroundColor: theme.surfaceAlt,
        }}
      />

      {/* COMPATIBILITY PANEL — stamp + status + findings box */}
      <div style={{ ...panelStyle, padding: '22px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 16 }}>
          <Bar w={88} h={88} r="50%" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Bar w={130} h={16} />
            <Bar w={170} h={10} />
          </div>
        </div>
        <div style={{ border: `1px solid rgba(139,69,19,0.3)`, borderRadius: 6, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Bar w="85%" h={10} />
          <Bar w="65%" h={10} />
        </div>
      </div>

      {/* VITALS PANEL — 2x2 field cells: label bar + dotted-value bar */}
      <div style={{ ...panelStyle, padding: '22px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 14px' }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i}>
            <Bar w={52} h={9} r={3} style={{ marginBottom: 8 }} />
            <Bar w="80%" h={13} r={4} style={{ borderBottom: '1.5px dotted rgba(139,69,19,0.25)', paddingBottom: 5, borderRadius: '4px 4px 0 0' }} />
          </div>
        ))}
      </div>

      {/* BIO — loose index card artifact */}
      <div style={{ ...panelStyle, borderRadius: 6, border: '1px solid rgba(139,69,19,0.25)', backgroundColor: theme.card, boxShadow: '0 8px 20px rgba(88,63,30,0.16)', minHeight: 120, padding: '20px 16px 16px 34px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}>
        <Bar w="30%" h={18} r={4} />
        <Bar w="90%" h={10} />
        <Bar w="70%" h={10} />
      </div>

      {/* SEEKING PANEL — two headed chip groups */}
      <div style={{ ...panelStyle, padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <Bar w={58} h={9} r={3} style={{ marginBottom: 12 }} />
          <div style={{ display: 'flex', gap: 10 }}>
            <Bar w={72} h={28} r={4} />
            <Bar w={64} h={28} r={4} />
          </div>
        </div>
        <div>
          <Bar w={64} h={9} r={3} style={{ marginBottom: 12 }} />
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Bar w={78} h={30} r={4} />
            <Bar w={90} h={30} r={4} />
            <Bar w={56} h={30} r={4} />
          </div>
        </div>
      </div>

      {/* EXHIBITS — 2-col artifact grid: card, photo, photo, card */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 16px', alignItems: 'center', paddingTop: 4 }}>
        <div style={{ ...panelStyle, borderRadius: 6, border: '1px solid rgba(139,69,19,0.25)', backgroundColor: theme.card, boxShadow: '0 8px 20px rgba(88,63,30,0.16)', minHeight: 130, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 9 }}>
          <Bar w="80%" h={9} />
          <Bar w="55%" h={9} />
        </div>
        <div className="pc-skeleton-shimmer" style={{ ...panelStyle, aspectRatio: '1 / 1', backgroundColor: theme.surfaceAlt }} />
        <div className="pc-skeleton-shimmer" style={{ ...panelStyle, aspectRatio: '1 / 1', backgroundColor: theme.surfaceAlt }} />
        <div style={{ ...panelStyle, borderRadius: 6, border: '1px solid rgba(139,69,19,0.25)', backgroundColor: theme.card, boxShadow: '0 8px 20px rgba(88,63,30,0.16)', minHeight: 130, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 9 }}>
          <Bar w="70%" h={9} />
          <Bar w="60%" h={9} />
        </div>
      </div>
    </div>
  );
};

export default ProfileCardSkeleton;
```

### ./client/src/components/ShadowbanBanner.jsx

```
import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

/* Locked tokens — same family as ProfileCard */
const t = {
  paper: '#fdfbf7',
  surfaceAlt: '#f4f1ea',
  lineDark: '#d4c5a9',
  ink: '#1a1a1a',
  inkSoft: '#4a4a4a',
  inkMuted: '#8c8275',
  accent: '#8b4513',
  crimson: '#8b1a1a',
  fontBody: "'Inter', -apple-system, sans-serif",
};

/**
 * ShadowbanBanner — Shows "account under review" banner.
 * NEVER reveals scores, weights, tiers, or how many reports.
 *
 * Props:
 *   score: Number — user's shadowbanScore
 *   onLearnMore: Function — callback to open Learn More sheet
 *
 * Visibility: score < 5.0 → null (don't render)
 */
const ShadowbanBanner = ({ score = 0, onLearnMore }) => {
  if (score < 5.0) return null;

  const isHighTier = score >= 8.0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{
        backgroundColor: isHighTier ? 'rgba(139, 26, 26, 0.06)' : 'rgba(139, 69, 19, 0.05)',
        border: `1px solid ${isHighTier ? 'rgba(139, 26, 26, 0.2)' : 'rgba(139, 69, 19, 0.15)'}`,
        borderRadius: 12,
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        margin: '0 24px 16px',
      }}
    >
      {/* Standard icon tile, tinted by tier */}
      <div style={{
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: isHighTier ? 'rgba(139, 26, 26, 0.08)' : 'rgba(139, 69, 19, 0.08)',
        border: `1px solid ${isHighTier ? 'rgba(139, 26, 26, 0.15)' : 'rgba(139, 69, 19, 0.12)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <AlertTriangle size={18} color={isHighTier ? t.crimson : t.accent} strokeWidth={2} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: t.fontBody,
          fontSize: 13.5,
          fontWeight: 600,
          color: t.ink,
          margin: 0,
          lineHeight: 1.4,
        }}>
          Your account is currently under review.
        </p>
        <p style={{
          fontFamily: t.fontBody,
          fontSize: 12,
          fontWeight: 450,
          color: t.inkMuted,
          margin: '3px 0 0 0',
          lineHeight: 1.45,
        }}>
          {isHighTier
            ? 'Profile editing and photo uploads are temporarily limited.'
            : 'New profile visibility may be temporarily limited.'}
        </p>
      </div>

      <button
        className="tactile-btn"
        onClick={() => { triggerHaptic('light'); onLearnMore(); }}
        style={{
          backgroundColor: isHighTier ? 'rgba(139, 26, 26, 0.06)' : 'rgba(139, 69, 19, 0.06)',
          border: `1px solid ${isHighTier ? 'rgba(139, 26, 26, 0.25)' : 'rgba(139, 69, 19, 0.2)'}`,
          borderRadius: 999,
          padding: '8px 13px',
          fontFamily: t.fontBody,
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '1px',
          textTransform: 'uppercase',
          color: isHighTier ? t.crimson : t.accent,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        Learn more
      </button>

      <style>{`
        .tactile-btn { transition: transform 0.15s ease-out; will-change: transform; }
        .tactile-btn:active { transform: scale(0.96) !important; }
      `}</style>
    </motion.div>
  );
};

export default ShadowbanBanner;
```

### ./client/src/components/Skeleton.jsx

```
import React from 'react';

/* Locked skeleton fill — the shimmer surface of the whole app */
const SKELETON_FILL = '#f4f1ea';

export const SkeletonBox = ({ width, height, radius = 4 }) => (
  <div
    className="archival-skeleton"
    aria-hidden="true"
    style={{
      width,
      height,
      borderRadius: radius,
      backgroundColor: SKELETON_FILL,
      position: 'relative',
      overflow: 'hidden',
      flexShrink: 0,
      contain: 'paint layout',
    }}
  />
);

export default SkeletonBox;
```

### ./client/src/components/chat/EmojiPicker.jsx

```
import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../../utils/haptics';
import { theme as design } from '../../utils/theme';

const REACTION_EMOJIS = ['❤️', '😂', '🔥', '👍', '😲', '😢'];

/* ==================================================================
   ARCHIVAL THEME CONSTANTS
================================================================== */
const theme = {
  paper: '#fdfbf7',
  borderDark: '#d4c5a9',
  ink: '#1a1a1a',
  crimson: '#8b1a1a',
  shadowWarm: 'rgba(139, 69, 19, 0.15)',
  shadowDark: 'rgba(26, 26, 26, 0.25)',
};

const EmojiPicker = ({ anchorRect, onSelect, onClose }) => {
  if (!anchorRect) return null;

  // Strict 8-Point Grid Geometry
  const pickerWidth = 288; // 36 * 8
  const pickerHeight = 64; // 8 * 8
  const padding = 16;
  const safeAreaTop = 60; // Assumes a standard mobile header clearance

  // Calculate vertical position (default above, flip below if obstructed)
  let top = anchorRect.top - pickerHeight - 16;
  if (top < padding + safeAreaTop) {
    top = anchorRect.bottom + 16;
  }

  // Calculate horizontal position (centered over bubble, clamped to screen edges)
  let left = anchorRect.left + (anchorRect.width / 2) - (pickerWidth / 2);
  if (left < padding) {
    left = padding;
  }
  if (left + pickerWidth > window.innerWidth - padding) {
    left = window.innerWidth - pickerWidth - padding;
  }

  return createPortal(
    <AnimatePresence>
      {/* GPU Promoted CSS Physics for Zero-Lag Emojis */}
      <style>{`
        .tactile-emoji {
          will-change: transform;
          transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
          transform: translate3d(0, 0, 0) scale3d(1, 1, 1);
        }
        
        @media (hover: hover) {
          .tactile-emoji:hover {
            transform: translate3d(0, -6px, 0) scale3d(1.35, 1.35, 1);
            z-index: 10;
          }
        }
        
        .tactile-emoji:active {
          transform: translate3d(0, 2px, 0) scale3d(0.85, 0.85, 1) !important;
          transition: transform 0.08s cubic-bezier(0, 0, 0.2, 1) !important;
        }

        @media (prefers-reduced-motion: reduce) {
          .tactile-emoji { transition: none !important; transform: none !important; }
        }
      `}</style>

      {/* Dimmed Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(20, 15, 10, 0.4)',
          backdropFilter: 'blur(2px)', // Subtle focus pull
          zIndex: 9996,
        }}
      />

      {/* Floating Reaction Pill */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.85, y: 12 }}
        transition={{ type: 'spring', damping: 24, stiffness: 400 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top,
          left,
          width: pickerWidth,
          height: pickerHeight,
          backgroundColor: theme.paper,
          backgroundImage: `url("${design?.texture?.grain || ''}")`,
          border: `1.5px solid ${theme.borderDark}`,
          borderRadius: '32px', // Pill shape for reaction menus
          boxShadow: `0 16px 40px ${theme.shadowDark}, 0 4px 12px ${theme.shadowWarm}`,
          zIndex: 9997,
          padding: '0 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          contain: 'layout style paint', // Isolates layout from the chat beneath it
        }}
      >
        {/* Specular Highlight Overlay */}
        <div 
          aria-hidden="true" 
          style={{ 
            position: 'absolute', inset: 0, borderRadius: '32px', pointerEvents: 'none',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 50%)', 
          }} 
        />

        {REACTION_EMOJIS.map((emoji, i) => (
          <motion.button
            key={emoji}
            initial={{ opacity: 0, y: 10, scale: 0.5 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: i * 0.03, type: 'spring', damping: 18, stiffness: 300 }}
            className="tactile-emoji"
            onClick={() => {
              triggerHaptic('medium');
              onSelect(emoji);
            }}
            aria-label={`React with ${emoji}`}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '28px',
              cursor: 'pointer',
              padding: '8px',
              margin: 0,
              lineHeight: 1,
              position: 'relative',
              zIndex: 2,
              WebkitTapHighlightColor: 'transparent',
              outline: 'none',
            }}
          >
            {emoji}
          </motion.button>
        ))}
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default EmojiPicker;
```

### ./client/src/components/chat/MessageActionMenu.jsx

```
import React, { memo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../../utils/haptics';
import { theme as design } from '../../utils/theme';

/* ==================================================================
   ARCHIVAL THEME CONSTANTS
================================================================== */
const theme = { 
  paper: '#fdfbf7', 
  surface: '#ffffff', 
  surfaceAlt: '#f4f1ea', 
  border: '#e0d8c8', 
  borderDark: '#d4c5a9', 
  ink: '#1a1a1a', 
  inkMuted: '#8c8275', 
  accent: '#8b4513', 
  crimson: '#8b1a1a', 
  shadowWarm: 'rgba(139, 69, 19, 0.12)',
  shadowDark: 'rgba(26, 26, 26, 0.20)',
};

// Zero-Lag Memoized Icon Component
const Icon = memo(({ path, size = 20, color = theme.ink, strokeWidth = 1.8 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth={strokeWidth} 
    strokeLinecap="round" 
    strokeLinejoin="round"
    aria-hidden="true"
    style={{ display: 'block', flexShrink: 0 }}
  >
    {path}
  </svg>
));
Icon.displayName = 'Icon';

const actions = [
  { key: 'reply', label: 'Reply', haptic: 'light', hideIfMedia: false, hideIfMine: false, showOnlyIfMine: false, path: <><polyline points="9 17 4 12 9 7" /><path d="M20 18v-2a4 4 0 0 0-4-4H4" /></> },
  { key: 'react', label: 'React', haptic: 'light', hideIfMedia: false, hideIfMine: false, showOnlyIfMine: false, path: <><circle cx="12" cy="12" r="9" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></> },
  { key: 'copy', label: 'Copy', haptic: 'light', hideIfMedia: true, hideIfMine: false, showOnlyIfMine: false, path: <><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></> },
  { key: 'report', label: 'Report', haptic: 'medium', hideIfMedia: false, hideIfMine: true, showOnlyIfMine: false, path: <><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></> },
  { key: 'delete', label: 'Delete', haptic: 'medium', hideIfMedia: false, hideIfMine: false, showOnlyIfMine: true, path: <><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></> },
];

const MessageActionMenu = ({ anchorRect, isMine, isMedia, onClose, onReply, onReact, onCopy, onReport, onDelete }) => {
  if (!anchorRect) return null;
  const handlers = { reply: onReply, react: onReact, copy: onCopy, report: onReport, delete: onDelete };

  // Filter available actions based on message context
  const visible = actions.filter((a) => {
    if (a.hideIfMedia && isMedia) return false;
    if (a.hideIfMine && isMine) return false;
    if (a.showOnlyIfMine && !isMine) return false;
    return true;
  });

  // Strict 8-Point Grid Geometry Math
  const menuWidth = 216;
  const padding = 16;
  const itemHeight = 44; // Approx height per item
  const menuHeight = (visible.length * itemHeight) + 16; // 16px total vertical padding

  // Safe-area positioning logic
  let top = anchorRect.top - menuHeight - 12;
  if (top < padding + 60) top = anchorRect.bottom + 12; // Flips below if hitting top edge
  
  let left = anchorRect.left + (anchorRect.width / 2) - (menuWidth / 2);
  // Clamp to screen edges
  left = Math.max(padding, Math.min(left, window.innerWidth - menuWidth - padding));

  return createPortal(
    <AnimatePresence>
      {/* Hardware Accelerated Interactive Physics */}
      <style>{`
        .tactile-menu-btn {
          transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), background-color 0.2s ease;
          will-change: transform, background-color;
        }
        @media (hover: hover) {
          .tactile-menu-btn:hover {
            background-color: rgba(139, 69, 19, 0.05); /* Subtle warm paper highlight */
          }
          .tactile-menu-btn.danger-btn:hover {
            background-color: rgba(139, 26, 26, 0.05); /* Subtle crimson highlight */
          }
        }
        .tactile-menu-btn:active {
          transform: scale3d(0.97, 0.97, 1) !important;
          transition: transform 0.08s cubic-bezier(0, 0, 0.2, 1) !important;
          background-color: rgba(139, 69, 19, 0.1) !important;
        }
        .tactile-menu-btn.danger-btn:active {
          background-color: rgba(139, 26, 26, 0.1) !important;
        }
        @media (prefers-reduced-motion: reduce) {
          .tactile-menu-btn { transition: none !important; transform: none !important; }
        }
      `}</style>

      {/* Backdrop (Focus Pull) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        style={{ 
          position: 'fixed', 
          inset: 0, 
          backgroundColor: 'rgba(20, 15, 10, 0.35)', 
          backdropFilter: 'blur(2px)', 
          zIndex: 9998 
        }}
      />

      {/* Menu Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 8 }}
        transition={{ type: 'spring', damping: 26, stiffness: 380 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top,
          left,
          width: menuWidth,
          backgroundColor: theme.surface,
          backgroundImage: `url("${design?.texture?.grain || ''}")`,
          border: `1.5px solid ${theme.borderDark}`,
          borderRadius: '16px',
          boxShadow: `0 16px 40px ${theme.shadowDark}, 0 4px 12px ${theme.shadowWarm}`,
          padding: '8px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '2px', // Slight spacing between rounded pill items
          contain: 'layout style paint',
        }}
      >
        {visible.map((a) => {
          const isDanger = a.key === 'delete' || a.key === 'report';
          const iconColor = isDanger ? theme.crimson : theme.inkSoft;
          const textColor = isDanger ? theme.crimson : theme.ink;

          return (
            <button
              key={a.key}
              className={`tactile-menu-btn ${isDanger ? 'danger-btn' : ''}`}
              onClick={() => { 
                triggerHaptic(a.haptic);
                handlers[a.key]?.(); 
                if (a.key !== 'react') onClose();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '12px 16px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '8px', // Modern rounded internal list items
                cursor: 'pointer',
                textAlign: 'left',
                outline: 'none',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <Icon path={a.path} size={18} color={iconColor} strokeWidth={2} />
              <span 
                style={{ 
                  fontFamily: "'Inter', sans-serif", 
                  fontWeight: 600, 
                  fontSize: '14px',
                  color: textColor,
                  letterSpacing: '0.3px',
                }}
              >
                {a.label}
              </span>
            </button>
          );
        })}
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default MessageActionMenu;
```

### ./client/src/components/chat/MessageBubble.jsx

```
import React, { useRef, useState, memo } from 'react';
import { motion } from 'framer-motion';
import { triggerHaptic } from '../../utils/haptics';
import { Check, CheckCheck } from 'lucide-react';
import PolaroidCard from '../PolaroidCard';
import CassettePlayer from '../CassettePlayer';
import { theme as design } from '../../utils/theme';

/* ==================================================================
   ARCHIVAL THEME CONSTANTS
================================================================== */
const theme = {
  paper: '#fdfbf7', 
  surface: '#ffffff', 
  surfaceAlt: '#f4f1ea', 
  border: '#e0d8c8', 
  borderDark: '#d4c5a9',
  ink: '#1a1a1a', 
  inkMuted: '#8c8275', 
  accent: '#8b4513', 
  crimson: '#8b1a1a', 
  shadowWarm: 'rgba(139, 69, 19, 0.12)',
};

const MessageBubble = ({ 
  message, 
  isMine, 
  time, 
  receipt, 
  onLongPress, 
  onImageClick, 
  replyPreview 
}) => {
  const pressTimer = useRef(null);
  const [isPressed, setIsPressed] = useState(false);

  // Tactile Long Press Engine
  const startPress = (e) => {
    // Prevent menu trigger if user is interacting with media cards directly
    if (e.target.closest('[data-no-longpress]')) return;
    
    pressTimer.current = setTimeout(() => {
      triggerHaptic('medium');
      setIsPressed(true);
      onLongPress(message, e);
      setTimeout(() => setIsPressed(false), 250);
    }, 400); // 400ms aligns with native iOS/Android long-press timing
  };

  const cancelPress = () => {
    if (pressTimer.current) { 
      clearTimeout(pressTimer.current); 
      pressTimer.current = null; 
    }
    setIsPressed(false);
  };

  const renderContent = () => {
    if (message.type === 'image' || (message.type === 'opening_letter' && message.mediaUrl)) {
      return (
        <div data-no-longpress onClick={() => onImageClick?.(message.mediaUrl)} style={{ cursor: 'zoom-in' }}>
          <PolaroidCard src={message.mediaUrl} caption={message.text} tilt={isMine ? '1deg' : '-1deg'} />
        </div>
      );
    }
    if (message.type === 'audio') {
      return (
        <div data-no-longpress>
          <CassettePlayer audioUrl={message.mediaUrl} themeColor={isMine ? theme.accent : theme.inkSoft} />
        </div>
      );
    }
    if (message.deleted) {
      return (
        <span style={{ fontStyle: 'italic', color: theme.inkMuted, fontSize: '13px', fontFamily: "'Inter', sans-serif" }}>
          This artifact was removed.
        </span>
      );
    }
    return <span style={{ whiteSpace: 'pre-wrap' }}>{message.text}</span>;
  };

  // Group duplicate reactions
  const reactionGroups = {};
  (message.reactions || []).forEach((r) => {
    if (!reactionGroups[r.emoji]) reactionGroups[r.emoji] = [];
    reactionGroups[r.emoji].push(r.user);
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: isPressed ? 0.96 : 1,
      }}
      transition={{ type: 'spring', damping: 26, stiffness: 380 }}
      
      // Touch / Mouse event bindings for Long Press
      onTouchStart={startPress} onTouchEnd={cancelPress} onTouchMove={cancelPress}
      onMouseDown={startPress} onMouseUp={cancelPress} onMouseLeave={cancelPress}
      onContextMenu={(e) => e.preventDefault()}
      data-bubble="true"
      data-msg-id={message._id} // Required for SearchOverlay jumping
      
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: isMine ? 'flex-end' : 'flex-start', 
        marginBottom: '20px', 
        userSelect: 'none', 
        WebkitUserSelect: 'none', 
        WebkitTouchCallout: 'none',
        contain: 'layout style', // Isolates layout recalculations strictly to this bubble
        willChange: 'transform, opacity',
      }}
    >
      {/* Attached Archival Reply Note */}
      {replyPreview && !message.deleted && (
        <div style={{ 
          maxWidth: '75%', 
          padding: '8px 12px', 
          marginBottom: '6px', 
          backgroundColor: isMine ? 'rgba(139, 69, 19, 0.05)' : theme.surface, 
          border: `1px solid ${theme.border}`,
          borderLeft: `3px solid ${theme.accent}`, 
          borderRadius: '6px', 
          fontSize: '12px', 
          color: theme.inkMuted, 
          fontFamily: "'Inter', sans-serif", 
          fontStyle: 'italic', 
          whiteSpace: 'nowrap', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis',
          boxShadow: `0 2px 6px ${theme.shadowWarm}`
        }}>
          Replying to: {replyPreview.text || (replyPreview.type === 'image' ? 'Photograph' : 'Voice Note')}
        </div>
      )}

      {/* Main Message Bubble */}
      <div style={{ 
        maxWidth: '82%', 
        padding: '14px 18px', 
        borderRadius: '12px', 
        backgroundColor: isMine ? theme.surfaceAlt : theme.surface, 
        border: `1px solid ${theme.border}`, 
        borderLeft: isMine ? `1px solid ${theme.border}` : `3px solid ${theme.crimson}`, 
        borderRight: isMine ? `3px solid ${theme.accent}` : `1px solid ${theme.border}`, 
        color: theme.ink, 
        fontFamily: "'Special Elite', 'Courier New', monospace", 
        fontSize: '15px', 
        lineHeight: '1.5', 
        wordBreak: 'break-word', 
        boxShadow: `0 6px 16px ${theme.shadowWarm}, inset 0 2px 4px rgba(255,255,255,0.4)`, 
        position: 'relative',
        transition: 'border-color 0.3s ease',
      }}>
        {renderContent()}

        {/* Peeling Archival Washi Tape for Text Messages */}
        {message.type === 'text' && !message.deleted && (
          <div 
            aria-hidden="true"
            style={{ 
              position: 'absolute', 
              top: '-8px', 
              [isMine ? 'right' : 'left']: '16px', 
              width: '32px', 
              height: '14px', 
              backgroundColor: 'rgba(224, 216, 200, 0.9)', 
              backdropFilter: 'blur(2px)',
              border: `1px solid rgba(139, 69, 19, 0.15)`,
              boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
              transform: `rotate(${isMine ? '4deg' : '-4deg'})`,
              zIndex: 2,
            }} 
          />
        )}
      </div>

      {/* Reaction Cluster */}
      {Object.keys(reactionGroups).length > 0 && (
        <div style={{ 
          display: 'flex', 
          gap: '6px', 
          marginTop: '6px', 
          flexWrap: 'wrap', 
          maxWidth: '80%', 
          justifyContent: isMine ? 'flex-end' : 'flex-start' 
        }}>
          {Object.entries(reactionGroups).map(([emoji, users]) => (
            <motion.div 
              key={emoji} 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '4px', 
                padding: '4px 8px', 
                backgroundColor: theme.surface, 
                border: `1px solid ${theme.borderDark}`, 
                borderRadius: '16px', 
                fontSize: '14px', 
                lineHeight: 1,
                boxShadow: `0 2px 6px ${theme.shadowWarm}` 
              }}
            >
              <span>{emoji}</span>
              {users.length > 1 && (
                <span style={{ 
                  fontFamily: "'Inter', sans-serif", 
                  fontSize: '11px', 
                  fontWeight: 700, 
                  color: theme.inkMuted 
                }}>
                  {users.length}
                </span>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Meta: Time & Read Receipts */}
      <div style={{ 
        marginTop: '8px', 
        fontSize: '10px', 
        fontFamily: "'Inter', sans-serif", 
        fontWeight: 700, 
        letterSpacing: '1px', 
        color: theme.inkMuted, 
        display: 'flex', 
        gap: '8px', 
        alignItems: 'center', 
        textTransform: 'uppercase' 
      }}>
        <span>{time}</span>
        {receipt && (
          <span style={{ 
            color: message.read ? '#2e7d32' : theme.accent, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px',
            transition: 'color 0.3s ease'
          }}>
            {message.read ? <CheckCheck size={12} strokeWidth={2.5} /> : <Check size={12} strokeWidth={2.5} />} 
            {receipt}
          </span>
        )}
      </div>
    </motion.div>
  );
};

// Zero-Lag Deep Equality Check
// Ensures the bubble ONLY re-renders if its specific data changes, 
// completely preventing chat-scroll lag.
const areEqual = (prev, next) => {
  return (
    prev.message._id === next.message._id &&
    prev.message.read === next.message.read &&
    prev.message.deleted === next.message.deleted &&
    prev.receipt === next.receipt &&
    JSON.stringify(prev.message.reactions) === JSON.stringify(next.message.reactions)
  );
};

export default memo(MessageBubble, areEqual);
```

### ./client/src/components/chat/PhotoViewer.jsx

```
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../../utils/haptics';
import { theme as design } from '../../utils/theme';
import { X } from 'lucide-react';

/* ==================================================================
   ARCHIVAL THEME CONSTANTS
================================================================== */
const theme = {
  paper: '#fdfbf7',
  border: '#e0d8c8',
  borderDark: '#d4c5a9',
  ink: '#1a1a1a',
  inkMuted: '#8c8275',
  accent: '#8b4513',
  shadowWarm: 'rgba(139, 69, 19, 0.15)',
};

// GPU-Promoted, Memoized Archival Corner Mounts
const CornerMounts = React.memo(() => (
  <>
    <span aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0, width: 24, height: 24, background: '#fff', clipPath: 'polygon(0 0, 100% 0, 0 100%)', zIndex: 3, filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.15))' }} />
    <span aria-hidden="true" style={{ position: 'absolute', top: 0, right: 0, width: 24, height: 24, background: '#fff', clipPath: 'polygon(100% 0, 0 0, 100% 100%)', zIndex: 3, filter: 'drop-shadow(-1px 1px 2px rgba(0,0,0,0.15))' }} />
    <span aria-hidden="true" style={{ position: 'absolute', bottom: 0, left: 0, width: 24, height: 24, background: '#fff', clipPath: 'polygon(0 100%, 100% 100%, 0 0)', zIndex: 3, filter: 'drop-shadow(1px -1px 2px rgba(0,0,0,0.15))' }} />
    <span aria-hidden="true" style={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, background: '#fff', clipPath: 'polygon(100% 100%, 0 100%, 100% 0)', zIndex: 3, filter: 'drop-shadow(-1px -1px 2px rgba(0,0,0,0.15))' }} />
  </>
));
CornerMounts.displayName = 'CornerMounts';

/* ==================================================================
   MAIN COMPONENT
================================================================== */
const PhotoViewer = ({ src, onClose }) => {
  const [scale, setScale] = useState(1);

  if (!src) return null;

  const handleTap = () => {
    if (scale > 1) {
      triggerHaptic('light');
      setScale(1);
    } else {
      triggerHaptic('medium');
      onClose();
    }
  };

  const handleDoubleClick = (e) => {
    e.stopPropagation(); // Prevents the tap handler from firing
    triggerHaptic('medium');
    setScale(scale > 1 ? 1 : 2.2);
  };

  return createPortal(
    <AnimatePresence>
      {/* Immersive Cinematic Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        onClick={handleTap}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(10, 8, 6, 0.85)',
          backgroundImage: `url("${design?.texture?.grain || ''}")`,
          backgroundSize: '150px 150px',
          backdropFilter: 'blur(6px)', // Depth of field focus pull
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          cursor: scale > 1 ? 'zoom-out' : 'pointer',
          contain: 'strict', // Absolute layout isolation
        }}
      >
        {/* Subtle Close Hint */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            position: 'absolute',
            top: 'max(24px, env(safe-area-inset-top))',
            right: '24px',
            color: 'rgba(255,255,255,0.8)',
            fontFamily: "'Inter', sans-serif",
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            zIndex: 10002,
            pointerEvents: 'none',
          }}
        >
          {scale > 1 ? 'Double-tap to unzoom' : 'Tap to close'} 
          <X size={14} strokeWidth={2.5} color="currentColor" />
        </motion.div>

        {/* Archival Photo Frame Container */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, rotate: -2, y: 20 }}
          animate={{ scale, opacity: 1, rotate: 0, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, rotate: -2, y: 20 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          onDoubleClick={handleDoubleClick}
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: '#ffffff',
            padding: '16px 16px 48px 16px',
            borderRadius: '4px',
            boxShadow: '0 40px 100px rgba(0,0,0,0.6), 0 10px 30px rgba(0,0,0,0.4)',
            border: `1px solid ${theme.borderDark}`,
            position: 'relative',
            maxWidth: '100%',
            maxHeight: '85dvh',
            cursor: scale > 1 ? 'zoom-out' : 'zoom-in',
            willChange: 'transform, opacity', // GPU Promotion
          }}
        >
          {/* Specular Room Lighting Overlay */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 50%, rgba(0,0,0,0.02) 100%)',
              pointerEvents: 'none',
              zIndex: 4,
            }}
          />

          <CornerMounts />

          {/* Artifact Image */}
          <img
            src={src}
            alt="Archival Specimen Full View"
            decoding="async" // Prevents main thread blocking on hi-res decode
            style={{
              maxWidth: '100%',
              maxHeight: '70dvh',
              objectFit: 'contain',
              borderRadius: '2px',
              display: 'block',
              border: `1px solid ${theme.border}`,
              backgroundColor: '#f4f1ea', // Fallback color while decoding
            }}
          />

          {/* Typewriter Caption */}
          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: "'Special Elite', 'Courier New', monospace",
              fontSize: '13px',
              fontWeight: 600,
              color: theme.inkMuted,
              fontStyle: 'italic',
              textAlign: 'center',
              letterSpacing: '-0.01em',
              zIndex: 5,
            }}
          >
            Archival Specimen
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default PhotoViewer;
```

### ./client/src/components/chat/ReplyPreview.jsx

```
import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { triggerHaptic } from '../../utils/haptics';
import { Image, Mic, X } from 'lucide-react';
import { theme as design } from '../../utils/theme';

/* ==================================================================
   ARCHIVAL THEME CONSTANTS
================================================================== */
const theme = {
  paper: '#fdfbf7',
  surface: '#ffffff',
  surfaceAlt: '#f4f1ea',
  border: '#e0d8c8',
  borderDark: '#d4c5a9',
  ink: '#1a1a1a',
  inkMuted: '#8c8275',
  accent: '#8b4513',
  crimson: '#8b1a1a',
  shadowWarm: 'rgba(139, 69, 19, 0.12)',
};

const ReplyPreview = ({ replyTo, otherName, onCancel }) => {
  if (!replyTo) return null;

  // Truncate text cleanly and assign proper iconography for media
  const previewText = replyTo.text
    ? replyTo.text.slice(0, 60) + (replyTo.text.length > 60 ? '…' : '')
    : replyTo.type === 'image'
    ? <><Image size={14} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} /> Photograph</>
    : replyTo.type === 'audio'
    ? <><Mic size={14} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} /> Voice Note</>
    : 'Letter';

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
      style={{
        backgroundColor: theme.surfaceAlt,
        borderTop: `1px solid ${theme.borderDark}`,
        overflow: 'hidden',
        willChange: 'height, opacity', // GPU Promotion for layout animation
        position: 'relative',
        zIndex: 5,
        boxShadow: `0 -4px 16px ${theme.shadowWarm}`,
      }}
    >
      {/* Interactive Tactile Physics */}
      <style>{`
        .tactile-cancel-btn {
          transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), background-color 0.2s ease;
          will-change: transform;
        }
        @media (hover: hover) {
          .tactile-cancel-btn:hover {
            transform: translate3d(0, -2px, 0) scale3d(1.05, 1.05, 1);
            background-color: rgba(139, 26, 26, 0.08) !important;
            color: ${theme.crimson} !important;
            border-color: ${theme.crimson} !important;
          }
        }
        .tactile-cancel-btn:active {
          transform: scale3d(0.92, 0.92, 1) translate3d(0, 0, 0) !important;
          transition: transform 0.08s cubic-bezier(0, 0, 0.2, 1) !important;
        }
      `}</style>

      {/* 
        Inner wrapper with fixed padding. 
        This prevents margin-collapse stuttering during Framer Motion height animations.
      */}
      <div style={{
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        width: '100%',
        boxSizing: 'border-box',
      }}>
        
        {/* Cinematic Film Grain */}
        <div 
          aria-hidden="true" 
          style={{ 
            position: 'absolute', inset: 0, 
            backgroundImage: `url("${design?.texture?.grain || ''}")`, 
            mixBlendMode: 'multiply', opacity: 0.5, pointerEvents: 'none', zIndex: 0 
          }} 
        />
        
        {/* Archival Reference Line */}
        <div
          aria-hidden="true"
          style={{
            width: '3px',
            alignSelf: 'stretch',
            backgroundColor: theme.accent,
            borderRadius: '2px',
            flexShrink: 0,
            zIndex: 1,
            boxShadow: `1px 0 2px ${theme.shadowWarm}`,
          }}
        />
        
        {/* Typography Block */}
        <div style={{ flex: 1, minWidth: 0, zIndex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '10px',
              fontWeight: 800,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              color: theme.accent,
              lineHeight: 1,
            }}
          >
            Replying to {otherName || 'letter'}
          </div>
          <div
            style={{
              fontFamily: "'Special Elite', 'Courier New', monospace",
              fontSize: '13px',
              fontWeight: 600,
              color: theme.inkMuted,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'flex',
              alignItems: 'center',
              lineHeight: 1.2,
            }}
          >
            {previewText}
          </div>
        </div>
        
        {/* Action Button */}
        <button
          className="tactile-cancel-btn"
          onClick={() => {
            triggerHaptic('light');
            onCancel();
          }}
          aria-label="Cancel reply"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            border: `1.5px solid ${theme.borderDark}`,
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: theme.inkMuted,
            cursor: 'pointer',
            padding: 0,
            flexShrink: 0,
            zIndex: 1,
            outline: 'none',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <X size={14} strokeWidth={2.5} color="currentColor" />
        </button>

      </div>
    </motion.div>
  );
};

// Memoize to prevent re-renders while the user is typing in the chat input
export default memo(ReplyPreview);
```

### ./client/src/components/chat/ReportModal.jsx

```
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { API_BASE } from '../../utils/api';
import { triggerHaptic } from '../../utils/haptics';
import { theme as design } from '../../utils/theme';
import { toast } from '../../utils/toast';

const theme = {
  paper: '#fdfbf7',
  surface: '#ffffff',
  surfaceAlt: '#f4f1ea',
  border: '#e0d8c8',
  borderDark: '#d4c5a9',
  ink: '#1a1a1a',
  inkMuted: '#8c8275',
  accent: '#8b4513',
  crimson: '#8b1a1a',
  shadowWarm: 'rgba(139, 69, 19, 0.12)',
};



const Icon = ({ path, size = 20, color = 'currentColor', strokeWidth = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {path}
  </svg>
);

const ReportModal = ({ reportedUserId, onClose, onReported }) => {
  const [reasons, setReasons] = useState([]);
  const [selectedReason, setSelectedReason] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadReasons = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/report/reasons`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setReasons(data.reasons || []);
        }
      } catch (err) {
        console.error('Failed to fetch report reasons:', err);
      } finally {
        setLoading(false);
      }
    };
    loadReasons();
  }, []);

  const handleSubmit = async () => {
    if (!selectedReason) {
      toast.error('Please select a reason for reporting.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/report/${reportedUserId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          reason: selectedReason,
          details: details.trim(),
        }),
      });

      if (res.ok) {
        triggerHaptic('heavy');
        onReported();
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to submit report');
      }
    } catch (err) {
      console.error('Report submission failed:', err);
      toast.error(`Failed to submit report: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(20,15,10,0.7)',
        backdropFilter: 'blur(4px)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'flex-end',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        style={{
          width: '100%',
          maxHeight: '85vh',
          backgroundColor: theme.paper,
          backgroundImage: `url("${design.texture.grain}")`,
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          boxShadow: '0 -20px 50px rgba(0,0,0,0.4)',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: `1px solid ${theme.borderDark}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: theme.surface,
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
        }}>
          <span style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '20px',
            fontWeight: 700,
            color: theme.ink,
          }}>
            Report User
          </span>
          <button
            onClick={onClose}
            style={{
              background: theme.surfaceAlt,
              border: `1px solid ${theme.border}`,
              borderRadius: design.radius.md,
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: theme.ink,
            }}
          >
            <Icon path={<><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>} size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: theme.inkMuted,
              fontFamily: "'Inter', sans-serif",
              fontSize: '13px',
            }}>
              Loading report options...
            </div>
          ) : (
            <>
              <p style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: '15px',
                color: theme.ink,
                marginBottom: '20px',
                lineHeight: 1.5,
              }}>
                Help us understand why you're reporting this user. Your report will be reviewed by our moderation team.
              </p>

              {/* Reason Selection */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  color: theme.accent,
                  marginBottom: '12px',
                }}>
                  Reason for Report
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {reasons.map((reason) => (
                    <motion.button
                      key={reason}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSelectedReason(reason);
                        triggerHaptic('light');
                      }}
                      style={{
                        padding: '14px 16px',
                        backgroundColor: selectedReason === reason ? 'rgba(139, 26, 26, 0.08)' : theme.surface,
                        border: `1.5px solid ${selectedReason === reason ? theme.crimson : theme.border}`,
                        borderRadius: '10px',
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '14px',
                        fontWeight: selectedReason === reason ? 600 : 500,
                        color: selectedReason === reason ? theme.crimson : theme.ink,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s',
                      }}
                    >
                      {reason}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Details (Optional) */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  color: theme.accent,
                  marginBottom: '12px',
                }}>
                  Additional Details (Optional)
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Provide any additional context..."
                  maxLength={500}
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    padding: '14px',
                    backgroundColor: theme.surfaceAlt,
                    border: `1.5px solid ${theme.border}`,
                    borderRadius: '10px',
                    fontFamily: "'Special Elite', cursive",
                    fontSize: '14px',
                    color: theme.ink,
                    outline: 'none',
                    resize: 'none',
                    lineHeight: 1.6,
                  }}
                />
                <div style={{
                  textAlign: 'right',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '11px',
                  color: theme.inkMuted,
                  marginTop: '6px',
                }}>
                  {details.length}/500
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSubmit}
                disabled={submitting || !selectedReason}
                style={{
                  width: '100%',
                  padding: '16px',
                  backgroundColor: theme.crimson,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '14px',
                  fontWeight: 700,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  cursor: submitting || !selectedReason ? 'not-allowed' : 'pointer',
                  opacity: submitting || !selectedReason ? 0.5 : 1,
                  boxShadow: '0 4px 16px rgba(139, 26, 26, 0.3)',
                }}
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </motion.button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ReportModal;

```

### ./client/src/components/chat/SearchOverlay.jsx

```
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../../utils/haptics';
import { theme as design } from '../../utils/theme';
import { ChevronLeft, Search, XCircle } from 'lucide-react';

/* ==================================================================
   ARCHIVAL THEME CONSTANTS
================================================================== */
const theme = {
  paper: '#fdfbf7',
  surface: '#ffffff',
  surfaceAlt: '#f4f1ea',
  border: '#e0d8c8',
  borderDark: '#d4c5a9',
  ink: '#1a1a1a',
  inkMuted: '#8c8275',
  accent: '#8b4513',
  crimson: '#8b1a1a',
  shadowWarm: 'rgba(139, 69, 19, 0.12)',
};

const SearchOverlay = ({ messages, myId, onClose, onJumpTo }) => {
  const [query, setQuery] = useState('');

  // Memoized Search Engine
  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return messages
      .filter((m) => !m.deleted && m.text && m.text.toLowerCase().includes(q))
      .slice(-50) // Cap at 50 results for optimal render performance
      .reverse(); // Show most recent matches first
  }, [query, messages]);

  // Utility to safely highlight ALL occurrences of the search query
  const highlightText = (text, highlight) => {
    if (!highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === highlight.toLowerCase() ? (
        <mark
          key={i}
          style={{
            backgroundColor: 'rgba(212, 175, 55, 0.35)', // Archival highlighter
            color: theme.ink,
            padding: '0 2px',
            borderRadius: '2px',
            boxShadow: '0 1px 2px rgba(212, 175, 55, 0.2)',
          }}
        >
          {part}
        </mark>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: theme.paper,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        contain: 'strict', // Absolute layout isolation
      }}
    >
      {/* GPU Promoted Tactile Physics */}
      <style>{`
        .tactile-result-btn {
          transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.2s ease, border-color 0.2s ease;
          will-change: transform;
        }
        @media (hover: hover) {
          .tactile-result-btn:hover {
            transform: translate3d(0, -2px, 0) scale3d(1.01, 1.01, 1);
            box-shadow: 0 6px 16px ${theme.shadowWarm} !important;
            border-color: ${theme.borderDark} !important;
          }
        }
        .tactile-result-btn:active {
          transform: scale3d(0.98, 0.98, 1) translate3d(0, 0, 0) !important;
          transition: transform 0.08s cubic-bezier(0, 0, 0.2, 1) !important;
          box-shadow: 0 2px 4px rgba(0,0,0,0.06) !important;
        }

        .archival-scrollbar::-webkit-scrollbar { width: 4px; }
        .archival-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .archival-scrollbar::-webkit-scrollbar-thumb { background: ${theme.borderDark}; border-radius: 4px; }
      `}</style>

      {/* Cinematic Film Grain Overlay */}
      <div 
        aria-hidden="true" 
        style={{ 
          position: 'absolute', inset: 0, 
          backgroundImage: `url("${design?.texture?.grain || ''}")`, 
          mixBlendMode: 'multiply', opacity: 0.7, pointerEvents: 'none', zIndex: 0 
        }} 
      />

      {/* Sticky Archival Header */}
      <div
        style={{
          padding: 'max(12px, env(safe-area-inset-top)) 16px 12px',
          backgroundColor: theme.surface,
          borderBottom: `1px solid ${theme.borderDark}`,
          boxShadow: `0 4px 16px ${theme.shadowWarm}`,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <button
          onClick={() => {
            triggerHaptic('light');
            onClose();
          }}
          aria-label="Close search"
          style={{
            background: 'none',
            border: 'none',
            color: theme.inkMuted,
            fontSize: '11px',
            fontFamily: "'Inter', sans-serif",
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            cursor: 'pointer',
            padding: '8px 4px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <ChevronLeft size={20} strokeWidth={2.5} color="currentColor" style={{ marginRight: '2px' }} /> Back
        </button>

        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          backgroundColor: theme.surfaceAlt,
          border: `1.5px solid ${theme.border}`,
          borderRadius: '12px',
          padding: '6px 12px',
          gap: '8px',
        }}>
          <Search size={16} color={theme.inkMuted} strokeWidth={2.5} />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search archival logs..."
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: '15px',
              fontFamily: "'Special Elite', 'Courier New', monospace",
              color: theme.ink,
              outline: 'none',
              WebkitAppearance: 'none', // Strip iOS native input styling
            }}
          />
          <AnimatePresence>
            {query && (
              <motion.button
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                onClick={() => {
                  triggerHaptic('light');
                  setQuery('');
                }}
                style={{
                  background: 'none', border: 'none', padding: 0,
                  color: theme.inkMuted, cursor: 'pointer', display: 'flex'
                }}
              >
                <XCircle size={16} color="currentColor" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Results Area */}
      <div
        className="archival-scrollbar"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          position: 'relative',
          zIndex: 2,
          contain: 'layout style paint',
        }}
      >
        {query.trim() && results.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: theme.inkMuted,
              fontFamily: "'Playfair Display', serif",
              fontStyle: 'italic',
              fontSize: '16px',
            }}
          >
            No artifacts found matching "{query}"
          </motion.div>
        )}

        {results.map((m) => {
          const isMine = String(m.senderId || m.sender) === String(myId);
          const time = m.createdAt
            ? new Date(m.createdAt).toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : '';

          return (
            <button
              key={m._id}
              className="tactile-result-btn"
              onClick={() => {
                triggerHaptic('medium');
                onJumpTo(m._id);
                onClose();
              }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '16px',
                marginBottom: '12px',
                backgroundColor: theme.surface,
                border: `1px solid ${theme.border}`,
                borderLeft: `3px solid ${isMine ? theme.accent : theme.crimson}`,
                borderRadius: '12px',
                cursor: 'pointer',
                boxShadow: `0 2px 8px ${theme.shadowWarm}`,
                outline: 'none',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '10px',
                  fontWeight: 800,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  color: theme.inkMuted,
                  marginBottom: '8px',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}
              >
                <span>{isMine ? 'Your Log' : 'Their Log'}</span>
                <span>{time}</span>
              </div>
              
              <div
                style={{
                  fontFamily: "'Special Elite', 'Courier New', monospace",
                  fontSize: '14px',
                  color: theme.ink,
                  lineHeight: 1.5,
                  wordBreak: 'break-word',
                }}
              >
                {highlightText(m.text || '', query)}
              </div>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default SearchOverlay;
```

### ./client/src/index.css

```
/* ==========================================
   MATCHALIZE: THE SUNLIT LIBRARY THEME
   ========================================== */

:root {
  /* The Ink & Paper Palette */
  --color-ink: #2c2c2c;
  --color-faded-ink: #6b6b6b;
  --color-parchment: #fdfbf7;
  --color-paper-white: #ffffff;
  --color-leather: #8b4513;
  --color-leather-dark: #5e2e0e;
  --color-sepia-border: #d4c5a9;
  --color-wax-red: #8b0000;
  
  /* Typography */
  --font-heading: 'Playfair Display', serif;
  --font-handwriting: 'Dancing Script', cursive;
  --font-typewriter: 'Special Elite', cursive;
  --font-system: 'Inter', sans-serif;
}

/* Global Resets */
* {
  -webkit-tap-highlight-color: transparent;
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  background-color: var(--color-parchment);
  color: var(--color-ink);
  font-family: var(--font-typewriter);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: hidden;
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
  /* Subtle shadow to make it feel like a physical screen/pages */
  box-shadow: 0 0 60px rgba(0,0,0,0.08);
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

/* Ghost Mode Sun/Moon Switch */
.switch {
  font-size: 17px;
  position: relative;
  display: inline-block;
  width: 64px;
  height: 34px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: #73C0FC;
  transition: .4s;
  border-radius: 30px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 30px;
  width: 30px;
  border-radius: 20px;
  left: 2px;
  bottom: 2px;
  z-index: 2;
  background-color: #e8e8e8;
  transition: .4s;
}

.sun svg {
  position: absolute;
  top: 6px;
  left: 36px;
  z-index: 1;
  width: 24px;
  height: 24px;
  fill: #fff;
  animation: rotate 15s linear infinite;
}

.moon svg {
  fill: #73C0FC;
  position: absolute;
  top: 5px;
  left: 5px;
  z-index: 1;
  width: 24px;
  height: 24px;
  animation: tilt 5s linear infinite;
}

@keyframes rotate {
  0% { transform: rotate(0); }
  100% { transform: rotate(360deg); }
}

@keyframes tilt {
  0% { transform: rotate(0deg); }
  25% { transform: rotate(-10deg); }
  75% { transform: rotate(10deg); }
  100% { transform: rotate(0deg); }
}

input:checked + .slider {
  background-color: #183153;
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

```

### ./client/src/pages/Admin.jsx

```
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, AlertTriangle, Users, BarChart3, Settings,
  Search, ChevronLeft, ChevronRight, RefreshCw,
  Ban, EyeOff, X, Clock
} from 'lucide-react';

/* Locked tokens — same family as ProfileCard */
const T = {
  desk: '#ece4d4',
  paper: '#fdfbf7',
  card: '#fffdf8',
  surfaceAlt: '#f4f1ea',
  lineDark: '#d4c5a9',
  ink: '#1a1a1a',
  inkSoft: '#4a4a4a',
  inkMuted: '#8c8275',
  accent: '#8b4513',
  crimson: '#8b1a1a',
  gold: '#c4952a',
  goldDeep: '#8b6914',
  success: '#2e7d32',
  fontDisplay: "'Playfair Display', Georgia, serif",
  fontType: "'Special Elite', 'Courier New', monospace",
  fontBody: "'Inter', -apple-system, sans-serif",
};

const label = { fontFamily: T.fontBody, fontSize: 9.5, fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.inkMuted };

const API = '/api/admin';
const TABS = ['overview', 'reports', 'users', 'analytics', 'settings'];

async function apiFetch(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (res.status === 401 || res.status === 403) {
    window.location.href = '/';
    throw new Error('Unauthorized');
  }

  const text = await res.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!res.ok) {
    const msg = payload?.message || text || 'Request failed';
    throw new Error(msg);
  }

  return payload ?? {};
}

function Card({ children, style = {}, ...props }) {
  return (
    <div style={{ backgroundColor: T.paper, border: '1px solid rgba(212,197,169,0.7)', borderRadius: 18, boxShadow: '0 14px 34px rgba(88,63,30,0.16), 0 3px 8px rgba(88,63,30,0.08)', ...style }} {...props}>
      {children}
    </div>
  );
}

function Badge({ children, color = T.inkMuted, style = {} }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 10, fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase',
      padding: '3px 9px', borderRadius: 999,
      backgroundColor: `${color}14`, color,
      border: `1px solid ${color}30`,
      ...style,
    }}>{children}</span>
  );
}

function Skeleton({ style = {} }) {
  return <div style={{ backgroundColor: T.surfaceAlt, borderRadius: 6, ...style }} />;
}

function PageHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontFamily: T.fontDisplay, fontSize: 26, fontWeight: 800, color: T.ink, margin: 0, letterSpacing: '-0.02em' }}>{title}</h2>
      {subtitle && <p style={{ ...label, marginTop: 6 }}>{subtitle}</p>}
    </div>
  );
}

const pillBtn = (variant = 'quiet') => ({
  background: variant === 'danger' ? T.crimson : variant === 'active' ? T.crimson : T.surfaceAlt,
  border: variant === 'danger' || variant === 'active' ? 'none' : '1px solid rgba(212,197,169,0.7)',
  borderRadius: 999,
  padding: '8px 16px',
  cursor: 'pointer',
  fontSize: 10.5,
  fontWeight: 800,
  letterSpacing: '1px',
  textTransform: 'uppercase',
  color: variant === 'danger' || variant === 'active' ? '#fff' : T.inkSoft,
  fontFamily: T.fontBody,
  transition: 'transform 0.15s ease-out',
});

function Pagination({ page, totalPages, onPage }) {
  if (!totalPages || totalPages <= 1) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 20 }}>
      <button onClick={() => onPage(page - 1)} disabled={page <= 1}
        style={{ ...pillBtn(), width: 36, height: 36, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.4 : 1 }}>
        <ChevronLeft size={16} strokeWidth={2} />
      </button>
      <span style={{ fontFamily: T.fontType, fontSize: 13, color: T.inkSoft }}>{page} / {totalPages}</span>
      <button onClick={() => onPage(page + 1)} disabled={page >= totalPages}
        style={{ ...pillBtn(), width: 36, height: 36, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.4 : 1 }}>
        <ChevronRight size={16} strokeWidth={2} />
      </button>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    pending: T.gold,
    reviewed: T.accent,
    actioned: T.crimson,
    dismissed: T.inkMuted,
  };
  const c = colors[status] || colors.pending;
  return (
    <span style={{
      fontSize: 10, fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase',
      padding: '3px 10px', borderRadius: 999,
      backgroundColor: `${c}14`, color: c, border: `1px solid ${c}30`,
    }}>{status}</span>
  );
}

// ─── OVERVIEW TAB ───
function OverviewTab() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      const data = await apiFetch('/stats');
      setStats(data);
    } catch (e) {
      console.error('Failed to load stats:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStats(); }, []);

  const cards = stats ? [
    { label: 'Total Users', value: stats.totalUsers, icon: <Users size={18} strokeWidth={2} />, accent: T.accent },
    { label: 'New Today', value: stats.newToday, icon: <Users size={18} strokeWidth={2} />, accent: T.accent },
    { label: 'Active (7d)', value: stats.active7d, icon: <LayoutDashboard size={18} strokeWidth={2} />, accent: T.accent },
    { label: 'Active (30d)', value: stats.active30d, icon: <Clock size={18} strokeWidth={2} />, accent: T.accent },
    { label: 'Pending Reports', value: stats.pendingReports, icon: <AlertTriangle size={18} strokeWidth={2} />, accent: T.crimson },
    { label: 'Active Bans', value: stats.activeBans, icon: <Ban size={18} strokeWidth={2} />, accent: T.crimson },
    { label: 'Shadowbans', value: stats.activeShadowbans, icon: <EyeOff size={18} strokeWidth={2} />, accent: T.gold },
  ] : [];

  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <Card key={i} style={{ padding: 20 }}>
            <Skeleton style={{ height: 10, width: 100, marginBottom: 14 }} />
            <Skeleton style={{ height: 30, width: 80 }} />
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return <Card style={{ padding: 40, textAlign: 'center' }}><p style={{ fontFamily: T.fontBody, fontSize: 13.5, color: T.inkMuted, margin: 0 }}>Failed to load stats. Check your connection and admin access.</p></Card>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <PageHeader title="Overview" subtitle="Platform health at a glance" />
        <button onClick={loadStats} className="tactile-btn" style={{ ...pillBtn(), display: 'flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={13} strokeWidth={2} /> Refresh
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
            <Card style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={label}>{c.label}</span>
                <div style={{ width: 32, height: 32, borderRadius: 12, border: `1px solid ${c.accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: `${c.accent}12`, color: c.accent }}>{c.icon}</div>
              </div>
              <p style={{ fontFamily: T.fontDisplay, fontSize: 28, fontWeight: 800, color: T.ink, margin: 0, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                {(c.value ?? 0).toLocaleString()}
              </p>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── REPORTS TAB ───
function ReportsTab() {
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [detailReport, setDetailReport] = useState(null);

  const load = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, perPage: 15 });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search) params.set('search', search);
      const json = await apiFetch(`/reports?${params}`);
      setReports(json.data || []);
      setPagination(json.pagination);
    } catch (e) {
      console.error('Failed to load reports:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const updateReport = async (id, body) => {
    try {
      await apiFetch(`/reports/${id}`, { method: 'PUT', body: JSON.stringify(body) });
      load(pagination.page);
      setDetailReport(null);
    } catch (e) {
      alert('Failed to update report: ' + e.message);
    }
  };

  return (
    <div>
      <PageHeader title="Reports" subtitle={`${pagination.total} total reports`} />
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} strokeWidth={2} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: T.inkMuted }} />
          <input
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && load(1)}
            style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px 10px 38px', borderRadius: 6, border: '1px solid rgba(212,197,169,0.7)', backgroundColor: T.paper, fontSize: 13.5, color: T.ink, outline: 'none', fontFamily: T.fontBody }}
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '10px 16px', borderRadius: 999, border: '1px solid rgba(212,197,169,0.7)', backgroundColor: T.paper, fontSize: 12, fontWeight: 600, color: T.ink, cursor: 'pointer', fontFamily: T.fontBody }}>
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="reviewed">Reviewed</option>
          <option value="actioned">Actioned</option>
          <option value="dismissed">Dismissed</option>
        </select>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gap: 12 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} style={{ padding: 16 }}>
              <Skeleton style={{ height: 14, width: '60%', marginBottom: 10 }} />
              <Skeleton style={{ height: 12, width: '40%' }} />
            </Card>
          ))}
        </div>
      ) : reports.length === 0 ? (
        <Card style={{ padding: 40, textAlign: 'center' }}><p style={{ fontFamily: T.fontBody, fontSize: 13.5, color: T.inkMuted, margin: 0 }}>No reports found</p></Card>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {reports.map(r => (
            <Card key={r._id} style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1, minWidth: 0 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: T.surfaceAlt, border: '1px solid rgba(212,197,169,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                    {r.reported.photo ? <img src={r.reported.photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : <Users size={16} strokeWidth={2} style={{ color: T.inkMuted }} />}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, fontSize: 14, color: T.ink }}>{r.reported.name}</span>
                      <StatusBadge status={r.status} />
                      <Badge color={T.gold}>{r.reportCount} reports</Badge>
                    </div>
                    <p style={{ fontSize: 12.5, fontWeight: 450, color: T.inkSoft, margin: '3px 0 0' }}>{r.reason} — by {r.reporter.name}</p>
                    <p style={{ fontFamily: T.fontType, fontSize: 11, color: T.inkMuted, margin: '3px 0 0' }}>{new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button className="tactile-btn" onClick={() => setDetailReport(r)} style={pillBtn()}>View</button>
                  {r.status === 'pending' && <>
                    <button className="tactile-btn" onClick={() => updateReport(r._id, { status: 'dismissed' })} style={pillBtn()}>Dismiss</button>
                    <button className="tactile-btn" onClick={() => updateReport(r._id, { status: 'actioned' })} style={pillBtn('danger')}>Action</button>
                  </>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Pagination page={pagination.page} totalPages={pagination.totalPages} onPage={p => load(p)} />

      <AnimatePresence>
        {detailReport && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => setDetailReport(null)}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(28,19,10,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              onClick={e => e.stopPropagation()}
              style={{ background: T.paper, borderRadius: 18, border: '1px solid rgba(212,197,169,0.7)', boxShadow: '0 24px 64px rgba(12,7,2,0.4)', maxWidth: 500, width: '100%', maxHeight: '80vh', overflowY: 'auto', padding: 24, boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontFamily: T.fontDisplay, fontSize: 19, fontWeight: 800, color: T.ink, margin: 0, letterSpacing: '-0.02em' }}>Report Detail</h3>
                <button className="tactile-btn" onClick={() => setDetailReport(null)} aria-label="Close" style={{ backgroundColor: T.surfaceAlt, border: '1px solid rgba(212,197,169,0.7)', borderRadius: 12, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: T.ink, flexShrink: 0 }}><X size={16} strokeWidth={2} /></button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                <div style={{ backgroundColor: T.surfaceAlt, borderRadius: 6, border: '1px solid rgba(212,197,169,0.5)', padding: 12 }}>
                  <p style={label}>Reporter</p>
                  <p style={{ fontWeight: 600, fontSize: 14, color: T.ink, margin: '6px 0 0' }}>{detailReport.reporter.name}</p>
                  <p style={{ fontFamily: T.fontType, fontSize: 11.5, color: T.inkMuted, margin: '2px 0 0' }}>{detailReport.reporter.email}</p>
                </div>
                <div style={{ backgroundColor: T.surfaceAlt, borderRadius: 6, border: '1px solid rgba(212,197,169,0.5)', padding: 12 }}>
                  <p style={label}>Reported</p>
                  <p style={{ fontWeight: 600, fontSize: 14, color: T.ink, margin: '6px 0 0' }}>{detailReport.reported.name}</p>
                  <p style={{ fontFamily: T.fontType, fontSize: 11.5, color: T.inkMuted, margin: '2px 0 0' }}>{detailReport.reported.email}</p>
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <p style={{ ...label, marginBottom: 8 }}>Reason</p>
                <Badge color={T.accent}>{detailReport.reason}</Badge>
              </div>
              {detailReport.details && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ ...label, marginBottom: 8 }}>Details</p>
                  <p style={{ fontFamily: T.fontType, fontSize: 13, color: T.ink, backgroundColor: T.surfaceAlt, padding: 12, borderRadius: 6, border: '1px solid rgba(212,197,169,0.5)', lineHeight: 1.6, margin: 0, wordBreak: 'break-word' }}>{detailReport.details}</p>
                </div>
              )}
              <div style={{ marginBottom: 20 }}>
                <p style={{ ...label, marginBottom: 8 }}>Total Reports Against This User</p>
                <p style={{ fontFamily: T.fontDisplay, fontSize: 26, fontWeight: 800, color: T.crimson, margin: 0, fontVariantNumeric: 'tabular-nums' }}>{detailReport.reportCount}</p>
              </div>
              {detailReport.status === 'pending' && (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button className="tactile-btn" onClick={() => updateReport(detailReport._id, { status: 'dismissed' })} style={{ ...pillBtn(), flex: 1 }}>Dismiss</button>
                  <button className="tactile-btn" onClick={() => updateReport(detailReport._id, { status: 'actioned' })} style={{ ...pillBtn('danger'), flex: 1 }}>Action</button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── USERS TAB ───
function UsersTab() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [detailUser, setDetailUser] = useState(null);

  const load = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, perPage: 15 });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search) params.set('search', search);
      const json = await apiFetch(`/users?${params}`);
      setUsers(json.data || []);
      setPagination(json.pagination);
    } catch (e) {
      console.error('Failed to load users:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const updateUser = async (id, body) => {
    try {
      await apiFetch(`/users/${id}`, { method: 'PUT', body: JSON.stringify(body) });
      load(pagination.page);
      setDetailUser(null);
    } catch (e) {
      alert('Failed to update user: ' + e.message);
    }
  };

  const userStatus = (u) => {
    if (u.suspended) return 'Suspended';
    if (u.isGhost) return 'Shadowbanned';
    return 'Active';
  };

  const statusColor = (s) => {
    if (s === 'Suspended') return T.crimson;
    if (s === 'Shadowbanned') return T.gold;
    return T.success;
  };

  return (
    <div>
      <PageHeader title="Users" subtitle={`${pagination.total} total users`} />
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} strokeWidth={2} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: T.inkMuted }} />
          <input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load(1)}
            style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px 10px 38px', borderRadius: 6, border: '1px solid rgba(212,197,169,0.7)', backgroundColor: T.paper, fontSize: 13.5, color: T.ink, outline: 'none', fontFamily: T.fontBody }} />
        </div>
        {['all', 'active', 'shadowbanned', 'suspended'].map(s => (
          <button key={s} className="tactile-btn" onClick={() => setStatusFilter(s)}
            style={{ ...pillBtn(statusFilter === s ? 'active' : 'quiet'), color: statusFilter === s ? '#fff' : T.inkSoft, textTransform: 'capitalize', letterSpacing: '0.5px' }}>
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'grid', gap: 12 }}>{Array.from({ length: 5 }).map((_, i) => <Card key={i} style={{ padding: 16 }}><Skeleton style={{ height: 14, width: '50%', marginBottom: 10 }} /><Skeleton style={{ height: 12, width: '30%' }} /></Card>)}</div>
      ) : users.length === 0 ? (
        <Card style={{ padding: 40, textAlign: 'center' }}><p style={{ fontFamily: T.fontBody, fontSize: 13.5, color: T.inkMuted, margin: 0 }}>No users found</p></Card>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {users.map(u => {
            const status = userStatus(u);
            return (
              <Card key={u._id} style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1, minWidth: 0 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: T.surfaceAlt, border: '1px solid rgba(212,197,169,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                      {u.photos?.[0] ? <img src={u.photos[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : <span style={{ fontWeight: 700, color: T.inkMuted, fontSize: 16 }}>{u.name?.[0]}</span>}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 600, fontSize: 14, color: T.ink }}>{u.name}</span>
                        <Badge color={statusColor(status)}>{status}</Badge>
                      </div>
                      <p style={{ fontSize: 12.5, fontWeight: 450, color: T.inkSoft, margin: '3px 0 0' }}>{u.email} · {u.branch} · {u.year}</p>
                      <p style={{ fontFamily: T.fontType, fontSize: 11, color: T.inkMuted, margin: '3px 0 0' }}>Reports: {u.reportStats?.count || 0} · Last active: {u.lastActive ? new Date(u.lastActive).toLocaleDateString() : 'Never'}</p>
                    </div>
                  </div>
                  <button className="tactile-btn" onClick={() => setDetailUser(u)} style={{ ...pillBtn(), flexShrink: 0 }}>Manage</button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      <Pagination page={pagination.page} totalPages={pagination.totalPages} onPage={p => load(p)} />

      <AnimatePresence>
        {detailUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => setDetailUser(null)}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(28,19,10,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              onClick={e => e.stopPropagation()}
              style={{ background: T.paper, borderRadius: 18, border: '1px solid rgba(212,197,169,0.7)', boxShadow: '0 24px 64px rgba(12,7,2,0.4)', maxWidth: 500, width: '100%', maxHeight: '80vh', overflowY: 'auto', padding: 24, boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontFamily: T.fontDisplay, fontSize: 19, fontWeight: 800, color: T.ink, margin: 0, letterSpacing: '-0.02em' }}>{detailUser.name}</h3>
                <button className="tactile-btn" onClick={() => setDetailUser(null)} aria-label="Close" style={{ backgroundColor: T.surfaceAlt, border: '1px solid rgba(212,197,169,0.7)', borderRadius: 12, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: T.ink, flexShrink: 0 }}><X size={16} strokeWidth={2} /></button>
              </div>
              <div style={{ backgroundColor: T.surfaceAlt, borderRadius: 6, border: '1px solid rgba(212,197,169,0.5)', padding: 16, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  ['Email', detailUser.email],
                  ['College', `${detailUser.college} · ${detailUser.branch} · ${detailUser.year}`],
                  ['Joined', new Date(detailUser.createdAt).toLocaleDateString()],
                  ['Last Active', detailUser.lastActive ? new Date(detailUser.lastActive).toLocaleString() : 'Never'],
                  ['Reports', `${detailUser.reportStats?.count || 0} total, ${detailUser.reportStats?.pendingCount || 0} pending`],
                ].map(([k, v]) => (
                  <div key={k}>
                    <span style={label}>{k}</span>
                    <p style={{ fontFamily: T.fontType, fontSize: 13, color: T.ink, margin: '3px 0 0', wordBreak: 'break-word' }}>{v}</p>
                  </div>
                ))}
                {detailUser.suspendedReason && (
                  <div>
                    <span style={{ ...label, color: T.crimson }}>Suspension Reason</span>
                    <p style={{ fontFamily: T.fontType, fontSize: 13, color: T.crimson, margin: '3px 0 0' }}>{detailUser.suspendedReason}</p>
                  </div>
                )}
              </div>
              <div style={{ marginBottom: 16 }}>
                <p style={{ ...label, marginBottom: 8 }}>Admin Notes</p>
                <textarea value={detailUser.adminNotes || ''} onChange={e => setDetailUser({ ...detailUser, adminNotes: e.target.value })}
                  placeholder="Internal notes..."
                  style={{ width: '100%', boxSizing: 'border-box', minHeight: 60, padding: 10, borderRadius: 6, border: '1px solid rgba(212,197,169,0.7)', backgroundColor: T.surfaceAlt, fontSize: 13, color: T.ink, resize: 'vertical', fontFamily: T.fontBody, outline: 'none' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button className="tactile-btn" onClick={() => updateUser(detailUser._id, { suspended: !detailUser.suspended, suspendedReason: !detailUser.suspended ? 'Admin action' : '' })}
                  style={{ ...pillBtn(detailUser.suspended ? 'quiet' : 'danger'), padding: '12px 8px' }}>
                  {detailUser.suspended ? 'Unsuspend' : 'Suspend'}
                </button>
                <button className="tactile-btn" onClick={() => updateUser(detailUser._id, { isGhost: !detailUser.isGhost })}
                  style={{ ...pillBtn('quiet'), padding: '12px 8px', color: detailUser.isGhost ? T.inkSoft : T.gold, borderColor: detailUser.isGhost ? 'rgba(212,197,169,0.7)' : `${T.gold}55` }}>
                  {detailUser.isGhost ? 'Unshadowban' : 'Shadowban'}
                </button>
                <button className="tactile-btn" onClick={() => updateUser(detailUser._id, { adminNotes: detailUser.adminNotes })}
                  style={{ ...pillBtn('quiet'), padding: '12px 8px' }}>
                  Save Notes
                </button>
                <button className="tactile-btn" onClick={async () => { try { await apiFetch(`/users/${detailUser._id}/disconnect`, { method: 'POST' }); alert('Disconnect signal sent'); } catch (e) { alert('Failed: ' + e.message); } }}
                  style={{ ...pillBtn('quiet'), padding: '12px 8px', color: T.crimson, borderColor: `${T.crimson}45` }}>
                  Kick
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── ANALYTICS TAB ───
function AnalyticsTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/analytics').then(d => { setData(d); setLoading(false); }).catch(e => { console.error('Failed to load analytics:', e.message); setLoading(false); });
  }, []);

  const Chart = ({ title, items, color }) => {
    const max = Math.max(...items.map(i => i.count), 1);
    return (
      <Card style={{ padding: 20 }}>
        <h4 style={{ ...label, marginBottom: 16 }}>{title}</h4>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 120 }}>
          {items.slice(-14).map((item, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <div style={{ width: '100%', backgroundColor: color, borderRadius: '3px 3px 0 0', height: `${(item.count / max) * 100}%`, minHeight: 2, transition: 'height 0.4s cubic-bezier(0.22, 1, 0.36, 1)' }} />
              <span style={{ fontFamily: T.fontType, fontSize: 8, color: T.inkMuted, transform: 'rotate(-45deg)', whiteSpace: 'nowrap' }}>{item.date?.slice(5)}</span>
            </div>
          ))}
        </div>
      </Card>
    );
  };

  if (loading) return <div style={{ display: 'grid', gap: 16 }}>{Array.from({ length: 4 }).map((_, i) => <Card key={i} style={{ padding: 20, height: 180 }}><Skeleton style={{ height: '100%', width: '100%' }} /></Card>)}</div>;
  if (!data) return <Card style={{ padding: 40, textAlign: 'center' }}><p style={{ fontFamily: T.fontBody, fontSize: 13.5, color: T.inkMuted, margin: 0 }}>Failed to load analytics</p></Card>;

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Last 30 days" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        <Chart title="Daily Signups" items={data.dailySignups} color={T.success} />
        <Chart title="Active Users" items={data.dailyActive} color={T.accent} />
        <Chart title="Reports" items={data.dailyReports} color={T.crimson} />
        <Chart title="Matches" items={data.dailyMatches} color={T.gold} />
        <Chart title="Messages" items={data.dailyMessages} color={T.goldDeep} />
      </div>
    </div>
  );
}

// ─── SETTINGS TAB ───
function SettingsTab() {
  const [settings, setSettings] = useState({});
  const [original, setOriginal] = useState({});
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/settings').then(d => { setSettings(d); setOriginal(d); setLoading(false); }).catch(e => { console.error('Failed to load settings:', e.message); setLoading(false); });
  }, []);

  const save = async () => {
    try {
      await apiFetch('/settings', { method: 'PUT', body: JSON.stringify(settings) });
      setOriginal({ ...settings });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      alert('Failed to save settings: ' + e.message);
    }
  };

  const set = (key, val) => { setSettings(s => ({ ...s, [key]: val })); setSaved(false); };

  const fields = [
    { group: 'General', items: [
      { key: 'supportEmail', label: 'Support Email', type: 'text' },
      { key: 'maintenanceMode', label: 'Maintenance Mode', type: 'bool' },
    ]},
    { group: 'Moderation', items: [
      { key: 'shadowbanThreshold', label: 'Shadowban Score Threshold', type: 'number' },
      { key: 'autoShadowban', label: 'Auto-Shadowban', type: 'bool' },
    ]},
  ];

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(original);

  if (loading) return <div>{Array.from({ length: 3 }).map((_, i) => <Card key={i} style={{ padding: 20, marginBottom: 12 }}><Skeleton style={{ height: 12, width: 200, marginBottom: 14 }} /><Skeleton style={{ height: 40 }} /></Card>)}</div>;

  return (
    <div>
      <PageHeader title="Settings" subtitle="Platform configuration" />
      {fields.map(group => (
        <Card key={group.group} style={{ padding: 20, marginBottom: 16 }}>
          <h4 style={{ fontFamily: T.fontDisplay, fontSize: 16, fontWeight: 800, color: T.ink, margin: '0 0 16px', letterSpacing: '-0.01em' }}>{group.group}</h4>
          {group.items.map(f => (
            <div key={f.key} style={{ marginBottom: 14 }}>
              <label style={label}>{f.label}</label>
              {f.type === 'bool'
                ? <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                    <button onClick={() => set(f.key, !settings[f.key])} style={{ width: 44, height: 24, borderRadius: 999, border: '1px solid rgba(212,197,169,0.7)', backgroundColor: settings[f.key] ? T.crimson : T.surfaceAlt, cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', backgroundColor: '#fff', position: 'absolute', top: 2, left: settings[f.key] ? 23 : 2, transition: 'left 0.2s cubic-bezier(0.22, 1, 0.36, 1)', boxShadow: '0 2px 6px rgba(88,63,30,0.25)' }} />
                    </button>
                    <span style={{ fontFamily: T.fontType, fontSize: 11.5, color: T.inkMuted }}>{settings[f.key] ? 'Enabled' : 'Disabled'}</span>
                  </div>
                : <input
                    type={f.type === 'number' ? 'number' : 'text'}
                    value={settings[f.key] ?? ''}
                    onChange={e => set(f.key, f.type === 'number' ? Number(e.target.value) : e.target.value)}
                    style={{ width: '100%', maxWidth: 300, padding: '9px 12px', borderRadius: 6, border: '1px solid rgba(212,197,169,0.7)', backgroundColor: T.paper, fontSize: 13.5, color: T.ink, fontFamily: T.fontBody, outline: 'none', marginTop: 8 }}
                  />
              }
            </div>
          ))}
        </Card>
      ))}
      <button className="tactile-btn" onClick={save} disabled={!hasChanges}
        style={{ ...pillBtn('danger'), padding: '13px 28px', fontSize: 11, opacity: hasChanges ? 1 : 0.4, cursor: hasChanges ? 'pointer' : 'not-allowed' }}>
        {saved ? 'Saved' : 'Save Settings'}
      </button>
    </div>
  );
}

// ─── MAIN ADMIN PAGE ───
export default function Admin() {
  const [tab, setTab] = useState('overview');
  const [authed, setAuthed] = useState(null);

  useEffect(() => {
    apiFetch('/stats').then(() => setAuthed(true)).catch(() => setAuthed(false));
  }, []);

  if (authed === null) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: T.desk }}><p style={{ fontFamily: T.fontType, color: T.inkMuted, fontSize: 13 }}>Checking admin access...</p></div>;
  if (authed === false) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: T.desk, gap: 12, padding: 20, textAlign: 'center' }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: T.surfaceAlt, border: '1px solid rgba(212,197,169,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <AlertTriangle size={18} strokeWidth={2} color={T.crimson} />
      </div>
      <p style={{ fontFamily: T.fontDisplay, color: T.ink, fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>Access Denied</p>
      <p style={{ fontFamily: T.fontBody, color: T.inkMuted, fontSize: 13.5, margin: 0 }}>Only the admin can access this page.</p>
    </div>
  );

  const tabConfig = {
    overview: { label: 'Overview', Icon: LayoutDashboard },
    reports: { label: 'Reports', Icon: AlertTriangle },
    users: { label: 'Users', Icon: Users },
    analytics: { label: 'Analytics', Icon: BarChart3 },
    settings: { label: 'Settings', Icon: Settings },
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: T.desk }}>
      <aside style={{ width: 240, backgroundColor: T.paper, border: '1px solid rgba(212,197,169,0.7)', borderRadius: 18, boxShadow: '0 14px 34px rgba(88,63,30,0.16), 0 3px 8px rgba(88,63,30,0.08)', display: 'flex', flexDirection: 'column', position: 'sticky', top: 16, height: 'calc(100vh - 32px)', margin: 16, flexShrink: 0, overflow: 'hidden', boxSizing: 'border-box' }}>
        <div style={{ padding: '22px 18px 18px', borderBottom: '1px solid rgba(212,197,169,0.7)' }}>
          <h1 style={{ fontFamily: T.fontDisplay, fontSize: 22, fontWeight: 900, color: T.ink, margin: 0, letterSpacing: '-0.02em', lineHeight: 1 }}>matchalize</h1>
          <p style={{ ...label, marginTop: 8 }}>Admin Panel</p>
        </div>
        <nav style={{ flex: 1, padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {TABS.map(tb => {
            const active = tab === tb;
            const { Icon } = tabConfig[tb];
            return (
              <button key={tb} onClick={() => setTab(tb)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', borderRadius: 12, border: active ? '1px solid rgba(212,197,169,0.9)' : '1px solid transparent', cursor: 'pointer', fontSize: 13.5, fontWeight: active ? 700 : 500, textAlign: 'left', backgroundColor: active ? T.card : 'transparent', boxShadow: active ? '0 6px 16px rgba(88,63,30,0.12)' : 'none', color: T.ink, fontFamily: T.fontBody, width: '100%' }}>
                <Icon size={17} strokeWidth={active ? 2.5 : 2} color={active ? T.crimson : T.inkMuted} />
                {tabConfig[tb].label}
              </button>
            );
          })}
        </nav>
        <div style={{ padding: 16, borderTop: '1px solid rgba(212,197,169,0.7)', textAlign: 'center' }}>
          <p style={{ fontFamily: T.fontType, fontSize: 10.5, color: T.inkMuted, margin: 0 }}>v1.0.0</p>
        </div>
      </aside>

      <main style={{ flex: 1, padding: '24px 32px', maxWidth: 1200, overflowY: 'auto', position: 'relative' }}>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
            {tab === 'overview' && <OverviewTab />}
            {tab === 'reports' && <ReportsTab />}
            {tab === 'users' && <UsersTab />}
            {tab === 'analytics' && <AnalyticsTab />}
            {tab === 'settings' && <SettingsTab />}
          </motion.div>
        </AnimatePresence>
      </main>

      <style>{`
        .tactile-btn { transition: transform 0.15s ease-out; will-change: transform; }
        .tactile-btn:active { transform: scale(0.96) !important; }
        input:focus, textarea:focus, select:focus { border-color: rgba(139,69,19,0.45) !important; }
        ::selection { background: rgba(139,26,26,0.15); }
      `}</style>
    </div>
  );
}
```

### ./client/src/pages/Auth.jsx

```
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../utils/api';
import socket from '../utils/socket';
import { theme as design } from '../utils/theme';
import { triggerHaptic } from '../utils/haptics';
import { Feather, KeySquare, CheckCircle2 } from 'lucide-react';
import AccountSuspendedScreen from '../components/AccountSuspendedScreen';

/* Locked tokens — same family as ProfileCard */
const t = {
  desk: '#ece4d4',
  paper: '#fdfbf7',
  card: '#fffdf8',
  surfaceAlt: '#f4f1ea',
  lineDark: '#d4c5a9',
  ink: '#1a1a1a',
  inkSoft: '#4a4a4a',
  inkMuted: '#8c8275',
  accent: '#8b4513',
  crimson: '#8b1a1a',
  success: '#2e7d32',
  fontDisplay: design?.font?.heading || "'Playfair Display', Georgia, serif",
  fontBody: design?.font?.body || "'Inter', -apple-system, sans-serif",
  fontType: "'Special Elite', 'Courier New', monospace",
  grain: design?.texture?.grain || '',
};

const Auth = ({ onSuccess }) => {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);
  const inputRefs = useRef([]);

  const [suspendedData, setSuspendedData] = useState(() => {
    try {
      const data = JSON.parse(localStorage.getItem('matchalize_suspended'));
      return data?.reason ? data : null;
    } catch { return null; }
  });

  useEffect(() => {
    if (step === 'otp' && inputRefs.current[0]) {
      setTimeout(() => inputRefs.current[0].focus(), 150);
    }
  }, [step]);

  // THE PHANTOM HITBOX FIX: Forces mobile browsers to recalculate touch targets when keyboard closes
  const handleInputBlur = () => {
    window.scrollTo(0, 0);
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError('');
    setLoading(true);
    triggerHaptic('medium');

    // Force blur to close keyboard and fix hitboxes before making API call
    if (document.activeElement) {
      document.activeElement.blur();
    }

    try {
      await api.post('/auth/send-otp', { email: email.trim() });
      setStep('otp');
    } catch (err) {
      const exactError = err.response?.data?.message || err.response?.data?.error || err.message;

      if (exactError?.includes('Network Error')) {
        setError('The courier was lost. Check your connection.');
      } else {
        setError(exactError || 'Failed to send the code.');
      }
      triggerHaptic('heavy');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = useCallback(async (otpValue) => {
    setError('');
    setLoading(true);

    // Force blur to fix hitboxes
    if (document.activeElement) {
      document.activeElement.blur();
    }

    try {
      const data = await api.post('/auth/verify-otp', { email: email.trim(), otp: otpValue });
      // Token is set as httpOnly cookie by the server Set-Cookie header
      localStorage.setItem('matchalize_user', JSON.stringify(data.user));

      if (socket && socket.disconnected) socket.connect();

      setVerified(true);
      triggerHaptic('heavy');

      setTimeout(() => {
        onSuccess();
      }, 1200);

    } catch (err) {
      const exactError = err.response?.data?.message || err.response?.data?.error || err.message;

      // If this was a suspension, show the lock screen
      try {
        const susData = JSON.parse(localStorage.getItem('matchalize_suspended'));
        if (susData?.reason) { setSuspendedData(susData); return; }
      } catch {}

      if (exactError?.includes('Network Error')) {
        setError('The courier was lost. Check your connection.');
      } else {
        setError(exactError || 'Invalid code.');
      }

      setOtp(['', '', '', '', '', '']);
      if (inputRefs.current[0]) inputRefs.current[0].focus();
      triggerHaptic('heavy');
      setLoading(false);
    }
  }, [email, onSuccess]);

  const handleOtpChange = (e, index) => {
    const val = e.target.value;

    if (val.length > 1) {
      const pasted = val.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otp];
      // Fill from current index, not from 0
      pasted.forEach((char, i) => {
        if (index + i < 6) newOtp[index + i] = char;
      });
      setOtp(newOtp);

      const nextIndex = Math.min(index + pasted.length, 5);
      inputRefs.current[nextIndex].focus();

      if (newOtp.every(d => d !== '')) {
        handleVerifyOtp(newOtp.join(''));
      }
      return;
    }

    if (isNaN(val)) return;

    const newOtp = [...otp.map((v, i) => (i === index ? val : v))];
    setOtp(newOtp);
    triggerHaptic('light');

    if (val && index < 5) {
      inputRefs.current[index + 1].focus();
    }

    if (index === 5 && val) {
      handleVerifyOtp(newOtp.join(''));
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  if (suspendedData) {
    return <AccountSuspendedScreen reason={suspendedData.reason} suspendedAt={suspendedData.suspendedAt} />;
  }

  return (
    <div style={{
      minHeight: '100vh', // Fallback for older browsers
      minHeight: '100dvh', // Dynamic Viewport Height
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.desk,
      padding: 'max(24px, env(safe-area-inset-top)) 16px max(24px, env(safe-area-inset-bottom))',
      boxSizing: 'border-box',
      position: 'relative',
      // CHANGED: From 'hidden' to 'auto' to allow native scrolling and fix the Phantom Hitbox
      overflowX: 'hidden',
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch',
    }}>

      <style>{`
        * { -webkit-tap-highlight-color: transparent; }

        .auth-btn { transition: transform 0.15s ease-out, box-shadow 0.15s ease-out; will-change: transform; }
        @media (hover: hover) { .auth-btn:hover:not(:disabled) { transform: translateY(-1px); } }
        .auth-btn:active:not(:disabled) { transform: scale(0.96) !important; }

        .email-input::placeholder { color: ${t.inkMuted}; opacity: 0.5; font-family: ${t.fontType}; font-size: 16px; letter-spacing: 0px; }

        .stamp-box { transition: border-color 0.2s ease, background-color 0.2s ease, transform 0.2s ease; border-bottom: 2.5px solid ${t.lineDark}; }
        .stamp-box:focus { border-bottom-color: ${t.crimson}; background-color: #fff; }
        .stamp-box.filled { border-bottom-color: ${t.ink}; }
        .stamp-box.success { border-bottom-color: ${t.success}; background-color: ${t.success}; color: #fff; transform: translateY(-3px); }
      `}</style>

      {/* Grain film — same strength as every surface */}
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, backgroundImage: `url("${t.grain}")`, mixBlendMode: 'multiply', opacity: 0.3, pointerEvents: 'none', zIndex: 1 }} />

      {/* The floating paper panel */}
      <div style={{
        width: '100%',
        maxWidth: 400,
        backgroundColor: t.paper,
        border: '1px solid rgba(212,197,169,0.7)',
        borderRadius: 18,
        boxShadow: '0 14px 34px rgba(88,63,30,0.16), 0 3px 8px rgba(88,63,30,0.08)',
        padding: '36px 28px 32px',
        boxSizing: 'border-box',
        position: 'relative',
        zIndex: 2,
      }}>

        <AnimatePresence mode="wait">
          {step === 'email' ? (
            <motion.div
              key="email-step"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Standard icon tile */}
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: t.surfaceAlt,
                border: '1px solid rgba(212,197,169,0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
              }}>
                <Feather size={20} color={t.accent} strokeWidth={1.75} />
              </div>

              <h2 style={{ fontFamily: t.fontDisplay, fontSize: 32, fontWeight: 800, color: t.ink, margin: '0 0 10px 0', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                Identify yourself.
              </h2>
              <p style={{ fontFamily: t.fontBody, fontSize: 14, fontWeight: 450, color: t.inkMuted, margin: '0 0 32px 0', lineHeight: 1.55 }}>
                Enter your university email to pull your records from the Archives.
              </p>

              <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    inputMode="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    className="email-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@university.edu"
                    required
                    style={{
                      width: '100%',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderBottom: `2px solid ${t.ink}`,
                      padding: '10px 4px',
                      fontSize: 20,
                      color: t.ink,
                      fontFamily: t.fontType,
                      outline: 'none',
                      borderRadius: 0,
                      WebkitAppearance: 'none',
                      boxSizing: 'border-box',
                    }}
                  />

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <p style={{ color: t.crimson, fontSize: 13, fontFamily: t.fontBody, fontWeight: 600, margin: '14px 0 0 0' }}>
                          {error}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="auth-btn"
                  style={{
                    width: '100%',
                    padding: '17px',
                    backgroundColor: t.crimson,
                    color: '#fff',
                    border: 'none',
                    borderRadius: 999,
                    fontFamily: t.fontBody,
                    fontSize: 11.5,
                    fontWeight: 800,
                    letterSpacing: '1.8px',
                    textTransform: 'uppercase',
                    cursor: (!email.trim() || loading) ? 'not-allowed' : 'pointer',
                    boxShadow: '0 6px 18px rgba(139, 26, 26, 0.28)',
                    opacity: (!email.trim() || loading) ? 0.4 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                  }}
                >
                  {loading ? 'Sending...' : 'Send Code'}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="otp-step"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Dispatched-to card — box tier */}
              <div style={{
                backgroundColor: t.card,
                padding: '14px 16px',
                borderRadius: 6,
                border: '1px solid rgba(212,197,169,0.7)',
                boxShadow: '0 4px 12px rgba(88,63,30,0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 30,
              }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor: t.surfaceAlt,
                  border: '1px solid rgba(212,197,169,0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <KeySquare size={16} color={t.accent} strokeWidth={2} />
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <p style={{ fontFamily: t.fontBody, fontSize: 9.5, fontWeight: 800, color: t.inkMuted, textTransform: 'uppercase', letterSpacing: '1.5px', margin: '0 0 3px 0' }}>Dispatched To</p>
                  <p style={{ fontFamily: t.fontType, fontSize: 13.5, color: t.ink, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{email}</p>
                </div>
              </div>

              <h3 style={{ fontFamily: t.fontDisplay, fontSize: 26, color: t.ink, margin: '0 0 8px 0', fontWeight: 800, letterSpacing: '-0.02em' }}>Break the Seal.</h3>
              <p style={{ fontFamily: t.fontBody, fontSize: 14, fontWeight: 450, color: t.inkMuted, margin: '0 0 28px 0', lineHeight: 1.55 }}>
                A 6-digit code has been sent to your inbox.
              </p>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <p style={{ color: t.crimson, fontSize: 13, fontFamily: t.fontBody, fontWeight: 600, margin: '0 0 22px 0' }}>
                      {error}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 28 }}>
                {otp.map((data, index) => (
                  <input
                    key={index}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={data}
                    ref={(el) => (inputRefs.current[index] = el)}
                    onChange={(e) => handleOtpChange(e, index)}
                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                    className={`stamp-box ${data ? 'filled' : ''} ${verified ? 'success' : ''}`}
                    disabled={verified || loading}
                    style={{
                      width: '100%',
                      aspectRatio: '1 / 1.15',
                      textAlign: 'center',
                      fontSize: 26,
                      fontWeight: 700,
                      fontFamily: t.fontType,
                      color: verified ? '#fff' : t.ink,
                      backgroundColor: 'rgba(255,255,255,0.55)',
                      border: 'none',
                      borderBottom: `2.5px solid ${t.lineDark}`,
                      outline: 'none',
                      borderRadius: 4,
                      caretColor: t.crimson,
                      WebkitAppearance: 'none',
                    }}
                  />
                ))}
              </div>

              <div>
                {verified ? (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                      width: '100%',
                      padding: '17px',
                      backgroundColor: t.success,
                      color: '#fff',
                      border: 'none',
                      borderRadius: 999,
                      fontFamily: t.fontBody,
                      fontSize: 11.5,
                      fontWeight: 800,
                      letterSpacing: '1.8px',
                      textTransform: 'uppercase',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 10,
                      boxShadow: '0 6px 18px rgba(46, 125, 50, 0.3)',
                      boxSizing: 'border-box',
                    }}
                  >
                    <CheckCircle2 size={16} strokeWidth={2.5} /> Access Granted
                  </motion.div>
                ) : (
                  <button
                    onClick={() => { triggerHaptic('light'); setStep('email'); setError(''); setOtp(['', '', '', '', '', '']); }}
                    disabled={loading}
                    style={{ width: '100%', background: 'none', border: 'none', color: t.accent, fontSize: 13, fontFamily: t.fontBody, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', textAlign: 'center', textDecoration: 'underline', textUnderlineOffset: '4px', opacity: loading ? 0.5 : 0.8, WebkitTapHighlightColor: 'transparent' }}
                  >
                    Wrong address? Go back
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Auth;
```

### ./client/src/pages/Chat.jsx

```
import React, { useEffect, useState, useRef, useCallback, useMemo, useLayoutEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import socket from '../utils/socket';
import { API_BASE } from '../utils/api';
import { useAuth } from '../utils/AuthContext';
import { toast } from '../utils/toast';
import { triggerHaptic } from '../utils/haptics';
import MessageBubble from '../components/chat/MessageBubble';
import MessageActionMenu from '../components/chat/MessageActionMenu';
import EmojiPicker from '../components/chat/EmojiPicker';
import PhotoViewer from '../components/chat/PhotoViewer';
import ReplyPreview from '../components/chat/ReplyPreview';
import SearchOverlay from '../components/chat/SearchOverlay';
import ReportModal from '../components/chat/ReportModal';
import { theme as design } from '../utils/theme';
import { Search, ChevronLeft, Sparkle, MapPin, Lock } from 'lucide-react';

/* ==================================================================
   ARCHIVAL THEME & TEXTURES
================================================================== */
const theme = {
  paper: '#fdfbf7',
  surface: '#ffffff',
  surfaceAlt: '#f4f1ea',
  border: '#e0d8c8',
  borderDark: '#d4c5a9',
  ink: '#1a1a1a',
  inkMuted: '#8c8275',
  accent: '#8b4513',
  crimson: '#8b1a1a',
  shadowWarm: 'rgba(139, 69, 19, 0.12)',
};

const Icon = React.memo(({ path, size = 20, color = 'currentColor', strokeWidth = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {path}
  </svg>
));

const formatDateSeparator = (dateStr) => {
  if (!dateStr) return '';
  const today = new Date();
  const msgDate = new Date(dateStr);
  const isToday = msgDate.toDateString() === today.toDateString();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const isYesterday = msgDate.toDateString() === yesterday.toDateString();
  
  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';
  return msgDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatLastActive = (lastActive) => {
  if (!lastActive) return 'Offline';
  const now = new Date();
  const last = new Date(lastActive);
  const diffMs = now - last;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Active now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return last.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

async function fetchMessages(matchId, cursor = null, limit = 50) {
  try {
    const url = `${API_BASE}/api/messages/${matchId}`;
    const params = new URLSearchParams();
    if (cursor) params.set('cursor', cursor);
    params.set('limit', String(limit));
    const res = await fetch(`${url}?${params.toString()}`, {
      credentials: 'include',
    });
    if (!res.ok) {
      console.error('Fetch messages failed:', res.status, res.statusText);
      return { messages: [], hasMore: false, nextCursor: null };
    }
    const data = await res.json();
    return {
      messages: Array.isArray(data) ? data : data.messages || [],
      hasMore: data.hasMore || false,
      nextCursor: data.nextCursor || null,
    };
  } catch (err) {
    console.error('Fetch messages error:', err);
    return { messages: [], hasMore: false, nextCursor: null };
  }
}

/* ==================================================================
   CHAT PROFILE VIEW (100% Visual Parity with Discovery ProfileCard)
================================================================== */
const chatTheme = {
  color: {
    paper: '#fdfbf7', surface: '#ffffff', surfaceAlt: '#f4f1ea', border: '#e0d8c8',
    borderDark: '#d4c5a9', ink: '#1a1a1a', inkSoft: '#4a4a4a', inkMuted: '#8c8275',
    accent: '#8b4513', crimson: '#8b1a1a', shadowWarm: 'rgba(139, 69, 19, 0.12)', shadowDark: 'rgba(26, 26, 26, 0.20)',
  },
  font: { display: "'Playfair Display', Georgia, serif", body: "'Inter', -apple-system, sans-serif" },
};

function buildTornEdge(teeth = 64) {
  const heights = [0, 18, 4, 22, 8, 16, 2, 24, 6, 14, 10, 20];
  const pts = ['0% 100%'];
  for (let i = 0; i <= teeth; i++) {
    const x = ((i / teeth) * 100).toFixed(2);
    const y = heights[i % heights.length];
    pts.push(`${x}% ${y}%`);
  }
  pts.push('100% 100%');
  return `polygon(${pts.join(',')})`;
}
const CHAT_TORN_EDGE_CLIP = buildTornEdge();

function matchStatus(score) {
  if (score >= 85) return 'Exceptional Match';
  if (score >= 65) return 'High Compatibility';
  if (score >= 40) return 'Potential Resonance';
  return 'Exploratory';
}

const TILT = { prompt_0: '1.4deg', photo_1: '-2.2deg', photo_2: '1.8deg', prompt_1: '-1.1deg', prompt_2: '0.5deg', photo_3: '-0.7deg' };

const ChatSectionLabel = React.memo(({ children }) => (
  <p style={{ fontFamily: chatTheme.font.body, fontSize: '10px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: chatTheme.color.accent, margin: '0 0 12px 0', display: 'flex', alignItems: 'center' }}>
    <span aria-hidden="true" style={{ display: 'inline-block', width: '16px', height: '2px', backgroundColor: chatTheme.color.accent, marginRight: '8px', borderRadius: '2px' }} />
    {children}
  </p>
));

const ChatStitchSeam = React.memo(() => (
  <div aria-hidden="true" style={{ height: '1px', backgroundImage: `repeating-linear-gradient(90deg, ${chatTheme.color.border} 0px, ${chatTheme.color.border} 8px, transparent 8px, transparent 14px)`, opacity: 0.8, margin: '16px 0' }} />
));

const ChatPhotoCorners = React.memo(() => (
  <>
    <span aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0, width: 24, height: 24, background: chatTheme.color.surface, clipPath: 'polygon(0 0, 100% 0, 0 100%)', zIndex: 3, filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.15))' }} />
    <span aria-hidden="true" style={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, background: chatTheme.color.surface, clipPath: 'polygon(100% 100%, 0 100%, 100% 0)', zIndex: 3, filter: 'drop-shadow(-1px -1px 2px rgba(0,0,0,0.15))' }} />
  </>
));

const ChatMountedPhoto = React.memo(({ src, alt, tilt, aspect }) => (
  <div className="pc-dynamic-shadow" style={{ '--tilt': tilt, transform: 'rotate(var(--tilt, 0deg))', position: 'relative', width: '100%', height: aspect ? 'auto' : '200px', aspectRatio: aspect || undefined, borderRadius: '6px', border: `6px solid ${chatTheme.color.surface}`, backgroundColor: chatTheme.color.surfaceAlt, overflow: 'hidden' }}>
    <img src={src} alt={alt} className="pc-photo-img" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
    <ChatPhotoCorners />
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at var(--lamp-pct-x, 50%) var(--lamp-pct-y, 30%), rgba(255,255,255,0.35) 0%, transparent 50%)', pointerEvents: 'none', zIndex: 4, mixBlendMode: 'soft-light' }} />
  </div>
));

const ChatIndexCard = ({ children, tilt, wide, tape = 'center' }) => {
  const getTapeConfig = () => {
    const base = { position: 'absolute', top: '-10px', width: '36px', height: '16px', backgroundColor: 'rgba(224, 216, 200, 0.9)', backdropFilter: 'blur(3px)', border: '1px solid rgba(139, 69, 19, 0.2)', boxShadow: '0 2px 4px rgba(0,0,0,0.08)', zIndex: 5 };
    if (tape === 'top-right') return { ...base, right: '16px', '--tape-rot': '4deg', transform: 'rotate(4deg)' };
    if (tape === 'top-left') return { ...base, left: '16px', '--tape-rot': '-4deg', transform: 'rotate(-4deg)' };
    return { ...base, left: '50%', '--tape-rot': '-1deg', transform: 'translateX(-50%) rotate(-1deg)' };
  };
  return (
    <div className="pc-dynamic-shadow" style={{ '--tilt': tilt, transform: 'rotate(var(--tilt, 0deg))', backgroundColor: chatTheme.color.surface, backgroundImage: `linear-gradient(${chatTheme.color.accent}11 1px, transparent 1px)`, backgroundSize: '100% 24px', border: `1px solid ${chatTheme.color.border}`, borderRadius: '8px', padding: '24px 16px 20px', height: wide ? 'auto' : '100%', minHeight: wide ? undefined : '140px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <span aria-hidden="true" className="pc-tape" style={getTapeConfig()} />
      <span aria-hidden="true" className="pc-metallic-foil" style={{ fontFamily: chatTheme.font.display, fontSize: '32px', lineHeight: 0.5, opacity: 0.45, marginBottom: '8px', display: 'block', background: `linear-gradient(calc(135deg), #5c2c0c 0%, #8b4513 30%, #e6b17a 50%, #8b4513 70%, #421f08 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>“</span>
      <p style={{ fontFamily: chatTheme.font.display, fontSize: '15px', fontStyle: 'italic', color: chatTheme.color.ink, margin: '0 0 4px 0', lineHeight: 1.45, textAlign: 'center', fontWeight: 600 }}>{children}</p>
    </div>
  );
};

const ChatProfileView = ({ profile, onClose, unavailable }) => {
  if (!profile) return null;

  if (unavailable) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(20,15,10,0.7)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxHeight: '50dvh', backgroundColor: chatTheme.color.paper, borderTopLeftRadius: '24px', borderTopRightRadius: '24px', display: 'flex', flexDirection: 'column', boxShadow: '0 -20px 50px rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: '60px 24px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(139, 69, 19, 0.08)', border: '2px solid rgba(139, 69, 19, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
            <Lock size={28} color={chatTheme.color.inkMuted} strokeWidth={1.5} />
          </div>
          <p style={{ fontFamily: chatTheme.font.display, fontSize: '20px', fontWeight: 700, color: chatTheme.color.ink, margin: '0 0 8px', textAlign: 'center', letterSpacing: '-0.02em' }}>
            This user is no longer available
          </p>
          <p style={{ fontFamily: chatTheme.font.body, fontSize: '13px', color: chatTheme.color.inkMuted, margin: 0, textAlign: 'center', lineHeight: 1.5 }}>
            This profile is no longer accessible.
          </p>
        </motion.div>
      </motion.div>
    );
  }
  const score = profile.compatScore || 0;
  const circumference = 2 * Math.PI * 34;
  const ringOffset = circumference - (score / 100) * circumference;

  const renderTicks = () => Array.from({ length: 60 }).map((_, i) => {
    const isMajor = i % 5 === 0;
    const angle = (i / 60) * Math.PI * 2;
    const innerR = isMajor ? 22 : 25;
    const outerR = 29;
    return (
      <line key={i} x1={44 + innerR * Math.cos(angle)} y1={44 + innerR * Math.sin(angle)} x2={44 + outerR * Math.cos(angle)} y2={44 + outerR * Math.sin(angle)} stroke={isMajor ? chatTheme.color.accent : chatTheme.color.border} strokeWidth={isMajor ? 1.5 : 0.75} opacity={isMajor ? 0.85 : 0.35} />
    );
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(20,15,10,0.7)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} style={{ width: '100%', maxHeight: '92vh', backgroundColor: chatTheme.color.paper, borderTopLeftRadius: '24px', borderTopRightRadius: '24px', display: 'flex', flexDirection: 'column', boxShadow: '0 -20px 50px rgba(0,0,0,0.4)' }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${chatTheme.color.borderDark}`, backgroundColor: chatTheme.color.paper, borderTopLeftRadius: '24px', borderTopRightRadius: '24px', zIndex: 10, position: 'sticky', top: 0 }}>
          <span style={{ fontFamily: chatTheme.font.display, fontSize: '20px', fontWeight: 700, color: chatTheme.color.ink }}>View Profile</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }} aria-label="Close profile">
            <Icon path={<><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>} size={24} color={chatTheme.color.inkMuted} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="pc-scroll" style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '40px', position: 'relative' }}>
          
          {/* 1. Hero Photo Section */}
          <div style={{ width: '100%', position: 'relative' }}>
            <div style={{ width: '100%', aspectRatio: '4/5.8', position: 'relative', backgroundColor: chatTheme.color.surfaceAlt, overflow: 'hidden' }}>
              <img src={profile.photos?.[0] || 'https://via.placeholder.com/600x800/e8e4d9/1a1a1a?text=No+Photo'} alt={profile.name} className="pc-photo-img" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 30%, rgba(255,255,255,0.2) 0%, transparent 50%), linear-gradient(to top, rgba(15,12,10,0.98) 0%, rgba(15,12,10,0.6) 40%, rgba(0,0,0,0.1) 75%, transparent 100%)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: '38px', left: '24px', right: '24px', zIndex: 2 }}>
                <div className="pc-fade-1" style={{ display: 'inline-block', padding: '5px 12px', background: 'rgba(253,251,247,0.2)', backdropFilter: 'blur(12px)', borderRadius: design.radius.sm, border: '1px solid rgba(255,255,255,0.4)', marginBottom: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                  <span style={{ fontFamily: chatTheme.font.body, fontSize: '10px', color: '#fff', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 700 }}>Archival Subject</span>
                </div>
                <h2 className="pc-fade-1" style={{ fontFamily: chatTheme.font.display, fontSize: 'clamp(30px, 7vw, 42px)', color: '#fff', margin: 0, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.05, textShadow: '0 4px 20px rgba(0,0,0,0.6)' }}>
                  {profile.name || 'Anonymous'}<span style={{ fontWeight: 400, opacity: 0.85 }}>, {profile.age || '—'}</span>
                </h2>
                <p className="pc-fade-2" style={{ fontFamily: chatTheme.font.body, fontSize: '11px', color: 'rgba(255,255,255,0.92)', margin: '8px 0 0 0', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                  {profile.branch || 'General'} <Sparkle size={12} color="#e6b17a" style={{ margin: '0 8px', flexShrink: 0 }} /> Class of {profile.year || '20XX'}
                </p>
              </div>
            </div>
            <div aria-hidden="true" style={{ width: '100%', height: '24px', backgroundColor: chatTheme.color.paper, clipPath: CHAT_TORN_EDGE_CLIP, marginTop: '-14px', position: 'relative', zIndex: 3, filter: 'drop-shadow(0 -3px 3px rgba(0,0,0,0.12))' }} />
          </div>

          <div style={{ padding: '24px 24px 0 24px' }}>
            
            {/* 2. Vitals */}
            <ChatSectionLabel>Vitals</ChatSectionLabel>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
              {profile.gender && <span className="pc-pill" style={{ padding: '6px 12px', border: `1px solid ${chatTheme.color.border}`, borderRadius: design.radius.sm, backgroundColor: chatTheme.color.surface, color: chatTheme.color.ink, fontFamily: chatTheme.font.body, fontSize: '11px', fontWeight: 600, letterSpacing: '0.2px' }}>{profile.gender}</span>}
              {profile.pronouns && <span className="pc-pill" style={{ padding: '6px 12px', border: `1px solid ${chatTheme.color.border}`, borderRadius: design.radius.sm, backgroundColor: chatTheme.color.surface, color: chatTheme.color.ink, fontFamily: chatTheme.font.body, fontSize: '11px', fontWeight: 600, letterSpacing: '0.2px' }}>{profile.pronouns}</span>}
              {profile.hostel && <span className="pc-pill" style={{ padding: '6px 12px', border: `1px solid ${chatTheme.color.border}`, borderRadius: design.radius.sm, backgroundColor: chatTheme.color.surface, color: chatTheme.color.ink, fontFamily: chatTheme.font.body, fontSize: '11px', fontWeight: 600, letterSpacing: '0.2px', display: 'inline-flex', alignItems: 'center' }}><MapPin size={12} style={{ marginRight: 4 }} /> {profile.hostel}</span>}
            </div>

            <ChatStitchSeam />

            {/* 3. Compatibility Scan */}
            <div className="pc-dynamic-shadow" style={{ backgroundColor: chatTheme.color.surface, border: `1px solid ${chatTheme.color.border}`, borderRadius: '16px', padding: '20px 22px', margin: '24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', position: 'relative', overflow: 'hidden' }}>
              <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 30%, rgba(139,69,19,0.08) 0%, transparent 60%)', pointerEvents: 'none' }} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', zIndex: 2 }}>
                <span style={{ fontFamily: chatTheme.font.body, fontSize: '9px', color: chatTheme.color.accent, margin: 0, textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700 }}>Compatibility Scan</span>
                <h3 style={{ fontFamily: chatTheme.font.display, fontSize: '22px', color: chatTheme.color.ink, margin: '2px 0 10px 0', fontWeight: 700, letterSpacing: '-0.02em' }}>Compatibility Scan</h3>
                {matchStatus(score) && (
                  <span className="pc-stamp" style={{ display: 'inline-block', padding: '4px 10px', border: `1.5px solid ${chatTheme.color.accent}`, borderRadius: '4px', color: chatTheme.color.accent, fontFamily: chatTheme.font.body, fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', backgroundColor: chatTheme.color.paper, boxShadow: '0 2px 6px rgba(139,69,19,0.06)' }}>
                    {matchStatus(score)}
                  </span>
                )}
              </div>
              <div style={{ position: 'relative', width: 88, height: 88, flexShrink: 0, zIndex: 2 }}>
                <svg width={88} height={88} viewBox="0 0 88 88" role="img" aria-label={`Compatibility score ${score} percent`}>
                  <g className="pc-bezel-outer">{renderTicks()}</g>
                  <g className="pc-bezel-inner">
                    <circle cx={44} cy={44} r={25} fill="none" stroke={chatTheme.color.border} strokeWidth={1} strokeDasharray="3 6" opacity={0.5} />
                  </g>
                  <circle cx={44} cy={44} r={34} fill="none" stroke={chatTheme.color.surfaceAlt} strokeWidth={5.5} transform="rotate(-90 44 44)" />
                  <circle className="pc-ring" cx={44} cy={44} r={34} fill="none" stroke="url(#metallicGradient)" strokeWidth={5.5} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={ringOffset} transform="rotate(-90 44 44)" />
                  <path className="pc-wave" d="M 28 62 Q 36 57 44 62 T 60 62" fill="none" stroke={chatTheme.color.accent} strokeWidth={1.5} opacity={0.4} />
                  <defs>
                    <linearGradient id="metallicGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#8b4513" />
                      <stop offset="50%" stopColor="#e6b17a" />
                      <stop offset="100%" stopColor="#5c2c0c" />
                    </linearGradient>
                  </defs>
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <p className="pc-metallic-foil" style={{ fontFamily: chatTheme.font.display, fontSize: '24px', margin: 0, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em', background: 'linear-gradient(135deg, #5c2c0c 0%, #8b4513 30%, #e6b17a 50%, #8b4513 70%, #421f08 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.12))' }}>
                    {score}<span style={{ fontSize: '13px', fontWeight: 700, marginLeft: '1px' }}>%</span>
                  </p>
                </div>
              </div>
            </div>

            <ChatStitchSeam />

            {/* 4. Seeking Parameters */}
            <div style={{ margin: '24px 0' }}>
              <ChatSectionLabel>Seeking Parameters</ChatSectionLabel>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {(profile.intent && profile.intent.length > 0 ? profile.intent : ['Long-term', 'Connection', 'Growth']).map((item, i) => (
                  <span key={i} className="pc-pill" style={{ padding: '6px 12px', border: `1px solid ${chatTheme.color.ink}`, borderRadius: design.radius.sm, backgroundColor: chatTheme.color.ink, color: chatTheme.color.paper, fontFamily: chatTheme.font.body, fontSize: '11px', fontWeight: 600, letterSpacing: '0.2px', boxShadow: '0 4px 12px rgba(26,26,26,0.15)' }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* 5. Recorded Curiosities */}
            {profile.interests && profile.interests.length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <ChatSectionLabel>Recorded Curiosities</ChatSectionLabel>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {profile.interests.map((interest, i) => (
                    <span key={i} className="pc-pill" style={{ padding: '6px 12px', border: `1px solid rgba(224, 216, 200, 0.7)`, borderRadius: design.radius.sm, backgroundColor: chatTheme.color.surfaceAlt, color: chatTheme.color.ink, fontFamily: chatTheme.font.body, fontSize: '11px', fontWeight: 500 }}>
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 6. Bento Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px 16px', marginBottom: '48px', paddingTop: '8px' }}>
              <ChatIndexCard tilt={TILT.prompt_0} tape="top-right">
                {profile.prompts?.[0]?.question || "A shower thought I recently had..."}
              </ChatIndexCard>

              {profile.photos?.[1] ? (
                <ChatMountedPhoto src={profile.photos[1]} alt={`${profile.name}, artifact 2`} tilt={TILT.photo_1} />
              ) : <div />}

              {profile.photos?.[2] ? (
                <ChatMountedPhoto src={profile.photos[2]} alt={`${profile.name}, artifact 3`} tilt={TILT.photo_2} />
              ) : <div />}

              <ChatIndexCard tilt={TILT.prompt_1} tape="top-left">
                {profile.prompts?.[1]?.question || "My ideal weekend looks like..."}
              </ChatIndexCard>

              {profile.prompts?.[2] && (
                <ChatIndexCard tilt={TILT.prompt_2} wide tape="center">
                  {profile.prompts[2].question}
                </ChatIndexCard>
              )}

              {profile.photos?.[3] && (
                <ChatMountedPhoto src={profile.photos[3]} alt={`${profile.name}, artifact 4`} tilt={TILT.photo_3} aspect="16/9" />
              )}
            </div>
          </div>
        </div>

        {/* Archival Animations */}
        <style>{`
          @keyframes pcFadeUp { from { opacity: 0; transform: translate3d(0, 16px, 0); filter: blur(2px); } to { opacity: 1; transform: translate3d(0, 0, 0); filter: blur(0px); } }
          @keyframes pcRadarSweep { 0% { transform: rotate(-90deg); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: rotate(270deg); opacity: 0; } }
          @keyframes pcBezelRotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          @keyframes pcBezelCounter { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
          @keyframes pcSealStamp { 0% { transform: scale3d(1.8, 1.8, 1) rotate(-8deg); opacity: 0; filter: blur(4px); } 60% { transform: scale3d(0.95, 0.95, 1) rotate(-6deg); opacity: 1; filter: blur(0px); } 80% { transform: scale3d(1.02, 1.02, 1) rotate(-6deg); opacity: 1; } 100% { transform: scale3d(1, 1, 1) rotate(-6deg); opacity: 1; } }
          @keyframes pcOscilloscope { 0% { stroke-dashoffset: 100; opacity: 0.3; } 50% { opacity: 0.8; } 100% { stroke-dashoffset: 0; opacity: 0.3; } }
          @keyframes pcHintPulse { 0% { opacity: 0.4; transform: scale(1); } 50% { opacity: 0.95; transform: scale(1.03); } 100% { opacity: 0.4; transform: scale(1); } }
          .pc-fade-1 { animation: pcFadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.05s both; }
          .pc-fade-2 { animation: pcFadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both; }
          .pc-scroll::-webkit-scrollbar { width: 4px; }
          .pc-scroll::-webkit-scrollbar-track { background: transparent; }
          .pc-scroll::-webkit-scrollbar-thumb { background: ${chatTheme.color.borderDark}; border-radius: 4px; }
          .pc-ring { transition: stroke-dashoffset 0.15s linear; }
          .pc-sweep { animation: pcRadarSweep 1.6s cubic-bezier(0.22, 1, 0.36, 1) forwards; transform-origin: 44px 44px; }
          .pc-bezel-outer { animation: pcBezelRotate 60s linear infinite; transform-origin: 44px 44px; }
          .pc-bezel-inner { animation: pcBezelCounter 45s linear infinite; transform-origin: 44px 44px; }
          .pc-stamp { animation: pcSealStamp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.8s both; }
          .pc-wave { stroke-dasharray: 16; animation: pcOscilloscope 2.5s linear infinite; }
          .pc-hint-pulse { animation: pcHintPulse 2.8s ease-in-out infinite; }
          .pc-dynamic-shadow { will-change: transform; transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.35s cubic-bezier(0.2, 0.8, 0.2, 1), border-color 0.25s ease; box-shadow: 0 2px 6px rgba(0,0,0,0.03); }
          .pc-dynamic-shadow:active { transform: scale3d(0.98, 0.98, 1) translate3d(0, 0, 0) !important; transition: transform 0.1s cubic-bezier(0, 0, 0.2, 1) !important; box-shadow: 0 2px 6px rgba(0,0,0,0.08) !important; }
          .pc-metallic-foil { background: linear-gradient(calc(135deg), #5c2c0c 0%, #8b4513 30%, #e6b17a 50%, #8b4513 70%, #421f08 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; filter: drop-shadow(0 1px 1px rgba(0,0,0,0.12)); }
          .pc-pill { transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease, border-color 0.25s ease; display: inline-flex; align-items: center; will-change: transform; }
          .pc-tape { transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.35s ease; will-change: transform; }
          .pc-photo-img { transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1); will-change: transform; }
          @media (prefers-reduced-motion: reduce) { .pc-fade-1, .pc-fade-2, .pc-sweep, .pc-stamp, .pc-bezel-outer, .pc-bezel-inner, .pc-wave, .pc-hint-pulse { animation: none !important; opacity: 1 !important; transform: none !important; } .pc-ring, .pc-dynamic-shadow, .pc-photo-img, .pc-pill, .pc-tape { transition: none !important; } }
        `}</style>
      </motion.div>
    </motion.div>
  );
};

/* ==================================================================
   MAIN CHAT COMPONENT
================================================================== */
const Chat = ({ match, onBack }) => {
  const matchUser = match?.user;
  const matchId = match?._id;
  const otherUserId = matchUser?._id;
  
  const [inputText, setInputText] = useState('');
  const [otherTyping, setOtherTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  
  // Online status
  const [isOnline, setIsOnline] = useState(false);
  const [lastActive, setLastActive] = useState(null);
  
  // Pagination (cursor-based)
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Scroll to bottom
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPickerAnchor, setEmojiPickerAnchor] = useState(null);
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);
  const [photoViewerUrl, setPhotoViewerUrl] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const fileInputRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const typingTimer = useRef(null);
  const listEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const prevScrollHeightRef = useRef(0);
  const prevMessagesLengthRef = useRef(0);
  const pendingMsgIdRef = useRef(null);
  const [socketConnected, setSocketConnected] = useState(socket?.connected ?? true);
  const otherUnavailable = matchUser?.suspended || matchUser?.isDeleted;

  const { user } = useAuth();
  const myId = user?._id;
  const myName = user?.name;

  const queryClient = useQueryClient();
  const { data: queryMessages = [], isLoading: loading, isError, error: queryError } = useQuery({
    queryKey: ['messages', matchId],
    queryFn: async () => {
      const d = await fetchMessages(matchId, null, 50);
      setHasMore(d.hasMore);
      setCursor(d.nextCursor);
      if (socket) socket.emit('read-messages', { matchId });
      return d.messages;
    },
    enabled: !!matchId,
  });
  const messages = queryMessages;
  const error = isError ? (queryError?.message || 'Failed to load messages') : null;

  // Socket Subscriptions
  useEffect(() => {
    if (!socket || !matchId) return;
    setCursor(null);
    socket.emit('join-match', matchId);

    const onReconnect = () => {
      if (matchId) socket.emit('join-match', matchId);
    };
    socket.on('connect', onReconnect);

    const onConnect = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    const onNew = (msg) => {
      if (msg?.match === matchId || msg?.matchId === matchId) {
        queryClient.setQueryData(['messages', matchId], (prev = []) => (prev.some((p) => p._id === msg._id) ? prev : [...prev, msg]));
        socket.emit('read-messages', { matchId });
        triggerHaptic('light');
      }
    };
    const onRead = () => {
      queryClient.setQueryData(['messages', matchId], (prev = []) => prev.map((m) => (String(m.sender || m.senderId) === String(myId) ? { ...m, read: true } : m)));
    };
    const onTyping = () => setOtherTyping(true);
    const onStop = () => setOtherTyping(false);
    const onReactionUpdate = ({ msgId, reactions }) => {
      queryClient.setQueryData(['messages', matchId], (prev = []) => prev.map((m) => (m._id === msgId ? { ...m, reactions } : m)));
    };
    const onMessageDeleted = ({ msgId }) => {
      queryClient.setQueryData(['messages', matchId], (prev = []) => prev.map((m) => (m._id === msgId ? { ...m, deleted: true, text: '', mediaUrl: '' } : m)));
    };
    const onOnlineUpdate = ({ userId, online, lastActive: la }) => {
      if (userId === otherUserId) {
        setIsOnline(online);
        setLastActive(la);
      }
    };

    socket.on('new-message', onNew);
    socket.on('messages-read', onRead);
    socket.on('user-typing', onTyping);
    socket.on('user-stop-typing', onStop);
    socket.on('reaction-update', onReactionUpdate);
    socket.on('message-deleted', onMessageDeleted);
    socket.on('online-update', onOnlineUpdate);

    if (otherUserId) {
      socket.emit('check-online', { matchId, targetUserId: otherUserId });
      socket.once('online-status', ({ online, lastActive: la }) => {
        setIsOnline(online);
        setLastActive(la);
      });
    }

    return () => {
      if (typingTimer.current) {
        clearTimeout(typingTimer.current);
        typingTimer.current = null;
        socket.emit('stop-typing', { matchId });
      }
      socket.off('connect', onReconnect);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('new-message', onNew);
      socket.off('messages-read', onRead);
      socket.off('user-typing', onTyping);
      socket.off('user-stop-typing', onStop);
      socket.off('reaction-update', onReactionUpdate);
      socket.off('message-deleted', onMessageDeleted);
      socket.off('online-update', onOnlineUpdate);
      socket.off('online-status');
    };
  }, [matchId, myId, otherUserId, queryClient]);

  // ⚓ ZERO-LAG SCROLL ANCHOR: Freezes viewport when older messages are prepended to DOM
  useLayoutEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // If messages grew because we loaded history (not because we sent a new message at the bottom)
    if (messages.length > prevMessagesLengthRef.current && prevScrollHeightRef.current > 0) {
      const heightDifference = container.scrollHeight - prevScrollHeightRef.current;
      if (container.scrollTop < 100 && heightDifference > 0) {
        container.scrollTop = heightDifference;
      }
    }
    
    prevScrollHeightRef.current = container.scrollHeight;
    prevMessagesLengthRef.current = messages.length;
  }, [messages]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (!showScrollButton) {
      listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, otherTyping, loading, showScrollButton]);

  const loadMoreMessages = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const { messages: olderMsgs, hasMore: more, nextCursor } = await fetchMessages(matchId, cursor, 50);
    queryClient.setQueryData(['messages', matchId], (prev = []) => [...olderMsgs, ...prev]);
    setCursor(nextCursor);
    setHasMore(more);
    setLoadingMore(false);
  }, [loadingMore, hasMore, cursor, matchId, queryClient]);

  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 200;
    setShowScrollButton(!isNearBottom);

    if (scrollTop < 5 && hasMore && !loadingMore && !loading) {
      loadMoreMessages();
    }
  }, [hasMore, loadingMore, loading, loadMoreMessages]);

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (!socket) return;
    if (!typingTimer.current) socket.emit('typing', { matchId, userName: myName });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket.emit('stop-typing', { matchId });
      typingTimer.current = null;
    }, 500);
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !matchId) {
      console.error('Cannot send: missing text or matchId');
      return;
    }
    if (!pendingMsgIdRef.current) pendingMsgIdRef.current = crypto.randomUUID();
    triggerHaptic('medium');
    socket.emit('stop-typing', { matchId });
    if (typingTimer.current) { clearTimeout(typingTimer.current); typingTimer.current = null; }

    try {
      const res = await fetch(`${API_BASE}/api/messages/${matchId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ text, replyTo: replyTo?._id || null, clientMsgId: pendingMsgIdRef.current }),
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Send failed: ${res.status}`);
      }
      
      const msg = await res.json();
      queryClient.setQueryData(['messages', matchId], (prev = []) => [...prev, msg]);
      setInputText('');
      setReplyTo(null);
      setShowScrollButton(false);
      pendingMsgIdRef.current = null;
    } catch (err) {
      console.error('Send failed:', err);
      toast.error('The courier was lost in transit. Please check your connection.', {
        label: 'Retry',
        onClick: () => handleSend()
      });
    }
  };

  const handleFileClick = () => { triggerHaptic('light'); fileInputRef.current?.click(); };

  const onFileSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setShowActionSheet(true);
    triggerHaptic('medium');
    e.target.value = '';
  };

  const uploadAndSend = async (kind) => {
    const file = pendingFile;
    setShowActionSheet(false);
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('photo', file);
      const res = await fetch(`${API_BASE}/api/upload`, { method: 'POST', credentials: 'include', body: form });
      const data = await res.json();
      if (data?.url) {
        triggerHaptic('heavy');
        const msgRes = await fetch(`${API_BASE}/api/messages/${matchId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ type: kind, mediaUrl: data.url, replyTo: replyTo?._id || null }),
        });
        if (msgRes.ok) {
         const msg = await msgRes.json();
         queryClient.setQueryData(['messages', matchId], (prev = []) => [...prev, msg]);
         setReplyTo(null);
          setShowScrollButton(false);
        } else {
          throw new Error('Upload send failed');
        }
      }
    } catch (err) { 
      console.error('Upload failed:', err);
      toast.error('Artifact upload failed. Please check your connection.', {
        label: 'Retry',
        onClick: () => uploadAndSend(kind)
      }); 
    } finally { 
      setUploading(false);
      setPendingFile(null);
    }
  };

  const startRecording = async () => {
    triggerHaptic('medium');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/mp4';
      const rec = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      rec.ondataavailable = (e) => chunksRef.current.push(e.data);
      rec.onstop = async () => {
        const ext = mimeType.includes('mp4') ? 'm4a' : 'webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const file = new File([blob], `voice.${ext}`, { type: mimeType });
        setPendingFile(file);
        setShowActionSheet(true);
        stream.getTracks().forEach((t) => t.stop());
      };
      recorderRef.current = rec;
      rec.start();
      setRecording(true);
    } catch { setRecording(false); }
  };

  const stopRecording = () => { triggerHaptic('heavy'); recorderRef.current?.stop(); setRecording(false); };

  const handleLongPress = (message, event) => {
    if (message.deleted) return;
    const rect = event.target.closest('[data-bubble="true"]')?.getBoundingClientRect();
    if (rect) { setSelectedMessage(message); setMenuAnchor(rect); }
  };

  const handleCloseMenu = () => { setSelectedMessage(null); setMenuAnchor(null); };
  const handleReply = () => { setReplyTo(selectedMessage); handleCloseMenu(); triggerHaptic('light'); };
  
  const handleReact = () => {
    setEmojiPickerAnchor(menuAnchor);
    setMenuAnchor(null);
    setShowEmojiPicker(true);
  };

  const handleEmojiSelect = async (emoji) => {
    setShowEmojiPicker(false);
    setEmojiPickerAnchor(null);
    const target = selectedMessage;
    setSelectedMessage(null);
    if (!target) return;
    try {
      const res = await fetch(`${API_BASE}/api/messages/${matchId}/reaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ msgId: target._id, emoji }),
      });
      if (res.ok) {
        const data = await res.json();
        queryClient.setQueryData(['messages', matchId], (prev = []) => prev.map((m) => (m._id === target._id ? { ...m, reactions: data.reactions } : m)));
      }
    } catch (err) { console.error('Reaction failed:', err); }
  };

  const handleCopy = () => {
    if (selectedMessage?.text) navigator.clipboard.writeText(selectedMessage.text);
    triggerHaptic('light');
    handleCloseMenu();
  };

  const handleReport = () => {
    setShowReportModal(true);
    handleCloseMenu();
  };

  const handleDelete = async () => {
    if (!selectedMessage) return;
    if (!window.confirm('Delete this message?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/messages/${matchId}/${selectedMessage._id}`, {
        method: 'DELETE', credentials: 'include',
      });
      if (res.ok) {
        queryClient.setQueryData(['messages', matchId], (prev = []) => prev.map((m) => (m._id === selectedMessage._id ? { ...m, deleted: true } : m)));
        triggerHaptic('heavy');
      }
    } catch (err) { 
      console.error('Delete failed:', err);
      toast.error('Failed to delete. Please try again.');
    }
    handleCloseMenu();
  };

  const handleImageClick = (url) => { setPhotoViewerUrl(url); setShowPhotoViewer(true); triggerHaptic('light'); };

  // Optimized Search Jump utilizing CSS class animations to prevent DOM style lag
  const handleSearchJump = (msgId) => {
    const el = document.querySelector(`[data-msg-id="${msgId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('highlight-pulse');
      setTimeout(() => { el.classList.remove('highlight-pulse'); }, 2000);
    }
  };

  const handleUnmatch = async () => {
    if (!window.confirm('Unmatch this connection? This cannot be undone.')) return;
    try {
      await fetch(`${API_BASE}/api/matches/${matchId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      triggerHaptic('heavy');
      onBack();
    } catch (err) {
      console.error('Unmatch failed:', err);
      toast.error('Failed to sever this connection. Please try again.');
    }
    setShowHeaderMenu(false);
  };

  const handleBlock = async () => {
    if (!window.confirm('Block this user? They will no longer be able to message you.')) return;
    try {
      await fetch(`${API_BASE}/api/report/block/${otherUserId}`, {
        method: 'POST',
        credentials: 'include',
      });
      triggerHaptic('heavy');
      onBack();
    } catch (err) {
      console.error('Block failed:', err);
      toast.error('Failed to block this user. Please try again.');
    }
    setShowHeaderMenu(false);
  };

  const scrollToBottom = () => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollButton(false);
  };

  return (
    <div style={styles.page}>
      <div style={styles.paperGrain} aria-hidden="true" />

      {/* ARCHIVAL HEADER WITH ONLINE STATUS */}
      <div style={styles.header}>
        <button style={styles.backBtn} onPointerDown={(e) => { e.preventDefault(); triggerHaptic('light'); onBack(); }} onClick={() => { triggerHaptic('light'); onBack(); }} aria-label="Go back to matches"><ChevronLeft size={24} color={theme.ink} /></button>

        <div style={styles.headerLeft} onClick={() => setShowProfile(true)}>
          <div style={{ position: 'relative' }}>
            <img 
              src={matchUser?.photos?.[0] || 'https://via.placeholder.com/80'} 
              alt={matchUser?.name} 
              loading="lazy"
              decoding="async"
              onLoad={(e) => { e.currentTarget.style.opacity = 1; }}
              onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/80'; e.currentTarget.style.opacity = 1; }}
              style={{ ...styles.headerAvatar, opacity: 0, transition: 'opacity 0.3s ease-out' }} 
            />
            {isOnline && <div style={styles.onlineDot} />}
          </div>
          <div style={styles.headerInfo}>
            <span style={styles.headerName}>{matchUser?.name || 'Connection'}</span>
            <span style={styles.headerStatus}>
              {otherTyping ? 'Typing...' : isOnline ? 'Online' : formatLastActive(lastActive)}
            </span>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button style={styles.iconBtn} onClick={() => setShowSearch(true)} title="Search" aria-label="Search messages">
            <Search size={20} color={theme.ink} />
          </button>

          <div style={{ position: 'relative' }}>
            <button style={styles.iconBtn} onClick={() => setShowHeaderMenu(!showHeaderMenu)} aria-label="Open chat options">
              <Icon path={<><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></>} size={20} color={theme.ink} />
            </button>
            
            <AnimatePresence>
              {showHeaderMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  style={styles.dropdownMenu}
                >
                  <button style={styles.dropdownItem} onClick={() => { setShowProfile(true); setShowHeaderMenu(false); }}>
                    <Icon path={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>} size={16} />
                    View Profile
                  </button>
                  <button style={{...styles.dropdownItem, color: theme.crimson}} onClick={() => { handleReport(); setShowHeaderMenu(false); }}>
                    <Icon path={<><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></>} size={16} color={theme.crimson} />
                    Report User
                  </button>
                  <button style={{...styles.dropdownItem, color: theme.crimson}} onClick={handleBlock}>
                    <Icon path={<><circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" /></>} size={16} color={theme.crimson} />
                    Block User
                  </button>
                  <button style={{...styles.dropdownItem, color: theme.crimson}} onClick={handleUnmatch}>
                    <Icon path={<><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>} size={16} color={theme.crimson} />
                    Unmatch
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div style={styles.tornEdgeBottom} aria-hidden="true" />
      </div>

      {!socketConnected && (
        <div style={{ background: '#f59e0b', color: '#fff', textAlign: 'center', padding: '6px 12px', fontSize: '13px', fontWeight: 500, letterSpacing: '0.3px' }}>
          Reconnecting...
        </div>
      )}

      {otherUnavailable && (
        <div style={{
          background: 'rgba(139, 69, 19, 0.06)',
          borderBottom: '1px solid rgba(139, 69, 19, 0.12)',
          padding: '10px 24px',
          textAlign: 'center',
          position: 'relative', zIndex: 5,
        }}>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 600, color: '#8c8275', margin: 0 }}>
            This user can no longer receive messages
          </p>
        </div>
      )}

      {/* MESSAGES STAGE WITH ZERO-LAG ENGINE */}
      <div 
        ref={messagesContainerRef}
        className="archival-scrollbar" 
        style={styles.messages}
        onScroll={handleScroll}
      >
        <style>{`
          .archival-scrollbar::-webkit-scrollbar { width: 4px; }
          .archival-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .archival-scrollbar::-webkit-scrollbar-thumb { background: ${theme.borderDark}; border-radius: 4px; }
          @keyframes blink { 0% { opacity: 0.2; } 20% { opacity: 1; } 100% { opacity: 0.2; } }
          @keyframes highlightBg { 0% { background-color: rgba(139, 69, 19, 0.2); } 100% { background-color: transparent; } }
          .highlight-pulse { animation: highlightBg 2s ease-out forwards; }
          
          /* Interactive Button Tactile Physics */
          .tactile-btn { transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.2s ease, background-color 0.2s ease; will-change: transform; }
          @media (hover: hover) { .tactile-btn:hover { transform: translate3d(0, -2px, 0) scale3d(1.02, 1.02, 1); box-shadow: 0 4px 12px ${theme.shadowWarm}; } }
          .tactile-btn:active { transform: scale3d(0.96, 0.96, 1) translate3d(0, 0, 0) !important; transition: transform 0.08s cubic-bezier(0, 0, 0.2, 1) !important; }
        `}</style>
        
        {loading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: theme.inkMuted, fontFamily: "'Inter', sans-serif", fontSize: '13px' }}>
            Opening correspondence...
          </div>
        ) : error ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: theme.crimson, fontFamily: "'Inter', sans-serif", fontSize: '13px' }}>
            {error}
          </div>
        ) : (
          <>
            {loadingMore && (
              <div style={{ padding: '20px', textAlign: 'center', color: theme.inkMuted, fontFamily: "'Inter', sans-serif", fontSize: '12px' }}>
                Loading older messages...
              </div>
            )}

            {/* Opening Letter Card */}
            {messages.filter(m => m.type === 'opening_letter').map(m => (
              <div key={m._id} style={styles.openingLetterCard}>
                <div style={styles.openingLetterLabel}>Opening Correspondence</div>
                <div style={styles.openingLetterText}>{m.text}</div>
                <div style={styles.openingLetterDate}>
                  {m.createdAt ? new Date(m.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                </div>
              </div>
            ))}

            {messages.filter(m => m.type !== 'opening_letter').map((m, i) => {
              const isMine = String(m.sender || m.senderId) === String(myId);
              const time = m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
              const receipt = isMine ? (m.read || m.readAt ? 'SEEN' : 'SENT') : null;
              const msgDate = formatDateSeparator(m.createdAt);
              const prevDate = i > 0 ? formatDateSeparator(messages[i-1].createdAt) : null;
              const showDate = msgDate && msgDate !== prevDate;
              const replyPreview = m.replyTo ? messages.find((msg) => msg._id === (m.replyTo._id || m.replyTo)) : null;

              return (
                <React.Fragment key={m._id || i}>
                  {showDate && (
                    <div style={styles.dateSeparator}>
                      <span style={styles.dateText}>{msgDate}</span>
                    </div>
                  )}
                  <div data-msg-id={m._id} style={{ borderRadius: '8px' }}>
                    <MessageBubble
                      message={m}
                      isMine={isMine}
                      time={time}
                      receipt={receipt}
                      onLongPress={handleLongPress}
                      onImageClick={handleImageClick}
                      replyPreview={replyPreview}
                    />
                  </div>
                </React.Fragment>
              );
            })}
            {otherTyping && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.typing}>
                <span style={styles.typingDot} />
                <span style={{...styles.typingDot, animationDelay: '0.2s'}} />
                <span style={{...styles.typingDot, animationDelay: '0.4s'}} />
              </motion.div>
            )}
            <div ref={listEndRef} style={{ height: '10px' }} />
          </>
        )}
      </div>

      {/* SCROLL TO BOTTOM BUTTON */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.02 }}
            onClick={scrollToBottom}
            style={styles.scrollButton}
            aria-label="Scroll to bottom"
          >
            <Icon path={<polyline points="6 9 12 15 18 9" />} size={20} color={theme.accent} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* REPLY PREVIEW */}
      <AnimatePresence>
        {replyTo && <ReplyPreview replyTo={replyTo} otherName={matchUser?.name} onCancel={() => setReplyTo(null)} />}
      </AnimatePresence>

      {/* INPUT BAR WITH WASHI TAPE */}
      {match.isActive !== false && !otherUnavailable ? (
      <div style={styles.inputBar}>
        <div style={styles.washiTape} aria-hidden="true" />
        
        <button 
          className="tactile-btn"
          style={styles.attachBtn} 
          onClick={handleFileClick} 
          title="Attach"
          aria-label="Attach photo or file"
        >
          <Icon path={<path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />} size={22} color={theme.accent} />
        </button>
        
        <div style={styles.inputWrapper}>
          <input
            style={styles.input}
            value={inputText}
            onChange={handleInputChange}
            placeholder={uploading ? "Transmitting..." : "Write a message..."}
            disabled={uploading}
            maxLength={5000}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
        </div>

        {inputText.trim() ? (
          <button 
            className="tactile-btn"
            style={styles.sendBtn} 
            onClick={handleSend}
            title="Send"
            aria-label="Send message"
          >
            <Icon path={<><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></>} size={20} color="#fff" />
          </button>
        ) : (
          <button 
            className="tactile-btn"
            style={styles.attachBtn} 
            onClick={recording ? stopRecording : startRecording}
            title="Voice"
            aria-label="Record voice message"
          >
            <Icon 
              path={<><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></>} 
              size={22} 
              color={recording ? theme.crimson : theme.accent}
            />
          </button>
        )}
      </div>
      ) : (
      <div style={{...styles.inputBar, justifyContent: 'center', padding: '12px 16px'}}>
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: theme.inkMuted, fontStyle: 'italic' }}>
          This connection has ended
        </span>
      </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onFileSelected} />

      {/* OVERLAYS */}
      {selectedMessage && menuAnchor && (
        <MessageActionMenu
          anchorRect={menuAnchor}
          isMine={String(selectedMessage.sender || selectedMessage.senderId) === String(myId)}
          isMedia={selectedMessage.type === 'image' || selectedMessage.type === 'audio'}
          onClose={handleCloseMenu}
          onReply={handleReply}
          onReact={handleReact}
          onCopy={handleCopy}
          onReport={handleReport}
          onDelete={handleDelete}
        />
      )}

      {showEmojiPicker && (
        <EmojiPicker
          anchorRect={emojiPickerAnchor}
          onSelect={handleEmojiSelect}
          onClose={() => { setShowEmojiPicker(false); setEmojiPickerAnchor(null); setSelectedMessage(null); }}
        />
      )}

      {showPhotoViewer && <PhotoViewer src={photoViewerUrl} onClose={() => setShowPhotoViewer(false)} />}

      {showSearch && (
        <SearchOverlay
          messages={messages}
          myId={myId}
          onClose={() => setShowSearch(false)}
          onJumpTo={handleSearchJump}
        />
      )}

      {showReportModal && (
        <ReportModal
          reportedUserId={otherUserId}
          onClose={() => setShowReportModal(false)}
          onReported={() => {
            setShowReportModal(false);
            toast.success('Report submitted. Thank you for keeping the community safe.');
          }}
        />
      )}

      {/* ACTION SHEET */}
      <AnimatePresence>
        {showActionSheet && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={styles.sheetBackdrop} onClick={() => { setShowActionSheet(false); setPendingFile(null); }}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} style={styles.sheet} onClick={(e) => e.stopPropagation()}>
              <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.border}` }}>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', fontWeight: '700', color: theme.ink }}>Attach Media</span>
                <button onClick={() => { setShowActionSheet(false); setPendingFile(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <Icon path={<><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>} size={20} color={theme.inkMuted} />
                </button>
              </div>
              <div style={{ padding: '16px 24px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button className="tactile-btn" style={styles.sheetBtn} onClick={() => uploadAndSend('image')}>
                  <Icon path={<><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></>} size={20} />
                  Send as Photograph
                </button>
                <button className="tactile-btn" style={styles.sheetBtn} onClick={() => uploadAndSend('audio')}>
                  <Icon path={<><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /></>} size={20} />
                  Send as Voice Note
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ARCHIVAL PROFILE SHEET */}
      <AnimatePresence>
        {showProfile && <ChatProfileView profile={matchUser} unavailable={otherUnavailable} onClose={() => setShowProfile(false)} />}
      </AnimatePresence>
    </div>
  );
};

/* ==================================================================
   STYLES
================================================================== */
const styles = {
  page: { position: 'fixed', inset: 0, backgroundColor: theme.paper, display: 'flex', flexDirection: 'column', zIndex: 50, overflow: 'hidden' },
  paperGrain: { position: 'absolute', inset: 0, backgroundImage: `url("${design?.texture?.grain || ''}")`, mixBlendMode: 'multiply', opacity: 0.85, pointerEvents: 'none', zIndex: 1 },
  
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '45px', boxSizing: 'border-box', padding: '0 24px', backgroundColor: theme.surface, borderBottom: `2px solid ${theme.borderDark}`, position: 'relative', zIndex: 10, boxShadow: `0 4px 16px ${theme.shadowWarm}`, contain: 'layout style' },
  backBtn: { background: theme.surface, border: `1px solid ${theme.border}`, color: theme.ink, borderRadius: design?.radius?.md || '8px', padding: '10px', marginRight: '4px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'transform 0.15s ease', WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation', minWidth: '44px', minHeight: '44px' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', flex: 1 },
  headerAvatar: { width: '44px', height: '44px', borderRadius: '12px', objectFit: 'cover', border: `2px solid ${theme.borderDark}`, boxShadow: `0 2px 8px ${theme.shadowWarm}` },
  onlineDot: { position: 'absolute', bottom: '2px', right: '2px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#2e7d32', border: `2px solid ${theme.surface}`, boxShadow: '0 0 4px rgba(46, 125, 50, 0.6)' },
  headerInfo: { display: 'flex', flexDirection: 'column' },
  headerName: { fontFamily: "'Playfair Display', serif", fontSize: '18px', fontWeight: '700', color: theme.ink, lineHeight: 1.2 },
  headerStatus: { fontFamily: "'Inter', sans-serif", fontSize: '11px', color: theme.inkMuted, marginTop: '2px', letterSpacing: '0.5px' },
  iconBtn: { background: 'none', border: 'none', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: design?.radius?.md || '8px' },
  dropdownMenu: { position: 'absolute', top: '100%', right: 0, backgroundColor: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', zIndex: 100, overflow: 'hidden', minWidth: '180px', marginTop: '8px' },
  dropdownItem: { display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '14px 16px', background: 'none', border: 'none', fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: '500', color: theme.ink, cursor: 'pointer', textAlign: 'left' },
  tornEdgeBottom: { position: 'absolute', bottom: '-12px', left: 0, right: 0, height: '12px', backgroundColor: theme.surface, clipPath: 'polygon(0 0, 2% 60%, 4% 20%, 6% 80%, 8% 40%, 10% 90%, 12% 30%, 14% 70%, 16% 50%, 18% 100%, 20% 20%, 22% 80%, 24% 40%, 26% 90%, 28% 30%, 30% 70%, 32% 50%, 34% 100%, 36% 20%, 38% 80%, 40% 40%, 42% 90%, 44% 30%, 46% 70%, 48% 50%, 50% 100%, 52% 20%, 54% 80%, 56% 40%, 58% 90%, 60% 30%, 62% 70%, 64% 50%, 66% 100%, 68% 20%, 70% 80%, 72% 40%, 74% 90%, 76% 30%, 78% 70%, 80% 50%, 82% 100%, 84% 20%, 86% 80%, 88% 40%, 90% 90%, 92% 30%, 94% 70%, 96% 50%, 98% 100%, 100% 0)', zIndex: 11 },

  messages: { flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '24px 28px', position: 'relative', zIndex: 2, contain: 'content', willChange: 'scroll-position' },
  dateSeparator: { display: 'flex', justifyContent: 'center', margin: '24px 0 16px' },
  dateText: { fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: '700', color: theme.inkMuted, backgroundColor: theme.surfaceAlt, padding: '5px 14px', borderRadius: design?.radius?.sm || '4px', border: `1px solid ${theme.border}`, textTransform: 'uppercase', letterSpacing: '1px' },
  openingLetterCard: { margin: '8px 16px 16px', padding: '16px 20px', background: 'linear-gradient(135deg, #fdfbf7 0%, #f4f1ea 100%)', border: `1px solid ${theme.border}`, borderRadius: '12px', textAlign: 'center', boxShadow: `0 2px 8px ${theme.shadowWarm}` },
  openingLetterLabel: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: theme.accent, marginBottom: '8px' },
  openingLetterText: { fontFamily: "'Inter', sans-serif", fontSize: '15px', lineHeight: '1.5', color: theme.ink, fontStyle: 'italic' },
  openingLetterDate: { fontFamily: "'Inter', sans-serif", fontSize: '11px', color: theme.inkMuted, marginTop: '8px' },
  typing: { color: theme.inkMuted, padding: '0 16px 6px', display: 'flex', alignItems: 'center', gap: '4px' },
  typingDot: { display: 'inline-block', width: '6px', height: '6px', backgroundColor: theme.accent, borderRadius: '50%', animation: 'blink 1.4s infinite both' },
  
  scrollButton: {
    position: 'absolute',
    bottom: '140px',
    right: '24px',
    width: '44px',
    height: '44px',
    borderRadius: design?.radius?.md || '8px',
    backgroundColor: theme.surface,
    border: `2px solid ${theme.borderDark}`,
    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 20,
  },
  
  inputBar: { display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 24px', paddingBottom: 'max(16px, env(safe-area-inset-bottom))', borderTop: `2px solid ${theme.borderDark}`, backgroundColor: theme.surface, position: 'relative', zIndex: 10, boxShadow: `0 -4px 16px ${theme.shadowWarm}`, contain: 'layout style' },
  washiTape: { position: 'absolute', top: '-8px', left: '50%', transform: 'translateX(-50%) rotate(-1deg)', width: '60px', height: '16px', backgroundColor: 'rgba(224, 216, 200, 0.9)', backdropFilter: 'blur(2px)', border: '1px solid rgba(139, 69, 19, 0.2)', boxShadow: '0 2px 4px rgba(0,0,0,0.08)', zIndex: 11 },
  attachBtn: { background: theme.surfaceAlt, border: `1.5px solid ${theme.border}`, borderRadius: design?.radius?.md || '8px', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: `0 2px 8px ${theme.shadowWarm}`, flexShrink: 0 },
  inputWrapper: { flex: 1, backgroundColor: theme.surfaceAlt, border: `1.5px solid ${theme.border}`, borderRadius: '24px', padding: '0 20px', display: 'flex', alignItems: 'center', boxShadow: `inset 0 2px 4px rgba(0,0,0,0.03)` },
  input: { flex: 1, background: 'none', border: 'none', padding: '12px 0', color: theme.ink, fontFamily: "'Special Elite', cursive", fontSize: '15px', outline: 'none' },
  sendBtn: { width: '44px', height: '44px', borderRadius: design?.radius?.md || '8px', backgroundColor: theme.crimson, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: `0 4px 12px rgba(139, 26, 26, 0.4)`, flexShrink: 0 },

  sheetBackdrop: { position: 'fixed', inset: 0, backgroundColor: 'rgba(20,15,10,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', zIndex: 120 },
  sheet: { backgroundColor: theme.paper, backgroundImage: `url("${design?.texture?.grain || ''}")`, width: '100%', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', boxShadow: '0 -10px 30px rgba(0,0,0,0.25)' },
  sheetBtn: { display: 'flex', alignItems: 'center', gap: '12px', width: '100%', background: theme.surface, border: `1.5px solid ${theme.borderDark}`, color: theme.ink, fontFamily: "'Inter', sans-serif", fontWeight: '600', padding: '16px', borderRadius: '12px', fontSize: '14px', cursor: 'pointer', boxShadow: `0 4px 12px ${theme.shadowWarm}` },
};

export default Chat;
```

### ./client/src/pages/Discover.jsx

```
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ProfileCard from '../components/ProfileCard';
import ProfileCardSkeleton from '../components/ProfileCardSkeleton';
import { api } from '../utils/api';
import { useAuth } from '../utils/AuthContext';
import ShadowbanBanner from '../components/ShadowbanBanner';
import LearnMoreSheet from '../components/LearnMoreSheet';
import { triggerHaptic } from '../utils/haptics';
import { theme as design } from '../utils/theme';
import { discoverStore, initDiscoverStore, saveDiscoverStore, resetDiscoverStore } from '../utils/discoverStore';
import { RotateCw, Compass, AlertTriangle } from 'lucide-react';

/* Locked tokens — same family as ProfileCard */
const t = {
  desk: '#ece4d4',
  paper: '#fdfbf7',
  surfaceAlt: '#f4f1ea',
  lineDark: '#d4c5a9',
  ink: '#1a1a1a',
  inkMuted: '#8c8275',
  accent: '#8b4513',
  crimson: '#8b1a1a',
  fontDisplay: design?.font?.heading || "'Playfair Display', Georgia, serif",
  fontBody: design?.font?.body || "'Inter', -apple-system, sans-serif",
  fontType: "'Special Elite', 'Courier New', monospace",
  grain: design?.texture?.grain || '',
};

const slideVariants = {
  enter: (direction) => ({
    y: direction === 'up' ? '120vh' : '-120vh',
    zIndex: 2,
  }),
  center: {
    y: 0,
    zIndex: 2,
  },
  exit: (direction) => ({
    y: direction === 'up' ? '-20vh' : '20vh',
    opacity: 0,
    zIndex: 1,
  }),
};

const springTransition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
  mass: 1,
};

const Discover = ({ onOpenChat }) => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [slideDirection, setSlideDirection] = useState('up');

  const [showAlignmentModal, setShowAlignmentModal] = useState(false);
  const [alignedProfile, setAlignedProfile] = useState(null);

  const actionPendingRef = useRef(false);
  const { user: myUser } = useAuth();
  const [showLearnMore, setShowLearnMore] = useState(false);
  const shadowbanScore = myUser?.shadowbanScore || 0;

  const fetchProfiles = useCallback(async (append = false) => {
    if (!append) { setLoading(true); setError(null); resetDiscoverStore(); }
    else setFetchingMore(true);

    try {
      const data = await api.get('/discover?limit=10');
      const newProfiles = data.users || [];
      if (append) {
        setProfiles((prev) => {
          const next = [...prev, ...newProfiles];
          discoverStore.profiles = next;
          discoverStore.hasMore = data.hasMore;
          saveDiscoverStore();
          return next;
        });
      }
      else {
        setProfiles(newProfiles);
        setCurrentIndex(0);
        discoverStore.profiles = newProfiles;
        discoverStore.currentIndex = 0;
        discoverStore.hasMore = data.hasMore;
        saveDiscoverStore();
      }
      setHasMore(data.hasMore);
    } catch (err) {
      console.error('Failed to fetch archival profiles:', err);
      if (!append) setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
      setFetchingMore(false);
    }
  }, []);

  useEffect(() => {
    const userId = myUser?._id;
    if (!userId) return;
    const restored = initDiscoverStore(userId);
    if (restored && discoverStore.profiles.length > 0) {
      setProfiles(discoverStore.profiles);
      setCurrentIndex(discoverStore.currentIndex);
      setHasMore(discoverStore.hasMore);
      setLoading(false);
      return;
    }
    fetchProfiles(false);
  }, [myUser?._id, fetchProfiles]);

  const handleNextProfile = useCallback((direction = 'up', isAction = false) => {
    if (direction === 'down') {
      if (currentIndex <= 0) return;
      const next = Math.max(0, currentIndex - 1);
      setCurrentIndex(next);
      discoverStore.currentIndex = next;
      saveDiscoverStore();
      setSlideDirection('down');
      return;
    }

    if (currentIndex >= profiles.length) return;

    setSlideDirection(direction);

    if (!isAction) {
      const passedProfile = profiles[currentIndex];
      if (passedProfile) {
        api.post(`/discover/pass/${passedProfile._id}`).catch(console.error);
        triggerHaptic('light');
      }
    }

    const next = currentIndex + 1;
    setCurrentIndex(next);
    discoverStore.currentIndex = next;
    discoverStore.profiles = profiles;
    saveDiscoverStore();

    if (profiles.length - currentIndex <= 4 && hasMore && !fetchingMore) {
      fetchProfiles(true);
    }
  }, [currentIndex, profiles, hasMore, fetchingMore, fetchProfiles]);

  const handleAction = useCallback(async (action, payload = {}) => {
    if (actionPendingRef.current) return;
    actionPendingRef.current = true;
    if (currentIndex >= profiles.length) {
      actionPendingRef.current = false;
      return;
    }
    const profile = profiles[currentIndex];

    try {
      if (action === 'like') {
        triggerHaptic('light');
        const response = await api.post(`/discover/like/${profile._id}`, payload);
        if (response.matched) {
          setAlignedProfile({ ...response.user, matchId: response.matchId });
          setShowAlignmentModal(true);
        }
      }
      else if (action === 'superlike') {
        triggerHaptic('heavy');
        const response = await api.post(`/discover/superlike/${profile._id}`, payload);
        if (response.matched) {
          setAlignedProfile({ ...response.user, matchId: response.matchId });
          setShowAlignmentModal(true);
        }
      }
      else if (action === 'pass') {
        triggerHaptic('medium');
        await api.post(`/discover/pass/${profile._id}`);
      }

      handleNextProfile('up', true);

    } catch (err) {
      console.error('Action failed:', err);
    } finally {
      actionPendingRef.current = false;
    }
  }, [currentIndex, profiles, handleNextProfile]);

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '12px', backgroundColor: t.desk }}>
        <ProfileCardSkeleton />
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px', textAlign: 'center', width: '100%', backgroundColor: t.desk }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: t.surfaceAlt, border: '1px solid rgba(212,197,169,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <AlertTriangle size={18} strokeWidth={2} color={t.crimson} />
        </div>
        <h3 style={{ fontFamily: t.fontDisplay, fontSize: 22, fontWeight: 800, color: t.ink, letterSpacing: '-0.02em', margin: '0 0 8px 0' }}>The Archive is Unreachable</h3>
        <p style={{ fontFamily: t.fontBody, fontSize: 13.5, fontWeight: 450, lineHeight: 1.6, maxWidth: 280, marginBottom: 24, color: t.inkMuted }}>{error}</p>
        <button onClick={() => fetchProfiles(false)} className="tactile-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 24px', backgroundColor: t.crimson, color: '#fff', border: 'none', borderRadius: 999, fontFamily: t.fontBody, fontSize: 11, fontWeight: 800, letterSpacing: '1.8px', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 6px 18px rgba(139,26,26,0.28)' }}>
          <RotateCw size={14} strokeWidth={2.5} /> Try Again
        </button>
      </div>
    );
  }

  if (!profiles || profiles.length === 0 || currentIndex >= profiles.length) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px', textAlign: 'center', width: '100%', backgroundColor: t.desk }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: t.surfaceAlt, border: '1px solid rgba(212,197,169,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Compass size={18} strokeWidth={2} color={t.accent} />
        </div>
        <h3 style={{ fontFamily: t.fontDisplay, fontSize: 22, fontWeight: 800, color: t.ink, letterSpacing: '-0.02em', margin: '0 0 8px 0' }}>The Archive is Quiet</h3>
        <p style={{ fontFamily: t.fontBody, fontSize: 13.5, fontWeight: 450, lineHeight: 1.6, maxWidth: 280, marginBottom: 24, color: t.inkMuted }}>You've reviewed everyone for now. Check back later.</p>
        <button onClick={() => fetchProfiles(false)} className="tactile-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 24px', backgroundColor: t.crimson, color: '#fff', border: 'none', borderRadius: 999, fontFamily: t.fontBody, fontSize: 11, fontWeight: 800, letterSpacing: '1.8px', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 6px 18px rgba(139,26,26,0.28)' }}>
          <RotateCw size={14} strokeWidth={2.5} /> Refresh
        </button>
      </div>
    );
  }

  return (
    <div style={styles.viewportRoot}>
      <div aria-hidden="true" style={styles.paperGrain} />

      <style>{`
        .hide-scroll::-webkit-scrollbar { display: none; }
        .tactile-btn { transition: transform 0.15s ease-out; will-change: transform; }
        .tactile-btn:active { transform: scale(0.96) !important; }
      `}</style>

      <ShadowbanBanner score={shadowbanScore} onLearnMore={() => setShowLearnMore(true)} />
      {showLearnMore && <LearnMoreSheet onClose={() => setShowLearnMore(true)} onClose={() => setShowLearnMore(false)} />}

      <div style={styles.stageContainer}>
        {/* Full width/height container. No overflow clipping here! */}
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <AnimatePresence initial={false} custom={slideDirection}>
            {profiles[currentIndex] && (
              <motion.div
                key={profiles[currentIndex]._id || profiles[currentIndex].id}
                custom={slideDirection}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={springTransition}
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex', flexDirection: 'column',
                }}
              >
                <ProfileCard
                  profile={profiles[currentIndex]}
                  onAction={handleAction}
                  onNavigate={handleNextProfile}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {showAlignmentModal && alignedProfile && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(28,19,10,0.72)', zIndex: 99998 }}
              onClick={() => { setShowAlignmentModal(false); setAlignedProfile(null); }}
            />
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.94, opacity: 0, y: 16 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90%', maxWidth: 340, backgroundColor: t.paper, border: '1px solid rgba(212,197,169,0.7)', borderRadius: 18, padding: '32px 24px 24px', textAlign: 'center', zIndex: 99999, boxShadow: '0 24px 64px rgba(12,7,2,0.45)', overflow: 'hidden' }}
            >
              {/* Grain film */}
              <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: `url("${t.grain}")`, mixBlendMode: 'multiply', opacity: 0.3, pointerEvents: 'none' }} />

              {/* The match seal — stamp language, one crimson moment */}
              <motion.div
                initial={{ scale: 1.8, opacity: 0, rotate: -18 }}
                animate={{ scale: 1, opacity: 1, rotate: -6 }}
                transition={{ delay: 0.15, type: 'spring', damping: 16, stiffness: 260 }}
                style={{ width: 96, height: 96, margin: '0 auto 18px', position: 'relative' }}
              >
                <svg viewBox="0 0 96 96" width="96" height="96">
                  <circle cx="48" cy="48" r="45" fill="none" stroke={t.crimson} strokeWidth="3" />
                  <circle cx="48" cy="48" r="37" fill="none" stroke={t.crimson} strokeWidth="1" strokeDasharray="3 3" opacity="0.7" />
                  <text x="48" y="60" textAnchor="middle" fill={t.crimson} style={{ fontFamily: t.fontDisplay, fontSize: '38px', fontWeight: 900 }}>M</text>
                </svg>
              </motion.div>

              <h2 style={{ fontFamily: t.fontDisplay, fontSize: 26, color: t.ink, margin: '0 0 8px 0', fontWeight: 800, letterSpacing: '-0.02em' }}>You are Aligned</h2>
              <p style={{ fontFamily: t.fontBody, fontSize: 13.5, fontWeight: 450, color: t.inkMuted, margin: '0 0 24px 0', lineHeight: 1.55 }}>You and {alignedProfile.name} have found common ground. The correspondence is now open.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, position: 'relative' }}>
                <button onClick={() => { triggerHaptic('heavy'); setShowAlignmentModal(false); if (onOpenChat && alignedProfile) { onOpenChat({ _id: alignedProfile.matchId, user: alignedProfile }); } setAlignedProfile(null); }} style={{ width: '100%', padding: '15px', backgroundColor: t.crimson, color: '#fff', border: 'none', borderRadius: 999, fontFamily: t.fontBody, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.8px', cursor: 'pointer', boxShadow: '0 6px 18px rgba(139,26,26,0.28)' }}>Open Correspondence</button>
                <button onClick={() => { setShowAlignmentModal(false); setAlignedProfile(null); }} style={{ width: '100%', padding: '15px', backgroundColor: 'transparent', color: t.ink, border: '1px solid rgba(212,197,169,0.9)', borderRadius: 999, fontFamily: t.fontBody, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.8px', cursor: 'pointer' }}>Continue Exploring</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const styles = {
  viewportRoot: { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', backgroundColor: '#ece4d4', position: 'relative', overflow: 'hidden', userSelect: 'none', WebkitUserSelect: 'none' },
  paperGrain: { position: 'absolute', inset: 0, backgroundImage: `url("${design.texture.grain}")`, mixBlendMode: 'multiply', opacity: 0.3, pointerEvents: 'none', zIndex: 1 },
  stageContainer: { flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', position: 'relative', padding: 0, zIndex: 2 },
};

export default Discover;
```

### ./client/src/pages/Matches.jsx

```
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../utils/api';
import { toast } from '../utils/toast';
import { useAuth } from '../utils/AuthContext';
import socket from '../utils/socket';
import { theme as design } from '../utils/theme';
import { SkeletonBox } from '../components/Skeleton';
import { Heart, MoreVertical, Search, X } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

/* Locked tokens — same family as ProfileCard */
const t = {
  desk: '#ece4d4',
  paper: '#fdfbf7',
  card: '#fffdf8',
  surfaceAlt: '#f4f1ea',
  lineDark: '#d4c5a9',
  ink: '#1a1a1a',
  inkSoft: '#4a4a4a',
  inkMuted: '#8c8275',
  accent: '#8b4513',
  crimson: '#8b1a1a',
  fontDisplay: design?.font?.heading || "'Playfair Display', Georgia, serif",
  fontBody: design?.font?.body || "'Inter', -apple-system, sans-serif",
  fontType: "'Special Elite', 'Courier New', monospace",
  grain: design?.texture?.grain || '',
};

const Matches = ({ onOpenChat }) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [isFocused, setIsFocused] = useState(false);

  const { user } = useAuth();
  const myId = user?._id;

  const { data, isLoading } = useQuery({
    queryKey: ['matches'],
    queryFn: () => api.get('/matches'),
  });

  const matches = useMemo(() => data?.matches || [], [data]);

  // WhatsApp-style real-time updates: bump the match to the top and refresh its preview
  useEffect(() => {
    const onNew = (msg) => {
      queryClient.setQueryData(['matches'], (old) => {
        if (!old?.matches) return old;
        const list = [...old.matches];
        const idx = list.findIndex((m) => m._id === msg.matchId);
        if (idx === -1) return old;
        const m = list[idx];
        const updated = {
          ...m,
          lastMessage: {
            text: msg.text,
            senderId: msg.senderId,
            createdAt: msg.createdAt,
            readAt: msg.readAt ?? null,
            type: msg.type,
            image: msg.image,
          },
          yourTurn: msg.senderId !== myId,
        };
        list.splice(idx, 1);
        list.unshift(updated);
        return { ...old, matches: list };
      });
    };
    socket.on('new-message', onNew);
    return () => socket.off('new-message', onNew);
  }, [queryClient, myId]);

  // Real-time unmatch: remove the match from cache when the other user severs the connection
  useEffect(() => {
    const onUnmatch = ({ matchId }) => {
      queryClient.setQueryData(['matches'], (old) => ({
        ...(old || {}),
        matches: (old?.matches || []).filter((m) => m._id !== matchId),
      }));
    };
    socket.on('unmatch-notification', onUnmatch);
    return () => socket.off('unmatch-notification', onUnmatch);
  }, [queryClient]);

  const handleUnmatch = useCallback(async (matchId) => {
    setOpenMenuId(null);
    if (!window.confirm('Are you sure you want to unmatch? This cannot be undone.')) return;
    try {
      await api.delete(`/matches/${matchId}`);
      queryClient.setQueryData(['matches'], (old) => ({
        ...(old || {}),
        matches: (old?.matches || []).filter((m) => m._id !== matchId),
      }));
    } catch (err) {
      toast.error('Failed to sever this connection. Please try again.');
    }
  }, [queryClient]);

  const fmtTime = useCallback((ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return 'now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 172800) return 'Yesterday';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }, []);

  const timeAgo = useCallback((ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 3600) return `${Math.floor(Math.max(diff, 1) / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }, []);

  // Memoized filter to avoid recalculating string matching during high-frequency socket events
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return matches;
    return matches.filter((m) => m.user?.name?.toLowerCase().includes(query));
  }, [matches, search]);

  if (isLoading) {
    return (
      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: t.desk, padding: '16px 14px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, backgroundColor: t.paper, border: '1px solid rgba(212,197,169,0.7)', borderRadius: 18, padding: 16, boxShadow: '0 14px 34px rgba(88,63,30,0.16), 0 3px 8px rgba(88,63,30,0.08)' }}>
              <SkeletonBox width={56} height={56} radius="50%" />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <SkeletonBox width={120} height={14} />
                <SkeletonBox width={180} height={11} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 16, padding: 32, backgroundColor: t.desk,
      }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: t.surfaceAlt, border: '1px solid rgba(212,197,169,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Heart size={18} strokeWidth={2} color={t.accent} />
        </div>
        <p style={{ fontFamily: t.fontDisplay, fontSize: 22, color: t.ink, textAlign: 'center', margin: 0, fontWeight: 800, letterSpacing: '-0.02em' }}>
          No connections yet
        </p>
        <p style={{ fontFamily: t.fontBody, fontSize: 13.5, fontWeight: 450, color: t.inkMuted, textAlign: 'center', maxWidth: 280, margin: 0, lineHeight: 1.6 }}>
          Start exploring and leave a flower to begin your story.
        </p>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', backgroundColor: t.desk, padding: '16px 14px' }}>
      {/* Grain film */}
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, backgroundImage: `url("${t.grain}")`, mixBlendMode: 'multiply', opacity: 0.3, pointerEvents: 'none', zIndex: 0 }} />

      <style>{`
        .match-card {
          will-change: transform;
          transition: transform 0.15s ease-out, box-shadow 0.2s ease;
          contain: layout style;
        }
        @media (hover: hover) {
          .match-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 18px 40px rgba(88,63,30,0.2), 0 4px 12px rgba(88,63,30,0.1);
          }
        }
        .match-card:active {
          transform: scale(0.98) !important;
          transition: transform 0.08s ease-out !important;
        }
        @media (prefers-reduced-motion: reduce) {
          .match-card { transition: none !important; transform: none !important; }
        }
      `}</style>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <h2 style={{ fontFamily: t.fontDisplay, fontSize: 24, color: t.ink, marginBottom: 16, marginTop: 4, fontWeight: 800, letterSpacing: '-0.02em' }}>
          Your Connections
        </h2>

        {/* Search — box-tier input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '0 14px',
            marginBottom: 18,
            backgroundColor: t.paper,
            border: `1px solid ${isFocused ? 'rgba(139,69,19,0.45)' : 'rgba(212,197,169,0.7)'}`,
            borderRadius: 6,
            transition: 'border-color 0.2s ease',
          }}
        >
          <Search size={14} strokeWidth={2} color={isFocused ? t.accent : t.inkMuted} style={{ transition: 'color 0.2s ease', flexShrink: 0 }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Search connections..."
            aria-label="Search connections"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '12px 0',
              backgroundColor: 'transparent',
              border: 'none',
              fontFamily: t.fontBody,
              fontSize: 13.5,
              color: t.ink,
              outline: 'none',
            }}
          />
          {search && (
            <button
              type="button"
              onClick={() => { triggerHaptic('light'); setSearch(''); }}
              aria-label="Clear search"
              style={{ background: 'none', border: 'none', color: t.inkMuted, cursor: 'pointer', display: 'flex', padding: 4, flexShrink: 0 }}
            >
              <X size={14} strokeWidth={2} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((match) => {
            const user = match.user;
            if (!user) return null;

            const lastMessage = match.lastMessage;
            const unread =
              match.yourTurn ||
              (lastMessage && lastMessage.senderId && lastMessage.senderId !== myId && !lastMessage.readAt);
            const isOpen = openMenuId === match._id;

            const lastIsMedia = lastMessage && (lastMessage.type === 'image' || lastMessage.type === 'audio');

            return (
              <div
                key={match._id}
                className="match-card"
                role="button"
                tabIndex={0}
                onClick={() => { triggerHaptic('light'); onOpenChat(match); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onOpenChat(match);
                  }
                }}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  backgroundColor: unread ? t.card : t.paper,
                  border: `1px solid ${unread ? 'rgba(139,69,19,0.35)' : 'rgba(212,197,169,0.7)'}`,
                  borderRadius: 18,
                  padding: '14px 16px',
                  boxShadow: '0 14px 34px rgba(88,63,30,0.16), 0 3px 8px rgba(88,63,30,0.08)',
                  cursor: 'pointer',
                }}
              >
                {/* Avatar — circular with hairline ring, matching every other avatar in the app */}
                <img
                  src={user.photos?.[0] || 'https://via.placeholder.com/80'}
                  alt={user.name}
                  loading="lazy"
                  decoding="async"
                  style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(212,197,169,0.9)', backgroundColor: t.surfaceAlt, flexShrink: 0 }}
                />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <p style={{ fontFamily: t.fontBody, fontSize: 15, fontWeight: unread ? 700 : 600, color: t.ink, margin: 0 }}>
                      {user.name}{user.age ? <span style={{ fontWeight: 400, color: t.inkMuted }}>, {user.age}</span> : null}
                    </p>
                    {unread && (
                      <span
                        aria-label="Unread message"
                        style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: t.crimson, flexShrink: 0, boxShadow: '0 0 0 3px rgba(139,26,26,0.12)' }}
                      />
                    )}
                  </div>
                  <p style={{ fontFamily: t.fontType, fontSize: 12.5, color: unread ? t.inkSoft : t.inkMuted, margin: '4px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: unread ? 700 : 400 }}>
                    {lastMessage
                      ? lastIsMedia
                        ? (lastMessage.type === 'image' ? 'Sent a photograph' : 'Sent a voice note')
                        : lastMessage.text
                      : 'Say hello'}
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                  <span style={{ fontFamily: t.fontType, fontSize: 10.5, color: unread ? t.accent : t.inkMuted, fontWeight: unread ? 700 : 400, whiteSpace: 'nowrap' }}>
                    {lastMessage ? fmtTime(lastMessage.createdAt) : `Matched ${timeAgo(match.createdAt)}`}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHaptic('light');
                      setOpenMenuId(isOpen ? null : match._id);
                    }}
                    style={{ background: 'none', border: 'none', color: t.inkMuted, cursor: 'pointer', padding: 4, margin: -4, display: 'flex', alignItems: 'center', borderRadius: 4 }}
                    aria-label="More options"
                    title="More options"
                  >
                    <MoreVertical size={16} strokeWidth={2} />
                  </button>
                </div>

                {/* Contextual menu */}
                <AnimatePresence>
                  {isOpen && (
                    <>
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(null);
                        }}
                        style={{ position: 'fixed', inset: 0, zIndex: 90, cursor: 'default' }}
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: -6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: -6 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        style={{ position: 'absolute', top: 48, right: 16, backgroundColor: t.paper, border: '1px solid rgba(212,197,169,0.7)', borderRadius: 8, boxShadow: '0 12px 28px rgba(88,63,30,0.22)', zIndex: 100, overflow: 'hidden', minWidth: 150, padding: 6 }}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnmatch(match._id);
                          }}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 12px', background: 'none', border: 'none', fontFamily: t.fontBody, fontSize: 12, fontWeight: 800, color: t.crimson, cursor: 'pointer', textAlign: 'left', borderRadius: 5, transition: 'background-color 0.15s ease' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(139, 26, 26, 0.05)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          Unmatch
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Matches;
```

### ./client/src/pages/Onboarding.jsx

```
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppConfig } from '../utils/AppConfigContext';
import { useAuth } from '../utils/AuthContext';
import { api } from '../utils/api';
import { toast } from '../utils/toast';
import { triggerHaptic } from '../utils/haptics';
import { theme as design } from '../utils/theme';
import { 
  X, Camera, ChevronDown, ChevronRight, Lock, RotateCcw, 
  Fingerprint, MapPin, MessageSquare, Sliders, Layers, PenTool, 
  LogOut, Edit3, Sparkle, UserCheck, Award, Calendar 
} from 'lucide-react';

const theme = {
  paper: '#fdfbf7',
  surface: '#ffffff',
  surfaceAlt: '#f4f1ea', 
  border: '#e0d8c8',
  borderDark: '#d4c5a9',
  ink: '#1a1a1a',
  inkMuted: '#8c8275',
  accent: '#8b4513',
  crimson: '#8b1a1a',
  success: '#2e7d32',
  shadowWarm: 'rgba(139, 69, 19, 0.12)',
};

const TYPEWRITER_FONT = "'Special Elite', 'Courier New', monospace";
const HEADER_FONT = design?.font?.heading || "'Playfair Display', serif";
const LABEL_FONT = design?.font?.body || "'Inter', sans-serif";

const CHAPTER_NAMES = [
  "01: Title",
  "02: Vitals",
  "03: Coordinates",
  "04: Portrait",
  "05: Whispers",
  "06: Parameters",
  "07: Alignment",
  "08: Review"
];

const TORN_EDGE_CLIP = 'polygon(0% 100%, 1.56% 18%, 3.12% 4%, 4.69% 22%, 6.25% 8%, 7.81% 16%, 9.38% 2%, 10.94% 24%, 12.50% 6%, 14.06% 14%, 15.62% 10%, 17.19% 20%, 18.75% 0%, 20.31% 18%, 21.88% 4%, 23.44% 22%, 25.00% 8%, 26.56% 16%, 28.12% 2%, 29.69% 24%, 31.25% 6%, 32.81% 14%, 34.38% 10%, 35.94% 20%, 37.50% 0%, 39.06% 18%, 40.62% 4%, 42.19% 22%, 43.75% 8%, 45.31% 16%, 46.88% 2%, 48.44% 24%, 50.00% 6%, 51.56% 14%, 53.12% 10%, 54.69% 20%, 56.25% 0%, 57.81% 18%, 59.38% 4%, 60.94% 22%, 62.50% 8%, 64.06% 16%, 65.62% 2%, 67.19% 24%, 68.75% 6%, 70.31% 14%, 71.88% 10%, 73.44% 20%, 75.00% 0%, 76.56% 18%, 78.12% 4%, 79.69% 22%, 81.25% 8%, 82.81% 16%, 84.38% 2%, 85.94% 24%, 87.50% 6%, 89.06% 14%, 90.62% 10%, 92.19% 20%, 93.75% 0%, 95.31% 18%, 96.88% 4%, 98.44% 22%, 100.00% 100%)';
const TILT = { prompt_0: '1.4deg', photo_1: '-2.2deg', photo_2: '1.8deg', prompt_1: '-1.1deg', prompt_2: '0.5deg', photo_3: '-0.7deg' };

/* ==================================================================
   ENGINE 1: INTERACTIVE SCRUBBING CHAPTER INDEX
================================================================== */
const ChapterIndex = ({ containerRef, completionStates, activeStepIdx = 0 }) => {
  const [scrubbingIdx, setScrubbingIdx] = useState(null);
  const trackRef = useRef(null);

  const handleTouchScrub = (e) => {
    if (!trackRef.current) return;
    const touch = e.touches ? e.touches[0] : e;
    const rect = trackRef.current.getBoundingClientRect();
    const relativeY = Math.max(0, Math.min(touch.clientY - rect.top, rect.height));
    const percentage = relativeY / rect.height;
    const targetIdx = Math.min(
      Math.floor(percentage * completionStates.length),
      completionStates.length - 1
    );
    
    if (targetIdx !== scrubbingIdx) {
      triggerHaptic('light');
      setScrubbingIdx(targetIdx);
    }
  };

  const handleScrubEnd = () => {
    if (scrubbingIdx !== null && containerRef.current) {
      triggerHaptic('medium');
      const pages = containerRef.current.querySelectorAll('[data-snap-page]');
      if (pages[scrubbingIdx]) {
        pages[scrubbingIdx].scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    setScrubbingIdx(null);
  };

  const currentIdx = scrubbingIdx !== null ? scrubbingIdx : activeStepIdx;
  const lineHeight = `${(currentIdx / (completionStates.length - 1)) * 100}%`;

  return (
    <div 
      ref={trackRef}
      onTouchStart={handleTouchScrub}
      onTouchMove={handleTouchScrub}
      onTouchEnd={handleScrubEnd}
      onMouseDown={handleTouchScrub}
      onMouseMove={(e) => e.buttons === 1 && handleTouchScrub(e)}
      onMouseUp={handleScrubEnd}
      onContextMenu={(e) => e.preventDefault()}
      style={{ 
        position: 'fixed', left: '12px', top: '15%', bottom: '15%', width: '24px', 
        zIndex: 90, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', 
        alignItems: 'center', cursor: 'pointer', touchAction: 'none' 
      }}
    >
      <div style={{ position: 'absolute', top: 0, bottom: 0, width: '2px', backgroundColor: 'rgba(139, 69, 19, 0.15)', zIndex: 1 }} />
      
      <motion.div 
        animate={{ height: lineHeight }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        style={{ position: 'absolute', top: 0, width: '2px', backgroundColor: theme.crimson, boxShadow: `0 0 8px ${theme.crimson}`, zIndex: 2 }} 
      />

      <AnimatePresence>
        {scrubbingIdx !== null && (
          <motion.div
            initial={{ opacity: 0, x: -10, scale: 0.8 }}
            animate={{ opacity: 1, x: 20, scale: 1 }}
            exit={{ opacity: 0, x: -10, scale: 0.8 }}
            style={{
              position: 'absolute',
              top: `${(scrubbingIdx / (completionStates.length - 1)) * 100}%`,
              left: '12px',
              transform: 'translateY(-50%)',
              backgroundColor: theme.ink,
              color: '#fff',
              padding: '6px 12px',
              borderRadius: '8px',
              fontFamily: LABEL_FONT,
              fontSize: '11px',
              fontWeight: 800,
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              zIndex: 100
            }}
          >
            {CHAPTER_NAMES[scrubbingIdx]}
          </motion.div>
        )}
      </AnimatePresence>

      {completionStates.map((isComplete, idx) => {
        const isActive = idx === currentIdx;
        return (
          <motion.div 
            key={idx}
            animate={{ 
              backgroundColor: isActive ? theme.crimson : isComplete ? theme.accent : theme.surfaceAlt, 
              borderColor: isActive ? theme.crimson : isComplete ? theme.accent : theme.borderDark, 
              scale: isActive ? 1.4 : isComplete ? 1.1 : 0.9 
            }}
            transition={{ duration: 0.2 }}
            style={{ width: '10px', height: '10px', borderRadius: '50%', zIndex: 3, borderWidth: '2px', borderStyle: 'solid' }} 
          />
        );
      })}
    </div>
  );
};

/* ==================================================================
   ENGINE 2: FLUID SNAP PAGE (PREVENTS SUBMERGED CONTENT & SYMMETRY)
================================================================== */
const SnapPage = ({ children, equalPad = false }) => {
  return (
    <div 
      data-snap-page
      style={{ 
        minHeight: '100dvh', width: '100%', scrollSnapAlign: 'start', scrollSnapStop: 'always', 
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', position: 'relative', 
        padding: `max(70px, env(safe-area-inset-top)) ${equalPad ? '16px' : '24px'} max(50px, env(safe-area-inset-bottom)) ${equalPad ? '16px' : '44px'}`,
        boxSizing: 'border-box'
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ amount: 0.2 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        style={{ width: '100%', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'flex-start' }}
      >
        {children}
      </motion.div>
    </div>
  );
};

/* ==================================================================
   SUB-COMPONENTS FOR STEP 8 PROFILE PREVIEW (100% PARITY)
================================================================== */
const PreviewPhotoCorners = React.memo(() => (
  <>
    <span aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0, width: 24, height: 24, background: theme.surface, clipPath: 'polygon(0 0, 100% 0, 0 100%)', zIndex: 3, filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.15))' }} />
    <span aria-hidden="true" style={{ position: 'absolute', top: 0, right: 0, width: 24, height: 24, background: theme.surface, clipPath: 'polygon(100% 0, 0 0, 100% 100%)', zIndex: 3, filter: 'drop-shadow(-1px 1px 2px rgba(0,0,0,0.15))' }} />
    <span aria-hidden="true" style={{ position: 'absolute', bottom: 0, left: 0, width: 24, height: 24, background: theme.surface, clipPath: 'polygon(0 100%, 100% 100%, 0 0)', zIndex: 3, filter: 'drop-shadow(1px -1px 2px rgba(0,0,0,0.15))' }} />
    <span aria-hidden="true" style={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, background: theme.surface, clipPath: 'polygon(100% 100%, 0 100%, 100% 0)', zIndex: 3, filter: 'drop-shadow(-1px -1px 2px rgba(0,0,0,0.15))' }} />
  </>
));

const PreviewMountedPhoto = React.memo(({ src, alt, tilt, aspect }) => (
  <div style={{ '--tilt': tilt, transform: 'rotate(var(--tilt, 0deg))', position: 'relative', width: '100%', aspectRatio: aspect || '4 / 5', borderRadius: '6px', border: `6px solid ${theme.surface}`, backgroundColor: theme.surfaceAlt, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
    <img src={src} alt={alt} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
    <PreviewPhotoCorners />
  </div>
));

const PreviewIndexCard = ({ children, tilt, tape = 'center' }) => {
  const getTapeConfig = () => {
    const base = { position: 'absolute', top: '-10px', width: '36px', height: '16px', backgroundColor: 'rgba(224, 216, 200, 0.95)', border: '1px solid rgba(139,69,19,0.2)', zIndex: 5 };
    if (tape === 'top-right') return { ...base, right: '16px', transform: 'rotate(4deg)' };
    if (tape === 'top-left') return { ...base, left: '16px', transform: 'rotate(-4deg)' };
    return { ...base, left: '50%', transform: 'translateX(-50%) rotate(-1deg)' };
  };

  return (
    <div style={{ '--tilt': tilt, transform: 'rotate(var(--tilt, 0deg))', backgroundColor: theme.surface, backgroundImage: `linear-gradient(${theme.accent}11 1px, transparent 1px)`, backgroundSize: '100% 24px', border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '24px 16px 20px', minHeight: '140px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
      <span aria-hidden="true" style={getTapeConfig()} />
      <span aria-hidden="true" style={{ fontFamily: HEADER_FONT, fontSize: '32px', lineHeight: 0.5, opacity: 0.4, marginBottom: '8px', display: 'block', color: theme.accent }}>“</span>
      <p style={{ fontFamily: HEADER_FONT, fontSize: '15px', fontStyle: 'italic', color: theme.ink, margin: '0 0 4px 0', lineHeight: 1.45, textAlign: 'center', fontWeight: 600, wordBreak: 'break-word' }}>{children}</p>
    </div>
  );
};

/* ==================================================================
   MAIN ONBOARDING COMPONENT
================================================================== */
const Onboarding = ({ onComplete }) => {
  const config = useAppConfig();
  const { logout } = useAuth();
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    name: '', dob: '', gender: '', pronouns: '', branch: '', year: '', hostel: '',
    photos: [], bio: '', intent: [], interestedIn: [], interests: [], compatAnswers: [],
    prompts: [{ question: '', answer: '' }, { question: '', answer: '' }, { question: '', answer: '' }],
  });
  
  const [uploadingSlot, setUploadingSlot] = useState(null);
  const [promptPickerSlot, setPromptPickerSlot] = useState(null);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showEraModal, setShowEraModal] = useState(false);
  const [customPromptText, setCustomPromptText] = useState('');
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [cardLock, setCardLock] = useState(false); 
  const [inquiriesReopened, setInquiriesReopened] = useState(false);
  const inquiryRefs = useRef([]);

  const dayRef = useRef(null); const monthRef = useRef(null); const yearRef = useRef(null);

  const isAnyModalOpen = showBranchModal || showEraModal || promptPickerSlot !== null;

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      const pages = container.querySelectorAll('[data-snap-page]');
      const scrollPos = container.scrollTop + (window.innerHeight / 3);
      pages.forEach((page, idx) => {
        if (scrollPos >= page.offsetTop && scrollPos < page.offsetTop + page.offsetHeight) {
          setActiveStepIdx(idx);
        }
      });
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    api.get('/users/onboarding/resume').then(res => {
      if (res.data && Object.keys(res.data).length > 0) {
        const saved = res.data;
        setFormData(prev => ({
          ...prev,
          ...saved,
          photos: Array.isArray(saved.photos) ? saved.photos : prev.photos,
          intent: Array.isArray(saved.intent) ? saved.intent : prev.intent,
          interestedIn: Array.isArray(saved.interestedIn) ? saved.interestedIn : prev.interestedIn,
          interests: Array.isArray(saved.interests) ? saved.interests : prev.interests,
          compatAnswers: Array.isArray(saved.compatAnswers) ? saved.compatAnswers : prev.compatAnswers,
          prompts: (Array.isArray(saved.prompts) && saved.prompts.length >= 3)
            ? saved.prompts.map(p => ({ question: p?.question || '', answer: p?.answer || '', photoUrl: p?.photoUrl || '' }))
            : prev.prompts
        }));
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const saveTimer = setTimeout(() => {
      if (formData.name || formData.gender || formData.branch) {
        api.put('/users/onboarding/save', { step: activeStepIdx + 1, data: formData }).catch(() => {});
      }
    }, 1000);
    return () => clearTimeout(saveTimer);
  }, [formData, activeStepIdx]);

  const updateField = (field, val) => setFormData(prev => ({ ...prev, [field]: val }));
  
  const toggleArrayItem = (field, item, max = null) => {
    setFormData(prev => {
      const arr = prev[field] || [];
      const isSelected = arr.includes(item);
      if (isSelected) return { ...prev, [field]: arr.filter(i => i !== item) };
      if (max && arr.length >= max) {
        triggerHaptic('heavy'); 
        return prev;
      }
      return { ...prev, [field]: [...arr, item] };
    });
    triggerHaptic('light');
  };

  const triggerUploadClick = (slot) => {
    if (uploadingSlot !== null) { triggerHaptic('heavy'); return; }
    triggerHaptic('light');
    setUploadingSlot(slot);
    fileInputRef.current?.click();

    const handleFocus = () => {
      window.removeEventListener('focus', handleFocus);
      setTimeout(() => {
        if (!fileInputRef.current?.files?.length) setUploadingSlot(null);
      }, 300);
    };
    window.addEventListener('focus', handleFocus);
  };

  const handlePhotoSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0 || uploadingSlot === null) { setUploadingSlot(null); return; }
    triggerHaptic('medium');
    try {
      const { url } = await api.upload(files[0]);
      const updated = [...formData.photos];
      updated[uploadingSlot] = url;
      updateField('photos', updated);
      triggerHaptic('success');
    } catch (err) { 
      toast.error('The emulsion was corrupted. Try a smaller image.'); 
      triggerHaptic('heavy');
    } finally { setUploadingSlot(null); e.target.value = ''; }
  };

  const handleRemovePhoto = (slot, e) => {
    e.stopPropagation();
    if (uploadingSlot !== null) return; 
    const updated = [...formData.photos];
    updated[slot] = '';
    updateField('photos', updated);
    triggerHaptic('light');
  };

  const dobParts = (formData.dob || '--').split('-');
  const dobY = dobParts[0] || ''; const dobM = dobParts[1] || ''; const dobD = dobParts[2] || '';
  
  const handleDobChange = (part, val) => {
    const num = val.replace(/\D/g, ''); 
    let y = dobY; let m = dobM; let d = dobD;
    if (part === 'd') { d = num.slice(0, 2); if (d.length === 2) { if (parseInt(d) > 31) d = '31'; if (parseInt(d) === 0) d = '01'; monthRef.current?.focus(); } }
    if (part === 'm') { m = num.slice(0, 2); if (m.length === 2) { if (parseInt(m) > 12) m = '12'; if (parseInt(m) === 0) m = '01'; yearRef.current?.focus(); } }
    if (part === 'y') { y = num.slice(0, 4); }
    updateField('dob', `${y}-${m}-${d}`);
  };

  const handleDobKeyDown = (part, e) => {
    if (e.key === 'Backspace') {
      if (part === 'y' && !dobY) monthRef.current?.focus();
      if (part === 'm' && !dobM) dayRef.current?.focus();
    }
  };
  
  const isDateComplete = dobY.length === 4 && dobM.length === 2 && dobD.length === 2;
  const age = isDateComplete ? (() => {
    const today = new Date(); const birth = new Date(`${dobY}-${dobM}-${dobD}`);
    let a = today.getFullYear() - birth.getFullYear();
    const mOffset = today.getMonth() - birth.getMonth();
    return (mOffset < 0 || (mOffset === 0 && today.getDate() < birth.getDate())) ? a - 1 : a;
  })() : null;

  const isVitalsComplete = !!formData.name.trim() && age >= 18 && age <= 40;
  const isCoordsComplete = !!formData.gender && !!formData.branch && !!formData.year && formData.interestedIn.length > 0;
  const isPortraitComplete = !!formData.photos[0] && !!formData.bio.trim() && formData.bio.length <= 160;
  const isWhispersComplete = formData.prompts.filter(p => p?.question?.trim() && p?.answer?.trim()).length >= 3;
  const isParamsComplete = formData.intent.length > 0;
  const isAlignComplete = formData.compatAnswers.length >= (config.compatQuestions?.length || 7);
  const isFullyComplete = isVitalsComplete && isCoordsComplete && isPortraitComplete && isWhispersComplete && isParamsComplete && isAlignComplete && uploadingSlot === null;

  const missingFields = [];
  if (!isVitalsComplete) missingFields.push('Vitals');
  if (!isCoordsComplete) missingFields.push('Coordinates');
  if (!isPortraitComplete) missingFields.push('About You');
  if (!isWhispersComplete) missingFields.push('Whispers');
  if (!isParamsComplete) missingFields.push('Parameters');
  if (!isAlignComplete) missingFields.push('Alignment');

  const completionStates = [true, isVitalsComplete, isCoordsComplete, isPortraitComplete, isWhispersComplete, isParamsComplete, isAlignComplete, isFullyComplete];

  const handleAffixSeal = async () => {
    if (!isFullyComplete || uploadingSlot !== null) { triggerHaptic('heavy'); return; }
    triggerHaptic('heavy');
    try {
      const finalPrompts = formData.prompts.map((p) => ({
        question: p?.question || '',
        answer: p?.answer || '',
      }));
      const res = await api.post('/users/setup', { ...formData, prompts: finalPrompts, age });
      await api.delete('/users/onboarding/clear').catch(() => {});

      const storedUser = JSON.parse(localStorage.getItem('matchalize_user') || '{}');
      const updatedUser = res?.user || res?.data?.user || res || {
        ...storedUser,
        isSetup: true,
        isOnboarded: true,
        profileCompleted: true,
        onboardingCompleted: true
      };
      
      localStorage.setItem('matchalize_user', JSON.stringify(updatedUser));
      onComplete();
    } catch (err) { toast.error(err.message || 'The seal failed to set. Please try again.'); }
  };

  const styles = {
    headerContainer: { display: 'flex', flexDirection: 'column', marginBottom: '24px' },
    icon: { marginBottom: '8px', color: theme.accent },
    header: { fontFamily: HEADER_FONT, fontSize: '32px', color: theme.ink, fontWeight: 900, margin: '0 0 6px 0', letterSpacing: '-0.02em', lineHeight: 1.1 },
    subtitle: { fontFamily: LABEL_FONT, fontSize: '15px', color: theme.inkMuted, margin: 0, lineHeight: 1.4, fontWeight: 500 },
    label: { display: 'block', fontSize: '11px', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', color: theme.accent, marginBottom: '8px', fontFamily: LABEL_FONT },
    input: { width: '100%', backgroundColor: 'transparent', border: 'none', borderBottom: `2px solid ${theme.ink}`, padding: '10px 4px', fontSize: '20px', color: theme.ink, fontFamily: TYPEWRITER_FONT, outline: 'none', borderRadius: 0 },
    textarea: { width: '100%', backgroundColor: 'transparent', border: `1px dashed ${theme.ink}`, borderRadius: '12px', padding: '14px', fontSize: '16px', color: theme.ink, fontFamily: TYPEWRITER_FONT, outline: 'none', resize: 'none', lineHeight: '1.5', wordBreak: 'break-word', whiteSpace: 'pre-wrap' },
    tag: (isActive) => ({
      padding: '14px 18px', minHeight: '48px', borderRadius: '12px',
      border: isActive ? `2px solid ${theme.crimson}` : `1px solid ${theme.borderDark}`,
      backgroundColor: isActive ? 'rgba(139, 26, 26, 0.08)' : theme.surface,
      color: isActive ? theme.crimson : theme.ink,
      fontFamily: TYPEWRITER_FONT, fontSize: '14px', fontWeight: isActive ? '700' : '500',
      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: isActive ? '0 4px 12px rgba(139, 26, 26, 0.15)' : '0 2px 4px rgba(0,0,0,0.02)',
      touchAction: 'manipulation'
    }),
  };

  const getIconForInterest = (interest) => {
    const key = Object.keys(config.interestIcons || {}).find(k => interest.toLowerCase().includes(k));
    if (key) return config.interestIcons[key];
    const fallbacks = config.interestIconFallbacks || ['star'];
    let hash = 0;
    for (let i = 0; i < interest.length; i++) hash = interest.charCodeAt(i) + ((hash << 5) - hash);
    return fallbacks[Math.abs(hash) % fallbacks.length];
  };

  // ✅ STEP 1 & 2 FIX: Standardized 180x240px Polaroid Dimensions
  const renderPhotoSlot = (slot, label, isStandard = false) => {
    const url = formData.photos[slot];
    const isDeveloping = uploadingSlot === slot;
    const dimensions = isStandard ? { width: '180px', height: '240px', flexShrink: 0 } : { aspectRatio: '3/4', width: '100%', maxWidth: '200px' };
    
    if (url && !isDeveloping) {
      return (
        <div className="tactile-btn" style={{ borderRadius: '12px', overflow: 'hidden', position: 'relative', cursor: 'pointer', border: `6px solid #fff`, boxShadow: `0 10px 24px ${theme.shadowWarm}`, ...dimensions }} onClick={() => triggerUploadClick(slot)}>
          <img src={url} alt={label} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div aria-hidden="true" style={{ position: 'absolute', top: '-6px', left: '50%', transform: 'translateX(-50%) rotate(-2deg)', width: '40px', height: '14px', backgroundColor: 'rgba(224, 216, 200, 0.95)', border: `1px solid rgba(139, 69, 19, 0.2)` }} />
          <button onClick={(e) => handleRemovePhoto(slot, e)} style={{ position: 'absolute', top: '8px', right: '8px', width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.95)', border: 'none', color: theme.crimson, fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>
      );
    }
    return (
      <button className="tactile-btn" onClick={() => triggerUploadClick(slot)} disabled={uploadingSlot !== null} style={{ ...dimensions, borderRadius: '12px', border: `1px dashed ${isDeveloping ? theme.crimson : theme.ink}`, backgroundColor: isDeveloping ? 'rgba(139, 26, 26, 0.05)' : 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: uploadingSlot !== null ? 'not-allowed' : 'pointer', fontFamily: TYPEWRITER_FONT, fontSize: '14px', color: isDeveloping ? theme.crimson : theme.ink, fontWeight: 600, opacity: (uploadingSlot !== null && !isDeveloping) ? 0.4 : 1 }}>
        {isDeveloping ? <span style={{ animation: 'pulse 1.5s infinite' }}>Developing...</span> : <><Camera size={28} style={{ opacity: 0.6 }} /> <span>{label}</span></>}
      </button>
    );
  };

  return (
    <div 
      ref={scrollRef} 
      style={{ 
        height: '100dvh', width: '100%', overflowY: isAnyModalOpen ? 'hidden' : 'auto', 
        overflowX: 'hidden', backgroundColor: theme.surfaceAlt, position: 'relative', 
        scrollSnapType: 'y mandatory', scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' 
      }}
    >
      {/* EXHAUSTIVE MOBILE HARDENING */}
      <style>{`
        ::-webkit-scrollbar { display: none; }
        * { 
          scrollbar-width: none; 
          -webkit-tap-highlight-color: transparent; 
          -webkit-touch-callout: none !important;
          -webkit-user-select: none;
          user-select: none;
          -webkit-user-drag: none !important;
        }
        input, textarea {
          -webkit-user-select: auto !important;
          user-select: auto !important;
        }
        img {
          pointer-events: none;
        }
        .tactile-btn { transition: transform 0.15s ease-out, box-shadow 0.15s ease-out; }
        @media (hover: hover) { .tactile-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 16px rgba(139, 26, 26, 0.12); } }
        .tactile-btn:active:not(:disabled) { transform: scale(0.96) !important; transition: transform 0.05s ease-out !important; }
        ::placeholder { color: ${theme.inkMuted}; opacity: 0.5; font-family: ${TYPEWRITER_FONT}; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>

      {/* Background Texture */}
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, backgroundImage: `url("${design?.texture?.grain || ''}")`, mixBlendMode: 'multiply', opacity: 0.6, pointerEvents: 'none', zIndex: 1 }} />
      
      {/* Interactive Scrubbing Side Index */}
      {activeStepIdx !== 7 && (
        <ChapterIndex containerRef={scrollRef} completionStates={completionStates} activeStepIdx={activeStepIdx} />
      )}
      <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handlePhotoSelect} />

      {/* SUBTLE LOG OUT BUTTON */}
      <button
        onClick={() => {
          if (window.confirm('Log out and return to the start screen? Incomplete progress will be saved in your draft.')) {
            triggerHaptic('medium');
            logout();
          }
        }}
        style={{
          position: 'fixed', top: 'max(20px, env(safe-area-inset-top))', right: '20px', zIndex: 100,
          background: 'rgba(253, 251, 247, 0.9)', backdropFilter: 'blur(6px)', border: `1px solid ${theme.borderDark}`,
          borderRadius: '20px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px',
          color: '#8c8275', fontFamily: LABEL_FONT, fontSize: '11px', fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
        }}
      >
        <LogOut size={13} color="#8c8275" /> Log Out
      </button>

      {/* PAGE 0: THE INTRO */}
      <SnapPage>
        <div style={styles.headerContainer}>
          <PenTool size={28} style={styles.icon} strokeWidth={1.5} />
          <h1 style={{ fontFamily: HEADER_FONT, fontSize: '38px', color: theme.ink, fontWeight: 900, margin: '0 0 10px 0', letterSpacing: '-0.02em', lineHeight: 1.1 }}>Volume II:<br/>The Dossier.</h1>
          <p style={styles.subtitle}>Transcribe your story below. Scroll to lock the next page.</p>
        </div>
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '8px', color: theme.crimson, fontFamily: LABEL_FONT, fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', animation: 'pulse 2s infinite' }}>
          <ChevronDown size={16} /> Swipe Up
        </div>
      </SnapPage>

      {/* PAGE 1: VITALS */}
      <SnapPage>
        <div style={styles.headerContainer}>
          <Fingerprint size={24} style={styles.icon} strokeWidth={1.5} />
          <h3 style={styles.header}>The Vitals.</h3>
          <p style={styles.subtitle}>What shall the Archives call you?</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div>
            <label style={styles.label}>Given Name</label>
            <input style={styles.input} type="text" value={formData.name} onChange={e => updateField('name', e.target.value)} placeholder="e.g. Arjun" spellCheck="false" autoComplete="off" />
          </div>
          <div>
            <label style={styles.label}>Date of Birth</label>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
              <div style={{ flex: 1 }}><input ref={dayRef} style={{...styles.input, textAlign: 'center'}} placeholder="DD" value={dobD} onChange={e => handleDobChange('d', e.target.value)} onKeyDown={e => handleDobKeyDown('d', e)} type="tel" /></div>
              <span style={{ fontSize: '20px', color: theme.borderDark, fontFamily: TYPEWRITER_FONT, paddingBottom: '6px' }}>/</span>
              <div style={{ flex: 1 }}><input ref={monthRef} style={{...styles.input, textAlign: 'center'}} placeholder="MM" value={dobM} onChange={e => handleDobChange('m', e.target.value)} onKeyDown={e => handleDobKeyDown('m', e)} type="tel" /></div>
              <span style={{ fontSize: '20px', color: theme.borderDark, fontFamily: TYPEWRITER_FONT, paddingBottom: '6px' }}>/</span>
              <div style={{ flex: 1.5 }}><input ref={yearRef} style={{...styles.input, textAlign: 'center'}} placeholder="YYYY" value={dobY} onChange={e => handleDobChange('y', e.target.value)} onKeyDown={e => handleDobKeyDown('y', e)} type="tel" /></div>
            </div>
          </div>
        </div>
      </SnapPage>

      {/* PAGE 2: COORDINATES & SHOW ME */}
      <SnapPage>
        <div style={styles.headerContainer}>
          <MapPin size={24} style={styles.icon} strokeWidth={1.5} />
          <h3 style={styles.header}>The Coordinates.</h3>
          <p style={styles.subtitle}>Define your identity and dating preferences.</p>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* My Identity */}
          <div style={{ backgroundColor: theme.surface, padding: '16px', borderRadius: '16px', border: `1px solid ${theme.border}` }}>
            <label style={styles.label}>My Identity</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {['Male', 'Female', 'Non-binary', 'Other'].map(g => (
                <button key={g} className="tactile-btn" onClick={() => updateField('gender', g)} style={styles.tag(formData.gender === g)}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Show Me */}
          <div style={{ backgroundColor: theme.surface, padding: '16px', borderRadius: '16px', border: `1px solid ${theme.border}` }}>
            <label style={styles.label}>Show Me (Interested In)</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {['Male', 'Female', 'Non-binary', 'Everyone'].map(pref => (
                <button key={pref} className="tactile-btn" onClick={() => toggleArrayItem('interestedIn', pref)} style={styles.tag(formData.interestedIn.includes(pref))}>
                  {pref}
                </button>
              ))}
            </div>
          </div>

          {/* Academic Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={styles.label}>Branch / Discipline</label>
              <button 
                type="button"
                className="tactile-btn"
                onClick={() => setShowBranchModal(true)}
                style={{ width: '100%', textAlign: 'left', padding: '12px 4px', border: 'none', borderBottom: `2px solid ${theme.ink}`, background: 'transparent', fontFamily: TYPEWRITER_FONT, fontSize: '18px', color: formData.branch ? theme.ink : theme.inkMuted, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>{formData.branch || "Select branch..."}</span>
                <ChevronDown size={18} color={theme.accent} />
              </button>
            </div>
            <div>
              <label style={styles.label}>Era (Graduation Year)</label>
              <button 
                type="button"
                className="tactile-btn"
                onClick={() => setShowEraModal(true)}
                style={{ width: '100%', textAlign: 'left', padding: '12px 4px', border: 'none', borderBottom: `2px solid ${theme.ink}`, background: 'transparent', fontFamily: TYPEWRITER_FONT, fontSize: '18px', color: formData.year ? theme.ink : theme.inkMuted, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>{formData.year || "Select era..."}</span>
                <ChevronDown size={18} color={theme.accent} />
              </button>
            </div>
            <div>
              <label style={styles.label}>Hostel / Quarters (Optional)</label>
              <input style={styles.input} type="text" value={formData.hostel} onChange={e => updateField('hostel', e.target.value)} placeholder="e.g. Hostel 4" spellCheck="false" autoComplete="off" />
            </div>
          </div>
        </div>
      </SnapPage>

      {/* ✅ STEP 1 FIX: TOP-TO-BOTTOM PORTRAIT STACK WITH 50% LARGER POLAROID */}
      <SnapPage>
        <div style={styles.headerContainer}>
          <Camera size={24} style={styles.icon} strokeWidth={1.5} />
          <h3 style={styles.header}>The Portrait.</h3>
          <p style={styles.subtitle}>Draft the foreword to your story.</p>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', margin: 'auto 0', width: '100%' }}>
          {renderPhotoSlot(0, 'Primary Photo', true)}
          <div style={{ width: '100%', position: 'relative' }}>
            <label style={styles.label}>About You (Max 160 Chars)</label>
            <textarea 
              style={{...styles.textarea, height: '120px', paddingBottom: '28px', wordBreak: 'break-word', whiteSpace: 'pre-wrap'}} 
              placeholder="What drives you? What are your passions?" 
              value={formData.bio} 
              maxLength={160}
              onChange={e => updateField('bio', e.target.value)} 
              spellCheck="false" 
            />
            <div style={{ position: 'absolute', bottom: '10px', right: '12px', fontSize: '11px', color: theme.inkMuted, fontFamily: TYPEWRITER_FONT }}>
              {formData.bio.length}/160
            </div>
          </div>
        </div>
      </SnapPage>

      {/* ✅ STEP 2 FIX: DYNAMIC WHISPER EXPANSION WITH EXACT POLAROID MATCHING */}
      <SnapPage>
        <div style={styles.headerContainer}>
          <MessageSquare size={24} style={styles.icon} strokeWidth={1.5} />
          <h3 style={styles.header}>The Whispers.</h3>
          <p style={styles.subtitle}>Swipe left to pair a thought with a memory.</p>
        </div>
        
        <div style={{ display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', gap: '16px', margin: '0 -24px 0 -44px', padding: '0 24px 10px 44px', touchAction: 'pan-x', overscrollBehavior: 'contain', alignItems: 'center' }}>
          {[0, 1, 2].map((slot) => {
            const prompt = formData.prompts[slot];
            const hasQuestion = prompt?.question;
            return (
              <div key={slot} style={{ minWidth: '85%', minHeight: hasQuestion ? '420px' : '160px', height: hasQuestion ? 'auto' : '160px', scrollSnapAlign: 'center', borderRadius: '16px', padding: '20px', border: `1px dashed ${theme.ink}`, position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: theme.paper, transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)' }}>
                <label style={styles.label}>Whisper #{slot + 1}</label>
                {hasQuestion ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                    <span style={{ fontFamily: TYPEWRITER_FONT, fontSize: '15px', fontWeight: '600', color: theme.ink, lineHeight: 1.4, wordBreak: 'break-word' }}>"{prompt.question}"</span>
                    <button className="tactile-btn" onClick={() => setPromptPickerSlot(slot)} style={{ background: 'none', border: 'none', color: theme.accent, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer', padding: 0, textAlign: 'left', fontFamily: LABEL_FONT }}>Change Whisper</button>
                    <textarea
                      placeholder="Your answer..."
                      value={prompt.answer || ''}
                      onChange={(e) => {
                        const updated = [...formData.prompts];
                        updated[slot] = { ...updated[slot], answer: e.target.value };
                        updateField('prompts', updated);
                      }}
                      style={{ ...styles.textarea, minHeight: '80px', fontSize: '14px', padding: '12px', flex: 1 }}
                    />
                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'center', paddingTop: '8px' }}>
                      {renderPhotoSlot(slot + 1, 'Attach Polaroid', true)}
                    </div>
                  </div>
                ) : (
                  <button className="tactile-btn" onClick={() => setPromptPickerSlot(slot)} style={{ background: 'none', border: `1px dashed ${theme.borderDark}`, borderRadius: '12px', padding: '20px', width: '100%', height: '100%', fontFamily: TYPEWRITER_FONT, fontSize: '14px', color: theme.ink, fontWeight: '700', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    + Select a Whisper
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
          <ChevronRight size={16} color={theme.inkMuted} style={{ animation: 'pulse 2s infinite' }} />
        </div>
      </SnapPage>

      {/* PAGE 5: PARAMETERS */}
      <SnapPage>
        <div style={styles.headerContainer}>
          <Sliders size={24} style={styles.icon} strokeWidth={1.5} />
          <h3 style={styles.header}>The Parameters.</h3>
          <p style={styles.subtitle}>What brings you to these pages?</p>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <label style={styles.label}>Seeking Intent</label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {['Dating', 'Friends', 'Study Buddy'].map(i => (
                <button className="tactile-btn" key={i} onClick={() => toggleArrayItem('intent', i)} style={styles.tag(formData.intent.includes(i))}>{i}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={styles.label}>Recorded Curiosities (Max 6)</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {config.interests?.map(i => (
                <button className="tactile-btn" key={i} onClick={() => toggleArrayItem('interests', i, 6)} style={{...styles.tag(formData.interests.includes(i)), padding: '10px 14px', minHeight: '42px', fontSize: '13px'}}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '6px' }}>{getIconForInterest(i)}</span>
                  {i}
                </button>
              ))}
            </div>
          </div>
        </div>
      </SnapPage>

      {/* ✅ STEP 3 FIX: ALIGNMENT DATA WIPE & COMPACT SEALED CARD */}
      <SnapPage>
        <div style={styles.headerContainer}>
          <Layers size={24} style={styles.icon} strokeWidth={1.5} />
          <h3 style={styles.header}>The Alignment.</h3>
          <p style={styles.subtitle}>Swipe left to seal your answers.</p>
        </div>
        
        <div style={{ position: 'relative', width: '100%', flex: 1, minHeight: '340px', display: 'flex', flexDirection: 'column' }}>
          {(!config.compatQuestions || config.compatQuestions.length === 0) ? (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: `1px dashed ${theme.ink}`, borderRadius: '16px' }}>
               <p style={{ fontFamily: TYPEWRITER_FONT, fontSize: '16px', color: theme.inkMuted }}>Consulting Archives...</p>
            </div>
          ) : (isAlignComplete && !inquiriesReopened) ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              style={{ 
                margin: 'auto 0', padding: '36px 24px', display: 'flex', flexDirection: 'column', 
                alignItems: 'center', justifyContent: 'center', border: `1px dashed ${theme.ink}`, 
                borderRadius: '16px', backgroundColor: theme.surface, boxShadow: `0 8px 24px ${theme.shadowWarm}` 
              }}
            >
              <Lock size={36} color={theme.ink} style={{ marginBottom: '12px' }} />
              <h4 style={{ fontFamily: HEADER_FONT, fontSize: '24px', color: theme.ink, margin: 0, fontWeight: 800 }}>Inquiries Sealed</h4>
              <p style={{ fontFamily: LABEL_FONT, fontSize: '13px', color: theme.inkMuted, marginTop: '6px', textAlign: 'center' }}>Your alignment matrix has been recorded.</p>
              <button 
                className="tactile-btn" 
                onClick={() => { 
                  triggerHaptic('medium'); 
                  updateField('compatAnswers', []); // Wipe previous responses cleanly
                  setInquiriesReopened(true); 
                }} 
                style={{ marginTop: '20px', padding: '10px 18px', backgroundColor: theme.surfaceAlt, border: `1px solid ${theme.borderDark}`, borderRadius: '20px', color: theme.accent, fontFamily: LABEL_FONT, fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
              >
                <RotateCcw size={14} /> Wipe & Re-open Inquiries
              </button>
            </motion.div>
          ) : (
            <div className="hide-scroll" style={{ display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', gap: '16px', margin: '0 -24px 0 -44px', padding: '0 24px 10px 44px', touchAction: 'pan-x', overscrollBehavior: 'contain', height: '100%' }}>
              {config.compatQuestions.map((q, idx) => (
                <div key={q.id} ref={el => inquiryRefs.current[idx] = el} style={{ minWidth: '85%', scrollSnapAlign: 'center', padding: '24px', border: `1px dashed ${theme.ink}`, borderRadius: '16px', display: 'flex', flexDirection: 'column', backgroundColor: theme.paper }}>
                  <p style={{ fontFamily: LABEL_FONT, fontSize: '11px', fontWeight: 800, color: theme.accent, textTransform: 'uppercase', letterSpacing: '1.5px', margin: '0 0 16px 0' }}>Inquiry 0{idx + 1} of {config.compatQuestions.length}</p>
                  <p style={{ fontFamily: TYPEWRITER_FONT, fontSize: '20px', color: theme.ink, margin: '0 0 24px 0', fontWeight: '700', lineHeight: 1.3 }}>{q.question}</p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'auto' }}>
                    {q.options.map(opt => {
                      const selected = formData.compatAnswers.find(a => a.question === q.id)?.answer;
                      return (
                        <button 
                          className="tactile-btn" key={opt.key} 
                          disabled={cardLock}
                          onClick={() => { 
                            if (cardLock) return;
                            setCardLock(true);
                            triggerHaptic('light'); 
                            const ans = [...formData.compatAnswers.filter(a => a.question !== q.id), { question: q.id, answer: opt.key }];
                            updateField('compatAnswers', ans);
                            
                            setTimeout(() => {
                              setCardLock(false);
                              if (idx < config.compatQuestions.length - 1) {
                                inquiryRefs.current[idx + 1]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                              } else {
                                setInquiriesReopened(false);
                              }
                            }, 300);
                          }} 
                          style={{ padding: '16px', fontSize: '16px', fontFamily: TYPEWRITER_FONT, fontWeight: 600, backgroundColor: 'transparent', border: selected === opt.key ? `2px solid ${theme.crimson}` : `1px solid ${theme.borderDark}`, color: selected === opt.key ? theme.crimson : theme.ink, borderRadius: '12px', cursor: cardLock ? 'not-allowed' : 'pointer', textAlign: 'left', opacity: (cardLock && selected !== opt.key) ? 0.5 : 1 }}
                        >
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SnapPage>

      {/* ✅ STEP 4 FIX: SYMMETRICAL PADDING, ATTACHED CURLY QUOTES & SILKY SCROLLING */}
      <SnapPage equalPad={true}>
        <div style={{ ...styles.headerContainer, marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserCheck size={28} style={{ color: isFullyComplete ? theme.success : theme.inkMuted }} strokeWidth={1.5} />
              <h3 style={{ ...styles.header, fontSize: '28px', margin: 0 }}>Volume II:<br/>The Review.</h3>
            </div>
            <button
              onClick={() => {
                triggerHaptic('medium');
                const pages = scrollRef.current?.querySelectorAll('[data-snap-page]');
                if (pages?.[1]) pages[1].scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              style={{
                background: 'rgba(139, 69, 19, 0.1)', border: `1px solid ${theme.borderDark}`,
                borderRadius: '16px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px',
                color: theme.accent, fontFamily: LABEL_FONT, fontSize: '12px', fontWeight: 800, cursor: 'pointer'
              }}
            >
              <Edit3 size={14} /> Edit Folio
            </button>
          </div>
          <p style={{ ...styles.subtitle, marginTop: '8px' }}>Inspect your public folio before committing it to campus view.</p>
        </div>
        
        {/* MUSEUM-GRADE PROFILE PREVIEW CARD */}
        <div style={{ backgroundColor: theme.surface, border: `1px solid ${theme.borderDark}`, boxShadow: `0 16px 40px ${theme.shadowWarm}`, borderRadius: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          
          {/* Hero Image Banner */}
          <div style={{ width: '100%', aspectRatio: '4/5', position: 'relative', backgroundColor: theme.surfaceAlt }}>
            {formData.photos[0] ? (
              <img src={formData.photos[0]} alt="Hero Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.inkMuted, fontFamily: TYPEWRITER_FONT }}>No Portrait Attached</div>
            )}
            <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,12,10,0.9) 0%, transparent 40%)' }} />
            
            <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', zIndex: 2 }}>
              <h3 style={{ fontFamily: HEADER_FONT, fontSize: '30px', color: '#fff', margin: 0, fontWeight: 800, textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}>
                {formData.name || 'Anonymous'}, {age || '--'}
              </h3>
              <p style={{ fontFamily: LABEL_FONT, fontSize: '12px', color: 'rgba(255,255,255,0.9)', margin: '4px 0 0 0', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
                {formData.branch || 'Discipline'} • {formData.year || 'Era'}
              </p>
            </div>
          </div>
          
          <div aria-hidden="true" style={{ width: '100%', height: '20px', backgroundColor: theme.paper, clipPath: TORN_EDGE_CLIP, marginTop: '-12px', position: 'relative', zIndex: 3, filter: 'drop-shadow(0 -2px 2px rgba(0,0,0,0.1))' }} />

          <div style={{ padding: '16px 20px 24px 20px', display: 'flex', flexDirection: 'column', gap: '20px', backgroundColor: theme.paper }}>
            
            {/* Editorial Vitals Bento Grid */}
            <div style={{ backgroundColor: theme.surfaceAlt, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', backgroundColor: theme.surface, borderRadius: '8px', border: `1px solid ${theme.border}` }}><MapPin size={16} color={theme.accent} /> <span style={{ fontFamily: LABEL_FONT, fontSize: '13px', fontWeight: 600, color: theme.ink }}>{formData.hostel || 'Campus'}</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', backgroundColor: theme.surface, borderRadius: '8px', border: `1px solid ${theme.border}` }}><Calendar size={16} color={theme.accent} /> <span style={{ fontFamily: LABEL_FONT, fontSize: '13px', fontWeight: 600, color: theme.ink }}>{formData.year || 'Era'}</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', backgroundColor: theme.surface, borderRadius: '8px', border: `1px solid ${theme.border}` }}><Award size={16} color={theme.accent} /> <span style={{ fontFamily: LABEL_FONT, fontSize: '13px', fontWeight: 600, color: theme.ink }}>{formData.branch || 'Discipline'}</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', backgroundColor: theme.surface, borderRadius: '8px', border: `1px solid ${theme.border}` }}><Sparkle size={16} color={theme.accent} /> <span style={{ fontFamily: LABEL_FONT, fontSize: '13px', fontWeight: 600, color: theme.ink }}>{formData.pronouns || 'Identity'}</span></div>
              </div>

              {formData.bio && (
                <div style={{ borderTop: `1px solid ${theme.borderDark}`, paddingTop: '16px' }}>
                  <span style={{ display: 'block', fontSize: '10px', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: theme.accent, marginBottom: '6px', fontFamily: LABEL_FONT }}>Foreword</span>
                  {/* ✅ CURLY QUOTE FIX: &ldquo; and &rdquo; hug the trimmed string tightly */}
                  <p style={{ fontFamily: TYPEWRITER_FONT, fontSize: '14px', color: theme.ink, margin: 0, lineHeight: 1.5, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                    &ldquo;{formData.bio?.trim() || 'A mysterious figure walks the halls...'}&rdquo;
                  </p>
                </div>
              )}
            </div>

            {/* Seeking Parameters & Curiosities Bento Box */}
            <div style={{ backgroundColor: theme.surfaceAlt, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '16px' }}>
              <span style={{ display: 'block', fontSize: '10px', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: theme.accent, marginBottom: '12px', fontFamily: LABEL_FONT }}>Seeking Parameters</span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: formData.interests.length > 0 ? '16px' : '0' }}>
                {(formData.intent.length > 0 ? formData.intent : ['Connection']).map((item, i) => (
                  <span key={i} style={{ padding: '6px 12px', border: `1.5px solid ${theme.crimson}`, borderRadius: '8px', backgroundColor: 'rgba(139,26,26,0.05)', color: theme.crimson, fontFamily: LABEL_FONT, fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>{item}</span>
                ))}
              </div>
              {formData.interests.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', borderTop: `1px dashed ${theme.borderDark}`, paddingTop: '16px' }}>
                  {formData.interests.map((interest, i) => (
                    <span key={i} style={{ padding: '6px 10px', border: `1px solid ${theme.border}`, borderRadius: '8px', backgroundColor: theme.surface, color: theme.ink, fontFamily: TYPEWRITER_FONT, fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '6px', color: theme.inkMuted }}>{getIconForInterest(interest)}</span>
                      {interest}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Bento Grid Artifacts (Taller 1.48 Aspect Ratio for Final Photo) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 12px', alignItems: 'center' }}>
              <PreviewIndexCard tilt={TILT.prompt_0} tape="top-right">
                {formData.prompts?.[0]?.question || "A shower thought I recently had..."}
              </PreviewIndexCard>

              {formData.photos?.[1] ? (
                <PreviewMountedPhoto src={formData.photos[1]} alt="Artifact 2" tilt={TILT.photo_1} />
              ) : <div />}

              {formData.photos?.[2] ? (
                <PreviewMountedPhoto src={formData.photos[2]} alt="Artifact 3" tilt={TILT.photo_2} />
              ) : <div />}

              <PreviewIndexCard tilt={TILT.prompt_1} tape="top-left">
                {formData.prompts?.[1]?.question || "My ideal weekend looks like..."}
              </PreviewIndexCard>

              {formData.prompts?.[2]?.question && (
                <div style={{ gridColumn: 'span 2' }}>
                  <PreviewIndexCard tilt={TILT.prompt_2} tape="center">
                    {formData.prompts[2].question}
                  </PreviewIndexCard>
                </div>
              )}

              {formData.photos?.[3] && (
                <div style={{ gridColumn: 'span 2' }}>
                  <PreviewMountedPhoto src={formData.photos[3]} alt="Artifact 4" tilt={TILT.photo_3} aspect="1.48" />
                </div>
              )}
            </div>

          </div>
        </div>

        <div style={{ marginTop: '20px', paddingTop: '10px', paddingBottom: '60px' }}>
          {!isFullyComplete && (
            <div style={{ marginBottom: '16px', padding: '14px', border: `1px dashed ${theme.crimson}`, borderRadius: '12px', textAlign: 'center' }}>
              <p style={{ color: theme.crimson, fontSize: '12px', fontFamily: LABEL_FONT, fontWeight: 800, margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Ledger Incomplete</p>
              <p style={{ color: theme.ink, fontSize: '14px', fontFamily: TYPEWRITER_FONT, margin: 0, fontWeight: 600 }}>The Archivist requires: {missingFields.join(', ')}</p>
            </div>
          )}

          <button 
            onClick={handleAffixSeal}
            disabled={!isFullyComplete || uploadingSlot !== null}
            className="tactile-btn"
            style={{
              width: '100%', padding: '22px',
              backgroundColor: isFullyComplete ? theme.crimson : 'transparent',
              color: isFullyComplete ? '#fff' : theme.inkMuted,
              border: isFullyComplete ? 'none' : `1px dashed ${theme.inkMuted}`,
              borderRadius: '16px',
              fontFamily: LABEL_FONT, fontSize: '16px', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase',
              cursor: (isFullyComplete && uploadingSlot === null) ? 'pointer' : 'not-allowed',
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              opacity: uploadingSlot !== null ? 0.5 : 1,
              boxShadow: isFullyComplete ? '0 8px 24px rgba(139, 26, 26, 0.3)' : 'none'
            }}
          >
            {uploadingSlot !== null ? 'Developing Photos...' : isFullyComplete ? 'Publish Profile & Enter' : 'Complete to Publish'}
          </button>
        </div>
      </SnapPage>

      {/* BRANCH PICKER MODAL */}
      <AnimatePresence>
        {showBranchModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowBranchModal(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(20,15,10,0.65)', backdropFilter: 'blur(4px)', zIndex: 100 }} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '70dvh', backgroundColor: theme.surfaceAlt, backgroundImage: `url("${design?.texture?.grain || ''}")`, borderTopLeftRadius: '24px', borderTopRightRadius: '24px', zIndex: 101, display: 'flex', flexDirection: 'column', boxShadow: '0 -20px 40px rgba(0,0,0,0.3)', overscrollBehavior: 'contain' }}>
              <div style={{ padding: '20px 24px', borderBottom: `1px solid ${theme.borderDark}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: HEADER_FONT, fontSize: '20px', fontWeight: '700', color: theme.ink }}>Select Branch</span>
                <button className="tactile-btn" onClick={() => setShowBranchModal(false)} style={{ background: 'transparent', border: `1px solid ${theme.border}`, borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} color={theme.ink} /></button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {config.branches?.map(b => (
                  <button key={b} className="tactile-btn" onClick={() => { updateField('branch', b); setShowBranchModal(false); }} style={{ padding: '14px 18px', borderRadius: '10px', border: formData.branch === b ? `2px solid ${theme.crimson}` : `1px solid ${theme.borderDark}`, backgroundColor: formData.branch === b ? 'rgba(139, 26, 26, 0.08)' : theme.surface, color: formData.branch === b ? theme.crimson : theme.ink, fontFamily: TYPEWRITER_FONT, fontSize: '15px', fontWeight: formData.branch === b ? '700' : '500', cursor: 'pointer', textAlign: 'left' }}>
                    {b}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ERA PICKER MODAL */}
      <AnimatePresence>
        {showEraModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowEraModal(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(20,15,10,0.65)', backdropFilter: 'blur(4px)', zIndex: 100 }} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '60dvh', backgroundColor: theme.surfaceAlt, backgroundImage: `url("${design?.texture?.grain || ''}")`, borderTopLeftRadius: '24px', borderTopRightRadius: '24px', zIndex: 101, display: 'flex', flexDirection: 'column', boxShadow: '0 -20px 40px rgba(0,0,0,0.3)', overscrollBehavior: 'contain' }}>
              <div style={{ padding: '20px 24px', borderBottom: `1px solid ${theme.borderDark}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: HEADER_FONT, fontSize: '20px', fontWeight: '700', color: theme.ink }}>Select Era</span>
                <button className="tactile-btn" onClick={() => setShowEraModal(false)} style={{ background: 'transparent', border: `1px solid ${theme.border}`, borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} color={theme.ink} /></button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {config.years?.map(y => (
                  <button key={y} className="tactile-btn" onClick={() => { updateField('year', y); setShowEraModal(false); }} style={{ padding: '14px 18px', borderRadius: '10px', border: formData.year === y ? `2px solid ${theme.crimson}` : `1px solid ${theme.borderDark}`, backgroundColor: formData.year === y ? 'rgba(139, 26, 26, 0.08)' : theme.surface, color: formData.year === y ? theme.crimson : theme.ink, fontFamily: TYPEWRITER_FONT, fontSize: '15px', fontWeight: formData.year === y ? '700' : '500', cursor: 'pointer', textAlign: 'left' }}>
                    {y}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* WHISPER PICKER MODAL */}
      <AnimatePresence>
        {promptPickerSlot !== null && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPromptPickerSlot(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(20,15,10,0.65)', backdropFilter: 'blur(4px)', zIndex: 100 }} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '85dvh', backgroundColor: theme.surfaceAlt, backgroundImage: `url("${design?.texture?.grain || ''}")`, borderTopLeftRadius: '24px', borderTopRightRadius: '24px', zIndex: 101, display: 'flex', flexDirection: 'column', boxShadow: '0 -20px 40px rgba(0,0,0,0.3)', overscrollBehavior: 'contain' }}>
              <div style={{ padding: '20px 24px', borderBottom: `1px solid ${theme.borderDark}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: HEADER_FONT, fontSize: '20px', fontWeight: '700', color: theme.ink }}>Archive of Whispers</span>
                <button className="tactile-btn" onClick={() => setPromptPickerSlot(null)} style={{ background: 'transparent', border: `1px solid ${theme.border}`, borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} color={theme.ink} /></button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', overscrollBehavior: 'contain' }}>
                <div style={{ padding: '16px', borderRadius: '14px', border: `1px dashed ${theme.ink}`, marginBottom: '20px' }}>
                  <label style={styles.label}>Draft Your Own</label>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <input style={{...styles.input, fontSize: '15px', padding: '8px 4px'}} placeholder="Type your own whisper..." value={customPromptText} onChange={e => setCustomPromptText(e.target.value)} spellCheck="false" autoComplete="off" />
                    <button className="tactile-btn" onClick={() => { if (customPromptText.trim()) { const updated = [...formData.prompts]; updated[promptPickerSlot] = { ...updated[promptPickerSlot], question: customPromptText.trim() }; updateField('prompts', updated); setCustomPromptText(''); setPromptPickerSlot(null); }}} disabled={!customPromptText.trim()} style={{ padding: '10px 18px', backgroundColor: customPromptText.trim() ? theme.crimson : 'transparent', color: customPromptText.trim() ? '#fff' : theme.ink, border: customPromptText.trim() ? 'none' : `1px solid ${theme.ink}`, borderRadius: '8px', fontFamily: LABEL_FONT, fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', cursor: 'pointer' }}>Affix</button>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {config.prompts?.map((p, i) => {
                    const promptText = typeof p === 'string' ? p : p.question;
                    if (!promptText) return null;
                    const alreadyUsed = formData.prompts.some((pr, si) => si !== promptPickerSlot && pr?.question === promptText);
                    
                    return (
                      <button key={i} className={alreadyUsed ? "" : "tactile-btn"} disabled={alreadyUsed} onClick={() => { const updated = [...formData.prompts]; updated[promptPickerSlot] = { ...updated[promptPickerSlot], question: promptText }; updateField('prompts', updated); setPromptPickerSlot(null); }}
                      style={{ width: '100%', textAlign: 'left', padding: '14px 18px', borderRadius: '10px', border: `1px solid ${theme.borderDark}`, backgroundColor: 'transparent', cursor: alreadyUsed ? 'not-allowed' : 'pointer', fontFamily: TYPEWRITER_FONT, fontSize: '15px', color: alreadyUsed ? theme.borderDark : theme.ink, opacity: alreadyUsed ? 0.5 : 1 }}>
                        "{promptText}"
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Onboarding;
```

### ./client/src/pages/Profile.jsx

```
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../utils/api';
import { useQueryClient } from '@tanstack/react-query';
import { useAppConfig } from '../utils/AppConfigContext';
import { triggerHaptic } from '../utils/haptics';
import { useAuth } from '../utils/AuthContext';
import ShadowbanBanner from '../components/ShadowbanBanner';
import LearnMoreSheet from '../components/LearnMoreSheet';
import { theme as design } from '../utils/theme';
import { toast } from '../utils/toast';
import { Settings, Sparkle, MapPin, X, Pencil, Camera, Plus, CheckCircle2 } from 'lucide-react';

const isTouchDevice = typeof window !== 'undefined' && 'ontouchstart' in window;

/* ==================================================================
   MUSEUM-GRADE ARCHIVAL SYSTEM & CINEMATIC LIGHTING ENGINE
================================================================== */
const theme = {
  color: {
    paper: '#fdfbf7',
    surface: '#ffffff',
    surfaceAlt: '#f4f1ea',
    border: '#e0d8c8',
    borderDark: '#d4c5a9',
    ink: '#1a1a1a',
    inkMuted: '#8c8275',
    inkSoft: '#4a4a4a',
    accent: '#8b4513',
    accentSoft: 'rgba(139, 69, 19, 0.18)',
    accentFaint: 'rgba(139, 69, 19, 0.04)',
    crimson: '#8b1a1a',
    shadowWarm: 'rgba(139, 69, 19, 0.12)',
    shadowDark: 'rgba(26, 26, 26, 0.20)',
  },
  font: {
    display: "'Playfair Display', Georgia, serif",
    body: "'Inter', -apple-system, sans-serif",
  },
};

function buildTornEdge(teeth = 64) {
  const heights = [0, 18, 4, 22, 8, 16, 2, 24, 6, 14, 10, 20];
  const pts = ['0% 100%'];
  for (let i = 0; i <= teeth; i++) {
    const x = ((i / teeth) * 100).toFixed(2);
    const y = heights[i % heights.length];
    pts.push(`${x}% ${y}%`);
  }
  pts.push('100% 100%');
  return `polygon(${pts.join(',')})`;
}
const TORN_EDGE_CLIP = buildTornEdge();

const TILT = { prompt_0: '1.4deg', photo_1: '-2.2deg', photo_2: '1.8deg', prompt_1: '-1.1deg', prompt_2: '0.5deg', photo_3: '-0.7deg' };

/* ==================================================================
   MAIN PROFILE COMPONENT
================================================================== */
const Profile = ({ onSignOut }) => {
  const config = useAppConfig();
  const queryClient = useQueryClient();
  const cardRootRef = useRef(null);
  const fileInputRef = useRef(null);
  const lampRaf = useRef(null);

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  const [isGhostMode, setIsGhostMode] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [drawerConfig, setDrawerConfig] = useState(null); // { type, slot }
  const [photoSlot, setPhotoSlot] = useState(null);

  const [blockedOpen, setBlockedOpen] = useState(false);
  const [blockedList, setBlockedList] = useState([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);
  const { user: authUser } = useAuth();
  const [showLearnMore, setShowLearnMore] = useState(false);
  const contentFreezeMessage = 'This feature is temporarily unavailable while your account is under review.';

  const contentFrozen = userData?.contentFrozen ?? authUser?.contentFrozen ?? false;
  const shadowbanScore = userData?.shadowbanScore ?? authUser?.shadowbanScore ?? 0;

  const openEditDrawer = (config) => {
    if (contentFrozen) {
      toast.error(contentFreezeMessage);
      return;
    }
    setDrawerConfig(config);
  };

  const openPhotoSlot = (slot) => {
    if (contentFrozen) {
      toast.error(contentFreezeMessage);
      return;
    }
    setPhotoSlot(slot);
    fileInputRef.current?.click();
  };

  const fetchBlockedUsers = async () => {
    setLoadingBlocked(true);
    try {
      const res = await api.get('/report/list');
      setBlockedList(res.blocked || []);
    } catch (err) {
      toast.error('Failed to retrieve blocked subjects.');
    } finally {
      setLoadingBlocked(false);
    }
  };

  const handleUnblock = async (userId, userName) => {
    triggerHaptic('medium');
    try {
      await api.delete(`/report/block/${userId}`);
      setBlockedList(prev => prev.filter(u => u._id !== userId));
      toast.success(`Unblocked ${userName}. They can now appear in your deck.`);
    } catch (err) {
      toast.error('Failed to unblock subject.');
    }
  };

  // Profile Completion Gauge State
  const [displayScore, setDisplayScore] = useState(0);
  const [sweeping, setSweeping] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await api.get('/users/profile');
        if (!data.photos) data.photos = [];
        if (!data.prompts) data.prompts = [{}, {}, {}];
        if (!data.interests) data.interests = [];
        if (!data.intent) data.intent = [];
        setUserData(data);
        setIsGhostMode(data.isGhost || false);
      } catch (err) {
        console.error('Failed to fetch profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const targetScore = useMemo(() => {
    if (!userData) return 0;
    let score = 30; // Base creation
    if (userData.name && userData.age) score += 10;
    if (userData.bio) score += 10;
    if (userData.gender && userData.hostel) score += 10;
    if (userData.photos.filter(Boolean).length >= 2) score += 10;
    if (userData.photos.filter(Boolean).length >= 4) score += 10;
    if (userData.prompts.filter(p => p?.question).length >= 1) score += 10;
    if (userData.prompts.filter(p => p?.question).length >= 3) score += 5;
    if (userData.interests.length > 0) score += 5;
    return Math.min(100, score);
  }, [userData]);

  useEffect(() => {
    if (!userData) return;
    let startTimestamp = null;
    let animationFrameId = null;
    const duration = 1600;
    const startScore = displayScore;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 4); 
      const current = Math.round(startScore + (targetScore - startScore) * easeProgress);
      setDisplayScore(current);
      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      }
    };

    const timer = setTimeout(() => {
      setSweeping(true);
      animationFrameId = window.requestAnimationFrame(step);
    }, 300);

    return () => {
      clearTimeout(timer);
      if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
    };
  }, [targetScore, userData]);

  // RAF-Throttled Lighting Engine (Zero-Lag)
  const handleLampMove = useCallback((e) => {
    if (!cardRootRef.current || isTouchDevice) return;
    const { clientX, clientY } = e;
    if (lampRaf.current) return;
    
    lampRaf.current = requestAnimationFrame(() => {
      lampRaf.current = null;
      if (!cardRootRef.current) return;
      const rect = cardRootRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      cardRootRef.current.style.setProperty('--lamp-x', ((x / rect.width) * 2 - 1).toFixed(3));
      cardRootRef.current.style.setProperty('--lamp-y', ((y / rect.height) * 2 - 1).toFixed(3));
      cardRootRef.current.style.setProperty('--lamp-pct-x', `${((x / rect.width) * 100).toFixed(1)}%`);
      cardRootRef.current.style.setProperty('--lamp-pct-y', `${((y / rect.height) * 100).toFixed(1)}%`);
    });
  }, []);

  useEffect(() => () => {
    if (lampRaf.current) cancelAnimationFrame(lampRaf.current);
  }, []);

  const updateProfile = async (updates) => {
    if (contentFrozen) {
      toast.error(contentFreezeMessage);
      return;
    }

    try {
      const updated = await api.put('/users/profile', updates);
      setUserData(prev => ({ ...prev, ...updated }));
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      triggerHaptic('light');
    } catch (err) {
      toast.error('Failed to affix updates to the registry. Please try again.');
    }
  };

  const handlePhotoSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0 || photoSlot === null) return;
    setUploading(true);
    triggerHaptic('medium');
    try {
      const { url } = await api.upload(files[0]);
      const updatedPhotos = [...(userData.photos || [])];
      updatedPhotos[photoSlot] = url;
      await updateProfile({ photos: updatedPhotos });
    } catch (err) {
      toast.error('Artifact preservation failed. The image may be too large.');
    } finally {
      setUploading(false);
      setPhotoSlot(null);
      e.target.value = '';
    }
  };

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.color.paper }}>
        <p style={{ fontFamily: theme.font.display, color: theme.color.inkMuted, fontStyle: 'italic', fontSize: '16px' }}>Retrieving your folio...</p>
      </div>
    );
  }

  const RING_R = 34;
  const CIRCUMFERENCE = 2 * Math.PI * RING_R;
  const ringOffset = CIRCUMFERENCE - (displayScore / 100) * CIRCUMFERENCE;

  return (
    <div
      ref={cardRootRef}
      onMouseMove={handleLampMove}
      className="pc-root"
      style={{
        '--lamp-x': 0, '--lamp-y': 0, '--lamp-pct-x': '50%', '--lamp-pct-y': '30%',
        flex: 1, display: 'flex', flexDirection: 'column', position: 'relative',
        backgroundColor: theme.color.paper, overflow: 'hidden',
        userSelect: 'none', WebkitUserSelect: 'none', contain: 'paint',
      }}
    >
      <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handlePhotoSelect} />

      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at var(--lamp-pct-x) var(--lamp-pct-y), rgba(255,255,255,0.15) 0%, transparent 40%)', mixBlendMode: 'overlay', pointerEvents: 'none', zIndex: 20 }} />
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: `url("${design?.texture?.grain || ''}")`, mixBlendMode: 'multiply', pointerEvents: 'none', zIndex: 15 }} />

      {/* Floating Settings Button */}
      <button 
        onClick={() => { triggerHaptic('medium'); setSettingsOpen(true); }}
        aria-label="Open settings"
        className="tactile-btn"
        style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 30, background: 'rgba(253, 251, 247, 0.85)', backdropFilter: 'blur(4px)', border: `1px solid ${theme.color.borderDark}`, borderRadius: design?.radius?.md || '8px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
      >
        <Settings size={18} color={theme.color.ink} />
      </button>

      {/* MAIN SCROLL AREA */}
      <div className="pc-scroll" style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '120px', position: 'relative', zIndex: 1 }}>
        <ShadowbanBanner score={shadowbanScore} onLearnMore={() => setShowLearnMore(true)} />
        {showLearnMore && <LearnMoreSheet onClose={() => setShowLearnMore(false)} />}

        {/* 1. HERO PORTRAIT */}
        <div style={{ width: '100%', position: 'relative' }}>
          <div style={{ width: '100%', aspectRatio: '4/5.8', position: 'relative', backgroundColor: theme.color.surfaceAlt, overflow: 'hidden' }}>
            <img src={userData.photos?.[0] || 'https://via.placeholder.com/600x800/e8e4d9/1a1a1a?text=No+Portrait'} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0, transition: 'opacity 0.4s ease-out' }} alt="Hero" onLoad={(e) => { e.currentTarget.style.opacity = 1; }} onError={(e) => { e.currentTarget.style.opacity = 1; }} />
            <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at var(--lamp-pct-x) var(--lamp-pct-y), rgba(255,255,255,0.2) 0%, transparent 50%), linear-gradient(to top, rgba(15,12,10,0.95) 0%, rgba(15,12,10,0.5) 40%, rgba(0,0,0,0.05) 75%, transparent 100%)', pointerEvents: 'none' }} />
            
            <div style={{ position: 'absolute', bottom: '32px', left: '24px', right: '24px', zIndex: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <div style={{ padding: '4px 12px', background: 'rgba(253,251,247,0.2)', backdropFilter: 'blur(12px)', borderRadius: design?.radius?.sm || '4px', border: '1px solid rgba(255,255,255,0.35)' }}>
                  <span style={{ fontFamily: theme.font.body, fontSize: '10px', color: '#fff', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 700 }}>Subject Identity</span>
                </div>
                <button onClick={() => openEditDrawer({ type: 'identity' })} className="tactile-btn" style={styles.editBtn}><Pencil size={12} color="currentColor" style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Edit</button>
              </div>
              <h2 style={{ fontFamily: theme.font.display, fontSize: 'clamp(30px, 7vw, 42px)', color: '#fff', margin: 0, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.05, textShadow: '0 4px 20px rgba(0,0,0,0.6)' }}>
                {userData.name || 'Anonymous'}, {userData.age || '—'}
              </h2>
              <p style={{ fontFamily: theme.font.body, fontSize: '11px', color: 'rgba(255,255,255,0.92)', margin: '8px 0 0 0', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                {userData.branch || 'General'} <Sparkle size={12} color="#e6b17a" style={{ margin: '0 8px', flexShrink: 0 }} /> Class of {userData.year || '20XX'}
              </p>
            </div>
            
            <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 5 }}>
              <button onClick={() => openPhotoSlot(0)} className="tactile-btn" style={styles.editBtnAlt}>
                {uploading && photoSlot === 0 ? 'Developing...' : <><Pencil size={12} color="currentColor" style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Edit Portrait</>}
              </button>
            </div>
          </div>
          <div aria-hidden="true" style={{ width: '100%', height: '24px', backgroundColor: theme.color.paper, clipPath: TORN_EDGE_CLIP, marginTop: '-14px', position: 'relative', zIndex: 3, filter: 'drop-shadow(0 -3px 3px rgba(0,0,0,0.12))' }} />
        </div>

        <div style={{ padding: '24px 24px 0 24px' }}>
          
          {/* 2. VITALS & BIO */}
          <SectionLabel onEdit={() => openEditDrawer({ type: 'vitals' })}>Vitals</SectionLabel>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {userData.gender && <span className="pc-pill" style={styles.vitalStyle}>{userData.gender}</span>}
            {userData.pronouns && <span className="pc-pill" style={styles.vitalStyle}>{userData.pronouns}</span>}
            {userData.hostel && <span className="pc-pill" style={styles.vitalStyle}><MapPin size={12} style={{ marginRight: '4px' }} /> {userData.hostel}</span>}
          </div>

          <div style={{ marginBottom: '24px' }}>
             <SectionLabel onEdit={() => openEditDrawer({ type: 'bio' })}>About Me</SectionLabel>
             <p style={{ fontFamily: "'Special Elite', 'Courier New', monospace", fontSize: '13px', color: theme.color.inkSoft, lineHeight: 1.55, margin: 0, padding: '16px', backgroundColor: theme.color.surfaceAlt, border: `1px solid ${theme.color.borderDark}`, borderRadius: '8px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
               {userData.bio || "No foreword inscribed in this folio."}
             </p>
          </div>

          <StitchSeam />

          {/* 3. ARCHIVAL INTEGRITY GAUGE WITH CREATIVE CERTIFICATE STAMP */}
          <div
            className="pc-dynamic-shadow"
            style={{ backgroundColor: theme.color.surface, border: `1px solid ${theme.color.border}`, borderRadius: '16px', padding: '20px 22px', margin: '24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', position: 'relative', overflow: 'hidden' }}
          >
            <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at var(--lamp-pct-x) var(--lamp-pct-y), rgba(139,69,19,0.08) 0%, transparent 60%)', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', zIndex: 2 }}>
              <span style={{ fontFamily: theme.font.body, fontSize: '9px', color: theme.color.accent, margin: 0, textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700 }}>Registry Telemetry</span>
              <h3 style={{ fontFamily: theme.font.display, fontSize: '22px', color: theme.color.ink, margin: '2px 0 10px 0', fontWeight: 700, letterSpacing: '-0.02em' }}>Profile Completion</h3>
              
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ padding: '4px 10px', border: `1.5px solid ${theme.color.accent}`, borderRadius: '4px', color: theme.color.accent, fontFamily: theme.font.body, fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', backgroundColor: theme.color.paper }}>
                  {displayScore >= 85 ? 'Exemplary' : displayScore >= 50 ? 'Standard' : 'Incomplete'}
                </span>

                {/* Gestalt Mastery Certification Badge */}
                {displayScore >= 85 && (
                  <span className="pc-stamp" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', backgroundColor: 'rgba(46, 125, 50, 0.08)', border: '1px solid #2e7d32', borderRadius: '4px', color: '#2e7d32', fontFamily: theme.font.body, fontSize: '8.5px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
                    <CheckCircle2 size={11} /> Certified Archival
                  </span>
                )}
              </div>
            </div>

            <div style={{ position: 'relative', width: 88, height: 88, flexShrink: 0, zIndex: 2 }}>
              <svg width={88} height={88} viewBox="0 0 88 88" role="img" aria-label={`Profile completion score ${displayScore} percent`}>
                <g className="pc-bezel-outer">
                  {Array.from({ length: 60 }).map((_, i) => {
                    const isMajor = i % 5 === 0;
                    const angle = (i / 60) * Math.PI * 2;
                    const innerR = isMajor ? 22 : 25, outerR = 29;
                    return <line key={i} x1={44 + innerR * Math.cos(angle)} y1={44 + innerR * Math.sin(angle)} x2={44 + outerR * Math.cos(angle)} y2={44 + outerR * Math.sin(angle)} stroke={isMajor ? theme.color.accent : theme.color.border} strokeWidth={isMajor ? 1.5 : 0.75} opacity={isMajor ? 0.85 : 0.35} />;
                  })}
                </g>
                <circle cx={44} cy={44} r={RING_R} fill="none" stroke={theme.color.surfaceAlt} strokeWidth={5.5} transform="rotate(-90 44 44)" />
                <circle className="pc-ring" cx={44} cy={44} r={RING_R} fill="none" stroke="url(#metallicGradient)" strokeWidth={5.5} strokeLinecap="round" strokeDasharray={CIRCUMFERENCE} strokeDashoffset={ringOffset} transform="rotate(-90 44 44)" />
                <defs>
                  <linearGradient id="metallicGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8b4513" />
                    <stop offset="50%" stopColor="#e6b17a" />
                    <stop offset="100%" stopColor="#5c2c0c" />
                  </linearGradient>
                </defs>
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <p className="pc-metallic-foil" style={{ fontFamily: theme.font.display, fontSize: '24px', margin: 0, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em' }}>{displayScore}<span style={{ fontSize: '13px', fontWeight: 700, marginLeft: '1px' }}>%</span></p>
              </div>
            </div>
          </div>

          <StitchSeam />

          {/* 4. SEEKING PARAMETERS */}
          <div style={{ margin: '24px 0' }}>
            <SectionLabel onEdit={() => openEditDrawer({ type: 'intent' })}>Seeking Parameters</SectionLabel>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {(userData.intent?.length > 0 ? userData.intent : ['None recorded']).map((item, i) => (
                <span key={i} className="pc-pill" style={{ ...styles.vitalStyle, backgroundColor: theme.color.ink, color: theme.color.paper, borderColor: theme.color.ink, fontWeight: 600, boxShadow: '0 4px 12px rgba(26,26,26,0.15)' }}>{item}</span>
              ))}
            </div>
          </div>

          {/* 5. RECORDED CURIOSITIES */}
          <div style={{ marginBottom: '32px' }}>
            <SectionLabel onEdit={() => openEditDrawer({ type: 'interests' })}>Recorded Curiosities</SectionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {userData.interests?.length > 0 ? userData.interests.map((interest, i) => (
                <span key={i} className="pc-pill" style={styles.interestStyle}>{interest}</span>
              )) : <span style={styles.interestStyle}>None recorded</span>}
            </div>
          </div>

          {/* 6. BENTO GRID ARCHIVAL ARTIFACTS WITH TACTILE EMPTY STATES */}
          <div style={{ paddingTop: '8px', marginBottom: '48px' }}>
            <SectionLabel>Archival Artifacts</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px 16px', marginTop: '16px' }}>
              
              {/* Prompt 0 */}
              <div className="pc-dynamic-shadow" style={{ ...styles.bentoPrompt, transform: `rotate(${TILT.prompt_0})` }}>
                <div style={styles.tapeCenter} />
                <button onClick={() => openEditDrawer({ type: 'prompt', slot: 0 })} className="tactile-btn" style={styles.absoluteEditBtn}><Pencil size={12} color="currentColor" style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Edit</button>
                <span style={styles.quoteMark}>“</span>
                <p style={styles.promptText}>{userData.prompts?.[0]?.question || "Draft a whisper..."}</p>
              </div>

              {/* Photo 1 */}
              <div className="pc-dynamic-shadow" style={{ ...styles.bentoPhoto, transform: `rotate(${TILT.photo_1})` }}>
                <button onClick={() => openPhotoSlot(1)} className="tactile-btn" style={styles.absoluteEditBtn}><Pencil size={12} color="currentColor" style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Edit</button>
                {userData.photos?.[1] ? (
                  <img src={userData.photos[1]} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0, transition: 'opacity 0.4s ease-out' }} alt="Artifact II" onLoad={(e) => { e.currentTarget.style.opacity = 1; }} onError={(e) => { e.currentTarget.style.opacity = 1; }} />
                ) : (
                  <div onClick={() => openPhotoSlot(1)} style={styles.emptyPhotoSlot}>
                    <Camera size={24} color={theme.color.accent} style={{ opacity: 0.6, marginBottom: '8px' }} />
                    <span style={styles.emptySlotText}>Affix Artifact II</span>
                  </div>
                )}
              </div>

              {/* Photo 2 */}
              <div className="pc-dynamic-shadow" style={{ ...styles.bentoPhoto, transform: `rotate(${TILT.photo_2})` }}>
                <button onClick={() => openPhotoSlot(2)} className="tactile-btn" style={styles.absoluteEditBtn}><Pencil size={12} color="currentColor" style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Edit</button>
                {userData.photos?.[2] ? (
                  <img src={userData.photos[2]} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0, transition: 'opacity 0.4s ease-out' }} alt="Artifact III" onLoad={(e) => { e.currentTarget.style.opacity = 1; }} onError={(e) => { e.currentTarget.style.opacity = 1; }} />
                ) : (
                  <div onClick={() => openPhotoSlot(2)} style={styles.emptyPhotoSlot}>
                    <Camera size={24} color={theme.color.accent} style={{ opacity: 0.6, marginBottom: '8px' }} />
                    <span style={styles.emptySlotText}>Affix Artifact III</span>
                  </div>
                )}
              </div>

              {/* Prompt 1 */}
              <div className="pc-dynamic-shadow" style={{ ...styles.bentoPrompt, transform: `rotate(${TILT.prompt_1})` }}>
                <div style={styles.tapeLeft} />
                <button onClick={() => openEditDrawer({ type: 'prompt', slot: 1 })} className="tactile-btn" style={styles.absoluteEditBtn}><Pencil size={12} color="currentColor" style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Edit</button>
                <span style={styles.quoteMark}>“</span>
                <p style={styles.promptText}>{userData.prompts?.[1]?.question || "Draft a whisper..."}</p>
              </div>

              {/* Prompt 2 (Wide) */}
              <div className="pc-dynamic-shadow" style={{ ...styles.bentoPrompt, gridColumn: 'span 2', minHeight: '136px', transform: `rotate(${TILT.prompt_2})` }}>
                <div style={styles.tapeCenter} />
                <button onClick={() => openEditDrawer({ type: 'prompt', slot: 2 })} className="tactile-btn" style={styles.absoluteEditBtn}><Pencil size={12} color="currentColor" style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Edit</button>
                <span style={styles.quoteMark}>“</span>
                <p style={styles.promptText}>{userData.prompts?.[2]?.question || "Draft a final whisper..."}</p>
              </div>

              {/* Photo 3 (Wide) */}
              <div className="pc-dynamic-shadow" style={{ ...styles.bentoPhoto, gridColumn: 'span 2', aspectRatio: '16/9', transform: `rotate(${TILT.photo_3})` }}>
                <button onClick={() => openPhotoSlot(3)} className="tactile-btn" style={styles.absoluteEditBtn}><Pencil size={12} color="currentColor" style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Edit</button>
                {userData.photos?.[3] ? (
                  <img src={userData.photos[3]} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0, transition: 'opacity 0.4s ease-out' }} alt="Artifact IV" onLoad={(e) => { e.currentTarget.style.opacity = 1; }} onError={(e) => { e.currentTarget.style.opacity = 1; }} />
                ) : (
                  <div onClick={() => openPhotoSlot(3)} style={styles.emptyPhotoSlot}>
                    <Plus size={28} color={theme.color.accent} style={{ opacity: 0.6, marginBottom: '8px' }} />
                    <span style={styles.emptySlotText}>Affix Wide Panorama Artifact IV</span>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ==========================================
          VAULT SETTINGS OVERLAY
      ========================================== */}
      <AnimatePresence>
        {settingsOpen && (
          <motion.div 
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            style={{ position: 'fixed', inset: 0, backgroundColor: theme.color.paper, zIndex: 100, display: 'flex', flexDirection: 'column' }}
          >
            <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: `url("${design?.texture?.grain || ''}")`, mixBlendMode: 'multiply', opacity: 0.85, pointerEvents: 'none' }} />
            
            <div style={{ height: '45px', boxSizing: 'border-box', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.color.borderDark}`, backgroundColor: theme.color.surface, zIndex: 2 }}>
              <h2 style={{ fontFamily: theme.font.display, fontSize: '24px', margin: 0, color: theme.color.ink, fontWeight: 700 }}>Vault Settings</h2>
              <button onClick={() => setSettingsOpen(false)} className="tactile-btn" aria-label="Close settings" style={{ background: 'none', border: 'none', fontSize: '24px', color: theme.color.inkMuted, cursor: 'pointer', padding: '4px' }}><X size={24} color="currentColor" /></button>
            </div>

            <div className="pc-scroll" style={{ flex: 1, padding: '24px', overflowY: 'auto', zIndex: 2 }}>
              
              <div style={{ backgroundColor: theme.color.surface, padding: '20px', borderRadius: '16px', border: `1px solid ${theme.color.border}`, boxShadow: `0 4px 16px ${theme.color.shadowWarm}`, display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: theme.font.display, fontSize: '18px', color: theme.color.ink, margin: '0 0 4px 0', fontWeight: 700 }}>Ghost Mode</p>
                  <p style={{ fontFamily: theme.font.body, fontSize: '12px', color: theme.color.inkMuted, margin: 0, lineHeight: 1.4 }}>Conceal your folio from the Discovery deck. Existing matches remain active.</p>
                </div>
                <label className="switch" style={{ flexShrink: 0 }}>
                  <input type="checkbox" checked={isGhostMode} onChange={async () => {
                    triggerHaptic('medium');
                    const newState = !isGhostMode;
                    setIsGhostMode(newState);
                    try { await api.put('/users/profile', { isGhost: newState }); } catch { setIsGhostMode(!newState); }
                  }} />
                  <span className="slider"></span>
                  <span className="sun"><svg fill="#fff" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"></circle><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path></svg></span>
                  <span className="moon"><svg fill="#fff" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg></span>
                </label>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button 
                  className="tactile-btn" 
                  style={styles.actionBtn} 
                  onClick={() => {
                    triggerHaptic('light');
                    setBlockedOpen(true);
                    fetchBlockedUsers();
                  }}
                >
                  Blocked Subjects
                </button>
                <button className="tactile-btn" style={{...styles.actionBtn, marginTop: '24px'}} onClick={onSignOut}>Log Out</button>
                <button 
                  className="tactile-btn"
                  style={{ ...styles.actionBtn, color: theme.color.crimson, borderColor: 'rgba(139, 26, 26, 0.3)', backgroundColor: 'rgba(139, 26, 26, 0.05)' }}
                  onClick={async () => {
                    triggerHaptic('heavy');
                    if (window.confirm('This will immediately deactivate your profile, sever all active connections, and remove your correspondence from campus view. To maintain campus safety, archival logs are retained for 30 days before permanent destruction. This action cannot be undone.')) {
                      try {
                        await api.delete('/users/account');
                        onSignOut();
                      } catch (err) {
                        if (err.response?.data?.deleted) {
                          onSignOut();
                        } else {
                          toast.error('Failed to delete account. Please try again.');
                        }
                      }
                    }
                  }}
                >
                  Delete Account
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==========================================
          EDITING DRAWERS (BOTTOM SHEETS)
      ========================================== */}
      <AnimatePresence>
        {drawerConfig && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDrawerConfig(null)}
              style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(20,15,10,0.7)', backdropFilter: 'blur(4px)', zIndex: 100 }} 
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '80dvh', backgroundColor: theme.color.paper, borderTopLeftRadius: '24px', borderTopRightRadius: '24px', zIndex: 101, display: 'flex', flexDirection: 'column', boxShadow: '0 -20px 50px rgba(0,0,0,0.4)' }}
            >
              <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: `url("${design?.texture?.grain || ''}")`, mixBlendMode: 'multiply', opacity: 0.5, pointerEvents: 'none' }} />
              
              <div style={{ padding: '20px 24px', borderBottom: `1px solid ${theme.color.borderDark}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.color.surface, borderTopLeftRadius: '24px', borderTopRightRadius: '24px', zIndex: 2 }}>
                <span style={{ fontFamily: theme.font.display, fontSize: '20px', fontWeight: 700, color: theme.color.ink }}>
                  {drawerConfig.type === 'interests' ? 'Edit Recorded Curiosities' : drawerConfig.type === 'intent' ? 'Edit Seeking Parameters' : drawerConfig.type === 'prompt' ? 'Draft Whisper' : drawerConfig.type === 'vitals' ? 'Edit Vitals' : drawerConfig.type === 'identity' ? 'Edit Subject Identity' : 'Edit About Me'}
                </span>
                <button onClick={() => setDrawerConfig(null)} className="tactile-btn" aria-label="Close editor" style={{ background: theme.color.surfaceAlt, border: `1px solid ${theme.color.borderDark}`, borderRadius: design?.radius?.md || '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.color.ink }}><X size={16} color="currentColor" /></button>
              </div>
              
              <div className="pc-scroll" style={{ padding: '24px', overflowY: 'auto', flex: 1, zIndex: 2 }}>
                
                {/* IDENTITY EDITOR */}
                {drawerConfig.type === 'identity' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <input defaultValue={userData.name} onBlur={(e) => updateProfile({ name: e.target.value })} placeholder="Given Name" style={styles.drawerInput} />
                    <input defaultValue={userData.branch} onBlur={(e) => updateProfile({ branch: e.target.value })} placeholder="Branch / Discipline" style={styles.drawerInput} />
                    <select defaultValue={userData.year} onChange={(e) => updateProfile({ year: e.target.value })} style={styles.drawerSelect}>
                      {config?.years?.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                )}

                {/* VITALS EDITOR */}
                {drawerConfig.type === 'vitals' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <select defaultValue={userData.gender} onChange={(e) => updateProfile({ gender: e.target.value })} style={styles.drawerSelect}>
                      <option value="">Select Gender</option>
                      {config?.genders?.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <select defaultValue={userData.pronouns} onChange={(e) => updateProfile({ pronouns: e.target.value })} style={styles.drawerSelect}>
                      <option value="">Select Pronouns</option>
                      {config?.pronouns?.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <input defaultValue={userData.hostel} onBlur={(e) => updateProfile({ hostel: e.target.value })} placeholder="Hostel" style={styles.drawerInput} />
                  </div>
                )}

                {/* BIO EDITOR */}
                {drawerConfig.type === 'bio' && (
                  <textarea 
                    defaultValue={userData.bio} 
                    onBlur={(e) => updateProfile({ bio: e.target.value })} 
                    placeholder="Write your foreword..."
                    style={{ ...styles.drawerInput, minHeight: '150px', resize: 'none', fontFamily: "'Special Elite', 'Courier New', monospace", lineHeight: 1.5 }} 
                  />
                )}

                {/* PROMPT EDITOR */}
                {drawerConfig.type === 'prompt' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', color: theme.color.accent, fontFamily: theme.font.body }}>Whisper</label>
                    <textarea 
                      placeholder="Type your whisper here..."
                      defaultValue={userData.prompts[drawerConfig.slot]?.question || ''}
                      onBlur={(e) => {
                        const updated = [...userData.prompts];
                        updated[drawerConfig.slot] = { ...updated[drawerConfig.slot], question: e.target.value.trim() };
                        updateProfile({ prompts: updated });
                      }}
                      style={{ ...styles.drawerInput, minHeight: '80px', resize: 'none' }}
                    />
                    <label style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', color: theme.color.accent, fontFamily: theme.font.body }}>Answer</label>
                    <textarea 
                      placeholder="Type your answer here..."
                      defaultValue={userData.prompts[drawerConfig.slot]?.answer || ''}
                      onBlur={(e) => {
                        const updated = [...userData.prompts];
                        updated[drawerConfig.slot] = { ...updated[drawerConfig.slot], answer: e.target.value.trim() };
                        updateProfile({ prompts: updated });
                      }}
                      style={{ ...styles.drawerInput, minHeight: '80px', resize: 'none' }}
                    />
                    <div style={{ height: '1px', backgroundColor: theme.color.borderDark, margin: '8px 0' }} />
                    {config?.prompts?.map((p, i) => {
                      const promptText = typeof p === 'string' ? p : p.question;
                      if (!promptText) return null;
                      return (
                        <button 
                          key={i}
                          className="tactile-btn"
                          onClick={() => {
                            const updated = [...userData.prompts];
                            updated[drawerConfig.slot] = { ...updated[drawerConfig.slot], question: promptText };
                            updateProfile({ prompts: updated });
                            setDrawerConfig(null);
                          }}
                          style={styles.promptListBtn}
                        >
                          "{promptText}"
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* INTERESTS / INTENT EDITOR */}
                {(drawerConfig.type === 'interests' || drawerConfig.type === 'intent') && (
                  <>
                    {drawerConfig.type === 'interests' && (
                      <p style={{ fontFamily: theme.font.body, fontSize: '12px', color: theme.color.inkMuted, marginBottom: '16px', fontWeight: 500 }}>Select up to 6 curiosities ({userData.interests.length}/6).</p>
                    )}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {(drawerConfig.type === 'interests' ? config?.interests : config?.intents)?.map(item => {
                        const isActive = userData[drawerConfig.type].includes(item);
                        const isAtLimit = drawerConfig.type === 'interests' && !isActive && userData.interests.length >= 6;
                        return (
                          <button 
                            key={item}
                            disabled={isAtLimit}
                            className="tactile-btn"
                            onClick={() => {
                              triggerHaptic('light');
                              const current = userData[drawerConfig.type];
                              const updated = isActive ? current.filter(i => i !== item) : [...current, item];
                              updateProfile({ [drawerConfig.type]: updated });
                            }}
                            style={{
                              ...styles.interestStyle,
                              backgroundColor: isActive ? theme.color.crimson : theme.color.surfaceAlt,
                              color: isActive ? '#fff' : theme.color.ink,
                              borderColor: isActive ? theme.color.crimson : 'rgba(224, 216, 200, 0.7)',
                              opacity: isAtLimit ? 0.4 : 1,
                              cursor: isAtLimit ? 'not-allowed' : 'pointer',
                            }}
                          >
                            {item}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ==========================================
          BLOCKED SUBJECTS OVERLAY
      ========================================== */}
      <AnimatePresence>
        {blockedOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setBlockedOpen(false)}
              style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(20,15,10,0.7)', backdropFilter: 'blur(4px)', zIndex: 110 }} 
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{ position: 'fixed', bottom: 0, left: 0, right: 0, maxHeight: '75dvh', backgroundColor: theme.color.paper, borderTopLeftRadius: '24px', borderTopRightRadius: '24px', zIndex: 111, display: 'flex', flexDirection: 'column', boxShadow: '0 -20px 50px rgba(0,0,0,0.4)' }}
            >
              <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: `url("${design?.texture?.grain || ''}")`, mixBlendMode: 'multiply', opacity: 0.5, pointerEvents: 'none' }} />
              
              {/* Header */}
              <div style={{ padding: '20px 24px', borderBottom: `1px solid ${theme.color.borderDark}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.color.surface, borderTopLeftRadius: '24px', borderTopRightRadius: '24px', zIndex: 2 }}>
                <span style={{ fontFamily: theme.font.display, fontSize: '20px', fontWeight: 700, color: theme.color.ink }}>Blocked Subjects</span>
                <button onClick={() => setBlockedOpen(false)} className="tactile-btn" style={{ background: theme.color.surfaceAlt, border: `1px solid ${theme.color.borderDark}`, borderRadius: design?.radius?.md || '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.color.ink }}><X size={16} /></button>
              </div>
              
              {/* List Content */}
              <div className="pc-scroll" style={{ padding: '24px', overflowY: 'auto', flex: 1, zIndex: 2 }}>
                {loadingBlocked ? (
                  <p style={{ fontFamily: theme.font.body, fontSize: '14px', color: theme.color.inkMuted, textAlign: 'center', margin: '40px 0' }}>Consulting disciplinary archives...</p>
                ) : blockedList.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <p style={{ fontFamily: theme.font.display, fontSize: '18px', color: theme.color.ink, fontWeight: 700, margin: '0 0 8px 0' }}>No Blocked Subjects</p>
                    <p style={{ fontFamily: theme.font.body, fontSize: '13px', color: theme.color.inkMuted, margin: 0 }}>Your disciplinary ledger is currently empty.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {blockedList.map(user => (
                      <div key={user._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: theme.color.surface, border: `1px solid ${theme.color.border}`, borderRadius: '12px', boxShadow: `0 2px 8px ${theme.color.shadowWarm}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img src={user.photo || 'https://via.placeholder.com/60'} alt={user.name} style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover', border: `1px solid ${theme.color.borderDark}` }} />
                          <div>
                            <p style={{ fontFamily: theme.font.display, fontSize: '16px', fontWeight: 700, color: theme.color.ink, margin: 0 }}>{user.name}</p>
                            <p style={{ fontFamily: theme.font.body, fontSize: '11px', color: theme.color.inkMuted, margin: '2px 0 0 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{user.branch} • {user.year}</p>
                          </div>
                        </div>
                        <button 
                          className="tactile-btn"
                          onClick={() => handleUnblock(user._id, user.name)}
                          style={{ padding: '8px 14px', backgroundColor: theme.color.surfaceAlt, border: `1px solid ${theme.color.borderDark}`, borderRadius: '8px', fontFamily: theme.font.body, fontSize: '12px', fontWeight: 700, color: theme.color.ink, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.5px' }}
                        >
                          Unblock
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* GPU PROMOTED ZERO-LAG ANIMATIONS & TACTILE PHYSICS */}
      <style>{`
        .pc-dynamic-shadow {
          will-change: transform, box-shadow;
          transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
          box-shadow: calc(var(--lamp-x) * -12px) calc(var(--lamp-y) * -12px + 8px) 24px -6px ${theme.color.shadowWarm}, 0 2px 6px rgba(0,0,0,0.03);
          transform: translate3d(0, 0, 0);
        }
        @media (hover: hover) {
          .pc-dynamic-shadow:hover {
            transform: translate3d(0, -3px, 0) scale3d(1.015, 1.015, 1) rotate(0deg) !important;
            box-shadow: calc(var(--lamp-x) * -18px) calc(var(--lamp-y) * -18px + 14px) 30px -8px rgba(26,26,26,0.18), 0 6px 12px ${theme.color.shadowWarm} !important;
            z-index: 5;
          }
        }
        .pc-ring { transition: stroke-dashoffset 0.4s cubic-bezier(0.2, 0.8, 0.2, 1); }
        .pc-bezel-outer { animation: pcBezelRotate 60s linear infinite; transform-origin: 44px 44px; }
        @keyframes pcBezelRotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pcSealStamp { 0% { transform: scale3d(1.8, 1.8, 1) rotate(-8deg); opacity: 0; filter: blur(4px); } 60% { transform: scale3d(0.95, 0.95, 1) rotate(-6deg); opacity: 1; filter: blur(0px); } 80% { transform: scale3d(1.02, 1.02, 1) rotate(-6deg); opacity: 1; } 100% { transform: scale3d(1, 1, 1) rotate(-6deg); opacity: 1; } }
        .pc-stamp { animation: pcSealStamp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s both; }
        .pc-metallic-foil { background: linear-gradient(135deg, #5c2c0c 0%, #8b4513 30%, #e6b17a 50%, #8b4513 70%, #421f08 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; filter: drop-shadow(0 1px 1px rgba(0,0,0,0.12)); }
        .pc-scroll::-webkit-scrollbar { width: 4px; }
        .pc-scroll::-webkit-scrollbar-track { background: transparent; }
        .pc-scroll::-webkit-scrollbar-thumb { background: ${theme.color.borderDark}; border-radius: 4px; }
        
        /* Interactive Tactile Physics */
        .tactile-btn { transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.2s ease, background-color 0.2s ease; will-change: transform; }
        @media (hover: hover) { .tactile-btn:hover { transform: translate3d(0, -2px, 0) scale3d(1.02, 1.02, 1); box-shadow: 0 4px 12px ${theme.color.shadowWarm}; } }
        .tactile-btn:active { transform: scale3d(0.96, 0.96, 1) translate3d(0, 0, 0) !important; transition: transform 0.08s cubic-bezier(0, 0, 0.2, 1) !important; }
        .pc-pill { transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease; display: inline-flex; align-items: center; will-change: transform; }
        @media (hover: hover) { .pc-pill:hover { transform: translate3d(0, -2px, 0) scale3d(1.03, 1.03, 1); box-shadow: 0 4px 10px rgba(0,0,0,0.08); } }
        @media (prefers-reduced-motion: reduce) { .pc-bezel-outer, .pc-stamp { animation: none !important; } .pc-dynamic-shadow, .tactile-btn, .pc-pill { transition: none !important; transform: none !important; } }
      `}</style>
    </div>
  );
};

/* ==================================================================
   UI HELPERS & CONSTANTS
================================================================== */
const SectionLabel = React.memo(({ children, onEdit }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 0 12px 0' }}>
    <p style={{ fontFamily: theme.font.body, fontSize: '10px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: theme.color.accent, margin: 0, display: 'flex', alignItems: 'center' }}>
      <span aria-hidden="true" style={{ display: 'inline-block', width: '14px', height: '2px', backgroundColor: theme.color.accent, marginRight: '8px', borderRadius: '2px' }} />
      {children}
    </p>
    {onEdit && <button onClick={() => { triggerHaptic('light'); onEdit(); }} className="tactile-btn" style={styles.editBtn}><Pencil size={12} color="currentColor" style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Edit</button>}
  </div>
));

const StitchSeam = React.memo(() => <div aria-hidden="true" style={{ height: '1px', backgroundImage: `repeating-linear-gradient(90deg, ${theme.color.border} 0px, ${theme.color.border} 6px, transparent 6px, transparent 12px)`, opacity: 0.8, margin: '16px 0' }} />);

const styles = {
  editBtn: { background: 'rgba(139, 69, 19, 0.08)', border: `1px solid rgba(139, 69, 19, 0.2)`, color: theme.color.accent, fontSize: '10px', fontFamily: theme.font.body, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer', padding: '4px 10px', borderRadius: '12px' },
  editBtnAlt: { background: 'rgba(0, 0, 0, 0.55)', border: `1px solid rgba(255, 255, 255, 0.25)`, color: '#fff', fontSize: '10px', fontFamily: theme.font.body, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer', padding: '6px 12px', borderRadius: '12px', backdropFilter: 'blur(4px)' },
  absoluteEditBtn: { position: 'absolute', top: '8px', right: '8px', zIndex: 10, background: 'rgba(253, 251, 247, 0.9)', border: `1px solid ${theme.color.borderDark}`, color: theme.color.accent, fontSize: '10px', fontFamily: theme.font.body, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer', padding: '4px 10px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.08)' },
  vitalStyle: { padding: '6px 12px', border: `1px solid ${theme.color.border}`, borderRadius: design?.radius?.sm || '4px', backgroundColor: theme.color.surface, color: theme.color.ink, fontFamily: theme.font.body, fontSize: '11px', fontWeight: 600, letterSpacing: '0.2px' },
  interestStyle: { padding: '6px 12px', border: `1px solid rgba(224, 216, 200, 0.7)`, borderRadius: design?.radius?.sm || '4px', backgroundColor: theme.color.surfaceAlt, color: theme.color.ink, fontFamily: theme.font.body, fontSize: '11px', fontWeight: 500 },
  bentoPrompt: { backgroundColor: theme.color.surface, backgroundImage: `linear-gradient(${theme.color.accentFaint} 1px, transparent 1px)`, backgroundSize: '100% 24px', border: `1px solid ${theme.color.border}`, borderRadius: '8px', padding: '24px 16px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: '140px' },
  bentoPhoto: { position: 'relative', width: '100%', aspectRatio: '1/1', borderRadius: '6px', border: `6px solid ${theme.color.surface}`, backgroundColor: theme.color.surfaceAlt, overflow: 'hidden' },
  emptyPhotoSlot: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(139, 69, 19, 0.03)', border: `1.5px dashed ${theme.color.borderDark}`, cursor: 'pointer', padding: '16px', textAlign: 'center', transition: 'background-color 0.2s ease' },
  emptySlotText: { fontFamily: theme.font.body, fontSize: '11px', fontWeight: 600, color: theme.color.inkMuted, letterSpacing: '0.5px' },
  tapeCenter: { position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%) rotate(-1deg)', width: '36px', height: '16px', backgroundColor: 'rgba(224, 216, 200, 0.9)', backdropFilter: 'blur(2px)', border: '1px solid rgba(139, 69, 19, 0.15)', boxShadow: '0 2px 4px rgba(0,0,0,0.06)', zIndex: 5 },
  tapeLeft: { position: 'absolute', top: '-10px', left: '16px', transform: 'rotate(-4deg)', width: '36px', height: '16px', backgroundColor: 'rgba(224, 216, 200, 0.9)', backdropFilter: 'blur(2px)', border: '1px solid rgba(139, 69, 19, 0.15)', boxShadow: '0 2px 4px rgba(0,0,0,0.06)', zIndex: 5 },
  quoteMark: { fontFamily: theme.font.display, fontSize: '32px', lineHeight: 0.5, opacity: 0.45, marginBottom: '8px', display: 'block', color: theme.color.ink },
  promptText: { fontFamily: theme.font.display, fontSize: '15px', fontStyle: 'italic', color: theme.color.ink, margin: '0 0 4px 0', lineHeight: 1.45, textAlign: 'center', fontWeight: 600 },
  actionBtn: { width: '100%', padding: '16px', backgroundColor: theme.color.surface, border: `1px solid ${theme.color.borderDark}`, borderRadius: design?.radius?.md || '8px', color: theme.color.ink, fontFamily: design?.font?.body || "'Inter', sans-serif", fontSize: '14px', fontWeight: 600, textAlign: 'left', cursor: 'pointer', boxShadow: `0 2px 6px ${theme.color.shadowWarm}` },
  drawerInput: { width: '100%', backgroundColor: theme.color.surface, border: `1px solid ${theme.color.borderDark}`, borderRadius: design?.radius?.sm || '4px', padding: '14px 12px', fontSize: '15px', color: theme.color.ink, fontFamily: design?.font?.body || "'Inter', sans-serif", outline: 'none' },
  drawerSelect: { width: '100%', backgroundColor: theme.color.surface, border: `1px solid ${theme.color.borderDark}`, borderRadius: design?.radius?.sm || '4px', padding: '14px 12px', fontSize: '15px', color: theme.color.ink, fontFamily: design?.font?.body || "'Inter', sans-serif", outline: 'none', appearance: 'none' },
  promptListBtn: { width: '100%', textAlign: 'left', padding: '14px 16px', borderRadius: '8px', border: `1px solid ${theme.color.borderDark}`, backgroundColor: theme.color.surface, fontFamily: theme.font.display, fontSize: '14px', color: theme.color.ink, cursor: 'pointer', lineHeight: 1.4 },
};

export default Profile;
```

### ./client/src/pages/Splash.jsx

```
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Hourglass, Feather, BookOpen } from 'lucide-react';

const T = {
  paper: '#f4ede0', paperDeep: '#e8dcc0', paperShadow: '#d4c5a9',
  ink: '#1a1410', inkMuted: '#6b5d4f',
  accent: '#800000', gold: '#c99a3e', goldLight: '#d4a84a',
  crimsonDeep: '#4d0000', shadowWarm: 'rgba(128,0,0,0.25)',
  void: '#050404',
};

const F = {
  display: "'Playfair Display', Georgia, serif",
  italic: "'Playfair Display', Georgia, serif",
  typewriter: "'IM Fell English', 'Courier New', serif",
  mono: "'Special Elite', monospace",
  sans: "'Inter', system-ui, sans-serif",
};

const SLIDES = [
  { id: 'prologue', tag: 'The Manifesto', title: 'Matchalize', subtitle: 'A Deliberate Network', type: 'title', align: 'center', isNight: false },
  { id: 'problem', Icon: Hourglass, tag: 'The Illusion', title: 'Starting from zero.', body: 'Mainstream platforms manufacture connection from thin air. They optimize for surface signals while remaining structurally blind to the rhythm of your actual, lived existence.', align: 'right', isNight: true },
  { id: 'reality', Icon: Compass, tag: 'The Context', title: 'You are not in a vacuum.', body: 'A campus is extraordinarily dense with shared life. Hostels, societies, fests, and late-night rehearsals. The raw material for connection is already being generated all around you.', align: 'left', isNight: true },
  { id: 'solution', Icon: Feather, tag: 'The Engine', title: 'The campus is the catalyst.', body: "We don't use algorithms to guess your type. We use your lived world. Shared context collapses the distance between strangers before a single word is ever spoken.", align: 'center', isNight: false },
  { id: 'cta', tag: 'Initiation', title: 'Reclaim your world.', body: 'Built for the dense, temporary, and irreplaceable reality of college life.', type: 'cta', align: 'center', isNight: false }
];

export default function CinematicWebsite({ onEnter }) {
  const [step, setStep] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  
  const lastScrollTime = useRef(Date.now());
  const touchStartY = useRef(0);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Snappy, reliable step engine
  const changeStep = (direction) => {
    if (unlocking) return;
    const now = Date.now();
    // 1-second lock prevents accidental double-skips
    if (now - lastScrollTime.current < 1000) return; 
    
    setStep((prev) => {
      const next = prev + direction;
      if (next >= 0 && next < SLIDES.length) {
        lastScrollTime.current = now;
        return next;
      }
      return prev;
    });
  };

  useEffect(() => {
    const handleWheel = (e) => {
      if (Math.abs(e.deltaY) > 30) changeStep(e.deltaY > 0 ? 1 : -1);
    };
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [unlocking]);

  const handleTouchStart = (e) => { touchStartY.current = e.touches[0].clientY; };
  const handleTouchEnd = (e) => {
    const delta = touchStartY.current - e.changedTouches[0].clientY;
    if (delta > 40) changeStep(1);
    if (delta < -40) changeStep(-1);
  };

  const handleUnlock = () => {
    try { navigator.vibrate?.([40, 80, 120]); } catch {}
    setUnlocking(true);
    setTimeout(onEnter, 1400); 
  };

  const slide = SLIDES[step];
  const isNight = slide.isNight;

  // Circle Choreography
  const scales = isMobile ? [1, 1.5, 1.5, 0.8, 1.2] : [1, 1.85, 1.85, 0.7, 1.25];
  const xPositions = isMobile ? ['0vw', '-45vw', '45vw', '0vw', '0vw'] : ['0vw', '-35vw', '35vw', '0vw', '0vw'];
  const rotations = [0, 45, 90, 135, 180];

  // =========================================================
  // APP-LIKE STAGGERED ANIMATIONS
  // =========================================================
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 } // Elements pop in sequentially
    },
    exit: {
      opacity: 0,
      filter: 'blur(12px)',
      transition: { duration: 0.6 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10, filter: 'blur(10px)' },
    show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.8, ease: "easeOut" } }
  };

  return (
    <div 
      onTouchStart={handleTouchStart} 
      onTouchEnd={handleTouchEnd}
      style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden', backgroundColor: T.paper }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Special+Elite&display=swap');
        .tactile-btn { transition: all .4s cubic-bezier(0.2, 0.8, 0.2, 1); position: relative; overflow: hidden; }
        .tactile-btn:hover { transform: scale(1.03); background-color: ${T.crimsonDeep} !important; }
        .tactile-btn:active { transform: scale(.95) !important; }
        @keyframes spinSlow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes spinReverse { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
      `}</style>

      {/* BACKGROUND */}
      <motion.div 
        animate={{ backgroundColor: isNight ? T.void : T.paper }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
        style={{ position: 'absolute', inset: 0, zIndex: 0 }} 
      />
      <div style={{ position: 'absolute', inset: 0, mixBlendMode: 'multiply', backgroundImage: `radial-gradient(circle at 20% 30%, ${T.paperShadow}22 1px, transparent 1px), radial-gradient(circle at 70% 60%, ${T.paperShadow}1a 1px, transparent 1px)`, backgroundSize: '3px 3px, 5px 5px', pointerEvents: 'none', zIndex: 1, opacity: 0.5 }} />

      {/* THE CIRCLE */}
      <motion.div 
        animate={{ 
          x: `calc(-50% + ${xPositions[step]})`, 
          y: '-50%',
          scale: scales[step],
          rotate: rotations[step]
        }}
        transition={{ type: "spring", mass: 2.5, stiffness: 40, damping: 25 }}
        style={{ position: 'absolute', top: '50%', left: '50%', width: 600, height: 600, zIndex: 2, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <motion.div animate={{ opacity: unlocking ? 0 : 0.6 }} transition={{ duration: 0.4 }} style={{ width: '100%', height: '100%', position: 'absolute' }}>
          <svg viewBox="0 0 800 800" style={{ width: '100%', height: '100%' }}>
            <g style={{ transformOrigin: 'center', animation: 'spinSlow 100s linear infinite' }}>
              <circle cx="400" cy="400" r="380" stroke={T.goldLight} strokeWidth="1.5" fill="none" strokeDasharray="4 24" />
            </g>
            <g style={{ transformOrigin: 'center', animation: 'spinReverse 140s linear infinite' }}>
              <circle cx="400" cy="400" r="360" stroke={T.inkMuted} strokeWidth="2" fill="none" opacity="0.4" />
            </g>
          </svg>
        </motion.div>

        {/* EXPANDING CORE */}
        <motion.div 
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: unlocking ? 150 : 0, opacity: unlocking ? 1 : 0 }}
          transition={{ duration: 1.2, ease: [0.7, 0, 0.1, 1] }}
          style={{ position: 'absolute', width: 40, height: 40, borderRadius: '50%', backgroundColor: T.void, zIndex: 999 }}
        />
      </motion.div>

      {/* TEXT LAYER (Editorial Layout) */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <AnimatePresence mode="wait">
          {!unlocking && (
            <motion.div 
              key={step}
              variants={containerVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              style={{ 
                width: '100%', 
                maxWidth: 1200,
                display: 'flex', 
                flexDirection: 'column', 
                // Grid-breaking alignment
                alignItems: isMobile ? 'center' : slide.align === 'right' ? 'flex-end' : slide.align === 'left' ? 'flex-start' : 'center', 
                padding: isMobile ? '0 24px' : slide.align === 'right' ? '0 10vw 0 0' : slide.align === 'left' ? '0 0 0 10vw' : '0 40px'
              }}
            >
              
              {/* SLIDE: TITLE */}
              {slide.type === 'title' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <motion.div variants={itemVariants} style={{ color: T.accent, fontFamily: F.mono, fontSize: 11, letterSpacing: 4, textTransform: 'uppercase', fontWeight: 700, padding: '6px 18px', border: `1px solid ${T.accent}55`, marginBottom: 16 }}>
                    {slide.tag}
                  </motion.div>
                  <motion.h1 variants={itemVariants} style={{ color: T.ink, fontFamily: F.display, fontSize: 'clamp(56px, 12vw, 84px)', fontWeight: 900, letterSpacing: '-0.04em', margin: '0 0 16px 0', textShadow: `0 6px 24px ${T.shadowWarm}`, lineHeight: 1 }}>
                    {slide.title}
                  </motion.h1>
                  <motion.p variants={itemVariants} style={{ color: T.inkMuted, fontFamily: F.mono, fontSize: 12, letterSpacing: 4, textTransform: 'uppercase', fontWeight: 700 }}>
                    {slide.subtitle}
                  </motion.p>
                </div>
              )}

              {/* SLIDE: CONTENT (Offset layout for a spatial feel) */}
              {!slide.type && (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: isMobile ? 'center' : slide.align === 'right' ? 'flex-end' : 'flex-start',
                  textAlign: isMobile ? 'center' : slide.align,
                  maxWidth: 540
                }}>
                  <motion.span variants={itemVariants} style={{ color: isNight ? T.goldLight : T.accent, fontFamily: F.mono, fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', fontWeight: 700, marginBottom: 16 }}>
                    {slide.tag}
                  </motion.span>
                  
                  {/* Title is massive and tight */}
                  <motion.h2 variants={itemVariants} style={{ color: isNight ? '#fdfbf7' : T.ink, fontFamily: F.display, fontSize: 'clamp(42px, 7vw, 64px)', margin: '0 0 24px 0', lineHeight: 1.05, fontWeight: 800 }}>
                    {slide.title}
                  </motion.h2>
                  
                  {/* Body text is visually separated into its own block */}
                  <motion.div variants={itemVariants} style={{ 
                    position: 'relative',
                    padding: isMobile ? 0 : slide.align === 'right' ? '0 32px 0 0' : '0 0 0 32px',
                    borderRight: !isMobile && slide.align === 'right' ? `2px solid ${isNight ? T.goldLight : T.accent}40` : 'none',
                    borderLeft: !isMobile && slide.align === 'left' ? `2px solid ${isNight ? T.goldLight : T.accent}40` : 'none',
                  }}>
                    <p style={{ color: isNight ? '#b3a89e' : T.inkMuted, fontFamily: F.typewriter, fontSize: 'clamp(17px, 3vw, 20px)', margin: 0, lineHeight: 1.6 }}>
                      {slide.body}
                    </p>
                  </motion.div>
                </div>
              )}

              {/* SLIDE: CTA */}
              {slide.type === 'cta' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', maxWidth: 440 }}>
                  <motion.h1 variants={itemVariants} style={{ color: T.ink, fontFamily: F.display, fontSize: 'clamp(48px, 8vw, 60px)', fontWeight: 900, letterSpacing: '-0.02em', textShadow: `0 6px 24px ${T.shadowWarm}`, lineHeight: 1, margin: 0 }}>
                    Matchalize
                  </motion.h1>
                  <motion.p variants={itemVariants} style={{ color: T.inkMuted, fontFamily: F.italic, fontSize: 'clamp(16px, 3vw, 18px)', fontStyle: 'italic', margin: '24px 0 40px' }}>
                    {slide.body}
                  </motion.p>
                  <motion.button 
                    variants={itemVariants}
                    onClick={handleUnlock}
                    className="tactile-btn"
                    style={{ width: '100%', padding: '24px 32px', backgroundColor: T.accent, color: '#fbf6e8', border: `1px solid ${T.crimsonDeep}`, borderRadius: 16, fontFamily: F.sans, fontSize: 15, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, cursor: 'pointer', boxShadow: `0 16px 40px rgba(128,0,0,.5), inset 0 2px 0 rgba(255,255,255,.15)` }}
                  >
                    <BookOpen size={22} strokeWidth={2.5} /> Enter the Realm
                  </motion.button>
                </div>
              )}

            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
```

### ./client/src/pages/Waitlist.jsx

```
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { api, API_BASE } from '../utils/api';
import { theme as design } from '../utils/theme';
import { Feather, KeyRound } from 'lucide-react';

// Sunlit Library token set — same family as Auth/ProfileCard
const t = {
  desk: '#ece4d4',
  paper: '#fdfbf7',
  card: '#fffdf8',
  surfaceAlt: '#f4f1ea',
  lineDark: '#d4c5a9',
  line: '#e0d8c8',
  ink: '#1a1a1a',
  inkSoft: '#4a4a4a',
  inkMuted: '#8c8275',
  accent: '#8b4513',
  accentSoft: 'rgba(139, 69, 19, 0.18)',
  accentFaint: 'rgba(139, 69, 19, 0.05)',
  crimson: '#8b1a1a',
  success: '#2e7d32',
  fontDisplay: design?.font?.heading || "'Playfair Display', Georgia, serif",
  fontBody: design?.font?.body || "'Inter', -apple-system, sans-serif",
  fontType: "'Special Elite', 'Courier New', monospace",
  grain: design?.texture?.grain || '',
};

// Single source of truth for tier thresholds (mirrored in backend)
const TIER_THRESHOLDS = { charter: 50, founding: 250 };

// FIXED: Match the server's hardcoded constant exactly
const FALLBACK_LAUNCH_DATE = new Date('2026-10-02T00:00:00Z');

const tierName = (position) => {
  if (position <= TIER_THRESHOLDS.charter) return 'Charter';
  if (position <= TIER_THRESHOLDS.founding) return 'Founding';
  return 'Original';
};

const useCountdown = (target) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target.getTime() - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return {
    daysS: String(days).padStart(2, '0'),
    hoursS: String(hours).padStart(2, '0'),
    minutesS: String(minutes).padStart(2, '0'),
    secondsS: String(seconds).padStart(2, '0'),
  };
};

const TimeBox = ({ value, label }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <div
      style={{
        width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 16, border: `1px solid ${t.line}`, backgroundColor: t.card,
        fontFamily: t.fontType, fontSize: 26, fontWeight: 700, color: t.accent,
        boxShadow: '0 2px 6px rgba(139,69,19,0.06)',
      }}
    >
      {value}
    </div>
    <span style={{ marginTop: 6, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: t.inkMuted, fontFamily: t.fontBody, fontWeight: 500 }}>
      {label}
    </span>
  </div>
);

const Stat = ({ value, label, accent }) => (
  <div
    style={{
      borderRadius: 14, border: `1px solid ${t.line}`, backgroundColor: t.card, padding: 14,
      boxShadow: '0 2px 6px rgba(139,69,19,0.05)',
    }}
  >
    <div style={{ fontFamily: t.fontType, fontSize: 24, fontWeight: 700, color: accent || t.ink }}>
      {value}
    </div>
    <div style={{ marginTop: 2, fontSize: 11, color: t.inkMuted, fontFamily: t.fontBody }}>{label}</div>
  </div>
);

const Panel = ({ children, style = {} }) => (
  <div
    style={{
      borderRadius: 16, border: `1px solid ${t.line}`, backgroundColor: t.card, padding: 20,
      boxShadow: '0 2px 8px rgba(139,69,19,0.05)', ...style,
    }}
  >
    {children}
  </div>
);

export default function Waitlist() {
  const [step, setStep] = useState('landing');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [myData, setMyData] = useState(null);
  const [recentToasts, setRecentToasts] = useState([]);

  const confettiFired = useRef(false);
  const toastTimersRef = useRef([]);

  // FIXED: stable launch date — countdown never resets on refetch
  const launchDate = useMemo(
    () => (stats?.launchDate ? new Date(stats.launchDate) : FALLBACK_LAUNCH_DATE),
    [stats?.launchDate]
  );
  const countdown = useCountdown(launchDate);

  const fetchStats = useCallback(async () => {
    try {
      setStats(await api.get('/waitlist/stats'));
    } catch {
      // keep last stats
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const id = setInterval(fetchStats, 15000);
    return () => {
      clearInterval(id);
      toastTimersRef.current.forEach(clearTimeout);
      toastTimersRef.current = [];
    };
  }, [fetchStats]);

  // FIXED: Real joins instead of fabricated names — matches ethical framework
  useEffect(() => {
    if (step !== 'success' || !stats?.recentJoins?.length) return;

    const formatJoin = (join) => {
      if (!join.name || join.name === 'An IITian') return 'An IITian just joined';
      const firstName = join.name.split(' ')[0];
      const yearMatch = join.year?.match(/Freshies|Sophies|Thirdies|Fourthies/);
      const yearMap = { Freshies: '28', Sophies: '27', Thirdies: '26', Fourthies: '25' };
      const yearSuffix = yearMatch ? yearMap[yearMatch[0]] || '27' : '27';
      const branchShort = join.branch ? join.branch.split(' ')[0] : 'IITB';
      return `${firstName} from ${branchShort} '${yearSuffix} just joined`;
    };

    const interval = setInterval(() => {
      const join = stats.recentJoins[Math.floor(Math.random() * stats.recentJoins.length)];
      const id = Date.now() + Math.random();
      setRecentToasts(prev => [{ id, name: formatJoin(join) }, ...prev].slice(0, 3));
      const timer = setTimeout(() => {
        setRecentToasts(prev => prev.filter(toast => toast.id !== id));
      }, 4000);
      toastTimersRef.current.push(timer);
    }, 8000 + Math.random() * 5000);

    return () => {
      clearInterval(interval);
      toastTimersRef.current.forEach(clearTimeout);
      toastTimersRef.current = [];
    };
  }, [step, stats]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const normalized = email.trim().toLowerCase().replace(/\s+/g, '');
    setEmail(normalized);
    if (!normalized || !/^[\w.+-]+@[\w-]+\.[\w.]+$/.test(normalized)) {
      setError('Please enter a valid email.');
      return;
    }
    if (!normalized.endsWith('@iitb.ac.in')) {
      setError('Currently only @iitb.ac.in emails are accepted.');
      return;
    }
    setLoading(true);
    try {
      // Raw fetch so the 409 resume body and error status are preserved
      const res = await fetch(`${API_BASE}/api/waitlist/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: normalized,
          name: name.trim(),
          referralCode: referralCode.trim().toUpperCase(),
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 409) {
        confettiFired.current = true;
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 }, colors: ['#8b4513', '#d4c5a9', '#8b1a1a', '#fdfbf7'] });
        setMyData(data);
        setStep('success');
        return;
      }
      if (!res.ok) {
        setError(data.message || 'Something went wrong. Please try again.');
        return;
      }

      if (!confettiFired.current) {
        confettiFired.current = true;
        confetti({ particleCount: 160, spread: 100, origin: { y: 0.6 }, colors: ['#8b4513', '#d4c5a9', '#8b1a1a', '#fdfbf7'] });
      }
      setMyData(data);
      setStep('success');
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const pct = stats ? Math.round((stats.total / 250) * 100) : 0;

  return (
    <div
      style={{
        minHeight: '100dvh', backgroundColor: t.desk, color: t.ink,
        fontFamily: t.fontBody, position: 'relative', overflowX: 'hidden',
        backgroundImage: `radial-gradient(ellipse at top, rgba(139,69,19,0.06), transparent 60%), ${t.grain}`,
      }}
    >
      <style>{`
        @keyframes wlToast { from { opacity: 0; transform: translate3d(0, -12px, 0); } to { opacity: 1; transform: translate3d(0, 0, 0); } }
        .wl-toast { animation: wlToast 0.3s ease-out both; }
        @keyframes wlFadeUp { from { opacity: 0; transform: translate3d(0, 18px, 0); } to { opacity: 1; transform: translate3d(0, 0, 0); } }
        .wl-fade-up { animation: wlFadeUp 0.55s cubic-bezier(0.2, 0.8, 0.3, 1) both; }
      `}</style>

      {/* Recent join toasts — real data from stats.recentJoins */}
      <div style={{ position: 'fixed', top: 96, left: 16, zIndex: 50, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
        {recentToasts.map(toast => (
          <div
            key={toast.id}
            className="wl-toast"
            style={{
              borderRadius: 12, border: `1px solid ${t.line}`, backgroundColor: 'rgba(253,251,247,0.94)',
              padding: '10px 14px', fontSize: 12.5, color: t.inkSoft, boxShadow: '0 6px 18px rgba(26,26,26,0.12)',
              fontFamily: t.fontBody, maxWidth: 260,
            }}
          >
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 99, backgroundColor: t.crimson, marginRight: 8, verticalAlign: 'middle' }} />
            {toast.name}
          </div>
        ))}
      </div>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '28px 20px 64px', position: 'relative' }}>
        {/* Masthead */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32, height: 32, borderRadius: 10, backgroundColor: t.accent, color: t.paper,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: t.fontDisplay, fontWeight: 800, fontSize: 17, boxShadow: '0 3px 8px rgba(139,69,19,0.3)',
              }}
            >
              M
            </div>
            <span style={{ fontFamily: t.fontDisplay, fontWeight: 700, fontSize: 17, letterSpacing: '0.01em' }}>
              Matchalize
            </span>
          </div>
          <span
            style={{
              border: `1px solid ${t.lineDark}`, borderRadius: 999, padding: '5px 12px',
              fontFamily: t.fontType, fontSize: 10.5, letterSpacing: '0.22em', color: t.accent,
              backgroundColor: 'rgba(253,251,247,0.6)', textTransform: 'uppercase',
            }}
          >
            Founding Cohort
          </span>
        </div>

        <AnimatePresence mode="wait">
          {step === 'landing' && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4 }}
            >
              {/* Live badge */}
              <div
                className="wl-fade-up"
                style={{
                  marginTop: 40, display: 'inline-flex', alignItems: 'center', gap: 8,
                  border: `1px solid ${t.line}`, borderRadius: 999, padding: '6px 14px',
                  backgroundColor: 'rgba(253,251,247,0.7)', fontSize: 12, color: t.inkSoft, fontFamily: t.fontBody,
                }}
              >
                <span style={{ width: 7, height: 7, borderRadius: 99, backgroundColor: t.accent, animation: 'wlPulse 1.6s ease-in-out infinite' }} />
                {stats ? `${stats.last24h} joined in the last 24h` : 'Join the waitlist'}
              </div>
              <style>{`@keyframes wlPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.25; } }`}</style>

              {/* Hero */}
              <h1
                className="wl-fade-up"
                style={{
                  marginTop: 22, fontFamily: t.fontDisplay, fontWeight: 800, fontSize: 38, lineHeight: 1.12,
                  letterSpacing: '-0.01em', color: t.ink,
                }}
              >
                The founders of the{' '}
                <em style={{ color: t.accent, fontStyle: 'italic' }}>campus dating economy</em>{' '}
                at IIT Bombay.
              </h1>
              <p className="wl-fade-up" style={{ marginTop: 14, maxWidth: 460, fontSize: 14.5, lineHeight: 1.65, color: t.inkSoft }}>
                The <strong style={{ color: t.ink }}>Charter Cohort</strong> gets first access, an exclusive badge, and a direct line to product decisions.
              </p>

              {/* Tier tiles */}
              <div className="wl-fade-up" style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <Stat value="50" label="Charter spots" accent={t.accent} />
                <Stat value="250" label="Founding seats" accent={t.accent} />
                <Stat value="0" label="Public" accent={t.inkMuted} />
              </div>

              {/* Founding progress */}
              <div className="wl-fade-up" style={{ marginTop: 16 }}>
                <Panel>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 12.5, color: t.inkSoft, fontFamily: t.fontBody }}>
                    <span>{stats ? `${stats.total} founding members` : 'Loading…'}</span>
                    <span style={{ fontFamily: t.fontType, fontWeight: 700, color: t.accent }}>{pct}%</span>
                  </div>
                  <div style={{ marginTop: 10, height: 8, borderRadius: 999, backgroundColor: t.desk, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%', borderRadius: 999,
                        background: `linear-gradient(90deg, ${t.accent}, #a05a1c)`,
                        width: `${pct}%`, transition: 'width 1s ease',
                      }}
                    />
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: t.inkMuted }}>
                    <span>Founding Cohort fills at 250</span>
                    <span>{stats ? 250 - stats.total : '—'} left</span>
                  </div>
                </Panel>
              </div>

              {/* Perks */}
              <div className="wl-fade-up" style={{ marginTop: 28 }}>
                <h2 style={{ fontFamily: t.fontDisplay, fontWeight: 700, fontSize: 17, color: t.ink }}>Your spot could be worth it</h2>
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 14, color: t.inkSoft }}>Referral Jump</span>
                    <span style={{ fontSize: 14, fontFamily: t.fontType, color: t.accent, fontWeight: 700 }}>+2 to +15 spots</span>
                  </div>
                  <div style={{ height: 1, backgroundColor: t.line }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 14, color: t.inkSoft }}>Top 50</span>
                    <span style={{ fontSize: 14, fontFamily: t.fontType, color: t.accent, fontWeight: 700 }}>Charter badge</span>
                  </div>
                  <div style={{ height: 1, backgroundColor: t.line }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 14, color: t.inkSoft }}>Every 3-day check-in streak</span>
                    <span style={{ fontSize: 14, fontFamily: t.fontType, color: t.accent, fontWeight: 700 }}>+2 spots</span>
                  </div>
                </div>
              </div>

              {/* Join form */}
              <form className="wl-fade-up" onSubmit={handleSubmit} style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {error && (
                  <div
                    style={{
                      borderRadius: 12, border: `1px solid rgba(139,26,26,0.35)`, backgroundColor: 'rgba(139,26,26,0.06)',
                      padding: '10px 14px', fontSize: 13, color: t.crimson,
                    }}
                  >
                    {error}
                  </div>
                )}
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name (optional)"
                  maxLength={60}
                  style={{
                    borderRadius: 12, border: `1px solid ${t.line}`, backgroundColor: t.paper, padding: '13px 15px',
                    fontSize: 14, color: t.ink, outline: 'none', fontFamily: t.fontBody,
                    boxShadow: 'inset 0 1px 2px rgba(26,26,26,0.04)',
                  }}
                  onFocus={e => Object.assign(e.target.style, { borderColor: t.accent, boxShadow: `0 0 0 3px ${t.accentSoft}` })}
                  onBlur={e => Object.assign(e.target.style, { borderColor: t.line, boxShadow: 'inset 0 1px 2px rgba(26,26,26,0.04)' })}
                />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@iitb.ac.in"
                  autoFocus
                  style={{
                    borderRadius: 12, border: `1px solid ${t.line}`, backgroundColor: t.paper, padding: '13px 15px',
                    fontSize: 14, color: t.ink, outline: 'none', fontFamily: t.fontBody,
                    boxShadow: 'inset 0 1px 2px rgba(26,26,26,0.04)',
                  }}
                  onFocus={e => Object.assign(e.target.style, { borderColor: t.accent, boxShadow: `0 0 0 3px ${t.accentSoft}` })}
                  onBlur={e => Object.assign(e.target.style, { borderColor: t.line, boxShadow: 'inset 0 1px 2px rgba(26,26,26,0.04)' })}
                />
                <div>
                  <input
                    type="text"
                    value={referralCode}
                    onChange={e => setReferralCode(e.target.value.toUpperCase())}
                    placeholder="Referral code (optional — +2 to +15 spots)"
                    maxLength={6}
                    style={{
                      borderRadius: 12, border: `1px solid ${t.line}`, backgroundColor: t.paper, padding: '13px 15px',
                      width: '100%', fontSize: 14, color: t.ink, outline: 'none', fontFamily: t.fontType,
                      letterSpacing: '0.15em', boxShadow: 'inset 0 1px 2px rgba(26,26,26,0.04)',
                    }}
                    onFocus={e => Object.assign(e.target.style, { borderColor: t.accent, boxShadow: `0 0 0 3px ${t.accentSoft}` })}
                    onBlur={e => Object.assign(e.target.style, { borderColor: t.line, boxShadow: 'inset 0 1px 2px rgba(26,26,26,0.04)' })}
                  />
                  <p style={{ marginTop: 6, paddingLeft: 2, fontSize: 11, color: t.inkMuted }}>
                    Hint: find a friend already in — you'll both move up.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    borderRadius: 12, backgroundColor: t.accent, color: t.paper, padding: '14px 15px',
                    fontSize: 14.5, fontWeight: 600, fontFamily: t.fontBody, border: 'none', cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(139,69,19,0.3)', opacity: loading ? 0.6 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  {loading ? 'Claiming your spot…' : (<><Feather size={16} /> Claim your founding spot →</>)}
                </button>
                <p style={{ textAlign: 'center', fontSize: 11, color: t.inkMuted }}>
                  {stats ? `${stats.charter} Charter / ${stats.founding} Founding spots claimed` : '…'}
                </p>
              </form>

              {/* Countdown */}
              <div className="wl-fade-up" style={{ marginTop: 40, borderTop: `1px solid ${t.line}`, paddingTop: 22 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: t.inkMuted, fontFamily: t.fontBody }}>
                  <span>Launch countdown</span>
                  <span style={{ color: t.accent, fontFamily: t.fontType }}>{stats ? 'Live' : '…'}</span>
                </div>
                <div style={{ marginTop: 18, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 18 }}>
                  <TimeBox value={countdown.daysS} label="Days" />
                  <span style={{ fontFamily: t.fontType, fontWeight: 700, color: t.accent, fontSize: 20 }}>:</span>
                  <TimeBox value={countdown.hoursS} label="Hours" />
                  <span style={{ fontFamily: t.fontType, fontWeight: 700, color: t.accent, fontSize: 20 }}>:</span>
                  <TimeBox value={countdown.minutesS} label="Mins" />
                  <span style={{ fontFamily: t.fontType, fontWeight: 700, color: t.accent, fontSize: 20 }}>:</span>
                  <TimeBox value={countdown.secondsS} label="Secs" />
                </div>
              </div>
            </motion.div>
          )}

          {step === 'success' && myData && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              {/* Admission ticket */}
              <div
                style={{
                  marginTop: 36, borderRadius: 22, border: `1px solid ${t.lineDark}`,
                  background: `linear-gradient(180deg, rgba(139,69,19,0.07), transparent 45%), ${t.paper}`,
                  padding: 28, boxShadow: '0 10px 30px rgba(139,69,19,0.14)', position: 'relative', overflow: 'hidden',
                  backgroundImage: `linear-gradient(180deg, rgba(139,69,19,0.07), transparent 45%), ${t.grain}`,
                }}
              >
                {/* Corner stamp */}
                <div
                  style={{
                    position: 'absolute', top: 18, right: -38, transform: 'rotate(45deg)', width: 150,
                    textAlign: 'center', padding: '5px 0', borderTop: `1.5px solid ${t.crimson}`, borderBottom: `1.5px solid ${t.crimson}`,
                    fontFamily: t.fontType, fontSize: 11, letterSpacing: '0.28em', color: t.crimson, textTransform: 'uppercase',
                    backgroundColor: 'rgba(139,26,26,0.05)',
                  }}
                >
                  Booking Verified
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: t.fontType, fontSize: 11, letterSpacing: '0.24em', textTransform: 'uppercase', color: t.accent }}>
                    {tierName(myData.position)} Cohort
                  </span>
                  <span style={{ fontFamily: t.fontType, fontSize: 13, color: t.inkMuted, border: `1px solid ${t.line}`, borderRadius: 999, padding: '4px 10px' }}>
                    #{myData.position}
                  </span>
                </div>

                <div style={{ marginTop: 22 }}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 16, delay: 0.15 }}
                    style={{ fontFamily: t.fontDisplay, fontWeight: 800, fontSize: 40, letterSpacing: '-0.01em', color: myData.referralBonus ? t.accent : t.ink, lineHeight: 1.1 }}
                  >
                    {myData.referralBonus ? `+${myData.referralBonus.spotsJumped} SPOTS` : 'SPOT CLAIMED'}
                  </motion.div>
                  <p style={{ marginTop: 12, maxWidth: 380, fontSize: 14, lineHeight: 1.65, color: t.inkSoft }}>
                    {myData.referralBonus ? (
                      <>
                        <span style={{ color: t.accent, fontWeight: 600 }}>{myData.referralBonus.referrerName}</span> jumped from
                        #{myData.position + myData.referralBonus.spotsJumped} to #{myData.referralBonus.newPosition}.
                        You now hold <strong style={{ color: t.ink }}>#{myData.position}</strong> of 250.
                      </>
                    ) : (
                      <>
                        You're <strong style={{ color: t.ink }}>#{myData.position}</strong> in line.
                        Share your code to move up — every friend you bring jumps you both.
                      </>
                    )}
                  </p>
                </div>

                {/* Progress */}
                <div style={{ marginTop: 22 }}>
                  <div style={{ height: 8, borderRadius: 999, backgroundColor: t.desk, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%', borderRadius: 999,
                        background: `linear-gradient(90deg, ${t.accent}, #a05a1c)`,
                        width: `${Math.min(100, (myData.position / 250) * 100)}%`,
                      }}
                    />
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: t.inkMuted }}>
                    <span>Top {tierName(myData.position).toLowerCase()} of 250</span>
                    <span>{myData.position} of 250</span>
                  </div>
                </div>

                {/* Referral code */}
                <div
                  style={{
                    marginTop: 22, borderRadius: 14, border: `1px solid ${t.lineDark}`, backgroundColor: 'rgba(253,251,247,0.7)',
                    padding: 16,
                  }}
                >
                  <div style={{ fontSize: 10, letterSpacing: '0.24em', textTransform: 'uppercase', color: t.inkMuted, fontFamily: t.fontBody, fontWeight: 600 }}>
                    Your referral code
                  </div>
                  <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <motion.div
                      initial={{ opacity: 0, letterSpacing: '0.8em' }}
                      animate={{ opacity: 1, letterSpacing: '0.18em' }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      style={{ fontFamily: t.fontType, fontSize: 28, fontWeight: 700, color: t.accent }}
                    >
                      {myData.referralCode}
                    </motion.div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(myData.referralCode);
                        triggerCopyFlash();
                      }}
                      style={{
                        borderRadius: 10, border: `1px solid ${t.lineDark}`, backgroundColor: t.paper,
                        padding: '8px 14px', fontSize: 12, fontWeight: 600, color: t.accent, cursor: 'pointer', fontFamily: t.fontBody,
                      }}
                    >
                      <KeyRound size={13} style={{ verticalAlign: '-2px', marginRight: 5 }} />
                      Copy
                    </button>
                  </div>
                </div>

                {/* Mini stats */}
                <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, textAlign: 'center' }}>
                  <div style={{ borderRadius: 12, border: `1px solid ${t.line}`, backgroundColor: 'rgba(253,251,247,0.6)', padding: '12px 4px' }}>
                    <div style={{ fontFamily: t.fontType, fontWeight: 700, fontSize: 16, color: t.accent }}>#{myData.position}</div>
                    <div style={{ marginTop: 3, fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: t.inkMuted }}>My spot</div>
                  </div>
                  <div style={{ borderRadius: 12, border: `1px solid ${t.line}`, backgroundColor: 'rgba(253,251,247,0.6)', padding: '12px 4px' }}>
                    <div style={{ fontFamily: t.fontType, fontWeight: 700, fontSize: 16, color: t.accent }}>
                      {myData.referralBonus ? `+${myData.referralBonus.spotsJumped}` : '+0'}
                    </div>
                    <div style={{ marginTop: 3, fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: t.inkMuted }}>Advantage</div>
                  </div>
                  <div style={{ borderRadius: 12, border: `1px solid ${t.line}`, backgroundColor: 'rgba(253,251,247,0.6)', padding: '12px 4px' }}>
                    <div style={{ fontFamily: t.fontType, fontWeight: 700, fontSize: 16, color: t.inkMuted }}>Pending</div>
                    <div style={{ marginTop: 3, fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: t.inkMuted }}>Status</div>
                  </div>
                </div>

                <p style={{ marginTop: 20, textAlign: 'center', fontSize: 11, color: t.inkMuted }}>
                  We're onboarding a small Founding Cohort before public launch.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <CopyFlashController />
    </div>
  );
}

/* Tiny helper to flash a "Copied" state on the copy button */
function CopyFlashController() {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    window.__setWaitlistCopied = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    };
    return () => { delete window.__setWaitlistCopied; };
  }, []);
  return copied ? (
    <div
      style={{
        position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', zIndex: 60,
        borderRadius: 999, backgroundColor: t.ink, color: t.paper, padding: '9px 18px', fontSize: 12.5,
        fontFamily: t.fontBody, boxShadow: '0 8px 20px rgba(26,26,26,0.25)',
      }}
    >
      Code copied to clipboard
    </div>
  ) : null;
}

function triggerCopyFlash() {
  if (window.__setWaitlistCopied) window.__setWaitlistCopied();
}
```

### ./client/src/utils/AppConfigContext.jsx

```
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { api } from './api';
import { theme as design } from './theme';

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
import React, { createContext, useContext, useState, useCallback } from 'react';
import { API_BASE } from './api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

const USER_KEY = 'matchalize_user';

function loadInitialState() {
  try {
    const userRaw = localStorage.getItem(USER_KEY);
    if (userRaw) {
      return { user: JSON.parse(userRaw) };
    }
  } catch {}
  return { user: null };
}

export const AuthProvider = ({ children }) => {
  const [state, setState] = useState(loadInitialState());

  const isAuthenticated = !!state.user;

  const login = useCallback((user) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    setState({ user });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(USER_KEY);
    setState({ user: null });
    // Clear httpOnly cookie server-side
    fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {});
  }, []);

  return (
    <AuthContext.Provider value={{ user: state.user, isAuthenticated, login, logout }}>
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

const handleResponse = async (response) => {
  // 401 or 403 (suspended): Session expired or account suspended — redirect
  if (response.status === 401 || response.status === 403) {
    const errorData = await response.json().catch(() => ({}));
    localStorage.removeItem('matchalize_user');
    if (errorData.suspended) {
      // Save suspension data for the lock screen to pick up
      localStorage.setItem('matchalize_suspended', JSON.stringify({
        reason: errorData.reason || 'Account suspended',
        suspendedAt: new Date().toISOString(),
      }));
      toast.error('Your account has been suspended. Please contact support.');
    }
    if (typeof window !== 'undefined' && window.location.pathname !== '/auth') {
      window.location.href = '/auth';
    }
    throw new Error(errorData.message || 'Unauthorized');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMessage = data.message || 'Something went wrong';
    toast.error(errorMessage);
    throw new Error(errorMessage);
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

  upload: async (file) => {
    const formData = new FormData();
    formData.append('photo', file);
    const res = await fetch(`${API_BASE}/api/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  },
};

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
      default:
        window.navigator.vibrate(10);
    }
  } catch (error) {
    // Silently catch any permission or hardware constraint errors
    console.warn('Haptics blocked or unsupported by device context.');
  }
};

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

### ./client/src/utils/socket.js

```
import { io } from 'socket.io-client';
import { SOCKET_URL } from './api';

const socket = io(SOCKET_URL, {
  withCredentials: true,
  transports: ['websocket'],
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

### ./client/src/utils/theme.js

```
export const theme = {
  color: {
    bg: '#f4f1ea',
    paper: '#fdfbf7',
    surface: '#ffffff',
    surfaceAlt: '#f4f1ea',
    surfaceDim: '#e0d8c8',

    ink: '#1a1a1a',
    inkSoft: '#4a4a4a',
    inkMuted: '#8c8275',

    border: '#e0d8c8',
    borderDark: '#d4c5a9',

    accent: '#8b4513',
    accentSoft: 'rgba(139, 69, 19, 0.18)',
    accentFaint: 'rgba(139, 69, 19, 0.05)',

    crimson: '#8b1a1a',
    crimsonSoft: 'rgba(139, 26, 26, 0.08)',

    success: '#2e7d32',
    warning: '#b8860b',
    telegramTint: 'rgba(212, 175, 55, 0.08)',

    shadowWarm: 'rgba(139, 69, 19, 0.12)',
    shadowDark: 'rgba(26, 26, 26, 0.20)',

    neuDark: '#dedad2',
    neuLight: '#ffffff',
  },

  font: {
    display: "'Playfair Display', Georgia, serif",
    heading: "'Playfair Display', Georgia, serif",
    body: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    typewriter: "'Special Elite', 'Courier New', monospace",
  },

  texture: {
    grain:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.05 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E",
  },

  radius: {
    sm: '8px',
    md: '12px',
    lg: '24px',
    pill: '999px',
  },

  placeholder: {
    avatar:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' fill='%23ede7db'/%3E%3Cg fill='none' stroke='%23c9bda6' stroke-width='3'%3E%3Ccircle cx='60' cy='48' r='17'/%3E%3Cpath d='M28 104c0-18 14-32 32-32s32 14 32 32'/%3E%3C/g%3E%3C/svg%3E",
    image:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='500' viewBox='0 0 400 500'%3E%3Crect width='400' height='500' fill='%23ede7db'/%3E%3Cg fill='none' stroke='%23c9bda6' stroke-width='3'%3E%3Ccircle cx='200' cy='195' r='50'/%3E%3Cpath d='M112 385c0-49 39-88 88-88s88 39 88 88'/%3E%3C/g%3E%3C/svg%3E",
    hero:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='870' viewBox='0 0 600 870'%3E%3Crect width='600' height='870' fill='%23e8e4d9'/%3E%3Cg fill='none' stroke='%23c9bda6' stroke-width='4'%3E%3Ccircle cx='300' cy='340' r='82'/%3E%3Cpath d='M158 660c0-78 63-142 142-142s142 64 142 142'/%3E%3C/g%3E%3Ctext x='300' y='740' text-anchor='middle' font-family='Georgia,serif' font-size='26' fill='%23a89b85'%3ENo Portrait%3C/text%3E%3C/svg%3E",
  },

  z: {
    header: 500,
    nav: 10,
    drawer: 1000,
    modal: 1100,
    toast: 9999,
    overlay: 10000,
  },
};

export default theme;
```

### ./client/src/utils/toast.js

```
let toastCallback = null;

export const setToastHandler = (callback) => {
  toastCallback = callback;
};

export const toast = {
  success: (message, action) => {
    if (toastCallback) toastCallback({ type: 'success', message, action });
  },
  error: (message, action) => {
    if (toastCallback) toastCallback({ type: 'error', message, action });
  },
  info: (message, action) => {
    if (toastCallback) toastCallback({ type: 'info', message, action });
  }
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

## Section 3 — Server Source


### ./server/package.json

```
{
  "name": "matchalize-server",
  "version": "1.0.0",
  "description": "Backend server for Matchalize campus dating app",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon --watch index.js --watch config --watch middleware --watch models --watch routes --watch socket --watch utils index.js"
  },
  "dependencies": {
    "@sentry/node": "^10.66.0",
    "@sentry/profiling-node": "^10.66.0",
    "cloudinary": "^2.2.0",
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "express-mongo-sanitize": "^2.2.0",
    "express-rate-limit": "^7.3.1",
    "express-validator": "^7.1.0",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.4.3",
    "multer": "^1.4.5-lts.1",
    "multer-storage-cloudinary": "^4.0.0",
    "nodemailer": "^6.9.14",
    "socket.io": "^4.7.5",
    "web-push": "^3.6.7"
  },
  "devDependencies": {
    "nodemon": "^3.1.4"
  }
}

```

### ./server/config/appData.js

```
export const PROMPT_BANK = [
  "My favorite spot to hide on campus...",
  "Meet me at the canteen if...",
  "My ideal night study session includes...",
  "The hostel rule I break most often...",
  "A hot take I have about our college...",
  "Choose me if you want to survive...",
  "Late night chai or early morning library?",
  "My branch in 3 words...",
  "If I could change one campus rule...",
  "My hidden talent...",
  "My vibe is best described as...",
  "I am looking for a partner to run...",
  "Two truths and a lie about me...",
  "The best way to my heart is...",
  "My go-to comfort food after exams...",
  "A cringe thing I still unironically enjoy...",
  "My most irrational pet peeve...",
  "The song that defines my semester...",
  "My toxic trait is...",
  "I'll fall for you if you...",
  "My 3AM thoughts usually go like...",
  "The quickest way to annoy me...",
  "My favorite procrastination method...",
  "What I'm actually looking for on here...",
  "The most impulsive thing I've done...",
  "My idea of a perfect weekend...",
  "I get overly excited about...",
  "The smallest thing that makes my day...",
  "My favourite memory from college so far...",
  "One thing I absolutely cannot live without...",
  "I'm weirdly good at...",
  "I'd swipe right if you want to teach me...",
  "My biggest flex that no one knows about...",
  "The best compliment I've ever received...",
  "A dealbreaker I didn't know I had...",
  "I'm convinced that I should be famous for...",
  "The most chaotic thing that happened in my wing...",
  "My lecture hall survival kit includes...",
  "I'm basically a professional at...",
  "DM me if you can beat my score in...",
  "My type is best described by...",
  "I finally understand why people say..."
];

export const BRANCHES = [
  "Computer Science & Engineering",
  "Mathematics & Computing",
  "Electrical Engineering",
  "Engineering Physics",
  "Mechanical Engineering",
  "Chemical Engineering",
  "Civil Engineering",
  "Aerospace Engineering",
  "Biotechnology",
  "Metallurgical & Materials Engineering",
  "Textile Technology",
  "Other"
];

export const YEARS = [
  "Freshies",
  "Sophies",
  "Thirdies",
  "Fourthies",
  "Fifthies (Dual/PG)"
];

export const GENDERS = [
  "Male",
  "Female",
  "Non-binary",
  "Other"
];

export const INTENTS = [
  "Dating",
  "Friends",
  "Study Buddy"
];

export const INTEREST_TAGS = [
  "Chai Walks",
  "Coding",
  "Night Canteen",
  "Anime",
  "Gaming",
  "Photography",
  "Fitness",
  "Music Production",
  "Movies & Chill",
  "Reading",
  "Hackathons",
  "Poetry & Writing",
  "Travel & Trekking",
  "Cricket/Football",
  "Shitposting & Memes",
  "Filter Coffee",
  "Cooking",
  "Startups & Tech",
  "Web3 & Crypto",
  "AI & Robotics",
  "UI/UX Design",
  "Guitar/Instruments"
];

export const PRONOUNS_OPTIONS = [
  "he/him",
  "she/her",
  "they/them",
  "he/they",
  "she/they",
  "xe/xem",
  "ze/zir"
];

export const INTEREST_ICONS = {
  'reading': 'book',
  'books': 'book',
  'music': 'music_note',
  'cooking': 'cooking',
  'baking': 'bakery_dining',
  'travel': 'flight',
  'travelling': 'flight',
  'traveling': 'flight',
  'gaming': 'sports_esports',
  'games': 'sports_esports',
  'art': 'palette',
  'painting': 'brush',
  'drawing': 'brush',
  'sports': 'sports_soccer',
  'football': 'sports_football',
  'soccer': 'sports_soccer',
  'basketball': 'sports_basketball',
  'tennis': 'sports_tennis',
  'cricket': 'sports_cricket',
  'badminton': 'sports_tennis',
  'volleyball': 'sports_volleyball',
  'swimming': 'pool',
  'running': 'directions_run',
  'hiking': 'hiking',
  'trekking': 'hiking',
  'yoga': 'self_improvement',
  'meditation': 'self_improvement',
  'fitness': 'fitness_center',
  'gym': 'fitness_center',
  'workout': 'fitness_center',
  'movies': 'movie',
  'films': 'movie',
  'cinema': 'movie',
  'writing': 'edit',
  'coding': 'code',
  'programming': 'code',
  'technology': 'computer',
  'tech': 'computer',
  'shopping': 'shopping_bag',
  'coffee': 'coffee',
  'food': 'restaurant',
  'dining': 'restaurant',
  'dogs': 'pets',
  'cats': 'pets',
  'pets': 'pets',
  'animals': 'pets',
  'nature': 'park',
  'gardening': 'yard',
  'plants': 'yard',
  'singing': 'mic',
  'karaoke': 'mic',
  'piano': 'piano',
  'guitar': 'music_note',
  'instruments': 'music_note',
  'anime': 'tv',
  'fashion': 'checkroom',
  'camping': 'tent',
  'cycling': 'pedal_bike',
  'biking': 'pedal_bike',
  'chess': 'chess',
  'dancing': 'movement',
  'photography': 'camera_alt',
  'photos': 'camera_alt',
  'sleeping': 'bedtime',
  'napping': 'bedtime',
  'eating': 'ramen_dining',
  'drinking': 'local_bar',
  'partying': 'celebration',
  'clubbing': 'nightlife',
  'skating': 'roller_skating',
  'surfing': 'surfing',
  'skiing': 'downhill_skiing',
  'baseball': 'sports_baseball',
  'golf': 'golf_course',
  'boxing': 'sports_mma',
  'martial arts': 'sports_mma',
  'dance': 'movement',
  'theatre': 'theater_comedy',
  'theater': 'theater_comedy',
  'acting': 'theater_comedy',
  'comedy': 'theater_comedy',
  'standup': 'theater_comedy',
  'podcasts': 'podcasts',
  'astrology': 'auto_awesome',
  'star gazing': 'auto_awesome',
  'stargazing': 'auto_awesome',
  'astronomy': 'auto_awesome',
  'volunteering': 'volunteer_activism',
  'social work': 'volunteer_activism',
  'environment': 'eco',
  'sustainability': 'eco',
  'cars': 'directions_car',
  'driving': 'directions_car',
  'motorcycles': 'motorcycle',
  'bikes': 'motorcycle',
  'poetry': 'auto_stories',
  'history': 'history',
  'philosophy': 'psychology',
  'psychology': 'psychology',
  'science': 'science',
  'math': 'calculate',
  'mathematics': 'calculate',
  'board games': 'board_game',
  'cards': 'playing_cards',
  'video editing': 'videocam',
  'editing': 'videocam',
  'design': 'design_services',
  'graphic design': 'design_services',
  'ui design': 'design_services',
  '3d modeling': '3d_rotation',
};

export const INTEREST_ICON_FALLBACKS = [
  'star', 'favorite', 'bolt', 'eco', 'spa', 'whatshot', 'explore',
  'auto_awesome', 'celebration', 'dark_mode', 'light_mode', 'grain',
  'blur_on', 'flash_on', 'wb_sunny', 'nightlight', 'palette',
  'rocket_launch', 'globe', 'water_drop', 'earthquake', 'wind_power'
];

export const COLLEGE_MAP = {
  iitd: 'IIT Delhi',
  iitb: 'IIT Bombay',
  iitk: 'IIT Kanpur',
  iitkgp: 'IIT Kharagpur',
  iitm: 'IIT Madras',
  iitr: 'IIT Roorkee',
  iitg: 'IIT Guwahati',
  iith: 'IIT Hyderabad',
  iitbhu: 'IIT BHU',
  iitism: 'IIT ISM Dhanbad',
};

export const APP_CONSTANTS = {
  PHOTO_LIMIT: 6,
  MAX_INTERESTS: 6,
  MIN_AGE: 18,
  MAX_AGE: 40,
  IMAGE_MAX_DIM: 800,
  IMAGE_JPEG_QUALITY: 0.7,
  DECK_SIZE: 10,
  DEFAULT_AGE_RANGE: { min: 18, max: 30 },
  OTP_EXPIRY_MINUTES: 10,
  OTP_RATE_LIMIT_HOURLY: 5,
  API_RATE_LIMIT: 100,
  API_RATE_LIMIT_WINDOW_MINUTES: 15,
};

```

### ./server/config/cloudinary.js

```
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * 🧹 CLOUDINARY CLEANUP HELPER
 * Extracts the public_id from a Cloudinary URL and permanently destroys the file from cloud storage.
 */
export const deleteCloudinaryFile = async (url) => {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) return;
  try {
    // Matches path after /upload/(v12345/)? up to the file extension
    const match = url.match(/\/upload\/(?:v\d+\/)?([^\.]+)/);
    if (match && match[1]) {
      const publicId = match[1];
      const isAudioOrVideo = /\.(webm|mp3|wav|mp4|m4a)$/i.test(url);
      
      await cloudinary.uploader.destroy(publicId, {
        resource_type: isAudioOrVideo ? 'video' : 'image',
      });
      console.log(`[Cloudinary Cleanup] Destroyed orphaned artifact: ${publicId}`);
    }
  } catch (err) {
    console.error('[Cloudinary Cleanup Error]:', err.message || err);
  }
};

export default cloudinary;

```

### ./server/config/compatQuestions.js

```
export const COMPAT_QUESTIONS = [
  {
    id: 'group_project',
    question: 'Your group project strategy?',
    options: [
      { key: 'carry', label: 'Carry the team' },
      { key: 'vanish', label: 'Do my part & vanish' },
      { key: 'help', label: 'Ask for help' },
      { key: 'wing', label: 'Wing it' },
    ],
  },
  {
    id: 'weekend',
    question: "What's your ideal weekend?",
    options: [
      { key: 'out', label: 'Going out' },
      { key: 'in', label: 'Staying in' },
      { key: 'study', label: 'Studying' },
      { key: 'adventure', label: 'Adventure' },
    ],
  },
  {
    id: 'conflict',
    question: 'How do you handle conflict?',
    options: [
      { key: 'talk', label: 'Talk it out' },
      { key: 'space', label: 'Need space' },
      { key: 'avoid', label: 'Avoid it' },
      { key: 'loud', label: 'Get loud then apologize' },
    ],
  },
  {
    id: 'first_date',
    question: 'Your ideal first date?',
    options: [
      { key: 'chai', label: 'Chai at canteen' },
      { key: 'walk', label: 'Walk around campus' },
      { key: 'movie', label: 'Movie night' },
      { key: 'trip', label: 'Adventure trip' },
    ],
  },
  {
    id: 'social',
    question: 'How social are you?',
    options: [
      { key: 'very', label: 'Very social' },
      { key: 'small', label: 'Small circles' },
      { key: 'home', label: 'Homebody' },
      { key: 'depends', label: 'Depends' },
    ],
  },
  {
    id: 'comm_style',
    question: "What's your communication style?",
    options: [
      { key: 'frequent', label: 'Frequent messages' },
      { key: 'deep', label: 'Few but deep' },
      { key: 'meme', label: 'Meme sender' },
      { key: 'call', label: 'Call person' },
    ],
  },
  {
    id: 'looking_for',
    question: 'What are you looking for?',
    options: [
      { key: 'serious', label: 'Something serious' },
      { key: 'see', label: "Let's see where it goes" },
      { key: 'friends', label: 'Just friends' },
      { key: 'unsure', label: 'Not sure yet' },
    ],
  },
];

// Similarity matrix: 1.0 = same, 0.6 = similar, 0.2 = different
const SIMILAR = 0.6;
const DIFFERENT = 0.2;

export const COMPAT_MATRIX = {
  group_project: {
    carry:  { carry: 1, vanish: SIMILAR, help: DIFFERENT, wing: DIFFERENT },
    vanish: { carry: SIMILAR, vanish: 1, help: DIFFERENT, wing: SIMILAR },
    help:   { carry: DIFFERENT, vanish: DIFFERENT, help: 1, wing: SIMILAR },
    wing:   { carry: DIFFERENT, vanish: SIMILAR, help: SIMILAR, wing: 1 },
  },
  weekend: {
    out:       { out: 1, in: DIFFERENT, study: DIFFERENT, adventure: SIMILAR },
    in:        { out: DIFFERENT, in: 1, study: SIMILAR, adventure: DIFFERENT },
    study:     { out: DIFFERENT, in: SIMILAR, study: 1, adventure: DIFFERENT },
    adventure: { out: SIMILAR, in: DIFFERENT, study: DIFFERENT, adventure: 1 },
  },
  conflict: {
    talk:  { talk: 1, space: SIMILAR, avoid: DIFFERENT, loud: DIFFERENT },
    space: { talk: SIMILAR, space: 1, avoid: DIFFERENT, loud: DIFFERENT },
    avoid: { talk: DIFFERENT, space: DIFFERENT, avoid: 1, loud: SIMILAR },
    loud:  { talk: DIFFERENT, space: DIFFERENT, avoid: SIMILAR, loud: 1 },
  },
  first_date: {
    chai:  { chai: 1, walk: SIMILAR, movie: DIFFERENT, trip: DIFFERENT },
    walk:  { chai: SIMILAR, walk: 1, movie: DIFFERENT, trip: SIMILAR },
    movie: { chai: DIFFERENT, walk: DIFFERENT, movie: 1, trip: SIMILAR },
    trip:  { chai: DIFFERENT, walk: SIMILAR, movie: SIMILAR, trip: 1 },
  },
  social: {
    very:    { very: 1, small: DIFFERENT, home: DIFFERENT, depends: SIMILAR },
    small:   { very: DIFFERENT, small: 1, home: SIMILAR, depends: DIFFERENT },
    home:    { very: DIFFERENT, small: SIMILAR, home: 1, depends: DIFFERENT },
    depends: { very: SIMILAR, small: DIFFERENT, home: DIFFERENT, depends: 1 },
  },
  comm_style: {
    frequent: { frequent: 1, deep: DIFFERENT, meme: SIMILAR, call: SIMILAR },
    deep:     { frequent: DIFFERENT, deep: 1, meme: DIFFERENT, call: SIMILAR },
    meme:     { frequent: SIMILAR, deep: DIFFERENT, meme: 1, call: DIFFERENT },
    call:     { frequent: SIMILAR, deep: SIMILAR, meme: DIFFERENT, call: 1 },
  },
  looking_for: {
    serious:  { serious: 1, see: SIMILAR, friends: DIFFERENT, unsure: DIFFERENT },
    see:      { serious: SIMILAR, see: 1, friends: DIFFERENT, unsure: SIMILAR },
    friends:  { serious: DIFFERENT, see: DIFFERENT, friends: 1, unsure: SIMILAR },
    unsure:   { serious: DIFFERENT, see: SIMILAR, friends: SIMILAR, unsure: 1 },
  },
};

/**
 * Compute compatibility score between two users' answers.
 * @param {Array} answersA - [{question: 'group_project', answer: 'carry'}, ...]
 * @param {Array} answersB - [{question: 'group_project', answer: 'wing'}, ...]
 * @returns {number} Score 0-100
 */
export function computeCompatibility(answersA, answersB) {
  if (!answersA?.length || !answersB?.length) return null;

  let total = 0;
  let matched = 0;

  for (const q of COMPAT_QUESTIONS) {
    const aA = answersA.find(a => a.question === q.id);
    const aB = answersB.find(a => a.question === q.id);
    if (aA && aB && COMPAT_MATRIX[q.id]?.[aA.answer]?.[aB.answer] != null) {
      total += COMPAT_MATRIX[q.id][aA.answer][aB.answer];
      matched++;
    }
  }

  if (matched === 0) return null;
  return Math.round((total / matched) * 100);
}

/**
 * Get match breakdown for top 3 most interesting areas.
 * @param {Array} answersA
 * @param {Array} answersB
 * @returns {Array} [{question, answerA, answerB, score}, ...]
 */
export function getCompatBreakdown(answersA, answersB) {
  if (!answersA?.length || !answersB?.length) return [];

  const breakdown = [];
  for (const q of COMPAT_QUESTIONS) {
    const aA = answersA.find(a => a.question === q.id);
    const aB = answersB.find(a => a.question === q.id);
    if (aA && aB && COMPAT_MATRIX[q.id]?.[aA.answer]?.[aB.answer] != null) {
      const score = COMPAT_MATRIX[q.id][aA.answer][aB.answer];
      const labelA = q.options.find(o => o.key === aA.answer)?.label || aA.answer;
      const labelB = q.options.find(o => o.key === aB.answer)?.label || aB.answer;
      breakdown.push({
        question: q.question,
        answerA: labelA,
        answerB: labelB,
        score,
      });
    }
  }

  // Sort by score descending, return top 3
  return breakdown.sort((a, b) => b.score - a.score).slice(0, 3);
}

```

### ./server/config/db.js

```
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;

```

### ./server/index.js

```
import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import dotenv from 'dotenv';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Config
import connectDB from './config/db.js';
import { socketHandler } from './socket/chat.js';

// Routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import discoverRoutes from './routes/discover.js';
import matchRoutes from './routes/matches.js';
import messageRoutes from './routes/messages.js';
import configRoutes from './routes/config.js';
import adminRoutes from './routes/admin.js';
import uploadRoutes from './routes/upload.js';
import notificationRoutes from './routes/notifications.js';
import reportRoutes from './routes/report.js';
import waitlistRoutes from './routes/waitlist.js';

dotenv.config();

// Initialize Sentry (must run after dotenv.config so SENTRY_DSN is loaded)
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [nodeProfilingIntegration(), Sentry.expressIntegration()],
    tracesSampleRate: 0.2,
    profilesSampleRate: 0.2,
  });
}

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Warn about missing optional services
if (!process.env.RESEND_API_KEY) {
  console.warn('⚠️  Resend API key not configured — OTP codes will be logged to console only (users won\'t receive emails)');
}
if (!process.env.CLOUDINARY_CLOUD_NAME) {
  console.warn('⚠️  Cloudinary not configured — photo uploads will fail');
}
if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  console.warn('⚠️  VAPID keys not configured — web push notifications will be disabled');
}
if (process.env.ALLOW_ALL_EMAILS !== 'true') {
  console.log('🔒 Email domain restricted to .ac.in addresses only');
} else {
  console.warn('⚠️  ALLOW_ALL_EMAILS=true — any email domain can sign up. Set to false in production.');
}

// Connect to Database
connectDB();

const app = express();
app.set('trust proxy', 1);
const server = http.createServer(app);

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// 🔒 STRICT CORS WHITELIST: Prevents unauthorized third-party apps from making credentialed requests
const corsOrigins = new Set([
  FRONTEND_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);

const corsOriginFunction = (origin, callback) => {
  // Allow requests with no origin (mobile apps, curl, or local dev)
  if (!origin || process.env.NODE_ENV === 'development') return callback(null, true);

  if (corsOrigins.has(origin)) {
    return callback(null, true);
  }

  // Automatically allow local network IPs (LAN/Wi-Fi) during development & testing
  if (origin.startsWith('http://10.') || origin.startsWith('http://192.168.') || origin.startsWith('http://172.')) {
    return callback(null, true);
  }

  console.warn(`[CORS Blocked] Unauthorized origin attempted connection: ${origin}`);
  callback(new Error('Not allowed by CORS'));
};

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: corsOriginFunction,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Attach socket server to express app so it can be accessed in routing files
app.set('io', io);

// Configure Socket event handlers
socketHandler(io);

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // REMOVED 'unsafe-eval' to block eval() execution.
      // 'unsafe-inline' is retained temporarily due to <style> tags in React components.
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'data:', 'https://*.cloudinary.com', 'https://images.unsplash.com', 'https://res.cloudinary.com'],
      connectSrc: [
        "'self'", 
        'http://localhost:*', 'ws://localhost:*', 
        'http://127.0.0.1:*', 'ws://127.0.0.1:*',
        'http://10.*:*', 'ws://10.*:*',
        'http://192.168.*:*', 'ws://192.168.*:*',
        'http://172.*:*', 'ws://172.*:*',
        'https://*.onrender.com', 'wss://*.onrender.com'
      ],

      // NEW DEFENSIVE DIRECTIVES
      frameAncestors: ["'self'"], // Prevents clickjacking
      formAction: ["'self'"],     // Prevents form hijacking
      baseUri: ["'self'"],        // Prevents base tag injection
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  originAgentCluster: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: corsOriginFunction,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  exposedHeaders: ['x-new-token'],
}));
app.use(cookieParser());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));
app.use(mongoSanitize());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: Number(process.env.API_GENERAL_MAX) || 500,
  message: { message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/discover', discoverRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/config', configRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/waitlist', waitlistRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve production client build
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));

// Base Status Route
app.get('/', (req, res) => {
  res.json({ status: 'active', message: 'Matchalize API Server is running' });
});

// Serve client app for all non-API routes (SPA fallback)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) next();
  });
});

// Sentry error handler (v8+ API; must be after routes, before the generic handler)
if (process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

// Centralized Error Handler
app.use((err, req, res, next) => {
  // 1. If it's our custom AppError, send the structured response
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
    });
  }

  // 2. If it's an unexpected crash, log to Sentry and send a generic 500
  console.error('💥 UNEXPECTED ERROR:', err);
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(err);
  }
  
  res.status(500).json({
    success: false,
    message: 'The archival ledger encountered an unexpected tear. Please try again.',
    code: 'INTERNAL_SERVER_ERROR',
  });
});

// Start Server
const PORT = process.env.PORT || 5005;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

```

### ./server/middleware/admin.js

```
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const COOKIE_NAME = 'matchalize_jwt';

export const adminProtect = async (req, res, next) => {
  let token = null;
  if (req.cookies && req.cookies[COOKIE_NAME]) {
    token = req.cookies[COOKIE_NAME];
  } else if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('email name suspended isDeleted').lean();

    if (!user) return res.status(401).json({ message: 'User not found' });
    if (user.suspended) return res.status(403).json({ message: 'Account suspended' });
    if (user.isDeleted) return res.status(403).json({ message: 'Account deleted' });

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      console.error('ADMIN_EMAIL not set in .env — admin routes are disabled');
      return res.status(503).json({ message: 'Admin access not configured' });
    }

    if (user.email.toLowerCase() !== adminEmail.toLowerCase()) {
      return res.status(403).json({ message: 'Not an admin' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Admin auth error:', error.message);
    return res.status(401).json({ message: 'Token invalid' });
  }
};

```

### ./server/middleware/auth.js

```
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const COOKIE_NAME = 'matchalize_jwt';
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Extracts the JWT from httpOnly cookie (primary) or Authorization header (fallback).
 */
const extractToken = (req) => {
  if (req.cookies && req.cookies[COOKIE_NAME]) {
    return req.cookies[COOKIE_NAME];
  }
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    return req.headers.authorization.split(' ')[1];
  }
  return null;
};

/**
 * Sets the JWT as an httpOnly cookie. Called on login and token refresh.
 */
export const setAuthCookie = (res, token) => {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

/**
 * Clears the auth cookie. Called on logout.
 */
export const clearAuthCookie = (res) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/',
  });
};

export const protect = async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    // SUSPENDED CHECK: Reject suspended users immediately on every request
    if (req.user.suspended) {
      return res.status(403).json({ message: 'Account suspended. Please contact support.', suspended: true });
    }

    // DELETED CHECK: Reject soft-deleted users on every request
    if (req.user.isDeleted) {
      return res.status(403).json({ message: 'Account has been deleted.', deleted: true });
    }

    // MULTI-DEVICE CHECK: Reject tokens issued before the last global logout
    const issuedAt = decoded.iat * 1000;
    if (req.user.lastLogoutAt && issuedAt < req.user.lastLogoutAt.getTime()) {
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }

    // SLIDING EXPIRATION: If token is older than 6 days, issue a new one
    const sixDaysMs = 6 * 24 * 60 * 60 * 1000;
    if (Date.now() - issuedAt > sixDaysMs) {
      const newToken = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      setAuthCookie(res, newToken);
      res.setHeader('x-new-token', newToken);
    }

    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

```

### ./server/middleware/blockFilter.js

```
import Block from '../models/Block.js';

/**
 * Returns a MongoDB query fragment that excludes blocked users
 * from any query that fetches users by _id.
 *
 * @param {ObjectId} userId - The authenticated user's ID
 * @returns {Promise<Object>} - Query fragment like { _id: { $nin: [...] } }
 */
export async function getBlockExclusionQuery(userId) {
  const blocks = await Block.find({
    $or: [{ blocker: userId }, { blocked: userId }],
  }).lean();

  const blockedIds = blocks.map((b) =>
    b.blocker.toString() === userId.toString() ? b.blocked : b.blocker
  );

  if (blockedIds.length === 0) return {};
  return { _id: { $nin: blockedIds } };
}

/**
 * Checks if two specific users have a block relationship.
 *
 * @param {ObjectId} userA
 * @param {ObjectId} userB
 * @returns {Promise<boolean>}
 */
export async function areBlocked(userA, userB) {
  const block = await Block.findOne({
    $or: [
      { blocker: userA, blocked: userB },
      { blocker: userB, blocked: userA },
    ],
  });
  return !!block;
}

```

### ./server/middleware/rateLimiters.js

```
import rateLimit from 'express-rate-limit';

// Limit message sending to 30 messages per 10 minutes per user
export const messageLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  message: { message: 'Too many messages sent. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limit discover actions (likes/passes) to 100 per 10 minutes per user
export const discoverLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  message: { message: 'Too many actions. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limit OTP verification attempts to prevent brute-force and DoS
// 15 attempts per 15 minutes per IP address.
// This allows a small group on shared Wi-Fi to make typos, but stops automated scripts dead.
export const verifyOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.OTP_VERIFY_MAX) || 15,
  keyGenerator: (req) => req.ip,
  message: { 
    message: 'Too many verification attempts. Please wait 15 minutes before trying again.' 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limit OTP requests by IP to prevent spamming across multiple emails
export const otpIpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.OTP_IP_LIMIT_MAX) || 10,
  keyGenerator: (req) => req.ip,
  message: { message: 'Too many verification requests from this network. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

```

### ./server/middleware/validate.js

```
import { body, validationResult } from 'express-validator';

export { body };

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

```

### ./server/models/Analytics.js

```
import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    event: {
      type: String,
      required: true,
      enum: ['ONBOARDING_STEP', 'ONBOARDING_COMPLETE', 'ONBOARDING_ABANDONED'],
    },
    step: {
      type: Number,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Analytics', analyticsSchema);
```

### ./server/models/Block.js

```
import mongoose from 'mongoose';

const blockSchema = new mongoose.Schema({
  blocker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  blocked: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

blockSchema.index({ blocker: 1, blocked: 1 }, { unique: true });

const Block = mongoose.model('Block', blockSchema);
export default Block;

```

### ./server/models/Interaction.js

```
import mongoose from 'mongoose';

const interactionSchema = new mongoose.Schema(
  {
    actorId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    targetId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    actionType: { 
      type: String, 
      enum: ['archive', 'letter', 'seal_stamp', 'accept_letter', 'accept_seal'], 
      required: true 
    },
    targetArtifact: { 
      type: String, 
      default: null 
      // e.g., 'photo_1', 'whisper_0' - stores exactly what they tapped
    },
    letterContent: { 
      type: String, 
      maxlength: 140, 
      default: null 
    },
    cooldownExpiresAt: { 
      type: Date, 
      default: null 
      // Powered by our 7-day re-queue logic for passed profiles (Interaction History)
    },
  },
  {
    timestamps: true,
  }
);

// High-performance compound indexes for building the Discover deck instantly
interactionSchema.index({ actorId: 1, targetId: 1 });
interactionSchema.index({ actorId: 1, cooldownExpiresAt: 1 });
interactionSchema.index(
  { actorId: 1, actionType: 1, createdAt: -1 },
  { name: 'daily_limit_query_index' }
);
interactionSchema.index({ targetId: 1, actionType: 1 });

const Interaction = mongoose.model('Interaction', interactionSchema);
export default Interaction;

```

### ./server/models/Match.js

```
import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema(
  {
    pairKey: {
      type: String,
      required: true,
      unique: true,
      // Always formatted as 'LowerObjectId__HigherObjectId'
    },
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    unlockedByInteractionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interaction',
      required: true,
      // Points back to the exact letter that sparked the match
    },
  },
  {
    timestamps: true,
  }
);

matchSchema.index({ users: 1, isActive: 1 });

const Match = mongoose.model('Match', matchSchema);
export default Match;

```

### ./server/models/Message.js

```
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match',
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['text', 'image', 'opening_letter', 'audio'],
      default: 'text',
    },
    text: {
      type: String,
      trim: true,
      default: '',
    },
    clientMsgId: {
      type: String,
      unique: true,
      sparse: true,
    },
    image: {
      type: String,
      default: '',
    },
    mediaUrl: {
      type: String,
      default: '',
    },
    caption: {
      type: String,
      default: '',
    },
    deliveryStatus: {
      type: String,
      enum: ['pending', 'sent', 'read'],
      default: 'sent',
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    reactions: [
      {
        emoji: { type: String, required: true },
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      },
    ],
    deleted: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ matchId: 1, createdAt: 1 });
// 🚀 COLLISION-PROOF PAGINATION: Instant ObjectId-based cursor queries
messageSchema.index({ matchId: 1, _id: -1 });

// Speeds up moderation queries and global user cleanup operations
messageSchema.index({ senderId: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);
export default Message;

```

### ./server/models/Notification.js

```
import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['new_letter', 'priority_seal'],
      required: true,
    },
    interactionRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interaction',
      required: true,
      // Links to the exact letter and photo they liked
    },
    isCleared: {
      type: Boolean,
      default: false,
      // Flips to true the moment they hit [Accept] or [Archive]
    },
  },
  {
    timestamps: true,
  }
);

// Extremely fast lookup for the active Instagram-style tray
notificationSchema.index({ recipientId: 1, isCleared: 1, createdAt: -1 });

// Auto-delete cleared notifications after 30 days to prevent database bloat
notificationSchema.index(
  { createdAt: 1 }, 
  { 
    expireAfterSeconds: 30 * 24 * 60 * 60,
    partialFilterExpression: { isCleared: true } 
  }
);

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;

```

### ./server/models/OTP.js

```
import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    otp: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // Document will expire at the specified date
    },
    attempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for rate limiting queries (find by email within last hour)
otpSchema.index({ email: 1, createdAt: 1 });

const OTP = mongoose.model('OTP', otpSchema);
export default OTP;

```

### ./server/models/Report.js

```
import mongoose from 'mongoose';

export const REPORT_REASONS = [
  'Inappropriate photos',
  'Harassment or bullying',
  'Fake profile or spam',
  'Underage user',
  'Other',
];

const reportSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reported: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, enum: REPORT_REASONS, required: true },
  details: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'dismissed', 'actioned'],
    default: 'pending',
  },
  createdAt: { type: Date, default: Date.now },
});

reportSchema.index({ reporter: 1, reported: 1 }, { unique: true });

const Report = mongoose.model('Report', reportSchema);
export default Report;

```

### ./server/models/Setting.js

```
import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      unique: true,
      required: true,
      enum: ['appConfig'], // Can be expanded later
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Setting', settingSchema);
```

### ./server/models/User.js

```
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    college: {
      type: String,
      default: '',
    },
    collegeCode: {
      type: String,
      default: '',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isOnboarded: {
      type: Boolean,
      default: false,
    },
    name: {
      type: String,
      trim: true,
      default: '',
    },
    age: {
      type: Number,
      default: null,
    },
    gender: {
      type: String,
      default: '',
    },
    pronouns: {
      type: String,
      trim: true,
      default: '',
    },
    branch: {
      type: String,
      default: '',
    },
    year: {
      type: String,
      default: '',
    },
    hostel: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      trim: true,
      default: '',
    },
    bioPhoto: {
      type: String,
      default: '',
    },
    prompts: [
      {
        question: String,
        answer: String,
        photoUrl: String,
      },
    ],
    photos: {
      type: [String],
      default: [],
    },
    intent: {
      type: [String],
      default: [],
    },
    interestedIn: {
      type: [String],
      default: [],
    },
    ageRange: {
      min: {
        type: Number,
        default: 18,
      },
      max: {
        type: Number,
        default: 30,
      },
    },
    interests: {
      type: [String],
      default: [],
    },
    compatAnswers: {
      type: [
        {
          question: { type: String, required: true },
          answer: { type: String, required: true },
        },
      ],
      default: [],
    },
    onboardingStep: {
      type: Number,
      default: 1,
    },
    onboardingData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    lastLogoutAt: {
      type: Date,
      default: null,
    },
    pushSubscription: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    suspended: {
      type: Boolean,
      default: false,
    },
    suspendedAt: {
      type: Date,
      default: null,
    },
    suspendedReason: {
      type: String,
      default: '',
    },
    isGhost: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    // Report system — shadowban fields
    shadowbanScore: {
      type: Number,
      default: 0,
    },
    shadowbannedAt: {
      type: Date,
      default: null,
    },
    contentFrozen: {
      type: Boolean,
      default: false,
    },
    adminNotes: {
      type: String,
      default: '',
    },
    // 🚀 DETERMINISTIC SEED: Allows instant indexed random sampling without $sample
    randomSeed: {
      type: Number,
      default: () => Math.random(),
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ name: 'text', email: 'text' });
userSchema.index(
  { collegeCode: 1, isOnboarded: 1, isGhost: 1, isVerified: 1, suspended: 1, isDeleted: 1, shadowbannedAt: 1, randomSeed: 1 },
  { name: 'discover_deck_filter_index' }
);

const User = mongoose.model('User', userSchema);
export default User;

```

### ./server/models/Waitlist.js

```
import mongoose from 'mongoose';
import crypto from 'crypto';

const waitlistSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: { type: String, trim: true, default: '' },
    college: { type: String, default: 'IIT Bombay' },
    collegeCode: { type: String, default: 'iitb' },
    branch: { type: String, default: '' },
    year: { type: String, default: '' },

    // Unique 6-char referral code they share
    referralCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    // Who referred them (ObjectId or null)
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: 'Waitlist',
    },
    // Current queue position (recomputed on referral events)
    position: { type: Number, required: true, index: true },
    // How many people they've referred
    referralCount: { type: Number, default: 0 },
    // Total spots jumped via referrals
    spotsJumped: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ['pending', 'invited', 'registered'],
      default: 'pending',
    },
    // Tier based on position
    tier: {
      type: String,
      enum: ['charter', 'founding', 'original'],
      default: 'original',
    },

    // Daily check-in streak (engagement loop)
    lastCheckIn: { type: Date, default: null },
    checkInStreak: { type: Number, default: 0 },

    joinedAt: { type: Date, default: Date.now },
    invitedAt: { type: Date, default: null },
    registeredAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Single source of truth for tier thresholds (mirrored in frontend)
waitlistSchema.statics.TIER_THRESHOLDS = { charter: 50, founding: 250 };

// Generate a unique 6-char alphanumeric referral code (no I/O/0/1 to avoid confusion)
waitlistSchema.statics.generateReferralCode = async function () {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  let exists = true;
  while (exists) {
    code = Array.from({ length: 6 }, () => chars[crypto.randomInt(chars.length)]).join('');
    exists = await this.findOne({ referralCode: code });
  }
  return code;
};

waitlistSchema.methods.computeTier = function () {
  const T = this.constructor.TIER_THRESHOLDS;
  if (this.position <= T.charter) return 'charter';
  if (this.position <= T.founding) return 'founding';
  return 'original';
};

const Waitlist = mongoose.model('Waitlist', waitlistSchema);
export default Waitlist;
```

### ./server/routes/admin.js

```
import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Report from '../models/Report.js';
import Match from '../models/Match.js';
import Message from '../models/Message.js';
import Setting from '../models/Setting.js';
import { adminProtect } from '../middleware/admin.js';

const router = express.Router();
router.use(adminProtect);

// ─── Helpers ───
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const VALID_REPORT_STATUSES = ['pending', 'reviewed', 'dismissed', 'actioned'];

// ─── STATS ───
router.get('/stats', async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const [totalUsers, newToday, active7d, active30d, pendingReports, activeBans, ghostUsers] = await Promise.all([
      User.countDocuments({ isDeleted: false }),
      User.countDocuments({ isDeleted: false, createdAt: { $gte: todayStart } }),
      User.countDocuments({ isDeleted: false, lastActive: { $gte: sevenDaysAgo } }),
      User.countDocuments({ isDeleted: false, lastActive: { $gte: thirtyDaysAgo } }),
      Report.countDocuments({ status: 'pending' }),
      User.countDocuments({ isDeleted: false, suspended: true }),
      User.countDocuments({ isDeleted: false, isGhost: true }),
    ]);

    res.json({
      totalUsers,
      newToday,
      active7d,
      active30d,
      pendingReports,
      activeBans,
      activeShadowbans: ghostUsers,
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

// ─── REPORTS ───
router.get('/reports', async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const perPage = Math.min(Number(req.query.perPage) || 15, 100);
    const { status, search, reason } = req.query;
    const skip = (page - 1) * perPage;

    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (reason && reason !== 'all') filter.reason = reason;

    if (search) {
      const safeSearch = escapeRegex(search);
      const searchUsers = await User.find({
        $or: [
          { name: { $regex: safeSearch, $options: 'i' } },
          { email: { $regex: safeSearch, $options: 'i' } },
        ],
      }).select('_id').lean();
      const userIds = searchUsers.map(u => u._id);
      filter.$or = [
        { reporter: { $in: userIds } },
        { reported: { $in: userIds } },
      ];
    }

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .populate('reporter', 'name email photos')
        .populate('reported', 'name email photos suspended isGhost')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPage)
        .lean(),
      Report.countDocuments(filter),
    ]);

    const reportedIds = [...new Set(reports.map(r => r.reported?._id?.toString()))];
    const reportCounts = {};
    if (reportedIds.length) {
      const counts = await Report.aggregate([
        { $match: { reported: { $in: reportedIds }, status: { $ne: 'dismissed' } } },
        { $group: { _id: '$reported', count: { $sum: 1 } } },
      ]);
      counts.forEach(c => { reportCounts[c._id.toString()] = c.count; });
    }

    const data = reports.map(r => ({
      _id: r._id,
      reporter: {
        name: r.reporter?.name || 'Unknown',
        email: r.reporter?.email || '',
        photo: r.reporter?.photos?.[0] || '',
      },
      reported: {
        name: r.reported?.name || 'Unknown',
        email: r.reported?.email || '',
        photo: r.reported?.photos?.[0] || '',
        suspended: r.reported?.suspended || false,
        shadowbanned: r.reported?.isGhost || false,
        reportCount: reportCounts[r.reported?._id?.toString()] || 0,
      },
      reason: r.reason,
      details: r.details,
      status: r.status,
      createdAt: r.createdAt,
    }));

    res.json({
      data,
      pagination: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
    });
  } catch (err) {
    console.error('Admin reports error:', err);
    res.status(500).json({ message: 'Failed to fetch reports' });
  }
});

router.put('/reports/bulk', async (req, res) => {
  try {
    const { ids, status } = req.body;
    if (!Array.isArray(ids) || !ids.length || !status) {
      return res.status(400).json({ message: 'ids (array) and status required' });
    }
    if (ids.some(id => !mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({ message: 'One or more invalid report IDs' });
    }
    if (!VALID_REPORT_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${VALID_REPORT_STATUSES.join(', ')}` });
    }
    await Report.updateMany(
      { _id: { $in: ids } },
      { $set: { status } }
    );
    res.json({ message: `${ids.length} reports updated to ${status}` });
  } catch (err) {
    console.error('Admin bulk update error:', err);
    res.status(500).json({ message: 'Failed to bulk update' });
  }
});

router.put('/reports/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid report ID' });
    }

    const { status } = req.body;
    if (status && !VALID_REPORT_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${VALID_REPORT_STATUSES.join(', ')}` });
    }

    const update = {};
    if (status) update.status = status;

    const report = await Report.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!report) return res.status(404).json({ message: 'Report not found' });

    res.json({ message: 'Report updated', report });
  } catch (err) {
    console.error('Admin report update error:', err);
    res.status(500).json({ message: 'Failed to update report' });
  }
});

// ─── USERS ───
router.get('/users', async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const perPage = Math.min(Number(req.query.perPage) || 15, 100);
    const { status, search } = req.query;
    const skip = (page - 1) * perPage;

    const filter = { isDeleted: false };
    if (status === 'active') { filter.suspended = false; filter.isGhost = false; }
    else if (status === 'suspended') filter.suspended = true;
    else if (status === 'shadowbanned') filter.isGhost = true;

    if (search) {
      const safeSearch = escapeRegex(search);
      filter.$or = [
        { name: { $regex: safeSearch, $options: 'i' } },
        { email: { $regex: safeSearch, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('name email college branch year gender photos suspended suspendedReason isGhost isDeleted lastActive createdAt adminNotes')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPage)
        .lean(),
      User.countDocuments(filter),
    ]);

    const userIds = users.map(u => u._id);
    const reportCounts = {};
    if (userIds.length) {
      const counts = await Report.aggregate([
        { $match: { reported: { $in: userIds } } },
        { $group: {
          _id: '$reported',
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        } },
      ]);
      counts.forEach(c => { reportCounts[c._id.toString()] = c; });
    }

    const data = users.map(u => ({
      ...u,
      reportStats: {
        count: reportCounts[u._id.toString()]?.total || 0,
        pendingCount: reportCounts[u._id.toString()]?.pending || 0,
      },
    }));

    res.json({
      data,
      pagination: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
    });
  } catch (err) {
    console.error('Admin users error:', err);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-compatAnswers -onboardingData -pushSubscription')
      .lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    const reportCount = await Report.countDocuments({ reported: user._id });
    const pendingReports = await Report.countDocuments({ reported: user._id, status: 'pending' });
    const matchCount = await Match.countDocuments({ users: user._id, isActive: true });

    res.json({
      ...user,
      reportStats: { count: reportCount, pendingCount: pendingReports },
      matchCount,
    });
  } catch (err) {
    console.error('Admin user detail error:', err);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    const { suspended, suspendedReason, isGhost, adminNotes } = req.body;
    const update = {};

    if (suspended !== undefined) {
      if (typeof suspended !== 'boolean') {
        return res.status(400).json({ message: 'suspended must be a boolean' });
      }
      update.suspended = suspended;
      update.suspendedAt = suspended ? new Date() : null;
      update.suspendedReason = suspended ? (suspendedReason || null) : null;
    }
    if (isGhost !== undefined) {
      if (typeof isGhost !== 'boolean') {
        return res.status(400).json({ message: 'isGhost must be a boolean' });
      }
      update.isGhost = isGhost;
    }
    if (adminNotes !== undefined) {
      if (typeof adminNotes !== 'string') {
        return res.status(400).json({ message: 'adminNotes must be a string' });
      }
      update.adminNotes = adminNotes;
    }

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true })
      .select('name email suspended suspendedReason isGhost adminNotes');
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (suspended) {
      const io = req.app.get('io');
      if (io) {
        io.to(req.params.id.toString()).emit('force-disconnect', {
          reason: suspendedReason || 'Account suspended',
        });
      }
    }

    res.json({ message: 'User updated', user });
  } catch (err) {
    console.error('Admin user update error:', err);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

router.post('/users/:id/disconnect', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const io = req.app.get('io');
    if (io) {
      io.to(req.params.id.toString()).emit('force-disconnect', {
        reason: 'Admin forced disconnect',
      });
    }
    res.json({ message: 'Disconnect signal sent' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to disconnect user' });
  }
});

// ─── ANALYTICS ───
router.get('/analytics', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [dailySignups, dailyReports, dailyMatches, dailyMessages, dailyActive] = await Promise.all([
      User.aggregate([
        { $match: { isDeleted: false, createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Report.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Match.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Message.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo }, deleted: false } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      User.aggregate([
        { $match: { isDeleted: false, lastActive: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$lastActive' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    res.json({
      dailySignups: dailySignups.map(d => ({ date: d._id, count: d.count })),
      dailyReports: dailyReports.map(d => ({ date: d._id, count: d.count })),
      dailyMatches: dailyMatches.map(d => ({ date: d._id, count: d.count })),
      dailyMessages: dailyMessages.map(d => ({ date: d._id, count: d.count })),
      dailyActive: dailyActive.map(d => ({ date: d._id, count: d.count })),
    });
  } catch (err) {
    console.error('Admin analytics error:', err);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
});

// ─── SETTINGS ───
router.get('/settings', async (req, res) => {
  try {
    const settings = await Setting.find().lean();
    const obj = {};
    settings.forEach(s => { obj[s.key] = s.value; });
    res.json(obj);
  } catch (err) {
    console.error('Admin settings error:', err);
    res.status(500).json({ message: 'Failed to fetch settings' });
  }
});

router.put('/settings', async (req, res) => {
  try {
    const entries = Object.entries(req.body || {});
    if (!entries.length) {
      return res.status(400).json({ message: 'No settings provided' });
    }
    if (entries.length > 50) {
      return res.status(400).json({ message: 'Too many settings at once' });
    }

    for (const [key, value] of entries) {
      if (key === 'shadowbanThreshold') {
        if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1000) {
          return res.status(400).json({ message: 'shadowbanThreshold must be a finite number between 0 and 1000' });
        }
      } else if (typeof value === 'string' && value.trim().length > 50) {
        return res.status(400).json({ message: `${key} must be 50 characters or fewer` });
      }
    }

    const ops = entries.map(([key, value]) =>
      Setting.findOneAndUpdate({ key }, { key, value }, { upsert: true, new: true })
    );
    await Promise.all(ops);
    res.json({ message: 'Settings saved' });
  } catch (err) {
    console.error('Admin settings save error:', err);
    res.status(500).json({ message: 'Failed to save settings' });
  }
});

export default router;

```

### ./server/routes/auth.js

```
import express from 'express';
import { body } from '../middleware/validate.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import OTP from '../models/OTP.js';
import User from '../models/User.js';
import { validate } from '../middleware/validate.js';
import { protect, setAuthCookie, clearAuthCookie } from '../middleware/auth.js';
import { sendOTP } from '../utils/email.js';
import { COLLEGE_MAP } from '../config/appData.js';
import { verifyOtpLimiter, otpIpLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();

// Generate 6-digit cryptographically secure code
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Helper to extract college code and name
const extractCollegeDetails = (email) => {
  const parts = email.split('@');
  if (parts.length < 2) return { college: '', collegeCode: '' };
  const domain = parts[1].toLowerCase();
  
  // Example: someone@iitb.ac.in -> domain: iitb.ac.in -> code: iitb
  const domainParts = domain.split('.');
  let collegeCode = domainParts[0];
  
  // Map common college codes to readable names
  let college = COLLEGE_MAP[collegeCode] || domain;
  if (collegeCode === 'gmail') collegeCode = 'iit'; // fallback/dev code

  return { college, collegeCode };
};

// @route   POST /api/auth/send-otp
// @desc    Generate OTP and send it via email
// @access  Public
router.post(
  '/send-otp',
  otpIpLimiter,
  [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email address')
      .custom((value) => {
        // Enforce .ac.in domain except when ALLOW_ALL_EMAILS is true
        const isAcademic = value.endsWith('.ac.in');
        const allowAll = process.env.ALLOW_ALL_EMAILS === 'true';
        if (!isAcademic && !allowAll) {
          throw new Error('Only academic (.ac.in) emails are allowed');
        }
        return true;
      }),
  ],
  validate,
  async (req, res) => {
    const { email } = req.body;

    try {
      // Rate limiting: check recent OTP requests (optional, but let's keep it robust)
      const recentOTPs = await OTP.find({
        email,
        createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) }, // last hour
      });

      if (recentOTPs.length >= 5) {
        return res.status(429).json({
          message: 'Too many verification codes requested. Please try again in an hour.',
        });
      }

      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins expiry

      // Save to DB
      await OTP.create({
        email,
        otp,
        expiresAt,
      });

      // Send OTP
      await sendOTP(email, otp);

      res.status(200).json({ message: 'Verification code sent successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error, could not send code' });
    }
  }
);

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP and return JWT token
// @access  Public
router.post(
  '/verify-otp',
  verifyOtpLimiter,
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  ],
  validate,
  async (req, res) => {
    const { email, otp } = req.body;

    try {
      const record = await OTP.findOne({ email }).sort({ createdAt: -1 });

      if (!record) {
        return res.status(400).json({ message: 'No verification code found' });
      }

      // Check expiry
      if (record.expiresAt < new Date()) {
        await OTP.deleteOne({ _id: record._id });
        return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
      }

      // Check attempts
      if (record.attempts >= 3) {
        return res.status(400).json({
          message: 'Too many incorrect attempts. Please request a new code.',
        });
      }

      // Compare
      if (record.otp !== otp) {
        record.attempts += 1;
        await record.save();
        return res.status(400).json({ message: 'Invalid verification code' });
      }

      // Valid OTP! Find or create user
      let user = await User.findOne({ email });
      const { college, collegeCode } = extractCollegeDetails(email);

      if (!user) {
        user = await User.create({
          email,
          college,
          collegeCode,
          isVerified: true,
          isOnboarded: false,
        });
      } else {
        // 🛡️ Block suspended users from logging in
        if (user.suspended) {
          return res.status(403).json({
            message: 'Your account has been suspended. Contact support for assistance.',
            suspended: true,
            reason: user.suspendedReason || 'Multiple community reports',
          });
        }

        // 🛡️ Block deleted users from logging in
        if (user.isDeleted) {
          return res.status(403).json({
            message: 'This account has been deleted.',
            deleted: true,
          });
        }

        user.isVerified = true;
        // Update college/collegeCode if they were empty
        if (!user.college) user.college = college;
        if (!user.collegeCode) user.collegeCode = collegeCode;
        await user.save();
      }

      // Delete OTP records for this email
      await OTP.deleteMany({ email });

      // Create JWT
      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Set httpOnly cookie (primary auth mechanism)
      setAuthCookie(res, token);

      res.status(200).json({
        token,
        user: {
          _id: user._id,
          email: user.email,
          college: user.college,
          collegeCode: user.collegeCode,
          isOnboarded: user.isOnboarded,
          name: user.name,
          isGhost: user.isGhost,
          suspended: user.suspended,
          suspendedReason: user.suspendedReason,
          isDeleted: user.isDeleted,
          shadowbanScore: user.shadowbanScore || 0,
          shadowbannedAt: user.shadowbannedAt || null,
          contentFrozen: user.contentFrozen || false,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error during verification' });
    }
  }
);

// @route   POST /api/auth/logout
// @desc    Clear auth cookie
// @access  Public
router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.status(200).json({ message: 'Logged out successfully' });
});

// @route   GET /api/auth/me
// @desc    Get current user profile from token
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

```

### ./server/routes/config.js

```
import express from 'express';
import Setting from '../models/Setting.js';
import {
  PROMPT_BANK, BRANCHES, YEARS, GENDERS, INTENTS, INTEREST_TAGS,
  PRONOUNS_OPTIONS, INTEREST_ICONS, INTEREST_ICON_FALLBACKS, COLLEGE_MAP, APP_CONSTANTS,
} from '../config/appData.js';
import { COMPAT_QUESTIONS } from '../config/compatQuestions.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    // Check database for dynamic settings first
    const dbSetting = await Setting.findOne({ key: 'appConfig' });
    
    if (dbSetting) {
      return res.json(dbSetting.value);
    }

    // Fallback to static file if DB is empty
    res.json({
      prompts: PROMPT_BANK,
      branches: BRANCHES,
      years: YEARS,
      genders: GENDERS,
      intents: INTENTS,
      interests: INTEREST_TAGS,
      pronouns: PRONOUNS_OPTIONS,
      interestIcons: INTEREST_ICONS,
      interestIconFallbacks: INTEREST_ICON_FALLBACKS,
      colleges: COLLEGE_MAP,
      constants: APP_CONSTANTS,
      compatQuestions: COMPAT_QUESTIONS,
      splash: {
        videoUrl: process.env.SPLASH_VIDEO_URL || '/lover.mp4',
        tagline: process.env.SPLASH_TAGLINE || 'Your Campus. Your Story.',
      },
    });
  } catch (error) {
    console.error('Config route error:', error);
    res.status(500).json({ message: 'Server error fetching config' });
  }
});

export default router;
```

### ./server/routes/discover.js

```
import express from 'express';
import User from '../models/User.js';
import Match from '../models/Match.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';
import Interaction from '../models/Interaction.js';
import { protect } from '../middleware/auth.js';
import { computeCompatibility } from '../config/compatQuestions.js';
import { sendPushNotification } from '../utils/push.js';
import { addToQueue } from '../utils/queue.js';
import { discoverLimiter } from '../middleware/rateLimiters.js';
import { getBlockExclusionQuery } from '../middleware/blockFilter.js';
import { body } from '../middleware/validate.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();
const DAY_MS = 24 * 60 * 60 * 1000;

// Shared helper for Letters and Telegrams (Superlikes)
const handleLike = async (req, res, { isSuperlike = false } = {}) => {
  const targetId = req.params.id;
  const currentUser = req.user;
  const actionType = isSuperlike ? 'seal_stamp' : 'letter';

  try {
    // 🛡️ BLOCK SELF-INTERACTION
    if (targetId === currentUser._id.toString()) {
      return res.status(400).json({ message: 'Cannot interact with yourself' });
    }

    // 1. INDEPENDENT DAILY LIMITS (7 letters/day, 1 Telegram/day)
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    const dailyCount = await Interaction.countDocuments({
      actorId: currentUser._id,
      actionType,
      createdAt: { $gte: startOfDay },
    });
    const dailyLimit = isSuperlike ? 1 : 7;
    if (dailyCount >= dailyLimit) {
      return res.status(403).json({
        message: isSuperlike ? 'Out of Telegrams. Come back tomorrow.' : 'Out of letters. Come back tomorrow.',
      });
    }

    const { note, target } = req.body; 
    
    // 🛡️ BLOCK UNMATCHED USERS: Check if there's a permanent archive between us
    const permanentArchive = await Interaction.findOne({
      $or: [
        { actorId: currentUser._id, targetId, actionType: 'archive', cooldownExpiresAt: null },
        { actorId: targetId, targetId: currentUser._id, actionType: 'archive', cooldownExpiresAt: null }
      ]
    });
    if (permanentArchive) {
      return res.status(403).json({ 
        message: 'This connection has been permanently closed.',
        code: 'USER_UNMATCHED'
      });
    }
    
    const targetUser = await User.findById(targetId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 2. CREATE THE LEDGER ENTRY
    const letterInteraction = await Interaction.create({
      actorId: currentUser._id,
      targetId,
      actionType,
      targetArtifact: target || null,
      letterContent: note || null,
      cooldownExpiresAt: null,
    });

    // 3. CREATE INBOX NOTIFICATION
    const notification = await Notification.create({
      recipientId: targetId,
      senderId: currentUser._id,
      type: isSuperlike ? 'priority_seal' : 'new_letter',
      interactionRef: letterInteraction._id,
    });

    // 4. REAL-TIME SOCKET PING
    const io = req.app.get('io');
    if (io) {
      io.to(targetId.toString()).emit('new-letter', {
        type: isSuperlike ? 'priority_seal' : 'new_letter',
      });
    }

    // 5. BACKGROUND PUSH
    addToQueue(() => sendPushNotification(targetId, {
      title: isSuperlike ? 'Priority Telegram!' : 'New Letter!',
      body: `${currentUser.name} sent you a${isSuperlike ? ' Telegram' : ' letter'}!`,
      data: {
        type: 'notification',
        notificationId: notification._id.toString(),
        interactionId: letterInteraction._id.toString(),
      },
    }));

    // 6. CHECK FOR MUTUAL MATCH
    const isMutual = await Interaction.findOne({
      actorId: targetId,
      targetId: currentUser._id,
      actionType: { $in: ['letter', 'seal_stamp', 'accept_letter', 'accept_seal'] },
    });

    if (isMutual) {
      const pairKey = [currentUser._id.toString(), targetId.toString()].sort().join('__');

      // Atomic Upsert to prevent race conditions
      const match = await Match.findOneAndUpdate(
        { pairKey },
        {
          $setOnInsert: {
            pairKey,
            users: [currentUser._id, targetId],
          },
          $set: {
            isActive: true,
            unlockedByInteractionId: letterInteraction._id,
          },
        },
        { upsert: true, new: true }
      );

      // AUTO-GENERATE THE OPENING ICEBREAKER MESSAGE
      const senderProfile = await User.findById(currentUser._id).select('photos prompts');
      let msgData = {
        matchId: match._id,
        senderId: currentUser._id,
        type: 'opening_letter',
        text: note || '',
        deliveryStatus: 'sent',
      };

      const target = req.body.target;
      if (target?.startsWith('photo_')) {
        const idx = parseInt(target.split('_')[1], 10);
        const url = senderProfile.photos?.[idx] || senderProfile.photos?.[0];
        if (url) {
          msgData.image = url;
          msgData.mediaUrl = url;
          msgData.text = note || '';
        }
      } else if (target?.startsWith('prompt_')) {
        const idx = parseInt(target.split('_')[1], 10);
        const q = senderProfile.prompts?.[idx]?.question;
        if (q) {
          msgData.text = note ? `"${q}"\n\n${note}` : `"${q}"`;
        }
      }

      await Message.findOneAndUpdate(
        { matchId: match._id, type: 'opening_letter' },
        { $setOnInsert: msgData },
        { upsert: true }
      );

      const targetProfile = {
        _id: targetUser._id,
        name: targetUser.name,
        photos: targetUser.photos,
        bio: targetUser.bio,
        branch: targetUser.branch,
        year: targetUser.year,
        hostel: targetUser.hostel,
        pronouns: targetUser.pronouns,
        interests: targetUser.interests,
        prompts: targetUser.prompts,
        intent: targetUser.intent,
        compatScore: computeCompatibility(currentUser.compatAnswers || [], targetUser.compatAnswers || []),
      };

      if (io) {
        io.to(targetId.toString()).emit('match-notification', {
          _id: match._id,
          matchId: match._id,
          interactionRef: letterInteraction._id,
          targetArtifact: target || null,
          letterContent: note || null,
          user: targetProfile,
        });
      }

      return res.status(200).json({
        matched: true,
        ...(isSuperlike && { super: true }),
        matchId: match._id,
        user: targetProfile,
      });
    }

    res.status(200).json({ matched: false, ...(isSuperlike && { super: true }) });
  } catch (error) {
    console.error('Like error:', error);
    res.status(500).json({ message: `Server error processing ${isSuperlike ? 'Telegram' : 'letter'}` });
  }
};

// @route   GET /api/discover
router.get('/', protect, async (req, res) => {
  try {
    const currentUser = req.user;
    const limit = Math.min(parseInt(req.query.limit) || 10, 20);

    // Build exclusion set from the Interaction ledger
    const acted = await Interaction.find({
      $or: [
        { actorId: currentUser._id, actionType: { $in: ['letter', 'seal_stamp', 'accept_letter', 'accept_seal', 'archive'] } },
        { targetId: currentUser._id, actionType: 'archive' },
      ],
    }).select('actorId targetId actionType cooldownExpiresAt').lean();

    const excludedIds = new Set();
    const now = new Date();
    for (const it of acted) {
      const otherId = it.actorId.toString() === currentUser._id.toString()
        ? it.targetId.toString()
        : it.actorId.toString();
      if (it.actionType === 'archive') {
        // Permanent archive (cooldownExpiresAt === null) always excludes
        // Temporary archive only excludes while cooldown is active
        if (!it.cooldownExpiresAt || new Date(it.cooldownExpiresAt) > now) {
          excludedIds.add(otherId);
        }
      } else {
        excludedIds.add(otherId);
      }
    }

    const blockExclusion = await getBlockExclusionQuery(currentUser._id);
    const blockedIds = blockExclusion._id?.$nin || [];
    blockedIds.forEach(id => excludedIds.add(id.toString()));
    excludedIds.add(currentUser._id.toString());

    // Base filter — heavy $nin moved to Node.js memory filtering
    const baseFilter = {
      collegeCode: currentUser.collegeCode,
      isOnboarded: true,
      isVerified: true,
      suspended: { $ne: true },
      isGhost: { $ne: true },
      isDeleted: { $ne: true },
    };

    if (currentUser.interestedIn?.length > 0) {
      baseFilter.gender = { $in: currentUser.interestedIn };
    }

    // 🚀 INDEXED RANGE QUERY: Fetch candidates faster than $sample
    const randomPoint = Math.random();
    let candidates = await User.find({ ...baseFilter, randomSeed: { $gte: randomPoint } })
      .select('name photos bio branch year hostel pronouns interests prompts intent compatAnswers lastActive')
      .limit(80)
      .lean();

    // If we hit the end of the index, wrap around to 0
    if (candidates.length < limit * 2) {
      const moreCandidates = await User.find({ ...baseFilter, randomSeed: { $lt: randomPoint } })
        .select('name photos bio branch year hostel pronouns interests prompts intent compatAnswers lastActive')
        .limit(80)
        .lean();
      candidates = candidates.concat(moreCandidates);
    }

    // Filter exclusions in high-speed Node.js memory
    const eligibleBatch = candidates.filter(u => !excludedIds.has(u._id.toString()));

    // Calculate Hybrid Score
    const currentUserAnswers = currentUser.compatAnswers || [];
    const scoredUsers = eligibleBatch.map((u) => {
      const compatRaw = computeCompatibility(currentUserAnswers, u.compatAnswers || []);
      const compatScore = (compatRaw || 0) / 100;
      const hoursSinceActive = (Date.now() - new Date(u.lastActive).getTime()) / (1000 * 60 * 60);
      let recencyScore = hoursSinceActive <= 1 ? 1.0 : hoursSinceActive <= 24 ? 0.5 : 0.0;
      const hasPhotos = (u.photos || []).length >= 4;
      const hasPrompts = (u.prompts || []).length >= 3;
      const hasBio = u.bio && u.bio.length > 10;
      const completenessScore = (hasPhotos && hasPrompts && hasBio) ? 1.0 : 0.5;

      const hybridScore = (compatScore * 0.5) + (recencyScore * 0.3) + (completenessScore * 0.2);
      return { ...u, hybridScore, compatScore: Math.round(compatRaw || 0) };
    });

    scoredUsers.sort((a, b) => b.hybridScore - a.hybridScore);
    const finalDeck = scoredUsers.slice(0, limit);

    res.status(200).json({
      users: finalDeck,
      total: eligibleBatch.length,
      hasMore: eligibleBatch.length > limit,
    });
  } catch (error) {
    console.error('Discover deck error:', error);
    res.status(500).json({ message: 'Server error fetching discovery deck' });
  }
});

// Validation middleware for target artifact to prevent injection/NaN crashes
const validateTarget = [
  body('target')
    .optional({ nullable: true, checkFalsy: true })
    .matches(/^(photo|prompt)_\d+$/)
    .withMessage('Invalid target artifact format. Must be like "photo_0" or "prompt_1".'),
  validate,
];

router.post('/like/:id', protect, discoverLimiter, validateTarget, (req, res) => handleLike(req, res));
router.post('/superlike/:id', protect, discoverLimiter, validateTarget, (req, res) => handleLike(req, res, { isSuperlike: true }));

router.post('/pass/:id', protect, discoverLimiter, async (req, res) => {
  const targetId = req.params.id;
  const currentUser = req.user;

  try {
    // 🧹 ATOMIC UPSERT: Overwrites existing pass cooldowns instead of stacking duplicate rows
    await Interaction.findOneAndUpdate(
      { actorId: currentUser._id, targetId, actionType: 'archive' },
      { $set: { cooldownExpiresAt: new Date(Date.now() + 7 * DAY_MS) } },
      { upsert: true, new: true }
    );
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Pass error:', error);
    res.status(500).json({ message: 'Server error processing pass' });
  }
});

router.get('/likes-you', protect, async (req, res) => {
  try {
    const currentUser = req.user;

    const incoming = await Interaction.find({
      targetId: currentUser._id,
      actionType: { $in: ['letter', 'seal_stamp', 'accept_letter', 'accept_seal'] },
    }).lean();

    const actorIds = incoming.map((i) => i.actorId);
    const myResponses = await Interaction.find({
      actorId: currentUser._id,
      targetId: { $in: actorIds },
    }).lean();
    const responded = new Set(myResponses.map((i) => i.targetId.toString()));

    const blockExclusion = await getBlockExclusionQuery(currentUser._id);
    const blockedSet = new Set((blockExclusion._id?.$nin || []).map((id) => id.toString()));

    // 1. Filter out responded/blocked IDs first to avoid fetching unnecessary users
    const validActorIds = incoming
      .filter(it => !responded.has(it.actorId.toString()) && !blockedSet.has(it.actorId.toString()))
      .map(it => it.actorId);

    // 2. SINGLE BATCHED QUERY (Fixes N+1)
    const users = validActorIds.length > 0 
      ? await User.find({ _id: { $in: validActorIds } })
          .select('name photos bio branch year hostel pronouns interests prompts intent compatAnswers gender age')
          .lean()
      : [];

    // 3. Map users to a dictionary for O(1) lookup
    const userMap = new Map(users.map(u => [u._id.toString(), u]));

    // 4. Reconstruct the likesYou array with enriched data
    const likesYou = incoming
      .filter(it => userMap.has(it.actorId.toString()))
      .map(it => {
        const u = userMap.get(it.actorId.toString());
        u.compatScore = computeCompatibility(currentUser.compatAnswers || [], u.compatAnswers || []);
        u.interactionRef = it._id;
        u.targetArtifact = it.targetArtifact;
        u.letterContent = it.letterContent;
        u.interactionCreatedAt = it.createdAt;
        u.isTelegram = it.actionType === 'seal_stamp';
        return u;
      });

    // Sort Telegrams to the absolute top, then by date
    likesYou.sort((a, b) => {
      if (a.isTelegram && !b.isTelegram) return -1;
      if (!a.isTelegram && b.isTelegram) return 1;
      return new Date(b.interactionCreatedAt) - new Date(a.interactionCreatedAt);
    });

    res.status(200).json({
      users: likesYou,
      total: likesYou.length,
    });
  } catch (error) {
    console.error('Likes-you error:', error);
    res.status(500).json({ message: 'Server error fetching likes you' });
  }
});

export default router;

```

### ./server/routes/matches.js

```
import express from 'express';
import mongoose from 'mongoose';
import Match from '../models/Match.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import Interaction from '../models/Interaction.js';
import { sendPushNotification } from '../utils/push.js';
import { addToQueue } from '../utils/queue.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/matches
// @desc    Get all active matches for the current user with details (paginated) using Aggregation
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const total = await Match.countDocuments({ users: userId, isActive: true });

    // SINGLE AGGREGATION PIPELINE (Replaces the N+1 Promise.all loop)
    const matches = await Match.aggregate([
      { $match: { users: userId, isActive: true } },
      { $sort: { updatedAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        // 1. Join the matched user's profile
        $lookup: {
          from: 'users',
          let: { userIds: '$users' },
          pipeline: [
            { $match: { $expr: { $in: ['$_id', '$$userIds'] } } },
            { $match: { _id: { $ne: userId } } },
            { $project: { name: 1, photos: 1, branch: 1, year: 1, lastActive: 1, gender: 1, hostel: 1, bio: 1, prompts: 1, intent: 1, interests: 1, suspended: 1, isDeleted: 1 } }
          ],
          as: 'otherUserArr'
        }
      },
      { $unwind: '$otherUserArr' },
      {
        // 2. Join the most recent message for this match
        $lookup: {
          from: 'messages',
          let: { matchId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$matchId', '$$matchId'] } } },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
            { $project: { text: 1, senderId: 1, createdAt: 1, readAt: 1, type: 1, mediaUrl: 1 } }
          ],
          as: 'lastMessageArr'
        }
      },
      {
        $unwind: {
          path: '$lastMessageArr',
          preserveNullAndEmptyArrays: true // Keep match even if no messages exist
        }
      },
      {
        // 3. Join the original interaction that created this match
        $lookup: {
          from: 'interactions',
          let: { interactionId: '$unlockedByInteractionId' },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$interactionId'] } } },
            { $project: { targetArtifact: 1, letterContent: 1, actionType: 1 } }
          ],
          as: 'originInteraction'
        }
      },
      {
        $unwind: {
          path: '$originInteraction',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        // 4. Shape the final output to match frontend expectations
        $project: {
          _id: 1,
          user: '$otherUserArr',
          lastMessage: '$lastMessageArr',
          originInteraction: 1,
          updatedAt: 1,
          yourTurn: {
             $cond: {
               if: { $ifNull: ['$lastMessageArr.senderId', false] },
               then: {
                 $and: [
                   { $ne: ['$lastMessageArr.senderId', userId] },
                   { $eq: [{ $ifNull: ['$lastMessageArr.readAt', null] }, null] }
                 ]
               },
               else: false
             }
           },
          sortDate: { $ifNull: ['$lastMessageArr.createdAt', '$updatedAt'] }
        }
      },
      { $sort: { sortDate: -1 } } // Sort by last message date, or match creation date
    ]);

    res.status(200).json({
      matches,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching matches' });
  }
});

// @route   DELETE /api/matches/:id
// @desc    Unmatch/deactivate a match
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const match = await Match.findOne({
      _id: req.params.id,
      users: req.user._id,
    });

    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    match.isActive = false;
    await match.save();

    // Create permanent exclusion so they never appear in each other's Discover deck
    const otherUserId = match.users.find(u => u.toString() !== req.user._id.toString());
    await Interaction.create({
      actorId: req.user._id,
      targetId: otherUserId,
      actionType: 'archive',
      cooldownExpiresAt: null, // Permanent — no cooldown expiry
    });

    // Notify the other user
    const io = req.app.get('io');
    if (otherUserId && io) {
      io.to(otherUserId.toString()).emit('unmatch-notification', { matchId: match._id });
    }
    if (otherUserId) {
      addToQueue(() => sendPushNotification(otherUserId, {
        title: 'Unmatched',
        body: `You were unmatched by ${req.user.name}`,
      }));
    }

    res.status(200).json({ success: true, message: 'Unmatched successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error processing unmatch' });
  }
});

// @route   GET /api/matches/:id/icebreakers
// @desc    Get personalized ice-breaker suggestions for a match
// @access  Private
router.get('/:id/icebreakers', protect, async (req, res) => {
  try {
    const match = await Match.findOne({
      _id: req.params.id,
      users: req.user._id,
      isActive: true,
    });

    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    const otherUserId = match.users.find(u => u.toString() !== req.user._id.toString());
    const otherUser = await User.findById(otherUserId).select('name interests branch year hostel compatAnswers prompts');
    const currentUser = req.user;

    if (!otherUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const icebreakers = [];

    // Shared interests
    const sharedInterests = (currentUser.interests || []).filter(i =>
      (otherUser.interests || []).includes(i)
    );
    if (sharedInterests.length > 0) {
      const interest = sharedInterests[0];
      icebreakers.push(`I see you're into ${interest}! What got you into it?`);
      if (sharedInterests.length > 1) {
        icebreakers.push(`We both like ${sharedInterests.join(' and ')} — what's your favorite thing about them?`);
      }
    }

    // Same hostel
    if (currentUser.hostel && otherUser.hostel && currentUser.hostel === otherUser.hostel) {
      icebreakers.push(`Fellow ${currentUser.hostel} resident! What's the best thing about living there?`);
    }

    // Same branch
    if (currentUser.branch && otherUser.branch && currentUser.branch === otherUser.branch) {
      icebreakers.push(`We're both in ${currentUser.branch}! How are you finding it so far?`);
    }

    // Prompts-based
    if (otherUser.prompts && otherUser.prompts.length > 0) {
      const prompt = otherUser.prompts[0];
      icebreakers.push(`I loved your answer about "${prompt.question}" — tell me more!`);
    }

    // Compat answers
    if (currentUser.compatAnswers?.length && otherUser.compatAnswers?.length) {
      const shared = currentUser.compatAnswers.filter(a =>
        otherUser.compatAnswers.some(b => b.question === a.question && b.answer === a.answer)
      );
      if (shared.length > 0) {
        icebreakers.push(`We matched on "${shared[0].question}" — great minds think alike!`);
      }
    }

    // Fallbacks
    const fallbacks = [
      `Hey ${otherUser.name?.split(' ')[0]}! What's the best thing that happened to you today?`,
      `If you could have any superpower for a day, what would it be?`,
      `What's your go-to comfort food after a long day?`,
      `Best chai spot on campus? I need recommendations!`,
      `What's the most interesting thing you've learned this semester?`,
    ];

    while (icebreakers.length < 3) {
      const fb = fallbacks[icebreakers.length % fallbacks.length];
      if (!icebreakers.includes(fb)) icebreakers.push(fb);
    }

    res.status(200).json({ icebreakers: icebreakers.slice(0, 5) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching icebreakers' });
  }
});

export default router;

```

### ./server/routes/messages.js

```
import express from 'express';
import mongoose from 'mongoose';
import Match from '../models/Match.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { sendPushNotification } from '../utils/push.js';
import { addToQueue } from '../utils/queue.js';
import { messageLimiter } from '../middleware/rateLimiters.js';
import { areBlocked } from '../middleware/blockFilter.js';
import { deleteCloudinaryFile } from '../config/cloudinary.js';

const router = express.Router();

// @route   GET /api/messages/:matchId
// @desc    Get messages using ObjectId-Based Cursor Pagination
router.get('/:matchId', protect, async (req, res) => {
  const { matchId } = req.params;
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 100);
  const cursor = req.query.cursor;

  try {
    const match = await Match.findOne({
      _id: matchId,
      users: req.user._id,
      isActive: true,
    });

    if (!match) {
      return res.status(403).json({ message: 'Unauthorized or match inactive' });
    }

    const query = { matchId };
    
    // 🚀 COLLISION-PROOF CURSOR: Use ObjectId sequencing instead of timestamps
    if (cursor && mongoose.Types.ObjectId.isValid(cursor)) {
      query._id = { $lt: new mongoose.Types.ObjectId(cursor) };
    } else if (cursor) {
      // Graceful fallback just in case an older timestamp cursor was passed
      query.createdAt = { $lt: new Date(cursor) };
    }

    const messages = await Message.find(query)
      .sort({ _id: -1 })
      .limit(limit)
      .populate('replyTo', 'text senderId type image deleted');

    Message.updateMany(
      { matchId, senderId: { $ne: req.user._id }, readAt: null },
      { $set: { readAt: new Date(), deliveryStatus: 'read' } }
    ).exec();

    const nextCursor = messages.length === limit ? messages[messages.length - 1]._id : null;

    res.status(200).json({
      messages: messages.reverse(), 
      nextCursor,
      hasMore: !!nextCursor,
    });
  } catch (error) {
    console.error('Fetch messages error:', error);
    res.status(500).json({ message: 'Server error fetching messages' });
  }
});

// @route   POST /api/messages/:matchId
router.post('/:matchId', protect, messageLimiter, async (req, res) => {
  const { matchId } = req.params;
  const { text, type, image, replyTo, mediaUrl, caption, clientMsgId } = req.body;

  const hasMedia = (type === 'image' || type === 'audio') && mediaUrl;
  if (!hasMedia && (!text || text.trim() === '')) {
    return res.status(400).json({ message: 'Message cannot be empty' });
  }

  if (text && text.length > 5000) {
    return res.status(400).json({ message: 'Message too long (max 5000 characters)' });
  }

  try {
    const match = await Match.findOne({
      _id: matchId,
      users: req.user._id,
      isActive: true,
    });

    if (!match) return res.status(403).json({ message: 'Unauthorized or match inactive' });

    const otherUserId = match.users.find(u => u.toString() !== req.user._id.toString());
    if (otherUserId && await areBlocked(req.user._id, otherUserId)) {
      return res.status(403).json({ message: 'Cannot send messages to this user' });
    }
    
    // 🛡️ BLOCK UNMATCHED USERS: Double-check match is still active
    if (!match.isActive) {
      return res.status(403).json({ 
        message: 'This connection has ended.',
        code: 'MATCH_INACTIVE'
      });
    }

    // IDEMPOTENCY CHECK: Prevent duplicate messages from network retries
    if (clientMsgId) {
      const existingMsg = await Message.findOne({ clientMsgId });
      if (existingMsg) {
        return res.status(200).json(existingMsg);
      }
    }

    if (replyTo) {
      const replyMsg = await Message.findOne({ _id: replyTo, matchId });
      if (!replyMsg) return res.status(400).json({ message: 'Reply target not found' });
    }

    const messageData = {
      matchId,
      senderId: req.user._id,
      type: type || 'text',
    };

    if (text && text.trim()) messageData.text = text.trim();
    if (mediaUrl) messageData.mediaUrl = mediaUrl;
    if (mediaUrl && type === 'image') messageData.image = mediaUrl; 
    if (caption) messageData.caption = caption;
    if (replyTo) messageData.replyTo = replyTo;
    if (clientMsgId) messageData.clientMsgId = clientMsgId;

    let message;
    try {
      message = await Message.create(messageData);
    } catch (err) {
      if (err.code === 11000 && clientMsgId) {
        const existing = await Message.findOne({ clientMsgId });
        if (existing) return res.status(200).json(existing);
      }
      throw err;
    }
    const populated = await Message.findById(message._id).populate('replyTo', 'text senderId type image deleted');

    match.updatedAt = new Date();
    await match.save();

    const io = req.app.get('io');
    
    // 🌐 MULTI-DEVICE BROADCAST: Send to the match room so ALL devices of sender & receiver update instantly
    if (io) {
      io.to(matchId.toString()).emit('new-message', populated);
    }

    if (otherUserId) {
      const sender = await User.findById(req.user._id).select('name');
      addToQueue(() => sendPushNotification(otherUserId, {
        title: sender?.name || 'New Message',
        body: type === 'audio' ? '🎙️ Sent a voice memo' : type === 'image' ? '📷 Sent a photograph' : (text || '').slice(0, 100),
        data: { type: 'message', matchId: matchId.toString() },
      }));
    }

    res.status(201).json(populated);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error sending message' });
  }
});

router.post('/:matchId/reaction', protect, async (req, res) => {
  const { matchId } = req.params;
  const { msgId, emoji } = req.body;

  try {
    const match = await Match.findOne({ _id: matchId, users: req.user._id, isActive: true });
    if (!match) return res.status(403).json({ message: 'Unauthorized' });

    const message = await Message.findOne({ _id: msgId, matchId });
    if (!message) return res.status(404).json({ message: 'Message not found' });

    const existingIdx = message.reactions.findIndex(
      (r) => r.user.toString() === req.user._id.toString() && r.emoji === emoji
    );

    if (existingIdx > -1) {
      message.reactions.splice(existingIdx, 1);
    } else {
      message.reactions = message.reactions.filter((r) => r.user.toString() !== req.user._id.toString());
      message.reactions.push({ emoji, user: req.user._id });
    }

    await message.save();

    const io = req.app.get('io');
    if (io) {
      io.to(matchId.toString()).emit('reaction-update', { msgId: message._id, reactions: message.reactions });
    }

    res.status(200).json({ reactions: message.reactions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error reacting' });
  }
});

router.delete('/:matchId/:msgId', protect, async (req, res) => {
  const { matchId, msgId } = req.params;
  try {
    const match = await Match.findOne({ _id: matchId, users: req.user._id, isActive: true });
    if (!match) return res.status(403).json({ message: 'Unauthorized' });

    const message = await Message.findOne({ _id: msgId, matchId });
    if (!message) return res.status(404).json({ message: 'Message not found' });
    if (message.senderId.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Can only delete your own messages' });

    // 🧹 CLOUDINARY WIPE: If the message contained a photo or voice note, vaporize it from cloud storage!
    if (message.mediaUrl || message.image) {
      deleteCloudinaryFile(message.mediaUrl || message.image);
    }

    message.deleted = true;
    message.text = '';
    message.image = '';
    message.mediaUrl = '';
    await message.save();

    const io = req.app.get('io');
    if (io) io.to(matchId.toString()).emit('message-deleted', { msgId: message._id });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting message' });
  }
});

export default router;

```

### ./server/routes/notifications.js

```
import express from 'express';
import Notification from '../models/Notification.js';
import Interaction from '../models/Interaction.js';
import Match from '../models/Match.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { sendPushNotification } from '../utils/push.js';
import { addToQueue } from '../utils/queue.js';

const router = express.Router();

// @route   GET /api/notifications/vapid-key
// @desc    Get VAPID public key for push subscription
// @access  Private
router.get('/vapid-key', protect, (req, res) => {
  const key = process.env.VAPID_PUBLIC_KEY;
  if (!key) {
    return res.status(503).json({ message: 'Push notifications not configured' });
  }
  res.status(200).json({ publicKey: key });
});

// @route   POST /api/notifications/subscribe
// @desc    Save push subscription
// @access  Private
router.post('/subscribe', protect, async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ message: 'Invalid subscription' });
    }
    await User.findByIdAndUpdate(req.user._id, { pushSubscription: subscription });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error saving subscription' });
  }
});

// @route   DELETE /api/notifications/subscribe
// @desc    Remove push subscription
// @access  Private
router.delete('/subscribe', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { pushSubscription: null });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error removing subscription' });
  }
});

// @route   GET /api/notifications/unread-count
// @desc    Get unread (uncleared) notification count
// @access  Private
router.get('/unread-count', protect, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipientId: req.user._id,
      isCleared: false,
    });
    res.status(200).json({ count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching unread count' });
  }
});

// @route   GET /api/notifications
// @desc    Get all notifications for the current user (paginated)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const filter = { recipientId: req.user._id, isCleared: false };

    if (req.query.type) {
      filter.type = req.query.type;
    }

    const total = await Notification.countDocuments(filter);
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('senderId', 'name photos branch year gender hostel pronouns interests age bio prompts suspended isDeleted')
      .populate('interactionRef');

    res.status(200).json({
      notifications,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching notifications' });
  }
});

// @route   POST /api/notifications/:id/accept
// @desc    Accept an incoming letter/seal: create the Match + opening letter, clear the notification
// @access  Private
router.post('/:id/accept', protect, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipientId: req.user._id,
    }).populate('interactionRef');
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    const incoming = notification.interactionRef; // actorId = original sender, targetId = me
    if (!incoming) {
      return res.status(400).json({ message: 'Notification has no linked interaction' });
    }

    const originalSender = incoming.actorId;
    const me = req.user._id;

    // Check if the original sender is suspended or deleted
    const senderUser = await User.findById(originalSender).select('suspended isDeleted').lean();
    if (!senderUser || senderUser.isDeleted || senderUser.suspended) {
      return res.status(410).json({ message: 'This profile is no longer available', code: 'USER_UNAVAILABLE' });
    }

    // Record my response (bypasses the daily like limit) so they're excluded from deck/likes-you
    const alreadyResponded = await Interaction.findOne({
      actorId: me,
      targetId: originalSender,
      actionType: { $in: ['letter', 'seal_stamp'] },
    });
    
    if (!alreadyResponded) {
      await Interaction.create({
        actorId: me,
        targetId: originalSender,
        actionType: incoming.actionType === 'seal_stamp' ? 'accept_seal' : 'accept_letter',
        letterContent: null,
        targetArtifact: null,
        cooldownExpiresAt: null,
      });
    }

    const pairKey = [me.toString(), originalSender.toString()].sort().join('__');

    // 1. ATOMIC UPSERT: Prevents duplicate key crashes if both users accept simultaneously
    const match = await Match.findOneAndUpdate(
      { pairKey },
      {
        $setOnInsert: {
          pairKey,
          users: [me, originalSender],
        },
        $set: {
          isActive: true,
          unlockedByInteractionId: incoming._id,
        },
      },
      { upsert: true, new: true }
    );

    // AUTO-GENERATE THE OPENING LETTER (only once)
    const existingOpening = await Message.findOne({ matchId: match._id, type: 'opening_letter' });
    if (!existingOpening) {
      const senderProfile = await User.findById(originalSender).select('photos prompts');
      let msgData = {
        matchId: match._id,
        senderId: originalSender,
        type: 'opening_letter',
        deliveryStatus: 'sent',
        text: incoming.letterContent || '',
      };

      const target = incoming.targetArtifact;
      if (target?.startsWith('photo_')) {
        const idx = parseInt(target.split('_')[1], 10);
        const url = senderProfile.photos?.[idx] || senderProfile.photos?.[0];
        if (url) {
          msgData.image = url;
          msgData.mediaUrl = url;
          msgData.text = incoming.letterContent || '';
        }
      } else if (target?.startsWith('prompt_')) {
        const idx = parseInt(target.split('_')[1], 10);
        const q = senderProfile.prompts?.[idx]?.question;
        if (q) {
          msgData.text = incoming.letterContent ? `"${q}"\n\n${incoming.letterContent}` : `"${q}"`;
        }
      }

      await Message.create(msgData);
    }

    notification.isCleared = true;
    await notification.save();

    const meUser = await User.findById(me).select(
      'name photos bio branch year hostel pronouns interests prompts intent'
    );
    
    const io = req.app.get('io');
    if (io) {
      // Real-time socket ping for immediate UI update if User A has the app open
      io.to(originalSender.toString()).emit('match-notification', {
        _id: match._id,
        matchId: match._id,
        interactionRef: incoming._id,
        targetArtifact: incoming.targetArtifact,
        letterContent: incoming.letterContent,
        user: meUser,
      });
    }

    // 2. DOPAMINE PUSH: Fire background notification to User A's lock screen
    addToQueue(() => sendPushNotification(originalSender, {
      title: 'You have a new match!',
      body: `${req.user.name} accepted your letter!`,
      data: { 
        type: 'match', 
        matchId: match._id.toString() 
      },
    }));

    res.status(200).json({ success: true, matchId: match._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error accepting notification' });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark a single notification as cleared
// @access  Private
router.put('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientId: req.user._id },
      { isCleared: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.status(200).json(notification);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error marking notification as read' });
  }
});

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as cleared
// @access  Private
router.put('/read-all', protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipientId: req.user._id, isCleared: false },
      { isCleared: true }
    );
    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error marking all as read' });
  }
});

// @route   PUT /api/notifications/:id/dismiss
// @desc    Dismiss (clear) a notification
// @access  Private
router.put('/:id/dismiss', protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientId: req.user._id },
      { isCleared: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.status(200).json(notification);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error dismissing notification' });
  }
});

export default router;

```

### ./server/routes/report.js

```
import express from 'express';
import Report from '../models/Report.js';
import Block from '../models/Block.js';
import Match from '../models/Match.js';
import User from '../models/User.js';
import Interaction from '../models/Interaction.js';
import { protect } from '../middleware/auth.js';
import { REPORT_REASONS } from '../models/Report.js';
import { sendPushNotification } from '../utils/push.js';
import { addToQueue } from '../utils/queue.js';

const router = express.Router();

// @route   GET /api/report/reasons
// @desc    Get available report reasons
// @access  Private
router.get('/reasons', protect, (req, res) => {
  res.status(200).json({ reasons: REPORT_REASONS });
});

// @route   POST /api/report/:userId
// @desc    Report a user (auto-suspend after 3 unique reporters)
// @access  Private
router.post('/:userId', protect, async (req, res) => {
  const { reason, details } = req.body;
  const reportedId = req.params.userId;

  if (!reason || !REPORT_REASONS.includes(reason)) {
    return res.status(400).json({ message: 'Valid reason is required' });
  }

  if (reportedId === req.user._id.toString()) {
    return res.status(400).json({ message: 'Cannot report yourself' });
  }

  try {
    const reported = await User.findById(reportedId);
    if (!reported) return res.status(404).json({ message: 'User not found' });

    const report = await Report.create({
      reporter: req.user._id,
      reported: reportedId,
      reason,
      details: details || '',
    });

    // Escalation: count only non-dismissed reports so admin dismissals work
    const activeReportCount = await Report.countDocuments({
      reported: reportedId,
      status: { $ne: 'dismissed' },
    });

    // Escalate only. Never auto-clear a restriction an admin applied.
    if (activeReportCount >= 5) {
      reported.suspended = true;
      reported.suspendedAt = reported.suspendedAt || new Date();
      reported.suspendedReason = reported.suspendedReason || 'Multiple community reports';
      reported.isGhost = true;
      reported.shadowbannedAt = reported.shadowbannedAt || new Date();
      reported.contentFrozen = false;
      await reported.save();
    } else if (activeReportCount >= 3) {
      reported.isGhost = true;
      reported.shadowbannedAt = reported.shadowbannedAt || new Date();
      reported.contentFrozen = true;
      await reported.save();
    }
    // activeReportCount < 3 → leave the account as an admin last set it.

    res.status(201).json({ message: 'Report submitted', reportId: report._id });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Already reported this user' });
    }
    console.error(error);
    res.status(500).json({ message: 'Server error submitting report' });
  }
});

// @route   POST /api/block/:userId
// @desc    Block a user
// @access  Private
router.post('/block/:userId', protect, async (req, res) => {
  const blockedId = req.params.userId;

  if (blockedId === req.user._id.toString()) {
    return res.status(400).json({ message: 'Cannot block yourself' });
  }

  try {
    const blockedUser = await User.findById(blockedId);
    if (!blockedUser) return res.status(404).json({ message: 'User not found' });

    await Block.findOneAndUpdate(
      { blocker: req.user._id, blocked: blockedId },
      { blocker: req.user._id, blocked: blockedId },
      { upsert: true, new: true }
    );

    // Deactivate any existing match
    const match = await Match.findOne({
      users: { $all: [req.user._id, blockedId] },
      isActive: true,
    });
    if (match) {
      match.isActive = false;
      await match.save();
    }

    // Create permanent exclusion so they never appear in each other's Discover deck
    await Interaction.create([
      { actorId: req.user._id, targetId: blockedId, actionType: 'archive', cooldownExpiresAt: null },
      { actorId: blockedId, targetId: req.user._id, actionType: 'archive', cooldownExpiresAt: null },
    ]);

    const io = req.app.get('io');
    if (io) {
      io.to(blockedId).emit('unmatch-notification', { matchId: match?._id });
    }

    // In-app (socket 'unmatch-notification') + push already notify the blocked user.
    // No Notification DB row is created — the model is purpose-built for letter interactions.
    addToQueue(() => sendPushNotification(blockedId, {
      title: 'Unmatched',
      body: `You were unmatched by ${req.user.name}`,
    }));

    res.status(200).json({ message: 'User blocked' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error blocking user' });
  }
});

// @route   DELETE /api/block/:userId
// @desc    Unblock a user
// @access  Private
router.delete('/block/:userId', protect, async (req, res) => {
  try {
    await Block.findOneAndDelete({
      blocker: req.user._id,
      blocked: req.params.userId,
    });

    // Remove permanent exclusion so they can re-encounter in Discover
    await Interaction.deleteMany({
      $or: [
        { actorId: req.user._id, targetId: req.params.userId, actionType: 'archive' },
        { actorId: req.params.userId, targetId: req.user._id, actionType: 'archive' },
      ],
    });
    res.status(200).json({ message: 'User unblocked' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error unblocking user' });
  }
});

// @route   GET /api/block/list
// @desc    Get list of blocked users
// @access  Private
router.get('/list', protect, async (req, res) => {
  try {
    const blocks = await Block.find({ blocker: req.user._id })
      .populate('blocked', 'name photos branch year hostel pronouns')
      .sort({ createdAt: -1 });

    res.status(200).json({
      blocked: blocks.map((b) => ({
        _id: b.blocked._id,
        name: b.blocked.name,
        photo: b.blocked.photos?.[0],
        branch: b.blocked.branch,
        year: b.blocked.year,
        hostel: b.blocked.hostel,
        pronouns: b.blocked.pronouns,
        blockedAt: b.createdAt,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching blocked users' });
  }
});

// @route   GET /api/block/status/:userId
// @desc    Check block status with a user
// @access  Private
router.get('/status/:userId', protect, async (req, res) => {
  try {
    const block = await Block.findOne({
      $or: [
        { blocker: req.user._id, blocked: req.params.userId },
        { blocker: req.params.userId, blocked: req.user._id },
      ],
    });

    res.status(200).json({
      isBlocked: !!block,
      iBlockedThem: block?.blocker?.toString() === req.user._id.toString(),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error checking block status' });
  }
});

export default router;

```

### ./server/routes/upload.js

```
import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { protect } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

let upload;

if (isCloudinaryConfigured) {
  const { v2: cloudinary } = await import('cloudinary');
  const { CloudinaryStorage } = await import('multer-storage-cloudinary');

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
      const isAudio = file.mimetype.startsWith('audio/');
      return {
        folder: isAudio ? 'matchalize/audio' : 'matchalize/photos',
        allowed_formats: isAudio
          ? ['mp3', 'mp4', 'm4a', 'webm', 'ogg']
          : ['jpg', 'jpeg', 'png', 'webp'],
        ...(isAudio ? {} : {
          transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
          moderation: 'aws_rek',
        }),
      };
    },
  });

  upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });
} else {
  const storage = multer.diskStorage({
    destination: path.join(__dirname, '..', 'uploads'),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${req.user._id}-${Date.now()}${ext}`);
    },
  });

  upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });
}

const router = express.Router();

router.post('/', protect, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // CHECK: If Cloudinary AI rejected the photo
    if (req.file.moderation && req.file.moderation[0]?.status === 'rejected') {
      return res.status(403).json({ message: 'Photo rejected due to inappropriate content.' });
    }

    const url = isCloudinaryConfigured
      ? req.file.path
      : `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({ url });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Upload failed' });
  }
});

export default router;

```

### ./server/routes/users.js

```
import express from 'express';
import { body } from '../middleware/validate.js';
import User from '../models/User.js';
import Match from '../models/Match.js';
import Message from '../models/Message.js';
import Block from '../models/Block.js';
import Report from '../models/Report.js';
import Notification from '../models/Notification.js';
import Analytics from '../models/Analytics.js';
import Interaction from '../models/Interaction.js';
import { protect, clearAuthCookie } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { deleteCloudinaryFile } from '../config/cloudinary.js';

const router = express.Router();

// Helper to collect all photo URLs (profile photos, bio photo, prompt attachments) from a user document
const collectUserPhotos = (u) => {
  const urls = new Set();
  if (u.photos && Array.isArray(u.photos)) u.photos.forEach(url => url && urls.add(url));
  if (u.bioPhoto) urls.add(u.bioPhoto);
  if (u.prompts && Array.isArray(u.prompts)) {
    u.prompts.forEach(p => p.photoUrl && urls.add(p.photoUrl));
  }
  return urls;
};

// Helper function to validate image URLs
const isValidImageUrl = (url) => {
  if (!url || typeof url !== 'string') return false;

  try {
    const parsed = new URL(url);

    const isProd = process.env.NODE_ENV === 'production';
    if (isProd && parsed.protocol !== 'https:') return false;

    const hostname = parsed.hostname;

    if (!isProd && (
      hostname === 'localhost' || 
      hostname === '127.0.0.1' ||
      hostname.startsWith('10.') || 
      hostname.startsWith('192.168.') || 
      hostname.startsWith('172.')
    )) {
      return /\.(jpg|jpeg|png|webp)$/i.test(parsed.pathname);
    }

    const trustedHosts = [
      'res.cloudinary.com',
      'images.unsplash.com',
    ];

    const isTrusted = trustedHosts.some(
      (host) => hostname === host || hostname.endsWith(`.${host}`)
    );

    if (!isTrusted) return false;

    return /\.(jpg|jpeg|png|webp)$/i.test(parsed.pathname);
  } catch {
    return false;
  }
};

// @route   POST /api/users/setup
// @desc    Complete onboarding registration
router.post(
  '/setup',
  protect,
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('age').isInt({ min: 18, max: 40 }).withMessage('Must be between 18 and 40'),
    body('gender').notEmpty().withMessage('Gender is required'),
    body('branch').notEmpty().withMessage('Branch is required'),
    body('year').notEmpty().withMessage('Year is required'),
    body('intent').custom((val) => {
      if (Array.isArray(val)) return val.length > 0;
      return typeof val === 'string' && val.trim() !== '';
    }).withMessage('At least one connection intent is required'),
  ],
  validate,
  async (req, res) => {
    const {
      name, age, gender, pronouns, branch, year, hostel, bio, bioPhoto,
      prompts, photos, intent, interestedIn, interests, compatAnswers,
    } = req.body;

    try {
      const user = await User.findById(req.user._id);
      if (!user) return res.status(404).json({ message: 'User not found' });
      if (user.contentFrozen) {
        return res.status(403).json({
          message: 'This feature is temporarily unavailable. Contact support@matchalize.com',
          code: 'CONTENT_FROZEN',
        });
      }

      // VALIDATION: Check image URLs
      const photosToSave = (Array.isArray(photos) ? photos : []).filter(Boolean).slice(0, 6);
      if (!photosToSave.every(isValidImageUrl)) {
        return res.status(400).json({ message: 'One or more photo URLs are invalid.' });
      }

      const promptsToSave = Array.isArray(prompts) ? prompts.slice(0, 3) : [];
      if (promptsToSave.some(p => p.photoUrl && !isValidImageUrl(p.photoUrl))) {
        return res.status(400).json({ message: 'One or more prompt photo URLs are invalid.' });
      }

      const oldPhotos = collectUserPhotos(user);

      user.name = name;
      user.age = age;
      user.gender = gender;
      user.pronouns = pronouns || '';
      user.branch = branch;
      user.year = year;
      user.hostel = hostel || '';
      user.bio = bio || '';
      user.bioPhoto = bioPhoto || '';
      user.prompts = promptsToSave;
      user.photos = photosToSave;
      user.intent = intent;
      user.interestedIn = interestedIn || [];
      user.interests = Array.isArray(interests) ? interests.slice(0, 6) : [];
      user.compatAnswers = compatAnswers || [];
      user.isOnboarded = true;

      await user.save();

      // 🧹 VAPORIZE ORPHANED PHOTOS: Delete any old photo that isn't in the new profile
      const newPhotos = collectUserPhotos(user);
      oldPhotos.forEach(url => {
        if (!newPhotos.has(url)) deleteCloudinaryFile(url);
      });

      // ANALYTICS: Track completion
      await Analytics.create({ user: req.user._id, event: 'ONBOARDING_COMPLETE', step: 8 });

      res.status(200).json(user);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error during onboarding setup' });
    }
  }
);

// @route   GET /api/users/profile
// @desc    Get user's own profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile details
// @access  Private
router.put('/profile', protect, async (req, res) => {
    const {
    name,
    gender,
    pronouns,
    branch,
    year,
    bio,
    prompts,
    photos,
    intent,
    interestedIn,
    ageRange,
    interests,
    hostel,
    compatAnswers,
    isGhost,
  } = req.body;

  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.contentFrozen) {
      return res.status(403).json({
        message: 'This feature is temporarily unavailable. Contact support@matchalize.com',
        code: 'CONTENT_FROZEN',
      });
    }

    const oldPhotos = collectUserPhotos(user);

    if (name) user.name = name;
    if (gender) user.gender = gender;
    if (pronouns !== undefined) user.pronouns = pronouns;
    if (branch) user.branch = branch;
    if (year) user.year = year;
    if (bio !== undefined) user.bio = bio;
    if (prompts) {
      const promptsToSave = Array.isArray(prompts) ? prompts.slice(0, 3) : [];
      if (promptsToSave.some(p => p.photoUrl && !isValidImageUrl(p.photoUrl))) {
        return res.status(400).json({ message: 'One or more prompt photo URLs are invalid.' });
      }
      user.prompts = promptsToSave;
    }
    if (photos) {
      const photosToSave = (Array.isArray(photos) ? photos : []).filter(Boolean).slice(0, 6);
      if (!photosToSave.every(isValidImageUrl)) {
        return res.status(400).json({ message: 'One or more photo URLs are invalid.' });
      }
      user.photos = photosToSave;
    }
    if (intent) user.intent = intent;
    if (interestedIn) user.interestedIn = interestedIn;
    if (ageRange) user.ageRange = ageRange;
    if (interests) user.interests = interests;
    if (hostel !== undefined) user.hostel = hostel;
    if (compatAnswers) user.compatAnswers = compatAnswers;
    if (isGhost !== undefined) user.isGhost = isGhost;

    await user.save();

    // 🧹 VAPORIZE ORPHANED PHOTOS: Clean up removed/replaced images
    const newPhotos = collectUserPhotos(user);
    oldPhotos.forEach(url => {
      if (!newPhotos.has(url)) deleteCloudinaryFile(url);
    });

    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

// @route   DELETE /api/users/account
// @desc    Soft-delete user account with 30-day safety retention
// @access  Private
router.delete('/account', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // 🧹 IMMEDIATE WIPE: Public profile media from Cloudinary
    // (Profile photos, bio photo, prompt attachments — serve no purpose after deletion)
    collectUserPhotos(user).forEach(url => deleteCloudinaryFile(url));

    // ⚠️ SAFETY RETENTION: Chat media is NOT wiped here.
    // Messages (including photos/voice notes) are retained for 30-day safety window
    // to allow Trust & Safety investigations if the user is reported after deletion.
    // A background cleanup job handles final Cloudinary purge after retention expires.

    // 🏴 SOFT DELETE: Wipe PII, flag as deleted
    user.name = 'Deleted User';
    user.photos = [];
    user.bio = '';
    user.bioPhoto = '';
    user.prompts = [];
    user.isDeleted = true;
    user.deletedAt = new Date();
    user.isGhost = true;
    user.suspended = false;
    user.pushSubscription = null;
    user.interestedIn = [];
    user.interests = [];
    user.compatAnswers = [];
    await user.save();

    // 💔 DEACTIVATE all matches (chats vanish from inboxes instantly)
    await Match.updateMany({ users: userId }, { $set: { isActive: false } });

    // 🧹 CLEANUP: Records with no safety retention value
    await Block.deleteMany({ $or: [{ blocker: userId }, { blocked: userId }] });
    await Report.deleteMany({ $or: [{ reporter: userId }, { reported: userId }] });
    await Notification.deleteMany({ $or: [{ recipientId: userId }, { senderId: userId }] });
    await Analytics.deleteMany({ user: userId });

    // 📦 RETAIN for 30-day safety window: Messages, Matches, Interactions
    // (Final hard deletion handled by background cleanup job)

    // 🔒 CLEAR SESSION
    clearAuthCookie(res);
    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting account' });
  }
});

// @route   GET /api/users/onboarding/resume
// @desc    Get saved onboarding progress
// @access  Private
router.get('/onboarding/resume', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('onboardingStep onboardingData');
    res.json({ step: user.onboardingStep, data: user.onboardingData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/onboarding/save
// @desc    Save onboarding progress
router.put('/onboarding/save', protect, async (req, res) => {
  try {
    const { step, data } = req.body;
    await User.findByIdAndUpdate(req.user._id, { onboardingStep: step, onboardingData: data });
    
    // ANALYTICS: Track user progression
    await Analytics.create({ user: req.user._id, event: 'ONBOARDING_STEP', step });

    res.json({ saved: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/users/onboarding/clear
// @desc    Clear saved onboarding progress
// @access  Private
router.delete('/onboarding/clear', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { onboardingStep: 1, onboardingData: {} });
    res.json({ cleared: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/logout-all
// @desc    Invalidate all active sessions for the current user
// @access  Private
router.post('/logout-all', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { lastLogoutAt: new Date() });
    res.status(200).json({ message: 'Logged out from all other devices successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

```

### ./server/routes/waitlist.js

```
import express from 'express';
import { body } from '../middleware/validate.js';
import { validate } from '../middleware/validate.js';
import Waitlist from '../models/Waitlist.js';
import { rateLimit } from 'express-rate-limit';

const router = express.Router();

// FIXED: Hardcoded launch date — no more drift
const LAUNCH_DATE = new Date('2026-10-02T00:00:00Z');

// Rate limit: 5 joins per 15 min per IP
const joinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.ip,
  message: { message: 'Too many join attempts. Please wait a bit.' },
});

// Extract college details from email (matches pattern in auth.js)
const extractCollege = (email) => {
  const domain = email.split('@')[1]?.toLowerCase() || '';
  const code = domain.split('.')[0];
  const map = {
    iitb: 'IIT Bombay', iitd: 'IIT Delhi', iitk: 'IIT Kanpur',
    iitkgp: 'IIT Kharagpur', iitm: 'IIT Madras', iitr: 'IIT Roorkee',
    iitg: 'IIT Guwahati', iith: 'IIT Hyderabad', iitbhu: 'IIT BHU',
  };
  return { collegeCode: code, college: map[code] || domain };
};

// Variable-ratio reward engine. The slot machine.
// Weighted toward small bonuses with rare jackpots.
const computeReferralBonus = (referrerCurrentCount) => {
  const roll = Math.random();
  let bonus;
  if (roll < 0.50) bonus = 2 + Math.floor(Math.random() * 2);       // 50%: 2-3 spots
  else if (roll < 0.80) bonus = 4 + Math.floor(Math.random() * 3);  // 30%: 4-6 spots
  else if (roll < 0.95) bonus = 7 + Math.floor(Math.random() * 4);  // 15%: 7-10 spots
  else bonus = 11 + Math.floor(Math.random() * 5);                  // 5%: 11-15 spots (JACKPOT)

  // Early evangelist bonus: first 10 referrals get +5 extra
  if (referrerCurrentCount < 10) bonus += 5;
  return bonus;
};

// Proper block-shift: moves everyone in [newPosition, oldPosition) up by 1,
// then recomputes tiers for the affected block + the referrer.
const shiftPositionsUp = async (referrerId, oldPosition, newPosition) => {
  if (newPosition >= oldPosition) return; // No shift needed

  // 1. Shift everyone in the gap up by 1
  await Waitlist.updateMany(
    {
      _id: { $ne: referrerId },
      position: { $gte: newPosition, $lt: oldPosition },
    },
    { $inc: { position: 1 } }
  );

  // 2. Recompute tiers for the shifted block + the referrer
  const T = Waitlist.TIER_THRESHOLDS;
  const affected = await Waitlist.find({
    position: { $gte: newPosition, $lte: oldPosition },
  }).lean();

  const ops = affected.map((entry) => {
    const tier = entry.position <= T.charter ? 'charter'
               : entry.position <= T.founding ? 'founding'
               : 'original';
    return {
      updateOne: {
        filter: { _id: entry._id },
        update: { $set: { tier } },
      },
    };
  });
  if (ops.length > 0) await Waitlist.bulkWrite(ops);
};

// ─── JOIN THE WAITLIST ───
router.post(
  '/join',
  joinLimiter,
  [
    body('email')
      .isEmail().withMessage('Valid email required')
      .custom((value) => {
        const normalized = value.trim().toLowerCase();
        if (!normalized.endsWith('@iitb.ac.in')) {
          throw new Error('Currently only @iitb.ac.in emails are accepted');
        }
        return true;
      }),
    body('name').optional().isString().trim().isLength({ max: 60 }),
    body('referralCode').optional().isString().trim().isLength({ min: 6, max: 6 }),
  ],
  validate,
  async (req, res) => {
    try {
      const email = req.body.email.trim().toLowerCase();
      const { name, referralCode } = req.body;

      // Duplicate check
      const existing = await Waitlist.findOne({ email });
      if (existing) {
        return res.status(409).json({
          message: 'You are already in the cohort.',
          position: existing.position,
          referralCode: existing.referralCode,
        });
      }

      // Process referral if provided
      let referrer = null;
      let bonusSpots = 0;
      let oldPosition = null;

      if (referralCode) {
        referrer = await Waitlist.findOne({ referralCode: referralCode.toUpperCase() });
        if (referrer) {
          // Self-referral guard
          if (referrer.email === email) {
            return res.status(400).json({ message: 'Nice try. You cannot refer yourself.' });
          }

          // THE SLOT MACHINE MOMENT
          bonusSpots = computeReferralBonus(referrer.referralCount);
          oldPosition = referrer.position;
          const newPosition = Math.max(1, referrer.position - bonusSpots);

          referrer.position = newPosition;
          referrer.referralCount += 1;
          referrer.spotsJumped += bonusSpots;
          referrer.tier = referrer.computeTier();
          await referrer.save();

          // Proper block-shift
          await shiftPositionsUp(referrer._id, oldPosition, newPosition);
        }
      }

      // Assign position (end of queue)
      const totalBefore = await Waitlist.countDocuments();
      const position = totalBefore + 1;
      const newReferralCode = await Waitlist.generateReferralCode();
      const { college, collegeCode } = extractCollege(email);

      const T = Waitlist.TIER_THRESHOLDS;
      const entry = await Waitlist.create({
        email,
        name: name || '',
        college, collegeCode,
        referralCode: newReferralCode,
        referredBy: referrer?._id || null,
        position,
        tier: position <= T.charter ? 'charter' : position <= T.founding ? 'founding' : 'original',
      });

      res.status(201).json({
        success: true,
        position: entry.position,
        referralCode: entry.referralCode,
        tier: entry.tier,
        totalWaiting: position,
        referralBonus: referrer ? {
          referrerName: referrer.name || 'A fellow IITian',
          spotsJumped: bonusSpots,
          newPosition: referrer.position,
        } : null,
      });
    } catch (error) {
      console.error('Waitlist join error:', error);
      res.status(500).json({ message: 'The archives encountered an error. Please try again.' });
    }
  }
);

// ─── CHECK STATUS (by referral code — no auth needed) ───
router.get('/status/:code', async (req, res) => {
  try {
    const entry = await Waitlist.findOne({ referralCode: req.params.code.toUpperCase() }).lean();
    if (!entry) return res.status(404).json({ message: 'Code not found' });
    const total = await Waitlist.countDocuments();
    res.json({
      position: entry.position,
      tier: entry.tier,
      totalWaiting: total,
      ahead: entry.position - 1,
      referralCount: entry.referralCount,
      spotsJumped: entry.spotsJumped,
      spotsToTop100: entry.position > 100 ? entry.position - 100 : 0,
      spotsToTop50: entry.position > 50 ? entry.position - 50 : 0,
      status: entry.status,
      joinedAt: entry.joinedAt,
      checkInStreak: entry.checkInStreak,
      name: entry.name,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch status' });
  }
});

// ─── PUBLIC STATS (for social proof counter) ───
router.get('/stats', async (req, res) => {
  try {
    const [total, charter, founding, last24h, recentJoins] = await Promise.all([
      Waitlist.countDocuments(),
      Waitlist.countDocuments({ position: { $lte: 50 } }),
      Waitlist.countDocuments({ position: { $gt: 50, $lte: 250 } }),
      Waitlist.countDocuments({ joinedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
      Waitlist.find().sort({ joinedAt: -1 }).limit(12).select('name branch year joinedAt').lean(),
    ]);
    res.json({
      total, charter, founding, last24h,
      // Real joins for transparent social proof
      recentJoins: recentJoins.map(j => ({
        name: j.name || 'An IITian',
        branch: j.branch || '',
        year: j.year || '',
        joinedAt: j.joinedAt,
      })),
      // Fixed launch date (move to Setting model later)
      launchDate: LAUNCH_DATE.toISOString(),
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

// ─── DAILY CHECK-IN (engagement loop) ───
router.post('/checkin/:code', async (req, res) => {
  try {
    const entry = await Waitlist.findOne({ referralCode: req.params.code.toUpperCase() });
    if (!entry) return res.status(404).json({ message: 'Code not found' });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Already checked in today
    if (entry.lastCheckIn && new Date(entry.lastCheckIn).setHours(0,0,0,0) >= today.getTime()) {
      return res.json({ streak: entry.checkInStreak, alreadyCheckedIn: true });
    }

    // Maintain or reset streak
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastCheckInDay = entry.lastCheckIn ? new Date(entry.lastCheckIn).setHours(0,0,0,0) : null;
    entry.checkInStreak = (lastCheckInDay === yesterday.getTime()) ? entry.checkInStreak + 1 : 1;
    entry.lastCheckIn = now;

    // Reward: every 3-day streak = jump 2 spots
    let reward = null;
    if (entry.checkInStreak > 0 && entry.checkInStreak % 3 === 0) {
      const jump = 2;
      const oldPosition = entry.position;
      const newPosition = Math.max(1, entry.position - jump);
      entry.position = newPosition;
      entry.spotsJumped += jump;
      entry.tier = entry.computeTier();
      await entry.save();
      await shiftPositionsUp(entry._id, oldPosition, newPosition);
      reward = { spotsJumped: jump, newPosition };
    } else {
      await entry.save();
    }

    res.json({ streak: entry.checkInStreak, position: entry.position, reward });
  } catch (error) {
    res.status(500).json({ message: 'Check-in failed' });
  }
});

export default router;
```

### ./server/seedDummies.js

```
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import { COMPAT_QUESTIONS } from './config/compatQuestions.js';
import { BRANCHES, YEARS, INTENTS, INTEREST_TAGS, PROMPT_BANK } from './config/appData.js';

dotenv.config();

const DUMMY_COUNT = 100;

const FEMALE_PROFILES = [
  { name: 'Ananya Sharma' }, { name: 'Priya Patel' }, { name: 'Kavya Iyer' }, { name: 'Meera Nair' },
  { name: 'Zara Khan' }, { name: 'Sneha Rao' }, { name: 'Nandini Das' }, { name: 'Ishita Kapoor' },
  { name: 'Rhea Chatterjee' }, { name: 'Tanvi Shah' }, { name: 'Aisha Sheikh' }, { name: 'Diya Menon' },
  { name: 'Riya Pillai' }, { name: 'Shruti Deshpande' }, { name: 'Pooja Kulkarni' }, { name: 'Sanjana Reddy' },
  { name: 'Isha Verma' }, { name: 'Mahika Joshi' }, { name: 'Anjali Gupta' }, { name: 'Trisha Bose' },
  { name: 'Sanya Malhotra' }, { name: 'Nikita Bansal' }, { name: 'Aditi Thakur' }, { name: 'Shreya Apte' },
  { name: 'Vaishnavi Rao' }, { name: 'Harshita Singh' }, { name: 'Tanya Chopra' }, { name: 'Divya Nair' },
  { name: 'Mrunal Desai' }, { name: 'Sakshi Jain' }, { name: 'Ritika Sharma' }, { name: 'Pia Mehta' },
  { name: 'Vidhi Agrawal' }, { name: 'Netra Kulkarni' }, { name: 'Chaitra Hegde' }, { name: 'Lavanya Iyer' },
  { name: 'Gauri Patil' }, { name: 'Simran Kaur' }, { name: 'Mehak Kapoor' }, { name: 'Rupali Das' },
  { name: 'Jhanvi Shah' }, { name: 'Bhavna Trivedi' }, { name: 'Nisha Kumari' }, { name: 'Aradhana Mishra' },
  { name: 'Shivani Dubey' }, { name: 'Pallavi Banerjee' }, { name: 'Kirti Aggarwal' }, { name: 'Swati Naik' },
  { name: 'Pranita Sahu' }, { name: 'Ekta Goyal' },
];

const MALE_PROFILES = [
  { name: 'Rohan Mehta' }, { name: 'Aarav Kumar' }, { name: 'Kabir Singh' }, { name: 'Arjun Gupta' },
  { name: 'Dev Joshi' }, { name: 'Aditya Verma' }, { name: 'Vihaan Malhotra' }, { name: 'Shaurya Bhatia' },
  { name: 'Pranav Reddy' }, { name: 'Dhruv Choudhary' }, { name: 'Ishaan Desai' }, { name: 'Rishabh Jain' },
  { name: 'Karan Malhotra' }, { name: 'Siddharth Rao' }, { name: 'Yash Thakur' }, { name: 'Omkar Pawar' },
  { name: 'Vedant Kulkarni' }, { name: 'Harsh Vardhan' }, { name: 'Kunal Bansal' }, { name: 'Nikhil Sharma' },
  { name: 'Aryan Kapoor' }, { name: 'Tushar Mehta' }, { name: 'Manav Goyal' }, { name: 'Sarthak Jain' },
  { name: 'Ayush Srivastava' }, { name: 'Varun Nair' }, { name: 'Raghav Iyer' }, { name: 'Kartik Menon' },
  { name: 'Abhinav Gupta' }, { name: 'Sahil Chopra' }, { name: 'Aditya Shukla' }, { name: 'Rahul Pillai' },
  { name: 'Priyansh Agrawal' }, { name: 'Shivam Dubey' }, { name: 'Deepak Bhatt' }, { name: 'Tarun Bhatia' },
  { name: 'Naman Sahu' }, { name: 'Jeet Banerjee' }, { name: 'Karan Patel' }, { name: 'Arnav Kulkarni' },
  { name: 'Ritvik Singh' }, { name: 'Uday Shankar' }, { name: 'Mohit Deshpande' }, { name: 'Parth Trivedi' },
  { name: 'Gaurav Naik' }, { name: 'Harsh Agarwal' }, { name: 'Yuvraj Singh' }, { name: 'Aniket Bose' },
  { name: 'Shubham Tiwari' }, { name: 'Rohan Kulkarni' },
];

const HOSTELS = [
  'Hostel 1', 'Hostel 2', 'Hostel 3', 'Hostel 4', 'Hostel 5', 'Hostel 6',
  'Hostel 7', 'Hostel 8', 'Hostel 9', 'Hostel 10', 'Hostel 11', 'Hostel 12',
  'Hostel 13', 'Hostel 14', 'Hostel 15',
];

const PHOTO_IDS = {
  Female: [
    'photo-1494790108377-be9c29b29330', 'photo-1438761681033-6461ffad8d80',
    'photo-1544005313-94ddf0286df2', 'photo-1529626455594-4ff0802cfb7e',
    'photo-1531746020798-e6953c6e8e04', 'photo-1534528741775-53994a69daeb',
    'photo-1524504388940-b1c1722653e1', 'photo-1517841905240-472988babdf9',
    'photo-1548142813-c348350df52b', 'photo-1531123897727-8f129e1688ce',
    'photo-1517365830460-955ce3ccd263', 'photo-1508214751196-bcfd4ca60f91',
    'photo-1488426862026-3ee34a7d66df', 'photo-1531746790731-6c087fecd65a',
    'photo-1554151228-14d9def656e4', 'photo-1546961329-78bef0414d7c',
  ],
  Male: [
    'photo-1507003211169-0a1dd7228f2d', 'photo-1500648767791-00dcc994a43e',
    'photo-1506794778202-cad84cf45f1d', 'photo-1539571696357-5a69c17a67c6',
    'photo-1519085360753-af0119f7cbe7', 'photo-1521119989659-a83eee488004',
    'photo-1504257432389-52343af06ae3', 'photo-1472099645785-5658abf4ff4e',
    'photo-1492562080023-ab3db95bfbce', 'photo-1527980965255-d3b416303d12',
    'photo-1531384441138-2736e62e0919', 'photo-1509347528160-9a9e33742cdb',
    'photo-1522075469751-3a6694fb2f61', 'photo-1520975954732-35dd22299614',
    'photo-1519345182560-3f2917c472ef', 'photo-1518806118471-f28b20a1d79d',
  ],
};

const BIOS = [
  'CSE junta. Fueled by filter coffee, hostel raids, and 3AM assignment chaos. Looking for someone to share playlists and canteen runs with.',
  'I spend my weekends between the library, the gym, and late-night chai at the canteen. Come find me when you need a study break.',
  'Math & Computing, but my real specialisation is overthinking text messages. Soft spot for monsoon walks and doodles in lecture margins.',
  'Photography nerd who shoots everything from sunrises at the lake to street dogs near the hostel gate. Let\'s explore campus together.',
  'Engineer by day, meme curator by night. I bring the snacks, you bring the conversation.',
  'I can\'t grow a plant to save my life, but I make great tea. Enthusiastic badminton player, certified foodie, terrible dancer, great company.',
  'Third-year mech guy who can talk about F1, metal, and machine design for hours. Bonus points if you can beat me at chess.',
  'I write poetry nobody reads and code everyone uses. Looking for someone to debate the best canteen dish with.',
  'Aerospace nerd. If you can sit through my 20-minute explanation of why planes fly, we\'re basically soulmates.',
  'Civil engineering, but my real passion is complaining about the weather while walking everywhere.',
  'Ask me about my hostel wing\'s legendary midnight Maggi sessions. I collect good stories and better playlists.',
  'Chemistry + startup dreams. I\'ll pitch you a business idea over chai if you promise to laugh at my bad jokes.',
  'Textile tech with an eye for fashion. Equal parts streetwear obsessive and museum wanderer.',
  'I\'ll race you to the next lecture and lose on purpose so we can walk and talk.',
  'Late-night library regular. My love language is sharing notes and good book recommendations.',
  'Gamer and AI/ML enthusiast. I carry a deck of cards everywhere and can shuffle mid-conversation.',
  'I run (jog, honestly) every morning. Looking for a workout buddy or someone to share breakfast with after.',
  'Physics freak who thinks everything is more fun with equations. And ice cream. Mostly ice cream.',
  'Metal head with a soft playlist for the right person. My hostel room has more posters than furniture.',
  'I make playlists for every mood and food for every occasion. Come hungry, leave happy.',
];

const PROMPT_ANSWERS = [
  'My go-to answer is always "two truths and a lie" and I never lie. That\'s the lie.',
  'Honestly? Late-night Maggi and a good conversation.',
  'I once fell asleep in the library and woke up to my friends\' group photo as my wallpaper.',
  'The best way to my heart is through the canteen\'s chai and a well-timed meme.',
  'I\'m weirdly good at parallel parking, balancing plates, and remembering song lyrics.',
  'My 3AM thoughts usually go like — should I study now or start my assignment at 6AM like a genius?',
  'I collect movie tickets like some people collect stamps. It\'s a problem.',
  'My biggest flex is that I survived a semester with zero alarms and zero missed submissions.',
  'I\'ll fall for you if you get my references without me having to explain them.',
  'The most impulsive thing I\'ve done is sign up for a hackathon at 2AM. No regrets.',
  'One thing I can\'t live without is my noise-cancelling headphones. And chai.',
  'I\'m basically a professional at overthinking a text that just said "ok".',
  'My hidden talent is making the perfect cup of chai under pressure.',
  'If I could change one campus rule, it\'d be the chai stall closing time.',
  'I finally understand why people say the monsoon makes everything better here.',
];

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomSubset = (arr, min, max) => {
  const count = min + Math.floor(Math.random() * (max - min + 1));
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

const buildPhotos = (gender) => {
  const pool = PHOTO_IDS[gender];
  const start = Math.floor(Math.random() * pool.length);
  const photos = [];
  for (let i = 0; i < 5; i++) {
    const id = pool[(start + i) % pool.length];
    photos.push(`https://images.unsplash.com/${id}?w=600&auto=format&fit=crop&q=80`);
  }
  return photos;
};

const buildPrompts = () => {
  const questions = getRandomSubset(PROMPT_BANK, 3, 4);
  return questions.map((question) => ({
    question,
    answer: getRandom(PROMPT_ANSWERS),
  }));
};

const buildCompatAnswers = () =>
  COMPAT_QUESTIONS.map((q) => ({
    question: q.id,
    answer: getRandom(q.options).key,
  }));

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) throw new Error('MONGO_URI / MONGODB_URI not found in .env file!');

    await mongoose.connect(mongoUri);
    console.log('📦 Connected to MongoDB Atlas...');

    const existingUser = await User.findOne({});
    const targetCollegeCode = existingUser ? existingUser.collegeCode : 'iitb';
    console.log(`🎯 Targeting collegeCode: "${targetCollegeCode}" so they show up in your deck!`);

    await User.deleteMany({ email: { $regex: 'dummy.*@.*\\.ac\\.in' } });
    console.log('🧹 Cleared old dummy accounts...');

    const allProfiles = [
      ...FEMALE_PROFILES.map((p) => ({ ...p, gender: 'Female' })),
      ...MALE_PROFILES.map((p) => ({ ...p, gender: 'Male' })),
    ].slice(0, DUMMY_COUNT);

    const dummyUsers = allProfiles.map((item, index) => {
      const isMale = item.gender === 'Male';
      const age = 18 + Math.floor(Math.random() * 7); // 18-24
      const hoursAgo = Math.floor(Math.random() * 72); // recency variety

      return {
        name: item.name,
        email: `dummy.${item.name.toLowerCase().replace(/[^a-z]+/g, '.').replace(/^\.|\.$/g, '')}.${index}@campus.ac.in`,
        college: 'IIT Bombay',
        collegeCode: targetCollegeCode,
        gender: item.gender,
        interestedIn: isMale ? ['Female'] : ['Male'],
        age,
        ageRange: { min: 18, max: 30 },
        photos: buildPhotos(item.gender),
        bio: getRandom(BIOS),
        branch: getRandom(BRANCHES),
        year: getRandom(YEARS),
        hostel: getRandom(HOSTELS),
        pronouns: isMale ? 'he/him' : 'she/her',
        interests: getRandomSubset(INTEREST_TAGS, 3, 5),
        intent: getRandomSubset(INTENTS, 1, 3),
        prompts: buildPrompts(),
        compatAnswers: buildCompatAnswers(),
        isOnboarded: true,
        isVerified: true,
        isGhost: false,
        isDeleted: false,
        suspended: false,
        lastActive: new Date(Date.now() - hoursAgo * 60 * 60 * 1000),
      };
    });

    const created = await User.insertMany(dummyUsers);
    console.log(`✅ Successfully inserted ${created.length} rich dummy profiles!`);
    console.log('🚀 Go refresh your web app — your Discover deck is now full!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding dummies:', error);
    process.exit(1);
  }
};

seedDatabase();

```

### ./server/socket/chat.js

```
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Match from '../models/Match.js';
import Message from '../models/Message.js';
import { areBlocked } from '../middleware/blockFilter.js';

const onlineUsers = new Map(); // userId -> Set<socketId>

/**
 * Parse a raw cookie header string into a { name: value } map.
 */
const parseCookies = (cookieHeader) => {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach((pair) => {
    const [name, ...rest] = pair.split('=');
    if (name) cookies[name.trim()] = rest.join('=').trim();
  });
  return cookies;
};

export const socketHandler = (io) => {
  // ─── MIDDLEWARE 1: Auth (runs at connect/handshake) ───
  io.use(async (socket, next) => {
    try {
      let token = null;
      const cookies = parseCookies(socket.handshake.headers.cookie);
      if (cookies.matchalize_jwt) {
        token = cookies.matchalize_jwt;
      } else {
        token = socket.handshake.auth.token || socket.handshake.query.token;
      }

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      socket.user = user;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // ─── MIDDLEWARE 2: Connect-time suspension check ───
  // Blocks suspended/deleted users from establishing a connection at all.
  // NOTE: io.use() runs only during the handshake — per-event enforcement
  // for already-connected sockets lives in socket.use() inside the connection handler.
  io.use(async (socket, next) => {
    try {
      const user = await User.findById(socket.user._id)
        .select('suspended isDeleted')
        .lean();

      if (!user || user.isDeleted || user.suspended) {
        return next(new Error(user?.suspended ? 'Account suspended' : 'Account unavailable'));
      }

      next();
    } catch (err) {
      console.error('Suspension check error:', err);
      next(); // Let it pass on DB error — don't lock everyone out
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    socket.join(userId);
    console.log(`User connected: ${socket.user.name} (${userId})`);

    // ─── PER-EVENT SUSPENSION CHECK ───
    // Runs before EVERY inbound event on an already-connected socket.
    // Catches users suspended mid-session and force-disconnects them instantly.
    socket.use(async (packet, next) => {
      try {
        const user = await User.findById(userId)
          .select('suspended isDeleted')
          .lean();

        if (!user || user.isDeleted || user.suspended) {
          socket.emit('force-disconnect', {
            reason: user?.suspended ? 'Account suspended' : 'Account unavailable',
          });
          socket.disconnect(true);
          return next(new Error('Account suspended or deleted'));
        }

        next();
      } catch (err) {
        console.error('Suspension check error:', err);
        next(); // Let it pass on DB error — don't lock everyone out
      }
    });

    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);
    User.findByIdAndUpdate(userId, { lastActive: new Date() }).exec()
      .catch(err => console.error('Failed to update lastActive:', err));

    socket.on('join-match', async (matchId) => {
      if (!matchId || typeof matchId !== 'string') return;

      try {
        const match = await Match.findOne({ _id: matchId, users: userId, isActive: true });
        if (!match) return socket.emit('error', { message: 'Not authorized for this match' });

        const otherUserId = match.users.find(u => u.toString() !== userId);
        if (otherUserId && await areBlocked(userId, otherUserId)) {
          return socket.emit('error', { message: 'Cannot join match — user is blocked' });
        }
      } catch (err) {
        console.error('join-match validation error:', err);
        return;
      }

      socket.join(matchId);
      io.to(matchId).emit('online-update', {
        userId,
        online: true,
        lastActive: new Date().toISOString(),
      });
    });

    socket.on('typing', async ({ matchId }) => {
      if (!matchId || typeof matchId !== 'string') return;
      try {
        const match = await Match.findOne({ _id: matchId, users: userId, isActive: true });
        if (!match) return;
        socket.to(matchId).emit('user-typing', { userName: socket.user.name });
      } catch (err) {
        console.error('typing validation error:', err);
      }
    });

    socket.on('stop-typing', async ({ matchId }) => {
      if (!matchId || typeof matchId !== 'string') return;
      try {
        const match = await Match.findOne({ _id: matchId, users: userId, isActive: true });
        if (!match) return;
        socket.to(matchId).emit('user-stop-typing');
      } catch (err) {
        console.error('stop-typing validation error:', err);
      }
    });

    socket.on('check-online', async ({ matchId, targetUserId }) => {
      try {
        if (!matchId || !targetUserId) return;

        // 🔒 STALKING PREVENTION: Verifies active match membership before disclosing online activity
        const validMatch = await Match.findOne({
          _id: matchId,
          users: { $all: [userId, targetUserId] },
          isActive: true,
        });

        if (!validMatch) return; // Silently drop unauthorized stalking queries

        const isOnline = onlineUsers.has(targetUserId) && onlineUsers.get(targetUserId).size > 0;
        const targetUser = await User.findById(targetUserId).select('lastActive');
        socket.emit('online-status', {
          userId: targetUserId,
          online: isOnline,
          lastActive: targetUser?.lastActive,
        });
      } catch (err) {
        console.error('check-online error:', err);
      }
    });

    socket.on('read-messages', async ({ matchId }) => {
      if (!matchId || typeof matchId !== 'string') return;

      // Validate match membership
      try {
        const match = await Match.findOne({ _id: matchId, users: userId, isActive: true });
        if (!match) return;

        await Message.updateMany(
          { matchId, senderId: { $ne: userId }, readAt: null },
          { $set: { readAt: new Date(), deliveryStatus: 'read' } }
        );
        socket.to(matchId).emit('messages-read', { readerId: userId });
      } catch (err) {
        console.error('Error marking messages as read:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.name}`);

      // Multi-device: remove this socket, keep others
      const sockets = onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) onlineUsers.delete(userId);
      }

      User.findByIdAndUpdate(userId, { lastActive: new Date() }).exec()
        .catch(err => console.error('Failed to update lastActive:', err));

      // Only emit offline if no other sockets for this user
      const stillOnline = onlineUsers.has(userId) && onlineUsers.get(userId).size > 0;
      if (!stillOnline) {
        for (const [room] of socket.rooms) {
          if (room !== socket.id) {
            io.to(room).emit('user-stop-typing', { userId });
            io.to(room).emit('online-update', {
              userId,
              online: false,
              lastActive: new Date().toISOString(),
            });
          }
        }
      }
    });
  });
};

```

### ./server/utils/AppError.js

```
export class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

```

### ./server/utils/email.js

```
export const sendOTP = async (email, otp) => {
  const apiKey = process.env.RESEND_API_KEY;
  const senderEmail = process.env.RESEND_SENDER_EMAIL || 'Matchalize <onboarding@resend.dev>';
  const senderName = process.env.RESEND_SENDER_NAME || 'Matchalize';

  if (!apiKey) {
    console.log(`\n----------------------------------------`);
    console.log(`[DEV MODE] OTP for ${email}: ${otp}`);
    console.log(`----------------------------------------\n`);
    return true;
  }

  const htmlContent = `
    <div style="font-family: 'Inter', sans-serif; background-color: #0A0A0C; color: #F5F5F7; padding: 40px 20px; text-align: center; max-width: 500px; margin: 0 auto; border-radius: 16px; border: 1px solid rgba(255,255,255,0.06);">
      <h1 style="color: #D4A853; font-size: 28px; margin-bottom: 8px; font-weight: 700; letter-spacing: 2px;">MATCHALIZE</h1>
      <p style="color: #6E6E80; font-size: 14px; margin-bottom: 24px;">Your Campus. Your People.</p>
      <div style="background-color: #141418; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid rgba(255,255,255,0.03);">
        <p style="font-size: 16px; color: #F5F5F7; margin-top: 0;">Here is your verification code:</p>
        <div style="font-size: 36px; font-weight: 700; color: #D4A853; letter-spacing: 6px; margin: 16px 0;">${otp}</div>
        <p style="font-size: 12px; color: #6E6E80; margin-bottom: 0;">This code is valid for 10 minutes and can only be used once.</p>
      </div>
      <p style="font-size: 12px; color: #6E6E80; line-height: 1.5;">If you did not request this code, you can safely ignore this email.</p>
    </div>
  `;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${senderName} <${senderEmail}>`,
      to: [email],
      subject: `Matchalize Verification Code: ${otp}`,
      html: htmlContent,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Resend API error:', err);
    throw new Error(`Resend API error: ${err}`);
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log(`\n----------------------------------------`);
    console.log(`[OTP] For ${email}: ${otp}`);
    console.log(`----------------------------------------\n`);
  }

  return true;
};

```

### ./server/utils/push.js

```
import webPush from 'web-push';
import User from '../models/User.js';

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webPush.setVapidDetails(
    'mailto:admin@matchalize.app',
    vapidPublicKey,
    vapidPrivateKey
  );
}

export const sendPushNotification = async (userId, payload) => {
  try {
    const user = await User.findById(userId).select('pushSubscription name');
    if (!user?.pushSubscription) return false;

    const notificationPayload = {
      title: payload.title || 'Matchalize',
      body: payload.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      data: payload.data || {},
      vibrate: [100, 50, 100],
    };

    await webPush.sendNotification(
      user.pushSubscription,
      JSON.stringify(notificationPayload)
    );
    return true;
  } catch (error) {
    if (error.statusCode === 410 || error.statusCode === 404) {
      // Subscription expired or invalid, remove it
      await User.findByIdAndUpdate(userId, { pushSubscription: null }).catch(() => {});
    }
    console.error('Push notification error:', error.message);
    return false;
  }
};

export const generateVapidKeys = () => {
  return webPush.generateVAPIDKeys();
};

```

### ./server/utils/queue.js

```
import * as Sentry from '@sentry/node';

// A zero-dependency, free background task runner.
// Detaches async tasks (push notifications, emails) from the Express response cycle.
export const addToQueue = (task) => {
  setImmediate(async () => {
    try {
      await task();
    } catch (error) {
      console.error('[Background Queue Error]', error);
      // Surface background failures in Sentry when initialized (safe no-op if DSN unset)
      Sentry.captureException(error);
    }
  });
};

```

## Section 4 — Docs & Meta


### ./PRD.md

```
# Matchalize — Product Requirements Document (PRD)

> Updated: Sun Jul 26 2026. Reflects the actual codebase state.

## 1. Product Overview

**Name:** Matchalize
**Type:** Campus dating & social networking PWA
**Tagline:** "Your Campus. Your People."
**Platform:** Web (Progressive Web App, installable on mobile)
**Stack:** React 19.2 (Vite 8.1) + Node.js/Express 4.19 + MongoDB/Mongoose 8.4 + Socket.IO 4.7

Matchalize connects verified college students for dating, friendships, and study partnerships within their own campus community. It restricts access to `.ac.in` academic emails, ensuring an exclusive, campus-only user base.

---

## 2. Target Users

| Attribute | Details |
|-----------|---------|
| **Audience** | Indian college/university students |
| **Age** | 18-40 (enforced) |
| **Access** | `.ac.in` email verification (or all emails in dev mode) |
| **Supported colleges** | IIT Delhi, Bombay, Kanpur, Kharagpur, Madras, Roorkee, Guwahati, Hyderabad, BHU, ISM Dhanbad (expandable via `COLLEGE_MAP`) |

---

## 3. Feature Inventory

### 3.1 Authentication & Verification

| Feature | Status | Description |
|---------|--------|-------------|
| Email OTP login | Done | Enter `.ac.in` email -> receive 6-digit OTP |
| Auto-verification | Done | OTP auto-submits on 6th digit |
| Rate limiting | Done | Max 10 OTP requests/hr per IP, 15 verification attempts/15min per IP, 3 attempts per OTP |
| JWT sessions | Done | 7-day httpOnly cookie, sliding expiration at 6 days |
| College auto-detection | Done | Domain prefix maps to college name (e.g., `iitb` -> "IIT Bombay") |
| Dev mode | Done | OTPs logged to console when SendGrid not configured |
| Suspended user block | Done | Suspended users cannot log in (403 response) |
| Deleted user block | Done | Soft-deleted users cannot log in (403 response) |
| Multi-device logout | Done | `lastLogoutAt` timestamp invalidates older tokens |

### 3.2 Onboarding (9-step wizard)

| Step | Fields | Validation |
|------|--------|------------|
| 1. Basic Info | Name, DOB (auto-calculates age) | name + age required, age 18-40 |
| 2. Gender & Pronouns | Gender (single), Pronouns (optional, 7 options + custom), Interested In (multi-select) | gender required, interestedIn validated with `Array.isArray` |
| 3. Campus Details | Branch (12 options), Year (6 options), Hostel (optional) | branch + year required |
| 4. Photos | Upload up to 6 images (Cloudinary) | >= 1 photo required, URL validated with `isValidImageUrl` |
| 5. Prompts | Select from 43 campus-themed prompts, write answers | >= 3 answered prompts, photo URLs validated |
| 6. Intent & Bio | Connection intent (Dating/Friends/Study), Bio text | >= 1 intent |
| 7. Interests | Pick up to 6 from 22 tags (with Material icon mapping) | -- |
| 8. Compatibility Quiz | 7 multiple-choice questions | all 7 required |
| 9. Profile Preview | Card preview with "Edit" loop-back | -- |

**Submit:** `POST /api/users/setup` -> sets `isOnboarded: true` -> redirects to Discover.
**Resume:** `GET /api/users/onboarding/resume` returns saved progress. `PUT /api/users/onboarding/save` saves per-step. `DELETE /api/users/onboarding/clear` resets.

### 3.3 Discovery (Swipe Deck)

| Feature | Status | Description |
|---------|--------|-------------|
| Flipbook deck | Done | 2-page flipbook via `react-pageflip` (active + preview) |
| Like (send letter) | Done | `POST /api/discover/like/:id` with optional note + target artifact |
| Super Like (Telegram) | Done | `POST /api/discover/superlike/:id` — sends as `seal_stamp` |
| Pass | Done | `POST /api/discover/pass/:id` — 7-day cooldown via atomic upsert |
| Match detection | Done | Mutual letter/telegram -> creates Match -> real-time socket + push notification |
| Compatibility score | Done | 0-100% computed from 7-question matrix (1.0=same, 0.6=similar, 0.2=different) |
| Filtering | Done | Same `collegeCode`, excludes acted/blocked/ghosted/deleted users, respects `interestedIn` + `ageRange` |
| Daily limit | Done | 7 letters + 7 telegrams per day (accepts do NOT count) |
| Haptic feedback | Done | Vibration on swipe and match events |
| Dedup | Done | `actionPendingRef` prevents double-sends; `isActionFlip` prevents duplicate pass on page flip |
| Sort tabs | Done | "All" / "Era" (same year) / "Branch" (same branch) |
| Empty state | Done | "The Ledger is Empty" themed card with retry button |
| Connection banner | Done | Amber "Reconnecting..." banner on socket disconnect |

### 3.4 Likes You (Blurred Reveal)

| Feature | Status | Description |
|---------|--------|-------------|
| Blurred grid | Done | 2-column grid of blurred user cards |
| Tap to reveal | Done | Click removes blur with CSS transition |
| Action buttons | Done | Like back or Pass on revealed user |
| Match creation | Done | Liking back may create a match -> MatchNotification overlay |
| Telegram priority | Done | Telegrams (`seal_stamp`) sorted to top |
| Block exclusion | Done | Blocked users hidden from likes-you grid |

### 3.5 Matching & Notifications

| Feature | Status | Description |
|---------|--------|-------------|
| Match celebration | Done | Compact card modal: avatar + "It's a Match!" + "Send a Message" / "Ignore" |
| Push notifications | Done | Web Push (VAPID) for matches, messages, and info events |
| In-app notifications | Done | Bell icon with unread count, dropdown panel, mark-all-read |
| Notification types | Done | `match`, `message`, `info`, `letter`, `seal_stamp` |
| Letter accept | Done | `POST /api/notifications/:id/accept` — creates match, distinct `accept_letter`/`accept_seal` actionTypes |
| Socket real-time | Done | `match-notification`, `unmatch-notification`, `new-message`, `online-update`, `typing`/`stop-typing`, `messages-read`, `message-deleted` |
| Unmatch real-time | Done | Matches page listens for `unmatch-notification` socket event |
| Icebreakers | Done | `GET /api/matches/:id/icebreakers` — shared interests, same hostel/branch, prompt-based + 5 fallbacks |

### 3.6 Messaging (1:1 Chat)

| Feature | Status | Description |
|---------|--------|-------------|
| Text messages | Done | Send/receive with optimistic UI |
| Image messages | Done | Attach via gallery or camera, upload to Cloudinary |
| Audio messages | Done | Voice recording with iOS fallback (`audio/webm` -> `audio/mp4`/`.m4a`) via `CassettePlayer` |
| Opening letter | Done | First message stored as `type: 'opening_letter'` with upsert |
| Reply threading | Done | Reply-to with quoted message preview |
| Emoji reactions | Done | 6 emoji options (heart, laugh, fire, thumbs up, wow, cry) -- one per user per message |
| Read receipts | Done | `deliveryStatus: 'sent'` -> `'read'` with `readAt` timestamp |
| Typing indicators | Done | Real-time "typing..." dots, cleanup on disconnect + unmount |
| Online status | Done | Green dot, "Online" / "Xm ago" / "Xh ago" |
| Message grouping | Done | Consecutive same-sender messages within 60s visually grouped |
| Soft delete | Done | "This message was deleted" placeholder; Cloudinary media cleaned up |
| Long-press menu | Done | Copy, Reply, React, Report, Delete (own messages only via `showOnlyIfMine`) |
| Photo viewer | Done | Full-screen image overlay with loading spinner + opacity fade |
| Pagination | Done | ObjectId cursor-based (`{ matchId: 1, _id: -1 }` compound index) |
| Duplicate prevention | Done | `clientMsgId` idempotency key; duplicate key error returns existing message (200) |
| Block check | Done | Prevents sending messages to blocked users |
| Character limit | Done | `maxLength={5000}` on input |
| Scroll anchor | Done | `useLayoutEffect` freezes viewport when older messages prepended; `scrollTop < 5` threshold |

### 3.7 Profile Management

| Feature | Status | Description |
|---------|--------|-------------|
| View profile | Done | Renders as ProfileCard (same view others see) |
| Edit profile | Done | Bio, hostel, branch, year, prompts, interests, photos |
| Photo validation | Done | `isValidImageUrl` checks trusted hosts; caps at 6 photos, 3 prompts |
| Orphaned photo cleanup | Done | Compares old vs new photos on save, deletes removed ones from Cloudinary |
| Score animation | Done | Animated compatibility score sweep on profile load |
| Blocked Subjects | Done | Bottom sheet modal with list/unblock functionality |
| Account deletion | Done | Soft delete with 30-day safety retention, themed confirmation dialog |

### 3.8 Report & Block System

| Feature | Status | Description |
|---------|--------|-------------|
| Report user | Done | 5 reasons: Inappropriate photos, Harassment/bullying, Fake profile/spam, Underage user, Other |
| Auto-suspend | Done | 3-4 reports -> shadowban (`isGhost: true`); 5+ reports -> full suspension |
| Block user | Done | Deactivates match + creates bidirectional permanent archive Interactions |
| Unblock user | Done | Removes block + deletes archive Interactions (allows re-encounter) |
| Block exclusion | Done | Blocked users hidden from Discover, Likes You, Chat via `getBlockExclusionQuery()` |
| Block status check | Done | Bidirectional: `iBlockedThem` vs `theyBlockedMe` |
| Duplicate prevention | Done | Unique compound indexes on Report and Block |

### 3.9 Account Lifecycle (Enterprise-Grade)

| Feature | Status | Description |
|---------|--------|-------------|
| Soft delete | Done | `isDeleted: true`, `deletedAt: new Date()`, PII wiped, profile photos removed from Cloudinary |
| Safety retention | Done | Messages, Matches, Interactions retained for 30-day Trust & Safety window |
| Auth guard | Done | `protect` middleware blocks deleted users from all API endpoints |
| Login block | Done | Login endpoint rejects deleted users with 403 |
| Two-tier cleanup | Done | Public profile media -> immediate wipe. Chat media -> retained for safety |
| Match deactivation | Done | All matches set to `isActive: false` on deletion (chats vanish from inboxes) |

### 3.10 PWA & Mobile

| Feature | Status | Description |
|---------|--------|-------------|
| Service Worker | Done | Caches core assets, handles push events |
| Manifest | Done | Standalone display, black theme, orange accent |
| Install prompt | Done | Add to Home Screen on supported browsers |
| Haptic feedback | Done | 7 vibration patterns for mobile UX |
| Notch safe | Done | `viewport-fit=cover` with safe area padding |
| iOS keyboard | Done | `minHeight: 100dvh` + flex layout prevents keyboard overlay |

---

## 4. Architecture

### 4.1 Frontend

```
client/src/
├── main.jsx
├── App.jsx                    # Router, auth guard, socket provider
├── index.css                  # Global styles
├── pages/                     # 7 pages
│   ├── Splash.jsx             # Landing screen with video bg
│   ├── Auth.jsx               # OTP login (2-step)
│   ├── Onboarding.jsx         # 9-step wizard with progress save
│   ├── Discover.jsx           # Flipbook swipe deck + sort tabs
│   ├── Matches.jsx            # Connections list with search
│   ├── Chat.jsx               # Real-time chat (1184 lines)
│   └── Profile.jsx            # View/edit profile + settings
├── components/
│   ├── AppShell.jsx           # Layout wrapper with nav + unread badges
│   ├── NavBar.jsx             # Bottom nav (4 tabs)
│   ├── PolaroidCard.jsx       # Profile card with score animation
│   ├── ProfileCard.jsx        # Draggable profile card
│   ├── ProfileCardSkeleton.jsx
│   ├── ArchivalToast.jsx      # Toast notifications
│   ├── CassettePlayer.jsx     # Audio message player
│   ├── ErrorBoundary.jsx
│   ├── Header.jsx
│   ├── Icon.jsx
│   ├── NotificationDrawer.jsx
│   ├── PopoutItem.jsx
│   ├── Skeleton.jsx
│   └── chat/                  # 7 chat sub-components
│       ├── EmojiPicker.jsx
│       ├── MessageActionMenu.jsx
│       ├── MessageBubble.jsx
│       ├── PhotoViewer.jsx
│       ├── ReplyPreview.jsx
│       ├── ReportModal.jsx
│       └── SearchOverlay.jsx
└── utils/
    ├── api.js                 # Axios instance with interceptors
    ├── AppConfigContext.jsx   # App configuration provider
    ├── AuthContext.jsx        # Auth state + useAuth hook
    ├── dummyProfiles.js       # Test data
    ├── haptics.js             # Vibration patterns
    ├── push.js                # Web Push subscription
    ├── socket.js              # Socket.IO client singleton
    ├── theme.js               # Design tokens
    ├── toast.js               # Toast notifications
    └── useChat.js             # Chat utilities (unused — Chat.jsx has own logic)
```

### 4.2 Backend

```
server/
├── index.js                   # Express + Socket.IO server, CORS, Helmet, rate limiting
├── seedDummies.js             # Seed test profiles
├── config/
│   ├── appData.js             # Static data (prompts, branches, years, genders, etc.)
│   ├── cloudinary.js          # Cloudinary config + deleteCloudinaryFile helper
│   ├── compatQuestions.js     # Compatibility questions + computeCompatibility()
│   └── db.js                  # MongoDB/Mongoose connection
├── middleware/
│   ├── auth.js                # JWT protect, setAuthCookie, clearAuthCookie
│   ├── blockFilter.js         # areBlocked(), getBlockExclusionQuery()
│   ├── rateLimiters.js        # 4 rate limiters (message, discover, verify OTP, OTP request)
│   └── validate.js            # Express-validator middleware
├── models/                    # 10 Mongoose models
│   ├── User.js                # 30+ fields, discover compound index, isDeleted
│   ├── Match.js               # pairKey, users[], isActive, unlockedByInteractionId
│   ├── Message.js             # deliveryStatus, clientMsgId, reactions, soft delete
│   ├── Interaction.js         # 5 actionTypes, cooldownExpiresAt, compound indexes
│   ├── Notification.js        # match/message/info/letter/seal_stamp types
│   ├── OTP.js                 # TTL auto-delete
│   ├── Report.js              # 5 reasons, status tracking
│   ├── Block.js               # Unique {blocker, blocked}
│   ├── Analytics.js           # User event tracking
│   └── Setting.js             # Key-value config
├── routes/
│   ├── auth.js                # OTP send/verify, logout, /me
│   ├── users.js               # Setup, profile CRUD, account deletion (soft delete)
│   ├── discover.js            # Deck, like/superlike/pass, likes-you
│   ├── matches.js             # List, unmatch, icebreakers
│   ├── messages.js            # CRUD, reactions, ObjectId cursor pagination
│   ├── notifications.js       # VAPID, push subscribe, accept letter, read/dismiss
│   ├── report.js              # Report, block/unblock with archive Interactions
│   ├── upload.js              # Cloudinary upload
│   └── config.js              # App config endpoint
├── socket/
│   └── chat.js                # Socket.IO: join room, typing, online status, disconnect cleanup
└── utils/
    ├── AppError.js            # Custom error class
    ├── asyncHandler.js        # Async wrapper
    ├── email.js               # SendGrid OTP emails
    ├── push.js                # Web Push notifications
    └── queue.js               # Async task queue
```

### 4.3 Database (10 collections)

| Collection | Key Fields | Indexes |
|------------|-----------|---------|
| **User** | email, name, photos[], isOnboarded, isGhost, isDeleted, suspended, randomSeed | discover_deck_filter_index (7 fields), text (name+email), randomSeed |
| **Match** | pairKey, users[], isActive, unlockedByInteractionId | { users: 1, isActive: 1 } |
| **Message** | matchId, senderId, type, text, clientMsgId, mediaUrl, deliveryStatus, replyTo, reactions[], deleted, readAt | { matchId: 1, createdAt: 1 }, { matchId: 1, _id: -1 }, { senderId: 1, createdAt: -1 } |
| **Interaction** | actorId, targetId, actionType, targetArtifact, letterContent, cooldownExpiresAt | { actorId: 1, targetId: 1 }, { actorId: 1, cooldownExpiresAt: 1 }, { actorId: 1, actionType: 1, createdAt: -1 }, { targetId: 1, actionType: 1 } |
| **Notification** | recipientId, senderId, type, interactionRef, isCleared | -- |
| **OTP** | email, otp, expiresAt, attempts | TTL on expiresAt |
| **Report** | reporter, reported, reason, details, status | unique {reporter, reported} |
| **Block** | blocker, blocked | unique {blocker, blocked} |
| **Analytics** | user, event, step, timestamp | -- |
| **Setting** | key, value | -- |

---

## 5. API Endpoints (35+)

| Group | Endpoints |
|-------|-----------|
| Auth | `POST /send-otp`, `POST /verify-otp`, `POST /logout`, `GET /me` |
| Users | `POST /setup`, `GET /profile`, `PUT /profile`, `DELETE /account`, `GET /onboarding/resume`, `PUT /onboarding/save`, `DELETE /onboarding/clear`, `POST /logout-all` |
| Discover | `GET /`, `POST /like/:id`, `POST /superlike/:id`, `POST /pass/:id`, `GET /likes-you` |
| Matches | `GET /`, `DELETE /:id`, `GET /:id/icebreakers` |
| Messages | `GET /:matchId` (cursor pagination), `POST /:matchId`, `POST /:matchId/reaction`, `DELETE /:matchId/:msgId` |
| Notifications | `GET /vapid-key`, `POST /subscribe`, `DELETE /subscribe`, `GET /unread-count`, `GET /`, `POST /:id/accept`, `PUT /:id/read`, `PUT /read-all`, `PUT /:id/dismiss` |
| Report/Block | `GET /reasons`, `POST /:userId`, `POST /block/:userId`, `DELETE /block/:userId`, `GET /block/list`, `GET /block/status/:userId` |
| Upload/Config | `POST /upload`, `GET /config` |

---

## 6. Environment & Deployment

| Variable | Purpose | Status |
|----------|---------|--------|
| `PORT` | Server port (5005) | Configured |
| `MONGODB_URI` | MongoDB Atlas | Configured |
| `JWT_SECRET` | JWT secret | Required (server exits if missing) |
| `ALLOW_ALL_EMAILS` | Dev bypass | `true` in dev |
| `RESEND_API_KEY` | Email OTP | Optional (console fallback) |
| `RESEND_SENDER_EMAIL` | Email sender address | Optional (defaults `onboarding@resend.dev`) |
| `RESEND_SENDER_NAME` | Email sender display name | Optional (defaults `Matchalize`) |
| `CLOUDINARY_*` | Photo/audio storage | Configured |
| `VAPID_*` | Push notifications | Configured |
| `SENTRY_DSN` | Error monitoring | Configured |

**Deployment:** Render.com + MongoDB Atlas

---

## 7. Security

| Control | Implementation |
|---------|---------------|
| Helmet.js | CSP headers, XSS protection |
| CORS | Strict Set-based whitelist (no regex wildcards) |
| Rate limiting | Messages: 30/10min per user. Discover: 100/10min per user. OTP: 15/15min + 10/hr per IP |
| OTP | 3 attempts per code, 10-min TTL |
| JWT | 7-day httpOnly cookie, sliding expiration at 6 days |
| Socket.IO | JWT auth on connection |
| Upload | 5MB file limit, `isValidImageUrl` trusted host validation |
| Auto-suspend | 3 reports = shadowban, 5+ reports = full suspension |
| Block exclusion | Discover, Likes You, Chat, Socket rooms |
| Self-interaction guard | Cannot like/pass/report yourself |
| Deleted user guard | All API endpoints + login blocked for `isDeleted` users |
| Idempotency | `clientMsgId` on messages prevents duplicate sends |
| Input validation | `express-validator` on auth, setup, and message routes |

---

## 8. Design System

| Element | Value |
|---------|-------|
| Primary | Orange (#f97316) |
| Background | Near-black (#000) |
| Surface | Dark gray (#1a1a1a) |
| Text | White / dim |
| Border radius | 12-24px (cards), 99px (buttons) |
| Headings | Geist Sans 700 |
| Body | Inter 400-600 |
| Icons | Material Symbols Outlined + Lucide React |
| Max width | 430px |
| Animations | Framer Motion (page transitions, card gestures) + GSAP (score sweep) |

---

## 9. Known Gaps

| # | Gap | Severity |
|---|-----|----------|
| 1 | No message editing (deletion only) | Feature gap |
| 2 | No `delivered` delivery status (goes `sent` -> `read`) | Nice-to-have |
| 3 | No empty chat placeholder for zero-message matches | Minor UX |
| 4 | No error message on Discover fetch failure | Minor UX |
| 5 | No rate limiting on message delete or block/unblock | Low risk |
| 6 | Delete uses `window.confirm` instead of themed modal | Polish |
| 7 | No admin dashboard for reports/suspensions | Feature gap |
| 8 | No E2E or unit tests | Quality gap |
| 9 | No CI/CD pipeline | DevOps gap |
| 10 | Seed is destructive (`deleteMany` on run) | Dev tooling |

```

### ./HANDOFF.md

```
# Matchalize — Handoff Status Report

> Updated: Sun Jul 26 2026. Reflects the actual codebase state after 55+ bug fixes and hardening passes.

---

## Architecture

| Layer | Stack |
|-------|-------|
| Frontend | React 19.2, Vite 8.1, Framer Motion 12, React Router 7, TanStack Query 5 |
| Backend | Express 4.19, Mongoose 8.4, Socket.IO 4.7, JWT (httpOnly cookies) |
| DB | MongoDB Atlas (10 collections) |
| Uploads | Cloudinary v2 (primary), with `deleteCloudinaryFile` cleanup helper |
| Push | Web Push API + VAPID keys |
| Monitoring | Sentry (client + server) |
| Hosting | Render.com (server + static client) |
| Style | Mobile-first PWA (430px max), dark theme (#000), orange accent (#f97316), Geist Sans 700 + Inter 400-600 |

## File Count

| Area | Files |
|------|-------|
| `client/src/pages/` | 7 (Splash, Auth, Onboarding, Discover, Matches, Chat, Profile) |
| `client/src/components/` | 13 root + 7 chat subcomponents |
| `client/src/utils/` | 10 (api, AuthContext, AppConfigContext, socket, theme, toast, haptics, push, useChat, dummyProfiles) |
| `server/routes/` | 9 (auth, users, discover, matches, messages, notifications, report, upload, config) |
| `server/models/` | 10 (User, Match, Message, Notification, OTP, Report, Block, Interaction, Analytics, Setting) |
| `server/middleware/` | 4 (auth, blockFilter, rateLimiters, validate) |
| `server/config/` | 4 (appData, cloudinary, compatQuestions, db) |
| `server/socket/` | 1 (chat.js) |
| `server/utils/` | 5 (email, push, queue, AppError, asyncHandler) |

**Total: ~70 source files**

## Key Patterns

- **Auth:** httpOnly cookie (`matchalize_jwt`), 7-day JWT, sliding expiration at 6 days, `ProtectedRoute` in App.jsx
- **State:** No state library — `AuthContext` + `AppConfigContext` only. React Query for server state.
- **Sockets:** Created per-page (Discover, Matches, Chat) via shared `utils/socket.js`. Not a global context.
- **Styles:** Inline styles only — no CSS modules, Tailwind, or styled-components.
- **Server:** ESM (`"type": "module"`). No TypeScript.
- **Vite:** Proxies `/api/*` and `/uploads` to `http://localhost:5005` in dev.
- **Errors:** Inline `res.status(X).json({ message: '...' })` — no custom error utility.
- **Rate limiters:** Per-user for messages (30/10min) and discover (100/10min). Per-IP for OTP (15/15min + 10/hr).

## Dev Mode

`ALLOW_ALL_EMAILS=true` bypasses `.ac.in` restriction. When `RESEND_API_KEY` is unset, OTP codes log to console only (no email sent). Both conditions print warnings at startup.

---

## Bug Fixes Applied (55+ issues)

### Safari / WebKit (3-part fix)
- `react-pageflip` DOM hijacking caused `NotFoundError` on Safari
- Added `pageFlip().destroy()` cleanup in Discover.jsx useEffect
- Swapped `<Suspense>` / `<AnimatePresence>` nesting order
- Stabilized page keys to prevent unnecessary re-renders

### Auth & Security
- **CORS hardened:** Replaced regex wildcard `*.onrender.com` with strict Set-based whitelist (`server/index.js`)
- **Suspended user check:** `protect` middleware returns `403 { suspended: true }`. Client catches + redirects to Auth
- **Deleted user check:** `protect` middleware returns `403 { deleted: true }`. Login also blocked for `isDeleted` users
- **Self-like guard:** `handleLike` returns 400 if `targetId === currentUser._id` (`discover.js`)
- **Profile URL validation:** `isValidImageUrl` applied to both `POST /setup` and `PUT /profile` — caps at 6 photos, 3 prompts
- **Socket membership validation:** `check-online` verifies both users share an active match before emitting
- **Dead listener removed:** Deleted orphaned `send-message` socket listener from `chat.js`

### Discover Deck
- **Fast deck engine:** Replaced slow `$sample` aggregation with indexed `randomSeed` range query (`discover.js`)
- **Atomic upsert:** Pass cooldowns use `findOneAndUpdate` with `upsert: true` instead of separate create/update
- **Bidirectional deck exclusion:** Queries both `actorId` and `targetId` for archive, letter, seal_stamp, accept_letter, accept_seal
- **Permanent archive fix:** `cooldownExpiresAt === null` now correctly always excludes (`!it.cooldownExpiresAt` check)
- **InterestedIn filter:** `Array.isArray` guard in Onboarding.jsx prevents crash on corrupted data
- **Gender preference UI:** Multi-select toggle on Onboarding PAGE 2 ("Show Me" filter)
- **isActionFlip guard:** Prevents `onPageFlip` from sending duplicate Pass actions
- **Dead code removed:** Removed `&reset=true` from Discover fetch URL; removed `.catch(console.error)` on pass

### Real-Time Chat
- **Multi-device broadcast:** Changed `io.to(recipientId)` to `io.to(matchId)` for match room broadcasting
- **Read receipts:** `deliveryStatus: 'read'` now set alongside `readAt` in both GET messages and socket `read-messages`
- **Typing cleanup on disconnect:** Server emits `user-stop-typing` in existing `!stillOnline` socket loop
- **Stop-typing on unmount:** Chat.jsx cleanup emits `stop-typing` when `typingTimer.current` is set
- **Message dedup:** `pendingMsgIdRef` generates `clientMsgId` once via useRef, prevents duplicate sends
- **Duplicate key handling:** `Message.create` wrapped in try/catch — duplicate key returns existing message with 200
- **Connection status banner:** Amber "Reconnecting..." banner on socket disconnect (WhatsApp pattern)
- **Character limit:** `maxLength={5000}` on chat input
- **iOS scroll threshold:** `scrollTop < 5` instead of `=== 0` for reliable detection
- **Back button:** Enlarged to 44px touch target with `WebkitTapHighlightColor`
- **Chat media upload:** Field name corrected from `'file'` to `'photo'`; `setPendingFile(null)` moved to `finally` block
- **Message delete:** `showOnlyIfMine: true` flag, filter logic, `toast.error` on catch
- **Emoji picker fix:** `if (a.key !== 'react') onClose()` keeps `selectedMessage` alive for emoji interactions

### Socket & Presence
- **Socket reconnect:** `socket.on('connect', onReconnect)` re-emits `join-match` after reconnect
- **Online status:** `socket.user.name` used for typing indicator instead of client-supplied value
- **Badge counts:** Unread match count filters for `yourTurn` or unread `lastMessage` only; clears on chat open

### Profile & Onboarding
- **Query invalidation:** `queryClient.invalidateQueries({ queryKey: ['matches'] })` after profile save
- **Image opacity fade:** All `<img>` tags (Chat header, Profile hero, PolaroidCard, ProfileCard) use `opacity: 0` → `onLoad` → `opacity: 1`
- **AppShell default:** `default:` case renders `<Profile>` instead of returning null

### Account Lifecycle (Enterprise-Grade)
- **Soft delete:** Account deletion sets `isDeleted: true`, `deletedAt: new Date()`, wipes PII, retains data for 30-day safety window
- **Two-tier cleanup:** Public profile media → immediate Cloudinary wipe. Chat media + Messages + Matches + Interactions → retained 30 days for Trust & Safety
- **Block → Unblock:** Block creates bidirectional permanent archive Interactions. Unblock removes them (allows re-encounter)
- **Unmatch:** Creates permanent archive Interaction. Matches page listens for `unmatch-notification` socket event for real-time removal
- **Delete dialog:** "This will immediately deactivate your profile, sever all active connections, and remove your correspondence from campus view. To maintain campus safety, archival logs are retained for 30 days before permanent destruction."

### Interaction Model
- **5 actionTypes:** `archive`, `letter`, `seal_stamp`, `accept_letter`, `accept_seal`
- **Accept budget fix:** Accepting letters uses `accept_letter`/`accept_seal` — does NOT count against daily sending limit
- **Indexes:** `{ actorId: 1, targetId: 1 }`, `{ actorId: 1, cooldownExpiresAt: 1 }`, `{ actorId: 1, actionType: 1, createdAt: -1 }` (daily limit), `{ targetId: 1, actionType: 1 }` (likes-you)

### Database Indexes
- **User discover:** `{ collegeCode: 1, isOnboarded: 1, isGhost: 1, isVerified: 1, suspended: 1, isDeleted: 1, randomSeed: 1 }`
- **User randomSeed:** Individual index for fast range queries
- **User text:** `{ name: 'text', email: 'text' }`
- **Match:** `{ users: 1, isActive: 1 }`
- **Message:** `{ matchId: 1, createdAt: 1 }`, `{ matchId: 1, _id: -1 }` (cursor pagination), `{ senderId: 1, createdAt: -1 }`
- **Interaction:** `{ actorId: 1, targetId: 1 }`, `{ actorId: 1, cooldownExpiresAt: 1 }`, `{ actorId: 1, actionType: 1, createdAt: -1 }`, `{ targetId: 1, actionType: 1 }`

### iPhone / iOS
- **Keyboard layout fix:** `<main>` changed from `position: fixed` + `overflowY: hidden` to `minHeight: 100dvh` + flex layout
- **Voice recording:** Detects `audio/webm`, falls back to `audio/mp4` with `.m4a` extension for iOS Safari

### Cloudinary
- **Cleanup engine:** `deleteCloudinaryFile` helper extracts public_id, handles audio/video detection, destroys from Cloudinary
- **Orphaned photo cleanup:** `collectUserPhotos` helper collects all profile/bio/prompt photos, compares old vs new, deletes orphans
- **Audio support:** Dynamic `params` function in upload route, audio folder, format list expanded

---

## Known Gaps (remaining)

| # | Gap | Severity |
|---|-----|----------|
| 1 | No message editing (deletion only) | Feature gap |
| 2 | No `delivered` status (goes `sent` → `read` directly) | Nice-to-have |
| 3 | No empty chat placeholder for zero-message matches | Minor UX |
| 4 | No error message on Discover fetch failure | Minor UX |
| 5 | No rate limiting on message delete or block/unblock | Low risk |
| 6 | Delete uses `window.confirm` instead of themed modal | Polish |
| 7 | No admin dashboard for reports/suspensions | Feature gap |
| 8 | No E2E or unit tests | Quality gap |
| 9 | No CI/CD pipeline | DevOps gap |
| 10 | Seed is destructive (`deleteMany` on run) | Dev tooling |

```

