import React from 'react';
import { ChevronLeft } from 'lucide-react';
import neu from '../styles/neu';
import { triggerHaptic } from '../utils/haptics';

const DesktopPanelBackButton = ({ onClick, panelTitle }) => (
  <>
    <style>{`
      .desktop-panel-back {
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        flex-shrink: 0;
        color: ${neu.ink};
        background: ${neu.card};
        border: 2px solid ${neu.ink};
        border-radius: 11px;
        box-shadow: 3px 3px 0 ${neu.ink};
        cursor: pointer;
        transition: transform .08s steps(2), box-shadow .08s steps(2);
        translate: 0 -50%;
      }
      .desktop-panel-back:active {
        transform: translate(3px, 3px);
        box-shadow: 0 0 0 ${neu.ink};
      }
      .desktop-panel-back:hover { filter: brightness(1.05); }
      .desktop-panel-back:focus-visible {
        outline: 3px solid ${neu.yellow};
        outline-offset: 2px;
      }
      @media (prefers-reduced-motion: reduce) {
        .desktop-panel-back { transition: none; }
      }
    `}</style>
    <button
      type="button"
      className="desktop-panel-back"
      onClick={() => {
        triggerHaptic('light');
        onClick();
      }}
      aria-label="Back to previous screen"
      title={`Back from ${panelTitle}`}
      style={{ position: 'absolute', top: '50%', right: 20 }}
    >
      <ChevronLeft size={22} strokeWidth={2.8} />
    </button>
  </>
);

export default DesktopPanelBackButton;
