import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../../utils/haptics';
import { api } from '../../utils/api';
import neu from '../../styles/neu';
import { ChevronLeft, Search, XCircle } from 'lucide-react';

const t = neu;

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
            backgroundColor: 'var(--n-yellow-deep)', // Archival highlighter
            color: t.ink,
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
        backgroundColor: t.paper,
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
            border-color: ${t.ink} !important;
          }
        }
        .tactile-result-btn:active {
          transform: scale3d(0.98, 0.98, 1) translate3d(0, 0, 0) !important;
          transition: transform 0.08s cubic-bezier(0, 0, 0.2, 1) !important;
        }

        .archival-scrollbar::-webkit-scrollbar { width: 4px; }
        .archival-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .archival-scrollbar::-webkit-scrollbar-thumb { background: ${t.ink}; border-radius: 4px; }
      `}</style>

      {/* Cinematic Film Grain Overlay */}
      <div 
        aria-hidden="true" 
        style={{ 
          position: 'absolute', inset: 0, 
          backgroundImage: `url("${t.grain || ''}")`, 
          mixBlendMode: 'multiply', opacity: 0.7, pointerEvents: 'none', zIndex: 0 
        }} 
      />

      {/* Sticky Archival Header */}
      <div
        style={{
          padding: 'max(12px, env(safe-area-inset-top)) 16px 12px',
          backgroundColor: t.paper,
          borderBottom: `1px solid ${t.ink}`,
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
            color: t.ink2,
            fontSize: '11px',
            fontFamily: t.fontBody,
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
          backgroundColor: t.card,
          border: `2px solid ${t.ink}`,
          borderRadius: t.radius.md,
          padding: '6px 12px',
          gap: '8px',
        }}>
          <Search size={16} color={t.ink2} strokeWidth={2.5} />
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
              fontFamily: t.fontMono,
              color: t.ink,
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
                  color: t.ink2, cursor: 'pointer', display: 'flex'
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
                color: t.ink2,
                fontFamily: t.fontHeavy,
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
                color: t.ink2,
                fontFamily: t.fontHeavy,
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
                backgroundColor: t.card,
                border: `2px solid ${t.ink}`,
                borderLeft: `4px solid ${isMine ? t.yellow : t.coral}`,
                borderRadius: t.radius.md,
                cursor: 'pointer',
                outline: 'none',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <div
                style={{
                  fontFamily: t.fontBody,
                  fontSize: '10px',
                  fontWeight: 800,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  color: t.ink2,
                  marginBottom: '8px',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}
              >
                <span>{isMine ? 'Your messages' : 'Their messages'}</span>
                <span style={{ fontFamily: t.fontMono }}>{time}</span>
              </div>
              
              <div
                style={{
                  fontFamily: t.fontMono,
                  fontSize: '14px',
                  color: t.ink,
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