import React from 'react';
import { motion } from 'framer-motion';
import { X, Mail, Info, LifeBuoy } from 'lucide-react';
import neu from '../styles/neu';

/* The shared neo-brutalist canon (src/styles/neu.js) */
const t = neu;

/**
 * LearnMoreSheet — Bottom-sheet for "account under review".
 * NEVER reveals scores, weights, tiers, or how many reports.
 *
 * Props:
 *   onClose: Function — callback to close the sheet
 */
const LearnMoreSheet = ({ onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(12,12,14,0.62)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'flex-end',
      }}
      onClick={onClose}
    >
      <style>{`
        .lm-slam { display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          transition: transform .08s steps(2), box-shadow .08s steps(2);
          -webkit-tap-highlight-color: transparent; }
        .lm-slam:active { transform: translate(4px, 4px) !important; box-shadow: 0 0 0 #191919 !important; }
        .lm-card:focus-visible, .lm-slam:focus-visible {
          outline: 3px solid #FFD43D; outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) {
          .lm-slam { transition: none !important; }
        }
      `}</style>

      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        style={{
          width: '100%',
          maxHeight: '70vh',
          backgroundColor: t.paper,
          borderTop: `2px solid ${t.ink}`,
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 -10px 40px rgba(0,0,0,.45)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grabber */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, position: 'relative', zIndex: 2 }}>
          <span aria-hidden="true" style={{ width: 48, height: 6, borderRadius: 999, backgroundColor: t.ink }} />
        </div>

        {/* Header — Archivo title, bordered close tile */}
        <div style={{
          padding: '14px 20px 14px',
          borderBottom: `2px solid ${t.ink}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
          zIndex: 2,
        }}>
          <span style={{ fontFamily: t.fontHeavy, fontSize: 19, fontWeight: 400, color: t.ink, letterSpacing: '-.01em', textTransform: 'uppercase' }}>
            Account Review
          </span>
          <button
            onClick={onClose}
            aria-label="Close"
            className="lm-slam"
            style={{
              backgroundColor: t.card,
              border: `2px solid ${t.ink}`,
              borderRadius: 12,
              boxShadow: `3px 3px 0 ${t.ink}`,
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: t.ink,
            }}
          >
            <X size={16} strokeWidth={2.8} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px 20px 28px', overflowY: 'auto', position: 'relative', zIndex: 2 }}>
          <p style={{ fontFamily: t.fontBody, fontSize: 14.5, fontWeight: 500, color: t.ink2, marginBottom: 18, lineHeight: 1.6 }}>
            Your account has been flagged for review by our moderation system.
          </p>

          {/* What This Means — white card, icon tile, marker head */}
          <div className="lm-card" style={{
            backgroundColor: t.card,
            border: `2px solid ${t.ink}`,
            borderRadius: 14,
            boxShadow: `4px 4px 0 ${t.ink}`,
            padding: 16,
            marginBottom: 14,
            position: 'relative',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{
                width: 30, height: 30, flexShrink: 0, borderRadius: 9,
                border: `2px solid ${t.ink}`, background: t.yellow,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.ink,
              }}>
                <Info size={15} strokeWidth={2.4} />
              </span>
              <span style={{ fontFamily: t.fontMono, fontSize: 10.5, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: t.ink }}>
                What This Means
              </span>
            </div>
            <p style={{ fontFamily: t.fontBody, fontSize: 13.5, fontWeight: 500, color: t.ink2, lineHeight: 1.6, margin: 0 }}>
              Our system periodically reviews accounts to ensure a safe and respectful community. During this time, certain features may be temporarily limited while our team looks into it.
            </p>
          </div>

          {/* What You Can Do — green tile variant */}
          <div className="lm-card" style={{
            backgroundColor: t.card,
            border: `2px solid ${t.ink}`,
            borderRadius: 14,
            boxShadow: `4px 4px 0 ${t.ink}`,
            padding: 16,
            marginBottom: 22,
            position: 'relative',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{
                width: 30, height: 30, flexShrink: 0, borderRadius: 9,
                border: `2px solid ${t.ink}`, background: t.green,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.ink,
              }}>
                <LifeBuoy size={15} strokeWidth={2.4} />
              </span>
              <span style={{ fontFamily: t.fontMono, fontSize: 10.5, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: t.ink }}>
                What You Can Do
              </span>
            </div>
            <p style={{ fontFamily: t.fontBody, fontSize: 13.5, fontWeight: 500, color: t.ink2, lineHeight: 1.6, margin: 0 }}>
              In most cases, reviews are resolved quickly and your account returns to normal. If you believe this is a mistake, you can reach out to our support team.
            </p>
          </div>

          {/* Contact Support — the sheet's one yellow slam */}
          <a
            href="mailto:support@matchalize.com?subject=Account%20Review%20Inquiry"
            className="lm-slam"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              width: '100%',
              padding: '15px 16px',
              backgroundColor: t.yellow,
              border: `2px solid ${t.ink}`,
              borderRadius: 12,
              boxShadow: `4px 4px 0 ${t.ink}`,
              fontFamily: t.fontMono,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '.12em',
              textTransform: 'uppercase',
              color: t.ink,
              textDecoration: 'none',
              cursor: 'pointer',
              boxSizing: 'border-box',
            }}
          >
            <Mail size={15} strokeWidth={2.6} />
            Contact Support
          </a>

          {/* Registered email note — mono, quiet */}
          <p style={{ fontFamily: t.fontMono, fontSize: 9.5, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: t.ink3, textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>
            Use your registered email when contacting us.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LearnMoreSheet;