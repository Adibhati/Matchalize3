# Chunk 08 — Client Components

> Matchalize · `client-components` · files 8 of 28 chunks · 11 file(s) · 87 KB · ~25,556 tokens
> Generated 2026-10-18 20:29.
> Paste-safe: within the 100 KB / ~29,257 token target.
>
> Contains:
> - `./client/src/components/AccountSuspendedScreen.jsx`
> - `./client/src/components/AppShell.jsx`
> - `./client/src/components/ArchivalToast.jsx`
> - `./client/src/components/DeckActions.jsx`
> - `./client/src/components/DesktopSidebar.jsx`
> - `./client/src/components/DiscoverRebuildOverlay.jsx`
> - `./client/src/components/ErrorBoundary.jsx`
> - `./client/src/components/Icon.jsx`
> - `./client/src/components/LearnMoreSheet.jsx`
> - `./client/src/components/LocationNotice.jsx`
> - `./client/src/components/NavBar.jsx`

---
### ./client/src/components/AccountSuspendedScreen.jsx

```
import React, { useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Lock, Mail } from 'lucide-react';
import neu from '../styles/neu';

/* The shared neo-brutalist canon (src/styles/neu.js). This screen used
   to read from theme.js (--surface-alt, --crim-08, --crimson, texture.grain),
   which is the legacy parchment palette: a suspended user landing here out of the
   neubrutalist Auth flow saw two design languages in one view. It stands alone,
   exactly like Auth does before login, but now from the shared canon. */
const T = neu;

/* as- prefix, one injected sheet — same pattern as Header's hd-, Auth's au-. */
const SUSPENDED_CSS = `
  .as-root {
    --paper: ${T.paper}; --card: ${T.card}; --ink: ${T.ink};
    --ink2: ${T.ink2}; --ink3: ${T.ink3};
    --yellow: ${T.yellow}; --coral: ${T.coral}; --desk: ${T.desk}; --bw: 2px;
    --heavy: ${T.fontHeavy}; --body: ${T.fontBody}; --mono: ${T.fontMono};

    min-height: 100vh; min-height: 100dvh; width: 100%;
    display: flex; padding: max(24px, env(safe-area-inset-top)) 16px
      max(24px, env(safe-area-inset-bottom));
    background: var(--desk); box-sizing: border-box; position: relative;
    overflow-x: hidden;
  }
  .as-root * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
  .as-root ::selection { background: var(--yellow); color: var(--ink); }

  /* margin:auto, not justify-content:center — same reason as .au-fit. */
  .as-fit { margin: auto; width: 100%; max-width: 380px;
    display: flex; flex-direction: column; align-items: center; gap: 18px; }

  /* the deck's sheet object — identical to .pc-sheet / .au-panel */
  .as-panel { width: 100%; background: var(--paper);
    border: var(--bw) solid var(--ink); border-radius: 22px;
    box-shadow: 8px 8px 0 var(--ink); padding: 30px 24px 26px;
    display: flex; flex-direction: column; align-items: center; gap: 18px;
    text-align: center; }

  /* Lock tile — a bordered rounded square, not the old thin-stroke circle.
     The candy-box family marks things with squares and 2px ink borders. */
  .as-lock { width: 76px; height: 76px; border-radius: 18px;
    background: var(--coral); border: var(--bw) solid var(--ink);
    box-shadow: 4px 4px 0 var(--ink);
    display: flex; align-items: center; justify-content: center; }

  /* marker-highlight headline — the .pc-name / .au-headline recipe */
  .as-headline { font-family: var(--heavy); font-weight: 400;
    font-size: clamp(21px, 6vw, 27px); line-height: 1.12; letter-spacing: -.01em;
    color: var(--ink); margin: 0; width: fit-content; max-width: 100%;
    padding: 0 6px 3px 0;
    background-image: linear-gradient(180deg, transparent 58%, var(--yellow) 58%);
    -webkit-box-decoration-break: clone; box-decoration-break: clone; }

  .as-copy { font-family: var(--body); font-size: 13.5px; font-weight: 500;
    color: var(--ink2); margin: 0; line-height: 1.6; }
  .as-date { font-family: var(--mono); font-size: 10.5px; font-weight: 700;
    letter-spacing: .1em; text-transform: uppercase; color: var(--ink3); margin: 0; }

  /* yellow CTA — slams like every other tile */
  .as-cta { display: flex; align-items: center; justify-content: center; gap: 10px;
    width: 100%; height: 54px; margin-top: 4px;
    background: var(--yellow); color: var(--ink); text-decoration: none;
    border: var(--bw) solid var(--ink); border-radius: 14px;
    box-shadow: 5px 5px 0 var(--ink); cursor: pointer;
    font-family: var(--mono); font-size: 12px; font-weight: 700;
    letter-spacing: .16em; text-transform: uppercase;
    transition: transform .08s steps(2), box-shadow .08s steps(2),
      background .08s steps(2), color .08s steps(2); }
  .as-cta:active { transform: translate(5px, 5px); box-shadow: 0 0 0 var(--ink);
    background: var(--ink); color: var(--yellow); }

  /* bottomSlot wrapper. The button Auth passes in is styled from here rather
     than by .au-ghost — Auth returns this screen before it ever injects
     AUTH_CSS, so any au-* class would be undefined at that point. */
  .as-slot { display: flex; justify-content: center; }
  .as-slot button { padding: 11px 18px; cursor: pointer;
    border: var(--bw) solid var(--ink); border-radius: 999px;
    background: var(--card); color: var(--ink2);
    box-shadow: 3px 3px 0 var(--ink);
    font-family: var(--mono); font-size: 10px; font-weight: 700;
    letter-spacing: .14em; text-transform: uppercase;
    transition: transform .08s steps(2), box-shadow .08s steps(2),
      background .08s steps(2), color .08s steps(2); }
  .as-slot button:active { transform: translate(3px, 3px);
    box-shadow: 0 0 0 var(--ink); background: var(--ink); color: var(--paper); }

  @media (hover: hover) and (pointer: fine) {
    .as-cta:hover { transform: translate(-1px, -1px); box-shadow: 6px 6px 0 var(--ink); }
    .as-cta:active { transform: translate(5px, 5px); box-shadow: 0 0 0 var(--ink);
      background: var(--ink); color: var(--yellow); }
    .as-slot button:hover { transform: translate(-1px, -1px); box-shadow: 4px 4px 0 var(--ink); }
    .as-slot button:active { transform: translate(3px, 3px);
      box-shadow: 0 0 0 var(--ink); background: var(--ink); color: var(--paper); }
  }
  @media (prefers-reduced-motion: reduce) {
    .as-cta, .as-slot button { transition: none; }
  }
`;

const APPEAL_MAILTO =
  'mailto:support@matchalize.com?subject=Account Suspension Appeal&body=' +
  'Hi Matchalize Support,%0D%0A%0D%0AI would like to appeal my account suspension.' +
  '%0D%0A%0D%0AThank you.';

const AccountSuspendedScreen = ({ reason: _reason, suspendedAt, bottomSlot }) => {
  const reduceMotion = useReducedMotion();

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
    <div className="as-root">
      <style>{SUSPENDED_CSS}</style>

      <div className="as-fit">
        <motion.div
          className="as-panel"
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="as-lock" aria-hidden="true">
            <Lock size={30} color={T.ink} strokeWidth={2.2} />
          </div>

          <h1 className="as-headline">Account suspended.</h1>

          <p className="as-copy">
            Your account has been restricted for violating our community
            guidelines. During this time you cannot log in, send messages, or use
            Matchalize.
          </p>

          {formattedDate && (
            <p className="as-date">Suspended on {formattedDate}</p>
          )}

          <a className="as-cta" href={APPEAL_MAILTO}>
            <Mail size={16} strokeWidth={2.4} />
            Contact support
          </a>
        </motion.div>

        {bottomSlot && <div className="as-slot">{bottomSlot}</div>}
      </div>
    </div>
  );
};

export default AccountSuspendedScreen;
```

### ./client/src/components/AppShell.jsx

```
import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Header from './Header';
import NavBar from './NavBar';
import DesktopSidebar from './DesktopSidebar';
import { api } from '../utils/api';
import PushPrompt from './PushPrompt';
import { SkeletonBox } from './Skeleton';
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
```

### ./client/src/components/ArchivalToast.jsx

```
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { setToastHandler, clearToastPresence } from '../utils/toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, AlertCircle, CheckCircle2, Info, WifiOff, Server,
  MessageSquareOff, Ban, ShieldAlert,
} from 'lucide-react';
import neu from '../styles/neu';

/* How long a toast stays up.
   A toast WITH an action gets longer: the user has to read the message AND
   decide whether to tap, and the old code gave those toasts no timer at all —
   the gate toast's "Profile" button left it on screen forever. */
const MS_PLAIN = 4000;
const MS_WITH_ACTION = 7000;

/* The shared neo-brutalist canon (src/styles/neu.js) */
const t = neu;

const ArchivalToast = () => {
  const [toast, setToast] = useState(null);
  /* A REF, not state. The timer used to be state, which put it in the deps of
     the effect that owns it — so arming a timer re-ran the effect, whose cleanup
     cleared that very timer. The dismiss-after-4s only appeared to work because
     the cleanup closed over the stale `null`; any second toast cancelled the
     first, and action toasts were never given a timer at all. */
  const timerRef = useRef(null);

  const dismiss = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    setToast(null);
    clearToastPresence();
  }, []);

  useEffect(() => {
    setToastHandler((newToast) => {
      // One toast at a time: a new one replaces the old, so arm a fresh timer
      // rather than letting the previous one's deadline cut it short.
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
      setToast(newToast);
      const ms = newToast.opts?.ms ?? (newToast.action ? MS_WITH_ACTION : MS_PLAIN);
      timerRef.current = setTimeout(dismiss, ms);
    });
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
      setToastHandler(null);
      // Deliberately does NOT touch setToastPresenceHandler: this component only
      // EMITS presence (via toast.js on show, clearToastPresence() on dismiss).
      // The handler belongs to AppShell. Registering a placeholder here clobbered
      // the real subscription, because this component mounts after AppShell and
      // the header stopped sliding the moment the first toast fired.
      clearToastPresence();
    };
  }, [dismiss]);

  /* ONE map for everything. Tile colour always comes from `type` (red = error,
     green = success, yellow = info); the glyph comes from an optional
     `opts.icon` name, falling back to the type default. The glyph sits on a
     saturated tile, so it is drawn paper-white — which is what makes it visible;
     the old code drew a red glyph on the red tile and a green glyph on the green
     tile, i.e. nothing at all. The pale yellow info tile is the exception: there
     the glyph must be ink to read. */
  const TILE_BG = { success: t.green, error: t.red, info: t.yellow };
  const TYPE_GLYPH = { success: 'CheckCircle2', error: 'AlertCircle', info: 'Info' };
  const GLYPHS = {
    CheckCircle2, AlertCircle, Info, WifiOff, Server,
    MessageSquareOff, Ban, ShieldAlert,
  };

  const type = toast?.type;
  const tile = TILE_BG[type] || t.yellow;
  const Glyph = GLYPHS[toast?.opts?.icon] || GLYPHS[TYPE_GLYPH[type]] || AlertCircle;
  const glyphColor = tile === t.yellow ? t.ink : t.card;

  // AnimatePresence must stay mounted while `toast` is null — otherwise it is
  // unmounted along with the toast and the `exit` prop never plays. The toast
  // is therefore the conditional CHILD, not the parent.
  return (
    <AnimatePresence>
      {toast && (
      <>
      <style>{`
        .archival-toast {
          left: max(16px, env(safe-area-inset-left));
          right: max(16px, env(safe-area-inset-right));
          width: auto;
          max-width: 420px;
          margin-inline: auto;
          pointer-events: none;
        }

        .archival-toast > * {
          max-width: 100%;
          overflow-wrap: anywhere;
          pointer-events: auto;
        }

        @media (min-width: 600px) {
          .archival-toast {
            left: auto;
            right: max(24px, env(safe-area-inset-right));
            width: min(420px, calc(100vw - 48px));
            margin-inline: 0;
          }
        }
      `}</style>
      <motion.div
        className="archival-toast"
        initial={{ y: -100, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -100, opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        style={{
          position: 'fixed',
          top: 'max(16px, env(safe-area-inset-top))',
          zIndex: 9999,
          backgroundColor: t.paper,
          border: `2px solid ${t.ink}`,
          borderRadius: 14,
          boxShadow: `5px 5px 0 ${t.ink}`,
          padding: '14px 14px 14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        {/* type tile — candy square, same as vitals/badge language */}
        <div style={{
          width: 34, height: 34, flexShrink: 0, borderRadius: 10,
          background: tile,
          border: `2px solid ${t.ink}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Glyph size={20} color={glyphColor} strokeWidth={2.4} />
        </div>
        <p style={{
          margin: 0, fontFamily: t.fontBody, fontSize: 13.5, fontWeight: 600,
          color: t.ink, lineHeight: 1.45, flex: 1,
        }}>
          {toast.message}
        </p>
        {/* Action and dismiss sit SIDE BY SIDE. The × used to be an either/or
            branch — a toast with an action got no × at all, so the only way to
            clear one was to tap the action, which for the gate toast meant
            navigating away from the deck you were trying to read. Dismissing
            must never cost you the screen you're on. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {toast.action && (
            <button
              className="toast-slam"
              onClick={() => { toast.action.onClick(); dismiss(); }}
              style={{
                padding: '9px 14px',
                backgroundColor: t.yellow,
                color: t.ink,
                border: `2px solid ${t.ink}`,
                borderRadius: 10,
                boxShadow: `3px 3px 0 ${t.ink}`,
                fontFamily: t.fontMono,
                fontSize: 10,
                fontWeight: 700,
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '.1em',
                flexShrink: 0,
              }}
            >
              {toast.action.label}
            </button>
          )}
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            style={{
              background: t.card, border: `1.5px solid ${t.ink}`, borderRadius: 8,
              cursor: 'pointer', padding: 5, color: t.ink2, display: 'flex',
              alignItems: 'center', flexShrink: 0, boxShadow: `2px 2px 0 ${t.ink}`,
            }}
          >
            <X size={14} strokeWidth={2.6} />
          </button>
        </div>
      </motion.div>
      </>
      )}
    </AnimatePresence>
  );
};

export default ArchivalToast;
```

### ./client/src/components/DeckActions.jsx

```
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, animate, useReducedMotion } from 'framer-motion';
import { X, Undo2, Compass } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { DECK_TOP, DECK_EDGE } from '../utils/deckChrome';
import { useToastPresence } from '../utils/toast';
import neu from '../styles/neu';

/* The shared neo-brutalist canon (src/styles/neu.js) */
const C = neu;

const UNDO_MS = 5000;
const RING_R = 19.25;
const RING_CIRC = 2 * Math.PI * RING_R;

/* A single soft, quick glide keeps the Undo reveal and Compass shift in sync. */
const ACTION_STACK_TRANSITION = { duration: 0.32, ease: [0.22, 1, 0.36, 1] };

const DECK_ACTIONS_CSS = `
  .da-float {
    --card: ${C.card};
    --ink: ${C.ink};
    --yellow: ${C.yellow};
    --bw: 2px;

    /* absolute: anchors to the deck column on mobile AND desktop */
    position: absolute; top: ${DECK_TOP}; left: ${DECK_EDGE}; z-index: 500;
    display: flex; flex-direction: column; align-items: center; gap: 10px;
    pointer-events: none;
  }
  /* the pass button — bigger, red */
  .da-floatbtn { pointer-events: auto; position: relative; width: 46px; height: 46px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center; cursor: pointer;
    border: var(--bw) solid var(--ink); border-radius: 14px;
    background: ${C.red}; color: #fff;
    box-shadow: 4px 4px 0 var(--ink);
    transition: transform .08s steps(2), box-shadow .08s steps(2);
    -webkit-tap-highlight-color: transparent; }
  .da-float > .da-floatbtn:not(.undo) { z-index: 2; }
  .da-floatbtn:active { transform: translate(4px, 4px); box-shadow: 0 0 0 var(--ink); }
  .da-floatbtn.undo { position: absolute; top: 0; left: 0; z-index: 1;
    border-radius: 999px; background: var(--yellow); }
  .da-floatbtn.undo svg { color: var(--ink); }
  /* Location refresh — deliberately quieter than pass (red) and undo (yellow).
     It is a maintenance control, not a decision about a person, so it gets a
     plain card colour rather than borrowing the visual weight of the two actions
     a user makes about someone. */
  .da-refreshloc { pointer-events: auto; width: 40px; height: 40px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center; cursor: pointer;
    border: var(--bw) solid var(--ink); border-radius: 12px;
    background: ${C.card}; color: var(--ink-2);
    box-shadow: 3px 3px 0 var(--ink);
    transition: transform .08s steps(2), box-shadow .08s steps(2);
    -webkit-tap-highlight-color: transparent; }
  .da-refreshloc:active { transform: translate(3px, 3px); box-shadow: 0 0 0 var(--ink); }
  .da-refreshloc:focus-visible { outline: 3px solid ${C.yellow}; outline-offset: 2px; }
  .da-floatbtn:focus-visible { outline: 3px solid ${C.yellow}; outline-offset: 2px; }

  /* ✨ GLOBAL ALIGN BAR — BELOW the card, never over it.

     It was tempting to slot this into .da-float alongside Pass, because that
     column already exists and is already floating. It is the wrong place: that
     column is anchored INSIDE the deck edge and sits on top of the card, so an
     Align there would overlap the per-photo Align buttons the card already
     carries. Two Align buttons on screen at once, both yellow, both meaning the
     same thing, on the same card — that is worse than having only the specific
     one.

     So this is its own bar under the card. One global Align, physically
     separate from the photo-level ones. */
  .da-alignbar { position: absolute; left: 0; right: 0; bottom: 0;
    display: flex; justify-content: center; padding: 0 12px 10px;
    pointer-events: none; }
  .da-alignbtn { pointer-events: auto; width: 100%; max-width: 460px;
    height: 50px; border: var(--bw) solid var(--ink); border-radius: 14px;
    background: ${C.yellow}; color: var(--ink);
    font-family: var(--font-body); font-size: 14px; font-weight: 700;
    letter-spacing: .1em; text-transform: uppercase;
    box-shadow: 4px 4px 0 var(--ink); cursor: pointer;
    transition: transform .1s ease-out, box-shadow .1s ease-out, opacity .2s;
    -webkit-tap-highlight-color: transparent; }
  .da-alignbtn:active:not(:disabled) { transform: translate(4px, 4px); box-shadow: 0 0 0 var(--ink); }
  .da-alignbtn:disabled { opacity: .4; cursor: default; transform: none; box-shadow: 4px 4px 0 var(--ink); }
  .da-alignbtn:focus-visible { outline: 3px solid var(--yellow); outline-offset: 3px; }

  /* the timer line — rides exactly on the undo button's boundary */
  .da-ring { position: absolute; inset: 0; width: 100%; height: 100%;
    transform: rotate(-90deg); pointer-events: none; }
  .da-ring circle { fill: none; stroke: var(--ink); stroke-width: 3.5; stroke-linecap: round; }

  @media (hover: hover) and (pointer: fine) {
    .da-floatbtn:hover { filter: brightness(1.06); }
    .da-floatbtn:active { filter: none; }
  }
  @media (prefers-reduced-motion: reduce) {
    .da-floatbtn { transition: none; }
  }
`;

const DeckActions = ({
  onPass, onAlign, showAlignButton = true, canAlign = true,
  onUndo, canGoBack, undoNonce, onRefreshLocation,
}) => {
  const [showUndo, setShowUndo] = useState(false);
  const ringMV = useMotionValue(0);
  const reduceMotion = useReducedMotion();
  const toastUp = useToastPresence();

  /* Arm the undo window only when the deck says "a pass just happened". */
  useEffect(() => {
    if (!undoNonce || !canGoBack) return;
    setShowUndo(true);
    ringMV.set(0);
    const controls = reduceMotion
      ? null
      : animate(ringMV, RING_CIRC, { duration: UNDO_MS / 1000, ease: 'linear', onComplete: () => setShowUndo(false) });
    const t = setTimeout(() => setShowUndo(false), UNDO_MS + 60);
    return () => { controls?.stop(); clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [undoNonce, canGoBack]);

  const handlePass = useCallback((e) => {
    e.stopPropagation();
    onPass?.();
  }, [onPass]);

  /* Undo: go back one profile, then dismiss IMMEDIATELY — the button exits
     with the reverse of its entrance spring (not the 5s timeout fade). */
  const handleUndo = useCallback((e) => {
    e.stopPropagation();
    triggerHaptic('light');
    setShowUndo(false);   // ← reverse transition plays right now
    onUndo?.();
  }, [onUndo]);

  return (
    <>
      <style>{DECK_ACTIONS_CSS}</style>
      <motion.div
        className="da-float"
        animate={{ y: toastUp ? 80 : 0 }}
        transition={reduceMotion ? { duration: 0 } : ACTION_STACK_TRANSITION}
        style={{ position: 'fixed', top: DECK_TOP, left: DECK_EDGE, zIndex: 500, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, pointerEvents: 'none' }}
      >
        <button
          type="button"
          className="da-floatbtn"
          aria-label="Pass this profile"
          title="Pass"
          onClick={handlePass}
        >
          <X size={22} strokeWidth={3.2} />
        </button>

        <AnimatePresence>
          {showUndo && canGoBack && (
            <motion.button
              key="undo"
              type="button"
              className="da-floatbtn undo"
              aria-label="Go to previous profile — available for 5 seconds"
              title="Previous profile (5s)"
              initial={reduceMotion ? false : { y: 0 }}
              animate={{ y: 56 }}
              exit={reduceMotion ? undefined : { y: 0 }}
              transition={reduceMotion ? { duration: 0 } : ACTION_STACK_TRANSITION}
              onClick={handleUndo}
            >
              <Undo2 size={19} strokeWidth={2.8} />
              <svg className="da-ring" viewBox="0 0 42 42" aria-hidden="true">
                <motion.circle
                  cx="21" cy="21" r={RING_R}
                  strokeDasharray={RING_CIRC}
                  style={{ strokeDashoffset: ringMV }}
                />
              </svg>
            </motion.button>
          )}
        </AnimatePresence>

        {/* 📍 REFRESH LOCATION — a convenience, not the mechanism.
         *
         * Location is re-read automatically every time the app opens (see
         * utils/locationSync.js), so this button is strictly optional: someone who
         * opened the app in one place and then travelled would get a corrected
         * deck on their next open regardless.
         *
         * It is here for the case the automatic check cannot cover — the app has
         * been open the whole time, so no app-open has happened. Long-press style
         * "I moved" affordances are absent from most dating apps, but this one is
         * small, unlabelled in the primary action row, and does nothing at all
         * when the position has not changed.
         *
         * Deliberately NOT the "New deck" button that was rejected earlier. That
         * one re-rolled the deck and would hand back the same exhausted pool. This
         * one re-reads a position; if the position is the same, the server reports
         * `moved: false` and nothing is rebuilt. */}
        {onRefreshLocation && (
          <motion.button
            type="button"
            className="da-refreshloc"
            aria-label="Update my location"
            title="Update my location"
            animate={{ y: showUndo && canGoBack ? 56 : 0 }}
            transition={reduceMotion ? { duration: 0 } : ACTION_STACK_TRANSITION}
            onClick={onRefreshLocation}
          >
            <Compass size={19} strokeWidth={2.6} />
          </motion.button>
        )}
      </motion.div>

      {/* ✨ GLOBAL ALIGN — profile-level, no photo or prompt attached. */}
      {onAlign && showAlignButton && (
        <div className="da-alignbar">
          <button
            type="button"
            className="da-alignbtn"
            onClick={onAlign}
            disabled={!canAlign}
            aria-label="Align with this profile"
          >
            Align
          </button>
        </div>
      )}
    </>
  );
};

export default DeckActions;
```

### ./client/src/components/DesktopSidebar.jsx

```
import React from 'react';
import { motion } from 'framer-motion';
import { Compass, Heart, User, Shuffle, LogOut } from 'lucide-react';
import neu from '../styles/neu';
import { triggerHaptic } from '../utils/haptics';

const t = neu;

const tabs = [
  { key: 'discover', label: 'Deck', Icon: Compass },
  { key: 'matches', label: 'Letters', Icon: Heart },
  { key: 'roulette', label: 'Roulette', Icon: Shuffle },
  { key: 'profile', label: 'Profile', Icon: User },
];

const DesktopSidebar = ({ activeTab, onTabChange, matchBadge = 0, onSignOut }) => {
  const handleTabClick = (key) => {
    if (activeTab !== key) {
      triggerHaptic('light');
      onTabChange(key);
    }
  };

  return (
    /* Floating panel: the parent shell should paint the desk behind it — backgroundColor 'var(--desk)' */
    <aside
      style={{
        width: 260,
        height: 'calc(100dvh - 32px)',
        margin: 16,
        backgroundColor: t.paper,
        border: `2px solid ${t.ink}`,
        borderRadius: t.radius.lg,
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
          backgroundImage: `url("${t.grain || ''}")`,
          mixBlendMode: 'multiply',
          opacity: 0.3,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Header */}
      <div style={{ padding: '22px 20px 18px', borderBottom: `1px solid ${t.ink}`, position: 'relative', zIndex: 2 }}>
        <h1 style={{ fontFamily: t.fontHeavy, fontSize: 26, fontWeight: 900, color: t.ink, margin: 0, letterSpacing: '-0.02em', lineHeight: 1 }}>matchalize</h1>
        <p style={{ fontFamily: t.fontBody, fontSize: 9.5, fontWeight: 800, color: t.ink3, margin: '8px 0 0 0', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Campus Ledger</p>
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
              className="slam slam-sm"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '11px 14px',
                borderRadius: t.radius.md,
                border: isActive ? `2px solid ${t.ink}` : '2px solid transparent',
                backgroundColor: isActive ? t.card : 'transparent',
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <tab.Icon size={18} color={isActive ? t.coral : t.ink3} strokeWidth={isActive ? 2.5 : 2} />
                <span style={{ fontFamily: t.fontBody, fontSize: 13.5, letterSpacing: '0.3px', color: t.ink, fontWeight: isActive ? 700 : 500 }}>
                  {tab.label}
                </span>
              </div>

              {showBadge && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ backgroundColor: t.coral, color: '#fff', fontFamily: t.fontBody, fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 999, minWidth: 20, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
                  {matchBadge > 99 ? '99+' : matchBadge}
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Footer actions — notifications live in the top Header on desktop, so only logout lives here. */}
      <div style={{ padding: '16px 20px', borderTop: `1px solid ${t.ink}`, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', position: 'relative', zIndex: 2 }}>
        <motion.button
          onClick={() => { triggerHaptic('light'); onSignOut(); }}
          whileTap={{ scale: 0.94 }}
          title="Log Out"
          style={{ backgroundColor: t.card, border: `2px solid ${t.ink}`, borderRadius: t.radius.md, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <LogOut size={18} color={t.ink3} strokeWidth={2} />
        </motion.button>
      </div>
    </aside>
  );
};

export default DesktopSidebar;
```

### ./client/src/components/DiscoverRebuildOverlay.jsx

```
import React from 'react';
import neu from '../styles/neu';

/* Reuses the shimmer from ProfileCardSkeleton (sk- namespace) so the deck's
   loading language is consistent. No framer-motion — plain conditional + CSS. */
const OVERLAY_CSS = `
  @keyframes sk-sweep { from { background-position: 200% 0; } to { background-position: -200% 0; } }
  .sk-photo { background-color: #1b1b1b;
    background-image: linear-gradient(100deg, transparent 25%, rgba(255,255,255,0.06) 50%, transparent 75%);
    background-size: 200% 100%; background-repeat: no-repeat;
    animation: sk-sweep 2.2s linear infinite; }
  @media (prefers-reduced-motion: reduce) {
    .sk-photo { animation: none; }
  }
`;

const DiscoverRebuildOverlay = ({ show }) => {
  if (!show) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        inset: 0,
        /* ⚠️ MUST SIT ABOVE EVERYTHING.
         * The app already uses 99998 and 99999 for modal and toast layers. At
         * the original 9999 this overlay rendered UNDERNEATH an open modal, so
         * the one moment it exists to explain — the deck visibly changing — was
         * the moment it was hidden behind something else. */
        zIndex: 99999,
        backgroundColor: neu.desk,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        boxSizing: 'border-box',
      }}
    >
      <style>{OVERLAY_CSS}</style>

      {/* Shimmer block — same visual language as the deck skeleton */}
      <div className="sk-photo" style={{ width: 120, height: 120, borderRadius: 16, marginBottom: 20 }} />

      <div style={{
        fontFamily: neu.fontHeavy,
        fontSize: 20,
        fontWeight: 400,
        color: neu.card,
        textAlign: 'center',
        marginBottom: 6,
        letterSpacing: '-.01em',
        textTransform: 'uppercase',
      }}>
        Updating your feed
      </div>

      <div style={{
        fontFamily: neu.fontBody,
        fontSize: 14,
        fontWeight: 500,
        color: neu.ink3,
        textAlign: 'center',
        maxWidth: 280,
        lineHeight: 1.5,
      }}>
        Finding people near your current location
      </div>
    </div>
  );
};

export default DiscoverRebuildOverlay;
```

### ./client/src/components/ErrorBoundary.jsx

```
import React from 'react';
import * as Sentry from '@sentry/react';
import { FileWarning, RotateCw } from 'lucide-react';
import neu from '../styles/neu';

/* The shared neo-brutalist canon (src/styles/neu.js) */
const t = neu;

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
            .eb-slam { display: inline-flex; align-items: center; gap: 8px;
              padding: 14px 26px; background: ${t.yellow}; color: ${t.ink};
              border: 2px solid ${t.ink}; border-radius: 12px; box-shadow: 4px 4px 0 ${t.ink};
              font-family: ${t.fontMono}; font-size: 12px; font-weight: 700;
              letter-spacing: .12em; text-transform: uppercase; cursor: pointer;
              transition: transform .08s steps(2), box-shadow .08s steps(2);
              -webkit-tap-highlight-color: transparent; }
            .eb-slam:active { transform: translate(4px, 4px); box-shadow: 0 0 0 ${t.ink}; }
            @media (hover: hover) and (pointer: fine) {
              .eb-slam:hover:not(:active) { transform: translate(-1px, -1px); box-shadow: 5px 5px 0 ${t.ink}; }
            }
            @media (prefers-reduced-motion: reduce) {
              .error-anim { animation: none !important; opacity: 1 !important; transform: none !important; }
              .eb-slam { transition: none !important; }
            }
          `}</style>

          {/* The floating candy card */}
          <div
            className="error-anim"
            style={{
              position: 'relative',
              zIndex: 2,
              maxWidth: 380,
              width: '100%',
              backgroundColor: t.paper,
              border: `2px solid ${t.ink}`,
              borderRadius: 20,
              boxShadow: `8px 8px 0 ${t.ink}`,
              padding: '32px 24px 28px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              boxSizing: 'border-box',
            }}
          >
            {/* Icon tile — coral, same DNA as the deck error state */}
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              backgroundColor: t.coral,
              border: `2px solid ${t.ink}`,
              boxShadow: `4px 4px 0 ${t.ink}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}>
              <FileWarning size={24} color={t.ink} strokeWidth={2.4} />
            </div>

            <h1 style={{
              fontFamily: t.fontHeavy,
              fontSize: 24,
              fontWeight: 400,
              color: t.ink,
              margin: 0,
              letterSpacing: '-.01em',
              lineHeight: 1.1,
              textTransform: 'uppercase',
            }}>
              Ink Spilled
            </h1>

            <p style={{
              fontFamily: t.fontBody,
              fontSize: 14,
              fontWeight: 500,
              color: t.ink2,
              margin: '12px 0 0 0',
              lineHeight: 1.6,
            }}>
              Something broke on our end. Refresh to get back in.
            </p>

            {/* Error note — bordered mono strip */}
            {this.state.error?.message && (
              <div style={{
                width: '100%',
                marginTop: 18,
                border: `2px solid ${t.ink}`,
                borderRadius: 10,
                backgroundColor: t.card,
                padding: '10px 12px',
                boxSizing: 'border-box',
              }}>
                <p style={{
                  fontFamily: t.fontMono,
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: t.ink3,
                  margin: 0,
                  lineHeight: 1.5,
                  wordBreak: 'break-word',
                  textAlign: 'left',
                }}>
                  {this.state.error.message}
                </p>
              </div>
            )}

            {/* The one yellow moment — slam CTA */}
            <button
              className="eb-slam"
              onClick={() => {
                if (window.navigator && window.navigator.vibrate) {
                  window.navigator.vibrate(50);
                }
                window.location.reload();
              }}
            >
              <RotateCw size={14} strokeWidth={2.8} />
              Refresh
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
import neu from '../styles/neu';

/* The shared neo-brutalist canon (src/styles/neu.js) */
const t = neu;

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
        backgroundColor: 'rgba(12,12,14,0.62)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'flex-end',
      }}
      onClick={onClose}
    >
      <style>{`
        .lm-slam { display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          transition: transform .08s steps(2), box-shadow .08s steps(2);
          -webkit-tap-highlight-color: transparent; }
        .lm-slam:active { transform: translate(4px, 4px) !important; box-shadow: 0 0 0 #191919 !important; }
        .lm-card:focus-visible, .lm-slam:focus-visible {
          outline: 3px solid #FFD43D; outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) {
          .lm-slam { transition: none !important; }
        }
      `}</style>

      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        style={{
          width: '100%',
          maxHeight: '70vh',
          backgroundColor: t.paper,
          borderTop: `2px solid ${t.ink}`,
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 -10px 40px rgba(0,0,0,.45)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grabber */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, position: 'relative', zIndex: 2 }}>
          <span aria-hidden="true" style={{ width: 48, height: 6, borderRadius: 999, backgroundColor: t.ink }} />
        </div>

        {/* Header — Archivo title, bordered close tile */}
        <div style={{
          padding: '14px 20px 14px',
          borderBottom: `2px solid ${t.ink}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
          zIndex: 2,
        }}>
          <span style={{ fontFamily: t.fontHeavy, fontSize: 19, fontWeight: 400, color: t.ink, letterSpacing: '-.01em', textTransform: 'uppercase' }}>
            Account Review
          </span>
          <button
            onClick={onClose}
            aria-label="Close"
            className="lm-slam"
            style={{
              backgroundColor: t.card,
              border: `2px solid ${t.ink}`,
              borderRadius: 12,
              boxShadow: `3px 3px 0 ${t.ink}`,
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: t.ink,
            }}
          >
            <X size={16} strokeWidth={2.8} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px 20px 28px', overflowY: 'auto', position: 'relative', zIndex: 2 }}>
          <p style={{ fontFamily: t.fontBody, fontSize: 14.5, fontWeight: 500, color: t.ink2, marginBottom: 18, lineHeight: 1.6 }}>
            Your account has been flagged for review by our moderation system.
          </p>

          {/* What This Means — white card, icon tile, marker head */}
          <div className="lm-card" style={{
            backgroundColor: t.card,
            border: `2px solid ${t.ink}`,
            borderRadius: 14,
            boxShadow: `4px 4px 0 ${t.ink}`,
            padding: 16,
            marginBottom: 14,
            position: 'relative',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{
                width: 30, height: 30, flexShrink: 0, borderRadius: 9,
                border: `2px solid ${t.ink}`, background: t.yellow,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.ink,
              }}>
                <Info size={15} strokeWidth={2.4} />
              </span>
              <span style={{ fontFamily: t.fontMono, fontSize: 10.5, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: t.ink }}>
                What This Means
              </span>
            </div>
            <p style={{ fontFamily: t.fontBody, fontSize: 13.5, fontWeight: 500, color: t.ink2, lineHeight: 1.6, margin: 0 }}>
              Our system periodically reviews accounts to ensure a safe and respectful community. During this time, certain features may be temporarily limited while our team looks into it.
            </p>
          </div>

          {/* What You Can Do — green tile variant */}
          <div className="lm-card" style={{
            backgroundColor: t.card,
            border: `2px solid ${t.ink}`,
            borderRadius: 14,
            boxShadow: `4px 4px 0 ${t.ink}`,
            padding: 16,
            marginBottom: 22,
            position: 'relative',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{
                width: 30, height: 30, flexShrink: 0, borderRadius: 9,
                border: `2px solid ${t.ink}`, background: t.green,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.ink,
              }}>
                <LifeBuoy size={15} strokeWidth={2.4} />
              </span>
              <span style={{ fontFamily: t.fontMono, fontSize: 10.5, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: t.ink }}>
                What You Can Do
              </span>
            </div>
            <p style={{ fontFamily: t.fontBody, fontSize: 13.5, fontWeight: 500, color: t.ink2, lineHeight: 1.6, margin: 0 }}>
              In most cases, reviews are resolved quickly and your account returns to normal. If you believe this is a mistake, you can reach out to our support team.
            </p>
          </div>

          {/* Contact Support — the sheet's one yellow slam */}
          <a
            href="mailto:support@matchalize.com?subject=Account%20Review%20Inquiry"
            className="lm-slam"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              width: '100%',
              padding: '15px 16px',
              backgroundColor: t.yellow,
              border: `2px solid ${t.ink}`,
              borderRadius: 12,
              boxShadow: `4px 4px 0 ${t.ink}`,
              fontFamily: t.fontMono,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '.12em',
              textTransform: 'uppercase',
              color: t.ink,
              textDecoration: 'none',
              cursor: 'pointer',
              boxSizing: 'border-box',
            }}
          >
            <Mail size={15} strokeWidth={2.6} />
            Contact Support
          </a>

          {/* Registered email note — mono, quiet */}
          <p style={{ fontFamily: t.fontMono, fontSize: 9.5, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: t.ink3, textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>
            Use your registered email when contacting us.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LearnMoreSheet;
```

### ./client/src/components/LocationNotice.jsx

```
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ChevronDown, ChevronUp, X } from 'lucide-react';
import { api } from '../utils/api';
import { readLocationOnce, LOCATION_UNAVAILABLE } from '../utils/geolocation';
import { triggerHaptic } from '../utils/haptics';
import neu from '../styles/neu';

const t = neu;

/**
 * 📍 CAMPUS-FALLBACK NOTICE.
 *
 * The feed ranks by distance from the viewer's own stored reading. When that
 * reading is absent or stale, the pipeline substitutes their COLLEGE
 * coordinates — silently. Without this the user is looking at a campus-ranked
 * feed while the UI implies it is location-ranked, which is the failure that
 * made distance look broken.
 *
 * ── WHY IT NO LONGER SITS THERE FOREVER ──
 * The previous shape was permanently pinned and undismissable, on the reasoning
 * that a banner people swipe away is how someone stops noticing their feed
 * stopped changing. That reasoning was right about DISMISSAL and wrong about
 * persistence: a permanent bar over the feed is wallpaper, and wallpaper is
 * read by nobody. Nothing was ever decided from it.
 *
 * The fix is an expiry rather than a concession. It arrives on entry, says the
 * whole thing in two lines, and leaves. Someone who never registers it still
 * gets it again on their next app open — which is more often than "never", and
 * the only nudge that isn't a nag.
 *
 * ── WHY IT RETURNS ON EVERY TAB SWITCH ──
 * The tab switch remounts this screen (`AppShell` keys the page wrapper on
 * `activeTab`), so "mount" already means "the user came back to the feed". No
 * visibility API, no focus listener, no timer bookkeeping.
 *
 * The 3-minute throttle is the one guard. Tab-switching is free and fast;
 * without it, someone checking matches ten times in a minute gets ten pills,
 * which is nagging rather than reminding.
 *
 * ── WHY ONE CASE NEVER AUTO-HIDES ──
 * A browser that has permanently blocked location will never prompt again — not
 * this app, not on refresh, not ever. That is the browser's decision, and it
 * means the "turn it on in your settings" copy is the only actionable
 * instruction the user will ever get. Auto-hiding it after five seconds would
 * leave someone with a campus-ranked feed and no route out of it.
 *
 * Push notifications were rejected for the same reason as the auto-hide
 * exception: a notification cannot deliver a permission grant, and muting
 * notifications to escape the nagging costs the user their match and message
 * alerts.
 *
 * ── WHY THERE ARE TWO VARIANTS ──────────────────────────────────────────────
 * `fallback` warns that the deck is campus-ordered. `active` confirms that it
 * is NOT, once, then leaves forever. One component with two variants rather than
 * two components, because the decision of which to render belongs to the parent
 * — it is the only place that knows what the server is actually ranking by — and
 * two components would each have to re-derive it.
 *
 * The confirmation is keyed on localStorage, not sessionStorage: it must survive
 * a tab close, or "once" would mean "once per tab". It carries no action row,
 * because every control here exists to change the state being described and that
 * state is already correct.
 *
 * The variant is chosen from the SERVER's `active` flag, never from
 * `myUser.locationSource`. `locationSource` is a stored preference that says a
 * reading existed at some point; a reading past the 30-day TTL is ignored by the
 * ranking and the deck falls back to the campus, so the preference is the one
 * value that can disagree with the behaviour.
 */

const AUTO_HIDE_MS = 5000;
/* Minimum gap between two unprompted appearances within one session. */
const THROTTLE_MS = 3 * 60 * 1000;
const SESSION_SEEN_KEY = 'matchalize_notice_seen';
const SESSION_AT_KEY = 'matchalize_notice_at';
/* localStorage, not sessionStorage — the opposite choice from SESSION_SEEN_KEY,
   and for the same reason in reverse. The confirmation is a one-time statement
   that the location feature is working; a session key would bring it back on
   every launch, and a session is not the unit of "has this person ever been
   told". Nothing here is personal data — it records that a line of text was
   rendered, not anything about the reader. */
const ACTIVE_ACK_KEY = 'matchalize_notice_active_ack';

/* Which of the two messages this is.
 *
 * `fallback` — the deck is being ordered from the campus, not from the user.
 *   A warning, repeats every visit, offers a way out.
 * `active`   — the deck IS ordered from a live reading. Not a warning at all:
 *   nothing needs fixing, so it confirms once and never returns.
 *
 * Two messages rather than one because the alternative is a notice that says
 * "you're not using your location" to someone who is. */
const LocationNotice = ({ college = '', variant = 'fallback', onLocationChanged }) => {
  const isActive = variant === 'active';
  /* The user's own college, read by the parent off `myUser`. Falls back to the
     generic phrase when it is missing so the sentence still reads — a user with
     no college on record must not get "Sorted according to undefined". */
  const COLLEGE_LABEL = college || 'your college';
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  /* Set when the browser refuses permanently. That is the one state with no
     auto-hide, because it is the one state where dismissal hides the only way
     forward. */
  const [locked, setLocked] = useState(false);

  const hideTimer = useRef(null);

  /* sessionStorage, not localStorage: this is a per-visit display preference,
     not user data, and it should clear when they close the tab. localStorage
     would make it permanent, which is the thing being fixed. */
  const sessionRead = useCallback((key) => {
    try { return sessionStorage.getItem(key); } catch { return null; }
  }, []);
  const sessionWrite = useCallback((key, value) => {
    try { sessionStorage.setItem(key, value); } catch { /* private mode */ }
  }, []);

  /* localStorage access is wrapped for the same reason as sessionStorage: Safari
     private mode throws on write, and a notice must never be the thing that
     breaks the feed. */
  const localRead = useCallback((key) => {
    try { return localStorage.getItem(key); } catch { return null; }
  }, []);
  const localWrite = useCallback((key, value) => {
    try { localStorage.setItem(key, value); } catch { /* private mode */ }
  }, []);

  /* ── decide whether to appear on this mount ── */
  useEffect(() => {
    if (isActive) {
      /* Once. Ever. If it had a session key it would return on every launch,
         which turns a confirmation into a recurring notification about
         something that is working. It auto-hides like the warning does, and
         takes no dismiss control — there is nothing to dismiss, because
         nothing is being asked. */
      if (localRead(ACTIVE_ACK_KEY)) return;
      localWrite(ACTIVE_ACK_KEY, String(Date.now()));
      setVisible(true);
      hideTimer.current = setTimeout(() => setVisible(false), AUTO_HIDE_MS);
      return () => clearTimeout(hideTimer.current);
    }

    if (sessionRead(SESSION_SEEN_KEY)) return;

    const lastAt = Number(sessionRead(SESSION_AT_KEY));
    const now = Date.now();
    /* No previous stamp means the first appearance of the session, so it always
       shows. A missing stamp must not be read as "just shown" — that would
       silently skip the very first reminder after a fresh sign-up, which is the
       one moment it matters most. */
    if (lastAt && now - lastAt < THROTTLE_MS) return;

    sessionWrite(SESSION_AT_KEY, String(now));
    setVisible(true);

    /* Starts closed. The two-line form carries the whole fact; expansion is for
       the explanation, not for the headline. */
    hideTimer.current = setTimeout(() => setVisible(false), AUTO_HIDE_MS);

    return () => clearTimeout(hideTimer.current);
  }, [isActive, localRead, localWrite, sessionRead, sessionWrite]);

  /* ── expanding cancels the auto-hide; collapsing restarts it ── */
  const toggle = useCallback(() => {
    clearTimeout(hideTimer.current);
    setOpen((prev) => {
      const next = !prev;
      if (!next) {
        /* Collapsing again means they read it and went back, so it still has
           something left to say. Restart the clock. */
        hideTimer.current = setTimeout(() => setVisible(false), AUTO_HIDE_MS);
      }
      return next;
    });
  }, []);

  const dismiss = useCallback(() => {
    clearTimeout(hideTimer.current);
    setVisible(false);
    setOpen(false);
    sessionWrite(SESSION_SEEN_KEY, '1');
    sessionWrite(SESSION_AT_KEY, String(Date.now()));
  }, [sessionWrite]);

  /* ── request a real reading ── */
  const ask = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    const res = await readLocationOnce();

    if (!res.ok) {
      setBusy(false);
      const denied = res.reason === LOCATION_UNAVAILABLE.DENIED;
      /* A denial the browser will honour forever is the locked state. A timeout
         or an insecure origin is transient and must not earn permanence. */
      if (denied) setLocked(true);
      setError(
        denied
          ? 'Your browser has blocked location for this site. Turn it on in your browser settings, then tap again.'
          : res.reason === LOCATION_UNAVAILABLE.INSECURE
            ? 'Location needs a secure (https) connection.'
            : "We couldn't get a location reading. Try again in a moment.",
      );
      return;
    }

    try {
      const saved = await api.put('/users/location', { latLng: res.latLng, source: 'gps' });
      triggerHaptic('medium');
      /* The server's `moved` flag is the authority — it already deleted the
         viewer's deck session when the anchor changed. We forward it so the
         parent can rebuild in place without a full reload. */
      await onLocationChanged?.(!!saved?.moved);
    } catch {
      setBusy(false);
      setError("Couldn't save your location. Try again.");
    }
  }, [busy, onLocationChanged]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="loc-notice"
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -14 }}
          transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
          role="status"
          aria-live="polite"
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            right: 12,
            zIndex: 34,
            width: 'calc(100% - 24px)',
            maxWidth: 430,
            marginInline: 'auto',
            boxSizing: 'border-box',
            borderRadius: t.radius.md,
            background: t.card,
            border: `2px solid ${t.ink}`,
            boxShadow: t.shadow.md,
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '10px 12px' }}>
            {/* Headline + sub-line. Both lines carry the whole fact on their
                own — someone who never expands still learns their feed is
                campus-ranked, which is the entire job of this component.

                In the `active` variant there is no action row and no disclosure.
                The whole message fits in the two lines, and adding a chevron
                that expanded nothing, or a close button for text that was never
                a question, would each be a control that does nothing. */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <MapPin
                size={15}
                strokeWidth={2.6}
                color={t.ink3}
                style={{ marginTop: 2, flexShrink: 0 }}
              />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: t.fontBody, fontSize: 13.5, fontWeight: 700, color: t.ink, lineHeight: 1.3 }}>
                  {isActive
                    ? 'Using your location to sort people near you'
                    : "Your feed isn't using your live location"}
                </div>
                <div style={{ marginTop: 2, fontFamily: t.fontBody, fontSize: 12.5, color: t.ink2, lineHeight: 1.35 }}>
                  {isActive
                    ? `People near you show up first, not just near ${COLLEGE_LABEL}`
                    : `Sorted according to ${COLLEGE_LABEL}`}
                </div>
              </div>
            </div>

            {/* Action row. Always visible, expanded or not — it is the action,
                not part of the disclosure.

                `active` renders none of it. Every control here exists to change
                the state it is describing; against a state that is already
                correct they would all be decorative, and the "Turn on location"
                button in particular would claim the user has no location while
                the line above them says they do. */}
            {!isActive && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
              <button
                type="button"
                onClick={ask}
                disabled={busy}
                aria-label="Turn on your location"
                className="slam slam-sm"
                style={{
                  border: 'none',
                  cursor: busy ? 'default' : 'pointer',
                  padding: '7px 13px',
                  borderRadius: t.radius.pill,
                  backgroundColor: t.yellow,
                  color: t.ink,
                  fontFamily: t.fontBody,
                  fontSize: 12.5,
                  fontWeight: 700,
                  opacity: busy ? 0.6 : 1,
                }}
              >
                {busy ? 'Finding you…' : 'Turn on location'}
              </button>

              <button
                type="button"
                onClick={toggle}
                disabled={locked}
                aria-expanded={open}
                aria-label={open ? 'Hide details' : 'Show details'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 30,
                  height: 30,
                  border: `1px solid ${t.ink}`,
                  borderRadius: 999,
                  background: 'transparent',
                  color: t.ink2,
                  cursor: locked ? 'default' : 'pointer',
                  opacity: locked ? 0.4 : 1,
                }}
              >
                {open ? <ChevronUp size={15} strokeWidth={2.6} /> : <ChevronDown size={15} strokeWidth={2.6} />}
              </button>

              <div style={{ flex: 1 }} />

              <button
                type="button"
                onClick={dismiss}
                disabled={locked}
                aria-label="Dismiss"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 26,
                  height: 26,
                  border: 'none',
                  background: 'transparent',
                  color: t.ink3,
                  cursor: locked ? 'default' : 'pointer',
                  opacity: locked ? 0.4 : 1,
                }}
              >
                <X size={14} strokeWidth={2.6} />
              </button>
            </div>
            )}
          </div>

          {/* Expanded body. The divider is the top border of this block, so the
              pill reads as one object that grew rather than two stacked
              surfaces. */}
          <AnimatePresence initial={false}>
            {open && !isActive && (
              <motion.div
                key="loc-notice-body"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ borderTop: `1px solid ${t.ink}`, padding: '10px 12px 12px' }}>
                  <div style={{ fontFamily: t.fontBody, fontSize: 12.5, color: t.ink2, lineHeight: 1.5 }}>
                    Your location is off, so people near {COLLEGE_LABEL} show up
                    first — even if you&apos;re somewhere else.
                  </div>

                  {error && (
                    <div style={{ marginTop: 8, fontFamily: t.fontBody, fontSize: 12, color: t.ink3, lineHeight: 1.45 }}>
                      {error}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={dismiss}
                    disabled={locked}
                    style={{
                      marginTop: 10,
                      border: 'none',
                      background: 'transparent',
                      padding: 0,
                      color: t.ink3,
                      fontFamily: t.fontBody,
                      fontSize: 12,
                      textDecoration: 'underline',
                      cursor: locked ? 'default' : 'pointer',
                      opacity: locked ? 0.4 : 1,
                    }}
                  >
                    Not now
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Draining hairline. Only while collapsed, and only while it is
              actually going to leave on its own — drawing it while the notice is
              expanded or pinned would promise a departure that never comes. */}
          {!open && !locked && !isActive && (
            <motion.div
              key="loc-notice-drain"
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: AUTO_HIDE_MS / 1000, ease: 'linear' }}
              style={{
                height: 2,
                background: t.yellow,
                transformOrigin: 'left center',
              }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LocationNotice;
```

### ./client/src/components/NavBar.jsx

```

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';
import { Compass, Heart, User, Shuffle } from 'lucide-react';
import neu from '../styles/neu';

const C = {
  ...neu,
  ink: '#111211',
  ink2: '#383832',
  paper: '#F1EDE2',
  yellow: '#E0A15E',
  coral: '#C96F68',
  green: '#779477',
  hair: 'rgba(17,18,17,.2)',
  fontHeavy: "'Barlow Condensed', sans-serif",
  fontBody: "'Space Grotesk', sans-serif",
  fontMono: "'IBM Plex Mono', monospace",
};

const tabs = [
  { key: 'discover', label: 'Deck', Icon: Compass },
  { key: 'matches', label: 'Letters', Icon: Heart },
  { key: 'roulette', label: 'Roulette', Icon: Shuffle },
  { key: 'profile', label: 'Profile', Icon: User },
];

const NAV_CSS = `
  .nb-bar {
    position: relative;
    z-index: 50;
    flex-shrink: 0;
    width: 100%;
    box-sizing: border-box;
    padding: 8px 12px calc(8px + env(safe-area-inset-bottom, 0px));
    background: ${C.paper};
    border-top: 1px solid ${C.ink};
    box-shadow: 0 -4px 0 rgba(17,18,17,.06);
    font-family: ${C.fontBody};
    user-select: none;
    -webkit-user-select: none;
  }

  .nb-row {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    align-items: stretch;
    gap: 8px;
    width: 100%;
    max-width: 480px;
    margin: 0 auto;
  }

  .nb-tab {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    width: 100%;
    min-width: 0;
    min-height: 54px;
    padding: 5px 2px;
    border: 1px solid transparent;
    border-radius: 4px;
    background: transparent;
    color: ${C.ink};
    cursor: pointer;
    outline: none;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    transition:
      background-color .18s ease,
      border-color .18s ease,
      box-shadow .18s ease,
      color .18s ease;
  }

  .nb-tab:focus-visible {
    outline: 2px solid ${C.ink};
    outline-offset: 2px;
  }

  .nb-tab.active {
    background: ${C.yellow};
    border-color: ${C.ink};
    box-shadow: 2px 2px 0 ${C.ink};
  }

  .nb-ic {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 23px;
    color: ${C.ink2};
    transition: transform .18s ease, color .18s ease;
  }

  .nb-tab.active .nb-ic {
    color: ${C.ink};
    transform: translateY(-1px);
  }

  .nb-label {
    display: block;
    max-width: 100%;
    overflow: hidden;
    color: ${C.ink2};
    font-family: ${C.fontMono};
    font-size: 9px;
    font-weight: 600;
    letter-spacing: .045em;
    line-height: 1.1;
    text-align: center;
    text-transform: uppercase;
    text-overflow: ellipsis;
    white-space: nowrap;
    transition: color .18s ease;
  }

  .nb-tab.active .nb-label {
    color: ${C.ink};
    font-weight: 700;
  }

  .nb-badge {
    position: absolute;
    top: -5px;
    right: 4px;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 19px;
    height: 19px;
    padding: 0 4px;
    box-sizing: border-box;
    border: 1px solid ${C.ink};
    border-radius: 3px;
    background: ${C.coral};
    color: ${C.ink};
    font-family: ${C.fontMono};
    font-size: 9px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    line-height: 1;
  }

  @media (hover: hover) and (pointer: fine) {
    .nb-tab:not(.active):hover {
      background: rgba(17,18,17,.055);
      border-color: rgba(17,18,17,.15);
    }
  }

  .nb-tab:active .nb-ic {
    transform: scale(.92);
  }

  @media (max-width: 360px) {
    .nb-bar {
      padding-right: 7px;
      padding-left: 7px;
    }

    .nb-row {
      gap: 4px;
    }

    .nb-tab {
      min-height: 50px;
    }

    .nb-label {
      font-size: 8px;
      letter-spacing: .025em;
    }

    .nb-badge {
      right: 1px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .nb-ic,
    .nb-label,
    .nb-tab {
      transition: none !important;
    }
  }
`;

const NavBar = ({ activeTab, onTabChange, matchBadge = 0 }) => {
  const reduceMotion = useReducedMotion();

  const handleTabClick = (key) => {
    if (activeTab === key) return;

    triggerHaptic('light');
    onTabChange(key);
  };

  return (
    <nav className="nb-bar" aria-label="Primary">
      <style>{NAV_CSS}</style>

      <div className="nb-row">
        {tabs.map(({ key, label, Icon }) => {
          const isActive = activeTab === key;
          const showBadge = key === 'matches' && matchBadge > 0;

          return (
            <motion.button
              key={key}
              type="button"
              className={`nb-tab${isActive ? ' active' : ''}`}
              onClick={() => handleTabClick(key)}
              aria-label={
                key === 'matches' && matchBadge > 0
                  ? `${label}, ${matchBadge} unread matches`
                  : label
              }
              aria-current={isActive ? 'page' : undefined}
              whileTap={reduceMotion ? undefined : { scale: 0.96 }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { type: 'spring', stiffness: 450, damping: 28 }
              }
            >
              <span className="nb-ic" aria-hidden="true">
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 1.9}
                />
              </span>

              <span className="nb-label">{label}</span>

              {showBadge && (
                <motion.span
                  key={matchBadge}
                  className="nb-badge"
                  initial={reduceMotion ? false : { scale: 0.65, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { type: 'spring', stiffness: 480, damping: 24 }
                  }
                >
                  {matchBadge > 99 ? '99+' : matchBadge}
                </motion.span>
              )}
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};

export default NavBar;

```

