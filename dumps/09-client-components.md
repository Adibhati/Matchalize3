# Chunk 09 — Client Components

> Matchalize · `client-components` · files 9 of 25 chunks · 6 file(s) · 56 KB · ~16,402 tokens
> Generated 2026-10-09 14:03.
> Paste-safe: within the 100 KB / ~29,257 token target.
>
> Contains:
> - `./client/src/components/chat/MessageActionMenu.jsx`
> - `./client/src/components/chat/MessageBubble.jsx`
> - `./client/src/components/chat/PhotoViewer.jsx`
> - `./client/src/components/chat/ReplyPreview.jsx`
> - `./client/src/components/chat/ReportModal.jsx`
> - `./client/src/components/chat/SearchOverlay.jsx`

---
### ./client/src/components/chat/MessageActionMenu.jsx

```
import React, { memo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../../utils/haptics';
import { theme as design } from '../../utils/theme';

/* ==================================================================
   ARCHIVAL THEME CONSTANTS
================================================================== */
const theme = { 
  paper: 'var(--paper)', 
  surface: 'var(--surface)', 
  surfaceAlt: 'var(--surface-alt)', 
  border: 'var(--line)', 
  borderDark: 'var(--line-dark)', 
  ink: 'var(--ink)', 
  inkMuted: 'var(--ink-muted)', 
  accent: 'var(--accent)', 
  crimson: 'var(--crimson)', 
  shadowWarm: 'var(--accent-12)',
  shadowDark: 'var(--ink-20)',
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
            background-color:'var(--accent-05)'; /* Subtle warm paper highlight */
          }
          .tactile-menu-btn.danger-btn:hover {
            background-color:'var(--crim-05)'; /* Subtle crimson highlight */
          }
        }
        .tactile-menu-btn:active {
          transform: scale3d(0.97, 0.97, 1) !important;
          transition: transform 0.08s cubic-bezier(0, 0, 0.2, 1) !important;
          background-color:'var(--accent-10)' !important;
        }
        .tactile-menu-btn.danger-btn:active {
          background-color:'var(--crim-10)' !important;
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
```

### ./client/src/components/chat/MessageBubble.jsx

```
import React, { useRef, useState, memo } from 'react';
import { motion } from 'framer-motion';
import { triggerHaptic } from '../../utils/haptics';
import { Check, CheckCheck } from 'lucide-react';
import PolaroidCard from '../PolaroidCard';
import CassettePlayer from '../CassettePlayer';
import { theme as design } from '../../utils/theme';

/* ==================================================================
   ARCHIVAL THEME CONSTANTS
================================================================== */
const theme = {
  paper: 'var(--paper)', 
  surface: 'var(--surface)', 
  surfaceAlt: 'var(--surface-alt)', 
  border: 'var(--line)', 
  borderDark: 'var(--line-dark)',
  ink: 'var(--ink)', 
  inkMuted: 'var(--ink-muted)', 
  accent: 'var(--accent)', 
  crimson: 'var(--crimson)', 
  shadowWarm: 'var(--accent-12)',
};

const MessageBubble = ({ 
  message, 
  isMine, 
  time, 
  receipt, 
  onLongPress, 
  onImageClick, 
  replyPreview 
}) => {
  const pressTimer = useRef(null);
  const [isPressed, setIsPressed] = useState(false);

  // Tactile Long Press Engine
  const startPress = (e) => {
    // Prevent menu trigger if user is interacting with media cards directly
    if (e.target.closest('[data-no-longpress]')) return;
    
    pressTimer.current = setTimeout(() => {
      triggerHaptic('medium');
      setIsPressed(true);
      onLongPress(message, e);
      setTimeout(() => setIsPressed(false), 250);
    }, 400); // 400ms aligns with native iOS/Android long-press timing
  };

  const cancelPress = () => {
    if (pressTimer.current) { 
      clearTimeout(pressTimer.current); 
      pressTimer.current = null; 
    }
    setIsPressed(false);
  };

  const renderContent = () => {
    if (message.type === 'image' || (message.type === 'opening_letter' && message.mediaUrl)) {
      return (
        <div data-no-longpress onClick={() => onImageClick?.(message.mediaUrl)} style={{ cursor: 'zoom-in' }}>
          <PolaroidCard src={message.mediaUrl} caption={message.text} tilt={isMine ? '1deg' : '-1deg'} />
        </div>
      );
    }
    if (message.type === 'audio') {
      return (
        <div data-no-longpress>
          <CassettePlayer audioUrl={message.mediaUrl} themeColor={isMine ? theme.accent : theme.inkSoft} />
        </div>
      );
    }
    if (message.deleted) {
      return (
        <span style={{ fontStyle: 'italic', color: theme.inkMuted, fontSize: '13px', fontFamily: "'Inter', sans-serif" }}>
          This artifact was removed.
        </span>
      );
    }
    return <span style={{ whiteSpace: 'pre-wrap' }}>{message.text}</span>;
  };

  // Group duplicate reactions
  const reactionGroups = {};
  (message.reactions || []).forEach((r) => {
    if (!reactionGroups[r.emoji]) reactionGroups[r.emoji] = [];
    reactionGroups[r.emoji].push(r.user);
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: isPressed ? 0.96 : 1,
      }}
      transition={{ type: 'spring', damping: 26, stiffness: 380 }}
      
      // Touch / Mouse event bindings for Long Press
      // Deleted messages are tombstones — the body/media/reactions are scrubbed,
      // so the action menu has nothing to act on. Wiring the handlers to null
      // stops the menu opening at all, which is what previously let you add
      // fresh reactions to a message that had already been removed.
      onTouchStart={message.deleted ? undefined : startPress}
      onTouchEnd={message.deleted ? undefined : cancelPress}
      onTouchMove={message.deleted ? undefined : cancelPress}
      onMouseDown={message.deleted ? undefined : startPress}
      onMouseUp={message.deleted ? undefined : cancelPress}
      onMouseLeave={message.deleted ? undefined : cancelPress}
      onContextMenu={(e) => e.preventDefault()}
      data-bubble="true"
      data-msg-id={message._id} // Required for SearchOverlay jumping
      
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: isMine ? 'flex-end' : 'flex-start', 
        marginBottom: '20px', 
        userSelect: 'none', 
        WebkitUserSelect: 'none', 
        WebkitTouchCallout: 'none',
        contain: 'layout style', // Isolates layout recalculations strictly to this bubble
        willChange: 'transform, opacity',
      }}
    >
      {/* Attached Archival Reply Note */}
      {replyPreview && !message.deleted && (
        <div style={{ 
          maxWidth: '75%', 
          padding: '8px 12px', 
          marginBottom: '6px', 
          backgroundColor: isMine ? 'var(--accent-05)' : theme.surface, 
          border: `1px solid ${theme.border}`,
          borderLeft: `3px solid ${theme.accent}`, 
          borderRadius: '6px', 
          fontSize: '12px', 
          color: theme.inkMuted, 
          fontFamily: "'Inter', sans-serif", 
          fontStyle: 'italic', 
          whiteSpace: 'nowrap', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis',
        }}>
          Replying to: {replyPreview.text || (replyPreview.type === 'image' ? 'Photograph' : 'Voice Note')}
        </div>
      )}

      {/* Main Message Bubble */}
      <div style={{ 
        maxWidth: '82%', 
        padding: '14px 18px', 
        borderRadius: '12px', 
        backgroundColor: isMine ? theme.surfaceAlt : theme.surface, 
        border: `1px solid ${theme.border}`, 
        borderLeft: isMine ? `1px solid ${theme.border}` : `3px solid ${theme.crimson}`, 
        borderRight: isMine ? `3px solid ${theme.accent}` : `1px solid ${theme.border}`, 
        color: theme.ink, 
        fontFamily: "'Special Elite', 'Courier New', monospace", 
        fontSize: '15px', 
        lineHeight: '1.5', 
        wordBreak: 'break-word', 
        position: 'relative',
        transition: 'border-color 0.3s ease',
      }}>
        {renderContent()}

        {/* Peeling Archival Washi Tape for Text Messages */}
        {message.type === 'text' && !message.deleted && (
          <div 
            aria-hidden="true"
            style={{ 
              position: 'absolute', 
              top: '-8px', 
              [isMine ? 'right' : 'left']: '16px', 
              width: '32px', 
              height: '14px', 
              backgroundColor: 'var(--tape-90)', 
              backdropFilter: 'blur(2px)',
              border: `1px solid var(--accent-15)`,
              transform: `rotate(${isMine ? '4deg' : '-4deg'})`,
              zIndex: 2,
            }} 
          />
        )}
      </div>

      {/* Reaction Cluster */}
      {/* Guarded on `!deleted` as well as in the routes: an older client build
          could still deliver reactions for a message deleted moments earlier. */}
      {!message.deleted && Object.keys(reactionGroups).length > 0 && (
        <div style={{ 
          display: 'flex', 
          gap: '6px', 
          marginTop: '6px', 
          flexWrap: 'wrap', 
          maxWidth: '80%', 
          justifyContent: isMine ? 'flex-end' : 'flex-start' 
        }}>
          {Object.entries(reactionGroups).map(([emoji, users]) => (
            <motion.div 
              key={emoji} 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '4px', 
                padding: '4px 8px', 
                backgroundColor: theme.surface, 
                border: `1px solid ${theme.borderDark}`, 
                borderRadius: '16px', 
                fontSize: '14px', 
                lineHeight: 1,
              }}
            >
              <span>{emoji}</span>
              {users.length > 1 && (
                <span style={{ 
                  fontFamily: "'Inter', sans-serif", 
                  fontSize: '11px', 
                  fontWeight: 700, 
                  color: theme.inkMuted 
                }}>
                  {users.length}
                </span>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Meta: Time & Read Receipts */}
      <div style={{ 
        marginTop: '8px', 
        fontSize: '10px', 
        fontFamily: "'Inter', sans-serif", 
        fontWeight: 700, 
        letterSpacing: '1px', 
        color: theme.inkMuted, 
        display: 'flex', 
        gap: '8px', 
        alignItems: 'center', 
        textTransform: 'uppercase' 
      }}>
        <span>{time}</span>
        {receipt && (
          <span style={{ 
            color: message.readAt ? 'var(--success)' : theme.accent, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px',
            transition: 'color 0.3s ease'
          }}>
            {message.readAt ? <CheckCheck size={12} strokeWidth={2.5} /> : <Check size={12} strokeWidth={2.5} />} 
            {receipt}
          </span>
        )}
      </div>
    </motion.div>
  );
};

// Zero-Lag Deep Equality Check
// Ensures the bubble ONLY re-renders if its specific data changes, 
// completely preventing chat-scroll lag.
const areEqual = (prev, next) => {
  return (
    prev.message._id === next.message._id &&
    prev.message.readAt === next.message.readAt &&
    prev.message.deleted === next.message.deleted &&
    prev.receipt === next.receipt &&
    JSON.stringify(prev.message.reactions) === JSON.stringify(next.message.reactions)
  );
};

export default memo(MessageBubble, areEqual);
```

### ./client/src/components/chat/PhotoViewer.jsx

```
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../../utils/haptics';
import { theme as design } from '../../utils/theme';
import { X } from 'lucide-react';

/* ==================================================================
   ARCHIVAL THEME CONSTANTS
================================================================== */
const theme = {
  paper: 'var(--paper)',
  border: 'var(--line)',
  borderDark: 'var(--line-dark)',
  ink: 'var(--ink)',
  inkMuted: 'var(--ink-muted)',
  accent: 'var(--accent)',
  shadowWarm: 'var(--accent-15)',
};

// GPU-Promoted, Memoized Archival Corner Mounts
const CornerMounts = React.memo(() => (
  <>
    <span aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0, width: 24, height: 24, background: '#fff', clipPath: 'polygon(0 0, 100% 0, 0 100%)', zIndex: 3 }} />
    <span aria-hidden="true" style={{ position: 'absolute', top: 0, right: 0, width: 24, height: 24, background: '#fff', clipPath: 'polygon(100% 0, 0 0, 100% 100%)', zIndex: 3 }} />
    <span aria-hidden="true" style={{ position: 'absolute', bottom: 0, left: 0, width: 24, height: 24, background: '#fff', clipPath: 'polygon(0 100%, 100% 100%, 0 0)', zIndex: 3 }} />
    <span aria-hidden="true" style={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, background: '#fff', clipPath: 'polygon(100% 100%, 0 100%, 100% 0)', zIndex: 3 }} />
  </>
));
CornerMounts.displayName = 'CornerMounts';

/* ==================================================================
   MAIN COMPONENT
================================================================== */
const PhotoViewer = ({ src, onClose }) => {
  const [scale, setScale] = useState(1);

  if (!src) return null;

  const handleTap = () => {
    if (scale > 1) {
      triggerHaptic('light');
      setScale(1);
    } else {
      triggerHaptic('medium');
      onClose();
    }
  };

  const handleDoubleClick = (e) => {
    e.stopPropagation(); // Prevents the tap handler from firing
    triggerHaptic('medium');
    setScale(scale > 1 ? 1 : 2.2);
  };

  return createPortal(
    <AnimatePresence>
      {/* Immersive Cinematic Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        onClick={handleTap}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(10, 8, 6, 0.85)',
          backgroundImage: `url("${design?.texture?.grain || ''}")`,
          backgroundSize: '150px 150px',
          backdropFilter: 'blur(6px)', // Depth of field focus pull
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          cursor: scale > 1 ? 'zoom-out' : 'pointer',
          contain: 'strict', // Absolute layout isolation
        }}
      >
        {/* Subtle Close Hint */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            position: 'absolute',
            top: 'max(24px, env(safe-area-inset-top))',
            right: '24px',
            color: 'rgba(255,255,255,0.8)',
            fontFamily: "'Inter', sans-serif",
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            zIndex: 10002,
            pointerEvents: 'none',
          }}
        >
          {scale > 1 ? 'Double-tap to unzoom' : 'Tap to close'} 
          <X size={14} strokeWidth={2.5} color="currentColor" />
        </motion.div>

        {/* Archival Photo Frame Container */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, rotate: -2, y: 20 }}
          animate={{ scale, opacity: 1, rotate: 0, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, rotate: -2, y: 20 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          onDoubleClick={handleDoubleClick}
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: 'var(--surface)',
            padding: '16px 16px 48px 16px',
            borderRadius: '4px',
            border: `1px solid ${theme.borderDark}`,
            position: 'relative',
            maxWidth: '100%',
            maxHeight: '85dvh',
            cursor: scale > 1 ? 'zoom-out' : 'zoom-in',
            willChange: 'transform, opacity', // GPU Promotion
          }}
        >
          {/* Specular Room Lighting Overlay */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 50%, rgba(0,0,0,0.02) 100%)',
              pointerEvents: 'none',
              zIndex: 4,
            }}
          />

          <CornerMounts />

          {/* Artifact Image */}
          <img
            src={src}
            alt="Archival Specimen Full View"
            decoding="async" // Prevents main thread blocking on hi-res decode
            style={{
              maxWidth: '100%',
              maxHeight: '70dvh',
              objectFit: 'contain',
              borderRadius: '2px',
              display: 'block',
              border: `1px solid ${theme.border}`,
              backgroundColor: 'var(--surface-alt)', // Fallback color while decoding
            }}
          />

          {/* Typewriter Caption */}
          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: "'Special Elite', 'Courier New', monospace",
              fontSize: '13px',
              fontWeight: 600,
              color: theme.inkMuted,
              fontStyle: 'italic',
              textAlign: 'center',
              letterSpacing: '-0.01em',
              zIndex: 5,
            }}
          >
            Archival Specimen
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default PhotoViewer;
```

### ./client/src/components/chat/ReplyPreview.jsx

```
import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { triggerHaptic } from '../../utils/haptics';
import { Image, Mic, X } from 'lucide-react';
import { theme as design } from '../../utils/theme';

/* ==================================================================
   ARCHIVAL THEME CONSTANTS
================================================================== */
const theme = {
  paper: 'var(--paper)',
  surface: 'var(--surface)',
  surfaceAlt: 'var(--surface-alt)',
  border: 'var(--line)',
  borderDark: 'var(--line-dark)',
  ink: 'var(--ink)',
  inkMuted: 'var(--ink-muted)',
  accent: 'var(--accent)',
  crimson: 'var(--crimson)',
  shadowWarm: 'var(--accent-12)',
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
            background-color:'var(--crim-08)' !important;
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
```

### ./client/src/components/chat/ReportModal.jsx

```
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { api } from '../../utils/api';
import { triggerHaptic } from '../../utils/haptics';
import { theme as design } from '../../utils/theme';
import { toast } from '../../utils/toast';

/* ==================================================================
   DECK AESTHETIC — tokens lifted 1:1 from ProfileCard.jsx
   (neubrutalism candy box). Fonts (Archivo Black / Space Mono /
   Inter) are loaded once in index.html — no @import here.
================================================================== */
const F = {
  heavy: "'Archivo Black', 'Arial Black', sans-serif",
  body: "'Inter', -apple-system, 'Segoe UI', sans-serif",
  mono: "'Space Mono', 'Courier New', monospace",
};
const C = {
  paper: '#FFF9EC', card: '#FFFFFF', ink: '#191919',
  ink2: '#5F5B52', ink3: '#A39E92', hair: '#EBE5D6',
  yellow: '#FFD43D', coral: '#FF7A59', red: '#E5484D',
};

const MAX_DETAILS = 500;

const REPORT_SHEET_CSS = `
  .rm-root { font-family: ${F.body}; color: ${C.ink}; -webkit-font-smoothing: antialiased; }
  .rm-root ::selection { background: ${C.yellow}; color: ${C.ink}; }

  /* sheet — same recipe as .pc-sheet: cream, 2px ink border, ONE big shadow */
  .rm-sheet { background: ${C.paper}; border: 2px solid ${C.ink}; border-radius: 22px;
    box-shadow: 8px 8px 0 ${C.ink}; -webkit-tap-highlight-color: transparent; }
  .rm-grabber { width: 48px; height: 6px; border-radius: 999px; margin: 0 auto; flex-shrink: 0;
    background: ${C.ink}; transition: none; }
  .rm-sheet:active .rm-grabber { background: ${C.yellow}; }

  /* title — pc-name marker highlight */
  .rm-title { font-family: ${F.heavy}; font-size: 24px; font-weight: 400; letter-spacing: -.01em;
    line-height: 1.08; color: ${C.ink}; margin: 0;
    background-image: linear-gradient(180deg, transparent 58%, ${C.yellow} 58%);
    padding: 0 6px 3px 0; }
  .rm-sub { font-family: ${F.body}; font-size: 13.5px; font-weight: 450; color: ${C.ink2};
    line-height: 1.55; margin: 10px 0 0; }

  /* close — pc-iconbtn physics */
  .rm-close { width: 42px; height: 42px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
    cursor: pointer; border: 2px solid ${C.ink}; border-radius: 12px; background: ${C.card}; color: ${C.ink};
    box-shadow: 4px 4px 0 ${C.ink};
    transition: transform .08s steps(2), box-shadow .08s steps(2), background .08s steps(2); }
  .rm-close:active { transform: translate(4px, 4px); box-shadow: 0 0 0 ${C.ink}; background: ${C.ink}; color: ${C.paper}; }
  .rm-close:focus-visible { outline: 3px solid ${C.yellow}; outline-offset: 2px; }

  /* section heads — marker square + mono label (pc-shead) */
  .rm-shead { display: flex; align-items: center; gap: 10px; margin: 0 0 12px; }
  .rm-mark { width: 11px; height: 11px; flex-shrink: 0; border: 2px solid ${C.ink}; border-radius: 3px; }
  .rm-stitle { font-family: ${F.mono}; font-size: 12px; font-weight: 700; letter-spacing: .18em;
    text-transform: uppercase; color: ${C.ink}; }

  /* reason rows — pc-card chunky buttons */
  .rm-reason { display: block; width: 100%; text-align: left; padding: 13px 14px; cursor: pointer;
    background: ${C.card}; border: 2px solid ${C.ink}; border-radius: 14px;
    font-family: ${F.body}; font-size: 14px; font-weight: 500; color: ${C.ink};
    box-shadow: 3px 3px 0 ${C.ink};
    transition: transform .08s steps(2), box-shadow .08s steps(2), background .08s steps(2);
    -webkit-tap-highlight-color: transparent; }
  .rm-reason + .rm-reason { margin-top: 10px; }
  .rm-reason:active { transform: translate(3px, 3px); box-shadow: 0 0 0 ${C.ink}; }
  .rm-reason.selected { background: ${C.yellow}; font-weight: 700; box-shadow: 5px 5px 0 ${C.ink}; }
  .rm-reason:disabled { cursor: not-allowed; }
  .rm-reason:focus-visible { outline: 3px solid ${C.yellow}; outline-offset: 2px; }

  /* textarea — pc-card */
  .rm-textarea { width: 100%; min-height: 96px; padding: 13px 14px; resize: none; outline: none;
    background: ${C.card}; border: 2px solid ${C.ink}; border-radius: 14px; box-shadow: 3px 3px 0 ${C.ink};
    font-family: ${F.body}; font-size: 14px; color: ${C.ink}; line-height: 1.55; box-sizing: border-box; }
  .rm-textarea::placeholder { color: ${C.ink3}; }
  .rm-textarea:focus-visible { outline: 3px solid ${C.yellow}; outline-offset: 2px; }
  .rm-count { text-align: right; margin-top: 6px; font-family: ${F.mono}; font-size: 10px;
    color: ${C.ink3}; font-variant-numeric: tabular-nums; }

  /* submit — the one red moment (pc-menubtn red), pc-iconbtn physics */
  .rm-submit { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 14px 16px;
    cursor: pointer; background: ${C.red}; color: #fff; border: 2px solid ${C.ink}; border-radius: 14px;
    box-shadow: 4px 4px 0 ${C.ink}; font-family: ${F.mono}; font-size: 12px; font-weight: 700;
    letter-spacing: .14em; text-transform: uppercase;
    transition: transform .08s steps(2), box-shadow .08s steps(2), background .08s steps(2);
    -webkit-tap-highlight-color: transparent; }
  .rm-submit:active:not(:disabled) { transform: translate(4px, 4px); box-shadow: 0 0 0 ${C.ink}; }
  .rm-submit:disabled { opacity: .45; cursor: not-allowed; }
  .rm-submit:focus-visible { outline: 3px solid ${C.yellow}; outline-offset: 2px; }

  /* retry — white utility */
  .rm-retry { padding: 10px 22px; cursor: pointer; background: ${C.card}; color: ${C.ink};
    border: 2px solid ${C.ink}; border-radius: 12px; box-shadow: 4px 4px 0 ${C.ink};
    font-family: ${F.mono}; font-size: 12px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase;
    transition: transform .08s steps(2), box-shadow .08s steps(2); }
  .rm-retry:active { transform: translate(4px, 4px); box-shadow: 0 0 0 ${C.ink}; }

  @media (prefers-reduced-motion: reduce) {
    .rm-close, .rm-reason, .rm-submit, .rm-retry { transition: none; }
  }
`;

/**
 * ReportModal — bottom-sheet for reporting a user, on the Deck tab.
 * Aesthetic: ProfileCard.jsx (neubrutalism). Rendered through a portal to
 * <body> so it stacks ABOVE the floating deck chrome (header row z 500,
 * DeckActions × z 500) regardless of where it is mounted.
 *
 * Props:
 *   reportedUserId: string — the user being reported
 *   onClose: Function — dismiss callback
 *   onReported: Function — success callback (parent owns the success toast)
 */
const ReportModal = ({ reportedUserId, onClose, onReported }) => {
  const [reasons, setReasons] = useState([]);
  const [selectedReason, setSelectedReason] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const sheetRef = useRef(null);
  const closeBtnRef = useRef(null);
  const restoreFocusRef = useRef(null);

  /* ── Load reasons (GET /report/reasons → { reasons: string[] }) ── */
  const loadReasons = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get('/report/reasons');
      setReasons(Array.isArray(data.reasons) ? data.reasons.filter((r) => typeof r === 'string') : []);
    } catch (err) {
      console.error('Failed to fetch report reasons:', err);
      setReasons([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReasons();
  }, [loadReasons]);

  /* ── Escape to close (blocked mid-submit) + body scroll lock ── */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !submitting) onClose();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, submitting]);

  /* ── Focus: move in on mount, restore on unmount ──
     `preventScroll` is REQUIRED here, not a nicety. The element that had focus
     before the modal opened is the "Report profile" button, which lives inside
     the deck card's sheet — a panel that is position:absolute, translated with
     a transform, and TALLER than the viewport. Plain .focus() makes the browser
     try to scroll that element into view, but there is no scrollable ancestor
     to do it with (html/body and .pc-root are all overflow:hidden), so it
     compensates by shifting the composited transform layer: the sheet AND the
     photo jump upward on close, and the offset is not stored in yMV, so
     dragging can't undo it. preventScroll focuses without revealing. */
  useEffect(() => {
    restoreFocusRef.current = document.activeElement;
    closeBtnRef.current?.focus({ preventScroll: true });
    return () => restoreFocusRef.current?.focus?.({ preventScroll: true });
  }, []);

  /* ── Simple Tab trap inside the sheet ── */
  const trapTab = (e) => {
    if (e.key !== 'Tab' || !sheetRef.current) return;
    const focusables = sheetRef.current.querySelectorAll(
      'button:not(:disabled), textarea:not(:disabled), [href], [tabindex]:not([tabindex="-1"])'
    );
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const requestClose = () => {
    if (!submitting) onClose();
  };

  const handleSubmit = async () => {
    if (submitting) return;

    setSubmitting(true);
    try {
      await api.post(`/report/${reportedUserId}`, {
        reason: selectedReason,
        details: details.trim(),
      });
      triggerHaptic('heavy');
      onReported();
    } catch (err) {
      console.error('Report submission failed:', err);
      if (!err?.toasted) {
        toast.error('Could not submit your report. Check your connection and try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  /* Portal to <body> — mandatory: mounted from ProfileCard (inside
     contentStage, zIndex 1), a fixed overlay would otherwise be trapped
     UNDER the floating deck chrome (zIndex 500) no matter its own z-index. */
  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={requestClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(19,19,19,0.62)',
        backdropFilter: 'blur(2px)',
        zIndex: design.z?.modal || 1100, // token — above header (500), drawer (1000)
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <motion.div
        ref={sheetRef}
        className="rm-root rm-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
        aria-busy={loading || submitting}
        onKeyDown={trapTab}
        initial={{ y: '120%' }}
        animate={{ y: 0 }}
        exit={{ y: '120%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(100% - 24px, 560px)',
          maxHeight: '85vh',
          marginBottom: 12,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <style>{REPORT_SHEET_CSS}</style>

        {/* Grabber — ink at rest, yellow while held (pc-grabber) */}
        <div style={{ paddingTop: 12, flexShrink: 0 }}>
          <div className="rm-grabber" aria-hidden="true" />
        </div>

        {/* Header — Archivo Black marker-highlight title + pc-iconbtn close */}
        <div
          style={{
            padding: '12px 20px 14px',
            borderBottom: `1px solid ${C.hair}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 14,
            flexShrink: 0,
          }}
        >
          <h2 id="report-modal-title" className="rm-title">Report User</h2>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={requestClose}
            className="rm-close"
            aria-label="Close"
          >
            <X size={18} strokeWidth={3} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '16px 20px 24px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div
              role="status"
              style={{ textAlign: 'center', padding: '40px', fontFamily: F.mono, fontSize: 12, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: C.ink3 }}
            >
              Loading report options...
            </div>
          ) : reasons.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 12px' }}>
              <p style={{ fontFamily: F.body, fontSize: 13.5, color: C.ink2, lineHeight: 1.55, margin: '0 0 16px' }}>
                Report options couldn't be loaded. Check your connection and try again.
              </p>
              <button type="button" onClick={loadReasons} className="rm-retry">Retry</button>
            </div>
          ) : (
            <>
              <p className="rm-sub">
                Help us understand why you're reporting this user. Your report will be reviewed by our moderation team.
              </p>

              {/* Reason selection */}
              <div style={{ marginTop: 20, marginBottom: 22 }}>
                <div className="rm-shead" id="report-reason-label">
                  <span className="rm-mark" style={{ background: C.yellow }} aria-hidden="true" />
                  <span className="rm-stitle" id="report-reason-label-text">Reason for Report</span>
                </div>
                <div role="radiogroup" aria-labelledby="report-reason-label-text" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {reasons.map((reason) => {
                    const selected = selectedReason === reason;
                    return (
                      <motion.button
                        key={reason}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        disabled={submitting}
                        className={`rm-reason${selected ? ' selected' : ''}`}
                        onClick={() => {
                          setSelectedReason(reason);
                          triggerHaptic('light');
                        }}
                      >
                        {reason}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Details (optional) */}
              <div style={{ marginBottom: 22 }}>
                <label htmlFor="report-details" className="rm-shead" style={{ cursor: 'default' }}>
                  <span className="rm-mark" style={{ background: C.coral }} aria-hidden="true" />
                  <span className="rm-stitle">Additional Details (Optional)</span>
                </label>
                <textarea
                  id="report-details"
                  className="rm-textarea"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Provide any additional context..."
                  maxLength={MAX_DETAILS}
                  disabled={submitting}
                  aria-describedby="report-details-count"
                />
                <div id="report-details-count" className="rm-count">
                  {details.length}/{MAX_DETAILS}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Pinned footer — red CTA, always reachable */}
        {!loading && reasons.length > 0 && (
          <div
            style={{
              padding: '14px 20px calc(16px + env(safe-area-inset-bottom, 0px))',
              borderTop: `1px solid ${C.hair}`,
              backgroundColor: C.paper,
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !selectedReason}
              className="rm-submit"
              aria-busy={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>,
    document.body
  );
};

export default ReportModal;
```

### ./client/src/components/chat/SearchOverlay.jsx

```
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../../utils/haptics';
import { api } from '../../utils/api';
import { theme as design } from '../../utils/theme';
import { ChevronLeft, Search, XCircle } from 'lucide-react';

/* ==================================================================
   ARCHIVAL THEME CONSTANTS
================================================================== */
const theme = {
  paper: 'var(--paper)',
  surface: 'var(--surface)',
  surfaceAlt: 'var(--surface-alt)',
  border: 'var(--line)',
  borderDark: 'var(--line-dark)',
  ink: 'var(--ink)',
  inkMuted: 'var(--ink-muted)',
  accent: 'var(--accent)',
  crimson: 'var(--crimson)',
  shadowWarm: 'var(--accent-12)',
};

const SearchOverlay = ({ alignmentId, myId, onClose, onJumpTo }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef(null);

  // Debounced server-side search — covers the FULL history, not just loaded pages
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim() || !alignmentId) {
      setResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await api.get(`/messages/${alignmentId}/search?q=${encodeURIComponent(query.trim())}`);
        setResults(data?.results || []);
      } catch (e) {
        console.error('Search failed:', e);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, alignmentId]);

  // Escape regex metacharacters before building a RegExp.
  //
  // This used to interpolate `highlight` straight into `new RegExp(...)`, so
  // typing `(` threw `SyntaxError: Unterminated group` DURING RENDER. It is
  // caught by the root ErrorBoundary, which replaces the entire UI with the
  // "Ink Spilled" screen until a manual reload — one character typed into the
  // search box took the whole app down. `( ) [ ] { } * + ? ^ $ . | \` all break
  // or mis-highlight. The server already escapes its `$regex` (messages.js:56);
  // this is the same escaping applied client-side.
  const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Utility to safely highlight ALL occurrences of the search query
  const highlightText = (text, highlight) => {
    if (!highlight.trim()) return text;
    let parts;
    try {
      parts = text.split(new RegExp(`(${escapeRegex(highlight)})`, 'gi'));
    } catch {
      return text; // Defensive: never let highlighting break the render
    }
    return parts.map((part, i) =>
      part.toLowerCase() === highlight.toLowerCase() ? (
        <mark
          key={i}
          style={{
            backgroundColor: 'var(--gold-deep-35)', // Archival highlighter
            color: theme.ink,
            padding: '0 2px',
            borderRadius: '2px',
          }}
        >
          {part}
        </mark>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: theme.paper,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        contain: 'strict', // Absolute layout isolation
      }}
    >
      {/* GPU Promoted Tactile Physics */}
      <style>{`
        .tactile-result-btn {
          transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), border-color 0.2s ease;
          will-change: transform;
        }
        @media (hover: hover) {
          .tactile-result-btn:hover {
            transform: translate3d(0, -2px, 0) scale3d(1.01, 1.01, 1);
            border-color: ${theme.borderDark} !important;
          }
        }
        .tactile-result-btn:active {
          transform: scale3d(0.98, 0.98, 1) translate3d(0, 0, 0) !important;
          transition: transform 0.08s cubic-bezier(0, 0, 0.2, 1) !important;
        }

        .archival-scrollbar::-webkit-scrollbar { width: 4px; }
        .archival-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .archival-scrollbar::-webkit-scrollbar-thumb { background: ${theme.borderDark}; border-radius: 4px; }
      `}</style>

      {/* Cinematic Film Grain Overlay */}
      <div 
        aria-hidden="true" 
        style={{ 
          position: 'absolute', inset: 0, 
          backgroundImage: `url("${design?.texture?.grain || ''}")`, 
          mixBlendMode: 'multiply', opacity: 0.7, pointerEvents: 'none', zIndex: 0 
        }} 
      />

      {/* Sticky Archival Header */}
      <div
        style={{
          padding: 'max(12px, env(safe-area-inset-top)) 16px 12px',
          backgroundColor: theme.surface,
          borderBottom: `1px solid ${theme.borderDark}`,
          display: 'flex',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <button
          onClick={() => {
            triggerHaptic('light');
            onClose();
          }}
          aria-label="Close search"
          style={{
            background: 'none',
            border: 'none',
            color: theme.inkMuted,
            fontSize: '11px',
            fontFamily: "'Inter', sans-serif",
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            cursor: 'pointer',
            padding: '8px 4px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <ChevronLeft size={20} strokeWidth={2.5} color="currentColor" style={{ marginRight: '2px' }} /> Back
        </button>

        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          backgroundColor: theme.surfaceAlt,
          border: `1.5px solid ${theme.border}`,
          borderRadius: '12px',
          padding: '6px 12px',
          gap: '8px',
        }}>
          <Search size={16} color={theme.inkMuted} strokeWidth={2.5} />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search messages..."
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: '15px',
              fontFamily: "'Special Elite', 'Courier New', monospace",
              color: theme.ink,
              outline: 'none',
              WebkitAppearance: 'none', // Strip iOS native input styling
            }}
          />
          <AnimatePresence>
            {query && (
              <motion.button
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                onClick={() => {
                  triggerHaptic('light');
                  setQuery('');
                }}
                style={{
                  background: 'none', border: 'none', padding: 0,
                  color: theme.inkMuted, cursor: 'pointer', display: 'flex'
                }}
              >
                <XCircle size={16} color="currentColor" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Results Area */}
      <div
        className="archival-scrollbar"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          position: 'relative',
          zIndex: 2,
          contain: 'layout style paint',
        }}
      >
        {query.trim() && isSearching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: theme.inkMuted,
              fontFamily: "'Playfair Display', serif",
              fontStyle: 'italic',
              fontSize: '16px',
            }}
          >
            Consulting the archives...
          </motion.div>
        )}

        {query.trim() && !isSearching && results.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: theme.inkMuted,
              fontFamily: "'Playfair Display', serif",
              fontStyle: 'italic',
              fontSize: '16px',
            }}
          >
            No artifacts found matching "{query}"
          </motion.div>
        )}

        {results.map((m) => {
          const isMine = String(m.senderId || m.sender) === String(myId);
          const time = m.createdAt
            ? new Date(m.createdAt).toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : '';

          return (
            <button
              key={m._id}
              className="tactile-result-btn"
              onClick={() => {
                triggerHaptic('medium');
                onJumpTo(m._id);
                onClose();
              }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '16px',
                marginBottom: '12px',
                backgroundColor: theme.surface,
                border: `1px solid ${theme.border}`,
                borderLeft: `3px solid ${isMine ? theme.accent : theme.crimson}`,
                borderRadius: '12px',
                cursor: 'pointer',
                outline: 'none',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '10px',
                  fontWeight: 800,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  color: theme.inkMuted,
                  marginBottom: '8px',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}
              >
                <span>{isMine ? 'Your messages' : 'Their messages'}</span>
                <span>{time}</span>
              </div>
              
              <div
                style={{
                  fontFamily: "'Special Elite', 'Courier New', monospace",
                  fontSize: '14px',
                  color: theme.ink,
                  lineHeight: 1.5,
                  wordBreak: 'break-word',
                }}
              >
                {highlightText(m.text || '', query)}
              </div>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default SearchOverlay;
```

