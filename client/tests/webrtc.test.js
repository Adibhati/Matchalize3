/**
 * 🧪 WEBRTC — the parts that must be right without a device attached.
 *
 * Stage 2 is tested at the end of the project on real hardware, so everything
 * that can be proven without a camera is proven here instead. That means the
 * teardown path especially: a leaked camera is not a visual bug, it is the kind
 * of bug that survives a demo and is found in production.
 *
 * The React hook is not exercised (it needs a DOM and a real MediaStream), but
 * every guarantee it makes is delegated to `stopStream`, which IS covered — so
 * the risk concentrates in code that is tested.
 *
 *   node --test   (run from client/)
 *
 * Design source: ambitions/roulette.md §15, stage 2
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  stopStream,
  describeMediaError,
  diagnoseEnvironment,
  setTrackEnabled,
  PREVIEW_CONSTRAINTS,
  FALLBACK_CONSTRAINTS,
} from '../src/utils/webrtc.js';

/* ═══════════════════════════════════════════════════════════════════════════
 * FAKES
 *
 * Deliberately minimal and duck-typed. A real MediaStream cannot be
 * constructed in Node, and these tests are about our logic calling the right
 * methods — not about the browser's implementation of them.
 * ═══════════════════════════════════════════════════════════════════════════ */

const fakeTrack = (kind = 'video') => ({
  kind,
  enabled: true,
  stopCount: 0,
  stop() {
    this.stopCount += 1;
  },
});

const fakeStream = (kinds = ['video', 'audio']) => {
  const tracks = kinds.map(fakeTrack);
  return { tracks, getTracks: () => tracks };
};

const fakeVideo = () => ({
  srcObject: 'not-null',
  paused: false,
  pause() { this.paused = true; },
});

/* ═══════════════════════════════════════════════════════════════════════════
 * TEARDOWN — the guarantee this whole module is organised around
 * ═══════════════════════════════════════════════════════════════════════════ */

test('stopStream stops EVERY track on the stream', () => {
  const stream = fakeStream(['video', 'audio']);
  const stopped = stopStream(stream);
  assert.equal(stopped, 2);
  for (const track of stream.tracks) {
    assert.equal(track.stopCount, 1, `${track.kind} must be stopped`);
  }
});

test('stopStream survives a track whose stop() throws, and still stops the rest', () => {
  // The leak this prevents: a throwing track aborting the loop and leaving the
  // camera running for every remaining track.
  const good1 = fakeTrack('video');
  const bad = fakeTrack('audio');
  bad.stop = () => { throw new Error('track already ended'); };
  const good2 = fakeTrack('video');
  const stream = { tracks: [good1, bad, good2], getTracks: () => stream.tracks };

  assert.doesNotThrow(() => stopStream(stream));
  assert.equal(good1.stopCount, 1);
  assert.equal(good2.stopCount, 1, 'a throwing track must not skip later tracks');
});

test('stopStream detaches the video element so the last frame is not left on screen', () => {
  const video = fakeVideo();
  stopStream(fakeStream(), video);
  assert.equal(video.srcObject, null);
  assert.equal(video.paused, true);
});

test('stopStream tolerates a detached element that throws', () => {
  const video = {
    pause() { throw new Error('element detached'); },
    set srcObject(_v) { throw new Error('element detached'); },
  };
  assert.doesNotThrow(() => stopStream(fakeStream(), video));
});

test('stopStream is safe on nothing at all', () => {
  for (const bad of [null, undefined, {}]) {
    assert.doesNotThrow(() => stopStream(bad), `stopStream(${JSON.stringify(bad)})`);
  }
  assert.doesNotThrow(() => stopStream(null, fakeVideo()));
});

test('a stream with no tracks is a no-op, not a crash', () => {
  assert.equal(stopStream({ tracks: [], getTracks: () => [] }), 0);
});

/* ═══════════════════════════════════════════════════════════════════════════
 * TRACK TOGGLES
 * ═══════════════════════════════════════════════════════════════════════════ */

test('setTrackEnabled toggles the right kind only', () => {
  const stream = fakeStream(['video', 'audio']);
  assert.equal(setTrackEnabled(stream, 'audio', false), true);
  assert.equal(stream.tracks.find((t) => t.kind === 'audio').enabled, false);
  assert.equal(stream.tracks.find((t) => t.kind === 'video').enabled, true, 'video untouched');
});

test('setTrackEnabled reports failure instead of throwing when the kind is absent', () => {
  const stream = fakeStream(['video']);
  assert.equal(setTrackEnabled(stream, 'audio', false), false);
  assert.equal(setTrackEnabled(null, 'video', true), false);
  assert.equal(setTrackEnabled({}, 'video', true), false);
});

/* ═══════════════════════════════════════════════════════════════════════════
 * ERROR CLASSIFICATION
 *
 * Each case maps to a DIFFERENT user remedy, which is why each is pinned
 * separately. A regression here does not crash — it tells someone to reload
 * when the real fix is in their browser settings.
 * ═══════════════════════════════════════════════════════════════════════════ */

test('a denied permission is reported as blocked, with instructions', () => {
  for (const name of ['NotAllowedError', 'PermissionDeniedError']) {
    const d = describeMediaError({ name });
    assert.equal(d.code, 'denied');
    assert.match(d.detail, /allow|access/i, 'must tell them how to fix it');
  }
});

test('a missing camera is distinguished from a denied one', () => {
  for (const name of ['NotFoundError', 'DevicesNotFoundError']) {
    assert.equal(describeMediaError({ name }).code, 'no-device');
  }
});

test('a camera already in use is distinguished from both', () => {
  for (const name of ['NotReadableError', 'TrackStartError']) {
    const d = describeMediaError({ name });
    assert.equal(d.code, 'busy');
    assert.match(d.detail, /another|close/i);
  }
});

test('every error path produces a title and something actionable', () => {
  const names = [
    'NotAllowedError', 'NotFoundError', 'NotReadableError',
    'OverconstrainedError', 'AbortError', 'SecurityError',
    'SomethingNobodyHasHeardOf', null, undefined,
  ];
  for (const name of names) {
    const d = describeMediaError({ name });
    assert.ok(d.code, `code missing for ${name}`);
    assert.ok(d.title && d.title.length > 0, `title missing for ${name}`);
    assert.ok(d.detail && d.detail.length > 20, `detail too thin for ${name}`);
  }
});

test('an unrecognised error keeps the raw name for debugging', () => {
  const d = describeMediaError({ name: 'WeirdNewError' });
  assert.equal(d.code, 'unknown');
  assert.equal(d.raw, 'WeirdNewError');
});

test('describeMediaError survives being handed nothing', () => {
  assert.doesNotThrow(() => describeMediaError(undefined));
  assert.doesNotThrow(() => describeMediaError(null));
  assert.doesNotThrow(() => describeMediaError({}));
});

/* ═══════════════════════════════════════════════════════════════════════════
 * ENVIRONMENT DIAGNOSTICS
 *
 * The single most valuable output of this stage: device testing is deferred to
 * the end of the project, so a dead preview must be able to explain itself.
 * ═══════════════════════════════════════════════════════════════════════════ */

test('an unsupported browser is reported plainly', () => {
  const d = diagnoseEnvironment();
  // Under Node there is no navigator at all, which is exactly the unsupported
  // path and must not throw.
  assert.equal(d.ok, false);
  assert.ok(d.label.length > 0);
  assert.ok(d.detail.length > 20);
});

/* ═══════════════════════════════════════════════════════════════════════════
 * CAPTURE SETTINGS
 *
 * Pinned because they are a cost decision, not a preference. 1080p here would
 * roughly triple the TURN bill once relaying arrives at stage 4.
 * ═══════════════════════════════════════════════════════════════════════════ */

test('preview asks for 480p at 24fps, not HD', () => {
  const v = PREVIEW_CONSTRAINTS.video;
  assert.equal(v.width.ideal, 640);
  assert.equal(v.height.ideal, 480);
  assert.equal(v.frameRate.ideal, 24);
  assert.equal(v.facingMode, 'user');
});

test('constraints are ideals, never exacts, so a weaker camera still starts', () => {
  for (const part of [PREVIEW_CONSTRAINTS.video.width, PREVIEW_CONSTRAINTS.video.height, PREVIEW_CONSTRAINTS.video.frameRate]) {
    assert.ok(!('exact' in part), 'exact would hard-fail on a lower-end device');
  }
});

test('audio is requested with the processing that makes speech usable', () => {
  const a = PREVIEW_CONSTRAINTS.audio;
  assert.equal(a.echoCancellation, true);
  assert.equal(a.noiseSuppression, true);
  assert.equal(a.autoGainControl, true);
});

test('the fallback exists and is lower than the primary', () => {
  assert.ok(FALLBACK_CONSTRAINTS.video.width.ideal < PREVIEW_CONSTRAINTS.video.width.ideal);
  assert.ok(FALLBACK_CONSTRAINTS.video.height.ideal < PREVIEW_CONSTRAINTS.video.height.ideal);
});

test('constraints are frozen so a consumer cannot mutate the shared object', () => {
  assert.throws(() => { 'use strict'; PREVIEW_CONSTRAINTS.video.width = { ideal: 1 }; });
});
