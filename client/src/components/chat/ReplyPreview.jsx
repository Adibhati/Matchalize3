import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { triggerHaptic } from '../../utils/haptics';
import { Image, Mic, X } from 'lucide-react';
import { theme as design } from '../../utils/theme';

/* ==================================================================
   ARCHIVAL THEME CONSTANTS
================================================================== */
const theme = {
  paper: '#fdfbf7',
  surface: '#ffffff',
  surfaceAlt: '#f4f1ea',
  border: '#e0d8c8',
  borderDark: '#d4c5a9',
  ink: '#1a1a1a',
  inkMuted: '#8c8275',
  accent: '#8b4513',
  crimson: '#8b1a1a',
  shadowWarm: 'rgba(139, 69, 19, 0.12)',
};

const ReplyPreview = ({ replyTo, otherName, onCancel }) => {
  if (!replyTo) return null;

  // Truncate text cleanly and assign proper iconography for media
  const previewText = replyTo.text
    ? replyTo.text.slice(0, 60) + (replyTo.text.length > 60 ? '…' : '')
    : replyTo.type === 'image'
    ? <><Image size={14} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} /> Photograph</>
    : replyTo.type === 'audio'
    ? <><Mic size={14} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} /> Voice Note</>
    : 'Letter';

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
      style={{
        backgroundColor: theme.surfaceAlt,
        borderTop: `1px solid ${theme.borderDark}`,
        overflow: 'hidden',
        willChange: 'height, opacity', // GPU Promotion for layout animation
        position: 'relative',
        zIndex: 5,
        boxShadow: `0 -4px 16px ${theme.shadowWarm}`,
      }}
    >
      {/* Interactive Tactile Physics */}
      <style>{`
        .tactile-cancel-btn {
          transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), background-color 0.2s ease;
          will-change: transform;
        }
        @media (hover: hover) {
          .tactile-cancel-btn:hover {
            transform: translate3d(0, -2px, 0) scale3d(1.05, 1.05, 1);
            background-color: rgba(139, 26, 26, 0.08) !important;
            color: ${theme.crimson} !important;
            border-color: ${theme.crimson} !important;
          }
        }
        .tactile-cancel-btn:active {
          transform: scale3d(0.92, 0.92, 1) translate3d(0, 0, 0) !important;
          transition: transform 0.08s cubic-bezier(0, 0, 0.2, 1) !important;
        }
      `}</style>

      {/* 
        Inner wrapper with fixed padding. 
        This prevents margin-collapse stuttering during Framer Motion height animations.
      */}
      <div style={{
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        width: '100%',
        boxSizing: 'border-box',
      }}>
        
        {/* Cinematic Film Grain */}
        <div 
          aria-hidden="true" 
          style={{ 
            position: 'absolute', inset: 0, 
            backgroundImage: `url("${design?.texture?.grain || ''}")`, 
            mixBlendMode: 'multiply', opacity: 0.5, pointerEvents: 'none', zIndex: 0 
          }} 
        />
        
        {/* Archival Reference Line */}
        <div
          aria-hidden="true"
          style={{
            width: '3px',
            alignSelf: 'stretch',
            backgroundColor: theme.accent,
            borderRadius: '2px',
            flexShrink: 0,
            zIndex: 1,
            boxShadow: `1px 0 2px ${theme.shadowWarm}`,
          }}
        />
        
        {/* Typography Block */}
        <div style={{ flex: 1, minWidth: 0, zIndex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '10px',
              fontWeight: 800,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              color: theme.accent,
              lineHeight: 1,
            }}
          >
            Replying to {otherName || 'letter'}
          </div>
          <div
            style={{
              fontFamily: "'Special Elite', 'Courier New', monospace",
              fontSize: '13px',
              fontWeight: 600,
              color: theme.inkMuted,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'flex',
              alignItems: 'center',
              lineHeight: 1.2,
            }}
          >
            {previewText}
          </div>
        </div>
        
        {/* Action Button */}
        <button
          className="tactile-cancel-btn"
          onClick={() => {
            triggerHaptic('light');
            onCancel();
          }}
          aria-label="Cancel reply"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            border: `1.5px solid ${theme.borderDark}`,
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: theme.inkMuted,
            cursor: 'pointer',
            padding: 0,
            flexShrink: 0,
            zIndex: 1,
            outline: 'none',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <X size={14} strokeWidth={2.5} color="currentColor" />
        </button>

      </div>
    </motion.div>
  );
};

// Memoize to prevent re-renders while the user is typing in the chat input
export default memo(ReplyPreview);