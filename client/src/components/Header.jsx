import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import socket from '../utils/socket';
import NotificationDrawer from './NotificationDrawer';
import { Bell, Settings } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { DECK_BTN, deckRowStyle } from '../utils/deckChrome';
import neu from '../styles/neu';

/* Locked tokens — the shared neo-brutalist canon (src/styles/neu.js) */
const t = neu;

const HEADER_CSS = `
  .hd-btn { position: relative; width: ${DECK_BTN}px; height: ${DECK_BTN}px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center; cursor: pointer;
    border: 2px solid ${t.ink}; border-radius: 13px;
    background: ${t.card}; color: ${t.ink};
    box-shadow: 4px 4px 0 ${t.ink};
    transition: transform .08s steps(2), box-shadow .08s steps(2), background .08s steps(2);
    -webkit-tap-highlight-color: transparent; }
  .hd-btn:active { transform: translate(4px, 4px); box-shadow: 0 0 0 ${t.ink};
    background: ${t.ink}; color: ${t.paper}; }

  .hd-badge { position: absolute; top: -6px; right: -6px; z-index: 2;
    min-width: 18px; height: 18px; padding: 0 5px; border-radius: 999px;
    background: ${t.coral}; border: 2px solid ${t.ink}; box-sizing: border-box;
    display: flex; align-items: center; justify-content: center;
    font-family: ${t.fontBody}; font-size: 9px; font-weight: 800; color: #fff;
    letter-spacing: .2px; line-height: 1; font-variant-numeric: tabular-nums; }

  .hd-display {
    font-family: ${t.fontHand};
    font-weight: 700;
    font-size: 30px;
    color: #ffffff;
    -webkit-text-stroke: 2px ${t.ink};
    paint-order: stroke fill;
    text-shadow: 2.5px 2.5px 0 ${t.ink};
    letter-spacing: .02em;
    line-height: 1;
    user-select: none; -webkit-user-select: none;
  }

  .hd-wordmark { display: block; line-height: 1; cursor: pointer;
    transition: transform .08s steps(2); -webkit-tap-highlight-color: transparent; }
  .hd-wordmark:active { transform: scale(.93); }

  .hd-wm { display: block; padding: 0 2px; }

  .hd-heading { display: inline-block; padding: 0 4px 3px; white-space: nowrap; cursor: default; }

  /* ── deck scope filter — sits UNDER the wordmark, Deck tab only ── */
  .hd-scope { display: flex; flex-direction: column; align-items: center; gap: 3px;
    pointer-events: auto; }
  .hd-scope-anchor { position: relative; }
  .hd-scope-chip { display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 10px; border: 2px solid ${t.ink}; border-radius: 999px;
    background: ${t.card}; color: ${t.ink2}; cursor: pointer;
    font-family: ${t.fontMono}; font-size: 9px; font-weight: 700;
    letter-spacing: .12em; text-transform: uppercase; white-space: nowrap;
    box-shadow: 2px 2px 0 ${t.ink};
    transition: transform .08s steps(2), box-shadow .08s steps(2),
      background .2s ease, color .2s ease;
    -webkit-tap-highlight-color: transparent; }
  .hd-scope-chip:active { transform: translate(2px, 2px); box-shadow: 0 0 0 ${t.ink}; }
  .hd-scope-caret { transition: transform .16s ease; }
  .hd-scope-caret.open { transform: rotate(180deg); }

  /* the dropdown — centered under the chip */
  .hd-scope-menu { position: absolute; top: calc(100% + 8px); left: 50%;
    margin-left: -88px; width: 176px; z-index: 600;
    background: ${t.paper}; border: 2px solid ${t.ink}; border-radius: 14px;
    box-shadow: 5px 5px 0 ${t.ink}; padding: 5px; overflow: hidden; }
  .hd-scope-opt { display: flex; align-items: center; gap: 9px; width: 100%;
    padding: 12px; background: none; border: none; border-radius: 9px; cursor: pointer;
    text-align: left; font-family: ${t.fontMono}; font-size: 10.5px; font-weight: 700;
    letter-spacing: .1em; text-transform: uppercase; color: ${t.ink2};
    transition: background .12s ease; -webkit-tap-highlight-color: transparent; }
  .hd-scope-opt .hd-scope-check { margin-left: auto; }
  .hd-scope-opt.on { background: ${t.yellow}; color: ${t.ink}; }
  .hd-scope-opt:active { background: ${t.ink}; color: ${t.paper}; }

  .hd-btn:focus-visible, .hd-scope-chip:focus-visible, .hd-scope-opt:focus-visible {
    outline: 3px solid ${t.yellow}; outline-offset: 2px; }
  .hd-wordmark:focus-visible { outline: 3px solid ${t.yellow}; outline-offset: 4px; border-radius: 8px; }

  @media (hover: hover) and (pointer: fine) {
    .hd-btn:hover { transform: translate(-1px, -1px); box-shadow: 5px 5px 0 ${t.ink}; }
    .hd-btn:active { transform: translate(4px, 4px); box-shadow: 0 0 0 ${t.ink};
      background: ${t.ink}; color: ${t.paper}; }
    .hd-scope-chip:hover:not(:active) { transform: translate(-1px, -1px);
      box-shadow: 3px 3px 0 ${t.ink}; }
    .hd-scope-opt:hover:not(.on) { background: rgba(25,25,25,.05); }
  }
  @media (prefers-reduced-motion: reduce) {
    .hd-btn, .hd-wordmark, .hd-scope-chip, .hd-scope-caret { transition: none; }
  }
`;

const styles = {
  bar: { ...deckRowStyle, zIndex: 500 },
  slotLeft: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start', minWidth: 0, flex: 1, pointerEvents: 'none' },
  slotCenter: { display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' },
  slotRight: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, flex: 1, pointerEvents: 'auto' },
};

const Header = ({ onNavigate, onSelectMatch, title, onSettingsToggle, visible = true }) => {
  const reduceMotion = useReducedMotion();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: unreadData, refetch } = useQuery({
    queryKey: ['unread-notifications-count'],
    queryFn: () => api.get('/notifications/unread-count'),
    refetchInterval: 30000,
  });
  const unreadCount = unreadData?.count || 0;

  useEffect(() => {
    if (!drawerOpen) refetch();
  }, [drawerOpen, refetch]);

  useEffect(() => {
    const handleNewAlign = (_data) => {
      queryClient.setQueryData(['unread-notifications-count'], (old) => ({
        ...(old || {}),
        count: (old?.count || 0) + 1,
      }));
    };
    socket.on('new-align', handleNewAlign);
    return () => socket.off('new-align', handleNewAlign);
  }, [queryClient]);

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

  /* The feed tab, identified by the absence of a title. */
  const isDeck = !title || title === 'Deck';
  const showNotificationBell = isDeck;
  const showSettingsButton = title === 'Profile' && !!onSettingsToggle;

  /* badge — pops once per count change (remount via key), no infinite pulse */
  const bell = (
    <button className="hd-btn" onClick={toggleDrawer} aria-label="View notifications" title="Letters received">
      <Bell size={18} strokeWidth={2.6} />
      <AnimatePresence>
        {unreadCount > 0 && (
          <motion.span
            key={unreadCount}
            className="hd-badge"
            initial={reduceMotion ? false : { scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 12, stiffness: 300 }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );

  /* wordmark — "matchalize", Caveat: white interior, black border. */
  const wordmark = (
    <div
      className="hd-wordmark"
      onClick={handleLogoClick}
      role={onNavigate ? 'button' : undefined}
      tabIndex={onNavigate ? 0 : undefined}
      onKeyDown={onNavigate ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleLogoClick(); } } : undefined}
      title="matchalize — home"
    >
      <span className="hd-display hd-wm">matchalize</span>
    </div>
  );

  return (
    <>
      <style>{HEADER_CSS}</style>

      {/* One floating row on EVERY tab. On the Deck the center column is the
          wordmark with the scope chip under it. */}
      <motion.div
        data-deck-header
        animate={{ y: visible ? 0 : -110, opacity: visible ? 1 : 0 }}
        transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 30 }}
        style={{ ...styles.bar, zIndex: 500, pointerEvents: 'none' }}
      >
        <div style={styles.slotLeft} />
        <div style={styles.slotCenter}>
          {isDeck ? (
            /* pointer-events auto re-enables the whole center column — the
               slot itself is pass-through, and this also guarantees the
               wordmark tap always lands. */
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, pointerEvents: 'auto' }}>
              {wordmark}
            </div>
          ) : (title ? <span className="hd-display hd-heading">{title}</span> : null)}
        </div>
        <div style={styles.slotRight}>
          {showSettingsButton && (
            <button
              className="hd-btn"
              onClick={() => { triggerHaptic('light'); onSettingsToggle(); }}
              aria-label="Open settings"
              title="Settings"
            >
              <Settings size={18} strokeWidth={2.6} />
            </button>
          )}
          {showNotificationBell && bell}
        </div>
      </motion.div>

      {/* Notification Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <NotificationDrawer
            onClose={() => setDrawerOpen(false)}
            onSelectMatch={(match) => {
              setDrawerOpen(false);
              if (onSelectMatch) {
                onSelectMatch(match);
              } else if (onNavigate) {
                onNavigate('chat', { alignmentId: match._id });
              }
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;