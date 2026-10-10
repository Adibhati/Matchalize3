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
