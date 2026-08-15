import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';
import { theme as design } from '../utils/theme';
import { Compass, Heart, User } from 'lucide-react';

/* ==================================================================
   MUSEUM-GRADE ARCHIVAL CONSTANTS
================================================================== */
const theme = {
  paper: '#fdfbf7',
  surface: '#ffffff',
  surfaceAlt: '#f4f1ea',
  border: '#e0d8c8',
  borderDark: '#d4c5a9',
  ink: '#1a1a1a',
  inkMuted: '#8c8275',
  accent: '#8b4513',
  crimson: '#8b1a1a',
  shadowWarm: 'rgba(139, 69, 19, 0.12)',
};

const tabs = [
  { key: 'discover', label: 'Discover', Icon: Compass, subtext: 'Archive' },
  { key: 'matches', label: 'Matches', Icon: Heart, subtext: 'Synergy' },
  { key: 'profile', label: 'Profile', Icon: User, subtext: 'Subject' },
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
      {/* Physical Archival Cotton-Rag Grain */}
      <div aria-hidden="true" style={styles.paperGrain} />
      
      {/* Dual Archival Binding Seam (Top Border + Stitching) */}
      <div aria-hidden="true" style={styles.topBorder} />
      <div aria-hidden="true" style={styles.stitchSeam} />

      <div style={styles.tabGrid}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const showBadge = tab.key === 'matches' && matchBadge > 0;

          return (
            <motion.button
              key={tab.key}
              onClick={() => handleTabClick(tab.key)}
              whileTap={{ scale: 0.92 }}
              transition={{ type: 'spring', damping: 15, stiffness: 400 }}
              style={styles.tabButton}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Sliding Archival Brass Bracket (Active Indicator) */}
              {isActive && (
                <motion.div
                  layoutId="activeTabBracket"
                  transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                  style={styles.activeBracket}
                >
                  {/* Miniature Brass Rivets */}
                  <span style={{ ...styles.rivet, left: '6px' }} />
                  <span style={{ ...styles.rivet, right: '6px' }} />
                  <div style={styles.bracketLine} />
                </motion.div>
              )}

              {/* Icon & Wax Seal Badge Container */}
              <div style={styles.iconContainer}>
                <motion.div
                  initial={false}
                  animate={{
                    scale: isActive ? 1.15 : 1,
                    color: isActive ? theme.crimson : theme.inkMuted,
                  }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  style={styles.icon}
                >
                  <tab.Icon size={24} color="currentColor" strokeWidth={2} />
                </motion.div>

                {/* Hot-Stamped Wax Seal Notification Badge */}
                <AnimatePresence>
                  {showBadge && (
                    <motion.div
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: [1, 1.08, 1], rotate: 0 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{
                        scale: { repeat: Infinity, duration: 3, ease: 'easeInOut' },
                        default: { type: 'spring', damping: 12, stiffness: 300 }
                      }}
                      style={styles.waxSealBadge}
                    >
                      <span style={styles.badgeText}>
                        {matchBadge > 99 ? '99+' : matchBadge}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Text Hierarchy */}
              <div style={styles.textWrapper}>
                <span
                  style={{
                    ...styles.label,
                    color: isActive ? theme.crimson : theme.inkMuted,
                    fontWeight: isActive ? 700 : 500,
                  }}
                >
                  {tab.label}
                </span>
                <span
                  style={{
                    ...styles.subtext,
                    opacity: isActive ? 0.8 : 0.4,
                    color: isActive ? theme.accent : theme.inkMuted,
                  }}
                >
                  {tab.subtext}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

/* ==================================================================
   ARCHIVAL STYLING SYSTEM
================================================================== */
const styles = {
  navContainer: {
    marginTop: 'auto', // Flexbox silver bullet: forces navbar to the bottom
    flexShrink: 0,
    backgroundColor: theme.paper,
    zIndex: 10,
    boxShadow: `0 -8px 24px ${theme.shadowWarm}`,
    paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    contain: 'layout style',
  },
  paperGrain: {
    position: 'absolute',
    inset: 0,
    backgroundImage: `url("${design?.texture?.grain || ''}")`,
    mixBlendMode: 'multiply',
    opacity: 0.85,
    pointerEvents: 'none',
    zIndex: 1,
  },
  topBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '1px',
    backgroundColor: theme.borderDark,
    zIndex: 2,
  },
  stitchSeam: {
    position: 'absolute',
    top: '3px',
    left: 0,
    right: 0,
    height: '1px',
    backgroundImage: `repeating-linear-gradient(90deg, ${theme.borderDark} 0px, ${theme.borderDark} 6px, transparent 6px, transparent 12px)`,
    opacity: 0.6,
    zIndex: 2,
  },
  tabGrid: {
    display: 'flex',
    position: 'relative',
    zIndex: 3,
    paddingTop: '6px',
  },
  tabButton: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '3px',
    background: 'none',
    border: 'none',
    padding: '8px 0 4px',
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
    height: '24px',
    width: '32px',
  },
  icon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    willChange: 'transform, color', // GPU acceleration for the scale animation
  },
  waxSealBadge: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    minWidth: '18px',
    height: '18px',
    padding: '0 4px',
    borderRadius: '10px',
    backgroundColor: theme.crimson,
    border: `1.5px solid ${theme.paper}`,
    boxShadow: '0 2px 6px rgba(139, 26, 26, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
    willChange: 'transform',
  },
  badgeText: {
    fontFamily: "'Inter', sans-serif",
    fontSize: '9px',
    fontWeight: 800,
    color: '#ffffff',
    letterSpacing: '0.3px',
    lineHeight: 1,
  },
  textWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1px',
  },
  label: {
    fontFamily: "'Inter', sans-serif",
    fontSize: '10px',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    transition: 'color 0.2s ease',
  },
  subtext: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '8px',
    fontStyle: 'italic',
    letterSpacing: '0.5px',
    transition: 'all 0.2s ease',
  },
  
  // Active Bracket Indicator
  activeBracket: {
    position: 'absolute',
    top: '-6px',
    width: '48px',
    height: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
    willChange: 'transform',
  },
  bracketLine: {
    width: '100%',
    height: '2.5px',
    backgroundColor: theme.crimson,
    borderRadius: '2px',
    boxShadow: '0 1px 4px rgba(139, 26, 26, 0.3)',
  },
  rivet: {
    position: 'absolute',
    top: '1px',
    width: '3.5px',
    height: '3.5px',
    borderRadius: design?.radius?.sm || '2px',
    backgroundColor: theme.accent,
    border: '0.5px solid #d4c5a9',
  },
};

export default NavBar;