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
