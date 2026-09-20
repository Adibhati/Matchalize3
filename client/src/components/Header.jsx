import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import socket from '../utils/socket';
import NotificationDrawer from './NotificationDrawer';
import { theme as design } from '../utils/theme';
import { Bell } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

/* Locked tokens — same family as ProfileCard */
const t = {
  paper: '#fdfbf7',
  card: '#fffdf8',
  surfaceAlt: '#f4f1ea',
  lineDark: '#d4c5a9',
  ink: '#1a1a1a',
  inkSoft: '#4a4a4a',
  inkMuted: '#8c8275',
  accent: '#8b4513',
  crimson: '#8b1a1a',
  shadowWarm: 'rgba(88,63,30,0.16)',
  fontDisplay: design?.font?.heading || design?.font?.display || "'Playfair Display', Georgia, serif",
  fontBody: design?.font?.body || "'Inter', -apple-system, sans-serif",
  grain: design?.texture?.grain || '',
};

const Header = ({ onNavigate, onSelectMatch, title }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const queryClient = useQueryClient();

  const { data: unreadData, refetch } = useQuery({
    queryKey: ['unread-notifications-count'],
    queryFn: () => api.get('/notifications/unread-count'),
    refetchInterval: 30000, // Silently refetch every 30s
  });
  const unreadCount = unreadData?.count || 0;

  // Refetch when the drawer closes to update badge
  useEffect(() => {
    if (!drawerOpen) {
      refetch();
    }
  }, [drawerOpen, refetch]);

  // Real-time incoming letter listener
  useEffect(() => {
    const handleNewLetter = (data) => {
      queryClient.setQueryData(['unread-notifications-count'], (old) => ({
        ...(old || {}),
        count: (old?.count || 0) + 1,
      }));

      triggerHaptic('heavy');
      setToast(`${data?.senderName || 'An anonymous subject'} sent you a letter.`);
    };

    socket.on('new-letter', handleNewLetter);
    return () => socket.off('new-letter', handleNewLetter);
  }, [queryClient]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const toggleDrawer = () => {
    triggerHaptic('light');
    setDrawerOpen((prev) => !prev);
  };

  const handleLogoClick = () => {
    if (onNavigate) {
      triggerHaptic('light');
      onNavigate('discover');
    }
  };

  const isDiscover = !title || title === 'Discover';

  return (
    <>
      <style>{`
        .tactile-btn { transition: transform 0.15s ease-out; will-change: transform; }
        @media (hover: hover) { .tactile-btn:hover { transform: translateY(-1px); } }
        .tactile-btn:active { transform: scale(0.96) !important; }
      `}</style>

      {/* Floating paper toast — mini panel with the single crimson spine */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'fixed',
              top: 'max(16px, env(safe-area-inset-top))',
              left: '16px',
              right: '16px',
              zIndex: 1100,
              backgroundColor: t.paper,
              border: '1px solid rgba(212,197,169,0.7)',
              borderRadius: 12,
              boxShadow: `0 14px 34px ${t.shadowWarm}, 0 3px 8px rgba(88,63,30,0.08)`,
              padding: '14px 16px 14px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              overflow: 'hidden',
              pointerEvents: 'none', // Prevents blocking touches to the header below
            }}
          >
            {/* Grain film */}
            <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: `url("${t.grain}")`, mixBlendMode: 'multiply', opacity: 0.3, pointerEvents: 'none' }} />
            {/* Crimson spine — clipped by overflow, no manual corner math */}
            <div aria-hidden="true" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: t.crimson }} />
            <Bell size={18} color={t.crimson} strokeWidth={2} style={{ flexShrink: 0, position: 'relative' }} />
            <p style={{
              margin: 0, fontFamily: t.fontBody, fontSize: 13, fontWeight: 600,
              color: t.ink, lineHeight: 1.5, position: 'relative',
            }}>
              {toast}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <header style={styles.header}>
        {/* Grain film — same strength as every surface */}
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: `url("${t.grain}")`, mixBlendMode: 'multiply', opacity: 0.3, pointerEvents: 'none', zIndex: 1 }} />

        <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          {isDiscover ? (
            <div className="tactile-btn" style={styles.logoContainer} onClick={handleLogoClick}>
              <h1 style={styles.logoWordmark}>matchalize</h1>
            </div>
          ) : (
            <h1 style={styles.pageTitle}>{title}</h1>
          )}

          {isDiscover && (
            <div style={styles.rightActions}>
              <button
                className="tactile-btn"
                style={styles.bellButton}
                onClick={toggleDrawer}
                aria-label="View notifications"
                title="Letters Received"
              >
                <Bell size={18} color={t.inkSoft} strokeWidth={2} />

                {/* Crimson seal badge — pill, paper-bordered */}
                <AnimatePresence>
                  {unreadCount > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: [1, 1.1, 1] }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{
                        scale: { repeat: Infinity, duration: 3, ease: 'easeInOut' },
                        default: { type: 'spring', damping: 12, stiffness: 300 },
                      }}
                      style={styles.unreadBadge}
                    >
                      <span style={styles.badgeText}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Full-Screen Notification Drawer Overlay */}
      <AnimatePresence>
        {drawerOpen && (
          <NotificationDrawer
            onClose={() => setDrawerOpen(false)}
            onSelectMatch={(match) => {
              setDrawerOpen(false);
              if (onSelectMatch) {
                onSelectMatch(match);
              } else if (onNavigate) {
                onNavigate('chat', { matchId: match._id });
              }
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
};

/* ==================================================================
   STYLES
================================================================== */
const styles = {
  header: {
    height: '56px',
    boxSizing: 'border-box',
    padding: '0 16px',
    backgroundColor: t.paper,
    borderBottom: '1px solid rgba(212,197,169,0.7)',
    position: 'sticky',
    top: 0,
    zIndex: 500,
    boxShadow: `0 4px 16px ${t.shadowWarm}`,
    contain: 'layout style', // Isolates layout rendering
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '8px',
    cursor: 'pointer',
    userSelect: 'none',
    padding: '4px',
    margin: '-4px', // expands touch target
  },
  logoWordmark: {
    fontFamily: t.fontDisplay,
    fontSize: '20px',
    fontWeight: 900,
    color: t.ink,
    letterSpacing: '-0.02em',
    margin: 0,
    lineHeight: 1,
    textTransform: 'lowercase', // Aligned with the Splash screen style
  },
  pageTitle: {
    fontFamily: t.fontDisplay,
    fontSize: '20px',
    fontWeight: 800,
    color: t.ink,
    letterSpacing: '-0.02em',
    margin: 0,
  },
  rightActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  bellButton: {
    position: 'relative',
    backgroundColor: t.surfaceAlt,
    border: '1px solid rgba(212,197,169,0.7)',
    borderRadius: '12px',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(88,63,30,0.12)',
  },
  unreadBadge: {
    position: 'absolute',
    top: '-5px',
    right: '-5px',
    backgroundColor: t.crimson,
    minWidth: '18px',
    height: '18px',
    borderRadius: '999px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 4px',
    border: `1.5px solid ${t.paper}`,
    boxShadow: '0 2px 6px rgba(139, 26, 26, 0.3)',
    willChange: 'transform',
    zIndex: 5,
  },
  badgeText: {
    fontFamily: t.fontBody,
    fontSize: '9px',
    fontWeight: 800,
    color: '#ffffff',
    letterSpacing: '0.3px',
    lineHeight: 1,
    fontVariantNumeric: 'tabular-nums',
  },
};

export default Header;