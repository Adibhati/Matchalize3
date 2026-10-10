import React, { useState } from 'react';
import neu from '../styles/neu';
import { motion, AnimatePresence } from 'framer-motion';
import { Shuffle, Video, ShieldCheck } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { toast } from '../utils/toast';
import { DECK_CONTENT_TOP } from '../utils/deckChrome';

/* The shared neo-brutalist canon (src/styles/neu.js) */
const t = neu;

const ROULETTE_CSS = `
  .rt-slam { display: inline-flex; align-items: center; justify-content: center; gap: 10px;
    width: 100%; padding: 16px 20px; border: 2px solid #191919; border-radius: 14px;
    background: #FFD43D; color: #191919; cursor: pointer;
    font-family: ${t.fontMono}; font-size: 13px; font-weight: 700; letter-spacing: .12em;
    text-transform: uppercase; box-shadow: 5px 5px 0 #191919;
    transition: transform .08s steps(2), box-shadow .08s steps(2), background .08s steps(2);
    -webkit-tap-highlight-color: transparent; }
  .rt-slam:active { transform: translate(5px, 5px); box-shadow: 0 0 0 #191919; }
  .rt-slam:disabled { opacity: .6; cursor: default; transform: none !important; box-shadow: 5px 5px 0 #191919 !important; }

  .rt-slam:focus-visible, .rt-rail:focus-visible {
    outline: 3px solid #FFD43D; outline-offset: 2px; }

  @media (hover: hover) and (pointer: fine) {
    .rt-slam:hover:not(:active):not(:disabled) { transform: translate(-1px, -1px); box-shadow: 6px 6px 0 #191919; }
  }
  @media (prefers-reduced-motion: reduce) {
    .rt-slam { transition: none; }
  }
`;

const Roulette = () => {
  const [starting, setStarting] = useState(false);

  const handleStart = () => {
    triggerHaptic('heavy');
    setStarting(true);
    toast.info('Roulette is coming soon.');
    setTimeout(() => setStarting(false), 400);
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', backgroundColor: t.desk, position: 'relative', paddingTop: DECK_CONTENT_TOP }}>
      <style>{ROULETTE_CSS}</style>

      <div style={{ position: 'relative', minHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 20px 48px', gap: 26 }}>
        {/* Emblem — candy tile, same DNA as the vitals tiles */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0, rotate: -6 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 14, stiffness: 260 }}
          style={{
            width: 92, height: 92, borderRadius: 24,
            backgroundColor: t.yellow,
            border: `2px solid ${t.ink}`,
            boxShadow: `5px 5px 0 ${t.ink}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Shuffle size={40} strokeWidth={2.6} color={t.ink} />
        </motion.div>

        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h2 style={{ fontFamily: t.fontHeavy, fontSize: 27, fontWeight: 400, color: t.paper, margin: 0, letterSpacing: '-.01em', lineHeight: 1.1, textTransform: 'uppercase' }}>
            Campus Roulette
          </h2>
          <p style={{ fontFamily: t.fontMono, fontSize: 10.5, fontWeight: 700, color: t.ink3, margin: 0, letterSpacing: '.14em', textTransform: 'uppercase' }}>
            Live serendipity · same campus + all campuses
          </p>
        </div>

        {/* Start control */}
        <div style={{ width: 'min(420px, 100%)', display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
          <button className="rt-slam" onClick={handleStart} disabled={starting}>
            <Video size={18} strokeWidth={2.8} />
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={starting ? 'starting' : 'start'}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
              >
                {starting ? 'Preparing…' : 'Start a live session'}
              </motion.span>
            </AnimatePresence>
          </button>

          <p style={{ fontFamily: t.fontBody, fontSize: 13.5, fontWeight: 500, color: t.ink3, margin: 0, textAlign: 'center', lineHeight: 1.6 }}>
            Step in face-to-face. A mutual yes plants{' '}
            <span style={{ fontWeight: 700, color: t.paper }}>a seed of interest</span> that flows
            straight into your Matches.
          </p>
        </div>

        {/* Reassurance rails — chunky cream cards with candy icon tiles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 'min(420px, 100%)' }}>
          {[
            { Icon: ShieldCheck, bg: t.green, text: 'Only verified college students from the Indian college network enter — same campus or any other campus, no strangers outside the ledger.' },
            { Icon: Shuffle, bg: t.coral, text: 'Each session is anonymous until you choose to reveal yourself.' },
          ].map(({ Icon, bg, text }, idx) => (
            <div key={idx} className="rt-rail" style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              backgroundColor: t.paper, border: `2px solid ${t.ink}`, borderRadius: 14,
              boxShadow: `4px 4px 0 ${t.ink}`, padding: '13px 14px',
            }}>
              <span style={{
                width: 30, height: 30, flexShrink: 0, borderRadius: 9,
                border: `2px solid ${t.ink}`, background: bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.ink,
              }}>
                <Icon size={15} strokeWidth={2.4} />
              </span>
              <p style={{ fontFamily: t.fontBody, fontSize: 12.5, fontWeight: 600, color: t.ink2, margin: 0, lineHeight: 1.55 }}>{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Roulette;