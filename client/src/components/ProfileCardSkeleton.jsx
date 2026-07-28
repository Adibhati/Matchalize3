import React from 'react';
import { theme as design } from '../utils/theme';

const theme = {
  paper: '#fdfbf7',
  surfaceAlt: '#f4f1ea',
  borderDark: '#d4c5a9',
  shadowWarm: 'rgba(139, 69, 19, 0.12)',
};

// Deterministic variable-tooth deckle edge (Matches ProfileCard exactly)
function buildTornEdge(teeth = 64) {
  const heights = [0, 18, 4, 22, 8, 16, 2, 24, 6, 14, 10, 20];
  const pts = ['0% 100%'];
  for (let i = 0; i <= teeth; i++) {
    const x = ((i / teeth) * 100).toFixed(2);
    const y = heights[i % heights.length];
    pts.push(`${x}% ${y}%`);
  }
  pts.push('100% 100%');
  return `polygon(${pts.join(',')})`;
}
const TORN_EDGE_CLIP = buildTornEdge();

const ProfileCardSkeleton = () => {
  return (
    <div
      aria-hidden="true"
      style={{
        width: '100%',
        height: '100%',
        minHeight: 0,
        backgroundColor: theme.paper,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        borderRadius: '0 16px 16px 0',
        overflow: 'hidden',
        boxShadow: `-15px 0 40px ${theme.shadowWarm}`,
        contain: 'paint layout style',
      }}
    >
      {/* Cinematic Film Grain Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("${design?.texture?.grain || ''}")`,
          mixBlendMode: 'multiply',
          opacity: 0.85,
          pointerEvents: 'none',
          zIndex: 15,
        }}
      />

      {/* Hero Photo Skeleton */}
      <div 
        className="pc-skeleton-shimmer"
        style={{ 
          width: '100%', 
          aspectRatio: '4/5.8', 
          flexShrink: 0,
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: theme.surfaceAlt,
        }}
      />

      {/* Torn Deckle Edge */}
      <div 
        style={{ 
          width: '100%', 
          height: '24px', 
          backgroundColor: theme.paper, 
          clipPath: TORN_EDGE_CLIP, 
          marginTop: '-14px', 
          position: 'relative', 
          zIndex: 3,
          filter: 'drop-shadow(0 -3px 3px rgba(0,0,0,0.12))'
        }} 
      />

      {/* Structural Placeholders (Prevents layout snapping on load) */}
      <div style={{ padding: '24px 24px 0 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Vitals Mockup */}
        <div>
          <div className="pc-skeleton-shimmer" style={{ width: '64px', height: '12px', borderRadius: '4px', marginBottom: '12px', position: 'relative', overflow: 'hidden', backgroundColor: theme.surfaceAlt }} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <div className="pc-skeleton-shimmer" style={{ width: '48px', height: '28px', borderRadius: '4px', position: 'relative', overflow: 'hidden', backgroundColor: theme.surfaceAlt }} />
            <div className="pc-skeleton-shimmer" style={{ width: '72px', height: '28px', borderRadius: '4px', position: 'relative', overflow: 'hidden', backgroundColor: theme.surfaceAlt }} />
            <div className="pc-skeleton-shimmer" style={{ width: '88px', height: '28px', borderRadius: '4px', position: 'relative', overflow: 'hidden', backgroundColor: theme.surfaceAlt }} />
          </div>
        </div>

        {/* Scan / Badge Mockup */}
        <div style={{ 
          height: '112px', 
          borderRadius: '16px', 
          border: `1px solid ${theme.borderDark}`,
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="pc-skeleton-shimmer" style={{ width: '120px', height: '10px', borderRadius: '4px', position: 'relative', overflow: 'hidden', backgroundColor: theme.surfaceAlt }} />
            <div className="pc-skeleton-shimmer" style={{ width: '180px', height: '24px', borderRadius: '4px', position: 'relative', overflow: 'hidden', backgroundColor: theme.surfaceAlt }} />
          </div>
          <div className="pc-skeleton-shimmer" style={{ width: '72px', height: '72px', borderRadius: '50%', position: 'relative', overflow: 'hidden', backgroundColor: theme.surfaceAlt }} />
        </div>

      </div>
    </div>
  );
};

export default ProfileCardSkeleton;
