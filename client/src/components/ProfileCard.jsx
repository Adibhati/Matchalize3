import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion, useMotionValue, useTransform, animate } from 'framer-motion';
import PopoutItem from './PopoutItem';
import ReportModal from './chat/ReportModal';
import { theme as design } from '../utils/theme';
import { triggerHaptic } from '../utils/haptics';
import { toast } from '../utils/toast';
import { Sparkle, MapPin, MoreVertical, Award, Calendar, Flag } from 'lucide-react';

const theme = {
  color: {
    paper: '#fdfbf7',
    surface: '#ffffff',
    surfaceAlt: '#f4f1ea', 
    ink: '#1a1a1a',
    inkSoft: '#4a4a4a',
    inkMuted: '#8c8275',
    accent: '#8b4513',
    crimson: '#8b1a1a',
  },
  font: {
    display: "'Playfair Display', Georgia, serif",
    body: "'Inter', -apple-system, sans-serif",
    typewriter: "'Special Elite', 'Courier New', monospace",
  },
};

const OVERSCROLL_THRESHOLD = 110;

function matchStatus(score) {
  if (score >= 85) return 'Exceptional Match';
  if (score >= 65) return 'High Compatibility';
  if (score >= 40) return 'Potential Resonance';
  return 'Exploratory';
}

const InkPullIndicator = ({ dragY, profileId }) => {
  const filterId = `rough-ink-${profileId || 'default'}`;
  const progressRaw = useTransform(dragY, [-OVERSCROLL_THRESHOLD, 0, OVERSCROLL_THRESHOLD], [1, 0, 1]);
  const progress = useTransform(progressRaw, (val) => Math.min(Math.max(val, 0), 1));
  const isTopPull = useTransform(dragY, (y) => y > 0);
  const opacity = useTransform(progressRaw, [0.1, 0.4], [0, 1]);
  const rotation = useTransform(isTopPull, (isTop) => isTop ? 180 : 0);
  const yOffset = useTransform(dragY, (y) => {
    if (y > 0) return Math.min(y * 0.4, 40); 
    if (y < 0) return Math.max(y * 0.4, -40); 
    return 0;
  });

  const topAnchor = useTransform(dragY, (y) => (y > 0 ? 0 : 'auto'));
  const bottomAnchor = useTransform(dragY, (y) => (y > 0 ? 'auto' : 0));

  return (
    <motion.div style={{ position: 'absolute', left: 0, right: 0, top: topAnchor, bottom: bottomAnchor, height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 50, opacity, y: yOffset }}>
      <div className="neu-pill" style={{ position: 'relative', width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
        <svg width="64" height="64" viewBox="0 0 64 64" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
          <motion.circle cx="32" cy="32" r="28" fill="none" stroke={theme.color.crimson} strokeWidth="3.5" strokeLinecap="round" pathLength={progress} />
        </svg>
        <motion.div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', rotate: rotation }}>
          <motion.svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={theme.color.crimson} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: useTransform(progress, [0, 0.5], [0.3, 1]), scale: useTransform(progress, [0, 1], [0.8, 1]) }}>
            <path d="M12 19V5M5 12l7-7 7 7" />
          </motion.svg>
        </motion.div>
      </div>
    </motion.div>
  );
};

const ProfileCard = ({ profile = {}, scrollRef: externalScrollRef, onAction, onNavigate }) => {
  const localScrollRef = useRef(null);
  const scrollContainer = externalScrollRef || localScrollRef;
  const heroImgRef = useRef(null);
  
  const targetScore = Math.min(100, Math.max(0, profile.compatScore || 0));
  const [displayScore, setDisplayScore] = useState(0);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [heroLoaded, setHeroLoaded] = useState(false);

  const dragY = useMotionValue(0);
  const touchStartY = useRef(0);
  const isAtBoundary = useRef(false);
  const boundaryType = useRef(null); 

  const currentUser = (() => { try { return JSON.parse(localStorage.getItem('matchalize_user')) || {}; } catch { return {}; }})();
  const sharedInterests = (profile.interests || []).filter(i => (currentUser.interests || []).includes(i));
  const userIntent = Array.isArray(currentUser.intent) ? currentUser.intent : [currentUser.intent];
  const profileIntent = Array.isArray(profile.intent) ? profile.intent : [profile.intent];
  const sharedIntent = profileIntent.filter(i => userIntent.includes(i));
  const compatMatches = (() => {
    const userAnswers = currentUser.compatAnswers || [];
    const profileAnswers = profile.compatAnswers || [];
    return userAnswers.filter(a => profileAnswers.some(b => b.question === a.question && b.answer === a.answer));
  })();

  useEffect(() => { if (heroImgRef.current?.complete) setHeroLoaded(true); }, [profile.photos]);

  useEffect(() => {
    let startTimestamp = null;
    let animationFrameId = null;
    const duration = 1600; 
    const startScore = displayScore;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 4); 
      setDisplayScore(Math.round(startScore + (targetScore - startScore) * easeProgress));
      if (progress < 1) animationFrameId = window.requestAnimationFrame(step);
    };
    const timer = setTimeout(() => { animationFrameId = window.requestAnimationFrame(step); }, 300);
    return () => { clearTimeout(timer); if (animationFrameId) window.cancelAnimationFrame(animationFrameId); };
  }, [targetScore]);

  const handleTouchStart = (e) => {
    if (!scrollContainer.current) return;
    touchStartY.current = e.touches[0].clientY;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainer.current;
    
    if (scrollTop <= 0) { isAtBoundary.current = true; boundaryType.current = 'top'; } 
    else if (Math.ceil(scrollTop + clientHeight) >= scrollHeight - 1) { isAtBoundary.current = true; boundaryType.current = 'bottom'; } 
    else { isAtBoundary.current = false; boundaryType.current = null; }
  };

  const handleTouchMove = (e) => {
    if (!isAtBoundary.current) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartY.current;
    if (boundaryType.current === 'top' && deltaY > 0) { dragY.set(deltaY); } 
    else if (boundaryType.current === 'bottom' && deltaY < 0) { dragY.set(deltaY); }
  };

  const handleTouchEnd = () => {
    const currentDrag = dragY.get();
    if (Math.abs(currentDrag) >= OVERSCROLL_THRESHOLD) {
      triggerHaptic('heavy');
      if (onNavigate) {
        const direction = currentDrag > 0 ? 'down' : 'up';
        onNavigate(direction, false);
      }
    }
    animate(dragY, 0, { type: 'spring', stiffness: 400, damping: 25 });
    isAtBoundary.current = false;
    boundaryType.current = null;
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      
      <style>{`
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; overscroll-behavior-y: none; }
        .tactile-btn { transition: transform 0.15s ease-out; will-change: transform; }
        .tactile-btn:active { transform: scale(0.96) !important; }
        
        /* PURE NEUMORPHISM CLASSES */
        .neu-flat {
          background: ${theme.color.surfaceAlt};
          border-radius: 20px;
          box-shadow: 8px 8px 16px #dedad2, -8px -8px 16px #ffffff;
          border: none;
        }
        .neu-pressed {
          background: ${theme.color.surfaceAlt};
          border-radius: 12px;
          box-shadow: inset 6px 6px 12px #dedad2, inset -6px -6px 12px #ffffff;
          border: none;
        }
        .neu-pill {
          background: ${theme.color.surfaceAlt};
          border-radius: 50px;
          box-shadow: 4px 4px 8px #dedad2, -4px -4px 8px #ffffff;
          border: none;
          color: ${theme.color.crimson};
        }
      `}</style>

      <InkPullIndicator dragY={dragY} profileId={profile._id} />

      {/* 
        THE INVISIBLE SCROLLING VIEWPORT 
        Padding creates the "gap" around the card. As you scroll, the card visually slides UP through the padding.
      */}
      <div 
        ref={scrollContainer} 
        className="hide-scroll"
        onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
        style={{ 
          width: '100%', height: '100%', 
          overflowY: 'auto', WebkitOverflowScrolling: 'touch', 
          position: 'relative', zIndex: 1, 
          padding: '16px 12px 40px 12px', // Top gap, side gaps, bottom gap
          willChange: 'scroll-position' 
        }}
      >
        {/* 
          THE PHYSICAL CARDBOARD ENTITY 
          It has 24px borders permanently. It scrolls UP as a single unit. 
        */}
        <div style={{
          width: '100%',
          backgroundColor: theme.color.surfaceAlt, 
          display: 'flex', flexDirection: 'column', position: 'relative',
          borderRadius: '24px', 
          overflow: 'hidden', // Clips everything to the 24px corners
          boxShadow: '0 24px 60px rgba(0,0,0,0.2), 0 8px 16px rgba(139,69,19,0.1)', // Heavy floating shadow
          border: '1px solid rgba(255,255,255,0.6)', 
        }}>
          
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: `url("${design.texture.grain}")`, mixBlendMode: 'multiply', pointerEvents: 'none', zIndex: 15 }} />

          {/* 1. HERO PHOTO */}
          {/* using dvh minus standard navbar height approx (130px) so it sits flush above your bottom nav */}
          <div style={{ width: '100%', height: 'calc(100dvh - 130px)', flexShrink: 0, position: 'relative', backgroundColor: '#000' }}>
            
            <img ref={heroImgRef} src={profile.photos?.[0] || 'https://via.placeholder.com/600x800'} alt={profile.name} onLoad={() => setHeroLoaded(true)} decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: heroLoaded ? 1 : 0, transition: 'opacity 0.4s ease-out' }} />
            
            <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,12,10,0.95) 0%, rgba(15,12,10,0.4) 40%, transparent 100%)', pointerEvents: 'none' }} />
            
            <div style={{ position: 'absolute', bottom: '32px', left: '24px', right: '24px', zIndex: 2 }}>
              <h2 style={{ fontFamily: theme.font.display, fontSize: '36px', color: '#fff', margin: 0, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{profile.name || 'Anonymous'}<span style={{ fontWeight: 400, opacity: 0.85 }}>, {profile.age || '—'}</span></h2>
              <p style={{ fontFamily: theme.font.body, fontSize: '12px', color: 'rgba(255,255,255,0.92)', margin: '8px 0 0 0', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center' }}>{profile.branch || 'General'} <Sparkle size={12} color="#e6b17a" style={{ margin: '0 8px' }} /> Era {profile.year || '20XX'}</p>
            </div>
            
            <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
              <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="tactile-btn neu-pill" style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.color.ink }}><MoreVertical size={20} /></button>
              {showProfileMenu && (
                <div className="neu-flat" style={{ position: 'absolute', top: 52, right: 0, zIndex: 20, minWidth: 160, padding: '8px' }}>
                  <button onClick={() => { triggerHaptic('light'); setShowProfileMenu(false); setShowReport(true); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 12px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontFamily: theme.font.body, fontSize: '13px', color: theme.color.crimson, fontWeight: 700 }}><Flag size={14} /> Report Profile</button>
                </div>
              )}
            </div>
          </div>

          <div style={{ padding: '24px', paddingBottom: '40px' }}>
            
            {/* 2. THE EDITORIAL GRID: Vitals & Bio */}
            <div className="neu-flat" style={{ marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="neu-pressed" style={vitalGridItem}><MapPin size={16} color={theme.color.accent} /> <span style={vitalText}>{profile.hostel || 'Campus'}</span></div>
                <div className="neu-pressed" style={vitalGridItem}><Calendar size={16} color={theme.color.accent} /> <span style={vitalText}>{profile.year || 'Era'}</span></div>
                <div className="neu-pressed" style={vitalGridItem}><Award size={16} color={theme.color.accent} /> <span style={vitalText}>{profile.branch || 'Discipline'}</span></div>
                <div className="neu-pressed" style={vitalGridItem}><Sparkle size={16} color={theme.color.accent} /> <span style={vitalText}>{profile.pronouns || 'Identity'}</span></div>
              </div>
              {profile.bio && (
                <div style={{ paddingTop: '8px' }}>
                  <SectionLabel>Foreword</SectionLabel>
                  <p style={{ fontFamily: theme.font.typewriter, fontSize: '15px', color: theme.color.ink, lineHeight: 1.5, margin: 0, fontWeight: 600 }}>"{profile.bio}"</p>
                </div>
              )}
            </div>

            {/* 3. COMPATIBILITY SCAN */}
            <PopoutItem targetId="compatibility" onAction={onAction} type="compatibility" compatScore={targetScore}>
              <div className="neu-flat" style={{ padding: '24px', marginBottom: '32px', cursor: 'pointer', position: 'relative' }}>
                <SectionLabel>Alignment Scan</SectionLabel>
                
                {targetScore > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <ScoreGauge score={displayScore} status={matchStatus(targetScore)} />
                  </div>
                )}
                
                <div className="neu-pressed" style={{ padding: '16px', borderRadius: '12px' }}>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {sharedInterests.length > 0 && (
                      <li style={{ fontSize: '13px', color: theme.color.inkSoft, display: 'flex', alignItems: 'flex-start', gap: '8px', fontFamily: theme.font.body }}><span style={{ color: theme.color.crimson, fontWeight: 700 }}>•</span><span>You both love {sharedInterests.join(' and ')}.</span></li>
                    )}
                    {sharedIntent.length > 0 && (
                      <li style={{ fontSize: '13px', color: theme.color.inkSoft, display: 'flex', alignItems: 'flex-start', gap: '8px', fontFamily: theme.font.body }}><span style={{ color: theme.color.crimson, fontWeight: 700 }}>•</span><span>You are both looking for {sharedIntent.join(' and ')}.</span></li>
                    )}
                    {compatMatches.length > 0 && (
                      <li style={{ fontSize: '13px', color: theme.color.inkSoft, display: 'flex', alignItems: 'flex-start', gap: '8px', fontFamily: theme.font.body }}><span style={{ color: theme.color.crimson, fontWeight: 700 }}>•</span><span>You both chose "{compatMatches[0].answer}" for "{compatMatches[0].question}".</span></li>
                    )}
                    {sharedInterests.length === 0 && sharedIntent.length === 0 && compatMatches.length === 0 && (
                      <li style={{ fontSize: '13px', color: theme.color.inkMuted, display: 'flex', alignItems: 'flex-start', gap: '8px', fontFamily: theme.font.body, fontStyle: 'italic' }}><span>•</span><span>Discover something new about each other.</span></li>
                    )}
                  </ul>
                </div>
                
                <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 3 }}><HoldHint /></div>
              </div>
            </PopoutItem>

            {/* 4. SEEKING INTENT & CURIOSITIES */}
            <div className="neu-flat" style={{ marginBottom: '32px', padding: '24px' }}>
               <SectionLabel>Seeking Parameters</SectionLabel>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {(profile.intent && profile.intent.length > 0 ? profile.intent : ['Connection']).map((item, i) => (
                      <span key={i} className="neu-pill" style={{ padding: '10px 16px', fontFamily: theme.font.body, fontSize: '12px', fontWeight: 800, textTransform: 'uppercase' }}>{item}</span>
                    ))}
                  </div>
                  {profile.interests && profile.interests.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                      {profile.interests.map((interest, i) => (
                        <span key={i} className="neu-pressed" style={{ padding: '10px 14px', color: theme.color.inkSoft, fontFamily: theme.font.typewriter, fontSize: '13px', fontWeight: 600 }}>{interest}</span>
                      ))}
                    </div>
                  )}
               </div>
            </div>

            {/* 5. BENTO GRID (Pure Photos & Prompts) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px 16px', marginBottom: '24px', alignItems: 'center' }}>
              <PopoutItem targetId="prompt_0" onAction={onAction} style={{ height: 'auto' }}><IndexCard>{profile.prompts?.[0]?.question || "A shower thought I recently had..."}</IndexCard></PopoutItem>
              
              {profile.photos?.[1] ? <PopoutItem targetId="photo_1" onAction={onAction}><MountedPhoto src={profile.photos[1]} alt="artifact 2" aspect="1 / 1" /></PopoutItem> : <div />}
              {profile.photos?.[2] ? <PopoutItem targetId="photo_2" onAction={onAction}><MountedPhoto src={profile.photos[2]} alt="artifact 3" aspect="1 / 1" /></PopoutItem> : <div />}
              
              <PopoutItem targetId="prompt_1" onAction={onAction} style={{ height: 'auto' }}><IndexCard>{profile.prompts?.[1]?.question || "My ideal weekend looks like..."}</IndexCard></PopoutItem>
              {profile.prompts?.[2] && <PopoutItem targetId="prompt_2" onAction={onAction} style={{ gridColumn: 'span 2' }}><IndexCard>{profile.prompts[2].question}</IndexCard></PopoutItem>}
              {profile.photos?.[3] && <PopoutItem targetId="photo_3" onAction={onAction} style={{ gridColumn: 'span 2' }}><MountedPhoto src={profile.photos[3]} alt="artifact 4" aspect="16 / 9" /></PopoutItem>}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showReport && profile._id && <ReportModal reportedUserId={profile._id} onClose={() => setShowReport(false)} onReported={() => { setShowReport(false); toast.success('Report submitted.'); }} />}
      </AnimatePresence>
    </div>
  );
};

/* ==================================================================
   SUB-COMPONENTS
================================================================== */
const ScoreGauge = ({ score, status }) => {
  const radius = 34; const stroke = 6; const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 85 ? theme.color.crimson : score >= 65 ? theme.color.accent : theme.color.inkMuted;
  
  const gauge = (
    <div style={{ position: 'relative', width: '80px', height: '80px', flexShrink: 0 }}>
      <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="40" cy="40" r={radius} fill="none" stroke="rgba(139,69,19,0.1)" strokeWidth={stroke} />
        <circle cx="40" cy="40" r={radius} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)', stroke: color }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}><span style={{ fontFamily: theme.font.body, fontSize: '22px', fontWeight: 900, color: theme.color.ink, lineHeight: 1 }}>{score}</span><span style={{ fontFamily: theme.font.body, fontSize: '8px', fontWeight: 700, color: theme.color.inkMuted, letterSpacing: '1px', textTransform: 'uppercase', marginTop: '1px' }}>%</span></div>
    </div>
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      {gauge}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}><span style={{ fontFamily: theme.font.display, fontSize: '15px', fontWeight: 700, color: theme.color.ink }}>{status}</span><span style={{ fontFamily: theme.font.body, fontSize: '11px', color: theme.color.inkMuted, lineHeight: 1.4 }}>Based on 7 compatibility metrics</span></div>
    </div>
  );
};

const vitalGridItem = { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px' };
const vitalText = { fontFamily: theme.font.body, fontSize: '13px', fontWeight: 600, color: theme.color.inkSoft };

const HoldHint = React.memo(() => (
  <div className="neu-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 10px', pointerEvents: 'none', color: theme.color.inkMuted }}><Sparkle size={10} color={theme.color.inkMuted} /><span style={{ fontFamily: theme.font.body, fontSize: '9px', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>Hold</span></div>
));

const SectionLabel = React.memo(({ children }) => (
  <p style={{ fontFamily: theme.font.body, fontSize: '11px', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', color: theme.color.inkMuted, margin: '0 0 16px 0', display: 'flex', alignItems: 'center' }}>{children}</p>
));

/* Pure photo, no background boxes, just a drop shadow and corner radius */
const MountedPhoto = React.memo(({ src, alt, aspect, ...rest }) => (
  <div {...rest} style={{ position: 'relative', width: '100%', aspectRatio: aspect || '4 / 5', cursor: 'pointer', zIndex: 1, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 6px 16px rgba(0,0,0,0.15)' }}>
    <img src={src} alt={alt} loading="lazy" decoding="async" onLoad={(e) => { e.currentTarget.style.opacity = 1; }} onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/400x500'; e.currentTarget.style.opacity = 1; }} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0, transition: 'opacity 0.4s ease-out' }} />
    <div style={{ position: 'absolute', bottom: '12px', right: '12px', zIndex: 5 }}><HoldHint /></div>
  </div>
));

const IndexCard = ({ children, ...rest }) => {
  return (
    <div {...rest} style={{ position: 'relative', width: '100%', cursor: 'pointer', zIndex: 1 }}>
      <div className="neu-flat" style={{ padding: '32px 24px 24px', minHeight: '160px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', bottom: '12px', right: '12px', zIndex: 4 }}><HoldHint /></div>
        <span aria-hidden="true" style={{ fontFamily: theme.font.display, fontSize: '32px', lineHeight: 0.5, opacity: 0.2, marginBottom: '12px', display: 'block', color: theme.color.ink }}>"</span>
        <p style={{ fontFamily: theme.font.display, fontSize: '16px', fontStyle: 'italic', color: theme.color.inkSoft, margin: '0 0 4px 0', lineHeight: 1.5, textAlign: 'center', fontWeight: 600 }}>{children}</p>
      </div>
    </div>
  );
};

export default ProfileCard;