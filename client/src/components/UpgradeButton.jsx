import React from 'react';
import { Sparkles } from 'lucide-react';
import neu from '../styles/neu';

const t = neu;

const CSS = `
  .upgrade-btn { transition: transform .08s steps(2), box-shadow .08s steps(2); }
  .upgrade-btn:active { transform: translate(4px, 4px); box-shadow: 0 0 0 ${t.ink} !important; }
`;

const UpgradeButton = ({ onClick, label, full = false }) => (
  <>
    <style>{CSS}</style>
    <button
      type="button"
      className="upgrade-btn"
      onClick={onClick}
      style={{
        width: full ? '100%' : 'auto', display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: 10, padding: '14px 22px',
        backgroundColor: t.yellow, color: t.ink,
        border: `3px solid ${t.ink}`, borderRadius: 14, boxShadow: `4px 4px 0 ${t.ink}`,
        fontFamily: t.fontMono, fontSize: 13, fontWeight: 700,
        letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer',
      }}
    >
      <Sparkles size={18} strokeWidth={2.6} color={t.ink} />
      {label}
    </button>
  </>
);

export default UpgradeButton;