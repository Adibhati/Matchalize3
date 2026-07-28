import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';
import { Flower, Mail, ArrowUp } from 'lucide-react';

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
};

const GRAIN_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.05 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E`;

const PopoutItem = ({ children, targetId, onAction, type, style }) => {
  const [isPopped, setIsPopped] = useState(false);
  const [rect, setRect] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [actionSent, setActionSent] = useState(false);
  const [showSeal, setShowSeal] = useState(false);
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
    }, 280); // 280ms tactile hold
  };

  const handleTouchMove = () => clearTimeout(pressTimer.current);
  const handleTouchEnd = () => clearTimeout(pressTimer.current);
  const handleTouchCancel = () => clearTimeout(pressTimer.current);

  // ONE-SHOT DISPATCH: Flash the seal for 200ms, then trigger the page flip in the parent
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
    triggerHaptic('light');
    triggerSealAnimation(() => onAction('like', { target: targetId }));
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
            animate={{ scale: isPopped ? 1.04 : 1, zIndex: isPopped ? 100 : 1, boxShadow: isPopped ? `0 20px 40px ${theme.shadowWarm}` : '0 0px 0px transparent' }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            style={{ transform: 'translateZ(0)', willChange: 'transform' }}
          >
            {children}
          </motion.div>
        </div>
        <AnimatePresence>
          {isPopped && createPortal(
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closePopout} className="progressive-overlay" style={{ position: 'fixed', inset: 0, zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', contain: 'strict' }}>
              <motion.div initial={{ scale: 0.85, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.88, opacity: 0, y: 20 }} transition={{ type: 'spring', damping: 25, stiffness: 350 }} onClick={(e) => e.stopPropagation()} style={{ backgroundColor: theme.paper, border: `2px solid ${theme.borderDark}`, borderRadius: '24px', padding: '36px 28px 28px', width: '340px', maxWidth: '90vw', textAlign: 'center', position: 'relative', boxShadow: '0 40px 80px rgba(0,0,0,0.5)', overflow: 'hidden', transform: 'translateZ(0)' }}>
                <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: `url("${GRAIN_SVG}")`, mixBlendMode: 'multiply', opacity: 0.6, pointerEvents: 'none', zIndex: 1 }} />
                <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '26px', color: theme.ink, margin: '0 0 24px 0', fontWeight: 800, letterSpacing: '-0.03em' }}>Compatibility Scan</h4>
                <div style={{ position: 'relative', width: '140px', height: '140px', margin: '0 auto 32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `2.5px dashed ${theme.accent}`, opacity: 0.5 }} />
                  <motion.div animate={{ rotate: -360 }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} style={{ position: 'absolute', inset: '16px', borderRadius: '50%', border: `1.5px dotted ${theme.crimson}`, opacity: 0.4 }} />
                  <motion.div initial={{ scale: 1.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, type: 'spring', damping: 12 }} style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: theme.crimson, border: '4px solid #b82e2e', boxShadow: '0 8px 24px rgba(139,26,26,0.5), inset 0 2px 8px rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 900, color: '#ffffff', letterSpacing: '2.5px' }}>ALIGNED</span>
                  </motion.div>
                </div>
                <button onClick={closePopout} style={{ width: '100%', background: theme.surfaceAlt, border: `1px solid ${theme.borderDark}`, padding: '16px', borderRadius: '12px', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: theme.ink, cursor: 'pointer', boxShadow: `0 4px 12px ${theme.shadowWarm}` }}>Close Archive</button>
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
        animate={{ scale: isPopped ? 1.04 : 1, zIndex: isPopped ? 100 : 1, boxShadow: isPopped ? `0 24px 48px rgba(0,0,0,0.25), 0 0 0 2px ${theme.accent}` : '0 0px 0px transparent' }}
        transition={{ type: 'spring', damping: 22, stiffness: 300 }}
        style={{ height: '100%', transformOrigin: 'center', borderRadius: '8px', willChange: 'transform, box-shadow' }}
      >
        {children}
      </motion.div>

      {/* The Instant Reward Wax Seal */}
      <AnimatePresence>
        {showSeal && rect && createPortal(
          <motion.div initial={{ opacity: 0, scale: 2.5, rotate: -20 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ type: 'spring', damping: 14, stiffness: 200 }} style={{ position: 'fixed', top: rect.top + (rect.height / 2) - 40, left: rect.left + (rect.width / 2) - 40, width: '80px', height: '80px', zIndex: 10000, pointerEvents: 'none' }}>
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', backgroundColor: theme.crimson, border: '3px solid #a82020', boxShadow: '0 10px 25px rgba(139,26,26,0.5), inset 0 0 15px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '28px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>🌸</span>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '8px', fontWeight: 800, color: '#ffffff', letterSpacing: '2px', marginTop: '2px' }}>AFFIXED</span>
            </div>
          </motion.div>,
          document.body
        )}
      </AnimatePresence>

      {isPopped && createPortal(
        <AnimatePresence>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="progressive-overlay"
            style={{ position: 'fixed', inset: 0, zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', transform: 'translateZ(0)' }}
          >
            <div className="scrollable-safe-area" onClick={closePopout}>
              <motion.div 
                initial={{ scale: 0.75, opacity: 0, y: 40, rotate: -3 }} 
                animate={{ scale: 1, opacity: 1, y: 0, rotate: 0 }} 
                exit={{ scale: 0.65, opacity: 0, y: 80, rotate: 5 }}
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
                
                {/* 1. TOP PANEL: Fast Connection (Flower) */}
                <div className="panel-wrapper panel-top">
                  <div className="panel-inner premium-panel-light">
                    <button onClick={handleLike} disabled={actionSent} className="action-btn flower-btn">
                      <Flower size={26} strokeWidth={2.5} /> Send a Flower
                    </button>
                  </div>
                </div>

                {/* 2. CENTER PANEL: The Artifact */}
                <div className="sandwich-center" onClick={() => setIsCardExpanded(!isCardExpanded)}>
                  <div className="card-content-inner">
                    {children}
                  </div>
                </div>

                {/* 3. BOTTOM PANEL: Deep Connection (Letter) */}
                <div className="panel-wrapper panel-bottom">
                  <div className="panel-inner premium-panel-dark">
                    <div className={`letter-accordion ${showInput ? 'input-active' : ''}`}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); triggerHaptic('light'); setShowInput(true); }} 
                        disabled={actionSent || showInput}
                        className={`action-btn letter-btn ${showInput ? 'hide-trigger' : ''}`}
                      >
                        <Mail size={26} strokeWidth={2.5} /> Send a Letter
                      </button>
                      
                      <div className="input-area">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px', marginBottom: '8px' }}>
                          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Draft Correspondence</span>
                          <button onClick={(e) => { e.stopPropagation(); setShowInput(false); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <ArrowUp size={16} />
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
              .progressive-overlay { background: linear-gradient(180deg, rgba(15, 10, 8, 0.5) 0%, rgba(5, 3, 2, 0.95) 100%); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); }
              .scrollable-safe-area { width: 100%; height: 100%; position: absolute; inset: 0; overflow-y: auto; display: flex; justify-content: center; align-items: center; padding: 24px 0; -webkit-overflow-scrolling: touch; contain: strict; }
              .scrollable-safe-area::-webkit-scrollbar { display: none; }
              .sandwich-container { display: flex; flex-direction: column; align-items: center; width: 100%; max-width: 328px; position: relative; }
              .sandwich-center { position: relative; z-index: 5; width: 100%; background-color: #f9f0d0; border-radius: 16px; box-shadow: 0 16px 50px rgba(0,0,0,0.5); transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.4s cubic-bezier(0.2, 0.8, 0.2, 1); backface-visibility: hidden; }
              .sandwich-center::before { content: ''; position: absolute; inset: 0; background-image: url("${GRAIN_SVG}"); opacity: 0.12; pointer-events: none; border-radius: 16px; z-index: 0; mix-blend-mode: multiply; }
              .sandwich-container.expanded .sandwich-center { transform: scale(1.03); box-shadow: 0 30px 80px rgba(0,0,0,0.7); border: 4px solid #fdfbf7; }
              .card-content-inner .pc-hint-pulse, .card-content-inner .pc-tape { display: none !important; }
              .card-content-inner { width: 100%; transform: none !important; position: relative; z-index: 2; }
              .card-content-inner > div { transform: rotate(0deg) !important; border: none !important; box-shadow: none !important; margin: 0 !important; background: transparent !important; border-radius: 12px !important; height: auto !important; min-height: auto !important; max-height: 40vh !important; padding: 16px !important; }
              .card-content-inner img { width: 100% !important; height: 100% !important; max-height: 40vh !important; object-fit: cover !important; border-radius: 12px !important; border: 2px solid #e0d8c8 !important; display: block; }
              .panel-wrapper { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.4s cubic-bezier(0.2, 0.8, 0.2, 1); width: 96%; z-index: 1; will-change: grid-template-rows; }
              .sandwich-container.expanded .panel-wrapper { grid-template-rows: 1fr; }
              .panel-inner { overflow: hidden; display: flex; flex-direction: column; transform: translateZ(0); }
              .premium-panel-light { background: linear-gradient(180deg, #ffffff 0%, #f4f1ea 100%); border: 1px solid ${theme.borderDark}; border-top-left-radius: 20px; border-top-right-radius: 20px; border-bottom: none; padding-bottom: 16px; box-shadow: inset 0 2px 10px rgba(255,255,255,1); }
              .premium-panel-dark { background: linear-gradient(180deg, #242424 0%, #121212 100%); border: 1px solid #000; border-bottom-left-radius: 20px; border-bottom-right-radius: 20px; border-top: none; padding-top: 16px; box-shadow: inset 0 -4px 20px rgba(0,0,0,0.6); }
              .action-btn { display: flex; align-items: center; justify-content: center; gap: 12px; width: 100%; height: 72px; background: transparent; border: none; font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; cursor: pointer; letter-spacing: -0.02em; line-height: 1.15; transition: transform 0.1s cubic-bezier(0.2, 0.8, 0.2, 1); }
              .action-btn:active { transform: scale(0.97); }
              .flower-btn { color: ${theme.crimson}; text-shadow: 0 1px 2px rgba(139,26,26,0.1); }
              .letter-btn { color: ${theme.paper}; text-shadow: 0 2px 4px rgba(0,0,0,0.8); transition: opacity 0.2s; }
              .letter-btn.hide-trigger { opacity: 0; pointer-events: none; position: absolute; }
              .letter-accordion { display: flex; flex-direction: column; overflow: hidden; height: 72px; transition: height 0.4s cubic-bezier(0.2, 0.8, 0.2, 1); will-change: height; position: relative; }
              .letter-accordion.input-active { height: 264px; }
              .input-area { display: flex; flex-direction: column; padding: 0 16px 20px; gap: 16px; opacity: 0; transition: opacity 0.3s ease; will-change: opacity; position: absolute; top: 0; left: 0; right: 0; pointer-events: none; }
              .letter-accordion.input-active .input-area { opacity: 1; transition-delay: 0.15s; pointer-events: auto; }
              .premium-input-container { position: relative; width: 100%; border-radius: 12px; overflow: hidden; box-shadow: inset 0 4px 12px rgba(0,0,0,0.2); }
              .premium-input { width: 100%; height: 110px; resize: none; border: none; padding: 16px; font-family: 'Special Elite', cursive; font-size: 15px; color: ${theme.paper}; background: #333333; outline: none; line-height: 1.5; transition: background 0.2s; }
              .premium-input:focus { background: #3d3d3d; }
              .premium-input::placeholder { color: rgba(253,251,247,0.4); opacity: 1; }
              .completion-bar-bg { width: 100%; height: 3px; background: #1a1a1a; position: absolute; bottom: 0; left: 0; }
              .completion-bar-fill { height: 100%; background: ${theme.crimson}; transition: width 0.3s ease-out; box-shadow: 0 0 8px ${theme.crimson}; }
              .premium-send-btn { height: 56px; width: 100%; border-radius: 12px; background: #4a4a4a; color: rgba(255,255,255,0.4); border: none; cursor: not-allowed; font-weight: 800; font-family: 'Inter', sans-serif; font-size: 14px; letter-spacing: 1.5px; text-transform: uppercase; transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); box-shadow: inset 0 2px 4px rgba(255,255,255,0.02); }
              .premium-send-btn.ready-to-send { background: ${theme.crimson}; color: #ffffff; cursor: pointer; box-shadow: inset 0 2px 4px rgba(255,255,255,0.2), 0 8px 24px rgba(139, 26, 26, 0.4); }
              .premium-send-btn.ready-to-send:active { transform: scale(0.97); box-shadow: inset 0 1px 2px rgba(255,255,255,0.1), 0 2px 8px rgba(139, 26, 26, 0.5); }
            `}</style>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default PopoutItem;
