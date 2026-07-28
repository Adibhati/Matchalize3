import React, { useRef, useState, useMemo } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { Compass, Hourglass, Feather, Key, BookOpen, Sparkles } from 'lucide-react';

const T = {
  paper: '#f4ede0', paperDeep: '#e8dcc0', paperShadow: '#d4c5a9',
  ink: '#1a1410', inkMuted: '#6b5d4f', inkFaint: '#a89880',
  accent: '#8b4513', gold: '#b8860b', goldLight: '#d4a84a',
  crimson: '#7c1f1f', crimsonDeep: '#5a1414',
  wax: '#8b2500', waxHL: '#c04020',
  shadowWarm: 'rgba(139,69,19,0.18)',
};

const F = {
  display: "'Playfair Display', Georgia, serif",
  italic: "'Playfair Display', Georgia, serif",
  typewriter: "'IM Fell English', 'Courier New', serif",
  mono: "'Special Elite', monospace",
  sans: "'Inter', system-ui, sans-serif",
};

const TYPE = {
  title: { fontFamily: F.display, fontSize: 40, color: T.ink, margin: '14px 0 0', lineHeight: 1.15, fontWeight: 800, letterSpacing: '-0.02em' },
  body: { fontFamily: F.typewriter, fontSize: 15, color: T.inkMuted, margin: 0, lineHeight: 1.7 },
  hl: { fontFamily: F.italic, fontStyle: 'italic', color: T.crimson, fontWeight: 600, fontSize: '1.05em' },
};

const Divider = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '14px 0 18px', width: '100%' }}>
    <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, transparent, ${T.accent}66, transparent)` }} />
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 2 L10 6 L14 8 L10 10 L8 14 L6 10 L2 8 L6 6 Z" fill={T.gold} opacity="0.8" />
      <circle cx="8" cy="8" r="1.5" fill={T.crimson} />
    </svg>
    <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, transparent, ${T.accent}66, transparent)` }} />
  </div>
);

const Corners = () => (
  <svg aria-hidden="true" viewBox="0 0 1000 1000" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 15, opacity: 0.5 }}>
    <g stroke={T.accent} strokeWidth="1" fill="none" opacity="0.7" strokeLinecap="round">
      <path d="M24 24 L24 80 M24 24 L80 24 M24 24 C 40 40, 50 60, 55 80 M36 24 C 44 40, 48 52, 52 68 M24 36 C 40 44, 52 48, 68 52" />
      <path d="M976 24 L976 80 M976 24 L920 24 M976 24 C 960 40, 950 60, 945 80 M964 24 C 956 40, 952 52, 948 68 M976 36 C 960 44, 948 48, 932 52" />
      <path d="M24 976 L24 920 M24 976 L80 976 M24 976 C 40 960, 50 940, 55 920 M36 976 C 44 960, 48 948, 52 932 M24 964 C 40 956, 52 952, 68 948" />
      <path d="M976 976 L976 920 M976 976 L920 976 M976 976 C 960 960, 950 940, 945 920 M964 976 C 956 960, 952 948, 948 932 M976 964 C 960 956, 948 952, 932 948" />
    </g>
    {[[24,24],[976,24],[24,976],[976,976]].map(([x,y],i) => <circle key={i} cx={x} cy={y} r="1.5" fill={T.accent} opacity="0.8" />)}
  </svg>
);

/* Dust — optimized, but retained */
const Dust = () => {
  const motes = useMemo(() => Array.from({ length: 5 }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100,
    size: Math.random() * 2 + 1, dur: Math.random() * 20 + 20,
    delay: Math.random() * 10, op: Math.random() * 0.3 + 0.2,
  })), []);
  return (
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 6 }}>
      {motes.map(m => (
        <motion.div key={m.id}
          style={{ position: 'absolute', left: `${m.x}%`, top: `${m.y}%`, width: m.size, height: m.size, borderRadius: '50%', backgroundColor: T.goldLight, opacity: m.op, willChange: 'transform, opacity' }}
          animate={{ y: [0, -150], x: [0, Math.sin(m.id) * 30], opacity: [0, m.op, 0] }}
          transition={{ duration: m.dur, delay: m.delay, repeat: Infinity, ease: 'linear' }}
        />
      ))}
    </div>
  );
};

/* Astrolabe — Perpetual motion restored! */
const Astrolabe = ({ progress, isUnlocking }) => {
  const scale = useTransform(progress, [0, 0.5, 1], [0.8, 1.05, 1.2]);
  const op = useTransform(progress, [0, 0.5, 1], [0.15, 0.28, 0.28]);
  const sealScale = useTransform(progress, [0, 0.5, 1], [0.6, 1, 1.15]);
  const sealOp = useTransform(progress, [0, 0.3, 0.85, 1], [0, 0.9, 0.9, 0]);

  return (
    <motion.div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: op, scale, pointerEvents: 'none', zIndex: 0, willChange: 'transform, opacity' }}>
      <div aria-hidden="true" style={{ position: 'absolute', width: '60%', height: '60%', borderRadius: '50%', background: `radial-gradient(circle, ${T.goldLight}22, transparent 70%)` }} />

      {/* Outer ring — Infinite Rotation Restored */}
      <motion.svg style={{ position: 'absolute', width: '140%', height: '140%' }} viewBox="0 0 800 800"
        animate={isUnlocking ? { scale: 120, opacity: 0 } : { rotate: 360, scale: 1, opacity: 1 }}
        transition={isUnlocking ? { scale: { duration: 1.4, ease: [0.64,0,0.05,1] }, opacity: { duration: 0.8, delay: 0.6 } } : { rotate: { duration: 120, repeat: Infinity, ease: 'linear' } }}
      >
        <circle cx="400" cy="400" r="380" stroke={T.accent} strokeWidth="1.5" fill="none" strokeDasharray="4 12" />
        <circle cx="400" cy="400" r="360" stroke={T.paperShadow} strokeWidth="3" fill="none" />
        <path d="M400 40 L400 760 M40 400 L760 400 M145 145 L655 655 M145 655 L655 145" stroke={T.accent} strokeWidth="1" opacity="0.4" />
      </motion.svg>

      {/* Inner ring — Infinite Counter-Rotation Restored */}
      <motion.svg style={{ position: 'absolute', width: '80%', height: '80%' }} viewBox="0 0 800 800"
        animate={isUnlocking ? { scale: 80, opacity: 0 } : { rotate: -360, scale: 1, opacity: 1 }}
        transition={isUnlocking ? { scale: { duration: 1.5, ease: [0.64,0,0.05,1], delay: 0.1 }, opacity: { duration: 0.6, delay: 0.9 } } : { rotate: { duration: 80, repeat: Infinity, ease: 'linear' } }}
      >
        <circle cx="400" cy="400" r="280" stroke={T.crimson} strokeWidth="2" fill="none" strokeDasharray="30 15" />
        <circle cx="400" cy="400" r="240" stroke={T.paperShadow} strokeWidth="6" fill="none" strokeDasharray="1 40" strokeLinecap="round" />
        <rect x="220" y="220" width="360" height="360" stroke={T.accent} strokeWidth="1.5" fill="none" transform="rotate(45 400 400)" opacity="0.5" />
      </motion.svg>

      {/* Wax seal - Kept the gorgeous new animation */}
      <motion.div style={{ position: 'absolute', width: 180, height: 180, scale: sealScale, opacity: sealOp, willChange: 'transform, opacity' }}>
        <motion.div animate={isUnlocking ? { scale: [1, 1.3, 0], rotate: [0, 180, 360], opacity: [1, 1, 0] } : {}} transition={{ duration: 1.2 }}>
          <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%' }}>
            <defs>
              <linearGradient id="wg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={T.waxHL} /><stop offset="50%" stopColor={T.wax} /><stop offset="100%" stopColor={T.crimsonDeep} />
              </linearGradient>
            </defs>
            <path d="M100 20 Q 78 28, 72 50 Q 55 55, 50 75 Q 42 90, 48 110 Q 50 130, 65 145 Q 85 158, 100 158 Q 115 158, 135 145 Q 150 130, 152 110 Q 158 90, 150 75 Q 145 55, 128 50 Q 122 28, 100 20 Z" fill="url(#wg)" stroke={T.crimsonDeep} strokeWidth="0.5" />
            <circle cx="100" cy="100" r="58" fill="none" stroke={T.crimsonDeep} strokeWidth="1.5" opacity="0.6" />
            <circle cx="100" cy="100" r="52" fill="none" stroke={T.goldLight} strokeWidth="0.8" opacity="0.5" />
            <text x="100" y="115" textAnchor="middle" fontFamily={F.display} fontSize="52" fontWeight="900" fill={T.crimsonDeep}>M</text>
            <text x="100" y="115" textAnchor="middle" fontFamily={F.display} fontSize="52" fontWeight="900" fill="none" stroke={T.goldLight} strokeWidth="0.5" opacity="0.6">M</text>
            <ellipse cx="80" cy="75" rx="20" ry="12" fill="#fff" opacity="0.15" transform="rotate(-30 80 75)" />
          </svg>
          {isUnlocking && (
            <svg viewBox="0 0 200 200" style={{ position: 'absolute', inset: 0 }}>
              <path d="M100 100 L 85 70 L 75 50 L 70 30 M100 100 L 125 85 L 145 75 L 160 65 M100 100 L 95 130 L 90 155" stroke="#2a0a0a" strokeWidth="1.5" fill="none" />
            </svg>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

/* Artifacts — Cinematic Blur Restored */
const Artifacts = ({ progress }) => {
  const yFast = useTransform(progress, [0, 1], ['20%', '-250%']);
  const yMed = useTransform(progress, [0, 1], ['10%', '-120%']);
  const ySlow = useTransform(progress, [0, 1], ['0%', '-50%']);
  const r1 = useTransform(progress, [0, 1], [-12, 25]);
  const r2 = useTransform(progress, [0, 1], [15, -30]);
  return (
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
      <motion.div style={{ position: 'absolute', top: '70%', left: '-10%', width: 140, height: 180, y: yFast, rotate: r1, opacity: 0.35, backgroundColor: '#fbf6e8', border: `1px solid ${T.paperShadow}`, filter: 'blur(8px)', willChange: 'transform' }} />
      <motion.div style={{ position: 'absolute', top: '40%', right: '-15%', width: 200, height: 140, y: yMed, rotate: r2, opacity: 0.4, backgroundColor: T.paperDeep, border: `1px solid ${T.paperShadow}`, filter: 'blur(5px)', willChange: 'transform' }} />
      <motion.div style={{ position: 'absolute', top: '90%', right: '20%', width: 120, height: 120, y: ySlow, rotate: r1, opacity: 0.12, background: `radial-gradient(circle, ${T.waxHL}, transparent)`, filter: 'blur(30px)', willChange: 'transform' }} />
    </div>
  );
};

/* Index */
const Index = ({ progress }) => {
  const lh = useTransform(progress, [0, 0.9], ['0%', '100%']);
  const op = useTransform(progress, [0.15, 0.22, 0.85, 0.92], [0, 1, 1, 0]);
  const dots = [0, 0.12, 0.32, 0.52, 0.72].map(s => useTransform(progress, [s, s + 0.08], [0.3, 1]));
  const nums = ['I', 'II', 'III', 'IV', 'V'];
  return (
    <motion.div aria-hidden="true" style={{ opacity: op, position: 'absolute', left: 28, top: '22%', bottom: '22%', width: 40, zIndex: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ position: 'absolute', top: 0, left: '50%', marginLeft: -1, width: 2, height: '100%', backgroundColor: `${T.accent}1f` }} />
      <motion.div style={{ position: 'absolute', top: 0, left: '50%', marginLeft: -1, width: 2, height: lh, background: `linear-gradient(${T.accent}, ${T.gold})`, boxShadow: `0 0 10px ${T.accent}66` }} />
      {nums.map((n, i) => (
        <motion.div key={i} style={{ position: 'relative', display: 'flex', alignItems: 'center', opacity: dots[i], zIndex: 2 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: T.paper, border: `1.5px solid ${T.accent}`, boxShadow: `0 0 0 3px ${T.paper}` }} />
          <span style={{ position: 'absolute', left: 22, fontFamily: F.display, fontSize: 10, fontWeight: 700, color: T.accent, letterSpacing: 1 }}>{n}</span>
        </motion.div>
      ))}
    </motion.div>
  );
};

/* Layer */
const Layer = ({ progress, inStart, inPeak, outPeak, outEnd, isFirst, centered, chapter, children }) => {
  const op = useTransform(progress, isFirst ? [0, outPeak, outEnd] : [inStart, inPeak, outPeak, outEnd], isFirst ? [1, 1, 0] : [0, 1, 1, 0]);
  const y = useTransform(progress, isFirst ? [0, outEnd] : [inStart, outEnd], isFirst ? [0, -60] : [60, -60]);
  const blur = useTransform(progress, isFirst ? [0, outPeak, outEnd] : [inStart, inPeak, outPeak, outEnd], isFirst ? ['blur(0px)', 'blur(0px)', 'blur(12px)'] : ['blur(12px)', 'blur(0px)', 'blur(0px)', 'blur(12px)']);
  const sc = useTransform(progress, isFirst ? [0, outPeak, outEnd] : [inStart, inPeak, outPeak, outEnd], isFirst ? [1, 1, 1.05] : [0.9, 1, 1, 1.05]);
  return (
    <motion.div style={{
      position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: centered ? '0 32px' : '0 48px 0 72px',
      textAlign: centered ? 'center' : 'left',
      pointerEvents: 'none',
      opacity: op, y, filter: blur, scale: sc, zIndex: 10,
      willChange: 'transform, opacity, filter',
    }}>
      <div style={{ width: '100%', maxWidth: 420, position: 'relative' }}>
        {chapter && <div style={{ position: 'absolute', top: -40, left: -20, fontFamily: F.display, fontSize: 120, fontWeight: 900, color: T.accent, opacity: 0.06, lineHeight: 1, letterSpacing: '-0.05em', pointerEvents: 'none', userSelect: 'none' }}>{chapter}</div>}
        {children}
      </div>
    </motion.div>
  );
};

const CHAPTERS = [
  { Icon: Compass, label: 'The Scale', title: <>Ten thousand <br /><span style={TYPE.hl}>strangers.</span></>, body: 'A sea of faces and passing footsteps. The modern campus is a crowded room where everyone is visible, yet no one is truly seen.' },
  { Icon: Hourglass, label: 'The Problem', title: <>Moments, lost to <br /><span style={TYPE.hl}>the bell.</span></>, body: 'That shared glance in the library. The quiet conversation in the canteen. Most connections fade away before you ever learn their name.' },
  { Icon: Feather, label: 'The Solution', title: <>Pause the <br /><span style={TYPE.hl}>pendulum.</span></>, body: 'No hollow algorithms. No mindless swiping. Matchalize is built for slow, deliberate correspondence. A place where patience is rewarded.' },
  { Icon: Key, label: 'The Archive', title: <>Enter the <br /><span style={TYPE.hl}>Archives.</span></>, body: 'Curate your dossier. Exchange letters. Find the ones who are willing to read between the lines.' },
];

const Splash = ({ onEnter }) => {
  const ref = useRef(null);
  const [unlocking, setUnlocking] = useState(false);
  const { scrollYProgress } = useScroll({ container: ref });
  const p = useSpring(scrollYProgress, { damping: 35, stiffness: 100, mass: 1 });

  const ctaOp = useTransform(p, [0.88, 0.95], [0, 1]);
  const ctaY = useTransform(p, [0.88, 0.95], [50, 0]);
  const ctaBlur = useTransform(p, [0.88, 0.95], ['blur(12px)', 'blur(0px)']);
  const hintOp = useTransform(p, [0, 0.05], [1, 0]);

  const unlock = () => {
    try { navigator.vibrate?.(80); } catch {}
    setUnlocking(true);
    setTimeout(onEnter, 1600);
  };

  return (
    <motion.div ref={ref} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}
      style={{ height: '100dvh', width: '100%', overflowY: unlocking ? 'hidden' : 'auto', overflowX: 'hidden', backgroundColor: T.paper, position: 'relative', WebkitOverflowScrolling: 'touch' }}
      className="archival-scrollbar">

      <style>{`
        .archival-scrollbar::-webkit-scrollbar{display:none}
        .archival-scrollbar{scrollbar-width:none}
        @import url('https://cdn.jsdelivr.net/npm/@fontsource/playfair-display@5.0.19/index.css');
        @import url('https://cdn.jsdelivr.net/npm/@fontsource/im-fell-english@5.0.19/index.css');
        @import url('https://cdn.jsdelivr.net/npm/@fontsource/special-elite@5.0.19/index.css');
        @import url('https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.16/index.css');

        .tactile-btn{transition:transform .25s cubic-bezier(.2,.8,.2,1),box-shadow .25s;position:relative;overflow:hidden}
        .tactile-btn::before{content:'';position:absolute;inset:0;border-radius:inherit;background:linear-gradient(180deg,rgba(255,255,255,.18),transparent 50%,rgba(0,0,0,.15));pointer-events:none}
        @media(hover:hover){.tactile-btn:hover{transform:translate3d(0,-3px,0) scale3d(1.02,1.02,1);box-shadow:0 20px 40px rgba(124,31,31,.45),0 0 0 1px rgba(184,134,11,.3)}}
        .tactile-btn:active{transform:scale3d(.97,.97,1)!important;transition:transform .1s!important}
        .shimmer::after{content:'';position:absolute;top:0;left:-100%;width:50%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.3),transparent);transform:skewX(-20deg);animation:glare 4s infinite}
        @keyframes glare{0%{left:-100%}30%,100%{left:200%}}
        @keyframes bounceFade{0%,100%{transform:translateY(0);opacity:.4}50%{transform:translateY(12px);opacity:1}}
      `}</style>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: unlocking ? 1 : 0 }} transition={{ duration: 0.7, delay: 0.9 }}
        style={{ position: 'fixed', inset: -100, backgroundColor: T.paperDeep, zIndex: 9999, pointerEvents: 'none' }} />

      <div style={{ height: '800vh', position: 'relative' }}>
        <div style={{ position: 'sticky', top: 0, height: '100dvh', width: '100%', overflow: 'hidden' }}>

          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, opacity: 0.4, pointerEvents: 'none', zIndex: 5, mixBlendMode: 'multiply',
            backgroundImage: `radial-gradient(circle at 20% 30%, ${T.paperShadow}22 1px, transparent 1px), radial-gradient(circle at 70% 60%, ${T.paperShadow}1a 1px, transparent 1px), radial-gradient(circle at 40% 80%, ${T.paperShadow}15 1px, transparent 1px)`,
            backgroundSize: '3px 3px, 5px 5px, 7px 7px' }} />

          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 7,
            background: `radial-gradient(ellipse at center, transparent 45%, rgba(26,20,16,.3) 100%)` }} />

          <Dust />
          <Astrolabe progress={p} isUnlocking={unlocking} />

          <motion.div animate={{ opacity: unlocking ? 0 : 1, filter: unlocking ? 'blur(12px)' : 'none', scale: unlocking ? 0.95 : 1 }} transition={{ duration: 0.4 }}
            style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: unlocking ? 'none' : 'auto' }}>

            <Artifacts progress={p} />
            <Index progress={p} />
            <Corners />

            {/* Prologue — centered */}
            <Layer isFirst centered progress={p} outPeak={0.08} outEnd={0.15}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ display: 'inline-block', fontFamily: F.mono, fontSize: 10, letterSpacing: 4, color: T.accent, textTransform: 'uppercase', fontWeight: 700, padding: '6px 16px', border: `1px solid ${T.accent}44` }}>Prologue</div>
                <h1 style={{ fontFamily: F.display, fontSize: 64, fontWeight: 900, color: T.ink, letterSpacing: '-0.04em', margin: '8px 0', textShadow: `0 4px 20px ${T.shadowWarm}`, lineHeight: 1, textAlign: 'center' }}>matchalize</h1>
                <Divider />
                <p style={{ fontFamily: F.italic, fontSize: 16, fontStyle: 'italic', color: T.inkMuted, margin: '0 0 8px' }}>Volume I</p>
                <p style={{ fontFamily: F.mono, fontSize: 11, color: T.inkFaint, letterSpacing: 3, textTransform: 'uppercase', fontWeight: 700 }}>The Campus</p>
              </div>
            </Layer>

            {CHAPTERS.map((c, i) => {
              const start = 0.12 + i * 0.2;
              return (
                <Layer key={i} progress={p} inStart={start} inPeak={start + 0.06} outPeak={start + 0.18} outEnd={start + 0.24} chapter={c.num}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <c.Icon size={28} color={T.accent} strokeWidth={1.5} />
                    <span style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: 3, color: T.accent, textTransform: 'uppercase', fontWeight: 700 }}>{c.label}</span>
                  </div>
                  <h2 style={TYPE.title}>{c.title}</h2>
                  <Divider />
                  <p style={TYPE.body}>{c.body}</p>
                </Layer>
              );
            })}

            <motion.div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 32px', zIndex: 20, textAlign: 'center', opacity: ctaOp, y: ctaY, filter: ctaBlur }}>
  
  <h1 style={{ fontFamily: F.display, fontSize: 62, fontWeight: 900, color: T.ink, letterSpacing: '-0.04em', textShadow: `0 4px 20px ${T.shadowWarm}`, lineHeight: 1 }}>matchalize</h1>
  <Divider />
  <p style={{ fontFamily: F.italic, fontSize: 16, fontStyle: 'italic', color: T.inkMuted, margin: '0 0 40px' }}>
    The campus network for deliberate connections.
  </p>
  
  <button className="tactile-btn shimmer" onClick={unlock}
    style={{ width: '100%', maxWidth: 340, padding: '22px 28px', backgroundColor: T.crimson, color: '#fbf6e8', border: `1px solid ${T.crimsonDeep}`, borderRadius: 14, fontFamily: F.sans, fontSize: 14, fontWeight: 800, letterSpacing: 2.5, textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, cursor: 'pointer', boxShadow: `0 14px 36px rgba(124,31,31,.45), inset 0 1px 0 rgba(255,255,255,.15)` }}>
    <BookOpen size={20} strokeWidth={2.5} />
    <span style={{ position: 'relative', zIndex: 3 }}>Open the Ledger</span>
  </button>
  
  <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 8, fontFamily: F.mono, fontSize: 9, letterSpacing: 2, color: T.inkFaint, textTransform: 'uppercase' }}>
    <Sparkles size={10} /><span>Strictly limited to verified students</span><Sparkles size={10} />
  </div>

</motion.div>

            <motion.div style={{ position: 'absolute', bottom: 40, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10, opacity: hintOp, pointerEvents: 'none' }}>
              <span style={{ fontFamily: F.mono, fontSize: 9, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 14, color: T.accent }}>Scroll to Begin</span>
              <div style={{ width: 1, height: 40, background: `linear-gradient(${T.accent}, transparent)`, animation: 'bounceFade 2.5s infinite' }} />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default Splash;