import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { API_BASE } from '../../utils/api';
import { triggerHaptic } from '../../utils/haptics';
import { theme as design } from '../../utils/theme';
import { toast } from '../../utils/toast';

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



const Icon = ({ path, size = 20, color = 'currentColor', strokeWidth = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {path}
  </svg>
);

const ReportModal = ({ reportedUserId, onClose, onReported }) => {
  const [reasons, setReasons] = useState([]);
  const [selectedReason, setSelectedReason] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadReasons = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/report/reasons`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setReasons(data.reasons || []);
        }
      } catch (err) {
        console.error('Failed to fetch report reasons:', err);
      } finally {
        setLoading(false);
      }
    };
    loadReasons();
  }, []);

  const handleSubmit = async () => {
    if (!selectedReason) {
      toast.error('Please select a reason for reporting.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/report/${reportedUserId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          reason: selectedReason,
          details: details.trim(),
        }),
      });

      if (res.ok) {
        triggerHaptic('heavy');
        onReported();
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to submit report');
      }
    } catch (err) {
      console.error('Report submission failed:', err);
      toast.error(`Failed to submit report: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

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
          maxHeight: '85vh',
          backgroundColor: theme.paper,
          backgroundImage: `url("${design.texture.grain}")`,
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
            Report User
          </span>
          <button
            onClick={onClose}
            style={{
              background: theme.surfaceAlt,
              border: `1px solid ${theme.border}`,
              borderRadius: design.radius.md,
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: theme.ink,
            }}
          >
            <Icon path={<><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>} size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: theme.inkMuted,
              fontFamily: "'Inter', sans-serif",
              fontSize: '13px',
            }}>
              Loading report options...
            </div>
          ) : (
            <>
              <p style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: '15px',
                color: theme.ink,
                marginBottom: '20px',
                lineHeight: 1.5,
              }}>
                Help us understand why you're reporting this user. Your report will be reviewed by our moderation team.
              </p>

              {/* Reason Selection */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  color: theme.accent,
                  marginBottom: '12px',
                }}>
                  Reason for Report
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {reasons.map((reason) => (
                    <motion.button
                      key={reason}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSelectedReason(reason);
                        triggerHaptic('light');
                      }}
                      style={{
                        padding: '14px 16px',
                        backgroundColor: selectedReason === reason ? 'rgba(139, 26, 26, 0.08)' : theme.surface,
                        border: `1.5px solid ${selectedReason === reason ? theme.crimson : theme.border}`,
                        borderRadius: '10px',
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '14px',
                        fontWeight: selectedReason === reason ? 600 : 500,
                        color: selectedReason === reason ? theme.crimson : theme.ink,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s',
                      }}
                    >
                      {reason}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Details (Optional) */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  color: theme.accent,
                  marginBottom: '12px',
                }}>
                  Additional Details (Optional)
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Provide any additional context..."
                  maxLength={500}
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    padding: '14px',
                    backgroundColor: theme.surfaceAlt,
                    border: `1.5px solid ${theme.border}`,
                    borderRadius: '10px',
                    fontFamily: "'Special Elite', cursive",
                    fontSize: '14px',
                    color: theme.ink,
                    outline: 'none',
                    resize: 'none',
                    lineHeight: 1.6,
                  }}
                />
                <div style={{
                  textAlign: 'right',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '11px',
                  color: theme.inkMuted,
                  marginTop: '6px',
                }}>
                  {details.length}/500
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSubmit}
                disabled={submitting || !selectedReason}
                style={{
                  width: '100%',
                  padding: '16px',
                  backgroundColor: theme.crimson,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '14px',
                  fontWeight: 700,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  cursor: submitting || !selectedReason ? 'not-allowed' : 'pointer',
                  opacity: submitting || !selectedReason ? 0.5 : 1,
                  boxShadow: '0 4px 16px rgba(139, 26, 26, 0.3)',
                }}
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </motion.button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ReportModal;
