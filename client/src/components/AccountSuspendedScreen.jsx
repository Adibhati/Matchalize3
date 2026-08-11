import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Mail } from 'lucide-react';
import { theme as design } from '../utils/theme';

const HEADER_FONT = design?.font?.heading || "'Playfair Display', serif";
const BODY_FONT = design?.font?.body || "'Inter', sans-serif";

const AccountSuspendedScreen = ({ reason: _reason, suspendedAt }) => {
  // Block back button — every press pushes them back to /auth (which shows this screen)
  useEffect(() => {
    const block = () => window.history.pushState(null, '', window.location.href);
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', block);
    return () => window.removeEventListener('popstate', block);
  }, []);

  const formattedDate = suspendedAt
    ? new Date(suspendedAt).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : null;

  return (
    <div style={{
      minHeight: '100dvh',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f4f1ea',
      padding: '32px 24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url("${design?.texture?.grain || ''}")`,
        mixBlendMode: 'multiply', opacity: 0.6, pointerEvents: 'none', zIndex: 1,
      }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        style={{
          maxWidth: '380px',
          width: '100%',
          textAlign: 'center',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <div style={{
          width: '80px', height: '80px',
          borderRadius: '50%',
          backgroundColor: 'rgba(139, 26, 26, 0.08)',
          border: '2px solid rgba(139, 26, 26, 0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 32px',
        }}>
          <Lock size={36} color="#8b1a1a" strokeWidth={1.5} />
        </div>

        <h1 style={{
          fontFamily: HEADER_FONT,
          fontSize: '28px',
          fontWeight: 800,
          color: '#1a1a1a',
          margin: '0 0 16px',
          letterSpacing: '-0.02em',
          lineHeight: 1.15,
        }}>
          Your Account Has Been Suspended
        </h1>

        <p style={{
          fontFamily: BODY_FONT,
          fontSize: '14px',
          color: '#8c8275',
          margin: '0 0 8px',
          lineHeight: 1.6,
        }}>
          Your account has been restricted for violating our community guidelines. During this time, you cannot log in, send messages, or use Matchalize.
        </p>

        {formattedDate && (
          <p style={{
            fontFamily: BODY_FONT,
            fontSize: '12px',
            color: '#8c8275',
            margin: '0 0 32px',
            fontStyle: 'italic',
          }}>
            Suspended on {formattedDate}
          </p>
        )}
        {!formattedDate && <div style={{ marginBottom: '32px' }} />}

        <a
          href={`mailto:support@matchalize.com?subject=Account Suspension Appeal&body=Hi Matchalize Support,%0D%0A%0D%0AI would like to appeal my account suspension.%0D%0A%0D%0AThank you.`}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            width: '100%', padding: '18px',
            backgroundColor: '#8b1a1a', color: '#fff',
            border: 'none', borderRadius: '14px',
            fontFamily: BODY_FONT, fontSize: '14px', fontWeight: 800,
            letterSpacing: '1px', textTransform: 'uppercase',
            textDecoration: 'none',
            boxShadow: '0 8px 24px rgba(139, 26, 26, 0.3)',
            cursor: 'pointer',
          }}
        >
          <Mail size={18} />
          Contact Support
        </a>
      </motion.div>
    </div>
  );
};

export default AccountSuspendedScreen;
