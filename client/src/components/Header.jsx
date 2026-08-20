import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import socket from '../utils/socket';
import NotificationDrawer from './NotificationDrawer';
import { theme as design } from '../utils/theme';
import { Bell } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

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
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
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
      {/* GPU Promoted Tactile Physics */}
      <style>{`
        .tactile-btn { transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.2s ease, opacity 0.2s ease; will-change: transform; }
        @media (hover: hover) { .tactile-btn:hover { transform: translate3d(0, -2px, 0) scale3d(1.04, 1.04, 1); } }
        .tactile-btn:active { transform: scale3d(0.92, 0.92, 1) translate3d(0, 0, 0) !important; transition: transform 0.08s cubic-bezier(0, 0, 0.2, 1) !important; }
      `}</style>

      {/* Floating Archival Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: -100, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -100, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'fixed',
              top: 'max(16px, env(safe-area-inset-top))',
              left: '16px',
              right: '16px',
              zIndex: 1100,
              backgroundColor: design.color.surface,
              backgroundImage: `url("${design?.texture?.grain || ''}")`,
              border: `1.5px solid ${design.color.borderDark}`,
              borderRadius: design?.radius?.md || '12px',
              boxShadow: `0 12px 32px ${design.color.shadowWarm}`,
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              pointerEvents: 'none', // Prevents blocking touches to the header below
            }}
          >
            <div style={{
              width: '4px', height: '100%', position: 'absolute', left: 0, top: 0, bottom: 0,
              backgroundColor: design.color.crimson, borderRadius: '12px 0 0 12px'
            }} />
            <Bell size={20} color={design.color.crimson} style={{ flexShrink: 0, marginLeft: '8px' }} />
            <p style={{
              margin: 0, fontFamily: design.font.body, fontSize: '13px', fontWeight: 600,
              color: design.color.ink, lineHeight: 1.4,
            }}>
              {toast}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <header style={styles.header}>
        {/* Subtle Paper Grain Overlay */}
        <div aria-hidden="true" style={styles.paperGrain} />

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
                <Bell size={17} color={design.color.inkSoft || '#4a4a4a'} strokeWidth={2.5} />

                {/* Animated Crimson Wax-Seal Badge */}
                <AnimatePresence>
                  {unreadCount > 0 && (
                    <motion.div
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: [1, 1.1, 1], rotate: 0 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{
                        scale: { repeat: Infinity, duration: 3, ease: 'easeInOut' },
                        default: { type: 'spring', damping: 12, stiffness: 300 }
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

      {/* Archival Stitch Seam Divider */}
      <div aria-hidden="true" style={styles.stitchSeam} />

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
    height: '45px',
    boxSizing: 'border-box',
    padding: '0 20px',
    backgroundColor: design.color.paper,
    position: 'sticky',
    top: 0,
    zIndex: 500,
    boxShadow: `0 4px 16px ${design.color.shadowWarm}`,
    contain: 'layout style', // Isolates layout rendering
  },
  paperGrain: {
    position: 'absolute',
    inset: 0,
    backgroundImage: `url("${design?.texture?.grain || ''}")`,
    mixBlendMode: 'multiply',
    opacity: 0.85,
    pointerEvents: 'none',
    zIndex: 1,
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
    fontFamily: design?.font?.display || "'Playfair Display', serif",
    fontSize: '20px',
    fontWeight: 900,
    color: design.color.ink,
    letterSpacing: '-0.03em',
    margin: 0,
    lineHeight: 1,
    textTransform: 'lowercase', // Aligned with the Splash screen style
  },
  pageTitle: {
    fontFamily: design?.font?.display || "'Playfair Display', serif",
    fontSize: '20px',
    fontWeight: 800,
    color: design.color.ink,
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
    backgroundColor: design.color.surface,
    border: `1.5px solid ${design.color.borderDark}`,
    borderRadius: design?.radius?.sm || '8px',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: `0 2px 8px ${design.color.shadowWarm}`,
  },
  unreadBadge: {
    position: 'absolute',
    top: '-5px',
    right: '-5px',
    backgroundColor: design.color.crimson,
    minWidth: '17px',
    height: '17px',
    borderRadius: '9px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 3px',
    border: `1.5px solid ${design.color.paper}`,
    boxShadow: '0 2px 6px rgba(139, 26, 26, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.25)',
    willChange: 'transform',
    zIndex: 5,
  },
  badgeText: {
    fontFamily: "'Inter', sans-serif",
    fontSize: '9px',
    fontWeight: 800,
    color: '#ffffff',
    letterSpacing: '0.3px',
    lineHeight: 1,
  },
  stitchSeam: {
    position: 'relative',
    zIndex: 499,
    height: '1px',
    backgroundImage: `repeating-linear-gradient(90deg, ${design.color.borderDark} 0px, ${design.color.borderDark} 6px, transparent 6px, transparent 12px)`,
    opacity: 0.6,
  },
};

export default Header;