import React, { useState, useEffect, useRef } from 'react';
import PopoutItem from './PopoutItem';
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
  const heroImgRef = useRef(null);
  const targetScore = Math.min(100, Math.max(0, profile.compatScore || 0));
  
  const [displayScore, setDisplayScore] = useState(0);
  const [sweeping, setSweeping] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [heroLoaded, setHeroLoaded] = useState(false);

  // Compute shared interests for Compatibility Scan
  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem('matchalize_user')) || {}; } catch { return {}; }
  })();
  const sharedInterests = (profile.interests || []).filter(i =>
    (currentUser.interests || []).includes(i)
  );
  // Crash-proof shared intent check (handles both string and array)
  const userIntent = Array.isArray(currentUser.intent) ? currentUser.intent : [currentUser.intent];
  const profileIntent = Array.isArray(profile.intent) ? profile.intent : [profile.intent];
  const sharedIntent = profileIntent.filter(i => userIntent.includes(i));
  const compatMatches = (() => {
    const userAnswers = currentUser.compatAnswers || [];
    const profileAnswers = profile.compatAnswers || [];
    return userAnswers.filter(a =>
      profileAnswers.some(b => b.question === a.question && b.answer === a.answer)
    );
  })();

  useEffect(() => {
    if (heroImgRef.current?.complete) setHeroLoaded(true);
  }, [profile.photos]);

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

  return (
    <div
      style={{
        width: '100%', 
        height: '100%', 
        backgroundColor: theme.color.paper,
        display: 'flex', 
        flexDirection: 'column', 
        position: 'relative',
        // THE BOOK PAGE FIX: Flush left, rounded right.
        borderRadius: '0 24px 24px 0', 
        overflow: 'hidden',
        // Spine shadow on the left edge to simulate the book fold
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
        .bento-box { background: ${theme.color.surfaceAlt}; border: 1px solid ${theme.color.border}; border-radius: 12px; padding: 16px; box-shadow: inset 0 2px 8px rgba(0,0,0,0.02); }
      `}</style>

      {/* LAG-FREE SCROLL AREA */}
      <div 
        ref={scrollRef} 
        className="hide-scroll"
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          WebkitOverflowScrolling: 'touch',
          paddingBottom: '80px', 
          position: 'relative', 
          zIndex: 1,
          willChange: 'scroll-position'
        }}
      >
        
        {/* 1. HERO PHOTO */}
        <div style={{ width: '100%', flexShrink: 0, position: 'relative' }}>
          <div style={{ width: '100%', aspectRatio: '4/5', position: 'relative', backgroundColor: theme.color.surfaceAlt, overflow: 'hidden' }}>
            
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
              
              <div style={{ position: 'absolute', bottom: '40px', left: '20px', right: '20px', zIndex: 2 }}>
                <h2 style={{ fontFamily: theme.font.display, fontSize: '36px', color: '#fff', margin: 0, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                  {profile.name || 'Anonymous'}<span style={{ fontWeight: 400, opacity: 0.85 }}>, {profile.age || '—'}</span>
                </h2>
                <p style={{ fontFamily: theme.font.body, fontSize: '12px', color: 'rgba(255,255,255,0.92)', margin: '8px 0 0 0', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center' }}>
                  {profile.branch || 'General'} <Sparkle size={12} color="#e6b17a" style={{ margin: '0 8px' }} /> Era {profile.year || '20XX'}
                </p>
              </div>
            </div>

            <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
              <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="tactile-btn" style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '8px', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
                <MoreVertical size={20} color="#fff" />
              </button>
              {showProfileMenu && (
                <div style={{ position: 'absolute', top: 48, right: 0, backgroundColor: theme.color.paper, border: `1px solid ${theme.color.border}`, borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.25)', zIndex: 20, minWidth: 150 }}>
                  <button onClick={() => setShowProfileMenu(false)} style={{ display: 'block', width: '100%', padding: '14px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontFamily: theme.font.body, fontSize: '13px', color: theme.color.crimson, fontWeight: 600 }}>Report Profile</button>
                </div>
              )}
            </div>
          </div>
          {/* PERMANENT, LAG-FREE PAPER TEAR */}
          <div aria-hidden="true" style={{ width: '100%', height: '20px', backgroundColor: theme.color.paper, clipPath: TORN_EDGE_CLIP, marginTop: '-12px', position: 'relative', zIndex: 3, filter: 'drop-shadow(0 -2px 2px rgba(0,0,0,0.1))' }} />
        </div>

        <div style={{ padding: '16px 20px 0 20px' }}>
          
          {/* 2. THE EDITORIAL GRID: Vitals & Bio */}
          <div className="bento-box" style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={vitalGridItem}><MapPin size={16} color={theme.color.accent} /> <span style={vitalText}>{profile.hostel || 'Campus'}</span></div>
              <div style={vitalGridItem}><Calendar size={16} color={theme.color.accent} /> <span style={vitalText}>{profile.year || 'Era'}</span></div>
              <div style={vitalGridItem}><Award size={16} color={theme.color.accent} /> <span style={vitalText}>{profile.branch || 'Discipline'}</span></div>
              <div style={vitalGridItem}><Sparkle size={16} color={theme.color.accent} /> <span style={vitalText}>{profile.pronouns || 'Identity'}</span></div>
            </div>
            
            {profile.bio && (
              <div style={{ borderTop: `1px solid ${theme.color.border}`, paddingTop: '16px' }}>
                <SectionLabel>Foreword</SectionLabel>
                <p style={{ fontFamily: theme.font.typewriter, fontSize: '15px', color: theme.color.ink, lineHeight: 1.5, margin: 0, fontWeight: 600 }}>"{profile.bio}"</p>
              </div>
            )}
          </div>

          {/* 3. COMPATIBILITY SCAN */}
          <PopoutItem targetId="compatibility" onAction={onAction} type="compatibility">
            <div style={{ backgroundColor: theme.color.surface, border: `1px solid ${theme.color.border}`, borderRadius: '16px', padding: '20px', marginBottom: '24px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
              <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 50%, rgba(139,69,19,0.04) 0%, transparent 60%)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', zIndex: 2 }}>
                <span style={{ fontFamily: theme.font.display, fontSize: '14px', fontWeight: 700, color: theme.color.accent }}>Compatibility Scan</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 2, position: 'relative' }}>
                {sharedInterests.length > 0 && (
                  <li style={{ fontSize: '13px', color: theme.color.ink, display: 'flex', alignItems: 'flex-start', gap: '8px', fontFamily: theme.font.body }}>
                    <span style={{ color: theme.color.accent, fontWeight: 700 }}>•</span>
                    <span>You both love {sharedInterests.join(' and ')}.</span>
                  </li>
                )}
                {sharedIntent.length > 0 && (
                  <li style={{ fontSize: '13px', color: theme.color.ink, display: 'flex', alignItems: 'flex-start', gap: '8px', fontFamily: theme.font.body }}>
                    <span style={{ color: theme.color.accent, fontWeight: 700 }}>•</span>
                    <span>You are both looking for {sharedIntent.join(' and ')}.</span>
                  </li>
                )}
                {compatMatches.length > 0 && (
                  <li style={{ fontSize: '13px', color: theme.color.ink, display: 'flex', alignItems: 'flex-start', gap: '8px', fontFamily: theme.font.body }}>
                    <span style={{ color: theme.color.accent, fontWeight: 700 }}>•</span>
                    <span>You both chose "{compatMatches[0].answer}" for "{compatMatches[0].question}".</span>
                  </li>
                )}
                {sharedInterests.length === 0 && sharedIntent.length === 0 && compatMatches.length === 0 && (
                  <li style={{ fontSize: '13px', color: theme.color.inkMuted, display: 'flex', alignItems: 'flex-start', gap: '8px', fontFamily: theme.font.body, fontStyle: 'italic' }}>
                    <span>•</span>
                    <span>Discover something new about each other.</span>
                  </li>
                )}
              </ul>
              <p style={{ marginTop: '16px', fontSize: '11px', color: theme.color.inkMuted, fontStyle: 'italic', textAlign: 'center', lineHeight: '1.4', fontFamily: theme.font.body, zIndex: 2, position: 'relative' }}>
                Algorithms map shared interests, but the spark is yours to discover.
              </p>
              <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 3 }}><HoldHint /></div>
            </div>
          </PopoutItem>

          {/* 4. SEEKING INTENT & CURIOSITIES */}
          <div className="bento-box" style={{ marginBottom: '32px' }}>
             <SectionLabel>Seeking Parameters</SectionLabel>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {(profile.intent && profile.intent.length > 0 ? profile.intent : ['Connection']).map((item, i) => (
                    <span key={i} style={{ padding: '8px 14px', border: `1.5px solid ${theme.color.crimson}`, borderRadius: '8px', backgroundColor: 'rgba(139,26,26,0.05)', color: theme.color.crimson, fontFamily: theme.font.body, fontSize: '12px', fontWeight: 800, textTransform: 'uppercase' }}>{item}</span>
                  ))}
                </div>
                {profile.interests && profile.interests.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', borderTop: `1px dashed ${theme.color.border}`, paddingTop: '16px' }}>
                    {profile.interests.map((interest, i) => (
                      <span key={i} style={{ padding: '8px 12px', border: `1px solid ${theme.color.border}`, borderRadius: '8px', backgroundColor: theme.color.surface, color: theme.color.inkSoft, fontFamily: theme.font.typewriter, fontSize: '13px', fontWeight: 600 }}>{interest}</span>
                    ))}
                  </div>
                )}
             </div>
          </div>

          {/* 5. BENTO GRID (Photos & Whispers via PopoutItem for Letter/Flower Sending) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 12px', marginBottom: '24px', alignItems: 'center' }}>
            
            <PopoutItem targetId="prompt_0" onAction={onAction} style={{ height: 'auto' }}>
              <IndexCard tilt={TILT.prompt_0} tape="top-right">{profile.prompts?.[0]?.question || "A shower thought I recently had..."}</IndexCard>
            </PopoutItem>

            {profile.photos?.[1] ? (
              <PopoutItem targetId="photo_1" onAction={onAction}>
                <MountedPhoto src={profile.photos[1]} alt={`${profile.name}, artifact 2`} tilt={TILT.photo_1} />
              </PopoutItem>
            ) : <div />}

            {profile.photos?.[2] ? (
              <PopoutItem targetId="photo_2" onAction={onAction}>
                <MountedPhoto src={profile.photos[2]} alt={`${profile.name}, artifact 3`} tilt={TILT.photo_2} />
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
const vitalGridItem = { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', backgroundColor: theme.color.surface, borderRadius: '8px', border: `1px solid ${theme.color.border}` };
const vitalText = { fontFamily: theme.font.body, fontSize: '13px', fontWeight: 600, color: theme.color.ink };

const HoldHint = React.memo(({ light }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 10px', borderRadius: '12px', backgroundColor: light ? 'rgba(0,0,0,0.55)' : 'rgba(253,251,247,0.95)', border: `1px solid ${light ? 'rgba(255,255,255,0.25)' : 'rgba(139,69,19,0.2)'}`, pointerEvents: 'none' }}>
    <Sparkle size={10} color={light ? '#e6b17a' : theme.color.accent} />
    <span style={{ fontFamily: theme.font.body, fontSize: '9px', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: light ? '#ffffff' : theme.color.accent }}>Press & Hold</span>
  </div>
));

const SectionLabel = React.memo(({ children }) => (
  <p style={{ fontFamily: theme.font.body, fontSize: '11px', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', color: theme.color.accent, margin: '0 0 12px 0', display: 'flex', alignItems: 'center' }}>
    <span aria-hidden="true" style={{ display: 'inline-block', width: '16px', height: '2px', backgroundColor: theme.color.accent, marginRight: '8px', borderRadius: '2px' }} />
    {children}
  </p>
));

const PhotoCorners = React.memo(() => (
  <>
    <span aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0, width: 24, height: 24, background: theme.color.surface, clipPath: 'polygon(0 0, 100% 0, 0 100%)', zIndex: 3 }} />
    <span aria-hidden="true" style={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, background: theme.color.surface, clipPath: 'polygon(100% 100%, 0 100%, 100% 0)', zIndex: 3 }} />
  </>
));

const MountedPhoto = React.memo(({ src, alt, tilt, aspect }) => {
  return (
    <div style={{ '--tilt': tilt, transform: 'rotate(var(--tilt, 0deg))', position: 'relative', width: '100%', aspectRatio: aspect || '4 / 5', borderRadius: '6px', border: `6px solid ${theme.color.surface}`, backgroundColor: theme.color.surfaceAlt, overflow: 'hidden', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <img src={src} alt={alt} loading="lazy" decoding="async" onLoad={(e) => { e.currentTarget.style.opacity = 1; }} onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/400x500'; e.currentTarget.style.opacity = 1; }} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0, transition: 'opacity 0.4s ease-out' }} />
      <PhotoCorners />
      <div style={{ position: 'absolute', bottom: '8px', right: '8px', zIndex: 5 }}><HoldHint light /></div>
    </div>
  );
});

const IndexCard = ({ children, tilt, tape = 'center' }) => {
  const getTapeConfig = () => {
    const base = { position: 'absolute', top: '-10px', width: '40px', height: '18px', backgroundColor: 'rgba(224, 216, 200, 0.95)', border: '1px solid rgba(139,69,19,0.2)', zIndex: 5 };
    if (tape === 'top-right') return { ...base, right: '16px', transform: 'rotate(4deg)' };
    if (tape === 'top-left') return { ...base, left: '16px', transform: 'rotate(-4deg)' };
    return { ...base, left: '50%', transform: 'translateX(-50%) rotate(-1deg)' };
  };

  return (
    <div style={{ '--tilt': tilt, transform: 'rotate(var(--tilt, 0deg))', backgroundColor: theme.color.surface, backgroundImage: `linear-gradient(${theme.color.accentFaint} 1px, transparent 1px)`, backgroundSize: '100% 28px', border: `1px solid ${theme.color.border}`, borderRadius: '12px', padding: '24px 20px 20px', minHeight: '150px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
      <span aria-hidden="true" style={getTapeConfig()} />
      <div style={{ position: 'absolute', bottom: '8px', right: '8px', zIndex: 4 }}><HoldHint /></div>
      <span aria-hidden="true" style={{ fontFamily: theme.font.display, fontSize: '32px', lineHeight: 0.5, opacity: 0.4, marginBottom: '8px', display: 'block', color: theme.color.accent }}>“</span>
      <p style={{ fontFamily: theme.font.display, fontSize: '16px', fontStyle: 'italic', color: theme.color.ink, margin: '0 0 4px 0', lineHeight: 1.45, textAlign: 'center', fontWeight: 600 }}>{children}</p>
    </div>
  );
};

export default ProfileCard;