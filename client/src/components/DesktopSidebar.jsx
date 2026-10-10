import React from 'react';
import { motion } from 'framer-motion';
import { Compass, Heart, User, Shuffle, LogOut } from 'lucide-react';
import neu from '../styles/neu';
import { triggerHaptic } from '../utils/haptics';

const t = neu;

const tabs = [
  { key: 'discover', label: 'Deck', Icon: Compass },
  { key: 'matches', label: 'Letters', Icon: Heart },
  { key: 'roulette', label: 'Roulette', Icon: Shuffle },
  { key: 'profile', label: 'Profile', Icon: User },
];

const DesktopSidebar = ({ activeTab, onTabChange, matchBadge = 0, onSignOut }) => {
  const handleTabClick = (key) => {
    if (activeTab !== key) {
      triggerHaptic('light');
      onTabChange(key);
    }
  };

  return (
    /* Floating panel: the parent shell should paint the desk behind it — backgroundColor 'var(--desk)' */
    <aside
      style={{
        width: 260,
        height: 'calc(100dvh - 32px)',
        margin: 16,
        backgroundColor: t.paper,
        border: `2px solid ${t.ink}`,
        borderRadius: t.radius.lg,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        flexShrink: 0,
        overflow: 'hidden',
        boxSizing: 'border-box',
        zIndex: 100,
      }}
    >
      {/* Grain — same film, same strength as the card */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("${t.grain || ''}")`,
          mixBlendMode: 'multiply',
          opacity: 0.3,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Header */}
      <div style={{ padding: '22px 20px 18px', borderBottom: `1px solid ${t.ink}`, position: 'relative', zIndex: 2 }}>
        <h1 style={{ fontFamily: t.fontHeavy, fontSize: 26, fontWeight: 900, color: t.ink, margin: 0, letterSpacing: '-0.02em', lineHeight: 1 }}>matchalize</h1>
        <p style={{ fontFamily: t.fontBody, fontSize: 9.5, fontWeight: 800, color: t.ink3, margin: '8px 0 0 0', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Campus Ledger</p>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 8, position: 'relative', zIndex: 2 }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const showBadge = tab.key === 'matches' && matchBadge > 0;

          return (
            <motion.button
              key={tab.key}
              onClick={() => handleTabClick(tab.key)}
              whileHover={isActive ? {} : { x: 3 }}
              whileTap={{ scale: 0.98 }}
              className="slam slam-sm"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '11px 14px',
                borderRadius: t.radius.md,
                border: isActive ? `2px solid ${t.ink}` : '2px solid transparent',
                backgroundColor: isActive ? t.card : 'transparent',
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <tab.Icon size={18} color={isActive ? t.coral : t.ink3} strokeWidth={isActive ? 2.5 : 2} />
                <span style={{ fontFamily: t.fontBody, fontSize: 13.5, letterSpacing: '0.3px', color: t.ink, fontWeight: isActive ? 700 : 500 }}>
                  {tab.label}
                </span>
              </div>

              {showBadge && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ backgroundColor: t.coral, color: '#fff', fontFamily: t.fontBody, fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 999, minWidth: 20, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
                  {matchBadge > 99 ? '99+' : matchBadge}
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Footer actions — notifications live in the top Header on desktop, so only logout lives here. */}
      <div style={{ padding: '16px 20px', borderTop: `1px solid ${t.ink}`, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', position: 'relative', zIndex: 2 }}>
        <motion.button
          onClick={() => { triggerHaptic('light'); onSignOut(); }}
          whileTap={{ scale: 0.94 }}
          title="Log Out"
          style={{ backgroundColor: t.card, border: `2px solid ${t.ink}`, borderRadius: t.radius.md, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <LogOut size={18} color={t.ink3} strokeWidth={2} />
        </motion.button>
      </div>
    </aside>
  );
};

export default DesktopSidebar;