import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../../utils/haptics';
import { theme as design } from '../../utils/theme';
import { ChevronLeft, Search, XCircle } from 'lucide-react';

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

const SearchOverlay = ({ messages, myId, onClose, onJumpTo }) => {
  const [query, setQuery] = useState('');

  // Memoized Search Engine
  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return messages
      .filter((m) => !m.deleted && m.text && m.text.toLowerCase().includes(q))
      .slice(-50) // Cap at 50 results for optimal render performance
      .reverse(); // Show most recent matches first
  }, [query, messages]);

  // Utility to safely highlight ALL occurrences of the search query
  const highlightText = (text, highlight) => {
    if (!highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === highlight.toLowerCase() ? (
        <mark
          key={i}
          style={{
            backgroundColor: 'rgba(212, 175, 55, 0.35)', // Archival highlighter
            color: theme.ink,
            padding: '0 2px',
            borderRadius: '2px',
            boxShadow: '0 1px 2px rgba(212, 175, 55, 0.2)',
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
          transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.2s ease, border-color 0.2s ease;
          will-change: transform;
        }
        @media (hover: hover) {
          .tactile-result-btn:hover {
            transform: translate3d(0, -2px, 0) scale3d(1.01, 1.01, 1);
            box-shadow: 0 6px 16px ${theme.shadowWarm} !important;
            border-color: ${theme.borderDark} !important;
          }
        }
        .tactile-result-btn:active {
          transform: scale3d(0.98, 0.98, 1) translate3d(0, 0, 0) !important;
          transition: transform 0.08s cubic-bezier(0, 0, 0.2, 1) !important;
          box-shadow: 0 2px 4px rgba(0,0,0,0.06) !important;
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
          boxShadow: `0 4px 16px ${theme.shadowWarm}`,
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
            placeholder="Search archival logs..."
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
        {query.trim() && results.length === 0 && (
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
                boxShadow: `0 2px 8px ${theme.shadowWarm}`,
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
                <span>{isMine ? 'Your Log' : 'Their Log'}</span>
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