import React from 'react';
import { theme as design } from '../utils/theme';

const theme = {
  paper: '#fdfbf7',
  card: '#fffdf8',
  surfaceAlt: '#f4f1ea',
  lineDark: '#d4c5a9',
  desk: '#ece4d4',
};

/* One skeleton primitive — every placeholder is a shimmering bar */
const Bar = ({ w = '100%', h = 12, r = 6, style }) => (
  <div
    className="pc-skeleton-shimmer"
    style={{ width: w, height: h, borderRadius: r, backgroundColor: theme.surfaceAlt, position: 'relative', overflow: 'hidden', flexShrink: 0, ...style }}
  />
);

/* Matches the Panel primitive in ProfileCard exactly */
const panelStyle = {
  backgroundColor: theme.paper,
  border: '1px solid rgba(212,197,169,0.7)',
  borderRadius: 18,
  boxShadow: '0 14px 34px rgba(88,63,30,0.16), 0 3px 8px rgba(88,63,30,0.08)',
  position: 'relative',
  overflow: 'hidden',
};

const ProfileCardSkeleton = () => {
  return (
    <div
      aria-hidden="true"
      style={{
        width: '100%',
        height: '100%',
        minHeight: 0,
        backgroundColor: theme.desk,
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        padding: '16px 14px 44px 14px',
        position: 'relative',
        overflow: 'hidden',
        contain: 'paint layout style',
        boxSizing: 'border-box',
      }}
    >
      {/* Grain film — same layer as the real card */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("${design?.texture?.grain || ''}")`,
          mixBlendMode: 'multiply',
          opacity: 0.3,
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />

      {/* HERO PANEL — exact height of the real hero so swap-in is seamless */}
      <div
        className="pc-skeleton-shimmer"
        style={{
          ...panelStyle,
          width: '100%',
          height: 'calc(100dvh - 130px)',
          flexShrink: 0,
          backgroundColor: theme.surfaceAlt,
        }}
      />

      {/* COMPATIBILITY PANEL — stamp + status + findings box */}
      <div style={{ ...panelStyle, padding: '22px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 16 }}>
          <Bar w={88} h={88} r="50%" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Bar w={130} h={16} />
            <Bar w={170} h={10} />
          </div>
        </div>
        <div style={{ border: `1px solid rgba(139,69,19,0.3)`, borderRadius: 6, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Bar w="85%" h={10} />
          <Bar w="65%" h={10} />
        </div>
      </div>

      {/* VITALS PANEL — 2x2 field cells: label bar + dotted-value bar */}
      <div style={{ ...panelStyle, padding: '22px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 14px' }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i}>
            <Bar w={52} h={9} r={3} style={{ marginBottom: 8 }} />
            <Bar w="80%" h={13} r={4} style={{ borderBottom: '1.5px dotted rgba(139,69,19,0.25)', paddingBottom: 5, borderRadius: '4px 4px 0 0' }} />
          </div>
        ))}
      </div>

      {/* BIO — loose index card artifact */}
      <div style={{ ...panelStyle, borderRadius: 6, border: '1px solid rgba(139,69,19,0.25)', backgroundColor: theme.card, boxShadow: '0 8px 20px rgba(88,63,30,0.16)', minHeight: 120, padding: '20px 16px 16px 34px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}>
        <Bar w="30%" h={18} r={4} />
        <Bar w="90%" h={10} />
        <Bar w="70%" h={10} />
      </div>

      {/* SEEKING PANEL — two headed chip groups */}
      <div style={{ ...panelStyle, padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <Bar w={58} h={9} r={3} style={{ marginBottom: 12 }} />
          <div style={{ display: 'flex', gap: 10 }}>
            <Bar w={72} h={28} r={4} />
            <Bar w={64} h={28} r={4} />
          </div>
        </div>
        <div>
          <Bar w={64} h={9} r={3} style={{ marginBottom: 12 }} />
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Bar w={78} h={30} r={4} />
            <Bar w={90} h={30} r={4} />
            <Bar w={56} h={30} r={4} />
          </div>
        </div>
      </div>

      {/* EXHIBITS — 2-col artifact grid: card, photo, photo, card */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 16px', alignItems: 'center', paddingTop: 4 }}>
        <div style={{ ...panelStyle, borderRadius: 6, border: '1px solid rgba(139,69,19,0.25)', backgroundColor: theme.card, boxShadow: '0 8px 20px rgba(88,63,30,0.16)', minHeight: 130, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 9 }}>
          <Bar w="80%" h={9} />
          <Bar w="55%" h={9} />
        </div>
        <div className="pc-skeleton-shimmer" style={{ ...panelStyle, aspectRatio: '1 / 1', backgroundColor: theme.surfaceAlt }} />
        <div className="pc-skeleton-shimmer" style={{ ...panelStyle, aspectRatio: '1 / 1', backgroundColor: theme.surfaceAlt }} />
        <div style={{ ...panelStyle, borderRadius: 6, border: '1px solid rgba(139,69,19,0.25)', backgroundColor: theme.card, boxShadow: '0 8px 20px rgba(88,63,30,0.16)', minHeight: 130, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 9 }}>
          <Bar w="70%" h={9} />
          <Bar w="60%" h={9} />
        </div>
      </div>
    </div>
  );
};

export default ProfileCardSkeleton;