import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { APP_CONSTANTS } from '../config/appData.js';

const COOKIE_NAME = APP_CONSTANTS.AUTH_COOKIE_NAME;
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
    sameSite: 'lax', // 'lax' allows cookies on top-level navigation (push notifications, shared links)
                     // while still blocking cross-site POST/PUT/DELETE (CSRF protection)
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
    sameSite: 'lax', // Must match setAuthCookie for the browser to recognize the cookie
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

    /* ⚠️ `intent` IS IN THIS LIST BECAUSE routes/discover.js READS IT OFF
       `req.user`, AND IT WAS MISSING FOR A LONG TIME.

       The deck ranks by `_intentMatch`, computed from the intersection of the
       viewer's intent and each candidate's. With `intent` absent from this
       projection, `currentUser.intent` was `undefined`, `myIntent` collapsed to
       `[]`, and the expression short-circuited to a constant `0`. The sort key
       still existed and still looked correct in the pipeline — it just never
       varied. Intent ranking was inert: no error, no warning, plausible-looking
       code.

       The lesson worth keeping: a ranking key that is CONSTANT still sorts
       successfully. Assert that a signal CHANGES the order, not merely that it
       compiles. Tests here now fail if a matched-intent card and an unmatched
       one can come back in either order.

       `+currentLatLng +locationSource +locationUpdatedAt` are additive to the
       schema's `select: false`, which exists to keep this sensitive pair out of
       any query that did not ask for it by name.

       This query IS one that needs it: the deck ranks by distance between the
       viewer and each candidate, so the viewer's own position has to be
       available on `req.user` or every card would compute as unknown-distance
       and sort last. Additive selection (`+field`) is required — listing them
       plainly would silently drop the fields already chosen above.

       These are named here and nowhere else. Do NOT add them to CARD_FIELDS in
       utils/publicCard.js; that is the projection every OTHER user sees, and
       this pair must never travel in it. */
    req.user = await User.findById(decoded.id).select('name suspended isDeleted lastLogoutAt collegeCode interestedIn interests gender intent +currentLatLng +locationSource +locationUpdatedAt');

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
    }

    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};
