import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../utils/api';
import { ArrowLeft, X, Mail, Send } from 'lucide-react';
import { theme as design } from '../utils/theme';
import { triggerHaptic } from '../utils/haptics';

/* ==================================================================
   ARCHIVAL THEME SYSTEM
================================================================== */
const theme = {
  color: {
    paper: '#fdfbf7',
    surface: '#ffffff',
    surfaceAlt: '#f4f1ea',
    border: '#e0d8c8',
    borderDark: '#d4c5a9',
    ink: '#1a1a1a',
    inkMuted: '#8c8275',
    accent: '#8b4513',
    crimson: '#8b1a1a',
    telegramTint: 'rgba(212, 175, 55, 0.08)', 
    shadowWarm: 'rgba(139, 69, 19, 0.08)',
    shadowDark: 'rgba(26, 26, 26, 0.20)',
  }
};

const TORN_EDGE_CLIP = 'polygon(0% 100%, 1.56% 18%, 3.12% 4%, 4.69% 22%, 6.25% 8%, 7.81% 16%, 9.38% 2%, 10.94% 24%, 12.50% 6%, 14.06% 14%, 15.62% 10%, 17.19% 20%, 18.75% 0%, 20.31% 18%, 21.88% 4%, 23.44% 22%, 25.00% 8%, 26.56% 16%, 28.12% 2%, 29.69% 24%, 31.25% 6%, 32.81% 14%, 34.38% 10%, 35.94% 20%, 37.50% 0%, 39.06% 18%, 40.62% 4%, 42.19% 22%, 43.75% 8%, 45.31% 16%, 46.88% 2%, 48.44% 24%, 50.00% 6%, 51.56% 14%, 53.12% 10%, 54.69% 20%, 56.25% 0%, 57.81% 18%, 59.38% 4%, 60.94% 22%, 62.50% 8%, 64.06% 16%, 65.62% 2%, 67.19% 24%, 68.75% 6%, 70.31% 14%, 71.88% 10%, 73.44% 20%, 75.00% 0%, 76.56% 18%, 78.12% 4%, 79.69% 22%, 81.25% 8%, 82.81% 16%, 84.38% 2%, 85.94% 24%, 87.50% 6%, 89.06% 14%, 90.62% 10%, 92.19% 20%, 93.75% 0%, 95.31% 18%, 96.88% 4%, 98.44% 22%, 100.00% 100%)';

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
    const senderName = sender.name || 'Anonymous Subject';
    const avatarUrl = sender.photos?.[0] || 'https://via.placeholder.com/100?text=?';
    const noteText = n.interactionRef?.letterContent || (isPriority ? 'Sent a Priority Telegram.' : 'Left a flower on your profile.');
    const isDeclining = decliningIds.has(n._id);
    const senderUnavailable = sender.suspended || sender.isDeleted;

    return (
      <motion.div 
        layout
        key={n._id}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ 
          opacity: 1, 
          scale: 1,
          backgroundColor: isDeclining ? 'rgba(139, 26, 26, 0.15)' : 'transparent'
        }}
        exit={{ opacity: 0, scale: 0.9, height: 0, marginBottom: 0 }}
        transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
        className="ig-row"
        style={{
          ...styles.row,
          backgroundColor: isPriority ? theme.color.telegramTint : 'transparent',
          borderLeft: isPriority ? `3px solid ${theme.color.accent}` : 'none',
          opacity: senderUnavailable ? 0.5 : 1,
        }}
        onClick={() => openProfile(sender, n._id)}
      >
        {/* Avatar Column */}
        <div style={styles.avatarContainer}>
          <img src={avatarUrl} alt={senderName} loading="lazy" decoding="async" style={styles.avatar} />
          {isPriority && (
            <div style={styles.sealBadge} title="Priority Telegram">
              <Send size={10} color="#fff" strokeWidth={3} />
            </div>
          )}
        </div>

        {/* Text Column */}
        <div style={styles.textContainer}>
          <p style={styles.mainText}>
            <span style={{ fontWeight: 800, color: theme.color.ink }}>{senderName}</span> {isPriority ? 'sent a Telegram.' : 'sent a letter.'}
          </p>
          <p className="line-clamp-2" style={styles.snippetText}>
            "{noteText}"
          </p>
        </div>

        {/* Actions Column */}
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
            <X size={16} />
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div style={styles.screenContainer}>
      
      <style>{`
        .tactile-btn { transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.2s ease, opacity 0.2s ease; will-change: transform; }
        @media (hover: hover) { .tactile-btn:hover { transform: translate3d(0, -2px, 0) scale3d(1.04, 1.04, 1); } }
        .tactile-btn:active { transform: scale3d(0.92, 0.92, 1) translate3d(0, 0, 0) !important; transition: transform 0.08s cubic-bezier(0, 0, 0.2, 1) !important; }
        
        .ig-row { transition: background-color 0.2s ease; }
        @media (hover: hover) { .ig-row:hover { background-color: ${theme.color.surfaceAlt}; } }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .archival-scrollbar::-webkit-scrollbar { width: 4px; }
        .archival-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .archival-scrollbar::-webkit-scrollbar-thumb { background: ${theme.color.borderDark}; border-radius: 4px; }
      `}</style>

      {/* Background Texture */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: `url("${design?.texture?.grain || ''}")`, mixBlendMode: 'multiply', opacity: 0.6, pointerEvents: 'none', zIndex: 1 }} />

      {/* Sticky Header */}
      <div style={styles.topBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {onClose && (
            <button className="tactile-btn" onClick={onClose} style={styles.backBtn} aria-label="Go back">
              <ArrowLeft size={20} color={theme.color.ink} />
            </button>
          )}
          <h2 style={styles.heading}>Letterbox</h2>
        </div>
        {!loading && notifications.length > 0 && (
          <span style={styles.badge}>{notifications.length} Pending</span>
        )}
      </div>

      {/* Main List Area */}
      <div className="archival-scrollbar" style={styles.contentArea}>
        {loading ? (
          <div style={styles.emptyState}>
            <p>Unsealing archival tray...</p>
          </div>
        ) : notifications.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={styles.emptyState}>
            <h3 style={styles.emptyTitle}>No pending letters.</h3>
            <p style={{ margin: 0 }}>Return to the deck to discover new connections and leave your mark.</p>
          </motion.div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: '40px' }}>
            
            {/* Tier 1: Priority Telegrams */}
            {telegrams.length > 0 && (
              <div style={styles.tierGroup}>
                <div style={styles.tierHeader}>
                  <Send size={12} color={theme.color.accent} />
                  <span style={styles.tierHeaderText}>Priority Telegrams</span>
                </div>
                <AnimatePresence>
                  {telegrams.map(renderRow)}
                </AnimatePresence>
              </div>
            )}

            {/* Tier 2: Recent Deliveries */}
            {letters.length > 0 && (
              <div style={styles.tierGroup}>
                <div style={styles.tierHeader}>
                  <Mail size={12} color={theme.color.inkMuted} />
                  <span style={styles.tierHeaderText}>Recent Deliveries</span>
                </div>
                <AnimatePresence>
                  {letters.map(renderRow)}
                </AnimatePresence>
              </div>
            )}

          </div>
        )}
      </div>

      {/* --- PROFILE PREVIEW MODAL --- */}
      <AnimatePresence>
        {selectedProfile && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={styles.modalBackdrop} 
              onClick={() => setSelectedProfile(null)} 
            />
            
            {/* Modal Sheet */}
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              style={styles.modalWrapper}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Paper Texture */}
              <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: `url("${design?.texture?.grain || ''}")`, mixBlendMode: 'multiply', opacity: 0.6, pointerEvents: 'none', zIndex: 1 }} />
              
              {/* Header */}
              <div style={styles.modalHeader}>
                <span style={{ fontFamily: design?.font?.display || "'Playfair Display', serif", fontSize: '18px', fontWeight: 700, color: theme.color.ink }}>Dossier Inspection</span>
                <button className="tactile-btn" onClick={() => setSelectedProfile(null)} style={styles.modalCloseBtn}><X size={20} /></button>
              </div>

              <div className="archival-scrollbar" style={styles.modalScrollArea}>
                {/* Hero Photo with Torn Edge */}
                <div style={{ position: 'relative', width: '100%', aspectRatio: '4/5', backgroundColor: theme.color.surfaceAlt, overflow: 'hidden' }}>
                  <img src={selectedProfile.photos?.[0] || 'https://via.placeholder.com/500'} alt={selectedProfile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,12,10,0.9) 0%, transparent 40%)' }} />
                  <div style={{ position: 'absolute', bottom: '24px', left: '20px', right: '20px', zIndex: 2 }}>
                    <h3 style={{ fontFamily: design?.font?.display || "'Playfair Display', serif", fontSize: '32px', color: '#fff', margin: 0, fontWeight: 700, letterSpacing: '-0.02em', textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}>
                      {selectedProfile.name}, {selectedProfile.age}
                    </h3>
                    <p style={{ fontFamily: design?.font?.body || "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.9)', margin: '4px 0 0 0', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>
                      {selectedProfile.branch} • {selectedProfile.year}
                    </p>
                  </div>
                </div>
                <div aria-hidden="true" style={{ width: '100%', height: '24px', backgroundColor: theme.color.paper, clipPath: TORN_EDGE_CLIP, marginTop: '-12px', position: 'relative', zIndex: 3, filter: 'drop-shadow(0 -3px 3px rgba(0,0,0,0.12))' }} />

                <div style={{ padding: '16px 20px 120px' }}>
                  {/* Bio */}
                  {selectedProfile.bio && (
                    <div style={{ marginBottom: '24px' }}>
                       <p style={{ fontFamily: design?.font?.body || "'Inter', sans-serif", fontSize: '10px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: theme.color.accent, margin: '0 0 8px 0' }}>Foreword</p>
                       <p style={{ fontFamily: "'Special Elite', 'Courier New', monospace", fontSize: '14px', color: theme.color.ink, lineHeight: 1.6, margin: 0, padding: '16px', backgroundColor: theme.color.surfaceAlt, border: `1px solid ${theme.color.borderDark}`, borderRadius: '8px' }}>
                         "{selectedProfile.bio}"
                       </p>
                    </div>
                  )}

                  {/* Prompts */}
                  {selectedProfile.prompts && selectedProfile.prompts.map((p, idx) => (
                    p.question && (
                      <div key={idx} style={{ backgroundColor: theme.color.surface, border: `1px solid ${theme.color.border}`, borderRadius: '12px', padding: '16px', marginBottom: '16px', boxShadow: `0 4px 12px ${theme.color.shadowWarm}` }}>
                        <p style={{ fontFamily: design?.font?.body || "'Inter', sans-serif", fontSize: '10px', fontWeight: 700, color: theme.color.inkMuted, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 8px 0' }}>Whisper #{idx + 1}</p>
                        <p style={{ fontFamily: design?.font?.display || "'Playfair Display', serif", fontSize: '16px', fontWeight: 700, color: theme.color.ink, margin: '0 0 8px 0', lineHeight: 1.4 }}>"{p.question}"</p>
                      </div>
                    )
                  ))}
                </div>
              </div>

              {/* Massive Footer Actions */}
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
    position: 'fixed', inset: 0, backgroundColor: theme.color.paper, zIndex: 1000, 
    display: 'flex', flexDirection: 'column', overflow: 'hidden', contain: 'layout style paint'
  },
  topBar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
    padding: 'max(16px, env(safe-area-inset-top)) 24px 16px', backgroundColor: theme.color.surface, 
    borderBottom: `1px solid ${theme.color.borderDark}`, position: 'relative', zIndex: 10,
    boxShadow: `0 2px 12px ${theme.color.shadowWarm}`
  },
  backBtn: {
    background: 'none', border: 'none', padding: '4px', margin: '-4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  heading: {
    fontFamily: design?.font?.display || "'Playfair Display', serif", fontSize: '24px', 
    fontWeight: 800, color: theme.color.ink, margin: 0, letterSpacing: '-0.02em',
  },
  badge: {
    backgroundColor: theme.color.crimson, color: '#fff', fontFamily: "'Inter', sans-serif",
    fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '12px', letterSpacing: '0.5px'
  },
  contentArea: {
    flex: 1, padding: '0', overflowY: 'auto', position: 'relative', zIndex: 2
  },
  emptyState: {
    padding: '80px 24px', textAlign: 'center', color: theme.color.inkMuted, fontFamily: "'Inter', sans-serif", fontSize: '14px'
  },
  emptyTitle: {
    fontFamily: design?.font?.display || "'Playfair Display', serif", fontSize: '22px', fontWeight: 700, color: theme.color.ink, margin: '0 0 8px 0'
  },
  
  // --- TIER STYLES ---
  tierGroup: {
    marginBottom: '8px'
  },
  tierHeader: {
    display: 'flex', alignItems: 'center', gap: '6px', padding: '20px 24px 12px',
    borderBottom: `1px solid ${theme.color.border}`
  },
  tierHeaderText: {
    fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: theme.color.inkMuted
  },

  // --- ROW STYLES ---
  row: {
    display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 24px', 
    borderBottom: `1px solid ${theme.color.border}`, cursor: 'pointer'
  },
  avatarContainer: {
    position: 'relative', flexShrink: 0
  },
  avatar: {
    width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', 
    border: `1px solid ${theme.color.borderDark}`, backgroundColor: theme.color.surfaceAlt
  },
  sealBadge: {
    position: 'absolute', bottom: '-2px', right: '-2px', width: '18px', height: '18px', 
    backgroundColor: theme.color.crimson, color: '#fff', borderRadius: '50%', 
    display: 'flex', alignItems: 'center', justifyContent: 'center', 
    border: `2px solid ${theme.color.paper}`, boxShadow: '0 2px 4px rgba(139,26,26,0.3)'
  },
  textContainer: {
    flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px'
  },
  mainText: {
    fontFamily: "'Inter', sans-serif", fontSize: '14px', color: theme.color.inkSoft, margin: 0, lineHeight: 1.3
  },
  snippetText: {
    fontFamily: "'Special Elite', 'Courier New', monospace", fontSize: '13px', color: theme.color.inkMuted, 
    margin: 0, lineHeight: 1.4, fontStyle: 'italic'
  },
  actionContainer: {
    display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0
  },
  acceptBtn: {
    backgroundColor: theme.color.crimson, color: '#fff', border: 'none', borderRadius: '8px', 
    padding: '8px 16px', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 700, 
    cursor: 'pointer', boxShadow: '0 2px 8px rgba(139,26,26,0.25)'
  },
  dismissBtn: {
    backgroundColor: theme.color.surfaceAlt, color: theme.color.inkMuted, border: `1px solid ${theme.color.borderDark}`, 
    borderRadius: '8px', padding: '7px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
  },

  // --- MODAL STYLES ---
  modalBackdrop: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(20,15,10,0.65)', backdropFilter: 'blur(4px)', zIndex: 1100,
  },
  modalWrapper: {
    position: 'fixed', bottom: 0, left: 0, right: 0, height: '92dvh', backgroundColor: theme.color.paper, 
    borderTopLeftRadius: '24px', borderTopRightRadius: '24px', zIndex: 1101, display: 'flex', flexDirection: 'column', 
    boxShadow: '0 -20px 50px rgba(0,0,0,0.4)', overflow: 'hidden'
  },
  modalHeader: {
    padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
    backgroundColor: theme.color.surface, borderBottom: `1px solid ${theme.color.borderDark}`, zIndex: 10
  },
  modalCloseBtn: {
    background: theme.color.surfaceAlt, border: `1px solid ${theme.color.border}`, borderRadius: '8px', 
    width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
    cursor: 'pointer', color: theme.color.ink
  },
  modalScrollArea: {
    flex: 1, overflowY: 'auto', position: 'relative', zIndex: 2
  },
  modalFooter: {
    padding: '20px 24px', paddingBottom: 'max(20px, env(safe-area-inset-bottom))', display: 'flex', gap: '16px', 
    backgroundColor: theme.color.surface, borderTop: `1px solid ${theme.color.borderDark}`, zIndex: 10
  },
  modalDismissBtn: {
    flex: 0.4, padding: '18px', backgroundColor: theme.color.surfaceAlt, border: `1px solid ${theme.color.borderDark}`, 
    color: theme.color.ink, fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', 
    borderRadius: '12px', cursor: 'pointer'
  },
  modalAcceptBtn: {
    flex: 1, padding: '18px', backgroundColor: theme.color.crimson, border: 'none', color: '#fff', 
    fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', 
    borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 16px rgba(139,26,26,0.3)'
  }
};

export default NotificationDrawer;
