# Chunk 20 — Server Core

> Matchalize · `server-core` · files 20 of 28 chunks · 11 file(s) · 98 KB · ~28,614 tokens
> Generated 2026-10-18 20:29.
> Paste-safe: within the 100 KB / ~29,257 token target.
>
> Contains:
> - `./server/scripts/verify-location-swap.mjs`
> - `./server/seedRealistic.js`
> - `./server/socket/chat.js`
> - `./server/socket/rouletteSignaling.js`
> - `./server/utils/AppError.js`
> - `./server/utils/campusGate.js`
> - `./server/utils/campusSeed.js`
> - `./server/utils/email.js`
> - `./server/utils/media.js`
> - `./server/utils/moderationLedger.js`
> - `./server/utils/otpHash.js`

---
### ./server/scripts/verify-location-swap.mjs

```
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
```

### ./server/seedRealistic.js

```
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import College from './models/College.js';
import { computeScore } from './utils/ladder.js';

dotenv.config({ path: './.env' });

/**
 * 🛑 FAKE DATA IS NOT PRODUCTION DATA.
 *
 * This script generates invented people — names, photos from a stock image
 * service, bios, prompts — and DELETES every real user and college before doing
 * it. It is a local development convenience and nothing else.
 *
 * The guard below is deliberately at the very top and deliberately fatal. The
 * failure this prevents is not subtle: `deleteMany({})` runs against whatever
 * `MONGODB_URI` points at, so one `npm run seed` typed against a copied Atlas
 * string replaces a real cohort with imaginary students who will happily match
 * with, message, and report each other.
 *
 * Two independent conditions, so this cannot be undone by accident:
 *   1. NODE_ENV must not be 'production'.
 *   2. --allow-fake-data must be passed explicitly.
 *
 * Condition 2 exists because NODE_ENV is often unset in a local shell (it is
 * set in server/.env, which this script loads, but not in every environment
 * that can reach this file), and "unset" must not read as "fine".
 */
if (process.env.NODE_ENV === 'production') {
  console.error(
    '\n🛑 REFUSING TO RUN. NODE_ENV=production.\n\n' +
    '   This script deletes all users and colleges, then fills the database\n' +
    '   with invented profiles and stock photos. That is local development\n' +
    '   data. If it reached a deployed database, real students would be\n' +
    '   matching and messaging people who do not exist.\n\n' +
    '   If you genuinely need to reseed production, that is a decision that\n' +
    '   should not be made by a stray `npm run seed`.\n',
  );
  process.exit(1);
}

if (!process.argv.includes('--allow-fake-data')) {
  console.error(
    '\n🛑 REFUSING TO RUN without --allow-fake-data.\n\n' +
    '   This script DELETES every user and college in MONGODB_URI, then seeds\n' +
    '   invented profiles with stock photos.\n\n' +
    '   Check the database it is about to touch before agreeing:\n' +
    '     node server/seedRealistic.js --allow-fake-data\n',
  );
  process.exit(1);
}

/**
 * SEED — realistic population across three tiers.
 *
 * ── WHY THE CODES ARE LOWERCASE ──
 * `College.code` has `lowercase: true`, so Mongoose lowercases it on write. An
 * earlier seeder wrote `IITB` into `User.collegeCode`, and the discover
 * pipeline joins on `collegeCode -> College.code`. `'IITB' !== 'iitb'`, so the
 * $lookup missed for 600 of 602 users: `$_c` came back empty, `_lat1/_lng1`
 * fell through to the (0,0) placeholder in the Gulf of Guinea, every candidate
 * landed in band 3 at 0.1x, and distance ranking was silently meaningless for
 * the entire seeded population.
 *
 * That is why `collegeCode` is derived from `College.code` below and never
 * typed by hand. Every user row is `c.code.toLowerCase()`.
 *
 * ── WHY FULL OFFICIAL NAMES ──
 * `College` has ONE `name` field and no short-name field anywhere, so an
 * abbreviation in the data is the only name that can ever be displayed — on the
 * card, in search results, and in the location notice ("Sorted according to
 * <name>"). "SPIT Andheri" is therefore not a cosmetic choice; it is the whole
 * string users would see.
 */

const CLUSTERS = {
  delhi: {
    label: 'Delhi',
    colleges: [
      ['iitd', 'Indian Institute of Technology Delhi', 28.5450, 77.1926, 'iitd.ac.in', 'New Delhi', 'Delhi'],
      ['dtu', 'Delhi Technological University', 28.5614, 77.2731, 'dtu.ac.in', 'Delhi', 'Delhi'],
      ['dtu-rohini', 'Delhi Technological University, Rohini Campus', 28.7412, 77.1376, 'dtu.ac.in', 'Rohini', 'Delhi'],
      ['nsut', 'Netaji Subhas University of Technology', 28.5480, 77.2730, 'nsut.ac.in', 'Delhi', 'Delhi'],
      ['ip', 'Indraprastha College of Engineering and Technology', 28.5455, 77.2725, 'ip.ac.in', 'Delhi', 'Delhi'],
      ['jmi', 'Jamia Millia Islamia', 28.5614, 77.2916, 'jmi.ac.in', 'Delhi', 'Delhi'],
    ],
  },
  mumbai: {
    label: 'Mumbai',
    colleges: [
      ['iitb', 'Indian Institute of Technology Bombay', 19.1334, 72.9133, 'iitb.ac.in', 'Mumbai', 'Maharashtra'],
      ['spit', 'Sardar Patel Institute of Technology', 19.1196, 72.8464, 'spit.ac.in', 'Andheri West', 'Maharashtra'],
      ['bvcoe', 'Bharatiya Vidya Bhavans College of Engineering', 19.1196, 72.8464, 'bvu.ac.in', 'Andheri West', 'Maharashtra'],
      ['nmims', 'Narsee Monjee Institute of Management Studies', 19.1000, 72.8400, 'nmims.edu', 'Vile Parle West', 'Maharashtra'],
      ['vjti', 'Veermata Jijabai Technological Institute', 19.0222, 72.8561, 'vjti.ac.in', 'Matunga', 'Maharashtra'],
      ['ict', 'Institute of Chemical Technology, Mumbai', 19.0235, 72.8357, 'ictmumbai.edu.in', 'Matunga', 'Maharashtra'],
      ['xavier', 'Saint Xavier College, Mumbai', 18.9430, 72.8315, 'xavier.ac.in', 'Mumbai', 'Maharashtra'],
      ['univ-mumbai', 'University of Mumbai', 18.9647, 72.8106, 'mumbai.ac.in', 'Mumbai', 'Maharashtra'],
    ],
  },
  /* Near Mumbai but outside 30km, so band 2 and band 3 are genuinely exercised
     rather than every non-local candidate sitting in band 4. */
  pune: {
    label: 'Pune / Nashik',
    colleges: [
      ['coep', 'College of Engineering, Pune', 18.5293, 73.8565, 'coeptech.ac.in', 'Pune', 'Maharashtra'],
      ['pict', 'Pune Institute of Chemical Technology', 18.4575, 73.8508, 'pict.edu', 'Pune', 'Maharashtra'],
      ['sit-lon', 'Sinhgad Institute of Technology and Management, Lonavala', 18.7516, 73.4286, 'sit.ac.in', 'Lonavala', 'Maharashtra'],
      ['kkwagh', 'K. K. Wagh Institute of Engineering and Technology', 20.0117, 73.8236, 'kkwagh.edu.in', 'Nashik', 'Maharashtra'],
    ],
  },
  nationwide: {
    label: 'Nationwide',
    colleges: [
      ['iitkp', 'Indian Institute of Technology Kharagpur', 22.3197, 87.3100, 'iitkgp.ac.in', 'Kharagpur', 'West Bengal'],
      ['iitm', 'Indian Institute of Technology Madras', 12.9915, 80.2336, 'iitm.ac.in', 'Chennai', 'Tamil Nadu'],
      ['iitk', 'Indian Institute of Technology Kanpur', 26.5114, 80.2349, 'iitk.ac.in', 'Kanpur', 'Uttar Pradesh'],
      ['iitg', 'Indian Institute of Technology Guwahati', 26.1872, 91.6917, 'iitg.ac.in', 'Guwahati', 'Assam'],
      ['iitr', 'Indian Institute of Technology Roorkee', 29.8644, 77.8964, 'iitr.ac.in', 'Roorkee', 'Uttarakhand'],
      ['iiith', 'Indian Institute of Technology Hyderabad', 17.4928, 78.1378, 'iith.ac.in', 'Hyderabad', 'Telangana'],
      ['iitgn', 'Indian Institute of Technology Gandhinagar', 23.2114, 72.6821, 'iitgn.ac.in', 'Gandhinagar', 'Gujarat'],
      ['iiti', 'Indian Institute of Technology Indore', 22.5279, 75.9236, 'iiti.ac.in', 'Indore', 'Madhya Pradesh'],
      ['iitj', 'Indian Institute of Technology Jodhpur', 26.4750, 73.1150, 'iitj.ac.in', 'Jodhpur', 'Rajasthan'],
      ['iitmandi', 'Indian Institute of Technology Mandi', 31.7717, 76.9836, 'iitmandi.ac.in', 'Mandi', 'Himachal Pradesh'],
      ['iitp', 'Indian Institute of Technology Patna', 25.5325, 84.8517, 'iitp.ac.in', 'Patna', 'Bihar'],
      ['iitrp', 'Indian Institute of Technology Ropar', 30.9716, 76.4732, 'iitrpr.ac.in', 'Ropar', 'Punjab'],
      ['iitbbs', 'Indian Institute of Technology Bhubaneswar', 20.3030, 85.8240, 'iitbbs.ac.in', 'Bhubaneswar', 'Odisha'],
      ['iittp', 'Indian Institute of Technology Tirupati', 13.7144, 79.5953, 'iittp.ac.in', 'Tirupati', 'Andhra Pradesh'],
      ['iitpk', 'Indian Institute of Technology Palakkad', 10.7939, 76.8267, 'iitpkd.ac.in', 'Palakkad', 'Kerala'],
      ['iitdh', 'Indian Institute of Technology Dharwad', 15.4874, 74.9345, 'iitdh.ac.in', 'Dharwad', 'Karnataka'],
      ['iitbh', 'Indian Institute of Technology Bhilai', 21.2446, 81.3182, 'iitbh.ac.in', 'Bhilai', 'Chhattisgarh'],
      ['iitgoa', 'Indian Institute of Technology Goa', 15.4230, 73.9800, 'iitgoa.ac.in', 'Goa', 'Goa'],
      ['iitjammu', 'Indian Institute of Technology Jammu', 32.8037, 74.8959, 'iitjammu.ac.in', 'Jammu', 'Jammu and Kashmir'],
      ['vnit', 'Visvesvaraya National Institute of Technology, Nagpur', 21.1233, 79.0515, 'vnit.ac.in', 'Nagpur', 'Maharashtra'],
      /* No coordinates on purpose. Exercises the un-positioned-campus path: it
         must render band 3 with no label rather than throwing the aggregation
         down, which is what took the whole deck offline once. */
      ['ghost', 'Institute of Emerging District Technologies', null, null, 'iedt.ac.in', 'Gandhinagar', 'Gujarat'],
    ],
  },
};

const ALL = Object.values(CLUSTERS).flatMap((c) => c.colleges);

const POPULATION = {
  delhi: 400,
  mumbai: 400,
  nationwide: 400,
};

const INTENTS = ['Dating', 'Friends', 'Activity Partner'];
const FIRST_M = ['Aarav', 'Aditya', 'Arjun', 'Devansh', 'Ishaan', 'Kabir', 'Krish', 'Neel', 'Rohan', 'Shaan', 'Ved', 'Yash', 'Ayaan', 'Dhruv', 'Kian', 'Vihaan'];
const FIRST_F = ['Aanya', 'Diya', 'Ira', 'Kiara', 'Myra', 'Navya', 'Riya', 'Saisha', 'Tara', 'Zara', 'Anika', 'Kavya', 'Meera', 'Nitya', 'Prisha'];
const FIRST_NB = ['Alex', 'Avery', 'Casey', 'Jordan', 'Morgan', 'Riley', 'Sahil', 'Quinn'];
const LAST = ['Sharma', 'Verma', 'Gupta', 'Singh', 'Kumar', 'Patel', 'Reddy', 'Nair', 'Iyer', 'Joshi', 'Shah', 'Desai', 'Patil', 'Rao', 'Menon', 'Chowdhury'];
const BIOS = [
  'Coffee addict, sunset chaser.',
  'Late-night coder. Usually arguing with a compiler.',
  'Hiker, foodie, and dog person. Ask me trails.',
  'Bookworm. Tea over coffee, mostly.',
  'Travel junkie with a camera I do not know how to use.',
  'Gym rat. Protein shake connoisseur.',
  'Sarcasm fluent. Opinions available on request.',
  'Plant parent. Currently losing a war with a fern.',
  'Midnight thinker. Somehow functional in the morning.',
  'Gamer and part-time ramen critic.',
];
const PROMPTS = [
  ['Your ideal Sunday?', 'Sleeping till noon, then pancakes.'],
  ['Song on repeat?', 'Anything by Divine, honestly.'],
  ['Best travel memory?', 'Sunset at Marine Drive with bad chai.'],
  ['Go-to comfort food?', 'Butter chicken, no contest.'],
  ['A skill you want to learn?', 'Surfing. Still have not managed it.'],
  ['Morning person or night owl?', 'Night owl. Firmly.'],
  ['One thing you are good at?', 'Finding the one good seat in a lecture hall.'],
  ['Guilty pleasure show?', 'The Office. For the ninth time.'],
];
const PHOTOS_M = [
  'photo-1507003211169-0a1dd7228f2d', 'photo-1500648767791-00dcc994a43e',
  'photo-1472099645785-5658abf4ff4e', 'photo-1506794778202-cad84cf45f1d',
  'photo-1519085360753-af0119f7cbe7', 'photo-1531384441138-2736e62e0919',
];
const PHOTOS_F = [
  'photo-1494790108377-be9c29b29330', 'photo-1438761681033-6461ffad8d80',
  'photo-1534528741775-53994a69daeb', 'photo-1531746020798-e6953c6e8e04',
  'photo-1544005313-94ddf0286523', 'photo-1488426862026-3ee34a7d66df',
];
const PHOTOS_NB = [
  'photo-1535713875002-d1d0cf377fde', 'photo-1529665253569-6d01c0e87baf',
  'photo-1517841905240-472988babdf9', 'photo-1524504388940-b1c1722653e1',
];
const R2 = () => (Math.random() + Math.random()) / 2;

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const shuffle = (a) => a.map((v) => ({ v, k: Math.random() })).sort((x, y) => x.k - y.k).map((x) => x.v);
const sub = (a, n) => shuffle(a).slice(0, Math.max(0, n));
const uniq = (a) => [...new Set(a)];

/**
 * Gender split, scaled from the previous 600-user population (456 / 100 / 44)
 * up to 1,200 so the ratio holds: ~76.7% male, ~16.7% female, ~6.7% non-binary.
 *
 * The ratio is not cosmetic — `interestedIn` is derived from gender, so a skewed
 * population starves the mutual-Align path. A female-heavy pool matches far
 * fewer male viewers, and the match test then fails for reasons that look like
 * a bug in the Align logic.
 */
const GENDER_PLAN = [['Male', 920], ['Female', 200], ['Non-binary', 80]];
const GENDERS = (() => {
  const out = GENDER_PLAN.flatMap(([g, n]) => Array(n).fill(g));
  return shuffle(out);
})();

const photoPool = (g) => (g === 'Male' ? PHOTOS_M : g === 'Female' ? PHOTOS_F : PHOTOS_NB);

function buildUser(gender, college, i) {
  const first = gender === 'Male' ? pick(FIRST_M) : gender === 'Female' ? pick(FIRST_F) : pick(FIRST_NB);
  const name = `${first} ${pick(LAST)}`;
  const domain = college[4];

  /* Photo count drives the ladder score, which is what the newcomer reserve and
     the blended ranking both read. 15% get none so the reserve has something
     real to promote. */
  const pool = photoPool(gender);
  const photoRoll = R2();
  const photoCount = photoRoll < 0.15 ? 0 : photoRoll < 0.40 ? 1 : photoRoll < 0.75 ? 2 : 4;
  const photos = sub(pool, photoCount).map(
    (id) => `https://images.unsplash.com/${id}?w=600&auto=format&fit=crop&q=80`,
  );

  const promptCount = photoRoll < 0.30 ? 0 : photoRoll < 0.60 ? 1 : 3;
  const prompts = sub(PROMPTS, promptCount).map(([question, answer]) => ({ question, answer }));

  /* ── LOCATION ──
     40% fresh GPS, 30% stale GPS (past the 30-day TTL, so the candidate-side
     freshness gate falls through to college coordinates), 30% campus-only (no
     coordinates at all — exercises the fallback itself). */
  const locRoll = R2();
  let locationSource = 'campus';
  let currentLatLng = undefined;
  let locationUpdatedAt = null;

  if (college[2] !== null) {
    if (locRoll < 0.40) {
      currentLatLng = [
        college[2] + (Math.random() - 0.5) * 0.02,
        college[3] + (Math.random() - 0.5) * 0.02,
      ];
      locationSource = 'gps';
      locationUpdatedAt = new Date();
    } else if (locRoll < 0.70) {
      currentLatLng = [
        college[2] + (Math.random() - 0.5) * 0.02,
        college[3] + (Math.random() - 0.5) * 0.02,
      ];
      locationSource = 'gps';
      locationUpdatedAt = new Date(Date.now() - (45 + Math.floor(Math.random() * 45)) * 86400000);
    }
  }

  const user = {
    name,
    email: `${name.toLowerCase().replace(/\s+/g, '.')}.${1000 + i}@${domain}`,
    /* Display name, full official form. This is the string that reaches the
       card, the search result and the location notice. */
    college: college[1],
    /* Match key. From the roster, never hand-typed — see the file header. */
    collegeCode: college[0].toLowerCase(),
    gender,
    year: pick(['FE', 'SE', 'TE', 'BE']),
    intent: sub(INTENTS, 1 + Math.floor(R2() * 3)),
    interestedIn: gender === 'Male'
      ? (Math.random() < 0.7 ? ['Female'] : ['Female', 'Everyone'])
      : gender === 'Female'
        ? (Math.random() < 0.7 ? ['Male'] : ['Male', 'Everyone'])
        : ['Everyone'],
    photos,
    prompts,
    bio: Math.random() < 0.7 ? pick(BIOS) : '',
    isOnboarded: true,
    isVerified: true,
    isDeleted: false,
    suspended: false,
    showCollege: Math.random() < 0.92,
    locationSource,
    currentLatLng,
    locationUpdatedAt,
    lastActive: new Date(Date.now() - Math.floor(R2() * 90) * 86400000),
  };
  user.profileScore = computeScore(user);
  return user;
}

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is not set. Refusing to seed an unknown database.');
    console.error('   Set it in server/.env. NOTE: this script DELETES all users and colleges.');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  console.log('── Clearing ──');
  await User.deleteMany({});
  await College.deleteMany({});
  console.log('   users and colleges cleared');

  console.log('\n── Colleges ──');
  const roster = [];
  for (const cluster of Object.values(CLUSTERS)) {
    for (const c of cluster.colleges) {
      roster.push({
        code: c[0].toLowerCase(),
        name: c[1],
        domains: [c[4]],
        city: c[5],
        state: c[6],
        country: 'India',
        active: true,
        ...(c[2] !== null ? { latLng: [c[2], c[3]] } : {}),
      });
    }
  }
  await College.insertMany(roster);
  console.log(`   ${roster.length} colleges inserted (all codes lowercase)`);

  console.log('\n── Users ──');
  const users = [];
  let emailN = 0;
  for (const [key, count] of Object.entries(POPULATION)) {
    const colleges = CLUSTERS[key].colleges;
    for (let i = 0; i < count; i++) {
      /* Weighted so a handful of campuses carry the bulk and the rest stay
         small — that is what a real city looks like, and it is what makes the
         own-college cap observable. */
      const roll = Math.random();
      const college = roll < 0.30 ? colleges[0] : roll < 0.50 ? colleges[1] : pick(colleges);
      users.push(buildUser(GENDERS[users.length], college, emailN++));
    }
    console.log(`   ${String(count).padStart(4)}  ${CLUSTERS[key].label} (${colleges.length} colleges)`);
  }
  await User.insertMany(users);
  console.log(`   ${users.length} users inserted`);

  // ── verify ──
  const codes = await db.collection('colleges').distinct('code');
  const matched = await db.collection('users').countDocuments({ collegeCode: { $in: codes } });
  const scores = await db.collection('users').aggregate([
    { $bucket: { groupBy: '$profileScore', boundaries: [0, 45, 75, 100, 101], default: 'other', output: { n: { $sum: 1 } } } },
  ]).toArray();
  const loc = await db.collection('users').aggregate([
    {
      $group: {
        _id: {
          source: '$locationSource',
          fresh: { $gte: ['$locationUpdatedAt', new Date(Date.now() - 30 * 86400000)] },
        },
        n: { $sum: 1 },
      },
    },
  ]).toArray();
  const genders = await db.collection('users').aggregate([{ $group: { _id: '$gender', n: { $sum: 1 } } }]).toArray();

  console.log('\n── Verify ──');
  console.log(`   college lookup matches : ${matched}/${users.length}   ${matched === users.length ? 'PASS' : 'FAIL'}`);
  console.log(`   score bands            : ${scores.map((s) => `${s._id}:${s.n}`).join('  ')}`);
  console.log(`   location source        : ${loc.map((l) => `${l._id.source}${l._id.fresh ? ' fresh' : ' stale'}:${l.n}`).join('  ')}`);
  console.log(`   gender                 : ${genders.map((g) => `${g._id}:${g.n}`).join('  ')}`);

  const bad = await db.collection('users').aggregate([
    { $match: { college: { $regex: '^(IIT|SPIT|NMIMS|VJTI|PICT|KKWAGH|VNIT|XAVIER|COEP)' } } },
    { $count: 'n' },
  ]).toArray();
  console.log(`   abbreviated names      : ${bad[0]?.n ?? 0}   ${!bad.length ? 'PASS' : 'FAIL — check the roster'}`);

  await mongoose.disconnect();
  console.log('\n   done');
}

main().catch((e) => { console.error(e); process.exit(1); });
```

### ./server/socket/chat.js

```
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Alignment from '../models/Alignment.js';
import Message from '../models/Message.js';
import { areBlocked } from '../middleware/blockFilter.js';
import { APP_CONSTANTS } from '../config/appData.js';

const onlineUsers = new Map(); // userId -> Set<socketId>

// How often to re-check suspension/deletion status from the DB per connected socket.
const SUSPENSION_CHECK_INTERVAL = 60 * 1000;

const registerSafeSocketHandler = (socket, event, handler) => {
  socket.on(event, (...args) => {
    try {
      const result = handler(...args);
      if (result && typeof result.catch === 'function') {
        result.catch((error) => {
          console.error(`Socket ${event} handler error:`, error);
        });
      }
    } catch (error) {
      console.error(`Socket ${event} handler error:`, error);
    }
  });
};

/**
 * Parse a raw cookie header string into a { name: value } map.
 */
const parseCookies = (cookieHeader) => {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach((pair) => {
    const [name, ...rest] = pair.split('=');
    if (name) cookies[name.trim()] = rest.join('=').trim();
  });
  return cookies;
};

export const socketHandler = (io) => {
  // ─── MIDDLEWARE 1: Auth (runs at connect/handshake) ───
  io.use(async (socket, next) => {
    try {
      let token = null;
      const cookies = parseCookies(socket.handshake.headers.cookie);
      if (cookies[APP_CONSTANTS.AUTH_COOKIE_NAME]) {
        token = cookies[APP_CONSTANTS.AUTH_COOKIE_NAME];
      } else {
        token = socket.handshake.auth.token || socket.handshake.query.token;
      }

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      if (user.lastLogoutAt && decoded.iat * 1000 < user.lastLogoutAt.getTime()) {
        return next(new Error('Authentication error: Session expired'));
      }
      socket.user = user;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // ─── MIDDLEWARE 2: Connect-time suspension check ───
  // Blocks suspended/deleted users from establishing a connection at all.
  // NOTE: io.use() runs only during the handshake — per-event enforcement
  // for already-connected sockets lives in socket.use() inside the connection handler.
  io.use(async (socket, next) => {
    try {
      const user = await User.findById(socket.user._id)
        .select('suspended isDeleted')
        .lean();

      if (!user || user.isDeleted || user.suspended) {
        return next(new Error(user?.suspended ? 'Account suspended' : 'Account unavailable'));
      }

      next();
    } catch (err) {
      console.error('Suspension check error:', err);
      next(); // Let it pass on DB error — don't lock everyone out
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    socket.join(userId);
    console.log(`User connected: ${socket.user.name} (${userId})`);

    // ─── CACHED SUSPENSION STATE ───
    // Middleware 2 already verified the user is clean at connect time, so the
    // cache starts clean. socket.data is Socket.IO's standard per-socket store.
    socket.data.suspended = false;
    socket.data.deleted = false;
    socket.data.lastSuspensionCheck = Date.now();

    // ─── PER-EVENT SUSPENSION CHECK (CACHED) ───
    // Runs before EVERY inbound event on an already-connected socket, but only
    // hits MongoDB once per SUSPENSION_CHECK_INTERVAL per user. Mid-session
    // suspensions are caught on the first event after the interval elapses;
    // admin kicks stay instant (admin.js emits force-disconnect directly).
    socket.use(async (packet, next) => {
      try {
        // Refresh only when the TTL has elapsed — no DB hit on most events.
        if (Date.now() - socket.data.lastSuspensionCheck > SUSPENSION_CHECK_INTERVAL) {
          const user = await User.findById(userId)
            .select('suspended isDeleted')
            .lean();
          socket.data.lastSuspensionCheck = Date.now();
          socket.data.deleted = !user || user.isDeleted;
          socket.data.suspended = !!user?.suspended;
        }

        if (socket.data.deleted || socket.data.suspended) {
          socket.emit('force-disconnect', {
            reason: socket.data.suspended ? 'Account suspended' : 'Account unavailable',
          });
          socket.disconnect(true);
          return next(new Error('Account suspended or deleted'));
        }

        next();
      } catch (err) {
        console.error('Suspension check error:', err);
        next(); // Fail open on DB error — keep cached state, don't lock everyone out
      }
    });

    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);
    User.findByIdAndUpdate(userId, { lastActive: new Date() }).exec()
      .catch(err => console.error('Failed to update lastActive:', err));

    registerSafeSocketHandler(socket, 'join-alignment', async (alignmentId) => {
      if (!alignmentId || typeof alignmentId !== 'string') return;

      try {
        const match = await Alignment.findOne({ _id: alignmentId, users: userId, isActive: true });
        if (!match) return socket.emit('error', { message: 'Not authorized for this alignment' });

        const otherUserId = match.users.find(u => u.toString() !== userId);
        if (otherUserId && await areBlocked(userId, otherUserId)) {
          return socket.emit('error', { message: 'Cannot join chat — user is blocked' });
        }
      } catch (err) {
        console.error('join-alignment validation error:', err);
        return;
      }

      socket.join(alignmentId);
      io.to(alignmentId).emit('online-update', {
        userId,
        online: true,
        lastActive: new Date().toISOString(),
      });
    });

    // 🛡️ PAYLOAD SHAPE IS ATTACKER-CONTROLLED
    // `socket.emit('typing')` with no argument is a valid Socket.IO frame:
    // packet.data becomes [], dispatch passes `undefined`, and destructuring
    // `({ alignmentId })` from undefined throws a TypeError. Socket.IO
    // dispatches with no try/catch, so that TypeError escapes into a
    // process.nextTick and becomes an uncaughtException — which index.js
    // handles by calling process.exit(1). One malformed packet from any
    // authenticated socket takes the entire server down.
    //
    // Every handler below therefore takes the raw payload and pulls fields off
    // it with optional access, so a missing/wrong-shaped field is ignored and
    // logged instead of fatal.

    registerSafeSocketHandler(socket, 'typing', (payload) => {
      const alignmentId = payload?.alignmentId;
      if (!alignmentId || typeof alignmentId !== 'string') return;
      // Authorized at join-alignment; room membership replaces the per-keystroke DB query
      if (!socket.rooms.has(alignmentId)) return;
      socket.to(alignmentId).emit('user-typing', { userName: socket.user.name });
    });

    registerSafeSocketHandler(socket, 'stop-typing', (payload) => {
      const alignmentId = payload?.alignmentId;
      if (!alignmentId || typeof alignmentId !== 'string') return;
      if (!socket.rooms.has(alignmentId)) return;
      socket.to(alignmentId).emit('user-stop-typing');
    });

    registerSafeSocketHandler(socket, 'check-online', async (payload) => {
      // Read inside the try: destructuring used to happen in the parameter list,
      // where a missing payload threw before any guard could run.
      const alignmentId = payload?.alignmentId;
      const targetUserId = payload?.targetUserId;
      try {
        if (!alignmentId || !targetUserId) return;

        // 🔒 STALKING PREVENTION: Verifies active alignment membership before disclosing online activity
        const validMatch = await Alignment.findOne({
          _id: alignmentId,
          users: { $all: [userId, targetUserId] },
          isActive: true,
        });

        if (!validMatch) return; // Silently drop unauthorized stalking queries

        const isOnline = onlineUsers.has(targetUserId) && onlineUsers.get(targetUserId).size > 0;
        const targetUser = await User.findById(targetUserId).select('lastActive');
        socket.emit('online-status', {
          userId: targetUserId,
          online: isOnline,
          lastActive: targetUser?.lastActive,
        });
      } catch (err) {
        console.error('check-online error:', err);
      }
    });

    registerSafeSocketHandler(socket, 'read-messages', async (payload) => {
      const alignmentId = payload?.alignmentId;
      if (!alignmentId || typeof alignmentId !== 'string') return;

      // Validate alignment membership
      try {
        const match = await Alignment.findOne({ _id: alignmentId, users: userId, isActive: true });
        if (!match) return;

        await Message.updateMany(
          { alignmentId, senderId: { $ne: userId }, readAt: null },
          { $set: { readAt: new Date(), deliveryStatus: 'read' } }
        );
        socket.to(alignmentId).emit('messages-read', { readerId: userId });
      } catch (err) {
        console.error('Error marking messages as read:', err);
      }
    });

    registerSafeSocketHandler(socket, 'disconnect', () => {
      console.log(`User disconnected: ${socket.user.name}`);

      // Multi-device: remove this socket, keep others
      const sockets = onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) onlineUsers.delete(userId);
      }

      // Skip entirely if we're already shutting down — mongoose is closing, so
      // this fire-and-forget write could only fail.
      if (mongoose.connection.readyState === 1) {
        User.findByIdAndUpdate(userId, { lastActive: new Date() }).exec()
          .catch((err) => {
            // Expected during shutdown: the pool closed under an in-flight
            // write. Not worth a stack trace on every deploy.
            if (err?.name !== 'MongoClientClosedError') {
              console.error('Failed to update lastActive:', err);
            }
          });
      }

      // Only emit offline if no other sockets for this user
      const stillOnline = onlineUsers.has(userId) && onlineUsers.get(userId).size > 0;
      if (!stillOnline) {
        for (const [room] of socket.rooms) {
          if (room !== socket.id) {
            io.to(room).emit('user-stop-typing', { userId });
            io.to(room).emit('online-update', {
              userId,
              online: false,
              lastActive: new Date().toISOString(),
            });
          }
        }
      }
    });
  });
};

```

### ./server/socket/rouletteSignaling.js

```
/**
 * 🎰 ROULETTE — the queue and the call signaling.
 *
 * ── WHAT THIS IS ─────────────────────────────────────────────────────────────
 * Chatroulette with the profile switched off. You arrive, you wait, the server
 * pairs you with whoever else is waiting, you talk face to face, you press Next.
 * Nobody ever sees a name, a college, or a profile.
 *
 * ── WHY THIS FILE HAS NO DATABASE IMPORTS ─────────────────────────────────────
 * Every check that touches the database — "are these two blocked?", "is this
 * account suspended?" — arrives through `deps`. That is not architectural
 * purity, it is testability: CI has no MongoDB (there is no
 * mongodb-memory-server, and the existing harness in `tests/lib/mongo.mjs`
 * deliberately talks to a real cluster, which is why the QA job in CI is
 * commented out as "not wired up yet"). Injecting the checks means the queue,
 * the pairing races and the crash-safety guarantees are all provable in CI
 * without a database or a browser.
 *
 * `socket/roulette.js` is the thin wrapper that supplies real mongoose-backed
 * implementations. Nothing here knows mongoose exists.
 *
 * ── THE CRASH RULE ───────────────────────────────────────────────────────────
 * `server/socket/chat.js:151-162` documents an existing production hazard: a
 * socket event with a missing or wrong-shaped payload throws inside Socket.IO's
 * `process.nextTick` dispatch, which has no try/catch, becomes an
 * `uncaughtException`, and `server/index.js:574` responds with `process.exit(1)`.
 * One malformed packet from one authenticated user takes down the whole app for
 * everyone.
 *
 * Stage 3 is the first feature where strangers send us large attacker-controlled
 * strings, so this module makes that structurally impossible rather than
 * careful. Two independent layers:
 *
 *   1. `safeHandler` wraps EVERY registered handler in a try/catch. This is the
 *      layer that actually stops the process dying, and it does so even for
 *      throws that no shape check anticipated.
 *   2. Validators reject bad payloads before any state is touched.
 *
 * Layer 1 is what makes layer 2 an optimisation rather than the only defence.
 * `handlers` is exported so a test can assert that nothing is registered
 * un-wrapped — that assertion is the thing keeping layer 1 true as handlers are
 * added over time.
 *
 * ── WHAT IS DELIBERATELY ABSENT ──────────────────────────────────────────────
 * No TURN (Stage 4), no skip/recovery/safety UI (Stage 6), no Align request
 * (Stage 7), no chat (Stage 8), no profile reveal (Stage 9). Pairing here is
 * first-in-first-out among allow-listed test accounts only.
 *
 * Design source: ambitions/roulette.md §11, §13, §15
 */

import { randomUUID } from 'crypto';

/* ═══════════════════════════════════════════════════════════════════════════
 * EVENTS
 *
 * Same names in both directions; Socket.IO separates them by direction. Every
 * inbound event carries `sessionId` so that a signal belonging to a finished
 * call can be rejected rather than applied to whatever call is current now.
 *
 * `call:terminated` keeps the name the spec already commits to (§13: "Refuses
 * new pairs, emits `call:terminated`") and is reserved for a SERVER decision —
 * capacity, the kill switch. `call:ended` is a participant leaving or pressing
 * Next. Two names for genuinely different causes beats one ambiguous one.
 * ═══════════════════════════════════════════════════════════════════════════ */

export const CALL_EVENTS = Object.freeze({
  /* client → server */
  JOIN: 'call:join',
  LEAVE_QUEUE: 'call:leave-queue',
  OFFER: 'call:offer',
  ANSWER: 'call:answer',
  ICE: 'call:ice',
  MEDIA_STATE: 'call:media-state',
  NEXT: 'call:next',
  END: 'call:end',
  /* server → client */
  SEARCHING: 'call:searching',
  MATCHED: 'call:matched',
  PEER_MEDIA: 'call:peer-media',
  ENDED: 'call:ended',
  TERMINATED: 'call:terminated',
  RATE_LIMITED: 'call:rate-limited',
});

/** Every inbound event this module listens for. Used by the wrapper test. */
export const INBOUND_EVENTS = Object.freeze([
  CALL_EVENTS.JOIN,
  CALL_EVENTS.LEAVE_QUEUE,
  CALL_EVENTS.OFFER,
  CALL_EVENTS.ANSWER,
  CALL_EVENTS.ICE,
  CALL_EVENTS.MEDIA_STATE,
  CALL_EVENTS.NEXT,
  CALL_EVENTS.END,
]);

/**
 * Keys allowed to appear in any server → client payload.
 *
 * Roulette's central privacy promise is that the person on the other end is a
 * face with no identity attached. Every emit in this module is filtered through
 * `assertNoIdentity`, so a future edit that helpfully adds `peerName` fails a
 * test instead of shipping. `sessionId` is the only opaque handle — it is a
 * random UUID that identifies a call, not a person, and both sides already hold
 * each other's socket to know who is talking to them.
 */
const FORBIDDEN_PAYLOAD_KEYS = Object.freeze([
  'userId', 'peerId', 'name', 'userName', 'username', 'displayName',
  'firstName', 'lastName', 'email', 'phone', 'college', 'collegeName',
  'profile', 'avatar', 'photo', 'photos', 'bio', 'prompt', 'gender',
  'age', 'city', 'intent', 'intention', 'socketId', 'token',
]);

/* ═══════════════════════════════════════════════════════════════════════════
 * VALIDATION
 * ═══════════════════════════════════════════════════════════════════════════ */

const SESSION_ID_RE = /^[A-Za-z0-9_-]{8,64}$/;

/** Prototype-pollution keys. Rejected anywhere in an inbound payload. */
const POLLUTION_KEYS = Object.freeze(['__proto__', 'constructor', 'prototype']);

/**
 * Walk a payload looking for prototype-pollution keys.
 *
 * Depth-limited because these payloads are shallow by design; an attacker
 * nesting 50,000 objects deep is a different threat (parser stack overflow,
 * handled by the try/catch in safeHandler) and this walk must not become the
 * thing that burns CPU.
 */
const findPollutionKey = (value, depth = 0) => {
  if (depth > 6 || value === null || typeof value !== 'object') return null;
  for (const key of Object.keys(value)) {
    if (POLLUTION_KEYS.includes(key)) return key;
    const nested = findPollutionKey(value[key], depth + 1);
    if (nested) return nested;
  }
  return null;
};

/** A bounded, correctly-typed string, or null. */
export const safeString = (value, { min = 0, max = 256 } = {}) => {
  if (typeof value !== 'string') return null;
  if (value.length < min || value.length > max) return null;
  return value;
};

export const safeSessionId = (value) => {
  const s = safeString(value, { min: 8, max: 64 });
  return s && SESSION_ID_RE.test(s) ? s : null;
};

/**
 * An SDP blob.
 *
 * The length bound is in JavaScript characters rather than bytes, so it is a
 * ~3x-overestimate against UTF-8 — deliberately loose in the permissive
 * direction, because the aim is to stop a 50 MB payload, not to shave kilobytes
 * off a legitimate offer. A real offer for one video track plus one audio track
 * is roughly 2-4 KB, so the default ceiling leaves enormous headroom.
 *
 * The floor matters as much as the ceiling: an SDP shorter than 20 characters
 * cannot be a real description and is only ever an attempt to make the peer
 * throw.
 */
export const safeSdp = (value, maxChars) => {
  const s = safeString(value, { min: 20, max: maxChars });
  if (s === null) return null;
  return { type: 'offer', sdp: s };
};

/**
 * An ICE candidate.
 *
 * Rebuilt field by field rather than forwarded. Forwarding the client's object
 * would relay whatever extra properties it carried into another user's socket
 * handler — the classic socket relay bug.
 */
export const safeCandidate = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  if (findPollutionKey(value) !== null) return null;

  const candidate = safeString(value.candidate, { min: 1, max: 2048 });
  if (candidate === null) return null;

  const out = { candidate };

  if (value.sdpMid !== undefined && value.sdpMid !== null) {
    const mid = safeString(value.sdpMid, { max: 16 });
    if (mid === null) return null;
    out.sdpMid = mid;
  }

  if (value.sdpMLineIndex !== undefined && value.sdpMLineIndex !== null) {
    const idx = value.sdpMLineIndex;
    if (!Number.isInteger(idx) || idx < 0 || idx > 32) return null;
    out.sdpMLineIndex = idx;
  }

  return out;
};

/** Mic/camera state. Two booleans, nothing else — no identity may ride along. */
export const safeMediaState = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  if (typeof value.audioOn !== 'boolean' || typeof value.videoOn !== 'boolean') return null;
  return { audioOn: value.audioOn, videoOn: value.videoOn };
};

/**
 * Fail a test, and in production drop the payload, if a server → client emit
 * ever carries something resembling identity.
 *
 * This is the enforcement point behind the `FORBIDDEN_PAYLOAD_KEYS` list.
 */
export const assertNoIdentity = (eventName, payload) => {
  if (!payload || typeof payload !== 'object') return;
  for (const key of Object.keys(payload)) {
    if (FORBIDDEN_PAYLOAD_KEYS.includes(key)) {
      throw new Error(
        `[roulette] REFUSING to emit "${eventName}": payload carries "${key}". `
        + 'Roulette partners must never receive identity — see ambitions/roulette.md §1.3.',
      );
    }
  }
};

/**
 * Wrap a handler so it cannot take the process down.
 *
 * Catches synchronous throws AND rejected promises, because an async handler
 * that rejects reaches the same `unhandledRejection` path that `index.js:565`
 * logs but does not exit on — silently swallowing a real bug is worse than
 * crashing, so it is logged loudly.
 *
 * This is the single most important function in the file.
 */
const safeHandler = (name, fn, logger) => function wrapped(...args) {
  try {
    const result = fn(...args);
    if (result && typeof result.catch === 'function') {
      result.catch((err) => {
        logger(`[roulette] async failure in "${name}"`, err);
      });
    }
    return result;
  } catch (err) {
    logger(`[roulette] synchronous throw in "${name}" — contained`, err);
    return undefined;
  }
};

/* ═══════════════════════════════════════════════════════════════════════════
 * THE ENGINE
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * @param {object} opts
 * @param {import('socket.io').Server} opts.io
 * @param {object} opts.settings            ROULETTE_SETTINGS
 * @param {(userId: string) => boolean} opts.deps.isAllowed
 * @param {(a: string, b: string) => Promise<{ok:boolean, reason?:string, blame?:'a'|'b'}>} opts.deps.assertPairable
 *        Fresh block + suspension check. MUST hit the database rather than any
 *        socket cache: `chat.js:12` caches suspension state for 60s, which is
 *        far too stale for "may this person see my camera".
 * @param {ReturnType<import('../utils/signalingRateLimit.js').createSignalingRateLimiter>} [opts.rateLimiter]
 * @param {(msg: string, err?: Error) => void} [opts.logger]
 */
export const createRouletteSignaling = ({
  io,
  settings,
  deps,
  rateLimiter = null,
  logger = (...a) => console.error(...a),
}) => {
  /* ── STATE ────────────────────────────────────────────────────────────────
   * In-memory on purpose. There is no Call model, no Redis adapter, and no
   * sticky-session requirement, which keeps this stage to one deployable unit.
   * The cost is real and must be stated rather than discovered: every call and
   * every queued user is lost on restart or a Render free-tier cold start.
   * That is acceptable for an allow-listed test mode and is NOT acceptable for
   * a pilot — it belongs with the capacity work in Stage 10. */
  const queue = [];
  const sessions = new Map();     // sessionId → session
  const socketIndex = new Map();  // socketId  → { entry } | { sessionId }
  const socketUsers = new Map();  // socketId  → userId (for rate-limit eviction)
  const waitTimers = new Map();   // socketId  → Timeout
  const sessionTimers = new Map();// sessionId → Timeout

  /* Pump serialisation.
   *
   * Pairing needs an `await` for the block/suspension check, and an `await`
   * opens the door for a second `join` to interleave between the "is this pair
   * still claimable" read and the write. Node being single-threaded does not
   * save us — the interleaving happens across microtask boundaries.
   *
   * So pairing claims both entries synchronously (setting `pending`) BEFORE any
   * await, and `pump` is serialised behind `pumping`/`pumpRequested` so two
   * concurrent joins cannot run two pair attempts over the same pair. */
  let pumping = false;
  let pumpRequested = false;

  const clearTimer = (map, key) => {
    const t = map.get(key);
    if (t) {
      clearTimeout(t);
      map.delete(key);
    }
  };

  /** Emit to exactly one socket. Socket.IO gives every socket a room named
   * after its own id, so this addresses one socket without a shared room. */
  const toSocket = (socketId, event, payload) => {
    assertNoIdentity(event, payload);
    io.to(socketId).emit(event, payload);
  };

  const isConnected = (socketId) => {
    const s = io.sockets?.sockets?.get?.(socketId);
    return Boolean(s && s.connected);
  };

  /* ── QUEUE ───────────────────────────────────────────────────────────────── */

  const findInQueue = (socketId) => queue.find((e) => e.socketId === socketId);

  const removeFromQueue = (entry) => {
    const idx = queue.indexOf(entry);
    if (idx !== -1) queue.splice(idx, 1);
    clearTimer(waitTimers, entry.socketId);
    entry.pending = false;
    if (socketIndex.get(entry.socketId)?.entry === entry) socketIndex.delete(entry.socketId);
  };

  /** Tell the user how long they may wait before we stop pretending (§13). */
  const scheduleWaitTimeout = (entry) => {
    const ms = settings.MAX_WAIT_SECONDS * 1000;
    if (!Number.isFinite(ms) || ms <= 0) return;
    const timer = setTimeout(() => {
      waitTimers.delete(entry.socketId);
      if (!findInQueue(entry)) return; // already paired — timer is stale
      removeFromQueue(entry);
      toSocket(entry.socketId, CALL_EVENTS.TERMINATED, {
        reason: 'wait-timeout',
        message: 'Nobody is available right now. Try again in a little while.',
      });
    }, ms);
    if (typeof timer.unref === 'function') timer.unref();
    waitTimers.set(entry.socketId, timer);
  };

  const enqueue = (socket, userId) => {
    const entry = { socketId: socket.id, userId, queuedAt: Date.now(), pending: false };
    queue.push(entry);
    socketIndex.set(socket.id, { entry });
    scheduleWaitTimeout(entry);
    toSocket(socket.id, CALL_EVENTS.SEARCHING, {
      waiting: true,
      position: queue.length,
      maxWaitSeconds: settings.MAX_WAIT_SECONDS,
    });
  };

  /* ── SESSIONS ────────────────────────────────────────────────────────────── */

  /**
   * Tear a session down and tell both sides why.
   *
   * Order matters: the session is deleted from `sessions` BEFORE the emits, so a
   * signal that arrives in the gap is rejected as unknown rather than relayed
   * into a call that no longer exists.
   */
  const closeSession = (sessionId, { reason, message, initiator = null, requeue = null }) => {
    const session = sessions.get(sessionId);
    if (!session) return;

    sessions.delete(sessionId);
    clearTimer(sessionTimers, sessionId);

    for (const side of [session.a, session.b]) {
      if (socketIndex.get(side.socketId)?.sessionId === sessionId) {
        socketIndex.delete(side.socketId);
      }
    }

    for (const side of [session.a, session.b]) {
      if (side.socketId === initiator) continue; // they know, they did it
      toSocket(side.socketId, CALL_EVENTS.ENDED, { sessionId, reason, message });
    }

    // The peer of whoever pressed Next does NOT go back in the queue
    // automatically — spec §11.4 gives them an explicit "Find next". Only the
    // person who pressed Next resumes searching.
    if (requeue) {
      const socket = io.sockets?.sockets?.get?.(requeue.socketId);
      if (socket && socket.connected) enqueue(socket, requeue.userId);
    }
  };

  const createSession = (first, second) => {
    const sessionId = randomUUID();
    const session = {
      sessionId,
      a: { socketId: first.socketId, userId: first.userId },
      b: { socketId: second.socketId, userId: second.userId },
      createdAt: Date.now(),
      candidates: 0,
    };
    sessions.set(sessionId, session);

    // The longer-waiting user offers. Fixed by position in the queue, which is
    // what removes glare: exactly one side ever creates an offer, so there is no
    // simultaneous-offer collision to negotiate.
    const caller = session.a;
    const callee = session.b;

    socketIndex.set(caller.socketId, { sessionId });
    socketIndex.set(callee.socketId, { sessionId });

    toSocket(caller.socketId, CALL_EVENTS.MATCHED, { sessionId, role: 'caller' });
    toSocket(callee.socketId, CALL_EVENTS.MATCHED, { sessionId, role: 'callee' });

    /* Handshake watchdog.
     *
     * If the media path never comes up, both sides are left staring at a
     * spinner with no way to know whether it is still working. Stage 3 is
     * STUN-only, so a restrictive network genuinely fails — and it must fail
     * with words rather than silence. `PAIR_TIMEOUT_MS` is used here rather
     * than `CONNECT_TIMEOUT_MS` deliberately: the spec requires the pairing
     * offer to comfortably outlive the connect attempt, otherwise a slow peer
     * pairs and immediately loses the offer. */
    const ms = settings.PAIR_TIMEOUT_MS;
    if (Number.isFinite(ms) && ms > 0) {
      const timer = setTimeout(() => {
        sessionTimers.delete(sessionId);
        if (!sessions.has(sessionId)) return;
        logger(`[roulette] session ${sessionId} never connected — tearing down`);
        closeSession(sessionId, {
          reason: 'connect-failed',
          message: 'Could not connect. This network may be blocking the call.',
        });
      }, ms);
      if (typeof timer.unref === 'function') timer.unref();
      sessionTimers.set(sessionId, timer);
    }

    return session;
  };

  /** Is this socket a participant of this session? The ONLY relay authority. */
  const ownsSession = (socket, sessionId) => {
    const session = sessions.get(sessionId);
    if (!session) return null;
    const owns = session.a.socketId === socket.id || session.b.socketId === socket.id;
    return owns ? session : null;
  };

  const peerOf = (session, socketId) => (
    session.a.socketId === socketId ? session.b : session.a
  );

  /* ── PAIRING PUMP ────────────────────────────────────────────────────────── */

  const pumpOnce = async () => {
    for (;;) {
      if (sessions.size >= settings.MAX_CONCURRENT_CALLS) return;

      const i = queue.findIndex((e) => !e.pending);
      if (i === -1) return;
      const j = queue.findIndex((e, idx) => idx > i && !e.pending);
      if (j === -1) return;

      const first = queue[i];
      const second = queue[j];

      // Claim both synchronously, before any await. Everything below is
      // guaranteed exclusive access to this pair.
      first.pending = true;
      second.pending = true;

      let verdict;
      try {
        verdict = await deps.assertPairable(first.userId, second.userId);
      } catch (err) {
        logger('[roulette] assertPairable threw — refusing the pair', err);
        verdict = { ok: false, reason: 'check-failed' };
      }

      if (!verdict || verdict.ok !== true) {
        const reason = verdict?.reason || 'not-allowed';
        const blame = verdict?.blame === 'a' ? first : second;

        removeFromQueue(first);
        removeFromQueue(second);

        // Only the user responsible is told, and only in general terms. Telling
        // them "you are blocked" confirms the block exists and who caused it.
        const message = reason === 'blocked'
          ? 'You cannot be matched with this person.'
          : 'Could not start a session. Please try again.';

        toSocket(blame.socketId, CALL_EVENTS.TERMINATED, { reason, message });

        // The innocent party keeps waiting rather than being punished for
        // someone else's block.
        const innocent = blame === first ? second : first;
        const innocentSocket = io.sockets?.sockets?.get?.(innocent.socketId);
        if (innocentSocket && innocentSocket.connected) enqueue(innocentSocket, innocent.userId);

        continue;
      }

      // Re-check that nobody's socket died while we awaited the database.
      if (!isConnected(first.socketId) || !isConnected(second.socketId)) {
        removeFromQueue(first);
        removeFromQueue(second);
        continue;
      }

      removeFromQueue(first);
      removeFromQueue(second);
      createSession(first, second);
    }
  };

  const pump = async () => {
    if (pumping) {
      pumpRequested = true;
      return;
    }
    pumping = true;
    try {
      do {
        pumpRequested = false;
        await pumpOnce();
      } while (pumpRequested);
    } finally {
      pumping = false;
    }
  };

  /* ── HANDLERS ────────────────────────────────────────────────────────────── */

  const userIdOf = (socket) => String(socket.user?._id ?? '');

  /** Gate every inbound event on the allow-list and a rate budget. */
  const admit = (socket, cost = 1) => {
    const userId = userIdOf(socket);
    if (!userId || !deps.isAllowed(userId)) return null;

    if (rateLimiter) {
      const { ok, retryAfterMs } = rateLimiter.take(`call:${userId}`, cost);
      if (!ok) {
        toSocket(socket.id, CALL_EVENTS.RATE_LIMITED, {
          reason: 'too-fast',
          retryAfterMs,
        });
        return null;
      }
    }
    return userId;
  };

  /** Shared preamble: validate sessionId, confirm ownership, fetch the peer. */
  const withSession = (payload, socket, fn) => {
    const sessionId = safeSessionId(payload?.sessionId);
    if (!sessionId) return;
    const session = ownsSession(socket, sessionId);
    if (!session) return; // unknown session, or not yours — silently dropped
    fn(session, peerOf(session, socket.id));
  };

  /**
   * Build the handler set for ONE socket.
   *
   * Per-socket rather than engine-level because every handler needs the socket
   * it arrived on. `safeHandler` still wraps each one, which is the guarantee
   * that matters: it is applied at the single point where a listener is
   * registered, so there is no way to add an unwrapped handler later.
   */
  const buildHandlers = (socket) => {
    const handlers = new Map();
    const on = (name, fn) => {
      const wrapped = safeHandler(name, fn, logger);
      handlers.set(name, wrapped);
      return wrapped;
    };

    on(CALL_EVENTS.JOIN, () => {
      const userId = admit(socket);
      if (!userId) return;

      const existing = socketIndex.get(socket.id);
      if (existing?.sessionId && sessions.has(existing.sessionId)) return; // already in a call
      if (existing?.entry) return; // already queued

      if (sessions.size >= settings.MAX_CONCURRENT_CALLS) {
        return toSocket(socket.id, CALL_EVENTS.TERMINATED, {
          reason: 'at-capacity',
          message: 'Roulette is full right now. Try again shortly.',
        });
      }

      if (queue.length >= settings.MAX_QUEUE_SIZE) {
        return toSocket(socket.id, CALL_EVENTS.TERMINATED, {
          reason: 'queue-full',
          message: 'Roulette is very busy right now. Try again shortly.',
        });
      }

      enqueue(socket, userId);
      return pump();
    });

    on(CALL_EVENTS.LEAVE_QUEUE, () => {
      const entry = findInQueue(socket.id);
      if (!entry) return;
      removeFromQueue(entry);
      toSocket(socket.id, CALL_EVENTS.SEARCHING, { waiting: false });
    });

    on(CALL_EVENTS.OFFER, (payload) => {
      if (!admit(socket)) return;
      withSession(payload, socket, (session, peer) => {
        const sdp = safeSdp(payload?.sdp, settings.MAX_SDP_BYTES);
        if (!sdp) return; // malformed offer, dropped — never relayed
        toSocket(peer.socketId, CALL_EVENTS.OFFER, { sessionId: session.sessionId, sdp });
      });
    });

    on(CALL_EVENTS.ANSWER, (payload) => {
      if (!admit(socket)) return;
      withSession(payload, socket, (session, peer) => {
        const sdp = safeSdp(payload?.sdp, settings.MAX_SDP_BYTES);
        if (!sdp) return;
        toSocket(peer.socketId, CALL_EVENTS.ANSWER, { sessionId: session.sessionId, sdp });
      });
    });

    on(CALL_EVENTS.ICE, (payload) => {
      if (!admit(socket)) return;
      withSession(payload, socket, (session, peer) => {
        // Per-session candidate ceiling. The rate limiter bounds the rate; this
        // bounds the total, because a slow trickle under the rate limit still
        // accumulates.
        if (session.candidates >= settings.MAX_CANDIDATES_PER_SESSION) return;
        session.candidates += 1;

        const candidate = safeCandidate(payload?.candidate);
        if (!candidate) return;
        toSocket(peer.socketId, CALL_EVENTS.ICE, { sessionId: session.sessionId, candidate });
      });
    });

    on(CALL_EVENTS.MEDIA_STATE, (payload) => {
      if (!admit(socket)) return;
      withSession(payload, socket, (session, peer) => {
        const state = safeMediaState(payload);
        if (!state) return;
        toSocket(peer.socketId, CALL_EVENTS.PEER_MEDIA, state);
      });
    });

    on(CALL_EVENTS.NEXT, (payload) => {
      if (!admit(socket)) return;
      withSession(payload, socket, (session) => {
        closeSession(session.sessionId, {
          reason: 'peer-next',
          message: 'They moved on.',
          initiator: socket.id,
          // The presser goes back to the queue with a FRESH wait start, so
          // pressing Next repeatedly cannot buy infinite waiting time.
          requeue: { socketId: socket.id, userId: userIdOf(socket) },
        });
        // The presser is waiting again, so the pump must run or they will sit
        // idle until a stranger happens to arrive.
        return pump();
      });
    });

    on(CALL_EVENTS.END, (payload) => {
      if (!admit(socket)) return;
      withSession(payload, socket, (session) => {
        closeSession(session.sessionId, {
          reason: 'peer-left',
          message: 'They left.',
          initiator: socket.id,
        });
      });
    });

    return handlers;
  };

  /* ── DISCONNECT ──────────────────────────────────────────────────────────── */

  /**
   * Tear down whatever this socket was doing.
   *
   * Safe to call more than once for the same socket, and safe to call for a
   * socket that was never in Roulette at all.
   */
  const handleDisconnect = (socketId) => {
    const entry = findInQueue(socketId);
    if (entry) removeFromQueue(entry);

    const indexed = socketIndex.get(socketId);
    if (indexed?.sessionId) {
      closeSession(indexed.sessionId, { reason: 'peer-left', message: 'They left.' });
    }

    clearTimer(waitTimers, socketId);
    socketIndex.delete(socketId);

    const userId = socketUsers.get(socketId);
    if (userId && rateLimiter) rateLimiter.forget(`call:${userId}`);
    socketUsers.delete(socketId);
  };

  /* ── ATTACH ──────────────────────────────────────────────────────────────── */

  const attachSocket = (socket) => {
    const userId = userIdOf(socket);
    if (userId) socketUsers.set(socket.id, userId);

    // Built ONCE per socket and registered explicitly. `safeHandler` is applied
    // inside `buildHandlers`, at the one place a listener is created, so there
    // is no path that registers an unwrapped handler.
    for (const [event, fn] of buildHandlers(socket)) {
      socket.on(event, fn);
    }

    socket.on('disconnect', () => {
      try {
        handleDisconnect(socket.id);
      } catch (err) {
        logger('[roulette] handleDisconnect threw — contained', err);
      }
    });
  };

  return {
    attachSocket,
    handleDisconnect,
    /* Introspection for tests and the boot log. */
    stats: () => ({
      queued: queue.length,
      sessions: sessions.size,
      waitTimers: waitTimers.size,
      sessionTimers: sessionTimers.size,
    }),
    /** Test-only: build a socket's handlers without registering them. */
    buildHandlers,
    /** Test-only: is this user id in the waiting queue? */
    isQueued: (userId) => queue.some((e) => e.userId === userId),
    /** Test-only: does this session exist? */
    hasSession: (sessionId) => sessions.has(sessionId),
  };
};

export default createRouletteSignaling;

```

### ./server/utils/AppError.js

```
export class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

```

### ./server/utils/campusGate.js

```
/**
 * 🚪 CAMPUS GATE — which campuses may currently sign up.
 *
 * The closed, verified-student network is only meaningful if the gate is
 * actually closed. An IIT Bombay pilot has no use for a student from another
 * campus: the entire product thesis is a dense, verified pool, and one
 * outsider in a small pool is a stranger, not a feature.
 *
 * Two independent mechanisms exist, and it is worth being precise about why
 * BOTH are needed rather than either:
 *
 *   1. This gate (`ALLOWED_COLLEGES`). An allow-list applied at the point a
 *      signup is authorised — `resolveCollege()` in routes/auth.js. This is the
 *      security control. It does not care what the database contains.
 *
 *   2. `College.active` in the database, which decides what the picker shows.
 *
 * The reason this is not just "set every other college inactive" is that the
 * database is mutable at runtime: an operator can activate a campus from
 * /admin, or approve a CollegeRequest, and the pilot gate would silently stop
 * applying. This file is configuration — it only changes when someone edits
 * the environment and redeploys — so it is the layer that cannot be talked out
 * of its job by a click in the admin panel.
 *
 * ── WHY AN ALLOW-LIST AND NOT A BLOCK-LIST ───────────────────────────────────
 * A block-list ("these campuses are closed") has to be updated every time a new
 * campus is added, and the failure mode is opening the gate: forget the entry,
 * and the campus is quietly live. An allow-list fails closed instead — an
 * unlisted campus is refused, so the mistake costs you one new user rather than
 * an unintended public launch.
 *
 * ── UNSET MEANS OPEN ────────────────────────────────────────────────────────
 * With no `ALLOWED_COLLEGES` set, every active college can sign up. That is
 * the pre-pilot behaviour and it is the correct default for local development,
 * where seeding one college and pointing the picker at it is already the
 * intended workflow. The gate is opt-IN, so a developer who never hears of it
 * gets a working app rather than a confusing one.
 */

/**
 * The parsed allow-list, or null when no gate is configured.
 *
 * Normalised on read rather than at module load, because a test that mutates
 * `process.env` between cases would otherwise read a stale snapshot frozen at
 * import time. The cost is trivial: the list is a handful of strings and this
 * is called on signup, not on a hot path.
 *
 * @returns {Set<string>|null} lowercased college codes, or null when open
 */
export const getAllowedColleges = () => {
  const raw = process.env.ALLOWED_COLLEGES;

  // Empty string and whitespace both mean "not configured". An operator who
  // blanks the variable expects the app to behave as it did before, not to
  // lock every student out of a campus they never named.
  if (raw === undefined || raw === null || String(raw).trim() === '') return null;

  const codes = String(raw)
    .split(',')
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);

  // A variable containing only separators (" ,, ") parses to an empty list.
  // That is NOT the same as unset: returning null here would open the gate
  // when the operator clearly intended to restrict it. An empty set closes it.
  return new Set(codes);
};

/**
 * @param {string} collegeCode
 * @returns {boolean} true when this college may sign up (always true when no
 *                    gate is configured)
 */
export const isCollegeAllowed = (collegeCode) => {
  const allowed = getAllowedColleges();
  if (allowed === null) return true;
  return allowed.has(String(collegeCode || '').trim().toLowerCase());
};

/**
 * The message a student sees when their campus is outside the gate.
 *
 * Deliberately does NOT say "this app is invite-only" or "not available in your
 * region". It tells them what to do: use the college email and try again, or
 * that their campus is not yet open. Naming a hard boundary invites people to
 * look for a way around it; naming the next step does not.
 */
export const COLLEGE_GATE_MESSAGE =
  'Sign-ups for your college are not open yet. If you have a college email address, please try again.';

/**
 * Build the Mongo filter fragment that limits a college query to the gate.
 *
 * Used by the two list endpoints so the picker only ever shows colleges a
 * student could actually verify against. Showing a selectable campus that
 * signup then rejects is the worst version of this: the student picks it,
 * types their real college email, and is told no at the last step.
 *
 * @returns {{code?: {$in: string[]}}} `{}` when the gate is open
 */
export const collegeGateFilter = () => {
  const allowed = getAllowedColleges();
  if (allowed === null) return {};
  return { code: { $in: [...allowed] } };
};
```

### ./server/utils/campusSeed.js

```
import mongoose from 'mongoose';
import College from '../models/College.js';
import { getAllowedColleges } from './campusGate.js';

/**
 * 🏫 BOOT-TIME CAMPUS SEED.
 *
 * Why this exists: on a free Render plan there is no shell, so there is no way
 * to run a script against the database the first time. That collides with the
 * app's own design — the college picker reads from the `colleges` collection,
 * so an empty database means an empty picker, which means no signup, which
 * means there is no account that could ever reach /admin to add the first
 * college. The two halves each need the other to exist first.
 *
 * Seeding at boot breaks that cycle: the service comes up with a usable campus
 * already present, and /admin becomes reachable the moment an operator logs in.
 *
 * ── WHAT IT DELIBERATELY DOES NOT DO ────────────────────────────────────────
 * It inserts MISSING colleges only. It never updates or overwrites an existing
 * row, because an existing row means an operator has already seen it and may
 * have corrected its name, domains or coordinates from /admin. A boot seed that
 * "ensured" its own values would silently undo that edit on every deploy — and
 * it would do it silently, which is the worst time for it to happen.
 *
 * ── WHY IT IS TIED TO ALLOWED_COLLEGES ──────────────────────────────────────
 * The catalogue below is a fixed list of real campuses, but seeding them all
 * would repopulate a picker that is meant to show one campus during the pilot.
 * Reading the gate means the set of campuses that exists and the set that can
 * sign up can never drift apart: open a campus by adding its code to
 * ALLOWED_COLLEGES, and it exists. Nothing else to remember.
 */

/**
 * Known campuses, keyed by `College.code`.
 *
 * Domains are the whole verification mechanism, so they must be the real
 * institutional domains — `iitb.ac.in` covers every department address via
 * exact-or-subdomain matching (see utils/collegeDomain.js), so no per-department
 * list is needed.
 *
 * latLng is the campus location, not a student's: it is a building's published
 * coordinates and carries none of the privacy weight of User.currentLatLng.
 * Optional in the schema — without it, students at that campus simply rank as
 * "unknown location" rather than being guessed at.
 */
const CATALOGUE = {
  iitb: {
    name: 'Indian Institute of Technology Bombay',
    domains: ['iitb.ac.in'],
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    latLng: [19.124, 72.914],
  },
  iitd: {
    name: 'Indian Institute of Technology Delhi',
    domains: ['iitd.ac.in'],
    city: 'New Delhi',
    state: 'Delhi',
    country: 'India',
    latLng: [28.545, 77.192],
  },
  iitk: {
    name: 'Indian Institute of Technology Kanpur',
    domains: ['iitk.ac.in'],
    city: 'Kanpur',
    state: 'Uttar Pradesh',
    country: 'India',
    latLng: [26.487, 80.331],
  },
  iitkgp: {
    name: 'Indian Institute of Technology Kharagpur',
    domains: ['iitkgp.ac.in'],
    city: 'Kharagpur',
    state: 'West Bengal',
    country: 'India',
    latLng: [22.256, 87.232],
  },
  iitm: {
    name: 'Indian Institute of Technology Madras',
    domains: ['iitm.ac.in'],
    city: 'Chennai',
    state: 'Tamil Nadu',
    country: 'India',
    latLng: [12.991, 80.235],
  },
  iitr: {
    name: 'Indian Institute of Technology Roorkee',
    domains: ['iitr.ac.in'],
    city: 'Roorkee',
    state: 'Uttarakhand',
    country: 'India',
    latLng: [29.869, 80.312],
  },
  iitg: {
    name: 'Indian Institute of Technology Guwahati',
    domains: ['iitg.ac.in'],
    city: 'Guwahati',
    state: 'Assam',
    country: 'India',
    latLng: [26.144, 91.736],
  },
  iith: {
    name: 'Indian Institute of Technology Hyderabad',
    domains: ['iith.ac.in'],
    city: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    latLng: [17.593, 78.271],
  },
  iitbhu: {
    name: 'Indian Institute of Technology (BHU) Varanasi',
    domains: ['iitbhu.ac.in'],
    city: 'Varanasi',
    state: 'Uttar Pradesh',
    country: 'India',
    latLng: [25.135, 83.0],
  },
  iitism: {
    name: 'Indian Institute of Technology (ISM) Dhanbad',
    domains: ['iitism.ac.in'],
    city: 'Dhanbad',
    state: 'Jharkhand',
    country: 'India',
    latLng: [23.815, 86.436],
  },
};

/**
 * Insert any gated campus that is missing.
 *
 * Never throws. A seed that prevents the server from booting would be strictly
 * worse than an empty picker: the app is a social network, and it still works
 * for every already-registered campus if this quietly does nothing. It logs what
 * it did and returns what it created.
 *
 * @returns {Promise<{created: string[], skipped: string[]}>}
 */
export const seedGatedColleges = async () => {
  const result = { created: [], skipped: [] };

  const allowed = getAllowedColleges();
  if (allowed === null) {
    // No gate configured — the pre-pilot behaviour is every active college can
    // sign up, and seeding the whole catalogue would quietly pre-load ten
    // campuses nobody asked for. Nothing to do.
    return result;
  }

  for (const code of allowed) {
    const record = CATALOGUE[code];
    if (!record) {
      // A gated code with no catalogue entry is an operator error worth
      // shouting about: the campus is allowed to sign up but nothing can tell
      // the picker what it is called or which domains to verify against.
      console.error(
        `⚠️  ALLOWED_COLLEGES includes "${code}", which is not in the campus catalogue. ` +
        `Add it to CATALOGUE in server/utils/campusSeed.js, or add the campus from /admin.`,
      );
      continue;
    }

    try {
      // insertOne would throw E11000 on the unique code index if a concurrent
      // instance seeded first — which is exactly what happens on a rolling
      // deploy with two instances briefly running. updateOne with upsert is
      // idempotent and needs no error handling.
      const res = await College.updateOne(
        { code },
        { $setOnInsert: { code, ...record, active: true } },
        { upsert: true },
      );

      if (res.upsertedCount > 0) {
        result.created.push(code);
        console.log(`🏫 Seeded campus "${record.name}" (${code}) from ALLOWED_COLLEGES.`);
      } else {
        result.skipped.push(code);
      }
    } catch (err) {
      console.error(`⚠️  Could not seed campus "${code}": ${err.message}`);
    }
  }

  if (result.created.length > 0) {
    console.log(
      `🏫 Boot seed created ${result.created.length} campus(es): ${result.created.join(', ')}. ` +
      `Sign up at / with an email on that domain, then open /admin.`,
    );
  }

  return result;
};

export default seedGatedColleges;
```

### ./server/utils/email.js

```
/**
 * 📧 "Your college is live" — sent ONLY when an operator presses Notify on a
 * college request group. Never automatically, and never at request time.
 *
 * ⚠️ Why that restraint matters: this is the one email we ever send to an
 * address that arrived from a public, unauthenticated web form. Sending it
 * automatically on college-creation would mean a single typo in a college name
 * emails every student who requested it — including a typo that silently splits
 * one campus's requests across two names. An explicit press means the operator
 * has looked at the grouped list and confirmed the spelling first.
 *
 * There is deliberately NO sign-in or verification link in this email. A link
 * would turn the request form into an account-takeover primitive: submit
 * someone else's address, have a link sent to them, click it.
 */
/**
 * 📧 EMAIL TRANSPORT — Resend.
 *
 * ── WHY RESEND_SENDER_EMAIL MUST BE A BARE ADDRESS ──────────────────────────
 * The `from` header is composed as `${senderName} <${senderEmail}>`, so
 * RESEND_SENDER_EMAIL must be ONLY the address — `otp@huh.app`. Setting it to
 * the full display form (`huh? <otp@huh.app>`) produces
 *
 *     from: "huh? <huh? <otp@huh.app>>"
 *
 * which Resend rejects with a validation error, and the failure surfaces only
 * as an OTP that never arrives. The default below is deliberately bare for the
 * same reason.
 */
const senderEmail = () => process.env.RESEND_SENDER_EMAIL || 'onboarding@resend.dev';
const senderName = () => process.env.RESEND_SENDER_NAME || 'huh?';

// ⚠️ `onboarding@resend.dev` is Resend's sandbox sender. It delivers ONLY to
// the email address that owns the Resend account. Every real student is
// silently unreachable while it is in use, and nothing errors — Resend accepts
// the send and delivers it to the wrong place. Set a verified domain.
const brand = () => senderName();

export const sendCollegeLive = async (email, collegeName) => {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`[DEV MODE] College-live email for ${email}: ${collegeName} is now on ${brand()}`);
    return true;
  }

  // Escape before interpolation into HTML — the name comes from user input.
  const safeName = String(collegeName || 'your college').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]),
  );

  const htmlContent = `
    <div style="font-family: 'Inter', sans-serif; background-color: #0A0A0C; color: #F5F5F7; padding: 40px 20px; text-align: center; max-width: 500px; margin: 0 auto; border-radius: 16px; border: 1px solid rgba(255,255,255,0.06);">
      <h1 style="color: #D4A853; font-size: 28px; margin-bottom: 8px; font-weight: 700; letter-spacing: 2px;">${brand().toUpperCase()}</h1>
      <p style="color: #6E6E80; font-size: 14px; margin-bottom: 24px;">Your Campus. Your People.</p>
      <div style="background-color: #141418; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid rgba(255,255,255,0.03);">
        <p style="font-size: 18px; color: #F5F5F7; margin: 0 0 8px 0; font-weight: 600;">${safeName} is live</p>
        <p style="font-size: 14px; color: #6E6E80; margin: 0; line-height: 1.5;">
          You asked us to add your campus, and we have. You can now sign up and start matching with students there.
        </p>
      </div>
      <p style="font-size: 12px; color: #6E6E80; line-height: 1.5;">
        ${brand()} is for verified students only. You will need your campus email address to sign up.
      </p>
    </div>
  `;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${senderName()} <${senderEmail()}>`,
      to: [email],
      subject: `${collegeName} is now on ${brand()}`,
      html: htmlContent,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Resend API error:', err);
    throw new Error(`Resend API error: ${err}`);
  }

  return true;
};

export const sendOTP = async (email, otp) => {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('RESEND_API_KEY is required to send OTP emails in production');
    }
    console.log(`\n----------------------------------------`);
    console.log(`[DEV MODE] OTP for ${email}: ${otp}`);
    console.log(`----------------------------------------\n`);
    return true;
  }

  const htmlContent = `
    <div style="font-family: 'Inter', sans-serif; background-color: #0A0A0C; color: #F5F5F7; padding: 40px 20px; text-align: center; max-width: 500px; margin: 0 auto; border-radius: 16px; border: 1px solid rgba(255,255,255,0.06);">
      <h1 style="color: #D4A853; font-size: 28px; margin-bottom: 8px; font-weight: 700; letter-spacing: 2px;">${brand().toUpperCase()}</h1>
      <p style="color: #6E6E80; font-size: 14px; margin-bottom: 24px;">Your Campus. Your People.</p>
      <div style="background-color: #141418; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid rgba(255,255,255,0.03);">
        <p style="font-size: 16px; color: #F5F5F7; margin-top: 0;">Here is your verification code:</p>
        <div style="font-size: 36px; font-weight: 700; color: #D4A853; letter-spacing: 6px; margin: 16px 0;">${otp}</div>
        <p style="font-size: 12px; color: #6E6E80; margin-bottom: 0;">This code is valid for 10 minutes and can only be used once.</p>
      </div>
      <p style="font-size: 12px; color: #6E6E80; line-height: 1.5;">If you did not request this code, you can safely ignore this email.</p>
    </div>
  `;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${senderName()} <${senderEmail()}>`,
      to: [email],
      subject: `Your ${brand()} Login Code`,
      html: htmlContent,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Resend API error:', err);
    throw new Error(`Resend API error: ${err}`);
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log(`\n----------------------------------------`);
    console.log(`[OTP] For ${email}: ${otp}`);
    console.log(`----------------------------------------\n`);
  }

  return true;
};

```

### ./server/utils/media.js

```
/**
 * 🔐 MEDIA OWNERSHIP
 *
 * Every upload this app makes is traceable back to the user who uploaded it:
 *
 *   Cloudinary → matchalize/photos/<userId>/<file>   (prod)
 *                matchalize/audio/<userId>/<file>
 *   Local disk  → /uploads/<userId>-<timestamp>.<ext> (dev fallback)
 *
 * Both layouts put the uploader's id in the path, so ownership can be proven
 * from the URL alone. That matters because a URL is user-supplied data: any
 * authenticated user can POST someone else's photo URL into their own profile.
 * Without this check, saving/swapping/deleting a profile would tell the delete
 * helper to destroy a file belonging to somebody else.
 *
 * Cloudinary holds every user's media in ONE account with ONE API secret, so
 * "I have the secret" is not ownership. The folder is the only real proof.
 */

/**
 * A Cloudinary delivery URL is laid out as:
 *
 *   .../<resource_type>/upload/<transformations>/v<version>/<public_id>.<ext>
 *                                          └──────┬──────┘
 *                          everything after this marker is the public_id path,
 *                          i.e. FOLDERS — and is never guessable
 *
 * The bug this guards against: `f_images` is shaped exactly like a
 * transformation parameter (`f` + `_` + `images`), so a naive "delete anything
 * that looks like a transform" filter cannot tell a real folder from a
 * formatting instruction and will eat the folder. That yields a mangled
 * public_id, which then fails isCloudinaryFileOwnedBy() below, so the delete is
 * refused rather than wrongly performed — but the file is then never cleaned up.
 *
 * The invariant that makes this safe: transformation segments only ever appear
 * BEFORE the version marker, never after. So strip transformations only in that
 * position and leave everything after it untouched.
 *
 * Note this is a strict tightening — it strips strictly less than a naive
 * filter would, so a parse failure can only cause a *refused* delete (safe
 * leak), never destruction of someone else's file. That direction matters:
 * this function backs the ownership guard in config/cloudinary.js.
 *
 * ⚠️ This is the single source of truth for ownership. Weaken it and the guard
 * in config/cloudinary.js weakens with it. If you're ever tempted to make this
 * more permissive to fix a "cleanup didn't work" bug, the correct fix is to
 * store public_id at upload time and stop parsing URLs entirely.
 */
export const extractCloudinaryPublicId = (url) => {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) return null;
  try {
    const uploadIdx = url.indexOf('/upload/');
    if (uploadIdx === -1) return null;
    const segments = url.slice(uploadIdx + '/upload/'.length).split('/');

    // Transformations only ever appear before the version marker, so anything at
    // or after that marker is public_id path — folders included — and is kept.
    //
    // If there is no version marker at all the URL isn't in the shape we can
    // parse safely. Rather than rejecting it (which would break a user's own
    // legitimate photo) strip nothing: the ownership check downstream will then
    // simply refuse to act on it, which is a safe outcome. Upload responses
    // from Cloudinary always include a version, so this is a fallback, not the
    // normal path.
    const versionIdx = segments.findIndex((seg) => /^v\d+$/.test(seg));

    const publicSegments = segments.filter((seg, i) => {
      if (i === versionIdx) return false; // version marker, never part of the id
      if (versionIdx !== -1 && i < versionIdx && /^[a-z]{1,4}_[a-z0-9.:]+(,[a-z]{1,4}_[a-z0-9.:]+)*$/i.test(seg)) {
        return false;
      }
      return true;
    });

    const publicId = publicSegments.join('/').replace(/\.[a-z]+$/i, '');
    return publicId || null;
  } catch {
    return null;
  }
};

/** True when this Cloudinary file sits in the given user's own folder. */
export const isCloudinaryFileOwnedBy = (url, userId) => {
  if (!userId) return false;
  const publicId = extractCloudinaryPublicId(url);
  if (!publicId) return false;
  return publicId.startsWith(`matchalize/photos/${userId}/`) ||
         publicId.startsWith(`matchalize/audio/${userId}/`);
};

/** True when this is a local dev-fallback upload made by the given user. */
export const isLocalFileOwnedBy = (url, userId) => {
  if (!userId || !url || typeof url !== 'string') return false;
  try {
    const { pathname } = new URL(url);
    const match = pathname.match(/^\/uploads\/([a-f0-9]{24})-[^/]+$/i);
    return !!match && match[1] === userId.toString();
  } catch {
    return false;
  }
};

/**
 * Is this media URL provably this user's own upload?
 * Local disk and per-user Cloudinary folders both qualify. Unsplash placeholders
 * are intentionally NOT "owned" — they live on someone else's CDN and this app
 * can never delete them, so ownership is meaningless for them.
 */
export const isOwnedMediaUrl = (url, userId) => {
  if (!userId || !url || typeof url !== 'string') return false;
  return isCloudinaryFileOwnedBy(url, userId) || isLocalFileOwnedBy(url, userId);
};

/**
 * External placeholder images (seed/demo profiles). Allowed in profiles because
 * they are read-only stock photos, but never treated as deletable assets.
 */
export const isExternalPlaceholderUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  try {
    const { hostname } = new URL(url);
    return hostname === 'images.unsplash.com';
  } catch {
    return false;
  }
};

/**
 * A profile/chat media URL is acceptable if it is the user's own upload or a
 * known external placeholder. Anything else — notably another user's file — is
 * rejected so it can never reach a delete call.
 */
export const isAcceptableMediaUrl = (url, userId) =>
  isOwnedMediaUrl(url, userId) || isExternalPlaceholderUrl(url);

```

### ./server/utils/moderationLedger.js

```
import crypto from 'crypto';
import { normalizeEmail } from './otpHash.js';
import ModerationLedger from '../models/ModerationLedger.js';

export const fingerprintModerationEmail = (email) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is required to fingerprint moderation identifiers');

  return crypto
    .createHmac('sha256', secret)
    .update(`moderation-ledger:${normalizeEmail(email)}`)
    .digest('hex');
};

export const preserveShadowban = async (user) => {
  if (!user?.email || !user.shadowbannedAt) return null;

  const emailFingerprint = fingerprintModerationEmail(user.email);
  return ModerationLedger.findOneAndUpdate(
    { emailFingerprint },
    {
      $set: {
        shadowbannedAt: user.shadowbannedAt,
        shadowbanScore: Number(user.shadowbanScore) || 0,
        contentFrozen: Boolean(user.contentFrozen),
      },
    },
    { upsert: true, new: true, runValidators: true }
  );
};

```

### ./server/utils/otpHash.js

```
import crypto from 'crypto';

// OTP codes are stored as an HMAC-SHA256 fingerprint, never in plaintext.
// A bare SHA-256 would be useless here: only 10^6 possible codes, so a stolen
// hash could be reversed in seconds by hashing all of them. HMAC needs the
// secret key too, so a database-only leak cannot be brute-forced.
//
// The email is bound into the HMAC input so the same code used on two accounts
// yields two different fingerprints (domain separation).
const getSecret = () => process.env.OTP_HASH_SECRET || process.env.JWT_SECRET;

// MUST normalise: hashOtp has to be byte-identical at store time (send-otp)
// and at verify time, and the route callers are not trusted to normalise.
const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

export const hashOtp = (email, otp) =>
  crypto
    .createHmac('sha256', getSecret())
    .update(`${normalizeEmail(email)}:${otp}`)
    .digest('hex');

// Constant-time compare so the comparison does not leak the fingerprint
// character by character. The length guard makes legacy plaintext rows fail
// safe to `false` instead of throwing on a Buffer length mismatch.
export const verifyOtp = (email, otp, storedHash) => {
  const candidate = Buffer.from(hashOtp(email, otp), 'hex');
  const stored = Buffer.from(String(storedHash || ''), 'hex');
  if (candidate.length !== stored.length) return false;
  return crypto.timingSafeEqual(candidate, stored);
};

export { normalizeEmail };

```

