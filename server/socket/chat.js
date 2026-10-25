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
