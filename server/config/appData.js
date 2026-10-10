export const PROMPT_BANK = [
  "My favorite spot to hide on campus...",
  "Meet me at the canteen if...",
  "My ideal night study session includes...",
  "The hostel rule I break most often...",
  "A hot take I have about our college...",
  "Choose me if you want to survive...",
  "Late night chai or early morning library?",
  "My branch in 3 words...",
  "If I could change one campus rule...",
  "My hidden talent...",
  "My vibe is best described as...",
  "I am looking for a partner to run...",
  "Two truths and a lie about me...",
  "The best way to my heart is...",
  "My go-to comfort food after exams...",
  "A cringe thing I still unironically enjoy...",
  "My most irrational pet peeve...",
  "The song that defines my semester...",
  "My toxic trait is...",
  "I'll fall for you if you...",
  "My 3AM thoughts usually go like...",
  "The quickest way to annoy me...",
  "My favorite procrastination method...",
  "What I'm actually looking for on here...",
  "The most impulsive thing I've done...",
  "My idea of a perfect weekend...",
  "I get overly excited about...",
  "The smallest thing that makes my day...",
  "My favourite memory from college so far...",
  "One thing I absolutely cannot live without...",
  "I'm weirdly good at...",
  "I'd swipe right if you want to teach me...",
  "My biggest flex that no one knows about...",
  "The best compliment I've ever received...",
  "A dealbreaker I didn't know I had...",
  "I'm convinced that I should be famous for...",
  "The most chaotic thing that happened in my wing...",
  "My lecture hall survival kit includes...",
  "I'm basically a professional at...",
  "DM me if you can beat my score in...",
  "My type is best described by...",
  "I finally understand why people say..."
];

export const BRANCHES = [
  "Computer Science & Engineering",
  "Mathematics & Computing",
  "Electrical Engineering",
  "Engineering Physics",
  "Mechanical Engineering",
  "Chemical Engineering",
  "Civil Engineering",
  "Aerospace Engineering",
  "Biotechnology",
  "Metallurgical & Materials Engineering",
  "Textile Technology",
  "Other"
];

export const YEARS = [
  "UG",
  "PG"
];

export const GENDERS = [
  "Male",
  "Female",
  "Non-binary",
  "Other"
];

/* Connection intents.
 *
 * "Activity Partner" replaced "Study Buddy" (a rename decided with the user, not
 * a typo fix): "Study Buddy" implies coursework, while the 22 existing interests
 * cover sport, music, gaming, volunteering and the rest, so people are looking
 * for someone to DO something with, not just to study beside.
 *
 * ⚠️ RENAME IS NOT DATA-FREE. Profiles written before the rename still hold
 * "Study Buddy" verbatim, and `intent` is a RANKING SIGNAL — so a stale value
 * silently stops matching anyone who picked "Activity Partner", which looks
 * like broken matchmaking rather than a leftover string. `scripts/migrate-intent-rename.mjs`
 * rewrites stored values; run it once after deploying this. */
export const INTENTS = [
  "Dating",
  "Friends",
  "Activity Partner",
];

/* Retired values kept ONLY so validation can normalise a stale stored value
 * instead of rejecting the profile. Never render these. */
export const DEPRECATED_INTENTS = {
  "Study Buddy": "Activity Partner",
};

export const INTEREST_TAGS = [
  "Chai Walks",
  "Coding",
  "Night Canteen",
  "Anime",
  "Gaming",
  "Photography",
  "Fitness",
  "Music Production",
  "Movies & Chill",
  "Reading",
  "Hackathons",
  "Poetry & Writing",
  "Travel & Trekking",
  "Cricket/Football",
  "Shitposting & Memes",
  "Filter Coffee",
  "Cooking",
  "Startups & Tech",
  "Web3 & Crypto",
  "AI & Robotics",
  "UI/UX Design",
  "Guitar/Instruments"
];

export const PRONOUNS_OPTIONS = [
  "he/him",
  "she/her",
  "they/them",
  "he/they",
  "she/they",
  "xe/xem",
  "ze/zir"
];

export const INTEREST_ICONS = {
  'reading': 'book',
  'books': 'book',
  'music': 'music_note',
  'cooking': 'cooking',
  'baking': 'bakery_dining',
  'travel': 'flight',
  'travelling': 'flight',
  'traveling': 'flight',
  'gaming': 'sports_esports',
  'games': 'sports_esports',
  'art': 'palette',
  'painting': 'brush',
  'drawing': 'brush',
  'sports': 'sports_soccer',
  'football': 'sports_football',
  'soccer': 'sports_soccer',
  'basketball': 'sports_basketball',
  'tennis': 'sports_tennis',
  'cricket': 'sports_cricket',
  'badminton': 'sports_tennis',
  'volleyball': 'sports_volleyball',
  'swimming': 'pool',
  'running': 'directions_run',
  'hiking': 'hiking',
  'trekking': 'hiking',
  'yoga': 'self_improvement',
  'meditation': 'self_improvement',
  'fitness': 'fitness_center',
  'gym': 'fitness_center',
  'workout': 'fitness_center',
  'movies': 'movie',
  'films': 'movie',
  'cinema': 'movie',
  'writing': 'edit',
  'coding': 'code',
  'programming': 'code',
  'technology': 'computer',
  'tech': 'computer',
  'shopping': 'shopping_bag',
  'coffee': 'coffee',
  'food': 'restaurant',
  'dining': 'restaurant',
  'dogs': 'pets',
  'cats': 'pets',
  'pets': 'pets',
  'animals': 'pets',
  'nature': 'park',
  'gardening': 'yard',
  'plants': 'yard',
  'singing': 'mic',
  'karaoke': 'mic',
  'piano': 'piano',
  'guitar': 'music_note',
  'instruments': 'music_note',
  'anime': 'tv',
  'fashion': 'checkroom',
  'camping': 'tent',
  'cycling': 'pedal_bike',
  'biking': 'pedal_bike',
  'chess': 'chess',
  'dancing': 'movement',
  'photography': 'camera_alt',
  'photos': 'camera_alt',
  'sleeping': 'bedtime',
  'napping': 'bedtime',
  'eating': 'ramen_dining',
  'drinking': 'local_bar',
  'partying': 'celebration',
  'clubbing': 'nightlife',
  'skating': 'roller_skating',
  'surfing': 'surfing',
  'skiing': 'downhill_skiing',
  'baseball': 'sports_baseball',
  'golf': 'golf_course',
  'boxing': 'sports_mma',
  'martial arts': 'sports_mma',
  'dance': 'movement',
  'theatre': 'theater_comedy',
  'theater': 'theater_comedy',
  'acting': 'theater_comedy',
  'comedy': 'theater_comedy',
  'standup': 'theater_comedy',
  'podcasts': 'podcasts',
  'astrology': 'auto_awesome',
  'star gazing': 'auto_awesome',
  'stargazing': 'auto_awesome',
  'astronomy': 'auto_awesome',
  'volunteering': 'volunteer_activism',
  'social work': 'volunteer_activism',
  'environment': 'eco',
  'sustainability': 'eco',
  'cars': 'directions_car',
  'driving': 'directions_car',
  'motorcycles': 'motorcycle',
  'bikes': 'motorcycle',
  'poetry': 'auto_stories',
  'history': 'history',
  'philosophy': 'psychology',
  'psychology': 'psychology',
  'science': 'science',
  'math': 'calculate',
  'mathematics': 'calculate',
  'board games': 'board_game',
  'cards': 'playing_cards',
  'video editing': 'videocam',
  'editing': 'videocam',
  'design': 'design_services',
  'graphic design': 'design_services',
  'ui design': 'design_services',
  '3d modeling': '3d_rotation',
};

export const INTEREST_ICON_FALLBACKS = [
  'star', 'favorite', 'bolt', 'eco', 'spa', 'whatshot', 'explore',
  'auto_awesome', 'celebration', 'dark_mode', 'light_mode', 'grain',
  'blur_on', 'flash_on', 'wb_sunny', 'nightlight', 'palette',
  'rocket_launch', 'globe', 'water_drop', 'earthquake', 'wind_power'
];

export const COLLEGE_MAP = {
  iitd: 'IIT Delhi',
  iitb: 'IIT Bombay',
  iitk: 'IIT Kanpur',
  iitkgp: 'IIT Kharagpur',
  iitm: 'IIT Madras',
  iitr: 'IIT Roorkee',
  iitg: 'IIT Guwahati',
  iith: 'IIT Hyderabad',
  iitbhu: 'IIT BHU',
  iitism: 'IIT ISM Dhanbad',
};

export const APP_CONSTANTS = {
  // Single source of truth for the auth cookie name. Used by the auth
  // middleware, admin middleware, auth routes, and the socket handshake —
  // it used to be hardcoded in all five places.
  AUTH_COOKIE_NAME: 'matchalize_jwt',
  /* Raised from 6 to 10. The interest list has 22 tags across sport, music,
   * games, volunteering and study — six could not express a personality, and a
   * capped picker makes people pick the first few visible rather than the ones
   * that fit. Must stay in sync with the client's own cap in Onboarding.jsx and
   * Profile.jsx, or the UI will offer options the server then rejects. */
  MAX_INTERESTS: 10,
  /* ⚠️ NO MAX_INTENTS. There was one (2) and it was removed.
   *
   * The original argument was that intent is a ranking signal, so a profile
   * claiming all three matches everyone and stops discriminating. That is true of
   * the first slice and irrelevant by the second: with only three options,
   * holding all three is very close to saying "no preference", which is an
   * honest answer rather than a contradictory one. Someone who names one
   * specific goal still ranks above someone who named three — which is all the
   * signal was ever for.
   *
   * A cap also carried a real cost: a person who genuinely is open to all three
   * had to lie about one to save the deck, and a user who picked a third chip and
   * watched it silently not stick had no way to tell that from a bug.
   *
   * Nothing enforces a limit now. routes/users.js normalises intent by mapping
   * retired values and de-duplicating, and that is all it does. */
/* ⚠️ PHOTO LIMIT IS NOT HERE. It used to be `PHOTO_LIMIT: 6` in this object,
   and that constant was DEAD — nothing in the server or the client ever read
   it. The real limit is `MAX_PHOTOS = 4` in utils/ladder.js, enforced on the
   two write paths in routes/users.js, and the client renders exactly four photo
   slots. So the app has always allowed four photos while this file claimed six.

   Left as a comment rather than silently deleted, because the failure it caused
   was believing: anyone reasoning about photo limits from this config would
   have drawn the wrong conclusion, and 5th and 6th uploads would have looked
   like a missing feature rather than a number that was never enforced.

   Anyone genuinely open to all three can say so. Someone who names one still
   ranks above someone who names all three, which is what the signal was for. */
  IMAGE_MAX_DIM: 800,
  IMAGE_JPEG_QUALITY: 0.7,
  DECK_SIZE: 10,
  OTP_EXPIRY_MINUTES: 10,
  // Real values for the /api/ limiter in index.js. These used to be a lie —
  // the file said 100/15min while the code enforced 2000/min and never read
  // this file at all.
  // Generous on purpose: campus NAT means a whole hostel shares one public IP,
  // so a tight limit locks out a building. The old limit was 2000/min, i.e.
  // 10,000 per 5-minute window against this file's 1,000 per 5 minutes — 10x
  // tighter sustained, and 2x tighter on a single-minute burst (2000 vs 1000).
  // Override with API_GENERAL_MAX, no code change needed.
  API_RATE_LIMIT_MAX: 1000,
  API_RATE_LIMIT_WINDOW_MINUTES: 5,
};
