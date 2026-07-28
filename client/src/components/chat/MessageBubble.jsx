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
      onTouchStart={startPress} onTouchEnd={cancelPress} onTouchMove={cancelPress}
      onMouseDown={startPress} onMouseUp={cancelPress} onMouseLeave={cancelPress}
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
          backgroundColor: isMine ? 'rgba(139, 69, 19, 0.05)' : theme.surface, 
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
          boxShadow: `0 2px 6px ${theme.shadowWarm}`
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
        boxShadow: `0 6px 16px ${theme.shadowWarm}, inset 0 2px 4px rgba(255,255,255,0.4)`, 
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
              backgroundColor: 'rgba(224, 216, 200, 0.9)', 
              backdropFilter: 'blur(2px)',
              border: `1px solid rgba(139, 69, 19, 0.15)`,
              boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
              transform: `rotate(${isMine ? '4deg' : '-4deg'})`,
              zIndex: 2,
            }} 
          />
        )}
      </div>

      {/* Reaction Cluster */}
      {Object.keys(reactionGroups).length > 0 && (
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
                boxShadow: `0 2px 6px ${theme.shadowWarm}` 
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
            color: message.read ? '#2e7d32' : theme.accent, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px',
            transition: 'color 0.3s ease'
          }}>
            {message.read ? <CheckCheck size={12} strokeWidth={2.5} /> : <Check size={12} strokeWidth={2.5} />} 
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
    prev.message.read === next.message.read &&
    prev.message.deleted === next.message.deleted &&
    prev.receipt === next.receipt &&
    JSON.stringify(prev.message.reactions) === JSON.stringify(next.message.reactions)
  );
};

export default memo(MessageBubble, areEqual);