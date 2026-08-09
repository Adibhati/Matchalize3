import React from 'react';
import { AlertTriangle } from 'lucide-react';

const ShadowbanBanner = ({ score = 0, onLearnMore }) => {
  if (!score) return null;

  const percent = Math.min(100, Math.floor(score));
  const tone = percent >= 80 ? 'High' : percent >= 40 ? 'Medium' : 'Low';
  const label = percent >= 80 ? 'Immediate review required' : percent >= 40 ? 'Under review' : 'Under observation';

  return (
    <div style={{ padding: '16px 18px', background: '#fff4f2', border: '1px solid #f2c4bf', borderRadius: 16, margin: '16px 16px 8px', display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 10px 24px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: '#fff', border: '1px solid #f0d3cf', display: 'grid', placeItems: 'center', color: '#8b1a1a' }}>
          <AlertTriangle size={20} />
        </div>
        <div>
          <div style={{ fontWeight: 700, color: '#8b1a1a', marginBottom: 4 }}>{label}</div>
          <div style={{ fontSize: 13, color: '#6b4a45' }}>Moderation score: {percent}% • {tone}</div>
        </div>
      </div>
      <button onClick={onLearnMore} style={{ background: 'transparent', border: 0, color: '#8b1a1a', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>Learn more</button>
    </div>
  );
};

export default ShadowbanBanner;
