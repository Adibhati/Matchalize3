export const COMPAT_QUESTIONS = [
  {
    id: 'group_project',
    question: 'Your group project strategy?',
    options: [
      { key: 'carry', label: 'Carry the team' },
      { key: 'vanish', label: 'Do my part & vanish' },
      { key: 'help', label: 'Ask for help' },
      { key: 'wing', label: 'Wing it' },
    ],
  },
  {
    id: 'weekend',
    question: "What's your ideal weekend?",
    options: [
      { key: 'out', label: 'Going out' },
      { key: 'in', label: 'Staying in' },
      { key: 'study', label: 'Studying' },
      { key: 'adventure', label: 'Adventure' },
    ],
  },
  {
    id: 'conflict',
    question: 'How do you handle conflict?',
    options: [
      { key: 'talk', label: 'Talk it out' },
      { key: 'space', label: 'Need space' },
      { key: 'avoid', label: 'Avoid it' },
      { key: 'loud', label: 'Get loud then apologize' },
    ],
  },
  {
    id: 'first_date',
    question: 'Your ideal first date?',
    options: [
      { key: 'chai', label: 'Chai at canteen' },
      { key: 'walk', label: 'Walk around campus' },
      { key: 'movie', label: 'Movie night' },
      { key: 'trip', label: 'Adventure trip' },
    ],
  },
  {
    id: 'social',
    question: 'How social are you?',
    options: [
      { key: 'very', label: 'Very social' },
      { key: 'small', label: 'Small circles' },
      { key: 'home', label: 'Homebody' },
      { key: 'depends', label: 'Depends' },
    ],
  },
  {
    id: 'comm_style',
    question: "What's your communication style?",
    options: [
      { key: 'frequent', label: 'Frequent messages' },
      { key: 'deep', label: 'Few but deep' },
      { key: 'meme', label: 'Meme sender' },
      { key: 'call', label: 'Call person' },
    ],
  },
  {
    id: 'looking_for',
    question: 'What are you looking for?',
    options: [
      { key: 'serious', label: 'Something serious' },
      { key: 'see', label: "Let's see where it goes" },
      { key: 'friends', label: 'Just friends' },
      { key: 'unsure', label: 'Not sure yet' },
    ],
  },
];

// Similarity matrix: 1.0 = same, 0.6 = similar, 0.2 = different
const SIMILAR = 0.6;
const DIFFERENT = 0.2;

export const COMPAT_MATRIX = {
  group_project: {
    carry:  { carry: 1, vanish: SIMILAR, help: DIFFERENT, wing: DIFFERENT },
    vanish: { carry: SIMILAR, vanish: 1, help: DIFFERENT, wing: SIMILAR },
    help:   { carry: DIFFERENT, vanish: DIFFERENT, help: 1, wing: SIMILAR },
    wing:   { carry: DIFFERENT, vanish: SIMILAR, help: SIMILAR, wing: 1 },
  },
  weekend: {
    out:       { out: 1, in: DIFFERENT, study: DIFFERENT, adventure: SIMILAR },
    in:        { out: DIFFERENT, in: 1, study: SIMILAR, adventure: DIFFERENT },
    study:     { out: DIFFERENT, in: SIMILAR, study: 1, adventure: DIFFERENT },
    adventure: { out: SIMILAR, in: DIFFERENT, study: DIFFERENT, adventure: 1 },
  },
  conflict: {
    talk:  { talk: 1, space: SIMILAR, avoid: DIFFERENT, loud: DIFFERENT },
    space: { talk: SIMILAR, space: 1, avoid: DIFFERENT, loud: DIFFERENT },
    avoid: { talk: DIFFERENT, space: DIFFERENT, avoid: 1, loud: SIMILAR },
    loud:  { talk: DIFFERENT, space: DIFFERENT, avoid: SIMILAR, loud: 1 },
  },
  first_date: {
    chai:  { chai: 1, walk: SIMILAR, movie: DIFFERENT, trip: DIFFERENT },
    walk:  { chai: SIMILAR, walk: 1, movie: DIFFERENT, trip: SIMILAR },
    movie: { chai: DIFFERENT, walk: DIFFERENT, movie: 1, trip: SIMILAR },
    trip:  { chai: DIFFERENT, walk: SIMILAR, movie: SIMILAR, trip: 1 },
  },
  social: {
    very:    { very: 1, small: DIFFERENT, home: DIFFERENT, depends: SIMILAR },
    small:   { very: DIFFERENT, small: 1, home: SIMILAR, depends: DIFFERENT },
    home:    { very: DIFFERENT, small: SIMILAR, home: 1, depends: DIFFERENT },
    depends: { very: SIMILAR, small: DIFFERENT, home: DIFFERENT, depends: 1 },
  },
  comm_style: {
    frequent: { frequent: 1, deep: DIFFERENT, meme: SIMILAR, call: SIMILAR },
    deep:     { frequent: DIFFERENT, deep: 1, meme: DIFFERENT, call: SIMILAR },
    meme:     { frequent: SIMILAR, deep: DIFFERENT, meme: 1, call: DIFFERENT },
    call:     { frequent: SIMILAR, deep: SIMILAR, meme: DIFFERENT, call: 1 },
  },
  looking_for: {
    serious:  { serious: 1, see: SIMILAR, friends: DIFFERENT, unsure: DIFFERENT },
    see:      { serious: SIMILAR, see: 1, friends: DIFFERENT, unsure: SIMILAR },
    friends:  { serious: DIFFERENT, see: DIFFERENT, friends: 1, unsure: SIMILAR },
    unsure:   { serious: DIFFERENT, see: SIMILAR, friends: SIMILAR, unsure: 1 },
  },
};

/**
 * Compute compatibility score between two users' answers.
 * @param {Array} answersA - [{question: 'group_project', answer: 'carry'}, ...]
 * @param {Array} answersB - [{question: 'group_project', answer: 'wing'}, ...]
 * @returns {number} Score 0-100
 */
export function computeCompatibility(answersA, answersB) {
  if (!answersA?.length || !answersB?.length) return null;

  let total = 0;
  let matched = 0;

  for (const q of COMPAT_QUESTIONS) {
    const aA = answersA.find(a => a.question === q.id);
    const aB = answersB.find(a => a.question === q.id);
    if (aA && aB && COMPAT_MATRIX[q.id]?.[aA.answer]?.[aB.answer] != null) {
      total += COMPAT_MATRIX[q.id][aA.answer][aB.answer];
      matched++;
    }
  }

  if (matched === 0) return null;
  return Math.round((total / matched) * 100);
}

/**
 * Get match breakdown for top 3 most interesting areas.
 * @param {Array} answersA
 * @param {Array} answersB
 * @returns {Array} [{question, answerA, answerB, score}, ...]
 */
export function getCompatBreakdown(answersA, answersB) {
  if (!answersA?.length || !answersB?.length) return [];

  const breakdown = [];
  for (const q of COMPAT_QUESTIONS) {
    const aA = answersA.find(a => a.question === q.id);
    const aB = answersB.find(a => a.question === q.id);
    if (aA && aB && COMPAT_MATRIX[q.id]?.[aA.answer]?.[aB.answer] != null) {
      const score = COMPAT_MATRIX[q.id][aA.answer][aB.answer];
      const labelA = q.options.find(o => o.key === aA.answer)?.label || aA.answer;
      const labelB = q.options.find(o => o.key === aB.answer)?.label || aB.answer;
      breakdown.push({
        question: q.question,
        answerA: labelA,
        answerB: labelB,
        score,
      });
    }
  }

  // Sort by score descending, return top 3
  return breakdown.sort((a, b) => b.score - a.score).slice(0, 3);
}
