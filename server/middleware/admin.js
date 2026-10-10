import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { APP_CONSTANTS } from '../config/appData.js';

const COOKIE_NAME = APP_CONSTANTS.AUTH_COOKIE_NAME;

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
    // No .lean(): req.user is a full mongoose doc, so any future code that
    // saves it works instead of throwing. (Nothing saves it today — cleanup only.)
    const user = await User.findById(decoded.id).select('email name suspended isDeleted');

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
