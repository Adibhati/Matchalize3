import React from 'react';
import { X } from 'lucide-react';
import neu from '../styles/neu';

const PASS_BUTTON_CSS = `
  .da-floatbtn {
    pointer-events: auto;
    position: relative;
    width: 46px;
    height: 46px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border: 2px solid ${neu.ink};
    border-radius: 14px;
    background: ${neu.red};
    color: #fff;
    box-shadow: 4px 4px 0 ${neu.ink};
    transition: transform .08s steps(2), box-shadow .08s steps(2);
    -webkit-tap-highlight-color: transparent;
  }

  .da-floatbtn:active {
    transform: translate(4px, 4px);
    box-shadow: 0 0 0 ${neu.ink};
  }

  .da-floatbtn:focus-visible {
    outline: 3px solid ${neu.yellow};
    outline-offset: 2px;
  }

  @media (hover: hover) and (pointer: fine) {
    .da-floatbtn:hover { filter: brightness(1.06); }
    .da-floatbtn:active { filter: none; }
  }

  @media (prefers-reduced-motion: reduce) {
    .da-floatbtn { transition: none; }
  }
`;

const DeckPassButton = ({ onClick, className = '', title = 'Pass', style, disabled = false }) => (
  <>
    <style>{PASS_BUTTON_CSS}</style>
    <button
      type="button"
      className={`da-floatbtn ${className}`.trim()}
      aria-label="Pass this profile"
      title={title}
      style={style}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        if (!disabled) onClick?.(event);
      }}
    >
      <X size={22} strokeWidth={3.2} />
    </button>
  </>
);

export default DeckPassButton;
