import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../utils/api';
import { toast } from '../utils/toast';
import { useAuth } from '../utils/AuthContext';
import socket from '../utils/socket';
import { theme as design } from '../utils/theme';
import { SkeletonBox } from '../components/Skeleton';
import { Heart, MoreVertical, Search } from 'lucide-react';

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
      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: design.color.bg, padding: '16px 24px' }}>
        <h2 style={{ fontFamily: design.font.display, fontSize: '24px', color: design.color.ink, marginBottom: '24px', marginTop: '8px' }}>
          Your Connections
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: design.color.surface, border: `1px solid ${design.color.borderDark}`, borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <SkeletonBox width="60px" height="60px" radius="12px" />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <SkeletonBox width="120px" height="18px" />
                <SkeletonBox width="180px" height="14px" />
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
        flexDirection: 'column', gap: '16px', padding: '32px', backgroundColor: design.color.bg
      }}>
        <div style={{ width: '72px', height: '72px', borderRadius: design.radius.md, backgroundColor: design.color.surface, border: `1px solid ${design.color.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(139,69,19,0.08)' }}>
          <Heart size={32} style={{ opacity: 0.4, color: design.color.accent || '#8b4513' }} />
        </div>
        <p style={{ fontFamily: design.font.display, fontSize: '22px', color: design.color.ink, textAlign: 'center', margin: 0, fontWeight: 700 }}>
          No connections yet
        </p>
        <p style={{ fontFamily: design.font.body, fontSize: '14px', color: design.color.inkMuted, textAlign: 'center', maxWidth: '280px', margin: 0, lineHeight: 1.5 }}>
          Say hello 👋 — start exploring and leave a flower to begin your story.
        </p>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', backgroundColor: design.color.bg, padding: '16px 24px' }}>
      {/* GPU-Promoted Zero-Lag Card & Input Interactions */}
      <style>{`
        .match-card {
          will-change: transform, box-shadow;
          transition: transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), border-color 0.2s ease, background-color 0.2s ease;
          contain: layout style;
        }

        @media (hover: hover) {
          .match-card:hover {
            transform: translate3d(0, -3px, 0) scale3d(1.01, 1.01, 1);
            box-shadow: 0 10px 24px rgba(26, 26, 26, 0.08), 0 2px 8px rgba(139, 69, 19, 0.06);
            border-color: ${design.color.accent || '#8b4513'};
            z-index: 2;
          }
        }

        .match-card:active {
          transform: scale3d(0.985, 0.985, 1) translate3d(0, 0, 0) !important;
          transition: transform 0.08s cubic-bezier(0, 0, 0.2, 1) !important;
        }

        .search-container {
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        @media (prefers-reduced-motion: reduce) {
          .match-card, .search-container {
            transition: none !important;
            transform: none !important;
          }
        }
      `}</style>

      <h2 style={{ fontFamily: design.font.display, fontSize: '26px', color: design.color.ink, marginBottom: '20px', marginTop: '8px', fontWeight: 700, letterSpacing: '-0.02em' }}>
        Your Connections
      </h2>

      {/* Accessible Search Input with Tactile Focus State */}
      <div 
        className="search-container"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '0 16px',
          marginBottom: '20px',
          backgroundColor: design.color.surface,
          border: `1px solid ${isFocused ? (design.color.accent || '#8b4513') : design.color.border}`,
          borderRadius: design.radius.md,
          boxShadow: isFocused ? '0 4px 12px rgba(139, 69, 19, 0.08)' : '0 2px 4px rgba(0,0,0,0.02)',
        }}
      >
        <Search size={18} color={isFocused ? (design.color.accent || '#8b4513') : design.color.inkMuted} style={{ transition: 'color 0.2s ease' }} />
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
            padding: '14px 0',
            backgroundColor: 'transparent',
            border: 'none',
            fontFamily: design.font.body,
            fontSize: '14px',
            color: design.color.ink,
            outline: 'none',
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filtered.map((match) => {
          const user = match.user;
          if (!user) return null;

          const lastMessage = match.lastMessage;
          const unread =
            match.yourTurn ||
            (lastMessage && lastMessage.senderId && lastMessage.senderId !== myId && !lastMessage.readAt);
          const isOpen = openMenuId === match._id;

          return (
            <div
              key={match._id}
              className="match-card"
              role="button"
              tabIndex={0}
              onClick={() => onOpenChat(match)}
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
                gap: '16px',
                backgroundColor: unread ? 'rgba(139, 69, 19, 0.03)' : design.color.surface,
                border: `1px solid ${unread ? 'rgba(139, 69, 19, 0.3)' : design.color.borderDark}`,
                borderRadius: '12px',
                padding: '14px 16px',
                boxShadow: unread ? '0 4px 12px rgba(139, 69, 19, 0.06)' : '0 2px 6px rgba(0,0,0,0.03)',
                cursor: 'pointer',
              }}
            >
              <img
                src={user.photos?.[0] || 'https://via.placeholder.com/80'}
                alt={user.name}
                loading="lazy"
                decoding="async"
                style={{ width: '56px', height: '56px', borderRadius: design.radius.md, objectFit: 'cover', border: `1px solid ${design.color.border}`, flexShrink: 0 }}
              />
              
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <p style={{ fontFamily: design.font.display, fontSize: '16px', fontWeight: unread ? 700 : 600, color: design.color.ink, margin: 0, letterSpacing: '-0.01em' }}>
                    {user.name}, {user.age}
                  </p>
                  {unread && (
                    <span 
                      aria-label="Unread message"
                      style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: design.color.crimson, flexShrink: 0, boxShadow: '0 0 0 3px rgba(185, 28, 28, 0.15)' }} 
                    />
                  )}
                </div>
                <p style={{ fontFamily: design.font.body, fontSize: '13px', color: unread ? design.color.ink : design.color.inkMuted, margin: '4px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: unread ? 600 : 400 }}>
                  {lastMessage ? lastMessage.text : 'Say hello 👋'}
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                <span style={{ fontFamily: design.font.body, fontSize: '11px', color: unread ? design.color.accent : design.color.inkMuted, fontWeight: unread ? 600 : 400, whiteSpace: 'nowrap' }}>
                  {lastMessage ? fmtTime(lastMessage.createdAt) : `Matched ${timeAgo(match.createdAt)}`}
                </span>
                <button
                  type="button"
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setOpenMenuId(isOpen ? null : match._id); 
                  }}
                  style={{ background: 'none', border: 'none', color: design.color.inkMuted, cursor: 'pointer', padding: '4px', margin: '-4px', display: 'flex', alignItems: 'center', borderRadius: '4px' }}
                  aria-label="More options"
                  title="More options"
                >
                  <MoreVertical size={18} />
                </button>
              </div>

              {/* AnimatePresence restores smooth exit transitions for the contextual menu */}
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
                      initial={{ opacity: 0, scale: 0.95, y: -6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -6 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      style={{ position: 'absolute', top: '48px', right: '16px', backgroundColor: design.color.surface, border: `1px solid ${design.color.border}`, borderRadius: design.radius.md, boxShadow: '0 12px 32px rgba(0,0,0,0.18)', zIndex: 100, overflow: 'hidden', minWidth: '160px' }}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnmatch(match._id);
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '12px 16px', background: 'none', border: 'none', fontFamily: design.font.body, fontSize: '13px', fontWeight: 600, color: design.color.crimson, cursor: 'pointer', textAlign: 'left', transition: 'background-color 0.15s ease' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(185, 28, 28, 0.05)'}
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
  );
};

export default Matches;