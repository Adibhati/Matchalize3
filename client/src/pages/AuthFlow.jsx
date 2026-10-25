import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Search, CheckCircle2 } from 'lucide-react';
import { api } from '../utils/api';
import { useChromeColor } from '../utils/chrome';
import { useIsDesktop } from '../utils/useIsDesktop';
import { triggerHaptic } from '../utils/haptics';
import { useAuth } from '../utils/AuthContext';
import socket from '../utils/socket';
import neu from '../styles/neu';
import campusPhoto from '../assets/college-town-aesthetic-cute-college-town.jpg';
import AccountSuspendedScreen from '../components/AccountSuspendedScreen';
import { AUTH_CSS, MOBILE_AUTH_CSS, AUTH_SCENE_CSS, AUTH_SMOOTH_CSS } from './Auth.jsx';

const M = neu;

const STEP_ORDER = ['college', 'email', 'request', 'code', 'next'];
const EASE_OUT = [0.22, 1, 0.36, 1];

/* The shared scene sheet was written for `otp`/`verify` step names. Map this
   flow's names onto those so each step still gets its own photo grade. */
const SCENE_KIND = {
  college: 'college',
  email: 'email',
  request: 'request',
  code: 'otp',
  next: 'verify',
};

/* Everything the four shared sheets do not know about: the animated per-step
   surface, the two step palettes they predate, and the handful of classes this
   markup introduces. Loaded last so it wins on ties. */
const FLOW_FIX_CSS = `
  /* Step palettes the shared sheets predate. Both stay on the cream language;
     flip these to the .au-root-otp dark tokens if you want the old code screen. */
  .au-root-code,
  .au-root-next {
    --paper: #F1EDE2;
    --ink: #111211;
    --ink2: #383832;
    --muted: #77766F;
    --card: #F8F5EC;
    --accent: #779477;
    --tint: rgba(119,148,119,.18);
  }

  /* .au-screen is the animated per-step surface, so the shared sheets' rules
     for .au-step's direct grid children no longer match anything. Put the
     two-column grid back on .au-screen instead. */
  .au-root .au-step {
    display: flex;
    flex-direction: column;
    /* Keyboard lift is written as an inline transform; let it ease. */
    transition: transform .28s cubic-bezier(.32,.72,0,1);
  }

  .au-root .au-screen {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(220px, .72fr);
    align-content: center;
    align-items: center;
    gap: 19px clamp(22px, 4vw, 45px);
    width: 100%;
    min-width: 0;
  }

  .au-screen > .au-headline { grid-column: 1; }
  .au-screen > .au-sub { grid-column: 1; }

  .au-screen > .au-art {
    grid-column: 2;
    grid-row: 1 / span 2;
  }

  .au-screen > *:not(.au-headline):not(.au-sub):not(.au-art) {
    grid-column: 1 / -1;
    min-width: 0;
  }

  .au-huh {
    font-family: 'Bowlby One SC', ${M.fontHeavy};
    font-weight: 400;
    letter-spacing: -.055em;
    white-space: nowrap;
    text-shadow: 1.5px 1.5px 0 ${M.yellow};
  }

  /* "change" affordance inside the picked-college strip */
  .au-strip { flex-wrap: wrap; }
  .au-strip > span { min-width: 0; overflow-wrap: anywhere; }

  .au-strip-change {
    align-self: auto;
    margin-left: auto;
    min-height: 0;
    padding: 4px 2px;
    background: transparent;
    color: ${M.ink2};
    border: 0;
    border-bottom: 1.5px solid currentColor;
    font: 700 11px/1 ${M.fontMono};
    letter-spacing: .08em;
    text-transform: uppercase;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
  .au-strip-change:active { opacity: .6; }

  .au-rowsep {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: wrap;
  }
  .au-rowsep .au-ghost { align-self: auto; }
  /* .au-input is width:100%; two of them in a row need to share instead. */
  .au-rowsep .au-input { flex: 1 1 0; min-width: 0; }

  /* The no-match block is one message plus one action, not one grid cell. */
  .au-results > div { grid-column: 1 / -1; display: flex; flex-direction: column; gap: 12px; }
  .au-results > div .au-empty { padding: 0; }

  .au-nextlist {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 4px 0;
  }

  .au-nextrow {
    display: flex;
    align-items: baseline;
    gap: 14px;
    padding: 13px 2px;
    border-bottom: 1px solid rgba(17,18,17,.1);
    color: ${M.ink2};
    font: 500 14px/1.5 ${M.fontBody};
  }
  .au-nextrow:last-child { border-bottom: 0; }

  .au-nextrow > b {
    flex: 0 0 auto;
    color: ${M.ink};
    font: 700 11px/1 ${M.fontMono};
    letter-spacing: .08em;
  }

  .au-nextrow > span { min-width: 0; }
  .au-nextrow strong { color: ${M.ink}; font-weight: 700; }

  .au-verify-note {
    margin: 0;
    color: ${M.ink2};
    font: 700 11px/1.6 ${M.fontMono};
    letter-spacing: .06em;
    text-transform: uppercase;
  }

  @media (max-width: 700px) {
    .au-root.au-root-code,
    .au-root.au-root-next {
      --ink: ${M.ink};
      --ink2: ${M.ink2};
      --muted: ${M.ink2};
      --paper: ${M.paper};
      --card: ${M.card};
      --accent: ${M.green};
      --tint: rgba(91,217,138,.14);
    }

    .au-screen {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 13px;
    }

    .au-screen > .au-art { display: none !important; }

    /* The lifted form leaves the keyboard's band empty; keep the photo out of
       it rather than letting the page show through behind the keys. */
    .au-root .au-campus-scene::after {
      display: block;
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      height: var(--kb, 0px);
      background: ${M.paper};
      pointer-events: none;
      transition: height .18s ease;
    }
  }
`;

/* Desktop-only little illustrations (mobile uses the campus photo scene). */
function StepArt({ kind }) {
  if (kind === 'college') {
    return (
      <svg viewBox="0 0 230 140" aria-hidden="true">
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="34" y="58" width="104" height="56" rx="6" fill="var(--tint)" stroke="var(--ink)" strokeWidth="3" />
          <path d="M28 58 86 26l58 32" stroke="var(--ink)" strokeWidth="3" />
          <rect x="76" y="76" width="20" height="38" rx="3" fill="var(--accent)" stroke="var(--ink)" strokeWidth="3" />
          <circle cx="56" cy="76" r="6" fill="var(--paper)" stroke="var(--ink)" strokeWidth="3" />
          <circle cx="116" cy="76" r="6" fill="var(--paper)" stroke="var(--ink)" strokeWidth="3" />
          <g className="art-float">
            <circle cx="168" cy="62" r="26" fill="var(--card)" stroke="var(--ink)" strokeWidth="3.5" />
            <line x1="186" y1="82" x2="206" y2="104" stroke="var(--ink)" strokeWidth="5" />
          </g>
        </g>
      </svg>
    );
  }
  if (kind === 'email') {
    return (
      <svg viewBox="0 0 230 140" aria-hidden="true">
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <g className="art-float">
            <rect x="48" y="42" width="134" height="86" rx="10" fill="var(--card)" stroke="var(--ink)" strokeWidth="3.5" />
            <path d="M52 50l63 46 63-46" stroke="var(--ink)" strokeWidth="3.5" />
          </g>
          <circle className="art-pulse" cx="196" cy="36" r="10" fill="var(--accent)" stroke="var(--ink)" strokeWidth="3" />
          <path d="M28 96h12M22 112h20" stroke="var(--ink)" strokeWidth="3.5" />
        </g>
      </svg>
    );
  }
  if (kind === 'code') {
    return (
      <svg viewBox="0 0 230 140" aria-hidden="true">
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <g className="art-float">
            <rect x="40" y="44" width="44" height="58" rx="10" fill="var(--card)" stroke="var(--ink)" strokeWidth="3.5" />
            <rect x="93" y="30" width="44" height="58" rx="10" fill="var(--accent)" stroke="var(--ink)" strokeWidth="3.5" />
            <rect x="146" y="44" width="44" height="58" rx="10" fill="var(--card)" stroke="var(--ink)" strokeWidth="3.5" />
          </g>
          <circle cx="115" cy="59" r="5" fill="var(--ink)" />
          <path d="M52 118h126" stroke="var(--ink)" strokeWidth="3.5" strokeDasharray="2 10" />
        </g>
      </svg>
    );
  }
  if (kind === 'request') {
    return (
      <svg viewBox="0 0 230 140" aria-hidden="true">
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <g className="art-float">
            <rect x="52" y="40" width="126" height="80" rx="10" fill="var(--card)" stroke="var(--ink)" strokeWidth="3.5" />
            <path d="M66 58h98M66 76h72M66 94h54" stroke="var(--ink)" strokeWidth="3.5" />
          </g>
          <circle className="art-pulse" cx="190" cy="42" r="10" fill="var(--accent)" stroke="var(--ink)" strokeWidth="3" />
        </g>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 230 140" aria-hidden="true">
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 118h186" stroke="var(--ink)" strokeWidth="3.5" />
        <path d="M40 118c22-34 54-52 92-56" stroke="var(--ink)" strokeWidth="3.5" strokeDasharray="1 11" />
        <g className="art-float">
          <path d="M132 74l52-30-14 56-16-12-22 8z" fill="var(--accent)" stroke="var(--ink)" strokeWidth="3.5" />
        </g>
        <circle className="art-pulse" cx="196" cy="34" r="9" fill="var(--paper)" stroke="var(--ink)" strokeWidth="3" />
      </g>
    </svg>
  );
}

export default function AuthFlow({ onSuccess, onFinished, onAuthed, reverifyOnly = false }) {
  const isDesktop = useIsDesktop();
  const reduceMotion = useReducedMotion();

  const [step, setStep] = useState(reverifyOnly ? 'code' : 'college');
  const [dir, setDir] = useState(1);
  const [suspendedData, setSuspendedData] = useState(() => {
    try {
      const data = JSON.parse(localStorage.getItem('matchalize_suspended'));
      return data?.reason ? data : null;
    } catch {
      return null;
    }
  });

  /* college */
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [college, setCollege] = useState(null);

  /* email */
  const [email, setEmail] = useState('');
  const [emailErr, setEmailErr] = useState('');
  const [sending, setSending] = useState(false);

  /* code */
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [codeErr, setCodeErr] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  /* request */
  const [requestSent, setRequestSent] = useState(false);
  const [requestBusy, setRequestBusy] = useState(false);
  const [requestErr, setRequestErr] = useState('');
  const [requestForm, setRequestForm] = useState({ name: '', email: '', city: '', state: '' });

  /* keyboard: how far the input needs to lift, with hard caps */
  const [kb, setKb] = useState({ open: false, height: 0, lift: 0 });

  const fieldRef = useRef(null);
  const boxRefs = useRef([]);
  const rootRef = useRef(null);

  const { login } = useAuth() || {};

  // Auth is cream where the splash is near-black, so the status-bar strip and
  // the overscroll gutter must switch with it or the two read as different apps.
  useChromeColor(M.paper);

  /* ---------- keyboard handling (the threshold fix) ---------- */
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return undefined;
    let raf = 0;

    const measure = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const kbH = Math.round(window.innerHeight - vv.height - vv.offsetTop);

        /* threshold 1: only treat it as a keyboard above 110px (ignores toolbar jitter) */
        if (kbH <= 110) {
          setKb((k) => (k.open || k.lift || k.height ? { open: false, height: 0, lift: 0 } : k));
          return;
        }

        /* stop the browser's auto-pan — that's what flung the headline away.
           The root is its own scroll container, so reset that too. */
        if (window.scrollY > 0) window.scrollTo(0, 0);
        const root = rootRef.current;
        if (root && root.scrollTop) root.scrollTop = 0;

        let lift = 0;
        const el = fieldRef.current;
        if (el && el.getBoundingClientRect) {
          const r = el.getBoundingClientRect();
          /* threshold 2: lift the minimum needed to clear the keyboard… */
          const needed = Math.round(r.bottom + 14 - vv.height);
          /* threshold 3: …but never more than 190px, so it can't fly off */
          lift = Math.max(0, Math.min(needed, 190));
        }
        setKb({ open: true, height: kbH, lift });
      });
    };

    vv.addEventListener('resize', measure);
    vv.addEventListener('scroll', measure);
    measure();
    return () => {
      vv.removeEventListener('resize', measure);
      vv.removeEventListener('scroll', measure);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  /* ---------- navigation ---------- */
  const go = (next) => {
    if (next === step) return;
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    setKb({ open: false, height: 0, lift: 0 });
    setDir(STEP_ORDER.indexOf(next) >= STEP_ORDER.indexOf(step) ? 1 : -1);
    setStep(next);
  };

  const finish = () => {
    const cb = onSuccess || onFinished || onAuthed;
    if (cb) cb();
  };

  /* ---------- college search ---------- */
  useEffect(() => {
    if (step !== 'college') return undefined;
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return undefined;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        /* GET /api/colleges?q= — the route matches name, city and state.
           The server caps at 50 and applies the campus allow-list gate. */
        const res = await api.get(`/colleges?q=${encodeURIComponent(q)}`);
        const list = Array.isArray(res) ? res : (res?.colleges || []);
        setResults(list.slice(0, 9));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 260);
    return () => clearTimeout(t);
  }, [query, step]);

  const chooseCollege = (c) => {
    triggerHaptic('light');
    setCollege(c);
    setQuery(c.name);
    setTimeout(() => go('email'), 420);
  };

  /* ---------- email ---------- */
  const submitEmail = async (e) => {
    e && e.preventDefault();
    if (!college) return;
    const value = email.trim().toLowerCase();

    /* Soft client check only — POST /auth/send-otp re-validates the domain
       against the college server-side and that message wins. */
    const domains = college.domains || [];
    if (domains.length && !domains.some((d) => value.endsWith(`@${String(d).toLowerCase().replace(/^@/, '')}`))) {
      setEmailErr(`hmm — that doesn't look like a ${college.name} address.`);
      return;
    }

    setSending(true);
    setEmailErr('');
    try {
      await api.post('/auth/send-otp', { email: value, collegeCode: college.code });
      triggerHaptic('light');
      go('code');
    } catch (err) {
      triggerHaptic('heavy');
      setEmailErr(err?.message || "couldn't send the code. one more try?");
    } finally {
      setSending(false);
    }
  };

  /* ---------- college request ---------- */
  const submitRequest = async (e) => {
    e && e.preventDefault();
    if (!requestForm.email.trim()) return;

    setRequestBusy(true);
    setRequestErr('');
    try {
      await api.post('/colleges/request', {
        ...requestForm,
        collegeName: query.trim() || requestForm.collegeName,
        email: requestForm.email.trim().toLowerCase(),
      });
      triggerHaptic('success');
      setRequestSent(true);
    } catch (err) {
      triggerHaptic('heavy');
      setRequestErr(err?.message || "couldn't send that request. one more try?");
    } finally {
      setRequestBusy(false);
    }
  };

  /* ---------- code ---------- */
  const setDigit = (i, raw) => {
    const ch = (raw || '').replace(/\D/g, '').slice(-1);
    setDigits((prev) => { const n = [...prev]; n[i] = ch; return n; });
    setCodeErr('');
    if (ch && i < 5) boxRefs.current[i + 1]?.focus();
  };

  const onDigitKey = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      e.preventDefault();
      boxRefs.current[i - 1]?.focus();
      setDigits((prev) => { const n = [...prev]; n[i - 1] = ''; return n; });
    }
  };

  const onDigitPaste = (e) => {
    const text = (e.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, 6);
    if (!text) return;
    e.preventDefault();
    setDigits(Array.from({ length: 6 }, (_, i) => text[i] || ''));
    boxRefs.current[Math.min(text.length, 5)]?.focus();
  };

  const verifyCode = async (e) => {
    e && e.preventDefault();
    const code = digits.join('');
    if (code.length < 6 || verifying || verified) return;
    setVerifying(true);
    setCodeErr('');

    try {
      if (reverifyOnly) {
        await api.post('/auth/reverify/confirm', { otp: code });
        triggerHaptic('success');
        finish();
        return;
      }

      const res = await api.post('/auth/verify-otp', { email: email.trim().toLowerCase(), otp: code });
      triggerHaptic('success');
      setVerified(true);

      try { localStorage.removeItem('matchalize_suspended'); } catch { /* ignore */ }
      login?.(res.user);
      if (socket && socket.disconnected) socket.connect();

      setTimeout(() => go('next'), 900);
    } catch (err) {
      triggerHaptic('heavy');
      setCodeErr(err?.message || "that code didn't match. try again?");
      setDigits(['', '', '', '', '', '']);
      setTimeout(() => boxRefs.current[0]?.focus(), 60);
    } finally {
      setVerifying(false);
    }
  };

  const resendCode = async () => {
    if (reverifyOnly) {
      try { await api.post('/auth/reverify'); } catch { /* quiet */ }
      return;
    }
    if (!college) return;
    try {
      await api.post('/auth/send-otp', { email: email.trim().toLowerCase(), collegeCode: college.code });
    } catch { /* quiet */ }
  };

  useEffect(() => {
    if (step !== 'code') return undefined;
    const t = setTimeout(() => boxRefs.current[0]?.focus(), 520);
    return () => clearTimeout(t);
  }, [step]);

  /* Annual re-verification: the code is sent by the server on request. */
  useEffect(() => {
    if (!reverifyOnly) return undefined;
    let cancelled = false;
    api.post('/auth/reverify')
      .catch((err) => {
        if (!cancelled) setCodeErr(err?.message || 'Could not send your verification code.');
      });
    return () => { cancelled = true; };
  }, [reverifyOnly]);

  /* Suspension is signalled over HTTP (a 403 that api.js intercepts) and by
     the shared socket writing localStorage — not by a bespoke socket event. */
  useEffect(() => {
    const onStorage = () => {
      try {
        const data = JSON.parse(localStorage.getItem('matchalize_suspended'));
        if (data?.reason) setSuspendedData(data);
      } catch { /* ignore */ }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  /* Render before the style tags: AccountSuspendedScreen injects its own
     `as-*` sheet and must never depend on an `au-*` rule being present. */
  if (suspendedData) {
    return (
      <AccountSuspendedScreen
        reason={suspendedData.reason}
        suspendedAt={suspendedData.suspendedAt}
        bottomSlot={
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem('matchalize_suspended');
              setSuspendedData(null);
            }}
          >
            Suspension lifted? Try logging in again
          </button>
        }
      />
    );
  }

  /* direction-aware, never abrupt */
  const screenVariants = {
    initial: (d) => (reduceMotion ? { opacity: 0 } : { opacity: 0, x: 34 * d, y: 12, filter: 'blur(6px)' }),
    animate: { opacity: 1, x: 0, y: 0, filter: 'blur(0px)', transition: { duration: 0.5, ease: EASE_OUT } },
    exit: (d) => (reduceMotion
      ? { opacity: 0, transition: { duration: 0.16 } }
      : { opacity: 0, x: -28 * d, y: -10, filter: 'blur(6px)', transition: { duration: 0.24, ease: [0.5, 0, 0.75, 0] } }),
  };

  const showArt = isDesktop && !reverifyOnly;

  return (
    <div
      ref={rootRef}
      className={`au-root au-root-${step}`}
      style={{ '--kb': kb.open ? `${kb.height}px` : '0px' }}
    >
      <style>{AUTH_CSS}</style>
      <style>{MOBILE_AUTH_CSS}</style>
      <style>{AUTH_SCENE_CSS}</style>
      <style>{AUTH_SMOOTH_CSS}</style>
      <style>{FLOW_FIX_CSS}</style>

      <div className={`au-campus-scene au-campus-scene-${SCENE_KIND[step] || 'college'}${verified ? ' is-verified' : ''}`}>
        <img className="au-campus-photo" src={campusPhoto} alt="" draggable="false" />
        <div className="au-campus-wash" />
      </div>

      <div className="au-fit">
        <div className="au-panel">
          <div className="au-brandbar">
            <span className="au-wordmark">
              huh<span className="au-brand-question">?</span>
            </span>
          </div>

          <div
            className="au-step"
            style={kb.open && kb.lift > 0 ? { transform: `translateY(-${kb.lift}px)` } : undefined}
          >
            <AnimatePresence mode="wait" custom={dir} initial={false}>
              <motion.div
                key={step}
                className="au-screen"
                custom={dir}
                variants={screenVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                {step === 'college' && (
                  <>
                    <h1 className="au-headline">your campus, <span className="au-huh">huh?</span></h1>
                    <p className="au-sub">search your college — <b>real students only</b>, so this part matters.</p>

                    <form className="au-form" onSubmit={(e) => e.preventDefault()}>
                      <label className="au-mobile-field-label" htmlFor="au-college-search">your college</label>
                      <div className="au-searchwrap">
                        <span className="au-searchicon"><Search size={18} strokeWidth={2.4} /></span>
                        <input
                          id="au-college-search"
                          ref={(el) => { fieldRef.current = el; }}
                          className="au-search"
                          type="text"
                          inputMode="search"
                          autoComplete="off"
                          autoCorrect="off"
                          autoCapitalize="none"
                          spellCheck="false"
                          placeholder="start typing your college…"
                          value={query}
                          onChange={(e) => { setQuery(e.target.value); setCollege(null); setRequestSent(false); }}
                        />
                      </div>

                      {(results.length > 0 || (query.trim().length >= 2 && !college)) && (
                        <div className="au-results" role="listbox" aria-label="College suggestions">
                          {results.map((c) => {
                            const chosen = college && c.code === college.code;
                            return (
                              <button
                                type="button"
                                key={c.code || c.name}
                                role="option"
                                aria-selected={!!chosen}
                                className={`au-result${chosen ? ' chosen' : ''}`}
                                onClick={() => chooseCollege(c)}
                              >
                                <span className="au-result-name">{c.name}</span>
                                <span className="au-result-meta">
                                  {[c.city, c.state].filter(Boolean).join(', ') || c.domains?.[0] || ''}
                                </span>
                              </button>
                            );
                          })}
                          {results.length === 0 && (
                            <div>
                              <p className="au-empty">
                                {searching ? 'looking…' : `no match for “${query.trim()}” — check the spelling?`}
                              </p>
                              {!searching && !requestSent && (
                                <button
                                  className="au-cta"
                                  type="button"
                                  onClick={() => {
                                    setRequestForm((f) => ({ ...f, email, collegeName: query.trim() }));
                                    go('request');
                                  }}
                                >
                                  request this college
                                </button>
                              )}
                              {requestSent && (
                                <div className="au-strip">
                                  <CheckCircle2 size={17} strokeWidth={2.4} />
                                  <span>request received</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </form>
                  </>
                )}

                {step === 'email' && (
                  <>
                    <h1 className="au-headline">college email, <span className="au-huh">huh?</span></h1>
                    <p className="au-sub">the one your college gave you. we send a <b>6-digit code</b> there — nothing else.</p>

                    {college && (
                      <div className="au-strip">
                        <CheckCircle2 size={17} strokeWidth={2.4} />
                        <span>{college.name}</span>
                        <button type="button" className="au-ghost au-strip-change" onClick={() => go('college')}>change</button>
                      </div>
                    )}

                    <form className="au-form" onSubmit={submitEmail}>
                      <label className="au-mobile-field-label" htmlFor="au-email">college email</label>
                      <input
                        id="au-email"
                        ref={(el) => { fieldRef.current = el; }}
                        className="au-input"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck="false"
                        placeholder={college?.domains?.[0] ? `you@${college.domains[0]}` : 'you@college.edu'}
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setEmailErr(''); }}
                        disabled={sending}
                      />
                      {emailErr && <div className="au-banner"><p>{emailErr}</p></div>}
                      <button className="au-cta" type="submit" disabled={sending || !email.trim()}>
                        {sending ? 'sending…' : 'send my code'}
                      </button>
                      <button type="button" className="au-ghost" onClick={() => go('college')} disabled={sending}>
                        ← wrong college? go back
                      </button>
                    </form>
                  </>
                )}

                {step === 'request' && (
                  <>
                    <h1 className="au-headline">tell us your campus, <span className="au-huh">huh?</span></h1>
                    <p className="au-sub">we'll add <b>{query.trim() || 'your college'}</b> and let you in once it's live.</p>

                    {requestSent ? (
                      <>
                        <div className="au-strip">
                          <CheckCircle2 size={17} strokeWidth={2.4} />
                          <span>request received — we'll email you</span>
                        </div>
                        <button className="au-cta" type="button" onClick={() => go('college')}>
                          back to search
                        </button>
                      </>
                    ) : (
                      <form className="au-form" onSubmit={submitRequest}>
                        <label className="au-mobile-field-label" htmlFor="au-req-email">your email</label>
                        <input
                          id="au-req-email"
                          className="au-input"
                          type="email"
                          inputMode="email"
                          autoComplete="email"
                          spellCheck="false"
                          placeholder="you@college.edu"
                          value={requestForm.email}
                          onChange={(e) => setRequestForm((f) => ({ ...f, email: e.target.value }))}
                          disabled={requestBusy}
                        />

                        <label className="au-mobile-field-label" htmlFor="au-req-name">your name</label>
                        <input
                          id="au-req-name"
                          className="au-input"
                          type="text"
                          autoComplete="name"
                          placeholder="what your classmates call you"
                          value={requestForm.name}
                          onChange={(e) => setRequestForm((f) => ({ ...f, name: e.target.value }))}
                          disabled={requestBusy}
                        />

                        <div className="au-rowsep">
                          <input
                            className="au-input"
                            type="text"
                            autoComplete="address-level2"
                            placeholder="city"
                            aria-label="City"
                            value={requestForm.city}
                            onChange={(e) => setRequestForm((f) => ({ ...f, city: e.target.value }))}
                            disabled={requestBusy}
                          />
                          <input
                            className="au-input"
                            type="text"
                            autoComplete="address-level1"
                            placeholder="state"
                            aria-label="State"
                            value={requestForm.state}
                            onChange={(e) => setRequestForm((f) => ({ ...f, state: e.target.value }))}
                            disabled={requestBusy}
                          />
                        </div>

                        {requestErr && <div className="au-banner"><p>{requestErr}</p></div>}
                        <button className="au-cta" type="submit" disabled={requestBusy || !requestForm.email.trim()}>
                          {requestBusy ? 'sending…' : 'request my college'}
                        </button>
                        <button type="button" className="au-ghost" onClick={() => go('college')} disabled={requestBusy}>
                          ← keep searching
                        </button>
                      </form>
                    )}
                  </>
                )}

                {step === 'code' && (
                  <>
                    <h1 className="au-headline">check your inbox, <span className="au-huh">huh?</span></h1>
                    {reverifyOnly ? (
                      <p className="au-sub">a fresh code for your annual re-verification.</p>
                    ) : (
                      <p className="au-sub">six digits, headed to <b className="low">{email}</b>.</p>
                    )}

                    <form className="au-form" onSubmit={verifyCode}>
                      <div className="au-otp" ref={(el) => { fieldRef.current = el; }}>
                        {digits.map((d, i) => (
                          <input
                            key={i}
                            ref={(el) => { boxRefs.current[i] = el; }}
                            className={`au-box${codeErr ? ' err' : ''}${verified ? ' ok' : ''}`}
                            type="text"
                            inputMode="numeric"
                            aria-label={`Digit ${i + 1}`}
                            autoComplete={i === 0 ? 'one-time-code' : 'off'}
                            maxLength={1}
                            value={d}
                            onChange={(e) => setDigit(i, e.target.value)}
                            onKeyDown={(e) => onDigitKey(i, e)}
                            onPaste={i === 0 ? onDigitPaste : undefined}
                            onFocus={(e) => e.target.select()}
                            disabled={verifying || verified}
                          />
                        ))}
                      </div>

                      {codeErr && <div className="au-banner"><p>{codeErr}</p></div>}
                      {verified && (
                        <div className="au-strip"><CheckCircle2 size={17} strokeWidth={2.4} /><span>that's you — verified</span></div>
                      )}

                      <button className="au-cta" type="submit" disabled={verifying || verified || digits.join('').length < 6}>
                        {verifying ? 'checking…' : verified ? 'verified ✓' : 'verify me'}
                      </button>

                      <div className="au-rowsep">
                        <button type="button" className="au-ghost" onClick={resendCode}>resend code</button>
                        {!reverifyOnly && (
                          <button type="button" className="au-ghost" onClick={() => go('email')}>wrong email?</button>
                        )}
                      </div>
                    </form>
                  </>
                )}

                {step === 'next' && (
                  <>
                    <h1 className="au-headline">let's move forward, <span className="au-huh">huh?</span></h1>
                    <p className="au-sub">you're in — <b>{college?.name || 'your campus'}</b> is locked. here's what's coming:</p>

                    <div className="au-nextlist">
                      <div className="au-nextrow"><b>01</b><span><strong>your profile</strong> — photos, vibe, the basics</span></div>
                      <div className="au-nextrow"><b>02</b><span><strong>your people</strong> — students from your campus only</span></div>
                      <div className="au-nextrow"><b>03</b><span><strong>your feed</strong> — what's happening around you</span></div>
                    </div>

                    <button className="au-cta" type="button" onClick={finish}>
                      sounds good — let's go
                    </button>
                  </>
                )}

                {showArt && (
                  <div className="au-art">
                    <StepArt kind={step} />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}