import { CAST, CAST_ORDER } from './cast.mjs';
import { personaImage } from './art.mjs';

// Deterministic name pool for the filler society (balance ~ 24M / 16F)
const PERSONA_NAMES = [
  ['Aarav Patel', 'M'], ['Ishaan Reddy', 'M'], ['Vihaan Shah', 'M'], ['Kabir Nair', 'M'],
  ['Aditya Rao', 'M'], ['Dev Malik', 'M'], ['Reyansh Bose', 'M'], ['Arnav Gupta', 'M'],
  ['Krish Talwar', 'M'], ['Zoya Khan', 'F'], ['Aisha Sheikh', 'F'], ['Meera Joshi', 'F'],
  ['Tara Verma', 'F'], ['Riya Kulkarni', 'F'], ['Sara Ali', 'F'], ['Ira Menon', 'F'],
  ['Dhruv Saxena', 'M'], ['Ved Agarwal', 'M'], ['Manav K', 'M'], ['Yash Deshpande', 'M'],
  ['Nikhil Pillai', 'M'], ['Karan D', 'M'], ['Ritvik Bhat', 'M'], ['Sid Mehra', 'M'],
  ['Navya Iyer', 'F'], ['Anvi Bhatt', 'F'], ['Ruhi Das', 'F'], ['Maya Chawla', 'F'],
  ['Kiara Sehgal', 'F'], ['Diya Nair', 'F'], ['Aadhya B', 'F'], ['Vaani Rao', 'F'],
  ['Rohan Joshi', 'M'], ['Parth Thakur', 'M'], ['Gautam Sinha', 'M'], ['Neel Kulkarni', 'M'],
  ['Aditya Verma', 'M'], ['Kunal Bajaj', 'M'], ['Ritika Sen', 'F'], ['Ishan Garg', 'M'],
];

const BRANCH_POOL = ['CS', 'EE', 'ME', 'Civil', 'Chem', 'Aero', 'Design', 'MATH', 'Physics', 'Meta'];
const YEAR_POOL = ['1st', '2nd', '3rd', '4th', 'PG'];
const HOSTEL_POOL = ['Hostel 1', 'Hostel 2', 'Hostel 3', 'Hostel 4', 'Hostel 5', 'Hostel 6', 'Hostel 7', 'Hostel 10'];
const BIO_POOL = [
  'Optimistic, chronically 5 minutes late, and slightly obsessed with the mess’s kadhi.',
  'Found wandering Powai at 2am. Ask me about the lakeside bench with the best sunset.',
  'Future chaos coordinator of this campus. My doodles have more friends than I do.',
  'Will debate you on film endings for hours, but will never reveal who signs the hostel register for me.',
  'Caffeine-powered, deadline-driven, secretly a softie. My plant is named after my ex.',
  'I rate sunsets and canteen chai. Your move.',
  'Accountable to no one but the canteen guy who knows my order by heart.',
  'Chemistry lab survivor. Will build you a robot that brings chai.',
];
const ANSWER_POOL = [
  'Because I think the little rituals matter more than the loud things.',
  'Honestly? I just want someone to share a quiet evening with.',
  'I wrote down my answer three times. This is the fourth draft.',
  'Roleplay DMs to the freshers’ group chat said otherwise.',
  'Ask me again after 10pm — my night-owl brain is sharper.',
  'My hostel wingmates vetoed anything too sincere.',
  'True story: I once convinced a professor the homework got eaten by a goat.',
  'I peaked in this one random inter-year quiz and I’m still chasing that high.',
];

function hashNum(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function pick(list, n) {
  return list[n % list.length];
}

let fillerIdx = 0;

const normGender = (g) => {
  const k = String(g || '').toLowerCase();
  if (k === 'male') return 'Male';
  if (k === 'female') return 'Female';
  if (k === 'non-binary' || k === 'nonbinary') return 'Non-binary';
  return g;
};

const normInterested = (list) =>
  (list || []).map((g) => {
    const k = String(g).toLowerCase();
    if (k === 'male') return 'Male';
    if (k === 'female') return 'Female';
    if (k === 'non-binary' || k === 'nonbinary') return 'Non-binary';
    if (k === 'everyone') return 'Everyone';
    return g;
  });

function buildFiller(cfg) {
  const [rawName, sex] = PERSONA_NAMES[fillerIdx++ % PERSONA_NAMES.length];
  const idx = fillerIdx;
  const name = `${rawName}`;
  const email = `${name.toLowerCase().replace(/[^a-z]+/g, '.').replace(/^\.|\.$/g, '')}${idx}@iitb.ac.in`;
  const seed = email;
  const age = 19 + (hashNum(email + 'a') % 4);
  return {
    email,
    name,
    gender: normGender(sex === 'M' ? 'male' : 'female'),
    interestedIn: normInterested(sex === 'M' ? ['female'] : ['male']),
    intent: ['Dating', 'Friends'],
    age,
    compat: 'plain',
    role: null,
    seed,
    _fillIdx: idx,
  };
}

// Signature answers = the option key chosen for every question, same for drishti & arjun.
const SIGNATURE_KEY_BY_Q = {
  group_project: 'carry',
  weekend: 'out',
  conflict: 'talk',
  first_date: 'walk',
  social: 'very',
  comm_style: 'deep',
  looking_for: 'see',
};

// Plain users pick a deterministic key per question that never matches the signature keys.
const DIFFERENT_KEY_BY_Q = {
  group_project: 'wing',
  weekend: 'study',
  conflict: 'loud',
  first_date: 'movie',
  social: 'home',
  comm_style: 'meme',
  looking_for: 'unsure',
};

export function buildCompatAnswers(qid, role) {
  return {
    question: qid,
    answer: role === 'signature' ? SIGNATURE_KEY_BY_Q[qid] : DIFFERENT_KEY_BY_Q[qid],
  };
}

export function buildPersonas(cfg) {
  fillerIdx = 0;
  const questions = (cfg.compatQuestions || []).map((q) => q.id);
  const prompts = cfg.prompts || ['A shower thought I recently had...', 'My ideal weekend looks like...', 'Two truths and a lie...'];
  const interests = cfg.interests || [];
  const branches = cfg.branches || BRANCH_POOL;
  const years = cfg.years || YEAR_POOL;

  const buildUser = (spec, role) => {
    const seed = spec.email;
    const compatRole = spec.compat || 'plain';
    const photos = [
      personaImage(seed + ':p0', 'portrait'),
      personaImage(seed + ':p1', 'square'),
      personaImage(seed + ':p2', 'square'),
      personaImage(seed + ':p3', 'land'),
    ];
    const usedQs = questions.slice(0, 3);
    const promptSlots = usedQs.map((qid, i) => ({
      question: prompts[i % prompts.length] || `A shower thought I recently had...`,
      answer: pick(ANSWER_POOL, hashNum(seed + 'a' + i)),
      photoUrl: i === 0 ? photos[2] : '',
    }));
    const compatAnswers = questions.map((qid) => buildCompatAnswers(qid, compatRole));
    const gender = normGender(spec.gender) || 'Female';
    return {
      email: spec.email,
      college: 'Indian Institute of Technology Bombay',
      collegeCode: 'iitb',
      isVerified: true,
      isOnboarded: !spec.fresh,
      name: spec.name,
      age: spec.age,
      gender,
      pronouns: gender === 'Male' ? 'he/him' : gender === 'Female' ? 'she/her' : 'they/them',
      branch: spec.branch || pick(branches, hashNum(seed)),
      year: spec.year || pick(years, hashNum(seed + 'y')),
      hostel: spec.hostel || pick(HOSTEL_POOL, hashNum(seed + 'h')),
      bio: spec.bio || pick(BIO_POOL, hashNum(seed + 'b')),
      photos,
      prompts: promptSlots,
      intent: spec.intent || ['Dating'],
      interestedIn: normInterested(spec.interestedIn),
      ageRange: { min: 18, max: 30 },
      interests: [pick(interests, hashNum(seed + 'i1')), pick(interests, hashNum(seed + 'i2')), pick(interests, hashNum(seed + 'i3'))].filter((v, i, a) => a.indexOf(v) === i),
      compatAnswers,
      onboardingStep: 8,
      role,
    };
  };

  const castUsers = {};
  for (const key of CAST_ORDER) {
    const spec = { ...CAST[key] };
    castUsers[key] = buildUser(spec, key);
    castUsers[key].isAdmin = !!spec.isAdmin;
    castUsers[key]._role = key;
    if (spec.fresh) {
      castUsers[key].isOnboarded = false;
      castUsers[key].onboardingStep = 1;
    }
  }

  const fillers = [];
  for (let i = 0; i < 40; i++) {
    const spec = buildFiller(cfg);
    const u = buildUser(spec, null);
    u._fillIdx = spec._fillIdx;
    fillers.push(u);
  }

  return { castUsers, fillers };
}

// Ordered list of every society user for backdating + lookups.
export function flattenPersonas({ castUsers, fillers }) {
  const out = [];
  for (const key of CAST_ORDER) out.push({ role: key, user: castUsers[key] });
  for (const f of fillers) out.push({ role: null, user: f });
  return out;
}