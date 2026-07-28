import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../../utils/haptics';
import { theme as design } from '../../utils/theme';

const REACTION_EMOJIS = ['❤️', '😂', '🔥', '👍', '😲', '😢'];

/* ==================================================================
   ARCHIVAL THEME CONSTANTS
================================================================== */
const theme = {
  paper: '#fdfbf7',
  borderDark: '#d4c5a9',
  ink: '#1a1a1a',
  crimson: '#8b1a1a',
  shadowWarm: 'rgba(139, 69, 19, 0.15)',
  shadowDark: 'rgba(26, 26, 26, 0.25)',
};

const EmojiPicker = ({ anchorRect, onSelect, onClose }) => {
  if (!anchorRect) return null;

  // Strict 8-Point Grid Geometry
  const pickerWidth = 288; // 36 * 8
  const pickerHeight = 64; // 8 * 8
  const padding = 16;
  const safeAreaTop = 60; // Assumes a standard mobile header clearance

  // Calculate vertical position (default above, flip below if obstructed)
  let top = anchorRect.top - pickerHeight - 16;
  if (top < padding + safeAreaTop) {
    top = anchorRect.bottom + 16;
  }

  // Calculate horizontal position (centered over bubble, clamped to screen edges)
  let left = anchorRect.left + (anchorRect.width / 2) - (pickerWidth / 2);
  if (left < padding) {
    left = padding;
  }
  if (left + pickerWidth > window.innerWidth - padding) {
    left = window.innerWidth - pickerWidth - padding;
  }

  return createPortal(
    <AnimatePresence>
      {/* GPU Promoted CSS Physics for Zero-Lag Emojis */}
      <style>{`
        .tactile-emoji {
          will-change: transform;
          transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
          transform: translate3d(0, 0, 0) scale3d(1, 1, 1);
        }
        
        @media (hover: hover) {
          .tactile-emoji:hover {
            transform: translate3d(0, -6px, 0) scale3d(1.35, 1.35, 1);
            z-index: 10;
          }
        }
        
        .tactile-emoji:active {
          transform: translate3d(0, 2px, 0) scale3d(0.85, 0.85, 1) !important;
          transition: transform 0.08s cubic-bezier(0, 0, 0.2, 1) !important;
        }

        @media (prefers-reduced-motion: reduce) {
          .tactile-emoji { transition: none !important; transform: none !important; }
        }
      `}</style>

      {/* Dimmed Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(20, 15, 10, 0.4)',
          backdropFilter: 'blur(2px)', // Subtle focus pull
          zIndex: 9996,
        }}
      />

      {/* Floating Reaction Pill */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.85, y: 12 }}
        transition={{ type: 'spring', damping: 24, stiffness: 400 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top,
          left,
          width: pickerWidth,
          height: pickerHeight,
          backgroundColor: theme.paper,
          backgroundImage: `url("${design?.texture?.grain || ''}")`,
          border: `1.5px solid ${theme.borderDark}`,
          borderRadius: '32px', // Pill shape for reaction menus
          boxShadow: `0 16px 40px ${theme.shadowDark}, 0 4px 12px ${theme.shadowWarm}`,
          zIndex: 9997,
          padding: '0 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          contain: 'layout style paint', // Isolates layout from the chat beneath it
        }}
      >
        {/* Specular Highlight Overlay */}
        <div 
          aria-hidden="true" 
          style={{ 
            position: 'absolute', inset: 0, borderRadius: '32px', pointerEvents: 'none',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 50%)', 
          }} 
        />

        {REACTION_EMOJIS.map((emoji, i) => (
          <motion.button
            key={emoji}
            initial={{ opacity: 0, y: 10, scale: 0.5 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: i * 0.03, type: 'spring', damping: 18, stiffness: 300 }}
            className="tactile-emoji"
            onClick={() => {
              triggerHaptic('medium');
              onSelect(emoji);
            }}
            aria-label={`React with ${emoji}`}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '28px',
              cursor: 'pointer',
              padding: '8px',
              margin: 0,
              lineHeight: 1,
              position: 'relative',
              zIndex: 2,
              WebkitTapHighlightColor: 'transparent',
              outline: 'none',
            }}
          >
            {emoji}
          </motion.button>
        ))}
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default EmojiPicker;