/**
 * 🃏 REGRESSION TEST — deck metrics and the distance preference.
 *
 * Run: node server/scripts/verify-deck-metrics.mjs      (server must be on :5005)
 *
 * ── WHY THIS FILE EXISTS ─────────────────────────────────────────────────────
 * Two bugs in this area were both invisible to "did it break?" tests:
 *
 *   1. `deckPosition` came from the CLIENT's own `?served=` total. When the
 *      app-open location check discarded a deck because the viewer had
 *      travelled, the deck was rebuilt correctly but the client's counter was
 *      never reset — so a fresh deck's first page logged as cards 41–50. The
 *      cards were right; only the recorded depth was wrong, which corrupts the
 *      one number the impression log exists for.
 *
 *   2. Settings derived "is location on" from `locationSource`, which is
 *      truthy for a STALE reading. A location ignored by ranking for 94 days
 *      displayed as "On", with a "Turn off" button for something already off.
 *
 * Both passed every existing suite. The rule they share: assert the value is
 * CORRECT, never merely that nothing threw.
 *
 * ── THE TESTING TRAPS THIS FILE ALSO STEERS AROUND ──────────────────────────
 * Three of these assertions failed first for reasons that had nothing to do with
 * the code under test, and all three would have looked like real failures:
 *
 *   • ObjectIds do not `===` strings. Card ids arrive from JSON as strings, so
 *     `ids.includes(card._id)` is ALWAYS false, and "the archived card was
 *     excluded" fails while the card is in fact on the page.
 *   • `pass` is deliberately NOT an exclusion. Only archive/letter/telegram
 *     remove someone from the deck; asserting otherwise tests the wrong thing.
 *   • Deleting a session does not delete its impressions. Wiping one and then
 *     asserting on all rows mixes two sessions and looks like a position bug.
 *
 * The server writes impressions fire-and-forget, so every read waits for the
 * write to land before asserting.
 */

import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SERVER_DIR = path.resolve(HERE, '..');
const REPO_DIR = path.resolve(SERVER_DIR, '..');
const API = process.env.API_ORIGIN || 'http://127.0.0.1:5005';
const VIEWER_EMAIL = process.env.VIEWER_EMAIL || 'nigga@iitb.ac.in';
const MARK = 'zz_verify_';

const env = Object.fromEntries(
  fs.readFileSync(path.join(SERVER_DIR, '.env'), 'utf8')
    .split('\n').filter(Boolean)
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1)]; }),
);

let pass = 0; let fail = 0;
const ok = (label, cond) => {
  if (cond) { pass += 1; console.log(`  PASS ${label}`); }
  else { fail += 1; console.log(`  FAIL ${label}`); }
};
const section = (t) => console.log(`\n── ${t} ──`);
/* Impressions are written without awaiting, so a read can race the write. */
const settle = () => new Promise((r) => setTimeout(r, 700));

await mongoose.connect(env.MONGODB_URI);
const db = mongoose.connection.db;

const viewer = await db.collection('users').findOne({ email: VIEWER_EMAIL });
if (!viewer) {
  console.error(`No viewer with email ${VIEWER_EMAIL}. Set VIEWER_EMAIL and retry.`);
  await mongoose.disconnect();
  process.exit(1);
}
const token = jwt.sign({ id: viewer._id }, env.JWT_SECRET, { expiresIn: '1h' });
const auth = { Cookie: `matchalize_jwt=${token}` };

const deck = async (served = 0) =>
  (await fetch(`${API}/api/discover?limit=10&served=${served}`, { headers: auth })).json();
const wipeDeck = async () => {
  await db.collection('discoversessions').deleteMany({ viewerId: viewer._id });
  await db.collection('deckimpressions').deleteMany({ viewerId: viewer._id });
};
const positions = async () =>
  (await db.collection('deckimpressions').find({ viewerId: viewer._id })
    .sort({ deckPosition: 1 }).toArray()).map((r) => r.deckPosition);
const resetViewerLocation = async () => {
  await db.collection('users').updateOne(
    { _id: viewer._id },
    { $unset: { currentLatLng: 1 }, $set: { locationSource: null, locationUpdatedAt: null } },
  );
};

const CANDIDATE = {
  gender: 'Male',
  interestedIn: ['Everyone'],
  college: 'Indian Institute of Technology Bombay',
  collegeCode: 'iitb',
  isVerified: true,
  isOnboarded: true,
  photos: ['a', 'b', 'c', 'd'],
  prompts: ['p', 'p', 'p'],
  bio: 'a long enough bio here',
  profileScore: 90,
  intent: ['Dating'],
};

await db.collection('users').deleteMany({ email: { $regex: `^${MARK}` } });
await db.collection('users').insertMany(
  Array.from({ length: 120 }, (_, i) => ({
    ...CANDIDATE,
    email: `${MARK}${i}@x.com`,
    name: `V${String(i).padStart(3, '0')}`,
    lastActive: new Date(Date.now() - i * 60_000),
  })),
);

try {
  /* ═══ 1. IMPRESSION POSITIONS ═══════════════════════════════════════════ */
  section('impression positions are server-owned');

  await wipeDeck();
  let d = await deck(0); await settle();
  let p = await positions();
  ok('page 1 logs positions 0–9', p.length === 10 && p[0] === 0 && p[9] === 9);
  ok('response `served` is 10', d.served === 10);

  d = await deck(d.served); await settle();
  p = await positions();
  ok('page 2 logs positions 10–19', p[10] === 10 && p[19] === 19);

  /* The actual bug: the client lies about its count. */
  d = await deck(9999); await settle();
  p = await positions();
  ok('a lying ?served=9999 cannot corrupt positions', p[20] === 20);
  ok('response `served` stays server-truth (30)', d.served === 30);
  ok('session.cardsServed is 30',
    (await db.collection('discoversessions').findOne({ viewerId: viewer._id })).cardsServed === 30);

  /* The real-world path: travelled, session discarded, client's stale total reused. */
  await wipeDeck();
  await deck(0); await deck(0); await deck(0); await settle();
  await db.collection('discoversessions').deleteMany({ viewerId: viewer._id });
  await db.collection('deckimpressions').deleteMany({ viewerId: viewer._id });
  const rebuilt = await deck(9999); await settle();
  p = await positions();
  ok('after a rebuild the log restarts at 0', p.length === 10 && p[0] === 0 && p[9] === 9);
  ok('and `served` restarts at 10', rebuilt.served === 10);
  ok('cards really are the new deck, from the top', rebuilt.users.length === 10);

  /* ═══ 2. EXCLUSIONS MUST NOT INFLATE THE COUNT ═══════════════════════════ */
  section('cards served counts cards, not scanned ids');

  await db.collection('interactions').deleteMany({});
  await wipeDeck();
  const target = await db.collection('users').findOne({ email: { $regex: `^${MARK}` } });
  await db.collection('interactions').insertOne({
    /* Both ids as real ObjectIds — a string targetId matches nothing. */
    actorId: viewer._id,
    targetId: target._id,
    actionType: 'archive',
    origin: 'archive',
    createdAt: new Date(),
  });
  await wipeDeck();
  d = await deck(0); await settle();
  const session = await db.collection('discoversessions').findOne({ viewerId: viewer._id });
  const logged = await db.collection('deckimpressions').countDocuments({ viewerId: viewer._id });
  ok('served equals the cards actually returned', session.cardsServed === d.users.length);
  ok('and equals the number of impressions written', d.users.length === logged);
  ok('the archived card is excluded',
    !d.users.some((u) => String(u._id) === String(target._id)));

  /* ═══ 3. THE DECK STILL BEHAVES ══════════════════════════════════════════ */
  section('deck integrity unchanged');

  await db.collection('interactions').deleteMany({});
  await wipeDeck();
  let served = 0; const seen = []; let page = await deck(0); let guard = 0;
  while (page.users.length && guard < 60) {
    seen.push(...page.users.map((u) => String(u._id)));
    served = page.served;
    if (page.deckExhausted) break;
    page = await deck(served); guard += 1;
  }
  /* ⚠️ MUST count what the SERVER counts, not "everyone on the platform".

     This assertion compared the drained deck against every onboarded user, which
     silently included people the mutual-interest filter is designed to hide —
     the viewer's own gender, and anyone not interested in the viewer's gender.
     It read as "the deck dropped 369 people" when the deck had in fact served
     every person it was ever allowed to serve. Mirrors the three filters the
     route applies: gender the viewer wants, mutual preference, exclusions. */
  const myGenders = (viewer.interestedIn || []).filter((g) => g !== 'Everyone');
  const eligible = await db.collection('users').countDocuments({
    _id: { $ne: viewer._id },
    isOnboarded: true, isVerified: true,
    shadowbannedAt: null, isDeleted: { $ne: true }, suspended: { $ne: true },
    ...(myGenders.length ? { gender: { $in: myGenders } } : {}),
    ...(viewer.gender ? {
      $or: [
        { interestedIn: { $in: [viewer.gender, 'Everyone'] } },
        { interestedIn: { $size: 0 } },
        { interestedIn: { $exists: false } },
      ],
    } : {}),
  });
  ok('deck is zero-repeat across the drain', new Set(seen).size === seen.length);
  ok(`every ELIGIBLE person seen exactly once (${seen.length}/${eligible})`,
    seen.length === eligible && new Set(seen).size === eligible);

  /* ═══ 4. DISTANCE PREFERENCE REPORTING ═══════════════════════════════════ */
  section('distance preference reports honestly');

  const GET = async () =>
    (await fetch(`${API}/api/users/location`, { headers: auth })).json();
  const PUT = (body) => fetch(`${API}/api/users/location`, {
    method: 'PUT',
    headers: { ...auth, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  await resetViewerLocation();
  let r = await GET();
  ok('nothing stored reports the campus choice (null)', r.locationSource === null);
  ok('and is not "active"', r.active === false);

  await PUT({ latLng: [19.08, 72.88], source: 'gps' });
  r = await GET();
  ok('a fresh reading round-trips as gps', r.locationSource === 'gps');
  ok('fresh means active, 0 days old', r.active === true && r.storedDaysAgo === 0);

  /* The Bug 1 case, in full. */
  await db.collection('users').updateOne(
    { _id: viewer._id },
    { $set: { locationUpdatedAt: new Date(Date.now() - 94 * 86_400_000) } },
  );
  r = await GET();
  ok('a 94-day-old reading still reports source=gps', r.locationSource === 'gps');
  ok('but active is FALSE — Settings reads this, not source', r.active === false);
  ok('storedDaysAgo surfaces the age so the UI can say so', r.storedDaysAgo === 94);

  await PUT({ latLng: null });
  r = await GET();
  ok('choosing campus clears the source', r.locationSource === null);
  ok('and genuinely deletes the stored coordinates',
    await db.collection('users').countDocuments({ _id: viewer._id, currentLatLng: { $exists: true } }) === 0);

  await PUT({ source: 'campus' });
  r = await GET();
  ok('an explicit campus marker round-trips', r.locationSource === 'campus');
  ok('campus stores no coordinates',
    await db.collection('users').countDocuments({ _id: viewer._id, currentLatLng: { $exists: true } }) === 0);
  ok('campus is not "active"', r.active === false);

  /* Campus-as-base must still rank, which is the reason the option exists. */
  await resetViewerLocation();
  await db.collection('users').updateOne(
    { _id: viewer._id },
    { $set: { locationSource: 'campus', locationUpdatedAt: new Date() } },
  );
  await wipeDeck();
  d = await deck(0);
  /* ⚠️ A missing label is NOT a missing band.

     `_bandIndex` is 0–3 for every card whenever the viewer has a point, but
     band 3 deliberately renders NOTHING: labelling every distant stranger
     "Elsewhere in India" is noise, and the college badge already says it. So
     asserting `every(u => u.distanceBand !== undefined)` was asserting that
     every card is within 300km — which fails for any viewer whose campus has no
     neighbour college nearby. With 21 campuses spread across India, that is
     almost everyone: the seeded data puts 249 of 260 eligible people in band 3.

     The correct check is that the BAND is computed and ordered, which is
     observable as: some cards carry a label, and every labelled card is nearer
     than every unlabelled one. A deck with zero labels AND a viewer whose campus
     has close neighbours would be the real failure. */
  /* The right check is simply: are there labelled cards? A viewer whose campus has
     close neighbours MUST produce labels, so "zero labels across a full page" is
     the real failure signal. Band order within the page is deliberately NOT
     asserted — the own-college share and the cold-start reserve both STEP
     reserved cards through the window rather than front-loading them, so a 0km
     card legitimately appears at position 1 with a 500km card at position 0. */
  const labelled = d.users.filter((u) => u.distanceBand !== undefined);
  ok('distance bands still work with no GPS at all',
    d.users.length > 0 && labelled.length > 0);
  ok('a label means a named band, never raw kilometres',
    labelled.every((u) => typeof u.distanceBand === 'string' && !/\d/.test(u.distanceBand)));
  ok('and no coordinates leak into the deck',
    d.users.every((u) => !('currentLatLng' in u) && !('latLng' in u)));
} finally {
  await db.collection('users').deleteMany({ email: { $regex: `^${MARK}` } });
  await db.collection('interactions').deleteMany({});
  await wipeDeck();
  await resetViewerLocation();
  await db.collection('users').updateOne({ _id: viewer._id }, { $set: { intent: ['Dating'] } });
  await mongoose.disconnect();
}

console.log(`\n${fail === 0 ? 'ALL PASS' : 'FAILURES'} — ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
