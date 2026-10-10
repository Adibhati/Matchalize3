# Chunk 14 — Client Pages

> Matchalize · `client-pages` · files 14 of 25 chunks · 1 file(s) · 41 KB · ~12,026 tokens
> Generated 2026-10-09 14:03.
> Paste-safe: within the 100 KB / ~29,257 token target.
>
> Contains:
> - `./client/src/pages/Onboarding.jsx`

---
### ./client/src/pages/Onboarding.jsx

```
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Camera, LogOut, ChevronRight, ChevronLeft, Check, MoreVertical, X } from 'lucide-react';
import { api } from '../utils/api';
import { toast } from '../utils/toast';
import { triggerHaptic } from '../utils/haptics';
import { readLocationOnce, LOCATION_UNAVAILABLE } from '../utils/geolocation';
import { useAuth } from '../utils/AuthContext';
import { useAppConfig } from '../utils/AppConfigContext';

/**
 * 📝 ONBOARDING — seven screens, one question each, publish at 45.
 *
 * Design: neobrutalism — ink borders, hard offset shadows on BUTTONS ONLY,
 * straight edges (no tilt anywhere), directional slide transitions.
 * Photo step shows a local preview instantly and compresses before upload.
 *
 * ⚠️ THE 18-40 GATE IS NOT NEGOTIABLE. /users/setup re-derives age
 * server-side from `dob`; the client computes it only for the preview.
 */

const T = {
  bg: '#F4EFE3',
  card: '#FFFFFF',
  ink: '#191919',
  ink2: '#5F5B52',
  ink3: '#A39E92',
  yellow: '#FFD43D',
  yellowDeep: '#FFC91F',
  green: '#5BD98A',
  orange: '#FF6B4A',
  red: '#E5484D',
  fontHeavy: "'Archivo Black', 'Arial Black', sans-serif",
  fontBody: "'Inter', -apple-system, 'Segoe UI', sans-serif",
  fontMono: "'Space Mono', 'Courier New', monospace",
};

const STEPS = [
  {
    key: 'name', title: 'What shall we call you?',
    hint: 'First names work best.',
  },
  {
    key: 'dob', title: "When's your birthday?",
    hint: 'You must be 18 or older to join.',
    foot: 'Others only ever see your age.',
  },
  {
    key: 'photo', title: 'Add a photo',
    hint: "It's the first thing people see. One is enough for now.",
  },
  { key: 'gender', title: 'How do you identify?' },
  {
    key: 'interestedIn', title: 'Who do you want to meet?',
    hint: 'Pick as many as apply.',
  },
  { key: 'year', title: 'Undergrad or postgrad?' },
  {
    key: 'intent', title: 'What are you here for?',
    hint: 'This shapes who appears in your deck.',
  },
  {
    /* 📍 Deliberately LAST and optional. It only ever adds a ranking signal; the
       deck works without it, and declining is not recorded as a refusal — the
       field is simply absent from the setup payload and the server leaves
       location off. */
    key: 'location', title: 'Show people near you?',
    hint: 'Optional. You can change this anytime in Settings.',
    foot: 'Nothing is tracked in the background. We check once when you open the app.',
    optional: true,
  },
];

const FOOT_DEFAULT = 'You can change this anytime in Settings.';

/* ⚠️ NO INTENT CAP. There was `MAX_INTENTS = 2` here and it is gone, matching
   the removal in server/config/appData.js. Interests still cap at 10, but that
   limit lives in the shared app config rather than here, because nothing needs
   to hardcode it to get this right. */

const CSS = `
  /* Root is the scroller (html/body are locked in index.css): centered when
     content fits, scrollable when it doesn't. Dot-grid on cream = the floor
     everything sits on. */
  .ob-root { height: 100vh; height: 100dvh; width: 100%; display: flex;
    flex-direction: column; overflow-y: auto; overflow-x: hidden;
    overscroll-behavior: contain; -webkit-overflow-scrolling: touch;
    background-color: ${T.bg};
    background-image: radial-gradient(rgba(25,25,25,.10) 1.2px, transparent 1.3px);
    background-size: 22px 22px;
    box-sizing: border-box; position: relative;
    --card: ${T.card}; --ink: ${T.ink}; --ink2: ${T.ink2}; --ink3: ${T.ink3};
    --yellow: ${T.yellow}; --yellowDeep: ${T.yellowDeep}; --green: ${T.green};
    --orange: ${T.orange}; --red: ${T.red};
    --heavy: ${T.fontHeavy}; --body: ${T.fontBody}; --mono: ${T.fontMono}; }
  .ob-root * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
  .ob-root ::selection { background: ${T.yellow}; color: ${T.ink}; }

  /* ── fixed header — identical on every step: back left, ⋮ right ── */
  .ob-head { position: sticky; top: 0; z-index: 50; flex-shrink: 0;
    display: flex; align-items: center; justify-content: space-between;
    padding: max(12px, env(safe-area-inset-top)) 14px 12px;
    background-color: ${T.bg};
    background-image: radial-gradient(rgba(25,25,25,.10) 1.2px, transparent 1.3px);
    background-size: 22px 22px;
    border-bottom: 2.5px solid ${T.ink}; }
  .ob-headspacer { width: 46px; flex-shrink: 0; }

  .ob-hbtn { width: 46px; height: 46px; flex-shrink: 0; display: flex; align-items: center;
    justify-content: center; cursor: pointer; border: 2.5px solid var(--ink);
    border-radius: 999px; background: var(--card); color: var(--ink);
    box-shadow: 3px 3px 0 var(--ink);
    transition: transform .1s ease, box-shadow .1s ease, background .15s ease; }
  .ob-hbtn:active { transform: translate(3px, 3px); box-shadow: 0 0 0 var(--ink);
    background: var(--yellow); }

  /* logout lives behind the ⋮ — invisible until asked for */
  .ob-scrim { position: fixed; inset: 0; z-index: 90; cursor: default; }
  .ob-menu { position: absolute; top: calc(100% + 8px); right: 0; z-index: 100;
    min-width: 190px; padding: 6px; background: var(--card);
    border: 2.5px solid var(--ink); border-radius: 14px;
    box-shadow: 5px 5px 0 var(--ink); overflow: hidden; }
  .ob-menuitem { display: flex; align-items: center; gap: 9px; width: 100%;
    padding: 13px; background: none; border: none; cursor: pointer; text-align: left;
    border-radius: 9px; font-family: var(--body); font-size: 14.5px; font-weight: 700;
    color: var(--red); transition: background .12s ease; }
  .ob-menuitem:active { background: rgba(229,72,77,.12); }

  /* ── body ── */
  .ob-fit { margin: auto; width: 100%; max-width: 440px;
    padding: 14px 22px calc(32px + env(safe-area-inset-bottom));
    display: flex; flex-direction: column; gap: 20px; }

  .ob-title { font-family: var(--heavy); font-size: clamp(30px, 9vw, 41px); font-weight: 400;
    line-height: 1.1; letter-spacing: -.01em; color: var(--ink); margin: 0; width: fit-content;
    max-width: 100%; padding: 2px 8px 5px 0;
    background-image: linear-gradient(180deg, transparent 60%, var(--yellow) 60%);
    -webkit-box-decoration-break: clone; box-decoration-break: clone; }

  .ob-hint { font-family: var(--body); font-size: 15px; font-weight: 500;
    color: var(--ink2); margin: -8px 0 0; line-height: 1.55; }

  .ob-field { display: flex; flex-direction: column; gap: 16px; }

  .ob-input { width: 100%; height: 62px; padding: 0 18px; background: var(--card);
    border: 2.5px solid var(--ink); border-radius: 16px;
    font-family: var(--body); font-size: 18px; font-weight: 600; color: var(--ink);
    outline: none; -webkit-appearance: none; appearance: none;
    box-shadow: 4px 4px 0 var(--ink);
    transition: transform .12s ease, box-shadow .12s ease, background .15s ease; }
  .ob-input::placeholder { color: var(--ink3); font-weight: 500; }
  .ob-input:focus { background: #FFFBEA; transform: translate(-2px, -2px);
    box-shadow: 6px 6px 0 var(--ink); }
  .ob-dob { font-family: var(--mono); font-size: 20px; font-weight: 700; }
  .ob-slash { font-family: var(--mono); font-size: 22px; font-weight: 700;
    color: var(--ink); flex-shrink: 0; }

  /* age sticker — green when in band, red-shadowed when not */
  .ob-age { align-self: flex-start; font-family: var(--mono); font-size: 14px; font-weight: 700;
    padding: 9px 16px; background: var(--card); color: var(--red);
    border: 2.5px solid var(--ink); border-radius: 999px; box-shadow: 3px 3px 0 var(--red); }
  .ob-age.ok { background: var(--green); color: var(--ink); box-shadow: 3px 3px 0 var(--ink); }

  .ob-chips { display: flex; flex-wrap: wrap; gap: 12px; }
  /* 📍 Location step. Reads as an explanation plus one decision, not a form
     field — the copy is what earns the permission, so it gets real space. */
  .ob-location { display: flex; flex-direction: column; gap: 16px;
    align-items: flex-start; max-width: 460px; }
  .ob-location-copy { margin: 0; font-family: ${T.fontBody}; font-size: 15px;
    line-height: 1.55; color: ${T.ink2}; }
  .ob-location-ok { margin: 0; display: flex; align-items: center; gap: 8px;
    font-family: ${T.fontBody}; font-size: 15px; font-weight: 600; color: ${T.ink}; }
  .ob-loc-btn { appearance: none; border: 0; cursor: pointer; display: block;
    width: 100%; font-family: ${T.fontHeavy}; font-size: 15px; letter-spacing: .01em;
    padding: 13px 22px; border-radius: 999px;
    background: ${T.yellow}; color: ${T.ink};
    box-shadow: 0 2px 0 ${T.yellowDeep}; }
  .ob-loc-btn:disabled { opacity: .55; cursor: default; }
  /* The fallback is a real choice, so it gets the same target size and a
     visible border — it must not read as a footnote under the primary button,
     or the "required" step becomes a trap with a quiet exit. */
  .ob-loc-alt { appearance: none; cursor: pointer; display: block; width: 100%;
    font-family: ${T.fontBody}; font-size: 14px; font-weight: 600;
    padding: 12px 22px; border-radius: 999px;
    background: transparent; color: ${T.ink2};
    border: 2px solid ${T.ink3}; }
  .ob-loc-alt:disabled { opacity: .55; cursor: default; }
  .ob-loc-alt:active { background: ${T.paper2}; }
  .ob-loc-note { margin: 0; font-family: ${T.fontMono}; font-size: 12px;
    color: ${T.ink3}; }
  .ob-chip { padding: 14px 22px; min-height: 54px; border-radius: 999px;
    border: 2.5px solid var(--ink); background: var(--card); color: var(--ink); cursor: pointer;
    font-family: var(--body); font-size: 16px; font-weight: 700;
    display: inline-flex; align-items: center; gap: 8px;
    box-shadow: 3px 3px 0 var(--ink);
    transition: transform .1s ease, box-shadow .1s ease, background .15s ease; }
  .ob-chip:active:not(:disabled) { transform: translate(3px, 3px); box-shadow: 0 0 0 var(--ink); }
  .ob-chip.on { background: var(--yellow); }
  .ob-chip:disabled { opacity: .4; cursor: not-allowed; }

  /* ── photo area — NO shadow, NO press effect. The zone itself stays quiet;
     only the real buttons on top of it (cross / add) react to clicks. ── */
  .ob-photo { width: 100%; aspect-ratio: 4 / 5; max-height: 46vh; max-height: 46dvh;
    border-radius: 22px; border: 2.5px dashed var(--ink3); background: var(--card);
    overflow: hidden; position: relative; display: flex; align-items: center;
    justify-content: center; padding: 0; cursor: pointer; }
  .ob-photo.filled { border-style: solid; border-color: var(--ink); cursor: default; }
  .ob-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .ob-photoempty { display: flex; flex-direction: column; align-items: center; gap: 16px;
    color: var(--ink2); font-family: var(--body); font-size: 14.5px; font-weight: 600;
    padding: 20px; text-align: center; }
  .ob-cam { width: 66px; height: 66px; display: flex; align-items: center; justify-content: center;
    background: var(--orange); border: 2.5px solid var(--ink); border-radius: 999px;
    box-shadow: 3px 3px 0 var(--ink); color: var(--ink); }

  /* invisible full-area hit zone so tap-to-change stays a real <button> */
  .ob-photohit { position: absolute; inset: 0; z-index: 1; background: transparent;
    border: none; padding: 0; margin: 0; cursor: pointer; -webkit-appearance: none; appearance: none; }

  /* the cross — a real button, so it keeps the press effect */
  .ob-photox { position: absolute; top: 12px; right: 12px; z-index: 3;
    width: 40px; height: 40px; border-radius: 999px; background: var(--card);
    border: 2.5px solid var(--ink); box-shadow: 3px 3px 0 var(--ink);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: var(--ink);
    transition: transform .1s ease, box-shadow .1s ease, background .15s ease; }
  .ob-photox:active { transform: translate(3px, 3px); box-shadow: 0 0 0 var(--ink);
    background: var(--red); color: #fff; }

  /* uploading pill — sits over the local preview while the compressed
     file is in flight */
  .ob-uploading { position: absolute; left: 50%; bottom: 16px; transform: translateX(-50%);
    z-index: 3; display: inline-flex; align-items: center; gap: 8px; white-space: nowrap;
    padding: 9px 16px; background: var(--yellow); border: 2.5px solid var(--ink);
    border-radius: 999px; box-shadow: 3px 3px 0 var(--ink);
    font-family: var(--body); font-size: 13px; font-weight: 800; color: var(--ink); }
  .ob-spin { width: 12px; height: 12px; border-radius: 999px;
    border: 2.5px solid var(--ink); border-top-color: transparent;
    animation: obspin .7s linear infinite; }
  @keyframes obspin { to { transform: rotate(360deg); } }

  .ob-cta { width: 100%; height: 64px; border: 2.5px solid var(--ink); border-radius: 999px;
    background: var(--yellow); color: var(--ink); cursor: pointer; font-family: var(--body);
    font-size: 17px; font-weight: 800; letter-spacing: .01em; flex-shrink: 0;
    display: inline-flex; align-items: center; justify-content: center; gap: 10px;
    box-shadow: 5px 5px 0 var(--ink);
    transition: transform .1s ease, box-shadow .1s ease, opacity .15s ease, background .15s ease; }
  .ob-cta:active:not(:disabled) { transform: translate(5px, 5px); box-shadow: 0 0 0 var(--ink); }
  .ob-cta:disabled { opacity: .45; cursor: default; }
  .ob-cta svg { transition: transform .15s ease; }

  .ob-foot { font-family: var(--mono); font-size: 12px; font-weight: 400;
    color: var(--ink3); text-align: center; margin: 0; line-height: 1.6; }

  .ob-banner { background: var(--card); border-radius: 14px; padding: 13px 15px;
    border: 2.5px solid var(--ink); box-shadow: 4px 4px 0 var(--red); }
  .ob-banner p { margin: 0; font-family: var(--body); font-size: 14px;
    font-weight: 600; color: var(--ink); line-height: 1.5; }

  .ob-root input, .ob-root textarea, .ob-root select { -webkit-user-select: auto; user-select: auto; }
  .ob-root img { pointer-events: none; }

  .ob-input:focus-visible, .ob-chip:focus-visible, .ob-cta:focus-visible,
  .ob-photo:focus-visible, .ob-photohit:focus-visible, .ob-photox:focus-visible,
  .ob-hbtn:focus-visible, .ob-menuitem:focus-visible {
    outline: 3px solid var(--ink); outline-offset: 3px; }

  @media (hover: hover) and (pointer: fine) {
    .ob-hbtn:hover { background: var(--yellow); }
    .ob-menuitem:hover { background: rgba(229,72,77,.1); }
    .ob-chip:hover:not(:disabled):not(.on) { background: #FFFBEA; }
    .ob-chip.on:hover { background: var(--yellowDeep); }
    .ob-cta:hover:not(:disabled) { background: var(--yellowDeep); }
    .ob-cta:hover:not(:disabled) svg { transform: translateX(4px); }
    .ob-photo:hover:not(.filled) { border-color: var(--ink); }
    .ob-photohit:hover { background: rgba(25,25,25,.04); }
    .ob-photox:hover { background: var(--red); color: #fff; }
  }
  @media (prefers-reduced-motion: reduce) {
    .ob-root * { transition: none !important; animation: none !important; }
  }
`;

/* ── screen transition — straight directional slide, springy landing,
   staggered kids. Forward slides left, back slides right. No rotation. ── */
const useScreenVariants = (reduceMotion) => ({
  screen: {
    enter: (d) => (reduceMotion
      ? { opacity: 1, x: 0 }
      : { opacity: 0, x: d * 90 }),
    center: {
      opacity: 1, x: 0,
      transition: { type: 'spring', stiffness: 330, damping: 32, staggerChildren: 0.06, delayChildren: 0.03 },
    },
    exit: (d) => (reduceMotion
      ? { opacity: 0, transition: { duration: 0.12 } }
      : { opacity: 0, x: d * -80, transition: { duration: 0.18, ease: 'easeIn' } }),
  },
  item: {
    enter: () => (reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }),
    center: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 420, damping: 30 } },
  },
});

/* ── client-side photo compression — this is what makes uploads fast.
     Downscales to max 1280px on the long edge and re-encodes as JPEG q85,
     which cuts a typical phone photo (~3-6MB) down to ~200-400KB.
     Skips tiny files, never upscales, falls back to the original on any
     decode failure (e.g. HEIC the browser can't paint). ── */
const MAX_DIM = 1280;
const JPEG_QUALITY = 0.85;
const SKIP_BELOW = 400 * 1024; // already small — upload as-is

const compressImage = (file) =>
  new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) { reject(new Error('not an image')); return; }
    if (file.size < SKIP_BELOW) { resolve(file); return; }
    const src = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(src);
      try {
        const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        canvas.toBlob((blob) => {
          if (!blob) { resolve(file); return; }
          // if compression somehow didn't help, ship the original
          resolve(blob.size < file.size ? new File([blob], 'photo.jpg', { type: 'image/jpeg' }) : file);
        }, 'image/jpeg', JPEG_QUALITY);
      } catch { resolve(file); }
    };
    img.onerror = () => { URL.revokeObjectURL(src); resolve(file); };
    img.src = src;
  });

const Onboarding = ({ onComplete }) => {
  const reduceMotion = useReducedMotion();
  const config = useAppConfig();
  const { logout, login } = useAuth();
  const fileRef = useRef(null);
  const rootRef = useRef(null);
  const previewRef = useRef(null); // live blob URL while a photo is in flight
  const V = useScreenVariants(reduceMotion);

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [preview, setPreview] = useState(null);

  const [formData, setFormData] = useState({
    name: '', dob: '', gender: '', year: '', intent: [], interestedIn: [],
    photos: [], prompts: [], interests: [], currentLatLng: undefined,
  });

  /* ── resume an interrupted run ──
     Retries on reconnect; recovery only fills fields that are still empty,
     so it can never clobber an answer the student gave after a failed load. */
  const resumeDraft = useCallback(async () => {
    try {
      const res = await api.get('/users/onboarding/resume');
      if (!res?.data || !Object.keys(res.data).length) return;
      const saved = res.data;
      setFormData((prev) => ({
        ...prev,
        ...saved,
        name: prev.name || saved.name || '',
        gender: prev.gender || saved.gender || '',
        year: prev.year || saved.year || '',
        dob: prev.dob || saved.dob || '',
        photos: prev.photos?.length ? prev.photos : (Array.isArray(saved.photos) ? saved.photos : prev.photos),
        intent: prev.intent?.length ? prev.intent : (Array.isArray(saved.intent) ? saved.intent : prev.intent),
        interestedIn: prev.interestedIn?.length ? prev.interestedIn : (Array.isArray(saved.interestedIn) ? saved.interestedIn : prev.interestedIn),
        interests: prev.interests?.length ? prev.interests : (Array.isArray(saved.interests) ? saved.interests : prev.interests),
        prompts: prev.prompts?.length ? prev.prompts : (Array.isArray(saved.prompts) ? saved.prompts : prev.prompts),
      }));
      const idx = Number(saved.__step);
      if (Number.isFinite(idx) && idx >= 0 && idx < STEPS.length) setStep(idx);
    } catch {
      // Draft unavailable — the next online/visible event retries.
    }
  }, []);

  useEffect(() => {
    resumeDraft();
    const onOnline = () => resumeDraft();
    const onVisible = () => { if (document.visibilityState === 'visible') resumeDraft(); };
    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [resumeDraft]);

  /* Autosave, debounced; step included so resume knows where the user was. */
  useEffect(() => {
    const { name, gender, dob } = formData;
    if (!name && !gender && !dob) return undefined;
    const t = setTimeout(() => {
      api.put('/users/onboarding/save', { step: step + 1, data: { ...formData, __step: step } })
        .catch(() => {});
    }, 800);
    return () => clearTimeout(t);
  }, [formData, step]);

  /* Escape closes the overflow menu */
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const update = (patch) => setFormData((f) => ({ ...f, ...patch }));

  const toggleIn = (field, item, max = null) => {
    setFormData((f) => {
      const arr = f[field] || [];
      const on = arr.includes(item);
      if (on) return { ...f, [field]: arr.filter((i) => i !== item) };
      if (max && arr.length >= max) { triggerHaptic('heavy'); return f; }
      // 'Everyone' is mutually exclusive with specific choices.
      const next = field === 'interestedIn'
        ? ['Everyone']
        : (item === 'Everyone' ? [] : arr.filter((i) => i !== 'Everyone'));
      return { ...f, [field]: [...next, item] };
    });
    triggerHaptic('light');
  };

  /* ── DOB — three auto-advancing boxes. Age is COMPUTED, never typed, and
     only for the on-screen preview. ── */
  const dobParts = (formData.dob || '--').split('-');
  const dobY = dobParts[0] === '--' ? '' : dobParts[0];
  const dobM = dobParts[1] === '--' ? '' : dobParts[1];
  const dobD = dobParts[2] === '--' ? '' : dobParts[2];
  const dayRef = useRef(null); const monRef = useRef(null); const yrRef = useRef(null);

  const age = (() => {
    if (dobY.length !== 4 || dobM.length !== 2 || dobD.length !== 2) return null;
    const today = new Date();
    const birth = new Date(`${dobY}-${dobM}-${dobD}`);
    if (Number.isNaN(birth.getTime())) return null;
    let a = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    return (m < 0 || (m === 0 && today.getDate() < birth.getDate())) ? a - 1 : a;
  })();

  const setDob = (part, raw) => {
    const num = raw.replace(/\D/g, '');
    let d = dobD; let m = dobM; let y = dobY;
    if (part === 'd') {
      d = num.slice(0, 2);
      if (d.length === 2) { if (+d > 31) d = '31'; if (+d === 0) d = '01'; monRef.current?.focus(); }
    }
    if (part === 'm') {
      m = num.slice(0, 2);
      if (m.length === 2) { if (+m > 12) m = '12'; if (+m === 0) m = '01'; yrRef.current?.focus(); }
    }
    if (part === 'y') y = num.slice(0, 4);
    update({ dob: `${y}-${m}-${d}` });
  };

  /* ── photo ── */
  const clearPreview = () => {
    if (previewRef.current) { URL.revokeObjectURL(previewRef.current); previewRef.current = null; }
    setPreview(null);
  };

  const pickPhoto = () => { triggerHaptic('light'); fileRef.current?.click(); };

  const removePhoto = () => {
    triggerHaptic('light');
    clearPreview();
    update({ photos: [] });
  };

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setUploading(true);
    setError('');
    triggerHaptic('medium');

    // Show the chosen photo INSTANTLY from a local blob while it uploads —
    // no waiting on the network to see your picture.
    const localUrl = URL.createObjectURL(f);
    previewRef.current = localUrl;
    setPreview(localUrl);

    try {
      const toUpload = await compressImage(f); // smaller payload = much faster upload
      const { url } = await api.upload(toUpload);
      update({ photos: [url] });   // slot 0 is the hero; slots 1–3 live in Profile
      triggerHaptic('success');
    } catch {
      toast.error('Upload failed. Check your connection, or try a smaller image.');
      triggerHaptic('heavy');
    } finally {
      setUploading(false);
      clearPreview(); // real URL (or nothing, on failure) takes over
    }
  };

  /* ── 📍 location (required, one-shot, with a real fallback) ──
     These must be declared BEFORE the `done` object because `done`
     references `locationReading` and `locDeclined`. */
  const [locBusy, setLocBusy] = useState(false);
  const [locationReading, setLocationReading] = useState(false);
  const [locError, setLocError] = useState('');
  /* An EXPLICIT decline, distinct from never having tried. Without this flag a
     refusal and an untouched step look identical, and the user could not tell
     whether "required" meant "required" or "skippable". */
  const [locDeclined, setLocDeclined] = useState(false);

  /* ── per-screen completion ── */
  const done = {
    name: !!formData.name.trim(),
    dob: age !== null && age >= 18 && age <= 40,
    photo: !!formData.photos[0],
    gender: !!formData.gender,
    interestedIn: formData.interestedIn.length > 0,
    year: !!formData.year,
    intent: formData.intent.length > 0,
    /* 📍 REQUIRED, BUT AS AN EXPLICIT CHOICE — not a permission to skip past.

       The step blocks until the user either shares a reading or deliberately
       picks the campus fallback. Both paths out of this screen work and neither
       is a dead end, so this is not Next held hostage for a permission they may
       never grant: declining is a real choice with a stated consequence, which
       is why the fallback button says what it costs instead of hiding behind
       "Not now". */
    location: locationReading || locDeclined,
  };
  const stepDone = (i) => done[STEPS[i].key];
  const allDone = STEPS.every((st) => done[st.key]);

  const grantLocation = useCallback(async () => {
    if (locBusy) return;
    setLocBusy(true);
    setLocError('');
    const res = await readLocationOnce();
    setLocBusy(false);
    if (res.ok) {
      /* Held in memory only. It goes out once, in the setup payload, and the
         server rounds it before storing. */
      setFormData((f) => ({ ...f, currentLatLng: res.latLng }));
      setLocationReading(true);
      return;
    }
    setLocError(
      res.reason === LOCATION_UNAVAILABLE.DENIED
        ? 'Location permission was declined.'
        : res.reason === LOCATION_UNAVAILABLE.INSECURE
          ? 'Location needs a secure (https) connection.'
          : "We couldn't get a location reading.",
    );
  }, [locBusy]);

  /* ── publish — posts exactly the publish band; the server scores it ── */
  const publish = async () => {
    if (!allDone || uploading || publishing) { triggerHaptic('heavy'); return; }
    setPublishing(true);
    setError('');
    triggerHaptic('heavy');
    try {
      const res = await api.post('/users/setup', {
        ...formData,
        age,
        prompts: (formData.prompts || []).slice(0, 3),
      });
      await api.delete('/users/onboarding/clear').catch(() => {});

      const stored = JSON.parse(localStorage.getItem('matchalize_user') || '{}');
      const updated = res?.user || res?.data?.user || res || {
        ...stored, isSetup: true, isOnboarded: true, profileCompleted: true, onboardingCompleted: true,
      };
      login(updated);
      onComplete();
    } catch (err) {
      if (!err?.toasted) toast.error('Could not publish your profile. Check your connection and try again.');
      setPublishing(false);
    }
  };

  const next = () => {
    if (!stepDone(step)) { triggerHaptic('heavy'); return; }
    triggerHaptic('light');
    setError('');
    setDir(1);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    rootRef.current?.scrollTo({ top: 0 });
  };
  const back = () => {
    triggerHaptic('light');
    setError('');
    setDir(-1);
    setStep((s) => Math.max(0, s - 1));
    rootRef.current?.scrollTo({ top: 0 });
  };

  const s = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const genders = config?.genders || ['Male', 'Female', 'Non-binary', 'Other'];
  const showOptions = [...genders, 'Everyone'];
  const intentOptions = config?.intents || [];

  const banner = (
    <AnimatePresence>
      {error && (
        <motion.div key="b" role="alert"
          initial={reduceMotion ? false : { opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
          <div className="ob-banner"><p>{error}</p></div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="ob-root" ref={rootRef}>
      <style>{CSS}</style>

      {/* ── fixed header: back left, ⋮ right. Same on every step. ── */}
      <header className="ob-head">
        {step > 0 ? (
          <button type="button" className="ob-hbtn" aria-label="Previous question" onClick={back}>
            <ChevronLeft size={22} strokeWidth={2.8} />
          </button>
        ) : <span className="ob-headspacer" />}

        <div style={{ position: 'relative' }}>
          <button
            type="button"
            className="ob-hbtn"
            aria-label="More options"
            aria-expanded={menuOpen}
            onClick={() => { triggerHaptic('light'); setMenuOpen((v) => !v); }}
          >
            <MoreVertical size={20} strokeWidth={2.8} />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <>
                <div className="ob-scrim" onClick={() => setMenuOpen(false)} aria-hidden="true" />
                <motion.div
                  className="ob-menu"
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.9, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: -6 }}
                  transition={{ duration: 0.13, ease: 'easeOut' }}
                >
                  <button
                    type="button"
                    className="ob-menuitem"
                    onClick={() => {
                      if (window.confirm('Log out? Your progress is saved as a draft.')) {
                        triggerHaptic('medium');
                        logout();
                      }
                    }}
                  >
                    <LogOut size={15} strokeWidth={2.8} /> Log out
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* ── the question — straight slide between steps ── */}
      <div className="ob-fit">
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.div
            key={s.key}
            custom={dir}
            variants={V.screen}
            initial="enter"
            animate="center"
            exit="exit"
            style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
          >
            <motion.h1 className="ob-title" variants={V.item}>{s.title}</motion.h1>
            {s.hint && <motion.p className="ob-hint" variants={V.item}>{s.hint}</motion.p>}

            <motion.div className="ob-field" variants={V.item}>
              {/* ── NAME ── */}
              {s.key === 'name' && (
                <input
                  className="ob-input"
                  value={formData.name}
                  onChange={(e) => update({ name: e.target.value.slice(0, 60) })}
                  placeholder="Your name"
                  autoCapitalize="words"
                  autoCorrect="off"
                  spellCheck="false"
                  autoComplete="off"
                  aria-label="Your name"
                  onKeyDown={(e) => { if (e.key === 'Enter') next(); }}
                />
              )}

              {/* ── DOB ── */}
              {s.key === 'dob' && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input ref={dayRef} className="ob-input ob-dob"
                      style={{ textAlign: 'center', flex: 1, minWidth: 0 }} value={dobD}
                      onChange={(e) => setDob('d', e.target.value)} onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !dobD) return;
                        if (e.key === 'Enter' && age) next();
                      }} placeholder="DD" inputMode="numeric" maxLength={2} aria-label="Day" />
                    <span className="ob-slash">/</span>
                    <input ref={monRef} className="ob-input ob-dob"
                      style={{ textAlign: 'center', flex: 1, minWidth: 0 }} value={dobM}
                      onChange={(e) => setDob('m', e.target.value)} onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !dobM) dayRef.current?.focus();
                        if (e.key === 'Enter' && age) next();
                      }} placeholder="MM" inputMode="numeric" maxLength={2} aria-label="Month" />
                    <span className="ob-slash">/</span>
                    <input ref={yrRef} className="ob-input ob-dob"
                      style={{ textAlign: 'center', flex: 1, minWidth: 0 }} value={dobY}
                      onChange={(e) => setDob('y', e.target.value)} onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !dobY) monRef.current?.focus();
                        if (e.key === 'Enter' && age) next();
                      }} placeholder="YYYY" inputMode="numeric" maxLength={4} aria-label="Year" />
                  </div>
                  {age !== null && (
                    <span className={`ob-age${age >= 18 && age <= 40 ? ' ok' : ''}`}>Age {age}</span>
                  )}
                </>
              )}

              {/* ── PHOTO ── the zone stays still; only the cross / add buttons press.
                   Shows the local preview instantly, then swaps in the uploaded URL.
                   Cross = remove; tapping the photo = change. ── */}
              {s.key === 'photo' && (
                <>
                  {(formData.photos[0] || preview) ? (
                    <div className="ob-photo filled">
                      <img src={formData.photos[0] || preview} alt="Your photo" />
                      {uploading && (
                        <span className="ob-uploading">
                          <span className="ob-spin" aria-hidden="true" /> Uploading…
                        </span>
                      )}
                      {!uploading && (
                        <>
                          <button type="button" className="ob-photohit" onClick={pickPhoto}
                            aria-label="Change your photo" />
                          <button type="button" className="ob-photox" onClick={removePhoto}
                            aria-label="Remove photo">
                            <X size={17} strokeWidth={3} />
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <button type="button" className="ob-photo" onClick={pickPhoto}
                      disabled={uploading} aria-label="Add your photo">
                      <span className="ob-photoempty">
                        <span className="ob-cam"><Camera size={28} strokeWidth={2.2} /></span>
                        Tap to add a photo
                      </span>
                    </button>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display: 'none' }} />
                </>
              )}

              {/* ── GENDER ── required: discover.js filters the deck on it ── */}
              {s.key === 'gender' && (
                <div className="ob-chips">
                  {genders.map((g) => (
                    <button key={g} type="button"
                      className={`ob-chip${formData.gender === g ? ' on' : ''}`}
                      onClick={() => { update({ gender: g }); triggerHaptic('light'); }}>
                      {formData.gender === g && <Check size={15} strokeWidth={3.2} />}
                      {g}
                    </button>
                  ))}
                </div>
              )}

              {/* ── SHOW ME ── multi-select; 'Everyone' is the escape hatch ── */}
              {s.key === 'interestedIn' && (
                <div className="ob-chips">
                  {showOptions.map((g) => (
                    <button key={g} type="button"
                      className={`ob-chip${formData.interestedIn.includes(g) ? ' on' : ''}`}
                      onClick={() => toggleIn('interestedIn', g)}>
                      {formData.interestedIn.includes(g) && <Check size={15} strokeWidth={3.2} />}
                      {g}
                    </button>
                  ))}
                </div>
              )}

              {/* ── YEAR ── */}
              {s.key === 'year' && (
                <div className="ob-chips">
                  {(config?.years || ['UG', 'PG']).map((y) => (
                    <button key={y} type="button"
                      className={`ob-chip${formData.year === y ? ' on' : ''}`}
                      onClick={() => { update({ year: y }); triggerHaptic('light'); }}>
                      {formData.year === y && <Check size={15} strokeWidth={3.2} />}
                      {y}
                    </button>
                  ))}
                </div>
              )}

              {s.key === 'location' && (
                /* 📍 REQUIRED, BUT NEVER A TRAP.
                   The prompt only fires from the button below, never on mount —
                   browsers penalise an unsolicited permission request, and this
                   is the first thing they would see if it fired automatically.

                   Both buttons leave this screen. Declining is stated in terms of
                   what the feed will actually do, because "Not now" would be a
                   lie here: the feed is not neutral without a reading, it is
                   campus-ranked. Coordinates go into the setup payload only if
                   the read actually succeeded. */
                <div className="ob-location">
                  {locationReading ? (
                    <p className="ob-location-ok">
                      <Check size={15} strokeWidth={3.2} /> Location shared. We'll
                      show you people near you first.
                    </p>
                  ) : locDeclined ? (
                    <>
                      <p className="ob-location-ok">
                        <Check size={15} strokeWidth={3.2} /> No problem — we'll rank
                        your feed using your college location.
                      </p>
                      <p className="ob-location-copy">
                        You can switch to your real location any time in Settings.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="ob-location-copy">
                        We'll use your location to show you people who are actually
                        nearby — not just people from your college. It is rounded
                        to about a kilometre and never shown to anyone else.
                      </p>
                      <button type="button" className="ob-loc-btn"
                        onClick={grantLocation} disabled={locBusy}>
                        {locBusy ? 'Finding you…' : 'Use my location'}
                      </button>
                      <button type="button" className="ob-loc-alt"
                        onClick={() => { setLocDeclined(true); setLocError(''); triggerHaptic('light'); }}
                        disabled={locBusy}>
                        Use my college location instead
                      </button>
                      {locError && (
                        <p className="ob-loc-note">
                          {locError} You can turn this on later in Settings, or use
                          your college location instead.
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}

              {s.key === 'intent' && (
                <div className="ob-chips">
                  {intentOptions.map((it) => (
                    <button key={it} type="button"
                      className={`ob-chip${formData.intent.includes(it) ? ' on' : ''}`}
                      onClick={() => toggleIn('intent', it)}>
                      {formData.intent.includes(it) && <Check size={15} strokeWidth={3.2} />}
                      {it}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {banner}

        {/* ── primary action ── */}
        {isLast ? (
          <button type="button" className="ob-cta" onClick={publish}
            disabled={!allDone || uploading || publishing}>
            {publishing ? 'Publishing…' : 'Publish & start matching'}
            <ChevronRight size={18} strokeWidth={3} />
          </button>
        ) : (
          <button type="button" className="ob-cta" onClick={next} disabled={!stepDone(step)}>
            Continue <ChevronRight size={18} strokeWidth={3} />
          </button>
        )}

        {/* ── the quiet footnote — bottom, always ── */}
        <p className="ob-foot">{s.foot || FOOT_DEFAULT}</p>
      </div>
    </div>
  );
};

export default Onboarding;
```

