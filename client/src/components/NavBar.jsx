import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';
import { theme as design } from '../utils/theme';
import { Compass, Heart, User } from 'lucide-react';

/* Locked tokens — same family as ProfileCard */
const t = {
  paper: '#fdfbf7',
  lineDark: '#d4c5a9',
  ink: '#1a1a1a',
  inkMuted: '#8c8275',
  crimson: '#8b1a1a',
  fontBody: design?.font?.body || "'Inter', -apple-system, sans-serif",
  grain: design?.texture?.grain || '',
};

const tabs = [
  { key: 'discover', label: 'Discover', Icon: Compass },
  { key: 'matches', label: 'Matches', Icon: Heart },
  { key: 'profile', label: 'Profile', Icon: User },
];

/* ==================================================================
   MAIN NAVBAR COMPONENT
================================================================== */
const NavBar = ({ activeTab, onTabChange, matchBadge = 0 }) => {

  const handleTabClick = (key) => {
    if (activeTab !== key) {
      triggerHaptic('light');
      onTabChange(key);
    }
  };

  return (
    <div style={styles.navContainer}>
      {/* Grain film — same strength as every surface */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: `url("${t.grain}")`, mixBlendMode: 'multiply', opacity: 0.3, pointerEvents: 'none', zIndex: 1 }} />

      <div style={styles.tabGrid}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const showBadge = tab.key === 'matches' && matchBadge > 0;

          return (
            <motion.button
              key={tab.key}
              onClick={() => handleTabClick(tab.key)}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              style={styles.tabButton}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Active indicator — one sliding crimson bar */}
              {isActive && (
                <motion.div
                  layoutId="navActiveIndicator"
                  transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                  style={styles.activeBar}
                />
              )}

              {/* Icon & badge */}
              <div style={styles.iconContainer}>
                <motion.div
                  initial={false}
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    color: isActive ? t.crimson : t.inkMuted,
                  }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  style={styles.icon}
                >
                  <tab.Icon size={18} color="currentColor" strokeWidth={isActive ? 2.5 : 2} />
                </motion.div>

                <AnimatePresence>
                  {showBadge && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: [1, 1.08, 1] }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{
                        scale: { repeat: Infinity, duration: 3, ease: 'easeInOut' },
                        default: { type: 'spring', damping: 12, stiffness: 300 },
                      }}
                      style={styles.badge}
                    >
                      <span style={styles.badgeText}>
                        {matchBadge > 99 ? '99+' : matchBadge}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <span
                style={{
                  ...styles.label,
                  color: isActive ? t.crimson : t.inkMuted,
                  fontWeight: isActive ? 800 : 600,
                }}
              >
                {tab.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

/* ==================================================================
   STYLES
================================================================== */
const styles = {
  navContainer: {
    marginTop: 'auto', // Flexbox: forces navbar to the bottom
    flexShrink: 0,
    backgroundColor: t.paper,
    borderTop: '1px solid rgba(212,197,169,0.7)',
    zIndex: 10,
    boxShadow: '0 -4px 16px rgba(88,63,30,0.1)',
    paddingBottom: 'max(6px, env(safe-area-inset-bottom))',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    contain: 'layout style',
  },
  tabGrid: {
    display: 'flex',
    position: 'relative',
    zIndex: 3,
    paddingTop: '2px',
  },
  tabButton: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2px',
    background: 'none',
    border: 'none',
    padding: '7px 0 3px',
    cursor: 'pointer',
    position: 'relative',
    outline: 'none',
    touchAction: 'manipulation', // Prevents default browser zoom/pan on double tap
  },
  iconContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '22px',
    width: '32px',
  },
  icon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    willChange: 'transform, color',
  },
  badge: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    minWidth: '18px',
    height: '18px',
    padding: '0 4px',
    borderRadius: '999px',
    backgroundColor: t.crimson,
    border: `1.5px solid ${t.paper}`,
    boxShadow: '0 2px 6px rgba(139, 26, 26, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
    willChange: 'transform',
    boxSizing: 'border-box',
  },
  badgeText: {
    fontFamily: t.fontBody,
    fontSize: '9px',
    fontWeight: 800,
    color: '#ffffff',
    letterSpacing: '0.3px',
    lineHeight: 1,
    fontVariantNumeric: 'tabular-nums',
  },
  label: {
    fontFamily: t.fontBody,
    fontSize: '10px',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    transition: 'color 0.2s ease',
  },
  activeBar: {
    position: 'absolute',
    top: 0,
    left: '50%',
    marginLeft: '-16px',
    width: '32px',
    height: '2.5px',
    backgroundColor: t.crimson,
    borderRadius: '999px',
    pointerEvents: 'none',
  },
};

export default NavBar;