import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../utils/api';
import socket from '../utils/socket';
import { theme as design } from '../utils/theme';
import { triggerHaptic } from '../utils/haptics';
import { Feather, KeySquare, CheckCircle2 } from 'lucide-react';
import AccountSuspendedScreen from '../components/AccountSuspendedScreen';

/* Locked tokens — same family as ProfileCard */
const t = {
  desk: '#ece4d4',
  paper: '#fdfbf7',
  card: '#fffdf8',
  surfaceAlt: '#f4f1ea',
  lineDark: '#d4c5a9',
  ink: '#1a1a1a',
  inkSoft: '#4a4a4a',
  inkMuted: '#8c8275',
  accent: '#8b4513',
  crimson: '#8b1a1a',
  success: '#2e7d32',
  fontDisplay: design?.font?.heading || "'Playfair Display', Georgia, serif",
  fontBody: design?.font?.body || "'Inter', -apple-system, sans-serif",
  fontType: "'Special Elite', 'Courier New', monospace",
  grain: design?.texture?.grain || '',
};

const Auth = ({ onSuccess }) => {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);
  const inputRefs = useRef([]);

  const [suspendedData, setSuspendedData] = useState(() => {
    try {
      const data = JSON.parse(localStorage.getItem('matchalize_suspended'));
      return data?.reason ? data : null;
    } catch { return null; }
  });

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
        setError(exactError || 'Failed to send the code.');
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

      // If this was a suspension, show the lock screen
      try {
        const susData = JSON.parse(localStorage.getItem('matchalize_suspended'));
        if (susData?.reason) { setSuspendedData(susData); return; }
      } catch {}

      if (exactError?.includes('Network Error')) {
        setError('The courier was lost. Check your connection.');
      } else {
        setError(exactError || 'Invalid code.');
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

  if (suspendedData) {
    return <AccountSuspendedScreen reason={suspendedData.reason} suspendedAt={suspendedData.suspendedAt} />;
  }

  return (
    <div style={{
      minHeight: '100vh', // Fallback for older browsers
      minHeight: '100dvh', // Dynamic Viewport Height
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.desk,
      padding: 'max(24px, env(safe-area-inset-top)) 16px max(24px, env(safe-area-inset-bottom))',
      boxSizing: 'border-box',
      position: 'relative',
      // CHANGED: From 'hidden' to 'auto' to allow native scrolling and fix the Phantom Hitbox
      overflowX: 'hidden',
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch',
    }}>

      <style>{`
        * { -webkit-tap-highlight-color: transparent; }

        .auth-btn { transition: transform 0.15s ease-out, box-shadow 0.15s ease-out; will-change: transform; }
        @media (hover: hover) { .auth-btn:hover:not(:disabled) { transform: translateY(-1px); } }
        .auth-btn:active:not(:disabled) { transform: scale(0.96) !important; }

        .email-input::placeholder { color: ${t.inkMuted}; opacity: 0.5; font-family: ${t.fontType}; font-size: 16px; letter-spacing: 0px; }

        .stamp-box { transition: border-color 0.2s ease, background-color 0.2s ease, transform 0.2s ease; border-bottom: 2.5px solid ${t.lineDark}; }
        .stamp-box:focus { border-bottom-color: ${t.crimson}; background-color: #fff; }
        .stamp-box.filled { border-bottom-color: ${t.ink}; }
        .stamp-box.success { border-bottom-color: ${t.success}; background-color: ${t.success}; color: #fff; transform: translateY(-3px); }
      `}</style>

      {/* Grain film — same strength as every surface */}
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, backgroundImage: `url("${t.grain}")`, mixBlendMode: 'multiply', opacity: 0.3, pointerEvents: 'none', zIndex: 1 }} />

      {/* The floating paper panel */}
      <div style={{
        width: '100%',
        maxWidth: 400,
        backgroundColor: t.paper,
        border: '1px solid rgba(212,197,169,0.7)',
        borderRadius: 18,
        boxShadow: '0 14px 34px rgba(88,63,30,0.16), 0 3px 8px rgba(88,63,30,0.08)',
        padding: '36px 28px 32px',
        boxSizing: 'border-box',
        position: 'relative',
        zIndex: 2,
      }}>

        <AnimatePresence mode="wait">
          {step === 'email' ? (
            <motion.div
              key="email-step"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Standard icon tile */}
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: t.surfaceAlt,
                border: '1px solid rgba(212,197,169,0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
              }}>
                <Feather size={20} color={t.accent} strokeWidth={1.75} />
              </div>

              <h2 style={{ fontFamily: t.fontDisplay, fontSize: 32, fontWeight: 800, color: t.ink, margin: '0 0 10px 0', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                Identify yourself.
              </h2>
              <p style={{ fontFamily: t.fontBody, fontSize: 14, fontWeight: 450, color: t.inkMuted, margin: '0 0 32px 0', lineHeight: 1.55 }}>
                Enter your university email to pull your records from the Archives.
              </p>

              <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
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
                      borderBottom: `2px solid ${t.ink}`,
                      padding: '10px 4px',
                      fontSize: 20,
                      color: t.ink,
                      fontFamily: t.fontType,
                      outline: 'none',
                      borderRadius: 0,
                      WebkitAppearance: 'none',
                      boxSizing: 'border-box',
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
                        <p style={{ color: t.crimson, fontSize: 13, fontFamily: t.fontBody, fontWeight: 600, margin: '14px 0 0 0' }}>
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
                    width: '100%',
                    padding: '17px',
                    backgroundColor: t.crimson,
                    color: '#fff',
                    border: 'none',
                    borderRadius: 999,
                    fontFamily: t.fontBody,
                    fontSize: 11.5,
                    fontWeight: 800,
                    letterSpacing: '1.8px',
                    textTransform: 'uppercase',
                    cursor: (!email.trim() || loading) ? 'not-allowed' : 'pointer',
                    boxShadow: '0 6px 18px rgba(139, 26, 26, 0.28)',
                    opacity: (!email.trim() || loading) ? 0.4 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                  }}
                >
                  {loading ? 'Sending...' : 'Send Code'}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="otp-step"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Dispatched-to card — box tier */}
              <div style={{
                backgroundColor: t.card,
                padding: '14px 16px',
                borderRadius: 6,
                border: '1px solid rgba(212,197,169,0.7)',
                boxShadow: '0 4px 12px rgba(88,63,30,0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 30,
              }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor: t.surfaceAlt,
                  border: '1px solid rgba(212,197,169,0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <KeySquare size={16} color={t.accent} strokeWidth={2} />
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <p style={{ fontFamily: t.fontBody, fontSize: 9.5, fontWeight: 800, color: t.inkMuted, textTransform: 'uppercase', letterSpacing: '1.5px', margin: '0 0 3px 0' }}>Dispatched To</p>
                  <p style={{ fontFamily: t.fontType, fontSize: 13.5, color: t.ink, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{email}</p>
                </div>
              </div>

              <h3 style={{ fontFamily: t.fontDisplay, fontSize: 26, color: t.ink, margin: '0 0 8px 0', fontWeight: 800, letterSpacing: '-0.02em' }}>Break the Seal.</h3>
              <p style={{ fontFamily: t.fontBody, fontSize: 14, fontWeight: 450, color: t.inkMuted, margin: '0 0 28px 0', lineHeight: 1.55 }}>
                A 6-digit code has been sent to your inbox.
              </p>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <p style={{ color: t.crimson, fontSize: 13, fontFamily: t.fontBody, fontWeight: 600, margin: '0 0 22px 0' }}>
                      {error}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 28 }}>
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
                      width: '100%',
                      aspectRatio: '1 / 1.15',
                      textAlign: 'center',
                      fontSize: 26,
                      fontWeight: 700,
                      fontFamily: t.fontType,
                      color: verified ? '#fff' : t.ink,
                      backgroundColor: 'rgba(255,255,255,0.55)',
                      border: 'none',
                      borderBottom: `2.5px solid ${t.lineDark}`,
                      outline: 'none',
                      borderRadius: 4,
                      caretColor: t.crimson,
                      WebkitAppearance: 'none',
                    }}
                  />
                ))}
              </div>

              <div>
                {verified ? (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                      width: '100%',
                      padding: '17px',
                      backgroundColor: t.success,
                      color: '#fff',
                      border: 'none',
                      borderRadius: 999,
                      fontFamily: t.fontBody,
                      fontSize: 11.5,
                      fontWeight: 800,
                      letterSpacing: '1.8px',
                      textTransform: 'uppercase',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 10,
                      boxShadow: '0 6px 18px rgba(46, 125, 50, 0.3)',
                      boxSizing: 'border-box',
                    }}
                  >
                    <CheckCircle2 size={16} strokeWidth={2.5} /> Access Granted
                  </motion.div>
                ) : (
                  <button
                    onClick={() => { triggerHaptic('light'); setStep('email'); setError(''); setOtp(['', '', '', '', '', '']); }}
                    disabled={loading}
                    style={{ width: '100%', background: 'none', border: 'none', color: t.accent, fontSize: 13, fontFamily: t.fontBody, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', textAlign: 'center', textDecoration: 'underline', textUnderlineOffset: '4px', opacity: loading ? 0.5 : 0.8, WebkitTapHighlightColor: 'transparent' }}
                  >
                    Wrong address? Go back
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Auth;