import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../utils/api';
import { X, Send } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import neu from '../styles/neu';

/* The shared neo-brutalist canon (src/styles/neu.js) */
const t = neu;

const FALLBACK_AVATAR = 'https://placehold.co/100/fff3dc/191919?text=%3F';
const FALLBACK_PHOTO = 'https://placehold.co/500x625/fff3dc/191919?text=%C2%B7';

const DRAWER_CSS = `
  .lb-slam { transition: transform .08s steps(2), box-shadow .08s steps(2), background .08s steps(2);
    -webkit-tap-highlight-color: transparent; }
  .lb-slam:active { transform: translate(3px, 3px) !important; box-shadow: 0 0 0 #191919 !important; }

  .lb-row { transition: transform .08s steps(2), box-shadow .08s steps(2), opacity .3s ease, background .2s ease; }
  @media (hover: hover) and (pointer: fine) {
    .lb-row:hover { transform: translate(-1px, -1px); box-shadow: 6px 6px 0 #191919; }
  }
  .lb-row:active { transform: scale(.98) !important; }

  .lb-clamp2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

  .lb-btn:focus-visible, .lb-row:focus-visible {
    outline: 3px solid #FFD43D; outline-offset: 2px; }

  @media (prefers-reduced-motion: reduce) {
    .lb-slam, .lb-row { transition: none !important; }
  }
`;

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
        onSelectMatch({ _id: response.alignmentId, user: sender });
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

  /* ✨ ALIGN REQUESTS, and the retired letter/telegram rows.
     Align is the only type anything writes now, but `new_letter` and
     `priority_telegram` documents already exist in users' drawers, so they keep
     a bucket of their own rather than silently vanishing from the list. */
  const aligns = notifications.filter(n => n.type === 'new_align');
  const legacy = notifications.filter(n => n.type === 'new_letter' || n.type === 'priority_telegram');

  const renderRow = (n) => {
    /* Only the retired types need disambiguating now; an align is just an
       align, and labelling it by legacy flavour would be a distinction with no
       meaning left. */
    const isPriority = n.type === 'priority_telegram';
    const isLegacy = isPriority || n.type === 'new_letter';
    const sender = n.senderId || {};
    const senderName = sender.name || 'Anonymous';
    const avatarUrl = sender.photos?.[0] || FALLBACK_AVATAR;
    const noteText = n.interactionRef?.letterContent
      || (isPriority ? 'Sent a telegram.' : isLegacy ? 'Left a note on your profile.' : 'Wants to align with you.');
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
        }}
        exit={{ opacity: 0, height: 0, marginBottom: 0, marginTop: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="lb-row"
        role="button"
        tabIndex={0}
        onClick={() => openProfile(sender, n._id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openProfile(sender, n._id);
          }
        }}
        style={{
          ...styles.row,
          opacity: senderUnavailable ? 0.5 : 1,
          backgroundColor: isDeclining ? 'rgba(229,72,77,0.08)' : t.card,
        }}
      >
        {/* Avatar — rounded-square tile with ink border */}
        <div style={styles.avatarContainer}>
          <img src={avatarUrl} alt={senderName} loading="lazy" decoding="async" style={styles.avatar} />
          {isPriority && (
            <div style={styles.telegramBadge} title="Telegram">
              <Send size={9} color={t.ink} strokeWidth={3} />
            </div>
          )}
        </div>

        {/* Text */}
        <div style={styles.textContainer}>
          <p style={styles.mainText}>
            <span style={{ fontWeight: 800, color: t.ink }}>{senderName}</span> {isPriority ? 'sent a telegram.' : 'sent a letter.'}
          </p>
          <p className="lb-clamp2" style={styles.snippetText}>
            {noteText}
          </p>
        </div>

        {/* Actions */}
        <div style={styles.actionContainer}>
          <button
            className="lb-slam"
            onClick={(e) => handleAccept(e, n._id, sender)}
            style={{
              ...styles.acceptBtn,
              opacity: senderUnavailable ? 0.4 : 1,
              cursor: senderUnavailable ? 'not-allowed' : 'pointer',
            }}
            disabled={senderUnavailable}
            aria-label="Accept"
          >
            {senderUnavailable ? 'N/A' : 'Accept'}
          </button>
          <button
            className="lb-slam"
            onClick={(e) => handleDismiss(e, n._id)}
            style={styles.dismissBtn}
            aria-label="Dismiss"
          >
            <X size={14} strokeWidth={2.6} />
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div style={styles.screenContainer}>
      <style>{DRAWER_CSS}</style>

      {/* Header — heading + count on the left, CROSS on the right */}
      <div style={styles.topBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <h2 style={styles.heading}>Letterbox</h2>
          {!loading && notifications.length > 0 && (
            <span style={styles.badge}>{notifications.length} pending</span>
          )}
        </div>
        {onClose && (
          <button className="lb-slam" onClick={onClose} style={styles.closeBtn} aria-label="Close letterbox">
            <X size={18} color={t.ink} strokeWidth={2.8} />
          </button>
        )}
      </div>

      {/* List */}
      <div style={styles.contentArea}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                backgroundColor: t.card, border: `2px solid ${t.ink}`,
                borderRadius: 16, boxShadow: `4px 4px 0 ${t.ink}`, padding: '14px 16px',
              }}>
                <div style={{ width: 52, height: 52, borderRadius: 12, backgroundColor: t.hair, flexShrink: 0 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ width: '55%', height: 13, borderRadius: 5, backgroundColor: t.hair }} />
                  <div style={{ width: '80%', height: 10, borderRadius: 5, backgroundColor: t.hair }} />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={styles.emptyState}
          >
            <div style={{
              width: 56, height: 56, borderRadius: 16, backgroundColor: t.yellow,
              border: `2px solid ${t.ink}`, boxShadow: `4px 4px 0 ${t.ink}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
            }}>
              <span style={{ ...styles.tierHeaderText, fontSize: 13 }}>Align</span>
            </div>
            <h3 style={styles.emptyTitle}>No pending requests</h3>
            <p style={styles.emptyText}>Head back to the feed and align with someone to start something.</p>
          </motion.div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: 40 }}>

            {/* ✨ ALIGN REQUESTS */}
            {aligns.length > 0 && (
              <div style={styles.tierGroup}>
                <div style={styles.tierHeader}>
                  <span aria-hidden="true" style={{ ...styles.tierMark, background: t.yellow }} />
                  <span style={styles.tierHeaderText}>Align</span>
                  <span aria-hidden="true" style={styles.tierRule} />
                </div>
                <AnimatePresence>
                  {aligns.map(renderRow)}
                </AnimatePresence>
              </div>
            )}

            {/* Retired letter/telegram rows — still answered, just not brand new. */}
            {legacy.length > 0 && (
              <div style={styles.tierGroup}>
                <div style={styles.tierHeader}>
                  <span aria-hidden="true" style={{ ...styles.tierMark, background: t.coral }} />
                  <span style={styles.tierHeaderText}>Earlier</span>
                  <span aria-hidden="true" style={styles.tierRule} />
                </div>
                <AnimatePresence>
                  {legacy.map(renderRow)}
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
              transition={{ duration: 0.25 }}
              style={styles.modalBackdrop}
              onClick={() => setSelectedProfile(null)}
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              style={styles.modalWrapper}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Grabber */}
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, position: 'relative', zIndex: 2 }}>
                <span aria-hidden="true" style={{ width: 48, height: 6, borderRadius: 999, backgroundColor: t.ink }} />
              </div>

              {/* Header */}
              <div style={styles.modalHeader}>
                <span style={styles.modalTitle}>{selectedProfile.name || 'Profile'}</span>
                <button className="lb-slam" onClick={() => setSelectedProfile(null)} aria-label="Close" style={styles.modalCloseBtn}>
                  <X size={16} strokeWidth={2.8} />
                </button>
              </div>

              <div style={styles.modalScrollArea}>
                {/* Hero photo */}
                <div style={{ position: 'relative', width: '100%', aspectRatio: '4/5', backgroundColor: t.hair, overflow: 'hidden' }}>
                  <img
                    src={selectedProfile.photos?.[0] || FALLBACK_PHOTO}
                    alt={selectedProfile.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                  <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,13,10,0.55) 0%, rgba(15,13,10,0.08) 45%, rgba(15,13,10,0.16) 100%)' }} />
                  <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20, zIndex: 2 }}>
                    <h3 style={{
                      fontFamily: t.fontHeavy, fontSize: 30, color: '#fff', margin: 0, fontWeight: 400,
                      letterSpacing: '-.01em', lineHeight: 1.05,
                      backgroundImage: 'linear-gradient(180deg, transparent 58%, #FFD43D 58%)',
                      padding: '0 6px 3px 0', width: 'fit-content', maxWidth: '100%',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {selectedProfile.name}, {selectedProfile.age}
                    </h3>
                    <p style={{
                      fontFamily: t.fontMono, fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,0.92)',
                      margin: '10px 0 0 0', letterSpacing: '.1em', textTransform: 'uppercase',
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      {[selectedProfile.branch, selectedProfile.year].filter(Boolean).join(' / ')}
                    </p>
                  </div>
                </div>

                <div style={{ padding: '22px 20px 120px', display: 'flex', flexDirection: 'column', gap: 22 }}>
                  {/* Bio */}
                  {selectedProfile.bio && (
                    <div>
                      <div style={styles.sectionHeadRow}>
                        <span aria-hidden="true" style={{ ...styles.tierMark, background: t.green }} />
                        <span style={styles.sectionLabel}>About</span>
                        <span aria-hidden="true" style={styles.tierRule} />
                      </div>
                      <div style={styles.modalCard}>
                        <p style={{ fontFamily: t.fontBody, fontSize: 14.5, fontWeight: 500, color: t.ink2, lineHeight: 1.65, margin: 0, wordBreak: 'break-word' }}>
                          {selectedProfile.bio}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Prompts — question small, answer large */}
                  {selectedProfile.prompts && selectedProfile.prompts.map((p, idx) => (
                    p.question && (
                      <div key={idx}>
                        <div style={styles.sectionHeadRow}>
                          <span aria-hidden="true" style={{ ...styles.tierMark, background: t.coral }} />
                          <span style={styles.sectionLabel}>Prompt</span>
                          <span aria-hidden="true" style={styles.tierRule} />
                        </div>
                        <div style={styles.modalCard}>
                          <p style={{ fontFamily: t.fontMono, fontSize: 11.5, fontWeight: 700, lineHeight: 1.55, color: t.ink3, margin: '0 0 8px' }}>
                            {p.question}
                          </p>
                          {p.answer && (
                            <p style={{ fontFamily: t.fontBody, fontSize: 16, fontWeight: 700, lineHeight: 1.5, color: t.ink, margin: 0, wordBreak: 'break-word' }}>
                              {p.answer}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </div>

              {/* Footer actions — outline red decline, yellow slam accept */}
              <div style={styles.modalFooter}>
                <button
                  className="lb-slam"
                  style={styles.modalDismissBtn}
                  onClick={(e) => handleDismiss(e, selectedProfile.notificationId)}
                >
                  Decline
                </button>
                <button
                  className="lb-slam"
                  style={styles.modalAcceptBtn}
                  onClick={(e) => handleAccept(e, selectedProfile.notificationId, selectedProfile)}
                >
                  Align
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
    display: 'flex', flexDirection: 'column', overflow: 'hidden', contain: 'layout style paint',
  },
  topBar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: 'max(12px, env(safe-area-inset-top)) 14px 12px',
    backgroundColor: t.paper,
    borderBottom: `2px solid ${t.ink}`, position: 'relative', zIndex: 10,
  },
  heading: {
    fontFamily: t.fontHeavy, fontSize: 20, fontWeight: 400, color: t.ink,
    margin: 0, letterSpacing: '-.01em', textTransform: 'uppercase',
  },
  badge: {
    backgroundColor: t.coral, color: '#fff', fontFamily: t.fontBody,
    fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 999,
    border: `2px solid ${t.ink}`, letterSpacing: '.1em', textTransform: 'uppercase',
    fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
  },
  closeBtn: {
    backgroundColor: t.card, border: `2px solid ${t.ink}`, borderRadius: 12,
    boxShadow: `3px 3px 0 ${t.ink}`,
    width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', flexShrink: 0, color: t.ink,
  },
  contentArea: {
    flex: 1, padding: '14px 14px 0', overflowY: 'auto', position: 'relative', zIndex: 2,
  },
  emptyState: {
    padding: '80px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center',
  },
  emptyTitle: {
    fontFamily: t.fontHeavy, fontSize: 21, fontWeight: 400, color: t.ink, margin: '0 0 8px 0',
    letterSpacing: '-.01em', textTransform: 'uppercase',
  },
  emptyText: {
    margin: 0, fontFamily: t.fontBody, fontSize: 13.5, fontWeight: 500, color: t.ink2, lineHeight: 1.6, maxWidth: 280,
  },

  // --- Tiers ---
  tierGroup: { marginBottom: 8 },
  tierHeader: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '18px 2px 10px',
  },
  tierMark: {
    width: 11, height: 11, flexShrink: 0, border: `2px solid ${t.ink}`, borderRadius: 3,
    display: 'inline-block',
  },
  tierHeaderText: {
    fontFamily: t.fontMono, fontSize: 11, fontWeight: 700, letterSpacing: '.18em',
    textTransform: 'uppercase', color: t.ink,
  },
  tierRule: { flex: 1, height: 2, background: t.hair },
  sectionHeadRow: {
    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
  },
  sectionLabel: {
    fontFamily: t.fontMono, fontSize: 10, fontWeight: 700, letterSpacing: '.16em',
    textTransform: 'uppercase', color: t.ink3,
  },

  // --- Rows ---
  row: {
    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
    marginBottom: 12, cursor: 'pointer',
    border: `2px solid ${t.ink}`, borderRadius: 16,
    boxShadow: `4px 4px 0 ${t.ink}`,
  },
  avatarContainer: { position: 'relative', flexShrink: 0 },
  avatar: {
    width: 52, height: 52, borderRadius: 12, objectFit: 'cover',
    border: `2px solid ${t.ink}`, backgroundColor: t.hair, display: 'block',
  },
  telegramBadge: {
    position: 'absolute', bottom: -4, right: -4, width: 18, height: 18,
    backgroundColor: t.yellow, color: t.ink, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: `2px solid ${t.ink}`, boxSizing: 'content-box',
  },
  textContainer: {
    flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3,
  },
  mainText: {
    fontFamily: t.fontBody, fontSize: 13.5, fontWeight: 500, color: t.ink2, margin: 0, lineHeight: 1.35,
  },
  snippetText: {
    fontFamily: t.fontBody, fontSize: 12.5, fontWeight: 600, color: t.ink3,
    margin: 0, lineHeight: 1.45,
  },
  actionContainer: {
    display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
  },
  acceptBtn: {
    backgroundColor: t.yellow, color: t.ink, border: `2px solid ${t.ink}`, borderRadius: 10,
    padding: '8px 13px', fontFamily: t.fontMono, fontSize: 10, fontWeight: 700,
    letterSpacing: '.1em', textTransform: 'uppercase', boxShadow: `3px 3px 0 ${t.ink}`,
    whiteSpace: 'nowrap',
  },
  dismissBtn: {
    backgroundColor: t.card, color: t.ink2, border: `1.5px solid ${t.ink}`,
    borderRadius: 9, width: 32, height: 32, display: 'flex', alignItems: 'center',
    justifyContent: 'center', cursor: 'pointer', flexShrink: 0, boxShadow: `2px 2px 0 ${t.ink}`,
  },

  // --- Sheet ---
  modalBackdrop: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(12,12,14,0.62)', zIndex: 1100,
  },
  modalWrapper: {
    position: 'fixed', bottom: 0, left: 0, right: 0, height: '92dvh', backgroundColor: t.paper,
    borderTop: `2px solid ${t.ink}`, borderTopLeftRadius: 22, borderTopRightRadius: 22,
    zIndex: 1101, display: 'flex', flexDirection: 'column',
    boxShadow: '0 -10px 40px rgba(0,0,0,.45)', overflow: 'hidden',
  },
  modalHeader: {
    padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    borderBottom: `2px solid ${t.ink}`, zIndex: 10, position: 'relative',
  },
  modalTitle: {
    fontFamily: t.fontHeavy, fontSize: 19, fontWeight: 400, color: t.ink, letterSpacing: '-.01em',
    textTransform: 'uppercase',
  },
  modalCloseBtn: {
    backgroundColor: t.card, border: `2px solid ${t.ink}`, borderRadius: 12,
    boxShadow: `3px 3px 0 ${t.ink}`,
    width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: t.ink, flexShrink: 0,
  },
  modalCard: {
    backgroundColor: t.card, border: `2px solid ${t.ink}`, borderRadius: 14,
    boxShadow: `4px 4px 0 ${t.ink}`, padding: 16,
  },
  modalScrollArea: {
    flex: 1, overflowY: 'auto', position: 'relative', zIndex: 2,
  },
  modalFooter: {
    padding: '14px 16px', paddingBottom: 'max(14px, env(safe-area-inset-bottom))', display: 'flex', gap: 10,
    backgroundColor: t.paper, borderTop: `2px solid ${t.ink}`, zIndex: 10, position: 'relative',
  },
  modalDismissBtn: {
    flex: 0.4, padding: '15px 8px', backgroundColor: t.card, border: `2px solid ${t.ink}`,
    color: t.red, fontFamily: t.fontMono, fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '.1em', borderRadius: 12, cursor: 'pointer', boxShadow: `3px 3px 0 ${t.ink}`,
  },
  modalAcceptBtn: {
    flex: 1, padding: '15px 8px', backgroundColor: t.yellow, border: `2px solid ${t.ink}`,
    color: t.ink, fontFamily: t.fontMono, fontSize: 12, fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '.1em', borderRadius: 12, boxShadow: `4px 4px 0 ${t.ink}`, cursor: 'pointer',
  },
};

export default NotificationDrawer;