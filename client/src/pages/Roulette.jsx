import React, { useState, useCallback } from 'react';
import neu from '../styles/neu';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shuffle, Video, ShieldCheck, Mic, MicOff, VideoOff,
  CameraOff, AlertTriangle, RotateCw, Check, Info, ChevronLeft,
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { toast } from '../utils/toast';
import { DECK_CONTENT_TOP } from '../utils/deckChrome';
import {
  useCameraPreview, diagnoseEnvironment, listDevices,
} from '../utils/webrtc';

/* The shared neo-brutalist canon (src/styles/neu.js) */
const t = neu;

const ROULETTE_CSS = `
  .rt-slam { display: inline-flex; align-items: center; justify-content: center; gap: 10px;
    width: 100%; padding: 16px 20px; border: 2px solid #191919; border-radius: 14px;
    background: #FFD43D; color: #191919; cursor: pointer;
    font-family: ${t.fontMono}; font-size: 13px; font-weight: 700; letter-spacing: .12em;
    text-transform: uppercase; box-shadow: 5px 5px 0 #191919;
    transition: transform .08s steps(2), box-shadow .08s steps(2), background .08s steps(2);
    -webkit-tap-highlight-color: transparent; }
  .rt-slam:active { transform: translate(5px, 5px); box-shadow: 0 0 0 #191919; }
  .rt-slam:disabled { opacity: .6; cursor: default; transform: none !important; box-shadow: 5px 5px 0 #191919 !important; }

  .rt-rail:focus-visible, .rt-slam:focus-visible, .rt-iconbtn:focus-visible, .rt-ghost:focus-visible {
    outline: 3px solid #FFD43D; outline-offset: 2px; }

  /* Self-preview. Mirrored because a camera shows you what others see, and a
     unmirrored self-view is disorienting enough that people think it is broken. */
  .rt-video { width: 100%; height: 100%; object-fit: cover; transform: scaleX(-1);
    background: #131313; display: block; }

  @media (hover: hover) and (pointer: fine) {
    .rt-slam:hover:not(:active):not(:disabled) { transform: translate(-1px, -1px); box-shadow: 6px 6px 0 #191919; }
    .rt-iconbtn:hover:not(:active) { background: ${t.yellow}; }
  }
  @media (prefers-reduced-motion: reduce) {
    .rt-slam { transition: none; }
  }
`;

/* Small candy-tile control used for the mic / camera toggles and the back
 * button, matching the .hd-btn language from Header.jsx. */
const iconBtn = {
  width: 46, height: 46, flexShrink: 0,
  borderRadius: 13, border: `2px solid ${t.ink}`,
  backgroundColor: t.card, color: t.ink,
  boxShadow: `4px 4px 0 ${t.ink}`,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
};

/** A short, honest label. Never says "anonymous" — the camera is on. */
const ANON_COPY = 'Your face is visible. Your profile is not shown.';

const Roulette = () => {
  const cam = useCameraPreview({ audio: true, autoStart: false });
  const [env, setEnv] = useState(null);
  const [devices, setDevices] = useState(null);
  const [showSelfTest, setShowSelfTest] = useState(false);

  const { status, error, audioOn, videoOn, videoRef, start, stop } = cam;

  /* ── Environment + devices ──────────────────────────────────────────────────
   * Computed once on mount so the preview can say WHY it cannot start, instead
   * of a generic failure. Device testing happens at the end of the project, so
   * this is the difference between "it is broken" and "the address is HTTP". */
  React.useEffect(() => {
    setEnv(diagnoseEnvironment());
    listDevices().then((d) => setDevices(d));
  }, []);

  const handleEnter = useCallback(async () => {
    triggerHaptic('medium');
    // `start` returns the stream or null, so the outcome is known immediately.
    // Reading `error` from state here instead would be a stale closure — the
    // setState inside start has not flushed yet, so the failure haptic would
    // never fire on a first attempt.
    const stream = await start();
    if (!stream) triggerHaptic('heavy');
  }, [start]);

  const handleLeave = useCallback(() => {
    triggerHaptic('light');
    stop();
    toast.info('Camera turned off.');
  }, [stop]);

  const handleRetry = useCallback(() => {
    triggerHaptic('light');
    start();
  }, [start]);

  /* ══ IDLE — nothing requested yet ══════════════════════════════════════ */
  if (status === 'idle') {
    return (
      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: t.desk, position: 'relative', paddingTop: DECK_CONTENT_TOP }}>
        <style>{ROULETTE_CSS}</style>

        <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 20px 48px', gap: 26 }}>
          <motion.div
            initial={{ scale: 0.85, opacity: 0, rotate: -6 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 14, stiffness: 260 }}
            style={{
              width: 92, height: 92, borderRadius: 24, backgroundColor: t.yellow,
              border: `2px solid ${t.ink}`, boxShadow: `5px 5px 0 ${t.ink}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Shuffle size={40} strokeWidth={2.6} color={t.ink} />
          </motion.div>

          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h2 style={{ fontFamily: t.fontHeavy, fontSize: 27, fontWeight: 400, color: t.paper, margin: 0, letterSpacing: '-.01em', lineHeight: 1.1, textTransform: 'uppercase' }}>
              Campus Roulette
            </h2>
            <p style={{ fontFamily: t.fontMono, fontSize: 10.5, fontWeight: 700, color: t.ink3, margin: 0, letterSpacing: '.14em', textTransform: 'uppercase' }}>
              Live serendipity · same campus + all campuses
            </p>
          </div>

          <div style={{ width: 'min(420px, 100%)', display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
            {/* Insecure-origin warning takes priority — it explains every other
                failure the user would otherwise hit. */}
            {env && !env.ok && (
              <div className="rt-rail" style={{ display: 'flex', gap: 12, alignItems: 'flex-start', backgroundColor: t.coral, border: `2px solid ${t.ink}`, borderRadius: 14, boxShadow: `4px 4px 0 ${t.ink}`, padding: '13px 14px' }}>
                <span style={{ width: 30, height: 30, flexShrink: 0, borderRadius: 9, border: `2px solid ${t.ink}`, backgroundColor: t.yellow, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={15} strokeWidth={2.4} color={t.ink} />
                </span>
                <p style={{ fontFamily: t.fontBody, fontSize: 12.5, fontWeight: 600, color: t.ink, margin: 0, lineHeight: 1.55 }}>
                  <strong style={{ display: 'block', marginBottom: 3 }}>{env.label}</strong>
                  {env.detail}
                </p>
              </div>
            )}

            <button className="rt-slam" onClick={handleEnter} disabled={Boolean(env && !env.ok)}>
              <Video size={18} strokeWidth={2.8} />
              <span>Check my camera</span>
            </button>

            <p style={{ fontFamily: t.fontBody, fontSize: 13.5, fontWeight: 500, color: t.ink3, margin: 0, textAlign: 'center', lineHeight: 1.6 }}>
              We check your camera before any session, so nothing goes wrong later.
            </p>
          </div>

          <SelfTestRow show={showSelfTest} onToggle={() => setShowSelfTest((s) => !s)} env={env} devices={devices} />
        </div>
      </div>
    );
  }

  /* ══ REQUESTING ═════════════════════════════════════════════════════════ */
  if (status === 'requesting') {
    return (
      <div style={{ flex: 1, backgroundColor: t.desk, position: 'relative', paddingTop: DECK_CONTENT_TOP, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <style>{ROULETTE_CSS}</style>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div className="rt-rail" style={{ width: 92, height: 92, borderRadius: 24, backgroundColor: t.yellow, border: `2px solid ${t.ink}`, boxShadow: `5px 5px 0 ${t.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Video size={38} strokeWidth={2.6} color={t.ink} />
          </div>
          <p role="status" style={{ fontFamily: t.fontMono, fontSize: 11, fontWeight: 700, color: t.ink3, margin: 0, letterSpacing: '.14em', textTransform: 'uppercase' }}>
            Waiting for permission…
          </p>
        </div>
      </div>
    );
  }

  /* ══ ERROR ══════════════════════════════════════════════════════════════ */
  if (status === 'error' && error) {
    return (
      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: t.desk, position: 'relative', paddingTop: DECK_CONTENT_TOP }}>
        <style>{ROULETTE_CSS}</style>
        <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 20px 48px', gap: 22 }}>
          <div style={{ width: 92, height: 92, borderRadius: 24, backgroundColor: t.coral, border: `2px solid ${t.ink}`, boxShadow: `5px 5px 0 ${t.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CameraOff size={40} strokeWidth={2.6} color={t.ink} />
          </div>

          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 10, width: 'min(420px, 100%)' }}>
            <h2 style={{ fontFamily: t.fontHeavy, fontSize: 22, fontWeight: 400, color: t.paper, margin: 0, textTransform: 'uppercase' }}>
              {error.title}
            </h2>
            <p style={{ fontFamily: t.fontBody, fontSize: 13.5, fontWeight: 500, color: t.ink3, margin: 0, lineHeight: 1.6, textAlign: 'center' }}>
              {error.detail}
            </p>
          </div>

          <div style={{ width: 'min(420px, 100%)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button className="rt-slam" onClick={handleRetry}>
              <RotateCw size={18} strokeWidth={2.8} />
              <span>Try again</span>
            </button>
            <button className="rt-ghost" onClick={handleLeave} style={{ width: '100%', padding: '13px 16px', border: `2px solid ${t.ink}`, borderRadius: 14, background: 'transparent', color: t.ink3, cursor: 'pointer', fontFamily: t.fontMono, fontSize: 11, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', WebkitTapHighlightColor: 'transparent' }}>
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ══ READY — the actual preview ══════════════════════════════════════════ */
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: t.desk, position: 'relative', paddingTop: DECK_CONTENT_TOP, overflowY: 'auto' }}>
      <style>{ROULETTE_CSS}</style>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, padding: '4px 20px 28px', width: 'min(560px, 100%)', margin: '0 auto' }}>
        {/* Self-preview */}
        <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 3', borderRadius: 20, overflow: 'hidden', border: `2px solid ${t.ink}`, boxShadow: `6px 6px 0 ${t.ink}`, backgroundColor: '#131313' }}>
          <video ref={videoRef} className="rt-video" autoPlay playsInline muted />
          {!videoOn && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: t.desk }}>
              <VideoOff size={34} strokeWidth={2.2} color={t.ink3} />
              <p style={{ fontFamily: t.fontMono, fontSize: 10.5, fontWeight: 700, color: t.ink3, margin: 0, letterSpacing: '.14em', textTransform: 'uppercase' }}>
                Camera off
              </p>
            </div>
          )}
          {!audioOn && (
            <div style={{ position: 'absolute', top: 12, left: 12, width: 34, height: 34, borderRadius: 10, border: `2px solid ${t.ink}`, backgroundColor: t.coral, color: t.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MicOff size={17} strokeWidth={2.6} color={t.ink} />
            </div>
          )}
        </div>

        {/* Identity line — deliberately short and honest. */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center', textAlign: 'center' }}>
          <p style={{ fontFamily: t.fontHeavy, fontSize: 19, fontWeight: 400, color: t.paper, margin: 0, textTransform: 'uppercase', letterSpacing: '-.01em' }}>
            You are ready
          </p>
          <p style={{ fontFamily: t.fontBody, fontSize: 13, fontWeight: 500, color: t.ink3, margin: 0, lineHeight: 1.55 }}>
            {ANON_COPY}
          </p>
        </div>

        {/* Toggles */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="rt-iconbtn" onClick={cam.toggleAudio} style={{ ...iconBtn, backgroundColor: audioOn ? t.card : t.coral }} aria-label={audioOn ? 'Mute microphone' : 'Unmute microphone'} aria-pressed={audioOn}>
            {audioOn ? <Mic size={19} strokeWidth={2.4} color={t.ink} /> : <MicOff size={19} strokeWidth={2.4} color={t.ink} />}
          </button>
          <button className="rt-iconbtn" onClick={cam.toggleVideo} style={{ ...iconBtn, backgroundColor: videoOn ? t.card : t.coral }} aria-label={videoOn ? 'Turn camera off' : 'Turn camera on'} aria-pressed={videoOn}>
            {videoOn ? <Video size={19} strokeWidth={2.4} color={t.ink} /> : <VideoOff size={19} strokeWidth={2.4} color={t.ink} />}
          </button>
        </div>

        {/* Start — disabled on purpose until Stage 3 exists */}
        <button className="rt-slam" onClick={() => toast.info('Matching arrives in the next build.')} style={{ marginTop: 4 }}>
          <Shuffle size={18} strokeWidth={2.8} />
          <span>Start a live session</span>
        </button>

        <button onClick={handleLeave} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'center', padding: '9px 14px', border: `2px solid ${t.ink}`, borderRadius: 12, background: 'transparent', color: t.ink3, cursor: 'pointer', fontFamily: t.fontMono, fontSize: 10.5, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', WebkitTapHighlightColor: 'transparent' }}>
          <ChevronLeft size={15} strokeWidth={2.6} color={t.ink3} />
          Turn camera off
        </button>

        <div className="rt-rail" style={{ display: 'flex', alignItems: 'flex-start', gap: 12, backgroundColor: t.paper, border: `2px solid ${t.ink}`, borderRadius: 14, boxShadow: `4px 4px 0 ${t.ink}`, padding: '13px 14px' }}>
          <span style={{ width: 30, height: 30, flexShrink: 0, borderRadius: 9, border: `2px solid ${t.ink}`, backgroundColor: t.green, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={15} strokeWidth={2.4} color={t.ink} />
          </span>
          <p style={{ fontFamily: t.fontBody, fontSize: 12.5, fontWeight: 600, color: t.ink2, margin: 0, lineHeight: 1.55 }}>
            Only verified college students from the Indian college network enter — same campus or any other campus.
          </p>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
 * SELF TEST
 *
 * Exists because device testing happens at the end of the project. One tap
 * separates "the app is broken" from "the browser blocked it" from "this
 * address is not allowed to use a camera" — the three causes of a dead preview,
 * which are otherwise indistinguishable until someone reads the console.
 * ═══════════════════════════════════════════════════════════════════════════ */
const SelfTestRow = ({ show, onToggle, env, devices }) => (
  <div style={{ width: 'min(420px, 100%)', display: 'flex', flexDirection: 'column', gap: 10 }}>
    <button onClick={onToggle} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, alignSelf: 'center', padding: '9px 14px', border: `2px solid ${t.ink}`, borderRadius: 12, background: 'transparent', color: t.ink3, cursor: 'pointer', fontFamily: t.fontMono, fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', WebkitTapHighlightColor: 'transparent' }}>
      <Info size={14} strokeWidth={2.6} color={t.ink3} />
      {show ? 'Hide device check' : 'Device check'}
    </button>

    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{ overflow: 'hidden' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, padding: '13px 14px', backgroundColor: t.paper, border: `2px solid ${t.ink}`, borderRadius: 14, boxShadow: `4px 4px 0 ${t.ink}` }}>
            <Row label="Secure address" ok={env?.ok} value={env?.label} />
            <Row label="Cameras found" ok={(devices?.cameras?.length || 0) > 0} value={String(devices?.cameras?.length ?? '—')} />
            <Row label="Microphones found" ok={(devices?.microphones?.length || 0) > 0} value={String(devices?.microphones?.length ?? '—')} />
            {env && !env.ok && (
              <p style={{ fontFamily: t.fontBody, fontSize: 12, fontWeight: 600, color: t.ink2, margin: '4px 0 0', lineHeight: 1.55 }}>
                {env.detail}
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const Row = ({ label, ok, value }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
    <span style={{ width: 20, height: 20, flexShrink: 0, borderRadius: 6, border: `2px solid ${t.ink}`, backgroundColor: ok === true ? t.green : ok === false ? t.coral : t.yellow, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {ok === true
        ? <Check size={12} strokeWidth={3.2} color={t.ink} />
        : <AlertTriangle size={11} strokeWidth={2.8} color={t.ink} />}
    </span>
    <span style={{ fontFamily: t.fontBody, fontSize: 12.5, fontWeight: 600, color: t.ink2, flex: 1 }}>{label}</span>
    <span style={{ fontFamily: t.fontMono, fontSize: 11, fontWeight: 700, color: t.ink3 }}>{value}</span>
  </div>
);

export default Roulette;
