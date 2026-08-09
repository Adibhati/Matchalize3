import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import HTMLFlipBook from 'react-pageflip';
import ProfileCard from '../components/ProfileCard';
import ProfileCardSkeleton from '../components/ProfileCardSkeleton';
import { api } from '../utils/api';
import { useAuth } from '../utils/AuthContext';
import ShadowbanBanner from '../components/ShadowbanBanner';
import LearnMoreSheet from '../components/LearnMoreSheet';
import { triggerHaptic } from '../utils/haptics';
import { theme as design } from '../utils/theme';
import { RotateCw, Send, X, Compass, Users } from 'lucide-react';

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
  shadowWarm: 'rgba(139, 69, 19, 0.15)',
  shadowDark: 'rgba(26, 26, 26, 0.25)',
};

// React-Pageflip requires pages to be wrapped in a forwardRef
const Page = React.forwardRef(({ profile, onAction }, ref) => {
  return (
    <div ref={ref} className="archival-page" data-density="soft">
      {/* DOM ISOLATION WRAPPER: Prevents React & PageFlip from fighting over the same DOM nodes */}
      <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
        <ProfileCard profile={profile} onAction={onAction} />
      </div>
    </div>
  );
});
Page.displayName = "Page";

const Discover = ({ onOpenChat }) => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  const [sortTab, setSortTab] = useState('all'); 
  const [showTelegram, setShowTelegram] = useState(false);
  const [telegramText, setTelegramText] = useState('');
  const [showAlignmentModal, setShowAlignmentModal] = useState(false);
  const [alignedProfile, setAlignedProfile] = useState(null);

  const bookRef = useRef(null);
  // Tracks whether a page turn was caused by an action button (Like/Telegram/Pass)
  const isActionFlip = useRef(false);
  const actionPendingRef = useRef(false);
  const { user: myUser } = useAuth();
  const [showLearnMore, setShowLearnMore] = useState(false);
  const shadowbanScore = myUser?.shadowbanScore || 0;

  // Prevent WebKit/Safari NotFoundError during unmount animations
  useEffect(() => {
    return () => {
      if (bookRef.current?.pageFlip) {
        try {
          bookRef.current.pageFlip().destroy();
        } catch {
          // Silently ignore cleanup errors if nodes were already detached
        }
      }
    };
  }, []);

  const fetchProfiles = useCallback(async (append = false) => {
    if (!append) setLoading(true);
    else setFetchingMore(true);

    try {
      const data = await api.get('/discover?limit=10');
      const newProfiles = data.users || [];
      if (append) setProfiles((prev) => [...prev, ...newProfiles]);
      else { setProfiles(newProfiles); setCurrentIndex(0); }
      setHasMore(data.hasMore);
    } catch (err) {
      console.error('Failed to fetch archival profiles:', err);
    } finally {
      setLoading(false);
      setFetchingMore(false);
    }
  }, []);

  useEffect(() => { fetchProfiles(false); }, [fetchProfiles]);

  const getSortedProfiles = useCallback(() => {
    if (sortTab === 'all' || !myUser) return profiles;
    const remaining = [...profiles].slice(currentIndex);
    const past = [...profiles].slice(0, currentIndex);
    remaining.sort((a, b) => {
      let aMatch = 0, bMatch = 0;
      if (sortTab === 'era') {
        aMatch = a.year === myUser.year ? 1 : 0;
        bMatch = b.year === myUser.year ? 1 : 0;
      } else if (sortTab === 'branch') {
        aMatch = a.branch === myUser.branch ? 1 : 0;
        bMatch = b.branch === myUser.branch ? 1 : 0;
      }
      return bMatch - aMatch;
    });
    return [...past, ...remaining];
  }, [profiles, currentIndex, sortTab]);

  const sortedProfiles = getSortedProfiles();

  // ONE-SHOT DISPATCH HANDLER (Used for Like/Superlike via PopoutItem)
  const handleAction = useCallback(async (action, payload = {}) => {
    if (actionPendingRef.current) return;
    actionPendingRef.current = true;
    if (currentIndex >= sortedProfiles.length) return;
    const profile = sortedProfiles[currentIndex];
    
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
      
      // Programmatically flip the page
      if (bookRef.current?.pageFlip) {
        // Raise the flag: tell the sensor we already handled the backend API call
        isActionFlip.current = true;
        bookRef.current.pageFlip().flipNext();
      }
    } catch (err) {
      console.error('Action failed:', err);
    } finally {
      actionPendingRef.current = false;
    }
  }, [currentIndex, sortedProfiles]);

  // Hook into react-pageflip's native flip event
  const onPageFlip = useCallback((e) => {
    // If the user flips forward, check what caused the flip:
    if (e.data > currentIndex) {
      if (isActionFlip.current) {
        // Flag is up: action button was tapped — backend already handled, just lower the flag
        isActionFlip.current = false;
      } else {
        // Flag is down: user manually swiped the page — send Pass
        const passedProfile = sortedProfiles[currentIndex];
        if (passedProfile) {
           api.post(`/discover/pass/${passedProfile._id}`).catch(console.error);
           triggerHaptic('light');
        }
      }
    }
    
    setCurrentIndex(e.data);

    // Eager preload
    if (sortedProfiles.length - e.data <= 3 && hasMore && !fetchingMore) {
      fetchProfiles(true);
    }
  }, [currentIndex, sortedProfiles, hasMore, fetchingMore, fetchProfiles]);

  const sendTelegram = () => {
    if (!telegramText.trim()) return;
    setShowTelegram(false);
    handleAction('superlike', { note: telegramText.trim() });
    setTelegramText('');
  };

  // EARLY RETURN: Loading State — full-height flex to keep NavBar pinned to bottom
  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
        <ProfileCardSkeleton />
      </div>
    );
  }

  // EARLY RETURN: Empty State — full-height flex to keep NavBar pinned to bottom
  if (!profiles || profiles.length === 0) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px',
        textAlign: 'center',
        width: '100%',
        color: theme.inkMuted,
        backgroundColor: theme.surfaceAlt,
      }}>
        <Compass size={48} strokeWidth={1.5} style={{ marginBottom: '16px', opacity: 0.6 }} />
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', color: theme.ink, marginBottom: '8px' }}>
          The Archive is Quiet
        </h3>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', lineHeight: 1.6, maxWidth: '280px', marginBottom: '24px' }}>
          You've reviewed all available subjects at IIT Bombay for now. Check back later as more students arrive.
        </p>
        <button
          onClick={() => fetchProfiles(false)}
          style={{
            padding: '12px 24px',
            borderRadius: '24px',
            backgroundColor: theme.accent,
            color: '#fff',
            border: 'none',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(139, 69, 19, 0.2)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <RotateCw size={18} /> Refresh Archive
        </button>
      </div>
    );
  }

  // Dimensions for HTMLFlipBook
  const width = window.innerWidth > 430 ? 430 : window.innerWidth;
  const height = window.innerHeight - 140; // Leave room for navbar and compass

  return (
    <div style={styles.viewportRoot}>
      <div aria-hidden="true" style={styles.paperGrain} />

      <style>{`
        .hide-scroll::-webkit-scrollbar { display: none; }
        .archival-page { background-color: ${theme.paper}; overflow: hidden; border-right: 1px solid ${theme.borderDark}; box-shadow: inset 12px 0 20px -8px rgba(0,0,0,0.15); }
        .stf__wrapper { border-radius: 0 24px 24px 0 !important; overflow: hidden !important; }
        .tactile-btn:active { transform: scale(0.95); }
      `}</style>

      {/* TOP COMPASS BAR (Soft Sorting Tabs) */}
      <div style={styles.compassHeader}>
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '6px', paddingLeft: '24px', paddingRight: '24px' }} className="hide-scroll">
          {[
            { id: 'all', label: 'All Campus', icon: Compass },
            { id: 'era', label: 'Same Era', icon: Users },
            { id: 'branch', label: 'Same Discipline', icon: Users }
          ].map(tab => {
            const isActive = sortTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { triggerHaptic('light'); setSortTab(tab.id); }}
                className="tactile-btn"
                style={{
                  padding: '10px 16px', borderRadius: '24px',
                  border: `1.5px solid ${isActive ? theme.crimson : theme.borderDark}`,
                  backgroundColor: isActive ? theme.crimson : theme.surface,
                  color: isActive ? '#fff' : theme.ink,
                  fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: isActive ? 800 : 600,
                  whiteSpace: 'nowrap', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                  boxShadow: isActive ? `0 4px 16px rgba(139, 26, 26, 0.25)` : 'none',
                  outline: 'none'
                }}
              >
                <tab.icon size={16} /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <ShadowbanBanner score={shadowbanScore} onLearnMore={() => setShowLearnMore(true)} />
      {showLearnMore && <LearnMoreSheet onClose={() => setShowLearnMore(false)} />}
      <div style={styles.stageContainer}>
        <div style={{ width: '100%', height: '100%', padding: '0 8px 8px 0' }}>
          {/* TRUE 3D CORNER-CURLING BOOK ENGINE */}
          <HTMLFlipBook
            key={profiles.length} // Force clean remount if array length changes drastically
            width={width - 8}
            height={height}
            size="fixed"
            minWidth={300}
            maxWidth={430}
            minHeight={600}
            maxHeight={1200}
            maxShadowOpacity={0.5}
            showCover={false}
            mobileScrollSupport={true} // Crucial: allows vertical scrolling inside the page
            usePortrait={true} // Forces single-page mode on all devices
            onFlip={onPageFlip}
            className="archival-book"
            ref={bookRef}
            style={{ margin: '0' }}
          >
            {sortedProfiles.map((p) => (
              <Page key={p._id || p.id} profile={p} onAction={handleAction} />
            ))}
          </HTMLFlipBook>
        </div>
      </div>

      {/* METALLIC GOLD TELEGRAM BUTTON */}
      {currentIndex < sortedProfiles.length && !loading && (
        <button
          onClick={() => { triggerHaptic('medium'); setShowTelegram(true); }}
          className="tactile-btn"
          style={styles.telegramGoldBtn}
          aria-label="Dispatch Telegram"
        >
          <Send size={24} color="#fff" style={{ transform: 'translate(1px, -1px)' }} />
        </button>
      )}

      {/* ALIGNMENT CELEBRATION MODAL */}
      <AnimatePresence>
        {showAlignmentModal && alignedProfile && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(10, 8, 6, 0.85)', backdropFilter: 'blur(8px)', zIndex: 99998 }}
              onClick={() => { setShowAlignmentModal(false); setAlignedProfile(null); }}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{
                position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                width: '90%', maxWidth: '360px', backgroundColor: '#fdfbf7',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.05 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E")`,
                border: '2px solid #d4c5a9', borderRadius: '24px', padding: '32px 24px',
                textAlign: 'center', zIndex: 99999, boxShadow: '0 24px 60px rgba(0,0,0,0.4)'
              }}
            >
              {/* Wax Seal Icon */}
              <div style={{ width: '80px', height: '80px', margin: '0 auto 16px', backgroundColor: '#8b1a1a', borderRadius: '50%', border: '4px solid #b82e2e', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(139,26,26,0.4), inset 0 2px 8px rgba(255,255,255,0.2)' }}>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '32px', fontWeight: 900, color: '#ffffff', letterSpacing: '2px' }}>M</span>
              </div>
              
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', color: '#1a1a1a', margin: '0 0 8px 0', fontWeight: 800 }}>You are Aligned</h2>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#8c8275', margin: '0 0 24px 0', lineHeight: 1.5 }}>
                You and {alignedProfile.name} have found common ground. The correspondence is now open.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button 
                  onClick={() => {
                    triggerHaptic('heavy');
                    setShowAlignmentModal(false);
                    if (onOpenChat && alignedProfile) {
                      onOpenChat({ _id: alignedProfile.matchId, user: alignedProfile });
                    }
                    setAlignedProfile(null);
                  }}
                  style={{ width: '100%', padding: '16px', backgroundColor: '#8b1a1a', color: '#fff', border: 'none', borderRadius: '12px', fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(139,26,26,0.3)' }}
                >
                  Open Correspondence
                </button>
                <button 
                  onClick={() => { setShowAlignmentModal(false); setAlignedProfile(null); }}
                  style={{ width: '100%', padding: '16px', backgroundColor: 'transparent', color: '#1a1a1a', border: '1px solid #d4c5a9', borderRadius: '12px', fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Continue Exploring
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* TELEGRAM BOTTOM SHEET (PORTAL) */}
      <AnimatePresence>
        {showTelegram && createPortal(
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowTelegram(false)} style={styles.telegramBackdrop} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 26, stiffness: 320 }} style={styles.telegramSheet}>
              <div style={styles.telegramHeader}>
                <span style={{ fontFamily: design.font.heading, fontSize: '24px', fontWeight: 800, color: theme.ink }}>Dispatch a Telegram</span>
                <button onClick={() => setShowTelegram(false)} style={styles.closeBtn}><X size={24} color={theme.ink} /></button>
              </div>
              <div style={{ padding: '28px 24px' }}>
                <p style={{ fontFamily: design.font.body, fontSize: '15px', color: theme.inkMuted, marginBottom: '20px', lineHeight: 1.5 }}>
                  Skip the line. Go straight to the top of {sortedProfiles[currentIndex]?.name}'s Letterbox.
                  <strong style={{ display: 'block', color: theme.accent, marginTop: '10px' }}>[ 1 Remaining Today ]</strong>
                </p>
                <textarea autoFocus value={telegramText} onChange={(e) => setTelegramText(e.target.value)} placeholder="Draft your urgent correspondence..." style={styles.telegramInput} />
                <button onClick={sendTelegram} disabled={!telegramText.trim()} style={{ ...styles.telegramSendBtn, opacity: telegramText.trim() ? 1 : 0.5, cursor: telegramText.trim() ? 'pointer' : 'not-allowed' }}>
                  <Send size={20} /> Affix Seal & Dispatch
                </button>
              </div>
            </motion.div>
          </>,
          document.body
        )}
      </AnimatePresence>
    </div>
  );
};

// TRUE BOOK HINGE GEOMETRY
const styles = {
  viewportRoot: { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', backgroundColor: theme.surfaceAlt, position: 'relative', overflow: 'hidden', userSelect: 'none', WebkitUserSelect: 'none' },
  paperGrain: { position: 'absolute', inset: 0, backgroundImage: `url("${design.texture.grain}")`, mixBlendMode: 'multiply', opacity: 0.85, pointerEvents: 'none', zIndex: 1 },
  compassHeader: { paddingTop: '16px', paddingBottom: '8px', zIndex: 10, position: 'relative' },
  stageContainer: { flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', position: 'relative', padding: 0, zIndex: 2 },
  
  skeletonFrame: { position: 'absolute', top: 0, bottom: 8, left: 0, right: '8px', zIndex: 1, backgroundColor: theme.paper, borderRadius: '0 24px 24px 0', overflow: 'hidden', border: `1px solid ${theme.borderDark}`, borderLeft: 'none' },
  
  emptyLedgerCard: { backgroundColor: theme.paper, border: `2px solid ${theme.borderDark}`, borderRadius: '24px', padding: '48px 32px', maxWidth: '360px', textAlign: 'center', zIndex: 2, boxShadow: `0 16px 40px ${theme.shadowWarm}`, margin: '0 auto' },
  emptyTitle: { fontFamily: "'Playfair Display', serif", fontSize: '28px', color: theme.ink, margin: '0 0 16px 0', fontWeight: 800 },
  emptyBody: { fontFamily: "'Inter', sans-serif", fontSize: '16px', color: theme.inkMuted, marginBottom: '32px', lineHeight: 1.5 },
  reopenStampBtn: { padding: '16px 28px', backgroundColor: theme.surface, border: `2px solid ${theme.accent}`, borderRadius: design.radius.md, fontFamily: "'Inter', sans-serif", fontSize: '15px', fontWeight: 800, textTransform: 'uppercase', color: theme.accent, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '10px', boxShadow: `0 4px 16px ${theme.shadowWarm}` },
  
  // Metallic Gold Rounded Square
  telegramGoldBtn: { position: 'absolute', bottom: '28px', right: '28px', width: '64px', height: '64px', borderRadius: '16px', background: 'linear-gradient(135deg, #d4af37 0%, #aa7c11 50%, #d4af37 100%)', border: '1.5px solid #ffe699', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 12px 32px rgba(212, 175, 55, 0.4), inset 0 2px 4px rgba(255,255,255,0.4)`, cursor: 'pointer', zIndex: 20 },
  
  telegramBackdrop: { position: 'fixed', inset: 0, backgroundColor: 'rgba(20,15,10,0.7)', backdropFilter: 'blur(6px)', zIndex: 99998 },
  telegramSheet: { position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: theme.paper, backgroundImage: `url("${design.texture.grain}")`, borderTopLeftRadius: '28px', borderTopRightRadius: '28px', zIndex: 99999, boxShadow: '0 -24px 60px rgba(0,0,0,0.5)', paddingBottom: 'max(24px, env(safe-area-inset-bottom))' },
  telegramHeader: { padding: '24px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.borderDark}`, backgroundColor: theme.surface, borderTopLeftRadius: '28px', borderTopRightRadius: '28px' },
  closeBtn: { background: theme.surfaceAlt, border: `1px solid ${theme.border}`, borderRadius: '12px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  telegramInput: { width: '100%', minHeight: '150px', backgroundColor: theme.surfaceAlt, border: `1px solid ${theme.borderDark}`, borderRadius: '16px', padding: '20px', fontSize: '18px', color: theme.ink, fontFamily: "'Special Elite', 'Courier New', monospace", outline: 'none', resize: 'none', marginBottom: '24px', boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.05)' },
  telegramSendBtn: { width: '100%', padding: '20px', background: 'linear-gradient(135deg, #d4af37 0%, #aa7c11 100%)', color: '#fff', border: '1px solid #ffe699', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', fontFamily: "'Inter', sans-serif", fontSize: '16px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1.5px', boxShadow: '0 8px 24px rgba(212, 175, 55, 0.4)' }
};

export default Discover;