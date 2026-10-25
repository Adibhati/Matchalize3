import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ChevronDown, ChevronUp, X } from 'lucide-react';
import { api } from '../utils/api';
import { readLocationOnce, LOCATION_UNAVAILABLE } from '../utils/geolocation';
import { triggerHaptic } from '../utils/haptics';
import neu from '../styles/neu';

const t = neu;

/**
 * 📍 CAMPUS-FALLBACK NOTICE.
 *
 * The feed ranks by distance from the viewer's own stored reading. When that
 * reading is absent or stale, the pipeline substitutes their COLLEGE
 * coordinates — silently. Without this the user is looking at a campus-ranked
 * feed while the UI implies it is location-ranked, which is the failure that
 * made distance look broken.
 *
 * The college-fallback reminder stays visible until the user dismisses it.
 * The active-location confirmation is informational, appears once, then leaves.
 *
 * ── WHY THERE ARE TWO VARIANTS ──────────────────────────────────────────────
 * `fallback` warns that the deck is campus-ordered. `active` confirms that it
 * is NOT, once, then leaves forever. One component with two variants rather than
 * two components, because the decision of which to render belongs to the parent
 * — it is the only place that knows what the server is actually ranking by — and
 * two components would each have to re-derive it.
 *
 * The confirmation is keyed on localStorage, not sessionStorage: it must survive
 * a tab close, or "once" would mean "once per tab". It carries no action row,
 * because every control here exists to change the state being described and that
 * state is already correct.
 *
 * The variant is chosen from the SERVER's `active` flag, never from
 * `myUser.locationSource`. `locationSource` is a stored preference that says a
 * reading existed at some point; a reading past the 30-day TTL is ignored by the
 * ranking and the deck falls back to the campus, so the preference is the one
 * value that can disagree with the behaviour.
 */

const AUTO_HIDE_MS = 5000;
const SESSION_SEEN_KEY = 'matchalize_notice_seen';
/* localStorage, not sessionStorage — the opposite choice from SESSION_SEEN_KEY,
   and for the same reason in reverse. The confirmation is a one-time statement
   that the location feature is working; a session key would bring it back on
   every launch, and a session is not the unit of "has this person ever been
   told". Nothing here is personal data — it records that a line of text was
   rendered, not anything about the reader. */
const ACTIVE_ACK_KEY = 'matchalize_notice_active_ack';

/* Which of the two messages this is.
 *
 * `fallback` — the deck is being ordered from the campus, not from the user.
 *   A warning, repeats every visit, offers a way out.
 * `active`   — the deck IS ordered from a live reading. Not a warning at all:
 *   nothing needs fixing, so it confirms once and never returns.
 *
 * Two messages rather than one because the alternative is a notice that says
 * "you're not using your location" to someone who is. */
const LocationNotice = ({ college = '', variant = 'fallback', onLocationChanged }) => {
  const isActive = variant === 'active';
  /* The user's own college, read by the parent off `myUser`. Falls back to the
     generic phrase when it is missing so the sentence still reads — a user with
     no college on record must not get "Sorted according to undefined". */
  const COLLEGE_LABEL = college || 'your college';
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  /* Set when the browser refuses permanently so expanded copy can explain how
     to change the browser permission. */
  const [locked, setLocked] = useState(false);

  const hideTimer = useRef(null);

  /* sessionStorage, not localStorage: this is a per-visit display preference,
     not user data, and it should clear when they close the tab. localStorage
     would make it permanent, which is the thing being fixed. */
  const sessionRead = useCallback((key) => {
    try { return sessionStorage.getItem(key); } catch { return null; }
  }, []);
  const sessionWrite = useCallback((key, value) => {
    try { sessionStorage.setItem(key, value); } catch { /* private mode */ }
  }, []);

  /* localStorage access is wrapped for the same reason as sessionStorage: Safari
     private mode throws on write, and a notice must never be the thing that
     breaks the feed. */
  const localRead = useCallback((key) => {
    try { return localStorage.getItem(key); } catch { return null; }
  }, []);
  const localWrite = useCallback((key, value) => {
    try { localStorage.setItem(key, value); } catch { /* private mode */ }
  }, []);

  /* ── decide whether to appear on this mount ── */
  useEffect(() => {
    if (isActive) {
      /* The active confirmation appears once and auto-hides. */
      if (localRead(ACTIVE_ACK_KEY)) {
        clearTimeout(hideTimer.current);
        setVisible(false);
        return undefined;
      }
      localWrite(ACTIVE_ACK_KEY, String(Date.now()));
      setVisible(true);
      hideTimer.current = setTimeout(() => setVisible(false), AUTO_HIDE_MS);
      return () => clearTimeout(hideTimer.current);
    }

    if (sessionRead(SESSION_SEEN_KEY)) return;

    setVisible(true);
    return undefined;
  }, [isActive, localRead, localWrite, sessionRead]);

  /* Expanding the college-fallback reminder never starts a dismissal timer. */
  const toggle = useCallback(() => {
    clearTimeout(hideTimer.current);
    setOpen((prev) => !prev);
  }, []);

  const dismiss = useCallback(() => {
    clearTimeout(hideTimer.current);
    setVisible(false);
    setOpen(false);
    sessionWrite(SESSION_SEEN_KEY, '1');
  }, [sessionWrite]);

  /* ── request a real reading ── */
  const ask = useCallback(async () => {
    if (busy) return;
    clearTimeout(hideTimer.current);
    setBusy(true);
    setError('');
    setSuccess('');
    const res = await readLocationOnce();

    if (!res.ok) {
      setBusy(false);
      const denied = res.reason === LOCATION_UNAVAILABLE.DENIED;
      /* A denial the browser will honour forever is the locked state. A timeout
         or an insecure origin is transient and must not earn permanence. */
      if (denied) setLocked(true);
      setError(
        denied
          ? 'Your browser has blocked location for this site. Turn it on in your browser settings, then tap again.'
          : res.reason === LOCATION_UNAVAILABLE.INSECURE
            ? 'Location needs a secure (https) connection.'
            : "We couldn't get a location reading. Try again in a moment.",
      );
      return;
    }

    let saved;
    try {
      saved = await api.put('/users/location', { latLng: res.latLng, source: 'gps' });
    } catch {
      setBusy(false);
      setError("Couldn't save your location. Try again.");
      return;
    }

    triggerHaptic('medium');
    setSuccess(saved?.moved
      ? 'Your Deck is updating around your new area.'
      : 'Your location is saved. Nearby profiles will be prioritized.');
    setBusy(false);

    try {
      /* The server's `moved` flag is the authority — it already deleted the
         viewer's deck session when the anchor changed. We forward it so the
         parent can rebuild in place without a full reload. */
      await onLocationChanged?.(!!saved?.moved);
      hideTimer.current = setTimeout(() => setVisible(false), AUTO_HIDE_MS);
    } catch (error) {
      console.error('Location saved, but the Deck could not update:', error);
      setError("Your location was saved, but the Deck couldn't refresh. Try reopening it.");
    }
  }, [busy, onLocationChanged]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="loc-notice"
          className="location-notice"
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -14 }}
          transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            top: 'max(16px, env(safe-area-inset-top))',
            zIndex: 99999,
            boxSizing: 'border-box',
            borderRadius: t.radius.md,
            background: t.card,
            border: `2px solid ${t.ink}`,
            boxShadow: t.shadow.md,
            overflow: 'hidden',
          }}
        >
          <style>{`
            .location-notice {
              left: max(16px, env(safe-area-inset-left));
              right: max(16px, env(safe-area-inset-right));
              width: auto;
              max-width: 430px;
              margin-inline: auto;
            }

            @media (min-width: 600px) {
              .location-notice {
                left: auto;
                right: max(24px, env(safe-area-inset-right));
                width: min(430px, calc(100vw - 48px));
                margin-inline: 0;
              }
            }
          `}</style>
          <div style={{ padding: '10px 12px' }}>
            {/* Headline + sub-line. Both lines carry the whole fact on their
                own — someone who never expands still learns their feed is
                campus-ranked, which is the entire job of this component.

                In the `active` variant there is no action row and no disclosure.
                The whole message fits in the two lines, and adding a chevron
                that expanded nothing, or a close button for text that was never
                a question, would each be a control that does nothing. */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <MapPin
                size={15}
                strokeWidth={2.6}
                color={t.ink3}
                style={{ marginTop: 2, flexShrink: 0 }}
              />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: t.fontBody, fontSize: 13.5, fontWeight: 700, color: t.ink, lineHeight: 1.3 }}>
                  {isActive
                    ? 'Using your location to sort people near you'
                    : "Your feed isn't using your live location"}
                </div>
                <div style={{ marginTop: 2, fontFamily: t.fontBody, fontSize: 12.5, color: t.ink2, lineHeight: 1.35 }}>
                  {success || (isActive
                    ? `People near you show up first, not just near ${COLLEGE_LABEL}`
                    : `Sorted according to ${COLLEGE_LABEL}`)}
                </div>
              </div>
            </div>

            {/* Action row. Always visible, expanded or not — it is the action,
                not part of the disclosure.

                `active` renders none of it. Every control here exists to change
                the state it is describing; against a state that is already
                correct they would all be decorative, and the "Turn on location"
                button in particular would claim the user has no location while
                the line above them says they do. */}
            {!isActive && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
              {!success && (
              <>
              <button
                type="button"
                onClick={ask}
                disabled={busy}
                aria-label="Turn on your location"
                className="slam slam-sm"
                style={{
                  border: 'none',
                  cursor: busy ? 'default' : 'pointer',
                  padding: '7px 13px',
                  borderRadius: t.radius.pill,
                  backgroundColor: t.yellow,
                  color: t.ink,
                  fontFamily: t.fontBody,
                  fontSize: 12.5,
                  fontWeight: 700,
                  opacity: busy ? 0.6 : 1,
                }}
              >
                {busy ? 'Finding you…' : 'Turn on location'}
              </button>

              <button
                type="button"
                onClick={toggle}
                disabled={locked}
                aria-expanded={open}
                aria-label={open ? 'Hide details' : 'Show details'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 30,
                  height: 30,
                  border: `1px solid ${t.ink}`,
                  borderRadius: 999,
                  background: 'transparent',
                  color: t.ink2,
                  cursor: locked ? 'default' : 'pointer',
                  opacity: locked ? 0.4 : 1,
                }}
              >
                {open ? <ChevronUp size={15} strokeWidth={2.6} /> : <ChevronDown size={15} strokeWidth={2.6} />}
              </button>
              </>
              )}

              <div style={{ flex: 1 }} />

              <button
                type="button"
                onClick={dismiss}
                aria-label="Dismiss"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 26,
                  height: 26,
                  border: 'none',
                  background: 'transparent',
                  color: t.ink3,
                  cursor: 'pointer',
                }}
              >
                <X size={14} strokeWidth={2.6} />
              </button>
            </div>
            )}
          </div>

          {/* Expanded body. The divider is the top border of this block, so the
              pill reads as one object that grew rather than two stacked
              surfaces. */}
          <AnimatePresence initial={false}>
            {open && !isActive && (
              <motion.div
                key="loc-notice-body"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ borderTop: `1px solid ${t.ink}`, padding: '10px 12px 12px' }}>
                  <div style={{ fontFamily: t.fontBody, fontSize: 12.5, color: t.ink2, lineHeight: 1.5 }}>
                    Your location is off, so people near {COLLEGE_LABEL} show up
                    first — even if you&apos;re somewhere else.
                  </div>

                  {error && (
                    <div style={{ marginTop: 8, fontFamily: t.fontBody, fontSize: 12, color: t.ink3, lineHeight: 1.45 }}>
                      {error}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={dismiss}
                    style={{
                      marginTop: 10,
                      border: 'none',
                      background: 'transparent',
                      padding: 0,
                      color: t.ink3,
                      fontFamily: t.fontBody,
                      fontSize: 12,
                      textDecoration: 'underline',
                      cursor: 'pointer',
                    }}
                  >
                    Not now
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LocationNotice;