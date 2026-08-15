import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../utils/api';
import { useQueryClient } from '@tanstack/react-query';
import { useAppConfig } from '../utils/AppConfigContext';
import { triggerHaptic } from '../utils/haptics';
import { useAuth } from '../utils/AuthContext';
import ShadowbanBanner from '../components/ShadowbanBanner';
import LearnMoreSheet from '../components/LearnMoreSheet';
import { theme as design } from '../utils/theme';
import { toast } from '../utils/toast';
import { Settings, Sparkle, MapPin, X, Pencil, Camera, Plus, CheckCircle2 } from 'lucide-react';

const isTouchDevice = typeof window !== 'undefined' && 'ontouchstart' in window;

/* ==================================================================
   MUSEUM-GRADE ARCHIVAL SYSTEM & CINEMATIC LIGHTING ENGINE
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
    inkSoft: '#4a4a4a',
    accent: '#8b4513',
    accentSoft: 'rgba(139, 69, 19, 0.18)',
    accentFaint: 'rgba(139, 69, 19, 0.04)',
    crimson: '#8b1a1a',
    shadowWarm: 'rgba(139, 69, 19, 0.12)',
    shadowDark: 'rgba(26, 26, 26, 0.20)',
  },
  font: {
    display: "'Playfair Display', Georgia, serif",
    body: "'Inter', -apple-system, sans-serif",
  },
};

function buildTornEdge(teeth = 64) {
  const heights = [0, 18, 4, 22, 8, 16, 2, 24, 6, 14, 10, 20];
  const pts = ['0% 100%'];
  for (let i = 0; i <= teeth; i++) {
    const x = ((i / teeth) * 100).toFixed(2);
    const y = heights[i % heights.length];
    pts.push(`${x}% ${y}%`);
  }
  pts.push('100% 100%');
  return `polygon(${pts.join(',')})`;
}
const TORN_EDGE_CLIP = buildTornEdge();

const TILT = { prompt_0: '1.4deg', photo_1: '-2.2deg', photo_2: '1.8deg', prompt_1: '-1.1deg', prompt_2: '0.5deg', photo_3: '-0.7deg' };

/* ==================================================================
   MAIN PROFILE COMPONENT
================================================================== */
const Profile = ({ onSignOut }) => {
  const config = useAppConfig();
  const queryClient = useQueryClient();
  const cardRootRef = useRef(null);
  const fileInputRef = useRef(null);
  const lampRaf = useRef(null);

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  const [isGhostMode, setIsGhostMode] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [drawerConfig, setDrawerConfig] = useState(null); // { type, slot }
  const [photoSlot, setPhotoSlot] = useState(null);

  const [blockedOpen, setBlockedOpen] = useState(false);
  const [blockedList, setBlockedList] = useState([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);
  const { user: authUser } = useAuth();
  const [showLearnMore, setShowLearnMore] = useState(false);
  const contentFreezeMessage = 'This feature is temporarily unavailable while your account is under review.';

  const contentFrozen = userData?.contentFrozen ?? authUser?.contentFrozen ?? false;
  const shadowbanScore = userData?.shadowbanScore ?? authUser?.shadowbanScore ?? 0;

  const openEditDrawer = (config) => {
    if (contentFrozen) {
      toast.error(contentFreezeMessage);
      return;
    }
    setDrawerConfig(config);
  };

  const openPhotoSlot = (slot) => {
    if (contentFrozen) {
      toast.error(contentFreezeMessage);
      return;
    }
    setPhotoSlot(slot);
    fileInputRef.current?.click();
  };

  const fetchBlockedUsers = async () => {
    setLoadingBlocked(true);
    try {
      const res = await api.get('/report/list');
      setBlockedList(res.blocked || []);
    } catch (err) {
      toast.error('Failed to retrieve blocked subjects.');
    } finally {
      setLoadingBlocked(false);
    }
  };

  const handleUnblock = async (userId, userName) => {
    triggerHaptic('medium');
    try {
      await api.delete(`/report/block/${userId}`);
      setBlockedList(prev => prev.filter(u => u._id !== userId));
      toast.success(`Unblocked ${userName}. They can now appear in your deck.`);
    } catch (err) {
      toast.error('Failed to unblock subject.');
    }
  };

  // Profile Completion Gauge State
  const [displayScore, setDisplayScore] = useState(0);
  const [sweeping, setSweeping] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await api.get('/users/profile');
        if (!data.photos) data.photos = [];
        if (!data.prompts) data.prompts = [{}, {}, {}];
        if (!data.interests) data.interests = [];
        if (!data.intent) data.intent = [];
        setUserData(data);
        setIsGhostMode(data.isGhost || false);
      } catch (err) {
        console.error('Failed to fetch profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const targetScore = useMemo(() => {
    if (!userData) return 0;
    let score = 30; // Base creation
    if (userData.name && userData.age) score += 10;
    if (userData.bio) score += 10;
    if (userData.gender && userData.hostel) score += 10;
    if (userData.photos.filter(Boolean).length >= 2) score += 10;
    if (userData.photos.filter(Boolean).length >= 4) score += 10;
    if (userData.prompts.filter(p => p?.question).length >= 1) score += 10;
    if (userData.prompts.filter(p => p?.question).length >= 3) score += 5;
    if (userData.interests.length > 0) score += 5;
    return Math.min(100, score);
  }, [userData]);

  useEffect(() => {
    if (!userData) return;
    let startTimestamp = null;
    let animationFrameId = null;
    const duration = 1600;
    const startScore = displayScore;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 4); 
      const current = Math.round(startScore + (targetScore - startScore) * easeProgress);
      setDisplayScore(current);
      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      }
    };

    const timer = setTimeout(() => {
      setSweeping(true);
      animationFrameId = window.requestAnimationFrame(step);
    }, 300);

    return () => {
      clearTimeout(timer);
      if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
    };
  }, [targetScore, userData]);

  // RAF-Throttled Lighting Engine (Zero-Lag)
  const handleLampMove = useCallback((e) => {
    if (!cardRootRef.current || isTouchDevice) return;
    const { clientX, clientY } = e;
    if (lampRaf.current) return;
    
    lampRaf.current = requestAnimationFrame(() => {
      lampRaf.current = null;
      if (!cardRootRef.current) return;
      const rect = cardRootRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      cardRootRef.current.style.setProperty('--lamp-x', ((x / rect.width) * 2 - 1).toFixed(3));
      cardRootRef.current.style.setProperty('--lamp-y', ((y / rect.height) * 2 - 1).toFixed(3));
      cardRootRef.current.style.setProperty('--lamp-pct-x', `${((x / rect.width) * 100).toFixed(1)}%`);
      cardRootRef.current.style.setProperty('--lamp-pct-y', `${((y / rect.height) * 100).toFixed(1)}%`);
    });
  }, []);

  useEffect(() => () => {
    if (lampRaf.current) cancelAnimationFrame(lampRaf.current);
  }, []);

  const updateProfile = async (updates) => {
    if (contentFrozen) {
      toast.error(contentFreezeMessage);
      return;
    }

    try {
      const updated = await api.put('/users/profile', updates);
      setUserData(prev => ({ ...prev, ...updated }));
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      triggerHaptic('light');
    } catch (err) {
      toast.error('Failed to affix updates to the registry. Please try again.');
    }
  };

  const handlePhotoSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0 || photoSlot === null) return;
    setUploading(true);
    triggerHaptic('medium');
    try {
      const { url } = await api.upload(files[0]);
      const updatedPhotos = [...(userData.photos || [])];
      updatedPhotos[photoSlot] = url;
      await updateProfile({ photos: updatedPhotos });
    } catch (err) {
      toast.error('Artifact preservation failed. The image may be too large.');
    } finally {
      setUploading(false);
      setPhotoSlot(null);
      e.target.value = '';
    }
  };

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.color.paper }}>
        <p style={{ fontFamily: theme.font.display, color: theme.color.inkMuted, fontStyle: 'italic', fontSize: '16px' }}>Retrieving your folio...</p>
      </div>
    );
  }

  const RING_R = 34;
  const CIRCUMFERENCE = 2 * Math.PI * RING_R;
  const ringOffset = CIRCUMFERENCE - (displayScore / 100) * CIRCUMFERENCE;

  return (
    <div
      ref={cardRootRef}
      onMouseMove={handleLampMove}
      className="pc-root"
      style={{
        '--lamp-x': 0, '--lamp-y': 0, '--lamp-pct-x': '50%', '--lamp-pct-y': '30%',
        flex: 1, display: 'flex', flexDirection: 'column', position: 'relative',
        backgroundColor: theme.color.paper, overflow: 'hidden',
        userSelect: 'none', WebkitUserSelect: 'none', contain: 'paint',
      }}
    >
      <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handlePhotoSelect} />

      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at var(--lamp-pct-x) var(--lamp-pct-y), rgba(255,255,255,0.15) 0%, transparent 40%)', mixBlendMode: 'overlay', pointerEvents: 'none', zIndex: 20 }} />
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: `url("${design?.texture?.grain || ''}")`, mixBlendMode: 'multiply', pointerEvents: 'none', zIndex: 15 }} />

      {/* Floating Settings Button */}
      <button 
        onClick={() => { triggerHaptic('medium'); setSettingsOpen(true); }}
        aria-label="Open settings"
        className="tactile-btn"
        style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 30, background: 'rgba(253, 251, 247, 0.85)', backdropFilter: 'blur(4px)', border: `1px solid ${theme.color.borderDark}`, borderRadius: design?.radius?.md || '8px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
      >
        <Settings size={18} color={theme.color.ink} />
      </button>

      {/* MAIN SCROLL AREA */}
      <div className="pc-scroll" style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '120px', position: 'relative', zIndex: 1 }}>
        <ShadowbanBanner score={shadowbanScore} onLearnMore={() => setShowLearnMore(true)} />
        {showLearnMore && <LearnMoreSheet onClose={() => setShowLearnMore(false)} />}

        {/* 1. HERO PORTRAIT */}
        <div style={{ width: '100%', position: 'relative' }}>
          <div style={{ width: '100%', aspectRatio: '4/5.8', position: 'relative', backgroundColor: theme.color.surfaceAlt, overflow: 'hidden' }}>
            <img src={userData.photos?.[0] || 'https://via.placeholder.com/600x800/e8e4d9/1a1a1a?text=No+Portrait'} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0, transition: 'opacity 0.4s ease-out' }} alt="Hero" onLoad={(e) => { e.currentTarget.style.opacity = 1; }} onError={(e) => { e.currentTarget.style.opacity = 1; }} />
            <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at var(--lamp-pct-x) var(--lamp-pct-y), rgba(255,255,255,0.2) 0%, transparent 50%), linear-gradient(to top, rgba(15,12,10,0.95) 0%, rgba(15,12,10,0.5) 40%, rgba(0,0,0,0.05) 75%, transparent 100%)', pointerEvents: 'none' }} />
            
            <div style={{ position: 'absolute', bottom: '32px', left: '24px', right: '24px', zIndex: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <div style={{ padding: '4px 12px', background: 'rgba(253,251,247,0.2)', backdropFilter: 'blur(12px)', borderRadius: design?.radius?.sm || '4px', border: '1px solid rgba(255,255,255,0.35)' }}>
                  <span style={{ fontFamily: theme.font.body, fontSize: '10px', color: '#fff', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 700 }}>Subject Identity</span>
                </div>
                <button onClick={() => openEditDrawer({ type: 'identity' })} className="tactile-btn" style={styles.editBtn}><Pencil size={12} color="currentColor" style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Edit</button>
              </div>
              <h2 style={{ fontFamily: theme.font.display, fontSize: 'clamp(30px, 7vw, 42px)', color: '#fff', margin: 0, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.05, textShadow: '0 4px 20px rgba(0,0,0,0.6)' }}>
                {userData.name || 'Anonymous'}, {userData.age || '—'}
              </h2>
              <p style={{ fontFamily: theme.font.body, fontSize: '11px', color: 'rgba(255,255,255,0.92)', margin: '8px 0 0 0', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                {userData.branch || 'General'} <Sparkle size={12} color="#e6b17a" style={{ margin: '0 8px', flexShrink: 0 }} /> Class of {userData.year || '20XX'}
              </p>
            </div>
            
            <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 5 }}>
              <button onClick={() => openPhotoSlot(0)} className="tactile-btn" style={styles.editBtnAlt}>
                {uploading && photoSlot === 0 ? 'Developing...' : <><Pencil size={12} color="currentColor" style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Edit Portrait</>}
              </button>
            </div>
          </div>
          <div aria-hidden="true" style={{ width: '100%', height: '24px', backgroundColor: theme.color.paper, clipPath: TORN_EDGE_CLIP, marginTop: '-14px', position: 'relative', zIndex: 3, filter: 'drop-shadow(0 -3px 3px rgba(0,0,0,0.12))' }} />
        </div>

        <div style={{ padding: '24px 24px 0 24px' }}>
          
          {/* 2. VITALS & BIO */}
          <SectionLabel onEdit={() => openEditDrawer({ type: 'vitals' })}>Vitals</SectionLabel>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {userData.gender && <span className="pc-pill" style={styles.vitalStyle}>{userData.gender}</span>}
            {userData.pronouns && <span className="pc-pill" style={styles.vitalStyle}>{userData.pronouns}</span>}
            {userData.hostel && <span className="pc-pill" style={styles.vitalStyle}><MapPin size={12} style={{ marginRight: '4px' }} /> {userData.hostel}</span>}
          </div>

          <div style={{ marginBottom: '24px' }}>
             <SectionLabel onEdit={() => openEditDrawer({ type: 'bio' })}>About Me</SectionLabel>
             <p style={{ fontFamily: "'Special Elite', 'Courier New', monospace", fontSize: '13px', color: theme.color.inkSoft, lineHeight: 1.55, margin: 0, padding: '16px', backgroundColor: theme.color.surfaceAlt, border: `1px solid ${theme.color.borderDark}`, borderRadius: '8px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
               {userData.bio || "No foreword inscribed in this folio."}
             </p>
          </div>

          <StitchSeam />

          {/* 3. ARCHIVAL INTEGRITY GAUGE WITH CREATIVE CERTIFICATE STAMP */}
          <div
            className="pc-dynamic-shadow"
            style={{ backgroundColor: theme.color.surface, border: `1px solid ${theme.color.border}`, borderRadius: '16px', padding: '20px 22px', margin: '24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', position: 'relative', overflow: 'hidden' }}
          >
            <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at var(--lamp-pct-x) var(--lamp-pct-y), rgba(139,69,19,0.08) 0%, transparent 60%)', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', zIndex: 2 }}>
              <span style={{ fontFamily: theme.font.body, fontSize: '9px', color: theme.color.accent, margin: 0, textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700 }}>Registry Telemetry</span>
              <h3 style={{ fontFamily: theme.font.display, fontSize: '22px', color: theme.color.ink, margin: '2px 0 10px 0', fontWeight: 700, letterSpacing: '-0.02em' }}>Profile Completion</h3>
              
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ padding: '4px 10px', border: `1.5px solid ${theme.color.accent}`, borderRadius: '4px', color: theme.color.accent, fontFamily: theme.font.body, fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', backgroundColor: theme.color.paper }}>
                  {displayScore >= 85 ? 'Exemplary' : displayScore >= 50 ? 'Standard' : 'Incomplete'}
                </span>

                {/* Gestalt Mastery Certification Badge */}
                {displayScore >= 85 && (
                  <span className="pc-stamp" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', backgroundColor: 'rgba(46, 125, 50, 0.08)', border: '1px solid #2e7d32', borderRadius: '4px', color: '#2e7d32', fontFamily: theme.font.body, fontSize: '8.5px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
                    <CheckCircle2 size={11} /> Certified Archival
                  </span>
                )}
              </div>
            </div>

            <div style={{ position: 'relative', width: 88, height: 88, flexShrink: 0, zIndex: 2 }}>
              <svg width={88} height={88} viewBox="0 0 88 88" role="img" aria-label={`Profile completion score ${displayScore} percent`}>
                <g className="pc-bezel-outer">
                  {Array.from({ length: 60 }).map((_, i) => {
                    const isMajor = i % 5 === 0;
                    const angle = (i / 60) * Math.PI * 2;
                    const innerR = isMajor ? 22 : 25, outerR = 29;
                    return <line key={i} x1={44 + innerR * Math.cos(angle)} y1={44 + innerR * Math.sin(angle)} x2={44 + outerR * Math.cos(angle)} y2={44 + outerR * Math.sin(angle)} stroke={isMajor ? theme.color.accent : theme.color.border} strokeWidth={isMajor ? 1.5 : 0.75} opacity={isMajor ? 0.85 : 0.35} />;
                  })}
                </g>
                <circle cx={44} cy={44} r={RING_R} fill="none" stroke={theme.color.surfaceAlt} strokeWidth={5.5} transform="rotate(-90 44 44)" />
                <circle className="pc-ring" cx={44} cy={44} r={RING_R} fill="none" stroke="url(#metallicGradient)" strokeWidth={5.5} strokeLinecap="round" strokeDasharray={CIRCUMFERENCE} strokeDashoffset={ringOffset} transform="rotate(-90 44 44)" />
                <defs>
                  <linearGradient id="metallicGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8b4513" />
                    <stop offset="50%" stopColor="#e6b17a" />
                    <stop offset="100%" stopColor="#5c2c0c" />
                  </linearGradient>
                </defs>
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <p className="pc-metallic-foil" style={{ fontFamily: theme.font.display, fontSize: '24px', margin: 0, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em' }}>{displayScore}<span style={{ fontSize: '13px', fontWeight: 700, marginLeft: '1px' }}>%</span></p>
              </div>
            </div>
          </div>

          <StitchSeam />

          {/* 4. SEEKING PARAMETERS */}
          <div style={{ margin: '24px 0' }}>
            <SectionLabel onEdit={() => openEditDrawer({ type: 'intent' })}>Seeking Parameters</SectionLabel>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {(userData.intent?.length > 0 ? userData.intent : ['None recorded']).map((item, i) => (
                <span key={i} className="pc-pill" style={{ ...styles.vitalStyle, backgroundColor: theme.color.ink, color: theme.color.paper, borderColor: theme.color.ink, fontWeight: 600, boxShadow: '0 4px 12px rgba(26,26,26,0.15)' }}>{item}</span>
              ))}
            </div>
          </div>

          {/* 5. RECORDED CURIOSITIES */}
          <div style={{ marginBottom: '32px' }}>
            <SectionLabel onEdit={() => openEditDrawer({ type: 'interests' })}>Recorded Curiosities</SectionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {userData.interests?.length > 0 ? userData.interests.map((interest, i) => (
                <span key={i} className="pc-pill" style={styles.interestStyle}>{interest}</span>
              )) : <span style={styles.interestStyle}>None recorded</span>}
            </div>
          </div>

          {/* 6. BENTO GRID ARCHIVAL ARTIFACTS WITH TACTILE EMPTY STATES */}
          <div style={{ paddingTop: '8px', marginBottom: '48px' }}>
            <SectionLabel>Archival Artifacts</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px 16px', marginTop: '16px' }}>
              
              {/* Prompt 0 */}
              <div className="pc-dynamic-shadow" style={{ ...styles.bentoPrompt, transform: `rotate(${TILT.prompt_0})` }}>
                <div style={styles.tapeCenter} />
                <button onClick={() => openEditDrawer({ type: 'prompt', slot: 0 })} className="tactile-btn" style={styles.absoluteEditBtn}><Pencil size={12} color="currentColor" style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Edit</button>
                <span style={styles.quoteMark}>“</span>
                <p style={styles.promptText}>{userData.prompts?.[0]?.question || "Draft a whisper..."}</p>
              </div>

              {/* Photo 1 */}
              <div className="pc-dynamic-shadow" style={{ ...styles.bentoPhoto, transform: `rotate(${TILT.photo_1})` }}>
                <button onClick={() => openPhotoSlot(1)} className="tactile-btn" style={styles.absoluteEditBtn}><Pencil size={12} color="currentColor" style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Edit</button>
                {userData.photos?.[1] ? (
                  <img src={userData.photos[1]} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0, transition: 'opacity 0.4s ease-out' }} alt="Artifact II" onLoad={(e) => { e.currentTarget.style.opacity = 1; }} onError={(e) => { e.currentTarget.style.opacity = 1; }} />
                ) : (
                  <div onClick={() => openPhotoSlot(1)} style={styles.emptyPhotoSlot}>
                    <Camera size={24} color={theme.color.accent} style={{ opacity: 0.6, marginBottom: '8px' }} />
                    <span style={styles.emptySlotText}>Affix Artifact II</span>
                  </div>
                )}
              </div>

              {/* Photo 2 */}
              <div className="pc-dynamic-shadow" style={{ ...styles.bentoPhoto, transform: `rotate(${TILT.photo_2})` }}>
                <button onClick={() => openPhotoSlot(2)} className="tactile-btn" style={styles.absoluteEditBtn}><Pencil size={12} color="currentColor" style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Edit</button>
                {userData.photos?.[2] ? (
                  <img src={userData.photos[2]} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0, transition: 'opacity 0.4s ease-out' }} alt="Artifact III" onLoad={(e) => { e.currentTarget.style.opacity = 1; }} onError={(e) => { e.currentTarget.style.opacity = 1; }} />
                ) : (
                  <div onClick={() => openPhotoSlot(2)} style={styles.emptyPhotoSlot}>
                    <Camera size={24} color={theme.color.accent} style={{ opacity: 0.6, marginBottom: '8px' }} />
                    <span style={styles.emptySlotText}>Affix Artifact III</span>
                  </div>
                )}
              </div>

              {/* Prompt 1 */}
              <div className="pc-dynamic-shadow" style={{ ...styles.bentoPrompt, transform: `rotate(${TILT.prompt_1})` }}>
                <div style={styles.tapeLeft} />
                <button onClick={() => openEditDrawer({ type: 'prompt', slot: 1 })} className="tactile-btn" style={styles.absoluteEditBtn}><Pencil size={12} color="currentColor" style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Edit</button>
                <span style={styles.quoteMark}>“</span>
                <p style={styles.promptText}>{userData.prompts?.[1]?.question || "Draft a whisper..."}</p>
              </div>

              {/* Prompt 2 (Wide) */}
              <div className="pc-dynamic-shadow" style={{ ...styles.bentoPrompt, gridColumn: 'span 2', minHeight: '136px', transform: `rotate(${TILT.prompt_2})` }}>
                <div style={styles.tapeCenter} />
                <button onClick={() => openEditDrawer({ type: 'prompt', slot: 2 })} className="tactile-btn" style={styles.absoluteEditBtn}><Pencil size={12} color="currentColor" style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Edit</button>
                <span style={styles.quoteMark}>“</span>
                <p style={styles.promptText}>{userData.prompts?.[2]?.question || "Draft a final whisper..."}</p>
              </div>

              {/* Photo 3 (Wide) */}
              <div className="pc-dynamic-shadow" style={{ ...styles.bentoPhoto, gridColumn: 'span 2', aspectRatio: '16/9', transform: `rotate(${TILT.photo_3})` }}>
                <button onClick={() => openPhotoSlot(3)} className="tactile-btn" style={styles.absoluteEditBtn}><Pencil size={12} color="currentColor" style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Edit</button>
                {userData.photos?.[3] ? (
                  <img src={userData.photos[3]} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0, transition: 'opacity 0.4s ease-out' }} alt="Artifact IV" onLoad={(e) => { e.currentTarget.style.opacity = 1; }} onError={(e) => { e.currentTarget.style.opacity = 1; }} />
                ) : (
                  <div onClick={() => openPhotoSlot(3)} style={styles.emptyPhotoSlot}>
                    <Plus size={28} color={theme.color.accent} style={{ opacity: 0.6, marginBottom: '8px' }} />
                    <span style={styles.emptySlotText}>Affix Wide Panorama Artifact IV</span>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ==========================================
          VAULT SETTINGS OVERLAY
      ========================================== */}
      <AnimatePresence>
        {settingsOpen && (
          <motion.div 
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            style={{ position: 'fixed', inset: 0, backgroundColor: theme.color.paper, zIndex: 100, display: 'flex', flexDirection: 'column' }}
          >
            <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: `url("${design?.texture?.grain || ''}")`, mixBlendMode: 'multiply', opacity: 0.85, pointerEvents: 'none' }} />
            
            <div style={{ height: '45px', boxSizing: 'border-box', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.color.borderDark}`, backgroundColor: theme.color.surface, zIndex: 2 }}>
              <h2 style={{ fontFamily: theme.font.display, fontSize: '24px', margin: 0, color: theme.color.ink, fontWeight: 700 }}>Vault Settings</h2>
              <button onClick={() => setSettingsOpen(false)} className="tactile-btn" aria-label="Close settings" style={{ background: 'none', border: 'none', fontSize: '24px', color: theme.color.inkMuted, cursor: 'pointer', padding: '4px' }}><X size={24} color="currentColor" /></button>
            </div>

            <div className="pc-scroll" style={{ flex: 1, padding: '24px', overflowY: 'auto', zIndex: 2 }}>
              
              <div style={{ backgroundColor: theme.color.surface, padding: '20px', borderRadius: '16px', border: `1px solid ${theme.color.border}`, boxShadow: `0 4px 16px ${theme.color.shadowWarm}`, display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: theme.font.display, fontSize: '18px', color: theme.color.ink, margin: '0 0 4px 0', fontWeight: 700 }}>Ghost Mode</p>
                  <p style={{ fontFamily: theme.font.body, fontSize: '12px', color: theme.color.inkMuted, margin: 0, lineHeight: 1.4 }}>Conceal your folio from the Discovery deck. Existing matches remain active.</p>
                </div>
                <label className="switch" style={{ flexShrink: 0 }}>
                  <input type="checkbox" checked={isGhostMode} onChange={async () => {
                    triggerHaptic('medium');
                    const newState = !isGhostMode;
                    setIsGhostMode(newState);
                    try { await api.put('/users/profile', { isGhost: newState }); } catch { setIsGhostMode(!newState); }
                  }} />
                  <span className="slider"></span>
                  <span className="sun"><svg fill="#fff" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"></circle><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path></svg></span>
                  <span className="moon"><svg fill="#fff" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg></span>
                </label>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button 
                  className="tactile-btn" 
                  style={styles.actionBtn} 
                  onClick={() => {
                    triggerHaptic('light');
                    setBlockedOpen(true);
                    fetchBlockedUsers();
                  }}
                >
                  Blocked Subjects
                </button>
                <button className="tactile-btn" style={{...styles.actionBtn, marginTop: '24px'}} onClick={onSignOut}>Log Out</button>
                <button 
                  className="tactile-btn"
                  style={{ ...styles.actionBtn, color: theme.color.crimson, borderColor: 'rgba(139, 26, 26, 0.3)', backgroundColor: 'rgba(139, 26, 26, 0.05)' }}
                  onClick={async () => {
                    triggerHaptic('heavy');
                    if (window.confirm('This will immediately deactivate your profile, sever all active connections, and remove your correspondence from campus view. To maintain campus safety, archival logs are retained for 30 days before permanent destruction. This action cannot be undone.')) {
                      try {
                        await api.delete('/users/account');
                        onSignOut();
                      } catch (err) {
                        if (err.response?.data?.deleted) {
                          onSignOut();
                        } else {
                          toast.error('Failed to delete account. Please try again.');
                        }
                      }
                    }
                  }}
                >
                  Delete Account
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==========================================
          EDITING DRAWERS (BOTTOM SHEETS)
      ========================================== */}
      <AnimatePresence>
        {drawerConfig && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDrawerConfig(null)}
              style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(20,15,10,0.7)', backdropFilter: 'blur(4px)', zIndex: 100 }} 
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '80dvh', backgroundColor: theme.color.paper, borderTopLeftRadius: '24px', borderTopRightRadius: '24px', zIndex: 101, display: 'flex', flexDirection: 'column', boxShadow: '0 -20px 50px rgba(0,0,0,0.4)' }}
            >
              <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: `url("${design?.texture?.grain || ''}")`, mixBlendMode: 'multiply', opacity: 0.5, pointerEvents: 'none' }} />
              
              <div style={{ padding: '20px 24px', borderBottom: `1px solid ${theme.color.borderDark}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.color.surface, borderTopLeftRadius: '24px', borderTopRightRadius: '24px', zIndex: 2 }}>
                <span style={{ fontFamily: theme.font.display, fontSize: '20px', fontWeight: 700, color: theme.color.ink }}>
                  {drawerConfig.type === 'interests' ? 'Edit Recorded Curiosities' : drawerConfig.type === 'intent' ? 'Edit Seeking Parameters' : drawerConfig.type === 'prompt' ? 'Draft Whisper' : drawerConfig.type === 'vitals' ? 'Edit Vitals' : drawerConfig.type === 'identity' ? 'Edit Subject Identity' : 'Edit About Me'}
                </span>
                <button onClick={() => setDrawerConfig(null)} className="tactile-btn" aria-label="Close editor" style={{ background: theme.color.surfaceAlt, border: `1px solid ${theme.color.borderDark}`, borderRadius: design?.radius?.md || '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.color.ink }}><X size={16} color="currentColor" /></button>
              </div>
              
              <div className="pc-scroll" style={{ padding: '24px', overflowY: 'auto', flex: 1, zIndex: 2 }}>
                
                {/* IDENTITY EDITOR */}
                {drawerConfig.type === 'identity' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <input defaultValue={userData.name} onBlur={(e) => updateProfile({ name: e.target.value })} placeholder="Given Name" style={styles.drawerInput} />
                    <input defaultValue={userData.branch} onBlur={(e) => updateProfile({ branch: e.target.value })} placeholder="Branch / Discipline" style={styles.drawerInput} />
                    <select defaultValue={userData.year} onChange={(e) => updateProfile({ year: e.target.value })} style={styles.drawerSelect}>
                      {config?.years?.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                )}

                {/* VITALS EDITOR */}
                {drawerConfig.type === 'vitals' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <select defaultValue={userData.gender} onChange={(e) => updateProfile({ gender: e.target.value })} style={styles.drawerSelect}>
                      <option value="">Select Gender</option>
                      {config?.genders?.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <select defaultValue={userData.pronouns} onChange={(e) => updateProfile({ pronouns: e.target.value })} style={styles.drawerSelect}>
                      <option value="">Select Pronouns</option>
                      {config?.pronouns?.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <input defaultValue={userData.hostel} onBlur={(e) => updateProfile({ hostel: e.target.value })} placeholder="Hostel" style={styles.drawerInput} />
                  </div>
                )}

                {/* BIO EDITOR */}
                {drawerConfig.type === 'bio' && (
                  <textarea 
                    defaultValue={userData.bio} 
                    onBlur={(e) => updateProfile({ bio: e.target.value })} 
                    placeholder="Write your foreword..."
                    style={{ ...styles.drawerInput, minHeight: '150px', resize: 'none', fontFamily: "'Special Elite', 'Courier New', monospace", lineHeight: 1.5 }} 
                  />
                )}

                {/* PROMPT EDITOR */}
                {drawerConfig.type === 'prompt' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <textarea 
                      placeholder="Type your whisper here..."
                      defaultValue={userData.prompts[drawerConfig.slot]?.question || ''}
                      onBlur={(e) => {
                        const updated = [...userData.prompts];
                        updated[drawerConfig.slot] = { question: e.target.value.trim() };
                        updateProfile({ prompts: updated });
                      }}
                      style={{ ...styles.drawerInput, minHeight: '80px', resize: 'none' }}
                    />
                    <div style={{ height: '1px', backgroundColor: theme.color.borderDark, margin: '8px 0' }} />
                    {config?.prompts?.map((p, i) => (
                      <button 
                        key={i}
                        className="tactile-btn"
                        onClick={() => {
                          const updated = [...userData.prompts];
                          updated[drawerConfig.slot] = { question: p.question };
                          updateProfile({ prompts: updated });
                          setDrawerConfig(null);
                        }}
                        style={styles.promptListBtn}
                      >
                        "{p.question}"
                      </button>
                    ))}
                  </div>
                )}

                {/* INTERESTS / INTENT EDITOR */}
                {(drawerConfig.type === 'interests' || drawerConfig.type === 'intent') && (
                  <>
                    {drawerConfig.type === 'interests' && (
                      <p style={{ fontFamily: theme.font.body, fontSize: '12px', color: theme.color.inkMuted, marginBottom: '16px', fontWeight: 500 }}>Select up to 6 curiosities ({userData.interests.length}/6).</p>
                    )}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {(drawerConfig.type === 'interests' ? config?.interests : config?.intents)?.map(item => {
                        const isActive = userData[drawerConfig.type].includes(item);
                        const isAtLimit = drawerConfig.type === 'interests' && !isActive && userData.interests.length >= 6;
                        return (
                          <button 
                            key={item}
                            disabled={isAtLimit}
                            className="tactile-btn"
                            onClick={() => {
                              triggerHaptic('light');
                              const current = userData[drawerConfig.type];
                              const updated = isActive ? current.filter(i => i !== item) : [...current, item];
                              updateProfile({ [drawerConfig.type]: updated });
                            }}
                            style={{
                              ...styles.interestStyle,
                              backgroundColor: isActive ? theme.color.crimson : theme.color.surfaceAlt,
                              color: isActive ? '#fff' : theme.color.ink,
                              borderColor: isActive ? theme.color.crimson : 'rgba(224, 216, 200, 0.7)',
                              opacity: isAtLimit ? 0.4 : 1,
                              cursor: isAtLimit ? 'not-allowed' : 'pointer',
                            }}
                          >
                            {item}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ==========================================
          BLOCKED SUBJECTS OVERLAY
      ========================================== */}
      <AnimatePresence>
        {blockedOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setBlockedOpen(false)}
              style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(20,15,10,0.7)', backdropFilter: 'blur(4px)', zIndex: 110 }} 
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{ position: 'fixed', bottom: 0, left: 0, right: 0, maxHeight: '75dvh', backgroundColor: theme.color.paper, borderTopLeftRadius: '24px', borderTopRightRadius: '24px', zIndex: 111, display: 'flex', flexDirection: 'column', boxShadow: '0 -20px 50px rgba(0,0,0,0.4)' }}
            >
              <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: `url("${design?.texture?.grain || ''}")`, mixBlendMode: 'multiply', opacity: 0.5, pointerEvents: 'none' }} />
              
              {/* Header */}
              <div style={{ padding: '20px 24px', borderBottom: `1px solid ${theme.color.borderDark}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.color.surface, borderTopLeftRadius: '24px', borderTopRightRadius: '24px', zIndex: 2 }}>
                <span style={{ fontFamily: theme.font.display, fontSize: '20px', fontWeight: 700, color: theme.color.ink }}>Blocked Subjects</span>
                <button onClick={() => setBlockedOpen(false)} className="tactile-btn" style={{ background: theme.color.surfaceAlt, border: `1px solid ${theme.color.borderDark}`, borderRadius: design?.radius?.md || '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.color.ink }}><X size={16} /></button>
              </div>
              
              {/* List Content */}
              <div className="pc-scroll" style={{ padding: '24px', overflowY: 'auto', flex: 1, zIndex: 2 }}>
                {loadingBlocked ? (
                  <p style={{ fontFamily: theme.font.body, fontSize: '14px', color: theme.color.inkMuted, textAlign: 'center', margin: '40px 0' }}>Consulting disciplinary archives...</p>
                ) : blockedList.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <p style={{ fontFamily: theme.font.display, fontSize: '18px', color: theme.color.ink, fontWeight: 700, margin: '0 0 8px 0' }}>No Blocked Subjects</p>
                    <p style={{ fontFamily: theme.font.body, fontSize: '13px', color: theme.color.inkMuted, margin: 0 }}>Your disciplinary ledger is currently empty.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {blockedList.map(user => (
                      <div key={user._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: theme.color.surface, border: `1px solid ${theme.color.border}`, borderRadius: '12px', boxShadow: `0 2px 8px ${theme.color.shadowWarm}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img src={user.photo || 'https://via.placeholder.com/60'} alt={user.name} style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover', border: `1px solid ${theme.color.borderDark}` }} />
                          <div>
                            <p style={{ fontFamily: theme.font.display, fontSize: '16px', fontWeight: 700, color: theme.color.ink, margin: 0 }}>{user.name}</p>
                            <p style={{ fontFamily: theme.font.body, fontSize: '11px', color: theme.color.inkMuted, margin: '2px 0 0 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{user.branch} • {user.year}</p>
                          </div>
                        </div>
                        <button 
                          className="tactile-btn"
                          onClick={() => handleUnblock(user._id, user.name)}
                          style={{ padding: '8px 14px', backgroundColor: theme.color.surfaceAlt, border: `1px solid ${theme.color.borderDark}`, borderRadius: '8px', fontFamily: theme.font.body, fontSize: '12px', fontWeight: 700, color: theme.color.ink, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.5px' }}
                        >
                          Unblock
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* GPU PROMOTED ZERO-LAG ANIMATIONS & TACTILE PHYSICS */}
      <style>{`
        .pc-dynamic-shadow {
          will-change: transform, box-shadow;
          transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
          box-shadow: calc(var(--lamp-x) * -12px) calc(var(--lamp-y) * -12px + 8px) 24px -6px ${theme.color.shadowWarm}, 0 2px 6px rgba(0,0,0,0.03);
          transform: translate3d(0, 0, 0);
        }
        @media (hover: hover) {
          .pc-dynamic-shadow:hover {
            transform: translate3d(0, -3px, 0) scale3d(1.015, 1.015, 1) rotate(0deg) !important;
            box-shadow: calc(var(--lamp-x) * -18px) calc(var(--lamp-y) * -18px + 14px) 30px -8px rgba(26,26,26,0.18), 0 6px 12px ${theme.color.shadowWarm} !important;
            z-index: 5;
          }
        }
        .pc-ring { transition: stroke-dashoffset 0.4s cubic-bezier(0.2, 0.8, 0.2, 1); }
        .pc-bezel-outer { animation: pcBezelRotate 60s linear infinite; transform-origin: 44px 44px; }
        @keyframes pcBezelRotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pcSealStamp { 0% { transform: scale3d(1.8, 1.8, 1) rotate(-8deg); opacity: 0; filter: blur(4px); } 60% { transform: scale3d(0.95, 0.95, 1) rotate(-6deg); opacity: 1; filter: blur(0px); } 80% { transform: scale3d(1.02, 1.02, 1) rotate(-6deg); opacity: 1; } 100% { transform: scale3d(1, 1, 1) rotate(-6deg); opacity: 1; } }
        .pc-stamp { animation: pcSealStamp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s both; }
        .pc-metallic-foil { background: linear-gradient(135deg, #5c2c0c 0%, #8b4513 30%, #e6b17a 50%, #8b4513 70%, #421f08 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; filter: drop-shadow(0 1px 1px rgba(0,0,0,0.12)); }
        .pc-scroll::-webkit-scrollbar { width: 4px; }
        .pc-scroll::-webkit-scrollbar-track { background: transparent; }
        .pc-scroll::-webkit-scrollbar-thumb { background: ${theme.color.borderDark}; border-radius: 4px; }
        
        /* Interactive Tactile Physics */
        .tactile-btn { transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.2s ease, background-color 0.2s ease; will-change: transform; }
        @media (hover: hover) { .tactile-btn:hover { transform: translate3d(0, -2px, 0) scale3d(1.02, 1.02, 1); box-shadow: 0 4px 12px ${theme.color.shadowWarm}; } }
        .tactile-btn:active { transform: scale3d(0.96, 0.96, 1) translate3d(0, 0, 0) !important; transition: transform 0.08s cubic-bezier(0, 0, 0.2, 1) !important; }
        .pc-pill { transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease; display: inline-flex; align-items: center; will-change: transform; }
        @media (hover: hover) { .pc-pill:hover { transform: translate3d(0, -2px, 0) scale3d(1.03, 1.03, 1); box-shadow: 0 4px 10px rgba(0,0,0,0.08); } }
        @media (prefers-reduced-motion: reduce) { .pc-bezel-outer, .pc-stamp { animation: none !important; } .pc-dynamic-shadow, .tactile-btn, .pc-pill { transition: none !important; transform: none !important; } }
      `}</style>
    </div>
  );
};

/* ==================================================================
   UI HELPERS & CONSTANTS
================================================================== */
const SectionLabel = React.memo(({ children, onEdit }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 0 12px 0' }}>
    <p style={{ fontFamily: theme.font.body, fontSize: '10px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: theme.color.accent, margin: 0, display: 'flex', alignItems: 'center' }}>
      <span aria-hidden="true" style={{ display: 'inline-block', width: '14px', height: '2px', backgroundColor: theme.color.accent, marginRight: '8px', borderRadius: '2px' }} />
      {children}
    </p>
    {onEdit && <button onClick={() => { triggerHaptic('light'); onEdit(); }} className="tactile-btn" style={styles.editBtn}><Pencil size={12} color="currentColor" style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Edit</button>}
  </div>
));

const StitchSeam = React.memo(() => <div aria-hidden="true" style={{ height: '1px', backgroundImage: `repeating-linear-gradient(90deg, ${theme.color.border} 0px, ${theme.color.border} 6px, transparent 6px, transparent 12px)`, opacity: 0.8, margin: '16px 0' }} />);

const styles = {
  editBtn: { background: 'rgba(139, 69, 19, 0.08)', border: `1px solid rgba(139, 69, 19, 0.2)`, color: theme.color.accent, fontSize: '10px', fontFamily: theme.font.body, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer', padding: '4px 10px', borderRadius: '12px' },
  editBtnAlt: { background: 'rgba(0, 0, 0, 0.55)', border: `1px solid rgba(255, 255, 255, 0.25)`, color: '#fff', fontSize: '10px', fontFamily: theme.font.body, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer', padding: '6px 12px', borderRadius: '12px', backdropFilter: 'blur(4px)' },
  absoluteEditBtn: { position: 'absolute', top: '8px', right: '8px', zIndex: 10, background: 'rgba(253, 251, 247, 0.9)', border: `1px solid ${theme.color.borderDark}`, color: theme.color.accent, fontSize: '10px', fontFamily: theme.font.body, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer', padding: '4px 10px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.08)' },
  vitalStyle: { padding: '6px 12px', border: `1px solid ${theme.color.border}`, borderRadius: design?.radius?.sm || '4px', backgroundColor: theme.color.surface, color: theme.color.ink, fontFamily: theme.font.body, fontSize: '11px', fontWeight: 600, letterSpacing: '0.2px' },
  interestStyle: { padding: '6px 12px', border: `1px solid rgba(224, 216, 200, 0.7)`, borderRadius: design?.radius?.sm || '4px', backgroundColor: theme.color.surfaceAlt, color: theme.color.ink, fontFamily: theme.font.body, fontSize: '11px', fontWeight: 500 },
  bentoPrompt: { backgroundColor: theme.color.surface, backgroundImage: `linear-gradient(${theme.color.accentFaint} 1px, transparent 1px)`, backgroundSize: '100% 24px', border: `1px solid ${theme.color.border}`, borderRadius: '8px', padding: '24px 16px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: '140px' },
  bentoPhoto: { position: 'relative', width: '100%', aspectRatio: '1/1', borderRadius: '6px', border: `6px solid ${theme.color.surface}`, backgroundColor: theme.color.surfaceAlt, overflow: 'hidden' },
  emptyPhotoSlot: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(139, 69, 19, 0.03)', border: `1.5px dashed ${theme.color.borderDark}`, cursor: 'pointer', padding: '16px', textAlign: 'center', transition: 'background-color 0.2s ease' },
  emptySlotText: { fontFamily: theme.font.body, fontSize: '11px', fontWeight: 600, color: theme.color.inkMuted, letterSpacing: '0.5px' },
  tapeCenter: { position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%) rotate(-1deg)', width: '36px', height: '16px', backgroundColor: 'rgba(224, 216, 200, 0.9)', backdropFilter: 'blur(2px)', border: '1px solid rgba(139, 69, 19, 0.15)', boxShadow: '0 2px 4px rgba(0,0,0,0.06)', zIndex: 5 },
  tapeLeft: { position: 'absolute', top: '-10px', left: '16px', transform: 'rotate(-4deg)', width: '36px', height: '16px', backgroundColor: 'rgba(224, 216, 200, 0.9)', backdropFilter: 'blur(2px)', border: '1px solid rgba(139, 69, 19, 0.15)', boxShadow: '0 2px 4px rgba(0,0,0,0.06)', zIndex: 5 },
  quoteMark: { fontFamily: theme.font.display, fontSize: '32px', lineHeight: 0.5, opacity: 0.45, marginBottom: '8px', display: 'block', color: theme.color.ink },
  promptText: { fontFamily: theme.font.display, fontSize: '15px', fontStyle: 'italic', color: theme.color.ink, margin: '0 0 4px 0', lineHeight: 1.45, textAlign: 'center', fontWeight: 600 },
  actionBtn: { width: '100%', padding: '16px', backgroundColor: theme.color.surface, border: `1px solid ${theme.color.borderDark}`, borderRadius: design?.radius?.md || '8px', color: theme.color.ink, fontFamily: design?.font?.body || "'Inter', sans-serif", fontSize: '14px', fontWeight: 600, textAlign: 'left', cursor: 'pointer', boxShadow: `0 2px 6px ${theme.color.shadowWarm}` },
  drawerInput: { width: '100%', backgroundColor: theme.color.surface, border: `1px solid ${theme.color.borderDark}`, borderRadius: design?.radius?.sm || '4px', padding: '14px 12px', fontSize: '15px', color: theme.color.ink, fontFamily: design?.font?.body || "'Inter', sans-serif", outline: 'none' },
  drawerSelect: { width: '100%', backgroundColor: theme.color.surface, border: `1px solid ${theme.color.borderDark}`, borderRadius: design?.radius?.sm || '4px', padding: '14px 12px', fontSize: '15px', color: theme.color.ink, fontFamily: design?.font?.body || "'Inter', sans-serif", outline: 'none', appearance: 'none' },
  promptListBtn: { width: '100%', textAlign: 'left', padding: '14px 16px', borderRadius: '8px', border: `1px solid ${theme.color.borderDark}`, backgroundColor: theme.color.surface, fontFamily: theme.font.display, fontSize: '14px', color: theme.color.ink, cursor: 'pointer', lineHeight: 1.4 },
};

export default Profile;