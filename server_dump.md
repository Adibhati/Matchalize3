# Matchalize — Server Codebase Dump

> Verbatim contents of all server source and configuration files.
> Generated Thu Aug 20 21:26:49 IST 2026.
> Excludes: .env, node_modules/, uploads/, dist/, build/, and package-lock.json.


## Server Source


### ./server/package.json

```
{
  "name": "matchalize-server",
  "version": "1.0.0",
  "description": "Backend server for Matchalize campus dating app",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon --watch index.js --watch config --watch middleware --watch models --watch routes --watch socket --watch utils index.js"
  },
  "dependencies": {
    "@sentry/node": "^10.66.0",
    "@sentry/profiling-node": "^10.66.0",
    "cloudinary": "^2.2.0",
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "express-mongo-sanitize": "^2.2.0",
    "express-rate-limit": "^7.3.1",
    "express-validator": "^7.1.0",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.4.3",
    "multer": "^1.4.5-lts.1",
    "multer-storage-cloudinary": "^4.0.0",
    "nodemailer": "^6.9.14",
    "socket.io": "^4.7.5",
    "web-push": "^3.6.7"
  },
  "devDependencies": {
    "nodemon": "^3.1.4"
  }
}

```

### ./server/config/appData.js

```
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
  "Freshies",
  "Sophies",
  "Thirdies",
  "Fourthies",
  "Fifthies (Dual/PG)"
];

export const GENDERS = [
  "Male",
  "Female",
  "Non-binary",
  "Other"
];

export const INTENTS = [
  "Dating",
  "Friends",
  "Study Buddy"
];

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
  PHOTO_LIMIT: 6,
  MAX_INTERESTS: 6,
  MIN_AGE: 18,
  MAX_AGE: 40,
  IMAGE_MAX_DIM: 800,
  IMAGE_JPEG_QUALITY: 0.7,
  DECK_SIZE: 10,
  DEFAULT_AGE_RANGE: { min: 18, max: 30 },
  OTP_EXPIRY_MINUTES: 10,
  OTP_RATE_LIMIT_HOURLY: 5,
  API_RATE_LIMIT: 100,
  API_RATE_LIMIT_WINDOW_MINUTES: 15,
};

```

### ./server/config/cloudinary.js

```
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * 🧹 CLOUDINARY CLEANUP HELPER
 * Extracts the public_id from a Cloudinary URL and permanently destroys the file from cloud storage.
 */
export const deleteCloudinaryFile = async (url) => {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) return;
  try {
    // Matches path after /upload/(v12345/)? up to the file extension
    const match = url.match(/\/upload\/(?:v\d+\/)?([^\.]+)/);
    if (match && match[1]) {
      const publicId = match[1];
      const isAudioOrVideo = /\.(webm|mp3|wav|mp4|m4a)$/i.test(url);
      
      await cloudinary.uploader.destroy(publicId, {
        resource_type: isAudioOrVideo ? 'video' : 'image',
      });
      console.log(`[Cloudinary Cleanup] Destroyed orphaned artifact: ${publicId}`);
    }
  } catch (err) {
    console.error('[Cloudinary Cleanup Error]:', err.message || err);
  }
};

export default cloudinary;

```

### ./server/config/compatQuestions.js

```
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

```

### ./server/config/db.js

```
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;

```

### ./server/index.js

```
import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import dotenv from 'dotenv';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { AppError } from './utils/AppError.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Config
import connectDB from './config/db.js';
import { socketHandler } from './socket/chat.js';

// Routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import discoverRoutes from './routes/discover.js';
import matchRoutes from './routes/matches.js';
import messageRoutes from './routes/messages.js';
import configRoutes from './routes/config.js';
import adminRoutes from './routes/admin.js';
import uploadRoutes from './routes/upload.js';
import notificationRoutes from './routes/notifications.js';
import reportRoutes from './routes/report.js';

dotenv.config();

// Initialize Sentry (must run after dotenv.config so SENTRY_DSN is loaded)
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [nodeProfilingIntegration(), Sentry.expressIntegration()],
    tracesSampleRate: 0.2,
    profilesSampleRate: 0.2,
  });
}

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Warn about missing optional services
if (!process.env.SENDGRID_API_KEY) {
  console.warn('⚠️  SendGrid API key not configured — OTP codes will be logged to console only (users won\'t receive emails)');
}
if (!process.env.CLOUDINARY_CLOUD_NAME) {
  console.warn('⚠️  Cloudinary not configured — photo uploads will fail');
}
if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  console.warn('⚠️  VAPID keys not configured — web push notifications will be disabled');
}
if (process.env.ALLOW_ALL_EMAILS !== 'true') {
  console.log('🔒 Email domain restricted to .ac.in addresses only');
} else {
  console.warn('⚠️  ALLOW_ALL_EMAILS=true — any email domain can sign up. Set to false in production.');
}

// Connect to Database
connectDB();

const app = express();
app.set('trust proxy', 1);
const server = http.createServer(app);

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// 🔒 STRICT CORS WHITELIST: Prevents unauthorized third-party apps from making credentialed requests
const corsOrigins = new Set([
  FRONTEND_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);

const corsOriginFunction = (origin, callback) => {
  // Allow requests with no origin (mobile apps, curl, or local dev)
  if (!origin || process.env.NODE_ENV === 'development') return callback(null, true);

  if (corsOrigins.has(origin)) {
    return callback(null, true);
  }

  // Automatically allow local network IPs (LAN/Wi-Fi) during development & testing
  if (origin.startsWith('http://10.') || origin.startsWith('http://192.168.') || origin.startsWith('http://172.')) {
    return callback(null, true);
  }

  console.warn(`[CORS Blocked] Unauthorized origin attempted connection: ${origin}`);
  callback(new Error('Not allowed by CORS'));
};

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: corsOriginFunction,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Attach socket server to express app so it can be accessed in routing files
app.set('io', io);

// Configure Socket event handlers
socketHandler(io);

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // REMOVED 'unsafe-eval' to block eval() execution.
      // 'unsafe-inline' is retained temporarily due to <style> tags in React components.
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'data:', 'https://*.cloudinary.com', 'https://images.unsplash.com', 'https://res.cloudinary.com'],
      connectSrc: [
        "'self'", 
        'http://localhost:*', 'ws://localhost:*', 
        'http://127.0.0.1:*', 'ws://127.0.0.1:*',
        'http://10.*:*', 'ws://10.*:*',
        'http://192.168.*:*', 'ws://192.168.*:*',
        'http://172.*:*', 'ws://172.*:*',
        'https://*.onrender.com', 'wss://*.onrender.com'
      ],

      // NEW DEFENSIVE DIRECTIVES
      frameAncestors: ["'self'"], // Prevents clickjacking
      formAction: ["'self'"],     // Prevents form hijacking
      baseUri: ["'self'"],        // Prevents base tag injection
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  originAgentCluster: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: corsOriginFunction,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  exposedHeaders: ['x-new-token'],
}));
app.use(cookieParser());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));
app.use(mongoSanitize());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 500,
  message: { message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/discover', discoverRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/config', configRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/report', reportRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve production client build
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));

// Base Status Route
app.get('/', (req, res) => {
  res.json({ status: 'active', message: 'Matchalize API Server is running' });
});

// Serve client app for all non-API routes (SPA fallback)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) next();
  });
});

// Sentry error handler (v8+ API; must be after routes, before the generic handler)
if (process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

// Centralized Error Handler
app.use((err, req, res, next) => {
  // 1. If it's our custom AppError, send the structured response
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
    });
  }

  // 2. If it's an unexpected crash, log to Sentry and send a generic 500
  console.error('💥 UNEXPECTED ERROR:', err);
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(err);
  }
  
  res.status(500).json({
    success: false,
    message: 'The archival ledger encountered an unexpected tear. Please try again.',
    code: 'INTERNAL_SERVER_ERROR',
  });
});

// Start Server
const PORT = process.env.PORT || 5005;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

```

### ./server/middleware/admin.js

```
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const COOKIE_NAME = 'matchalize_jwt';

export const adminProtect = async (req, res, next) => {
  let token = null;
  if (req.cookies && req.cookies[COOKIE_NAME]) {
    token = req.cookies[COOKIE_NAME];
  } else if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('email name suspended isDeleted').lean();

    if (!user) return res.status(401).json({ message: 'User not found' });
    if (user.suspended) return res.status(403).json({ message: 'Account suspended' });
    if (user.isDeleted) return res.status(403).json({ message: 'Account deleted' });

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      console.error('ADMIN_EMAIL not set in .env — admin routes are disabled');
      return res.status(503).json({ message: 'Admin access not configured' });
    }

    if (user.email.toLowerCase() !== adminEmail.toLowerCase()) {
      return res.status(403).json({ message: 'Not an admin' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Admin auth error:', error.message);
    return res.status(401).json({ message: 'Token invalid' });
  }
};

```

### ./server/middleware/auth.js

```
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const COOKIE_NAME = 'matchalize_jwt';
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Extracts the JWT from httpOnly cookie (primary) or Authorization header (fallback).
 */
const extractToken = (req) => {
  if (req.cookies && req.cookies[COOKIE_NAME]) {
    return req.cookies[COOKIE_NAME];
  }
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    return req.headers.authorization.split(' ')[1];
  }
  return null;
};

/**
 * Sets the JWT as an httpOnly cookie. Called on login and token refresh.
 */
export const setAuthCookie = (res, token) => {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

/**
 * Clears the auth cookie. Called on logout.
 */
export const clearAuthCookie = (res) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/',
  });
};

export const protect = async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    // SUSPENDED CHECK: Reject suspended users immediately on every request
    if (req.user.suspended) {
      return res.status(403).json({ message: 'Account suspended. Please contact support.', suspended: true });
    }

    // DELETED CHECK: Reject soft-deleted users on every request
    if (req.user.isDeleted) {
      return res.status(403).json({ message: 'Account has been deleted.', deleted: true });
    }

    // MULTI-DEVICE CHECK: Reject tokens issued before the last global logout
    const issuedAt = decoded.iat * 1000;
    if (req.user.lastLogoutAt && issuedAt < req.user.lastLogoutAt.getTime()) {
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }

    // SLIDING EXPIRATION: If token is older than 6 days, issue a new one
    const sixDaysMs = 6 * 24 * 60 * 60 * 1000;
    if (Date.now() - issuedAt > sixDaysMs) {
      const newToken = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      setAuthCookie(res, newToken);
      res.setHeader('x-new-token', newToken);
    }

    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

```

### ./server/middleware/blockFilter.js

```
import Block from '../models/Block.js';

/**
 * Returns a MongoDB query fragment that excludes blocked users
 * from any query that fetches users by _id.
 *
 * @param {ObjectId} userId - The authenticated user's ID
 * @returns {Promise<Object>} - Query fragment like { _id: { $nin: [...] } }
 */
export async function getBlockExclusionQuery(userId) {
  const blocks = await Block.find({
    $or: [{ blocker: userId }, { blocked: userId }],
  }).lean();

  const blockedIds = blocks.map((b) =>
    b.blocker.toString() === userId.toString() ? b.blocked : b.blocker
  );

  if (blockedIds.length === 0) return {};
  return { _id: { $nin: blockedIds } };
}

/**
 * Checks if two specific users have a block relationship.
 *
 * @param {ObjectId} userA
 * @param {ObjectId} userB
 * @returns {Promise<boolean>}
 */
export async function areBlocked(userA, userB) {
  const block = await Block.findOne({
    $or: [
      { blocker: userA, blocked: userB },
      { blocker: userB, blocked: userA },
    ],
  });
  return !!block;
}

```

### ./server/middleware/rateLimiters.js

```
import rateLimit from 'express-rate-limit';

// Limit message sending to 30 messages per 10 minutes per user
export const messageLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  message: { message: 'Too many messages sent. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limit discover actions (likes/passes) to 100 per 10 minutes per user
export const discoverLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  message: { message: 'Too many actions. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limit OTP verification attempts to prevent brute-force and DoS
// 15 attempts per 15 minutes per IP address.
// This allows a small group on shared Wi-Fi to make typos, but stops automated scripts dead.
export const verifyOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  keyGenerator: (req) => req.ip,
  message: { 
    message: 'Too many verification attempts. Please wait 15 minutes before trying again.' 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limit OTP requests by IP to prevent spamming across multiple emails
export const otpIpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.ip,
  message: { message: 'Too many verification requests from this network. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

```

### ./server/middleware/validate.js

```
import { body, validationResult } from 'express-validator';

export { body };

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
```

### ./server/models/Analytics.js

```
import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    event: {
      type: String,
      required: true,
      enum: ['ONBOARDING_STEP', 'ONBOARDING_COMPLETE', 'ONBOARDING_ABANDONED'],
    },
    step: {
      type: Number,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Analytics', analyticsSchema);
```

### ./server/models/Block.js

```
import mongoose from 'mongoose';

const blockSchema = new mongoose.Schema({
  blocker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  blocked: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

blockSchema.index({ blocker: 1, blocked: 1 }, { unique: true });

const Block = mongoose.model('Block', blockSchema);
export default Block;

```

### ./server/models/Interaction.js

```
import mongoose from 'mongoose';

const interactionSchema = new mongoose.Schema(
  {
    actorId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    targetId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    actionType: { 
      type: String, 
      enum: ['archive', 'letter', 'seal_stamp', 'accept_letter', 'accept_seal'], 
      required: true 
    },
    targetArtifact: { 
      type: String, 
      default: null 
      // e.g., 'photo_1', 'whisper_0' - stores exactly what they tapped
    },
    letterContent: { 
      type: String, 
      maxlength: 140, 
      default: null 
    },
    cooldownExpiresAt: { 
      type: Date, 
      default: null 
      // Powered by our 7-day re-queue logic for passed profiles (Interaction History)
    },
  },
  {
    timestamps: true,
  }
);

// High-performance compound indexes for building the Discover deck instantly
interactionSchema.index({ actorId: 1, targetId: 1 });
interactionSchema.index({ actorId: 1, cooldownExpiresAt: 1 });
interactionSchema.index(
  { actorId: 1, actionType: 1, createdAt: -1 },
  { name: 'daily_limit_query_index' }
);
interactionSchema.index({ targetId: 1, actionType: 1 });

const Interaction = mongoose.model('Interaction', interactionSchema);
export default Interaction;

```

### ./server/models/Match.js

```
import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema(
  {
    pairKey: {
      type: String,
      required: true,
      unique: true,
      // Always formatted as 'LowerObjectId__HigherObjectId'
    },
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    unlockedByInteractionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interaction',
      required: true,
      // Points back to the exact letter that sparked the match
    },
  },
  {
    timestamps: true,
  }
);

matchSchema.index({ users: 1, isActive: 1 });

const Match = mongoose.model('Match', matchSchema);
export default Match;

```

### ./server/models/Message.js

```
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match',
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['text', 'image', 'opening_letter', 'audio'],
      default: 'text',
    },
    text: {
      type: String,
      trim: true,
      default: '',
    },
    clientMsgId: {
      type: String,
      unique: true,
      sparse: true,
    },
    image: {
      type: String,
      default: '',
    },
    mediaUrl: {
      type: String,
      default: '',
    },
    caption: {
      type: String,
      default: '',
    },
    deliveryStatus: {
      type: String,
      enum: ['pending', 'sent', 'read'],
      default: 'sent',
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    reactions: [
      {
        emoji: { type: String, required: true },
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      },
    ],
    deleted: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ matchId: 1, createdAt: 1 });
// 🚀 COLLISION-PROOF PAGINATION: Instant ObjectId-based cursor queries
messageSchema.index({ matchId: 1, _id: -1 });

// Speeds up moderation queries and global user cleanup operations
messageSchema.index({ senderId: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);
export default Message;

```

### ./server/models/Notification.js

```
import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['new_letter', 'priority_seal'],
      required: true,
    },
    interactionRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interaction',
      required: true,
      // Links to the exact letter and photo they liked
    },
    isCleared: {
      type: Boolean,
      default: false,
      // Flips to true the moment they hit [Accept] or [Archive]
    },
  },
  {
    timestamps: true,
  }
);

// Extremely fast lookup for the active Instagram-style tray
notificationSchema.index({ recipientId: 1, isCleared: 1, createdAt: -1 });

// Auto-delete cleared notifications after 30 days to prevent database bloat
notificationSchema.index(
  { createdAt: 1 }, 
  { 
    expireAfterSeconds: 30 * 24 * 60 * 60,
    partialFilterExpression: { isCleared: true } 
  }
);

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;

```

### ./server/models/OTP.js

```
import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    otp: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // Document will expire at the specified date
    },
    attempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for rate limiting queries (find by email within last hour)
otpSchema.index({ email: 1, createdAt: 1 });

const OTP = mongoose.model('OTP', otpSchema);
export default OTP;

```

### ./server/models/Report.js

```
import mongoose from 'mongoose';

export const REPORT_REASONS = [
  'Inappropriate photos',
  'Harassment or bullying',
  'Fake profile or spam',
  'Underage user',
  'Other',
];

const reportSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reported: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, enum: REPORT_REASONS, required: true },
  details: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'dismissed', 'actioned'],
    default: 'pending',
  },
  createdAt: { type: Date, default: Date.now },
});

reportSchema.index({ reporter: 1, reported: 1 }, { unique: true });

const Report = mongoose.model('Report', reportSchema);
export default Report;

```

### ./server/models/Setting.js

```
import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      unique: true,
      required: true,
      enum: ['appConfig'], // Can be expanded later
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Setting', settingSchema);
```

### ./server/models/User.js

```
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    college: {
      type: String,
      default: '',
    },
    collegeCode: {
      type: String,
      default: '',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isOnboarded: {
      type: Boolean,
      default: false,
    },
    name: {
      type: String,
      trim: true,
      default: '',
    },
    age: {
      type: Number,
      default: null,
    },
    gender: {
      type: String,
      default: '',
    },
    pronouns: {
      type: String,
      trim: true,
      default: '',
    },
    branch: {
      type: String,
      default: '',
    },
    year: {
      type: String,
      default: '',
    },
    hostel: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      trim: true,
      default: '',
    },
    bioPhoto: {
      type: String,
      default: '',
    },
    prompts: [
      {
        question: String,
        answer: String,
        photoUrl: String,
      },
    ],
    photos: {
      type: [String],
      default: [],
    },
    intent: {
      type: [String],
      default: [],
    },
    interestedIn: {
      type: [String],
      default: [],
    },
    ageRange: {
      min: {
        type: Number,
        default: 18,
      },
      max: {
        type: Number,
        default: 30,
      },
    },
    interests: {
      type: [String],
      default: [],
    },
    compatAnswers: {
      type: [
        {
          question: { type: String, required: true },
          answer: { type: String, required: true },
        },
      ],
      default: [],
    },
    onboardingStep: {
      type: Number,
      default: 1,
    },
    onboardingData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    lastLogoutAt: {
      type: Date,
      default: null,
    },
    pushSubscription: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    suspended: {
      type: Boolean,
      default: false,
    },
    suspendedAt: {
      type: Date,
      default: null,
    },
    suspendedReason: {
      type: String,
      default: '',
    },
    isGhost: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    // Report system — shadowban fields
    shadowbanScore: {
      type: Number,
      default: 0,
    },
    shadowbannedAt: {
      type: Date,
      default: null,
    },
    contentFrozen: {
      type: Boolean,
      default: false,
    },
    adminNotes: {
      type: String,
      default: '',
    },
    // 🚀 DETERMINISTIC SEED: Allows instant indexed random sampling without $sample
    randomSeed: {
      type: Number,
      default: () => Math.random(),
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ name: 'text', email: 'text' });
userSchema.index(
  { collegeCode: 1, isOnboarded: 1, isGhost: 1, isVerified: 1, suspended: 1, isDeleted: 1, shadowbannedAt: 1, randomSeed: 1 },
  { name: 'discover_deck_filter_index' }
);

const User = mongoose.model('User', userSchema);
export default User;

```

### ./server/routes/admin.js

```
import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Report from '../models/Report.js';
import Match from '../models/Match.js';
import Message from '../models/Message.js';
import Setting from '../models/Setting.js';
import { adminProtect } from '../middleware/admin.js';

const router = express.Router();
router.use(adminProtect);

// ─── Helpers ───
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const VALID_REPORT_STATUSES = ['pending', 'reviewed', 'dismissed', 'actioned'];

// ─── STATS ───
router.get('/stats', async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const [totalUsers, newToday, active7d, active30d, pendingReports, activeBans, ghostUsers] = await Promise.all([
      User.countDocuments({ isDeleted: false }),
      User.countDocuments({ isDeleted: false, createdAt: { $gte: todayStart } }),
      User.countDocuments({ isDeleted: false, lastActive: { $gte: sevenDaysAgo } }),
      User.countDocuments({ isDeleted: false, lastActive: { $gte: thirtyDaysAgo } }),
      Report.countDocuments({ status: 'pending' }),
      User.countDocuments({ isDeleted: false, suspended: true }),
      User.countDocuments({ isDeleted: false, isGhost: true }),
    ]);

    res.json({
      totalUsers,
      newToday,
      active7d,
      active30d,
      pendingReports,
      activeBans,
      activeShadowbans: ghostUsers,
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

// ─── REPORTS ───
router.get('/reports', async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const perPage = Math.min(Number(req.query.perPage) || 15, 100);
    const { status, search, reason } = req.query;
    const skip = (page - 1) * perPage;

    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (reason && reason !== 'all') filter.reason = reason;

    if (search) {
      const safeSearch = escapeRegex(search);
      const searchUsers = await User.find({
        $or: [
          { name: { $regex: safeSearch, $options: 'i' } },
          { email: { $regex: safeSearch, $options: 'i' } },
        ],
      }).select('_id').lean();
      const userIds = searchUsers.map(u => u._id);
      filter.$or = [
        { reporter: { $in: userIds } },
        { reported: { $in: userIds } },
      ];
    }

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .populate('reporter', 'name email photos')
        .populate('reported', 'name email photos suspended isGhost')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPage)
        .lean(),
      Report.countDocuments(filter),
    ]);

    const reportedIds = [...new Set(reports.map(r => r.reported?._id?.toString()))];
    const reportCounts = {};
    if (reportedIds.length) {
      const counts = await Report.aggregate([
        { $match: { reported: { $in: reportedIds }, status: { $ne: 'dismissed' } } },
        { $group: { _id: '$reported', count: { $sum: 1 } } },
      ]);
      counts.forEach(c => { reportCounts[c._id.toString()] = c.count; });
    }

    const data = reports.map(r => ({
      _id: r._id,
      reporter: {
        name: r.reporter?.name || 'Unknown',
        email: r.reporter?.email || '',
        photo: r.reporter?.photos?.[0] || '',
      },
      reported: {
        name: r.reported?.name || 'Unknown',
        email: r.reported?.email || '',
        photo: r.reported?.photos?.[0] || '',
        suspended: r.reported?.suspended || false,
        shadowbanned: r.reported?.isGhost || false,
        reportCount: reportCounts[r.reported?._id?.toString()] || 0,
      },
      reason: r.reason,
      details: r.details,
      status: r.status,
      createdAt: r.createdAt,
    }));

    res.json({
      data,
      pagination: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
    });
  } catch (err) {
    console.error('Admin reports error:', err);
    res.status(500).json({ message: 'Failed to fetch reports' });
  }
});

router.put('/reports/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid report ID' });
    }

    const { status } = req.body;
    if (status && !VALID_REPORT_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${VALID_REPORT_STATUSES.join(', ')}` });
    }

    const update = {};
    if (status) update.status = status;

    const report = await Report.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!report) return res.status(404).json({ message: 'Report not found' });

    res.json({ message: 'Report updated', report });
  } catch (err) {
    console.error('Admin report update error:', err);
    res.status(500).json({ message: 'Failed to update report' });
  }
});

router.put('/reports/bulk', async (req, res) => {
  try {
    const { ids, status } = req.body;
    if (!Array.isArray(ids) || !ids.length || !status) {
      return res.status(400).json({ message: 'ids (array) and status required' });
    }
    if (ids.some(id => !mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({ message: 'One or more invalid report IDs' });
    }
    if (!VALID_REPORT_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${VALID_REPORT_STATUSES.join(', ')}` });
    }
    await Report.updateMany(
      { _id: { $in: ids } },
      { $set: { status } }
    );
    res.json({ message: `${ids.length} reports updated to ${status}` });
  } catch (err) {
    console.error('Admin bulk update error:', err);
    res.status(500).json({ message: 'Failed to bulk update' });
  }
});

// ─── USERS ───
router.get('/users', async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const perPage = Math.min(Number(req.query.perPage) || 15, 100);
    const { status, search } = req.query;
    const skip = (page - 1) * perPage;

    const filter = { isDeleted: false };
    if (status === 'active') { filter.suspended = false; filter.isGhost = false; }
    else if (status === 'suspended') filter.suspended = true;
    else if (status === 'shadowbanned') filter.isGhost = true;

    if (search) {
      const safeSearch = escapeRegex(search);
      filter.$or = [
        { name: { $regex: safeSearch, $options: 'i' } },
        { email: { $regex: safeSearch, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('name email college branch year gender photos suspended suspendedReason isGhost isDeleted lastActive createdAt adminNotes')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPage)
        .lean(),
      User.countDocuments(filter),
    ]);

    const userIds = users.map(u => u._id);
    const reportCounts = {};
    if (userIds.length) {
      const counts = await Report.aggregate([
        { $match: { reported: { $in: userIds } } },
        { $group: {
          _id: '$reported',
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        } },
      ]);
      counts.forEach(c => { reportCounts[c._id.toString()] = c; });
    }

    const data = users.map(u => ({
      ...u,
      reportStats: {
        count: reportCounts[u._id.toString()]?.total || 0,
        pendingCount: reportCounts[u._id.toString()]?.pending || 0,
      },
    }));

    res.json({
      data,
      pagination: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
    });
  } catch (err) {
    console.error('Admin users error:', err);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-compatAnswers -onboardingData -pushSubscription')
      .lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    const reportCount = await Report.countDocuments({ reported: user._id });
    const pendingReports = await Report.countDocuments({ reported: user._id, status: 'pending' });
    const matchCount = await Match.countDocuments({ users: user._id, isActive: true });

    res.json({
      ...user,
      reportStats: { count: reportCount, pendingCount: pendingReports },
      matchCount,
    });
  } catch (err) {
    console.error('Admin user detail error:', err);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    const { suspended, suspendedReason, isGhost, adminNotes } = req.body;
    const update = {};

    if (suspended !== undefined) {
      if (typeof suspended !== 'boolean') {
        return res.status(400).json({ message: 'suspended must be a boolean' });
      }
      update.suspended = suspended;
      update.suspendedAt = suspended ? new Date() : null;
      update.suspendedReason = suspended ? (suspendedReason || null) : null;
    }
    if (isGhost !== undefined) {
      if (typeof isGhost !== 'boolean') {
        return res.status(400).json({ message: 'isGhost must be a boolean' });
      }
      update.isGhost = isGhost;
    }
    if (adminNotes !== undefined) {
      if (typeof adminNotes !== 'string') {
        return res.status(400).json({ message: 'adminNotes must be a string' });
      }
      update.adminNotes = adminNotes;
    }

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true })
      .select('name email suspended suspendedReason isGhost adminNotes');
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (suspended) {
      const io = req.app.get('io');
      if (io) {
        io.to(req.params.id.toString()).emit('force-disconnect', {
          reason: suspendedReason || 'Account suspended',
        });
      }
    }

    res.json({ message: 'User updated', user });
  } catch (err) {
    console.error('Admin user update error:', err);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

router.post('/users/:id/disconnect', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const io = req.app.get('io');
    if (io) {
      io.to(req.params.id.toString()).emit('force-disconnect', {
        reason: 'Admin forced disconnect',
      });
    }
    res.json({ message: 'Disconnect signal sent' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to disconnect user' });
  }
});

// ─── ANALYTICS ───
router.get('/analytics', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [dailySignups, dailyReports, dailyMatches, dailyMessages, dailyActive] = await Promise.all([
      User.aggregate([
        { $match: { isDeleted: false, createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Report.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Match.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Message.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo }, deleted: false } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      User.aggregate([
        { $match: { isDeleted: false, lastActive: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$lastActive' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    res.json({
      dailySignups: dailySignups.map(d => ({ date: d._id, count: d.count })),
      dailyReports: dailyReports.map(d => ({ date: d._id, count: d.count })),
      dailyMatches: dailyMatches.map(d => ({ date: d._id, count: d.count })),
      dailyMessages: dailyMessages.map(d => ({ date: d._id, count: d.count })),
      dailyActive: dailyActive.map(d => ({ date: d._id, count: d.count })),
    });
  } catch (err) {
    console.error('Admin analytics error:', err);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
});

// ─── SETTINGS ───
router.get('/settings', async (req, res) => {
  try {
    const settings = await Setting.find().lean();
    const obj = {};
    settings.forEach(s => { obj[s.key] = s.value; });
    res.json(obj);
  } catch (err) {
    console.error('Admin settings error:', err);
    res.status(500).json({ message: 'Failed to fetch settings' });
  }
});

router.put('/settings', async (req, res) => {
  try {
    const entries = Object.entries(req.body || {});
    if (!entries.length) {
      return res.status(400).json({ message: 'No settings provided' });
    }
    if (entries.length > 50) {
      return res.status(400).json({ message: 'Too many settings at once' });
    }

    for (const [key, value] of entries) {
      if (key === 'shadowbanThreshold') {
        if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1000) {
          return res.status(400).json({ message: 'shadowbanThreshold must be a finite number between 0 and 1000' });
        }
      } else if (typeof value === 'string' && value.trim().length > 50) {
        return res.status(400).json({ message: `${key} must be 50 characters or fewer` });
      }
    }

    const ops = entries.map(([key, value]) =>
      Setting.findOneAndUpdate({ key }, { key, value }, { upsert: true, new: true })
    );
    await Promise.all(ops);
    res.json({ message: 'Settings saved' });
  } catch (err) {
    console.error('Admin settings save error:', err);
    res.status(500).json({ message: 'Failed to save settings' });
  }
});

export default router;

```

### ./server/routes/auth.js

```
import express from 'express';
import { body } from '../middleware/validate.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import OTP from '../models/OTP.js';
import User from '../models/User.js';
import { validate } from '../middleware/validate.js';
import { protect, setAuthCookie, clearAuthCookie } from '../middleware/auth.js';
import { sendOTP } from '../utils/email.js';
import { COLLEGE_MAP } from '../config/appData.js';
import { verifyOtpLimiter, otpIpLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();

// Generate 6-digit cryptographically secure code
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Helper to extract college code and name
const extractCollegeDetails = (email) => {
  const parts = email.split('@');
  if (parts.length < 2) return { college: '', collegeCode: '' };
  const domain = parts[1].toLowerCase();
  
  // Example: someone@iitb.ac.in -> domain: iitb.ac.in -> code: iitb
  const domainParts = domain.split('.');
  let collegeCode = domainParts[0];
  
  // Map common college codes to readable names
  let college = COLLEGE_MAP[collegeCode] || domain;
  if (collegeCode === 'gmail') collegeCode = 'iit'; // fallback/dev code

  return { college, collegeCode };
};

// @route   POST /api/auth/send-otp
// @desc    Generate OTP and send it via email
// @access  Public
router.post(
  '/send-otp',
  otpIpLimiter,
  [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email address')
      .custom((value) => {
        // Enforce .ac.in domain except when ALLOW_ALL_EMAILS is true
        const isAcademic = value.endsWith('.ac.in');
        const allowAll = process.env.ALLOW_ALL_EMAILS === 'true';
        if (!isAcademic && !allowAll) {
          throw new Error('Only academic (.ac.in) emails are allowed');
        }
        return true;
      }),
  ],
  validate,
  async (req, res) => {
    const { email } = req.body;

    try {
      // Rate limiting: check recent OTP requests (optional, but let's keep it robust)
      const recentOTPs = await OTP.find({
        email,
        createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) }, // last hour
      });

      if (recentOTPs.length >= 5) {
        return res.status(429).json({
          message: 'Too many verification codes requested. Please try again in an hour.',
        });
      }

      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins expiry

      // Save to DB
      await OTP.create({
        email,
        otp,
        expiresAt,
      });

      // Send OTP
      await sendOTP(email, otp);

      res.status(200).json({ message: 'Verification code sent successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error, could not send code' });
    }
  }
);

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP and return JWT token
// @access  Public
router.post(
  '/verify-otp',
  verifyOtpLimiter,
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  ],
  validate,
  async (req, res) => {
    const { email, otp } = req.body;

    try {
      const record = await OTP.findOne({ email }).sort({ createdAt: -1 });

      if (!record) {
        return res.status(400).json({ message: 'No verification code found' });
      }

      // Check expiry
      if (record.expiresAt < new Date()) {
        await OTP.deleteOne({ _id: record._id });
        return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
      }

      // Check attempts
      if (record.attempts >= 3) {
        return res.status(400).json({
          message: 'Too many incorrect attempts. Please request a new code.',
        });
      }

      // Compare
      if (record.otp !== otp) {
        record.attempts += 1;
        await record.save();
        return res.status(400).json({ message: 'Invalid verification code' });
      }

      // Valid OTP! Find or create user
      let user = await User.findOne({ email });
      const { college, collegeCode } = extractCollegeDetails(email);

      if (!user) {
        user = await User.create({
          email,
          college,
          collegeCode,
          isVerified: true,
          isOnboarded: false,
        });
      } else {
        // 🛡️ Block suspended users from logging in
        if (user.suspended) {
          return res.status(403).json({
            message: 'Your account has been suspended. Contact support for assistance.',
            suspended: true,
            reason: user.suspendedReason || 'Multiple community reports',
          });
        }

        // 🛡️ Block deleted users from logging in
        if (user.isDeleted) {
          return res.status(403).json({
            message: 'This account has been deleted.',
            deleted: true,
          });
        }

        user.isVerified = true;
        // Update college/collegeCode if they were empty
        if (!user.college) user.college = college;
        if (!user.collegeCode) user.collegeCode = collegeCode;
        await user.save();
      }

      // Delete OTP records for this email
      await OTP.deleteMany({ email });

      // Create JWT
      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Set httpOnly cookie (primary auth mechanism)
      setAuthCookie(res, token);

      res.status(200).json({
        token,
        user: {
          _id: user._id,
          email: user.email,
          college: user.college,
          collegeCode: user.collegeCode,
          isOnboarded: user.isOnboarded,
          name: user.name,
          isGhost: user.isGhost,
          suspended: user.suspended,
          suspendedReason: user.suspendedReason,
          isDeleted: user.isDeleted,
          shadowbanScore: user.shadowbanScore || 0,
          shadowbannedAt: user.shadowbannedAt || null,
          contentFrozen: user.contentFrozen || false,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error during verification' });
    }
  }
);

// @route   POST /api/auth/logout
// @desc    Clear auth cookie
// @access  Public
router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.status(200).json({ message: 'Logged out successfully' });
});

// @route   GET /api/auth/me
// @desc    Get current user profile from token
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

```

### ./server/routes/config.js

```
import express from 'express';
import Setting from '../models/Setting.js';
import {
  PROMPT_BANK, BRANCHES, YEARS, GENDERS, INTENTS, INTEREST_TAGS,
  PRONOUNS_OPTIONS, INTEREST_ICONS, INTEREST_ICON_FALLBACKS, COLLEGE_MAP, APP_CONSTANTS,
} from '../config/appData.js';
import { COMPAT_QUESTIONS } from '../config/compatQuestions.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    // Check database for dynamic settings first
    const dbSetting = await Setting.findOne({ key: 'appConfig' });
    
    if (dbSetting) {
      return res.json(dbSetting.value);
    }

    // Fallback to static file if DB is empty
    res.json({
      prompts: PROMPT_BANK,
      branches: BRANCHES,
      years: YEARS,
      genders: GENDERS,
      intents: INTENTS,
      interests: INTEREST_TAGS,
      pronouns: PRONOUNS_OPTIONS,
      interestIcons: INTEREST_ICONS,
      interestIconFallbacks: INTEREST_ICON_FALLBACKS,
      colleges: COLLEGE_MAP,
      constants: APP_CONSTANTS,
      compatQuestions: COMPAT_QUESTIONS,
      splash: {
        videoUrl: process.env.SPLASH_VIDEO_URL || '/lover.mp4',
        tagline: process.env.SPLASH_TAGLINE || 'Your Campus. Your Story.',
      },
    });
  } catch (error) {
    console.error('Config route error:', error);
    res.status(500).json({ message: 'Server error fetching config' });
  }
});

export default router;
```

### ./server/routes/discover.js

```
import express from 'express';
import User from '../models/User.js';
import Match from '../models/Match.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';
import Interaction from '../models/Interaction.js';
import { protect } from '../middleware/auth.js';
import { computeCompatibility } from '../config/compatQuestions.js';
import { sendPushNotification } from '../utils/push.js';
import { addToQueue } from '../utils/queue.js';
import { discoverLimiter } from '../middleware/rateLimiters.js';
import { getBlockExclusionQuery } from '../middleware/blockFilter.js';
import { body } from '../middleware/validate.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();
const DAY_MS = 24 * 60 * 60 * 1000;

// Shared helper for Letters and Telegrams (Superlikes)
const handleLike = async (req, res, { isSuperlike = false } = {}) => {
  const targetId = req.params.id;
  const currentUser = req.user;
  const actionType = isSuperlike ? 'seal_stamp' : 'letter';

  try {
    // 🛡️ BLOCK SELF-INTERACTION
    if (targetId === currentUser._id.toString()) {
      return res.status(400).json({ message: 'Cannot interact with yourself' });
    }

    // 1. INDEPENDENT DAILY LIMITS (7 letters/day, 1 Telegram/day)
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    const dailyCount = await Interaction.countDocuments({
      actorId: currentUser._id,
      actionType,
      createdAt: { $gte: startOfDay },
    });
    const dailyLimit = isSuperlike ? 1 : 7;
    if (dailyCount >= dailyLimit) {
      return res.status(403).json({
        message: isSuperlike ? 'Out of Telegrams. Come back tomorrow.' : 'Out of letters. Come back tomorrow.',
      });
    }

    const { note, target } = req.body; 
    
    // 🛡️ BLOCK UNMATCHED USERS: Check if there's a permanent archive between us
    const permanentArchive = await Interaction.findOne({
      $or: [
        { actorId: currentUser._id, targetId, actionType: 'archive', cooldownExpiresAt: null },
        { actorId: targetId, targetId: currentUser._id, actionType: 'archive', cooldownExpiresAt: null }
      ]
    });
    if (permanentArchive) {
      return res.status(403).json({ 
        message: 'This connection has been permanently closed.',
        code: 'USER_UNMATCHED'
      });
    }
    
    const targetUser = await User.findById(targetId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 2. CREATE THE LEDGER ENTRY
    const letterInteraction = await Interaction.create({
      actorId: currentUser._id,
      targetId,
      actionType,
      targetArtifact: target || null,
      letterContent: note || null,
      cooldownExpiresAt: null,
    });

    // 3. CREATE INBOX NOTIFICATION
    const notification = await Notification.create({
      recipientId: targetId,
      senderId: currentUser._id,
      type: isSuperlike ? 'priority_seal' : 'new_letter',
      interactionRef: letterInteraction._id,
    });

    // 4. REAL-TIME SOCKET PING
    const io = req.app.get('io');
    if (io) {
      io.to(targetId.toString()).emit('new-letter', {
        type: isSuperlike ? 'priority_seal' : 'new_letter',
      });
    }

    // 5. BACKGROUND PUSH
    addToQueue(() => sendPushNotification(targetId, {
      title: isSuperlike ? 'Priority Telegram!' : 'New Letter!',
      body: `${currentUser.name} sent you a${isSuperlike ? ' Telegram' : ' letter'}!`,
      data: {
        type: 'notification',
        notificationId: notification._id.toString(),
        interactionId: letterInteraction._id.toString(),
      },
    }));

    // 6. CHECK FOR MUTUAL MATCH
    const isMutual = await Interaction.findOne({
      actorId: targetId,
      targetId: currentUser._id,
      actionType: { $in: ['letter', 'seal_stamp', 'accept_letter', 'accept_seal'] },
    });

    if (isMutual) {
      const pairKey = [currentUser._id.toString(), targetId.toString()].sort().join('__');

      // Atomic Upsert to prevent race conditions
      const match = await Match.findOneAndUpdate(
        { pairKey },
        {
          $setOnInsert: {
            pairKey,
            users: [currentUser._id, targetId],
          },
          $set: {
            isActive: true,
            unlockedByInteractionId: letterInteraction._id,
          },
        },
        { upsert: true, new: true }
      );

      // AUTO-GENERATE THE OPENING ICEBREAKER MESSAGE
      const senderProfile = await User.findById(currentUser._id).select('photos prompts');
      let msgData = {
        matchId: match._id,
        senderId: currentUser._id,
        type: 'opening_letter',
        text: note || '',
        deliveryStatus: 'sent',
      };

      const target = req.body.target;
      if (target?.startsWith('photo_')) {
        const idx = parseInt(target.split('_')[1], 10);
        const url = senderProfile.photos?.[idx] || senderProfile.photos?.[0];
        if (url) {
          msgData.image = url;
          msgData.mediaUrl = url;
          msgData.text = note || '';
        }
      } else if (target?.startsWith('prompt_')) {
        const idx = parseInt(target.split('_')[1], 10);
        const q = senderProfile.prompts?.[idx]?.question;
        if (q) {
          msgData.text = note ? `"${q}"\n\n${note}` : `"${q}"`;
        }
      }

      await Message.findOneAndUpdate(
        { matchId: match._id, type: 'opening_letter' },
        { $setOnInsert: msgData },
        { upsert: true }
      );

      const targetProfile = {
        _id: targetUser._id,
        name: targetUser.name,
        photos: targetUser.photos,
        bio: targetUser.bio,
        branch: targetUser.branch,
        year: targetUser.year,
        hostel: targetUser.hostel,
        pronouns: targetUser.pronouns,
        interests: targetUser.interests,
        prompts: targetUser.prompts,
        intent: targetUser.intent,
        compatScore: computeCompatibility(currentUser.compatAnswers || [], targetUser.compatAnswers || []),
      };

      if (io) {
        io.to(targetId.toString()).emit('match-notification', {
          _id: match._id,
          matchId: match._id,
          interactionRef: letterInteraction._id,
          targetArtifact: target || null,
          letterContent: note || null,
          user: targetProfile,
        });
      }

      return res.status(200).json({
        matched: true,
        ...(isSuperlike && { super: true }),
        matchId: match._id,
        user: targetProfile,
      });
    }

    res.status(200).json({ matched: false, ...(isSuperlike && { super: true }) });
  } catch (error) {
    console.error('Like error:', error);
    res.status(500).json({ message: `Server error processing ${isSuperlike ? 'Telegram' : 'letter'}` });
  }
};

// @route   GET /api/discover
router.get('/', protect, async (req, res) => {
  try {
    const currentUser = req.user;
    const limit = Math.min(parseInt(req.query.limit) || 10, 20);

    // Build exclusion set from the Interaction ledger
    const acted = await Interaction.find({
      $or: [
        { actorId: currentUser._id, actionType: { $in: ['letter', 'seal_stamp', 'accept_letter', 'accept_seal', 'archive'] } },
        { targetId: currentUser._id, actionType: 'archive' },
      ],
    }).select('actorId targetId actionType cooldownExpiresAt').lean();

    const excludedIds = new Set();
    const now = new Date();
    for (const it of acted) {
      const otherId = it.actorId.toString() === currentUser._id.toString()
        ? it.targetId.toString()
        : it.actorId.toString();
      if (it.actionType === 'archive') {
        // Permanent archive (cooldownExpiresAt === null) always excludes
        // Temporary archive only excludes while cooldown is active
        if (!it.cooldownExpiresAt || new Date(it.cooldownExpiresAt) > now) {
          excludedIds.add(otherId);
        }
      } else {
        excludedIds.add(otherId);
      }
    }

    const blockExclusion = await getBlockExclusionQuery(currentUser._id);
    const blockedIds = blockExclusion._id?.$nin || [];
    blockedIds.forEach(id => excludedIds.add(id.toString()));
    excludedIds.add(currentUser._id.toString());

    // Base filter — heavy $nin moved to Node.js memory filtering
    const baseFilter = {
      collegeCode: currentUser.collegeCode,
      isOnboarded: true,
      isVerified: true,
      suspended: { $ne: true },
      isGhost: { $ne: true },
      isDeleted: { $ne: true },
    };

    if (currentUser.interestedIn?.length > 0) {
      baseFilter.gender = { $in: currentUser.interestedIn };
    }

    // 🚀 INDEXED RANGE QUERY: Fetch candidates faster than $sample
    const randomPoint = Math.random();
    let candidates = await User.find({ ...baseFilter, randomSeed: { $gte: randomPoint } })
      .select('name photos bio branch year hostel pronouns interests prompts intent compatAnswers lastActive')
      .limit(80)
      .lean();

    // If we hit the end of the index, wrap around to 0
    if (candidates.length < limit * 2) {
      const moreCandidates = await User.find({ ...baseFilter, randomSeed: { $lt: randomPoint } })
        .select('name photos bio branch year hostel pronouns interests prompts intent compatAnswers lastActive')
        .limit(80)
        .lean();
      candidates = candidates.concat(moreCandidates);
    }

    // Filter exclusions in high-speed Node.js memory
    const eligibleBatch = candidates.filter(u => !excludedIds.has(u._id.toString()));

    // Calculate Hybrid Score
    const currentUserAnswers = currentUser.compatAnswers || [];
    const scoredUsers = eligibleBatch.map((u) => {
      const compatRaw = computeCompatibility(currentUserAnswers, u.compatAnswers || []);
      const compatScore = (compatRaw || 0) / 100;
      const hoursSinceActive = (Date.now() - new Date(u.lastActive).getTime()) / (1000 * 60 * 60);
      let recencyScore = hoursSinceActive <= 1 ? 1.0 : hoursSinceActive <= 24 ? 0.5 : 0.0;
      const hasPhotos = (u.photos || []).length >= 4;
      const hasPrompts = (u.prompts || []).length >= 3;
      const hasBio = u.bio && u.bio.length > 10;
      const completenessScore = (hasPhotos && hasPrompts && hasBio) ? 1.0 : 0.5;

      const hybridScore = (compatScore * 0.5) + (recencyScore * 0.3) + (completenessScore * 0.2);
      return { ...u, hybridScore, compatScore: Math.round(compatRaw || 0) };
    });

    scoredUsers.sort((a, b) => b.hybridScore - a.hybridScore);
    const finalDeck = scoredUsers.slice(0, limit);

    res.status(200).json({
      users: finalDeck,
      total: eligibleBatch.length,
      hasMore: eligibleBatch.length > limit,
    });
  } catch (error) {
    console.error('Discover deck error:', error);
    res.status(500).json({ message: 'Server error fetching discovery deck' });
  }
});

// Validation middleware for target artifact to prevent injection/NaN crashes
const validateTarget = [
  body('target')
    .optional({ nullable: true, checkFalsy: true })
    .matches(/^(photo|prompt)_\d+$/)
    .withMessage('Invalid target artifact format. Must be like "photo_0" or "prompt_1".'),
  validate,
];

router.post('/like/:id', protect, discoverLimiter, validateTarget, (req, res) => handleLike(req, res));
router.post('/superlike/:id', protect, discoverLimiter, validateTarget, (req, res) => handleLike(req, res, { isSuperlike: true }));

router.post('/pass/:id', protect, discoverLimiter, async (req, res) => {
  const targetId = req.params.id;
  const currentUser = req.user;

  try {
    // 🧹 ATOMIC UPSERT: Overwrites existing pass cooldowns instead of stacking duplicate rows
    await Interaction.findOneAndUpdate(
      { actorId: currentUser._id, targetId, actionType: 'archive' },
      { $set: { cooldownExpiresAt: new Date(Date.now() + 7 * DAY_MS) } },
      { upsert: true, new: true }
    );
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Pass error:', error);
    res.status(500).json({ message: 'Server error processing pass' });
  }
});

router.get('/likes-you', protect, async (req, res) => {
  try {
    const currentUser = req.user;

    const incoming = await Interaction.find({
      targetId: currentUser._id,
      actionType: { $in: ['letter', 'seal_stamp', 'accept_letter', 'accept_seal'] },
    }).lean();

    const actorIds = incoming.map((i) => i.actorId);
    const myResponses = await Interaction.find({
      actorId: currentUser._id,
      targetId: { $in: actorIds },
    }).lean();
    const responded = new Set(myResponses.map((i) => i.targetId.toString()));

    const blockExclusion = await getBlockExclusionQuery(currentUser._id);
    const blockedSet = new Set((blockExclusion._id?.$nin || []).map((id) => id.toString()));

    // 1. Filter out responded/blocked IDs first to avoid fetching unnecessary users
    const validActorIds = incoming
      .filter(it => !responded.has(it.actorId.toString()) && !blockedSet.has(it.actorId.toString()))
      .map(it => it.actorId);

    // 2. SINGLE BATCHED QUERY (Fixes N+1)
    const users = validActorIds.length > 0 
      ? await User.find({ _id: { $in: validActorIds } })
          .select('name photos bio branch year hostel pronouns interests prompts intent compatAnswers gender age')
          .lean()
      : [];

    // 3. Map users to a dictionary for O(1) lookup
    const userMap = new Map(users.map(u => [u._id.toString(), u]));

    // 4. Reconstruct the likesYou array with enriched data
    const likesYou = incoming
      .filter(it => userMap.has(it.actorId.toString()))
      .map(it => {
        const u = userMap.get(it.actorId.toString());
        u.compatScore = computeCompatibility(currentUser.compatAnswers || [], u.compatAnswers || []);
        u.interactionRef = it._id;
        u.targetArtifact = it.targetArtifact;
        u.letterContent = it.letterContent;
        u.interactionCreatedAt = it.createdAt;
        u.isTelegram = it.actionType === 'seal_stamp';
        return u;
      });

    // Sort Telegrams to the absolute top, then by date
    likesYou.sort((a, b) => {
      if (a.isTelegram && !b.isTelegram) return -1;
      if (!a.isTelegram && b.isTelegram) return 1;
      return new Date(b.interactionCreatedAt) - new Date(a.interactionCreatedAt);
    });

    res.status(200).json({
      users: likesYou,
      total: likesYou.length,
    });
  } catch (error) {
    console.error('Likes-you error:', error);
    res.status(500).json({ message: 'Server error fetching likes you' });
  }
});

export default router;

```

### ./server/routes/matches.js

```
import express from 'express';
import mongoose from 'mongoose';
import Match from '../models/Match.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import Interaction from '../models/Interaction.js';
import { sendPushNotification } from '../utils/push.js';
import { addToQueue } from '../utils/queue.js';
import { protect } from '../middleware/auth.js';
import { areBlocked } from '../middleware/blockFilter.js';

const router = express.Router();

// @route   GET /api/matches
// @desc    Get all active matches for the current user with details (paginated) using Aggregation
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const total = await Match.countDocuments({ users: userId, isActive: true });

    // SINGLE AGGREGATION PIPELINE (Replaces the N+1 Promise.all loop)
    const matches = await Match.aggregate([
      { $match: { users: userId, isActive: true } },
      { $sort: { updatedAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        // 1. Join the matched user's profile
        $lookup: {
          from: 'users',
          let: { userIds: '$users' },
          pipeline: [
            { $match: { $expr: { $in: ['$_id', '$$userIds'] } } },
            { $match: { _id: { $ne: userId } } },
            { $project: { name: 1, photos: 1, branch: 1, year: 1, lastActive: 1, gender: 1, hostel: 1, bio: 1, prompts: 1, intent: 1, interests: 1, suspended: 1, isDeleted: 1 } }
          ],
          as: 'otherUserArr'
        }
      },
      { $unwind: '$otherUserArr' },
      {
        // 2. Join the most recent message for this match
        $lookup: {
          from: 'messages',
          let: { matchId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$matchId', '$$matchId'] } } },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
            { $project: { text: 1, senderId: 1, createdAt: 1, readAt: 1 } }
          ],
          as: 'lastMessageArr'
        }
      },
      {
        $unwind: {
          path: '$lastMessageArr',
          preserveNullAndEmptyArrays: true // Keep match even if no messages exist
        }
      },
      {
        // 3. Join the original interaction that created this match
        $lookup: {
          from: 'interactions',
          let: { interactionId: '$unlockedByInteractionId' },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$interactionId'] } } },
            { $project: { targetArtifact: 1, letterContent: 1, actionType: 1 } }
          ],
          as: 'originInteraction'
        }
      },
      {
        $unwind: {
          path: '$originInteraction',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        // 4. Shape the final output to match frontend expectations
        $project: {
          _id: 1,
          user: '$otherUserArr',
          lastMessage: '$lastMessageArr',
          originInteraction: 1,
          updatedAt: 1,
          sortDate: { $ifNull: ['$lastMessageArr.createdAt', '$updatedAt'] }
        }
      },
      { $sort: { sortDate: -1 } } // Sort by last message date, or match creation date
    ]);

    res.status(200).json({
      matches,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching matches' });
  }
});

// @route   DELETE /api/matches/:id
// @desc    Unmatch/deactivate a match
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const match = await Match.findOne({
      _id: req.params.id,
      users: req.user._id,
    });

    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    match.isActive = false;
    await match.save();

    // Create permanent exclusion so they never appear in each other's Discover deck
    const otherUserId = match.users.find(u => u.toString() !== req.user._id.toString());
    await Interaction.create({
      actorId: req.user._id,
      targetId: otherUserId,
      actionType: 'archive',
      cooldownExpiresAt: null, // Permanent — no cooldown expiry
    });

    // Notify the other user
    const io = req.app.get('io');
    if (otherUserId && io) {
      io.to(otherUserId.toString()).emit('unmatch-notification', { matchId: match._id });
    }
    if (otherUserId) {
      addToQueue(() => sendPushNotification(otherUserId, {
        title: 'Unmatched',
        body: `You were unmatched by ${req.user.name}`,
      }));
    }

    res.status(200).json({ success: true, message: 'Unmatched successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error processing unmatch' });
  }
});

// @route   GET /api/matches/:id/icebreakers
// @desc    Get personalized ice-breaker suggestions for a match
// @access  Private
router.get('/:id/icebreakers', protect, async (req, res) => {
  try {
    const match = await Match.findOne({
      _id: req.params.id,
      users: req.user._id,
      isActive: true,
    });

    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    const otherUserId = match.users.find(u => u.toString() !== req.user._id.toString());
    const otherUser = await User.findById(otherUserId).select('name interests branch year hostel compatAnswers prompts');
    const currentUser = req.user;

    if (!otherUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const icebreakers = [];

    // Shared interests
    const sharedInterests = (currentUser.interests || []).filter(i =>
      (otherUser.interests || []).includes(i)
    );
    if (sharedInterests.length > 0) {
      const interest = sharedInterests[0];
      icebreakers.push(`I see you're into ${interest}! What got you into it?`);
      if (sharedInterests.length > 1) {
        icebreakers.push(`We both like ${sharedInterests.join(' and ')} — what's your favorite thing about them?`);
      }
    }

    // Same hostel
    if (currentUser.hostel && otherUser.hostel && currentUser.hostel === otherUser.hostel) {
      icebreakers.push(`Fellow ${currentUser.hostel} resident! What's the best thing about living there?`);
    }

    // Same branch
    if (currentUser.branch && otherUser.branch && currentUser.branch === otherUser.branch) {
      icebreakers.push(`We're both in ${currentUser.branch}! How are you finding it so far?`);
    }

    // Prompts-based
    if (otherUser.prompts && otherUser.prompts.length > 0) {
      const prompt = otherUser.prompts[0];
      icebreakers.push(`I loved your answer about "${prompt.question}" — tell me more!`);
    }

    // Compat answers
    if (currentUser.compatAnswers?.length && otherUser.compatAnswers?.length) {
      const shared = currentUser.compatAnswers.filter(a =>
        otherUser.compatAnswers.some(b => b.question === a.question && b.answer === a.answer)
      );
      if (shared.length > 0) {
        icebreakers.push(`We matched on "${shared[0].question}" — great minds think alike!`);
      }
    }

    // Fallbacks
    const fallbacks = [
      `Hey ${otherUser.name?.split(' ')[0]}! What's the best thing that happened to you today?`,
      `If you could have any superpower for a day, what would it be?`,
      `What's your go-to comfort food after a long day?`,
      `Best chai spot on campus? I need recommendations!`,
      `What's the most interesting thing you've learned this semester?`,
    ];

    while (icebreakers.length < 3) {
      const fb = fallbacks[icebreakers.length % fallbacks.length];
      if (!icebreakers.includes(fb)) icebreakers.push(fb);
    }

    res.status(200).json({ icebreakers: icebreakers.slice(0, 5) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching icebreakers' });
  }
});

export default router;

```

### ./server/routes/messages.js

```
import express from 'express';
import mongoose from 'mongoose';
import Match from '../models/Match.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { sendPushNotification } from '../utils/push.js';
import { addToQueue } from '../utils/queue.js';
import { messageLimiter } from '../middleware/rateLimiters.js';
import { areBlocked } from '../middleware/blockFilter.js';
import { deleteCloudinaryFile } from '../config/cloudinary.js';

const router = express.Router();

// @route   GET /api/messages/:matchId
// @desc    Get messages using ObjectId-Based Cursor Pagination
router.get('/:matchId', protect, async (req, res) => {
  const { matchId } = req.params;
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 100);
  const cursor = req.query.cursor;

  try {
    const match = await Match.findOne({
      _id: matchId,
      users: req.user._id,
      isActive: true,
    });

    if (!match) {
      return res.status(403).json({ message: 'Unauthorized or match inactive' });
    }

    const query = { matchId };
    
    // 🚀 COLLISION-PROOF CURSOR: Use ObjectId sequencing instead of timestamps
    if (cursor && mongoose.Types.ObjectId.isValid(cursor)) {
      query._id = { $lt: new mongoose.Types.ObjectId(cursor) };
    } else if (cursor) {
      // Graceful fallback just in case an older timestamp cursor was passed
      query.createdAt = { $lt: new Date(cursor) };
    }

    const messages = await Message.find(query)
      .sort({ _id: -1 })
      .limit(limit)
      .populate('replyTo', 'text senderId type image deleted');

    Message.updateMany(
      { matchId, senderId: { $ne: req.user._id }, readAt: null },
      { $set: { readAt: new Date(), deliveryStatus: 'read' } }
    ).exec();

    const nextCursor = messages.length === limit ? messages[messages.length - 1]._id : null;

    res.status(200).json({
      messages: messages.reverse(), 
      nextCursor,
      hasMore: !!nextCursor,
    });
  } catch (error) {
    console.error('Fetch messages error:', error);
    res.status(500).json({ message: 'Server error fetching messages' });
  }
});

// @route   POST /api/messages/:matchId
router.post('/:matchId', protect, messageLimiter, async (req, res) => {
  const { matchId } = req.params;
  const { text, type, image, replyTo, mediaUrl, caption, clientMsgId } = req.body;

  const hasMedia = (type === 'image' || type === 'audio') && mediaUrl;
  if (!hasMedia && (!text || text.trim() === '')) {
    return res.status(400).json({ message: 'Message cannot be empty' });
  }

  if (text && text.length > 5000) {
    return res.status(400).json({ message: 'Message too long (max 5000 characters)' });
  }

  try {
    const match = await Match.findOne({
      _id: matchId,
      users: req.user._id,
      isActive: true,
    });

    if (!match) return res.status(403).json({ message: 'Unauthorized or match inactive' });

    const otherUserId = match.users.find(u => u.toString() !== req.user._id.toString());
    if (otherUserId && await areBlocked(req.user._id, otherUserId)) {
      return res.status(403).json({ message: 'Cannot send messages to this user' });
    }
    
    // 🛡️ BLOCK UNMATCHED USERS: Double-check match is still active
    if (!match.isActive) {
      return res.status(403).json({ 
        message: 'This connection has ended.',
        code: 'MATCH_INACTIVE'
      });
    }

    // IDEMPOTENCY CHECK: Prevent duplicate messages from network retries
    if (clientMsgId) {
      const existingMsg = await Message.findOne({ clientMsgId });
      if (existingMsg) {
        return res.status(200).json(existingMsg);
      }
    }

    if (replyTo) {
      const replyMsg = await Message.findOne({ _id: replyTo, matchId });
      if (!replyMsg) return res.status(400).json({ message: 'Reply target not found' });
    }

    const messageData = {
      matchId,
      senderId: req.user._id,
      type: type || 'text',
    };

    if (text && text.trim()) messageData.text = text.trim();
    if (mediaUrl) messageData.mediaUrl = mediaUrl;
    if (mediaUrl && type === 'image') messageData.image = mediaUrl; 
    if (caption) messageData.caption = caption;
    if (replyTo) messageData.replyTo = replyTo;
    if (clientMsgId) messageData.clientMsgId = clientMsgId;

    let message;
    try {
      message = await Message.create(messageData);
    } catch (err) {
      if (err.code === 11000 && clientMsgId) {
        const existing = await Message.findOne({ clientMsgId });
        if (existing) return res.status(200).json(existing);
      }
      throw err;
    }
    const populated = await Message.findById(message._id).populate('replyTo', 'text senderId type image deleted');

    match.updatedAt = new Date();
    await match.save();

    const io = req.app.get('io');
    
    // 🌐 MULTI-DEVICE BROADCAST: Send to the match room so ALL devices of sender & receiver update instantly
    if (io) {
      io.to(matchId.toString()).emit('new-message', populated);
    }

    if (otherUserId) {
      const sender = await User.findById(req.user._id).select('name');
      addToQueue(() => sendPushNotification(otherUserId, {
        title: sender?.name || 'New Message',
        body: type === 'audio' ? '🎙️ Sent a voice memo' : type === 'image' ? '📷 Sent a photograph' : (text || '').slice(0, 100),
        data: { type: 'message', matchId: matchId.toString() },
      }));
    }

    res.status(201).json(populated);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error sending message' });
  }
});

router.post('/:matchId/reaction', protect, async (req, res) => {
  const { matchId } = req.params;
  const { msgId, emoji } = req.body;

  try {
    const match = await Match.findOne({ _id: matchId, users: req.user._id, isActive: true });
    if (!match) return res.status(403).json({ message: 'Unauthorized' });

    const message = await Message.findOne({ _id: msgId, matchId });
    if (!message) return res.status(404).json({ message: 'Message not found' });

    const existingIdx = message.reactions.findIndex(
      (r) => r.user.toString() === req.user._id.toString() && r.emoji === emoji
    );

    if (existingIdx > -1) {
      message.reactions.splice(existingIdx, 1);
    } else {
      message.reactions = message.reactions.filter((r) => r.user.toString() !== req.user._id.toString());
      message.reactions.push({ emoji, user: req.user._id });
    }

    await message.save();

    const io = req.app.get('io');
    if (io) {
      io.to(matchId.toString()).emit('reaction-update', { msgId: message._id, reactions: message.reactions });
    }

    res.status(200).json({ reactions: message.reactions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error reacting' });
  }
});

router.delete('/:matchId/:msgId', protect, async (req, res) => {
  const { matchId, msgId } = req.params;
  try {
    const match = await Match.findOne({ _id: matchId, users: req.user._id, isActive: true });
    if (!match) return res.status(403).json({ message: 'Unauthorized' });

    const message = await Message.findOne({ _id: msgId, matchId });
    if (!message) return res.status(404).json({ message: 'Message not found' });
    if (message.senderId.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Can only delete your own messages' });

    // 🧹 CLOUDINARY WIPE: If the message contained a photo or voice note, vaporize it from cloud storage!
    if (message.mediaUrl || message.image) {
      deleteCloudinaryFile(message.mediaUrl || message.image);
    }

    message.deleted = true;
    message.text = '';
    message.image = '';
    message.mediaUrl = '';
    await message.save();

    const io = req.app.get('io');
    if (io) io.to(matchId.toString()).emit('message-deleted', { msgId: message._id });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting message' });
  }
});

export default router;

```

### ./server/routes/notifications.js

```
import express from 'express';
import Notification from '../models/Notification.js';
import Interaction from '../models/Interaction.js';
import Match from '../models/Match.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { sendPushNotification } from '../utils/push.js';
import { addToQueue } from '../utils/queue.js';

const router = express.Router();

// @route   GET /api/notifications/vapid-key
// @desc    Get VAPID public key for push subscription
// @access  Private
router.get('/vapid-key', protect, (req, res) => {
  const key = process.env.VAPID_PUBLIC_KEY;
  if (!key) {
    return res.status(503).json({ message: 'Push notifications not configured' });
  }
  res.status(200).json({ publicKey: key });
});

// @route   POST /api/notifications/subscribe
// @desc    Save push subscription
// @access  Private
router.post('/subscribe', protect, async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ message: 'Invalid subscription' });
    }
    await User.findByIdAndUpdate(req.user._id, { pushSubscription: subscription });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error saving subscription' });
  }
});

// @route   DELETE /api/notifications/subscribe
// @desc    Remove push subscription
// @access  Private
router.delete('/subscribe', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { pushSubscription: null });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error removing subscription' });
  }
});

// @route   GET /api/notifications/unread-count
// @desc    Get unread (uncleared) notification count
// @access  Private
router.get('/unread-count', protect, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipientId: req.user._id,
      isCleared: false,
    });
    res.status(200).json({ count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching unread count' });
  }
});

// @route   GET /api/notifications
// @desc    Get all notifications for the current user (paginated)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const filter = { recipientId: req.user._id, isCleared: false };

    if (req.query.type) {
      filter.type = req.query.type;
    }

    const total = await Notification.countDocuments(filter);
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('senderId', 'name photos branch year gender hostel pronouns interests age bio prompts suspended isDeleted')
      .populate('interactionRef');

    res.status(200).json({
      notifications,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching notifications' });
  }
});

// @route   POST /api/notifications/:id/accept
// @desc    Accept an incoming letter/seal: create the Match + opening letter, clear the notification
// @access  Private
router.post('/:id/accept', protect, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipientId: req.user._id,
    }).populate('interactionRef');
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    const incoming = notification.interactionRef; // actorId = original sender, targetId = me
    if (!incoming) {
      return res.status(400).json({ message: 'Notification has no linked interaction' });
    }

    const originalSender = incoming.actorId;
    const me = req.user._id;

    // Check if the original sender is suspended or deleted
    const senderUser = await User.findById(originalSender).select('suspended isDeleted').lean();
    if (!senderUser || senderUser.isDeleted || senderUser.suspended) {
      return res.status(410).json({ message: 'This profile is no longer available', code: 'USER_UNAVAILABLE' });
    }

    // Record my response (bypasses the daily like limit) so they're excluded from deck/likes-you
    const alreadyResponded = await Interaction.findOne({
      actorId: me,
      targetId: originalSender,
      actionType: { $in: ['letter', 'seal_stamp'] },
    });
    
    if (!alreadyResponded) {
      await Interaction.create({
        actorId: me,
        targetId: originalSender,
        actionType: incoming.actionType === 'seal_stamp' ? 'accept_seal' : 'accept_letter',
        letterContent: null,
        targetArtifact: null,
        cooldownExpiresAt: null,
      });
    }

    const pairKey = [me.toString(), originalSender.toString()].sort().join('__');

    // 1. ATOMIC UPSERT: Prevents duplicate key crashes if both users accept simultaneously
    const match = await Match.findOneAndUpdate(
      { pairKey },
      {
        $setOnInsert: {
          pairKey,
          users: [me, originalSender],
        },
        $set: {
          isActive: true,
          unlockedByInteractionId: incoming._id,
        },
      },
      { upsert: true, new: true }
    );

    // AUTO-GENERATE THE OPENING LETTER (only once)
    const existingOpening = await Message.findOne({ matchId: match._id, type: 'opening_letter' });
    if (!existingOpening) {
      const senderProfile = await User.findById(originalSender).select('photos prompts');
      let msgData = {
        matchId: match._id,
        senderId: originalSender,
        type: 'opening_letter',
        deliveryStatus: 'sent',
        text: incoming.letterContent || '',
      };

      const target = incoming.targetArtifact;
      if (target?.startsWith('photo_')) {
        const idx = parseInt(target.split('_')[1], 10);
        const url = senderProfile.photos?.[idx] || senderProfile.photos?.[0];
        if (url) {
          msgData.image = url;
          msgData.mediaUrl = url;
          msgData.text = incoming.letterContent || '';
        }
      } else if (target?.startsWith('prompt_')) {
        const idx = parseInt(target.split('_')[1], 10);
        const q = senderProfile.prompts?.[idx]?.question;
        if (q) {
          msgData.text = incoming.letterContent ? `"${q}"\n\n${incoming.letterContent}` : `"${q}"`;
        }
      }

      await Message.create(msgData);
    }

    notification.isCleared = true;
    await notification.save();

    const meUser = await User.findById(me).select(
      'name photos bio branch year hostel pronouns interests prompts intent'
    );
    
    const io = req.app.get('io');
    if (io) {
      // Real-time socket ping for immediate UI update if User A has the app open
      io.to(originalSender.toString()).emit('match-notification', {
        _id: match._id,
        matchId: match._id,
        interactionRef: incoming._id,
        targetArtifact: incoming.targetArtifact,
        letterContent: incoming.letterContent,
        user: meUser,
      });
    }

    // 2. DOPAMINE PUSH: Fire background notification to User A's lock screen
    addToQueue(() => sendPushNotification(originalSender, {
      title: 'You have a new match!',
      body: `${req.user.name} accepted your letter!`,
      data: { 
        type: 'match', 
        matchId: match._id.toString() 
      },
    }));

    res.status(200).json({ success: true, matchId: match._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error accepting notification' });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark a single notification as cleared
// @access  Private
router.put('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientId: req.user._id },
      { isCleared: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.status(200).json(notification);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error marking notification as read' });
  }
});

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as cleared
// @access  Private
router.put('/read-all', protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipientId: req.user._id, isCleared: false },
      { isCleared: true }
    );
    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error marking all as read' });
  }
});

// @route   PUT /api/notifications/:id/dismiss
// @desc    Dismiss (clear) a notification
// @access  Private
router.put('/:id/dismiss', protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientId: req.user._id },
      { isCleared: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.status(200).json(notification);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error dismissing notification' });
  }
});

export default router;

```

### ./server/routes/report.js

```
import express from 'express';
import Report from '../models/Report.js';
import Block from '../models/Block.js';
import Match from '../models/Match.js';
import User from '../models/User.js';
import Interaction from '../models/Interaction.js';
import { protect } from '../middleware/auth.js';
import { REPORT_REASONS } from '../models/Report.js';
import { sendPushNotification } from '../utils/push.js';
import { addToQueue } from '../utils/queue.js';

const router = express.Router();

// @route   GET /api/report/reasons
// @desc    Get available report reasons
// @access  Private
router.get('/reasons', protect, (req, res) => {
  res.status(200).json({ reasons: REPORT_REASONS });
});

// @route   POST /api/report/:userId
// @desc    Report a user (auto-suspend after 3 unique reporters)
// @access  Private
router.post('/:userId', protect, async (req, res) => {
  const { reason, details } = req.body;
  const reportedId = req.params.userId;

  if (!reason || !REPORT_REASONS.includes(reason)) {
    return res.status(400).json({ message: 'Valid reason is required' });
  }

  if (reportedId === req.user._id.toString()) {
    return res.status(400).json({ message: 'Cannot report yourself' });
  }

  try {
    const reported = await User.findById(reportedId);
    if (!reported) return res.status(404).json({ message: 'User not found' });

    const report = await Report.create({
      reporter: req.user._id,
      reported: reportedId,
      reason,
      details: details || '',
    });

    // Escalation: 3-4 reports = shadowban, 5+ = full suspension
    const reportCount = await Report.countDocuments({ reported: reportedId });
    if (reportCount >= 3 && reportCount < 5) {
      reported.isGhost = true; // Hidden from Discover, existing matches remain active
      reported.shadowbannedAt = reported.shadowbannedAt || new Date();
      reported.contentFrozen = true;
      await reported.save();
    } else if (reportCount >= 5) {
      reported.suspended = true;
      reported.suspendedAt = new Date();
      reported.suspendedReason = 'Multiple community reports';
      reported.isGhost = true;
      reported.shadowbannedAt = reported.shadowbannedAt || new Date();
      reported.contentFrozen = false;
      await reported.save();
    } else {
      reported.isGhost = false;
      reported.shadowbannedAt = null;
      reported.contentFrozen = false;
      await reported.save();
    }

    res.status(201).json({ message: 'Report submitted', reportId: report._id });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Already reported this user' });
    }
    console.error(error);
    res.status(500).json({ message: 'Server error submitting report' });
  }
});

// @route   POST /api/block/:userId
// @desc    Block a user
// @access  Private
router.post('/block/:userId', protect, async (req, res) => {
  const blockedId = req.params.userId;

  if (blockedId === req.user._id.toString()) {
    return res.status(400).json({ message: 'Cannot block yourself' });
  }

  try {
    const blockedUser = await User.findById(blockedId);
    if (!blockedUser) return res.status(404).json({ message: 'User not found' });

    await Block.findOneAndUpdate(
      { blocker: req.user._id, blocked: blockedId },
      { blocker: req.user._id, blocked: blockedId },
      { upsert: true, new: true }
    );

    // Deactivate any existing match
    const match = await Match.findOne({
      users: { $all: [req.user._id, blockedId] },
      isActive: true,
    });
    if (match) {
      match.isActive = false;
      await match.save();
    }

    // Create permanent exclusion so they never appear in each other's Discover deck
    await Interaction.create([
      { actorId: req.user._id, targetId: blockedId, actionType: 'archive', cooldownExpiresAt: null },
      { actorId: blockedId, targetId: req.user._id, actionType: 'archive', cooldownExpiresAt: null },
    ]);

    const io = req.app.get('io');
    if (io) {
      io.to(blockedId).emit('unmatch-notification', { matchId: match?._id });
    }

    // In-app (socket 'unmatch-notification') + push already notify the blocked user.
    // No Notification DB row is created — the model is purpose-built for letter interactions.
    addToQueue(() => sendPushNotification(blockedId, {
      title: 'Unmatched',
      body: `You were unmatched by ${req.user.name}`,
    }));

    res.status(200).json({ message: 'User blocked' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error blocking user' });
  }
});

// @route   DELETE /api/block/:userId
// @desc    Unblock a user
// @access  Private
router.delete('/block/:userId', protect, async (req, res) => {
  try {
    await Block.findOneAndDelete({
      blocker: req.user._id,
      blocked: req.params.userId,
    });

    // Remove permanent exclusion so they can re-encounter in Discover
    await Interaction.deleteMany({
      $or: [
        { actorId: req.user._id, targetId: req.params.userId, actionType: 'archive' },
        { actorId: req.params.userId, targetId: req.user._id, actionType: 'archive' },
      ],
    });
    res.status(200).json({ message: 'User unblocked' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error unblocking user' });
  }
});

// @route   GET /api/block/list
// @desc    Get list of blocked users
// @access  Private
router.get('/list', protect, async (req, res) => {
  try {
    const blocks = await Block.find({ blocker: req.user._id })
      .populate('blocked', 'name photos branch year hostel pronouns')
      .sort({ createdAt: -1 });

    res.status(200).json({
      blocked: blocks.map((b) => ({
        _id: b.blocked._id,
        name: b.blocked.name,
        photo: b.blocked.photos?.[0],
        branch: b.blocked.branch,
        year: b.blocked.year,
        hostel: b.blocked.hostel,
        pronouns: b.blocked.pronouns,
        blockedAt: b.createdAt,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching blocked users' });
  }
});

// @route   GET /api/block/status/:userId
// @desc    Check block status with a user
// @access  Private
router.get('/status/:userId', protect, async (req, res) => {
  try {
    const block = await Block.findOne({
      $or: [
        { blocker: req.user._id, blocked: req.params.userId },
        { blocker: req.params.userId, blocked: req.user._id },
      ],
    });

    res.status(200).json({
      isBlocked: !!block,
      iBlockedThem: block?.blocker?.toString() === req.user._id.toString(),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error checking block status' });
  }
});

export default router;

```

### ./server/routes/upload.js

```
import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { protect } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

let upload;

if (isCloudinaryConfigured) {
  const { v2: cloudinary } = await import('cloudinary');
  const { CloudinaryStorage } = await import('multer-storage-cloudinary');

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
      const isAudio = file.mimetype.startsWith('audio/');
      return {
        folder: isAudio ? 'matchalize/audio' : 'matchalize/photos',
        allowed_formats: isAudio
          ? ['mp3', 'mp4', 'm4a', 'webm', 'ogg']
          : ['jpg', 'jpeg', 'png', 'webp'],
        ...(isAudio ? {} : {
          transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
          moderation: 'aws_rek',
        }),
      };
    },
  });

  upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });
} else {
  const storage = multer.diskStorage({
    destination: path.join(__dirname, '..', 'uploads'),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${req.user._id}-${Date.now()}${ext}`);
    },
  });

  upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });
}

const router = express.Router();

router.post('/', protect, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // CHECK: If Cloudinary AI rejected the photo
    if (req.file.moderation && req.file.moderation[0]?.status === 'rejected') {
      return res.status(403).json({ message: 'Photo rejected due to inappropriate content.' });
    }

    const url = isCloudinaryConfigured
      ? req.file.path
      : `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({ url });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Upload failed' });
  }
});

export default router;

```

### ./server/routes/users.js

```
import express from 'express';
import { body } from '../middleware/validate.js';
import User from '../models/User.js';
import Match from '../models/Match.js';
import Message from '../models/Message.js';
import Block from '../models/Block.js';
import Report from '../models/Report.js';
import Notification from '../models/Notification.js';
import Analytics from '../models/Analytics.js';
import Interaction from '../models/Interaction.js';
import { protect, clearAuthCookie } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { deleteCloudinaryFile } from '../config/cloudinary.js';

const router = express.Router();

// Helper to collect all photo URLs (profile photos, bio photo, prompt attachments) from a user document
const collectUserPhotos = (u) => {
  const urls = new Set();
  if (u.photos && Array.isArray(u.photos)) u.photos.forEach(url => url && urls.add(url));
  if (u.bioPhoto) urls.add(u.bioPhoto);
  if (u.prompts && Array.isArray(u.prompts)) {
    u.prompts.forEach(p => p.photoUrl && urls.add(p.photoUrl));
  }
  return urls;
};

// Helper function to validate image URLs
const isValidImageUrl = (url) => {
  if (!url || typeof url !== 'string') return false;

  try {
    const parsed = new URL(url);

    const isProd = process.env.NODE_ENV === 'production';
    if (isProd && parsed.protocol !== 'https:') return false;

    const hostname = parsed.hostname;

    if (!isProd && (
      hostname === 'localhost' || 
      hostname === '127.0.0.1' ||
      hostname.startsWith('10.') || 
      hostname.startsWith('192.168.') || 
      hostname.startsWith('172.')
    )) {
      return /\.(jpg|jpeg|png|webp)$/i.test(parsed.pathname);
    }

    const trustedHosts = [
      'res.cloudinary.com',
      'images.unsplash.com',
    ];

    const isTrusted = trustedHosts.some(
      (host) => hostname === host || hostname.endsWith(`.${host}`)
    );

    if (!isTrusted) return false;

    return /\.(jpg|jpeg|png|webp)$/i.test(parsed.pathname);
  } catch {
    return false;
  }
};

// @route   POST /api/users/setup
// @desc    Complete onboarding registration
router.post(
  '/setup',
  protect,
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('age').isInt({ min: 18, max: 40 }).withMessage('Must be between 18 and 40'),
    body('gender').notEmpty().withMessage('Gender is required'),
    body('branch').notEmpty().withMessage('Branch is required'),
    body('year').notEmpty().withMessage('Year is required'),
    body('intent').custom((val) => {
      if (Array.isArray(val)) return val.length > 0;
      return typeof val === 'string' && val.trim() !== '';
    }).withMessage('At least one connection intent is required'),
  ],
  validate,
  async (req, res) => {
    const {
      name, age, gender, pronouns, branch, year, hostel, bio, bioPhoto,
      prompts, photos, intent, interestedIn, interests, compatAnswers,
    } = req.body;

    try {
      const user = await User.findById(req.user._id);
      if (!user) return res.status(404).json({ message: 'User not found' });
      if (user.contentFrozen) {
        return res.status(403).json({
          message: 'This feature is temporarily unavailable. Contact support@matchalize.com',
          code: 'CONTENT_FROZEN',
        });
      }

      // VALIDATION: Check image URLs
      const photosToSave = (Array.isArray(photos) ? photos : []).filter(Boolean).slice(0, 6);
      if (!photosToSave.every(isValidImageUrl)) {
        return res.status(400).json({ message: 'One or more photo URLs are invalid.' });
      }

      const promptsToSave = Array.isArray(prompts) ? prompts.slice(0, 3) : [];
      if (promptsToSave.some(p => p.photoUrl && !isValidImageUrl(p.photoUrl))) {
        return res.status(400).json({ message: 'One or more prompt photo URLs are invalid.' });
      }

      const oldPhotos = collectUserPhotos(user);

      user.name = name;
      user.age = age;
      user.gender = gender;
      user.pronouns = pronouns || '';
      user.branch = branch;
      user.year = year;
      user.hostel = hostel || '';
      user.bio = bio || '';
      user.bioPhoto = bioPhoto || '';
      user.prompts = promptsToSave;
      user.photos = photosToSave;
      user.intent = intent;
      user.interestedIn = interestedIn || [];
      user.interests = Array.isArray(interests) ? interests.slice(0, 6) : [];
      user.compatAnswers = compatAnswers || [];
      user.isOnboarded = true;

      await user.save();

      // 🧹 VAPORIZE ORPHANED PHOTOS: Delete any old photo that isn't in the new profile
      const newPhotos = collectUserPhotos(user);
      oldPhotos.forEach(url => {
        if (!newPhotos.has(url)) deleteCloudinaryFile(url);
      });

      // ANALYTICS: Track completion
      await Analytics.create({ user: req.user._id, event: 'ONBOARDING_COMPLETE', step: 8 });

      res.status(200).json(user);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error during onboarding setup' });
    }
  }
);

// @route   GET /api/users/profile
// @desc    Get user's own profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile details
// @access  Private
router.put('/profile', protect, async (req, res) => {
    const {
    name,
    gender,
    pronouns,
    branch,
    year,
    bio,
    prompts,
    photos,
    intent,
    interestedIn,
    ageRange,
    interests,
    hostel,
    compatAnswers,
    isGhost,
  } = req.body;

  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.contentFrozen) {
      return res.status(403).json({
        message: 'This feature is temporarily unavailable. Contact support@matchalize.com',
        code: 'CONTENT_FROZEN',
      });
    }

    const oldPhotos = collectUserPhotos(user);

    if (name) user.name = name;
    if (gender) user.gender = gender;
    if (pronouns !== undefined) user.pronouns = pronouns;
    if (branch) user.branch = branch;
    if (year) user.year = year;
    if (bio !== undefined) user.bio = bio;
    if (prompts) {
      const promptsToSave = Array.isArray(prompts) ? prompts.slice(0, 3) : [];
      if (promptsToSave.some(p => p.photoUrl && !isValidImageUrl(p.photoUrl))) {
        return res.status(400).json({ message: 'One or more prompt photo URLs are invalid.' });
      }
      user.prompts = promptsToSave;
    }
    if (photos) {
      const photosToSave = (Array.isArray(photos) ? photos : []).filter(Boolean).slice(0, 6);
      if (!photosToSave.every(isValidImageUrl)) {
        return res.status(400).json({ message: 'One or more photo URLs are invalid.' });
      }
      user.photos = photosToSave;
    }
    if (intent) user.intent = intent;
    if (interestedIn) user.interestedIn = interestedIn;
    if (ageRange) user.ageRange = ageRange;
    if (interests) user.interests = interests;
    if (hostel !== undefined) user.hostel = hostel;
    if (compatAnswers) user.compatAnswers = compatAnswers;
    if (isGhost !== undefined) user.isGhost = isGhost;

    await user.save();

    // 🧹 VAPORIZE ORPHANED PHOTOS: Clean up removed/replaced images
    const newPhotos = collectUserPhotos(user);
    oldPhotos.forEach(url => {
      if (!newPhotos.has(url)) deleteCloudinaryFile(url);
    });

    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

// @route   DELETE /api/users/account
// @desc    Soft-delete user account with 30-day safety retention
// @access  Private
router.delete('/account', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // 🧹 IMMEDIATE WIPE: Public profile media from Cloudinary
    // (Profile photos, bio photo, prompt attachments — serve no purpose after deletion)
    collectUserPhotos(user).forEach(url => deleteCloudinaryFile(url));

    // ⚠️ SAFETY RETENTION: Chat media is NOT wiped here.
    // Messages (including photos/voice notes) are retained for 30-day safety window
    // to allow Trust & Safety investigations if the user is reported after deletion.
    // A background cleanup job handles final Cloudinary purge after retention expires.

    // 🏴 SOFT DELETE: Wipe PII, flag as deleted
    user.name = 'Deleted User';
    user.photos = [];
    user.bio = '';
    user.bioPhoto = '';
    user.prompts = [];
    user.isDeleted = true;
    user.deletedAt = new Date();
    user.isGhost = true;
    user.suspended = false;
    user.pushSubscription = null;
    user.interestedIn = [];
    user.interests = [];
    user.compatAnswers = [];
    await user.save();

    // 💔 DEACTIVATE all matches (chats vanish from inboxes instantly)
    await Match.updateMany({ users: userId }, { $set: { isActive: false } });

    // 🧹 CLEANUP: Records with no safety retention value
    await Block.deleteMany({ $or: [{ blocker: userId }, { blocked: userId }] });
    await Report.deleteMany({ $or: [{ reporter: userId }, { reported: userId }] });
    await Notification.deleteMany({ $or: [{ recipientId: userId }, { senderId: userId }] });
    await Analytics.deleteMany({ user: userId });

    // 📦 RETAIN for 30-day safety window: Messages, Matches, Interactions
    // (Final hard deletion handled by background cleanup job)

    // 🔒 CLEAR SESSION
    clearAuthCookie(res);
    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting account' });
  }
});

// @route   GET /api/users/onboarding/resume
// @desc    Get saved onboarding progress
// @access  Private
router.get('/onboarding/resume', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('onboardingStep onboardingData');
    res.json({ step: user.onboardingStep, data: user.onboardingData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/onboarding/save
// @desc    Save onboarding progress
router.put('/onboarding/save', protect, async (req, res) => {
  try {
    const { step, data } = req.body;
    await User.findByIdAndUpdate(req.user._id, { onboardingStep: step, onboardingData: data });
    
    // ANALYTICS: Track user progression
    await Analytics.create({ user: req.user._id, event: 'ONBOARDING_STEP', step });

    res.json({ saved: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/users/onboarding/clear
// @desc    Clear saved onboarding progress
// @access  Private
router.delete('/onboarding/clear', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { onboardingStep: 1, onboardingData: {} });
    res.json({ cleared: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/logout-all
// @desc    Invalidate all active sessions for the current user
// @access  Private
router.post('/logout-all', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { lastLogoutAt: new Date() });
    res.status(200).json({ message: 'Logged out from all other devices successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

```

### ./server/seedDummies.js

```
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import { COMPAT_QUESTIONS } from './config/compatQuestions.js';
import { BRANCHES, YEARS, INTENTS, INTEREST_TAGS, PROMPT_BANK } from './config/appData.js';

dotenv.config();

const DUMMY_COUNT = 100;

const FEMALE_PROFILES = [
  { name: 'Ananya Sharma' }, { name: 'Priya Patel' }, { name: 'Kavya Iyer' }, { name: 'Meera Nair' },
  { name: 'Zara Khan' }, { name: 'Sneha Rao' }, { name: 'Nandini Das' }, { name: 'Ishita Kapoor' },
  { name: 'Rhea Chatterjee' }, { name: 'Tanvi Shah' }, { name: 'Aisha Sheikh' }, { name: 'Diya Menon' },
  { name: 'Riya Pillai' }, { name: 'Shruti Deshpande' }, { name: 'Pooja Kulkarni' }, { name: 'Sanjana Reddy' },
  { name: 'Isha Verma' }, { name: 'Mahika Joshi' }, { name: 'Anjali Gupta' }, { name: 'Trisha Bose' },
  { name: 'Sanya Malhotra' }, { name: 'Nikita Bansal' }, { name: 'Aditi Thakur' }, { name: 'Shreya Apte' },
  { name: 'Vaishnavi Rao' }, { name: 'Harshita Singh' }, { name: 'Tanya Chopra' }, { name: 'Divya Nair' },
  { name: 'Mrunal Desai' }, { name: 'Sakshi Jain' }, { name: 'Ritika Sharma' }, { name: 'Pia Mehta' },
  { name: 'Vidhi Agrawal' }, { name: 'Netra Kulkarni' }, { name: 'Chaitra Hegde' }, { name: 'Lavanya Iyer' },
  { name: 'Gauri Patil' }, { name: 'Simran Kaur' }, { name: 'Mehak Kapoor' }, { name: 'Rupali Das' },
  { name: 'Jhanvi Shah' }, { name: 'Bhavna Trivedi' }, { name: 'Nisha Kumari' }, { name: 'Aradhana Mishra' },
  { name: 'Shivani Dubey' }, { name: 'Pallavi Banerjee' }, { name: 'Kirti Aggarwal' }, { name: 'Swati Naik' },
  { name: 'Pranita Sahu' }, { name: 'Ekta Goyal' },
];

const MALE_PROFILES = [
  { name: 'Rohan Mehta' }, { name: 'Aarav Kumar' }, { name: 'Kabir Singh' }, { name: 'Arjun Gupta' },
  { name: 'Dev Joshi' }, { name: 'Aditya Verma' }, { name: 'Vihaan Malhotra' }, { name: 'Shaurya Bhatia' },
  { name: 'Pranav Reddy' }, { name: 'Dhruv Choudhary' }, { name: 'Ishaan Desai' }, { name: 'Rishabh Jain' },
  { name: 'Karan Malhotra' }, { name: 'Siddharth Rao' }, { name: 'Yash Thakur' }, { name: 'Omkar Pawar' },
  { name: 'Vedant Kulkarni' }, { name: 'Harsh Vardhan' }, { name: 'Kunal Bansal' }, { name: 'Nikhil Sharma' },
  { name: 'Aryan Kapoor' }, { name: 'Tushar Mehta' }, { name: 'Manav Goyal' }, { name: 'Sarthak Jain' },
  { name: 'Ayush Srivastava' }, { name: 'Varun Nair' }, { name: 'Raghav Iyer' }, { name: 'Kartik Menon' },
  { name: 'Abhinav Gupta' }, { name: 'Sahil Chopra' }, { name: 'Aditya Shukla' }, { name: 'Rahul Pillai' },
  { name: 'Priyansh Agrawal' }, { name: 'Shivam Dubey' }, { name: 'Deepak Bhatt' }, { name: 'Tarun Bhatia' },
  { name: 'Naman Sahu' }, { name: 'Jeet Banerjee' }, { name: 'Karan Patel' }, { name: 'Arnav Kulkarni' },
  { name: 'Ritvik Singh' }, { name: 'Uday Shankar' }, { name: 'Mohit Deshpande' }, { name: 'Parth Trivedi' },
  { name: 'Gaurav Naik' }, { name: 'Harsh Agarwal' }, { name: 'Yuvraj Singh' }, { name: 'Aniket Bose' },
  { name: 'Shubham Tiwari' }, { name: 'Rohan Kulkarni' },
];

const HOSTELS = [
  'Hostel 1', 'Hostel 2', 'Hostel 3', 'Hostel 4', 'Hostel 5', 'Hostel 6',
  'Hostel 7', 'Hostel 8', 'Hostel 9', 'Hostel 10', 'Hostel 11', 'Hostel 12',
  'Hostel 13', 'Hostel 14', 'Hostel 15',
];

const PHOTO_IDS = {
  Female: [
    'photo-1494790108377-be9c29b29330', 'photo-1438761681033-6461ffad8d80',
    'photo-1544005313-94ddf0286df2', 'photo-1529626455594-4ff0802cfb7e',
    'photo-1531746020798-e6953c6e8e04', 'photo-1534528741775-53994a69daeb',
    'photo-1524504388940-b1c1722653e1', 'photo-1517841905240-472988babdf9',
    'photo-1548142813-c348350df52b', 'photo-1531123897727-8f129e1688ce',
    'photo-1517365830460-955ce3ccd263', 'photo-1508214751196-bcfd4ca60f91',
    'photo-1488426862026-3ee34a7d66df', 'photo-1531746790731-6c087fecd65a',
    'photo-1554151228-14d9def656e4', 'photo-1546961329-78bef0414d7c',
  ],
  Male: [
    'photo-1507003211169-0a1dd7228f2d', 'photo-1500648767791-00dcc994a43e',
    'photo-1506794778202-cad84cf45f1d', 'photo-1539571696357-5a69c17a67c6',
    'photo-1519085360753-af0119f7cbe7', 'photo-1521119989659-a83eee488004',
    'photo-1504257432389-52343af06ae3', 'photo-1472099645785-5658abf4ff4e',
    'photo-1492562080023-ab3db95bfbce', 'photo-1527980965255-d3b416303d12',
    'photo-1531384441138-2736e62e0919', 'photo-1509347528160-9a9e33742cdb',
    'photo-1522075469751-3a6694fb2f61', 'photo-1520975954732-35dd22299614',
    'photo-1519345182560-3f2917c472ef', 'photo-1518806118471-f28b20a1d79d',
  ],
};

const BIOS = [
  'CSE junta. Fueled by filter coffee, hostel raids, and 3AM assignment chaos. Looking for someone to share playlists and canteen runs with.',
  'I spend my weekends between the library, the gym, and late-night chai at the canteen. Come find me when you need a study break.',
  'Math & Computing, but my real specialisation is overthinking text messages. Soft spot for monsoon walks and doodles in lecture margins.',
  'Photography nerd who shoots everything from sunrises at the lake to street dogs near the hostel gate. Let\'s explore campus together.',
  'Engineer by day, meme curator by night. I bring the snacks, you bring the conversation.',
  'I can\'t grow a plant to save my life, but I make great tea. Enthusiastic badminton player, certified foodie, terrible dancer, great company.',
  'Third-year mech guy who can talk about F1, metal, and machine design for hours. Bonus points if you can beat me at chess.',
  'I write poetry nobody reads and code everyone uses. Looking for someone to debate the best canteen dish with.',
  'Aerospace nerd. If you can sit through my 20-minute explanation of why planes fly, we\'re basically soulmates.',
  'Civil engineering, but my real passion is complaining about the weather while walking everywhere.',
  'Ask me about my hostel wing\'s legendary midnight Maggi sessions. I collect good stories and better playlists.',
  'Chemistry + startup dreams. I\'ll pitch you a business idea over chai if you promise to laugh at my bad jokes.',
  'Textile tech with an eye for fashion. Equal parts streetwear obsessive and museum wanderer.',
  'I\'ll race you to the next lecture and lose on purpose so we can walk and talk.',
  'Late-night library regular. My love language is sharing notes and good book recommendations.',
  'Gamer and AI/ML enthusiast. I carry a deck of cards everywhere and can shuffle mid-conversation.',
  'I run (jog, honestly) every morning. Looking for a workout buddy or someone to share breakfast with after.',
  'Physics freak who thinks everything is more fun with equations. And ice cream. Mostly ice cream.',
  'Metal head with a soft playlist for the right person. My hostel room has more posters than furniture.',
  'I make playlists for every mood and food for every occasion. Come hungry, leave happy.',
];

const PROMPT_ANSWERS = [
  'My go-to answer is always "two truths and a lie" and I never lie. That\'s the lie.',
  'Honestly? Late-night Maggi and a good conversation.',
  'I once fell asleep in the library and woke up to my friends\' group photo as my wallpaper.',
  'The best way to my heart is through the canteen\'s chai and a well-timed meme.',
  'I\'m weirdly good at parallel parking, balancing plates, and remembering song lyrics.',
  'My 3AM thoughts usually go like — should I study now or start my assignment at 6AM like a genius?',
  'I collect movie tickets like some people collect stamps. It\'s a problem.',
  'My biggest flex is that I survived a semester with zero alarms and zero missed submissions.',
  'I\'ll fall for you if you get my references without me having to explain them.',
  'The most impulsive thing I\'ve done is sign up for a hackathon at 2AM. No regrets.',
  'One thing I can\'t live without is my noise-cancelling headphones. And chai.',
  'I\'m basically a professional at overthinking a text that just said "ok".',
  'My hidden talent is making the perfect cup of chai under pressure.',
  'If I could change one campus rule, it\'d be the chai stall closing time.',
  'I finally understand why people say the monsoon makes everything better here.',
];

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomSubset = (arr, min, max) => {
  const count = min + Math.floor(Math.random() * (max - min + 1));
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

const buildPhotos = (gender) => {
  const pool = PHOTO_IDS[gender];
  const start = Math.floor(Math.random() * pool.length);
  const photos = [];
  for (let i = 0; i < 5; i++) {
    const id = pool[(start + i) % pool.length];
    photos.push(`https://images.unsplash.com/${id}?w=600&auto=format&fit=crop&q=80`);
  }
  return photos;
};

const buildPrompts = () => {
  const questions = getRandomSubset(PROMPT_BANK, 3, 4);
  return questions.map((question) => ({
    question,
    answer: getRandom(PROMPT_ANSWERS),
  }));
};

const buildCompatAnswers = () =>
  COMPAT_QUESTIONS.map((q) => ({
    question: q.id,
    answer: getRandom(q.options).key,
  }));

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) throw new Error('MONGO_URI / MONGODB_URI not found in .env file!');

    await mongoose.connect(mongoUri);
    console.log('📦 Connected to MongoDB Atlas...');

    const existingUser = await User.findOne({});
    const targetCollegeCode = existingUser ? existingUser.collegeCode : 'iitb';
    console.log(`🎯 Targeting collegeCode: "${targetCollegeCode}" so they show up in your deck!`);

    await User.deleteMany({ email: { $regex: 'dummy.*@.*\\.ac\\.in' } });
    console.log('🧹 Cleared old dummy accounts...');

    const allProfiles = [
      ...FEMALE_PROFILES.map((p) => ({ ...p, gender: 'Female' })),
      ...MALE_PROFILES.map((p) => ({ ...p, gender: 'Male' })),
    ].slice(0, DUMMY_COUNT);

    const dummyUsers = allProfiles.map((item, index) => {
      const isMale = item.gender === 'Male';
      const age = 18 + Math.floor(Math.random() * 7); // 18-24
      const hoursAgo = Math.floor(Math.random() * 72); // recency variety

      return {
        name: item.name,
        email: `dummy.${item.name.toLowerCase().replace(/[^a-z]+/g, '.').replace(/^\.|\.$/g, '')}.${index}@campus.ac.in`,
        college: 'IIT Bombay',
        collegeCode: targetCollegeCode,
        gender: item.gender,
        interestedIn: isMale ? ['Female'] : ['Male'],
        age,
        ageRange: { min: 18, max: 30 },
        photos: buildPhotos(item.gender),
        bio: getRandom(BIOS),
        branch: getRandom(BRANCHES),
        year: getRandom(YEARS),
        hostel: getRandom(HOSTELS),
        pronouns: isMale ? 'he/him' : 'she/her',
        interests: getRandomSubset(INTEREST_TAGS, 3, 5),
        intent: getRandomSubset(INTENTS, 1, 3),
        prompts: buildPrompts(),
        compatAnswers: buildCompatAnswers(),
        isOnboarded: true,
        isVerified: true,
        isGhost: false,
        isDeleted: false,
        suspended: false,
        lastActive: new Date(Date.now() - hoursAgo * 60 * 60 * 1000),
      };
    });

    const created = await User.insertMany(dummyUsers);
    console.log(`✅ Successfully inserted ${created.length} rich dummy profiles!`);
    console.log('🚀 Go refresh your web app — your Discover deck is now full!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding dummies:', error);
    process.exit(1);
  }
};

seedDatabase();

```

### ./server/socket/chat.js

```
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Match from '../models/Match.js';
import Message from '../models/Message.js';
import { areBlocked } from '../middleware/blockFilter.js';

const onlineUsers = new Map(); // userId -> Set<socketId>

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
      if (cookies.matchalize_jwt) {
        token = cookies.matchalize_jwt;
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

    // ─── PER-EVENT SUSPENSION CHECK ───
    // Runs before EVERY inbound event on an already-connected socket.
    // Catches users suspended mid-session and force-disconnects them instantly.
    socket.use(async (packet, next) => {
      try {
        const user = await User.findById(userId)
          .select('suspended isDeleted')
          .lean();

        if (!user || user.isDeleted || user.suspended) {
          socket.emit('force-disconnect', {
            reason: user?.suspended ? 'Account suspended' : 'Account unavailable',
          });
          socket.disconnect(true);
          return next(new Error('Account suspended or deleted'));
        }

        next();
      } catch (err) {
        console.error('Suspension check error:', err);
        next(); // Let it pass on DB error — don't lock everyone out
      }
    });

    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);
    User.findByIdAndUpdate(userId, { lastActive: new Date() }).exec()
      .catch(err => console.error('Failed to update lastActive:', err));

    socket.on('join-match', async (matchId) => {
      if (!matchId || typeof matchId !== 'string') return;

      try {
        const match = await Match.findOne({ _id: matchId, users: userId, isActive: true });
        if (!match) return socket.emit('error', { message: 'Not authorized for this match' });

        const otherUserId = match.users.find(u => u.toString() !== userId);
        if (otherUserId && await areBlocked(userId, otherUserId)) {
          return socket.emit('error', { message: 'Cannot join match — user is blocked' });
        }
      } catch (err) {
        console.error('join-match validation error:', err);
        return;
      }

      socket.join(matchId);
      io.to(matchId).emit('online-update', {
        userId,
        online: true,
        lastActive: new Date().toISOString(),
      });
    });

    socket.on('typing', async ({ matchId }) => {
      if (!matchId || typeof matchId !== 'string') return;
      try {
        const match = await Match.findOne({ _id: matchId, users: userId, isActive: true });
        if (!match) return;
        socket.to(matchId).emit('user-typing', { userName: socket.user.name });
      } catch (err) {
        console.error('typing validation error:', err);
      }
    });

    socket.on('stop-typing', async ({ matchId }) => {
      if (!matchId || typeof matchId !== 'string') return;
      try {
        const match = await Match.findOne({ _id: matchId, users: userId, isActive: true });
        if (!match) return;
        socket.to(matchId).emit('user-stop-typing');
      } catch (err) {
        console.error('stop-typing validation error:', err);
      }
    });

    socket.on('check-online', async ({ matchId, targetUserId }) => {
      try {
        if (!matchId || !targetUserId) return;

        // 🔒 STALKING PREVENTION: Verifies active match membership before disclosing online activity
        const validMatch = await Match.findOne({
          _id: matchId,
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

    socket.on('read-messages', async ({ matchId }) => {
      if (!matchId || typeof matchId !== 'string') return;

      // Validate match membership
      try {
        const match = await Match.findOne({ _id: matchId, users: userId, isActive: true });
        if (!match) return;

        await Message.updateMany(
          { matchId, senderId: { $ne: userId }, readAt: null },
          { $set: { readAt: new Date(), deliveryStatus: 'read' } }
        );
        socket.to(matchId).emit('messages-read', { readerId: userId });
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

      User.findByIdAndUpdate(userId, { lastActive: new Date() }).exec()
        .catch(err => console.error('Failed to update lastActive:', err));

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

### ./server/utils/asyncHandler.js

```
/**
 * Wraps an async Express route handler so rejected promises
 * are forwarded to the next() error handler instead of crashing.
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

```

### ./server/utils/email.js

```
export const sendOTP = async (email, otp) => {
  const apiKey = process.env.SENDGRID_API_KEY;

  if (!apiKey) {
    console.log(`\n----------------------------------------`);
    console.log(`[DEV MODE] OTP for ${email}: ${otp}`);
    console.log(`----------------------------------------\n`);
    return true;
  }

  const htmlContent = `
    <div style="font-family: 'Inter', sans-serif; background-color: #0A0A0C; color: #F5F5F7; padding: 40px 20px; text-align: center; max-width: 500px; margin: 0 auto; border-radius: 16px; border: 1px solid rgba(255,255,255,0.06);">
      <h1 style="color: #D4A853; font-size: 28px; margin-bottom: 8px; font-weight: 700; letter-spacing: 2px;">MATCHALIZE</h1>
      <p style="color: #6E6E80; font-size: 14px; margin-bottom: 24px;">Your Campus. Your People.</p>
      <div style="background-color: #141418; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid rgba(255,255,255,0.03);">
        <p style="font-size: 16px; color: #F5F5F7; margin-top: 0;">Here is your verification code:</p>
        <div style="font-size: 36px; font-weight: 700; color: #D4A853; letter-spacing: 6px; margin: 16px 0;">${otp}</div>
        <p style="font-size: 12px; color: #6E6E80; margin-bottom: 0;">This code is valid for 10 minutes and can only be used once.</p>
      </div>
      <p style="font-size: 12px; color: #6E6E80; line-height: 1.5;">If you did not request this code, you can safely ignore this email.</p>
    </div>
  `;

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email }] }],
      from: { email: 'adityabhati.iitb@gmail.com', name: 'Matchalize' },
      subject: `Matchalize Verification Code: ${otp}`,
      content: [{ type: 'text/html', value: htmlContent }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('SendGrid API error:', err);
    throw new Error(`SendGrid API error: ${err}`);
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log(`\n----------------------------------------`);
    console.log(`[OTP] For ${email}: ${otp}`);
    console.log(`----------------------------------------\n`);
  }

  return true;
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
    const user = await User.findById(userId).select('pushSubscription name');
    if (!user?.pushSubscription) return false;

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
export const addToQueue = (task) => {
  setImmediate(async () => {
    try {
      await task();
    } catch (error) {
      console.error('[Background Queue Error]', error);
      // Surface background failures in Sentry when initialized (safe no-op if DSN unset)
      Sentry.captureException(error);
    }
  });
};

```

