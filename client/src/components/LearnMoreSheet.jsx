import React from 'react';
import { motion } from 'framer-motion';
import { X, Mail } from 'lucide-react';

const theme = {
  paper: '#fdfbf7',
  surface: '#ffffff',
  surfaceAlt: '#f4f1ea',
  border: '#e0d8c8',
  borderDark: '#d4c5a9',
  ink: '#1a1a1a',
  inkMuted: '#8c8275',
  inkSoft: '#4a4a4a',
  accent: '#8b4513',
  crimson: '#8b1a1a',
};

/**
 * LearnMoreSheet — Bottom-sheet for "account under review".
 * NEVER reveals scores, weights, tiers, or how many reports.
 *
 * Props:
 *   onClose: Function — callback to close the sheet
 */
const LearnMoreSheet = ({ onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(20,15,10,0.7)',
        backdropFilter: 'blur(4px)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'flex-end',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        style={{
          width: '100%',
          maxHeight: '70vh',
          backgroundColor: theme.paper,
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          boxShadow: '0 -20px 50px rgba(0,0,0,0.4)',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: `1px solid ${theme.borderDark}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: theme.surface,
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
        }}>
          <span style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '20px',
            fontWeight: 700,
            color: theme.ink,
          }}>
            Account Review
          </span>
          <button
            onClick={onClose}
            style={{
              background: theme.surfaceAlt,
              border: `1px solid ${theme.border}`,
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: theme.ink,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          <p style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '15px',
            color: theme.ink,
            marginBottom: '20px',
            lineHeight: 1.5,
          }}>
            Your account has been flagged for review by our moderation system.
          </p>

          {/* What This Means */}
          <div style={{
            backgroundColor: theme.surfaceAlt,
            border: `1px solid ${theme.border}`,
            borderRadius: '12px',
            padding: '16px 18px',
            marginBottom: '20px',
          }}>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: theme.accent,
              margin: '0 0 10px 0',
            }}>
              What This Means
            </p>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '13px',
              color: theme.inkSoft,
              lineHeight: 1.6,
              margin: 0,
            }}>
              Our system periodically reviews accounts to ensure a safe and respectful community. During this time, certain features may be temporarily limited while our team looks into it.
            </p>
          </div>

          {/* What You Can Do */}
          <div style={{
            backgroundColor: theme.surfaceAlt,
            border: `1px solid ${theme.border}`,
            borderRadius: '12px',
            padding: '16px 18px',
            marginBottom: '24px',
          }}>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: theme.accent,
              margin: '0 0 10px 0',
            }}>
              What You Can Do
            </p>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '13px',
              color: theme.inkSoft,
              lineHeight: 1.6,
              margin: 0,
            }}>
              In most cases, reviews are resolved quickly and your account returns to normal. If you believe this is a mistake, you can reach out to our support team.
            </p>
          </div>

          {/* Contact Support Button */}
          <a
            href="mailto:support@matchalize.com?subject=Account%20Review%20Inquiry"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              width: '100%',
              padding: '16px',
              backgroundColor: theme.surface,
              border: `1.5px solid ${theme.accent}`,
              borderRadius: '12px',
              fontFamily: "'Inter', sans-serif",
              fontSize: '14px',
              fontWeight: 700,
              color: theme.accent,
              textDecoration: 'none',
              cursor: 'pointer',
              letterSpacing: '0.5px',
            }}
          >
            <Mail size={18} />
            Contact Support
          </a>

          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '11px',
            color: theme.inkMuted,
            textAlign: 'center',
            marginTop: '16px',
            lineHeight: 1.4,
          }}>
            Please use your registered email when contacting us.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LearnMoreSheet;