import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { api } from '../../utils/api';
import { triggerHaptic } from '../../utils/haptics';

import { toast } from '../../utils/toast';
import neu from '../../styles/neu';

/* ==================================================================
   DECK AESTHETIC — the shared neo-brutalist canon (src/styles/neu.js).
   Fonts (Archivo Black / Space Mono / Inter) are loaded once in
   index.html — no @import here.
================================================================== */
const F = {
  heavy: neu.fontHeavy,
  body: neu.fontBody,
  mono: neu.fontMono,
};
const C = neu;

const MAX_DETAILS = 500;

const REPORT_SHEET_CSS = `
  .rm-root { font-family: ${F.body}; color: ${C.ink}; -webkit-font-smoothing: antialiased; }
  .rm-root ::selection { background: ${C.yellow}; color: ${C.ink}; }

  .rm-backdrop {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding:
      max(16px, env(safe-area-inset-top))
      max(12px, env(safe-area-inset-right))
      max(16px, env(safe-area-inset-bottom))
      max(12px, env(safe-area-inset-left));
    overflow-y: auto;
    background: rgba(19,19,19,.62);
    backdrop-filter: blur(2px);
  }

  .rm-dialog {
    box-sizing: border-box;
    width: 100%;
    max-width: 460px;
    max-height: calc(100vh - 32px);
    margin: 0;
    overflow: hidden;
    overscroll-behavior: contain;
  }

  @supports (height: 100dvh) {
    .rm-dialog {
      max-height: calc(100dvh - max(16px, env(safe-area-inset-top)) - max(16px, env(safe-area-inset-bottom)));
    }
  }

  @media (min-width: 600px) {
    .rm-backdrop { align-items: center; }
  }

  /* sheet — same recipe as .pc-sheet: cream, 2px ink border, ONE big shadow */
  .rm-sheet { background: ${C.paper}; border: 2px solid ${C.ink}; border-radius: 22px;
    box-shadow: 8px 8px 0 ${C.ink}; -webkit-tap-highlight-color: transparent; }
  .rm-grabber { width: 48px; height: 6px; border-radius: 999px; margin: 0 auto; flex-shrink: 0;
    background: ${C.ink}; transition: none; }
  .rm-sheet:active .rm-grabber { background: ${C.yellow}; }

  /* title — pc-name marker highlight */
  .rm-title { font-family: ${F.heavy}; font-size: 24px; font-weight: 400; letter-spacing: -.01em;
    line-height: 1.08; color: ${C.ink}; margin: 0;
    background-image: linear-gradient(180deg, transparent 58%, ${C.yellow} 58%);
    padding: 0 6px 3px 0; }
  .rm-sub { font-family: ${F.body}; font-size: 13.5px; font-weight: 450; color: ${C.ink2};
    line-height: 1.55; margin: 10px 0 0; }

  /* close — pc-iconbtn physics */
  .rm-close { width: 42px; height: 42px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
    cursor: pointer; border: 2px solid ${C.ink}; border-radius: 12px; background: ${C.card}; color: ${C.ink};
    box-shadow: 4px 4px 0 ${C.ink};
    transition: transform .08s steps(2), box-shadow .08s steps(2), background .08s steps(2); }
  .rm-close:active { transform: translate(4px, 4px); box-shadow: 0 0 0 ${C.ink}; background: ${C.ink}; color: ${C.paper}; }
  .rm-close:focus-visible { outline: 3px solid ${C.yellow}; outline-offset: 2px; }

  /* section heads — marker square + mono label (pc-shead) */
  .rm-shead { display: flex; align-items: center; gap: 10px; margin: 0 0 12px; }
  .rm-mark { width: 11px; height: 11px; flex-shrink: 0; border: 2px solid ${C.ink}; border-radius: 3px; }
  .rm-stitle { font-family: ${F.mono}; font-size: 12px; font-weight: 700; letter-spacing: .18em;
    text-transform: uppercase; color: ${C.ink}; }

  /* reason rows — pc-card chunky buttons */
  .rm-reason { display: block; width: 100%; text-align: left; padding: 13px 14px; cursor: pointer;
    background: ${C.card}; border: 2px solid ${C.ink}; border-radius: 14px;
    font-family: ${F.body}; font-size: 14px; font-weight: 500; color: ${C.ink};
    box-shadow: 3px 3px 0 ${C.ink};
    transition: transform .08s steps(2), box-shadow .08s steps(2), background .08s steps(2);
    -webkit-tap-highlight-color: transparent; }
  .rm-reason + .rm-reason { margin-top: 10px; }
  .rm-reason:active { transform: translate(3px, 3px); box-shadow: 0 0 0 ${C.ink}; }
  .rm-reason.selected { background: ${C.yellow}; font-weight: 700; box-shadow: 5px 5px 0 ${C.ink}; }
  .rm-reason:disabled { cursor: not-allowed; }
  .rm-reason:focus-visible { outline: 3px solid ${C.yellow}; outline-offset: 2px; }

  /* textarea — pc-card */
  .rm-textarea { width: 100%; min-height: 96px; padding: 13px 14px; resize: none; outline: none;
    background: ${C.card}; border: 2px solid ${C.ink}; border-radius: 14px; box-shadow: 3px 3px 0 ${C.ink};
    font-family: ${F.body}; font-size: 14px; color: ${C.ink}; line-height: 1.55; box-sizing: border-box; }
  .rm-textarea::placeholder { color: ${C.ink3}; }
  .rm-textarea:focus-visible { outline: 3px solid ${C.yellow}; outline-offset: 2px; }
  .rm-count { text-align: right; margin-top: 6px; font-family: ${F.mono}; font-size: 10px;
    color: ${C.ink3}; font-variant-numeric: tabular-nums; }

  /* submit — the one red moment (pc-menubtn red), pc-iconbtn physics */
  .rm-submit { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 14px 16px;
    cursor: pointer; background: ${C.red}; color: #fff; border: 2px solid ${C.ink}; border-radius: 14px;
    box-shadow: 4px 4px 0 ${C.ink}; font-family: ${F.mono}; font-size: 12px; font-weight: 700;
    letter-spacing: .14em; text-transform: uppercase;
    transition: transform .08s steps(2), box-shadow .08s steps(2), background .08s steps(2);
    -webkit-tap-highlight-color: transparent; }
  .rm-submit:active:not(:disabled) { transform: translate(4px, 4px); box-shadow: 0 0 0 ${C.ink}; }
  .rm-submit:disabled { opacity: .45; cursor: not-allowed; }
  .rm-submit:focus-visible { outline: 3px solid ${C.yellow}; outline-offset: 2px; }

  /* retry — white utility */
  .rm-retry { padding: 10px 22px; cursor: pointer; background: ${C.card}; color: ${C.ink};
    border: 2px solid ${C.ink}; border-radius: 12px; box-shadow: 4px 4px 0 ${C.ink};
    font-family: ${F.mono}; font-size: 12px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase;
    transition: transform .08s steps(2), box-shadow .08s steps(2); }
  .rm-retry:active { transform: translate(4px, 4px); box-shadow: 0 0 0 ${C.ink}; }

  @media (prefers-reduced-motion: reduce) {
    .rm-close, .rm-reason, .rm-submit, .rm-retry { transition: none; }
  }
`;

/**
 * ReportModal — bottom-sheet for reporting a user, on the Deck tab.
 * Aesthetic: ProfileCard.jsx (neubrutalism). Rendered through a portal to
 * <body> so it stacks ABOVE the floating deck chrome (header row z 500,
 * DeckActions × z 500) regardless of where it is mounted.
 *
 * Props:
 *   reportedUserId: string — the user being reported
 *   onClose: Function — dismiss callback
 *   onReported: Function — success callback (parent owns the success toast)
 */
const ReportModal = ({ reportedUserId, onClose, onReported }) => {
  const [reasons, setReasons] = useState([]);
  const [selectedReason, setSelectedReason] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const sheetRef = useRef(null);
  const closeBtnRef = useRef(null);
  const restoreFocusRef = useRef(null);

  /* ── Load reasons (GET /report/reasons → { reasons: string[] }) ── */
  const loadReasons = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get('/report/reasons');
      setReasons(Array.isArray(data.reasons) ? data.reasons.filter((r) => typeof r === 'string') : []);
    } catch (err) {
      console.error('Failed to fetch report reasons:', err);
      setReasons([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReasons();
  }, [loadReasons]);

  /* ── Escape to close (blocked mid-submit) + body scroll lock ── */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !submitting) onClose();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, submitting]);

  /* ── Focus: move in on mount, restore on unmount ──
     `preventScroll` is REQUIRED here, not a nicety. The element that had focus
     before the modal opened is the "Report profile" button, which lives inside
     the deck card's sheet — a panel that is position:absolute, translated with
     a transform, and TALLER than the viewport. Plain .focus() makes the browser
     try to scroll that element into view, but there is no scrollable ancestor
     to do it with (html/body and .pc-root are all overflow:hidden), so it
     compensates by shifting the composited transform layer: the sheet AND the
     photo jump upward on close, and the offset is not stored in yMV, so
     dragging can't undo it. preventScroll focuses without revealing. */
  useEffect(() => {
    restoreFocusRef.current = document.activeElement;
    closeBtnRef.current?.focus({ preventScroll: true });
    return () => restoreFocusRef.current?.focus?.({ preventScroll: true });
  }, []);

  /* ── Simple Tab trap inside the sheet ── */
  const trapTab = (e) => {
    if (e.key !== 'Tab' || !sheetRef.current) return;
    const focusables = sheetRef.current.querySelectorAll(
      'button:not(:disabled), textarea:not(:disabled), [href], [tabindex]:not([tabindex="-1"])'
    );
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const requestClose = () => {
    if (!submitting) onClose();
  };

  const handleSubmit = async () => {
    if (submitting) return;

    setSubmitting(true);
    try {
      await api.post(`/report/${reportedUserId}`, {
        reason: selectedReason,
        details: details.trim(),
      });
      triggerHaptic('heavy');
      onReported();
    } catch (err) {
      console.error('Report submission failed:', err);
      if (!err?.toasted) {
        toast.error('Could not submit your report. Check your connection and try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  /* Portal to <body> — mandatory: mounted from ProfileCard (inside
     contentStage, zIndex 1), a fixed overlay would otherwise be trapped
     UNDER the floating deck chrome (zIndex 500) no matter its own z-index. */
  return createPortal(
    <motion.div
      className="rm-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={requestClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: C.z.modal, // token — above header (500), drawer (1000)
      }}
    >
      <motion.div
        ref={sheetRef}
        className="rm-root rm-sheet rm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
        aria-busy={loading || submitting}
        onKeyDown={trapTab}
        initial={{ y: '120%' }}
        animate={{ y: 0 }}
        exit={{ y: '120%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <style>{REPORT_SHEET_CSS}</style>

        {/* Grabber — ink at rest, yellow while held (pc-grabber) */}
        <div style={{ paddingTop: 12, flexShrink: 0 }}>
          <div className="rm-grabber" aria-hidden="true" />
        </div>

        {/* Header — Archivo Black marker-highlight title + pc-iconbtn close */}
        <div
          style={{
            padding: '12px 20px 14px',
            borderBottom: `1px solid ${C.hair}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 14,
            flexShrink: 0,
          }}
        >
          <h2 id="report-modal-title" className="rm-title">Report User</h2>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={requestClose}
            className="rm-close"
            aria-label="Close"
          >
            <X size={18} strokeWidth={3} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '16px 20px 24px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div
              role="status"
              style={{ textAlign: 'center', padding: '40px', fontFamily: F.mono, fontSize: 12, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: C.ink3 }}
            >
              Loading report options...
            </div>
          ) : reasons.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 12px' }}>
              <p style={{ fontFamily: F.body, fontSize: 13.5, color: C.ink2, lineHeight: 1.55, margin: '0 0 16px' }}>
                Report options couldn't be loaded. Check your connection and try again.
              </p>
              <button type="button" onClick={loadReasons} className="rm-retry">Retry</button>
            </div>
          ) : (
            <>
              <p className="rm-sub">
                Help us understand why you're reporting this user. Your report will be reviewed by our moderation team.
              </p>

              {/* Reason selection */}
              <div style={{ marginTop: 20, marginBottom: 22 }}>
                <div className="rm-shead" id="report-reason-label">
                  <span className="rm-mark" style={{ background: C.yellow }} aria-hidden="true" />
                  <span className="rm-stitle" id="report-reason-label-text">Reason for Report</span>
                </div>
                <div role="radiogroup" aria-labelledby="report-reason-label-text" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {reasons.map((reason) => {
                    const selected = selectedReason === reason;
                    return (
                      <motion.button
                        key={reason}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        disabled={submitting}
                        className={`rm-reason${selected ? ' selected' : ''}`}
                        onClick={() => {
                          setSelectedReason(reason);
                          triggerHaptic('light');
                        }}
                      >
                        {reason}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Details (optional) */}
              <div style={{ marginBottom: 22 }}>
                <label htmlFor="report-details" className="rm-shead" style={{ cursor: 'default' }}>
                  <span className="rm-mark" style={{ background: C.coral }} aria-hidden="true" />
                  <span className="rm-stitle">Additional Details (Optional)</span>
                </label>
                <textarea
                  id="report-details"
                  className="rm-textarea"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Provide any additional context..."
                  maxLength={MAX_DETAILS}
                  disabled={submitting}
                  aria-describedby="report-details-count"
                />
                <div id="report-details-count" className="rm-count">
                  {details.length}/{MAX_DETAILS}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Pinned footer — red CTA, always reachable */}
        {!loading && reasons.length > 0 && (
          <div
            style={{
              padding: '14px 20px calc(16px + env(safe-area-inset-bottom, 0px))',
              borderTop: `1px solid ${C.hair}`,
              backgroundColor: C.paper,
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !selectedReason}
              className="rm-submit"
              aria-busy={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>,
    document.body
  );
};

export default ReportModal;