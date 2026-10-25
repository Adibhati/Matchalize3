/**
 * 📷 WEBRTC — camera and microphone, local preview only.
 *
 * ── WHY THIS FILE EXISTS ─────────────────────────────────────────────────────
 * The single most common way a video feature embarrasses you is not a broken
 * call. It is a camera that stays on after the user left the screen. Every app
 * with a camera has shipped that bug at least once, so the whole module is
 * organised around making that impossible rather than around making the
 * happy path short.
 *
 * The rule: `stopStream` is the ONLY way a MediaStream is ever torn down, and
 * `useCameraPreview` calls it from every exit path it can reach — unmount, page
 * hide, explicit stop, request failure, and starting a new request. There is no
 * second implementation to keep in sync, and nothing to forget.
 *
 * ── SCOPE ────────────────────────────────────────────────────────────────────
 * Stage 2: local preview, permission states, guaranteed cleanup. No peer
 * connection, no queue, no signaling — those are Stages 3 and 5.
 *
 * ── SECURE CONTEXT ───────────────────────────────────────────────────────────
 * getUserMedia only exists on HTTPS or localhost. On a plain-HTTP LAN address
 * `navigator.mediaDevices` is undefined and the browser refuses — which is why
 * `diagnoseEnvironment()` exists and why the preview reports it plainly instead
 * of failing with something unhelpful.
 *
 * Design source: ambitions/roulette.md §15, stage 2
 */

import React from 'react';

/**
 * Deep-freeze a constraints tree.
 *
 * `Object.freeze` is shallow, which means a frozen top level would still let a
 * caller reach through and mutate `video.width.ideal` — the exact shared state
 * every caller reads. Recursion is the only thing that actually protects it.
 */
const deepFreeze = (obj) => {
  Object.values(obj).forEach((val) => {
    if (val && typeof val === 'object' && !Object.isFrozen(val)) deepFreeze(val);
  });
  return Object.freeze(obj);
};

/**
 * Starting capture constraints.
 *
 * 480p/24 deliberately, not 720p/30 and certainly not 1080p. For a face-to-face
 * chat this is visually indistinguishable, and the bitrate difference is the
 * entire TURN bill once relaying is introduced at Stage 4. Resolution and
 * bitrate are separate settings — this caps the resolution, and Stage 4 sets
 * `maxBitrate` separately. Frame rate is asked for rather than capped because
 * browsers are unreliable at honouring an exact cap.
 *
 * `facingMode: 'user'` asks for the front camera; desktop cameras ignore it,
 * which is harmless.
 */
export const PREVIEW_CONSTRAINTS = deepFreeze({
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
  video: {
    width: { ideal: 640 },
    height: { ideal: 480 },
    frameRate: { ideal: 24 },
    facingMode: 'user',
  },
});

/**
 * Retry constraints after OverconstrainedError.
 *
 * A device that cannot do 480p still does 360p, and a machine with no
 * front-facing camera still has a webcam. Asking for `ideal` rather than
 * `exact` in PREVIEW_CONSTRAINTS means this is rarely reached, but a preview
 * that refuses to start on a 360p-only laptop is a bad first impression.
 */
export const FALLBACK_CONSTRAINTS = deepFreeze({
  audio: true,
  video: { width: { ideal: 320 }, height: { ideal: 240 } },
});

/* ═══════════════════════════════════════════════════════════════════════════
 * TEARDOWN
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Stop every track on a stream. THE ONLY teardown path in the codebase.
 *
 * `MediaStream.stop()` does not exist — stopping is per-track, and omitting one
 * leaves that camera alive. This loops defensively: a track whose `stop` throws
 * must not prevent the others from stopping.
 *
 * Also drops `srcObject` on any video element bound to the stream, because an
 * element holding a stopped stream still shows the last frame, which reads as
 * "camera is still on" to the user even when it is not.
 *
 * @param {MediaStream|null|undefined} stream
 * @param {HTMLVideoElement|null|undefined} [video]  element to detach
 * @returns {number} how many tracks were stopped (for tests/diagnostics)
 */
export const stopStream = (stream, video) => {
  let stopped = 0;

  if (stream) {
    const tracks = typeof stream.getTracks === 'function' ? stream.getTracks() : [];
    for (const track of tracks) {
      try {
        track.stop();
        stopped += 1;
      } catch {
        // A track can already be ended (user revoked permission in the browser
        // UI). Swallowing this is correct — the remaining tracks still need to
        // stop, and aborting the loop would leak them.
      }
    }
  }

  if (video) {
    try {
      video.pause?.();
      video.srcObject = null;
    } catch {
      // Detaching is best-effort; a detached-but-stopped track is already safe.
    }
  }

  return stopped;
};

/* ═══════════════════════════════════════════════════════════════════════════
 * ERROR CLASSIFICATION
 * ═══════════════════════════════════════════════════════════════════════════
 * The browser hands back a DOMException whose `name` is the only reliable
 * signal. Turning each into a sentence the user can act on is the difference
 * between a dead end and a fixable problem — every one of these has a different
 * remedy, and "camera error" tells somebody nothing.
 *
 * Legacy Safari prefixes (`PermissionDeniedError`, `DevicesNotFoundError`,
 * `TrackStartError`) appear in the lists because iOS Safari still emits them.
 */
export const describeMediaError = (err) => {
  const name = err?.name || '';

  if (name === 'NotAllowedError' || name === 'PermissionDeniedError' || name === 'SecurityError') {
    return {
      code: 'denied',
      title: 'Camera blocked',
      detail:
        'Your browser is not letting this page use your camera or microphone. '
        + 'Open the padlock or camera icon in the address bar and allow access, then try again.',
    };
  }

  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return {
      code: 'no-device',
      title: 'No camera found',
      detail: 'This device does not have a camera we can use. You can still browse Roulette, but you cannot join a video session.',
    };
  }

  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return {
      code: 'busy',
      title: 'Camera is busy',
      detail:
        'Something else is already using your camera — another app, or a video call in another tab. '
        + 'Close it and try again.',
    };
  }

  if (name === 'OverconstrainedError') {
    return {
      code: 'overconstrained',
      title: 'Camera settings unavailable',
      detail: 'Your camera cannot meet the requested settings. We have retried at a lower resolution.',
    };
  }

  if (name === 'AbortError') {
    return {
      code: 'aborted',
      title: 'Camera stopped unexpectedly',
      detail: 'The browser ended the camera request. Please try again.',
    };
  }

  return {
    code: 'unknown',
    title: 'Could not start your camera',
    detail: 'Something went wrong while starting the camera. Refreshing the page usually clears it.',
    raw: name || String(err?.message || err || 'unknown'),
  };
};

/* ═══════════════════════════════════════════════════════════════════════════
 * ENVIRONMENT DIAGNOSTICS
 * ═══════════════════════════════════════════════════════════════════════════
 * Because device testing happens at the end of the project, this exists so a
 * failing preview reports WHY in one tap instead of leaving someone to guess
 * between a code bug, a permissions problem, and an HTTP address.
 */
export const diagnoseEnvironment = () => {
  const insecure = typeof window !== 'undefined' && window.isSecureContext === false;

  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return {
      ok: false,
      code: 'unsupported',
      label: 'Camera unavailable on this address',
      detail: insecure
        ? 'Browsers only allow camera access over HTTPS or on localhost. This page is on a plain-HTTP address, so the camera is blocked by the browser itself — not by a bug in the app.'
        : 'This browser does not support camera access. Try Chrome, Safari or Firefox.',
    };
  }

  return {
    ok: true,
    code: 'supported',
    label: 'Camera supported',
    detail: 'This browser can access a camera on this address.',
  };
};

/** List the cameras and microphones attached, without opening either. */
export const listDevices = async () => {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) return [];
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return {
      cameras: devices.filter((d) => d.kind === 'videoinput'),
      microphones: devices.filter((d) => d.kind === 'audioinput'),
    };
  } catch {
    // Enumeration is blocked in some privacy modes even where getUserMedia works.
    return { cameras: [], microphones: [] };
  }
};

/* ═══════════════════════════════════════════════════════════════════════════
 * REQUEST
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Open the local camera and microphone.
 *
 * Retries once with FALLBACK_CONSTRAINTS on OverconstrainedError, because a
 * device that cannot do 480p is still perfectly able to do a video call — it
 * just cannot do this one.
 *
 * @param {object} [opts]
 * @param {boolean} [opts.audio=false]  default is video-only preview
 * @returns {Promise<MediaStream>}
 * @throws the original DOMException, after any fallback has also failed
 */
export const requestPreviewStream = async ({ audio = false } = {}) => {
  const primary = audio
    ? { audio: PREVIEW_CONSTRAINTS.audio, video: PREVIEW_CONSTRAINTS.video }
    : { video: PREVIEW_CONSTRAINTS.video };

  try {
    return await navigator.mediaDevices.getUserMedia(primary);
  } catch (err) {
    if (err?.name !== 'OverconstrainedError') throw err;

    const fallback = audio
      ? { audio: true, video: FALLBACK_CONSTRAINTS.video }
      : { video: FALLBACK_CONSTRAINTS.video };
    return navigator.mediaDevices.getUserMedia(fallback);
  }
};

/** Enable or disable one track by kind, e.g. setTrackEnabled(stream, 'audio', false). */
export const setTrackEnabled = (stream, kind, enabled) => {
  if (!stream || typeof stream.getTracks !== 'function') return false;
  const track = stream.getTracks().find((t) => t.kind === kind);
  if (!track) return false;
  track.enabled = !!enabled;
  return true;
};

/** Bind a stream to a video element. Muting is required for a self-preview. */
export const attachStream = (video, stream) => {
  if (!video) return;
  video.srcObject = stream || null;
  // A self-preview must never produce audio feedback. `muted` also satisfies
  // the autoplay policy browsers apply to unmuted playback.
  video.muted = true;
  video.playsInline = true;
  if (stream) {
    const attempt = video.play?.();
    // Autoplay can reject even when muted; a rejected promise here is not an
    // error worth surfacing, and swallowing it avoids an unhandled rejection.
    if (attempt?.catch) attempt.catch(() => {});
  }
};

/* ═══════════════════════════════════════════════════════════════════════════
 * REACT HOOK
 * ═══════════════════════════════════════════════════════════════════════════
 * Guarantees cleanup. The stream lives in a ref, never in state, because state
 * updates are asynchronous and a stale closure can hand out a stream that has
 * already been stopped — the classic leaked-camera race.
 */

/**
 * @param {object} [opts]
 * @param {boolean} [opts.audio=false]
 * @param {boolean} [opts.autoStart=false]  begin capturing as soon as mounted
 * @param {boolean} [opts.stopOnHide=true]   stop when the tab is hidden
 */
export const useCameraPreview = ({ audio = false, autoStart = false, stopOnHide = true } = {}) => {
  const [status, setStatus] = React.useState('idle'); // idle|requesting|ready|error
  const [error, setError] = React.useState(null);
  const [audioOn, setAudioOnState] = React.useState(true);
  const [videoOn, setVideoOnState] = React.useState(true);

  const streamRef = React.useRef(null);
  const videoRef = React.useRef(null);
  const mountedRef = React.useRef(false);

  /** The single teardown. Everything else routes through this. */
  const stop = React.useCallback(() => {
    stopStream(streamRef.current, videoRef.current);
    streamRef.current = null;
    if (mountedRef.current) setStatus('idle');
  }, []);

  const start = React.useCallback(async () => {
    if (streamRef.current) return streamRef.current;

    setStatus('requesting');
    setError(null);

    try {
      const stream = await requestPreviewStream({ audio });
      streamRef.current = stream;

      if (!mountedRef.current) {
        // Unmounted (or hidden-and-stopped) while the browser was still deciding.
        // The stream exists but nobody holds a reference any more — this is
        // exactly how cameras leak, so it is stopped here rather than discarded.
        stopStream(stream);
        return null;
      }

      attachStream(videoRef.current, stream);

      // The user can revoke camera access from the browser UI at any time,
      // which ends the track without any event on our side.
      for (const track of stream.getTracks()) {
        track.addEventListener?.('ended', () => {
          if (streamRef.current === stream) {
            streamRef.current = null;
            setStatus('error');
            setError(describeMediaError({ name: 'NotReadableError' }));
          }
        });
      }

      setAudioOnState(true);
      setVideoOnState(true);
      setStatus('ready');
      return stream;
    } catch (err) {
      if (mountedRef.current) {
        setStatus('error');
        setError(describeMediaError(err));
      }
      return null;
    }
  }, [audio]);

  const toggleAudio = React.useCallback(() => {
    setAudioOnState((prev) => {
      const next = !prev;
      if (streamRef.current) setTrackEnabled(streamRef.current, 'audio', next);
      return next;
    });
  }, []);

  const toggleVideo = React.useCallback(() => {
    setVideoOnState((prev) => {
      const next = !prev;
      if (streamRef.current) setTrackEnabled(streamRef.current, 'video', next);
      return next;
    });
  }, []);

  // Mount bookkeeping + the unmount guarantee.
  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopStream(streamRef.current, videoRef.current);
      streamRef.current = null;
    };
  }, []);

  /*
   * Tab hidden / closed.
   *
   * `pagehide` is the reliable one: it fires on tab close AND on navigating
   * away, including into the back/forward cache. `beforeunload` is not, on
   * mobile. `visibilitychange` is separate because it also fires on a plain tab
   * switch — harmless for a preview, but Stage 3 will want to keep a live call
   * alive across a tab switch, so the two are handled distinctly now.
   */
  React.useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const onPageHide = () => {
      stopStream(streamRef.current, videoRef.current);
      streamRef.current = null;
    };
    const onVisibility = () => {
      if (!stopOnHide) return;
      if (document.visibilityState === 'hidden') onPageHide();
    };

    window.addEventListener('pagehide', onPageHide);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', onPageHide);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [stopOnHide]);

  React.useEffect(() => {
    if (autoStart) start();
    // Intentionally not depending on `start` — autoStart is a mount-time
    // decision, and re-running on every render identity change would re-open
    // the camera repeatedly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    status,
    error,
    audioOn,
    videoOn,
    videoRef,
    hasStream: () => Boolean(streamRef.current),
    start,
    stop,
    toggleAudio,
    toggleVideo,
  };
};

export default useCameraPreview;
