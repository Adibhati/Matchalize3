# Chunk 09 — Client Components

> Matchalize · `client-components` · files 9 of 28 chunks · 11 file(s) · 95 KB · ~27,878 tokens
> Generated 2026-10-18 20:29.
> Paste-safe: within the 100 KB / ~29,257 token target.
>
> Contains:
> - `./client/src/components/NotificationDrawer.jsx`
> - `./client/src/components/PolaroidCard.jsx`
> - `./client/src/components/PopoutItem.jsx`
> - `./client/src/components/ProfileCardSkeleton.jsx`
> - `./client/src/components/PushPrompt.jsx`
> - `./client/src/components/ShadowbanBanner.jsx`
> - `./client/src/components/Skeleton.jsx`
> - `./client/src/components/chat/EmojiPicker.jsx`
> - `./client/src/components/chat/MessageActionMenu.jsx`
> - `./client/src/components/chat/MessageBubble.jsx`
> - `./client/src/components/chat/PhotoViewer.jsx`

---
### ./client/src/components/NotificationDrawer.jsx

```
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [notificationTotal, setNotificationTotal] = useState(0);
  const [loadMoreError, setLoadMoreError] = useState('');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [decliningIds, setDecliningIds] = useState(new Set());

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.notifications || []);
      setHasMore(Boolean(response.hasMore));
      setPage(response.page || 1);
      setNotificationTotal(response.total ?? response.notifications?.length ?? 0);
    } catch (err) {
      console.error('Failed to fetch letters:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreNotifications = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    setLoadMoreError('');
    try {
      const nextPage = page + 1;
      const response = await api.get(`/notifications?page=${nextPage}`);
      const nextNotifications = response.notifications || [];
      setNotifications((previous) => {
        const existingIds = new Set(previous.map((notification) => notification._id));
        return [
          ...previous,
          ...nextNotifications.filter((notification) => !existingIds.has(notification._id)),
        ];
      });
      setPage(response.page || nextPage);
      setHasMore(Boolean(response.hasMore));
      setNotificationTotal(response.total ?? notificationTotal);
    } catch (err) {
      console.error('Failed to load more letters:', err);
      setLoadMoreError('Could not load older requests. Try again.');
    } finally {
      setLoadingMore(false);
    }
  };

  const handleAccept = async (e, id, sender) => {
    e.stopPropagation();
    triggerHaptic('heavy');
    try {
      const response = await api.post(`/notifications/${id}/accept`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      setNotificationTotal((total) => Math.max(0, total - 1));
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
      setNotificationTotal((total) => Math.max(0, total - 1));
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
            <span style={styles.badge}>{notificationTotal} pending</span>
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

            {hasMore && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '8px 0 24px' }}>
                {loadMoreError && (
                  <p role="alert" style={{ ...styles.emptyText, color: t.red, textAlign: 'center' }}>
                    {loadMoreError}
                  </p>
                )}
                <button
                  className="lb-slam"
                  type="button"
                  onClick={loadMoreNotifications}
                  disabled={loadingMore}
                  style={styles.loadMoreBtn}
                >
                  {loadingMore ? 'Loading…' : loadMoreError ? 'Try again' : 'Load more'}
                </button>
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
  loadMoreBtn: {
    padding: '10px 18px', backgroundColor: t.yellow, color: t.ink,
    border: `2px solid ${t.ink}`, borderRadius: 10,
    boxShadow: `3px 3px 0 ${t.ink}`, cursor: 'pointer',
    fontFamily: t.fontMono, fontSize: 11, fontWeight: 700,
    letterSpacing: '.1em', textTransform: 'uppercase',
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
```

### ./client/src/components/PolaroidCard.jsx

```
import React, { useState, memo } from 'react';
import { motion } from 'framer-motion';
import { Camera } from 'lucide-react';
import neu from '../styles/neu';

/* The shared neo-brutalist canon (src/styles/neu.js) */
const t = neu;

const FALLBACK_IMG = 'https://placehold.co/480x480/fff3dc/191919?text=%C2%B7';

/**
 * PolaroidCard — chat image bubble.
 * Props: src, caption, tilt, onExpand
 */
const PolaroidCard = ({ src, caption, tilt = '0deg', onExpand }) => {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const resolvedSrc = failed ? FALLBACK_IMG : src;

  return (
    <motion.figure
      initial={{ opacity: 0, y: 8, rotate: 0 }}
      animate={{ opacity: 1, y: 0, rotate: tilt }}
      transition={{ type: 'spring', damping: 24, stiffness: 320 }}
      onClick={onExpand}
      style={{
        margin: 0,
        padding: caption ? '7px 7px 0 7px' : '7px 7px 7px 7px',
        width: '240px',
        backgroundColor: t.card,
        border: `2px solid ${t.ink}`,
        borderRadius: 6,
        boxShadow: `5px 5px 0 ${t.ink}`,
        cursor: onExpand ? 'zoom-in' : 'default',
        transformOrigin: 'center center',
        willChange: 'transform',
        boxSizing: 'border-box',
        contain: 'layout paint',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1 / 1',
          overflow: 'hidden',
          backgroundColor: t.hair,
          borderRadius: 3,
          border: `1.5px solid ${t.ink}`,
        }}
      >
        <img
          src={resolvedSrc}
          alt={caption || 'Shared photograph'}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => {
            setFailed(true);
            setLoaded(true);
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.4s ease-out',
          }}
        />
      </div>

      {caption ? (
        <figcaption
          style={{
            padding: '9px 4px 12px',
            fontFamily: t.fontMono,
            fontSize: '10.5px',
            fontWeight: 700,
            letterSpacing: '.04em',
            lineHeight: 1.5,
            color: t.ink2,
            textAlign: 'center',
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
          }}
        >
          {caption}
        </figcaption>
      ) : (
        <div
          aria-hidden="true"
          style={{ display: 'flex', justifyContent: 'center', padding: '9px 0 10px' }}
        >
          <Camera size={13} strokeWidth={2.4} color={t.ink3} />
        </div>
      )}
    </motion.figure>
  );
};

export default memo(PolaroidCard);
```

### ./client/src/components/PopoutItem.jsx

```
// client/src/components/PopoutItem.jsx
import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useMotionValue, useTransform, animate, useReducedMotion } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';
import { useIsDesktop } from '../utils/useIsDesktop';
import { ChevronDown } from 'lucide-react';
import neu from '../styles/neu';

/* ── The shared neo-brutalist canon (src/styles/neu.js).
   Keyed by the legacy short names so every ${F.*} usage site keeps working. ── */
const F = {
  heavy: neu.fontHeavy,
  body: neu.fontBody,
  mono: neu.fontMono,
};

/* The shared neo-brutalist canon (src/styles/neu.js).
   The drifted local yellowDeep (#E5B824) was dropped — C.yellowDeep now
   inherits the canon value (#FFC91F) from neu. */
const C = neu;

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
const PRESS_MS = 280;
const PRESS_SLOP = 12;      // px of real movement that cancels a hold
const SCALE_MIN = 0.9;      // wide span-2 items may shrink slightly to fit
const SCALE_MAX = 2.4;      // how big a tiny tile may get — raise for even bigger
const SEAL_MS = 200;        // how long the wax seal shows before the action fires

/* ── shared styles — injected ONCE per page (id-guarded), not once per card ── */
const POP_CSS = `
  .po-overlay { position: fixed; inset: 0; z-index: 9998; background: rgba(25,23,20,0.55);
    backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }

  /* scroll-safe centering: margin:auto on the child centers when it fits,
     and lets the card SCROLL when the zoomed content is taller than the screen */
  .po-scroll { position: absolute; inset: 0; overflow-y: auto; -webkit-overflow-scrolling: touch;
    display: flex; padding: 24px 16px; }
  .po-scroll::-webkit-scrollbar { display: none; }

  .po-card { margin: auto; position: relative; width: 100%; max-width: 340px; border-radius: 22px; overflow: hidden;
    background: ${C.paper}; border: 2px solid ${C.ink}; box-shadow: 10px 10px 0 ${C.ink}; will-change: transform; }
  .po-card:focus, .po-card:focus-visible { outline: none; }
  .po-card button { -webkit-tap-highlight-color: transparent; }

  .po-btn { width: 100%; height: 50px; border: 2px solid ${C.ink}; border-radius: 14px; background: ${C.card};
    color: ${C.ink}; font-family: ${F.mono}; font-size: 12.5px; font-weight: 700; letter-spacing: .12em;
    text-transform: uppercase; cursor: pointer; box-shadow: 4px 4px 0 ${C.ink};
    transition: transform .1s ease-out, box-shadow .1s ease-out; }
  .po-btn:active { transform: translate(4px, 4px); box-shadow: 0 0 0 ${C.ink}; }

  /* ═══ THE ZOOM STAGE — the popped item rendered at full modal width ═══ */
  .po-center { padding: 12px; cursor: pointer; }
  .po-stage { width: 100%; display: flex; justify-content: center; }
  .po-content { transition: transform .4s cubic-bezier(.22,1,.36,1); transform-origin: center; }
  .po-sandwich.expanded .po-content { transform: scale(1.02); }
  .po-content .pc-hold { display: none !important; }
  .po-content div[style*="pointer-events: none"] { display: none !important; }
  .po-content img { pointer-events: none; }

  /* ═══ letter accordion ═══ */
  .po-panel-bottom { border-top: 2px solid ${C.ink}; }
  .po-accordion { position: relative; height: 60px; overflow: hidden;
    transition: height .4s cubic-bezier(.22,1,.36,1); }
  .po-accordion.input-active { height: 248px; }
  .po-letterbtn { position: relative; display: flex; align-items: center; justify-content: center; gap: 9px;
    width: 100%; height: 60px; background: transparent; border: none; color: ${C.ink};
    font-family: ${F.body}; font-size: 15px; font-weight: 700; cursor: pointer;
    transition: opacity .25s, visibility 0s linear .25s; }
  /* ✨ ALIGN — the primary affirmative action.
     Yellow, the same slam colour as every other primary in the app, so it reads
     as "the main thing you can do here" rather than as a new category. */
  .po-letterbtn.po-alignbtn { background: ${C.yellow}; color: ${C.ink};
    font-family: ${F.mono}; font-size: 13px; font-weight: 700; letter-spacing: .12em;
    text-transform: uppercase; box-shadow: inset 0 -3px 0 ${C.yellowDeep};
    transition: opacity .25s, visibility 0s linear .25s, transform .1s ease-out; }
  .po-letterbtn.po-alignbtn:active:not(:disabled) { transform: translateY(2px); }
  .po-letterbtn.po-alignbtn:disabled { opacity: .35; cursor: default; }
  /* Align gets the slam yellow; the note is a quiet secondary that sits beside
     it rather than underneath it, so the two are one decision, not two steps. */
  .po-alignrow { display: flex; gap: 10px; align-items: stretch; width: 100%;
    transition: opacity .25s, visibility 0s linear .25s; }
  .po-alignrow.hide { opacity: 0; pointer-events: none; visibility: hidden; position: absolute; inset: 0; }
  .po-letterbtn.po-alignbtn { flex: 1.15; }
  .po-letterbtn.po-notebtn { flex: 1; background: transparent; color: ${C.ink2};
    border: 2px solid ${C.ink}; border-radius: 12px; box-shadow: 3px 3px 0 ${C.ink};
    font-family: ${F.mono}; font-size: 11.5px; font-weight: 700; letter-spacing: .1em;
    text-transform: uppercase; height: 56px; align-self: center;
    transition: opacity .25s, visibility 0s linear .25s, transform .1s ease-out; }
  .po-letterbtn.po-notebtn:active:not(:disabled) { transform: translate(2px, 2px); box-shadow: 1px 1px 0 ${C.ink}; }
  .po-letterbtn.po-notebtn:disabled { opacity: .35; cursor: default; }

  .po-inputarea { position: absolute; top: 0; left: 0; right: 0; padding: 14px 16px 18px;
    display: flex; flex-direction: column; gap: 12px; opacity: 0; pointer-events: none; visibility: hidden;
    transition: opacity .3s ease, visibility 0s linear .3s; }
  .po-accordion.input-active .po-inputarea { opacity: 1; pointer-events: auto; visibility: visible;
    transition: opacity .3s ease .12s, visibility 0s; }

  .po-inputhead { display: flex; align-items: center; gap: 10px; }
  .po-kicker { flex: 1; font-family: ${F.mono}; font-size: 10px; font-weight: 700;
    letter-spacing: .14em; text-transform: uppercase; color: ${C.ink3}; }
  .po-count { font-family: ${F.mono}; font-size: 11px; font-weight: 700; color: ${C.ink2};
    font-variant-numeric: tabular-nums; }
  .po-collapse { display: flex; padding: 4px; margin: -4px; background: none; border: none;
    color: ${C.ink3}; cursor: pointer; }

  .po-fieldwrap { position: relative; border-radius: 14px; background: ${C.card};
    border: 2px solid ${C.ink}; overflow: hidden; transition: box-shadow .15s ease-out; }
  .po-fieldwrap:focus-within { box-shadow: 3px 3px 0 ${C.ink}; }
  .po-input { display: block; width: 100%; height: 118px; resize: none; border: none; outline: none;
    background: transparent; padding: 13px 14px 16px; font-family: ${F.body}; font-size: 15px;
    line-height: 1.5; color: ${C.ink}; caret-color: ${C.coral}; }
  .po-input::placeholder { color: ${C.ink3}; opacity: 1; }
  .po-bar { position: absolute; left: 0; right: 0; bottom: 0; height: 4px; background: ${C.hair}; }
  .po-barfill { height: 100%; background: ${C.coral}; transition: width .25s ease-out; }

  .po-send { height: 50px; width: 100%; border: 2px solid ${C.hair}; border-radius: 14px; background: ${C.card};
    color: ${C.ink3}; font-family: ${F.mono}; font-size: 12.5px; font-weight: 700; letter-spacing: .14em;
    text-transform: uppercase; cursor: default;
    transition: background .25s, color .25s, border-color .25s, transform .1s ease-out, box-shadow .1s ease-out; }
  .po-send.ready { border-color: ${C.ink}; background: ${C.yellow}; color: ${C.ink}; cursor: pointer;
    box-shadow: 4px 4px 0 ${C.ink}; }
  .po-send.ready:active { transform: translate(4px, 4px); box-shadow: 0 0 0 ${C.ink}; }

  /* ═══ the seal ═══ */
  .po-seal { position: relative; width: 100%; height: 100%; border-radius: 50%; background: ${C.yellow};
    border: 3px solid ${C.ink}; display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 3px; color: ${C.ink}; box-shadow: 5px 5px 0 ${C.ink}; }
  .po-seal-ring { position: absolute; inset: 5px; border-radius: 50%; border: 2px dashed rgba(25,25,25,0.35); }
  .po-seal-label { font-family: ${F.mono}; font-size: 7.5px; font-weight: 700;
    letter-spacing: .18em; color: ${C.ink}; }

  .po-btn:focus-visible, .po-letterbtn:focus-visible, .po-send:focus-visible {
    outline: 3px solid ${C.coral}; outline-offset: 2px; }

  @media (prefers-reduced-motion: reduce) {
    .po-accordion, .po-content, .po-inputarea, .po-letterbtn { transition: none !important; }
  }
`;

let popCssInjected = false;
function injectPopCss() {
  if (popCssInjected || typeof document === 'undefined') return;
  if (document.getElementById('po-css')) { popCssInjected = true; return; }
  const tag = document.createElement('style');
  tag.id = 'po-css';
  tag.textContent = POP_CSS;
  document.head.appendChild(tag);
  popCssInjected = true;
}
injectPopCss();

/* ── score dial — same ring as ProfileCard, count-up via MotionValue ── */
/* Registry of open-able popouts. A card mounts seven of them and any can be
   popped, so "close the popout" has to mean "close whichever is open" rather
   than "close the one whose ref I happened to hold". */
const popoutClosers = new Set();
const registerPopoutCloser = (fn) => { popoutClosers.add(fn); };
const unregisterPopoutCloser = (fn) => { popoutClosers.delete(fn); };
export const closeAllPopouts = () => { popoutClosers.forEach((fn) => fn()); };

const PopoutItem = ({ children, targetId, onAction, type, style, isGated = false }) => {
  const isDesktop = useIsDesktop();
  const reduceMotion = useReducedMotion();

  const [isPopped, setIsPopped] = useState(false);
  const [rect, setRect] = useState(null);
  const [popSize, setPopSize] = useState(null);   // natural (unscaled) size of the item
  const [stageW, setStageW] = useState(0);        // width available in the modal
  const [noteText, setNoteText] = useState('');
  const [actionSent, setActionSent] = useState(false);
  const [showSeal, setShowSeal] = useState(false);
  const [sealKind, setSealKind] = useState('align');
  const [showInput, setShowInput] = useState(false);
  const [isCardExpanded, setIsCardExpanded] = useState(false);

  const itemRef = useRef(null);
  const stageRef = useRef(null);
  const cardRef = useRef(null);      // dialog itself — receives initial focus
  const noteRef = useRef(null);      // letter textarea — preventScroll autofocus
  const sealTimer = useRef(null);


  const updateRect = useCallback(() => {
    const el = itemRef.current;
    if (!el) return;
    setRect(el.getBoundingClientRect());
    // layout size (transform-free) — this is what we scale up in the modal
    setPopSize({ w: el.offsetWidth, h: el.offsetHeight });
  }, []);

  /* measure the modal's inner stage — and KEEP measuring across
     rotation / resize / keyboard show, so zoom never goes stale */
  useLayoutEffect(() => {
    if (!isPopped) { setStageW(0); return; }
    const el = stageRef.current;
    if (!el) { setStageW(0); return; }
    const measure = () => setStageW(el.clientWidth || 0);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    window.addEventListener('orientationchange', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('orientationchange', measure);
    };
  }, [isPopped, type]);

  useEffect(() => {
    if (isPopped) {
      const timer = setTimeout(() => setIsCardExpanded(true), 50);
      return () => clearTimeout(timer);
    }
    setIsCardExpanded(false);
  }, [isPopped]);

  /* ════ THE HARDENING — scroll lock + focus discipline ════
     Same disease ReportModal had, same cure: while the dialog is open the
     body is locked, on close the exact scroll position is restored, and
     every focus move happens with { preventScroll: true } so the browser
     can never auto-scroll the document out from under the deck. */
  useEffect(() => {
    if (!isPopped) return;
    const prevOverflow = document.body.style.overflow;
    const prevFocus = document.activeElement;
    const sx = window.scrollX;
    const sy = window.scrollY;
    document.body.style.overflow = 'hidden';

    const focusTimer = setTimeout(() => {
      cardRef.current?.focus({ preventScroll: true });
    }, 60);

    return () => {
      clearTimeout(focusTimer);
      document.body.style.overflow = prevOverflow;
      window.scrollTo(sx, sy);
      if (prevFocus && typeof prevFocus.focus === 'function') {
        prevFocus.focus({ preventScroll: true });
      }
    };
  }, [isPopped]);

  /* Tab stays inside the dialog while it's open */
  const trapTab = useCallback((e) => {
    if (e.key !== 'Tab') return;
    const card = cardRef.current;
    if (!card) return;
    const nodes = Array.from(
      card.querySelectorAll('button, textarea, input, a[href], [tabindex]:not([tabindex="-1"])')
    ).filter((n) => !n.disabled && n.offsetParent !== null
      && getComputedStyle(n).visibility !== 'hidden');
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }, []);

  /* ════ jitter-proof long-press (unchanged) ════ */
  const press = useRef({ timer: null, id: null, x: 0, y: 0 });

  const clearPress = useCallback(() => {
    if (press.current.timer) { clearTimeout(press.current.timer); press.current.timer = null; }
    press.current.id = null;
  }, []);

  useEffect(() => {
    const el = itemRef.current;
    if (!el) return;

    const onDown = (e) => {
      if (e.pointerType === 'mouse') return;
      if (!e.isPrimary) return;
      if (press.current.timer) return;
      press.current.id = e.pointerId;
      press.current.x = e.clientX;
      press.current.y = e.clientY;
      press.current.timer = setTimeout(() => {
        press.current.timer = null;
        triggerHaptic('medium');
        updateRect();
        setIsPopped(true);
      }, PRESS_MS);
    };

    const onMove = (e) => {
      if (!press.current.timer || e.pointerId !== press.current.id) return;
      const dx = e.clientX - press.current.x;
      const dy = e.clientY - press.current.y;
      if (dx * dx + dy * dy > PRESS_SLOP * PRESS_SLOP) clearPress();
    };

    const onUp = (e) => {
      if (e.pointerId === press.current.id) clearPress();
    };

    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      clearPress();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closePopout = useCallback(() => {
    triggerHaptic('light');
    setShowInput(false);
    setIsPopped(false);
    setIsCardExpanded(false);
  }, []);

  /* ── shared "close all popouts" registry ──
     A ProfileCard renders SEVEN PopoutItems, each of which can be open, so a
     single forwarded ref is the wrong shape: useImperativeHandle overwrites the
     ref on every mount, so the deck's close() would land on whichever happened
     to mount last — usually not the one the user actually tapped.

     Instead each instance registers its own closer here, and the deck calls
     closeAll(). Cheap (the list is emptied on unmount) and it closes whatever
     is open, which is the actual requirement: the gate toast must never render
     over a live modal scrim. */
  useEffect(() => {
    registerPopoutCloser(closePopout);
    return () => unregisterPopoutCloser(closePopout);
  }, [closePopout]);

  const openPopout = useCallback(() => {
    if (isPopped || actionSent) return;
    triggerHaptic('medium');
    updateRect();
    setIsPopped(true);
  }, [isPopped, actionSent, updateRect]);

  const handleDesktopClick = (e) => {
    if (!isDesktop || isPopped) return;
    if (e.target?.closest?.('button, a, textarea, input')) return;
    openPopout();
  };

  const handleDesktopContextMenu = (e) => {
    e.preventDefault();
    if (isDesktop) openPopout();
  };

  useEffect(() => {
    if (!isPopped) return;
    const onKey = (e) => { if (e.key === 'Escape') closePopout(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isPopped, closePopout]);

  /* seal timer is MANAGED now — cleared on unmount so a card leaving the
     deck mid-animation can never fire callbacks into a dead component */
  useEffect(() => () => {
    if (sealTimer.current) clearTimeout(sealTimer.current);
  }, []);

  const triggerSealAnimation = useCallback((callback) => {
    if (reduceMotion) {
      // no motion requested → skip the stamp, resolve immediately
      setIsPopped(false);
      setShowInput(false);
      setIsCardExpanded(false);
      callback?.();
      return;
    }
    setShowSeal(true);
    if (sealTimer.current) clearTimeout(sealTimer.current);
    sealTimer.current = setTimeout(() => {
      sealTimer.current = null;
      setShowSeal(false);
      setIsPopped(false);
      setShowInput(false);
      setIsCardExpanded(false);
      if (callback) callback();
    }, SEAL_MS);
  }, [reduceMotion]);

  /* ── THE GATE ──
     When the viewer is under the interaction threshold, the parent's
     handleAction will open the gate instead of sending. The seal animation must
     NOT play and `actionSent` must NOT latch in that case: the popout has to
     stay open and armed so that when the gate resolves, the replayed action
     finds the same live popout and the user never taps twice.

     The parent tells us which case we're in via `isGated`, so this component
     never has to know the threshold — one rule, decided in one place. */
  /* ✨ ALIGN — the one positive action.

     Both states of the accordion call this: the collapsed button (no note) and
     the composer's Align button (note attached). `targetId` is always carried,
     so an align is always attributable to the specific photo or prompt the user
     tapped — that attribution is what the note is written about.

     The gated path hands off WITHOUT sealing or latching, matching what the
     retired like handler did. The note is left in `noteText` untouched so the
     parent's replay after the gate resolves carries the exact words that were
     typed; silently discarding someone's message because their profile was
     short at that instant is the worst available way to fail this. */
  const handleAlignNow = () => {
    if (actionSent) return;
    const trimmed = noteText.trim();

    if (isGated) {
      triggerHaptic('medium');
      onAction('align', trimmed ? { target: targetId, note: trimmed } : { target: targetId });
      return;
    }

    setActionSent(true);
    setSealKind('align');
    triggerHaptic('heavy');
    triggerSealAnimation(() => {
      onAction('align', trimmed ? { target: targetId, note: trimmed } : { target: targetId });
      setNoteText('');
    });
  };

  /* letter textarea: focus WITHOUT the auto-scroll side effect */
  useEffect(() => {
    if (showInput) noteRef.current?.focus({ preventScroll: true });
  }, [showInput]);

  const completionPercentage = Math.min((noteText.length / 140) * 100, 100);
  const dragDismiss = (e, info) => {
    if (Math.hypot(info.offset.x, info.offset.y) > 80) closePopout();
  };

  const itemHandlers = {
    onClick: handleDesktopClick,
    onContextMenu: handleDesktopContextMenu,
    title: isDesktop ? 'Click to open' : undefined,
    style: { WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none', cursor: isDesktop ? 'pointer' : undefined },
  };

  /* uniform zoom: fit the modal stage width, capped so it never gets silly */
  const zoom = popSize && stageW > 0 ? clamp(stageW / popSize.w, SCALE_MIN, SCALE_MAX) : 0;

  /* ───────────────────── flower · telegram · letter ───────────────────── */
  return (
    <div
      ref={itemRef}
      {...itemHandlers}
      style={{ position: 'relative', width: '100%', height: '100%', ...itemHandlers.style, ...style }}
    >
      <motion.div
        animate={{ scale: isPopped ? 1.04 : 1, zIndex: isPopped ? 100 : 1 }}
        transition={{ type: 'spring', damping: 22, stiffness: 300 }}
        style={{ height: '100%', transformOrigin: 'center', borderRadius: 20, willChange: 'transform' }}
      >
        {children}
      </motion.div>

      {/* seal */}
      {showSeal && rect && createPortal(
        <motion.div
          initial={{ opacity: 0, scale: 2.2, rotate: -14 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: 'spring', damping: 14, stiffness: 220 }}
          style={{ position: 'fixed', top: rect.top + (rect.height / 2) - 38, left: rect.left + (rect.width / 2) - 38, width: 76, height: 76, zIndex: 10000, pointerEvents: 'none' }}
        >
          <motion.span
            aria-hidden="true"
            initial={{ scale: 0.8, opacity: 0.7 }}
            animate={{ scale: 1.7, opacity: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: `2px solid ${C.ink}` }}
          />
          {/* One seal, one word. The retired version branched on which of three
              actions fired; with a single action there is nothing to branch on,
              and a seal that can say TELEGRAM next to a button that no longer
              exists is worse than no seal at all. */}
          <div className="po-seal">
            <span className="po-seal-ring" aria-hidden="true" />
            <span className="po-seal-label">ALIGNED</span>
          </div>
        </motion.div>,
        document.body
      )}

      {createPortal(
        <AnimatePresence>
          {isPopped && (
            <motion.div
              key="po-sandwich-overlay"
              className="po-overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={closePopout}
            >
              <div className="po-scroll">
                <motion.div
                  className={`po-card po-sandwich ${isCardExpanded ? 'expanded' : ''}`}
                  role="dialog"
                  aria-modal="true"
                  aria-label="Align with this profile"
                  ref={cardRef}
                  tabIndex={-1}
                  onKeyDown={trapTab}
                  initial={{ scale: 0.88, opacity: 0, y: 32 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 24 }}
                  transition={{ type: 'spring', damping: 26, stiffness: 300 }}
                  drag={!showInput}
                  dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
                  dragElastic={0.7}
                  onDragEnd={dragDismiss}
                  onClick={(e) => e.stopPropagation()}
                  style={{ willChange: 'transform', touchAction: showInput ? 'auto' : 'none' }}
                >
                  {/* center — the item, ZOOMED to reading size */}
                  <div className="po-center" onClick={() => setIsCardExpanded((v) => !v)}>
                    <div className="po-stage" ref={stageRef}>
                      {zoom > 0 && popSize && (
                        <div
                          className="po-content"
                          style={{ width: Math.round(popSize.w * zoom), height: Math.round(popSize.h * zoom) }}
                        >
                          <div style={{ width: popSize.w, height: popSize.h, transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
                            {children}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* bottom — letter accordion */}
                  <div className="po-panel-bottom">
                    <div className={`po-accordion ${showInput ? 'input-active' : ''}`}>
                      {/* ✨ ALIGN — collapsed state.
                          Tapping this aligns with THIS photo or prompt and
                          dismisses. Two routes to one action, not two actions.

                          "Add a note" sits beside it rather than behind it.
                          It used to BE this button, which meant the only way to
                          say yes was to first decide you wanted to write
                          something — friction on the gesture that needed least
                          of it. Both now sit side by side in the collapsed bar,
                          so the choice is visible instead of sequential. */}
                      <div className={`po-alignrow ${showInput ? 'hide' : ''}`}>
                        <button
                          type="button"
                          className="po-letterbtn po-alignbtn"
                          onClick={(e) => { e.stopPropagation(); triggerHaptic('heavy'); handleAlignNow(); }}
                          disabled={actionSent}
                        >
                          Align
                        </button>
                        <button
                          type="button"
                          className="po-letterbtn po-notebtn"
                          onClick={(e) => { e.stopPropagation(); triggerHaptic('light'); setShowInput(true); }}
                          disabled={actionSent || showInput}
                        >
                          Add a note
                        </button>
                      </div>

                      <div className="po-inputarea">
                        <div className="po-inputhead">
                          <span className="po-kicker">Add a note (optional)</span>
                          <span className="po-count">{noteText.length} / 140</span>
                          <button
                            type="button"
                            className="po-collapse"
                            aria-label="Collapse"
                            onClick={(e) => { e.stopPropagation(); setShowInput(false); }}
                          >
                            <ChevronDown size={15} strokeWidth={2.2} />
                          </button>
                        </div>
                        <div className="po-fieldwrap">
                          <textarea
                            className="po-input"
                            placeholder="I noticed that you also..."
                            ref={noteRef}
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            maxLength={140}
                          />
                          <div className="po-bar" aria-hidden="true">
                            <div className="po-barfill" style={{ width: `${completionPercentage}%` }} />
                          </div>
                        </div>
                        {/* Same action as the collapsed button above, carrying
                            the note. Deliberately NOT disabled when empty: an
                            align with no note is a complete, valid action, and
                            requiring text here would put the fast path and the
                            thoughtful path behind different thresholds for no
                            reason. */}
                        <button
                          type="button"
                          className={`po-send ${noteText.trim() ? 'ready' : ''}`}
                          onClick={handleAlignNow}
                          disabled={actionSent}
                        >
                          Align
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default PopoutItem;

```

### ./client/src/components/ProfileCardSkeleton.jsx

```
// client/src/components/ProfileCardSkeleton.jsx
import React from 'react';
import neu from '../styles/neu';

/* Self-contained shimmer (sk-* namespace).
   Matches the deck card's ENTRANCE START STATE: full-bleed photo only —
   the sheet is parked below the fold while the entrance plays, so showing
   it at peek here would cause a position jump at swap-in. The sheet
   gliding up IS the "loaded" moment. */
const SKELETON_CSS = `
  @keyframes sk-sweep { from { background-position: 200% 0; } to { background-position: -200% 0; } }
  .sk-photo { background-color: #1b1b1b;
    background-image: linear-gradient(100deg, transparent 25%, rgba(255,255,255,0.06) 50%, transparent 75%);
    background-size: 200% 100%; background-repeat: no-repeat;
    animation: sk-sweep 2.2s linear infinite; }
  @media (prefers-reduced-motion: reduce) {
    .sk-photo { animation: none; }
  }
`;

const ProfileCardSkeleton = () => (
  <div
    aria-hidden="true"
    style={{
      position: 'relative', width: '100%', height: '100%',
      overflow: 'hidden', backgroundColor: neu.desk, contain: 'strict',
    }}
  >
    <style>{SKELETON_CSS}</style>

    {/* photo — full-bleed shimmer, same scrim recipe as the real card */}
    <div className="sk-photo" style={{ position: 'absolute', inset: 0 }} />
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      background: 'linear-gradient(to top, rgba(17,18,17,.65) 0%, rgba(17,18,17,.08) 44%, rgba(17,18,17,.20) 100%)',
    }} />
  </div>
);

export default ProfileCardSkeleton;
```

### ./client/src/components/PushPrompt.jsx

```
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell } from 'lucide-react';
import { subscribeToPush, registerServiceWorker } from '../utils/push';
import { triggerHaptic } from '../utils/haptics';
import neu from '../styles/neu';

const PREF_KEY = 'matchalize:pushState';

/* The shared neo-brutalist canon (src/styles/neu.js) */
const t = neu;

const PUSH_CSS = `
  .pp-slam { transition: transform .08s steps(2), box-shadow .08s steps(2), background .08s steps(2);
    -webkit-tap-highlight-color: transparent; }
  .pp-slam:active { transform: translate(3px, 3px) !important; box-shadow: 0 0 0 #191919 !important; }
  .pp-slam:focus-visible { outline: 3px solid #FFD43D; outline-offset: 2px; }
  @media (hover: hover) and (pointer: fine) {
    .pp-slam:hover:not(:active) { transform: translate(-1px, -1px); box-shadow: 4px 4px 0 #191919; }
  }
  @media (prefers-reduced-motion: reduce) {
    .pp-slam { transition: none; }
  }
`;

const PushPrompt = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      // Skip where push simply cannot work (no SW / no Push API / iOS Safari pre-16.4)
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return;

      const saved = localStorage.getItem(PREF_KEY);
      if (saved === 'subscribed' || saved === 'dismissed') return;

      try {
        const reg = await registerServiceWorker();
        if (!reg || cancelled) return;

        // Non-triggering check — we never auto-subscribe here (no user gesture).
        const existing = await reg.pushManager.getSubscription();
        if (cancelled) return;

        if (existing) {
          localStorage.setItem(PREF_KEY, 'subscribed');
          return;
        }
        if (Notification.permission === 'denied') {
          localStorage.setItem(PREF_KEY, 'dismissed');
          return;
        }
        setVisible(true);
      } catch {
        // No-op — fail silently, never nag on errors
      }
    };

    init();
    return () => { cancelled = true; };
  }, []);

  const handleEnable = async () => {
    triggerHaptic('light');
    const sub = await subscribeToPush(); // runs inside this click = real user gesture
    localStorage.setItem(PREF_KEY, sub ? 'subscribed' : 'dismissed');
    setVisible(false);
  };

  const handleDismiss = () => {
    triggerHaptic('light');
    localStorage.setItem(PREF_KEY, 'dismissed');
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.97 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          style={{
            position: 'fixed',
            right: 14,
            bottom: 'calc(84px + env(safe-area-inset-bottom))',
            left: 14,
            maxWidth: 360,
            margin: '0 auto',
            zIndex: 1200,
            backgroundColor: t.paper,
            border: `2px solid ${t.ink}`,
            borderRadius: 18,
            boxShadow: `6px 6px 0 ${t.ink}`,
            padding: '14px 16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* bell in a candy tile — the vitals-tile language */}
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 13,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: t.yellow,
                border: `2px solid ${t.ink}`,
                boxShadow: `3px 3px 0 ${t.ink}`,
                flexShrink: 0,
              }}
            >
              <Bell size={20} color={t.ink} strokeWidth={2.4} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: t.fontHeavy, fontSize: 14, fontWeight: 400, color: t.ink, lineHeight: 1.25, textTransform: 'uppercase', letterSpacing: '-.005em' }}>
                Enable notifications?
              </div>
              <div style={{ fontFamily: t.fontBody, fontSize: 12, fontWeight: 500, color: t.ink2, marginTop: 4, lineHeight: 1.45 }}>
                Get alerted the moment a letter or telegram lands in your Letterbox.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button
              className="pp-slam"
              onClick={handleEnable}
              style={{
                flex: 1,
                padding: '12px 14px',
                border: `2px solid ${t.ink}`,
                borderRadius: 11,
                backgroundColor: t.yellow,
                color: t.ink,
                fontFamily: t.fontMono,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '.1em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                boxShadow: `3px 3px 0 ${t.ink}`,
              }}
            >
              Enable
            </button>
            <button
              className="pp-slam"
              onClick={handleDismiss}
              style={{
                padding: '12px 16px',
                border: `2px solid ${t.ink}`,
                borderRadius: 11,
                backgroundColor: t.card,
                color: t.ink2,
                fontFamily: t.fontMono,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '.1em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              Not now
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PushPrompt;
```

### ./client/src/components/ShadowbanBanner.jsx

```
import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import neu from '../styles/neu';

/* The shared neo-brutalist canon (src/styles/neu.js) */
const t = neu;

/**
 * ShadowbanBanner — Shows "account under review" banner.
 * NEVER reveals scores, weights, tiers, or how many reports.
 *
 * Props:
 *   isUnderReview: Boolean — safe status flag for the authenticated user
 *   onLearnMore: Function — callback to open Learn More sheet
 */
const ShadowbanBanner = ({ isUnderReview = false, onLearnMore }) => {
  if (!isUnderReview) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{
        backgroundColor: t.paper,
        border: `2px solid ${t.ink}`,
        borderRadius: 14,
        boxShadow: `4px 4px 0 ${t.ink}`,
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        margin: '0 14px 14px',
        position: 'relative',
      }}
    >
      <div style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: t.coral,
        border: `2px solid ${t.ink}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <AlertTriangle size={17} color={t.ink} strokeWidth={2.4} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: t.fontBody,
          fontSize: 13,
          fontWeight: 700,
          color: t.ink,
          margin: 0,
          lineHeight: 1.4,
        }}>
          Your account is currently under review.
        </p>
        <p style={{
          fontFamily: t.fontBody,
          fontSize: 12,
          fontWeight: 500,
          color: t.ink2,
          margin: '3px 0 0 0',
          lineHeight: 1.45,
        }}>
          'Profile editing may be temporarily limited.'
        </p>
      </div>

      <button
        className="sb-slam"
        onClick={() => { triggerHaptic('light'); onLearnMore(); }}
        aria-label="Learn more about account review"
        style={{
          backgroundColor: t.paper,
          border: `1.5px solid ${t.ink}`,
          borderRadius: 9,
          padding: '8px 11px',
          fontFamily: t.fontMono,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '.1em',
          textTransform: 'uppercase',
          color: t.ink,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          boxShadow: `2px 2px 0 ${t.ink}`,
          transition: 'transform .08s steps(2), box-shadow .08s steps(2)',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        Info
      </button>

      <style>{`
        .sb-slam { transition: transform .08s steps(2), box-shadow .08s steps(2); }
        .sb-slam:active { transform: translate(2px, 2px); box-shadow: 0 0 0 ${t.ink}; }
        .sb-slam:focus-visible { outline: 3px solid ${t.yellow}; outline-offset: 2px; }
        @media (hover: hover) and (pointer: fine) {
          .sb-slam:hover:not(:active) { transform: translate(-1px, -1px); box-shadow: 3px 3px 0 ${t.ink}; }
        }
        @media (prefers-reduced-motion: reduce) {
          .sb-slam { transition: none; }
        }
      `}</style>
    </motion.div>
  );
};

export default ShadowbanBanner;
```

### ./client/src/components/Skeleton.jsx

```
// client/src/components/Skeleton.jsx
import React from 'react';
import neu from '../styles/neu';

/* ── Locked skeleton system — matches the neubrutalism theme ──
   Fill = the cream hairline tone (visible on both the dark desk and cream sheets).
   Shimmer = a single ink-tinted sweep, GPU-composited (background-position only). */

const SKELETON_CSS = `
  .sk-box { position: relative; overflow: hidden; flex-shrink: 0;
    background-color: ${neu.hair};
    contain: paint; }
  .sk-box::after { content: ''; position: absolute; inset: 0;
    background-image: linear-gradient(100deg, transparent 30%, rgba(255,255,255,0.55) 50%, transparent 70%);
    background-size: 200% 100%; background-repeat: no-repeat;
    animation: sk-sweep 1.6s linear infinite; }
  @keyframes sk-sweep { from { background-position: 200% 0; } to { background-position: -200% 0; } }

  /* on dark surfaces the cream block already pops — keep it, just dim the sweep */
  .sk-dark .sk-box::after { background-image: linear-gradient(100deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%); }

  @media (prefers-reduced-motion: reduce) {
    .sk-box::after { animation: none; }
  }
`;

/* Inject once per page — the ::after keyframes can't be inlined per-element */
let cssInjected = false;
const ensureCss = () => {
  if (cssInjected || typeof document === 'undefined') return;
  const tag = document.createElement('style');
  tag.textContent = SKELETON_CSS;
  document.head.appendChild(tag);
  cssInjected = true;
};

export const SkeletonBox = ({ width, height, radius = 4, dark = false }) => {
  ensureCss();

  return (
    <div
      className={`sk-box${dark ? ' sk-dark' : ''}`}
      aria-hidden="true"
      style={{
        width,
        height,
        borderRadius: radius,
      }}
    />
  );
};

export default SkeletonBox;
```

### ./client/src/components/chat/EmojiPicker.jsx

```
import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../../utils/haptics';
import neu from '../../styles/neu';

const REACTION_EMOJIS = ['❤️', '😂', '🔥', '👍', '😲', '😢'];

const t = neu;

const EmojiPicker = ({ anchorRect, onSelect, onClose }) => {
  if (!anchorRect) return null;

  // Strict 8-Point Grid Geometry
  const pickerWidth = 288; // 36 * 8
  const pickerHeight = 64; // 8 * 8
  const padding = 16;
  const safeAreaTop = 60; // Assumes a standard mobile header clearance

  // Calculate vertical position (default above, flip below if obstructed)
  let top = anchorRect.top - pickerHeight - 16;
  if (top < padding + safeAreaTop) {
    top = anchorRect.bottom + 16;
  }

  // Calculate horizontal position (centered over bubble, clamped to screen edges)
  let left = anchorRect.left + (anchorRect.width / 2) - (pickerWidth / 2);
  if (left < padding) {
    left = padding;
  }
  if (left + pickerWidth > window.innerWidth - padding) {
    left = window.innerWidth - pickerWidth - padding;
  }

  return createPortal(
    <AnimatePresence>
      {/* GPU Promoted CSS Physics for Zero-Lag Emojis */}
      <style>{`
        .tactile-emoji {
          will-change: transform;
          transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
          transform: translate3d(0, 0, 0) scale3d(1, 1, 1);
        }
        
        @media (hover: hover) {
          .tactile-emoji:hover {
            transform: translate3d(0, -6px, 0) scale3d(1.35, 1.35, 1);
            z-index: 10;
          }
        }
        
        .tactile-emoji:active {
          transform: translate3d(0, 2px, 0) scale3d(0.85, 0.85, 1) !important;
          transition: transform 0.08s cubic-bezier(0, 0, 0.2, 1) !important;
        }

        @media (prefers-reduced-motion: reduce) {
          .tactile-emoji { transition: none !important; transform: none !important; }
        }
      `}</style>

      {/* Dimmed Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(25, 25, 25, 0.4)',
          backdropFilter: 'blur(2px)', // Subtle focus pull
          zIndex: 9996,
        }}
      />

      {/* Floating Reaction Pill */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.85, y: 12 }}
        transition={{ type: 'spring', damping: 24, stiffness: 400 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top,
          left,
          width: pickerWidth,
          height: pickerHeight,
          backgroundColor: t.paper,
          backgroundImage: `url("${t.grain || ''}")`,
          border: `2px solid ${t.ink}`,
          borderRadius: '32px', // Pill shape for reaction menus
          zIndex: 9997,
          padding: '0 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          contain: 'layout style paint', // Isolates layout from the chat beneath it
        }}
      >
        {/* Specular Highlight Overlay */}
        <div 
          aria-hidden="true" 
          style={{ 
            position: 'absolute', inset: 0, borderRadius: '32px', pointerEvents: 'none',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 50%)', 
          }} 
        />

        {REACTION_EMOJIS.map((emoji, i) => (
          <motion.button
            key={emoji}
            initial={{ opacity: 0, y: 10, scale: 0.5 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: i * 0.03, type: 'spring', damping: 18, stiffness: 300 }}
            className="tactile-emoji"
            onClick={() => {
              triggerHaptic('medium');
              onSelect(emoji);
            }}
            aria-label={`React with ${emoji}`}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '28px',
              cursor: 'pointer',
              padding: '8px',
              margin: 0,
              lineHeight: 1,
              position: 'relative',
              zIndex: 2,
              WebkitTapHighlightColor: 'transparent',
              outline: 'none',
            }}
          >
            {emoji}
          </motion.button>
        ))}
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default EmojiPicker;
```

### ./client/src/components/chat/MessageActionMenu.jsx

```
import React, { memo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../../utils/haptics';
import neu from '../../styles/neu';

const t = neu;

// Zero-Lag Memoized Icon Component
const Icon = memo(({ path, size = 20, color = t.ink, strokeWidth = 1.8 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth={strokeWidth} 
    strokeLinecap="round" 
    strokeLinejoin="round"
    aria-hidden="true"
    style={{ display: 'block', flexShrink: 0 }}
  >
    {path}
  </svg>
));
Icon.displayName = 'Icon';

const actions = [
  { key: 'reply', label: 'Reply', haptic: 'light', hideIfMedia: false, hideIfMine: false, showOnlyIfMine: false, path: <><polyline points="9 17 4 12 9 7" /><path d="M20 18v-2a4 4 0 0 0-4-4H4" /></> },
  { key: 'react', label: 'React', haptic: 'light', hideIfMedia: false, hideIfMine: false, showOnlyIfMine: false, path: <><circle cx="12" cy="12" r="9" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></> },
  { key: 'copy', label: 'Copy', haptic: 'light', hideIfMedia: true, hideIfMine: false, showOnlyIfMine: false, path: <><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></> },
  { key: 'report', label: 'Report', haptic: 'medium', hideIfMedia: false, hideIfMine: true, showOnlyIfMine: false, path: <><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></> },
  { key: 'delete', label: 'Delete', haptic: 'medium', hideIfMedia: false, hideIfMine: false, showOnlyIfMine: true, path: <><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></> },
];

const MessageActionMenu = ({ anchorRect, isMine, isMedia, onClose, onReply, onReact, onCopy, onReport, onDelete }) => {
  if (!anchorRect) return null;
  const handlers = { reply: onReply, react: onReact, copy: onCopy, report: onReport, delete: onDelete };

  // Filter available actions based on message context
  const visible = actions.filter((a) => {
    if (a.hideIfMedia && isMedia) return false;
    if (a.hideIfMine && isMine) return false;
    if (a.showOnlyIfMine && !isMine) return false;
    return true;
  });

  // Strict 8-Point Grid Geometry Math
  const menuWidth = 216;
  const padding = 16;
  const itemHeight = 44; // Approx height per item
  const menuHeight = (visible.length * itemHeight) + 16; // 16px total vertical padding

  // Safe-area positioning logic
  let top = anchorRect.top - menuHeight - 12;
  if (top < padding + 60) top = anchorRect.bottom + 12; // Flips below if hitting top edge
  
  let left = anchorRect.left + (anchorRect.width / 2) - (menuWidth / 2);
  // Clamp to screen edges
  left = Math.max(padding, Math.min(left, window.innerWidth - menuWidth - padding));

  return createPortal(
    <AnimatePresence>
      {/* Hardware Accelerated Interactive Physics */}
      <style>{`
        .tactile-menu-btn {
          transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), background-color 0.2s ease;
          will-change: transform, background-color;
        }
        @media (hover: hover) {
          .tactile-menu-btn:hover {
            background-color: var(--n-yellow) !important;
          }
          .tactile-menu-btn.danger-btn:hover {
            background-color: var(--n-red) !important;
            color: #fff !important;
          }
        }
        .tactile-menu-btn:active {
          transform: scale3d(0.97, 0.97, 1) !important;
          transition: transform 0.08s cubic-bezier(0, 0, 0.2, 1) !important;
          background-color: var(--n-yellow-deep) !important;
        }
        .tactile-menu-btn.danger-btn:active {
          background-color: var(--n-red) !important;
        }
        @media (prefers-reduced-motion: reduce) {
          .tactile-menu-btn { transition: none !important; transform: none !important; }
        }
      `}</style>

      {/* Backdrop (Focus Pull) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        style={{ 
          position: 'fixed', 
          inset: 0, 
          backgroundColor: 'rgba(25, 25, 25, 0.35)', 
          backdropFilter: 'blur(2px)', 
          zIndex: 9998 
        }}
      />

      {/* Menu Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 8 }}
        transition={{ type: 'spring', damping: 26, stiffness: 380 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top,
          left,
          width: menuWidth,
          backgroundColor: t.card,
          backgroundImage: `url("${t.grain || ''}")`,
          border: `2px solid ${t.ink}`,
          borderRadius: t.radius.lg,
          padding: '8px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '2px', // Slight spacing between rounded pill items
          contain: 'layout style paint',
        }}
      >
        {visible.map((a) => {
          const isDanger = a.key === 'delete' || a.key === 'report';
          const iconColor = isDanger ? t.red : t.ink2;
          const textColor = isDanger ? t.red : t.ink;

          return (
            <button
              key={a.key}
              className={`tactile-menu-btn ${isDanger ? 'danger-btn' : ''}`}
              onClick={() => { 
                triggerHaptic(a.haptic);
                handlers[a.key]?.(); 
                if (a.key !== 'react') onClose();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '12px 16px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: t.radius.sm,
                cursor: 'pointer',
                textAlign: 'left',
                outline: 'none',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <Icon path={a.path} size={18} color={iconColor} strokeWidth={2} />
              <span 
                style={{ 
                  fontFamily: t.fontBody, 
                  fontWeight: 600, 
                  fontSize: '14px',
                  color: textColor,
                  letterSpacing: '0.3px',
                }}
              >
                {a.label}
              </span>
            </button>
          );
        })}
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default MessageActionMenu;
```

### ./client/src/components/chat/MessageBubble.jsx

```
import React, { useRef, useState, memo } from 'react';
import { motion } from 'framer-motion';
import { triggerHaptic } from '../../utils/haptics';
import { Check, CheckCheck } from 'lucide-react';
import PolaroidCard from '../PolaroidCard';
import neu from '../../styles/neu';

const t = neu;

const MessageBubble = ({ 
  message, 
  isMine, 
  time, 
  receipt, 
  onLongPress, 
  onImageClick, 
  replyPreview 
}) => {
  const pressTimer = useRef(null);
  const [isPressed, setIsPressed] = useState(false);

  // Tactile Long Press Engine
  const startPress = (e) => {
    // Prevent menu trigger if user is interacting with media cards directly
    if (e.target.closest('[data-no-longpress]')) return;
    
    pressTimer.current = setTimeout(() => {
      triggerHaptic('medium');
      setIsPressed(true);
      onLongPress(message, e);
      setTimeout(() => setIsPressed(false), 250);
    }, 400); // 400ms aligns with native iOS/Android long-press timing
  };

  const cancelPress = () => {
    if (pressTimer.current) { 
      clearTimeout(pressTimer.current); 
      pressTimer.current = null; 
    }
    setIsPressed(false);
  };

  const renderContent = () => {
    if (message.type === 'image' || (message.type === 'opening_letter' && message.mediaUrl)) {
      return (
        <div data-no-longpress onClick={() => onImageClick?.(message.mediaUrl)} style={{ cursor: 'zoom-in' }}>
          <PolaroidCard src={message.mediaUrl} caption={message.text} tilt={isMine ? '1deg' : '-1deg'} />
        </div>
      );
    }
    if (message.deleted) {
      return (
        <span style={{ fontStyle: 'italic', color: t.ink3, fontSize: '13px', fontFamily: t.fontBody }}>
          This artifact was removed.
        </span>
      );
    }
    if (message.type !== 'text' && message.type !== 'opening_letter') {
      return (
        <span style={{ fontStyle: 'italic', color: t.ink3, fontSize: '13px', fontFamily: t.fontBody }}>
          This message type is no longer available.
        </span>
      );
    }
    return <span style={{ whiteSpace: 'pre-wrap' }}>{message.text}</span>;
  };

  // Group duplicate reactions
  const reactionGroups = {};
  (message.reactions || []).forEach((r) => {
    if (!reactionGroups[r.emoji]) reactionGroups[r.emoji] = [];
    reactionGroups[r.emoji].push(r.user);
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: isPressed ? 0.96 : 1,
      }}
      transition={{ type: 'spring', damping: 26, stiffness: 380 }}
      
      // Touch / Mouse event bindings for Long Press
      // Deleted messages are tombstones — the body/media/reactions are scrubbed,
      // so the action menu has nothing to act on. Wiring the handlers to null
      // stops the menu opening at all, which is what previously let you add
      // fresh reactions to a message that had already been removed.
      onTouchStart={message.deleted ? undefined : startPress}
      onTouchEnd={message.deleted ? undefined : cancelPress}
      onTouchCancel={message.deleted ? undefined : cancelPress}
      onTouchMove={message.deleted ? undefined : cancelPress}
      onMouseDown={message.deleted ? undefined : startPress}
      onMouseUp={message.deleted ? undefined : cancelPress}
      onMouseLeave={message.deleted ? undefined : cancelPress}
      onContextMenu={(e) => e.preventDefault()}
      data-bubble="true"
      data-msg-id={message._id} // Required for SearchOverlay jumping
      
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: isMine ? 'flex-end' : 'flex-start', 
        marginBottom: '20px', 
        userSelect: 'none', 
        WebkitUserSelect: 'none', 
        WebkitTouchCallout: 'none',
        contain: 'layout style', // Isolates layout recalculations strictly to this bubble
        willChange: 'transform, opacity',
      }}
    >
      {/* Attached Archival Reply Note */}
      {replyPreview && !message.deleted && (
        <div style={{ 
          maxWidth: '75%', 
          padding: '8px 12px', 
          marginBottom: '6px', 
          backgroundColor: isMine ? 'var(--n-yellow-deep)' : t.paper, 
          border: `1px solid ${t.ink}`, 
          borderLeft: `3px solid ${t.yellow}`, 
          borderRadius: t.radius.sm, 
          fontSize: '12px', 
          color: t.ink2, 
          fontFamily: t.fontBody, 
          fontStyle: 'italic', 
          whiteSpace: 'nowrap', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis',
        }}>
          Replying to: {replyPreview.text || (replyPreview.type === 'image' ? 'Photograph' : 'Voice Note')}
        </div>
      )}

      {/* Main Message Bubble */}
      <div style={{ 
        maxWidth: '82%', 
        padding: '14px 18px', 
        borderRadius: t.radius.md, 
        backgroundColor: isMine ? t.card : t.paper, 
        border: `2px solid ${t.ink}`, 
        boxShadow: isMine ? t.shadow.sm : 'none',
        color: t.ink, 
        fontFamily: t.fontMono, 
        fontSize: '15px', 
        lineHeight: '1.5', 
        wordBreak: 'break-word', 
        position: 'relative',
      }}>
        {renderContent()}

        {/* Peeling Archival Washi Tape for Text Messages */}
        {message.type === 'text' && !message.deleted && (
          <div 
            aria-hidden="true"
            style={{ 
              position: 'absolute', 
              top: '-8px', 
              [isMine ? 'right' : 'left']: '16px', 
              width: '32px', 
              height: '14px', 
              backgroundColor: 'var(--n-paper)', 
              backdropFilter: 'blur(2px)',
              border: `1px solid ${t.yellow}`,
              transform: `rotate(${isMine ? '4deg' : '-4deg'})`,
              zIndex: 2,
            }} 
          />
        )}
      </div>

      {/* Reaction Cluster */}
      {/* Guarded on `!deleted` as well as in the routes: an older client build
          could still deliver reactions for a message deleted moments earlier. */}
      {!message.deleted && Object.keys(reactionGroups).length > 0 && (
        <div style={{ 
          display: 'flex', 
          gap: '6px', 
          marginTop: '6px', 
          flexWrap: 'wrap', 
          maxWidth: '80%', 
          justifyContent: isMine ? 'flex-end' : 'flex-start' 
        }}>
          {Object.entries(reactionGroups).map(([emoji, users]) => (
            <motion.div 
              key={emoji} 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '4px', 
                padding: '4px 8px', 
                backgroundColor: t.paper, 
                border: `1px solid ${t.ink}`, 
                borderRadius: t.radius.pill, 
                fontSize: '14px', 
                lineHeight: 1,
              }}
            >
              <span>{emoji}</span>
              {users.length > 1 && (
                <span style={{ 
                  fontFamily: t.fontBody, 
                  fontSize: '11px', 
                  fontWeight: 700, 
                  color: t.ink3 
                }}>
                  {users.length}
                </span>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Meta: Time & Read Receipts */}
      <div style={{ 
        marginTop: '8px', 
        fontSize: '10px', 
        fontFamily: t.fontBody, 
        fontWeight: 700, 
        letterSpacing: '1px', 
        color: t.ink3, 
        display: 'flex', 
        gap: '8px', 
        alignItems: 'center', 
        textTransform: 'uppercase' 
      }}>
        <span style={{ fontFamily: t.fontMono }}>{time}</span>
        {receipt && (
          <span style={{ 
            color: message.readAt ? t.green : t.yellow, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px',
            transition: 'color 0.3s ease'
          }}>
            {message.readAt ? <CheckCheck size={12} strokeWidth={2.5} /> : <Check size={12} strokeWidth={2.5} />} 
            {receipt}
          </span>
        )}
      </div>
    </motion.div>
  );
};

// Zero-Lag Deep Equality Check
// Ensures the bubble ONLY re-renders if its specific data changes, 
// completely preventing chat-scroll lag.
const areEqual = (prev, next) => {
  return (
    prev.message._id === next.message._id &&
    prev.message.readAt === next.message.readAt &&
    prev.message.deleted === next.message.deleted &&
    prev.receipt === next.receipt &&
    JSON.stringify(prev.message.reactions) === JSON.stringify(next.message.reactions)
  );
};

export default memo(MessageBubble, areEqual);
```

### ./client/src/components/chat/PhotoViewer.jsx

```
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../../utils/haptics';
import neu from '../../styles/neu';
import { X } from 'lucide-react';

const t = neu;

// GPU-Promoted, Memoized Archival Corner Mounts
const CornerMounts = React.memo(() => (
  <>
    <span aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0, width: 24, height: 24, background: t.card, clipPath: 'polygon(0 0, 100% 0, 0 100%)', zIndex: 3 }} />
    <span aria-hidden="true" style={{ position: 'absolute', top: 0, right: 0, width: 24, height: 24, background: t.card, clipPath: 'polygon(100% 0, 0 0, 100% 100%)', zIndex: 3 }} />
    <span aria-hidden="true" style={{ position: 'absolute', bottom: 0, left: 0, width: 24, height: 24, background: t.card, clipPath: 'polygon(0 100%, 100% 100%, 0 0)', zIndex: 3 }} />
    <span aria-hidden="true" style={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, background: t.card, clipPath: 'polygon(100% 100%, 0 100%, 100% 0)', zIndex: 3 }} />
  </>
));
CornerMounts.displayName = 'CornerMounts';

/* ==================================================================
   MAIN COMPONENT
================================================================== */
const PhotoViewer = ({ src, onClose }) => {
  const [scale, setScale] = useState(1);

  if (!src) return null;

  const handleTap = () => {
    if (scale > 1) {
      triggerHaptic('light');
      setScale(1);
    } else {
      triggerHaptic('medium');
      onClose();
    }
  };

  const handleDoubleClick = (e) => {
    e.stopPropagation(); // Prevents the tap handler from firing
    triggerHaptic('medium');
    setScale(scale > 1 ? 1 : 2.2);
  };

  return createPortal(
    <AnimatePresence>
      {/* Immersive Cinematic Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        onClick={handleTap}
        style={{
          position: 'fixed',
          inset: 0,
backgroundColor: t.desk,
           backgroundImage: `url("${t.grain || ''}")`,
          backgroundSize: '150px 150px',
          backdropFilter: 'blur(6px)', // Depth of field focus pull
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          cursor: scale > 1 ? 'zoom-out' : 'pointer',
          contain: 'strict', // Absolute layout isolation
        }}
      >
        {/* Subtle Close Hint */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            position: 'absolute',
            top: 'max(24px, env(safe-area-inset-top))',
            right: '24px',
            color: 'rgba(255,255,255,0.8)',
            fontFamily: t.fontBody,
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            zIndex: 10002,
            pointerEvents: 'none',
          }}
        >
          {scale > 1 ? 'Double-tap to unzoom' : 'Tap to close'} 
          <X size={14} strokeWidth={2.5} color="currentColor" />
        </motion.div>

        {/* Archival Photo Frame Container */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, rotate: -2, y: 20 }}
          animate={{ scale, opacity: 1, rotate: 0, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, rotate: -2, y: 20 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          onDoubleClick={handleDoubleClick}
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: t.card,
            padding: '16px 16px 48px 16px',
            borderRadius: t.radius.sm,
            border: `2px solid ${t.ink}`,
            position: 'relative',
            maxWidth: '100%',
            maxHeight: '85dvh',
            cursor: scale > 1 ? 'zoom-out' : 'zoom-in',
            willChange: 'transform, opacity', // GPU Promotion
          }}
        >
          {/* Specular Room Lighting Overlay */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 50%, rgba(0,0,0,0.02) 100%)',
              pointerEvents: 'none',
              zIndex: 4,
            }}
          />

          <CornerMounts />

          {/* Artifact Image */}
          <img
            src={src}
            alt="Archival Specimen Full View"
            decoding="async" // Prevents main thread blocking on hi-res decode
            style={{
              maxWidth: '100%',
              maxHeight: '70dvh',
              objectFit: 'contain',
              borderRadius: '2px',
              display: 'block',
              border: `1px solid ${t.ink}`,
              backgroundColor: t.paper, // Fallback color while decoding
            }}
          />

          {/* Typewriter Caption */}
          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: t.fontMono,
              fontSize: '13px',
              fontWeight: 600,
              color: t.ink2,
              fontStyle: 'italic',
              textAlign: 'center',
              letterSpacing: '-0.01em',
              zIndex: 5,
            }}
          >
            Archival Specimen
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default PhotoViewer;
```

