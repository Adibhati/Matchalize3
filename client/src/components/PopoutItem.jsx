import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';
import { theme as design } from '../utils/theme';
import { Flower, Mail, ChevronDown, Send } from 'lucide-react';

/* Locked tokens — same family as ProfileCard */
const t = {
  paper: '#fdfbf7',
  surfaceAlt: '#f4f1ea',
  lineDark: '#d4c5a9',
  ink: '#1a1a1a',
  inkMuted: '#8c8275',
  accent: '#8b4513',
  crimson: '#8b1a1a',
  dark: '#211709',        // warm ink-dark panel (letter writing)
  darkRaised: '#2a1f13',
  fontDisplay: design?.font?.heading || design?.font?.display || "'Playfair Display', Georgia, serif",
  fontBody: design?.font?.body || "'Inter', -apple-system, sans-serif",
  fontType: "'Special Elite', 'Courier New', monospace",
  grain: design?.texture?.grain || '',
};

const GRAIN_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.05 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E`;

const GRAIN = t.grain || GRAIN_SVG;

const PopoutItem = ({ children, targetId, onAction, type, style, compatScore }) => {
  const [isPopped, setIsPopped] = useState(false);
  const [rect, setRect] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [actionSent, setActionSent] = useState(false);
  const [showSeal, setShowSeal] = useState(false);
  const [sealKind, setSealKind] = useState('flower');
  const [showInput, setShowInput] = useState(false);
  const [isCardExpanded, setIsCardExpanded] = useState(false);
  const pressTimer = useRef(null);
  const itemRef = useRef(null);

  const updateRect = useCallback(() => {
    if (itemRef.current) setRect(itemRef.current.getBoundingClientRect());
  }, []);

  useEffect(() => {
    if (isPopped) {
      const timer = setTimeout(() => setIsCardExpanded(true), 50);
      return () => clearTimeout(timer);
    } else {
      setIsCardExpanded(false);
    }
  }, [isPopped]);

  const handleTouchStart = () => {
    pressTimer.current = setTimeout(() => {
      triggerHaptic('medium');
      updateRect();
      setIsPopped(true);
    }, 280);
  };

  const handleTouchMove = () => clearTimeout(pressTimer.current);
  const handleTouchEnd = () => clearTimeout(pressTimer.current);
  const handleTouchCancel = () => clearTimeout(pressTimer.current);

  const triggerSealAnimation = (callback) => {
    setShowSeal(true);
    setTimeout(() => {
      setShowSeal(false);
      setIsPopped(false);
      setShowInput(false);
      setIsCardExpanded(false);
      if (callback) callback();
    }, 200);
  };

  const handleLike = () => {
    if (actionSent) return;
    setActionSent(true);
    setSealKind('flower');
    triggerHaptic('light');
    triggerSealAnimation(() => onAction('like', { target: targetId }));
  };

  // Super Like / Telegram Handler
  const handleSuperlike = () => {
    if (actionSent) return;
    setActionSent(true);
    setSealKind('telegram');
    triggerHaptic('heavy');
    triggerSealAnimation(() => onAction('superlike', { target: targetId }));
  };

  const handleNoteSubmit = () => {
    if (actionSent || !noteText.trim()) return;
    setActionSent(true);
    triggerHaptic('heavy');
    triggerSealAnimation(() => {
      onAction('like', { target: targetId, note: noteText.trim() });
      setNoteText('');
    });
  };

  const closePopout = () => {
    triggerHaptic('light');
    setShowInput(false);
    setIsPopped(false);
    setIsCardExpanded(false);
  };

  if (type === 'compatibility') {
    return (
      <div style={{ position: 'relative', width: '100%', contain: 'layout' }}>
        <div
          ref={itemRef}
          onTouchStart={handleTouchStart} onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd} onTouchCancel={handleTouchCancel}
          onContextMenu={(e) => e.preventDefault()}
          style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
        >
          <motion.div
            animate={{ scale: isPopped ? 1.04 : 1, zIndex: isPopped ? 100 : 1, boxShadow: isPopped ? '0 20px 44px rgba(88,63,30,0.3)' : '0 0px 0px transparent' }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            style={{ transform: 'translateZ(0)', willChange: 'transform' }}
          >
            {children}
          </motion.div>
        </div>
        <AnimatePresence>
          {isPopped && createPortal(
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} onClick={closePopout} className="progressive-overlay" style={{ position: 'fixed', inset: 0, zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', contain: 'strict', backgroundColor: 'rgba(28,19,10,0.72)' }}>
              <motion.div initial={{ scale: 0.92, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.94, opacity: 0, y: 16 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} onClick={(e) => e.stopPropagation()} style={{ backgroundColor: t.paper, border: '1px solid rgba(212,197,169,0.7)', borderRadius: 18, padding: '30px 26px 26px', width: '340px', maxWidth: '90vw', textAlign: 'center', position: 'relative', boxShadow: '0 24px 64px rgba(12,7,2,0.45)', overflow: 'hidden', transform: 'translateZ(0)' }}>
                <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: `url("${GRAIN}")`, mixBlendMode: 'multiply', opacity: 0.3, pointerEvents: 'none', zIndex: 1 }} />

                <h4 style={{ position: 'relative', zIndex: 2, fontFamily: t.fontDisplay, fontSize: 22, color: t.ink, margin: '0 0 8px 0', fontWeight: 800, letterSpacing: '-0.02em' }}>Compatibility Scan</h4>

                {compatScore !== undefined && compatScore !== null && (
                  <p style={{ position: 'relative', zIndex: 2, fontFamily: t.fontBody, fontSize: 13.5, fontWeight: 450, color: t.inkMuted, margin: '0 0 24px 0', lineHeight: 1.5 }}>
                    You scored <strong style={{ color: t.crimson, fontSize: 15 }}>%</strong>
                  </p>
                )}

                {/* The stamp — same language as the card's ScoreStamp, with one slow scan ring */}
                <div style={{ position: 'relative', zIndex: 2, width: 150, height: 150, margin: '0 auto 28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 24, repeat: Infinity, ease: 'linear' }} style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `1.5px dashed ${t.accent}`, opacity: 0.35 }} />
                  <motion.div initial={{ scale: 1.8, opacity: 0, rotate: -18 }} animate={{ scale: 1, opacity: 1, rotate: -6 }} transition={{ delay: 0.15, type: 'spring', damping: 16, stiffness: 260 }} style={{ width: 110, height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg viewBox="0 0 110 110" width="110" height="110">
                      <circle cx="55" cy="55" r="51" fill="none" stroke={t.crimson} strokeWidth="3" />
                      <text x="55" y="63" textAnchor="middle" fill={t.crimson} style={{ fontFamily: t.fontDisplay, fontSize: '36px', fontWeight: 900 }}>{compatScore}</text>
                      <text x="55" y="78" textAnchor="middle" fill={t.crimson} style={{ fontFamily: t.fontBody, fontSize: '9px', fontWeight: 800, letterSpacing: '2px' }}>%</text>
                    </svg>
                  </motion.div>
                </div>

                <button onClick={closePopout} style={{ position: 'relative', zIndex: 2, width: '100%', backgroundColor: t.surfaceAlt, border: '1px solid rgba(212,197,169,0.7)', padding: '15px', borderRadius: 999, fontFamily: t.fontBody, fontSize: 11, fontWeight: 800, letterSpacing: '1.8px', textTransform: 'uppercase', color: t.ink, cursor: 'pointer', boxShadow: '0 4px 12px rgba(88,63,30,0.12)' }}>Close</button>
              </motion.div>
            </motion.div>,
            document.body
          )}
        </AnimatePresence>
      </div>
    );
  }

  const completionPercentage = Math.min((noteText.length / 50) * 100, 100);

  return (
    <div
      ref={itemRef}
      onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
      onContextMenu={(e) => e.preventDefault()}
      style={{ position: 'relative', width: '100%', height: '100%', WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none', ...style }}
    >
      <motion.div
        animate={{ scale: isPopped ? 1.04 : 1, zIndex: isPopped ? 100 : 1, boxShadow: isPopped ? '0 24px 48px rgba(28,19,10,0.35)' : '0 0px 0px transparent' }}
        transition={{ type: 'spring', damping: 22, stiffness: 300 }}
        style={{ height: '100%', transformOrigin: 'center', borderRadius: 6, willChange: 'transform, box-shadow' }}
      >
        {children}
      </motion.div>

      <AnimatePresence>
        {showSeal && rect && createPortal(
          <motion.div initial={{ opacity: 0, scale: 2.5, rotate: -20 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ type: 'spring', damping: 14, stiffness: 200 }} style={{ position: 'fixed', top: rect.top + (rect.height / 2) - 40, left: rect.left + (rect.width / 2) - 40, width: '80px', height: '80px', zIndex: 10000, pointerEvents: 'none' }}>
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', backgroundColor: sealKind === 'telegram' ? t.accent : t.crimson, boxShadow: '0 10px 25px rgba(28,19,10,0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <span aria-hidden="true" style={{ position: 'absolute', inset: 7, borderRadius: '50%', border: '1px dashed rgba(253,251,247,0.4)' }} />
              {sealKind === 'telegram' ? <Send size={20} color="#fff" strokeWidth={2.5} /> : <Flower size={20} color="#fff" strokeWidth={2.5} />}
              <span style={{ fontFamily: t.fontBody, fontSize: 7, fontWeight: 800, color: '#ffffff', letterSpacing: '1.8px', marginTop: 4 }}>{sealKind === 'telegram' ? 'TELEGRAM' : 'AFFIXED'}</span>
            </div>
          </motion.div>,
          document.body
        )}
      </AnimatePresence>

      {isPopped && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="progressive-overlay"
            style={{ position: 'fixed', inset: 0, zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', transform: 'translateZ(0)', backgroundColor: 'rgba(28,19,10,0.72)' }}
          >
            <div className="scrollable-safe-area" onClick={closePopout}>
              <motion.div
                initial={{ scale: 0.85, opacity: 0, y: 40, rotate: -3 }}
                animate={{ scale: 1, opacity: 1, y: 0, rotate: 0 }}
                exit={{ scale: 0.7, opacity: 0, y: 80, rotate: 5 }}
                transition={{ type: 'spring', damping: 24, stiffness: 320 }}
                className={`sandwich-container ${isCardExpanded ? 'expanded' : ''}`}
                drag={!showInput}
                dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
                dragElastic={0.7}
                onDragEnd={(e, info) => {
                  if (Math.hypot(info.offset.x, info.offset.y) > 80) closePopout();
                }}
                onClick={(e) => e.stopPropagation()}
                style={{ willChange: 'transform', transform: 'translateZ(0)', touchAction: 'none' }}
              >
                {/* Top panel: Flower & Telegram */}
                <div className="panel-wrapper panel-top">
                  <div className="panel-inner panel-light" style={{ display: 'flex', flexDirection: 'row', height: '72px', padding: 0 }}>
                    <button onClick={handleLike} disabled={actionSent} className="action-btn flower-btn" style={{ flex: 1, height: '100%', borderRight: `1px solid ${t.lineDark}`, margin: 0, borderRadius: '12px 0 0 0' }}>
                      <Flower size={18} strokeWidth={2.5} /> Flower
                    </button>
                    <button onClick={handleSuperlike} disabled={actionSent} className="action-btn" style={{ flex: 1, height: '100%', color: t.accent, margin: 0, borderRadius: '0 12px 0 0' }}>
                      <Send size={18} strokeWidth={2.5} /> Telegram
                    </button>
                  </div>
                </div>

                <div className="sandwich-center" onClick={() => setIsCardExpanded(!isCardExpanded)}>
                  <div className="card-content-inner">
                    {children}
                  </div>
                </div>

                <div className="panel-wrapper panel-bottom">
                  <div className="panel-inner panel-dark">
                    <div className={`letter-accordion ${showInput ? 'input-active' : ''}`}>
                      <button
                        onClick={(e) => { e.stopPropagation(); triggerHaptic('light'); setShowInput(true); }}
                        disabled={actionSent || showInput}
                        className={`action-btn letter-btn ${showInput ? 'hide-trigger' : ''}`}
                      >
                        <Mail size={18} strokeWidth={2.5} /> Send a Letter
                      </button>
                      <div className="input-area">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px', marginBottom: '8px' }}>
                          <span style={{ fontFamily: t.fontBody, fontSize: 9.5, fontWeight: 800, color: 'rgba(253,251,247,0.4)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Draft Correspondence</span>
                          <button onClick={(e) => { e.stopPropagation(); setShowInput(false); }} aria-label="Collapse" style={{ background: 'none', border: 'none', color: 'rgba(253,251,247,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <ChevronDown size={16} strokeWidth={2} />
                          </button>
                        </div>
                        <div className="premium-input-container">
                          <textarea
                            className="premium-input"
                            placeholder="I noticed that you also..."
                            required
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            autoFocus={showInput}
                          />
                          <div className="completion-bar-bg">
                            <div className="completion-bar-fill" style={{ width: `${completionPercentage}%` }} />
                          </div>
                        </div>
                        <button
                          className={`premium-send-btn ${noteText.trim() ? 'ready-to-send' : ''}`}
                          onClick={handleNoteSubmit}
                          disabled={!noteText.trim()}
                        >
                          Dispatch Letter
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
            <style>{`
              .scrollable-safe-area { width: 100%; height: 100%; position: absolute; inset: 0; overflow-y: auto; display: flex; justify-content: center; align-items: center; padding: 24px 0; -webkit-overflow-scrolling: touch; contain: strict; }
              .scrollable-safe-area::-webkit-scrollbar { display: none; }
              .sandwich-container { display: flex; flex-direction: column; align-items: center; width: 100%; max-width: 328px; position: relative; }
              .sandwich-center { position: relative; z-index: 5; width: 100%; transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1); backface-visibility: hidden; }
              .sandwich-container.expanded .sandwich-center { transform: scale(1.03); }
              .card-content-inner { width: 100%; position: relative; z-index: 2; display: flex; justify-content: center; align-items: center; }
              .card-content-inner * { transform: rotate(0deg) !important; }
              .card-content-inner div[style*="pointer-events: none"] { display: none !important; }
              .card-content-inner > div { box-shadow: 0 30px 60px rgba(12,7,2,0.55) !important; }
              .panel-wrapper { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.4s cubic-bezier(0.22, 1, 0.36, 1); width: 100%; z-index: 1; will-change: grid-template-rows; }
              .sandwich-container.expanded .panel-wrapper { grid-template-rows: 1fr; }
              .panel-inner { overflow: hidden; display: flex; flex-direction: column; transform: translateZ(0); }
              .panel-light { background: ${t.surfaceAlt}; border: 1px solid ${t.lineDark}; border-top-left-radius: 12px; border-top-right-radius: 12px; border-bottom: none; }
              .panel-dark { background: ${t.dark}; border: 1px solid rgba(0,0,0,0.35); border-bottom-left-radius: 12px; border-bottom-right-radius: 12px; border-top: none; padding-top: 16px; }
              .action-btn { display: flex; align-items: center; justify-content: center; gap: 12px; width: 100%; height: 72px; background: transparent; border: none; font-family: 'Playfair Display', Georgia, serif; font-size: 19px; font-weight: 700; cursor: pointer; letter-spacing: -0.02em; line-height: 1.15; transition: transform 0.1s ease-out; }
              .action-btn:active { transform: scale(0.96); }
              .flower-btn { color: ${t.crimson}; }
              .letter-btn { color: ${t.paper}; transition: opacity 0.2s; }
              .letter-btn.hide-trigger { opacity: 0; pointer-events: none; position: absolute; }
              .letter-accordion { display: flex; flex-direction: column; overflow: hidden; height: 72px; transition: height 0.4s cubic-bezier(0.22, 1, 0.36, 1); will-change: height; position: relative; }
              .letter-accordion.input-active { height: 264px; }
              .input-area { display: flex; flex-direction: column; padding: 0 16px 20px; gap: 16px; opacity: 0; transition: opacity 0.3s ease; will-change: opacity; position: absolute; top: 0; left: 0; right: 0; pointer-events: none; }
              .letter-accordion.input-active .input-area { opacity: 1; transition-delay: 0.15s; pointer-events: auto; }
              .premium-input-container { position: relative; width: 100%; border-radius: 6px; overflow: hidden; }
              .premium-input { width: 100%; height: 110px; resize: none; border: none; padding: 16px; font-family: 'Special Elite', 'Courier New', monospace; font-size: 14.5px; color: ${t.paper}; background: ${t.darkRaised}; outline: none; line-height: 1.55; transition: background 0.2s; }
              .premium-input:focus { background: #332718; }
              .premium-input::placeholder { color: rgba(253,251,247,0.35); opacity: 1; }
              .completion-bar-bg { width: 100%; height: 3px; background: rgba(253,251,247,0.1); position: absolute; bottom: 0; left: 0; }
              .completion-bar-fill { height: 100%; background: ${t.crimson}; transition: width 0.3s ease-out; }
              .premium-send-btn { height: 52px; width: 100%; border-radius: 999px; background: rgba(253,251,247,0.08); color: rgba(253,251,247,0.35); border: none; cursor: not-allowed; font-weight: 800; font-family: 'Inter', -apple-system, sans-serif; font-size: 11px; letter-spacing: 1.8px; text-transform: uppercase; transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1); }
              .premium-send-btn.ready-to-send { background: ${t.crimson}; color: #ffffff; cursor: pointer; box-shadow: 0 8px 24px rgba(139, 26, 26, 0.4); }
              .premium-send-btn.ready-to-send:active { transform: scale(0.96); box-shadow: 0 2px 8px rgba(139, 26, 26, 0.5); }
            `}</style>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default PopoutItem;