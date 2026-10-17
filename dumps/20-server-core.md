# Chunk 20 — Server Core

> Matchalize · `server-core` · files 20 of 27 chunks · 11 file(s) · 64 KB · ~18,684 tokens
> Generated 2026-10-17 20:34.
> Paste-safe: within the 100 KB / ~29,257 token target.
>
> Contains:
> - `./server/seedRealistic.js`
> - `./server/socket/chat.js`
> - `./server/utils/AppError.js`
> - `./server/utils/campusGate.js`
> - `./server/utils/campusSeed.js`
> - `./server/utils/email.js`
> - `./server/utils/media.js`
> - `./server/utils/otpHash.js`
> - `./server/utils/publicCard.js`
> - `./server/utils/push.js`
> - `./server/utils/queue.js`

---
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

    socket.on('join-alignment', async (alignmentId) => {
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

    socket.on('typing', (payload) => {
      const alignmentId = payload?.alignmentId;
      if (!alignmentId || typeof alignmentId !== 'string') return;
      // Authorized at join-alignment; room membership replaces the per-keystroke DB query
      if (!socket.rooms.has(alignmentId)) return;
      socket.to(alignmentId).emit('user-typing', { userName: socket.user.name });
    });

    socket.on('stop-typing', (payload) => {
      const alignmentId = payload?.alignmentId;
      if (!alignmentId || typeof alignmentId !== 'string') return;
      if (!socket.rooms.has(alignmentId)) return;
      socket.to(alignmentId).emit('user-stop-typing');
    });

    socket.on('check-online', async (payload) => {
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

    socket.on('read-messages', async (payload) => {
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

    socket.on('disconnect', () => {
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

### ./server/utils/publicCard.js

```
import { withFreshAge } from './age.js';

/**
 * The ONLY fields another person may see on a card.
 *
 * An allowlist, not a denylist, and this function enforces it itself rather than
 * trusting the caller to have selected these fields first. The deck route does
 * `.select(CARD_FIELDS)`, so projection looked redundant there — but the
 * `profile-updated` broadcast hands it a full user document, and a projection
 * that only stripped `college` shipped `email`, `isVerified`, `shadowbanScore`
 * and `adminNotes` to every connected socket. Adding a field to the schema would
 * have leaked it silently.
 */
export const CARD_FIELDS = [
  'name', 'photos', 'bio', 'bioPhoto', 'year', 'pronouns', 'graduatingYear',
  'college', 'collegeCode', 'showCollege', 'dob', 'age', 'interests', 'intent',
  'prompts', 'interestedIn', 'gender', 'profileScore', 'lastActive', 'gapYear',
];

/** Space-separated projection, for `.select()` on a Mongoose query. */
export const CARD_FIELDS_SELECT = CARD_FIELDS.join(' ');

/**
 * Project a user document — Mongoose document or plain object — down to the
 * public card shape.
 *
 * Deliberately NOT included: `hybridScore`. It is relative to the VIEWER (it
 * measures how well the candidate matches the person being shown the deck), so it
 * can only be computed for a specific reader. Callers that know the viewer compute
 * it separately and spread it on top; a broadcast payload carries only the
 * view-independent fields, and each client keeps whatever viewer-relative scores
 * it already had.
 */
export const toPublicCard = (user) => {
  if (!user) return user;

  /* Normalise Mongoose documents to plain objects first.
     `const { a, ...rest } = doc` reads `a` through the prototype getter, but a
     rest-spread copies OWN enumerable properties — and a document keeps its
     schema fields under `_doc`, not on itself. Spreading a document therefore
     yields internals, not fields. The deck route passes `.lean()` documents so
     it never hit this; the broadcast path did, and shipped
     `{bio: undefined, profileScore: undefined}` while still looking correct,
     because the explicitly re-added `college` happened to survive. */
  const src = typeof user.toObject === 'function' ? user.toObject() : user;

  const out = {};
  for (const field of CARD_FIELDS) {
    if (field in src) out[field] = src[field];
  }

  /* 🔒 CAMPUS BADGE — stripped here, not hidden in CSS.

     Hiding it client-side still ships it over the wire, so anyone opening
     devtools sees every card's college regardless of the setting, and the
     toggle is a decoration rather than the privacy control it claims to be.
     Removing it at the projection means the data never leaves the database.

     Keyed on the OWNER's `showCollege`, never the viewer's: this controls
     whether people can see YOU, and says nothing about what you are allowed to
     see. Someone with the badge off is still shown college names on other
     people's cards. The `showCollege` flag itself is dropped either way — it is
     the owner's private preference and no card needs it. */
  const showCollege = out.showCollege;
  delete out.showCollege;
  if (showCollege === false) {
    delete out.college;
    delete out.collegeCode;
  }

  return withFreshAge(out);
};

```

### ./server/utils/push.js

```
import webPush from 'web-push';
import User from '../models/User.js';

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webPush.setVapidDetails(
    'mailto:admin@matchalize.app',
    vapidPublicKey,
    vapidPrivateKey
  );
}

export const sendPushNotification = async (userId, payload) => {
  try {
    // ⚠️ The status flags were never selected here, so they could never be
    // tested. Suspension blocks the *user* from acting (middleware/auth.js
    // rejects them and the deck filters them out), but it did nothing to stop
    // their device being handed inbound content: an active alignment is not
    // deactivated on suspension, so their counterpart could keep messaging them
    // and the lock screen kept showing up to 100 chars of the message text.
    // The fix is here rather than at each call site so no future caller can
    // reintroduce it by forgetting a pre-check.
    const user = await User.findById(userId).select(
      'pushSubscription name suspended isDeleted shadowbannedAt contentFrozen'
    );
    if (!user?.pushSubscription) return false;

    if (user.suspended || user.isDeleted) {
      // Moderation action, not a transient failure: drop the subscription so a
      // suspended device stops being a notification target entirely rather than
      // relying on this guard on every future send.
      await User.findByIdAndUpdate(userId, { pushSubscription: null }).catch(() => {});
      console.warn(
        `[push] Suppressed notification for ${userId} (suspended=${!!user.suspended} deleted=${!!user.isDeleted}); cleared subscription`
      );
      return false;
    }

    // Shadowbanned users still function normally in the app (that is the point of
    // a shadowban), so they keep receiving their own notifications — only the
    // sender is misled. Not treated as a suppression case.

    const notificationPayload = {
      title: payload.title || 'Matchalize',
      body: payload.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      data: payload.data || {},
      vibrate: [100, 50, 100],
    };

    await webPush.sendNotification(
      user.pushSubscription,
      JSON.stringify(notificationPayload)
    );
    return true;
  } catch (error) {
    if (error.statusCode === 410 || error.statusCode === 404) {
      // Subscription expired or invalid, remove it
      await User.findByIdAndUpdate(userId, { pushSubscription: null }).catch(() => {});
    }
    console.error('Push notification error:', error.message);
    return false;
  }
};

export const generateVapidKeys = () => {
  return webPush.generateVAPIDKeys();
};

```

### ./server/utils/queue.js

```
import * as Sentry from '@sentry/node';

// A zero-dependency, free background task runner.
// Detaches async tasks (push notifications, emails) from the Express response cycle.
// Concurrency-capped FIFO worker pool so a burst of tasks (e.g. push at launch)
// can't overwhelm external services or spike memory.
const MAX_CONCURRENT = 20;

// ⚠️ A task that never settles used to leak its slot FOREVER: `running` was only
// decremented in `.finally()`, which never runs if the promise never resolves.
// Twenty such tasks and `running` stayed at 20, so the `while` below never ran
// again — and every subsequent push notification, email and background job for
// the entire app silently stopped, forever, with no log line, no Sentry event and
// no metric. The worst possible failure mode: notifications just quietly quit.
//
// The timeout converts "hangs forever" into "fails loudly, then moves on", and
// the saturation log makes the condition diagnosable instead of invisible.
const TASK_TIMEOUT_MS = 15_000;

// Bound memory when producers outpace consumers. Without this, `queue.push` is
// unbounded and a traffic spike can grow the array without limit.
const MAX_QUEUE_LENGTH = 1000;

let droppedTasks = 0;
let timedOutTasks = 0;

const queue = [];
let running = 0;

const pump = () => {
  // Diagnose the wedge condition even when it happens, rather than discovering
  // it weeks later from "users say notifications stopped".
  if (queue.length > MAX_QUEUE_LENGTH / 2 && running >= MAX_CONCURRENT) {
    console.warn(
      `[Background Queue] saturated: ${queue.length} queued, ${running}/${MAX_CONCURRENT} slots in use`
    );
  }

  while (running < MAX_CONCURRENT && queue.length > 0) {
    const task = queue.shift();
    running += 1;

    // ⚠️ The slot must be released by OUR chain settling, not by the task's own
    // promise settling. `running` is decremented in `.finally()` below, and
    // `.finally()` only runs when the promise it is attached to settles. Merely
    // logging on a timer is therefore not enough — the chain stays pending and the
    // slot leaks anyway. So the task is RACED against the timer: when the timer
    // wins, our promise rejects, `.catch()` records it and `.finally()` frees the
    // slot, while the abandoned task keeps running harmlessly in the background
    // (these are fire-and-forget notifications, so there is nothing to cancel).
    // `rejectTimeout` is wired into the Promise.race below. It must be declared
    // before the timer so the timer callback can reach it.
    let rejectTimeout;
    const timer = setTimeout(() => {
      timedOutTasks += 1;
      console.error(
        `[Background Queue] task exceeded ${TASK_TIMEOUT_MS}ms; releasing its slot`
      );
      rejectTimeout?.(new Error(`task exceeded ${TASK_TIMEOUT_MS}ms`));
    }, TASK_TIMEOUT_MS);

    Promise.resolve()
      .then(() => {
        // Arm the race: whichever settles first wins.
        return Promise.race([
          Promise.resolve().then(task),
          new Promise((_, reject) => {
            rejectTimeout = reject;
          }),
        ]);
      })
      .catch((error) => {
        // The timer already logged the timeout, and an abandoned task is not an
        // application bug worth waking Sentry for — it is an infra symptom. Real
        // task failures still get reported.
        if (error?.message?.includes(`exceeded ${TASK_TIMEOUT_MS}ms`)) return;
        console.error('[Background Queue Error]', error);
        // Surface background failures in Sentry when initialized (safe no-op if DSN unset)
        Sentry.captureException(error);
      })
      .finally(() => {
        clearTimeout(timer);
        running -= 1;
        setImmediate(pump);
      });
  }
};

export const addToQueue = (task) => {
  if (queue.length >= MAX_QUEUE_LENGTH) {
    droppedTasks += 1;
    // Dropping is strictly better than growing without bound, and the counter
    // makes it visible.
    console.error(
      `[Background Queue] at capacity (${MAX_QUEUE_LENGTH}); dropped task. Total dropped: ${droppedTasks}`
    );
    return;
  }
  queue.push(task);
  setImmediate(pump);
};

/** Health counters — for debugging "notifications stopped" reports. */
export const getQueueStats = () => ({
  queued: queue.length,
  running,
  maxConcurrent: MAX_CONCURRENT,
  maxQueueLength: MAX_QUEUE_LENGTH,
  droppedTasks,
  timedOutTasks,
});
```

