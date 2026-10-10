# Chunk 01 — Design System

> Matchalize · `design-system` · files 1 of 25 chunks · 4 file(s) · 72 KB · ~21,008 tokens
> Generated 2026-10-09 14:03.
> Paste-safe: within the 100 KB / ~29,257 token target.
>
> Contains:
> - `./client/src/components/Header.jsx`
> - `./client/src/components/ProfileCard.jsx`
> - `./client/src/pages/Splash.jsx`
> - `./client/src/utils/theme.js`

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

/* Locked tokens — neubrutalism, same family as ProfileCard / NavBar */
const t = {
  paper: '#FFF9EC',
  card: '#FFFFFF',
  ink: '#191919',
  ink2: '#5F5B52',
  ink3: '#A39E92',
  yellow: '#FFD43D',
  coral: '#FF7A59',
  red: '#E5484D',
  fontHand: "'Caveat', 'Segoe Script', cursive",
  fontBody: "'Inter', -apple-system, 'Segoe UI', sans-serif",
  fontMono: "'Space Mono', 'Courier New', monospace",
};

const HEADER_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Space+Mono:wght@400;700&family=Inter:wght@400;500;600;700&display=swap');

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
  AnimatePresence, motion, useMotionValue, useTransform, animate, useReducedMotion, useMotionValueEvent,
} from 'framer-motion';
import PopoutItem from './PopoutItem';
import ReportModal from './chat/ReportModal';
import { triggerHaptic } from '../utils/haptics';
import { toast } from '../utils/toast';
import {
  Sparkle, MoreVertical, Calendar, Flag,
} from 'lucide-react';

/* ───────────────────────── constants ───────────────────────── */

const FALLBACK_IMG = 'https://placehold.co/600x800/fff3dc/191919?text=%C2%B7';

const RUBBER = 0.3;
const MOMENTUM_MS = 240;
const SIDE_MARGIN = 12;
const TOP_GAP = 16;
const BOTTOM_GAP = 16;
const PEEK_PAD = 10;
const PEEK_FALLBACK = 148;

/* Header duck: see the note on the trigger measurement below. */
const HEADER_LEAD = 12;
const HEADER_RELEASE = 8;

/* Used only if [data-deck-header] cannot be found: DECK_TOP (12) + DECK_BTN (42). */
const HEADER_FALLBACK_BOTTOM = 54;

/* How far the sheet lifts when the ⋮ opens the report row — enough to clear
   the 48px row plus its margin, never the full travel to the top. */
const MENU_RAISE = 84;


const F = {
  heavy: "'Archivo Black', 'Arial Black', sans-serif",
  body: "'Inter', -apple-system, 'Segoe UI', sans-serif",
  mono: "'Space Mono', 'Courier New', monospace",
};

/* the candy box — warm, harmonized, from the references */
const C = {
  paper: '#FFF9EC',
  card: '#FFFFFF',
  ink: '#191919',
  ink2: '#5F5B52',
  ink3: '#A39E92',
  hair: '#EBE5D6',
  yellow: '#FFD43D',
  coral: '#FF7A59',
  green: '#5BD98A',
  pink: '#FFA3C6',
  red: '#E5484D',
};

/* vitals icon tiles cycle through these */
const TILE = ['coral', 'yellow', 'green', 'pink'];

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

/* ───────────────────────── styles ─────────────────────────
   Fonts (Archivo Black / Space Mono / Inter) are loaded once in index.html,
   so there is no @import here — a late swap would reflow the whole card. */

const PROFILE_CARD_CSS = `
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
    --r: 14px;
    --ease: cubic-bezier(.2,0,0,1);

    position: relative; width: 100%; height: 100%; overflow: hidden;
    background: #131313;
    font-family: ${F.body}; color: var(--ink);
    -webkit-font-smoothing: antialiased;
  }
  .pc-root ::selection { background: var(--yellow); color: var(--ink); }

  /* ════ PHOTO — natural, full-bleed. Functional scrim only. ════ */
  .pc-heroWrap { position: absolute; inset: 0; z-index: 0; transform-origin: 50% 30%; will-change: transform; }
  .pc-hero { width: 100%; height: 100%; object-fit: cover; display: block;
    opacity: 0; transition: opacity .4s ease-out; -webkit-user-drag: none; }
  .pc-hero.is-loaded { opacity: 1; }
  .pc-shade { position: absolute; inset: 0; pointer-events: none;
    background: linear-gradient(to top, rgba(15,13,10,.4) 0%, rgba(15,13,10,.08) 42%, rgba(15,13,10,.18) 100%); }

  /* ════ THE SHEET — cream, chunky border, ONE big shadow, rounded ════ */
  .pc-sheet { position: absolute; left: ${SIDE_MARGIN}px; right: ${SIDE_MARGIN}px; top: 0; z-index: 30;
    background: var(--paper); border: var(--bw) solid var(--ink); border-radius: 22px;
    box-shadow: 8px 8px 0 var(--ink);
    touch-action: none; cursor: grab; user-select: none; -webkit-user-select: none; -webkit-tap-highlight-color: transparent;
    padding: 14px 20px calc(28px + env(safe-area-inset-bottom));
    display: flex; flex-direction: column; gap: 22px; will-change: transform; }
  .pc-sheet:active { cursor: grabbing; }
  .pc-sheet img { -webkit-user-drag: none; }

  /* grabber — ink at rest, yellow while you hold the sheet */
  .pc-grabber { width: 48px; height: 6px; border-radius: 999px; margin: 0 auto; flex-shrink: 0;
    background: var(--ink); transition: none; }
  .pc-sheet:active .pc-grabber { background: var(--yellow); }

  /* ════ IDENTITY — the peek poster: name with age beside it ════ */
  .pc-id { position: relative; }
  .pc-idrow { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; }
  .pc-name { font-family: ${F.heavy}; font-size: 34px; font-weight: 400; letter-spacing: -.01em;
    line-height: 1.08; color: var(--ink); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    background-image: linear-gradient(180deg, transparent 58%, var(--yellow) 58%);
    padding: 0 6px 3px 0; }
  /* the ", 21" — same line as the name, quieter type so the name leads */
  .pc-age { font-family: ${F.body}; font-weight: 600; font-size: .72em;
    letter-spacing: 0; color: var(--ink-2); }

  /* Campus — its own full-width line BELOW the ⋮ row. Inside the row it shared
     space with the 42px button and every long college name was ellipsised
     down; as a block under the row it gets the whole sheet width. */
  .pc-college { font-family: ${F.mono}; font-size: 10.5px; font-weight: 700;
    letter-spacing: .08em; text-transform: uppercase; color: var(--ink-2);
    margin: 8px 0 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  /* Distance band sits under the campus name, de-emphasised so it reads as
     context rather than a headline. Not uppercase — the labels are sentences
     ("In your area") and shouting them looks wrong. */
  .pc-distance { color: var(--ink-3); text-transform: none; letter-spacing: .01em;
    font-weight: 600; margin-top: 3px; }

  /* ⋮ — clean white utility button (yellow is reserved for the undo timer) */
  .pc-iconbtn { width: 42px; height: 42px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
    cursor: pointer; border: var(--bw) solid var(--ink); border-radius: 12px;
    background: var(--card); color: var(--ink);
    box-shadow: 4px 4px 0 var(--ink);
    transition: transform .08s steps(2), box-shadow .08s steps(2), background .08s steps(2); }
  .pc-iconbtn:active, .pc-iconbtn.pressed {
    transform: translate(4px, 4px); box-shadow: 0 0 0 var(--ink);
    background: var(--ink); color: var(--paper); }

  /* report — inline row, hairlines, red */
  .pc-menurow { border-top: 1px solid var(--hair); border-bottom: 1px solid var(--hair); overflow: hidden; }
  .pc-menubtn { display: flex; align-items: center; gap: 10px; width: 100%; height: 48px; padding: 0 4px;
    background: none; border: none; cursor: pointer; border-radius: 8px;
    font-family: ${F.mono}; font-size: 12px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase;
    color: var(--red); transition: none; }
  .pc-menubtn:active { background: var(--red); color: #fff; }

  /* ════ SECTION HEADS — colored marker square + bold mono label ════ */
  .pc-sec { display: flex; flex-direction: column; flex-shrink: 0; }
  .pc-shead { display: flex; align-items: center; gap: 10px; margin: 0 0 12px; }
  .pc-mark { width: 11px; height: 11px; flex-shrink: 0; border: var(--bw) solid var(--ink); border-radius: 3px; }
  .pc-mark.yellow { background: var(--yellow); }
  .pc-mark.coral { background: var(--coral); }
  .pc-mark.green { background: var(--green); }
  .pc-mark.pink { background: var(--pink); }
  .pc-stitle { font-family: ${F.mono}; font-size: 12px; font-weight: 700; letter-spacing: .18em;
    text-transform: uppercase; color: var(--ink); }
  .pc-scount { font-family: ${F.mono}; font-size: 10px; font-weight: 400; color: var(--ink-3);
    font-variant-numeric: tabular-nums; }

  /* ════ CARDS — white on cream, 2px border, 5px shadow ════ */
  .pc-card { background: var(--card); border: var(--bw) solid var(--ink); border-radius: var(--r);
    box-shadow: 5px 5px 0 var(--ink); position: relative; }
  .pc-card.padded { padding: 16px; }

  /* ════ VITALS ════ */
  .pc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 12px; }
  .pc-cell { display: flex; align-items: center; gap: 10px; min-width: 0; }
  .pc-tile { width: 34px; height: 34px; flex-shrink: 0; border: var(--bw) solid var(--ink); border-radius: 10px;
    display: flex; align-items: center; justify-content: center; color: var(--ink); }
  .pc-tile.yellow { background: var(--yellow); }
  .pc-tile.coral { background: var(--coral); }
  .pc-tile.green { background: var(--green); }
  .pc-tile.pink { background: var(--pink); }
  .pc-cellinfo { min-width: 0; }
  .pc-clabel { font-family: ${F.mono}; font-size: 9px; font-weight: 700; letter-spacing: .16em;
    text-transform: uppercase; color: var(--ink-3); }
  .pc-cval { font-size: 14px; font-weight: 700; color: var(--ink); margin-top: 2px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }

  /* ════ ABOUT ════ */
  .pc-bio { font-size: 15px; font-weight: 500; line-height: 1.65; color: var(--ink-2);
    margin: 0; word-break: break-word; text-wrap: pretty; }

  /* ════ CHIPS ════ */
  .pc-pills { display: flex; flex-wrap: wrap; gap: 9px; }
  .pc-chip { display: inline-block; padding: 8px 15px; border: var(--bw) solid var(--ink); border-radius: 999px;
    font-family: ${F.mono}; font-size: 11px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
    background: var(--card); color: var(--ink); transition: none; }
  .pc-chip.acc { background: var(--yellow); }
  .pc-chip:active { background: var(--ink); color: var(--paper); border-color: var(--ink); }

  /* ════ PROMPTS ════
     Question is the setup, answer is the payoff — so the ANSWER carries the type
     weight (17px/700 ink) and the question recedes to a small mono caption. */
  .pc-prompt { padding: 14px 16px; cursor: pointer; transition: none; }
  .pc-promptq { font-family: ${F.mono}; font-size: 11.5px; font-weight: 700; line-height: 1.55;
    color: var(--ink-3); margin: 0 0 8px; word-break: break-word; transition: none; }
  .pc-prompta { font-size: 17px; font-weight: 700; line-height: 1.5; color: var(--ink);
    margin: 0; word-break: break-word; overflow-wrap: anywhere; text-wrap: pretty;
    transition: none; }
  .pc-prompt:active { background: var(--ink); border-color: var(--ink); }
  .pc-prompt:active .pc-prompta { color: var(--paper); }
  .pc-prompt:active .pc-promptq { color: rgba(255,249,236,.55); }

  /* ════ PHOTOS ════ */
  .pc-ph { background: var(--card); border: var(--bw) solid var(--ink); border-radius: var(--r);
    box-shadow: 4px 4px 0 var(--ink); padding: 6px;
    transition: transform .08s steps(2), box-shadow .08s steps(2); }
  .pc-ph:active { transform: translate(4px, 4px); box-shadow: 0 0 0 var(--ink); }
  .pc-ph-in { border-radius: 9px; overflow: hidden; aspect-ratio: 1 / 1; background: var(--hair); }
  .pc-ph-in.wide { aspect-ratio: 16 / 10; }
  .pc-ph-in img { width: 100%; height: 100%; object-fit: cover; display: block;
    opacity: 0; transition: opacity .3s ease-out; -webkit-user-drag: none; }
  .pc-ph-in img.is-loaded { opacity: 1; }

  @media (hover: hover) and (pointer: fine) {
    .pc-iconbtn:hover { filter: brightness(1.04); }
    .pc-iconbtn.pressed:hover { filter: none; }
    .pc-menubtn:hover { background: rgba(229,72,77,.08); }
    .pc-chip:hover { background: #FFF3D6; }
    .pc-chip.acc:hover { background: #FFCE1F; }
    .pc-prompt:hover { background: #FFFDF6; }
  }

  .pc-sheet:focus-visible, .pc-iconbtn:focus-visible, .pc-menubtn:focus-visible {
    outline: 3px solid var(--yellow); outline-offset: 2px; }

  @media (prefers-reduced-motion: reduce) {
    .pc-hero, .pc-ph-in img, .pc-iconbtn, .pc-ph { transition: none; }
  }
`;

/* ───────────────────────── small pieces ───────────────────────── */

const FieldCell = ({ icon: Icon, color, label, value }) => (
  <div className="pc-cell">
    <span className={`pc-tile ${color}`}><Icon size={16} strokeWidth={2.4} /></span>
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
          if (img.dataset.err) { img.classList.add('is-loaded'); return; }
          img.dataset.err = '1';
          img.src = FALLBACK_IMG;
        }}
      />
    </div>
  </div>
);

/* ───────────────────────── main card ───────────────────────── */

const ProfileCard = ({ profile = {}, onAction, onSheetNearHeader, isGated = false }) => {
  const rootRef = useRef(null);
  const sheetRef = useRef(null);
  const menuBtnRef = useRef(null);
  const menuRef = useRef(null);
  const heroImgRef = useRef(null);
  const idRef = useRef(null);

  const setSheetRefs = useCallback((node) => {
    sheetRef.current = node;
  }, []);

  /* ── derived data ── */
  /* The target's own intent chips, for the SEEKING section — the last thing
     this memo was for.

     It also used to derive the compatibility percentage and the shared-interest
     / shared-intent overlap that rendered as an "In common" list. All gone. Worth
     recording why the overlap was itself a latent bug: it intersected the
     target's interests with YOUR OWN profile read from
     `localStorage.matchalize_user`, which is written once at login. So it
     silently disagreed with server data from the moment you edited anything —
     the same stale-localStorage class of defect as the score it sat beneath.
     Nothing on this card compares your profile against the viewer's now. */
  const profileIntent = useMemo(() => (
    Array.isArray(profile.intent) ? profile.intent : [profile.intent].filter(Boolean)
  ), [profile]);

  /* ── geometry ── */
  const [rootH, setRootH] = useState(0);
  const [sheetH, setSheetH] = useState(0);
  const rootHRef = useRef(0);
  const sheetHRef = useRef(0);
  const entranceTimer = useRef(null);
  const entranceUntil = useRef(0);        // timestamp: re-clamp stays off until here
  const entranceDoneFor = useRef(null);    // profile id whose entrance has run

  /* Declared up here on purpose: the reset-per-profile effect below lists it in
     a dependency array, and dep arrays are evaluated during render — declaring
     it after that effect throws "Cannot access before initialization". */
  const cancelEntrance = useCallback(() => {
    if (entranceTimer.current) { clearTimeout(entranceTimer.current); entranceTimer.current = null; }
    entranceUntil.current = 0;
  }, []);
  const peekHRef = useRef(0);

  /* The sheet is content-sized, so it is taller than the screen and its own
     translation is the scroll: `lo` is the fully-raised position (whole card
     readable). `hi` is the rest position: the identity block — grabber, name
     and age, and the campus line — pokes above the bottom edge, measured live
     off the identity element. Only a sheet SHORTER THAN THAT PEEK rests fully
     visible. The sheet never auto-returns here; it only goes down when the
     user swipes it down. */
  const computeBounds = (h, w) => {
    if (!h || !w) return { lo: 0, hi: 0, ready: false, short: true };
    const lo = Math.min(TOP_GAP, h - BOTTOM_GAP - w);
    const peek = peekHRef.current || PEEK_FALLBACK;

    /* `short` means "the whole sheet is shorter than the peek we'd otherwise
       show", i.e. peeking would reveal nothing beyond it — so show all of it.

       This used to be `w <= h - BOTTOM_GAP - TOP_GAP`, which asks a completely
       different question: "is the sheet smaller than the SCREEN". That is true
       of nearly every card (720px of available height on a 752px stage), so
       almost every card took the show-everything branch and rested at
       `h - BOTTOM_GAP - w` instead of at the peek.

       The visible damage was largest on exactly the profiles with the least
       content. Measured on a 420×820 viewport: a 473px sheet (a 45-score
       profile) rested at 263px, leaving the profile photo 35% of the card —
       the sheet parked across the middle of the screen with the face behind it.
       The same card under the corrected test rests at 618px and shows 82%, and
       a 1392px sheet (a 95-score profile) was never affected because it exceeds
       the old 720px threshold anyway.

       The threshold has to be `peek`, because `peek` is the height the rest
       position is trying to reveal. Any other comparison makes "rest" mean
       something different from what the comment above describes. */
    const short = w <= peek;
    const hi = Math.max(lo, h - BOTTOM_GAP - (short ? w : peek));
    return { lo, hi, ready: true, short };
  };

  const boundsRef = useRef({ lo: 0, hi: 0, ready: false });
  boundsRef.current = computeBounds(rootH, sheetH);

  /* ── motion values ── */
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

  /* ── entrance ──
     Opacity + scale only. This animated `filter: blur(12px) → 0` across a
     full-bleed photo on every card swipe, re-rasterising a screen-sized layer
     per frame — the heaviest thing in the whole deck. Removing the blur leaves
     both properties compositor-only, so the swipe stays on the GPU. */
  const entranceOpacity = useMotionValue(0);
  const entranceScale = useTransform(entranceOpacity, [0, 1], [0.92, 1]);
  const combinedPhotoOpacity = useTransform(
    [entranceOpacity, photoOpacity],
    ([entrance, drag]) => entrance * drag
  );
  const combinedPhotoScale = useTransform(
    [entranceScale, photoScale],
    ([entrance, drag]) => entrance * drag
  );

  /* ── glide helpers ── */
  const reduceMotion = useReducedMotion();
  const SPRING = useRef(null);
  SPRING.current = reduceMotion
    ? { glide: { duration: 0 }, bounce: { duration: 0 }, wheel: { duration: 0 } }
    : {
        glide: { type: 'spring', stiffness: 170, damping: 30 },
        bounce: { type: 'spring', stiffness: 380, damping: 32 },
        wheel: { duration: 0.25, ease: 'easeOut' },
      };
  const glideControls = useRef(null);
  const stopGlide = () => {
    if (glideControls.current) { glideControls.current.stop(); glideControls.current = null; }
  };
  const glideTo = (target, kind) => {
    stopGlide();
    glideControls.current = animate(yMV, target, SPRING.current[kind] || SPRING.current.glide);
  };

  /* ── state ── */
  const [showMenu, setShowMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [heroLoaded, setHeroLoaded] = useState(false);

  const showReportRef = useRef(false);
  useEffect(() => { showReportRef.current = showReport; }, [showReport]);

  /* ── measure root + sheet ── */
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => { rootHRef.current = el.clientHeight; setRootH(el.clientHeight); });
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
      if (idEl) peekHRef.current = idEl.offsetTop + idEl.offsetHeight + PEEK_PAD;
      const h = rootHRef.current;
      if (!h || !w) return;

      /* ── ENTRANCE, here in the measure pass ──
         The sheet is positioned in the SAME layout effect that measures it, so
         it cannot be missed or reordered against the measurement. Run from a
         separate effect it raced this one, and the sheet painted at y=0 —
         covering the whole photo — for ~300ms before the park landed, which
         looked like the sheet arriving before the photo. */
      if (entranceDoneFor.current !== profile._id) {
        entranceDoneFor.current = profile._id;
        const rest = computeBounds(h, w).hi;
        cancelEntrance();
        entranceUntil.current = performance.now() + 900;   // self-expiring guard
        yMV.set(h);                                        // park below the fold
        entranceTimer.current = setTimeout(() => {
          entranceTimer.current = null;
          /* Re-read geometry at glide time: fonts/images may have settled
             since, and a stale peek lands the sheet at the wrong rest. */
          const hh = rootHRef.current, ww = sheetHRef.current;
          const restNow = (hh && ww) ? computeBounds(hh, ww).hi : rest;
          entranceUntil.current = 0;
          glideTo(restNow, 'glide');
        }, 300);
        return;
      }

      /* Stay out of the way while the entrance glide is in flight. A TIMESTAMP,
         not a boolean: if a timer is dropped the guard lapses on its own, so
         the re-clamp can never be wedged off permanently. */
      if (performance.now() < entranceUntil.current) return;
      const { lo, hi } = computeBounds(h, w);
      /* Only intervene when genuinely out of bounds. A blanket stopGlide() here
         was killing legit glides (entrance, the menu raise) mid-flight whenever
         the sheet resized, freezing the sheet — and the photo derived from its
         position. */
      const cur = yMV.get();
      const target = clamp(cur, lo, hi);
      if (Math.abs(target - cur) > 0.5) { stopGlide(); yMV.set(target); }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    /* Cancel the entrance wholesale and forget that it ran, so a remount
       (StrictMode's double-invoke, or a new profile) re-does it from scratch. */
    return () => { ro.disconnect(); cancelEntrance(); entranceDoneFor.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── reset per profile ──
     Deliberately does NOT cancel the entrance. The card is keyed per profile
     upstream, so a real profile change remounts this component anyway. */
  useEffect(() => {
    setShowMenu(false);
    setShowReport(false);
    setHeroLoaded(false);
    entranceOpacity.set(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile._id]);

  /* ── entrance animation: photo fade-in + slight scale-up ── */
  useEffect(() => {
    if (reduceMotion) {
      entranceOpacity.set(1);
      return;
    }
    const controls = animate(entranceOpacity, 1, { duration: 0.5, ease: 'easeOut' });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);

  useEffect(() => {
    if (heroImgRef.current?.complete) setHeroLoaded(true);
  }, [profile.photos]);

  /* ── report row: outside-click close ── */
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

  /* ── ⋮ menu open → lift the sheet JUST enough to reveal the row ──
     The report row expands BELOW the identity block; at the rest position it
     would unfurl under the bottom edge. So the sheet lifts by roughly the
     row's height — a small, deliberate rise, never the full travel to the
     top. If the sheet already sits higher than that, nothing moves. Closing
     the menu never repositions the sheet. */
  useEffect(() => {
    if (!showMenu) return;
    const { lo, hi, ready, short } = boundsRef.current;
    if (!ready) return;

    /* Only raise when the raise is actually needed.
       A SHORT sheet — which is what a low-score profile produces, since less
       filled-in content means a shorter sheet — already rests with its ENTIRE
       height on screen (`computeBounds` switches `hi` from `peek` to the full
       `w` when `short`). The report row is therefore already visible and the
       lift is pure harm: it shoved the sheet up over the profile photo, parked
       it mid-screen, and because closing the menu never repositions the sheet
       it stayed there. Taller cards were unaffected precisely because their
       sheet already sits mostly below the fold, so the same 84px is invisible.

       Keyed off the same `short` flag the bounds maths already uses, rather than
       a hardcoded score — the trigger is geometry, not the ladder. */
    if (short) return;

    const target = Math.max(lo, hi - MENU_RAISE);
    if (yMV.get() > target + 1) { stopGlide(); glideTo(target, 'glide'); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMenu]);

  /* ════ HEADER DUCK ════
     The header is a position:fixed row. The sheet's top edge sits at
     `rootTop + y`, so the header must duck once
        y  <  (headerBottom - rootTop - HEADER_LEAD)
     Both edges are measured ONCE, with the header at rest, and cached.
     The callback MUST be held in a ref, never in an effect dep. AppShell
     passes a fresh arrow on every render, so a dep on it re-runs the unmount
     cleanup each time — an infinite self-cancelling loop. */
  const headerTriggerRef = useRef(null);
  const headerNearRef = useRef(false);
  const onSheetNearRef = useRef(onSheetNearHeader);
  useEffect(() => { onSheetNearRef.current = onSheetNearHeader; });

  const setHeaderNear = useCallback((near) => {
    if (headerNearRef.current === near) return;
    headerNearRef.current = near;
    onSheetNearRef.current?.(near);
  }, []);

  const measureHeaderTrigger = useCallback(() => {
    if (headerNearRef.current) return;            // never measure mid-animation
    const root = rootRef.current;
    if (!root) return;
    const bar = document.querySelector('[data-deck-header]');
    let headerBottom;
    if (bar) {
      headerBottom = bar.getBoundingClientRect().bottom;
    } else {
      console.warn('[header-duck] [data-deck-header] not found — assuming 54px (DECK_TOP 12 + DECK_BTN 42)');
      headerBottom = HEADER_FALLBACK_BOTTOM;
    }
    const rootTop = root.getBoundingClientRect().top;
    headerTriggerRef.current = headerBottom - rootTop - HEADER_LEAD;
  }, []);

  useMotionValueEvent(yMV, 'change', (y) => {
    const trigger = headerTriggerRef.current;
    if (trigger == null) return;
    /* Two fixed numbers — the two directions cannot disagree. */
    if (headerNearRef.current) {
      if (y > trigger + HEADER_RELEASE) setHeaderNear(false);
    } else if (y < trigger) {
      setHeaderNear(true);
    }
  });

  useLayoutEffect(() => {
    const raf = requestAnimationFrame(() => { measureHeaderTrigger(); setHeaderNear(false); });
    window.addEventListener('resize', measureHeaderTrigger);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', measureHeaderTrigger);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Unmount ONLY (empty deps). See the note above. */
  useEffect(() => () => {
    headerNearRef.current = false;
    onSheetNearRef.current?.(false);
  }, []);

  /* ════ THE DRAG — rigid panel with momentum. No return-to-rest: the sheet
     goes down only when the user swipes it down. Momentum flicks glide
     naturally; releases outside the bounds bounce back into range. ════ */
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
      drag.current = { id: e.pointerId, startY: e.clientY, lastY: e.clientY, lastT: performance.now(), vel: 0, moved: 0 };
      yBaseRef.current = yMV.get();
      dragged.current = false;
    };

    const onMove = (e) => {
      const d = drag.current;
      if (!d || e.pointerId !== d.id) return;
      if (e.pointerType === 'mouse' && e.buttons === 0) { finish(e, false); return; }
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
      drag.current = null;                    // ← dropped AFTER reading velocity
      const { lo, hi, ready } = boundsRef.current;
      if (!ready) return;
      const y = yMV.get();
      /* No snap-back to rest: a release inside the bounds either glides with
         momentum or stops dead where the finger lifted. Only an out-of-bounds
         release bounces back into range. */
      if (y < lo || y > hi) { glideTo(clamp(y, lo, hi), 'bounce'); return; }
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

  /* ── self-healing watchdog — no stray position survives a render ──
     Armed shortly after mount (so it never fights the entrance glide).
     If the sheet ever ends up outside its bounds for ANY reason, the
     next render bounces it back. */
  const watchdogArmedRef = useRef(false);
  useEffect(() => {
    const t = setTimeout(() => { watchdogArmedRef.current = true; }, 1500);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (!watchdogArmedRef.current || drag.current) return;
    const { lo, hi, ready } = boundsRef.current;
    if (!ready) return;
    const cur = yMV.get();
    if (cur > hi + 1 || cur < lo - 1) glideTo(clamp(cur, lo, hi), 'bounce');
  }); /* runs after every render — deliberately */

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
    if (e.key === 'ArrowUp') { e.preventDefault(); glideTo(clamp(yMV.get() - step, lo, hi), 'glide'); }
    if (e.key === 'ArrowDown') { e.preventDefault(); glideTo(clamp(yMV.get() + step, lo, hi), 'glide'); }
  };

  const sheetReady = rootH > 0 && sheetH > 0;
  const prompts = profile.prompts || [];
  const interests = profile.interests || [];
  const photoB = profile.photos?.[1];
  const photoC = profile.photos?.[2];

  return (
    <div ref={rootRef} className="pc-root">
      <style>{PROFILE_CARD_CSS}</style>

      {/* ════ PHOTO — natural, full-bleed, recedes as the sheet covers it ════ */}
      <motion.div className="pc-heroWrap" style={{ scale: combinedPhotoScale, opacity: combinedPhotoOpacity }}>
        <img
          ref={heroImgRef}
          src={profile.photos?.[0] || FALLBACK_IMG}
          alt={profile.name || 'Profile photo'}
          draggable={false}
          onLoad={() => setHeroLoaded(true)}
          onError={(e) => {
            const img = e.currentTarget;
            if (!img.dataset.err) { img.dataset.err = '1'; img.src = FALLBACK_IMG; }
          }}
          decoding="async"
          className={`pc-hero${heroLoaded ? ' is-loaded' : ''}`}
        />
        <div className="pc-shade" aria-hidden="true" />
      </motion.div>

      {/* ════ THE SHEET ════ */}
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

        {/* IDENTITY — name with age beside it; ⋮ in the row; campus below */}
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
              onClick={(e) => { e.stopPropagation(); setShowMenu((v) => !v); }}
            >
              <MoreVertical size={18} strokeWidth={3} />
            </button>
          </div>

          {/* Campus badge — DISPLAY ONLY, BELOW the ⋮ row so it gets the full
              sheet width. The server strips `college` entirely when that person
              opted out (User.showCollege), so this renders nothing and no
              location data reaches the client at all. It never filters the
              deck. */}
          {profile.college && (
            <p className="pc-college">{profile.college}</p>
          )}

          {/* 📍 Coarse distance label — a BAND, never a distance.
              `distanceBand` is derived server-side from the two campuses'
              positions and arrives as one of "Near you" / "In your area" /
              "Further away". It is absent when the viewer's location is off or
              stale, or when the campus has no map position — and it is absent for
              the 300km+ band by design, since labelling every distant stranger
              "Elsewhere in India" is noise.

              No exact kilometres are rendered anywhere, by decision: publishing
              a precise distance on a card is a stronger privacy disclosure than
              a band, and the extra precision changes no decision a user makes. */}
          {profile.distanceBand && (
            <p className="pc-college pc-distance">{profile.distanceBand}</p>
          )}

          {/* Gap year — self-described; the card just says it. No ranking
              effect: hiding people for pausing a degree punishes honesty. */}
          {profile.gapYear && (
            <p className="pc-college" style={{ fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: 11 }}>Gap year</p>
          )}

          {/* report — inline row */}
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
                  onClick={() => { triggerHaptic('light'); setShowMenu(false); setShowReport(true); }}
                >
                  <Flag size={14} strokeWidth={2.6} /> Report profile
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ABOUT — right after the identity block */}
        {profile.bio && (
          <div className="pc-sec">
            <SectionHead mark="green">About</SectionHead>
            <p className="pc-bio">{profile.bio}</p>
          </div>
        )}

        {/* VITALS */}
        <div className="pc-sec">
          <SectionHead mark="coral">Vitals</SectionHead>
          <div className="pc-card" style={{ padding: 16 }}>
            <div className="pc-grid">
              <FieldCell icon={Calendar} color={TILE[1]} label="Year" value={profile.year || '—'} />
              <FieldCell icon={Sparkle} color={TILE[3]} label="Pronouns" value={profile.pronouns || '—'} />
            </div>
          </div>
        </div>

        {/* SEEKING */}
        <div className="pc-sec">
          <SectionHead mark="pink">Seeking</SectionHead>
          <div className="pc-pills">
            {(profileIntent.length ? profileIntent : ['Connection']).map((it, i) => (
              <span key={`${it}-${i}`} className="pc-chip acc">{it}</span>
            ))}
          </div>
        </div>

        {/* INTERESTS */}
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

        {/* EXHIBITS */}
        {(prompts[0]?.question || prompts[1]?.question || prompts[2]?.question || photoB || photoC || profile.photos?.[3]) && (
          <div className="pc-sec">
            <SectionHead mark="coral" count={[prompts[0], prompts[1], prompts[2], photoB, photoC, profile.photos?.[3]].filter(Boolean).length}>Exhibits</SectionHead>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {prompts[0]?.question && (
                <PopoutItem isGated={isGated} targetId="prompt_0" onAction={onAction} style={{ display: 'block' }}>
                  <div className="pc-card pc-prompt">
                    <p className="pc-promptq">{prompts[0].question}</p>
                    {prompts[0].answer && (
                      <p className="pc-prompta">{prompts[0].answer}</p>
                    )}
                  </div>
                </PopoutItem>
              )}
              {/* Photo pair — a LONE photo never sits in a half grid: with no
                  second tile the right square would sit empty. One photo alone
                  renders full-width on the wide 16/10 tile. */}
              {(photoB || photoC) && (photoB && photoC ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <PopoutItem isGated={isGated} targetId="photo_1" onAction={onAction} style={{ display: 'block' }}>
                    <PhotoTile src={photoB} />
                  </PopoutItem>
                  <PopoutItem isGated={isGated} targetId="photo_2" onAction={onAction} style={{ display: 'block' }}>
                    <PhotoTile src={photoC} />
                  </PopoutItem>
                </div>
              ) : (
                <PopoutItem isGated={isGated} targetId={photoB ? 'photo_1' : 'photo_2'} onAction={onAction} style={{ display: 'block' }}>
                  <PhotoTile src={photoB || photoC} wide />
                </PopoutItem>
              ))}
              {prompts[1]?.question && (
                <PopoutItem isGated={isGated} targetId="prompt_1" onAction={onAction} style={{ display: 'block' }}>
                  <div className="pc-card pc-prompt">
                    <p className="pc-promptq">{prompts[1].question}</p>
                    {prompts[1].answer && (
                      <p className="pc-prompta">{prompts[1].answer}</p>
                    )}
                  </div>
                </PopoutItem>
              )}
              {profile.photos?.[3] && (
                <PopoutItem isGated={isGated} targetId="photo_3" onAction={onAction} style={{ display: 'block' }}>
                  <PhotoTile src={profile.photos[3]} wide />
                </PopoutItem>
              )}
              {prompts[2]?.question && (
                <PopoutItem isGated={isGated} targetId="prompt_2" onAction={onAction} style={{ display: 'block' }}>
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
            onReported={() => { setShowReport(false); toast.success('Report submitted. Thank you for keeping the community safe.'); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileCard;
```

### ./client/src/pages/Splash.jsx

```
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Hourglass, Feather, BookOpen } from 'lucide-react';

const T = {
  paper: '#FFF9EC',
  ink: '#191919',
  ink2: '#5F5B52',
  ink3: '#A39E92',
  void: '#0c0a14',        // night slides — ink-dark with a violet whisper
  nightText: '#FFF9EC',
  nightMuted: 'rgba(255,249,236,0.55)',
  yellow: '#FFD43D',
  coral: '#FF7A59',
  fontHeavy: "'Archivo Black', 'Arial Black', sans-serif",
  fontBody: "'Inter', -apple-system, 'Segoe UI', sans-serif",
  fontMono: "'Space Mono', 'Courier New', monospace",
  fontHand: "'Caveat', 'Segoe Script', cursive",
};

const SLIDES = [
  { id: 'prologue', tag: 'The Manifesto', title: 'Matchalize', subtitle: 'A deliberate network', type: 'title', align: 'center', isNight: false },
  { id: 'problem', Icon: Hourglass, tag: 'The Illusion', title: 'Starting from zero.', body: 'Mainstream platforms manufacture connection from thin air. They optimize for surface signals while remaining structurally blind to the rhythm of your actual, lived existence.', align: 'right', isNight: true },
  { id: 'reality', Icon: Compass, tag: 'The Context', title: 'You are not in a vacuum.', body: 'A campus is extraordinarily dense with shared life. Hostels, societies, fests, and late-night rehearsals. The raw material for connection is already being generated all around you.', align: 'left', isNight: true },
  { id: 'solution', Icon: Feather, tag: 'The Engine', title: 'The campus is the catalyst.', body: "We don't use algorithms to guess your type. We use your lived world. Shared context collapses the distance between strangers before a single word is ever spoken.", align: 'center', isNight: false },
  { id: 'cta', tag: 'Initiation', title: 'Reclaim your world.', body: 'Built for the dense, temporary, and irreplaceable reality of college life.', type: 'cta', align: 'center', isNight: false },
];

export default function CinematicWebsite({ onEnter }) {
  const [step, setStep] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [unlocking, setUnlocking] = useState(false);

  const lastScrollTime = useRef(Date.now());
  const touchStartY = useRef(0);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const changeStep = (direction) => {
    if (unlocking) return;
    const now = Date.now();
    if (now - lastScrollTime.current < 1000) return;

    setStep((prev) => {
      const next = prev + direction;
      if (next >= 0 && next < SLIDES.length) {
        lastScrollTime.current = now;
        return next;
      }
      return prev;
    });
  };

  useEffect(() => {
    const handleWheel = (e) => {
      if (Math.abs(e.deltaY) > 30) changeStep(e.deltaY > 0 ? 1 : -1);
    };
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [unlocking]);

  const handleTouchStart = (e) => { touchStartY.current = e.touches[0].clientY; };
  const handleTouchEnd = (e) => {
    const delta = touchStartY.current - e.changedTouches[0].clientY;
    if (delta > 40) changeStep(1);
    if (delta < -40) changeStep(-1);
  };

  const handleUnlock = () => {
    try { navigator.vibrate?.([40, 80, 120]); } catch {}
    setUnlocking(true);
    setTimeout(onEnter, 1400);
  };

  const slide = SLIDES[step];
  const isNight = slide.isNight;

  // Circle choreography
  const scales = isMobile ? [1, 1.5, 1.5, 0.8, 1.2] : [1, 1.85, 1.85, 0.7, 1.25];
  const xPositions = isMobile ? ['0vw', '-45vw', '45vw', '0vw', '0vw'] : ['0vw', '-35vw', '35vw', '0vw', '0vw'];
  const rotations = [0, 45, 90, 135, 180];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.15 } },
    exit: { opacity: 0, filter: 'blur(12px)', transition: { duration: 0.5 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  /* slide-tag — the marker chip, themed per background */
  const tagStyle = {
    fontFamily: T.fontMono,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '.14em',
    textTransform: 'uppercase',
    padding: '5px 12px',
    display: 'inline-block',
    background: T.yellow,
    color: T.ink,
    border: `2px solid ${T.ink}`,
    boxShadow: `3px 3px 0 ${isNight ? 'rgba(255,249,236,0.25)' : T.ink}`,
    marginBottom: 18,
  };

  /* slide title — Bungee, the "where am I / what is this" voice */
  const titleStyle = (size) => ({
    color: isNight ? T.nightText : T.ink,
    fontFamily: T.fontHeavy,
    fontSize: size,
    fontWeight: 400,
    letterSpacing: '.01em',
    lineHeight: 1.1,
    margin: '0 0 20px 0',
    textTransform: 'uppercase',
    textShadow: isNight ? 'none' : `2px 2px 0 ${T.yellow}`,
  });

  const bodyStyle = {
    color: isNight ? T.nightMuted : T.ink2,
    fontFamily: T.fontBody,
    fontSize: 'clamp(16px, 2.5vw, 18px)',
    fontWeight: 500,
    margin: 0,
    lineHeight: 1.65,
    textWrap: 'pretty',
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden', backgroundColor: T.paper }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&family=Archivo+Black&family=Bungee&family=Caveat:wght@700&display=swap');
        @keyframes spinSlow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes spinReverse { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
      `}</style>

      {/* BACKGROUND — cream ↔ ink void */}
      <motion.div
        animate={{ backgroundColor: isNight ? T.void : T.paper }}
        transition={{ duration: 0.9, ease: 'easeInOut' }}
        style={{ position: 'absolute', inset: 0, zIndex: 0 }}
      />
      {/* dot grid — the paper texture, kept but softened */}
      <div style={{
        position: 'absolute', inset: 0, mixBlendMode: 'multiply',
        backgroundImage: `radial-gradient(circle at 20% 30%, rgba(25,25,25,0.12) 1px, transparent 1px), radial-gradient(circle at 70% 60%, rgba(25,25,25,0.08) 1px, transparent 1px)`,
        backgroundSize: '3px 3px, 5px 5px', pointerEvents: 'none', zIndex: 1, opacity: 0.5,
      }} />

      {/* THE CIRCLE — rings in ink + yellow */}
      <motion.div
        animate={{
          x: `calc(-50% + ${xPositions[step]})`,
          y: '-50%',
          scale: scales[step],
          rotate: rotations[step],
        }}
        transition={{ type: 'spring', mass: 2.5, stiffness: 40, damping: 25 }}
        style={{ position: 'absolute', top: '50%', left: '50%', width: 600, height: 600, zIndex: 2, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <motion.div animate={{ opacity: unlocking ? 0 : 0.7 }} transition={{ duration: 0.4 }} style={{ width: '100%', height: '100%', position: 'absolute' }}>
          <svg viewBox="0 0 800 800" style={{ width: '100%', height: '100%' }}>
            <g style={{ transformOrigin: 'center', animation: 'spinSlow 100s linear infinite' }}>
              <circle cx="400" cy="400" r="380" stroke={T.yellow} strokeWidth="3" fill="none" strokeDasharray="40 18" />
            </g>
            <g style={{ transformOrigin: 'center', animation: 'spinReverse 140s linear infinite' }}>
              <circle cx="400" cy="400" r="360" stroke={T.ink} strokeWidth="3.5" fill="none" opacity="0.9" />
            </g>
          </svg>
        </motion.div>

        {/* EXPANDING CORE — ink void on unlock */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: unlocking ? 150 : 0, opacity: unlocking ? 1 : 0 }}
          transition={{ duration: 1.2, ease: [0.7, 0, 0.1, 1] }}
          style={{ position: 'absolute', width: 40, height: 40, borderRadius: '50%', backgroundColor: T.ink, zIndex: 999 }}
        />
      </motion.div>

      {/* TEXT LAYER */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <AnimatePresence mode="wait">
          {!unlocking && (
            <motion.div
              key={step}
              variants={containerVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              style={{
                width: '100%',
                maxWidth: 1200,
                display: 'flex',
                flexDirection: 'column',
                alignItems: isMobile ? 'center' : slide.align === 'right' ? 'flex-end' : slide.align === 'left' ? 'flex-start' : 'center',
                padding: isMobile ? '0 24px' : slide.align === 'right' ? '0 10vw 0 0' : slide.align === 'left' ? '0 0 0 10vw' : '0 40px',
              }}
            >
              {/* SLIDE: TITLE */}
              {slide.type === 'title' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <motion.span variants={itemVariants} style={tagStyle}>
                    {slide.tag}
                  </motion.span>
                  {/* brand moment — the B-wordmark treatment, scaled up */}
                  <motion.h1
                    variants={itemVariants}
                    style={{
                      fontFamily: T.fontHeavy,
                      fontSize: 'clamp(44px, 10vw, 72px)',
                      fontWeight: 400,
                      color: T.ink,
                      textTransform: 'uppercase',
                      letterSpacing: '.01em',
                      lineHeight: 1.05,
                      margin: '0 0 14px 0',
                      textShadow: `4px 4px 0 ${T.yellow}`,
                    }}
                  >
                    {slide.title}
                  </motion.h1>
                  <motion.p variants={itemVariants} style={{ color: T.ink2, fontFamily: T.fontMono, fontSize: 12, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase' }}>
                    {slide.subtitle}
                  </motion.p>
                </div>
              )}

              {/* SLIDE: CONTENT */}
              {!slide.type && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isMobile ? 'center' : slide.align === 'right' ? 'flex-end' : 'flex-start',
                  textAlign: isMobile ? 'center' : slide.align,
                  maxWidth: 540,
                }}>
                  <motion.span variants={itemVariants} style={tagStyle}>
                    {slide.tag}
                  </motion.span>

                  <motion.h2 variants={itemVariants} style={titleStyle('clamp(36px, 6vw, 56px)')}>
                    {slide.title}
                  </motion.h2>

                  <motion.div variants={itemVariants} style={{
                    position: 'relative',
                    padding: isMobile ? 0 : slide.align === 'right' ? '0 28px 0 0' : '0 0 0 28px',
                    borderRight: !isMobile && slide.align === 'right' ? `2px solid ${T.yellow}` : 'none',
                    borderLeft: !isMobile && slide.align === 'left' ? `2px solid ${T.yellow}` : 'none',
                  }}>
                    <p style={bodyStyle}>
                      {slide.body}
                    </p>
                  </motion.div>
                </div>
              )}

              {/* SLIDE: CTA */}
              {slide.type === 'cta' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', maxWidth: 480 }}>
                  <motion.span variants={itemVariants} style={tagStyle}>
                    {slide.tag}
                  </motion.span>
                  <motion.h1
                    variants={itemVariants}
                    style={{
                      fontFamily: T.fontHeavy,
                      fontSize: 'clamp(38px, 7vw, 54px)',
                      fontWeight: 400,
                      color: T.ink,
                      textTransform: 'uppercase',
                      letterSpacing: '.01em',
                      lineHeight: 1.05,
                      margin: '0 0 16px 0',
                      textShadow: `4px 4px 0 ${T.yellow}`,
                    }}
                  >
                    Matchalize
                  </motion.h1>
                  <motion.p variants={itemVariants} style={{ color: T.ink2, fontFamily: T.fontBody, fontSize: 'clamp(15px, 2.5vw, 17px)', fontWeight: 600, margin: '0 0 36px', lineHeight: 1.6, textWrap: 'balance' }}>
                    {slide.body}
                  </motion.p>
                  <motion.button
                    variants={itemVariants}
                    onClick={handleUnlock}
                    className="splash-slam"
                    style={{
                      width: '100%',
                      padding: '22px 32px',
                      backgroundColor: T.yellow,
                      color: T.ink,
                      border: `3px solid ${T.ink}`,
                      borderRadius: 16,
                      boxShadow: `6px 6px 0 ${T.ink}`,
                      fontFamily: T.fontMono,
                      fontSize: 14,
                      fontWeight: 700,
                      letterSpacing: '.14em',
                      textTransform: 'uppercase',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 14,
                      cursor: 'pointer',
                    }}
                  >
                    <BookOpen size={22} strokeWidth={2.6} /> Enter Matchalize
                  </motion.button>
                </div>
              )}

            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* slam styles for the CTA */}
      <style>{`
        .splash-slam { transition: transform .08s steps(2), box-shadow .08s steps(2); -webkit-tap-highlight-color: transparent; }
        .splash-slam:hover { transform: translate(-2px, -2px); box-shadow: 8px 8px 0 ${T.ink}; }
        .splash-slam:active { transform: translate(6px, 6px) !important; box-shadow: 0 0 0 ${T.ink} !important; }
        .splash-slam:focus-visible { outline: 3px solid ${T.coral}; outline-offset: 3px; }
        @media (prefers-reduced-motion: reduce) {
          .splash-slam { transition: none; }
        }
      `}</style>
    </div>
  );
}
```

### ./client/src/utils/theme.js

```
export const THEME_STORAGE_KEY = 'matchalize:theme';
export const DARK_MOOD_KEY = 'matchalize:darkmood';
export const THEME_MODES = ['light', 'black'];

export function getThemePreference() {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && THEME_MODES.includes(stored)) return stored;
  } catch {
    /* ignore */
  }
  return null;
}

export function getDarkMood() {
  try {
    const stored = localStorage.getItem(DARK_MOOD_KEY);
    if (stored && THEME_MODES.includes(stored) && stored !== 'light') return stored;
  } catch {
    /* ignore */
  }
  return 'black';
}

export function setDarkMood(mode) {
  try {
    localStorage.setItem(DARK_MOOD_KEY, mode);
  } catch {
    /* ignore */
  }
}

export function applyThemeFromStorage() {
  /* The toggle is the ONLY thing that picks a theme — the OS appearance is
     never consulted, so the app cannot drift into dark mode on its own. */
  const want = getThemePreference() || 'light';
  setThemePreference(want);
  return want;
}

export function setThemePreference(mode) {
  const root = typeof document !== 'undefined' ? document.documentElement : null;
  if (!root) return mode;
  if (mode === 'light') {
    delete root.dataset.theme;
  } else {
    root.dataset.theme = mode;
  }
  try {
    /* Both modes are persisted, including light — deleting the key would hand
       the decision back to the OS on the next launch. */
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
  return mode;
}

export const theme = {
  color: {
    bg: '#f4efe3',
    paper: '#faf6ec',
    surface: '#fffdf6',
    surfaceAlt: '#f3ede0',
    surfaceDim: '#e7decb',

    ink: '#241f19',
    inkSoft: '#4e4638',
    inkMuted: '#6f6758',

    border: '#e3dac7',
    borderDark: '#cfc3aa',

    accent: '#6e4a2e',
    accentSoft: 'rgba(110, 74, 46, 0.18)',
    accentFaint: 'rgba(110, 74, 46, 0.05)',

    crimson: '#8b1a1a',
    crimsonSoft: 'rgba(139, 26, 26, 0.08)',

    success: '#22543d',
    warning: '#b46807',
    telegramTint: 'rgba(176, 141, 87, 0.08)',

    shadowWarm: 'rgba(74, 50, 34, 0.12)',
    shadowDark: 'rgba(26, 26, 26, 0.20)',

    neuDark: '#dedad2',
    neuLight: '#ffffff',
  },

  font: {
    display: "'Playfair Display', Georgia, serif",
    heading: "'Playfair Display', Georgia, serif",
    body: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    typewriter: "'Special Elite', 'Courier New', monospace",
  },

  texture: {
    grain:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.05 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E",
  },

  radius: {
    sm: '8px',
    md: '12px',
    lg: '24px',
    pill: '999px',
  },

  placeholder: {
    avatar:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' fill='%23ede7db'/%3E%3Cg fill='none' stroke='%23c9bda6' stroke-width='3'%3E%3Ccircle cx='60' cy='48' r='17'/%3E%3Cpath d='M28 104c0-18 14-32 32-32s32 14 32 32'/%3E%3C/g%3E%3C/svg%3E",
    image:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='500' viewBox='0 0 400 500'%3E%3Crect width='400' height='500' fill='%23ede7db'/%3E%3Cg fill='none' stroke='%23c9bda6' stroke-width='3'%3E%3Ccircle cx='200' cy='195' r='50'/%3E%3Cpath d='M112 385c0-49 39-88 88-88s88 39 88 88'/%3E%3C/g%3E%3C/svg%3E",
    hero:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='870' viewBox='0 0 600 870'%3E%3Crect width='600' height='870' fill='%23e8e4d9'/%3E%3Cg fill='none' stroke='%23c9bda6' stroke-width='4'%3E%3Ccircle cx='300' cy='340' r='82'/%3E%3Cpath d='M158 660c0-78 63-142 142-142s142 64 142 142'/%3E%3C/g%3E%3Ctext x='300' y='740' text-anchor='middle' font-family='Georgia,serif' font-size='26' fill='%23a89b85'%3ENo Portrait%3C/text%3E%3C/svg%3E",
  },

  z: {
    header: 500,
    nav: 10,
    drawer: 1000,
    modal: 1100,
    toast: 9999,
    overlay: 10000,
  },
};

export default theme;
```

