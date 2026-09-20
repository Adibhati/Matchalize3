import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../utils/api';
import { toast } from '../utils/toast';
import { useAuth } from '../utils/AuthContext';
import socket from '../utils/socket';
import { theme as design } from '../utils/theme';
import { SkeletonBox } from '../components/Skeleton';
import { Heart, MoreVertical, Search, X } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

/* Locked tokens — same family as ProfileCard */
const t = {
  desk: '#ece4d4',
  paper: '#fdfbf7',
  card: '#fffdf8',
  surfaceAlt: '#f4f1ea',
  lineDark: '#d4c5a9',
  ink: '#1a1a1a',
  inkSoft: '#4a4a4a',
  inkMuted: '#8c8275',
  accent: '#8b4513',
  crimson: '#8b1a1a',
  fontDisplay: design?.font?.heading || "'Playfair Display', Georgia, serif",
  fontBody: design?.font?.body || "'Inter', -apple-system, sans-serif",
  fontType: "'Special Elite', 'Courier New', monospace",
  grain: design?.texture?.grain || '',
};

const Matches = ({ onOpenChat }) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [isFocused, setIsFocused] = useState(false);

  const { user } = useAuth();
  const myId = user?._id;

  const { data, isLoading } = useQuery({
    queryKey: ['matches'],
    queryFn: () => api.get('/matches'),
  });

  const matches = useMemo(() => data?.matches || [], [data]);

  // WhatsApp-style real-time updates: bump the match to the top and refresh its preview
  useEffect(() => {
    const onNew = (msg) => {
      queryClient.setQueryData(['matches'], (old) => {
        if (!old?.matches) return old;
        const list = [...old.matches];
        const idx = list.findIndex((m) => m._id === msg.matchId);
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

  // Real-time unmatch: remove the match from cache when the other user severs the connection
  useEffect(() => {
    const onUnmatch = ({ matchId }) => {
      queryClient.setQueryData(['matches'], (old) => ({
        ...(old || {}),
        matches: (old?.matches || []).filter((m) => m._id !== matchId),
      }));
    };
    socket.on('unmatch-notification', onUnmatch);
    return () => socket.off('unmatch-notification', onUnmatch);
  }, [queryClient]);

  const handleUnmatch = useCallback(async (matchId) => {
    setOpenMenuId(null);
    if (!window.confirm('Are you sure you want to unmatch? This cannot be undone.')) return;
    try {
      await api.delete(`/matches/${matchId}`);
      queryClient.setQueryData(['matches'], (old) => ({
        ...(old || {}),
        matches: (old?.matches || []).filter((m) => m._id !== matchId),
      }));
    } catch (err) {
      toast.error('Failed to sever this connection. Please try again.');
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

  if (isLoading) {
    return (
      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: t.desk, padding: '16px 14px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, backgroundColor: t.paper, border: '1px solid rgba(212,197,169,0.7)', borderRadius: 18, padding: 16, boxShadow: '0 14px 34px rgba(88,63,30,0.16), 0 3px 8px rgba(88,63,30,0.08)' }}>
              <SkeletonBox width={56} height={56} radius="50%" />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <SkeletonBox width={120} height={14} />
                <SkeletonBox width={180} height={11} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 16, padding: 32, backgroundColor: t.desk,
      }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: t.surfaceAlt, border: '1px solid rgba(212,197,169,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Heart size={18} strokeWidth={2} color={t.accent} />
        </div>
        <p style={{ fontFamily: t.fontDisplay, fontSize: 22, color: t.ink, textAlign: 'center', margin: 0, fontWeight: 800, letterSpacing: '-0.02em' }}>
          No connections yet
        </p>
        <p style={{ fontFamily: t.fontBody, fontSize: 13.5, fontWeight: 450, color: t.inkMuted, textAlign: 'center', maxWidth: 280, margin: 0, lineHeight: 1.6 }}>
          Start exploring and leave a flower to begin your story.
        </p>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', backgroundColor: t.desk, padding: '16px 14px' }}>
      {/* Grain film */}
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, backgroundImage: `url("${t.grain}")`, mixBlendMode: 'multiply', opacity: 0.3, pointerEvents: 'none', zIndex: 0 }} />

      <style>{`
        .match-card {
          will-change: transform;
          transition: transform 0.15s ease-out, box-shadow 0.2s ease;
          contain: layout style;
        }
        @media (hover: hover) {
          .match-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 18px 40px rgba(88,63,30,0.2), 0 4px 12px rgba(88,63,30,0.1);
          }
        }
        .match-card:active {
          transform: scale(0.98) !important;
          transition: transform 0.08s ease-out !important;
        }
        @media (prefers-reduced-motion: reduce) {
          .match-card { transition: none !important; transform: none !important; }
        }
      `}</style>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <h2 style={{ fontFamily: t.fontDisplay, fontSize: 24, color: t.ink, marginBottom: 16, marginTop: 4, fontWeight: 800, letterSpacing: '-0.02em' }}>
          Your Connections
        </h2>

        {/* Search — box-tier input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '0 14px',
            marginBottom: 18,
            backgroundColor: t.paper,
            border: `1px solid ${isFocused ? 'rgba(139,69,19,0.45)' : 'rgba(212,197,169,0.7)'}`,
            borderRadius: 6,
            transition: 'border-color 0.2s ease',
          }}
        >
          <Search size={14} strokeWidth={2} color={isFocused ? t.accent : t.inkMuted} style={{ transition: 'color 0.2s ease', flexShrink: 0 }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Search connections..."
            aria-label="Search connections"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '12px 0',
              backgroundColor: 'transparent',
              border: 'none',
              fontFamily: t.fontBody,
              fontSize: 13.5,
              color: t.ink,
              outline: 'none',
            }}
          />
          {search && (
            <button
              type="button"
              onClick={() => { triggerHaptic('light'); setSearch(''); }}
              aria-label="Clear search"
              style={{ background: 'none', border: 'none', color: t.inkMuted, cursor: 'pointer', display: 'flex', padding: 4, flexShrink: 0 }}
            >
              <X size={14} strokeWidth={2} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((match) => {
            const user = match.user;
            if (!user) return null;

            const lastMessage = match.lastMessage;
            const unread =
              match.yourTurn ||
              (lastMessage && lastMessage.senderId && lastMessage.senderId !== myId && !lastMessage.readAt);
            const isOpen = openMenuId === match._id;

            const lastIsMedia = lastMessage && (lastMessage.type === 'image' || lastMessage.type === 'audio');

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
                  border: `1px solid ${unread ? 'rgba(139,69,19,0.35)' : 'rgba(212,197,169,0.7)'}`,
                  borderRadius: 18,
                  padding: '14px 16px',
                  boxShadow: '0 14px 34px rgba(88,63,30,0.16), 0 3px 8px rgba(88,63,30,0.08)',
                  cursor: 'pointer',
                }}
              >
                {/* Avatar — circular with hairline ring, matching every other avatar in the app */}
                <img
                  src={user.photos?.[0] || 'https://via.placeholder.com/80'}
                  alt={user.name}
                  loading="lazy"
                  decoding="async"
                  style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(212,197,169,0.9)', backgroundColor: t.surfaceAlt, flexShrink: 0 }}
                />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <p style={{ fontFamily: t.fontBody, fontSize: 15, fontWeight: unread ? 700 : 600, color: t.ink, margin: 0 }}>
                      {user.name}{user.age ? <span style={{ fontWeight: 400, color: t.inkMuted }}>, {user.age}</span> : null}
                    </p>
                    {unread && (
                      <span
                        aria-label="Unread message"
                        style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: t.crimson, flexShrink: 0, boxShadow: '0 0 0 3px rgba(139,26,26,0.12)' }}
                      />
                    )}
                  </div>
                  <p style={{ fontFamily: t.fontType, fontSize: 12.5, color: unread ? t.inkSoft : t.inkMuted, margin: '4px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: unread ? 700 : 400 }}>
                    {lastMessage
                      ? lastIsMedia
                        ? (lastMessage.type === 'image' ? 'Sent a photograph' : 'Sent a voice note')
                        : lastMessage.text
                      : 'Say hello'}
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                  <span style={{ fontFamily: t.fontType, fontSize: 10.5, color: unread ? t.accent : t.inkMuted, fontWeight: unread ? 700 : 400, whiteSpace: 'nowrap' }}>
                    {lastMessage ? fmtTime(lastMessage.createdAt) : `Matched ${timeAgo(match.createdAt)}`}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHaptic('light');
                      setOpenMenuId(isOpen ? null : match._id);
                    }}
                    style={{ background: 'none', border: 'none', color: t.inkMuted, cursor: 'pointer', padding: 4, margin: -4, display: 'flex', alignItems: 'center', borderRadius: 4 }}
                    aria-label="More options"
                    title="More options"
                  >
                    <MoreVertical size={16} strokeWidth={2} />
                  </button>
                </div>

                {/* Contextual menu */}
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
                        initial={{ opacity: 0, scale: 0.96, y: -6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: -6 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        style={{ position: 'absolute', top: 48, right: 16, backgroundColor: t.paper, border: '1px solid rgba(212,197,169,0.7)', borderRadius: 8, boxShadow: '0 12px 28px rgba(88,63,30,0.22)', zIndex: 100, overflow: 'hidden', minWidth: 150, padding: 6 }}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnmatch(match._id);
                          }}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 12px', background: 'none', border: 'none', fontFamily: t.fontBody, fontSize: 12, fontWeight: 800, color: t.crimson, cursor: 'pointer', textAlign: 'left', borderRadius: 5, transition: 'background-color 0.15s ease' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(139, 26, 26, 0.05)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
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