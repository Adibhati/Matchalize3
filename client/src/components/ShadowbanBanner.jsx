import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

/* Locked tokens — same family as ProfileCard */
const t = {
  paper: '#fdfbf7',
  surfaceAlt: '#f4f1ea',
  lineDark: '#d4c5a9',
  ink: '#1a1a1a',
  inkSoft: '#4a4a4a',
  inkMuted: '#8c8275',
  accent: '#8b4513',
  crimson: '#8b1a1a',
  fontBody: "'Inter', -apple-system, sans-serif",
};

/**
 * ShadowbanBanner — Shows "account under review" banner.
 * NEVER reveals scores, weights, tiers, or how many reports.
 *
 * Props:
 *   score: Number — user's shadowbanScore
 *   onLearnMore: Function — callback to open Learn More sheet
 *
 * Visibility: score < 5.0 → null (don't render)
 */
const ShadowbanBanner = ({ score = 0, onLearnMore }) => {
  if (score < 5.0) return null;

  const isHighTier = score >= 8.0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{
        backgroundColor: isHighTier ? 'rgba(139, 26, 26, 0.06)' : 'rgba(139, 69, 19, 0.05)',
        border: `1px solid ${isHighTier ? 'rgba(139, 26, 26, 0.2)' : 'rgba(139, 69, 19, 0.15)'}`,
        borderRadius: 12,
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        margin: '0 24px 16px',
      }}
    >
      {/* Standard icon tile, tinted by tier */}
      <div style={{
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: isHighTier ? 'rgba(139, 26, 26, 0.08)' : 'rgba(139, 69, 19, 0.08)',
        border: `1px solid ${isHighTier ? 'rgba(139, 26, 26, 0.15)' : 'rgba(139, 69, 19, 0.12)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <AlertTriangle size={18} color={isHighTier ? t.crimson : t.accent} strokeWidth={2} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: t.fontBody,
          fontSize: 13.5,
          fontWeight: 600,
          color: t.ink,
          margin: 0,
          lineHeight: 1.4,
        }}>
          Your account is currently under review.
        </p>
        <p style={{
          fontFamily: t.fontBody,
          fontSize: 12,
          fontWeight: 450,
          color: t.inkMuted,
          margin: '3px 0 0 0',
          lineHeight: 1.45,
        }}>
          {isHighTier
            ? 'Profile editing and photo uploads are temporarily limited.'
            : 'New profile visibility may be temporarily limited.'}
        </p>
      </div>

      <button
        className="tactile-btn"
        onClick={() => { triggerHaptic('light'); onLearnMore(); }}
        style={{
          backgroundColor: isHighTier ? 'rgba(139, 26, 26, 0.06)' : 'rgba(139, 69, 19, 0.06)',
          border: `1px solid ${isHighTier ? 'rgba(139, 26, 26, 0.25)' : 'rgba(139, 69, 19, 0.2)'}`,
          borderRadius: 999,
          padding: '8px 13px',
          fontFamily: t.fontBody,
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '1px',
          textTransform: 'uppercase',
          color: isHighTier ? t.crimson : t.accent,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        Learn more
      </button>

      <style>{`
        .tactile-btn { transition: transform 0.15s ease-out; will-change: transform; }
        .tactile-btn:active { transform: scale(0.96) !important; }
      `}</style>
    </motion.div>
  );
};

export default ShadowbanBanner;