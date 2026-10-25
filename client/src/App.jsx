import React, { useState, useEffect } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
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
  const [isTabletViewport, setIsTabletViewport] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 601px)').matches
  );
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

  useEffect(() => {
    const tabletViewport = window.matchMedia('(min-width: 601px)');
    const updateTabletViewport = () => setIsTabletViewport(tabletViewport.matches);
    updateTabletViewport();
    tabletViewport.addEventListener('change', updateTabletViewport);
    return () => tabletViewport.removeEventListener('change', updateTabletViewport);
  }, []);

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
      maxWidth: '100%',
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
      <LayoutGroup id="splash-auth-transition">
        <AnimatePresence mode="sync">
          {screen === 'splash' && (
            <motion.div key="splash" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} initial={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.5 }}>
              <Splash onEnter={() => setScreen('auth')} />
            </motion.div>
          )}

          {screen === 'auth' && (
            <motion.div
              key="auth"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
              initial={{ opacity: 0, y: 18, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.99 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <Auth onSuccess={() => {
                const u = JSON.parse(localStorage.getItem('matchalize_user') || '{}');
                // A returning student whose annual check is due lands on the
                // re-verify step, not onboarding — they're already onboarded.
                setScreen(u.reverifyRequired ? 'reverify' : u.isOnboarded ? 'home' : 'onboarding');
              }} />
            </motion.div>
          )}

        {screen === 'reverify' && (
          <motion.div key="reverify" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <Auth onSuccess={() => setScreen('home')} reverifyOnly />
          </motion.div>
        )}
        
        {screen === 'onboarding' && (
          <motion.div key="onboarding" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }}>
            <AppConfigProvider>
              <Onboarding
                onComplete={() => setScreen('home')}
                onSignOut={handleSignOut}
              />
            </AppConfigProvider>
          </motion.div>
        )}
        
          {screen === 'home' && (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <AppConfigProvider>
                <AppShell onSignOut={handleSignOut} />
              </AppConfigProvider>
            </motion.div>
          )}
        </AnimatePresence>
      </LayoutGroup>
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
