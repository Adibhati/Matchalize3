import React, { useState, useEffect } from 'react';
import { setToastHandler } from '../utils/toast';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { theme as design } from '../utils/theme';

const ArchivalToast = () => {
  const [toast, setToast] = useState(null);
  const [timer, setTimer] = useState(null);

  useEffect(() => {
    setToastHandler((newToast) => {
      setToast(newToast);
      if (!newToast.action) {
        const t = setTimeout(() => setToast(null), 4000);
        setTimer(t);
      } else {
        if (timer) clearTimeout(timer);
      }
    });
    return () => {
      if (timer) clearTimeout(timer);
      setToastHandler(null);
    };
  }, [timer]);

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 size={20} color={design.color.success || '#2e7d32'} />,
    error: <AlertCircle size={20} color={design.color.crimson} />,
    info: <Info size={20} color={design.color.accent} />,
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -100, opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        style={{
          position: 'fixed',
          top: 'max(16px, env(safe-area-inset-top))',
          left: '16px',
          right: '16px',
          zIndex: 9999,
          backgroundColor: design.color.paper,
          backgroundImage: `url("${design?.texture?.grain || ''}")`,
          border: `1.5px solid ${toast.type === 'error' ? design.color.crimson : design.color.borderDark}`,
          borderRadius: design?.radius?.md || '12px',
          boxShadow: `0 12px 32px ${design.color.shadowWarm}`,
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div style={{
          width: '4px', height: '100%', position: 'absolute', left: 0, top: 0, bottom: 0,
          backgroundColor: toast.type === 'error' ? design.color.crimson : design.color.accent,
          borderRadius: '12px 0 0 12px'
        }} />
        <div style={{ flexShrink: 0, marginLeft: '8px' }}>{icons[toast.type]}</div>
        <p style={{
          margin: 0, fontFamily: design.font.body, fontSize: '14px', fontWeight: 600,
          color: design.color.ink, lineHeight: 1.4, flex: 1
        }}>
          {toast.message}
        </p>
        {toast.action ? (
          <button
            onClick={() => { toast.action.onClick(); setToast(null); }}
            style={{
              padding: '8px 16px',
              backgroundColor: toast.type === 'error' ? design.color.crimson : design.color.accent,
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontFamily: design.font.body,
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            {toast.action.label}
          </button>
        ) : (
          <button
            onClick={() => setToast(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: design.color.inkMuted }}
          >
            <X size={18} />
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default ArchivalToast;
