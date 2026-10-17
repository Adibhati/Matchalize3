// client/src/components/ProfileCardSkeleton.jsx
import React from 'react';
import neu from '../styles/neu';

/* Self-contained shimmer (sk-* namespace).
   Matches the deck card's ENTRANCE START STATE: full-bleed photo only —
   the sheet is parked below the fold while the entrance plays, so showing
   it at peek here would cause a position jump at swap-in. The sheet
   gliding up IS the "loaded" moment. */
const SKELETON_CSS = `
  @keyframes sk-sweep { from { background-position: 200% 0; } to { background-position: -200% 0; } }
  .sk-photo { background-color: #1b1b1b;
    background-image: linear-gradient(100deg, transparent 25%, rgba(255,255,255,0.06) 50%, transparent 75%);
    background-size: 200% 100%; background-repeat: no-repeat;
    animation: sk-sweep 2.2s linear infinite; }
  @media (prefers-reduced-motion: reduce) {
    .sk-photo { animation: none; }
  }
`;

const ProfileCardSkeleton = () => (
  <div
    aria-hidden="true"
    style={{
      position: 'relative', width: '100%', height: '100%',
      overflow: 'hidden', backgroundColor: neu.desk, contain: 'strict',
    }}
  >
    <style>{SKELETON_CSS}</style>

    {/* photo — full-bleed shimmer, same scrim recipe as the real card */}
    <div className="sk-photo" style={{ position: 'absolute', inset: 0 }} />
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      background: 'linear-gradient(to top, rgba(17,18,17,.65) 0%, rgba(17,18,17,.08) 44%, rgba(17,18,17,.20) 100%)',
    }} />
  </div>
);

export default ProfileCardSkeleton;