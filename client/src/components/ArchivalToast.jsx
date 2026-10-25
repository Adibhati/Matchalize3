import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { setToastHandler, clearToastPresence, setRenderedToastHeight } from '../utils/toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, AlertCircle, CheckCircle2, Info, WifiOff, Server,
  MessageSquareOff, Ban, ShieldAlert,
} from 'lucide-react';
import neu from '../styles/neu';

/* How long a toast stays up.
   A toast WITH an action gets longer: the user has to read the message AND
   decide whether to tap, and the old code gave those toasts no timer at all —
   the gate toast's "Profile" button left it on screen forever. */
const MS_PLAIN = 4000;
const MS_WITH_ACTION = 7000;

/* The shared neo-brutalist canon (src/styles/neu.js) */
const t = neu;

const ArchivalToast = () => {
  const [toast, setToast] = useState(null);
  const toastRef = useRef(null);
  /* A REF, not state. The timer used to be state, which put it in the deps of
     the effect that owns it — so arming a timer re-ran the effect, whose cleanup
     cleared that very timer. The dismiss-after-4s only appeared to work because
     the cleanup closed over the stale `null`; any second toast cancelled the
     first, and action toasts were never given a timer at all. */
  const timerRef = useRef(null);

  const dismiss = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    setToast(null);
    clearToastPresence();
  }, []);

  useEffect(() => {
    setToastHandler((newToast) => {
      // One toast at a time: a new one replaces the old, so arm a fresh timer
      // rather than letting the previous one's deadline cut it short.
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
      setToast(newToast);
      const ms = newToast.opts?.ms ?? (newToast.action ? MS_WITH_ACTION : MS_PLAIN);
      timerRef.current = setTimeout(dismiss, ms);
    });
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
      setToastHandler(null);
      // Deliberately does NOT touch setToastPresenceHandler: this component only
      // EMITS presence (via toast.js on show, clearToastPresence() on dismiss).
      // The handler belongs to AppShell. Registering a placeholder here clobbered
      // the real subscription, because this component mounts after AppShell and
      // the header stopped sliding the moment the first toast fired.
      clearToastPresence();
    };
  }, [dismiss]);

  useLayoutEffect(() => {
    if (!toast || !toastRef.current) return undefined;

    const measure = () => {
      const height = toastRef.current?.getBoundingClientRect().height || 0;
      setRenderedToastHeight(height);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(toastRef.current);
    return () => observer.disconnect();
  }, [toast]);

  /* ONE map for everything. Tile colour always comes from `type` (red = error,
     green = success, yellow = info); the glyph comes from an optional
     `opts.icon` name, falling back to the type default. The glyph sits on a
     saturated tile, so it is drawn paper-white — which is what makes it visible;
     the old code drew a red glyph on the red tile and a green glyph on the green
     tile, i.e. nothing at all. The pale yellow info tile is the exception: there
     the glyph must be ink to read. */
  const TILE_BG = { success: t.green, error: t.red, info: t.yellow };
  const TYPE_GLYPH = { success: 'CheckCircle2', error: 'AlertCircle', info: 'Info' };
  const GLYPHS = {
    CheckCircle2, AlertCircle, Info, WifiOff, Server,
    MessageSquareOff, Ban, ShieldAlert,
  };

  const type = toast?.type;
  const tile = TILE_BG[type] || t.yellow;
  const Glyph = GLYPHS[toast?.opts?.icon] || GLYPHS[TYPE_GLYPH[type]] || AlertCircle;
  const glyphColor = tile === t.yellow ? t.ink : t.card;

  // AnimatePresence must stay mounted while `toast` is null — otherwise it is
  // unmounted along with the toast and the `exit` prop never plays. The toast
  // is therefore the conditional CHILD, not the parent.
  return (
    <AnimatePresence>
      {toast && (
      <>
      <style>{`
        .archival-toast {
          left: max(16px, env(safe-area-inset-left));
          right: max(16px, env(safe-area-inset-right));
          width: auto;
          max-width: 420px;
          margin-inline: auto;
          pointer-events: none;
        }

        .archival-toast > * {
          max-width: 100%;
          overflow-wrap: anywhere;
          pointer-events: auto;
        }

        @media (min-width: 600px) {
          .archival-toast {
            left: auto;
            right: max(24px, env(safe-area-inset-right));
            width: min(420px, calc(100vw - 48px));
            margin-inline: 0;
          }
        }
      `}</style>
      <motion.div
        ref={toastRef}
        className="archival-toast"
        role={type === 'error' ? 'alert' : 'status'}
        aria-live={type === 'error' ? 'assertive' : 'polite'}
        aria-atomic="true"
        initial={{ y: -100, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -100, opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        style={{
          position: 'fixed',
          top: 'max(16px, env(safe-area-inset-top))',
          zIndex: 100000,
          backgroundColor: t.paper,
          border: `2px solid ${t.ink}`,
          borderRadius: 14,
          boxShadow: `5px 5px 0 ${t.ink}`,
          padding: '14px 14px 14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        {/* type tile — candy square, same as vitals/badge language */}
        <div style={{
          width: 34, height: 34, flexShrink: 0, borderRadius: 10,
          background: tile,
          border: `2px solid ${t.ink}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Glyph size={20} color={glyphColor} strokeWidth={2.4} />
        </div>
        <p style={{
          margin: 0, fontFamily: t.fontBody, fontSize: 13.5, fontWeight: 600,
          color: t.ink, lineHeight: 1.45, flex: 1,
        }}>
          {toast.message}
        </p>
        {/* Action and dismiss sit SIDE BY SIDE. The × used to be an either/or
            branch — a toast with an action got no × at all, so the only way to
            clear one was to tap the action, which for the gate toast meant
            navigating away from the deck you were trying to read. Dismissing
            must never cost you the screen you're on. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {toast.action && (
            <button
              className="toast-slam"
              onClick={() => { toast.action.onClick(); dismiss(); }}
              style={{
                padding: '9px 14px',
                backgroundColor: t.yellow,
                color: t.ink,
                border: `2px solid ${t.ink}`,
                borderRadius: 10,
                boxShadow: `3px 3px 0 ${t.ink}`,
                fontFamily: t.fontMono,
                fontSize: 10,
                fontWeight: 700,
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '.1em',
                flexShrink: 0,
              }}
            >
              {toast.action.label}
            </button>
          )}
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            style={{
              background: t.card, border: `1.5px solid ${t.ink}`, borderRadius: 8,
              cursor: 'pointer', padding: 5, color: t.ink2, display: 'flex',
              alignItems: 'center', flexShrink: 0, boxShadow: `2px 2px 0 ${t.ink}`,
            }}
          >
            <X size={14} strokeWidth={2.6} />
          </button>
        </div>
      </motion.div>
      </>
      )}
    </AnimatePresence>
  );
};

export default ArchivalToast;