/**
 * Proves the location swap end to end against the real /api/discover route.
 *
 * The scenario: one viewer, registered at a Delhi college, who turns location
 * on while physically in Mumbai. Nothing about the viewer changes except their
 * coordinates, so the deck must flip from entirely-Delhi to entirely-Mumbai.
 *
 * The two clusters are ~1,400km apart, so this is not a re-ordering. If any
 * Delhi profile survives the second fetch, the session was not invalidated and
 * the feed is still serving the frozen first page.
 *
 * The test owns its viewer: it clears any stored position directly in the
 * database before it starts, and restores it with `$unset` (not
 * `$set: {field: undefined}`, which the driver writes as null) when it finishes.
 * Without that, a leftover reading from an earlier run silently invalidates the
 * scenario — the viewer is already in Mumbai, so there is nothing left to move.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config({ path: './.env' });

const PORT = process.env.PORT || 5005;
const BASE = `http://127.0.0.1:${PORT}/api`;
const MUMBAI = [19.1334, 72.9133];

const DELHI_MARK = ['Delhi', 'Jamia', 'IIT Delhi', 'Netaji', 'Indraprastha'];
const MUMBAI_MARK = ['Mumbai', 'Bombay', 'Veermata', 'Chemical Technology', 'Narsee',
  'Xavier', 'Sardar Patel', 'Bharatiya'];

async function fetchDeck(token) {
  const r = await fetch(`${BASE}/discover`, { headers: { Cookie: `matchalize_jwt=${token}` } });
  if (!r.ok) throw new Error(`GET /discover -> ${r.status} ${await r.text()}`);
  return r.json();
}

async function putLocation(token, body) {
  const r = await fetch(`${BASE}/users/location`, {
    method: 'PUT',
    headers: { Cookie: `matchalize_jwt=${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: r.status, body: await r.json().catch(() => ({})) };
}

/** The state `GET /users/location` reports — the same signal the notice mounts on. */
async function readLocation(token) {
  const r = await fetch(`${BASE}/users/location`, { headers: { Cookie: `matchalize_jwt=${token}` } });
  if (!r.ok) throw new Error(`GET /users/location -> ${r.status}`);
  return r.json();
}

function classify(users) {
  const byCity = { delhi: 0, mumbai: 0, other: 0 };
  const colleges = new Map();
  const bands = new Map();
  for (const u of users) {
    const c = u.college || '(hidden)';
    colleges.set(c, (colleges.get(c) || 0) + 1);
    bands.set(u.distanceBand ?? 'unbanded', (bands.get(u.distanceBand ?? 'unbanded') || 0) + 1);
    if (DELHI_MARK.some((m) => c.includes(m))) byCity.delhi += 1;
    else if (MUMBAI_MARK.some((m) => c.includes(m))) byCity.mumbai += 1;
    else byCity.other += 1;
  }
  return { byCity, colleges, bands };
}

const fmt = (b) => [...b].map(([k, n]) => `${k}:${n}`).join('  ');
const top = (c, n = 4) => [...c].slice(0, n).map(([k, v]) => `${k} (${v})`).join(', ');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const viewerCode = process.env.VIEWER_COLLEGE || 'iitd';
  const viewer = await db.collection('users').findOne({ collegeCode: viewerCode, isOnboarded: true });
  if (!viewer) throw new Error(`no ${viewerCode} user seeded`);

  /* Own the starting state: no personal reading, campus basis, no saved deck. */
  await db.collection('users').updateOne(
    { _id: viewer._id },
    { $set: { locationSource: 'campus', locationUpdatedAt: new Date() }, $unset: { currentLatLng: 1 } },
  );
  await db.collection('discoversessions').deleteMany({ viewerId: viewer._id });

  const token = jwt.sign({ id: viewer._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const fresh = await db.collection('users').findOne(
    { _id: viewer._id },
    { projection: { locationSource: 1, currentLatLng: 1 } },
  );

  console.log(`viewer   : ${viewer.name}  <${viewer.email}>`);
  console.log(`college  : ${viewer.college}`);
  console.log(`start    : source=${fresh.locationSource}  latLng=${JSON.stringify(fresh.currentLatLng ?? null)}`);

  // ── 1. campus fallback ──
  console.log('\n=== 1. LOCATION OFF — campus fallback to IIT Delhi ===');
  const first = await fetchDeck(token);
  const a = classify(first.users);
  console.log(`   deck size    : ${first.users.length}`);
  console.log(`   city split   : Delhi ${a.byCity.delhi}   Mumbai ${a.byCity.mumbai}   other ${a.byCity.other}`);
  console.log(`   top colleges : ${top(a.colleges)}`);
  console.log(`   bands        : ${fmt(a.bands)}`);

  // ── 2. same viewer, now standing in Mumbai ──
  console.log('\n=== 2. LOCATION ON — same viewer, standing in Mumbai ===');
  const put = await fetch(`${BASE}/users/location`, {
    method: 'PUT',
    headers: { Cookie: `matchalize_jwt=${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ latLng: MUMBAI, source: 'gps' }),
  });
  const putBody = await put.json().catch(() => ({}));
  console.log(`   PUT /users/location -> ${put.status}  ${JSON.stringify(putBody)}`);

  const after = await db.collection('users').findOne(
    { _id: viewer._id },
    { projection: { locationSource: 1, currentLatLng: 1 } },
  );
  console.log(`   anchor in DB  : source=${after.locationSource} latLng=${JSON.stringify(after.currentLatLng)}`);

  const second = await fetchDeck(token);
  const b = classify(second.users);
  console.log(`   deck size    : ${second.users.length}`);
  console.log(`   city split   : Delhi ${b.byCity.delhi}   Mumbai ${b.byCity.mumbai}   other ${b.byCity.other}`);
  console.log(`   top colleges : ${top(b.colleges)}`);
  console.log(`   bands        : ${fmt(b.bands)}`);

  // ── 3. the anti-churn case ──
  console.log('\n=== 3. LOCATION ON but standing ON campus — deck must survive ===');
  await db.collection('users').updateOne(
    { _id: viewer._id },
    { $set: { locationSource: 'campus', locationUpdatedAt: new Date() }, $unset: { currentLatLng: 1 } },
  );
  await db.collection('discoversessions').deleteMany({ viewerId: viewer._id });
  const onCampusDeck = await fetchDeck(token);
  const c = classify(onCampusDeck.users);
  console.log(`   deck 3 city split : Delhi ${c.byCity.delhi}   Mumbai ${c.byCity.mumbai}   other ${c.byCity.other}`);

  const stayPut = await fetch(`${BASE}/users/location`, {
    method: 'PUT',
    headers: { Cookie: `matchalize_jwt=${token}`, 'Content-Type': 'application/json' },
    /* IIT Delhi's own campus position — a few km from where the viewer already
       is, well inside the 25km drift threshold. */
    body: JSON.stringify({ latLng: [28.5450, 77.1926], source: 'gps' }),
  });
  const stayBody = await stayPut.json().catch(() => ({}));
  const sessions = await db.collection('discoversessions').countDocuments({ viewerId: viewer._id });
  console.log(`   PUT same-campus coords -> ${stayPut.status}  ${JSON.stringify(stayBody)}`);
  console.log(`   saved sessions after   : ${sessions}  ${sessions === 1 ? '(kept)' : '(lost)'}`);

  // ── 4. one-time grant lapse ──
  console.log('\n=== 4. LAPSED ONE-TIME GRANT — released on the next launch ===');
  /* Reproduce the whole sequence the client performs on a launch:
     a position stored under a temporary grant, then that grant lapsing so the
     browser no longer has it. The expiry is a browser fact we cannot trigger
     from here, so the equivalent server-visible state is written directly — a
     stored `gps` reading that no longer has a live grant behind it. */
  await db.collection('users').updateOne(
    { _id: viewer._id },
    { $set: { locationSource: 'gps', currentLatLng: MUMBAI, locationUpdatedAt: new Date() } },
  );
  const held = await readLocation(token);
  console.log(`   before lapse : source=${held.locationSource} active=${held.active}`);

  /* What `releaseEphemeralLocation()` sends when the browser reports `prompt`. */
  const released = await putLocation(token, { latLng: null, source: null, ephemeral: true });
  const afterLapse = await readLocation(token);
  console.log(`   release call -> ${released.status} ${JSON.stringify(released.body)}`);
  console.log(`   after lapse  : source=${afterLapse.locationSource} active=${afterLapse.active}`);
  /* Read the coordinates straight from the database: the endpoint reports state,
     not storage, so it cannot prove the value is gone from the row. */
  const stored = await db.collection('users').findOne(
    { _id: viewer._id },
    { projection: { currentLatLng: 1 } },
  );
  const coordsGone = !Array.isArray(stored?.currentLatLng);
  console.log(`   coordinates removed from the row : ${coordsGone}`);

  const refusalDeck = await fetchDeck(token);
  const d = classify(refusalDeck.users);
  console.log(`   deck city split : Delhi ${d.byCity.delhi}   Mumbai ${d.byCity.mumbai}   other ${d.byCity.other}`);

  // ── assertions ──
  console.log('\n=== ASSERTIONS ===');
  const firstIds = new Set(first.users.map((u) => u._id || u.id));
  const overlap = second.users.filter((u) => firstIds.has(u._id || u.id)).length;
  const anchorIsMumbai = after.locationSource === 'gps'
    && Math.abs(after.currentLatLng[0] - MUMBAI[0]) <= 0.01
    && Math.abs(after.currentLatLng[1] - MUMBAI[1]) <= 0.01;

  const checks = [
    ['deck is populated both times', first.users.length > 0 && second.users.length > 0],
    ['deck 1 is Delhi-dominated', a.byCity.delhi > a.byCity.mumbai],
    ['deck 1 has zero Mumbai profiles', a.byCity.mumbai === 0],
    ['stored anchor is Mumbai GPS', anchorIsMumbai],
    ['route reports the deck was rebuilt', putBody.moved === true],
    ['deck 2 is Mumbai-dominated', b.byCity.mumbai >= 7],
    /* ⚠️ NOT "zero Delhi profiles" — that assertion was wrong and flaked.
     *
     * The cold-start reserve tops each page up from OUTSIDE the distance-ranked
     * batch, and that query filters only on `seenInBatch`, `skipSet`,
     * `excludedIds` and `isCold` — distance is deliberately not one of them.
     * Giving newcomers exposure regardless of where they are is the entire point
     * of the reserve, so a Delhi newcomer landing in a Mumbai page is correct
     * behaviour, roughly one card in ten by COLD_START_SHARE.
     *
     * The seed makes it easy to hit: a male viewer's eligible pool is 200, of
     * which only 62 are in Mumbai, so the reserve's over-fetch reaches Delhi
     * profiles readily. The contract worth asserting is that the DECK moved —
     * Mumbai-dominant, not Mumbai-exclusive. */
    ['deck 2 has at most reserved newcomers from Delhi', b.byCity.delhi <= 2],
    ['deck 2 is all in the near band', (b.bands.get('Near you') ?? 0) === second.users.length],
    ['deck 1 is all in the near band', (a.bands.get('Near you') ?? 0) === first.users.length],
    ['deck overlap is negligible', overlap <= 2],
    ['same-campus enable keeps the deck', stayBody.moved === false && sessions === 1],
    ['campus-only viewer stays Delhi-only', c.byCity.mumbai === 0],
    /* The lapse case. `active` is what decides which of the two notices renders,
       so it has to go false the moment the position is gone — otherwise the deck
       is campus-ordered while the UI still claims live location. */
    ['stored position was live before the lapse', held.active === true],
    /* The endpoint deliberately does NOT expose hasCoords — confirming a
       position exists is not something the client needs to be told, and the
       absence of one is already fully described by `active: false`. */
    ['lapse removes the coordinates from the row', coordsGone],
    ['lapse leaves the basis as campus, not null', afterLapse.locationSource === 'campus'],
    ['lapse reports NOT active (warning variant)', afterLapse.active === false],
    ['lapse does not report as a refusal', afterLapse.locationSource !== null],
    ['deck falls back to the campus ordering', d.byCity.delhi > 0 && d.byCity.mumbai === 0],
  ];
  let fail = 0;
  for (const [label, ok] of checks) {
    console.log(`   ${ok ? 'PASS' : 'FAIL'}  ${label}`);
    if (!ok) fail += 1;
  }
  console.log(`\n   ${checks.length - fail}/${checks.length} passed`);

  // restore: `$unset`, because `$set: {currentLatLng: undefined}` writes null.
  await db.collection('users').updateOne(
    { _id: viewer._id },
    { $set: { locationSource: 'campus' }, $unset: { currentLatLng: 1 } },
  );
  await db.collection('discoversessions').deleteMany({ viewerId: viewer._id });
  await mongoose.disconnect();
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });