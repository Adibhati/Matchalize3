
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Camera, LogOut, ChevronRight, ChevronLeft, Check, MoreVertical, Pencil, X } from 'lucide-react';
import { api } from '../utils/api';
import { toast } from '../utils/toast';
import { triggerHaptic } from '../utils/haptics';
import { readLocationOnce, LOCATION_UNAVAILABLE } from '../utils/geolocation';
import { useAuth } from '../utils/AuthContext';
import { useAppConfig } from '../utils/AppConfigContext';
import neu from '../styles/neu';
import campusNamePhoto from '../assets/campusname.jpg';
import campusBirthdayPhoto from '../assets/campusbirthday.jpg';
import identifyCampusPhoto from '../assets/identifycampus.jpg';
import meetCampusPhoto from '../assets/meetcampus.jpg';
import chapterCampusPhoto from '../assets/chaptercampus.jpg';
import findCampusPhoto from '../assets/findcampus.jpg';
import campusTownPhoto from '../assets/college-town-aesthetic-cute-college-town.jpg';

const T = {
  ...neu,
  ink: '#171414',
  ink2: '#393130',
  ink3: '#6E6160',
  paper: '#FFF9F4',
  paper2: '#FFFCF8',
  card: '#FFFCF8',
  yellow: '#FFE76A',
  yellowDeep: '#FFD43D',
  orange: '#FF7399',
  green: '#B8F0C7',
  red: '#D9485D',
  concrete: '#A39E92',
  fontHeavy: "'Barlow Condensed', sans-serif",
  fontBody: "'Space Grotesk', sans-serif",
  fontMono: "'IBM Plex Mono', monospace",
};

const STEPS = [
  {
    key: 'name',
    title: 'What do your friends call you, huh?',
  },
  {
    key: 'dob',
    title: "When's your birthday, huh?",
    foot: 'Your birthday stays private.',
  },
  {
    key: 'gender',
    title: 'How do you describe your gender, huh?',
    hint: 'Choose what feels right to you.',
  },
  {
    key: 'interestedIn',
    title: 'Who are you open to meeting, huh?',
  },
  {
    key: 'year',
    title: 'What chapter are you in, huh?',
  },
  {
    key: 'intent',
    title: 'What are you hoping to find, huh?',
  },
  {
    key: 'photo',
    title: 'Give them a face to remember, huh?',
  },
  {
    key: 'location',
    title: 'Which location should we use, huh?',
    optional: true,
  },
];

const SCENE_STEP_KEYS = ['name', 'dob', 'gender', 'interestedIn', 'year', 'intent', 'location'];
const SELECTION_FLOW_STEP_KEYS = ['gender', 'interestedIn', 'year', 'intent'];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=Bowlby+One+SC&family=IBM+Plex+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');

  .ob-root {
    --page: ${T.paper};
    --main: ${T.ink};
    --sub: ${T.ink2};
    --surface: ${T.card};
    --line: rgba(23,20,20,.22);
    --accent: ${T.orange};
    --tint: rgba(255,115,153,.16);
    --bw: 2px;
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
    transition: background-color .3s ease, color .3s ease;
  }

  .ob-root *,
  .ob-root *::before,
  .ob-root *::after {
    box-sizing: border-box;
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
    --accent: #FF7399;
    --tint: rgba(255,115,153,.16);
  }

  .ob-name-scene {
    display: none;
  }

  .ob-name-backdrop-art {
    display: none;
  }

  .ob-name-brand {
    display: none;
  }

  .ob-root-dob {
    --accent: #FFE76A;
    --tint: rgba(255,231,106,.22);
  }

  .ob-root-photo {
    --accent: #171414;
    --tint: rgba(23,20,20,.08);
  }

  .ob-root-photo:not(.ob-photo-ready) .ob-actions,
  .ob-root:has(.ob-screen-photo):not(.ob-photo-ready) .ob-actions {
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transition: opacity 0s, visibility 0s;
  }

  .ob-root-photo.ob-photo-ready .ob-actions,
  .ob-root.ob-photo-ready:has(.ob-screen-photo) .ob-actions {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    transition: opacity .525s ease, visibility 0s;
  }

  .ob-photo-image {
    position: relative;
    z-index: 0;
    opacity: 1;
    transition: opacity .6s cubic-bezier(.32,.72,0,1);
  }

  .ob-photo .ob-photo-blur {
    position: absolute;
    z-index: 0;
    inset: -6%;
    width: 112%;
    height: 112%;
    object-fit: cover;
    filter: blur(10px);
    opacity: 0;
    pointer-events: none;
    transition: opacity .6s cubic-bezier(.32,.72,0,1);
  }

  .ob-root.ob-photo-uploading:has(.ob-screen-photo) .ob-photo-image {
    opacity: 0;
  }

  .ob-root.ob-photo-uploading:has(.ob-screen-photo) .ob-photo-blur {
    opacity: 1;
  }

  .ob-root-gender {
    --accent: #B8F0C7;
    --tint: rgba(184,240,199,.35);
  }

  .ob-root-interestedin {
    --accent: #8ED8F5;
    --tint: rgba(142,216,245,.32);
  }

  .ob-root-year {
    --accent: #C8B6F2;
    --tint: rgba(200,182,242,.32);
  }

  .ob-root-intent {
    --accent: #F5B7C8;
    --tint: rgba(245,183,200,.32);
  }

  .ob-root-location {
    --accent: #F5B942;
    --tint: rgba(245,185,66,.3);
  }

  .ob-location-ok svg {
    color: var(--accent);
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
    border-bottom: var(--bw) solid var(--main);
    box-shadow: 0 3px 0 rgba(23,20,20,.06);
    transition: background-color .4s ease, border-color .4s ease;
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
    border: var(--bw) solid var(--main);
    border-radius: 12px 12px 5px 12px;
    box-shadow: 3px 3px 0 var(--main);
    transition: transform .16s ease, background .16s ease;
  }

  .ob-hbtn:active {
    transform: translate(2px, 2px);
    background: var(--tint);
    box-shadow: 1px 1px 0 var(--main);
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
    border: var(--bw) solid var(--main);
    border-radius: 5px;
    box-shadow: 4px 4px 0 var(--main);
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
    border-radius: 3px;
    font-family: var(--body);
    font-size: 14px;
    font-weight: 600;
    color: ${T.red};
    transition: background .15s ease;
  }

  .ob-menuitem:active {
    background: rgba(168,79,74,.1);
  }

  .ob-confirm-backdrop {
    position: fixed;
    inset: 0;
    z-index: 200;
    display: grid;
    place-items: center;
    padding: 24px;
    background: rgba(23,20,20,.52);
    backdrop-filter: blur(3px);
  }

  .ob-confirm-dialog {
    width: min(100%, 420px);
    padding: clamp(22px, 5vw, 32px);
    color: var(--main);
    background: var(--surface);
    border: var(--bw) solid var(--main);
    border-radius: 16px 16px 6px 16px;
    box-shadow: 7px 7px 0 var(--main);
  }

  .ob-confirm-icon {
    width: 46px;
    height: 46px;
    display: grid;
    place-items: center;
    margin-bottom: 18px;
    color: ${T.red};
    background: rgba(217,72,93,.1);
    border: var(--bw) solid var(--main);
    border-radius: 12px 12px 4px 12px;
  }

  .ob-confirm-title {
    margin: 0;
    font-family: var(--heavy);
    font-size: 30px;
    font-weight: 800;
    line-height: 1;
    letter-spacing: -.02em;
  }

  .ob-confirm-copy {
    margin: 12px 0 24px;
    color: var(--sub);
    font-family: var(--body);
    font-size: 14px;
    line-height: 1.65;
  }

  .ob-confirm-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }

  .ob-confirm-button {
    min-height: 46px;
    padding: 10px 16px;
    border: var(--bw) solid var(--main);
    border-radius: 8px 8px 4px 8px;
    box-shadow: 3px 3px 0 var(--main);
    cursor: pointer;
    font-family: var(--body);
    font-size: 14px;
    font-weight: 700;
    transition: transform .15s ease, box-shadow .15s ease, background .15s ease;
  }

  .ob-confirm-button:active {
    transform: translate(2px, 2px);
    box-shadow: 1px 1px 0 var(--main);
  }

  .ob-confirm-button:disabled {
    cursor: wait;
    opacity: .65;
  }

  .ob-confirm-stay {
    color: var(--main);
    background: var(--surface);
  }

  .ob-confirm-logout {
    color: ${T.paper};
    background: ${T.red};
  }

  .ob-confirm-button:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 3px;
  }

  .ob-fit {
    width: 100%;
    max-width: 1040px;
    min-height: calc(100dvh - 70px);
    flex: 1 0 auto;
    margin: 0 auto;
    padding:
      clamp(30px, 5vh, 58px)
      clamp(22px, 5vw, 58px)
      0;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    gap: clamp(18px, 3vh, 30px);
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
    isolation: isolate;
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

  .ob-title-line {
    display: block;
  }

  .ob-title-tablet-line {
    display: inline;
  }

  .ob-title::after {
    content: '';
    display: block;
    width: clamp(55px, 8vw, 82px);
    height: 6px;
    margin-top: 15px;
    border-radius: 1px;
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
    border: var(--bw) solid var(--main);
    border-radius: 18px 18px 7px 18px;
    box-shadow: 5px 5px 0 var(--main);
    transition: background .35s ease, border-color .35s ease;
  }

  .ob-art::before {
    content: '';
    position: absolute;
    width: 125px;
    height: 125px;
    right: -47px;
    top: -54px;
    border: var(--bw) solid var(--main);
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
    border: var(--bw) solid var(--main);
    border-radius: 12px 12px 5px 12px;
    box-shadow: 4px 4px 0 var(--main);
    font-family: var(--body);
    font-size: 21px;
    font-weight: 500;
    outline: none;
    -webkit-appearance: none;
    appearance: none;
    transition: border-color .18s ease, box-shadow .18s ease, background .18s ease, transform .18s ease;
  }

  .ob-input::placeholder {
    color: ${T.ink3};
    font-weight: 400;
  }

  .ob-input:focus,
  .ob-input:focus-visible {
    outline: none;
    box-shadow: 4px 4px 0 var(--main), inset 0 0 0 2px var(--screen-accent);
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
    position: absolute;
    top: 0;
    left: 0;
    padding: 10px 15px;
    color: ${T.ink};
    background: #FFE3E8;
    border: var(--bw) solid var(--main);
    border-radius: 4px;
    box-shadow: 3px 3px 0 var(--main);
    font-family: var(--mono);
    font-size: 13px;
    font-weight: 600;
  }

  .ob-age-slot {
    position: relative;
    width: 100%;
    height: 72px;
    flex: 0 0 72px;
  }

  .ob-age-warning {
    position: absolute;
    top: 47px;
    left: 0;
    color: ${T.red};
    font-family: var(--body);
    font-size: 13px;
    font-weight: 600;
    line-height: 1.4;
  }

  .ob-age.ok {
    color: ${T.ink};
    background: ${T.green};
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
    border: var(--bw) solid var(--main);
    border-radius: 10px 10px 4px 10px;
    cursor: pointer;
    font-family: var(--body);
    font-size: 18px;
    font-weight: 600;
    box-shadow: 3px 3px 0 var(--main);
    transition: background .18s ease, border-color .18s ease, color .18s ease, transform .18s ease;
  }

  .ob-chip:nth-child(3n + 2) {
    border-radius: 10px 4px 10px 10px;
  }

  .ob-root-gender .ob-chip,
  .ob-root-gender .ob-chip:nth-child(3n + 2) {
    border-radius: 10px 10px 4px 10px;
  }

  .ob-chip.on {
    background: var(--screen-accent);
    color: ${T.ink};
    border-color: var(--main);
    box-shadow: 2px 2px 0 var(--main);
  }

  .ob-chip:active:not(:disabled) {
    transform: translate(2px, 2px);
    box-shadow: 1px 1px 0 var(--main);
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
    border: var(--bw) dashed var(--main);
    border-radius: 16px 16px 6px 16px;
    box-shadow: 5px 5px 0 var(--main);
    transition: border-color .16s ease, background .16s ease;
  }

  .ob-photo.filled {
    border-style: solid;
    cursor: default;
    background: var(--surface);
    box-shadow: 5px 5px 0 var(--main);
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
    background: ${T.paper};
    border: var(--bw) solid var(--main);
    border-radius: 14px 14px 14px 5px;
    color: ${T.ink};
    transform: rotate(-4deg);
    box-shadow: 3px 3px 0 var(--main);
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
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${T.yellow};
    color: ${T.ink};
    border: var(--bw) solid var(--main);
    border-radius: 4px;
    cursor: pointer;
    transition: transform .15s ease, background .15s ease;
  }

  .ob-photomenu {
    position: absolute;
    top: 52px;
    right: 12px;
    z-index: 4;
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 5px;
    background: ${T.card};
    border: var(--bw) solid var(--main);
    border-radius: 7px;
    box-shadow: 3px 3px 0 var(--main);
  }

  .ob-photomenu button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-height: 34px;
    padding: 7px 9px;
    color: var(--main);
    background: transparent;
    border: 0;
    border-radius: 4px;
    cursor: pointer;
    font-family: var(--body);
    font-size: 12px;
    font-weight: 700;
  }

  .ob-photomenu button:hover {
    background: var(--tint);
  }

  .ob-photomenu .ob-photomenu-remove {
    color: ${T.red};
  }

  .ob-photox:active {
    background: ${T.ink};
    color: ${T.paper};
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
    border: var(--bw) solid var(--main);
    border-radius: 10px 10px 4px 10px;
    box-shadow: 3px 3px 0 var(--main);
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

  .ob-root-location .ob-location-ok svg {
    color: var(--accent);
  }

  .ob-location-options {
    align-items: stretch;
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

  .ob-root-gender .ob-actions {
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transition: opacity .525s ease, visibility 0s;
  }

  .ob-root-gender.ob-gender-ready .ob-actions {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    transition: opacity .525s ease, visibility 0s;
  }

  .ob-root-interestedin .ob-actions {
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transition: opacity .525s ease, visibility 0s;
  }

  .ob-root-interestedin.ob-interestedin-ready .ob-actions {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    transition: opacity .525s ease, visibility 0s;
  }

  .ob-root-year .ob-actions {
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transition: opacity .525s ease, visibility 0s;
  }

  .ob-root-year.ob-year-ready .ob-actions {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    transition: opacity .525s ease, visibility 0s;
  }

  .ob-root-intent .ob-actions {
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transition: opacity .525s ease, visibility 0s;
  }

  .ob-root-intent.ob-intent-ready .ob-actions {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    transition: opacity .525s ease, visibility 0s;
  }

  .ob-root-location .ob-actions {
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transition: opacity .525s ease, visibility 0s;
  }

  .ob-root-location.ob-location-ready .ob-actions {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    transition: opacity .525s ease, visibility 0s;
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
    border: var(--bw) solid var(--main);
    border-radius: 12px 12px 5px 12px;
    cursor: pointer;
    font-family: var(--body);
    font-size: 17px;
    font-weight: 700;
    box-shadow: 5px 5px 0 var(--main);
    transition: transform .16s ease, box-shadow .16s ease, opacity .16s ease, background .3s ease;
  }

  .ob-cta:active:not(:disabled) {
    transform: translate(3px, 3px);
    box-shadow: 2px 2px 0 var(--main);
  }

  .ob-cta:disabled {
    opacity: .48;
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
    background: #FFE3E8;
    border: var(--bw) solid var(--main);
    border-radius: 5px;
    box-shadow: 3px 3px 0 var(--main);
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
  .ob-location-options .ob-chip:focus-visible {
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

  }

  @media (min-width: 601px) {
    .ob-fit {
      justify-content: center;
    }

    .ob-root-name {
      --ob-scene-width: clamp(250px, 38vw, 360px);
    }

    .ob-root-name .ob-head {
      position: absolute;
      top: 0;
      right: 0;
      z-index: 5;
      width: calc(100% - var(--ob-scene-width));
      justify-content: flex-end;
      padding: max(22px, env(safe-area-inset-top)) clamp(24px, 4vw, 42px) 0;
      background: transparent;
      border: 0;
      box-shadow: none;
    }

    .ob-root-name .ob-name-brand {
      display: block;
      position: fixed;
      z-index: 5;
      top: max(24px, env(safe-area-inset-top));
      left: max(24px, env(safe-area-inset-left));
      color: var(--main);
      font-family: 'Bowlby One SC', var(--heavy);
      font-size: clamp(36px, 4.6vw, 46px);
      font-weight: 400;
      letter-spacing: -.065em;
      line-height: .92;
      text-shadow: 2px 2px 0 ${T.yellow};
    }

    .ob-root-name .ob-name-brand-question {
      display: inline-block;
      margin-left: .015em;
      color: ${T.orange};
      transform: rotate(7deg) translateY(-.015em);
      transform-origin: 60% 65%;
    }

    .ob-root-name .ob-name-scene {
      display: block;
      position: fixed;
      inset: 0 auto 0 0;
      z-index: 0;
      width: calc(var(--ob-scene-width) + 2px);
      overflow: hidden;
      pointer-events: none;
      background: var(--page);
    }

    .ob-root-name .ob-name-visual {
      position: absolute;
      inset: 0;
      overflow: hidden;
      filter: saturate(.92) contrast(.98) brightness(.97);
    }

    .ob-root-name .ob-name-frame {
      position: absolute;
      inset: 0;
      -webkit-mask-image: linear-gradient(90deg, #000 62%, transparent 100%);
      mask-image: linear-gradient(90deg, #000 62%, transparent 100%);
    }

    .ob-root-name .ob-name-frame img {
      display: block;
      width: 170%;
      height: 100%;
      max-width: none;
      object-fit: cover;
      object-position: center 58%;
      transform: translateX(-41.176%);
    }

    .ob-root-name .ob-name-frame.is-fallback {
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--tint);
    }

    .ob-root-name .ob-name-frame svg {
      display: block;
      width: min(88%, 600px);
      height: auto;
      overflow: visible;
    }

    .ob-root-name .ob-fit {
      width: calc(100% - var(--ob-scene-width));
      max-width: none;
      min-height: 100dvh;
      margin: 0 0 0 var(--ob-scene-width);
      padding: max(72px, env(safe-area-inset-top)) clamp(24px, 4vw, 48px) max(32px, env(safe-area-inset-bottom));
      justify-content: center;
      position: relative;
      z-index: 1;
    }

    .ob-root-name .ob-screen-name {
      width: 100%;
      max-width: 500px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      grid-template-areas:
        "title"
        "hint"
        "field";
      column-gap: 0;
      row-gap: 20px;
      align-content: center;
    }

    .ob-root-name .ob-screen-name .ob-title {
      font-family: var(--body);
      font-size: clamp(34px, 4.2vw, 46px);
      font-weight: 800;
      letter-spacing: -.055em;
      line-height: 1.06;
      text-transform: none;
    }

    .ob-root-name .ob-screen-name .ob-title::after {
      display: none;
    }

    .ob-root-name .ob-screen-name .ob-field {
      width: 100%;
      max-width: none;
      padding-top: 0;
    }

    .ob-root-name .ob-screen-name .ob-art {
      display: none;
    }

    .ob-root-name .ob-screen-name .ob-input {
      min-height: 74px;
      border-radius: 14px;
      box-shadow: 3px 3px 0 var(--main);
      font-size: 20px;
    }

    .ob-root-name .ob-screen-name .ob-input:focus,
    .ob-root-name .ob-screen-name .ob-input:focus-visible {
      background: #FFF0F4;
      border-color: var(--accent);
      box-shadow: 4px 4px 0 var(--accent);
    }

    .ob-root-name .ob-actions {
      width: 100%;
      max-width: 500px;
      height: 78px;
      flex: 0 0 78px;
      margin: 10px auto 0;
      padding: 0;
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      transform: translateY(8px);
      transition: opacity .525s ease, transform .6s ease, visibility 0s;
    }

    .ob-root-name.ob-name-ready .ob-actions {
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
      transform: translateY(0);
    }

    .ob-screen-photo {
      max-width: 1120px;
      grid-template-columns: minmax(0, 1fr) minmax(0, .9fr);
      grid-template-areas:
        "field title"
        "field hint";
      column-gap: clamp(34px, 7vw, 96px);
      row-gap: 18px;
      align-content: center;
      align-items: center;
    }

    .ob-screen-photo .ob-title {
      align-self: end;
      font-family: var(--body);
      font-size: clamp(34px, 4.2vw, 52px);
      font-weight: 800;
      line-height: 1.12;
      letter-spacing: -.04em;
      text-transform: none;
    }

    .ob-screen-photo .ob-title::after {
      display: none;
    }

    .ob-screen-photo .ob-hint {
      align-self: start;
      font-size: 16px;
      line-height: 1.75;
    }

    .ob-screen-photo .ob-field {
      width: 100%;
      max-width: 420px;
      justify-self: center;
      padding-top: 0;
    }

    .ob-root:has(.ob-screen-photo) .ob-photo {
      width: 100%;
      max-height: min(56dvh, 540px);
    }

    .ob-root:has(.ob-screen-photo) .ob-actions {
      width: calc((100% - clamp(34px, 7vw, 96px)) / 2);
      margin-left: auto;
    }
  }


  @media (min-width: 601px) {
    .ob-root-name {
      --tint: rgba(255,115,153,.24);
    }

    .ob-root-name::before {
      top: auto;
      right: -20%;
      bottom: -35%;
      width: min(65vw, 700px);
    }

    .ob-root:has(.ob-screen-photo) {
      --accent: #171414;
      --tint: rgba(23,20,20,.08);
    }

    .ob-root:has(.ob-screen-photo) .ob-cta {
      color: #FFF9F4;
    }

    .ob-root-gender {
      overflow-y: hidden;
    }

    .ob-root-split {
      --ob-scene-width: 55vw;
    }

    .ob-root-split .ob-head {
      position: absolute;
      top: 0;
      right: 0;
      width: calc(100% - var(--ob-scene-width));
      justify-content: flex-end;
      background: transparent;
      border-bottom: 0;
      box-shadow: none;
    }

    .ob-root-split:not(.ob-root-name) .ob-head {
      justify-content: space-between;
      padding-left: clamp(28px, 4vw, 72px);
    }

    .ob-name-brand {
      display: block;
      position: fixed;
      z-index: 5;
      top: max(22px, env(safe-area-inset-top, 0px));
      left: max(28px, env(safe-area-inset-left, 0px));
      color: var(--main);
      font-family: 'Bowlby One SC', var(--heavy);
      font-size: clamp(40px, 3.6vw, 54px);
      font-weight: 400;
      letter-spacing: -.065em;
      line-height: .92;
      text-shadow: 2.5px 2.5px 0 ${T.yellow};
    }

    .ob-name-brand-question {
      display: inline-block;
      margin-left: .015em;
      color: ${T.orange};
      transform: rotate(7deg) translateY(-.015em);
      transform-origin: 60% 65%;
    }

    .ob-root-split .ob-fit {
      width: calc(100% - var(--ob-scene-width));
      max-width: none;
      min-height: 100dvh;
      margin: 0 0 0 var(--ob-scene-width);
      padding: max(40px, env(safe-area-inset-top)) clamp(28px, 4vw, 72px) max(34px, env(safe-area-inset-bottom));
      justify-content: center;
      position: relative;
      z-index: 1;
    }

    .ob-root-split .ob-screen {
      width: 100%;
      max-width: 520px;
      margin: 0 auto;
      position: relative;
      top: 0;
      grid-template-columns: minmax(0, 1fr);
      grid-template-areas:
        "title"
        "hint"
        "field";
      column-gap: 0;
      row-gap: 18px;
      align-content: center;
    }

    .ob-root-gender.ob-root-split .ob-fit {
      height: calc(100dvh - 75px);
      min-height: 0;
      flex: 0 0 calc(100dvh - 75px);
      padding-top: max(60px, env(safe-area-inset-top));
      padding-bottom: 0;
      transform: translateY(75px);
    }

    .ob-root-gender .ob-screen-gender {
      transition: translate .45s cubic-bezier(.22, 1, .36, 1);
    }

    .ob-root-gender.ob-gender-ready .ob-screen-gender {
      translate: 0 calc(-68px - max(16px, env(safe-area-inset-bottom)));
    }

    .ob-root-split .ob-title {
      font-family: var(--body);
      font-size: 10px;
      font-weight: 800;
      letter-spacing: -.055em;
      line-height: 1.06;
      text-transform: none;
    }

    .ob-root-split:not(:has(.ob-screen-photo)) .ob-screen .ob-title {
      font-size: clamp(34px, 4.2vw, 46px);
    }

    .ob-root-split .ob-title::after {
      display: none;
    }

    .ob-screen-name .ob-input,
    .ob-screen-dob .ob-input {
      border-radius: 14px;
      box-shadow: 3px 3px 0 var(--main);
    }

    .ob-screen-name .ob-input:focus,
    .ob-screen-name .ob-input:focus-visible,
    .ob-screen-dob .ob-input:focus,
    .ob-screen-dob .ob-input:focus-visible {
      background: #FFF0F4;
      border-color: var(--accent);
      box-shadow: 4px 4px 0 var(--accent);
    }

    .ob-root-split .ob-art {
      display: none;
    }

    .ob-root-split .ob-actions {
      width: 100%;
      max-width: 520px;
      margin-right: auto;
      margin-left: auto;
    }

    .ob-root:has(.ob-screen-photo) .ob-head {
      position: absolute;
      top: 0;
      left: 55vw;
      right: 0;
      z-index: 10;
      width: 45vw;
      justify-content: space-between;
      padding-left: clamp(28px, 4vw, 72px);
      background: transparent;
      border: 0;
      box-shadow: none;
    }

    .ob-root:has(.ob-screen-photo) .ob-fit {
      width: 100%;
      max-width: none;
      height: 100dvh;
      min-height: 100dvh;
      flex: 0 0 100dvh;
      margin: 0;
      padding: 0;
      justify-content: flex-start;
      gap: 0;
    }

    .ob-root:has(.ob-screen-photo) .ob-screen-photo {
      width: 100%;
      max-width: none;
      height: 100dvh;
      min-height: 100dvh;
      margin: 0;
      grid-template-columns: minmax(0, 55vw) minmax(0, 1fr);
      grid-template-areas: "field title";
      column-gap: clamp(32px, 6vw, 88px);
      row-gap: 0;
      align-content: center;
      padding-right: clamp(32px, 6vw, 88px);
    }

    .ob-root:has(.ob-screen-photo) .ob-screen-photo .ob-title {
      align-self: center;
      font-size: clamp(34px, 3.4vw, 48px);
      letter-spacing: -.06em;
      line-height: 1.04;
    }

    .ob-root:has(.ob-screen-photo) .ob-screen-photo .ob-hint {
      align-self: start;
    }

    .ob-root:has(.ob-screen-photo) .ob-screen-photo .ob-field {
      width: 100%;
      max-width: none;
      height: 100dvh;
      justify-self: stretch;
      align-self: stretch;
    }

    .ob-root:has(.ob-screen-photo) .ob-photo {
      width: 100%;
      height: 100%;
      max-height: none;
      min-height: 100dvh;
      aspect-ratio: auto;
      border: 0;
      border-radius: 0;
      box-shadow: none;
    }

    .ob-root:has(.ob-screen-photo) .ob-photo.filled {
      border: 0;
      box-shadow: none;
    }

    .ob-root:has(.ob-screen-photo) .ob-photox {
      top: max(22px, env(safe-area-inset-top, 0px));
      right: max(28px, env(safe-area-inset-right, 0px));
      width: 38px;
      height: 38px;
    }

    .ob-root:has(.ob-screen-photo) .ob-photomenu {
      top: calc(max(22px, env(safe-area-inset-top, 0px)) + 46px);
      right: max(28px, env(safe-area-inset-right, 0px));
    }

    .ob-root:has(.ob-screen-photo) .ob-photox svg {
      width: 16px;
      height: 16px;
    }

    .ob-root:has(.ob-screen-photo) .ob-actions {
      position: fixed;
      right: clamp(32px, 6vw, 88px);
      top: calc(50% + clamp(72px, 9vh, 96px));
      z-index: 5;
      width: calc(45vw - 2 * clamp(32px, 6vw, 88px));
      max-width: 520px;
      margin: 0;
      padding: 0;
    }

    .ob-root-name .ob-actions,
    .ob-root-dob .ob-actions {
      height: 78px;
      flex: 0 0 78px;
      margin: 10px auto 0;
      padding: 0;
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      transform: translateY(8px);
      transition:
        opacity .525s ease,
        transform .6s ease,
        visibility 0s;
    }

    .ob-root-name.ob-name-ready .ob-actions,
    .ob-root-dob.ob-dob-ready .ob-actions {
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
      transform: translateY(0);
      transition:
        opacity .525s ease,
        transform .6s ease,
        visibility 0s;
    }

    .ob-name-scene {
      display: block;
      position: fixed;
      top: 0;
      bottom: 0;
      left: 0;
      z-index: 0;
      width: calc(var(--ob-scene-width) + 2px);
      overflow: visible;
      pointer-events: none;
      background: var(--page);
    }

    .ob-name-visual {
      position: absolute;
      inset: 0;
      overflow: hidden;
      filter: saturate(.92) contrast(.98) brightness(.97);
      transform: scale(1);
      transition: filter .6s cubic-bezier(.32,.72,0,1), transform .8s cubic-bezier(.32,.72,0,1);
      will-change: transform, filter;
    }

    .ob-name-frame,
    .ob-dob-frame {
      position: absolute;
      inset: 0;
    }

    .ob-name-frame:not(.is-fallback),
    .ob-dob-frame:not(.is-fallback) {
      -webkit-mask-image: linear-gradient(90deg, #000 62%, transparent 100%);
      mask-image: linear-gradient(90deg, #000 62%, transparent 100%);
    }

    .ob-name-frame.is-fallback,
    .ob-dob-frame.is-fallback {
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--tint);
    }

    .ob-name-frame img {
      display: block;
      width: 170%;
      height: 100%;
      max-width: none;
      object-fit: cover;
      object-position: center 58%;
      transform: translateX(-41.176%);
    }

    .ob-root-gender .ob-dob-frame img {
      width: 135%;
      max-width: none;
      transform: translateX(-14.074%);
    }

    .ob-dob-frame img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center 55%;
    }

    .ob-name-frame img.ob-scene-depth,
    .ob-dob-frame img.ob-scene-depth {
      position: absolute;
      z-index: 1;
      top: -5%;
      left: -5%;
      width: 110%;
      height: 110%;
      filter: blur(4px);
      opacity: 0;
      pointer-events: none;
      -webkit-mask-image: radial-gradient(ellipse at center, transparent 38%, rgba(0, 0, 0, .72) 78%, #000 100%);
      mask-image: radial-gradient(ellipse at center, transparent 38%, rgba(0, 0, 0, .72) 78%, #000 100%);
      transition: opacity .45s ease;
    }

    .ob-name-frame img.ob-scene-depth {
      left: 0;
      width: 170%;
      transform: translateX(-41.176%);
    }

    .ob-root-gender .ob-dob-frame img.ob-scene-depth {
      left: 0;
      width: 135%;
      transform: translateX(-14.074%);
    }

    .ob-root-name.ob-name-ready .ob-scene-depth,
    .ob-root-dob.ob-dob-ready .ob-scene-depth,
    .ob-root-gender.ob-gender-ready .ob-scene-depth,
    .ob-root-interestedin.ob-interestedin-ready .ob-scene-depth,
    .ob-root-year.ob-year-ready .ob-scene-depth,
    .ob-root-intent.ob-intent-ready .ob-scene-depth,
    .ob-root-location.ob-location-ready .ob-scene-depth {
      opacity: 1;
    }

    .ob-name-frame svg,
    .ob-dob-frame svg {
      display: block;
      width: min(88%, 600px);
      height: auto;
      overflow: visible;
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

  @media (min-width: 601px) and (max-width: 1049px) {
    .ob-root-split {
      --ob-scene-width: 40vw;
    }

    .ob-root:has(.ob-screen-photo) .ob-head {
      left: 40vw;
      width: 60vw;
    }

    .ob-root:has(.ob-screen-photo) .ob-screen-photo {
      grid-template-columns: minmax(0, 42vw) minmax(0, 1fr);
      column-gap: clamp(24px, 4vw, 48px);
      padding-right: clamp(24px, 4vw, 48px);
    }

    .ob-root:has(.ob-screen-photo) .ob-actions {
      right: clamp(24px, 4vw, 48px);
      width: calc(60vw - 2 * clamp(24px, 4vw, 48px));
    }
  }

  @media (min-width: 601px) and (max-width: 1049px) and (orientation: landscape) {
    .ob-root:has(.ob-screen-photo) .ob-screen-photo {
      grid-template-columns: minmax(0, 40vw) minmax(0, 1fr);
      column-gap: clamp(24px, 4vw, 48px);
      padding-right: clamp(24px, 4vw, 48px);
    }

    .ob-root:has(.ob-screen-photo) .ob-screen-photo .ob-field {
      width: 42vw;
    }

    .ob-root:has(.ob-screen-photo) .ob-photo,
    .ob-root:has(.ob-screen-photo) .ob-photo.filled {
      width: 100%;
    }
  }

  @media (min-width: 601px) and (max-width: 1049px) and (orientation: portrait) {
    .ob-root-split .ob-name-brand {
      top: max(20px, env(safe-area-inset-top));
      left: 50%;
      transform: translateX(-50%);
    }

    .ob-root-split:not(:has(.ob-screen-photo)) {
      overflow-y: hidden;
    }

    .ob-root-split:not(:has(.ob-screen-photo)) .ob-head {
      left: 0;
      right: 0;
      width: 100%;
      justify-content: flex-end;
      gap: 14px;
      padding: max(14px, env(safe-area-inset-top)) clamp(24px, 6vw, 48px) 0;
    }

    .ob-root-split:not(:has(.ob-screen-photo)) .ob-name-scene {
      inset: 0 0 auto;
      width: 100%;
      height: 60dvh;
    }

    .ob-root-split:not(:has(.ob-screen-photo)) .ob-name-frame,
    .ob-root-split:not(:has(.ob-screen-photo)) .ob-dob-frame {
      -webkit-mask-image: linear-gradient(180deg, #000 76%, transparent 100%);
      mask-image: linear-gradient(180deg, #000 76%, transparent 100%);
    }

    .ob-root-split:not(:has(.ob-screen-photo)) .ob-name-frame img:not(.ob-scene-depth),
    .ob-root-split:not(:has(.ob-screen-photo)) .ob-dob-frame img:not(.ob-scene-depth) {
      width: 100%;
      transform: none;
      object-position: center 58%;
    }

    .ob-root-split:not(:has(.ob-screen-photo)) .ob-name-frame img.ob-scene-depth,
    .ob-root-split:not(:has(.ob-screen-photo)) .ob-dob-frame img.ob-scene-depth {
      left: 0;
      width: 100%;
      transform: none;
    }

    .ob-root-split:not(:has(.ob-screen-photo)) .ob-fit {
      width: 100%;
      height: 40dvh;
      min-height: 0;
      flex: 0 0 40dvh;
      margin: auto 0 0;
      padding: clamp(16px, 2.5vh, 26px) clamp(24px, 6vw, 48px) max(24px, env(safe-area-inset-bottom));
      position: absolute;
      inset: 60dvh 0 0;
      overflow: visible;
      gap: 8px;
      transform: none;
    }

    .ob-root-split:not(:has(.ob-screen-photo)) .ob-screen {
      width: 100%;
      max-width: 500px;
      min-height: 0;
      position: absolute;
      right: clamp(24px, 6vw, 48px);
      bottom: calc(110px + max(24px, env(safe-area-inset-bottom)));
      left: clamp(24px, 6vw, 48px);
      flex: 0 0 auto;
      margin: 0 auto;
      grid-template-columns: minmax(0, 1fr);
      grid-template-areas:
        "title"
        "hint"
        "field";
      align-content: center;
      row-gap: clamp(8px, 1.6vh, 14px);
      overflow: visible;
    }

    .ob-root-split:not(:has(.ob-screen-photo)) .ob-screen .ob-title {
      max-width: 100%;
      font-size: 42px;
      line-height: 1.06;
    }

    .ob-title-tablet-line {
      display: block;
    }

    .ob-root-split:not(:has(.ob-screen-photo)) .ob-screen .ob-hint {
      font-size: 14px;
      line-height: 1.5;
    }

    .ob-root-split:not(:has(.ob-screen-photo)) .ob-field {
      gap: 10px;
      padding-top: 0;
    }

    .ob-root-split:not(:has(.ob-screen-photo)) .ob-chip {
      min-height: 54px;
      padding: 12px 16px;
      font-size: 16px;
    }

    .ob-root-split:not(:has(.ob-screen-photo)) .ob-actions {
      width: 100%;
      max-width: 500px;
      min-height: 78px;
      position: absolute;
      right: clamp(24px, 6vw, 48px);
      bottom: max(16px, env(safe-area-inset-bottom));
      left: clamp(24px, 6vw, 48px);
      z-index: 10;
      flex: 0 0 78px;
      margin: 0 auto;
      padding: 0;
    }

    .ob-root-split:not(:has(.ob-screen-photo)) .ob-actions .ob-foot {
      margin-top: 8px;
    }

    .ob-root-name {
      overflow-y: hidden;
    }

    .ob-root-name .ob-screen-name .ob-title {
      font-size: 42px;
      max-width: 11em;
    }

    .ob-root-split.ob-root-name:not(:has(.ob-screen-photo)) .ob-screen-name .ob-title {
      font-size: 42px;
      max-width: 11em;
    }

    .ob-root-split:not(:has(.ob-screen-photo)) .ob-screen-name .ob-title {
      font-size: 42px;
      max-width: 11em;
    }

    .ob-root-split:not(:has(.ob-screen-photo)) .ob-screen-dob .ob-title {
      font-size: 42px;
    }

    .ob-root-split.ob-root-name:not(:has(.ob-screen-photo)) .ob-screen-name .ob-field {
      gap: 17px;
    }

    .ob-root-name .ob-screen-name .ob-input {
      min-height: 74px;
    }

    .ob-root-dob .ob-screen-dob .ob-dob {
      height: 64px;
    }

    .ob-root-split.ob-keyboard-open:not(:has(.ob-screen-photo)) {
      height: var(--ob-visible-height);
      min-height: 0;
      flex: 0 0 var(--ob-visible-height);
      overflow-y: auto;
    }

    .ob-root-split.ob-keyboard-open:not(:has(.ob-screen-photo)) .ob-fit {
      inset: var(--ob-scene-height) 0 0;
      height: auto;
      flex-basis: auto;
      padding-top: 8px;
      padding-bottom: 0;
    }

    .ob-root-split.ob-keyboard-open:not(:has(.ob-screen-photo)) .ob-screen {
      bottom: calc(72px + max(28px, env(safe-area-inset-bottom)));
    }

    .ob-root-split.ob-keyboard-open:not(:has(.ob-screen-photo)) .ob-actions {
      bottom: max(16px, env(safe-area-inset-bottom));
    }

    .ob-root-split.ob-keyboard-open:not(:has(.ob-screen-photo)) .ob-name-scene {
      height: var(--ob-scene-height);
    }

    .ob-root-split.ob-keyboard-open:not(:has(.ob-screen-photo)) .ob-fit {
      height: var(--ob-form-height);
      flex-basis: var(--ob-form-height);
      padding-top: 8px;
      padding-bottom: max(28px, env(safe-area-inset-bottom));
    }

    .ob-root-split.ob-keyboard-open:not(:has(.ob-screen-photo)) .ob-screen {
      row-gap: 8px;
    }

    .ob-root-split.ob-keyboard-open:not(:has(.ob-screen-photo)) .ob-screen .ob-title {
      font-size: clamp(26px, 4vw, 34px);
    }

    .ob-root-name.ob-keyboard-open .ob-screen-name .ob-input {
      height: 60px;
      min-height: 60px;
      padding-right: 18px;
      padding-left: 18px;
    }

    .ob-root-dob.ob-keyboard-open .ob-screen-dob .ob-dob {
      height: 54px;
    }

    .ob-root-dob.ob-keyboard-open .ob-age-slot {
      height: 52px;
      flex-basis: 52px;
    }

    .ob-root-split.ob-keyboard-open:not(:has(.ob-screen-photo)) .ob-actions {
      height: 64px;
      min-height: 64px;
      margin-top: 4px;
    }

    .ob-root-split.ob-keyboard-open:not(:has(.ob-screen-photo)) .ob-cta {
      min-height: 56px;
      padding: 12px 18px;
    }
  }

  @media (min-width: 601px) and (max-width: 1049px) and (orientation: portrait) {
    .ob-root:has(.ob-screen-photo) {
      overflow: hidden;
    }

    .ob-root:has(.ob-screen-photo) .ob-head {
      left: 0;
      right: 0;
      width: 100%;
      justify-content: space-between;
      padding: max(16px, env(safe-area-inset-top)) clamp(24px, 6vw, 48px) 0;
    }

    .ob-root:has(.ob-screen-photo) .ob-name-brand {
      top: max(20px, env(safe-area-inset-top));
      left: 50%;
      transform: translateX(-50%);
    }

    .ob-root:has(.ob-screen-photo) .ob-fit {
      height: 100dvh;
      min-height: 100dvh;
      flex-basis: 100dvh;
    }

    .ob-root:has(.ob-screen-photo) .ob-screen-photo {
      height: 100dvh;
      min-height: 100dvh;
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: 75dvh minmax(0, 1fr);
      grid-template-areas:
        "field"
        "title";
      align-content: stretch;
      align-items: stretch;
      row-gap: 0;
      padding: 0;
    }

    .ob-root:has(.ob-screen-photo) .ob-screen-photo .ob-field {
      width: 100%;
      max-width: none;
      height: 75dvh;
      min-height: 0;
      justify-self: stretch;
      align-self: stretch;
      overflow: hidden;
    }

    .ob-root:has(.ob-screen-photo) .ob-photo,
    .ob-root:has(.ob-screen-photo) .ob-photo.filled {
      width: 100%;
      height: 100%;
      min-height: 0;
      max-height: none;
      aspect-ratio: auto;
      border: 0;
      border-radius: 0;
      box-shadow: none;
      -webkit-mask-image: none;
      mask-image: none;
    }

    .ob-root:has(.ob-screen-photo) .ob-screen-photo .ob-title {
      width: 100%;
      max-width: 620px;
      align-self: start;
      justify-self: center;
      position: relative;
      top: -3dvh;
      padding: clamp(20px, 4vh, 36px) clamp(24px, 6vw, 48px) 0;
      font-size: 42px;
      line-height: 1.06;
      letter-spacing: -.055em;
    }

    .ob-root:has(.ob-screen-photo) .ob-actions {
      position: fixed;
      top: auto;
      right: clamp(24px, 6vw, 48px);
      bottom: max(24px, env(safe-area-inset-bottom));
      left: clamp(24px, 6vw, 48px);
      width: auto;
      max-width: 620px;
      margin: 0 auto;
      padding: 0;
    }

    .ob-root:has(.ob-screen-photo) .ob-photox {
      top: max(76px, calc(env(safe-area-inset-top) + 64px));
      right: clamp(24px, 6vw, 48px);
      z-index: 11;
    }

    .ob-root:has(.ob-screen-photo) .ob-photomenu {
      top: calc(max(76px, calc(env(safe-area-inset-top) + 64px)) + 46px);
      right: clamp(24px, 6vw, 48px);
    }
  }

  @media (min-width: 601px) and (max-width: 1049px) {
    .ob-root-split .ob-name-frame.is-fallback,
    .ob-root-split .ob-dob-frame.is-fallback {
      display: flex;
      align-items: center;
      justify-content: center;
      -webkit-mask-image: none;
      mask-image: none;
      background: var(--tint);
    }

    .ob-root-split .ob-name-frame.is-fallback > svg,
    .ob-root-split .ob-dob-frame.is-fallback > svg {
      position: relative;
      z-index: 2;
      display: block;
      width: min(88%, 520px);
      max-height: 52dvh;
      height: auto;
    }

    .ob-root-split .ob-head {
      left: 0;
      right: 0;
      width: 100%;
      justify-content: space-between;
      gap: 14px;
      padding: max(16px, env(safe-area-inset-top)) clamp(24px, 6vw, 48px) 0;
    }

    .ob-root-split .ob-head > div:last-child {
      margin-left: auto;
    }
  }

  @media (min-width: 601px) and (max-width: 1049px) and (orientation: landscape) {
    .ob-root-split:not(:has(.ob-screen-photo)) .ob-head {
      right: 0;
      left: var(--ob-scene-width);
      width: calc(100% - var(--ob-scene-width));
      justify-content: space-between;
      padding-right: clamp(24px, 4vw, 48px);
      padding-left: clamp(24px, 4vw, 48px);
    }
  }

  @media (max-width: 600px) {
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
      border-radius: 15px 15px 6px 15px;
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
      border-radius: 11px 11px 5px 11px;
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
      border-radius: 9px 9px 4px 9px;
      font-size: 16px;
    }

    .ob-photo {
      width: 100%;
      aspect-ratio: 4 / 5;
      max-height: 46.5dvh;
      min-height: min(285px, 46.5dvh);
      border-radius: 14px 14px 6px 14px;
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
      border-radius: 11px 11px 5px 11px;
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

    .ob-root-name:has(.ob-screen-name) .ob-head {
      position: absolute;
      right: 0;
      left: 0;
      width: 100%;
      justify-content: space-between;
      padding: max(12px, env(safe-area-inset-top)) 17px 0;
      background: transparent;
      border: 0;
      box-shadow: none;
    }

    .ob-root:has(.ob-screen-photo) .ob-photox {
      top: calc(max(12px, env(safe-area-inset-top, 0px)) + 56px);
      right: 17px;
      z-index: 51;
    }

    .ob-root-name:has(.ob-screen-name) .ob-head > div:last-child {
      margin-left: auto;
    }

    .ob-root-name:has(.ob-screen-name) .ob-name-scene {
      display: block;
      position: fixed;
      inset: 0 0 auto;
      z-index: 0;
      width: 100%;
      height: 100svh;
      overflow: hidden;
      pointer-events: none;
      background: var(--page);
    }

    .ob-root-name:has(.ob-screen-name) .ob-name-visual {
      position: absolute;
      inset: 0 0 auto;
      height: 70svh;
      overflow: hidden;
    }

    .ob-root-name:has(.ob-screen-name) .ob-name-scene::after {
      content: '';
      position: absolute;
      right: 0;
      top: calc(70svh - 8px);
      left: 0;
      z-index: 2;
      height: 24px;
      background: var(--page);
      pointer-events: none;
    }

    .ob-root-name:has(.ob-screen-name) .ob-name-frame {
      position: absolute;
      inset: 0;
      -webkit-mask-image: none;
      mask-image: none;
    }

    .ob-root-name:has(.ob-screen-name) .ob-name-frame:not(.is-fallback)::after {
      content: '';
      position: absolute;
      right: 0;
      bottom: 0;
      left: 0;
      height: clamp(36px, 7vh, 64px);
      z-index: 2;
      pointer-events: none;
      background: linear-gradient(180deg, transparent, var(--page));
      -webkit-backdrop-filter: blur(23.1px);
      backdrop-filter: blur(23.1px);
      -webkit-mask-image: linear-gradient(180deg, transparent, #000 43%);
      mask-image: linear-gradient(180deg, transparent, #000 43%);
    }

    .ob-root-name:has(.ob-screen-name) .ob-name-frame img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center 58%;
      transform: none;
    }

    .ob-root-name:has(.ob-screen-name) .ob-name-frame.is-fallback {
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--tint);
    }

    .ob-root-name:has(.ob-screen-name) .ob-name-frame.is-fallback > svg {
      position: relative;
      z-index: 2;
      width: min(88%, 520px);
      max-height: 52svh;
      height: auto;
    }

    .ob-root-name:has(.ob-screen-name) .ob-name-brand {
      display: block;
      position: fixed;
      z-index: 51;
      top: max(18px, env(safe-area-inset-top));
      left: 50%;
      transform: translateX(-50%);
      color: var(--main);
      font-family: 'Bowlby One SC', var(--heavy);
      font-size: 32px;
      font-weight: 400;
      letter-spacing: -.065em;
      line-height: .92;
      text-shadow: 2px 2px 0 ${T.yellow};
    }

    .ob-root-name:has(.ob-screen-name) .ob-name-brand-question {
      display: inline-block;
      margin-left: .015em;
      color: ${T.orange};
      transform: rotate(7deg) translateY(-.015em);
      transform-origin: 60% 65%;
    }

    .ob-root-name:has(.ob-screen-name) .ob-fit {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100svh;
      min-height: 100svh;
      flex: 0 0 100svh;
      margin: 0;
      padding: 0;
      gap: 0;
    }

    .ob-root-name:has(.ob-screen-name) .ob-screen-name {
      --ob-name-form-gap: clamp(8px, 1.6svh, 14px);
      width: 100%;
      max-width: none;
      height: 100svh;
      position: relative;
      margin: 0;
      padding: 0 17px;
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: 70svh;
      grid-template-areas:
        "art";
      align-content: start;
      overflow: visible;
    }

    .ob-root-name:has(.ob-screen-name) .ob-screen-name .ob-art {
      display: none;
      width: calc(100% + 34px);
      min-width: 0;
      height: 70svh;
      max-height: none;
      aspect-ratio: auto;
      justify-self: stretch;
      align-self: stretch;
      margin-left: -17px;
      overflow: hidden;
      background: var(--tint);
      border: 0;
      border-radius: 0;
      box-shadow: none;
    }

    .ob-root-name:has(.ob-screen-name) .ob-screen-name .ob-art::before,
    .ob-root-name:has(.ob-screen-name) .ob-screen-name .ob-art::after {
      display: none;
    }

    .ob-root-name:has(.ob-screen-name) .ob-screen-name .ob-art svg {
      width: min(88%, 520px);
      height: auto;
      max-height: 52svh;
    }

    .ob-root-name:has(.ob-screen-name) .ob-screen-name .ob-title {
      position: absolute;
      right: 17px;
      bottom: calc(max(16px, env(safe-area-inset-bottom)) + 64px + 74px + clamp(8px, 1.6vh, 14px) + 40px + 12dvh);
      left: 17px;
      width: auto;
      max-width: 100%;
      font-family: var(--body);
      font-size: clamp(30px, 9.5vw, 39px);
      font-weight: 800;
      letter-spacing: -.055em;
      line-height: 1.06;
      text-transform: none;
      transition: bottom .4s cubic-bezier(.22, 1, .36, 1);
    }

    .ob-root-name:has(.ob-screen-name) .ob-screen-name .ob-title-tablet-line {
      display: block;
    }

    .ob-root-name:has(.ob-screen-name) .ob-screen-name .ob-title::after {
      display: none;
    }

    .ob-root-name:has(.ob-screen-name) .ob-screen-name .ob-field {
      position: absolute;
      right: 17px;
      bottom: calc(max(16px, env(safe-area-inset-bottom)) + 64px + 40px + 12dvh);
      left: 17px;
      width: auto;
      gap: 0;
      padding-top: 0;
      transition: bottom .4s cubic-bezier(.22, 1, .36, 1);
    }

    .ob-root-name:has(.ob-screen-name) .ob-screen-name .ob-input {
      height: 74px;
      min-height: 74px;
    }

    .ob-root-name:has(.ob-screen-name):not(.ob-name-ready) .ob-actions {
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      transition: opacity .4s ease, visibility 0s linear .4s;
    }

    .ob-root-name.ob-name-ready:has(.ob-screen-name) .ob-actions {
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
      transition: opacity .4s ease, visibility 0s;
    }

    .ob-root-name:has(.ob-screen-name):not(.ob-name-ready) .ob-screen-name .ob-title {
      bottom: calc(max(16px, env(safe-area-inset-bottom)) + 69px + var(--ob-name-form-gap) + 4svh);
    }

    .ob-root-name:has(.ob-screen-name):not(.ob-name-ready) .ob-screen-name .ob-field {
      bottom: calc(max(16px, env(safe-area-inset-bottom)) - 5px + 4svh);
    }

    .ob-root-name.ob-name-ready:has(.ob-screen-name) .ob-screen-name .ob-title {
      bottom: calc(max(16px, env(safe-area-inset-bottom)) + 64px + 74px + clamp(8px, 1.6svh, 14px) + 40px - 2svh);
    }

    .ob-root-name.ob-name-ready:has(.ob-screen-name) .ob-screen-name .ob-field {
      bottom: calc(max(16px, env(safe-area-inset-bottom)) + 64px + 40px - 2svh);
    }

    .ob-root-name:has(.ob-screen-name) .ob-actions {
      position: fixed;
      right: 17px;
      bottom: max(16px, env(safe-area-inset-bottom));
      left: 17px;
      z-index: 20;
      width: auto;
      max-width: 500px;
      margin: 0 auto;
      padding: 0;
    }

    .ob-root-split:not(.ob-root-name):not(:has(.ob-screen-photo)) {
      overflow: hidden;
    }

    .ob-root-split:not(.ob-root-name):not(:has(.ob-screen-photo)) .ob-head {
      position: absolute;
      top: 0;
      right: 0;
      left: 0;
      z-index: 50;
      width: 100%;
      justify-content: space-between;
      padding: max(12px, env(safe-area-inset-top)) 17px 0;
      background: transparent;
      border: 0;
      box-shadow: none;
    }

    .ob-root-split:not(.ob-root-name):not(:has(.ob-screen-photo)) .ob-name-brand {
      display: block;
      position: fixed;
      z-index: 51;
      top: max(18px, env(safe-area-inset-top));
      left: 50%;
      transform: translateX(-50%);
      color: var(--main);
      font-family: 'Bowlby One SC', var(--heavy);
      font-size: 32px;
      font-weight: 400;
      letter-spacing: -.065em;
      line-height: .92;
      text-shadow: 2px 2px 0 ${T.yellow};
    }

    .ob-root-split:not(.ob-root-name):not(:has(.ob-screen-photo)) .ob-name-brand-question {
      display: inline-block;
      margin-left: .015em;
      color: ${T.orange};
      transform: rotate(7deg) translateY(-.015em);
      transform-origin: 60% 65%;
    }

    .ob-root-split:not(.ob-root-name):not(:has(.ob-screen-photo)) .ob-name-scene {
      display: block;
      position: fixed;
      inset: 0 0 auto;
      z-index: 0;
      width: 100%;
      height: calc(70dvh + 8px);
      overflow: hidden;
      pointer-events: none;
      background: var(--page);
    }

    .ob-root-split:not(.ob-root-name):not(:has(.ob-screen-photo)) .ob-name-visual::after {
      content: '';
      position: absolute;
      right: 0;
      bottom: 0;
      left: 0;
      z-index: 5;
      height: 8px;
      background: var(--page);
      pointer-events: none;
    }

    .ob-root-split:not(.ob-root-name):not(:has(.ob-screen-photo)) .ob-name-visual {
      position: absolute;
      inset: 0;
      overflow: hidden;
    }

    .ob-root-split:not(.ob-root-name):not(:has(.ob-screen-photo)) .ob-name-frame,
    .ob-root-split:not(.ob-root-name):not(:has(.ob-screen-photo)) .ob-dob-frame {
      position: absolute;
      inset: 0;
      -webkit-mask-image: none;
      mask-image: none;
    }

    .ob-root-split:not(.ob-root-name):not(:has(.ob-screen-photo)) .ob-name-frame:not(.is-fallback)::after,
    .ob-root-split:not(.ob-root-name):not(:has(.ob-screen-photo)) .ob-dob-frame:not(.is-fallback)::after {
      content: '';
      position: absolute;
      right: 0;
      bottom: 0;
      left: 0;
      z-index: 2;
      height: clamp(36px, 7vh, 64px);
      pointer-events: none;
      background: linear-gradient(180deg, transparent, var(--page));
      -webkit-backdrop-filter: blur(23.1px);
      backdrop-filter: blur(23.1px);
      -webkit-mask-image: linear-gradient(180deg, transparent, #000 43%);
      mask-image: linear-gradient(180deg, transparent, #000 43%);
    }

    .ob-root-split:not(.ob-root-name):not(:has(.ob-screen-photo)) .ob-name-frame img:not(.ob-scene-depth),
    .ob-root-split:not(.ob-root-name):not(:has(.ob-screen-photo)) .ob-dob-frame img:not(.ob-scene-depth) {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center 58%;
      transform: none;
    }

    .ob-root-split:not(.ob-root-name):not(:has(.ob-screen-photo)) .ob-name-frame img.ob-scene-depth,
    .ob-root-split:not(.ob-root-name):not(:has(.ob-screen-photo)) .ob-dob-frame img.ob-scene-depth {
      top: -5%;
      left: 0;
      width: 100%;
      height: 110%;
      transform: none;
    }

    .ob-root-split:not(.ob-root-name):not(:has(.ob-screen-photo)) .ob-name-frame.is-fallback,
    .ob-root-split:not(.ob-root-name):not(:has(.ob-screen-photo)) .ob-dob-frame.is-fallback {
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--tint);
    }

    .ob-root-split:not(.ob-root-name):not(:has(.ob-screen-photo)) .ob-name-frame.is-fallback > svg,
    .ob-root-split:not(.ob-root-name):not(:has(.ob-screen-photo)) .ob-dob-frame.is-fallback > svg {
      position: relative;
      z-index: 2;
      display: block;
      width: min(88%, 520px);
      max-height: 52dvh;
      height: auto;
    }

    .ob-root-split:not(.ob-root-name):not(:has(.ob-screen-photo)) .ob-fit {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100dvh;
      min-height: 100dvh;
      flex: 0 0 100dvh;
      margin: 0;
      padding: 0;
      gap: 0;
    }

    .ob-root-split:not(.ob-root-name):not(:has(.ob-screen-photo)) .ob-screen {
      position: absolute;
      top: 70dvh;
      right: 0;
      bottom: 0;
      left: 0;
      width: 100%;
      max-width: none;
      max-height: 30dvh;
      margin: 0;
      padding: 10px 17px calc(88px + max(16px, env(safe-area-inset-bottom)));
      grid-template-columns: minmax(0, 1fr);
      grid-template-areas:
        "title"
        "hint"
        "field";
      align-content: start;
      row-gap: 8px;
      overflow-x: hidden;
      overflow-y: auto;
      overscroll-behavior: contain;
      -webkit-overflow-scrolling: touch;
    }

    .ob-root-split:not(.ob-root-name):not(:has(.ob-screen-photo)) .ob-screen .ob-title {
      max-width: 100%;
      font-family: var(--body);
      font-size: clamp(28px, 8vw, 34px);
      font-weight: 800;
      letter-spacing: -.055em;
      line-height: 1.06;
      text-transform: none;
    }

    .ob-root-split:not(.ob-root-name):not(:has(.ob-screen-photo)) .ob-title-tablet-line {
      display: block;
    }

    .ob-root-split:not(.ob-root-name):not(:has(.ob-screen-photo)) .ob-title::after {
      display: none;
    }

    .ob-root-split:not(.ob-root-name):not(:has(.ob-screen-photo)) .ob-screen .ob-hint {
      font-size: 13px;
      line-height: 1.45;
    }

    .ob-root-split:not(.ob-root-name):not(:has(.ob-screen-photo)) .ob-art {
      display: none;
    }

    .ob-root-split:not(.ob-root-name):not(:has(.ob-screen-photo)) .ob-field {
      gap: 10px;
      padding-top: 0;
    }

    .ob-root-split:not(.ob-root-name):not(:has(.ob-screen-photo)) .ob-chip {
      min-height: 50px;
      padding: 12px 14px;
      font-size: 15px;
    }

    .ob-root-split:not(.ob-root-name):not(:has(.ob-screen-photo)) .ob-actions {
      position: fixed;
      right: 17px;
      bottom: max(16px, env(safe-area-inset-bottom));
      left: 17px;
      z-index: 20;
      width: auto;
      max-width: 500px;
      margin: 0 auto;
      padding: 0;
    }

    .ob-root-split.ob-root-dob:has(.ob-screen-dob) .ob-screen-dob {
      display: block;
      top: 0;
      bottom: auto;
      height: 100dvh;
      max-height: none;
      padding: 0 17px;
      overflow: hidden;
    }

    .ob-root-split.ob-root-dob:has(.ob-screen-dob) .ob-screen-dob .ob-title {
      position: absolute;
      right: 17px;
      bottom: calc(max(16px, env(safe-area-inset-bottom)) - 5px + 4dvh + 56px + 10px);
      left: 17px;
      width: auto;
      max-width: 100%;
      transition: bottom .4s cubic-bezier(.22, 1, .36, 1);
    }

    .ob-root-split.ob-root-dob:has(.ob-screen-dob) .ob-screen-dob .ob-field {
      position: absolute;
      right: 17px;
      bottom: calc(max(16px, env(safe-area-inset-bottom)) - 5px + 4dvh);
      left: 17px;
      width: auto;
      gap: 8px;
      padding-top: 0;
      transition: bottom .4s cubic-bezier(.22, 1, .36, 1);
    }

    .ob-root-split.ob-root-dob:has(.ob-screen-dob) .ob-screen-dob .ob-dob {
      height: 56px;
      min-height: 56px;
    }

    .ob-root-split.ob-root-dob:has(.ob-screen-dob) .ob-screen-dob .ob-age-slot {
      height: 0;
      flex-basis: 0;
      overflow: hidden;
    }

    .ob-root-split.ob-root-dob:has(.ob-screen-dob):has(.ob-age) .ob-screen-dob .ob-title {
      bottom: calc(max(16px, env(safe-area-inset-bottom)) - 5px + 4dvh + 56px + 8px + 72px + 10px);
    }

    .ob-root-split.ob-root-dob.ob-dob-ready:has(.ob-screen-dob) .ob-screen-dob .ob-title {
      bottom: calc(max(16px, env(safe-area-inset-bottom)) + 56px + 12px + 100px + 4px);
    }

    .ob-root-split.ob-root-dob.ob-dob-ready:has(.ob-screen-dob) .ob-screen-dob .ob-field {
      bottom: calc(max(16px, env(safe-area-inset-bottom)) + 56px + 12px);
    }

    .ob-root-split.ob-root-dob:has(.ob-screen-dob):has(.ob-age) .ob-screen-dob .ob-age-slot {
      height: 72px;
      flex-basis: 72px;
      overflow: visible;
    }

    .ob-root-split.ob-root-dob.ob-dob-ready:has(.ob-screen-dob) .ob-screen-dob .ob-age-slot {
      height: 36px;
      flex-basis: 36px;
    }

    .ob-root-split.ob-root-dob:has(.ob-screen-dob) .ob-age {
      padding: 6px 12px;
    }

    .ob-root-split.ob-root-dob:has(.ob-screen-dob) .ob-age-warning {
      top: 42px;
    }

    .ob-root-split.ob-root-dob:has(.ob-screen-dob) .ob-actions {
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      transition: opacity .4s ease, visibility 0s linear .4s;
    }

    .ob-root-split.ob-root-dob.ob-dob-ready:has(.ob-screen-dob) .ob-actions {
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
      transition: opacity .4s ease, visibility 0s;
    }

    .ob-root-dob .ob-actions .ob-foot {
      display: none;
    }

    .ob-root-split.ob-root-dob:has(.ob-screen-dob) .ob-actions .ob-cta {
      height: 56px;
      min-height: 56px;
      padding: 12px 20px;
    }

    .ob-root-name.ob-keyboard-open:has(.ob-screen-name),
    .ob-root-split.ob-root-dob.ob-keyboard-open:has(.ob-screen-dob) {
      height: var(--ob-visible-height);
      min-height: 0;
      flex: 0 0 var(--ob-visible-height);
      overflow-x: hidden;
      overflow-y: auto;
      overscroll-behavior-y: contain;
      -webkit-overflow-scrolling: touch;
      touch-action: pan-y;
    }

    .ob-root-name.ob-keyboard-open:has(.ob-screen-name) .ob-name-scene,
    .ob-root-split.ob-root-dob.ob-keyboard-open:has(.ob-screen-dob) .ob-name-scene {
      position: absolute;
      inset: 0 0 auto;
      height: 70svh;
    }

    .ob-root-name.ob-keyboard-open:has(.ob-screen-name) .ob-name-brand,
    .ob-root-split.ob-root-dob.ob-keyboard-open:has(.ob-screen-dob) .ob-name-brand {
      position: absolute;
    }

    .ob-root-name.ob-keyboard-open:has(.ob-screen-name) .ob-fit,
    .ob-root-split.ob-root-dob.ob-keyboard-open:has(.ob-screen-dob) .ob-fit {
      position: relative;
      inset: auto;
      width: 100%;
      height: 100svh;
      min-height: 100svh;
      flex: 0 0 100svh;
      margin: 0;
    }

    .ob-root-split.ob-root-dob.ob-keyboard-open:has(.ob-screen-dob) .ob-screen-dob {
      height: 100svh;
      max-height: none;
      overflow: visible;
    }

    .ob-root-name.ob-keyboard-open:has(.ob-screen-name) .ob-actions,
    .ob-root-split.ob-root-dob.ob-keyboard-open:has(.ob-screen-dob) .ob-actions {
      position: absolute;
      bottom: max(16px, env(safe-area-inset-bottom));
    }

    .ob-root:has(.ob-screen-photo) .ob-head {
      position: absolute;
      right: 0;
      left: 0;
      width: 100%;
      justify-content: space-between;
      padding: max(12px, env(safe-area-inset-top)) 17px 0;
      background: transparent;
      border: 0;
      box-shadow: none;
    }

    .ob-root:has(.ob-screen-photo) .ob-name-brand {
      display: block;
      position: fixed;
      z-index: 51;
      top: max(18px, env(safe-area-inset-top));
      left: 50%;
      transform: translateX(-50%);
      color: var(--main);
      font-family: 'Bowlby One SC', var(--heavy);
      font-size: 32px;
      font-weight: 400;
      letter-spacing: -.065em;
      line-height: .92;
      text-shadow: 2px 2px 0 ${T.yellow};
    }

    .ob-root:has(.ob-screen-photo) .ob-fit {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100dvh;
      min-height: 100dvh;
      flex: 0 0 100dvh;
      margin: 0;
      padding: 0;
      gap: 0;
    }

    .ob-root:has(.ob-screen-photo) .ob-screen-photo {
      grid-template-rows: minmax(0, 70dvh) auto;
      grid-template-areas:
        "field"
        "title";
      width: 100%;
      min-height: 100dvh;
      margin: 0;
      padding: 0 17px;
      align-content: stretch;
    }

    .ob-root:has(.ob-screen-photo) .ob-screen-photo .ob-field {
      width: calc(100% + 34px);
      height: 70dvh;
      max-width: none;
      margin-left: -17px;
      padding-top: 0;
      overflow: hidden;
    }

    .ob-root:has(.ob-screen-photo) .ob-screen-photo .ob-photo,
    .ob-root:has(.ob-screen-photo) .ob-screen-photo .ob-photo.filled {
      width: 100%;
      height: 100%;
      max-height: none;
      min-height: 0;
      aspect-ratio: auto;
      border: 0;
      border-radius: 0;
      box-shadow: none;
    }

    .ob-root:has(.ob-screen-photo) .ob-screen-photo .ob-title {
      position: relative;
      top: -2dvh;
      width: 100%;
      max-width: none;
      padding: 10px 0 90px;
      font-family: var(--body);
      font-size: clamp(28px, 8vw, 34px);
      font-weight: 800;
      letter-spacing: -.055em;
      line-height: 1.06;
      text-transform: none;
    }

    .ob-root:has(.ob-screen-photo) .ob-title-tablet-line {
      display: block;
    }

    .ob-root:has(.ob-screen-photo) .ob-title::after {
      display: none;
    }

    .ob-root:has(.ob-screen-photo) .ob-actions {
      position: fixed;
      right: 17px;
      bottom: max(16px, env(safe-area-inset-bottom));
      left: 17px;
      z-index: 20;
      width: auto;
      max-width: 500px;
      margin: 0 auto;
      padding: 0;
    }

    .ob-root:has(.ob-screen-photo) .ob-cta {
      color: #FFF9F4;
    }

    .ob-root-gender {
      overflow: hidden;
    }

    .ob-root-split.ob-root-gender:not(.ob-root-name):not(:has(.ob-screen-photo)) .ob-screen-gender {
      top: auto;
      right: 0;
      bottom: max(40px, calc(env(safe-area-inset-bottom) + 24px));
      left: 0;
      height: auto;
      max-height: none;
      padding: 10px 17px 6px;
      overflow: visible;
      transition: translate .45s cubic-bezier(.22, 1, .36, 1);
    }

    .ob-root-split.ob-root-gender.ob-gender-ready:not(.ob-root-name):not(:has(.ob-screen-photo)) .ob-screen-gender {
      translate: 0 -76px;
    }

    .ob-root-interestedin:has(.ob-screen-interestedin),
    .ob-root-year:has(.ob-screen-year),
    .ob-root-intent:has(.ob-screen-intent),
    .ob-root-location:has(.ob-screen-location) {
      overflow: hidden;
    }

    .ob-root-split.ob-root-interestedin .ob-screen-interestedin,
    .ob-root-split.ob-root-year .ob-screen-year,
    .ob-root-split.ob-root-intent .ob-screen-intent,
    .ob-root-split.ob-root-location .ob-screen-location {
      top: auto;
      bottom: max(40px, calc(env(safe-area-inset-bottom) + 24px));
      height: auto;
      max-height: none;
      padding: 10px 17px 0;
      overflow: visible;
      transition: translate .45s cubic-bezier(.22, 1, .36, 1);
    }

    .ob-root-split.ob-root-gender:not(.ob-root-name):not(:has(.ob-screen-photo)) .ob-fit,
    .ob-root-split.ob-root-interestedin:not(.ob-root-name):not(:has(.ob-screen-photo)) .ob-fit,
    .ob-root-split.ob-root-year:not(.ob-root-name):not(:has(.ob-screen-photo)) .ob-fit,
    .ob-root-split.ob-root-intent:not(.ob-root-name):not(:has(.ob-screen-photo)) .ob-fit,
    .ob-root-split.ob-root-location:not(.ob-root-name):not(:has(.ob-screen-photo)) .ob-fit {
      z-index: 1;
    }

    .ob-root-split.ob-root-interestedin:not(.ob-root-name):not(:has(.ob-screen-photo)) .ob-screen-interestedin,
    .ob-root-split.ob-root-year:not(.ob-root-name):not(:has(.ob-screen-photo)) .ob-screen-year,
    .ob-root-split.ob-root-intent:not(.ob-root-name):not(:has(.ob-screen-photo)) .ob-screen-intent,
    .ob-root-split.ob-root-location:not(.ob-root-name):not(:has(.ob-screen-photo)) .ob-screen-location {
      top: auto;
      height: auto;
      max-height: none;
      overflow: visible;
    }

    .ob-root-split.ob-root-interestedin .ob-screen-interestedin {
      translate: 0 7dvh;
    }

    .ob-root-split.ob-root-year .ob-screen-year {
      translate: 0 10dvh;
    }

    .ob-root-split.ob-root-intent .ob-screen-intent {
      translate: 0 10dvh;
    }

    .ob-root-split.ob-root-gender:not(:has(.ob-screen-photo)) .ob-actions,
    .ob-root-split.ob-root-interestedin .ob-actions,
    .ob-root-split.ob-root-year .ob-actions,
    .ob-root-split.ob-root-intent .ob-actions,
    .ob-root-split.ob-root-location .ob-actions {
      bottom: max(40px, calc(env(safe-area-inset-bottom) + 24px));
    }

    .ob-root-interestedin.ob-interestedin-ready .ob-screen-interestedin,
    .ob-root-year.ob-year-ready .ob-screen-year,
    .ob-root-intent.ob-intent-ready .ob-screen-intent,
    .ob-root-location.ob-location-ready .ob-screen-location {
      translate: 0 -76px;
    }

    .ob-root-interestedin.ob-interestedin-ready .ob-screen-interestedin {
      translate: 0 calc(7dvh - 76px);
    }

    .ob-root-year.ob-year-ready .ob-screen-year {
      translate: 0 calc(10dvh - 76px);
    }

    .ob-root-intent.ob-intent-ready .ob-screen-intent {
      translate: 0 calc(10dvh - 76px);
    }

    .ob-root.ob-screen-transitioning.ob-gender-ready .ob-screen-gender,
    .ob-root.ob-screen-transitioning.ob-location-ready .ob-screen-location {
      translate: 0 -76px !important;
    }

    .ob-root.ob-screen-transitioning.ob-year-ready .ob-screen-year {
      translate: 0 calc(10dvh - 76px) !important;
    }

    .ob-root.ob-screen-transitioning.ob-intent-ready .ob-screen-intent {
      translate: 0 calc(10dvh - 76px) !important;
    }

    .ob-root.ob-screen-transitioning.ob-interestedin-ready .ob-screen-interestedin {
      translate: 0 calc(7dvh - 76px) !important;
    }

  }

  @media (min-width: 601px) and (max-width: 1049px) and (orientation: portrait) {
    .ob-root-interestedin:has(.ob-screen-interestedin),
    .ob-root-year:has(.ob-screen-year),
    .ob-root-intent:has(.ob-screen-intent),
    .ob-root-location:has(.ob-screen-location) {
      overflow: hidden;
    }

    .ob-root-interestedin .ob-screen-interestedin,
    .ob-root-year .ob-screen-year,
    .ob-root-intent .ob-screen-intent,
    .ob-root-location .ob-screen-location {
      transition: translate .45s cubic-bezier(.22, 1, .36, 1);
    }

    .ob-root-interestedin.ob-interestedin-ready .ob-screen-interestedin,
    .ob-root-year.ob-year-ready .ob-screen-year,
    .ob-root-intent.ob-intent-ready .ob-screen-intent,
    .ob-root-location.ob-location-ready .ob-screen-location {
      translate: 0 -68px;
    }

    .ob-root.ob-screen-transitioning.ob-gender-ready .ob-screen-gender,
    .ob-root.ob-screen-transitioning.ob-interestedin-ready .ob-screen-interestedin,
    .ob-root.ob-screen-transitioning.ob-year-ready .ob-screen-year,
    .ob-root.ob-screen-transitioning.ob-intent-ready .ob-screen-intent,
    .ob-root.ob-screen-transitioning.ob-location-ready .ob-screen-location {
      translate: 0 -68px !important;
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

  @media (max-height: 700px) and (max-width: 600px) {
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

  .ob-root:has(.ob-screen-gender),
  .ob-root:has(.ob-screen-interestedin),
  .ob-root:has(.ob-screen-year),
  .ob-root:has(.ob-screen-intent),
  .ob-root:has(.ob-screen-location) {
    overflow-y: hidden;
    overscroll-behavior-y: none;
  }

  .ob-root:has(.ob-screen-gender) .ob-screen-gender,
  .ob-root:has(.ob-screen-interestedin) .ob-screen-interestedin,
  .ob-root:has(.ob-screen-year) .ob-screen-year,
  .ob-root:has(.ob-screen-intent) .ob-screen-intent,
  .ob-root:has(.ob-screen-location) .ob-screen-location {
    overflow-y: hidden !important;
    overscroll-behavior-y: none;
    -webkit-overflow-scrolling: auto;
  }

  .ob-root.ob-screen-transitioning .ob-screen {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
  }

  .ob-root-name.ob-transitioning-from-dob .ob-screen-dob,
  .ob-root-gender.ob-transitioning-from-dob .ob-screen-dob,
  .ob-root-dob.ob-transitioning-from-gender .ob-screen-gender {
    display: none !important;
  }

  .ob-root-dob.ob-transitioning-from-name .ob-screen-name {
    display: none !important;
  }

  .ob-root.ob-screen-transitioning .ob-screen-name,
  .ob-root.ob-screen-transitioning .ob-screen-dob,
  .ob-root.ob-screen-transitioning .ob-screen-gender,
  .ob-root.ob-screen-transitioning .ob-screen-interestedin,
  .ob-root.ob-screen-transitioning .ob-screen-year,
  .ob-root.ob-screen-transitioning .ob-screen-intent,
  .ob-root.ob-screen-transitioning .ob-screen-location {
    translate: 0 0 !important;
  }

  .ob-root.ob-screen-transitioning.ob-selection-flow-transitioning[data-transition-from="gender"] .ob-screen-gender,
  .ob-root.ob-screen-transitioning.ob-selection-flow-transitioning[data-transition-from="interestedIn"] .ob-screen-interestedin,
  .ob-root.ob-screen-transitioning.ob-selection-flow-transitioning[data-transition-from="year"] .ob-screen-year,
  .ob-root.ob-screen-transitioning.ob-selection-flow-transitioning[data-transition-from="intent"] .ob-screen-intent {
    display: none !important;
  }

  .ob-root-photo.ob-screen-transitioning[data-transition-from="intent"] .ob-screen-intent {
    display: none !important;
  }

  .ob-root.ob-screen-transitioning .ob-actions {
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transition: opacity 0s, visibility 0s;
  }

  .ob-root.ob-screen-transitioning:has(.ob-screen-photo) .ob-actions {
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transition: opacity 0s, visibility 0s;
  }

  @media (max-width: 600px) {
    .ob-root-name:has(.ob-screen-name) .ob-name-frame:not(.is-fallback)::after,
    .ob-root-split:not(.ob-root-name):not(:has(.ob-screen-photo)) .ob-name-frame:not(.is-fallback)::after,
    .ob-root-split:not(.ob-root-name):not(:has(.ob-screen-photo)) .ob-dob-frame:not(.is-fallback)::after {
      height: clamp(81px, 15.75vh, 144px);
      -webkit-backdrop-filter: blur(52px);
      backdrop-filter: blur(52px);
      -webkit-mask-image: linear-gradient(180deg, transparent, #000 20%);
      mask-image: linear-gradient(180deg, transparent, #000 20%);
    }

    .ob-name-scene .ob-name-frame img:not(.ob-scene-depth),
    .ob-name-scene .ob-dob-frame img:not(.ob-scene-depth) {
      position: relative;
      top: -1px;
      height: calc(100% + 1px);
    }

    .ob-name-scene .ob-name-frame img.ob-scene-depth,
    .ob-name-scene .ob-dob-frame img.ob-scene-depth {
      position: absolute;
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
    enter: (custom) => reduceMotion || custom?.instant
      ? { opacity: 1, x: 0, scale: 1 }
      : { opacity: 0, x: (typeof custom === 'number' ? custom : custom?.direction ?? 0) * 65, scale: .97, filter: 'blur(3px)' },
    center: (custom) => ({
      opacity: 1,
      x: 0,
      scale: 1,
      filter: 'blur(0px)',
      transition: custom?.instant ? { duration: 0 } : {
        type: 'spring',
        stiffness: 300,
        damping: 29,
        staggerChildren: .055,
        delayChildren: .025,
      },
    }),
    exit: (custom) => custom?.instant
      ? { opacity: 1, x: 0, scale: 1, filter: 'blur(0px)', transition: { duration: 0 } }
      : reduceMotion
        ? { opacity: 0, transition: { duration: .12 } }
        : {
          opacity: 0,
          x: (typeof custom === 'number' ? custom : custom?.direction ?? 0) * -48,
          scale: .985,
          filter: 'blur(2px)',
          transition: { duration: .18, ease: 'easeIn' },
        },
  },
  item: {
    enter: (custom) => reduceMotion || custom?.instant ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 },
    center: (custom) => ({
      opacity: 1,
      y: 0,
      transition: custom?.instant ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 30 },
    }),
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

const Onboarding = ({ onComplete, onSignOut }) => {
  const reduceMotion = useReducedMotion();
  const config = useAppConfig();
  const { login } = useAuth();
  const fileRef = useRef(null);
  const rootRef = useRef(null);
  const previewRef = useRef(null);
  const photoControlRef = useRef(null);
  const logoutDialogRef = useRef(null);
  const draftSaveRef = useRef(Promise.resolve());
  const nameInputEditedRef = useRef(false);
  const draftInteractionRef = useRef(false);
  const V = useScreenVariants(reduceMotion);

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(0);
  const [screenTransitioning, setScreenTransitioning] = useState(false);
  const transitioningFromRef = useRef(null);
  const transitioningToRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [logoutSaving, setLogoutSaving] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const [photoMenuOpen, setPhotoMenuOpen] = useState(false);
  const [preview, setPreview] = useState(null);
  const [sceneInputFocused, setSceneInputFocused] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [namePhotoFailed, setNamePhotoFailed] = useState(false);
  const [birthdayPhotoFailed, setBirthdayPhotoFailed] = useState(false);
  const [genderPhotoFailed, setGenderPhotoFailed] = useState(false);
  const [meetingPhotoFailed, setMeetingPhotoFailed] = useState(false);
  const [chapterPhotoFailed, setChapterPhotoFailed] = useState(false);
  const [intentPhotoFailed, setIntentPhotoFailed] = useState(false);
  const [locationPhotoFailed, setLocationPhotoFailed] = useState(false);

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
      if (draftInteractionRef.current) return;

      setFormData((prev) => ({
        ...prev,
        ...saved,
        name: nameInputEditedRef.current ? prev.name : (prev.name || saved.name || ''),
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
    const root = rootRef.current;
    const visualViewport = window.visualViewport;
    let keyboardBaseHeight = window.innerHeight;
    const tabletPortrait = window.matchMedia(
      '(min-width: 601px) and (max-width: 1049px) and (orientation: portrait)',
    );
    const phoneViewport = window.matchMedia('(max-width: 600px)');
    let frame = 0;

    const updateKeyboardLayout = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const nameInputFocused = step === 0
          && phoneViewport.matches
          && root?.contains(document.activeElement)
          && document.activeElement.matches('.ob-screen-name input.ob-input');
        const dobInputFocused = step === 1
          && root?.contains(document.activeElement)
          && document.activeElement.matches('.ob-screen-dob input.ob-dob');
        const inputFocused = nameInputFocused || dobInputFocused;
        const visibleHeight = visualViewport?.height ?? window.innerHeight;
        const tabletKeyboardOpen = tabletPortrait.matches
          && dobInputFocused
          && (visibleHeight < 700 || window.innerHeight - visibleHeight > 120);
        const phoneKeyboardOpen = phoneViewport.matches
          && inputFocused
          && (
            keyboardBaseHeight - visibleHeight > 120
            || window.innerHeight - visibleHeight > 120
            || visibleHeight < 560
          );
        const isKeyboardOpen = tabletKeyboardOpen || phoneKeyboardOpen;

        if (!inputFocused) {
          keyboardBaseHeight = Math.max(window.innerHeight, visibleHeight);
        }

        if (isKeyboardOpen) {
          root.style.setProperty('--ob-visible-height', `${visibleHeight}px`);
          if (dobInputFocused && tabletPortrait.matches) {
            root.style.setProperty('--ob-scene-height', `${visibleHeight * (phoneKeyboardOpen ? .22 : .28)}px`);
            root.style.setProperty('--ob-form-height', `${visibleHeight * (phoneKeyboardOpen ? .78 : .72)}px`);
          } else {
            root.style.removeProperty('--ob-scene-height');
            root.style.removeProperty('--ob-form-height');
          }
        } else {
          root.classList.remove('ob-keyboard-open');
          root.style.removeProperty('--ob-visible-height');
          root.style.removeProperty('--ob-scene-height');
          root.style.removeProperty('--ob-form-height');
        }

        setKeyboardOpen((wasOpen) => (
          wasOpen === isKeyboardOpen ? wasOpen : isKeyboardOpen
        ));
      });
    };

    visualViewport?.addEventListener('resize', updateKeyboardLayout);
    visualViewport?.addEventListener('scroll', updateKeyboardLayout);
    window.addEventListener('resize', updateKeyboardLayout);
    window.addEventListener('focusin', updateKeyboardLayout);
    window.addEventListener('focusout', updateKeyboardLayout);
    updateKeyboardLayout();

    return () => {
      cancelAnimationFrame(frame);
      visualViewport?.removeEventListener('resize', updateKeyboardLayout);
      visualViewport?.removeEventListener('scroll', updateKeyboardLayout);
      window.removeEventListener('resize', updateKeyboardLayout);
      window.removeEventListener('focusin', updateKeyboardLayout);
      window.removeEventListener('focusout', updateKeyboardLayout);
      root?.style.removeProperty('--ob-visible-height');
      root?.style.removeProperty('--ob-scene-height');
      root?.style.removeProperty('--ob-form-height');
    };
  }, [step]);

  const saveDraft = useCallback((draft, draftStep) => {
    const save = draftSaveRef.current
      .catch(() => {})
      .then(() => api.put('/users/onboarding/save', {
        step: draftStep + 1,
        data: { ...draft, __step: draftStep },
      }));

    draftSaveRef.current = save;
    return save;
  }, []);

  useEffect(() => {
    if (!formData.name.trim() && !formData.gender && !formData.dob) return undefined;

    const t = setTimeout(() => {
      saveDraft(formData, step).catch(() => {});
    }, 800);

    return () => clearTimeout(t);
  }, [formData, saveDraft, step]);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  useEffect(() => {
    if (!logoutConfirmOpen) return undefined;

    const onKey = (event) => {
      if (event.key === 'Escape') {
        if (!logoutSaving) setLogoutConfirmOpen(false);
        return;
      }

      if (event.key !== 'Tab') return;

      const buttons = logoutDialogRef.current?.querySelectorAll('button');
      if (!buttons?.length) return;
      const firstButton = buttons[0];
      const lastButton = buttons[buttons.length - 1];

      if (event.shiftKey && document.activeElement === firstButton) {
        event.preventDefault();
        lastButton.focus();
      } else if (!event.shiftKey && document.activeElement === lastButton) {
        event.preventDefault();
        firstButton.focus();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [logoutConfirmOpen, logoutSaving]);

  useEffect(() => {
    if (!photoMenuOpen) return undefined;

    const closePhotoMenu = (event) => {
      if (event.key === 'Escape') setPhotoMenuOpen(false);
    };
    const dismissOutside = (event) => {
      if (!photoControlRef.current?.contains(event.target)) setPhotoMenuOpen(false);
    };

    document.addEventListener('keydown', closePhotoMenu);
    document.addEventListener('pointerdown', dismissOutside);
    return () => {
      document.removeEventListener('keydown', closePhotoMenu);
      document.removeEventListener('pointerdown', dismissOutside);
    };
  }, [photoMenuOpen]);

  const update = (patch) => {
    draftInteractionRef.current = true;
    setFormData((f) => ({ ...f, ...patch }));
  };

  const toggleIn = (field, item, max = null) => {
    draftInteractionRef.current = true;
    setFormData((f) => {
      const arr = f[field] || [];
      const on = arr.includes(item);

      if (on) return { ...f, [field]: arr.filter((i) => i !== item) };

      if (max && arr.length >= max) {
        triggerHaptic('heavy');
        return f;
      }

      const next = item === 'Everyone'
        ? []
        : arr.filter((i) => i !== 'Everyone');

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

    const year = Number(dobY);
    const month = Number(dobM);
    const day = Number(dobD);
    const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    if (year < 1 || month < 1 || month > 12 || day < 1 || day > daysInMonth[month - 1]) {
      return null;
    }

    const today = new Date();
    let a = today.getFullYear() - year;
    const birthdayHasPassed = today.getMonth() + 1 > month
      || (today.getMonth() + 1 === month && today.getDate() >= day);

    return birthdayHasPassed ? a : a - 1;
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
    setPhotoMenuOpen(false);
    triggerHaptic('light');
    fileRef.current?.click();
  };

  const removePhoto = () => {
    clearPreview();
    update({ photos: [] });
    setPhotoMenuOpen(false);
    setError('');
  };

  const confirmLogout = async () => {
    if (logoutSaving) return;

    setLogoutSaving(true);
    setLogoutError('');

    try {
      await saveDraft(formData, step);
      triggerHaptic('medium');
      onSignOut();
    } catch {
      setLogoutError('We couldn’t save your progress. Please try again before logging out.');
      setLogoutSaving(false);
    }
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

    draftInteractionRef.current = true;
    setLocBusy(true);
    setLocError('');

    const res = await readLocationOnce();
    setLocBusy(false);

    if (res.ok) {
      setFormData((f) => ({ ...f, currentLatLng: res.latLng }));
      setLocationReading(true);
      setLocDeclined(false);
      return;
    }

    setLocError(
      res.reason === LOCATION_UNAVAILABLE.DENIED
        ? 'Location access is blocked or was denied. Allow Location in your browser’s site settings, then retry.'
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

      let stored = {};
      try {
        const cachedUser = localStorage.getItem('matchalize_user');
        if (cachedUser) {
          const parsedUser = JSON.parse(cachedUser);
          if (parsedUser && typeof parsedUser === 'object' && !Array.isArray(parsedUser)) {
            stored = parsedUser;
          }
        }
      } catch (storageError) {
        console.warn('Could not read the cached user after onboarding publish.', storageError);
      }
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
    const root = rootRef.current;
    if (!root) return;

    root.scrollTop = 0;
    root.scrollLeft = 0;
    root.classList.remove('ob-keyboard-open');
    root.style.removeProperty('--ob-visible-height');
    root.style.removeProperty('--ob-scene-height');
    root.style.removeProperty('--ob-form-height');
    setKeyboardOpen(false);
    if (root.contains(document.activeElement)) {
      document.activeElement.blur();
    }
  };

  const next = () => {
    draftInteractionRef.current = true;
    if (!stepDone(step)) {
      triggerHaptic('heavy');
      return;
    }

    const nextStep = Math.min(step + 1, STEPS.length - 1);
    triggerHaptic('light');
    setError('');
    setDir(1);
    transitioningFromRef.current = STEPS[step].key;
    transitioningToRef.current = STEPS[nextStep].key;
    setScreenTransitioning(true);
    setStep(nextStep);
    scrollToTop();
  };

  const back = () => {
    draftInteractionRef.current = true;
    const previousStep = Math.max(step - 1, 0);
    triggerHaptic('light');
    setError('');
    setDir(-1);
    transitioningFromRef.current = STEPS[step].key;
    transitioningToRef.current = STEPS[previousStep].key;
    setScreenTransitioning(true);
    setStep(previousStep);
    scrollToTop();
  };

  const s = STEPS[step];
  const stackedTitleMap = {
    year: ['What chapter', 'are you in, huh?'],
    intent: ['What are you hoping', 'to find, huh?'],
  };
  const stackedTitle = stackedTitleMap[s.key] || null;
  const tabletTitleLinesMap = {
    name: ['What do your friends ', 'call you, huh?'],
    dob: ['When’s your ', 'birthday, huh?'],
    gender: ['How do you describe ', 'your gender, huh?'],
    interestedIn: ['Who are you open ', 'to meeting, huh?'],
    photo: ['Give them a face to ', 'remember, huh?'],
    location: ['Which location ', 'should we use, huh?'],
  };
  const tabletTitleLines = tabletTitleLinesMap[s.key] || null;
  const hasSplitScene = SCENE_STEP_KEYS.includes(s.key);
  const hasSplitLayout = hasSplitScene || s.key === 'photo';
  const hasScenePhoto = SCENE_STEP_KEYS.includes(s.key);
  const scenePhoto = s.key === 'location'
    ? campusTownPhoto
    : s.key === 'dob' ? campusBirthdayPhoto
      : s.key === 'gender' ? identifyCampusPhoto
        : s.key === 'interestedIn' ? meetCampusPhoto
          : s.key === 'year' ? chapterCampusPhoto
            : s.key === 'intent' ? findCampusPhoto : campusNamePhoto;
  const isSceneFallback = !hasScenePhoto
    || (s.key === 'dob' ? birthdayPhotoFailed
      : s.key === 'gender' ? genderPhotoFailed
        : s.key === 'interestedIn' ? meetingPhotoFailed
          : s.key === 'year' ? chapterPhotoFailed
          : s.key === 'intent' ? intentPhotoFailed
            : s.key === 'location' ? locationPhotoFailed
            : s.key === 'name' ? namePhotoFailed
          : false);
  const isLast = step === STEPS.length - 1;
  const transitioningBetweenGenderDob = screenTransitioning
    && ((transitioningFromRef.current === 'gender' && s.key === 'dob')
      || (transitioningFromRef.current === 'dob' && s.key === 'gender'));
  const transitioningFromNameToDob = screenTransitioning
    && transitioningFromRef.current === 'name'
    && s.key === 'dob';
  const transitioningBetweenSelectionScreens = screenTransitioning
    && SELECTION_FLOW_STEP_KEYS.includes(transitioningFromRef.current)
    && SELECTION_FLOW_STEP_KEYS.includes(s.key);
  const transitionCustom = dir;
  const genders = config?.genders || ['Male', 'Female', 'Non-binary', 'Other'];
  const genderOptions = [
    ...genders
      .filter((gender) => gender !== 'Other' && gender !== 'Another identity')
      .map((gender) => ({ value: gender, label: gender })),
    { value: 'Other', label: 'Another identity' },
    { value: 'Prefer not to say', label: 'Prefer not to say' },
  ];
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
    <div
      className={`ob-root ob-root-${s.key.toLowerCase()}${hasSplitLayout ? ' ob-root-split' : ''}${keyboardOpen && (s.key === 'dob' || s.key === 'name') ? ' ob-keyboard-open' : ''}${screenTransitioning ? ' ob-screen-transitioning' : ''}${transitioningBetweenSelectionScreens ? ' ob-selection-flow-transitioning' : ''}${transitioningFromNameToDob ? ' ob-transitioning-from-name' : ''}${screenTransitioning && transitioningFromRef.current === 'dob' && (s.key === 'name' || s.key === 'gender') ? ' ob-transitioning-from-dob' : ''}${screenTransitioning && transitioningFromRef.current === 'gender' && s.key === 'dob' ? ' ob-transitioning-from-gender' : ''}${screenTransitioning && SCENE_STEP_KEYS.includes(transitioningFromRef.current) ? ' ob-scene-fade-transitioning' : ''}${s.key === 'gender' && formData.gender ? ' ob-gender-ready' : ''}${s.key === 'interestedIn' && formData.interestedIn.length > 0 ? ' ob-interestedin-ready' : ''}${s.key === 'year' && formData.year ? ' ob-year-ready' : ''}${s.key === 'intent' && formData.intent.length > 0 ? ' ob-intent-ready' : ''}${s.key === 'location' && stepDone(step) ? ' ob-location-ready' : ''}${formData.photos[0] ? ' ob-photo-ready' : ''}${uploading ? ' ob-photo-uploading' : ''}${sceneInputFocused && s.key === 'dob' ? ' ob-dob-focused' : ''}${s.key === 'name' && formData.name.trim() ? ' ob-name-ready' : ''}${s.key === 'dob' && stepDone(step) ? ' ob-dob-ready' : ''}`}
      data-transition-from={screenTransitioning ? transitioningFromRef.current || undefined : undefined}
      ref={rootRef}
    >
      <style>{CSS}</style>
      {(hasSplitScene || s.key === 'photo') && (
        <div className="ob-name-brand" aria-label="huh?">
          huh<span className="ob-name-brand-question">?</span>
        </div>
      )}
      <AnimatePresence initial={false}>
        {hasSplitScene && (
          <motion.div
            key="onboarding-scene"
            className="ob-name-scene"
            aria-hidden="true"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, transition: { duration: .18, ease: 'easeIn' } }}
          >
            <div className="ob-name-visual">
              <AnimatePresence initial={false} mode="sync">
                <motion.div
                  key={`${s.key}-${isSceneFallback ? 'fallback' : 'photo'}`}
                  className={`${s.key === 'name' ? 'ob-name-frame' : 'ob-dob-frame'}${isSceneFallback ? ' is-fallback' : ''}`}
                  initial={reduceMotion ? false : { opacity: 0, scale: 1.035 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: .985 }}
                  transition={{ duration: reduceMotion ? .01 : .55, ease: [0.22, 1, .36, 1] }}
                >
                  {isSceneFallback ? (
                    <>
                      <StepArtwork step={s.key} />
                      <div className="ob-name-backdrop-art" aria-hidden="true">
                        <StepArtwork step={s.key} />
                      </div>
                    </>
                  ) : (
                    <>
                      {hasScenePhoto && (
                        <div className="ob-name-backdrop-art" aria-hidden="true">
                          <StepArtwork step={s.key} />
                        </div>
                      )}
                      <img
                        src={scenePhoto}
                        alt=""
                        draggable="false"
                        onError={() => {
                          if (s.key === 'dob') setBirthdayPhotoFailed(true);
                          else if (s.key === 'gender') setGenderPhotoFailed(true);
                          else if (s.key === 'interestedIn') setMeetingPhotoFailed(true);
                          else if (s.key === 'year') setChapterPhotoFailed(true);
                          else if (s.key === 'intent') setIntentPhotoFailed(true);
                          else if (s.key === 'location') setLocationPhotoFailed(true);
                          else setNamePhotoFailed(true);
                        }}
                      />
                      <img
                        className="ob-scene-depth"
                        src={scenePhoto}
                        alt=""
                        aria-hidden="true"
                        draggable="false"
                      />
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
        ) : null}

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
                      setMenuOpen(false);
                      setLogoutConfirmOpen(true);
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

      <AnimatePresence>
        {logoutConfirmOpen && (
          <motion.div
            className="ob-confirm-backdrop"
            role="presentation"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0 }}
            transition={{ duration: .16 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !logoutSaving) {
                setLogoutConfirmOpen(false);
              }
            }}
          >
            <motion.div
              ref={logoutDialogRef}
              className="ob-confirm-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="ob-logout-title"
              aria-describedby="ob-logout-copy"
              initial={reduceMotion ? false : { opacity: 0, y: 12, scale: .97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: .98 }}
              transition={{ duration: .18, ease: 'easeOut' }}
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="ob-confirm-icon" aria-hidden="true">
                <LogOut size={21} strokeWidth={2.4} />
              </div>
              <h2 id="ob-logout-title" className="ob-confirm-title">Leaving so soon?</h2>
              <p id="ob-logout-copy" className="ob-confirm-copy">
                We’ll save your onboarding progress before logging you out.
              </p>
              {logoutError && (
                <p className="ob-confirm-copy" role="alert" style={{ color: T.red, marginTop: -12 }}>
                  {logoutError}
                </p>
              )}
              <div className="ob-confirm-actions">
                <button
                  type="button"
                  className="ob-confirm-button ob-confirm-stay"
                  autoFocus
                  disabled={logoutSaving}
                  onClick={() => setLogoutConfirmOpen(false)}
                >
                  Stay here
                </button>
                <button
                  type="button"
                  className="ob-confirm-button ob-confirm-logout"
                  disabled={logoutSaving}
                  onClick={confirmLogout}
                >
                  {logoutSaving ? 'Saving…' : 'Save & log out'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="ob-fit">
        <AnimatePresence
          mode={transitioningFromNameToDob
            || transitioningBetweenGenderDob
            || transitioningBetweenSelectionScreens
            || (screenTransitioning && transitioningFromRef.current === 'dob' && s.key === 'name')
            ? 'sync'
            : 'wait'}
          custom={transitionCustom}
          initial={false}
        >
          <motion.div
            key={s.key}
            className={`ob-screen ob-screen-${s.key.toLowerCase()}`}
            custom={transitionCustom}
            variants={V.screen}
            initial="enter"
            animate="center"
            exit="exit"
            onAnimationComplete={() => {
              if (transitioningToRef.current === s.key) {
                transitioningFromRef.current = null;
                transitioningToRef.current = null;
                setScreenTransitioning(false);
              }
            }}
          >
            <motion.h1 className="ob-title" custom={transitionCustom} variants={V.item}>
              {stackedTitle ? (
                stackedTitle.map((line) => (
                  <span className="ob-title-line" key={line}>{line}</span>
                ))
              ) : tabletTitleLines ? (
                tabletTitleLines.map((line) => (
                  <span className="ob-title-tablet-line" key={line}>{line}</span>
                ))
              ) : (
                s.title
              )}
            </motion.h1>

            {s.hint && (
              <motion.p className="ob-hint" custom={transitionCustom} variants={V.item}>
                {s.hint}
              </motion.p>
            )}

            {s.key !== 'photo' && (
              <motion.div className="ob-art" custom={transitionCustom} variants={V.item}>
                <StepArtwork step={s.key} />
              </motion.div>
            )}

            <motion.div className="ob-field" custom={transitionCustom} variants={V.item}>
              {s.key === 'name' && (
                <input
                  className="ob-input"
                  value={formData.name}
                  onChange={(e) => {
                    nameInputEditedRef.current = true;
                    update({ name: e.target.value.slice(0, 60) });
                  }}
                  placeholder="Your name"
                  autoCapitalize="words"
                  autoCorrect="off"
                  spellCheck="false"
                  autoComplete="given-name"
                  aria-label="Your name"
                  onFocus={() => setSceneInputFocused(true)}
                  onBlur={() => setSceneInputFocused(false)}
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
                      onFocus={() => setSceneInputFocused(true)}
                      onBlur={(e) => {
                        if (!e.relatedTarget?.classList.contains('ob-dob')) {
                          setSceneInputFocused(false);
                        }
                      }}
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
                      onFocus={() => setSceneInputFocused(true)}
                      onBlur={(e) => {
                        if (!e.relatedTarget?.classList.contains('ob-dob')) {
                          setSceneInputFocused(false);
                        }
                      }}
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
                      onFocus={() => setSceneInputFocused(true)}
                      onBlur={(e) => {
                        if (!e.relatedTarget?.classList.contains('ob-dob')) {
                          setSceneInputFocused(false);
                        }
                      }}
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

                  <div className="ob-age-slot">
                    {age !== null && (
                      <>
                        <span className={`ob-age${age >= 18 && age <= 40 ? ' ok' : ''}`}>
                          Age {age}
                        </span>
                      {(age < 18 || age > 40) && (
                          <span className="ob-age-warning" role="status">
                          {age < 18
                            ? 'You must be 18 or older to join.'
                            : 'You must be 40 or younger to join.'}
                        </span>
                      )}
                      </>
                    )}
                  </div>
                </>
              )}

              {s.key === 'photo' && (
                <>
                  {(formData.photos[0] || preview) ? (
                    <div ref={photoControlRef} className="ob-photo filled">
                      <img
                        className="ob-photo-image"
                        src={formData.photos[0] || preview}
                        alt="Your photo"
                      />
                      {preview && (
                        <img className="ob-photo-blur" src={preview} alt="" aria-hidden="true" />
                      )}

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
                            onClick={() => setPhotoMenuOpen((open) => !open)}
                            aria-label="Edit your photo"
                            aria-expanded={photoMenuOpen}
                            title="Edit your photo"
                          >
                            <Pencil size={13} strokeWidth={2.8} />
                          </button>
                          {photoMenuOpen && (
                            <div className="ob-photomenu" role="group" aria-label="Photo actions">
                              <button type="button" onClick={pickPhoto}>
                                <Pencil size={13} aria-hidden="true" />
                                Replace
                              </button>
                              <button
                                type="button"
                                className="ob-photomenu-remove"
                                onClick={removePhoto}
                              >
                                <X size={14} aria-hidden="true" />
                                Remove
                              </button>
                            </div>
                          )}
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
                  {genderOptions.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      className={`ob-chip${formData.gender === value ? ' on' : ''}`}
                      aria-pressed={formData.gender === value}
                      onClick={() => {
                        update({ gender: formData.gender === value ? '' : value });
                        triggerHaptic('light');
                      }}
                    >
                      {formData.gender === value && (
                        <Check size={17} strokeWidth={2.5} aria-hidden="true" />
                      )}
                      {label}
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
                        update({ year: formData.year === y ? '' : y });
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
                  {locationReading && (
                    <p className="ob-location-ok">
                      <Check size={17} strokeWidth={2.5} />
                      <span>
                        We’ll use your current location to help you find nearby college students.
                      </span>
                    </p>
                  )}
                  {locDeclined && (
                    <p className="ob-location-ok">
                      <Check size={17} strokeWidth={2.5} />
                      <span>
                        We’ll use your college location to help you find nearby college students.
                      </span>
                    </p>
                  )}

                  <div className="ob-chips ob-location-options">
                    <button
                      type="button"
                      className={`ob-chip${locationReading ? ' on' : ''}`}
                      aria-pressed={locationReading}
                      onClick={grantLocation}
                      disabled={locBusy}
                    >
                      {locationReading && <Check size={17} strokeWidth={2.5} />}
                      {locBusy ? 'Finding you…' : 'Share my location'}
                    </button>

                    <button
                      type="button"
                      className={`ob-chip${locDeclined ? ' on' : ''}`}
                      aria-pressed={locDeclined}
                      onClick={() => {
                        draftInteractionRef.current = true;
                        setLocDeclined(true);
                        setLocationReading(false);
                        setFormData((current) => ({ ...current, currentLatLng: null }));
                        setLocError('');
                        triggerHaptic('light');
                      }}
                      disabled={locBusy}
                    >
                      {locDeclined && <Check size={17} strokeWidth={2.5} />}
                      Use my college location
                    </button>
                  </div>

                  {locError && (
                    <p className="ob-loc-note" role="status">
                      {locError} You can retry or use your college location.
                    </p>
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
              {publishing ? 'Getting things ready…' : 'Start matching'}
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
