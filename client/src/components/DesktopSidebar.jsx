import React from 'react';
import { motion } from 'framer-motion';
import { Compass, Heart, User, LogOut, Bell } from 'lucide-react';
import { theme as design } from '../utils/theme';
import { triggerHaptic } from '../utils/haptics';

/* Locked tokens — same family as ProfileCard */
const t = {
  paper: '#fdfbf7',
  card: '#fffdf8',
  surfaceAlt: '#f4f1ea',
  lineDark: '#d4c5a9',
  ink: '#1a1a1a',
  inkMuted: '#8c8275',
  accent: '#8b4513',
  crimson: '#8b1a1a',
  fontDisplay: design?.font?.heading || "'Playfair Display', Georgia, serif",
  fontBody: design?.font?.body || "'Inter', -apple-system, sans-serif",
};

const tabs = [
  { key: 'discover', label: 'Discover', Icon: Compass },
  { key: 'matches', label: 'Matches', Icon: Heart },
  { key: 'profile', label: 'Profile', Icon: User },
];

const DesktopSidebar = ({ activeTab, onTabChange, matchBadge = 0, onSignOut, onOpenNotifications }) => {
  const handleTabClick = (key) => {
    if (activeTab !== key) {
      triggerHaptic('light');
      onTabChange(key);
    }
  };

  return (
    /* Floating panel: the parent shell should paint the desk behind it — backgroundColor '#ece4d4' */
    <aside
      style={{
        width: 260,
        height: 'calc(100dvh - 32px)',
        margin: 16,
        backgroundColor: t.paper,
        border: '1px solid rgba(212,197,169,0.7)',
        borderRadius: 18,
        boxShadow: '0 14px 34px rgba(88,63,30,0.16), 0 3px 8px rgba(88,63,30,0.08)',
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
          backgroundImage: `url("${design?.texture?.grain || ''}")`,
          mixBlendMode: 'multiply',
          opacity: 0.3,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Header */}
      <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid rgba(212,197,169,0.7)', position: 'relative', zIndex: 2 }}>
        <h1 style={{ fontFamily: t.fontDisplay, fontSize: 26, fontWeight: 900, color: t.ink, margin: 0, letterSpacing: '-0.02em', lineHeight: 1 }}>matchalize</h1>
        <p style={{ fontFamily: t.fontBody, fontSize: 9.5, fontWeight: 800, color: t.inkMuted, margin: '8px 0 0 0', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Campus Ledger</p>
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
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '11px 14px',
                borderRadius: 12,
                border: isActive ? '1px solid rgba(212,197,169,0.9)' : '1px solid transparent',
                backgroundColor: isActive ? t.card : 'transparent',
                boxShadow: isActive ? '0 6px 16px rgba(88,63,30,0.12)' : 'none',
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <tab.Icon size={18} color={isActive ? t.crimson : t.inkMuted} strokeWidth={isActive ? 2.5 : 2} />
                <span style={{ fontFamily: t.fontBody, fontSize: 13.5, letterSpacing: '0.3px', color: t.ink, fontWeight: isActive ? 700 : 500 }}>
                  {tab.label}
                </span>
              </div>

              {showBadge && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ backgroundColor: t.crimson, color: '#fff', fontFamily: t.fontBody, fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 999, minWidth: 20, textAlign: 'center', boxShadow: '0 2px 6px rgba(139,26,26,0.25)', fontVariantNumeric: 'tabular-nums' }}>
                  {matchBadge > 99 ? '99+' : matchBadge}
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Footer actions */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(212,197,169,0.7)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2 }}>
        <motion.button
          onClick={() => { triggerHaptic('light'); onOpenNotifications(); }}
          whileTap={{ scale: 0.94 }}
          title="Letters Received"
          style={{ backgroundColor: t.surfaceAlt, border: '1px solid rgba(212,197,169,0.7)', borderRadius: 12, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <Bell size={18} color={t.inkMuted} strokeWidth={2} />
        </motion.button>
        <motion.button
          onClick={() => { triggerHaptic('light'); onSignOut(); }}
          whileTap={{ scale: 0.94 }}
          title="Log Out"
          style={{ backgroundColor: t.surfaceAlt, border: '1px solid rgba(212,197,169,0.7)', borderRadius: 12, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <LogOut size={18} color={t.inkMuted} strokeWidth={2} />
        </motion.button>
      </div>
    </aside>
  );
};

export default DesktopSidebar;