
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Camera, LogOut, ChevronRight, ChevronLeft, Check, MoreVertical, X } from 'lucide-react';
import { api } from '../utils/api';
import { toast } from '../utils/toast';
import { triggerHaptic } from '../utils/haptics';
import { readLocationOnce, LOCATION_UNAVAILABLE } from '../utils/geolocation';
import { useAuth } from '../utils/AuthContext';
import { useAppConfig } from '../utils/AppConfigContext';
import neu from '../styles/neu';

const T = {
  ...neu,
  ink: '#111211',
  ink2: '#383832',
  ink3: '#77766F',
  paper: '#F1EDE2',
  paper2: '#E8E2D6',
  card: '#F8F5EC',
  yellow: '#E0A15E',
  yellowDeep: '#CB8848',
  orange: '#C96F68',
  green: '#779477',
  red: '#A84F4A',
  concrete: '#A3A3A1',
  fontHeavy: "'Barlow Condensed', sans-serif",
  fontBody: "'Space Grotesk', sans-serif",
  fontMono: "'IBM Plex Mono', monospace",
};

const STEPS = [
  {
    key: 'name',
    title: 'What do your friends call you?',
    hint: 'First name is plenty. Make yourself at home.',
  },
  {
    key: 'dob',
    title: "When's your birthday?",
    hint: 'You need to be 18–40 to join. Only your age is shown.',
    foot: 'Your birthday stays private.',
  },
  {
    key: 'photo',
    title: 'Give them a face to remember.',
    hint: 'Choose a photo that feels like you. You can change it later.',
  },
  {
    key: 'gender',
    title: 'How do you identify?',
    hint: 'Choose what feels right to you.',
  },
  {
    key: 'interestedIn',
    title: 'Who would you like to meet?',
    hint: 'Choose every option that fits.',
  },
  {
    key: 'year',
    title: 'What chapter are you in?',
    hint: 'Undergrad or postgrad?',
  },
  {
    key: 'intent',
    title: 'What are you hoping to find?',
    hint: 'No wrong answers. This helps shape your deck.',
  },
  {
    key: 'location',
    title: "Who's in your orbit?",
    hint: 'Find people nearby, beyond your campus.',
    foot: 'Your location is never shown to other people.',
    optional: true,
  },
];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=IBM+Plex+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');

  .ob-root {
    --page: ${T.paper};
    --main: ${T.ink};
    --sub: ${T.ink2};
    --surface: ${T.card};
    --line: rgba(17,18,17,.13);
    --accent: ${T.orange};
    --tint: rgba(201,111,104,.15);
    --heavy: ${T.fontHeavy};
    --body: ${T.fontBody};
    --mono: ${T.fontMono};

    width: 100%;
    height: 100vh;
    height: 100dvh;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior-y: contain;
    -webkit-overflow-scrolling: touch;
    touch-action: pan-y;
    isolation: isolate;
    position: relative;
    background-color: var(--page);
    color: var(--main);
    font-family: var(--body);
    -webkit-font-smoothing: antialiased;
    transition: background-color .45s ease, color .35s ease;
  }

  .ob-root *,
  .ob-root *::before,
  .ob-root *::after {
    box-sizing: border-box;
    -webkit-tap-highlight-color: transparent;
  }

  .ob-root::before {
    content: '';
    position: fixed;
    z-index: -1;
    pointer-events: none;
    width: min(65vw, 550px);
    aspect-ratio: 1;
    right: -25%;
    top: 2%;
    border-radius: 50%;
    background: var(--tint);
    filter: blur(80px);
    opacity: .8;
    transition: background .45s ease;
  }

  .ob-root ::selection {
    background: var(--accent);
    color: ${T.ink};
  }

  .ob-root-name {
    --page: #111211;
    --main: #F1EDE2;
    --sub: rgba(241,237,226,.76);
    --surface: #20211F;
    --line: rgba(241,237,226,.16);
    --accent: #C96F68;
    --tint: rgba(201,111,104,.15);
  }

  .ob-root-dob {
    --page: #F1EDE2;
    --main: #111211;
    --sub: #5F5E57;
    --surface: #F8F5EC;
    --line: rgba(17,18,17,.13);
    --accent: #E0A15E;
    --tint: rgba(224,161,94,.22);
  }

  .ob-root-photo {
    --page: #E1E7D9;
    --main: #111211;
    --sub: #50574C;
    --surface: #F1EDE2;
    --line: rgba(17,18,17,.13);
    --accent: #779477;
    --tint: rgba(119,148,119,.22);
  }

  .ob-root-gender {
    --page: #F0DCD3;
    --main: #111211;
    --sub: #5F514D;
    --surface: #F8F5EC;
    --line: rgba(17,18,17,.13);
    --accent: #C96F68;
    --tint: rgba(201,111,104,.18);
  }

  .ob-root-interestedin {
    --page: #F1EDE2;
    --main: #111211;
    --sub: #55554E;
    --surface: #F8F5EC;
    --line: rgba(17,18,17,.13);
    --accent: #779477;
    --tint: rgba(119,148,119,.18);
  }

  .ob-root-year {
    --page: #E0A15E;
    --main: #111211;
    --sub: #493728;
    --surface: #F8F5EC;
    --line: rgba(17,18,17,.15);
    --accent: #C96F68;
    --tint: rgba(241,237,226,.25);
  }

  .ob-root-intent {
    --page: #111211;
    --main: #F1EDE2;
    --sub: rgba(241,237,226,.76);
    --surface: #20211F;
    --line: rgba(241,237,226,.16);
    --accent: #779477;
    --tint: rgba(119,148,119,.17);
  }

  .ob-root-location {
    --page: #E1E7D9;
    --main: #111211;
    --sub: #50574C;
    --surface: #F8F5EC;
    --line: rgba(17,18,17,.13);
    --accent: #779477;
    --tint: rgba(119,148,119,.2);
  }

  .ob-head {
    position: sticky;
    top: 0;
    z-index: 50;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding:
      max(12px, env(safe-area-inset-top))
      clamp(17px, 4vw, 36px)
      12px;
    background: var(--page);
    border-bottom: 1px solid var(--line);
    transition: background-color .4s ease, border-color .4s ease;
  }

  .ob-headspacer {
    width: 44px;
    height: 44px;
    flex-shrink: 0;
  }

  .ob-hbtn {
    width: 46px;
    height: 46px;
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--main);
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 16px;
    box-shadow: 0 3px 0 rgba(17,18,17,.05);
    transition: transform .16s ease, background .16s ease;
  }

  .ob-hbtn:active {
    transform: scale(.93);
    background: var(--tint);
  }

  .ob-scrim {
    position: fixed;
    inset: 0;
    z-index: 90;
  }

  .ob-menu {
    position: absolute;
    top: calc(100% + 10px);
    right: 0;
    z-index: 100;
    min-width: 180px;
    padding: 6px;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 16px;
    box-shadow: 0 12px 32px rgba(17,18,17,.13);
    overflow: hidden;
    transform-origin: top right;
  }

  .ob-menuitem {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    min-height: 46px;
    padding: 12px;
    background: transparent;
    border: 0;
    cursor: pointer;
    text-align: left;
    border-radius: 11px;
    font-family: var(--body);
    font-size: 14px;
    font-weight: 600;
    color: ${T.red};
    transition: background .15s ease;
  }

  .ob-menuitem:active {
    background: rgba(168,79,74,.1);
  }

  .ob-fit {
    width: 100%;
    max-width: 1040px;
    min-height: calc(100dvh - 70px);
    flex: 1 0 auto;
    margin: 0 auto;
    padding:
      clamp(30px, 6vh, 68px)
      clamp(22px, 5vw, 58px)
      0;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    gap: clamp(20px, 3vh, 32px);
  }

  .ob-screen {
    --screen-accent: var(--accent);
    width: 100%;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(200px, .78fr);
    grid-template-areas:
      "title art"
      "hint art"
      "field field";
    column-gap: clamp(24px, 4vw, 48px);
    row-gap: 19px;
    align-items: center;
    align-content: center;
    isolation: isolate;
  }

  .ob-screen-photo {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas:
      "title"
      "hint"
      "field";
  }

  .ob-title {
    grid-area: title;
    width: fit-content;
    max-width: 100%;
    margin: 0;
    color: var(--main);
    font-family: var(--heavy);
    font-size: clamp(56px, 7.2vw, 92px);
    font-weight: 800;
    line-height: .86;
    letter-spacing: -.035em;
    text-transform: uppercase;
    overflow-wrap: anywhere;
    text-wrap: balance;
    transition: color .3s ease;
  }

  .ob-title::after {
    content: '';
    display: block;
    width: clamp(55px, 8vw, 82px);
    height: 7px;
    margin-top: 17px;
    border-radius: 999px;
    background: var(--screen-accent);
    transition: background-color .3s ease;
  }

  .ob-hint {
    grid-area: hint;
    align-self: start;
    max-width: 480px;
    margin: 0;
    color: var(--sub);
    font-family: var(--body);
    font-size: 15px;
    font-weight: 400;
    line-height: 1.8;
    transition: color .3s ease;
  }

  .ob-art {
    grid-area: art;
    position: relative;
    align-self: center;
    justify-self: stretch;
    width: 100%;
    min-width: 0;
    aspect-ratio: 1.32 / 1;
    max-height: 300px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--tint);
    border: 1px solid var(--line);
    border-radius: 34px 34px 12px 34px;
    transition: background .35s ease, border-color .35s ease;
  }

  .ob-art::before {
    content: '';
    position: absolute;
    width: 125px;
    height: 125px;
    right: -47px;
    top: -54px;
    border: 1px solid var(--screen-accent);
    border-radius: 50%;
    opacity: .4;
    pointer-events: none;
  }

  .ob-art::after {
    content: '';
    position: absolute;
    width: 70px;
    height: 70px;
    bottom: -35px;
    left: -22px;
    background: var(--screen-accent);
    border-radius: 24px;
    opacity: .13;
    transform: rotate(-18deg);
    pointer-events: none;
  }

  .ob-art svg {
    position: relative;
    z-index: 1;
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  .ob-art .art-float {
    transform-box: fill-box;
    transform-origin: center;
    animation: ob-float 4s ease-in-out infinite;
  }

  .ob-art .art-float-late {
    transform-box: fill-box;
    transform-origin: center;
    animation: ob-float 4.7s ease-in-out -1.7s infinite;
  }

  .ob-art .art-pulse {
    transform-box: fill-box;
    transform-origin: center;
    animation: ob-pulse 3.5s ease-in-out infinite;
  }

  @keyframes ob-float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-6px); }
  }

  @keyframes ob-pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.035); }
  }

  .ob-field {
    grid-area: field;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 17px;
    width: 100%;
    min-width: 0;
    padding-top: 5px;
  }

  .ob-input {
    display: block;
    width: 100%;
    min-width: 0;
    height: 74px;
    padding: 0 22px;
    background: var(--surface);
    color: var(--main);
    border: 1.5px solid var(--line);
    border-radius: 18px;
    font-family: var(--body);
    font-size: 21px;
    font-weight: 500;
    outline: none;
    -webkit-appearance: none;
    appearance: none;
    transition: border-color .18s ease, box-shadow .18s ease, background .18s ease;
  }

  .ob-input::placeholder {
    color: var(--ink3);
    font-weight: 400;
  }

  .ob-root-name .ob-input::placeholder,
  .ob-root-intent .ob-input::placeholder {
    color: rgba(241,237,226,.48);
  }

  .ob-input:focus,
  .ob-input:focus-visible {
    outline: none;
    box-shadow: inset 0 0 0 2px var(--screen-accent);
  }

  .ob-dob {
    height: 70px;
    padding: 0 6px;
    text-align: center;
    font-family: var(--mono);
    font-size: clamp(17px, 2.4vw, 23px);
    font-weight: 600;
  }

  .ob-slash {
    color: var(--sub);
    font-family: var(--mono);
    font-size: 20px;
    font-weight: 400;
    flex-shrink: 0;
  }

  .ob-age {
    align-self: flex-start;
    padding: 10px 15px;
    color: ${T.red};
    background: #F0DCD3;
    border: 1px solid rgba(168,79,74,.2);
    border-radius: 13px;
    font-family: var(--mono);
    font-size: 13px;
    font-weight: 600;
  }

  .ob-age.ok {
    color: #405B40;
    background: #E3E9DC;
    border-color: rgba(119,148,119,.35);
  }

  .ob-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 13px;
  }

  .ob-chip {
    min-height: 66px;
    padding: 17px 25px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 11px;
    background: var(--surface);
    color: var(--main);
    border: 1.5px solid var(--line);
    border-radius: 16px;
    cursor: pointer;
    font-family: var(--body);
    font-size: 18px;
    font-weight: 600;
    box-shadow: 0 3px 0 rgba(17,18,17,.035);
    transition: background .18s ease, border-color .18s ease, color .18s ease, transform .18s ease;
  }

  .ob-chip:nth-child(3n + 2) {
    border-radius: 23px 15px 21px 15px;
  }

  .ob-chip.on {
    background: var(--screen-accent);
    color: ${T.ink};
    border-color: transparent;
    box-shadow: 0 3px 0 rgba(17,18,17,.09);
  }

  .ob-chip:active:not(:disabled) {
    transform: scale(.96);
  }

  .ob-chip:disabled {
    opacity: .4;
    cursor: not-allowed;
  }

  .ob-photo {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: min(100%, 480px);
    aspect-ratio: 4 / 5;
    max-height: 555px;
    min-height: 0;
    padding: 0;
    overflow: hidden;
    cursor: pointer;
    background:
      radial-gradient(circle at 20% 20%, rgba(224,161,94,.2), transparent 34%),
      radial-gradient(circle at 85% 80%, rgba(119,148,119,.23), transparent 35%),
      var(--surface);
    border: 1.5px dashed var(--line);
    border-radius: 25px;
    transition: border-color .16s ease, background .16s ease;
  }

  .ob-photo.filled {
    border-style: solid;
    cursor: default;
    background: var(--surface);
  }

  .ob-photo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .ob-photoempty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 17px;
    padding: 20px;
    color: var(--sub);
    font-family: var(--body);
    font-size: 16px;
    font-weight: 600;
    text-align: center;
  }

  .ob-cam {
    width: 82px;
    height: 82px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--screen-accent);
    border: 1px solid var(--line);
    border-radius: 24px 24px 24px 9px;
    color: ${T.ink};
    transform: rotate(-4deg);
    box-shadow: 0 5px 0 rgba(17,18,17,.06);
  }

  .ob-photohit {
    position: absolute;
    inset: 0;
    z-index: 1;
    background: transparent;
    border: none;
    padding: 0;
    margin: 0;
    cursor: pointer;
    appearance: none;
  }

  .ob-photox {
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 3;
    width: 46px;
    height: 46px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(248,245,236,.96);
    color: ${T.ink};
    border: 1px solid rgba(17,18,17,.12);
    border-radius: 14px;
    cursor: pointer;
    transition: transform .15s ease, background .15s ease;
  }

  .ob-photox:active {
    transform: scale(.92);
    background: #F0DCD3;
    color: ${T.red};
  }

  .ob-uploading {
    position: absolute;
    left: 50%;
    bottom: 16px;
    z-index: 3;
    transform: translateX(-50%);
    display: inline-flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
    padding: 11px 16px;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 14px;
    box-shadow: 0 5px 16px rgba(17,18,17,.1);
    font-family: var(--body);
    font-size: 13px;
    font-weight: 600;
    color: ${T.ink};
  }

  .ob-spin {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 2px solid var(--screen-accent);
    border-top-color: transparent;
    animation: obspin .7s linear infinite;
  }

  @keyframes obspin {
    to { transform: rotate(360deg); }
  }

  .ob-location {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 14px;
    max-width: 560px;
  }

  .ob-location-copy {
    margin: 0;
    color: var(--sub);
    font-family: var(--body);
    font-size: 15px;
    line-height: 1.8;
  }

  .ob-location-ok {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin: 0;
    color: var(--main);
    font-family: var(--body);
    font-size: 15px;
    font-weight: 600;
    line-height: 1.7;
  }

  .ob-location-ok svg {
    flex-shrink: 0;
    margin-top: 4px;
    color: ${T.green};
  }

  .ob-loc-btn {
    width: 100%;
    min-height: 59px;
    padding: 14px 20px;
    background: var(--screen-accent);
    color: ${T.ink};
    border: 1px solid var(--line);
    border-radius: 17px;
    cursor: pointer;
    font-family: var(--body);
    font-size: 15px;
    font-weight: 700;
    box-shadow: 0 3px 0 rgba(17,18,17,.07);
    transition: transform .15s ease, filter .15s ease;
  }

  .ob-loc-btn:active:not(:disabled) {
    transform: translateY(2px);
  }

  .ob-loc-btn:disabled,
  .ob-loc-alt:disabled {
    opacity: .55;
    cursor: default;
  }

  .ob-loc-alt {
    width: 100%;
    min-height: 56px;
    padding: 13px 20px;
    background: var(--surface);
    color: var(--main);
    border: 1px solid var(--line);
    border-radius: 16px;
    cursor: pointer;
    font-family: var(--body);
    font-size: 14px;
    font-weight: 600;
    transition: background .15s ease, border-color .15s ease;
  }

  .ob-loc-alt:active {
    background: var(--tint);
  }

  .ob-loc-note {
    margin: 0;
    color: var(--sub);
    font-family: var(--body);
    font-size: 13px;
    line-height: 1.7;
  }

  .ob-actions {
    position: static;
    inset: auto;
    width: 100%;
    margin: 10px 0 0;
    padding: 0 0 max(24px, env(safe-area-inset-bottom));
    background: transparent;
    transition: background .35s ease;
  }

  .ob-cta {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 11px;
    width: 100%;
    min-height: 68px;
    padding: 16px 22px;
    background: var(--accent);
    color: ${T.ink};
    border: 1px solid rgba(17,18,17,.13);
    border-radius: 18px 18px 7px 18px;
    cursor: pointer;
    font-family: var(--body);
    font-size: 17px;
    font-weight: 700;
    box-shadow: 0 4px 0 rgba(17,18,17,.09);
    transition: transform .16s ease, box-shadow .16s ease, opacity .16s ease, background .3s ease;
  }

  .ob-cta:active:not(:disabled) {
    transform: translateY(3px);
    box-shadow: 0 1px 0 rgba(17,18,17,.09);
  }

  .ob-cta:disabled {
    opacity: .42;
    cursor: default;
  }

  .ob-cta svg {
    transition: transform .18s ease;
  }

  .ob-foot {
    margin: 12px 0 0;
    color: var(--sub);
    text-align: center;
    font-family: var(--body);
    font-size: 12px;
    font-weight: 400;
    line-height: 1.65;
    opacity: .9;
  }

  .ob-banner {
    padding: 14px 16px;
    background: #F0DCD3;
    border: 1px solid rgba(168,79,74,.2);
    border-radius: 14px;
  }

  .ob-banner p {
    margin: 0;
    color: ${T.ink};
    font-family: var(--body);
    font-size: 14px;
    font-weight: 500;
    line-height: 1.6;
  }

  .ob-root input,
  .ob-root textarea,
  .ob-root select {
    -webkit-user-select: auto;
    user-select: auto;
  }

  .ob-root img {
    pointer-events: none;
  }

  .ob-chip:focus-visible,
  .ob-cta:focus-visible,
  .ob-photo:focus-visible,
  .ob-photohit:focus-visible,
  .ob-photox:focus-visible,
  .ob-hbtn:focus-visible,
  .ob-menuitem:focus-visible,
  .ob-loc-btn:focus-visible,
  .ob-loc-alt:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 3px;
  }

  @media (hover: hover) and (pointer: fine) {
    .ob-hbtn:hover {
      background: var(--tint);
    }

    .ob-menuitem:hover {
      background: rgba(168,79,74,.08);
    }

    .ob-chip:hover:not(:disabled):not(.on) {
      background: var(--tint);
      border-color: var(--accent);
      transform: translateY(-2px);
    }

    .ob-chip.on:hover {
      filter: brightness(.97);
    }

    .ob-cta:hover:not(:disabled) {
      filter: brightness(.96);
    }

    .ob-cta:hover:not(:disabled) svg {
      transform: translateX(4px);
    }

    .ob-photo:hover:not(.filled) {
      border-color: var(--accent);
    }

    .ob-loc-btn:hover:not(:disabled) {
      filter: brightness(.96);
    }

    .ob-loc-alt:hover:not(:disabled) {
      background: var(--tint);
      border-color: var(--accent);
    }
  }

  @media (min-width: 681px) {
    .ob-fit {
      justify-content: center;
    }
  }

  @media (min-width: 1050px) {
    .ob-fit {
      padding-top: 42px;
      padding-bottom: 24px;
    }

    .ob-screen {
      column-gap: 54px;
      row-gap: 20px;
    }

    .ob-art {
      max-height: 320px;
    }
  }

  @media (max-width: 680px) {
    .ob-head {
      padding-left: 17px;
      padding-right: 17px;
    }

    .ob-fit {
      min-height: calc(100dvh - 70px);
      flex: 0 0 auto;
      padding: 32px 21px max(25px, env(safe-area-inset-bottom));
      gap: 18px;
      justify-content: flex-start;
    }

    .ob-screen {
      grid-template-columns: minmax(0, 1fr);
      grid-template-areas:
        "title"
        "hint"
        "art"
        "field";
      row-gap: 14px;
      align-content: start;
    }

    .ob-screen-photo {
      grid-template-areas:
        "title"
        "hint"
        "field";
    }

    .ob-title {
      font-size: clamp(52px, 12.8vw, 76px);
      line-height: .88;
    }

    .ob-title::after {
      width: 54px;
      height: 6px;
      margin-top: 13px;
    }

    .ob-hint {
      font-size: 14px;
      line-height: 1.7;
    }

    .ob-art {
      justify-self: end;
      width: min(58%, 270px);
      min-width: 175px;
      max-height: 148px;
      aspect-ratio: 1.65 / 1;
      border-radius: 26px 26px 8px 26px;
    }

    .ob-art::before {
      width: 95px;
      height: 95px;
      right: -35px;
      top: -42px;
    }

    .ob-field {
      gap: 14px;
      padding-top: 3px;
    }

    .ob-input {
      height: 70px;
      padding: 0 18px;
      font-size: 20px;
      border-radius: 15px;
    }

    .ob-dob {
      height: 65px;
      padding: 0 4px;
      font-size: clamp(16px, 4.8vw, 22px);
    }

    .ob-chips {
      gap: 10px;
    }

    .ob-chip {
      min-height: 60px;
      padding: 15px 19px;
      border-radius: 14px;
      font-size: 16px;
    }

    .ob-photo {
      width: 100%;
      aspect-ratio: 4 / 5;
      max-height: 46.5dvh;
      min-height: min(285px, 46.5dvh);
      border-radius: 21px;
    }

    .ob-photoempty {
      font-size: 15px;
    }

    .ob-cam {
      width: 74px;
      height: 74px;
    }

    .ob-actions {
      margin: 8px 0 0;
      padding: 0 0 max(25px, env(safe-area-inset-bottom));
    }

    .ob-cta {
      min-height: 64px;
      border-radius: 16px 16px 6px 16px;
      font-size: 16px;
    }

    .ob-foot {
      font-size: 11px;
    }

    .ob-root::before {
      width: 85vw;
      right: -35%;
      top: 10%;
      filter: blur(65px);
    }
  }

  @media (max-width: 390px) {
    .ob-fit {
      padding-left: 17px;
      padding-right: 17px;
    }

    .ob-title {
      font-size: clamp(48px, 12.3vw, 58px);
    }

    .ob-art {
      min-width: 160px;
      max-height: 132px;
    }

    .ob-chip {
      padding-left: 13px;
      padding-right: 13px;
      font-size: 14px;
    }

  }

  @media (max-height: 700px) and (max-width: 680px) {
    .ob-fit {
      padding-top: 21px;
    }

    .ob-screen {
      row-gap: 11px;
    }

    .ob-title {
      font-size: clamp(43px, 10vw, 58px);
    }

    .ob-title::after {
      margin-top: 9px;
      height: 5px;
    }

    .ob-art {
      max-height: 105px;
      min-width: 140px;
    }

    .ob-photo {
      min-height: 220px;
      max-height: 46.5dvh;
    }

    .ob-input {
      height: 70px;
    }

    .ob-chip {
      min-height: 60px;
    }

    .ob-actions {
      position: static;
      padding-top: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .ob-root *,
    .ob-root *::before,
    .ob-root *::after {
      transition: none !important;
      animation: none !important;
    }
  }
`;

const StepArtwork = ({ step }) => {
  const { ink, paper, card, yellow, orange, green, concrete } = T;

  switch (step) {
    case 'name':
      return (
        <svg viewBox="0 0 320 200" aria-hidden="true" focusable="false">
          <g className="art-float">
            <rect x="61" y="31" width="188" height="132" rx="22" fill={paper} transform="rotate(-5 155 97)" />
            <rect x="85" y="57" width="102" height="11" rx="5.5" fill={ink} />
            <rect x="85" y="79" width="135" height="7" rx="3.5" fill={concrete} />
            <rect x="85" y="94" width="111" height="7" rx="3.5" fill={concrete} opacity=".7" />
            <rect x="85" y="117" width="58" height="24" rx="8" fill={orange} />
            <path d="M160 128h46" stroke={yellow} strokeWidth="5" strokeLinecap="round" />
          </g>
          <g className="art-float-late">
            <circle cx="238" cy="39" r="21" fill={yellow} />
            <path d="M230 39l6 6 11-13" fill="none" stroke={ink} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          </g>
          <circle cx="52" cy="157" r="7" fill={orange} />
          <circle cx="266" cy="151" r="5" fill={green} />
        </svg>
      );

    case 'dob':
      return (
        <svg viewBox="0 0 320 200" aria-hidden="true" focusable="false">
          <g className="art-float">
            <rect x="64" y="26" width="190" height="144" rx="20" fill={card} stroke={ink} strokeWidth="2" transform="rotate(4 159 98)" />
            <path d="M64 48a22 22 0 0 1 22-22h146a22 22 0 0 1 22 22v20H64z" fill={yellow} />
            <path d="M106 19v22M212 19v22" stroke={ink} strokeWidth="5" strokeLinecap="round" />
            <g fill={concrete} opacity=".7">
              <rect x="87" y="82" width="25" height="21" rx="6" />
              <rect x="124" y="82" width="25" height="21" rx="6" />
              <rect x="161" y="82" width="25" height="21" rx="6" />
              <rect x="198" y="82" width="25" height="21" rx="6" />
              <rect x="87" y="115" width="25" height="21" rx="6" />
              <rect x="124" y="115" width="25" height="21" rx="6" />
              <rect x="198" y="115" width="25" height="21" rx="6" />
            </g>
            <rect x="161" y="115" width="25" height="21" rx="6" fill={orange} />
          </g>
          <circle cx="258" cy="43" r="18" fill={green} />
          <path d="M249 43l6 6 11-13" fill="none" stroke={ink} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M46 141l8-14 8 14z" fill={orange} />
        </svg>
      );

    case 'photo':
      return null;

    case 'gender':
      return (
        <svg viewBox="0 0 320 200" aria-hidden="true" focusable="false">
          <g className="art-pulse">
            <circle cx="160" cy="100" r="67" fill="none" stroke={ink} strokeWidth="1.5" opacity=".25" />
            <circle cx="160" cy="100" r="49" fill="none" stroke={orange} strokeWidth="2" />
            <circle cx="160" cy="100" r="31" fill={yellow} />
            <circle cx="160" cy="100" r="12" fill={ink} />
          </g>
          <g className="art-float">
            <circle cx="83" cy="61" r="21" fill={green} />
            <circle cx="241" cy="62" r="16" fill={orange} />
            <circle cx="83" cy="144" r="14" fill={yellow} />
            <circle cx="244" cy="145" r="23" fill={green} />
          </g>
          <path d="M100 70l28 17M224 73l-27 16M103 136l31-22M221 136l-26-22" stroke={ink} strokeWidth="1.5" strokeLinecap="round" opacity=".45" />
        </svg>
      );

    case 'interestedIn':
      return (
        <svg viewBox="0 0 320 200" aria-hidden="true" focusable="false">
          <g className="art-float-late" transform="rotate(-8 94 104)">
            <rect x="41" y="40" width="93" height="126" rx="20" fill={yellow} />
            <circle cx="87" cy="81" r="19" fill={ink} />
            <path d="M58 135q29-54 58 0v10H58z" fill={paper} />
          </g>
          <g className="art-float" transform="rotate(5 160 101)">
            <rect x="113" y="27" width="96" height="145" rx="21" fill={card} stroke={ink} strokeWidth="1.5" />
            <circle cx="161" cy="76" r="20" fill={orange} />
            <path d="M128 128q33-46 66 0v17h-66z" fill={green} />
            <rect x="139" y="151" width="44" height="5" rx="2.5" fill={concrete} />
          </g>
          <g className="art-float-late" transform="rotate(10 242 112)">
            <rect x="211" y="53" width="67" height="111" rx="17" fill={green} />
            <circle cx="245" cy="86" r="13" fill={paper} />
            <path d="M220 131q25-37 50 0v8h-50z" fill={yellow} />
          </g>
          <circle cx="46" cy="27" r="6" fill={orange} />
          <circle cx="271" cy="28" r="7" fill={yellow} />
        </svg>
      );

    case 'year':
      return (
        <svg viewBox="0 0 320 200" aria-hidden="true" focusable="false">
          <g className="art-float">
            <path d="M53 139h69v28H53z" fill={green} stroke={ink} strokeWidth="1.5" />
            <path d="M68 109h69v30H68z" fill={card} stroke={ink} strokeWidth="1.5" />
            <path d="M84 80h69v29H84z" fill={orange} stroke={ink} strokeWidth="1.5" />
            <path d="M99 53h69v27H99z" fill={ink} stroke={ink} strokeWidth="1.5" />
            <path d="M109 62h47" stroke={paper} strokeWidth="3" strokeLinecap="round" />
            <path d="M78 119h48M63 149h49" stroke={ink} strokeWidth="2" strokeLinecap="round" opacity=".5" />
          </g>
          <g className="art-float-late">
            <path d="M188 65l52-23 52 23-52 24z" fill={card} stroke={ink} strokeWidth="2" strokeLinejoin="round" />
            <path d="M208 76v38q32 20 64 0V76" fill={yellow} stroke={ink} strokeWidth="2" strokeLinejoin="round" />
            <path d="M292 66v43" stroke={ink} strokeWidth="2" strokeLinecap="round" />
            <circle cx="292" cy="115" r="5" fill={orange} stroke={ink} strokeWidth="1.5" />
          </g>
          <circle cx="197" cy="141" r="8" fill={orange} />
        </svg>
      );

    case 'intent':
      return (
        <svg viewBox="0 0 320 200" aria-hidden="true" focusable="false">
          <g className="art-pulse">
            <circle cx="151" cy="101" r="69" fill="none" stroke={paper} strokeWidth="1.5" opacity=".27" />
            <circle cx="151" cy="101" r="52" fill="none" stroke={green} strokeWidth="3" />
            <circle cx="151" cy="101" r="34" fill="none" stroke={yellow} strokeWidth="3" />
            <circle cx="151" cy="101" r="14" fill={orange} />
          </g>
          <g className="art-float">
            <path d="M177 75l61-34-31 63-9-21z" fill={yellow} stroke={paper} strokeWidth="2" strokeLinejoin="round" />
            <path d="M207 83l-31 30" stroke={paper} strokeWidth="4" strokeLinecap="round" />
          </g>
          <circle cx="67" cy="50" r="8" fill={orange} />
          <circle cx="254" cy="145" r="13" fill={green} />
          <path d="M50 153h46" stroke={paper} strokeWidth="3" strokeLinecap="round" opacity=".55" />
        </svg>
      );

    case 'location':
      return (
        <svg viewBox="0 0 320 200" aria-hidden="true" focusable="false">
          <g className="art-float">
            <path d="M44 52l62-17 51 17 60-17 58 17v102l-58 17-60-17-51 17-62-17z" fill={card} stroke={ink} strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M106 35v119M157 52v102M217 35v119M44 86h231M44 121h231" stroke={green} strokeWidth="1.4" opacity=".7" />
            <path d="M45 87h61l51 34h60l58-35" fill="none" stroke={orange} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </g>
          <g className="art-pulse">
            <path d="M158 45c-19 0-34 15-34 34 0 26 34 60 34 60s34-34 34-60c0-19-15-34-34-34z" fill={orange} stroke={ink} strokeWidth="2" />
            <circle cx="158" cy="79" r="12" fill={card} stroke={ink} strokeWidth="2" />
          </g>
          <circle cx="248" cy="31" r="9" fill={yellow} />
          <circle cx="75" cy="169" r="6" fill={green} />
        </svg>
      );

    default:
      return null;
  }
};

const useScreenVariants = (reduceMotion) => ({
  screen: {
    enter: (direction) => reduceMotion
      ? { opacity: 1, x: 0, scale: 1 }
      : { opacity: 0, x: direction * 65, scale: .97, filter: 'blur(3px)' },
    center: {
      opacity: 1,
      x: 0,
      scale: 1,
      filter: 'blur(0px)',
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 29,
        staggerChildren: .055,
        delayChildren: .025,
      },
    },
    exit: (direction) => reduceMotion
      ? { opacity: 0, transition: { duration: .12 } }
      : {
          opacity: 0,
          x: direction * -48,
          scale: .985,
          filter: 'blur(2px)',
          transition: { duration: .18, ease: 'easeIn' },
        },
  },
  item: {
    enter: () => reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 },
    center: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 400, damping: 30 },
    },
  },
});

const MAX_DIM = 1280;
const JPEG_QUALITY = 0.85;
const SKIP_BELOW = 400 * 1024;

const compressImage = (file) =>
  new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('not an image'));
      return;
    }

    if (file.size < SKIP_BELOW) {
      resolve(file);
      return;
    }

    const src = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(src);

      try {
        const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');

        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);

        canvas.toBlob((blob) => {
          if (!blob) {
            resolve(file);
            return;
          }

          resolve(
            blob.size < file.size
              ? new File([blob], 'photo.jpg', { type: 'image/jpeg' })
              : file,
          );
        }, 'image/jpeg', JPEG_QUALITY);
      } catch {
        resolve(file);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(src);
      resolve(file);
    };

    img.src = src;
  });

const Onboarding = ({ onComplete }) => {
  const reduceMotion = useReducedMotion();
  const config = useAppConfig();
  const { logout, login } = useAuth();
  const fileRef = useRef(null);
  const rootRef = useRef(null);
  const previewRef = useRef(null);
  const V = useScreenVariants(reduceMotion);

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [preview, setPreview] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    gender: '',
    year: '',
    intent: [],
    interestedIn: [],
    photos: [],
    prompts: [],
    interests: [],
    currentLatLng: undefined,
  });

  const resumeDraft = useCallback(async () => {
    try {
      const res = await api.get('/users/onboarding/resume');
      if (!res?.data || !Object.keys(res.data).length) return;

      const saved = res.data;

      setFormData((prev) => ({
        ...prev,
        ...saved,
        name: prev.name || saved.name || '',
        gender: prev.gender || saved.gender || '',
        year: prev.year || saved.year || '',
        dob: prev.dob || saved.dob || '',
        photos: prev.photos?.length ? prev.photos : (Array.isArray(saved.photos) ? saved.photos : prev.photos),
        intent: prev.intent?.length ? prev.intent : (Array.isArray(saved.intent) ? saved.intent : prev.intent),
        interestedIn: prev.interestedIn?.length ? prev.interestedIn : (Array.isArray(saved.interestedIn) ? saved.interestedIn : prev.interestedIn),
        interests: prev.interests?.length ? prev.interests : (Array.isArray(saved.interests) ? saved.interests : prev.interests),
        prompts: prev.prompts?.length ? prev.prompts : (Array.isArray(saved.prompts) ? saved.prompts : prev.prompts),
      }));

      const idx = Number(saved.__step);
      if (Number.isFinite(idx) && idx >= 0 && idx < STEPS.length) setStep(idx);
    } catch {
      // Draft unavailable — the next online/visible event retries.
    }
  }, []);

  useEffect(() => {
    resumeDraft();

    const onOnline = () => resumeDraft();
    const onVisible = () => {
      if (document.visibilityState === 'visible') resumeDraft();
    };

    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [resumeDraft]);

  useEffect(() => {
    const { name, gender, dob } = formData;
    if (!name && !gender && !dob) return undefined;

    const t = setTimeout(() => {
      api.put('/users/onboarding/save', {
        step: step + 1,
        data: { ...formData, __step: step },
      }).catch(() => {});
    }, 800);

    return () => clearTimeout(t);
  }, [formData, step]);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const update = (patch) => setFormData((f) => ({ ...f, ...patch }));

  const toggleIn = (field, item, max = null) => {
    setFormData((f) => {
      const arr = f[field] || [];
      const on = arr.includes(item);

      if (on) return { ...f, [field]: arr.filter((i) => i !== item) };

      if (max && arr.length >= max) {
        triggerHaptic('heavy');
        return f;
      }

      const next = field === 'interestedIn'
        ? ['Everyone']
        : (item === 'Everyone' ? [] : arr.filter((i) => i !== 'Everyone'));

      return { ...f, [field]: [...next, item] };
    });

    triggerHaptic('light');
  };

  const dobParts = (formData.dob || '--').split('-');
  const dobY = dobParts[0] === '--' ? '' : dobParts[0];
  const dobM = dobParts[1] === '--' ? '' : dobParts[1];
  const dobD = dobParts[2] === '--' ? '' : dobParts[2];

  const dayRef = useRef(null);
  const monRef = useRef(null);
  const yrRef = useRef(null);

  const age = (() => {
    if (dobY.length !== 4 || dobM.length !== 2 || dobD.length !== 2) return null;

    const today = new Date();
    const birth = new Date(`${dobY}-${dobM}-${dobD}`);

    if (Number.isNaN(birth.getTime())) return null;

    let a = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();

    return (m < 0 || (m === 0 && today.getDate() < birth.getDate())) ? a - 1 : a;
  })();

  const setDob = (part, raw) => {
    const num = raw.replace(/\D/g, '');
    let d = dobD;
    let m = dobM;
    let y = dobY;

    if (part === 'd') {
      d = num.slice(0, 2);
      if (d.length === 2) {
        if (+d > 31) d = '31';
        if (+d === 0) d = '01';
        monRef.current?.focus();
      }
    }

    if (part === 'm') {
      m = num.slice(0, 2);
      if (m.length === 2) {
        if (+m > 12) m = '12';
        if (+m === 0) m = '01';
        yrRef.current?.focus();
      }
    }

    if (part === 'y') y = num.slice(0, 4);

    update({ dob: `${y}-${m}-${d}` });
  };

  const clearPreview = () => {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
    }

    setPreview(null);
  };

  useEffect(() => () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
  }, []);

  const pickPhoto = () => {
    triggerHaptic('light');
    fileRef.current?.click();
  };

  const removePhoto = () => {
    triggerHaptic('light');
    clearPreview();
    update({ photos: [] });
  };

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;

    setUploading(true);
    setError('');
    triggerHaptic('medium');

    const localUrl = URL.createObjectURL(f);
    previewRef.current = localUrl;
    setPreview(localUrl);

    try {
      const toUpload = await compressImage(f);
      const { url } = await api.upload(toUpload);
      update({ photos: [url] });
      triggerHaptic('success');
    } catch {
      toast.error('Upload failed. Check your connection, or try a smaller image.');
      triggerHaptic('heavy');
    } finally {
      setUploading(false);
      clearPreview();
    }
  };

  const [locBusy, setLocBusy] = useState(false);
  const [locationReading, setLocationReading] = useState(false);
  const [locError, setLocError] = useState('');
  const [locDeclined, setLocDeclined] = useState(false);

  const done = {
    name: !!formData.name.trim(),
    dob: age !== null && age >= 18 && age <= 40,
    photo: !!formData.photos[0],
    gender: !!formData.gender,
    interestedIn: formData.interestedIn.length > 0,
    year: !!formData.year,
    intent: formData.intent.length > 0,
    location: locationReading || locDeclined,
  };

  const stepDone = (i) => done[STEPS[i].key];
  const allDone = STEPS.every((st) => done[st.key]);

  const grantLocation = useCallback(async () => {
    if (locBusy) return;

    setLocBusy(true);
    setLocError('');

    const res = await readLocationOnce();
    setLocBusy(false);

    if (res.ok) {
      setFormData((f) => ({ ...f, currentLatLng: res.latLng }));
      setLocationReading(true);
      return;
    }

    setLocError(
      res.reason === LOCATION_UNAVAILABLE.DENIED
        ? 'Location permission was declined.'
        : res.reason === LOCATION_UNAVAILABLE.INSECURE
          ? 'Location needs a secure (https) connection.'
          : "We couldn't get a location reading.",
    );
  }, [locBusy]);

  const publish = async () => {
    if (!allDone || uploading || publishing) {
      triggerHaptic('heavy');
      return;
    }

    setPublishing(true);
    setError('');
    triggerHaptic('heavy');

    try {
      const res = await api.post('/users/setup', {
        ...formData,
        age,
        prompts: (formData.prompts || []).slice(0, 3),
      });

      await api.delete('/users/onboarding/clear').catch(() => {});

      const stored = JSON.parse(localStorage.getItem('matchalize_user') || '{}');
      const updated = res?.user || res?.data?.user || res || {
        ...stored,
        isSetup: true,
        isOnboarded: true,
        profileCompleted: true,
        onboardingCompleted: true,
      };

      login(updated);
      onComplete();
    } catch (err) {
      if (!err?.toasted) {
        toast.error('Could not publish your profile. Check your connection and try again.');
      }
      setPublishing(false);
    }
  };

  const scrollToTop = () => {
    rootRef.current?.scrollTo({
      top: 0,
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  };

  const next = () => {
    if (!stepDone(step)) {
      triggerHaptic('heavy');
      return;
    }

    triggerHaptic('light');
    setError('');
    setDir(1);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    scrollToTop();
  };

  const back = () => {
    triggerHaptic('light');
    setError('');
    setDir(-1);
    setStep((s) => Math.max(0, s - 1));
    scrollToTop();
  };

  const s = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const genders = config?.genders || ['Male', 'Female', 'Non-binary', 'Other'];
  const showOptions = [...genders, 'Everyone'];
  const intentOptions = config?.intents || [];

  const banner = (
    <AnimatePresence>
      {error && (
        <motion.div
          key="b"
          role="alert"
          initial={reduceMotion ? false : { opacity: 0, height: 0, y: -4 }}
          animate={{ opacity: 1, height: 'auto', y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0, y: -4 }}
          transition={{ duration: .2 }}
          style={{ overflow: 'hidden' }}
        >
          <div className="ob-banner">
            <p>{error}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className={`ob-root ob-root-${s.key.toLowerCase()}`} ref={rootRef}>
      <style>{CSS}</style>

      <header className="ob-head">
        {step > 0 ? (
          <button
            type="button"
            className="ob-hbtn"
            aria-label="Previous question"
            onClick={back}
          >
            <ChevronLeft size={22} strokeWidth={2.4} />
          </button>
        ) : (
          <span className="ob-headspacer" />
        )}

        <div style={{ position: 'relative' }}>
          <button
            type="button"
            className="ob-hbtn"
            aria-label="More options"
            aria-expanded={menuOpen}
            onClick={() => {
              triggerHaptic('light');
              setMenuOpen((v) => !v);
            }}
          >
            <MoreVertical size={20} strokeWidth={2.4} />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <>
                <div
                  className="ob-scrim"
                  onClick={() => setMenuOpen(false)}
                  aria-hidden="true"
                />

                <motion.div
                  className="ob-menu"
                  initial={reduceMotion ? false : { opacity: 0, scale: .94, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: .94, y: -6 }}
                  transition={{ duration: .13, ease: 'easeOut' }}
                >
                  <button
                    type="button"
                    className="ob-menuitem"
                    onClick={() => {
                      if (window.confirm('Log out? Your progress is saved as a draft.')) {
                        triggerHaptic('medium');
                        logout();
                      }
                    }}
                  >
                    <LogOut size={16} strokeWidth={2.4} />
                    Log out
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </header>

      <div className="ob-fit">
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.div
            key={s.key}
            className={`ob-screen ob-screen-${s.key.toLowerCase()}`}
            custom={dir}
            variants={V.screen}
            initial="enter"
            animate="center"
            exit="exit"
          >
            <motion.h1 className="ob-title" variants={V.item}>
              {s.title}
            </motion.h1>

            {s.hint && (
              <motion.p className="ob-hint" variants={V.item}>
                {s.hint}
              </motion.p>
            )}

            {s.key !== 'photo' && (
              <motion.div className="ob-art" variants={V.item}>
                <StepArtwork step={s.key} />
              </motion.div>
            )}

            <motion.div className="ob-field" variants={V.item}>
              {s.key === 'name' && (
                <input
                  className="ob-input"
                  value={formData.name}
                  onChange={(e) => update({ name: e.target.value.slice(0, 60) })}
                  placeholder="Your name"
                  autoCapitalize="words"
                  autoCorrect="off"
                  spellCheck="false"
                  autoComplete="given-name"
                  aria-label="Your name"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') next();
                  }}
                />
              )}

              {s.key === 'dob' && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <input
                      ref={dayRef}
                      className="ob-input ob-dob"
                      style={{ flex: 1, minWidth: 0 }}
                      value={dobD}
                      onChange={(e) => setDob('d', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !dobD) return;
                        if (e.key === 'Enter' && age) next();
                      }}
                      placeholder="DD"
                      inputMode="numeric"
                      maxLength={2}
                      aria-label="Day"
                    />

                    <span className="ob-slash" aria-hidden="true">/</span>

                    <input
                      ref={monRef}
                      className="ob-input ob-dob"
                      style={{ flex: 1, minWidth: 0 }}
                      value={dobM}
                      onChange={(e) => setDob('m', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !dobM) dayRef.current?.focus();
                        if (e.key === 'Enter' && age) next();
                      }}
                      placeholder="MM"
                      inputMode="numeric"
                      maxLength={2}
                      aria-label="Month"
                    />

                    <span className="ob-slash" aria-hidden="true">/</span>

                    <input
                      ref={yrRef}
                      className="ob-input ob-dob"
                      style={{ flex: 1, minWidth: 0 }}
                      value={dobY}
                      onChange={(e) => setDob('y', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !dobY) monRef.current?.focus();
                        if (e.key === 'Enter' && age) next();
                      }}
                      placeholder="YYYY"
                      inputMode="numeric"
                      maxLength={4}
                      aria-label="Year"
                    />
                  </div>

                  {age !== null && (
                    <span className={`ob-age${age >= 18 && age <= 40 ? ' ok' : ''}`}>
                      Age {age}
                    </span>
                  )}
                </>
              )}

              {s.key === 'photo' && (
                <>
                  {(formData.photos[0] || preview) ? (
                    <div className="ob-photo filled">
                      <img src={formData.photos[0] || preview} alt="Your photo" />

                      {uploading && (
                        <span className="ob-uploading">
                          <span className="ob-spin" aria-hidden="true" />
                          Uploading…
                        </span>
                      )}

                      {!uploading && (
                        <>
                          <button
                            type="button"
                            className="ob-photohit"
                            onClick={pickPhoto}
                            aria-label="Change your photo"
                          />

                          <button
                            type="button"
                            className="ob-photox"
                            onClick={removePhoto}
                            aria-label="Remove photo"
                          >
                            <X size={18} strokeWidth={2.4} />
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="ob-photo"
                      onClick={pickPhoto}
                      disabled={uploading}
                      aria-label="Add your photo"
                    >
                      <span className="ob-photoempty">
                        <span className="ob-cam">
                          <Camera size={29} strokeWidth={1.9} />
                        </span>
                        Tap to choose your photo
                      </span>
                    </button>
                  )}

                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={onFile}
                    style={{ display: 'none' }}
                  />
                </>
              )}

              {s.key === 'gender' && (
                <div className="ob-chips">
                  {genders.map((g) => (
                    <button
                      key={g}
                      type="button"
                      className={`ob-chip${formData.gender === g ? ' on' : ''}`}
                      aria-pressed={formData.gender === g}
                      onClick={() => {
                        update({ gender: g });
                        triggerHaptic('light');
                      }}
                    >
                      {formData.gender === g && <Check size={17} strokeWidth={2.5} />}
                      {g}
                    </button>
                  ))}
                </div>
              )}

              {s.key === 'interestedIn' && (
                <div className="ob-chips">
                  {showOptions.map((g) => (
                    <button
                      key={g}
                      type="button"
                      className={`ob-chip${formData.interestedIn.includes(g) ? ' on' : ''}`}
                      aria-pressed={formData.interestedIn.includes(g)}
                      onClick={() => toggleIn('interestedIn', g)}
                    >
                      {formData.interestedIn.includes(g) && (
                        <Check size={17} strokeWidth={2.5} />
                      )}
                      {g}
                    </button>
                  ))}
                </div>
              )}

              {s.key === 'year' && (
                <div className="ob-chips">
                  {(config?.years || ['UG', 'PG']).map((y) => (
                    <button
                      key={y}
                      type="button"
                      className={`ob-chip${formData.year === y ? ' on' : ''}`}
                      aria-pressed={formData.year === y}
                      onClick={() => {
                        update({ year: y });
                        triggerHaptic('light');
                      }}
                    >
                      {formData.year === y && <Check size={17} strokeWidth={2.5} />}
                      {y}
                    </button>
                  ))}
                </div>
              )}

              {s.key === 'intent' && (
                <div className="ob-chips">
                  {intentOptions.map((it) => (
                    <button
                      key={it}
                      type="button"
                      className={`ob-chip${formData.intent.includes(it) ? ' on' : ''}`}
                      aria-pressed={formData.intent.includes(it)}
                      onClick={() => toggleIn('intent', it)}
                    >
                      {formData.intent.includes(it) && (
                        <Check size={17} strokeWidth={2.5} />
                      )}
                      {it}
                    </button>
                  ))}
                </div>
              )}

              {s.key === 'location' && (
                <div className="ob-location">
                  {locationReading ? (
                    <p className="ob-location-ok">
                      <Check size={17} strokeWidth={2.5} />
                      <span>
                        Location shared. We'll show you people near you first.
                      </span>
                    </p>
                  ) : locDeclined ? (
                    <>
                      <p className="ob-location-ok">
                        <Check size={17} strokeWidth={2.5} />
                        <span>
                          No problem — we'll rank your feed using your college location.
                        </span>
                      </p>

                      <p className="ob-location-copy">
                        You can switch to your real location any time in Settings.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="ob-location-copy">
                        We use a rounded location to help you discover people nearby,
                        beyond your campus. Your exact location is never shown to anyone.
                      </p>

                      <button
                        type="button"
                        className="ob-loc-btn"
                        onClick={grantLocation}
                        disabled={locBusy}
                      >
                        {locBusy ? 'Finding you…' : 'Use my location'}
                      </button>

                      <button
                        type="button"
                        className="ob-loc-alt"
                        onClick={() => {
                          setLocDeclined(true);
                          setLocError('');
                          triggerHaptic('light');
                        }}
                        disabled={locBusy}
                      >
                        Use my college location instead
                      </button>

                      {locError && (
                        <p className="ob-loc-note">
                          {locError} You can turn this on later in Settings, or use
                          your college location instead.
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {banner}

        <div className="ob-actions">
          {isLast ? (
            <button
              type="button"
              className="ob-cta"
              onClick={publish}
              disabled={!allDone || uploading || publishing}
            >
              {publishing ? 'Publishing…' : 'Publish & start matching'}
              <ChevronRight size={20} strokeWidth={2.5} />
            </button>
          ) : (
            <button
              type="button"
              className="ob-cta"
              onClick={next}
              disabled={!stepDone(step)}
            >
              Continue
              <ChevronRight size={20} strokeWidth={2.5} />
            </button>
          )}

          {s.foot && <p className="ob-foot">{s.foot}</p>}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
