import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell } from 'lucide-react';
import { subscribeToPush, registerServiceWorker } from '../utils/push';
import { triggerHaptic } from '../utils/haptics';
import neu from '../styles/neu';

const PREF_KEY = 'matchalize:pushState';

/* The shared neo-brutalist canon (src/styles/neu.js) */
const t = neu;

const PUSH_CSS = `
  .pp-slam { transition: transform .08s steps(2), box-shadow .08s steps(2), background .08s steps(2);
    -webkit-tap-highlight-color: transparent; }
  .pp-slam:active { transform: translate(3px, 3px) !important; box-shadow: 0 0 0 #191919 !important; }
  .pp-slam:focus-visible { outline: 3px solid #FFD43D; outline-offset: 2px; }
  @media (hover: hover) and (pointer: fine) {
    .pp-slam:hover:not(:active) { transform: translate(-1px, -1px); box-shadow: 4px 4px 0 #191919; }
  }
  @media (prefers-reduced-motion: reduce) {
    .pp-slam { transition: none; }
  }
`;

const PushPrompt = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      // Skip where push simply cannot work (no SW / no Push API / iOS Safari pre-16.4)
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return;

      const saved = localStorage.getItem(PREF_KEY);
      if (saved === 'subscribed' || saved === 'dismissed') return;

      try {
        const reg = await registerServiceWorker();
        if (!reg || cancelled) return;

        // Non-triggering check — we never auto-subscribe here (no user gesture).
        const existing = await reg.pushManager.getSubscription();
        if (cancelled) return;

        if (existing) {
          localStorage.setItem(PREF_KEY, 'subscribed');
          return;
        }
        if (Notification.permission === 'denied') {
          localStorage.setItem(PREF_KEY, 'dismissed');
          return;
        }
        setVisible(true);
      } catch {
        // No-op — fail silently, never nag on errors
      }
    };

    init();
    return () => { cancelled = true; };
  }, []);

  const handleEnable = async () => {
    triggerHaptic('light');
    const sub = await subscribeToPush(); // runs inside this click = real user gesture
    localStorage.setItem(PREF_KEY, sub ? 'subscribed' : 'dismissed');
    setVisible(false);
  };

  const handleDismiss = () => {
    triggerHaptic('light');
    localStorage.setItem(PREF_KEY, 'dismissed');
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.97 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          style={{
            position: 'fixed',
            right: 14,
            bottom: 'calc(84px + env(safe-area-inset-bottom))',
            left: 14,
            maxWidth: 360,
            margin: '0 auto',
            zIndex: 1200,
            backgroundColor: t.paper,
            border: `2px solid ${t.ink}`,
            borderRadius: 18,
            boxShadow: `6px 6px 0 ${t.ink}`,
            padding: '14px 16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* bell in a candy tile — the vitals-tile language */}
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 13,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: t.yellow,
                border: `2px solid ${t.ink}`,
                boxShadow: `3px 3px 0 ${t.ink}`,
                flexShrink: 0,
              }}
            >
              <Bell size={20} color={t.ink} strokeWidth={2.4} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: t.fontHeavy, fontSize: 14, fontWeight: 400, color: t.ink, lineHeight: 1.25, textTransform: 'uppercase', letterSpacing: '-.005em' }}>
                Enable notifications?
              </div>
              <div style={{ fontFamily: t.fontBody, fontSize: 12, fontWeight: 500, color: t.ink2, marginTop: 4, lineHeight: 1.45 }}>
                Get alerted the moment a letter or telegram lands in your Letterbox.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button
              className="pp-slam"
              onClick={handleEnable}
              style={{
                flex: 1,
                padding: '12px 14px',
                border: `2px solid ${t.ink}`,
                borderRadius: 11,
                backgroundColor: t.yellow,
                color: t.ink,
                fontFamily: t.fontMono,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '.1em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                boxShadow: `3px 3px 0 ${t.ink}`,
              }}
            >
              Enable
            </button>
            <button
              className="pp-slam"
              onClick={handleDismiss}
              style={{
                padding: '12px 16px',
                border: `2px solid ${t.ink}`,
                borderRadius: 11,
                backgroundColor: t.card,
                color: t.ink2,
                fontFamily: t.fontMono,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '.1em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              Not now
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PushPrompt;