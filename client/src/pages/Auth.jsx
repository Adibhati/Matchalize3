
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { api } from '../utils/api';
import { useChromeColor } from '../utils/chrome';
import socket from '../utils/socket';
import { triggerHaptic } from '../utils/haptics';
import { CheckCircle2, Search } from 'lucide-react';
import AccountSuspendedScreen from '../components/AccountSuspendedScreen';
import { useAuth } from '../utils/AuthContext';

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

const AUTH_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=IBM+Plex+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');

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

  @media (max-width: 700px) {
    .au-panel {
      justify-content: flex-start;
      padding:
        max(28px, env(safe-area-inset-top))
        20px
        max(25px, env(safe-area-inset-bottom));
    }

    .au-step {
      grid-template-columns: minmax(0, 1fr);
      align-content: start;
      gap: 17px;
    }

    .au-step > .au-headline,
    .au-step > .au-sub,
    .au-step > .au-art,
    .au-step > *:not(.au-headline):not(.au-sub):not(.au-art) {
      grid-column: 1;
      grid-row: auto;
    }

    .au-headline {
      font-size: clamp(52px, 12.5vw, 72px);
      line-height: .88;
    }

    .au-headline::after {
      width: 54px;
      height: 6px;
      margin-top: 13px;
    }

    .au-sub {
      font-size: 14px;
      line-height: 1.75;
    }

    .au-art {
      justify-self: end;
      width: min(58%, 270px);
      min-width: 175px;
      height: 125px;
      border-radius: 25px 25px 7px 25px;
    }

    .au-art::before {
      width: 95px;
      height: 95px;
      right: -35px;
      top: -42px;
    }

    .au-search,
    .au-input {
      height: 66px;
      padding: 0 17px;
      font-size: 17px;
    }

    .au-search {
      padding-left: 63px;
    }

    .au-results {
      grid-template-columns: minmax(0, 1fr);
      max-height: 52dvh;
      gap: 9px;
    }

    .au-result {
      min-height: 76px;
      padding: 14px 41px 14px 15px;
      border-radius: 14px;
    }

    .au-result-name {
      font-size: 15px;
    }

    .au-otp {
      gap: 8px;
    }

    .au-box {
      height: 61px;
      font-size: 27px;
      border-radius: 13px;
    }

    .au-form {
      gap: 16px;
    }

    .au-root::before {
      width: 220px;
      height: 220px;
      top: -135px;
      right: -100px;
    }

    .au-root::after {
      width: 180px;
      height: 180px;
      bottom: -130px;
      left: -90px;
    }
  }

  @media (max-width: 360px) {
    .au-panel {
      padding-left: 15px;
      padding-right: 15px;
    }

    .au-headline {
      font-size: 46px;
    }

    .au-art {
      min-width: 155px;
      height: 112px;
    }

    .au-box {
      height: 53px;
      font-size: 23px;
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
`;

const AuthArtwork = ({ kind }) => {
  const { ink, paper, card, amber, coral, sage, concrete } = C;

  const scenes = {
    college: (
      <svg viewBox="0 0 320 200" aria-hidden="true" focusable="false">
        <g className="art-float">
          <path d="M48 80L145 33 242 80V169H48Z" fill={card} stroke={ink} strokeWidth="2" strokeLinejoin="round" />
          <path d="M32 80L145 23 258 80" fill="none" stroke={coral} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M80 96h20v24H80zM135 96h20v24h-20zM190 96h20v24h-20z" fill={sage} />
          <path d="M128 134h34v35h-34z" fill={amber} />
          <path d="M39 172h222" stroke={ink} strokeWidth="4" strokeLinecap="round" />
        </g>
        <g className="art-late">
          <circle cx="247" cy="40" r="27" fill={amber} />
          <circle cx="247" cy="40" r="12" fill={card} />
          <path d="M245 21v-8M265 40h8M247 59v8M227 40h-8" stroke={ink} strokeWidth="2.5" strokeLinecap="round" />
        </g>
        <circle cx="48" cy="39" r="7" fill={sage} />
      </svg>
    ),
    request: (
      <svg viewBox="0 0 320 200" aria-hidden="true" focusable="false">
        <g className="art-float">
          <path d="M63 83L153 34 245 83V169H63Z" fill={card} stroke={ink} strokeWidth="2" strokeLinejoin="round" />
          <path d="M49 83L153 25 259 83" fill="none" stroke={sage} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M93 96h23v27H93zM140 96h23v27h-23zM187 96h23v27h-23z" fill={amber} />
          <path d="M135 139h36v30h-36z" fill={coral} />
          <path d="M50 172h210" stroke={ink} strokeWidth="4" strokeLinecap="round" />
        </g>
        <g className="art-late">
          <path d="M244 25v51" stroke={ink} strokeWidth="3" strokeLinecap="round" />
          <path d="M246 27h36l-9 12 9 12h-36z" fill={coral} stroke={ink} strokeWidth="1.5" strokeLinejoin="round" />
        </g>
        <circle cx="42" cy="37" r="8" fill={amber} />
      </svg>
    ),
    email: (
      <svg viewBox="0 0 320 200" aria-hidden="true" focusable="false">
        <g className="art-float">
          <rect x="49" y="49" width="222" height="123" rx="16" fill={card} stroke={ink} strokeWidth="2" />
          <path d="M54 61l106 76L266 61" fill="none" stroke={coral} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M54 160l71-58M266 160l-71-58" fill="none" stroke={ink} strokeWidth="2" opacity=".3" />
        </g>
        <g className="art-late">
          <rect x="181" y="19" width="67" height="59" rx="12" fill={sage} stroke={ink} strokeWidth="1.5" />
          <path d="M197 38h35M197 48h27M197 58h18" stroke={paper} strokeWidth="3" strokeLinecap="round" />
        </g>
        <circle cx="72" cy="35" r="9" fill={amber} />
      </svg>
    ),
    otp: (
      <svg viewBox="0 0 320 200" aria-hidden="true" focusable="false">
        <g className="art-float">
          <rect x="79" y="27" width="162" height="145" rx="22" fill="#20211F" stroke="rgba(241,237,226,.5)" strokeWidth="1.5" />
          <rect x="101" y="48" width="118" height="31" rx="9" fill={sage} />
          <path d="M116 63h87" stroke={ink} strokeWidth="3" strokeLinecap="round" />
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={96 + i * 34} y="94" width="25" height="31" rx="7" fill={card} />
          ))}
          <rect x="130" y="136" width="60" height="7" rx="3.5" fill={concrete} />
        </g>
        <g className="art-late">
          <circle cx="252" cy="44" r="23" fill={amber} />
          <path d="M241 44l7 7 14-16" fill="none" stroke={ink} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
    ),
    verify: (
      <svg viewBox="0 0 320 200" aria-hidden="true" focusable="false">
        <g className="art-pulse">
          <path d="M160 25L229 50V99c0 39-27 59-69 77-42-18-69-38-69-77V50z" fill={sage} stroke="rgba(241,237,226,.7)" strokeWidth="2" strokeLinejoin="round" />
          <path d="M127 100l22 22 45-48" fill="none" stroke={ink} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        <g className="art-late">
          <circle cx="238" cy="42" r="9" fill={amber} />
          <circle cx="72" cy="145" r="12" fill={coral} />
          <path d="M54 62h29M69 48v28" stroke={paper} strokeWidth="3" strokeLinecap="round" />
        </g>
      </svg>
    ),
  };

  return (
    <div className="au-art" aria-hidden="true">
      {scenes[kind]}
    </div>
  );
};

const Auth = ({ onSuccess, reverifyOnly = false }) => {
  const reduceMotion = useReducedMotion();

  // Auth is cream where the splash is near-black, so the browser's status bar
  // and the strip around the app must switch with it or the transition reads as
  // two different apps.
  useChromeColor(C.paper);

  const [step, setStep] = useState(reverifyOnly ? 'otp' : 'college');
  const [colleges, setColleges] = useState([]);
  const [collegeQuery, setCollegeQuery] = useState('');
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
    window.scrollTo(0, 0);
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

  const swapProps = {
    initial: reduceMotion ? false : { opacity: 0, y: 12, scale: .985, filter: 'blur(2px)' },
    animate: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' },
    exit: reduceMotion
      ? { opacity: 0 }
      : { opacity: 0, y: -8, scale: .99, filter: 'blur(2px)' },
    transition: { duration: .24, ease: [0.22, 1, 0.36, 1] },
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
        <style>{AUTH_CSS}</style>

        <div className="au-fit">
          <motion.div className="au-panel" {...swapProps}>
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
    <div className={`au-root au-root-${step}`}>
      <style>{AUTH_CSS}</style>

      <div className="au-fit">
        <motion.div className="au-panel" {...swapProps}>
          <AnimatePresence mode="wait" initial={false}>
            {step === 'college' ? (
              <motion.section key="college" className="au-step" {...swapProps}>
                <h2 className="au-headline">Enter your college.</h2>

                <AuthArtwork kind="college" />

                {errorBanner}

                <div className="au-searchwrap">
                  <span className="au-searchicon">
                    <Search size={20} strokeWidth={1.9} aria-hidden="true" />
                  </span>

                  <input
                    className="au-search"
                    type="text"
                    inputMode="text"
                    autoComplete="off"
                    autoCapitalize="words"
                    autoCorrect="off"
                    spellCheck="false"
                    placeholder="Search your college"
                    value={collegeQuery}
                    onChange={(e) => setCollegeQuery(e.target.value)}
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

                {collegeQuery.trim() && collegeLoadState !== 'error' && (
                  <div className="au-results">
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
                          className={`au-result${college?.code === c.code ? ' chosen' : ''}`}
                          onClick={() => {
                            setCollege(c);
                            setCollegeQuery(c.name);
                            setError('');
                            triggerHaptic('light');
                            setTimeout(() => setStep('email'), 120);
                          }}
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
                  </div>
                )}

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

                  <input
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
