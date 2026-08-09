import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

const theme = {
  paper: '#fdfbf7',
  surface: '#ffffff',
  surfaceAlt: '#f4f1ea',
  border: '#e0d8c8',
  borderDark: '#d4c5a9',
  ink: '#1a1a1a',
  inkMuted: '#8c8275',
  inkSoft: '#4a4a4a',
  accent: '#8b4513',
  crimson: '#8b1a1a',
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
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{
        backgroundColor: isHighTier ? 'rgba(139, 26, 26, 0.06)' : 'rgba(139, 69, 19, 0.05)',
        border: `1px solid ${isHighTier ? 'rgba(139, 26, 26, 0.2)' : 'rgba(139, 69, 19, 0.15)'}`,
        borderRadius: '12px',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        margin: '0 24px 16px',
        backgroundImage: `linear-gradient(135deg, ${theme.paper} 0%, ${theme.surfaceAlt} 100%)`,
      }}
    >
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: '10px',
        backgroundColor: isHighTier ? 'rgba(139, 26, 26, 0.1)' : 'rgba(139, 69, 19, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <AlertTriangle size={18} color={isHighTier ? theme.crimson : theme.accent} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '13px',
          fontWeight: 600,
          color: theme.ink,
          margin: 0,
          lineHeight: 1.4,
        }}>
          Your account is currently under review.
        </p>
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '12px',
          color: theme.inkMuted,
          margin: '3px 0 0 0',
          lineHeight: 1.4,
        }}>
          {isHighTier
            ? 'Profile editing and photo uploads are temporarily limited.'
            : 'New profile visibility may be temporarily limited.'}
        </p>
      </div>

      <button
        onClick={onLearnMore}
        style={{
          background: 'none',
          border: `1px solid ${isHighTier ? 'rgba(139, 26, 26, 0.3)' : 'rgba(139, 69, 19, 0.2)'}`,
          borderRadius: '8px',
          padding: '8px 14px',
          fontFamily: "'Inter', sans-serif",
          fontSize: '12px',
          fontWeight: 700,
          color: isHighTier ? theme.crimson : theme.accent,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          letterSpacing: '0.3px',
        }}
      >
        Learn more
      </button>
    </motion.div>
  );
};

export default ShadowbanBanner;