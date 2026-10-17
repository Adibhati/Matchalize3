# Chunk 16 — Client Pages

> Matchalize · `client-pages` · files 16 of 27 chunks · 1 file(s) · 96 KB · ~27,947 tokens
> Generated 2026-10-17 21:10.
> Paste-safe: within the 100 KB / ~29,257 token target.
>
> Contains:
> - `./client/src/pages/Profile.jsx`

---
### ./client/src/pages/Profile.jsx

```
import React, {
  useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef,
} from 'react';
import {
  AnimatePresence, motion, useMotionValue, useTransform, animate, useReducedMotion, useMotionValueEvent,
} from 'framer-motion';
import { api } from '../utils/api';
import { useQueryClient } from '@tanstack/react-query';
import { useAppConfig } from '../utils/AppConfigContext';
import { triggerHaptic } from '../utils/haptics';
import { useAuth } from '../utils/AuthContext';
import ShadowbanBanner from '../components/ShadowbanBanner';
import LearnMoreSheet from '../components/LearnMoreSheet';
import { toast } from '../utils/toast';
import { PROMPT_ANSWER_MAX, PROMPT_QUESTION_MAX } from '../utils/promptLimits.js';
import { readScore, bandFor } from '../utils/ladder.js';
import neu from '../styles/neu';

// Server-side caps mirrored from models/User.js (and FIELD_LIMITS in
// routes/users.js). Without maxLength here a user could type past the limit and
// get back "Could not save. Please try again." with no indication why — the
// server was answering 500, and now answers 400 with the exact limit.
const PROFILE_LIMITS = {
  name: 60,
  pronouns: 30,
  year: 40,
  bio: 160,
};
import {
  Sparkle, X, Pencil, Camera, Plus, CheckCircle2, Calendar,
} from 'lucide-react';

/**
 * Text field for the edit drawers, with a live character count.
 *
 * Every drawer field is CONTROLLED off `draft` and committed by the drawer's Save
 * button. These used to be uncontrolled (`defaultValue` + onBlur → PUT), which
 * meant tabbing out of a field — or just tapping past it — silently fired a write.
 * Each of those writes cost two requests (PUT /users/profile then GET /auth/me via
 * refreshUser), plus a haptic, so completing a 6-interest selection cost a dozen.
 *
 * `max` mirrors the server cap so the counter can go red as you approach it rather
 * than only after the 400 comes back.
 */
function DraftField({ value, onChange, max, multiline = false, placeholder, minHeight }) {
  const len = value.length;
  const atLimit = len >= max;
  const nearLimit = len > max * 0.9;
  const cls = 'pr-' + (multiline ? 'textarea' : 'input');
  const shared = {
    className: cls,
    value,
    placeholder,
    maxLength: max,
    onChange: (e) => onChange(e.target.value),
    style: multiline ? { minHeight: minHeight || 120 } : undefined,
  };
  return (
    <>
      {multiline ? <textarea {...shared} /> : <input {...shared} />}
      <div style={{
        alignSelf: 'flex-end', fontFamily: F.mono, fontSize: 10,
        letterSpacing: '.12em', marginTop: -6,
        color: atLimit ? C.red : nearLimit ? C.ink2 : C.ink3,
      }}>
        {len}/{max}
      </div>
    </>
  );
}

/**
 * A slot that is always on the card but has nothing in it yet.
 *
 * Prompt, About and Interests used to unmount entirely when empty, so clearing one
 * deleted the card and the edit button with it — the only way back was another
 * pencil elsewhere. They now render this instead: same frame as a filled card,
 * dashed rather than solid, and the whole thing is the tap target.
 */
const EmptySlot = ({ onClick, label, icon: Icon = Plus }) => (
  <div className="pc-slot">
    <button className="pr-empty" onClick={onClick} aria-label={label}>
      <Icon size={22} strokeWidth={2.2} color={C.ink3} />
      <span className="pc-slotlabel">{label}</span>
    </button>
  </div>
);

/* ───────────────────────── constants — identical to ProfileCard ───────────────────────── */

const FALLBACK_IMG = 'https://placehold.co/600x800/fff3dc/191919?text=%C2%B7';

const RUBBER = 0.3;
const MOMENTUM_MS = 240;
const SIDE_MARGIN = 12;
const TOP_GAP = 16;
const BOTTOM_GAP = 16;
const PEEK_PAD = 10;
const PEEK_FALLBACK = 148;

/* How far below the header's bottom edge the sheet must be for the header to
   start ducking. Small lead, so the header is fully clear on arrival. */
const HEADER_LEAD = 12;

/* Extra distance the sheet must travel back DOWN before the header returns.
   Sits ABOVE the trigger (larger y), never below it. */
const HEADER_RELEASE = 8;

/* Used only if [data-deck-header] cannot be found: DECK_TOP (12) + DECK_BTN (42). */
const HEADER_FALLBACK_BOTTOM = 54;

/* Type voices — MUST stay identical to ProfileCard.jsx. This sheet and the
   deck card are the same object seen from two screens, so any drift between
   these three lines and that file's is visible as the profile looking like a
   different app from the deck it was just swiped out of. */
const F = {
  heavy: "'Barlow Condensed', sans-serif",
  body: "'Space Grotesk', sans-serif",
  mono: "'IBM Plex Mono', monospace",
};

/* Palette — same overrides as ProfileCard.jsx, which re-tints the shared neu
   canon rather than replacing it (the spread keeps shadow/radius/z/grain, which
   this file no longer uses but other callers of neu still do). */
const C = {
  ...neu,
  ink: '#111211',
  ink2: '#383832',
  ink3: '#77766F',
  paper: '#F1EDE2',
  card: '#F8F5EC',
  desk: '#111211',
  yellow: '#E0A15E',
  coral: '#C96F68',
  green: '#779477',
  pink: '#A3A3A1',
  red: '#A84F4A',
  hair: 'rgba(17,18,17,.22)',
  line: 'rgba(241,237,226,.2)',
};

const TILE = ['coral', 'yellow', 'green', 'pink'];

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

/* ───────────────────────── styles ───────────────────────── */

const PROFILE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=IBM+Plex+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');

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
    --bw: 1px;
    --r: 8px;
    --ease: cubic-bezier(.2,0,0,1);

    position: relative; width: 100%; height: 100%; overflow: hidden;
    background: #111211;
    font-family: ${F.body}; color: var(--ink);
    -webkit-font-smoothing: antialiased;
  }
  .pc-root ::selection { background: var(--coral); color: var(--ink); }

  .pc-heroWrap { position: absolute; inset: 0; z-index: 0; transform-origin: 50% 30%; will-change: transform, opacity; }
  .pc-hero { width: 100%; height: 100%; object-fit: cover; display: block;
    opacity: 0; transition: opacity .4s ease-out; -webkit-user-drag: none; }
  .pc-hero.is-loaded { opacity: 1; }
  .pc-shade { position: absolute; inset: 0; pointer-events: none;
    background: linear-gradient(to top, rgba(17,18,17,.65) 0%, rgba(17,18,17,.08) 44%, rgba(17,18,17,.20) 100%); }

  /* SMOOTHNESS: own compositor layer + paint containment, so the shadow
     and all children never force full-page repaints while dragging */
  .pc-sheet { position: absolute; left: ${SIDE_MARGIN}px; right: ${SIDE_MARGIN}px; top: 0; z-index: 30;
    background: var(--paper); border: var(--bw) solid var(--ink); border-radius: 15px 15px 4px 4px;
    box-shadow: 0 14px 32px rgba(0,0,0,.22);
    transform: translateZ(0); backface-visibility: hidden;
    contain: layout paint style;
    touch-action: none; cursor: grab; user-select: none; -webkit-user-select: none; -webkit-tap-highlight-color: transparent;
    padding: 12px 18px calc(26px + env(safe-area-inset-bottom));
    display: flex; flex-direction: column; gap: 19px; will-change: transform; }
  .pc-sheet:active { cursor: grabbing; }
  .pc-sheet img { -webkit-user-drag: none; }

  .pc-grabber { width: 42px; height: 4px; border-radius: 0; margin: 0 auto 0; flex-shrink: 0;
    background: var(--ink-3); transition: none; }
  .pc-sheet:active .pc-grabber { background: var(--coral); }

  .pc-notetext { display: block; text-align: center; margin-bottom: 4px;
    font-family: ${F.mono}; font-size: 9px; font-weight: 700; letter-spacing: .2em;
    text-transform: uppercase; color: var(--ink-3); pointer-events: none; }

  .pc-id { position: relative; }
  .pc-idrow { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; }
  .pc-name { font-family: ${F.heavy}; font-size: 39px; font-weight: 800; letter-spacing: -.025em;
    line-height: .92; color: var(--ink); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    background-image: linear-gradient(180deg, transparent 77%, rgba(224,161,94,.78) 77%);
    padding: 0 6px 5px 0; }
  .pc-age { font-family: ${F.body}; font-weight: 600; font-size: .65em;
    letter-spacing: 0; color: var(--ink-2); }
  /* The deck carries college/distance here; this sheet has neither (the campus
     is privacy-gated and distance is meaningless for your own card), so the year
     takes the same mono line. */
  .pc-meta { font-family: ${F.mono}; font-size: 9px; font-weight: 700; letter-spacing: .075em;
    text-transform: uppercase; color: var(--ink-2); font-variant-numeric: tabular-nums;
    margin: 10px 0 0; display: flex; align-items: center; flex-wrap: wrap; row-gap: 4px; }

  .pc-sec { display: flex; flex-direction: column; flex-shrink: 0; position: relative; }
  .pc-shead { display: flex; align-items: center; gap: 9px; margin: 0 0 12px;
    padding-bottom: 8px; border-bottom: 1px solid var(--hair); }
  .pc-mark { width: 9px; height: 9px; flex-shrink: 0; border: 1px solid var(--ink); border-radius: 0; }
  .pc-mark.yellow { background: var(--yellow); }
  .pc-mark.coral { background: var(--coral); }
  .pc-mark.green { background: var(--green); }
  .pc-mark.pink { background: var(--pink); }
  .pc-stitle { font-family: ${F.mono}; font-size: 10px; font-weight: 700; letter-spacing: .14em;
    text-transform: uppercase; color: var(--ink); }
  .pc-scount { margin-left: auto; font-family: ${F.mono}; font-size: 9px; font-weight: 400; color: var(--ink-3);
    font-variant-numeric: tabular-nums; }

  .pc-card { background: var(--card); border: var(--bw) solid var(--ink); border-radius: 5px;
    box-shadow: none; position: relative; }
  .pc-card.padded { padding: 15px; }

  /* '.pc-compat' was the compatibility score block's positioning hook.
     Renamed to say what it now wraps: the profile-strength readout.
     NOTE: no backticks in this comment — this whole block is a JS template
     literal, so a single backtick here terminates the string early and the
     remaining ~9k characters get parsed as JavaScript. That is not a
     theoretical hazard: it shipped as "ReferenceError: compat is not
     defined" and took the entire Profile page with it. */
  .pc-strengthhead { position: relative; }
  .pc-scorehead { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; }
  .pc-scorenum { display: flex; align-items: flex-start; }
  .pc-num { font-family: ${F.heavy}; font-size: 54px; font-weight: 800; letter-spacing: -.02em;
    line-height: .9; color: var(--ink); font-variant-numeric: tabular-nums; }
  .pc-pct { font-family: ${F.mono}; font-size: 13px; font-weight: 700; color: var(--ink-3); margin: 4px 0 0 4px; }
  .pc-statust { font-family: ${F.mono}; font-size: 10px; font-weight: 700; letter-spacing: .12em;
    text-transform: uppercase; color: var(--ink-2); text-align: right; line-height: 1.7; }
  .pc-star { color: var(--coral); font-size: 12px; }
  .pc-bar { height: 12px; border: var(--bw) solid var(--ink); border-radius: 3px; background: var(--paper);
    overflow: hidden; margin-top: 14px; }
  .pc-barfill { width: 100%; height: 100%; background: var(--yellow); transform-origin: left center; }

  .pc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px 12px; }
  .pc-cell { display: flex; align-items: center; gap: 9px; min-width: 0; }
  .pc-tile { width: 31px; height: 31px; flex-shrink: 0; border: var(--bw) solid var(--ink); border-radius: 3px;
    display: flex; align-items: center; justify-content: center; color: var(--ink); }
  .pc-tile.yellow { background: var(--yellow); }
  .pc-tile.coral { background: var(--coral); }
  .pc-tile.green { background: var(--green); }
  .pc-tile.pink { background: var(--pink); }
  .pc-cellinfo { min-width: 0; }
  .pc-clabel { font-family: ${F.mono}; font-size: 8px; font-weight: 700; letter-spacing: .12em;
    text-transform: uppercase; color: var(--ink-3); }
  .pc-cval { font-size: 13px; font-weight: 700; color: var(--ink); margin-top: 3px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }

  /* The deck has no edit tiles; this sheet does, and they are absolutely
     positioned in the top-right of their card. The right-hand clears below keep
     long text and chip rows from running underneath one. */
  .pc-bio { font-size: 14px; font-weight: 500; line-height: 1.7; color: var(--ink-2);
    margin: 0; word-break: break-word; text-wrap: pretty; padding-right: 38px; }

  .pc-pills { display: flex; flex-wrap: wrap; gap: 8px; padding-right: 38px; }
  .pc-chip { display: inline-block; padding: 7px 11px; border: var(--bw) solid var(--ink); border-radius: 999px;
    font-family: ${F.mono}; font-size: 9px; font-weight: 700; letter-spacing: .075em; text-transform: uppercase;
    background: var(--card); color: var(--ink); transition: background .12s ease, color .12s ease; }
  .pc-chip.acc { background: var(--yellow); }
  .pc-chip:active { background: var(--ink); color: var(--paper); border-color: var(--ink); }

  /* prompt card: question is the SETUP, answer is the PAYOFF — so the answer
     carries the type weight. */
  .pc-prompt { padding: 15px; transition: background .12s ease, color .12s ease; }
  .pc-promptq { font-family: ${F.mono}; font-size: 10px; font-weight: 700; line-height: 1.6;
    letter-spacing: .025em; color: var(--ink-3); margin: 0 0 8px; word-break: break-word;
    padding-right: 38px; transition: none; }
  .pc-prompta { font-size: 16px; font-weight: 700; line-height: 1.5; color: var(--ink);
    margin: 0; word-break: break-word; overflow-wrap: anywhere; text-wrap: pretty;
    padding-right: 38px; transition: none; }
  .pc-prompt:active .pc-prompta { color: var(--paper); }
  .pc-prompt:active .pc-promptq { color: rgba(241,237,226,.6); }

  .pc-ph { background: var(--card); border: var(--bw) solid var(--ink); border-radius: 5px;
    box-shadow: none; padding: 5px; position: relative;
    transition: border-color .12s ease; }
  .pc-ph:active { border-color: var(--coral); }
  .pc-ph-in { border-radius: 2px; overflow: hidden; aspect-ratio: 1 / 1; background: var(--hair); }
  .pc-ph-in.wide { aspect-ratio: 16 / 10; }
  .pc-ph-in img { width: 100%; height: 100%; object-fit: cover; display: block;
    opacity: 0; transition: opacity .3s ease-out; -webkit-user-drag: none; }
  .pc-ph-in img.is-loaded { opacity: 1; }

  /* ── THE one constant edit button: same corner tile on every slot ── */
  .pr-slotbtn { position: absolute; top: 8px; right: 8px; z-index: 5;
    display: flex; align-items: center; justify-content: center; cursor: pointer;
    width: 30px; height: 30px; background: var(--yellow); border: var(--bw) solid var(--ink);
    border-radius: 4px; color: var(--ink);
    transition: background .12s ease, color .12s ease;
    -webkit-tap-highlight-color: transparent; }
  .pr-slotbtn:active { background: var(--ink); color: var(--paper); }
  /* inline variant: a flex item at the end of a section head, not a corner
     tile. Styled as the deck's .pc-iconbtn — flat ink outline, no fill — because
     there is one of these on most section heads and the filled tan tile at that
     density turned the column into a ladder of orange blocks. The filled tile
     stays on cards and photos, where it has a surface to sit on and a single
     job to advertise. */
  .pr-slotbtn.inline { position: static; width: 28px; height: 28px; flex-shrink: 0;
    background: transparent; border-radius: 4px; }
  .pr-slotbtn.inline:hover { background: var(--yellow); }
  .pr-slotbtn.inline:active { background: var(--ink); color: var(--paper); }

  /* hero variant — same tile, anchored to the hero's top-right */
  .pr-herobtn { position: absolute; top: calc(env(safe-area-inset-top, 0px) + 68px); right: 20px; z-index: 5;
    display: flex; align-items: center; justify-content: center; cursor: pointer;
    width: 30px; height: 30px; background: var(--yellow); border: var(--bw) solid var(--ink);
    border-radius: 4px; color: var(--ink);
    transition: background .12s ease, color .12s ease;
    -webkit-tap-highlight-color: transparent; }
  .pr-herobtn:active { background: var(--ink); color: var(--paper); }

  .pr-empty { width: 100%; height: 100%; border-radius: 2px; border: 1px dashed var(--ink-3);
    background: transparent; display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 8px; cursor: pointer; -webkit-tap-highlight-color: transparent; }

  /* ── upload progress: indeterminate sweep, pinned to the tile's inner edge ──
     fetch() + FormData cannot report upload bytes, so this deliberately does NOT
     show a fake percentage. It signals "in flight" and sweeps until resolve. */
  .pr-bar { position: absolute; left: 0; right: 0; bottom: 0; height: 4px; z-index: 7;
    background: var(--hair); overflow: hidden; pointer-events: none;
    border-radius: 0 0 2px 2px; }
  .pr-bar::after { content: ''; position: absolute; inset: 0; width: 45%;
    background: var(--yellow);
    animation: prSweep 1.05s cubic-bezier(.5,0,.5,1) infinite; }
  @keyframes prSweep {
    0%   { transform: translateX(-110%); }
    100% { transform: translateX(240%); }
  }

  /* per-photo action tray — the pencil opens Replace / Remove rather than
     re-picking immediately, so removal is discoverable without putting a second
     button permanently on every tile. */
  .pr-tray { position: absolute; inset: 0; z-index: 6;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 7px; border-radius: 5px; background: rgba(17,18,17,.72); padding: 6px; }
  .pr-traybtn { display: inline-flex; align-items: center; justify-content: center; gap: 5px;
    width: 100%; padding: 7px 4px; border-radius: 4px;
    border: var(--bw) solid var(--ink); background: var(--paper); color: var(--ink);
    font-family: ${F.mono}; font-size: 9px; font-weight: 700;
    letter-spacing: .08em; text-transform: uppercase; cursor: pointer;
    transition: background .12s ease, color .12s ease;
    -webkit-tap-highlight-color: transparent; }
  .pr-traybtn:active { background: var(--ink); color: var(--paper); }
  .pr-traybtn.danger { background: var(--red); color: #fff; }

  /* hero tray — anchored to the photo strip, never covered by the sheet */
  .pr-herotray { position: absolute; z-index: 8; right: 20px;
    top: calc(env(safe-area-inset-top, 0px) + 106px);
    display: flex; flex-direction: column; gap: 9px; width: 148px; }

  /* Hero variants of the tray buttons. The tile trays sit on photos a fraction
     of the screen wide and have to stay small; the hero tray floats over empty
     background with room to spare, so these are scaled up to roughly a 44px
     touch target — the same as the app's other primary controls — which is what
     they were missing on the main photo. */
  .pr-traybtn.big { padding: 13px 8px; gap: 7px; border-radius: 5px; font-size: 11px; letter-spacing: .1em; }
  .pr-traybtn.big svg { width: 15px; height: 15px; flex: none; }

  /* Wrapper that gives the hero pencil + tray one element to hang the
     tap-outside-dismiss ref on. display:contents keeps both children
     absolutely positioned against .pc-heroWrap exactly as before — the wrapper
     generates no box of its own and never appears in hit-testing. */
  .pc-herocontrols { display: contents; }

  /* hero upload pill — a direct child of .pc-root, NOT of .pc-heroWrap.
     The hero wrap sits at z-index 0 and the sheet at 30, so an indicator drawn
     inside the hero is covered wherever the sheet reaches the bottom of the
     screen — which is exactly where it sat, i.e. invisible at rest. This is
     pinned to the photo strip at the top, which stays visible at every sheet
     position. The transform property is deliberately NOT set here: framer-motion
     owns the transform for the enter/exit slide, and a CSS translateX(-50%) would
     be overwritten by it, knocking the pill off-centre on mount. Centering is
     supplied via the x:"-50%" motion prop instead. */
  .pr-uploadpill { position: absolute;
    top: calc(env(safe-area-inset-top, 0px) + 118px); left: 50%;
    z-index: 60; overflow: hidden;
    display: inline-flex; align-items: center; gap: 9px;
    padding: 8px 14px; background: var(--paper);
    border: var(--bw) solid var(--ink); border-radius: 999px;
    font-family: ${F.mono}; font-size: 10px; font-weight: 700;
    letter-spacing: .14em; text-transform: uppercase; color: var(--ink);
    pointer-events: none; }
  .pr-uploadpill::after { content: ''; position: absolute; left: 0; bottom: 0;
    height: 3px; width: 45%; background: var(--yellow);
    animation: prSweep 1.05s cubic-bezier(.5,0,.5,1) infinite; }

  .pr-input, .pr-select, .pr-textarea { width: 100%; box-sizing: border-box;
    padding: 13px 14px; background: var(--card); border: var(--bw) solid var(--ink); border-radius: 5px;
    font-family: ${F.body}; font-size: 14px; font-weight: 500; color: var(--ink); outline: none; }
  .pr-textarea { resize: none; line-height: 1.55; }
  .pr-input:focus, .pr-select:focus, .pr-textarea:focus { border-color: var(--coral); }

  .pr-chipbtn { padding: 9px 15px; border: var(--bw) solid var(--ink); border-radius: 999px;
    font-family: ${F.mono}; font-size: 11px; font-weight: 700; letter-spacing: .08em;
    text-transform: uppercase; background: var(--card); color: var(--ink); cursor: pointer;
    transition: background .12s ease, color .12s ease; -webkit-tap-highlight-color: transparent; }
  .pr-chipbtn.on { background: var(--coral); color: #fff; }
  .pr-chipbtn:disabled { opacity: .35; cursor: not-allowed; }
  .pr-chipbtn:active:not(:disabled) { background: var(--ink); color: var(--paper); }

  .pr-slam { display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    width: 100%; padding: 14px; background: var(--card); color: var(--ink);
    border: var(--bw) solid var(--ink); border-radius: 5px;
    font-family: ${F.mono}; font-size: 12px; font-weight: 700; letter-spacing: .12em;
    text-transform: uppercase; cursor: pointer;
    transition: background .12s ease, color .12s ease;
    -webkit-tap-highlight-color: transparent; }
  .pr-slam:active:not(:disabled) { background: var(--ink); color: var(--paper); }
  .pr-slam.yellow { background: var(--yellow); }
  .pr-slam.yellow:active:not(:disabled) { background: var(--ink); color: var(--paper); }
  .pr-slam.danger { color: var(--red); }
  /* Save stays visible but inert until something actually changes — that is the
     feedback that tells you the drawer has nothing to commit. */
  .pr-slam:disabled { opacity: .34; cursor: not-allowed; }

  /* ── always-visible "addable" slot ──
     A prompt / bio / interests slot keeps its place on the card whether or not it
     has content, so clearing one never makes the layout jump. Filled slots use the
     real card chrome; empty ones use this dashed frame around the shared .pr-empty,
     so every empty slot in the sheet looks the same however it was reached. */
  .pc-slot { background: transparent; border: 1px dashed var(--hair);
    border-radius: 5px; padding: 5px; position: relative; box-shadow: none; }
  .pc-slot .pr-empty { min-height: 68px; }

  .pc-slotlabel { font-family: ${F.mono}; font-size: 9px; font-weight: 700;
    letter-spacing: .14em; text-transform: uppercase; color: var(--ink-3); }

  /* ── drawer commit bar: sticky, always reachable above the keyboard ── */
  .pr-drawerfoot { display: flex; gap: 10px; padding: 14px 20px;
    padding-bottom: calc(14px + env(safe-area-inset-bottom));
    border-top: var(--bw) solid var(--ink); background: var(--paper); flex-shrink: 0; }
  .pr-drawerfoot .pr-slam { flex: 1; }

  /* ── header duck: literal easing, no var() dependency ── */
  [data-deck-header] { transition: transform .3s cubic-bezier(.2,0,0,1), opacity .3s ease;
    will-change: transform, opacity; }
  body[data-sheet-near-top="1"] [data-deck-header] {
    transform: translateY(-140%); opacity: 0; pointer-events: none; }

  @media (hover: hover) and (pointer: fine) {
    .pr-slotbtn:hover, .pr-herobtn:hover { background: var(--yellow); color: var(--ink); }
    .pc-prompt:hover { background: #E9E4D8; }
    .pc-chip:hover { background: rgba(224,161,94,.2); }
    .pc-chip.acc:hover { background: var(--yellow); }
    .pc-ph:hover { border-color: var(--coral); }
  }

  .pc-sheet:focus-visible, .pr-slotbtn:focus-visible, .pr-herobtn:focus-visible,
  .pc-prompt:focus-visible { outline: 2px solid var(--coral); outline-offset: 3px; }

  @media (max-width: 390px) {
    .pc-sheet { padding-left: 14px; padding-right: 14px; gap: 17px; }
    .pc-name { font-size: 34px; }
    .pc-grid { gap: 12px 8px; }
    .pc-cell { gap: 7px; }
    .pc-tile { width: 28px; height: 28px; }
    .pc-cval { font-size: 12px; }
  }

  @media (prefers-reduced-motion: reduce) {
    .pc-hero, .pc-ph-in img, .pr-slotbtn, .pr-herobtn, .pc-ph,
    .pc-chip, .pc-prompt, .pr-traybtn, .pr-chipbtn, .pr-slam { transition: none; }
    .pr-bar::after { animation: none; width: 100%; }
    .pr-uploadpill::after { animation: none; width: 100%; }
    [data-deck-header] { transition: none; }
  }
`;

/* ───────────────────────── small pieces ───────────────────────── */

const AnimatedNumber = ({ mv }) => {
  const [text, setText] = useState('0');
  useMotionValueEvent(mv, 'change', (v) => setText(String(Math.round(v))));
  return <>{text}</>;
};

const FieldCell = ({ icon: Icon, color, label, value }) => (
  <div className="pc-cell">
    <span className={`pc-tile ${color}`}><Icon size={16} strokeWidth={2.4} /></span>
    <span className="pc-cellinfo">
      <span className="pc-clabel" style={{ display: 'block' }}>{label}</span>
      <span className="pc-cval" style={{ display: 'block' }}>{value}</span>
    </span>
  </div>
);

/* plain head — the edit button rides inline as a flex item (same slot the deck
   gives its kebab) rather than floating over the row as an absolute corner
   tile, which would sit on top of the right-aligned count. Sections whose body
   is a real .pc-card keep the absolute corner tile instead. */
const SectionHead = ({ mark = 'yellow', count, onEdit, editLabel, children }) => (
  <div className="pc-shead">
    <span className={`pc-mark ${mark}`} aria-hidden="true" />
    <span className="pc-stitle">{children}</span>
    {count > 0 && <span className="pc-scount">/ {count}</span>}
    {onEdit && (
      <button className="pr-slotbtn inline" aria-label={editLabel} title={editLabel} onClick={onEdit}>
        <Pencil size={12} strokeWidth={2.8} />
      </button>
    )}
  </div>
);

/**
 * One of the three prompt slots.
 *
 * Always mounted. A slot with a question shows the card (question small and
 * muted, answer large and bold); a slot without one shows the dashed add-target.
 * The answer line only appears when there is an answer, so a half-finished prompt
 * doesn't render an empty gap where the reply should be.
 */
const PromptSlot = ({ slot, prompt, onEdit }) => {
  if (!prompt?.question) {
    return <EmptySlot onClick={onEdit} label="Add a question" icon={Pencil} />;
  }
  return (
    <div className="pc-card pc-prompt">
      <button className="pr-slotbtn" aria-label={`Edit question ${slot + 1}`} onClick={onEdit}>
        <Pencil size={13} strokeWidth={2.8} />
      </button>
      <p className="pc-promptq">{prompt.question}</p>
      {prompt.answer && <p className="pc-prompta">{prompt.answer}</p>}
    </div>
  );
};

/**
 * Close `onDismiss` when a tap lands outside `ref`.
 *
 * The Replace/Remove trays used to only close by picking one of their two
 * buttons, so a mis-tap left a dark scrim sitting on the photo with no obvious
 * way out. This dismisses on the next tap anywhere else instead.
 *
 * Uses pointerdown rather than click so the tray is gone before the tap's own
 * click target is handled — otherwise a tap on another tile's pencil would
 * dismiss this tray and then immediately open that one. `pointerdown` is also
 * what fires on iOS before the click synthesised after touchend, so the listener
 * is attached from the commit of the opening tap onward and never sees the tap
 * that opened the tray.
 */
const useDismissOnOutsideTap = (ref, open, onDismiss) => {
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onDismiss();
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [ref, open, onDismiss]);
};

/* Three states on the corner tile:
     no photo   → pencil opens the picker (add)
     photo      → pencil opens the Replace/Remove tray
     uploading  → ✕ cancels

   Remove is only offered when the tile actually holds a photo. */
const PhotoTile = ({ src, wide = false, onEdit, onRemove, onCancel, emptyLabel, loading = false }) => {
  const [tray, setTray] = useState(false);
  const tileRef = useRef(null);
  const closeTray = useCallback(() => setTray(false), []);
  useDismissOnOutsideTap(tileRef, tray && !loading, closeTray);
  return (
    <div className="pc-ph" ref={tileRef}>
      <button
        className="pr-slotbtn"
        onClick={loading ? onCancel : (src ? () => setTray((t) => !t) : onEdit)}
        aria-label={loading ? 'Cancel upload' : (src ? 'Photo options' : (emptyLabel || 'Add photo'))}
        aria-expanded={src ? tray : undefined}
      >
        {loading ? <X size={13} strokeWidth={3} /> : <Pencil size={13} strokeWidth={2.8} />}
      </button>
      <div className={`pc-ph-in${wide ? ' wide' : ''}`}>
        {src ? (
          <img
            src={src}
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
        ) : (
          <button className="pr-empty" onClick={onEdit} disabled={loading}>
            <Camera size={22} strokeWidth={2.2} color={C.ink3} />
            <span style={{ fontFamily: F.mono, fontSize: 8.5, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: C.ink3 }}>
              {emptyLabel || 'Add photo'}
            </span>
          </button>
        )}
      </div>
      {loading && <span className="pr-bar" role="status" aria-label="Uploading photo" />}
      {tray && !loading && (
        <div className="pr-tray">
          <button className="pr-traybtn" onClick={() => { setTray(false); onEdit(); }}>
            <Pencil size={11} strokeWidth={2.8} /> Replace
          </button>
          <button className="pr-traybtn danger" onClick={() => { setTray(false); onRemove(); }}>
            <X size={11} strokeWidth={3} /> Remove
          </button>
        </div>
      )}
    </div>
  );
};

/* ───────────────────────── main ───────────────────────── */

/* Mirrors server/config/appData.js APP_CONSTANTS. The server enforces this
   regardless — it only stops the UI offering a pick that would be discarded on
   save.

   ⚠️ There is deliberately NO MAX_INTENTS here any more; all three may be held.
   Kept as a single constant rather than inline so there is one number to change
   if the interest limit ever moves. */
const MAX_INTERESTS = 10;

const Profile = ({ onHeaderHiddenChange, focusStrength = false, onStrengthFocused }) => {  const config = useAppConfig();
  const queryClient = useQueryClient();
  const rootRef = useRef(null);
  const sheetRef = useRef(null);
  const idRef = useRef(null);
  const heroImgRef = useRef(null);
  const fileInputRef = useRef(null);

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [heroLoaded, setHeroLoaded] = useState(false);

  const [drawerConfig, setDrawerConfig] = useState(null); // { type, slot }
  // Pending edits for the open drawer, seeded from userData on open and written
  // to the server ONLY by the drawer's Save button. Null means no drawer is open.
  const [draft, setDraft] = useState(null);

  // `photoSlot` is the PICKER target, cleared the moment the picker hands over a
  // file. `uploadSlot` is the slot currently in flight (null when idle) — these
  // have to be separate, otherwise clearing the target on completion also wipes
  // the "which tile is busy" signal while the request is still running.
  const [photoSlot, setPhotoSlot] = useState(null);
  const [uploadSlot, setUploadSlot] = useState(null);
  // Whether a tile's Replace/Remove tray is open. Separate from uploadSlot so
  // picking a file can dismiss the tray without needing to know which opened it.
  const [heroTray, setHeroTray] = useState(false);
  // Dismiss target for the hero tray: spans the pencil and the tray itself so
  // their own buttons don't count as outside taps.
  const heroControlsRef = useRef(null);
  const closeHeroTray = useCallback(() => setHeroTray(false), []);
  useDismissOnOutsideTap(
    heroControlsRef,
    heroTray && uploadSlot !== 0 && Boolean(userData.photos?.[0]),
    closeHeroTray
  );
  // Lets the tile's pencil cancel an in-flight upload instead of forcing the
  // user to wait out a slow connection.
  const abortRef = useRef(null);

  // Scrollable body of the edit drawer. Ref'd so picking a prompt from the bank
  // at the bottom can jump back up to the question/answer it just changed.
  const drawerBodyRef = useRef(null);
  const scrollDrawerToTop = () => {
    const el = drawerBodyRef.current;
    if (!el) return;
    // 'smooth' so the jump reads as a return rather than a jump cut. Cancels any
    // scroll still in flight from the tap's own momentum, so a fast re-tap on the
    // bank doesn't fight the animation.
    el.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const { user: authUser, refreshUser } = useAuth();
  const [showLearnMore, setShowLearnMore] = useState(false);

  // Always-fresh mirror of userData. Async handlers (photo upload, prompt
  // commit) read this instead of the render closure, so two edits in quick
  // succession build on the latest state rather than the state captured when
  // the handler was created — which silently dropped the first edit.
  const userDataRef = useRef(null);
  userDataRef.current = userData;

  // Monotonic save counter. Each PUT captures the sequence number it started
  // with; a response is discarded if a newer save has since begun. Without
  // this, two rapid edits can resolve out of order and the slower (older)
  // response overwrites the newer one — the server has the right data, the
  // client shows the old value, and only a refresh fixes it.
  const saveSeq = useRef(0);
  const contentFreezeMessage = 'Edits are paused while your account is under review.';
  // With an action the toast runs 7s instead of 4s, and the user gets a way to
  // actually reach support instead of a dead end.
  const contentFreezeAction = {
    label: 'Contact support',
    onClick: () => { window.location.href = 'mailto:support@matchalize.com'; },
  };

  const contentFrozen = userData?.contentFrozen ?? authUser?.contentFrozen ?? false;
  const shadowbanScore = userData?.shadowbanScore ?? authUser?.shadowbanScore ?? 0;

  /* True when the draft differs from what's on the server. Drives both the Save
     button's enabled state and the discard-on-close guard.
     Reads `userData` directly rather than the ref so it recomputes if a save
     lands from elsewhere while the drawer is open — otherwise Save could stay
     disabled, or stay enabled after matching the server. */
  const isDrawerDirty = useMemo(() => {
    if (!drawerConfig || !draft || !userData) return false;
    const u = userData;
    const type = drawerConfig.type;
    if (type === 'interests' || type === 'intent') {
      const saved = [...(u[type] || [])].sort();
      return JSON.stringify([...draft.list].sort()) !== JSON.stringify(saved);
    }
    if (type === 'prompt') {
      const p = u.prompts?.[drawerConfig.slot] || {};
      return draft.question !== (p.question || '') || draft.answer !== (p.answer || '');
    }
    // Text fields: compare against the stored value, treating '' and undefined
    // as the same thing so clearing an already-empty box is not "dirty".
    if ('gapYear' in draft && !!draft.gapYear !== !!u.gapYear) return true;
    return ['name', 'year', 'gender', 'pronouns', 'bio']
      .filter((k) => k in draft)
      .some((k) => draft[k] !== (u[k] || ''));
  }, [drawerConfig, draft, userData]);

  /* Snapshot the current values for whichever drawer is opening. Every drawer reads
     from `draft` after this, so nothing is committed until Save is pressed. */
  const seedDraft = (cfg) => {
    const u = userDataRef.current;
    switch (cfg.type) {
      case 'identity':
        return { name: u.name || '', year: u.year || '' };
      case 'vitals':
        return { gender: u.gender || '', pronouns: u.pronouns || '', gapYear: !!u.gapYear };
      case 'bio':
        return { bio: u.bio || '' };
      case 'prompt': {
        const p = u.prompts?.[cfg.slot] || {};
        return { question: p.question || '', answer: p.answer || '' };
      }
      case 'interests':
        return { list: [...(u.interests || [])] };
      case 'intent':
        return { list: [...(u.intent || [])] };
      default:
        return {};
    }
  };

  const openEditDrawer = (cfg) => {
    if (contentFrozen) { toast.error(contentFreezeMessage, contentFreezeAction); return; }
    setDraft(seedDraft(cfg));
    setDrawerConfig(cfg);
  };

  /* Close, but never silently throw away an edit. The drawer is also dismissible
     by tapping the backdrop and by the ✕, and those three paths all route here so
     the guard can't be bypassed by using a different gesture. */
  const requestCloseDrawer = () => {
    if (isDrawerDirty && !window.confirm('Discard your unsaved changes?')) return;
    setDrawerConfig(null);
    setDraft(null);
  };

  const openPhotoSlot = (slot) => {
    if (contentFrozen) { toast.error(contentFreezeMessage, contentFreezeAction); return; }
    // One upload at a time: abortRef holds a single controller, so a second
    // concurrent pick would orphan the first abort path.
    if (uploadSlot !== null) { toast.error('Wait for the current upload to finish.'); return; }
    setHeroTray(false);
    setPhotoSlot(slot);
    fileInputRef.current?.click();
  };

  const cancelUpload = () => {
    if (!abortRef.current) return;
    triggerHaptic('light');
    abortRef.current.abort();
  };

  /**
   * Remove the photo at `slot`.
   *
   * `photos` is a DENSE array — the server runs `filter(Boolean)` before saving
   * (routes/users.js:368), so a hole is not representable and would silently
   * collapse into a left-shift on the next save anyway. Removal therefore has to
   * splice: the photo after it slides up to take its place. That is also what
   * the deck card expects, since it renders photos positionally
   * (photos[0] = hero, photos[1..3] = tiles).
   *
   * Consequence, and it is the correct one: removing the hero promotes the next
   * photo to hero. There is no "gap" the UI could ever hold.
   */
  const removePhoto = (slot) => {
    if (contentFrozen) { toast.error(contentFreezeMessage, contentFreezeAction); return; }
    const photos = [...(userDataRef.current.photos || [])];
    if (slot < 0 || slot >= photos.length) return;
    const isHero = slot === 0;
    const label = isHero ? 'your main photo' : 'this photo';
    if (!window.confirm(`Remove ${label}? The next photo will move up.`)) return;
    photos.splice(slot, 1);
    updateProfile({ photos });
  };

  /* ── completion score ──
     READ FROM THE SERVER, never computed here.

     This used to be a local `targetScore` useMemo: a flat 30 plus 10 for each
     of eight conditions, one of which was `hostel`. That formula disagreed with
     the deck and with itself — the thresholds that gated the deck were nowhere
     in it, and a profile could read "Exemplary" while the deck still treated it
     as unpublished.

     `User.profileScore` is computed by server/utils/ladder.js and recomputed on
     every profile write. Rendering it is the whole job here. Until the backfill
     runs, a pre-existing user has no score and reads 0 — correct, because an
     unbackfilled document genuinely has nothing computed for it yet. */
  const targetScore = readScore(userData);

  /* ── geometry ── */
  const [rootH, setRootH] = useState(0);
  const [sheetH, setSheetH] = useState(0);

  /* True only once the actual card tree is on screen.
     The measure effects need a dep that flips when the sheet first EXISTS,
     because while the fetch is in flight the component renders the
     "Loading your card…" screen, so sheetRef is null and the effect bails out
     with no observer attached. It must NOT key on `userData` itself: that object
     gets a new identity on every optimistic save and every PUT response, so
     keying on it tore down the ResizeObserver mid-entrance and reopened the
     re-clamp window — which is what made the slide-up land differently
     depending on whether you refreshed or switched tabs. */
  const cardMounted = !loading && Boolean(userData) && !fetchError;
  const rootHRef = useRef(0);
  const sheetHRef = useRef(0);
  const entranceTimer = useRef(null);
  const entranceUntil = useRef(0);        // timestamp: re-clamp stays off until here
  /* Set-once marker for the sheet entrance, mirroring the deck card.
     Identity of the profile the entrance has already played for; nulled on
     teardown so a remount replays it. */
  const entranceDoneFor = useRef(null);
  /* Set once the strength-bar placement has happened for a given profile. */
  const focusPlacedFor = useRef(null);
  /* Mirrors `focusStrength` for the measure pass to read. A ref, not the prop
     itself, because the measure effect is deliberately gated on `[cardMounted]`
     — adding focusStrength to its deps would re-run every measurement, and the
     re-clamp at the end of that pass would fight the glide it had just started.
     Assigning during render keeps it current without touching the deps. */
  const focusStrengthRef = useRef(false);
  focusStrengthRef.current = focusStrength;
  const peekHRef = useRef(0);

  const computeBounds = (h, w) => {
    if (!h || !w) return { lo: 0, hi: 0, ready: false, short: true };
    const lo = Math.min(TOP_GAP, h - BOTTOM_GAP - w);
    const peek = peekHRef.current || PEEK_FALLBACK;
    const short = w <= h - BOTTOM_GAP - TOP_GAP;
    const hi = Math.max(lo, h - BOTTOM_GAP - (short ? w : peek));
    return { lo, hi, ready: true, short };
  };

  /* SMOOTHNESS FIX: bounds now computed in an effect (not on every render),
     and memoized so the drag handlers read stable values */
  const boundsRef = useRef({ lo: 0, hi: 0, ready: false });
  /* The "Profile strength" section, for the focus-on-arrival glide. */
  const strengthRef = useRef(null);

  /* ── motion values ── */
  const yMV = useMotionValue(0);
  const scoreMV = useMotionValue(0);
  const barFill = useTransform(scoreMV, (v) => clamp(v, 0, 100) / 100);

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
     Opacity + scale only. This used to animate `filter: blur(12px) → 0` on the
     hero wrapper, which re-rasterises a full-bleed photo every frame and — worse —
     because `filter` creates a containing block, the wrapper's own edit pencil was
     blurred along with the image for the whole 500ms. `will-change: transform,
     filter` also promoted the layer permanently. Both now compositor-only. */
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

  /* ── fetch ── */
  // Extracted so the error state can offer a real retry. This used to be an
  // anonymous inner function inside useEffect, and its catch only logged — so a
  // single failed request left `loading === false && userData === null`, which
  // the render guard below reported as "Loading your card…" FOREVER. The user got
  // one transient toast and then a screen that insisted it was still loading, with
  // no error, no retry and no way forward except a reload.
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await api.get('/users/profile');
      if (!data.photos) data.photos = [];
      if (!data.prompts) data.prompts = [{}, {}, {}];
      if (!data.interests) data.interests = [];
      if (!data.intent) data.intent = [];
      setUserData(data);
    } catch (err) {
      console.error('Failed to fetch profile', err);
      setFetchError(err?.message || 'Could not load your profile.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  /* ── count-up ──
     Keyed on the SCORE, not the profile id.

     This was keyed on `userData?._id`, which meant it ran exactly once per
     mount — so the number froze at whatever it was when the page loaded. Add a
     photo, write a prompt, edit a bio, and the bar never moved until a full
     browser refresh remounted the component. The ladder is supposed to be
     live feedback ("you are 12 points from unlocking"), so a number that only
     updates on reload actively works against the thing it is measuring.

     The original reason for keying on the id was that this effect used to
     contain `entranceOpacity.set(0)`, so any re-run reset the photo and made
     it fade out and back in on every keystroke. Entrance now lives in its own
     effect below keyed on reduceMotion alone, so re-running THIS one only
     re-animates the number — the photo is untouched.

     No `scoreMV.set(0)` either: the motion value starts at 0, so mount still
     counts up from zero, and later changes animate from the current value
     instead of snapping back to zero first. */
  const firstScoreRun = useRef(true);
  useEffect(() => {
    if (!userData) return undefined;
    // The 250ms hold is only for the first count-up, so it lands after the
    // card entrance. Applying it to every update would make the bar feel like
    // it was lagging a quarter-second behind each edit.
    const isFirst = firstScoreRun.current;
    firstScoreRun.current = false;
    const c = animate(scoreMV, targetScore, reduceMotion
      ? { duration: 0 }
      : { duration: 1.2, delay: isFirst ? 0.25 : 0, ease: [0.22, 1, 0.36, 1] });
    return () => c.stop();
  }, [targetScore, reduceMotion, userData?._id]);

  /* ── entrance animation: photo fade-in + slight scale-up ──
     Keyed on reduceMotion ALONE, so it plays exactly once per mount and is never
     replayed by a data update. The deck card keys this the same way. */
  useEffect(() => {
    if (reduceMotion) {
      entranceOpacity.set(1);
      return undefined;
    }
    const controls = animate(entranceOpacity, 1, { duration: 0.5, ease: 'easeOut' });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);

  /* An image restored from cache can be `complete` before React attaches onLoad,
     in which case onLoad never fires and the hero sits at opacity 0 — a blank
     photo strip. That is a "sometimes the card doesn't come in" case, and it is
     exactly the refresh-vs-tab-switch difference. The deck guards it the same way. */
  const heroSrc = userData?.photos?.[0];
  useEffect(() => {
    if (heroImgRef.current?.complete) setHeroLoaded(true);
  }, [heroSrc]);

  /* ── SHEET ENTRANCE ──
     The sheet starts a full screen-height below the fold, then glides up 300ms
     later — identical to the deck card.

     Deliberately a useLayoutEffect, not useEffect: the sheet becomes visible as
     soon as it is measured, and yMV still sits at 0 until an effect parks it. A
     passive effect runs AFTER paint, so the sheet briefly painted at y=0 —
     covering the photo, which is what made it look like it arrived before the
     photo. A layout effect runs before paint, so it is parked and never flashes.

     Deliberately NOT driven from measure(): ResizeObserver timing varies on a
     real device, so the entrance could start before the geometry settled and
     then be cancelled by the next observer tick. Keyed on the profile and gated
     on real measurements, it fires exactly once per card. The timer is stored
     and cleared, so switching profiles mid-entrance cannot leave a stale glide
     pointing at the previous card's rest position. */
  const cancelEntrance = useCallback(() => {
    if (entranceTimer.current) { clearTimeout(entranceTimer.current); entranceTimer.current = null; }
    entranceUntil.current = 0;
  }, []);

  /* ── measure root + sheet ── */
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(() => { rootHRef.current = el.clientHeight; setRootH(el.clientHeight); });
    ro.observe(el);
    rootHRef.current = el.clientHeight;
    setRootH(el.clientHeight);
    return () => ro.disconnect();
  }, [cardMounted]);

  useLayoutEffect(() => {
    const el = sheetRef.current;
    if (!el) return undefined;
    const measure = () => {
      const w = el.offsetHeight;
      sheetHRef.current = w;
      setSheetH(w);
      const idEl = idRef.current;
      if (idEl) peekHRef.current = idEl.offsetTop + idEl.offsetHeight + PEEK_PAD;
      const h = rootHRef.current;
      if (!h || !w) return;
      const bounds = computeBounds(h, w);
      boundsRef.current = bounds;                 // ← computed HERE, once per measure

      /* ── ENTRANCE, here in the measure pass ──
         Identical to the deck card. The sheet is positioned by the SAME layout
         effect that measures it, so the park can neither be missed nor reordered
         against the measurement. Driven from a separate effect it raced this
         one and the sheet painted at y=0 — covering the whole photo — for ~300ms
         before the park landed, which read as the sheet arriving before the
         photo. Gated on a set-once ref rather than a dep array so it plays
         exactly once per mount, on every mount, instead of once per dep change. */
      const id = userDataRef.current?._id ?? null;
      const focusing = focusStrengthRef.current && focusPlacedFor.current !== id;

      /* Where "show me Profile strength" wants to land, given live geometry.
         Null until the bar is laid out — we measure it rather than hardcoding an
         offset, because the sheet's height varies with photos, prompts and
         interests and any fixed number is wrong on some profile. */
      const focusDest = (b) => {
        const el = strengthRef.current;
        if (!el) return null;
        return clamp(b.hi - el.offsetTop, b.lo, b.hi);
      };

      /* ── ENTRANCE, here in the measure pass ──
         Identical to the deck card. The sheet is positioned by the SAME layout
         effect that measures it, so the park can neither be missed nor reordered
         against the measurement. Driven from a separate effect it raced this
         one and the sheet painted at y=0 — covering the whole photo — for ~300ms
         before the park landed, which read as the sheet arriving before the
         photo. Gated on a set-once ref rather than a dep array so it plays
         exactly once per mount, on every mount, instead of once per dep change.

         The entrance still PLAYS when we've been asked to show Profile strength —
         only its destination changes, from the rest/peek position to the bar.
         Skipping it entirely left the sheet at y=0, so it slid DOWN into place,
         which reads as the sheet being pushed down rather than rising to reveal
         the section. The reveal is the point, so we keep the motion and retarget
         it. */
      if (entranceDoneFor.current !== id) {
        entranceDoneFor.current = id;
        cancelEntrance();
        entranceUntil.current = performance.now() + 900;   // self-expiring guard
        yMV.set(h);                                        // park below the fold
        entranceTimer.current = setTimeout(() => {
          entranceTimer.current = null;
          /* Re-read geometry at glide time: fonts/images may have settled since,
             and a stale peek lands the sheet at the wrong rest position. */
          const hh = rootHRef.current, ww = sheetHRef.current;
          const b = (hh && ww) ? computeBounds(hh, ww) : bounds;
          /* If we're focusing but the bar hasn't been measured yet, fall back to
             the rest position WITHOUT marking it placed — the focus block below
             then lands on the bar as soon as it exists, instead of the flag
             claiming success on a peek position. */
          const dest = focusing ? focusDest(b) : b.hi;
          entranceUntil.current = 0;
          glideTo(dest ?? b.hi, 'glide');
          if (focusing && dest != null) {
            focusPlacedFor.current = id;
            onStrengthFocused?.();
          }
        }, 300);
        return;
      }

      /* ── FOCUS: land on Profile strength ──
         Placed HERE, in the measure pass, rather than from a separate effect.
         The effect version raced this one: it fired on the first frame when
         `boundsRef` was still `{ready:false}`, did nothing, and had no second
         chance — so the sheet sat at the entrance's rest position and the scroll
         either never happened or got overwritten. Here, bounds are computed two
         lines above and are guaranteed current.

         Set-once, same as the entrance: a later resize re-measures, and without
         this guard every photo upload would yank the sheet back to the score
         after the user had scrolled away from it. */
      if (focusing) {
        const dest = focusDest(bounds);
        if (dest != null) {
          focusPlacedFor.current = id;
          glideTo(dest, 'glide');
          onStrengthFocused?.();
          return;
        }
        // Bar not laid out yet — fall through. The ResizeObserver re-runs
        // measure(), and this is where the placement finally lands.
      }

      /* Stay out of the way while the entrance glide is in flight. A TIMESTAMP
         rather than a boolean, so a dropped timer can never wedge the re-clamp
         off permanently. */
      if (performance.now() < entranceUntil.current) return;
      /* Only intervene when genuinely out of bounds, and never mid-glide. A
         blanket yMV.set() here snapped the sheet the instant content resized —
         which is what a save, a photo upload or a font settling all do — and it
         did so with no epsilon test, so sub-pixel drift fought the glide and
         killed the slide. */
      const cur = yMV.get();
      const target = clamp(cur, bounds.lo, bounds.hi);
      if (Math.abs(target - cur) > 0.5) { stopGlide(); yMV.set(target); }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    /* Cancel the entrance wholesale and forget that it ran, so a remount
       (StrictMode's double-invoke, or returning to the tab) re-does it from
       scratch. Only zeroing the timestamp used to leave the pending timer alive
       while reopening the re-clamp, which yanked the sheet to rest ~20ms in and
       killed the slide. */
    return () => { ro.disconnect(); cancelEntrance(); entranceDoneFor.current = null; focusPlacedFor.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardMounted]);

  /* ── mutations ── */
  /**
   * Apply an update locally IMMEDIATELY, then PUT it.
   *
   * The optimistic patch is applied for every field, not just chips: previously
   * only interests/intent updated instantly, so editing a name, bio, prompt or
   * photo left the card frozen until the response landed — and a photo edit is
   * two round trips (upload, then save), so it read as broken.
   *
   * The draft drawers no longer need a functional-patch escape hatch: taps are
   * composed into `draft` in React state, and the whole drawer lands as one PUT.
   */
  const updateProfile = async (updates) => {
    if (contentFrozen) { toast.error(contentFreezeMessage, contentFreezeAction); return; }
    const current = userDataRef.current;
    if (!current) return;

    // Apply the change locally first so the UI responds immediately, and keep the
    // pre-patch snapshot so a failed save can be rolled back rather than left
    // showing something the server never accepted.
    const snapshot = current;
    const optimistic = { ...current, ...updates };
    setUserData(optimistic);
    const payload = updates;

    // Tag this save so an out-of-order response can be recognised and dropped.
    const seq = ++saveSeq.current;

    try {
      const updated = await api.put('/users/profile', payload);
      // A newer save has started since this one — its response carries the newer
      // state, so don't let this older snapshot clobber it.
      if (seq !== saveSeq.current) return;
      setUserData(prev => ({ ...prev, ...updated }));
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      triggerHaptic('light');
      // Keep AuthContext and localStorage in sync so Matches, Chat and the
      // deck's "me" detection stop rendering the pre-edit profile.
      refreshUser();
    } catch (err) {
      if (seq !== saveSeq.current) return;
      setUserData(snapshot); // don't leave the UI lying about what's saved
      // api.js already toasted the server's message when there was one; only a
      // non-toasted error (a real network drop) needs local copy. Never use
      // err.message here — on a network drop it is "Failed to fetch".
      if (!err?.toasted) toast.error('Could not save. Please try again.');
    }
  };

  /**
   * Commit the open drawer's draft as a SINGLE PUT.
   *
   * Every field the user actually touched goes out in one request, so opening a
   * drawer, editing three things and saving costs one PUT + one /auth/me instead
   * of three of each. Fields left untouched are omitted entirely so the server is
   * never asked to revalidate a value that did not change.
   */
  const saveDrawer = async () => {
    const cfg = drawerConfig;
    const d = draft;
    if (!cfg || !d || !isDrawerDirty) { setDrawerConfig(null); setDraft(null); return; }
    const u = userDataRef.current;

    let patch = null;
    if (cfg.type === 'interests' || cfg.type === 'intent') {
      patch = { [cfg.type]: d.list };
    } else if (cfg.type === 'prompt') {
      // Always exactly 3 slots: a short array here would serialise as a sparse
      // list of nulls and drop the trailing slots the card still renders.
      const prompts = [0, 1, 2].map((i) => ({ ...(u.prompts?.[i] || {}) }));
      const prev = prompts[cfg.slot];
      const question = d.question.trim();
      // photoUrl is preserved: this route only edits text, and dropping it would
      // orphan an attached image.
      // An empty question takes the answer with it — an answer with no question
      // above it is orphaned text that reappears if a question is ever picked
      // again. Clearing the question is also how you reset a prompt, so Save
      // must not be able to store one half of a pair.
      prompts[cfg.slot] = question
        ? { ...prev, question, answer: d.answer.trim() }
        : { ...prev, question: '', answer: '' };
      patch = { prompts };
    } else {
      patch = {};
      ['name', 'year', 'gender', 'pronouns', 'bio']
        .filter((k) => k in d)
        .forEach((k) => { if (d[k] !== (u[k] || '')) patch[k] = d[k].trim(); });
      if ('gapYear' in d && !!d.gapYear !== !!u.gapYear) patch.gapYear = !!d.gapYear;
    }

    // Close immediately. updateProfile already applies the change optimistically
    // and rolls back with a toast if the PUT fails, so there is nothing to wait
    // for — and waiting would make Save feel slower than the autosave it replaced.
    setDrawerConfig(null);
    setDraft(null);
    await updateProfile(patch);
  };

  const handlePhotoSelect = async (e) => {
    const files = Array.from(e.target.files);
    // Capture the slot BEFORE clearing state — the picker target is spent either
    // way, and reading photoSlot after a re-render would race the picker reopen.
    const slot = photoSlot;
    setPhotoSlot(null);
    e.target.value = '';
    if (files.length === 0 || slot === null) return;

    const controller = new AbortController();
    abortRef.current = controller;
    setUploadSlot(slot);
    triggerHaptic('medium');
    try {
      const { url } = await api.upload(files[0], { signal: controller.signal });
      const current = [...(userDataRef.current.photos || [])];
      // Replace in place when the slot is occupied, otherwise APPEND.
      //
      // This used to do `current[slot] = url` unconditionally, which punched a
      // hole whenever the tapped tile was beyond the end of the array (tap the
      // wide tile with only one photo saved). The server then ran filter(Boolean)
      // and closed the hole — so the photo silently moved UP a slot on save,
      // visibly jumping out from under the tile that was just tapped. Appending
      // keeps the array dense and the photo where the server will keep it.
      const next = slot < current.length
        ? current.map((p, i) => (i === slot ? url : p))
        : [...current, url];
      await updateProfile({ photos: next });
    } catch {
      // An abort is a deliberate user action, not a failure — stay silent.
      // If the cancel landed after the upload resolved, the save is already
      // running and updateProfile reports its own errors.
      if (controller.signal.aborted) {
        triggerHaptic('light');
      } else {
        toast.error('Upload failed. Check your connection, or try a smaller image.');
      }
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setUploadSlot(null);
    }
  };

  /* ════ THE DRAG — identical to ProfileCard ════ */
  const drag = useRef(null);
  const yBaseRef = useRef(0);
  const dragged = useRef(false);

  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;

    const onDown = (e) => {
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
      drag.current = null;
      const { lo, hi, ready } = boundsRef.current;
      if (!ready) return;
      const y = yMV.get();
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
  }, [cardMounted]);

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
  }, [cardMounted]);

  const onSheetKeyDown = (e) => {
    const { lo, hi, ready } = boundsRef.current;
    if (!ready) return;
    const step = 90;
    if (e.key === 'ArrowUp') { e.preventDefault(); glideTo(clamp(yMV.get() - step, lo, hi), 'glide'); }
    if (e.key === 'ArrowDown') { e.preventDefault(); glideTo(clamp(yMV.get() + step, lo, hi), 'glide'); }
  };

  /* ════ HEADER DUCK ════
     The header is a position:fixed row. The sheet's top edge sits at
     `rootTop + y`, so the header must duck once
        y  <  (headerBottom - rootTop - HEADER_LEAD)
     Both edges are measured ONCE, with the header at rest, and cached.
     Re-measuring live is self-defeating (mid-animation the header's rect is
     80px higher → trigger shrinks → state flips → header returns → loop), and
     the handler is pure arithmetic on yMV so there is no per-frame layout read
     to stall the drag.

     `short` is deliberately NOT consulted: when the sheet fits its container
     computeBounds also caps `lo` at TOP_GAP, so travel ends at the header and
     the guard blocked the feature outright.

     The callback MUST be held in a ref, never in an effect dep. AppShell hands
     us a fresh arrow on every render, so depending on it re-runs the unmount
     cleanup each time — resetting the ref and re-showing the header the instant
     it ducks. That is an infinite self-cancelling loop and the header never
     actually moves. */
  const headerTriggerRef = useRef(null);
  const headerHiddenRef = useRef(false);
  const onHeaderHiddenRef = useRef(onHeaderHiddenChange);
  useEffect(() => { onHeaderHiddenRef.current = onHeaderHiddenChange; });

  const setHeaderHidden = useCallback((hidden) => {
    if (headerHiddenRef.current === hidden) return;
    headerHiddenRef.current = hidden;
    onHeaderHiddenRef.current?.(hidden);
  }, []);

  const measureHeaderTrigger = useCallback(() => {
    if (headerHiddenRef.current) return;          // never measure mid-animation
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
    if (headerHiddenRef.current) {
      if (y > trigger + HEADER_RELEASE) setHeaderHidden(false);
    } else if (y < trigger) {
      setHeaderHidden(true);
    }
  });

  useLayoutEffect(() => {
    if (!cardMounted) return undefined;
    const raf = requestAnimationFrame(() => { measureHeaderTrigger(); setHeaderHidden(false); });
    window.addEventListener('resize', measureHeaderTrigger);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', measureHeaderTrigger);
    };
    /* Keyed on cardMounted, not userData. Re-running this on every save called
       setHeaderHidden(false) mid-scroll, so the header popped back into view the
       moment you saved an edit — the same class of bug as the card re-entering. */
  }, [cardMounted, measureHeaderTrigger]);

  /* Unmount ONLY (empty deps) — see the note above. Leaving the tab must always
     restore the header, and this must not be able to re-run on every parent
     render. */
  useEffect(() => () => {
    headerHiddenRef.current = false;
    onHeaderHiddenRef.current?.(false);
  }, []);

  if (loading || (!userData && !fetchError)) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#111211' }}>
        <p style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: C.ink3 }}>
          Loading your card…
        </p>
      </div>
    );
  }


  /* Whether the sheet has measurable geometry. Declared BEFORE the effect above
     so the dependency array can read it — `const` is in the temporal dead zone
     until its declaration executes, so referencing it earlier threw
     "Cannot access 'sheetReady' before initialization" and took the whole
     Profile tab down with it. */
  const sheetReady = rootH > 0 && sheetH > 0;

  // Shown when the fetch failed. Previously unreachable — the guard above
  // swallowed it and displayed the loading message instead.
  if (fetchError && !userData) {
    return (
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', gap: 16,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#111211', padding: 24, textAlign: 'center',
      }}>
        <p style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: C.red }}>
          Card unavailable
        </p>
        <p style={{ fontFamily: F.body, fontSize: 13, color: C.ink3, maxWidth: 280, lineHeight: 1.6 }}>
          {fetchError}
        </p>
        <button
          onClick={fetchProfile}
          className="tactile-btn"
          style={{
            padding: '10px 20px', borderRadius: 4, cursor: 'pointer',
            border: `1px solid ${C.ink}`, backgroundColor: C.yellow,
            color: C.ink, fontFamily: F.mono, fontSize: 11, fontWeight: 700,
            letterSpacing: '.12em', textTransform: 'uppercase',
          }}
        >
          Try again
        </button>
      </div>
    );
  }

  /* Labels are now the ladder's own bands. They used to be hardcoded 85 / 50,
     which matched nothing — not the deck's 75, not publish's 45. A profile at
     85 could be called Exemplary while the deck still had it locked, so these
     two numbers and the gate have to come from the same source. */
  const scoreBand = bandFor(targetScore, config);
  const completion =
    scoreBand === 'aspirational'
      ? 'Exemplary'
      : scoreBand === 'interactable' || scoreBand === 'published'
        ? 'Standard'
        : 'Incomplete';
  const isAspirational = scoreBand === 'aspirational';
  const heroUploading = uploadSlot === 0;
  const prompts = userData.prompts || [];
  const interests = userData.interests || [];

  /* Real content only.
     This used to be `[prompts[0..2], photos[1..3]].filter(Boolean).length`, but
     `prompts` is always three objects (fetchProfile defaults it to `[{}, {}, {}]`)
     and an empty object is truthy — so all three empty slots were always counted
     and the header read "/ 3" on a profile with nothing filled in. The hero is
     photos[0], so it is subtracted out: it is not an exhibit. */
  const exhibitsCount = Math.max(
    0,
    prompts.filter((p) => p?.question).length +
      Math.max(0, (userData.photos || []).filter(Boolean).length - 1)
  );

  return (
    <div ref={rootRef} className="pc-root">
      <style>{PROFILE_CSS}</style>
      <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handlePhotoSelect} />

      <div style={{ position: 'relative', zIndex: 45 }}>
        <ShadowbanBanner score={shadowbanScore} onLearnMore={() => setShowLearnMore(true)} />
        {showLearnMore && <LearnMoreSheet onClose={() => setShowLearnMore(false)} />}
      </div>

      {/* ════ PHOTO — full-bleed background, entrance fade + drag recede ════ */}
      <motion.div
        className="pc-heroWrap"
        style={{ scale: combinedPhotoScale, opacity: combinedPhotoOpacity }}
      >
        <img
          ref={heroImgRef}
          src={userData.photos?.[0] || FALLBACK_IMG}
          alt="Your portrait"
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
        {/* The pencil and its tray are one dismiss target: the ref spans both, so
            a tap on the tray's own buttons is NOT treated as an outside tap and
            still runs the action. */}
        <div className="pc-herocontrols" ref={heroControlsRef}>
          <button
            className="pr-herobtn"
            aria-label={heroUploading ? 'Cancel upload' : (userData.photos?.[0] ? 'Photo options' : 'Add main photo')}
            title={heroUploading ? 'Cancel upload' : (userData.photos?.[0] ? 'Photo options' : 'Add main photo')}
            aria-expanded={userData.photos?.[0] ? heroTray : undefined}
            onClick={heroUploading ? cancelUpload : (userData.photos?.[0] ? () => setHeroTray((t) => !t) : () => openPhotoSlot(0))}
          >
            {heroUploading ? <X size={13} strokeWidth={3} /> : <Pencil size={13} strokeWidth={2.8} />}
          </button>
          {heroTray && !heroUploading && userData.photos?.[0] && (
            <div className="pr-herotray">
              <button className="pr-traybtn big" onClick={() => { setHeroTray(false); openPhotoSlot(0); }}>
                <Pencil size={14} strokeWidth={2.8} /> Replace
              </button>
              <button className="pr-traybtn danger big" onClick={() => { setHeroTray(false); removePhoto(0); }}>
                <X size={14} strokeWidth={3} /> Remove
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* hero upload pill — lives OUTSIDE the hero wrap so the sheet can't cover
          it. `x: '-50%'` is set in all three states because framer-motion owns the
          transform here; a CSS translateX(-50%) would be clobbered on mount. */}
      <AnimatePresence>
        {heroUploading && (
          <motion.div
            className="pr-uploadpill"
            initial={{ opacity: 0, y: -10, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -10, x: '-50%' }}
            transition={{ duration: 0.18 }}
            role="status"
            aria-live="polite"
          >
            Uploading…
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════ THE SHEET ════ */}
      <motion.div
        ref={sheetRef}
        className="pc-sheet"
        style={{ y: yMV, visibility: sheetReady ? 'visible' : 'hidden' }}
        onClickCapture={onClickCapture}
        onKeyDown={onSheetKeyDown}
        tabIndex={0}
        role="region"
        aria-label="Your profile — drag or use arrow keys to move the card"
      >
        {/* the note — plain text at the top of the sheet, no background */}
        <span className="pc-notetext">As others see you</span>
        <div className="pc-grabber" aria-hidden="true" />

        {/* IDENTITY — one edit button. Age is inline in the name, matching the
            deck card exactly; the year stays on its own mono line below. */}
        <div ref={idRef} className="pc-id">
          <div className="pc-idrow">
            <div style={{ minWidth: 0 }}>
              <h2 className="pc-name">
                {userData.name || 'Anonymous'}
                {userData.age ? <span className="pc-age">, {userData.age}</span> : null}
              </h2>
            </div>
            <button className="pr-slotbtn" aria-label="Edit basics" title="Edit basics" onClick={() => openEditDrawer({ type: 'identity' })}>
              <Pencil size={13} strokeWidth={2.8} />
            </button>
          </div>
          <p className="pc-meta">{userData.year || '—'}</p>
        </div>

        {/* PROFILE STRENGTH — score lives HERE and nowhere else; not editable */}
        <div className="pc-sec" ref={strengthRef}>
          <SectionHead mark="yellow">Profile strength</SectionHead>
          <div className="pc-card padded">
            <div className="pc-strengthhead">
              <div className="pc-scorehead">
                <div className="pc-scorenum">
                  <span className="pc-num"><AnimatedNumber mv={scoreMV} /></span>
                  <span className="pc-pct">%</span>
                </div>
                <div className="pc-statust">
                  {isAspirational && <span className="pc-star">✦ </span>}
                  {completion}
                  {isAspirational && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6, padding: '3px 8px', background: C.green, border: '1px solid var(--ink)', borderRadius: 4, color: C.ink, fontSize: 8.5 }}>
                      <CheckCircle2 size={10} strokeWidth={3} /> Complete
                    </span>
                  )}
                </div>
              </div>
              <div className="pc-bar" aria-hidden="true">
                <motion.div className="pc-barfill" style={{ scaleX: barFill }} />
              </div>
            </div>
          </div>
        </div>

        {/* VITALS — one edit button on the card */}
        <div className="pc-sec">
          <SectionHead mark="coral">Vitals</SectionHead>
          <div className="pc-card padded">
            {/* Two cells, not four. Hostel and Branch were removed — hostel was the only
       location signal and the discover deck is no longer campus-scoped, and
       neither field moves the ladder. The grid keeps its 2×2 shape so the
       remaining cells stay in the same place. */}
            <div className="pc-grid">
              <FieldCell icon={Calendar} color={TILE[1]} label="Year" value={userData.year || '—'} />
              <FieldCell icon={Sparkle} color={TILE[3]} label="Pronouns" value={userData.pronouns || '—'} />
            </div>
            <button className="pr-slotbtn" aria-label="Edit vitals" title="Edit vitals" onClick={() => openEditDrawer({ type: 'vitals' })}>
              <Pencil size={13} strokeWidth={2.8} />
            </button>
          </div>
        </div>

        {/* ABOUT — always present; clearing the bio shows an add-target instead of
            removing the section and its edit button. Bare text, not a card, so it
            matches the deck. */}
        <div className="pc-sec">
          <SectionHead mark="green" onEdit={() => openEditDrawer({ type: 'bio' })} editLabel="Edit about">About</SectionHead>
          {userData.bio ? (
            <p className="pc-bio">{userData.bio}</p>
          ) : (
            <EmptySlot onClick={() => openEditDrawer({ type: 'bio' })} label="Add about you" />
          )}
        </div>

        {/* SEEKING — bare chips, matching the deck */}
        <div className="pc-sec">
          <SectionHead mark="pink" onEdit={() => openEditDrawer({ type: 'intent' })} editLabel="Edit seeking">Seeking</SectionHead>
          <div className="pc-pills">
            {(userData.intent?.length ? userData.intent : ['Connection']).map((it, i) => (
              <span key={`${it}-${i}`} className="pc-chip acc">{it}</span>
            ))}
          </div>
        </div>

        {/* INTERESTS — always present; an empty list shows an add-target rather
            than deleting the section (same rule as the prompt slots) */}
        <div className="pc-sec">
          <SectionHead mark="yellow" count={interests.length} onEdit={() => openEditDrawer({ type: 'interests' })} editLabel="Edit interests">Interests</SectionHead>
          {interests.length > 0 ? (
            <div className="pc-pills">
              {interests.map((it, i) => (
                <span key={`${it}-${i}`} className="pc-chip">{it}</span>
              ))}
            </div>
          ) : (
            <EmptySlot onClick={() => openEditDrawer({ type: 'interests' })} label="Add interests" />
          )}
        </div>

        {/* EXHIBITS — one edit button per prompt card + per photo tile.
            Prompt slots render whether or not they hold a question: clearing one
            used to unmount the card and take its edit button with it. */}
        <div className="pc-sec">
          <SectionHead mark="coral" count={exhibitsCount}>Exhibits</SectionHead>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <PromptSlot slot={0} prompt={prompts[0]} onEdit={() => openEditDrawer({ type: 'prompt', slot: 0 })} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <PhotoTile src={userData.photos?.[1]} onEdit={() => openPhotoSlot(1)} onRemove={() => removePhoto(1)} onCancel={cancelUpload} emptyLabel={userData.photos?.[1] ? 'Edit photo' : 'Add photo'} loading={uploadSlot === 1} />
              <PhotoTile src={userData.photos?.[2]} onEdit={() => openPhotoSlot(2)} onRemove={() => removePhoto(2)} onCancel={cancelUpload} emptyLabel={userData.photos?.[2] ? 'Edit photo' : 'Add photo'} loading={uploadSlot === 2} />
            </div>
            <PromptSlot slot={1} prompt={prompts[1]} onEdit={() => openEditDrawer({ type: 'prompt', slot: 1 })} />
            <PhotoTile src={userData.photos?.[3]} wide onEdit={() => openPhotoSlot(3)} onRemove={() => removePhoto(3)} onCancel={cancelUpload} emptyLabel={userData.photos?.[3] ? 'Edit photo' : 'Add wide photo'} loading={uploadSlot === 3} />
            <PromptSlot slot={2} prompt={prompts[2]} onEdit={() => openEditDrawer({ type: 'prompt', slot: 2 })} />
          </div>
        </div>
      </motion.div>

      {/* ════ EDIT DRAWERS ════
          Every drawer edits a local `draft` and writes on Save. Dismissing via ✕,
          the backdrop or the Cancel button all go through requestCloseDrawer, so
          the unsaved-changes guard can't be sidestepped by using another gesture. */}
      <AnimatePresence>
        {drawerConfig && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={requestCloseDrawer}
              style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(12,12,14,.62)', zIndex: 100 }}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '80dvh', backgroundColor: C.paper, borderTop: `1px solid ${C.ink}`, borderRadius: '15px 15px 0 0', zIndex: 101, display: 'flex', flexDirection: 'column', boxShadow: '0 -14px 32px rgba(0,0,0,.22)' }}
            >
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: F.heavy, fontSize: 18, fontWeight: 800, color: C.ink, letterSpacing: '-.02em', textTransform: 'uppercase' }}>
                  {drawerConfig.type === 'interests' ? 'Edit interests' : drawerConfig.type === 'intent' ? 'Edit seeking' : drawerConfig.type === 'prompt' ? 'Edit question' : drawerConfig.type === 'vitals' ? 'Edit vitals' : drawerConfig.type === 'identity' ? 'Edit basics' : 'Edit about'}
                </span>
                <button onClick={requestCloseDrawer} aria-label="Close editor" style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: `1px solid ${C.ink}`, borderRadius: 4, cursor: 'pointer', color: C.ink }}>
                  <X size={16} strokeWidth={3} />
                </button>
              </div>

              <div ref={drawerBodyRef} style={{ padding: 22, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {drawerConfig.type === 'identity' && (
                  <>
                    <DraftField value={draft.name} onChange={(v) => setDraft((d) => ({ ...d, name: v }))} max={PROFILE_LIMITS.name} placeholder="Name" />
                    <select className="pr-select" value={draft.year} onChange={(e) => setDraft((d) => ({ ...d, year: e.target.value }))}>
                      {config?.years?.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </>
                )}

                {drawerConfig.type === 'vitals' && (
                  <>
                    <select className="pr-select" value={draft.gender} onChange={(e) => setDraft((d) => ({ ...d, gender: e.target.value }))}>
                      <option value="">Select gender</option>
                      {config?.genders?.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <select className="pr-select" value={draft.pronouns} onChange={(e) => setDraft((d) => ({ ...d, pronouns: e.target.value }))}>
                      <option value="">Select pronouns</option>
                      {config?.pronouns?.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={!!draft.gapYear}
                      onClick={() => { triggerHaptic('light'); setDraft((d) => ({ ...d, gapYear: !d.gapYear })); }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '13px 14px', borderRadius: 5, border: `1px solid ${C.ink}`, background: draft.gapYear ? C.yellow : C.card, cursor: 'pointer', fontFamily: F.body, fontSize: 14, fontWeight: 600, color: C.ink }}
                    >
                      <span>I'm on a gap year</span>
                      <span aria-hidden="true">{draft.gapYear ? 'ON' : 'OFF'}</span>
                    </button>
                  </>
                )}

                {/* Campus badge — privacy opt-out for the deck card.
                    Server STRIPS the college from every deck payload when this is
                    false (routes/discover.js), so turning it off means the data
                    never leaves the database, not that it's hidden in the UI. */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={userData.showCollege !== false}
                  onClick={() => {
                    const next = !(userData.showCollege !== false);
                    triggerHaptic('light');
                    updateProfile({ showCollege: next });
                    toast.success(next ? 'Others can now see your college.' : 'Your college is now hidden from the feed.');
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                    width: '100%', marginTop: 18, padding: '14px 0', border: 'none',
                    borderTop: `1px solid ${C.hair}`, background: 'transparent',
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <span>
                    <span style={{ fontFamily: F.body, fontSize: 14.5, fontWeight: 700, color: C.ink, display: 'block' }}>
                      Campus badge
                    </span>
                    <span style={{ fontFamily: F.body, fontSize: 12, fontWeight: 500, color: C.ink2, marginTop: 3, display: 'block', lineHeight: 1.4 }}>
                      {userData.showCollege !== false
                        ? `Showing "${userData.college || 'your college'}" on your card`
                        : 'Hidden. Nobody can see which college you attend.'}
                    </span>
                  </span>
                  <span style={{
                    width: 46, height: 26, flexShrink: 0, borderRadius: 999,
                    border: `1px solid ${C.ink}`, position: 'relative',
                    background: userData.showCollege !== false ? C.yellow : C.hair,
                  }}>
                    <span style={{
                      position: 'absolute', top: 3, left: userData.showCollege !== false ? 23 : 3,
                      width: 18, height: 18, borderRadius: '50%', background: C.card,
                      border: `1px solid ${C.ink}`, boxSizing: 'border-box',
                      transition: 'left 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
                    }} />
                  </span>
                </button>

                {drawerConfig.type === 'bio' && (
                  <DraftField multiline value={draft.bio} onChange={(v) => setDraft((d) => ({ ...d, bio: v }))} max={PROFILE_LIMITS.bio} placeholder="Write about yourself…" minHeight={150} />
                )}

                {drawerConfig.type === 'prompt' && (
                  <>
                    <DraftField multiline value={draft.question} onChange={(v) => setDraft((d) => ({ ...d, question: v }))} max={PROMPT_QUESTION_MAX} placeholder="Pick one below or write your own…" minHeight={70} />
                    <DraftField multiline value={draft.answer} onChange={(v) => setDraft((d) => ({ ...d, answer: v }))} max={PROMPT_ANSWER_MAX} placeholder="Your answer…" minHeight={100} />
                    <div style={{ height: 1, backgroundColor: C.hair, margin: '6px 0' }} />
                    <span className="pc-slotlabel">Or pick one</span>
                    {config?.prompts?.map((p, i) => {
                      const promptText = typeof p === 'string' ? p : p.question;
                      if (!promptText) return null;
                      return (
                        <button
                          key={i}
                          className={`pr-chipbtn${draft.question === promptText ? ' on' : ''}`}
                          style={{ borderRadius: 4, textAlign: 'left', textTransform: 'none', fontFamily: F.body, fontSize: 13.5, fontWeight: 600, letterSpacing: 0 }}
                          onClick={() => {
                            setDraft((d) => {
                              if (d.question === promptText) return d;
                              // Choosing a DIFFERENT question drops the old answer,
                              // which was written for the previous one. Save commits both.
                              return { question: promptText, answer: '' };
                            });
                            // The bank sits at the bottom of a long drawer, so picking
                            // from it leaves you staring at the bottom of the list with
                            // no view of the question and answer that just changed.
                            // Scroll straight back up to them.
                            scrollDrawerToTop();
                          }}
                        >
                          “{promptText}”
                        </button>
                      );
                    })}
                    {draft.question && (
                      <button className="pr-slam danger" onClick={() => setDraft({ question: '', answer: '' })}>
                        Remove question
                      </button>
                    )}
                  </>
                )}

                {(drawerConfig.type === 'interests' || drawerConfig.type === 'intent') && (
                  <>
                    {drawerConfig.type === 'interests' && (
                      <p style={{ fontFamily: F.body, fontSize: 12.5, fontWeight: 500, color: C.ink2, marginBottom: 14 }}>
                        Pick up to 6 ({draft.list.length}/6).
                      </p>
                    )}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
                      {(drawerConfig.type === 'interests' ? config?.interests : config?.intents)?.map(item => {
                        // Read from the DRAFT, not from userData: the limit and the
                        // highlight both have to reflect the pending selection, or
                        // the chips fight the thing you just tapped.
                        const isActive = draft.list.includes(item);
                        /* Only interests are capped. There is no intent limit any more, so a person who
                           is genuinely open to all three can say so — previously the
                           third chip went disabled with no explanation. */
                        const isAtLimit = !isActive
                          && drawerConfig.type === 'interests'
                          && draft.list.length >= MAX_INTERESTS;
                        return (
                          <button
                            key={item}
                            disabled={isAtLimit}
                            className={`pr-chipbtn${isActive ? ' on' : ''}`}
                            aria-pressed={isActive}
                            onClick={() => {
                              triggerHaptic('light');
                              setDraft((d) => ({
                                list: d.list.includes(item)
                                  ? d.list.filter((i) => i !== item)
                                  : [...d.list, item],
                              }));
                            }}
                          >
                            {item}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              <div className="pr-drawerfoot">
                <button className="pr-slam" onClick={requestCloseDrawer}>Cancel</button>
                <button className="pr-slam yellow" disabled={!isDrawerDirty} onClick={saveDrawer}>
                  Save changes
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Profile; 

```

