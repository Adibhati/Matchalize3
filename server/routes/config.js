import express from 'express';
import Setting from '../models/Setting.js';
import {
  PROMPT_BANK, BRANCHES, YEARS, GENDERS, INTENTS, INTEREST_TAGS,
  PRONOUNS_OPTIONS, INTEREST_ICONS, INTEREST_ICON_FALLBACKS, APP_CONSTANTS,
} from '../config/appData.js';
import { LADDER } from '../utils/ladder.js';
import { collegeGateFilter } from '../utils/campusGate.js';
import College from '../models/College.js';

const router = express.Router();

// ─── IN-MEMORY TTL CACHE ───
// Config changes rarely, but this endpoint is hit on EVERY app load.
// Cache for 30s so simultaneous launches produce ONE DB query, not one per user.
const CACHE_TTL_MS = 30 * 1000;
let configCache = null;
let cacheExpiresAt = 0;

router.get('/', async (req, res) => {
  try {
    // 🏫 COLLEGES ARE ALWAYS FETCHED FRESH — deliberately outside the cache.
    //
    // This must happen before the cache short-circuit below. An operator who
    // just added a campus and then saw it missing from their own picker would
    // reasonably assume the Add button is broken. One small indexed query on a
    // handful of college rows is not worth a stale picker.
    //
    // Only ACTIVE colleges: deactivating one removes it from signup immediately,
    // while students who already verified through it are untouched.
    //
    // AND only gated-in ones. A campus outside ALLOWED_COLLEGES cannot sign up
    // (routes/auth.js resolveCollege refuses it), so listing it here would show
    // a student a selectable option that is guaranteed to fail at the email
    // step — the worst place to discover a closed door.
    const colleges = await College.find({ active: true, ...collegeGateFilter() }).sort({ name: 1 }).lean();
    const collegeList = colleges.map((c) => ({
      code: c.code,
      name: c.name,
      // Public campus information — it has to be exposed for the pre-filled
      // email suffix to work. It contains no student data whatsoever.
      domains: c.domains,
      city: c.city,
      state: c.state,
      country: c.country,
    }));

    // Serve the static remainder from cache if fresh
    if (configCache && Date.now() < cacheExpiresAt) {
      res.set('Cache-Control', 'public, max-age=30');
      return res.json({ ...configCache, colleges: collegeList });
    }

    // Check database for dynamic settings first
    const dbSetting = await Setting.findOne({ key: 'appConfig' });
    let payload;
    if (dbSetting) {
      payload = dbSetting.value;
    } else {
      // Fallback to static file if DB is empty
      payload = {
        prompts: PROMPT_BANK,
        branches: BRANCHES,
        years: YEARS,
        genders: GENDERS,
        intents: INTENTS,
        interests: INTEREST_TAGS,
        pronouns: PRONOUNS_OPTIONS,
        interestIcons: INTEREST_ICONS,
        interestIconFallbacks: INTEREST_ICON_FALLBACKS,
        // `colleges` is attached from the DB after this object is built — it is
        // no longer sourced from COLLEGE_MAP in appData.js. That constant
        // survives only as the seed in scripts/reset-colleges.mjs.
        constants: APP_CONSTANTS,
        splash: {
          videoUrl: process.env.SPLASH_VIDEO_URL || '/lover.mp4',
          tagline: process.env.SPLASH_TAGLINE || 'Your Campus. Your Story.',
        },
      };
    }

    // The ladder is attached AFTER the source is resolved, never inside either
    // branch. A stored `appConfig` document in the DB is an admin-authored
    // snapshot taken before the ladder existed, so if this were set in the
    // static fallback only, the thresholds would silently vanish from the
    // client the moment anyone saved that setting — and the gate would then
    // hardcode its own numbers instead of reading LADDER.interact.
    payload = { ...payload, ladder: LADDER };

    // Colleges were already fetched above, outside the cache. Attached here so
    // both the cached and uncached response paths carry the same fresh list.
    payload = { ...payload, ladder: LADDER, colleges: collegeList };

    configCache = payload;
    cacheExpiresAt = Date.now() + CACHE_TTL_MS;
    res.set('Cache-Control', 'public, max-age=30');
    res.json(payload);
  } catch (error) {
    console.error('Config route error:', error);
    res.status(500).json({ message: 'Server error fetching config' });
  }
});

export default router;