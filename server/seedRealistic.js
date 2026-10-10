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