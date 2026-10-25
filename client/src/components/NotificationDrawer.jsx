import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../utils/api';
import { X, Send, ChevronLeft, ChevronRight } from 'lucide-react';
import ProfileCard from './ProfileCard';
import DesktopPanelBackButton from './DesktopPanelBackButton';
import { triggerHaptic } from '../utils/haptics';
import neu from '../styles/neu';

/* The shared neo-brutalist canon (src/styles/neu.js) */
const t = neu;

const FALLBACK_AVATAR = 'https://placehold.co/100/fff3dc/191919?text=%3F';
const DRAWER_CSS = `
  .lb-slam { transition: transform .08s steps(2), box-shadow .08s steps(2), background .08s steps(2);
    -webkit-tap-highlight-color: transparent; }
  .lb-slam:active:not(.lb-phone-back) { transform: translate(3px, 3px) !important; box-shadow: 0 0 0 #191919 !important; }
  .lb-phone-back,
  .lb-phone-back:hover,
  .lb-phone-back:active,
  .lb-phone-back:focus {
    transform: none !important;
    translate: none !important;
    scale: none !important;
  }
  .lb-phone-back { transform: none; transition: background-color .12s ease; }
  .lb-phone-back:active { background-color: #FFE76A !important; }

  .lb-row { transition: transform .08s steps(2), box-shadow .08s steps(2), opacity .3s ease, background .2s ease; }
  @media (hover: hover) and (pointer: fine) {
    .lb-row:hover { transform: translate(-1px, -1px); box-shadow: 6px 6px 0 #191919; }
  }
  .lb-row:active { transform: scale(.98) !important; }

  .lb-clamp2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .lb-row:focus-visible { outline: 3px solid #FFD43D; outline-offset: 3px; }

  .lb-btn:focus-visible, .lb-row:focus-visible {
    outline: 3px solid #FFD43D; outline-offset: 2px; }

  @media (prefers-reduced-motion: reduce) {
    .lb-slam, .lb-row { transition: none !important; }
  }
`;

const NotificationDrawer = ({
  onClose,
  desktopPanel = false,
  slideFromRight = false,
  panelWidth = '40vw',
  panelClassName,
}) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [initialLoadError, setInitialLoadError] = useState('');
  const [loadMoreError, setLoadMoreError] = useState('');
  const [selectedProfile, setSelectedProfile] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    setInitialLoadError('');
    try {
      const response = await api.get('/notifications');
      setNotifications(response.notifications || []);
      setHasMore(Boolean(response.hasMore));
      setPage(response.page || 1);
    } catch (err) {
      console.error('Failed to fetch letters:', err);
      setInitialLoadError('Could not load requests. Check your connection and try again.');
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
    } catch (err) {
      console.error('Failed to load more letters:', err);
      setLoadMoreError('Could not load older requests. Try again.');
    } finally {
      setLoadingMore(false);
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
    const isPriority = n.type === 'priority_telegram';
    const isLegacy = isPriority || n.type === 'new_letter';
    const sender = n.senderId || {};
    const senderName = sender.name || 'Anonymous';
    const avatarUrl = sender.photos?.[0] || FALLBACK_AVATAR;
    const letterContent = n.interactionRef?.letterContent?.trim();
    const targetArtifact = n.interactionRef?.targetArtifact || '';
    const artifactContext = /^photo_/i.test(targetArtifact)
      ? 'On your photo'
      : /^(prompt|whisper)_/i.test(targetArtifact)
        ? 'On your prompt'
        : null;
    const requestLabel = isPriority
      ? 'Sent you a telegram'
      : n.type === 'new_letter'
        ? 'Sent you a letter'
        : letterContent || artifactContext
          ? 'Sent you a note'
          : 'Liked your profile';
    const notePreview = letterContent
      || (isPriority ? 'A priority message is waiting for you.' : isLegacy ? 'Open to read their letter.' : null);
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
        aria-label={`${senderName}, ${requestLabel}`}
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
          backgroundColor: t.paper,
        }}
      >
        <div style={styles.avatarContainer}>
          <img
            src={avatarUrl}
            alt={senderName}
            loading="lazy"
            decoding="async"
            style={styles.avatar}
          />
          {isPriority && (
            <div style={styles.telegramBadge} title="Telegram" aria-label="Telegram">
              <Send size={9} color={t.ink} strokeWidth={3} />
            </div>
          )}
        </div>

        <div style={styles.textContainer}>
          <div style={styles.rowHeading}>
            <span style={styles.senderName}>{senderName}</span>
            <span style={styles.requestLabel}>{requestLabel}</span>
          </div>
          {(artifactContext || notePreview) && (
            <div style={styles.rowPreview}>
              {artifactContext && <span className="lb-context-chip" style={styles.contextChip}>{artifactContext}</span>}
              {notePreview && (
                <p className="lb-clamp2" style={styles.snippetText}>
                  {notePreview}
                </p>
              )}
            </div>
          )}
        </div>
        <ChevronRight aria-hidden="true" size={19} strokeWidth={2.6} color={t.ink3} style={styles.rowChevron} />
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={desktopPanel ? { x: '-100%' } : slideFromRight ? { x: '100%' } : false}
      animate={{ x: 0 }}
      exit={desktopPanel ? { x: '-100%' } : slideFromRight ? { x: '100%' } : undefined}
      transition={desktopPanel || slideFromRight ? { type: 'spring', damping: 30, stiffness: 280 } : undefined}
      style={{
        ...styles.screenContainer,
        ...(desktopPanel ? { ...styles.desktopPanel, width: panelWidth } : {}),
      }}
      className={panelClassName}
      aria-label={desktopPanel ? 'Notifications' : undefined}
    >
      <style>{DRAWER_CSS}</style>

      <div
        style={{
          ...styles.topBar,
          ...(desktopPanel ? styles.desktopTopBar : {}),
          ...(slideFromRight ? styles.phoneTopBar : {}),
        }}
      >
        {desktopPanel && onClose && (
          <DesktopPanelBackButton panelTitle="Notifications" onClick={onClose} />
        )}
        {slideFromRight && onClose && (
          <button
            className="lb-phone-back"
            onClick={onClose}
            style={styles.phoneBackBtn}
            aria-label="Back"
          >
            <ChevronLeft size={22} color={t.ink} strokeWidth={2.8} />
          </button>
        )}
        <div
          style={{
            ...styles.topBarTitle,
            ...(desktopPanel ? styles.desktopTopBarTitle : {}),
            ...(slideFromRight ? styles.phoneTopBarTitle : {}),
          }}
        >
          <h2 style={styles.heading}>Letterbox</h2>
        </div>
        {!desktopPanel && !slideFromRight && onClose && (
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
                backgroundColor: t.paper, border: `2px solid ${t.ink}`,
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
        ) : initialLoadError ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={styles.emptyState}
          >
            <h3 style={styles.emptyTitle}>Couldn’t load requests</h3>
            <p role="alert" style={{ ...styles.emptyText, color: t.red }}>
              {initialLoadError}
            </p>
            <button
              className="lb-slam"
              type="button"
              onClick={fetchNotifications}
              style={styles.loadMoreBtn}
            >
              Try again
            </button>
          </motion.div>
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
                  {aligns.map((notification) => renderRow(notification))}
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
                  {legacy.map((notification) => renderRow(notification))}
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

      {/* --- FULL-SCREEN PROFILE --- */}
      <AnimatePresence>
        {selectedProfile && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 280 }}
            style={styles.profileScreen}
          >
            <div style={styles.profileCardViewport}>
              <ProfileCard profile={selectedProfile} readOnly />
            </div>
            <div style={styles.profileHeader}>
              <button
                className="lb-phone-back"
                type="button"
                onClick={() => setSelectedProfile(null)}
                style={styles.profileBackBtn}
                aria-label="Back to Letterbox"
              >
                <ChevronLeft size={22} color={t.ink} strokeWidth={2.8} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
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
  desktopPanel: {
    inset: '0 auto 0 72px',
    width: '40vw',
    boxSizing: 'border-box',
    zIndex: 400,
    borderRight: `2px solid ${t.ink}`,
    boxShadow: '10px 0 28px rgba(0,0,0,.2)',
  },
  topBar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: 'max(12px, env(safe-area-inset-top)) 14px 12px',
    backgroundColor: t.paper,
    borderBottom: `2px solid ${t.ink}`, position: 'relative', zIndex: 10,
  },
  phoneTopBar: { minHeight: 64, boxSizing: 'border-box', justifyContent: 'center' },
  topBarTitle: { display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 },
  desktopTopBar: { position: 'relative', justifyContent: 'center', minHeight: 64, boxSizing: 'border-box' },
  desktopTopBarTitle: { position: 'absolute', left: '50%', transform: 'translateX(-50%)', justifyContent: 'center' },
  phoneTopBarTitle: { position: 'absolute', left: '50%', transform: 'translateX(-50%)', justifyContent: 'center' },
  phoneBackBtn: {
    position: 'absolute', left: 14, top: 0, bottom: 0, margin: 'auto 0',
    backgroundColor: t.paper, border: `2px solid ${t.ink}`, borderRadius: 11,
    boxShadow: `3px 3px 0 ${t.ink}`,
    width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', flexShrink: 0, color: t.ink,
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
    backgroundColor: t.paper, border: `2px solid ${t.ink}`, borderRadius: 12,
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

  // --- Rows ---
  row: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
    marginBottom: 9, cursor: 'pointer', minHeight: 76, boxSizing: 'border-box',
    border: `2px solid ${t.ink}`, borderRadius: 13,
    boxShadow: `3px 3px 0 ${t.ink}`,
  },
  avatarContainer: { position: 'relative', flexShrink: 0 },
  avatar: {
    width: 48, height: 48, borderRadius: 10, objectFit: 'cover',
    border: `2px solid ${t.ink}`, backgroundColor: t.hair, display: 'block',
  },
  telegramBadge: {
    position: 'absolute', bottom: -4, right: -4, width: 18, height: 18,
    backgroundColor: t.yellow, color: t.ink, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: `2px solid ${t.ink}`, boxSizing: 'content-box',
  },
  textContainer: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 },
  rowHeading: { display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', columnGap: 7, rowGap: 1, minWidth: 0 },
  senderName: {
    minWidth: 0, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    fontFamily: t.fontBody, fontSize: 14, fontWeight: 800, color: t.ink, lineHeight: 1.25,
  },
  requestLabel: {
    fontFamily: t.fontMono, fontSize: 9, fontWeight: 700, color: t.ink2,
    letterSpacing: '.035em', lineHeight: 1.3,
  },
  rowPreview: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4, minWidth: 0 },
  contextChip: {
    flexShrink: 0, border: `1px solid ${t.ink}`, borderRadius: 4,
    backgroundColor: t.yellow, padding: '2px 5px', color: t.ink,
    fontFamily: t.fontMono, fontSize: 8, fontWeight: 700,
    letterSpacing: '.025em', lineHeight: 1.2, textTransform: 'uppercase',
  },
  snippetText: {
    minWidth: 0, fontFamily: t.fontBody, fontSize: 11.5, fontWeight: 500, color: t.ink2,
    margin: 0, lineHeight: 1.35,
  },
  rowChevron: { flexShrink: 0, marginLeft: 'auto' },
  // --- Full-screen profile ---
  profileScreen: {
    position: 'absolute', inset: 0, zIndex: 20, backgroundColor: t.paper,
    overflow: 'hidden',
  },
  profileCardViewport: {
    position: 'absolute', inset: 0,
  },
  profileHeader: {
    position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none',
  },
  profileBackBtn: {
    position: 'absolute', left: 14, top: 'max(14px, env(safe-area-inset-top))',
    backgroundColor: t.paper, border: `2px solid ${t.ink}`, borderRadius: 11,
    boxShadow: `3px 3px 0 ${t.ink}`,
    width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', flexShrink: 0, color: t.ink, pointerEvents: 'auto',
  },
};

export default NotificationDrawer;