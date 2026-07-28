import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import PopoutItem from './PopoutItem';
import { useAppConfig } from '../utils/AppConfigContext';
import { theme as design } from '../utils/theme';
import { Sparkle, MapPin, MoreVertical, Award, Calendar } from 'lucide-react';

/* ==================================================================
   MUSEUM-GRADE ARCHIVAL SYSTEM
================================================================== */
const theme = {
  color: {
    paper: '#fdfbf7',
    surface: '#ffffff',
    surfaceAlt: '#f4f1ea',
    border: '#e0d8c8',
    ink: '#1a1a1a',
    inkSoft: '#4a4a4a',
    accent: '#8b4513',
    crimson: '#8b1a1a',
    shadowWarm: 'rgba(139, 69, 19, 0.12)',
  },
  font: {
    display: "'Playfair Display', Georgia, serif",
    body: "'Inter', -apple-system, sans-serif",
    typewriter: "'Special Elite', 'Courier New', monospace",
  },
};

// Static, optimized deckle edge
const TORN_EDGE_CLIP = 'polygon(0% 100%, 2% 80%, 4% 95%, 6% 85%, 8% 100%, 10% 80%, 12% 95%, 14% 85%, 16% 100%, 18% 80%, 20% 95%, 22% 85%, 24% 100%, 26% 80%, 28% 95%, 30% 85%, 32% 100%, 34% 80%, 36% 95%, 38% 85%, 40% 100%, 42% 80%, 44% 95%, 46% 85%, 48% 100%, 50% 80%, 52% 95%, 54% 85%, 56% 100%, 58% 80%, 60% 95%, 62% 85%, 64% 100%, 66% 80%, 68% 95%, 70% 85%, 72% 100%, 74% 80%, 76% 95%, 78% 85%, 80% 100%, 82% 80%, 84% 95%, 86% 85%, 88% 100%, 90% 80%, 92% 95%, 94% 85%, 96% 100%, 98% 80%, 100% 100%)';

function matchStatus(score) {
  if (score >= 85) return 'Exceptional Match';
  if (score >= 65) return 'High Compatibility';
  if (score >= 40) return 'Potential Resonance';
  return 'Exploratory';
}

const TILT = { prompt_0: '1.4deg', photo_1: '-2.2deg', photo_2: '1.8deg', prompt_1: '-1.1deg', prompt_2: '0.5deg', photo_3: '-0.7deg' };

/* ==================================================================
   MAIN COMPONENT
================================================================== */
const ProfileCard = ({ profile = {}, scrollRef, onAction }) => {
  const config = useAppConfig();
  const heroImgRef = useRef(null);
  const targetScore = Math.min(100, Math.max(0, profile.compatScore || 0));
  
  const [displayScore, setDisplayScore] = useState(0);
  const [sweeping, setSweeping] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [heroLoaded, setHeroLoaded] = useState(false);

  // Hardware-Accelerated Scroll Engine (Zero-Lag Paper Tear)
  const { scrollY } = useScroll({ container: scrollRef });
  const tearOpacity = useTransform(scrollY, [0, 60], [0, 1]);
  const tearY = useTransform(scrollY, [0, 60], [-15, 0]);

  useEffect(() => {
    if (heroImgRef.current?.complete) setHeroLoaded(true);
  }, [profile.photos]);

  // Compatibility Radar Animation
  useEffect(() => {
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
      if (progress < 1) animationFrameId = window.requestAnimationFrame(step);
    };

    const timer = setTimeout(() => {
      setSweeping(true);
      animationFrameId = window.requestAnimationFrame(step);
    }, 300);

    return () => {
      clearTimeout(timer);
      if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
    };
  }, [targetScore]);

  // Dynamic Icon Engine
  const getIconForInterest = (interest) => {
    const key = Object.keys(config.interestIcons || {}).find(k => interest.toLowerCase().includes(k));
    if (key) return config.interestIcons[key];
    const fallbacks = config.interestIconFallbacks || ['star'];
    let hash = 0;
    for (let i = 0; i < interest.length; i++) hash = ((hash << 5) - hash) + interest.charCodeAt(i);
    return fallbacks[Math.abs(hash) % fallbacks.length];
  };

  return (
    <div
      style={{
        width: '100%', 
        height: '100%', 
        backgroundColor: theme.color.paper,
        display: 'flex', 
        flexDirection: 'column', 
        position: 'relative',
        borderRadius: '0 24px 24px 0', // The Book Spine Geometry
        overflow: 'hidden',
        boxShadow: `inset 12px 0 20px -8px rgba(0,0,0,0.15), 4px 0 16px ${theme.color.shadowWarm}`,
        border: `1px solid ${theme.color.border}`,
        borderLeft: 'none',
      }}
    >
      {/* Cinematic Texture */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: `url("${design.texture.grain}")`, mixBlendMode: 'multiply', pointerEvents: 'none', zIndex: 15 }} />

      {/* Global Hardware Accelerated Styles */}
      <style>{`
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        .tactile-btn { transition: transform 0.15s ease-out; will-change: transform; }
        .tactile-btn:active { transform: scale(0.96) !important; }
        .bento-box { background: ${theme.color.surfaceAlt}; border: 1px solid ${theme.color.border}; border-radius: 16px; padding: 20px; box-shadow: inset 0 2px 8px rgba(0,0,0,0.02); }
      `}</style>

      {/* LAG-FREE SCROLL AREA */}
      <div 
        ref={scrollRef} 
        className="hide-scroll"
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          WebkitOverflowScrolling: 'touch',
          paddingBottom: '32px', // FIXED: Reduced extreme padding
          position: 'relative', 
          zIndex: 1,
          willChange: 'scroll-position'
        }}
      >
        
        {/* 1. UPSCALED HERO PHOTO */}
        <div style={{ width: '100%', flexShrink: 0, position: 'relative' }}>
          <div style={{ width: '100%', aspectRatio: '3/4', position: 'relative', backgroundColor: theme.color.surfaceAlt, overflow: 'hidden' }}>
            
            <div style={{ opacity: heroLoaded ? 1 : 0, transition: 'opacity 0.4s ease-out', width: '100%', height: '100%' }}>
              <img 
                ref={heroImgRef} 
                src={profile.photos?.[0] || 'https://via.placeholder.com/600x800'} 
                alt={profile.name} 
                onLoad={() => setHeroLoaded(true)} 
                decoding="async" 
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
              />
              
              <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,12,10,0.95) 0%, rgba(15,12,10,0.4) 40%, transparent 100%)', pointerEvents: 'none' }} />
              
              <div style={{ position: 'absolute', bottom: '48px', left: '24px', right: '24px', zIndex: 2 }}>
                <h2 style={{ fontFamily: theme.font.display, fontSize: '42px', color: '#fff', margin: 0, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                  {profile.name || 'Anonymous'}<span style={{ fontWeight: 400, opacity: 0.85 }}>, {profile.age || '—'}</span>
                </h2>
                <p style={{ fontFamily: theme.font.body, fontSize: '14px', color: 'rgba(255,255,255,0.92)', margin: '10px 0 0 0', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center' }}>
                  {profile.branch || 'General'} <Sparkle size={14} color="#e6b17a" style={{ margin: '0 8px' }} /> Era {profile.year || '20XX'}
                </p>
              </div>
            </div>

            <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}>
              <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="tactile-btn" style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '12px', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
                <MoreVertical size={24} color="#fff" />
              </button>
              {showProfileMenu && (
                <div style={{ position: 'absolute', top: 56, right: 0, backgroundColor: theme.color.paper, border: `1px solid ${theme.color.border}`, borderRadius: '12px', boxShadow: '0 12px 32px rgba(0,0,0,0.25)', zIndex: 20, minWidth: 160 }}>
                  <button onClick={() => setShowProfileMenu(false)} style={{ display: 'block', width: '100%', padding: '16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontFamily: theme.font.body, fontSize: '15px', color: theme.color.crimson, fontWeight: 700 }}>Report Profile</button>
                </div>
              )}
            </div>
          </div>
          {/* HARDWARE ACCELERATED ZERO-LAG PAPER TEAR */}
          <motion.div aria-hidden="true" style={{ width: '100%', height: '24px', backgroundColor: theme.color.paper, clipPath: TORN_EDGE_CLIP, marginTop: '-12px', position: 'relative', zIndex: 3, filter: 'drop-shadow(0 -3px 3px rgba(0,0,0,0.15))', opacity: tearOpacity, y: tearY, pointerEvents: 'none' }} />
        </div>

        <div style={{ padding: '20px 24px 0 24px' }}>
          
          {/* 2. THE EDITORIAL GRID: Vitals & Bio */}
          <div className="bento-box" style={{ marginBottom: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={vitalGridItem}><MapPin size={18} color={theme.color.accent} /> <span style={vitalText}>{profile.hostel || 'Campus'}</span></div>
              <div style={vitalGridItem}><Calendar size={18} color={theme.color.accent} /> <span style={vitalText}>{profile.year || 'Era'}</span></div>
              <div style={vitalGridItem}><Award size={18} color={theme.color.accent} /> <span style={vitalText}>{profile.branch || 'Discipline'}</span></div>
              <div style={vitalGridItem}><Sparkle size={18} color={theme.color.accent} /> <span style={vitalText}>{profile.pronouns || 'Identity'}</span></div>
            </div>
            
            {profile.bio && (
              <div style={{ borderTop: `1px solid ${theme.color.borderDark}`, paddingTop: '20px' }}>
                <SectionLabel>Foreword</SectionLabel>
                <p style={{ fontFamily: theme.font.typewriter, fontSize: '17px', color: theme.color.ink, lineHeight: 1.6, margin: 0, fontWeight: 600 }}>"{profile.bio}"</p>
              </div>
            )}
          </div>

          {/* 3. COMPATIBILITY SCAN */}
          <PopoutItem targetId="compatibility" onAction={onAction} type="compatibility">
            <div style={{ backgroundColor: theme.color.surface, border: `1px solid ${theme.color.borderDark}`, borderRadius: '20px', padding: '24px', marginBottom: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
              <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 50%, rgba(139,69,19,0.06) 0%, transparent 60%)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', zIndex: 2 }}>
                <h3 style={{ fontFamily: theme.font.display, fontSize: '28px', color: theme.color.ink, margin: '0 0 10px 0', fontWeight: 800 }}>Compatibility</h3>
                <span style={{ display: 'inline-block', padding: '8px 14px', border: `1.5px solid ${theme.color.accent}`, borderRadius: '8px', color: theme.color.accent, fontFamily: theme.font.body, fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', backgroundColor: theme.color.paper }}>{matchStatus(displayScore)}</span>
              </div>
              <div style={{ position: 'relative', width: 90, height: 90, flexShrink: 0, zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: `4px solid ${theme.color.surfaceAlt}` }}>
                 <p style={{ fontFamily: theme.font.display, fontSize: '28px', margin: 0, fontWeight: 800, color: theme.color.accent }}>{displayScore}<span style={{ fontSize: '16px' }}>%</span></p>
              </div>
              <div style={{ position: 'absolute', top: '14px', right: '14px', zIndex: 3 }}><HoldHint /></div>
            </div>
          </PopoutItem>

          {/* 4. SEEKING INTENT & CURIOSITIES */}
          <div className="bento-box" style={{ marginBottom: '36px' }}>
             <SectionLabel>Archival Parameters</SectionLabel>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {(profile.intent && profile.intent.length > 0 ? profile.intent : ['Connection']).map((item, i) => (
                    <span key={i} style={{ padding: '10px 16px', border: `1.5px solid ${theme.color.crimson}`, borderRadius: '10px', backgroundColor: 'rgba(139,26,26,0.05)', color: theme.color.crimson, fontFamily: theme.font.body, fontSize: '13px', fontWeight: 800, textTransform: 'uppercase' }}>{item}</span>
                  ))}
                </div>
                {profile.interests && profile.interests.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', borderTop: `1px dashed ${theme.color.borderDark}`, paddingTop: '20px' }}>
                    {profile.interests.map((interest, i) => (
                      <span key={i} style={{ padding: '10px 14px', border: `1px solid ${theme.color.border}`, borderRadius: '10px', backgroundColor: theme.color.surface, color: theme.color.inkSoft, fontFamily: theme.font.typewriter, fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px', marginRight: '8px', color: theme.color.inkMuted }}>{getIconForInterest(interest)}</span>
                        {interest}
                      </span>
                    ))}
                  </div>
                )}
             </div>
          </div>

          {/* 5. BENTO GRID (Photos & Whispers via PopoutItem for Letter/Flower Sending) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px 16px', marginBottom: '24px', paddingTop: '8px', alignItems: 'center' }}>
            
            <PopoutItem targetId="prompt_0" onAction={onAction} style={{ height: 'auto' }}>
              <IndexCard tilt={TILT.prompt_0} tape="top-right">{profile.prompts?.[0]?.question || "A shower thought I recently had..."}</IndexCard>
            </PopoutItem>

            {profile.photos?.[1] ? (
              <PopoutItem targetId="photo_1" onAction={onAction}>
                <MountedPhoto src={profile.photos[1]} alt={`${profile.name}, artifact 2`} tilt={TILT.photo_1} aspect="4 / 5" />
              </PopoutItem>
            ) : <div />}

            {profile.photos?.[2] ? (
              <PopoutItem targetId="photo_2" onAction={onAction}>
                <MountedPhoto src={profile.photos[2]} alt={`${profile.name}, artifact 3`} tilt={TILT.photo_2} aspect="4 / 5" />
              </PopoutItem>
            ) : <div />}

            <PopoutItem targetId="prompt_1" onAction={onAction} style={{ height: 'auto' }}>
              <IndexCard tilt={TILT.prompt_1} tape="top-left">{profile.prompts?.[1]?.question || "My ideal weekend looks like..."}</IndexCard>
            </PopoutItem>

            {profile.prompts?.[2] && (
              <PopoutItem targetId="prompt_2" onAction={onAction} style={{ gridColumn: 'span 2' }}>
                <IndexCard tilt={TILT.prompt_2} tape="center">{profile.prompts[2].question}</IndexCard>
              </PopoutItem>
            )}

            {profile.photos?.[3] && (
              <PopoutItem targetId="photo_3" onAction={onAction} style={{ gridColumn: 'span 2' }}>
                <MountedPhoto src={profile.photos[3]} alt={`${profile.name}, artifact 4`} tilt={TILT.photo_3} aspect="16 / 9" />
              </PopoutItem>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

/* ==================================================================
   SUB-COMPONENTS & ARCHIVAL MICRO-UI
================================================================== */
const vitalGridItem = { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', backgroundColor: theme.color.surface, borderRadius: '10px', border: `1px solid ${theme.color.border}` };
const vitalText = { fontFamily: theme.font.body, fontSize: '15px', fontWeight: 600, color: theme.color.ink };

const HoldHint = React.memo(({ light }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '14px', backgroundColor: light ? 'rgba(0,0,0,0.6)' : 'rgba(253,251,247,0.95)', border: `1px solid ${light ? 'rgba(255,255,255,0.25)' : 'rgba(139,69,19,0.2)'}`, pointerEvents: 'none' }}>
    <Sparkle size={12} color={light ? '#e6b17a' : theme.color.accent} />
    <span style={{ fontFamily: theme.font.body, fontSize: '10px', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: light ? '#ffffff' : theme.color.accent }}>Press & Hold</span>
  </div>
));

const SectionLabel = React.memo(({ children }) => (
  <p style={{ fontFamily: theme.font.body, fontSize: '13px', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', color: theme.color.accent, margin: '0 0 14px 0', display: 'flex', alignItems: 'center' }}>
    <span aria-hidden="true" style={{ display: 'inline-block', width: '20px', height: '2px', backgroundColor: theme.color.accent, marginRight: '10px', borderRadius: '2px' }} />
    {children}
  </p>
));

const PhotoCorners = React.memo(() => (
  <>
    <span aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0, width: 28, height: 28, background: theme.color.surface, clipPath: 'polygon(0 0, 100% 0, 0 100%)', zIndex: 3 }} />
    <span aria-hidden="true" style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, background: theme.color.surface, clipPath: 'polygon(100% 100%, 0 100%, 100% 0)', zIndex: 3 }} />
  </>
));

const MountedPhoto = React.memo(({ src, alt, tilt, aspect }) => {
  return (
    <div style={{ '--tilt': tilt, transform: 'rotate(var(--tilt, 0deg))', position: 'relative', width: '100%', aspectRatio: aspect || '4 / 5', borderRadius: '8px', border: `8px solid ${theme.color.surface}`, backgroundColor: theme.color.surfaceAlt, overflow: 'hidden', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <img src={src} alt={alt} loading="lazy" decoding="async" onLoad={(e) => { e.currentTarget.style.opacity = 1; }} onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/400x500'; e.currentTarget.style.opacity = 1; }} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0, transition: 'opacity 0.4s ease-out' }} />
      <PhotoCorners />
      <div style={{ position: 'absolute', bottom: '10px', right: '10px', zIndex: 5 }}><HoldHint light /></div>
    </div>
  );
});

const IndexCard = ({ children, tilt, tape = 'center' }) => {
  const getTapeConfig = () => {
    const base = { position: 'absolute', top: '-12px', width: '48px', height: '20px', backgroundColor: 'rgba(224, 216, 200, 0.95)', border: '1px solid rgba(139,69,19,0.2)', zIndex: 5 };
    if (tape === 'top-right') return { ...base, right: '20px', transform: 'rotate(4deg)' };
    if (tape === 'top-left') return { ...base, left: '20px', transform: 'rotate(-4deg)' };
    return { ...base, left: '50%', transform: 'translateX(-50%) rotate(-1deg)' };
  };

  return (
    <div style={{ '--tilt': tilt, transform: 'rotate(var(--tilt, 0deg))', backgroundColor: theme.color.surface, backgroundImage: `linear-gradient(${theme.color.accentFaint} 1px, transparent 1px)`, backgroundSize: '100% 32px', border: `1px solid ${theme.color.border}`, borderRadius: '16px', padding: '28px 24px 24px', minHeight: '170px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <span aria-hidden="true" style={getTapeConfig()} />
      <div style={{ position: 'absolute', bottom: '10px', right: '10px', zIndex: 4 }}><HoldHint /></div>
      <span aria-hidden="true" style={{ fontFamily: theme.font.display, fontSize: '40px', lineHeight: 0.5, opacity: 0.4, marginBottom: '12px', display: 'block', color: theme.color.accent }}>“</span>
      <p style={{ fontFamily: theme.font.display, fontSize: '18px', fontStyle: 'italic', color: theme.color.ink, margin: '0 0 4px 0', lineHeight: 1.5, textAlign: 'center', fontWeight: 600 }}>{children}</p>
    </div>
  );
};

export default ProfileCard;