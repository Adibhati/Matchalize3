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
