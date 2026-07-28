# Matchalize — Server Codebase Dump

> Verbatim contents of all server source and configuration files.
> Generated with latest changes applied.
> Excludes: .env, node_modules/, uploads/, dist/, build/, and package-lock.json.

### server/seedDummies.js
**Type:** Client Source: seedDummies
**Size:** 117 lines (103 non-empty)

```
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import { COMPAT_QUESTIONS } from './config/compatQuestions.js';

dotenv.config();

const dummyNames = [
  { name: 'Ananya Sharma', gender: 'Female', age: 20 },
  { name: 'Rohan Mehta', gender: 'Male', age: 21 },
  { name: 'Priya Patel', gender: 'Female', age: 19 },
  { name: 'Aarav Kumar', gender: 'Male', age: 22 },
  { name: 'Kavya Iyer', gender: 'Female', age: 20 },
  { name: 'Kabir Singh', gender: 'Male', age: 21 },
  { name: 'Meera Nair', gender: 'Female', age: 20 },
  { name: 'Arjun Gupta', gender: 'Male', age: 19 },
  { name: 'Zara Khan', gender: 'Female', age: 21 },
  { name: 'Dev Joshi', gender: 'Male', age: 22 },
  { name: 'Sneha Rao', gender: 'Female', age: 20 },
  { name: 'Aditya Verma', gender: 'Male', age: 21 },
  { name: 'Nandini Das', gender: 'Female', age: 19 },
  { name: 'Vihaan Malhotra', gender: 'Male', age: 20 },
  { name: 'Ishita Kapoor', gender: 'Female', age: 21 },
  { name: 'Shaurya Bhatia', gender: 'Male', age: 22 },
  { name: 'Rhea Chakraborty', gender: 'Female', age: 20 },
  { name: 'Pranav Reddy', gender: 'Male', age: 21 },
  { name: 'Tanvi Shah', gender: 'Female', age: 19 },
  { name: 'Dhruv Choudhary', gender: 'Male', age: 20 }
];

const branches = ['Computer Science', 'Electronics', 'Mechanical', 'Economics', 'Design', 'Physics'];
const hostels = ['Hostel 1', 'Hostel 3', 'Hostel 5', 'Hostel 8', 'Hostel 12', 'Hostel 15'];
const interestsList = ['Photography', 'Indie Music', 'Bouldering', 'Anime', 'Coffee', 'Late Night Drives', 'Reading', 'Coding', 'Badminton', 'Thrash Metal', 'Street Food', 'Poetry'];

const samplePhotos = {
  Female: [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&auto=format&fit=crop&q=80'
  ],
  Ma...

(Showing first 2000 chars of 117 total lines)
```

### server/.DS_Store
**Type:** `server/.DS_Store`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xa2 in position 352: invalid start byte
```

### server/index.js
**Type:** Server Application Entry Point
**Size:** 233 lines (203 non-empty)

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
  console.warn('⚠️  Clo...

(Showing first 2000 chars of 233 total lines)
```

### server/.npmrc
**Type:** `server/.npmrc`
**Size:** 1 lines (1 non-empty)

```
legacy-peer-deps=true

```

### server/.gitignore
**Type:** `server/.gitignore`
**Size:** 4 lines (4 non-empty)

```
.env
node_modules/
dist/
build/

```

### server/package.json
**Type:** Package Configuration
**Size:** 34 lines (34 non-empty)

```
{
  "name": "matchalize-server",
  "version": "1.0.0",
  "description": "Backend server for Matchalize campus dating app",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
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

### server/middleware/rateLimiters.js
**Type:** Client Source: rateLimiters
**Size:** 45 lines (41 non-empty)

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

### server/middleware/auth.js
**Type:** Client Source: auth
**Size:** 90 lines (76 non-empty)

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

### server/middleware/blockFilter.js
**Type:** Client Source: blockFilter
**Size:** 38 lines (34 non-empty)

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

### server/middleware/validate.js
**Type:** Client Source: validate
**Size:** 9 lines (8 non-empty)

```
import { validationResult } from 'express-validator';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

```

### server/config/appData.js
**Type:** Server Configuration
**Size:** 263 lines (253 non-empty)

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
  "Aerospace Engi...

(Showing first 2000 chars of 263 total lines)
```

### server/config/db.js
**Type:** Server Configuration
**Size:** 13 lines (11 non-empty)

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

### server/config/cloudinary.js
**Type:** Server Configuration
**Size:** 32 lines (28 non-empty)

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

### server/config/compatQuestions.js
**Type:** Server Configuration
**Size:** 176 lines (167 non-empty)

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
      { key: 'unsure', labe...

(Showing first 2000 chars of 176 total lines)
```

### server/uploads/6a593c388c736f3acc68af75-1784238162938.jpeg
**Type:** `server/uploads/6a593c388c736f3acc68af75-1784238162938.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5f7ca89c718d068b19a07b-1784643800990.jpeg
**Type:** `server/uploads/6a5f7ca89c718d068b19a07b-1784643800990.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a66112c3ec6e8b0c371b2ee-1785081958158.jpeg
**Type:** `server/uploads/6a66112c3ec6e8b0c371b2ee-1785081958158.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a593c388c736f3acc68af75-1784290995400.jpg
**Type:** `server/uploads/6a593c388c736f3acc68af75-1784290995400.jpg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a65a6739b872e425f207e96-1785046678766.jpeg
**Type:** `server/uploads/6a65a6739b872e425f207e96-1785046678766.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a4411571c2a799a78c25800-1782846922397.jpeg
**Type:** `server/uploads/6a4411571c2a799a78c25800-1782846922397.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a48efbca59523e4320af3de-1783723489683.jpeg
**Type:** `server/uploads/6a48efbca59523e4320af3de-1783723489683.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a623183b657d14788283ef2-1784820313045.jpeg
**Type:** `server/uploads/6a623183b657d14788283ef2-1784820313045.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5f7ca89c718d068b19a07b-1784646334466.jpeg
**Type:** `server/uploads/6a5f7ca89c718d068b19a07b-1784646334466.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a430e71cc22fa0ba8cd9bf2-1782781010645.jpeg
**Type:** `server/uploads/6a430e71cc22fa0ba8cd9bf2-1782781010645.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a593c388c736f3acc68af75-1784290983075.jpg
**Type:** `server/uploads/6a593c388c736f3acc68af75-1784290983075.jpg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a430e71cc22fa0ba8cd9bf2-1782781020953.jpeg
**Type:** `server/uploads/6a430e71cc22fa0ba8cd9bf2-1782781020953.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a4404ecff79f4b6ecd4b132-1782856807233.jpeg
**Type:** `server/uploads/6a4404ecff79f4b6ecd4b132-1782856807233.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a4563a4a9468658d2f6e7fe-1782932458980.JPG
**Type:** `server/uploads/6a4563a4a9468658d2f6e7fe-1782932458980.JPG`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5a1f2356a3b094257aefe1-1784291233211.jpg
**Type:** `server/uploads/6a5a1f2356a3b094257aefe1-1784291233211.jpg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a4563a4a9468658d2f6e7fe-1782932467225.JPG
**Type:** `server/uploads/6a4563a4a9468658d2f6e7fe-1782932467225.JPG`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5f7ca89c718d068b19a07b-1784646892771.jpeg
**Type:** `server/uploads/6a5f7ca89c718d068b19a07b-1784646892771.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5ed9762ab1b9a20425858b-1784601558481.jpeg
**Type:** `server/uploads/6a5ed9762ab1b9a20425858b-1784601558481.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a49106ea59523e4320af42b-1783732877630.jpeg
**Type:** `server/uploads/6a49106ea59523e4320af42b-1783732877630.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a65a6739b872e425f207e96-1785046894753.jpeg
**Type:** `server/uploads/6a65a6739b872e425f207e96-1785046894753.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a4411571c2a799a78c25800-1782846597733.mov
**Type:** `server/uploads/6a4411571c2a799a78c25800-1782846597733.mov`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xc5 in position 23: invalid continuation byte
```

### server/uploads/6a5d632c0173438f2d01d3bc-1784505175337.jpeg
**Type:** `server/uploads/6a5d632c0173438f2d01d3bc-1784505175337.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5a082f3fd7b84692fe19d6-1784288618940.jpeg
**Type:** `server/uploads/6a5a082f3fd7b84692fe19d6-1784288618940.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5b730e803fe247ebb92e19-1784378256036.jpeg
**Type:** `server/uploads/6a5b730e803fe247ebb92e19-1784378256036.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5d632c0173438f2d01d3bc-1784505202971.jpeg
**Type:** `server/uploads/6a5d632c0173438f2d01d3bc-1784505202971.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a430e71cc22fa0ba8cd9bf2-1782781000062.jpeg
**Type:** `server/uploads/6a430e71cc22fa0ba8cd9bf2-1782781000062.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5a6cfb033b6b24855cf131-1784311073752.jpg
**Type:** `server/uploads/6a5a6cfb033b6b24855cf131-1784311073752.jpg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5f7ca89c718d068b19a07b-1784646343757.jpeg
**Type:** `server/uploads/6a5f7ca89c718d068b19a07b-1784646343757.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a48efbca59523e4320af3de-1783734409488.jpeg
**Type:** `server/uploads/6a48efbca59523e4320af3de-1783734409488.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a623183b657d14788283ef2-1784820225170.jpeg
**Type:** `server/uploads/6a623183b657d14788283ef2-1784820225170.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a430e71cc22fa0ba8cd9bf2-1782780870794.jpeg
**Type:** `server/uploads/6a430e71cc22fa0ba8cd9bf2-1782780870794.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a66112c3ec6e8b0c371b2ee-1785081952981.jpeg
**Type:** `server/uploads/6a66112c3ec6e8b0c371b2ee-1785081952981.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a48efbca59523e4320af3de-1783802260622.PNG
**Type:** `server/uploads/6a48efbca59523e4320af3de-1783802260622.PNG`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0x89 in position 0: invalid start byte
```

### server/uploads/6a4411571c2a799a78c25800-1782846634456.jpeg
**Type:** `server/uploads/6a4411571c2a799a78c25800-1782846634456.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a48efbca59523e4320af3de-1783731192979.jpeg
**Type:** `server/uploads/6a48efbca59523e4320af3de-1783731192979.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a4555837bbec0828be32ba4-1782928862934.jpg
**Type:** `server/uploads/6a4555837bbec0828be32ba4-1782928862934.jpg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a593c388c736f3acc68af75-1784238254838.jpeg
**Type:** `server/uploads/6a593c388c736f3acc68af75-1784238254838.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a623183b657d14788283ef2-1784820218776.jpeg
**Type:** `server/uploads/6a623183b657d14788283ef2-1784820218776.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a43c1f6845ecc95f286ba22-1782826100751.jpeg
**Type:** `server/uploads/6a43c1f6845ecc95f286ba22-1782826100751.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5a082f3fd7b84692fe19d6-1784288580218.jpeg
**Type:** `server/uploads/6a5a082f3fd7b84692fe19d6-1784288580218.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5f7ca89c718d068b19a07b-1784646322412.jpeg
**Type:** `server/uploads/6a5f7ca89c718d068b19a07b-1784646322412.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a48efbca59523e4320af3de-1783731228653.jpeg
**Type:** `server/uploads/6a48efbca59523e4320af3de-1783731228653.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a430e71cc22fa0ba8cd9bf2-1782779562145.jpeg
**Type:** `server/uploads/6a430e71cc22fa0ba8cd9bf2-1782779562145.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5a1f2356a3b094257aefe1-1784291168966.jpg
**Type:** `server/uploads/6a5a1f2356a3b094257aefe1-1784291168966.jpg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5f7ca89c718d068b19a07b-1784646888474.jpeg
**Type:** `server/uploads/6a5f7ca89c718d068b19a07b-1784646888474.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a48efbca59523e4320af3de-1783802411232.jpg
**Type:** `server/uploads/6a48efbca59523e4320af3de-1783802411232.jpg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a518e4dfc61e77c18e5972b-1783729777642.jpeg
**Type:** `server/uploads/6a518e4dfc61e77c18e5972b-1783729777642.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a4411571c2a799a78c25800-1782846618494.jpeg
**Type:** `server/uploads/6a4411571c2a799a78c25800-1782846618494.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a593c388c736f3acc68af75-1784291024460.jpg
**Type:** `server/uploads/6a593c388c736f3acc68af75-1784291024460.jpg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a623183b657d14788283ef2-1784820318224.jpeg
**Type:** `server/uploads/6a623183b657d14788283ef2-1784820318224.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a4411571c2a799a78c25800-1782846892084.jpeg
**Type:** `server/uploads/6a4411571c2a799a78c25800-1782846892084.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a49106ea59523e4320af42b-1783732769948.jpeg
**Type:** `server/uploads/6a49106ea59523e4320af42b-1783732769948.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a4555837bbec0828be32ba4-1782928869644.jpg
**Type:** `server/uploads/6a4555837bbec0828be32ba4-1782928869644.jpg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a430e71cc22fa0ba8cd9bf2-1782780719134.jpeg
**Type:** `server/uploads/6a430e71cc22fa0ba8cd9bf2-1782780719134.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5f7ca89c718d068b19a07b-1784644470899.jpeg
**Type:** `server/uploads/6a5f7ca89c718d068b19a07b-1784644470899.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5a082f3fd7b84692fe19d6-1784288483560.jpeg
**Type:** `server/uploads/6a5a082f3fd7b84692fe19d6-1784288483560.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a430e71cc22fa0ba8cd9bf2-1782780993572.jpeg
**Type:** `server/uploads/6a430e71cc22fa0ba8cd9bf2-1782780993572.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a430e71cc22fa0ba8cd9bf2-1782779592516.jpeg
**Type:** `server/uploads/6a430e71cc22fa0ba8cd9bf2-1782779592516.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a593c388c736f3acc68af75-1784238221535.jpeg
**Type:** `server/uploads/6a593c388c736f3acc68af75-1784238221535.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5d39557402520cfa9a5270-1784494544732.jpeg
**Type:** `server/uploads/6a5d39557402520cfa9a5270-1784494544732.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5d632c0173438f2d01d3bc-1784505186303.jpeg
**Type:** `server/uploads/6a5d632c0173438f2d01d3bc-1784505186303.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a48efbca59523e4320af3de-1783802363161.jpg
**Type:** `server/uploads/6a48efbca59523e4320af3de-1783802363161.jpg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a623183b657d14788283ef2-1784820208281.jpeg
**Type:** `server/uploads/6a623183b657d14788283ef2-1784820208281.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a593c388c736f3acc68af75-1784291009905.jpg
**Type:** `server/uploads/6a593c388c736f3acc68af75-1784291009905.jpg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5a6cfb033b6b24855cf131-1784311080685.jpg
**Type:** `server/uploads/6a5a6cfb033b6b24855cf131-1784311080685.jpg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5a4e6c35edb414ff3d468a-1784303356061.png
**Type:** `server/uploads/6a5a4e6c35edb414ff3d468a-1784303356061.png`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0x89 in position 0: invalid start byte
```

### server/uploads/6a5a6cfb033b6b24855cf131-1784311087303.jpg
**Type:** `server/uploads/6a5a6cfb033b6b24855cf131-1784311087303.jpg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a4555837bbec0828be32ba4-1782928849142.jpg
**Type:** `server/uploads/6a4555837bbec0828be32ba4-1782928849142.jpg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a48efbca59523e4320af3de-1783802287623.JPG
**Type:** `server/uploads/6a48efbca59523e4320af3de-1783802287623.JPG`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5fa42bcd61c104a36aac03-1784653750697.jpeg
**Type:** `server/uploads/6a5fa42bcd61c104a36aac03-1784653750697.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5f7ca89c718d068b19a07b-1784646883649.jpeg
**Type:** `server/uploads/6a5f7ca89c718d068b19a07b-1784646883649.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a593c388c736f3acc68af75-1784238239975.jpeg
**Type:** `server/uploads/6a593c388c736f3acc68af75-1784238239975.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a662fcf3ec6e8b0c371b73e-1785081833923.jpeg
**Type:** `server/uploads/6a662fcf3ec6e8b0c371b73e-1785081833923.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a48efbca59523e4320af3de-1783734418289.jpeg
**Type:** `server/uploads/6a48efbca59523e4320af3de-1783734418289.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5a1f2356a3b094257aefe1-1784291246552.jpg
**Type:** `server/uploads/6a5a1f2356a3b094257aefe1-1784291246552.jpg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a662fcf3ec6e8b0c371b73e-1785081824288.jpeg
**Type:** `server/uploads/6a662fcf3ec6e8b0c371b73e-1785081824288.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a4555837bbec0828be32ba4-1782928839332.jpg
**Type:** `server/uploads/6a4555837bbec0828be32ba4-1782928839332.jpg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a43c1f6845ecc95f286ba22-1782826055514.jpeg
**Type:** `server/uploads/6a43c1f6845ecc95f286ba22-1782826055514.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a48efbca59523e4320af3de-1783731284275.jpeg
**Type:** `server/uploads/6a48efbca59523e4320af3de-1783731284275.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a65a6739b872e425f207e96-1785046899364.jpeg
**Type:** `server/uploads/6a65a6739b872e425f207e96-1785046899364.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a49106ea59523e4320af42b-1783732743713.jpeg
**Type:** `server/uploads/6a49106ea59523e4320af42b-1783732743713.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5b730e803fe247ebb92e19-1784378231476.jpeg
**Type:** `server/uploads/6a5b730e803fe247ebb92e19-1784378231476.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a430e71cc22fa0ba8cd9bf2-1782780025183.jpeg
**Type:** `server/uploads/6a430e71cc22fa0ba8cd9bf2-1782780025183.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a48efbca59523e4320af3de-1783802396090.jpg
**Type:** `server/uploads/6a48efbca59523e4320af3de-1783802396090.jpg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a4411571c2a799a78c25800-1782846435564.jpeg
**Type:** `server/uploads/6a4411571c2a799a78c25800-1782846435564.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a43c1f6845ecc95f286ba22-1782826018324.jpeg
**Type:** `server/uploads/6a43c1f6845ecc95f286ba22-1782826018324.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a4411571c2a799a78c25800-1782846909853.mov
**Type:** `server/uploads/6a4411571c2a799a78c25800-1782846909853.mov`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xc5 in position 23: invalid continuation byte
```

### server/uploads/6a5f7ca89c718d068b19a07b-1784646816457.jpeg
**Type:** `server/uploads/6a5f7ca89c718d068b19a07b-1784646816457.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a66112c3ec6e8b0c371b2ee-1785081962958.jpeg
**Type:** `server/uploads/6a66112c3ec6e8b0c371b2ee-1785081962958.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a623183b657d14788283ef2-1784820233853.jpeg
**Type:** `server/uploads/6a623183b657d14788283ef2-1784820233853.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5fa42bcd61c104a36aac03-1784653743426.jpeg
**Type:** `server/uploads/6a5fa42bcd61c104a36aac03-1784653743426.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5d632c0173438f2d01d3bc-1784505194869.jpeg
**Type:** `server/uploads/6a5d632c0173438f2d01d3bc-1784505194869.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5fa42bcd61c104a36aac03-1784653516531.jpeg
**Type:** `server/uploads/6a5fa42bcd61c104a36aac03-1784653516531.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5f7ca89c718d068b19a07b-1784644458098.jpeg
**Type:** `server/uploads/6a5f7ca89c718d068b19a07b-1784644458098.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a4411571c2a799a78c25800-1782846938265.jpeg
**Type:** `server/uploads/6a4411571c2a799a78c25800-1782846938265.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a48efbca59523e4320af3de-1783802246800.HEIC
**Type:** `server/uploads/6a48efbca59523e4320af3de-1783802246800.HEIC`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xd4 in position 1537: invalid continuation byte
```

### server/uploads/6a5d39557402520cfa9a5270-1784494538169.jpeg
**Type:** `server/uploads/6a5d39557402520cfa9a5270-1784494538169.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a430e71cc22fa0ba8cd9bf2-1782780270298.jpeg
**Type:** `server/uploads/6a430e71cc22fa0ba8cd9bf2-1782780270298.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a48efbca59523e4320af3de-1783731506046.jpeg
**Type:** `server/uploads/6a48efbca59523e4320af3de-1783731506046.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a43c1f6845ecc95f286ba22-1782826087333.jpeg
**Type:** `server/uploads/6a43c1f6845ecc95f286ba22-1782826087333.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5b730e803fe247ebb92e19-1784378270356.jpeg
**Type:** `server/uploads/6a5b730e803fe247ebb92e19-1784378270356.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a66112c3ec6e8b0c371b2ee-1785074664528.jpeg
**Type:** `server/uploads/6a66112c3ec6e8b0c371b2ee-1785074664528.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5a1f2356a3b094257aefe1-1784291227963.jpg
**Type:** `server/uploads/6a5a1f2356a3b094257aefe1-1784291227963.jpg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5d39557402520cfa9a5270-1784494505070.jpeg
**Type:** `server/uploads/6a5d39557402520cfa9a5270-1784494505070.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a593c388c736f3acc68af75-1784290971139.png
**Type:** `server/uploads/6a593c388c736f3acc68af75-1784290971139.png`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0x89 in position 0: invalid start byte
```

### server/uploads/6a623183b657d14788283ef2-1784820307648.jpeg
**Type:** `server/uploads/6a623183b657d14788283ef2-1784820307648.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5fa42bcd61c104a36aac03-1784653736013.jpeg
**Type:** `server/uploads/6a5fa42bcd61c104a36aac03-1784653736013.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a430e71cc22fa0ba8cd9bf2-1782779571863.jpeg
**Type:** `server/uploads/6a430e71cc22fa0ba8cd9bf2-1782779571863.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5a4e6c35edb414ff3d468a-1784303316618.jpeg
**Type:** `server/uploads/6a5a4e6c35edb414ff3d468a-1784303316618.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a66112c3ec6e8b0c371b2ee-1785076564182.jpeg
**Type:** `server/uploads/6a66112c3ec6e8b0c371b2ee-1785076564182.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5a082f3fd7b84692fe19d6-1784288565342.jpeg
**Type:** `server/uploads/6a5a082f3fd7b84692fe19d6-1784288565342.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a48efbca59523e4320af3de-1783731296757.jpeg
**Type:** `server/uploads/6a48efbca59523e4320af3de-1783731296757.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a623183b657d14788283ef2-1784820329156.jpeg
**Type:** `server/uploads/6a623183b657d14788283ef2-1784820329156.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a430e71cc22fa0ba8cd9bf2-1782779580806.jpeg
**Type:** `server/uploads/6a430e71cc22fa0ba8cd9bf2-1782779580806.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5a6cfb033b6b24855cf131-1784311065922.jpg
**Type:** `server/uploads/6a5a6cfb033b6b24855cf131-1784311065922.jpg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a66112c3ec6e8b0c371b2ee-1785076581475.jpeg
**Type:** `server/uploads/6a66112c3ec6e8b0c371b2ee-1785076581475.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a4563a4a9468658d2f6e7fe-1782932439387.PNG
**Type:** `server/uploads/6a4563a4a9468658d2f6e7fe-1782932439387.PNG`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0x89 in position 0: invalid start byte
```

### server/uploads/6a430e71cc22fa0ba8cd9bf2-1782780510179.jpeg
**Type:** `server/uploads/6a430e71cc22fa0ba8cd9bf2-1782780510179.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5a4e6c35edb414ff3d468a-1784303372884.jpeg
**Type:** `server/uploads/6a5a4e6c35edb414ff3d468a-1784303372884.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a49106ea59523e4320af42b-1783732811574.jpeg
**Type:** `server/uploads/6a49106ea59523e4320af42b-1783732811574.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5a4e6c35edb414ff3d468a-1784303340268.png
**Type:** `server/uploads/6a5a4e6c35edb414ff3d468a-1784303340268.png`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0x89 in position 0: invalid start byte
```

### server/uploads/6a5ed9762ab1b9a20425858b-1784602305906.jpeg
**Type:** `server/uploads/6a5ed9762ab1b9a20425858b-1784602305906.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a4411571c2a799a78c25800-1782846650125.jpeg
**Type:** `server/uploads/6a4411571c2a799a78c25800-1782846650125.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a430e71cc22fa0ba8cd9bf2-1782779926384.jpeg
**Type:** `server/uploads/6a430e71cc22fa0ba8cd9bf2-1782779926384.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a66112c3ec6e8b0c371b2ee-1785076573172.jpeg
**Type:** `server/uploads/6a66112c3ec6e8b0c371b2ee-1785076573172.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a49106ea59523e4320af42b-1783732763068.jpeg
**Type:** `server/uploads/6a49106ea59523e4320af42b-1783732763068.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a65a6739b872e425f207e96-1785046726987.jpeg
**Type:** `server/uploads/6a65a6739b872e425f207e96-1785046726987.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a4563a4a9468658d2f6e7fe-1782932447850.jpg
**Type:** `server/uploads/6a4563a4a9468658d2f6e7fe-1782932447850.jpg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5b730e803fe247ebb92e19-1784378285441.png
**Type:** `server/uploads/6a5b730e803fe247ebb92e19-1784378285441.png`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0x89 in position 0: invalid start byte
```

### server/uploads/6a5d39557402520cfa9a5270-1784494514811.jpeg
**Type:** `server/uploads/6a5d39557402520cfa9a5270-1784494514811.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5f7ca89c718d068b19a07b-1784646352488.jpeg
**Type:** `server/uploads/6a5f7ca89c718d068b19a07b-1784646352488.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5f7ca89c718d068b19a07b-1784644444992.jpeg
**Type:** `server/uploads/6a5f7ca89c718d068b19a07b-1784644444992.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/utils/queue.js
**Type:** Client Source: queue
**Size:** 15 lines (14 non-empty)

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

### server/utils/asyncHandler.js
**Type:** Client Source: asyncHandler
**Size:** 7 lines (7 non-empty)

```
/**
 * Wraps an async Express route handler so rejected promises
 * are forwarded to the next() error handler instead of crashing.
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

```

### server/utils/push.js
**Type:** Client Source: push
**Size:** 46 lines (40 non-empty)

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

### server/utils/AppError.js
**Type:** Client Source: AppError
**Size:** 9 lines (9 non-empty)

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

### server/utils/email.js
**Type:** Client Source: email
**Size:** 51 lines (45 non-empty)

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

### server/models/OTP.js
**Type:** Server Data Models: OTP
**Size:** 34 lines (31 non-empty)

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

### server/models/Notification.js
**Type:** Server Data Models: Notification
**Size:** 50 lines (46 non-empty)

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

### server/models/Setting.js
**Type:** Server Data Models: Setting
**Size:** 19 lines (17 non-empty)

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

### server/models/Message.js
**Type:** Server Data Models: Message
**Size:** 80 lines (76 non-empty)

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

### server/models/User.js
**Type:** Server Data Models: User
**Size:** 172 lines (169 non-empty)

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
...

(Showing first 2000 chars of 172 total lines)
```

### server/models/Interaction.js
**Type:** Server Data Models: Interaction
**Size:** 51 lines (48 non-empty)

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

### server/models/Block.js
**Type:** Server Data Models: Block
**Size:** 12 lines (9 non-empty)

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

### server/models/Analytics.js
**Type:** Server Data Models: Analytics
**Size:** 25 lines (23 non-empty)

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

### server/models/Match.js
**Type:** Server Data Models: Match
**Size:** 37 lines (34 non-empty)

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

### server/models/Report.js
**Type:** Server Data Models: Report
**Size:** 27 lines (23 non-empty)

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

### server/routes/discover.js
**Type:** API RoutesDiscover
**Size:** 398 lines (349 non-empty)

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
import { body } from 'express-validator';
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
        { actorId: currentUser._id, targetI...

(Showing first 2000 chars of 398 total lines)
```

### server/routes/matches.js
**Type:** API RoutesMatches
**Size:** 239 lines (214 non-empty)

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
            { $project: { name: 1, photos: 1, branch: 1, year: 1, lastActive: 1, gender: 1, hostel: 1, bio: 1, prompts: 1, intent: 1, interests: 1 } }
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
            { $sort: { createdAt: -1...

(Showing first 2000 chars of 239 total lines)
```

### server/routes/auth.js
**Type:** API RoutesAuth
**Size:** 224 lines (194 non-empty)

```
import express from 'express';
import { body } from 'express-validator';
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
      // Rate limiting:...

(Showing first 2000 chars of 224 total lines)
```

### server/routes/users.js
**Type:** API RoutesUsers
**Size:** 344 lines (299 non-empty)

```
import express from 'express';
import { body } from 'express-validator';
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
  }...

(Showing first 2000 chars of 344 total lines)
```

### server/routes/upload.js
**Type:** API RoutesUpload
**Size:** 77 lines (65 non-empty)

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

### server/routes/config.js
**Type:** API RoutesConfig
**Size:** 45 lines (40 non-empty)

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

### server/routes/report.js
**Type:** API RoutesReport
**Size:** 198 lines (173 non-empty)

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
      await reported.save();
    } else if (reportCount >= 5) {
      reported.suspended = true;
      reported.suspendedAt = new Date();
      reported.suspendedReason = 'Multiple community reports';
      reported.isGhost...

(Showing first 2000 chars of 198 total lines)
```

### server/routes/notifications.js
**Type:** API RoutesNotifications
**Size:** 287 lines (258 non-empty)

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
router.get('/unread-count', protect, async (req,...

(Showing first 2000 chars of 287 total lines)
```

### server/routes/messages.js
**Type:** API RoutesMessages
**Size:** 233 lines (191 non-empty)

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
      nextCursor,...

(Showing first 2000 chars of 233 total lines)
```

### server/socket/chat.js
**Type:** Client Source: chat
**Size:** 187 lines (162 non-empty)

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
  io.use(async (socket, next) => {
    try {
      // Try httpOnly cookie first, fall back to auth token payload
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

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    // Join the user's personal room so targeted emits (e.g. 'new-letter') reach them
    socket.join(userId);
    console.log(`User connected: ${socket.user.name} (${userId})`);

    // Multi-device support: track all socket IDs per user
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(...

(Showing first 2000 chars of 187 total lines)
```
