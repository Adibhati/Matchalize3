
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
import { Sparkle, MoreVertical, Calendar, Flag, Heart } from 'lucide-react';
import neu from '../styles/neu';
import { useIsDesktop } from '../utils/useIsDesktop';

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
  sky: '#8ED8F5',
  lavender: '#C8B6F2',
  intent: '#F5B7C8',
  amber: '#F5B942',
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
const PEEK_PAD = -6;
const PEEK_FALLBACK = 148;
const HANDLE_PEEK_HEIGHT = 20;
const HEADER_LEAD = 12;
const HEADER_RELEASE = 8;
const HEADER_FALLBACK_BOTTOM = 54;
const MENU_RAISE = 84;

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
    --topic-name: ${C.coral};
    --topic-gender: ${C.green};
    --topic-meeting: ${C.sky};
    --topic-year: ${C.lavender};
    --topic-intent: ${C.intent};
    --topic-location: ${C.amber};
    --topic-photo: ${C.ink};
    --topic-birthday: ${C.yellow};
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

  .pc-root.pc-desktop .pc-heroWrap {
    position: relative;
    inset: auto;
    grid-column: 1;
    width: auto;
    height: 100%;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    border: 2px solid var(--ink);
    border-radius: 24px;
    box-shadow: 6px 6px 0 var(--ink);
  }

  .pc-root.pc-tablet .pc-heroWrap {
    inset: 0;
    overflow: hidden;
    border-radius: inherit;
  }

  .pc-root.pc-tablet {
    box-sizing: border-box;
    border: 2px solid var(--ink);
    border-radius: 24px;
    box-shadow: 6px 6px 0 var(--ink);
  }

  .pc-root.pc-desktop .pc-shade {
    background: linear-gradient(90deg, rgba(23,20,20,.12) 55%, rgba(23,20,20,.36) 100%);
  }

  .pc-root.pc-desktop {
    display: grid;
    grid-template-columns: minmax(0, 43fr) minmax(0, 57fr);
    gap: 18px;
    padding: 16px;
    box-sizing: border-box;
    background: transparent;
  }

  .pc-root.pc-desktop .pc-sheet {
    position: relative;
    inset: auto;
    grid-column: 2;
    box-sizing: border-box;
    width: auto;
    height: 100%;
    min-height: 0;
    max-height: 100%;
    overflow-x: hidden;
    overflow-y: auto;
    scrollbar-gutter: stable;
    overscroll-behavior: contain;
    touch-action: pan-y;
    cursor: default;
    border: 2px solid var(--ink);
    border-radius: 24px;
    box-shadow: 6px 6px 0 var(--ink);
    padding: 24px 28px 32px;
    gap: 22px;
    user-select: text;
    -webkit-user-select: text;
    scrollbar-width: auto;
    scrollbar-color: auto;
  }

  .pc-root.pc-desktop .pc-sheet::-webkit-scrollbar {
    display: block;
    width: 12px;
  }

  .pc-root.pc-desktop .pc-sheet::-webkit-scrollbar-track {
    margin: 24px 4px;
    background: transparent;
  }

  .pc-root.pc-desktop .pc-sheet::-webkit-scrollbar-thumb {
    border: 4px solid var(--paper);
    border-radius: 999px;
    background: var(--ink-3);
    background-clip: padding-box;
  }

  .pc-root.pc-desktop .pc-grabber {
    display: none;
  }

  .pc-root.pc-desktop .pc-sheet:active {
    cursor: default;
  }

  .pc-root.pc-desktop .pc-name {
    font-size: clamp(28px, 3vw, 39px);
    line-height: 1.05;
    white-space: normal;
    overflow: visible;
    text-overflow: clip;
  }

  @media (min-width: 768px) and (max-width: 1100px) {
    .pc-root.pc-desktop {
      grid-template-columns: minmax(0, 40fr) minmax(0, 60fr);
      gap: 12px;
      padding: 12px;
    }

    .pc-root.pc-desktop .pc-sheet {
      padding-right: 18px;
      padding-left: 18px;
    }
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
    opacity: 1;
    -webkit-user-drag: none;
  }

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
    padding: 0 6px 5px 0;
  }

  .pc-age {
    font-family: ${F.body};
    font-weight: 700;
    font-size: .65em;
    letter-spacing: 0;
    color: var(--topic-birthday);
  }

  .pc-college {
    font-family: ${F.mono};
    font-size: 9px;
    font-weight: 700;
    letter-spacing: .075em;
    text-transform: uppercase;
    color: var(--ink-2);
    margin: 10px 0 0;
    border-left: 3px solid var(--topic-location);
    padding-left: 7px;
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

  .pc-idrow > .pc-iconbtn.pressed,
  .pc-idrow > .pc-iconbtn.pressed:hover,
  .pc-idrow > .pc-iconbtn:active {
    background: var(--yellow);
    filter: brightness(.94);
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
  .pc-mark.sky { background: var(--topic-meeting); }
  .pc-mark.lavender { background: var(--topic-year); }
  .pc-mark.intent { background: var(--topic-intent); }
  .pc-mark.amber { background: var(--topic-location); }
  .pc-mark.ink { background: var(--topic-photo); }
  .pc-mark.neutral { background: var(--ink-3); }

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
  .pc-tile.lavender { background: var(--topic-year); }
  .pc-tile.sky { background: var(--topic-meeting); }

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

  .pc-chip.acc { background: var(--topic-intent); }
  .pc-chip.meeting { background: var(--topic-meeting); }

  .pc-chip:active {
    filter: brightness(.94);
    color: var(--ink);
    border-color: var(--ink);
    box-shadow: 1px 1px 0 var(--ink);
    transform: translate(2px, 2px);
  }

  .pc-prompt {
    position: relative;
    padding: 15px;
    cursor: pointer;
    background: var(--card);
    transition: background .14s ease, box-shadow .14s ease, transform .14s ease;
  }

  .pc-exhibit-heart {
    position: absolute;
    top: 0;
    right: 0;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18.779px;
    height: 18.779px;
    border: 2px solid var(--ink);
    border-radius: 7.303px;
    background: #5BD98A;
    color: #fff;
    pointer-events: none;
  }

  .pc-exhibit-heart svg {
    display: block;
    width: 8.868px;
    height: 8.868px;
    flex-shrink: 0;
  }

  @media (min-width: 1200px) {
    .pc-exhibit-heart {
      width: 24.495px;
      height: 24.495px;
    }

    .pc-exhibit-heart svg {
      width: 9.389px;
      height: 9.389px;
    }
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
    position: relative;
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

  @media (min-width: 1200px) {
    .pc-root.pc-desktop .pc-sheet {
      padding: clamp(26px, 2.4vw, 40px) clamp(24px, 2.2vw, 38px) 36px;
      gap: clamp(24px, 2vw, 34px);
    }

    .pc-root.pc-desktop .pc-name {
      font-size: clamp(36px, 3vw, 52px);
    }

    .pc-root.pc-desktop .pc-age {
      font-size: .68em;
    }

    .pc-root.pc-desktop .pc-college {
      font-size: clamp(10px, .85vw, 13px);
      padding-left: 9px;
    }

    .pc-root.pc-desktop .pc-iconbtn {
      width: 46px;
      height: 46px;
    }

    .pc-root.pc-desktop .pc-sec {
      gap: 2px;
    }

    .pc-root.pc-desktop .pc-shead {
      gap: 11px;
      margin-bottom: 14px;
      padding-bottom: 10px;
    }

    .pc-root.pc-desktop .pc-mark {
      width: 12px;
      height: 12px;
    }

    .pc-root.pc-desktop .pc-stitle {
      font-size: clamp(11px, .9vw, 14px);
    }

    .pc-root.pc-desktop .pc-scount {
      font-size: clamp(10px, .8vw, 12px);
    }

    .pc-root.pc-desktop .pc-card {
      border-radius: 18px;
      box-shadow: 5px 5px 0 var(--ink);
    }

    .pc-root.pc-desktop .pc-sec > .pc-card {
      padding: 18px !important;
    }

    .pc-root.pc-desktop .pc-grid {
      gap: 18px 16px;
    }

    .pc-root.pc-desktop .pc-cell {
      gap: 11px;
    }

    .pc-root.pc-desktop .pc-tile {
      width: 38px;
      height: 38px;
      border-radius: 11px;
    }

    .pc-root.pc-desktop .pc-tile svg {
      width: 18px;
      height: 18px;
    }

    .pc-root.pc-desktop .pc-clabel {
      font-size: clamp(9px, .72vw, 11px);
    }

    .pc-root.pc-desktop .pc-cval {
      font-size: clamp(15px, 1.15vw, 18px);
    }

    .pc-root.pc-desktop .pc-bio {
      font-size: clamp(16px, 1.25vw, 19px);
      line-height: 1.65;
    }

    .pc-root.pc-desktop .pc-pills {
      gap: 11px;
    }

    .pc-root.pc-desktop .pc-chip {
      padding: 9px 13px;
      border-radius: 12px;
      font-size: clamp(10px, .78vw, 12px);
    }

    .pc-root.pc-desktop .pc-prompt {
      padding: 19px;
      border-radius: 18px;
    }

    .pc-root.pc-desktop .pc-promptq {
      font-size: clamp(11px, .82vw, 13px);
    }

    .pc-root.pc-desktop .pc-prompta {
      font-size: clamp(18px, 1.3vw, 21px);
    }

    .pc-root.pc-desktop .pc-ph {
      padding: 7px;
      border-radius: 17px;
    }

    .pc-root.pc-desktop .pc-ph-in {
      border-radius: 12px;
    }
  }

  @media (min-width: 1024px) and (max-width: 1100px) {
    .pc-root.pc-desktop .pc-sheet {
      padding: 24px 18px 30px;
      gap: 22px;
    }

    .pc-root.pc-desktop .pc-name {
      font-size: 36px;
    }

    .pc-root.pc-desktop .pc-sec > .pc-card {
      padding: 15px !important;
    }

    .pc-root.pc-desktop .pc-grid {
      gap: 14px 10px;
    }
  }

  @media (hover: hover) and (pointer: fine) {
    .pc-iconbtn:hover {
      background: var(--pink);
      box-shadow: 5px 5px 0 var(--ink);
      transform: translate(-2px, -2px);
    }

    .pc-iconbtn.pressed:hover { background: var(--yellow); }
    .pc-root.pc-desktop .pc-idrow > .pc-iconbtn:hover,
    .pc-root.pc-desktop .pc-idrow > .pc-iconbtn.pressed:hover {
      background: var(--card);
      filter: brightness(.96);
      box-shadow: 3px 3px 0 var(--ink);
      transform: none;
    }
    .pc-root.pc-desktop .pc-idrow > .pc-iconbtn.pressed,
    .pc-root.pc-desktop .pc-idrow > .pc-iconbtn.pressed:hover {
      background: var(--yellow);
      filter: brightness(.94);
      box-shadow: 1px 1px 0 var(--ink);
      transform: translate(2px, 2px);
    }
    .pc-root.pc-desktop .pc-idrow > .pc-iconbtn:not(.pressed):active,
    .pc-root.pc-desktop .pc-idrow > .pc-iconbtn.pressed:active {
      background: var(--yellow);
      filter: brightness(.94);
      box-shadow: 1px 1px 0 var(--ink);
      transform: translate(2px, 2px);
    }
    .pc-root:not(.pc-desktop) .pc-idrow > .pc-iconbtn:not(.pressed):hover {
      background: var(--card);
      box-shadow: 3px 3px 0 var(--ink);
      transform: none;
    }
    .pc-root:not(.pc-desktop) .pc-idrow > .pc-iconbtn.pressed:hover {
      background: var(--yellow);
      filter: brightness(.94);
      box-shadow: 1px 1px 0 var(--ink);
      transform: translate(2px, 2px);
    }
    .pc-menubtn:hover { background: #FFE4E5; padding-left: 12px; }
    .pc-chip:hover { filter: brightness(.96); }
    .pc-prompt:hover { background: #FFF0C0; box-shadow: 6px 6px 0 var(--ink); transform: translate(-2px, -2px); }
    .pc-ph:hover { box-shadow: 6px 6px 0 var(--ink); transform: translate(-2px, -2px); }
    .pc-root.pc-desktop .pc-prompt:hover {
      background: #5BD98A;
      box-shadow: 5px 5px 0 var(--ink);
      transform: none;
    }
    .pc-root.pc-desktop .pc-ph:hover {
      background: #5BD98A;
      box-shadow: 4px 4px 0 var(--ink);
      transform: none;
    }
    .pc-root.pc-desktop .pc-prompt:active {
      background: #5BD98A;
      box-shadow: 1px 1px 0 var(--ink);
      transform: translate(2px, 2px);
    }
    .pc-root.pc-desktop .pc-ph:active {
      background: #5BD98A;
      box-shadow: 1px 1px 0 var(--ink);
      transform: translate(2px, 2px);
    }
    .pc-root:not(.pc-desktop) .pc-prompt:hover,
    .pc-root:not(.pc-desktop) .pc-ph:hover {
      background: #5BD98A;
      box-shadow: 4px 4px 0 var(--ink);
      transform: none;
    }
  }

  .pc-root:not(.pc-desktop) .pc-prompt:active,
  .pc-root:not(.pc-desktop) .pc-ph:active {
    background: #5BD98A;
    box-shadow: 1px 1px 0 var(--ink);
    transform: translate(2px, 2px);
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
    <ExhibitHeartBadge />
  </div>
);

const ExhibitHeartBadge = () => (
  <span className="pc-exhibit-heart" aria-hidden="true">
    <Heart aria-hidden="true" fill="currentColor" strokeWidth={3.2} />
  </span>
);

const ProfileCard = ({
  profile = {},
  onAction,
  onSheetNearHeader,
  isGated = false,
  isDesktop = false,
  isTabletLayout = false,
  readOnly = false,
  onPhoneReplyKeyboardChange,
}) => {
  const desktopLayout = useIsDesktop() || isDesktop;
  const desktopLayoutRef = useRef(desktopLayout);
  desktopLayoutRef.current = desktopLayout;
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
  const interestedIn = Array.isArray(profile.interestedIn) ? profile.interestedIn : [];

  const [rootH, setRootH] = useState(0);
  const [sheetH, setSheetH] = useState(0);
  const rootHRef = useRef(0);
  const sheetHRef = useRef(0);
  const sheetPositionedFor = useRef(null);
  const sheetEntranceInProgress = useRef(false);
  const peekHRef = useRef(0);
  const lastMeasuredGeometryRef = useRef({ h: 0, w: 0, peek: 0 });

  const computeBounds = (h, w, peekOverride) => {
    if (!h || !w) return { lo: 0, hi: 0, ready: false, short: true };
    if (desktopLayoutRef.current) {
      return { lo: 0, hi: 0, collapsedHi: 0, ready: true, short: true };
    }

    const peek = peekOverride || peekHRef.current || PEEK_FALLBACK;
    const short = w < h - TOP_GAP - BOTTOM_GAP;
    const bottomAnchoredTop = h - BOTTOM_GAP - w;
    const rest = Math.max(TOP_GAP, h - BOTTOM_GAP - peek);
    const lo = short ? rest : Math.min(TOP_GAP, bottomAnchoredTop);
    const hi = rest;
    const collapsedHi = Math.max(hi, h - BOTTOM_GAP - HANDLE_PEEK_HEIGHT);

    return { lo, hi, collapsedHi, ready: true, short };
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
      const h = rootHRef.current;
      const w = el.offsetHeight;
      const previousGeometry = lastMeasuredGeometryRef.current;
      const previousBounds = computeBounds(
        previousGeometry.h,
        previousGeometry.w,
        previousGeometry.peek,
      );
      sheetHRef.current = w;
      setSheetH(w);

      const idEl = idRef.current;
      if (idEl) {
        const nearYouEl = idEl.querySelector('.pc-distance');
        const peekEnd = nearYouEl
          ? nearYouEl.offsetTop + nearYouEl.offsetHeight
          : idEl.offsetHeight;
        peekHRef.current = idEl.offsetTop + peekEnd + PEEK_PAD;
      }

      if (!h || !w) {
        lastMeasuredGeometryRef.current = {
          h,
          w,
          peek: peekHRef.current,
        };
        return;
      }

      if (sheetPositionedFor.current !== profile._id) {
        sheetPositionedFor.current = profile._id;
        const rest = computeBounds(h, w, peekHRef.current).hi;
        lastMeasuredGeometryRef.current = {
          h,
          w,
          peek: peekHRef.current,
        };
        yMV.set(rest + h + w);
        sheetEntranceInProgress.current = true;
        stopGlide();
        glideControls.current = animate(yMV, rest, {
          ...SPRING.current.glide,
          onComplete: () => {
            sheetEntranceInProgress.current = false;
            glideControls.current = null;
            measure();
          },
        });
        return;
      }

      if (sheetEntranceInProgress.current) return;

      const nextBounds = computeBounds(h, w, peekHRef.current);
      const cur = yMV.get();
      const wasAtRest =
        previousBounds.ready && Math.abs(cur - previousBounds.hi) <= 0.5;
      const target = wasAtRest
        ? nextBounds.hi
        : clamp(cur, nextBounds.lo, nextBounds.collapsedHi);
      lastMeasuredGeometryRef.current = {
        h,
        w,
        peek: peekHRef.current,
      };

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
      stopGlide();
      sheetEntranceInProgress.current = false;
      sheetPositionedFor.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setShowMenu(false);
    setShowReport(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile._id]);

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
    if (desktopLayoutRef.current) {
      onSheetNearRef.current?.(false);
      return;
    }
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
      if (desktopLayoutRef.current) return;
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

      const { lo, collapsedHi, ready } = boundsRef.current;
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
      } else if (raw > collapsedHi) {
        const over = raw - collapsedHi;
        yMV.set(collapsedHi + over * RUBBER);
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

      const { lo, hi, collapsedHi, ready } = boundsRef.current;
      if (!ready) return;

      const y = yMV.get();

      if (y < lo || y > collapsedHi) {
        glideTo(clamp(y, lo, collapsedHi), 'bounce');
        return;
      }

      const projected = clamp(y + vel * MOMENTUM_MS, lo, collapsedHi);
      const collapseThreshold = hi + (collapsedHi - hi) / 2;
      const target = projected > hi
        ? (projected >= collapseThreshold ? collapsedHi : hi)
        : projected;
      if (Math.abs(target - y) > 1) glideTo(target, 'glide');
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

    const { lo, collapsedHi, ready } = boundsRef.current;
    if (!ready) return;

    const cur = yMV.get();

    if (cur > collapsedHi + 1 || cur < lo - 1) {
      glideTo(clamp(cur, lo, collapsedHi), 'bounce');
    }
  });

  const onClickCapture = (e) => {
    if (dragged.current) {
      dragged.current = false;
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const onPhotoClick = () => {
    if (desktopLayout) return;

    const { hi, collapsedHi, ready } = boundsRef.current;
    if (!ready || yMV.get() < hi + (collapsedHi - hi) / 2) return;

    glideTo(hi, 'glide');
  };

  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;

    const onWheel = (e) => {
      if (desktopLayoutRef.current) return;
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
    if (desktopLayout) return;
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
  const renderExhibit = (targetId, content, onPhoneReply = false) => {
    if (readOnly) {
      return <div key={targetId} style={{ display: 'block' }}>{content}</div>;
    }

    return (
      <PopoutItem
        key={targetId}
        isGated={isGated}
        targetId={targetId}
        onAction={onAction}
        onPhoneReplyKeyboardChange={onPhoneReply ? onPhoneReplyKeyboardChange : undefined}
        style={{ display: 'block' }}
      >
        {content}
      </PopoutItem>
    );
  };

  return (
    <div
      ref={rootRef}
      className={`pc-root${desktopLayout ? ' pc-desktop' : ''}${isTabletLayout ? ' pc-tablet' : ''}`}
    >
      <style>{PROFILE_CARD_CSS}</style>

      <motion.div
        className="pc-heroWrap"
        onClick={onPhotoClick}
        style={{
          scale: photoScale,
          opacity: photoOpacity,
        }}
      >
        <img
          ref={heroImgRef}
          src={profile.photos?.[0] || FALLBACK_IMG}
          alt={profile.name || 'Profile photo'}
          draggable={false}
          onError={(e) => {
            const img = e.currentTarget;
            if (!img.dataset.err) {
              img.dataset.err = '1';
              img.src = FALLBACK_IMG;
            }
          }}
          decoding="async"
          className="pc-hero"
        />
        <div className="pc-shade" aria-hidden="true" />
      </motion.div>

      <motion.div
        ref={setSheetRefs}
        className="pc-sheet"
        style={{
          y: yMV,
          visibility: sheetReady ? 'visible' : 'hidden',
        }}
        onClickCapture={onClickCapture}
        onKeyDown={onSheetKeyDown}
        tabIndex={0}
        role="region"
        aria-label={`${profile.name || 'Profile'} details${desktopLayout ? '' : ' — drag or use arrow keys to move the card'}`}
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
            <SectionHead mark="neutral">About</SectionHead>
            <p className="pc-bio">{profile.bio}</p>
          </div>
        )}

        <div className="pc-sec">
          <SectionHead mark="lavender">Vitals</SectionHead>
          <div className="pc-card" style={{ padding: 15 }}>
            <div className="pc-grid">
              <FieldCell
                icon={Calendar}
                color="lavender"
                label="Year"
                value={profile.year || '—'}
              />
              <FieldCell
                icon={Sparkle}
                color="green"
                label="Pronouns"
                value={profile.pronouns || '—'}
              />
            </div>
          </div>
        </div>

        <div className="pc-sec">
          <SectionHead mark="intent">Seeking</SectionHead>
          <div className="pc-pills">
            {(profileIntent.length ? profileIntent : ['Connection']).map((it, i) => (
              <span key={`${it}-${i}`} className="pc-chip acc">{it}</span>
            ))}
          </div>
        </div>

        {interestedIn.length > 0 && (
          <div className="pc-sec">
            <SectionHead mark="sky">Open to</SectionHead>
            <div className="pc-pills">
              {interestedIn.map((preference, i) => (
                <span key={`${preference}-${i}`} className="pc-chip meeting">
                  {preference}
                </span>
              ))}
            </div>
          </div>
        )}

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
            mark="ink"
              count={[
                prompts[0], prompts[1], prompts[2],
                photoB, photoC, profile.photos?.[3],
              ].filter(Boolean).length}
            >
              Exhibits
            </SectionHead>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {prompts[0]?.question && renderExhibit('prompt_0', (
                  <div className="pc-card pc-prompt">
                    <p className="pc-promptq">{prompts[0].question}</p>
                    {prompts[0].answer && (
                      <p className="pc-prompta">{prompts[0].answer}</p>
                    )}
                    <ExhibitHeartBadge />
                  </div>
              ))}

              {(photoB || photoC) && (photoB && photoC ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {renderExhibit('photo_1', <PhotoTile src={photoB} />, true)}
                  {renderExhibit('photo_2', <PhotoTile src={photoC} />, true)}
                </div>
              ) : (
                renderExhibit(
                  photoB ? 'photo_1' : 'photo_2',
                  <PhotoTile src={photoB || photoC} wide />,
                  true,
                )
              ))}

              {prompts[1]?.question && renderExhibit('prompt_1', (
                  <div className="pc-card pc-prompt">
                    <p className="pc-promptq">{prompts[1].question}</p>
                    {prompts[1].answer && (
                      <p className="pc-prompta">{prompts[1].answer}</p>
                    )}
                    <ExhibitHeartBadge />
                  </div>
              ))}

              {profile.photos?.[3] && renderExhibit('photo_3', <PhotoTile src={profile.photos[3]} wide />, true)}

              {prompts[2]?.question && renderExhibit('prompt_2', (
                  <div className="pc-card pc-prompt">
                    <p className="pc-promptq">{prompts[2].question}</p>
                    {prompts[2].answer && (
                      <p className="pc-prompta">{prompts[2].answer}</p>
                    )}
                    <ExhibitHeartBadge />
                  </div>
              ))}
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
