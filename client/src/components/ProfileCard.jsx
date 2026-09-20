import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion, useMotionValue, useTransform, animate } from 'framer-motion';
import PopoutItem from './PopoutItem';
import ReportModal from './chat/ReportModal';
import { theme as design } from '../utils/theme';
import { triggerHaptic } from '../utils/haptics';
import { toast } from '../utils/toast';
import { Sparkle, MapPin, MoreVertical, Award, Calendar, Flag, Paperclip, Sliders, Star, X, ArrowDown } from 'lucide-react';

const theme = {
  color: {
    paper: '#fdfbf7',
    card: '#fffdf8',
    surfaceAlt: '#f4f1ea',
    lineDark: '#d4c5a9',
    ink: '#1a1a1a',
    inkSoft: '#4a4a4a',
    inkMuted: '#8c8275',
    accent: '#8b4513',
    crimson: '#8b1a1a',
    gold: '#e6b17a',
  },
  font: {
    display: design?.font?.heading || "'Playfair Display', Georgia, serif",
    body: design?.font?.body || "'Inter', -apple-system, sans-serif",
    typewriter: "'Special Elite', 'Courier New', monospace",
  },
};

const OVERSCROLL_THRESHOLD = 110;

/* One deliberate alternating system, capped at 1.2°. Wide items stay straight. */
const TILTS = { prompt_0: '0.8deg', photo_1: '-1.2deg', photo_2: '1.2deg', prompt_1: '-0.8deg', prompt_2: '0deg', photo_3: '0deg' };

function matchStatus(score) {
  if (score >= 85) return 'Exceptional Match';
  if (score >= 65) return 'High Compatibility';
  if (score >= 40) return 'Potential Resonance';
  return 'Exploratory';
}

/* ============================================================
   PULL INDICATOR — capsule that stretches with drag.
   Cross = dismiss to NEXT profile. Arrow = go to PREVIOUS.
   Icon rides a physical token inside the track.
============================================================ */
const TRACK_W = 40;
const TOKEN = 26;

const InkPullIndicator = ({ dragY }) => {
  const progressRaw = useTransform(dragY, [-OVERSCROLL_THRESHOLD, 0, OVERSCROLL_THRESHOLD], [1, 0, 1]);
  const progress = useTransform(progressRaw, (val) => Math.min(Math.max(val, 0), 1));
  const isTopPull = useTransform(dragY, (y) => y > 0);
  const zoneOpacity = useTransform(progressRaw, [0.08, 0.3], [0, 1]);
  const topVariantOpacity = useTransform(isTopPull, (t) => (t ? 1 : 0));
  const bottomVariantOpacity = useTransform(isTopPull, (t) => (t ? 0 : 1));

  const stretch = useTransform(dragY, (y) => 56 + Math.min(Math.abs(y), 150) * 0.6);
  const borderColor = useTransform(progress, [0, 0.88, 1], ['rgba(212,197,169,0.9)', 'rgba(212,197,169,0.9)', theme.color.crimson]);

  const travelNext = useTransform(dragY, (y) => {
    const a = Math.max(0, -y);
    const p = Math.min(a / OVERSCROLL_THRESHOLD, 1);
    const h = 56 + Math.min(a, 150) * 0.6;
    return (h - TOKEN - 12) * (1 - p);
  });
  const travelPrev = useTransform(dragY, (y) => {
    const a = Math.max(0, y);
    const p = Math.min(a / OVERSCROLL_THRESHOLD, 1);
    const h = 56 + Math.min(a, 150) * 0.6;
    return 6 + (h - TOKEN - 12) * p;
  });

  const thumbScale = useTransform(progress, [0.85, 1], [1, 1.18]);
  const armedOpacity = useTransform(progress, [0.9, 1], [0, 1]);
  const defaultLabelOpacity = useTransform(progress, [0.88, 1], [1, 0]);

  const labelPill = {
    display: 'inline-flex', alignItems: 'center', padding: '6px 13px', borderRadius: 999,
    backgroundColor: 'rgba(253,251,247,0.94)', border: '1px solid rgba(212,197,169,0.9)',
    boxShadow: '0 4px 12px rgba(88,63,30,0.18)',
    fontFamily: theme.font.body, fontSize: 8.5, fontWeight: 900, letterSpacing: '1.8px', textTransform: 'uppercase', whiteSpace: 'nowrap',
  };

  const tokenStyle = {
    width: TOKEN, height: TOKEN, borderRadius: TOKEN / 2,
    backgroundColor: theme.color.surfaceAlt,
    border: '1px solid rgba(212,197,169,0.9)',
    boxShadow: '0 2px 6px rgba(88,63,30,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };

  return (
    <motion.div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 60, opacity: zoneOpacity }}>

      {/* BOTTOM — cross = dismiss this profile, move to the next */}
      <motion.div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 'max(16px, env(safe-area-inset-bottom))', opacity: bottomVariantOpacity }}>
        <motion.div style={{ width: TRACK_W, height: stretch, borderRadius: TRACK_W / 2, backgroundColor: theme.color.paper, border: '1.5px solid', borderColor, boxShadow: '0 10px 26px rgba(88,63,30,0.3)', position: 'relative', display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>
          <motion.div style={{ position: 'absolute', top: travelNext, scale: thumbScale }}>
            <div style={tokenStyle}>
              <X size={13} strokeWidth={3} color={theme.color.crimson} />
            </div>
          </motion.div>
        </motion.div>
        <div style={{ position: 'relative', marginTop: 12, height: 28, display: 'flex', justifyContent: 'center' }}>
          <motion.span style={{ position: 'absolute', opacity: defaultLabelOpacity }}>
            <span style={{ ...labelPill, color: theme.color.inkMuted }}>Pull up · next profile</span>
          </motion.span>
          <motion.span style={{ position: 'absolute', opacity: armedOpacity }}>
            <span style={{ ...labelPill, color: theme.color.crimson, borderColor: theme.color.crimson }}>Release</span>
          </motion.span>
        </div>
      </motion.div>

      {/* TOP — arrow = go back to the previous profile */}
      <motion.div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 'max(16px, env(safe-area-inset-top))', opacity: topVariantOpacity }}>
        <div style={{ position: 'relative', marginBottom: 12, height: 28, display: 'flex', justifyContent: 'center' }}>
          <motion.span style={{ position: 'absolute', opacity: defaultLabelOpacity }}>
            <span style={{ ...labelPill, color: theme.color.inkMuted }}>Pull down · previous profile</span>
          </motion.span>
          <motion.span style={{ position: 'absolute', opacity: armedOpacity }}>
            <span style={{ ...labelPill, color: theme.color.crimson, borderColor: theme.color.crimson }}>Release</span>
          </motion.span>
        </div>
        <motion.div style={{ width: TRACK_W, height: stretch, borderRadius: TRACK_W / 2, backgroundColor: theme.color.paper, border: '1.5px solid', borderColor, boxShadow: '0 10px 26px rgba(88,63,30,0.3)', position: 'relative', display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>
          <motion.div style={{ position: 'absolute', top: travelPrev, scale: thumbScale }}>
            <div style={tokenStyle}>
              <ArrowDown size={14} strokeWidth={3} color={theme.color.crimson} />
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

/* ---------------- Floating paper panel ---------------- */
const Panel = ({ children, style }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.15 }}
    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    style={{
      backgroundColor: theme.color.paper,
      border: '1px solid rgba(212,197,169,0.7)',
      borderRadius: 18,
      boxShadow: '0 14px 34px rgba(88,63,30,0.16), 0 3px 8px rgba(88,63,30,0.08)',
      position: 'relative',
      ...style,
    }}
  >
    {children}
  </motion.div>
);

const Reveal = ({ children, style }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.15 }}
    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    style={style}
  >
    {children}
  </motion.div>
);

/* ---------------- Small shared pieces ---------------- */
/* Panel headings — same treatment as the vitals field labels. One system. */
const PanelHeader = ({ icon: Icon, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
    <Icon size={12} color={theme.color.accent} />
    <span style={{ fontFamily: theme.font.body, fontSize: 9.5, fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', color: theme.color.inkMuted }}>{children}</span>
  </div>
);

const Tape = ({ style }) => (
  <span aria-hidden="true" style={{ position: 'absolute', top: -9, width: 42, height: 15, backgroundColor: 'rgba(224,216,200,0.9)', border: '1px solid rgba(139,69,19,0.18)', zIndex: 5, boxShadow: '0 1px 2px rgba(0,0,0,0.06)', ...style }} />
);

const HoldHint = React.memo(() => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', backgroundColor: 'rgba(253,251,247,0.92)', border: '1px solid rgba(139,69,19,0.25)', borderRadius: 3, pointerEvents: 'none', color: theme.color.inkMuted, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
    <span style={{ fontFamily: theme.font.body, fontSize: 8, fontWeight: 800, letterSpacing: '1.5px' }}>HOLD</span>
  </div>
));

const FieldCell = ({ icon: Icon, label, value }) => (
  <div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
      <Icon size={12} color={theme.color.accent} />
      <span style={{ fontFamily: theme.font.body, fontSize: 9.5, fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', color: theme.color.inkMuted }}>{label}</span>
    </div>
    <div style={{ fontFamily: theme.font.typewriter, fontSize: 14, fontWeight: 600, color: theme.color.ink, borderBottom: '1.5px dotted rgba(139,69,19,0.45)', paddingBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
  </div>
);

const ScoreStamp = ({ score }) => {
  const ringColor = score >= 85 ? theme.color.crimson : theme.color.accent;
  return (
    <div style={{ width: 88, height: 88, flexShrink: 0, transform: 'rotate(-6deg)' }}>
      <svg viewBox="0 0 88 88" width="88" height="88">
        <circle cx="44" cy="44" r="41" fill="none" stroke={ringColor} strokeWidth="2.5" />
        <text x="44" y="52" textAnchor="middle" fill={ringColor} style={{ fontFamily: theme.font.display, fontSize: '30px', fontWeight: 900 }}>{score}</text>
        <text x="44" y="64" textAnchor="middle" fill={ringColor} style={{ fontFamily: theme.font.body, fontSize: '7px', fontWeight: 800, letterSpacing: '2px' }}>%</text>
      </svg>
    </div>
  );
};

const StampChip = ({ children }) => (
  <span style={{ display: 'inline-block', transform: 'rotate(-1.2deg)', border: `1.5px solid ${theme.color.crimson}`, color: theme.color.crimson, fontFamily: theme.font.body, fontSize: 10, fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase', padding: '6px 10px', borderRadius: 4, backgroundColor: 'rgba(139,26,26,0.04)' }}>{children}</span>
);

const PaperTag = ({ children }) => (
  <span style={{ display: 'inline-block', backgroundColor: theme.color.paper, border: `1px solid ${theme.color.lineDark}`, padding: '8px 12px', borderRadius: 4, fontFamily: theme.font.typewriter, fontSize: 12, fontWeight: 600, color: theme.color.inkSoft, boxShadow: '0 2px 6px rgba(88,63,30,0.12)' }}>{children}</span>
);

const Polaroid = ({ src, alt, tilt = '0deg', aspect = '1 / 1' }) => (
  <div style={{ position: 'relative', transform: `rotate(${tilt})`, backgroundColor: '#ffffff', padding: '7px 7px 20px', borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 10px 24px rgba(88,63,30,0.2)', zIndex: 1 }}>
    <div style={{ width: '100%', aspectRatio: aspect, overflow: 'hidden', backgroundColor: theme.color.surfaceAlt }}>
      <img src={src} alt={alt} loading="lazy" decoding="async" onLoad={(e) => { e.currentTarget.style.opacity = 1; }} onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/400x500'; e.currentTarget.style.opacity = 1; }} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0, transition: 'opacity 0.4s ease-out' }} />
    </div>
    <div style={{ position: 'absolute', bottom: 4, right: 8, zIndex: 5 }}><HoldHint /></div>
  </div>
);

const IndexCard = ({ children, tilt = '0deg' }) => (
  <div style={{ position: 'relative', transform: `rotate(${tilt})`, zIndex: 1 }}>
    <Tape style={{ left: 18, transform: 'rotate(-5deg)' }} />
    <div style={{ backgroundColor: theme.color.card, backgroundImage: 'linear-gradient(rgba(139,69,19,0.08) 1px, transparent 1px)', backgroundSize: '100% 20px', backgroundPosition: '0 14px', border: '1px solid rgba(139,69,19,0.25)', borderRadius: 6, padding: '20px 16px 16px 34px', minHeight: 130, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', boxShadow: '0 8px 20px rgba(88,63,30,0.16)' }}>
      <span aria-hidden="true" style={{ position: 'absolute', top: 0, bottom: 0, left: 24, width: 1, backgroundColor: 'rgba(139,26,26,0.3)' }} />
      <span aria-hidden="true" style={{ fontFamily: theme.font.display, fontSize: 34, lineHeight: 0.5, opacity: 0.25, marginBottom: 10, color: theme.color.accent, display: 'block' }}>“</span>
      <p style={{ fontFamily: theme.font.typewriter, fontSize: 13.5, color: theme.color.ink, margin: 0, lineHeight: 1.55, fontWeight: 600, wordBreak: 'break-word' }}>{children}</p>
      <div style={{ position: 'absolute', bottom: 8, right: 8, zIndex: 4 }}><HoldHint /></div>
    </div>
  </div>
);

/* ---------------- Main card ---------------- */
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

  const currentUser = (() => { try { return JSON.parse(localStorage.getItem('matchalize_user')) || {}; } catch { return {}; } })();
  const sharedInterests = (profile.interests || []).filter(i => (currentUser.interests || []).includes(i));
  const userIntent = Array.isArray(currentUser.intent) ? currentUser.intent : [currentUser.intent];
  const profileIntent = Array.isArray(profile.intent) ? profile.intent : [profile.intent];
  const sharedIntent = profileIntent.filter(i => userIntent.includes(i));
  const compatMatches = (() => {
    const userAnswers = currentUser.compatAnswers || [];
    const profileAnswers = profile.compatAnswers || [];
    return userAnswers.filter(a => profileAnswers.some(b => b.question === a.question && b.answer === a.answer));
  })();

  const grainUrl = design?.texture?.grain || '';

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
    <div style={{ width: '100%', height: '100%', position: 'relative', backgroundColor: '#ece4d4' }}>

      <style>{`
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; overscroll-behavior-y: none; }
        .tactile-btn { transition: transform 0.15s ease-out; will-change: transform; }
        .tactile-btn:active { transform: scale(0.96) !important; }
        .neu-flat {
          background: #f4f1ea; border-radius: 20px;
          box-shadow: 8px 8px 16px #dedad2, -8px -8px 16px #ffffff; border: none;
        }
        .neu-pressed {
          background: #f4f1ea; border-radius: 12px;
          box-shadow: inset 6px 6px 12px #dedad2, inset -6px -6px 12px #ffffff; border: none;
        }
        .neu-pill {
          background: #f4f1ea; border-radius: 50px;
          box-shadow: 4px 4px 8px #dedad2, -4px -4px 8px #ffffff; border: none; color: #8b1a1a;
        }
      `}</style>

      {/* Tap-anywhere dismiss layer for the profile menu */}
      {showProfileMenu && (
        <div onClick={() => setShowProfileMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 45, background: 'transparent' }} />
      )}

      {/* Continuous warm desk surface + one unifying grain film */}
      {grainUrl && (
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: `url("${grainUrl}")`, mixBlendMode: 'multiply', opacity: 0.3, pointerEvents: 'none', zIndex: 2 }} />
      )}

      <InkPullIndicator dragY={dragY} />

      <div
        ref={scrollContainer}
        className="hide-scroll"
        onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
        style={{
          width: '100%', height: '100%',
          overflowY: 'auto', WebkitOverflowScrolling: 'touch',
          position: 'relative', zIndex: 1,
          padding: '16px 14px 44px 14px',
          willChange: 'scroll-position'
        }}
      >
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* ============ HERO PANEL — clean, no spine ============ */}
          <div style={{
            width: '100%',
            height: 'calc(100dvh - 130px)',
            flexShrink: 0,
            position: 'relative',
            borderRadius: 18,
            overflow: 'hidden',
            border: '1px solid rgba(212,197,169,0.7)',
            boxShadow: '0 18px 44px rgba(88,63,30,0.28), 0 4px 12px rgba(88,63,30,0.14)',
            backgroundColor: '#000',
          }}>
            <img ref={heroImgRef} src={profile.photos?.[0] || 'https://via.placeholder.com/600x800'} alt={profile.name} onLoad={() => setHeroLoaded(true)} decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: heroLoaded ? 1 : 0, transition: 'opacity 0.4s ease-out' }} />
            <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,12,10,0.95) 0%, rgba(15,12,10,0.4) 40%, transparent 100%)', pointerEvents: 'none' }} />

            <div style={{ position: 'absolute', bottom: '32px', left: '24px', right: '24px', zIndex: 5 }}>
              <h2 style={{ fontFamily: theme.font.display, fontSize: '38px', color: '#fff', margin: 0, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.05, textShadow: '0 2px 16px rgba(0,0,0,0.5)' }}>
                {profile.name || 'Anonymous'}<span style={{ fontWeight: 400, fontStyle: 'italic', opacity: 0.85 }}>, {profile.age || '—'}</span>
              </h2>
              <p style={{ fontFamily: theme.font.typewriter, fontSize: '11px', color: 'rgba(255,255,255,0.9)', margin: '10px 0 0 0', letterSpacing: '2px', textTransform: 'uppercase', display: 'flex', alignItems: 'center' }}>
                {profile.branch || 'General'}
                <span style={{ color: theme.color.gold, margin: '0 9px' }}>·</span>
                Era {profile.year || '20XX'}
              </p>
            </div>

            <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 50 }}>
              <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="tactile-btn" style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: 12, backgroundColor: 'rgba(253,251,247,0.92)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.7)', color: theme.color.ink, boxShadow: '0 4px 12px rgba(0,0,0,0.25)' }}><MoreVertical size={18} /></button>
              {showProfileMenu && (
                <motion.div initial={{ opacity: 0, y: -6, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} style={{ position: 'absolute', top: 50, right: 0, zIndex: 55, minWidth: 160, padding: 6, backgroundColor: theme.color.paper, border: `1px dashed ${theme.color.lineDark}`, borderRadius: 8, boxShadow: '0 12px 28px rgba(0,0,0,0.22)' }}>
                  <button onClick={() => { triggerHaptic('light'); setShowProfileMenu(false); setShowReport(true); }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 12px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontFamily: theme.font.body, fontSize: 12, color: theme.color.crimson, fontWeight: 800, borderRadius: 5 }}><Flag size={13} /> Report Profile</button>
                </motion.div>
              )}
            </div>
          </div>

          {/* ============ COMPATIBILITY — first panel after the photo ============ */}
          <Panel style={{ padding: '22px 20px' }}>
            <PopoutItem targetId="compatibility" onAction={onAction} type="compatibility" compatScore={targetScore}>
              <div style={{ cursor: 'pointer', position: 'relative', zIndex: 1 }}>
                {targetScore > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 18 }}>
                    <ScoreStamp score={displayScore} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontFamily: theme.font.display, fontSize: 18, fontWeight: 800, color: theme.color.ink, lineHeight: 1.2 }}>{matchStatus(targetScore)}</span>
                      <span style={{ fontFamily: theme.font.typewriter, fontSize: 11, color: theme.color.inkMuted, lineHeight: 1.4 }}>Based on 7 compatibility metrics</span>
                    </div>
                  </div>
                )}
                <div style={{ border: '1px solid rgba(139,69,19,0.3)', borderRadius: 6, padding: '14px 16px', backgroundColor: 'rgba(139,69,19,0.03)' }}>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {sharedInterests.length > 0 && (
                      <li style={{ fontSize: 13, color: theme.color.inkSoft, display: 'flex', alignItems: 'flex-start', gap: 8, fontFamily: theme.font.body }}><span style={{ color: theme.color.crimson, fontWeight: 700 }}>•</span><span>You both love {sharedInterests.join(' and ')}.</span></li>
                    )}
                    {sharedIntent.length > 0 && (
                      <li style={{ fontSize: 13, color: theme.color.inkSoft, display: 'flex', alignItems: 'flex-start', gap: 8, fontFamily: theme.font.body }}><span style={{ color: theme.color.crimson, fontWeight: 700 }}>•</span><span>You are both looking for {sharedIntent.join(' and ')}.</span></li>
                    )}
                    {compatMatches.length > 0 && (
                      <li style={{ fontSize: 13, color: theme.color.inkSoft, display: 'flex', alignItems: 'flex-start', gap: 8, fontFamily: theme.font.body }}><span style={{ color: theme.color.crimson, fontWeight: 700 }}>•</span><span>You both chose "{compatMatches[0].answer}" for "{compatMatches[0].question}".</span></li>
                    )}
                    {sharedInterests.length === 0 && sharedIntent.length === 0 && compatMatches.length === 0 && (
                      <li style={{ fontSize: 13, color: theme.color.inkMuted, display: 'flex', alignItems: 'flex-start', gap: 8, fontFamily: theme.font.body, fontStyle: 'italic' }}><span>•</span><span>Discover something new about each other.</span></li>
                    )}
                  </ul>
                </div>
                <div style={{ position: 'absolute', top: -4, right: 0, zIndex: 3 }}><HoldHint /></div>
              </div>
            </PopoutItem>
          </Panel>

          {/* ============ VITALS PANEL ============ */}
          <Panel style={{ padding: '22px 20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 14px' }}>
              <FieldCell icon={MapPin} label="Hostel" value={profile.hostel || 'Campus'} />
              <FieldCell icon={Calendar} label="Year" value={profile.year || '—'} />
              <FieldCell icon={Award} label="Branch" value={profile.branch || 'General'} />
              <FieldCell icon={Sparkle} label="Pronouns" value={profile.pronouns || '—'} />
            </div>
          </Panel>

          {/* ============ BIO — loose artifact ============ */}
          {profile.bio && (
            <Reveal>
              <div style={{ position: 'relative' }}>
                <Paperclip size={30} strokeWidth={1.75} color="#6f6a5c" style={{ position: 'absolute', top: -16, left: 16, transform: 'rotate(-8deg)', zIndex: 6, filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.2))' }} />
                <IndexCard tilt="-0.5deg">{profile.bio}</IndexCard>
              </div>
            </Reveal>
          )}

          {/* ============ SEEKING PANEL — headed groups, one radius system ============ */}
          <Panel style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <PanelHeader icon={Sliders}>Seeking</PanelHeader>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
                {(profile.intent && profile.intent.length > 0 ? profile.intent : ['Connection']).map((item, i) => (
                  <StampChip key={i}>{item}</StampChip>
                ))}
              </div>
            </div>
            {profile.interests && profile.interests.length > 0 && (
              <div>
                <PanelHeader icon={Star}>Interests</PanelHeader>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
                  {profile.interests.map((interest, i) => (
                    <PaperTag key={i}>{interest}</PaperTag>
                  ))}
                </div>
              </div>
            )}
          </Panel>

          {/* ============ EXHIBITS — loose artifacts ============ */}
          <Reveal>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px 16px', alignItems: 'center', paddingTop: 4 }}>
              <PopoutItem targetId="prompt_0" onAction={onAction} style={{ height: 'auto' }}><IndexCard tilt={TILTS.prompt_0}>{profile.prompts?.[0]?.question || "A shower thought I recently had..."}</IndexCard></PopoutItem>

              {profile.photos?.[1] && <PopoutItem targetId="photo_1" onAction={onAction}><Polaroid src={profile.photos[1]} alt="photo" tilt={TILTS.photo_1} /></PopoutItem>}
              {profile.photos?.[2] && <PopoutItem targetId="photo_2" onAction={onAction}><Polaroid src={profile.photos[2]} alt="photo" tilt={TILTS.photo_2} /></PopoutItem>}

              <PopoutItem targetId="prompt_1" onAction={onAction} style={{ height: 'auto' }}><IndexCard tilt={TILTS.prompt_1}>{profile.prompts?.[1]?.question || "My ideal weekend looks like..."}</IndexCard></PopoutItem>

              {profile.prompts?.[2] && <PopoutItem targetId="prompt_2" onAction={onAction} style={{ gridColumn: 'span 2', height: 'auto' }}><IndexCard tilt={TILTS.prompt_2}>{profile.prompts[2].question}</IndexCard></PopoutItem>}
              {profile.photos?.[3] && <PopoutItem targetId="photo_3" onAction={onAction} style={{ gridColumn: 'span 2' }}><Polaroid src={profile.photos[3]} alt="photo" tilt={TILTS.photo_3} aspect="16 / 9" /></PopoutItem>}
            </div>
          </Reveal>
        </div>
      </div>

      <AnimatePresence>
        {showReport && profile._id && <ReportModal reportedUserId={profile._id} onClose={() => setShowReport(false)} onReported={() => { setShowReport(false); toast.success('Report submitted.'); }} />}
      </AnimatePresence>
    </div>
  );
};

export default ProfileCard;