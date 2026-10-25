import React, { useState, useEffect, useMemo, useCallback } from 'react';
import neu from '../styles/neu';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../utils/api';
import { toast } from '../utils/toast';
import { useAuth } from '../utils/AuthContext';
import socket from '../utils/socket';
import { Heart, MoreVertical, Search, X } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { DECK_CONTENT_TOP } from '../utils/deckChrome';

/* The shared neo-brutalist canon (src/styles/neu.js) */
const t = neu;

const MATCHES_CSS = `
  .match-card { will-change: transform;
    transition: transform .08s steps(2), box-shadow .08s steps(2), background .08s steps(2);
    contain: layout style; }
  .match-card:active { transform: translate(3px, 3px) !important; box-shadow: 0 0 0 #191919 !important; }

  .match-menu-btn { display: flex; align-items: center; gap: 8px; width: 100%;
    padding: 11px 12px; background: none; border: none; cursor: pointer; text-align: left;
    font-family: ${t.fontMono}; font-size: 12px; font-weight: 700; letter-spacing: .1em;
    text-transform: uppercase; color: ${t.red}; border-radius: 8px; transition: none; }
  .match-menu-btn:active { background: ${t.red}; color: #fff; }

  .match-search input::placeholder { color: ${t.ink3}; opacity: 1; }
  .match-search:focus-within { border-color: ${t.ink} !important; box-shadow: 3px 3px 0 ${t.ink}; }

  @media (hover: hover) and (pointer: fine) {
    .match-card:hover { transform: translate(-1px, -1px);
      box-shadow: 6px 6px 0 #191919; }
    .match-menu-btn:hover { background: rgba(229,72,77,.08); }
    .match-clear:hover { background: ${t.hair}; }
  }

  .match-card:focus-visible, .match-menu-btn:focus-visible, .match-clear:focus-visible {
    outline: 3px solid ${t.yellow}; outline-offset: 2px; }

  @media (prefers-reduced-motion: reduce) {
    .match-card { transition: none !important; transform: none !important; }
  }
`;

const Matches = ({ onOpenChat, compact = false }) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [isFocused, setIsFocused] = useState(false);

  const { user } = useAuth();
  const myId = user?._id;

  const { data, isLoading } = useQuery({
    queryKey: ['matches'],
    queryFn: () => api.get('/alignments'),
  });

  const matches = useMemo(() => data?.matches || [], [data]);

  // WhatsApp-style real-time updates: bump the match to the top and refresh its preview
  useEffect(() => {
    const onNew = (msg) => {
      queryClient.setQueryData(['matches'], (old) => {
        if (!old?.matches) return old;
        const list = [...old.matches];
        const idx = list.findIndex((m) => m._id === msg.alignmentId);
        if (idx === -1) return old;
        const m = list[idx];
        const updated = {
          ...m,
          lastMessage: {
            text: msg.text,
            senderId: msg.senderId,
            createdAt: msg.createdAt,
            readAt: msg.readAt ?? null,
            type: msg.type,
            image: msg.image,
          },
          yourTurn: msg.senderId !== myId,
        };
        list.splice(idx, 1);
        list.unshift(updated);
        return { ...old, matches: list };
      });
    };
    socket.on('new-message', onNew);
    return () => socket.off('new-message', onNew);
  }, [queryClient, myId]);

  const handleUnmatch = useCallback(async (alignmentId) => {
    setOpenMenuId(null);
    if (!window.confirm('Are you sure you want to unmatch? This cannot be undone.')) return;
    try {
      await api.delete(`/alignments/${alignmentId}`);
      queryClient.setQueryData(['matches'], (old) => ({
        ...(old || {}),
        matches: (old?.matches || []).filter((m) => m._id !== alignmentId),
      }));
    } catch (err) {
      if (!err?.toasted) toast.error('Could not unmatch. Try again.');
    }
  }, [queryClient]);

  const fmtTime = useCallback((ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return 'now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 172800) return 'Yesterday';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }, []);

  const timeAgo = useCallback((ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 3600) return `${Math.floor(Math.max(diff, 1) / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }, []);

  // Memoized filter to avoid recalculating string matching during high-frequency socket events
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return matches;
    return matches.filter((m) => m.user?.name?.toLowerCase().includes(query));
  }, [matches, search]);
  const contentPadding = compact ? '12px 14px 16px' : `calc(${DECK_CONTENT_TOP} + 8px) 14px 16px`;

  if (isLoading) {
    return null;
  }

  if (matches.length === 0) {
    return (
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 16, padding: 32, backgroundColor: t.desk,
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16, backgroundColor: t.coral,
          border: `2px solid ${t.ink}`, boxShadow: `4px 4px 0 ${t.ink}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4,
        }}>
          <Heart size={24} strokeWidth={2.6} color={t.ink} />
        </div>
        <p style={{ fontFamily: t.fontHeavy, fontSize: 21, color: t.paper, textAlign: 'center', margin: 0, letterSpacing: '-.01em', textTransform: 'uppercase' }}>
          No letters yet
        </p>
        <p style={{ fontFamily: t.fontBody, fontSize: 13.5, fontWeight: 500, color: t.ink3, textAlign: 'center', maxWidth: 280, margin: 0, lineHeight: 1.6 }}>
          Start exploring and leave a flower to begin your story.
        </p>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', backgroundColor: t.desk, padding: contentPadding, position: 'relative' }}>
      <style>{MATCHES_CSS}</style>

      <div style={{ position: 'relative' }}>
        {/* Search — chunky box, ink border, shadow on focus. The tab heading now
            comes from the floating Header row, so no in-page title here. */}
        <div
          className="match-search"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '0 14px',
            marginBottom: 6,
            backgroundColor: t.paper,
            border: `2px solid ${t.ink}`,
            borderRadius: 12,
            boxShadow: isFocused ? `3px 3px 0 ${t.ink}` : 'none',
            transition: 'box-shadow .08s steps(2)',
          }}
        >
          <Search size={15} strokeWidth={2.6} color={isFocused ? t.ink : t.ink3} style={{ transition: 'color 0.15s ease', flexShrink: 0 }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Search letters..."
            aria-label="Search letters"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '12px 0',
              backgroundColor: 'transparent',
              border: 'none',
              fontFamily: t.fontBody,
              fontSize: 13.5,
              fontWeight: 500,
              color: t.ink,
              outline: 'none',
            }}
          />
          {search && (
            <button
              type="button"
              className="match-clear"
              onClick={() => { triggerHaptic('light'); setSearch(''); }}
              aria-label="Clear search"
              style={{ background: 'none', border: 'none', color: t.ink2, cursor: 'pointer', display: 'flex', padding: 6, margin: -6, borderRadius: 6, flexShrink: 0 }}
            >
              <X size={14} strokeWidth={2.6} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map((match) => {
            const user = match.user;
            if (!user) return null;

            const lastMessage = match.lastMessage;
            const unread =
              match.yourTurn ||
              (lastMessage && lastMessage.senderId && lastMessage.senderId !== myId && !lastMessage.readAt);
            const isOpen = openMenuId === match._id;

            const lastIsMedia = lastMessage?.type === 'image';

            return (
              <div
                key={match._id}
                className="match-card"
                role="button"
                tabIndex={0}
                onClick={() => { triggerHaptic('light'); onOpenChat(match); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onOpenChat(match);
                  }
                }}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  backgroundColor: unread ? t.card : t.paper,
                  border: `2px solid ${t.ink}`,
                  borderRadius: 16,
                  boxShadow: unread ? `5px 5px 0 ${t.ink}` : `4px 4px 0 ${t.ink}`,
                  padding: '14px 16px',
                  cursor: 'pointer',
                }}
              >
                {/* Avatar — square-ish tile, ink border; unread gets the yellow ring */}
                <img
                  src={user.photos?.[0] || 'https://placehold.co/80/fff3dc/191919?text=%C2%B7'}
                  alt={user.name}
                  loading="lazy"
                  decoding="async"
                  style={{
                    width: 56, height: 56, borderRadius: 12, objectFit: 'cover',
                    border: `2px solid ${t.ink}`, backgroundColor: t.hair, flexShrink: 0,
                    outline: unread ? `3px solid ${t.yellow}` : 'none', outlineOffset: 1,
                  }}
                />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <p style={{ fontFamily: t.fontBody, fontSize: 15, fontWeight: unread ? 800 : 600, color: t.ink, margin: 0 }}>
                      {user.name}{user.age ? <span style={{ fontWeight: 500, color: t.ink3 }}>, {user.age}</span> : null}
                    </p>
                    {unread && (
                      <span
                        aria-label="Unread message"
                        style={{
                          width: 10, height: 10, borderRadius: '50%',
                          backgroundColor: t.coral, border: `1.5px solid ${t.ink}`,
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </div>
                  <p style={{ fontFamily: t.fontBody, fontSize: 12.5, color: unread ? t.ink : t.ink2, margin: '4px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: unread ? 700 : 500 }}>
                    {lastMessage
                      ? lastIsMedia
                        ? '📷 Sent a photograph'
                        : lastMessage.text || 'Message unavailable'
                      : 'Open chat'}
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                  <span style={{
                    fontFamily: t.fontMono, fontSize: 9.5, fontWeight: 700, letterSpacing: '.06em',
                    color: unread ? t.ink : t.ink3,
                    background: unread ? t.yellow : 'transparent',
                    border: unread ? `1.5px solid ${t.ink}` : 'none',
                    borderRadius: 5, padding: unread ? '2px 6px' : 0,
                    whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums',
                  }}>
                    {lastMessage ? fmtTime(lastMessage.createdAt) : `Aligned ${timeAgo(match.createdAt)}`}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHaptic('light');
                      setOpenMenuId(isOpen ? null : match._id);
                    }}
                    style={{
                      background: isOpen ? t.ink : 'transparent',
                      color: isOpen ? t.paper : t.ink3,
                      border: `1.5px solid ${isOpen ? t.ink : t.hair}`,
                      cursor: 'pointer', padding: 3, display: 'flex', alignItems: 'center',
                      borderRadius: 7,
                    }}
                    aria-label="More options"
                    aria-expanded={isOpen}
                    title="More options"
                  >
                    <MoreVertical size={15} strokeWidth={2.4} />
                  </button>
                </div>

                {/* Contextual menu — chunky card, slam language */}
                <AnimatePresence>
                  {isOpen && (
                    <>
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(null);
                        }}
                        style={{ position: 'fixed', inset: 0, zIndex: 90, cursor: 'default' }}
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.94, y: -6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.94, y: -6 }}
                        transition={{ duration: 0.13, ease: 'easeOut' }}
                        style={{
                          position: 'absolute', top: 50, right: 16, zIndex: 100, overflow: 'hidden',
                          minWidth: 150, padding: 5,
                          backgroundColor: t.paper, border: `2px solid ${t.ink}`,
                          borderRadius: 12, boxShadow: `5px 5px 0 ${t.ink}`,
                        }}
                      >
                        <button
                          type="button"
                          className="match-menu-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnmatch(match._id);
                          }}
                        >
                          Unmatch
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Matches;