import React, { useRef, useState, memo } from 'react';
import { motion } from 'framer-motion';
import { triggerHaptic } from '../../utils/haptics';
import { Check, CheckCheck } from 'lucide-react';
import PolaroidCard from '../PolaroidCard';
import neu from '../../styles/neu';

const t = neu;

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
    if (message.deleted) {
      return (
        <span style={{ fontStyle: 'italic', color: t.ink3, fontSize: '13px', fontFamily: t.fontBody }}>
          This artifact was removed.
        </span>
      );
    }
    if (message.type !== 'text' && message.type !== 'opening_letter') {
      return (
        <span style={{ fontStyle: 'italic', color: t.ink3, fontSize: '13px', fontFamily: t.fontBody }}>
          This message type is no longer available.
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
      onTouchCancel={message.deleted ? undefined : cancelPress}
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
          backgroundColor: isMine ? 'var(--n-yellow-deep)' : t.paper, 
          border: `1px solid ${t.ink}`, 
          borderLeft: `3px solid ${t.yellow}`, 
          borderRadius: t.radius.sm, 
          fontSize: '12px', 
          color: t.ink2, 
          fontFamily: t.fontBody, 
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
        borderRadius: t.radius.md, 
        backgroundColor: isMine ? t.card : t.paper, 
        border: `2px solid ${t.ink}`, 
        boxShadow: isMine ? t.shadow.sm : 'none',
        color: t.ink, 
        fontFamily: t.fontMono, 
        fontSize: '15px', 
        lineHeight: '1.5', 
        wordBreak: 'break-word', 
        position: 'relative',
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
              backgroundColor: 'var(--n-paper)', 
              backdropFilter: 'blur(2px)',
              border: `1px solid ${t.yellow}`,
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
                backgroundColor: t.paper, 
                border: `1px solid ${t.ink}`, 
                borderRadius: t.radius.pill, 
                fontSize: '14px', 
                lineHeight: 1,
              }}
            >
              <span>{emoji}</span>
              {users.length > 1 && (
                <span style={{ 
                  fontFamily: t.fontBody, 
                  fontSize: '11px', 
                  fontWeight: 700, 
                  color: t.ink3 
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
        fontFamily: t.fontBody, 
        fontWeight: 700, 
        letterSpacing: '1px', 
        color: t.ink3, 
        display: 'flex', 
        gap: '8px', 
        alignItems: 'center', 
        textTransform: 'uppercase' 
      }}>
        <span style={{ fontFamily: t.fontMono }}>{time}</span>
        {receipt && (
          <span style={{ 
            color: message.readAt ? t.green : t.yellow, 
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