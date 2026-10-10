import { body, validationResult } from 'express-validator';

export { body };

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const list = errors.array();
    // `message` is what the client's api.js reads (and toasts). Without it the
    // user only ever saw the generic fallback instead of the real validator text
    // ("Please enter a valid email address", "Name is required", …).
    return res.status(400).json({ message: list[0]?.msg, errors: list });
  }
  next();
};
