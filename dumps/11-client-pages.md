# Chunk 11 — Client Pages

> Matchalize · `client-pages` · files 11 of 25 chunks · 1 file(s) · 53 KB · ~15,550 tokens
> Generated 2026-10-09 14:03.
> Paste-safe: within the 100 KB / ~29,257 token target.
>
> Contains:
> - `./client/src/pages/Auth.jsx`

---
### ./client/src/pages/Auth.jsx

```
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { api } from '../utils/api';
import socket from '../utils/socket';
import { triggerHaptic } from '../utils/haptics';
import { CheckCircle2, Search, GraduationCap } from 'lucide-react';
import AccountSuspendedScreen from '../components/AccountSuspendedScreen';
import { useAuth } from '../utils/AuthContext';

/* ── Locked tokens — the exact candy-box set Header / ProfileCard / AppShell /
      Settings use. This screen was the last cream-page holdout; it now sits on
      the same desk as everything after login, so Splash → Auth → Deck reads as
      one product. Hardcoded hex on purpose: the deck chrome ignores theme.js,
      and this screen must stand alone before any of it has mounted. ── */
const T = {
  desk: '#131313',
  paper: '#FFF9EC',
  card: '#FFFFFF',
  ink: '#191919',
  ink2: '#5F5B52',
  ink3: '#A39E92',
  yellow: '#FFD43D',
  coral: '#FF7A59',
  green: '#5BD98A',
  red: '#E5484D',
  fontHeavy: "'Archivo Black', 'Arial Black', sans-serif",
  fontBody: "'Inter', -apple-system, 'Segoe UI', sans-serif",
  fontMono: "'Space Mono', 'Courier New', monospace",
  fontHand: "'Caveat', 'Segoe Script', cursive",
};

/* One injected stylesheet, au- prefix — same pattern as Header's hd- /
   ProfileCard's pc- / Settings' st-. Restraint is deliberate: no grain, no
   decorative icon tiles — the candy-box family identifies sections with
   marker squares and type, and yellow does all the accent work. */
const AUTH_CSS = `
  /* Caveat is not in the global <link> set in index.html — Header and Splash
     each declare it, and this screen has to stand on its own because it can
     be reached without either having mounted. */
  @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@700&display=swap');

  .au-root {
    --paper: ${T.paper}; --card: ${T.card}; --ink: ${T.ink};
    --ink2: ${T.ink2}; --ink3: ${T.ink3};
    --yellow: ${T.yellow}; --coral: ${T.coral}; --green: ${T.green}; --red: ${T.red};
    --desk: ${T.desk}; --bw: 2px;
    --heavy: ${T.fontHeavy}; --body: ${T.fontBody};
    --mono: ${T.fontMono}; --hand: ${T.fontHand};

    min-height: 100vh; min-height: 100dvh; width: 100%;
    display: flex;
    padding: max(24px, env(safe-area-inset-top)) 16px max(24px, env(safe-area-inset-bottom));
    background: var(--desk); box-sizing: border-box; position: relative;
    /* overflowY auto, not hidden — keeps the Phantom Hitbox fix (native scroll
       instead of a clipped layout that desyncs touch targets after the keyboard). */
    overflow-x: hidden; overflow-y: auto; -webkit-overflow-scrolling: touch;
  }
  .au-root * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
  .au-root ::selection { background: var(--yellow); color: var(--ink); }

  /* margin:auto centers when it fits and SCROLLS when it doesn't — the same
     scroll-safe pattern PopoutItem uses (.po-scroll). justify-content:center
     would clip the wordmark off the top on short screens. */
  .au-fit { margin: auto; width: 100%; max-width: 400px;
    display: flex; flex-direction: column; align-items: center; gap: 28px; }

  /* ── HERO — the header wordmark, one size up, on the dark desk.
     Identical letterform recipe to .hd-display: white interior, 2px ink stroke,
     paint-order keeps the stroke behind the fill so Caveat isn't chewed. ── */
  .au-hero { display: flex; flex-direction: column; align-items: center;
    gap: 8px; text-align: center; }
  .au-wordmark { font-family: var(--hand); font-weight: 700; font-size: 54px;
    line-height: 1; color: #ffffff; -webkit-text-stroke: 2px var(--ink);
    paint-order: stroke fill; text-shadow: 2.5px 2.5px 0 var(--ink);
    letter-spacing: .02em; margin: 0; user-select: none; -webkit-user-select: none; }
  .au-tagline { font-family: var(--mono); font-size: 10px; font-weight: 700;
    letter-spacing: .24em; text-transform: uppercase; color: var(--ink3); margin: 0; }

  /* ── PANEL — the deck's sheet object: cream, chunky border, ONE big shadow.
     Byte-for-byte the .pc-sheet recipe (ProfileCard.jsx). ── */
  .au-panel { width: 100%; background: var(--paper);
    border: var(--bw) solid var(--ink); border-radius: 22px;
    box-shadow: 8px 8px 0 var(--ink); padding: 26px 22px; }

  .au-step { display: flex; flex-direction: column; gap: 16px; }

  /* step head — ProfileCard's marker-square + mono label language */
  .au-shead { display: flex; align-items: center; gap: 10px; }
  .au-mark { width: 11px; height: 11px; flex-shrink: 0;
    border: var(--bw) solid var(--ink); border-radius: 3px; background: var(--coral); }
  .au-mark.yellow { background: var(--yellow); }
  .au-steplabel { font-family: var(--mono); font-size: 11.5px; font-weight: 700;
    letter-spacing: .18em; text-transform: uppercase; color: var(--ink); }

  /* Headline — pc-name's marker highlight (ProfileCard.jsx uses the identical
     linear-gradient). Two details matter here:
       • clamp() — 28px Archivo Black made "Your campus email." overflow 320px
         viewports, and a wrapped block-level gradient smears the swatch across
         the whole block instead of sitting under the last line.
       • box-decoration-break: clone — so that IF it still wraps at an extreme
         width (or a user has a min 18px font size), each line box gets its own
         highlight instead of one stripe across both.
     width:fit-content is why the highlight hugs the text rather than the panel. */
  .au-headline { font-family: var(--heavy); font-weight: 400;
    font-size: clamp(20px, 6.2vw, 28px);
    line-height: 1.12; letter-spacing: -.01em; color: var(--ink); margin: 0;
    width: fit-content; max-width: 100%; padding: 0 6px 3px 0;
    background-image: linear-gradient(180deg, transparent 58%, var(--yellow) 58%);
    -webkit-box-decoration-break: clone; box-decoration-break: clone; }

  .au-sub { font-family: var(--mono); font-size: 10.5px; font-weight: 700;
    letter-spacing: .1em; text-transform: uppercase; color: var(--ink2);
    margin: 0; line-height: 1.8; word-break: break-word; }
  .au-sub b { color: var(--ink); }
  /* the sent-to email reads lowercase — uppercase emails look broken */
  .au-sub b.low { text-transform: lowercase; letter-spacing: .03em; }

  /* ── COLLEGE SEARCH ──
     Step 1. The search field is deliberately EMPTY on open — nothing is
     pre-filled and no institution is assumed. It filters on the full official
     name plus city/state, because a student often knows "Delhi" rather than the
     full name of the campus. */
  .au-search { width: 100%; height: 56px; padding: 0 16px; background: var(--card);
    border: var(--bw) solid var(--ink); border-radius: 14px;
    box-shadow: 4px 4px 0 var(--ink);
    font-family: var(--body); font-size: 16px; font-weight: 600; color: var(--ink);
    outline: none; -webkit-appearance: none; appearance: none;
    transition: transform .08s steps(2), box-shadow .08s steps(2); }
  .au-search::placeholder { color: var(--ink3); font-weight: 500; }
  .au-search:focus { transform: translate(-1px, -1px); box-shadow: 5px 5px 0 var(--ink); }

  /* Results list. Max-height + scroll rather than an unbounded column, so a
     long list can't push the CTA off-screen on a short viewport. */
  .au-results { display: flex; flex-direction: column; gap: 8px;
    max-height: 260px; overflow-y: auto; -webkit-overflow-scrolling: touch; }
  .au-result { display: flex; flex-direction: column; align-items: flex-start; gap: 3px;
    width: 100%; text-align: left; padding: 12px 14px;
    background: var(--card); border: var(--bw) solid var(--ink); border-radius: 12px;
    box-shadow: 3px 3px 0 var(--ink); cursor: pointer;
    transition: transform .08s steps(2), box-shadow .08s steps(2); }
  .au-result:active:not(:disabled) { transform: translate(3px, 3px); box-shadow: 0 0 0 var(--ink); }
  .au-result-name { font-family: var(--body); font-size: 15px; font-weight: 700;
    color: var(--ink); line-height: 1.3; }
  .au-result-meta { font-family: var(--mono); font-size: 10px; font-weight: 700;
    letter-spacing: .08em; text-transform: uppercase; color: var(--ink3); }
  .au-result.chosen { background: var(--yellow); }
  .au-result.chosen .au-result-meta { color: var(--ink2); }

  .au-empty { padding: 14px 4px; font-family: var(--mono); font-size: 11px; font-weight: 700;
    letter-spacing: .08em; text-transform: uppercase; color: var(--ink2); line-height: 1.7; }

  /* ── EMAIL ──
     The domain is PRE-FILLED from the college the student picked, and it is
     EDITABLE — not locked. Locking it would lock out anyone whose real address
     sits on a department subdomain (cse.iitb.ac.in). The server validates
     whatever is typed against the selected college's domains using exact-or-
     subdomain matching, so an editable field is safe here. */
  .au-form { display: flex; flex-direction: column; gap: 14px; }
  .au-suffix { font-family: var(--mono); font-size: 14px; font-weight: 700;
    color: var(--ink2); letter-spacing: .04em; flex-shrink: 0; }
  .au-input { width: 100%; height: 56px; padding: 0 16px; background: var(--card);
    border: var(--bw) solid var(--ink); border-radius: 14px;
    box-shadow: 4px 4px 0 var(--ink);
    font-family: var(--body); font-size: 16px; font-weight: 600; color: var(--ink);
    outline: none; -webkit-appearance: none; appearance: none;
    transition: transform .08s steps(2), box-shadow .08s steps(2); }
  .au-input::placeholder { color: var(--ink3); font-weight: 500; }
  .au-input:focus { transform: translate(-1px, -1px); box-shadow: 5px 5px 0 var(--ink); }
  .au-input:disabled { opacity: .55; }
  /* Safari autofill paints its own yellow over the card — repaint it with ours */
  .au-input:-webkit-autofill { -webkit-box-shadow: 0 0 0 60px var(--card) inset;
    -webkit-text-fill-color: var(--ink); }

  /* ── CTA — the one yellow moment. Slam like every tile in the deck. ── */
  .au-cta { height: 56px; border: var(--bw) solid var(--ink); border-radius: 14px;
    background: var(--yellow); color: var(--ink); cursor: pointer;
    font-family: var(--mono); font-size: 12.5px; font-weight: 700;
    letter-spacing: .18em; text-transform: uppercase;
    box-shadow: 5px 5px 0 var(--ink);
    transition: transform .08s steps(2), box-shadow .08s steps(2),
      background .08s steps(2), color .08s steps(2); }
  .au-cta:active:not(:disabled) { transform: translate(5px, 5px);
    box-shadow: 0 0 0 var(--ink); background: var(--ink); color: var(--yellow); }
  /* Disabled was paper-on-paper, which made the button vanish into the panel
     and left only its border. Card keeps a visible surface; ink3 keeps it
     clearly inactive without pretending to be a live CTA. */
  .au-cta:disabled { background: var(--card); color: var(--ink3);
    box-shadow: 3px 3px 0 var(--ink); cursor: default; }

  /* ── GHOST CHIP — quiet secondary (back to email) ── */
  .au-ghost { align-self: center; padding: 10px 16px;
    border: var(--bw) solid var(--ink); border-radius: 999px;
    background: var(--card); color: var(--ink2); cursor: pointer;
    font-family: var(--mono); font-size: 10px; font-weight: 700;
    letter-spacing: .14em; text-transform: uppercase;
    box-shadow: 3px 3px 0 var(--ink);
    transition: transform .08s steps(2), box-shadow .08s steps(2),
      background .08s steps(2), color .08s steps(2); }
  .au-ghost:active:not(:disabled) { transform: translate(3px, 3px);
    box-shadow: 0 0 0 var(--ink); background: var(--ink); color: var(--paper); }
  .au-ghost:disabled { opacity: .5; cursor: not-allowed; }

  /* ── OTP — flex-sized so six always fit, from 320px up ── */
  .au-otp { display: flex; gap: 9px; justify-content: center; }
  .au-box { flex: 1 1 0; min-width: 0; max-width: 54px; height: 60px;
    text-align: center; padding: 0; background: var(--card);
    border: var(--bw) solid var(--ink); border-radius: 12px;
    box-shadow: 4px 4px 0 var(--ink);
    font-family: var(--mono); font-size: 24px; font-weight: 700; color: var(--ink);
    caret-color: var(--coral); outline: none;
    transition: transform .08s steps(2), box-shadow .08s steps(2),
      background-color .15s ease, border-color .08s steps(2); }
  .au-box:focus { transform: translate(-1px, -1px); box-shadow: 5px 5px 0 var(--ink);
    background: #FFFDF6; }
  /* Dim only the "checking" disables. Verified boxes stay full-strength green —
     dimming them would wash out the success moment. */
  .au-box:disabled:not(.ok) { opacity: .6; }
  .au-box.err { border-color: var(--red); animation: au-shake .3s steps(2) 2; }
  .au-box.ok { background: var(--green); border-color: var(--ink);
    transform: translate(-1px, -3px); box-shadow: 3px 3px 0 var(--ink); }
  @keyframes au-shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-4px); }
    75% { transform: translateX(4px); }
  }

  /* ── ERROR — the hd-toast object, inlined: card + red spine ── */
  .au-banner { position: relative; background: var(--card);
    border: var(--bw) solid var(--ink); border-radius: 14px;
    box-shadow: 4px 4px 0 var(--ink); padding: 12px 14px 12px 20px; overflow: hidden; }
  .au-banner::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0;
    width: 5px; background: var(--red); }
  .au-banner p { margin: 0; font-family: var(--body); font-size: 13.5px;
    font-weight: 600; color: var(--ink); line-height: 1.5; }

  /* ── VERIFIED — green strip, the vitals-tile language ── */
  .au-strip { display: flex; align-items: center; justify-content: center; gap: 10px;
    padding: 16px; background: var(--green); color: var(--ink);
    border: var(--bw) solid var(--ink); border-radius: 14px;
    box-shadow: 4px 4px 0 var(--ink);
    font-family: var(--mono); font-size: 12px; font-weight: 700;
    letter-spacing: .12em; text-transform: uppercase; }

  /* universal focus token — yellow ring, same as every other component */
  .au-input:focus-visible, .au-box:focus-visible, .au-search:focus-visible,
  .au-result:focus-visible, .au-cta:focus-visible, .au-ghost:focus-visible {
    outline: 3px solid var(--yellow); outline-offset: 2px; }

  /* request-college form rows */
  .au-field { display: flex; flex-direction: column; gap: 7px; }
  .au-field label { font-family: var(--mono); font-size: 10px; font-weight: 700;
    letter-spacing: .12em; text-transform: uppercase; color: var(--ink2); }
  .au-field input { width: 100%; height: 50px; padding: 0 14px; background: var(--card);
    border: var(--bw) solid var(--ink); border-radius: 12px; box-shadow: 3px 3px 0 var(--ink);
    font-family: var(--body); font-size: 15px; font-weight: 600; color: var(--ink);
    outline: none; -webkit-appearance: none; appearance: none;
    transition: transform .08s steps(2), box-shadow .08s steps(2); }
  .au-field input:focus { transform: translate(-1px, -1px); box-shadow: 4px 4px 0 var(--ink); }
  .au-field input::-webkit-outer-spin-button,
  .au-field input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }

  /* ── RE-VERIFY (annual student check) ── */
  .au-revnote { font-family: var(--mono); font-size: 10px; font-weight: 700;
    letter-spacing: .1em; text-transform: uppercase; color: var(--ink2); line-height: 1.8; }

  /* Hover rules sit BEFORE the active rules inside this block, so pressing
     while hovering still slams — same ordering Header.jsx uses. */
  @media (hover: hover) and (pointer: fine) {
    .au-cta:hover:not(:disabled) { transform: translate(-1px, -1px);
      box-shadow: 6px 6px 0 var(--ink); }
    .au-cta:active:not(:disabled) { transform: translate(5px, 5px);
      box-shadow: 0 0 0 var(--ink); background: var(--ink); color: var(--yellow); }
    .au-ghost:hover:not(:disabled) { transform: translate(-1px, -1px);
      box-shadow: 4px 4px 0 var(--ink); }
    .au-ghost:active:not(:disabled) { transform: translate(3px, 3px);
      box-shadow: 0 0 0 var(--ink); background: var(--ink); color: var(--paper); }
  }
  @media (prefers-reduced-motion: reduce) {
    .au-input, .au-cta, .au-ghost, .au-box, .au-search, .au-result, .au-field input { transition: none; }
    .au-box.err { animation: none; }
  }
`;

const Auth = ({ onSuccess, reverifyOnly = false }) => {
  const reduceMotion = useReducedMotion();

  /* ── STEPS: college → email → otp ──
     The college is chosen BEFORE the email, and the server binds the two: the
     picked code is stored on the OTP record server-side, so a client can't ask
     for a code against one college and then verify as another.
     `reverifyOnly` skips all of that — a returning student's college is already
     on their account and cannot be changed by this screen. */
  const [step, setStep] = useState(reverifyOnly ? 'otp' : 'college');
  const [colleges, setColleges] = useState([]);
  const [collegeQuery, setCollegeQuery] = useState('');
  const [college, setCollege] = useState(null);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);
  const [requestDone, setRequestDone] = useState(false);
  const [graduatingYear, setGraduatingYear] = useState('');
  const inputRefs = useRef([]);
  const { login, user: authUser } = useAuth();

  /* ── ANNUAL RE-VERIFICATION ──
     The product claims "Students only", which is only true because we re-check
     each year. A student returning after the due date sees this instead of the
     college search. Nudge, not a wall: existing chats and profile stay put,
     and a failed check never deletes anything. */
  const reverifyNeeded = Boolean(authUser?.reverifyRequired);

  /* ── College request: "can't find my college" ──
     Deliberately does NOT grant access. It lands in the admin queue, the
     operator verifies the domain from the college's official site, adds it, and
     presses Notify. The student's college email is the only evidence they
     actually belong there. */
  const [requestForm, setRequestForm] = useState({
    collegeName: '', city: '', state: '', country: '', name: '', email: '',
  });

  const submitCollegeRequest = async (e) => {
    e.preventDefault();
    if (!requestForm.collegeName.trim() || !requestForm.email.trim()) return;
    setLoading(true);
    setError('');
    try {
      await api.post('/colleges/request', requestForm);
      setRequestDone(true);
      triggerHaptic('success');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not send your request.');
      triggerHaptic('heavy');
    } finally {
      setLoading(false);
    }
  };

  /* Fetch the college list once. Served from the DB, so a campus added in
     /admin appears without a client change. Failing this is non-fatal: the
     picker shows an empty state and the student can still request their
     college, which is exactly what they would do for a new campus anyway. */
  /* ── Fetch the college list ──
     Served from the DB, so a campus added in /admin appears without a client
     change.

     ⚠️ THIS USED TO BE A ONE-SHOT FETCH WITH A SILENT CATCH, and it produced the
     exact bug the user reported: open the app while the server was
     unreachable (a dead backend, a phone dropping wifi, a port conflict) and
     the request failed, `colleges` became `[]`, and NOTHING ever retried it. The
     picker then claimed "No college matches" about colleges that were listed
     and sitting right there in the database — and the only cure was a full
     browser refresh, which remounted the component and refetched.

     So the load state is tracked explicitly, the failure is shown instead of
     being disguised as "no results", and it retries itself when the connection
     comes back rather than waiting for a reload. */
  const [collegeLoadState, setCollegeLoadState] = useState('loading'); // loading | ready | error

  const loadColleges = useCallback(async () => {
    setCollegeLoadState((s) => (s === 'ready' ? s : 'loading'));
    try {
      const res = await api.get('/colleges');
      setColleges(res.colleges || []);
      setCollegeLoadState('ready');
    } catch {
      // Deliberately NOT cleared to [] on failure — leaving the previous value
      // in place means a transient blip doesn't wipe a list that already
      // loaded. The error state surfaces the problem either way.
      setCollegeLoadState('error');
    }
  }, []);

  useEffect(() => {
    loadColleges();

    // Retry when the OS reports connectivity is back, and when the tab is
    // refocused — both are moments a failed mount-time fetch is most likely
    // to succeed. Cheap: /colleges is a couple of documents, no caching layer.
    const onOnline = () => loadColleges();
    const onVisible = () => { if (document.visibilityState === 'visible') loadColleges(); };
    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [loadColleges]);

  /* 📍 COLLEGE SEARCH — matches how students actually type, not just how the
     name is formally written.
     *
     * ⚠️ THIS USED TO BE A PLAIN SUBSTRING TEST over name + city + state, and it
     failed on the single most common way anyone looks for their own college.
     * "Indian Institute of Technology Bombay" does not contain the letters "IIT"
     * anywhere, nor "IITB", nor "IIT Bombay" — so typing any of those returned
     * "No college matches" for a campus that was sitting right there, correctly
     * spelled, one row away. There is a "request your college" fallback directly
     * below, so the failure mode was actively harmful: a student searching for
     * IIT Bombay was walked into requesting a college that already existed.
     *
     * Nobody types a college's full legal name. They type the acronym, or the
     * acronym plus the city, or a fragment. All of those now match:
     *
     *   "IIT"      → acronym prefix of IITB
     *   "IITB"     → exact acronym
     *   "IIT Bombay" → every word matches something (acronym prefix, then word)
     *   "Bombay" / "Mumbai" / "Maharashtra" → as before
     *
     * A query matches when EVERY word in it is accounted for by SOME word in the
     * record. Requiring all words rather than any is what keeps "IIT" from
     * matching every college in the country once the list grows past one entry.
     *
     * Still no regex: accent- and punctuation-stripped substring tests only, so
     * there is nothing here for a search box to be injected into. */
  const collegeMatches = (college, rawQuery) => {
    const norm = (s) => String(s || '')
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')   // "Mumbai" vs "Mumbái"
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const words = norm(college.name).split(' ').filter(Boolean);
    /* Connectives carry no identifying information: "Indian INSTITUTE OF
       Technology Bombay" must still give IITB, not ITOFTB. */
    const ACRONYM_STOP = new Set(['of', 'and', 'the', 'for', 'at', 'a', 'an']);
    const acronym = words
      .filter((w) => !ACRONYM_STOP.has(w))
      .map((w) => w[0])
      .join('');

    /* Words a query can match against: the name, the city, the state, and the
       acronym as its own token. */
    const haystack = [
      ...words,
      norm(college.city),
      norm(college.state),
      norm(college.code),
      acronym,
    ].filter(Boolean);

    const terms = rawQuery
      .split(' ')
      .map(norm)
      .filter(Boolean);

    /* An empty query matches NOTHING here, rather than everything.
       `.every()` on an empty array is `true`, so without this a whitespace-only
       box would return the whole list. The caller already guards on `.trim()`,
       but a filter that silently inverts on empty input is a trap for whoever
       wires it up next. */
    if (terms.length === 0) return false;

    /* A query made ENTIRELY of connectives is not a search. "of" on its own
       sits inside "Indian Institute OF Technology", so it would otherwise match
       every college in the country — while "Indian Institute of Technology"
       still has to keep working, so stopwords can only be rejected once the
       whole query consists of them. */
    if (terms.every((t) => ACRONYM_STOP.has(t))) return false;

    return terms.every((q) => haystack.some((h) => h.includes(q) || q.includes(h)));
  };

  const filteredColleges = collegeQuery.trim()
    ? colleges.filter((c) => collegeMatches(c, collegeQuery))
    : colleges;

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

  /* Re-verify kickoff: request a fresh code as soon as this screen mounts, so
     the student lands on the code boxes with the email already sent rather than
     having to press anything first. */
  const reverifyKicked = useRef(false);
  useEffect(() => {
    if (!reverifyOnly || reverifyKicked.current) return;
    reverifyKicked.current = true;
    api.post('/auth/reverify')
      .catch((err) => {
        setError(err.response?.data?.message || 'Could not send your verification code.');
      });
  }, [reverifyOnly]);

  /* In re-verify mode the student has no college picker, so the endpoint can't
     read collegeCode from the client. Send the stored one off the user object
     for the display only — the server resolves the college from the session. */
  const reverifyCollege = authUser?.college || 'your college';

  // THE PHANTOM HITBOX FIX: Forces mobile browsers to recalculate touch targets when keyboard closes.
  // Deliberately NOT wired to the OTP boxes — they blur on every digit as focus
  // advances, so scrollTo(0,0) there yanked the panel around mid-entry. The email
  // field is the one that closes the keyboard, which is the case this fixes.
  const handleInputBlur = () => {
    window.scrollTo(0, 0);
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email.trim() || !college) return;
    setError('');
    setLoading(true);
    triggerHaptic('medium');

    // Force blur to close keyboard and fix hitboxes before making API call
    if (document.activeElement) {
      document.activeElement.blur();
    }

    try {
      // collegeCode travels with the request so the server can check the email
      // against THAT college's domains. It's re-checked at verify time from the
      // stored OTP record, not trusted from here.
      await api.post('/auth/send-otp', { email: email.trim(), collegeCode: college.code });
      setStep('otp');
    } catch (err) {
      const exactError = err.response?.data?.message || err.response?.data?.error || err.message;

      if (exactError?.includes('Network Error')) {
        setError('Something went wrong. Check your connection.');
      } else {
        setError(exactError || 'Failed to send the code.');
      }
      triggerHaptic('heavy');
    } finally {
      setLoading(false);
    }
  };

  /* Re-verify confirm is a separate endpoint from sign-in verify: it re-proves
   inbox control without touching identity, and on success just renews the date.
   It must never be fallable-through to the sign-in path — a student past due
   would otherwise create a second account instead. */
  const handleReverifyConfirm = useCallback(async (otpValue) => {
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/reverify/confirm', { otp: otpValue });
      setVerified(true);
      triggerHaptic('heavy');
      setTimeout(() => onSuccess(), 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'That code was not right. Try again.');
      setOtp(['', '', '', '', '', '']);
      if (inputRefs.current[0]) inputRefs.current[0].focus();
      triggerHaptic('heavy');
      setLoading(false);
    }
  }, [onSuccess]);

  const handleVerifyOtp = useCallback(async (otpValue) => {
    if (reverifyOnly) return handleReverifyConfirm(otpValue);
    setError('');
    setLoading(true);

    // Force blur to fix hitboxes
    if (document.activeElement) {
      document.activeElement.blur();
    }

    try {
      const data = await api.post('/auth/verify-otp', { email: email.trim(), otp: otpValue });
      // Token is set as httpOnly cookie by the server Set-Cookie header
      // Server confirmed login — user is NOT suspended. Clear any stale suspension flag.
      localStorage.removeItem('matchalize_suspended');
      login(data.user);

      /* Graduating year is captured AFTER the account exists, and only when the
         user typed one. Onboarding is the screen that collects profile content,
         so a best-effort save here (swallowing failure) is enough — the field is
         optional and never worth blocking a verified login over. */
      if (graduatingYear && data.user?._id && !data.user.graduatingYear) {
        api.put('/users/profile', { graduatingYear: Number(graduatingYear) })
          .then(() => {
            const stored = JSON.parse(localStorage.getItem('matchalize_user') || '{}');
            stored.graduatingYear = Number(graduatingYear);
            localStorage.setItem('matchalize_user', JSON.stringify(stored));
          })
          .catch(() => {});
      }

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
        if (susData?.reason) {
          // Clear loading before handing off — this used to return with loading
          // stuck true, which left the step dead if the screen ever fell back.
          setLoading(false);
          setSuspendedData(susData);
          return;
        }
      } catch {}

      if (exactError?.includes('Network Error')) {
        setError('Something went wrong. Check your connection.');
      } else {
        setError(exactError || 'Invalid code.');
      }

      setOtp(['', '', '', '', '', '']);
      if (inputRefs.current[0]) inputRefs.current[0].focus();
      triggerHaptic('heavy');
      setLoading(false);
    }
  }, [email, onSuccess, login, reverifyOnly, handleReverifyConfirm]);

  const handleOtpChange = (e, index) => {
    // Presentational only: a fresh keystroke clears the red state so the boxes
    // don't stay angry while retyping. Delete this line to restore exact old behavior.
    if (error) setError('');

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
    /* The "unlock" action rides in bottomSlot instead of position:fixed over
       the screen. Fixed meant it floated on top of content that centred itself
       with justify-content:center, so on short viewports the two overlapped. */
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

/* ── RE-VERIFY SCREEN ──
     Shown instead of the college/email flow for a returning student whose annual
     check is due. Copy says what happened and why it matters, without alarming
     them — a failed check never deletes anything, and their profile and chats
     are untouched. */
  if (reverifyOnly) {
    return (
      <div className="au-root">
        <style>{AUTH_CSS}</style>
        <div className="au-fit">
          <motion.header
            className="au-hero"
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="au-wordmark">matchalize</h1>
            <p className="au-tagline">Your Campus. Your Story.</p>
          </motion.header>

          <motion.div
            className="au-panel"
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="au-step">
              <div className="au-shead">
                <span className="au-mark yellow" aria-hidden="true" />
                <span className="au-steplabel">Quick check</span>
              </div>
              <h2 className="au-headline">Confirm you're still a student.</h2>
              <p className="au-sub">
                We check each year that your <b>{reverifyCollege}</b> email still works.
                That's how we keep Matchalize <b>students only</b>.
              </p>

              {errorBanner}

              <div className="au-otp" role="group" aria-label="6-digit verification code">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    className={`au-box stamp-box${error ? ' err' : ''}${verified ? ' ok' : ''}`}
                    type="text"
                    inputMode="numeric"
                    autoComplete={index === 0 ? 'one-time-code' : 'off'}
                    maxLength={6}
                    value={digit}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    onChange={(e) => handleOtpChange(e, index)}
                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                    disabled={verified || loading}
                    aria-label={`Digit ${index + 1}`}
                  />
                ))}
              </div>

              {verified ? (
                <motion.div
                  className="au-strip"
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  <CheckCircle2 size={16} strokeWidth={2.6} /> All set
                </motion.div>
              ) : (
                <button
                  className="au-ghost"
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    triggerHaptic('light');
                    setError('');
                    api.post('/auth/reverify').catch(() => setError('Could not resend. Try again shortly.'));
                  }}
                >
                  Resend code
                </button>
              )}

              <p className="au-revnote">
                Your profile and chats are safe. This just keeps the app students only.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  /* Step swap — AppShell's tab transition (x ±16 + fade, 0.2s).
      Banner wrapper animates height so the layout never jumps. */
  const swapProps = {
    initial: reduceMotion ? false : { opacity: 0, x: 16 },
    animate: { opacity: 1, x: 0 },
    exit: reduceMotion ? { opacity: 0 } : { opacity: 0, x: -16 },
    transition: { duration: 0.2, ease: [0.2, 0.8, 0.2, 1] },
  };

  const errorBanner = (
    <AnimatePresence>
      {error && (
        <motion.div
          key="au-banner"
          role="alert"
          initial={reduceMotion ? false : { opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          style={{ overflow: 'hidden' }}
        >
          <div className="au-banner"><p>{error}</p></div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="au-root">
      <style>{AUTH_CSS}</style>

      <div className="au-fit">
        {/* HERO — the header's wordmark treatment, one size up */}
        <motion.header
          className="au-hero"
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="au-wordmark">matchalize</h1>
          <p className="au-tagline">Your campus. Your story.</p>
        </motion.header>

        {/* PANEL — the deck's sheet object */}
        <motion.div
          className="au-panel"
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {step === 'college' ? (
              /* ── STEP 1 — YOUR COLLEGE ──
                 Full official name is what's stored, so a typed official name
                 matches. City/state are searched too, because plenty of students
                 know their city and not their campus name. Nothing is
                 pre-filled: no institution is assumed. */
              <motion.section key="college" className="au-step" {...swapProps}>
                <div className="au-shead">
                  <span className="au-mark" aria-hidden="true" />
                  <span className="au-steplabel">Step 1 — Your college</span>
                </div>
                <h2 className="au-headline">Enter your college.</h2>
                <p className="au-sub">Matchalize is <b>students only</b>.</p>

                {errorBanner}

                <div style={{ position: 'relative' }}>
                  <Search
                    size={17}
                    strokeWidth={2.6}
                    aria-hidden="true"
                    style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: T.ink3, pointerEvents: 'none' }}
                  />
                  <input
                    className="au-search"
                    type="text"
                    inputMode="text"
                    autoComplete="off"
                    autoCapitalize="words"
                    autoCorrect="off"
                    spellCheck="false"
                    placeholder="Indian Institute of Technology Bombay"
                    value={collegeQuery}
                    onChange={(e) => setCollegeQuery(e.target.value)}
                    aria-label="Search your college"
                    style={{ paddingLeft: 40 }}
                  />
                </div>

                {collegeLoadState === 'error' && colleges.length === 0 && (
                  /* Distinguished from "no matches" on purpose — the earlier
                     silent catch made a network failure look like a student
                     typing the wrong college, which sent them down the
                     "request this college" path for a campus already listed. */
                  <div className="au-results">
                    <p className="au-empty">
                      Couldn&rsquo;t load the college list. Check your connection.
                    </p>
                    <button className="au-cta" type="button" onClick={loadColleges}>
                      Try again
                    </button>
                  </div>
                )}

                {collegeQuery.trim() && collegeLoadState !== 'error' && (
                  <div className="au-results">
                    {filteredColleges.length === 0 ? (
                      <>
                        <p className="au-empty">
                          No college matches &ldquo;{collegeQuery.trim()}&rdquo;.
                        </p>
                        {requestDone ? (
                          <div className="au-strip">
                            <CheckCircle2 size={16} strokeWidth={2.6} /> Request received
                          </div>
                        ) : (
                          <button
                            className="au-cta"
                            type="button"
                            onClick={() => {
                              setRequestForm((f) => ({ ...f, collegeName: collegeQuery.trim(), email }));
                              triggerHaptic('light');
                              setStep('request');
                            }}
                          >
                            Request this college
                          </button>
                        )}
                      </>
                    ) : (
                      filteredColleges.map((c) => (
                        <button
                          key={c.code}
                          type="button"
                          className="au-result"
                          onClick={() => {
                            setCollege(c);
                            setCollegeQuery(c.name);
                            setError('');
                            triggerHaptic('light');
                            setTimeout(() => setStep('email'), 120);
                          }}
                        >
                          <span className="au-result-name">{c.name}</span>
                          {(c.city || c.state) && (
                            <span className="au-result-meta">
                              {[c.city, c.state].filter(Boolean).join(', ')}
                            </span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}

                {!collegeQuery.trim() && collegeLoadState === 'loading' && colleges.length === 0 && (
                  <p className="au-empty">Loading colleges&hellip;</p>
                )}

                {!collegeQuery.trim() && collegeLoadState === 'ready' && colleges.length > 0 && (
                  <p className="au-empty">
                    {colleges.length === 1
                      ? 'Start typing to find it.'
                      : `${colleges.length} campuses listed — start typing.`}
                  </p>
                )}

                {!collegeQuery.trim() && collegeLoadState === 'ready' && colleges.length === 0 && (
                  <p className="au-empty">
                    No campuses listed yet. Type yours below to request one.
                  </p>
                )}
              </motion.section>
            ) : step === 'request' ? (
              /* ── REQUEST A COLLEGE ──
                 Does not grant access. It reaches the operator, who verifies the
                 domain from the college's official site and adds it. The student's
                 college email is the only evidence they belong there — so it's
                 required, and a public address like gmail is rejected. */
              <motion.section key="request" className="au-step" {...swapProps}>
                <div className="au-shead">
                  <span className="au-mark yellow" aria-hidden="true" />
                  <span className="au-steplabel">Request a college</span>
                </div>
                <h2 className="au-headline">Tell us your campus.</h2>
                <p className="au-sub">
                  We add campuses ourselves so only real students get in. You&rsquo;ll hear back once yours is live.
                </p>

                {requestDone ? (
                  <div className="au-strip">
                    <CheckCircle2 size={16} strokeWidth={2.6} /> Request received
                  </div>
                ) : (
                  <form className="au-form" onSubmit={submitCollegeRequest}>
                    {errorBanner}
                    <div className="au-field">
                      <label htmlFor="rq-name">Full college name</label>
                      <input id="rq-name" value={requestForm.collegeName} onChange={(e) => setRequestForm((f) => ({ ...f, collegeName: e.target.value }))} placeholder="Indian Institute of Technology Delhi" required />
                    </div>
                    <div className="au-field">
                      <label htmlFor="rq-email">Your college email</label>
                      <input id="rq-email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" autoCorrect="off" spellCheck="false" value={requestForm.email} onChange={(e) => setRequestForm((f) => ({ ...f, email: e.target.value }))} placeholder="you@college.ac.in" required />
                    </div>
                    <div className="au-field">
                      <label htmlFor="rq-yourname">Your name (optional)</label>
                      <input id="rq-yourname" value={requestForm.name} onChange={(e) => setRequestForm((f) => ({ ...f, name: e.target.value }))} placeholder="Anaya" />
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <div className="au-field" style={{ flex: 1 }}>
                        <label htmlFor="rq-city">City</label>
                        <input id="rq-city" value={requestForm.city} onChange={(e) => setRequestForm((f) => ({ ...f, city: e.target.value }))} placeholder="Delhi" />
                      </div>
                      <div className="au-field" style={{ flex: 1 }}>
                        <label htmlFor="rq-state">State</label>
                        <input id="rq-state" value={requestForm.state} onChange={(e) => setRequestForm((f) => ({ ...f, state: e.target.value }))} placeholder="Delhi" />
                      </div>
                    </div>
                    <button className="au-cta" type="submit" disabled={loading || !requestForm.collegeName.trim() || !requestForm.email.trim()}>
                      {loading ? 'Sending…' : 'Send request'}
                    </button>
                    <button className="au-ghost" type="button" onClick={() => { setStep('college'); setError(''); }}>
                      Back
                    </button>
                  </form>
                )}
              </motion.section>
            ) : step === 'email' ? (
              /* ── STEP 2 — YOUR COLLEGE EMAIL ──
                 The domain is pre-filled from the picked college but stays
                 EDITABLE, because a student's real address is often on a
                 department subdomain (cse.iitb.ac.in) that isn't the one we
                 registered. The server validates whatever is typed against the
                 selected college using exact-or-subdomain matching, so an open
                 field is safe — and a locked one would lock people out. */
              <motion.section key="email" className="au-step" {...swapProps}>
                <div className="au-shead">
                  <span className="au-mark" aria-hidden="true" />
                  <span className="au-steplabel">Step 2 — Your email</span>
                </div>
                <h2 className="au-headline">Your college email.</h2>
                <p className="au-sub">
                  <b>{college?.name}</b> students use an <b>@{college?.domains?.[0]}</b> address.
                </p>

                <form className="au-form" onSubmit={handleSendOtp}>
                  {errorBanner}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <input
                      className="au-input"
                      type="text"
                      inputMode="email"
                      autoComplete="email"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck="false"
                      placeholder="you@iitb.ac.in"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={handleInputBlur}
                      disabled={loading}
                      aria-label="College email address"
                      required
                      style={{ flex: '1 1 200px' }}
                    />
                  </div>

                  <button className="au-cta" type="submit" disabled={loading || !email.trim()}>
                    {loading ? 'Sending…' : 'Send my code'}
                  </button>

                  <button className="au-ghost" type="button" onClick={() => { setStep('college'); setError(''); }}>
                    Change college
                  </button>
                </form>
              </motion.section>
            ) : (
              /* ── STEP 2 — THE CODE ── */
              <motion.section key="otp" className="au-step" {...swapProps}>
                <div className="au-shead">
                  <span className="au-mark yellow" aria-hidden="true" />
                  <span className="au-steplabel">Step 2 — The code</span>
                </div>
                <h2 className="au-headline">Enter the code.</h2>
                <p className="au-sub">Sent to <b className="low">{email.trim()}</b></p>

                {errorBanner}

                <div className="au-otp" role="group" aria-label="6-digit verification code">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      /* stamp-box: the QA harness (server/tests/qa/browser.mjs)
                         drives login through input.stamp-box — keep this class
                         or every login-dependent scene stalls 15s in startAuth. */
                      className={`au-box stamp-box${error ? ' err' : ''}${verified ? ' ok' : ''}`}
                      type="text"
                      inputMode="numeric"
                      autoComplete={index === 0 ? 'one-time-code' : 'off'}
                      maxLength={6}
                      value={digit}
                      ref={(el) => { inputRefs.current[index] = el; }}
                      onChange={(e) => handleOtpChange(e, index)}
                      onKeyDown={(e) => handleOtpKeyDown(e, index)}
                      disabled={verified || loading}
                      aria-label={`Digit ${index + 1}`}
                    />
                  ))}
                </div>

                {verified ? (
                  /* The 1.2s window before onSuccess() — the boxes above turn
                     green and this strip stamps in. Watching your own code get
                     accepted beats a panel swap. */
                  <motion.div
                    className="au-strip"
                    initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <CheckCircle2 size={16} strokeWidth={2.6} /> Access granted
                  </motion.div>
                ) : (
                  <button
                    className="au-ghost"
                    type="button"
                    disabled={loading}
                    onClick={() => { triggerHaptic('light'); setStep('email'); setError(''); setOtp(['', '', '', '', '', '']); }}
                  >
                    Wrong email? Go back
                  </button>
                )}

                {/* Graduating year: NOT proof of enrolment (anyone can type a
                    future year) but it's the honest signal that drives the
                    annual re-check date, and "Graduating 2027" is a real dating
                    signal. Optional so a student who genuinely doesn't know it
                    isn't blocked at the door. */}
                <div className="au-field" style={{ marginTop: 4 }}>
                  <label htmlFor="grad-year">Graduating year (optional)</label>
                  <input
                    id="grad-year"
                    type="number"
                    inputMode="numeric"
                    min={new Date().getFullYear()}
                    max={new Date().getFullYear() + 10}
                    value={graduatingYear}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setGraduatingYear(v);
                    }}
                    onBlur={handleInputBlur}
                    placeholder={String(new Date().getFullYear() + 3)}
                    disabled={loading}
                  />
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
```

