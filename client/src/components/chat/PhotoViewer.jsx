import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../../utils/haptics';
import { theme as design } from '../../utils/theme';
import { X } from 'lucide-react';

/* ==================================================================
   ARCHIVAL THEME CONSTANTS
================================================================== */
const theme = {
  paper: '#fdfbf7',
  border: '#e0d8c8',
  borderDark: '#d4c5a9',
  ink: '#1a1a1a',
  inkMuted: '#8c8275',
  accent: '#8b4513',
  shadowWarm: 'rgba(139, 69, 19, 0.15)',
};

// GPU-Promoted, Memoized Archival Corner Mounts
const CornerMounts = React.memo(() => (
  <>
    <span aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0, width: 24, height: 24, background: '#fff', clipPath: 'polygon(0 0, 100% 0, 0 100%)', zIndex: 3, filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.15))' }} />
    <span aria-hidden="true" style={{ position: 'absolute', top: 0, right: 0, width: 24, height: 24, background: '#fff', clipPath: 'polygon(100% 0, 0 0, 100% 100%)', zIndex: 3, filter: 'drop-shadow(-1px 1px 2px rgba(0,0,0,0.15))' }} />
    <span aria-hidden="true" style={{ position: 'absolute', bottom: 0, left: 0, width: 24, height: 24, background: '#fff', clipPath: 'polygon(0 100%, 100% 100%, 0 0)', zIndex: 3, filter: 'drop-shadow(1px -1px 2px rgba(0,0,0,0.15))' }} />
    <span aria-hidden="true" style={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, background: '#fff', clipPath: 'polygon(100% 100%, 0 100%, 100% 0)', zIndex: 3, filter: 'drop-shadow(-1px -1px 2px rgba(0,0,0,0.15))' }} />
  </>
));
CornerMounts.displayName = 'CornerMounts';

/* ==================================================================
   MAIN COMPONENT
================================================================== */
const PhotoViewer = ({ src, onClose }) => {
  const [scale, setScale] = useState(1);

  if (!src) return null;

  const handleTap = () => {
    if (scale > 1) {
      triggerHaptic('light');
      setScale(1);
    } else {
      triggerHaptic('medium');
      onClose();
    }
  };

  const handleDoubleClick = (e) => {
    e.stopPropagation(); // Prevents the tap handler from firing
    triggerHaptic('medium');
    setScale(scale > 1 ? 1 : 2.2);
  };

  return createPortal(
    <AnimatePresence>
      {/* Immersive Cinematic Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        onClick={handleTap}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(10, 8, 6, 0.85)',
          backgroundImage: `url("${design?.texture?.grain || ''}")`,
          backgroundSize: '150px 150px',
          backdropFilter: 'blur(6px)', // Depth of field focus pull
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          cursor: scale > 1 ? 'zoom-out' : 'pointer',
          contain: 'strict', // Absolute layout isolation
        }}
      >
        {/* Subtle Close Hint */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            position: 'absolute',
            top: 'max(24px, env(safe-area-inset-top))',
            right: '24px',
            color: 'rgba(255,255,255,0.8)',
            fontFamily: "'Inter', sans-serif",
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            zIndex: 10002,
            pointerEvents: 'none',
          }}
        >
          {scale > 1 ? 'Double-tap to unzoom' : 'Tap to close'} 
          <X size={14} strokeWidth={2.5} color="currentColor" />
        </motion.div>

        {/* Archival Photo Frame Container */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, rotate: -2, y: 20 }}
          animate={{ scale, opacity: 1, rotate: 0, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, rotate: -2, y: 20 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          onDoubleClick={handleDoubleClick}
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: '#ffffff',
            padding: '16px 16px 48px 16px',
            borderRadius: '4px',
            boxShadow: '0 40px 100px rgba(0,0,0,0.6), 0 10px 30px rgba(0,0,0,0.4)',
            border: `1px solid ${theme.borderDark}`,
            position: 'relative',
            maxWidth: '100%',
            maxHeight: '85dvh',
            cursor: scale > 1 ? 'zoom-out' : 'zoom-in',
            willChange: 'transform, opacity', // GPU Promotion
          }}
        >
          {/* Specular Room Lighting Overlay */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 50%, rgba(0,0,0,0.02) 100%)',
              pointerEvents: 'none',
              zIndex: 4,
            }}
          />

          <CornerMounts />

          {/* Artifact Image */}
          <img
            src={src}
            alt="Archival Specimen Full View"
            decoding="async" // Prevents main thread blocking on hi-res decode
            style={{
              maxWidth: '100%',
              maxHeight: '70dvh',
              objectFit: 'contain',
              borderRadius: '2px',
              display: 'block',
              border: `1px solid ${theme.border}`,
              backgroundColor: '#f4f1ea', // Fallback color while decoding
            }}
          />

          {/* Typewriter Caption */}
          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: "'Special Elite', 'Courier New', monospace",
              fontSize: '13px',
              fontWeight: 600,
              color: theme.inkMuted,
              fontStyle: 'italic',
              textAlign: 'center',
              letterSpacing: '-0.01em',
              zIndex: 5,
            }}
          >
            Archival Specimen
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default PhotoViewer;