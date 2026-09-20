import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ProfileCard from '../components/ProfileCard';
import ProfileCardSkeleton from '../components/ProfileCardSkeleton';
import { api } from '../utils/api';
import { useAuth } from '../utils/AuthContext';
import ShadowbanBanner from '../components/ShadowbanBanner';
import LearnMoreSheet from '../components/LearnMoreSheet';
import { triggerHaptic } from '../utils/haptics';
import { theme as design } from '../utils/theme';
import { discoverStore, initDiscoverStore, saveDiscoverStore, resetDiscoverStore } from '../utils/discoverStore';
import { RotateCw, Compass, AlertTriangle } from 'lucide-react';

/* Locked tokens — same family as ProfileCard */
const t = {
  desk: '#ece4d4',
  paper: '#fdfbf7',
  surfaceAlt: '#f4f1ea',
  lineDark: '#d4c5a9',
  ink: '#1a1a1a',
  inkMuted: '#8c8275',
  accent: '#8b4513',
  crimson: '#8b1a1a',
  fontDisplay: design?.font?.heading || "'Playfair Display', Georgia, serif",
  fontBody: design?.font?.body || "'Inter', -apple-system, sans-serif",
  fontType: "'Special Elite', 'Courier New', monospace",
  grain: design?.texture?.grain || '',
};

const slideVariants = {
  enter: (direction) => ({
    y: direction === 'up' ? '120vh' : '-120vh',
    zIndex: 2,
  }),
  center: {
    y: 0,
    zIndex: 2,
  },
  exit: (direction) => ({
    y: direction === 'up' ? '-20vh' : '20vh',
    opacity: 0,
    zIndex: 1,
  }),
};

const springTransition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
  mass: 1,
};

const Discover = ({ onOpenChat }) => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [slideDirection, setSlideDirection] = useState('up');

  const [showAlignmentModal, setShowAlignmentModal] = useState(false);
  const [alignedProfile, setAlignedProfile] = useState(null);

  const actionPendingRef = useRef(false);
  const { user: myUser } = useAuth();
  const [showLearnMore, setShowLearnMore] = useState(false);
  const shadowbanScore = myUser?.shadowbanScore || 0;

  const fetchProfiles = useCallback(async (append = false) => {
    if (!append) { setLoading(true); setError(null); resetDiscoverStore(); }
    else setFetchingMore(true);

    try {
      const data = await api.get('/discover?limit=10');
      const newProfiles = data.users || [];
      if (append) {
        setProfiles((prev) => {
          const next = [...prev, ...newProfiles];
          discoverStore.profiles = next;
          discoverStore.hasMore = data.hasMore;
          saveDiscoverStore();
          return next;
        });
      }
      else {
        setProfiles(newProfiles);
        setCurrentIndex(0);
        discoverStore.profiles = newProfiles;
        discoverStore.currentIndex = 0;
        discoverStore.hasMore = data.hasMore;
        saveDiscoverStore();
      }
      setHasMore(data.hasMore);
    } catch (err) {
      console.error('Failed to fetch archival profiles:', err);
      if (!append) setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
      setFetchingMore(false);
    }
  }, []);

  useEffect(() => {
    const userId = myUser?._id;
    if (!userId) return;
    const restored = initDiscoverStore(userId);
    if (restored && discoverStore.profiles.length > 0) {
      setProfiles(discoverStore.profiles);
      setCurrentIndex(discoverStore.currentIndex);
      setHasMore(discoverStore.hasMore);
      setLoading(false);
      return;
    }
    fetchProfiles(false);
  }, [myUser?._id, fetchProfiles]);

  const handleNextProfile = useCallback((direction = 'up', isAction = false) => {
    if (direction === 'down') {
      if (currentIndex <= 0) return;
      const next = Math.max(0, currentIndex - 1);
      setCurrentIndex(next);
      discoverStore.currentIndex = next;
      saveDiscoverStore();
      setSlideDirection('down');
      return;
    }

    if (currentIndex >= profiles.length) return;

    setSlideDirection(direction);

    if (!isAction) {
      const passedProfile = profiles[currentIndex];
      if (passedProfile) {
        api.post(`/discover/pass/${passedProfile._id}`).catch(console.error);
        triggerHaptic('light');
      }
    }

    const next = currentIndex + 1;
    setCurrentIndex(next);
    discoverStore.currentIndex = next;
    discoverStore.profiles = profiles;
    saveDiscoverStore();

    if (profiles.length - currentIndex <= 4 && hasMore && !fetchingMore) {
      fetchProfiles(true);
    }
  }, [currentIndex, profiles, hasMore, fetchingMore, fetchProfiles]);

  const handleAction = useCallback(async (action, payload = {}) => {
    if (actionPendingRef.current) return;
    actionPendingRef.current = true;
    if (currentIndex >= profiles.length) {
      actionPendingRef.current = false;
      return;
    }
    const profile = profiles[currentIndex];

    try {
      if (action === 'like') {
        triggerHaptic('light');
        const response = await api.post(`/discover/like/${profile._id}`, payload);
        if (response.matched) {
          setAlignedProfile({ ...response.user, matchId: response.matchId });
          setShowAlignmentModal(true);
        }
      }
      else if (action === 'superlike') {
        triggerHaptic('heavy');
        const response = await api.post(`/discover/superlike/${profile._id}`, payload);
        if (response.matched) {
          setAlignedProfile({ ...response.user, matchId: response.matchId });
          setShowAlignmentModal(true);
        }
      }
      else if (action === 'pass') {
        triggerHaptic('medium');
        await api.post(`/discover/pass/${profile._id}`);
      }

      handleNextProfile('up', true);

    } catch (err) {
      console.error('Action failed:', err);
    } finally {
      actionPendingRef.current = false;
    }
  }, [currentIndex, profiles, handleNextProfile]);

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '12px', backgroundColor: t.desk }}>
        <ProfileCardSkeleton />
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px', textAlign: 'center', width: '100%', backgroundColor: t.desk }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: t.surfaceAlt, border: '1px solid rgba(212,197,169,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <AlertTriangle size={18} strokeWidth={2} color={t.crimson} />
        </div>
        <h3 style={{ fontFamily: t.fontDisplay, fontSize: 22, fontWeight: 800, color: t.ink, letterSpacing: '-0.02em', margin: '0 0 8px 0' }}>The Archive is Unreachable</h3>
        <p style={{ fontFamily: t.fontBody, fontSize: 13.5, fontWeight: 450, lineHeight: 1.6, maxWidth: 280, marginBottom: 24, color: t.inkMuted }}>{error}</p>
        <button onClick={() => fetchProfiles(false)} className="tactile-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 24px', backgroundColor: t.crimson, color: '#fff', border: 'none', borderRadius: 999, fontFamily: t.fontBody, fontSize: 11, fontWeight: 800, letterSpacing: '1.8px', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 6px 18px rgba(139,26,26,0.28)' }}>
          <RotateCw size={14} strokeWidth={2.5} /> Try Again
        </button>
      </div>
    );
  }

  if (!profiles || profiles.length === 0 || currentIndex >= profiles.length) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px', textAlign: 'center', width: '100%', backgroundColor: t.desk }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: t.surfaceAlt, border: '1px solid rgba(212,197,169,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Compass size={18} strokeWidth={2} color={t.accent} />
        </div>
        <h3 style={{ fontFamily: t.fontDisplay, fontSize: 22, fontWeight: 800, color: t.ink, letterSpacing: '-0.02em', margin: '0 0 8px 0' }}>The Archive is Quiet</h3>
        <p style={{ fontFamily: t.fontBody, fontSize: 13.5, fontWeight: 450, lineHeight: 1.6, maxWidth: 280, marginBottom: 24, color: t.inkMuted }}>You've reviewed everyone for now. Check back later.</p>
        <button onClick={() => fetchProfiles(false)} className="tactile-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 24px', backgroundColor: t.crimson, color: '#fff', border: 'none', borderRadius: 999, fontFamily: t.fontBody, fontSize: 11, fontWeight: 800, letterSpacing: '1.8px', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 6px 18px rgba(139,26,26,0.28)' }}>
          <RotateCw size={14} strokeWidth={2.5} /> Refresh
        </button>
      </div>
    );
  }

  return (
    <div style={styles.viewportRoot}>
      <div aria-hidden="true" style={styles.paperGrain} />

      <style>{`
        .hide-scroll::-webkit-scrollbar { display: none; }
        .tactile-btn { transition: transform 0.15s ease-out; will-change: transform; }
        .tactile-btn:active { transform: scale(0.96) !important; }
      `}</style>

      <ShadowbanBanner score={shadowbanScore} onLearnMore={() => setShowLearnMore(true)} />
      {showLearnMore && <LearnMoreSheet onClose={() => setShowLearnMore(true)} onClose={() => setShowLearnMore(false)} />}

      <div style={styles.stageContainer}>
        {/* Full width/height container. No overflow clipping here! */}
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <AnimatePresence initial={false} custom={slideDirection}>
            {profiles[currentIndex] && (
              <motion.div
                key={profiles[currentIndex]._id || profiles[currentIndex].id}
                custom={slideDirection}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={springTransition}
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex', flexDirection: 'column',
                }}
              >
                <ProfileCard
                  profile={profiles[currentIndex]}
                  onAction={handleAction}
                  onNavigate={handleNextProfile}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {showAlignmentModal && alignedProfile && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(28,19,10,0.72)', zIndex: 99998 }}
              onClick={() => { setShowAlignmentModal(false); setAlignedProfile(null); }}
            />
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.94, opacity: 0, y: 16 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90%', maxWidth: 340, backgroundColor: t.paper, border: '1px solid rgba(212,197,169,0.7)', borderRadius: 18, padding: '32px 24px 24px', textAlign: 'center', zIndex: 99999, boxShadow: '0 24px 64px rgba(12,7,2,0.45)', overflow: 'hidden' }}
            >
              {/* Grain film */}
              <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: `url("${t.grain}")`, mixBlendMode: 'multiply', opacity: 0.3, pointerEvents: 'none' }} />

              {/* The match seal — stamp language, one crimson moment */}
              <motion.div
                initial={{ scale: 1.8, opacity: 0, rotate: -18 }}
                animate={{ scale: 1, opacity: 1, rotate: -6 }}
                transition={{ delay: 0.15, type: 'spring', damping: 16, stiffness: 260 }}
                style={{ width: 96, height: 96, margin: '0 auto 18px', position: 'relative' }}
              >
                <svg viewBox="0 0 96 96" width="96" height="96">
                  <circle cx="48" cy="48" r="45" fill="none" stroke={t.crimson} strokeWidth="3" />
                  <circle cx="48" cy="48" r="37" fill="none" stroke={t.crimson} strokeWidth="1" strokeDasharray="3 3" opacity="0.7" />
                  <text x="48" y="60" textAnchor="middle" fill={t.crimson} style={{ fontFamily: t.fontDisplay, fontSize: '38px', fontWeight: 900 }}>M</text>
                </svg>
              </motion.div>

              <h2 style={{ fontFamily: t.fontDisplay, fontSize: 26, color: t.ink, margin: '0 0 8px 0', fontWeight: 800, letterSpacing: '-0.02em' }}>You are Aligned</h2>
              <p style={{ fontFamily: t.fontBody, fontSize: 13.5, fontWeight: 450, color: t.inkMuted, margin: '0 0 24px 0', lineHeight: 1.55 }}>You and {alignedProfile.name} have found common ground. The correspondence is now open.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, position: 'relative' }}>
                <button onClick={() => { triggerHaptic('heavy'); setShowAlignmentModal(false); if (onOpenChat && alignedProfile) { onOpenChat({ _id: alignedProfile.matchId, user: alignedProfile }); } setAlignedProfile(null); }} style={{ width: '100%', padding: '15px', backgroundColor: t.crimson, color: '#fff', border: 'none', borderRadius: 999, fontFamily: t.fontBody, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.8px', cursor: 'pointer', boxShadow: '0 6px 18px rgba(139,26,26,0.28)' }}>Open Correspondence</button>
                <button onClick={() => { setShowAlignmentModal(false); setAlignedProfile(null); }} style={{ width: '100%', padding: '15px', backgroundColor: 'transparent', color: t.ink, border: '1px solid rgba(212,197,169,0.9)', borderRadius: 999, fontFamily: t.fontBody, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.8px', cursor: 'pointer' }}>Continue Exploring</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const styles = {
  viewportRoot: { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', backgroundColor: '#ece4d4', position: 'relative', overflow: 'hidden', userSelect: 'none', WebkitUserSelect: 'none' },
  paperGrain: { position: 'absolute', inset: 0, backgroundImage: `url("${design.texture.grain}")`, mixBlendMode: 'multiply', opacity: 0.3, pointerEvents: 'none', zIndex: 1 },
  stageContainer: { flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', position: 'relative', padding: 0, zIndex: 2 },
};

export default Discover;