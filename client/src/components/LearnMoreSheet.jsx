import React from 'react';

const LearnMoreSheet = ({ onClose }) => {
  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
      <div style={{ width: '100%', maxWidth: 760, background: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, boxShadow: '0 -14px 44px rgba(0,0,0,0.18)', zIndex: 2 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 20 }}>Account Review</h3>
          <button onClick={onClose} style={{ border: 0, background: 'transparent', cursor: 'pointer', fontSize: 16, fontWeight: 700 }}>Close</button>
        </div>
        <p style={{ margin: '0 0 12px', color: '#333', lineHeight: 1.6 }}>
          Your account is currently under review. While this is happening, some features like editing your profile, uploading photos, and browsing discovery may be limited.
        </p>
        <div style={{ padding: 16, background: '#f8f2ed', border: '1px solid #edd7ca', borderRadius: 14, marginBottom: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>What you can do</div>
          <ul style={{ margin: 0, paddingLeft: 20, color: '#4a403b', lineHeight: 1.7 }}>
            <li>Wait 24–48 hours while moderation completes.</li>
            <li>Keep your profile content respectful and accurate.</li>
            <li>Avoid repeated reports or non-compliant behavior.</li>
          </ul>
        </div>
        <p style={{ margin: '0 0 8px', color: '#333', lineHeight: 1.6 }}>
          If you believe this is a mistake, contact support for help.
        </p>
        <a href="mailto:support@matchalize.com" style={{ color: '#8b1a1a', fontWeight: 700 }}>support@matchalize.com</a>
      </div>
    </div>
  );
};

export default LearnMoreSheet;
