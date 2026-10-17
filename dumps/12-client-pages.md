# Chunk 12 — Client Pages

> Matchalize · `client-pages` · files 12 of 27 chunks · 1 file(s) · 70 KB · ~20,443 tokens
> Generated 2026-10-17 20:14.
> Paste-safe: within the 100 KB / ~29,257 token target.
>
> Contains:
> - `./client/src/pages/Auth.jsx`

---
### ./client/src/pages/Auth.jsx

```
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { api } from '../utils/api';
import { useChromeColor } from '../utils/chrome';
import socket from '../utils/socket';
import { triggerHaptic } from '../utils/haptics';
import { CheckCircle2, Search } from 'lucide-react';
import AccountSuspendedScreen from '../components/AccountSuspendedScreen';
import { useAuth } from '../utils/AuthContext';
import neu from '../styles/neu';
import { useIsDesktop } from '../utils/useIsDesktop';
import campusPhoto from '../assets/college-town-aesthetic-cute-college-town.jpg';

const M = neu;

const C = {
  ink: '#111211',
  ink2: '#383832',
  muted: '#77766F',
  paper: '#F1EDE2',
  card: '#F8F5EC',
  amber: '#E0A15E',
  coral: '#C96F68',
  sage: '#779477',
  concrete: '#A3A3A1',
  red: '#A84F4A',
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
    --amber: ${C.amber};
    --coral: ${C.coral};
    --sage: ${C.sage};
    --red: ${C.red};
    --accent: var(--coral);
    --tint: rgba(201,111,104,.14);
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

  .au-root::before,
  .au-root::after {
    content: '';
    position: fixed;
    z-index: 0;
    pointer-events: none;
    border-radius: 50%;
  }

  .au-root::before {
    width: min(55vw, 390px);
    height: min(55vw, 390px);
    top: -190px;
    right: -100px;
    background: var(--tint);
    filter: blur(24px);
    transition: background .4s ease;
  }

  .au-root::after {
    width: 260px;
    height: 260px;
    bottom: -190px;
    left: -110px;
    background: rgba(119,148,119,.12);
    filter: blur(20px);
  }

  .au-root ::selection {
    background: var(--accent);
    color: var(--ink);
  }

  .au-root-college {
    --paper: #F1EDE2;
    --ink: #111211;
    --ink2: #383832;
    --muted: #77766F;
    --card: #F8F5EC;
    --accent: #C96F68;
    --tint: rgba(201,111,104,.14);
  }

  .au-root-request {
    --paper: #E1E7D9;
    --ink: #111211;
    --ink2: #383832;
    --muted: #77766F;
    --card: #F8F5EC;
    --accent: #779477;
    --tint: rgba(119,148,119,.18);
  }

  .au-root-email {
    --paper: #F1EDE2;
    --ink: #111211;
    --ink2: #383832;
    --muted: #77766F;
    --card: #F8F5EC;
    --accent: #E0A15E;
    --tint: rgba(224,161,94,.22);
  }

  .au-root-otp,
  .au-root-verify {
    --paper: #111211;
    --ink: #F1EDE2;
    --ink2: #D8D3C8;
    --muted: #A3A3A1;
    --card: #20211F;
    --accent: #779477;
    --tint: rgba(119,148,119,.18);
  }

  .au-fit {
    position: relative;
    z-index: 1;
    width: 100%;
    min-height: 100%;
    display: flex;
    flex-direction: column;
  }

  .au-panel {
    width: 100%;
    min-height: 100vh;
    min-height: 100dvh;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    margin: 0;
    padding:
      max(34px, env(safe-area-inset-top))
      clamp(22px, 6vw, 88px)
      max(30px, env(safe-area-inset-bottom));
    background: transparent;
    border: 0;
    border-radius: 0;
    box-shadow: none;
  }

  .au-step {
    position: relative;
    width: 100%;
    max-width: 1040px;
    min-width: 0;
    margin: 0 auto;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(220px, .72fr);
    align-content: center;
    align-items: center;
    gap: 19px clamp(22px, 4vw, 45px);
  }

  .au-step > .au-headline {
    grid-column: 1;
    margin: 0;
    max-width: 100%;
  }

  .au-step > .au-sub {
    grid-column: 1;
  }

  .au-step > .au-art {
    grid-column: 2;
    grid-row: 1 / span 2;
  }

  .au-step > *:not(.au-headline):not(.au-sub):not(.au-art) {
    grid-column: 1 / -1;
    min-width: 0;
  }

  .au-headline {
    margin: 0;
    max-width: 100%;
    color: var(--ink);
    font-family: var(--display);
    font-size: clamp(55px, 7.4vw, 91px);
    font-weight: 800;
    letter-spacing: -.035em;
    line-height: .87;
    text-transform: uppercase;
    overflow-wrap: anywhere;
    text-wrap: balance;
    transition: color .3s ease;
  }

  .au-headline::after {
    content: '';
    display: block;
    width: 62px;
    height: 7px;
    margin-top: 16px;
    border-radius: 99px;
    background: var(--accent);
    transition: background .3s ease;
  }

  .au-sub {
    margin: 0;
    max-width: 570px;
    color: var(--ink2);
    font-family: var(--body);
    font-size: 15px;
    font-weight: 400;
    line-height: 1.8;
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

  /* Each screen has a little illustration of its own. */
  .au-art {
    position: relative;
    width: 100%;
    min-width: 0;
    height: clamp(190px, 25vw, 280px);
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--tint);
    border: 1px solid rgba(17,18,17,.1);
    border-radius: 30px 30px 9px 30px;
    transition: background .35s ease, border-color .35s ease;
  }

  .au-root-otp .au-art,
  .au-root-verify .au-art {
    border-color: rgba(241,237,226,.12);
  }

  .au-art::before {
    content: '';
    position: absolute;
    width: 120px;
    height: 120px;
    top: -52px;
    right: -42px;
    border: 1px solid var(--accent);
    border-radius: 50%;
    opacity: .5;
  }

  .au-art::after {
    content: '';
    position: absolute;
    bottom: -31px;
    left: -20px;
    width: 66px;
    height: 66px;
    border-radius: 22px;
    background: var(--accent);
    opacity: .17;
    transform: rotate(-16deg);
  }

  .au-art svg {
    position: relative;
    z-index: 1;
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  .au-art .art-float {
    transform-box: fill-box;
    transform-origin: center;
    animation: au-float 4s ease-in-out infinite;
  }

  .au-art .art-late {
    transform-box: fill-box;
    transform-origin: center;
    animation: au-float 4.5s ease-in-out -1.5s infinite;
  }

  .au-art .art-pulse {
    transform-box: fill-box;
    transform-origin: center;
    animation: au-pulse 3.4s ease-in-out infinite;
  }

  @keyframes au-float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-6px); }
  }

  @keyframes au-pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.035); }
  }

  .au-searchwrap {
    width: 100%;
    position: relative;
  }

  .au-searchicon {
    width: 43px;
    height: 43px;
    position: absolute;
    z-index: 1;
    left: 11px;
    top: 50%;
    display: grid;
    place-items: center;
    transform: translateY(-50%);
    color: var(--ink);
    background: var(--tint);
    border-radius: 15px;
    pointer-events: none;
  }

  .au-search,
  .au-input {
    display: block;
    width: 100%;
    min-width: 0;
    height: 68px;
    padding: 0 20px;
    color: var(--ink);
    background: var(--card);
    border: 1.5px solid var(--line, rgba(17,18,17,.16));
    border-radius: 17px;
    outline: none;
    box-shadow: 0 3px 0 rgba(17,18,17,.025);
    font-family: var(--body);
    font-size: 18px;
    font-weight: 500;
    -webkit-appearance: none;
    appearance: none;
    transition: border-color .18s ease, box-shadow .18s ease, background .18s ease;
  }

  .au-search {
    padding-left: 67px;
  }

  .au-search::placeholder,
  .au-input::placeholder {
    color: var(--muted);
    opacity: .85;
    font-weight: 400;
  }

  .au-search:focus,
  .au-input:focus {
    background: var(--card);
    border-color: var(--accent);
    box-shadow: inset 0 0 0 1px var(--accent), 0 0 0 4px var(--tint);
  }

  .au-input:disabled {
    opacity: .6;
  }

  .au-input:-webkit-autofill {
    -webkit-box-shadow: 0 0 0 60px var(--card) inset;
    -webkit-text-fill-color: var(--ink);
  }

  .au-results {
    width: 100%;
    max-height: max(230px, calc(100dvh - 350px));
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    align-content: start;
    gap: 11px;
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
    padding: 3px 4px 8px 2px;
  }

  .au-result {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: 7px;
    min-height: 94px;
    width: 100%;
    padding: 16px 38px 16px 16px;
    text-align: left;
    background: var(--card);
    color: var(--ink);
    border: 1px solid rgba(17,18,17,.1);
    border-radius: 16px;
    cursor: pointer;
    box-shadow: 0 3px 0 rgba(17,18,17,.035);
    transition: background .18s ease, border-color .18s ease, transform .18s ease;
  }

  .au-result:nth-child(5n + 2) {
    background: #E8EBDD;
  }

  .au-result:nth-child(5n + 4) {
    background: #F1DFD5;
  }

  .au-result::after {
    content: '↗';
    position: absolute;
    top: 15px;
    right: 14px;
    color: var(--muted);
    font: 16px var(--body);
    transition: transform .18s ease, color .18s ease;
  }

  .au-result-name {
    color: var(--ink);
    font-family: var(--body);
    font-size: 15px;
    font-weight: 700;
    line-height: 1.45;
    overflow-wrap: anywhere;
  }

  .au-result-meta {
    color: #77766F;
    font-family: var(--mono);
    font-size: 10px;
    font-weight: 500;
    line-height: 1.5;
    letter-spacing: .025em;
    text-transform: uppercase;
  }

  .au-result.chosen {
    background: #E6E8DA;
    border-color: var(--sage);
  }

  .au-result.chosen::after {
    content: '✓';
    color: var(--sage);
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
    min-height: 62px;
    width: 100%;
    padding: 15px 22px;
    color: var(--ink);
    background: var(--accent);
    border: 1px solid rgba(17,18,17,.13);
    border-radius: 17px 17px 6px 17px;
    cursor: pointer;
    box-shadow: 0 4px 0 rgba(17,18,17,.08);
    font-family: var(--body);
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0;
    transition: transform .16s ease, box-shadow .16s ease, background .16s ease;
  }

  .au-cta:active:not(:disabled) {
    transform: translateY(3px);
    box-shadow: 0 1px 0 rgba(17,18,17,.08);
  }

  .au-cta:disabled {
    background: #D6D0C3;
    color: #77766F;
    border-color: #77766F;
    box-shadow: 0 3px 0 rgba(17,18,17,.06);
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
    border: 1.5px solid var(--line, rgba(17,18,17,.16));
    border-radius: 16px;
    font-family: var(--display);
    font-size: 32px;
    font-weight: 800;
    outline: none;
    caret-color: var(--accent);
    transition: background .15s ease, border-color .15s ease, transform .15s ease;
  }

  .au-box:focus {
    background: var(--card);
    border-color: var(--accent);
    box-shadow: inset 0 0 0 1px var(--accent);
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
    background: #E1E9DB;
    color: var(--ink2);
    border-color: var(--sage);
    transform: translateY(-2px);
  }

  @keyframes au-shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-4px); }
    75% { transform: translateX(4px); }
  }

  .au-banner {
    position: relative;
    padding: 14px 16px;
    background: #F0DCD3;
    border: 1px solid rgba(168,79,74,.2);
    border-radius: 14px;
    overflow: hidden;
  }

  .au-banner p {
    margin: 0;
    color: #111211;
    font-family: var(--body);
    font-size: 14px;
    font-weight: 500;
    line-height: 1.65;
  }

  .au-strip {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 16px 18px;
    background: #E1E9DB;
    color: #111211;
    border: 1px solid rgba(119,148,119,.35);
    border-radius: 15px;
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
    height: 60px;
    padding: 0 16px;
    color: var(--ink);
    background: var(--card);
    border: 1.5px solid var(--line, rgba(17,18,17,.16));
    border-radius: 14px;
    outline: none;
    font-family: var(--body);
    font-size: 16px;
    font-weight: 500;
    -webkit-appearance: none;
    appearance: none;
    transition: border-color .15s ease, box-shadow .15s ease;
  }

  .au-field input:focus {
    border-color: var(--accent);
    box-shadow: inset 0 0 0 1px var(--accent), 0 0 0 4px var(--tint);
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
  .au-input:focus-visible,
  .au-box:focus-visible,
  .au-result:focus-visible,
  .au-cta:focus-visible,
  .au-ghost:focus-visible,
  .au-field input:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 3px;
  }

  @media (hover: hover) and (pointer: fine) {
    .au-result:hover:not(:disabled) {
      border-color: rgba(17,18,17,.28);
      transform: translateY(-2px);
    }

    .au-result:hover::after {
      color: var(--coral);
      transform: translate(2px, -2px);
    }

    .au-cta:hover:not(:disabled) {
      filter: brightness(.96);
    }

    .au-ghost:hover:not(:disabled) {
      color: var(--accent);
      border-color: var(--accent);
    }
  }

  @media (min-width: 1100px) {
    .au-results {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      max-height: calc(100dvh - 360px);
    }

    .au-result {
      min-height: 99px;
    }

    .au-art {
      height: 280px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .au-art .art-float,
    .au-art .art-late,
    .au-art .art-pulse {
      animation: none;
    }

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

  /* Mobile-only chrome: hidden on desktop, revealed by MOBILE_AUTH_CSS. */
  .au-brandbar { display: none; }
  .au-campus-scene,
  .au-campus-blur,
  .au-backdrop { display: none; }
  .au-mobile-field-label,
  .au-mobile-sub { display: none; }
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
  @media (max-width: 700px) {
    /* ---- tokens & root ---- */
    .au-root {
      --ink: ${M.ink};
      --ink2: ${M.ink2};
      --muted: ${M.ink2};
      --paper: ${M.paper};
      --card: ${M.card};
      --accent: ${M.yellow};
      --tint: rgba(255,212,61,.14);
      --red: ${M.red};
      --line: ${M.ink};
      --body: ${M.fontBody};
      --display: ${M.fontHeavy};
      --mono: ${M.fontMono};
      background: ${M.paper};
      color: ${M.ink};
      font-family: var(--body);
    }

    /* Desktop per-step palettes are replaced by one uniform skin. */
    .au-root.au-root-college,
    .au-root.au-root-request,
    .au-root.au-root-email,
    .au-root.au-root-otp,
    .au-root.au-root-verify {
      --ink: ${M.ink};
      --ink2: ${M.ink2};
      --muted: ${M.ink2};
      --paper: ${M.paper};
      --card: ${M.card};
      --accent: ${M.yellow};
      --tint: rgba(255,212,61,.14);
      --red: ${M.red};
      --line: ${M.ink};
      background: ${M.paper};
      color: ${M.ink};
    }

    .au-root::before,
    .au-root::after { display: none; content: none; }

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
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
      width: 100%;
      max-width: 380px;
      margin: 7px 0 0;
      min-height: 0;
      transition: opacity .35s ease, transform .5s cubic-bezier(.32,.72,0,1);
    }

    .au-wordmark {
      display: inline-block;
      color: ${M.ink};
      font-family: 'Bowlby One SC', ${M.fontHeavy};
      font-size: clamp(37px, 10vw, 47px);
      font-weight: 400;
      letter-spacing: -.065em;
      line-height: .92;
      text-shadow: 2px 2px 0 ${M.yellow};
    }

    .au-brand-question {
      display: inline-block;
      color: ${M.coral};
      margin-left: .015em;
      transform: rotate(7deg) translateY(-.015em);
      transform-origin: 60% 65%;
    }

    .au-brand-whisper {
      color: ${M.ink2};
      font-family: ${M.fontBody};
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
      color: ${M.ink};
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
      background: linear-gradient(180deg, rgba(241,237,226,0) 0%, rgba(241,237,226,.76) 18%, rgba(241,237,226,.92) 46%, ${M.paper} 100%);
      opacity: .94;
      transition: opacity .4s cubic-bezier(.32,.72,0,1);
    }

    /* The long request form gets extra breathing room at the bottom. */
    .au-panel:has(.au-step .au-form .au-field:nth-of-type(3)) .au-step {
      margin-bottom: max(28px, env(safe-area-inset-bottom, 0px));
    }

    .au-step .au-headline {
      max-width: 21ch;
      margin: 0;
      color: ${M.ink};
      font-family: ${M.fontBody};
      font-size: clamp(30px, 8.3vw, 36px);
      font-weight: 800;
      line-height: 1.04;
      letter-spacing: -.06em;
      text-transform: none;
      overflow-wrap: anywhere;
      text-wrap: balance;
    }

    .au-headline::after { display: none; content: none; }

    .au-headline .au-huh-inline {
      font-family: 'Bowlby One SC', ${M.fontHeavy};
      font-size: 1.02em;
      font-weight: 400;
      letter-spacing: -.055em;
      white-space: nowrap;
      text-shadow: 1.5px 1.5px 0 ${M.yellow};
    }

    .au-step .au-sub {
      max-width: 31ch;
      margin: -2px 0 0;
      color: ${M.ink2};
      font-family: ${M.fontBody};
      font-size: 13.5px;
      font-weight: 400;
      line-height: 1.48;
      overflow-wrap: anywhere;
    }

    .au-sub b { color: ${M.ink}; font-weight: 700; }
    .au-sub b.low { overflow-wrap: anywhere; text-transform: lowercase; }

    .au-mobile-sub { display: block; }

    .au-mobile-field-label {
      display: block;
      margin: 4px 0 -3px;
      color: ${M.ink2};
      font-family: ${M.fontMono};
      font-size: 10px;
      font-weight: 700;
      letter-spacing: .09em;
      text-transform: uppercase;
    }

    /* Mobile replaces the framed illustration with the full-bleed photo. */
    .au-step > .au-art { display: none !important; }

    /* ---- search field ---- */
    .au-searchwrap { position: relative; z-index: 2; width: 100%; }

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
      color: ${M.ink};
      background: transparent;
      pointer-events: none;
    }

    .au-search {
      display: block;
      width: 100%;
      height: 56px;
      padding: 0 14px 0 47px;
      color: ${M.ink};
      background: rgba(255,253,247,.97);
      border: 2px solid ${M.ink};
      border-radius: 15px;
      outline: none;
      box-shadow: 4px 4px 0 ${M.ink};
      font-family: ${M.fontBody};
      font-size: 16px;
      font-weight: 500;
      -webkit-appearance: none;
      appearance: none;
      transition: box-shadow .2s cubic-bezier(.32,.72,0,1), background .2s ease, transform .2s cubic-bezier(.32,.72,0,1);
    }

    .au-search:focus {
      background: #FFFEFA;
      border-color: ${M.ink};
      box-shadow: 4px 4px 0 ${M.ink};
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
      color: ${M.ink};
      background: rgba(255,255,255,.94);
      border: 2px solid ${M.ink};
      border-radius: 12px;
      outline: none;
      box-shadow: 3px 3px 0 ${M.ink};
      font-family: ${M.fontBody};
      font-size: 16px;
      font-weight: 500;
      -webkit-appearance: none;
      appearance: none;
      transition: box-shadow .2s cubic-bezier(.32,.72,0,1), background .2s ease, transform .2s cubic-bezier(.32,.72,0,1);
    }

    .au-search::placeholder,
    .au-input::placeholder,
    .au-field input::placeholder {
      color: ${M.ink2};
      opacity: .8;
      font-weight: 400;
    }

    .au-input:focus,
    .au-field input:focus {
      background: #FFFFFF;
      border-color: ${M.ink};
      box-shadow: 4px 4px 0 ${M.ink};
      transform: none;
    }

    .au-input:disabled,
    .au-field input:disabled { opacity: .65; }

    .au-input:-webkit-autofill,
    .au-field input:-webkit-autofill {
      -webkit-box-shadow: 0 0 0 60px ${M.card} inset, 3px 3px 0 ${M.ink};
      -webkit-text-fill-color: ${M.ink};
    }

    /* ---- results: calm full-width rows, not a grid of cards ---- */
    .au-results {
      display: flex;
      flex-direction: column;
      gap: 0;
      width: 100%;
      max-height: min(30dvh, 250px);
      overflow-y: auto;
      overscroll-behavior: contain;
      -webkit-overflow-scrolling: touch;
      padding: 0;
      border-top: 1px solid rgba(17,18,17,.24);
      scrollbar-width: thin;
      scrollbar-color: ${M.ink2} transparent;
    }

    .au-result,
    .au-result:nth-child(5n + 2),
    .au-result:nth-child(5n + 4) {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: center;
      gap: 3px;
      width: 100%;
      min-height: 52px;
      padding: 9px 34px 9px 2px;
      text-align: left;
      color: ${M.ink};
      background: transparent;
      border: 0;
      border-bottom: 1px solid ${M.hair};
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
      color: ${M.ink};
      font: 20px/1 ${M.fontBody};
    }

    .au-result:active { background: #FFF1AE; }

    .au-result-name {
      color: ${M.ink};
      font-family: ${M.fontBody};
      font-size: 13.5px;
      font-weight: 700;
      line-height: 1.32;
      overflow-wrap: anywhere;
    }

    .au-result-meta {
      color: ${M.ink2};
      font-family: ${M.fontBody};
      font-size: 11px;
      font-weight: 400;
      line-height: 1.4;
    }

    .au-result.chosen { background: #E5F3E7; }
    .au-result.chosen::after { content: '✓'; color: ${M.ink}; font-weight: 700; }

    .au-empty {
      margin: 0;
      padding: 8px 0;
      color: ${M.ink2};
      font-family: ${M.fontBody};
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
      color: ${M.ink};
      background: ${M.yellow};
      border: 2px solid ${M.ink};
      border-radius: 12px;
      box-shadow: 4px 4px 0 ${M.ink};
      cursor: pointer;
      font-family: ${M.fontBody};
      font-size: 14px;
      font-weight: 700;
      letter-spacing: -.01em;
      text-align: center;
      transition: transform .08s steps(2), box-shadow .08s steps(2), background .12s ease;
      -webkit-tap-highlight-color: transparent;
    }

    .au-cta:active:not(:disabled) {
      transform: translate(4px, 4px);
      box-shadow: 0 0 0 ${M.ink};
      background: ${M.yellowDeep};
    }

    .au-cta:disabled {
      color: ${M.ink2};
      background: ${M.hair};
      border-color: ${M.ink2};
      box-shadow: 3px 3px 0 ${M.ink2};
      cursor: not-allowed;
      opacity: 1;
    }

    .au-ghost {
      align-self: flex-start;
      min-height: 42px;
      padding: 9px 0;
      color: ${M.ink2};
      background: transparent;
      border: 0;
      border-bottom: 1px solid ${M.ink2};
      border-radius: 0;
      box-shadow: none;
      cursor: pointer;
      font-family: ${M.fontBody};
      font-size: 13px;
      font-weight: 600;
      transition: color .12s ease;
    }

    .au-ghost:active:not(:disabled) { color: ${M.ink}; }
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
      color: ${M.ink};
      background: rgba(255,255,255,.94);
      border: 2px solid ${M.ink};
      border-radius: 12px;
      box-shadow: 3px 3px 0 ${M.ink};
      font-family: ${M.fontHeavy};
      font-size: 23px;
      font-weight: 400;
      outline: none;
      caret-color: ${M.ink};
      transition: background .2s cubic-bezier(.32,.72,0,1), box-shadow .2s cubic-bezier(.32,.72,0,1);
    }

    .au-box:focus {
      background: #FFF1AE;
      border-color: ${M.ink};
      box-shadow: 3px 3px 0 ${M.ink};
      transform: none;
    }

    .au-box:disabled:not(.ok) { opacity: .65; }
    .au-box.err { border-color: ${M.red}; animation: au-shake .3s steps(2) 2; }
    .au-box.ok { background: #E5F3E7; color: ${M.ink}; border-color: ${M.ink}; transform: none; }

    /* ---- notes, banners, misc ---- */
    .au-banner {
      position: relative;
      padding: 5px 0 5px 11px;
      background: transparent;
      border: 0;
      border-left: 3px solid ${M.red};
      border-radius: 0;
      overflow: visible;
    }

    .au-banner p {
      margin: 0;
      color: ${M.ink};
      font-family: ${M.fontBody};
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
      color: ${M.ink};
      background: transparent;
      border: 0;
      border-radius: 0;
      font-family: ${M.fontBody};
      font-size: 14px;
      font-weight: 700;
    }

    .au-field { display: flex; flex-direction: column; gap: 7px; min-width: 0; }
    .au-field label {
      color: ${M.ink2};
      font-family: ${M.fontBody};
      font-size: 12px;
      font-weight: 600;
    }

    .au-revnote {
      margin: 0;
      color: ${M.ink2};
      font-family: ${M.fontBody};
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
      outline: 2px solid ${M.ink};
      outline-offset: 3px;
    }

    /* ---- campus photo scene: the photo is the canvas, the form floats above ---- */
    .au-campus-scene {
      display: block;
      position: fixed;
      inset: 0;
      z-index: 0;
      overflow: hidden;
      pointer-events: none;
      background: ${M.paper};
      transition: opacity .35s ease;
    }

    .au-campus-photo {
      display: block;
      position: absolute;
      z-index: 0;
      top: 0;
      left: 50%;
      width: 100vw;
      max-width: none;
      height: 100dvh;
      object-fit: cover;
      object-position: center 48%;
      transform: translateX(-50%) scale(1.01);
      filter: saturate(.92) contrast(.98) brightness(.96);
      transition: filter .42s cubic-bezier(.2,.8,.2,1), transform .55s cubic-bezier(.2,.8,.2,1);
      will-change: transform, filter;
    }

    /* College step runs the slower iOS curve so the search-open blur reads as depth. */
    .au-root .au-campus-scene-college .au-campus-photo {
      filter: blur(0px) saturate(.92) contrast(.98) brightness(.96);
      transition: filter .6s cubic-bezier(.32,.72,0,1), transform .8s cubic-bezier(.32,.72,0,1);
    }

    .au-campus-wash {
      position: absolute;
      z-index: 1;
      inset: 0;
      background: linear-gradient(
        180deg,
        rgba(241,237,226,.06) 0%,
        rgba(241,237,226,.03) 30%,
        rgba(241,237,226,.15) 44%,
        rgba(241,237,226,.62) 58%,
        rgba(241,237,226,.93) 70%,
        ${M.paper} 83%,
        ${M.paper} 100%
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
      background: rgba(241,237,226,.5);
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

    /* ---- search-open state ---- */
    .au-root.is-search-open { overflow: hidden; }

    .au-root.is-search-open .au-campus-blur { opacity: 1; }

    .au-root.is-search-open .au-campus-scene-college .au-campus-photo {
      filter: blur(10px) saturate(.9) contrast(.98) brightness(.94);
      transform: translateX(-50%) scale(1.06);
    }

    .au-root.is-search-open .au-brandbar {
      opacity: 0;
      transform: translateY(-10px);
      pointer-events: none;
    }

    .au-root.is-search-open .au-step {
      margin-top: clamp(18px, 7dvh, 64px);
      margin-bottom: 0;
      padding-top: 0;
    }

    .au-root.is-search-open .au-step::before {
      opacity: 0;
      -webkit-backdrop-filter: none;
      backdrop-filter: none;
    }

    .au-root.is-search-open .au-mobile-field-label { margin-top: 2px; }

    .au-root.is-search-open .au-results { max-height: min(28dvh, 230px); }

    /* ---- compact screens (order matters: height first, then width) ---- */
    @media (max-height: 760px) {
      .au-brandbar { margin-top: 2px; }
      .au-wordmark { font-size: 36px; }
      .au-brand-whisper { font-size: 10px; }
      .au-step { gap: 8px; }
      .au-step .au-headline { font-size: 29px; }
      .au-input,
      .au-field input { height: 50px; }
    }

    @media (max-width: 360px) {
      .au-panel { padding-left: 18px; padding-right: 18px; }
      .au-step .au-headline { font-size: 28px; }
      .au-search { font-size: 15px; }
      .au-box { height: 45px; font-size: 21px; }
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
      .au-root.is-search-open .au-campus-scene-college .au-campus-photo {
        filter: blur(10px) saturate(.9) contrast(.98) brightness(.94);
        transform: translateX(-50%);
      }
    }
  }
`;

/* The scene and polish layers were merged into MOBILE_AUTH_CSS above.
   Kept as empty exports so any other module importing them keeps working —
   delete these two lines if nothing else imports them. */
export const AUTH_SCENE_CSS = '';
export const AUTH_SMOOTH_CSS = '';

const AuthBrand = () => (
  <div className="au-brandbar" aria-label="huh?">
    <span className="au-wordmark" aria-hidden="true">
      huh<span className="au-brand-question">?</span>
    </span>
    <span className="au-brand-whisper">campus, chemistry, and a little curiosity.</span>
  </div>
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
const AuthCampusScene = ({ kind = 'college', verified = false }) => (
  <div
    className={`au-campus-scene au-campus-scene-${kind}${verified ? ' is-verified' : ''}`}
    aria-hidden="true"
  >
    <img className="au-campus-photo" src={campusPhoto} alt="" draggable="false" />
    <div className="au-campus-wash" />
    <div className="au-campus-blur" />
  </div>
);

const Auth = ({ onSuccess, reverifyOnly = false }) => {
  const reduceMotion = useReducedMotion();
  const isDesktop = useIsDesktop();

  // Auth is cream where the splash is near-black, so the browser's status bar
  // and the strip around the app must switch with it or the transition reads as
  // two different apps.
  useChromeColor(M.paper);

  const [step, setStep] = useState(reverifyOnly ? 'otp' : 'college');
  const [colleges, setColleges] = useState([]);
  const [collegeQuery, setCollegeQuery] = useState('');
  const [collegeSearchOpen, setCollegeSearchOpen] = useState(false);
  const collegeSearchRef = useRef(null);
  const [college, setCollege] = useState(null);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);
  const [requestDone, setRequestDone] = useState(false);
  const [graduatingYear, setGraduatingYear] = useState('');
  const inputRefs = useRef([]);
  const { login, user: authUser } = useAuth();

  const openCollegeSearch = useCallback(() => {
    if (isDesktop) return;
    setCollegeSearchOpen(true);
  }, [isDesktop]);

  const closeCollegeSearch = useCallback(() => {
    setCollegeSearchOpen(false);
    collegeSearchRef.current?.blur();
  }, []);

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

  // On desktop the results are always inline under the field. On mobile they
  // only exist while the search is open, and only once something is typed — an
  // empty list is noise, not help.
  const showResults = !!collegeQuery.trim() && (isDesktop || collegeSearchOpen);
  const searchActive = collegeSearchOpen && !isDesktop;

  const pickCollege = (c) => {
    setCollege(c);
    setCollegeQuery(c.name);
    setCollegeSearchOpen(false);
    setError('');
    collegeSearchRef.current?.blur();
    triggerHaptic('light');
    setTimeout(() => setStep('email'), 220);
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
    if (step === 'otp' && inputRefs.current[0]) {
      setTimeout(() => inputRefs.current[0].focus(), 150);
    }
  }, [step]);

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

  const handleInputBlur = () => {
    // Desktop keeps its existing reset behavior. On mobile, forcing the page to
    // the top on blur fights keyboard dismissal and causes a visible jump.
    if (!window.matchMedia('(max-width: 700px)').matches) window.scrollTo(0, 0);
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email.trim() || !college) return;

    setError('');
    setLoading(true);
    triggerHaptic('medium');

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

      if (graduatingYear && data.user?._id && !data.user.graduatingYear) {
        api.put('/users/profile', {
          graduatingYear: Number(graduatingYear),
        })
          .then(() => {
            const stored = JSON.parse(localStorage.getItem('matchalize_user') || '{}');
            stored.graduatingYear = Number(graduatingYear);
            localStorage.setItem('matchalize_user', JSON.stringify(stored));
          })
          .catch(() => {});
      }

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
  }, [email, onSuccess, login, reverifyOnly, handleReverifyConfirm, graduatingYear]);

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

  const swapProps = isDesktop ? {
    initial: reduceMotion ? false : { opacity: 0, y: 12, scale: .985, filter: 'blur(2px)' },
    animate: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' },
    exit: reduceMotion
      ? { opacity: 0 }
      : { opacity: 0, y: -8, scale: .99, filter: 'blur(2px)' },
    transition: { duration: .24, ease: [0.22, 1, 0.36, 1] },
  } : {
    initial: reduceMotion ? false : { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    exit: reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 },
    transition: { duration: .18, ease: [0.22, 1, 0.36, 1] },
  };

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
      <div className="au-root au-root-verify">
        <style>{AUTH_CSS}{MOBILE_AUTH_CSS}</style>
        <AuthCampusScene kind="verify" verified={verified} />

        <div className="au-fit">
          <motion.div className="au-panel" {...swapProps}>
            <AuthBrand />
            <div className="au-step">
              <h2 className="au-headline">Confirm you're still a student.</h2>

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
    <div className={`au-root au-root-${step}${step === 'college' && collegeSearchOpen ? ' is-search-open' : ''}`}>
      <style>{AUTH_CSS}{MOBILE_AUTH_CSS}</style>
      <AuthCampusScene kind={step} verified={verified} />

      <div className="au-fit">
        <motion.div className="au-panel" {...swapProps}>
          {searchActive && step === 'college' && (
            <div className="au-backdrop" onClick={closeCollegeSearch} aria-hidden="true" />
          )}
          <AuthBrand />
          <AnimatePresence mode="wait" initial={false}>
            {step === 'college' ? (
              <motion.section
                key="college"
                className="au-step"
                {...swapProps}
                layout={isDesktop ? false : 'position'}
                transition={{
                  ...swapProps.transition,
                  layout: { type: 'spring', stiffness: 300, damping: 34, mass: 0.9 },
                }}
              >
                <h2 className="au-headline">
                  So, what&rsquo;s your college, <span className="au-huh-inline">huh?</span>
                </h2>

                <AnimatePresence mode="wait" initial={false}>
                  <motion.p
                    key={searchActive ? 'typing' : 'idle'}
                    className="au-sub au-mobile-sub"
                    initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.16 }}
                  >
                    {searchActive
                      ? 'Start typing. We’ll bring your campus into view.'
                      : 'Your campus. Your people. Your next good story.'}
                  </motion.p>
                </AnimatePresence>

                <AuthArtwork kind="college" />

                {errorBanner}

                <label className="au-mobile-field-label" htmlFor="college-search">Find your campus</label>
                <div className="au-searchwrap">
                  <span className="au-searchicon">
                    <Search size={20} strokeWidth={1.9} aria-hidden="true" />
                  </span>

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
                </div>

                {collegeLoadState === 'error' && colleges.length === 0 && (
                  <div>
                    <p className="au-empty">Couldn&rsquo;t load the college list. Check your connection.</p>
                    <button className="au-cta" type="button" onClick={loadColleges}>
                      Try again
                    </button>
                  </div>
                )}

                <AnimatePresence>
                  {showResults && collegeLoadState !== 'error' && (
                    <motion.div
                      key="results"
                      className="au-results"
                      id="college-suggestions"
                      role="listbox"
                      aria-label="College suggestions"
                      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                    >
                      {filteredColleges.length === 0 ? (
                        <div style={{ gridColumn: '1 / -1' }}>
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
                              onClick={() => {
                                setRequestForm((f) => ({
                                  ...f,
                                  collegeName: collegeQuery.trim(),
                                  email,
                                }));
                                triggerHaptic('light');
                                setCollegeSearchOpen(false);
                                collegeSearchRef.current?.blur();
                                setStep('request');
                              }}
                            >
                              Request this college
                            </button>
                          )}
                        </div>
                      ) : (
                        filteredColleges.slice(0, 12).map((c) => (
                          <button
                            key={c.code}
                            type="button"
                            role="option"
                            aria-selected={college?.code === c.code}
                            className={`au-result${college?.code === c.code ? ' chosen' : ''}`}
                            onClick={() => pickCollege(c)}
                          >
                            <span className="au-result-name">{c.name}</span>
                            {(c.city || c.state) && (
                              <span className="au-result-meta">
                                {[c.city, c.state].filter(Boolean).join(', ')}
                              </span>
                            )}
                          </button>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {!collegeQuery.trim() && collegeLoadState === 'loading' && colleges.length === 0 && (
                  <p className="au-empty">Loading colleges…</p>
                )}
              </motion.section>
            ) : step === 'request' ? (
              <motion.section key="request" className="au-step" {...swapProps}>
                <h2 className="au-headline">Tell us your campus.</h2>

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
                        onChange={(e) => setRequestForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="Anaya"
                      />
                    </div>

                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <div className="au-field" style={{ flex: '1 1 180px' }}>
                        <label htmlFor="rq-city">City</label>
                        <input
                          id="rq-city"
                          value={requestForm.city}
                          onChange={(e) => setRequestForm((f) => ({ ...f, city: e.target.value }))}
                          placeholder="Delhi"
                        />
                      </div>

                      <div className="au-field" style={{ flex: '1 1 180px' }}>
                        <label htmlFor="rq-state">State</label>
                        <input
                          id="rq-state"
                          value={requestForm.state}
                          onChange={(e) => setRequestForm((f) => ({ ...f, state: e.target.value }))}
                          placeholder="Delhi"
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

                    <button
                      className="au-ghost"
                      type="button"
                      onClick={() => {
                        setStep('college');
                        setError('');
                      }}
                    >
                      Back
                    </button>
                  </form>
                )}
              </motion.section>
            ) : step === 'email' ? (
              <motion.section key="email" className="au-step" {...swapProps}>
                <h2 className="au-headline">Your college email.</h2>

                <p className="au-sub">
                  <b>{college?.name}</b> students use an <b>@{college?.domains?.[0]}</b> address.
                </p>

                <AuthArtwork kind="email" />

                <form className="au-form" onSubmit={handleSendOtp}>
                  {errorBanner}
                  <label className="au-mobile-field-label" htmlFor="college-email">College email</label>
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
                    onBlur={handleInputBlur}
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
                <h2 className="au-headline">Enter the code.</h2>

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

                <div className="au-field">
                  <label htmlFor="grad-year">Graduating year (optional)</label>
                  <input
                    id="grad-year"
                    type="number"
                    inputMode="numeric"
                    min={new Date().getFullYear()}
                    max={new Date().getFullYear() + 10}
                    value={graduatingYear}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setGraduatingYear(v);
                    }}
                    onBlur={handleInputBlur}
                    placeholder={String(new Date().getFullYear() + 3)}
                    disabled={loading}
                  />
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
```

