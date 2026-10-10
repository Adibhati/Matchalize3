/**
 * 📏 PROMPT LENGTH LIMITS
 *
 * Single source of truth on the client for the prompt question/answer caps.
 *
 * ⚠️ Must stay in sync with:
 *   - PROMPT_LIMITS in server/routes/users.js  (returns a legible 400)
 *   - prompts[].maxlength in server/models/User.js  (schema backstop)
 *
 * The textarea `maxLength` alone isn't enough — a client can always be bypassed,
 * which is why the server enforces the same numbers and rejects with 400 rather
 * than letting a Mongoose ValidationError become a 500.
 *
 * 300 is ~3x the longest prompt answer ever written in practice (97 chars across
 * 382 seeded answers) and renders as ~3 lines on a profile card.
 */
export const PROMPT_ANSWER_MAX = 300;
export const PROMPT_QUESTION_MAX = 200;