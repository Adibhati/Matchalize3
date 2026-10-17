# Chunk 01 — Design System

> Matchalize · `design-system` · files 1 of 27 chunks · 2 file(s) · 45 KB · ~13,208 tokens
> Generated 2026-10-17 21:10.
> Paste-safe: within the 100 KB / ~29,257 token target.
>
> Contains:
> - `./client/src/components/Header.jsx`
> - `./client/src/components/ProfileCard.jsx`

---
### ./client/src/components/Header.jsx

```
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
```

### ./client/src/components/ProfileCard.jsx

```

import React, {
  useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef,
} from 'react';
import {
  AnimatePresence, motion, useMotionValue, useTransform, animate,
  useReducedMotion, useMotionValueEvent,
} from 'framer-motion';
import PopoutItem from './PopoutItem';
import ReportModal from './chat/ReportModal';
import { triggerHaptic } from '../utils/haptics';
import { toast } from '../utils/toast';
import { Sparkle, MoreVertical, Calendar, Flag } from 'lucide-react';
import neu from '../styles/neu';

/* Neubrutalist palette inspired by the supplied reference; existing neu tokens keep their names. */
const F = {
  heavy: "'Barlow Condensed', sans-serif",
  body: "'Space Grotesk', sans-serif",
  mono: "'IBM Plex Mono', monospace",
};

const C = {
  ...neu,
  ink: '#171414',
  ink2: '#393130',
  ink3: '#6E6160',
  paper: '#FFF9F4',
  card: '#FFFCF8',
  desk: '#FFF9F4',
  yellow: '#FFE76A',
  coral: '#FF7399',
  green: '#B8F0C7',
  pink: '#C8A7FF',
  red: '#D9485D',
  hair: '#171414',
  line: 'rgba(23, 20, 20, .22)',
};

const FALLBACK_IMG =
  'https://placehold.co/600x800/fff3dc/191919?text=%C2%B7';

const RUBBER = 0.3;
const MOMENTUM_MS = 240;
const SIDE_MARGIN = 12;
const TOP_GAP = 16;
const BOTTOM_GAP = 16;
const PEEK_PAD = 10;
const PEEK_FALLBACK = 148;
const HEADER_LEAD = 12;
const HEADER_RELEASE = 8;
const HEADER_FALLBACK_BOTTOM = 54;
const MENU_RAISE = 84;

const TILE = ['coral', 'yellow', 'green', 'pink'];
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

/* Design-only stylesheet. Gesture geometry and React behavior remain intact. */
const PROFILE_CARD_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=IBM+Plex+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');

  /* Match the device safe area to the cream header/canvas; keep blush as an accent only. */
  html, body, #root { background-color: #FFF9F4 !important; }

  .pc-root {
    --paper: ${C.paper};
    --card: ${C.card};
    --ink: ${C.ink};
    --ink-2: ${C.ink2};
    --ink-3: ${C.ink3};
    --hair: ${C.hair};
    --yellow: ${C.yellow};
    --coral: ${C.coral};
    --green: ${C.green};
    --pink: ${C.pink};
    --red: ${C.red};
    --bw: 2px;
    --r: 16px;
    --ease: cubic-bezier(.2,0,0,1);

    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #FFF9F4;
    font-family: ${F.body};
    color: var(--ink);
    -webkit-font-smoothing: antialiased;
  }

  .pc-root::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    opacity: 0;
    background: none;
  }

  .pc-root ::selection { background: var(--yellow); color: var(--ink); }

  /* Keep the user's photography full-bleed; the structured sheet supplies the graphic frame. */
  .pc-heroWrap {
    position: absolute;
    inset: 0;
    z-index: 0;
    transform-origin: 50% 30%;
    will-change: transform;
  }

  .pc-hero {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    opacity: 0;
    transition: opacity .35s ease-out;
    -webkit-user-drag: none;
  }

  .pc-hero.is-loaded { opacity: 1; }

  .pc-shade {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(to top, rgba(23,20,20,.54) 0%, rgba(23,20,20,.07) 45%, rgba(23,20,20,.13) 100%);
  }

  /* Cream paper panel, ink outline and crisp offset shadow. */
  .pc-sheet {
    position: absolute;
    left: ${SIDE_MARGIN}px;
    right: ${SIDE_MARGIN}px;
    top: 0;
    z-index: 30;
    background: var(--paper);
    border: 2px solid var(--ink);
    border-radius: 24px 24px 14px 14px;
    box-shadow: 6px 6px 0 var(--ink);
    touch-action: none;
    cursor: grab;
    user-select: none;
    -webkit-user-select: none;
    -webkit-tap-highlight-color: transparent;
    padding: 12px 18px calc(26px + env(safe-area-inset-bottom));
    display: flex;
    flex-direction: column;
    gap: 19px;
    will-change: transform;
  }

  .pc-sheet:active { cursor: grabbing; }
  .pc-sheet img { -webkit-user-drag: none; }

  .pc-grabber {
    width: 42px;
    height: 5px;
    border-radius: 999px;
    margin: 0 auto;
    flex-shrink: 0;
    background: var(--ink);
    transition: none;
  }

  .pc-sheet:active .pc-grabber { background: var(--coral); }

  .pc-id { position: relative; }

  .pc-idrow {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;
  }

  .pc-name {
    font-family: ${F.heavy};
    font-size: 39px;
    font-weight: 800;
    letter-spacing: -.035em;
    line-height: .94;
    color: var(--ink);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    background-image: linear-gradient(180deg, transparent 78%, var(--yellow) 78%);
    padding: 0 6px 5px 0;
  }

  .pc-age {
    font-family: ${F.body};
    font-weight: 700;
    font-size: .65em;
    letter-spacing: 0;
    color: var(--ink-2);
  }

  .pc-college {
    font-family: ${F.mono};
    font-size: 9px;
    font-weight: 700;
    letter-spacing: .075em;
    text-transform: uppercase;
    color: var(--ink-2);
    margin: 10px 0 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.6;
  }

  .pc-distance {
    color: var(--ink-3);
    text-transform: none;
    letter-spacing: .01em;
    font-weight: 600;
    margin-top: 3px;
  }

  .pc-iconbtn {
    width: 39px;
    height: 39px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border: 2px solid var(--ink);
    border-radius: 12px;
    background: var(--card);
    color: var(--ink);
    box-shadow: 3px 3px 0 var(--ink);
    transition: background .14s ease, color .14s ease, box-shadow .14s ease, transform .14s ease;
  }

  .pc-iconbtn:active,
  .pc-iconbtn.pressed {
    background: var(--yellow);
    color: var(--ink);
    box-shadow: 1px 1px 0 var(--ink);
    transform: translate(2px, 2px);
  }

  .pc-menurow {
    border-top: 2px solid var(--ink);
    border-bottom: 2px solid var(--ink);
    overflow: hidden;
    background: var(--card);
  }

  .pc-menubtn {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    height: 47px;
    padding: 0 8px;
    background: none;
    border: none;
    cursor: pointer;
    border-radius: 8px;
    font-family: ${F.mono};
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: var(--red);
    transition: background .14s ease, color .14s ease, padding-left .14s ease;
  }

  .pc-menubtn:active { background: #FFE4E5; color: var(--red); }

  .pc-sec { display: flex; flex-direction: column; flex-shrink: 0; }

  .pc-shead {
    display: flex;
    align-items: center;
    gap: 9px;
    margin: 0 0 12px;
    padding-bottom: 8px;
    border-bottom: 1.5px solid var(--ink);
  }

  .pc-mark {
    width: 10px;
    height: 10px;
    flex-shrink: 0;
    border: 2px solid var(--ink);
    border-radius: 3px;
  }

  .pc-mark.yellow { background: var(--yellow); }
  .pc-mark.coral { background: var(--coral); }
  .pc-mark.green { background: var(--green); }
  .pc-mark.pink { background: var(--pink); }

  .pc-stitle {
    font-family: ${F.mono};
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .12em;
    text-transform: uppercase;
    color: var(--ink);
  }

  .pc-scount {
    margin-left: auto;
    font-family: ${F.mono};
    font-size: 9px;
    font-weight: 600;
    color: var(--ink-3);
    font-variant-numeric: tabular-nums;
  }

  .pc-card {
    background: var(--card);
    border: 2px solid var(--ink);
    border-radius: 16px;
    box-shadow: 4px 4px 0 var(--ink);
    position: relative;
  }

  .pc-card.padded { padding: 15px; }

  .pc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px 12px; }

  .pc-cell { display: flex; align-items: center; gap: 9px; min-width: 0; }

  .pc-tile {
    width: 31px;
    height: 31px;
    flex-shrink: 0;
    border: 2px solid var(--ink);
    border-radius: 9px;
    box-shadow: 2px 2px 0 var(--ink);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--ink);
  }

  .pc-tile.yellow { background: var(--yellow); }
  .pc-tile.coral { background: var(--coral); }
  .pc-tile.green { background: var(--green); }
  .pc-tile.pink { background: var(--pink); }

  .pc-cellinfo { min-width: 0; }

  .pc-clabel {
    font-family: ${F.mono};
    font-size: 8px;
    font-weight: 700;
    letter-spacing: .11em;
    text-transform: uppercase;
    color: var(--ink-3);
  }

  .pc-cval {
    font-size: 13px;
    font-weight: 700;
    color: var(--ink);
    margin-top: 3px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-variant-numeric: tabular-nums;
  }

  .pc-bio {
    font-size: 14px;
    font-weight: 500;
    line-height: 1.7;
    color: var(--ink-2);
    margin: 0;
    word-break: break-word;
    text-wrap: pretty;
  }

  .pc-pills { display: flex; flex-wrap: wrap; gap: 9px; }

  .pc-chip {
    display: inline-block;
    padding: 7px 11px;
    border: 2px solid var(--ink);
    border-radius: 10px;
    font-family: ${F.mono};
    font-size: 9px;
    font-weight: 700;
    letter-spacing: .055em;
    text-transform: uppercase;
    background: var(--card);
    color: var(--ink);
    box-shadow: 3px 3px 0 var(--ink);
    transition: background .14s ease, color .14s ease, box-shadow .14s ease, transform .14s ease;
  }

  .pc-chip.acc { background: var(--yellow); }

  .pc-chip:active {
    background: var(--pink);
    color: var(--ink);
    border-color: var(--ink);
    box-shadow: 1px 1px 0 var(--ink);
    transform: translate(2px, 2px);
  }

  .pc-prompt {
    padding: 15px;
    cursor: pointer;
    background: var(--card);
    transition: background .14s ease, box-shadow .14s ease, transform .14s ease;
  }

  .pc-promptq {
    font-family: ${F.mono};
    font-size: 10px;
    font-weight: 700;
    line-height: 1.6;
    letter-spacing: .025em;
    color: var(--ink-3);
    margin: 0 0 8px;
    word-break: break-word;
  }

  .pc-prompta {
    font-size: 16px;
    font-weight: 700;
    line-height: 1.5;
    color: var(--ink);
    margin: 0;
    word-break: break-word;
    overflow-wrap: anywhere;
    text-wrap: pretty;
  }

  .pc-prompt:active {
    background: #FFF0C0;
    border-color: var(--ink);
    box-shadow: 1px 1px 0 var(--ink);
    transform: translate(2px, 2px);
  }

  .pc-ph {
    background: var(--card);
    border: 2px solid var(--ink);
    border-radius: 15px;
    box-shadow: 4px 4px 0 var(--ink);
    padding: 5px;
    transition: border-color .14s ease, box-shadow .14s ease, transform .14s ease;
  }

  .pc-ph:active { box-shadow: 1px 1px 0 var(--ink); transform: translate(2px, 2px); }

  .pc-ph-in {
    border-radius: 10px;
    overflow: hidden;
    aspect-ratio: 1 / 1;
    background: #FFE4E5;
  }

  .pc-ph-in.wide { aspect-ratio: 16 / 10; }

  .pc-ph-in img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    opacity: 0;
    transition: opacity .3s ease-out;
    -webkit-user-drag: none;
  }

  .pc-ph-in img.is-loaded { opacity: 1; }

  @media (hover: hover) and (pointer: fine) {
    .pc-iconbtn:hover {
      background: var(--pink);
      box-shadow: 5px 5px 0 var(--ink);
      transform: translate(-2px, -2px);
    }

    .pc-iconbtn.pressed:hover { background: var(--yellow); }
    .pc-menubtn:hover { background: #FFE4E5; padding-left: 12px; }
    .pc-chip:hover { background: var(--pink); }
    .pc-chip.acc:hover { background: var(--yellow); }
    .pc-prompt:hover { background: #FFF0C0; box-shadow: 6px 6px 0 var(--ink); transform: translate(-2px, -2px); }
    .pc-ph:hover { box-shadow: 6px 6px 0 var(--ink); transform: translate(-2px, -2px); }
  }

  .pc-sheet:focus-visible,
  .pc-iconbtn:focus-visible,
  .pc-menubtn:focus-visible,
  .pc-chip:focus-visible,
  .pc-prompt:focus-visible,
  .pc-ph:focus-visible {
    outline: 3px solid var(--yellow);
    outline-offset: 3px;
  }

  @media (max-width: 390px) {
    .pc-sheet { padding-left: 14px; padding-right: 14px; gap: 17px; }
    .pc-name { font-size: 34px; }
    .pc-grid { gap: 12px 8px; }
    .pc-cell { gap: 7px; }
    .pc-tile { width: 28px; height: 28px; }
    .pc-cval { font-size: 12px; }
  }

  @media (prefers-reduced-motion: reduce) {
    .pc-hero, .pc-ph-in img, .pc-iconbtn, .pc-chip, .pc-prompt, .pc-ph { transition: none !important; }
  }
`;

const FieldCell = ({ icon: Icon, color, label, value }) => (
  <div className="pc-cell">
    <span className={`pc-tile ${color}`}>
      <Icon size={15} strokeWidth={2.1} />
    </span>
    <span className="pc-cellinfo">
      <span className="pc-clabel" style={{ display: 'block' }}>{label}</span>
      <span className="pc-cval" style={{ display: 'block' }}>{value}</span>
    </span>
  </div>
);

const SectionHead = ({ mark = 'yellow', children, count }) => (
  <div className="pc-shead">
    <span className={`pc-mark ${mark}`} aria-hidden="true" />
    <span className="pc-stitle">{children}</span>
    {count > 0 && <span className="pc-scount">/ {count}</span>}
  </div>
);

const PhotoTile = ({ src, wide = false }) => (
  <div className="pc-ph">
    <div className={`pc-ph-in${wide ? ' wide' : ''}`}>
      <img
        src={src || FALLBACK_IMG}
        alt=""
        draggable={false}
        loading="lazy"
        decoding="async"
        onLoad={(e) => e.currentTarget.classList.add('is-loaded')}
        onError={(e) => {
          const img = e.currentTarget;
          if (img.dataset.err) {
            img.classList.add('is-loaded');
            return;
          }
          img.dataset.err = '1';
          img.src = FALLBACK_IMG;
        }}
      />
    </div>
  </div>
);

const ProfileCard = ({
  profile = {},
  onAction,
  onSheetNearHeader,
  isGated = false,
}) => {
  const rootRef = useRef(null);
  const sheetRef = useRef(null);
  const menuBtnRef = useRef(null);
  const menuRef = useRef(null);
  const heroImgRef = useRef(null);
  const idRef = useRef(null);

  const setSheetRefs = useCallback((node) => {
    sheetRef.current = node;
  }, []);

  const profileIntent = useMemo(
    () => (Array.isArray(profile.intent) ? profile.intent : [profile.intent].filter(Boolean)),
    [profile],
  );

  const [rootH, setRootH] = useState(0);
  const [sheetH, setSheetH] = useState(0);
  const rootHRef = useRef(0);
  const sheetHRef = useRef(0);
  const entranceTimer = useRef(null);
  const entranceUntil = useRef(0);
  const entranceDoneFor = useRef(null);
  const peekHRef = useRef(0);

  const cancelEntrance = useCallback(() => {
    if (entranceTimer.current) {
      clearTimeout(entranceTimer.current);
      entranceTimer.current = null;
    }
    entranceUntil.current = 0;
  }, []);

  const computeBounds = (h, w) => {
    if (!h || !w) return { lo: 0, hi: 0, ready: false, short: true };

    const lo = Math.min(TOP_GAP, h - BOTTOM_GAP - w);
    const peek = peekHRef.current || PEEK_FALLBACK;
    const short = w <= peek;
    const hi = Math.max(lo, h - BOTTOM_GAP - (short ? w : peek));

    return { lo, hi, ready: true, short };
  };

  const boundsRef = useRef({ lo: 0, hi: 0, ready: false });
  boundsRef.current = computeBounds(rootH, sheetH);

  const yMV = useMotionValue(0);

  const photoScale = useTransform(yMV, (y) => {
    const { lo, hi, ready } = boundsRef.current;
    if (!ready || hi <= lo) return 1;
    const p = clamp((hi - y) / (hi - lo), 0, 1);
    return 1 + 0.06 * p;
  });

  const photoOpacity = useTransform(yMV, (y) => {
    const { lo, hi, ready } = boundsRef.current;
    if (!ready || hi <= lo) return 1;
    const p = clamp((hi - y) / (hi - lo), 0, 1);
    return 1 - 0.4 * p;
  });

  const entranceOpacity = useMotionValue(0);
  const entranceScale = useTransform(entranceOpacity, [0, 1], [0.92, 1]);

  const combinedPhotoOpacity = useTransform(
    [entranceOpacity, photoOpacity],
    ([entrance, drag]) => entrance * drag,
  );

  const combinedPhotoScale = useTransform(
    [entranceScale, photoScale],
    ([entrance, drag]) => entrance * drag,
  );

  const reduceMotion = useReducedMotion();
  const SPRING = useRef(null);

  SPRING.current = reduceMotion
    ? {
        glide: { duration: 0 },
        bounce: { duration: 0 },
        wheel: { duration: 0 },
      }
    : {
        glide: { type: 'spring', stiffness: 170, damping: 30 },
        bounce: { type: 'spring', stiffness: 380, damping: 32 },
        wheel: { duration: 0.25, ease: 'easeOut' },
      };

  const glideControls = useRef(null);

  const stopGlide = () => {
    if (glideControls.current) {
      glideControls.current.stop();
      glideControls.current = null;
    }
  };

  const glideTo = (target, kind) => {
    stopGlide();
    glideControls.current = animate(
      yMV,
      target,
      SPRING.current[kind] || SPRING.current.glide,
    );
  };

  const [showMenu, setShowMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [heroLoaded, setHeroLoaded] = useState(false);

  const showReportRef = useRef(false);
  useEffect(() => {
    showReportRef.current = showReport;
  }, [showReport]);

  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => {
      rootHRef.current = el.clientHeight;
      setRootH(el.clientHeight);
    });

    ro.observe(el);
    rootHRef.current = el.clientHeight;
    setRootH(el.clientHeight);

    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    const el = sheetRef.current;
    if (!el) return;

    const measure = () => {
      const w = el.offsetHeight;
      sheetHRef.current = w;
      setSheetH(w);

      const idEl = idRef.current;
      if (idEl) {
        peekHRef.current = idEl.offsetTop + idEl.offsetHeight + PEEK_PAD;
      }

      const h = rootHRef.current;
      if (!h || !w) return;

      if (entranceDoneFor.current !== profile._id) {
        entranceDoneFor.current = profile._id;
        const rest = computeBounds(h, w).hi;
        cancelEntrance();
        entranceUntil.current = performance.now() + 900;
        yMV.set(h);

        entranceTimer.current = setTimeout(() => {
          entranceTimer.current = null;
          const hh = rootHRef.current;
          const ww = sheetHRef.current;
          const restNow = (hh && ww) ? computeBounds(hh, ww).hi : rest;
          entranceUntil.current = 0;
          glideTo(restNow, 'glide');
        }, 300);

        return;
      }

      if (performance.now() < entranceUntil.current) return;

      const { lo, hi } = computeBounds(h, w);
      const cur = yMV.get();
      const target = clamp(cur, lo, hi);

      if (Math.abs(target - cur) > 0.5) {
        stopGlide();
        yMV.set(target);
      }
    };

    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);

    return () => {
      ro.disconnect();
      cancelEntrance();
      entranceDoneFor.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setShowMenu(false);
    setShowReport(false);
    setHeroLoaded(false);
    entranceOpacity.set(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile._id]);

  useEffect(() => {
    if (reduceMotion) {
      entranceOpacity.set(1);
      return;
    }

    const controls = animate(entranceOpacity, 1, {
      duration: 0.5,
      ease: 'easeOut',
    });

    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);

  useEffect(() => {
    if (heroImgRef.current?.complete) setHeroLoaded(true);
  }, [profile.photos]);

  useEffect(() => {
    if (!showMenu) return;

    const onDown = (e) => {
      if (menuRef.current?.contains(e.target)) return;
      if (menuBtnRef.current?.contains(e.target)) return;
      setShowMenu(false);
    };

    document.addEventListener('pointerdown', onDown);

    return () => document.removeEventListener('pointerdown', onDown);
  }, [showMenu]);

  useEffect(() => {
    if (!showMenu) return;

    const { lo, hi, ready, short } = boundsRef.current;
    if (!ready || short) return;

    const target = Math.max(lo, hi - MENU_RAISE);

    if (yMV.get() > target + 1) {
      stopGlide();
      glideTo(target, 'glide');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMenu]);

  const headerTriggerRef = useRef(null);
  const headerNearRef = useRef(false);
  const onSheetNearRef = useRef(onSheetNearHeader);

  useEffect(() => {
    onSheetNearRef.current = onSheetNearHeader;
  });

  const setHeaderNear = useCallback((near) => {
    if (headerNearRef.current === near) return;
    headerNearRef.current = near;
    onSheetNearRef.current?.(near);
  }, []);

  const measureHeaderTrigger = useCallback(() => {
    if (headerNearRef.current) return;

    const root = rootRef.current;
    if (!root) return;

    const bar = document.querySelector('[data-deck-header]');
    let headerBottom;

    if (bar) {
      headerBottom = bar.getBoundingClientRect().bottom;
    } else {
      console.warn(
        '[header-duck] [data-deck-header] not found — assuming 54px (DECK_TOP 12 + DECK_BTN 42)',
      );
      headerBottom = HEADER_FALLBACK_BOTTOM;
    }

    const rootTop = root.getBoundingClientRect().top;
    headerTriggerRef.current = headerBottom - rootTop - HEADER_LEAD;
  }, []);

  useMotionValueEvent(yMV, 'change', (y) => {
    const trigger = headerTriggerRef.current;
    if (trigger == null) return;

    if (headerNearRef.current) {
      if (y > trigger + HEADER_RELEASE) setHeaderNear(false);
    } else if (y < trigger) {
      setHeaderNear(true);
    }
  });

  useLayoutEffect(() => {
    const raf = requestAnimationFrame(() => {
      measureHeaderTrigger();
      setHeaderNear(false);
    });

    window.addEventListener('resize', measureHeaderTrigger);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', measureHeaderTrigger);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => {
    headerNearRef.current = false;
    onSheetNearRef.current?.(false);
  }, []);

  const drag = useRef(null);
  const yBaseRef = useRef(0);
  const dragged = useRef(false);

  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;

    const onDown = (e) => {
      if (showReportRef.current) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (drag.current) return;

      stopGlide();

      drag.current = {
        id: e.pointerId,
        startY: e.clientY,
        lastY: e.clientY,
        lastT: performance.now(),
        vel: 0,
        moved: 0,
      };

      yBaseRef.current = yMV.get();
      dragged.current = false;
    };

    const onMove = (e) => {
      const d = drag.current;
      if (!d || e.pointerId !== d.id) return;

      if (e.pointerType === 'mouse' && e.buttons === 0) {
        finish(e, false);
        return;
      }

      const { lo, hi, ready } = boundsRef.current;
      if (!ready) return;

      const dy = e.clientY - d.lastY;
      d.lastY = e.clientY;
      d.moved += Math.abs(dy);
      if (d.moved > 5) dragged.current = true;

      const now = performance.now();
      d.vel = d.vel * 0.7 + (dy / Math.max(1, now - d.lastT)) * 0.3;
      d.lastT = now;

      const raw = yBaseRef.current + (e.clientY - d.startY);

      if (raw < lo) {
        const over = lo - raw;
        yMV.set(lo - over * RUBBER);
      } else if (raw > hi) {
        const over = raw - hi;
        yMV.set(hi + over * RUBBER);
      } else {
        yMV.set(raw);
      }
    };

    const finish = (e, withMomentum) => {
      const d = drag.current;
      if (!d) return;
      if (e && e.pointerId !== undefined && e.pointerId !== d.id) return;

      const vel = withMomentum ? d.vel : 0;
      drag.current = null;

      const { lo, hi, ready } = boundsRef.current;
      if (!ready) return;

      const y = yMV.get();

      if (y < lo || y > hi) {
        glideTo(clamp(y, lo, hi), 'bounce');
        return;
      }

      const projected = clamp(y + vel * MOMENTUM_MS, lo, hi);
      if (Math.abs(projected - y) > 1) glideTo(projected, 'glide');
    };

    const onUp = (e) => finish(e, true);
    const onCancel = (e) => finish(e, false);

    sheet.addEventListener('pointerdown', onDown, true);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);

    return () => {
      sheet.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const watchdogArmedRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      watchdogArmedRef.current = true;
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!watchdogArmedRef.current || drag.current) return;

    const { lo, hi, ready } = boundsRef.current;
    if (!ready) return;

    const cur = yMV.get();

    if (cur > hi + 1 || cur < lo - 1) {
      glideTo(clamp(cur, lo, hi), 'bounce');
    }
  });

  const onClickCapture = (e) => {
    if (dragged.current) {
      dragged.current = false;
      e.preventDefault();
      e.stopPropagation();
    }
  };

  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;

    const onWheel = (e) => {
      const { lo, hi, ready } = boundsRef.current;
      if (!ready) return;
      e.preventDefault();
      glideTo(clamp(yMV.get() - e.deltaY, lo, hi), 'wheel');
    };

    sheet.addEventListener('wheel', onWheel, { passive: false });

    return () => sheet.removeEventListener('wheel', onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSheetKeyDown = (e) => {
    const { lo, hi, ready } = boundsRef.current;
    if (!ready) return;

    const step = 90;

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      glideTo(clamp(yMV.get() - step, lo, hi), 'glide');
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      glideTo(clamp(yMV.get() + step, lo, hi), 'glide');
    }
  };

  const sheetReady = rootH > 0 && sheetH > 0;
  const prompts = profile.prompts || [];
  const interests = profile.interests || [];
  const photoB = profile.photos?.[1];
  const photoC = profile.photos?.[2];

  return (
    <div ref={rootRef} className="pc-root">
      <style>{PROFILE_CARD_CSS}</style>

      <motion.div
        className="pc-heroWrap"
        style={{
          scale: combinedPhotoScale,
          opacity: combinedPhotoOpacity,
        }}
      >
        <img
          ref={heroImgRef}
          src={profile.photos?.[0] || FALLBACK_IMG}
          alt={profile.name || 'Profile photo'}
          draggable={false}
          onLoad={() => setHeroLoaded(true)}
          onError={(e) => {
            const img = e.currentTarget;
            if (!img.dataset.err) {
              img.dataset.err = '1';
              img.src = FALLBACK_IMG;
            }
          }}
          decoding="async"
          className={`pc-hero${heroLoaded ? ' is-loaded' : ''}`}
        />
        <div className="pc-shade" aria-hidden="true" />
      </motion.div>

      <motion.div
        ref={setSheetRefs}
        className="pc-sheet"
        style={{ y: yMV, visibility: sheetReady ? 'visible' : 'hidden' }}
        onClickCapture={onClickCapture}
        onKeyDown={onSheetKeyDown}
        tabIndex={0}
        role="region"
        aria-label={`${profile.name || 'Profile'} details — drag or use arrow keys to move the card`}
      >
        <div className="pc-grabber" aria-hidden="true" />

        <div ref={idRef} className="pc-id">
          <div className="pc-idrow">
            <div style={{ minWidth: 0 }}>
              <h2 className="pc-name">
                {profile.name || 'Anonymous'}
                {profile.age ? <span className="pc-age">, {profile.age}</span> : null}
              </h2>
            </div>

            <button
              ref={menuBtnRef}
              type="button"
              className={`pc-iconbtn${showMenu ? ' pressed' : ''}`}
              aria-label="More options"
              aria-expanded={showMenu}
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu((v) => !v);
              }}
            >
              <MoreVertical size={18} strokeWidth={2.5} />
            </button>
          </div>

          {profile.college && <p className="pc-college">{profile.college}</p>}

          {profile.distanceBand && (
            <p className="pc-college pc-distance">{profile.distanceBand}</p>
          )}

          {profile.gapYear && (
            <p
              className="pc-college"
              style={{
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontSize: 11,
              }}
            >
              Gap year
            </p>
          )}

          <AnimatePresence>
            {showMenu && (
              <motion.div
                key="menurow"
                ref={menuRef}
                className="pc-menurow"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                style={{ marginTop: 16 }}
              >
                <button
                  type="button"
                  className="pc-menubtn"
                  onClick={() => {
                    triggerHaptic('light');
                    setShowMenu(false);
                    setShowReport(true);
                  }}
                >
                  <Flag size={14} strokeWidth={2.4} /> Report profile
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {profile.bio && (
          <div className="pc-sec">
            <SectionHead mark="green">About</SectionHead>
            <p className="pc-bio">{profile.bio}</p>
          </div>
        )}

        <div className="pc-sec">
          <SectionHead mark="coral">Vitals</SectionHead>
          <div className="pc-card" style={{ padding: 15 }}>
            <div className="pc-grid">
              <FieldCell
                icon={Calendar}
                color={TILE[1]}
                label="Year"
                value={profile.year || '—'}
              />
              <FieldCell
                icon={Sparkle}
                color={TILE[3]}
                label="Pronouns"
                value={profile.pronouns || '—'}
              />
            </div>
          </div>
        </div>

        <div className="pc-sec">
          <SectionHead mark="pink">Seeking</SectionHead>
          <div className="pc-pills">
            {(profileIntent.length ? profileIntent : ['Connection']).map((it, i) => (
              <span key={`${it}-${i}`} className="pc-chip acc">{it}</span>
            ))}
          </div>
        </div>

        {interests.length > 0 && (
          <div className="pc-sec">
            <SectionHead mark="yellow" count={interests.length}>Interests</SectionHead>
            <div className="pc-pills">
              {interests.map((it, i) => (
                <span key={`${it}-${i}`} className="pc-chip">{it}</span>
              ))}
            </div>
          </div>
        )}

        {(prompts[0]?.question
          || prompts[1]?.question
          || prompts[2]?.question
          || photoB
          || photoC
          || profile.photos?.[3]) && (
          <div className="pc-sec">
            <SectionHead
              mark="coral"
              count={[
                prompts[0], prompts[1], prompts[2],
                photoB, photoC, profile.photos?.[3],
              ].filter(Boolean).length}
            >
              Exhibits
            </SectionHead>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {prompts[0]?.question && (
                <PopoutItem
                  isGated={isGated}
                  targetId="prompt_0"
                  onAction={onAction}
                  style={{ display: 'block' }}
                >
                  <div className="pc-card pc-prompt">
                    <p className="pc-promptq">{prompts[0].question}</p>
                    {prompts[0].answer && (
                      <p className="pc-prompta">{prompts[0].answer}</p>
                    )}
                  </div>
                </PopoutItem>
              )}

              {(photoB || photoC) && (photoB && photoC ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <PopoutItem
                    isGated={isGated}
                    targetId="photo_1"
                    onAction={onAction}
                    style={{ display: 'block' }}
                  >
                    <PhotoTile src={photoB} />
                  </PopoutItem>

                  <PopoutItem
                    isGated={isGated}
                    targetId="photo_2"
                    onAction={onAction}
                    style={{ display: 'block' }}
                  >
                    <PhotoTile src={photoC} />
                  </PopoutItem>
                </div>
              ) : (
                <PopoutItem
                  isGated={isGated}
                  targetId={photoB ? 'photo_1' : 'photo_2'}
                  onAction={onAction}
                  style={{ display: 'block' }}
                >
                  <PhotoTile src={photoB || photoC} wide />
                </PopoutItem>
              ))}

              {prompts[1]?.question && (
                <PopoutItem
                  isGated={isGated}
                  targetId="prompt_1"
                  onAction={onAction}
                  style={{ display: 'block' }}
                >
                  <div className="pc-card pc-prompt">
                    <p className="pc-promptq">{prompts[1].question}</p>
                    {prompts[1].answer && (
                      <p className="pc-prompta">{prompts[1].answer}</p>
                    )}
                  </div>
                </PopoutItem>
              )}

              {profile.photos?.[3] && (
                <PopoutItem
                  isGated={isGated}
                  targetId="photo_3"
                  onAction={onAction}
                  style={{ display: 'block' }}
                >
                  <PhotoTile src={profile.photos[3]} wide />
                </PopoutItem>
              )}

              {prompts[2]?.question && (
                <PopoutItem
                  isGated={isGated}
                  targetId="prompt_2"
                  onAction={onAction}
                  style={{ display: 'block' }}
                >
                  <div className="pc-card pc-prompt">
                    <p className="pc-promptq">{prompts[2].question}</p>
                    {prompts[2].answer && (
                      <p className="pc-prompta">{prompts[2].answer}</p>
                    )}
                  </div>
                </PopoutItem>
              )}
            </div>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {showReport && profile._id && (
          <ReportModal
            reportedUserId={profile._id}
            onClose={() => setShowReport(false)}
            onReported={() => {
              setShowReport(false);
              toast.success('Report submitted. Thank you for keeping the community safe.');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileCard;

```

