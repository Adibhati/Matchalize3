// client/src/components/PopoutItem.jsx
import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useMotionValue, useTransform, animate, useReducedMotion } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';
import { useIsDesktop } from '../utils/useIsDesktop';
import { ChevronDown } from 'lucide-react';
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
const SEAL_MS = 200;        // how long the wax seal shows before the action fires

/* ── shared styles — injected ONCE per page (id-guarded), not once per card ── */
const POP_CSS = `
  .po-overlay { position: fixed; inset: 0; z-index: 9998; background: rgba(25,23,20,0.55);
    backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }

  /* scroll-safe centering: margin:auto on the child centers when it fits,
     and lets the card SCROLL when the zoomed content is taller than the screen */
  .po-scroll { position: absolute; inset: 0; overflow-y: auto; -webkit-overflow-scrolling: touch;
    display: flex; padding: 24px 16px; }
  .po-scroll::-webkit-scrollbar { display: none; }

  .po-card { margin: auto; position: relative; width: 100%; max-width: 340px; border-radius: 22px; overflow: hidden;
    background: ${C.paper}; border: 2px solid ${C.ink}; box-shadow: 10px 10px 0 ${C.ink}; will-change: transform; }
  .po-card:focus, .po-card:focus-visible { outline: none; }
  .po-card button { -webkit-tap-highlight-color: transparent; }

  .po-btn { width: 100%; height: 50px; border: 2px solid ${C.ink}; border-radius: 14px; background: ${C.card};
    color: ${C.ink}; font-family: ${F.mono}; font-size: 12.5px; font-weight: 700; letter-spacing: .12em;
    text-transform: uppercase; cursor: pointer; box-shadow: 4px 4px 0 ${C.ink};
    transition: transform .1s ease-out, box-shadow .1s ease-out; }
  .po-btn:active { transform: translate(4px, 4px); box-shadow: 0 0 0 ${C.ink}; }

  /* ═══ THE ZOOM STAGE — the popped item rendered at full modal width ═══ */
  .po-center { padding: 12px; cursor: pointer; }
  .po-stage { width: 100%; display: flex; justify-content: center; }
  .po-content { transition: transform .4s cubic-bezier(.22,1,.36,1); transform-origin: center; }
  .po-sandwich.expanded .po-content { transform: scale(1.02); }
  .po-content .pc-hold { display: none !important; }
  .po-content div[style*="pointer-events: none"] { display: none !important; }
  .po-content img { pointer-events: none; }

  /* ═══ letter accordion ═══ */
  .po-panel-bottom { border-top: 2px solid ${C.ink}; }
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
    display: flex; flex-direction: column; gap: 12px; opacity: 0; pointer-events: none; visibility: hidden;
    transition: opacity .3s ease, visibility 0s linear .3s; }
  .po-accordion.input-active .po-inputarea { opacity: 1; pointer-events: auto; visibility: visible;
    transition: opacity .3s ease .12s, visibility 0s; }

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

  /* ═══ the seal ═══ */
  .po-seal { position: relative; width: 100%; height: 100%; border-radius: 50%; background: ${C.yellow};
    border: 3px solid ${C.ink}; display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 3px; color: ${C.ink}; box-shadow: 5px 5px 0 ${C.ink}; }
  .po-seal-ring { position: absolute; inset: 5px; border-radius: 50%; border: 2px dashed rgba(25,25,25,0.35); }
  .po-seal-label { font-family: ${F.mono}; font-size: 7.5px; font-weight: 700;
    letter-spacing: .18em; color: ${C.ink}; }

  .po-btn:focus-visible, .po-letterbtn:focus-visible, .po-send:focus-visible {
    outline: 3px solid ${C.coral}; outline-offset: 2px; }

  @media (prefers-reduced-motion: reduce) {
    .po-accordion, .po-content, .po-inputarea, .po-letterbtn { transition: none !important; }
  }
`;

let popCssInjected = false;
function injectPopCss() {
  if (popCssInjected || typeof document === 'undefined') return;
  if (document.getElementById('po-css')) { popCssInjected = true; return; }
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
export const closeAllPopouts = () => { popoutClosers.forEach((fn) => fn()); };

const PopoutItem = ({ children, targetId, onAction, type, style, isGated = false }) => {
  const isDesktop = useIsDesktop();
  const reduceMotion = useReducedMotion();

  const [isPopped, setIsPopped] = useState(false);
  const [rect, setRect] = useState(null);
  const [popSize, setPopSize] = useState(null);   // natural (unscaled) size of the item
  const [stageW, setStageW] = useState(0);        // width available in the modal
  const [noteText, setNoteText] = useState('');
  const [actionSent, setActionSent] = useState(false);
  const [showSeal, setShowSeal] = useState(false);
  const [sealKind, setSealKind] = useState('align');
  const [showInput, setShowInput] = useState(false);
  const [isCardExpanded, setIsCardExpanded] = useState(false);

  const itemRef = useRef(null);
  const stageRef = useRef(null);
  const cardRef = useRef(null);      // dialog itself — receives initial focus
  const noteRef = useRef(null);      // letter textarea — preventScroll autofocus
  const sealTimer = useRef(null);


  const updateRect = useCallback(() => {
    const el = itemRef.current;
    if (!el) return;
    setRect(el.getBoundingClientRect());
    // layout size (transform-free) — this is what we scale up in the modal
    setPopSize({ w: el.offsetWidth, h: el.offsetHeight });
  }, []);

  /* measure the modal's inner stage — and KEEP measuring across
     rotation / resize / keyboard show, so zoom never goes stale */
  useLayoutEffect(() => {
    if (!isPopped) { setStageW(0); return; }
    const el = stageRef.current;
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
  }, [isPopped, type]);

  useEffect(() => {
    if (isPopped) {
      const timer = setTimeout(() => setIsCardExpanded(true), 50);
      return () => clearTimeout(timer);
    }
    setIsCardExpanded(false);
  }, [isPopped]);

  /* ════ THE HARDENING — scroll lock + focus discipline ════
     Same disease ReportModal had, same cure: while the dialog is open the
     body is locked, on close the exact scroll position is restored, and
     every focus move happens with { preventScroll: true } so the browser
     can never auto-scroll the document out from under the deck. */
  useEffect(() => {
    if (!isPopped) return;
    const prevOverflow = document.body.style.overflow;
    const prevFocus = document.activeElement;
    const sx = window.scrollX;
    const sy = window.scrollY;
    document.body.style.overflow = 'hidden';

    const focusTimer = setTimeout(() => {
      cardRef.current?.focus({ preventScroll: true });
    }, 60);

    return () => {
      clearTimeout(focusTimer);
      document.body.style.overflow = prevOverflow;
      window.scrollTo(sx, sy);
      if (prevFocus && typeof prevFocus.focus === 'function') {
        prevFocus.focus({ preventScroll: true });
      }
    };
  }, [isPopped]);

  /* Tab stays inside the dialog while it's open */
  const trapTab = useCallback((e) => {
    if (e.key !== 'Tab') return;
    const card = cardRef.current;
    if (!card) return;
    const nodes = Array.from(
      card.querySelectorAll('button, textarea, input, a[href], [tabindex]:not([tabindex="-1"])')
    ).filter((n) => !n.disabled && n.offsetParent !== null
      && getComputedStyle(n).visibility !== 'hidden');
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }, []);

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
      if (e.pointerType === 'mouse') return;
      if (!e.isPrimary) return;
      if (press.current.timer) return;
      press.current.id = e.pointerId;
      press.current.x = e.clientX;
      press.current.y = e.clientY;
      press.current.timer = setTimeout(() => {
        press.current.timer = null;
        triggerHaptic('medium');
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
  }, []);

  const closePopout = useCallback(() => {
    triggerHaptic('light');
    setShowInput(false);
    setIsPopped(false);
    setIsCardExpanded(false);
  }, []);

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
    updateRect();
    setIsPopped(true);
  }, [isPopped, actionSent, updateRect]);

  const handleDesktopClick = (e) => {
    if (!isDesktop || isPopped) return;
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
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isPopped, closePopout]);

  /* seal timer is MANAGED now — cleared on unmount so a card leaving the
     deck mid-animation can never fire callbacks into a dead component */
  useEffect(() => () => {
    if (sealTimer.current) clearTimeout(sealTimer.current);
  }, []);

  const triggerSealAnimation = useCallback((callback) => {
    if (reduceMotion) {
      // no motion requested → skip the stamp, resolve immediately
      setIsPopped(false);
      setShowInput(false);
      setIsCardExpanded(false);
      callback?.();
      return;
    }
    setShowSeal(true);
    if (sealTimer.current) clearTimeout(sealTimer.current);
    sealTimer.current = setTimeout(() => {
      sealTimer.current = null;
      setShowSeal(false);
      setIsPopped(false);
      setShowInput(false);
      setIsCardExpanded(false);
      if (callback) callback();
    }, SEAL_MS);
  }, [reduceMotion]);

  /* ── THE GATE ──
     When the viewer is under the interaction threshold, the parent's
     handleAction will open the gate instead of sending. The seal animation must
     NOT play and `actionSent` must NOT latch in that case: the popout has to
     stay open and armed so that when the gate resolves, the replayed action
     finds the same live popout and the user never taps twice.

     The parent tells us which case we're in via `isGated`, so this component
     never has to know the threshold — one rule, decided in one place. */
  /* ✨ ALIGN — the one positive action.

     Both states of the accordion call this: the collapsed button (no note) and
     the composer's Align button (note attached). `targetId` is always carried,
     so an align is always attributable to the specific photo or prompt the user
     tapped — that attribution is what the note is written about.

     The gated path hands off WITHOUT sealing or latching, matching what the
     retired like handler did. The note is left in `noteText` untouched so the
     parent's replay after the gate resolves carries the exact words that were
     typed; silently discarding someone's message because their profile was
     short at that instant is the worst available way to fail this. */
  const handleAlignNow = () => {
    if (actionSent) return;
    const trimmed = noteText.trim();

    if (isGated) {
      triggerHaptic('medium');
      onAction('align', trimmed ? { target: targetId, note: trimmed } : { target: targetId });
      return;
    }

    setActionSent(true);
    setSealKind('align');
    triggerHaptic('heavy');
    triggerSealAnimation(() => {
      onAction('align', trimmed ? { target: targetId, note: trimmed } : { target: targetId });
      setNoteText('');
    });
  };

  /* letter textarea: focus WITHOUT the auto-scroll side effect */
  useEffect(() => {
    if (showInput) noteRef.current?.focus({ preventScroll: true });
  }, [showInput]);

  const completionPercentage = Math.min((noteText.length / 140) * 100, 100);
  const dragDismiss = (e, info) => {
    if (Math.hypot(info.offset.x, info.offset.y) > 80) closePopout();
  };

  const itemHandlers = {
    onClick: handleDesktopClick,
    onContextMenu: handleDesktopContextMenu,
    title: isDesktop ? 'Click to open' : undefined,
    style: { WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none', cursor: isDesktop ? 'pointer' : undefined },
  };

  /* uniform zoom: fit the modal stage width, capped so it never gets silly */
  const zoom = popSize && stageW > 0 ? clamp(stageW / popSize.w, SCALE_MIN, SCALE_MAX) : 0;

  /* ───────────────────── flower · telegram · letter ───────────────────── */
  return (
    <div
      ref={itemRef}
      {...itemHandlers}
      style={{ position: 'relative', width: '100%', height: '100%', ...itemHandlers.style, ...style }}
    >
      <motion.div
        animate={{ scale: isPopped ? 1.04 : 1, zIndex: isPopped ? 100 : 1 }}
        transition={{ type: 'spring', damping: 22, stiffness: 300 }}
        style={{ height: '100%', transformOrigin: 'center', borderRadius: 20, willChange: 'transform' }}
      >
        {children}
      </motion.div>

      {/* seal */}
      {showSeal && rect && createPortal(
        <motion.div
          initial={{ opacity: 0, scale: 2.2, rotate: -14 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: 'spring', damping: 14, stiffness: 220 }}
          style={{ position: 'fixed', top: rect.top + (rect.height / 2) - 38, left: rect.left + (rect.width / 2) - 38, width: 76, height: 76, zIndex: 10000, pointerEvents: 'none' }}
        >
          <motion.span
            aria-hidden="true"
            initial={{ scale: 0.8, opacity: 0.7 }}
            animate={{ scale: 1.7, opacity: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: `2px solid ${C.ink}` }}
          />
          {/* One seal, one word. The retired version branched on which of three
              actions fired; with a single action there is nothing to branch on,
              and a seal that can say TELEGRAM next to a button that no longer
              exists is worse than no seal at all. */}
          <div className="po-seal">
            <span className="po-seal-ring" aria-hidden="true" />
            <span className="po-seal-label">ALIGNED</span>
          </div>
        </motion.div>,
        document.body
      )}

      {createPortal(
        <AnimatePresence>
          {isPopped && (
            <motion.div
              key="po-sandwich-overlay"
              className="po-overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={closePopout}
            >
              <div className="po-scroll">
                <motion.div
                  className={`po-card po-sandwich ${isCardExpanded ? 'expanded' : ''}`}
                  role="dialog"
                  aria-modal="true"
                  aria-label="Align with this profile"
                  ref={cardRef}
                  tabIndex={-1}
                  onKeyDown={trapTab}
                  initial={{ scale: 0.88, opacity: 0, y: 32 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 24 }}
                  transition={{ type: 'spring', damping: 26, stiffness: 300 }}
                  drag={!showInput}
                  dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
                  dragElastic={0.7}
                  onDragEnd={dragDismiss}
                  onClick={(e) => e.stopPropagation()}
                  style={{ willChange: 'transform', touchAction: showInput ? 'auto' : 'none' }}
                >
                  {/* center — the item, ZOOMED to reading size */}
                  <div className="po-center" onClick={() => setIsCardExpanded((v) => !v)}>
                    <div className="po-stage" ref={stageRef}>
                      {zoom > 0 && popSize && (
                        <div
                          className="po-content"
                          style={{ width: Math.round(popSize.w * zoom), height: Math.round(popSize.h * zoom) }}
                        >
                          <div style={{ width: popSize.w, height: popSize.h, transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
                            {children}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* bottom — letter accordion */}
                  <div className="po-panel-bottom">
                    <div className={`po-accordion ${showInput ? 'input-active' : ''}`}>
                      {/* ✨ ALIGN — collapsed state.
                          Tapping this aligns with THIS photo or prompt and
                          dismisses. Two routes to one action, not two actions.

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
                          Align
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
                        {/* Same action as the collapsed button above, carrying
                            the note. Deliberately NOT disabled when empty: an
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
                          Align
                        </button>
                      </div>
                    </div>
                  </div>
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
