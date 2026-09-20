import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../utils/api';
import { ArrowLeft, X, Mail, Send } from 'lucide-react';
import { theme as design } from '../utils/theme';
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
  telegramTint: 'rgba(230, 177, 122, 0.10)',
  fontDisplay: design?.font?.heading || design?.font?.display || "'Playfair Display', Georgia, serif",
  fontBody: design?.font?.body || "'Inter', -apple-system, sans-serif",
  fontType: "'Special Elite', 'Courier New', monospace",
  grain: design?.texture?.grain || '',
};

/* ==================================================================
   MAIN COMPONENT
================================================================== */
const NotificationDrawer = ({ onClose, onSelectMatch }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [decliningIds, setDecliningIds] = useState(new Set());

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.notifications || []);
    } catch (err) {
      console.error('Failed to fetch letters:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (e, id, sender) => {
    e.stopPropagation();
    triggerHaptic('heavy');
    try {
      const response = await api.post(`/notifications/${id}/accept`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      setSelectedProfile(null);

      if (onSelectMatch) {
        onClose?.();
        onSelectMatch({ _id: response.matchId, user: sender });
      } else if (onClose) {
        onClose();
      }
    } catch (err) {
      console.error('Error accepting letter:', err);
    }
  };

  const handleDismiss = async (e, id) => {
    e.stopPropagation();
    triggerHaptic('light');

    setDecliningIds(prev => new Set(prev).add(id));

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      setDecliningIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setSelectedProfile(null);
    }, 350);

    try {
      await api.put(`/notifications/${id}/dismiss`);
    } catch (err) {
      console.error('Error dismissing letter:', err);
    }
  };

  const openProfile = (sender, notificationId) => {
    triggerHaptic('light');
    setSelectedProfile({ ...sender, notificationId });
  };

  // Split notifications into tiers
  const telegrams = notifications.filter(n => n.type === 'priority_seal');
  const letters = notifications.filter(n => n.type === 'new_letter');

  const renderRow = (n) => {
    const isPriority = n.type === 'priority_seal';
    const sender = n.senderId || {};
    const senderName = sender.name || 'Anonymous';
    const avatarUrl = sender.photos?.[0] || 'https://via.placeholder.com/100?text=?';
    const noteText = n.interactionRef?.letterContent || (isPriority ? 'Sent a priority message.' : 'Left a note on your profile.');
    const isDeclining = decliningIds.has(n._id);
    const senderUnavailable = sender.suspended || sender.isDeleted;

    return (
      <motion.div
        layout
        key={n._id}
        initial={{ opacity: 0, y: 10 }}
        animate={{
          opacity: senderUnavailable ? 0.5 : 1,
          y: 0,
          backgroundColor: isDeclining ? 'rgba(139, 26, 26, 0.08)' : 'transparent',
        }}
        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="ig-row"
        style={{
          ...styles.row,
          backgroundColor: isPriority && !isDeclining ? t.telegramTint : undefined,
          opacity: senderUnavailable ? 0.5 : 1,
        }}
        onClick={() => openProfile(sender, n._id)}
      >
        {/* Avatar */}
        <div style={styles.avatarContainer}>
          <img src={avatarUrl} alt={senderName} loading="lazy" decoding="async" style={styles.avatar} />
          {isPriority && (
            <div style={styles.sealBadge} title="Priority">
              <Send size={9} color="#fff" strokeWidth={3} />
            </div>
          )}
        </div>

        {/* Text */}
        <div style={styles.textContainer}>
          <p style={styles.mainText}>
            <span style={{ fontWeight: 700, color: t.ink }}>{senderName}</span> {isPriority ? 'sent a priority message.' : 'sent a letter.'}
          </p>
          <p className="line-clamp-2" style={styles.snippetText}>
            {noteText}
          </p>
        </div>

        {/* Actions */}
        <div style={styles.actionContainer}>
          <button
            className="tactile-btn"
            onClick={(e) => handleAccept(e, n._id, sender)}
            style={{
              ...styles.acceptBtn,
              opacity: senderUnavailable ? 0.4 : 1,
              cursor: senderUnavailable ? 'not-allowed' : 'pointer',
            }}
            disabled={senderUnavailable}
            aria-label="Accept"
          >
            {senderUnavailable ? 'Unavailable' : 'Connect'}
          </button>
          <button
            className="tactile-btn"
            onClick={(e) => handleDismiss(e, n._id)}
            style={styles.dismissBtn}
            aria-label="Dismiss"
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div style={styles.screenContainer}>

      <style>{`
        .tactile-btn { transition: transform 0.15s ease-out; will-change: transform; }
        @media (hover: hover) { .tactile-btn:hover { transform: translateY(-1px); } }
        .tactile-btn:active { transform: scale(0.96) !important; }

        .ig-row { transition: background-color 0.2s ease; }
        @media (hover: hover) { .ig-row:hover { background-color: rgba(244, 241, 234, 0.7); } }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .archival-scrollbar::-webkit-scrollbar { width: 4px; }
        .archival-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .archival-scrollbar::-webkit-scrollbar-thumb { background: rgba(212,197,169,0.9); border-radius: 999px; }
      `}</style>

      {/* Grain film */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: `url("${t.grain}")`, mixBlendMode: 'multiply', opacity: 0.3, pointerEvents: 'none', zIndex: 1 }} />

      {/* Header */}
      <div style={styles.topBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {onClose && (
            <button className="tactile-btn" onClick={onClose} style={styles.backBtn} aria-label="Go back">
              <ArrowLeft size={18} color={t.ink} strokeWidth={2} />
            </button>
          )}
          <h2 style={styles.heading}>Letterbox</h2>
        </div>
        {!loading && notifications.length > 0 && (
          <span style={styles.badge}>{notifications.length} pending</span>
        )}
      </div>

      {/* List */}
      <div className="archival-scrollbar" style={styles.contentArea}>
        {loading ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>Fetching your letters...</p>
          </div>
        ) : notifications.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} style={styles.emptyState}>
            <h3 style={styles.emptyTitle}>No pending letters.</h3>
            <p style={styles.emptyText}>Return to the deck to discover new connections.</p>
          </motion.div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: 40 }}>

            {/* Priority */}
            {telegrams.length > 0 && (
              <div style={styles.tierGroup}>
                <div style={styles.tierHeader}>
                  <Send size={12} color={t.accent} strokeWidth={2} />
                  <span style={styles.tierHeaderText}>Priority</span>
                </div>
                <AnimatePresence>
                  {telegrams.map(renderRow)}
                </AnimatePresence>
              </div>
            )}

            {/* Letters */}
            {letters.length > 0 && (
              <div style={styles.tierGroup}>
                <div style={styles.tierHeader}>
                  <Mail size={12} color={t.accent} strokeWidth={2} />
                  <span style={styles.tierHeaderText}>Letters</span>
                </div>
                <AnimatePresence>
                  {letters.map(renderRow)}
                </AnimatePresence>
              </div>
            )}

          </div>
        )}
      </div>

      {/* --- PROFILE PREVIEW SHEET --- */}
      <AnimatePresence>
        {selectedProfile && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              style={styles.modalBackdrop}
              onClick={() => setSelectedProfile(null)}
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              style={styles.modalWrapper}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Grain */}
              <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: `url("${t.grain}")`, mixBlendMode: 'multiply', opacity: 0.3, pointerEvents: 'none', zIndex: 1 }} />

              {/* Grabber */}
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, position: 'relative', zIndex: 2 }}>
                <span aria-hidden="true" style={{ width: 36, height: 4, borderRadius: 999, backgroundColor: 'rgba(212,197,169,0.7)' }} />
              </div>

              {/* Header */}
              <div style={styles.modalHeader}>
                <span style={styles.modalTitle}>{selectedProfile.name || 'Profile'}</span>
                <button className="tactile-btn" onClick={() => setSelectedProfile(null)} aria-label="Close" style={styles.modalCloseBtn}>
                  <X size={16} strokeWidth={2} />
                </button>
              </div>

              <div className="archival-scrollbar" style={styles.modalScrollArea}>
                {/* Hero photo — clean, no torn edge */}
                <div style={{ position: 'relative', width: '100%', aspectRatio: '4/5', backgroundColor: t.surfaceAlt, overflow: 'hidden' }}>
                  <img src={selectedProfile.photos?.[0] || 'https://via.placeholder.com/500'} alt={selectedProfile.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,12,10,0.85) 0%, transparent 45%)' }} />
                  <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20, zIndex: 2 }}>
                    <h3 style={{ fontFamily: t.fontDisplay, fontSize: 30, color: '#fff', margin: 0, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.05, textShadow: '0 2px 16px rgba(0,0,0,0.5)' }}>
                      {selectedProfile.name}, {selectedProfile.age}
                    </h3>
                    <p style={{ fontFamily: t.fontType, fontSize: 10.5, color: 'rgba(255,255,255,0.9)', margin: '8px 0 0 0', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                      {[selectedProfile.branch, selectedProfile.year].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </div>

                <div style={{ padding: '20px 20px 120px', display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {/* Bio — typewriter on a dotted field, recorded data */}
                  {selectedProfile.bio && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                        <span style={{ width: 5, height: 5, backgroundColor: t.crimson }} />
                        <span style={styles.sectionLabel}>About</span>
                      </div>
                      <p style={{ fontFamily: t.fontType, fontSize: 13.5, color: t.ink, lineHeight: 1.65, margin: 0, paddingBottom: 6, borderBottom: '1.5px dotted rgba(139,69,19,0.45)' }}>
                        {selectedProfile.bio}
                      </p>
                    </div>
                  )}

                  {/* Prompts — hairline index rows */}
                  {selectedProfile.prompts && selectedProfile.prompts.map((p, idx) => (
                    p.question && (
                      <div key={idx} style={{ borderTop: '1px solid rgba(212,197,169,0.7)', paddingTop: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                          <span style={{ width: 5, height: 5, backgroundColor: t.crimson }} />
                          <span style={styles.sectionLabel}>Whisper</span>
                        </div>
                        <p style={{ fontFamily: t.fontDisplay, fontSize: 16.5, fontWeight: 600, color: t.ink, margin: 0, lineHeight: 1.45, wordBreak: 'break-word' }}>
                          {p.question}
                        </p>
                      </div>
                    )
                  ))}
                </div>
              </div>

              {/* Footer actions — two pills, crimson on accept only */}
              <div style={styles.modalFooter}>
                <button className="tactile-btn" style={styles.modalDismissBtn} onClick={(e) => handleDismiss(e, selectedProfile.notificationId)}>
                  Decline
                </button>
                <button className="tactile-btn" style={styles.modalAcceptBtn} onClick={(e) => handleAccept(e, selectedProfile.notificationId, selectedProfile)}>
                  Accept & Connect
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ==================================================================
   STYLES
================================================================== */
const styles = {
  screenContainer: {
    position: 'fixed', inset: 0, backgroundColor: t.paper, zIndex: 1000,
    display: 'flex', flexDirection: 'column', overflow: 'hidden', contain: 'layout style paint'
  },
  topBar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: 'max(12px, env(safe-area-inset-top)) 16px 12px',
    backgroundColor: t.paper,
    borderBottom: '1px solid rgba(212,197,169,0.7)', position: 'relative', zIndex: 10,
    boxShadow: '0 4px 16px rgba(88,63,30,0.08)'
  },
  backBtn: {
    backgroundColor: t.surfaceAlt, border: '1px solid rgba(212,197,169,0.7)', borderRadius: 12,
    width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
    flexShrink: 0,
  },
  heading: {
    fontFamily: t.fontDisplay, fontSize: 20,
    fontWeight: 800, color: t.ink, margin: 0, letterSpacing: '-0.02em',
  },
  badge: {
    backgroundColor: t.crimson, color: '#fff', fontFamily: t.fontBody,
    fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 999, letterSpacing: '1.5px', textTransform: 'uppercase',
    fontVariantNumeric: 'tabular-nums',
  },
  contentArea: {
    flex: 1, padding: 0, overflowY: 'auto', position: 'relative', zIndex: 2
  },
  emptyState: {
    padding: '80px 24px', textAlign: 'center',
  },
  emptyTitle: {
    fontFamily: t.fontDisplay, fontSize: 22, fontWeight: 800, color: t.ink, margin: '0 0 8px 0', letterSpacing: '-0.02em'
  },
  emptyText: {
    margin: 0, fontFamily: t.fontBody, fontSize: 13.5, fontWeight: 450, color: t.inkMuted, lineHeight: 1.6
  },

  // --- Tiers ---
  tierGroup: { marginBottom: 8 },
  tierHeader: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '20px 16px 10px',
    borderBottom: '1px solid rgba(212,197,169,0.5)'
  },
  tierHeaderText: {
    fontFamily: t.fontBody, fontSize: 9.5, fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', color: t.inkMuted
  },
  sectionLabel: {
    fontFamily: t.fontBody, fontSize: 9.5, fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', color: t.inkMuted
  },

  // --- Rows ---
  row: {
    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
    borderBottom: '1px solid rgba(212,197,169,0.5)', cursor: 'pointer'
  },
  avatarContainer: { position: 'relative', flexShrink: 0 },
  avatar: {
    width: 48, height: 48, borderRadius: '50%', objectFit: 'cover',
    border: '1px solid rgba(212,197,169,0.9)', backgroundColor: t.surfaceAlt, display: 'block'
  },
  sealBadge: {
    position: 'absolute', bottom: -2, right: -2, width: 18, height: 18,
    backgroundColor: t.crimson, color: '#fff', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: `2px solid ${t.paper}`, boxShadow: '0 2px 6px rgba(139,26,26,0.3)', boxSizing: 'content-box',
  },
  textContainer: {
    flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3
  },
  mainText: {
    fontFamily: t.fontBody, fontSize: 13.5, fontWeight: 450, color: t.inkSoft, margin: 0, lineHeight: 1.35
  },
  snippetText: {
    fontFamily: t.fontType, fontSize: 12.5, color: t.inkMuted,
    margin: 0, lineHeight: 1.45
  },
  actionContainer: {
    display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0
  },
  acceptBtn: {
    backgroundColor: t.crimson, color: '#fff', border: 'none', borderRadius: 999,
    padding: '8px 14px', fontFamily: t.fontBody, fontSize: 10, fontWeight: 800,
    letterSpacing: '1.5px', textTransform: 'uppercase',
    cursor: 'pointer', boxShadow: '0 4px 12px rgba(139,26,26,0.25)', whiteSpace: 'nowrap',
  },
  dismissBtn: {
    backgroundColor: t.surfaceAlt, color: t.inkMuted, border: '1px solid rgba(212,197,169,0.7)',
    borderRadius: 12, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
  },

  // --- Sheet ---
  modalBackdrop: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(28,19,10,0.6)', zIndex: 1100,
  },
  modalWrapper: {
    position: 'fixed', bottom: 0, left: 0, right: 0, height: '92dvh', backgroundColor: t.paper,
    borderTopLeftRadius: 18, borderTopRightRadius: 18, zIndex: 1101, display: 'flex', flexDirection: 'column',
    boxShadow: '0 -14px 44px rgba(88,63,30,0.3)', overflow: 'hidden'
  },
  modalHeader: {
    padding: '12px 16px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    borderBottom: '1px solid rgba(212,197,169,0.7)', zIndex: 10, position: 'relative',
  },
  modalTitle: {
    fontFamily: t.fontDisplay, fontSize: 19, fontWeight: 800, color: t.ink, letterSpacing: '-0.02em',
  },
  modalCloseBtn: {
    backgroundColor: t.surfaceAlt, border: '1px solid rgba(212,197,169,0.7)', borderRadius: 12,
    width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: t.ink, flexShrink: 0,
  },
  modalScrollArea: {
    flex: 1, overflowY: 'auto', position: 'relative', zIndex: 2
  },
  modalFooter: {
    padding: '14px 16px', paddingBottom: 'max(14px, env(safe-area-inset-bottom))', display: 'flex', gap: 10,
    backgroundColor: t.paper, borderTop: '1px solid rgba(212,197,169,0.7)', zIndex: 10, position: 'relative',
  },
  modalDismissBtn: {
    flex: 0.4, padding: '15px 8px', backgroundColor: t.surfaceAlt, border: '1px solid rgba(212,197,169,0.7)',
    color: t.ink, fontFamily: t.fontBody, fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
    letterSpacing: '1.5px', borderRadius: 999, cursor: 'pointer',
  },
  modalAcceptBtn: {
    flex: 1, padding: '15px 8px', backgroundColor: t.crimson, border: 'none', color: '#fff',
    fontFamily: t.fontBody, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.8px',
    borderRadius: 999, cursor: 'pointer', boxShadow: '0 6px 18px rgba(139,26,26,0.28)',
  },
};

export default NotificationDrawer;