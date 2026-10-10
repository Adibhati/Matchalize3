import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../utils/AuthContext';
import { useAppConfig } from '../utils/AppConfigContext';
import { triggerHaptic } from '../utils/haptics';
import { toast } from '../utils/toast';
import { getThemePreference, setThemePreference, getDarkMood, setDarkMood } from '../utils/theme';
import { readLocationOnce, LOCATION_UNAVAILABLE } from '../utils/geolocation';
import { resetDiscoverStore } from '../utils/discoverStore';
import neu from '../styles/neu';

const FALLBACK_IMG = 'https://placehold.co/600x800/fff3dc/191919?text=%C2%B7';

/* The shared neo-brutalist canon (src/styles/neu.js) */
const F = {
  heavy: neu.fontHeavy,
  body: neu.fontBody,
  mono: neu.fontMono,
};

const C = neu;

const SETTINGS_CSS = `
  .st-slam { display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    width: 100%; padding: 14px; background: ${C.card}; color: ${C.ink};
    border: 2px solid ${C.ink}; border-radius: 12px; box-shadow: 4px 4px 0 ${C.ink};
    font-family: ${F.mono}; font-size: 12px; font-weight: 700; letter-spacing: .12em;
    text-transform: uppercase; cursor: pointer;
    transition: transform .08s steps(2), box-shadow .08s steps(2), background .08s steps(2);
    -webkit-tap-highlight-color: transparent; }
  .st-slam:active { transform: translate(4px, 4px); box-shadow: 0 0 0 ${C.ink}; }
  .st-slam.yellow { background: ${C.yellow}; }
  .st-slam.danger { color: ${C.red}; }

  .st-tile { display: flex; align-items: center; justify-content: space-between; gap: 16px;
    padding: 16px; background: ${C.card}; border: 2px solid ${C.ink};
    border-radius: 14px; box-shadow: 5px 5px 0 ${C.ink}; }

  .st-row { display: flex; align-items: center; justify-content: space-between; gap: 12px;
    padding: 12px 14px; background: ${C.card}; border: 2px solid ${C.ink};
    border-radius: 14px; box-shadow: 4px 4px 0 ${C.ink}; }

  .st-close { width: 36px; height: 36px; flex-shrink: 0; display: flex; align-items: center;
    justify-content: center; background: ${C.card}; border: 2px solid ${C.ink};
    border-radius: 11px; box-shadow: 3px 3px 0 ${C.ink}; cursor: pointer; color: ${C.ink};
    transition: transform .08s steps(2), box-shadow .08s steps(2); }
  .st-close:active { transform: translate(3px, 3px); box-shadow: 0 0 0 ${C.ink}; }

  .st-shead { display: flex; align-items: center; gap: 10px; margin: 0 0 12px; }
  .st-mark { width: 11px; height: 11px; flex-shrink: 0; border: 2px solid ${C.ink}; border-radius: 3px; }
  .st-stitle { font-family: ${F.mono}; font-size: 12px; font-weight: 700; letter-spacing: .18em;
    text-transform: uppercase; color: ${C.ink}; }

  @media (hover: hover) and (pointer: fine) {
    .st-slam:hover:not(:active) { transform: translate(-1px, -1px); box-shadow: 5px 5px 0 ${C.ink}; }
    .st-close:hover { filter: brightness(1.05); }
  }
  .st-slam:focus-visible, .st-close:focus-visible {
    outline: 3px solid ${C.yellow}; outline-offset: 2px; }

  @media (prefers-reduced-motion: reduce) {
    .st-slam, .st-close { transition: none; }
  }
`;

const SectionHead = ({ mark = C.yellow, children }) => (
  <div className="st-shead">
    <span className="st-mark" aria-hidden="true" style={{ background: mark }} />
    <span className="st-stitle">{children}</span>
  </div>
);

const Settings = ({ onSignOut, onClose }) => {
  const [themeMode, setThemeMode] = useState(() => getThemePreference() || 'light');
  const [blockedOpen, setBlockedOpen] = useState(false);

  /* ── 📍 DISTANCE: "Near me" or "My campus" ──────────────────────────────────
     A CHOICE, not a status readout. There is no separate boolean to fall out of
     sync with what is stored: the stored `locationSource` IS the preference, so
     the selected chip is the truth by construction.

     This replaces a "Location: On/Off" row under Privacy. That shape was wrong
     twice over. It reported a boolean derived from `locationSource`, which is
     truthy for a STALE reading — so a location set months ago, which the ranking
     already ignores after 30 days, still displayed as "On", with a "Turn off"
     button for something that was effectively off. And no other dating app shows
     a privacy row for location at all: they expose one distance preference,
     because the OS permission prompt and the onboarding copy already disclose
     that location is used, and the OS settings app is where it gets withdrawn. */
  const [distancePref, setDistancePref] = useState('campus');
  /* Whole days since the reading, so a stale-but-present location can say so
     rather than silently claiming to be active. The server sends this precisely
     so the UI can tell "set today" from "set a year ago". */
  const [locDaysAgo, setLocDaysAgo] = useState(null);
  const [locBusy, setLocBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    api.get('/users/location')
      .then((r) => {
        if (!alive) return;
        /* A failed read must not silently imply the personal choice is active, so
           fall back to the conservative default. */
        setDistancePref(r?.locationSource === 'gps' ? 'near' : 'campus');
        setLocDaysAgo(Number.isFinite(r?.storedDaysAgo) ? r.storedDaysAgo : null);
      })
      .catch(() => {
        if (!alive) return;
        setDistancePref('campus');
        setLocDaysAgo(null);
      });
    return () => { alive = false; };
  }, []);

  /* True only when a FRESH personal reading is stored. Drives the explanatory
     line, and is deliberately separate from `distancePref`: a stale "Near me"
     shows as selected while this reports false, which is the honest pairing. */
  const locFresh = distancePref === 'near' && locDaysAgo !== null && locDaysAgo < 30;

  /* Selecting "Near me". Asks the browser, then stores ONE rounded reading.
     On refusal the chip stays where it was: a declined prompt must not silently
     move the preference, or the control would claim something that did not
     happen. */
  const chooseNearMe = async () => {
    if (locBusy || distancePref === 'near') return;
    setLocBusy(true);
    const res = await readLocationOnce();
    if (!res.ok) {
      setLocBusy(false);
      toast.error(
        res.reason === LOCATION_UNAVAILABLE.DENIED ? 'Location permission was denied. Enable it in browser settings.'
        : res.reason === LOCATION_UNAVAILABLE.INSECURE ? 'Location only works on a secure connection.'
        : "Couldn't get a location reading. Try again, or check phone GPS settings.",
      );
      return;
    }
    try {
      /* Coordinates go up once; the server rounds them before storing. */
      const saved = await api.put('/users/location', { latLng: res.latLng, source: 'gps' });
      if (saved?.moved) resetDiscoverStore();
      setDistancePref('near');
      setLocDaysAgo(0);
      toast.success('Updating your feed for your location.');
    } catch (err) {
      if (!err?.toasted) toast.error('Could not save your location. Try again.');
    }
    setLocBusy(false);
  };

  /* Selecting "My campus". Genuinely DELETES the stored coordinates rather than
     just ignoring them — a preference you switched away from should not leave a
     position sitting in the database, and `latLng: null` is the endpoint's real
     delete path, not a soft disable.

     ⚠️ NO `source: 'campus'` ON THE CLEAR. The endpoint checks
     `latLng === undefined && source === 'campus'` FIRST to record a deliberate
     decline, so sending `latLng: null` alongside `source: 'campus'` falls
     through to the clear branch and stores `locationSource: null` instead. The
     chip is derived from `locationSource === 'gps'`, so campus needs no stored
     marker at all — absence of a GPS reading IS the campus choice. */
  const chooseCampus = async () => {
    if (locBusy || distancePref === 'campus') return;
    setLocBusy(true);
    try {
      const saved = await api.put('/users/location', { latLng: null });
      if (saved?.moved) resetDiscoverStore();
      setDistancePref('campus');
      setLocDaysAgo(null);
      toast.success('Updating your feed for your campus.');
    } catch (err) {
      if (!err?.toasted) toast.error('Could not update your location preference. Try again.');
    }
    setLocBusy(false);
  };
  const [legalOpen, setLegalOpen] = useState(null);
  const [blockedList, setBlockedList] = useState([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);

  /* ═══ SHOW ME ("Show Me" / interestedIn) ═════════════════════════════════
     Collected once in onboarding, editable here.
     It has to be editable, and this is not a convenience: the preference is
     MUTUAL. Whoever you set filters what you see, and whoever set theirs
     filters who sees you. A preference set once at 19 and never revisited is
     the single most likely way a student ends up staring at an empty deck
     with no idea why — the filter that emptied it is invisible by design,
     since showing "she's interested in men" on her card would out her to every
     stranger who opened it.

     So: prominent, multi-select, with 'Everyone' as an escape hatch that
     stays selected until a specific choice is made. Selecting Everyone clears
     specific picks and vice versa, because "Everyone AND Women" is a
     contradiction that would silently behave as just "Women".
  */
  const config = useAppConfig();
  const { user: myUser, refreshUser } = useAuth();
  const [collegeOpen, setCollegeOpen] = useState(false);
  const [colleges, setColleges] = useState([]);
  const [cc, setCc] = useState({ collegeCode: '', email: '', otp: '', codeSent: false, busy: false });
  const [pref, setPref] = useState(myUser?.interestedIn || []);
  const [savingPref, setSavingPref] = useState(false);

  useEffect(() => {
    if (Array.isArray(myUser?.interestedIn)) setPref(myUser.interestedIn);
  }, [myUser?.interestedIn]);

  const togglePref = (value) => {
    setPref((prev) => {
      const on = prev.includes(value);
      if (on) return prev.filter((v) => v !== value);
      const next = value === 'Everyone' ? [] : prev.filter((v) => v !== 'Everyone');
      return [...next, value];
    });
  };

  const savePref = async () => {
    setSavingPref(true);
    try {
      await api.put('/users/profile', { interestedIn: pref });
      toast.success('Show me preference saved.');
      refreshUser?.();
    } catch (err) {
      if (!err?.toasted) toast.error('Could not save your preference. Try again.');
    } finally { setSavingPref(false); }
  };

  const toggleTheme = () => {
    triggerHaptic('medium');
    if (themeMode === 'light') {
      const next = getDarkMood();
      setThemeMode(next);
      setThemePreference(next);
    } else {
      setDarkMood(themeMode);
      setThemeMode('light');
      setThemePreference('light');
    }
  };

  const fetchBlockedUsers = async () => {
    setLoadingBlocked(true);
    try {
      const res = await api.get('/report/list');
      setBlockedList(res.blocked || []);
    } catch (err) {
      if (!err?.toasted) toast.error('Could not load your blocked list. Try again.');
    } finally {
      setLoadingBlocked(false);
    }
  };

  const handleUnblock = async (userId, userName) => {
    triggerHaptic('medium');
    try {
      await api.delete(`/report/block/${userId}`);
      setBlockedList((prev) => prev.filter((u) => u._id !== userId));
      toast.success(`Unblocked ${userName}. They can now appear in your feed.`);
    } catch (err) {
      if (!err?.toasted) toast.error(`Could not unblock ${userName}. Try again.`);
    }
  };

  const handleDeleteAccount = async () => {
    triggerHaptic('heavy');
    /* Two-step with a plain statement of consequences, because one `confirm`
       cannot carry it. The point people need spelled out is the one that is
       otherwise surprising: conversations they sent stay visible to the other
       person. They may not want that, and they should find out before not
       after. */
    if (!window.confirm(
      'Delete your account?\n\n' +
      'Your profile, photos, bio and prompts will be removed and you will disappear from campus view.\n\n' +
      'Messages you already sent stay in the other person\'s chat — those are their history too, and we can\'t remove them for them.\n\n' +
      'Report records are kept for 30 days in case anything needs investigating.\n\n' +
      'This cannot be undone.'
    )) return;
    try {
      await api.delete('/users/account');
      onSignOut();
    } catch (err) {
      if (!err?.toasted) toast.error('Could not delete your account. Try again.');
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 600,
      backgroundColor: C.paper,
      display: 'flex', flexDirection: 'column',
    }}>
      <style>{SETTINGS_CSS}</style>

      {/* Own header row. zIndex 600 covers the floating app header (z 500), so
          nothing shows through behind it. */}
      <div style={{
        flexShrink: 0,
        paddingTop: 'max(14px, env(safe-area-inset-top, 0px))',
        paddingLeft: 20, paddingRight: 20, paddingBottom: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12,
        borderBottom: `2px solid ${C.ink}`,
        backgroundColor: C.paper,
      }}>
        <h2 style={{ fontFamily: F.heavy, fontSize: 22, fontWeight: 400, margin: 0, color: C.ink, letterSpacing: '-.01em', textTransform: 'uppercase' }}>Settings</h2>
        <button onClick={onClose} aria-label="Close settings" className="st-close">
          <X size={18} strokeWidth={3} />
        </button>
      </div>

      <div style={{
        flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        padding: '22px 20px calc(28px + env(safe-area-inset-bottom, 0px))',
      }}>

        {/* ════ APPEARANCE ════ */}
        <SectionHead mark={C.yellow}>Appearance</SectionHead>
        <div className="st-tile" style={{ marginBottom: 28 }}>
          <div>
            <p style={{ fontFamily: F.body, fontSize: 15, fontWeight: 700, color: C.ink, margin: 0 }}>Dark mode</p>
            <p style={{ fontFamily: F.body, fontSize: 12, fontWeight: 500, color: C.ink2, margin: '3px 0 0', lineHeight: 1.4 }}>
              {themeMode === 'light' ? 'A darker palette for late-night scrolling.' : 'Darker palette is on.'}
            </p>
          </div>
          <button
            className="st-slam yellow"
            onClick={toggleTheme}
            style={{ width: 'auto', padding: '10px 16px', flexShrink: 0,
              background: themeMode !== 'light' ? C.ink : C.yellow,
              color: themeMode !== 'light' ? C.paper : C.ink }}
          >
            {themeMode !== 'light' ? 'On' : 'Off'}
          </button>
        </div>

        {/* ════ MATCHING ════ */}
        <SectionHead mark={C.yellow}>Show me</SectionHead>
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontFamily: F.body, fontSize: 12.5, fontWeight: 500, color: C.ink2, margin: '0 0 4px', lineHeight: 1.5 }}>
            Pick as many as you like. Nobody sees this — it only changes who appears in your deck.
          </p>
          <p style={{ fontFamily: F.body, fontSize: 12.5, fontWeight: 500, color: C.ink2, margin: '0 0 14px', lineHeight: 1.5 }}>
            If your deck looks empty, widen this.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            {[...(config?.genders || ['Male', 'Female', 'Non-binary', 'Other']), 'Everyone'].map((g) => {
              const on = pref.includes(g);
              return (
                <button
                  key={g}
                  type="button"
                  aria-pressed={on}
                  onClick={() => { triggerHaptic('light'); togglePref(g); }}
                  style={{
                    padding: '12px 16px', minHeight: 46, borderRadius: 12,
                    border: `2px solid ${C.ink}`, cursor: 'pointer',
                    background: on ? C.yellow : C.card, color: C.ink,
                    fontFamily: F.body, fontSize: 14.5, fontWeight: on ? 700 : 600,
                    boxShadow: `3px 3px 0 ${C.ink}`,
                  }}
                >
                  {g}
                </button>
              );
            })}
          </div>

          {/* 📍 DISTANCE — the same chip shape as the preference above, because it
              is the same kind of thing: a choice about who appears in your deck,
              not a switch over data we hold. */}
          <div style={{ marginTop: 26, paddingTop: 22, borderTop: `2px solid ${C.ink}1a` }}>
            <div style={{ fontFamily: F.body, fontSize: 12.5, fontWeight: 700, color: C.ink, margin: '0 0 4px' }}>
              Show me people
            </div>
            <p style={{ fontFamily: F.body, fontSize: 12.5, fontWeight: 500, color: C.ink2, margin: '0 0 14px', lineHeight: 1.5 }}>
              {locBusy
                ? 'Working…'
                : distancePref === 'near'
                  ? locFresh
                    ? 'People closest to you first, based on where you actually are.'
                    : `Your location is ${locDaysAgo} days old, so it isn't being used — tap again to refresh it.`
                  : 'Using your college location, so your feed is ranked around your campus rather than around you.'}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {/* Labels name what actually happens. The old pair — "Near me" /
                  "My campus" — read as an abstract distance preference, so a user
                  had no way to tell that one option reveals where they live and
                  the other does not. Now it is a privacy choice on its face. */}
              {[
                { key: 'near', label: 'Use my precise location' },
                { key: 'campus', label: 'Use my college location instead' },
              ].map((opt) => {
                const on = distancePref === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    aria-pressed={on}
                    onClick={() => { triggerHaptic('light'); opt.key === 'near' ? chooseNearMe() : chooseCampus(); }}
                    style={{
                      padding: '12px 16px', minHeight: 46, borderRadius: 12,
                      border: `2px solid ${C.ink}`, cursor: locBusy ? 'wait' : 'pointer',
                      background: on ? C.yellow : C.card, color: C.ink,
                      fontFamily: F.body, fontSize: 14.5, fontWeight: on ? 700 : 600,
                      boxShadow: `3px 3px 0 ${C.ink}`, opacity: locBusy ? 0.6 : 1,
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {distancePref === 'near' && (
              <button
                className="st-slam"
                style={{ padding: '8px 12px', marginTop: 12 }}
                onClick={chooseCampus}
                disabled={locBusy}
              >
                Stop using my location
              </button>
            )}
          </div>

          <button
            className="st-slam"
            style={{ marginTop: 22 }}
            onClick={savePref}
            disabled={savingPref || pref.length === 0}
          >
            {savingPref ? 'Saving…' : 'Save preference'}
          </button>
        </div>

        {/* ════ PRIVACY ════ */}
        <SectionHead mark={C.red}>Privacy</SectionHead>

        <button
          className="st-slam"
          style={{ marginBottom: 10 }}
          onClick={() => { triggerHaptic('light'); setBlockedOpen(true); fetchBlockedUsers(); }}
        >
          Blocked people
        </button>
        <button
          className="st-slam"
          style={{ marginBottom: 10 }}
          onClick={() => { triggerHaptic('light'); setLegalOpen('privacy'); }}
        >
          Privacy policy
        </button>
        <button
          className="st-slam"
          style={{ marginBottom: 28 }}
          onClick={() => { triggerHaptic('light'); setLegalOpen('terms'); }}
        >
          Terms of use
        </button>

        {/* ════ ACCOUNT ════ */}
        <SectionHead mark={C.ink3}>Account</SectionHead>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button className="st-slam" onClick={() => {
            setCc({ collegeCode: '', email: '', otp: '', codeSent: false, busy: false });
            setCollegeOpen(true);
            api.get('/colleges').then((r) => setColleges(r.colleges || [])).catch(() => setColleges([]));
          }}>
            Change college ({myUser?.college || '—'})
          </button>
          <button className="st-slam" onClick={onSignOut}>Log out</button>
          <button className="st-slam danger" onClick={handleDeleteAccount}>Delete account</button>
        </div>
      </div>

      {/* ════ CHANGE COLLEGE ════ */}
      <AnimatePresence>
        {collegeOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setCollegeOpen(false)}
              style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(12,12,14,.62)', zIndex: 110 }}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              style={{ position: 'fixed', bottom: 0, left: 0, right: 0, maxHeight: '80dvh',
                backgroundColor: C.paper, borderTop: `2px solid ${C.ink}`, borderRadius: '22px 22px 0 0',
                zIndex: 111, display: 'flex', flexDirection: 'column', boxShadow: '0 -10px 40px rgba(0,0,0,.4)' }}
            >
              <div style={{ padding: '16px 20px', borderBottom: `2px solid ${C.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: F.heavy, fontSize: 18, fontWeight: 400, color: C.ink, letterSpacing: '-.01em', textTransform: 'uppercase' }}>Change college</span>
                <button onClick={() => setCollegeOpen(false)} aria-label="Close" className="st-close">
                  <X size={16} strokeWidth={3} />
                </button>
              </div>

              <div style={{ padding: 22, overflowY: 'auto' }}>
                <p style={{ fontFamily: F.body, fontSize: 13, fontWeight: 500, color: C.ink2, margin: '0 0 16px', lineHeight: 1.6 }}>
                  Verify you control an email at your new college. Your feed will refresh for your new campus.
                </p>
                <select
                  value={cc.collegeCode}
                  onChange={(e) => setCc((c) => ({ ...c, collegeCode: e.target.value }))}
                  style={{ width: '100%', marginBottom: 12, padding: '12px 14px', borderRadius: 12, border: `2px solid ${C.ink}`, background: C.card, fontFamily: F.body, fontSize: 14, fontWeight: 600, color: C.ink }}
                >
                  <option value="">Select your new college</option>
                  {colleges.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
                <input
                  type="email"
                  placeholder="College email"
                  value={cc.email}
                  onChange={(e) => setCc((c) => ({ ...c, email: e.target.value }))}
                  style={{ width: '100%', boxSizing: 'border-box', marginBottom: 12, padding: '12px 14px', borderRadius: 12, border: `2px solid ${C.ink}`, background: C.card, fontFamily: F.body, fontSize: 14, fontWeight: 600, color: C.ink }}
                />
                {!cc.codeSent ? (
                  <button
                    className="st-slam"
                    disabled={cc.busy}
                    onClick={async () => {
                      if (!cc.collegeCode || !cc.email) { toast.error('Select a college and enter your college email.'); return; }
                      setCc((c) => ({ ...c, busy: true }));
                      try {
                        await api.post('/auth/send-otp', { email: cc.email.trim(), collegeCode: cc.collegeCode });
                        toast.success(`Code sent to ${cc.email}.`);
                        setCc((c) => ({ ...c, codeSent: true, busy: false }));
                      } catch (e) { if (!e?.toasted) toast.error('Could not send code. Try again.'); setCc((c) => ({ ...c, busy: false })); }
                    }}
                  >
                    {cc.busy ? 'Sending…' : 'Send code'}
                  </button>
                ) : (
                  <>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="6-digit code"
                      value={cc.otp}
                      onChange={(e) => setCc((c) => ({ ...c, otp: e.target.value }))}
                      style={{ width: '100%', boxSizing: 'border-box', marginBottom: 12, padding: '12px 14px', borderRadius: 12, border: `2px solid ${C.ink}`, background: C.card, fontFamily: F.mono, fontSize: 18, fontWeight: 700, letterSpacing: '0.3em', color: C.ink }}
                    />
                    <button
                      className="st-slam yellow"
                      disabled={cc.busy}
                      onClick={async () => {
                        setCc((c) => ({ ...c, busy: true }));
                        try {
                          await api.post('/users/change-college', { email: cc.email.trim(), collegeCode: cc.collegeCode, otp: cc.otp.trim() });
                          toast.success('College updated. Your feed will refresh for your new campus.');
                          await refreshUser();
                          setCollegeOpen(false);
                        } catch (e) { if (!e?.toasted) toast.error('Could not change college. Try again.'); setCc((c) => ({ ...c, busy: false })); }
                      }}
                    >
                      {cc.busy ? 'Verifying…' : 'Verify & switch'}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ════ BLOCKED PEOPLE ════ */}
      <AnimatePresence>
        {blockedOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setBlockedOpen(false)}
              style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(12,12,14,.62)', zIndex: 110 }}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              style={{ position: 'fixed', bottom: 0, left: 0, right: 0, maxHeight: '75dvh',
                backgroundColor: C.paper, borderTop: `2px solid ${C.ink}`, borderRadius: '22px 22px 0 0',
                zIndex: 111, display: 'flex', flexDirection: 'column', boxShadow: '0 -10px 40px rgba(0,0,0,.4)' }}
            >
              <div style={{ padding: '16px 20px', borderBottom: `2px solid ${C.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: F.heavy, fontSize: 18, fontWeight: 400, color: C.ink, letterSpacing: '-.01em', textTransform: 'uppercase' }}>Blocked people</span>
                <button onClick={() => setBlockedOpen(false)} aria-label="Close" className="st-close">
                  <X size={16} strokeWidth={3} />
                </button>
              </div>

              <div style={{ padding: 22, overflowY: 'auto', flex: 1 }}>
                {loadingBlocked ? (
                  <p style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: C.ink3, textAlign: 'center', margin: '40px 0' }}>Loading…</p>
                ) : blockedList.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <p style={{ fontFamily: F.heavy, fontSize: 17, fontWeight: 400, color: C.ink, textTransform: 'uppercase', margin: '0 0 8px 0' }}>Nobody blocked</p>
                    <p style={{ fontFamily: F.body, fontSize: 13, fontWeight: 500, color: C.ink2, margin: 0 }}>Your block list is empty.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {blockedList.map((user) => (
                      <div key={user._id} className="st-row">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                          <img src={user.photo || FALLBACK_IMG} alt={user.name}
                            style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', border: `2px solid ${C.ink}`, flexShrink: 0 }} />
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontFamily: F.body, fontSize: 14.5, fontWeight: 700, color: C.ink, margin: 0 }}>{user.name}</p>
                            <p style={{ fontFamily: F.mono, fontSize: 9, fontWeight: 700, color: C.ink3, margin: '2px 0 0 0', textTransform: 'uppercase', letterSpacing: '.08em' }}>{user.branch} · {user.year}</p>
                          </div>
                        </div>
                        <button className="st-slam yellow" style={{ width: 'auto', padding: '9px 14px', flexShrink: 0 }} onClick={() => handleUnblock(user._id, user.name)}>
                          Unblock
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}

        {legalOpen && (
          <LegalSheet
            doc={legalOpen === 'privacy' ? PRIVACY : TERMS}
            onClose={() => setLegalOpen(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   LEGAL SHEETS — privacy policy + terms.

   Kept as plain constants in this file rather than fetched from the server on
   purpose: DPDP consent has to be informed, and a policy that fails to load
   (offline, server down) is a policy nobody read. The text ships with the app
   and is always available.

   No markdown parser and no dangerouslySetInnerHTML — every user-visible
   character comes from these literals, and the contact address is the only
   dynamic value, injected as a plain React text node.
   ═══════════════════════════════════════════════════════════════════════ */
const SUPPORT_EMAIL = 'support@matchalize.com';

const PRIVACY = {
  title: 'Privacy policy',
  updated: 'Last updated: today',
  intro:
    'Matchalize is for verified college students. Verifying you needs your college '
    + 'email address, so this page explains exactly what we hold, who can see it, and how to remove it.',
  sections: [
    {
      h: 'What we collect',
      p: [
        'Your college email address. We use it to send a one-time sign-in code and, once a year, to '
        + 'confirm you are still a student. We never show it to other users, and it is never included '
        + 'in anything another person can see about your profile.',
        'Your profile: name, age, photos, bio, prompts, interests, what you are looking for, your year '
        + '(UG or PG), and the year you expect to graduate.',
        'Your messages and who you match with.',
      ],
    },
    {
      h: 'A note on college email addresses',
      p: [
        'Indian college email addresses often contain your enrolment year, course and roll number — for '
        + 'example, an address beginning with your admission year. At some colleges, those numbers are '
        + 'listed in a public directory. We cannot change how your college formats addresses, so the '
        + 'practical effect is that we hold information that could identify you. We treat it as the most '
        + 'sensitive thing we store: it is never displayed publicly, never sent to another user, and is '
        + 'only ever used to send you a code.',
      ],
    },
    {
      h: 'Who can see what',
      p: [
        'Other users can see your name, age, photos, bio, prompts, interests, year and what you are '
        + 'looking for.',
        'Other users can never see your email address.',
      ],
    },
    {
      h: 'How long we keep things',
      p: [
        'Your account and profile stay until you delete them.',
        'If you delete your account, your profile, photos, bio and prompts are removed immediately and '
        + 'your chats are deactivated. Report records are retained for 30 days so that anything reported '
        + 'around that time can still be investigated.',
        'Your email address is kept during that 30-day window only, because it is what links a deleted '
        + 'account to its moderation history and because it stops the same address being used to '
        + 're-register immediately. It is removed when the window ends.',
      ],
    },
    {
      h: 'Deleting your account',
      p: [
        'Settings → Account → Delete account. Your profile is destroyed and you disappear from campus '
        + 'view immediately.',
        'One thing to know before you do: messages you already sent remain in the other person\'s chat. '
        + 'Those are their history too, and we cannot delete their copy for them.',
        'This cannot be undone.',
      ],
    },
    {
      h: 'Your email is never used for marketing',
      p: [
        'We send you account and security emails only — your sign-in code, your yearly student check, '
        + 'and a notice if your campus is added to Matchalize when you asked us to. We do not sell your '
        + 'data or use your address for advertising.',
      ],
    },
    {
      h: 'Reporting a concern',
      p: [
        `If anything here is unclear, or you think we are handling your data wrongly, contact us at ${SUPPORT_EMAIL}.`,
      ],
    },
  ],
};

const TERMS = {
  title: 'Terms of use',
  updated: 'Last updated: today',
  intro: 'By using Matchalize you agree to these terms. The short version: be a real student, be a decent person, and use the app to date rather than harass people.',
  sections: [
    {
      h: 'Students only',
      p: [
        'Matchalize is for currently enrolled college students. You verify using your college email '
        + 'address, and we re-check it once a year to keep the app students-only.',
        'Do not sign up with an address that is not yours, and do not help someone else get around this. '
        + 'An account that is not genuinely yours may be removed without notice.',
        'If you graduate, your access will end when your inbox stops working. That is not a punishment — it '
        + 'is how the app stays students-only.',
      ],
    },
    {
      h: 'Your profile',
      p: [
        'Use a real photo of yourself. Do not use someone else\'s photo, and do not use anything '
        + 'explicit or offensive.',
        'Put real effort in. Fake profiles waste everyone\'s time and are removed.',
      ],
    },
    {
      h: 'How you must behave',
      p: [
        'Be respectful. No harassment, hate speech, threats, stalking, or targeting anyone for who they '
        + 'are. This applies to your profile, prompts, and every message you send.',
        'No nudity or sexual content in your photos.',
        'No scraping, bots, or automated access.',
        'Do not attempt to access accounts that are not yours, or to circumvent the student verification.',
      ],
    },
    {
      h: 'Reporting',
      p: [
        'You can block anyone, and report anyone, from their profile or from Settings. Reports are taken '
        + 'seriously and accounts may be suspended or removed.',
        'Do not report someone you dislike. Reports are for abuse.',
      ],
    },
    {
      h: 'Your account',
      p: [
        'You are responsible for what happens on your account, including who you let use your phone.',
        'We may suspend or remove accounts that break these terms, that are fake, or that are reported '
        + 'and upheld.',
        'You can delete your account at any time from Settings.',
      ],
    },
    {
      h: 'No guarantee',
      p: [
        'Matchalize is provided as-is. We work hard to keep it safe and useful, but we cannot promise it '
        + 'will always be available or error-free.',
      ],
    },
    {
      h: 'Changes to these terms',
      p: [
        'If we change these terms materially, we will update the date at the top of this page.',
        `Questions: ${SUPPORT_EMAIL}`,
      ],
    },
  ],
};

/** Renders one legal doc into the sheet. Plain text nodes only. */
const LegalSheet = ({ doc, onClose }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    style={{ position: 'fixed', inset: 0, zIndex: 620, backgroundColor: C.paper }}
  >
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      maxWidth: 560, margin: '0 auto', backgroundColor: C.paper,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 20px', borderBottom: `2px solid ${C.ink}`, flexShrink: 0,
      }}>
        <span style={{ fontFamily: F.head, fontSize: 18, fontWeight: 700, color: C.ink }}>{doc.title}</span>
        <button className="st-close" onClick={onClose} aria-label="Close" style={{
          width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: C.card, border: `2px solid ${C.ink}`, borderRadius: 11, cursor: 'pointer',
          boxShadow: `3px 3px 0 ${C.ink}`, color: C.ink,
        }}>
          <X size={16} strokeWidth={3} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 40px', WebkitOverflowScrolling: 'touch' }}>
        <p style={{ fontFamily: F.body, fontSize: 10.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: C.ink3, margin: '0 0 14px' }}>
          {doc.updated}
        </p>
        <p style={{ fontFamily: F.body, fontSize: 14, color: C.ink, margin: '0 0 22px', lineHeight: 1.65 }}>
          {doc.intro}
        </p>

        {doc.sections.map((s) => (
          <div key={s.h} style={{ marginBottom: 22 }}>
            <h3 style={{ fontFamily: F.head, fontSize: 15, fontWeight: 700, color: C.ink, margin: '0 0 8px' }}>{s.h}</h3>
            {s.p.map((para) => (
              <p key={para.slice(0, 40)} style={{ fontFamily: F.body, fontSize: 13.5, color: C.ink, margin: '0 0 10px', lineHeight: 1.7 }}>
                {para}
              </p>
            ))}
          </div>
        ))}
      </div>
    </div>
  </motion.div>
);

export default Settings;
