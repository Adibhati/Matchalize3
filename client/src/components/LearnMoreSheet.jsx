import React from 'react';
import { motion } from 'framer-motion';
import { X, Mail, Info, LifeBuoy } from 'lucide-react';

/* Locked tokens — same family as ProfileCard */
const t = {
  paper: '#fdfbf7',
  surfaceAlt: '#f4f1ea',
  lineDark: '#d4c5a9',
  ink: '#1a1a1a',
  inkSoft: '#4a4a4a',
  inkMuted: '#8c8275',
  accent: '#8b4513',
  crimson: '#8b1a1a',
  grain: '', // set from design?.texture?.grain below
};

/**
 * LearnMoreSheet — Bottom-sheet for "account under review".
 * NEVER reveals scores, weights, tiers, or how many reports.
 *
 * Props:
 *   onClose: Function — callback to close the sheet
 */
const LearnMoreSheet = ({ onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(28,19,10,0.6)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'flex-end',
      }}
      onClick={onClose}
    >
      <style>{`
        .tactile-btn { transition: transform 0.15s ease-out; will-change: transform; }
        .tactile-btn:active { transform: scale(0.96) !important; }
      `}</style>

      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: '100%',
          maxHeight: '70vh',
          backgroundColor: t.paper,
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          boxShadow: '0 -14px 44px rgba(88,63,30,0.3)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grain film — same strength as every surface */}
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: `url("${t.grain}")`, mixBlendMode: 'multiply', opacity: 0.3, pointerEvents: 'none', zIndex: 1 }} />

        {/* Grabber */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, position: 'relative', zIndex: 2 }}>
          <span aria-hidden="true" style={{ width: 36, height: 4, borderRadius: 999, backgroundColor: 'rgba(212,197,169,0.7)' }} />
        </div>

        {/* Header — paper surface, Playfair title, standard close tile */}
        <div style={{
          padding: '14px 20px 16px',
          borderBottom: '1px solid rgba(212,197,169,0.7)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
          zIndex: 2,
        }}>
          <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 19, fontWeight: 800, color: t.ink, letterSpacing: '-0.02em' }}>
            Account Review
          </span>
          <button
            onClick={onClose}
            className="tactile-btn"
            aria-label="Close"
            style={{
              backgroundColor: t.surfaceAlt,
              border: '1px solid rgba(212,197,169,0.7)',
              borderRadius: 12,
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: t.ink,
            }}
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px 20px 24px', overflowY: 'auto', position: 'relative', zIndex: 2 }}>
          <p style={{ fontFamily: "'Inter', -apple-system, sans-serif", fontSize: 14.5, fontWeight: 450, color: t.inkSoft, marginBottom: 18, lineHeight: 1.6 }}>
            Your account has been flagged for review by our moderation system.
          </p>

          {/* What This Means — findings-box treatment + PanelHeader */}
          <div style={{
            backgroundColor: t.surfaceAlt,
            border: '1px solid rgba(212,197,169,0.7)',
            borderRadius: 6,
            padding: '14px 16px',
            marginBottom: 14,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Info size={12} color={t.accent} strokeWidth={2} />
              <span style={{ fontFamily: "'Inter', -apple-system, sans-serif", fontSize: 9.5, fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', color: t.inkMuted }}>
                What This Means
              </span>
            </div>
            <p style={{ fontFamily: "'Inter', -apple-system, sans-serif", fontSize: 13.5, fontWeight: 450, color: t.inkSoft, lineHeight: 1.6, margin: 0 }}>
              Our system periodically reviews accounts to ensure a safe and respectful community. During this time, certain features may be temporarily limited while our team looks into it.
            </p>
          </div>

          {/* What You Can Do */}
          <div style={{
            backgroundColor: t.surfaceAlt,
            border: '1px solid rgba(212,197,169,0.7)',
            borderRadius: 6,
            padding: '14px 16px',
            marginBottom: 22,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <LifeBuoy size={12} color={t.accent} strokeWidth={2} />
              <span style={{ fontFamily: "'Inter', -apple-system, sans-serif", fontSize: 9.5, fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', color: t.inkMuted }}>
                What You Can Do
              </span>
            </div>
            <p style={{ fontFamily: "'Inter', -apple-system, sans-serif", fontSize: 13.5, fontWeight: 450, color: t.inkSoft, lineHeight: 1.6, margin: 0 }}>
              In most cases, reviews are resolved quickly and your account returns to normal. If you believe this is a mistake, you can reach out to our support team.
            </p>
          </div>

          {/* Contact Support — the sheet's one crimson moment */}
          <a
            href="mailto:support@matchalize.com?subject=Account%20Review%20Inquiry"
            className="tactile-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              width: '100%',
              padding: '15px 16px',
              backgroundColor: t.crimson,
              border: 'none',
              borderRadius: 999,
              fontFamily: "'Inter', -apple-system, sans-serif",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '1.8px',
              textTransform: 'uppercase',
              color: '#ffffff',
              textDecoration: 'none',
              cursor: 'pointer',
              boxShadow: '0 6px 18px rgba(139,26,26,0.28)',
              boxSizing: 'border-box',
            }}
          >
            <Mail size={14} strokeWidth={2.5} />
            Contact Support
          </a>

          {/* Recorded note — typewriter */}
          <p style={{ fontFamily: "'Special Elite', 'Courier New', monospace", fontSize: 11, color: t.inkMuted, textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>
            Please use your registered email when contacting us.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LearnMoreSheet;