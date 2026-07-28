import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../utils/api'; 
import socket from '../utils/socket';
import { theme as design } from '../utils/theme';
import { triggerHaptic } from '../utils/haptics';
import { Feather, KeySquare, CheckCircle2 } from 'lucide-react';

const theme = {
  paper: '#fdfbf7',
  surfaceAlt: '#f4f1ea',
  ink: '#1a1a1a',
  inkMuted: '#8c8275',
  accent: '#8b4513',
  borderDark: '#d4c5a9',
  crimson: '#8b1a1a',
  success: '#2e7d32',
  shadowWarm: 'rgba(139, 69, 19, 0.12)',
};

const TYPEWRITER_FONT = "'Special Elite', 'Courier New', monospace";
const HEADER_FONT = design?.font?.heading || "'Playfair Display', serif";
const LABEL_FONT = design?.font?.body || "'Inter', sans-serif";

const Auth = ({ onSuccess }) => {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (step === 'otp' && inputRefs.current[0]) {
      setTimeout(() => inputRefs.current[0].focus(), 150);
    }
  }, [step]);

  // THE PHANTOM HITBOX FIX: Forces mobile browsers to recalculate touch targets when keyboard closes
  const handleInputBlur = () => {
    window.scrollTo(0, 0);
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError('');
    setLoading(true);
    triggerHaptic('medium');
    
    // Force blur to close keyboard and fix hitboxes before making API call
    if (document.activeElement) {
      document.activeElement.blur();
    }
    
    try {
      await api.post('/auth/send-otp', { email: email.trim() });
      setStep('otp');
    } catch (err) {
      const exactError = err.response?.data?.message || err.response?.data?.error || err.message;
      
      if (exactError?.includes('Network Error')) {
        setError('The courier was lost. Check your connection.');
      } else {
        setError(exactError || 'Failed to seal the letter.');
      }
      triggerHaptic('heavy');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = useCallback(async (otpValue) => {
    setError('');
    setLoading(true);
    
    // Force blur to fix hitboxes
    if (document.activeElement) {
      document.activeElement.blur();
    }

    try {
      const data = await api.post('/auth/verify-otp', { email: email.trim(), otp: otpValue });
      // Token is set as httpOnly cookie by the server Set-Cookie header
      localStorage.setItem('matchalize_user', JSON.stringify(data.user));
      
      if (socket && socket.disconnected) socket.connect();
      
      setVerified(true);
      triggerHaptic('heavy');
      
      setTimeout(() => {
        onSuccess();
      }, 1200);

    } catch (err) {
      const exactError = err.response?.data?.message || err.response?.data?.error || err.message;
      
      if (exactError?.includes('Network Error')) {
        setError('The courier was lost. Check your connection.');
      } else {
        setError(exactError || 'Invalid seal code.');
      }
      
      setOtp(['', '', '', '', '', '']);
      if (inputRefs.current[0]) inputRefs.current[0].focus();
      triggerHaptic('heavy');
      setLoading(false);
    }
  }, [email, onSuccess]);

  const handleOtpChange = (e, index) => {
    const val = e.target.value;
    
    if (val.length > 1) {
      const pasted = val.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otp];
      // Fill from current index, not from 0
      pasted.forEach((char, i) => { 
        if (index + i < 6) newOtp[index + i] = char; 
      });
      setOtp(newOtp);
      
      const nextIndex = Math.min(index + pasted.length, 5);
      inputRefs.current[nextIndex].focus();
      
      if (newOtp.every(d => d !== '')) {
        handleVerifyOtp(newOtp.join(''));
      }
      return;
    }

    if (isNaN(val)) return;
    
    const newOtp = [...otp.map((v, i) => (i === index ? val : v))];
    setOtp(newOtp);
    triggerHaptic('light');

    if (val && index < 5) {
      inputRefs.current[index + 1].focus();
    }

    if (index === 5 && val) {
      handleVerifyOtp(newOtp.join(''));
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  return (
    <div style={{
      minHeight: '100vh', // Fallback for older browsers
      minHeight: '100dvh', // Dynamic Viewport Height
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: theme.surfaceAlt,
      paddingTop: 'max(80px, env(safe-area-inset-top))',
      paddingBottom: 'max(40px, env(safe-area-inset-bottom))',
      paddingLeft: '32px',
      paddingRight: '32px',
      position: 'relative',
      // CHANGED: From 'hidden' to 'auto' to allow native scrolling and fix the Phantom Hitbox
      overflowX: 'hidden',
      overflowY: 'auto', 
      WebkitOverflowScrolling: 'touch'
    }}>

      <style>{`
        * { -webkit-tap-highlight-color: transparent; }
        
        .auth-btn { transition: transform 0.15s ease-out, box-shadow 0.15s ease-out, background-color 0.3s ease; }
        @media (hover: hover) { .auth-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 24px rgba(139, 26, 26, 0.3); } }
        .auth-btn:active:not(:disabled) { transform: scale(0.97) !important; box-shadow: 0 4px 12px rgba(139, 26, 26, 0.2) !important; transition: transform 0.05s ease-out !important; }
        
        .email-input::placeholder { color: ${theme.inkMuted}; opacity: 0.5; font-family: ${TYPEWRITER_FONT}; font-size: 16px; letter-spacing: 0px; }
        
        .stamp-box { transition: all 0.2s ease; border-bottom: 3px solid ${theme.borderDark}; }
        .stamp-box:focus { border-bottom: 3px solid ${theme.crimson}; background-color: #fff; transform: translateY(-2px); box-shadow: 0 8px 16px ${theme.shadowWarm}; }
        .stamp-box.filled { border-bottom: 3px solid ${theme.ink}; }
        .stamp-box.success { border-color: ${theme.success}; background-color: ${theme.success}; color: #fff; transform: scale(1.05); }
      `}</style>

      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: `url("${design?.texture?.grain || ''}")`, mixBlendMode: 'multiply', opacity: 0.6, pointerEvents: 'none', zIndex: 1 }} />

      <AnimatePresence mode="wait">
        {step === 'email' ? (
          <motion.div
            key="email-step"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40, scale: 0.95, filter: 'blur(4px)' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 10 }}
          >
            <div style={{ marginBottom: '40px' }}>
              <Feather size={32} color={theme.accent} strokeWidth={1.5} style={{ marginBottom: '16px' }} />
              <h2 style={{ fontFamily: HEADER_FONT, fontSize: '38px', fontWeight: '900', color: theme.ink, margin: '0 0 12px 0', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                Identify yourself.
              </h2>
              <p style={{ fontFamily: LABEL_FONT, fontSize: '15px', color: theme.inkMuted, margin: 0, lineHeight: '1.5', fontWeight: 500 }}>
                Enter your university email to pull your records from the Archives.
              </p>
            </div>

            <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div style={{ position: 'relative' }}>
                    <input
                      type="email"
                      inputMode="email"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck="false"
                      className="email-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@university.edu"
                      required
                      style={{
                        width: '100%',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderBottom: `2px solid ${theme.ink}`,
                        padding: '12px 4px',
                        fontSize: '22px',
                        color: theme.ink,
                        fontFamily: TYPEWRITER_FONT,
                        outline: 'none',
                        borderRadius: 0,
                        WebkitAppearance: 'none'
                      }}
                    />
                
                <AnimatePresence>
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }} 
                      animate={{ opacity: 1, height: 'auto' }} 
                      exit={{ opacity: 0, height: 0 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <p style={{ color: theme.crimson, fontSize: '13px', fontFamily: LABEL_FONT, fontWeight: 600, margin: '16px 0 0 0' }}>
                        {error}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="auth-btn"
                style={{
                  width: '100%', padding: '22px',
                  backgroundColor: theme.crimson, color: '#fff',
                  border: 'none', borderRadius: '14px',
                  fontFamily: LABEL_FONT, fontSize: '15px', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase',
                  cursor: (!email.trim() || loading) ? 'not-allowed' : 'pointer',
                  boxShadow: `0 8px 24px rgba(139, 26, 26, 0.25)`,
                  opacity: (!email.trim() || loading) ? 0.7 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                }}
              >
                {loading ? 'Consulting Ledger...' : 'Request Ledger Access'}
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="otp-step"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 10 }}
          >
            <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '12px', border: `1px solid ${theme.borderDark}`, boxShadow: `0 8px 16px ${theme.shadowWarm}`, display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
              <KeySquare size={24} color={theme.accent} strokeWidth={1.5} />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <p style={{ fontFamily: LABEL_FONT, fontSize: '10px', fontWeight: 800, color: theme.inkMuted, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 4px 0' }}>Dispatched To</p>
                <p style={{ fontFamily: TYPEWRITER_FONT, fontSize: '14px', color: theme.ink, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 700 }}>{email}</p>
              </div>
            </div>

            <div>
              <h3 style={{ fontFamily: HEADER_FONT, fontSize: '28px', color: theme.ink, margin: '0 0 12px 0', fontWeight: 800 }}>Break the Seal.</h3>
              <p style={{ fontFamily: LABEL_FONT, fontSize: '14px', color: theme.inkMuted, margin: '0 0 32px 0', lineHeight: 1.5 }}>
                A sealed 6-digit code has been sent to your inbox.
              </p>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <p style={{ color: theme.crimson, fontSize: '13px', fontFamily: LABEL_FONT, fontWeight: 600, margin: '0 0 24px 0' }}>
                    {error}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '32px' }}>
              {otp.map((data, index) => (
                <input
                  key={index}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6} 
                  value={data}
                  ref={(el) => (inputRefs.current[index] = el)}
                  onChange={(e) => handleOtpChange(e, index)}
                  onKeyDown={(e) => handleOtpKeyDown(e, index)}
                  className={`stamp-box ${data ? 'filled' : ''} ${verified ? 'success' : ''}`}
                  disabled={verified || loading}
                  style={{
                    width: '100%', aspectRatio: '1/1.2',
                    textAlign: 'center', fontSize: '28px', fontWeight: '700',
                    fontFamily: TYPEWRITER_FONT,
                    color: verified ? '#fff' : theme.ink,
                    backgroundColor: 'rgba(255,255,255,0.4)',
                    borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                    outline: 'none', borderRadius: '8px 8px 0 0',
                    caretColor: theme.crimson,
                    WebkitAppearance: 'none'
                  }}
                />
              ))}
            </div>

            <div>
              {verified ? (
                <motion.button
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  style={{ width: '100%', padding: '22px', backgroundColor: theme.success, color: '#fff', border: 'none', borderRadius: '14px', fontFamily: LABEL_FONT, fontSize: '16px', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', boxShadow: `0 8px 24px rgba(46, 125, 50, 0.4)` }}
                >
                  <CheckCircle2 size={24} /> Access Granted
                </motion.button>
              ) : (
                <button
                  onClick={() => { triggerHaptic('light'); setStep('email'); setError(''); setOtp(['', '', '', '', '', '']); }}
                  disabled={loading}
                  style={{ width: '100%', background: 'none', border: 'none', color: theme.accent, fontSize: '13px', fontFamily: LABEL_FONT, fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', textAlign: 'center', textDecoration: 'underline', textUnderlineOffset: '4px', opacity: loading ? 0.5 : 0.8, WebkitTapHighlightColor: 'transparent' }}
                >
                  Wrong address? Go back
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Auth;