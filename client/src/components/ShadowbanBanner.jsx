import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import neu from '../styles/neu';

/* The shared neo-brutalist canon (src/styles/neu.js) */
const t = neu;

/**
 * ShadowbanBanner — Shows "account under review" banner.
 * NEVER reveals scores, weights, tiers, or how many reports.
 *
 * Props:
 *   isUnderReview: Boolean — safe status flag for the authenticated user
 *   onLearnMore: Function — callback to open Learn More sheet
 */
const ShadowbanBanner = ({ isUnderReview = false, onLearnMore }) => {
  if (!isUnderReview) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{
        backgroundColor: t.paper,
        border: `2px solid ${t.ink}`,
        borderRadius: 14,
        boxShadow: `4px 4px 0 ${t.ink}`,
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        margin: '0 14px 14px',
        position: 'relative',
      }}
    >
      <div style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: t.coral,
        border: `2px solid ${t.ink}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <AlertTriangle size={17} color={t.ink} strokeWidth={2.4} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: t.fontBody,
          fontSize: 13,
          fontWeight: 700,
          color: t.ink,
          margin: 0,
          lineHeight: 1.4,
        }}>
          Your account is currently under review.
        </p>
        <p style={{
          fontFamily: t.fontBody,
          fontSize: 12,
          fontWeight: 500,
          color: t.ink2,
          margin: '3px 0 0 0',
          lineHeight: 1.45,
        }}>
          'Profile editing may be temporarily limited.'
        </p>
      </div>

      <button
        className="sb-slam"
        onClick={() => { triggerHaptic('light'); onLearnMore(); }}
        aria-label="Learn more about account review"
        style={{
          backgroundColor: t.paper,
          border: `1.5px solid ${t.ink}`,
          borderRadius: 9,
          padding: '8px 11px',
          fontFamily: t.fontMono,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '.1em',
          textTransform: 'uppercase',
          color: t.ink,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          boxShadow: `2px 2px 0 ${t.ink}`,
          transition: 'transform .08s steps(2), box-shadow .08s steps(2)',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        Info
      </button>

      <style>{`
        .sb-slam { transition: transform .08s steps(2), box-shadow .08s steps(2); }
        .sb-slam:active { transform: translate(2px, 2px); box-shadow: 0 0 0 ${t.ink}; }
        .sb-slam:focus-visible { outline: 3px solid ${t.yellow}; outline-offset: 2px; }
        @media (hover: hover) and (pointer: fine) {
          .sb-slam:hover:not(:active) { transform: translate(-1px, -1px); box-shadow: 3px 3px 0 ${t.ink}; }
        }
        @media (prefers-reduced-motion: reduce) {
          .sb-slam { transition: none; }
        }
      `}</style>
    </motion.div>
  );
};

export default ShadowbanBanner;