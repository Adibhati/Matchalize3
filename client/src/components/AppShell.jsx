import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Header from './Header';
import NavBar from './NavBar';
import DesktopSidebar from './DesktopSidebar';
import DesktopPanelBackButton from './DesktopPanelBackButton';
import { closeAllPopouts } from './PopoutItem';
import { api } from '../utils/api';
import PushPrompt from './PushPrompt';
import { useIsDesktop } from '../utils/useIsDesktop';
import { setToastPresenceHandler } from '../utils/toast';
import Settings from '../pages/Settings.jsx';
import socket from '../utils/socket';
import neu from '../styles/neu';
import { useChromeColor } from '../utils/chrome';

// Lazy loaded routes
const Discover = lazy(() => import('../pages/Discover'));
const Matches = lazy(() => import('../pages/Matches'));
const Chat = lazy(() => import('../pages/Chat'));
const Profile = lazy(() => import('../pages/Profile'));
const Roulette = lazy(() => import('../pages/Roulette'));

/* The shared neo-brutalist canon (src/styles/neu.js) */
const t = neu;

const TAB_TITLES = { discover: 'Deck', matches: 'Letters', roulette: 'Roulette', profile: 'Profile' };
const PHONE_TAB_ORDER = ['discover', 'matches', 'roulette', 'profile'];
const TABLET_PANEL_WIDTH = 'min(640px, calc(100vw - 72px))';
const TABLET_LAYOUT_QUERY = '(min-width: 601px) and (max-width: 1199px) and (min-height: 601px)';

/**
 * 📱 CHROME COLOUR PER SCREEN — the browser's status bar and the strip above
 * the home indicator are painted from these, so the app reads as one continuous
 * surface instead of a page floating between two browser-owned bands.
 *
 * Every tab is dark (`neu.desk`) EXCEPT Profile, which is cream, because that
 * is genuinely what each screen renders — this is not decoration invented to
 * make the bars look nice, it is reporting the screen's own background. Change a
 * screen's background in neu.js and this follows it in the same commit.
 *
 * The chat overlay takes the tab's colour rather than a third one: Chat is
 * rendered on top of the tab it was opened from, and giving it its own colour
 * would flash the bars a different shade every time a conversation opens.
 */
const TAB_CHROME = {
  discover: neu.desk,
  matches: neu.desk,
  roulette: neu.desk,
  profile: neu.paper,
};

const AppShell = ({ onSignOut }) => {
  const isDesktop = useIsDesktop();
  const [isTabletLayout, setIsTabletLayout] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(TABLET_LAYOUT_QUERY).matches
  );
  const [activeTab, setActiveTab] = useState('discover');
  const [activeChat, setActiveChat] = useState(null);
  const [desktopLettersOpen, setDesktopLettersOpen] = useState(false);
  const [desktopNotificationsOpen, setDesktopNotificationsOpen] = useState(false);
  const [phoneNotificationsOpen, setPhoneNotificationsOpen] = useState(false);
  const [phoneReplyKeyboardOpen, setPhoneReplyKeyboardOpen] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
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
  const afterPopoutsClose = useCallback((action) => {
    void closeAllPopouts().then(action);
  }, []);

  // Paint the browser's status bar and overscroll gutter to match the screen
  // underneath. Falls back to the desk colour for any tab not in the map, so a
  // future tab cannot leave the bars showing a stale colour.
  useChromeColor(TAB_CHROME[activeTab] || neu.desk);

  /* Subscribe to toast presence. Kept separate from the render handler so this
     effect doesn't re-register on every toast that fires. */
  useEffect(() => {
    setToastPresenceHandler((up) => setToastUp(up));
    return () => setToastPresenceHandler(null);
  }, []);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (isDesktop || isTabletLayout) return undefined;

    const isBlockedByOverlay = () => (
      activeChat || settingsOpen || phoneNotificationsOpen
      || phoneReplyKeyboardOpen
      || document.querySelector('.po-overlay, [aria-modal="true"]')
    );
    const onPointerDown = (event) => {
      phoneSwipeRef.current = null;
      if (event.pointerType !== 'touch' || isBlockedByOverlay()) return;
      phoneSwipeRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
      };
    };
    const onPointerUp = (event) => {
      const gesture = phoneSwipeRef.current;
      phoneSwipeRef.current = null;
      if (!gesture || gesture.pointerId !== event.pointerId || isBlockedByOverlay()) return;

      const deltaX = event.clientX - gesture.startX;
      const deltaY = event.clientY - gesture.startY;
      if (Math.abs(deltaX) < 64 || Math.abs(deltaX) < Math.abs(deltaY) * 1.35) return;

      const currentIndex = PHONE_TAB_ORDER.indexOf(activeTab);
      const nextIndex = currentIndex + (deltaX < 0 ? 1 : -1);
      if (currentIndex < 0 || nextIndex < 0 || nextIndex >= PHONE_TAB_ORDER.length) return;

      suppressSwipeClickRef.current = true;
      if (suppressSwipeClickTimerRef.current) clearTimeout(suppressSwipeClickTimerRef.current);
      suppressSwipeClickTimerRef.current = setTimeout(() => {
        suppressSwipeClickRef.current = false;
        suppressSwipeClickTimerRef.current = null;
      }, 400);
      afterPopoutsClose(() => setActiveTab(PHONE_TAB_ORDER[nextIndex]));
    };
    const onPointerCancel = () => { phoneSwipeRef.current = null; };
    const onClickCapture = (event) => {
      if (!suppressSwipeClickRef.current) return;
      suppressSwipeClickRef.current = false;
      if (suppressSwipeClickTimerRef.current) clearTimeout(suppressSwipeClickTimerRef.current);
      suppressSwipeClickTimerRef.current = null;
      event.preventDefault();
      event.stopImmediatePropagation();
    };

    window.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('pointerup', onPointerUp, true);
    window.addEventListener('pointercancel', onPointerCancel, true);
    window.addEventListener('click', onClickCapture, true);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('pointerup', onPointerUp, true);
      window.removeEventListener('pointercancel', onPointerCancel, true);
      window.removeEventListener('click', onClickCapture, true);
      if (suppressSwipeClickTimerRef.current) clearTimeout(suppressSwipeClickTimerRef.current);
    };
  }, [
    isDesktop, isTabletLayout, activeChat, settingsOpen,
    phoneNotificationsOpen, phoneReplyKeyboardOpen, activeTab, afterPopoutsClose,
  ]);

  useEffect(() => {
    const tabletViewport = window.matchMedia(TABLET_LAYOUT_QUERY);
    const updateTabletLayout = () => setIsTabletLayout(tabletViewport.matches);
    updateTabletLayout();
    tabletViewport.addEventListener('change', updateTabletLayout);
    return () => tabletViewport.removeEventListener('change', updateTabletLayout);
  }, []);

  useEffect(() => {
    setPhoneReplyKeyboardOpen(false);
  }, [activeTab, isDesktop, isTabletLayout]);

  useEffect(() => {
    const closeDeckOverlays = () => {
      setDesktopLettersOpen(false);
      setDesktopNotificationsOpen(false);
      setSettingsOpen(false);
    };
    window.addEventListener('matchalize:deck-popout-opening', closeDeckOverlays);
    return () => window.removeEventListener('matchalize:deck-popout-opening', closeDeckOverlays);
  }, []);

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
  const phoneSwipeRef = React.useRef(null);
  const suppressSwipeClickRef = React.useRef(false);
  const suppressSwipeClickTimerRef = React.useRef(null);

  useEffect(() => {
    if (!isDesktop) setDesktopLettersOpen(false);
  }, [isDesktop]);

  useEffect(() => {
    if ((!desktopLettersOpen && !desktopNotificationsOpen && !settingsOpen) || (!isDesktop && !isTabletLayout)) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setDesktopLettersOpen(false);
        setDesktopNotificationsOpen(false);
        setSettingsOpen(false);
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [desktopLettersOpen, desktopNotificationsOpen, settingsOpen, isDesktop, isTabletLayout]);

  useEffect(() => {
    const handleUnavailableAlignment = ({ alignmentId } = {}) => {
      if (!alignmentId) return;
      const id = String(alignmentId);

      setActiveChat((current) => (String(current?._id || '') === id ? null : current));
      queryClient.setQueryData(['matches'], (old) => ({
        ...(old || {}),
        matches: (old?.matches || []).filter((match) => String(match._id) !== id),
      }));
      queryClient.removeQueries({ queryKey: ['messages', id], exact: true });
    };

    socket.on('unmatch-notification', handleUnavailableAlignment);
    return () => socket.off('unmatch-notification', handleUnavailableAlignment);
  }, [queryClient]);

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
    afterPopoutsClose(() => {
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
    });
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

    afterPopoutsClose(() => {
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
    });
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
    const serviceWorker = navigator.serviceWorker;
    if (!serviceWorker) return;

    const onMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== 'open-chat') return;
      openChatById(event.data.alignmentId);
    };
    serviceWorker.addEventListener('message', onMessage);
    return () => serviceWorker.removeEventListener('message', onMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchData, queryClient]);

  const renderPage = () => {
    switch (activeTab) {
      case 'discover':
        return <Discover key="discover" onOpenChat={handleOpenChat} onSheetNearHeader={(near) => setHeaderWanted(!near)} onGoToProfile={handleGoToProfile} onPhoneReplyKeyboardChange={setPhoneReplyKeyboardOpen} isTabletLayout={isTabletLayout} />;
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
      <div
        style={{
          ...desktopStyles.shellRoot,
          ...(isDesktop
            ? { position: 'relative', boxSizing: 'border-box', paddingLeft: 72 }
            : {}),
        }}
      >
        <DesktopSidebar
          activeTab={desktopLettersOpen ? 'matches' : desktopNotificationsOpen ? 'notifications' : activeTab}
          onTabChange={(tab) => afterPopoutsClose(() => {
            setDesktopLettersOpen(false);
            setDesktopNotificationsOpen(false);
            setSettingsOpen(false);
            setActiveTab(tab);
          })}
          onLettersToggle={() => afterPopoutsClose(() => setDesktopLettersOpen((open) => !open))}
          matchBadge={matchCount}
          notificationBadge={unreadNotificationsCount}
          onOpenNotifications={() => afterPopoutsClose(() => {
            setDesktopLettersOpen(false);
            setSettingsOpen(false);
            setDesktopNotificationsOpen((open) => !open);
          })}
          onSettingsToggle={() => afterPopoutsClose(() => {
            setDesktopLettersOpen(false);
            setDesktopNotificationsOpen(false);
            setSettingsOpen((open) => !open);
          })}
          onSignOut={onSignOut}
        />
        <PushPrompt />

        <div style={desktopStyles.contentArea}>
          <Header
            onSelectMatch={handleOpenChat}
            onNavigate={(tab) => afterPopoutsClose(() => setActiveTab(tab))}
            title={TAB_TITLES[activeTab] || activeTab}
            onSettingsToggle={() => afterPopoutsClose(() => setSettingsOpen(true))}
            visible={headerVisible}
            hideNotificationButton={isDesktop}
            hideHeaderChrome={isDesktop}
            drawerOpen={isDesktop ? desktopNotificationsOpen : undefined}
            onDrawerOpenChange={isDesktop ? setDesktopNotificationsOpen : undefined}
            desktopNotificationPanel={isDesktop}
            onUnreadCountChange={setUnreadNotificationsCount}
          />

          <div style={desktopStyles.stage}>
            <Suspense fallback={null}>
              <div key={activeTab} style={desktopStyles.pageWrapper}>
                {renderPage()}
              </div>
            </Suspense>
          </div>
        </div>

        <AnimatePresence>
          {isDesktop && desktopLettersOpen && (
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 280 }}
              style={desktopStyles.lettersPanel}
              aria-label="Letters"
            >
              <div style={desktopStyles.lettersPanelHeader}>
                <h2 style={desktopStyles.lettersPanelTitle}>Letters</h2>
                <DesktopPanelBackButton
                  panelTitle="Letters"
                  onClick={() => setDesktopLettersOpen(false)}
                />
              </div>
              <Suspense fallback={null}>
                <Matches compact onOpenChat={handleOpenChat} />
              </Suspense>
            </motion.aside>
          )}
        </AnimatePresence>

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
                <Suspense fallback={null}>
                  <Chat match={activeChat} onBack={handleCloseChat} />
                </Suspense>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {settingsOpen && (
            <Settings
              key="desktop-settings"
              onSignOut={onSignOut}
              onClose={() => setSettingsOpen(false)}
              desktopPanel={isDesktop}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  // TABLET LAYOUT
  if (isTabletLayout) {
    return (
      <div style={styles.tabletShellRoot}>
        <style>{`
          @media (orientation: landscape) and (min-width: 601px) and (max-width: 1199px) {
            .tablet-side-panel {
              width: min(520px, calc((100vw - 72px) * 0.7)) !important;
            }
          }
        `}</style>
        <DesktopSidebar
          activeTab={desktopLettersOpen ? 'matches' : desktopNotificationsOpen ? 'notifications' : activeTab}
          onTabChange={(tab) => afterPopoutsClose(() => {
            setDesktopLettersOpen(false);
            setDesktopNotificationsOpen(false);
            setSettingsOpen(false);
            setActiveTab(tab);
          })}
          onLettersToggle={() => afterPopoutsClose(() => setDesktopLettersOpen((open) => !open))}
          matchBadge={matchCount}
          notificationBadge={unreadNotificationsCount}
          onOpenNotifications={() => afterPopoutsClose(() => {
            setDesktopLettersOpen(false);
            setSettingsOpen(false);
            setDesktopNotificationsOpen((open) => !open);
          })}
          onSettingsToggle={() => afterPopoutsClose(() => {
            setDesktopLettersOpen(false);
            setDesktopNotificationsOpen(false);
            setSettingsOpen((open) => !open);
          })}
          onSignOut={onSignOut}
        />
        <div style={styles.tabletContentArea}>
          <Header
            onSelectMatch={handleOpenChat}
            onNavigate={(tab) => afterPopoutsClose(() => setActiveTab(tab))}
            title={TAB_TITLES[activeTab] || activeTab}
            onSettingsToggle={() => afterPopoutsClose(() => setSettingsOpen(true))}
            visible={headerVisible}
            hideNotificationButton
            hideHeaderChrome
            drawerOpen={desktopNotificationsOpen}
            onDrawerOpenChange={setDesktopNotificationsOpen}
            desktopNotificationPanel
            notificationPanelWidth={TABLET_PANEL_WIDTH}
            onUnreadCountChange={setUnreadNotificationsCount}
          />

          <div style={styles.contentStage}>
            <Suspense fallback={null}>
              <div key={activeTab} style={styles.pageWrapper}>
                {renderPage()}
              </div>
            </Suspense>
          </div>
        </div>
        <PushPrompt />

        <AnimatePresence>
          {desktopLettersOpen && (
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 280 }}
              style={{ ...desktopStyles.lettersPanel, width: TABLET_PANEL_WIDTH, maxWidth: 'calc(100vw - 72px)' }}
              className="tablet-side-panel"
              aria-label="Letters"
            >
              <div style={desktopStyles.lettersPanelHeader}>
                <h2 style={desktopStyles.lettersPanelTitle}>Letters</h2>
                <DesktopPanelBackButton
                  panelTitle="Letters"
                  onClick={() => setDesktopLettersOpen(false)}
                />
              </div>
              <Suspense fallback={null}>
                <Matches compact onOpenChat={handleOpenChat} />
              </Suspense>
            </motion.aside>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {activeChat && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              style={styles.chatOverlay}
            >
              <Suspense fallback={null}>
                <Chat match={activeChat} onBack={handleCloseChat} />
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>

        {settingsOpen && (
          <Settings
            onSignOut={onSignOut}
            onClose={() => setSettingsOpen(false)}
            desktopPanel
            panelWidth={TABLET_PANEL_WIDTH}
            panelClassName="tablet-side-panel"
          />
        )}
      </div>
    );
  }

  // MOBILE LAYOUT
  return (
    <div style={styles.shellRoot}>
      <Header
        onSelectMatch={handleOpenChat}
        onNavigate={(tab) => afterPopoutsClose(() => setActiveTab(tab))}
        title={TAB_TITLES[activeTab] || activeTab}
        onSettingsToggle={() => afterPopoutsClose(() => setSettingsOpen(true))}
        visible={headerVisible}
        phoneNotificationPanel
        drawerOpen={phoneNotificationsOpen}
        onDrawerOpenChange={setPhoneNotificationsOpen}
      />

      <div
        className="phone-tab-swipe-surface"
        style={styles.phoneContentStage}
      >
        <Suspense fallback={null}>
          <div key={activeTab} style={styles.pageWrapper}>
            {renderPage()}
          </div>
        </Suspense>
      </div>

      {!phoneReplyKeyboardOpen && (
        <NavBar
          activeTab={activeTab}
          onTabChange={(tab) => afterPopoutsClose(() => setActiveTab(tab))}
          matchBadge={matchCount}
          variant={activeTab === 'profile' ? 'profile' : undefined}
        />
      )}
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
            <Suspense fallback={null}>
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
  tabletShellRoot: {
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'row',
    height: '100dvh',
    width: '100%',
    backgroundColor: t.desk,
    overflow: 'hidden',
    position: 'relative',
    contain: 'layout',
    boxSizing: 'border-box',
    paddingLeft: 72,
  },
  tabletContentArea: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: t.desk,
  },
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
  phoneContentStage: {
    flex: 1,
    minHeight: 0,
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    backgroundColor: t.desk,
    touchAction: 'pan-y',
    zIndex: 1,
  },
  pageWrapper: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
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
  lettersPanel: {
    position: 'fixed',
    top: 0,
    left: 72,
    bottom: 0,
    width: '40vw',
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    backgroundColor: t.desk,
    borderLeft: `2px solid ${t.ink}`,
    boxShadow: '-10px 0 28px rgba(0,0,0,.2)',
    zIndex: 400,
  },
  lettersPanelHeader: {
    position: 'relative',
    minHeight: 64,
    padding: '0 18px 0 22px',
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: t.paper,
    borderBottom: `2px solid ${t.ink}`,
    flexShrink: 0,
  },
  lettersPanelTitle: {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    margin: 0,
    color: t.ink,
    fontFamily: t.fontHeavy,
    fontSize: 19,
    fontWeight: 400,
    letterSpacing: '-.01em',
    textTransform: 'uppercase',
  },
};

export default AppShell;