import React, { useState, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Header from './Header';
import NavBar from './NavBar';
import { api } from '../utils/api';
import { useAuth } from '../utils/AuthContext';
import { SkeletonBox } from './Skeleton';
import { theme as design } from '../utils/theme';

// Lazy loaded routes
const Discover = lazy(() => import('../pages/Discover'));
const Matches = lazy(() => import('../pages/Matches'));
const Chat = lazy(() => import('../pages/Chat'));
const Profile = lazy(() => import('../pages/Profile'));

/* ==================================================================
   ARCHIVAL THEME FALLBACK
================================================================== */
const theme = {
  paper: '#fdfbf7',
  surfaceAlt: '#f4f1ea',
  borderDark: '#d4c5a9',
  shadowWarm: 'rgba(139, 69, 19, 0.12)',
};

// Zero-Lag Cinematic Loading State
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

/* ==================================================================
   MAIN APPLICATION SHELL
================================================================== */
const AppShell = ({ onSignOut }) => {
  const [activeTab, setActiveTab] = useState('discover');
  const [activeChat, setActiveChat] = useState(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const myId = user?._id;

  // Seamlessly sync match count using React Query cache (Zero redundant network requests)
  const { data: matchData } = useQuery({
    queryKey: ['matches'],
    queryFn: () => api.get('/matches'),
    staleTime: 30000, // Keep fresh for 30s before refetching
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

  // Switch statement wrapped for AnimatePresence transitions
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

  return (
    <div style={styles.shellRoot}>
      
      {/* 1. Main Navigation Header */}
      <Header
        onSelectMatch={handleOpenChat}
        onNavigate={(tab) => setActiveTab(tab)}
        title={activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
      />

      {/* 2. Fluid Content Stage */}
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

      {/* 3. Bottom Navigation Bar */}
      <NavBar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        matchBadge={matchCount} 
      />

      {/* 
        4. Chat Modal Overlay 
        Rendering Chat as a GPU-promoted overlay over the shell prevents 
        Discover/Matches from unmounting, completely eliminating navigation lag!
      */}
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
    height: '100dvh', // Modern mobile viewport height
    width: '100%',
    backgroundColor: theme.paper,
    overflow: 'hidden',
    position: 'relative',
    contain: 'layout',
  },
  contentStage: {
    flex: 1,
    minHeight: 0, // Critical: Allows flex children to scroll cleanly without breaking the layout
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
    willChange: 'transform, opacity', // GPU acceleration for tab switches
  },
  chatOverlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 1000, // Explicitly layers over Header, Nav, and Stage
    backgroundColor: theme.paper,
    display: 'flex',
    flexDirection: 'column',
    willChange: 'transform',
    boxShadow: `0 -20px 60px rgba(0,0,0,0.3)`,
  },
};

export default AppShell;