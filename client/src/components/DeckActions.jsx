import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, animate, useReducedMotion } from 'framer-motion';
import { Heart, Undo2 } from 'lucide-react';
import DeckPassButton from './DeckPassButton';
import { triggerHaptic } from '../utils/haptics';
import { DECK_TOP, DECK_EDGE } from '../utils/deckChrome';
import { useToastHeight, useToastPresence } from '../utils/toast';
import neu from '../styles/neu';

/* The shared neo-brutalist canon (src/styles/neu.js) */
const C = neu;

const UNDO_MS = 5000;
const RING_R = 19.25;
const RING_CIRC = 2 * Math.PI * RING_R;

const ACTION_STACK_TRANSITION = { duration: 0.32, ease: [0.22, 1, 0.36, 1] };
const UNDO_APPEAR_TRANSITION = { duration: 0.2, ease: 'easeOut' };

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
  .da-float > .da-floatbtn:not(.undo) { z-index: 2; }
  .da-floatbtn.undo { position: relative; top: auto; left: auto; z-index: 1;
    border-radius: 999px; background: var(--yellow); }
  .da-floatbtn.undo svg { color: var(--ink); }
  .da-float--desktop {
    display: none !important;
  }
  .da-float--desktop .da-floatbtn,
  .da-float--desktop .da-desktop-align {
    width: 56px;
    height: 56px;
    border-radius: 16px;
  }
  .da-float--desktop .da-floatbtn.undo {
    position: relative;
    top: auto;
    left: auto;
    z-index: 1;
    border-radius: 16px;
  }
  .da-float--desktop .da-desktop-align {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    max-width: none;
    border-radius: 16px;
    border: 2px solid ${C.ink};
    background: #5BD98A;
    color: #fff;
    box-shadow: 4px 4px 0 ${C.ink};
  }
  .da-desktop-align svg {
    width: 22px;
    height: 22px;
    color: #fff;
  }
  @media (min-width: 601px) {
    .da-float--desktop { display: flex !important; }
  }
  .da-alignbtn { pointer-events: auto; display: flex; align-items: center;
    justify-content: center; width: 46px; height: 46px; flex-shrink: 0; padding: 0;
    border: 2px solid ${C.ink}; border-radius: 14px;
    background: #5BD98A; color: #fff; box-shadow: 4px 4px 0 ${C.ink};
    cursor: pointer; transition: transform .08s steps(2), box-shadow .08s steps(2), opacity .2s;
    -webkit-tap-highlight-color: transparent; }
  .da-alignbtn svg { width: 22px; height: 22px; color: #fff; }
  .da-alignbtn:active:not(:disabled) { transform: translate(4px, 4px); box-shadow: 0 0 0 ${C.ink}; }
  .da-alignbtn:disabled { opacity: .4; cursor: default; }
  .da-alignbtn:focus-visible { outline: 3px solid var(--yellow); outline-offset: 3px; }
  .da-floatbtn:disabled { opacity: .4; cursor: default; }

  /* the timer line — rides exactly on the undo button's boundary */
  .da-ring { position: absolute; inset: 0; width: 100%; height: 100%;
    transform: rotate(-90deg); pointer-events: none; }
  .da-ring circle { fill: none; stroke: var(--ink); stroke-width: 3.5; stroke-linecap: round; }

`;

const DeckActions = ({
  onPass, onAlign, showAlignButton = true, canAlign = true,
  onUndo, canGoBack, undoNonce, undoAvailable = true,
  actionsDisabled = false, showPassButton = true, placement = 'mobile',
}) => {
  const isDesktopPlacement = placement === 'desktop';
  const [showUndo, setShowUndo] = useState(false);
  const ringMV = useMotionValue(0);
  const reduceMotion = useReducedMotion();
  const toastUp = useToastPresence();
  const toastHeight = useToastHeight();
  const toastOffset = toastHeight > 0 ? toastHeight + 16 : (toastUp ? 80 : 0);

  /* Arm the undo window only when the deck says "a pass just happened". */
  useEffect(() => {
    if (!undoNonce || !canGoBack || !undoAvailable) {
      setShowUndo(false);
      return undefined;
    }
    setShowUndo(true);
    ringMV.set(0);
    const controls = reduceMotion
      ? null
      : animate(ringMV, RING_CIRC, { duration: UNDO_MS / 1000, ease: 'linear', onComplete: () => setShowUndo(false) });
    const t = setTimeout(() => setShowUndo(false), UNDO_MS + 60);
    return () => { controls?.stop(); clearTimeout(t); };
  }, [undoNonce, canGoBack, undoAvailable, reduceMotion, ringMV]);

  /* Undo the last pass, then dismiss its recovery affordance immediately. */
  const handleUndo = useCallback((e) => {
    e.stopPropagation();
    if (actionsDisabled) return;
    triggerHaptic('light');
    Promise.resolve(onUndo?.()).then((didUndo) => {
      if (didUndo !== false) setShowUndo(false);
    });
  }, [actionsDisabled, onUndo]);

  return (
    <>
      <style>{DECK_ACTIONS_CSS}</style>
      <motion.div
        className={`da-float${isDesktopPlacement ? ' da-float--desktop' : ''}`}
        animate={{ y: isDesktopPlacement ? 0 : toastOffset }}
        transition={reduceMotion ? { duration: 0 } : ACTION_STACK_TRANSITION}
        style={isDesktopPlacement
          ? {
            position: 'absolute',
            top: 38,
            left: 0,
            zIndex: 5,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            pointerEvents: 'none',
          }
          : {
            position: 'fixed',
            top: DECK_TOP,
            left: DECK_EDGE,
            zIndex: 500,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            pointerEvents: 'none',
          }}
      >
        {showPassButton && <DeckPassButton onClick={onPass} disabled={actionsDisabled} />}

        <AnimatePresence initial={false}>
          {showUndo && canGoBack && !isDesktopPlacement && (
            <motion.button
              key="mobile-undo"
              type="button"
              className="da-floatbtn undo"
              aria-label="Go to previous profile — available for 5 seconds"
              title="Undo"
              disabled={actionsDisabled}
              initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, scale: 0.9 }}
              transition={reduceMotion ? { duration: 0 } : UNDO_APPEAR_TRANSITION}
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

        {!isDesktopPlacement && onAlign && showAlignButton && (
          <motion.button
            type="button"
            className="da-alignbtn"
            layout
            transition={{
              layout: reduceMotion
                ? { duration: 0 }
                : { type: 'spring', stiffness: 520, damping: 34 },
            }}
            onClick={onAlign}
            disabled={!canAlign || actionsDisabled}
            aria-label="Like this profile"
            title="Like"
          >
            <Heart aria-hidden="true" fill="currentColor" strokeWidth={3.2} />
          </motion.button>
        )}

        <AnimatePresence>
          {showUndo && canGoBack && isDesktopPlacement && (
            <motion.button
              key="undo"
              type="button"
              className="da-floatbtn undo"
              aria-label="Go to previous profile — available for 5 seconds"
              title="Undo"
              disabled={actionsDisabled}
              initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduceMotion
                ? undefined
                : { opacity: 0, scale: 0.9 }}
              transition={reduceMotion ? { duration: 0 } : UNDO_APPEAR_TRANSITION}
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
        {isDesktopPlacement && onAlign && showAlignButton && (
          <button
            type="button"
            className="da-alignbtn da-desktop-align"
            onClick={onAlign}
            disabled={!canAlign || actionsDisabled}
            aria-label="Like this profile"
            title="Like"
          >
            <Heart aria-hidden="true" fill="currentColor" strokeWidth={3.2} />
          </button>
        )}
      </motion.div>

    </>
  );
};

export default DeckActions;