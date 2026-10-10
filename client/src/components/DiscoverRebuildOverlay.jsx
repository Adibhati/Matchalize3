import React from 'react';
import neu from '../styles/neu';

/* Reuses the shimmer from ProfileCardSkeleton (sk- namespace) so the deck's
   loading language is consistent. No framer-motion — plain conditional + CSS. */
const OVERLAY_CSS = `
  @keyframes sk-sweep { from { background-position: 200% 0; } to { background-position: -200% 0; } }
  .sk-photo { background-color: #1b1b1b;
    background-image: linear-gradient(100deg, transparent 25%, rgba(255,255,255,0.06) 50%, transparent 75%);
    background-size: 200% 100%; background-repeat: no-repeat;
    animation: sk-sweep 2.2s linear infinite; }
  @media (prefers-reduced-motion: reduce) {
    .sk-photo { animation: none; }
  }
`;

const DiscoverRebuildOverlay = ({ show }) => {
  if (!show) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        inset: 0,
        /* ⚠️ MUST SIT ABOVE EVERYTHING.
         * The app already uses 99998 and 99999 for modal and toast layers. At
         * the original 9999 this overlay rendered UNDERNEATH an open modal, so
         * the one moment it exists to explain — the deck visibly changing — was
         * the moment it was hidden behind something else. */
        zIndex: 99999,
        backgroundColor: neu.desk,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        boxSizing: 'border-box',
      }}
    >
      <style>{OVERLAY_CSS}</style>

      {/* Shimmer block — same visual language as the deck skeleton */}
      <div className="sk-photo" style={{ width: 120, height: 120, borderRadius: 16, marginBottom: 20 }} />

      <div style={{
        fontFamily: neu.fontHeavy,
        fontSize: 20,
        fontWeight: 400,
        color: neu.card,
        textAlign: 'center',
        marginBottom: 6,
        letterSpacing: '-.01em',
        textTransform: 'uppercase',
      }}>
        Updating your feed
      </div>

      <div style={{
        fontFamily: neu.fontBody,
        fontSize: 14,
        fontWeight: 500,
        color: neu.ink3,
        textAlign: 'center',
        maxWidth: 280,
        lineHeight: 1.5,
      }}>
        Finding people near your current location
      </div>
    </div>
  );
};

export default DiscoverRebuildOverlay;