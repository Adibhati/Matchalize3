import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './utils/AuthContext';
import { AppConfigProvider } from './utils/AppConfigContext';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Splash from './pages/Splash.jsx';
import Admin from './pages/Admin.jsx';
import Auth from './pages/Auth.jsx';
import Onboarding from './pages/Onboarding.jsx';
import AppShell from './components/AppShell';
import socket from './utils/socket';
import ArchivalToast from './components/ArchivalToast.jsx';

function AppInner() {
  // If the app is loaded at /admin, render the standalone Admin panel
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
    return <Admin />;
  }
  const { logout } = useAuth();
  const [screen, setScreen] = useState(() => {
    try {
      const user = JSON.parse(localStorage.getItem('matchalize_user') || '{}');
      if (user && user._id) {
        // If they are logged in but haven't onboarded, force them to onboarding
        return user.isOnboarded ? 'home' : 'onboarding';
      }
      return 'splash';
    } catch {
      return 'splash';
    }
  });

  const handleSignOut = () => {
    if (socket) socket.disconnect(); // Disconnect real-time connection
    logout();
    setScreen('splash');
  };

  return (
    <main style={{ 
      maxWidth: '430px', 
      margin: '0 auto', 
      minHeight: '100dvh', // 📱 NATIVE FLEX: Allows Safari to compress cleanly when keyboard slides up
      backgroundColor: '#f4f1ea', 
      boxShadow: '0 0 60px rgba(0,0,0,0.08)', 
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
      staleTime: 1000 * 60 * 2, // 2 minutes - prevents refetching the same data too often
      refetchOnWindowFocus: false, // Don't refetch when user switches tabs
    },
  },
});

function App() {
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