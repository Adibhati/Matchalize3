import React from 'react';

const LearnMoreSheet = ({ onClose }) => {
  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />
      <div style={{ width: '100%', maxWidth: 760, background: '#fff', borderTopLeftRadius: 12, borderTopRightRadius: 12, padding: 20, boxShadow: '0 -8px 40px rgba(0,0,0,0.12)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ margin: 0 }}>Account Review</h3>
          <button onClick={onClose} style={{ border: 0, background: 'transparent', cursor: 'pointer', fontSize: 16 }}>Close</button>
        </div>
        <p style={{ marginTop: 8, color: '#444' }}>
          Your account is currently under review. While under review some features (editing, uploads, and discovery) may be restricted. If you believe this is a mistake, contact support.
        </p>
        <p style={{ marginTop: 8, color: '#444' }}>
          This status is applied automatically based on reports and moderation signals. It helps protect the community while we investigate.
        </p>
      </div>
    </div>
  );
};

export default LearnMoreSheet;
