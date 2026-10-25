
import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';
import { Compass, Heart, User, Shuffle } from 'lucide-react';
import neu from '../styles/neu';

const C = {
  ...neu,
  ink: '#111211',
  ink2: '#383832',
  paper: '#F1EDE2',
  yellow: '#E0A15E',
  coral: '#C96F68',
  green: '#779477',
  hair: 'rgba(17,18,17,.2)',
  fontHeavy: "'Barlow Condensed', sans-serif",
  fontBody: "'Space Grotesk', sans-serif",
  fontMono: "'IBM Plex Mono', monospace",
};

const tabs = [
  { key: 'discover', label: 'Deck', Icon: Compass },
  { key: 'matches', label: 'Letters', Icon: Heart },
  { key: 'roulette', label: 'Roulette', Icon: Shuffle },
  { key: 'profile', label: 'Profile', Icon: User },
];

const NAV_CSS = `
  .nb-bar {
    position: relative;
    z-index: 50;
    flex-shrink: 0;
    width: 100%;
    box-sizing: border-box;
    padding: 8px 12px calc(8px + env(safe-area-inset-bottom, 0px));
    background: ${C.paper};
    border-top: 1px solid ${C.ink};
    box-shadow: 0 -4px 0 rgba(17,18,17,.06);
    font-family: ${C.fontBody};
    user-select: none;
    -webkit-user-select: none;
  }

  .nb-row {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    align-items: stretch;
    gap: 8px;
    width: 100%;
    max-width: 480px;
    margin: 0 auto;
  }

  .nb-tab {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    width: 100%;
    min-width: 0;
    min-height: 54px;
    padding: 5px 2px;
    border: 1px solid transparent;
    border-radius: 4px;
    background: transparent;
    color: ${C.ink};
    cursor: pointer;
    outline: none;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    transition:
      background-color .18s ease,
      border-color .18s ease,
      box-shadow .18s ease,
      color .18s ease;
  }

  .nb-tab:focus-visible {
    outline: 2px solid ${C.ink};
    outline-offset: 2px;
  }

  .nb-tab.active {
    background: #FFE76A;
    border: 2px solid #171414;
    border-radius: 12px;
    box-shadow: 3px 3px 0 #171414;
  }

  .nb-ic {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 23px;
    color: ${C.ink2};
    transition: transform .18s ease, color .18s ease;
  }

  .nb-tab.active .nb-ic {
    color: ${C.ink};
    transform: translateY(-1px);
  }

  .nb-label {
    display: block;
    max-width: 100%;
    overflow: hidden;
    color: ${C.ink2};
    font-family: ${C.fontMono};
    font-size: 9px;
    font-weight: 600;
    letter-spacing: .045em;
    line-height: 1.1;
    text-align: center;
    text-transform: uppercase;
    text-overflow: ellipsis;
    white-space: nowrap;
    transition: color .18s ease;
  }

  .nb-tab.active .nb-label {
    color: ${C.ink};
    font-weight: 700;
  }

  .nb-bar.nb-profile {
    background: #FFF9F4;
    border-top: 2px solid #171414;
    box-shadow: 0 -4px 0 rgba(23,20,20,.12);
    color: #171414;
  }

  .nb-profile .nb-tab {
    border: 1px solid transparent;
    border-radius: 4px;
    background: transparent;
    color: #171414;
    box-shadow: none;
  }

  .nb-profile .nb-tab.active {
    background: #FFE76A;
    border: 2px solid #171414;
    border-radius: 12px;
    box-shadow: 3px 3px 0 #171414;
  }

  .nb-profile .nb-ic,
  .nb-profile .nb-label,
  .nb-profile .nb-tab.active .nb-ic,
  .nb-profile .nb-tab.active .nb-label {
    color: #171414;
  }

  @media (hover: hover) and (pointer: fine) {
    .nb-profile .nb-tab:not(.active):hover {
      background: rgba(255,231,106,.28);
      border-color: transparent;
    }
  }

  .nb-badge {
    position: absolute;
    top: -5px;
    right: 4px;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 19px;
    height: 19px;
    padding: 0 4px;
    box-sizing: border-box;
    border: 1px solid ${C.ink};
    border-radius: 3px;
    background: ${C.coral};
    color: ${C.ink};
    font-family: ${C.fontMono};
    font-size: 9px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    line-height: 1;
  }

  @media (hover: hover) and (pointer: fine) {
    .nb-tab:not(.active):hover {
      background: rgba(17,18,17,.055);
      border-color: rgba(17,18,17,.15);
    }
  }

  .nb-tab:active .nb-ic {
    transform: scale(.92);
  }

  @media (max-width: 360px) {
    .nb-bar {
      padding-right: 7px;
      padding-left: 7px;
    }

    .nb-row {
      gap: 4px;
    }

    .nb-tab {
      min-height: 50px;
    }

    .nb-label {
      font-size: 8px;
      letter-spacing: .025em;
    }

    .nb-badge {
      right: 1px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .nb-ic,
    .nb-label,
    .nb-tab {
      transition: none !important;
    }
  }
`;

const NavBar = ({ activeTab, onTabChange, matchBadge = 0, variant }) => {
  const reduceMotion = useReducedMotion();

  const handleTabClick = (key) => {
    if (activeTab === key) return;

    triggerHaptic('light');
    onTabChange(key);
  };

  return (
    <nav className={`nb-bar${variant === 'profile' ? ' nb-profile' : ''}`} aria-label="Primary">
      <style>{NAV_CSS}</style>

      <div className="nb-row">
        {tabs.map(({ key, label, Icon }) => {
          const isActive = activeTab === key;
          const showBadge = key === 'matches' && matchBadge > 0;

          return (
            <motion.button
              key={key}
              type="button"
              className={`nb-tab${isActive ? ' active' : ''}`}
              onClick={() => handleTabClick(key)}
              aria-label={
                key === 'matches' && matchBadge > 0
                  ? `${label}, ${matchBadge} unread matches`
                  : label
              }
              aria-current={isActive ? 'page' : undefined}
              whileTap={reduceMotion ? undefined : { scale: 0.96 }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { type: 'spring', stiffness: 450, damping: 28 }
              }
            >
              <span className="nb-ic" aria-hidden="true">
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 1.9}
                />
              </span>

              <span className="nb-label">{label}</span>

              {showBadge && (
                <motion.span
                  key={matchBadge}
                  className="nb-badge"
                  initial={reduceMotion ? false : { scale: 0.65, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { type: 'spring', stiffness: 480, damping: 24 }
                  }
                >
                  {matchBadge > 99 ? '99+' : matchBadge}
                </motion.span>
              )}
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};

export default NavBar;
