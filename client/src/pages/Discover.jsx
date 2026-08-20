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
import { RotateCw, Compass, AlertTriangle } from 'lucide-react';

const theme = {
  paper: '#fdfbf7',
  surface: '#ffffff',
  surfaceAlt: '#f4f1ea',
  border: '#e0d8c8',
  borderDark: '#d4c5a9',
  ink: '#1a1a1a',
  inkMuted: '#8c8275',
  accent: '#8b4513',
  crimson: '#8b1a1a',
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
  mass: 1 
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
    if (!append) { setLoading(true); setError(null); }
    else setFetchingMore(true);

    try {
      const data = await api.get('/discover?limit=10');
      const newProfiles = data.users || [];
      if (append) setProfiles((prev) => [...prev, ...newProfiles]);
      else { setProfiles(newProfiles); setCurrentIndex(0); }
      setHasMore(data.hasMore);
    } catch (err) {
      console.error('Failed to fetch archival profiles:', err);
      if (!append) setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
      setFetchingMore(false);
    }
  }, []);

  useEffect(() => { fetchProfiles(false); }, [fetchProfiles]);

  const handleNextProfile = useCallback((direction = 'up', isAction = false) => {
    if (currentIndex >= profiles.length) return;
    
    setSlideDirection(direction);

    if (!isAction) {
      const passedProfile = profiles[currentIndex];
      if (passedProfile) {
        api.post(`/discover/pass/${passedProfile._id}`).catch(console.error);
        triggerHaptic('light');
      }
    }

    setCurrentIndex((prev) => prev + 1);

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
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '12px' }}>
        <ProfileCardSkeleton />
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px', textAlign: 'center', width: '100%', color: theme.inkMuted, backgroundColor: theme.surfaceAlt }}>
        <AlertTriangle size={48} strokeWidth={1.5} style={{ marginBottom: '16px', color: theme.crimson, opacity: 0.8 }} />
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', color: theme.ink, marginBottom: '8px' }}>The Archive is Unreachable</h3>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', lineHeight: 1.6, maxWidth: '280px', marginBottom: '24px' }}>{error}</p>
        <button onClick={() => fetchProfiles(false)} className="tactile-btn" style={{ padding: '12px 24px', borderRadius: '24px', backgroundColor: theme.accent, color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(139, 69, 19, 0.2)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <RotateCw size={18} /> Try Again
        </button>
      </div>
    );
  }

  if (!profiles || profiles.length === 0 || currentIndex >= profiles.length) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px', textAlign: 'center', width: '100%', color: theme.inkMuted, backgroundColor: theme.surfaceAlt }}>
        <Compass size={48} strokeWidth={1.5} style={{ marginBottom: '16px', opacity: 0.6 }} />
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', color: theme.ink, marginBottom: '8px' }}>The Archive is Quiet</h3>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', lineHeight: 1.6, maxWidth: '280px', marginBottom: '24px' }}>You've reviewed all available subjects at IIT Bombay for now. Check back later.</p>
        <button onClick={() => fetchProfiles(false)} style={{ padding: '12px 24px', borderRadius: '24px', backgroundColor: theme.accent, color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(139, 69, 19, 0.2)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <RotateCw size={18} /> Refresh Archive
        </button>
      </div>
    );
  }

  return (
    <div style={styles.viewportRoot}>
      <div aria-hidden="true" style={styles.paperGrain} />

      <style>{`
        .hide-scroll::-webkit-scrollbar { display: none; }
        .tactile-btn:active { transform: scale(0.95); }
      `}</style>

      <ShadowbanBanner score={shadowbanScore} onLearnMore={() => setShowLearnMore(true)} />
      {showLearnMore && <LearnMoreSheet onClose={() => setShowLearnMore(false)} />}
      
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
                  display: 'flex', flexDirection: 'column'
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
              style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(10, 8, 6, 0.85)', backdropFilter: 'blur(8px)', zIndex: 99998 }}
              onClick={() => { setShowAlignmentModal(false); setAlignedProfile(null); }}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90%', maxWidth: '360px', backgroundColor: '#fdfbf7', backgroundImage: `url("${design.texture.grain}")`, border: '2px solid #d4c5a9', borderRadius: '24px', padding: '32px 24px', textAlign: 'center', zIndex: 99999, boxShadow: '0 24px 60px rgba(0,0,0,0.4)' }}
            >
              <div style={{ width: '80px', height: '80px', margin: '0 auto 16px', backgroundColor: '#8b1a1a', borderRadius: '50%', border: '4px solid #b82e2e', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(139,26,26,0.4), inset 0 2px 8px rgba(255,255,255,0.2)' }}>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '32px', fontWeight: 900, color: '#ffffff', letterSpacing: '2px' }}>M</span>
              </div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', color: '#1a1a1a', margin: '0 0 8px 0', fontWeight: 800 }}>You are Aligned</h2>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#8c8275', margin: '0 0 24px 0', lineHeight: 1.5 }}>You and {alignedProfile.name} have found common ground. The correspondence is now open.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button onClick={() => { triggerHaptic('heavy'); setShowAlignmentModal(false); if (onOpenChat && alignedProfile) { onOpenChat({ _id: alignedProfile.matchId, user: alignedProfile }); } setAlignedProfile(null); }} style={{ width: '100%', padding: '16px', backgroundColor: '#8b1a1a', color: '#fff', border: 'none', borderRadius: '12px', fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(139,26,26,0.3)' }}>Open Correspondence</button>
                <button onClick={() => { setShowAlignmentModal(false); setAlignedProfile(null); }} style={{ width: '100%', padding: '16px', backgroundColor: 'transparent', color: '#1a1a1a', border: '1px solid #d4c5a9', borderRadius: '12px', fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Continue Exploring</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const styles = {
  viewportRoot: { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', backgroundColor: '#e8e4db', position: 'relative', overflow: 'hidden', userSelect: 'none', WebkitUserSelect: 'none' },
  paperGrain: { position: 'absolute', inset: 0, backgroundImage: `url("${design.texture.grain}")`, mixBlendMode: 'multiply', opacity: 0.85, pointerEvents: 'none', zIndex: 1 },
  stageContainer: { flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', position: 'relative', padding: 0, zIndex: 2 }
};

export default Discover;