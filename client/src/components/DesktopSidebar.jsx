import React from 'react';
import { motion } from 'framer-motion';
import { Compass, Heart, User, LogOut, Bell } from 'lucide-react';
import { theme as design } from '../utils/theme';
import { triggerHaptic } from '../utils/haptics';

const tabs = [
  { key: 'discover', label: 'Discover', subtext: 'Archive', Icon: Compass },
  { key: 'matches', label: 'Matches', subtext: 'Synergy', Icon: Heart },
  { key: 'profile', label: 'Profile', subtext: 'Subject', Icon: User },
];

const DesktopSidebar = ({ activeTab, onTabChange, matchBadge = 0, onSignOut, onOpenNotifications }) => {
  const handleTabClick = (key) => {
    if (activeTab !== key) {
      triggerHaptic('light');
      onTabChange(key);
    }
  };

  return (
    <aside style={styles.sidebar}>
      {/* Paper Grain Texture */}
      <div aria-hidden="true" style={styles.grain} />

      {/* Logo / Header Area */}
      <div style={styles.header}>
        <h1 style={styles.logo}>matchalize</h1>
        <p style={styles.tagline}>Campus Ledger</p>
      </div>

      {/* Navigation Items */}
      <nav style={styles.nav}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const showBadge = tab.key === 'matches' && matchBadge > 0;

          return (
            <motion.button
              key={tab.key}
              onClick={() => handleTabClick(tab.key)}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              style={{
                ...styles.navItem,
                backgroundColor: isActive ? 'rgba(139, 69, 19, 0.08)' : 'transparent',
                borderLeft: isActive ? `3px solid ${design.color.crimson}` : '3px solid transparent',
              }}
            >
              <div style={styles.navItemLeft}>
                <tab.Icon 
                  size={20} 
                  color={isActive ? design.color.crimson : design.color.inkMuted} 
                  strokeWidth={isActive ? 2.5 : 2} 
                />
                <div style={styles.navText}>
                  <span style={{ 
                    ...styles.navLabel, 
                    color: isActive ? design.color.crimson : design.color.ink,
                    fontWeight: isActive ? 700 : 500 
                  }}>
                    {tab.label}
                  </span>
                  <span style={{ ...styles.navSubtext, opacity: isActive ? 0.8 : 0.5 }}>
                    {tab.subtext}
                  </span>
                </div>
              </div>
              
              {showBadge && (
                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  style={styles.badge}
                >
                  {matchBadge > 99 ? '99+' : matchBadge}
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Footer / Actions */}
      <div style={styles.footer}>
        <button 
          onClick={onOpenNotifications}
          style={styles.iconBtn}
          title="Letters Received"
        >
          <Bell size={20} color={design.color.inkMuted} />
        </button>
        <button 
          onClick={onSignOut}
          style={styles.iconBtn}
          title="Log Out"
        >
          <LogOut size={20} color={design.color.inkMuted} />
        </button>
      </div>
    </aside>
  );
};

const styles = {
  sidebar: {
    width: '260px',
    height: '100dvh',
    backgroundColor: design.color.paper,
    borderRight: `1px solid ${design.color.borderDark}`,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    flexShrink: 0,
    boxShadow: '4px 0 24px rgba(0,0,0,0.03)',
    zIndex: 100,
  },
  grain: {
    position: 'absolute',
    inset: 0,
    backgroundImage: `url("${design?.texture?.grain || ''}")`,
    mixBlendMode: 'multiply',
    opacity: 0.6,
    pointerEvents: 'none',
    zIndex: 1,
  },
  header: {
    padding: '32px 24px 24px',
    borderBottom: `1px solid ${design.color.border}`,
    position: 'relative',
    zIndex: 2,
  },
  logo: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '28px',
    fontWeight: 900,
    color: design.color.ink,
    margin: 0,
    letterSpacing: '-0.03em',
    textTransform: 'lowercase',
  },
  tagline: {
    fontFamily: "'Inter', sans-serif",
    fontSize: '11px',
    fontWeight: 600,
    color: design.color.inkMuted,
    margin: '4px 0 0 0',
    letterSpacing: '2px',
    textTransform: 'uppercase',
  },
  nav: {
    flex: 1,
    padding: '24px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    position: 'relative',
    zIndex: 2,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    width: '100%',
    textAlign: 'left',
  },
  navItemLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  navText: {
    display: 'flex',
    flexDirection: 'column',
  },
  navLabel: {
    fontFamily: "'Inter', sans-serif",
    fontSize: '14px',
    letterSpacing: '0.5px',
  },
  navSubtext: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '11px',
    fontStyle: 'italic',
    color: design.color.accent,
    marginTop: '2px',
  },
  badge: {
    backgroundColor: design.color.crimson,
    color: '#fff',
    fontFamily: "'Inter', sans-serif",
    fontSize: '10px',
    fontWeight: 800,
    padding: '2px 7px',
    borderRadius: '10px',
    minWidth: '20px',
    textAlign: 'center',
    boxShadow: '0 2px 4px rgba(139, 26, 26, 0.3)',
  },
  footer: {
    padding: '20px 24px',
    borderTop: `1px solid ${design.color.border}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    zIndex: 2,
  },
  iconBtn: {
    background: 'none',
    border: `1px solid ${design.color.border}`,
    borderRadius: '8px',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  }
};

export default DesktopSidebar;
