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
 * ── WHY IT NO LONGER SITS THERE FOREVER ──
 * The previous shape was permanently pinned and undismissable, on the reasoning
 * that a banner people swipe away is how someone stops noticing their feed
 * stopped changing. That reasoning was right about DISMISSAL and wrong about
 * persistence: a permanent bar over the feed is wallpaper, and wallpaper is
 * read by nobody. Nothing was ever decided from it.
 *
 * The fix is an expiry rather than a concession. It arrives on entry, says the
 * whole thing in two lines, and leaves. Someone who never registers it still
 * gets it again on their next app open — which is more often than "never", and
 * the only nudge that isn't a nag.
 *
 * ── WHY IT RETURNS ON EVERY TAB SWITCH ──
 * The tab switch remounts this screen (`AppShell` keys the page wrapper on
 * `activeTab`), so "mount" already means "the user came back to the feed". No
 * visibility API, no focus listener, no timer bookkeeping.
 *
 * The 3-minute throttle is the one guard. Tab-switching is free and fast;
 * without it, someone checking matches ten times in a minute gets ten pills,
 * which is nagging rather than reminding.
 *
 * ── WHY ONE CASE NEVER AUTO-HIDES ──
 * A browser that has permanently blocked location will never prompt again — not
 * this app, not on refresh, not ever. That is the browser's decision, and it
 * means the "turn it on in your settings" copy is the only actionable
 * instruction the user will ever get. Auto-hiding it after five seconds would
 * leave someone with a campus-ranked feed and no route out of it.
 *
 * Push notifications were rejected for the same reason as the auto-hide
 * exception: a notification cannot deliver a permission grant, and muting
 * notifications to escape the nagging costs the user their match and message
 * alerts.
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
/* Minimum gap between two unprompted appearances within one session. */
const THROTTLE_MS = 3 * 60 * 1000;
const SESSION_SEEN_KEY = 'matchalize_notice_seen';
const SESSION_AT_KEY = 'matchalize_notice_at';
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
  /* Set when the browser refuses permanently. That is the one state with no
     auto-hide, because it is the one state where dismissal hides the only way
     forward. */
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
      /* Once. Ever. If it had a session key it would return on every launch,
         which turns a confirmation into a recurring notification about
         something that is working. It auto-hides like the warning does, and
         takes no dismiss control — there is nothing to dismiss, because
         nothing is being asked. */
      if (localRead(ACTIVE_ACK_KEY)) return;
      localWrite(ACTIVE_ACK_KEY, String(Date.now()));
      setVisible(true);
      hideTimer.current = setTimeout(() => setVisible(false), AUTO_HIDE_MS);
      return () => clearTimeout(hideTimer.current);
    }

    if (sessionRead(SESSION_SEEN_KEY)) return;

    const lastAt = Number(sessionRead(SESSION_AT_KEY));
    const now = Date.now();
    /* No previous stamp means the first appearance of the session, so it always
       shows. A missing stamp must not be read as "just shown" — that would
       silently skip the very first reminder after a fresh sign-up, which is the
       one moment it matters most. */
    if (lastAt && now - lastAt < THROTTLE_MS) return;

    sessionWrite(SESSION_AT_KEY, String(now));
    setVisible(true);

    /* Starts closed. The two-line form carries the whole fact; expansion is for
       the explanation, not for the headline. */
    hideTimer.current = setTimeout(() => setVisible(false), AUTO_HIDE_MS);

    return () => clearTimeout(hideTimer.current);
  }, [isActive, localRead, localWrite, sessionRead, sessionWrite]);

  /* ── expanding cancels the auto-hide; collapsing restarts it ── */
  const toggle = useCallback(() => {
    clearTimeout(hideTimer.current);
    setOpen((prev) => {
      const next = !prev;
      if (!next) {
        /* Collapsing again means they read it and went back, so it still has
           something left to say. Restart the clock. */
        hideTimer.current = setTimeout(() => setVisible(false), AUTO_HIDE_MS);
      }
      return next;
    });
  }, []);

  const dismiss = useCallback(() => {
    clearTimeout(hideTimer.current);
    setVisible(false);
    setOpen(false);
    sessionWrite(SESSION_SEEN_KEY, '1');
    sessionWrite(SESSION_AT_KEY, String(Date.now()));
  }, [sessionWrite]);

  /* ── request a real reading ── */
  const ask = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setError('');
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

    try {
      const saved = await api.put('/users/location', { latLng: res.latLng, source: 'gps' });
      triggerHaptic('medium');
      /* The server's `moved` flag is the authority — it already deleted the
         viewer's deck session when the anchor changed. We forward it so the
         parent can rebuild in place without a full reload. */
      await onLocationChanged?.(!!saved?.moved);
    } catch {
      setBusy(false);
      setError("Couldn't save your location. Try again.");
    }
  }, [busy, onLocationChanged]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="loc-notice"
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -14 }}
          transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
          role="status"
          aria-live="polite"
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            right: 12,
            zIndex: 34,
            width: 'calc(100% - 24px)',
            maxWidth: 430,
            marginInline: 'auto',
            boxSizing: 'border-box',
            borderRadius: t.radius.md,
            background: t.card,
            border: `2px solid ${t.ink}`,
            boxShadow: t.shadow.md,
            overflow: 'hidden',
          }}
        >
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
                  {isActive
                    ? `People near you show up first, not just near ${COLLEGE_LABEL}`
                    : `Sorted according to ${COLLEGE_LABEL}`}
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

              <div style={{ flex: 1 }} />

              <button
                type="button"
                onClick={dismiss}
                disabled={locked}
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
                  cursor: locked ? 'default' : 'pointer',
                  opacity: locked ? 0.4 : 1,
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
                    disabled={locked}
                    style={{
                      marginTop: 10,
                      border: 'none',
                      background: 'transparent',
                      padding: 0,
                      color: t.ink3,
                      fontFamily: t.fontBody,
                      fontSize: 12,
                      textDecoration: 'underline',
                      cursor: locked ? 'default' : 'pointer',
                      opacity: locked ? 0.4 : 1,
                    }}
                  >
                    Not now
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Draining hairline. Only while collapsed, and only while it is
              actually going to leave on its own — drawing it while the notice is
              expanded or pinned would promise a departure that never comes. */}
          {!open && !locked && !isActive && (
            <motion.div
              key="loc-notice-drain"
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: AUTO_HIDE_MS / 1000, ease: 'linear' }}
              style={{
                height: 2,
                background: t.yellow,
                transformOrigin: 'left center',
              }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LocationNotice;