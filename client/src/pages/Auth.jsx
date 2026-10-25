import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { api } from '../utils/api';
import { useChromeColor } from '../utils/chrome';
import socket from '../utils/socket';
import { triggerHaptic } from '../utils/haptics';
import { ArrowLeft, CheckCircle2, Search, X } from 'lucide-react';
import AccountSuspendedScreen from '../components/AccountSuspendedScreen';
import { useAuth } from '../utils/AuthContext';
import neu from '../styles/neu';
import campusPhoto from '../assets/college-town-aesthetic-cute-college-town.jpg';

const M = neu; // canon reference — kept only for the (hidden) SVG artwork voices

/* ============================================================
   C — THE DIALECT (ProfileCard.jsx palette, project-wide winner).
   docs/DESIGN-SYSTEM.md is the documentation twin of this object.
   One skin for every step and every breakpoint; per-step scenes
   were retired when the dialect was unified.
   ============================================================ */
const C = {
  ink: '#171414',            // all line work: borders, hard shadows, primary text
  ink2: '#393130',           // secondary text
  muted: '#6E6160',          // placeholders / tertiary
  paper: '#FFF9F4',          // page canvas
  card: '#FFFCF8',           // raised surfaces (inputs, tiles, photo frames)
  yellow: '#FFE76A',         // THE action color: CTAs, highlights, selection
  yellowDeep: '#FFDE45',     // pressed-CTA lemon
  coral: '#FF7399',          // secondary accent (the tilted "?", focus pops)
  green: '#B8F0C7',          // pastel mint — success / chosen washes
  pink: '#C8A7FF',           // lavender — decorative tile voice
  red: '#D9485D',            // destructive + errors only
  body: "'Space Grotesk', sans-serif",
  display: "'Barlow Condensed', sans-serif",
  mono: "'IBM Plex Mono', monospace",
};

/* ============================================================
   AUTH_CSS — desktop + shared foundation.
   Mobile used to override this in three stacked layers; all
   mobile styling now lives in one sheet: MOBILE_AUTH_CSS.
   ============================================================ */
export const AUTH_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bowlby+One+SC&family=Barlow+Condensed:wght@600;700;800;900&family=IBM+Plex+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');

  .au-root {
    --ink: ${C.ink};
    --ink2: ${C.ink2};
    --muted: ${C.muted};
    --paper: ${C.paper};
    --card: ${C.card};
    --yellow: ${C.yellow};
    --yellow-deep: ${C.yellowDeep};
    --coral: ${C.coral};
    --mint: ${C.green};
    --red: ${C.red};
    --accent: ${C.coral};
    --tint: rgba(255, 231, 106, .16);
    --body: ${C.body};
    --display: ${C.display};
    --mono: ${C.mono};

    width: 100%;
    height: 100vh;
    height: 100dvh;
    min-height: 100dvh;
    margin: 0;
    padding: 0;
    position: relative;
    isolation: isolate;
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior-y: contain;
    -webkit-overflow-scrolling: touch;
    background: var(--paper);
    color: var(--ink);
    font-family: var(--body);
    -webkit-font-smoothing: antialiased;
    transition: background .4s ease, color .3s ease;
  }

  .au-root *,
  .au-root *::before,
  .au-root *::after {
    box-sizing: border-box;
    -webkit-tap-highlight-color: transparent;
  }

  /* The old heritage blur-circle garnish is retired with the dialect. */

  .au-root ::selection {
    background: var(--yellow);
    color: var(--ink);
  }

  /* One uniform skin. The per-step desktop scenes (coral / sage / amber /
     dark) were retired when the app unified on the ProfileCard dialect. */

  /* Desktop split: keep the photo and form in fluid columns so the form is
     centered in the space remaining beside the image at every desktop width. */
  .au-root {
    --au-scene-width: 55vw;
  }

  .au-root-college .au-searchwrap {
    width: 115%;
    margin-left: -7.5%;
    margin-top: 10px;
  }

  .au-fit {
    position: relative;
    z-index: 1;
    width: calc(100% - var(--au-scene-width));
    margin-left: var(--au-scene-width);
    min-height: 100%;
    display: flex;
    flex-direction: column;
  }

  .au-panel {
    position: relative;
    z-index: 1;
    width: 100%;
    min-height: 100vh;
    min-height: 100dvh;
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
    padding:
      max(40px, env(safe-area-inset-top))
      clamp(28px, 4vw, 72px)
      max(34px, env(safe-area-inset-bottom));
    max-width: 760px;
    background: transparent;
    border: 0;
    border-radius: 0;
    box-shadow: none;
  }

  .au-step {
    position: relative;
    width: 100%;
    max-width: 520px;
    min-width: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 18px;
  }

  .au-root .au-step {
    translate: 0 var(--au-search-shift, 0px);
    transition: translate .46s cubic-bezier(.22, 1, .36, 1);
    will-change: translate;
  }

  .au-root.is-layout-resizing .au-step {
    transition: none !important;
  }

  /* ONE headline voice on every breakpoint — the Space Grotesk 800 look the
     phone uses. Desktop only scales it up; there is no second display font
     anymore, so phone and desktop read as the same screen. */
  .au-headline {
    margin: 0;
    max-width: 100%;
    color: var(--ink);
    font-family: var(--body);
    font-size: clamp(34px, 3.4vw, 48px);
    font-weight: 800;
    letter-spacing: -.06em;
    line-height: 1.04;
    overflow-wrap: anywhere;
    text-wrap: balance;
    transition: color .3s ease;
  }

  /* Keep "huh?" in the same type style as the surrounding headline. */
  .au-headline .au-huh-inline {
    font: inherit;
    letter-spacing: inherit;
    white-space: nowrap;
    text-shadow: none;
  }

  .au-sub {
    margin: 0;
    max-width: 570px;
    color: var(--ink2);
    font-family: var(--body);
    font-size: 14px;
    font-weight: 400;
    line-height: 1.6;
    overflow-wrap: anywhere;
    transition: color .3s ease;
  }

  .au-sub b {
    color: var(--ink);
    font-weight: 700;
  }

  .au-sub b.low {
    overflow-wrap: anywhere;
    text-transform: lowercase;
  }

  /* The little SVG step illustrations are retired: the campus photo pane
     replaced them on desktop, the full-bleed photo replaced them on mobile.
     The component still renders (hidden) so nothing else has to change. */
  .au-art {
    display: none;
  }

  .au-searchwrap {
    width: 100%;
    position: relative;
  }

  .au-college-heading-row {
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
  }

  .au-college-heading-row .au-headline {
    flex: 1 1 auto;
    min-width: 0;
  }

  .au-request-heading-row {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
  }

  .au-request-heading-row .au-headline {
    flex: 1 1 auto;
    min-width: 0;
  }

  .au-search-close {
    flex: 0 0 32px;
    display: grid;
    place-items: center;
    width: 32px;
    height: 40px;
    margin: 0;
    padding: 0;
    color: var(--ink2);
    background: transparent;
    border: 0;
    border-radius: 50%;
    box-shadow: none;
    cursor: pointer;
    transition: color .12s ease, background .12s ease;
  }

  .au-search-close:hover { color: var(--ink); }

  .au-search-close:active { background: rgba(23, 20, 20, .08); }

  .au-request-back {
    position: absolute;
    z-index: 7;
    left: -40px;
    top: 50%;
    width: 32px;
    height: 40px;
    margin: 0;
    color: var(--coral);
    transform: translateY(-50%);
  }

  .au-field-label {
    display: block;
    color: var(--ink2);
    font-family: var(--mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .09em;
    text-transform: uppercase;
  }

  .au-searchicon {
    width: 43px;
    height: 43px;
    position: absolute;
    z-index: 1;
    left: 13px;
    top: 50%;
    display: grid;
    place-items: center;
    transform: translateY(-50%);
    color: var(--ink);
    background: transparent;
    border-radius: 15px;
    pointer-events: none;
  }

  .au-search-clear {
    padding: 0;
    border: 0;
    box-shadow: none;
    cursor: pointer;
    pointer-events: auto;
  }

  /* Dialect inputs everywhere: card face, 2px ink line, hard slam shadow. */
  .au-search,
  .au-input {
    display: block;
    width: 100%;
    min-width: 0;
    height: 64px;
    padding: 0 20px;
    color: var(--ink);
    background: var(--card);
    border: 2px solid var(--ink);
    border-radius: 14px;
    outline: none;
    box-shadow: 3px 3px 0 var(--ink);
    font-family: var(--body);
    font-size: 17px;
    font-weight: 500;
    -webkit-appearance: none;
    appearance: none;
    transition: border-color .18s ease, box-shadow .18s ease, background .18s ease;
  }

  .au-search {
    padding-left: 62px;
  }

  .au-search::placeholder,
  .au-input::placeholder {
    color: var(--muted);
    opacity: .85;
    font-weight: 400;
  }

  .au-search:focus,
  .au-input:focus,
  .au-field input:focus {
    background: #FFF0F4;
    border-color: var(--coral);
    box-shadow: 4px 4px 0 var(--coral);
  }

  .au-input:disabled {
    opacity: .6;
  }

  .au-input:-webkit-autofill {
    -webkit-box-shadow: 0 0 0 60px var(--card) inset;
    -webkit-text-fill-color: var(--ink);
  }

  /* College results — one shared design on both breakpoints: circular logo
     on the left, name + location on the right, hairline-separated rows. */
  .au-results {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
    padding: 0;
    border-top: 1px solid var(--line, rgba(23,20,20,.22));
  }

  .au-result {
    position: relative;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 15px;
    min-height: 76px;
    width: 100%;
    padding: 12px 44px 12px 4px;
    text-align: left;
    background: transparent;
    color: var(--ink);
    border: 0;
    border-bottom: 1px solid var(--line, rgba(23,20,20,.22));
    border-radius: 0;
    cursor: pointer;
    transition: background .15s ease;
  }

  .au-result::after {
    content: '→';
    position: absolute;
    top: 50%;
    right: 12px;
    transform: translateY(-50%);
    color: var(--ink);
    font: 19px/1 var(--body);
    transition: transform .18s ease, color .18s ease;
  }

  .au-result:hover::after {
    color: var(--coral);
    transform: translateY(-50%) translate(2px, 0);
  }

  /* The circular college logo (uploaded logo, or an ink initials fallback). */
  .au-logo {
    flex-shrink: 0;
    width: 52px;
    height: 52px;
    display: grid;
    place-items: center;
    overflow: hidden;
    background: var(--card);
    border: 2px solid var(--ink);
    border-radius: 50%;
    box-shadow: 2px 2px 0 var(--ink);
    color: var(--ink2);
    font-family: var(--mono);
    font-size: 14px;
    font-weight: 700;
    letter-spacing: .02em;
  }

  .au-logo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .au-result-text {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }

  .au-result-name {
    color: var(--ink);
    font-family: var(--body);
    font-size: 15.5px;
    font-weight: 700;
    line-height: 1.35;
    overflow-wrap: anywhere;
  }

  .au-result-meta {
    color: var(--muted);
    font-family: var(--mono);
    font-size: 10px;
    font-weight: 600;
    line-height: 1.5;
    letter-spacing: .05em;
    text-transform: uppercase;
  }

  .au-result.chosen {
    background: rgba(184, 240, 199, .28);
  }

  .au-result.chosen::after {
    content: '✓';
    color: var(--ink);
    font-weight: 700;
  }

  .au-empty {
    margin: 0;
    padding: 10px 2px;
    color: var(--muted);
    font-family: var(--mono);
    font-size: 11px;
    font-weight: 500;
    line-height: 1.8;
  }

  .au-form {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 19px;
  }

  .au-cta {
    min-height: 58px;
    width: 100%;
    padding: 15px 22px;
    color: var(--ink);
    background: var(--yellow);
    border: 2px solid var(--ink);
    border-radius: 14px;
    cursor: pointer;
    box-shadow: 4px 4px 0 var(--ink);
    font-family: var(--body);
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0;
    transition: transform .08s steps(2), box-shadow .08s steps(2), background .12s ease;
    -webkit-tap-highlight-color: transparent;
  }

  .au-cta:active:not(:disabled) {
    transform: translate(4px, 4px);
    box-shadow: 0 0 0 var(--ink);
    background: var(--yellow-deep);
  }

  .au-cta:disabled {
    background: var(--card);
    color: var(--muted);
    border-color: var(--muted);
    box-shadow: 3px 3px 0 var(--muted);
    cursor: default;
    opacity: .75;
  }

  .au-ghost {
    align-self: flex-start;
    min-height: 38px;
    padding: 7px 0;
    background: transparent;
    color: var(--ink2);
    border: 0;
    border-bottom: 1px solid rgba(127,125,115,.4);
    border-radius: 0;
    cursor: pointer;
    font-family: var(--body);
    font-size: 13px;
    font-weight: 600;
    transition: color .15s ease, border-color .15s ease;
  }

  .au-ghost:disabled {
    opacity: .5;
    cursor: not-allowed;
  }

  .au-otp {
    width: 100%;
    display: flex;
    justify-content: flex-start;
    gap: clamp(7px, 2vw, 13px);
  }

  .au-box {
    flex: 1 1 0;
    min-width: 0;
    max-width: 72px;
    height: 70px;
    padding: 0;
    text-align: center;
    color: var(--ink);
    background: var(--card);
    border: 2px solid var(--ink);
    border-radius: 14px;
    box-shadow: 3px 3px 0 var(--ink);
    font-family: var(--body);
    font-size: 32px;
    font-weight: 500;
    outline: none;
    caret-color: var(--accent);
    transition: background .15s ease, border-color .15s ease, transform .15s ease;
  }

  .au-box:focus {
    background: #FFF0F4;
    border-color: var(--coral);
    box-shadow: 4px 4px 0 var(--coral);
    transform: translateY(-2px);
  }

  .au-box:disabled:not(.ok) {
    opacity: .6;
  }

  .au-box.err {
    border-color: var(--red);
    animation: au-shake .3s steps(2) 2;
  }

  .au-box.ok {
    background: rgba(184, 240, 199, .45);
    color: var(--ink);
    border-color: var(--ink);
    transform: translateY(-2px);
  }

  @keyframes au-shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-4px); }
    75% { transform: translateX(4px); }
  }

  /* Error banner — dialect: quiet paper, one hard red ink edge. */
  .au-banner {
    position: relative;
    padding: 12px 16px;
    background: transparent;
    border: 0;
    border-left: 3px solid var(--red);
    border-radius: 0;
    overflow: visible;
  }

  .au-banner p {
    margin: 0;
    color: var(--ink);
    font-family: var(--body);
    font-size: 14px;
    font-weight: 500;
    line-height: 1.65;
  }

  /* Success strip — a mint "stamp": ink border, hard shadow. */
  .au-strip {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 18px;
    background: rgba(184, 240, 199, .45);
    color: var(--ink);
    border: 2px solid var(--ink);
    border-radius: 14px;
    box-shadow: 3px 3px 0 var(--ink);
    font-family: var(--body);
    font-size: 14px;
    font-weight: 700;
  }

  .au-field {
    display: flex;
    flex-direction: column;
    gap: 9px;
    min-width: 0;
  }

  .au-field label {
    color: var(--ink2);
    font-family: var(--body);
    font-size: 13px;
    font-weight: 600;
  }

  .au-field input {
    width: 100%;
    min-width: 0;
    height: 58px;
    padding: 0 16px;
    color: var(--ink);
    background: var(--card);
    border: 2px solid var(--ink);
    border-radius: 14px;
    outline: none;
    box-shadow: 3px 3px 0 var(--ink);
    font-family: var(--body);
    font-size: 16px;
    font-weight: 500;
    -webkit-appearance: none;
    appearance: none;
    transition: border-color .15s ease, box-shadow .15s ease;
  }

  .au-field input:focus {
    background: #FFFFFF;
    border-color: var(--ink);
    box-shadow: 4px 4px 0 var(--ink);
  }

  .au-field input::-webkit-outer-spin-button,
  .au-field input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  .au-revnote {
    margin: 0;
    color: var(--muted);
    font-family: var(--body);
    font-size: 12px;
    line-height: 1.7;
  }

  .au-search:focus-visible,
  .au-search-close:focus-visible,
  .au-input:focus-visible,
  .au-box:focus-visible,
  .au-result:focus-visible,
  .au-cta:focus-visible,
  .au-ghost:focus-visible,
  .au-field input:focus-visible {
    outline: 2px solid var(--coral);
    outline-offset: 3px;
  }

  @media (hover: hover) and (pointer: fine) {
    .au-result:hover:not(:disabled) {
      background: rgba(255, 231, 106, .22);
    }

    .au-cta:hover:not(:disabled) {
      filter: brightness(.97);
      transform: translate(-1px, -1px);
      box-shadow: 5px 5px 0 var(--ink);
    }

    .au-ghost:hover:not(:disabled) {
      color: var(--coral);
      border-color: var(--coral);
    }
  }

  /* ── The desktop campus-photo pane ──
     Its width follows the desktop form column's CSS variable. A horizontal
     wash dissolves its right edge into the paper instead of making a hard cut. */
  .au-campus-scene {
    display: block;
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    width: calc(var(--au-scene-width) + 2px);
    z-index: 0;
    overflow: hidden;
    pointer-events: none;
    background: var(--paper);
  }

  .au-campus-photo {
    display: block;
    position: absolute;
    z-index: 0;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center 42%;
    filter: saturate(.92) contrast(.98) brightness(.97);
    transition: filter .5s cubic-bezier(.2,.8,.2,1), transform .6s cubic-bezier(.2,.8,.2,1);
  }

  .au-campus-wash {
    position: absolute;
    z-index: 1;
    inset: 0;
    background: linear-gradient(
      90deg,
      rgba(255, 249, 244, 0) 0%,
      rgba(255, 249, 244, 0) 62%,
      rgba(255, 249, 244, .5) 82%,
      rgba(255, 249, 244, .9) 94%,
      ${C.paper} 100%
    );
  }

  .au-campus-blur { display: none; }

  /* Focused-input mode is shared by college, email, and OTP on every layout.
     The field group moves to the top while the campus scene softens. */
  .au-root.is-auth-input-open { overflow: hidden; }

  .au-root.is-auth-input-open .au-brandbar {
    position: absolute;
    left: var(--au-brand-left, 0px);
    top: var(--au-brand-top, max(18px, env(safe-area-inset-top, 0px)));
    width: var(--au-brand-width, 100%);
    margin: 0;
    opacity: 0;
    transform: translateY(-6px);
    visibility: hidden;
    pointer-events: none;
    transition: opacity .24s ease, transform .24s ease, visibility 0s linear .24s;
  }

  .au-campus-scene.is-auth-input-open .au-campus-photo {
    filter: blur(10px) saturate(.9) contrast(.98) brightness(.94);
    transform: scale(1.06);
  }

  .au-campus-scene.is-auth-input-open .au-campus-blur { opacity: 1; }

  .au-root.is-auth-input-open .au-panel {
    height: 100vh;
    height: 100dvh;
    min-height: 0;
    justify-content: flex-start;
    padding-top: max(30px, env(safe-area-inset-top, 0px));
    padding-bottom: max(14px, env(safe-area-inset-bottom, 0px));
  }

  .au-root.is-auth-input-open .au-step { flex: 1 1 auto; min-height: 0; }

  @media (min-width: 1200px) {
    .au-root-email .au-sub,
    .au-root-email .au-sub b {
      color: ${C.ink};
    }

    .au-root-otp .au-sub,
    .au-root-otp .au-sub b {
      color: #fff;
    }

    .au-root-email .au-ghost,
    .au-root-otp .au-ghost {
      color: ${C.coral};
      border-bottom-color: ${C.coral};
      font-size: 16.9px;
    }

    .au-root-otp .au-banner {
      border-left-color: ${C.coral};
    }

    .au-root-otp .au-banner p {
      color: #fff;
    }

    .au-root.au-root-college .au-empty {
      color: #fff;
      font-size: 12.65px;
    }

    .au-root.au-root-college .au-result-name {
      color: #fff;
      font-size: 17.825px;
    }

    .au-root.au-root-college .au-result-meta {
      color: #fff;
      font-size: 11.5px;
    }

    .au-root.au-root-college .au-result::after {
      color: #fff;
      font-size: 21.85px;
    }

    .au-campus-scene {
      transition: width .48s ease-out;
    }

    .au-campus-photo {
      transition:
        filter .48s ease-out,
        transform .72s ease-out;
    }

    .au-campus-scene-college.is-auth-input-open,
    .au-campus-scene.is-auth-flow-expanded {
      width: 100vw;
    }

    .au-campus-scene-college.is-auth-input-open .au-campus-photo,
    .au-campus-scene.is-auth-flow-expanded .au-campus-photo {
      filter: blur(10px) saturate(.9) contrast(.98) brightness(.94);
      transform: translateY(-3%) scale(1.06);
    }

    .au-campus-scene-college.is-auth-input-open .au-campus-wash,
    .au-campus-scene.is-auth-flow-expanded .au-campus-wash {
      background: rgba(255, 249, 244, .18);
      -webkit-backdrop-filter: blur(12px) saturate(1.1);
      backdrop-filter: blur(12px) saturate(1.1);
    }

    .au-campus-scene-college.is-auth-input-open .au-campus-wash::after,
    .au-campus-scene.is-auth-flow-expanded .au-campus-wash::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(
        90deg,
        transparent 68%,
        rgba(255, 249, 244, .12) 82%,
        rgba(255, 249, 244, .32) 100%
      );
      opacity: 1;
      animation: au-campus-right-edge-in .48s ease-out both;
    }

    @keyframes au-campus-right-edge-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .au-root.is-auth-input-open .au-brandbar {
      position: fixed;
      left: max(28px, env(safe-area-inset-left, 0px));
      top: max(22px, env(safe-area-inset-top, 0px));
      width: auto;
      opacity: 1;
      transform: none;
      visibility: visible;
      pointer-events: auto;
      transition: none;
    }

    .au-root .au-step {
      transition: translate .48s ease-out;
    }

    .au-root.au-root-college:not(.is-auth-input-open) .au-step {
      translate: calc(-50px + var(--au-college-desktop-shift, 0px)) var(--au-search-shift, 0px);
    }

    .au-root .au-campus-photo {
      transition: filter .72s cubic-bezier(.32,.72,0,1), transform .8s cubic-bezier(.32,.72,0,1);
    }

    .au-root.au-root-college.is-auth-input-open .au-fit {
      height: 100dvh;
      min-height: 0;
      overflow: visible;
    }

    .au-root.is-auth-input-open .au-panel {
      justify-content: center;
      height: 100dvh;
      padding-top: max(40px, env(safe-area-inset-top));
      padding-bottom: max(34px, env(safe-area-inset-bottom));
      overflow: visible;
    }

    .au-root.au-root-college.is-auth-input-open .au-panel {
      justify-content: flex-start;
    }

    .au-root.is-auth-input-open .au-step {
      flex: 0 1 auto;
      min-height: auto;
      z-index: 1;
      --au-desktop-center-shift: calc(var(--au-scene-width) / -2);
      translate: var(--au-desktop-center-shift) calc(var(--au-search-shift, 0px) - 25vh + 70px);
    }

    .au-root.au-root-college.is-auth-input-open .au-step {
      height: auto;
      max-height: none;
      flex: 1 1 auto;
      translate: var(--au-desktop-center-shift) calc(var(--au-search-shift, 0px) + 30px);
      overflow: visible;
    }

    .au-root.au-root-college.is-auth-input-open .au-results {
      flex: 1 1 0;
      min-height: 0;
      max-height: none;
      width: 150%;
      margin-left: -25%;
      overflow-y: auto;
    }

    .au-root.au-root-college.is-auth-input-open .au-no-results {
      width: 76.6667%;
      margin-inline: auto;
    }

    .au-root.au-root-college .au-college-heading-row {
      transform: translateX(-7.5%);
    }

    .au-root.au-root-college.is-auth-input-open .au-search-close {
      left: -8px;
      top: -40px;
      transform: translateY(-30%);
    }

    .au-root-request .au-request-heading-row {
      flex-direction: column;
      align-items: stretch;
      gap: 8px;
    }

    .au-root-request .au-request-back {
      position: static;
      align-self: flex-start;
      width: 26.4px;
      flex-basis: 26.4px;
      transform: translateY(-50%);
    }

    .au-root-request .au-request-back svg {
      transform: translateX(-5.5px);
    }

  }

  .au-root.is-auth-input-open .au-results {
    flex: 1 1 auto;
    min-height: 0;
    max-height: none;
    padding-top: 6px;
    padding-bottom: calc(var(--au-kb, 0px) + 14px);
    -webkit-mask-image: linear-gradient(180deg, transparent 0, #000 14px);
    mask-image: linear-gradient(180deg, transparent 0, #000 14px);
  }

  .au-brandbar {
    position: fixed;
    z-index: 5;
    top: max(22px, env(safe-area-inset-top, 0px));
    left: max(28px, env(safe-area-inset-left, 0px));
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    width: auto;
    max-width: none;
    margin: 0;
    transition: opacity .24s ease, transform .24s ease, visibility 0s;
  }

  .au-wordmark {
    display: inline-block;
    color: var(--ink);
    font-family: 'Bowlby One SC', var(--display);
    font-size: clamp(40px, 3.6vw, 54px);
    font-weight: 400;
    letter-spacing: -.065em;
    line-height: .92;
    text-shadow: 2.5px 2.5px 0 var(--yellow);
  }

  .au-brand-question {
    display: inline-block;
    color: var(--coral);
    margin-left: .015em;
    transform: rotate(7deg) translateY(-.015em);
    transform-origin: 60% 65%;
  }

  @media (prefers-reduced-motion: reduce) {
    .au-search,
    .au-input,
    .au-result,
    .au-cta,
    .au-ghost,
    .au-box,
    .au-field input {
      transition: none;
    }

    .au-box.err {
      animation: none;
    }
  }

  /* Invisible tap-catcher behind the open search sheet: clicking the photo
     pane (or any dead space) closes the search, exactly like on the phone. */
  .au-backdrop {
    position: fixed;
    inset: 0;
    z-index: 0;
    background: transparent;
    -webkit-tap-highlight-color: transparent;
  }
`;

/* ============================================================
   MOBILE_AUTH_CSS — the single, consolidated mobile sheet.
   This is the final computed result of the old three-layer
   stack (base skin + campus scene + smooth polish), with the
   dead rules removed: the per-step photo grading and washes
   were fully overridden by the full-bleed photo rules, and the
   hand-built campus SVG was never visible (display:none on
   every breakpoint).
   ============================================================ */
export const MOBILE_AUTH_CSS = `
  @media (max-width: 1199px) {
    /* ---- tokens & root ---- */
    .au-root {
      --ink: ${C.ink};
      --ink2: ${C.ink2};
      --muted: ${C.ink2};
      --paper: ${C.paper};
      --card: ${C.card};
      --accent: ${C.yellow};
      --tint: rgba(255,212,61,.14);
      --red: ${C.red};
      --line: ${C.ink};
      --body: ${C.body};
      --display: ${C.display};
      --mono: ${C.mono};
      background: ${C.paper};
      color: ${C.ink};
      font-family: var(--body);
    }

    /* Desktop per-step palettes are replaced by one uniform skin. */
    .au-root.au-root-college,
    .au-root.au-root-request,
    .au-root.au-root-email,
    .au-root.au-root-otp,
    .au-root.au-root-verify {
      --ink: ${C.ink};
      --ink2: ${C.ink2};
      --muted: ${C.ink2};
      --paper: ${C.paper};
      --card: ${C.card};
      --accent: ${C.yellow};
      --tint: rgba(255,212,61,.14);
      --red: ${C.red};
      --line: ${C.ink};
      background: transparent;
      color: ${C.ink};
    }

    .au-root::before,
    .au-root::after { display: none; content: none; }

    .au-root-request {
      height: var(--au-visible-height, 100dvh);
      min-height: var(--au-visible-height, 100dvh);
    }

    .au-campus-scene {
      background: ${C.paper};
      z-index: 0;
      width: 100vw;
      height: 100vh;
      height: 100lvh;
    }

    .au-root {
      z-index: 1;
      background: transparent;
    }

    .au-campus-scene-request {
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      height: 100lvh;
    }

    /* ---- layout frame ---- */
    .au-fit {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 430px;
      min-height: 100dvh;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
    }

    .au-root-request .au-fit,
    .au-root-request .au-panel {
      min-height: var(--au-visible-height, 100dvh);
    }

    .au-panel {
      position: relative;
      z-index: 1;
      width: 100%;
      min-height: 100dvh;
      flex: 1 0 auto;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      justify-content: flex-start;
      gap: 0;
      margin: 0;
      padding:
        max(18px, env(safe-area-inset-top, 0px))
        22px
        max(28px, env(safe-area-inset-bottom, 0px));
      background: transparent;
      border: 0;
      border-radius: 0;
      box-shadow: none;
    }

    /* ---- brand: the product wordmark, set directly on the canvas ---- */
    .au-brandbar {
      position: absolute;
      top: max(18px, env(safe-area-inset-top, 0px));
      left: max(22px, env(safe-area-inset-left, 0px));
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      width: auto;
      max-width: none;
      margin: 0;
      min-height: 0;
      transition: opacity .24s ease, transform .24s ease, visibility 0s linear .24s;
    }

    .au-root-request .au-brandbar {
      display: none;
      position: relative;
      top: auto;
      left: auto;
      margin: 0 0 12px;
    }

    .au-wordmark {
      display: inline-block;
      color: ${C.ink};
      font-family: 'Bowlby One SC', ${C.display};
      font-size: clamp(37px, 10vw, 47px);
      font-weight: 400;
      letter-spacing: -.065em;
      line-height: .92;
      text-shadow: 2px 2px 0 ${C.yellow};
    }

    .au-brand-question {
      display: inline-block;
      color: ${C.coral};
      margin-left: .015em;
      transform: rotate(7deg) translateY(-.015em);
      transform-origin: 60% 65%;
    }

    .au-brand-whisper {
      color: ${C.ink2};
      font-family: ${C.body};
      font-size: 11px;
      font-weight: 600;
      letter-spacing: .015em;
      line-height: 1.35;
    }

    /* ---- step: content sits directly on the paper, pushed to the bottom ---- */
    .au-step {
      position: relative;
      isolation: isolate;
      z-index: 1;
      width: 100%;
      max-width: 380px;
      min-width: 0;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 10px;
      margin: auto auto max(10px, env(safe-area-inset-bottom, 0px));
      padding: 18px 0 max(8px, env(safe-area-inset-bottom, 0px));
      background: transparent;
      color: ${C.ink};
      border: 0;
      border-radius: 0;
      box-shadow: none;
    }

    /* Soft veil so text never fights the photo directly behind it. */
    .au-step::before {
      content: '';
      position: absolute;
      z-index: -1;
      pointer-events: none;
      top: -34px;
      right: -22px;
      bottom: -24px;
      left: -22px;
      background: linear-gradient(180deg, rgba(255,249,244,0) 0%, rgba(255,249,244,.76) 18%, rgba(255,249,244,.92) 46%, ${C.paper} 100%);
      opacity: .94;
      transition: opacity .4s cubic-bezier(.32,.72,0,1);
    }

    /* The long request form gets extra breathing room at the bottom. */
    .au-panel:has(.au-step .au-form .au-field:nth-of-type(3)) .au-step {
      margin-bottom: max(28px, env(safe-area-inset-bottom, 0px));
    }

    /* Headline/sub share the base voice now — phones only scale them down.
       Same font, same weight, same tracking as desktop: one screen, two sizes. */
    .au-step .au-headline {
      max-width: 22ch;
      font-size: clamp(27px, 7.8vw, 34px);
      line-height: 1.08;
    }

    .au-step .au-sub {
      max-width: 31ch;
      margin: -2px 0 0;
      font-size: clamp(14px, 3.8vw, 16px);
      line-height: 1.5;
    }

    .au-sub b { color: ${C.ink}; font-weight: 700; }
    .au-sub b.low { overflow-wrap: anywhere; text-transform: lowercase; }

    .au-mobile-sub { display: block; }

    /* Mobile replaces the framed illustration with the full-bleed photo. */
    .au-step > .au-art { display: none !important; }

    /* ---- search field ---- */
    .au-searchwrap { position: relative; z-index: 2; width: 100%; }

    .au-root-college .au-searchwrap {
      width: 100%;
      margin-left: 0;
    }

    .au-searchicon {
      position: absolute;
      z-index: 1;
      left: 15px;
      top: 50%;
      display: grid;
      place-items: center;
      width: 22px;
      height: 22px;
      transform: translateY(-50%);
      color: ${C.ink};
      background: transparent;
      pointer-events: none;
    }

    .au-search-clear {
      left: 8px;
      width: 36px;
      height: 36px;
      pointer-events: auto;
    }

    .au-search {
      display: block;
      width: 100%;
      height: 52px;
      padding: 0 14px 0 47px;
      color: ${C.ink};
      background: rgba(255,252,248,.97);
      border: 2px solid ${C.ink};
      border-radius: 14px;
      outline: none;
      box-shadow: 3px 3px 0 ${C.ink};
      font-family: ${C.body};
      font-size: 16px;
      font-weight: 500;
      -webkit-appearance: none;
      appearance: none;
      transition: box-shadow .2s cubic-bezier(.32,.72,0,1), background .2s ease, transform .2s cubic-bezier(.32,.72,0,1);
    }

    .au-search:focus {
      background: #FFF0F4;
      border-color: ${C.coral};
      box-shadow: 3px 3px 0 ${C.coral};
      transform: none;
    }

    /* ---- inputs & fields ---- */
    .au-input,
    .au-field input {
      display: block;
      width: 100%;
      min-width: 0;
      height: 54px;
      padding: 0 14px;
      color: ${C.ink};
      background: rgba(255,252,248,.96);
      border: 2px solid ${C.ink};
      border-radius: 12px;
      outline: none;
      box-shadow: 3px 3px 0 ${C.ink};
      font-family: ${C.body};
      font-size: 16px;
      font-weight: 500;
      -webkit-appearance: none;
      appearance: none;
      transition: box-shadow .2s cubic-bezier(.32,.72,0,1), background .2s ease, transform .2s cubic-bezier(.32,.72,0,1);
    }

    .au-search::placeholder,
    .au-input::placeholder,
    .au-field input::placeholder {
      color: ${C.ink2};
      opacity: .8;
      font-weight: 400;
    }

    .au-input:focus,
    .au-field input:focus {
      background: #FFF0F4;
      border-color: ${C.coral};
      box-shadow: 4px 4px 0 ${C.coral};
      transform: none;
    }

    .au-input:disabled,
    .au-field input:disabled { opacity: .65; }

    .au-input:-webkit-autofill,
    .au-field input:-webkit-autofill {
      -webkit-box-shadow: 0 0 0 60px ${C.card} inset, 3px 3px 0 ${C.ink};
      -webkit-text-fill-color: ${C.ink};
    }

    /* ---- results: calm full-width rows; the list owns the screen height ---- */
    .au-results {
      display: flex;
      flex-direction: column;
      gap: 0;
      width: 100%;
      overflow-y: auto;
      overscroll-behavior: contain;
      -webkit-overflow-scrolling: touch;
      padding: 0;
      border-top: 1px solid rgba(17,18,17,.24);
      scrollbar-width: thin;
      scrollbar-color: ${C.ink2} transparent;
    }

    .au-no-results {
      padding-right: 6px;
    }

    .au-result,
    .au-result:nth-child(5n + 2),
    .au-result:nth-child(5n + 4) {
      position: relative;
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 12px;
      width: 100%;
      min-height: 66px;
      padding: 10px 36px 10px 2px;
      text-align: left;
      color: ${C.ink};
      background: transparent;
      border: 0;
      border-bottom: 1px solid rgba(23, 20, 20, .22);
      border-radius: 0;
      box-shadow: none;
      cursor: pointer;
      transition: background .12s ease;
    }

    .au-result::after {
      content: '→';
      position: absolute;
      top: 50%;
      right: 10px;
      transform: translateY(-50%);
      color: ${C.ink};
      font: 20px/1 ${C.body};
    }

    .au-result:active { background: #FFF6D6; }

    /* Mobile logo circle: a touch smaller than the desktop 52px. */
    .au-logo {
      width: 44px;
      height: 44px;
      font-size: 12px;
    }

    .au-result-name {
      color: ${C.ink};
      font-family: ${C.body};
      font-size: clamp(13px, 3.8vw, 15px);
      font-weight: 700;
      line-height: 1.32;
      overflow-wrap: anywhere;
    }

    .au-result-meta {
      color: ${C.ink2};
      font-family: ${C.body};
      font-size: clamp(11px, 3.2vw, 12px);
      font-weight: 400;
      line-height: 1.4;
    }

    .au-result.chosen { background: rgba(184, 240, 199, .35); }
    .au-result.chosen::after { content: '✓'; color: ${C.ink}; font-weight: 700; }

    .au-empty {
      margin: 0;
      padding: 8px 0;
      color: ${C.ink2};
      font-family: ${C.body};
      font-size: 12px;
      font-weight: 400;
      line-height: 1.6;
    }

    /* ---- form controls ---- */
    .au-form { width: 100%; display: flex; flex-direction: column; gap: 14px; }

    .au-cta {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 52px;
      width: 100%;
      padding: 13px 18px;
      color: ${C.ink};
      background: ${C.yellow};
      border: 2px solid ${C.ink};
      border-radius: 12px;
      box-shadow: 4px 4px 0 ${C.ink};
      cursor: pointer;
      font-family: ${C.body};
      font-size: 14px;
      font-weight: 700;
      letter-spacing: -.01em;
      text-align: center;
      transition: transform .08s steps(2), box-shadow .08s steps(2), background .12s ease;
      -webkit-tap-highlight-color: transparent;
    }

    .au-cta:active:not(:disabled) {
      transform: translate(4px, 4px);
      box-shadow: 0 0 0 ${C.ink};
      background: ${C.yellowDeep};
    }

    .au-cta:disabled {
      color: ${C.ink2};
      background: rgba(23, 20, 20, .06);
      border-color: rgba(23, 20, 20, .38);
      box-shadow: 3px 3px 0 rgba(23, 20, 20, .3);
      cursor: not-allowed;
      opacity: 1;
    }

    .au-ghost {
      align-self: flex-start;
      min-height: 42px;
      padding: 9px 0;
      color: ${C.ink2};
      background: transparent;
      border: 0;
      border-bottom: 1px solid ${C.ink2};
      border-radius: 0;
      box-shadow: none;
      cursor: pointer;
      font-family: ${C.body};
      font-size: 13px;
      font-weight: 600;
      transition: color .12s ease;
    }

    .au-ghost:active:not(:disabled) { color: ${C.ink}; }
    .au-ghost:disabled { opacity: .5; cursor: not-allowed; }

    /* ---- OTP boxes ---- */
    .au-otp {
      display: grid;
      grid-template-columns: repeat(6, minmax(0, 1fr));
      justify-content: stretch;
      gap: clamp(5px, 1.7vw, 9px);
      width: 100%;
    }

    .au-box {
      width: 100%;
      min-width: 0;
      max-width: none;
      height: 50px;
      padding: 0;
      text-align: center;
      color: ${C.ink};
      background: rgba(255,252,248,.96);
      border: 2px solid ${C.ink};
      border-radius: 12px;
      box-shadow: 3px 3px 0 ${C.ink};
      font-family: ${C.body};
      font-size: clamp(21px, 6vw, 24px);
      font-weight: 500;
      outline: none;
      caret-color: ${C.ink};
      transition: background .2s cubic-bezier(.32,.72,0,1), box-shadow .2s cubic-bezier(.32,.72,0,1);
    }

    .au-box:focus {
      background: #FFF0F4;
      border-color: ${C.coral};
      box-shadow: 4px 4px 0 ${C.coral};
      transform: none;
    }

    .au-box:disabled:not(.ok) { opacity: .65; }
    .au-box.err { border-color: ${C.red}; animation: au-shake .3s steps(2) 2; }
    .au-box.ok { background: rgba(184, 240, 199, .35); color: ${C.ink}; border-color: ${C.ink}; transform: none; }

    /* ---- notes, banners, misc ---- */
    .au-banner {
      position: relative;
      padding: 5px 0 5px 11px;
      background: transparent;
      border: 0;
      border-left: 3px solid ${C.red};
      border-radius: 0;
      overflow: visible;
    }

    .au-banner p {
      margin: 0;
      color: ${C.ink};
      font-family: ${C.body};
      font-size: 13px;
      font-weight: 500;
      line-height: 1.55;
      overflow-wrap: anywhere;
    }

    .au-strip {
      display: flex;
      align-items: center;
      gap: 9px;
      padding: 6px 0;
      color: ${C.ink};
      background: transparent;
      border: 0;
      border-radius: 0;
      font-family: ${C.body};
      font-size: 14px;
      font-weight: 700;
    }

    .au-field { display: flex; flex-direction: column; gap: 7px; min-width: 0; }
    .au-field label {
      color: ${C.ink2};
      font-family: ${C.body};
      font-size: 12px;
      font-weight: 600;
    }

    .au-revnote {
      margin: 0;
      color: ${C.ink2};
      font-family: ${C.body};
      font-size: 12px;
      line-height: 1.6;
    }

    .au-search:focus-visible,
    .au-input:focus-visible,
    .au-box:focus-visible,
    .au-result:focus-visible,
    .au-cta:focus-visible,
    .au-ghost:focus-visible,
    .au-field input:focus-visible {
      outline: 2px solid ${C.coral};
      outline-offset: 3px;
    }

    /* ---- campus photo scene: the photo is the canvas, the form floats above ---- */
    .au-campus-scene {
      display: block;
      position: fixed;
      inset: 0;
      width: auto;
      z-index: 0;
      overflow: hidden;
      pointer-events: none;
      background: ${C.paper};
      transition: opacity .35s ease;
    }

    /* The photo fills the fixed scene EXACTLY — inset-0 + object-fit: cover.
       The old 100vw / translateX(-50%) build measured wider than the visual
       viewport on Chrome Android, which pushed the picture off-center and
       cropped half of it out of frame. inset-0 always centers, always fits. */
    .au-campus-photo {
      display: block;
      position: absolute;
      z-index: 0;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center 45%;
      filter: saturate(.92) contrast(.98) brightness(.96);
      transition: filter .42s cubic-bezier(.2,.8,.2,1), transform .55s cubic-bezier(.2,.8,.2,1);
      will-change: transform, filter;
    }

    /* College step runs the slower iOS curve so the search-open blur reads as depth. */
    .au-campus-scene-college .au-campus-photo {
      filter: blur(0px) saturate(.92) contrast(.98) brightness(.96);
      transition: filter .6s cubic-bezier(.32,.72,0,1), transform .8s cubic-bezier(.32,.72,0,1);
    }

    .au-campus-scene-college.is-auth-input-open .au-campus-photo {
      filter: blur(10px) saturate(.9) contrast(.98) brightness(.94);
      transform: scale(1.06);
    }

    .au-campus-wash {
      position: absolute;
      z-index: 1;
      inset: 0;
      background: linear-gradient(
        180deg,
        rgba(255,249,244,.06) 0%,
        rgba(255,249,244,.03) 30%,
        rgba(255,249,244,.15) 44%,
        rgba(255,249,244,.62) 58%,
        rgba(255,249,244,.93) 70%,
        ${C.paper} 83%,
        ${C.paper} 100%
      );
      transition: background .55s cubic-bezier(.32,.72,0,1);
    }

    .au-campus-blur {
      display: block;
      position: absolute;
      inset: 0;
      z-index: 2;
      pointer-events: none;
      opacity: 0;
      background: rgba(255,249,244,.5);
      -webkit-backdrop-filter: blur(26px) saturate(1.45);
      backdrop-filter: blur(26px) saturate(1.45);
      transition: opacity .55s cubic-bezier(.32,.72,0,1);
      will-change: opacity;
    }

    .au-backdrop {
      display: block;
      position: fixed;
      inset: 0;
      z-index: 0;
      background: transparent;
      -webkit-tap-highlight-color: transparent;
    }

    /* Keep the active step in normal flow; its measured transform moves the
       headline and inputs together without switching to fixed positioning. */
    .au-root.is-auth-input-open .au-step {
      position: relative;
      z-index: 6;
      flex: 1 1 auto;
      min-height: 0;
      width: 100%;
      max-width: 380px;
      margin: 0 auto;
      padding: 0 0 max(12px, env(safe-area-inset-bottom, 0px));
      gap: 8px;
    }

    .au-root.au-root-college.is-auth-input-open .au-college-heading-row {
      position: relative;
    }

    .au-root.au-root-college.is-auth-input-open .au-search-close {
      position: static;
      align-self: flex-start;
      transform: none;
    }

    .au-root-request .au-step {
      padding-top: 0;
    }

    .au-root-college .au-college-heading-row,
    .au-root-request .au-request-heading-row {
      flex-direction: column;
      align-items: stretch;
      gap: 8px;
    }

    .au-root-college .au-college-heading-row .au-search-close,
    .au-root-request .au-request-back {
      position: static;
      align-self: flex-start;
      transform: none;
    }

    .au-root-college .au-college-heading-row .au-search-close,
    .au-root-request .au-request-back {
      width: 26.4px;
      flex-basis: 26.4px;
    }

    .au-root-college .au-college-heading-row .au-search-close svg,
    .au-root-request .au-request-back svg {
      transform: translateX(-5.5px);
    }

    .au-root-email .au-ghost,
    .au-root-otp .au-ghost {
      color: ${C.ink};
      border-bottom-color: ${C.ink};
      font-weight: 700;
    }

    .au-root.is-auth-input-open .au-step::before {
      opacity: 0;
      -webkit-backdrop-filter: none;
      backdrop-filter: none;
    }

    /* ---- compact screens (order matters: height first, then width) ---- */
    @media (max-height: 760px) {
      .au-brandbar { margin-top: 2px; }
      .au-wordmark { font-size: 36px; }
      .au-brand-whisper { font-size: 10px; }
      .au-step { gap: 8px; }
      .au-input,
      .au-field input { height: 50px; }
    }

    @media (max-width: 360px) {
      .au-panel { padding-left: 18px; padding-right: 18px; }
      .au-box { height: 45px; }
      .au-form { gap: 12px; }
    }

    @media (prefers-reduced-motion: reduce) {
      .au-campus-photo,
      .au-campus-wash,
      .au-campus-blur,
      .au-brandbar,
      .au-step,
      .au-step::before,
      .au-searchwrap,
      .au-search,
      .au-input,
      .au-field input,
      .au-box,
      .au-result,
      .au-cta,
      .au-ghost,
      .au-results { transition: none !important; }
      .au-box.err { animation: none !important; }
    }
  }
`;

/* The scene and polish layers were merged into MOBILE_AUTH_CSS above.
   Kept as empty exports so any other module importing them keeps working —
   delete these two lines if nothing else imports them. */
export const AUTH_SCENE_CSS = '';
export const AUTH_SMOOTH_CSS = '';

const AuthBrand = () => (
  <motion.div
    className="au-brandbar"
    aria-label="huh?"
    layoutId="splash-auth-brand"
    transition={{ layout: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }}
  >
    <motion.span
      className="au-wordmark"
      aria-hidden="true"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
    >
      huh<span className="au-brand-question">?</span>
    </motion.span>
  </motion.div>
);

const AuthArtwork = ({ kind }) => {
  const ink = M.ink;
  const white = M.card;
  const yellow = M.yellow;
  const coral = M.coral;
  const green = M.green;

  const scenes = {
    college: (
      <svg viewBox="0 0 320 150" aria-hidden="true" focusable="false">
        <g className="art-float" stroke={ink} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
          {/* Traditional academic pediment, labelled facade, columns and entrance. */}
          <path d="M54 48 160 13 266 48Z" fill={yellow} />
          <path d="M44 50H276" fill="none" strokeWidth="5" />
          <path d="M62 54H258V119H62Z" fill={white} />
          <path d="M104 58H216V76H104Z" fill={yellow} />
          <text x="160" y="70.5" textAnchor="middle" fill={ink} stroke="none" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="800" letterSpacing="1.3">COLLEGE</text>
          {/* Five straight pillars and a centered entrance make the academic facade clear. */}
          <path d="M77 82H94V111H77ZM111 82H128V111H111ZM145 82H162V111H145ZM179 82H196V111H179ZM213 82H230V111H213Z" fill={green} />
          <path d="M142 91H178V119H142Z" fill={coral} />
          <path d="M49 120H271M39 128H281M30 136H290" fill="none" strokeWidth="3.5" />
          <path d="M244 16V4M244 5L264 11L244 17Z" fill={coral} strokeWidth="2.5" />
        </g>
        <circle cx="38" cy="29" r="5" fill={coral} />
        <path d="M284 34h11M289.5 28.5v11" stroke={ink} strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
    request: (
      <svg viewBox="0 0 320 150" aria-hidden="true" focusable="false">
        <g className="art-float" stroke={ink} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
          <path d="M90 15H202L235 48V127H90Z" fill={white} />
          <path d="M202 15V48H235" fill={yellow} />
          <path d="M111 58H186M111 70H205M111 82H177" fill="none" strokeWidth="3" />
          <path d="M112 105 133 85 154 105V121H112Z" fill={green} />
          <path d="M106 105 133 79 160 105" fill="none" strokeWidth="3" />
          <path d="M126 105V121M139 105V121" fill="none" strokeWidth="2.5" />
          <path d="M178 105h30v22h-30z" fill={coral} />
          <path d="M184 116h18" fill="none" strokeWidth="2.5" />
        </g>
        <circle cx="67" cy="37" r="16" fill={yellow} stroke={ink} strokeWidth="2.5" />
        <path d="M60 37h14M67 30v14" stroke={ink} strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
    email: (
      <svg viewBox="0 0 320 150" aria-hidden="true" focusable="false">
        <g className="art-float" stroke={ink} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
          <path d="M58 42H244V125H58Z" fill={white} />
          <path d="M61 45 151 100 241 45" fill={yellow} />
          <path d="M61 122 119 80M241 122 183 80" fill="none" strokeWidth="2.5" />
          <path d="M204 20h57v45h-57z" fill={green} />
          <path d="M216 34h33M216 44h25M216 54h18" fill="none" strokeWidth="2.5" />
        </g>
        <circle cx="47" cy="29" r="6" fill={coral} />
      </svg>
    ),
    otp: (
      <svg viewBox="0 0 320 150" aria-hidden="true" focusable="false">
        <g className="art-float" stroke={ink} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
          <path d="M66 31H234V118H66Z" fill={white} />
          <path d="M68 34 150 85 232 34" fill={yellow} />
          <path d="M68 115 119 77M232 115 181 77" fill="none" strokeWidth="2.5" />
          <path d="M199 18 222 27V46C222 59 212 67 199 73 186 67 176 59 176 46V27Z" fill={green} />
          <path d="M188 44 196 52 210 36" fill="none" strokeWidth="3.5" />
        </g>
        <circle cx="48" cy="104" r="7" fill={coral} />
        <path d="M257 101h13M263.5 94.5v13" stroke={ink} strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
    verify: (
      <svg viewBox="0 0 320 150" aria-hidden="true" focusable="false">
        <g className="art-float" stroke={ink} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
          {/* Graduation cap is the most direct visual cue for student verification. */}
          <path d="M66 56 160 20 254 56 160 93Z" fill={yellow} />
          <path d="M99 70V97C132 118 188 118 221 97V70L160 95Z" fill={green} />
          <path d="M254 56V91" fill="none" />
          <circle cx="254" cy="96" r="5" fill={coral} />
          <path d="M119 84V102C143 115 177 115 201 102V84" fill={white} />
        </g>
        <path d="M43 34h15M50.5 26.5v15" stroke={ink} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="275" cy="38" r="8" fill={coral} />
      </svg>
    ),
  };

  return <div className="au-art" aria-hidden="true">{scenes[kind]}</div>;
};


/* Mobile campus scene: the photo is the whole canvas, with a wash that
   dissolves its lower edge into the paper color. The form stays live HTML
   above it — never baked into the image. */
const AuthCampusScene = ({
  kind = 'college',
  verified = false,
  inputOpen = false,
  flowExpanded = false,
  portal = false,
  sceneRef,
}) => {
  const scene = (
    <div
      ref={sceneRef}
      className={`au-campus-scene au-campus-scene-${kind}${verified ? ' is-verified' : ''}${inputOpen ? ' is-auth-input-open' : ''}${flowExpanded ? ' is-auth-flow-expanded' : ''}`}
      aria-hidden="true"
    >
      <img className="au-campus-photo" src={campusPhoto} alt="" draggable="false" />
      <div className="au-campus-wash" />
      <div className="au-campus-blur" />
    </div>
  );

  return portal && typeof document !== 'undefined'
    ? createPortal(scene, document.body)
    : scene;
};

const Auth = ({ onSuccess, reverifyOnly = false }) => {
  const reduceMotion = useReducedMotion();
  const [mobileViewport, setMobileViewport] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 1199px)').matches
  );

  // Auth is cream where the splash is near-black, so the browser's status bar
  // and the strip around the app must switch with it or the transition reads as
  // two different apps.
  useChromeColor(C.paper);

  const [step, setStep] = useState(reverifyOnly ? 'otp' : 'college');
  const [requestLayoutActive, setRequestLayoutActive] = useState(false);
  const rootRef = useRef(null);
  const initialAuthStepRef = useRef(true);
  const campusSceneRef = useRef(null);

  useEffect(() => {
    initialAuthStepRef.current = false;
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 1199px)');
    const updateViewportMode = () => setMobileViewport(media.matches);
    media.addEventListener('change', updateViewportMode);
    return () => media.removeEventListener('change', updateViewportMode);
  }, []);
  const [colleges, setColleges] = useState([]);
  const [collegeQuery, setCollegeQuery] = useState('');
  const [collegeSearchOpen, setCollegeSearchOpen] = useState(false);
  const [authInputOpen, setAuthInputOpen] = useState(false);
  const [authFlowExpanded, setAuthFlowExpanded] = useState(false);
  const collegeSearchRef = useRef(null);
  const collegeStepRef = useRef(null);
  const searchTransitionFrameRef = useRef(0);
  const closeAfterResultsExitRef = useRef(false);
  const [college, setCollege] = useState(null);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);
  const [requestDone, setRequestDone] = useState(false);
  const inputRefs = useRef([]);
  const { login, user: authUser } = useAuth();

  const transitionAuthInput = useCallback((open, targetStep = collegeStepRef.current) => {
    const root = rootRef.current;

    if (!root || !targetStep || authInputOpen === open || reduceMotion) {
      setAuthInputOpen(open);
      return Promise.resolve();
    }

    const previousOpen = root.classList.contains('is-auth-input-open');
    const brand = root.querySelector('.au-brandbar');
    const brandRect = brand?.getBoundingClientRect();
    const rootRect = root.getBoundingClientRect();
    if (brandRect) {
      root.style.setProperty('--au-brand-left', `${brandRect.left - rootRect.left}px`);
      root.style.setProperty('--au-brand-top', `${brandRect.top - rootRect.top}px`);
      root.style.setProperty('--au-brand-width', `${brandRect.width}px`);
    }
    const previousTransition = targetStep.style.transition;
    targetStep.style.transition = 'none';
    const startRect = targetStep.getBoundingClientRect();
    root.classList.toggle('is-auth-input-open', open);
    void targetStep.offsetHeight;
    const targetRect = targetStep.getBoundingClientRect();
    root.classList.toggle('is-auth-input-open', previousOpen);

    targetStep.style.setProperty('--au-search-shift', `${startRect.top - targetRect.top}px`);
    void targetStep.offsetHeight;
    targetStep.style.transition = previousTransition;

    const transitionFinished = new Promise((resolve) => {
      let timeoutId;
      const finish = () => {
        if (timeoutId) window.clearTimeout(timeoutId);
        targetStep.removeEventListener('transitionend', onTransitionEnd);
        resolve();
      };
      const onTransitionEnd = (event) => {
        if (event.target === targetStep && event.propertyName === 'translate') finish();
      };
      targetStep.addEventListener('transitionend', onTransitionEnd);
      timeoutId = window.setTimeout(finish, 900);
    });

    cancelAnimationFrame(searchTransitionFrameRef.current);
    setAuthInputOpen(open);
    searchTransitionFrameRef.current = requestAnimationFrame(() => {
      targetStep.style.setProperty('--au-search-shift', '0px');
    });
    return transitionFinished;
  }, [authInputOpen, reduceMotion]);

  const openCollegeSearch = useCallback(() => {
    closeAfterResultsExitRef.current = false;
    setCollegeSearchOpen(true);
    transitionAuthInput(true);
  }, [transitionAuthInput]);

  const closeCollegeSearch = useCallback(() => {
    const waitForResultsExit = collegeSearchOpen && collegeQuery.trim().length > 0;
    closeAfterResultsExitRef.current = waitForResultsExit;
    setCollegeSearchOpen(false);
    collegeSearchRef.current?.blur();
    if (waitForResultsExit) return;

    setCollegeQuery('');
    transitionAuthInput(false);
  }, [collegeSearchOpen, collegeQuery, transitionAuthInput]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const updateCollegeShift = () => {
      const shiftProperty = '--au-college-desktop-shift';
      const currentShift = Number.parseFloat(root.style.getPropertyValue(shiftProperty)) || 0;
      if (
        !window.matchMedia('(min-width: 1200px)').matches
        || step !== 'college'
        || root.classList.contains('is-auth-input-open')
      ) {
        if (!window.matchMedia('(min-width: 1200px)').matches) {
          root.style.removeProperty(shiftProperty);
        }
        return;
      }

      const input = root.querySelector('#college-search');
      if (!input) return;

      const baselineRight = input.getBoundingClientRect().right - currentShift;
      const remainingSpace = Math.max(0, root.getBoundingClientRect().right - baselineRight);
      root.style.setProperty(shiftProperty, `${remainingSpace * 0.4}px`);
    };

    updateCollegeShift();
    window.addEventListener('resize', updateCollegeShift);
    return () => window.removeEventListener('resize', updateCollegeShift);
  }, [step]);

  useEffect(() => {
    if (!closeAfterResultsExitRef.current || collegeQuery.trim()) return;

    closeAfterResultsExitRef.current = false;
    transitionAuthInput(false);
  }, [collegeQuery, transitionAuthInput]);

  const handleAuthInputFocus = (event) => {
    transitionAuthInput(true, event.currentTarget.closest('.au-step'));
  };

  const requestFocusFrameRef = useRef(0);
  const requestFocusTimeoutRef = useRef(0);
  const keepRequestInputVisible = useCallback(() => {
    const root = rootRef.current;
    const visualViewport = window.visualViewport;
    const activeInput = document.activeElement;
    if (
      !root?.classList.contains('au-root-request')
      || !(activeInput instanceof HTMLElement)
      || !root.contains(activeInput)
    ) return;

    const viewportTop = visualViewport?.offsetTop ?? 0;
    const viewportHeight = visualViewport?.height ?? window.innerHeight;
    const visibleTop = viewportTop + 16;
    const visibleBottom = viewportTop + viewportHeight - 16;
    const rect = activeInput.getBoundingClientRect();
    if (rect.bottom > visibleBottom) {
      root.scrollTop += rect.bottom - visibleBottom;
    } else if (rect.top < visibleTop) {
      root.scrollTop += rect.top - visibleTop;
    }
  }, []);

  const handleRequestInputFocus = () => {
    cancelAnimationFrame(requestFocusFrameRef.current);
    window.clearTimeout(requestFocusTimeoutRef.current);
    requestFocusFrameRef.current = requestAnimationFrame(keepRequestInputVisible);
    requestFocusTimeoutRef.current = window.setTimeout(keepRequestInputVisible, 300);
  };

  // Keyboard inset → --au-kb on the root, written straight to the DOM node.
  // The background is outside the scrolling app frame; only the form tracks
  // the keyboard's visible height.
  useEffect(() => {
    const vv = window.visualViewport;
    const root = rootRef.current;
    if (!vv || !root) return undefined;
    const scene = campusSceneRef.current;
    let sceneRect = scene?.getBoundingClientRect();
    let sceneFrozen = false;

    const clearSceneFreeze = () => {
      if (!scene) return;
      ['position', 'inset', 'top', 'left', 'right', 'bottom', 'width', 'height']
        .forEach((property) => scene.style.removeProperty(property));
      sceneFrozen = false;
    };

    const syncKeyboardInset = () => {
      const inset = window.innerHeight - vv.height - vv.offsetTop;
      const kb = inset > 140 ? Math.round(inset) : 0;
      const keyboardOpen = kb > 0 && window.matchMedia('(max-width: 1199px)').matches;
      root.style.setProperty('--au-kb', `${Math.max(0, kb)}px`);

      if (keyboardOpen && scene && sceneRect) {
        scene.style.setProperty('position', 'fixed', 'important');
        scene.style.setProperty('inset', 'auto', 'important');
        scene.style.setProperty('top', `${vv.offsetTop}px`, 'important');
        scene.style.setProperty('left', `${vv.offsetLeft}px`, 'important');
        scene.style.setProperty('right', 'auto', 'important');
        scene.style.setProperty('bottom', 'auto', 'important');
        scene.style.setProperty('width', `${sceneRect.width}px`, 'important');
        scene.style.setProperty('height', `${sceneRect.height}px`, 'important');
        sceneFrozen = true;
      } else if (!keyboardOpen) {
        if (sceneFrozen) clearSceneFreeze();
        if (scene) sceneRect = scene.getBoundingClientRect();
      }

      if (kb > 0 && root.classList.contains('au-root-request')) {
        root.style.setProperty('--au-visible-height', `${Math.round(vv.height)}px`);
        keepRequestInputVisible();
      } else {
        root.style.removeProperty('--au-visible-height');
      }
    };

    syncKeyboardInset();
    vv.addEventListener('resize', syncKeyboardInset);
    vv.addEventListener('scroll', syncKeyboardInset);

    return () => {
      vv.removeEventListener('resize', syncKeyboardInset);
      vv.removeEventListener('scroll', syncKeyboardInset);
      clearSceneFreeze();
      cancelAnimationFrame(requestFocusFrameRef.current);
      window.clearTimeout(requestFocusTimeoutRef.current);
    };
  }, [keepRequestInputVisible]);

  useEffect(() => {
    let resizeTimeoutId;
    const handleResize = () => {
      const root = rootRef.current;
      if (!root) return;

      root.classList.add('is-layout-resizing');
      window.clearTimeout(resizeTimeoutId);
      resizeTimeoutId = window.setTimeout(() => {
        root.classList.remove('is-layout-resizing');
      }, 120);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.clearTimeout(resizeTimeoutId);
      rootRef.current?.classList.remove('is-layout-resizing');
    };
  }, []);

  // Swiping up on the college list dismisses the keyboard (the sheet stays
  // open) so the full list is readable. A one-shot guard keeps the blur
  // from refiring on every move event of the same gesture.
  const listTouchStartY = useRef(null);
  const listSwipeDismissed = useRef(false);

  const handleResultsTouchStart = (e) => {
    listTouchStartY.current = e.touches?.[0]?.clientY ?? null;
    listSwipeDismissed.current = false;
  };

  const handleResultsTouchMove = (e) => {
    if (listSwipeDismissed.current || listTouchStartY.current == null) return;
    const y = e.touches?.[0]?.clientY;
    if (y == null) return;
    if (listTouchStartY.current - y > 14) {
      listSwipeDismissed.current = true;
      collegeSearchRef.current?.blur();
    }
  };

  const [requestForm, setRequestForm] = useState({
    collegeName: '',
    city: '',
    state: '',
    country: '',
    name: '',
    email: '',
  });

  const submitCollegeRequest = async (e) => {
    e.preventDefault();
    if (!requestForm.collegeName.trim() || !requestForm.email.trim()) return;

    setLoading(true);
    setError('');

    try {
      await api.post('/colleges/request', requestForm);
      setRequestDone(true);
      triggerHaptic('success');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not send your request.');
      triggerHaptic('heavy');
    } finally {
      setLoading(false);
    }
  };

  const [collegeLoadState, setCollegeLoadState] = useState('loading');

  const loadColleges = useCallback(async () => {
    setCollegeLoadState((s) => (s === 'ready' ? s : 'loading'));

    try {
      const res = await api.get('/colleges');
      setColleges(res.colleges || []);
      setCollegeLoadState('ready');
    } catch {
      setCollegeLoadState('error');
    }
  }, []);

  useEffect(() => {
    loadColleges();

    const onOnline = () => loadColleges();
    const onVisible = () => {
      if (document.visibilityState === 'visible') loadColleges();
    };

    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [loadColleges]);

  const collegeMatches = (college, rawQuery) => {
    const norm = (s) => String(s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const words = norm(college.name).split(' ').filter(Boolean);
    const stopWords = new Set(['of', 'and', 'the', 'for', 'at', 'a', 'an']);
    const acronym = words
      .filter((w) => !stopWords.has(w))
      .map((w) => w[0])
      .join('');

    const haystack = [
      ...words,
      norm(college.city),
      norm(college.state),
      norm(college.code),
      acronym,
    ].filter(Boolean);

    const terms = rawQuery.split(' ').map(norm).filter(Boolean);

    if (terms.length === 0) return false;
    if (terms.every((t) => stopWords.has(t))) return false;

    return terms.every((q) => haystack.some((h) => h.includes(q) || q.includes(h)));
  };

  const filteredColleges = collegeQuery.trim()
    ? colleges.filter((c) => collegeMatches(c, collegeQuery))
    : colleges;

  // Ink initials fallback for colleges whose logo hasn't been uploaded yet.
  // Once a logo ships on the college object it simply covers this.
  const collegeInitials = (name = '') => {
    const stop = new Set(['of', 'and', 'the', 'for', 'at', 'a', 'an']);
    const words = String(name)
      .replace(/[^A-Za-z\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w && !stop.has(w.toLowerCase()));
    if (words.length === 0) return '??';
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  // One identical search behavior on every breakpoint. Suggestions are
  // intentionally withheld until the user enters a search query.
  const searchActive = collegeSearchOpen;
  const showResults = collegeSearchOpen && collegeQuery.trim().length > 0;

  const pickCollege = (c) => {
    closeAfterResultsExitRef.current = false;
    setCollege(c);
    setCollegeQuery(c.name);
    setCollegeSearchOpen(false);
    setAuthInputOpen(true);
    setAuthFlowExpanded(true);
    setError('');
    collegeSearchRef.current?.blur();
    triggerHaptic('light');
    setStep('email');
  };

  const [suspendedData, setSuspendedData] = useState(() => {
    try {
      const data = JSON.parse(localStorage.getItem('matchalize_suspended'));
      return data?.reason ? data : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (reverifyOnly && step === 'otp' && inputRefs.current[0]) {
      setTimeout(() => inputRefs.current[0].focus(), 150);
    }
  }, [reverifyOnly, step]);

  const reverifyKicked = useRef(false);

  useEffect(() => {
    if (!reverifyOnly || reverifyKicked.current) return;
    reverifyKicked.current = true;

    api.post('/auth/reverify')
      .catch((err) => {
        setError(err.response?.data?.message || 'Could not send your verification code.');
      });
  }, [reverifyOnly]);

  const reverifyCollege = authUser?.college || 'your college';

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email.trim() || !college) return;

    setError('');
    setLoading(true);
    triggerHaptic('medium');

    setCollegeSearchOpen(false);
    if (document.activeElement) document.activeElement.blur();

    try {
      await api.post('/auth/send-otp', {
        email: email.trim(),
        collegeCode: college.code,
      });
      setStep('otp');
    } catch (err) {
      const exactError = err.response?.data?.message
        || err.response?.data?.error
        || err.message;

      setError(exactError?.includes('Network Error')
        ? 'Something went wrong. Check your connection.'
        : exactError || 'Failed to send the code.');

      triggerHaptic('heavy');
    } finally {
      setLoading(false);
    }
  };

  const handleReverifyConfirm = useCallback(async (otpValue) => {
    setLoading(true);
    setError('');

    try {
      await api.post('/auth/reverify/confirm', { otp: otpValue });
      setVerified(true);
      triggerHaptic('heavy');
      setTimeout(() => onSuccess(), 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'That code was not right. Try again.');
      setOtp(['', '', '', '', '', '']);

      if (inputRefs.current[0]) inputRefs.current[0].focus();

      triggerHaptic('heavy');
      setLoading(false);
    }
  }, [onSuccess]);

  const handleVerifyOtp = useCallback(async (otpValue) => {
    if (reverifyOnly) return handleReverifyConfirm(otpValue);

    setError('');
    setLoading(true);

    if (document.activeElement) document.activeElement.blur();

    try {
      const data = await api.post('/auth/verify-otp', {
        email: email.trim(),
        otp: otpValue,
      });

      localStorage.removeItem('matchalize_suspended');
      login(data.user);

      if (socket && socket.disconnected) socket.connect();

      setVerified(true);
      triggerHaptic('heavy');
      setTimeout(() => onSuccess(), 1200);
    } catch (err) {
      const exactError = err.response?.data?.message
        || err.response?.data?.error
        || err.message;

      try {
        const susData = JSON.parse(localStorage.getItem('matchalize_suspended'));

        if (susData?.reason) {
          setLoading(false);
          setSuspendedData(susData);
          return;
        }
      } catch {}

      setError(exactError?.includes('Network Error')
        ? 'Something went wrong. Check your connection.'
        : exactError || 'Invalid code.');

      setOtp(['', '', '', '', '', '']);

      if (inputRefs.current[0]) inputRefs.current[0].focus();

      triggerHaptic('heavy');
      setLoading(false);
    }
  }, [email, onSuccess, login, reverifyOnly, handleReverifyConfirm]);

  const handleOtpChange = (e, index) => {
    if (error) setError('');

    const val = e.target.value;

    if (val.length > 1) {
      const pasted = val.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otp];

      pasted.forEach((char, i) => {
        if (index + i < 6) newOtp[index + i] = char;
      });

      setOtp(newOtp);

      const nextIndex = Math.min(index + pasted.length, 5);
      inputRefs.current[nextIndex]?.focus();

      if (newOtp.every((d) => d !== '')) handleVerifyOtp(newOtp.join(''));
      return;
    }

    if (isNaN(val)) return;

    const newOtp = [...otp.map((v, i) => (i === index ? val : v))];
    setOtp(newOtp);
    triggerHaptic('light');

    if (val && index < 5) inputRefs.current[index + 1]?.focus();
    if (index === 5 && val) handleVerifyOtp(newOtp.join(''));
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const errorBanner = (
    <AnimatePresence>
      {error && (
        <motion.div
          key="au-banner"
          role="alert"
          initial={reduceMotion ? false : { opacity: 0, height: 0, y: -4 }}
          animate={{ opacity: 1, height: 'auto', y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0, y: -4 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          style={{ overflow: 'hidden' }}
        >
          <div className="au-banner">
            <p>{error}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const swapProps = {
    initial: reduceMotion ? false : { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 },
    transition: { duration: reduceMotion ? 0 : .24, ease: [0.22, 1, 0.36, 1] },
  };
  const collegeStepMotionProps = initialAuthStepRef.current
    ? {
      ...swapProps,
      transition: { duration: reduceMotion ? 0 : .44, ease: [0.22, 1, 0.36, 1] },
    }
    : swapProps;

  if (suspendedData) {
    return (
      <AccountSuspendedScreen
        reason={suspendedData.reason}
        suspendedAt={suspendedData.suspendedAt}
        bottomSlot={
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem('matchalize_suspended');
              setSuspendedData(null);
            }}
          >
            Suspension lifted? Try logging in again
          </button>
        }
      />
    );
  }

  if (reverifyOnly) {
    return (
      <div
        ref={rootRef}
        className={`au-root au-root-verify${authInputOpen ? ' is-auth-input-open' : ''}`}
      >
        <style>{AUTH_CSS}{MOBILE_AUTH_CSS}</style>
        <AuthCampusScene
          kind="verify"
          verified={verified}
          inputOpen={authInputOpen}
          portal={mobileViewport}
          sceneRef={campusSceneRef}
        />

        <div className="au-fit">
          <motion.div className="au-panel" {...swapProps}>
            <AuthBrand />
            <div className="au-step">
              <h2 className="au-headline">
                Still you, <span className="au-huh-inline">huh?</span>
              </h2>

              <p className="au-sub">
                We check each year that your <b>{reverifyCollege}</b> email still works.
              </p>

              <AuthArtwork kind="verify" />

              {errorBanner}

              <div className="au-otp" role="group" aria-label="6-digit verification code">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    className={`au-box${error ? ' err' : ''}${verified ? ' ok' : ''}`}
                    type="text"
                    inputMode="numeric"
                    autoComplete={index === 0 ? 'one-time-code' : 'off'}
                    maxLength={6}
                    value={digit}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    onChange={(e) => handleOtpChange(e, index)}
                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                    onFocus={handleAuthInputFocus}
                    disabled={verified || loading}
                    aria-label={`Digit ${index + 1}`}
                  />
                ))}
              </div>

              {verified ? (
                <motion.div className="au-strip" {...swapProps}>
                  <CheckCircle2 size={18} strokeWidth={2.5} /> All set
                </motion.div>
              ) : (
                <button
                  className="au-ghost"
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    triggerHaptic('light');
                    setError('');
                    api.post('/auth/reverify')
                      .catch(() => setError('Could not resend. Try again shortly.'));
                  }}
                >
                  Resend code
                </button>
              )}

              <p className="au-revnote">Your profile and chats are safe.</p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className={`au-root au-root-${step === 'request' && !requestLayoutActive ? 'college' : step}${authInputOpen ? ' is-auth-input-open' : ''}${authFlowExpanded ? ' is-auth-flow-expanded' : ''}`}
    >
      <style>{AUTH_CSS}{MOBILE_AUTH_CSS}</style>
      <AuthCampusScene
        kind={step}
        verified={verified}
        inputOpen={authInputOpen}
        flowExpanded={authFlowExpanded}
        portal={mobileViewport}
        sceneRef={campusSceneRef}
      />

      <div className="au-fit">
        <motion.div className="au-panel" {...swapProps}>
          {searchActive && step === 'college' && (
            <div className="au-backdrop" onClick={closeCollegeSearch} aria-hidden="true" />
          )}
          <AuthBrand />
          <AnimatePresence
            mode="wait"
            onExitComplete={() => {
              if (step === 'request') {
                setRequestLayoutActive(true);
                setAuthInputOpen(false);
              }
            }}
          >
            {step === 'college' ? (
              <motion.section
                key="college"
                ref={collegeStepRef}
                className="au-step"
                {...collegeStepMotionProps}
              >
                <div className="au-college-heading-row">
                  {searchActive && (
                    <button
                      className="au-search-close au-request-back"
                      type="button"
                      onClick={closeCollegeSearch}
                      aria-label="Back to college selection"
                    >
                      <ArrowLeft size={26.4} strokeWidth={2.2} aria-hidden="true" />
                    </button>
                  )}
                  <h2 className="au-headline">
                    So, what&rsquo;s your college, <span className="au-huh-inline">huh?</span>
                  </h2>
                </div>

                <AuthArtwork kind="college" />

                {errorBanner}

                <motion.div
                  className="au-searchwrap"
                  layoutId="splash-auth-search"
                  transition={{ layout: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } }}
                >
                  {collegeQuery.length > 0 ? (
                    <button
                      className="au-searchicon au-search-clear"
                      type="button"
                      aria-label="Clear college search"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        closeAfterResultsExitRef.current = false;
                        setCollegeQuery('');
                        setCollegeSearchOpen(true);
                        collegeSearchRef.current?.focus();
                      }}
                    >
                      <X size={20} strokeWidth={2} aria-hidden="true" />
                    </button>
                  ) : (
                    <span className="au-searchicon">
                      <Search size={20} strokeWidth={1.9} aria-hidden="true" />
                    </span>
                  )}

                  <input
                    id="college-search"
                    ref={collegeSearchRef}
                    className="au-search"
                    type="text"
                    inputMode="text"
                    enterKeyHint="search"
                    autoComplete="off"
                    autoCapitalize="words"
                    autoCorrect="off"
                    spellCheck="false"
                    placeholder="Search your college"
                    value={collegeQuery}
                    onFocus={openCollegeSearch}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape' && collegeSearchOpen) {
                        e.preventDefault();
                        closeCollegeSearch();
                      }
                      if (e.key === 'Enter' && filteredColleges.length === 1) {
                        e.preventDefault();
                        pickCollege(filteredColleges[0]);
                      }
                    }}
                    onChange={(e) => setCollegeQuery(e.target.value)}
                    aria-expanded={showResults}
                    aria-controls="college-suggestions"
                    aria-label="Search your college"
                  />
                </motion.div>

                {collegeLoadState === 'error' && colleges.length === 0 && (
                  <div>
                    <p className="au-empty">Couldn&rsquo;t load the college list. Check your connection.</p>
                    <button className="au-cta" type="button" onClick={loadColleges}>
                      Try again
                    </button>
                  </div>
                )}

                <AnimatePresence
                  onExitComplete={() => {
                    if (!closeAfterResultsExitRef.current) return;
                    setCollegeQuery('');
                  }}
                >
                  {showResults && collegeLoadState !== 'error' && (
                    <motion.div
                      key="results"
                      className="au-results"
                      id="college-suggestions"
                      role="listbox"
                      aria-label="College suggestions"
                      onTouchStart={handleResultsTouchStart}
                      onTouchMove={handleResultsTouchMove}
                      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                    >
                      {filteredColleges.length === 0 ? (
                        <div className="au-no-results">
                          <p className="au-empty">
                            No college matches &ldquo;{collegeQuery.trim()}&rdquo;.
                          </p>

                          {requestDone ? (
                            <div className="au-strip">
                              <CheckCircle2 size={18} strokeWidth={2.5} /> Request received
                            </div>
                          ) : (
                            <button
                              className="au-cta"
                              type="button"
                              onClick={async () => {
                                setRequestForm((f) => ({
                                  ...f,
                                  collegeName: collegeQuery.trim(),
                                  email,
                                }));
                                triggerHaptic('light');
                                closeAfterResultsExitRef.current = false;
                                setRequestLayoutActive(false);
                                setCollegeSearchOpen(false);
                                collegeSearchRef.current?.blur();
                                if (!window.matchMedia('(max-width: 1199px)').matches) {
                                  await transitionAuthInput(false);
                                }
                                setStep('request');
                              }}
                            >
                              Request this college
                            </button>
                          )}
                        </div>
                      ) : (
                        filteredColleges.map((c) => (
                          <button
                            key={c.code}
                            type="button"
                            role="option"
                            aria-selected={college?.code === c.code}
                            className={`au-result${college?.code === c.code ? ' chosen' : ''}`}
                            onClick={() => pickCollege(c)}
                          >
                            <span className="au-logo" aria-hidden="true">
                              {(c.logo || c.logoUrl)
                                ? <img src={c.logo || c.logoUrl} alt="" loading="lazy" />
                                : collegeInitials(c.name)}
                            </span>
                            <span className="au-result-text">
                              <span className="au-result-name">{c.name}</span>
                              {(c.city || c.state) && (
                                <span className="au-result-meta">
                                  {[c.city, c.state].filter(Boolean).join(', ')}
                                </span>
                              )}
                            </span>
                          </button>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

              </motion.section>
            ) : step === 'request' ? (
              <motion.section key="request" className="au-step" {...swapProps}>
                <div className="au-request-heading-row">
                  <button
                    className="au-search-close au-request-back"
                    type="button"
                    onClick={() => {
                      setRequestLayoutActive(false);
                      setStep('college');
                      setError('');
                    }}
                    aria-label="Back to college selection"
                  >
                    <ArrowLeft size={26.4} strokeWidth={2.2} aria-hidden="true" />
                  </button>
                  <h2 className="au-headline">Tell us your campus.</h2>
                </div>

                <p className="au-sub">
                  We add campuses ourselves so only real students get in. You&rsquo;ll hear back once yours is live.
                </p>

                <AuthArtwork kind="request" />

                {requestDone ? (
                  <div className="au-strip">
                    <CheckCircle2 size={18} strokeWidth={2.5} /> Request received
                  </div>
                ) : (
                  <form className="au-form" onSubmit={submitCollegeRequest}>
                    {errorBanner}

                    <div className="au-field">
                      <label htmlFor="rq-name">Full college name</label>
                      <input
                        id="rq-name"
                        value={requestForm.collegeName}
                        onFocus={handleRequestInputFocus}
                        onChange={(e) => setRequestForm((f) => ({ ...f, collegeName: e.target.value }))}
                        placeholder="Indian Institute of Technology Delhi"
                        required
                      />
                    </div>

                    <div className="au-field">
                      <label htmlFor="rq-email">Your college email</label>
                      <input
                        id="rq-email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck="false"
                        value={requestForm.email}
                        onFocus={handleRequestInputFocus}
                        onChange={(e) => setRequestForm((f) => ({ ...f, email: e.target.value }))}
                        placeholder="you@college.ac.in"
                        required
                      />
                    </div>

                    <div className="au-field">
                      <label htmlFor="rq-yourname">Your name (optional)</label>
                      <input
                        id="rq-yourname"
                        value={requestForm.name}
                        onFocus={handleRequestInputFocus}
                        onChange={(e) => setRequestForm((f) => ({ ...f, name: e.target.value }))}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <div className="au-field" style={{ flex: '1 1 180px' }}>
                        <label htmlFor="rq-city">City</label>
                        <input
                          id="rq-city"
                          value={requestForm.city}
                          onFocus={handleRequestInputFocus}
                          onChange={(e) => setRequestForm((f) => ({ ...f, city: e.target.value }))}
                        />
                      </div>

                      <div className="au-field" style={{ flex: '1 1 180px' }}>
                        <label htmlFor="rq-state">State</label>
                        <input
                          id="rq-state"
                          value={requestForm.state}
                          onFocus={handleRequestInputFocus}
                          onChange={(e) => setRequestForm((f) => ({ ...f, state: e.target.value }))}
                        />
                      </div>
                    </div>

                    <button
                      className="au-cta"
                      type="submit"
                      disabled={loading || !requestForm.collegeName.trim() || !requestForm.email.trim()}
                    >
                      {loading ? 'Sending…' : 'Send request'}
                    </button>

                  </form>
                )}
              </motion.section>
            ) : step === 'email' ? (
              <motion.section key="email" className="au-step" {...swapProps}>
                <motion.h2 layoutId="auth-step-headline" className="au-headline">
                  College email, <span className="au-huh-inline">huh?</span> Let&rsquo;s get you verified.
                </motion.h2>

                <p className="au-sub">
                  <b>{college?.name}</b> students use an <b>@{college?.domains?.[0]}</b> address.
                </p>

                <AuthArtwork kind="email" />

                <form className="au-form" onSubmit={handleSendOtp}>
                  {errorBanner}
                  <input
                    id="college-email"
                    className="au-input"
                    type="text"
                    inputMode="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    placeholder="you@iitb.ac.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={handleAuthInputFocus}
                    disabled={loading}
                    aria-label="College email address"
                    required
                  />

                  <button className="au-cta" type="submit" disabled={loading || !email.trim()}>
                    {loading ? 'Sending…' : 'Send my code'}
                  </button>

                  <button
                    className="au-ghost"
                    type="button"
                    onClick={() => {
                      setCollegeSearchOpen(false);
                      setAuthInputOpen(false);
                      setAuthFlowExpanded(false);
                      setStep('college');
                      setError('');
                    }}
                  >
                    Change college
                  </button>
                </form>
              </motion.section>
            ) : (
              <motion.section key="otp" className="au-step" {...swapProps}>
                <motion.h2 layoutId="auth-step-headline" className="au-headline">
                  Your code, <span className="au-huh-inline">huh?</span> Let&rsquo;s get you in.
                </motion.h2>

                <p className="au-sub">
                  Sent to <b className="low">{email.trim()}</b>
                </p>

                <AuthArtwork kind="otp" />

                {errorBanner}

                <div className="au-otp" role="group" aria-label="6-digit verification code">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      className={`au-box${error ? ' err' : ''}${verified ? ' ok' : ''}`}
                      type="text"
                      inputMode="numeric"
                      autoComplete={index === 0 ? 'one-time-code' : 'off'}
                      maxLength={6}
                      value={digit}
                      ref={(el) => { inputRefs.current[index] = el; }}
                      onChange={(e) => handleOtpChange(e, index)}
                      onKeyDown={(e) => handleOtpKeyDown(e, index)}
                      onFocus={handleAuthInputFocus}
                      disabled={verified || loading}
                      aria-label={`Digit ${index + 1}`}
                    />
                  ))}
                </div>

                {verified ? (
                  <motion.div className="au-strip" {...swapProps}>
                    <CheckCircle2 size={18} strokeWidth={2.5} /> Access granted
                  </motion.div>
                ) : (
                  <button
                    className="au-ghost"
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      triggerHaptic('light');
                      setStep('email');
                      setError('');
                      setOtp(['', '', '', '', '', '']);
                    }}
                  >
                    Wrong email? Go back
                  </button>
                )}
              </motion.section>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;