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
