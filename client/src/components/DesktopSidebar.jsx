import React from 'react';
import { Bell, Compass, Heart, User, Shuffle, LogOut, MoreHorizontal, Settings } from 'lucide-react';
import neu from '../styles/neu';
import { triggerHaptic } from '../utils/haptics';

const t = neu;

const tabs = [
  { key: 'discover', label: 'Deck', Icon: Compass },
  { key: 'matches', label: 'Letters', Icon: Heart },
  { key: 'roulette', label: 'Roulette', Icon: Shuffle },
  { key: 'profile', label: 'Profile', Icon: User },
];

const DesktopSidebar = ({
  activeTab,
  onTabChange,
  onLettersToggle,
  matchBadge = 0,
  notificationBadge = 0,
  onOpenNotifications,
  onSettingsToggle,
  onSignOut,
}) => {
  const [moreOpen, setMoreOpen] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);
  const [dismissedUntilLeave, setDismissedUntilLeave] = React.useState(false);

  const handleTabClick = (key) => {
    setExpanded(false);
    setDismissedUntilLeave(true);
    setMoreOpen(false);
    if (activeTab !== key) {
      triggerHaptic('light');
      onTabChange(key);
    }
  };

  const handleLettersClick = () => {
    setExpanded(false);
    setDismissedUntilLeave(true);
    setMoreOpen(false);
    triggerHaptic('light');
    onLettersToggle();
  };

  const navItems = [
      ...tabs.filter((tab) => tab.key !== 'profile').map((tab) => ({
        ...tab,
        onClick: tab.key === 'matches' ? handleLettersClick : () => handleTabClick(tab.key),
        badge: tab.key === 'matches' ? matchBadge : 0,
      })),
      { key: 'notifications', label: 'Notifications', Icon: Bell, onClick: onOpenNotifications, badge: notificationBadge },
      ...tabs.filter((tab) => tab.key === 'profile').map((tab) => ({
        ...tab,
        onClick: () => handleTabClick(tab.key),
        badge: 0,
      })),
      { key: 'settings', label: 'Settings', Icon: Settings, onClick: () => {
        setExpanded(false);
        setDismissedUntilLeave(true);
        setMoreOpen(false);
        triggerHaptic('light');
        onSettingsToggle();
      }, badge: 0 },
  ];

  return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Bowlby+One+SC&display=swap');
          .ds-instagram { width: 72px; flex: 0 0 72px; height: 100dvh; padding: 8px; box-sizing: border-box;
            background: ${t.paper}; border-right: 1px solid ${t.hair}; display: flex; flex-direction: column;
            position: absolute; inset: 0 auto 0 0; z-index: 500; overflow: hidden;
            transition: width .18s ease, padding .18s ease; }
          .ds-instagram.ds-expanded, .ds-instagram.ds-more-open {
            width: 244px; padding-inline: 12px; box-shadow: 8px 0 24px rgba(0,0,0,.12); }
          .ds-brand { height: 112px; display: flex; align-items: center; justify-content: center; padding: 0; flex: 0 0 auto; }
          .ds-brand-button { padding: 0; border: 0; background: transparent; color: ${t.ink};
            font: 400 21px/.92 'Bowlby One SC', ${t.fontHeavy}; letter-spacing: -.065em;
            text-shadow: 2.5px 2.5px 0 ${t.yellow}; cursor: pointer; }
          .ds-brand-question { display: inline-block; color: ${t.coral}; margin-left: .015em;
            transform: rotate(7deg) translateY(-.015em); transform-origin: 60% 65%; }
          .ds-brand-button:focus-visible { outline: 3px solid ${t.yellow}; outline-offset: 4px; border-radius: 4px; }
          .ds-nav { display: flex; flex-direction: column; gap: 6px; }
          .ds-item { width: 54px; min-height: 54px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; gap: 16px; padding: 0;
            border: 2px solid transparent; border-radius: 4px; background: transparent; color: ${t.ink}; text-align: left;
            font: 500 15px ${t.fontBody}; cursor: pointer; position: relative; transition: background .15s ease, transform .12s ease; }
          .ds-label, .ds-badge { display: none; }
          .ds-instagram.ds-expanded .ds-item, .ds-instagram.ds-more-open .ds-item {
            width: 100%; min-height: 52px; justify-content: flex-start; padding: 0 12px; }
          .ds-instagram.ds-expanded .ds-label, .ds-instagram.ds-more-open .ds-label { display: inline; }
          .ds-instagram.ds-expanded .ds-badge, .ds-instagram.ds-more-open .ds-badge { display: flex; }
          .ds-instagram.ds-expanded .ds-brand, .ds-instagram.ds-more-open .ds-brand {
            justify-content: flex-start; padding-inline: 12px; }
          .ds-instagram.ds-expanded .ds-brand-button, .ds-instagram.ds-more-open .ds-brand-button {
            font-size: 42px; }
          .ds-item:hover { background: #FFE76A; border: 2px solid #171414; border-radius: 12px; box-shadow: 3px 3px 0 #171414; }
          .ds-item:active { transform: scale(.985); }
          .ds-item[aria-current="page"] { font-weight: 800; }
          .ds-icon { flex: 0 0 auto; }
          .ds-item[aria-current="page"] .ds-icon { fill: #FFE76A; stroke: #171414; stroke-width: 2.4; }
          .ds-item:hover .ds-icon { fill: #FFE76A; stroke: #171414; }
          .ds-badge { min-width: 19px; height: 19px; padding: 0 5px; margin-left: auto; box-sizing: border-box;
            border-radius: 999px; border: 1px solid ${t.ink}; background: ${t.coral}; color: #fff;
            display: flex; align-items: center; justify-content: center; font: 800 10px ${t.fontBody}; }
          .ds-bottom { margin-top: auto; position: relative; }
          .ds-menu { position: absolute; left: 60px; right: auto; bottom: 0; width: 190px; padding: 6px;
            border: 1px solid ${t.hair}; border-radius: 14px; background: ${t.paper}; box-shadow: 0 8px 28px rgba(0,0,0,.14); }
          .ds-instagram.ds-expanded .ds-menu, .ds-instagram.ds-more-open .ds-menu {
            left: 0; right: 0; bottom: calc(100% + 8px); width: auto; }
          .ds-menu .ds-item { width: 100%; min-height: 44px; justify-content: flex-start; padding-inline: 10px; }
          .ds-menu .ds-label { display: inline; }
          .ds-item:focus-visible { outline: 3px solid ${t.yellow}; outline-offset: 2px; }
          @media (prefers-reduced-motion: reduce) { .ds-instagram, .ds-item { transition: none; } }
        `}</style>
        <aside
          className={`ds-instagram${expanded && !dismissedUntilLeave ? ' ds-expanded' : ''}${moreOpen ? ' ds-more-open' : ''}`}
          aria-label="Main navigation"
          onMouseEnter={() => {
            setDismissedUntilLeave(false);
            setExpanded(true);
          }}
          onMouseLeave={() => {
            setDismissedUntilLeave(false);
            setExpanded(false);
            setMoreOpen(false);
          }}
          onFocus={() => {
            if (!dismissedUntilLeave) setExpanded(true);
          }}
        >
          <div className="ds-brand">
            <h1 style={{ margin: 0, lineHeight: 1 }}>
              <button
                type="button"
                className="ds-brand-button"
                aria-label="huh? home"
                onClick={() => handleTabClick('discover')}
              >
                huh<span className="ds-brand-question">?</span>
              </button>
            </h1>
          </div>

          <nav className="ds-nav" aria-label="Primary">
            {navItems.map(({ key, label, Icon, onClick, badge }) => {
              const isActive = activeTab === key;
              return (
                <button
                  key={key}
                  type="button"
                  className="ds-item"
                  onClick={onClick}
                  aria-label={label}
                  aria-current={isActive ? 'page' : undefined}
                  title={label}
                >
                  <Icon className="ds-icon" size={24} strokeWidth={isActive ? 2.6 : 1.9} />
                  <span className="ds-label">{label}</span>
                  {badge > 0 && (
                    <span className="ds-badge" aria-label={`${badge} ${label === 'Letters' ? 'unread' : 'unread notifications'}`}>
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="ds-bottom">
            {moreOpen && (
              <div className="ds-menu" role="menu">
                <button
                  type="button"
                  className="ds-item"
                  role="menuitem"
                  onClick={() => { setMoreOpen(false); triggerHaptic('light'); onSignOut(); }}
                >
                  <LogOut className="ds-icon" size={22} />
                  <span className="ds-label">Log Out</span>
                </button>
              </div>
            )}
            <button
              type="button"
              className="ds-item"
              aria-label="More"
              aria-expanded={moreOpen}
              aria-haspopup="menu"
              title="More"
              onClick={() => {
                triggerHaptic('light');
                setExpanded(true);
                setDismissedUntilLeave(false);
                setMoreOpen((open) => !open);
              }}
            >
              <MoreHorizontal className="ds-icon" size={24} />
              <span className="ds-label">More</span>
            </button>
          </div>
        </aside>
      </>
    );
};

export default DesktopSidebar;