import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, animate, useReducedMotion } from 'framer-motion';
import { X, Undo2, Compass } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { DECK_TOP, DECK_EDGE } from '../utils/deckChrome';
import { useToastPresence } from '../utils/toast';
import neu from '../styles/neu';

/* The shared neo-brutalist canon (src/styles/neu.js) */
const C = neu;

const UNDO_MS = 5000;
const RING_R = 19.25;
const RING_CIRC = 2 * Math.PI * RING_R;

/* A single soft, quick glide keeps the Undo reveal and Compass shift in sync. */
const ACTION_STACK_TRANSITION = { duration: 0.32, ease: [0.22, 1, 0.36, 1] };

const DECK_ACTIONS_CSS = `
  .da-float {
    --card: ${C.card};
    --ink: ${C.ink};
    --yellow: ${C.yellow};
    --bw: 2px;

    /* absolute: anchors to the deck column on mobile AND desktop */
    position: absolute; top: ${DECK_TOP}; left: ${DECK_EDGE}; z-index: 500;
    display: flex; flex-direction: column; align-items: center; gap: 10px;
    pointer-events: none;
  }
  /* the pass button — bigger, red */
  .da-floatbtn { pointer-events: auto; position: relative; width: 46px; height: 46px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center; cursor: pointer;
    border: var(--bw) solid var(--ink); border-radius: 14px;
    background: ${C.red}; color: #fff;
    box-shadow: 4px 4px 0 var(--ink);
    transition: transform .08s steps(2), box-shadow .08s steps(2);
    -webkit-tap-highlight-color: transparent; }
  .da-float > .da-floatbtn:not(.undo) { z-index: 2; }
  .da-floatbtn:active { transform: translate(4px, 4px); box-shadow: 0 0 0 var(--ink); }
  .da-floatbtn.undo { position: absolute; top: 0; left: 0; z-index: 1;
    border-radius: 999px; background: var(--yellow); }
  .da-floatbtn.undo svg { color: var(--ink); }
  /* Location refresh — deliberately quieter than pass (red) and undo (yellow).
     It is a maintenance control, not a decision about a person, so it gets a
     plain card colour rather than borrowing the visual weight of the two actions
     a user makes about someone. */
  .da-refreshloc { pointer-events: auto; width: 40px; height: 40px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center; cursor: pointer;
    border: var(--bw) solid var(--ink); border-radius: 12px;
    background: ${C.card}; color: var(--ink-2);
    box-shadow: 3px 3px 0 var(--ink);
    transition: transform .08s steps(2), box-shadow .08s steps(2);
    -webkit-tap-highlight-color: transparent; }
  .da-refreshloc:active { transform: translate(3px, 3px); box-shadow: 0 0 0 var(--ink); }
  .da-refreshloc:focus-visible { outline: 3px solid ${C.yellow}; outline-offset: 2px; }
  .da-floatbtn:focus-visible { outline: 3px solid ${C.yellow}; outline-offset: 2px; }

  /* ✨ GLOBAL ALIGN BAR — BELOW the card, never over it.

     It was tempting to slot this into .da-float alongside Pass, because that
     column already exists and is already floating. It is the wrong place: that
     column is anchored INSIDE the deck edge and sits on top of the card, so an
     Align there would overlap the per-photo Align buttons the card already
     carries. Two Align buttons on screen at once, both yellow, both meaning the
     same thing, on the same card — that is worse than having only the specific
     one.

     So this is its own bar under the card. One global Align, physically
     separate from the photo-level ones. */
  .da-alignbar { position: absolute; left: 0; right: 0; bottom: 0;
    display: flex; justify-content: center; padding: 0 12px 10px;
    pointer-events: none; }
  .da-alignbtn { pointer-events: auto; width: 100%; max-width: 460px;
    height: 50px; border: var(--bw) solid var(--ink); border-radius: 14px;
    background: ${C.yellow}; color: var(--ink);
    font-family: var(--font-body); font-size: 14px; font-weight: 700;
    letter-spacing: .1em; text-transform: uppercase;
    box-shadow: 4px 4px 0 var(--ink); cursor: pointer;
    transition: transform .1s ease-out, box-shadow .1s ease-out, opacity .2s;
    -webkit-tap-highlight-color: transparent; }
  .da-alignbtn:active:not(:disabled) { transform: translate(4px, 4px); box-shadow: 0 0 0 var(--ink); }
  .da-alignbtn:disabled { opacity: .4; cursor: default; transform: none; box-shadow: 4px 4px 0 var(--ink); }
  .da-alignbtn:focus-visible { outline: 3px solid var(--yellow); outline-offset: 3px; }

  /* the timer line — rides exactly on the undo button's boundary */
  .da-ring { position: absolute; inset: 0; width: 100%; height: 100%;
    transform: rotate(-90deg); pointer-events: none; }
  .da-ring circle { fill: none; stroke: var(--ink); stroke-width: 3.5; stroke-linecap: round; }

  @media (hover: hover) and (pointer: fine) {
    .da-floatbtn:hover { filter: brightness(1.06); }
    .da-floatbtn:active { filter: none; }
  }
  @media (prefers-reduced-motion: reduce) {
    .da-floatbtn { transition: none; }
  }
`;

const DeckActions = ({
  onPass, onAlign, showAlignButton = true, canAlign = true,
  onUndo, canGoBack, undoNonce, onRefreshLocation,
}) => {
  const [showUndo, setShowUndo] = useState(false);
  const ringMV = useMotionValue(0);
  const reduceMotion = useReducedMotion();
  const toastUp = useToastPresence();

  /* Arm the undo window only when the deck says "a pass just happened". */
  useEffect(() => {
    if (!undoNonce || !canGoBack) return;
    setShowUndo(true);
    ringMV.set(0);
    const controls = reduceMotion
      ? null
      : animate(ringMV, RING_CIRC, { duration: UNDO_MS / 1000, ease: 'linear', onComplete: () => setShowUndo(false) });
    const t = setTimeout(() => setShowUndo(false), UNDO_MS + 60);
    return () => { controls?.stop(); clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [undoNonce, canGoBack]);

  const handlePass = useCallback((e) => {
    e.stopPropagation();
    onPass?.();
  }, [onPass]);

  /* Undo: go back one profile, then dismiss IMMEDIATELY — the button exits
     with the reverse of its entrance spring (not the 5s timeout fade). */
  const handleUndo = useCallback((e) => {
    e.stopPropagation();
    triggerHaptic('light');
    setShowUndo(false);   // ← reverse transition plays right now
    onUndo?.();
  }, [onUndo]);

  return (
    <>
      <style>{DECK_ACTIONS_CSS}</style>
      <motion.div
        className="da-float"
        animate={{ y: toastUp ? 80 : 0 }}
        transition={reduceMotion ? { duration: 0 } : ACTION_STACK_TRANSITION}
        style={{ position: 'fixed', top: DECK_TOP, left: DECK_EDGE, zIndex: 500, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, pointerEvents: 'none' }}
      >
        <button
          type="button"
          className="da-floatbtn"
          aria-label="Pass this profile"
          title="Pass"
          onClick={handlePass}
        >
          <X size={22} strokeWidth={3.2} />
        </button>

        <AnimatePresence>
          {showUndo && canGoBack && (
            <motion.button
              key="undo"
              type="button"
              className="da-floatbtn undo"
              aria-label="Go to previous profile — available for 5 seconds"
              title="Previous profile (5s)"
              initial={reduceMotion ? false : { y: 0 }}
              animate={{ y: 56 }}
              exit={reduceMotion ? undefined : { y: 0 }}
              transition={reduceMotion ? { duration: 0 } : ACTION_STACK_TRANSITION}
              onClick={handleUndo}
            >
              <Undo2 size={19} strokeWidth={2.8} />
              <svg className="da-ring" viewBox="0 0 42 42" aria-hidden="true">
                <motion.circle
                  cx="21" cy="21" r={RING_R}
                  strokeDasharray={RING_CIRC}
                  style={{ strokeDashoffset: ringMV }}
                />
              </svg>
            </motion.button>
          )}
        </AnimatePresence>

        {/* 📍 REFRESH LOCATION — a convenience, not the mechanism.
         *
         * Location is re-read automatically every time the app opens (see
         * utils/locationSync.js), so this button is strictly optional: someone who
         * opened the app in one place and then travelled would get a corrected
         * deck on their next open regardless.
         *
         * It is here for the case the automatic check cannot cover — the app has
         * been open the whole time, so no app-open has happened. Long-press style
         * "I moved" affordances are absent from most dating apps, but this one is
         * small, unlabelled in the primary action row, and does nothing at all
         * when the position has not changed.
         *
         * Deliberately NOT the "New deck" button that was rejected earlier. That
         * one re-rolled the deck and would hand back the same exhausted pool. This
         * one re-reads a position; if the position is the same, the server reports
         * `moved: false` and nothing is rebuilt. */}
        {onRefreshLocation && (
          <motion.button
            type="button"
            className="da-refreshloc"
            aria-label="Update my location"
            title="Update my location"
            animate={{ y: showUndo && canGoBack ? 56 : 0 }}
            transition={reduceMotion ? { duration: 0 } : ACTION_STACK_TRANSITION}
            onClick={onRefreshLocation}
          >
            <Compass size={19} strokeWidth={2.6} />
          </motion.button>
        )}
      </motion.div>

      {/* ✨ GLOBAL ALIGN — profile-level, no photo or prompt attached. */}
      {onAlign && showAlignButton && (
        <div className="da-alignbar">
          <button
            type="button"
            className="da-alignbtn"
            onClick={onAlign}
            disabled={!canAlign}
            aria-label="Align with this profile"
          >
            Align
          </button>
        </div>
      )}
    </>
  );
};

export default DeckActions;