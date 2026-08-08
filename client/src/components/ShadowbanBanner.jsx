import React from 'react';

const ShadowbanBanner = ({ score = 0, onLearnMore }) => {
  if (!score) return null;

  const percent = Math.min(100, Math.floor(score));
  const tone = percent >= 80 ? 'High' : percent >= 40 ? 'Medium' : 'Low';

  return (
    <div style={{ padding: '12px 16px', background: '#fff4f2', border: '1px solid #f2c4bf', borderRadius: 8, margin: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ width: 44, height: 44, borderRadius: 8, background: '#fff', border: '1px solid #f0d3cf', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{percent}%</div>
        <div>
          <div style={{ fontWeight: 700, color: '#8b1a1a' }}>Under Review</div>
          <div style={{ fontSize: 13, color: '#6b4a45' }}>Content moderation score: {tone}</div>
        </div>
      </div>
      <button onClick={onLearnMore} style={{ background: 'transparent', border: 0, color: '#8b1a1a', cursor: 'pointer', fontWeight: 700 }}>Learn more</button>
    </div>
  );
};

export default ShadowbanBanner;
