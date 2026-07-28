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