// client/src/components/PopoutItem.jsx
import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useMotionValue, animate, useReducedMotion } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';
import { useIsDesktop } from '../utils/useIsDesktop';
import { ChevronDown, Heart } from 'lucide-react';
import neu from '../styles/neu';

/* ── The shared neo-brutalist canon (src/styles/neu.js).
   Keyed by the legacy short names so every ${F.*} usage site keeps working. ── */
const F = {
  heavy: neu.fontHeavy,
  body: neu.fontBody,
  mono: neu.fontMono,
};

/* The shared neo-brutalist canon (src/styles/neu.js).
   The drifted local yellowDeep (#E5B824) was dropped — C.yellowDeep now
   inherits the canon value (#FFC91F) from neu. */
const C = neu;

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
const PRESS_MS = 280;
const PRESS_SLOP = 12;      // px of real movement that cancels a hold
const SCALE_MIN = 0.9;      // wide span-2 items may shrink slightly to fit
const SCALE_MAX = 2.4;      // how big a tiny tile may get — raise for even bigger
const PHOTO_OPEN_EASE = [0.22, 1, 0.36, 1];
const PHOTO_CLOSE_EASE = [0.64, 0, 0.78, 0];

/* ── shared styles — injected ONCE per page (id-guarded), not once per card ── */
const POP_CSS = `
  .po-overlay { position: fixed; inset: 0; z-index: 9998; pointer-events: none; }
  .po-backdrop {
    position: absolute; inset: 0; z-index: 20; background: rgba(25,23,20,0.55);
    backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
    pointer-events: none;
  }

  /* scroll-safe centering: margin:auto on the child centers when it fits,
     and lets the card SCROLL when the zoomed content is taller than the screen */
  .po-scroll { position: absolute; z-index: 1; inset: 0; overflow-y: auto; -webkit-overflow-scrolling: touch;
    display: flex; padding: 24px 16px; pointer-events: none; }
  .po-scroll::-webkit-scrollbar { display: none; }

  .po-flight { position: relative; width: 100%; max-width: 340px; margin: auto; flex: 0 0 auto;
    transform-origin: top left; will-change: transform; }
  .po-flight.prompt-flight { max-width: none; }
  .po-flight.photo-flight { width: min(1100px, 100%); max-width: 1100px; }
  .po-card { position: relative; width: 100%; overflow: visible;
    cursor: grab; will-change: transform; }
  .po-card.prompt-only {
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
    display: flex; flex-direction: column; align-items: center; gap: 22px;
    overflow: visible; border: 0; border-radius: 0;
    background: transparent; box-shadow: none;
  }
  .po-card.prompt-only .po-center { padding: 0; border: 0; border-radius: 0;
    background: transparent; box-shadow: none; position: relative; z-index: 2; width: 100%; }
  .po-card.prompt-only .po-stage { width: 100%; justify-content: center; }
  .po-card.prompt-only .po-content { transition: none; }
  .po-card.prompt-only .po-prompt-reply { position: relative; z-index: 1; width: 100%; }
  .po-card.prompt-only .po-photo-reply { width: 100%; align-items: stretch; }
  @media (max-width: 1199px) {
    .po-card.prompt-only .po-content .pc-promptq { font-size: 12px; }
    .po-card.prompt-only .po-content .pc-prompta { font-size: 16px; }
    .po-card.photo-phone-stacked .po-photo-question { font-size: 20.19px; }
    .po-card.prompt-only .po-photo-reply .po-photo-question { font-size: 20.19px; }
    .po-card.photo-phone-stacked .po-photo-message { font-size: 14.45px; }
    .po-card.prompt-only .po-photo-message { font-size: 14.45px; }
  }
  .po-card.prompt-form-concealed .po-prompt-reply { visibility: hidden; }
  .po-card.prompt-only .po-content .pc-prompt:hover { background: #5BD98A; }
  .po-card:not(.prompt-only) .po-center {
    box-sizing: border-box; padding: 12px; border: 2px solid ${C.ink};
    border-radius: 22px; background: ${C.paper}; box-shadow: 8px 8px 0 ${C.ink};
    overflow: hidden;
  }
  .po-card.photo-only .po-center {
    box-sizing: border-box; padding: 0; border: 2px solid ${C.ink};
    border-radius: 24px; background: ${C.paper}; box-shadow: 6px 6px 0 ${C.ink};
    overflow: visible; position: relative; cursor: default !important; user-select: none; -webkit-user-select: none;
  }
  .po-card.photo-only, .po-card.photo-only:active { cursor: default !important; }
  .po-card.photo-only .po-stage { justify-content: center; }
  .po-card.photo-only .pc-ph {
    width: 100%; height: 100%; box-sizing: border-box; padding: 0;
    border: 0; border-radius: 0; background: transparent; box-shadow: none;
    pointer-events: none;
  }
  .po-card.photo-only .pc-ph:hover,
  .po-card.photo-only .pc-ph:active {
    border: 0; border-radius: 0; background: transparent; box-shadow: none; transform: none;
  }
  .po-card.photo-only .pc-ph-in {
    width: 100%; height: 100%; aspect-ratio: auto; border-radius: 0;
  }
  .po-card.photo-only .pc-ph-in img { width: 100%; height: 100%; object-fit: cover; }
  .po-card.photo-only .po-content .pc-exhibit-heart { display: none; }
  .po-card.photo-only .po-content { overflow: hidden; border-radius: 22px; }
  .po-card.photo-only .po-center { position: relative; z-index: 2; }
  .po-card.photo-only .po-panel-bottom { position: relative; z-index: 1; }
  .po-card.photo-only.form-concealed .po-panel-bottom { visibility: hidden; }
  .po-card.photo-only .po-photo-heart {
    position: absolute; z-index: 2; top: 1px; right: 1px;
    border: 2px solid ${C.ink}; transform: scale(1.5); transform-origin: top right;
  }
  .po-card.photo-desktop {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    align-items: center;
    justify-content: center;
    gap: 12px;
  }
  .po-card.photo-desktop .po-center {
    justify-self: center;
    width: var(--po-photo-width);
    height: var(--po-photo-height);
  }
  .po-card.photo-desktop .po-stage,
  .po-card.photo-desktop .po-content {
    width: 100%;
    height: 100%;
  }
  .po-card.photo-desktop .po-panel-bottom,
  .po-card.photo-desktop .po-photo-reply {
    width: 100%;
    margin: 0;
  }
  .po-card.photo-desktop .po-photo-reply { align-self: center; }
  .po-card.photo-desktop .po-accordion { height: 132px; }
  .po-card.photo-desktop .po-accordion.input-active { height: 316px; }
  .po-card.photo-desktop .po-alignrow { flex-direction: column; gap: 12px; }
  .po-card.photo-desktop .po-letterbtn.po-alignbtn,
  .po-card.photo-desktop .po-letterbtn.po-notebtn { flex: 0 0 56px; width: 100%; height: 56px; }
  .po-card.photo-desktop .po-inputarea { padding: 14px 12px 12px; }
  .po-card.photo-desktop .po-input { height: 154px; }
  @media (min-width: 1200px) {
    .po-card.photo-desktop .po-photo-question {
      font-family: ${F.body}; font-size: clamp(28.9px, 3.57vw, 39.1px);
      font-weight: 800; line-height: 1.06; letter-spacing: -.055em;
    }
    .po-card.photo-desktop .po-photo-message { font-size: 17px; }
    .po-card.prompt-only .po-photo-question {
      font-family: ${F.body}; font-size: clamp(28.9px, 3.57vw, 39.1px);
      font-weight: 800; line-height: 1.06; letter-spacing: -.055em;
    }
    .po-card.prompt-only .po-photo-message { font-size: 17px; }
  }
  .po-card.photo-desktop.wide-photo {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }
  .po-card.photo-desktop.wide-photo .po-center { align-self: center; }
  .po-card.photo-desktop.wide-photo .po-panel-bottom {
    align-self: center;
    width: min(100%, var(--po-photo-width));
  }
  @media (max-width: 1199px) {
    .po-card.photo-phone-stacked {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }
    .po-card.photo-phone-stacked .po-center {
      justify-self: auto;
    }
    .po-card.photo-phone-stacked .po-panel-bottom {
      align-self: center;
      box-sizing: border-box;
      width: min(100%, var(--po-photo-width));
    }
  }
  .po-card:active { cursor: grabbing; }
  .po-scroll .po-card { pointer-events: auto; }
  .po-card:focus, .po-card:focus-visible { outline: none; }
  .po-card button { -webkit-tap-highlight-color: transparent; }
  .po-card.phone-draggable .po-center {
    translate: var(--po-drag-x, 0px) var(--po-drag-y, 0px);
    touch-action: none; user-select: none; -webkit-user-select: none;
  }

  .po-btn { width: 100%; height: 50px; border: 2px solid ${C.ink}; border-radius: 14px; background: ${C.card};
    color: ${C.ink}; font-family: ${F.mono}; font-size: 12.5px; font-weight: 700; letter-spacing: .12em;
    text-transform: uppercase; cursor: pointer; box-shadow: 4px 4px 0 ${C.ink};
    transition: transform .1s ease-out, box-shadow .1s ease-out; }
  .po-btn:active { transform: translate(4px, 4px); box-shadow: 0 0 0 ${C.ink}; }

  /* ═══ THE ZOOM STAGE — the popped item rendered at full modal width ═══ */
  .po-center { padding: 12px; cursor: pointer; }
  .po-stage { width: 100%; display: flex; justify-content: center; }
  .po-content { transition: transform .4s cubic-bezier(.22,1,.36,1); transform-origin: center; }
  .po-sandwich.expanded:not(.photo-only) .po-content { transform: scale(1.02); }
  .po-content .pc-hold { display: none !important; }
  .po-content div[style*="pointer-events: none"] { display: none !important; }
  .po-content img { pointer-events: none; }

  /* ═══ letter accordion ═══ */
  .po-panel-bottom {
    margin-top: 18px; padding: 12px; border: 2px solid ${C.ink};
    border-radius: 18px; background: ${C.paper}; box-shadow: 6px 6px 0 ${C.ink};
  }
  .po-photo-reply {
    display: flex; flex-direction: column; align-items: stretch; gap: 13.6px;
  }
  .po-card.photo-only .po-panel-bottom {
    margin: 0; padding: 0; border: 0; border-radius: 0;
    background: transparent; box-shadow: none;
  }
  .po-photo-question {
    margin: 0; color: ${C.green}; font-family: ${F.heavy}; font-size: 16.15px;
    line-height: 1.15; letter-spacing: -.02em;
  }
  .po-photo-message {
    display: block; box-sizing: border-box; width: 100%; min-width: 0; height: 62.9px; resize: none;
    padding: 10.2px 11.9px; background: ${C.paper}; color: ${C.ink};
    border: 2px solid ${C.ink}; border-radius: 12px 12px 5px 12px;
    box-shadow: 3.4px 3.4px 0 ${C.ink}; font-family: ${F.body}; font-size: 14.45px;
    font-weight: 500; line-height: 1.4; outline: none; caret-color: ${C.coral};
  }
  .po-photo-message::placeholder { color: ${C.ink3}; font-weight: 400; }
  .po-photo-message:focus-visible {
    box-shadow: 4px 4px 0 ${C.ink}, inset 0 0 0 2px ${C.green};
  }
  .po-photo-message-count {
    margin: -8px 0 0; color: ${C.green}; font-family: ${F.mono};
    font-size: 10px; font-weight: 700; text-align: right;
  }
  .po-photo-send {
    min-height: 40.8px; width: 100%; border: 2px solid ${C.ink}; border-radius: 10.2px;
    background: ${C.green}; color: ${C.ink}; box-shadow: 3.4px 3.4px 0 ${C.ink};
    font-family: ${F.body}; font-size: 13.6px; font-weight: 700; cursor: pointer;
    animation: po-photo-send-enter .2s ease-out both;
    transition: transform .1s ease-out, box-shadow .1s ease-out;
  }
  .po-photo-send:active:not(:disabled) {
    transform: translate(3.4px, 3.4px); box-shadow: 0 0 0 ${C.ink};
  }
  .po-photo-send:disabled { opacity: .45; cursor: default; }
  @keyframes po-photo-send-enter {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .po-card.opening:not(.photo-only) .po-panel-bottom {
    animation: po-panel-enter .42s cubic-bezier(.22,1,.36,1) .24s both;
  }
  @keyframes po-panel-enter {
    from { opacity: 0; transform: translateY(22px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .po-accordion { position: relative; height: 60px; overflow: hidden;
    transition: height .4s cubic-bezier(.22,1,.36,1); }
  .po-accordion.input-active { height: 248px; }
  .po-letterbtn { position: relative; display: flex; align-items: center; justify-content: center; gap: 9px;
    width: 100%; height: 60px; background: transparent; border: none; color: ${C.ink};
    font-family: ${F.body}; font-size: 15px; font-weight: 700; cursor: pointer;
    transition: opacity .25s, visibility 0s linear .25s; }
  /* ✨ ALIGN — the primary affirmative action.
     Yellow, the same slam colour as every other primary in the app, so it reads
     as "the main thing you can do here" rather than as a new category. */
  .po-letterbtn.po-alignbtn { background: ${C.yellow}; color: ${C.ink};
    font-family: ${F.mono}; font-size: 13px; font-weight: 700; letter-spacing: .12em;
    text-transform: uppercase; box-shadow: inset 0 -3px 0 ${C.yellowDeep};
    transition: opacity .25s, visibility 0s linear .25s, transform .1s ease-out; }
  .po-letterbtn.po-alignbtn:active:not(:disabled) { transform: translateY(2px); }
  .po-letterbtn.po-alignbtn:disabled { opacity: .35; cursor: default; }
  /* Align gets the slam yellow; the note is a quiet secondary that sits beside
     it rather than underneath it, so the two are one decision, not two steps. */
  .po-alignrow { display: flex; gap: 10px; align-items: stretch; width: 100%;
    transition: opacity .25s, visibility 0s linear .25s; }
  .po-alignrow.hide { opacity: 0; pointer-events: none; visibility: hidden; position: absolute; inset: 0; }
  .po-letterbtn.po-alignbtn { flex: 1.15; }
  .po-letterbtn.po-notebtn { flex: 1; background: transparent; color: ${C.ink2};
    border: 2px solid ${C.ink}; border-radius: 12px; box-shadow: 3px 3px 0 ${C.ink};
    font-family: ${F.mono}; font-size: 11.5px; font-weight: 700; letter-spacing: .1em;
    text-transform: uppercase; height: 56px; align-self: center;
    transition: opacity .25s, visibility 0s linear .25s, transform .1s ease-out; }
  .po-letterbtn.po-notebtn:active:not(:disabled) { transform: translate(2px, 2px); box-shadow: 1px 1px 0 ${C.ink}; }
  .po-letterbtn.po-notebtn:disabled { opacity: .35; cursor: default; }

  .po-inputarea { position: absolute; top: 0; left: 0; right: 0; padding: 14px 16px 18px;
    display: flex; flex-direction: column; gap: 12px; opacity: 0; pointer-events: none;
    visibility: hidden; transform: translateY(18px);
    transition: opacity .24s ease, transform .32s cubic-bezier(.22,1,.36,1), visibility 0s linear .32s; }
  .po-accordion.input-active .po-inputarea { opacity: 1; pointer-events: auto; visibility: visible;
    transform: translateY(0); transition: opacity .24s ease .06s, transform .32s cubic-bezier(.22,1,.36,1),
      visibility 0s; }

  .po-inputhead { display: flex; align-items: center; gap: 10px; }
  .po-kicker { flex: 1; font-family: ${F.mono}; font-size: 10px; font-weight: 700;
    letter-spacing: .14em; text-transform: uppercase; color: ${C.ink3}; }
  .po-count { font-family: ${F.mono}; font-size: 11px; font-weight: 700; color: ${C.ink2};
    font-variant-numeric: tabular-nums; }
  .po-collapse { display: flex; padding: 4px; margin: -4px; background: none; border: none;
    color: ${C.ink3}; cursor: pointer; }

  .po-fieldwrap { position: relative; border-radius: 14px; background: ${C.card};
    border: 2px solid ${C.ink}; overflow: hidden; transition: box-shadow .15s ease-out; }
  .po-fieldwrap:focus-within { box-shadow: 3px 3px 0 ${C.ink}; }
  .po-input { display: block; width: 100%; height: 118px; resize: none; border: none; outline: none;
    background: transparent; padding: 13px 14px 16px; font-family: ${F.body}; font-size: 15px;
    line-height: 1.5; color: ${C.ink}; caret-color: ${C.coral}; }
  .po-input::placeholder { color: ${C.ink3}; opacity: 1; }
  .po-bar { position: absolute; left: 0; right: 0; bottom: 0; height: 4px; background: ${C.hair}; }
  .po-barfill { height: 100%; background: ${C.coral}; transition: width .25s ease-out; }

  .po-send { height: 50px; width: 100%; border: 2px solid ${C.hair}; border-radius: 14px; background: ${C.card};
    color: ${C.ink3}; font-family: ${F.mono}; font-size: 12.5px; font-weight: 700; letter-spacing: .14em;
    text-transform: uppercase; cursor: default;
    transition: background .25s, color .25s, border-color .25s, transform .1s ease-out, box-shadow .1s ease-out; }
  .po-send.ready { border-color: ${C.ink}; background: ${C.yellow}; color: ${C.ink}; cursor: pointer;
    box-shadow: 4px 4px 0 ${C.ink}; }
  .po-send.ready:active { transform: translate(4px, 4px); box-shadow: 0 0 0 ${C.ink}; }

  .po-btn:focus-visible, .po-letterbtn:focus-visible, .po-send:focus-visible {
    outline: 3px solid ${C.coral}; outline-offset: 2px; }

  @media (prefers-reduced-motion: reduce) {
    .po-accordion, .po-content, .po-inputarea, .po-letterbtn, .po-panel-bottom, .po-prompt-reply {
      transition: none !important; animation: none !important;
    }
  }
`;

let popCssInjected = false;
function injectPopCss() {
  if (popCssInjected || typeof document === 'undefined') return;
  const existingTag = document.getElementById('po-css');
  if (existingTag) {
    existingTag.textContent = POP_CSS;
    popCssInjected = true;
    return;
  }
  const tag = document.createElement('style');
  tag.id = 'po-css';
  tag.textContent = POP_CSS;
  document.head.appendChild(tag);
  popCssInjected = true;
}
injectPopCss();

/* ── score dial — same ring as ProfileCard, count-up via MotionValue ── */
/* Registry of open-able popouts. A card mounts seven of them and any can be
   popped, so "close the popout" has to mean "close whichever is open" rather
   than "close the one whose ref I happened to hold". */
const popoutClosers = new Set();
const registerPopoutCloser = (fn) => { popoutClosers.add(fn); };
const unregisterPopoutCloser = (fn) => { popoutClosers.delete(fn); };
export const closeAllPopouts = () => Promise.all([...popoutClosers].map((close) => close()));
const notifyDeckPopoutOpening = () => {
  window.dispatchEvent(new Event('matchalize:deck-popout-opening'));
};

const PopoutItem = ({
  children, targetId, onAction, type, style, isGated = false,
  onPhoneReplyKeyboardChange,
}) => {
  const isDesktop = useIsDesktop();
  const reduceMotion = useReducedMotion();
  const promptOnly = targetId?.startsWith('prompt_') ?? false;
  const photoOnly = targetId?.startsWith('photo_') ?? false;

  const [isPopped, setIsPopped] = useState(false);
  const [backdropTarget, setBackdropTarget] = useState(null);
  const [workspaceBounds, setWorkspaceBounds] = useState(null);
  const [popSize, setPopSize] = useState(null);   // natural (unscaled) size of the item
  const [stageW, setStageW] = useState(0);        // width available in the modal
  const [photoWide, setPhotoWide] = useState(false);
  const [isCompactLayout, setIsCompactLayout] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 1200,
  );
  useEffect(() => {
    const media = window.matchMedia('(max-width: 1199px)');
    const updateCompactLayout = () => setIsCompactLayout(media.matches);
    updateCompactLayout();
    media.addEventListener('change', updateCompactLayout);
    return () => media.removeEventListener('change', updateCompactLayout);
  }, []);
  const photoStackedOnPhone = photoOnly && isCompactLayout;
  const [noteText, setNoteText] = useState('');
  const [actionSent, setActionSent] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [isCardExpanded, setIsCardExpanded] = useState(false);
  const [transitionReady, setTransitionReady] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [photoFormConcealed, setPhotoFormConcealed] = useState(true);
  const photoReplyFocusedRef = useRef(false);
  const photoLayoutHeightRef = useRef(
    typeof window !== 'undefined' ? window.visualViewport?.height ?? window.innerHeight : 0,
  );
  const availablePhotoWidth = photoOnly
    ? Math.max(0, photoStackedOnPhone ? stageW - 12 : stageW - 264)
    : 0;
  const workspaceWidth = workspaceBounds?.width ?? window.innerWidth;
  const visibleWorkspaceHeight = workspaceBounds?.height ?? window.innerHeight;
  const workspaceHeight = photoOnly && photoStackedOnPhone
    ? Math.max(visibleWorkspaceHeight, photoLayoutHeightRef.current)
    : visibleWorkspaceHeight;
  const phonePhotoHeight = Math.max(0, workspaceHeight - 252);
  const photoAspect = photoStackedOnPhone && !photoWide && phonePhotoHeight > 0
    ? availablePhotoWidth / phonePhotoHeight
    : photoWide ? 16 / 10 : 9 / 16;
  const basePhotoHeight = photoOnly && stageW > 0
    ? Math.min(
      availablePhotoWidth / photoAspect,
      Math.max(0, Math.min(workspaceHeight * 0.62, workspaceHeight - 52)),
    )
    : 0;
  const photoHeight = photoStackedOnPhone
    ? Math.min(phonePhotoHeight, availablePhotoWidth / photoAspect)
    : Math.min(
      basePhotoHeight * 1.3,
      availablePhotoWidth / photoAspect,
      Math.max(0, Math.min(workspaceHeight * 0.9, workspaceHeight - 52)),
    ) * (photoWide ? 0.664 : 1);
  const photoWidth = photoOnly ? photoHeight * photoAspect : 0;
  const photoNaturalHeight = popSize && photoOnly ? popSize.w / photoAspect : 0;
  const zoom = popSize && stageW > 0
    ? (photoOnly ? photoWidth / popSize.w : clamp(stageW / popSize.w, SCALE_MIN, SCALE_MAX))
    : 0;
  const promptScale = popSize
    ? Math.min(
      1.875,
      Math.max(0.1, (workspaceWidth - 32) / popSize.w),
    )
    : 1.875;
  const promptWidth = popSize ? Math.round(popSize.w * promptScale) : undefined;
  const promptHeight = popSize ? Math.round(popSize.h * promptScale) : undefined;

  const itemRef = useRef(null);
  const stageRef = useRef(null);
  const flightRef = useRef(null);
  const cardRef = useRef(null);      // dialog itself — receives initial focus
  const photoPanelRef = useRef(null);
  const noteRef = useRef(null);      // letter textarea — preventScroll autofocus
  const sourceRectRef = useRef(null);
  const openRectRef = useRef(null);
  const transitionStartedRef = useRef(false);
  const closingRef = useRef(false);
  const transitionRunRef = useRef(0);
  const transitionControlsRef = useRef([]);
  const photoMotionRef = useRef(null);
  const closePromiseRef = useRef(null);
  const dragGestureRef = useRef(null);
  const suppressClickRef = useRef(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scaleX = useMotionValue(1);
  const scaleY = useMotionValue(1);
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const backdropOpacity = useMotionValue(0);
  const photoFormX = useMotionValue(0);
  const photoFormY = useMotionValue(0);
  const photoFormScale = useMotionValue(1);
  const photoFormOpacity = useMotionValue(0);

  useEffect(() => {
    const updateDragOffset = () => {
      const card = cardRef.current;
      if (!card) return;
      card.style.setProperty('--po-drag-x', `${dragX.get()}px`);
      card.style.setProperty('--po-drag-y', `${dragY.get()}px`);
    };
    const unsubscribeX = dragX.on('change', updateDragOffset);
    const unsubscribeY = dragY.on('change', updateDragOffset);
    return () => {
      unsubscribeX();
      unsubscribeY();
      cardRef.current?.style.removeProperty('--po-drag-x');
      cardRef.current?.style.removeProperty('--po-drag-y');
    };
  }, [dragX, dragY]);

  const updateRect = useCallback(() => {
    const el = itemRef.current;
    if (!el) return;
    const sourceEl = photoOnly ? (el.querySelector('.pc-ph') || el) : el;
    const bounds = sourceEl.getBoundingClientRect();
    sourceRectRef.current = bounds;
    // layout size (transform-free) — this is what we scale up in the modal
    setPopSize({ w: sourceEl.offsetWidth, h: sourceEl.offsetHeight });
    setPhotoWide(!!sourceEl.querySelector('.pc-ph-in.wide'));
  }, [photoOnly]);

  /* measure the modal's inner stage — and KEEP measuring across
     rotation / resize / keyboard show, so zoom never goes stale */
  useLayoutEffect(() => {
    if (!isPopped) { setStageW(0); return; }
    const el = photoOnly ? flightRef.current : stageRef.current;
    if (!el) { setStageW(0); return; }
    const measure = () => setStageW(el.clientWidth || 0);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    window.addEventListener('orientationchange', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('orientationchange', measure);
    };
  }, [isPopped, type, isDesktop, photoOnly]);

  useEffect(() => {
    if (isPopped && !promptOnly) {
      if (photoOnly) {
        setIsCardExpanded(true);
        return undefined;
      }
      const timer = setTimeout(() => setIsCardExpanded(true), 50);
      return () => clearTimeout(timer);
    }
    setIsCardExpanded(false);
  }, [isPopped, promptOnly, photoOnly]);

  useLayoutEffect(() => {
    if (!isPopped || !zoom || transitionStartedRef.current || ((photoOnly || promptOnly) && !workspaceBounds)) return;
    const flight = flightRef.current;
    if (photoOnly && (!flight || stageW !== flight.clientWidth)) return;
    if (promptOnly && (!flight || flight.offsetWidth !== promptWidth)) return;
    const source = photoOnly
      ? (sourceRectRef.current || itemRef.current?.querySelector('.pc-ph')?.getBoundingClientRect())
      : (itemRef.current?.getBoundingClientRect() || sourceRectRef.current);
    if (source) sourceRectRef.current = source;
    if (!flight || !source) return;

    const target = flight.getBoundingClientRect();
    const targetWidth = flight.offsetWidth;
    const targetHeight = flight.offsetHeight;
    if (!targetWidth || !targetHeight) return;

    openRectRef.current = target;
    transitionStartedRef.current = true;
    closingRef.current = false;

    if (reduceMotion) {
      x.set(0);
      y.set(0);
      scaleX.set(1);
      scaleY.set(1);
      backdropOpacity.set(1);
      setIsOpening(false);
      photoFormX.set(0);
      photoFormY.set(0);
      photoFormScale.set(1);
      photoFormOpacity.set(1);
      setPhotoFormConcealed(false);
      setTransitionReady(true);
      return;
    }

    setIsOpening(true);
    if (photoOnly || promptOnly) {
      const photo = flight.querySelector('.po-content');
      const panel = photoPanelRef.current;
      if (!photo || !panel) return;

      const photoRect = photo.getBoundingClientRect();
      const offsetX = photoRect.left - target.left;
      const offsetY = photoRect.top - target.top;
      const sourceScaleX = source.width / photoRect.width;
      const sourceScaleY = source.height / photoRect.height;
      const start = {
        x: source.left - target.left - offsetX * sourceScaleX,
        y: source.top - target.top - offsetY * sourceScaleY,
        scaleX: sourceScaleX,
        scaleY: sourceScaleY,
      };
      const workspaceLeft = workspaceBounds?.left ?? 0;
      const workspaceTop = workspaceBounds?.top ?? 0;
      const center = {
        x: workspaceLeft + (workspaceBounds?.width ?? window.innerWidth) / 2
          - target.left - offsetX - photoRect.width / 2,
        y: workspaceTop + (workspaceBounds?.height ?? window.innerHeight) / 2
          - target.top - offsetY - photoRect.height / 2,
      };
      photoMotionRef.current = {
        start,
        center: { ...center, scaleX: 1, scaleY: 1 },
        formBehindOffset: { x: 0, y: 0 },
        formBehindScale: 1,
      };

      x.set(start.x);
      y.set(start.y);
      scaleX.set(start.scaleX);
      scaleY.set(start.scaleY);
      photoFormX.set(0);
      photoFormY.set(0);
      photoFormScale.set(1);
      photoFormOpacity.set(1);
      backdropOpacity.set(0);
      setTransitionReady(true);

      const run = ++transitionRunRef.current;
      const animateStage = async (controls) => {
        transitionControlsRef.current = controls;
        await Promise.all(controls.map((control) => control.then(() => undefined)));
        if (transitionRunRef.current !== run) return false;
        transitionControlsRef.current = [];
        return true;
      };
      const openPhoto = async () => {
        const centered = await animateStage([
          animate(x, center.x, { duration: 0.34, ease: PHOTO_OPEN_EASE }),
          animate(y, center.y, { duration: 0.34, ease: PHOTO_OPEN_EASE }),
          animate(scaleX, 1, { duration: 0.34, ease: PHOTO_OPEN_EASE }),
          animate(scaleY, 1, { duration: 0.34, ease: PHOTO_OPEN_EASE }),
          animate(backdropOpacity, 1, { duration: 0.3, ease: 'easeOut' }),
        ]);
        if (!centered) return;
        await new Promise((resolve) => setTimeout(resolve, 80));
        if (transitionRunRef.current !== run) return;

        const centeredPhoto = photo.getBoundingClientRect();
        const centeredPanel = panel.getBoundingClientRect();
        const formBehindOffset = {
          x: centeredPhoto.left + centeredPhoto.width / 2
            - (centeredPanel.left + centeredPanel.width / 2),
          y: centeredPhoto.top + centeredPhoto.height / 2
            - (centeredPanel.top + centeredPanel.height / 2),
        };
        const formBehindScale = Math.min(
          1,
          centeredPhoto.width / centeredPanel.width,
          centeredPhoto.height / centeredPanel.height,
        );
        photoMotionRef.current = {
          ...photoMotionRef.current,
          formBehindOffset,
          formBehindScale,
        };
        photoFormX.set(formBehindOffset.x);
        photoFormY.set(formBehindOffset.y);
        photoFormScale.set(formBehindScale);
        photoFormOpacity.set(1);
        setPhotoFormConcealed(false);
        const settled = await animateStage([
          animate(x, 0, { duration: 0.38, ease: PHOTO_OPEN_EASE }),
          animate(y, 0, { duration: 0.38, ease: PHOTO_OPEN_EASE }),
          animate(photoFormX, 0, { duration: 0.38, ease: PHOTO_OPEN_EASE }),
          animate(photoFormY, 0, { duration: 0.38, ease: PHOTO_OPEN_EASE }),
          animate(photoFormScale, 1, { duration: 0.38, ease: PHOTO_OPEN_EASE }),
        ]);
        if (settled) {
          setIsOpening(false);
        }
      };
      openPhoto();
      return;
    }

    x.set(source.left - target.left);
    y.set(source.top - target.top);
    scaleX.set(source.width / targetWidth);
    scaleY.set(source.height / targetHeight);
    backdropOpacity.set(0);
    setTransitionReady(true);

    const run = ++transitionRunRef.current;
    const controls = [
      animate(x, 0, { duration: 0.48, ease: [0.22, 1, 0.36, 1] }),
      animate(y, 0, { duration: 0.48, ease: [0.22, 1, 0.36, 1] }),
      animate(scaleX, 1, { duration: 0.48, ease: [0.22, 1, 0.36, 1] }),
      animate(scaleY, 1, { duration: 0.48, ease: [0.22, 1, 0.36, 1] }),
      animate(backdropOpacity, 1, { duration: 0.28, ease: 'easeOut' }),
    ];
    transitionControlsRef.current = controls;
    Promise.all(controls.map((control) => control.then(() => undefined))).then(() => {
      if (transitionRunRef.current !== run) return;
      transitionControlsRef.current = [];
      setIsOpening(false);
    });
  }, [
    isPopped, zoom, reduceMotion, photoOnly, photoWide, isDesktop, workspaceBounds, stageW,
    promptOnly, promptWidth, x, y, scaleX, scaleY, backdropOpacity,
    photoFormX, photoFormY, photoFormScale, photoFormOpacity,
  ]);

  /* Keep focus in the popout initially, but let keyboard navigation continue
     through the rest of the app while the deck alone is covered. */
  useEffect(() => {
    if (!isPopped) return;
    const prevFocus = document.activeElement;

    const focusTimer = setTimeout(() => {
      cardRef.current?.focus({ preventScroll: true });
    }, 60);

    return () => {
      clearTimeout(focusTimer);
      if (prevFocus?.isConnected && typeof prevFocus.focus === 'function') {
        prevFocus.focus({ preventScroll: true });
      }
    };
  }, [isPopped]);

  useLayoutEffect(() => {
    if (!isPopped) return undefined;
    const region = document.querySelector('[data-popout-affected-region]');
    if (!region) return undefined;

    const wasInert = region.inert;
    const previousAriaHidden = region.getAttribute('aria-hidden');
    photoLayoutHeightRef.current = region.getBoundingClientRect().height;
    const measure = () => {
      const bounds = region.getBoundingClientRect();
      const visualViewport = window.visualViewport;
      const visibleLeft = visualViewport?.offsetLeft ?? 0;
      const visibleTop = visualViewport?.offsetTop ?? 0;
      const visibleRight = visibleLeft + (visualViewport?.width ?? window.innerWidth);
      const visibleBottom = visibleTop + (visualViewport?.height ?? window.innerHeight);
      const sidebar = document.querySelector('.ds-instagram');
      const sidebarRight = sidebar?.getBoundingClientRect().right ?? bounds.left;
      const workspaceLeft = Math.max(bounds.left, sidebarRight, visibleLeft);
      const workspaceTop = Math.max(bounds.top, visibleTop);
      const workspaceRight = Math.min(bounds.right, visibleRight);
      const workspaceBottom = Math.min(bounds.bottom, visibleBottom);
      setWorkspaceBounds({
        left: workspaceLeft,
        top: workspaceTop,
        width: Math.max(0, workspaceRight - workspaceLeft),
        height: Math.max(0, workspaceBottom - workspaceTop),
      });
    };

    measure();
    setBackdropTarget(region);
    region.inert = true;
    region.setAttribute('aria-hidden', 'true');
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(region);
    const sidebar = document.querySelector('.ds-instagram');
    if (sidebar) resizeObserver.observe(sidebar);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    window.visualViewport?.addEventListener('resize', measure);
    window.visualViewport?.addEventListener('scroll', measure);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
      window.visualViewport?.removeEventListener('resize', measure);
      window.visualViewport?.removeEventListener('scroll', measure);
      region.inert = wasInert;
      if (previousAriaHidden === null) region.removeAttribute('aria-hidden');
      else region.setAttribute('aria-hidden', previousAriaHidden);
      setBackdropTarget(null);
      setWorkspaceBounds(null);
    };
  }, [isPopped]);

  useEffect(() => {
    if (!photoOnly || !isPopped || !onPhoneReplyKeyboardChange) return undefined;
    const isPhoneViewport = () => Math.min(window.innerWidth, window.innerHeight) <= 600;
    if (!isPhoneViewport()) {
      onPhoneReplyKeyboardChange(false);
      return undefined;
    }

    const visualViewport = window.visualViewport;
    let baselineHeight = visualViewport?.height ?? window.innerHeight;
    let keyboardDetected = false;
    let blurTimer = null;
    const reportKeyboardState = () => {
      if (!isPhoneViewport()) {
        keyboardDetected = false;
        onPhoneReplyKeyboardChange(false);
        return;
      }
      const currentHeight = visualViewport?.height ?? window.innerHeight;
      const heightReduction = baselineHeight - currentHeight;
      const wasKeyboardDetected = keyboardDetected;
      if (photoReplyFocusedRef.current && heightReduction > 120) keyboardDetected = true;
      if (keyboardDetected && heightReduction <= 80) keyboardDetected = false;
      onPhoneReplyKeyboardChange(keyboardDetected);
      if (!wasKeyboardDetected && keyboardDetected) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const scrollRegion = document.querySelector('.po-scroll');
            const replyTarget = scrollRegion?.querySelector('.po-photo-send')
              || scrollRegion?.querySelector('.po-photo-message');
            if (!scrollRegion || !replyTarget || !visualViewport) return;
            const targetBottom = replyTarget.getBoundingClientRect().bottom;
            const visibleBottom = visualViewport.offsetTop + visualViewport.height;
            const overflow = targetBottom - visibleBottom + 20;
            if (overflow > 0) scrollRegion.scrollBy({ top: overflow, behavior: 'smooth' });
          });
        });
      }
    };
    const onFocusIn = (event) => {
      if (!event.target.matches?.('.po-photo-message')) return;
      photoReplyFocusedRef.current = true;
      if (blurTimer) clearTimeout(blurTimer);
      reportKeyboardState();
    };
    const onFocusOut = (event) => {
      if (!event.target.matches?.('.po-photo-message')) return;
      photoReplyFocusedRef.current = false;
      if (blurTimer) clearTimeout(blurTimer);
      blurTimer = setTimeout(reportKeyboardState, 700);
      reportKeyboardState();
    };
    const onOrientationChange = () => {
      baselineHeight = visualViewport?.height ?? window.innerHeight;
      photoLayoutHeightRef.current = document
        .querySelector('[data-popout-affected-region]')?.getBoundingClientRect().height ?? baselineHeight;
      keyboardDetected = false;
      onPhoneReplyKeyboardChange(false);
    };

    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    window.addEventListener('resize', reportKeyboardState);
    window.addEventListener('orientationchange', onOrientationChange);
    visualViewport?.addEventListener('resize', reportKeyboardState);

    return () => {
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
      window.removeEventListener('resize', reportKeyboardState);
      window.removeEventListener('orientationchange', onOrientationChange);
      visualViewport?.removeEventListener('resize', reportKeyboardState);
      if (blurTimer) clearTimeout(blurTimer);
      photoReplyFocusedRef.current = false;
      onPhoneReplyKeyboardChange(false);
    };
  }, [photoOnly, isPopped, onPhoneReplyKeyboardChange]);

  /* ════ jitter-proof long-press (unchanged) ════ */
  const press = useRef({ timer: null, id: null, x: 0, y: 0 });

  const clearPress = useCallback(() => {
    if (press.current.timer) { clearTimeout(press.current.timer); press.current.timer = null; }
    press.current.id = null;
  }, []);

  useEffect(() => {
    const el = itemRef.current;
    if (!el) return;

    const onDown = (e) => {
      if (!isDesktop || e.pointerType === 'mouse') return;
      if (!e.isPrimary) return;
      if (press.current.timer) return;
      press.current.id = e.pointerId;
      press.current.x = e.clientX;
      press.current.y = e.clientY;
      press.current.timer = setTimeout(() => {
        press.current.timer = null;
        triggerHaptic('medium');
        notifyDeckPopoutOpening();
        closingRef.current = false;
        transitionStartedRef.current = false;
        openRectRef.current = null;
        setIsCardExpanded(photoOnly);
        setTransitionReady(false);
        setIsOpening(false);
        x.set(0);
        y.set(0);
        scaleX.set(1);
        scaleY.set(1);
        dragX.set(0);
        dragY.set(0);
        backdropOpacity.set(0);
        photoFormX.set(0);
        photoFormY.set(0);
        photoFormScale.set(1);
        photoFormOpacity.set(0);
        setPhotoFormConcealed(true);
        updateRect();
        setIsPopped(true);
      }, PRESS_MS);
    };

    const onMove = (e) => {
      if (!press.current.timer || e.pointerId !== press.current.id) return;
      const dx = e.clientX - press.current.x;
      const dy = e.clientY - press.current.y;
      if (dx * dx + dy * dy > PRESS_SLOP * PRESS_SLOP) clearPress();
    };

    const onUp = (e) => {
      if (e.pointerId === press.current.id) clearPress();
    };

    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      clearPress();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDesktop, updateRect, photoOnly, x, y, scaleX, scaleY, dragX, dragY, backdropOpacity, photoFormX, photoFormY, photoFormScale, photoFormOpacity]);

  const closePopout = useCallback((onClosed, withHaptic = true) => {
    if (!isPopped) return Promise.resolve();
    if (closingRef.current) return closePromiseRef.current || Promise.resolve();
    closingRef.current = true;
    if (withHaptic) triggerHaptic('light');
    if (!photoOnly) setIsCardExpanded(false);

    const flight = flightRef.current;
    const card = cardRef.current;
    const measuredSource = photoOnly
      ? itemRef.current?.querySelector('.pc-ph')?.getBoundingClientRect() || sourceRectRef.current
      : itemRef.current?.getBoundingClientRect() || sourceRectRef.current;
    const source = photoOnly ? (sourceRectRef.current || measuredSource) : measuredSource;
    if (source && !sourceRectRef.current) sourceRectRef.current = source;
    const target = openRectRef.current;
    const width = flight?.offsetWidth || 0;
    const height = flight?.offsetHeight || 0;

    const run = ++transitionRunRef.current;
    transitionControlsRef.current.forEach((control) => control.stop());
    transitionControlsRef.current = [];

    const closePromise = new Promise((resolve) => {
      const finishClose = () => {
        setIsPopped(false);
        setTransitionReady(false);
        setIsOpening(false);
        setIsCardExpanded(false);
        setShowInput(false);
        onClosed?.();
        closePromiseRef.current = null;
        resolve();
      };

      if (reduceMotion || !transitionReady || !flight || !card || !source || !target || !width || !height) {
        finishClose();
        return;
      }

      const photoMotion = photoOnly || promptOnly ? photoMotionRef.current : null;
      if (photoMotion) {
        const runPhotoClose = async () => {
          const phonePhotoOrPrompt = isCompactLayout && (photoOnly || promptOnly);
          if (phonePhotoOrPrompt) {
            const returned = [
              animate(x, photoMotion.start.x, { duration: 0.28, ease: PHOTO_CLOSE_EASE }),
              animate(y, photoMotion.start.y, { duration: 0.28, ease: PHOTO_CLOSE_EASE }),
              animate(scaleX, photoMotion.start.scaleX, { duration: 0.28, ease: PHOTO_CLOSE_EASE }),
              animate(scaleY, photoMotion.start.scaleY, { duration: 0.28, ease: PHOTO_CLOSE_EASE }),
              animate(dragX, 0, { duration: 0.28, ease: PHOTO_CLOSE_EASE }),
              animate(dragY, 0, { duration: 0.28, ease: PHOTO_CLOSE_EASE }),
              animate(photoFormOpacity, 0, { duration: 0.18, ease: 'easeOut' }),
              animate(backdropOpacity, 0, { duration: 0.2, ease: 'easeIn' }),
            ];
            transitionControlsRef.current = returned;
            await Promise.all(returned.map((control) => control.then(() => undefined)));
            if (transitionRunRef.current !== run) return;
            transitionControlsRef.current = [];
            setPhotoFormConcealed(true);
            finishClose();
            return;
          }
          const centered = [
            animate(x, photoMotion.center.x, { duration: 0.38, ease: PHOTO_CLOSE_EASE }),
            animate(y, photoMotion.center.y, { duration: 0.38, ease: PHOTO_CLOSE_EASE }),
            animate(scaleX, 1, { duration: 0.38, ease: PHOTO_CLOSE_EASE }),
            animate(scaleY, 1, { duration: 0.38, ease: PHOTO_CLOSE_EASE }),
            animate(photoFormX, photoMotion.formBehindOffset.x, { duration: 0.38, ease: PHOTO_CLOSE_EASE }),
            animate(photoFormY, photoMotion.formBehindOffset.y, { duration: 0.38, ease: PHOTO_CLOSE_EASE }),
            animate(photoFormScale, photoMotion.formBehindScale, { duration: 0.38, ease: PHOTO_CLOSE_EASE }),
          ];
          transitionControlsRef.current = centered;
          await Promise.all(centered.map((control) => control.then(() => undefined)));
          if (transitionRunRef.current !== run) return;
          setPhotoFormConcealed(true);

          const returned = [
            animate(x, photoMotion.start.x, { duration: 0.34, ease: PHOTO_CLOSE_EASE }),
            animate(y, photoMotion.start.y, { duration: 0.34, ease: PHOTO_CLOSE_EASE }),
            animate(scaleX, photoMotion.start.scaleX, { duration: 0.34, ease: PHOTO_CLOSE_EASE }),
            animate(scaleY, photoMotion.start.scaleY, { duration: 0.34, ease: PHOTO_CLOSE_EASE }),
            animate(dragX, 0, { duration: 0.34, ease: PHOTO_CLOSE_EASE }),
            animate(dragY, 0, { duration: 0.34, ease: PHOTO_CLOSE_EASE }),
            animate(backdropOpacity, 0, { duration: 0.24, ease: 'easeIn' }),
          ];
          transitionControlsRef.current = returned;
          await Promise.all(returned.map((control) => control.then(() => undefined)));
          if (transitionRunRef.current !== run) return;
          transitionControlsRef.current = [];
          finishClose();
        };
        runPhotoClose();
        return;
      }

      const currentBounds = flight.getBoundingClientRect();
      const baseLeft = currentBounds.left - x.get();
      const baseTop = currentBounds.top - y.get();
      const controls = [
        animate(x, source.left - baseLeft, { duration: 0.36, ease: [0.32, 0, 0.67, 0] }),
        animate(y, source.top - baseTop, { duration: 0.36, ease: [0.32, 0, 0.67, 0] }),
        animate(scaleX, source.width / width, { duration: 0.36, ease: [0.32, 0, 0.67, 0] }),
        animate(scaleY, source.height / height, { duration: 0.36, ease: [0.32, 0, 0.67, 0] }),
        animate(dragX, 0, { duration: 0.36, ease: [0.32, 0, 0.67, 0] }),
        animate(dragY, 0, { duration: 0.36, ease: [0.32, 0, 0.67, 0] }),
        animate(backdropOpacity, 0, { duration: 0.24, ease: 'easeIn' }),
      ];
      transitionControlsRef.current = controls;
      Promise.all(controls.map((control) => control.then(() => undefined))).then(() => {
        if (transitionRunRef.current !== run) return;
        transitionControlsRef.current = [];
        finishClose();
      });
    });
    closePromiseRef.current = closePromise;
    return closePromise;
  }, [
    isPopped, reduceMotion, transitionReady, isCompactLayout, photoOnly, promptOnly,
    x, y, scaleX, scaleY, dragX, dragY, backdropOpacity,
    photoFormX, photoFormY, photoFormScale, photoFormOpacity,
  ]);

  const handleDragStart = useCallback((e) => {
    if ((!isCompactLayout && !(photoOnly || promptOnly))
      || !transitionReady || isOpening || showInput || (e.pointerType === 'mouse' && e.button !== 0)) return;
    if (!e.target?.closest?.('.po-center')) return;
    if (e.target?.closest?.('button, a, textarea, input')) return;
    dragGestureRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: dragX.get(),
      originY: dragY.get(),
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [isCompactLayout, photoOnly, promptOnly, transitionReady, isOpening, showInput, dragX, dragY]);

  const handleDragMove = useCallback((e) => {
    const gesture = dragGestureRef.current;
    if (!gesture || gesture.pointerId !== e.pointerId) return;
    const dx = e.clientX - gesture.startX;
    const dy = e.clientY - gesture.startY;
    if (Math.hypot(dx, dy) > 8) gesture.moved = true;
    dragX.set(gesture.originX + dx);
    dragY.set(gesture.originY + dy);
    const phonePhotoOrPrompt = isCompactLayout && (photoOnly || promptOnly);
    if (phonePhotoOrPrompt) {
      photoFormOpacity.set(1 - clamp(Math.hypot(dx, dy) / 180, 0, 1));
    }
    const progress = clamp(Math.hypot(dx, dy) / 240, 0, 0.75);
    backdropOpacity.set(1 - progress);
    e.preventDefault();
  }, [isCompactLayout, photoOnly, promptOnly, dragX, dragY, photoFormOpacity, backdropOpacity]);

  const handleDragEnd = useCallback((e) => {
    const gesture = dragGestureRef.current;
    if (!gesture || gesture.pointerId !== e.pointerId) return;
    dragGestureRef.current = null;
    const dx = e.clientX - gesture.startX;
    const dy = e.clientY - gesture.startY;
    if (gesture.moved) {
      suppressClickRef.current = true;
      setTimeout(() => { suppressClickRef.current = false; }, 250);
    }
    const phonePhotoOrPrompt = isCompactLayout && (photoOnly || promptOnly);
    if (phonePhotoOrPrompt && dy > 100 && dy > Math.abs(dx) * 1.2) {
      closePopout();
      return;
    }
    if (!phonePhotoOrPrompt && Math.hypot(dx, dy) > 80) {
      closePopout();
      return;
    }
    animate(dragX, 0, { type: 'spring', damping: 28, stiffness: 300 });
    animate(dragY, 0, { type: 'spring', damping: 28, stiffness: 300 });
    if (phonePhotoOrPrompt) {
      animate(photoFormOpacity, 1, { type: 'spring', damping: 28, stiffness: 300 });
    }
    animate(backdropOpacity, 1, { type: 'spring', damping: 28, stiffness: 300 });
  }, [isCompactLayout, photoOnly, promptOnly, closePopout, dragX, dragY, photoFormOpacity, backdropOpacity]);

  useEffect(() => {
    if (!isPopped) return undefined;
    window.addEventListener('pointermove', handleDragMove, { passive: false });
    window.addEventListener('pointerup', handleDragEnd);
    window.addEventListener('pointercancel', handleDragEnd);
    return () => {
      window.removeEventListener('pointermove', handleDragMove);
      window.removeEventListener('pointerup', handleDragEnd);
      window.removeEventListener('pointercancel', handleDragEnd);
      dragGestureRef.current = null;
    };
  }, [isPopped, handleDragMove, handleDragEnd]);

  /* ── shared "close all popouts" registry ──
     A ProfileCard renders SEVEN PopoutItems, each of which can be open, so a
     single forwarded ref is the wrong shape: useImperativeHandle overwrites the
     ref on every mount, so the deck's close() would land on whichever happened
     to mount last — usually not the one the user actually tapped.

     Instead each instance registers its own closer here, and the deck calls
     closeAll(). Cheap (the list is emptied on unmount) and it closes whatever
     is open, which is the actual requirement: the gate toast must never render
     over a live modal scrim. */
  useEffect(() => {
    registerPopoutCloser(closePopout);
    return () => unregisterPopoutCloser(closePopout);
  }, [closePopout]);

  const openPopout = useCallback(() => {
    if (isPopped || actionSent) return;
    triggerHaptic('medium');
    notifyDeckPopoutOpening();
    closingRef.current = false;
    transitionStartedRef.current = false;
    openRectRef.current = null;
    setIsCardExpanded(photoOnly);
    setTransitionReady(false);
    setIsOpening(false);
    x.set(0);
    y.set(0);
    scaleX.set(1);
    scaleY.set(1);
    dragX.set(0);
    dragY.set(0);
    backdropOpacity.set(0);
    photoFormX.set(0);
    photoFormY.set(0);
    photoFormScale.set(1);
    photoFormOpacity.set(0);
    setPhotoFormConcealed(true);
    updateRect();
    setIsPopped(true);
  }, [
    isPopped, actionSent, photoOnly, updateRect, x, y, scaleX, scaleY, dragX, dragY,
    backdropOpacity, photoFormX, photoFormY, photoFormScale, photoFormOpacity,
  ]);

  const handleItemClick = (e) => {
    if (isPopped) return;
    if (e.target?.closest?.('button, a, textarea, input')) return;
    openPopout();
  };

  const handleDesktopContextMenu = (e) => {
    e.preventDefault();
    if (isDesktop) openPopout();
  };

  useEffect(() => {
    if (!isPopped) return;
    const onKey = (e) => { if (e.key === 'Escape') closePopout(); };
    const onOutsidePointerDown = (e) => {
      if (!cardRef.current?.contains(e.target)) closePopout();
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onOutsidePointerDown, true);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onOutsidePointerDown, true);
    };
  }, [isPopped, closePopout]);

  useEffect(() => () => {
    transitionRunRef.current += 1;
    transitionControlsRef.current.forEach((control) => control.stop());
  }, []);

  /* ── THE GATE ──
     When the viewer is under the interaction threshold, the parent's
     handleAction will open the gate instead of sending. The popout must remain
     open and `actionSent` must NOT latch in that case:
     stay open and armed so that when the gate resolves, the replayed action
     finds the same live popout and the user never taps twice.

     The parent tells us which case we're in via `isGated`, so this component
     never has to know the threshold — one rule, decided in one place. */
  /* ✨ ALIGN — the one positive action.

     Both states of the accordion call this: the collapsed button (no note) and
     the composer's Align button (note attached). `targetId` is always carried,
     so an align is always attributable to the specific photo or prompt the user
     tapped — that attribution is what the note is written about.

     The gated path hands off without closing or latching. The note is left in
     `noteText` untouched so the
     parent's replay after the gate resolves carries the exact words that were
     typed; silently discarding someone's message because their profile was
     short at that instant is the worst available way to fail this. */
  const handleAlignNow = (noteOverride = noteText) => {
    if (actionSent) return;
    const trimmed = noteOverride.trim();

    if (isGated) {
      triggerHaptic('medium');
      onAction('align', trimmed ? { target: targetId, note: trimmed } : { target: targetId });
      return;
    }

    setActionSent(true);
    triggerHaptic('heavy');
    closePopout(() => {
      onAction('align', trimmed ? { target: targetId, note: trimmed } : { target: targetId });
      setNoteText('');
    });
  };

  /* letter textarea: focus WITHOUT the auto-scroll side effect */
  useEffect(() => {
    if (showInput) noteRef.current?.focus({ preventScroll: true });
  }, [showInput]);

  const completionPercentage = Math.min((noteText.length / 140) * 100, 100);
  const itemHandlers = {
    onClick: handleItemClick,
    onContextMenu: handleDesktopContextMenu,
    title: isDesktop ? 'Click to open' : undefined,
    style: { WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none', cursor: isDesktop ? 'pointer' : undefined },
  };

  /* ───────────────────── flower · telegram · letter ───────────────────── */
  return (
    <div
      ref={itemRef}
      {...itemHandlers}
      style={{ position: 'relative', width: '100%', height: '100%', ...itemHandlers.style, ...style }}
    >
      <motion.div
        animate={{ scale: isPopped && !promptOnly && !photoOnly ? 1.04 : 1, zIndex: isPopped ? 100 : 1 }}
        transition={{ type: 'spring', damping: 22, stiffness: 300 }}
        style={{
          height: '100%',
          transformOrigin: 'center',
          borderRadius: 20,
          willChange: 'transform',
          opacity: isPopped ? 0 : 1,
          transition: 'opacity .12s ease',
        }}
      >
        {children}
      </motion.div>
      {isPopped && backdropTarget && createPortal(
        <motion.div
          className="po-backdrop"
          style={{ opacity: backdropOpacity }}
        />,
        backdropTarget
      )}

      {createPortal(
        <AnimatePresence>
          {isPopped && (
            <motion.div
              key="po-sandwich-overlay"
              className="po-overlay"
            >
              <div
                className="po-scroll"
                style={{
                  ...(workspaceBounds || {}),
                  right: 'auto',
                  bottom: 'auto',
                  boxSizing: 'border-box',
                }}
              >
                <motion.div
                  ref={flightRef}
                  className={`po-flight${promptOnly ? ' prompt-flight' : ''}${photoOnly ? ' photo-flight' : ''}`}
                  style={{
                    x,
                    y,
                    scaleX,
                    scaleY,
                    opacity: transitionReady ? 1 : 0,
                    ...(promptOnly && promptWidth ? { width: promptWidth } : {}),
                  }}
                >
                  <motion.div
                    className={`po-card po-sandwich${promptOnly ? ' prompt-only' : ''}${photoOnly ? ' photo-only photo-desktop' : ''}${photoStackedOnPhone ? ' photo-phone-stacked' : ''}${isCompactLayout && (photoOnly || promptOnly) ? ' phone-draggable' : ''}${photoOnly && photoFormConcealed ? ' form-concealed' : ''}${promptOnly && photoFormConcealed ? ' prompt-form-concealed' : ''}${photoOnly && photoWide ? ' wide-photo' : ''}${isCardExpanded ? ' expanded' : ''}${isOpening ? ' opening' : ''}`}
                    role="dialog"
                    aria-modal="false"
                    aria-label={promptOnly ? 'Prompt details' : 'Reply to this profile'}
                    ref={cardRef}
                    tabIndex={-1}
                    onPointerDown={handleDragStart}
                    onClickCapture={(e) => {
                      if (!suppressClickRef.current) return;
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      willChange: 'transform',
                      ...(photoOnly ? {
                        '--po-photo-width': `${photoWidth + 4}px`,
                        '--po-photo-height': `${photoHeight + 4}px`,
                      } : {}),
                    }}
                  >
                  {/* center — the item, ZOOMED to reading size */}
                  <motion.div
                    className="po-center"
                    onClick={promptOnly ? undefined : () => setIsCardExpanded((v) => !v)}
                  >
                    <div className="po-stage" ref={stageRef}>
                      {promptOnly && popSize ? (
                        <div
                          className="po-content"
                          style={{ width: promptWidth, height: promptHeight }}
                        >
                          <div style={{
                            width: popSize.w,
                            height: popSize.h,
                            transform: `scale(${promptScale})`,
                            transformOrigin: 'top left',
                          }}>
                            {children}
                          </div>
                        </div>
                      ) : zoom > 0 && popSize && (
                        <div
                          className="po-content"
                          style={{
                            width: photoOnly ? photoWidth : Math.round(popSize.w * zoom),
                            height: photoOnly ? photoHeight : Math.round(popSize.h * zoom),
                          }}
                        >
                          <div style={{
                            width: popSize.w,
                            height: photoOnly ? photoNaturalHeight : popSize.h,
                            transform: `scale(${zoom})`,
                            transformOrigin: 'top left',
                          }}>
                            {children}
                          </div>
                        </div>
                      )}
                    </div>
                    {photoOnly && (
                      <span className="pc-exhibit-heart po-photo-heart" aria-hidden="true">
                        <Heart aria-hidden="true" fill="currentColor" strokeWidth={3.2} />
                      </span>
                    )}
                  </motion.div>

                  {/* bottom — letter accordion */}
                  {promptOnly ? (
                    <motion.section
                      ref={photoPanelRef}
                      className="po-prompt-reply"
                      aria-label="Reply to this prompt"
                      style={{
                        x: photoFormX,
                        y: photoFormY,
                        scale: photoFormScale,
                        opacity: photoFormOpacity,
                      }}
                    >
                      <div className="po-photo-reply">
                        <p className="po-photo-question">Got something to say, huh?</p>
                        <textarea
                          className="po-photo-message"
                          aria-label="Write your message"
                          placeholder="Write your message..."
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          maxLength={140}
                          disabled={actionSent}
                        />
                        <p className="po-photo-message-count" aria-live="polite">
                          {noteText.length}/140
                        </p>
                        {noteText.trim() && (
                          <button
                            type="button"
                            className="po-photo-send"
                            onClick={(e) => { e.stopPropagation(); handleAlignNow(); }}
                            disabled={actionSent}
                          >
                            Send
                          </button>
                        )}
                      </div>
                    </motion.section>
                  ) : <motion.div
                    ref={photoOnly ? photoPanelRef : undefined}
                    className="po-panel-bottom"
                    style={photoOnly ? {
                      x: photoFormX,
                      y: photoFormY,
                      scale: photoFormScale,
                      opacity: photoFormOpacity,
                    } : undefined}
                  >
                    {photoOnly ? (
                      <div className="po-photo-reply">
                        <p className="po-photo-question">Got something to say, huh?</p>
                        <textarea
                          className="po-photo-message"
                          aria-label="Write your message"
                          placeholder="Write your message..."
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          maxLength={140}
                          disabled={actionSent}
                        />
                        <p className="po-photo-message-count" aria-live="polite">
                          {noteText.length}/140
                        </p>
                        {(noteText.trim() || photoStackedOnPhone) && (
                          <button
                            type="button"
                            className="po-photo-send"
                            onClick={(e) => { e.stopPropagation(); handleAlignNow(); }}
                            disabled={actionSent || (photoStackedOnPhone && !noteText.trim())}
                          >
                            Send
                          </button>
                        )}
                      </div>
                    ) : <div className={`po-accordion ${showInput ? 'input-active' : ''}`}>
                      {/* Contextual reply — targets this photo or prompt,
                          unlike the general Align action on the Deck.

                          "Add a note" sits beside it rather than behind it.
                          It used to BE this button, which meant the only way to
                          say yes was to first decide you wanted to write
                          something — friction on the gesture that needed least
                          of it. Both now sit side by side in the collapsed bar,
                          so the choice is visible instead of sequential. */}
                      <div className={`po-alignrow ${showInput ? 'hide' : ''}`}>
                        <button
                          type="button"
                          className="po-letterbtn po-alignbtn"
                          onClick={(e) => { e.stopPropagation(); triggerHaptic('heavy'); handleAlignNow(); }}
                          disabled={actionSent}
                        >
                          Reply to this
                        </button>
                        <button
                          type="button"
                          className="po-letterbtn po-notebtn"
                          onClick={(e) => { e.stopPropagation(); triggerHaptic('light'); setShowInput(true); }}
                          disabled={actionSent || showInput}
                        >
                          Add a note
                        </button>
                      </div>

                      <div className="po-inputarea">
                        <div className="po-inputhead">
                          <span className="po-kicker">Add a note (optional)</span>
                          <span className="po-count">{noteText.length} / 140</span>
                          <button
                            type="button"
                            className="po-collapse"
                            aria-label="Collapse"
                            onClick={(e) => { e.stopPropagation(); setShowInput(false); }}
                          >
                            <ChevronDown size={15} strokeWidth={2.2} />
                          </button>
                        </div>
                        <div className="po-fieldwrap">
                          <textarea
                            className="po-input"
                            placeholder="I noticed that you also..."
                            ref={noteRef}
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            maxLength={140}
                          />
                          <div className="po-bar" aria-hidden="true">
                            <div className="po-barfill" style={{ width: `${completionPercentage}%` }} />
                          </div>
                        </div>
                        {/* Same contextual reply as the collapsed button,
                            optionally carrying the note. Deliberately NOT disabled when empty: an
                            align with no note is a complete, valid action, and
                            requiring text here would put the fast path and the
                            thoughtful path behind different thresholds for no
                            reason. */}
                        <button
                          type="button"
                          className={`po-send ${noteText.trim() ? 'ready' : ''}`}
                          onClick={handleAlignNow}
                          disabled={actionSent}
                        >
                          Send reply
                        </button>
                      </div>
                    </div>}
                  </motion.div>}
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default PopoutItem;
