import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Header from './Header';
import NavBar from './NavBar';
import DesktopSidebar from './DesktopSidebar';
import { api } from '../utils/api';
import { useAuth } from '../utils/AuthContext';
import PushPrompt from './PushPrompt';
import { SkeletonBox } from './Skeleton';
import { useIsDesktop } from '../utils/useIsDesktop';
import { setToastPresenceHandler } from '../utils/toast';
import Settings from '../pages/Settings.jsx';
import socket from '../utils/socket';
import neu from '../styles/neu';

// Lazy loaded routes
const Discover = lazy(() => import('../pages/Discover'));
const Matches = lazy(() => import('../pages/Matches'));
const Chat = lazy(() => import('../pages/Chat'));
const Profile = lazy(() => import('../pages/Profile'));
const Roulette = lazy(() => import('../pages/Roulette'));

/* The shared neo-brutalist canon (src/styles/neu.js) */
const t = neu;

const ArchivalFallback = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    style={{
      position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: t.desk, zIndex: 10,
    }}
  >
    <div style={{
      width: 'min(300px, 78%)', padding: '26px 24px',
      backgroundColor: t.paper, border: `2px solid ${t.ink}`, borderRadius: 18,
      boxShadow: `6px 6px 0 ${t.ink}`,
      display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center',
    }}>
      <SkeletonBox width={48} height={48} radius={14} />
      <SkeletonBox width="60%" height={22} radius={6} />
      <SkeletonBox width="40%" height={14} radius={5} />
    </div>
  </motion.div>
);

const TAB_TITLES = { discover: 'Deck', matches: 'Letters', roulette: 'Roulette', profile: 'Profile' };

const AppShell = ({ onSignOut }) => {
  const isDesktop = useIsDesktop();
  const [activeTab, setActiveTab] = useState('discover');
  const [activeChat, setActiveChat] = useState(null);
  /* Whether the SHEET wants the header up. Sheets are the only thing that
     drives this (the deck card and the profile sheet both report proximity).
     The header's actual visibility is derived from this AND the toast, because
     both claim the same strip of screen — see `headerVisible` below. */
  const [headerWanted, setHeaderWanted] = useState(true);
  /* A toast occupies the top strip. While one is up the header slides out and
     back in, mirroring how the sheet slides the header away when it rises —
     otherwise the toast lands on top of a header that stays put and the two
     read as overlapping furniture. */
  const [toastUp, setToastUp] = useState(false);
  const headerVisible = headerWanted && !toastUp;

  /* Subscribe to toast presence. Kept separate from the render handler so this
     effect doesn't re-register on every toast that fires. */
  useEffect(() => {
    setToastPresenceHandler((up) => setToastUp(up));
    return () => setToastPresenceHandler(null);
  }, []);
  const [settingsOpen, setSettingsOpen] = useState(false);

  /* One-shot instruction for the Profile page to scroll itself so the
     "Profile strength" bar is visible on arrival. Set by the deck's gate toast,
     consumed by Profile on mount, then cleared — a plain boolean would re-fire
     every time the user switched tabs, yanking the sheet down again for no
     reason. */
  const [focusProfileStrength, setFocusProfileStrength] = useState(false);

  const handleGoToProfile = useCallback(() => {
    setFocusProfileStrength(true);
    setActiveTab('profile');
  }, []);
  const { user } = useAuth();

  // ── Push-notification deep link ────────────────────────────────────────────
  // The service worker used to navigate to `/chat/<alignmentId>`, but this app
  // has NO router — App.jsx picks a screen from component state, so that path
  // just booted to the deck and the notification appeared to do nothing. The SW
  // now sends `/?chat=<alignmentId>` and we resolve it here instead.
  //
  // Read once on mount: after the chat opens we strip the param with
  // replaceState, so a later reload or a Back press doesn't reopen it.
  const [pendingChatId] = useState(
    () => new URLSearchParams(window.location.search).get('chat')
  );
  const queryClient = useQueryClient();
  const myId = user?._id;

  const { data: matchData } = useQuery({
    queryKey: ['matches'],
    queryFn: () => api.get('/alignments'),
    staleTime: 30000,
  });

  // Total unread messages across all conversations (WhatsApp style)
  const matchCount = (matchData?.matches || []).reduce((sum, m) => sum + (m.unreadCount || 0), 0);

  // Global socket listener for live badge updates on any screen
  useEffect(() => {
    const handleNewMessage = (data) => {
      if (!data?.alignmentId) return;
      queryClient.setQueryData(['matches'], (old) => {
        if (!old?.matches) return old;
        return {
          ...old,
          matches: old.matches.map((m) =>
            m._id === data.alignmentId
              ? { ...m, unreadCount: (m.unreadCount || 0) + 1, yourTurn: true, lastMessage: { ...m.lastMessage, senderId: data.senderId, readAt: null } }
              : m
          ),
        };
      });
    };
    socket.on('new-message', handleNewMessage);
    return () => socket.off('new-message', handleNewMessage);
  }, [queryClient]);

  const handleOpenChat = (match) => {
    queryClient.setQueryData(['matches'], (old) => {
      if (!old?.matches) return old;
      return {
        ...old,
        matches: old.matches.map((m) =>
          m._id === match._id
            ? { ...m, yourTurn: false, unreadCount: 0, lastMessage: { ...m.lastMessage, readAt: new Date().toISOString() } }
            : m
        ),
      };
    });
    setActiveChat(match);
  };

  const handleCloseChat = () => {
    setActiveChat(null);
  };

  // Open a conversation by alignment id, from either entry point below. Needs the
  // full match object (for Chat to render the header), so it waits for the
  // matches list rather than opening a half-built chat.
  const openChatById = (alignmentId) => {
    if (!alignmentId || !matchData?.matches) return false;
    const match = matchData.matches.find((m) => m._id === alignmentId);
    if (!match) return false;

    setActiveTab('matches');
    // Mark it read in the cache so the unread badge doesn't immediately re-count
    // the conversation the user was just sent to.
    queryClient.setQueryData(['matches'], (old) => {
      if (!old?.matches) return old;
      return {
        ...old,
        matches: old.matches.map((m) =>
          m._id === alignmentId ? { ...m, yourTurn: false, unreadCount: 0 } : m
        ),
      };
    });
    setActiveChat(match);
    return true;
  };

  // Entry point 1 — cold start: service worker opened /?chat=<id>.
  useEffect(() => {
    if (!pendingChatId || !matchData?.matches) return;
    openChatById(pendingChatId);
    // Strip the param either way: if the alignment wasn't on the first page we
    // still land on Matches, and a reload shouldn't retry forever.
    window.history.replaceState({}, '', window.location.pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingChatId, matchData, queryClient]);

  // Entry point 2 — app already open: service worker focused the tab and
  // postMessaged the id, so no navigation happens and the param path above
  // never runs.
  useEffect(() => {
    const onMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== 'open-chat') return;
      openChatById(event.data.alignmentId);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchData, queryClient]);

  const renderPage = () => {
    switch (activeTab) {
      case 'discover':
        return <Discover key="discover" onOpenChat={handleOpenChat} onSheetNearHeader={(near) => setHeaderWanted(!near)} onGoToProfile={handleGoToProfile} />;
      case 'matches':
        return <Matches key="matches" onOpenChat={handleOpenChat} />;
      case 'profile':
        return <Profile key="profile" onHeaderHiddenChange={(hidden) => setHeaderWanted(!hidden)} focusStrength={focusProfileStrength} onStrengthFocused={() => setFocusProfileStrength(false)} />;
      case 'roulette':
        return <Roulette key="roulette" />;
      default:
        return <Profile key="profile" onHeaderHiddenChange={(hidden) => setHeaderWanted(!hidden)} focusStrength={focusProfileStrength} onStrengthFocused={() => setFocusProfileStrength(false)} />;
    }
  };

  // DESKTOP LAYOUT
  if (isDesktop) {
    return (
      <div style={desktopStyles.shellRoot}>
        <DesktopSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          matchBadge={matchCount}
          onSignOut={onSignOut}
        />
        <PushPrompt />

        <div style={desktopStyles.contentArea}>
          <Header
            onSelectMatch={handleOpenChat}
            onNavigate={(tab) => setActiveTab(tab)}
            title={TAB_TITLES[activeTab] || activeTab}
            onSettingsToggle={() => setSettingsOpen(true)}
            visible={headerVisible}
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

        <AnimatePresence>
          {activeChat && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={desktopStyles.chatBackdrop}
              onClick={handleCloseChat}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 12 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                style={desktopStyles.chatModal}
                onClick={(e) => e.stopPropagation()}
              >
                <Suspense fallback={<ArchivalFallback />}>
                  <Chat match={activeChat} onBack={handleCloseChat} />
                </Suspense>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {settingsOpen && <Settings onSignOut={onSignOut} onClose={() => setSettingsOpen(false)} />}
      </div>
    );
  }

  // MOBILE LAYOUT
  return (
    <div style={styles.shellRoot}>
      <Header
        onSelectMatch={handleOpenChat}
        onNavigate={(tab) => setActiveTab(tab)}
        title={TAB_TITLES[activeTab] || activeTab}
        onSettingsToggle={() => setSettingsOpen(true)}
        visible={headerVisible}
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
      <PushPrompt />

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

      {settingsOpen && <Settings onSignOut={onSignOut} onClose={() => setSettingsOpen(false)} />}
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
    backgroundColor: t.desk,
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
    backgroundColor: t.desk,
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
    backgroundColor: t.paper,
    borderTop: `2px solid ${t.ink}`,
    display: 'flex',
    flexDirection: 'column',
    willChange: 'transform',
    boxShadow: '0 -18px 50px rgba(0,0,0,.45)',
  },
};

// DESKTOP STYLES
const desktopStyles = {
  shellRoot: {
    display: 'flex',
    flexDirection: 'row',
    height: '100dvh',
    width: '100%',
    backgroundColor: t.desk,
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
    backgroundColor: t.desk,
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
    width: 'min(800px, 92vw)',
    height: 'min(85vh, 860px)',
    backgroundColor: t.paper,
    borderRadius: '22px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    border: `2px solid ${t.ink}`,
    boxShadow: `8px 8px 0 ${t.ink}`,
  },
  chatBackdrop: {
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(12,12,14,0.62)',
  },
};

export default AppShell;