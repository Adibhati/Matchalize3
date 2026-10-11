
import React, { useEffect, useRef } from 'react';
import { useChromeColor } from '../utils/chrome';

const C = {
  black: '#111211',
  paper: '#F1EDE2',
  amber: '#E0A15E',
  coral: '#C96F68',
  sage: '#779477',
  concrete: '#A3A3A1',
  muted: '#77766F',
  rule: 'rgba(241,237,226,.2)',
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=IBM+Plex+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');

  .huh-page {
    --black: ${C.black};
    --paper: ${C.paper};
    --amber: ${C.amber};
    --coral: ${C.coral};
    --sage: ${C.sage};
    --concrete: ${C.concrete};
    --muted: ${C.muted};
    --rule: ${C.rule};

    width: 100%;
    height: 100vh;
    height: 100dvh;
    position: relative;
    overflow: hidden;
    isolation: isolate;
    background: var(--black);
    color: var(--paper);
    font-family: 'Space Grotesk', sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  .huh-page *,
  .huh-page *::before,
  .huh-page *::after {
    box-sizing: border-box;
  }

  .huh-page button,
  .huh-page a {
    -webkit-tap-highlight-color: transparent;
  }

  .huh-page ::selection {
    background: var(--coral);
    color: var(--black);
  }

  .huh-scroll {
    position: absolute;
    inset: 0;
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior-y: contain;
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
    scroll-padding-top: 76px;
    scrollbar-width: thin;
    scrollbar-color: var(--amber) var(--black);
  }

  .huh-scroll::-webkit-scrollbar { width: 4px; }
  .huh-scroll::-webkit-scrollbar-thumb { background: var(--amber); }

  .huh-wrap {
    width: min(1240px, 100%);
    margin-inline: auto;
    padding-inline: clamp(22px, 5vw, 68px);
  }

  /* Navigation */

  .huh-top {
    position: sticky;
    top: 0;
    z-index: 30;
    background: rgba(17,18,17,.9);
    border-bottom: 1px solid var(--rule);
    -webkit-backdrop-filter: blur(18px);
    backdrop-filter: blur(18px);
    transition: transform .32s cubic-bezier(.22,1,.36,1);
    will-change: transform;
  }

  /* Scrolling down hides the header; any scroll up brings it back. */

  .huh-top.huh-top-hidden {
    transform: translateY(-102%);
  }

  .huh-top::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    width: var(--scroll-progress, 0%);
    height: 2px;
    background: var(--coral);
  }

  .huh-top-inner {
    min-height: 70px;
    display: flex;
    align-items: center;
    gap: 22px;
  }

  .huh-logo {
    flex-shrink: 0;
    color: var(--paper);
    text-decoration: none;
    font: 900 39px/.8 'Barlow Condensed', sans-serif;
    letter-spacing: -.07em;
    text-transform: uppercase;
  }

  .huh-logo b,
  .huh-footer-logo b {
    color: var(--amber);
  }

  .huh-spacer { flex: 1; }

  .huh-login {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    min-height: 42px;
    padding: 8px 0;
    border: 0;
    border-bottom: 1px solid var(--amber);
    background: transparent;
    color: var(--paper);
    font: 600 12px 'Space Grotesk', sans-serif;
    cursor: pointer;
  }

  .huh-login span {
    color: var(--amber);
    font-size: 17px;
    transition: transform .2s ease;
  }

  .huh-login:focus-visible,
  .huh-cta:focus-visible,
  .huh-text-link:focus-visible {
    outline: 2px solid var(--coral);
    outline-offset: 5px;
  }

  /* Shared editorial details */

  .huh-eyebrow {
    display: flex;
    align-items: center;
    gap: 9px;
    margin: 0 0 17px;
    color: var(--muted);
    font: 700 9px/1.7 'IBM Plex Mono', monospace;
    letter-spacing: .11em;
    text-transform: uppercase;
  }

  .huh-eyebrow::before {
    content: '';
    flex: 0 0 7px;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--coral);
  }

  .huh-h2 {
    max-width: 760px;
    margin: 0;
    font: 900 clamp(47px,6vw,78px)/.86 'Barlow Condensed', sans-serif;
    letter-spacing: -.025em;
    text-transform: uppercase;
    text-wrap: balance;
  }

  .huh-h2 em {
    color: var(--coral);
    font-style: normal;
  }

  .huh-copy {
    max-width: 465px;
    margin: 19px 0 0;
    color: #5C5A53;
    font-size: 13px;
    line-height: 1.85;
  }

  .huh-dark-copy {
    color: rgba(241,237,226,.69);
  }

  .huh-section {
    position: relative;
    padding-block: clamp(67px,8vw,108px);
  }

  .huh-section-head {
    display: grid;
    grid-template-columns: minmax(0,1fr) minmax(220px,.66fr);
    align-items: end;
    gap: clamp(25px,6vw,78px);
  }

  /* HERO */

  .huh-hero {
    position: relative;
    overflow: hidden;
    background: var(--black);
  }

  .huh-hero::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: .11;
    background-image:
      linear-gradient(rgba(241,237,226,.13) 1px, transparent 1px),
      linear-gradient(90deg, rgba(241,237,226,.13) 1px, transparent 1px);
    background-size: 48px 48px;
    -webkit-mask-image: linear-gradient(90deg, #000, transparent 88%);
    mask-image: linear-gradient(90deg, #000, transparent 88%);
  }

  .huh-hero::after {
    content: '?';
    position: absolute;
    z-index: 0;
    top: 0;
    right: -.02em;
    color: rgba(224,161,94,.045);
    font: 900 clamp(330px,51vw,680px)/.8 'Barlow Condensed', sans-serif;
    pointer-events: none;
  }

  .huh-hero-inner {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: minmax(0,.94fr) minmax(0,1.06fr);
    align-items: center;
    gap: clamp(25px,4vw,57px);
    padding-block: clamp(52px,7vw,83px) 48px;
  }

  .huh-hero-copy { min-width: 0; }

  .huh-kicker {
    display: flex;
    align-items: center;
    gap: 9px;
    margin: 0 0 23px;
    color: var(--amber);
    font: 700 9px/1.7 'IBM Plex Mono', monospace;
    letter-spacing: .08em;
    text-transform: uppercase;
  }

  .huh-kicker::before {
    content: '';
    flex: 0 0 8px;
    width: 8px;
    height: 8px;
    background: var(--coral);
    transform: rotate(45deg);
  }

  .huh-title {
    margin: 0;
    color: var(--paper);
    font: 900 clamp(65px,8.1vw,108px)/.8 'Barlow Condensed', sans-serif;
    letter-spacing: -.037em;
    text-transform: uppercase;
    text-wrap: balance;
  }

  .huh-title .line { display: block; }

  .huh-title .outline {
    color: transparent;
    -webkit-text-stroke: 1.5px var(--paper);
  }

  .huh-title .accent { color: var(--amber); }

  .huh-hero-desc {
    max-width: 440px;
    margin: 24px 0 0;
    color: rgba(241,237,226,.73);
    font-size: 14px;
    line-height: 1.8;
  }

  .huh-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 20px;
    margin-top: 25px;
  }

  .huh-cta {
    min-height: 51px;
    max-width: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    gap: 23px;
    padding: 0 19px;
    border: 0;
    border-radius: 4px 18px 4px 18px;
    background: var(--coral);
    color: var(--black);
    font: 700 11px 'Space Grotesk', sans-serif;
    cursor: pointer;
    transition: transform .22s ease, background .22s ease;
  }

  .huh-cta .arrow {
    font-size: 19px;
    transition: transform .22s ease;
  }

  .huh-text-link {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 9px 0;
    color: var(--paper);
    text-decoration: none;
    font-size: 11px;
    font-weight: 600;
  }

  .huh-text-link span {
    color: var(--amber);
    font-size: 15px;
  }

  .huh-hero-note {
    display: flex;
    align-items: flex-start;
    gap: 9px;
    max-width: 430px;
    margin: 19px 0 0;
    color: rgba(241,237,226,.43);
    font: 8px/1.8 'IBM Plex Mono', monospace;
    text-transform: uppercase;
  }

  .huh-hero-note span {
    color: var(--sage);
    font-size: 12px;
  }

  /* APP PREVIEWS — real interface structure, no invented member details */

  .huh-showcase {
    position: relative;
    min-width: 0;
    padding: 25px 0 34px;
  }

  .huh-showcase-label {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 14px;
    color: rgba(241,237,226,.42);
    font: 8px 'IBM Plex Mono', monospace;
    letter-spacing: .1em;
    text-transform: uppercase;
  }

  .huh-showcase-label span:last-child { color: var(--sage); }

  .huh-device-stage {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    min-width: 0;
    padding: 10px 0 17px;
  }

  .huh-phone {
    position: relative;
    flex: 1 1 0;
    min-width: 0;
    max-width: 205px;
    height: 390px;
    padding: 6px;
    border: 1px solid #62635E;
    border-radius: 27px;
    background: #080908;
    box-shadow: 0 21px 43px rgba(0,0,0,.28);
    transition: transform .3s ease, border-color .3s ease;
  }

  .huh-phone:nth-child(1) {
    transform: translateY(13px) rotate(-2deg) scale(.94);
    animation: huh-float-left 6.4s ease-in-out infinite;
  }

  .huh-phone:nth-child(2) {
    z-index: 2;
    border-color: var(--paper);
    animation: huh-float-mid 7.6s ease-in-out -2.5s infinite;
  }

  .huh-phone:nth-child(3) {
    transform: translateY(15px) rotate(2deg) scale(.94);
    animation: huh-float-right 7s ease-in-out -4s infinite;
  }

  /* Idle float. The keyframes repeat each phone's base transform so the
     static fallback above still holds when motion is reduced away. */

  @keyframes huh-float-left {
    0%, 100% { transform: translateY(13px) rotate(-2deg) scale(.94); }
    50% { transform: translateY(4px) rotate(-1.2deg) scale(.945); }
  }

  @keyframes huh-float-mid {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }

  @keyframes huh-float-right {
    0%, 100% { transform: translateY(15px) rotate(2deg) scale(.94); }
    50% { transform: translateY(6px) rotate(1.2deg) scale(.945); }
  }

  .huh-phone-screen {
    position: relative;
    height: 100%;
    min-height: 0;
    overflow: hidden;
    padding: 10px 8px 11px;
    border-radius: 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: var(--paper);
    color: var(--black);
  }

  .huh-phone-screen.dark {
    background: #191A18;
    color: var(--paper);
  }

  .huh-phone-status {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 6px;
    padding: 0 3px 6px;
    font: 600 7px 'IBM Plex Mono', monospace;
  }

  .huh-status-icons { letter-spacing: .08em; }

  .huh-app-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 7px;
    min-height: 23px;
  }

  .huh-app-wordmark {
    font: 900 19px/.8 'Barlow Condensed', sans-serif;
    text-transform: uppercase;
  }

  .huh-app-wordmark b { color: var(--coral); }

  .huh-app-icon {
    width: 22px;
    height: 22px;
    flex: 0 0 22px;
    display: grid;
    place-items: center;
    border: 1px solid currentColor;
    border-radius: 50%;
    font-size: 10px;
  }

  .huh-screen-label {
    color: var(--muted);
    font: 700 7px 'IBM Plex Mono', monospace;
    letter-spacing: .09em;
    text-transform: uppercase;
  }

  .huh-mock-photo {
    position: relative;
    min-height: 134px;
    overflow: hidden;
    border-radius: 13px 13px 4px 13px;
    background:
      radial-gradient(ellipse at 50% 107%, rgba(17,18,17,.8), transparent 52%),
      radial-gradient(ellipse at 50% 57%, #E4B07D 0 10%, transparent 10.5%),
      radial-gradient(ellipse at 50% 96%, #C96F68 0 28%, transparent 28.5%),
      linear-gradient(148deg, #D8BBA4, #779477 85%);
  }

  .huh-mock-photo::before {
    content: '';
    position: absolute;
    top: 19%;
    left: 50%;
    width: 37px;
    height: 48px;
    border-radius: 48% 48% 42% 42%;
    background: #3A332D;
    transform: translateX(-50%);
  }

  .huh-mock-photo::after {
    content: '';
    position: absolute;
    top: 35%;
    left: 50%;
    width: 55px;
    height: 64px;
    border-radius: 45% 45% 12px 12px;
    background: #E4B58E;
    transform: translateX(-50%);
    box-shadow: inset 0 -9px 0 rgba(17,18,17,.12);
  }

  .huh-photo-tag {
    position: absolute;
    left: 8px;
    bottom: 8px;
    z-index: 2;
    padding: 5px 7px;
    border-radius: 999px;
    background: rgba(17,18,17,.66);
    color: var(--paper);
    font: 6px 'IBM Plex Mono', monospace;
    letter-spacing: .04em;
    text-transform: uppercase;
  }

  .huh-card-id {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 7px;
  }

  .huh-card-name {
    font: 800 21px/.9 'Barlow Condensed', sans-serif;
    letter-spacing: -.01em;
    text-transform: uppercase;
  }

  .huh-card-pronouns {
    flex-shrink: 0;
    color: var(--muted);
    font: 700 6.5px 'IBM Plex Mono', monospace;
    text-transform: uppercase;
  }

  .huh-card-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: auto;
  }

  .huh-card-tags span {
    padding: 4px 7px;
    border: 1px solid rgba(17,18,17,.22);
    border-radius: 999px;
    font: 700 6px 'IBM Plex Mono', monospace;
    letter-spacing: .03em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .huh-mock-facts {
    display: grid;
    grid-template-columns: repeat(2,minmax(0,1fr));
    gap: 5px;
    margin-top: 1px;
  }

  .huh-mock-fact {
    min-width: 0;
    padding: 5px 6px;
    border-radius: 7px;
    background: rgba(17,18,17,.055);
  }

  .huh-mock-fact small {
    display: block;
    color: var(--muted);
    font: 6px 'IBM Plex Mono', monospace;
    text-transform: uppercase;
  }

  .huh-mock-fact b {
    display: block;
    margin-top: 4px;
    font: 700 9px/1.15 'Space Grotesk', sans-serif;
    letter-spacing: -.01em;
  }

  .huh-mock-fact:nth-child(2) b,
  .huh-mock-fact:nth-child(4) b { color: var(--coral); }

  .huh-preview-note {
    margin: auto 0 0;
    color: var(--muted);
    font: 6px/1.6 'IBM Plex Mono', monospace;
    text-transform: uppercase;
  }

  .huh-sheet-preview {
    position: relative;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 7px;
    overflow: hidden;
    padding: 10px 9px;
    border-radius: 15px 15px 5px 5px;
    background: var(--paper);
    color: var(--black);
  }

  .huh-sheet-grabber {
    width: 31px;
    height: 3px;
    flex: 0 0 3px;
    margin: 0 auto 3px;
    border-radius: 9px;
    background: rgba(17,18,17,.32);
  }

  .huh-preview-heading {
    margin: 0;
    font: 900 24px/.88 'Barlow Condensed', sans-serif;
    letter-spacing: -.01em;
    text-transform: uppercase;
  }

  .huh-preview-section {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding-top: 9px;
    border-top: 1px solid rgba(17,18,17,.14);
  }

  .huh-preview-section strong {
    font: 700 7px 'IBM Plex Mono', monospace;
    letter-spacing: .06em;
    text-transform: uppercase;
  }

  .huh-preview-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .huh-pill {
    padding: 4px 8px;
    border: 1px solid rgba(17,18,17,.2);
    border-radius: 999px;
    background: rgba(255,255,255,.45);
    font: 700 6.5px 'IBM Plex Mono', monospace;
    letter-spacing: .03em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .huh-pill.accent {
    background: var(--amber);
    border-color: transparent;
  }

  .huh-preview-bio {
    margin: 0;
    font: 500 9.5px/1.55 'Space Grotesk', sans-serif;
  }

  .huh-preview-basics {
    margin: 0;
    color: var(--muted);
    font: 700 7px 'IBM Plex Mono', monospace;
    letter-spacing: .05em;
    text-transform: uppercase;
  }

  .huh-preview-prompt {
    padding: 10px;
    border-radius: 11px 11px 11px 3px;
    background: #E7D8C1;
  }

  .huh-preview-prompt strong {
    display: block;
    font: 800 10px/1.3 'Space Grotesk', sans-serif;
    letter-spacing: -.01em;
  }

  .huh-preview-prompt p {
    margin: 5px 0 0;
    font: 500 9px/1.5 'Space Grotesk', sans-serif;
  }

  .huh-preview-align {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 5px;
    margin-top: auto;
    padding: 10px 9px;
    border-radius: 999px;
    background: var(--amber);
    color: var(--black);
    font: 700 7px 'IBM Plex Mono', monospace;
    text-transform: uppercase;
  }

  .huh-aligned-chip {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 9px 11px;
    border-radius: 11px 11px 11px 3px;
    background: var(--amber);
    color: var(--black);
  }

  .huh-aligned-chip span {
    font: 900 17px/1 'Barlow Condensed', sans-serif;
    text-transform: uppercase;
  }

  .huh-aligned-chip small {
    flex-shrink: 0;
    font: 700 6px/1.5 'IBM Plex Mono', monospace;
    text-transform: uppercase;
    text-align: right;
  }

  .huh-chat-thread {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    gap: 6px;
    padding-top: 10px;
  }

  .huh-chat-line {
    max-width: 84%;
    margin: 0;
    padding: 8px 10px;
    font: 500 8.5px/1.45 'Space Grotesk', sans-serif;
  }

  .huh-chat-line.them {
    align-self: flex-start;
    background: #2A2B28;
    border-radius: 11px 11px 11px 3px;
  }

  .huh-chat-line.me {
    align-self: flex-end;
    background: var(--paper);
    color: var(--black);
    border-radius: 11px 11px 3px 11px;
  }

  .huh-chat-line.huh-typing {
    display: flex;
    align-items: center;
    gap: 3px;
    padding: 9px 11px;
  }

  .huh-typing i {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: rgba(241,237,226,.6);
    animation: huh-dot 1.1s ease-in-out infinite;
  }

  .huh-typing i:nth-child(2) { animation-delay: .15s; }
  .huh-typing i:nth-child(3) { animation-delay: .3s; }

  /* Bubbles settle in once the showcase scrolls into view. */

  .huh-showcase.huh-is-visible .huh-aligned-chip {
    animation: huh-bubble .55s cubic-bezier(.22,1,.36,1) .25s both;
  }

  .huh-showcase.huh-is-visible .huh-chat-line {
    animation: huh-bubble .5s cubic-bezier(.22,1,.36,1) both;
  }

  .huh-showcase.huh-is-visible .huh-chat-line.them { animation-delay: .55s; }
  .huh-showcase.huh-is-visible .huh-chat-line.me { animation-delay: .85s; }

  .huh-showcase.huh-is-visible .huh-typing {
    animation: huh-fade .4s ease 1.25s both;
  }

  @keyframes huh-dot {
    0%, 100% { transform: translateY(0); opacity: .5; }
    50% { transform: translateY(-3px); opacity: 1; }
  }

  @keyframes huh-bubble {
    from { opacity: 0; transform: translateY(9px) scale(.96); }
    to { opacity: 1; transform: none; }
  }

  @keyframes huh-fade {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .huh-showcase-caption {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin: 12px 0 0;
    color: rgba(241,237,226,.42);
    font: 7px/1.8 'IBM Plex Mono', monospace;
    text-transform: uppercase;
  }

  .huh-showcase-caption::before {
    content: '';
    width: 18px;
    height: 1px;
    flex: 0 0 18px;
    margin-top: 6px;
    background: var(--coral);
  }

  /* PROFILE STORY */

  .huh-profiles {
    background: var(--paper);
    color: var(--black);
  }

  .huh-profile-layout {
    display: grid;
    grid-template-columns: minmax(0,.92fr) minmax(0,1.08fr);
    gap: clamp(32px,7vw,88px);
    align-items: center;
    margin-top: 42px;
  }

  .huh-profile-art {
    position: relative;
    min-width: 0;
    min-height: 330px;
    padding: 24px;
    overflow: hidden;
    border-radius: 28px 28px 7px 28px;
    background: var(--coral);
    color: var(--black);
  }

  .huh-profile-art::before {
    content: 'huh?';
    position: absolute;
    top: 65px;
    right: -13px;
    color: rgba(17,18,17,.075);
    font: 900 clamp(100px,16vw,195px)/.7 'Barlow Condensed', sans-serif;
    letter-spacing: -.06em;
    pointer-events: none;
  }

  .huh-profile-art-top {
    position: relative;
    z-index: 1;
    display: flex;
    justify-content: space-between;
    gap: 10px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(17,18,17,.28);
    font: 700 8px 'IBM Plex Mono', monospace;
    text-transform: uppercase;
  }

  .huh-profile-art-head {
    position: relative;
    z-index: 1;
    margin: 30px 0 24px;
    font: 900 clamp(47px,6vw,73px)/.81 'Barlow Condensed', sans-serif;
    letter-spacing: -.025em;
    text-transform: uppercase;
  }

  .huh-profile-art-head span { color: var(--paper); }

  .huh-art-tags {
    position: relative;
    z-index: 1;
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
  }

  .huh-art-tags span {
    padding: 8px 10px;
    border: 1px solid rgba(17,18,17,.43);
    border-radius: 999px;
    font: 700 8px 'IBM Plex Mono', monospace;
    text-transform: uppercase;
  }

  .huh-profile-art-foot {
    position: relative;
    z-index: 1;
    margin: 23px 0 0;
    font: 7px/1.7 'IBM Plex Mono', monospace;
    text-transform: uppercase;
  }

  .huh-profile-points {
    border-top: 1px solid rgba(17,18,17,.23);
  }

  .huh-profile-point {
    display: grid;
    grid-template-columns: 37px minmax(0,1fr);
    gap: 13px;
    padding: 19px 0;
    border-bottom: 1px solid rgba(17,18,17,.2);
  }

  .huh-profile-point-num {
    color: var(--coral);
    font: 900 24px/.9 'Barlow Condensed', sans-serif;
  }

  .huh-profile-point h3 {
    margin: 0;
    font: 800 23px/.95 'Barlow Condensed', sans-serif;
    text-transform: uppercase;
  }

  .huh-profile-point p {
    margin: 8px 0 0;
    color: #55534D;
    font-size: 11px;
    line-height: 1.8;
  }

  /* THE NETWORK */

  .huh-network {
    overflow: hidden;
    background: var(--concrete);
    color: var(--black);
  }

  .huh-network .huh-eyebrow { color: #474640; }
  .huh-network .huh-copy { color: #44433D; }

  .huh-network-art {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0,1fr) 30px minmax(0,1fr) 30px minmax(0,1fr);
    align-items: center;
    gap: 8px;
    margin-top: 42px;
  }

  .huh-network-node {
    min-width: 0;
    min-height: 145px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 18px;
    padding: 15px 13px;
    border: 1px solid var(--black);
    border-radius: 16px 16px 5px 16px;
    background: var(--paper);
  }

  .huh-network-node:nth-of-type(2) { background: var(--sage); }
  .huh-network-node:nth-of-type(3) { background: var(--amber); }

  .huh-network-node small {
    font: 700 7px/1.6 'IBM Plex Mono', monospace;
    letter-spacing: .06em;
    text-transform: uppercase;
  }

  .huh-network-node strong {
    font: 900 clamp(23px,3.5vw,42px)/.82 'Barlow Condensed', sans-serif;
    letter-spacing: -.01em;
    text-transform: uppercase;
  }

  .huh-network-link {
    display: grid;
    place-items: center;
    color: var(--black);
    font-size: 22px;
    animation: huh-nudge 2.8s ease-in-out infinite;
  }

  .huh-network-note {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin: 19px 0 0;
    color: rgba(17,18,17,.72);
    font: 8px/1.8 'IBM Plex Mono', monospace;
    text-transform: uppercase;
  }

  .huh-network-note::before {
    content: '';
    width: 22px;
    height: 1px;
    flex: 0 0 22px;
    margin-top: 7px;
    background: var(--black);
  }

  /* VERIFICATION — the only section about college-email eligibility */

  .huh-verification {
    background: var(--black);
    color: var(--paper);
  }

  .huh-verification-layout {
    display: grid;
    grid-template-columns: minmax(0,1fr) minmax(260px,.78fr);
    align-items: center;
    gap: clamp(35px,8vw,110px);
  }

  .huh-verification .huh-eyebrow { color: var(--amber); }
  .huh-verification .huh-h2 em { color: var(--amber); }

  .huh-verification .huh-copy {
    max-width: 500px;
    color: rgba(241,237,226,.68);
  }

  .huh-verify-card {
    position: relative;
    min-width: 0;
    padding: clamp(21px,3.5vw,31px);
    overflow: hidden;
    border-radius: 25px 25px 7px 25px;
    background: var(--paper);
    color: var(--black);
  }

  .huh-verify-card::after {
    content: '✓';
    position: absolute;
    top: 32px;
    right: 20px;
    color: rgba(119,148,119,.25);
    font: 900 116px/.8 'Barlow Condensed', sans-serif;
    pointer-events: none;
  }

  .huh-verify-meta {
    position: relative;
    z-index: 1;
    display: flex;
    justify-content: space-between;
    gap: 10px;
    padding-bottom: 13px;
    border-bottom: 1px solid rgba(17,18,17,.2);
    font: 700 8px 'IBM Plex Mono', monospace;
    text-transform: uppercase;
  }

  .huh-verify-icon {
    position: relative;
    z-index: 1;
    width: 47px;
    height: 47px;
    display: grid;
    place-items: center;
    margin-top: 25px;
    border-radius: 50%;
    background: var(--sage);
    font-size: 22px;
  }

  .huh-verify-card h3 {
    position: relative;
    z-index: 1;
    max-width: 350px;
    margin: 20px 0 0;
    font: 900 clamp(33px,4vw,46px)/.87 'Barlow Condensed', sans-serif;
    text-transform: uppercase;
  }

  .huh-verify-card > p {
    position: relative;
    z-index: 1;
    margin: 14px 0 0;
    color: #53524C;
    font-size: 11px;
    line-height: 1.8;
  }

  .huh-verify-fine {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: flex-start;
    gap: 9px;
    margin-top: 19px;
    padding-top: 14px;
    border-top: 1px solid rgba(17,18,17,.2);
    color: #63615A;
    font: 7px/1.8 'IBM Plex Mono', monospace;
  }

  .huh-verify-fine span {
    color: var(--coral);
    font-size: 12px;
  }

  /* CONTROL AND REPORTING */

  .huh-control {
    background: var(--paper);
    color: var(--black);
  }

  .huh-control-grid {
    display: grid;
    grid-template-columns: repeat(3,minmax(0,1fr));
    gap: 12px;
    margin-top: 39px;
  }

  .huh-control-card {
    position: relative;
    min-width: 0;
    min-height: 191px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 18px;
    overflow: hidden;
    border-radius: 19px 19px 5px 19px;
    background: #E7E0D3;
  }

  .huh-control-card:nth-child(2) { background: #DCE2D2; }
  .huh-control-card:nth-child(3) { background: #E9CEC8; }

  .huh-control-top {
    display: flex;
    justify-content: space-between;
    width: 100%;
    gap: 10px;
    font: 700 8px 'IBM Plex Mono', monospace;
    text-transform: uppercase;
  }

  .huh-control-symbol {
    width: 42px;
    height: 42px;
    display: grid;
    place-items: center;
    margin: 22px 0 17px;
    border: 1px solid rgba(17,18,17,.3);
    border-radius: 50%;
    font-size: 20px;
  }

  .huh-control-card h3 {
    margin: auto 0 0;
    font: 900 28px/.88 'Barlow Condensed', sans-serif;
    letter-spacing: -.015em;
    text-transform: uppercase;
  }

  .huh-control-card p {
    margin: 9px 0 0;
    color: #4E4C46;
    font-size: 10px;
    line-height: 1.7;
  }

  /* Closing */

  .huh-close {
    position: relative;
    overflow: hidden;
    padding-block: clamp(60px,8vw,99px);
    background: var(--amber);
    color: var(--black);
  }

  .huh-close::after {
    content: 'huh?';
    position: absolute;
    right: -15px;
    bottom: -70px;
    color: rgba(17,18,17,.055);
    font: 900 clamp(190px,31vw,390px)/.8 'Barlow Condensed', sans-serif;
    letter-spacing: -.07em;
    pointer-events: none;
  }

  .huh-close-inner {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: minmax(0,1fr) auto;
    gap: 30px;
    align-items: end;
  }

  .huh-close .huh-eyebrow {
    color: rgba(17,18,17,.7);
  }

  .huh-close .huh-eyebrow::before { background: var(--black); }

  .huh-close h2 {
    max-width: 790px;
    margin: 0;
    font: 900 clamp(64px,9vw,112px)/.78 'Barlow Condensed', sans-serif;
    letter-spacing: -.035em;
    text-transform: uppercase;
    text-wrap: balance;
  }

  .huh-close h2 span {
    color: transparent;
    -webkit-text-stroke: 1.6px var(--black);
  }

  .huh-close-note {
    max-width: 235px;
    margin: 0 0 4px;
    font: 9px/1.8 'IBM Plex Mono', monospace;
    text-transform: uppercase;
  }

  .huh-close-cta {
    margin-top: 24px;
    border-radius: 4px 18px 4px 18px;
    background: var(--black);
    color: var(--paper);
  }

  /* Footer */

  .huh-footer {
    padding-block: 20px;
    border-top: 1px solid var(--rule);
    background: var(--black);
    color: var(--paper);
  }

  .huh-footer-inner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 18px;
  }

  .huh-footer-logo {
    flex-shrink: 0;
    font: 900 27px 'Barlow Condensed', sans-serif;
    letter-spacing: -.05em;
    text-transform: uppercase;
  }

  .huh-footer-copy {
    color: rgba(241,237,226,.45);
    font: 7px/1.8 'IBM Plex Mono', monospace;
    text-align: right;
  }

  /* Connected, one-time entrance reveals */

  .huh-reveal,
  .huh-reveal-left,
  .huh-reveal-right,
  .huh-reveal-scale {
    --reveal-delay: 0ms;
  }

  .huh-motion-ready .huh-reveal,
  .huh-motion-ready .huh-reveal-left,
  .huh-motion-ready .huh-reveal-right,
  .huh-motion-ready .huh-reveal-scale {
    opacity: 0;
    filter: blur(2px);
    transition:
      opacity .65s cubic-bezier(.22,1,.36,1) var(--reveal-delay),
      transform .72s cubic-bezier(.22,1,.36,1) var(--reveal-delay),
      filter .65s ease var(--reveal-delay);
  }

  .huh-motion-ready .huh-reveal { transform: translateY(19px); }
  .huh-motion-ready .huh-reveal-left { transform: translateX(-18px); }
  .huh-motion-ready .huh-reveal-right { transform: translateX(18px); }
  .huh-motion-ready .huh-reveal-scale { transform: translateY(13px) scale(.985); }

  .huh-motion-ready .huh-is-visible {
    opacity: 1 !important;
    transform: translate(0,0) scale(1) !important;
    filter: blur(0) !important;
  }

  .huh-network-node:nth-child(3) { --reveal-delay: 80ms; }
  .huh-network-node:nth-child(5) { --reveal-delay: 160ms; }

  .huh-control-card:nth-child(2) { --reveal-delay: 80ms; }
  .huh-control-card:nth-child(3) { --reveal-delay: 160ms; }

  @keyframes huh-nudge {
    0%, 100% { transform: translateX(0); }
    50% { transform: translateX(3px); }
  }

  @media (hover: hover) and (pointer: fine) {
    .huh-login:hover span { transform: translate(2px,-2px); }

    .huh-cta:hover {
      transform: translateY(-2px);
      background: var(--amber);
    }

    .huh-cta:hover .arrow { transform: translate(2px,-2px); }

    .huh-text-link:hover { color: var(--amber); }

    .huh-phone:nth-child(1):hover,
    .huh-phone:nth-child(2):hover,
    .huh-phone:nth-child(3):hover {
      animation-play-state: paused;
      border-color: var(--amber);
    }

    .huh-network-node:hover { transform: translateY(-3px); }
  }

  /* Tablet */

  @media (max-width: 980px) {
    .huh-hero-inner {
      grid-template-columns: minmax(0,1fr);
      gap: 23px;
      padding-top: 55px;
    }

    .huh-hero-copy { max-width: 750px; }

    .huh-title { font-size: clamp(78px,11vw,110px); }

    .huh-hero-desc { max-width: 560px; }

    .huh-showcase {
      width: min(100%,700px);
      margin-inline: auto;
      padding-top: 9px;
    }

    .huh-phone {
      height: 410px;
      max-width: 220px;
    }

    .huh-profile-layout { gap: 30px; }
  }

  /* Mobile */

  @media (max-width: 680px) {
    .huh-scroll {
      scroll-padding-top: 64px;
      scrollbar-width: none;
    }

    .huh-scroll::-webkit-scrollbar { display: none; }

    .huh-wrap { padding-inline: 21px; }

    .huh-top-inner {
      min-height: 62px;
      gap: 13px;
    }

    .huh-logo { font-size: 35px; }

    .huh-login { min-height: 39px; }

    .huh-hero-inner {
      padding-block: 41px 36px;
      gap: 15px;
    }

    .huh-kicker {
      max-width: 320px;
      margin-bottom: 24px;
      font-size: 8px;
    }

    .huh-title {
      font-size: clamp(67px,14.4vw,97px);
      line-height: .81;
    }

    .huh-hero-desc {
      margin-top: 22px;
      font-size: 13px;
      line-height: 1.8;
    }

    .huh-actions { gap: 16px; margin-top: 23px; }

    .huh-cta {
      min-height: 52px;
      padding-inline: 17px;
      gap: 17px;
      font-size: 11px;
    }

    .huh-text-link { font-size: 10px; }

    .huh-hero-note {
      max-width: 380px;
      margin-top: 17px;
      font-size: 7px;
    }

    /*
      The preview cards can be swiped horizontally.
      Vertical gestures still scroll the landing page.
    */

    .huh-showcase {
      width: calc(100% + 42px);
      margin: 0 -21px;
      padding: 13px 21px 25px;
    }

    .huh-showcase-label {
      font-size: 7px;
      line-height: 1.6;
    }

    .huh-device-stage {
      width: 100%;
      justify-content: flex-start;
      align-items: center;
      gap: 13px;
      overflow-x: auto;
      overflow-y: hidden;
      padding: 10px 1px 17px;
      scroll-snap-type: x mandatory;
      scroll-padding-inline: 1px;
      overscroll-behavior-x: contain;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
    }

    .huh-device-stage::-webkit-scrollbar { display: none; }

    .huh-phone,
    .huh-phone:nth-child(1),
    .huh-phone:nth-child(2),
    .huh-phone:nth-child(3) {
      flex: 0 0 min(68vw,230px);
      width: min(68vw,230px);
      height: 375px;
      max-width: none;
      transform: none;
      scroll-snap-align: start;
    }

    .huh-phone:nth-child(2) { border-color: var(--paper); }

    .huh-showcase-caption { font-size: 7px; }

    .huh-section { padding-block: 59px; }

    .huh-section-head {
      grid-template-columns: minmax(0,1fr);
      gap: 14px;
    }

    .huh-eyebrow { margin-bottom: 16px; font-size: 8px; }

    .huh-h2 {
      font-size: clamp(47px,11vw,70px);
      line-height: .87;
    }

    .huh-copy {
      margin-top: 15px;
      font-size: 12px;
      line-height: 1.85;
    }

    .huh-profile-layout {
      grid-template-columns: minmax(0,1fr);
      gap: 22px;
      margin-top: 29px;
    }

    .huh-profile-art {
      min-height: 255px;
      padding: 19px;
      border-radius: 22px 22px 6px 22px;
    }

    .huh-profile-art-head {
      margin-block: 24px 20px;
      font-size: clamp(51px,12vw,68px);
    }

    .huh-profile-art-foot { margin-top: 18px; }

    .huh-profile-point {
      grid-template-columns: 32px minmax(0,1fr);
      gap: 10px;
      padding: 18px 0;
    }

    .huh-profile-point h3 { font-size: 22px; }
    .huh-profile-point p { font-size: 11px; }

    .huh-network-art {
      grid-template-columns: minmax(0,1fr) 17px minmax(0,1fr) 17px minmax(0,1fr);
      gap: 4px;
      margin-top: 29px;
    }

    .huh-network-node {
      min-height: 127px;
      padding: 11px 8px;
      gap: 15px;
      border-radius: 12px 12px 4px 12px;
    }

    .huh-network-node small {
      font-size: 6px;
      line-height: 1.6;
      overflow-wrap: anywhere;
    }

    .huh-network-node strong { font-size: clamp(19px,5.7vw,31px); }
    .huh-network-link { font-size: 16px; }
    .huh-network-note { font-size: 7px; }

    .huh-verification-layout {
      grid-template-columns: minmax(0,1fr);
      gap: 27px;
    }

    .huh-verify-card {
      padding: 22px;
      border-radius: 21px 21px 6px 21px;
    }

    .huh-verify-card h3 { font-size: 40px; }

    .huh-control-grid {
      grid-template-columns: minmax(0,1fr);
      gap: 10px;
      margin-top: 28px;
    }

    .huh-control-card {
      min-height: 155px;
      padding: 17px;
      border-radius: 17px 17px 5px 17px;
    }

    .huh-control-symbol { margin-block: 17px 13px; }
    .huh-control-card h3 { font-size: 30px; }
    .huh-control-card p { max-width: 340px; font-size: 11px; }

    .huh-close { padding-block: 56px; }

    .huh-close-inner {
      grid-template-columns: minmax(0,1fr);
      gap: 22px;
    }

    .huh-close h2 {
      font-size: clamp(66px,13.8vw,91px);
      line-height: .81;
    }

    .huh-close-note {
      max-width: 330px;
      font-size: 8px;
    }

    .huh-footer { padding-block: 19px; }

    .huh-footer-inner {
      align-items: flex-start;
      flex-direction: column;
      gap: 10px;
    }

    .huh-footer-copy {
      max-width: 450px;
      font-size: 7px;
      text-align: left;
    }
  }

  @media (max-width: 380px) {
    .huh-wrap { padding-inline: 17px; }

    .huh-title {
      font-size: clamp(58px,15vw,68px);
    }

    .huh-mock-photo { min-height: 118px; }

    .huh-card-tags { display: none; }

    .huh-preview-heading { font-size: 20px; }

    .huh-showcase {
      width: calc(100% + 34px);
      margin-inline: -17px;
      padding-inline: 17px;
    }

    .huh-phone,
    .huh-phone:nth-child(1),
    .huh-phone:nth-child(2),
    .huh-phone:nth-child(3) {
      flex-basis: min(76vw,220px);
      width: min(76vw,220px);
      height: 360px;
    }

    .huh-profile-art-head { font-size: 48px; }

    .huh-network-node {
      min-height: 122px;
      padding: 9px 6px;
    }

    .huh-network-node strong { font-size: 19px; }

    .huh-close h2 { font-size: 60px; }
  }

  @keyframes huh-nudge {
    0%, 100% { transform: translateX(0); }
    50% { transform: translateX(3px); }
  }

  @media (prefers-reduced-motion: reduce) {
    .huh-scroll { scroll-behavior: auto; }

    .huh-top { transition: none !important; }

    .huh-network-link,
    .huh-phone,
    .huh-phone:nth-child(1),
    .huh-phone:nth-child(2),
    .huh-phone:nth-child(3),
    .huh-typing i,
    .huh-showcase.huh-is-visible .huh-aligned-chip,
    .huh-showcase.huh-is-visible .huh-chat-line {
      animation: none !important;
    }

    .huh-login,
    .huh-cta,
    .huh-cta .arrow,
    .huh-phone,
    .huh-network-node {
      transition: none !important;
    }

    .huh-motion-ready .huh-reveal,
    .huh-motion-ready .huh-reveal-left,
    .huh-motion-ready .huh-reveal-right,
    .huh-motion-ready .huh-reveal-scale {
      opacity: 1 !important;
      filter: none !important;
      transform: none !important;
      transition: none !important;
    }
  }
`;

export default function Splash({ onEnter }) {
  const pageRef = useRef(null);
  const scrollRef = useRef(null);

  // The status bar and the overscroll gutter belong to the browser but are
  // painted from values this page supplies. Without this, the splash would run
  // with whatever colour the previous screen left behind — which is the visible
  // seam at the exact moment the app opens.
  useChromeColor(C.black);

  const enter = () => {
    if (typeof onEnter === 'function') onEnter();
  };

  useEffect(() => {
    const page = pageRef.current;
    const scroll = scrollRef.current;

    if (!page || !scroll) return undefined;

    const targets = page.querySelectorAll(
      '.huh-reveal, .huh-reveal-left, .huh-reveal-right, .huh-reveal-scale',
    );

    const top = page.querySelector('.huh-top');
    let lastY = scroll.scrollTop;

    const handleScroll = () => {
      const y = scroll.scrollTop;
      const maxScroll = scroll.scrollHeight - scroll.clientHeight;
      const progress = maxScroll > 0 ? y / maxScroll : 0;

      top?.style.setProperty('--scroll-progress', `${progress * 100}%`);

      /* Scrolling down (swiping up) past the hero hides the header;
         a scroll up of any size brings it straight back. */

      if (top) {
        if (y > lastY + 4 && y > 90) {
          top.classList.add('huh-top-hidden');
        } else if (y < lastY - 4) {
          top.classList.remove('huh-top-hidden');
        }
      }

      lastY = y;
    };

    scroll.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    if (reducedMotion || !('IntersectionObserver' in window)) {
      targets.forEach((element) => {
        element.classList.add('huh-is-visible');
      });

      return () => {
        scroll.removeEventListener('scroll', handleScroll);
      };
    }

    page.classList.add('huh-motion-ready');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add('huh-is-visible');
        observer.unobserve(entry.target);
      });
    }, {
      root: scroll,
      threshold: 0.12,
      rootMargin: '0px 0px -28px 0px',
    });

    targets.forEach((element) => observer.observe(element));

    return () => {
      observer.disconnect();
      scroll.removeEventListener('scroll', handleScroll);
      page.classList.remove('huh-motion-ready');
    };
  }, []);

  return (
    <div className="huh-page" ref={pageRef}>
      <style>{CSS}</style>

      <div
        className="huh-scroll"
        ref={scrollRef}
        aria-label="huh? landing page"
      >
        <header className="huh-top">
          <div className="huh-wrap huh-top-inner">
            <a
              className="huh-logo"
              href="#huh-home"
              aria-label="huh? home"
            >
              huh<b>?</b>
            </a>

            <span className="huh-spacer" />

            <button
              className="huh-login"
              type="button"
              onClick={enter}
            >
              Log in <span aria-hidden="true">↗</span>
            </button>
          </div>
        </header>

        <main id="huh-home">
          {/* 01 — THE QUESTION */}

          <section className="huh-hero" aria-labelledby="huh-title">
            <div className="huh-wrap huh-hero-inner">
              <div className="huh-hero-copy huh-reveal-left">
                <p className="huh-kicker">
                  The student-only dating &amp; social app
                </p>

                <h1 className="huh-title" id="huh-title">
                  <span className="line">
                    huh<span className="accent">?</span>
                  </span>
                  <span className="line outline">Only verified</span>
                  <span className="line">students.</span>
                  <span className="line">
                    Dating &amp; <span className="accent">friends.</span>
                  </span>
                </h1>

                <p className="huh-hero-desc">
                  Every profile here belongs to a student with a verified
                  college email — from your campus and campuses across the
                  country. Flip through real profiles, align with the ones
                  who stick, and chat the moment it’s mutual.
                </p>

                <div className="huh-actions">
                  <button
                    className="huh-cta"
                    type="button"
                    onClick={enter}
                  >
                    Okay, I’m curious
                    <span className="arrow" aria-hidden="true">↗</span>
                  </button>

                  <a className="huh-text-link" href="#how-it-works">
                    Take a look <span aria-hidden="true">↓</span>
                  </a>
                </div>

                <p className="huh-hero-note">
                  <span aria-hidden="true">✳</span>
                  College email verification required · Free for students
                </p>
              </div>

              <div
                className="huh-showcase huh-reveal-scale"
                aria-label="Illustrations of the actual app interface"
              >
                <div className="huh-showcase-label">
                  <span>The actual interface</span>
                  <span>Discover · Align · Chat</span>
                </div>

                <div className="huh-device-stage">
                  {/* Discover: the real profile fields, without fake member data. */}

                  <div className="huh-phone">
                    <div className="huh-phone-screen">
                      <div className="huh-phone-status">
                        <span>huh?</span>
                        <span className="huh-status-icons">● ▮ ▰</span>
                      </div>

                      <div className="huh-app-bar">
                        <span className="huh-app-wordmark">
                          Discover<span style={{ color: C.coral }}>.</span>
                        </span>
                        <span className="huh-app-icon" aria-hidden="true">
                          ⌕
                        </span>
                      </div>

                      <div className="huh-screen-label">
                        A profile / first impression
                      </div>

                      <div
                        className="huh-mock-photo"
                        aria-label="Decorative placeholder, not a member photo"
                      >
                        <span className="huh-photo-tag">
                          Profile photo
                        </span>
                      </div>

                      <div className="huh-card-id">
                        <span className="huh-card-name">Aanya, 20</span>
                        <span className="huh-card-pronouns">she / her</span>
                      </div>

                      <div className="huh-mock-facts">
                        <div className="huh-mock-fact">
                          <small>College</small>
                          <b>IIT Bombay</b>
                        </div>
                        <div className="huh-mock-fact">
                          <small>Year</small>
                          <b>UG</b>
                        </div>
                        <div className="huh-mock-fact">
                          <small>Here for</small>
                          <b>Dating</b>
                        </div>
                        <div className="huh-mock-fact">
                          <small>Graduating</small>
                          <b>2027</b>
                        </div>
                      </div>

                      <div className="huh-card-tags">
                        <span>Chai Walks</span>
                        <span>Anime</span>
                        <span>Hackathons</span>
                      </div>
                    </div>
                  </div>

                  {/* Profile details: actual content groups and final Align CTA. */}

                  <div className="huh-phone">
                    <div className="huh-phone-screen">
                      <div className="huh-phone-status">
                        <span>huh?</span>
                        <span className="huh-status-icons">● ▮ ▰</span>
                      </div>

                      <div className="huh-screen-label">
                        Look a little closer
                      </div>

                      <div className="huh-sheet-preview">
                        <div className="huh-sheet-grabber" />

                        <h3 className="huh-preview-heading">
                          More to<br />the person.
                        </h3>

                        <div className="huh-preview-section">
                          <strong>A little about me</strong>
                          <p className="huh-preview-bio">
                            Will trade playlists for chai.
                          </p>
                        </div>

                        <div className="huh-preview-section">
                          <strong>The basics</strong>
                          <p className="huh-preview-basics">
                            IIT Bombay · UG · 2027
                          </p>
                        </div>

                        <div className="huh-preview-section">
                          <strong>Here for</strong>
                          <div className="huh-preview-pills">
                            <span className="huh-pill accent">Dating</span>
                          </div>
                        </div>

                        <div className="huh-preview-section">
                          <strong>Things I like</strong>
                          <div className="huh-preview-pills">
                            <span className="huh-pill">Chai Walks</span>
                            <span className="huh-pill">Night Canteen</span>
                            <span className="huh-pill">Music Production</span>
                          </div>
                        </div>

                        <div className="huh-preview-prompt">
                          <strong>Your go-to 2 AM canteen order?</strong>
                          <p>Maggi. Extra cheese if I like you.</p>
                        </div>

                        <div className="huh-preview-align">
                          <span>Align with this person</span>
                          <span>↗</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Report option and the conditional match/chat outcome. */}

                  <div className="huh-phone">
                    <div className="huh-phone-screen dark">
                      <div className="huh-phone-status">
                        <span>huh?</span>
                        <span className="huh-status-icons">● ▮ ▰</span>
                      </div>

                      <div className="huh-app-bar">
                        <span className="huh-app-wordmark">
                          Chat<span style={{ color: C.coral }}>.</span>
                        </span>
                        <span className="huh-app-icon" aria-hidden="true">
                          ⋯
                        </span>
                      </div>

                      <div className="huh-screen-label">
                        After a mutual align
                      </div>

                      <div className="huh-aligned-chip">
                        <span>Aligned!</span>
                        <small>
                          Mutual ·<br />chat unlocked
                        </small>
                      </div>

                      <div className="huh-chat-thread">
                        <p className="huh-chat-line them">
                          so… chai walk this sunday?
                        </p>

                        <p className="huh-chat-line me">
                          only if there’s maggi at the end
                        </p>

                        <div
                          className="huh-chat-line them huh-typing"
                          aria-hidden="true"
                        >
                          <i /><i /><i />
                        </div>
                      </div>

                      <p className="huh-preview-note">
                        Report &amp; block stay one tap away.
                      </p>
                    </div>
                  </div>
                </div>

                <p className="huh-showcase-caption">
                  Sample data for illustration — the fields are real, the
                  people are made up. A profile is whatever each person
                  makes of theirs.
                </p>
              </div>
            </div>
          </section>

          {/* 02 — WHY THE PROFILE HAS MORE THAN A PHOTO */}

          <section
            className="huh-section huh-profiles"
            id="how-it-works"
            aria-labelledby="huh-profile-title"
          >
            <div className="huh-wrap">
              <div className="huh-section-head huh-reveal">
                <div>
                  <p className="huh-eyebrow">01 / Look beyond the photo</p>

                  <h2 className="huh-h2" id="huh-profile-title">
                    A face gets<br />
                    your attention.<br />
                    <em>Details make it personal.</em>
                  </h2>
                </div>

                <p className="huh-copy">
                  Profiles bring together photos, a little about the person,
                  basic details, what they’re looking for, interests, and
                  prompts they’ve answered. You choose what catches your eye.
                </p>
              </div>

              <div className="huh-profile-layout">
                <div className="huh-profile-art huh-reveal-left">
                  <div className="huh-profile-art-top">
                    <span>Profile / Expanded</span>
                    <span>Scroll to explore</span>
                  </div>

                  <h3 className="huh-profile-art-head">
                    There’s more<br />
                    <span>to the story.</span>
                  </h3>

                  <div className="huh-art-tags">
                    <span>About</span>
                    <span>The basics</span>
                    <span>Interests</span>
                    <span>Prompts</span>
                  </div>

                  <p className="huh-profile-art-foot">
                    Details appear as you move through the profile.
                  </p>
                </div>

                <div className="huh-profile-points huh-reveal-right">
                  <article className="huh-profile-point">
                    <span className="huh-profile-point-num">01</span>
                    <div>
                      <h3>Start with the person.</h3>
                      <p>
                        See their photo and the profile information they
                        have shared.
                      </p>
                    </div>
                  </article>

                  <article className="huh-profile-point">
                    <span className="huh-profile-point-num">02</span>
                    <div>
                      <h3>Stay for the details.</h3>
                      <p>
                        Explore interests, intentions and answers to
                        profile prompts as you scroll.
                      </p>
                    </div>
                  </article>

                  <article className="huh-profile-point">
                    <span className="huh-profile-point-num">03</span>
                    <div>
                      <h3>Make your own move.</h3>
                      <p>
                        Reach the Align action at the bottom of the
                        expanded profile when you’re ready.
                      </p>
                    </div>
                  </article>
                </div>
              </div>
            </div>
          </section>

          {/* 03 — A WIDER STUDENT NETWORK */}

          <section
            className="huh-section huh-network"
            aria-labelledby="huh-network-title"
          >
            <div className="huh-wrap">
              <div className="huh-section-head huh-reveal">
                <div>
                  <p className="huh-eyebrow">02 / Outside your usual circle</p>

                  <h2 className="huh-h2" id="huh-network-title">
                    Your college<br />
                    is a start.<br />
                    <em>Not the whole world.</em>
                  </h2>
                </div>

                <p className="huh-copy">
                  Discover profiles from your college and from other
                  participating colleges. Your existing circle doesn’t
                  have to define everyone you get to meet.
                </p>
              </div>

              <div className="huh-network-art">
                <div className="huh-network-node huh-reveal">
                  <small>01 / Your starting point</small>
                  <strong>Your<br />college</strong>
                </div>

                <span className="huh-network-link" aria-hidden="true">
                  ↗
                </span>

                <div className="huh-network-node huh-reveal">
                  <small>02 / Beyond it</small>
                  <strong>Other<br />colleges</strong>
                </div>

                <span className="huh-network-link" aria-hidden="true">
                  ↗
                </span>

                <div className="huh-network-node huh-reveal">
                  <small>03 / Who knows?</small>
                  <strong>New<br />connections</strong>
                </div>
              </div>

              <p className="huh-network-note huh-reveal">
                A wider network of students, without limiting discovery
                to the people you already know.
              </p>
            </div>
          </section>

          {/* 04 — ELIGIBILITY AND ITS LIMITS */}

          <section
            className="huh-section huh-verification"
            aria-labelledby="huh-verify-title"
          >
            <div className="huh-wrap huh-verification-layout">
              <div className="huh-reveal-left">
                <p className="huh-eyebrow">03 / Who can join</p>

                <h2 className="huh-h2" id="huh-verify-title">
                  A student network<br />
                  starts with<br />
                  <em>eligibility.</em>
                </h2>

                <p className="huh-copy">
                  College email verification is part of sign-up. It helps
                  establish eligibility, while the supported-institution
                  list determines who can currently join.
                </p>
              </div>

              <aside
                className="huh-verify-card huh-reveal-right"
                aria-label="College email verification information"
              >
                <div className="huh-verify-meta">
                  <span>Sign-up / Verification</span>
                  <span>01</span>
                </div>

                <div className="huh-verify-icon" aria-hidden="true">
                  ✓
                </div>

                <h3>College email.<br />Clear eligibility.</h3>

                <p>
                  Use the college-email verification step during sign-up.
                  If your institution isn’t currently supported, availability
                  may be limited until it is added.
                </p>

                <div className="huh-verify-fine">
                  <span aria-hidden="true">✳</span>
                  Verification helps establish student eligibility; it does
                  not independently verify every detail someone shares
                  in their profile.
                </div>
              </aside>
            </div>
          </section>

          {/* 05 — ACTIONS AND REPORTING */}

          <section
            className="huh-section huh-control"
            aria-labelledby="huh-control-title"
          >
            <div className="huh-wrap">
              <div className="huh-section-head huh-reveal">
                <div>
                  <p className="huh-eyebrow">04 / Your next move</p>

                  <h2 className="huh-h2" id="huh-control-title">
                    Interest is yours<br />
                    to <em>act on.</em>
                  </h2>
                </div>

                <p className="huh-copy">
                  Not every profile will be your person. You decide when
                  to move on, when to take another look, and when something
                  needs to be reported.
                </p>
              </div>

              <div className="huh-control-grid">
                <article className="huh-control-card huh-reveal">
                  <div className="huh-control-top">
                    <span>01 / Pass</span><span>↗</span>
                  </div>

                  <div className="huh-control-symbol" aria-hidden="true">
                    ×
                  </div>

                  <h3>Not your person?</h3>
                  <p>
                    Pass on a profile and continue discovering others.
                  </p>
                </article>

                <article className="huh-control-card huh-reveal">
                  <div className="huh-control-top">
                    <span>02 / Align</span><span>↗</span>
                  </div>

                  <div className="huh-control-symbol" aria-hidden="true">
                    ↗
                  </div>

                  <h3>Curiosity goes both ways.</h3>
                  <p>
                    Align with someone. When the alignment is mutual,
                    the chat opens.
                  </p>
                </article>

                <article className="huh-control-card huh-reveal">
                  <div className="huh-control-top">
                    <span>03 / Report</span><span>↗</span>
                  </div>

                  <div className="huh-control-symbol" aria-hidden="true">
                    !
                  </div>

                  <h3>Something feels off?</h3>
                  <p>
                    Open the profile menu to access Report profile
                    and raise a concern.
                  </p>
                </article>
              </div>
            </div>
          </section>

          {/* THE LAST LINE */}

          <section className="huh-close" aria-labelledby="huh-close-title">
            <div className="huh-wrap huh-close-inner huh-reveal">
              <div>
                <p className="huh-eyebrow">One more thing</p>

                <h2 id="huh-close-title">
                  Someone new.<br />
                  Something <span>unexpected.</span>
                </h2>

                <button
                  className="huh-cta huh-close-cta"
                  type="button"
                  onClick={enter}
                >
                  Go see who’s out there
                  <span className="arrow" aria-hidden="true">↗</span>
                </button>
              </div>

              <p className="huh-close-note">
                Turns out, you haven’t met everyone yet.
                So… huh?
              </p>
            </div>
          </section>
        </main>

        <footer className="huh-footer">
          <div className="huh-wrap huh-footer-inner">
            <span className="huh-footer-logo">
              huh<b>?</b>
            </span>

            <span className="huh-footer-copy">
              For college students at supported institutions.
              Interface previews are illustrative; profile content varies.
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
