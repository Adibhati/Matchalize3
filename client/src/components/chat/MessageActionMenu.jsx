import React, { memo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../../utils/haptics';
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
  shadowDark: 'rgba(26, 26, 26, 0.20)',
};

// Zero-Lag Memoized Icon Component
const Icon = memo(({ path, size = 20, color = theme.ink, strokeWidth = 1.8 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth={strokeWidth} 
    strokeLinecap="round" 
    strokeLinejoin="round"
    aria-hidden="true"
    style={{ display: 'block', flexShrink: 0 }}
  >
    {path}
  </svg>
));
Icon.displayName = 'Icon';

const actions = [
  { key: 'reply', label: 'Reply', haptic: 'light', hideIfMedia: false, hideIfMine: false, showOnlyIfMine: false, path: <><polyline points="9 17 4 12 9 7" /><path d="M20 18v-2a4 4 0 0 0-4-4H4" /></> },
  { key: 'react', label: 'React', haptic: 'light', hideIfMedia: false, hideIfMine: false, showOnlyIfMine: false, path: <><circle cx="12" cy="12" r="9" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></> },
  { key: 'copy', label: 'Copy', haptic: 'light', hideIfMedia: true, hideIfMine: false, showOnlyIfMine: false, path: <><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></> },
  { key: 'report', label: 'Report', haptic: 'medium', hideIfMedia: false, hideIfMine: true, showOnlyIfMine: false, path: <><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></> },
  { key: 'delete', label: 'Delete', haptic: 'medium', hideIfMedia: false, hideIfMine: false, showOnlyIfMine: true, path: <><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></> },
];

const MessageActionMenu = ({ anchorRect, isMine, isMedia, onClose, onReply, onReact, onCopy, onReport, onDelete }) => {
  if (!anchorRect) return null;
  const handlers = { reply: onReply, react: onReact, copy: onCopy, report: onReport, delete: onDelete };

  // Filter available actions based on message context
  const visible = actions.filter((a) => {
    if (a.hideIfMedia && isMedia) return false;
    if (a.hideIfMine && isMine) return false;
    if (a.showOnlyIfMine && !isMine) return false;
    return true;
  });

  // Strict 8-Point Grid Geometry Math
  const menuWidth = 216;
  const padding = 16;
  const itemHeight = 44; // Approx height per item
  const menuHeight = (visible.length * itemHeight) + 16; // 16px total vertical padding

  // Safe-area positioning logic
  let top = anchorRect.top - menuHeight - 12;
  if (top < padding + 60) top = anchorRect.bottom + 12; // Flips below if hitting top edge
  
  let left = anchorRect.left + (anchorRect.width / 2) - (menuWidth / 2);
  // Clamp to screen edges
  left = Math.max(padding, Math.min(left, window.innerWidth - menuWidth - padding));

  return createPortal(
    <AnimatePresence>
      {/* Hardware Accelerated Interactive Physics */}
      <style>{`
        .tactile-menu-btn {
          transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), background-color 0.2s ease;
          will-change: transform, background-color;
        }
        @media (hover: hover) {
          .tactile-menu-btn:hover {
            background-color: rgba(139, 69, 19, 0.05); /* Subtle warm paper highlight */
          }
          .tactile-menu-btn.danger-btn:hover {
            background-color: rgba(139, 26, 26, 0.05); /* Subtle crimson highlight */
          }
        }
        .tactile-menu-btn:active {
          transform: scale3d(0.97, 0.97, 1) !important;
          transition: transform 0.08s cubic-bezier(0, 0, 0.2, 1) !important;
          background-color: rgba(139, 69, 19, 0.1) !important;
        }
        .tactile-menu-btn.danger-btn:active {
          background-color: rgba(139, 26, 26, 0.1) !important;
        }
        @media (prefers-reduced-motion: reduce) {
          .tactile-menu-btn { transition: none !important; transform: none !important; }
        }
      `}</style>

      {/* Backdrop (Focus Pull) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        style={{ 
          position: 'fixed', 
          inset: 0, 
          backgroundColor: 'rgba(20, 15, 10, 0.35)', 
          backdropFilter: 'blur(2px)', 
          zIndex: 9998 
        }}
      />

      {/* Menu Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 8 }}
        transition={{ type: 'spring', damping: 26, stiffness: 380 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top,
          left,
          width: menuWidth,
          backgroundColor: theme.surface,
          backgroundImage: `url("${design?.texture?.grain || ''}")`,
          border: `1.5px solid ${theme.borderDark}`,
          borderRadius: '16px',
          boxShadow: `0 16px 40px ${theme.shadowDark}, 0 4px 12px ${theme.shadowWarm}`,
          padding: '8px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '2px', // Slight spacing between rounded pill items
          contain: 'layout style paint',
        }}
      >
        {visible.map((a) => {
          const isDanger = a.key === 'delete' || a.key === 'report';
          const iconColor = isDanger ? theme.crimson : theme.inkSoft;
          const textColor = isDanger ? theme.crimson : theme.ink;

          return (
            <button
              key={a.key}
              className={`tactile-menu-btn ${isDanger ? 'danger-btn' : ''}`}
              onClick={() => { 
                triggerHaptic(a.haptic);
                handlers[a.key]?.(); 
                if (a.key !== 'react') onClose();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '12px 16px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '8px', // Modern rounded internal list items
                cursor: 'pointer',
                textAlign: 'left',
                outline: 'none',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <Icon path={a.path} size={18} color={iconColor} strokeWidth={2} />
              <span 
                style={{ 
                  fontFamily: "'Inter', sans-serif", 
                  fontWeight: 600, 
                  fontSize: '14px',
                  color: textColor,
                  letterSpacing: '0.3px',
                }}
              >
                {a.label}
              </span>
            </button>
          );
        })}
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default MessageActionMenu;