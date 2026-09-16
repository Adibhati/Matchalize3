import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Hourglass, Feather, BookOpen } from 'lucide-react';

const T = {
  paper: '#f4ede0', paperDeep: '#e8dcc0', paperShadow: '#d4c5a9',
  ink: '#1a1410', inkMuted: '#6b5d4f',
  accent: '#800000', gold: '#c99a3e', goldLight: '#d4a84a',
  crimsonDeep: '#4d0000', shadowWarm: 'rgba(128,0,0,0.25)',
  void: '#050404',
};

const F = {
  display: "'Playfair Display', Georgia, serif",
  italic: "'Playfair Display', Georgia, serif",
  typewriter: "'IM Fell English', 'Courier New', serif",
  mono: "'Special Elite', monospace",
  sans: "'Inter', system-ui, sans-serif",
};

const SLIDES = [
  { id: 'prologue', tag: 'The Manifesto', title: 'Matchalize', subtitle: 'A Deliberate Network', type: 'title', align: 'center', isNight: false },
  { id: 'problem', Icon: Hourglass, tag: 'The Illusion', title: 'Starting from zero.', body: 'Mainstream platforms manufacture connection from thin air. They optimize for surface signals while remaining structurally blind to the rhythm of your actual, lived existence.', align: 'right', isNight: true },
  { id: 'reality', Icon: Compass, tag: 'The Context', title: 'You are not in a vacuum.', body: 'A campus is extraordinarily dense with shared life. Hostels, societies, fests, and late-night rehearsals. The raw material for connection is already being generated all around you.', align: 'left', isNight: true },
  { id: 'solution', Icon: Feather, tag: 'The Engine', title: 'The campus is the catalyst.', body: "We don't use algorithms to guess your type. We use your lived world. Shared context collapses the distance between strangers before a single word is ever spoken.", align: 'center', isNight: false },
  { id: 'cta', tag: 'Initiation', title: 'Reclaim your world.', body: 'Built for the dense, temporary, and irreplaceable reality of college life.', type: 'cta', align: 'center', isNight: false }
];

export default function CinematicWebsite({ onEnter }) {
  const [step, setStep] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  
  const lastScrollTime = useRef(Date.now());
  const touchStartY = useRef(0);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Snappy, reliable step engine
  const changeStep = (direction) => {
    if (unlocking) return;
    const now = Date.now();
    // 1-second lock prevents accidental double-skips
    if (now - lastScrollTime.current < 1000) return; 
    
    setStep((prev) => {
      const next = prev + direction;
      if (next >= 0 && next < SLIDES.length) {
        lastScrollTime.current = now;
        return next;
      }
      return prev;
    });
  };

  useEffect(() => {
    const handleWheel = (e) => {
      if (Math.abs(e.deltaY) > 30) changeStep(e.deltaY > 0 ? 1 : -1);
    };
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [unlocking]);

  const handleTouchStart = (e) => { touchStartY.current = e.touches[0].clientY; };
  const handleTouchEnd = (e) => {
    const delta = touchStartY.current - e.changedTouches[0].clientY;
    if (delta > 40) changeStep(1);
    if (delta < -40) changeStep(-1);
  };

  const handleUnlock = () => {
    try { navigator.vibrate?.([40, 80, 120]); } catch {}
    setUnlocking(true);
    setTimeout(onEnter, 1400); 
  };

  const slide = SLIDES[step];
  const isNight = slide.isNight;

  // Circle Choreography
  const scales = isMobile ? [1, 1.5, 1.5, 0.8, 1.2] : [1, 1.85, 1.85, 0.7, 1.25];
  const xPositions = isMobile ? ['0vw', '-45vw', '45vw', '0vw', '0vw'] : ['0vw', '-35vw', '35vw', '0vw', '0vw'];
  const rotations = [0, 45, 90, 135, 180];

  // =========================================================
  // APP-LIKE STAGGERED ANIMATIONS
  // =========================================================
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 } // Elements pop in sequentially
    },
    exit: {
      opacity: 0,
      filter: 'blur(12px)',
      transition: { duration: 0.6 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10, filter: 'blur(10px)' },
    show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.8, ease: "easeOut" } }
  };

  return (
    <div 
      onTouchStart={handleTouchStart} 
      onTouchEnd={handleTouchEnd}
      style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden', backgroundColor: T.paper }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Special+Elite&display=swap');
        .tactile-btn { transition: all .4s cubic-bezier(0.2, 0.8, 0.2, 1); position: relative; overflow: hidden; }
        .tactile-btn:hover { transform: scale(1.03); background-color: ${T.crimsonDeep} !important; }
        .tactile-btn:active { transform: scale(.95) !important; }
        @keyframes spinSlow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes spinReverse { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
      `}</style>

      {/* BACKGROUND */}
      <motion.div 
        animate={{ backgroundColor: isNight ? T.void : T.paper }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
        style={{ position: 'absolute', inset: 0, zIndex: 0 }} 
      />
      <div style={{ position: 'absolute', inset: 0, mixBlendMode: 'multiply', backgroundImage: `radial-gradient(circle at 20% 30%, ${T.paperShadow}22 1px, transparent 1px), radial-gradient(circle at 70% 60%, ${T.paperShadow}1a 1px, transparent 1px)`, backgroundSize: '3px 3px, 5px 5px', pointerEvents: 'none', zIndex: 1, opacity: 0.5 }} />

      {/* THE CIRCLE */}
      <motion.div 
        animate={{ 
          x: `calc(-50% + ${xPositions[step]})`, 
          y: '-50%',
          scale: scales[step],
          rotate: rotations[step]
        }}
        transition={{ type: "spring", mass: 2.5, stiffness: 40, damping: 25 }}
        style={{ position: 'absolute', top: '50%', left: '50%', width: 600, height: 600, zIndex: 2, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <motion.div animate={{ opacity: unlocking ? 0 : 0.6 }} transition={{ duration: 0.4 }} style={{ width: '100%', height: '100%', position: 'absolute' }}>
          <svg viewBox="0 0 800 800" style={{ width: '100%', height: '100%' }}>
            <g style={{ transformOrigin: 'center', animation: 'spinSlow 100s linear infinite' }}>
              <circle cx="400" cy="400" r="380" stroke={T.goldLight} strokeWidth="1.5" fill="none" strokeDasharray="4 24" />
            </g>
            <g style={{ transformOrigin: 'center', animation: 'spinReverse 140s linear infinite' }}>
              <circle cx="400" cy="400" r="360" stroke={T.inkMuted} strokeWidth="2" fill="none" opacity="0.4" />
            </g>
          </svg>
        </motion.div>

        {/* EXPANDING CORE */}
        <motion.div 
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: unlocking ? 150 : 0, opacity: unlocking ? 1 : 0 }}
          transition={{ duration: 1.2, ease: [0.7, 0, 0.1, 1] }}
          style={{ position: 'absolute', width: 40, height: 40, borderRadius: '50%', backgroundColor: T.void, zIndex: 999 }}
        />
      </motion.div>

      {/* TEXT LAYER (Editorial Layout) */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <AnimatePresence mode="wait">
          {!unlocking && (
            <motion.div 
              key={step}
              variants={containerVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              style={{ 
                width: '100%', 
                maxWidth: 1200,
                display: 'flex', 
                flexDirection: 'column', 
                // Grid-breaking alignment
                alignItems: isMobile ? 'center' : slide.align === 'right' ? 'flex-end' : slide.align === 'left' ? 'flex-start' : 'center', 
                padding: isMobile ? '0 24px' : slide.align === 'right' ? '0 10vw 0 0' : slide.align === 'left' ? '0 0 0 10vw' : '0 40px'
              }}
            >
              
              {/* SLIDE: TITLE */}
              {slide.type === 'title' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <motion.div variants={itemVariants} style={{ color: T.accent, fontFamily: F.mono, fontSize: 11, letterSpacing: 4, textTransform: 'uppercase', fontWeight: 700, padding: '6px 18px', border: `1px solid ${T.accent}55`, marginBottom: 16 }}>
                    {slide.tag}
                  </motion.div>
                  <motion.h1 variants={itemVariants} style={{ color: T.ink, fontFamily: F.display, fontSize: 'clamp(56px, 12vw, 84px)', fontWeight: 900, letterSpacing: '-0.04em', margin: '0 0 16px 0', textShadow: `0 6px 24px ${T.shadowWarm}`, lineHeight: 1 }}>
                    {slide.title}
                  </motion.h1>
                  <motion.p variants={itemVariants} style={{ color: T.inkMuted, fontFamily: F.mono, fontSize: 12, letterSpacing: 4, textTransform: 'uppercase', fontWeight: 700 }}>
                    {slide.subtitle}
                  </motion.p>
                </div>
              )}

              {/* SLIDE: CONTENT (Offset layout for a spatial feel) */}
              {!slide.type && (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: isMobile ? 'center' : slide.align === 'right' ? 'flex-end' : 'flex-start',
                  textAlign: isMobile ? 'center' : slide.align,
                  maxWidth: 540
                }}>
                  <motion.span variants={itemVariants} style={{ color: isNight ? T.goldLight : T.accent, fontFamily: F.mono, fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', fontWeight: 700, marginBottom: 16 }}>
                    {slide.tag}
                  </motion.span>
                  
                  {/* Title is massive and tight */}
                  <motion.h2 variants={itemVariants} style={{ color: isNight ? '#fdfbf7' : T.ink, fontFamily: F.display, fontSize: 'clamp(42px, 7vw, 64px)', margin: '0 0 24px 0', lineHeight: 1.05, fontWeight: 800 }}>
                    {slide.title}
                  </motion.h2>
                  
                  {/* Body text is visually separated into its own block */}
                  <motion.div variants={itemVariants} style={{ 
                    position: 'relative',
                    padding: isMobile ? 0 : slide.align === 'right' ? '0 32px 0 0' : '0 0 0 32px',
                    borderRight: !isMobile && slide.align === 'right' ? `2px solid ${isNight ? T.goldLight : T.accent}40` : 'none',
                    borderLeft: !isMobile && slide.align === 'left' ? `2px solid ${isNight ? T.goldLight : T.accent}40` : 'none',
                  }}>
                    <p style={{ color: isNight ? '#b3a89e' : T.inkMuted, fontFamily: F.typewriter, fontSize: 'clamp(17px, 3vw, 20px)', margin: 0, lineHeight: 1.6 }}>
                      {slide.body}
                    </p>
                  </motion.div>
                </div>
              )}

              {/* SLIDE: CTA */}
              {slide.type === 'cta' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', maxWidth: 440 }}>
                  <motion.h1 variants={itemVariants} style={{ color: T.ink, fontFamily: F.display, fontSize: 'clamp(48px, 8vw, 60px)', fontWeight: 900, letterSpacing: '-0.02em', textShadow: `0 6px 24px ${T.shadowWarm}`, lineHeight: 1, margin: 0 }}>
                    Matchalize
                  </motion.h1>
                  <motion.p variants={itemVariants} style={{ color: T.inkMuted, fontFamily: F.italic, fontSize: 'clamp(16px, 3vw, 18px)', fontStyle: 'italic', margin: '24px 0 40px' }}>
                    {slide.body}
                  </motion.p>
                  <motion.button 
                    variants={itemVariants}
                    onClick={handleUnlock}
                    className="tactile-btn"
                    style={{ width: '100%', padding: '24px 32px', backgroundColor: T.accent, color: '#fbf6e8', border: `1px solid ${T.crimsonDeep}`, borderRadius: 16, fontFamily: F.sans, fontSize: 15, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, cursor: 'pointer', boxShadow: `0 16px 40px rgba(128,0,0,.5), inset 0 2px 0 rgba(255,255,255,.15)` }}
                  >
                    <BookOpen size={22} strokeWidth={2.5} /> Enter the Realm
                  </motion.button>
                </div>
              )}

            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}